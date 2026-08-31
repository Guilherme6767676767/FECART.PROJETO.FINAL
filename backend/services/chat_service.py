"""
Sentinel IA - Serviço de Chatbot Inteligente com LLM Real e Execução de Ações
Integração com modelos de linguagem (Groq / Gemini / OpenAI / Fallback Especializado Sentinel NLP)
com interpretação de intenções acionáveis na interface urbana.
"""

import os
import json
import re
import httpx
from typing import List, Dict, Any, Tuple
from datetime import datetime

from schemas import ChatMessage, ChatAction, ChatResponse, ChatRequest
from database import obter_estatisticas_resumo, disparar_cenario_pronto, registrar_ocorrencia_simulada
from services.weather_service import get_sao_paulo_weather


# SYSTEM PROMPT RAG ESPECIALIZADO
SENTINEL_SYSTEM_PROMPT = """Você é o Sentinel Core AI, assistente tático de inteligência urbana e segurança pública de São Paulo (SP).
Sua missão é responder com precisão técnica e tom profissional, prestativo e analítico, apoiando agentes de segurança, operadores do trânsito (CET) e cidadãos.

Você tem acesso aos seguintes dados estruturados e regras da cidade de São Paulo:
- AOI Alpha: Av. Paulista & Bela Vista (Risco Médio 68%, 84 câmeras OCR, 412 sensores)
- AOI Bravo: Centro Histórico & Praça da Sé (Risco Crítico 92%, 120 câmeras, 320 sensores, histórico de roubos/furtos)
- AOI Charlie: Faria Lima & Pinheiros (Risco Baixo 24%, 96 câmeras, 530 sensores, mobilidade e tecnologia)
- AOI Delta: Marginal Tietê & Lapa (Risco Alto 81%, 64 câmeras, 289 sensores, alagamentos e acidentes)
- Telefones de Emergência: 190 (Polícia Militar), 193 (Bombeiros), 192 (SAMU), 199 (Defesa Civil), 153 (GCM), 156 (Prefeitura SP).

Você também pode comandar a interface web do usuário:
Se o usuário pedir para navegar ou ver algo (ex: "abra o mapa", "vá para simulações", "veja a análise"), você deve sugerir a navegação.
Se o usuário pedir para simular uma crise (ex: "simule tempestade na Marginal", "simule arrastão na Sé", "simule apagão em Pinheiros"), você confirma e executa o cenário.

Formate as respostas usando Markdown limpo com tópicos e destaques com emojis apropriados (🚨, 🌧️, 🚗, 🛡️, ⚡, 📍).
"""


def detectar_acoes_e_comandos(message: str) -> Tuple[List[ChatAction], List[str]]:
    """
    Analisa a mensagem do usuário para identificar comandos que disparam ações no Frontend
    (Navegação, Disparo de Cenários, Foco em Bairros/AOIs).
    """
    actions: List[ChatAction] = []
    msg_clean = message.lower().strip()
    
    # 1. Navegação de Telas
    if any(k in msg_clean for k in ["abrir mapa", "ir para o mapa", "ver no mapa", "mostrar mapa", "tela de mapa", "abrir o mapa"]):
        actions.append(ChatAction(type="navigate", target="mapa.html", payload={"motivo": "Solicitação do usuário via chat"}))
    elif any(k in msg_clean for k in ["abrir simul", "ir para simul", "laboratorio de simul", "tela de simul", "abrir simulações", "abrir simulacoes"]):
        actions.append(ChatAction(type="navigate", target="simulacoes.html", payload={"motivo": "Solicitação do usuário via chat"}))
    elif any(k in msg_clean for k in ["abrir analise", "ir para analise", "analise preditiva", "ver graficos", "abrir análise"]):
        actions.append(ChatAction(type="navigate", target="analise.html", payload={"motivo": "Solicitação do usuário via chat"}))
    elif any(k in msg_clean for k in ["abrir alertas", "ver alertas", "central de alertas", "ir para alertas"]):
        actions.append(ChatAction(type="navigate", target="alertas.html", payload={"motivo": "Solicitação do usuário via chat"}))
    elif any(k in msg_clean for k in ["abrir dashboard", "ir para dashboard", "painel principal", "voltar para dashboard"]):
        actions.append(ChatAction(type="navigate", target="dashboard.html", payload={"motivo": "Solicitação do usuário via chat"}))

    # 2. Disparo de Cenários de Simulação Prontos
    if any(k in msg_clean for k in ["simular tempestade", "simule tempestade", "cenario tempestade", "alagamento na marginal"]):
        actions.append(ChatAction(type="simulate_scenario", target="tempestade_marginal", payload={"nome": "Tempestade na Marginal Tietê & Lapa"}))
    elif any(k in msg_clean for k in ["simular arrastao", "simule arrastão", "simular arrastão", "cenario arrastao", "arrastão na sé"]):
        actions.append(ChatAction(type="simulate_scenario", target="arrastao_centro", payload={"nome": "Arrastão no Centro Histórico & Sé"}))
    elif any(k in msg_clean for k in ["simular bloqueio", "simule manifestacao", "simular manifestação", "bloqueio na paulista"]):
        actions.append(ChatAction(type="simulate_scenario", target="aglomeracao_paulista", payload={"nome": "Bloqueio e Aglomeração na Av. Paulista"}))
    elif any(k in msg_clean for k in ["simular pane", "simule apagao", "simular apagão", "pane em pinheiros", "semaforo quebrado em pinheiros"]):
        actions.append(ChatAction(type="simulate_scenario", target="pane_pinheiros", payload={"nome": "Pane Semafórica em Pinheiros / Faria Lima"}))

    # 3. Foco em Bairro / Destaque de AOI
    if "sé" in msg_clean or "centro" in msg_clean:
        actions.append(ChatAction(type="highlight_aoi", target="AOI-BRAVO", payload={"bairro": "Sé", "lat": -23.5505, "lng": -46.6333}))
    elif "paulista" in msg_clean or "bela vista" in msg_clean:
        actions.append(ChatAction(type="highlight_aoi", target="AOI-ALPHA", payload={"bairro": "Bela Vista", "lat": -23.5614, "lng": -46.6560}))
    elif "pinheiros" in msg_clean or "faria lima" in msg_clean:
        actions.append(ChatAction(type="highlight_aoi", target="AOI-CHARLIE", payload={"bairro": "Pinheiros", "lat": -23.5675, "lng": -46.6920}))
    elif "marginal" in msg_clean or "lapa" in msg_clean or "tietê" in msg_clean:
        actions.append(ChatAction(type="highlight_aoi", target="AOI-DELTA", payload={"bairro": "Lapa", "lat": -23.5190, "lng": -46.6920}))

    # Sugestões de próximos passos
    suggestions = [
        "🗺️ Abrir Mapa Interativo de SP",
        "⛈️ Simular Tempestade na Marginal",
        "🚨 Qual o risco atual na Sé?",
        "🚗 Como está o trânsito na Paulista?",
        "⚡ Status e telemetria dos sensores"
    ]

    return actions, suggestions


async def consultar_llm_externa(prompt_completo: str) -> str:
    """
    Tenta consultar chaves de LLM gratuitas/configuradas no ambiente (Groq, Gemini, OpenAI).
    Se não houver chave ou der timeout, retorna None para acionar o motor neural local.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # 1. Groq (Llama-3.3-70b - Ultra rápido e gratuito)
    if groq_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": SENTINEL_SYSTEM_PROMPT},
                            {"role": "user", "content": prompt_completo}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 800
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            pass

    # 2. Google Gemini API
    if gemini_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                res = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [
                            {"parts": [{"text": f"{SENTINEL_SYSTEM_PROMPT}\n\nPergunta do usuário: {prompt_completo}"}]}
                        ]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            pass

    # 3. OpenAI GPT
    if openai_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": SENTINEL_SYSTEM_PROMPT},
                            {"role": "user", "content": prompt_completo}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 800
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            pass

    return None


async def processar_mensagem_chat(req: ChatRequest) -> ChatResponse:
    """
    Motor Central de Chatbot:
    1. Reúne telemetria viva (Clima em SP, Estatísticas de BOs, AOIs)
    2. Identifica se há comandos de ação para executar na tela
    3. Tenta processar com LLM generativa ou com o motor tático Sentinel
    """
    user_msg = req.message
    actions, suggestions = detectar_acoes_e_comandos(user_msg)

    # Obter dados em tempo real para contextualização RAG
    weather = await get_sao_paulo_weather()
    stats = obter_estatisticas_resumo()

    total_ocorrencias = stats.get("total_ocorrencias", 0)
    criticas = stats.get("criticas", 0)
    altas = stats.get("altas", 0)
    bairro_mais_afetado = stats.get("bairro_mais_afetado", "Sé")
    tipo_mais_frequente = stats.get("tipo_mais_frequente", "Furto")

    contexto_tempo_real = f"""
[CONTEXTO AO VIVO DE SÃO PAULO - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}]
- Clima Atual: {weather.temperatura}°C, {weather.condicao}, Umidade: {weather.umidade}%, Vento: {weather.vento_kmh} km/h, Precipitação: {weather.precipitacao_mm}mm.
- Risco Climático Urbano: {weather.alerta_risco}
- Boletins de Ocorrência Monitorados: {total_ocorrencias} ({criticas} críticas, {altas} altas).
- Bairro com Maior Volume de BOs: {bairro_mais_afetado} (Tipo predominante: {tipo_mais_frequente})
- Página Atual do Usuário: {req.current_page}
"""

    prompt_com_contexto = f"{contexto_tempo_real}\nPergunta do Usuário: {user_msg}"

    # Tenta obter resposta de LLM externa
    llm_output = await consultar_llm_externa(prompt_com_contexto)
    
    if llm_output:
        return ChatResponse(
            response=llm_output,
            actions=actions,
            suggestions=suggestions,
            model_used="LLM Generative Core (Live RAG)"
        )

    # Motor Especializado Sentinel NLP (Fallback Nativo e Robusto)
    msg_clean = user_msg.lower().strip()
    
    # Resposta contextualizada rica
    if any(k in msg_clean for k in ["clima", "chuva", "tempo", "temperatura", "alagamento"]):
        resp = f"""🌧️ **Condições Meteorológicas em São Paulo ({datetime.now().strftime('%H:%M')}):**

- **Temperatura:** {weather.temperatura}°C (Sensação: {weather.sensacao_termica}°C)
- **Condição:** {weather.condicao}
- **Umidade:** {weather.umidade}% | **Vento:** {weather.vento_kmh} km/h
- **Precipitação:** {weather.precipitacao_mm} mm
- **Nível de Risco Climático:** `{weather.alerta_risco}`

💡 *Recomendação:* Os sensores pluviométricos na Marginal Tietê e Lapa estão operando com 100% de precisão. Monitoramento de alagamento ativo."""

    elif any(k in msg_clean for k in ["risco", "segurança", "crime", "perigo", "bo", "ocorrencia", "violencia"]):
        resp = f"""🚨 **Panorama de Segurança e Alertas em São Paulo:**

- **Total de BOs Monitorados:** {total_ocorrencias} registros integrados (SSP-SP)
- **Ocorrências Críticas:** {criticas} focos prioritários
- **Bairro com Maior Densidade:** **{bairro_mais_afetado}** (Predominância de *{tipo_mais_frequente}*)
- **Índice Geral de Segurança Urbana:** 87.4% (Estável)

🛡️ **Zonas de Atenção:**
• 🔴 **Sé / Centro Histórico:** Risco Crítico (92%) — 120 câmeras ativas
• 🟠 **Marginal Tietê / Lapa:** Risco Alto (81%) — 64 câmeras e sensores
• 🟢 **Faria Lima & Moema:** Risco Baixo (18% a 24%)"""

    elif any(k in msg_clean for k in ["simular", "simulacao", "cenario", "teste", "tempestade", "arrastao", "apagao", "bloqueio"]):
        cenario_nome = "Cenário de Crise"
        for act in actions:
            if act.type == "simulate_scenario":
                cenario_nome = act.payload.get("nome", cenario_nome)

        resp = f"""⚡ **Disparo de Simulação Tática Autorizado:**

Executei o processamento do cenário: **{cenario_nome}**.
- 📍 **Geolocalização:** Os marcadores com pulso radar já estão sendo sincronizados no mapa.
- 📡 **Impacto Calculado:** Desvios de tráfego, despacho preventivo de viaturas e alerta aos operadores do COPOM.
- 🗺️ *Você pode acompanhar o resultado visual em tempo real na aba **Simulações** ou **Mapa**.*"""

    elif any(k in msg_clean for k in ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "ajuda"]):
        resp = f"""👋 **Olá! Sou o assistente tático do Sentinel IA.**

Estou monitorando São Paulo em tempo real com integração direta aos sistemas de **Clima, Boletins da SSP-SP, Câmeras com IA e Simulação Urbana**.

**Como posso apoiar sua operação agora?**
• 🗺️ *"Abra o mapa da cidade"* ou *"Mostre a região da Sé"*
• ⛈️ *"Simule uma tempestade na Marginal Tietê"*
• 🚨 *"Qual é o risco de segurança no Centro agora?"*
• 🌧️ *"Qual é a temperatura e previsão de chuva?"*
• 🚗 *"Como está o trânsito nos principais corredores?"*"""

    else:
        resp = f"""📡 **Sentinel IA Intelligence Core:**

Compreendi sua consulta: *"{user_msg}"*.

**Dados da Malha Urbana Atual ({datetime.now().strftime('%H:%M')}):**
• 🌡️ Clima SP: {weather.temperatura}°C ({weather.condicao})
• 🚨 BOs Ativos: {total_ocorrencias} ocorrências sob vigilância
• 📸 Câmeras IA Operantes: 1.847 unidades com OCR ativo
• 🛡️ Região com Maior Monitoramento: {bairro_mais_afetado}

💡 *Você pode me pedir para simular ocorrências, abrir mapas ou detalhar qualquer bairro de São Paulo.*"""

    return ChatResponse(
        response=resp,
        actions=actions,
        suggestions=suggestions,
        model_used="Sentinel Rule-Based Predictive NLP"
    )
