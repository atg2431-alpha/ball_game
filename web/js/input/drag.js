/**
 * Drag-to-Aim Input System
 *
 * Lets players click-and-drag on a ball to set its launch direction.
 * Works like a slingshot: drag AWAY from the target direction,
 * and the ball launches in the opposite direction.
 *
 * Visual feedback:
 *  - Solid arrow: shows the launch direction (opposite of drag)
 *  - Dashed line:  shows the pull direction (ball → mouse)
 *
 * Drag distance controls launch speed (clamped to min/max).
 * Aims are stored in state.aims and read by the controls module
 * when the game starts.
 */

import { CONFIG } from '../config.js';
import { state } from '../state.js';

// ─── Module-level references ────────────────────────────────
let svgOverlay = null;
const aimLines = {};   // ballId → SVG <line> (launch direction)
const dragLines = {};  // ballId → SVG <line> (pull direction)
const ballEls = {};    // ballId → HTMLElement

// ─── Public API ─────────────────────────────────────────────

/**
 * Initialize the drag-to-aim system.
 * Creates the SVG overlay and wires up events on both balls.
 */
export function initDrag(elements) {
  const { boardInner, ball1El, ball2El } = elements;

  // SVG overlay sits on top of the board, but passes clicks through
  svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgOverlay.classList.add('aim-overlay');
  boardInner.appendChild(svgOverlay);

  // Arrowhead markers (one per player color)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  createArrowMarker(defs, 'arrow-blue', '#4a9eff');
  createArrowMarker(defs, 'arrow-red', '#ff4a6a');
  svgOverlay.appendChild(defs);

  // Setup each ball
  registerBall(ball1El, CONFIG.ball1.id, '#4a9eff', 'arrow-blue');
  registerBall(ball2El, CONFIG.ball2.id, '#ff4a6a', 'arrow-red');
}

/**
 * Hide all aim & drag lines (called when the game starts).
 */
export function hideAimLines() {
  for (const id in aimLines) {
    aimLines[id].style.display = 'none';
    dragLines[id].style.display = 'none';
  }
}

/**
 * Clear aim state and hide all visuals (called when the game stops).
 */
export function clearAims() {
  state.aims = {};
  hideAimLines();
}

/**
 * Toggle the draggable cursor on both balls.
 */
export function setDraggable(ball1El, ball2El, enabled) {
  const cursor = enabled ? 'grab' : 'default';
  ball1El.style.cursor = cursor;
  ball2El.style.cursor = cursor;
}

// ─── SVG Helpers ────────────────────────────────────────────

function createArrowMarker(defs, id, color) {
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', id);
  marker.setAttribute('markerWidth', '12');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '12');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 12 4, 0 8');
  polygon.setAttribute('fill', color);

  marker.appendChild(polygon);
  defs.appendChild(marker);
}

function createLine(color, opts = {}) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', opts.width || '2.5');
  line.setAttribute('stroke-linecap', 'round');
  if (opts.dash) line.setAttribute('stroke-dasharray', opts.dash);
  if (opts.opacity) line.setAttribute('stroke-opacity', opts.opacity);
  if (opts.marker) line.setAttribute('marker-end', `url(#${opts.marker})`);
  line.style.display = 'none';
  svgOverlay.appendChild(line);
  return line;
}

// ─── Ball Registration ──────────────────────────────────────

function registerBall(ballEl, ballId, color, markerId) {
  ballEls[ballId] = ballEl;

  // Launch-direction arrow (solid, with arrowhead)
  aimLines[ballId] = createLine(color, { marker: markerId });

  // Pull-direction indicator (dashed, dim)
  dragLines[ballId] = createLine(color, {
    width: '1.5',
    dash: '5,5',
    opacity: '0.3',
  });

  // Show grab cursor
  ballEl.style.cursor = 'grab';

  // Attach pointer events
  ballEl.addEventListener('mousedown', (e) => onPointerDown(e, ballEl, ballId));
  ballEl.addEventListener('touchstart', (e) => onPointerDown(e, ballEl, ballId), {
    passive: false,
  });
}

// ─── Drag Handlers ──────────────────────────────────────────

function onPointerDown(e, ballEl, ballId) {
  if (state.running) return; // can't aim while simulation is running

  e.preventDefault();
  e.stopPropagation();

  const boardRect = svgOverlay.getBoundingClientRect();
  const ballRect = ballEl.getBoundingClientRect();

  // Ball center relative to the SVG coordinate system
  state.dragging = {
    ballId,
    ballEl,
    centerX: ballRect.left + ballRect.width / 2 - boardRect.left,
    centerY: ballRect.top + ballRect.height / 2 - boardRect.top,
  };

  ballEl.style.cursor = 'grabbing';

  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);
}

function onPointerMove(e) {
  if (!state.dragging) return;
  e.preventDefault();

  const touch = e.touches ? e.touches[0] : e;
  const boardRect = svgOverlay.getBoundingClientRect();
  const mouseX = touch.clientX - boardRect.left;
  const mouseY = touch.clientY - boardRect.top;

  const { centerX, centerY, ballId } = state.dragging;

  // Drag vector (ball → mouse)
  const dragX = mouseX - centerX;
  const dragY = mouseY - centerY;
  const dragDist = Math.sqrt(dragX * dragX + dragY * dragY);

  if (dragDist < 10) {
    aimLines[ballId].style.display = 'none';
    dragLines[ballId].style.display = 'none';
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

  // Store aim direction + speed
  state.aims[ballId] = { dx: launchDx, dy: launchDy, speed };

  // ── Update aim arrow (launch direction) ──
  const aimLen = Math.min(dragDist * 0.7, CONFIG.aim.maxLineLength);
  setLineCoords(aimLines[ballId], centerX, centerY, centerX + launchDx * aimLen, centerY + launchDy * aimLen);
  aimLines[ballId].style.display = '';

  // ── Update drag line (pull direction) ──
  setLineCoords(dragLines[ballId], centerX, centerY, mouseX, mouseY);
  dragLines[ballId].style.display = '';
}

function onPointerUp() {
  if (!state.dragging) return;

  state.dragging.ballEl.style.cursor = 'grab';

  // Hide the pull line but keep the aim arrow visible
  dragLines[state.dragging.ballId].style.display = 'none';

  state.dragging = null;

  document.removeEventListener('mousemove', onPointerMove);
  document.removeEventListener('mouseup', onPointerUp);
  document.removeEventListener('touchmove', onPointerMove);
  document.removeEventListener('touchend', onPointerUp);
}

// ─── Utilities ──────────────────────────────────────────────

function setLineCoords(line, x1, y1, x2, y2) {
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
}
