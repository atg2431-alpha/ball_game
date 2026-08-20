/**
 * @fileoverview Ghost Phase power-up.
 * Allows the ball to pass through walls, projectiles, and other balls.
 */
import { registerPowerup } from '../systems/powerup-registry.js';

const def = {
    type: 'ghost',
    name: 'Ghost Phase',
    icon: '👻',
    rarity: 'rare',
    spawnWeight: 2,
    enabled: true,
    duration: 3000,
    configurable: [
      { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
    ],
    onActivate: (ball) => {
        ball.isGhost = true;
        ball.ghostTrails = [];
    },
    onTick: (ball, elapsedMs) => {
        if (!ball.ghostTrails) ball.ghostTrails = [];
        
        if (Math.random() < 0.4) {
            ball.ghostTrails.push({ x: ball.x, y: ball.y, time: Date.now() });
        }
        
        const now = Date.now();
        ball.ghostTrails = ball.ghostTrails.filter(t => now - t.time < 400);
    },
    onExpire: (ball) => {
        ball.isGhost = false;
        delete ball.ghostTrails;
    },
    onRender: (ctx, ball, timeSinceActivate) => {
        if (!ball.ghostTrails) return;
        
        const now = Date.now();
        ball.ghostTrails.forEach(trail => {
            const age = now - trail.time;
            const alpha = Math.max(0, 0.4 - (age / 400) * 0.4);
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 200, 255, ${alpha})`;
            ctx.fill();
        });
    }
};

registerPowerup(def);
