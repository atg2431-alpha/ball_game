/**
 * Main Entry Point
 *
 * Wires together all modules and initializes the game.
 * This is the only file loaded by index.html.
 */

import { CONFIG } from './config.js';
import { applyBallImage } from './components/ball.js';
import { applyBoardImage } from './components/board.js';
import { initControls, initSidebar } from './controls/controls.js';
import { initDrag } from './input/drag.js';

/**
 * Gather all DOM references and boot the game.
 */
function init() {
  // Collect all DOM elements needed across modules
  const elements = {
    boardEl: document.getElementById('game-board'),
    boardInner: document.querySelector('#game-board .board__inner'),
    ball1El: document.getElementById('ball-1'),
    ball2El: document.getElementById('ball-2'),
    ball1HpDisplay: document.getElementById('ball-1-hp'),
    ball2HpDisplay: document.getElementById('ball-2-hp'),
    startBtn: document.getElementById('start-btn'),
    shapeBtns: document.querySelectorAll('.btn-shape'),
  };

  // Apply custom images if configured
  applyBoardImage(elements.boardEl, CONFIG.board.backgroundImage);
  applyBallImage(elements.ball1El, CONFIG.ball1.image);
  applyBallImage(elements.ball2El, CONFIG.ball2.image);

  // Wire up start/stop controls and sidebar
  initControls(elements);
  initSidebar(elements);

  // Initialize drag-to-aim input
  initDrag(elements);

  console.log('🎮 Ball Battle Simulator initialized');
}

document.addEventListener('DOMContentLoaded', init);
