# FECART Tactical Shooter

A **3‑D multiplayer tactical shooter** built from scratch with:

- **Three.js** for the client‑side 3‑D rendering
- **Socket.io** for real‑time synchronization
- Weapon catalog (rifle, shotgun, pistol) with damage, fire‑rate and bullet speed
- Visual skins for weapons (classic, gold, neon) that change barrel colour
- Player outfit colour customization
- Two maps (Desert and Office) with configurable walls and bomb sites
- Two game modes:
  - **Training** – infinite respawn with full HP
  - **Bomb** – teams (TR vs CT), plant/defuse logic, 30 s timer, victory conditions

## Project structure
```
FECART.PROJETO.FINAL/
│   package.json
│   server.js            # Express + Socket.io backend
│
├─ src/
│   ├─ weaponCatalog.js  # weapons & skins definitions
│   └─ maps.js           # map data
│
└─ public/
    ├─ index.html        # basic page loading Three.js & client script
    └─ client.js         # Three.js scene, input, UI and socket handling
```

## Getting started
1. **Install dependencies**
   ```powershell
   npm install
   ```
2. **Run the server** (development with auto‑restart optional)
   ```powershell
   npm run start   # or npm run dev if you have nodemon installed globally
   ```
3. Open a browser at `http://localhost:8000`.
   - Press **WASD** to move, move the mouse to aim, left‑click to shoot.
   - Press **M** to toggle between *Training* and *Bomb* modes.
   - In *Bomb* mode press **B** to plant (if you are on the TR team) or defuse (if you are on the CT team).
   - The UI shows the current mode and a bomb countdown when planted.

## Extending the game
- Replace the placeholder box/cylinder graphics with real `glTF` models (use `THREE.GLTFLoader`).
- Add textures, PBR materials, sound effects, UI panels, mini‑map, etc.
- Move hit‑detection and damage logic to the server for authoritative gameplay.
- Add more weapons, skins, maps, and customizations by editing `src/weaponCatalog.js` and `src/maps.js`.

Enjoy the starter version and feel free to expand it!
