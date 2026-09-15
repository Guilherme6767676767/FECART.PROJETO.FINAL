from fastapi import FastAPI, Query
from typing import List, Optional
from .data_loader import CRIME_RECORDS
from .models import CrimeRecord, CrimeSummary
from collections import defaultdict

app = FastAPI(title="Crime Data API", description="API exposing crime statistics from SSP‑SP Excel file.")

@app.get("/crimes", response_model=List[CrimeRecord])
def get_crimes(
    ano: Optional[int] = Query(None, description="Filtra por ano (ex.: 2025)"),
    tipo: Optional[str] = Query(None, description="Filtra por tipo de crime (ex.: HOMICÍDIO DOLOSO)")
):
    """Retorna a lista completa de registros ou aplica filtros de ano e/ou tipo de crime.
    
    - ``ano`` – inteiro representando o ano da planilha.
    - ``tipo`` – texto do tipo de crime (case‑insensitive).
    """
    results = CRIME_RECORDS
    if ano is not None:
        results = [r for r in results if r["ano"] == ano]
    if tipo:
        tipo_lower = tipo.strip().lower()
        results = [r for r in results if r["tipo_crime"].lower() == tipo_lower]
    return results

@app.get("/crimes/resumo", response_model=List[CrimeSummary])
def get_summary():
    """Agrega o total de ocorrências por ano e tipo de crime.
    
    Retorna uma lista onde cada item tem ``ano``, ``tipo_crime`` e ``total``.
    """
    aggregation: defaultdict = defaultdict(int)
    for r in CRIME_RECORDS:
        key = (r["ano"], r["tipo_crime"])
        aggregation[key] += r["quantidade"]
    summary = [
        {"ano": ano, "tipo_crime": tipo, "total": total}
        for (ano, tipo), total in aggregation.items()
    ]
    return summary
