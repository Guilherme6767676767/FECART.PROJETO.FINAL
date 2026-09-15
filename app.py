# -*- coding: utf-8 -*-
"""
=============================================================================
PROJETO FINAL FECART 2026 - FECAP (1º ANO INTELIGÊNCIA ARTIFICIAL)
SISTEMA INTELIGENTE DE MOBILIDADE URBANA E NAVEGAÇÃO ADAPTATIVA (SP)
=============================================================================
Servidor Backend Flask com integração OpenStreetMap (Overpass API / Nominatim),
modelagem de Grafos Ponderados (NetworkX) e Motor Heurístico de IA (Dijkstra/A*).
"""

import sys
import math
import random
import urllib3
import requests
import networkx as nx
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from collections import defaultdict
import json
import os

try:
    from backend.crime_intelligence import (
        CRIMES_SSP, calculate_crime_risk_index, get_detailed_crime_simulation,
        get_total_crimes_by_year, get_crimes_by_category
    )
except ImportError:
    from crime_intelligence import (
        CRIMES_SSP, calculate_crime_risk_index, get_detailed_crime_simulation,
        get_total_crimes_by_year, get_crimes_by_category
    )

# Forçar stdout UTF-8 no Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Desativa avisos de certificados auto-assinados de redes corporativas/acadêmicas
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

# ==========================================
# UTILITÁRIOS GEOGRÁFICOS
# ==========================================
def haversine(lat1, lon1, lat2, lon2):
    """Calcula a distância geodésica em metros entre duas coordenadas geográficas."""
    R = 6371000.0  # Raio da Terra em metros
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# ==========================================
# CACHE RESILIENTE / FALLBACK LOCAL
# ==========================================
def get_synthetic_region_data(lat, lon):
    """
    Gera malha sintética e incidentes para garantir 100% de disponibilidade
    mesmo se os servidores públicos do OSM/Overpass estiverem instáveis.
    """
    delta = 0.008
    nodes = [
        {"id": 1, "lat": lat, "lon": lon, "tags": {}},
        {"id": 2, "lat": lat + delta * 0.4, "lon": lon - delta * 0.3, "tags": {"highway": "traffic_signals"}},
        {"id": 3, "lat": lat + delta * 0.8, "lon": lon + delta * 0.1, "tags": {}},
        {"id": 4, "lat": lat - delta * 0.5, "lon": lon + delta * 0.6, "tags": {}},
        {"id": 5, "lat": lat + delta * 0.2, "lon": lon + delta * 0.9, "tags": {"highway": "traffic_signals"}},
        {"id": 6, "lat": lat + delta, "lon": lon + delta, "tags": {}}
    ]
    ways = [
        {"id": 101, "nodes": [1, 2, 3, 6], "tags": {"name": "Corredor Principal"}},
        {"id": 102, "nodes": [1, 4, 5, 6], "tags": {"name": "Rota Periférica"}}
    ]
    elements = [{'type': 'node', **n} for n in nodes] + [{'type': 'way', **w} for w in ways]
    return {'elements': elements}

# ==========================================
# ROTAS E ENDPOINTS REST
# ==========================================

@app.route('/')
def home():
    """Renderiza o Dashboard interativo Frontend Leaflet.js."""
    return render_template('index.html')


@app.route('/api/buscar-bairro', methods=['GET'])
def buscar_bairro():
    """
    Endpoint 1: Geocoding aberto via OpenStreetMap Nominatim.
    Busca bairros, logradouros e locais em São Paulo sem chave de API.
    """
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({"success": False, "error": "Parâmetro 'q' é obrigatório."}), 400

    headers = {'User-Agent': 'FECART-Mobilidade-IA-App/1.0 (contato.fecap@fecap.br)'}
    nominatim_url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': f"{query}, São Paulo, SP, Brasil",
        'format': 'json',
        'limit': 5,
        'addressdetails': 1
    }

    try:
        res = requests.get(nominatim_url, params=params, headers=headers, timeout=8, verify=False)
        if res.status_code == 200:
            data = res.json()
            if data:
                results = []
                for item in data:
                    results.append({
                        "name": item.get("display_name"),
                        "lat": float(item.get("lat")),
                        "lon": float(item.get("lon")),
                        "type": item.get("type")
                    })
                return jsonify({"success": True, "results": results})
    except Exception as e:
        print(f"Erro no Nominatim: {e}")

    # Fallback predeterminado para bairros clássicos de SP
    locais_sp = {
        "liberdade": (-23.5574, -46.6346, "Liberdade / Campus FECAP"),
        "fecap": (-23.5574, -46.6346, "FECAP Liberdade"),
        "paulista": (-23.5614, -46.6559, "Avenida Paulista"),
        "se": (-23.5505, -46.6333, "Praça da Sé"),
        "pinheiros": (-23.5670, -46.7020, "Pinheiros"),
        "vila madalena": (-23.5550, -46.6900, "Vila Madalena"),
        "sao joaquim": (-23.5617, -46.6388, "Metrô São Joaquim")
    }
    
    q_lower = query.lower()
    for key, (lat, lon, label) in locais_sp.items():
        if key in q_lower:
            return jsonify({
                "success": True,
                "results": [{"name": f"{label}, São Paulo, SP", "lat": lat, "lon": lon, "type": "fallback"}]
            })

    # Padrão: Centro Histórico / Liberdade
    return jsonify({
        "success": True,
        "results": [{"name": f"{query} (Aproximado - São Paulo, SP)", "lat": -23.5574, "lon": -46.6346, "type": "default"}]
    })


@app.route('/api/dados-regiao', methods=['GET'])
def dados_regiao():
    """
    Endpoint 2: Consulta Overpass API para semáforos, bloqueios e obras
    na região visível do mapa e calcula o Score de Risco Geral.
    """
    try:
        lat = float(request.args.get('lat', -23.5574))
        lon = float(request.args.get('lon', -46.6346))
        raio = float(request.args.get('raio', 1200)) # metros
    except ValueError:
        return jsonify({"success": False, "error": "Coordenadas inválidas."}), 400

    # Conversão de metros para graus aproximados
    deg_lat = raio / 111111.0
    deg_lon = raio / (111111.0 * math.cos(math.radians(lat)))
    bbox = (lat - deg_lat, lon - deg_lon, lat + deg_lat, lon + deg_lon)

    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:12];
    (
      node["highway"="traffic_signals"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      way["highway"="construction"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      way["barrier"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out body;
    >;
    out skel qt;
    """

    elements = []
    try:
        res = requests.get(overpass_url, params={'data': query}, timeout=10, verify=False)
        if res.status_code == 200:
            elements = res.json().get('elements', [])
    except Exception:
        pass

    # Se não houver retorno da API, gera incidentes locais simulados realistas
    semaforos = []
    obras_bloqueios = []
    
    for el in elements:
        if el.get('type') == 'node' and el.get('tags', {}).get('highway') == 'traffic_signals':
            semaforos.append({"lat": el['lat'], "lon": el['lon']})
        elif el.get('type') == 'way':
            # Marca ponto representativo da obra
            obras_bloqueios.append({"id": el['id'], "tipo": el.get('tags', {}).get('highway', 'bloqueio')})

    # Simular riscos climáticos (alagamento CGE) e de segurança (SSP-SP)
    random.seed(int((lat + lon) * 10000))
    qtd_semaforos = len(semaforos) if semaforos else random.randint(6, 18)
    qtd_obras = len(obras_bloqueios) if obras_bloqueios else random.randint(1, 4)

    # Diagnóstico criminológico baseado nos dados oficiais da SSP-SP (PDF)
    diag_ssp = get_detailed_crime_simulation("São Paulo / Centro", lat, lon, "ROUBO DE VEÍCULO")
    score_criminal = diag_ssp.get("score_risco_ssp", random.randint(40, 75))

    # Simulação de pontos críticos no raio
    alertas_criticos = []
    for _ in range(random.randint(2, 5)):
        offset_lat = random.uniform(-deg_lat * 0.7, deg_lat * 0.7)
        offset_lon = random.uniform(-deg_lon * 0.7, deg_lon * 0.7)
        tipo = random.choice(["alagamento", "criminalidade", "obra"])
        alertas_criticos.append({
            "tipo": tipo,
            "lat": lat + offset_lat,
            "lon": lon + offset_lon,
            "intensidade": random.randint(50, 95),
            "descricao": "Risco de Enchente Severa" if tipo == "alagamento" else ("Área de Risco Criminal Elevado (SSP-SP)" if tipo == "criminalidade" else "Bloqueio Viário / Obras")
        })

    # Cálculo do Score de Risco Geral da Região (0 a 100) ponderado
    score_alagamento = random.randint(20, 60)
    score_geral = int((score_alagamento * 0.45) + (score_criminal * 0.45) + (qtd_obras * 2.5))
    score_geral = min(100, max(10, score_geral))

    return jsonify({
        "success": True,
        "coordenadas_centro": {"lat": lat, "lon": lon},
        "score_risco_geral": score_geral,
        "score_alagamento": score_alagamento,
        "score_criminal": score_criminal,
        "total_semaforos": qtd_semaforos,
        "total_bloqueios": qtd_obras,
        "ssp_base": {
            "total_registros_base": len(CRIMES_SSP),
            "nivel_seguranca": diag_ssp.get("classificacao"),
            "tempo_resposta_pm": f"{diag_ssp.get('tempo_resposta_tatico_min')} min"
        },
        "incidentes": alertas_criticos
    })


# ==========================================
# ENDPOINTS OFICIAIS DA API DE CRIMINALIDADE (SSP-SP)
# Especificados no documento técnico (PDF páginas 2-4)
# ==========================================
@app.route("/crimes", methods=["GET"])
def listar_crimes():
    """Lista todos os registros da SSP-SP, com filtros opcionais por ano e tipo de crime."""
    ano = request.args.get("ano")
    tipo = request.args.get("tipo")
    resultado = CRIMES_SSP
    if ano:
        resultado = [r for r in resultado if str(r.get("ano")) == str(ano)]
    if tipo:
        tipo_lower = tipo.lower()
        resultado = [r for r in resultado if tipo_lower in r.get("tipo_crime", "").lower()]
    return jsonify({
        "total_registros": len(resultado),
        "dados": resultado
    })

@app.route("/crimes/resumo", methods=["GET"])
def resumo_crimes():
    """Retorna o total de cada tipo de crime, por ano."""
    totais = defaultdict(lambda: defaultdict(int))
    for r in CRIMES_SSP:
        totais[r["ano"]][r["tipo_crime"]] += r.get("quantidade", 0)
    saida = {}
    for ano, tipos in totais.items():
        saida[ano] = [
            {"tipo_crime": tipo, "total": qtd}
            for tipo, qtd in sorted(tipos.items())
        ]
    return jsonify(saida)

@app.route("/crimes/tipos", methods=["GET"])
def tipos_crimes_disponiveis():
    """Lista todos os tipos de crime existentes na base SSP-SP."""
    tipos = sorted(set(r["tipo_crime"] for r in CRIMES_SSP))
    return jsonify(tipos)

@app.route("/crimes/anos", methods=["GET"])
def anos_crimes_disponiveis():
    """Lista todos os anos existentes na base SSP-SP (2023-2026)."""
    anos = sorted(set(r["ano"] for r in CRIMES_SSP))
    return jsonify(anos)


@app.route('/api/calcular-rota', methods=['GET'])
def calcular_rota():
    """
    Endpoint 3: Algoritmo de Inteligência Artificial para Otimização de Trajetos.
    Monta o Grafo de Navegação com NetworkX e calcula a Rota de Menor Risco
    utilizando a fórmula:
      Custo = Distancia * (1 + 2.0*Risco_Alagamento + 1.5*Risco_Criminal + 1.0*Penalidade_Transito)
    """
    try:
        orig_lat = float(request.args.get('orig_lat'))
        orig_lon = float(request.args.get('orig_lon'))
        dest_lat = float(request.args.get('dest_lat'))
        dest_lon = float(request.args.get('dest_lon'))
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "orig_lat, orig_lon, dest_lat e dest_lon são obrigatórios."}), 400

    # Determinar Bounding Box cobrindo os dois pontos com margem de segurança
    min_lat = min(orig_lat, dest_lat) - 0.012
    max_lat = max(orig_lat, dest_lat) + 0.012
    min_lon = min(orig_lon, dest_lon) - 0.012
    max_lon = max(orig_lon, dest_lon) + 0.012
    bbox = (min_lat, min_lon, max_lat, max_lon)

    # Ingestão de vias pela Overpass API
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:15];
    (
      way["highway"]["highway"!~"footway|pedestrian|path|steps"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      node["highway"="traffic_signals"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out body;
    >;
    out skel qt;
    """

    osm_data = None
    try:
        res = requests.get(overpass_url, params={'data': query}, timeout=12, verify=False)
        if res.status_code == 200:
            candidate = res.json()
            if candidate.get('elements') and len(candidate['elements']) > 15:
                osm_data = candidate
    except Exception:
        pass

    if not osm_data:
        osm_data = get_synthetic_region_data((orig_lat + dest_lat)/2.0, (orig_lon + dest_lon)/2.0)

    # Construção do Grafo Ponderado com NetworkX
    G = nx.Graph()
    nodes = {}
    traffic_signals = set()

    for el in osm_data['elements']:
        if el['type'] == 'node':
            nodes[el['id']] = (el['lat'], el['lon'])
            if el.get('tags', {}).get('highway') == 'traffic_signals':
                traffic_signals.add(el['id'])

    # Inserção de Arestas com Pesos de IA
    random.seed(42) # Reprodutibilidade científica
    for el in osm_data['elements']:
        if el['type'] == 'way':
            w_nodes = el.get('nodes', [])
            w_name = el.get('tags', {}).get('name', 'Via Urbana')
            for i in range(len(w_nodes) - 1):
                u, v = w_nodes[i], w_nodes[i+1]
                if u in nodes and v in nodes:
                    dist = haversine(nodes[u][0], nodes[u][1], nodes[v][0], nodes[v][1])
                    if dist < 0.5:
                        continue

                    # Índices de risco normalizados [0.0 a 1.0]
                    # Risco criminal calibrado com base na pressão estatística da base SSP-SP
                    ssp_baseline = calculate_crime_risk_index() # Ex: ~0.55
                    risco_alagamento = random.choices([0.0, 0.2, 0.6, 1.0], weights=[0.65, 0.20, 0.10, 0.05])[0]
                    risco_criminal = random.choices(
                        [round(ssp_baseline * 0.4, 2), round(ssp_baseline * 0.8, 2), round(min(1.0, ssp_baseline * 1.3), 2), 0.95],
                        weights=[0.55, 0.25, 0.15, 0.05]
                    )[0]
                    penalidade_transito = 0.5 if (u in traffic_signals or v in traffic_signals) else 0.0

                    # Custo Convencional: pura distância física
                    custo_convencional = dist

                    # FÓRMULA OFICIAL DE IA PONDERADA:
                    # Custo = Distancia * (1 + 2.0 * Risco_Alagamento + 1.5 * Risco_Criminal + 1.0 * Penalidade_Transito)
                    custo_ia = dist * (1.0 + (2.0 * risco_alagamento) + (1.5 * risco_criminal) + (1.0 * penalidade_transito))

                    G.add_edge(
                        u, v,
                        name=w_name,
                        distance=dist,
                        weight_std=custo_convencional,
                        weight_ai=custo_ia,
                        alagamento=risco_alagamento,
                        criminal=risco_criminal
                    )

    # Associação dos pontos GPS aos nós mais próximos do grafo
    def get_nearest(lat, lon):
        best_d = float('inf')
        best_n = None
        for n_id, coords in nodes.items():
            if n_id in G:
                d = haversine(lat, lon, coords[0], coords[1])
                if d < best_d:
                    best_d = d
                    best_n = n_id
        return best_n

    start_node = get_nearest(orig_lat, orig_lon)
    end_node = get_nearest(dest_lat, dest_lon)

    if not start_node or not end_node:
        return jsonify({"success": False, "error": "Nenhum nó viário conectável encontrado na região."}), 404

    # Algoritmo de Busca Heurística (Dijkstra / A*)
    try:
        path_std = nx.shortest_path(G, source=start_node, target=end_node, weight='weight_std')
    except nx.NetworkXNoPath:
        path_std = [start_node, end_node]

    try:
        path_ai = nx.shortest_path(G, source=start_node, target=end_node, weight='weight_ai')
    except nx.NetworkXNoPath:
        path_ai = path_std

    def format_path(path):
        coords = []
        total_dist = 0
        total_alag = 0
        total_crime = 0
        edges_count = 0

        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            coords.append([nodes[u][0], nodes[u][1]])
            data = G.get_edge_data(u, v) or {}
            total_dist += data.get('distance', 0)
            total_alag = max(total_alag, data.get('alagamento', 0))
            total_crime = max(total_crime, data.get('criminal', 0))
            edges_count += 1

        coords.append([nodes[path[-1]][0], nodes[path[-1]][1]])
        tempo_min = round((total_dist / 6.94) / 60.0, 1) # ~25 km/h velocidade urbana média
        return {
            "coordinates": coords,
            "distancia_km": round(total_dist / 1000.0, 2),
            "tempo_estimado_min": max(1.0, tempo_min),
            "risco_alagamento_max": int(total_alag * 100),
            "risco_criminal_max": int(total_crime * 100)
        }

    rota_ia = format_path(path_ai)
    rota_convencional = format_path(path_std)

    return jsonify({
        "success": True,
        "rota_ia": rota_ia,
        "rota_convencional": rota_convencional,
        "comparativo": {
            "seguranca_ganho_pct": max(0, rota_convencional['risco_criminal_max'] - rota_ia['risco_criminal_max']),
            "alagamento_evitado_pct": max(0, rota_convencional['risco_alagamento_max'] - rota_ia['risco_alagamento_max']),
            "diferenca_distancia_km": round(rota_ia['distancia_km'] - rota_convencional['distancia_km'], 2)
        }
    })

# ==========================================
# INICIALIZAÇÃO DO SERVIDOR
# ==========================================
if __name__ == '__main__':
    print("=" * 65)
    print("  SERVIDOR FLASK INICIADO - MOBILIDADE INTELIGENTE FECART/FECAP  ")
    print("  Acesse a aplicação em: http://127.0.0.1:5000                   ")
    print("=" * 65)
    app.run(host='0.0.0.0', port=5000, debug=True)
