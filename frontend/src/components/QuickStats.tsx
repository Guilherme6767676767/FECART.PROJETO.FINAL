import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { ResumoEstatistico } from '../types/sentinel';

interface Props {
  resumo: ResumoEstatistico | null;
  loading: boolean;
}

export const QuickStats: React.FC<Props> = ({ resumo, loading }) => {
  if (loading && !resumo) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card skeleton-box" />
        ))}
      </div>
    );
  }

  const total = resumo?.total_ocorrencias || 0;
  const criticas = resumo?.criticas || 0;
  const altas = resumo?.altas || 0;
  const medias = resumo?.medias || 0;

  return (
    <div className="stats-grid">
      <div className="stat-card stat-total">
        <div className="stat-icon-wrap">
          <ShieldAlert size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total de Ocorrências (SSP-SP)</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">Base Georreferenciada</span>
        </div>
      </div>

      <div className="stat-card stat-criticas">
        <div className="stat-icon-wrap">
          <AlertTriangle size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Severidade Crítica</span>
          <span className="stat-value">{criticas}</span>
          <span className="stat-sub">Prioridade de Despacho 1</span>
        </div>
      </div>

      <div className="stat-card stat-altas">
        <div className="stat-icon-wrap">
          <TrendingUp size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Alta Atenção / Alertas</span>
          <span className="stat-value">{altas + medias}</span>
          <span className="stat-sub">Patrulhamento Intensificado</span>
        </div>
      </div>

      <div className="stat-card stat-spotlight">
        <div className="stat-icon-wrap">
          <CheckCircle2 size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Bairro Mais Monitorado</span>
          <span className="stat-value text-base">{resumo?.bairro_mais_afetado || 'Sé / Centro'}</span>
          <span className="stat-sub">{resumo?.tipo_mais_frequente || 'Monitoramento Ativo'}</span>
        </div>
      </div>
    </div>
  );
};
