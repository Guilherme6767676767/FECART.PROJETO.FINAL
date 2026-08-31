import os
import math
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import (
    WeatherResponse, 
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
from services.weather_service import get_sao_paulo_weather
from services.chat_service import processar_mensagem_chat

load_dotenv()

app = FastAPI(
    title="Sentinel IA — Backend API",
    description="Sistema de Inteligência Preditiva Urbana e Segurança Pública para São Paulo",
    version="1.0.0"
)

# ----------------------------------------------------
# CONFIGURAÇÃO DE CORS
# ----------------------------------------------------
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3000"
)
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------
# ROTAS: CLIMA E MEIO AMBIENTE
# ----------------------------------------------------
@app.get(
    "/api/v1/clima",
    response_model=WeatherResponse,
    summary="Obter Clima Atual de São Paulo em Tempo Real",
    tags=["Clima & Meio Ambiente"]
)
async def obter_clima(
    force_refresh: bool = Query(False, description="Forçar atualização ignorando o cache TTL")
):
    """
    Retorna a telemetria climática em tempo real para São Paulo:
    - Temperatura e Sensação Térmica
    - Umidade, Vento e Precipitação (Chuva)
    - Condição visual e Índice Preditivo de Risco Urbano
    """
    try:
        dados_clima = await get_sao_paulo_weather(force_refresh=force_refresh)
        return dados_clima
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha no serviço meteorológico: {str(e)}"
        )


# ----------------------------------------------------
# ROTAS: SEGURANÇA PÚBLICA (SSP-SP)
# ----------------------------------------------------
@app.get(
    "/api/v1/ocorrencias",
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
    page_size: int = Query(5, ge=1, le=50, description="Quantidade de registros por página")
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


# ----------------------------------------------------
# ROTAS: SIMULAÇÃO PREDITIVA E CENÁRIOS URBANOS
# ----------------------------------------------------
@app.post(
    "/api/v1/simulacao/disparar",
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
# ROTAS: HEALTHCHECK & STATUS DO SISTEMA
# ----------------------------------------------------
@app.get("/health", tags=["Sistema"])
async def health_check():
    return {
        "status": "ONLINE",
        "system": "Sentinel IA Core Engine",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
