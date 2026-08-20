/**
 * Laser Power-up Module
 * 
 * Fires an instant screen-width beam dealing 25 damage.
 */

import { registerPowerup } from '../systems/powerup-registry.js';
import { EVENTS } from '../systems/event-bus.js';

const def = {
  type: 'laser',
  name: 'Laser',
  icon: '⚡',
  rarity: 'legendary',
  spawnWeight: 1,
  enabled: true,
  duration: 500,
  // Configurable gameplay values
  laserDamage: 25,
  beamLength: 2000,
  configurable: [
    { label: 'Damage', key: 'laserDamage', min: 1, max: 100, step: 1 },
    { label: 'Beam Length', key: 'beamLength', min: 500, max: 5000, step: 100 },
  ],

  onActivate: (ball, state, events) => {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    let dirX = 1;
    let dirY = 0;
    
    if (speed > 0.01) {
      dirX = ball.vx / speed;
      dirY = ball.vy / speed;
    }
    
    const length = def.beamLength;
    const x1 = ball.x;
    const y1 = ball.y;
    const x2 = ball.x + dirX * length;
    const y2 = ball.y + dirY * length;
    
    ball.laserBeam = {
      x1, y1, x2, y2,
      startTime: Date.now(),
      duration: 400
    };
    
    for (const other of state.balls) {
      if (other.id === ball.id) continue;
      
      const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      if (l2 === 0) continue;
      
      let t = ((other.x - x1) * (x2 - x1) + (other.y - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      
      const px = x1 + t * (x2 - x1);
      const py = y1 + t * (y2 - y1);
      
      const dist = Math.sqrt((other.x - px) * (other.x - px) + (other.y - py) * (other.y - py));
      
      if (dist < other.radius + 10) {
        const damage = def.laserDamage;
        other.hp = Math.max(0, other.hp - damage);
        if (other.hpDisplay) other.hpDisplay.value = other.hp;
        events.emit(EVENTS.DAMAGE_DEALT, { source: ball, target: other, amount: damage, weaponType: 'laser' });
      }
    }
  },

  onTick: (ball, dt, state, events) => {},

  onExpire: (ball, state, events) => {
    delete ball.laserBeam;
  },

  onRender: (ctx, ball, timestamp) => {
    if (!ball.laserBeam) return;
    
    const elapsed = Date.now() - ball.laserBeam.startTime;
    if (elapsed > ball.laserBeam.duration) return;
    
    const { x1, y1, x2, y2 } = ball.laserBeam;
    
    const progress = elapsed / ball.laserBeam.duration;
    const alpha = 1 - progress;
    
    ctx.save();
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    ctx.restore();
  }
};

registerPowerup(def);
