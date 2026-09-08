import asyncio
import json
from datetime import datetime
from typing import Dict, List
try:
    import structlog
except ImportError:
    import logging as structlog
    structlog.get_logger = lambda: logging.getLogger(__name__)

from .base import BaseConnector
from ..models.evento import EventoUrbano
from ..config import settings

log = structlog.get_logger()

class TransitoConnector(BaseConnector):
    source_name = "transito"
    cache_ttl = 60  # 1 minute

    async def fetch(self, params: Dict) -> List[EventoUrbano]:
        lat = params.get("lat")
        lon = params.get("lon")
        if lat is None or lon is None:
            raise ValueError("lat and lon required")

        cache_key = f"transito:{lat}:{lon}"
        cached = await self._cache_get(cache_key)
        if cached:
            return [EventoUrbano(**e) for e in cached]

        # TomTom Traffic Flow – requires API key
        if not settings.TOMTOM_API_KEY:
            log.warning("transito_connector_disabled", reason="missing TOMTOM_API_KEY")
            raise RuntimeError("TomTom API key not configured; connector disabled")

        url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
        query = {
            "point": f"{lat},{lon}",
            "unit": "KMH",
            "key": settings.TOMTOM_API_KEY,
        }
        data = await self._request("GET", url, params=query)
        evento = self._parse_tomtom(data, lat, lon)
        await self._cache_set(cache_key, [evento.dict()])
        return [evento]

    def _parse_tomtom(self, data: dict, lat: float, lon: float) -> EventoUrbano:
        # Simplified parsing – extract current speed and traffic confidence
        flow = data.get("flowSegmentData", {}).get("flowSegment", [{}])[0]
        current_speed = flow.get("currentSpeed")
        confidence = flow.get("confidence")  # 0-100
        severity = self._severity_from_speed(current_speed, confidence)
        return EventoUrbano(
            fonte="tomtom",
            tipo="transito",
            timestamp=datetime.utcnow(),
            latitude=lat,
            longitude=lon,
            valor=current_speed,
            severidade=severity,
            dados_brutos=data,
        )

    def _severity_from_speed(self, speed: float, confidence: int) -> int:
        # Higher severity for lower speed and higher confidence of congestion
        if speed is None:
            return 0
        if speed < 20:
            return 5
        if speed < 40:
            return 4
        if speed < 60:
            return 3
        if speed < 80:
            return 2
        return 1
