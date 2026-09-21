/* Indicadores derivados exclusivamente de window.SentinelAlertas.dados. */
(function () {
  'use strict';

  const A = () => window.SentinelAlertas;
  const semAcentos = value => String(value || '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  function dataIso(value) {
    const [dia, mes, ano] = value.split('/');
    return `${ano}-${mes}-${dia}`;
  }

  function filtrosPadrao() {
    try {
      return JSON.parse(sessionStorage.getItem('sentinel-filtros') || '["crítico","médio","baixo"]');
    } catch (_) {
      return ['crítico', 'médio', 'baixo'];
    }
  }

  function filtrar(op = {}) {
    const niveis = new Set(op.niveis || filtrosPadrao());
    return A().dados.filter(alerta => niveis.has(alerta.gravidade)
      && (!op.inicio || dataIso(alerta.data) >= op.inicio)
      && (!op.fim || dataIso(alerta.data) <= op.fim));
  }

  function agrupar(itens, chave) {
    return itens.reduce((resultado, item) => {
      const grupo = chave(item);
      resultado[grupo] = (resultado[grupo] || 0) + 1;
      return resultado;
    }, {});
  }

  const cidades = new Set([
    'bom sucesso de itarare', 'carapicuiba', 'penapolis', 'campinas', 'marilia',
    'jundiai', 'ourinhos', 'ribeirao preto', 'santa barbara do oeste',
    'santa barbara d\'oeste', 'sao jose do rio preto', 'sarapui', 'capivari',
    'joanopolis', 'vargem', 'itaquaquecetuba', 'sao jose dos campos', 'aracatuba',
    'botucatu', 'araras', 'sao vicente', 'araraquara', 'embu das artes', 'jandira',
    'mogi das cruzes', 'sao bernardo do campo', 'santos', 'santo andre', 'osasco',
    'guarulhos', 'maua', 'tatui', 'dois corregos', 'iaras', 'pindamonhangaba',
    'suzano', 'guaruja', 'cruzeiro', 'sao paulo'
  ]);

  const zonasCapital = {
    'Zona Sul': ['zona sul', 'capao redondo', 'guarapiranga', 'ibirapuera', 'moema',
      'jardim castro alves', 'ipiranga', 'jabaquara', 'cidade dutra'],
    'Zona Leste': ['zona leste', 'viaduto dona matilde', 'penha', 'artur alvim',
      'sapopemba', 'vila jacui', 'vila granada'],
    'Zona Norte': ['zona norte', 'jardim cachoeira', 'vila maria', 'deputado emilio carlos'],
    'Centro/Oeste': ['centro', 'rua augusta', 'barra funda', 'pinheiros', 'vila madalena',
      'nove de julho', 'planalto paulista', 'cambuci', 'marginal', 'paulista', 'bras', 'se']
  };

  function regiao(alerta) {
    const original = String(alerta.local || '').trim();
    const local = semAcentos(original);
    const primeiraParte = semAcentos(original.split(',')[0].trim());

    // Municípios fora da capital permanecem agrupados pelo município, mesmo
    // quando o local contém uma zona ou uma rodovia com nome semelhante.
    if (cidades.has(primeiraParte) && primeiraParte !== 'sao paulo') {
      return original.split(',')[0].trim();
    }

    for (const [zona, termos] of Object.entries(zonasCapital)) {
      if (termos.some(termo => local.includes(termo))) return `Capital — ${zona}`;
    }

    if (local === 'sao paulo' || local.startsWith('sao paulo,')) {
      return 'Capital — sem zona informada';
    }

    if (local.includes('grande sao paulo')) return 'Grande São Paulo';
    return original.split(',')[0].trim() || 'Local não informado';
  }

  function tipo(alerta) {
    const texto = semAcentos(alerta.descricao);
    if (texto.includes('homic') || texto.includes('morte') || texto.includes('feminic') || texto.includes('atropelamento')) return 'Ocorrências com vítimas';
    if (texto.includes('acidente') || texto.includes('transito') || texto.includes('queda de barreira')) return 'Mobilidade e vias';
    if (texto.includes('chuva') || texto.includes('alagamento') || texto.includes('desab')) return 'Clima e infraestrutura';
    return 'Outras ocorrências';
  }

  function ordenado(obj) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  }

  window.SentinelPainel = { filtrar, agrupar, regiao, tipo, ordenado, dataIso };
})();
