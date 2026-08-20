/**
 * Freeze Zone Power-up Module
 * 
 * Creates an ice zone that slows enemies by 50% for 4s.
 */

import { registerPowerup } from '../systems/powerup-registry.js';
import { statusEffects } from '../systems/status-effects.js';
import { state } from '../state.js';

const def = {
  type: 'freeze_zone',
  name: 'Freeze Zone',
  description: 'Creates an ice zone that slows enemies by 50%.',
  icon: '❄️',
  rarity: 'rare',
  spawnWeight: 2,
  enabled: true,
  duration: 4000,
  // Configurable gameplay values
  zoneRadius: 80,
  configurable: [
    { label: 'Spawn Weight', key: 'spawnWeight', min: 1, max: 10, step: 1 },
    { label: 'Duration (s)', key: 'duration', min: 1, max: 30, step: 1, multiplier: 1000 },
    { label: 'Zone Radius', key: 'zoneRadius', min: 20, max: 200, step: 5 },
  ],

  onActivate: (ball, state, events) => {
    if (!state.activeZones) state.activeZones = [];
    
    ball.freezeZoneId = `freeze_zone_${Date.now()}`;
    
    state.activeZones.push({
      id: ball.freezeZoneId,
      type: 'freeze',
      x: ball.x,
      y: ball.y,
      radius: def.zoneRadius,
      startTime: Date.now(),
      duration: def.duration,
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
        if (statusEffects && statusEffects.apply) {
          statusEffects.apply(enemy, 'freeze', 500);
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
    const zone = state.activeZones?.find(z => z.id === ball.freezeZoneId);
    if (!zone) return;
    
    ctx.save();
    
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 15]);
    ctx.stroke();
    
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
};

registerPowerup(def);
