import React, { useEffect, useState } from 'react';
import { sentinelService } from '../services/api';
import type { WeatherData, OcorrenciaBO } from '../types/sentinel';

export const DashboardData: React.FC = () => {
  const [clima, setClima] = useState<WeatherData | null>(null);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaBO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [bairroFiltro, setBairroFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca paralela com Promise.all
      const [climaRes, ocorrenciasRes] = await Promise.all([
        sentinelService.getClima(),
        sentinelService.getOcorrencias({
          bairro: bairroFiltro || undefined,
          tipo_crime: tipoFiltro || undefined,
          page: 1,
          page_size: 10
        })
      ]);

      setClima(climaRes);
      setOcorrencias(ocorrenciasRes.ocorrencias);
    } catch (err: any) {
      console.error('Erro ao carregar dados do Dashboard:', err);
      setError(err.message || 'Falha ao conectar com a API do Sentinel IA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bairroFiltro, tipoFiltro]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#00e5ff' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}>⏳</div>
        <p>Carregando inteligência urbana de São Paulo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', margin: '1rem 0' }}>
        <h4>⚠️ Erro na Conexão com o Backend</h4>
        <p>{error}</p>
        <button 
          onClick={fetchData} 
          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      {/* 1. Card de Clima */}
      {clima && (
        <div style={{ background: 'rgba(13, 20, 36, 0.8)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#00e5ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {clima.cidade} • Telemetria em Tempo Real
              </span>
              <h2 style={{ margin: '0.25rem 0', color: '#fff' }}>{clima.temperatura}°C — {clima.condicao}</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Sensação: {clima.sensacao_termica}°C | Umidade: {clima.umidade}% | Vento: {clima.vento_kmh} km/h
              </p>
            </div>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', background: clima.alerta_risco === 'CRITICO' ? '#ef4444' : clima.alerta_risco === 'ALTO' ? '#f59e0b' : '#10b981', color: '#fff' }}>
              RISCO: {clima.alerta_risco}
            </div>
          </div>
        </div>
      )}

      {/* 2. Filtros e Tabela de Boletins de Ocorrência */}
      <div style={{ background: 'rgba(13, 20, 36, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem', borderRadius: '12px' }}>
        <h3 style={{ color: '#fff', marginTop: 0 }}>Boletins de Ocorrência (SSP-SP)</h3>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Filtrar por Bairro (ex: Sé, Lapa)..." 
            value={bairroFiltro}
            onChange={(e) => setBairroFiltro(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', background: '#060a14', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', flex: 1 }}
          />
          <input 
            type="text" 
            placeholder="Filtrar por Crime (ex: Furto, Roubo)..." 
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', background: '#060a14', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', flex: 1 }}
          />
        </div>

        {/* Tabela */}
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Nº BO</th>
              <th style={{ padding: '0.75rem' }}>Tipo de Crime</th>
              <th style={{ padding: '0.75rem' }}>Bairro</th>
              <th style={{ padding: '0.75rem' }}>Logradouro</th>
              <th style={{ padding: '0.75rem' }}>Gravidade</th>
            </tr>
          </thead>
          <tbody>
            {ocorrencias.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum boletim de ocorrência encontrado para estes filtros.
                </td>
              </tr>
            ) : (
              ocorrencias.map((bo) => (
                <tr key={bo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#00e5ff' }}>{bo.numero_bo}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{bo.tipo_crime}</td>
                  <td style={{ padding: '0.75rem' }}>{bo.bairro}</td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{bo.logradouro}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: bo.gravidade === 'CRITICA' ? 'rgba(239,68,68,0.2)' : bo.gravidade === 'ALTA' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                      color: bo.gravidade === 'CRITICA' ? '#ef4444' : bo.gravidade === 'ALTA' ? '#f59e0b' : '#3b82f6'
                    }}>
                      {bo.gravidade}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
