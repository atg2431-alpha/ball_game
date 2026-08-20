/**
 * Magnet Power-up Module
 * 
 * Attract nearby power-up items and weapon items for 6s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';

const def = {
  type: 'magnet',
  name: 'Magnet',
  description: 'Attracts nearby power-up items and weapon items.',
  icon: '🧲',
  rarity: 'common',
  spawnWeight: 3,
  enabled: true,
  duration: 6000,
  // Configurable gameplay values
  pullRadius: 120,
  configurable: [
    { label: 'Spawn Weight', key: 'spawnWeight', min: 1, max: 10, step: 1 },
    { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
    { label: 'Pull Radius', key: 'pullRadius', min: 30, max: 300, step: 5 },
  ],

  onActivate: (ball, state, events) => {
    ball.magnetActive = true;
  },

  onTick: (ball, dt, state, events) => {
    const pullRadius = def.pullRadius;
    const accel = 0.15;
    
    const allItems = [...(state.spawnedItems || []), ...(state.powerupItems || [])];
    
    for (const item of allItems) {
      const dx = ball.x - item.x;
      const dy = ball.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < pullRadius && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
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
    ctx.save();
    
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const maxRadius = def.pullRadius;
      const offset = (timestamp * 0.05 + i * (maxRadius / ringCount)) % maxRadius;
      const radius = maxRadius - offset;
      
      const alpha = Math.max(0, 1 - (maxRadius - radius) / maxRadius);
      
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 150, 255, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    ctx.restore();
  }
};

registerPowerup(def);
