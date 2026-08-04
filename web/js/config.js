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
    minSpeed: 2,        // minimum launch speed (px/frame)
    maxSpeed: 8,        // maximum launch speed (px/frame)
    maxLineLength: 100, // max aim arrow length in pixels
    sensitivity: 0.05,  // drag distance → speed multiplier
  },
};
