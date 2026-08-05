/**
 * Drag-to-Aim Input System
 *
 * Lets players click-and-drag on a ball on the canvas to set its launch direction.
 * Aims are stored in state.aims and read by the controls module.
 */

import { CONFIG } from '../config.js';
import { state } from '../state.js';

let canvasEl = null;

export function initDrag(canvas) {
  canvasEl = canvas;
  
  // Attach pointer events to the canvas
  canvasEl.addEventListener('mousedown', onPointerDown);
  canvasEl.addEventListener('touchstart', onPointerDown, { passive: false });
}

export function hideAimLines() {
  // Renderer handles this when state.aims is empty or dragging is false
}

export function clearAims() {
  state.aims = {};
}

export function setDraggable(enabled) {
  if (canvasEl) {
    canvasEl.style.cursor = enabled ? 'default' : 'default'; 
  }
}

function getMousePos(e) {
  const rect = canvasEl.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  
  // Since we scaled the canvas width/height by DPR, we need to map client coordinates
  // straight 1:1, but then apply the DPR scaling because the internal coordinate system of the 
  // game logic (state.balls) is based on logical pixels, not physical pixels!
  // Wait, in renderer.js we do `ctx.scale(dpr, dpr)`. 
  // This means all drawing uses logical CSS pixels. 
  // So we just need to return mouse coordinates in logical CSS pixels relative to the canvas!
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

function onPointerDown(e) {
  if (state.running) return;

  e.preventDefault();
  
  const pos = getMousePos(e);

  // Check if clicked inside a ball
  for (const ball of state.balls) {
    const dx = pos.x - ball.x;
    const dy = pos.y - ball.y;
    if (Math.sqrt(dx * dx + dy * dy) <= ball.radius) {
      // Hit!
      state.dragging = {
        ballId: ball.id,
        centerX: ball.x,
        centerY: ball.y,
      };
      
      canvasEl.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
      break;
    }
  }
}

function onPointerMove(e) {
  if (!state.dragging) return;
  e.preventDefault();

  const pos = getMousePos(e);
  const { centerX, centerY, ballId } = state.dragging;

  const dragX = pos.x - centerX;
  const dragY = pos.y - centerY;
  const dragDist = Math.sqrt(dragX * dragX + dragY * dragY);

  if (dragDist < 10) {
    delete state.aims[ballId];
    return;
  }

  // Launch direction = OPPOSITE of drag (slingshot)
  const launchDx = -dragX / dragDist;
  const launchDy = -dragY / dragDist;

  // Speed proportional to drag distance, clamped
  const speed = Math.min(
    Math.max(dragDist * CONFIG.aim.sensitivity, CONFIG.aim.minSpeed),
    CONFIG.aim.maxSpeed,
  );

  state.aims[ballId] = { dx: launchDx, dy: launchDy, speed };
}

function onPointerUp() {
  if (!state.dragging) return;

  canvasEl.style.cursor = 'default';
  
  state.dragging = null;

  document.removeEventListener('mousemove', onPointerMove);
  document.removeEventListener('mouseup', onPointerUp);
  document.removeEventListener('touchmove', onPointerMove);
  document.removeEventListener('touchend', onPointerUp);
}
