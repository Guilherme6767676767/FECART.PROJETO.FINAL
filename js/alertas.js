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

    // Fonte compartilhada das 50 ocorrências fornecidas pelo usuário.
    async function carregarAlertasReais() {
        const fonte = window.SENTINEL_REAL_ALERTS || [];
        const start = document.getElementById('alertStartDate')?.value || '';
        const end = document.getElementById('alertEndDate')?.value || '';
        alertsData = fonte
            .filter(item => (!start || item.data >= start) && (!end || item.data <= end))
            .slice()
            .sort((a, b) => a.prioridade - b.prioridade || `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`))
            .map(item => ({
                ...item,
                real: true,
                type: item.severidade,
                title: item.natureza,
                desc: `${item.municipio} • ${item.bairro}`,
                time: `${item.data} ${item.hora}`,
                icon: item.severidade === 'critical' ? 'alert-octagon' : item.severidade === 'high' ? 'shield-alert' : item.severidade === 'medium' ? 'alert-triangle' : 'file-warning',
                locationName: `${item.bairro}, ${item.municipio}`
            }));
        renderAlerts('all');
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
                // Fallback alerts baseados no painel de ocorrências criminais (exemplo de categorias e descrições)
                alertsData = [
                    { id: 'cr-1', type: 'critical', title: 'Robo à mão armada', desc: '[Polícia Civil] Ocorrência de roubo à mão armada em região central. Suspeito ainda não identificado.', time: getRandomPastTime(), icon: 'alert-octagon', lat: -23.5405, lng: -46.6300, locationName: 'Centro' },
                    { id: 'cr-2', type: 'high', title: 'Furto em comércio', desc: '[Polícia Militar] Furto registrado em loja de eletrônicos na zona sul.', time: getRandomPastTime(), icon: 'alert-triangle', lat: -23.5600, lng: -46.6500, locationName: 'Zona Sul' },
                    { id: 'cr-3', type: 'medium', title: 'Assalto a pedestre', desc: '[PM] Assalto a pedestre próximo à estação de metrô.', time: getRandomPastTime(), icon: 'shield-alert', lat: -23.5500, lng: -46.6200, locationName: 'Zona Leste' },
                    { id: 'cr-4', type: 'low', title: 'Vandalismo de pichação', desc: '[Guarda Municipal] Atividade de pichação detectada em parede pública.', time: getRandomPastTime(), icon: 'pen-tool', lat: -23.5605, lng: -46.6400, locationName: 'Zona Oeste' }
                ];
            }
        } catch (err) {
            console.error("Falha ao integrar alertas com API:", err);
        } finally {
            renderAlerts('all');
        }
    }

    let alertsData = [];

    // Utility to generate a realistic past timestamp for simulated alerts
    function getRandomPastTime() {
        // Random offset up to 2 hours ago
        const offsetMs = Math.floor(Math.random() * 2 * 60 * 60 * 1000);
        const date = new Date(Date.now() - offsetMs);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const alertListContainer = document.getElementById('alertList');
    const alertCountElement = document.getElementById('alertCount');
    let regionChartInstance = null;
    let severityChartInstance = null;

    // Função Global de Navegação para o Mapa
    window.viewAlertOnMap = function(lat, lng, locationName) {
        if (window.event) window.event.stopPropagation();
        window.location.href = `mapa.html?lat=${lat}&lng=${lng}&search=${encodeURIComponent(locationName)}`;
    };

    window.viewRealAlertOnMap = function(id) {
        if (window.event) window.event.stopPropagation();
        window.location.href = `mapa.html?realId=${encodeURIComponent(id)}`;
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
            const timeFormatted = alert.real ? alert.time : (alert.time === 'Tempo Real' || alert.time === 'Agora' || alert.time === 'Recente'
                ? `Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`
                : `Hoje, ${alert.time}`);

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
                    <div class="alert-item ${alert.real && alert.type === 'critical' ? 'real-alert-critical' : ''}" id="alert-item-${alert.id}">
                        <div class="${iconClass}">
                            <i data-lucide="${alert.icon}"></i>
                        </div>
                        <div class="alert-item-content">
                            <h5>${alert.title}${alert.real && alert.type === 'critical' ? '<span class="real-alert-badge">MAIOR GRAVIDADE</span>' : ''}</h5>
                            <p>${alert.real ? `${alert.data} • ${alert.hora}<br>${alert.municipio} • ${alert.bairro}` : alert.desc}</p>
                        </div>
                        <div class="alert-item-time">${alert.time}</div>
                        <div class="alert-item-actions">
                            <button class="btn-view-map" onclick="${alert.real ? `viewRealAlertOnMap('${alert.id}')` : `viewAlertOnMap(${alert.lat}, ${alert.lng}, '${alert.locationName}')`}">
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
