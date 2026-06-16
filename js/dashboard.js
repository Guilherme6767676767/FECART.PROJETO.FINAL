/* ============================================
   SENTINEL IA — Dashboard JavaScript
   Painel de Controle Principal
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // Boot all modules
  initClock();
  initDate();
  initKPIAnimations();
  initIncidentsLineChart();
  initTypeDoughnutChart();
  initWeeklyBarChart();
  initUrbanRadarChart();
  initMap();
  initAlertFeed();
  initSidebarToggle();
});


/* ============================================
   Shared Chart.js Defaults
   ============================================ */
Chart.defaults.color = '#8b9dc3';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(6, 10, 20, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 229, 255, 0.2)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };


/* ============================================
   Live Clock
   ============================================ */
function initClock() {
  const clockEl = document.getElementById('liveClock');
  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  update();
  setInterval(update, 1000);
}


/* ============================================
   Top Bar Date
   ============================================ */
function initDate() {
  const dateEl = document.getElementById('topbarDate');
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  // capitalize first letter
  dateEl.textContent = dateEl.textContent.charAt(0).toUpperCase() + dateEl.textContent.slice(1);
}


/* ============================================
   KPI Value Animations
   ============================================ */
function initKPIAnimations() {
  const kpis = document.querySelectorAll('.kpi-value[data-target]');
  kpis.forEach((kpi) => {
    const target = parseFloat(kpi.dataset.target);
    const suffix = kpi.dataset.suffix || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1500;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isDecimal) {
        kpi.textContent = current.toFixed(1) + suffix;
      } else {
        kpi.textContent = Math.floor(current).toLocaleString('pt-BR') + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (isDecimal) {
          kpi.textContent = target.toFixed(1) + suffix;
        } else {
          kpi.textContent = target.toLocaleString('pt-BR') + suffix;
        }
      }
    }
    requestAnimationFrame(animate);
  });
}


/* ============================================
   Line Chart — Incidentes por Hora
   ============================================ */
function initIncidentsLineChart() {
  const ctx = document.getElementById('incidentsLineChart').getContext('2d');

  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  // Realistic urban incident data: low at night, peaks at rush hours
  const data = [4, 3, 2, 1, 2, 3, 8, 14, 18, 15, 12, 10, 11, 9, 10, 13, 17, 22, 19, 14, 11, 8, 6, 5];

  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Incidentes',
        data,
        borderColor: '#00e5ff',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#00e5ff',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Horário: ${items[0].label}`,
            label: (item) => `  ${item.parsed.y} incidentes`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { maxTicksLimit: 8, font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          beginAtZero: true,
          ticks: { stepSize: 5, font: { size: 11 } },
        },
      },
    },
  });
}


/* ============================================
   Doughnut Chart — Distribuição por Tipo
   ============================================ */
function initTypeDoughnutChart() {
  const ctx = document.getElementById('typeDoughnutChart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Trânsito', 'Segurança', 'Clima', 'Saúde', 'Infraestrutura'],
      datasets: [{
        data: [35, 25, 18, 12, 10],
        backgroundColor: [
          '#00e5ff',
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#a855f7',
        ],
        borderColor: 'rgba(6, 10, 20, 0.8)',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 12, weight: '500' },
            padding: 14,
          },
        },
        tooltip: {
          callbacks: {
            label: (item) => `  ${item.label}: ${item.parsed}%`,
          },
        },
      },
    },
  });
}


/* ============================================
   Bar Chart — Tendência Semanal
   ============================================ */
function initWeeklyBarChart() {
  const ctx = document.getElementById('weeklyBarChart').getContext('2d');

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const incidentes = [42, 38, 45, 51, 48, 32, 28];
  const resolvidos = [38, 35, 40, 44, 42, 30, 25];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Incidentes',
          data: incidentes,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Resolvidos',
          data: resolvidos,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { font: { size: 12, weight: '500' } },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          beginAtZero: true,
          ticks: { stepSize: 10, font: { size: 11 } },
        },
      },
    },
  });
}


/* ============================================
   Radar Chart — Índices Urbanos
   ============================================ */
function initUrbanRadarChart() {
  const ctx = document.getElementById('urbanRadarChart').getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Segurança', 'Mobilidade', 'Saúde', 'Infraestrutura', 'Meio Ambiente', 'Educação'],
      datasets: [
        {
          label: 'Atual',
          data: [87, 72, 78, 65, 71, 82],
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.12)',
          borderWidth: 2,
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#060a14',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Mês Anterior',
          data: [80, 68, 75, 62, 69, 79],
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#060a14',
          pointBorderWidth: 2,
          pointRadius: 4,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { font: { size: 12, weight: '500' } },
        },
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          pointLabels: {
            font: { size: 11, weight: '500' },
            color: '#8b9dc3',
          },
          ticks: {
            backdropColor: 'transparent',
            font: { size: 9 },
            color: '#4a5f82',
            stepSize: 20,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });
}


/* ============================================
   Leaflet Map
   ============================================ */
function initMap() {
  const map = L.map('dashboardMap', {
    zoomControl: false,
    attributionControl: false,
  }).setView([-23.5505, -46.6333], 12);

  // Dark tile layer — CartoDB dark_all
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Zoom control on the right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Custom icon factory
  function createIcon(color) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 14px; height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid rgba(6, 10, 20, 0.8);
        box-shadow: 0 0 10px ${color}80, 0 0 20px ${color}40;
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  // Simulated incident markers in São Paulo
  const incidents = [
    { lat: -23.5489, lng: -46.6388, title: 'Acidente de trânsito', area: 'Av. Paulista', color: '#ef4444', severity: 'Crítico' },
    { lat: -23.5632, lng: -46.6542, title: 'Alagamento detectado', area: 'Liberdade', color: '#f59e0b', severity: 'Alto' },
    { lat: -23.5357, lng: -46.6350, title: 'Concentração suspeita', area: 'Consolação', color: '#ef4444', severity: 'Crítico' },
    { lat: -23.5870, lng: -46.6580, title: 'Queda de energia', area: 'Saúde', color: '#a855f7', severity: 'Médio' },
    { lat: -23.5230, lng: -46.6120, title: 'Tráfego intenso', area: 'Santana', color: '#00e5ff', severity: 'Baixo' },
    { lat: -23.5690, lng: -46.6920, title: 'Poluição elevada', area: 'Pinheiros', color: '#f59e0b', severity: 'Alto' },
    { lat: -23.5450, lng: -46.6750, title: 'Incêndio reportado', area: 'Perdizes', color: '#ef4444', severity: 'Crítico' },
    { lat: -23.5110, lng: -46.6250, title: 'Via interditada', area: 'Tucuruvi', color: '#3b82f6', severity: 'Baixo' },
    { lat: -23.5740, lng: -46.6230, title: 'Furto em andamento', area: 'Ipiranga', color: '#ef4444', severity: 'Crítico' },
    { lat: -23.5580, lng: -46.6680, title: 'Ruído excessivo', area: 'Vila Madalena', color: '#3b82f6', severity: 'Baixo' },
    { lat: -23.5950, lng: -46.6370, title: 'Deslizamento de terra', area: 'Jabaquara', color: '#f59e0b', severity: 'Alto' },
    { lat: -23.5320, lng: -46.6480, title: 'Semáforo inoperante', area: 'Barra Funda', color: '#a855f7', severity: 'Médio' },
  ];

  incidents.forEach((inc) => {
    const marker = L.marker([inc.lat, inc.lng], { icon: createIcon(inc.color) }).addTo(map);
    marker.bindPopup(`
      <div style="
        font-family: 'Inter', sans-serif;
        color: #f1f5f9;
        min-width: 180px;
      ">
        <strong style="font-size: 13px;">${inc.title}</strong>
        <div style="margin-top: 4px; font-size: 11px; color: #8b9dc3;">
          📍 ${inc.area}
        </div>
        <div style="margin-top: 4px;">
          <span style="
            display: inline-block;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 999px;
            background: ${inc.color}25;
            color: ${inc.color};
            border: 1px solid ${inc.color}40;
          ">${inc.severity}</span>
        </div>
      </div>
    `, {
      className: 'dark-popup',
    });
  });

  // Style the popups for dark mode
  const popupStyle = document.createElement('style');
  popupStyle.textContent = `
    .dark-popup .leaflet-popup-content-wrapper {
      background: rgba(12, 18, 34, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    .dark-popup .leaflet-popup-tip {
      background: rgba(12, 18, 34, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .dark-popup .leaflet-popup-close-button {
      color: #8b9dc3;
    }
    .dark-popup .leaflet-popup-close-button:hover {
      color: #00e5ff;
    }
  `;
  document.head.appendChild(popupStyle);
}


/* ============================================
   Alert Feed
   ============================================ */
const alertTemplates = [
  { icon: 'alert-triangle', severity: 'critical', title: 'Colisão na Marginal Tietê', desc: 'Km 14 — 3 veículos envolvidos', area: 'Marginal Tietê' },
  { icon: 'cloud-rain', severity: 'high', title: 'Risco de alagamento', desc: 'Previsão de chuva forte nas próximas 2h', area: 'Zona Sul' },
  { icon: 'shield-alert', severity: 'critical', title: 'Ocorrência policial', desc: 'Atividade suspeita detectada por câmera', area: 'Sé' },
  { icon: 'zap', severity: 'medium', title: 'Queda de energia', desc: 'Afeta 2.300 residências na região', area: 'Vila Mariana' },
  { icon: 'traffic-cone', severity: 'low', title: 'Interdição programada', desc: 'Manutenção na via até 22h', area: 'Av. Rebouças' },
  { icon: 'thermometer', severity: 'medium', title: 'Onda de calor', desc: 'Temperatura prevista acima de 38°C', area: 'Região Metropolitana' },
  { icon: 'siren', severity: 'critical', title: 'Incêndio em edifício', desc: 'Bombeiros acionados — 5º andar', area: 'Centro' },
  { icon: 'car', severity: 'high', title: 'Congestionamento severo', desc: 'Tempo de viagem 3x acima do normal', area: 'Av. 23 de Maio' },
  { icon: 'construction', severity: 'low', title: 'Obra na via', desc: 'Faixa esquerda bloqueada', area: 'Mooca' },
  { icon: 'heart-pulse', severity: 'medium', title: 'Emergência médica', desc: 'SAMU acionado para atendimento', area: 'Penha' },
  { icon: 'droplets', severity: 'high', title: 'Vazamento de água', desc: 'Rompimento de adutora detectado', area: 'Lapa' },
  { icon: 'alert-circle', severity: 'critical', title: 'Alerta de segurança', desc: 'Movimento atípico identificado por IA', area: 'Brás' },
];

function initAlertFeed() {
  const feed = document.getElementById('alertFeed');

  // Initial alerts
  const initial = alertTemplates.slice(0, 6);
  initial.forEach((alert, i) => {
    const timeOffset = i * 3 + 1;
    feed.appendChild(createAlertElement(alert, `${timeOffset} min atrás`));
  });

  // Add new alerts periodically
  let alertIndex = 6;
  setInterval(() => {
    const alert = alertTemplates[alertIndex % alertTemplates.length];
    const newEl = createAlertElement(alert, 'Agora');
    feed.insertBefore(newEl, feed.firstChild);

    // Keep max 10 alerts visible
    while (feed.children.length > 10) {
      feed.removeChild(feed.lastChild);
    }

    alertIndex++;
  }, 8000);
}

function createAlertElement(alert, timeStr) {
  const el = document.createElement('div');
  el.className = 'alert-item';
  el.innerHTML = `
    <div class="alert-item-icon ${alert.severity}">
      <i data-lucide="${alert.icon}" style="width:16px;height:16px"></i>
    </div>
    <div class="alert-item-content">
      <h5>${alert.title}</h5>
      <p>${alert.desc} — ${alert.area}</p>
    </div>
    <span class="alert-item-time">${timeStr}</span>
  `;
  // Re-render lucide icons in the new element
  setTimeout(() => lucide.createIcons(), 10);
  return el;
}


/* ============================================
   Mobile Sidebar Toggle
   ============================================ */
function initSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');

  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  });
}
