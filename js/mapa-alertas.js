/* Mapa sincronizado com window.SentinelAlertas.dados. */
(function () {
  'use strict';
  const estado = new WeakMap();
  const cacheKey = 'sentinel-locais-confirmados-v4';
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const readCache = () => { try { return JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch (_) { return {}; } };
  const saveCache = value => { try { localStorage.setItem(cacheKey, JSON.stringify(value)); } catch (_) {} };

  async function localizar(alerta, cache) {
    if (cache[alerta.local]) return cache[alerta.local];
    try {
      const query = encodeURIComponent(`${alerta.local}, São Paulo, Brasil`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${query}`, { headers: { 'Accept-Language': 'pt-BR' } });
      const item = response.ok ? (await response.json())[0] : null;
      if (item) {
        cache[alerta.local] = [Number(item.lat), Number(item.lon)];
        saveCache(cache);
        await wait(1050);
        return cache[alerta.local];
      }
    } catch (_) {}
    await wait(1050);
    return null;
  }

  function marcador(alerta, ponto, api) {
    const A = window.SentinelAlertas;
    const marker = L.marker(ponto, { icon: L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: `<span class="map-marker" style="--marker:${A.cores[alerta.gravidade]}"></span>` }), title: alerta.descricao });
    marker.bindPopup(`<div class="map-popup"><b>Data</b><p>${A.esc(alerta.data)}</p><b>Local</b><p>${A.esc(alerta.local)}</p><b>O que aconteceu</b><p>${A.esc(alerta.descricao)}</p><span>Gravidade: ${A.esc(A.rotulos[alerta.gravidade])}</span></div>`);
    api.marcadores[alerta.id] = marker;
    api.camadas[alerta.gravidade].addLayer(marker);
  }

  window.criarMapaDeAlertas = function (id) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (estado.has(el)) return estado.get(el);
    const mapa = L.map(el, { scrollWheelZoom: true, minZoom: 5, maxBounds: [[-35, -76], [7, -28]] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapa);
    mapa.setView([-23.5505, -46.6333], 10);
    const camadas = { crítico: L.markerClusterGroup(), médio: L.markerClusterGroup(), baixo: L.markerClusterGroup() };
    const api = {
      mapa,
      camadas,
      zonas: L.layerGroup(),
      marcadores: {},
      pontos: {},
      alertas: window.SentinelAlertas.dados,
      ponto: null,
      pontoBusca: null,
      adicionarPonto(lat, lon) {
        if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return;
        if (api.ponto) mapa.removeLayer(api.ponto);
        api.ponto = L.circleMarker([Number(lat), Number(lon)], {
          radius: 11,
          color: '#ffffff',
          weight: 3,
          fillColor: '#8b5cf6',
          fillOpacity: 1
        }).addTo(mapa).bindTooltip('Ponto da simulação', { permanent: true, direction: 'top' });
        mapa.flyTo([Number(lat), Number(lon)], 14, { duration: 0.8 });
      }
    };
    Object.values(camadas).forEach(layer => mapa.addLayer(layer));
    estado.set(el, api);
    (async () => {
      const cache = readCache();
      for (const alerta of api.alertas) {
        const ponto = await localizar(alerta, cache);
        if (!ponto) continue;
        api.pontos[alerta.id] = ponto;
        marcador(alerta, ponto, api);
      }
      const alvo = new URLSearchParams(location.hash.slice(1)).get('alert');
      if (alvo && api.marcadores[alvo]) { mapa.setView(api.marcadores[alvo].getLatLng(), 15); api.marcadores[alvo].openPopup(); }
    })();
    setTimeout(() => mapa.invalidateSize(), 0);
    return api;
  };

  window.conectarControlesMapa = function (api, raiz = document) {
    if (!api) return;
    raiz.querySelectorAll('[data-map-filter]').forEach(button => {
      const nivel = button.dataset.mapFilter;
      button.addEventListener('click', () => {
        const camada = api.camadas[nivel];
        if (api.mapa.hasLayer(camada)) { api.mapa.removeLayer(camada); button.classList.add('is-off'); }
        else { api.mapa.addLayer(camada); button.classList.remove('is-off'); }
      });
    });
    raiz.querySelector('[data-zonas]')?.addEventListener('change', event => event.target.checked ? api.zonas.addTo(api.mapa) : api.mapa.removeLayer(api.zonas));
  };

  window.conectarBuscaCidade = function (api) {
    const input = document.getElementById('citySearch');
    const button = document.getElementById('citySearchButton');
    const status = document.getElementById('citySearchStatus');
    if (!api || !input || !button) return;
    async function buscar() {
      const query = input.value.trim();
      if (!query) { if (status) status.textContent = 'Digite uma cidade para buscar.'; return; }
      if (status) status.textContent = `Buscando “${query}”...`;
      const normalizado = query.toLocaleLowerCase('pt-BR');
      const alerta = api.alertas.find(item => item.local.toLocaleLowerCase('pt-BR').includes(normalizado));
      if (alerta && api.pontos[alerta.id]) {
        api.mapa.flyTo(api.pontos[alerta.id], 16, { duration: 1.2 });
        api.marcadores[alerta.id]?.openPopup();
        if (status) status.textContent = `Local encontrado: ${alerta.local}`;
        return;
      }
      try {
        const consultas = [
          `${query}, São Paulo, SP, Brasil`,
          `${query}, São Paulo, Brasil`,
          `${query}, Brasil`,
          query
        ];
        let result = null;
        for (const consulta of consultas) {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`, { headers: { 'Accept-Language': 'pt-BR' } });
          result = response.ok ? (await response.json())[0] : null;
          if (result) break;
          await wait(1050);
        }
        if (!result) { if (status) status.textContent = 'Nenhuma cidade encontrada.'; return; }
        const ponto = [Number(result.lat), Number(result.lon)];
        if (api.pontoBusca) api.mapa.removeLayer(api.pontoBusca);
        api.pontoBusca = L.marker(ponto, { title: query })
          .addTo(api.mapa)
          .bindPopup(`<b>Local pesquisado</b><br>${window.SentinelAlertas.esc(result.display_name || query)}`)
          .openPopup();
        api.mapa.flyTo(ponto, 16, { duration: 1.2 });
        if (status) status.textContent = result.display_name || `Local encontrado: ${query}`;
      } catch (_) { if (status) status.textContent = 'Não foi possível realizar a busca agora.'; }
    }
    button.addEventListener('click', buscar);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') buscar(); });
  };
})();
