import React, { useState } from 'react';
import type { CriarSimulacaoPayload, SimulacaoResult, GravidadeTipo } from '../types/sentinel';
import { 
  Zap, 
  CloudLightning, 
  ShieldAlert, 
  Car, 
  AlertOctagon, 
  Send, 
  Trash2, 
  Play, 
  Square, 
  Cpu, 
  CheckCircle,
  MapPin
} from 'lucide-react';

interface Props {
  onDispararSimulacao: (payload: CriarSimulacaoPayload) => Promise<SimulacaoResult | null>;
  onDispararCenario: (cenarioId: string) => Promise<void>;
  onLimparSimulacoes: () => Promise<void>;
  selectedLocation: { lat: number; lng: number } | null;
  loading: boolean;
}

export const SimulationPanel: React.FC<Props> = ({
  onDispararSimulacao,
  onDispararCenario,
  onLimparSimulacoes,
  selectedLocation,
  loading,
}) => {
  // Form State
  const [titulo, setTitulo] = useState('Alagamento Pista Expressa');
  const [tipoCrime, setTipoCrime] = useState('Alagamento Iminente');
  const [bairro, setBairro] = useState('Lapa');
  const [logradouro, setLogradouro] = useState('Marginal Tietê, próx. Ponte da Lapa');
  const [gravidade, setGravidade] = useState<GravidadeTipo>('ALTA');
  const [lat, setLat] = useState<number>(-23.519);
  const [lng, setLng] = useState<number>(-46.692);

  // AI Result State
  const [lastResult, setLastResult] = useState<SimulacaoResult | null>(null);
  const [autoSimulating, setAutoSimulating] = useState(false);
  const [autoTimer, setAutoTimer] = useState<any>(null);

  // Sincronizar coordenadas quando o usuário clica no mapa
  React.useEffect(() => {
    if (selectedLocation) {
      setLat(selectedLocation.lat);
      setLng(selectedLocation.lng);
    }
  }, [selectedLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CriarSimulacaoPayload = {
      titulo,
      tipo_crime: tipoCrime,
      bairro,
      logradouro,
      latitude: lat,
      longitude: lng,
      gravidade,
    };

    const res = await onDispararSimulacao(payload);
    if (res) {
      setLastResult(res);
    }
  };

  const handleCenarioClick = async (cenarioId: string) => {
    await onDispararCenario(cenarioId);
  };

  // Alternar simulação contínua automática (Modo Demo FECART)
  const toggleAutoSimulation = () => {
    if (autoSimulating) {
      clearInterval(autoTimer);
      setAutoSimulating(false);
      setAutoTimer(null);
    } else {
      setAutoSimulating(true);
      const timer = setInterval(() => {
        const cenarios = ['tempestade_marginal', 'arrastao_centro', 'aglomeracao_paulista', 'pane_pinheiros'];
        const aleatorio = cenarios[Math.floor(Math.random() * cenarios.length)];
        onDispararCenario(aleatorio);
      }, 7000);
      setAutoTimer(timer);
    }
  };

  React.useEffect(() => {
    return () => {
      if (autoTimer) clearInterval(autoTimer);
    };
  }, [autoTimer]);

  return (
    <div className="simulation-panel">
      {/* Seção 1: Cenários Preditivos em 1 Clique */}
      <div className="sim-section">
        <div className="sim-section-header">
          <Zap size={18} className="text-amber-400" />
          <h3 className="sim-heading">Cenários Urbanos Pré-Configurados</h3>
        </div>
        <p className="sim-sub">Dispare simulações coordenadas de crises urbanas com cálculos preditivos da IA:</p>

        <div className="scenarios-grid">
          <button
            type="button"
            className="scenario-btn scenario-weather"
            disabled={loading}
            onClick={() => handleCenarioClick('tempestade_marginal')}
          >
            <CloudLightning size={18} className="text-cyan-400" />
            <div className="scenario-text">
              <strong>⛈️ Tempestade Marginal</strong>
              <span>Transbordamento e queda de árvores na Lapa/Santana</span>
            </div>
          </button>

          <button
            type="button"
            className="scenario-btn scenario-security"
            disabled={loading}
            onClick={() => handleCenarioClick('arrastao_centro')}
          >
            <ShieldAlert size={18} className="text-red-400" />
            <div className="scenario-text">
              <strong>🚨 Arrastão Centro / Sé</strong>
              <span>Roubo em massa e cerco eletrônico OCR na Sé</span>
            </div>
          </button>

          <button
            type="button"
            className="scenario-btn scenario-traffic"
            disabled={loading}
            onClick={() => handleCenarioClick('aglomeracao_paulista')}
          >
            <AlertOctagon size={18} className="text-yellow-400" />
            <div className="scenario-text">
              <strong>👥 Bloqueio Av. Paulista</strong>
              <span>Aglomeração massiva em frente ao MASP</span>
            </div>
          </button>

          <button
            type="button"
            className="scenario-btn scenario-grid"
            disabled={loading}
            onClick={() => handleCenarioClick('pane_pinheiros')}
          >
            <Car size={18} className="text-purple-400" />
            <div className="scenario-text">
              <strong>🚦 Pane Semafórica Pinheiros</strong>
              <span>Apagão semafórico e retenção na Faria Lima</span>
            </div>
          </button>
        </div>
      </div>

      {/* Seção 2: Criador Personalizado de Incidente */}
      <div className="sim-section">
        <div className="sim-section-header">
          <Send size={18} className="text-cyan-400" />
          <h3 className="sim-heading">Criar Incidente Personalizado</h3>
        </div>

        <form onSubmit={handleSubmit} className="custom-sim-form">
          <div className="form-group">
            <label>Título / Identificação do Evento</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="sim-input"
              placeholder="Ex: Alagamento Pista Expressa"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Evento</label>
              <select 
                value={tipoCrime} 
                onChange={(e) => setTipoCrime(e.target.value)}
                className="sim-input"
              >
                <option value="Alagamento Iminente">Alagamento Iminente (Chuva)</option>
                <option value="Roubo de Veículo em Fuga">Roubo de Veículo em Fuga</option>
                <option value="Arrastão / Furto Coletivo">Arrastão / Furto Coletivo</option>
                <option value="Acidente Grave com Retenção">Acidente Grave com Retenção</option>
                <option value="Falha de Semáforo Inteligente">Falha de Semáforo Inteligente</option>
                <option value="Queda de Árvore sobre Via">Queda de Árvore sobre Via</option>
                <option value="Aglomeração Hostil Não Autorizada">Aglomeração Hostil Não Autorizada</option>
              </select>
            </div>

            <div className="form-group">
              <label>Severidade</label>
              <select 
                value={gravidade} 
                onChange={(e) => setGravidade(e.target.value as GravidadeTipo)}
                className="sim-input"
              >
                <option value="CRITICA">Crítica (Prioridade 1)</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Bairro de SP</label>
              <select 
                value={bairro} 
                onChange={(e) => setBairro(e.target.value)}
                className="sim-input"
              >
                <option value="Sé">Sé (Centro Histórico)</option>
                <option value="Bela Vista">Bela Vista (Paulista)</option>
                <option value="Pinheiros">Pinheiros (Faria Lima)</option>
                <option value="Lapa">Lapa (Marginal Tietê)</option>
                <option value="Moema">Moema (Ibirapuera)</option>
                <option value="Tatuapé">Tatuapé (Zona Leste)</option>
                <option value="Santana">Santana (Zona Norte)</option>
                <option value="Brás">Brás (Zona Central)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Endereço / Via</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                className="sim-input"
                placeholder="Ex: Av. Paulista, 1578"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="flex items-center gap-1">
                <MapPin size={12} className="text-cyan-400" />
                Latitude
              </label>
              <input
                type="number"
                step="0.00001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="sim-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-1">
                <MapPin size={12} className="text-cyan-400" />
                Longitude
              </label>
              <input
                type="number"
                step="0.00001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="sim-input font-mono"
                required
              />
            </div>
          </div>

          <div className="sim-form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit-sim"
            >
              <Send size={15} />
              <span>{loading ? 'Processando IA...' : 'Disparar Simulação'}</span>
            </button>

            <button
              type="button"
              onClick={toggleAutoSimulation}
              className={`btn-auto-demo ${autoSimulating ? 'active' : ''}`}
              title="Dispara simulações a cada 7 segundos para demonstração contínua"
            >
              {autoSimulating ? <Square size={14} /> : <Play size={14} />}
              <span>{autoSimulating ? 'Parar Modo Demo' : 'Modo Demo FECART'}</span>
            </button>

            <button
              type="button"
              onClick={onLimparSimulacoes}
              disabled={loading}
              className="btn-clear-sim"
              title="Limpar todas as simulações ativas"
            >
              <Trash2 size={15} />
              <span>Limpar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Seção 3: Terminal de Análise Preditiva da IA */}
      {lastResult && (
        <div className="sim-ai-terminal">
          <div className="terminal-top">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400" />
              <strong className="terminal-title">Motor Preditivo Sentinel IA — Diagnóstico Tático</strong>
            </div>
            <span className="terminal-badge">Score: {lastResult.score_risco_calculado}/100</span>
          </div>

          <div className="terminal-content">
            <div className="terminal-line">
              <span className="text-slate-400">Evento Processado:</span>
              <strong className="text-cyan-300"> {lastResult.ocorrencia.tipo_crime} ({lastResult.ocorrencia.numero_bo})</strong>
            </div>

            <div className="terminal-line">
              <span className="text-slate-400">Impacto Estimado:</span>
              <span className="text-amber-300"> {lastResult.impacto_estimado}</span>
            </div>

            {lastResult.afeta_aoi && (
              <div className="terminal-line">
                <span className="text-slate-400">Zona AOI Impactada:</span>
                <span className="text-red-400 font-bold"> {lastResult.afeta_aoi}</span>
              </div>
            )}

            <div className="terminal-actions-title">Recomendações Operacionais da IA:</div>
            <ul className="terminal-actions-list">
              {lastResult.acoes_recomendadas.map((acao, i) => (
                <li key={i}>
                  <CheckCircle size={14} className="text-emerald-400 inline mr-1.5" />
                  {acao}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
