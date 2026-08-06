/**
 * Freeze Zone Power-up Module
 * 
 * Creates an ice zone that slows enemies by 50% for 4s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';
import { statusEffects } from '../systems/status-effects.js';
import { state } from '../state.js';

registerPowerup({
  type: 'freeze_zone',
  name: 'Freeze Zone',
  icon: '❄️',
  rarity: 'rare',
  spawnWeight: 2,
  duration: 4000,

  onActivate: (ball, state, events) => {
    if (!state.activeZones) state.activeZones = [];
    
    ball.freezeZoneId = `freeze_zone_${Date.now()}`;
    
    state.activeZones.push({
      id: ball.freezeZoneId,
      type: 'freeze',
      x: ball.x,
      y: ball.y,
      radius: 80,
      startTime: Date.now(),
      duration: 4000,
      ownerId: ball.id
    });
  },

  onTick: (ball, dt, state, events) => {
    const zone = state.activeZones?.find(z => z.id === ball.freezeZoneId);
    if (!zone) return;
    
    for (const enemy of state.balls) {
      if (enemy.id === ball.id) continue;
      
      const dx = enemy.x - zone.x;
      const dy = enemy.y - zone.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < zone.radius + enemy.radius) {
        // apply freeze status effect
        if (statusEffects && statusEffects.apply) {
          statusEffects.apply(enemy, 'freeze', 500); // Apply for 500ms, keep re-applying
        }
      }
    }
  },

  onExpire: (ball, state, events) => {
    if (state.activeZones && ball.freezeZoneId) {
      const index = state.activeZones.findIndex(z => z.id === ball.freezeZoneId);
      if (index !== -1) {
        state.activeZones.splice(index, 1);
      }
      delete ball.freezeZoneId;
    }
  },

  onRender: (ctx, ball, timestamp) => {
    // Note: Render might be handled centrally for activeZones, but we can also draw from here
    // based on the zone stored in state if we want to tie it to the powerup lifecycle
    const zone = state.activeZones?.find(z => z.id === ball.freezeZoneId);
    if (!zone) return;
    
    ctx.save();
    
    // Ice blue circle
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // semi-transparent light blue
    ctx.fill();
    
    // Frost ring
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 15]);
    ctx.stroke();
    
    // Particles (simple visual, rotation based on timestamp)
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i + (timestamp * 0.001);
      const px = zone.x + Math.cos(angle) * (zone.radius * 0.7);
      const py = zone.y + Math.sin(angle) * (zone.radius * 0.7);
      
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    
    ctx.restore();
  }
});
