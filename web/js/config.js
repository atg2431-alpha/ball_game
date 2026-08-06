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

  recording: {
    fps: 60,                     // Frames per second for the recording
    videoBitsPerSecond: 8000000, // Video bitrate (8 Mbps for high quality)
    mimeType: 'video/webm',
  },

  // ─── Phase 1: Extended Physics ─────────────────────────────
  extendedPhysics: {
    friction: 0,            // 0 = frictionless (classic), 0.001 = slight drag
    gravity: { x: 0, y: 0 }, // Global gravity vector (0 = no gravity)
    restitution: 1.0,        // Coefficient of restitution (1.0 = perfect elastic)
  },

  // ─── Phase 1: Ball Defaults ────────────────────────────────
  ballDefaults: {
    radius: 29,              // Default ball radius (was hardcoded)
    mass: 1.0,               // Default mass for collision resolution
    speedMultiplier: 1.0,    // Base speed multiplier
    trailLength: 15,         // Number of trail positions to keep
  },

  // ─── Phase 1: Particle System ──────────────────────────────
  particles: {
    maxCount: 500,           // Maximum active particles
    collisionSparkCount: 12, // Sparks per ball collision
    trailEmitRate: 3,        // Trail particles per frame
  },

  // ─── Phase 1: Camera Effects ───────────────────────────────
  camera: {
    shakeDecay: 0.92,        // How fast shake dies out (0-1, higher = slower)
    collisionShakeBase: 3,   // Base shake intensity for ball collisions
    collisionShakeScale: 0.5,// Scale factor: intensity = base + impactSpeed * scale
    killSlowMoScale: 0.3,    // Time scale during kill slow-motion
    killSlowMoDuration: 300, // Duration of kill slow-mo in ms
  },

  // ─── Phase 1: Arena ────────────────────────────────────────
  arena: {
    shrinkRate: 0.02,        // Pixels per frame when shrinking
    minRadius: 80,           // Minimum arena radius
    killWallDamage: 2,       // Damage per tick outside safe zone
    killWallTickInterval: 500, // Ms between damage ticks
  },

  // ─── Phase 2: Power-ups ────────────────────────────────────
  powerups: {
    spawnInterval: 8000,     // ms between power-up spawns
    maxOnBoard: 3,           // Maximum power-up items on board at once
  },

  // ─── Phase 2: Hazards ──────────────────────────────────────
  hazardSpawns: {
    gravityWellInterval: 15000,  // ms between gravity well spawns
    bouncePadCount: 3,           // Number of bounce pads to place
  },
};
