/**
 * Split Power-up Module
 * 
 * Ball splits into 2 smaller copies sharing HP for 8s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';

registerPowerup({
  type: 'split',
  name: 'Split',
  icon: '🦠',
  rarity: 'rare',
  spawnWeight: 2,
  duration: 8000,

  onActivate: (ball, state, events) => {
    // shrink ball radius to 60%
    ball.originalRadius = ball.radius;
    ball.radius *= 0.6;
    
    // create a clone ball in state.balls with same HP shared
    const clone = {
      ...ball,
      id: ball.id + '_clone',
      x: ball.x + (Math.random() - 0.5) * 20,
      y: ball.y + (Math.random() - 0.5) * 20,
      vx: ball.vx * -1,
      vy: ball.vy * -1,
      activePowerups: [], // clone doesn't inherit active powerups
      isClone: true
    };
    
    ball.cloneRef = clone;
    state.balls.push(clone);
  },

  onTick: (ball, dt, state, events) => {
    // Sharing HP - sync HP from main ball to clone or vice versa if needed
    if (ball.cloneRef) {
      ball.cloneRef.hp = ball.hp;
    }
  },

  onExpire: (ball, state, events) => {
    // restore original radius
    if (ball.originalRadius) {
      ball.radius = ball.originalRadius;
      delete ball.originalRadius;
    }
    
    // remove the clone
    if (ball.cloneRef) {
      const index = state.balls.findIndex(b => b.id === ball.cloneRef.id);
      if (index !== -1) {
        state.balls.splice(index, 1);
      }
      delete ball.cloneRef;
    }
  },

  onRender: (ctx, ball, timestamp) => {
    // draw a pulsing connection line between original and clone
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
});
