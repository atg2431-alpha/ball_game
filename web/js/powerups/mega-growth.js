/**
 * @fileoverview Mega Growth power-up.
 * Substantially increases the size and mass of the ball.
 */
import { registerPowerup } from '../systems/powerup-registry.js';

const def = {
    type: 'mega-growth',
    name: 'Mega Growth',
    icon: '🔮',
    rarity: 'rare',
    spawnWeight: 2,
    enabled: true,
    duration: 6000,
    // Configurable gameplay values
    radiusMultiplier: 1.8,
    configurable: [
      { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
      { label: 'Size ×', key: 'radiusMultiplier', min: 1.1, max: 4, step: 0.1 },
    ],
    onActivate: (ball) => {
        ball._originalRadius = ball.radius;
        ball.radius = ball.radius * def.radiusMultiplier;
        
        ball._originalMass = ball.mass;
        ball.mass = 2.0;
    },
    onTick: (ball, elapsedMs) => {},
    onExpire: (ball) => {
        if (ball._originalRadius !== undefined) {
            ball.radius = ball._originalRadius;
            delete ball._originalRadius;
        }
        if (ball._originalMass !== undefined) {
            ball.mass = ball._originalMass;
            delete ball._originalMass;
        } else {
            ball.mass = 1.0;
        }
    },
    onRender: (ctx, ball, timeSinceActivate) => {
        const pulse = Math.abs(Math.sin(Date.now() / 250));
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 3 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 0, 255, ${0.2 + pulse * 0.3})`;
        ctx.lineWidth = 2 + pulse * 2;
        ctx.stroke();
    }
};

registerPowerup(def);
