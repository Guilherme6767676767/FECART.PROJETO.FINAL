"""Integrações opcionais de dados externos para o backend FastAPI.

Este módulo mantém o backend funcional sem chaves pagas. O clima usa
Open-Meteo; trânsito, acidentes e criminalidade retornam um estado explícito
de "não configurado" quando não há fonte externa definida.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app_config import settings

SP_LAT, SP_LON = -23.5505, -46.6333


class LiveDataService:
    def __init__(self) -> None:
        self._weather_cache: dict[str, Any] = {}

    async def weather(self, lat: float = SP_LAT, lon: float = SP_LON) -> dict[str, Any]:
        key = f"{lat:.4f}:{lon:.4f}"
        if key in self._weather_cache:
            return self._weather_cache[key]

        params = {
            "latitude": lat,
            "longitude": lon,
            "timezone": "America/Sao_Paulo",
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
            "hourly": "precipitation_probability,thunderstorm_probability",
            "forecast_days": 2,
        }
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT_SECONDS) as client:
            response = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            response.raise_for_status()
            data = response.json()

        current = data.get("current", {})
        hourly = data.get("hourly", {})
        thunder = (hourly.get("thunderstorm_probability") or [0])[0] or 0
        rain_probability = (hourly.get("precipitation_probability") or [0])[0] or 0
        code = current.get("weather_code")
        observed_at = datetime.now(timezone.utc).isoformat()
        result = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "fonte": "open-meteo",
                    "observado_em": observed_at,
                    "temperatura_c": current.get("temperature_2m"),
                    "umidade_percentual": current.get("relative_humidity_2m"),
                    "precipitacao_mm": current.get("precipitation"),
                    "probabilidade_chuva_percentual": rain_probability,
                    "probabilidade_tempestade_percentual": thunder,
                    "alerta_tempestade": bool(thunder >= settings.STORM_ALERT_THRESHOLD or code in {95, 96, 99}),
                    "codigo_wmo": code,
                    "vento_kmh": current.get("wind_speed_10m"),
                },
            }],
            "metadata": {"timezone": data.get("timezone"), "unidade": data.get("current_units", {})},
        }
        self._weather_cache[key] = result
        return result

    async def traffic(self, lat: float = SP_LAT, lon: float = SP_LON) -> dict[str, Any]:
        if not settings.TOMTOM_API_KEY:
            return self._empty("TomTom não configurado; defina TOMTOM_API_KEY")
        return self._empty("Integração TomTom será ativada quando a chave for configurada")

    async def accidents(self, limit: int = 100) -> dict[str, Any]:
        if not settings.GEOSAMPA_ACCIDENTS_URL:
            return self._empty("GeoSampa não configurado; defina GEOSAMPA_ACCIDENTS_URL")
        return self._empty("Fonte GeoSampa configurada, mas ainda não normalizada neste backend")

    async def crime_risk(self, limit: int = 100000) -> dict[str, Any]:
        if not settings.SSP_CRIME_DATA_URL:
            return {"type": "FeatureCollection", "features": [], "metadata": {
                "fonte": "SSP-SP", "configurado": False,
                "mensagem": "Defina SSP_CRIME_DATA_URL com o CSV/XLSX oficial."
            }}
        return self._empty("Fonte SSP-SP configurada, mas ainda não normalizada neste backend")

    async def alerts(self, start=None, end=None) -> list[dict[str, Any]]:
        try:
            weather = await self.weather()
        except (httpx.HTTPError, ValueError) as exc:
            return [{
                "id": "weather-unavailable",
                "tipo": "sistema",
                "severidade": "low",
                "titulo": "Dados meteorológicos indisponíveis",
                "descricao": "Open-Meteo não respondeu; o sistema segue em modo offline.",
                "criado_em": datetime.now(timezone.utc).isoformat(),
                "fonte": "fallback-local",
                "erro_tecnico": type(exc).__name__,
            }]
        properties = weather["features"][0]["properties"]
        now = datetime.now(timezone.utc).isoformat()
        if not (properties.get("alerta_tempestade") or properties.get("probabilidade_chuva_percentual", 0) >= 70):
            return []
        return [{
            "id": "weather-sp",
            "tipo": "clima",
            "severidade": "high" if properties.get("alerta_tempestade") else "medium",
            "titulo": "Alerta meteorológico em São Paulo",
            "descricao": f"Chuva: {properties.get('probabilidade_chuva_percentual', 0)}%",
            "latitude": SP_LAT,
            "longitude": SP_LON,
            "criado_em": now,
            "fonte": "open-meteo",
        }]

    @staticmethod
    def _empty(message: str) -> dict[str, Any]:
        return {"type": "FeatureCollection", "features": [], "metadata": {
            "configurado": False, "mensagem": message
        }}


live_data_service = LiveDataService()
