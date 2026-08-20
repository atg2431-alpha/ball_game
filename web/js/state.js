/**
 * Game State
 *
 * Mutable runtime state shared across modules.
 * This is the single source of truth for what's happening in the game.
 */

export const state = {
  running: false,
  animationId: null,
  balls: [],
  boardWidth: 0,
  boardHeight: 0,
  boardShape: 'rectangle', // 'rectangle' or 'circle'

  // Aim state (set by drag input, read by controls)
  aims: {},       // { 'ball-1': { dx, dy, speed }, ... }
  dragging: null,  // { ballId, ballEl, centerX, centerY } while dragging

  // Weapons and Combat
  selectedWeapon: 'sword',
  spawnedItems: [], // { id, x, y, el, type }
  lastSpawnTime: 0,
  projectiles: [],  // { x, y, dx, dy, speed, lifetime, spawnTime, el, ownerId }
  gameSpeed: 1,

  // Phase 1: New system state
  hazards: [],           // Arena hazards (gravity wells, bounce pads, etc.)
  activeEffects: [],     // Global active effects (arena shrink, etc.)
  particles: [],         // Managed by particle system (reference only)
  arenaState: {
    shrinking: false,
    currentRadius: 0,
    killWallDamage: 2,
  },

  // Phase 2: Power-ups
  powerupItems: [],        // Ground power-up items [{ id, x, y, type, radius, spawnTime }]
  lastPowerupSpawn: 0,
  powerupsEnabled: false,   // Toggle via UI
  activeZones: [],          // Active zone effects [{ type, x, y, radius, startTime, duration, ownerId }]

  // Phase 2: Hazards
  gravityWellsEnabled: false,
  bouncePadsEnabled: false,
  shrinkZoneEnabled: false,
  lastGravityWellSpawn: 0,
  lastBouncePadSpawn: 0,
  
  // Timing
  simulatedTime: undefined,
  lastRealTime: undefined,
  
  // Customise
  boardContrast: 50,       // 0-100, maps to CSS contrast(0%-200%)
  
  // Recording & Sound
  recordingEnabled: false,
  soundEnabled: false,
};
