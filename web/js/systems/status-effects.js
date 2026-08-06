/**
 * Status Effect Manager
 * 
 * Applies, ticks, and expires status effects on game objects (balls).
 */

import { events, EVENTS } from './event-bus.js';

export const EFFECT_DEFINITIONS = new Map([
  ['freeze', {
    type: 'freeze',
    name: 'Freeze',
    stackable: false,
    onApply(ball) {
      ball.speedMultiplier = 0.3;
    },
    onTick(ball, dt, effect) {},
    onExpire(ball) {
      ball.speedMultiplier = 1.0;
    }
  }],
  ['burn', {
    type: 'burn',
    name: 'Burn',
    stackable: true,
    onApply(ball) {},
    onTick(ball, dt, effect) {
      if (!effect.accumulatedTime) effect.accumulatedTime = 0;
      effect.accumulatedTime += dt;
      if (effect.accumulatedTime >= 500) {
        if (ball.hp !== undefined) ball.hp -= 1;
        effect.accumulatedTime -= 500;
      }
    },
    onExpire(ball) {}
  }],
  ['poison', {
    type: 'poison',
    name: 'Poison',
    stackable: true,
    onApply(ball) {},
    onTick(ball, dt, effect) {
      if (!effect.accumulatedTime) effect.accumulatedTime = 0;
      effect.accumulatedTime += dt;
      if (effect.accumulatedTime >= 300) {
        if (ball.hp !== undefined) ball.hp -= 0.5;
        effect.accumulatedTime -= 300;
      }
    },
    onExpire(ball) {}
  }],
  ['stun', {
    type: 'stun',
    name: 'Stun',
    stackable: false,
    onApply(ball) {
      ball.speedMultiplier = 0;
    },
    onTick(ball, dt, effect) {},
    onExpire(ball) {
      ball.speedMultiplier = 1.0;
    }
  }],
  ['berserk', {
    type: 'berserk',
    name: 'Berserk',
    stackable: false,
    onApply(ball) {
      ball.speedMultiplier = 1.5;
      ball.damageMultiplier = 1.5;
    },
    onTick(ball, dt, effect) {},
    onExpire(ball) {
      ball.speedMultiplier = 1.0;
      if (ball.damageMultiplier !== undefined) ball.damageMultiplier = 1.0;
    }
  }],
  ['ghost', {
    type: 'ghost',
    name: 'Ghost',
    stackable: false,
    onApply(ball) {
      ball.isGhost = true;
    },
    onTick(ball, dt, effect) {},
    onExpire(ball) {
      ball.isGhost = false;
    }
  }],
  ['shield', {
    type: 'shield',
    name: 'Shield',
    stackable: false,
    onApply(ball) {
      ball.shieldActive = true;
    },
    onTick(ball, dt, effect) {},
    onExpire(ball) {
      ball.shieldActive = false;
    }
  }]
]);

class StatusEffectManager {
  /**
   * Apply an effect to a ball
   * @param {Object} ball 
   * @param {string} effectType 
   * @param {number} durationMs 
   * @param {any} [source=null] 
   */
  apply(ball, effectType, durationMs, source = null) {
    const def = EFFECT_DEFINITIONS.get(effectType);
    if (!def) return;

    if (!ball.statusEffects) {
      ball.statusEffects = [];
    }

    if (!def.stackable) {
      const existing = ball.statusEffects.find(e => e.type === effectType);
      if (existing) {
        existing.duration = Math.max(existing.duration, durationMs);
        existing.startTime = performance.now();
        return;
      }
    }

    const effectInst = {
      type: effectType,
      startTime: performance.now(),
      duration: durationMs,
      source: source,
      lastTickTime: performance.now()
    };

    ball.statusEffects.push(effectInst);
    def.onApply(ball);
    
    events.emit(EVENTS.STATUS_APPLIED, { ball, effectType, duration: durationMs });
  }

  /**
   * Update active effects
   * @param {Array<Object>} balls 
   * @param {number} timestamp 
   */
  update(balls, timestamp) {
    for (const ball of balls) {
      if (!ball.statusEffects) continue;

      for (let i = ball.statusEffects.length - 1; i >= 0; i--) {
        const effect = ball.statusEffects[i];
        const def = EFFECT_DEFINITIONS.get(effect.type);
        if (!def) continue;

        const dt = timestamp - effect.lastTickTime;
        effect.lastTickTime = timestamp;

        def.onTick(ball, dt, effect);

        if (timestamp - effect.startTime >= effect.duration) {
          def.onExpire(ball);
          ball.statusEffects.splice(i, 1);
          events.emit(EVENTS.STATUS_EXPIRED, { ball, effectType: effect.type });
        }
      }
    }
  }

  /**
   * Force remove an effect
   * @param {Object} ball 
   * @param {string} effectType 
   */
  remove(ball, effectType) {
    if (!ball.statusEffects) return;
    
    const index = ball.statusEffects.findIndex(e => e.type === effectType);
    if (index !== -1) {
      const effect = ball.statusEffects[index];
      const def = EFFECT_DEFINITIONS.get(effect.type);
      if (def) def.onExpire(ball);
      
      ball.statusEffects.splice(index, 1);
      events.emit(EVENTS.STATUS_EXPIRED, { ball, effectType });
    }
  }

  /**
   * Check if a ball has an active effect
   * @param {Object} ball 
   * @param {string} effectType 
   * @returns {boolean}
   */
  hasEffect(ball, effectType) {
    return ball.statusEffects ? ball.statusEffects.some(e => e.type === effectType) : false;
  }

  /**
   * Clear all effects from a ball
   * @param {Object} ball 
   */
  clear(ball) {
    if (!ball.statusEffects) return;
    
    for (const effect of [...ball.statusEffects]) {
      this.remove(ball, effect.type);
    }
  }

  /**
   * Clear all effects from all given balls
   * @param {Array<Object>} [balls=[]] 
   */
  clearAll(balls = []) {
    for (const ball of balls) {
      this.clear(ball);
    }
  }
}

export const statusEffects = new StatusEffectManager();
