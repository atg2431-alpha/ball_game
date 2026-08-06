/**
 * Particle System
 * 
 * Pooled particle system for visual effects. Handles object pooling and batch rendering
 * for performant visual feedback (explosions, trails, hits).
 */

export const PARTICLE_PRESETS = {
  COLLISION_SPARK: { speed: [2, 6], life: [300, 600], size: [2, 5], sizeEnd: [0, 1], colors: ['#FFD700', '#FF6B35', '#FFFFFF'], gravity: 0.05, alphaDecay: 0.015 },
  WEAPON_HIT: { speed: [1, 4], life: [200, 400], size: [3, 6], sizeEnd: [0, 0], colors: ['#FF4444', '#FF8800', '#FFCC00'], gravity: 0.08, alphaDecay: 0.02 },
  POWERUP_PICKUP: { speed: [1, 3], life: [400, 800], size: [2, 4], sizeEnd: [0, 0], colors: ['#00FF88', '#00CCFF', '#FFFFFF'], gravity: -0.03, alphaDecay: 0.01 },
  DEATH_EXPLOSION: { speed: [3, 8], life: [500, 1000], size: [3, 7], sizeEnd: [0, 1], colors: ['#FF0000', '#FF4400', '#FF8800', '#FFCC00', '#FFFFFF'], gravity: 0.1, alphaDecay: 0.008 },
  TRAIL: { speed: [0, 0.5], life: [200, 400], size: [3, 6], sizeEnd: [0, 0], colors: ['#4a9eff', '#ff4a6a'], gravity: 0, alphaDecay: 0.025 },
};

const randomRange = (min, max) => Math.random() * (max - min) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

class ParticleSystem {
  constructor() {
    this.MAX_PARTICLES = 500;
    this.pool = Array.from({ length: this.MAX_PARTICLES }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, sizeEnd: 0,
      color: '#fff',
      alpha: 1, alphaDecay: 0.01,
      gravity: 0,
      rotation: 0, rotationSpeed: 0,
      active: false
    }));
  }

  /**
   * Emit particles
   * @param {number} x 
   * @param {number} y 
   * @param {Object} preset 
   * @param {number} count 
   */
  emit(x, y, preset, count) {
    for (let i = 0; i < count; i++) {
      // Find inactive particle
      const particle = this.pool.find(p => !p.active);
      if (!particle) break; // Pool full

      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(preset.speed[0], preset.speed[1]);
      
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      
      particle.life = particle.maxLife = randomRange(preset.life[0], preset.life[1]);
      particle.size = randomRange(preset.size[0], preset.size[1]);
      particle.sizeEnd = randomRange(preset.sizeEnd[0], preset.sizeEnd[1]);
      
      particle.color = randomChoice(preset.colors);
      particle.alpha = 1;
      particle.alphaDecay = preset.alphaDecay;
      particle.gravity = preset.gravity;
      
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = randomRange(-0.1, 0.1);
      
      particle.active = true;
    }
  }

  /**
   * Update particles
   * @param {number} dt Delta time in ms
   */
  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0 || p.alpha <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      
      p.alpha = Math.max(0, p.alpha - p.alphaDecay * (dt / 16));
      p.rotation += p.rotationSpeed * (dt / 16);
      
      // Interpolate size based on life
      const lifeRatio = 1 - (p.life / p.maxLife);
      p.currentSize = p.size + (p.sizeEnd - p.size) * lifeRatio;
    }
  }

  /**
   * Render active particles
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    ctx.save();
    // Batch rendering approach
    for (const p of this.pool) {
      if (!p.active) continue;
      
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.currentSize || p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const p of this.pool) p.active = false;
  }

  /**
   * Get count of active particles
   * @returns {number}
   */
  getActiveCount() {
    let count = 0;
    for (const p of this.pool) if (p.active) count++;
    return count;
  }
}

export const particleSystem = new ParticleSystem();
