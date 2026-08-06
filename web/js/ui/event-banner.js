/**
 * Event Banner UI
 *
 * Displays dramatic slide-in banners for significant game events
 * like first blood, double kills, and power-up activations.
 * Optimized for 9:16 vertical viewing.
 */

const activeBanners = [];

/**
 * Show an event banner.
 * @param {string} text - Banner text
 * @param {string} [color='#FFD700'] - Text color
 * @param {number} [duration=1500] - Display duration in ms
 */
export function showBanner(text, color = '#FFD700', duration = 1500) {
  // Only allow 2 banners at once
  if (activeBanners.length >= 2) {
    activeBanners.shift();
  }
  
  activeBanners.push({
    text,
    color,
    duration,
    elapsed: 0,
    // Animation phases: slide-in (0-200ms), hold, slide-out (last 300ms)
    slideInDuration: 200,
    slideOutDuration: 300,
  });
}

/**
 * Update banner animations.
 * @param {number} dt - Delta time in ms
 */
export function updateBanners(dt) {
  for (let i = activeBanners.length - 1; i >= 0; i--) {
    activeBanners[i].elapsed += dt;
    if (activeBanners[i].elapsed >= activeBanners[i].duration) {
      activeBanners.splice(i, 1);
    }
  }
}

/**
 * Render event banners.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function renderBanners(ctx, canvasWidth, canvasHeight) {
  if (activeBanners.length === 0) return;
  
  ctx.save();
  
  activeBanners.forEach((banner, index) => {
    const { text, color, duration, elapsed, slideInDuration, slideOutDuration } = banner;
    
    // Calculate animation progress
    let alpha = 1;
    let slideX = 0;
    
    if (elapsed < slideInDuration) {
      // Slide in from left
      const t = elapsed / slideInDuration;
      slideX = -(1 - easeOutCubic(t)) * canvasWidth * 0.3;
      alpha = easeOutCubic(t);
    } else if (elapsed > duration - slideOutDuration) {
      // Slide out to right
      const t = (elapsed - (duration - slideOutDuration)) / slideOutDuration;
      slideX = easeInCubic(t) * canvasWidth * 0.3;
      alpha = 1 - easeInCubic(t);
    }
    
    const yPos = canvasHeight * 0.35 + index * 40;
    
    ctx.globalAlpha = alpha;
    
    // Banner background
    const textWidth = ctx.measureText(text).width || text.length * 16;
    const bgWidth = textWidth + 40;
    const bgHeight = 32;
    const bgX = (canvasWidth - bgWidth) / 2 + slideX;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    roundRect(ctx, bgX, yPos - bgHeight / 2, bgWidth, bgHeight, 6);
    ctx.fill();
    
    // Banner text
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fillText(text, canvasWidth / 2 + slideX, yPos);
    ctx.shadowBlur = 0;
  });
  
  ctx.restore();
}

// Easing functions
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }

// Helper for rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
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

/** Clear all banners */
export function clearBanners() {
  activeBanners.length = 0;
}
