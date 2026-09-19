/* Mapa compartilhado: usa exclusivamente window.SentinelAlertas.dados. */
(function () {
  'use strict';
  const A = () => window.SentinelAlertas;
  const estados = new WeakMap();

  function marcador(alerta, deslocamento) {
    const cor = A().cores[alerta.gravidade];
    const icone = L.divIcon({ className:'', iconSize:[18,18], iconAnchor:[9,9], html:`<span class="map-marker" style="--marker:${cor}"></span>` });
    const lat = alerta.latitude + (deslocamento?.lat || 0);
    const lng = alerta.longitude + (deslocamento?.lng || 0);
    return L.marker([lat, lng], { icon:icone, title:alerta.titulo }).bindPopup(`<div class="map-popup"><b>${A().esc(alerta.titulo)}</b><span>${A().esc(alerta.tipo)} · ${A().rotulos[alerta.gravidade]}</span><p>${A().esc(alerta.descricao)}</p><small>${A().esc(alerta.bairro)} · ${A().esc(alerta.endereco)}</small></div>`);
  }

  window.criarMapaDeAlertas = function (id, opcoes = {}) {
    const elemento = document.getElementById(id);
    if (!elemento || estados.has(elemento)) return estados.get(elemento)?.api;
    const mapa = L.map(elemento, { scrollWheelZoom:true, minZoom:10, maxBounds:[[ -24.05,-47.1],[-23.2,-46.1]] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'© OpenStreetMap' }).addTo(mapa);
    const grupos = {};
    const camadas = { 'crítico':L.markerClusterGroup(), 'médio':L.markerClusterGroup(), 'baixo':L.markerClusterGroup() };
    A().dados.forEach(a => { const chave=`${a.latitude.toFixed(4)},${a.longitude.toFixed(4)}`; (grupos[chave] ||= []).push(a); });
    Object.values(grupos).forEach(grupo => grupo.forEach((a, indice) => {
      const angulo = (indice / grupo.length) * Math.PI * 2;
      camadas[a.gravidade].addLayer(marcador(a, grupo.length > 1 ? {lat:Math.cos(angulo)*0.00018,lng:Math.sin(angulo)*0.00018} : null));
    }));
    Object.values(camadas).forEach(c => mapa.addLayer(c));
    const zonas = L.layerGroup([
      L.circle([-23.548,-46.605], { radius:520, color:'#f59e0b', weight:1, fillOpacity:.08 }),
      L.circle([-23.5505,-46.6333], { radius:480, color:'#ef4444', weight:1, fillOpacity:.08 })
    ]);
    const limites = L.featureGroup(Object.values(camadas).flatMap(c => c.getLayers()));
    mapa.fitBounds(limites.getBounds(), { padding:[38,38], maxZoom:13 });
    const api = { mapa, camadas, zonas, adicionarPonto(lat,lng) { if (api.ponto) mapa.removeLayer(api.ponto); api.ponto=L.circleMarker([lat,lng], {radius:12,color:'#fff',weight:3,fillColor:'#8b5cf6',fillOpacity:1}).addTo(mapa).bindTooltip('Ponto da simulação', {permanent:true, direction:'top'}); } };
    estados.set(elemento, {api});
    setTimeout(() => mapa.invalidateSize(), 0);
    return api;
  };

  window.conectarControlesMapa = function (api, raiz=document) {
    raiz.querySelectorAll('[data-map-filter]').forEach(botao => botao.addEventListener('click', () => {
      const nivel=botao.dataset.mapFilter, camada=api.camadas[nivel];
      api.mapa.hasLayer(camada) ? api.mapa.removeLayer(camada) : api.mapa.addLayer(camada);
      botao.classList.toggle('is-off', !api.mapa.hasLayer(camada));
    }));
    raiz.querySelector('[data-zonas]')?.addEventListener('change', e => e.target.checked ? api.zonas.addTo(api.mapa) : api.mapa.removeLayer(api.zonas));
  };
})();
