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

// ─── Dados de Fallback Resilientes (Mock de Segurança para GitHub Pages / Offline) ──
const FALLBACK_CLIMA: WeatherData = {
  cidade: 'São Paulo',
  temperatura: 24.5,
  sensacao_termica: 25.2,
  umidade_relativa: 68,
  velocidade_vento_kmh: 14.2,
  direcao_vento_graus: 135,
  precipitacao_mm: 0.0,
  condicao_tempo: 'Parcialmente Nublado',
  icone_sugerido: 'cloud-sun',
  risco_climatico: 'BAIXO',
  indice_risco_score: 18,
  atualizado_em: new Date().toISOString()
};

const FALLBACK_BOS: OcorrenciasResponse = {
  total: 8,
  pagina: 1,
  tamanho_pagina: 10,
  total_paginas: 1,
  ocorrencias: [
    { id:'F-01', numero_bo:'98124/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Celular', bairro:'Sé', logradouro:'Praça da Sé', latitude:-23.5505, longitude:-46.6333, gravidade:'CRITICA', status:'Em Atendimento' },
    { id:'F-02', numero_bo:'98125/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo de Veículo', bairro:'Pinheiros', logradouro:'Av. Faria Lima', latitude:-23.5675, longitude:-46.6920, gravidade:'ALTA', status:'Registrado' },
    { id:'F-03', numero_bo:'98126/2026', data_hora: new Date().toISOString(), tipo_crime:'Monitoramento Climático', bairro:'Moema', logradouro:'Parque Ibirapuera', latitude:-23.5876, longitude:-46.6580, gravidade:'MEDIA', status:'Monitorando' },
    { id:'F-04', numero_bo:'98127/2026', data_hora: new Date().toISOString(), tipo_crime:'Ronda Preventiva', bairro:'Tatuapé', logradouro:'Praça Silvio Romero', latitude:-23.5410, longitude:-46.5750, gravidade:'BAIXA', status:'Seguro' },
    { id:'F-05', numero_bo:'98128/2026', data_hora: new Date().toISOString(), tipo_crime:'Furto de Veículo', bairro:'Lapa', logradouro:'Rua 12 de Outubro', latitude:-23.5350, longitude:-46.7020, gravidade:'CRITICA', status:'Em Atendimento' },
    { id:'F-06', numero_bo:'98129/2026', data_hora: new Date().toISOString(), tipo_crime:'Alagamento', bairro:'Brás', logradouro:'Av. Rangel Pestana', latitude:-23.5480, longitude:-46.6050, gravidade:'ALTA', status:'Alerta Ativo' },
    { id:'F-07', numero_bo:'98130/2026', data_hora: new Date().toISOString(), tipo_crime:'Câmera OCR Ativa', bairro:'Consolação', logradouro:'Av. Paulista, 1578', latitude:-23.5614, longitude:-46.6560, gravidade:'MEDIA', status:'Operacional' },
    { id:'F-08', numero_bo:'98131/2026', data_hora: new Date().toISOString(), tipo_crime:'Roubo em Andamento', bairro:'Brasilândia', logradouro:'Est. do Sabão', latitude:-23.4610, longitude:-46.6950, gravidade:'CRITICA', status:'Urgente' }
  ]
};

const FALLBACK_RESUMO: ResumoEstatistico = {
  total_ocorrencias: 8,
  por_gravidade: { CRITICA: 3, ALTA: 2, MEDIA: 2, BAIXA: 1 },
  por_bairro: { 'Sé': 1, 'Pinheiros': 1, 'Moema': 1, 'Tatuapé': 1, 'Lapa': 1, 'Brás': 1, 'Consolação': 1, 'Brasilândia': 1 },
  principais_crimes: [
    { tipo: 'Furto de Celular', quantidade: 2 },
    { tipo: 'Roubo de Veículo', quantidade: 2 },
    { tipo: 'Alagamento', quantidade: 1 }
  ],
  taxa_resolucao_percentual: 84.5
};

// ─── Clima ───────────────────────────────────────────────────────────────────

/**
 * Busca a telemetria meteorológica atual de São Paulo (com fallback resiliente).
 */
export async function getClima(forceRefresh = false): Promise<WeatherData> {
  try {
    const { data } = await api.get<WeatherData>('/clima', {
      params: { force_refresh: forceRefresh },
    });
    return data;
  } catch (error) {
    console.warn('⚠️ [Sentinel IA] Backend Clima inacessível. Usando fallback de dados resilientes:', error);
    return FALLBACK_CLIMA;
  }
}

// ─── Ocorrências (SSP-SP) ─────────────────────────────────────────────────────

/**
 * Busca os Boletins de Ocorrência paginados com filtros (com fallback resiliente).
 */
export async function getOcorrencias(
  filtros?: OcorrenciaFiltros,
): Promise<OcorrenciasResponse> {
  try {
    const { data } = await api.get<OcorrenciasResponse>('/ocorrencias', {
      params: filtros,
    });
    return data;
  } catch (error) {
    console.warn('⚠️ [Sentinel IA] Backend BOs inacessível. Usando base offline resiliente:', error);
    if (!filtros) return FALLBACK_BOS;
    let filtradas = [...FALLBACK_BOS.ocorrencias];
    if (filtros.bairro) filtradas = filtradas.filter(b => b.bairro.toLowerCase().includes(filtros.bairro!.toLowerCase()));
    if (filtros.gravidade) filtradas = filtradas.filter(b => b.gravidade === filtros.gravidade);
    if (filtros.tipo_crime) filtradas = filtradas.filter(b => b.tipo_crime.toLowerCase().includes(filtros.tipo_crime!.toLowerCase()));
    return {
      total: filtradas.length,
      pagina: filtros.page || 1,
      tamanho_pagina: filtros.page_size || 10,
      total_paginas: Math.max(1, Math.ceil(filtradas.length / (filtros.page_size || 10))),
      ocorrencias: filtradas
    };
  }
}

/**
 * Busca o resumo estatístico agregado das ocorrências (com fallback resiliente).
 */
export async function getResumoEstatistico(): Promise<ResumoEstatistico> {
  try {
    const { data } = await api.get<ResumoEstatistico>('/ocorrencias/resumo');
    return data;
  } catch (error) {
    console.warn('⚠️ [Sentinel IA] Resumo de BOs em modo fallback offline:', error);
    return FALLBACK_RESUMO;
  }
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
