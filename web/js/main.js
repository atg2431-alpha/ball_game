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
import { initRenderer, renderFrame, handleResize } from './engine/renderer.js';
import { gameLoop } from './engine/game-loop.js';
import { state } from './state.js';
import { events, EVENTS } from './systems/event-bus.js';
import { particleSystem, PARTICLE_PRESETS } from './systems/particle.js';
import { camera } from './systems/camera.js';
import { statusEffects } from './systems/status-effects.js';
import { assets, ASSET_MANIFEST } from './systems/asset-loader.js';
import { spawnDamageNumber } from './ui/damage-numbers.js';
import { showBanner } from './ui/event-banner.js';
import { resetPowerups } from './systems/powerup-registry.js';
// Import all power-up modules to trigger self-registration
import './powerups/split.js';
import './powerups/magnet.js';
import './powerups/laser.js';
import './powerups/freeze-zone.js';
import './powerups/berserk.js';
import './powerups/heal.js';
import './powerups/ghost.js';
import './powerups/mega-growth.js';
// Phase 3: Effects & UI
import { initCollisionSparks } from './effects/collision-sparks.js';
import { initDeathExplosion } from './effects/death-explosion.js';
import { initPowerupFlash } from './effects/powerup-flash.js';
import { initSoundHooks, setSoundEnabled } from './systems/sound-hooks.js';
import { registerHit } from './ui/combo-counter.js';
import { startTimer, stopTimer, resetTimer } from './ui/match-timer.js';
import { resetHpBars } from './ui/hp-bar.js';
import { resetCombo } from './ui/combo-counter.js';
import { clearShockwaves } from './effects/death-explosion.js';
import { resetFlash } from './effects/powerup-flash.js';

/**
 * Wire up event bus listeners for visual feedback.
 * Connects game events to particle effects, camera shake, etc.
 */
function setupEventListeners() {
  // Combo counter: track hits
  events.on(EVENTS.DAMAGE_DEALT, (data) => {
    registerHit(performance.now());
  });
  events.on(EVENTS.PROJECTILE_HIT, (data) => {
    registerHit(performance.now());
  });

  // Match timer: start on game start, stop on game over
  events.on(EVENTS.GAME_START, () => {
    startTimer();
  });
  events.on(EVENTS.GAME_OVER, () => {
    stopTimer();
  });

  // Damage dealt → hit particles
  events.on(EVENTS.DAMAGE_DEALT, (data) => {
    const { target, amount } = data;
    // Handled in UI layer now
    particleSystem.emit(target.x, target.y, PARTICLE_PRESETS.WEAPON_HIT, Math.min(amount, 8));
  });

  // Damage dealt → floating damage number
  events.on(EVENTS.DAMAGE_DEALT, (data) => {
    const { target, amount } = data;
    spawnDamageNumber(target.x, target.y - target.radius, amount);
  });

  // Projectile hit → damage number
  events.on(EVENTS.PROJECTILE_HIT, (data) => {
    const { target, damage } = data;
    spawnDamageNumber(target.x, target.y - target.radius, damage, '#ffaa00');
  });

  // Ball killed → "ELIMINATED" banner
  events.on(EVENTS.BALL_KILLED, (data) => {
    const { killer, victim } = data;
    showBanner(`💀 ${victim.name} ELIMINATED`, '#ff4444', 2000);
  });

  // Power-up pickup → banner
  events.on(EVENTS.POWERUP_PICKUP, (data) => {
    const { ball, powerupType } = data;
    const name = powerupType.replace(/_/g, ' ').toUpperCase();
    showBanner(`⚡ ${ball.name}: ${name}`, '#00ffaa', 1200);
  });

  // Hazard trigger → particles
  events.on(EVENTS.HAZARD_TRIGGER, (data) => {
    const { x, y } = data;
    particleSystem.emit(x, y, PARTICLE_PRESETS.WEAPON_HIT, 5);
  });
}

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

  // Initialize Phase 1 systems
  setupEventListeners();
  
  // Initialize Phase 3 effect systems
  initCollisionSparks();
  initDeathExplosion();
  initPowerupFlash();
  initSoundHooks();
  
  // Add window resize handler
  window.addEventListener('resize', () => {
    handleResize();
  });

  // Preload assets (non-blocking)
  if (ASSET_MANIFEST.length > 0) {
    assets.loadAll(ASSET_MANIFEST).then(() => {
      console.log('📦 Assets preloaded');
    });
  }

  // Master Game Loop
  function masterLoop(timestamp) {
    if (state.running) {
      gameLoop(timestamp);
    }
    renderFrame();
    requestAnimationFrame(masterLoop);
  }
  requestAnimationFrame(masterLoop);

  console.log('🎮 Ball Battle Simulator initialized (Phase 3: Full Polish)');
}

document.addEventListener('DOMContentLoaded', init);
