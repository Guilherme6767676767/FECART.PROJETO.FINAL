from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from collections import Counter
import random

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


# ==========================================
# GESTÃO DE SIMULAÇÃO URBANA
# ==========================================
def calcular_impacto_ia(tipo: str, gravidade: str, bairro: str, lat: float, lng: float) -> Dict[str, Any]:
    """Calcula predições da IA sobre o incidente simulado."""
    gravidade_upper = gravidade.upper()
    
    score_base = {
        "CRITICA": random.randint(85, 98),
        "ALTA": random.randint(68, 84),
        "MEDIA": random.randint(45, 65),
        "BAIXA": random.randint(20, 40)
    }.get(gravidade_upper, 50)

    # Identificar se cai em uma AOI conhecida
    afeta_aoi = None
    if -23.575 <= lat <= -23.555 and -46.660 <= lng <= -46.640:
        afeta_aoi = "AOI Alpha — Av. Paulista & Bela Vista"
    elif -23.558 <= lat <= -23.545 and -46.638 <= lng <= -46.625:
        afeta_aoi = "AOI Bravo — Centro Histórico & Sé"
    elif -23.604 <= lat <= -23.590 and -46.690 <= lng <= -46.672:
        afeta_aoi = "AOI Charlie — Vila Olímpia & Faria Lima"
    elif -23.528 <= lat <= -23.510 and -46.705 <= lng <= -46.678:
        afeta_aoi = "AOI Delta — Marginal Tietê & Lapa"

    recomendacoes = []
    if "alagamento" in tipo.lower() or "chuva" in tipo.lower():
        impacto = f"Retenção crítica estimada de 4.2 km nas vias adjacentes em {bairro}."
        recomendacoes = [
            "Desvio de tráfego automático para vias secundárias (Waze/CET integrado)",
            "Acionamento de bombas de sucção e alerta à Defesa Civil",
            "Notificação em tempo real aos condutores via app Sentinel"
        ]
    elif "roubo" in tipo.lower() or "furto" in tipo.lower() or "arrastão" in tipo.lower():
        impacto = f"Risco elevado de evasão em rota radial. Tempo de resposta ideal: 4 a 6 min."
        recomendacoes = [
            "Ativação de cerco eletrônico por câmeras OCR de leitura de placas",
            "Despacho prioritário para 2 viaturas de patrulhamento da PM/GCM",
            "Análise de rotas de fuga por grafo geoespacial da IA"
        ]
    elif "semáforo" in tipo.lower() or "acidente" in tipo.lower():
        impacto = f"Queda na velocidade média do corredor para 8 km/h nos próximos 30 minutos."
        recomendacoes = [
            "Reprogramação remota dos semáforos adjacentes para onda verde de escoamento",
            "Envio de agentes de trânsito da CET para operação manual",
            "Alerta de segurança para veículos de emergência (SAMU/Resgate)"
        ]
    else:
        impacto = f"Incidente registrado na malha urbana de {bairro} com monitoramento ativo."
        recomendacoes = [
            "Monitoramento por telemetria e sensores IoT na região",
            "Atualização do índice preditivo do bairro"
        ]

    return {
        "score_risco_calculado": score_base,
        "nivel_alerta": "CRÍTICO" if score_base >= 85 else ("ALTO" if score_base >= 68 else "MODERADO"),
        "impacto_estimado": impacto,
        "acoes_recomendadas": recomendacoes,
        "afeta_aoi": afeta_aoi
    }


def registrar_ocorrencia_simulada(dados: Dict[str, Any]) -> Dict[str, Any]:
    """Cria e persiste uma nova ocorrência originada por simulação."""
    novo_id = f"SIM-{random.randint(1000, 9999)}"
    numero_bo = f"SIM-{random.randint(10000, 99999)}/2026"

    nova_ocorrencia = {
        "id": novo_id,
        "numero_bo": numero_bo,
        "data_hora": datetime.now(),
        "tipo_crime": dados["tipo_crime"],
        "bairro": dados["bairro"],
        "logradouro": dados["logradouro"],
        "latitude": float(dados["latitude"]),
        "longitude": float(dados["longitude"]),
        "status": "Simulação Ativa (IA)",
        "gravidade": dados.get("gravidade", "ALTA").upper()
    }

    # Inserir no início da lista
    MOCK_BO_DATABASE.insert(0, nova_ocorrencia)

    impacto_ia = calcular_impacto_ia(
        dados["tipo_crime"],
        dados.get("gravidade", "ALTA"),
        dados["bairro"],
        float(dados["latitude"]),
        float(dados["longitude"])
    )

    return {
        "sucesso": True,
        "ocorrencia": nova_ocorrencia,
        **impacto_ia
    }


def disparar_cenario_pronto(cenario_id: str) -> List[Dict[str, Any]]:
    """Dispara um cenário complexo pré-configurado."""
    cenarios = {
        "tempestade_marginal": [
            {
                "tipo_crime": "Alagamento Crítico — Transbordamento de Pista",
                "bairro": "Lapa",
                "logradouro": "Marginal Tietê, altura da Ponte da Lapa",
                "latitude": -23.5195,
                "longitude": -46.6930,
                "gravidade": "CRITICA"
            },
            {
                "tipo_crime": "Queda de Árvore em Faixa de Rolamento",
                "bairro": "Santana",
                "logradouro": "Av. Olavo Fontoura, Sambódromo",
                "latitude": -23.5080,
                "longitude": -46.6390,
                "gravidade": "ALTA"
            },
            {
                "tipo_crime": "Semáforo em Pane Elétrica por Descarga Atmosférica",
                "bairro": "Barra Funda",
                "logradouro": "Av. Marquês de São Vicente x Antártica",
                "latitude": -23.5220,
                "longitude": -46.6710,
                "gravidade": "ALTA"
            }
        ],
        "arrastao_centro": [
            {
                "tipo_crime": "Arrastão / Roubo Coletivo a Transeuntes",
                "bairro": "Sé",
                "logradouro": "Rua Direita x Praça do Patriarca",
                "latitude": -23.5485,
                "longitude": -46.6345,
                "gravidade": "CRITICA"
            },
            {
                "tipo_crime": "Aglomeração Hostil / Distúrbio Civil",
                "bairro": "República",
                "logradouro": "Praça da República, Metrô",
                "latitude": -23.5435,
                "longitude": -46.6420,
                "gravidade": "ALTA"
            }
        ],
        "aglomeracao_paulista": [
            {
                "tipo_crime": "Manifestação Espontânea / Bloqueio Total da Via",
                "bairro": "Bela Vista",
                "logradouro": "Av. Paulista, 1578 (Frente ao MASP)",
                "latitude": -23.5614,
                "longitude": -46.6560,
                "gravidade": "CRITICA"
            },
            {
                "tipo_crime": "Furto em Massa de Celulares e Carteiras",
                "bairro": "Consolação",
                "logradouro": "Av. Paulista x Rua Augusta",
                "latitude": -23.5580,
                "longitude": -46.6600,
                "gravidade": "ALTA"
            }
        ],
        "pane_pinheiros": [
            {
                "tipo_crime": "Apagão Semafórico em Cruzamento de Alto Fluxo",
                "bairro": "Pinheiros",
                "logradouro": "Av. Brigadeiro Faria Lima x Av. Rebouças",
                "latitude": -23.5675,
                "longitude": -46.6920,
                "gravidade": "ALTA"
            },
            {
                "tipo_crime": "Acidente Múltiplo de Trânsito com Bloqueio",
                "bairro": "Vila Olímpia",
                "logradouro": "Av. Brigadeiro Faria Lima, 3900",
                "latitude": -23.5920,
                "longitude": -46.6850,
                "gravidade": "CRITICA"
            }
        ]
    }

    eventos = cenarios.get(cenario_id, cenarios["tempestade_marginal"])
    resultados = []
    for ev in eventos:
        res = registrar_ocorrencia_simulada(ev)
        resultados.append(res)
    return resultados


def limpar_ocorrencias_simuladas():
    """Remove todas as ocorrências de simulação (IDs com prefixo SIM-)."""
    global MOCK_BO_DATABASE
    MOCK_BO_DATABASE = [r for r in MOCK_BO_DATABASE if not str(r["id"]).startswith("SIM-")]
    return len(MOCK_BO_DATABASE)

