/**
 * Split Power-up Module
 * 
 * Ball splits into 2 smaller copies sharing HP for 8s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';
import { getBallPalette } from '../engine/renderer.js';

const def = {
  type: 'split',
  name: 'Split',
  description: 'Splits the ball into 2 smaller copies sharing HP.',
  icon: '🦠',
  rarity: 'rare',
  spawnWeight: 2,
  enabled: true,
  duration: 8000,
  // Configurable gameplay values
  radiusMultiplier: 0.6,
  configurable: [
    { label: 'Spawn Weight', key: 'spawnWeight', min: 1, max: 10, step: 1 },
    { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
    { label: 'Size ×', key: 'radiusMultiplier', min: 0.2, max: 0.9, step: 0.05 },
  ],

  onActivate: (ball, state, events, active) => {
    if (!ball.originalRadius) {
      ball.originalRadius = ball.radius;
      ball.radius *= def.radiusMultiplier;
    }
    
    const cloneId = ball.id + '_clone_' + Date.now() + Math.floor(Math.random() * 1000);
    const clone = {
      ...ball,
      id: cloneId,
      x: ball.x + (Math.random() - 0.5) * 20,
      y: ball.y + (Math.random() - 0.5) * 20,
      vx: ball.vx * -1,
      vy: ball.vy * -1,
      activePowerups: [],
      trail: [],
      statusEffects: [],
      isClone: true
    };
    
    if (active) active.state.cloneRef = clone;
    state.balls.push(clone);
  },

  onTick: (ball, dt, state, events, active) => {
    const clone = active?.state?.cloneRef;
    if (clone) {
      const lowestHp = Math.min(ball.hp, clone.hp);
      ball.hp = lowestHp;
      clone.hp = lowestHp;
      
      if ((ball.weaponExpiry || 0) > (clone.weaponExpiry || 0)) {
        clone.weaponType = ball.weaponType;
        clone.weaponExpiry = ball.weaponExpiry;
      } else if ((clone.weaponExpiry || 0) > (ball.weaponExpiry || 0)) {
        ball.weaponType = clone.weaponType;
        ball.weaponExpiry = clone.weaponExpiry;
      }
    }
  },

  onExpire: (ball, state, events, active) => {
    const activeSplits = ball.activePowerups?.filter(p => p.type === 'split') || [];
    if (activeSplits.length <= 1 && ball.originalRadius) {
      ball.radius = ball.originalRadius;
      delete ball.originalRadius;
    }
    
    const clone = active?.state?.cloneRef;
    if (clone) {
      const index = state.balls.findIndex(b => b.id === clone.id);
      if (index !== -1) {
        state.balls.splice(index, 1);
      }
      delete active.state.cloneRef;
    }
  },

  onRender: (ctx, ball, timestamp, active) => {
    const clone = active?.state?.cloneRef;
    if (clone && !ball.isClone) {
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(clone.x, clone.y);
      
      const palette = getBallPalette(ball.id);
      const rgb = palette.trailRgb;
      
      const pulse = Math.abs(Math.sin(timestamp * 0.005));
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${pulse * 0.5 + 0.2})`;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.stroke();
    }
  }
};

registerPowerup(def);
