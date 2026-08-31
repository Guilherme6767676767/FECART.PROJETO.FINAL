import React, { useState } from 'react';
import { useSentinelData } from './hooks/useSentinelData';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import type { TabId } from './components/NavigationTabs';
import { QuickStats } from './components/QuickStats';
import { WeatherCard } from './components/WeatherCard';
import { OcorrenciasTable } from './components/OcorrenciasTable';
import { RiskMapOverview } from './components/RiskMapOverview';
import { InteractiveMap } from './components/InteractiveMap';
import { SimulationPanel } from './components/SimulationPanel';
import { AnalisePreditivaTab } from './components/AnalisePreditivaTab';
import { WifiOff, Sparkles, MapPin } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const {
    clima,
    loadingClima,
    errorClima,
    refetchClima,
    ocorrenciasData,
    resumo,
    loadingBOs,
    errorBOs,
    fetchOcorrencias,
    selectedLocation,
    setSelectedLocation,
    dispararSimulacao,
    dispararCenario,
    limparSimulacoes,
    simLoading,
    simulationCount,
  } = useSentinelData();

  return (
    <div className="sentinel-app">
      {/* Cabeçalho Principal */}
      <Header 
        lastUpdated={clima?.atualizado_em || 'Sincronizado'} 
        isLive={!errorClima && !errorBOs}
      />

      {/* Navegação por Abas */}
      <NavigationTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        simulationCount={simulationCount}
      />

      {/* Banner de Aviso caso o backend esteja offline */}
      {(errorClima || errorBOs) && (
        <div className="system-alert-banner">
          <WifiOff size={20} className="text-amber-400" />
          <div>
            <strong>Atenção de Conexão:</strong> O backend FastAPI precisa estar rodando em <code>http://localhost:8000</code>.
            {errorClima && <p className="text-xs text-amber-200 mt-0.5">{errorClima}</p>}
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 1: DASHBOARD GERAL
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <main className="dashboard-content">
          {/* Métricas Rápidas */}
          <QuickStats resumo={resumo} loading={loadingBOs} />

          {/* Grid Principal: Clima & Zonas Urbanas */}
          <div className="dashboard-primary-grid">
            <div className="grid-col-weather">
              <WeatherCard 
                data={clima} 
                loading={loadingClima} 
                onRefresh={refetchClima} 
              />
            </div>

            <div className="grid-col-aois">
              <RiskMapOverview />
            </div>
          </div>

          {/* Tabela de Boletins de Ocorrência (SSP-SP) */}
          <section className="dashboard-section">
            <OcorrenciasTable 
              data={ocorrenciasData} 
              loading={loadingBOs} 
              onFilterChange={fetchOcorrencias}
            />
          </section>
        </main>
      )}

      {/* ========================================================
          ABA 2: MAPA GEOESPACIAL & SIMULADOR URBANO
          ======================================================== */}
      {activeTab === 'simulador' && (
        <main className="simulation-tab-layout">
          {/* Banner de Instruções da Simulação */}
          <div className="sim-intro-banner">
            <div className="flex items-center gap-3">
              <div className="sim-badge-icon">
                <Sparkles size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="sim-intro-title">Laboratório Geoespacial de Simulação Urbana</h2>
                <p className="sim-intro-desc">
                  Interaja diretamente com o mapa de São Paulo, selecione coordenadas e dispare cenários de crise com cálculo preditivo de impacto em tempo real.
                </p>
              </div>
            </div>

            {selectedLocation && (
              <div className="selected-point-pill">
                <MapPin size={14} className="text-cyan-400" />
                <span>Ponto: <strong>{selectedLocation.lat}, {selectedLocation.lng}</strong></span>
              </div>
            )}
          </div>

          {/* Layout em Duas Colunas: Mapa Interativo + Painel de Simulação */}
          <div className="simulation-grid">
            <div className="map-column">
              <InteractiveMap
                ocorrencias={ocorrenciasData?.ocorrencias || []}
                selectedLocation={selectedLocation}
                onMapClick={(lat, lng) => setSelectedLocation({ lat, lng })}
              />
            </div>

            <div className="panel-column">
              <SimulationPanel
                onDispararSimulacao={dispararSimulacao}
                onDispararCenario={dispararCenario}
                onLimparSimulacoes={limparSimulacoes}
                selectedLocation={selectedLocation}
                loading={simLoading}
              />
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          ABA 3: INTELIGÊNCIA PREDITIVA IA
          ======================================================== */}
      {activeTab === 'analise' && (
        <main className="dashboard-content">
          <AnalisePreditivaTab 
            resumo={resumo} 
            clima={clima} 
          />
        </main>
      )}

      {/* Rodapé Institucional */}
      <footer className="sentinel-footer">
        <p>Sentinel IA — Plataforma de Inteligência Geoespacial Urbana e Segurança Pública de São Paulo</p>
        <p className="footer-sub">Desenvolvido com FastAPI (Python) & React (TypeScript) • Integração SSP-SP, Leaflet e Open-Meteo Telemetry</p>
      </footer>
    </div>
  );
};

export default App;
