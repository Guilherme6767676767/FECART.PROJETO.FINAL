from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
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
async def alertas_reais(
    data_inicio: datetime | None = Query(None, description="ISO 8601, por exemplo 2026-09-01T00:00:00-03:00"),
    data_fim: datetime | None = Query(None, description="ISO 8601, por exemplo 2026-09-14T23:59:59-03:00"),
):
    """Feed consolidado; fontes indisponíveis são omitidas, nunca simuladas."""
    if data_inicio and data_fim and data_inicio > data_fim:
        raise HTTPException(422, "data_inicio deve ser anterior a data_fim")
    return {"alertas": await live_data_service.alerts(data_inicio, data_fim), "gerado_em": datetime.now(timezone.utc).isoformat(), "filtros": {"data_inicio": data_inicio, "data_fim": data_fim}}
