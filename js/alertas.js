/* Fonte única de alertas: Alertas, Mapa e Simulações consomem estes dados. */
(function () {
  'use strict';

  const alertas = [
    { id:'ALT-001', titulo:'Risco de alagamento', tipo:'Clima', gravidade:'crítico', bairro:'Brás', endereco:'Av. Rangel Pestana, próximo ao Largo da Concórdia', latitude:-23.5480, longitude:-46.6050, descricao:'Chuva intensa elevou o nível da água nas vias próximas.' },
    { id:'ALT-002', titulo:'Acidente com bloqueio parcial', tipo:'Trânsito', gravidade:'médio', bairro:'Pinheiros', endereco:'Av. Faria Lima, 1800', latitude:-23.5660, longitude:-46.6921, descricao:'Uma faixa está bloqueada e o fluxo segue mais lento.' },
    { id:'ALT-003', titulo:'Movimentação atípica', tipo:'Segurança', gravidade:'crítico', bairro:'Sé', endereco:'Praça da Sé, 1', latitude:-23.5505, longitude:-46.6333, descricao:'Ocorrência em acompanhamento pelas equipes responsáveis.' },
    { id:'ALT-004', titulo:'Lentidão por obra', tipo:'Trânsito', gravidade:'baixo', bairro:'Santo Amaro', endereco:'Av. Santo Amaro, 5200', latitude:-23.6380, longitude:-46.7040, descricao:'Obra sinalizada reduz temporariamente o espaço na via.' },
    { id:'ALT-005', titulo:'Ponto de atenção em via', tipo:'Segurança', gravidade:'médio', bairro:'Mooca', endereco:'Rua da Mooca, 1500', latitude:-23.5587, longitude:-46.5960, descricao:'Equipe de campo foi orientada a reforçar o monitoramento.' },
    { id:'ALT-006', titulo:'Acúmulo de água', tipo:'Clima', gravidade:'médio', bairro:'Campo Belo', endereco:'Av. Vereador José Diniz, 3100', latitude:-23.6242, longitude:-46.6747, descricao:'Há acúmulo de água; motoristas devem reduzir a velocidade.' },
    { id:'ALT-007', titulo:'Intervenção em cruzamento', tipo:'Trânsito', gravidade:'baixo', bairro:'Barra Funda', endereco:'Av. Marquês de São Vicente, 1200', latitude:-23.5265, longitude:-46.6690, descricao:'Sinalização temporária instalada no cruzamento.' },
    { id:'ALT-008', titulo:'Atenção em área comercial', tipo:'Segurança', gravidade:'baixo', bairro:'Centro', endereco:'Rua 25 de Março, 450', latitude:-23.5455, longitude:-46.6310, descricao:'Patrulhamento preventivo reforçado no local.' }
  ];

  const cores = { 'crítico':'#ef4444', 'médio':'#f59e0b', 'baixo':'#38bdf8' };
  const rotulos = { 'crítico':'Crítico', 'médio':'Médio', 'baixo':'Baixo' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  window.SentinelAlertas = {
    dados: alertas,
    cores,
    rotulos,
    esc,
    porGravidade: gravidade => alertas.filter(a => a.gravidade === gravidade)
  };

  function renderizarLista() {
    const lista = document.querySelector('[data-alertas-lista]');
    if (!lista) return;
    const ativos = new Set(['crítico', 'médio', 'baixo']);
    document.querySelectorAll('[data-filtro-alerta]').forEach(botao => {
      botao.addEventListener('click', () => {
        const nivel = botao.dataset.filtroAlerta;
        ativos.has(nivel) ? ativos.delete(nivel) : ativos.add(nivel);
        botao.classList.toggle('is-off', !ativos.has(nivel));
        desenhar();
      });
    });
    function desenhar() {
      const visiveis = alertas.filter(a => ativos.has(a.gravidade));
      const contador = document.querySelector('[data-alertas-contagem]');
      if (contador) contador.textContent = `${visiveis.length} alertas ativos`;
      lista.innerHTML = visiveis.map(a => `<article class="alert-card">
        <span class="severity-dot ${a.gravidade}"></span><div><span class="eyebrow">${esc(a.tipo)} · ${esc(rotulos[a.gravidade])}</span>
        <h3>${esc(a.titulo)}</h3><p>${esc(a.descricao)}</p><small>${esc(a.bairro)} · ${esc(a.endereco)}</small></div></article>`).join('') || '<p class="empty">Nenhum alerta neste filtro.</p>';
    }
    desenhar();
  }
  document.addEventListener('DOMContentLoaded', renderizarLista);
})();
