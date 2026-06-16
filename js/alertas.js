document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // Toggle Sidebar
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    const liveClock = document.getElementById('liveClock');
    if (liveClock) {
        setInterval(() => {
            liveClock.textContent = new Date().toLocaleTimeString('pt-BR');
        }, 1000);
    }

    // Dados Simulados de Alertas
    const alertsData = [
        { id: 1, type: 'critical', title: 'Acidente Grave na Av. Paulista', desc: 'Múltiplos veículos envolvidos. Interdição total da via no sentido Consolação.', time: 'Agora', icon: 'alert-octagon' },
        { id: 2, type: 'high', title: 'Alagamento Iminente', desc: 'Sensor IoT detectou aumento rápido do nível d\'água na Marginal Tietê (Ponte das Bandeiras).', time: '10 min atrás', icon: 'waves' },
        { id: 3, type: 'critical', title: 'Suspeita de Assalto em Progresso', desc: 'Padrão detectado pelas câmeras CNN na região da Sé. Viaturas acionadas.', time: '15 min atrás', icon: 'shield-alert' },
        { id: 4, type: 'medium', title: 'Congestionamento Atípico', desc: 'Trânsito 40% acima da média histórica para o horário na Radial Leste.', time: '22 min atrás', icon: 'car' },
        { id: 5, type: 'low', title: 'Falha em Semáforo', desc: 'Semáforo inoperante no cruzamento da Faria Lima com Rebouças.', time: '35 min atrás', icon: 'traffic-cone' },
        { id: 6, type: 'high', title: 'Aglomeração Detectada', desc: 'Concentração não prevista de pessoas no Largo da Batata.', time: '45 min atrás', icon: 'users' },
        { id: 7, type: 'medium', title: 'Queda de Árvore', desc: 'Via parcialmente obstruída na Rua Augusta.', time: '1h atrás', icon: 'alert-triangle' },
        { id: 8, type: 'low', title: 'Sensor Offline', desc: 'Perda de conexão com sensor climático na zona norte.', time: '1h 15m atrás', icon: 'wifi-off' },
        { id: 9, type: 'high', title: 'Risco de Incêndio', desc: 'Câmera térmica detectou foco de calor anormal em galpão na Mooca.', time: '1h 30m atrás', icon: 'flame' },
        { id: 10, type: 'critical', title: 'Evasão de Pedágio / Veículo Roubado', desc: 'Leitura de placa (LPR) confirmou veículo com queixa de roubo na Dutra.', time: '2h atrás', icon: 'camera' },
        { id: 11, type: 'medium', title: 'Poluição Atmosférica Elevada', desc: 'Índice de qualidade do ar ruim detectado na região central.', time: '2h 10m atrás', icon: 'wind' },
        { id: 12, type: 'low', title: 'Manutenção Preventiva', desc: 'Equipe em via na Av. Brasil. Trânsito lento.', time: '3h atrás', icon: 'tool' }
    ];

    const alertListContainer = document.getElementById('alertList');
    const alertCountElement = document.getElementById('alertCount');

    // Função para renderizar alertas
    function renderAlerts(filterType = 'all') {
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
                            <button class="btn-acknowledge" onclick="acknowledgeAlert(${alert.id})">
                                <i data-lucide="check" style="width:14px;height:14px"></i> Reconhecer
                            </button>
                        </div>
                    </div>
                `;
                alertListContainer.insertAdjacentHTML('beforeend', alertHTML);
            }
        });
        
        alertCountElement.textContent = count;
        lucide.createIcons();
    }

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

    const regions = ["Avenida Paulista", "Marginal Tietê", "Centro Histórico", "Zona Sul (Berrini)", "Radial Leste", "Vila Madalena", "Faria Lima"];

    setInterval(() => {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (!activeFilterBtn) return;
        const currentFilter = activeFilterBtn.getAttribute('data-filter');
        
        // Probabilidade de gerar os tipos de alertas
        const randomNum = Math.random();
        let randomType = 'low';
        if (randomNum > 0.90) randomType = 'critical'; // 10% chance
        else if (randomNum > 0.70) randomType = 'high'; // 20% chance
        else if (randomNum > 0.40) randomType = 'medium'; // 30% chance
        // senão 40% low

        // Só adiciona se o filtro atual permitir
        if (currentFilter !== 'all' && currentFilter !== randomType) return;

        const newId = Date.now();
        const icons = { critical: 'alert-octagon', high: 'waves', medium: 'car', low: 'tool' };
        
        // IA "pensando" e gerando conteúdo dinâmico
        const db = aiGenerators[randomType];
        const randomTitle = db.titles[Math.floor(Math.random() * db.titles.length)];
        const randomSource = db.sources[Math.floor(Math.random() * db.sources.length)];
        const randomDetail = db.details[Math.floor(Math.random() * db.details.length)];
        const randomRegion = regions[Math.floor(Math.random() * regions.length)];
        
        const description = `[${randomSource}] ${randomDetail} — Local: ${randomRegion}.`;

        const alertHTML = `
            <div class="alert-item" id="alert-item-${newId}">
                <div class="alert-item-icon ${randomType}">
                    <i data-lucide="${icons[randomType]}"></i>
                </div>
                <div class="alert-item-content">
                    <h5>${randomTitle}</h5>
                    <p>${description}</p>
                </div>
                <div class="alert-item-time">Gerado Agora</div>
                <div class="alert-item-actions">
                    <button class="btn-acknowledge" onclick="acknowledgeAlert(${newId})">
                        <i data-lucide="check" style="width:14px;height:14px"></i> Reconhecer
                    </button>
                </div>
            </div>
        `;
        alertListContainer.insertAdjacentHTML('afterbegin', alertHTML);
        lucide.createIcons();
        
        const countEl = document.getElementById('alertCount');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
        
    }, 8500);

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
            renderAlerts(filterType);
        });
    });

    // Gráficos Chart.js
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
        new Chart(ctxRegion, {
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
        new Chart(ctxSeverity, {
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
});
