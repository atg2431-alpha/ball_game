/**
 * Split Power-up Module
 * 
 * Ball splits into 2 smaller copies sharing HP for 8s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';

const def = {
  type: 'split',
  name: 'Split',
  icon: '🦠',
  rarity: 'rare',
  spawnWeight: 2,
  enabled: true,
  duration: 8000,
  // Configurable gameplay values
  radiusMultiplier: 0.6,
  configurable: [
    { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
    { label: 'Size ×', key: 'radiusMultiplier', min: 0.2, max: 0.9, step: 0.05 },
  ],

  onActivate: (ball, state, events) => {
    ball.originalRadius = ball.radius;
    ball.radius *= def.radiusMultiplier;
    
    const clone = {
      ...ball,
      id: ball.id + '_clone',
      x: ball.x + (Math.random() - 0.5) * 20,
      y: ball.y + (Math.random() - 0.5) * 20,
      vx: ball.vx * -1,
      vy: ball.vy * -1,
      activePowerups: [],
      isClone: true
    };
    
    ball.cloneRef = clone;
    state.balls.push(clone);
  },

  onTick: (ball, dt, state, events) => {
    if (ball.cloneRef) {
      ball.cloneRef.hp = ball.hp;
    }
  },

  onExpire: (ball, state, events) => {
    if (ball.originalRadius) {
      ball.radius = ball.originalRadius;
      delete ball.originalRadius;
    }
    
    if (ball.cloneRef) {
      const index = state.balls.findIndex(b => b.id === ball.cloneRef.id);
      if (index !== -1) {
        state.balls.splice(index, 1);
      }
      delete ball.cloneRef;
    }
  },

  onRender: (ctx, ball, timestamp) => {
    if (ball.cloneRef && !ball.isClone) {
      const clone = ball.cloneRef;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(clone.x, clone.y);
      
      const pulse = Math.abs(Math.sin(timestamp * 0.005));
      ctx.strokeStyle = `rgba(0, 255, 0, ${pulse * 0.5 + 0.2})`;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.stroke();
    }
  }
};

registerPowerup(def);
