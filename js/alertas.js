<<<<<<< HEAD
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
        const updateClock = () => {
            liveClock.textContent = new Date().toLocaleTimeString('pt-BR');
        };
        updateClock();
        setInterval(updateClock, 1000);
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
                desc: `${item.municipio} • ${item.local}`,
                time: `${item.data} ${item.hora}`,
                icon: item.severidade === 'critical' ? 'alert-octagon' : item.severidade === 'high' ? 'shield-alert' : item.severidade === 'medium' ? 'alert-triangle' : 'file-warning',
                locationName: `${item.local}, ${item.municipio}`
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

    // Função Global de Navegação para o Mapa
    window.viewAlertOnMap = function(lat, lng, locationName) {
        if (window.event) window.event.stopPropagation();
        window.location.href = `mapa.html?lat=${lat}&lng=${lng}&search=${encodeURIComponent(locationName)}`;
    };

    window.viewRealAlertOnMap = function(id) {
        if (window.event) window.event.stopPropagation();
        window.location.href = `mapa.html?realId=${encodeURIComponent(id)}`;
    };

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
            alertListContainer.innerHTML = '<div class="empty-state" role="status" aria-live="polite"><h5>Nenhum alerta encontrado</h5><p>Nenhum alerta corresponde aos filtros selecionados. Tente outro nível de severidade ou período.</p></div>';
        }
        if (alertCountElement) alertCountElement.textContent = count;
        const visibleAlerts = alertsData.filter(alert => filterType === 'all' || alert.type === filterType);
        atualizarResumoAlertas(visibleAlerts);
        const sidebarCount = document.getElementById('alertSidebarCount');
        if (sidebarCount) sidebarCount.textContent = alertsData.length;
        if (window.lucide) lucide.createIcons();
    }

    function atualizarResumoAlertas(items) {
        const set = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        set('summaryShown', items.length);
        set('summaryCritical', items.filter(item => item.type === 'critical').length);
        set('summaryMedium', items.filter(item => item.type === 'medium').length);
        set('summaryLow', items.filter(item => item.type === 'low').length);
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

});
=======
/* Fonte única: dados fornecidos. Coordenadas só surgem após geocodificação confirmada. */
(function(){'use strict';
const linhas=[
['04/07/2026','Bom Sucesso de Itararé','Atropelamento fatal','crítico'],['08/07/2026','São Paulo, Rua Augusta, Centro','Morte de GCM','crítico'],['10/07/2026','São Paulo','Confronto policial','crítico'],['10/07/2026','Pinheiros/Vila Madalena','Advogado foi encontrado morto','crítico'],['11/07/2026','Zona Sul / Rio Guarapiranga','Feminicídio e ocultação de cadáver','crítico'],['15/07/2026','Barra Funda','Homem foi encontrado morto','crítico'],['16/07/2026','Carapicuíba','Sequestro e homicídio','crítico'],['20/07/2026','Capão Redondo','Prisão relacionada à investigação de homicídio','crítico'],['21/07/2026','Av. Ibirapuera, Zona Sul','Atropelamento fatal','crítico'],['23/07/2026','Av. Nove de Julho','Atropelamento fatal','crítico'],['26/07/2026','Campinas, Rodovia Adhemar de Barros','Acidente rodoviário','médio'],['26/07/2026','Barra Funda, Rua do Bosque','Atropelamento fatal','crítico'],['27/07/2026','Planalto Paulista','Perseguição policial e acidente','médio'],['31/07/2026','Penápolis, Parque dos Girassóis','Confronto policial','crítico'],['31/07/2026','Vila Jacuí, Zona Leste','Tentativa de feminicídio','médio'],['02/08/2026','Parque Santo Antônio, Zona Sul','Cárcere privado e violência sexual','médio'],['03/08/2026','Viaduto Dona Matilde, Zona Leste','Atropelamento fatal','crítico'],['03/08/2026','Marília, Zona Sul','Homicídio','crítico'],['04/08/2026','Linhas 11, 12 e 13 da CPTM','Greve afetou três linhas','médio'],['07/08/2026','Jundiaí, Rodovia Anhanguera','Atropelamento fatal durante fuga','crítico'],['07/08/2026','Ourinhos, SP-270','Acidente rodoviário','médio'],['09/08/2026','Ribeirão Preto, SP-333','Acidente rodoviário','médio'],['10/08/2026','Artur Alvim, Zona Leste','Homem foi sequestrado com falsa viatura','médio'],['10/08/2026',"Santa Bárbara d'Oeste",'Acidente de trânsito','baixo'],['10/08/2026','São José do Rio Preto, SP-425','Atropelamento fatal','crítico'],['11/08/2026','Cambuci, Av. do Estado','Incêndio atingiu uma estrutura','baixo'],['11/08/2026','Cambuci, Rua Silveira da Mota','Incêndio atingiu um galpão','baixo'],['11/08/2026','Zona Leste','Quatro pessoas foram presas por golpes digitais','baixo'],['15/08/2026','Sarapuí','Tentativa de feminicídio','médio'],['18/08/2026','Vargem, Rodovia Fernão Dias','Queda de passarela','baixo'],['19/08/2026','Capivari, Jardim Florido','Homicídio','crítico'],['23/08/2026','Joanópolis','Tentativa de homicídio','médio'],['24/08/2026','São Paulo','Operação contra rede de receptadores de alianças roubadas','baixo'],['27/08/2026','Penha, Av. Governador Carvalho Pinto','Atropelamento fatal','crítico'],['29/08/2026','Itaquaquecetuba, Jardim Nova Louzada','Acidente de trabalho fatal','crítico'],['29/08/2026','São José dos Campos, Bairro dos Freitas','Homicídio','crítico'],['30/08/2026','Araçatuba','Morte em abordagem policial','crítico'],['30/08/2026','Jardim Castro Alves, Zona Sul','Homicídio','crítico'],['30/08/2026','Botucatu','Morte por ataque de abelhas','crítico'],['01/09/2026','Vila Madalena','Tentativa de roubo a uma farmácia','médio'],['02/09/2026','Perdizes','Tentativa de roubo a uma farmácia','médio'],['03/09/2026','Araras, Jardim Cândida','Confronto policial','crítico'],['03/09/2026','São Vicente','Atropelamento fatal','crítico'],['05/09/2026','Moema, Av. Rouxinol','Árvore caiu sobre um veículo','baixo'],['05/09/2026','Araraquara, Jardim Salto Grande','Afogamento e morte suspeita','crítico'],['06/09/2026','Vila Maria, Comunidade do Verde','Incêndio atingiu moradias','baixo'],['06/09/2026','Capão Redondo, Conjunto Pirajussara','Homem morreu após ser baleado em intervenção policial','crítico'],['06/09/2026','Capão Redondo','Morte em abordagem policial','crítico'],['06/09/2026','Sapopemba, Rua Aurélio Neves','Casa desabou','baixo'],['06/09/2026','Embu das Artes, Chácaras Bartira','Morte suspeita em investigação','crítico'],['07/09/2026','Ribeirão Preto','Homicídio em investigação','crítico'],['08/09/2026','São Vicente, Av. Pérsio de Queirós Filho','Homicídio/latrocínio','crítico'],['11/09/2026','Grande São Paulo','Chuvas causaram mortes','crítico'],['12/09/2026','Penha, Rua Tequeci','Desabamento de prédio deixou mortos','crítico'],['12/09/2026','Jandira','Pessoas foram arrastadas por enxurrada','médio'],['12/09/2026','Jabaquara','Moradias desabaram','baixo'],['12/09/2026','Mogi das Cruzes, SP-066','Queda de barreira interditou a via','baixo'],['12/09/2026','Vila Granada, Zona Leste','Desabamento','baixo'],['12/09/2026','Marginal Tietê','Pistas foram bloqueadas','baixo'],['12/09/2026','Marginal Pinheiros','Faixas foram bloqueadas','baixo'],['12/09/2026','Ipiranga','Alerta de transbordamento','baixo'],['12/09/2026','São Paulo','Alagamentos e incêndio em subestação','baixo'],['13/09/2026','Av. Paulista','Acidente de trânsito','baixo'],['14/09/2026','São Bernardo do Campo, Ferrazópolis','Chuva causou desabamento parcial de uma casa','baixo'],['14/09/2026','Campinas, Região Norte','Confronto policial','crítico'],['15/09/2026','Santos, Zona Portuária','Morte suspeita em investigação','crítico'],['17/09/2026','Jardim Cachoeira, Zona Norte','Estudante foi morta a tiros','crítico'],['18/09/2026','Ipiranga','Homem morreu após ser baleado por policial militar','crítico'],['18/09/2026','Capão Redondo','Suspeito morreu baleado durante tentativa de roubo','crítico']];
const alertas=linhas.map(([data,local,descricao,gravidade],i)=>({id:`ALT-${String(i+1).padStart(3,'0')}`,data,local,titulo:descricao,descricao,gravidade}));const cores={'crítico':'#ef4444','médio':'#f59e0b','baixo':'#38bdf8'},rotulos={'crítico':'Crítico','médio':'Médio','baixo':'Baixo'},esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));window.SentinelAlertas={dados:alertas,cores,rotulos,esc,porGravidade:g=>alertas.filter(a=>a.gravidade===g)};
function render(){const lista=document.querySelector('[data-alertas-lista]');if(!lista)return;const ativos=new Set(['crítico','médio','baixo']);document.querySelectorAll('[data-filtro-alerta]').forEach(b=>b.onclick=()=>{const n=b.dataset.filtroAlerta;ativos.has(n)?ativos.delete(n):ativos.add(n);b.classList.toggle('is-off',!ativos.has(n));sessionStorage.setItem('sentinel-filtros',JSON.stringify([...ativos]));desenhar()});function desenhar(){const v=alertas.filter(a=>ativos.has(a.gravidade)),c=document.querySelector('[data-alertas-contagem]');if(c)c.textContent=`${v.length} alertas ativos`;lista.innerHTML=v.map(a=>`<button class="alert-card" data-alerta-id="${a.id}"><span class="severity-dot ${a.gravidade}"></span><div><span class="eyebrow">${esc(a.data)} · ${esc(rotulos[a.gravidade])}</span><h3>${esc(a.descricao)}</h3><small>${esc(a.local)}</small></div></button>`).join('');lista.querySelectorAll('[data-alerta-id]').forEach(b=>b.onclick=()=>location.href=`mapa.html#alert=${b.dataset.alertaId}`)}desenhar()}document.addEventListener('DOMContentLoaded',render);
})();
>>>>>>> d4b95d1c7f94dd338f252adcade4ca4a84187355
