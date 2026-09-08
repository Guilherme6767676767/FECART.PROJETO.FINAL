from fastapi import APIRouter, HTTPException, Query
from typing import List

from ..config import settings
from ..connectors.clima import ClimaConnector
from ..connectors.transito import TransitoConnector
from ..connectors.dados_publicos import DadosPublicosConnector
from ..connectors.iot import IoTConnector
from ..models.evento import EventoUrbano

router = APIRouter(prefix="/api", tags=["coleta"])

clima_connector = ClimaConnector()
transito_connector = TransitoConnector()
dados_publicos_connector = DadosPublicosConnector()
iot_connector = IoTConnector()

@router.get("/clima", response_model=List[EventoUrbano])
async def get_clima(lat: float = Query(...), lon: float = Query(...)):
    try:
        eventos = await clima_connector.fetch({"lat": lat, "lon": lon})
        return eventos
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/transito", response_model=List[EventoUrbano])
async def get_transito(lat: float = Query(...), lon: float = Query(...)):
    try:
        eventos = await transito_connector.fetch({"lat": lat, "lon": lon})
        return eventos
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/dados-publicos", response_model=List[EventoUrbano])
async def get_dados_publicos(cidade: str = Query(...)):
    try:
        eventos = await dados_publicos_connector.fetch({"cidade": cidade})
        return eventos
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/ingest/iot")
async def ingest_iot(payload: dict, token: str = Query(None, alias="auth-token")):
    # Simple token auth – token must match env var IOT_AUTH_TOKEN
    expected = getattr(settings, "IOT_AUTH_TOKEN", None)
    if expected is None or token != expected:
        raise HTTPException(status_code=401, detail="Token de autenticação inválido")
    try:
        evento = await iot_connector.process_message(payload)
        return {"ok": True, "evento": evento}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
