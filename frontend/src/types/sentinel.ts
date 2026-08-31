// ==========================================
// TIPAGENS DO SENTINEL IA (TypeScript)
// ==========================================

export interface WeatherData {
  cidade: string;
  temperatura: number;
  sensacao_termica: number;
  condicao: string;
  umidade: number;
  vento_kmh: number;
  precipitacao_mm: number;
  alerta_risco: string;
  icone: string;
  atualizado_em: string;
  fonte: string;
}

export type GravidadeTipo = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface OcorrenciaBO {
  id: string;
  numero_bo: string;
  data_hora: string;
  tipo_crime: string;
  bairro: string;
  logradouro: string;
  latitude: number;
  longitude: number;
  status: string;
  gravidade: GravidadeTipo;
}

export interface OcorrenciasResponse {
  total: number;
  pagina: number;
  tamanho_pagina: number;
  total_paginas: number;
  ocorrencias: OcorrenciaBO[];
}

export interface ResumoEstatistico {
  total_ocorrencias: number;
  criticas: number;
  altas: number;
  medias: number;
  baixas: number;
  bairro_mais_afetado: string;
  tipo_mais_frequente: string;
}

export interface OcorrenciaFiltros {
  bairro?: string;
  tipo_crime?: string;
  gravidade?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface AOIZone {
  id: string;
  code: string;
  name: string;
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
  riskScore: number;
  color: string;
  fillColor: string;
  bounds: [number, number][];
  center: [number, number];
  activeSensors: number;
  activeCameras: number;
  description: string;
}

export interface CriarSimulacaoPayload {
  titulo: string;
  tipo_crime: string;
  bairro: string;
  logradouro: string;
  latitude: number;
  longitude: number;
  gravidade: GravidadeTipo;
  precipitacao_estimada_mm?: number;
}

export interface SimulacaoResult {
  sucesso: boolean;
  ocorrencia: OcorrenciaBO;
  score_risco_calculado: number;
  nivel_alerta: string;
  impacto_estimado: string;
  acoes_recomendadas: string[];
  afeta_aoi?: string;
}

