/**
 * Event Bus System
 * 
 * Lightweight pub/sub event system for decoupling game modules.
 * All game events (collisions, damage, kills, power-ups) flow through here.
 */

export const EVENTS = {
  // Collision events
  BALL_COLLISION: 'ball:collision',       // { ball1, ball2, impactSpeed, contactX, contactY }
  WALL_COLLISION: 'ball:wall',           // { ball, normalX, normalY, speed }
  
  // Combat events  
  DAMAGE_DEALT: 'combat:damage',          // { source, target, amount, weaponType }
  BALL_KILLED: 'combat:kill',             // { killer, victim }
  WEAPON_PICKUP: 'combat:weapon_pickup',  // { ball, weaponType }
  WEAPON_EXPIRED: 'combat:weapon_expired',// { ball, weaponType }
  PROJECTILE_HIT: 'combat:projectile_hit',// { projectile, target, damage }
  
  // Power-up events
  POWERUP_SPAWN: 'powerup:spawn',         // { powerup }
  POWERUP_PICKUP: 'powerup:pickup',       // { ball, powerupType }
  POWERUP_EXPIRED: 'powerup:expired',     // { ball, powerupType }
  
  // Status effect events
  STATUS_APPLIED: 'status:applied',       // { ball, effectType, duration }
  STATUS_EXPIRED: 'status:expired',       // { ball, effectType }
  
  // Arena events
  ARENA_SHRINK: 'arena:shrink',           // { currentRadius, targetRadius }
  HAZARD_TRIGGER: 'arena:hazard',         // { hazardType, x, y }
  
  // Game lifecycle
  GAME_START: 'game:start',               // {}
  GAME_OVER: 'game:over',                 // { winner }
  GAME_RESET: 'game:reset',              // {}
};

class EventBus {
  constructor() {
    /** @type {Map<string, Set<{fn: Function, ctx: any}>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} callback 
   * @param {any} [context] 
   */
  on(event, callback, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add({ fn: callback, ctx: context });
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const set = this.listeners.get(event);
      for (const listener of set) {
        if (listener.fn === callback) {
          set.delete(listener);
          break;
        }
      }
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event 
   * @param  {...any} data 
   */
  emit(event, ...data) {
    if (this.listeners.has(event)) {
      const set = this.listeners.get(event);
      for (const listener of set) {
        listener.fn.apply(listener.ctx, data);
      }
    }
  }

  /**
   * Subscribe to an event once
   * @param {string} event 
   * @param {Function} callback 
   * @param {any} [context] 
   */
  once(event, callback, context = null) {
    const wrapper = (...data) => {
      this.off(event, wrapper);
      callback.apply(context, data);
    };
    this.on(event, wrapper, context);
  }

  /**
   * Clear all events
   */
  clear() {
    this.listeners.clear();
  }
}

export const events = new EventBus();
