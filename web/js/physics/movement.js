/**
 * Ball Movement & Wall Bouncing
 *
 * Moves a ball by its velocity (modified by speedMultiplier, friction, gravity)
 * and reflects off the board walls. Updates position trail for visual effects.
 */

import { CONFIG } from '../config.js';
import { events, EVENTS } from '../systems/event-bus.js';

/**
 * Update ball position with physics modifiers and bounce off walls.
 * 
 * Applies in order:
 *   1. Gravity acceleration
 *   2. Friction deceleration  
 *   3. Speed multiplier (from status effects)
 *   4. Position update
 *   5. Trail recording
 *   6. Boundary reflection
 *
 * @param {Object} ball  - Ball state object
 * @param {number} boardWidth  - Board width in pixels
 * @param {number} boardHeight - Board height in pixels
 * @param {string} boardShape  - 'rectangle' or 'circle'
 */
export function updateBall(ball, boardWidth, boardHeight, boardShape) {
  const physics = CONFIG.extendedPhysics;

  // 1. Apply gravity acceleration
  ball.vx += physics.gravity.x;
  ball.vy += physics.gravity.y;

  // 2. Apply friction (velocity damping)
  if (physics.friction > 0) {
    ball.vx *= (1 - physics.friction);
    ball.vy *= (1 - physics.friction);
  }

  // 3. Compute effective velocity with speed multiplier
  const sm = ball.speedMultiplier || 1;
  const effectiveVx = ball.vx * sm;
  const effectiveVy = ball.vy * sm;

  // 4. Move
  ball.x += effectiveVx;
  ball.y += effectiveVy;

  // 5. Update trail (for visual ribbon effect)
  if (ball.trail) {
    ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 1.0 });
    const maxTrail = CONFIG.ballDefaults.trailLength;
    if (ball.trail.length > maxTrail) {
      ball.trail.length = maxTrail;
    }
  }

  // 6. Boundary reflection
  if (boardShape === 'circle') {
    const cx = boardWidth / 2;
    const cy = boardHeight / 2;
    const boardRadius = boardWidth / 2;

    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist + ball.radius >= boardRadius && dist > 0) {
      const overlap = (dist + ball.radius) - boardRadius;
      const nx = dx / dist;
      const ny = dy / dist;

      ball.x -= nx * overlap;
      ball.y -= ny * overlap;

      // Reflect the velocity vector
      const dotProduct = ball.vx * nx + ball.vy * ny;
      ball.vx = ball.vx - 2 * dotProduct * nx;
      ball.vy = ball.vy - 2 * dotProduct * ny;

      // Emit wall collision event
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      events.emit(EVENTS.WALL_COLLISION, {
        ball,
        normalX: nx,
        normalY: ny,
        speed,
      });
    }
  } else {
    let bounced = false;
    let bnx = 0, bny = 0;

    // Left wall
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      bnx = 1; bounced = true;
    }
    // Right wall
    if (ball.x + ball.radius >= boardWidth) {
      ball.x = boardWidth - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      bnx = -1; bounced = true;
    }
    // Top wall
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      bny = 1; bounced = true;
    }
    // Bottom wall
    if (ball.y + ball.radius >= boardHeight) {
      ball.y = boardHeight - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      bny = -1; bounced = true;
    }

    if (bounced) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      events.emit(EVENTS.WALL_COLLISION, {
        ball,
        normalX: bnx,
        normalY: bny,
        speed,
      });
    }
  }
}
