/* ============================================
   SENTINEL IA — Mapa de Monitoramento Urbano
   VERSÃO 5.1 — Leaflet.js 2D Dark Mode
   - CartoDB Dark Matter (100% gratuito, sem API Key)
   - Marcadores interativos com dados da API /api/v1/ocorrencias
   - Heatmap com Leaflet.heat
   - Filtros por gravidade (CRITICA, ALTA, MEDIA, BAIXA)
   - Auto-refresh 30s
   ============================================ */

(function () {
  'use strict';

  // ── Constantes ──────────────────────────────────────────────────────────────
  const API_BASE_URL = window.SENTINEL_API_URL || '/api';
  const SP_CENTER    = [-23.5505, -46.6333];
  const SP_ZOOM      = 12;
  const REFRESH_MS   = 30 * 1000;

  // ── Lucide Icons ───────────────────────────────────────────────────────────
  if (window.lucide) lucide.createIcons();

  // ── Mapa Leaflet ───────────────────────────────────────────────────────────
  const map = L.map('mainMap', {
    center: SP_CENTER,
    zoom: SP_ZOOM,
    minZoom: 10,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: true
  });

  // OpenStreetMap tiles – free, no API key required
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // New layer groups for crimes and flood‑risk points
  const crimeLayer = L.layerGroup().addTo(map);
  const floodLayer = L.layerGroup().addTo(map);

  // ── Relógio ────────────────────────────────────────────────────────────────
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

  // ── Mapa Leaflet ───────────────────────────────────────────────────────────
  
  // ── Gravidade → Estilos ────────────────────────────────────────────────────
  const gravityConfig = {
    CRITICA: { color: '#ef4444', badgeClass: 'critical', label: '🔴 Severidade Crítica', emoji: '🚨', iconName: 'alert-triangle', heatIntensity: 1.0 },
    ALTA:    { color: '#f59e0b', badgeClass: 'warning',  label: '🟡 Severidade Alta',    emoji: '⚠️', iconName: 'alert-circle',   heatIntensity: 0.7 },
    MEDIA:   { color: '#3b82f6', badgeClass: 'info',     label: '🔵 Severidade Média',   emoji: '🔵', iconName: 'info',           heatIntensity: 0.45 },
    BAIXA:   { color: '#10b981', badgeClass: 'safe',     label: '🟢 Severidade Baixa',   emoji: '🛡️', iconName: 'shield-check',   heatIntensity: 0.2 }
  };

  function getGravityConfig(g) {
    return gravityConfig[String(g).toUpperCase()] || gravityConfig.MEDIA;
  }

  function formatarDataHora(iso) {
    try {
      const d = new Date(iso);
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    } catch { return iso || '—'; }
  }

  function criarPopupHTML(bo) {
    const cfg = getGravityConfig(bo.gravidade);
    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-severity ${cfg.badgeClass}"></span>
          <span class="popup-title">${bo.tipo_crime || 'Ocorrência'}</span>
        </div>
        <div class="popup-row"><span class="popup-label">Nº BO</span><span class="popup-value mono">${bo.numero_bo || '—'}</span></div>
        <div class="popup-row"><span class="popup-label">Bairro</span><span class="popup-value">${bo.bairro || '—'}</span></div>
        <div class="popup-row"><span class="popup-label">Logradouro</span><span class="popup-value" style="font-size:0.75rem;">${bo.logradouro || '—'}</span></div>
        <div class="popup-row"><span class="popup-label">Data / Hora</span><span class="popup-value mono">${formatarDataHora(bo.data_hora)}</span></div>
        <div class="popup-row"><span class="popup-label">Severidade</span><span class="popup-badge ${cfg.badgeClass}">${cfg.label}</span></div>
        <div class="popup-row"><span class="popup-label">Status</span><span class="popup-value">${bo.status || 'Em Análise'}</span></div>
      </div>
    `;
  }

  // ── Layers ─────────────────────────────────────────────────────────────────
  const crimeLayer = L.layerGroup().addTo(map);
  const staticLayerGroup  = L.layerGroup().addTo(map);
  let heatLayer = null;
  let allApiMarkers = [];
  let lastBoData = [];

  // ── Zonas AOI ──────────────────────────────────────────────────────────────
  const zonePolygons = [
    { coords: [[-23.5350,-46.6500],[-23.5320,-46.6200],[-23.5600,-46.6150],[-23.5650,-46.6450]], color:'#ef4444', name:'Zona Central — Risco Crítico' },
    { coords: [[-23.5150,-46.7200],[-23.5050,-46.6400],[-23.5350,-46.6450],[-23.5450,-46.7150]], color:'#f59e0b', name:'Corredor Trânsito & Marginais' },
    { coords: [[-23.5950,-46.7200],[-23.5850,-46.6400],[-23.6700,-46.6200],[-23.6800,-46.7100]], color:'#3b82f6', name:'Bacia Hidrográfica Sul' },
    { coords: [[-23.5550,-46.6750],[-23.5500,-46.6500],[-23.6150,-46.6850],[-23.6200,-46.7050]], color:'#a855f7', name:'Eixo Financeiro — IA OCR' },
    { coords: [[-23.5250,-46.5900],[-23.5150,-46.4300],[-23.5900,-46.4500],[-23.5950,-46.5800]], color:'#10b981', name:'Zona Leste — Monitorada' }
  ];

  zonePolygons.forEach(z => {
    L.polygon(z.coords, {
      color: z.color, weight: 1.5, dashArray: '5, 5',
      fillColor: z.color, fillOpacity: 0.12
    }).addTo(staticLayerGroup).bindTooltip(`<b>${z.name}</b>`, { sticky: true, className: 'dark-popup' });
  });

  // ── Marcadores ─────────────────────────────────────────────────────────────
  function adicionarMarcadorBO(bo) {
    const cfg = getGravityConfig(bo.gravidade);
    const icon = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="sentinel-map-pin ${cfg.badgeClass}" style="--pin-color: ${cfg.color};"><i data-lucide="${cfg.iconName}"></i><div class="pin-pulse-ring"></div></div>`,
      iconSize: [24, 24], iconAnchor: [12, 12]
    });
    const marker = L.marker([bo.latitude, bo.longitude], { icon }).addTo(crimeLayer);
    marker.bindPopup(criarPopupHTML(bo), { maxWidth: 300, className: 'dark-popup' });
    if (window.lucide) setTimeout(() => lucide.createIcons(), 15);
    return { marker, bo };
  }

  // ── Heatmap ────────────────────────────────────────────────────────────────
  function atualizarHeatmap(bos) {
    const pts = bos.filter(b => b.latitude && b.longitude).map(b => [
      parseFloat(b.latitude), parseFloat(b.longitude), getGravityConfig(b.gravidade).heatIntensity
    ]);
    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    if (typeof L.heatLayer === 'function' && pts.length > 0) {
      heatLayer = L.heatLayer(pts, {
        radius: 38, blur: 28, maxZoom: 15, minOpacity: 0.2,
        gradient: { 0.2:'#10b981', 0.4:'#3b82f6', 0.6:'#a855f7', 0.8:'#f59e0b', 1.0:'#ef4444' }
      }).addTo(map);
    }
    const cb = document.getElementById('layerHeatmap');
    if (cb && heatLayer && !cb.checked) map.removeLayer(heatLayer);
  }

  // ── Estatísticas ───────────────────────────────────────────────────────────
  function atualizarEstatisticas(bos, total) {
    const criticas = bos.filter(b => String(b.gravidade).toUpperCase() === 'CRITICA').length;
    const altas    = bos.filter(b => String(b.gravidade).toUpperCase() === 'ALTA').length;
    const outras   = bos.filter(b => !['CRITICA','ALTA'].includes(String(b.gravidade).toUpperCase())).length;
    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    el('statOcorrencias', total || bos.length);
    el('statZonas', criticas);
    el('statAlertasMedios', altas);
    el('statSensores', outras);
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  function aplicarFiltros() {
    const critica = document.getElementById('layerCritical')?.checked ?? true;
    const alta    = document.getElementById('layerWarning')?.checked ?? true;
    const media   = document.getElementById('layerClimate')?.checked ?? true;
    const baixa   = document.getElementById('layerSafe')?.checked ?? true;
    allApiMarkers.forEach(({ marker, bo }) => {
      const g = String(bo.gravidade).toUpperCase();
      const v = (g==='CRITICA'&&critica)||(g==='ALTA'&&alta)||(g==='MEDIA'&&media)||(g==='BAIXA'&&baixa);
      if (v) { if (!markersLayerGroup.hasLayer(marker)) markersLayerGroup.addLayer(marker); }
      else   { if (markersLayerGroup.hasLayer(marker)) markersLayerGroup.removeLayer(marker); }
    });
  }

  ['layerCritical','layerWarning','layerClimate','layerInfra','layerSafe'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.addEventListener('change', aplicarFiltros);
  });

  const cbZones = document.getElementById('layerZones');
  if (cbZones) cbZones.addEventListener('change', function() {
    if (this.checked) map.addLayer(staticLayerGroup); else map.removeLayer(staticLayerGroup);
  });

  const cbHeatmap = document.getElementById('layerHeatmap');
  if (cbHeatmap) cbHeatmap.addEventListener('change', function() {
    if (heatLayer) { if (this.checked) map.addLayer(heatLayer); else map.removeLayer(heatLayer); }
  });

  // ── API ────────────────────────────────────────────────────────────────────
  async function fetchOcorrenciasAPI(page = 1, pageSize = 100) {
    const r = await fetch(`${API_BASE_URL}/ocorrencias?page=${page}&page_size=${pageSize}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function carregarOcorrenciasNoMapa() {
    try {
      mostrarLoading(true);
      const dados = await fetchOcorrenciasAPI(1, 100);
      const bos = dados.ocorrencias || [];
      lastBoData = bos;
      renderizarMarcadores(bos, dados.total);
      atualizarHeatmap(bos);
      atualizarEstatisticas(bos, dados.total);
      mostrarLoading(false);
      mostrarToast('✅ Mapa Atualizado', `${bos.length} BOs carregados da API FastAPI`, 'safe');
    } catch (err) {
      mostrarLoading(false);
      console.warn('[Sentinel] Backend offline, usando fallback:', err.message);
      mostrarToast('⚠️ Backend Offline', 'Exibindo dados locais de demonstração.', 'warning');
      carregarFallbackEstatico();
    }
  }

  function renderizarMarcadores(bos, total) {
    markersLayerGroup.clearLayers();
    allApiMarkers = [];
    bos.forEach(bo => {
      if (!bo.latitude || !bo.longitude) return;
      const lat = parseFloat(bo.latitude), lng = parseFloat(bo.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      allApiMarkers.push(adicionarMarcadorBO(bo));
    });
    aplicarFiltros();
    if (window.lucide) lucide.createIcons();
    invalidarMapa();
  }

  function carregarFallbackEstatico() {
    const fb = [
      { id:'F-01', numero_bo:'98124/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Celular', bairro:'Sé', logradouro:'Praça da Sé', latitude:-23.5505, longitude:-46.6333, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-02', numero_bo:'98125/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo de Veículo', bairro:'Pinheiros', logradouro:'Av. Faria Lima', latitude:-23.5675, longitude:-46.6920, gravidade:'ALTA', status:'Registrado' },
      { id:'F-03', numero_bo:'98126/2026', data_hora: new Date().toISOString(), tipo_crime:'Monitoramento Climático', bairro:'Moema', logradouro:'Parque Ibirapuera', latitude:-23.5876, longitude:-46.6580, gravidade:'MEDIA', status:'Monitorando' },
      { id:'F-04', numero_bo:'98127/2026', data_hora: new Date().toISOString(), tipo_crime:'Ronda Preventiva', bairro:'Tatuapé', logradouro:'Praça Silvio Romero', latitude:-23.5410, longitude:-46.5750, gravidade:'BAIXA', status:'Seguro' },
      { id:'F-05', numero_bo:'98128/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Veículo', bairro:'Lapa', logradouro:'Rua 12 de Outubro', latitude:-23.5350, longitude:-46.7020, gravidade:'CRITICA', status:'Em Atendimento' },
      { id:'F-06', numero_bo:'98129/2026', data_hora: new Date().toISOString(), tipo_crime:'Alagamento', bairro:'Brás', logradouro:'Av. Rangel Pestana', latitude:-23.5480, longitude:-46.6050, gravidade:'ALTA', status:'Alerta Ativo' },
      { id:'F-07', numero_bo:'98130/2026', data_hora: new Date().toISOString(), tipo_crime:'Câmera OCR Ativa', bairro:'Consolação', logradouro:'Av. Paulista, 1578', latitude:-23.5614, longitude:-46.6560, gravidade:'MEDIA', status:'Operacional' },
      { id:'F-08', numero_bo:'98131/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo em Andamento', bairro:'Brasilândia', logradouro:'Est. do Sabão', latitude:-23.4610, longitude:-46.6950, gravidade:'CRITICA', status:'Urgente' }
    ];
    lastBoData = fb;
    renderizarMarcadores(fb, fb.length);
    atualizarHeatmap(fb);
    atualizarEstatisticas(fb, fb.length);
    map.flyTo(SP_CENTER, SP_ZOOM);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  function mostrarLoading(ativo) {
    let el = document.getElementById('mapLoadingOverlay');
    if (ativo) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'mapLoadingOverlay';
        el.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(6,10,20,0.92);border:1px solid rgba(0,229,255,0.25);border-radius:12px;padding:1rem 1.5rem;z-index:9999;color:#00e5ff;font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:0.6rem;backdrop-filter:blur(12px);';
        el.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sincronizando BOs...';
        const w = document.querySelector('.map-page-wrapper');
        if (w) w.appendChild(el);
      }
    } else if (el) el.remove();
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function mostrarToast(title, desc, severity) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const emojis = { safe:'✅', warning:'⚠️', critical:'🚨', info:'🔵' };
    const toast = document.createElement('div');
    toast.className = `sentinel-toast ${severity}`;
    toast.innerHTML = `
      <div style="font-size:1.1rem;line-height:1;margin-top:2px;">${emojis[severity]||'📡'}</div>
      <div style="flex:1;">
        <div class="sentinel-toast-title">${title}</div>
        <div class="sentinel-toast-desc">${desc}</div>
        <div class="sentinel-toast-time">${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • Sentinel IA</div>
      </div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(50px)'; setTimeout(()=>toast.remove(),400); }, 5000);
  }

  function invalidarMapa() { setTimeout(() => map.invalidateSize(), 250); }

  // ── Busca ──────────────────────────────────────────────────────────────────
  function performSearch() {
    const input = document.getElementById('mapSearchInput');
    if (!input) return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const found = allApiMarkers.find(({bo}) =>
      (bo.bairro && bo.bairro.toLowerCase().includes(q)) ||
      (bo.logradouro && bo.logradouro.toLowerCase().includes(q)) ||
      (bo.tipo_crime && bo.tipo_crime.toLowerCase().includes(q))
    );
    if (found) {
      map.flyTo([found.bo.latitude, found.bo.longitude], 15, { animate: true, duration: 1.5 });
      found.marker.openPopup();
      mostrarToast(`📍 ${found.bo.bairro}`, `Ocorrência: ${found.bo.tipo_crime}`, 'info');
    } else {
      mostrarToast('Busca Geoespacial', `Nenhum resultado para "${q}".`, 'warning');
    }
  }

  const btnSearch = document.getElementById('mapSearchBtn');
  const inputSearch = document.getElementById('mapSearchInput');
  if (btnSearch) btnSearch.addEventListener('click', performSearch);
  if (inputSearch) inputSearch.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });

  // ── Focar em SP ────────────────────────────────────────────────────────────
  const btnFocus = document.getElementById('btnFocusMap');
  if (btnFocus) btnFocus.addEventListener('click', () => map.flyTo(SP_CENTER, SP_ZOOM, { animate: true, duration: 1.2 }));

  // ── URL Params ─────────────────────────────────────────────────────────────
  function checkURLAlertParams() {
    const p = new URLSearchParams(window.location.search);
    const lat = parseFloat(p.get('lat')), lng = parseFloat(p.get('lng')), s = p.get('search');
    if (s) { const inp = document.getElementById('mapSearchInput'); if (inp) inp.value = decodeURIComponent(s); }
    if (!isNaN(lat) && !isNaN(lng)) {
      setTimeout(() => { map.flyTo([lat,lng],15,{animate:true,duration:1.8}); }, 600);
    } else if (s) { setTimeout(performSearch, 600); }
  }

  // ── Relatório ──────────────────────────────────────────────────────────────
  const btnReport = document.getElementById('btnGenerateReport');
  if (btnReport) {
    btnReport.addEventListener('click', () => {
      const c = allApiMarkers.filter(({bo})=>String(bo.gravidade).toUpperCase()==='CRITICA').length;
      const a = allApiMarkers.filter(({bo})=>String(bo.gravidade).toUpperCase()==='ALTA').length;
      const m = allApiMarkers.filter(({bo})=>String(bo.gravidade).toUpperCase()==='MEDIA').length;
      const b = allApiMarkers.filter(({bo})=>String(bo.gravidade).toUpperCase()==='BAIXA').length;
      const backdrop = document.createElement('div');
      backdrop.className = 'sentinel-modal-backdrop';
      backdrop.innerHTML = `
        <div class="sentinel-modal">
          <div class="sentinel-modal-header">
            <div class="sentinel-modal-title"><i data-lucide="shield" style="color:var(--cyan);"></i> Relatório — Sentinel IA</div>
            <button class="btn-icon" id="btnCloseModal"><i data-lucide="x"></i></button>
          </div>
          <div class="sentinel-modal-body">
            <p><strong>Fonte:</strong> FastAPI — <code>${API_BASE_URL}/ocorrencias</code></p>
            <p style="margin-bottom:1.25rem;"><strong>Emissão:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:1.5rem;">
              <div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:#ef4444;">${c}</div><div style="font-size:0.75rem;color:#aaa;">🔴 Críticas</div></div>
              <div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:#f59e0b;">${a}</div><div style="font-size:0.75rem;color:#aaa;">🟡 Altas</div></div>
              <div style="background:rgba(59,130,246,0.1);border:1px solid #3b82f6;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:#3b82f6;">${m}</div><div style="font-size:0.75rem;color:#aaa;">🔵 Médias</div></div>
              <div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.4rem;font-weight:800;color:#10b981;">${b}</div><div style="font-size:0.75rem;color:#aaa;">🟢 Baixas</div></div>
            </div>
            <h4 style="color:#fff;margin-bottom:0.75rem;">Últimas Ocorrências:</h4>
            <ul style="padding-left:1.2rem;display:flex;flex-direction:column;gap:6px;">
              ${allApiMarkers.slice(-6).reverse().map(({bo})=>`<li><strong>[${bo.bairro||'—'}]</strong> ${bo.tipo_crime} — BO ${bo.numero_bo} (${formatarDataHora(bo.data_hora)})</li>`).join('')}
            </ul>
          </div>
          <div class="sentinel-modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">Imprimir / PDF</button>
            <button class="btn btn-primary btn-sm" id="btnCloseModal2">Fechar</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      if (window.lucide) lucide.createIcons();
      const close = () => backdrop.remove();
      document.getElementById('btnCloseModal')?.addEventListener('click', close);
      document.getElementById('btnCloseModal2')?.addEventListener('click', close);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    });
  }

  // ── Inicialização ──────────────────────────────────────────────────────────
  async function inicializar() {
    await carregarOcorrenciasNoMapa();
    checkURLAlertParams();
    setInterval(async () => {
      try {
        const d = await fetchOcorrenciasAPI(1, 100);
        renderizarMarcadores(d.ocorrencias || [], d.total);
        atualizarHeatmap(d.ocorrencias || []);
        atualizarEstatisticas(d.ocorrencias || [], d.total);
      } catch (e) { console.warn('[Auto-refresh] Offline:', e.message); }
    }, REFRESH_MS);
  }

  inicializar();
  window.addEventListener('resize', invalidarMapa);

})();
