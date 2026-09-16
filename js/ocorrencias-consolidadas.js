/* Base consolidada de segurança pública fornecida pelo usuário. */
(function () {
  'use strict';
  const ocorrencias = [
    {data:'2026-07-04',hora:'',municipio:'Bom Sucesso de Itararé',natureza:'Atropelamento fatal',local:'Rodovia Virgílio Holtz',fonte:'Diário do Estado de SP'},
    {data:'2026-07-08',hora:'',municipio:'São Paulo',natureza:'Morte de GCM',local:'Rua Augusta, Centro',fonte:'Jornal da Tarde'},
    {data:'2026-07-10',hora:'',municipio:'São Paulo',natureza:'Confronto policial',local:'São Paulo',fonte:'Diário do Estado de SP'},
    {data:'2026-07-11',hora:'',municipio:'São Paulo',natureza:'Feminicídio / ocultação de cadáver',local:'Zona Sul / Rio Guarapiranga',fonte:'Folha de S.Paulo'},
    {data:'2026-07-16',hora:'',municipio:'Carapicuíba',natureza:'Sequestro e homicídio',local:'Carapicuíba, Grande SP',fonte:'G1 / TV Globo'},
    {data:'2026-07-20',hora:'',municipio:'São Paulo',natureza:'Prisão por investigação de homicídio',local:'Capão Redondo',fonte:'Diário do Estado de SP'},
    {data:'2026-07-21',hora:'',municipio:'São Paulo',natureza:'Atropelamento fatal',local:'Avenida Ibirapuera, Zona Sul',fonte:'Diário do Estado de SP'},
    {data:'2026-07-23',hora:'',municipio:'São Paulo',natureza:'Atropelamento fatal',local:'Avenida Nove de Julho',fonte:'CNN Brasil'},
    {data:'2026-07-26',hora:'',municipio:'Campinas',natureza:'Acidente rodoviário',local:'Rodovia Adhemar de Barros',fonte:'Diário do Estado de SP'},
    {data:'2026-07-26',hora:'',municipio:'São Paulo',natureza:'Atropelamento fatal',local:'Rua do Bosque, Barra Funda',fonte:'Diário do Estado de SP'},
    {data:'2026-07-27',hora:'',municipio:'São Paulo',natureza:'Perseguição policial / acidente',local:'Planalto Paulista',fonte:'R7'},
    {data:'2026-07-31',hora:'',municipio:'Penápolis',natureza:'Confronto policial',local:'Parque dos Girassóis',fonte:'Diário Paulista'},
    {data:'2026-07-31',hora:'',municipio:'São Paulo',natureza:'Tentativa de feminicídio',local:'Vila Jacuí, Zona Leste',fonte:'Interlira'},
    {data:'2026-08-02',hora:'',municipio:'São Paulo',natureza:'Cárcere privado e violência sexual',local:'Parque Santo Antônio, Zona Sul',fonte:'Diário do Estado de SP'},
    {data:'2026-08-03',hora:'',municipio:'São Paulo',natureza:'Atropelamento fatal',local:'Viaduto Dona Matilde, Zona Leste',fonte:'Diário do Estado de SP'},
    {data:'2026-08-03',hora:'',municipio:'Marília',natureza:'Homicídio',local:'Zona Sul',fonte:'Paulista Notícias'},
    {data:'2026-08-07',hora:'',municipio:'Jundiaí',natureza:'Atropelamento fatal durante fuga',local:'Jundiaí / Rodovia Anhanguera',fonte:'Diário do Estado de SP'},
    {data:'2026-08-07',hora:'',municipio:'Ourinhos',natureza:'Acidente rodoviário',local:'SP-270, Ourinhos',fonte:'AssisCity'},
    {data:'2026-08-09',hora:'',municipio:'Ribeirão Preto',natureza:'Acidente rodoviário',local:'Rodovia Abrão Assed, SP-333',fonte:'Diário do Estado de SP'},
    {data:'2026-08-10',hora:'',municipio:'Santa Bárbara d\'Oeste',natureza:'Acidente de trânsito',local:'Cruzamento das ruas Lyrio Portella Fontes e Narciso Bizzetto',fonte:'Diário do Estado de SP'},
    {data:'2026-08-10',hora:'',municipio:'São José do Rio Preto',natureza:'Atropelamento fatal',local:'SP-425',fonte:'Pauta São Paulo'},
    {data:'2026-08-15',hora:'',municipio:'Sarapuí',natureza:'Tentativa de feminicídio',local:'Sarapuí',fonte:'5News / Folha'},
    {data:'2026-08-18',hora:'',municipio:'Vargem',natureza:'Acidente / queda de passarela',local:'Rodovia Fernão Dias, Vargem',fonte:'UOL / MP-SP'},
    {data:'2026-08-19',hora:'',municipio:'Capivari',natureza:'Homicídio',local:'Jardim Florido, Capivari',fonte:'Diário do Estado de SP'},
    {data:'2026-08-23',hora:'',municipio:'Joanópolis',natureza:'Tentativa de homicídio',local:'Joanópolis',fonte:'Jornal V2R Notícias'},
    {data:'2026-08-27',hora:'',municipio:'São Paulo',natureza:'Atropelamento fatal',local:'Avenida Governador Carvalho Pinto, Penha',fonte:'Diário do Estado de SP'},
    {data:'2026-08-29',hora:'',municipio:'Itaquaquecetuba',natureza:'Acidente de trabalho fatal',local:'Jardim Nova Louzada',fonte:'Diário do Estado de SP'},
    {data:'2026-08-29',hora:'',municipio:'São José dos Campos',natureza:'Homicídio',local:'Bairro dos Freitas',fonte:'Diário do Estado de SP'},
    {data:'2026-08-30',hora:'',municipio:'Araçatuba',natureza:'Morte em abordagem policial',local:'Araçatuba',fonte:'Diário do Estado de SP'},
    {data:'2026-08-30',hora:'',municipio:'São Paulo',natureza:'Homicídio',local:'Jardim Castro Alves, Zona Sul',fonte:'Diário do Estado de SP'},
    {data:'2026-08-30',hora:'',municipio:'Botucatu',natureza:'Morte por ataque de abelhas',local:'Botucatu',fonte:'Diário do Estado de SP'},
    {data:'2026-09-03',hora:'',municipio:'Araras',natureza:'Confronto policial',local:'Jardim Cândida, Araras',fonte:'Metrópoles'},
    {data:'2026-09-03',hora:'',municipio:'São Vicente',natureza:'Atropelamento fatal',local:'São Vicente',fonte:'A Tribuna / SBT'},
    {data:'2026-09-05',hora:'',municipio:'Araraquara',natureza:'Afogamento / morte suspeita',local:'Jardim Salto Grande, Araraquara',fonte:'Metrópoles'},
    {data:'2026-09-06',hora:'',municipio:'Embu das Artes',natureza:'Morte suspeita / investigação',local:'Chácaras Bartira, Embu das Artes',fonte:'R7 / Diário do Estado de SP'},
    {data:'2026-09-06',hora:'',municipio:'São Paulo',natureza:'Morte em abordagem policial',local:'Capão Redondo',fonte:'Diário do Estado de SP'},
    {data:'2026-09-07',hora:'',municipio:'Ribeirão Preto',natureza:'Homicídio / morte em investigação',local:'Ribeirão Preto',fonte:'Diário do Estado de SP'},
    {data:'2026-09-08',hora:'',municipio:'São Vicente',natureza:'Homicídio / latrocínio',local:'Avenida Pérsio de Queirós Filho, São Vicente',fonte:'UOL'},
    {data:'2026-09-11',hora:'',municipio:'São Bernardo do Campo / Jandira / Itaquaquecetuba',natureza:'Chuvas / mortes',local:'Grande São Paulo',fonte:'Folha de S.Paulo'},
    {data:'2026-09-12',hora:'',municipio:'São Paulo',natureza:'Desabamento',local:'Vila Granada, Zona Leste',fonte:'Folha de S.Paulo'},
    {data:'2026-09-13',hora:'',municipio:'São Paulo',natureza:'Acidente de trânsito',local:'Avenida Paulista',fonte:'Folha de S.Paulo'},
    {data:'2026-09-14',hora:'',municipio:'Campinas',natureza:'Confronto policial',local:'Região Norte',fonte:'G1 / EPTV'},
    {data:'2026-09-15',hora:'',municipio:'Santos',natureza:'Morte suspeita / investigação',local:'Zona Portuária',fonte:'A Tribuna'}
  ].map((item, index) => ({...item, id:`consolidada-${String(index + 1).padStart(2, '0')}`}));

  const alta = /homicídio|feminicídio|sequestro e homicídio|confronto policial|morte em abordagem policial|desabamento|chuvas.*mortes/i;
  const media = /atropelamento fatal|acidente|morte suspeita|investigação|prisão|afogamento|abelhas|perseguição/i;
  ocorrencias.forEach(item => {
    item.severidade = alta.test(item.natureza) ? 'critical' : media.test(item.natureza) ? 'medium' : 'low';
    item.nivel_gravidade = item.severidade === 'critical' ? 'ALTA' : item.severidade === 'medium' ? 'MÉDIA' : 'BAIXA';
    item.prioridade = item.severidade === 'critical' ? 0 : item.severidade === 'medium' ? 1 : 2;
    item.consulta_geocodificacao = `${item.local}, ${item.municipio}, SP, Brasil`;
  });

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const popupHtml = items => `<div class="real-alert-popup"><strong>${items.length > 1 ? `${items.length} ocorrências` : 'Ocorrência'}</strong>` + items.map(item => `<div class="real-alert-popup-item ${item.severidade}"><b>${esc(item.natureza)}</b><br><span>${esc(item.data)}${item.hora ? ` • ${esc(item.hora)}` : ''}</span><br><span>${esc(item.local)}</span><br><span>${esc(item.municipio)}</span><br><small>Gravidade: ${esc(item.nivel_gravidade)}<br>Fonte: ${esc(item.fonte)}</small></div>`).join('') + '</div>';

  async function geocodificarTodos(onProgress) {
    const cacheKey = 'sentinel-geocodificacao-consolidada-v1';
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch (_) {}
    const consultas = [...new Set(ocorrencias.map(item => item.consulta_geocodificacao))];
    for (let i = 0; i < consultas.length; i += 1) {
      const consulta = consultas[i];
      if (!cache[consulta]) {
        try {
          const item = ocorrencias.find(entry => entry.consulta_geocodificacao === consulta);
          const queries = [consulta, `${item?.municipio || ''}, SP, Brasil`];
          for (const query of queries) {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&addressdetails=1&q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {headers:{'Accept-Language':'pt-BR'}});
            const results = response.ok ? await response.json() : [];
            if (results[0]) {
              cache[consulta] = {lat:Number(results[0].lat), lng:Number(results[0].lon), displayName:results[0].display_name, precisao:query === consulta ? 'local' : 'municipio'};
              break;
            }
          }
        } catch (error) { console.warn('[Ocorrências] Falha ao geocodificar', consulta, error); }
        try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      if (onProgress) onProgress(i + 1, consultas.length);
    }
    ocorrencias.forEach(item => Object.assign(item, cache[item.consulta_geocodificacao] || {geocodeFailed:true}));
    return ocorrencias;
  }

  window.SENTINEL_REAL_ALERTS = ocorrencias;
  window.SENTINEL_REAL_ALERTS_API = {popupHtml, geocodificarTodos, escapeHtml:esc};
})();
