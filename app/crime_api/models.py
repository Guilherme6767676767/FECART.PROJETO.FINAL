from pydantic import BaseModel
from typing import Literal

class CrimeRecord(BaseModel):
    ano: int
    tipo_crime: str
    mes: Literal["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    quantidade: int

class CrimeSummary(BaseModel):
    ano: int
    tipo_crime: str
    total: int
