/**
 * Shrink Zone Hazard
 * 
 * Progressively shrinks the playable arena boundary.
 * Balls outside the safe zone take damage over time.
 */
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { events, EVENTS } from '../systems/event-bus.js';

let lastDamageTick = 0;

/** Start the arena shrink */
export function activateShrinkZone() {
  state.arenaState.shrinking = true;
  // Initialize radius based on board shape
  if (state.boardShape === 'circle') {
    state.arenaState.currentRadius = state.boardWidth / 2;
  } else {
    // For rectangle, use half the smaller dimension
    state.arenaState.currentRadius = Math.min(state.boardWidth, state.boardHeight) / 2;
  }
  state.arenaState.targetRadius = CONFIG.arena.minRadius;
  events.emit(EVENTS.ARENA_SHRINK, {
    currentRadius: state.arenaState.currentRadius,
    targetRadius: state.arenaState.targetRadius
  });
}

/** Update shrink zone each frame */
export function updateShrinkZone(timestamp) {
  if (!state.arenaState.shrinking) return;
  
  const arena = state.arenaState;
  
  // Shrink the radius
  if (arena.currentRadius > CONFIG.arena.minRadius) {
    arena.currentRadius -= CONFIG.arena.shrinkRate;
    arena.currentRadius = Math.max(arena.currentRadius, CONFIG.arena.minRadius);
  }
  
  // Check if balls are outside safe zone and deal damage
  const cx = state.boardWidth / 2;
  const cy = state.boardHeight / 2;
  
  if (timestamp - lastDamageTick > CONFIG.arena.killWallTickInterval) {
    lastDamageTick = timestamp;
    
    for (const ball of state.balls) {
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist + ball.radius > arena.currentRadius) {
        ball.hp = Math.max(0, ball.hp - CONFIG.arena.killWallDamage);
        if (ball.hpDisplay) ball.hpDisplay.value = ball.hp;
        events.emit(EVENTS.HAZARD_TRIGGER, {
          hazardType: 'shrink_zone',
          x: ball.x,
          y: ball.y,
        });
      }
    }
  }
}

/** Render the shrink zone visual */
export function renderShrinkZone(ctx, timestamp) {
  if (!state.arenaState.shrinking) return;
  
  const cx = state.boardWidth / 2;
  const cy = state.boardHeight / 2;
  const radius = state.arenaState.currentRadius;
  const pulse = Math.sin(timestamp * 0.003) * 0.15 + 0.85;
  
  ctx.save();
  
  // Draw danger zone (outside safe area) as red overlay
  // Use composite operation to fill everything OUTSIDE the circle
  ctx.beginPath();
  ctx.rect(0, 0, state.boardWidth, state.boardHeight);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, true); // counter-clockwise to cut out
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 0, 0, ${0.15 * pulse})`;
  ctx.fill();
  
  // Draw safe zone border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 50, 50, ${0.6 * pulse})`;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Draw warning dashes at slightly larger radius  
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 * pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.restore();
}

/** Reset shrink zone */
export function resetShrinkZone() {
  state.arenaState.shrinking = false;
  state.arenaState.currentRadius = 0;
  lastDamageTick = 0;
}
