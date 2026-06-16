document.addEventListener('DOMContentLoaded', () => {
    // Inicializar ícones
    lucide.createIcons();

    // Toggle Sidebar
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Relógio em tempo real
    const liveClock = document.getElementById('liveClock');
    if (liveClock) {
        setInterval(() => {
            const now = new Date();
            liveClock.textContent = now.toLocaleTimeString('pt-BR');
        }, 1000);
    }

    // Configurações globais do Chart.js
    Chart.defaults.color = '#8b9dc3';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    const tooltipBackground = 'rgba(6, 10, 20, 0.9)';

    // Gráfico: Previsão vs Realidade (Line Chart)
    const ctxPrediction = document.getElementById('predictionChart');
    if (ctxPrediction) {
        const labels = Array.from({length: 30}, (_, i) => `Dia ${i+1}`);
        const actualData = Array.from({length: 30}, () => Math.floor(Math.random() * 50) + 100);
        const predictedData = actualData.map(val => val + (Math.random() * 20 - 10));

        new Chart(ctxPrediction, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ocorrências Reais',
                        data: actualData,
                        borderColor: '#00e5ff',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Previsão (LSTM)',
                        data: predictedData,
                        borderColor: '#a855f7',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { backgroundColor: tooltipBackground, padding: 12 }
                },
                scales: {
                    x: { grid: { color: gridColor } },
                    y: { grid: { color: gridColor }, beginAtZero: false }
                }
            }
        });
    }

    // Gráfico: Precisão Histórica
    const ctxPrecision = document.getElementById('precisionChart');
    if (ctxPrecision) {
        new Chart(ctxPrecision, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Acurácia Média (%)',
                    data: [89.5, 91.2, 92.8, 93.5, 94.8, 95.3],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: gridColor }, min: 80, max: 100 }
                }
            }
        });
    }

    // Gráfico: Matriz de Confusão (Representada como Bar Chart horizontal)
    const ctxConfusion = document.getElementById('confusionChart');
    if (ctxConfusion) {
        new Chart(ctxConfusion, {
            type: 'bar',
            data: {
                labels: ['Verdadeiro Positivo', 'Falso Positivo', 'Verdadeiro Negativo', 'Falso Negativo'],
                datasets: [{
                    label: 'Registros',
                    data: [8450, 312, 12400, 180],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)', // Green
                        'rgba(245, 158, 11, 0.8)', // Yellow
                        'rgba(59, 130, 246, 0.8)', // Blue
                        'rgba(239, 68, 68, 0.8)'   // Red
                    ]
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

    // Gráfico: Comparativo de Modelos
    const ctxComparison = document.getElementById('comparisonChart');
    if (ctxComparison) {
        new Chart(ctxComparison, {
            type: 'radar',
            data: {
                labels: ['Acurácia', 'Velocidade', 'Robustez', 'Escalabilidade', 'Interpretabilidade'],
                datasets: [
                    {
                        label: 'CNN',
                        data: [96, 90, 85, 80, 70],
                        borderColor: '#00e5ff',
                        backgroundColor: 'rgba(0, 229, 255, 0.2)',
                    },
                    {
                        label: 'LSTM',
                        data: [94, 85, 88, 75, 60],
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: '#8b9dc3' },
                        ticks: { display: false }
                    }
                }
            }
        });
    }
});
