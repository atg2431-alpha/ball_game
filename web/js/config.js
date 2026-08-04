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
    spawnInterval: 10000, // ms between spawns
    duration: 5000,       // ms for buff duration
    orbitRadius: 40,      // distance from center of large ball
    orbitSpeed: 0.005,    // radians per ms
    damage: 10,           // HP deducted on hit
    invincibility: 500,   // ms cooldown after getting hit
  },
};
