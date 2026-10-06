(function () {
  'use strict';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'css/alertas-style.css';
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    const P = window.SentinelPainel;
    const A = window.SentinelAlertas;
    const ativos = new Set(['crítico', 'médio', 'baixo']);
    let charts = [];
    if (!P || !A || !window.Chart) return;
    Chart.defaults.color = '#93abc0';
    Chart.defaults.borderColor = 'rgba(81,141,170,.18)';

    const clock = document.getElementById('clock');
    function tempo() { if (clock) clock.textContent = new Date().toLocaleTimeString('pt-BR'); }
    tempo();
    setInterval(tempo, 1000);

    function grafico(id, type, labels, data, cor) {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      charts.push(new Chart(canvas, { type, data: { labels, datasets: [{ data, backgroundColor: cor, borderColor: cor, borderWidth: 2, fill: type === 'line', tension: .35 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === 'doughnut', labels: { boxWidth: 10 } } }, scales: type === 'doughnut' ? {} : { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } } }));
    }

    function render() {
      charts.forEach(chart => chart.destroy());
      charts = [];
      const itens = P.filtrar({ niveis: [...ativos] });
      const por = P.agrupar(itens, item => item.gravidade);
      const datas = P.ordenado(P.agrupar(itens, item => item.data)).sort((a, b) => P.dataIso(a[0]).localeCompare(P.dataIso(b[0])));
      const tipos = P.ordenado(P.agrupar(itens, P.tipo));
      const critReg = P.ordenado(P.agrupar(itens.filter(item => item.gravidade === 'crítico'), P.regiao)).slice(0, 7);
      const top = P.ordenado(P.agrupar(itens, P.regiao))[0];
      const badge = document.getElementById('badge');
      if (badge) badge.textContent = itens.length;
      [['total', itens.length], ['criticos', por.crítico || 0], ['medios', por.médio || 0], ['baixos', por.baixo || 0]].forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
      grafico('severityChart', 'doughnut', ['Crítico', 'Médio', 'Baixo'], [por.crítico || 0, por.médio || 0, por.baixo || 0], ['#ff4d5e', '#ffab2e', '#38bdf8']);
      grafico('dateChart', 'line', datas.map(item => item[0]), datas.map(item => item[1]), '#00d9ff');
      grafico('typeChart', 'doughnut', tipos.map(item => item[0]), tipos.map(item => item[1]), ['#a855f7', '#00d9ff', '#ffab2e', '#ff4d5e']);
      grafico('criticalRegionChart', 'bar', critReg.map(item => item[0]), critReg.map(item => item[1]), '#ff4d5e');
      const recent = document.getElementById('recent');
      if (recent) recent.innerHTML = [...itens].slice(-7).reverse().map(item => `<div class="table-row alert-row ${item.gravidade}"><span>${A.esc(item.data)}</span><b>${A.esc(item.local)}</b><span class="hide-mobile">${A.esc(item.descricao)}</span><span class="pill ${item.gravidade}">${A.rotulos[item.gravidade]}</span></div>`).join('');
      const insights = document.getElementById('insights');
      if (insights) insights.innerHTML = [['01','Concentração de registros',top ? `${top[0]} aparece ${top[1]} vez(es) no filtro atual.` : 'Não há registros no filtro atual.'],['02','Atenção prioritária',`${por.crítico || 0} ocorrência(s) críticas devem ser conferidas primeiro no mapa.`],['03','Perfil mais frequente',tipos[0] ? `${tipos[0][0]} soma ${tipos[0][1]} registro(s) na base selecionada.` : 'Não há perfil recorrente.']].map(item => `<div class="insight"><span class="n">${item[0]}</span><div><b>${item[1]}</b><span>${item[2]}</span></div></div>`).join('');
    }
    document.querySelectorAll('[data-nivel]').forEach(button => button.addEventListener('click', () => { const nivel = button.dataset.nivel; ativos.has(nivel) ? ativos.delete(nivel) : ativos.add(nivel); button.classList.toggle('is-off', !ativos.has(nivel)); sessionStorage.setItem('sentinel-filtros', JSON.stringify([...ativos])); render(); }));
    render();
  });
})();
