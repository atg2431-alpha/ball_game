/**
 * Ball Component
 *
 * Handles ball state creation. Rendering is now done by renderer.js.
 */

import { state } from '../state.js';
import { CONFIG } from '../config.js';

/**
 * Create an extended ball state object.
 * 
 * Converts percentage-based position to pixel coordinates and initializes
 * all Phase 1 entity properties (mass, speed modifier, status effects, trail, shield).
 *
 * @param {Object}      config    - Ball config (startPosition, hp, id, name, etc.)
 * @param {HTMLElement}  hpDisplay - HP display element in the stats bar
 * @param {{ x: number, y: number }} velocity - Initial velocity (px/frame)
 * @returns {Object} Complete ball state entity
 */
export function createBall(config, hpDisplay, velocity) {
  const radius = config.radius || CONFIG.ballDefaults.radius;

  return {
    // ─── Identity ────────────────────────────────────
    id: config.id,
    name: config.name,
    hpDisplay,

    // ─── Geometry & Position ─────────────────────────
    radius,
    x: (config.startPosition.x / 100) * state.boardWidth,
    y: (config.startPosition.y / 100) * state.boardHeight,
    vx: velocity.x,
    vy: velocity.y,

    // ─── Health ──────────────────────────────────────
    hp: config.hp,
    maxHp: config.hp,

    // ─── Phase 1: Physics Extensions ─────────────────
    mass: config.mass || CONFIG.ballDefaults.mass,
    speedMultiplier: CONFIG.ballDefaults.speedMultiplier,
    damageMultiplier: 1.0,

    // ─── Phase 1: Status Effects ─────────────────────
    statusEffects: [],     // [{ type, startTime, duration, source, lastTickTime }]
    isGhost: false,        // Ghost phase: pass through walls/projectiles
    shieldActive: false,   // Shield: block incoming damage
    shieldHp: 0,

    // ─── Phase 1: Visual Trail ───────────────────────
    trail: [],             // [{ x, y, alpha }] position history for trail rendering

    // ─── Weapon State (existing, preserved) ──────────
    weaponExpiry: null,
    weaponType: null,
    weaponAngle: null,
    lastHitTime: null,
    lastFireTime: null,
  };
}
