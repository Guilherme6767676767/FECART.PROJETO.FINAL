const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8000;
const DATA_FILE = path.join(__dirname, 'data', 'crimes.json');

// Helper para ler data/crimes.json
function getCrimes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler crimes.json:', err);
  }
  return [];
}

// Helper para salvar data/crimes.json
function saveCrimes(crimes) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(crimes, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar crimes.json:', err);
    return false;
  }
}

// Cálculo de pontos de alagamento
function getPontosAlagamento(chuva_mm = 0) {
  const pontosBase = [
    { id: "ALAG-01", local: "Marginal Tietê — Ponte das Bandeiras", bairro: "Santana / Bom Retiro", latitude: -23.5180, longitude: -46.6260, vulnerabilidade: 0.75, historico: "Transbordamento recorrente do Rio Tietê em chuvas > 15mm." },
    { id: "ALAG-02", local: "Marginal Pinheiros — Ponte Cidade Universitária", bairro: "Pinheiros / Butantã", latitude: -23.5650, longitude: -46.7080, vulnerabilidade: 0.65, historico: "Alagamento na pista expressa sentido Castelo Branco." },
    { id: "ALAG-03", local: "Vale do Anhangabaú & Av. São João", bairro: "Centro Histórico", latitude: -23.5435, longitude: -46.6375, vulnerabilidade: 0.85, historico: "Acúmulo rápido de água pluvial no fundo de vale." },
    { id: "ALAG-04", local: "Av. 23 de Maio — Túnel Ayrton Senna", bairro: "Vila Mariana / Ibirapuera", latitude: -23.5820, longitude: -46.6530, vulnerabilidade: 0.60, historico: "Bloqueio do túnel por bolsões de água." },
    { id: "ALAG-05", local: "Av. do Estado & Viaduto Pacheco Chaves", bairro: "Mooca / Ipiranga", latitude: -23.5690, longitude: -46.6080, vulnerabilidade: 0.80, historico: "Transbordamento do Rio Tamanduateí." },
    { id: "ALAG-06", local: "Av. Aricanduva — Próximo ao Shopping", bairro: "Aricanduva / Zona Leste", latitude: -23.5590, longitude: -46.5210, vulnerabilidade: 0.82, historico: "Ponto crítico de alagamento com histórico de enxurradas." },
    { id: "ALAG-07", local: "Rua Turiassu / Palestra Itália", bairro: "Perdizes / Lapa", latitude: -23.5280, longitude: -46.6800, vulnerabilidade: 0.55, historico: "Bolsão de água na altura do Viaduto Antártica." },
    { id: "ALAG-08", local: "Av. Santo Amaro x Av. Roque Petroni Júnior", bairro: "Santo Amaro / Brooklin", latitude: -23.6230, longitude: -46.6960, vulnerabilidade: 0.50, historico: "Acúmulo de água pluvial no cruzamento." }
  ];

  return pontosBase.map(p => {
    const score = (chuva_mm * 4.0) + (p.vulnerabilidade * 40.0);
    let nivel = "Baixo";
    let rec = "🟢 Via transitável. Sensores operando em monitoramento preventivo.";
    if (score >= 60 || chuva_mm >= 12) {
      nivel = "Alto";
      rec = "🚨 Evitar a via. Risco de interdição total e alagamento severo.";
    } else if (score >= 35 || chuva_mm >= 3) {
      nivel = "Médio";
      rec = "⚠️ Atenção redobrada. Tráfego lento e formação de bolsões d'água.";
    }
    return {
      id: p.id,
      local: p.local,
      bairro: p.bairro,
      latitude: p.latitude,
      longitude: p.longitude,
      nivel_risco: nivel,
      precipitacao_mm: Number(chuva_mm.toFixed(1)),
      descricao: p.historico,
      recomendacao: rec
    };
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Rota /api/clima (Open-Meteo)
  if (pathname === '/api/clima' && req.method === 'GET') {
    const lat = parseFloat(query.lat) || -23.5505;
    const lon = parseFloat(query.lon) || -46.6333;
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&hourly=precipitation_probability`;

    try {
      const response = await fetch(openMeteoUrl);
      const data = await response.json();
      const curr = data.current || {};
      const temp = curr.temperature_2m ?? 24.0;
      const rain = curr.precipitation ?? 0.0;
      const hum = curr.relative_humidity_2m ?? 65;
      const wind = curr.wind_speed_10m ?? 12.0;
      const w_code = curr.weather_code ?? 0;
      const hourlyProbs = data.hourly?.precipitation_probability || [];
      const probChuva = hourlyProbs[0] ?? (rain > 0 ? 80 : 15);

      let condicao = "Céu Limpo";
      let icone = "sun";
      if (w_code >= 1 && w_code <= 3) { condicao = "Parcialmente Nublado"; icone = "cloud-sun"; }
      else if (w_code >= 51 && w_code <= 82) { condicao = "Chuva / Pancadas"; icone = "cloud-rain"; }
      else if (w_code >= 95) { condicao = "Tempestade / Trovoadas"; icone = "zap"; }
      else if (w_code > 3) { condicao = "Nublado"; icone = "cloud"; }

      let risco = "BAIXO (Condições Estáveis)";
      if (rain >= 20 || wind >= 55) risco = "CRÍTICO (Alagamento Iminente / Rajadas)";
      else if (rain >= 8 || wind >= 38) risco = "ALTO (Atenção para Vias Expressas)";
      else if (rain >= 1 || temp >= 33) risco = "MÉDIO (Monitoramento Ativo)";

      const result = {
        cidade: "São Paulo, SP",
        latitude: lat,
        longitude: lon,
        temperatura: temp,
        sensacao_termica: curr.apparent_temperature ?? temp,
        precipitacao: rain,
        precipitacao_mm: rain,
        probabilidade_chuva: probChuva,
        umidade: hum,
        vento_kmh: wind,
        condicao: condicao,
        alerta_risco: risco,
        icone: icone,
        atualizado_em: new Date().toLocaleTimeString('pt-BR'),
        fonte: "Open-Meteo API"
      };

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        cidade: "São Paulo, SP",
        latitude: lat,
        longitude: lon,
        temperatura: 24.2,
        sensacao_termica: 25.0,
        precipitacao: 0.0,
        precipitacao_mm: 0.0,
        probabilidade_chuva: 15,
        umidade: 64,
        vento_kmh: 12.0,
        condicao: "Tempo Estável",
        alerta_risco: "BAIXO (Condições Estáveis)",
        icone: "cloud-sun",
        atualizado_em: new Date().toLocaleTimeString('pt-BR'),
        fonte: "Sentinel IA Local Telemetry"
      }));
    }
    return;
  }

  // 2. Rota /api/alagamentos
  if (pathname === '/api/alagamentos' && req.method === 'GET') {
    let chuva = 0;
    try {
      const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=precipitation');
      const d = await resp.json();
      chuva = d.current?.precipitation || 0;
    } catch (e) {}

    const pontos = getPontosAlagamento(chuva);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(pontos));
    return;
  }

  // 3. Rota /api/crimes (GET / POST)
  if (pathname === '/api/crimes') {
    if (req.method === 'GET') {
      const crimes = getCrimes();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(crimes));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const crimes = getCrimes();
          const novoId = `CR-${Date.now().toString().slice(-6)}`;
          const novoCrime = {
            id: novoId,
            latitude: parseFloat(payload.latitude) || -23.5505,
            longitude: parseFloat(payload.longitude) || -46.6333,
            categoria: payload.categoria ? payload.categoria.trim() : "Outros",
            data_hora: payload.data_hora || new Date().toISOString(),
            descricao: payload.descricao ? payload.descricao.trim() : "Sem descrição adicional"
          };
          crimes.unshift(novoCrime);
          saveCrimes(crimes);

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(novoCrime));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: "Payload JSON inválido" }));
        }
      });
      return;
    }
  }

  // 4. Servir Arquivos Estáticos (Frontend)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sentinel IA Server rodando em http://localhost:${PORT}`);
});
