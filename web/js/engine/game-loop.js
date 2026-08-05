/**
 * Game Loop (Engine)
 *
 * The core physics loop that drives the simulation.
 * Each frame: move balls → check collisions → weapons.
 * Rendering is handled by the master loop in main.js.
 */

import { state } from '../state.js';
import { updateBall } from '../physics/movement.js';
import { resolveBallCollision } from '../physics/collision.js';
import { spawnWeapon, updateWeapons, updateProjectiles } from '../physics/weapons.js';
import { handleGameOver } from '../controls/controls.js';

/**
 * Run one frame of the simulation (physics only).
 * @param {number} timestamp - RequestAnimationFrame time
 */
export function gameLoop(timestamp) {
  if (!state.running) return;

  let delta = timestamp - (state.lastRealTime || timestamp);
  if (delta > 50) delta = 16; // Cap large jumps (e.g. tab backgrounded)
  state.lastRealTime = timestamp;

  if (state.simulatedTime === undefined) {
    state.simulatedTime = timestamp;
  }

  const speedMultiplier = state.gameSpeed || 1;

  for (let step = 0; step < speedMultiplier; step++) {
    state.simulatedTime += delta;
    const simTime = state.simulatedTime;

    // Move balls and handle wall bounces
    for (const ball of state.balls) {
      updateBall(ball, state.boardWidth, state.boardHeight, state.boardShape);
    }

    // Handle ball-ball collisions
    if (state.balls.length === 2) {
      resolveBallCollision(state.balls[0], state.balls[1]);
    }
    
    // Handle Weapons and Projectiles
    spawnWeapon(simTime);
    updateWeapons(simTime);
    updateProjectiles(simTime);
  }

  // Check win condition
  let winner = null;
  for (const ball of state.balls) {
    if (ball.hp <= 0) {
      winner = state.balls.find(b => b.id !== ball.id);
    }
  }

  if (winner) {
    handleGameOver(winner);
  }
}

