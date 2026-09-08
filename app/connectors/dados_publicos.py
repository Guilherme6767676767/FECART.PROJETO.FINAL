import csv
import json
import logging
try:
    import structlog
except ImportError:
    import logging as structlog
    structlog.get_logger = lambda: logging.getLogger(__name__)
import httpx
from datetime import datetime
from typing import Dict, List

from .base import BaseConnector
from ..models.evento import EventoUrbano
from ..config import settings

log = structlog.get_logger()

class DadosPublicosConnector(BaseConnector):
    source_name = "dados_publicos"
    cache_ttl = 3600  # 1 hour

    async def fetch(self, params: Dict) -> List[EventoUrbano]:
        cidade = params.get("cidade")
        if not cidade:
            raise ValueError("cidade is required")

        cache_key = f"dados_publicos:{cidade}".lower()
        cached = await self._cache_get(cache_key)
        if cached:
            return [EventoUrbano(**e) for e in cached]

        # Example CKAN dataset URL (public API) – using dados.gov.br catalog
        # We'll search for resources matching the city name.
        base_url = "https://dados.gov.br/api/3/action/package_search"
        query = {"q": cidade, "rows": 5}
        data = await self._request("GET", base_url, params=query)
        results = []
        for result in data.get("result", {}).get("results", []):
            # Try to get a CSV or JSON resource URL
            resources = result.get("resources", [])
            for res in resources:
                url = res.get("url")
                format_ = (res.get("format") or "").lower()
                if "csv" in format_:
                    rows = await self._parse_csv(url)
                    results.extend(rows)
                elif "json" in format_:
                    rows = await self._parse_json(url)
                    results.extend(rows)
        # Normalizar os registros para EventoUrbano
        eventos = [self._normalize_record(r, cidade) for r in results]
        # Cache lista de dicts
        await self._cache_set(cache_key, [e.model_dump() if hasattr(e, "model_dump") else e.dict() for e in eventos])
        return eventos

    async def _parse_csv(self, url: str) -> List[Dict]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            text = resp.text
            reader = csv.DictReader(text.splitlines())
            rows = []
            for row in reader:
                rows.append(dict(row))
            return rows

    async def _parse_json(self, url: str) -> List[Dict]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            data = resp.json()
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                for key in ("records", "results", "data"):
                    if key in data and isinstance(data[key], list):
                        return data[key]
            return []

    def _normalize_record(self, rec: Dict, cidade: str) -> EventoUrbano:
        # Tolerante a diferentes nomes de colunas
        lat = self._extract_float(rec, ["latitude", "lat", "latitud"])
        lon = self._extract_float(rec, ["longitude", "lon", "lng", "longitud"])
        valor = self._extract_float(rec, ["valor", "quantidade", "value"])
        tipo = rec.get("tipo", rec.get("category", "dados_publicos"))
        return EventoUrbano(
            fonte="dados_gov",
            tipo=str(tipo),
            timestamp=datetime.utcnow(),
            latitude=lat if lat is not None else 0.0,
            longitude=lon if lon is not None else 0.0,
            valor=valor,
            severidade=1,
            dados_brutos=rec,
        )

    def _extract_float(self, rec: Dict, keys: List[str]) -> float | None:
        for k in keys:
            if k in rec:
                try:
                    return float(rec[k])
                except (ValueError, TypeError):
                    continue
        return None
