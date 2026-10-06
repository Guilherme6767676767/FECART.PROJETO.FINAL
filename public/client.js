// public/client.js – Three.js 3D client with Socket.io integration
// This is a minimal prototype: boxes for players, cylinders for weapons,
// simple WASD movement, mouse aiming, team colors, skins, and bomb mode UI.

const socket = io(); // connects to same origin (served by Express)

// ---------------------------------------------------------------------------
// Three.js basics
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
// We'll use a third‑person chase camera that follows the local player

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Simple ground plane for raycasting (y = 0)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Light
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 200, 100);
scene.add(dirLight);

// ---------------------------------------------------------------------------
// Game state on client
// ---------------------------------------------------------------------------
let localPlayer = null; // will be filled after 'init'
let players = {}; // socketId => {group, data}
let weapons = {};
let skins = {};
let currentMap = null;
let gameMode = 'training';

// UI elements
const modeSpan = document.getElementById('mode');
const bombTimerDiv = document.getElementById('bombTimer');
let bombTimerInterval = null;

// ---------------------------------------------------------------------------
// Helper: create a player visual (Box for body, Cylinder for weapon)
// ---------------------------------------------------------------------------
function createPlayerVisual(data) {
  const group = new THREE.Group();

  // Body – simple box, color = outfit
  const bodyGeo = new THREE.BoxGeometry(30, 60, 30);
  const bodyMat = new THREE.MeshStandardMaterial({ color: data.outfit || 0x00aaff });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 30; // half height so it sits on ground
  group.add(bodyMesh);

  // Weapon – cylinder representing barrel, color = skin
  const weaponGeo = new THREE.CylinderGeometry(4, 4, 40, 8);
  const skinDef = skins[data.skin] || skins.classic;
  const weaponMat = new THREE.MeshStandardMaterial({ color: skinDef.color || 0x555555 });
  const weaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
  // Position barrel at the front of the body
  weaponMesh.rotation.z = Math.PI / 2; // lay horizontally
  weaponMesh.position.set(0, 45, 20); // in front of body
  group.add(weaponMesh);

  // Store references for later updates
  group.userData = { bodyMesh, weaponMesh };
  return group;
}

function updatePlayerVisual(id, data) {
  const entry = players[id];
  if (!entry) return;
  const { group } = entry;
  // Update outfit color
  entry.group.userData.bodyMesh.material.color.set(data.outfit);
  // Update skin color
  const skinDef = skins[data.skin] || skins.classic;
  entry.group.userData.weaponMesh.material.color.set(skinDef.color);
}

// ---------------------------------------------------------------------------
// Input handling (WASD + mouse look)
// ---------------------------------------------------------------------------
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };

window.addEventListener('keydown', e => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', e => {
  if (e.key in keys) keys[e.key] = false;
});

// Mouse aiming – we use raycast against the ground plane to compute a target point
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetRotationY = 0;

window.addEventListener('mousemove', e => {
  // normalize mouse coordinates
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function computeAim() {
  if (!localPlayer) return;
  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObject(ground);
  if (intersect.length > 0) {
    const point = intersect[0].point;
    const dx = point.x - localPlayer.x;
    const dz = point.z - localPlayer.z;
    targetRotationY = Math.atan2(dx, dz); // note swapped for Three.js axes
  }
}

// ---------------------------------------------------------------------------
// Game loop (30 fps approx)
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  if (localPlayer) {
    // Movement
    const speed = 4; // units per frame
    let moved = false;
    if (keys.w || keys.ArrowUp) { localPlayer.z -= speed; moved = true; }
    if (keys.s || keys.ArrowDown) { localPlayer.z += speed; moved = true; }
    if (keys.a || keys.ArrowLeft) { localPlayer.x -= speed; moved = true; }
    if (keys.d || keys.ArrowRight) { localPlayer.x += speed; moved = true; }

    // Apply rotation toward mouse (smoothly)
    const rotSpeed = 0.15;
    localPlayer.rotationY = THREE.MathUtils.lerp(localPlayer.rotationY, targetRotationY, rotSpeed);

    // Update visual group
    const entry = players[localPlayer.id];
    if (entry) {
      entry.group.position.set(localPlayer.x, 0, localPlayer.z);
      entry.group.rotation.y = localPlayer.rotationY;
    }

    // Emit movement if there was any change (position or rotation)
    if (moved) {
      socket.emit('move', {
        x: localPlayer.x,
        y: 0,
        z: localPlayer.z,
        rotationY: localPlayer.rotationY,
      });
    }
  }

  // Simple third‑person camera following the local player
  if (localPlayer) {
    const camOffset = new THREE.Vector3(0, 120, 250);
    const camPos = new THREE.Vector3(localPlayer.x, 0, localPlayer.z)
      .add(camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), localPlayer.rotationY));
    camera.position.lerp(camPos, 0.1);
    camera.lookAt(new THREE.Vector3(localPlayer.x, 30, localPlayer.z));
  }

  renderer.render(scene, camera);
}
animate();

// ---------------------------------------------------------------------------
// Socket.io event handling
// ---------------------------------------------------------------------------
socket.on('init', data => {
  console.log('init', data);
  localPlayer = data.player; // contains id, x, y, z, hp, weapon, skin, outfit, team
  weapons = data.weapons;
  skins = data.skins;
  currentMap = data.map;
  gameMode = data.mode;
  modeSpan.textContent = gameMode;

  // Create visual for self
  const selfGroup = createPlayerVisual(localPlayer);
  scene.add(selfGroup);
  players[localPlayer.id] = { group: selfGroup, data: localPlayer };
});

socket.on('playerJoined', payload => {
  const { player } = payload;
  if (players[player.id]) return; // already exists
  const grp = createPlayerVisual(player);
  scene.add(grp);
  players[player.id] = { group: grp, data: player };
});

socket.on('playerMoved', payload => {
  const { id, x, y, z, rotationY } = payload;
  const entry = players[id];
  if (!entry) return; // maybe not yet created
  entry.group.position.set(x, 0, z);
  entry.group.rotation.y = rotationY;
});

socket.on('weaponChanged', ({ weapon }) => {
  if (!localPlayer) return;
  localPlayer.weapon = weapon;
  updatePlayerVisual(localPlayer.id, localPlayer);
});

socket.on('skinChanged', ({ skin }) => {
  if (!localPlayer) return;
  localPlayer.skin = skin;
  updatePlayerVisual(localPlayer.id, localPlayer);
});

socket.on('outfitChanged', ({ outfit }) => {
  if (!localPlayer) return;
  localPlayer.outfit = outfit;
  updatePlayerVisual(localPlayer.id, localPlayer);
});

socket.on('teamAssignment', ({ teams }) => {
  // Update each player's team info (could change colors later)
  Object.entries(teams).forEach(([team, ids]) => {
    ids.forEach(id => {
      if (players[id]) players[id].data.team = team;
    });
  });
});

socket.on('modeChanged', ({ mode }) => {
  gameMode = mode;
  modeSpan.textContent = mode;
});

socket.on('bombPlanted', ({ location, planterId }) => {
  bombTimerDiv.style.display = 'block';
  let remaining = 30;
  bombTimerDiv.textContent = remaining;
  clearInterval(bombTimerInterval);
  bombTimerInterval = setInterval(() => {
    remaining -= 1;
    bombTimerDiv.textContent = remaining;
    if (remaining <= 0) clearInterval(bombTimerInterval);
  }, 1000);
});

socket.on('bombDefused', () => {
  bombTimerDiv.style.display = 'none';
  clearInterval(bombTimerInterval);
});

socket.on('bombExploded', () => {
  bombTimerDiv.style.display = 'none';
  clearInterval(bombTimerInterval);
  alert('Bomb exploded! TR wins this round.');
});

socket.on('roundEnd', ({ winner }) => {
  alert(`${winner} venceu a rodada!`);
});

socket.on('respawn', ({ player }) => {
  if (player.id === localPlayer.id) {
    localPlayer.x = player.x;
    localPlayer.y = player.y;
    localPlayer.z = player.z;
    localPlayer.hp = player.hp;
  }
  const entry = players[player.id];
  if (entry) {
    entry.group.position.set(player.x, 0, player.z);
  }
});

socket.on('playerDied', ({ victimId, killerId }) => {
  if (victimId === localPlayer.id) {
    alert('Você morreu!');
  } else {
    console.log(`Player ${victimId} killed by ${killerId}`);
  }
});

socket.on('playerHealth', ({ id, hp }) => {
  if (players[id]) {
    players[id].data.hp = hp;
  }
});

socket.on('playerLeft', ({ id }) => {
  const entry = players[id];
  if (entry) {
    scene.remove(entry.group);
    delete players[id];
  }
});

// ---------------------------------------------------------------------------
// Shooting (left mouse button)
// ---------------------------------------------------------------------------
window.addEventListener('mousedown', e => {
  if (e.button !== 0) return; // left click only
  if (!localPlayer) return;
  // Compute a forward direction vector from player rotation
  const dir = new THREE.Vector3(
    Math.sin(localPlayer.rotationY),
    0,
    Math.cos(localPlayer.rotationY)
  ).normalize();
  const origin = { x: localPlayer.x, y: 0, z: localPlayer.z };
  socket.emit('shoot', { origin, direction: { x: dir.x, y: dir.y, z: dir.z } });
});

// ---------------------------------------------------------------------------
// Mouse aim calculation (run each frame)
// ---------------------------------------------------------------------------
function tickAim() {
  computeAim();
  requestAnimationFrame(tickAim);
}
tickAim();

// ---------------------------------------------------------------------------
// UI controls for mode (for demo purposes)
// ---------------------------------------------------------------------------
// Press M to toggle mode
window.addEventListener('keydown', e => {
  if (e.key === 'm') {
    const newMode = gameMode === 'training' ? 'bomb' : 'training';
    socket.emit('changeMode', newMode);
  }
});

// Press B to plant/defuse bomb (demo shortcut)
window.addEventListener('keydown', e => {
  if (e.key === 'b') {
    if (gameMode !== 'bomb') return;
    if (localPlayer.team === 'TR') {
      // Plant at current position
      socket.emit('plantBomb', { x: localPlayer.x, y: 0, z: localPlayer.z });
    } else if (localPlayer.team === 'CT') {
      socket.emit('defuseBomb');
    }
  }
});

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
