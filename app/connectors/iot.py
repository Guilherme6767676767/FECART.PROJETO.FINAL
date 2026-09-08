import asyncio
from datetime import datetime
from typing import Dict, List

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

class IoTConnector(BaseConnector):
    """Connector for incoming MQTT/webhook IoT messages.
    The connector does not perform external HTTP calls; it only validates
    and normalises the payload before persisting it to PostGIS (via the
    DB helper – not implemented here)."""

    source_name = "iot"
    cache_ttl = 0  # no caching for inbound messages

    async def fetch(self, params: Dict) -> List[EventoUrbano]:
        # Not used – ingest endpoint calls process_message directly.
        raise NotImplementedError("IoTConnector.fetch is not applicable; use process_message instead")

    async def process_message(self, payload: Dict) -> EventoUrbano:
        # Expected payload fields: latitude, longitude, valor (optional), tipo, severity
        lat = payload.get("latitude")
        lon = payload.get("longitude")
        if lat is None or lon is None:
            raise ValueError("Payload must contain latitude and longitude")
        try:
            lat = float(lat)
            lon = float(lon)
        except (TypeError, ValueError):
            raise ValueError("Invalid latitude/longitude values")
        valor = payload.get("valor")
        try:
            valor = float(valor) if valor is not None else None
        except (TypeError, ValueError):
            valor = None
        tipo = payload.get("tipo", "iot")
        severidade = int(payload.get("severidade", 1))
        evento = EventoUrbano(
            fonte="iot",
            tipo=str(tipo),
            timestamp=datetime.utcnow(),
            latitude=lat,
            longitude=lon,
            valor=valor,
            severidade=severidade,
            dados_brutos=payload,
        )
        # Here you would call a DB helper to persist, e.g. await save_evento(evento)
        log.info("iot_event_received", evento=evento.dict())
        return evento
