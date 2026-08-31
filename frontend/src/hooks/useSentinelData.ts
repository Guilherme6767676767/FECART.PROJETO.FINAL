/**
 * useSentinelData — Hook central de dados dinâmicos do Sentinel IA
 *
 * Gerencia todo o ciclo de vida das requisições via Axios:
 * - Clima em tempo real (com cache de 5 min)
 * - Ocorrências (SSP-SP) com filtros, paginação e auto-refresh (30s)
 * - Resumo estatístico para os cards QuickStats
 * - Simulações preditivas urbanas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getClima,
  getOcorrencias,
  getResumoEstatistico,
  dispararSimulacao as apiDispararSimulacao,
  dispararCenario as apiDispararCenario,
  limparSimulacoes as apiLimparSimulacoes,
} from '../services/sentinelService';
import type {
  WeatherData,
  OcorrenciasResponse,
  ResumoEstatistico,
  OcorrenciaFiltros,
  CriarSimulacaoPayload,
  SimulacaoResult,
} from '../types/sentinel';

// ─── Constantes de configuração ───────────────────────────────────────────────
const CLIMA_REFRESH_MS = 5 * 60 * 1000;    // 5 minutos
const OCORRENCIAS_REFRESH_MS = 30 * 1000;  // 30 segundos (tabela "Atividade Recente")

// ─── Hook Principal ───────────────────────────────────────────────────────────
export function useSentinelData() {
  // — Estado: Clima —
  const [clima, setClima] = useState<WeatherData | null>(null);
  const [loadingClima, setLoadingClima] = useState<boolean>(true);
  const [errorClima, setErrorClima] = useState<string | null>(null);

  // — Estado: Ocorrências —
  const [ocorrenciasData, setOcorrenciasData] = useState<OcorrenciasResponse | null>(null);
  const [loadingBOs, setLoadingBOs] = useState<boolean>(true);
  const [errorBOs, setErrorBOs] = useState<string | null>(null);

  // — Estado: Resumo Estatístico —
  const [resumo, setResumo] = useState<ResumoEstatistico | null>(null);

  // — Estado: Filtros ativos —
  const [filtros, setFiltros] = useState<OcorrenciaFiltros>({ page: 1, page_size: 10 });

  // — Estado: Localização selecionada no mapa —
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // — Estado: Carregamento de simulações —
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Ref para manter os filtros correntes dentro de callbacks sem stale closure
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  // ─────────────────────────────────────────────────────────────────────────────
  // Buscar Clima
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchClima = useCallback(async (forceRefresh = false) => {
    try {
      setLoadingClima(true);
      setErrorClima(null);
      const data = await getClima(forceRefresh);
      setClima(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setErrorClima(`Falha ao obter telemetria climática: ${msg}`);
      console.error('[useSentinelData] Clima:', err);
    } finally {
      setLoadingClima(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Buscar Ocorrências + Resumo Estatístico em paralelo
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchOcorrencias = useCallback(async (novosFiltros?: OcorrenciaFiltros) => {
    const filtrosAtualizados: OcorrenciaFiltros = {
      ...filtrosRef.current,
      ...novosFiltros,
    };
    setFiltros(filtrosAtualizados);

    try {
      setLoadingBOs(true);
      setErrorBOs(null);

      // Busca ocorrências + resumo em paralelo para melhor performance
      const [respBOs, respResumo] = await Promise.allSettled([
        getOcorrencias(filtrosAtualizados),
        getResumoEstatistico(),
      ]);

      if (respBOs.status === 'fulfilled') {
        setOcorrenciasData(respBOs.value);
      } else {
        const reason = respBOs.reason as Error;
        setErrorBOs(
          `Falha ao conectar com a base SSP-SP: ${reason?.message || 'Verifique se o backend está rodando em http://localhost:8000'}`
        );
      }

      if (respResumo.status === 'fulfilled') {
        setResumo(respResumo.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado';
      setErrorBOs(`Erro ao consultar ocorrências: ${msg}`);
      console.error('[useSentinelData] Ocorrências:', err);
    } finally {
      setLoadingBOs(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Simulações
  // ─────────────────────────────────────────────────────────────────────────────
  const dispararSimulacao = async (
    payload: CriarSimulacaoPayload,
  ): Promise<SimulacaoResult | null> => {
    try {
      setSimLoading(true);
      const result = await apiDispararSimulacao(payload);
      // Atualiza a tabela imediatamente após a simulação
      await fetchOcorrencias({ page: 1 });
      return result;
    } catch (err) {
      console.error('[useSentinelData] Simulação:', err);
      return null;
    } finally {
      setSimLoading(false);
    }
  };

  const dispararCenario = async (cenarioId: string): Promise<void> => {
    try {
      setSimLoading(true);
      await apiDispararCenario(cenarioId);
      await fetchOcorrencias({ page: 1 });
    } catch (err) {
      console.error('[useSentinelData] Cenário:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const limparSimulacoes = async (): Promise<void> => {
    try {
      setSimLoading(true);
      await apiLimparSimulacoes();
      await fetchOcorrencias({ page: 1 });
    } catch (err) {
      console.error('[useSentinelData] Limpar simulações:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Carga inicial + auto-refresh
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Carga inicial
    fetchClima();
    fetchOcorrencias({ page: 1, page_size: 10 });

    // Auto-refresh: clima a cada 5 min
    const timerClima = setInterval(() => {
      fetchClima();
    }, CLIMA_REFRESH_MS);

    // Auto-refresh: ocorrências a cada 30s (tabela "Atividade Recente" dinâmica)
    const timerBOs = setInterval(() => {
      fetchOcorrencias();
    }, OCORRENCIAS_REFRESH_MS);

    return () => {
      clearInterval(timerClima);
      clearInterval(timerBOs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conta simulações ativas (IDs começam com 'SIM-')
  const simulationCount =
    ocorrenciasData?.ocorrencias.filter((o) => o.id.startsWith('SIM-')).length ?? 0;

  return {
    // Clima
    clima,
    loadingClima,
    errorClima,
    refetchClima: () => fetchClima(true),

    // Ocorrências
    ocorrenciasData,
    resumo,
    loadingBOs,
    errorBOs,
    filtros,
    fetchOcorrencias,

    // Mapa
    selectedLocation,
    setSelectedLocation,

    // Simulações
    dispararSimulacao,
    dispararCenario,
    limparSimulacoes,
    simLoading,
    simulationCount,
  };
}
