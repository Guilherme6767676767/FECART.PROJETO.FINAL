// src/maps.js – definition of two simple maps for the 3D shooter

export const maps = {
  desert: {
    name: "Desert",
    width: 2000,
    height: 1500,
    // Simple wall representation for demo – each wall is a box defined by position and size
    walls: [
      // boundary walls (thin boxes)
      { x: 0, y: 0, z: 0, w: 2000, h: 100, d: 20 }, // north wall
      { x: 0, y: 0, z: 1480, w: 2000, h: 100, d: 20 }, // south wall
      { x: 0, y: 0, z: 0, w: 20, h: 100, d: 1500 }, // west wall
      { x: 1980, y: 0, z: 0, w: 20, h: 100, d: 1500 }, // east wall
      // some interior obstacles
      { x: 600, y: 0, z: 600, w: 200, h: 100, d: 200 },
      { x: 1200, y: 0, z: 300, w: 300, h: 100, d: 150 },
    ],
    bombSites: [{ x: 1800, y: 0, z: 1300 }],
  },
  office: {
    name: "Office",
    width: 1800,
    height: 1200,
    walls: [
      { x: 0, y: 0, z: 0, w: 1800, h: 100, d: 20 }, // north
      { x: 0, y: 0, z: 1180, w: 1800, h: 100, d: 20 }, // south
      { x: 0, y: 0, z: 0, w: 20, h: 100, d: 1200 }, // west
      { x: 1780, y: 0, z: 0, w: 20, h: 100, d: 1200 }, // east
      // office interior walls
      { x: 400, y: 0, z: 0, w: 20, h: 100, d: 1200 }, // central divider
      { x: 800, y: 0, z: 600, w: 400, h: 100, d: 20 }, // conference room wall
    ],
    bombSites: [{ x: 300, y: 0, z: 1100 }],
  },
};
