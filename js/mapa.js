/* ============================================
   SENTINEL IA — Mapa de Monitoramento Urbano
   VERSÃO 5.0 — Motor Geoespacial Unificado MapLibre GL (2D & 3D)
   - Dark Mode Cyberpunk Nativo
   - Extrusão 3D de Prédios e Edificações de São Paulo
   - Prismas e Volumes Volumétricos de Zonas AOI
   - Colunas Luminosas de Ocorrências (SSP-SP)
   - Transição suave entre Modo 2D e Modo 3D
   ============================================ */

(function () {
  'use strict';

  // ── Constantes de configuração ──────────────────────────────────────────────
  const API_BASE_URL = window.SENTINEL_API_URL || 'http://localhost:8000/api/v1';
  const SP_CENTER    = [-46.6333, -23.5505]; // [lng, lat]
  const REFRESH_MS   = 30 * 1000;

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

  // ── Configuração de Severidade → Cores e Símbolos ─────────────────────────
  const gravityConfig = {
    CRITICA: {
      color: '#ef4444',
      badgeClass: 'critical',
      label: '🔴 Severidade Crítica',
      emoji: '🚨',
      heatIntensity: 1.0
    },
    ALTA: {
      color: '#f59e0b',
      badgeClass: 'warning',
      label: '🟡 Severidade Alta',
      emoji: '⚠️',
      heatIntensity: 0.7
    },
    MEDIA: {
      color: '#3b82f6',
      badgeClass: 'info',
      label: '🔵 Severidade Média',
      emoji: '🔵',
      heatIntensity: 0.45
    },
    BAIXA: {
      color: '#10b981',
      badgeClass: 'safe',
      label: '🟢 Severidade Baixa',
      emoji: '🛡️',
      heatIntensity: 0.2
    }
  };

  function getGravityConfig(gravidade) {
    return gravityConfig[String(gravidade).toUpperCase()] || gravityConfig.MEDIA;
  }

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

  function criarPopupHTML(bo) {
    const cfg = getGravityConfig(bo.gravidade);
    const dataFormatada = formatarDataHora(bo.data_hora);

    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-severity ${cfg.badgeClass}"></span>
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
          <span class="popup-badge ${cfg.badgeClass}">${cfg.label}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Status</span>
          <span class="popup-value">${bo.status || 'Em Análise'}</span>
        </div>
      </div>
    `;
  }

  // ── Polígonos das Zonas Urbanas (AOIs) ───────────────────────────────────
  const zonePolygons = [
    { coords: [[-46.6500, -23.5350], [-46.6200, -23.5320], [-46.6150, -23.5600], [-46.6450, -23.5650]], color: '#ef4444', height: 120, name: 'Zona Central — Risco Crítico' },
    { coords: [[-46.7200, -23.5150], [-46.6400, -23.5050], [-46.6450, -23.5350], [-46.7150, -23.5450]], color: '#f59e0b', height: 80, name: 'Corredor Trânsito & Marginais' },
    { coords: [[-46.7200, -23.5950], [-46.6400, -23.5850], [-46.6200, -23.6700], [-46.7100, -23.6800]], color: '#3b82f6', height: 60, name: 'Bacia Hidrográfica Sul' },
    { coords: [[-46.6750, -23.5550], [-46.6500, -23.5500], [-46.6850, -23.6150], [-46.7050, -23.6200]], color: '#a855f7', height: 95, name: 'Eixo Financeiro — IA OCR' },
    { coords: [[-46.5900, -23.5250], [-46.4300, -23.5150], [-46.4500, -23.5900], [-46.5800, -23.5950]], color: '#10b981', height: 50, name: 'Zona Leste — Monitorada' }
  ];

  // ── ESTADO GLOBAL DO MAPA UNIFICADO ──────────────────────────────────────
  let mapGL = null;
  let is3DMode = false;
  let markersGL = [];
  let lastBoData = [];

  function initMap() {
    const container = document.getElementById('mainMap');
    if (!container) return;
    container.innerHTML = '';

    mapGL = new maplibregl.Map({
      container: 'mainMap',
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          },
          'openmaptiles': {
            type: 'vector',
            url: 'https://demotiles.maplibre.org/tiles/tiles.json'
          }
        },
        layers: [
          {
            id: 'background-dark',
            type: 'background',
            paint: {
              'background-color': '#060a14'
            }
          },
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-opacity': 0.68,
              'raster-contrast': 0.45,
              'raster-saturation': -1.0,
              'raster-brightness-max': 0.8
            }
          },
          // ── Extrusão 3D de Edificações ──
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 13,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, '#0a192f',
                30, '#00e5ff',
                80, '#a855f7'
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13, 0,
                14.5, ['coalesce', ['get', 'render_height'], ['get', 'height'], 30]
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85
            }
          }
        ]
      },
      center: SP_CENTER,
      zoom: 13.5,
      pitch: 0,
      bearing: 0
    });

    mapGL.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

    mapGL.on('load', () => {
      adicionarZonasGL();
      adicionarHeatmapGL();
      atualizarMarcadoresGL();
    });
  }

  // ── Zonas AOI ────────────────────────────────────────────────────────────
  function adicionarZonasGL() {
    if (!mapGL || mapGL.getSource('zones-source')) return;

    const features = zonePolygons.map(z => {
      const coords = [...z.coords, z.coords[0]];
      return {
        type: 'Feature',
        properties: {
          name: z.name,
          color: z.color,
          height: z.height,
          base: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      };
    });

    mapGL.addSource('zones-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    mapGL.addLayer({
      id: 'zones-2d-fill',
      type: 'fill',
      source: 'zones-source',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.22
      }
    });

    mapGL.addLayer({
      id: 'zones-2d-outline',
      type: 'line',
      source: 'zones-source',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-dasharray': [4, 4]
      }
    });

    mapGL.addLayer({
      id: 'zones-3d-extrusion',
      type: 'fill-extrusion',
      source: 'zones-source',
      layout: {
        visibility: 'none'
      },
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-opacity': 0.45
      }
    });
  }

  // ── Heatmap GL ───────────────────────────────────────────────────────────
  function adicionarHeatmapGL() {
    if (!mapGL || mapGL.getSource('bos-heat-source')) return;

    const bos = lastBoData.length > 0 ? lastBoData : [];
    const features = bos.filter(b => b.latitude && b.longitude).map(b => ({
      type: 'Feature',
      properties: {
        intensity: getGravityConfig(b.gravidade).heatIntensity
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(b.longitude), parseFloat(b.latitude)]
      }
    }));

    mapGL.addSource('bos-heat-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    mapGL.addLayer({
      id: 'bos-heat-layer',
      type: 'heatmap',
      source: 'bos-heat-source',
      maxzoom: 17,
      paint: {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': 2.0,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 229, 255, 0)',
          0.2, '#10b981',
          0.4, '#3b82f6',
          0.6, '#a855f7',
          0.8, '#f59e0b',
          1, '#ef4444'
        ],
        'heatmap-radius': 36,
        'heatmap-opacity': 0.82
      }
    });
  }

  // ── Atualizar Marcadores e Colunas 3D ─────────────────────────────────────
  function atualizarMarcadoresGL() {
    if (!mapGL) return;

    if (mapGL.getSource('bos-heat-source')) {
      const bos = lastBoData.length > 0 ? lastBoData : [];
      const features = bos.filter(b => b.latitude && b.longitude).map(b => ({
        type: 'Feature',
        properties: {
          intensity: getGravityConfig(b.gravidade).heatIntensity
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(b.longitude), parseFloat(b.latitude)]
        }
      }));
      mapGL.getSource('bos-heat-source').setData({
        type: 'FeatureCollection',
        features: features
      });
    }

    markersGL.forEach(m => m.remove());
    markersGL = [];

    const bos = lastBoData.length > 0 ? lastBoData : [];

    const criticaVisivel = document.getElementById('layerCritical')?.checked ?? true;
    const altaVisivel    = document.getElementById('layerWarning')?.checked ?? true;
    const mediaVisivel   = document.getElementById('layerClimate')?.checked ?? true;
    const baixaVisivel   = document.getElementById('layerSafe')?.checked ?? true;

    bos.forEach(bo => {
      if (!bo.latitude || !bo.longitude) return;
      const g = String(bo.gravidade).toUpperCase();

      const visivel =
        (g === 'CRITICA' && criticaVisivel) ||
        (g === 'ALTA'    && altaVisivel)    ||
        (g === 'MEDIA'   && mediaVisivel)   ||
        (g === 'BAIXA'   && baixaVisivel);

      if (!visivel) return;

      const cfg = getGravityConfig(bo.gravidade);

      const el = document.createElement('div');
      el.className = 'sentinel-gl-marker';
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      `;

      const height = is3DMode
        ? (bo.gravidade === 'CRITICA' ? 85 : bo.gravidade === 'ALTA' ? 60 : 40)
        : 0;

      el.innerHTML = `
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(6, 10, 20, 0.95);
          border: 2px solid ${cfg.color};
          box-shadow: 0 0 14px ${cfg.color}, 0 0 28px ${cfg.color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        ">${cfg.emoji}</div>
        ${is3DMode ? `
          <div style="
            width: 5px;
            height: ${height}px;
            background: linear-gradient(180deg, ${cfg.color}, rgba(0,0,0,0.1));
            box-shadow: 0 0 12px ${cfg.color};
            border-radius: 2px;
          "></div>
        ` : ''}
      `;

      const popup = new maplibregl.Popup({ offset: 25, className: 'dark-popup' })
        .setHTML(criarPopupHTML(bo));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(bo.longitude), parseFloat(bo.latitude)])
        .setPopup(popup)
        .addTo(mapGL);

      markersGL.push(marker);
    });

    const cbZones = document.getElementById('layerZones');
    if (cbZones && mapGL.getLayer('zones-3d-extrusion')) {
      mapGL.setLayoutProperty('zones-3d-extrusion', 'visibility', is3DMode && cbZones.checked ? 'visible' : 'none');
      mapGL.setLayoutProperty('zones-2d-fill', 'visibility', !is3DMode && cbZones.checked ? 'visible' : 'none');
      mapGL.setLayoutProperty('zones-2d-outline', 'visibility', !is3DMode && cbZones.checked ? 'visible' : 'none');
    }
    const cbHeatmap = document.getElementById('layerHeatmap');
    if (cbHeatmap && mapGL.getLayer('bos-heat-layer')) {
      mapGL.setLayoutProperty('bos-heat-layer', 'visibility', cbHeatmap.checked ? 'visible' : 'none');
    }
  }

  // ── Atualizar Estatísticas ───────────────────────────────────────────────
  function atualizarEstatisticas(bos, total) {
    const criticas = bos.filter(b => String(b.gravidade).toUpperCase() === 'CRITICA').length;
    const altas    = bos.filter(b => String(b.gravidade).toUpperCase() === 'ALTA').length;
    const outras   = bos.filter(b => !['CRITICA', 'ALTA'].includes(String(b.gravidade).toUpperCase())).length;

    const elTotal    = document.getElementById('statOcorrencias');
    const elCritical = document.getElementById('statZonas');
    const elWarning  = document.getElementById('statAlertasMedios');
    const elSafe     = document.getElementById('statSensores');

    if (elTotal)    elTotal.textContent    = total || bos.length;
    if (elCritical) elCritical.textContent = criticas;
    if (elWarning)  elWarning.textContent  = altas;
    if (elSafe)     elSafe.textContent     = outras;
  }

  // ── Alternador 2D / 3D ────────────────────────────────────────────────────
  const btnToggle3D = document.getElementById('btnToggle3D');
  const btnToggle3DText = document.getElementById('btnToggle3DText');

  if (btnToggle3D) {
    btnToggle3D.addEventListener('click', () => {
      is3DMode = !is3DMode;

      if (is3DMode) {
        if (btnToggle3DText) btnToggle3DText.textContent = 'Modo 2D';
        if (mapGL) {
          mapGL.flyTo({
            pitch: 60,
            bearing: -20,
            zoom: 14.5,
            duration: 1800
          });
        }
        mostrarToast('🌐 Modo 3D Ativado', 'Câmera inclinada com volumetria e relevo de dados.', 'info');
      } else {
        if (btnToggle3DText) btnToggle3DText.textContent = 'Modo 3D';
        if (mapGL) {
          mapGL.flyTo({
            pitch: 0,
            bearing: 0,
            zoom: 13.5,
            duration: 1600
          });
        }
        mostrarToast('🗺️ Modo 2D Ativado', 'Visão cartográfica plana superior.', 'info');
      }

      setTimeout(atualizarMarcadoresGL, 300);
    });
  }

  // ── Botão "Focar em SP" ───────────────────────────────────────────────────
  const btnFocus = document.getElementById('btnFocusMap');
  if (btnFocus) {
    btnFocus.addEventListener('click', () => {
      if (mapGL) {
        mapGL.flyTo({
          center: SP_CENTER,
          zoom: is3DMode ? 14.5 : 13.5,
          pitch: is3DMode ? 60 : 0,
          bearing: is3DMode ? -20 : 0,
          duration: 1500
        });
      }
    });
  }

  // ── Checkboxes de Filtros ─────────────────────────────────────────────────
  ['layerCritical', 'layerWarning', 'layerClimate', 'layerInfra', 'layerSafe'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.addEventListener('change', atualizarMarcadoresGL);
  });

  const cbZones = document.getElementById('layerZones');
  if (cbZones) cbZones.addEventListener('change', atualizarMarcadoresGL);

  const cbHeatmap = document.getElementById('layerHeatmap');
  if (cbHeatmap) cbHeatmap.addEventListener('change', atualizarMarcadoresGL);

  // ── API Fetch e Fallback ──────────────────────────────────────────────────
  async function fetchOcorrenciasAPI(page = 1, pageSize = 100) {
    const url = `${API_BASE_URL}/ocorrencias?page=${page}&page_size=${pageSize}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function carregarOcorrenciasNoMapa() {
    try {
      const dados = await fetchOcorrenciasAPI(1, 100);
      const bos   = dados.ocorrencias || [];
      lastBoData = bos;
      atualizarEstatisticas(bos, dados.total);
      atualizarMarcadoresGL();
      mostrarToast('✅ Mapa Atualizado', `${bos.length} BOs sincronizados com FastAPI`, 'safe');
    } catch (err) {
      console.warn('[Sentinel Mapa] Backend indisponível, usando fallback offline:', err.message);
      carregarFallbackEstatico();
    }
  }

  function carregarFallbackEstatico() {
    const fallbackBOs = [
      { id:'F-01', numero_bo:'98124/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Celular', bairro:'Sé', logradouro:'Praça da Sé', latitude:-23.5505, longitude:-46.6333, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-02', numero_bo:'98125/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo de Veículo', bairro:'Pinheiros', logradouro:'Av. Faria Lima', latitude:-23.5675, longitude:-46.6920, gravidade:'ALTA', status:'Registrado' },
      { id:'F-03', numero_bo:'98126/2026', data_hora: new Date().toISOString(), tipo_crime:'Monitoramento Climático', bairro:'Moema', logradouro:'Parque Ibirapuera', latitude:-23.5876, longitude:-46.6580, gravidade:'MEDIA', status:'Monitorando' },
      { id:'F-04', numero_bo:'98127/2026', data_hora: new Date().toISOString(), tipo_crime:'Ronda Preventiva', bairro:'Tatuapé', logradouro:'Praça Silvio Romero', latitude:-23.5410, longitude:-46.5750, gravidade:'BAIXA', status:'Seguro' },
      { id:'F-05', numero_bo:'98128/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Veículo', bairro:'Lapa', logradouro:'Rua 12 de Outubro', latitude:-23.5350, longitude:-46.7020, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-06', numero_bo:'98129/2026', data_hora: new Date().toISOString(), tipo_crime:'Alagamento', bairro:'Brás', logradouro:'Av. Rangel Pestana', latitude:-23.5480, longitude:-46.6050, gravidade:'ALTA', status:'Alerta Ativo' },
      { id:'F-07', numero_bo:'98130/2026', data_hora: new Date().toISOString(), tipo_crime:'Câmera OCR Ativa', bairro:'Consolação', logradouro:'Av. Paulista, 1578', latitude:-23.5614, longitude:-46.6560, gravidade:'MEDIA', status:'Operacional' },
      { id:'F-08', numero_bo:'98131/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo em Andamento', bairro:'Brasilândia', logradouro:'Est. do Sabão', latitude:-23.4610, longitude:-46.6950, gravidade:'CRITICA', status:'Urgente' }
    ];
    lastBoData = fallbackBOs;
    atualizarEstatisticas(fallbackBOs, fallbackBOs.length);
    atualizarMarcadoresGL();
  }

  function mostrarToast(title, desc, severity) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const cfg = {
      safe: { emoji: '✅' },
      warning: { emoji: '⚠️' },
      critical: { emoji: '🚨' },
      info: { emoji: '🔵' }
    }[severity] || { emoji: '📡' };

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

  // ── Inicialização ─────────────────────────────────────────────────────────
  async function inicializar() {
    initMap();
    await carregarOcorrenciasNoMapa();

    setInterval(async () => {
      try {
        const dados = await fetchOcorrenciasAPI(1, 100);
        lastBoData = dados.ocorrencias || [];
        atualizarEstatisticas(lastBoData, dados.total);
        atualizarMarcadoresGL();
      } catch (e) {
        console.warn('[Auto-refresh] Offline:', e.message);
      }
    }, REFRESH_MS);
  }

  inicializar();

  window.addEventListener('resize', () => {
    if (mapGL) mapGL.resize();
  });

})();


