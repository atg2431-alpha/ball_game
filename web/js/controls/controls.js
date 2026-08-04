/**
 * Game Controls
 *
 * Manages the Start/Stop button and game lifecycle.
 * Reads aim directions set by the drag system to determine
 * initial ball velocities. Falls back to CONFIG defaults
 * if a ball wasn't aimed.
 */

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { createBall, renderBall } from '../components/ball.js';
import { getBoardDimensions } from '../components/board.js';
import { gameLoop } from '../engine/game-loop.js';
import { hideAimLines, clearAims, setDraggable } from '../input/drag.js';

// ─── Velocity Helpers ───────────────────────────────────────

/**
 * Get the launch velocity for a ball.
 * Uses the player's drag-aim if set, otherwise falls back to the
 * default direction from CONFIG.
 */
function getVelocity(ballId) {
  const aim = state.aims[ballId];
  if (aim) {
    return { x: aim.dx * aim.speed, y: aim.dy * aim.speed };
  }
  return {
    x: CONFIG.physics.initialDirection.x * CONFIG.physics.speed,
    y: CONFIG.physics.initialDirection.y * CONFIG.physics.speed,
  };
}

// ─── Start / Stop ───────────────────────────────────────────

/**
 * Start the simulation.
 * Measures the board, computes velocities from aim, creates balls,
 * and kicks off the game loop.
 */
function startGame(elements) {
  const { boardInner, ball1El, ball2El, ball1HpDisplay, ball2HpDisplay, startBtn } = elements;

  // Measure the board
  const dims = getBoardDimensions(boardInner);
  state.boardWidth = dims.width;
  state.boardHeight = dims.height;

  // Compute velocities (from aim or defaults)
  const vel1 = getVelocity(CONFIG.ball1.id);
  const vel2 = getVelocity(CONFIG.ball2.id);

  // Create ball state objects
  state.balls = [
    createBall(CONFIG.ball1, ball1El, ball1HpDisplay, vel1),
    createBall(CONFIG.ball2, ball2El, ball2HpDisplay, vel2),
  ];

  // Render initial pixel positions
  for (const ball of state.balls) {
    renderBall(ball);
  }

  // Hide aim visuals and lock dragging
  hideAimLines();
  setDraggable(ball1El, ball2El, false);

  state.running = true;
  startBtn.textContent = '■';
  startBtn.classList.add('btn--active');
  startBtn.title = 'Stop Simulation';

  gameLoop();
}

/**
 * Stop the simulation and reset everything.
 */
function stopGame(elements) {
  const { ball1El, ball2El, startBtn } = elements;

  state.running = false;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  // Reset to CSS percentage-based positions
  ball1El.style.left = `${CONFIG.ball1.startPosition.x}%`;
  ball1El.style.top = `${CONFIG.ball1.startPosition.y}%`;
  ball2El.style.left = `${CONFIG.ball2.startPosition.x}%`;
  ball2El.style.top = `${CONFIG.ball2.startPosition.y}%`;

  // Clear aims and re-enable dragging
  clearAims();
  setDraggable(ball1El, ball2El, true);

  state.balls = [];
  startBtn.textContent = '▶';
  startBtn.classList.remove('btn--active');
  startBtn.title = 'Start Simulation';
}

// ─── Initialization ─────────────────────────────────────────

/**
 * Bind the start/stop button to game lifecycle.
 * @param {Object} elements - DOM element references
 */
export function initControls(elements) {
  elements.startBtn.addEventListener('click', () => {
    if (state.running) {
      stopGame(elements);
    } else {
      startGame(elements);
    }
  });
}

/**
 * Bind the sidebar shape selection buttons.
 */
export function initSidebar(elements) {
  elements.shapeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Stop the game if running
      if (state.running) {
        stopGame(elements);
      }

      // Update active button state
      elements.shapeBtns.forEach(b => b.classList.remove('btn-shape--active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('btn-shape--active');

      // Update state
      const shape = targetBtn.dataset.shape;
      state.boardShape = shape;

      // Update DOM
      if (shape === 'circle') {
        elements.boardEl.classList.add('board--circle');
      } else {
        elements.boardEl.classList.remove('board--circle');
      }

      // Re-measure board dimensions since the aspect ratio may have changed
      const dims = getBoardDimensions(elements.boardInner);
      state.boardWidth = dims.width;
      state.boardHeight = dims.height;
    });
  });
}
