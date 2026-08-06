/**
 * HP Bar UI
 *
 * Animated canvas-drawn HP bars with:
 * - Smooth lerp drain animation
 * - Delayed ghost bar (shows recent damage)
 * - Color gradient transition (green → yellow → orange → red)
 * - Critical HP pulsing glow at <20%
 */

import { CONFIG } from '../config.js';

// Per-ball HP bar animation state
const barStates = new Map();

function getBarState(ballId) {
  if (!barStates.has(ballId)) {
    barStates.set(ballId, {
      displayHp: -1,       // -1 means uninitialized
      ghostHp: -1,
      lastDamageTime: 0,
      pulsePhase: 0,
    });
  }
  return barStates.get(ballId);
}

/**
 * Get HP color based on percentage
 * @param {number} pct 0.0 to 1.0
 * @returns {string} CSS color
 */
function getHpColor(pct) {
  if (pct > 0.6) return '#22c55e';       // Green
  if (pct > 0.4) return '#eab308';       // Yellow
  if (pct > 0.2) return '#f97316';       // Orange
  return '#ef4444';                       // Red
}

/**
 * Update HP bar animation states.
 * @param {Array} balls - Ball state objects
 * @param {number} dt - Delta time in ms
 */
export function updateHpBars(balls, dt) {
  for (const ball of balls) {
    const bs = getBarState(ball.id);
    const maxHp = ball.maxHp || 100;
    
    // Initialize on first frame
    if (bs.displayHp < 0) {
      bs.displayHp = ball.hp;
      bs.ghostHp = ball.hp;
    }
    
    // Smooth drain toward actual HP (lerp)
    const lerpSpeed = 0.08;
    bs.displayHp += (ball.hp - bs.displayHp) * lerpSpeed;
    
    // Track damage for ghost bar delay
    if (ball.hp < bs.ghostHp - 0.5) {
      if (bs.lastDamageTime === 0 || (bs.ghostHp - ball.hp) > 1) {
        bs.lastDamageTime = performance.now();
      }
    }
    
    // Ghost bar drains after 500ms delay
    const ghostDelay = 500;
    if (performance.now() - bs.lastDamageTime > ghostDelay) {
      bs.ghostHp += (ball.hp - bs.ghostHp) * 0.05;
    }
    
    // Clamp
    bs.ghostHp = Math.max(ball.hp, bs.ghostHp);
    
    // Pulse phase for critical HP
    const hpPct = ball.hp / maxHp;
    if (hpPct < 0.2 && hpPct > 0) {
      bs.pulsePhase += dt * 0.008;
    }
  }
}

/**
 * Render HP bars on canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} balls
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function renderHpBars(ctx, balls, canvasWidth, canvasHeight) {
  const barWidth = Math.min(180, (canvasWidth - 60) / 2);
  const barHeight = 12;
  const barY = canvasHeight - 30;
  const barRadius = 6;
  
  ctx.save();
  
  for (let i = 0; i < Math.min(balls.length, 2); i++) {
    const ball = balls[i];
    const bs = getBarState(ball.id);
    const maxHp = ball.maxHp || 100;
    const hpPct = Math.max(0, bs.displayHp / maxHp);
    const ghostPct = Math.max(0, bs.ghostHp / maxHp);
    const isBlue = ball.id === 'ball-1';
    
    // Position: left for P1, right for P2
    const barX = isBlue ? 20 : canvasWidth - barWidth - 20;
    
    // Critical pulse glow
    const criticalPct = ball.hp / maxHp;
    let glowAlpha = 0;
    if (criticalPct < 0.2 && criticalPct > 0) {
      glowAlpha = 0.3 + Math.sin(bs.pulsePhase) * 0.3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(239, 68, 68, ${glowAlpha})`;
    }
    
    // Background bar
    roundRect(ctx, barX, barY, barWidth, barHeight, barRadius);
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Ghost bar (delayed damage indicator)
    if (ghostPct > hpPct) {
      const ghostW = Math.max(0, ghostPct * (barWidth - 4));
      roundRect(ctx, barX + 2, barY + 2, ghostW, barHeight - 4, barRadius - 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
    }
    
    // HP fill bar
    const fillW = Math.max(0, hpPct * (barWidth - 4));
    if (fillW > 0) {
      roundRect(ctx, barX + 2, barY + 2, fillW, barHeight - 4, barRadius - 2);
      const hpColor = getHpColor(criticalPct);
      
      // Gradient fill
      const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      grad.addColorStop(0, hpColor);
      grad.addColorStop(1, adjustBrightness(hpColor, -20));
      ctx.fillStyle = grad;
      ctx.fill();
    }
    
    // HP text
    ctx.font = 'bold 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.max(0, Math.round(ball.hp))} / ${maxHp}`, barX + barWidth / 2, barY + barHeight / 2);
    
    // Player name label
    ctx.font = '9px "Outfit", sans-serif';
    ctx.textAlign = isBlue ? 'left' : 'right';
    ctx.fillStyle = isBlue ? '#60a5fa' : '#f87171';
    ctx.fillText(ball.name || (isBlue ? 'P1' : 'P2'), isBlue ? barX : barX + barWidth, barY - 6);
  }
  
  ctx.restore();
}

/** Reset all bar states */
export function resetHpBars() {
  barStates.clear();
}

// Helper: rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  if (w <= 0) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Helper: adjust hex color brightness
function adjustBrightness(hex, amount) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}
