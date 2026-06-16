/* ============================================
   SENTINEL IA — Mapa de Monitoramento
   JavaScript Controller
   ============================================ */

(function () {
  'use strict';

  // ── Initialize Lucide Icons ──
  lucide.createIcons();

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
    // Close sidebar when clicking on the map
    document.getElementById('mainMap').addEventListener('click', function () {
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ── São Paulo Center ──
  const SP_CENTER = [-23.5505, -46.6333];
  const SP_ZOOM = 12;

  // ── Initialize Leaflet Map ──
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

  // ── Utility: Generate Random Points Around SP ──
  function generatePoints(count, latRange, lngRange, intensityRange) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const lat = latRange[0] + Math.random() * (latRange[1] - latRange[0]);
      const lng = lngRange[0] + Math.random() * (lngRange[1] - lngRange[0]);
      const intensity = intensityRange[0] + Math.random() * (intensityRange[1] - intensityRange[0]);
      points.push([lat, lng, intensity]);
    }
    return points;
  }

  // ── Heatmap Layer Definitions ──
  const heatmapConfig = {
    crime: {
      points: generatePoints(55, [-23.48, -23.65], [-46.55, -46.75], [0.3, 1.0]),
      options: { radius: 25, blur: 18, maxZoom: 15, max: 1.0, gradient: { 0.2: '#2d0a0a', 0.4: '#7f1d1d', 0.6: '#dc2626', 0.8: '#ef4444', 1.0: '#fca5a5' } }
    },
    traffic: {
      points: generatePoints(50, [-23.49, -23.62], [-46.56, -46.72], [0.2, 0.9]),
      options: { radius: 22, blur: 20, maxZoom: 15, max: 1.0, gradient: { 0.2: '#2d1a00', 0.4: '#78350f', 0.6: '#d97706', 0.8: '#f59e0b', 1.0: '#fde68a' } }
    },
    climate: {
      points: generatePoints(40, [-23.50, -23.63], [-46.57, -46.73], [0.2, 0.8]),
      options: { radius: 30, blur: 25, maxZoom: 15, max: 1.0, gradient: { 0.2: '#0a1628', 0.4: '#1e3a5f', 0.6: '#2563eb', 0.8: '#3b82f6', 1.0: '#93c5fd' } }
    },
    health: {
      points: generatePoints(35, [-23.50, -23.64], [-46.58, -46.71], [0.2, 0.7]),
      options: { radius: 28, blur: 22, maxZoom: 15, max: 1.0, gradient: { 0.2: '#022c22', 0.4: '#065f46', 0.6: '#059669', 0.8: '#10b981', 1.0: '#6ee7b7' } }
    },
    infra: {
      points: generatePoints(30, [-23.51, -23.62], [-46.58, -46.70], [0.3, 0.85]),
      options: { radius: 24, blur: 20, maxZoom: 15, max: 1.0, gradient: { 0.2: '#1a0a2e', 0.4: '#4c1d95', 0.6: '#7c3aed', 0.8: '#a855f7', 1.0: '#d8b4fe' } }
    }
  };

  // Create heat layers
  const heatLayers = {};
  Object.keys(heatmapConfig).forEach(function (key) {
    const cfg = heatmapConfig[key];
    heatLayers[key] = L.heatLayer(cfg.points, cfg.options);
  });

  // Add initially checked layers
  heatLayers.crime.addTo(map);
  heatLayers.traffic.addTo(map);

  // ── Layer Toggle Logic ──
  const layerCheckboxes = {
    layerCrime: 'crime',
    layerTraffic: 'traffic',
    layerClimate: 'climate',
    layerHealth: 'health',
    layerInfra: 'infra'
  };

  Object.keys(layerCheckboxes).forEach(function (cbId) {
    const checkbox = document.getElementById(cbId);
    const layerKey = layerCheckboxes[cbId];
    if (checkbox) {
      checkbox.addEventListener('change', function () {
        if (this.checked) {
          heatLayers[layerKey].addTo(map);
        } else {
          map.removeLayer(heatLayers[layerKey]);
        }
      });
    }
  });

  // ── Circle Markers with Popups ──
  const markerLocations = [
    { lat: -23.5505, lng: -46.6333, name: 'Praça da Sé', type: 'Furto Qualificado', severity: 'critical', timestamp: '16/06/2026 11:42' },
    { lat: -23.5614, lng: -46.6560, name: 'Av. Paulista, 1578', type: 'Aglomeração Suspeita', severity: 'warning', timestamp: '16/06/2026 11:38' },
    { lat: -23.5437, lng: -46.6366, name: 'Estação Luz', type: 'Detecção de Arma', severity: 'critical', timestamp: '16/06/2026 11:35' },
    { lat: -23.5876, lng: -46.6580, name: 'Parque Ibirapuera', type: 'Sensor de Movimento', severity: 'info', timestamp: '16/06/2026 11:30' },
    { lat: -23.5227, lng: -46.6872, name: 'Terminal Barra Funda', type: 'Tráfego Anormal', severity: 'warning', timestamp: '16/06/2026 11:27' },
    { lat: -23.5675, lng: -46.6485, name: 'Rua Augusta, 890', type: 'Vandalismo', severity: 'critical', timestamp: '16/06/2026 11:22' },
    { lat: -23.5335, lng: -46.6252, name: 'Av. Tiradentes', type: 'Acidente de Trânsito', severity: 'warning', timestamp: '16/06/2026 11:18' },
    { lat: -23.5950, lng: -46.6890, name: 'Butantã — USP', type: 'Câmera Offline', severity: 'info', timestamp: '16/06/2026 11:15' },
    { lat: -23.5150, lng: -46.6400, name: 'Santana — Metro', type: 'Reconhecimento Facial', severity: 'critical', timestamp: '16/06/2026 11:12' },
    { lat: -23.5560, lng: -46.6130, name: 'Mooca — Rua da Mooca', type: 'Alerta Sonoro', severity: 'warning', timestamp: '16/06/2026 11:08' },
    { lat: -23.5780, lng: -46.6750, name: 'Pinheiros — Largo da Batata', type: 'Multidão Detectada', severity: 'warning', timestamp: '16/06/2026 11:05' },
    { lat: -23.5402, lng: -46.6710, name: 'Lapa — Terminal', type: 'Objeto Abandonado', severity: 'critical', timestamp: '16/06/2026 11:00' },
    { lat: -23.6100, lng: -46.6340, name: 'Jabaquara — Terminal', type: 'Sensor de Temperatura', severity: 'info', timestamp: '16/06/2026 10:55' },
    { lat: -23.4920, lng: -46.6200, name: 'Tucuruvi — Terminal', type: 'Fluxo Veicular Alto', severity: 'info', timestamp: '16/06/2026 10:50' },
    { lat: -23.5680, lng: -46.7080, name: 'Vila Sônia', type: 'Roubo em Andamento', severity: 'critical', timestamp: '16/06/2026 10:45' },
    { lat: -23.5530, lng: -46.6650, name: 'Consolação', type: 'Perturbação da Ordem', severity: 'warning', timestamp: '16/06/2026 10:42' },
    { lat: -23.6030, lng: -46.6690, name: 'Campo Limpo', type: 'Sensor IoT — Anomalia', severity: 'info', timestamp: '16/06/2026 10:38' },
    { lat: -23.5290, lng: -46.6530, name: 'Barra Funda — Marginal', type: 'Veículo Roubado Detectado', severity: 'critical', timestamp: '16/06/2026 10:33' },
  ];

  const severityColors = {
    critical: { color: '#ef4444', fillColor: 'rgba(239, 68, 68, 0.25)', borderWidth: 2 },
    warning:  { color: '#f59e0b', fillColor: 'rgba(245, 158, 11, 0.20)', borderWidth: 2 },
    info:     { color: '#3b82f6', fillColor: 'rgba(59, 130, 246, 0.20)', borderWidth: 2 }
  };

  const severityLabels = {
    critical: 'Crítico',
    warning: 'Alerta',
    info: 'Informação'
  };

  // Store active markers for real-time management
  const activeMarkers = [];

  function createPopupContent(loc) {
    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-severity ${loc.severity}"></span>
          <span class="popup-title">${loc.name}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Tipo</span>
          <span class="popup-value">${loc.type}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Severidade</span>
          <span class="popup-badge ${loc.severity}">${severityLabels[loc.severity]}</span>
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

  // ── Animated Markers Styles ──
  const markerStyles = document.createElement('style');
  markerStyles.innerHTML = `
    .marker-pulse {
      border-radius: 50%;
      box-sizing: border-box;
      animation: pulseAnim 2s infinite;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
    }
    .marker-pulse::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 4px;
      background: #fff;
      border-radius: 50%;
      opacity: 0.8;
    }
    .custom-animated-marker {
      transition: all 0.2s ease;
    }
    .custom-animated-marker:hover .marker-pulse {
      transform: scale(1.6);
      z-index: 1000 !important;
      animation-play-state: paused;
    }
    @keyframes pulseAnim {
      0% { box-shadow: 0 0 0 0 var(--pulse-color); }
      70% { box-shadow: 0 0 0 20px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
  `;
  document.head.appendChild(markerStyles);

  function addMarker(loc) {
    const style = severityColors[loc.severity];
    
    const icon = L.divIcon({
      className: 'custom-animated-marker',
      html: `<div class="marker-pulse" style="
        width: 18px; 
        height: 18px; 
        background: ${style.fillColor}; 
        border: ${style.borderWidth}px solid ${style.color}; 
        --pulse-color: ${style.color}80;
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: icon }).addTo(map);

    marker.bindPopup(createPopupContent(loc), {
      maxWidth: 280,
      className: 'dark-popup'
    });

    activeMarkers.push({ marker: marker, data: loc });
    return marker;
  }

  // Add initial markers
  markerLocations.forEach(addMarker);

  // ── Real-time Simulation ──
  const realtimeTypes = [
    { type: 'Disparo de Alarme', severity: 'warning' },
    { type: 'Veículo Suspeito', severity: 'warning' },
    { type: 'Furto em Progresso', severity: 'critical' },
    { type: 'Pessoa Desaparecida', severity: 'critical' },
    { type: 'Sensor IoT — Pico', severity: 'info' },
    { type: 'Tráfego Congestionado', severity: 'warning' },
    { type: 'Câmera Reativada', severity: 'info' },
    { type: 'Reconhecimento Facial', severity: 'critical' },
    { type: 'Incêndio Detectado', severity: 'critical' },
    { type: 'Alagamento Detectado', severity: 'warning' },
    { type: 'Anomalia Térmica', severity: 'info' },
    { type: 'Desvio de Rota — Ônibus', severity: 'info' },
  ];

  const realtimeNames = [
    'Vila Mariana', 'Tatuapé', 'Itaquera', 'Penha', 'São Miguel',
    'Capão Redondo', 'Grajaú', 'Santo Amaro', 'Ipiranga', 'Vila Prudente',
    'Casa Verde', 'Tremembé', 'Aricanduva', 'Sapopemba', 'Cidade Ademar',
    'Sacomã', 'Liberdade', 'Brás', 'Belém', 'Vila Guilherme'
  ];

  function formatTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day}/${month}/${year} ${time}`;
  }

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  // Add a new simulated marker every 8 seconds
  setInterval(function () {
    const evt = realtimeTypes[Math.floor(Math.random() * realtimeTypes.length)];
    const name = realtimeNames[Math.floor(Math.random() * realtimeNames.length)];

    const newLoc = {
      lat: randomInRange(-23.48, -23.65),
      lng: randomInRange(-46.55, -46.75),
      name: name,
      type: evt.type,
      severity: evt.severity,
      timestamp: formatTimestamp()
    };

    addMarker(newLoc);

    // Keep marker count manageable — remove oldest if > 35
    if (activeMarkers.length > 35) {
      const removed = activeMarkers.shift();
      map.removeLayer(removed.marker);
    }

    // Update stats with slight variation
    updateStats();
  }, 8000);

  // Remove a random marker every 12 seconds (simulate resolution)
  setInterval(function () {
    if (activeMarkers.length > 10) {
      const idx = Math.floor(Math.random() * activeMarkers.length);
      const removed = activeMarkers.splice(idx, 1)[0];
      map.removeLayer(removed.marker);
    }
  }, 12000);

  // ── Live Stats Updates ──
  let statsBase = { ocorrencias: 234, zonas: 12, cameras: 1847, sensores: 3421 };

  function updateStats() {
    // Small random fluctuation
    statsBase.ocorrencias += Math.floor(Math.random() * 3) - 1;
    statsBase.zonas = Math.max(8, Math.min(18, statsBase.zonas + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
    statsBase.cameras = Math.max(1800, Math.min(1900, statsBase.cameras + Math.floor(Math.random() * 5) - 2));
    statsBase.sensores = Math.max(3380, Math.min(3460, statsBase.sensores + Math.floor(Math.random() * 7) - 3));

    document.getElementById('statOcorrencias').textContent = statsBase.ocorrencias.toLocaleString('pt-BR');
    document.getElementById('statZonas').textContent = statsBase.zonas;
    document.getElementById('statCameras').textContent = statsBase.cameras.toLocaleString('pt-BR');
    document.getElementById('statSensores').textContent = statsBase.sensores.toLocaleString('pt-BR');
  }

  // Update stats every 5 seconds
  setInterval(updateStats, 5000);

})();
