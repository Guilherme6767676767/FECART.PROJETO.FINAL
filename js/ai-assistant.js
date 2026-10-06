/* ============================================
   SENTINEL IA — Assistente Virtual Inteligente v3.0
   Integração com Backend FastAPI (/api/v1/chat),
   Modelos LLM (RAG com Telemetria Viva),
   Execução de Ações Táticas no Frontend e NLP Local
   ============================================ */

(function () {
  'use strict';

  const BACKEND_URL = window.SENTINEL_BACKEND_URL || 'http://localhost:8000';

  // ══════════════════════════════════════════════
  //  MEMÓRIA CONVERSACIONAL
  // ══════════════════════════════════════════════
  const conversationMemory = {
    history: [],       // { role: 'user'|'assistant', content: string }
    lastTopic: null,
    userName: null,
    questionsAsked: 0,
    sessionStart: new Date()
  };

  // ══════════════════════════════════════════════
  //  BASE DE CONHECIMENTO LOCAL (FALLBACK SE BACKEND OFFLINE)
  // ══════════════════════════════════════════════
  const KNOWLEDGE_BASE = {
    about: {
      name: 'Sentinel IA',
      version: '3.3.0',
      description: 'Sistema de Inteligência Preditiva Urbana para a cidade de São Paulo, integrando segurança, mobilidade, clima e infraestrutura.',
      modules: ['Dashboard de Controle', 'Mapa Geoespacial Interativo', 'Análise Preditiva com IA', 'Central de Alertas', 'Laboratório de Simulação Urbana'],
      cameras: 1847,
      sensors: 3421
    },
    neighborhoods: {
      'sé': { name: 'Sé / Centro Histórico', risk: 'CRÍTICO', riskScore: 92, highlights: 'Catedral da Sé, Pátio do Colégio. Alta incidência de furtos e aglomerações.', patrol: 'Patrulhamento 24h com apoio de 120 câmeras IA.' },
      'bela vista': { name: 'Bela Vista / Av. Paulista', risk: 'MÉDIO', riskScore: 68, highlights: 'MASP, Parque Trianon. Corredor financeiro com fluxo intenso.', patrol: '84 câmeras de reconhecimento facial ativas na Av. Paulista.' },
      'pinheiros': { name: 'Pinheiros / Faria Lima', risk: 'BAIXO', riskScore: 24, highlights: 'Polo tecnológico e corporativo. Beco do Batman, Largo da Batata.', patrol: '96 câmeras OCR de leitura de placas e 530 sensores IoT ativos.' },
      'lapa': { name: 'Lapa / Marginal Tietê', risk: 'ALTO', riskScore: 81, highlights: 'Via expressa de tráfego pesado. Risco de alagamento e acidentes.', patrol: '64 câmeras e 289 sensores monitoram tráfego e nível hidrológico.' },
      'moema': { name: 'Moema / Ibirapuera', risk: 'BAIXO', riskScore: 18, highlights: 'Parque Ibirapuera, região residencial premium. Segurança elevada.', patrol: 'Rondas preventivas da Guarda Urbana.' }
    }
  };

  // ══════════════════════════════════════════════
  //  EXECUTOR DE AÇÕES TÁTICAS NO FRONTEND
  // ══════════════════════════════════════════════
  function executeActions(actions) {
    if (!actions || !Array.isArray(actions) || actions.length === 0) return;

    actions.forEach(action => {
      console.log('⚡ Executando Ação Tática do Chatbot:', action);

      // 1. Navegação de Página
      if (action.type === 'navigate' && action.target) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== action.target) {
          showActionNotification(`🚀 Navegando para ${action.target.replace('.html', '').toUpperCase()}...`);
          setTimeout(() => {
            window.location.href = action.target;
          }, 1200);
        }
      }

      // 2. Disparar Cenário de Simulação (se estiver em simulacoes.html ou simular globalmente)
      if (action.type === 'simulate_scenario' && action.target) {
        showActionNotification(`⚡ Disparando cenário: ${action.payload?.nome || action.target}`);
        
        if (typeof window.triggerScenario === 'function') {
          window.triggerScenario(action.target);
        } else {
          // Se não estiver na página de simulação, pode salvar no sessionStorage ou redirecionar
          sessionStorage.setItem('pending_scenario', action.target);
          showActionNotification(`📍 Redirecionando para o Laboratório de Simulação...`);
          setTimeout(() => {
            window.location.href = 'simulacoes.html';
          }, 1400);
        }
      }

      // 3. Destacar Bairro / AOI no Mapa
      if (action.type === 'highlight_aoi' && action.payload) {
        const { lat, lng, bairro } = action.payload;
        showActionNotification(`🎯 Focando no mapa: ${bairro || action.target}`);
        
        // Se o mapa do Leaflet existir globalmente
        if (window.SentinelMapaAPI?.mapa && typeof window.SentinelMapaAPI.mapa.flyTo === 'function') {
          window.SentinelMapaAPI.mapa.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
        } else if (window.map && typeof window.map.panTo === 'function') {
          window.map.panTo([lat, lng], { animate: true, duration: 1.5 });
        } else if (typeof window.setSimulationPin === 'function') {
          window.setSimulationPin(lat, lng);
        }
      }
    });
  }

  function showActionNotification(text) {
    const toast = document.createElement('div');
    toast.className = 'ai-action-toast';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(6, 10, 20, 0.95);
      border: 1px solid #00e5ff;
      color: #00e5ff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 229, 255, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.3s ease;
    `;
    toast.innerHTML = `<span>⚡</span> ${text}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  const OUT_OF_SCOPE_MSG = "Desculpe, sou o assistente virtual do Sentinel IA e só posso responder a perguntas relacionadas às funcionalidades, relatórios e dados da nossa plataforma de inteligência preditiva urbana.";

  function isSentinelScope(text) {
    const q = text.toLowerCase().trim();
    const longKeywords = [
      "sentinel", "plataforma", "sistema", "dashboard", "painel",
      "mapa", "analise", "análise", "alerta", "alertas", "simulac", "simulaç", "cenario", "cenário",
      "relatorio", "relatório", "funcionalidade", "login", "cadastro", "usuario", "usuário", "admin",
      "são paulo", "sao paulo", "bairro", "perimetro", "perímetro",
      "cidade", "cidades", "municipio", "município", "local", "locais", "quantas", "quantos", "quando", "mais recente", "mais comum", "distribuicao", "distribuição",
      "paulista", "bela vista", "pinheiros", "faria lima", "lapa", "marginal",
      "tietê", "tiete", "moema", "ibirapuera", "jardins", "santana", "tatuape", "tatuapé",
      "boletim", "boletins", "ocorrencia", "ocorrência", "crime", "furto", "roubo",
      "seguranca", "segurança", "risco", "policia", "polícia", "viatura", "patrulha",
      "transito", "trânsito", "semaforo", "semáforo",
      "clima", "chuva", "tempo", "temperatura", "umidade", "vento", "precipitacao", "precipitação",
      "alagamento", "enchente", "inundacao", "inundação", "pluviometro", "pluviômetro",
      "defesa civil", "samu", "bombeiro", "emergencia", "emergência",
      "camera", "câmera", "sensor", "telemetria", "preditiv", "estatistica", "estatística",
      "bom dia", "boa tarde", "boa noite", "quem é você", "quem e voce",
      "o que você faz", "o que voce faz", "comandos", "como funciona",
      "como usar"
    ];
    if (longKeywords.some(k => q.includes(k))) return true;

    const shortRegexes = [
      /\bia\b/i, /\bsp\b/i, /\bbo\b/i, /\bbos\b/i, /\baoi\b/i, /\baois\b/i, /\bsé\b/i,
      /\bzona\b/i, /\bzonas\b/i, /\bssp\b/i, /\bpm\b/i, /\bgcm\b/i, /\bcet\b/i,
      /\biot\b/i, /\bocr\b/i, /\bdados\b/i, /\bola\b/i, /\bolá\b/i, /\boi\b/i,
      /\bajuda\b/i, /\bstatus\b/i, /\bversao\b/i, /\bversão\b/i, /\bmapas\b/i,
      /\babrir\b/i, /\bmostrar\b/i, /\bsimular\b/i, /\bsimule\b/i
    ];
    return shortRegexes.some(rx => rx.test(q));
  }

  // ══════════════════════════════════════════════
  //  MOTOR CENTRAL: BACKEND FASTAPI OU NLP LOCAL
  // ══════════════════════════════════════════════
  async function queryChatEngine(userMessage) {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Verificação de escopo estrito prévia
    if (!isSentinelScope(userMessage)) {
      return {
        text: OUT_OF_SCOPE_MSG,
        model: 'Sentinel Scope Guard'
      };
    }

    // Perguntas objetivas sobre a base são respondidas localmente para não
    // depender do backend e nem receber uma resposta genérica do modelo.
    const dataResponse = getDeterministicDataResponse(userMessage);
    if (dataResponse) return dataResponse;

    // 1. Tenta chamar o Endpoint do Backend FastAPI (/api/v1/chat)
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          history: conversationMemory.history.slice(-6),
          current_page: currentPage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Executar ações se houver
        if (data.actions && data.actions.length > 0) {
          executeActions(data.actions);
        }

        // Atualizar chips se sugerido
        if (data.suggestions && data.suggestions.length > 0) {
          updatePromptChips(data.suggestions);
        }

        return {
          text: formatMarkdownToHTML(data.response),
          model: data.model_used || 'Sentinel Backend AI'
        };
      }
    } catch (err) {
      console.warn('Backend FastAPI indisponível, usando motor neural local Sentinel:', err);
    } finally {
      window.clearTimeout(timeout);
    }

    // 2. Fallback Especializado: Motor NLP Local com Detecção de Ações
    return generateLocalResponseWithActions(userMessage);
  }

  function getLiveSummary() {
    const data = Array.isArray(window.SentinelAlertas?.dados) ? window.SentinelAlertas.dados : [];
    const counts = data.reduce((acc, item) => { acc[item.gravidade] = (acc[item.gravidade] || 0) + 1; return acc; }, {});
    const toDate = value => { const [day, month, year] = String(value || '').split('/'); return new Date(`${year}-${month}-${day}T00:00:00`); };
    const latest = data.slice().sort((a, b) => toDate(b.data) - toDate(a.data))[0];
    return { total: data.length, critical: counts['crítico'] || 0, medium: counts['médio'] || 0, low: counts.baixo || 0, latest };
  }

  function normalizeQuery(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function requestedSeverity(query) {
    const q = normalizeQuery(query);
    if (/\b(crit\w*|grave\w*|alta\w*)/.test(q)) return { key: 'critical', label: 'críticas' };
    if (/\b(medi\w*|moderad\w*)/.test(q)) return { key: 'medium', label: 'médias' };
    if (/\b(baix\w*|leve\w*)/.test(q)) return { key: 'low', label: 'baixas' };
    return null;
  }

  const MUNICIPALITIES = {
    'sao paulo': 'São Paulo',
    'bom sucesso de itarare': 'Bom Sucesso de Itararé',
    carapicuiba: 'Carapicuíba', penapolis: 'Penápolis', campinas: 'Campinas',
    marilia: 'Marília', jundiai: 'Jundiaí', ourinhos: 'Ourinhos',
    'ribeirao preto': 'Ribeirão Preto', 'santa barbara d\'oeste': 'Santa Bárbara d\'Oeste',
    'sao jose do rio preto': 'São José do Rio Preto', sarapui: 'Sarapuí',
    capivari: 'Capivari', joanopolis: 'Joanópolis', vargem: 'Vargem',
    itaquaquecetuba: 'Itaquaquecetuba', 'sao jose dos campos': 'São José dos Campos',
    aracatuba: 'Araçatuba', botucatu: 'Botucatu', araras: 'Araras',
    'sao vicente': 'São Vicente', araraquara: 'Araraquara', 'embu das artes': 'Embu das Artes',
    jandira: 'Jandira', 'mogi das cruzes': 'Mogi das Cruzes',
    'sao bernardo do campo': 'São Bernardo do Campo', santos: 'Santos',
    'santo andre': 'Santo André', osasco: 'Osasco', guarulhos: 'Guarulhos',
    maua: 'Mauá', tatui: 'Tatuí', 'dois corregos': 'Dois Córregos', iaras: 'Iaras',
    pindamonhangaba: 'Pindamonhangaba', suzano: 'Suzano', guaruja: 'Guarujá',
    cruzeiro: 'Cruzeiro'
  };

  const ZONES = [
    { key: 'south', label: 'Zona Sul', terms: ['zona sul', 'capao redondo', 'guarapiranga', 'ibirapuera', 'moema', 'jardim castro alves', 'ipiranga', 'jabaquara', 'cidade dutra'] },
    { key: 'east', label: 'Zona Leste', terms: ['zona leste', 'viaduto dona matilde', 'penha', 'artur alvim', 'sapopemba', 'vila jacui', 'vila granada'] },
    { key: 'north', label: 'Zona Norte', terms: ['zona norte', 'jardim cachoeira', 'vila maria', 'deputado emilio carlos'] },
    { key: 'center', label: 'Centro/Oeste', terms: ['centro', 'rua augusta', 'barra funda', 'pinheiros', 'vila madalena', 'nove de julho', 'planalto paulista', 'cambuci', 'marginal', 'paulista', 'bras', 'se'] }
  ];

  function containsTerm(text, term) {
    return term.length <= 2 ? new RegExp(`\\b${term}\\b`).test(text) : text.includes(term);
  }

  const MONTHS = {
    janeiro: '01', fevereiro: '02', marco: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
  };

  function municipalityOf(local) {
    const text = normalizeQuery(local);
    if (text.includes('grande sao paulo')) return 'Grande São Paulo';
    const key = Object.keys(MUNICIPALITIES).sort((a, b) => b.length - a.length)
      .find(city => text === city || text.startsWith(`${city},`));
    return key ? MUNICIPALITIES[key] : 'São Paulo';
  }

  function requestedPlace(query) {
    const q = normalizeQuery(query);
    const nonCapital = Object.keys(MUNICIPALITIES)
      .filter(city => city !== 'sao paulo')
      .sort((a, b) => b.length - a.length)
      .find(city => q.includes(city));
    if (nonCapital) return { municipality: MUNICIPALITIES[nonCapital], label: MUNICIPALITIES[nonCapital] };

    const zone = ZONES.find(item => item.terms.some(term => containsTerm(q, term)));
    if (zone) return { municipality: 'São Paulo', zone: zone.key, label: `${zone.label} de São Paulo` };
    if (/\b(capital|sao paulo|sp)\b/.test(q)) return { municipality: 'São Paulo', label: 'São Paulo' };
    if (q.includes('grande sao paulo')) return { municipality: 'Grande São Paulo', label: 'Grande São Paulo' };
    return null;
  }

  function requestedType(query) {
    const q = normalizeQuery(query);
    const types = [
      { terms: ['homic', 'feminic', 'latrocin'], label: 'de crimes letais', test: /homic|feminic|latrocin/ },
      { terms: ['atropelamento'], label: 'de atropelamentos', test: /atropelamento/ },
      { terms: ['acidente', 'colisao', 'capotamento', 'tombamento', 'engavetamento'], label: 'de acidentes de trânsito', test: /acidente|colisao|capotamento|tombamento|engavetamento/ },
      { terms: ['roubo'], label: 'de roubos', test: /roubo/ },
      { terms: ['furto'], label: 'de furtos', test: /furto/ },
      { terms: ['chuva', 'alagamento', 'enxurrada', 'desabamento', 'incendio'], label: 'de clima e infraestrutura', test: /chuva|alagamento|enxurrada|desabamento|incendio/ },
      { terms: ['prisao', 'preso'], label: 'de prisões', test: /prisao|preso/ }
    ];
    return types.find(type => type.terms.some(term => q.includes(term))) || null;
  }

  function requestedDate(query) {
    const q = normalizeQuery(query);
    const numeric = q.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?\b/);
    if (numeric) {
      const day = numeric[1].padStart(2, '0');
      const month = numeric[2].padStart(2, '0');
      const year = numeric[3] || '2026';
      return { test: item => item.data === `${day}/${month}/${year}`, label: `${day}/${month}/${year}` };
    }
    const month = Object.keys(MONTHS).find(name => q.includes(name));
    if (month) {
      const monthNumber = MONTHS[month];
      return { test: item => item.data.split('/')[1] === monthNumber, label: month };
    }
    return null;
  }

  function dateSort(items) {
    return items.slice().sort((a, b) => {
      const [ad, am, ay] = a.data.split('/');
      const [bd, bm, by] = b.data.split('/');
      return new Date(`${by}-${bm}-${bd}`) - new Date(`${ay}-${am}-${ad}`);
    });
  }

  function matchesScope(item, scope) {
    const local = normalizeQuery(item.local);
    if (scope.place?.municipality && municipalityOf(item.local) !== scope.place.municipality) return false;
    if (scope.place?.zone) {
      const zone = ZONES.find(value => value.key === scope.place.zone);
      if (!zone || municipalityOf(item.local) !== 'São Paulo' || !zone.terms.some(term => containsTerm(local, term))) return false;
    }
    if (scope.severity && item.gravidade !== ({ critical: 'crítico', medium: 'médio', low: 'baixo' }[scope.severity.key])) return false;
    if (scope.type && !scope.type.test.test(normalizeQuery(item.descricao))) return false;
    if (scope.date && !scope.date.test(item)) return false;
    return true;
  }

  function scopeLabel(scope) {
    const labels = [];
    if (scope.severity) labels.push(scope.severity.label);
    if (scope.type) labels.push(scope.type.label);
    if (scope.place) labels.push(`em ${scope.place.label}`);
    if (scope.date) labels.push(`em ${scope.date.label}`);
    return labels.join(' ');
  }

  function asksCount(query) {
    const q = normalizeQuery(query);
    return /(quant\w*|qtd|quantidade|numero|total|cont\w*|registrad\w*|possui|existe)/.test(q)
      && /(ocorr\w*|alert\w*|registro\w*|crit\w*|medi\w*|baix\w*|gravidade|nivel|cidade|municipio|local)/.test(q);
  }

  function getDeterministicDataResponse(query) {
    const q = normalizeQuery(query);
    const data = Array.isArray(window.SentinelAlertas?.dados) ? window.SentinelAlertas.dados : [];
    const scope = {
      place: requestedPlace(query),
      severity: requestedSeverity(query),
      type: requestedType(query),
      date: requestedDate(query)
    };
    const asksRecent = /mais recente|ultima|ultimo|recentes|recente|nova ocorrencia|novo alerta/.test(q);
    const asksList = /\b(quais|liste|listar|mostre|mostrar|exiba|exibir|detalhes|aconteceu)\b/.test(q);
    const asksCities = /\b(cidades?|municipios?|locais?)\b/.test(q) && !scope.place;
    const asksTopPlace = /\b(cidade|municipio|local)\b.*\b(mais|maior|concentra)|\b(mais|maior)\b.*\b(ocorr\w*|alert\w*)\b.*\b(cidade|municipio|local)\b/.test(q);
    const asksDistribution = /distribuicao|distribuicao por gravidade|nivel de gravidade/.test(q);
    const asksCommon = /mais comum|maior incidencia|maior concentracao|predominante/.test(q);
    const asksWhen = /\bquando\b/.test(q);
    const asksWhere = /\bonde\b/.test(q);
    const asksData = /\b(ocorr\w*|alert\w*|registro\w*|base|quant\w*|qtd|municip\w*|cidad\w*|local\w*|recent\w*|quais|liste|listar|mostre|detalhes|aconteceu|gravidade|distribuicao|distribuição|quando|onde)\b/.test(q);
    if (!asksData) return null;
    const scoped = data.filter(item => matchesScope(item, scope));
    const label = scopeLabel(scope);

    if (asksCount(query) && !asksCities && !asksList) {
      if (!scope.place && !scope.severity && !scope.type && !scope.date) {
        const summary = getLiveSummary();
        return {
          text: `📊 <strong>Resumo da base central:</strong><br><br>`
            + `• Total: <strong>${summary.total}</strong> ocorrências<br>`
            + `• Críticas: <strong>${summary.critical}</strong><br>`
            + `• Médias: <strong>${summary.medium}</strong><br>`
            + `• Baixas: <strong>${summary.low}</strong>`,
          model: 'Sentinel Local Data Engine'
        };
      }
      return {
        text: `📊 <strong>Ocorrências ${label || 'encontradas'}:</strong> ${scoped.length}.<br><br>`
          + (scope.place ? `Local consultado: <strong>${escapeHTML(scope.place.label)}</strong>.<br>` : '')
          + (scope.date ? `Período: <strong>${escapeHTML(scope.date.label)}</strong>.<br>` : '')
          + 'A contagem considera somente os registros da base central.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksRecent) {
      const item = dateSort(scoped)[0];
      return {
        text: item
          ? `🕒 <strong>Ocorrência mais recente${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br>${escapeHTML(item.data)} — <strong>${escapeHTML(item.local)}</strong><br>${escapeHTML(item.descricao)}<br>Gravidade: <strong>${escapeHTML(item.gravidade)}</strong>`
          : 'Não encontrei ocorrências para esse filtro.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksWhen) {
      const rows = dateSort(scoped).slice(0, 8);
      return {
        text: rows.length
          ? `📅 <strong>Datas encontradas${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br><br>${rows.map(item => `• ${escapeHTML(item.data)} — ${escapeHTML(item.descricao)} (${escapeHTML(item.local)})`).join('<br>')}`
          : 'Não encontrei datas para esse filtro.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksWhere) {
      const rows = dateSort(scoped).slice(0, 8);
      return {
        text: rows.length
          ? `📍 <strong>Locais encontrados${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br><br>${rows.map(item => `• ${escapeHTML(item.local)} — ${escapeHTML(item.data)}: ${escapeHTML(item.descricao)}`).join('<br>')}`
          : 'Não encontrei locais para esse filtro.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksTopPlace) {
      const grouped = scoped.reduce((result, item) => {
        const city = municipalityOf(item.local);
        result[city] = (result[city] || 0) + 1;
        return result;
      }, {});
      const top = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
      return {
        text: top ? `🏙️ <strong>Maior concentração:</strong><br>${escapeHTML(top[0])}, com <strong>${top[1]}</strong> ocorrência(s) na base.` : 'Não encontrei municípios para comparar.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksCities) {
      const grouped = scoped.reduce((result, item) => {
        const city = municipalityOf(item.local);
        result[city] = (result[city] || 0) + 1;
        return result;
      }, {});
      const rows = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return {
        text: `📍 <strong>Distribuição por município/local:</strong><br><br>${rows.map(([city, count]) => `• ${escapeHTML(city)}: <strong>${count}</strong>`).join('<br>') || 'Nenhum local encontrado.'}`,
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksDistribution) {
      const grouped = scoped.reduce((result, item) => {
        result[item.gravidade] = (result[item.gravidade] || 0) + 1;
        return result;
      }, {});
      return {
        text: `📊 <strong>Distribuição de gravidade${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br><br>`
          + `• Críticas: <strong>${grouped.crítico || 0}</strong><br>• Médias: <strong>${grouped.médio || 0}</strong><br>• Baixas: <strong>${grouped.baixo || 0}</strong>`,
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksCommon) {
      const grouped = scoped.reduce((result, item) => {
        result[item.descricao] = (result[item.descricao] || 0) + 1;
        return result;
      }, {});
      const top = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
      return {
        text: top ? `🔎 <strong>Ocorrência mais frequente${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br>${escapeHTML(top[0])}, com <strong>${top[1]}</strong> registro(s).` : 'Não encontrei registros para analisar.',
        model: 'Sentinel Local Data Engine'
      };
    }

    if (asksList || scope.place || scope.type || scope.date) {
      const rows = dateSort(scoped).slice(0, 8);
      return {
        text: `🧾 <strong>Registros${label ? ` — ${escapeHTML(label)}` : ''}:</strong><br><br>`
          + (rows.map(item => `• ${escapeHTML(item.data)} — <strong>${escapeHTML(item.local)}</strong><br>&nbsp;&nbsp;${escapeHTML(item.descricao)} (${escapeHTML(item.gravidade)})`).join('<br>') || 'Nenhuma ocorrência encontrada para esse filtro.'),
        model: 'Sentinel Local Data Engine'
      };
    }

    return null;
  }

  // Fallback Local Inteligente, sincronizado com a base central dos alertas.
  function generateLocalResponseWithActions(query) {
    const q = query.toLowerCase().trim();

    if (!isSentinelScope(query)) {
      return {
        text: OUT_OF_SCOPE_MSG,
        model: 'Sentinel Scope Guard'
      };
    }

    const actions = [];

    // Comandos de ação locais
    if (q.includes('abrir mapa') || q.includes('ver no mapa')) {
      actions.push({ type: 'navigate', target: 'mapa.html' });
    } else if (q.includes('simular') || q.includes('simulacao') || q.includes('simulação')) {
      if (q.includes('tempestade')) actions.push({ type: 'simulate_scenario', target: 'tempestade_marginal', payload: { nome: 'Tempestade na Marginal' } });
      else if (q.includes('arrastao') || q.includes('arrastão')) actions.push({ type: 'simulate_scenario', target: 'arrastao_centro', payload: { nome: 'Arrastão no Centro' } });
      else actions.push({ type: 'navigate', target: 'simulacoes.html' });
    } else if (q.includes('abrir alerta') || q.includes('ver alerta')) {
      actions.push({ type: 'navigate', target: 'alertas.html' });
    } else if (q.includes('abrir analise') || q.includes('abrir análise')) {
      actions.push({ type: 'navigate', target: 'analise.html' });
    } else if (q.includes('abrir dashboard')) {
      actions.push({ type: 'navigate', target: 'dashboard.html' });
    }

    if (actions.length > 0) {
      executeActions(actions);
    }

    const dataResponse = getDeterministicDataResponse(query);
    if (dataResponse) return dataResponse;

    const summary = getLiveSummary();
    let resp = '';
    if (q.includes('quantos') || q.includes('quantidade') || q.includes('resumo dos alertas') || q.includes('total de alertas')) {
      resp = `📊 <strong>Resumo da base central:</strong><br><br>• Total: <strong>${summary.total}</strong> alertas<br>• Críticos: <strong>${summary.critical}</strong><br>• Médios: <strong>${summary.medium}</strong><br>• Baixos: <strong>${summary.low}</strong><br><br>${summary.latest ? `Registro mais recente: <strong>${escapeHTML(summary.latest.data)} — ${escapeHTML(summary.latest.local)}</strong>.` : 'Não há registros carregados.'}`;
    } else if (q.includes('alerta') && (q.includes('crít') || q.includes('grave') || q.includes('prior'))) {
      const criticos = (window.SentinelAlertas?.dados || []).filter(item => item.gravidade === 'crítico').slice(0, 5);
      resp = `🚨 <strong>Alertas críticos:</strong> ${summary.critical} registro(s) na base.<br><br>${criticos.map(item => `• ${escapeHTML(item.data)} — <strong>${escapeHTML(item.local)}</strong>: ${escapeHTML(item.descricao)}`).join('<br>') || 'Nenhum alerta crítico carregado.'}<br><br>Use “Abrir o mapa” para localizar os pontos.`;
    } else if (q.includes('aoi') || q.includes('zona') || q.includes('perimetro')) {
      resp = `🗺️ <strong>Áreas de Interesse (AOIs) Ativas em São Paulo:</strong><br><br>
        • <strong>AOI Alpha (Av. Paulista):</strong> Risco 68% • 84 Câmeras • 412 Sensores<br>
        • <strong>AOI Bravo (Sé / Centro):</strong> Risco 92% (Crítico) • 120 Câmeras • 320 Sensores<br>
        • <strong>AOI Charlie (Faria Lima):</strong> Risco 24% • 96 Câmeras • 530 Sensores<br>
        • <strong>AOI Delta (Marginal Tietê):</strong> Risco 81% • 64 Câmeras • 289 Sensores<br><br>
        💡 <em>Diga "abra o mapa" para visualizar as camadas em tempo real!</em>`;
    } else if (q.includes('risco') || q.includes('segur') || q.includes('crime') || q.includes('bo')) {
      resp = `🚨 <strong>Relatório Tático de Segurança Urbana:</strong><br><br>
        • <strong>Foco Crítico:</strong> Praça da Sé e Centro Histórico (Risco 92/100)<br>
        • <strong>Foco Alto:</strong> Marginal Tietê e Lapa (Risco 81/100)<br>
        • <strong>Zonas Estáveis:</strong> Moema (18/100), Jardins (15/100), Pinheiros (24/100)<br>
        • <strong>Base central:</strong> ${summary.total} alertas classificados por gravidade.`;
    } else if (q.includes('tempestade') || q.includes('chuva') || q.includes('clima') || q.includes('temperatura')) {
      resp = `🌧️ <strong>Monitoramento Meteorológico de São Paulo:</strong><br><br>
        • Temperatura: 24.4°C • Umidade: 62% • Vento: 14 km/h<br>
        • <strong>Risco Pluviométrico:</strong> MODERADO nas Marginais Tietê e Pinheiros<br>
        • Consulte a aba Mapa para localizar alertas relacionados a chuva e alagamento.`;
    } else if (q.includes('ola') || q.includes('olá') || q.includes('oi') || q.includes('bom dia') || q.includes('boa tarde') || q.includes('boa noite') || q.includes('ajuda')) {
      resp = `👋 <strong>Olá! Sou o assistente de IA do Sentinel IA.</strong><br><br>
        Posso auxiliá-lo com consultas preditivas, relatórios táticos de segurança e controle da plataforma.<br><br>
        • 🗺️ <em>"Abrir o mapa de SP"</em><br>
        • 📊 <em>"Quantas ocorrências médias estão registradas?"</em><br>
        • 📍 <em>"Quantas ocorrências existem em São Paulo?"</em><br>
        • 🕒 <em>"Quais foram as ocorrências mais recentes?"</em><br>
        • 🏙️ <em>"Qual cidade concentra mais ocorrências?"</em><br>
        • 🚨 <em>"Mostre alertas críticos em Campinas"</em><br>
        • ⛈️ <em>"Simular tempestade na Marginal"</em><br>
        • 📊 <em>"Abrir tela de análise"</em>`;
    } else {
      resp = `📡 <strong>Sentinel IA Intelligence Core:</strong><br><br>
        Consulta processada sobre a malha de São Paulo: <em>"${escapeHTML(query)}"</em>.<br><br>
        • 🛡️ <strong>Base monitorada:</strong> ${summary.total} alertas (${summary.critical} críticos)<br>
        • 📍 <strong>Dados disponíveis:</strong> Dashboard, Mapa, Alertas e Simulações<br>
        • 💡 <em>Solicite comandos de navegação ou simulações táticas.</em>`;
    }

    return {
      text: resp,
      model: 'Sentinel Local NLP Engine'
    };
  }

  function formatMarkdownToHTML(md) {
    if (!md) return '';
    let html = md
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,229,255,0.12);color:var(--cyan,#00e5ff);padding:2px 6px;border-radius:4px;font-family:var(--font-mono, monospace);font-size:0.85em;">$1</code>')
      .replace(/^### (.*$)/gim, '<h5 style="color:var(--cyan,#00e5ff);margin:0.5rem 0 0.2rem;font-size:0.95rem;">$1</h5>')
      .replace(/^## (.*$)/gim, '<h4 style="color:#fff;margin:0.6rem 0 0.3rem;font-size:1rem;">$1</h4>')
      .replace(/^# (.*$)/gim, '<h3 style="color:#fff;margin:0.8rem 0 0.4rem;font-size:1.1rem;">$1</h3>')
      .replace(/^\s*[-•]\s+(.*)$/gim, '<div style="display:flex;gap:6px;margin:3px 0;"><span>•</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    return html;
  }

  function updatePromptChips(suggestions) {
    const container = document.getElementById('aiPromptChips');
    if (!container || !suggestions || suggestions.length === 0) return;

    container.innerHTML = suggestions.slice(0, 6).map(s => `
      <button class="ai-chip-btn" data-prompt="${s}">${s}</button>
    `).join('');

    // Re-bind click events
    container.querySelectorAll('.ai-chip-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });
  }

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

  // ══════════════════════════════════════════════
  //  INJETAR DOM DO CHATBOT
  // ══════════════════════════════════════════════
  function injectChatbotDOM() {
    if (document.getElementById('aiChatLauncher')) return;

    const launcher = document.createElement('button');
    launcher.id = 'aiChatLauncher';
    launcher.className = 'ai-chat-launcher';
    launcher.setAttribute('aria-label', 'Abrir Assistente de IA');
    launcher.innerHTML = `
      <span aria-hidden="true">🤖</span>
      <span class="ai-chat-launcher-badge"></span>
    `;

    const drawer = document.createElement('div');
    drawer.id = 'aiChatDrawer';
    drawer.className = 'ai-chat-drawer';
    drawer.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-title">
          <div class="ai-avatar-icon">
            <span aria-hidden="true">✦</span>
          </div>
          <div>
            <h4>Sentinel IA Assistant</h4>
            <span><span class="live-dot" style="width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block;animation:live-pulse 1.5s ease-in-out infinite;"></span> Núcleo de Inteligência Urbana</span>
          </div>
        </div>
        <button class="btn-icon" id="aiChatClose" style="width:28px;height:28px;background:transparent;border:none;color:#8b9dc3;cursor:pointer;">
          ×
        </button>
      </div>

      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg-row bot">
          <div class="ai-msg-bubble">
            👋 ${getGreetingByTime()}! Sou o assistente oficial do <strong>Sentinel IA</strong>.<br><br>
            Estou conectado à base central do projeto, com <strong>${getLiveSummary().total} alertas classificados</strong> por gravidade e localização em São Paulo.<br><br>
            Como posso apoiar sua operação hoje?
          </div>
        </div>
      </div>

      <div class="ai-prompt-chips" id="aiPromptChips">
        <button class="ai-chip-btn" data-prompt="Abra o mapa de São Paulo">🗺️ Abrir Mapa</button>
        <button class="ai-chip-btn" data-prompt="Qual é o risco de segurança na Sé agora?">🚨 Risco na Sé</button>
        <button class="ai-chip-btn" data-prompt="Simule uma tempestade na Marginal Tietê">⛈️ Simular Tempestade</button>
        <button class="ai-chip-btn" data-prompt="Como está a temperatura e chuva em SP?">🌧️ Clima em SP</button>
        <button class="ai-chip-btn" data-prompt="Quais são as Áreas de Interesse (AOIs)?">📍 Zonas AOI</button>
        <button class="ai-chip-btn" data-prompt="Abrir a central de alertas">⚡ Ver Alertas</button>
      </div>

      <div class="ai-chat-footer">
        <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Comande a IA ou faça uma pergunta sobre a plataforma..." autocomplete="off" />
        <button id="aiChatSend" class="ai-chat-send-btn" aria-label="Enviar Pergunta">
          ➤
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
  //  ENVIAR MENSAGEM
  // ══════════════════════════════════════════════
  async function sendMessage(text) {
    if (!text || !text.trim()) return;

    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Adiciona Mensagem do Usuário
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

    conversationMemory.history.push({ role: 'user', content: text });

    // Mostra indicador de digitação
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

    // Consulta ao Motor de IA (FastAPI ou Local)
    const result = await queryChatEngine(text);

    typingRow.remove();

    const botRow = document.createElement('div');
    botRow.className = 'ai-msg-row bot';
    botRow.innerHTML = `
      <div class="ai-msg-bubble">
        ${result.text}
        <div class="ai-msg-time">${getTimeString()} • ${result.model}</div>
      </div>
    `;
    chatBody.appendChild(botRow);
    chatBody.scrollTop = chatBody.scrollHeight;

    conversationMemory.history.push({ role: 'assistant', content: result.text });

    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (sendBtn) sendBtn.disabled = false;

    if (window.lucide) lucide.createIcons();
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

    chips.forEach(chip => {
      chip.addEventListener('click', function () {
        const prompt = this.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });

    // Atalhos Ctrl+K e Esc
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (drawer) {
          drawer.classList.toggle('open');
          if (drawer.classList.contains('open') && input) input.focus();
        }
      }
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
    });

    // Se houver cenário pendente de redirecionamento no sessionStorage
    const pendingScenario = sessionStorage.getItem('pending_scenario');
    if (pendingScenario) {
      sessionStorage.removeItem('pending_scenario');
      setTimeout(() => {
        if (typeof window.triggerScenario === 'function') {
          window.triggerScenario(pendingScenario);
        }
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbotEvents);
  } else {
    initChatbotEvents();
  }

})();
