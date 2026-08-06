/**
 * Match Timer UI
 *
 * Tracks and displays elapsed match time on the canvas.
 * Format: M:SS, shown at the top-center of the arena.
 */

let matchStartTime = 0;
let elapsedMs = 0;
let running = false;

/** Start the match timer */
export function startTimer() {
  matchStartTime = performance.now();
  elapsedMs = 0;
  running = true;
}

/** Stop the match timer */
export function stopTimer() {
  running = false;
}

/** Update timer (call each frame) */
export function updateTimer() {
  if (!running) return;
  elapsedMs = performance.now() - matchStartTime;
}

/** Get elapsed time in ms */
export function getElapsedMs() {
  return elapsedMs;
}

/** Get formatted time string */
export function getFormattedTime() {
  const totalSec = Math.floor(elapsedMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Render match timer on canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth
 */
export function renderTimer(ctx, canvasWidth) {
  if (!running && elapsedMs === 0) return;
  
  const timeStr = getFormattedTime();
  
  ctx.save();
  
  // Background pill
  const pillW = 60;
  const pillH = 22;
  const pillX = (canvasWidth - pillW) / 2;
  const pillY = 8;
  
  ctx.beginPath();
  ctx.moveTo(pillX + pillH / 2, pillY);
  ctx.lineTo(pillX + pillW - pillH / 2, pillY);
  ctx.arc(pillX + pillW - pillH / 2, pillY + pillH / 2, pillH / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(pillX + pillH / 2, pillY + pillH);
  ctx.arc(pillX + pillH / 2, pillY + pillH / 2, pillH / 2, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fill();
  
  // Timer text
  ctx.font = 'bold 12px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(timeStr, canvasWidth / 2, pillY + pillH / 2);
  
  ctx.restore();
}

/** Reset timer */
export function resetTimer() {
  matchStartTime = 0;
  elapsedMs = 0;
  running = false;
}
