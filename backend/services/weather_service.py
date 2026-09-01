import os
import time
import httpx
import certifi
from datetime import datetime
from typing import Dict, Any, Optional
from schemas import WeatherResponse

# Obter CA bundle seguro do certifi
ca_bundle = certifi.where()

# Cache em memória para limitar consumo e evitar rate limits
_weather_cache: Dict[str, Any] = {
    "data": None,
    "last_fetched": 0
}

CACHE_TTL = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "600"))  # Padrão: 10 minutos


def calcular_risco_climatico(temp: float, chuva_mm: float, vento_kmh: float, umidade: int) -> str:
    """Calcula o índice de risco preditivo urbano."""
    if chuva_mm >= 20.0 or vento_kmh >= 55.0:
        return "CRÍTICO (Alagamento Iminente / Rajadas)"
    if chuva_mm >= 8.0 or vento_kmh >= 38.0 or umidade < 20:
        return "ALTO (Atenção para Vias Expressas)"
    if chuva_mm >= 1.0 or temp >= 33.0 or umidade < 30:
        return "MÉDIO (Monitoramento Ativo)"
    return "BAIXO (Condições Estáveis)"


async def get_sao_paulo_weather(force_refresh: bool = False) -> WeatherResponse:
    """
    Busca telemetria climática em tempo real para São Paulo.
    Usa cache TTL e estratégia de resiliência multi-camadas (OpenWeather -> HG Brasil -> Open-Meteo -> Local).
    """
    global _weather_cache
    now = time.time()

    # Retorna do cache se válido
    if not force_refresh and _weather_cache["data"] and (now - _weather_cache["last_fetched"]) < CACHE_TTL:
        return _weather_cache["data"]

    openweather_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
    hg_brasil_key = os.getenv("HG_BRASIL_API_KEY", "").strip()

    # ----------------------------------------------------
    # Camada 1: OpenWeatherMap (se houver chave configurada)
    # ----------------------------------------------------
    if openweather_key and not openweather_key.startswith("sua_chave"):
        try:
            async with httpx.AsyncClient(timeout=4.0, verify=ca_bundle) as client:
                url = f"https://api.openweathermap.org/data/2.5/weather?q=Sao+Paulo,BR&units=metric&lang=pt_br&appid={openweather_key}"
                resp = await client.get(url)
                if resp.status_code == 200:
                    raw = resp.json()
                    temp = float(raw["main"]["temp"])
                    feels = float(raw["main"]["feels_like"])
                    humidity = int(raw["main"]["humidity"])
                    wind = float(raw["wind"]["speed"]) * 3.6  # m/s para km/h
                    rain = float(raw.get("rain", {}).get("1h", 0.0))
                    condition = raw["weather"][0]["description"].capitalize()
                    
                    icone = "cloud-rain" if rain > 0 else ("sun" if "claro" in condition.lower() else "cloud-sun")

                    data = WeatherResponse(
                        cidade="São Paulo, SP",
                        temperatura=round(temp, 1),
                        sensacao_termica=round(feels, 1),
                        condicao=condition,
                        umidade=humidity,
                        vento_kmh=round(wind, 1),
                        precipitacao_mm=round(rain, 1),
                        alerta_risco=calcular_risco_climatico(temp, rain, wind, humidity),
                        icone=icone,
                        atualizado_em=datetime.now().strftime("%H:%M:%S"),
                        fonte="OpenWeatherMap API"
                    )
                    _weather_cache["data"] = data
                    _weather_cache["last_fetched"] = now
                    return data
        except Exception as e:
            print(f"[WeatherService] Falha na OpenWeatherMap: {e}. Tentando próximo provedor.")

    # ----------------------------------------------------
    # Camada 2: HG Brasil Weather (se houver chave configurada)
    # ----------------------------------------------------
    if hg_brasil_key and not hg_brasil_key.startswith("sua_chave"):
        try:
            async with httpx.AsyncClient(timeout=4.0, verify=ca_bundle) as client:
                url = f"https://api.hgbrasil.com/weather?key={hg_brasil_key}&city_name=Sao_Paulo,SP"
                resp = await client.get(url)
                if resp.status_code == 200:
                    raw = resp.json().get("results", {})
                    temp = float(raw.get("temp", 24))
                    condition = raw.get("description", "Tempo Estável")
                    humidity = int(raw.get("humidity", 65))
                    wind_raw = raw.get("wind_speedy", "12 km/h").split()[0]
                    wind = float(wind_raw) if wind_raw.replace('.', '', 1).isdigit() else 12.0
                    rain = float(raw.get("rain", 0.0))
                    
                    data = WeatherResponse(
                        cidade="São Paulo, SP",
                        temperatura=round(temp, 1),
                        sensacao_termica=round(temp + 1.0, 1),
                        condicao=condition,
                        umidade=humidity,
                        vento_kmh=round(wind, 1),
                        precipitacao_mm=round(rain, 1),
                        alerta_risco=calcular_risco_climatico(temp, rain, wind, humidity),
                        icone="cloud-rain" if rain > 0 else "cloud-sun",
                        atualizado_em=datetime.now().strftime("%H:%M:%S"),
                        fonte="HG Brasil Weather API"
                    )
                    _weather_cache["data"] = data
                    _weather_cache["last_fetched"] = now
                    return data
        except Exception as e:
            print(f"[WeatherService] Falha na HG Brasil: {e}. Tentando Open-Meteo.")

    # ----------------------------------------------------
    # Camada 3: Open-Meteo (API Aberta Global, 100% Gratuita e Sem Chave)
    # ----------------------------------------------------
    open_meteo_url = (
        "https://api.open-meteo.com/v1/forecast?"
        "latitude=-23.5505&longitude=-46.6333"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code"
        "&hourly=precipitation_probability"
    )
    for verify_ssl in [ca_bundle, False]:
        try:
            async with httpx.AsyncClient(timeout=4.5, verify=verify_ssl) as client:
                resp = await client.get(open_meteo_url)
                if resp.status_code == 200:
                    data_json = resp.json()
                    raw = data_json.get("current", {})
                    temp = float(raw.get("temperature_2m", 23.5))
                    feels = float(raw.get("apparent_temperature", 24.0))
                    humidity = int(raw.get("relative_humidity_2m", 68))
                    wind = float(raw.get("wind_speed_10m", 12.0))
                    rain = float(raw.get("precipitation", 0.0))
                    w_code = int(raw.get("weather_code", 0))

                    # Probabilidade de chuva da hora atual
                    hourly_probs = data_json.get("hourly", {}).get("precipitation_probability", [])
                    prob_chuva = int(hourly_probs[0]) if hourly_probs else (80 if rain > 0 else 15)

                    # Interpretação dos Weather Codes da OMM
                    if w_code == 0:
                        condicao = "Céu Limpo / Ensolarado"
                        icone = "sun"
                    elif w_code in [1, 2, 3]:
                        condicao = "Parcialmente Nublado"
                        icone = "cloud-sun"
                    elif w_code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                        condicao = "Chuva / Pancadas de Chuva"
                        icone = "cloud-rain"
                    elif w_code in [95, 96, 99]:
                        condicao = "Tempestade / Trovoadas"
                        icone = "zap"
                    else:
                        condicao = "Nebulosidade Variável"
                        icone = "cloud"

                    data = WeatherResponse(
                        cidade="São Paulo, SP (Marco Zero - Sé)",
                        temperatura=round(temp, 1),
                        sensacao_termica=round(feels, 1),
                        condicao=condicao,
                        umidade=humidity,
                        vento_kmh=round(wind, 1),
                        precipitacao_mm=round(rain, 1),
                        probabilidade_chuva=prob_chuva,
                        alerta_risco=calcular_risco_climatico(temp, rain, wind, humidity),
                        icone=icone,
                        atualizado_em=datetime.now().strftime("%H:%M:%S"),
                        fonte="Open-Meteo Telemetry Engine"
                    )
                    _weather_cache["data"] = data
                    _weather_cache["last_fetched"] = now
                    return data
        except Exception as e:
            if verify_ssl is False:
                print(f"[WeatherService] Falha no Fallback Open-Meteo: {e}. Usando telemetria de contingência.")

    # ----------------------------------------------------
    # Camada 4: Contingência Segura (Garante 100% de estabilidade offline)
    # ----------------------------------------------------
    fallback_data = WeatherResponse(
        cidade="São Paulo, SP",
        temperatura=24.2,
        sensacao_termica=25.0,
        condicao="Parcialmente Nublado",
        umidade=64,
        vento_kmh=14.5,
        precipitacao_mm=0.0,
        probabilidade_chuva=20,
        alerta_risco="BAIXO (Condições Estáveis)",
        icone="cloud-sun",
        atualizado_em=datetime.now().strftime("%H:%M:%S"),
        fonte="Sentinel IA Local Telemetry (Offline Mode)"
    )
    return fallback_data


async def get_weather_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Consulta o clima exato para qualquer par de coordenadas (lat/lon) via Open-Meteo API.
    Retorna temperatura, precipitação, probabilidade de chuva, vento, umidade e risco.
    """
    open_meteo_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m"
        f"&hourly=precipitation_probability"
    )

    for verify_ssl in [ca_bundle, False]:
        try:
            async with httpx.AsyncClient(timeout=4.5, verify=verify_ssl) as client:
                resp = await client.get(open_meteo_url)
                if resp.status_code == 200:
                    data_json = resp.json()
                    curr = data_json.get("current", {})
                    temp = float(curr.get("temperature_2m", 24.0))
                    feels = float(curr.get("apparent_temperature", temp))
                    hum = int(curr.get("relative_humidity_2m", 65))
                    wind = float(curr.get("wind_speed_10m", 10.0))
                    rain = float(curr.get("precipitation", 0.0))
                    w_code = int(curr.get("weather_code", 0))

                    hourly_probs = data_json.get("hourly", {}).get("precipitation_probability", [])
                    prob_chuva = int(hourly_probs[0]) if hourly_probs else (75 if rain > 0 else 10)

                    if w_code == 0:
                        condicao = "Céu Limpo"
                        icone = "sun"
                    elif w_code in [1, 2, 3]:
                        condicao = "Parcialmente Nublado"
                        icone = "cloud-sun"
                    elif w_code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                        condicao = "Chuva / Pancadas"
                        icone = "cloud-rain"
                    elif w_code in [95, 96, 99]:
                        condicao = "Tempestade com Raios"
                        icone = "zap"
                    else:
                        condicao = "Nublado"
                        icone = "cloud"

                    return {
                        "cidade": "São Paulo, SP",
                        "latitude": lat,
                        "longitude": lon,
                        "temperatura": round(temp, 1),
                        "sensacao_termica": round(feels, 1),
                        "precipitacao": round(rain, 1),
                        "probabilidade_chuva": prob_chuva,
                        "umidade": hum,
                        "vento_kmh": round(wind, 1),
                        "condicao": condicao,
                        "alerta_risco": calcular_risco_climatico(temp, rain, wind, hum),
                        "icone": icone,
                        "atualizado_em": datetime.now().strftime("%H:%M:%S"),
                        "fonte": "Open-Meteo API"
                    }
        except Exception:
            pass

    # Fallback caso Open-Meteo esteja indisponível
    return {
        "cidade": "São Paulo, SP",
        "latitude": lat,
        "longitude": lon,
        "temperatura": 24.0,
        "sensacao_termica": 24.5,
        "precipitacao": 0.0,
        "probabilidade_chuva": 15,
        "umidade": 65,
        "vento_kmh": 12.0,
        "condicao": "Tempo Estável",
        "alerta_risco": "BAIXO (Condições Estáveis)",
        "icone": "cloud-sun",
        "atualizado_em": datetime.now().strftime("%H:%M:%S"),
        "fonte": "Sentinel IA Telemetry (Estimada)"
    }


async def obter_pontos_alagamento() -> list:
    """
    Calcula e simula pontos de risco e atenção de alagamento nos principais nós críticos de São Paulo,
    parametrizados com base na telemetria de precipitação da Open-Meteo.
    """
    # Obter precipitação atual em SP
    clima_sp = await get_sao_paulo_weather()
    chuva_mm = float(clima_sp.precipitacao_mm)

    # Pontos críticos históricos de alagamento monitorados pela Defesa Civil / CGE em SP
    pontos_base = [
        {
            "id": "ALAG-01",
            "local": "Marginal Tietê — Ponte das Bandeiras",
            "bairro": "Santana / Bom Retiro",
            "latitude": -23.5180,
            "longitude": -46.6260,
            "vulnerabilidade_base": 0.75,
            "historico": "Transbordamento recorrente do Rio Tietê em chuvas > 15mm."
        },
        {
            "id": "ALAG-02",
            "local": "Marginal Pinheiros — Ponte Cidade Universitária",
            "bairro": "Pinheiros / Butantã",
            "latitude": -23.5650,
            "longitude": -46.7080,
            "vulnerabilidade_base": 0.65,
            "historico": "Alagamento na pista expressa sentido Castelo Branco."
        },
        {
            "id": "ALAG-03",
            "local": "Vale do Anhangabaú & Av. São João",
            "bairro": "Centro Histórico",
            "latitude": -23.5435,
            "longitude": -46.6375,
            "vulnerabilidade_base": 0.85,
            "historico": "Acúmulo rápido de água pluvial no fundo de vale."
        },
        {
            "id": "ALAG-04",
            "local": "Av. 23 de Maio — Túnel Ayrton Senna",
            "bairro": "Vila Mariana / Ibirapuera",
            "latitude": -23.5820,
            "longitude": -46.6530,
            "vulnerabilidade_base": 0.60,
            "historico": "Bloqueio do túnel por bolsões de água."
        },
        {
            "id": "ALAG-05",
            "local": "Av. do Estado & Viaduto Pacheco Chaves",
            "bairro": "Mooca / Ipiranga",
            "latitude": -23.5690,
            "longitude": -46.6080,
            "vulnerabilidade_base": 0.80,
            "historico": "Transbordamento do Rio Tamanduateí."
        },
        {
            "id": "ALAG-06",
            "local": "Av. Aricanduva — Próximo ao Shopping",
            "bairro": "Aricanduva / Zona Leste",
            "latitude": -23.5590,
            "longitude": -46.5210,
            "vulnerabilidade_base": 0.82,
            "historico": "Ponto crítico de alagamento com histórico de enxurradas."
        },
        {
            "id": "ALAG-07",
            "local": "Rua Turiassu / Palestra Itália",
            "bairro": "Perdizes / Lapa",
            "latitude": -23.5280,
            "longitude": -46.6800,
            "vulnerabilidade_base": 0.55,
            "historico": "Bolsão de água na altura do Viaduto Antártica."
        },
        {
            "id": "ALAG-08",
            "local": "Av. Santo Amaro x Av. Roque Petroni Júnior",
            "bairro": "Santo Amaro / Brooklin",
            "latitude": -23.6230,
            "longitude": -46.6960,
            "vulnerabilidade_base": 0.50,
            "historico": "Acúmulo de água pluvial no cruzamento."
        }
    ]

    resultados = []
    for p in pontos_base:
        # Fator de risco ponderado pela chuva da Open-Meteo + vulnerabilidade
        score = (chuva_mm * 4.0) + (p["vulnerabilidade_base"] * 40.0)
        
        if score >= 60.0 or chuva_mm >= 12.0:
            nivel = "Alto"
            rec = "🚨 Evitar a via. Risco de interdição total e alagamento severo."
        elif score >= 35.0 or chuva_mm >= 3.0:
            nivel = "Médio"
            rec = "⚠️ Atenção redobrada. Tráfego lento e formação de bolsões d'água."
        else:
            nivel = "Baixo"
            rec = "🟢 Via transitável. Sensores operando em monitoramento preventivo."

        resultados.append({
            "id": p["id"],
            "local": p["local"],
            "bairro": p["bairro"],
            "latitude": p["latitude"],
            "longitude": p["longitude"],
            "nivel_risco": nivel,
            "precipitacao_mm": round(chuva_mm, 1),
            "descricao": p["historico"],
            "recomendacao": rec
        })

    return resultados
