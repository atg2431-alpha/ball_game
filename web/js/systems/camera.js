/**
 * Camera System
 * 
 * Manages screen shake, zoom, and slow-motion effects.
 */

class Camera {
  constructor() {
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
    
    this.zoom = 1;
    this.targetZoom = 1;
    this.zoomSpeed = 0.08;
    
    this.timeScale = 1;
    this.targetTimeScale = 1;
    this.timeScaleRecovery = 0.05;
  }

  /**
   * Trigger screen shake
   * @param {number} intensity 
   * @param {number} [decay=0.92] 
   */
  shake(intensity, decay = 0.92) {
    this.shakeIntensity = intensity;
    this.shakeDecay = decay;
  }

  /**
   * Set time scale temporarily
   * @param {number} scale 
   * @param {number} durationMs 
   */
  slowMotion(scale, durationMs) {
    this.timeScale = scale;
    this.targetTimeScale = scale;
    
    setTimeout(() => {
      this.targetTimeScale = 1.0;
    }, durationMs);
  }

  /**
   * Smoothly zoom to target
   * @param {number} target 
   * @param {number} [speed=0.08] 
   */
  zoomTo(target, speed = 0.08) {
    this.targetZoom = target;
    this.zoomSpeed = speed;
  }

  /**
   * Update camera effects
   * @param {number} dt 
   */
  update(dt) {
    // Shake
    if (this.shakeIntensity > 0.1) {
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }

    // Zoom lerp
    this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;

    // Time scale lerp
    this.timeScale += (this.targetTimeScale - this.timeScale) * this.timeScaleRecovery;
  }

  /**
   * Apply transform to canvas context
   * @param {CanvasRenderingContext2D} ctx 
   */
  applyTransform(ctx) {
    ctx.save();
    
    // Apply shake translation
    ctx.translate(this.shakeX, this.shakeY);
    
    if (this.zoom !== 1) {
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-centerX, -centerY);
    }
  }

  /**
   * Restore canvas context
   * @param {CanvasRenderingContext2D} ctx 
   */
  resetTransform(ctx) {
    ctx.restore();
  }

  /**
   * Get current time scale
   * @returns {number}
   */
  getTimeScale() {
    return this.timeScale;
  }

  /**
   * Reset all effects
   */
  reset() {
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.timeScale = 1;
    this.targetTimeScale = 1;
  }
}

export const camera = new Camera();
