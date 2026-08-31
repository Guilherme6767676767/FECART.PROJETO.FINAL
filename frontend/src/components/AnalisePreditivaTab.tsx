import React from 'react';
import { BrainCircuit, TrendingUp, ShieldAlert, BarChart3, CheckCircle2 } from 'lucide-react';
import type { ResumoEstatistico, WeatherData } from '../types/sentinel';
import { SP_AOI_ZONES } from '../services/api';

interface Props {
  resumo: ResumoEstatistico | null;
  clima: WeatherData | null;
}

export const AnalisePreditivaTab: React.FC<Props> = ({ resumo, clima }) => {
  const isChuva = (clima?.precipitacao_mm || 0) > 0 || (clima?.condicao.toLowerCase().includes('chuva') ?? false);
  const totalBOs = resumo?.total_ocorrencias || 0;
  const focoBairro = resumo?.bairro_mais_afetado || 'Sé';

  return (
    <div className="analise-tab-content">
      {/* Top Banner de Diagnóstico Preditivo */}
      <div className="analise-header-card">
        <div className="analise-header-left">
          <div className="analise-icon-badge">
            <BrainCircuit size={28} className="text-cyan-400" />
          </div>
          <div>
            <span className="analise-tag">MOTOR DE CORRELAÇÃO MULTIVARIÁVEL</span>
            <h2 className="analise-title">Diagnóstico Preditivo Urbano — São Paulo</h2>
            <p className="analise-desc">
              Cruzamento de telemetria climática em tempo real com base da SSP-SP ({totalBOs} registros processados, foco principal: {focoBairro}).
            </p>
          </div>
        </div>

        <div className="analise-score-pill">
          <span className="text-xs text-slate-400 font-semibold">Índice Geral de Risco</span>
          <span className="text-3xl font-extrabold text-amber-400">
            {isChuva ? '78/100' : '42/100'}
          </span>
          <span className="text-xs text-emerald-400">
            {isChuva ? '⚠️ Fator Climático Agravante' : '🟢 Condições Normais'}
          </span>
        </div>
      </div>

      {/* Grid de Modelos e Matrizes */}
      <div className="analise-grid">
        {/* Card 1: Correlação Clima x Mobilidade x Segurança */}
        <div className="analise-card">
          <div className="analise-card-header">
            <TrendingUp size={18} className="text-cyan-400" />
            <h3>Correlação Meteorológica & Tráfego</h3>
          </div>
          <div className="analise-card-body">
            <div className="correlation-item">
              <span className="corr-label">Sensibilidade a Alagamento (Marginal / Lapa):</span>
              <div className="progress-bar-wrap">
                <div className="progress-fill" style={{ width: isChuva ? '92%' : '25%', backgroundColor: '#06b6d4' }} />
              </div>
              <span className="corr-val">{isChuva ? 'CRÍTICA (92%)' : 'BAIXA (25%)'}</span>
            </div>

            <div className="correlation-item">
              <span className="corr-label">Risco de Lentidão em Corredores Financeiros:</span>
              <div className="progress-bar-wrap">
                <div className="progress-fill" style={{ width: '68%', backgroundColor: '#f59e0b' }} />
              </div>
              <span className="corr-val">MÉDIA (68%)</span>
            </div>

            <div className="correlation-item">
              <span className="corr-label">Probabilidade de Furtos em Aglomerações (Sé / Paulista):</span>
              <div className="progress-bar-wrap">
                <div className="progress-fill" style={{ width: '84%', backgroundColor: '#ef4444' }} />
              </div>
              <span className="corr-val">ALTA (84%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Recomendações Táticas Automatizadas */}
        <div className="analise-card">
          <div className="analise-card-header">
            <ShieldAlert size={18} className="text-indigo-400" />
            <h3>Playbook de Mitigação Preditiva</h3>
          </div>
          <div className="analise-card-body">
            <ul className="playbook-list">
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <strong>Reprogramação Semafórica Prévia</strong>
                  <p className="text-xs text-slate-400">Ampliar tempo de verde na saída da Av. Paulista para a Consolação.</p>
                </div>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <strong>Posicionamento de Viaturas em Nós Estratégicos</strong>
                  <p className="text-xs text-slate-400">Manter 2 viaturas em ponto fixo no Largo da Sé e Praça da República.</p>
                </div>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <strong>Monitoramento Pluviométrico IoT</strong>
                  <p className="text-xs text-slate-400">Sensores na Marginal Tietê reportando dados a cada 30 segundos.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa de Zonas de Interesse (AOIs) */}
      <div className="analise-card mt-4">
        <div className="analise-card-header">
          <BarChart3 size={18} className="text-emerald-400" />
          <h3>Matriz de Vulnerabilidade por Zona Geoespacial (AOI)</h3>
        </div>
        <div className="table-responsive">
          <table className="sentinel-table">
            <thead>
              <tr>
                <th>Código AOI</th>
                <th>Nome do Setor</th>
                <th>Score de Risco</th>
                <th>Nível de Atenção</th>
                <th>Câmeras OCR</th>
                <th>Sensores IoT</th>
                <th>Ação Recomendada</th>
              </tr>
            </thead>
            <tbody>
              {SP_AOI_ZONES.map((zone) => (
                <tr key={zone.code} className="table-row">
                  <td className="font-mono font-bold text-cyan-400">{zone.code}</td>
                  <td><strong>{zone.name}</strong></td>
                  <td>
                    <span className="font-bold">{zone.riskScore}</span> / 100
                  </td>
                  <td>
                    <span 
                      style={{ 
                        backgroundColor: `${zone.color}22`, 
                        color: zone.color, 
                        borderColor: zone.color,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '11px',
                        border: '1px solid'
                      }}
                    >
                      {zone.riskLevel}
                    </span>
                  </td>
                  <td>{zone.activeCameras} unid.</td>
                  <td>{zone.activeSensors} unid.</td>
                  <td className="text-slate-300 text-xs">{zone.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
