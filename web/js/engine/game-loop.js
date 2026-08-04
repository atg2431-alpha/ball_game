/**
 * Game Loop (Engine)
 *
 * The core animation loop that drives the simulation.
 * Each frame: move balls → check collisions → render.
 */

import { state } from '../state.js';
import { updateBall } from '../physics/movement.js';
import { resolveBallCollision } from '../physics/collision.js';
import { renderBall } from '../components/ball.js';

/**
 * Run one frame of the simulation and schedule the next.
 */
export function gameLoop() {
  if (!state.running) return;

  // Move balls and handle wall bounces
  for (const ball of state.balls) {
    updateBall(ball, state.boardWidth, state.boardHeight, state.boardShape);
  }

  // Handle ball-ball collisions
  if (state.balls.length === 2) {
    resolveBallCollision(state.balls[0], state.balls[1]);
  }

  // Render updated positions to the DOM
  for (const ball of state.balls) {
    renderBall(ball);
  }

  state.animationId = requestAnimationFrame(gameLoop);
}
