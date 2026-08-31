import React from 'react';
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  RefreshCw, 
  Sun, 
  Cloud, 
  Zap, 
  CheckCircle,
  Clock
} from 'lucide-react';
import type { WeatherData } from '../types/sentinel';

interface Props {
  data: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const WeatherCard: React.FC<Props> = ({ data, loading, onRefresh }) => {
  if (loading && !data) {
    return (
      <div className="weather-card loading-card">
        <div className="skeleton-line" style={{ width: '40%', height: '20px', marginBottom: '16px' }} />
        <div className="skeleton-line" style={{ width: '60%', height: '48px', marginBottom: '24px' }} />
        <div className="skeleton-line" style={{ width: '100%', height: '80px' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="weather-card empty-card">
        <p>Telemetria climática temporariamente indisponível.</p>
        <button onClick={onRefresh} className="btn-retry">Tentar Novamente</button>
      </div>
    );
  }

  const isRiscoCritico = data.alerta_risco.includes('CRÍTICO');
  const isRiscoAlto = data.alerta_risco.includes('ALTO');
  const isRiscoMedio = data.alerta_risco.includes('MÉDIO');

  const getRiscoClass = () => {
    if (isRiscoCritico) return 'risk-critico';
    if (isRiscoAlto) return 'risk-alto';
    if (isRiscoMedio) return 'risk-medio';
    return 'risk-baixo';
  };

  const getWeatherIcon = () => {
    if (data.icone === 'zap') return <Zap size={32} className="text-yellow-400" />;
    if (data.icone === 'cloud-rain' || data.precipitacao_mm > 0) return <CloudRain size={32} className="text-cyan-400" />;
    if (data.icone === 'sun') return <Sun size={32} className="text-amber-400" />;
    return <Cloud size={32} className="text-blue-300" />;
  };

  return (
    <div className={`weather-card ${getRiscoClass()}`}>
      <div className="weather-header">
        <div className="weather-city-info">
          <span className="section-tag">TELEMETRIA METEOROLÓGICA</span>
          <h2 className="city-name">{data.cidade}</h2>
        </div>

        <button 
          onClick={onRefresh} 
          disabled={loading} 
          className="refresh-btn"
          title="Forçar sincronização de clima"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      <div className="weather-main">
        <div className="temp-display">
          <span className="temp-number">{data.temperatura}°</span>
          <span className="temp-unit">C</span>
        </div>

        <div className="weather-icon-badge">
          {getWeatherIcon()}
          <div className="weather-desc-wrap">
            <span className="weather-desc">{data.condicao}</span>
            <span className="weather-feels">Sensação térmica de {data.sensacao_termica}°C</span>
          </div>
        </div>
      </div>

      {/* Grid com indicadores essenciais */}
      <div className="weather-metrics">
        <div className="metric-box">
          <div className="metric-header">
            <Droplets size={15} className="metric-icon text-cyan-400" />
            <span>Umidade</span>
          </div>
          <span className="metric-val">{data.umidade}%</span>
          <span className="metric-sub">{data.umidade < 30 ? 'Ar Seco (Atenção)' : 'Nível Normal'}</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <Wind size={15} className="metric-icon text-emerald-400" />
            <span>Vento</span>
          </div>
          <span className="metric-val">{data.vento_kmh} <small>km/h</small></span>
          <span className="metric-sub">{data.vento_kmh > 40 ? 'Rajadas Fortes' : 'Brisa Moderada'}</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <CloudRain size={15} className="metric-icon text-blue-400" />
            <span>Chuva</span>
          </div>
          <span className="metric-val">{data.precipitacao_mm} <small>mm</small></span>
          <span className="metric-sub">{data.precipitacao_mm > 0 ? 'Precipitação Ativa' : 'Sem Chuva Recente'}</span>
        </div>
      </div>

      {/* Risco Urbano Preditivo */}
      <div className="urban-risk-banner">
        <div className="risk-banner-left">
          {isRiscoCritico || isRiscoAlto ? (
            <AlertTriangle size={18} className="risk-icon" />
          ) : (
            <CheckCircle size={18} className="risk-icon" />
          )}
          <div>
            <div className="risk-title">Risco Climático Preditivo</div>
            <div className="risk-desc">{data.alerta_risco}</div>
          </div>
        </div>
        <span className="risk-pill-badge">{isRiscoCritico ? 'ALERTA MÁXIMO' : 'MONITORAMENTO'}</span>
      </div>

      {/* Rodapé com auditoria da fonte */}
      <div className="weather-footer">
        <span className="telemetry-source">
          Provedor: <strong>{data.fonte}</strong>
        </span>
        <span className="telemetry-sync">
          <Clock size={12} /> {data.atualizado_em}
        </span>
      </div>
    </div>
  );
};
