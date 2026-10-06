// server.js – New 3D multiplayer shooter backend
// Uses Express + Socket.io to serve static files and manage game state

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Import game data
const { weapons, skins } = require('./src/weaponCatalog');
const { maps } = require('./src/maps');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const PORT = process.env.PORT || 8000;

// Serve static client files
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Game state (in‑memory, simple for prototype)
// ---------------------------------------------------------------------------
const gameState = {
  mode: 'training', // 'training' or 'bomb'
  map: maps.desert, // current map object
  players: {}, // socketId => player object
  teams: { TR: [], CT: [] }, // only used in bomb mode
  bomb: {
    planted: false,
    location: null, // {x, y, z}
    planterId: null,
    timer: null,
    explodeTime: 30_000, // 30 s
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
function assignTeams() {
  const ids = Object.keys(gameState.players);
  // Shuffle IDs
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const half = Math.ceil(ids.length / 2);
  gameState.teams.TR = ids.slice(0, half);
  gameState.teams.CT = ids.slice(half);
  // Update player objects
  gameState.teams.TR.forEach(id => (gameState.players[id].team = 'TR'));
  gameState.teams.CT.forEach(id => (gameState.players[id].team = 'CT'));
  io.emit('teamAssignment', { teams: gameState.teams });
}

function startTraining() {
  gameState.mode = 'training';
  io.emit('modeChanged', { mode: 'training' });
}

function startBombMode() {
  gameState.mode = 'bomb';
  assignTeams();
  io.emit('modeChanged', { mode: 'bomb' });
}

function respawnPlayer(player) {
  // simple random spawn within map bounds
  const { width, height } = gameState.map;
  player.x = Math.random() * width;
  player.y = 0; // ground level
  player.z = Math.random() * height;
  player.hp = 100;
  io.to(player.id).emit('respawn', { player });
}

function endRound(winningTeam) {
  io.emit('roundEnd', { winner: winningTeam });
  // Reset bomb and respawn all players
  gameState.bomb = { planted: false, location: null, planterId: null, timer: null, explodeTime: 30_000 };
  Object.values(gameState.players).forEach(p => respawnPlayer(p));
  // In bomb mode we re‑assign teams each round (optional)
  if (gameState.mode === 'bomb') assignTeams();
}

// ---------------------------------------------------------------------------
// Socket.io event handling
// ---------------------------------------------------------------------------
io.on('connection', socket => {
  console.log(`🟢 Player connected: ${socket.id}`);

  // Create a new player object
  const player = {
    id: socket.id,
    x: 0,
    y: 0,
    z: 0,
    hp: 100,
    weapon: 'rifle', // default weapon key
    skin: 'classic', // default skin key
    outfit: '#00aaff', // default clothing color (hex)
    team: null,
    rotationY: 0, // direction the player faces (radians)
  };
  gameState.players[socket.id] = player;

  // Send initial data to the newly connected client
  socket.emit('init', {
    player,
    weapons,
    skins,
    map: gameState.map,
    mode: gameState.mode,
  });

  // Broadcast new player to others
  socket.broadcast.emit('playerJoined', { player });

  // -----------------------------------------------------------------------
  // Gameplay messages
  // -----------------------------------------------------------------------
  socket.on('move', data => {
    // data: {x, y, z, rotationY}
    const p = gameState.players[socket.id];
    if (!p) return;
    p.x = data.x;
    p.y = data.y;
    p.z = data.z;
    p.rotationY = data.rotationY;
    // Broadcast to others
    socket.broadcast.emit('playerMoved', { id: p.id, x: p.x, y: p.y, z: p.z, rotationY: p.rotationY });
  });

  socket.on('changeWeapon', weaponKey => {
    const p = gameState.players[socket.id];
    if (p && weapons[weaponKey]) {
      p.weapon = weaponKey;
      io.to(p.id).emit('weaponChanged', { weapon: weaponKey });
    }
  });

  socket.on('changeSkin', skinKey => {
    const p = gameState.players[socket.id];
    if (p && skins[skinKey]) {
      p.skin = skinKey;
      io.to(p.id).emit('skinChanged', { skin: skinKey });
    }
  });

  socket.on('changeOutfit', colorHex => {
    const p = gameState.players[socket.id];
    if (p) {
      p.outfit = colorHex;
      io.to(p.id).emit('outfitChanged', { outfit: colorHex });
    }
  });

  // Shooting – simply broadcast a shot event (hit detection is client‑side for demo)
  socket.on('shoot', data => {
    // data: {origin: {x,y,z}, direction: {x,y,z}}
    socket.broadcast.emit('playerShot', { shooterId: socket.id, origin: data.origin, direction: data.direction });
  });

  // -----------------------------------------------------------------------
  // Mode specific events
  // -----------------------------------------------------------------------
  socket.on('requestTeamAssign', () => {
    if (gameState.mode === 'bomb') assignTeams();
  });

  socket.on('plantBomb', ({ x, y, z }) => {
    if (gameState.mode !== 'bomb' || gameState.bomb.planted) return;
    const p = gameState.players[socket.id];
    if (!p) return;
    // Simple rule: only TR can plant (for demo)
    if (p.team !== 'TR') return;
    gameState.bomb = {
      planted: true,
      location: { x, y, z },
      planterId: socket.id,
      timer: setTimeout(() => {
        io.emit('bombExploded', { location: gameState.bomb.location });
        endRound('TR'); // Terrorists win by detonation
      }, gameState.bomb.explodeTime),
      explodeTime: gameState.bomb.explodeTime,
    };
    io.emit('bombPlanted', { location: gameState.bomb.location, planterId: socket.id });
  });

  socket.on('defuseBomb', () => {
    if (!gameState.bomb.planted) return;
    const p = gameState.players[socket.id];
    if (!p) return;
    // Only CT can defuse (for demo)
    if (p.team !== 'CT') return;
    clearTimeout(gameState.bomb.timer);
    gameState.bomb.planted = false;
    io.emit('bombDefused', { defuserId: socket.id });
    endRound('CT'); // Counter‑Terrorists win by defuse
  });

  socket.on('changeMode', mode => {
    if (mode === 'training') startTraining();
    else if (mode === 'bomb') startBombMode();
  });

  // -----------------------------------------------------------------------
  // Damage handling (simplified)
  // -----------------------------------------------------------------------
  socket.on('hitPlayer', targetId => {
    const target = gameState.players[targetId];
    const shooter = gameState.players[socket.id];
    if (!target || !shooter) return;
    const weapon = weapons[shooter.weapon];
    const dmg = weapon ? weapon.damage : 10;
    target.hp -= dmg;
    if (target.hp <= 0) {
      // Player died
      io.emit('playerDied', { victimId: targetId, killerId: shooter.id });
      if (gameState.mode === 'training') {
        // Instant respawn with full HP
        respawnPlayer(target);
      } else {
        // In bomb mode just keep dead (could add spectating)
        io.to(target.id).emit('youAreDead');
      }
    } else {
      // Update health to everyone
      io.emit('playerHealth', { id: targetId, hp: target.hp });
    }
  });

  // -----------------------------------------------------------------------
  // Disconnect handling
  // -----------------------------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`🔴 Player disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    // Remove from any team arrays
    gameState.teams.TR = gameState.teams.TR.filter(id => id !== socket.id);
    gameState.teams.CT = gameState.teams.CT.filter(id => id !== socket.id);
    io.emit('playerLeft', { id: socket.id });
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
