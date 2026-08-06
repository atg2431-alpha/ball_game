/**
 * @fileoverview Mega Growth power-up.
 * Substantially increases the size and mass of the ball.
 */
import { registerPowerup } from '../systems/powerup-registry.js';

registerPowerup({
    type: 'mega-growth',
    name: 'Mega Growth',
    icon: '🔮',
    rarity: 'rare',
    spawnWeight: 2,
    duration: 6000,
    onActivate: (ball) => {
        ball._originalRadius = ball.radius;
        ball.radius = ball.radius * 1.8;
        
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
        // Draw pulsing size ring at the new enlarged boundary
        const pulse = Math.abs(Math.sin(Date.now() / 250));
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 3 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 0, 255, ${0.2 + pulse * 0.3})`;
        ctx.lineWidth = 2 + pulse * 2;
        ctx.stroke();
    }
});
