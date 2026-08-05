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
import { spawnWeapon, updateWeapons, updateProjectiles } from '../physics/weapons.js';
import { handleGameOver } from '../controls/controls.js';

/**
 * Run one frame of the simulation and schedule the next.
 * @param {number} timestamp - RequestAnimationFrame time
 */
export function gameLoop(timestamp) {
  if (!state.running) return;

  // Move balls and handle wall bounces
  for (const ball of state.balls) {
    updateBall(ball, state.boardWidth, state.boardHeight, state.boardShape);
  }

  // Handle ball-ball collisions
  if (state.balls.length === 2) {
    resolveBallCollision(state.balls[0], state.balls[1]);
  }
  
  // Handle Weapons and Projectiles
  spawnWeapon(timestamp);
  updateWeapons(timestamp);
  updateProjectiles(timestamp);

  // Render updated positions to the DOM
  let winner = null;
  for (const ball of state.balls) {
    renderBall(ball);
    if (ball.hp <= 0) {
      // Find the other ball that won
      winner = state.balls.find(b => b.id !== ball.id);
    }
  }

  if (winner) {
    handleGameOver(winner);
    return; // Stop loop
  }

  state.animationId = requestAnimationFrame(gameLoop);
}
