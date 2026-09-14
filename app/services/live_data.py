"""Integrações resilientes com Open-Meteo, GeoSampa e SSP-SP."""
from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import math
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import httpx
try:
    from cachetools import TTLCache
except ImportError:  # fallback para execução mínima antes do pip install
    class TTLCache(dict):
        def __init__(self, maxsize: int = 128, ttl: int = 600):
            super().__init__()
            self.ttl = ttl

from ..config import settings

log = logging.getLogger(__name__)
SP_LAT, SP_LON = -23.5505, -46.6333


class ExternalServiceError(RuntimeError):
    pass


class LiveDataService:
    """Cliente com timeout, retry e cache local; Redis pode substituir o cache em produção."""

    def __init__(self) -> None:
        self.cache: TTLCache[str, Any] = TTLCache(maxsize=128, ttl=600)

    async def _get_json(self, url: str, params: dict[str, Any] | None = None) -> Any:
        last: Exception | None = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT_SECONDS) as client:
                    response = await client.get(url, params=params, follow_redirects=True)
                    if response.status_code in {429, 500, 502, 503, 504} and attempt < 2:
                        await asyncio.sleep(0.25 * (2**attempt))
                        continue
                    response.raise_for_status()
                    return response.json()
            except (httpx.HTTPError, ValueError) as exc:
                last = exc
                log.warning("fonte externa indisponível: %s", exc)
        raise ExternalServiceError(f"Falha ao consultar fonte externa: {url}") from last

    async def _get_bytes(self, url: str) -> bytes:
        try:
            async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT_SECONDS) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"Falha ao baixar fonte externa: {url}") from exc

    async def weather(self, lat: float = SP_LAT, lon: float = SP_LON) -> dict[str, Any]:
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("coordenadas fora do intervalo WGS84")
        key = f"weather:{lat:.4f}:{lon:.4f}"
        if key in self.cache:
            return self.cache[key]
        data = await self._get_json("https://api.open-meteo.com/v1/forecast", {
            "latitude": lat, "longitude": lon, "timezone": "America/Sao_Paulo",
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
            "hourly": "precipitation_probability,thunderstorm_probability,weather_code",
            "forecast_days": 2,
        })
        current, hourly = data.get("current", {}), data.get("hourly", {})
        thunder = (hourly.get("thunderstorm_probability") or [None])[0]
        rain_probability = (hourly.get("precipitation_probability") or [None])[0]
        code = current.get("weather_code")
        result = {"type": "FeatureCollection", "features": [{
            "type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "fonte": "open-meteo", "observado_em": datetime.now(timezone.utc).isoformat(),
                "temperatura_c": current.get("temperature_2m"), "umidade_percentual": current.get("relative_humidity_2m"),
                "precipitacao_mm": current.get("precipitation"), "probabilidade_chuva_percentual": rain_probability,
                "probabilidade_tempestade_percentual": thunder,
                "alerta_tempestade": bool((thunder or 0) >= settings.STORM_ALERT_THRESHOLD or code in {95, 96, 99}),
                "codigo_wmo": code, "vento_kmh": current.get("wind_speed_10m"),
            },
        }], "metadata": {"timezone": data.get("timezone"), "unidade": data.get("current_units", {})}}
        self.cache[key] = result
        return result

    async def accidents(self, limit: int = 5000) -> dict[str, Any]:
        url = settings.GEOSAMPA_ACCIDENTS_URL
        if not url:
            return self._empty("GeoSampa não configurado; defina GEOSAMPA_ACCIDENTS_URL")
        key = f"accidents:{url}:{limit}"
        if key in self.cache:
            return self.cache[key]
        content = await self._get_bytes(url)
        try:
            result = self._normalize_geojson(json.loads(content.decode("utf-8-sig")), limit)
        except (json.JSONDecodeError, UnicodeDecodeError):
            result = self._csv_accidents(content, limit)
        result["metadata"] = {"fonte": "GeoSampa/INFOCRIM", "fonte_url": url, "atualizado_em": datetime.now(timezone.utc).isoformat()}
        self.cache[key] = result
        return result

    async def traffic(self, lat: float = SP_LAT, lon: float = SP_LON) -> dict[str, Any]:
        """Obtém o segmento viário mais próximo via TomTom Traffic Flow."""
        if not settings.TOMTOM_API_KEY:
            return self._empty("TomTom não configurado; defina TOMTOM_API_KEY")
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("coordenadas fora do intervalo WGS84")
        key = f"traffic:{lat:.4f}:{lon:.4f}"
        if key in self.cache:
            return self.cache[key]
        data = await self._get_json(
            "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json",
            {"key": settings.TOMTOM_API_KEY, "point": f"{lat},{lon}", "unit": "KMPH"},
        )
        flow = data.get("flowSegmentData", {})
        coords = flow.get("coordinates", {}).get("coordinate", [])
        line = [[p.get("longitude"), p.get("latitude")] for p in coords if p.get("longitude") is not None and p.get("latitude") is not None]
        geometry = {"type": "LineString", "coordinates": line} if len(line) >= 2 else {"type": "Point", "coordinates": [lon, lat]}
        current, free = flow.get("currentSpeed"), flow.get("freeFlowSpeed")
        ratio = (current / free) if current is not None and free else None
        result = {"type": "FeatureCollection", "features": [{
            "type": "Feature", "geometry": geometry, "properties": {
                "fonte": "tomtom-traffic-flow", "observado_em": datetime.now(timezone.utc).isoformat(),
                "velocidade_atual_kmh": current, "velocidade_livre_kmh": free,
                "tempo_atual_segundos": flow.get("currentTravelTime"), "tempo_livre_segundos": flow.get("freeFlowTravelTime"),
                "confianca": flow.get("confidence"), "via_fechada": flow.get("roadClosure"),
                "indice_congestionamento": round(1 - ratio, 3) if ratio is not None else None,
            },
        }], "metadata": {"fonte_url": "https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/traffic-flow/flow-segment-data"}}
        self.cache[key] = result
        return result

    @staticmethod
    def _normalize_geojson(data: dict[str, Any], limit: int) -> dict[str, Any]:
        features = []
        for item in data.get("features", [])[:limit]:
            geom = item.get("geometry") or {}
            if geom.get("type") == "Point" and len(geom.get("coordinates", [])) >= 2:
                features.append({"type": "Feature", "geometry": geom, "properties": item.get("properties") or {}})
        return {"type": "FeatureCollection", "features": features}

    def _csv_accidents(self, content: bytes, limit: int) -> dict[str, Any]:
        rows = csv.DictReader(io.StringIO(content.decode("utf-8-sig", errors="replace")), delimiter=";")
        features = []
        for row in list(rows)[:limit]:
            lat, lon = self._number(row, ["latitude", "lat", "y"]), self._number(row, ["longitude", "lon", "lng", "x"])
            if lat is not None and lon is not None:
                features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": row})
        return {"type": "FeatureCollection", "features": features}

    async def crime_risk(self, limit: int = 100000) -> dict[str, Any]:
        url = settings.SSP_CRIME_DATA_URL
        if not url:
            return {"type": "FeatureCollection", "features": [], "metadata": {"fonte": "SSP-SP", "configurado": False, "mensagem": "Defina SSP_CRIME_DATA_URL com o CSV/XLSX oficial."}}
        key = f"crime:{url}:{settings.SSP_DISTRICTS_GEOJSON_URL}"
        if key in self.cache:
            return self.cache[key]
        rows = self._read_table(await self._get_bytes(url), url)
        aggregates: dict[str, dict[str, int]] = defaultdict(lambda: {"roubos": 0, "furtos": 0})
        for row in rows[:limit]:
            area = self._text(row, ["distrito", "distrito policial", "bairro", "unidade", "nome_distrito"]) or "Não informado"
            aggregates[area]["roubos"] += self._integer(row, ["roubo", "roubos", "total roubo", "roubo outros"])
            aggregates[area]["furtos"] += self._integer(row, ["furto", "furtos", "total furto", "furto outros"])
        totals = [v["roubos"] + v["furtos"] for v in aggregates.values()]
        polygons = await self._get_json(settings.SSP_DISTRICTS_GEOJSON_URL) if settings.SSP_DISTRICTS_GEOJSON_URL else {"features": []}
        features = []
        for polygon in polygons.get("features", []):
            props = polygon.get("properties") or {}
            name = self._text(props, ["nome", "name", "distrito", "ds_nome"]) or "Não informado"
            stats = aggregates.get(name, {"roubos": 0, "furtos": 0})
            count = stats["roubos"] + stats["furtos"]
            features.append({"type": "Feature", "geometry": polygon.get("geometry"), "properties": {**props, **stats, "total_ocorrencias": count, "faixa_risco": self._risk_band(count, totals)}})
        result = {"type": "FeatureCollection", "features": features, "metadata": {"fonte": "SSP-SP", "fonte_url": url, "agregado_por": "distrito/bairro", "metodo": "tercis do volume observado"}}
        self.cache[key] = result
        return result

    async def alerts(self, start: datetime | None = None, end: datetime | None = None) -> list[dict[str, Any]]:
        """Consolida sinais reais em alertas prontos para o frontend."""
        results = await asyncio.gather(
            self.weather(), self.traffic(), self.accidents(100), self.crime_risk(100000),
            return_exceptions=True,
        )
        weather, traffic, accidents, crime = results
        alerts: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc).isoformat()

        def in_period(value: str | None) -> bool:
            if not start and not end:
                return True
            if not value:
                return False
            try:
                moment = datetime.fromisoformat(value.replace("Z", "+00:00"))
                if moment.tzinfo is None:
                    moment = moment.replace(tzinfo=timezone.utc)
                return (not start or moment >= start) and (not end or moment <= end)
            except ValueError:
                return False

        if isinstance(weather, dict) and weather.get("features") and in_period(now):
            p = weather["features"][0]["properties"]
            if p.get("alerta_tempestade") or (p.get("probabilidade_chuva_percentual") or 0) >= 70:
                alerts.append({"id": "weather-sp", "tipo": "clima", "severidade": "high" if p.get("alerta_tempestade") else "medium", "titulo": "Alerta meteorológico em São Paulo", "descricao": f"Chuva: {p.get('probabilidade_chuva_percentual') or 0}% | Tempestade: {p.get('probabilidade_tempestade_percentual') or 0}%", "latitude": SP_LAT, "longitude": SP_LON, "criado_em": now, "fonte": "open-meteo"})

        if isinstance(traffic, dict) and in_period(now):
            for feature in traffic.get("features", []):
                p = feature.get("properties", {}); idx = p.get("indice_congestionamento")
                if idx is not None and idx >= 0.45:
                    coords = feature.get("geometry", {}).get("coordinates", [[SP_LON, SP_LAT]])
                    point = coords[0] if feature.get("geometry", {}).get("type") == "LineString" else coords
                    alerts.append({"id": "traffic-sp", "tipo": "transito", "severidade": "high" if idx >= .7 else "medium", "titulo": "Congestionamento detectado", "descricao": f"Velocidade {p.get('velocidade_atual_kmh')} km/h; índice {round(idx * 100)}%", "longitude": point[0], "latitude": point[1], "criado_em": now, "fonte": "tomtom-traffic-flow"})

        if isinstance(accidents, dict):
            for index, feature in enumerate(accidents.get("features", [])):
                coords = feature.get("geometry", {}).get("coordinates", [])
                props = feature.get("properties", {})
                occurred_at = self._event_datetime(props) or now
                if len(coords) >= 2 and in_period(occurred_at):
                    alerts.append({"id": f"accident-{index}", "tipo": "acidente", "severidade": "high", "titulo": "Acidente de trânsito registrado", "descricao": "Ocorrência georreferenciada no GeoSampa/INFOCRIM", "longitude": coords[0], "latitude": coords[1], "criado_em": occurred_at, "fonte": "geosampa-infocrim", "dados": props})

        if isinstance(crime, dict) and not (start or end):
            for feature in crime.get("features", []):
                p = feature.get("properties", {})
                if p.get("faixa_risco") in {"Alto", "Médio"}:
                    alerts.append({"id": f"crime-{p.get('distrito') or p.get('nome') or len(alerts)}", "tipo": "seguranca", "severidade": "high" if p.get("faixa_risco") == "Alto" else "medium", "titulo": f"Área de risco: {p.get('faixa_risco')}", "descricao": f"Roubos: {p.get('roubos', 0)} | Furtos: {p.get('furtos', 0)}", "criado_em": now, "fonte": "ssp-sp"})
        return alerts

    @staticmethod
    def _event_datetime(properties: dict[str, Any]) -> str | None:
        """Localiza data/hora em schemas diferentes dos arquivos GeoSampa."""
        names = ("data_hora", "datahora", "data_ocorrencia", "data do acidente", "dt_ocorrencia", "data")
        normalized = {re.sub(r"[^a-z0-9]", "", str(k).lower()): v for k, v in properties.items()}
        for name in names:
            value = normalized.get(re.sub(r"[^a-z0-9]", "", name))
            if value not in (None, ""):
                raw = str(value).strip()
                try:
                    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
                        return f"{raw}T00:00:00+00:00"
                    return datetime.fromisoformat(raw.replace("Z", "+00:00")).isoformat()
                except ValueError:
                    continue
        return None

    @staticmethod
    def _risk_band(value: int, values: list[int]) -> str:
        if not values or max(values) == 0:
            return "Baixo"
        ordered = sorted(values); p33 = ordered[min(len(ordered) - 1, math.floor(len(ordered) * .33))]; p66 = ordered[min(len(ordered) - 1, math.floor(len(ordered) * .66))]
        return "Alto" if value >= p66 else "Médio" if value >= p33 else "Baixo"

    def _read_table(self, content: bytes, url: str) -> list[dict[str, Any]]:
        if url.lower().endswith((".xlsx", ".xls")):
            try:
                from openpyxl import load_workbook
                rows = list(load_workbook(io.BytesIO(content), read_only=True, data_only=True).active.values)
                return [dict(zip([str(v or "") for v in rows[0]], row)) for row in rows[1:]]
            except Exception as exc:
                raise ExternalServiceError("Instale openpyxl para ler planilha SSP") from exc
        return list(csv.DictReader(io.StringIO(content.decode("utf-8-sig", errors="replace")), delimiter=","))

    @staticmethod
    def _text(row: dict[str, Any], names: list[str]) -> str | None:
        normalized = {re.sub(r"[^a-z0-9]", "", str(k).lower()): v for k, v in row.items()}
        for name in names:
            value = normalized.get(re.sub(r"[^a-z0-9]", "", name.lower()))
            if value not in (None, ""):
                return str(value).strip()
        return None

    def _integer(self, row: dict[str, Any], names: list[str]) -> int:
        value = self._text(row, names)
        if not value: return 0
        try: return int(float(value.replace(".", "").replace(",", ".")))
        except ValueError: return 0

    def _number(self, row: dict[str, Any], names: list[str]) -> float | None:
        value = self._text(row, names)
        try: return float(value.replace(",", ".")) if value else None
        except ValueError: return None

    @staticmethod
    def _empty(message: str) -> dict[str, Any]:
        return {"type": "FeatureCollection", "features": [], "metadata": {"configurado": False, "mensagem": message}}


live_data_service = LiveDataService()
