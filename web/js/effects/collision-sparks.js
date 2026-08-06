/**
 * Collision Sparks Effect
 *
 * Listens to ball collision and wall collision events and spawns
 * spark particle bursts at impact points. Automatically wires to event bus.
 */

import { events, EVENTS } from '../systems/event-bus.js';
import { particleSystem, PARTICLE_PRESETS } from '../systems/particle.js';
import { camera } from '../systems/camera.js';
import { CONFIG } from '../config.js';

/**
 * Initialize collision spark effects.
 * Wires event listeners for visual feedback on impacts.
 */
export function initCollisionSparks() {
  // Ball-ball collisions: sparks + proportional screen shake
  events.on(EVENTS.BALL_COLLISION, (data) => {
    const { contactX, contactY, impactSpeed } = data;
    
    // Scale spark count by impact speed
    const sparkCount = Math.min(
      Math.floor(impactSpeed * 3),
      CONFIG.particles.collisionSparkCount
    );
    
    if (sparkCount > 0) {
      particleSystem.emit(contactX, contactY, PARTICLE_PRESETS.COLLISION_SPARK, sparkCount);
    }
    
    // Screen shake proportional to impact
    const intensity = CONFIG.camera.collisionShakeBase + impactSpeed * CONFIG.camera.collisionShakeScale;
    camera.shake(intensity, CONFIG.camera.shakeDecay);
  });
  
  // Wall collisions: small spark burst at ball edge
  events.on(EVENTS.WALL_COLLISION, (data) => {
    const { ball, speed } = data;
    if (speed > 3) {
      particleSystem.emit(ball.x, ball.y, PARTICLE_PRESETS.COLLISION_SPARK, Math.min(Math.floor(speed), 6));
    }
  });
}
