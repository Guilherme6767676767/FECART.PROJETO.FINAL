from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ==========================================
# SCHEMAS - CLIMA E TELEMETRIA URBANA
# ==========================================
class WeatherResponse(BaseModel):
    cidade: str = Field(default="São Paulo, SP", description="Localidade do monitoramento")
    temperatura: float = Field(..., description="Temperatura atual em °C")
    sensacao_termica: float = Field(..., description="Sensação térmica em °C")
    condicao: str = Field(..., description="Descrição resumida do clima")
    umidade: int = Field(..., description="Umidade relativa do ar (%)")
    vento_kmh: float = Field(..., description="Velocidade do vento em km/h")
    precipitacao_mm: float = Field(default=0.0, description="Volume de precipitação em mm")
    alerta_risco: str = Field(default="BAIXO", description="Nível de risco urbano preditivo (BAIXO, MEDIO, ALTO, CRITICO)")
    icone: str = Field(default="cloud-sun", description="Identificador do ícone")
    atualizado_em: str = Field(..., description="Horário da última medição")
    fonte: str = Field(..., description="Origem dos dados (Provedor ou Fallback)")


# ==========================================
# SCHEMAS - BOLETINS DE OCORRÊNCIA (SSP-SP)
# ==========================================
class OcorrenciaBO(BaseModel):
    id: str
    numero_bo: str
    data_hora: datetime
    tipo_crime: str
    bairro: str
    logradouro: str
    latitude: float
    longitude: float
    status: str = "Registrado"
    gravidade: str  # BAIXA, MEDIA, ALTA, CRITICA


class OcorrenciasPaginadas(BaseModel):
    total: int = Field(..., description="Total de ocorrências que atendem aos filtros")
    pagina: int = Field(..., description="Página atual da consulta")
    tamanho_pagina: int = Field(..., description="Quantidade de registros por página")
    total_paginas: int = Field(..., description="Total de páginas disponíveis")
    ocorrencias: List[OcorrenciaBO] = Field(..., description="Lista de boletins de ocorrência")


class ResumoEstatistico(BaseModel):
    total_ocorrencias: int
    criticas: int
    altas: int
    medias: int
    baixas: int
    bairro_mais_afetado: str
    tipo_mais_frequente: str
