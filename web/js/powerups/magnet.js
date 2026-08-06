/**
 * Magnet Power-up Module
 * 
 * Attract nearby power-up items and weapon items for 6s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';

registerPowerup({
  type: 'magnet',
  name: 'Magnet',
  icon: '🧲',
  rarity: 'common',
  spawnWeight: 3,
  duration: 6000,

  onActivate: (ball, state, events) => {
    ball.magnetActive = true;
  },

  onTick: (ball, dt, state, events) => {
    const pullRadius = 120;
    const accel = 0.15;
    
    // pull nearby items in state.spawnedItems and state.powerupItems toward ball
    const allItems = [...(state.spawnedItems || []), ...(state.powerupItems || [])];
    
    for (const item of allItems) {
      const dx = ball.x - item.x;
      const dy = ball.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < pullRadius && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        // Apply acceleration to items, assuming they might not have a velocity vector yet
        if (item.vx === undefined) item.vx = 0;
        if (item.vy === undefined) item.vy = 0;
        
        item.vx += nx * accel;
        item.vy += ny * accel;
        
        item.x += item.vx;
        item.y += item.vy;
      }
    }
  },

  onExpire: (ball, state, events) => {
    ball.magnetActive = false;
  },

  onRender: (ctx, ball, timestamp) => {
    // draw magnetic field lines (concentric rings pulsing inward)
    ctx.save();
    
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      // Inward pulsing radius
      const maxRadius = 120;
      const offset = (timestamp * 0.05 + i * (maxRadius / ringCount)) % maxRadius;
      const radius = maxRadius - offset;
      
      // Fade out at edges
      const alpha = Math.max(0, 1 - (maxRadius - radius) / maxRadius);
      
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 150, 255, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    ctx.restore();
  }
});
