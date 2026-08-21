/**
 * Game Loop (Engine)
 *
 * The core simulation loop that drives physics, combat, status effects,
 * particles, and camera effects. Each frame processes in order:
 *   status effects → movement → collisions → weapons → particles → camera
 *
 * Rendering is handled by the master loop in main.js.
 */

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { updateBall } from '../physics/movement.js';
import { resolveAllCollisions } from '../physics/collision.js';
import { spawnWeapon, updateWeapons, updateProjectiles } from '../physics/weapons.js';
import { handleGameOver } from '../controls/controls.js';
import { camera } from '../systems/camera.js';
import { particleSystem } from '../systems/particle.js';
import { statusEffects } from '../systems/status-effects.js';
import { events, EVENTS } from '../systems/event-bus.js';
import { spawnPowerup, updatePowerups } from '../systems/powerup-registry.js';
import { updateShrinkZone } from '../hazards/shrink-zone.js';
import { updateGravityWells, spawnGravityWell } from '../hazards/gravity-well.js';
import { updateBouncePads } from '../hazards/bounce-pad.js';
import { updateDamageNumbers } from '../ui/damage-numbers.js';
import { updateBanners } from '../ui/event-banner.js';
import { updateHpBars } from '../ui/hp-bar.js';
import { updateTimer } from '../ui/match-timer.js';
import { updateCombo } from '../ui/combo-counter.js';
import { updateShockwaves } from '../effects/death-explosion.js';
import { updateFlash } from '../effects/powerup-flash.js';

/**
 * Run one frame of the simulation.
 * 
 * Applies game speed multiplier and camera time scale to delta time.
 * Runs multiple substeps for fast-forward (2x, 4x) modes.
 *
 * @param {number} timestamp - requestAnimationFrame timestamp in ms
 */
export function gameLoop(timestamp) {
  if (!state.running) return;

  let delta = timestamp - (state.lastRealTime || timestamp);
  if (delta > 50) delta = 16; // Cap large jumps (e.g. tab backgrounded)
  state.lastRealTime = timestamp;

  if (state.simulatedTime === undefined) {
    state.simulatedTime = timestamp;
  }

  // Apply camera time scale (for slow-motion effects)
  const cameraTimeScale = camera.getTimeScale();
  const speedMultiplier = (state.gameSpeed || 1);
  const scaledDelta = delta * cameraTimeScale;

  for (let step = 0; step < speedMultiplier; step++) {
    state.simulatedTime += scaledDelta;
    const simTime = state.simulatedTime;

    // 1. Update status effects (freeze, burn, poison, etc.)
    statusEffects.update(state.balls, simTime);

    // 2. Move balls and handle wall bounces
    for (const ball of state.balls) {
      updateBall(ball, state.boardWidth, state.boardHeight, state.boardShape);
    }

    // 3. Handle ball-ball collisions (N-ball pairwise)
    resolveAllCollisions(state.balls);

    // 4. Handle weapons and projectiles
    spawnWeapon(simTime);
    updateWeapons(simTime);
    updateProjectiles(simTime);

    // 5. Power-up system
    spawnPowerup(simTime);
    updatePowerups(state.balls, simTime);

    // 6. Hazards
    updateShrinkZone(simTime);
    if (state.gravityWellsEnabled && simTime - state.lastGravityWellSpawn > CONFIG.hazardSpawns.gravityWellInterval) {
      state.lastGravityWellSpawn = simTime;
      spawnGravityWell(simTime);
    }
    updateGravityWells(simTime);
    updateBouncePads(simTime);
  }

  // Update visual systems (outside substep loop, once per frame)
  particleSystem.update(delta);
  camera.update(delta);

  // Update UI overlays
  updateDamageNumbers(delta);
  updateBanners(delta);

  // Update Phase 3 systems
  updateHpBars(state.balls, delta);
  updateTimer();
  updateCombo(delta);
  updateShockwaves(delta);
  updateFlash(delta);

  // Check win condition
  let winner = null;
  for (const ball of state.balls) {
    if (ball.hp <= 0 && !ball.isClone) {
      // Find the other main ball
      winner = state.balls.find(b => b.id !== ball.id && !b.isClone);
      if (winner) {
        events.emit(EVENTS.BALL_KILLED, { killer: winner, victim: ball });
        break;
      }
    }
  }

  if (winner) {
    handleGameOver(winner);
  }
}
