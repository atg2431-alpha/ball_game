/**
 * Main Entry Point
 *
 * Wires together all modules and initializes the game.
 * This is the only file loaded by index.html.
 */

import { CONFIG } from './config.js';
import { applyBoardImage } from './components/board.js';
import { initControls, initSidebar, initSettings } from './controls/controls.js';
import { initDrag } from './input/drag.js';
import { initRenderer, renderFrame } from './engine/renderer.js';
import { gameLoop } from './engine/game-loop.js';
import { state } from './state.js';

function init() {
  const elements = {
    boardEl: document.getElementById('game-board'),
    boardInner: document.querySelector('#game-board .board__inner'),
    ball1HpDisplay: document.getElementById('ball-1-hp'),
    ball2HpDisplay: document.getElementById('ball-2-hp'),
    startBtn: document.getElementById('start-btn'),
    shapeBtns: document.querySelectorAll('.btn-shape'),
    weaponBtns: document.querySelectorAll('.btn-weapon'),
    settingSpawn: document.getElementById('setting-spawn'),
    settingDuration: document.getElementById('setting-duration'),
    themeToggleBtn: document.getElementById('theme-toggle'),
    gameCanvas: document.getElementById('game-canvas')
  };

  // Theme Logic
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    elements.themeToggleBtn.textContent = '🌙';
  }

  elements.themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    
    if (isLight) {
      localStorage.setItem('theme', 'light');
      elements.themeToggleBtn.textContent = '🌙';
    } else {
      localStorage.setItem('theme', 'dark');
      elements.themeToggleBtn.textContent = '☀️';
    }
  });

  applyBoardImage(elements.boardEl, CONFIG.board.backgroundImage);

  // Initialize Canvas Renderer
  initRenderer('game-canvas');

  // Initialize Modules
  initControls(elements);
  initSidebar(elements);
  initSettings(elements);
  initDrag(elements.gameCanvas);

  // Master Game Loop
  function masterLoop(timestamp) {
    if (state.running) {
      gameLoop(timestamp);
    }
    renderFrame();
    requestAnimationFrame(masterLoop);
  }
  requestAnimationFrame(masterLoop);

  console.log('🎮 Ball Battle Simulator initialized (Canvas Mode)');
}

document.addEventListener('DOMContentLoaded', init);
