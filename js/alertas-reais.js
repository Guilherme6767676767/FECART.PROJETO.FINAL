/* Ocorrências fornecidas para o módulo Alertas + Mapa.
 * A geocodificação é feita somente com bairro + município + SP + Brasil.
 */
(function () {
  'use strict';

  const ocorrencias = [
    {data:'2026-08-13',hora:'00:19',natureza:'Furto',municipio:'Santo André',bairro:'Utinga'},
    {data:'2026-08-12',hora:'21:54',natureza:'Lesão corporal',municipio:'São Bernardo do Campo',bairro:'Rudge Ramos'},
    {data:'2026-08-12',hora:'19:11',natureza:'Roubo',municipio:'São Bernardo do Campo',bairro:'Centro'},
    {data:'2026-08-12',hora:'18:56',natureza:'Roubo de veículo',municipio:'São Paulo',bairro:'Santo Amaro'},
    {data:'2026-08-11',hora:'19:04',natureza:'Roubo',municipio:'Osasco',bairro:'Presidente Altino'},
    {data:'2026-08-11',hora:'10:21',natureza:'Homicídio doloso',municipio:'Santo André',bairro:'Utinga'},
    {data:'2026-08-11',hora:'01:37',natureza:'Roubo de veículo',municipio:'São Paulo',bairro:'Campo Belo'},
    {data:'2026-08-10',hora:'14:44',natureza:'Roubo',municipio:'São Paulo',bairro:'Pinheiros'},
    {data:'2026-08-10',hora:'00:34',natureza:'Lesão corporal',municipio:'São Bernardo do Campo',bairro:'Baeta Neves'},
    {data:'2026-08-09',hora:'06:25',natureza:'Roubo',municipio:'São Paulo',bairro:'Pinheiros'},
    {data:'2026-08-08',hora:'12:47',natureza:'Roubo',municipio:'São Paulo',bairro:'Campo Belo'},
    {data:'2026-08-08',hora:'04:55',natureza:'Roubo',municipio:'Osasco',bairro:'Vila Yara'},
    {data:'2026-08-07',hora:'22:57',natureza:'Roubo',municipio:'Campinas',bairro:'Taquaral'},
    {data:'2026-08-07',hora:'17:29',natureza:'Roubo',municipio:'São Paulo',bairro:'Santo Amaro'},
    {data:'2026-08-07',hora:'09:29',natureza:'Lesão corporal',municipio:'Santo André',bairro:'Utinga'},
    {data:'2026-08-06',hora:'17:48',natureza:'Homicídio doloso',municipio:'Osasco',bairro:'Centro'},
    {data:'2026-08-05',hora:'20:59',natureza:'Homicídio doloso',municipio:'Osasco',bairro:'Presidente Altino'},
    {data:'2026-08-05',hora:'20:50',natureza:'Furto',municipio:'Campinas',bairro:'Cambuí'},
    {data:'2026-08-05',hora:'03:19',natureza:'Homicídio doloso',municipio:'São Bernardo do Campo',bairro:'Assunção'},
    {data:'2026-08-04',hora:'16:17',natureza:'Furto',municipio:'Campinas',bairro:'Cambuí'},
    {data:'2026-08-04',hora:'13:10',natureza:'Furto',municipio:'São Bernardo do Campo',bairro:'Baeta Neves'},
    {data:'2026-08-04',hora:'12:29',natureza:'Furto de veículo',municipio:'São Bernardo do Campo',bairro:'Assunção'},
    {data:'2026-08-04',hora:'08:30',natureza:'Lesão corporal',municipio:'Campinas',bairro:'Barão Geraldo'},
    {data:'2026-08-04',hora:'07:28',natureza:'Homicídio doloso',municipio:'Campinas',bairro:'Taquaral'},
    {data:'2026-08-03',hora:'21:50',natureza:'Lesão corporal',municipio:'Osasco',bairro:'Vila Yara'},
    {data:'2026-08-03',hora:'21:25',natureza:'Furto de veículo',municipio:'Santo André',bairro:'Jardim'},
    {data:'2026-08-03',hora:'19:30',natureza:'Roubo de veículo',municipio:'São Bernardo do Campo',bairro:'Baeta Neves'},
    {data:'2026-08-03',hora:'08:22',natureza:'Roubo de veículo',municipio:'São Bernardo do Campo',bairro:'Centro'},
    {data:'2026-07-27',hora:'23:51',natureza:'Roubo',municipio:'Santo André',bairro:'Jardim'},
    {data:'2026-07-21',hora:'12:07',natureza:'Roubo',municipio:'São Bernardo do Campo',bairro:'Baeta Neves'},
    {data:'2026-07-21',hora:'04:57',natureza:'Roubo de veículo',municipio:'Santo André',bairro:'Centro'},
    {data:'2026-07-20',hora:'17:02',natureza:'Furto de veículo',municipio:'São Paulo',bairro:'Sé'},
    {data:'2026-07-19',hora:'23:09',natureza:'Homicídio doloso',municipio:'Guarulhos',bairro:'Cumbica'},
    {data:'2026-07-19',hora:'17:23',natureza:'Roubo de veículo',municipio:'Santo André',bairro:'Vila Assunção'},
    {data:'2026-07-19',hora:'03:18',natureza:'Furto',municipio:'Campinas',bairro:'Ponte Preta'},
    {data:'2026-07-17',hora:'08:03',natureza:'Roubo',municipio:'São Paulo',bairro:'Santo Amaro'},
    {data:'2026-07-17',hora:'03:59',natureza:'Furto de veículo',municipio:'Campinas',bairro:'Cambuí'},
    {data:'2026-07-17',hora:'01:33',natureza:'Lesão corporal',municipio:'São Paulo',bairro:'Brás'},
    {data:'2026-07-16',hora:'22:29',natureza:'Lesão corporal',municipio:'Osasco',bairro:'Centro'},
    {data:'2026-07-16',hora:'20:56',natureza:'Roubo',municipio:'São Paulo',bairro:'Moóca'},
    {data:'2026-07-16',hora:'20:08',natureza:'Roubo de veículo',municipio:'Guarulhos',bairro:'Vila Galvão'},
    {data:'2026-07-16',hora:'17:02',natureza:'Furto de veículo',municipio:'Campinas',bairro:'Taquaral'},
    {data:'2026-07-13',hora:'16:43',natureza:'Homicídio doloso',municipio:'São Paulo',bairro:'Sé'},
    {data:'2026-07-13',hora:'16:06',natureza:'Homicídio doloso',municipio:'Osasco',bairro:'Presidente Altino'},
    {data:'2026-07-12',hora:'10:56',natureza:'Homicídio doloso',municipio:'Osasco',bairro:'Vila Yara'},
    {data:'2026-07-12',hora:'09:31',natureza:'Roubo de veículo',municipio:'São Bernardo do Campo',bairro:'Rudge Ramos'},
    {data:'2026-07-11',hora:'20:43',natureza:'Roubo',municipio:'São Bernardo do Campo',bairro:'Centro'},
    {data:'2026-07-11',hora:'05:51',natureza:'Homicídio doloso',municipio:'Osasco',bairro:'Presidente Altino'},
    {data:'2026-07-10',hora:'13:19',natureza:'Furto',municipio:'Campinas',bairro:'Barão Geraldo'},
    {data:'2026-07-08',hora:'05:59',natureza:'Roubo de veículo',municipio:'São Bernardo do Campo',bairro:'Assunção'}
  ].map((item, index) => ({
    ...item,
    id: `ocorrencia-real-${String(index + 1).padStart(2, '0')}`
  }));

  const prioridade = {
    'Homicídio doloso': 0,
    'Roubo': 1,
    'Roubo de veículo': 1,
    'Lesão corporal': 2,
    'Furto': 3,
    'Furto de veículo': 3
  };
  const severidade = natureza => natureza === 'Homicídio doloso' ? 'critical' :
    (natureza === 'Roubo' || natureza === 'Roubo de veículo') ? 'high' :
    natureza === 'Lesão corporal' ? 'medium' : 'low';

  ocorrencias.forEach(item => {
    item.prioridade = prioridade[item.natureza] ?? 3;
    item.severidade = severidade(item.natureza);
    item.consulta_geocodificacao = `${item.bairro}, ${item.municipio}, SP, Brasil`;
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function formatar(item) {
    return `${item.data} • ${item.hora} • ${item.natureza} • ${item.municipio} • ${item.bairro}`;
  }

  function popupHtml(items) {
    return `<div class="real-alert-popup"><strong>${items.length > 1 ? `${items.length} ocorrências` : 'Ocorrência'}</strong>` +
      items.map(item => `<div class="real-alert-popup-item ${item.severidade}">
        <b>${escapeHtml(item.natureza)}</b><br>
        <span>${escapeHtml(item.data)} • ${escapeHtml(item.hora)}</span><br>
        <span>${escapeHtml(item.municipio)} • ${escapeHtml(item.bairro)}</span>
      </div>`).join('') + '</div>';
  }

  async function geocodificarTodos(onProgress) {
    const cacheKey = 'sentinel-geocodificacao-alertas-v1';
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch (_) {}
    const porConsulta = new Map(ocorrencias.map(item => [item.consulta_geocodificacao, item]));
    const consultas = [...porConsulta.keys()];
    let feitas = 0;
    for (const consulta of consultas) {
      if (!cache[consulta]) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`;
          const response = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
          if (response.ok) {
            const results = await response.json();
            if (results[0]) cache[consulta] = { lat: Number(results[0].lat), lng: Number(results[0].lon), displayName: results[0].display_name };
          }
        } catch (error) { console.warn('[Alertas] Falha na geocodificação:', consulta, error); }
        try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      feitas += 1;
      if (onProgress) onProgress(feitas, consultas.length);
    }
    ocorrencias.forEach(item => Object.assign(item, cache[item.consulta_geocodificacao] || { geocodeFailed: true }));
    return ocorrencias;
  }

  window.SENTINEL_REAL_ALERTS = ocorrencias;
  window.SENTINEL_REAL_ALERTS_API = { escapeHtml, formatar, popupHtml, geocodificarTodos };
})();
