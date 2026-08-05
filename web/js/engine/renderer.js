/**
 * Canvas Rendering Engine
 * 
 * Replaces DOM-based rendering with HTML5 Canvas drawing for perfect performance.
 */
import { state } from '../state.js';
import { CONFIG } from '../config.js';

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

/**
 * Main render function called every frame.
 */
export function renderFrame() {
  if (!ctx) return;

  // Clear frame
  ctx.clearRect(0, 0, width, height);

  // Draw Aim Lines (pre-game)
  drawAimLines();

  // Draw Weapons (Spawned items on ground)
  drawGroundWeapons();

  // Draw Projectiles
  drawProjectiles();

  // Draw Balls + Orbiting Weapons
  for (const ball of state.balls) {
    drawBall(ball);
    drawOrbitingWeapon(ball);
  }
}

function drawBall(ball) {
  const isBlue = ball.id === 'ball-1';
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  
  // Glowing effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = isBlue ? '#93c5fd' : '#fca5a5';

  // Gradient fill
  const gradient = ctx.createRadialGradient(
    ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
    ball.x, ball.y, ball.radius
  );
  
  if (isBlue) {
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#3b82f6');
  } else {
    gradient.addColorStop(0, '#f87171');
    gradient.addColorStop(1, '#ef4444');
  }
  
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
  
  const angle = ball.weaponAngle;
  const orbitRadius = CONFIG.weapons.orbitRadius;
  
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
    ctx.scale(1, -1);
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

    const isBlue = ballId === 'ball-1';
    const color = isBlue ? '#4a9eff' : '#ff4a6a';

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

