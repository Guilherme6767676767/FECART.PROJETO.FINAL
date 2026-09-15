# 🚦 FECART IA - Sistema de Mobilidade Urbana Inteligente & Navegação Adaptativa

> **Projeto Acadêmico - FECART 2026**  
> **Instituição:** FECAP - Fundação Escola de Comércio Álvares Penteado  
> **Curso:** Bacharelado em Inteligência Artificial (1º Ano)  
> **Foco:** Navegação Urbana Consciente de Risco (São Paulo - Região Central / Liberdade)

---

## 📌 Visão Geral do Projeto

Os sistemas convencionais de navegação por GPS (como Google Maps e Waze padrão) são desenhados para otimizar exclusivamente **tempo** e **distância métrica**. Em megacidades como São Paulo, essa abordagem frequentemente direciona motoristas e pedestres para:
- Vias sujeitas a alagamentos rápidos e intransponíveis (bacias do Tamanduateí/Glicério).
- Zonas de risco criminal acentuado ou ruas ermas durante a noite.
- Gargalos estruturais causados por obras e semáforos com sincronia defeituosa.

Este projeto propõe uma **Arquitetura de Navegação Adaptativa Multicritério** baseada em Inteligência Artificial sobre Grafos, que ingere dados geográficos reais em tempo real (OpenStreetMap) e calcula rotas com o melhor equilíbrio entre tempo e **segurança viária**.

---

## 🏛️ Arquitetura da Solução

O sistema foi estruturado seguindo o padrão de **Camadas Desacopladas (Clean Multi-Tier Architecture)**:

```
[ Usuário / Navegador Web ]
           │
           ▼
[ Frontend Dashboard (Leaflet.js + Glassmorphism UI) ]
           │  (REST JSON)
           ▼
[ Servidor Backend Flask (app.py) ]
    ├── 1. Ingestão OpenStreetMap (Overpass API + Nominatim)
    ├── 2. Modelagem do Grafo Viário (NetworkX)
    ├── 3. Matriz de Fusão de Riscos (Segurança + Pluviometria)
    └── 4. Motor de IA (Dijkstra com Função de Custo Ponderada)
```

---

## 🔬 Fundamentação Teórica e Algoritmo de IA

### 1. Modelagem em Grafo Ponderado
A malha viária é representada como um grafo direcionado $G = (V, E)$, onde:
- $V$ (Vértices/Nós): Cruzamentos, entroncamentos e semáforos obtidos via OpenStreetMap.
- $E$ (Arestas): Segmentos de ruas com fluxo de tráfego.

### 2. A Função de Custo Dinâmica Ponderada
Em vez de utilizar simplesmente a distância euclidiana como peso da aresta, nossa heurística aplica uma penalização multifatorial:

$$\text{Custo}(u, v) = \text{Distância} \times \left(1 + 2.0 \cdot R_{\text{alagamento}} + 1.5 \cdot R_{\text{crime}} + 1.0 \cdot P_{\text{trânsito}}\right)$$

* **$R_{\text{alagamento}} \in [0.0, 1.0]$:** Índice de risco de inundação da via (inspirado no monitoramento do CGE-SP).
* **$R_{\text{crime}} \in [0.0, 1.0]$:** Índice criminal relativo do segmento (inspirado em dados abertos da SSP-SP).
* **$P_{\text{trânsito}}$:** Penalidade de retenção semafórica e gargalos.

### 3. Justificativa Acadêmica do Algoritmo (Dijkstra vs. A*)
- O algoritmo de **Dijkstra** foi selecionado para garantir a **otimalidade global estrita** sobre custos compostos não puramente métricos.
- Embora o algoritmo **A\*** utilize heurísticas para acelerar a busca, no cenário urbano onde riscos climáticos e criminais multiplicam virtualmente o peso da via, formular uma heurística euclidiana que seja simultaneamente admissível ($h(n) \le h^*(n)$) e consistente torna-se matematicamente desafiador sem subestimar zonas perigosas.

---

## 🛠️ Tecnologias Utilizadas

| Componente | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ / Flask | Servidor REST e lógica de aplicação |
| **Grafos & IA** | NetworkX | Estrutura de dados e algoritmos de menor caminho |
| **Dados Geográficos** | OpenStreetMap (Overpass & Nominatim) | Malha viária e geocoding aberto (Sem API Key) |
| **Frontend** | HTML5, CSS3 Moderno, JavaScript ES6 | Dashboard estilo Waze com interface escura |
| **Mapas Interativos** | Leaflet.js | Renderização vetorial e marcadores de incidentes |

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/Guilherme6767676767/FECART.PROJETO.FINAL.git
cd FECART.PROJETO.FINAL
```

### 2. Criar e Ativar Ambiente Virtual (Recomendado)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / MacOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 4. Iniciar a Aplicação
```bash
python app.py
```

Após iniciar, abra seu navegador em:  
👉 **`http://127.0.0.1:5000`**

---

## 📱 Funcionalidades do Dashboard

1. **Pesquisa Dinâmica de Bairros:** Busca rápida com auto-complete integrado ao OpenStreetMap Nominatim.
2. **Seleção Direta no Mapa:** Clique para definir o ponto de **Origem (Verde)** e **Destino (Vermelho)**.
3. **Comparativo Visual Duplo:**
   - 🔴 **Linha Vermelha Tracejada:** Rota GPS Convencional (ignora riscos).
   - 🟢 **Linha Ciano/Verde Contínua:** Rota Otimizada pela IA (desvia de pontos críticos).
4. **Painel de Métricas em Tempo Real:** Exibe o score de risco do bairro ativo, semáforos identificados e a porcentagem de risco evitado.

---

## 👨‍💻 Integrantes do Projeto

* Alunos do 1º Ano do Bacharelado em Inteligência Artificial - **FECAP**
* Projeto desenvolvido para a Feira de Ciências e Arte (**FECART 2026**)
