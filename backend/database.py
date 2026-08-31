from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from collections import Counter

# Dataset com ocorrências realistas georreferenciadas na cidade de São Paulo
MOCK_BO_DATABASE: List[Dict[str, Any]] = [
    {
        "id": "BO-2026-001",
        "numero_bo": "98124/2026",
        "data_hora": datetime.now() - timedelta(minutes=25),
        "tipo_crime": "Furto de Celular / Transeunte",
        "bairro": "Sé",
        "logradouro": "Praça da Sé, próx. Catedral Metropolitana",
        "latitude": -23.55052,
        "longitude": -46.63330,
        "status": "Em Investigação",
        "gravidade": "MEDIA"
    },
    {
        "id": "BO-2026-002",
        "numero_bo": "98125/2026",
        "data_hora": datetime.now() - timedelta(hours=1, minutes=10),
        "tipo_crime": "Roubo de Veículo",
        "bairro": "Pinheiros",
        "logradouro": "Av. Brigadeiro Faria Lima, 2200",
        "latitude": -23.56750,
        "longitude": -46.69200,
        "status": "Registrado",
        "gravidade": "ALTA"
    },
    {
        "id": "BO-2026-003",
        "numero_bo": "98126/2026",
        "data_hora": datetime.now() - timedelta(hours=2, minutes=5),
        "tipo_crime": "Furto de Veículo",
        "bairro": "Bela Vista",
        "logradouro": "Rua Treze de Maio, 450",
        "latitude": -23.55800,
        "longitude": -46.64500,
        "status": "Concluído",
        "gravidade": "MEDIA"
    },
    {
        "id": "BO-2026-004",
        "numero_bo": "98127/2026",
        "data_hora": datetime.now() - timedelta(hours=3, minutes=45),
        "tipo_crime": "Alagamento / Ponto Intransitável",
        "bairro": "Lapa",
        "logradouro": "Marginal Tietê, próx. Ponte da Lapa",
        "latitude": -23.51900,
        "longitude": -46.69200,
        "status": "Defesa Civil Notificada",
        "gravidade": "ALTA"
    },
    {
        "id": "BO-2026-005",
        "numero_bo": "98128/2026",
        "data_hora": datetime.now() - timedelta(hours=5),
        "tipo_crime": "Tentativa de Roubo a Estabelecimento Comercial",
        "bairro": "Moema",
        "logradouro": "Av. Ibirapuera, 1200",
        "latitude": -23.59500,
        "longitude": -46.66200,
        "status": "Flagrante Delito",
        "gravidade": "CRITICA"
    },
    {
        "id": "BO-2026-006",
        "numero_bo": "98129/2026",
        "data_hora": datetime.now() - timedelta(hours=6, minutes=20),
        "tipo_crime": "Furto Simples de Equipamento",
        "bairro": "Tatuapé",
        "logradouro": "Rua Tuiuti, 1500",
        "latitude": -23.54100,
        "longitude": -46.57500,
        "status": "Registrado",
        "gravidade": "BAIXA"
    },
    {
        "id": "BO-2026-007",
        "numero_bo": "98130/2026",
        "data_hora": datetime.now() - timedelta(hours=8),
        "tipo_crime": "Roubo de Carga",
        "bairro": "Brás",
        "logradouro": "Rua do Gasômetro, 300",
        "latitude": -23.54300,
        "longitude": -46.61800,
        "status": "Carga Recuperada",
        "gravidade": "CRITICA"
    },
    {
        "id": "BO-2026-008",
        "numero_bo": "98131/2026",
        "data_hora": datetime.now() - timedelta(hours=10),
        "tipo_crime": "Aglomeração Não Autorizada / Perturbação",
        "bairro": "Consolação",
        "logradouro": "Rua Augusta, 1100",
        "latitude": -23.55300,
        "longitude": -46.65200,
        "status": "Dispersado",
        "gravidade": "BAIXA"
    },
    {
        "id": "BO-2026-009",
        "numero_bo": "98132/2026",
        "data_hora": datetime.now() - timedelta(hours=12),
        "tipo_crime": "Acidente de Trânsito com Vítima",
        "bairro": "Cerqueira César",
        "logradouro": "Av. Paulista, altura do MASP",
        "latitude": -23.56140,
        "longitude": -46.65600,
        "status": "SAMU / CET no Local",
        "gravidade": "ALTA"
    },
    {
        "id": "BO-2026-010",
        "numero_bo": "98133/2026",
        "data_hora": datetime.now() - timedelta(hours=14),
        "tipo_crime": "Queda de Árvore sobre Rede Elétrica",
        "bairro": "Santana",
        "logradouro": "Av. Cruzeiro do Sul, 2400",
        "latitude": -23.50500,
        "longitude": -46.62600,
        "status": "Enel Notificada",
        "gravidade": "MEDIA"
    }
]


def buscar_ocorrencias(
    bairro: Optional[str] = None,
    tipo_crime: Optional[str] = None,
    gravidade: Optional[str] = None,
    termo_busca: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Filtra ocorrências com base em parâmetros urbanos e de segurança."""
    resultados = MOCK_BO_DATABASE.copy()

    if bairro:
        resultados = [r for r in resultados if bairro.lower() in r["bairro"].lower()]

    if tipo_crime:
        resultados = [r for r in resultados if tipo_crime.lower() in r["tipo_crime"].lower()]

    if gravidade:
        resultados = [r for r in resultados if r["gravidade"].upper() == gravidade.upper()]

    if termo_busca:
        termo = termo_busca.lower()
        resultados = [
            r for r in resultados
            if termo in r["logradouro"].lower()
            or termo in r["tipo_crime"].lower()
            or termo in r["numero_bo"].lower()
            or termo in r["bairro"].lower()
        ]

    # Ordenar pelas ocorrências mais recentes
    return sorted(resultados, key=lambda x: x["data_hora"], reverse=True)


def obter_estatisticas_resumo() -> Dict[str, Any]:
    """Calcula estatísticas agregadas sobre a base de dados."""
    total = len(MOCK_BO_DATABASE)
    criticas = sum(1 for r in MOCK_BO_DATABASE if r["gravidade"] == "CRITICA")
    altas = sum(1 for r in MOCK_BO_DATABASE if r["gravidade"] == "ALTA")
    medias = sum(1 for r in MOCK_BO_DATABASE if r["gravidade"] == "MEDIA")
    baixas = sum(1 for r in MOCK_BO_DATABASE if r["gravidade"] == "BAIXA")

    bairros = [r["bairro"] for r in MOCK_BO_DATABASE]
    tipos = [r["tipo_crime"] for r in MOCK_BO_DATABASE]

    bairro_mais_afetado = Counter(bairros).most_common(1)[0][0] if bairros else "N/D"
    tipo_mais_frequente = Counter(tipos).most_common(1)[0][0] if tipos else "N/D"

    return {
        "total_ocorrencias": total,
        "criticas": criticas,
        "altas": altas,
        "medias": medias,
        "baixas": baixas,
        "bairro_mais_afetado": bairro_mais_afetado,
        "tipo_mais_frequente": tipo_mais_frequente
    }
