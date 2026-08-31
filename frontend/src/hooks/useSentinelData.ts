import { useState, useEffect, useCallback } from 'react';
import { sentinelService } from '../services/api';
import type { 
  WeatherData, 
  OcorrenciasResponse, 
  ResumoEstatistico, 
  OcorrenciaFiltros,
  CriarSimulacaoPayload,
  SimulacaoResult
} from '../types/sentinel';

export function useSentinelData() {
  const [clima, setClima] = useState<WeatherData | null>(null);
  const [loadingClima, setLoadingClima] = useState<boolean>(true);
  const [errorClima, setErrorClima] = useState<string | null>(null);

  const [ocorrenciasData, setOcorrenciasData] = useState<OcorrenciasResponse | null>(null);
  const [loadingBOs, setLoadingBOs] = useState<boolean>(true);
  const [errorBOs, setErrorBOs] = useState<string | null>(null);

  const [resumo, setResumo] = useState<ResumoEstatistico | null>(null);
  const [filtros, setFiltros] = useState<OcorrenciaFiltros>({ page: 1, page_size: 10 });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Buscar Clima
  const fetchClima = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoadingClima(true);
      setErrorClima(null);
      const data = await sentinelService.getClima(forceRefresh);
      setClima(data);
    } catch (err: any) {
      setErrorClima('Falha ao obter telemetria de clima.');
    } finally {
      setLoadingClima(false);
    }
  }, []);

  // Buscar Ocorrências
  const fetchOcorrencias = useCallback(async (novosFiltros?: OcorrenciaFiltros) => {
    try {
      setLoadingBOs(true);
      setErrorBOs(null);
      const filtrosAtualizados = { ...filtros, ...novosFiltros };
      setFiltros(filtrosAtualizados);

      const [respBOs, respResumo] = await Promise.allSettled([
        sentinelService.getOcorrencias(filtrosAtualizados),
        sentinelService.getResumoEstatistico()
      ]);

      if (respBOs.status === 'fulfilled') {
        setOcorrenciasData(respBOs.value);
      } else {
        setErrorBOs('Falha ao conectar com o banco de ocorrências da SSP-SP.');
      }

      if (respResumo.status === 'fulfilled') {
        setResumo(respResumo.value);
      }
    } catch (err: any) {
      setErrorBOs('Erro inesperado ao consultar ocorrências.');
    } finally {
      setLoadingBOs(false);
    }
  }, [filtros]);

  // Disparar Incidente Simulado
  const dispararSimulacao = async (payload: CriarSimulacaoPayload): Promise<SimulacaoResult | null> => {
    try {
      setSimLoading(true);
      const result = await sentinelService.dispararSimulacao(payload);
      await fetchOcorrencias();
      return result;
    } catch (err) {
      console.error('Erro ao disparar simulação:', err);
      return null;
    } finally {
      setSimLoading(false);
    }
  };

  // Disparar Cenário Pronto
  const dispararCenario = async (cenarioId: string) => {
    try {
      setSimLoading(true);
      await sentinelService.dispararCenario(cenarioId);
      await fetchOcorrencias();
    } catch (err) {
      console.error('Erro ao disparar cenário:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // Limpar Simulações
  const limparSimulacoes = async () => {
    try {
      setSimLoading(true);
      await sentinelService.limparSimulacoes();
      await fetchOcorrencias();
    } catch (err) {
      console.error('Erro ao limpar simulações:', err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    fetchClima();
    fetchOcorrencias({ page: 1, page_size: 10 });

    const timer = setInterval(() => {
      fetchClima();
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const simulationCount = ocorrenciasData?.ocorrencias.filter((o) => o.id.startsWith('SIM-')).length || 0;

  return {
    clima,
    loadingClima,
    errorClima,
    refetchClima: () => fetchClima(true),
    ocorrenciasData,
    resumo,
    loadingBOs,
    errorBOs,
    filtros,
    fetchOcorrencias,
    selectedLocation,
    setSelectedLocation,
    dispararSimulacao,
    dispararCenario,
    limparSimulacoes,
    simLoading,
    simulationCount,
  };
}

