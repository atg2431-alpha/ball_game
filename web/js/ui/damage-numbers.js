/**
 * Damage Numbers UI
 *
 * Renders floating damage numbers that appear at hit locations,
 * drift upward, and fade out. Creates satisfying visual feedback.
 */

const activeNumbers = [];

/**
 * Spawn a floating damage number.
 * @param {number} x - X position
 * @param {number} y - Y position  
 * @param {number} amount - Damage amount to display
 * @param {string} [color='#ff4444'] - Text color
 */
export function spawnDamageNumber(x, y, amount, color = '#ff4444') {
  activeNumbers.push({
    x: x + (Math.random() - 0.5) * 20,  // Slight random offset
    y,
    amount: Math.round(amount),
    color,
    alpha: 1.0,
    vy: -1.5,       // Drift upward speed
    scale: 1.2,     // Start slightly larger
    life: 800,      // ms
    elapsed: 0,
  });
}

/**
 * Spawn a heal number (green, drifts up).
 */
export function spawnHealNumber(x, y, amount) {
  spawnDamageNumber(x, y, '+' + amount, '#22ff66');
}

/**
 * Update all floating numbers.
 * @param {number} dt - Delta time in ms
 */
export function updateDamageNumbers(dt) {
  for (let i = activeNumbers.length - 1; i >= 0; i--) {
    const num = activeNumbers[i];
    num.elapsed += dt;
    
    if (num.elapsed >= num.life) {
      activeNumbers.splice(i, 1);
      continue;
    }
    
    const progress = num.elapsed / num.life;
    num.y += num.vy;
    num.alpha = 1 - progress;
    num.scale = 1.2 - progress * 0.4;  // Shrink slightly
  }
}

/**
 * Render all floating damage numbers.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderDamageNumbers(ctx) {
  if (activeNumbers.length === 0) return;
  
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (const num of activeNumbers) {
    ctx.globalAlpha = num.alpha;
    ctx.font = `bold ${Math.round(16 * num.scale)}px "Outfit", sans-serif`;
    
    // Shadow for readability
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    
    ctx.fillStyle = num.color;
    ctx.fillText(num.amount, num.x, num.y);
  }
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Clear all active numbers */
export function clearDamageNumbers() {
  activeNumbers.length = 0;
}
