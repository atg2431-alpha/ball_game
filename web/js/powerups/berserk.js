/**
 * @fileoverview Berserk Mode power-up.
 * Increases ball speed and damage for a short duration with a red rage aura.
 */
import { registerPowerup } from '../systems/powerup-registry.js';

registerPowerup({
    type: 'berserk',
    name: 'Berserk Mode',
    icon: '🔥',
    rarity: 'rare',
    spawnWeight: 2,
    duration: 5000,
    onActivate: (ball) => {
        ball.speedMultiplier = (ball.speedMultiplier || 1.0) * 1.5;
        ball.damageMultiplier = (ball.damageMultiplier || 1.0) * 1.5;
    },
    onTick: (ball, elapsedMs) => {},
    onExpire: (ball) => {
        ball.speedMultiplier = (ball.speedMultiplier || 1.5) / 1.5;
        ball.damageMultiplier = (ball.damageMultiplier || 1.5) / 1.5;
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
});
