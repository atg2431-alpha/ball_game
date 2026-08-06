/**
 * Gravity Well Hazard
 *
 * Creates gravitational attractors on the arena that pull
 * nearby balls toward their center.
 */
import { CONFIG } from '../config.js';
import { state } from '../state.js';

let wellIdCounter = 0;

/**
 * Spawn a gravity well at a random position.
 * @param {number} timestamp
 */
export function spawnGravityWell(timestamp) {
  if (!state.gravityWellsEnabled) return;
  
  const padding = 50;
  const x = padding + Math.random() * (state.boardWidth - padding * 2);
  const y = padding + Math.random() * (state.boardHeight - padding * 2);
  
  state.hazards.push({
    id: `gwell-${wellIdCounter++}`,
    type: 'gravity_well',
    x, y,
    radius: 80,       // Influence radius
    strength: 0.12,    // Acceleration magnitude
    lifetime: 12000,   // ms
    spawnTime: timestamp,
    pulsePhase: Math.random() * Math.PI * 2,
  });
}

/**
 * Update all gravity wells: apply forces and expire.
 * @param {number} timestamp
 */
export function updateGravityWells(timestamp) {
  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const well = state.hazards[i];
    if (well.type !== 'gravity_well') continue;
    
    // Check lifetime
    if (timestamp - well.spawnTime > well.lifetime) {
      state.hazards.splice(i, 1);
      continue;
    }
    
    // Apply gravitational pull to all balls
    for (const ball of state.balls) {
      if (ball.isGhost) continue;
      
      const dx = well.x - ball.x;
      const dy = well.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < well.radius && dist > 5) {
        // Gravitational acceleration inversely proportional to distance
        const force = well.strength * (1 - dist / well.radius);
        const nx = dx / dist;
        const ny = dy / dist;
        
        ball.vx += nx * force;
        ball.vy += ny * force;
      }
    }
  }
}

/**
 * Render gravity wells.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} timestamp
 */
export function renderGravityWells(ctx, timestamp) {
  ctx.save();
  
  for (const well of state.hazards) {
    if (well.type !== 'gravity_well') continue;
    
    const age = timestamp - well.spawnTime;
    const lifeRatio = age / well.lifetime;
    const fadeAlpha = lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1; // Fade in last 20%
    const pulse = Math.sin(timestamp * 0.004 + well.pulsePhase) * 0.2 + 0.8;
    
    // Outer influence ring
    ctx.beginPath();
    ctx.arc(well.x, well.y, well.radius * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.3 * fadeAlpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Inner rings (swirling effect)
    for (let r = 0; r < 3; r++) {
      const ringRadius = well.radius * (0.3 + r * 0.2) * pulse;
      const ringOffset = timestamp * 0.002 + r * 1.5;
      ctx.beginPath();
      ctx.arc(well.x, well.y, ringRadius, ringOffset, ringOffset + Math.PI * 1.5);
      ctx.strokeStyle = `rgba(180, 80, 255, ${(0.4 - r * 0.1) * fadeAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    // Center core glow
    const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, 20);
    gradient.addColorStop(0, `rgba(200, 100, 255, ${0.6 * fadeAlpha})`);
    gradient.addColorStop(1, 'rgba(200, 100, 255, 0)');
    ctx.beginPath();
    ctx.arc(well.x, well.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  ctx.restore();
}
