# 🗄️ Guia de Configuração do Banco de Dados PostgreSQL (Supabase) — Sentinel IA

Este documento contém a documentação completa e o código SQL para configurar o **Banco de Dados PostgreSQL** no **Supabase** para o projeto **Sentinel IA (FECART)**.

---

## 📋 1. Criar a Conta Gratuita no Supabase

1. Acesse: [https://supabase.com/](https://supabase.com/)
2. Faça login com o GitHub.
3. Clique em **"New Project"** (Novo Projeto).
4. Escolha um nome para o projeto (ex: `sentinel-ia-fecart`) e defina uma senha para o banco de dados.
5. Selecione a região `South America (São Paulo)`.

---

## ⚡ 2. Executar o Script SQL no Supabase

1. No painel do Supabase, clique no menu lateral em **SQL Editor** (Editor de SQL).
2. Clique em **"New Query"** (Nova Consulta).
3. Cole o código SQL abaixo e clique no botão **RUN**:

```sql
-- ============================================
-- SENTINEL IA — SCHEMA DO BANCO DE DADOS POSTGRESQL
-- ============================================

-- 1. Tabela de Alertas e Ocorrências em Tempo Real
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'climate', 'infra', 'safe')),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Áreas de Interesse Geoespacial (AOIs)
CREATE TABLE IF NOT EXISTS public.aoi_zones (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    risk_score INT NOT NULL DEFAULT 50,
    active_cameras INT NOT NULL DEFAULT 0,
    active_sensors INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inserir Zonas Iniciais de São Paulo
INSERT INTO public.aoi_zones (code, name, risk_score, active_cameras, active_sensors)
VALUES 
    ('AOI-ALPHA', 'AOI Alpha — Av. Paulista & Bela Vista', 68, 84, 412),
    ('AOI-BRAVO', 'AOI Bravo — Centro Histórico & Sé', 92, 120, 320),
    ('AOI-CHARLIE', 'AOI Charlie — Vila Olímpia & Faria Lima', 24, 96, 530),
    ('AOI-DELTA', 'AOI Delta — Marginal Tietê & Lapa', 81, 64, 289)
ON CONFLICT (code) DO NOTHING;

-- 4. Inserir Ocorrências Iniciais de Teste
INSERT INTO public.alerts (name, type, severity, lat, lng)
VALUES
    ('Praça da Sé — Centro', 'Disparo de Alarme de Emergência', 'critical', -23.5505, -46.6333),
    ('Av. Paulista, 1578 — Masp', 'Câmera com Leitura Facial OCR (IA)', 'infra', -23.5614, -46.6560),
    ('Parque Ibirapuera — Moema', 'Estação Pluviométrica & Clima', 'climate', -23.5876, -46.6580),
    ('Pinheiros — Av. Faria Lima', 'Fluxo Veicular Seguro e Ronda Ativa', 'safe', -23.5675, -46.6920);

-- 5. Habilitar Permissões de Leitura e Escrita Pública (RLS Policy)
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aoi_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso de Leitura Pública para Alertas" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Acesso de Inserção Pública para Alertas" ON public.alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Acesso de Leitura Pública para AOIs" ON public.aoi_zones FOR SELECT USING (true);
```

---

## 🔑 3. Conectar o Site ao seu Supabase (Opcional)

Se você quiser usar as chaves reais do seu projeto:

1. No painel do Supabase, vá em **Project Settings** > **API**.
2. Copie a **URL do Projeto** (`Project URL`) e a chave **anon / public** (`Project API keys`).
3. Abra o arquivo [`js/api-service.js`](file:///C:/Users/26012427/Documents/GitHub/FECART.PROJETO.FINAL/js/api-service.js) e altere no início:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://SEU_PROJETO.supabase.co',
  anonKey: 'SUA_CHAVE_ANON_KEY',
  tableName: 'alerts'
};
```

---

## 🛡️ 4. Como Funciona a Tolerância a Falhas (Fallback)

* O motor do Sentinel IA em [`js/api-service.js`](file:///C:/Users/26012427/Documents/GitHub/FECART.PROJETO.FINAL/js/api-service.js) detecta automaticamente a conexão com o Supabase.
* Se estiver conectado, as ocorrências simuladas e novos alertas são persistidos **ao vivo no PostgreSQL** via REST & WebSocket.
* Se estiver sem internet ou sem chave configurada, o motor alterna transparentemente para a **simulação local sem erros**, garantindo 100% de estabilidade durante a apresentação na FECART!
