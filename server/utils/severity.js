// server/utils/severity.js

/**
 * Determine severity level and associated color for an incident type.
 * Returns an object { level: 'ALTA'|'MEDIA'|'BAIXA', color: '#ff00ff' }.
 */
function getSeverity(type) {
  const alta = [
    'Homicídio',
    'Feminicídio / ocultação de cadáver',
    'Sequestro e homicídio',
    'Confronto policial',
    'Morte em abordagem policial',
    'Desabamento',
    'Chuvas / mortes'
  ];
  const mediaBaixa = [
    'Atropelamento fatal',
    'Acidente rodoviário',
    'Morte suspeita / investigação',
    'Prisão por investigação',
    'Acidente de trânsito',
    'Acidente de trabalho fatal',
    'Tentativa de feminicídio',
    'Tentativa de homicídio',
    'Morte por ataque de abelhas',
    'Afogamento / morte suspeita',
    'Morte privada e violência sexual',
    'Perseguição policial / acidente',
    'Morte suspeita',
    'Acidente / queda de passarela',
    'Morte em abordagem policial',
    'Cárcere privado e violência sexual',
    'Morte privada e violência sexual'
  ];

  const normalized = type.trim().toLowerCase();
  const isAlta = alta.some(t => normalized.includes(t.toLowerCase()));
  if (isAlta) {
    return { level: 'ALTA', color: '#ff00ff' }; // neon pink
  }
  const isMedia = mediaBaixa.some(t => normalized.includes(t.toLowerCase()));
  if (isMedia) {
    // simple heuristic: if contains "fatal" or "morte" treat as MEDIA, else BAIXA
    const level = normalized.includes('fatal') || normalized.includes('morte') ? 'MEDIA' : 'BAIXA';
    const colorMap = { 'MEDIA': '#ffae42', 'BAIXA': '#00ffff' }; // orange for media, cyan for baixa
    return { level, color: colorMap[level] };
  }
  // default
  return { level: 'BAIXA', color: '#00ffff' };
}

module.exports = { getSeverity };
