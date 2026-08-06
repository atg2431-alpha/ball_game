/**
 * Ball-Ball Collision System
 *
 * Detects overlap between circular balls and resolves with mass-weighted
 * elastic collision. Supports N-ball pairwise resolution and emits
 * collision events for visual effects (particles, screen shake).
 */

import { CONFIG } from '../config.js';
import { events, EVENTS } from '../systems/event-bus.js';

/**
 * Resolve all pairwise ball collisions for N balls.
 * @param {Array} balls - Array of ball state objects
 */
export function resolveAllCollisions(balls) {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }
}

/**
 * Resolve an elastic collision between two balls with mass-weighted impulse.
 *
 * Uses the formula:
 *   J = -(1 + e) * v_rel_n / (1/m1 + 1/m2)
 * where e is the coefficient of restitution.
 *
 * Balls with `isGhost === true` are skipped (no collision).
 *
 * @param {Object} b1 - First ball state object
 * @param {Object} b2 - Second ball state object
 */
export function resolveBallCollision(b1, b2) {
  // Ghost balls pass through everything
  if (b1.isGhost || b2.isGhost) return;

  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = b1.radius + b2.radius;

  if (dist < minDist && dist > 0) {
    // Collision normal (from b1 toward b2)
    const nx = dx / dist;
    const ny = dy / dist;

    // Relative velocity along normal
    const dvx = b1.vx - b2.vx;
    const dvy = b1.vy - b2.vy;
    const dvn = dvx * nx + dvy * ny;

    // Only resolve if the balls are approaching
    if (dvn > 0) {
      const e = CONFIG.extendedPhysics.restitution;
      const m1 = b1.mass || 1;
      const m2 = b2.mass || 1;

      // Mass-weighted impulse scalar
      const J = -(1 + e) * dvn / (1 / m1 + 1 / m2);

      // Apply impulse
      b1.vx += (J / m1) * nx;
      b1.vy += (J / m1) * ny;
      b2.vx -= (J / m2) * nx;
      b2.vy -= (J / m2) * ny;

      // Calculate impact data for events
      const impactSpeed = Math.abs(dvn);
      const contactX = (b1.x + b2.x) / 2;
      const contactY = (b1.y + b2.y) / 2;

      // Emit collision event for particles, screen shake, sound
      events.emit(EVENTS.BALL_COLLISION, {
        ball1: b1,
        ball2: b2,
        impactSpeed,
        contactX,
        contactY,
      });
    }

    // Separate overlapping balls (mass-weighted)
    const overlap = minDist - dist;
    const totalMass = (b1.mass || 1) + (b2.mass || 1);
    const sep1 = (overlap * (b2.mass || 1) / totalMass) + 0.5;
    const sep2 = (overlap * (b1.mass || 1) / totalMass) + 0.5;
    b1.x -= sep1 * nx;
    b1.y -= sep1 * ny;
    b2.x += sep2 * nx;
    b2.y += sep2 * ny;
  }
}
