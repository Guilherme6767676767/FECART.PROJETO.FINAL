import React from 'react';
import { useSentinelData } from './hooks/useSentinelData';
import { Header } from './components/Header';
import { QuickStats } from './components/QuickStats';
import { WeatherCard } from './components/WeatherCard';
import { OcorrenciasTable } from './components/OcorrenciasTable';
import { RiskMapOverview } from './components/RiskMapOverview';
import { WifiOff } from 'lucide-react';

export const App: React.FC = () => {
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
  } = useSentinelData();

  return (
    <div className="sentinel-app">
      {/* Cabeçalho Principal */}
      <Header 
        lastUpdated={clima?.atualizado_em || 'Sincronizado'} 
        isLive={!errorClima && !errorBOs}
      />

      <main className="dashboard-content">
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

        {/* Métricas Rápidas */}
        <QuickStats resumo={resumo} loading={loadingBOs} />

        {/* Grid Principal: Clima & Zonas Urbanas */}
        <div className="dashboard-primary-grid">
          {/* Card de Clima em Tempo Real */}
          <div className="grid-col-weather">
            <WeatherCard 
              data={clima} 
              loading={loadingClima} 
              onRefresh={refetchClima} 
            />
          </div>

          {/* Visão Geral das Zonas de Interesse (AOIs) */}
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

      {/* Rodapé Institucional */}
      <footer className="sentinel-footer">
        <p>Sentinel IA — Plataforma de Inteligência Geoespacial Urbana e Segurança Pública de São Paulo</p>
        <p className="footer-sub">Desenvolvido com FastAPI (Python) & React (TypeScript) • Integração SSP-SP e Open-Meteo Telemetry</p>
      </footer>
    </div>
  );
};

export default App;
