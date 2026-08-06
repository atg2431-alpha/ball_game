/**
 * Death Explosion Effect
 *
 * Dramatic death sequence: confetti particles, expanding shockwave ring,
 * screen flash, and slow-motion on ball elimination.
 */

import { events, EVENTS } from '../systems/event-bus.js';
import { particleSystem, PARTICLE_PRESETS } from '../systems/particle.js';
import { camera } from '../systems/camera.js';
import { CONFIG } from '../config.js';

// Active shockwave rings
const shockwaves = [];

/**
 * Initialize death explosion effects.
 */
export function initDeathExplosion() {
  events.on(EVENTS.BALL_KILLED, (data) => {
    const { victim } = data;
    
    // 1. Massive particle burst (50+ particles)
    particleSystem.emit(victim.x, victim.y, PARTICLE_PRESETS.DEATH_EXPLOSION, 40);
    
    // 2. Additional confetti burst with varied colors
    particleSystem.emit(victim.x, victim.y, {
      speed: [2, 7],
      life: [600, 1200],
      size: [2, 6],
      sizeEnd: [0, 1],
      colors: ['#FF1493', '#00CED1', '#FFD700', '#7B68EE', '#32CD32', '#FF6347'],
      gravity: 0.12,
      alphaDecay: 0.006,
    }, 25);
    
    // 3. Expanding shockwave ring
    shockwaves.push({
      x: victim.x,
      y: victim.y,
      radius: victim.radius,
      maxRadius: 120,
      alpha: 0.8,
      lineWidth: 4,
      speed: 3,
    });
    
    // 4. Camera effects
    camera.slowMotion(CONFIG.camera.killSlowMoScale, CONFIG.camera.killSlowMoDuration);
    camera.shake(10, 0.93);
    
    // 5. Brief zoom punch
    camera.zoomTo(1.05, 0.15);
    setTimeout(() => camera.zoomTo(1.0, 0.05), 300);
  });
}

/**
 * Update shockwave animations.
 * @param {number} dt
 */
export function updateShockwaves(dt) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed * (dt / 16);
    sw.alpha -= 0.015 * (dt / 16);
    sw.lineWidth = Math.max(1, sw.lineWidth - 0.05 * (dt / 16));
    
    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      shockwaves.splice(i, 1);
    }
  }
}

/**
 * Render shockwave rings.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderShockwaves(ctx) {
  if (shockwaves.length === 0) return;
  
  ctx.save();
  for (const sw of shockwaves) {
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha})`;
    ctx.lineWidth = sw.lineWidth;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(255, 200, 50, ${sw.alpha})`;
    ctx.stroke();
  }
  ctx.restore();
}

/** Clear all shockwaves */
export function clearShockwaves() {
  shockwaves.length = 0;
}
