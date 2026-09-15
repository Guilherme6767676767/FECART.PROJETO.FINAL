import os
import sys
import math
import json
from datetime import datetime, timezone
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Garantir que o diretório 'backend' esteja no sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from schemas import (
    WeatherResponse,
    ClimaCoordenadaResponse,
    AlagamentoPoint,
    CrimeItem,
    CriarCrimeRequest,
    OcorrenciasPaginadas, 
    ResumoEstatistico,
    CriarSimulacaoRequest,
    SimulacaoCenarioRequest,
    SimulacaoResult,
    ChatRequest,
    ChatResponse
)
from database import (
    buscar_ocorrencias, 
    obter_estatisticas_resumo,
    registrar_ocorrencia_simulada,
    disparar_cenario_pronto,
    limpar_ocorrencias_simuladas
)
from services.weather_service import (
    get_sao_paulo_weather,
    get_weather_by_coords,
    obter_pontos_alagamento
)
from services.chat_service import processar_mensagem_chat
from services.live_data import live_data_service

# Inicialização do FastAPI
app = FastAPI(
    title="Sentinel IA - Plataforma de Inteligência Preditiva Urbana",
    description="API de telemetria climática, monitoramento geoespacial, segurança pública (SSP-SP), simulação preditiva e assistente tático de IA.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS para permitir acesso local, Vite, Vercel e portas comuns
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminho para data/crimes.json
DATA_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "..", "data"))
CRIMES_FILE = os.path.join(DATA_DIR, "crimes.json")

def carregar_crimes_json() -> list:
    if os.path.exists(CRIMES_FILE):
        try:
            with open(CRIMES_FILE, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao ler {CRIMES_FILE}: {e}")
    return []

def salvar_crimes_json(crimes: list) -> bool:
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(CRIMES_FILE, "w", encoding="utf-8") as f:
            json.dump(crimes, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erro ao salvar {CRIMES_FILE}: {e}")
        return False


# ----------------------------------------------------
# ROTAS: HEALTHCHECK & STATUS DO SISTEMA
# ----------------------------------------------------
@app.get("/health", tags=["Sistema"])
@app.get("/api/health", tags=["Sistema"])
@app.get("/api/v1/health", tags=["Sistema"])
async def health_check():
    return {
        "status": "ONLINE",
        "system": "Sentinel IA Core Engine",
        "version": "1.0.0"
    }


# ----------------------------------------------------
# ROTAS: CLIMA & OPEN-METEO
# ----------------------------------------------------
@app.get(
    "/api/clima",
    summary="Consultar Clima via Open-Meteo por Coordenadas",
    tags=["Clima & Open-Meteo"]
)
async def api_clima_coordenadas(
    lat: float = Query(-23.5505, description="Latitude (padrão: São Paulo)"),
    lon: float = Query(-46.6333, description="Longitude (padrão: São Paulo)")
):
    """
    Consulta a API pública e gratuita da Open-Meteo para obter temperatura,
    precipitação, probabilidade de chuva, umidade e vento na coordenada indicada.
    """
    try:
        return await get_weather_by_coords(lat, lon)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar Open-Meteo: {str(e)}"
        )


@app.get(
    "/api/v1/clima",
    response_model=WeatherResponse,
    summary="Obter Clima Atual de São Paulo em Tempo Real",
    tags=["Clima & Meio Ambiente"]
)
async def obter_clima(
    force_refresh: bool = Query(False, description="Forçar atualização ignorando o cache TTL")
):
    try:
        dados_clima = await get_sao_paulo_weather(force_refresh=force_refresh)
        return dados_clima
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha no serviço meteorológico: {str(e)}"
        )


# ----------------------------------------------------
# ROTAS: ALAGAMENTOS & DEFESA CIVIL
# ----------------------------------------------------
@app.get(
    "/api/alagamentos",
    summary="Listar Pontos de Atenção e Risco de Alagamento (Open-Meteo)",
    tags=["Alagamentos & Defesa Civil"]
)
@app.get(
    "/api/v1/alagamentos",
    summary="Listar Pontos de Atenção e Risco de Alagamento (Open-Meteo)",
    tags=["Alagamentos & Defesa Civil"]
)
async def api_alagamentos():
    """
    Retorna pontos de risco de alagamento em São Paulo calculados
    com base no volume de chuva atual fornecido pela Open-Meteo.
    """
    try:
        return await obter_pontos_alagamento()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular pontos de alagamento: {str(e)}"
        )


# ----------------------------------------------------
# ROTAS: CRIMES & BOLETINS DE OCORRÊNCIA (JSON)
# ----------------------------------------------------
@app.get(
    "/api/crimes",
    summary="Listar Ocorrências e Crimes Cadastrados",
    tags=["Crimes & B.O.s"]
)
@app.get(
    "/api/v1/crimes",
    summary="Listar Ocorrências e Crimes Cadastrados",
    tags=["Crimes & B.O.s"]
)
async def api_listar_crimes():
    """Retorna a lista de todas as ocorrências cadastradas em data/crimes.json."""
    return carregar_crimes_json()


@app.post(
    "/api/crimes",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar Nova Denúncia/Ocorrência de Crime",
    tags=["Crimes & B.O.s"]
)
@app.post(
    "/api/v1/crimes",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar Nova Denúncia/Ocorrência de Crime",
    tags=["Crimes & B.O.s"]
)
async def api_cadastrar_crime(req: CriarCrimeRequest):
    """
    Permite que novos relatórios de ocorrências enviados pelos usuários
    sejam gravados no arquivo data/crimes.json e retornados instantaneamente.
    """
    crimes = carregar_crimes_json()
    novo_id = f"CR-{int(datetime.now().timestamp() * 1000) % 1000000:06d}"
    data_hora = req.data_hora or datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    novo_crime = {
        "id": novo_id,
        "latitude": round(req.latitude, 6),
        "longitude": round(req.longitude, 6),
        "categoria": req.categoria.strip() if req.categoria else "Outros",
        "data_hora": data_hora,
        "descricao": req.descricao.strip() if req.descricao else "Sem descrição adicional"
    }

    crimes.insert(0, novo_crime)
    salvo = salvar_crimes_json(crimes)
    if not salvo:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao gravar ocorrência no arquivo data/crimes.json"
        )

    return novo_crime


# ----------------------------------------------------
# ROTAS: SEGURANÇA PÚBLICA (SSP-SP)
# ----------------------------------------------------
@app.get(
    "/api/v1/ocorrencias",
    response_model=OcorrenciasPaginadas,
    summary="Listar Boletins de Ocorrência com Filtros e Paginação",
    tags=["Segurança Pública (SSP-SP)"]
)
@app.get(
    "/api/ocorrencias",
    response_model=OcorrenciasPaginadas,
    summary="Listar Boletins de Ocorrência com Filtros e Paginação",
    tags=["Segurança Pública (SSP-SP)"]
)
async def listar_ocorrencias(
    bairro: str = Query(None, description="Filtrar por bairro (ex: Sé, Pinheiros, Moema, Bela Vista, Lapa)"),
    tipo_crime: str = Query(None, description="Filtrar por tipo de ocorrência/crime"),
    gravidade: str = Query(None, description="Filtrar por gravidade: BAIXA, MEDIA, ALTA, CRITICA"),
    q: str = Query(None, description="Busca textual por endereço, BO ou tipo"),
    page: int = Query(1, ge=1, description="Número da página (inicia em 1)"),
    page_size: int = Query(5, ge=1, le=100, description="Quantidade de registros por página")
):
    """
    Consulta os Boletins de Ocorrência da base histórica e telemetria urbana de SP.
    Suporta paginação rápida e filtros combinados.
    """
    try:
        ocorrencias_filtradas = buscar_ocorrencias(
            bairro=bairro,
            tipo_crime=tipo_crime,
            gravidade=gravidade,
            termo_busca=q
        )

        total_itens = len(ocorrencias_filtradas)
        total_paginas = max(1, math.ceil(total_itens / page_size)) if total_itens > 0 else 1

        # Lógica de Paginação
        offset = (page - 1) * page_size
        itens_pagina = ocorrencias_filtradas[offset:offset + page_size]

        return OcorrenciasPaginadas(
            total=total_itens,
            pagina=page,
            tamanho_pagina=page_size,
            total_paginas=total_paginas,
            ocorrencias=itens_pagina
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar consulta de ocorrências: {str(e)}"
        )


@app.get(
    "/api/v1/ocorrencias/resumo",
    response_model=ResumoEstatistico,
    summary="Resumo Estatístico de Ocorrências Urbanas",
    tags=["Segurança Pública (SSP-SP)"]
)
@app.get(
    "/api/ocorrencias/resumo",
    response_model=ResumoEstatistico,
    summary="Resumo Estatístico de Ocorrências Urbanas",
    tags=["Segurança Pública (SSP-SP)"]
)
async def resumo_estatistico_ocorrencias():
    """
    Retorna a contagem agregada de ocorrências por severidade,
    bairro com maior incidência e tipologia mais comum.
    """
    try:
        return obter_estatisticas_resumo()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular estatísticas: {str(e)}"
        )


@app.get(
    "/api/v1/alertas",
    summary="Feed consolidado de alertas com filtro por período",
    tags=["Alertas em tempo real"]
)
async def alertas_reais(
    data_inicio: datetime | None = Query(None, description="ISO 8601, ex.: 2026-09-01T00:00:00-03:00"),
    data_fim: datetime | None = Query(None, description="ISO 8601, ex.: 2026-09-14T23:59:59-03:00")
):
    if data_inicio and data_fim and data_inicio > data_fim:
        raise HTTPException(status_code=422, detail="data_inicio deve ser anterior a data_fim")
    return {
        "alertas": await live_data_service.alerts(data_inicio, data_fim),
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "filtros": {"data_inicio": data_inicio, "data_fim": data_fim}
    }


# ----------------------------------------------------
# ROTAS: SIMULAÇÃO PREDITIVA E CENÁRIOS URBANOS
# ----------------------------------------------------
@app.post(
    "/api/v1/simulacao/disparar",
    response_model=SimulacaoResult,
    summary="Disparar Incidente Simulado com Análise de IA",
    tags=["Simulador Urbano Preditivo"]
)
@app.post(
    "/api/simulacao/disparar",
    response_model=SimulacaoResult,
    summary="Disparar Incidente Simulado com Análise de IA",
    tags=["Simulador Urbano Preditivo"]
)
async def disparar_simulacao(req: CriarSimulacaoRequest):
    """
    Cria uma nova ocorrência simulada personalizada em São Paulo,
    registra no banco de dados e calcula o impacto preditivo com IA.
    """
    try:
        resultado = registrar_ocorrencia_simulada(req.model_dump())
        return resultado
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar simulação: {str(e)}"
        )


@app.post(
    "/api/v1/simulacao/cenario",
    summary="Disparar Cenário Preditivo Pré-Configurado",
    tags=["Simulador Urbano Preditivo"]
)
@app.post(
    "/api/simulacao/cenario",
    summary="Disparar Cenário Preditivo Pré-Configurado",
    tags=["Simulador Urbano Preditivo"]
)
async def disparar_cenario(req: SimulacaoCenarioRequest):
    """
    Dispara múltiplos eventos coordenados simulando crises urbanas:
    - `tempestade_marginal`: Tempestade e alagamentos severos
    - `arrastao_centro`: Alerta de roubo em massa na Sé
    - `aglomeracao_paulista`: Bloqueio da Av. Paulista
    - `pane_pinheiros`: Falha semafórica e acidentes em Pinheiros
    """
    try:
        resultados = disparar_cenario_pronto(req.cenario_id)
        return {
            "cenario_id": req.cenario_id,
            "eventos_gerados": len(resultados),
            "detalhes": resultados
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao disparar cenário: {str(e)}"
        )


@app.delete(
    "/api/v1/simulacao/limpar",
    summary="Limpar Ocorrências Simuladas",
    tags=["Simulador Urbano Preditivo"]
)
@app.delete(
    "/api/simulacao/limpar",
    summary="Limpar Ocorrências Simuladas",
    tags=["Simulador Urbano Preditivo"]
)
async def limpar_simulacoes():
    """Remove todos os eventos gerados por simulação, restaurando os dados base."""
    try:
        total_restante = limpar_ocorrencias_simuladas()
        return {
            "status": "SUCESSO",
            "mensagem": "Simulações removidas com sucesso.",
            "total_ocorrencias_ativas": total_restante
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar simulações: {str(e)}"
        )


# ----------------------------------------------------
# ROTAS: CHATBOT IA & AÇÕES ACIONÁVEIS
# ----------------------------------------------------
@app.post(
    "/api/v1/chat",
    response_model=ChatResponse,
    summary="Processar Mensagem do Usuário com IA & Ações",
    tags=["Assistente IA"]
)
@app.post(
    "/api/chat",
    response_model=ChatResponse,
    summary="Processar Mensagem do Usuário com IA & Ações",
    tags=["Assistente IA"]
)
async def chat_endpoint(req: ChatRequest):
    """
    Processa perguntas com IA (LLM/Groq/Gemini/OpenAI ou NLP Sentinel),
    reconhece intenções de controle da interface e gera comandos de ação.
    """
    try:
        resultado = await processar_mensagem_chat(req)
        return resultado
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no assistente de IA: {str(e)}"
        )


# ----------------------------------------------------
# SUPORTE A ARQUIVOS ESTÁTICOS E PÁGINAS HTML DA RAIZ
# ----------------------------------------------------
STATIC_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
css_dir = os.path.join(STATIC_ROOT, "css")
js_dir = os.path.join(STATIC_ROOT, "js")
data_dir = os.path.join(STATIC_ROOT, "data")

if os.path.exists(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")
if os.path.exists(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")
if os.path.exists(data_dir):
    app.mount("/data", StaticFiles(directory=data_dir), name="data")

@app.get("/", include_in_schema=False)
async def serve_index():
    index_path = os.path.join(STATIC_ROOT, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Sentinel IA API Online"}

@app.get("/{page_name}.html", include_in_schema=False)
async def serve_html_pages(page_name: str):
    page_path = os.path.join(STATIC_ROOT, f"{page_name}.html")
    if os.path.exists(page_path):
        return FileResponse(page_path)
    raise HTTPException(status_code=404, detail=f"Página '{page_name}.html' não encontrada")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
