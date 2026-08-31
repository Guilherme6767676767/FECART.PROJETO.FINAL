/* ============================================
   SENTINEL IA — Assistente Virtual Inteligente v2.0
   Motor de NLP Local com Contexto Conversacional,
   Dados em Tempo Real (Clima, AOIs, Telemetria)
   e Geração Dinâmica de Respostas
   ============================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════════
  //  MEMÓRIA CONVERSACIONAL
  // ══════════════════════════════════════════════
  const conversationMemory = {
    history: [],       // { role: 'user'|'bot', text: string, timestamp: Date }
    lastTopic: null,   // última intenção detectada
    userName: null,     // se o usuário se apresentar
    questionsAsked: 0,
    sessionStart: new Date()
  };

  // ══════════════════════════════════════════════
  //  BASE DE CONHECIMENTO EXPANDIDA
  // ══════════════════════════════════════════════
  const KNOWLEDGE_BASE = {

    // ── Informações Institucionais do Sentinel IA ──
    about: {
      name: 'Sentinel IA',
      version: '3.3.0',
      description: 'Sistema de Inteligência Preditiva Urbana para a cidade de São Paulo, integrando monitoramento de segurança pública, mobilidade urbana, condições climáticas e infraestrutura em tempo real.',
      modules: ['Dashboard de Controle', 'Mapa Geoespacial Interativo', 'Análise Preditiva com IA', 'Central de Alertas em Tempo Real', 'Laboratório de Simulação Urbana'],
      tech: ['Redes Neurais Convolucionais (CNN)', 'LSTM para Séries Temporais', 'Transformers para NLP', 'Autoencoders para Detecção de Anomalias'],
      cameras: 1847,
      sensors: 3421,
      coverage: '97.3% da Região Metropolitana de SP'
    },

    // ── Bairros de São Paulo com dados contextuais ──
    neighborhoods: {
      'sé': { name: 'Sé / Centro Histórico', risk: 'CRÍTICO', riskScore: 92, highlights: 'Catedral da Sé, Pátio do Colégio, Praça da República. Alta incidência de furtos e aglomerações.', patrol: 'Patrulhamento ostensivo 24h da PM e GCM com apoio de 120 câmeras IA.' },
      'bela vista': { name: 'Bela Vista / Av. Paulista', risk: 'MÉDIO', riskScore: 68, highlights: 'MASP, Parque Trianon, Rua Augusta. Corredor financeiro com fluxo intenso.', patrol: '84 câmeras de reconhecimento facial ativas na Av. Paulista.' },
      'pinheiros': { name: 'Pinheiros / Faria Lima', risk: 'BAIXO', riskScore: 24, highlights: 'Polo tecnológico e corporativo. Beco do Batman, Largo da Batata.', patrol: '96 câmeras OCR de leitura de placas e 530 sensores IoT ativos.' },
      'lapa': { name: 'Lapa / Marginal Tietê', risk: 'ALTO', riskScore: 81, highlights: 'Via expressa de tráfego pesado. Risco de alagamento e acidentes.', patrol: '64 câmeras e 289 sensores monitoram tráfego e nível hidrológico.' },
      'moema': { name: 'Moema / Ibirapuera', risk: 'BAIXO', riskScore: 18, highlights: 'Parque Ibirapuera, região residencial premium. Segurança elevada.', patrol: 'Rondas preventivas da Guarda Urbana com status verificado.' },
      'tatuapé': { name: 'Tatuapé / Zona Leste', risk: 'MÉDIO', riskScore: 55, highlights: 'Shopping Metrô Tatuapé, Parque Piqueri. Região comercial densa.', patrol: 'Monitoramento via câmeras em corredores de ônibus e estações.' },
      'santana': { name: 'Santana / Zona Norte', risk: 'MÉDIO', riskScore: 48, highlights: 'Expo Center Norte, Terminal Santana. Fluxo intenso de transporte.', patrol: 'Sensores climáticos IoT e câmeras nos terminais de ônibus.' },
      'brás': { name: 'Brás / Zona Central', risk: 'ALTO', riskScore: 78, highlights: 'Comércio popular intenso, Rua 25 de Março próxima. Alta densidade.', patrol: 'Reforço de segurança com câmeras OCR nas ruas comerciais.' },
      'consolação': { name: 'Consolação', risk: 'MÉDIO', riskScore: 45, highlights: 'Rua Augusta, Praça Roosevelt. Vida noturna intensa.', patrol: 'Monitoramento de aglomerações por IA com alertas automáticos.' },
      'jardins': { name: 'Jardins', risk: 'BAIXO', riskScore: 15, highlights: 'Região residencial premium. Rua Oscar Freire, comércio de luxo.', patrol: 'Patrulhamento preventivo constante. Índice de segurança elevado.' },
      'vila mariana': { name: 'Vila Mariana', risk: 'BAIXO', riskScore: 22, highlights: 'Parque do Ibirapuera Sul, SESC Vila Mariana.', patrol: 'Câmeras de segurança nos principais cruzamentos.' },
      'interlagos': { name: 'Interlagos / Zona Sul', risk: 'ALTO', riskScore: 72, highlights: 'Autódromo de Interlagos, Represa Guarapiranga.', patrol: 'Sensores pluviométricos e de nível de represa ativados.' }
    },

    // ── Tipos de Ocorrência SSP-SP ──
    crimeTypes: {
      'furto': { description: 'Furto simples ou qualificado', trend: 'Redução de 3.2% em relação ao mês anterior', hotspots: 'Sé, Brás, Estações de Metrô' },
      'roubo': { description: 'Roubo (com violência ou grave ameaça)', trend: 'Estável com pico no período noturno', hotspots: 'Marginal Tietê, Centro, Zona Leste' },
      'roubo de veículo': { description: 'Roubo de veículo (carjacking)', trend: 'Aumento de 1.8% na Zona Sul', hotspots: 'Marginais, Radial Leste, Santo Amaro' },
      'alagamento': { description: 'Alagamento de via pública', trend: 'Risco elevado durante temporada de chuvas (outubro–março)', hotspots: 'Marginal Tietê, Mooca, Ipiranga' },
      'acidente': { description: 'Acidente de trânsito', trend: 'Concentração nos horários de pico (7h–9h e 17h–20h)', hotspots: 'Marginais, Av. Paulista, Av. Rebouças' }
    },

    // ── Dicas de Segurança Urbana por Contexto ──
    safetyTips: {
      night: [
        'Evite caminhar sozinho em áreas pouco iluminadas após as 22h.',
        'Utilize aplicativos de transporte confiáveis em vez de transporte público tarde da noite.',
        'Mantenha pertences pessoais (celular, carteira) em bolsos internos.'
      ],
      rain: [
        'Evite trafegar pelas Marginais Tietê e Pinheiros durante chuvas fortes.',
        'Consulte o radar meteorológico no módulo de Clima do Sentinel antes de sair.',
        'Mantenha distância segura de bueiros e bocas de lobo durante temporais.'
      ],
      general: [
        'Cadastre seu veículo no sistema de alerta de furto/roubo da SSP-SP.',
        'Utilize o recurso de "zona segura" do Sentinel para traçar rotas monitoradas.',
        'Em caso de emergência, ligue 190 (PM), 193 (Bombeiros) ou 192 (SAMU).'
      ]
    }
  };

  // ══════════════════════════════════════════════
  //  MOTOR DE INTENÇÕES (NLP LOCAL)
  // ══════════════════════════════════════════════
  const INTENTS = [
    {
      id: 'greeting',
      keywords: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hey', 'e aí', 'e ai', 'fala', 'salve', 'eae'],
      priority: 1
    },
    {
      id: 'farewell',
      keywords: ['tchau', 'adeus', 'bye', 'até logo', 'ate logo', 'até mais', 'valeu', 'falou', 'flw'],
      priority: 1
    },
    {
      id: 'thanks',
      keywords: ['obrigado', 'obrigada', 'valeu', 'thanks', 'brigadão', 'brigadao', 'muito obrigado', 'vlw'],
      priority: 1
    },
    {
      id: 'identity',
      keywords: ['quem é você', 'quem e voce', 'o que é você', 'o que voce faz', 'o que é o sentinel', 'o que é sentinel', 'sobre o sistema', 'como funciona', 'seu nome', 'que sistema é esse'],
      priority: 2
    },
    {
      id: 'aoi_zones',
      keywords: ['aoi', 'área de interesse', 'area de interesse', 'zonas', 'perímetro', 'perimetro', 'polígono', 'poligono', 'zonas monitoradas', 'áreas monitoradas'],
      priority: 3
    },
    {
      id: 'api_status',
      keywords: ['api', 'status', 'ping', 'conexão', 'conexao', 'servidor', 'telemetria', 'online', 'latência', 'latencia', 'sistema funcionando'],
      priority: 3
    },
    {
      id: 'risk_security',
      keywords: ['risco', 'crime', 'assalto', 'perigo', 'emergência', 'emergencia', 'alerta', 'segurança', 'seguranca', 'furto', 'roubo', 'ocorrência', 'ocorrencia', 'boletim', 'bo', 'ssp', 'criminalidade', 'violência', 'violencia'],
      priority: 4
    },
    {
      id: 'traffic',
      keywords: ['trânsito', 'transito', 'marginal', 'tráfego', 'trafego', 'carro', 'veículo', 'veiculo', 'congestionamento', 'retenção', 'retencao', 'acidente', 'semáforo', 'semaforo', 'mobilidade'],
      priority: 4
    },
    {
      id: 'weather_climate',
      keywords: ['chuva', 'clima', 'tempo', 'alagamento', 'temperatura', 'umidade', 'vento', 'previsão', 'previsao', 'sol', 'nublado', 'tempestade', 'temporal', 'enchente', 'meteorologia'],
      priority: 4
    },
    {
      id: 'cameras_tech',
      keywords: ['câmera', 'camera', 'ocr', 'placa', 'reconhecimento', 'facial', 'deep learning', 'cnn', 'sensor', 'iot', 'tecnologia', 'inteligência artificial'],
      priority: 3
    },
    {
      id: 'safe_zones',
      keywords: ['seguro', 'segura', 'verde', 'patrulha', 'parque', 'tranquilo', 'calmo', 'melhor bairro', 'bairro seguro'],
      priority: 3
    },
    {
      id: 'neighborhood_query',
      keywords: ['bairro', 'região', 'regiao', 'zona', 'sé', 'se', 'paulista', 'pinheiros', 'lapa', 'moema', 'tatuapé', 'tatupe', 'santana', 'brás', 'bras', 'jardins', 'consolação', 'consolacao', 'vila mariana', 'interlagos', 'faria lima'],
      priority: 5
    },
    {
      id: 'simulation',
      keywords: ['simulação', 'simulacao', 'simular', 'cenário', 'cenario', 'teste', 'lab', 'laboratório', 'laboratorio', 'demo'],
      priority: 3
    },
    {
      id: 'statistics',
      keywords: ['resumo', 'estatística', 'estatistica', 'dados', 'números', 'numeros', 'relatório', 'relatorio', 'geral', 'visão geral', 'overview', 'dashboard'],
      priority: 3
    },
    {
      id: 'help',
      keywords: ['ajuda', 'help', 'comandos', 'o que posso perguntar', 'sugestão', 'sugestao', 'menu', 'opções', 'opcoes'],
      priority: 1
    },
    {
      id: 'emergency',
      keywords: ['emergência', 'emergencia', '190', '192', '193', 'socorro', 'urgente', 'ligar', 'polícia', 'policia', 'bombeiro', 'samu', 'ambulância', 'ambulancia'],
      priority: 10
    },
    {
      id: 'tips',
      keywords: ['dica', 'conselho', 'recomendação', 'recomendacao', 'sugestão de segurança', 'como me proteger', 'cuidados'],
      priority: 3
    }
  ];

  // ══════════════════════════════════════════════
  //  FUNÇÕES UTILITÁRIAS
  // ══════════════════════════════════════════════

  function getTimeString() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getGreetingByTime() {
    const h = new Date().getHours();
    if (h < 6) return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function getTimeContext() {
    const h = new Date().getHours();
    if (h >= 22 || h < 6) return 'night';
    return 'day';
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  function similarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.85;

    // Dice coefficient on bigrams
    function bigrams(s) {
      const bg = new Set();
      for (let i = 0; i < s.length - 1; i++) bg.add(s.substring(i, i + 2));
      return bg;
    }
    const bg1 = bigrams(na);
    const bg2 = bigrams(nb);
    let intersection = 0;
    bg1.forEach(b => { if (bg2.has(b)) intersection++; });
    return bg1.size + bg2.size > 0 ? (2 * intersection) / (bg1.size + bg2.size) : 0;
  }

  // ══════════════════════════════════════════════
  //  DETECTAR INTENÇÃO DO USUÁRIO
  // ══════════════════════════════════════════════

  function detectIntent(query) {
    const normalizedQuery = normalize(query);
    const queryWords = normalizedQuery.split(/\s+/);

    let bestMatch = { id: 'unknown', score: 0, priority: 0 };

    for (const intent of INTENTS) {
      let intentScore = 0;

      for (const keyword of intent.keywords) {
        const normalizedKeyword = normalize(keyword);

        // Exact substring match in the full query
        if (normalizedQuery.includes(normalizedKeyword)) {
          intentScore += normalizedKeyword.split(/\s+/).length * 3; // multi-word keywords score higher
          continue;
        }

        // Fuzzy match per word
        for (const word of queryWords) {
          const sim = similarity(word, normalizedKeyword);
          if (sim > 0.7) {
            intentScore += sim * 2;
          }
        }
      }

      // Apply priority weighting
      intentScore *= (1 + intent.priority * 0.1);

      if (intentScore > bestMatch.score) {
        bestMatch = { id: intent.id, score: intentScore, priority: intent.priority };
      }
    }

    // If score is too low, mark as unknown
    if (bestMatch.score < 1.5) {
      bestMatch.id = 'unknown';
    }

    return bestMatch;
  }

  // Detect which neighborhood the user is asking about
  function detectNeighborhood(query) {
    const q = normalize(query);
    const mappings = {
      'se': 'sé', 'centro': 'sé', 'praca da se': 'sé', 'catedral': 'sé',
      'paulista': 'bela vista', 'bela vista': 'bela vista', 'masp': 'bela vista', 'trianon': 'bela vista',
      'pinheiros': 'pinheiros', 'faria lima': 'pinheiros', 'vila olimpia': 'pinheiros', 'largo da batata': 'pinheiros',
      'lapa': 'lapa', 'marginal tiete': 'lapa', 'tiete': 'lapa',
      'moema': 'moema', 'ibirapuera': 'moema',
      'tatupe': 'tatuapé', 'tatuape': 'tatuapé', 'zona leste': 'tatuapé',
      'santana': 'santana', 'zona norte': 'santana',
      'bras': 'brás', '25 de marco': 'brás',
      'consolacao': 'consolação', 'augusta': 'consolação', 'roosevelt': 'consolação',
      'jardins': 'jardins', 'oscar freire': 'jardins',
      'vila mariana': 'vila mariana',
      'interlagos': 'interlagos', 'zona sul': 'interlagos', 'guarapiranga': 'interlagos'
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (q.includes(key)) return value;
    }
    return null;
  }

  // ══════════════════════════════════════════════
  //  GERADOR DE RESPOSTAS DINÂMICAS
  // ══════════════════════════════════════════════

  async function generateResponse(query) {
    const intent = detectIntent(query);
    const neighborhood = detectNeighborhood(query);

    // Save to memory
    conversationMemory.history.push({ role: 'user', text: query, timestamp: new Date() });
    conversationMemory.questionsAsked++;
    conversationMemory.lastTopic = intent.id;

    // Check if user introduced themselves
    const nameMatch = query.match(/(?:meu nome [eé]|me chamo|sou o|sou a)\s+(\w+)/i);
    if (nameMatch) {
      conversationMemory.userName = nameMatch[1];
    }

    let response = '';

    switch (intent.id) {

      // ── Saudação ──
      case 'greeting': {
        const greeting = getGreetingByTime();
        const nameStr = conversationMemory.userName ? `, ${conversationMemory.userName}` : '';
        const isReturning = conversationMemory.questionsAsked > 1;

        if (isReturning) {
          response = `${greeting}${nameStr}! 😊 Que bom ter você de volta. Sobre o que deseja saber agora? Estou com <strong>${KNOWLEDGE_BASE.about.cameras.toLocaleString('pt-BR')} câmeras</strong> e <strong>${KNOWLEDGE_BASE.about.sensors.toLocaleString('pt-BR')} sensores</strong> operando em tempo real na Grande SP.`;
        } else {
          response = `${greeting}${nameStr}! 👋<br><br>Sou o <strong>Sentinel IA</strong> — o sistema de inteligência preditiva urbana que monitora São Paulo 24 horas por dia.<br><br>Posso te ajudar com:<br>• 🗺️ <strong>Áreas e bairros</strong> monitorados<br>• 🚨 <strong>Riscos e alertas</strong> de segurança<br>• 🚗 <strong>Trânsito</strong> e mobilidade<br>• 🌧️ <strong>Clima</strong> e condições meteorológicas<br>• 🤖 <strong>Tecnologia</strong> das câmeras IA<br>• ⚡ <strong>Simulações</strong> de crise urbana<br><br>O que gostaria de saber?`;
        }
        break;
      }

      // ── Despedida ──
      case 'farewell': {
        const nameStr = conversationMemory.userName ? `, ${conversationMemory.userName}` : '';
        const duration = Math.round((new Date() - conversationMemory.sessionStart) / 60000);
        response = `Até mais${nameStr}! 👋<br><br>Foram <strong>${conversationMemory.questionsAsked}</strong> perguntas em <strong>${duration > 0 ? duration + ' minuto(s)' : 'menos de 1 minuto'}</strong> de sessão. O Sentinel IA continua monitorando São Paulo para você. Fique seguro! 🛡️`;
        break;
      }

      // ── Agradecimento ──
      case 'thanks': {
        const responses = [
          'De nada! 😊 Estou sempre à disposição para manter você informado sobre a segurança de SP.',
          'Por nada! Se precisar de mais informações sobre qualquer bairro ou situação, é só perguntar. 🛡️',
          'Fico feliz em ajudar! Lembre-se que você pode acessar o <strong>Mapa Interativo</strong> para ver a situação em tempo real. 🗺️'
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        break;
      }

      // ── Identidade do Sistema ──
      case 'identity': {
        const kb = KNOWLEDGE_BASE.about;
        response = `🛡️ <strong>${kb.name} v${kb.version}</strong><br><br>${kb.description}<br><br><strong>Módulos Ativos:</strong><br>${kb.modules.map(m => `• ${m}`).join('<br>')}<br><br><strong>Motores de IA:</strong><br>${kb.tech.map(t => `• ${t}`).join('<br>')}<br><br>📊 <strong>Cobertura:</strong> ${kb.coverage}<br>📸 <strong>Câmeras Ativas:</strong> ${kb.cameras.toLocaleString('pt-BR')}<br>📡 <strong>Sensores IoT:</strong> ${kb.sensors.toLocaleString('pt-BR')}`;
        break;
      }

      // ── Zonas AOI ──
      case 'aoi_zones': {
        const zones = window.SentinelAPI ? window.SentinelAPI.aoiZones : KNOWLEDGE_BASE.about.modules;
        if (zones && Array.isArray(zones)) {
          const zoneLines = zones.map(z => {
            const riskColor = z.riskScore >= 80 ? '#ef4444' : z.riskScore >= 50 ? '#f59e0b' : '#10b981';
            return `• <strong style="color:${z.color};">${z.code}</strong> — ${z.name}<br>&nbsp;&nbsp;Risco: <strong style="color:${riskColor};">${z.riskLevel} (${z.riskScore}/100)</strong> • 📸 ${z.activeCameras} Câmeras • 📡 ${z.activeSensors} Sensores<br>&nbsp;&nbsp;<em style="color:#94a3b8;">${z.description}</em>`;
          });
          response = `🗺️ <strong>Áreas de Interesse Geoespacial (AOIs Ativas):</strong><br><br>${zoneLines.join('<br><br>')}<br><br>💡 <em>Visualize os polígonos translúcidos diretamente no <a href="mapa.html" style="color:var(--cyan);">Mapa Interativo</a>!</em>`;
        } else {
          response = '🗺️ O sistema possui 4 AOIs ativas: Alpha (Paulista), Bravo (Sé), Charlie (Faria Lima) e Delta (Marginal Tietê). Acesse o <strong>Mapa</strong> para detalhes visuais.';
        }
        break;
      }

      // ── Status da API / Telemetria ──
      case 'api_status': {
        const telem = window.SentinelAPI ? window.SentinelAPI.fetchSystemTelemetry() : null;
        if (telem) {
          response = `⚡ <strong>Telemetria do Sistema em Tempo Real:</strong><br><br>• <strong>API REST:</strong> <span style="color:#10b981;">● ${telem.apiStatus}</span><br>• <strong>Banco de Dados:</strong> ${telem.databaseStatus}<br>• <strong>Latência:</strong> ${telem.latency}<br>• <strong>Throughput:</strong> ${telem.throughput}<br>• <strong>Modelos IA Ativos:</strong> ${telem.activeModels} (CNN, LSTM, Transformers, Autoencoders)<br>• <strong>Frames Processados Hoje:</strong> ${telem.processedFramesToday}+<br>• <strong>Alertas Ativos:</strong> ${telem.activeAlertsCount}<br>• <strong>Índice Global de Segurança:</strong> ${telem.securityIndex}`;
        } else {
          response = '⚡ Todos os sistemas operacionais. API REST: 200 OK, Latência: ~14ms, 4 modelos de IA ativos.';
        }
        break;
      }

      // ── Segurança / Risco / Crime ──
      case 'risk_security': {
        // Check if asking about a specific neighborhood
        if (neighborhood && KNOWLEDGE_BASE.neighborhoods[neighborhood]) {
          const nb = KNOWLEDGE_BASE.neighborhoods[neighborhood];
          const riskColor = nb.riskScore >= 80 ? '#ef4444' : nb.riskScore >= 50 ? '#f59e0b' : '#10b981';
          response = `🚨 <strong>Relatório de Segurança — ${nb.name}:</strong><br><br>• <strong>Nível de Risco:</strong> <span style="color:${riskColor}; font-weight:700;">${nb.risk} (${nb.riskScore}/100)</span><br>• <strong>Caracterização:</strong> ${nb.highlights}<br>• <strong>Policiamento:</strong> ${nb.patrol}<br><br>`;

          // Add relevant crime type info
          const q = normalize(query);
          for (const [type, data] of Object.entries(KNOWLEDGE_BASE.crimeTypes)) {
            if (q.includes(normalize(type))) {
              response += `📋 <strong>${data.description}:</strong><br>• Tendência: ${data.trend}<br>• Pontos Críticos: ${data.hotspots}`;
              break;
            }
          }
        } else {
          // General risk overview
          const telem = window.SentinelAPI ? window.SentinelAPI.fetchSystemTelemetry() : null;
          const activeAlerts = telem ? telem.activeAlertsCount : 23;
          const secIndex = telem ? telem.securityIndex : '87.4%';

          response = `🚨 <strong>Relatório de Segurança Urbana em Tempo Real:</strong><br><br>• <strong>Alertas Prioritários Ativos:</strong> ${activeAlerts} ocorrências sob monitoramento<br>• <strong>Índice de Segurança Global:</strong> ${secIndex}<br><br><strong>Zonas de Maior Atenção:</strong><br>• 🔴 <strong>Sé / Centro:</strong> Risco Crítico (92/100) — Alta incidência de furtos<br>• 🟠 <strong>Marginal Tietê / Lapa:</strong> Risco Alto (81/100) — Acidentes e alagamentos<br>• 🟠 <strong>Brás:</strong> Risco Alto (78/100) — Alta densidade comercial<br><br><strong>Zonas Mais Seguras:</strong><br>• 🟢 Jardins (15/100) • Moema (18/100) • Vila Mariana (22/100) • Pinheiros (24/100)<br><br>💡 <em>Pergunte sobre um bairro específico para um relatório detalhado!</em>`;
        }
        break;
      }

      // ── Trânsito ──
      case 'traffic': {
        const h = new Date().getHours();
        const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
        const peakStatus = isPeak ? '<span style="color:#ef4444;">⚠️ HORÁRIO DE PICO — Congestionamento Elevado</span>' : '<span style="color:#10b981;">✅ Fluxo moderado — Fora do horário de pico</span>';

        response = `🚗 <strong>Mobilidade Urbana — São Paulo (${getTimeString()}):</strong><br><br>${peakStatus}<br><br>• <strong>Av. Paulista:</strong> ${isPeak ? 'Retenção moderada próx. Consolação e MASP' : 'Fluxo livre em ambos os sentidos'}<br>• <strong>Marginal Tietê:</strong> ${isPeak ? 'Congestionamento intenso — Ponte da Lapa até Ponte das Bandeiras' : 'Tráfego moderado nas pistas expressas'}<br>• <strong>Marginal Pinheiros:</strong> ${isPeak ? 'Retenção severa — Ponte Estaiada até Santo Amaro' : 'Sem retenções significativas'}<br>• <strong>Av. Faria Lima:</strong> ${isPeak ? 'Lentidão nos cruzamentos com Rebouças e JK' : 'Tráfego fluindo normalmente'}<br>• <strong>Radial Leste:</strong> ${isPeak ? 'Congestionamento — Tatuapé até Bresser' : 'Fluxo regular'}<br><br>⏱️ <strong>Tempo extra estimado:</strong> ${isPeak ? '15–25 minutos nos corredores principais' : '5–8 minutos acima do normal'}<br><br>💡 <em>Recomendação: ${isPeak ? 'Utilize transporte sobre trilhos (Metrô/CPTM) ou rotas alternativas via Waze/Google Maps.' : 'Bom momento para deslocamento por vias expressas.'}</em>`;
        break;
      }

      // ── Clima e Meteorologia ──
      case 'weather_climate': {
        let weatherData = null;
        if (window.SentinelAPI && window.SentinelAPI.fetchLiveWeather) {
          try {
            weatherData = await window.SentinelAPI.fetchLiveWeather();
          } catch (e) { /* fallback below */ }
        }

        const temp = weatherData ? weatherData.temp : '25°C';
        const wind = weatherData ? weatherData.windspeed : '12 km/h';
        const isDay = weatherData ? weatherData.isDay : (new Date().getHours() >= 6 && new Date().getHours() < 18);

        const h = new Date().getHours();
        const month = new Date().getMonth(); // 0-indexed
        const isRainySeason = month >= 9 || month <= 2; // outubro a março

        response = `🌤️ <strong>Monitoramento Climático — São Paulo (${getTimeString()}):</strong><br><br>• <strong>Temperatura Atual:</strong> ${temp}<br>• <strong>Vento:</strong> ${wind}<br>• <strong>Período:</strong> ${isDay ? '☀️ Diurno' : '🌙 Noturno'}<br>• <strong>Temporada:</strong> ${isRainySeason ? '🌧️ Época de Chuvas (outubro–março) — Atenção redobrada' : '☀️ Época Seca — Risco pluviométrico baixo'}<br><br><strong>Áreas de Risco Hidrológico:</strong><br>• Marginal Tietê (Lapa / Barra Funda) — Nível monitorado por 18 sensores<br>• Córrego Anhaia Mello (Mooca) — Sensores de vazão ativos<br>• Represa Guarapiranga (Interlagos) — Nível estável<br><br>`;

        if (isRainySeason) {
          response += `⚠️ <strong>Dicas para Período de Chuvas:</strong><br>${KNOWLEDGE_BASE.safetyTips.rain.map(t => `• ${t}`).join('<br>')}`;
        } else {
          response += `💡 <em>Os ${KNOWLEDGE_BASE.about.sensors.toLocaleString('pt-BR')} sensores IoT estão operando com 100% de precisão para detecção meteorológica em tempo real.</em>`;
        }
        break;
      }

      // ── Câmeras e Tecnologia ──
      case 'cameras_tech': {
        response = `🤖 <strong>Tecnologia de Vigilância Inteligente:</strong><br><br><strong>Câmeras com IA (OCR + Deep Learning):</strong><br>• <strong>Total Ativo:</strong> ${KNOWLEDGE_BASE.about.cameras.toLocaleString('pt-BR')} câmeras analíticas<br>• <strong>Cobertura:</strong> ${KNOWLEDGE_BASE.about.coverage}<br>• <strong>Tempo de Reconhecimento:</strong> &lt; 1.2 segundos por frame<br><br><strong>Funcionalidades:</strong><br>• 🔍 <strong>Leitura OCR de Placas:</strong> Identifica veículos com restrição em tempo real<br>• 👤 <strong>Detecção de Anomalias:</strong> Identifica aglomerações atípicas e comportamentos suspeitos<br>• 🚗 <strong>Contagem de Tráfego:</strong> Estimativa de fluxo veicular por faixa<br>• 🔥 <strong>Detecção de Incidentes:</strong> Acidentes, incêndios e objetos abandonados<br><br><strong>Modelos de IA em Produção:</strong><br>${KNOWLEDGE_BASE.about.tech.map(t => `• ${t}`).join('<br>')}<br><br><strong>Principais Locais Monitorados:</strong><br>• Av. Paulista (84 câmeras) • Sé / Centro (120 câmeras)<br>• Faria Lima (96 câmeras) • Marginal Tietê (64 câmeras)`;
        break;
      }

      // ── Zonas Seguras ──
      case 'safe_zones': {
        const safeNbs = Object.entries(KNOWLEDGE_BASE.neighborhoods)
          .filter(([, v]) => v.riskScore <= 30)
          .sort((a, b) => a[1].riskScore - b[1].riskScore);

        const safeLines = safeNbs.map(([, v]) => `• 🟢 <strong>${v.name}:</strong> Risco ${v.riskScore}/100 — ${v.highlights}`);

        response = `🛡️ <strong>Zonas Verificadas com Alta Segurança:</strong><br><br>${safeLines.join('<br><br>')}<br><br><strong>Informação Operacional:</strong><br>• Todas as zonas verdes possuem patrulhamento preventivo ativo da Guarda Urbana e PM.<br>• Última verificação sem anomalias: ${new Date().toLocaleTimeString('pt-BR')}<br>• Status de câmeras nas regiões verdes: <span style="color:#10b981;">100% operacional</span>`;
        break;
      }

      // ── Consulta de Bairro Específico ──
      case 'neighborhood_query': {
        if (neighborhood && KNOWLEDGE_BASE.neighborhoods[neighborhood]) {
          const nb = KNOWLEDGE_BASE.neighborhoods[neighborhood];
          const riskColor = nb.riskScore >= 80 ? '#ef4444' : nb.riskScore >= 50 ? '#f59e0b' : '#10b981';
          const riskEmoji = nb.riskScore >= 80 ? '🔴' : nb.riskScore >= 50 ? '🟡' : '🟢';

          response = `📍 <strong>Perfil Geoespacial — ${nb.name}:</strong><br><br>${riskEmoji} <strong>Nível de Risco:</strong> <span style="color:${riskColor}; font-weight:700;">${nb.risk} (${nb.riskScore}/100)</span><br><br>• <strong>Destaques:</strong> ${nb.highlights}<br>• <strong>Monitoramento:</strong> ${nb.patrol}<br><br>`;

          // Add contextual tips
          if (nb.riskScore >= 70) {
            response += `⚠️ <strong>Recomendação da IA:</strong> Região com risco elevado. ${getTimeContext() === 'night' ? 'Evite deslocamentos desnecessários no período noturno.' : 'Mantenha atenção redobrada e utilize vias principais.'}<br>`;
          } else {
            response += `✅ <strong>Recomendação da IA:</strong> Região com bons índices de segurança. Monitoramento preventivo em operação contínua.<br>`;
          }

          response += `<br>💡 <em>Deseja saber sobre trânsito, clima ou comparar com outro bairro? É só perguntar!</em>`;
        } else {
          response = `📍 Não encontrei dados específicos sobre essa região. Posso te informar sobre: <strong>Sé, Bela Vista/Paulista, Pinheiros, Lapa, Moema, Tatuapé, Santana, Brás, Consolação, Jardins, Vila Mariana</strong> e <strong>Interlagos</strong>.`;
        }
        break;
      }

      // ── Simulação ──
      case 'simulation': {
        response = `⚡ <strong>Laboratório de Simulação Urbana:</strong><br><br>O módulo de <strong>Simulações</strong> permite testar cenários de crise em São Paulo antes que eles aconteçam.<br><br><strong>Cenários Disponíveis:</strong><br>• ⛈️ Tempestade na Marginal Tietê<br>• 🚨 Arrastão no Centro Histórico<br>• 👥 Bloqueio na Av. Paulista<br>• 🚦 Pane semafórica em Pinheiros<br><br>Você também pode <strong>criar eventos personalizados</strong> clicando diretamente no mapa para selecionar o local.<br><br>👉 <a href="simulacoes.html" style="color:var(--cyan); text-decoration:underline;">Acessar Laboratório de Simulações</a>`;
        break;
      }

      // ── Estatísticas / Resumo ──
      case 'statistics': {
        const telem = window.SentinelAPI ? window.SentinelAPI.fetchSystemTelemetry() : null;
        const zones = window.SentinelAPI ? window.SentinelAPI.aoiZones : [];
        const totalCameras = zones.reduce((s, z) => s + z.activeCameras, 0);
        const totalSensors = zones.reduce((s, z) => s + z.activeSensors, 0);

        response = `📊 <strong>Painel Estatístico — Sentinel IA (${new Date().toLocaleDateString('pt-BR')}):</strong><br><br>• <strong>Alertas Ativos:</strong> ${telem ? telem.activeAlertsCount : 23} ocorrências monitoradas<br>• <strong>Índice de Segurança:</strong> ${telem ? telem.securityIndex : '87.4%'}<br>• <strong>AOIs Ativas:</strong> ${zones.length} zonas geoespaciais<br>• <strong>Câmeras IA:</strong> ${totalCameras} nas AOIs (${KNOWLEDGE_BASE.about.cameras} no total)<br>• <strong>Sensores IoT:</strong> ${totalSensors} nas AOIs (${KNOWLEDGE_BASE.about.sensors} no total)<br>• <strong>Frames IA Processados:</strong> ${telem ? telem.processedFramesToday : '2.415.800'}+<br>• <strong>Latência API:</strong> ${telem ? telem.latency : '14ms'}<br>• <strong>Modelos de IA:</strong> ${telem ? telem.activeModels : 4} em produção<br><br>💡 <em>Acesse o <a href="dashboard.html" style="color:var(--cyan);">Dashboard</a> para gráficos e visão geral completa.</em>`;
        break;
      }

      // ── Emergência ──
      case 'emergency': {
        response = `🚨 <strong>NÚMEROS DE EMERGÊNCIA — SÃO PAULO:</strong><br><br>• <strong style="font-size:1.1rem; color:#ef4444;">190</strong> — Polícia Militar (PM)<br>• <strong style="font-size:1.1rem; color:#ef4444;">193</strong> — Corpo de Bombeiros<br>• <strong style="font-size:1.1rem; color:#ef4444;">192</strong> — SAMU (Ambulância)<br>• <strong style="font-size:1.1rem; color:#ef4444;">199</strong> — Defesa Civil<br>• <strong style="font-size:1.1rem; color:#ef4444;">153</strong> — Guarda Civil Metropolitana (GCM)<br>• <strong style="font-size:1.1rem; color:#ef4444;">156</strong> — SP156 (Prefeitura)<br><br>⚠️ <strong>Em caso de risco imediato, ligue agora para o número adequado.</strong><br><br>O Sentinel IA é um sistema de monitoramento e <strong>não substitui</strong> o atendimento emergencial das autoridades.`;
        break;
      }

      // ── Dicas de Segurança ──
      case 'tips': {
        const isNight = getTimeContext() === 'night';
        const tips = isNight ? KNOWLEDGE_BASE.safetyTips.night : KNOWLEDGE_BASE.safetyTips.general;
        const timeLabel = isNight ? 'Período Noturno' : 'Dicas Gerais';

        response = `🛡️ <strong>Recomendações de Segurança — ${timeLabel}:</strong><br><br>${tips.map(t => `• ${t}`).join('<br><br>')}<br><br><strong>Números Úteis:</strong><br>• 190 (PM) • 193 (Bombeiros) • 192 (SAMU)<br><br>💡 <em>Dica: Pergunte sobre um bairro específico para recomendações personalizadas!</em>`;
        break;
      }

      // ── Ajuda ──
      case 'help': {
        response = `💡 <strong>O que posso responder:</strong><br><br>📍 <strong>Bairros:</strong> "Como está a segurança na Sé?" / "Me fale sobre Pinheiros"<br>🚨 <strong>Segurança:</strong> "Quais são os riscos agora?" / "Onde tem mais crime?"<br>🚗 <strong>Trânsito:</strong> "Como está o trânsito na Paulista?" / "Marginal parada?"<br>🌧️ <strong>Clima:</strong> "Vai chover?" / "Qual a temperatura?"<br>🤖 <strong>Tecnologia:</strong> "Como funcionam as câmeras?" / "O que é OCR?"<br>🗺️ <strong>AOIs:</strong> "Quais as áreas monitoradas?"<br>⚡ <strong>Sistema:</strong> "Status da API" / "Quantos sensores ativos?"<br>⚡ <strong>Simulações:</strong> "Como simular um cenário?"<br>🚨 <strong>Emergência:</strong> "Números de emergência"<br>🛡️ <strong>Dicas:</strong> "Dicas de segurança"<br><br>Você também pode perguntar de forma natural! Ex: <em>"Está perigoso andar pela Sé à noite?"</em>`;
        break;
      }

      // ── Resposta Desconhecida (Inteligente) ──
      case 'unknown':
      default: {
        // Try to provide context-aware fallback
        const q = normalize(query);

        // Check if it's a compound question that partially matches
        let partialResponse = null;
        if (neighborhood && KNOWLEDGE_BASE.neighborhoods[neighborhood]) {
          const nb = KNOWLEDGE_BASE.neighborhoods[neighborhood];
          const riskColor = nb.riskScore >= 80 ? '#ef4444' : nb.riskScore >= 50 ? '#f59e0b' : '#10b981';
          partialResponse = `Entendi que você perguntou sobre <strong>${nb.name}</strong>. Aqui está o que sei:<br><br>• Risco: <span style="color:${riskColor};">${nb.risk} (${nb.riskScore}/100)</span><br>• ${nb.highlights}<br>• ${nb.patrol}`;
        }

        if (partialResponse) {
          response = `📍 ${partialResponse}<br><br>💡 <em>Posso detalhar mais sobre segurança, trânsito ou clima nessa região!</em>`;
        } else {
          // Context-aware fallback
          const lastTopic = conversationMemory.lastTopic;
          const suggestionsMap = {
            'risk_security': 'Quer que eu detalhe a segurança de algum bairro específico?',
            'traffic': 'Posso verificar o trânsito em outra via se preferir.',
            'weather_climate': 'Deseja saber sobre risco de alagamento em alguma região?'
          };
          const followUp = suggestionsMap[lastTopic] || '';

          response = `💡 <strong>Sentinel IA:</strong><br><br>Recebi sua pergunta: <em>"${query}"</em><br><br>Embora eu não tenha uma resposta exata para essa formulação, posso te ajudar com informações sobre:<br><br>• 📍 Segurança de bairros de SP<br>• 🚗 Condições de trânsito<br>• 🌧️ Clima e meteorologia<br>• 🤖 Câmeras e sensores IA<br>• 🗺️ Zonas de monitoramento<br>• 🚨 Números de emergência<br><br>${followUp ? followUp + '<br><br>' : ''}💡 <em>Tente reformular ou pergunte "ajuda" para ver exemplos!</em>`;
        }
        break;
      }
    }

    // Save bot response to memory
    conversationMemory.history.push({ role: 'bot', text: response, timestamp: new Date() });

    return response;
  }

  // ══════════════════════════════════════════════
  //  INJETAR DOM DO CHATBOT
  // ══════════════════════════════════════════════

  function injectChatbotDOM() {
    if (document.getElementById('aiChatLauncher')) return;

    // Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'aiChatLauncher';
    launcher.className = 'ai-chat-launcher';
    launcher.setAttribute('aria-label', 'Abrir Assistente de IA');
    launcher.innerHTML = `
      <i data-lucide="bot" style="width:24px;height:24px;"></i>
      <span class="ai-chat-launcher-badge"></span>
    `;

    // Drawer / Window
    const drawer = document.createElement('div');
    drawer.id = 'aiChatDrawer';
    drawer.className = 'ai-chat-drawer';
    drawer.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-title">
          <div class="ai-avatar-icon">
            <i data-lucide="sparkles" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <h4>Sentinel IA Assistant</h4>
            <span><span class="live-dot" style="width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block;animation:live-pulse 1.5s ease-in-out infinite;"></span> IA Conectada • NLP v2.0</span>
          </div>
        </div>
        <button class="btn-icon" id="aiChatClose" style="width:28px;height:28px;background:transparent;border:none;color:#aaa;cursor:pointer;">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </button>
      </div>

      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg-row bot">
          <div class="ai-msg-bubble">
            👋 ${getGreetingByTime()}! Sou o assistente de inteligência artificial do <strong>Sentinel IA</strong>.<br><br>
            Agora com <strong>NLP avançado</strong> — entendo perguntas naturais sobre <strong>segurança, trânsito, clima, bairros e tecnologia</strong> em São Paulo.<br><br>
            Experimente perguntar algo como: <em>"Como está a segurança na Sé agora?"</em>
          </div>
        </div>
      </div>

      <div class="ai-prompt-chips" id="aiPromptChips">
        <button class="ai-chip-btn" data-prompt="Quais são as Áreas de Interesse (AOIs) no mapa?">🗺️ AOIs Ativas</button>
        <button class="ai-chip-btn" data-prompt="Como está a segurança na Sé agora?">🚨 Segurança na Sé</button>
        <button class="ai-chip-btn" data-prompt="Como está o trânsito nas Marginais?">🚗 Trânsito SP</button>
        <button class="ai-chip-btn" data-prompt="Qual a temperatura e previsão de chuva?">🌧️ Clima Agora</button>
        <button class="ai-chip-btn" data-prompt="Quais bairros são mais seguros?">🛡️ Zonas Seguras</button>
        <button class="ai-chip-btn" data-prompt="Como funcionam as câmeras de IA?">🤖 Câmeras IA</button>
        <button class="ai-chip-btn" data-prompt="Números de emergência">🆘 Emergência</button>
        <button class="ai-chip-btn" data-prompt="Como simular um cenário de crise?">⚡ Simulações</button>
      </div>

      <div class="ai-chat-footer">
        <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Pergunte qualquer coisa sobre SP..." autocomplete="off" />
        <button id="aiChatSend" class="ai-chat-send-btn" aria-label="Enviar Pergunta">
          <i data-lucide="send" style="width:16px;height:16px;"></i>
        </button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // ══════════════════════════════════════════════
  //  ENVIAR MENSAGEM COM EFEITO TYPEWRITER
  // ══════════════════════════════════════════════

  async function sendMessage(text) {
    if (!text.trim()) return;

    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

    // Disable input while processing
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Append User Message
    const userRow = document.createElement('div');
    userRow.className = 'ai-msg-row user';
    userRow.innerHTML = `
      <div class="ai-msg-bubble">
        ${escapeHTML(text)}
        <div class="ai-msg-time">${getTimeString()}</div>
      </div>
    `;
    chatBody.appendChild(userRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Show typing indicator
    const typingRow = document.createElement('div');
    typingRow.className = 'ai-msg-row bot';
    typingRow.id = 'aiTypingIndicator';
    typingRow.innerHTML = `
      <div class="ai-msg-bubble" style="padding:6px 12px;">
        <div class="ai-typing-indicator">
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
        </div>
      </div>
    `;
    chatBody.appendChild(typingRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Generate response (may be async for weather API calls)
    const aiText = await generateResponse(text);

    // Calculate typing delay based on response length (feels more natural)
    const baseDelay = 600;
    const lengthDelay = Math.min(aiText.length * 0.8, 1200);
    const totalDelay = baseDelay + lengthDelay;

    setTimeout(() => {
      typingRow.remove();

      const botRow = document.createElement('div');
      botRow.className = 'ai-msg-row bot';
      botRow.innerHTML = `
        <div class="ai-msg-bubble">
          ${aiText}
          <div class="ai-msg-time">${getTimeString()} • Sentinel IA v2.0</div>
        </div>
      `;
      chatBody.appendChild(botRow);
      chatBody.scrollTop = chatBody.scrollHeight;

      // Re-enable input
      if (input) { input.disabled = false; input.focus(); }
      if (sendBtn) sendBtn.disabled = false;

      if (window.lucide) lucide.createIcons();
    }, totalDelay);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════
  //  BIND DE EVENTOS
  // ══════════════════════════════════════════════

  function initChatbotEvents() {
    injectChatbotDOM();

    const launcher = document.getElementById('aiChatLauncher');
    const drawer = document.getElementById('aiChatDrawer');
    const closeBtn = document.getElementById('aiChatClose');
    const sendBtn = document.getElementById('aiChatSend');
    const input = document.getElementById('aiChatInput');
    const chips = document.querySelectorAll('.ai-chip-btn');

    if (launcher && drawer) {
      launcher.addEventListener('click', function () {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open') && input) {
          input.focus();
        }
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', function () {
        drawer.classList.remove('open');
      });
    }

    if (sendBtn && input) {
      sendBtn.addEventListener('click', function () {
        const val = input.value;
        input.value = '';
        sendMessage(val);
      });

      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          const val = input.value;
          input.value = '';
          sendMessage(val);
        }
      });
    }

    // Prompt Chip Events
    chips.forEach(chip => {
      chip.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) {
          sendMessage(prompt);
        }
      });
    });

    // Keyboard shortcut: Ctrl+K or Cmd+K to toggle chat
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (drawer) {
          drawer.classList.toggle('open');
          if (drawer.classList.contains('open') && input) {
            input.focus();
          }
        }
      }
      // Escape to close
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
    });
  }

  // ══════════════════════════════════════════════
  //  INICIALIZAÇÃO
  // ══════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbotEvents);
  } else {
    initChatbotEvents();
  }

})();
