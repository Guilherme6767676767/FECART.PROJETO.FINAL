import time
from fastapi import APIRouter, HTTPException
from typing import List, Dict
import logging
try:
    import structlog
except ImportError:
    import logging as structlog
    structlog.get_logger = lambda: logging.getLogger(__name__)

from ..connectors.base import BaseConnector
from ..connectors.clima import ClimaConnector
from ..connectors.transito import TransitoConnector
from ..connectors.dados_publicos import DadosPublicosConnector
from ..connectors.iot import IoTConnector

router = APIRouter(prefix="/api/health", tags=["health"])

log = structlog.get_logger()

connectors: List[BaseConnector] = [
    ClimaConnector(),
    TransitoConnector(),
    DadosPublicosConnector(),
    IoTConnector(),
]

@router.get("/conectores")
async def health_conectores():
    results = []
    for conn in connectors:
        start = time.time()
        try:
            # perform a lightweight call; parameters dummy
            if conn.source_name == "clima":
                await conn.fetch({"lat": -23.5505, "lon": -46.6333})
            elif conn.source_name == "transito":
                await conn.fetch({"lat": -23.5505, "lon": -46.6333})
            elif conn.source_name == "dados_publicos":
                await conn.fetch({"cidade": "São Paulo"})
            elif conn.source_name == "iot":
                # iot connector has no external request, just mark ok
                pass
            status_http = 200
            ok = True
            erro = None
        except Exception as exc:
            status_http = getattr(exc, "status_code", 500)
            ok = False
            erro = str(exc)
        latency_ms = int((time.time() - start) * 1000)
        results.append({
            "fonte": conn.source_name,
            "ok": ok,
            "status_http": status_http,
            "latencia_ms": latency_ms,
            "erro": erro,
        })
    return results
