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

    function classificarSeveridadeLocal(alerta) {
        if (typeof window.classificarSeveridade === 'function') {
            return window.classificarSeveridade(alerta);
        }
        let texto = '';
        if (typeof alerta === 'string') {
            texto = alerta;
        } else if (alerta && typeof alerta === 'object') {
            texto = [alerta.natureza||'', alerta.title||'', alerta.titulo||'', alerta.desc||'', alerta.descricao||''].join(' ');
        }
        const limpo = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (limpo.includes('morte') || limpo.includes('vitima fatal') || limpo.includes('vitimas fatais') || limpo.includes('obito')) {
            return 'critical';
        }
        const padraoCritico = /\b(morte|mortes|obito|obitos|homicidio|homicidios|feminicidio|feminicidios|vitima fatal|vitimas fatais|fatal|latrocinio|latrocinios|explosao|explosoes)\b|incendio com vitima/i;
        if (padraoCritico.test(limpo)) return 'critical';
        const padraoMedio = /\b(carcere privado|sequestro|sequestros|roubo|roubos|assalto|assaltos|agressao|agressoes|confronto policial|perseguicao|violencia sexual|arrastao)\b|acidente com ferido|acidente rodoviario|acidente de transito|incendio sem vitima/i;
        if (padraoMedio.test(limpo) || limpo.includes('acidente')) return 'medium';
        return 'low';
    }

    function atualizarContadoresGlobais() {
        const totalAlertas = (window.SENTINEL_REAL_ALERTS || []).length || 43;
        const badges = document.querySelectorAll('#sidebarAlertBadge, .sidebar-link[href="alertas.html"] .link-badge');
        badges.forEach(b => { b.textContent = totalAlertas; });
    }

    // Fonte compartilhada das ocorrências fornecidas pelo usuário.
    async function carregarAlertasReais() {
        const classify = window.classificarSeveridade || classificarSeveridadeLocal;
        const fonte = (window.SENTINEL_REAL_ALERTS || []).map(item => {
            const sev = classify(item);
            return {
                ...item,
                severidade: sev,
                nivel_gravidade: sev === 'critical' ? 'CRÍTICO' : (sev === 'medium' ? 'MÉDIO' : 'BAIXO'),
                prioridade: sev === 'critical' ? 0 : (sev === 'medium' ? 1 : 2)
            };
        });
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
                desc: `${item.municipio} • ${item.local}`,
                time: `${item.data} ${item.hora}`,
                icon: item.severidade === 'critical' ? 'alert-octagon' : (item.severidade === 'medium' ? 'alert-triangle' : 'shield-check'),
                locationName: `${item.local}, ${item.municipio}`
            }));
        
        const activeBtn = document.querySelector('.alerts-filters .filter-btn.active');
        const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        renderAlerts(filterType);
        updateAlertCharts();
        atualizarContadoresGlobais();
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
            const itemClass = alert.type === 'critical' ? 'critical' : (alert.type === 'medium' ? 'warning' : 'safe');
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
                            <h5>${alert.title}${alert.real && alert.type === 'critical' ? '<span class="real-alert-badge">CRÍTICO</span>' : ''}</h5>
                            <p>${alert.real ? `${alert.data}${alert.hora ? ` • ${alert.hora}` : ''}<br>${alert.municipio}<br>${alert.local}<br><small>Fonte: ${alert.fonte}</small>` : alert.desc}</p>
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
            alertListContainer.innerHTML = `
                <div class="empty-state" role="status" aria-live="polite" style="padding: 2.5rem 1.5rem; text-align: center;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">🔍</div>
                    <h5 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">Nenhum alerta encontrado</h5>
                    <p style="font-size: 0.85rem; color: var(--text-tertiary); max-width: 440px; margin: 0 auto;">Nenhum alerta corresponde aos filtros ou período selecionado. Tente outro nível de severidade ou clique em "Limpar" no filtro de período.</p>
                </div>
            `;
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
        const levels = ['critical', 'medium', 'low'];
        if (severityChartInstance) {
            severityChartInstance.data.datasets[0].data = levels.map(level => alertsData.filter(alert => alert.type === level).length);
            severityChartInstance.update();
        }
    }

    // Chamada Inicial
    carregarAlertasReais();

    document.getElementById('applyAlertDateFilter')?.addEventListener('click', carregarAlertasReais);
    document.getElementById('clearAlertDateFilter')?.addEventListener('click', () => {
        const startInput = document.getElementById('alertStartDate');
        const endInput = document.getElementById('alertEndDate');
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        carregarAlertasReais();
    });

    // Função Global para Reconhecer Alerta (Acknowledge)
    window.acknowledgeAlert = function(id) {
        if (window.event) window.event.stopPropagation();
        const el = document.getElementById('alert-item-' + id);
        if (el) {
            el.classList.add('fadeOut');
            setTimeout(() => {
                el.remove();
                alertsData = alertsData.filter(a => a.id !== id);
                // Atualiza o contador visual
                const countEl = document.getElementById('alertCount');
                if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
                updateAlertCharts();
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
        medium: {
            titles: ["Semáforo Intermitente", "Ruído Urbano Elevado", "Veículo Abandonado", "Lentidão Moderada", "Iluminação Inoperante", "Aglomeração Anômala"],
            sources: ["Monitoramento Viário", "Sensores Acústicos", "Câmeras de Segurança", "GPS Coletivo", "Smart Grid"],
            details: [
                "Sistema reporta falha de sincronização no cruzamento. Impacto moderado no fluxo.",
                "Nível de decibéis 30% acima do tolerável por mais de 20 minutos. Possível perturbação da ordem.",
                "Objeto estático (veículo) na via por tempo superior a 2 horas. Verificação pendente.",
                "Velocidade média da via caiu para 15km/h. Padrão não habitual para o horário.",
                "Circuito de iluminação LED apagado. Risco de segurança aumentado no quarteirão.",
                "Desvio atípico na movimentação de pedestres monitorada por visão computacional."
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
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
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

    // Gráfico: Distribuição por Severidade (Doughnut) — Exclusivamente Crítico, Médio e Baixo
    const ctxSeverity = document.getElementById('severityChart');
    if (ctxSeverity) {
        severityChartInstance = new Chart(ctxSeverity, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Médio', 'Baixo'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#ef4444', // Red (Crítico)
                        '#3b82f6', // Blue (Médio)
                        '#10b981'  // Green (Baixo)
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
