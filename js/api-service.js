/* ============================================
   SENTINEL IA — Live API & Telemetry Engine
   Simula endpoints REST/WebSocket de alta fidelidade 
   e conexão com serviços reais (OpenStreetMap, Weather & IoT)
   ============================================ */

(function () {
  'use strict';

  const SentinelAPI = {
    version: '3.2.1-api',
    status: 'ONLINE',
    pingMs: 14,

    // Áreas de Interesse (AOIs) Geoespaciais em São Paulo
    aoiZones: [
      {
        id: 'AOI-01',
        name: 'AOI Alpha — Av. Paulista & Bela Vista',
        riskLevel: 'MÉDIO',
        riskScore: 68,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        bounds: [
          [-23.565, -46.658],
          [-23.558, -46.648],
          [-23.568, -46.640],
          [-23.575, -46.650]
        ],
        center: [-23.563, -46.654],
        activeSensors: 412,
        activeCameras: 84,
        description: 'Corredor financeiro e gastronômico. Fluxo intenso de pedestres e veículos.'
      },
      {
        id: 'AOI-02',
        name: 'AOI Bravo — Centro Histórico & Sé',
        riskLevel: 'CRÍTICO',
        riskScore: 92,
        color: '#ef4444',
        fillColor: '#ef4444',
        bounds: [
          [-23.553, -46.638],
          [-23.545, -46.631],
          [-23.550, -46.625],
          [-23.558, -46.632]
        ],
        center: [-23.5505, -46.6333],
        activeSensors: 320,
        activeCameras: 120,
        description: 'Zona de alta densidade histórica. Monitoramento prioritário por IA para prevenção de furtos e aglomerações.'
      },
      {
        id: 'AOI-03',
        name: 'AOI Charlie — Vila Olímpia & Faria Lima',
        riskLevel: 'BAIXO',
        riskScore: 24,
        color: '#10b981',
        fillColor: '#10b981',
        bounds: [
          [-23.598, -46.690],
          [-23.590, -46.680],
          [-23.596, -46.672],
          [-23.604, -46.682]
        ],
        center: [-23.595, -46.685],
        activeSensors: 530,
        activeCameras: 96,
        description: 'Polo tecnológico e corporativo. Monitoramento constante de tráfego inteligente.'
      },
      {
        id: 'AOI-04',
        name: 'AOI Delta — Marginal Tietê & Lapa',
        riskLevel: 'ALTO',
        riskScore: 81,
        color: '#a855f7',
        fillColor: '#a855f7',
        bounds: [
          [-23.520, -46.705],
          [-23.510, -46.690],
          [-23.518, -46.678],
          [-23.528, -46.695]
        ],
        center: [-23.519, -46.692],
        activeSensors: 289,
        activeCameras: 64,
        description: 'Via expressa de tráfego pesado. Risco recorrente de retenção e acidentes em horários de pico.'
      }
    ],

    // Obter dados em tempo real da API
    fetchSystemTelemetry: function () {
      return {
        timestamp: new Date().toISOString(),
        apiStatus: '200 OK',
        latency: Math.floor(Math.random() * 8) + 12 + 'ms',
        throughput: '4.8 GB/s',
        activeModels: 4,
        processedFramesToday: (2415800 + Math.floor(Math.random() * 500)).toLocaleString('pt-BR'),
        activeAlertsCount: 23 + Math.floor(Math.random() * 3),
        securityIndex: (87.2 + (Math.random() * 0.5 - 0.25)).toFixed(1) + '%'
      };
    },

    // Buscar dados do tempo reais da API pública (Open-Meteo) para São Paulo
    fetchLiveWeather: async function () {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current_weather=true');
        const data = await response.json();
        if (data && data.current_weather) {
          return {
            temp: data.current_weather.temperature + '°C',
            windspeed: data.current_weather.windspeed + ' km/h',
            weathercode: data.current_weather.weathercode,
            isDay: data.current_weather.is_day === 1
          };
        }
      } catch (err) {
        console.warn('Fallback para dados locais de clima:', err);
      }
      return { temp: '25°C', windspeed: '12 km/h', isDay: true };
    },

    // Simular novo evento/alerta recebido via WebSocket
    generateLiveEvent: function () {
      const types = [
        { title: 'Congestionamento Detectado (IA OCR)', category: 'Trânsito', severity: 'Alta', color: 'badge-yellow', icon: 'car' },
        { title: 'Alerta de Aglomeração Atípica', category: 'Segurança', severity: 'Crítica', color: 'badge-red', icon: 'alert-triangle' },
        { title: 'Pico Pluviométrico Registrado', category: 'Clima', severity: 'Média', color: 'badge-blue', icon: 'cloud-rain' },
        { title: 'Oscilação em Semáforo Inteligente', category: 'Infraestrutura', severity: 'Baixa', color: 'badge-purple', icon: 'activity' }
      ];
      const locations = [
        'Av. Brigadeiro Faria Lima, Pinheiros',
        'Praça da Sé, Centro',
        'Av. Rebouças, Cerqueira César',
        'Marginal Pinheiros, Ponte Estaiada',
        'Rua Augusta, Consolação',
        'Av. Ibirapuera, Moema'
      ];

      const evt = types[Math.floor(Math.random() * types.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const id = '#ALT-' + Math.floor(1000 + Math.random() * 9000);

      return {
        id: id,
        title: evt.title,
        location: loc,
        category: evt.category,
        severity: evt.severity,
        badgeColor: evt.color,
        icon: evt.icon,
        time: 'Agora mesmo (' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ')'
      };
    }
  };

  window.SentinelAPI = SentinelAPI;
})();
