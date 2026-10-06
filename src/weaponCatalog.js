// src/weaponCatalog.js – catalog of weapons and visual skins

export const weapons = {
  rifle: {
    name: "Rifle",
    damage: 20,
    fireRate: 5, // shots per second
    bulletSpeed: 8,
  },
  shotgun: {
    name: "Shotgun",
    damage: 35,
    fireRate: 1,
    bulletSpeed: 6,
  },
  pistol: {
    name: "Pistol",
    damage: 12,
    fireRate: 8,
    bulletSpeed: 10,
  },
};

export const skins = {
  classic: { color: "#555555" }, // gray metal
  gold: { color: "#ffd700" }, // gold
  neon: { color: "#00ffea" }, // neon cyan
};
