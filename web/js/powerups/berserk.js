/**
 * @fileoverview Berserk Mode power-up.
 * Increases ball speed and damage for a short duration with a red rage aura.
 */
import { registerPowerup } from '../systems/powerup-registry.js';

const def = {
    type: 'berserk',
    name: 'Berserk Mode',
    description: 'Increases ball speed and damage for a short duration with a red rage aura.',
    icon: '🔥',
    rarity: 'rare',
    spawnWeight: 2,
    enabled: true,
    duration: 5000,
    // Configurable gameplay values
    speedMultiplier: 1.5,
    damageMultiplier: 1.5,
    configurable: [
      { label: 'Spawn Weight', key: 'spawnWeight', min: 1, max: 10, step: 1 },
      { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
      { label: 'Speed ×', key: 'speedMultiplier', min: 1, max: 5, step: 0.1 },
      { label: 'Damage ×', key: 'damageMultiplier', min: 1, max: 5, step: 0.1 },
    ],
    onActivate: (ball) => {
        ball.speedMultiplier = (ball.speedMultiplier || 1.0) * def.speedMultiplier;
        ball.damageMultiplier = (ball.damageMultiplier || 1.0) * def.damageMultiplier;
    },
    onTick: (ball, elapsedMs) => {},
    onExpire: (ball) => {
        ball.speedMultiplier = (ball.speedMultiplier || def.speedMultiplier) / def.speedMultiplier;
        ball.damageMultiplier = (ball.damageMultiplier || def.damageMultiplier) / def.damageMultiplier;
    },
    onRender: (ctx, ball, timeSinceActivate) => {
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
    }
};

registerPowerup(def);
