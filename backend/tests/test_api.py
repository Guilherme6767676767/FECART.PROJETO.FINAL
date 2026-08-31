import asyncio
import sys
import os

# Suporte a UTF-8 em terminais Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Adiciona o diretório backend ao sys.path para importar os módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.weather_service import get_sao_paulo_weather
from database import buscar_ocorrencias, obter_estatisticas_resumo

async def test_weather():
    print("🌤️ Testando serviço de clima...")
    clima = await get_sao_paulo_weather(force_refresh=True)
    print(f"   Cidade: {clima.cidade}")
    print(f"   Temperatura: {clima.temperatura}°C (Sensação: {clima.sensacao_termica}°C)")
    print(f"   Condição: {clima.condicao}")
    print(f"   Umidade: {clima.umidade}% | Vento: {clima.vento_kmh} km/h")
    print(f"   Precipitação: {clima.precipitacao_mm} mm | Risco: {clima.alerta_risco}")
    print(f"   Fonte: {clima.fonte}")
    assert clima.temperatura is not None
    assert clima.cidade is not None
    print("✅ Teste de Clima APROVADO!\n")

def test_database():
    print("🛡️ Testando consulta de ocorrências...")
    todas = buscar_ocorrencias()
    print(f"   Total de registros carregados: {len(todas)}")
    assert len(todas) > 0

    filtradas_se = buscar_ocorrencias(bairro="Sé")
    print(f"   Ocorrências no bairro 'Sé': {len(filtradas_se)}")
    assert any("Sé" in r["bairro"] for r in filtradas_se)

    filtradas_criticas = buscar_ocorrencias(gravidade="CRITICA")
    print(f"   Ocorrências críticas: {len(filtradas_criticas)}")
    assert all(r["gravidade"] == "CRITICA" for r in filtradas_criticas)

    resumo = obter_estatisticas_resumo()
    print(f"   Resumo estatístico: {resumo}")
    assert resumo["total_ocorrencias"] == len(todas)
    print("✅ Teste de Ocorrências APROVADO!\n")

if __name__ == "__main__":
    test_database()
    asyncio.run(test_weather())
    print("🎉 Todos os testes de integração do Backend passaram com sucesso!")
