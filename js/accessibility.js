/* ============================================
   SENTINEL IA — Widget de Acessibilidade & Guia Explicativo (Tooltip / Sintetizador de Voz)
   Proporciona ampliação de fonte (+), alto contraste, leitura facilitada
   e o MODO GUIA EXPLICATIVO (explica a função de qualquer elemento ao ser clicado).
   ============================================ */

(function () {
  'use strict';

  // Chaves do LocalStorage
  const STORAGE_FONT_SIZE = 'sentinel_accessibility_font_scale';
  const STORAGE_HIGH_CONTRAST = 'sentinel_accessibility_high_contrast';
  const STORAGE_EXPLAIN_MODE = 'sentinel_accessibility_explain_mode';
  const STORAGE_VOICE_MODE = 'sentinel_accessibility_voice_mode';

  // Configurações de escala (100% padrão, até 160% expandido)
  const SCALES = [100, 115, 130, 145, 160];
  let currentScaleIndex = parseInt(localStorage.getItem(STORAGE_FONT_SIZE) || '0', 10);
  if (isNaN(currentScaleIndex) || currentScaleIndex < 0 || currentScaleIndex >= SCALES.length) {
    currentScaleIndex = 0;
  }

  let isHighContrast = localStorage.getItem(STORAGE_HIGH_CONTRAST) === 'true';
  let isExplainMode = localStorage.getItem(STORAGE_EXPLAIN_MODE) !== 'false'; // Padrão ATIVADO
  let isVoiceEnabled = localStorage.getItem(STORAGE_VOICE_MODE) === 'true';

  // Aplicar estilos ao carregar a página
  function applyAccessibilitySettings() {
    const scale = SCALES[currentScaleIndex];
    document.documentElement.style.fontSize = (scale / 100 * 16) + 'px';
    document.documentElement.setAttribute('data-font-scale', scale + '%');

    if (isHighContrast) {
      document.body.classList.add('accessibility-high-contrast');
    } else {
      document.body.classList.remove('accessibility-high-contrast');
    }

    if (isExplainMode) {
      document.body.classList.add('accessibility-explain-mode');
    } else {
      document.body.classList.remove('accessibility-explain-mode');
    }

    // Atualizar textos dos botões se existirem
    const fontBadge = document.getElementById('accessFontBadge');
    if (fontBadge) fontBadge.textContent = `${scale}%`;

    const contrastBtn = document.getElementById('accessContrastBtn');
    if (contrastBtn) {
      contrastBtn.setAttribute('aria-pressed', isHighContrast ? 'true' : 'false');
      contrastBtn.style.background = isHighContrast ? 'var(--neon-green, #00ff88)' : '';
      contrastBtn.style.color = isHighContrast ? '#000000' : '';
    }

    const explainBtn = document.getElementById('accessExplainBtn');
    if (explainBtn) {
      explainBtn.setAttribute('aria-pressed', isExplainMode ? 'true' : 'false');
      explainBtn.style.background = isExplainMode ? 'var(--neon-cyan, #00e5ff)' : '';
      explainBtn.style.color = isExplainMode ? '#000000' : '';
    }

    const voiceBtn = document.getElementById('accessVoiceBtn');
    if (voiceBtn) {
      voiceBtn.style.background = isVoiceEnabled ? 'var(--neon-purple, #c026d3)' : '';
      voiceBtn.style.color = isVoiceEnabled ? '#ffffff' : '';
    }
  }

  // Alternar tamanho de fonte (+)
  window.sentinelIncreaseFont = function () {
    currentScaleIndex = (currentScaleIndex + 1) % SCALES.length;
    localStorage.setItem(STORAGE_FONT_SIZE, currentScaleIndex.toString());
    applyAccessibilitySettings();
  };

  // Resetar tamanho de fonte (A=)
  window.sentinelResetFont = function () {
    currentScaleIndex = 0;
    localStorage.setItem(STORAGE_FONT_SIZE, '0');
    applyAccessibilitySettings();
  };

  // Alternar Alto Contraste (C)
  window.sentinelToggleContrast = function () {
    isHighContrast = !isHighContrast;
    localStorage.setItem(STORAGE_HIGH_CONTRAST, isHighContrast.toString());
    applyAccessibilitySettings();
  };

  // Alternar Modo Guia Explicativo Ao Clicar
  window.sentinelToggleExplainMode = function () {
    isExplainMode = !isExplainMode;
    localStorage.setItem(STORAGE_EXPLAIN_MODE, isExplainMode.toString());
    applyAccessibilitySettings();

    if (isExplainMode) {
      showExplanationToast("💡 Modo Explicativo Ativado!", "Agora, qualquer elemento que você clicar na tela exibirá um balão explicando para que ele serve.");
      if (isVoiceEnabled) speakText("Modo Explicativo Ativado. Clique em qualquer elemento para ouvir para que ele serve.");
    } else {
      showExplanationToast("ℹ️ Modo Explicativo Desativado", "O comportamento padrão de clique foi restaurado.");
    }
  };

  // Alternar Leitura de Voz (Sintetizador por Fala)
  window.sentinelToggleVoice = function () {
    isVoiceEnabled = !isVoiceEnabled;
    localStorage.setItem(STORAGE_VOICE_MODE, isVoiceEnabled.toString());
    applyAccessibilitySettings();

    if (isVoiceEnabled) {
      speakText("Leitura por voz ativada.");
      showExplanationToast("🔊 Voz Ativada", "As explicações dos elementos também serão lidas em voz alta.");
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      showExplanationToast("🔇 Voz Desativada", "Leitura por áudio pausada.");
    }
  };

  // Falar texto via Sintetizador de Voz Nativo do Navegador
  function speakText(text) {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Parar falas anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // Exibir popup/toast explicativo na tela
  function showExplanationToast(title, description) {
    let container = document.getElementById('sentinelExplainToast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sentinelExplainToast';
      container.className = 'explain-toast-card';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="explain-toast-header">
        <span class="explain-toast-title">${title}</span>
        <button class="explain-toast-close" onclick="document.getElementById('sentinelExplainToast').classList.remove('active')">&times;</button>
      </div>
      <div class="explain-toast-body">${description}</div>
    `;

    container.classList.add('active');

    // Auto-ocultar após 8 segundos
    clearTimeout(window._explainToastTimeout);
    window._explainToastTimeout = setTimeout(() => {
      if (container) container.classList.remove('active');
    }, 8000);
  }

  // DICIONÁRIO DE EXPLICAÇÃO INTELETA E RECONHECIMENTO DINÂMICO
  function getElementExplanation(el) {
    if (!el) return null;

    // 1. Atributos explícitos (title, alt, aria-label, data-explain)
    const dataExplain = el.getAttribute('data-explain');
    if (dataExplain) return dataExplain;

    const title = el.getAttribute('title');
    const ariaLabel = el.getAttribute('aria-label');
    const alt = el.getAttribute('alt');

    // 2. Mapeamento por ID ou Classe específica
    const id = el.id || '';
    const textContent = (el.innerText || el.textContent || '').trim().substring(0, 40);
    const href = el.getAttribute('href') || '';
    const tagName = el.tagName.toLowerCase();

    // Mapeamento específico por contexto
    if (id === 'sidebarToggle' || el.classList.contains('sidebar-toggle-btn')) {
      return "Botão de Menu Lateral: Abre ou fecha a barra de navegação com os links principais da plataforma.";
    }
    if (id === 'liveClock') {
      return "Relógio em Tempo Real: Exibe a hora exata do sistema de monitoramento sincronizado em horário de Brasília.";
    }
    if (href.includes('dashboard') || textContent.toLowerCase().includes('dashboard')) {
      return "Painel Dashboard: Redireciona para a tela com gráficos, métricas e estatísticas urbanas gerais em tempo real.";
    }
    if (href.includes('mapa') || textContent.toLowerCase().includes('mapa')) {
      return "Mapa Interativo: Abre o mapa geoespacial com marcadores de ocorrências, bairros e manchas térmicas.";
    }
    if (href.includes('analise') || textContent.toLowerCase().includes('análise')) {
      return "Análise Preditiva: Exibe relatórios avançados de IA e previsões de risco de ocorrências futuras.";
    }
    if (href.includes('alertas') || textContent.toLowerCase().includes('alertas')) {
      return "Central de Alertas: Mostra o feed de emergências ativas e avisos da Defesa Civil e SSP-SP.";
    }
    if (href.includes('simulacoes') || textContent.toLowerCase().includes('simulações')) {
      return "Painel de Simulações: Permite disparar cenários preditivos de teste (ex: tempestades ou congestionamentos).";
    }
    if (el.classList.contains('kpi-card') || el.closest('.kpi-card')) {
      const card = el.closest('.kpi-card');
      const cardTitle = card.querySelector('.kpi-title')?.innerText || 'Indicador';
      const cardValue = card.querySelector('.kpi-value')?.innerText || '';
      return `Card de Indicador (${cardTitle}): Exibe a métrica atual do sistema. Valor atual: ${cardValue}.`;
    }
    if (el.classList.contains('alert-item') || el.closest('.alert-item')) {
      const item = el.closest('.alert-item');
      const itemTitle = item.querySelector('h5')?.innerText || 'Ocorrência';
      return `Item de Alerta (${itemTitle}): Exibe os detalhes da ocorrência e botões para localizar no mapa ou confirmar leitura.`;
    }
    if (tagName === 'button' || el.classList.contains('btn')) {
      const btnText = textContent || ariaLabel || title || 'Ação';
      return `Botão (${btnText}): Executa a ação descrita ao ser pressionado.`;
    }
    if (tagName === 'input') {
      const type = el.getAttribute('type') || 'texto';
      const placeholder = el.getAttribute('placeholder') || '';
      return `Campo de Entrada (${type}): Utilize o teclado para digitar informações ${placeholder ? 'ex: ' + placeholder : ''}.`;
    }
    if (tagName === 'a') {
      return `Link de Navegação (${textContent}): Redireciona o seu navegador para a seção ou página correspondente.`;
    }

    // Se tiver texto descritivo simples
    if (title) return `Elemento (${textContent || 'Item'}): ${title}`;
    if (ariaLabel) return `Elemento (${textContent || 'Item'}): ${ariaLabel}`;

    // Fallback genérico inteligente
    if (textContent.length > 0) {
      return `Elemento Selecionado (${textContent}): Mostra detalhes ou controla funcionalidades desta seção do site.`;
    }

    return "Elemento da Interface: Clique sobre botões, cards ou links para entender melhor as opções da plataforma.";
  }

  // Interceptar cliques globais para o Modo Explicativo
  function setupGlobalClickHandler() {
    document.addEventListener('click', (e) => {
      // Ignorar cliques no próprio widget de acessibilidade ou no toast explicativo
      if (e.target.closest('#sentinelAccessibilityWidget') || e.target.closest('#sentinelExplainToast')) {
        return;
      }

      if (isExplainMode) {
        const target = e.target.closest('a, button, input, select, textarea, .kpi-card, .alert-item, .dashboard-panel, .card, [data-explain]') || e.target;
        const explanation = getElementExplanation(target);

        if (explanation) {
          const title = target.tagName === 'BUTTON' || target.tagName === 'A' ? `Função do Botão/Link` : `Informação do Elemento`;
          showExplanationToast(`💡 ${title}`, explanation);
          if (isVoiceEnabled) speakText(explanation);
        }
      }
    }, true); // Captura na fase descendente
  }

  // Renderizar o Widget de Acessibilidade na tela
  function renderAccessibilityWidget() {
    if (document.getElementById('sentinelAccessibilityWidget')) return;

    const widgetHTML = `
      <div id="sentinelAccessibilityWidget" class="access-widget" aria-label="Ferramentas de Acessibilidade">
        <button id="accessToggleMainBtn" class="access-main-btn" onclick="document.getElementById('sentinelAccessibilityWidget').classList.toggle('expanded')" title="Opções de Acessibilidade, Guia Explicativo e Zoom">
          <i data-lucide="eye" style="width:20px;height:20px;"></i>
          <span class="access-btn-label">Acessibilidade</span>
        </button>
        <div class="access-menu">
          <div class="access-menu-title">Acessibilidade Visual</div>
          <button class="access-menu-btn" onclick="sentinelIncreaseFont()" title="Aumentar tamanho de fontes e elementos">
            <i data-lucide="zoom-in" style="width:16px;height:16px;"></i> Expandir Tela: <strong id="accessFontBadge">100%</strong>
          </button>
          <button class="access-menu-btn" onclick="sentinelResetFont()" title="Restaurar tamanho padrão">
            <i data-lucide="rotate-ccw" style="width:16px;height:16px;"></i> Tamanho Padrão
          </button>
          <button id="accessContrastBtn" class="access-menu-btn" onclick="sentinelToggleContrast()" title="Alternar Modo Super Contraste para baixa visão">
            <i data-lucide="sun" style="width:16px;height:16px;"></i> Super Contraste / Nitidez
          </button>
          <div class="access-menu-title" style="margin-top:6px;">Guia & Leitura</div>
          <button id="accessExplainBtn" class="access-menu-btn" onclick="sentinelToggleExplainMode()" title="Explica para que serve qualquer botão ou card ao ser clicado">
            <i data-lucide="help-circle" style="width:16px;height:16px;"></i> Explica Tudo ao Clicar
          </button>
          <button id="accessVoiceBtn" class="access-menu-btn" onclick="sentinelToggleVoice()" title="Lê em voz alta as explicações na tela">
            <i data-lucide="volume-2" style="width:16px;height:16px;"></i> Leitura por Voz (Áudio)
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  // Injetar Estilos CSS de Acessibilidade e Toast Explicativo
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Estilos do Widget Flutuante de Acessibilidade */
      .access-widget {
        position: fixed;
        bottom: 100px;
        right: 25px;
        z-index: 999999;
        font-family: 'Inter', sans-serif;
      }

      .access-main-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #000000 !important;
        color: #00e5ff !important;
        border: 2px solid #00e5ff !important;
        padding: 12px 20px !important;
        border-radius: 999px !important;
        cursor: pointer !important;
        font-weight: 800 !important;
        font-size: 15px !important;
        box-shadow: 0 0 25px rgba(0, 229, 255, 0.6), 0 0 10px #00e5ff !important;
        transition: all 0.3s ease !important;
      }

      .access-main-btn:hover {
        background: #00e5ff !important;
        color: #000000 !important;
        box-shadow: 0 0 35px rgba(0, 229, 255, 0.9) !important;
        transform: scale(1.08) !important;
      }

      .access-menu {
        display: none;
        position: absolute;
        bottom: 55px;
        right: 0;
        width: 250px;
        background: #050508;
        border: 2px solid #00e5ff;
        border-radius: 14px;
        padding: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 229, 255, 0.2);
        flex-direction: column;
        gap: 8px;
      }

      .access-widget.expanded .access-menu {
        display: flex;
      }

      .access-menu-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #00e5ff;
        font-weight: 800;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
        margin-bottom: 2px;
      }

      .access-menu-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 11px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12.5px;
        font-weight: 600;
        text-align: left;
        transition: all 0.2s ease;
      }

      .access-menu-btn:hover {
        background: rgba(0, 229, 255, 0.15);
        border-color: #00e5ff;
        color: #00e5ff;
      }

      /* TOAST / POPUP EXPLICATIVO FLUTUANTE */
      .explain-toast-card {
        position: fixed;
        top: 25px;
        right: 25px;
        width: 350px;
        max-width: 90vw;
        background: rgba(6, 10, 20, 0.96);
        border: 2px solid #00e5ff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 12px 45px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 229, 255, 0.3);
        z-index: 999999;
        display: none;
        animation: toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', sans-serif;
      }

      @keyframes toastSlide {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .explain-toast-card.active {
        display: block;
      }

      .explain-toast-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
      }

      .explain-toast-title {
        font-weight: 800;
        color: #00e5ff;
        font-size: 14px;
      }

      .explain-toast-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
      }

      .explain-toast-close:hover {
        color: #ef4444;
      }

      .explain-toast-body {
        font-size: 13.5px;
        color: #f1f5f9;
        line-height: 1.5;
      }

      /* INDICADOR VISUAL QUANDO O MODO EXPLICATIVO ESTÁ ATIVO */
      body.accessibility-explain-mode a,
      body.accessibility-explain-mode button,
      body.accessibility-explain-mode .kpi-card,
      body.accessibility-explain-mode .alert-item {
        cursor: help !important;
      }

      /* MODO SUPER CONTRASTE PARA BAIXA VISÃO */
      body.accessibility-high-contrast {
        background-color: #000000 !important;
        color: #ffffff !important;
      }

      body.accessibility-high-contrast p,
      body.accessibility-high-contrast span,
      body.accessibility-high-contrast h1,
      body.accessibility-high-contrast h2,
      body.accessibility-high-contrast h3,
      body.accessibility-high-contrast h4,
      body.accessibility-high-contrast h5,
      body.accessibility-high-contrast h6,
      body.accessibility-high-contrast a {
        color: #ffffff !important;
        text-shadow: none !important;
        font-weight: 700 !important;
      }

      body.accessibility-high-contrast .dashboard-panel,
      body.accessibility-high-contrast .card,
      body.accessibility-high-contrast .sidebar,
      body.accessibility-high-contrast .dashboard-topbar,
      body.accessibility-high-contrast .alert-item {
        background: #000000 !important;
        border: 2px solid #00ff88 !important;
        box-shadow: none !important;
      }

      body.accessibility-high-contrast button,
      body.accessibility-high-contrast .btn {
        border: 2px solid #00e5ff !important;
        font-weight: 900 !important;
      }

      @media (max-width: 768px) {
        .access-widget {
          bottom: 150px;
          right: 15px;
        }
        .access-btn-label {
          display: none;
        }
        .access-main-btn {
          padding: 10px;
          border-radius: 50%;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      renderAccessibilityWidget();
      applyAccessibilitySettings();
      setupGlobalClickHandler();
    });
  } else {
    injectStyles();
    renderAccessibilityWidget();
    applyAccessibilitySettings();
    setupGlobalClickHandler();
  }
})();
