/**
 * @fileoverview Heal Pulse power-up.
 * Instantly heals the ball and emits a burst of green healing particles.
 */
import { registerPowerup } from '../systems/powerup-registry.js';
import { particleSystem, PARTICLE_PRESETS } from '../systems/particle.js';

const def = {
  type: 'heal',
  name: 'Heal Pulse',
  description: 'Instantly heals the ball and emits a burst of green healing particles.',
  icon: '💚',
  rarity: 'common',
  spawnWeight: 4,
  enabled: true,
  duration: 100,
  // Configurable gameplay values
  healAmount: 20,
  configurable: [
    { label: 'Spawn Weight', key: 'spawnWeight', min: 1, max: 10, step: 1 },
    { label: 'Heal Amount', key: 'healAmount', min: 1, max: 100, step: 1 },
  ],

  onActivate: (ball) => {
    ball.hp = Math.min(ball.maxHp || 100, (ball.hp || 0) + def.healAmount);
    ball._healStartTime = Date.now();

    // Green particle burst upward
    particleSystem.emit(ball.x, ball.y - ball.radius, {
      speed: [1, 3],
      life: [400, 700],
      size: [2, 4],
      sizeEnd: [0, 0],
      colors: ['#22ff66', '#00ff88', '#aaffcc'],
      gravity: -0.05,
      alphaDecay: 0.015,
    }, 15);
  },

  onTick: (ball, elapsedMs) => {},

  onExpire: (ball) => {
    delete ball._healStartTime;
  },

  onRender: (ctx, ball, timestamp) => {
    // Draw a brief green cross flash at ball position
    if (!ball._healStartTime) return;
    const elapsed = Date.now() - ball._healStartTime;
    const alpha = Math.max(0, 1 - (elapsed / 100));
    if (alpha <= 0) return;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#22ff66';
    // Green cross
    ctx.fillRect(-4, -16, 8, 32);
    ctx.fillRect(-16, -4, 32, 8);
    ctx.restore();
  }
};

registerPowerup(def);
