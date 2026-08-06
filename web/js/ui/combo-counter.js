/**
 * Combo Counter UI
 *
 * Tracks consecutive hits within a time window and displays
 * an escalating combo counter with fire/glow effects.
 */

const comboState = {
  count: 0,
  lastHitTime: 0,
  displayAlpha: 0,
  scale: 1,
  comboWindow: 2000,  // ms window for consecutive hits
};

/**
 * Register a hit for combo tracking.
 * @param {number} timestamp
 */
export function registerHit(timestamp) {
  if (timestamp - comboState.lastHitTime < comboState.comboWindow) {
    comboState.count++;
  } else {
    comboState.count = 1;
  }
  comboState.lastHitTime = timestamp;
  comboState.displayAlpha = 1;
  comboState.scale = 1.5;  // Pop-in effect
}

/**
 * Update combo counter animation.
 * @param {number} dt - Delta time in ms
 */
export function updateCombo(dt) {
  const now = performance.now();
  
  // Fade out if no recent hits
  if (now - comboState.lastHitTime > comboState.comboWindow) {
    comboState.displayAlpha -= dt * 0.003;
    if (comboState.displayAlpha <= 0) {
      comboState.displayAlpha = 0;
      comboState.count = 0;
    }
  }
  
  // Scale lerp back to 1.0
  comboState.scale += (1.0 - comboState.scale) * 0.1;
}

/**
 * Render combo counter on canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function renderCombo(ctx, canvasWidth, canvasHeight) {
  if (comboState.count < 2 || comboState.displayAlpha <= 0) return;
  
  ctx.save();
  ctx.globalAlpha = comboState.displayAlpha;
  
  const x = canvasWidth - 60;
  const y = 50;
  
  // Scale transform for pop-in
  ctx.translate(x, y);
  ctx.scale(comboState.scale, comboState.scale);
  
  // Glow intensity based on combo count
  const glowIntensity = Math.min(comboState.count * 3, 20);
  
  // Combo color escalation
  let color;
  if (comboState.count >= 10) color = '#ff0000';       // Red fire
  else if (comboState.count >= 7) color = '#ff6600';   // Orange
  else if (comboState.count >= 4) color = '#ffaa00';   // Gold
  else color = '#ffffff';                               // White
  
  // Glow
  ctx.shadowBlur = glowIntensity;
  ctx.shadowColor = color;
  
  // Counter text
  ctx.font = `bold 28px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(`${comboState.count}×`, 0, 0);
  
  // "COMBO" label
  ctx.shadowBlur = 0;
  ctx.font = 'bold 10px "Outfit", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('COMBO', 0, 18);
  
  ctx.restore();
}

/** Reset combo */
export function resetCombo() {
  comboState.count = 0;
  comboState.lastHitTime = 0;
  comboState.displayAlpha = 0;
  comboState.scale = 1;
}
