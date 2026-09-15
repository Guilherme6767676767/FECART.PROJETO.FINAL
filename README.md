# 🚦 FECART Waze IA — Monitoramento de Alagamentos & Roteamento Adaptativo (SP)

> **Projeto Acadêmico - FECART 2026**  
> **Instituição:** FECAP - Fundação Escola de Comércio Álvares Penteado  
> **Curso:** Bacharelado em Inteligência Artificial (1º Ano)  
> **Tema:** Mobilidade Urbana Preditiva, Prevenção de Riscos e Otimização em Grafos

---

## 📌 1. Visão Geral do Projeto

Em dias de chuvas intensas em São Paulo, vias expressas e artérias centrais sofrem com **bolsões de alagamento críticos** e intransponíveis. Aplicativos tradicionais de navegação costumam orientar veículos apenas pela distância mínima ou tempo teórico, gerando prejuízos graves e retenções severas.

O **FECART Waze IA** é uma solução de mobilidade inteligente e adaptativa que:
1. **Dispensa chaves pagas de API**, consumindo dados abertos da malha do **OpenStreetMap (Overpass API)** e geocodificação via **Nominatim**.
2. **Persiste relatos em tempo real** através de um banco de dados relacional local **SQLite** (`alagamentos.db`) via `Flask-SQLAlchemy`.
3. **Mapeia riscos em camadas interativas:** Mapa de Calor (**Heatmap**) e polígonos de alerta (**Zonas de Risco**) graduados por severidade (*Leve*, *Moderado*, *Grave*).
4. **Calcula rotas ótimas com IA em Grafos (`networkx`)**, penalizando dinamicamente trechos com proximidade a pontos alagados ou gargalos semafóricos.

---

## 🏛️ 2. Arquitetura da Solução

```
[ Usuário / Navegador Web ]
           │
           ▼
[ Frontend Dashboard (Leaflet.js + Leaflet.heat + CSS Glassmorphism) ]
           │  (Requisições REST JSON)
           ▼
[ Servidor Backend Flask (app.py) ]
    ├── 1. Banco de Dados Local SQLite (alagamentos.db via SQLAlchemy)
    ├── 2. Geocoding com User-Agent (Nominatim OpenStreetMap)
    ├── 3. Ingestão de Infraestrutura e Gargalos (Overpass API)
    └── 4. Motor de IA em Grafos Ponderados (NetworkX Dijkstra / A*)
```

---

## 🔬 3. Justificativa Acadêmica do Algoritmo de IA

### A. Modelagem da Malha Viária em Grafos
A infraestrutura urbana é modelada como um grafo direcionado $G = (V, E)$, onde:
- $V$ (Vértices): Cruzamentos, interseções e semáforos monitorados.
- $E$ (Arestas): Segmentos viários transitáveis com fluxo de veículos.

### B. Função de Custo e Penalização Multifatorial
O algoritmo ajusta o peso de cada aresta $(u, v)$ aplicando a seguinte fórmula matemática de custo:

$$\text{Peso Aresta} = \text{Distância} \times \left(1 + 3.0 \cdot \text{Penalidade Alagamento} + 1.5 \cdot \text{Gargalo OSM}\right)$$

* **$\text{Penalidade Alagamento}$:** Calculada a partir da proximidade euclidiana ($< 150\text{m}$) aos pontos cadastrados no banco SQLite, variando de $0.8$ (Leve), $1.8$ (Moderado) a $3.0$ (Grave).
* **$\text{Gargalo OSM}$:** Penalização de atrito atribuída se a via cruzar semáforos ou trechos em obras reportados no OpenStreetMap.

### C. Escolha do Algoritmo (Dijkstra vs A*)
- O algoritmo de **Dijkstra com Custo Dinâmico** assegura a **otimalidade global estrita** sem risco de convergir para um mínimo local.
- Garante que atalhos aparentemente mais curtos que cortam fundos de vale alagados recebam uma resistência matemática virtual proibitiva, forçando o desvio seguro sem aumentar drasticamente o percurso.

---

## 🛠️ 4. Tecnologias Empregadas

| Módulo | Tecnologia | Função |
| :--- | :--- | :--- |
| **Backend & Servidor** | Python 3.10+ / Flask | Servidor REST e lógica de rotas |
| **Banco de Dados** | SQLite 3 / Flask-SQLAlchemy | Armazenamento persistente de alagamentos |
| **Grafos e IA** | NetworkX | Estrutura de dados e algoritmos de menor caminho |
| **Dados Geográficos** | OpenStreetMap (Overpass & Nominatim) | Geocodificação e malha viária 100% livre de custos |
| **Frontend Dashboard** | HTML5, CSS3 Moderno, JavaScript ES6 | Interface estilo Waze com tema escuro e responsivo |
| **Visualização Cartográfica** | Leaflet.js & Leaflet.heat | Círculos de zonas, mapa de calor e renderização vetorial |

---

## 🚀 5. Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/Guilherme6767676767/FECART.PROJETO.FINAL.git
cd FECART.PROJETO.FINAL
```

### 2. Criar e Ativar o Ambiente Virtual (Recomendado)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / MacOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar as Dependências do Backend
```bash
pip install -r backend/requirements.txt
```

O projeto funciona sem chaves de API. O clima usa Open-Meteo e os demais
serviços pagos permanecem desativados até que sejam configurados no `.env`.

### 4. Iniciar o Backend FastAPI
```bash
uvicorn backend.main:app --reload --port 8000
```

Abra a documentação interativa em **`http://127.0.0.1:8000/docs`**.

### 5. Iniciar o Frontend React
Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra **`http://localhost:5173`**. O frontend já aponta, por padrão, para
`http://localhost:8000/api/v1`. Para usar outra URL, crie `frontend/.env` com:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📱 6. Guia de Uso do Dashboard

1. **Pesquisa Dinâmica de Bairros:** Digite qualquer bairro (ex: *Moema*, *Liberdade*, *Tatuapé*) para voar até a região e atualizar as métricas automaticamente.
2. **Definir Rota:** Clique em dois pontos no mapa para estabelecer a **Origem (Verde)** e o **Destino (Vermelho)**. A IA traçará a rota em ciano e comparará com a rota tradicional em vermelho tracejado.
3. **Reportar Alagamento:** Clique em qualquer rua e selecione a opção de reportar alagamento. Escolha a severidade (*Leve*, *Moderado*, *Grave*). O relato é salvo no banco SQLite e a IA recalcula o trajeto imediatamente desviando do novo obstáculo.
4. **Controle de Camadas:** Use os botões na barra lateral para ligar/desligar as **Zonas de Alagamento** e o **Heatmap de Risco**.

---

## 👨‍💻 7. Integrantes do Projeto
* Alunos do 1º Ano do Bacharelado em Inteligência Artificial — **FECAP**
* Feira de Ciência e Arte (**FECART 2026**)
