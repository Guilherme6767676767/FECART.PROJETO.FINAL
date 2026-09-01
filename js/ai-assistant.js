/* ============================================
   SENTINEL IA — Assistente Virtual Inteligente v3.0
   Integração com Backend FastAPI (/api/v1/chat),
   Modelos LLM (RAG com Telemetria Viva),
   Execução de Ações Táticas no Frontend e NLP Local
   ============================================ */

(function () {
  'use strict';

  const BACKEND_URL = window.SENTINEL_BACKEND_URL || 'http://localhost:8000';

  // ══════════════════════════════════════════════
  //  MEMÓRIA CONVERSACIONAL
  // ══════════════════════════════════════════════
  const conversationMemory = {
    history: [],       // { role: 'user'|'assistant', content: string }
    lastTopic: null,
    userName: null,
    questionsAsked: 0,
    sessionStart: new Date()
  };

  // ══════════════════════════════════════════════
  //  BASE DE CONHECIMENTO LOCAL (FALLBACK SE BACKEND OFFLINE)
  // ══════════════════════════════════════════════
  const KNOWLEDGE_BASE = {
    about: {
      name: 'Sentinel IA',
      version: '3.3.0',
      description: 'Sistema de Inteligência Preditiva Urbana para a cidade de São Paulo, integrando segurança, mobilidade, clima e infraestrutura.',
      modules: ['Dashboard de Controle', 'Mapa Geoespacial Interativo', 'Análise Preditiva com IA', 'Central de Alertas', 'Laboratório de Simulação Urbana'],
      cameras: 1847,
      sensors: 3421
    },
    neighborhoods: {
      'sé': { name: 'Sé / Centro Histórico', risk: 'CRÍTICO', riskScore: 92, highlights: 'Catedral da Sé, Pátio do Colégio. Alta incidência de furtos e aglomerações.', patrol: 'Patrulhamento 24h com apoio de 120 câmeras IA.' },
      'bela vista': { name: 'Bela Vista / Av. Paulista', risk: 'MÉDIO', riskScore: 68, highlights: 'MASP, Parque Trianon. Corredor financeiro com fluxo intenso.', patrol: '84 câmeras de reconhecimento facial ativas na Av. Paulista.' },
      'pinheiros': { name: 'Pinheiros / Faria Lima', risk: 'BAIXO', riskScore: 24, highlights: 'Polo tecnológico e corporativo. Beco do Batman, Largo da Batata.', patrol: '96 câmeras OCR de leitura de placas e 530 sensores IoT ativos.' },
      'lapa': { name: 'Lapa / Marginal Tietê', risk: 'ALTO', riskScore: 81, highlights: 'Via expressa de tráfego pesado. Risco de alagamento e acidentes.', patrol: '64 câmeras e 289 sensores monitoram tráfego e nível hidrológico.' },
      'moema': { name: 'Moema / Ibirapuera', risk: 'BAIXO', riskScore: 18, highlights: 'Parque Ibirapuera, região residencial premium. Segurança elevada.', patrol: 'Rondas preventivas da Guarda Urbana.' }
    }
  };

  // ══════════════════════════════════════════════
  //  EXECUTOR DE AÇÕES TÁTICAS NO FRONTEND
  // ══════════════════════════════════════════════
  function executeActions(actions) {
    if (!actions || !Array.isArray(actions) || actions.length === 0) return;

    actions.forEach(action => {
      console.log('⚡ Executando Ação Tática do Chatbot:', action);

      // 1. Navegação de Página
      if (action.type === 'navigate' && action.target) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== action.target) {
          showActionNotification(`🚀 Navegando para ${action.target.replace('.html', '').toUpperCase()}...`);
          setTimeout(() => {
            window.location.href = action.target;
          }, 1200);
        }
      }

      // 2. Disparar Cenário de Simulação (se estiver em simulacoes.html ou simular globalmente)
      if (action.type === 'simulate_scenario' && action.target) {
        showActionNotification(`⚡ Disparando cenário: ${action.payload?.nome || action.target}`);
        
        if (typeof window.triggerScenario === 'function') {
          window.triggerScenario(action.target);
        } else {
          // Se não estiver na página de simulação, pode salvar no sessionStorage ou redirecionar
          sessionStorage.setItem('pending_scenario', action.target);
          showActionNotification(`📍 Redirecionando para o Laboratório de Simulação...`);
          setTimeout(() => {
            window.location.href = 'simulacoes.html';
          }, 1400);
        }
      }

      // 3. Destacar Bairro / AOI no Mapa
      if (action.type === 'highlight_aoi' && action.payload) {
        const { lat, lng, bairro } = action.payload;
        showActionNotification(`🎯 Focando no mapa: ${bairro || action.target}`);
        
        // Se o mapa do Leaflet existir globalmente
        if (window.map && typeof window.map.panTo === 'function') {
          window.map.panTo([lat, lng], { animate: true, duration: 1.5 });
        } else if (typeof window.setSimulationPin === 'function') {
          window.setSimulationPin(lat, lng);
        }
      }
    });
  }

  function showActionNotification(text) {
    const toast = document.createElement('div');
    toast.className = 'ai-action-toast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(6, 10, 20, 0.95);
      border: 1px solid #00e5ff;
      color: #00e5ff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 229, 255, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.3s ease;
    `;
    toast.innerHTML = `<span>⚡</span> ${text}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  const OUT_OF_SCOPE_MSG = "Desculpe, sou o assistente virtual do Sentinel IA e só posso responder a perguntas relacionadas às funcionalidades, relatórios e dados da nossa plataforma de inteligência preditiva urbana.";

  function isSentinelScope(text) {
    const q = text.toLowerCase().trim();
    const longKeywords = [
      "sentinel", "plataforma", "sistema", "dashboard", "painel",
      "mapa", "analise", "análise", "alerta", "alertas", "simulac", "simulaç", "cenario", "cenário",
      "relatorio", "relatório", "funcionalidade", "login", "cadastro", "usuario", "usuário", "admin",
      "são paulo", "sao paulo", "bairro", "perimetro", "perímetro",
      "paulista", "bela vista", "pinheiros", "faria lima", "lapa", "marginal",
      "tietê", "tiete", "moema", "ibirapuera", "jardins", "santana", "tatuape", "tatuapé",
      "boletim", "boletins", "ocorrencia", "ocorrência", "crime", "furto", "roubo",
      "seguranca", "segurança", "risco", "policia", "polícia", "viatura", "patrulha",
      "transito", "trânsito", "semaforo", "semáforo",
      "clima", "chuva", "tempo", "temperatura", "umidade", "vento", "precipitacao", "precipitação",
      "alagamento", "enchente", "inundacao", "inundação", "pluviometro", "pluviômetro",
      "defesa civil", "samu", "bombeiro", "emergencia", "emergência",
      "camera", "câmera", "sensor", "telemetria", "preditiv", "estatistica", "estatística",
      "bom dia", "boa tarde", "boa noite", "quem é você", "quem e voce",
      "o que você faz", "o que voce faz", "comandos", "como funciona",
      "como usar"
    ];
    if (longKeywords.some(k => q.includes(k))) return true;

    const shortRegexes = [
      /\bia\b/i, /\bsp\b/i, /\bbo\b/i, /\bbos\b/i, /\baoi\b/i, /\baois\b/i, /\bsé\b/i,
      /\bzona\b/i, /\bzonas\b/i, /\bssp\b/i, /\bpm\b/i, /\bgcm\b/i, /\bcet\b/i,
      /\biot\b/i, /\bocr\b/i, /\bdados\b/i, /\bola\b/i, /\bolá\b/i, /\boi\b/i,
      /\bajuda\b/i, /\bstatus\b/i, /\bversao\b/i, /\bversão\b/i, /\bmapas\b/i,
      /\babrir\b/i, /\bmostrar\b/i, /\bsimular\b/i, /\bsimule\b/i
    ];
    return shortRegexes.some(rx => rx.test(q));
  }

  // ══════════════════════════════════════════════
  //  MOTOR CENTRAL: BACKEND FASTAPI OU NLP LOCAL
  // ══════════════════════════════════════════════
  async function queryChatEngine(userMessage) {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Verificação de escopo estrito prévia
    if (!isSentinelScope(userMessage)) {
      return {
        text: OUT_OF_SCOPE_MSG,
        model: 'Sentinel Scope Guard'
      };
    }

    // 1. Tenta chamar o Endpoint do Backend FastAPI (/api/v1/chat)
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationMemory.history.slice(-6),
          current_page: currentPage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Executar ações se houver
        if (data.actions && data.actions.length > 0) {
          executeActions(data.actions);
        }

        // Atualizar chips se sugerido
        if (data.suggestions && data.suggestions.length > 0) {
          updatePromptChips(data.suggestions);
        }

        return {
          text: formatMarkdownToHTML(data.response),
          model: data.model_used || 'Sentinel Backend AI'
        };
      }
    } catch (err) {
      console.warn('Backend FastAPI indisponível, usando motor neural local Sentinel:', err);
    }

    // 2. Fallback Especializado: Motor NLP Local com Detecção de Ações
    return generateLocalResponseWithActions(userMessage);
  }

  // Fallback Local Inteligente
  function generateLocalResponseWithActions(query) {
    const q = query.toLowerCase().trim();

    if (!isSentinelScope(query)) {
      return {
        text: OUT_OF_SCOPE_MSG,
        model: 'Sentinel Scope Guard'
      };
    }

    const actions = [];

    // Comandos de ação locais
    if (q.includes('abrir mapa') || q.includes('ver no mapa')) {
      actions.push({ type: 'navigate', target: 'mapa.html' });
    } else if (q.includes('simular') || q.includes('simulacao') || q.includes('simulação')) {
      if (q.includes('tempestade')) actions.push({ type: 'simulate_scenario', target: 'tempestade_marginal', payload: { nome: 'Tempestade na Marginal' } });
      else if (q.includes('arrastao') || q.includes('arrastão')) actions.push({ type: 'simulate_scenario', target: 'arrastao_centro', payload: { nome: 'Arrastão no Centro' } });
      else actions.push({ type: 'navigate', target: 'simulacoes.html' });
    } else if (q.includes('abrir alerta') || q.includes('ver alerta')) {
      actions.push({ type: 'navigate', target: 'alertas.html' });
    } else if (q.includes('abrir analise') || q.includes('abrir análise')) {
      actions.push({ type: 'navigate', target: 'analise.html' });
    } else if (q.includes('abrir dashboard')) {
      actions.push({ type: 'navigate', target: 'dashboard.html' });
    }

    if (actions.length > 0) {
      executeActions(actions);
    }

    let resp = '';
    if (q.includes('aoi') || q.includes('zona') || q.includes('perimetro')) {
      resp = `🗺️ <strong>Áreas de Interesse (AOIs) Ativas em São Paulo:</strong><br><br>
        • <strong>AOI Alpha (Av. Paulista):</strong> Risco 68% • 84 Câmeras • 412 Sensores<br>
        • <strong>AOI Bravo (Sé / Centro):</strong> Risco 92% (Crítico) • 120 Câmeras • 320 Sensores<br>
        • <strong>AOI Charlie (Faria Lima):</strong> Risco 24% • 96 Câmeras • 530 Sensores<br>
        • <strong>AOI Delta (Marginal Tietê):</strong> Risco 81% • 64 Câmeras • 289 Sensores<br><br>
        💡 <em>Diga "abra o mapa" para visualizar as camadas em tempo real!</em>`;
    } else if (q.includes('risco') || q.includes('segur') || q.includes('crime') || q.includes('bo')) {
      resp = `🚨 <strong>Relatório Tático de Segurança Urbana:</strong><br><br>
        • <strong>Foco Crítico:</strong> Praça da Sé e Centro Histórico (Risco 92/100)<br>
        • <strong>Foco Alto:</strong> Marginal Tietê e Lapa (Risco 81/100)<br>
        • <strong>Zonas Estáveis:</strong> Moema (18/100), Jardins (15/100), Pinheiros (24/100)<br>
        • <strong>Status Operacional:</strong> 1.847 câmeras com inteligência OCR monitorando em tempo real.`;
    } else if (q.includes('tempestade') || q.includes('chuva') || q.includes('clima') || q.includes('temperatura')) {
      resp = `🌧️ <strong>Monitoramento Meteorológico de São Paulo:</strong><br><br>
        • Temperatura: 24.4°C • Umidade: 62% • Vento: 14 km/h<br>
        • <strong>Risco Pluviométrico:</strong> MODERADO nas Marginais Tietê e Pinheiros<br>
        • Sensores IoT operando para alerta preventivo de alagamento.`;
    } else if (q.includes('ola') || q.includes('olá') || q.includes('oi') || q.includes('bom dia') || q.includes('boa tarde') || q.includes('boa noite') || q.includes('ajuda')) {
      resp = `👋 <strong>Olá! Sou o assistente de IA do Sentinel IA.</strong><br><br>
        Posso auxiliá-lo com consultas preditivas, relatórios táticos de segurança e controle da plataforma.<br><br>
        • 🗺️ <em>"Abrir o mapa de SP"</em><br>
        • 🚨 <em>"Qual é o risco de segurança na Sé?"</em><br>
        • ⛈️ <em>"Simular tempestade na Marginal"</em><br>
        • 📊 <em>"Abrir tela de análise"</em>`;
    } else {
      resp = `📡 <strong>Sentinel IA Intelligence Core:</strong><br><br>
        Consulta processada sobre a malha de São Paulo: <em>"${escapeHTML(query)}"</em>.<br><br>
        • 🛡️ <strong>Monitoramento Ativo:</strong> 1.847 Câmeras IA & 3.421 Sensores IoT<br>
        • 📍 <strong>Zonas de Cobertura:</strong> Sé, Paulista, Pinheiros e Lapa<br>
        • 💡 <em>Solicite comandos de navegação ou simulações táticas.</em>`;
    }

    return {
      text: resp,
      model: 'Sentinel Local NLP Engine'
    };
  }

  function formatMarkdownToHTML(md) {
    if (!md) return '';
    let html = md
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,229,255,0.12);color:var(--cyan,#00e5ff);padding:2px 6px;border-radius:4px;font-family:var(--font-mono, monospace);font-size:0.85em;">$1</code>')
      .replace(/^### (.*$)/gim, '<h5 style="color:var(--cyan,#00e5ff);margin:0.5rem 0 0.2rem;font-size:0.95rem;">$1</h5>')
      .replace(/^## (.*$)/gim, '<h4 style="color:#fff;margin:0.6rem 0 0.3rem;font-size:1rem;">$1</h4>')
      .replace(/^# (.*$)/gim, '<h3 style="color:#fff;margin:0.8rem 0 0.4rem;font-size:1.1rem;">$1</h3>')
      .replace(/^\s*[-•]\s+(.*)$/gim, '<div style="display:flex;gap:6px;margin:3px 0;"><span>•</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    return html;
  }

  function updatePromptChips(suggestions) {
    const container = document.getElementById('aiPromptChips');
    if (!container || !suggestions || suggestions.length === 0) return;

    container.innerHTML = suggestions.slice(0, 6).map(s => `
      <button class="ai-chip-btn" data-prompt="${s}">${s}</button>
    `).join('');

    // Re-bind click events
    container.querySelectorAll('.ai-chip-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });
  }

  function getTimeString() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getGreetingByTime() {
    const h = new Date().getHours();
    if (h < 6) return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  // ══════════════════════════════════════════════
  //  INJETAR DOM DO CHATBOT
  // ══════════════════════════════════════════════
  function injectChatbotDOM() {
    if (document.getElementById('aiChatLauncher')) return;

    const launcher = document.createElement('button');
    launcher.id = 'aiChatLauncher';
    launcher.className = 'ai-chat-launcher';
    launcher.setAttribute('aria-label', 'Abrir Assistente de IA');
    launcher.innerHTML = `
      <i data-lucide="bot" style="width:24px;height:24px;"></i>
      <span class="ai-chat-launcher-badge"></span>
    `;

    const drawer = document.createElement('div');
    drawer.id = 'aiChatDrawer';
    drawer.className = 'ai-chat-drawer';
    drawer.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-title">
          <div class="ai-avatar-icon">
            <i data-lucide="sparkles" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <h4>Sentinel IA Assistant</h4>
            <span><span class="live-dot" style="width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block;animation:live-pulse 1.5s ease-in-out infinite;"></span> Núcleo de Inteligência Urbana</span>
          </div>
        </div>
        <button class="btn-icon" id="aiChatClose" style="width:28px;height:28px;background:transparent;border:none;color:#8b9dc3;cursor:pointer;">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </button>
      </div>

      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg-row bot">
          <div class="ai-msg-bubble">
            👋 ${getGreetingByTime()}! Sou o assistente oficial do <strong>Sentinel IA</strong>.<br><br>
            Estou conectado em tempo real aos sistemas de <strong>Segurança Urbana, Clima, Câmeras IA e Simulação Preditiva</strong> de São Paulo.<br><br>
            Como posso apoiar sua operação hoje?
          </div>
        </div>
      </div>

      <div class="ai-prompt-chips" id="aiPromptChips">
        <button class="ai-chip-btn" data-prompt="Abra o mapa de São Paulo">🗺️ Abrir Mapa</button>
        <button class="ai-chip-btn" data-prompt="Qual é o risco de segurança na Sé agora?">🚨 Risco na Sé</button>
        <button class="ai-chip-btn" data-prompt="Simule uma tempestade na Marginal Tietê">⛈️ Simular Tempestade</button>
        <button class="ai-chip-btn" data-prompt="Como está a temperatura e chuva em SP?">🌧️ Clima em SP</button>
        <button class="ai-chip-btn" data-prompt="Quais são as Áreas de Interesse (AOIs)?">📍 Zonas AOI</button>
        <button class="ai-chip-btn" data-prompt="Abrir a central de alertas">⚡ Ver Alertas</button>
      </div>

      <div class="ai-chat-footer">
        <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Comande a IA ou faça uma pergunta sobre a plataforma..." autocomplete="off" />
        <button id="aiChatSend" class="ai-chat-send-btn" aria-label="Enviar Pergunta">
          <i data-lucide="send" style="width:16px;height:16px;"></i>
        </button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // ══════════════════════════════════════════════
  //  ENVIAR MENSAGEM
  // ══════════════════════════════════════════════
  async function sendMessage(text) {
    if (!text || !text.trim()) return;

    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Adiciona Mensagem do Usuário
    const userRow = document.createElement('div');
    userRow.className = 'ai-msg-row user';
    userRow.innerHTML = `
      <div class="ai-msg-bubble">
        ${escapeHTML(text)}
        <div class="ai-msg-time">${getTimeString()}</div>
      </div>
    `;
    chatBody.appendChild(userRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    conversationMemory.history.push({ role: 'user', content: text });

    // Mostra indicador de digitação
    const typingRow = document.createElement('div');
    typingRow.className = 'ai-msg-row bot';
    typingRow.id = 'aiTypingIndicator';
    typingRow.innerHTML = `
      <div class="ai-msg-bubble" style="padding:6px 12px;">
        <div class="ai-typing-indicator">
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
        </div>
      </div>
    `;
    chatBody.appendChild(typingRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Consulta ao Motor de IA (FastAPI ou Local)
    const result = await queryChatEngine(text);

    typingRow.remove();

    const botRow = document.createElement('div');
    botRow.className = 'ai-msg-row bot';
    botRow.innerHTML = `
      <div class="ai-msg-bubble">
        ${result.text}
        <div class="ai-msg-time">${getTimeString()} • ${result.model}</div>
      </div>
    `;
    chatBody.appendChild(botRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    conversationMemory.history.push({ role: 'assistant', content: result.text });

    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (sendBtn) sendBtn.disabled = false;

    if (window.lucide) lucide.createIcons();
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════
  //  BIND DE EVENTOS
  // ══════════════════════════════════════════════
  function initChatbotEvents() {
    injectChatbotDOM();

    const launcher = document.getElementById('aiChatLauncher');
    const drawer = document.getElementById('aiChatDrawer');
    const closeBtn = document.getElementById('aiChatClose');
    const sendBtn = document.getElementById('aiChatSend');
    const input = document.getElementById('aiChatInput');
    const chips = document.querySelectorAll('.ai-chip-btn');

    if (launcher && drawer) {
      launcher.addEventListener('click', function () {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open') && input) {
          input.focus();
        }
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', function () {
        drawer.classList.remove('open');
      });
    }

    if (sendBtn && input) {
      sendBtn.addEventListener('click', function () {
        const val = input.value;
        input.value = '';
        sendMessage(val);
      });

      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          const val = input.value;
          input.value = '';
          sendMessage(val);
        }
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });

    // Atalhos Ctrl+K e Esc
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (drawer) {
          drawer.classList.toggle('open');
          if (drawer.classList.contains('open') && input) input.focus();
        }
      }
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
    });

    // Se houver cenário pendente de redirecionamento no sessionStorage
    const pendingScenario = sessionStorage.getItem('pending_scenario');
    if (pendingScenario) {
      sessionStorage.removeItem('pending_scenario');
      setTimeout(() => {
        if (typeof window.triggerScenario === 'function') {
          window.triggerScenario(pendingScenario);
        }
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbotEvents);
  } else {
    initChatbotEvents();
  }

})();
