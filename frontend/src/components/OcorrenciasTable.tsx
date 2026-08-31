import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar,
  AlertCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import type { OcorrenciasResponse, GravidadeTipo, OcorrenciaFiltros } from '../types/sentinel';

interface Props {
  data: OcorrenciasResponse | null;
  loading: boolean;
  onFilterChange: (filtros: OcorrenciaFiltros) => void;
}

export const OcorrenciasTable: React.FC<Props> = ({ data, loading, onFilterChange }) => {
  const [bairro, setBairro] = useState('');
  const [gravidade, setGravidade] = useState('');
  const [tipoCrime, setTipoCrime] = useState('');
  const [busca, setBusca] = useState('');

  const executarFiltro = (pagina: number = 1) => {
    onFilterChange({
      bairro: bairro || undefined,
      gravidade: gravidade || undefined,
      tipo_crime: tipoCrime || undefined,
      q: busca || undefined,
      page: pagina,
      page_size: 5
    });
  };

  const limparFiltros = () => {
    setBairro('');
    setGravidade('');
    setTipoCrime('');
    setBusca('');
    onFilterChange({ page: 1, page_size: 5 });
  };

  const formatarData = (dataIso: string) => {
    try {
      const d = new Date(dataIso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ')';
    } catch {
      return dataIso;
    }
  };

  const getGravidadeBadgeClass = (g: GravidadeTipo) => {
    switch (g) {
      case 'CRITICA': return 'badge-gravidade badge-critica';
      case 'ALTA': return 'badge-gravidade badge-alta';
      case 'MEDIA': return 'badge-gravidade badge-media';
      default: return 'badge-gravidade badge-baixa';
    }
  };

  return (
    <div className="ocorrencias-container">
      <div className="section-header">
        <div className="section-title-wrap">
          <ShieldAlert size={22} className="text-amber-400" />
          <div>
            <h2 className="section-heading">Boletins de Ocorrência — Inteligência SSP-SP</h2>
            <span className="section-subheading">Registros processados e georreferenciados para análise criminal urbana</span>
          </div>
        </div>

        <div className="section-counter">
          <span>Registros Encontrados:</span>
          <strong>{data?.total || 0}</strong>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-input"
            placeholder="Pesquisar por endereço, crime ou nº BO..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executarFiltro(1)}
          />
        </div>

        <select
          className="filter-select"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
        >
          <option value="">Todos os Bairros</option>
          <option value="Sé">Sé (Centro Histórico)</option>
          <option value="Pinheiros">Pinheiros / Faria Lima</option>
          <option value="Bela Vista">Bela Vista / Paulista</option>
          <option value="Moema">Moema / Ibirapuera</option>
          <option value="Lapa">Lapa / Marginal Tietê</option>
          <option value="Tatuapé">Tatuapé (Zona Leste)</option>
          <option value="Brás">Brás (Zona Central)</option>
          <option value="Consolação">Consolação / Augusta</option>
          <option value="Santana">Santana (Zona Norte)</option>
        </select>

        <select
          className="filter-select"
          value={gravidade}
          onChange={(e) => setGravidade(e.target.value)}
        >
          <option value="">Severidade (Todas)</option>
          <option value="CRITICA">Crítica (Prioridade 1)</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>

        <div className="filter-actions">
          <button onClick={() => executarFiltro(1)} className="btn-filter">
            <Filter size={15} />
            <span>Filtrar</span>
          </button>
          
          {(bairro || gravidade || tipoCrime || busca) && (
            <button onClick={limparFiltros} className="btn-clear">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="table-responsive">
        <table className="sentinel-table">
          <thead>
            <tr>
              <th>Nº BO</th>
              <th>Tipo de Ocorrência</th>
              <th>Localização (Bairro & Via)</th>
              <th>Data/Hora</th>
              <th>Severidade</th>
              <th>Status do Despacho</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-loading-cell">
                  <div className="loading-spinner-wrap">
                    <RefreshCw size={20} className="spin" />
                    <span>Sincronizando registros da SSP-SP...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.ocorrencias.length > 0 ? (
              data.ocorrencias.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="font-mono text-cyan-400 font-bold">{item.numero_bo}</td>
                  <td className="occurrence-type">
                    <FileText size={14} className="text-slate-400" />
                    <span>{item.tipo_crime}</span>
                  </td>
                  <td className="location-cell">
                    <MapPin size={14} className="text-indigo-400" />
                    <div>
                      <strong className="text-slate-200">{item.bairro}</strong>
                      <span className="text-slate-400 block text-xs">{item.logradouro}</span>
                    </div>
                  </td>
                  <td className="time-cell">
                    <Calendar size={13} className="text-slate-500" />
                    <span>{formatarData(item.data_hora)}</span>
                  </td>
                  <td>
                    <span className={getGravidadeBadgeClass(item.gravidade)}>
                      {item.gravidade}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className="status-indicator-dot" />
                    <span>{item.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="table-empty-cell">
                  <AlertCircle size={24} className="text-slate-500 mb-2" />
                  <p>Nenhuma ocorrência encontrada para os filtros aplicados.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {data && (
        <div className="table-pagination">
          <span className="pagination-info">
            Página <strong>{data.pagina}</strong> de <strong>{data.total_paginas}</strong> (Exibindo até {data.tamanho_pagina} registros por página)
          </span>

          <div className="pagination-btns">
            <button
              disabled={data.pagina <= 1 || loading}
              onClick={() => executarFiltro(data.pagina - 1)}
              className="pagination-nav-btn"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <span className="current-page-pill">{data.pagina}</span>

            <button
              disabled={data.pagina >= data.total_paginas || loading}
              onClick={() => executarFiltro(data.pagina + 1)}
              className="pagination-nav-btn"
            >
              <span>Próxima</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
