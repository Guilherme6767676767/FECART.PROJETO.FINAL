/* ============================================
   SENTINEL IA — Mapa de Monitoramento Urbano
   JavaScript Controller — Sistema de 5 Cores & Tempo Real
   ============================================ */

(function () {
  'use strict';

  // ── Initialize Lucide Icons ──
  if (window.lucide) {
    lucide.createIcons();
  }

  // ── Clock ──
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const el = document.getElementById('topbarTime');
    if (el) el.textContent = time;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ── Sidebar Toggle (Mobile) ──
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    const mainMapEl = document.getElementById('mainMap');
    if (mainMapEl) {
      mainMapEl.addEventListener('click', function () {
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  // ── Map Configuration & Initialization ──
  const SP_CENTER = [-23.5505, -46.6333];
  const SP_ZOOM = 12;

  const map = L.map('mainMap', {
    center: SP_CENTER,
    zoom: SP_ZOOM,
    zoomControl: true,
    attributionControl: true
  });

  // Dark CartoDB tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // ── Cores e Definições do Sistema de 5 Cores ──
  const severityConfig = {
    critical: {
      color: '#ef4444',
      badgeClass: 'critical',
      label: '🔴 Emergência / Risco Alto',
      name: 'Vermelho'
    },
    warning: {
      color: '#f59e0b',
      badgeClass: 'warning',
      label: '🟡 Alerta / Atenção / Trânsito',
      name: 'Amarelo'
    },
    climate: {
      color: '#3b82f6',
      badgeClass: 'climate',
      label: '🔵 Clima / Pluviometria',
      name: 'Azul'
    },
    infra: {
      color: '#a855f7',
      badgeClass: 'infra',
      label: '🟣 IA OCR / Sensores / Infra',
      name: 'Roxo'
    },
    safe: {
      color: '#10b981',
      badgeClass: 'safe',
      label: '🟢 Zona Segura / Patrulha',
      name: 'Verde'
    }
  };

  // ── Locais Iniciais em Toda a Cidade de SP e Região Metropolitana ──
  const initialLocations = [
    // CENTRO
    { lat: -23.5505, lng: -46.6333, name: 'Praça da Sé — Centro', type: 'Disparo de Alarme de Emergência', severity: 'critical' },
    { lat: -23.5437, lng: -46.6366, name: 'Estação Luz — Centro', type: 'Detecção de Objeto Abandonado', severity: 'critical' },
    { lat: -23.5475, lng: -46.6430, name: 'República — Rua da Consolação', type: 'Aglomeração Monitorada', severity: 'warning' },
    { lat: -23.5412, lng: -46.6290, name: 'Mercado Municipal — Centro', type: 'Fluxo Turístico Intenso', severity: 'safe' },
    { lat: -23.5560, lng: -46.6390, name: 'Liberdade — Praça da Liberdade', type: 'Patrulhamento Preventivo Ativo', severity: 'safe' },

    // ZONA SUL
    { lat: -23.5614, lng: -46.6560, name: 'Av. Paulista, 1578 — Bela Vista', type: 'Leitura de Placas OCR (IA)', severity: 'infra' },
    { lat: -23.6010, lng: -46.6620, name: 'Moema — Av. Ibirapuera', type: 'Sensor Pluviométrico (Chuva)', severity: 'climate' },
    { lat: -23.5876, lng: -46.6580, name: 'Parque Ibirapuera — Moema', type: 'Monitoramento de Temperatura 26°C', severity: 'climate' },
    { lat: -23.6260, lng: -46.6990, name: 'Santo Amaro — Largo Treze', type: 'Alertas de Trânsito / Congestionamento', severity: 'warning' },
    { lat: -23.6110, lng: -46.6950, name: 'Brooklin — Av. Berrini', type: 'Leitor Facial IA — Operativo', severity: 'infra' },
    { lat: -23.6480, lng: -46.6710, name: 'Campo Grande — Interlagos', type: 'Monitoramento do Nível da Represa', severity: 'climate' },
    { lat: -23.6820, lng: -46.6890, name: 'Grajaú — Terminal', type: 'Disparo de Alerta de Segurança', severity: 'critical' },

    // ZONA OESTE
    { lat: -23.5675, lng: -46.6920, name: 'Pinheiros — Faria Lima', type: 'Fluxo Veicular e Ronda Ativa', severity: 'safe' },
    { lat: -23.5580, lng: -46.6830, name: 'Vila Madalena — Rua Aspicuelta', type: 'Controle de Ruído e Aglomeração', severity: 'warning' },
    { lat: -23.5690, lng: -46.7280, name: 'Butantã — Portaria USP', type: 'Posto Policial — Operação Normal', severity: 'safe' },
    { lat: -23.5227, lng: -46.6872, name: 'Barra Funda — Terminal', type: 'Câmera OCR — Anomalia Detectada', severity: 'infra' },
    { lat: -23.5350, lng: -46.7020, name: 'Lapa — Rua 12 de Outubro', type: 'Tentativa de Furto em Andamento', severity: 'critical' },
    { lat: -23.5910, lng: -46.7450, name: 'Vila Sônia — Av. Francisco Morato', type: 'Sensor de Ruído IoT Ativo', severity: 'infra' },

    // ZONA NORTE
    { lat: -23.5050, lng: -46.6260, name: 'Santana — Av. Cruzeiro do Sul', type: 'Operação de Trânsito / Bloqueio', severity: 'warning' },
    { lat: -23.4790, lng: -46.6020, name: 'Tucuruvi — Av. Mazzei', type: 'Monitoramento Climático — Vento', severity: 'climate' },
    { lat: -23.4980, lng: -46.6580, name: 'Casa Verde — Av. Braz Leme', type: 'Patrulha Urbana — Sem Anomalias', severity: 'safe' },
    { lat: -23.4830, lng: -46.6710, name: 'Freguesia do Ó — Largo da Matriz', type: 'Manutenção Preventiva de Câmera', severity: 'infra' },
    { lat: -23.4610, lng: -46.6950, name: 'Brasilândia — Estr. do Sabão', type: 'Ocorrência Prioritária — Ronda Solicitada', severity: 'critical' },

    // ZONA LESTE
    { lat: -23.5410, lng: -46.5750, name: 'Tatuapé — Praça Silvio Romero', type: 'Ronda Policial Comunitária', severity: 'safe' },
    { lat: -23.5550, lng: -46.5980, name: 'Mooca — Rua da Mooca', type: 'Alerta de Tráfego Lento', severity: 'warning' },
    { lat: -23.5370, lng: -46.4680, name: 'Itaquera — Arena Corinthians', type: 'Câmeras Inteligentes com OCR', severity: 'infra' },
    { lat: -23.5230, lng: -46.5490, name: 'Penha — Av. Amador Bueno', type: 'Sensor Ambientalista Pluviométrico', severity: 'climate' },
    { lat: -23.5040, lng: -46.4420, name: 'São Miguel Paulista — Estação', type: 'Ocorrência em Verificação', severity: 'critical' },
    { lat: -23.5790, lng: -46.5430, name: 'Vila Prudente — Terminal', type: 'Trânsito Livre / Status Seguro', severity: 'safe' },
    { lat: -23.5930, lng: -46.5010, name: 'Sapopemba — Av. Sapopemba', type: 'Ponto de Atenção em Alagamento', severity: 'warning' },

    // REGIÃO METROPOLITANA (ABC, GUARULHOS, OSASCO)
    { lat: -23.6540, lng: -46.5310, name: 'Santo André — Centro / Paço', type: 'Radar IoT de Monitoramento Ativo', severity: 'infra' },
    { lat: -23.6930, lng: -46.5650, name: 'São Bernardo do Campo — Rudge Ramos', type: 'Alerta Climatológico — Chuva Forte', severity: 'climate' },
    { lat: -23.6180, lng: -46.5540, name: 'São Caetano do Sul — Av. Goiás', type: 'Zona Monitorada — Segurança Alta', severity: 'safe' },
    { lat: -23.5320, lng: -46.7920, name: 'Osasco — Centro / Calçadão', type: 'Assalto Detectado via IA', severity: 'critical' },
    { lat: -23.4620, lng: -46.5330, name: 'Guarulhos — Centro / Av. Tiradentes', type: 'Lentidão no Trânsito e Obras', severity: 'warning' },
    { lat: -23.5060, lng: -46.8450, name: 'Barueri — Alphaville', type: 'Ronda Privada e Câmeras IA', severity: 'safe' },
    { lat: -23.6210, lng: -46.7890, name: 'Taboão da Serra — Centro', type: 'Estação de Monitoramento Climático', severity: 'climate' }
  ];

  // Armazenamento global dos marcadores ativos no Leaflet
  const activeMarkers = [];

  // Helper para formatar hora atual
  function getFormattedTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day}/${month}/${year} ${time}`;
  }

  // ── Notificações Toast em Tempo Real ──
  function showToastNotification(title, desc, severity) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `sentinel-toast ${severity}`;

    const cfg = severityConfig[severity] || severityConfig.warning;

    toast.innerHTML = `
      <div style="font-size:1.2rem; line-height:1; margin-top:2px;">
        ${cfg.name === 'Vermelho' ? '🚨' : cfg.name === 'Amarelo' ? '⚠️' : cfg.name === 'Azul' ? '🌧️' : cfg.name === 'Roxo' ? '🤖' : '🛡️'}
      </div>
      <div style="flex:1;">
        <div class="sentinel-toast-title">${title}</div>
        <div class="sentinel-toast-desc">${desc}</div>
        <div class="sentinel-toast-time">${getFormattedTimestamp()} • Notificação enviada ao cliente</div>
      </div>
    `;

    container.appendChild(toast);

    // Auto remove após 5 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // ── Gerar Pop-up HTML Customizado ──
  function createPopupHTML(loc) {
    const cfg = severityConfig[loc.severity] || severityConfig.warning;
    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-severity ${cfg.badgeClass}"></span>
          <span class="popup-title">${loc.name}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Informação</span>
          <span class="popup-value" style="font-weight:600;">${loc.type}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Nível da Bolinha</span>
          <span class="popup-badge ${cfg.badgeClass}">${cfg.label}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Horário</span>
          <span class="popup-value mono">${loc.timestamp}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Coordenadas</span>
          <span class="popup-value mono">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</span>
        </div>
      </div>
    `;
  }

  // ── Adicionar Marcador com Animação Neon no Mapa ──
  function addMarker(loc) {
    if (!loc.timestamp) {
      loc.timestamp = getFormattedTimestamp();
    }

    const cfg = severityConfig[loc.severity] || severityConfig.warning;

    const icon = L.divIcon({
      className: 'custom-animated-marker',
      html: `<div class="marker-neon" style="
        width: 16px; 
        height: 16px; 
        background: ${cfg.color}; 
        --pulse-color: ${cfg.color};
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: icon }).addTo(map);

    marker.bindPopup(createPopupHTML(loc), {
      maxWidth: 290,
      className: 'dark-popup'
    });

    const markerObj = { marker: marker, data: loc };
    activeMarkers.push(markerObj);

    return markerObj;
  }

  // Adicionar todos os pontos iniciais
  initialLocations.forEach(addMarker);

  // ── Camada Térmica (Heatmap) ──
  function generateHeatPoints() {
    return initialLocations.map(l => [l.lat, l.lng, Math.random()]);
  }

  let heatLayer = null;
  if (typeof L.heatLayer === 'function') {
    heatLayer = L.heatLayer(generateHeatPoints(), {
      radius: 28,
      blur: 20,
      maxZoom: 15,
      gradient: { 0.2: '#10b981', 0.4: '#3b82f6', 0.6: '#a855f7', 0.8: '#f59e0b', 1.0: '#ef4444' }
    }).addTo(map);
  }

  // ── Filtro por Cor de Alerta (Checkboxes) ──
  const filters = {
    layerCritical: 'critical',
    layerWarning: 'warning',
    layerClimate: 'climate',
    layerInfra: 'infra',
    layerSafe: 'safe'
  };

  function updateVisibleMarkers() {
    activeMarkers.forEach(item => {
      const severity = item.data.severity;
      let shouldShow = false;

      Object.keys(filters).forEach(cbId => {
        const checkbox = document.getElementById(cbId);
        if (checkbox && checkbox.checked && filters[cbId] === severity) {
          shouldShow = true;
        }
      });

      if (shouldShow) {
        if (!map.hasLayer(item.marker)) map.addLayer(item.marker);
      } else {
        if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
      }
    });
  }

  Object.keys(filters).forEach(cbId => {
    const cb = document.getElementById(cbId);
    if (cb) {
      cb.addEventListener('change', updateVisibleMarkers);
    }
  });

  const cbHeatmap = document.getElementById('layerHeatmap');
  if (cbHeatmap && heatLayer) {
    cbHeatmap.addEventListener('change', function () {
      if (this.checked) map.addLayer(heatLayer);
      else map.removeLayer(heatLayer);
    });
  }

  // ── Funcionalidade de Busca por Bairro / Região ──
  function performSearch() {
    const input = document.getElementById('mapSearchInput');
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    // Procura por nome equivalente
    const found = activeMarkers.find(item => item.data.name.toLowerCase().includes(query));

    if (found) {
      map.flyTo([found.data.lat, found.data.lng], 14, { animate: true, duration: 1.5 });
      found.marker.openPopup();
      showToastNotification(
        `Local Encontrado: ${found.data.name}`,
        `Mostrando notificações no mapa com status ${found.data.type}.`,
        found.data.severity
      );
    } else {
      showToastNotification(
        'Busca Geoespacial',
        `Nenhuma ocorrência específica em "${query}". Tente buscar: Paulista, Moema, Tatuapé, Osasco, Guarulhos ou Centro.`,
        'warning'
      );
    }
  }

  const btnSearch = document.getElementById('mapSearchBtn');
  const inputSearch = document.getElementById('mapSearchInput');
  if (btnSearch) btnSearch.addEventListener('click', performSearch);
  if (inputSearch) {
    inputSearch.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') performSearch();
    });
  }

  // ── Motor em Tempo Real (Gerador de Novas Notificações) ──
  const realTimeEvents = [
    { type: 'Roubo de Veículo em Progresso', severity: 'critical', name: 'Pinheiros — Marginal Pinheiros' },
    { type: 'Incêndio em Terreno Comercial', severity: 'critical', name: 'Brás — Rua das Rendas' },
    { type: 'Acidente Grave com Bloqueio', severity: 'critical', name: 'Guarulhos — Rodovia Dutra' },
    { type: 'Alagamento em Ponto Crítico', severity: 'warning', name: 'Mooca — Av. Anhaia Mello' },
    { type: 'Aglomeração e Obra Sem Sinalização', severity: 'warning', name: 'Santo Amaro — Av. Santo Amaro' },
    { type: 'Queda de Árvore com Trânsito Lento', severity: 'warning', name: 'Vila Mariana — Rua Domingos de Morais' },
    { type: 'Sensor Pluviométrico: Chuva Forte 35mm', severity: 'climate', name: 'Parelheiros — Zona Sul' },
    { type: 'Índice de Qualidade do Ar Excelente', severity: 'climate', name: 'Parque do Carmo — Itaquera' },
    { type: 'Detector de Temperatura Baixa 14°C', severity: 'climate', name: 'Tremembé — Cantareira' },
    { type: 'Leitor OCR: Veículo Procurado Identificado', severity: 'infra', name: 'Consolação — Av. Rebouças' },
    { type: 'Manutenção Automática de Câmera IA', severity: 'infra', name: 'Moema — Av. dos Bandeirantes' },
    { type: 'Posto Policial Móvel Ativo', severity: 'safe', name: 'Tatuapé — Radial Leste' },
    { type: 'Ronda Noturna Urbana Segura', severity: 'safe', name: 'Santana — Av. Braz Leme' }
  ];

  setInterval(function () {
    const randomEvt = realTimeEvents[Math.floor(Math.random() * realTimeEvents.length)];

    // Coordenadas aleatórias na Grande SP
    const lat = -23.45 - Math.random() * 0.25;
    const lng = -46.45 - Math.random() * 0.40;

    const newLoc = {
      lat: lat,
      lng: lng,
      name: randomEvt.name,
      type: randomEvt.type,
      severity: randomEvt.severity,
      timestamp: getFormattedTimestamp()
    };

    addMarker(newLoc);
    updateVisibleMarkers();
    updateStatsCounter();

    // Notificar cliente via Toast
    const cfg = severityConfig[newLoc.severity];
    showToastNotification(
      `Novo Evento (${cfg.name}): ${newLoc.name}`,
      `${newLoc.type}. Notificação registrada em tempo real.`,
      newLoc.severity
    );
  }, 9000);

  // ── Atualização dos Contadores de Estatísticas ──
  function updateStatsCounter() {
    const criticalCount = activeMarkers.filter(m => m.data.severity === 'critical').length;
    const warningCount = activeMarkers.filter(m => m.data.severity === 'warning').length;
    const climateCount = activeMarkers.filter(m => m.data.severity === 'climate').length;
    const infraCount = activeMarkers.filter(m => m.data.severity === 'infra').length;
    const safeCount = activeMarkers.filter(m => m.data.severity === 'safe').length;

    const elTotal = document.getElementById('statOcorrencias');
    const elCritical = document.getElementById('statZonas');
    const elWarning = document.getElementById('statAlertasMedios');
    const elSafe = document.getElementById('statSensores');

    if (elTotal) elTotal.textContent = activeMarkers.length;
    if (elCritical) elCritical.textContent = criticalCount;
    if (elWarning) elWarning.textContent = warningCount;
    if (elSafe) elSafe.textContent = safeCount + climateCount + infraCount;
  }
  updateStatsCounter();

  // ── Gerador de Relatório Instantâneo para o Cliente ──
  const btnReport = document.getElementById('btnGenerateReport');
  if (btnReport) {
    btnReport.addEventListener('click', function () {
      const counts = {
        critical: activeMarkers.filter(m => m.data.severity === 'critical').length,
        warning: activeMarkers.filter(m => m.data.severity === 'warning').length,
        climate: activeMarkers.filter(m => m.data.severity === 'climate').length,
        infra: activeMarkers.filter(m => m.data.severity === 'infra').length,
        safe: activeMarkers.filter(m => m.data.severity === 'safe').length
      };

      const modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'sentinel-modal-backdrop';

      modalBackdrop.innerHTML = `
        <div class="sentinel-modal">
          <div class="sentinel-modal-header">
            <div class="sentinel-modal-title">
              <i data-lucide="shield" style="color:var(--cyan);"></i>
              Relatório Geral em Tempo Real — Sentinel IA
            </div>
            <button class="btn-icon" id="btnCloseModal" aria-label="Fechar">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="sentinel-modal-body">
            <p><strong>Status de Cobertura:</strong> Monitoramento ativo em 100% dos setores de São Paulo e Região Metropolitana.</p>
            <p style="margin-bottom:1.25rem;"><strong>Emissão:</strong> ${getFormattedTimestamp()}</p>
            
            <h4 style="color:#fff; margin-bottom:0.75rem;">Resumo de Notificações por Nível de Alerta:</h4>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:1.5rem;">
              <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#ef4444;">${counts.critical}</div>
                <div style="font-size:0.75rem; color:#aaa;">🔴 Emergência</div>
              </div>
              <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#f59e0b;">${counts.warning}</div>
                <div style="font-size:0.75rem; color:#aaa;">🟡 Alertas</div>
              </div>
              <div style="background:rgba(59,130,246,0.1); border:1px solid #3b82f6; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#3b82f6;">${counts.climate}</div>
                <div style="font-size:0.75rem; color:#aaa;">🔵 Clima</div>
              </div>
              <div style="background:rgba(168,85,247,0.1); border:1px solid #a855f7; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#a855f7;">${counts.infra}</div>
                <div style="font-size:0.75rem; color:#aaa;">🟣 Infra / IA</div>
              </div>
              <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:8px; padding:10px; text-align:center;">
                <div style="font-size:1.4rem; font-weight:800; color:#10b981;">${counts.safe}</div>
                <div style="font-size:0.75rem; color:#aaa;">🟢 Zonas Seguras</div>
              </div>
            </div>

            <h4 style="color:#fff; margin-bottom:0.75rem;">Últimas Ocorrências Registradas:</h4>
            <ul style="padding-left:1.2rem; display:flex; flex-direction:column; gap:6px;">
              ${activeMarkers.slice(-6).reverse().map(m => `
                <li><strong>[${m.data.name}]</strong> ${m.data.type} (${m.data.timestamp})</li>
              `).join('')}
            </ul>
          </div>
          <div class="sentinel-modal-footer">
            <button class="btn btn-secondary btn-sm" id="btnPrintModal">Imprimir / Salvar PDF</button>
            <button class="btn btn-primary btn-sm" id="btnCloseModal2">Fechar Relatório</button>
          </div>
        </div>
      `;

      document.body.appendChild(modalBackdrop);
      if (window.lucide) lucide.createIcons();

      const close1 = document.getElementById('btnCloseModal');
      const close2 = document.getElementById('btnCloseModal2');
      const printBtn = document.getElementById('btnPrintModal');

      const closeModal = () => modalBackdrop.remove();

      if (close1) close1.addEventListener('click', closeModal);
      if (close2) close2.addEventListener('click', closeModal);
      if (printBtn) printBtn.addEventListener('click', () => window.print());
    });
  }

})();
