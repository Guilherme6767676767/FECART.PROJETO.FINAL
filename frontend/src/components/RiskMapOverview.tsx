import React from 'react';
import { Layers, Radio } from 'lucide-react';

export const RiskMapOverview: React.FC = () => {
  const zones = [
    { code: 'AOI-01', name: 'Centro Histórico & Sé', risk: 'CRÍTICO', score: 92, cameras: 120, color: '#ef4444' },
    { code: 'AOI-02', name: 'Av. Paulista & Bela Vista', risk: 'MÉDIO', score: 68, cameras: 84, color: '#f59e0b' },
    { code: 'AOI-03', name: 'Vila Olímpia & Faria Lima', risk: 'BAIXO', score: 24, cameras: 96, color: '#10b981' },
    { code: 'AOI-04', name: 'Marginal Tietê & Lapa', risk: 'ALTO', score: 81, cameras: 64, color: '#a855f7' },
  ];

  return (
    <div className="risk-map-overview">
      <div className="map-overview-header">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          <h3 className="overview-title">Zonas Prioritárias de Monitoramento (AOIs)</h3>
        </div>
        <span className="live-indicator">
          <Radio size={12} className="animate-pulse text-emerald-400" />
          4 Setores Mapeados
        </span>
      </div>

      <div className="aoi-cards-grid">
        {zones.map((z) => (
          <div key={z.code} className="aoi-mini-card" style={{ borderLeftColor: z.color }}>
            <div className="aoi-card-top">
              <span className="aoi-code">{z.code}</span>
              <span className="aoi-risk-badge" style={{ backgroundColor: `${z.color}22`, color: z.color, borderColor: z.color }}>
                {z.risk}
              </span>
            </div>
            <div className="aoi-name">{z.name}</div>
            <div className="aoi-metrics">
              <span>Score de Risco: <strong>{z.score}/100</strong></span>
              <span>•</span>
              <span><strong>{z.cameras}</strong> câmeras OCR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
