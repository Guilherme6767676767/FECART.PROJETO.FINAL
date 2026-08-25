/* ============================================
   SENTINEL IA — Assistente Virtual Interativo
   Chatbot de IA com Perguntas e Respostas em Tempo Real
   ============================================ */

(function () {
  'use strict';

  // ── Inject Chatbot DOM Elements into Page ──
  function injectChatbotDOM() {
    if (document.getElementById('aiChatLauncher')) return;

    // Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'aiChatLauncher';
    launcher.className = 'ai-chat-launcher';
    launcher.setAttribute('aria-label', 'Abrir Assistente de IA');
    launcher.innerHTML = `
      <i data-lucide="bot" style="width:24px;height:24px;"></i>
      <span class="ai-chat-launcher-badge"></span>
    `;

    // Drawer / Window
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
            <span><span class="live-dot" style="width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block;"></span> IA Conectada • Tempo Real</span>
          </div>
        </div>
        <button class="btn-icon" id="aiChatClose" style="width:28px;height:28px;background:transparent;border:none;color:#aaa;cursor:pointer;">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </button>
      </div>

      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg-row bot">
          <div class="ai-msg-bubble">
            👋 Olá! Sou o assistente de inteligência artificial do <strong>Sentinel IA</strong>. <br><br>
            Como posso ajudar com informações sobre <strong>segurança, trânsito, clima ou leitura de câmeras</strong> em São Paulo agora?
          </div>
        </div>
      </div>

      <div class="ai-prompt-chips" id="aiPromptChips">
        <button class="ai-chip-btn" data-prompt="Quais são as Áreas de Interesse (AOIs) no mapa?">🗺️ AOIs Geoespaciais</button>
        <button class="ai-chip-btn" data-prompt="Qual o status e latência da API em tempo real?">⚡ Status da API</button>
        <button class="ai-chip-btn" data-prompt="Quais são as áreas com maior risco agora em São Paulo?">🚨 Riscos em SP</button>
        <button class="ai-chip-btn" data-prompt="Como está o trânsito nas Marginais e Av. Paulista?">🚗 Trânsito Paulista</button>
        <button class="ai-chip-btn" data-prompt="Existe risco de chuva ou alagamento hoje em SP?">🌧️ Chuva & Clima</button>
        <button class="ai-chip-btn" data-prompt="Quais as zonas mais seguras para patrulhamento?">🛡️ Zonas Seguras</button>
        <button class="ai-chip-btn" data-prompt="Como funcionam as câmeras OCR com Inteligência Artificial?">🤖 Câmeras IA OCR</button>
      </div>

      <div class="ai-chat-footer">
        <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Faça uma pergunta para a IA..." autocomplete="off" />
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

  // Helper de hora
  function getTimeString() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Knowledge Base e Motor de Respostas da IA ──
  function generateAIResponse(query) {
    const q = query.toLowerCase().trim();

    // 🗺️ Perguntas sobre AOI (Área de Interesse Geoespacial)
    if (q.includes('aoi') || q.includes('área de interesse') || q.includes('area de interesse') || q.includes('perimetro') || q.includes('poligono')) {
      return `
        🗺️ <strong>Áreas de Interesse Geoespacial (AOIs Ativas):</strong><br><br>
        • <strong>AOI Alpha (Av. Paulista):</strong> Risco 68% (Médio) • 84 Câmeras • 412 Sensores<br>
        • <strong>AOI Bravo (Centro & Sé):</strong> Risco 92% (Crítico) • 120 Câmeras • 320 Sensores<br>
        • <strong>AOI Charlie (Faria Lima):</strong> Risco 24% (Baixo) • 96 Câmeras • 530 Sensores<br>
        • <strong>AOI Delta (Marginal Tietê):</strong> Risco 81% (Alto) • 64 Câmeras • 289 Sensores<br><br>
        💡 <em>Você pode visualizar os polígonos geoespaciais translúcidos diretamente no Mapa Interativo!</em>
      `;
    }

    // ⚡ Perguntas sobre API / Status / Telemetria
    if (q.includes('api') || q.includes('status') || q.includes('ping') || q.includes('conexao') || q.includes('servidor')) {
      const telem = window.SentinelAPI ? window.SentinelAPI.fetchSystemTelemetry() : { apiStatus: '200 OK', latency: '14ms', activeModels: 4 };
      return `
        ⚡ <strong>Status da API & Telemetria em Tempo Real:</strong><br><br>
        • <strong>Status REST/WebSocket API:</strong> <span style="color:#10b981;">${telem.apiStatus}</span><br>
        • <strong>Latência da Rede:</strong> ${telem.latency}<br>
        • <strong>Vazão de Processamento:</strong> 4.8 GB/s<br>
        • <strong>Modelos IA Ativos:</strong> ${telem.activeModels} (CNN, LSTM, Transformers, Autoencoders)<br>
        • <strong>Frames Processados Hoje:</strong> 2.415.800+
      `;
    }

    // 🚨 Perguntas sobre Risco / Crime / Emergência / Vermelho
    if (q.includes('risco') || q.includes('crime') || q.includes('assalto') || q.includes('perigo') || q.includes('vermelho') || q.includes('emergencia')) {
      return `
        🚨 <strong>Relatório de Alertas de Risco (Zona Vermelha):</strong><br><br>
        • <strong>Pontos com maior atenção agora:</strong> Praça da Sé (Centro), Estação Luz, Calçadão de Osasco e Terminal Grajaú.<br>
        • <strong>Status:</strong> Há 7 alertas prioritários ativos sob monitoramento em tempo real pelas câmeras de IA.<br>
        • <strong>Recomendação da IA:</strong> Redobrar a atenção nessas regiões e acionar patrulhamento ostensivo via painel de Alertas.
      `;
    }

    // 🚗 Perguntas sobre Trânsito / Marginais / Paulista / Amarelo
    if (q.includes('transito') || q.includes('trânsito') || q.includes('marginal') || q.includes('paulista') || q.includes('carro') || q.includes('amarelo')) {
      return `
        🚗 <strong>Situação do Trânsito & Mobilidade (Zona Amarela):</strong><br><br>
        • <strong>Av. Paulista:</strong> Tráfego com fluxo moderado a lento próximo ao MASP e Consolação.<br>
        • <strong>Marginais Tietê e Pinheiros:</strong> Retenções pontuais na altura da Ponte da Lapa e Santo Amaro devido a obras.<br>
        • <strong>Tempo médio de deslocamento:</strong> 18 min adicionais nos corredores principais.<br>
        • <strong>Recomendação da IA:</strong> Utilizar a Av. Rebouças ou transporte sobre trilhos como alternativa fluida.
      `;
    }

    // 🌧️ Perguntas sobre Clima / Chuva / Alagamento / Azul
    if (q.includes('chuva') || q.includes('clima') || q.includes('tempo') || q.includes('alagamento') || q.includes('azul') || q.includes('temperatura')) {
      return `
        🌧️ <strong>Monitoramento Climatológico & Hidrográfico (Zona Azul):</strong><br><br>
        • <strong>Temperatura Atual:</strong> 26°C com umidade relativa do ar em 48%.<br>
        • <strong>Alertas Pluviométricos:</strong> Chuvas isoladas registradas na Zona Sul (Interlagos e Parelheiros) com volume de 28mm.<br>
        • <strong>Risco de Alagamento:</strong> Baixo a moderado próximo ao córrego Anhaia Mello (Mooca).<br>
        • <strong>Recomendação da IA:</strong> Sensores ambientais operando normalmente com 100% de precisão.
      `;
    }

    // 🤖 Perguntas sobre Câmeras / OCR / IA / Roxo
    if (q.includes('camera') || q.includes('câmera') || q.includes('ocr') || q.includes('placa') || q.includes('ia') || q.includes('roxo')) {
      return `
        🤖 <strong>Tecnologia & Leitura IA OCR (Zona Roxa):</strong><br><br>
        • <strong>Câmeras Ativas:</strong> 1.847 equipamentos analíticos conectados em tempo real.<br>
        • <strong>Locais com Leitura Automática de Placas:</strong> Av. Paulista, Faria Lima, Arena Corinthians e Paço de Santo André.<br>
        • <strong>Funcionalidade:</strong> O algoritmo de Deep Learning reconhece veículos com restrição e alerta a central em menos de 1,2 segundos.
      `;
    }

    // 🛡️ Perguntas sobre Zonas Seguras / Patrulha / Verde
    if (q.includes('segur') || q.includes('verde') || q.includes('patrulha') || q.includes('posto') || q.includes('parque')) {
      return `
        🟢 <strong>Zonas Verificadas & Segurança Alta (Zona Verde):</strong><br><br>
        • <strong>Regiões Seguras:</strong> Parque Ibirapuera, Pinheiros, Jardins, Moema, Santana e Alphaville.<br>
        • <strong>Operações Ativas:</strong> Rondas preventivas da Guarda Urbana e postos policiais com status 100% verificado sem anomalias nas últimas 6 horas.
      `;
    }

    // 📊 Perguntas sobre Resumo da Cidade / Estatísticas / Ajuda
    if (q.includes('resumo') || q.includes('estatistica') || q.includes('cidade') || q.includes('sao paulo') || q.includes('ajuda')) {
      return `
        📊 <strong>Resumo Geral do Sentinel IA para São Paulo:</strong><br><br>
        • <strong>Total de Notificações Ativas:</strong> 46 focos monitorados em 5 níveis de cores.<br>
        • <strong>Índice Global de Segurança Urbana:</strong> 87,4% (Estável).<br>
        • <strong>Sensores IoT em Operação:</strong> 3.421 sensores ativos.<br>
        • <strong>Dica da IA:</strong> Utilize a barra de busca no mapa para navegar direto até o seu bairro de interesse!
      `;
    }

    // 💬 Resposta Padrão Inteligente para qualquer outra dúvida
    return `
      💡 <strong>Resposta da IA Sentinel:</strong><br><br>
      Entendi sua dúvida sobre <em>"${query}"</em>. <br><br>
      Estou monitorando continuamente a Região Metropolitana de São Paulo através de 3.400+ sensores IoT e 1.800+ câmeras inteligentes. <br><br>
      Você pode me perguntar sobre **trânsito, riscos de segurança, clima e temperatura ou localização de postos policiais e câmeras com IA**!
    `;
  }

  // ── Enviar Mensagem do Usuário e Resposta da IA ──
  function sendMessage(text) {
    if (!text.trim()) return;

    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

    // Adiciona Mensagem do Usuário
    const userRow = document.createElement('div');
    userRow.className = 'ai-msg-row user';
    userRow.innerHTML = `
      <div class="ai-msg-bubble">
        ${text}
        <div class="ai-msg-time">${getTimeString()}</div>
      </div>
    `;
    chatBody.appendChild(userRow);

    // Scroll automático
    chatBody.scrollTop = chatBody.scrollHeight;

    // Mostra indicador "Digitando..."
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

    // Resposta simulada com delay de 0.8s
    setTimeout(() => {
      typingRow.remove();

      const aiText = generateAIResponse(text);

      const botRow = document.createElement('div');
      botRow.className = 'ai-msg-row bot';
      botRow.innerHTML = `
        <div class="ai-msg-bubble">
          ${aiText}
          <div class="ai-msg-time">${getTimeString()} • Sentinel IA</div>
        </div>
      `;
      chatBody.appendChild(botRow);
      chatBody.scrollTop = chatBody.scrollHeight;

      if (window.lucide) lucide.createIcons();
    }, 850);
  }

  // ── Bind de Eventos no DOM ──
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

    // Eventos dos Chips Sugeridos
    chips.forEach(chip => {
      chip.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) {
          sendMessage(prompt);
        }
      });
    });
  }

  // Inicializar quando a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbotEvents);
  } else {
    initChatbotEvents();
  }

})();
