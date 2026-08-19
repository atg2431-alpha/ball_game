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
import { createBall } from '../components/ball.js';
import { getBoardDimensions } from '../components/board.js';
import { hideAimLines, clearAims, setDraggable } from '../input/drag.js';
import { resetWeapons } from '../physics/weapons.js';
import { startRecording, stopRecording } from '../recording.js';
import { resetPowerups } from '../systems/powerup-registry.js';
import { resetShrinkZone, activateShrinkZone } from '../hazards/shrink-zone.js';
import { spawnBouncePad } from '../hazards/bounce-pad.js';
import { startTimer, stopTimer, resetTimer } from '../ui/match-timer.js';
import { resetHpBars } from '../ui/hp-bar.js';
import { resetCombo } from '../ui/combo-counter.js';
import { clearShockwaves } from '../effects/death-explosion.js';
import { resetFlash } from '../effects/powerup-flash.js';
import { events, EVENTS } from '../systems/event-bus.js';
import { setSoundEnabled, stopLoopingSound, playUIClick } from '../systems/sound-hooks.js';

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

export function resetGameState(elements) {
  const { boardInner, ball1HpDisplay, ball2HpDisplay } = elements;
  
  const rect = boardInner.getBoundingClientRect();
  state.boardWidth = rect.width;
  state.boardHeight = rect.height;

  // Initialize balls with default positions
  state.balls = [
    createBall(CONFIG.ball1, ball1HpDisplay, {x:0, y:0}),
    createBall(CONFIG.ball2, ball2HpDisplay, {x:0, y:0}),
  ];
  
  ball1HpDisplay.value = CONFIG.ball1.hp;
  ball2HpDisplay.value = CONFIG.ball2.hp;
}

/**
 * Start the simulation.
 */
async function startGame(elements) {
  const { startBtn, ball1HpDisplay, ball2HpDisplay } = elements;

  // Apply velocities from aim
  const vel1 = getVelocity(CONFIG.ball1.id);
  const vel2 = getVelocity(CONFIG.ball2.id);
  state.balls[0].vx = vel1.x;
  state.balls[0].vy = vel1.y;
  state.balls[1].vx = vel2.x;
  state.balls[1].vy = vel2.y;

  // Reset HP
  state.balls[0].hp = CONFIG.ball1.hp;
  state.balls[1].hp = CONFIG.ball2.hp;
  ball1HpDisplay.value = CONFIG.ball1.hp;
  ball2HpDisplay.value = CONFIG.ball2.hp;

  state.simulatedTime = undefined;
  state.lastRealTime = undefined;

  // Hide aim visuals and lock dragging
  hideAimLines();
  setDraggable(false);

  // Attempt recording if enabled
  if (state.recordingEnabled) {
    const wrapper = document.querySelector('.game-wrapper');
    const started = await startRecording(wrapper);
    if (!started) return;
  }

  state.running = true;

  // Phase 3: Start match timer and emit game start event
  startTimer();
  events.emit(EVENTS.GAME_START, {});

  // Phase 2: Activate hazards if enabled
  if (state.shrinkZoneEnabled) {
    activateShrinkZone();
  }
  if (state.bouncePadsEnabled) {
    for (let i = 0; i < CONFIG.hazardSpawns.bouncePadCount; i++) {
      spawnBouncePad();
    }
  }

  startBtn.textContent = '■';
  startBtn.classList.add('btn--active');
  startBtn.title = 'Stop Simulation';
}

/**
 * Stop the simulation and reset everything.
 */
function stopGame(elements) {
  const { startBtn } = elements;

  state.running = false;

  // Stop recording if active
  stopRecording(CONFIG.ball1.name, CONFIG.ball2.name);

  // Clear aims and re-enable dragging
  clearAims();
  setDraggable(true);

  // Clear any active weapons
  resetWeapons();
  resetPowerups();
  resetShrinkZone();
  state.hazards = [];
  state.powerupItems = [];
  state.activeZones = [];

  // Phase 3: Reset visual systems
  resetHpBars();
  resetCombo();
  resetTimer();
  clearShockwaves();
  resetFlash();
  stopLoopingSound('arena_shrink');
  stopTimer();

  resetGameState(elements);

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
  const { startBtn } = elements;

  resetGameState(elements);

  startBtn.addEventListener('click', () => {
    playUIClick();
    if (state.running) {
      stopGame(elements);
    } else {
      startGame(elements);
    }
  });
}

/**
 * Sidebar options (shape, weapons, tabs)
 */
export function initSidebar(elements) {
  // Sidebar Tabs Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playUIClick();
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      const targetId = `tab-${btn.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Settings Dropdown Toggle
  const settingToggles = document.querySelectorAll('.btn-settings-toggle');
  settingToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      playUIClick();
      const targetId = btn.dataset.target;
      const targetSettings = document.getElementById(targetId);
      if (targetSettings) {
        const isHidden = targetSettings.style.display === 'none';
        targetSettings.style.display = isHidden ? 'flex' : 'none';
        btn.classList.toggle('active', isHidden);
      }
    });
  });

  // Speed Controls
  const speedBtns = document.querySelectorAll('.btn-speed');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playUIClick();
      speedBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.gameSpeed = parseFloat(e.currentTarget.dataset.speed);
    });
  });

  // Recording Toggle
  const recordToggle = document.getElementById('record-toggle');
  if (recordToggle) {
    recordToggle.addEventListener('change', (e) => {
      playUIClick();
      state.recordingEnabled = e.target.checked;
    });
  }

  // Phase 2: Power-up Toggle
  const powerupToggle = document.getElementById('powerup-toggle');
  if (powerupToggle) {
    powerupToggle.addEventListener('change', (e) => {
      playUIClick();
      state.powerupsEnabled = e.target.checked;
    });
  }

  // Phase 2: Shrink Zone Toggle
  const shrinkToggle = document.getElementById('shrink-toggle');
  if (shrinkToggle) {
    shrinkToggle.addEventListener('change', (e) => {
      playUIClick();
      state.shrinkZoneEnabled = e.target.checked;
    });
  }

  // Phase 2: Gravity Wells Toggle
  const gravityToggle = document.getElementById('gravity-toggle');
  if (gravityToggle) {
    gravityToggle.addEventListener('change', (e) => {
      playUIClick();
      state.gravityWellsEnabled = e.target.checked;
    });
  }

  // Phase 2: Bounce Pads Toggle
  const bounceToggle = document.getElementById('bounce-toggle');
  if (bounceToggle) {
    bounceToggle.addEventListener('change', (e) => {
      playUIClick();
      state.bouncePadsEnabled = e.target.checked;
    });
  }

  // Phase 3: Sound Toggle
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      playUIClick();
      setSoundEnabled(e.target.checked);
    });
  }

  // Sidebar Tabs Navigation
  const tabBtnsList = document.querySelectorAll('.btn-tab');
  const tabContentsList = document.querySelectorAll('.tab-content');

  tabBtnsList.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all
      tabBtnsList.forEach(b => b.classList.remove('btn-tab--active'));
      tabContentsList.forEach(c => c.style.display = 'none');
      
      // Activate clicked
      btn.classList.add('btn-tab--active');
      const targetId = btn.dataset.target;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.style.display = 'block';
      }
    });
  });

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

  // Emit game over event for sound/UI hooks
  events.emit(EVENTS.GAME_OVER, { winner });

  // Stop recording with winner info (will show winner overlay for 3s before saving)
  stopRecording(CONFIG.ball1.name, CONFIG.ball2.name, winner);

  // Find elements globally since we might not have passed them directly
  // or we can just fetch them from the DOM
  const overlay = document.getElementById('game-over-screen');
  const text = document.getElementById('winner-text');
  const playAgain = document.getElementById('play-again-btn');

  text.textContent = `${winner.name || 'Player'} Wins!`;
  overlay.classList.add('is-visible');

  // Play again handler
  const resetHandler = () => {
    playUIClick();
    overlay.classList.remove('is-visible');
    playAgain.removeEventListener('click', resetHandler);
    
    // We need the original elements to pass to stopGame. 
    // It's cleaner to dispatch a custom event or just reload the page.
    // For now, we'll manually reset using global query:
    const mainEls = {
      startBtn: document.getElementById('start-btn'),
      boardInner: document.querySelector('.board__inner'),
      ball1HpDisplay: document.getElementById('ball-1-hp'),
      ball2HpDisplay: document.getElementById('ball-2-hp'),
    };
    
    stopGame(mainEls);
  };

  playAgain.addEventListener('click', resetHandler);
}

/**
 * Bind customizable settings inputs
 */
export function initSettings(elements) {
  // Weapon parameters
  const bindWeaponInput = (id, weaponConfig, key, multiplier = 1) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = 1;
        e.target.value = val;
        weaponConfig[key] = val * multiplier;
      });
    }
  };

  bindWeaponInput('sword-spawn', CONFIG.weapons.sword, 'spawnInterval', 1000);
  bindWeaponInput('sword-duration', CONFIG.weapons.sword, 'duration', 1000);
  bindWeaponInput('sword-count', CONFIG.weapons.sword, 'count', 1);
  
  bindWeaponInput('longsword-spawn', CONFIG.weapons.longsword, 'spawnInterval', 1000);
  bindWeaponInput('longsword-duration', CONFIG.weapons.longsword, 'duration', 1000);
  bindWeaponInput('longsword-count', CONFIG.weapons.longsword, 'count', 1);
  
  bindWeaponInput('gun-spawn', CONFIG.weapons.gun, 'spawnInterval', 1000);
  bindWeaponInput('gun-duration', CONFIG.weapons.gun, 'duration', 1000);
  bindWeaponInput('gun-fire-rate', CONFIG.weapons.gun, 'fireRate', 1000);
  bindWeaponInput('gun-bullet-life', CONFIG.weapons.gun, 'bulletLifetime', 1000);

  // HP parameters
  const updateHP = (inputEl, playerConfig, playerIndex) => {
    let val = parseInt(inputEl.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    inputEl.value = val;
    playerConfig.hp = val;
    
    // If game is running, update live HP
    if (state.running && state.balls[playerIndex]) {
      state.balls[playerIndex].hp = val;
      state.balls[playerIndex].hpDisplay.value = val;
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
