import axios from 'axios';
import type { WeatherData, OcorrenciasResponse, ResumoEstatistico, OcorrenciaFiltros } from '../types/sentinel';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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

export const sentinelService = {
  // Obter clima atual
  async getClima(forceRefresh: boolean = false): Promise<WeatherData> {
    const { data } = await api.get<WeatherData>('/clima', {
      params: { force_refresh: forceRefresh }
    });
    return data;
  },

  // Obter ocorrências paginadas e filtradas
  async getOcorrencias(filtros?: OcorrenciaFiltros): Promise<OcorrenciasResponse> {
    const { data } = await api.get<OcorrenciasResponse>('/ocorrencias', {
      params: filtros
    });
    return data;
  },

  // Obter métricas consolidadas
  async getResumoEstatistico(): Promise<ResumoEstatistico> {
    const { data } = await api.get<ResumoEstatistico>('/ocorrencias/resumo');
    return data;
  },

  // Healthcheck do backend
  async checkHealth(): Promise<boolean> {
    try {
      const { data } = await api.get('/health', { baseURL: 'http://localhost:8000' });
      return data.status === 'ONLINE';
    } catch {
      return false;
    }
  }
};
