/* ============================================
   SENTINEL IA — Live API, Telemetry & Supabase DB Engine
   Simula endpoints REST/WebSocket de alta fidelidade,
   conexão com serviços reais (Open-Meteo, CartoDB) e 
   integração nativa com Banco de Dados PostgreSQL via Supabase
   ============================================ */

(function () {
  'use strict';

  // ── Configuração do Supabase (PostgreSQL na Nuvem) ──
  const SUPABASE_CONFIG = {
    url: window.SENTINEL_SUPABASE_URL || 'https://mohdtlyvvyhwvanlizfu.supabase.co',
    anonKey: window.SENTINEL_SUPABASE_KEY || 'sb_publishable_E82Xv77N2ZaXsQDRrF8j4w__6DeG0cs',
    tableName: 'alerts'
  };

  let supabaseClient = null;

  // Inicializa o cliente do Supabase se a biblioteca estiver carregada no HTML
  function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        if (!supabaseClient && SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.includes('SEU_PROJETO')) {
          supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
          console.log('🟢 Supabase Engine Conectado: PostgreSQL Ready');
        }
      } catch (e) {
        console.warn('⚠️ Supabase operando em modo simulação local:', e);
      }
    }
    return supabaseClient;
  }

  const SentinelAPI = {
    version: '3.3.0-supabase',
    status: 'ONLINE',
    pingMs: 14,
    dbType: 'PostgreSQL (Supabase)',

    // Áreas de Interesse (AOIs) Geoespaciais em São Paulo
    aoiZones: [
      {
        id: 'AOI-01',
        code: 'AOI-ALPHA',
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
        code: 'AOI-BRAVO',
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
        code: 'AOI-CHARLIE',
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
        code: 'AOI-DELTA',
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

    // Telemetria da API e do Banco
    fetchSystemTelemetry: function () {
      const isConnected = !!initSupabase();
      return {
        timestamp: new Date().toISOString(),
        apiStatus: '200 OK',
        databaseStatus: isConnected ? 'PostgreSQL Live (Supabase)' : 'PostgreSQL Simulation / LocalStorage',
        dbConnected: isConnected,
        latency: Math.floor(Math.random() * 6) + 12 + 'ms',
        throughput: '4.8 GB/s',
        activeModels: 4,
        processedFramesToday: (2415800 + Math.floor(Math.random() * 500)).toLocaleString('pt-BR'),
        activeAlertsCount: 23 + Math.floor(Math.random() * 3),
        securityIndex: (87.2 + (Math.random() * 0.5 - 0.25)).toFixed(1) + '%'
      };
    },

    // Buscar dados reais de clima via Open-Meteo REST API
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

    // ── Módulos do Supabase (Banco de Dados PostgreSQL) ──
    supabaseEngine: {
      get client() {
        return initSupabase();
      },

      // Buscar todos os alertas do Supabase (PostgreSQL)
      fetchAlertsFromDB: async function () {
        const client = initSupabase();
        if (!client) {
          console.log('📦 Supabase não configurado. Retornando dados locais simulados.');
          return null;
        }

        try {
          const { data, error } = await client
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Erro na consulta Supabase:', error);
            return null;
          }
          return data;
        } catch (e) {
          console.error('Erro de conexão Supabase:', e);
          return null;
        }
      },

      // Inserir um novo alerta no banco PostgreSQL no Supabase
      saveAlertToDB: async function (alertData) {
        const client = initSupabase();
        if (!client) return false;

        try {
          const payload = {
            name: alertData.location || alertData.name || 'São Paulo',
            type: alertData.title || alertData.type || 'Ocorrência Detectada',
            severity: (alertData.severity || 'warning').toLowerCase(),
            lat: alertData.lat || -23.5505,
            lng: alertData.lng || -46.6333,
            created_at: new Date().toISOString()
          };

          const { data, error } = await client.from('alerts').insert([payload]);
          if (error) {
            console.error('Erro ao salvar alerta no Supabase:', error);
            return false;
          }
          console.log('✅ Alerta salvo no Supabase PostgreSQL com sucesso:', data);
          return true;
        } catch (e) {
          console.error('Falha de rede Supabase:', e);
          return false;
        }
      },

      // Assinar atualizações em tempo real (Realtime WebSocket) do Supabase
      subscribeRealtime: function (onNewAlertCallback) {
        const client = initSupabase();
        if (!client || typeof client.channel !== 'function') return null;

        const channel = client
          .channel('public:alerts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
            console.log('⚡ Novo alerta recebido via Supabase WebSocket:', payload.new);
            if (typeof onNewAlertCallback === 'function') {
              onNewAlertCallback(payload.new);
            }
          })
          .subscribe();

        return channel;
      }
    },

    // Simular novo evento/alerta recebido via WebSocket/API
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

      const generated = {
        id: id,
        title: evt.title,
        location: loc,
        category: evt.category,
        severity: evt.severity,
        badgeColor: evt.color,
        icon: evt.icon,
        time: 'Agora mesmo (' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ')'
      };

      // Tentar salvar no Supabase de forma assíncrona
      if (this.supabaseEngine) {
        this.supabaseEngine.saveAlertToDB(generated);
      }

      return generated;
    }
  };

  window.SentinelAPI = SentinelAPI;
})();
