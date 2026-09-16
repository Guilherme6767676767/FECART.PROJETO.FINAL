import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from flask import abort
from app import db
from backend.security_models import OcorrenciaSeguranca

# Simple severity mapping (case‑insensitive)
SEVERITY_MAP = {
    "homicídio": "Alta",
    "homicidio": "Alta",
    "confronto policial": "Alta",
    "feminicídio": "Alta",
    "feminicidio": "Alta",
    "sequestro": "Alta",
    "morte": "Alta",
    "acidente fatal": "Média",
    "atropelamento fatal": "Média",
    "acidente": "Média",
    "tentativa de homicídio": "Média",
    "tentativa de feminicídio": "Média",
    "prisão": "Baixa",
    "investigação": "Baixa",
    "queda": "Baixa",
}

def classify_severity(tipo: str) -> str:
    """Return severity level based on occurrence type."""
    texto = tipo.lower()
    for termo, nivel in SEVERITY_MAP.items():
        if termo in texto:
            return nivel
    return "Baixa"

def geocode_address(address: str) -> Tuple[float, float]:
    """Resolve free‑text address to (lat, lon) using Nominatim.
    Simple rate‑limit handling – pause 1 s between calls.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
        "addressdetails": 0,
    }
    headers = {"User-Agent": "FECART_Security/1.0 (contact@fecap.br)"}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
    except Exception as e:
        print(f"[Geocode] failed for '{address}': {e}")
    # fallback to None values
    return None, None

def insert_occurrence(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new security occurrence into the DB.
    Expected keys: data_fato (YYYY-MM-DD), cidade, tipo_ocorrencia, local, fonte (optional).
    """
    required = ["data_fato", "cidade", "tipo_ocorrencia", "local"]
    if not all(k in payload for k in required):
        raise ValueError("Missing required fields for occurrence")
    # Parse date
    try:
        data_fato = datetime.strptime(payload["data_fato"], "%Y-%m-%d").date()
    except Exception as e:
        raise ValueError(f"Invalid date format: {e}")
    gravidade = classify_severity(payload["tipo_ocorrencia"])
    lat, lon = geocode_address(f"{payload['local']}, {payload['cidade']}, São Paulo, Brasil")
    occ = OcorrenciaSeguranca(
        data_fato=data_fato,
        cidade=payload["cidade"],
        tipo_ocorrencia=payload["tipo_ocorrencia"],
        local=payload["local"],
        fonte=payload.get("fonte", ""),
        gravidade=gravidade,
        latitude=lat,
        longitude=lon,
    )
    db.session.add(occ)
    db.session.commit()
    return occ.to_dict()

def get_recent_alerts(limit: int = 10) -> List[Dict[str, Any]]:
    alerts = (
        OcorrenciaSeguranca.query.order_by(OcorrenciaSeguranca.data_fato.desc())
        .limit(limit)
        .all()
    )
    return [a.to_dict() for a in alerts]

def get_aggregated_stats() -> Dict[str, Any]:
    now = datetime.utcnow()
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_24h = now - timedelta(hours=24)
    total_month = (
        OcorrenciaSeguranca.query.filter(OcorrenciaSeguranca.data_fato >= start_month.date())
        .count()
    )
    total_24h = (
        OcorrenciaSeguranca.query.filter(OcorrenciaSeguranca.data_fato >= start_24h.date())
        .count()
    )
    # Gather counts
    type_counts = {}
    city_counts = {}
    for occ in OcorrenciaSeguranca.query.all():
        type_counts[occ.tipo_ocorrencia] = type_counts.get(occ.tipo_ocorrencia, 0) + 1
        city_counts[occ.cidade] = city_counts.get(occ.cidade, 0) + 1
    return {
        "monthCount": total_month,
        "last24hCount": total_24h,
        "byType": type_counts,
        "byCity": city_counts,
        "recentAlerts": get_recent_alerts(limit=10),
    }
