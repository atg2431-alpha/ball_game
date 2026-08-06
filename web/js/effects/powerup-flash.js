/**
 * Power-up Flash Effect
 *
 * Full-screen flash + camera zoom-punch on power-up activation.
 * Creates a dramatic "activation moment" for content.
 */

import { events, EVENTS } from '../systems/event-bus.js';
import { particleSystem, PARTICLE_PRESETS } from '../systems/particle.js';
import { camera } from '../systems/camera.js';

// Active screen flash state
let flashAlpha = 0;
let flashColor = 'rgba(255, 255, 255, 1)';

/**
 * Initialize power-up flash effects.
 */
export function initPowerupFlash() {
  events.on(EVENTS.POWERUP_PICKUP, (data) => {
    const { ball, powerupType } = data;
    
    // Screen flash
    flashAlpha = 0.3;
    
    // Radial particle burst
    particleSystem.emit(ball.x, ball.y, PARTICLE_PRESETS.POWERUP_PICKUP, 15);
    
    // Camera zoom punch
    camera.zoomTo(1.03, 0.2);
    setTimeout(() => camera.zoomTo(1.0, 0.06), 150);
  });
}

/**
 * Update flash effect.
 * @param {number} dt
 */
export function updateFlash(dt) {
  if (flashAlpha > 0) {
    flashAlpha -= 0.02 * (dt / 16);
    if (flashAlpha < 0) flashAlpha = 0;
  }
}

/**
 * Render flash overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
export function renderFlash(ctx, width, height) {
  if (flashAlpha <= 0) return;
  
  ctx.save();
  ctx.globalAlpha = flashAlpha;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Reset flash */
export function resetFlash() {
  flashAlpha = 0;
}
