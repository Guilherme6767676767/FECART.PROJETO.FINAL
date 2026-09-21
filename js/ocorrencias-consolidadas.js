/* Adaptador da fonte única de alertas para o mapa Leaflet. */
(function () {
  'use strict';
  const fonte = window.SentinelAlertas?.dados || [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iso = data => { const [d,m,y] = data.split('/'); return `${y}-${m}-${d}`; };
  const ocorrencias = fonte.map(item => ({
    ...item,
    dataIso: iso(item.data),
    data: iso(item.data),
    hora: '',
    municipio: '',
    natureza: item.descricao,
    fonte: 'Base fornecida pelo usuário',
    severidade: item.gravidade === 'crítico' ? 'critical' : item.gravidade === 'médio' ? 'medium' : 'low',
    nivel_gravidade: item.gravidade === 'crítico' ? 'CRÍTICO' : item.gravidade === 'médio' ? 'MÉDIO' : 'BAIXO',
    prioridade: item.gravidade === 'crítico' ? 0 : item.gravidade === 'médio' ? 1 : 2,
    consulta_geocodificacao: `${item.local}, São Paulo, SP, Brasil`
  }));

  const popupHtml = items => `<div class="real-alert-popup"><strong>${items.length > 1 ? `${items.length} ocorrências` : 'Ocorrência'}</strong>` + items.map(item => `<div class="real-alert-popup-item ${esc(item.severidade)}"><b>${esc(item.natureza)}</b><br><span>${esc(item.data)}</span><br><span>${esc(item.local)}</span><br><small>Gravidade: ${esc(item.nivel_gravidade)}<br>Fonte: ${esc(item.fonte)}</small></div>`).join('') + '</div>';

  async function geocodificarTodos(onProgress) {
    const cacheKey = 'sentinel-geocodificacao-alertas-v2';
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch (_) {}
    const consultas = [...new Set(ocorrencias.map(item => item.consulta_geocodificacao))];
    for (let i = 0; i < consultas.length; i += 1) {
      const consulta = consultas[i];
      if (!cache[consulta]) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`, { headers: { 'Accept-Language': 'pt-BR' } });
          const results = response.ok ? await response.json() : [];
          if (results[0]) cache[consulta] = { lat:Number(results[0].lat), lng:Number(results[0].lon), displayName:results[0].display_name };
        } catch (error) { console.warn('[Mapa] Falha ao geocodificar', consulta, error); }
        try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      if (onProgress) onProgress(i + 1, consultas.length);
    }
    ocorrencias.forEach(item => Object.assign(item, cache[item.consulta_geocodificacao] || { geocodeFailed:true }));
    return ocorrencias;
  }

  window.SENTINEL_REAL_ALERTS = ocorrencias;
  window.SENTINEL_REAL_ALERTS_API = { popupHtml, geocodificarTodos, escapeHtml:esc };
})();
