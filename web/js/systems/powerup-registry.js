/**
 * Power-Up Registry
 * 
 * Registry-based power-up system. Each power-up type is registered with a
 * definition object that defines its behavior. The registry handles spawning
 * items on the board, pickup detection, and lifecycle management.
 */

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { events, EVENTS } from '../systems/event-bus.js';
import { particleSystem, PARTICLE_PRESETS } from '../systems/particle.js';

let powerupIdCounter = 0;

/** @type {Map<string, Object>} Registered power-up definitions */
const registry = new Map();

/**
 * Register a power-up type.
 * @param {Object} definition Power-up definition object
 * @param {string} definition.type - Unique type identifier
 * @param {string} definition.name - Display name
 * @param {string} definition.icon - Emoji icon for ground display
 * @param {string} definition.rarity - 'common' | 'rare' | 'legendary'
 * @param {number} definition.spawnWeight - Relative spawn probability weight
 * @param {number} definition.duration - Active duration in ms
 * @param {Function} definition.onActivate - Called when picked up (ball, state, events)
 * @param {Function} definition.onTick - Called each sim frame while active (ball, dt, state, events)
 * @param {Function} definition.onExpire - Called when duration ends (ball, state, events)
 * @param {Function} definition.onRender - Custom visual rendering (ctx, ball, timestamp)
 */
export function registerPowerup(definition) {
  registry.set(definition.type, definition);
  if (definition.enabled === undefined) definition.enabled = true;
}

/** Get all registered definitions */
export function getRegistry() {
  return registry;
}

/** Get configurable attributes for a power-up type */
export function getConfigurableAttributes(type) {
  const def = registry.get(type);
  if (!def || !def.configurable) return [];
  return def.configurable;
}

/**
 * Pick a random power-up type using weighted random selection.
 * @returns {Object} A power-up definition
 */
function weightedRandomPick() {
  const entries = [...registry.values()].filter(e => e.enabled !== false);
  if (entries.length === 0) return null;
  
  const totalWeight = entries.reduce((sum, e) => sum + (e.spawnWeight || 1), 0);
  let rand = Math.random() * totalWeight;
  
  for (const entry of entries) {
    rand -= (entry.spawnWeight || 1);
    if (rand <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/**
 * Spawn a power-up item on the board.
 * @param {number} timestamp - Current simulation time
 */
export function spawnPowerup(timestamp) {
  if (registry.size === 0) return;
  if (!state.powerupsEnabled) return;
  
  const spawnInterval = CONFIG.powerups.spawnInterval;
  if (timestamp - state.lastPowerupSpawn < spawnInterval) return;
  
  // Don't exceed max items on board
  if (state.powerupItems.length >= CONFIG.powerups.maxOnBoard) return;
  
  state.lastPowerupSpawn = timestamp;
  
  const def = weightedRandomPick();
  if (!def) return;
  
  const padding = 30;
  const x = padding + Math.random() * (state.boardWidth - padding * 2);
  const y = padding + Math.random() * (state.boardHeight - padding * 2);
  
  const item = {
    id: `powerup-${powerupIdCounter++}`,
    x, y,
    radius: 14,
    type: def.type,
    spawnTime: timestamp,
  };
  
  state.powerupItems.push(item);
  events.emit(EVENTS.POWERUP_SPAWN, { powerup: item });
}

/**
 * Update power-up system: check pickups and tick active power-ups.
 * @param {Array} balls - Array of ball state objects  
 * @param {number} timestamp - Current simulation time
 */
export function updatePowerups(balls, timestamp) {
  // 1. Check for pickup
  for (let i = state.powerupItems.length - 1; i >= 0; i--) {
    const item = state.powerupItems[i];
    
    for (const ball of balls) {
      const dx = ball.x - item.x;
      const dy = ball.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ball.radius + item.radius) {
        const def = registry.get(item.type);
        if (!def) continue;
        
        // Activate power-up on ball
        if (!ball.activePowerups) ball.activePowerups = [];
        
        ball.activePowerups.push({
          type: item.type,
          startTime: timestamp,
          duration: def.duration,
          def: def,
        });
        
        // Call onActivate
        def.onActivate(ball, state, events);
        
        // Emit event
        events.emit(EVENTS.POWERUP_PICKUP, { ball, powerupType: item.type });
        
        // Pickup sparkle
        particleSystem.emit(item.x, item.y, PARTICLE_PRESETS.POWERUP_PICKUP, 10);
        
        // Remove from board
        state.powerupItems.splice(i, 1);
        break;
      }
    }
  }
  
  // 2. Tick active power-ups and expire
  for (const ball of balls) {
    if (!ball.activePowerups) continue;
    
    for (let i = ball.activePowerups.length - 1; i >= 0; i--) {
      const active = ball.activePowerups[i];
      const elapsed = timestamp - active.startTime;
      
      if (elapsed >= active.duration) {
        // Expire
        active.def.onExpire(ball, state, events);
        events.emit(EVENTS.POWERUP_EXPIRED, { ball, powerupType: active.type });
        ball.activePowerups.splice(i, 1);
      } else {
        // Tick
        active.def.onTick(ball, elapsed, state, events);
      }
    }
  }
}

/**
 * Render ground power-up items.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} timestamp
 */
export function renderPowerupItems(ctx, timestamp) {
  ctx.save();
  
  for (const item of state.powerupItems) {
    const def = registry.get(item.type);
    if (!def) continue;
    
    // Pulsing glow effect
    const pulse = 0.8 + Math.sin(timestamp * 0.005) * 0.2;
    const glowRadius = item.radius + 4;
    
    // Rarity-based glow color
    let glowColor;
    switch (def.rarity) {
      case 'legendary': glowColor = 'rgba(255, 215, 0, 0.5)'; break;
      case 'rare': glowColor = 'rgba(138, 43, 226, 0.4)'; break;
      default: glowColor = 'rgba(0, 200, 255, 0.3)';
    }
    
    // Glow circle
    ctx.beginPath();
    ctx.arc(item.x, item.y, glowRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();
    
    // Background circle
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    
    // Icon
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, item.x, item.y);
  }
  
  ctx.restore();
}

/**
 * Render active power-up effects on a ball.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} ball
 * @param {number} timestamp
 */
export function renderActivePowerups(ctx, ball, timestamp) {
  if (!ball.activePowerups) return;
  
  for (const active of ball.activePowerups) {
    if (active.def.onRender) {
      active.def.onRender(ctx, ball, timestamp);
    }
  }
}

/**
 * Reset all power-up state.
 */
export function resetPowerups() {
  state.powerupItems = [];
  state.lastPowerupSpawn = 0;
  
  for (const ball of state.balls) {
    if (ball.activePowerups) {
      for (const active of ball.activePowerups) {
        active.def.onExpire(ball, state, events);
      }
      ball.activePowerups = [];
    }
  }
}
