from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from ..services.live_data import ExternalServiceError, live_data_service

router = APIRouter(prefix="/api/v1", tags=["Dados geoespaciais reais"])

@router.get("/clima/geojson")
async def clima_geojson(lat: float = Query(-23.5505), lon: float = Query(-46.6333)):
    try: return await live_data_service.weather(lat, lon)
    except (ValueError, ExternalServiceError) as exc: raise HTTPException(503, str(exc)) from exc

@router.get("/acidentes")
async def acidentes_geojson(limit: int = Query(5000, ge=1, le=50000)):
    try: return await live_data_service.accidents(limit)
    except ExternalServiceError as exc: raise HTTPException(503, str(exc)) from exc

@router.get("/transito/geojson")
async def transito_geojson(lat: float = Query(-23.5505), lon: float = Query(-46.6333)):
    """Velocidade, velocidade livre e geometria do segmento mais próximo."""
    try: return await live_data_service.traffic(lat, lon)
    except (ValueError, ExternalServiceError) as exc: raise HTTPException(503, str(exc)) from exc

@router.get("/riscos-criminalidade")
async def riscos_criminalidade(limit: int = Query(100000, ge=1, le=500000)):
    try: return await live_data_service.crime_risk(limit)
    except ExternalServiceError as exc: raise HTTPException(503, str(exc)) from exc

@router.get("/alertas")
async def alertas_reais():
    """Feed consolidado; fontes indisponíveis são omitidas, nunca simuladas."""
    return {"alertas": await live_data_service.alerts(), "gerado_em": datetime.now(timezone.utc).isoformat()}
