import React from 'react';
import { LayoutDashboard, MapPinned, BrainCircuit } from 'lucide-react';

export type TabId = 'dashboard' | 'simulador' | 'analise';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  simulationCount?: number;
}

export const NavigationTabs: React.FC<Props> = ({ 
  activeTab, 
  onTabChange,
  simulationCount = 0
}) => {
  return (
    <nav className="sentinel-nav-tabs">
      <button
        className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard Geral</span>
      </button>

      <button
        className={`nav-tab-btn ${activeTab === 'simulador' ? 'active' : ''}`}
        onClick={() => onTabChange('simulador')}
      >
        <MapPinned size={18} />
        <span>Mapa & Simulador Urbano</span>
        {simulationCount > 0 && (
          <span className="tab-badge-pulse">{simulationCount} ativo(s)</span>
        )}
      </button>

      <button
        className={`nav-tab-btn ${activeTab === 'analise' ? 'active' : ''}`}
        onClick={() => onTabChange('analise')}
      >
        <BrainCircuit size={18} />
        <span>Inteligência Preditiva IA</span>
      </button>
    </nav>
  );
};
