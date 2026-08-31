/**
 * Sentinel IA — Serviço de API Dedicado (Axios)
 * 
 * Camada de abstração sobre a instância Axios, expondo métodos tipados
 * para cada endpoint do backend FastAPI em http://localhost:8000/api/v1
 */

import { api } from './api';
import type {
  WeatherData,
  OcorrenciasResponse,
  ResumoEstatistico,
  OcorrenciaFiltros,
  CriarSimulacaoPayload,
  SimulacaoResult,
} from '../types/sentinel';

// ─── Clima ───────────────────────────────────────────────────────────────────

/**
 * Busca a telemetria meteorológica atual de São Paulo.
 * @param forceRefresh - Se true, ignora o cache TTL e força nova consulta ao provedor.
 */
export async function getClima(forceRefresh = false): Promise<WeatherData> {
  const { data } = await api.get<WeatherData>('/clima', {
    params: { force_refresh: forceRefresh },
  });
  return data;
}

// ─── Ocorrências (SSP-SP) ─────────────────────────────────────────────────────

/**
 * Busca os Boletins de Ocorrência paginados com filtros opcionais.
 * Alimenta a tabela "Atividade Recente" e o mapa geoespacial.
 *
 * @param filtros - Parâmetros opcionais: bairro, tipo_crime, gravidade, q, page, page_size
 */
export async function getOcorrencias(
  filtros?: OcorrenciaFiltros,
): Promise<OcorrenciasResponse> {
  const { data } = await api.get<OcorrenciasResponse>('/ocorrencias', {
    params: filtros,
  });
  return data;
}

/**
 * Busca o resumo estatístico agregado das ocorrências.
 * Alimenta os cards de métricas do QuickStats (totais, críticas, altas, medias).
 */
export async function getResumoEstatistico(): Promise<ResumoEstatistico> {
  const { data } = await api.get<ResumoEstatistico>('/ocorrencias/resumo');
  return data;
}

// ─── Simulação ────────────────────────────────────────────────────────────────

/**
 * Dispara uma ocorrência simulada personalizada com análise preditiva de IA.
 * @param payload - Dados do incidente simulado (tipo, bairro, coordenadas, gravidade etc.)
 */
export async function dispararSimulacao(
  payload: CriarSimulacaoPayload,
): Promise<SimulacaoResult> {
  const { data } = await api.post<SimulacaoResult>('/simulacao/disparar', payload);
  return data;
}

/**
 * Dispara um cenário pré-configurado de crise urbana.
 * @param cenarioId - ID do cenário: 'tempestade_marginal' | 'arrastao_centro' | 'aglomeracao_paulista' | 'pane_pinheiros'
 */
export async function dispararCenario(cenarioId: string): Promise<unknown> {
  const { data } = await api.post('/simulacao/cenario', { cenario_id: cenarioId });
  return data;
}

/**
 * Remove todas as ocorrências simuladas, restaurando os dados base.
 */
export async function limparSimulacoes(): Promise<unknown> {
  const { data } = await api.delete('/simulacao/limpar');
  return data;
}

// ─── Health ───────────────────────────────────────────────────────────────────

/**
 * Verifica se o backend FastAPI está online.
 * @returns true se o backend estiver respondendo com status ONLINE.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const { data } = await api.get('/health', {
      baseURL: import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000',
    });
    return data?.status === 'ONLINE';
  } catch {
    return false;
  }
}

// ─── Exportação agrupada (compatibilidade retroativa) ─────────────────────────

export const sentinelApi = {
  getClima,
  getOcorrencias,
  getResumoEstatistico,
  dispararSimulacao,
  dispararCenario,
  limparSimulacoes,
  checkBackendHealth,
} as const;
