/* ============================================
   SENTINEL IA — Laboratório de Simulação Urbana
   Engine Geoespacial e Predição Preditiva
   ============================================ */

(function () {
  'use strict';

  let map = null;
  let aoiGroup = null;
  let boGroup = null;
  let simGroup = null;
  let clickMarker = null;

  let showAOIs = true;
  let showBOs = true;
  let showSims = true;

  let autoDemoTimer = null;
  let isAutoDemoActive = false;

  let activeSimulations = [];

  // Coordenadas padrão por bairro
  const DISTRICT_COORDS = {
    'Sé': { lat: -23.55052, lng: -46.63330, address: 'Praça da Sé, próx. Catedral' },
    'Bela Vista': { lat: -23.56140, lng: -46.65600, address: 'Av. Paulista, 1578 (MASP)' },
    'Pinheiros': { lat: -23.56750, lng: -46.69200, address: 'Av. Brigadeiro Faria Lima, 2200' },
    'Lapa': { lat: -23.51900, lng: -46.69200, address: 'Marginal Tietê, próx. Ponte da Lapa' },
    'Moema': { lat: -23.59500, lng: -46.66200, address: 'Av. Ibirapuera, 1200' },
    'Tatuapé': { lat: -23.54100, lng: -46.57500, address: 'Rua Tuiuti, 1500' },
    'Santana': { lat: -23.50500, lng: -46.62600, address: 'Av. Cruzeiro do Sul, 2400' },
    'Brás': { lat: -23.54300, lng: -46.61800, address: 'Rua do Gasômetro, 300' }
  };

  // Base de Ocorrências Históricas SSP-SP
  const BASE_SP_OCCURRENCES = [
    { id: 'BO-001', bo: '98124/2026', type: 'Furto de Celular', district: 'Sé', address: 'Praça da Sé', lat: -23.55052, lng: -46.63330, severity: 'MEDIA' },
    { id: 'BO-002', bo: '98125/2026', type: 'Roubo de Veículo', district: 'Pinheiros', address: 'Av. Faria Lima', lat: -23.56750, lng: -46.69200, severity: 'ALTA' },
    { id: 'BO-003', bo: '98126/2026', type: 'Furto de Veículo', district: 'Bela Vista', address: 'Rua 13 de Maio', lat: -23.55800, lng: -46.64500, severity: 'MEDIA' },
    { id: 'BO-004', bo: '98127/2026', type: 'Alagamento Pista Expressa', district: 'Lapa', address: 'Marginal Tietê', lat: -23.51900, lng: -46.69200, severity: 'ALTA' },
    { id: 'BO-005', bo: '98128/2026', type: 'Tentativa de Roubo Comercial', district: 'Moema', address: 'Av. Ibirapuera', lat: -23.59500, lng: -46.66200, severity: 'CRITICA' },
    { id: 'BO-006', bo: '98129/2026', type: 'Furto Qualificado', district: 'Tatuapé', address: 'Rua Tuiuti', lat: -23.54100, lng: -46.57500, severity: 'BAIXA' },
    { id: 'BO-007', bo: '98130/2026', type: 'Roubo de Carga', district: 'Brás', address: 'Rua do Gasômetro', lat: -23.54300, lng: -46.61800, severity: 'CRITICA' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    initLiveClock();
    initSimMap();
    initWeatherTelemetry();
    initControls();
  });

  // 1. Relógio ao Vivo
  function initLiveClock() {
    const clock = document.getElementById('liveClock');
    const topDate = document.getElementById('topbarDate');
    
    function update() {
      const now = new Date();
      if (clock) clock.textContent = now.toLocaleTimeString('pt-BR');
      if (topDate) {
        topDate.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      }
    }
    update();
    setInterval(update, 1000);
  }

  // 2. Telemetria de Clima
  async function initWeatherTelemetry() {
    if (window.SentinelAPI && window.SentinelAPI.fetchLiveWeather) {
      try {
        const w = await window.SentinelAPI.fetchLiveWeather();
        const header = document.getElementById('simWeatherHeader');
        const wind = document.getElementById('simWind');
        if (header && w.temp) {
          header.textContent = `São Paulo, SP • ${w.temp} • Condições Monitoradas`;
        }
        if (wind && w.windspeed) {
          wind.textContent = w.windspeed;
        }
      } catch (e) {
        console.warn('Fallback de clima ativado:', e);
      }
    }
  }

  // 3. Inicialização do Mapa Leaflet
  function initSimMap() {
    const mapEl = document.getElementById('simMap');
    if (!mapEl) return;

    map = L.map('simMap', {
      center: [-23.555, -46.650],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Dark CartoDB Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Grupos de Camadas
    aoiGroup = L.layerGroup().addTo(map);
    boGroup = L.layerGroup().addTo(map);
    simGroup = L.layerGroup().addTo(map);

    // Renderizar Polígonos das Zonas AOI
    renderAOIs();

    // Renderizar Ocorrências Base
    renderBaseOccurrences();

    // Clique no Mapa para capturar coordenadas
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setSimulationPin(lat, lng);
    });
  }

  // Renderizar Áreas de Interesse (AOIs)
  function renderAOIs() {
    aoiGroup.clearLayers();
    if (!showAOIs || !window.SentinelAPI || !window.SentinelAPI.aoiZones) return;

    window.SentinelAPI.aoiZones.forEach(zone => {
      const poly = L.polygon(zone.bounds, {
        color: zone.color,
        fillColor: zone.fillColor,
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '4, 6'
      });

      poly.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-size: 11px; font-weight: 800; color: ${zone.color};">${zone.code} • RISCO ${zone.riskLevel} (${zone.riskScore}/100)</div>
          <h4 style="margin: 4px 0; font-size: 13px;">${zone.name}</h4>
          <p style="margin: 4px 0 6px 0; font-size: 11px; color: #475569;">${zone.description}</p>
          <div style="font-size: 10px; font-weight: 600; color: #1e293b;">📸 ${zone.activeCameras} Câmeras OCR • 📡 ${zone.activeSensors} Sensores IoT</div>
        </div>
      `);

      poly.addTo(aoiGroup);
    });
  }

  // Renderizar Ocorrências da Base SSP-SP
  function renderBaseOccurrences() {
    boGroup.clearLayers();
    if (!showBOs) return;

    BASE_SP_OCCURRENCES.forEach(bo => {
      const isCrit = bo.severity === 'CRITICA';
      const color = isCrit ? '#ef4444' : (bo.severity === 'ALTA' ? '#f59e0b' : '#3b82f6');

      const icon = L.divIcon({
        className: 'custom-bo-marker',
        html: `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 2px solid #fff; box-shadow: 0 0 8px ${color};"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([bo.lat, bo.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: ${color};">
            <span>BO Nº ${bo.bo}</span>
            <span>${bo.severity}</span>
          </div>
          <h4 style="margin: 4px 0 2px 0; font-size: 12px; font-weight: 700;">${bo.type}</h4>
          <div style="font-size: 11px; color: #64748b;">📍 ${bo.district} — ${bo.address}</div>
        </div>
      `);

      marker.addTo(boGroup);
    });
  }

  // Fixar Pin ao clicar no Mapa
  function setSimulationPin(lat, lng) {
    const latInput = document.getElementById('simLat');
    const lngInput = document.getElementById('simLng');
    if (latInput) latInput.value = lat.toFixed(5);
    if (lngInput) lngInput.value = lng.toFixed(5);

    if (clickMarker) {
      map.removeLayer(clickMarker);
    }

    const pinIcon = L.divIcon({
      className: 'custom-click-pin',
      html: `
        <div style="width: 22px; height: 22px; border-radius: 50%; background: rgba(0, 229, 255, 0.4); border: 2px solid #00e5ff; display: flex; align-items: center; justify-content: center; animation: radar-wave 1.2s infinite;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #fff;"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    clickMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    clickMarker.bindTooltip('📍 Ponto Selecionado para Simulação', { permanent: false, direction: 'top' });
  }

  // Atualizar coordenadas quando o usuário troca o Bairro no dropdown
  window.updateCoordsByDistrict = function (district) {
    const item = DISTRICT_COORDS[district];
    if (!item) return;

    const latInput = document.getElementById('simLat');
    const lngInput = document.getElementById('simLng');
    const addrInput = document.getElementById('simAddress');

    if (latInput) latInput.value = item.lat.toFixed(5);
    if (lngInput) lngInput.value = item.lng.toFixed(5);
    if (addrInput) addrInput.value = item.address;

    setSimulationPin(item.lat, item.lng);
    if (map) map.panTo([item.lat, item.lng]);
  };

  // 4. Submissão do Formulário de Incidente Customizado
  window.handleCustomSimSubmit = function (e) {
    e.preventDefault();

    const title = document.getElementById('simTitle').value;
    const category = document.getElementById('simCategory').value;
    const district = document.getElementById('simDistrict').value;
    const address = document.getElementById('simAddress').value;
    const severity = document.getElementById('simSeverity').value;
    const lat = parseFloat(document.getElementById('simLat').value);
    const lng = parseFloat(document.getElementById('simLng').value);

    const simEvent = {
      id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
      title: title || category,
      type: category,
      district: district,
      address: address,
      severity: severity,
      lat: lat,
      lng: lng,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };

    addSimulatedEventToMap(simEvent);
    calculateAndRenderAiDiagnosis(simEvent);
  };

  // 5. Disparo de Cenários Prontos em 1 Clique
  window.triggerScenario = function (scenarioId) {
    const scenarios = {
      'tempestade_marginal': [
        { title: 'Alagamento Crítico — Transbordamento de Pista', type: 'Alagamento Iminente', district: 'Lapa', address: 'Marginal Tietê, próx. Ponte da Lapa', severity: 'CRITICA', lat: -23.5195, lng: -46.6930 },
        { title: 'Queda de Árvore em Faixa de Rolamento', type: 'Queda de Árvore', district: 'Santana', address: 'Av. Olavo Fontoura', severity: 'ALTA', lat: -23.5080, lng: -46.6390 }
      ],
      'arrastao_centro': [
        { title: 'Arrastão / Roubo Coletivo a Transeuntes', type: 'Arrastão / Furto Coletivo', district: 'Sé', address: 'Rua Direita x Praça do Patriarca', severity: 'CRITICA', lat: -23.5485, lng: -46.6345 },
        { title: 'Aglomeração Hostil / Distúrbio', type: 'Aglomeração Hostil', district: 'Sé', address: 'Praça da Sé, Metrô', severity: 'ALTA', lat: -23.5505, lng: -46.6333 }
      ],
      'aglomeracao_paulista': [
        { title: 'Manifestação Espontânea / Bloqueio Total', type: 'Bloqueio de Via', district: 'Bela Vista', address: 'Av. Paulista, 1578 (MASP)', severity: 'CRITICA', lat: -23.5614, lng: -46.6560 }
      ],
      'pane_pinheiros': [
        { title: 'Apagão Semafórico em Cruzamento', type: 'Falha Semafórica', district: 'Pinheiros', address: 'Av. Faria Lima x Rebouças', severity: 'ALTA', lat: -23.5675, lng: -46.6920 },
        { title: 'Acidente Múltiplo com Bloqueio de Faixa', type: 'Acidente de Trânsito', district: 'Pinheiros', address: 'Av. Faria Lima, 3900', severity: 'CRITICA', lat: -23.5920, lng: -46.6850 }
      ]
    };

    const list = scenarios[scenarioId] || scenarios['tempestade_marginal'];
    list.forEach(item => {
      const simEvent = {
        id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
        title: item.title,
        type: item.type,
        district: item.district,
        address: item.address,
        severity: item.severity,
        lat: item.lat,
        lng: item.lng,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      addSimulatedEventToMap(simEvent);
    });

    calculateAndRenderAiDiagnosis(list[0]);
  };

  // Adicionar Evento Simulado no Mapa com Animação Radar
  function addSimulatedEventToMap(simEvent) {
    activeSimulations.push(simEvent);

    const badgeCount = document.getElementById('simCountBadge');
    if (badgeCount) badgeCount.textContent = activeSimulations.length;

    const isCrit = simEvent.severity === 'CRITICA';
    const markerClass = isCrit ? 'sim-radar-marker critica' : 'sim-radar-marker';

    const icon = L.divIcon({
      className: 'custom-sim-divicon',
      html: `<div class="${markerClass}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([simEvent.lat, simEvent.lng], { icon }).addTo(simGroup);
    
    marker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; font-weight: 800; color: #00e5ff; font-family: monospace;">${simEvent.id}</span>
          <span style="font-size: 9px; font-weight: 700; background: ${isCrit ? '#ef444433' : '#00e5ff22'}; color: ${isCrit ? '#ef4444' : '#00e5ff'}; padding: 2px 6px; border-radius: 4px;">
            ${simEvent.severity}
          </span>
        </div>
        <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: 700; color: #fff;">${simEvent.title}</h4>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">📍 ${simEvent.district} — ${simEvent.address}</div>
        <div style="font-size: 10px; color: #00e5ff; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
          ⚡ Simulação Ativa • Disparada às ${simEvent.timestamp}
        </div>
      </div>
    `);

    // Pan suave até o local
    if (map) map.panTo([simEvent.lat, simEvent.lng]);

    // Sincronizar com Supabase se disponível
    if (window.SentinelAPI && window.SentinelAPI.supabaseEngine) {
      window.SentinelAPI.supabaseEngine.saveAlertToDB({
        name: `${simEvent.district} — ${simEvent.address}`,
        type: simEvent.title,
        severity: simEvent.severity.toLowerCase(),
        lat: simEvent.lat,
        lng: simEvent.lng
      });
    }
  }

  // 6. Cálculo do Diagnóstico de IA
  function calculateAndRenderAiDiagnosis(simEvent) {
    const termScore = document.getElementById('aiDiagScore');
    const termContent = document.getElementById('aiDiagContent');

    const score = simEvent.severity === 'CRITICA' ? Math.floor(88 + Math.random() * 10) : Math.floor(70 + Math.random() * 15);
    if (termScore) termScore.textContent = `Score: ${score}/100`;

    let recommendations = [];
    if (simEvent.type.includes('Alagamento') || simEvent.title.includes('Tempestade')) {
      recommendations = [
        'Desvio de tráfego automático para rotas secundárias ativado via Waze/CET',
        'Acionamento de bombas de sucção e alerta de nível 3 para Defesa Civil',
        'Notificação de rota intransitável enviada a condutores na região'
      ];
    } else if (simEvent.type.includes('Arrastão') || simEvent.type.includes('Roubo')) {
      recommendations = [
        'Cerco eletrônico por leitura OCR de placas ativado nas saídas radiais',
        'Despacho prioritário para 2 viaturas de patrulhamento da PM/GCM',
        'Cálculo de probabilidade de rota de fuga traçado por grafo de IA'
      ];
    } else {
      recommendations = [
        'Reprogramação remota dos semáforos adjacentes para onda verde de escoamento',
        'Envio de agentes de trânsito para operação manual do cruzamento',
        'Alerta de segurança prioritário para veículos de emergência (SAMU/Resgate)'
      ];
    }

    if (termContent) {
      termContent.innerHTML = `
        <p style="margin: 2px 0; color: #fff;"><strong>Incidente:</strong> <span style="color: var(--cyan);">${simEvent.title}</span> (${simEvent.district})</p>
        <p style="margin: 2px 0; color: #fbbf24;"><strong>Impacto Estimado:</strong> Saturação de fluxo viário e risco operacional moderado/alto.</p>
        <div style="margin-top: 6px; font-weight: 700; color: #94a3b8;">Ações Táticas Recomendadas:</div>
        <ul style="margin: 4px 0 0 16px; padding: 0; color: #e2e8f0; font-size: 0.76rem;">
          ${recommendations.map(r => `<li style="margin-bottom: 2px;">• ${r}</li>`).join('')}
        </ul>
      `;
    }
  }

  // 7. Controles de Camadas e Ações
  function initControls() {
    const btnToggleAOIs = document.getElementById('toggleAOIsBtn');
    const btnToggleBOs = document.getElementById('toggleBOsBtn');
    const btnToggleSims = document.getElementById('toggleSimsBtn');
    const btnResetMap = document.getElementById('btnResetMap');
    const btnClearSims = document.getElementById('btnClearSims');
    const btnAutoDemo = document.getElementById('btnAutoDemo');

    if (btnToggleAOIs) {
      btnToggleAOIs.addEventListener('click', () => {
        showAOIs = !showAOIs;
        btnToggleAOIs.classList.toggle('active', showAOIs);
        renderAOIs();
      });
    }

    if (btnToggleBOs) {
      btnToggleBOs.addEventListener('click', () => {
        showBOs = !showBOs;
        btnToggleBOs.classList.toggle('active', showBOs);
        renderBaseOccurrences();
      });
    }

    if (btnToggleSims) {
      btnToggleSims.addEventListener('click', () => {
        showSims = !showSims;
        btnToggleSims.classList.toggle('active', showSims);
        if (showSims) {
          map.addLayer(simGroup);
        } else {
          map.removeLayer(simGroup);
        }
      });
    }

    if (btnResetMap) {
      btnResetMap.addEventListener('click', () => {
        if (map) map.setView([-23.555, -46.650], 12);
      });
    }

    if (btnClearSims) {
      btnClearSims.addEventListener('click', () => {
        activeSimulations = [];
        simGroup.clearLayers();
        if (clickMarker) {
          map.removeLayer(clickMarker);
          clickMarker = null;
        }
        const badgeCount = document.getElementById('simCountBadge');
        if (badgeCount) badgeCount.textContent = '0';

        const termContent = document.getElementById('aiDiagContent');
        if (termContent) {
          termContent.innerHTML = '<p style="margin: 2px 0; color: #94a3b8;">> Simulações limpas com sucesso. Sistema pronto.</p>';
        }
      });
    }

    // Modo Demo FECART
    if (btnAutoDemo) {
      btnAutoDemo.addEventListener('click', () => {
        if (isAutoDemoActive) {
          clearInterval(autoDemoTimer);
          isAutoDemoActive = false;
          btnAutoDemo.innerHTML = '<i data-lucide="play" style="width:14px;height:14px;color:var(--cyan)"></i> Modo Demo FECART';
          btnAutoDemo.classList.remove('btn-danger');
          btnAutoDemo.classList.add('btn-secondary');
        } else {
          isAutoDemoActive = true;
          btnAutoDemo.innerHTML = '<i data-lucide="square" style="width:14px;height:14px;color:#fff"></i> Parar Demo';
          btnAutoDemo.classList.remove('btn-secondary');
          btnAutoDemo.classList.add('btn-danger');

          const scenarios = ['tempestade_marginal', 'arrastao_centro', 'aglomeracao_paulista', 'pane_pinheiros'];
          autoDemoTimer = setInterval(() => {
            const randomScen = scenarios[Math.floor(Math.random() * scenarios.length)];
            window.triggerScenario(randomScen);
          }, 7000);
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

})();
