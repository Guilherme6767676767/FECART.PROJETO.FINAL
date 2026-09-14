# Backend de dados reais — Sentinel IA

## Instalação

```bash
pip install -r backend/requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Endpoints:

- `GET /api/v1/clima/geojson?lat=-23.5505&lon=-46.6333`
- `GET /api/v1/acidentes?limit=5000`
- `GET /api/v1/transito/geojson?lat=-23.5505&lon=-46.6333`
- `GET /api/v1/riscos-criminalidade`

Todos devolvem `FeatureCollection` GeoJSON com coordenadas WGS84 no formato
`[longitude, latitude]`.

O clima usa o Open-Meteo sem chave. A resposta traz temperatura, umidade,
precipitação, probabilidade de chuva, probabilidade de tempestade e um alerta
derivado do limiar configurado ou dos códigos WMO de trovoada.

Para acidentes, configure `GEOSAMPA_ACCIDENTS_URL` com um recurso GeoJSON,
ArcGIS JSON ou CSV da camada INFOCRIM/GeoSampa. Registros sem coordenadas são
descartados; o backend nunca inventa pontos.

Para criminalidade, configure `SSP_CRIME_DATA_URL` com o CSV/XLSX oficial
exportado da SSP-SP e `SSP_DISTRICTS_GEOJSON_URL` com os polígonos dos distritos
ou bairros. O adaptador soma roubos e furtos e classifica cada região por
tercis do volume observado (Baixo/Médio/Alto). Se a fonte tiver apenas totais
por município/unidade, o retorno não deve ser tratado como ponto individual.

Cada fonte tem timeout, retry para 429/5xx, cache TTL e erro HTTP 503
normalizado. Em múltiplas réplicas, o `TTLCache` pode ser substituído por Redis
usando `REDIS_URL`.

O trânsito usa o TomTom Traffic Flow, que retorna velocidade atual, velocidade
em fluxo livre, tempo de viagem, confiança, fechamento da via e geometria do
segmento mais próximo. Configure `TOMTOM_API_KEY`; sem a chave o endpoint
retorna uma coleção vazia com a indicação de configuração pendente.
