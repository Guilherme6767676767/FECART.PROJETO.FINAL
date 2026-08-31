import sys
import os
from starlette.testclient import TestClient

# Suporte a UTF-8 em terminais Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_health():
    print("🔬 Testando GET /health...")
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ONLINE"
    print("   -> OK:", data)

def test_clima_endpoint():
    print("\n🌤️ Testando GET /api/v1/clima...")
    resp = client.get("/api/v1/clima")
    assert resp.status_code == 200
    data = resp.json()
    assert "temperatura" in data
    assert "umidade" in data
    assert "alerta_risco" in data
    print(f"   -> Clima recebido: {data['cidade']} | {data['temperatura']}°C | Risco: {data['alerta_risco']}")

def test_ocorrencias_endpoint():
    print("\n🛡️ Testando GET /api/v1/ocorrencias (Filtros e Paginação)...")
    resp = client.get("/api/v1/ocorrencias?page=1&page_size=3")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pagina"] == 1
    assert data["tamanho_pagina"] == 3
    assert len(data["ocorrencias"]) == 3
    print(f"   -> Retornadas {len(data['ocorrencias'])} ocorrências da pág 1 de {data['total_paginas']}")

    # Teste de filtro por Bairro
    resp_se = client.get("/api/v1/ocorrencias?bairro=Sé")
    assert resp_se.status_code == 200
    data_se = resp_se.json()
    assert all("sé" in item["bairro"].lower() for item in data_se["ocorrencias"])
    print(f"   -> Filtro por Bairro (Sé): {len(data_se['ocorrencias'])} registros validados")

def test_resumo_endpoint():
    print("\n📊 Testando GET /api/v1/ocorrencias/resumo...")
    resp = client.get("/api/v1/ocorrencias/resumo")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_ocorrencias"] > 0
    assert "bairro_mais_afetado" in data
    print(f"   -> Resumo: {data['total_ocorrencias']} BOs, {data['criticas']} críticas, mais afetado: {data['bairro_mais_afetado']}")

def test_simulacao_endpoints():
    print("\n⚡ Testando POST /api/v1/simulacao/disparar...")
    payload = {
        "titulo": "Alagamento Grave no Túnel",
        "tipo_crime": "Alagamento Iminente",
        "bairro": "Pinheiros",
        "logradouro": "Av. Rebouças, 1500",
        "latitude": -23.5675,
        "longitude": -46.6920,
        "gravidade": "CRITICA"
    }
    resp = client.post("/api/v1/simulacao/disparar", json=payload)
    if resp.status_code != 200:
        print("ERRO:", resp.status_code, resp.text)
    assert resp.status_code == 200
    data = resp.json()
    assert data["sucesso"] is True
    assert data["score_risco_calculado"] >= 80
    assert "acoes_recomendadas" in data
    print(f"   -> Simulação individual: {data['ocorrencia']['numero_bo']} | Score: {data['score_risco_calculado']} | {data['nivel_alerta']}")

    print("\n⚡ Testando POST /api/v1/simulacao/cenario (tempestade_marginal)...")
    resp_cenario = client.post("/api/v1/simulacao/cenario", json={"cenario_id": "tempestade_marginal"})
    assert resp_cenario.status_code == 200
    cenario_data = resp_cenario.json()
    assert cenario_data["eventos_gerados"] >= 2
    print(f"   -> Cenário disparado: {cenario_data['cenario_id']} com {cenario_data['eventos_gerados']} eventos")

    print("\n⚡ Testando DELETE /api/v1/simulacao/limpar...")
    resp_limpar = client.delete("/api/v1/simulacao/limpar")
    assert resp_limpar.status_code == 200
    print("   -> Limpeza de simulações concluída com sucesso.")


def test_chat_endpoint():
    print("\n🤖 Testando POST /api/v1/chat (Perguntas, Telemetria e Comandos de Ação)...")
    payload = {
        "message": "Simule uma tempestade na Marginal Tietê e abra o mapa",
        "current_page": "dashboard.html"
    }
    resp = client.post("/api/v1/chat", json=payload)
    if resp.status_code != 200:
        print("ERRO NO CHAT:", resp.status_code, resp.text)
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data
    assert len(data["response"]) > 20
    assert "actions" in data
    print(f"   -> Resposta do Chat ({data['model_used']}): {data['response'][:80]}...")
    print(f"   -> Ações Táticas Detectadas: {len(data['actions'])} comandos (Ex: {[a['type'] for a in data['actions']]})")


if __name__ == "__main__":
    test_health()
    test_clima_endpoint()
    test_ocorrencias_endpoint()
    test_resumo_endpoint()
    test_simulacao_endpoints()
    test_chat_endpoint()
    print("\n🎯 TODOS OS TESTES (INCLUINDO CHATBOT COM AÇÕES E TELEMETRIA) PASSARAM COM 100% DE SUCESSO!")

