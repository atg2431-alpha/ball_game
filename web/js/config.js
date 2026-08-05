/**
 * Game Configuration
 *
 * Central place for all tunable game settings.
 * Update image paths, positions, and physics here.
 */

export const CONFIG = {
  board: {
    // Set a background image for the board (null = use CSS default)
    backgroundImage: null, // e.g., 'assets/board-bg.png'
  },

  ball1: {
    id: 'ball-1',
    name: 'Player 1',
    hp: 100,
    image: null, // e.g., 'assets/ball-blue.png'
    startPosition: { x: 25, y: 55 }, // percentage of board
  },

  ball2: {
    id: 'ball-2',
    name: 'Player 2',
    hp: 100,
    image: null, // e.g., 'assets/ball-red.png'
    startPosition: { x: 65, y: 35 }, // percentage of board
  },

  physics: {
    speed: 4, // pixels per frame
    // Initial direction (normalized). { x: 0, y: 1 } = straight down
    initialDirection: { x: 0, y: 1 },
  },

  aim: {
    minSpeed: 2,
    maxSpeed: 8,
    maxLineLength: 100,
    sensitivity: 0.05,
  },

  weapons: {
    orbitRadius: 40,      // distance from center of large ball
    orbitSpeed: 0.005,    // radians per ms
    invincibility: 500,   // ms cooldown after getting hit
    sword: {
      spawnInterval: 10000,
      duration: 5000,
      damage: 10,
    },
    longsword: {
      spawnInterval: 10000,
      duration: 5000,
      damage: 15,
    },
    gun: {
      spawnInterval: 12000,
      duration: 6000,
      damage: 5,            // damage per bullet
      fireRate: 1000,       // ms between shots
      bulletSpeed: 6,       // pixels per frame
      bulletLifetime: 2000, // ms before despawn
    }
  },
};
