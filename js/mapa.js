/* ============================================
   SENTINEL IA — Mapa de Monitoramento Urbano
   VERSÃO 4.0 — Integração com FastAPI Backend
   - Leaflet.js com CartoDB Dark (OpenStreetMap)
   - Marcadores interativos com dados reais da API /api/v1/ocorrencias
   - Heatmap real com posições de BOs carregados do backend
   - Filtros por gravidade (CRITICA, ALTA, MEDIA, BAIXA)
   - Auto-refresh de 30s para dados ao vivo
   ============================================ */

(function () {
  'use strict';

  // ── Constantes de configuração ──────────────────────────────────────────────
  const API_BASE_URL = window.SENTINEL_API_URL || 'http://localhost:8000/api/v1';
  const SP_CENTER    = [-23.5505, -46.6333];
  const SP_ZOOM      = 12;
  const REFRESH_MS   = 30 * 1000; // Auto-refresh a cada 30 segundos

  // ── Inicializar Lucide ────────────────────────────────────────────────────
  if (window.lucide) lucide.createIcons();

  // ── Relógio ao vivo ───────────────────────────────────────────────────────
  function updateClock() {
    const el = document.getElementById('topbarTime');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── Sidebar toggle ────────────────────────────────────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    const mainMapEl = document.getElementById('mainMap');
    if (mainMapEl) {
      mainMapEl.addEventListener('click', () => sidebar.classList.remove('open'));
    }
  }

  // ── Inicialização do Mapa Leaflet ─────────────────────────────────────────
  const map = L.map('mainMap', {
    center: SP_CENTER,
    zoom: SP_ZOOM,
    minZoom: 10,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: true
  });

  // Tile layer escuro (OpenStreetMap Dark / CartoDB Dark Matter sem restrição)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // ── Configuração de Severidade → Cores e Símbolos ─────────────────────────
  // Mapeia as severidades da API (CRITICA, ALTA, MEDIA, BAIXA) para estilos visuais
  const gravityConfig = {
    CRITICA: {
      color: '#ef4444',
      badgeClass: 'critical',
      label: '🔴 Severidade Crítica',
      emoji: '🚨',
      iconName: 'alert-triangle',
      popupClass: 'critical',
      heatIntensity: 1.0
    },
    ALTA: {
      color: '#f59e0b',
      badgeClass: 'warning',
      label: '🟡 Severidade Alta',
      emoji: '⚠️',
      iconName: 'alert-circle',
      popupClass: 'warning',
      heatIntensity: 0.7
    },
    MEDIA: {
      color: '#3b82f6',
      badgeClass: 'info',
      label: '🔵 Severidade Média',
      emoji: '🔵',
      iconName: 'info',
      popupClass: 'info',
      heatIntensity: 0.45
    },
    BAIXA: {
      color: '#10b981',
      badgeClass: 'safe',
      label: '🟢 Severidade Baixa',
      emoji: '🛡️',
      iconName: 'shield-check',
      popupClass: 'safe',
      heatIntensity: 0.2
    }
  };

  // Fallback para gravidades não mapeadas
  function getGravityConfig(gravidade) {
    return gravityConfig[String(gravidade).toUpperCase()] || gravityConfig.MEDIA;
  }

  // ── Formatador de Data/Hora ───────────────────────────────────────────────
  function formatarDataHora(isoString) {
    try {
      const d = new Date(isoString);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${dia}/${mes}/${ano} ${hora}`;
    } catch {
      return isoString || 'Data desconhecida';
    }
  }

  // ── Gerador de HTML do Popup interativo ──────────────────────────────────
  function criarPopupHTML(bo) {
    const cfg = getGravityConfig(bo.gravidade);
    const dataFormatada = formatarDataHora(bo.data_hora);

    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-severity ${cfg.popupClass}"></span>
          <span class="popup-title">${bo.tipo_crime || 'Ocorrência'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Nº BO</span>
          <span class="popup-value mono">${bo.numero_bo || '—'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Bairro</span>
          <span class="popup-value">${bo.bairro || '—'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Logradouro</span>
          <span class="popup-value" style="font-size:0.75rem;">${bo.logradouro || '—'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Data / Horário</span>
          <span class="popup-value mono">${dataFormatada}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Severidade</span>
          <span class="popup-badge ${cfg.popupClass}">${cfg.label}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Status</span>
          <span class="popup-value">${bo.status || 'Em Análise'}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Coord.</span>
          <span class="popup-value mono">${Number(bo.latitude).toFixed(4)}, ${Number(bo.longitude).toFixed(4)}</span>
        </div>
      </div>
    `;
  }

  // ── Estado Global dos Layers ─────────────────────────────────────────────
  const markersLayerGroup = L.layerGroup().addTo(map);  // Grupo de marcadores da API
  const staticLayerGroup  = L.layerGroup().addTo(map);  // Polígonos de zona (estáticos)
  let heatLayer = null;
  let allApiMarkers = [];  // Cache de {marker, bo} para filtros
  let lastBoData = [];     // Cache dos BOs para atualização do heatmap

  // ── Adicionar Marcador de BO com Ícone Dinâmico ──────────────────────────
  function adicionarMarcadorBO(bo) {
    const cfg = getGravityConfig(bo.gravidade);

    const icon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="sentinel-map-pin ${cfg.badgeClass}" style="--pin-color: ${cfg.color};">
          <i data-lucide="${cfg.iconName}"></i>
          <div class="pin-pulse-ring"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([bo.latitude, bo.longitude], { icon }).addTo(markersLayerGroup);

    marker.bindPopup(criarPopupHTML(bo), {
      maxWidth: 300,
      className: 'dark-popup'
    });

    // Renderizar ícones Lucide nos pins recém-criados
    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 15);
    }

    return { marker, bo };
  }

  // ── Atualizar Heatmap com dados reais dos BOs ────────────────────────────
  function atualizarHeatmap(bos) {
    // Converter BOs em pontos de calor: [lat, lng, intensidade]
    const heatPoints = bos
      .filter(bo => bo.latitude && bo.longitude)
      .map(bo => {
        const cfg = getGravityConfig(bo.gravidade);
        return [
          parseFloat(bo.latitude),
          parseFloat(bo.longitude),
          cfg.heatIntensity
        ];
      });

    // Remover layer antiga antes de criar nova
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    if (typeof L.heatLayer === 'function' && heatPoints.length > 0) {
      heatLayer = L.heatLayer(heatPoints, {
        radius: 38,
        blur: 28,
        maxZoom: 15,
        minOpacity: 0.2,
        gradient: {
          0.2: '#10b981',   // Verde — baixa concentração
          0.4: '#3b82f6',   // Azul — média
          0.6: '#a855f7',   // Roxo — alta
          0.8: '#f59e0b',   // Amarelo — muito alta
          1.0: '#ef4444'    // Vermelho — crítica
        }
      }).addTo(map);
    }

    // Toggle de visibilidade controlado pelo checkbox
    const cbHeatmap = document.getElementById('layerHeatmap');
    if (cbHeatmap && heatLayer && !cbHeatmap.checked) {
      map.removeLayer(heatLayer);
    }
  }

  // ── Atualizar contadores do painel de estatísticas ──────────────────────
  function atualizarEstatisticas(bos, total) {
    const criticas  = bos.filter(b => String(b.gravidade).toUpperCase() === 'CRITICA').length;
    const altas     = bos.filter(b => String(b.gravidade).toUpperCase() === 'ALTA').length;
    const outras    = bos.filter(b => !['CRITICA', 'ALTA'].includes(String(b.gravidade).toUpperCase())).length;

    const elTotal    = document.getElementById('statOcorrencias');
    const elCritical = document.getElementById('statZonas');
    const elWarning  = document.getElementById('statAlertasMedios');
    const elSafe     = document.getElementById('statSensores');

    if (elTotal)    elTotal.textContent    = total || bos.length;
    if (elCritical) elCritical.textContent = criticas;
    if (elWarning)  elWarning.textContent  = altas;
    if (elSafe)     elSafe.textContent     = outras;
  }

  // ── Aplicar Filtros de Gravidade (Checkboxes) ────────────────────────────
  const filtroMap = {
    layerCritical: 'CRITICA',
    layerWarning:  'ALTA',
    layerClimate:  'MEDIA',
    layerInfra:    'MEDIA',   // mantido por compatibilidade HTML
    layerSafe:     'BAIXA'
  };

  function aplicarFiltros() {
    const critica   = document.getElementById('layerCritical')?.checked ?? true;
    const alta      = document.getElementById('layerWarning')?.checked ?? true;
    const media     = document.getElementById('layerClimate')?.checked ?? true;
    const baixa     = document.getElementById('layerSafe')?.checked ?? true;

    allApiMarkers.forEach(({ marker, bo }) => {
      const g = String(bo.gravidade).toUpperCase();
      const visivel =
        (g === 'CRITICA' && critica) ||
        (g === 'ALTA'    && alta)    ||
        (g === 'MEDIA'   && media)   ||
        (g === 'BAIXA'   && baixa);

      if (visivel) {
        if (!markersLayerGroup.hasLayer(marker)) markersLayerGroup.addLayer(marker);
      } else {
        if (markersLayerGroup.hasLayer(marker)) markersLayerGroup.removeLayer(marker);
      }
    });
  }

  // Vincular checkboxes existentes no HTML
  ['layerCritical', 'layerWarning', 'layerClimate', 'layerInfra', 'layerSafe'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.addEventListener('change', aplicarFiltros);
  });

  const cbZones = document.getElementById('layerZones');
  if (cbZones) {
    cbZones.addEventListener('change', function () {
      if (this.checked) map.addLayer(staticLayerGroup);
      else map.removeLayer(staticLayerGroup);
    });
  }

  const cbHeatmap = document.getElementById('layerHeatmap');
  if (cbHeatmap) {
    cbHeatmap.addEventListener('change', function () {
      if (!heatLayer) return;
      if (this.checked) map.addLayer(heatLayer);
      else map.removeLayer(heatLayer);
    });
  }

  // ── BUSCA DE DADOS DA API FASTAPI ─────────────────────────────────────────
  // Usa fetch nativo (não requer Axios no HTML puro) apontando para /api/v1/ocorrencias
  async function fetchOcorrenciasAPI(page = 1, pageSize = 100) {
    const url = `${API_BASE_URL}/ocorrencias?page=${page}&page_size=${pageSize}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API retornou HTTP ${response.status}`);
    }

    return response.json(); // → { total, pagina, tamanho_pagina, total_paginas, ocorrencias: [...] }
  }

  // ── CARREGAR E RENDERIZAR TODAS AS OCORRÊNCIAS ────────────────────────────
  async function carregarOcorrenciasNoMapa(paginaAtual = 1, acumulados = []) {
    try {
      mostrarLoading(true);
      const dados = await fetchOcorrenciasAPI(paginaAtual, 100);
      const bos   = dados.ocorrencias || [];

      // Acumular todos os BOs (caso haja múltiplas páginas)
      const todos = [...acumulados, ...bos];

      // Se houver mais páginas, carregar recursivamente
      if (paginaAtual < dados.total_paginas) {
        return await carregarOcorrenciasNoMapa(paginaAtual + 1, todos);
      }

      // — Renderização completa —
      renderizarMarcadores(todos, dados.total);
      atualizarHeatmap(todos);
      atualizarEstatisticas(todos, dados.total);
      lastBoData = todos;

      // Enquadrar câmera nos marcadores reais (se houver)
      if (todos.length > 0) {
        const group = L.featureGroup(allApiMarkers.map(m => m.marker));
        if (group.getBounds().isValid()) {
          map.fitBounds(group.getBounds().pad(0.06));
        }
      }

      mostrarLoading(false);
      mostrarToast('✅ Mapa Atualizado', `${todos.length} BOs carregados da API FastAPI`, 'safe');

    } catch (err) {
      mostrarLoading(false);
      console.warn('[Sentinel Mapa] Falha na API — usando dados estáticos de fallback:', err.message);
      mostrarToast('⚠️ Backend Offline', 'Exibindo dados locais. Inicie o FastAPI em http://localhost:8000', 'warning');

      // Fallback: mostrar pontos estáticos se a API falhar
      carregarFallbackEstatico();
    }
  }

  // ── Renderizar marcadores de BO na tela ───────────────────────────────────
  function renderizarMarcadores(bos, total) {
    // Limpar marcadores anteriores
    markersLayerGroup.clearLayers();
    allApiMarkers = [];

    bos.forEach(bo => {
      // Ignorar BOs sem coordenadas válidas
      if (!bo.latitude || !bo.longitude) return;
      const lat = parseFloat(bo.latitude);
      const lng = parseFloat(bo.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const obj = adicionarMarcadorBO(bo);
      allApiMarkers.push(obj);
    });

    aplicarFiltros();

    if (window.lucide) lucide.createIcons();
    invalidarMapa();
  }

  // ── Loading indicator (injetado dinamicamente no mapa) ───────────────────
  function mostrarLoading(ativo) {
    let el = document.getElementById('mapLoadingOverlay');
    if (ativo) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'mapLoadingOverlay';
        el.style.cssText = `
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(6,10,20,0.92);
          border: 1px solid rgba(0,229,255,0.25);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          z-index: 9999;
          color: #00e5ff;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          backdrop-filter: blur(12px);
        `;
        el.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Sincronizando BOs com a API FastAPI...
        `;
        const wrapper = document.querySelector('.map-page-wrapper');
        if (wrapper) wrapper.appendChild(el);
      }
    } else if (el) {
      el.remove();
    }
  }

  // ── Toast Notifications ──────────────────────────────────────────────────
  function mostrarToast(title, desc, severity) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const cfg = {
      safe: { emoji: '✅', color: '#10b981' },
      warning: { emoji: '⚠️', color: '#f59e0b' },
      critical: { emoji: '🚨', color: '#ef4444' },
      info: { emoji: '🔵', color: '#3b82f6' }
    }[severity] || { emoji: '📡', color: '#00e5ff' };

    const toast = document.createElement('div');
    toast.className = `sentinel-toast ${severity}`;
    toast.innerHTML = `
      <div style="font-size:1.1rem; line-height:1; margin-top:2px;">${cfg.emoji}</div>
      <div style="flex:1;">
        <div class="sentinel-toast-title">${title}</div>
        <div class="sentinel-toast-desc">${desc}</div>
        <div class="sentinel-toast-time">${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} • Sentinel IA</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // ── Invalidar tamanho do mapa (resolve bugs de tile) ─────────────────────
  function invalidarMapa() {
    setTimeout(() => map.invalidateSize(), 250);
  }

  // ── Polígonos de Zona AOI (camada estática) ───────────────────────────────
  const zonePolygons = [
    { coords: [[-23.5350,-46.6500],[-23.5320,-46.6200],[-23.5600,-46.6150],[-23.5650,-46.6450]], color:'#ef4444', fillOpacity:0.12, name:'Zona Central — Risco Crítico' },
    { coords: [[-23.5150,-46.7200],[-23.5050,-46.6400],[-23.5350,-46.6450],[-23.5450,-46.7150]], color:'#f59e0b', fillOpacity:0.12, name:'Corredor Trânsito & Marginais' },
    { coords: [[-23.5950,-46.7200],[-23.5850,-46.6400],[-23.6700,-46.6200],[-23.6800,-46.7100]], color:'#3b82f6', fillOpacity:0.12, name:'Bacia Hidrográfica Sul' },
    { coords: [[-23.5550,-46.6750],[-23.5500,-46.6500],[-23.6150,-46.6850],[-23.6200,-46.7050]], color:'#a855f7', fillOpacity:0.14, name:'Eixo Financeiro — IA OCR' },
    { coords: [[-23.5250,-46.5900],[-23.5150,-46.4300],[-23.5900,-46.4500],[-23.5950,-46.5800]], color:'#10b981', fillOpacity:0.12, name:'Zona Leste — Monitorada' }
  ];

  zonePolygons.forEach(z => {
    const poly = L.polygon(z.coords, {
      color: z.color,
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: z.color,
      fillOpacity: z.fillOpacity
    }).addTo(staticLayerGroup);

    poly.bindTooltip(`<b>${z.name}</b>`, { sticky: true, className: 'dark-popup' });
  });

  // ── Busca de Bairro / Região no Mapa ─────────────────────────────────────
  function performSearch() {
    const input = document.getElementById('mapSearchInput');
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    const found = allApiMarkers.find(({ bo }) =>
      (bo.bairro && bo.bairro.toLowerCase().includes(query)) ||
      (bo.logradouro && bo.logradouro.toLowerCase().includes(query)) ||
      (bo.tipo_crime && bo.tipo_crime.toLowerCase().includes(query))
    );

    if (found) {
      map.flyTo([found.bo.latitude, found.bo.longitude], 15, { animate: true, duration: 1.5 });
      found.marker.openPopup();
      mostrarToast(
        `📍 ${found.bo.bairro}`,
        `Ocorrência: ${found.bo.tipo_crime} — ${formatarDataHora(found.bo.data_hora)}`,
        'info'
      );
    } else {
      mostrarToast(
        'Busca Geoespacial',
        `Nenhum resultado para "${query}". Tente: Sé, Pinheiros, Paulista, Moema, Tatuapé.`,
        'warning'
      );
    }
  }

  const btnSearch = document.getElementById('mapSearchBtn');
  const inputSearch = document.getElementById('mapSearchInput');
  if (btnSearch) btnSearch.addEventListener('click', performSearch);
  if (inputSearch) {
    inputSearch.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
  }

  // ── Botão "Focar em SP" ───────────────────────────────────────────────────
  const btnFocus = document.getElementById('btnFocusMap');
  if (btnFocus) {
    btnFocus.addEventListener('click', () => {
      map.flyTo(SP_CENTER, SP_ZOOM, { animate: true, duration: 1.2 });
    });
  }

  // ── Navegação Direta via URL Params (?lat=...&lng=...&search=...) ─────────
  function checkURLAlertParams() {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const search = params.get('search');

    if (search) {
      const input = document.getElementById('mapSearchInput');
      if (input) input.value = decodeURIComponent(search);
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      setTimeout(() => {
        map.flyTo([lat, lng], 15, { animate: true, duration: 1.8 });
        const nearest = allApiMarkers.find(({ bo }) =>
          Math.abs(parseFloat(bo.latitude) - lat) < 0.03 &&
          Math.abs(parseFloat(bo.longitude) - lng) < 0.03
        );
        if (nearest) nearest.marker.openPopup();
      }, 600);
    } else if (search) {
      setTimeout(() => performSearch(), 600);
    }
  }

  // ── Relatório ao Vivo ─────────────────────────────────────────────────────
  const btnReport = document.getElementById('btnGenerateReport');
  if (btnReport) {
    btnReport.addEventListener('click', () => {
      const criticas = allApiMarkers.filter(({ bo }) => String(bo.gravidade).toUpperCase() === 'CRITICA').length;
      const altas    = allApiMarkers.filter(({ bo }) => String(bo.gravidade).toUpperCase() === 'ALTA').length;
      const medias   = allApiMarkers.filter(({ bo }) => String(bo.gravidade).toUpperCase() === 'MEDIA').length;
      const baixas   = allApiMarkers.filter(({ bo }) => String(bo.gravidade).toUpperCase() === 'BAIXA').length;

      const backdrop = document.createElement('div');
      backdrop.className = 'sentinel-modal-backdrop';
      backdrop.innerHTML = `
        <div class="sentinel-modal">
          <div class="sentinel-modal-header">
            <div class="sentinel-modal-title">
              <i data-lucide="shield" style="color:var(--cyan);"></i>
              Relatório de BOs — Sentinel IA (API Ativa)
            </div>
            <button class="btn-icon" id="btnCloseModal"><i data-lucide="x"></i></button>
          </div>
          <div class="sentinel-modal-body">
            <p><strong>Fonte:</strong> FastAPI Backend — <code>${API_BASE_URL}/ocorrencias</code></p>
            <p style="margin-bottom:1.25rem;"><strong>Emissão:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <h4 style="color:#fff; margin-bottom:0.75rem;">Resumo por Severidade:</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px,1fr)); gap:10px; margin-bottom:1.5rem;">
              <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#ef4444;">${criticas}</div>
                <div style="font-size:0.75rem; color:#aaa;">🔴 Críticas</div>
              </div>
              <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#f59e0b;">${altas}</div>
                <div style="font-size:0.75rem; color:#aaa;">🟡 Altas</div>
              </div>
              <div style="background:rgba(59,130,246,0.1); border:1px solid #3b82f6; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#3b82f6;">${medias}</div>
                <div style="font-size:0.75rem; color:#aaa;">🔵 Médias</div>
              </div>
              <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#10b981;">${baixas}</div>
                <div style="font-size:0.75rem; color:#aaa;">🟢 Baixas</div>
              </div>
            </div>
            <h4 style="color:#fff; margin-bottom:0.75rem;">Últimas 6 Ocorrências (API):</h4>
            <ul style="padding-left:1.2rem; display:flex; flex-direction:column; gap:6px;">
              ${allApiMarkers.slice(-6).reverse().map(({ bo }) => `
                <li><strong>[${bo.bairro || '—'}]</strong> ${bo.tipo_crime} — BO ${bo.numero_bo} (${formatarDataHora(bo.data_hora)})</li>
              `).join('')}
            </ul>
          </div>
          <div class="sentinel-modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">Imprimir / PDF</button>
            <button class="btn btn-primary btn-sm" id="btnCloseModal2">Fechar</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
      if (window.lucide) lucide.createIcons();

      const close = () => backdrop.remove();
      document.getElementById('btnCloseModal')?.addEventListener('click', close);
      document.getElementById('btnCloseModal2')?.addEventListener('click', close);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    });
  }

  // ── Dados Estáticos de Fallback (caso API offline) ───────────────────────
  function carregarFallbackEstatico() {
    const fallbackBOs = [
      { id:'F-01', numero_bo:'BO-0001', data_hora: new Date().toISOString(), tipo_crime:'Furto a Pedestre', bairro:'Sé', logradouro:'Praça da Sé', latitude:-23.5505, longitude:-46.6333, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-02', numero_bo:'BO-0002', data_hora: new Date().toISOString(), tipo_crime:'Acidente de Trânsito', bairro:'Pinheiros', logradouro:'Av. Faria Lima', latitude:-23.5675, longitude:-46.6920, gravidade:'ALTA', status:'Registrado' },
      { id:'F-03', numero_bo:'BO-0003', data_hora: new Date().toISOString(), tipo_crime:'Monitoramento Climático', bairro:'Moema', logradouro:'Parque Ibirapuera', latitude:-23.5876, longitude:-46.6580, gravidade:'MEDIA', status:'Monitorando' },
      { id:'F-04', numero_bo:'BO-0004', data_hora: new Date().toISOString(), tipo_crime:'Ronda Preventiva', bairro:'Tatuapé', logradouro:'Praça Silvio Romero', latitude:-23.5410, longitude:-46.5750, gravidade:'BAIXA', status:'Seguro' },
      { id:'F-05', numero_bo:'BO-0005', data_hora: new Date().toISOString(), tipo_crime:'Furto de Veículo', bairro:'Lapa', logradouro:'Rua 12 de Outubro', latitude:-23.5350, longitude:-46.7020, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-06', numero_bo:'BO-0006', data_hora: new Date().toISOString(), tipo_crime:'Alagamento', bairro:'Brás', logradouro:'Av. Rangel Pestana', latitude:-23.5480, longitude:-46.6050, gravidade:'ALTA', status:'Alerta Ativo' },
      { id:'F-07', numero_bo:'BO-0007', data_hora: new Date().toISOString(), tipo_crime:'Câmera OCR Ativa', bairro:'Consolação', logradouro:'Av. Paulista, 1578', latitude:-23.5614, longitude:-46.6560, gravidade:'MEDIA', status:'Operacional' },
      { id:'F-08', numero_bo:'BO-0008', data_hora: new Date().toISOString(), tipo_crime:'Roubo em Andamento', bairro:'Brasilândia', logradouro:'Est. do Sabão', latitude:-23.4610, longitude:-46.6950, gravidade:'CRITICA', status:'Urgente' }
    ];
    renderizarMarcadores(fallbackBOs, fallbackBOs.length);
    atualizarHeatmap(fallbackBOs);
    atualizarEstatisticas(fallbackBOs, fallbackBOs.length);
    map.flyTo(SP_CENTER, SP_ZOOM);
  }

  // ── Início: Carregar API e configurar auto-refresh ────────────────────────
  async function inicializar() {
    await carregarOcorrenciasNoMapa();
    checkURLAlertParams();

    // Auto-refresh a cada 30s (dados ao vivo)
    setInterval(async () => {
      try {
        const dados = await fetchOcorrenciasAPI(1, 100);
        renderizarMarcadores(dados.ocorrencias || [], dados.total);
        atualizarHeatmap(dados.ocorrencias || []);
        atualizarEstatisticas(dados.ocorrencias || [], dados.total);
      } catch (e) {
        console.warn('[Auto-refresh] Falha na sincronização:', e.message);
      }
    }, REFRESH_MS);
  }

  inicializar();

  // Corrigir tiles do mapa ao redimensionar janela
  window.addEventListener('resize', invalidarMapa);

})();
