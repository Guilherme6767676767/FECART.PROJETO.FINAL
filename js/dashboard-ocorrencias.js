/* Integra a base consolidada aos KPIs, feed FIFO, tabela e gráficos. */
(function () {
  'use strict';
  const base = window.SENTINEL_REAL_ALERTS || [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const porMaisRecente = (a, b) => `${b.data} ${b.hora || '00:00'}`.localeCompare(`${a.data} ${a.hora || '00:00'}`);

  function ordenar() { return base.slice().sort(porMaisRecente); }

  function renderizarFeed() {
    const feed = document.getElementById('alertFeed');
    if (!feed) return;
    const recentes = ordenar().slice(0, 5);
    feed.innerHTML = recentes.map(item => `<div class="alert-item ${item.severidade === 'critical' ? 'real-alert-critical' : ''}">
      <div class="alert-item-icon ${item.severidade}">${item.severidade === 'critical' ? '🚨' : item.severidade === 'medium' ? '⚠️' : 'ℹ️'}</div>
      <div class="alert-item-content"><h5>${esc(item.natureza)}</h5><p>${esc(item.data)}${item.hora ? ` • ${esc(item.hora)}` : ''}<br>${esc(item.municipio)} • ${esc(item.local)}<br><small>${esc(item.fonte)}</small></p></div>
      <div class="alert-item-actions"><button class="btn-view-map" onclick="window.location.href='mapa.html?realId=${encodeURIComponent(item.id)}'">📍 Ver no Mapa</button></div>
    </div>`).join('');
    const badge = document.querySelector('[href="alertas.html"] .badge, .sidebar-link[href="alertas.html"] .link-badge');
    if (badge) badge.textContent = recentes.length;
  }

  function renderizarTabela() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;
    tbody.innerHTML = ordenar().slice(0, 10).map(item => `<tr>
      <td style="font-family:var(--font-mono,monospace);color:var(--cyan)">${esc(item.id)}</td>
      <td style="font-weight:600;color:#f8fafc">${esc(item.natureza)}</td>
      <td>${esc(item.municipio)} — ${esc(item.local)}</td>
      <td><span class="badge ${item.severidade === 'critical' ? 'badge-red' : item.severidade === 'medium' ? 'badge-yellow' : 'badge-green'}">${item.nivel_gravidade}</span></td>
      <td>${esc(item.data)}${item.hora ? ` ${esc(item.hora)}` : ''}</td>
      <td><span class="status-dot online"></span> Registrado</td>
    </tr>`).join('');
  }

  function atualizarKpi() {
    const kpi = document.querySelector('.kpi-card.cyan .kpi-value');
    if (kpi) { kpi.dataset.target = base.length; kpi.textContent = base.length; }
    const label = document.querySelector('.kpi-card.cyan .kpi-label');
    if (label) label.textContent = 'Ocorrências no período';
  }

  function atualizarGraficos() {
    if (!window.Chart) return;
    const tipos = {}; const cidades = {}; const datas = {};
    base.forEach(item => {
      tipos[item.natureza] = (tipos[item.natureza] || 0) + 1;
      cidades[item.municipio] = (cidades[item.municipio] || 0) + 1;
      datas[item.data] = (datas[item.data] || 0) + 1;
    });
    const doughnut = Chart.getChart('typeDoughnutChart');
    if (doughnut) { doughnut.data.labels = Object.keys(tipos); doughnut.data.datasets[0].data = Object.values(tipos); doughnut.update(); }
    const line = Chart.getChart('incidentsLineChart');
    if (line) { const labels = Object.keys(datas).sort(); line.data.labels = labels; line.data.datasets[0].data = labels.map(label => datas[label]); line.options.plugins.legend.display = false; line.update(); }
    const cityCanvas = document.getElementById('cityBarChart');
    if (cityCanvas && !Chart.getChart('cityBarChart')) {
      const entries = Object.entries(cidades).sort((a,b) => b[1] - a[1]);
      new Chart(cityCanvas, { type:'bar', data:{ labels:entries.map(([name]) => name), datasets:[{label:'Casos',data:entries.map(([,count]) => count),backgroundColor:'#ff1493',borderColor:'#ff69b4',borderWidth:1}] }, options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{beginAtZero:true,ticks:{precision:0},grid:{color:'rgba(255,255,255,.06)'}},y:{grid:{display:false}}},plugins:{legend:{display:false}}} });
    }
  }

  // Entrada pública para novas ocorrências: a fila mantém somente as 5 mais recentes no feed.
  window.adicionarOcorrenciaDashboard = function (item) {
    const novo = {...item, id:item.id || `consolidada-${Date.now()}`};
    novo.severidade = /homicídio|feminicídio|confronto policial|desabamento|chuvas.*mortes|morte em abordagem/i.test(novo.natureza) ? 'critical' : 'medium';
    novo.nivel_gravidade = novo.severidade === 'critical' ? 'ALTA' : 'MÉDIA';
    base.push(novo);
    renderizarFeed(); renderizarTabela(); atualizarKpi(); atualizarGraficos();
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderizarFeed(); renderizarTabela(); atualizarKpi();
    setTimeout(atualizarGraficos, 100);
    setInterval(renderizarFeed, 30000);
  });
})();
