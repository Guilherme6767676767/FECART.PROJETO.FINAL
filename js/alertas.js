document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    // Toggle Sidebar
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarToggle.setAttribute('aria-expanded', String(sidebar.classList.contains('open')));
        });
    }

    const liveClock = document.getElementById('liveClock');
    if (liveClock) {
        setInterval(() => {
            liveClock.textContent = new Date().toLocaleTimeString('pt-BR');
        }, 1000);
    }

    // Motor de Carregamento Dinâmico de Alertas via API Real
    async function carregarAlertasReais() {
        const API_BASE = window.SENTINEL_BACKEND_URL || (
            window.location.port === '8000' || window.location.origin.includes('vercel.app')
                ? ''
                : 'http://localhost:8000'
        );
        // Feed único e consolidado pelo backend. Não usar mocks quando a fonte
        // estiver indisponível: isso confundia alertas históricos com eventos atuais.
        try {
            const params = new URLSearchParams();
            const start = document.getElementById('alertStartDate')?.value;
            const end = document.getElementById('alertEndDate')?.value;
            if (start) params.set('data_inicio', `${start}T00:00:00-03:00`);
            if (end) params.set('data_fim', `${end}T23:59:59-03:00`);
            const response = await fetch(`${API_BASE}/api/v1/alertas${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            alertsData = (payload.alertas || []).map(alerta => ({
                id: alerta.id,
                type: alerta.severidade || 'medium',
                title: alerta.titulo,
                desc: `[${alerta.fonte}] ${alerta.descricao}`,
                time: alerta.criado_em ? new Date(alerta.criado_em).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : 'Agora',
                icon: alerta.tipo === 'clima' ? 'cloud-rain' : alerta.tipo === 'transito' ? 'car' : alerta.tipo === 'acidente' ? 'alert-triangle' : 'shield-alert',
                lat: alerta.latitude,
                lng: alerta.longitude,
                locationName: alerta.local || 'São Paulo'
            }));
            renderAlerts('all');
        } catch (error) {
            console.warn('Feed de alertas indisponível:', error);
            alertsData = [];
            renderAlerts('all');
        }
        return;
        try {
            let apiAlerts = [];
            
            // 1. Consultar Pontos de Alagamento Reais via API
            try {
                const resAlag = await fetch(`${API_BASE}/api/alagamentos`);
                if (resAlag.ok) {
                    const alagamentos = await resAlag.json();
                    alagamentos.forEach(item => {
                        if (item.nivel_risco === 'Alto' || item.nivel_risco === 'Médio') {
                            apiAlerts.push({
                                id: `alag-${item.id}`,
                                type: item.nivel_risco === 'Alto' ? 'high' : 'medium',
                                title: `Risco de Alagamento: ${item.local}`,
                                desc: `[Open-Meteo Telemetria] Precipitação: ${item.precipitacao_mm}mm. ${item.recomendacao}`,
                                time: 'Tempo Real',
                                icon: 'waves',
                                lat: item.latitude,
                                lng: item.longitude,
                                locationName: item.bairro
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn("Erro ao buscar alagamentos reais:", e);
            }

            // 2. Consultar Boletins de Ocorrência / Crimes Reais via API
            try {
                const resCrimes = await fetch(`${API_BASE}/api/crimes`);
                if (resCrimes.ok) {
                    const crimes = await resCrimes.json();
                    crimes.slice(0, 10).forEach(c => {
                        const grav = (c.gravidade || 'MEDIA').toUpperCase();
                        let type = 'medium';
                        if (grav === 'CRITICA') type = 'critical';
                        else if (grav === 'ALTA') type = 'high';
                        else if (grav === 'BAIXA') type = 'low';

                        apiAlerts.push({
                            id: `crime-${c.id || c.numero_bo}`,
                            type: type,
                            title: `${c.tipo_crime || c.categoria || 'Ocorrência Urbana'}: ${c.bairro || 'São Paulo'}`,
                            desc: `[SSP-SP / Telemetria] ${c.descricao || c.logradouro || 'Ocorrência registrada no sistema Sentinel IA.'}`,
                            time: c.data_hora ? new Date(c.data_hora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : 'Recente',
                            icon: type === 'critical' ? 'alert-octagon' : (type === 'high' ? 'shield-alert' : 'car'),
                            lat: c.latitude,
                            lng: c.longitude,
                            locationName: c.bairro || 'São Paulo'
                        });
                    });
                }
            } catch (e) {
                console.warn("Erro ao buscar crimes reais:", e);
            }

            // Se a API não retornar eventos ativos no momento (ou se estiver offline), mantém a lista sem falsos positivos
            if (apiAlerts.length > 0) {
                alertsData = apiAlerts;
            } else {
                alertsData = [
                    { id: 'st-1', type: 'low', title: 'Monitoramento Pluviométrico Operacional', desc: '[Open-Meteo API] Sem ocorrências de alagamento registradas nas últimas horas (Precipitação: 0.0mm).', time: 'Agora', icon: 'shield-check', lat: -23.5505, lng: -46.6333, locationName: 'São Paulo' },
                    { id: 'st-2', type: 'medium', title: 'Ronda e Sensores IoT Ativos', desc: '[Sentinel Core] Todos os conectores de telemetria operando dentro dos parâmetros de segurança.', time: 'Agora', icon: 'wifi', lat: -23.5675, lng: -46.6920, locationName: 'Pinheiros' }
                ];
            }
        } catch (err) {
            console.error("Falha ao integrar alertas com API:", err);
        } finally {
            renderAlerts('all');
        }
    }

    let alertsData = [];

    const alertListContainer = document.getElementById('alertList');
    const alertCountElement = document.getElementById('alertCount');
    let regionChartInstance = null;
    let severityChartInstance = null;

    // Função Global de Navegação para o Mapa
    window.viewAlertOnMap = function(lat, lng, locationName) {
        if (window.event) window.event.stopPropagation();
        window.location.href = `mapa.html?lat=${lat}&lng=${lng}&search=${encodeURIComponent(locationName)}`;
    };

    // Função para renderizar a timeline lateral ("Últimas 24 Horas") de forma dinâmica com dados da API
    function renderTimeline() {
        const timelineList = document.getElementById('timelineList');
        if (!timelineList) return;
        timelineList.innerHTML = '';

        if (!alertsData || alertsData.length === 0) {
            timelineList.innerHTML = `
                <div class="timeline-item">
                    <div class="timeline-time">Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
                    <div class="timeline-content">
                        <h5>Telemetria Ativa</h5>
                        <p>Monitoramento urbano em tempo real sem anomalias nas últimas 24 horas.</p>
                    </div>
                </div>
            `;
            return;
        }

        alertsData.forEach(alert => {
            const itemClass = alert.type === 'critical' ? 'critical' : (alert.type === 'high' ? 'warning' : '');
            const timeFormatted = alert.time === 'Tempo Real' || alert.time === 'Agora' || alert.time === 'Recente'
                ? `Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`
                : `Hoje, ${alert.time}`;

            const itemHTML = `
                <div class="timeline-item ${itemClass}">
                    <div class="timeline-time">${timeFormatted}</div>
                    <div class="timeline-content">
                        <h5>${alert.title}</h5>
                        <p>${alert.desc}</p>
                    </div>
                </div>
            `;
            timelineList.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

    // Função para renderizar alertas
    function renderAlerts(filterType = 'all') {
        if (!alertListContainer) return;
        alertListContainer.innerHTML = '';
        let count = 0;

        alertsData.forEach(alert => {
            if (filterType === 'all' || alert.type === filterType) {
                count++;
                
                const iconClass = `alert-item-icon ${alert.type}`;
                
                const alertHTML = `
                    <div class="alert-item" id="alert-item-${alert.id}">
                        <div class="${iconClass}">
                            <i data-lucide="${alert.icon}"></i>
                        </div>
                        <div class="alert-item-content">
                            <h5>${alert.title}</h5>
                            <p>${alert.desc}</p>
                        </div>
                        <div class="alert-item-time">${alert.time}</div>
                        <div class="alert-item-actions">
                            <button class="btn-view-map" onclick="viewAlertOnMap(${alert.lat}, ${alert.lng}, '${alert.locationName}')">
                                <i data-lucide="map-pin" style="width:14px;height:14px"></i> Visualizar no Mapa
                            </button>
                            <button class="btn-acknowledge" onclick="acknowledgeAlert('${alert.id}')">
                                <i data-lucide="check" style="width:14px;height:14px"></i> Reconhecer
                            </button>
                        </div>
                    </div>
                `;
                alertListContainer.insertAdjacentHTML('beforeend', alertHTML);
            }
        });
        
        if (count === 0) {
            alertListContainer.innerHTML = '<div class="empty-state" role="status" aria-live="polite"><h5>Nenhum alerta encontrado</h5><p>Nenhum alerta corresponde aos filtros selecionados. Tente outro nível de severidade ou período.</p></div>';
        }
        if (alertCountElement) alertCountElement.textContent = count;
        if (window.lucide) lucide.createIcons();
        renderTimeline();
    }

    function updateAlertCharts() {
        if (!window.Chart) return;
        const regions = {};
        alertsData.forEach(alert => {
            const region = alert.locationName || 'São Paulo';
            regions[region] = (regions[region] || 0) + 1;
        });
        const labels = Object.keys(regions).slice(0, 8);
        if (regionChartInstance) {
            regionChartInstance.data.labels = labels.length ? labels : ['Sem dados'];
            regionChartInstance.data.datasets[0].data = labels.length ? labels.map(label => regions[label]) : [0];
            regionChartInstance.update();
        }
        const levels = ['critical', 'high', 'medium', 'low'];
        if (severityChartInstance) {
            severityChartInstance.data.datasets[0].data = levels.map(level => alertsData.filter(alert => alert.type === level).length);
            severityChartInstance.update();
        }
    }

    // Chamada Inicial
    carregarAlertasReais();

    document.getElementById('applyAlertDateFilter')?.addEventListener('click', carregarAlertasReais);

    // Função Global para Reconhecer Alerta (Acknowledge)
    window.acknowledgeAlert = function(id) {
        event.stopPropagation();
        const el = document.getElementById('alert-item-' + id);
        if (el) {
            el.classList.add('fadeOut');
            setTimeout(() => {
                el.remove();
                // Atualiza o contador visual
                const countEl = document.getElementById('alertCount');
                if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
            }, 300);
        }
    };

    // Motor Simulado de IA Preditiva para Geração de Alertas
    const aiGenerators = {
        critical: {
            titles: ["Colisão Múltipla Detectada", "Risco Iminente de Enchente", "Queda de Energia Estrutural", "Incêndio em Área Comercial", "Evasão Suspeita Detectada"],
            sources: ["Visão Computacional (Câmera 84)", "Sensor Climático (Nível Vermelho)", "Malha de Sensores IoT", "Análise Térmica por Drone", "LPR (Leitura de Placas)"],
            details: [
                "A rede neural identificou padrão de bloqueio total da via. Confiança: 98.4%. Viaturas acionadas automaticamente.",
                "Modelo preditivo aponta transbordamento em 15 minutos devido a índice pluviométrico atípico.",
                "Anomalia crítica no grid de energia. Desvio de 45% acima da tolerância. Risco de apagão no quadrante.",
                "Foco de calor extremo detectado fora do padrão térmico normal. Propagação rápida estimada pela IA.",
                "Veículo com restrição detectado cruzando cerco eletrônico em alta velocidade."
            ]
        },
        high: {
            titles: ["Aglomeração Anômala", "Alerta de Tráfego Intenso", "Suspeita de Invasão", "Falha de Infraestrutura", "Alerta Ambiental"],
            sources: ["Análise de Fluxo de Pessoas", "Modelo de Previsão de Trânsito", "Sensores Perimetrais", "Monitoramento de Pontes", "Sensores de Ar"],
            details: [
                "Desvio de 300% na movimentação normal de pessoas na praça central. Possível manifestação não programada.",
                "Rede recorrente previu retenção severa nas próximas 2 horas. Sugerido desvio dinâmico de semáforos.",
                "Movimentação detectada em área restrita fora do horário comercial. Alarme despachado.",
                "Micro-vibrações detectadas acima do limiar seguro em pilar do viaduto principal.",
                "Queda abrupta na qualidade do ar (PM2.5 disparado). Possível vazamento de gás ou fumaça."
            ]
        },
        medium: {
            titles: ["Semáforo Intermitente", "Ruído Urbano Elevado", "Veículo Abandonado", "Lentidão Moderada", "Iluminação Inoperante"],
            sources: ["Monitoramento Viário", "Sensores Acústicos", "Câmeras de Segurança", "GPS Coletivo", "Smart Grid"],
            details: [
                "Sistema reporta falha de sincronização no cruzamento. Impacto moderado no fluxo.",
                "Nível de decibéis 30% acima do tolerável por mais de 20 minutos. Possível perturbação da ordem.",
                "Objeto estático (veículo) na via por tempo superior a 2 horas. Verificação pendente.",
                "Velocidade média da via caiu para 15km/h. Padrão não habitual para o horário.",
                "Circuito de iluminação LED apagado. Risco de segurança aumentado no quarteirão."
            ]
        },
        low: {
            titles: ["Manutenção Preventiva", "Sensor Calibrando", "Aviso de Limpeza", "Monitoramento Ativo", "Atualização de Sistema"],
            sources: ["Sistema Central", "Agente Autônomo", "Gestão de Resíduos", "Rotina de IA", "Servidor Edge"],
            details: [
                "Equipe técnica detectada na via realizando reparos previstos no cronograma.",
                "Sensor 4B entrou em modo de auto-calibração temporária. Dados isolados.",
                "Lixeira inteligente relatou 90% de capacidade. Rota de coleta otimizada pela IA.",
                "Varredura padrão completada sem anomalias críticas no quadrante oeste.",
                "Modelo LSTM regional atualizado via edge-computing. Precisão melhorada em +0.5%."
            ]
        }
    };

    // Atualização periódica dos dados reais da API a cada 30s
    setInterval(() => {
        carregarAlertasReais();
    }, 30000);

    // Render inicial
    if (alertListContainer) {
        renderAlerts('all');
    }

    // Filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterType = btn.getAttribute('data-filter');
            filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === btn)));
            renderAlerts(filterType);
        });
    });

    // Gráficos Chart.js
    if (!window.Chart) {
        console.warn('Chart.js indisponível; alertas continuam funcionando sem os gráficos.');
    }
    if (window.Chart) {
    Chart.defaults.color = '#8b9dc3';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.boxHeight = 10;
    Chart.defaults.plugins.legend.labels.padding = 16;
    const gridColor = 'rgba(255, 255, 255, 0.05)';

    // Gráfico: Alertas por Região (Bar Horizontal)
    const ctxRegion = document.getElementById('regionChart');
    if (ctxRegion) {
        regionChartInstance = new Chart(ctxRegion, {
            type: 'bar',
            data: {
                labels: ['Centro', 'Zona Sul', 'Zona Leste', 'Zona Oeste', 'Zona Norte'],
                datasets: [{
                    label: 'Alertas Ativos',
                    data: [15, 12, 9, 7, 4],
                    backgroundColor: 'rgba(0, 229, 255, 0.6)',
                    borderColor: '#00e5ff',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // Gráfico: Distribuição por Severidade (Doughnut)
    const ctxSeverity = document.getElementById('severityChart');
    if (ctxSeverity) {
        severityChartInstance = new Chart(ctxSeverity, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Alto', 'Médio', 'Baixo'],
                datasets: [{
                    data: [3, 4, 8, 32],
                    backgroundColor: [
                        '#ef4444', // Red
                        '#f59e0b', // Yellow
                        '#3b82f6', // Blue
                        '#10b981'  // Green
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
    updateAlertCharts();
    }
});
