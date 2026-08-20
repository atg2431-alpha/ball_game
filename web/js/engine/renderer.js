/**
 * Canvas Rendering Engine
 * 
 * Replaces DOM-based rendering with HTML5 Canvas drawing for perfect performance.
 */
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { camera } from '../systems/camera.js';
import { particleSystem } from '../systems/particle.js';
import { renderPowerupItems, renderActivePowerups } from '../systems/powerup-registry.js';
import { renderShrinkZone } from '../hazards/shrink-zone.js';
import { renderGravityWells } from '../hazards/gravity-well.js';
import { renderBouncePads } from '../hazards/bounce-pad.js';
import { renderDamageNumbers } from '../ui/damage-numbers.js';
import { renderBanners } from '../ui/event-banner.js';
import { renderHpBars } from '../ui/hp-bar.js';
import { renderTimer } from '../ui/match-timer.js';
import { renderCombo } from '../ui/combo-counter.js';
import { renderShockwaves } from '../effects/death-explosion.js';
import { renderFlash } from '../effects/powerup-flash.js';

let canvas;
let ctx;
let width;
let height;
let dpr;

/**
 * Initialize the canvas and handle DPI scaling for crisp graphics.
 */
export function initRenderer(canvasId) {
  canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas with id ${canvasId} not found`);
    return null;
  }
  ctx = canvas.getContext('2d');
  
  // Set canvas logical size to match its CSS pixel size
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  
  // Handle high-DPI displays
  dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  // Update state board dimensions
  state.boardWidth = width;
  state.boardHeight = height;

  return canvas;
}

export function handleResize() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  state.boardWidth = width;
  state.boardHeight = height;
}

/**
 * Main render function called every frame.
 */
export function renderFrame() {
  if (!ctx) return;
  const now = performance.now();
  ctx.clearRect(0, 0, width, height);

  camera.applyTransform(ctx, width, height);

  // Layer 1: Arena hazards (behind everything)
  renderShrinkZone(ctx, now);
  renderGravityWells(ctx, now);
  renderBouncePads(ctx, now);

  // Layer 2: Aim lines & ground items
  drawAimLines();
  drawGroundWeapons();
  renderPowerupItems(ctx, now);

  // Layer 3: Projectiles
  drawProjectiles();

  // Layer 4: Balls + effects
  for (const ball of state.balls) {
    drawTrail(ball);
    drawBall(ball);
    drawOrbitingWeapon(ball);
    drawStatusIndicators(ball);
    renderActivePowerups(ctx, ball, now);
  }

  // Layer 5: Active zones (freeze zones, etc.)
  renderActiveZones(ctx, now);

  // Layer 6: Particles
  particleSystem.render(ctx);

  // Layer 7: UI overlays
  renderDamageNumbers(ctx);
  renderBanners(ctx, width, height);

  // Layer 8: Shockwave rings (death explosion)
  renderShockwaves(ctx);

  camera.resetTransform(ctx);

  // Layer 9: HUD overlays (outside camera transform for stable positioning)
  renderHpBars(ctx, state.balls, width, height);
  renderTimer(ctx, width);
  renderCombo(ctx, width, height);

  // Layer 10: Screen flash (on top of everything)
  renderFlash(ctx, width, height);
}

function getBallPalette(ballId) {
  const colour = state.playerColors?.[ballId] ?? (ballId === 'ball-1' ? 'blue' : 'red');
  switch (colour) {
    case 'green':
      return {
        shadow: '#86efac',
        gradientLight: '#4ade80',
        gradientDark: '#16a34a',
        trailRgb: [74, 222, 128],
        aimColor: '#22c55e',
      };
    case 'red':
      return {
        shadow: '#fca5a5',
        gradientLight: '#f87171',
        gradientDark: '#ef4444',
        trailRgb: [248, 113, 113],
        aimColor: '#ff4a6a',
      };
    case 'blue':
    default:
      return {
        shadow: '#93c5fd',
        gradientLight: '#60a5fa',
        gradientDark: '#3b82f6',
        trailRgb: [96, 165, 250],
        aimColor: '#4a9eff',
      };
  }
}

function drawBall(ball) {
  const palette = getBallPalette(ball.id);
  
  ctx.save();
  if (ball.isGhost) {
    ctx.globalAlpha = 0.4;
  }
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  
  // Glowing effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = palette.shadow;

  // Gradient fill
  const gradient = ctx.createRadialGradient(
    ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
    ball.x, ball.y, ball.radius
  );
  gradient.addColorStop(0, palette.gradientLight);
  gradient.addColorStop(1, palette.gradientDark);
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // HP Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.max(0, Math.round(ball.hp)), ball.x, ball.y);
  
  ctx.restore();
}

function getWeaponEmoji(type) {
  if (type === 'longsword') return '🗡️';
  if (type === 'gun') return '🔫';
  return '⚔️';
}

function drawGroundWeapons() {
  ctx.save();
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (const item of state.spawnedItems) {
    ctx.fillText(getWeaponEmoji(item.type), item.x, item.y);
  }
  ctx.restore();
}

function drawOrbitingWeapon(ball) {
  if (!ball.weaponType || !ball.weaponExpiry || ball.weaponAngle === undefined || ball.weaponAngle === null) return;
  
  const baseAngle = ball.weaponAngle;
  const orbitRadius = CONFIG.weapons.orbitRadius;
  const weaponConfig = CONFIG.weapons[ball.weaponType];
  const count = weaponConfig.count || 1;
  const angleStep = (Math.PI * 2) / count;
  
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + i * angleStep;
    let wx, wy;
    if (ball.weaponType === 'longsword' || ball.weaponType === 'gun') {
      wx = ball.x + Math.cos(angle) * ball.radius;
      wy = ball.y + Math.sin(angle) * ball.radius;
    } else {
      wx = ball.x + Math.cos(angle) * orbitRadius;
      wy = ball.y + Math.sin(angle) * orbitRadius;
    }
    
    ctx.save();
    ctx.translate(wx, wy);
    
    if (ball.weaponType === 'longsword') {
      ctx.rotate(angle + Math.PI / 4 + Math.PI);
    } else if (ball.weaponType === 'gun') {
      ctx.rotate(angle + Math.PI);
      ctx.scale(-1, 1);
    }
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getWeaponEmoji(ball.weaponType), 0, 0);
    ctx.restore();
  }
}

function drawProjectiles() {
  ctx.save();
  for (const p of state.projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Yellow bullet
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fcd34d';
    ctx.fill();
  }
  ctx.restore();
}

function drawAimLines() {
  if (state.running || Object.keys(state.aims).length === 0) return;
  
  ctx.save();
  for (const [ballId, aim] of Object.entries(state.aims)) {
    const ball = state.balls.find(b => b.id === ballId);
    if (!ball) continue;

    const color = getBallPalette(ballId).aimColor;

    const aimLen = Math.min(aim.speed * 15, 100);
    const endX = ball.x + aim.dx * aimLen;
    const endY = ball.y + aim.dy * aimLen;

    // Aim arrow line
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Arrowhead
    const headLen = 10;
    const angle = Math.atan2(endY - ball.y, endX - ball.x);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLen * Math.cos(angle - 0.4), endY - headLen * Math.sin(angle - 0.4));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLen * Math.cos(angle + 0.4), endY - headLen * Math.sin(angle + 0.4));
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrail(ball) {
  if (!ball.trail || ball.trail.length < 2) return;
  
  const baseColor = getBallPalette(ball.id).trailRgb;
  
  ctx.save();
  ctx.lineCap = 'round';
  
  for (let i = 1; i < ball.trail.length; i++) {
    const prev = ball.trail[i - 1];
    const curr = ball.trail[i];
    const alpha = 1 - (i / ball.trail.length);
    const trailWidth = ball.radius * 2 * (1 - i / ball.trail.length) * 0.6;
    
    if (trailWidth < 0.5) continue;
    
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.3})`;
    ctx.lineWidth = trailWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawStatusIndicators(ball) {
  if (!ball.statusEffects || ball.statusEffects.length === 0) return;
  
  ctx.save();
  
  for (const effect of ball.statusEffects) {
    switch (effect.type) {
      case 'freeze':
        // Ice ring around ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
        
      case 'burn':
        // Fire glow
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'poison':
        // Poison drip effect
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'shield':
        // Shield hexagon glow
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#64c8ff';
        ctx.stroke();
        ctx.shadowBlur = 0;
        break;
        
      case 'berserk':
        // Red rage aura
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff0000';
        ctx.stroke();
        ctx.shadowBlur = 0;
        break;
        
      case 'ghost':
        // Make the ball semi-transparent (handled via globalAlpha adjustment)
        // The actual ball drawing will pick this up
        break;
    }
  }
  
  ctx.restore();
}

function renderActiveZones(ctx, timestamp) {
  if (!state.activeZones) return;
  
  ctx.save();
  for (const zone of state.activeZones) {
    const age = timestamp - zone.startTime;
    const lifeRatio = age / zone.duration;
    const fadeAlpha = lifeRatio > 0.7 ? (1 - lifeRatio) * 3.33 : 1;
    
    if (zone.type === 'freeze') {
      const pulse = Math.sin(timestamp * 0.005) * 0.1 + 0.9;
      
      // Frost circle
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 200, 255, ${0.12 * fadeAlpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(150, 220, 255, ${0.5 * fadeAlpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Inner frost pattern
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius * 0.5 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 240, 255, ${0.3 * fadeAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}
