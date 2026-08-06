/**
 * Bounce Pad Hazard
 *
 * Static pads placed on the arena that boost ball velocity
 * when balls roll over them.
 */
import { state } from '../state.js';
import { events, EVENTS } from '../systems/event-bus.js';

let padIdCounter = 0;

/**
 * Spawn a bounce pad at a random position.
 */
export function spawnBouncePad() {
  if (!state.bouncePadsEnabled) return;
  
  const padding = 40;
  const x = padding + Math.random() * (state.boardWidth - padding * 2);
  const y = padding + Math.random() * (state.boardHeight - padding * 2);
  
  // Random direction for the boost
  const angle = Math.random() * Math.PI * 2;
  
  state.hazards.push({
    id: `bpad-${padIdCounter++}`,
    type: 'bounce_pad',
    x, y,
    radius: 25,
    boostMultiplier: 1.8,  // Velocity boost factor
    dirX: Math.cos(angle),
    dirY: Math.sin(angle),
    cooldowns: new Map(),  // Track per-ball cooldowns
  });
}

/**
 * Update bounce pads: check for ball contact and apply boost.
 * @param {number} timestamp
 */
export function updateBouncePads(timestamp) {
  for (const pad of state.hazards) {
    if (pad.type !== 'bounce_pad') continue;
    
    for (const ball of state.balls) {
      if (ball.isGhost) continue;
      
      const dx = ball.x - pad.x;
      const dy = ball.y - pad.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ball.radius + pad.radius) {
        // Check cooldown (prevent rapid re-triggering)
        const lastTrigger = pad.cooldowns.get(ball.id) || 0;
        if (timestamp - lastTrigger < 500) continue;
        
        pad.cooldowns.set(ball.id, timestamp);
        
        // Apply directional boost
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const boostedSpeed = speed * pad.boostMultiplier;
        
        // Launch in pad direction
        ball.vx = pad.dirX * boostedSpeed;
        ball.vy = pad.dirY * boostedSpeed;
        
        events.emit(EVENTS.HAZARD_TRIGGER, {
          hazardType: 'bounce_pad',
          x: pad.x,
          y: pad.y,
        });
      }
    }
  }
}

/**
 * Render bounce pads.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} timestamp
 */
export function renderBouncePads(ctx, timestamp) {
  ctx.save();
  
  for (const pad of state.hazards) {
    if (pad.type !== 'bounce_pad') continue;
    
    const pulse = Math.sin(timestamp * 0.006) * 0.15 + 0.85;
    
    // Pad base (green spring circle)
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius * pulse, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(pad.x, pad.y, 0, pad.x, pad.y, pad.radius);
    gradient.addColorStop(0, 'rgba(0, 255, 120, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 255, 120, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Border ring
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 120, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Direction arrow
    const arrowLen = pad.radius * 0.6;
    const tipX = pad.x + pad.dirX * arrowLen;
    const tipY = pad.y + pad.dirY * arrowLen;
    
    ctx.beginPath();
    ctx.moveTo(pad.x, pad.y);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = 'rgba(0, 255, 120, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Arrowhead
    const headLen = 8;
    const angle = Math.atan2(pad.dirY, pad.dirX);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle - 0.5), tipY - headLen * Math.sin(angle - 0.5));
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle + 0.5), tipY - headLen * Math.sin(angle + 0.5));
    ctx.stroke();
    
    // Spring icon
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('⚡', pad.x, pad.y);
  }
  
  ctx.restore();
}
