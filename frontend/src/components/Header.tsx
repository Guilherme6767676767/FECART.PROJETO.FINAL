import React from 'react';
import { Shield, Activity, Cpu } from 'lucide-react';

interface Props {
  lastUpdated?: string;
  isLive?: boolean;
}

export const Header: React.FC<Props> = ({ lastUpdated = 'Ao Vivo', isLive = true }) => {
  return (
    <header className="sentinel-header">
      <div className="header-brand">
        <div className="brand-logo">
          <Shield size={26} className="text-cyan-400" />
        </div>
        <div>
          <div className="brand-title-wrap">
            <h1 className="brand-title">SENTINEL IA</h1>
            <span className="brand-badge">SÃO PAULO CORE v3.5</span>
          </div>
          <p className="brand-subtitle">
            Sistema Integrado de Inteligência Preditiva Urbana, Clima e Segurança Pública
          </p>
        </div>
      </div>

      <div className="header-status-group">
        <div className="status-pill">
          <span className={`status-dot ${isLive ? 'online' : 'offline'}`} />
          <span>{isLive ? 'TELEMETRIA ATIVA' : 'MODO LOCAL'}</span>
        </div>

        <div className="status-pill time-pill">
          <Activity size={14} className="text-indigo-400" />
          <span>Sync: {lastUpdated}</span>
        </div>

        <div className="status-pill ai-pill">
          <Cpu size={14} className="text-emerald-400" />
          <span>MOTOR PREDITIVO SP</span>
        </div>
      </div>
    </header>
  );
};
