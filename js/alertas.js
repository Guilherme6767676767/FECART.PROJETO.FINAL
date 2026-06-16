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
                    <div class="alert-item">
                        <div class="${iconClass}">
                            <i data-lucide="${alert.icon}"></i>
                        </div>
                        <div class="alert-item-content">
                            <h5>${alert.title}</h5>
                            <p>${alert.desc}</p>
                        </div>
                        <div class="alert-item-time">${alert.time}</div>
                    </div>
                `;
                alertListContainer.insertAdjacentHTML('beforeend', alertHTML);
            }
        });
        
        alertCountElement.textContent = count;
        lucide.createIcons();
    }

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
