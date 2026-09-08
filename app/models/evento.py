from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict

class EventoUrbano(BaseModel):
    """Modelo unificado para eventos de todas as fontes"""
    fonte: str
    tipo: str
    timestamp: datetime
    latitude: float
    longitude: float
    valor: Optional[float] = None
    severidade: int = Field(..., ge=0, le=5)
    dados_brutos: Dict

    class Config:
        from_attributes = True
