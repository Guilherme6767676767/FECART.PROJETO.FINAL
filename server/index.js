// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // serve static front‑end
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'data', 'incidents.json');
const MAX_STORAGE = 1000; // keep up to 1000 incidents in file (FIFO eviction for very old ones)

// Helper to load incidents (array of objects)
function loadIncidents() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Failed to parse incidents.json', e);
    return [];
  }
}

function saveIncidents(incidents) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2), 'utf8');
}

// GET /incidents?limit=10 – returns most recent incidents (sorted by date descending)
app.get('/incidents', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const all = loadIncidents();
  // sort by date (ISO strings) descending
  const sorted = all.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted.slice(0, limit));
});

// POST /incidents – add new incident (expects JSON body with fields matching our schema)
app.post('/incidents', (req, res) => {
  const { date, city, type, location, source } = req.body;
  if (!date || !city || !type || !location || !source) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const incidents = loadIncidents();
  incidents.push({ date, city, type, location, source });
  // keep only the most recent MAX_STORAGE entries
  const sorted = incidents.sort((a, b) => new Date(b.date) - new Date(a.date));
  const trimmed = sorted.slice(0, MAX_STORAGE);
  saveIncidents(trimmed);
  res.status(201).json({ message: 'Incident added' });
});

// GET /stats – aggregated statistics for the dashboard
app.get('/stats', (req, res) => {
  const incidents = loadIncidents();
  const total = incidents.length;
  const byType = {};
  const byCity = {};
  incidents.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
    byCity[i.city] = (byCity[i.city] || 0) + 1;
  });
  res.json({ total, byType, byCity });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
