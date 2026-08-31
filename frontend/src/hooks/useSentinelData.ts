import { useState, useEffect, useCallback } from 'react';
import { sentinelService } from '../services/api';
import type { WeatherData, OcorrenciasResponse, ResumoEstatistico, OcorrenciaFiltros } from '../types/sentinel';

export function useSentinelData() {
  const [clima, setClima] = useState<WeatherData | null>(null);
  const [loadingClima, setLoadingClima] = useState<boolean>(true);
  const [errorClima, setErrorClima] = useState<string | null>(null);

  const [ocorrenciasData, setOcorrenciasData] = useState<OcorrenciasResponse | null>(null);
  const [loadingBOs, setLoadingBOs] = useState<boolean>(true);
  const [errorBOs, setErrorBOs] = useState<string | null>(null);

  const [resumo, setResumo] = useState<ResumoEstatistico | null>(null);
  const [filtros, setFiltros] = useState<OcorrenciaFiltros>({ page: 1, page_size: 5 });

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

  useEffect(() => {
    fetchClima();
    fetchOcorrencias({ page: 1, page_size: 5 });

    // Atualização em segundo plano a cada 5 minutos
    const timer = setInterval(() => {
      fetchClima();
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

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
  };
}
