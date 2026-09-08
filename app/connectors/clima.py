import os
import time
from datetime import datetime
from typing import List, Dict

import logging
try:
    import structlog
except ImportError:
    import logging as structlog
    structlog.get_logger = lambda: logging.getLogger(__name__)
from .base import BaseConnector
from ..models.evento import EventoUrbano
from ..config import settings

log = structlog.get_logger()

class ClimaConnector(BaseConnector):
    source_name = "clima"
    cache_ttl = 600  # 10 minutes

    async def fetch(self, params: Dict) -> List[EventoUrbano]:
        lat = params.get("lat")
        lon = params.get("lon")
        if lat is None or lon is None:
            raise ValueError("lat e lon são obrigatórios")

        cache_key = f"clima:{lat}:{lon}"
        cached = await self._cache_get(cache_key)
        if cached:
            return [EventoUrbano(**e) for e in cached]

        # Primeiro tenta OpenWeather se a chave existir
        if settings.OPENWEATHER_API_KEY:
            url = "https://api.openweathermap.org/data/2.5/weather"
            query = {"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"}
            try:
                data = await self._request("GET", url, params=query)
                evento = self._parse_openweather(data, lat, lon)
                await self._cache_set(cache_key, [evento.dict()])
                return [evento]
            except Exception as exc:
                log.error("openweather_failed", error=str(exc))
                # fallback to Open-Meteo
        # Open-Meteo (gratuita)
        url = "https://api.open-meteo.com/v1/forecast"
        query = {"latitude": lat, "longitude": lon, "current_weather": "true", "timezone": "UTC"}
        data = await self._request("GET", url, params=query)
        evento = self._parse_open_meteo(data, lat, lon)
        await self._cache_set(cache_key, [evento.dict()])
        return [evento]

    def _parse_openweather(self, data: dict, lat: float, lon: float) -> EventoUrbano:
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        temperatura = main.get("temp")
        severity = self._severity_from_temp(temperatura)
        return EventoUrbano(
            fonte="openweather",
            tipo="clima",
            timestamp=datetime.utcnow(),
            latitude=lat,
            longitude=lon,
            valor=temperatura,
            severidade=severity,
            dados_brutos=data,
        )

    def _parse_open_meteo(self, data: dict, lat: float, lon: float) -> EventoUrbano:
        current = data.get("current_weather", {})
        temperatura = current.get("temperature")
        severity = self._severity_from_temp(temperatura)
        return EventoUrbano(
            fonte="open-meteo",
            tipo="clima",
            timestamp=datetime.utcnow(),
            latitude=lat,
            longitude=lon,
            valor=temperatura,
            severidade=severity,
            dados_brutos=data,
        )

    def _severity_from_temp(self, temp: float) -> int:
        # simples escala de severidade baseada na temperatura
        if temp is None:
            return 0
        if temp > 35:
            return 5
        if temp > 30:
            return 4
        if temp > 25:
            return 3
        if temp > 20:
            return 2
        return 1
