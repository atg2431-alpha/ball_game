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
import { resetWeapons } from '../physics/weapons.js';

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

  state.animationId = requestAnimationFrame(gameLoop);
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

  // Clear any active weapons
  resetWeapons();

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

  if (elements.weaponBtns) {
    elements.weaponBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        elements.weaponBtns.forEach(b => b.classList.remove('btn-weapon--active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('btn-weapon--active');
        state.selectedWeapon = targetBtn.dataset.weapon;
      });
    });
  }
}

/**
 * Handle game over state, showing the victory overlay.
 */
export function handleGameOver(winner, elements) {
  state.running = false;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  // Find elements globally since we might not have passed them directly
  // or we can just fetch them from the DOM
  const overlay = document.getElementById('game-over-screen');
  const text = document.getElementById('winner-text');
  const playAgain = document.getElementById('play-again-btn');

  text.textContent = `${winner.name || 'Player'} Wins!`;
  overlay.classList.add('is-visible');

  // Play again handler
  const resetHandler = () => {
    overlay.classList.remove('is-visible');
    playAgain.removeEventListener('click', resetHandler);
    
    // We need the original elements to pass to stopGame. 
    // It's cleaner to dispatch a custom event or just reload the page.
    // For now, we'll manually reset using global query:
    const mainEls = {
      ball1El: document.getElementById('ball-1'),
      ball2El: document.getElementById('ball-2'),
      startBtn: document.getElementById('start-btn'),
      boardInner: document.querySelector('.board__inner'),
      ball1HpDisplay: document.getElementById('ball-1-hp'),
      ball2HpDisplay: document.getElementById('ball-2-hp'),
    };
    
    // Reset HP displays
    mainEls.ball1HpDisplay.value = CONFIG.ball1.hp;
    mainEls.ball2HpDisplay.value = CONFIG.ball2.hp;

    stopGame(mainEls);
  };

  playAgain.addEventListener('click', resetHandler);
}

/**
 * Bind customizable settings inputs
 */
export function initSettings(elements) {
  // Weapon parameters
  if (elements.settingSpawn) {
    elements.settingSpawn.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      e.target.value = val;
      CONFIG.weapons.spawnInterval = val * 1000;
    });
  }

  if (elements.settingDuration) {
    elements.settingDuration.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      e.target.value = val;
      CONFIG.weapons.duration = val * 1000;
    });
  }

  // HP parameters
  const updateHP = (inputEl, playerConfig, playerIndex) => {
    let val = parseInt(inputEl.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    inputEl.value = val;
    playerConfig.hp = val;
    
    // If game is running, update live HP
    if (state.running && state.balls[playerIndex]) {
      state.balls[playerIndex].hp = val;
      
      // If live HP goes to 0 due to manual edit, the loop will catch it and game over
    }
  };

  if (elements.ball1HpDisplay) {
    elements.ball1HpDisplay.addEventListener('change', (e) => {
      updateHP(e.target, CONFIG.ball1, 0);
    });
  }

  if (elements.ball2HpDisplay) {
    elements.ball2HpDisplay.addEventListener('change', (e) => {
      updateHP(e.target, CONFIG.ball2, 1);
    });
  }
}
