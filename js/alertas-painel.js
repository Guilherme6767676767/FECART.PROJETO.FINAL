/* Interface da Central de Alertas. Os gráficos pertencem somente ao Dashboard. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const P = window.SentinelPainel;
    const A = window.SentinelAlertas;
    if (!P || !A) return;

    let nivel = 'todos';
    const clock = document.getElementById('clock');
    const updated = document.getElementById('updated');
    const badge = document.getElementById('badge');
    const alertList = document.getElementById('alertList');
    const inicio = document.getElementById('inicio');
    const fim = document.getElementById('fim');

    function tempo() {
      const agora = new Date().toLocaleTimeString('pt-BR');
      if (clock) clock.textContent = agora;
      if (updated) updated.textContent = `Base central consultada às ${agora}`;
    }
    tempo();
    setInterval(tempo, 1000);

    function render() {
      const niveis = nivel === 'todos' ? ['crítico', 'médio', 'baixo'] : [nivel];
      const itens = P.filtrar({ niveis, inicio: inicio?.value, fim: fim?.value });
      const grupos = P.agrupar(itens, item => item.gravidade);
      if (badge) badge.textContent = itens.length;
      [['total', itens.length], ['criticos', grupos.crítico || 0], ['medios', grupos.médio || 0], ['baixos', grupos.baixo || 0]]
        .forEach(([id, valor]) => { const el = document.getElementById(id); if (el) el.textContent = valor; });

      if (alertList) {
        alertList.innerHTML = itens.slice().reverse().map(alerta => `
          <button class="table-row alert-row ${alerta.gravidade}" data-id="${alerta.id}" type="button">
            <span>${A.esc(alerta.data)}</span>
            <b>${A.esc(alerta.local)}</b>
            <span class="hide-mobile">${A.esc(alerta.descricao)}</span>
            <span class="pill ${alerta.gravidade}">${A.rotulos[alerta.gravidade]}</span>
          </button>
        `).join('') || '<p>Nenhum alerta encontrado neste período.</p>';
        alertList.querySelectorAll('[data-id]').forEach(row => {
          row.addEventListener('click', () => { window.location.href = `mapa.html#alert=${encodeURIComponent(row.dataset.id)}`; });
        });
      }
    }

    document.querySelectorAll('[data-nivel]').forEach(button => {
      button.addEventListener('click', () => {
        nivel = button.dataset.nivel;
        document.querySelectorAll('[data-nivel]').forEach(item => item.classList.toggle('selected', item === button));
        render();
      });
    });
    inicio?.addEventListener('change', render);
    fim?.addEventListener('change', render);
    document.getElementById('limpar')?.addEventListener('click', () => { inicio.value = ''; fim.value = ''; render(); });
    render();
  });
})();
