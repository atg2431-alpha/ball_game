/**
 * Laser Power-up Module
 * 
 * Fires an instant screen-width beam dealing 25 damage.
 */

import { registerPowerup } from '../systems/powerup-registry.js';
import { EVENTS } from '../systems/event-bus.js';

registerPowerup({
  type: 'laser',
  name: 'Laser',
  icon: '⚡',
  rarity: 'legendary',
  spawnWeight: 1,
  duration: 500,

  onActivate: (ball, state, events) => {
    // Calculate direction from current velocity
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    let dirX = 1;
    let dirY = 0;
    
    if (speed > 0.01) {
      dirX = ball.vx / speed;
      dirY = ball.vy / speed;
    }
    
    const length = 2000; // Screen-width beam
    const x1 = ball.x;
    const y1 = ball.y;
    const x2 = ball.x + dirX * length;
    const y2 = ball.y + dirY * length;
    
    // Store beam data for rendering
    ball.laserBeam = {
      x1, y1, x2, y2,
      startTime: Date.now(),
      duration: 400
    };
    
    // Check line-circle intersection for all enemy balls
    for (const other of state.balls) {
      if (other.id === ball.id) continue;
      
      // Basic line-point distance
      const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      if (l2 === 0) continue;
      
      let t = ((other.x - x1) * (x2 - x1) + (other.y - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      
      const px = x1 + t * (x2 - x1);
      const py = y1 + t * (y2 - y1);
      
      const dist = Math.sqrt((other.x - px) * (other.x - px) + (other.y - py) * (other.y - py));
      
      if (dist < other.radius + 10) { // +10 for beam width
        const damage = 25;
        other.hp = Math.max(0, other.hp - damage);
        if (other.hpDisplay) other.hpDisplay.value = other.hp;
        events.emit(EVENTS.DAMAGE_DEALT, { source: ball, target: other, amount: damage, weaponType: 'laser' });
      }
    }
  },

  onTick: (ball, dt, state, events) => {
    // nothing
  },

  onExpire: (ball, state, events) => {
    delete ball.laserBeam;
  },

  onRender: (ctx, ball, timestamp) => {
    if (!ball.laserBeam) return;
    
    const elapsed = Date.now() - ball.laserBeam.startTime;
    if (elapsed > ball.laserBeam.duration) return;
    
    const { x1, y1, x2, y2 } = ball.laserBeam;
    
    // Fade out over duration
    const progress = elapsed / ball.laserBeam.duration;
    const alpha = 1 - progress;
    
    ctx.save();
    
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Inner core
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.restore();
  }
});
