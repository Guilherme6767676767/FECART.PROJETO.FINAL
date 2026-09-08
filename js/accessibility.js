/* ============================================
   SENTINEL IA — Widget de Acessibilidade & Expansão Visual
   Proporciona ampliação de fonte (+), alto contraste e
   leitura facilitada para pessoas com baixa visão.
   ============================================ */

(function () {
  'use strict';

  // Chaves do LocalStorage
  const STORAGE_FONT_SIZE = 'sentinel_accessibility_font_scale';
  const STORAGE_HIGH_CONTRAST = 'sentinel_accessibility_high_contrast';

  // Configurações de escala (100% padrão, até 160% expandido)
  const SCALES = [100, 115, 130, 145, 160];
  let currentScaleIndex = parseInt(localStorage.getItem(STORAGE_FONT_SIZE) || '0', 10);
  if (isNaN(currentScaleIndex) || currentScaleIndex < 0 || currentScaleIndex >= SCALES.length) {
    currentScaleIndex = 0;
  }

  let isHighContrast = localStorage.getItem(STORAGE_HIGH_CONTRAST) === 'true';

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

    // Atualizar texto do botão se existir
    const fontBadge = document.getElementById('accessFontBadge');
    if (fontBadge) fontBadge.textContent = `${scale}%`;

    const contrastBtn = document.getElementById('accessContrastBtn');
    if (contrastBtn) {
      contrastBtn.setAttribute('aria-pressed', isHighContrast ? 'true' : 'false');
      contrastBtn.style.background = isHighContrast ? 'var(--neon-green, #00ff88)' : '';
      contrastBtn.style.color = isHighContrast ? '#000000' : '';
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

  // Renderizar o Widget de Acessibilidade na tela
  function renderAccessibilityWidget() {
    if (document.getElementById('sentinelAccessibilityWidget')) return;

    const widgetHTML = `
      <div id="sentinelAccessibilityWidget" class="access-widget" aria-label="Ferramentas de Acessibilidade">
        <button id="accessToggleMainBtn" class="access-main-btn" onclick="document.getElementById('sentinelAccessibilityWidget').classList.toggle('expanded')" title="Opções de Acessibilidade e Zoom (Aumento de Tela)">
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
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  // Injetar Estilos CSS de Acessibilidade
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Estilos do Widget Flutuante de Acessibilidade */
      .access-widget {
        position: fixed;
        bottom: 85px;
        right: 25px;
        z-index: 99999;
        font-family: 'Inter', sans-serif;
      }

      .access-main-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(8, 12, 24, 0.92);
        color: #00e5ff;
        border: 2px solid #00e5ff;
        padding: 10px 16px;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
        box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
        transition: all 0.3s ease;
      }

      .access-main-btn:hover {
        background: #00e5ff;
        color: #000000;
        box-shadow: 0 0 30px rgba(0, 229, 255, 0.8);
        transform: scale(1.05);
      }

      .access-menu {
        display: none;
        position: absolute;
        bottom: 55px;
        right: 0;
        width: 240px;
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
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
        margin-bottom: 4px;
      }

      .access-menu-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        text-align: left;
        transition: all 0.2s ease;
      }

      .access-menu-btn:hover {
        background: rgba(0, 229, 255, 0.15);
        border-color: #00e5ff;
        color: #00e5ff;
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
          bottom: 75px;
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
    });
  } else {
    injectStyles();
    renderAccessibilityWidget();
    applyAccessibilitySettings();
  }
})();
