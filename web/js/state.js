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
};
