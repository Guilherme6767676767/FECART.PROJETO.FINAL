import axios from 'axios';
import type { 
  WeatherData, 
  OcorrenciasResponse, 
  ResumoEstatistico, 
  OcorrenciaFiltros,
  CriarSimulacaoPayload,
  SimulacaoResult,
  AOIZone
} from '../types/sentinel';

// Re-export the dedicated service module (preferred import path)
export * from './sentinelService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const SP_AOI_ZONES: AOIZone[] = [
  {
    id: 'AOI-01',
    code: 'AOI-ALPHA',
    name: 'AOI Alpha — Av. Paulista & Bela Vista',
    riskLevel: 'MÉDIO',
    riskScore: 68,
    color: '#f59e0b',
    fillColor: '#f59e0b',
    bounds: [
      [-23.565, -46.658],
      [-23.558, -46.648],
      [-23.568, -46.640],
      [-23.575, -46.650]
    ],
    center: [-23.563, -46.654],
    activeSensors: 412,
    activeCameras: 84,
    description: 'Corredor financeiro e gastronômico. Fluxo intenso de pedestres e veículos.'
  },
  {
    id: 'AOI-02',
    code: 'AOI-BRAVO',
    name: 'AOI Bravo — Centro Histórico & Sé',
    riskLevel: 'CRÍTICO',
    riskScore: 92,
    color: '#ef4444',
    fillColor: '#ef4444',
    bounds: [
      [-23.553, -46.638],
      [-23.545, -46.631],
      [-23.550, -46.625],
      [-23.558, -46.632]
    ],
    center: [-23.5505, -46.6333],
    activeSensors: 320,
    activeCameras: 120,
    description: 'Zona de alta densidade histórica. Monitoramento prioritário por IA para prevenção de furtos e aglomerações.'
  },
  {
    id: 'AOI-03',
    code: 'AOI-CHARLIE',
    name: 'AOI Charlie — Vila Olímpia & Faria Lima',
    riskLevel: 'BAIXO',
    riskScore: 24,
    color: '#10b981',
    fillColor: '#10b981',
    bounds: [
      [-23.598, -46.690],
      [-23.590, -46.680],
      [-23.596, -46.672],
      [-23.604, -46.682]
    ],
    center: [-23.595, -46.685],
    activeSensors: 530,
    activeCameras: 96,
    description: 'Polo tecnológico e corporativo. Monitoramento constante de tráfego inteligente.'
  },
  {
    id: 'AOI-04',
    code: 'AOI-DELTA',
    name: 'AOI Delta — Marginal Tietê & Lapa',
    riskLevel: 'ALTO',
    riskScore: 81,
    color: '#a855f7',
    fillColor: '#a855f7',
    bounds: [
      [-23.520, -46.705],
      [-23.510, -46.690],
      [-23.518, -46.678],
      [-23.528, -46.695]
    ],
    center: [-23.519, -46.692],
    activeSensors: 289,
    activeCameras: 64,
    description: 'Via expressa de tráfego pesado. Risco recorrente de retenção e acidentes em horários de pico.'
  }
];

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor global para log e tratamento
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('⚠️ [Sentinel API Error]:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * sentinelService — mantido para compatibilidade retroativa.
 * Prefira importar diretamente de './sentinelService'.
 */
export const sentinelService = {
  async getClima(forceRefresh = false): Promise<WeatherData> {
    const { data } = await api.get<WeatherData>('/clima', { params: { force_refresh: forceRefresh } });
    return data;
  },
  async getOcorrencias(filtros?: OcorrenciaFiltros): Promise<OcorrenciasResponse> {
    const { data } = await api.get<OcorrenciasResponse>('/ocorrencias', { params: filtros });
    return data;
  },
  async getResumoEstatistico(): Promise<ResumoEstatistico> {
    const { data } = await api.get<ResumoEstatistico>('/ocorrencias/resumo');
    return data;
  },
  async dispararSimulacao(payload: CriarSimulacaoPayload): Promise<SimulacaoResult> {
    const { data } = await api.post<SimulacaoResult>('/simulacao/disparar', payload);
    return data;
  },
  async dispararCenario(cenarioId: string): Promise<unknown> {
    const { data } = await api.post('/simulacao/cenario', { cenario_id: cenarioId });
    return data;
  },
  async limparSimulacoes(): Promise<unknown> {
    const { data } = await api.delete('/simulacao/limpar');
    return data;
  },
  async checkHealth(): Promise<boolean> {
    try {
      const { data } = await api.get('/health', { baseURL: 'http://localhost:8000' });
      return data?.status === 'ONLINE';
    } catch { return false; }
  }
};
