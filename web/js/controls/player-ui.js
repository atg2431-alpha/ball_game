/**
 * Player UI
 *
 * Handles the "Player" accordion inside the Customise panel:
 *  - Name inputs → live-updates the player label above the board and CONFIG.ballN.name
 *  - Colour buttons → live-updates state.playerColors so the renderer re-draws the ball
 *
 * Also handles the accordion open/close for both "Board" and "Player" rows.
 */

import { state } from '../state.js';
import { CONFIG } from '../config.js';

export function initPlayerUI() {
  initAccordion('board-accordion-btn', 'board-accordion-body');
  initAccordion('player-accordion-btn', 'player-accordion-body');
  initNameInputs();
  initColourSelectors();
}

// ── Accordion ────────────────────────────────────────────────

function initAccordion(btnId, bodyId) {
  const btn  = document.getElementById(btnId);
  const body = document.getElementById(bodyId);
  if (!btn || !body) return;

  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    body.classList.toggle('open', isOpen);
  });
}

// ── Name Inputs ──────────────────────────────────────────────

function initNameInputs() {
  bindName('player1-name', 'player1-label-name', 'ball-1', CONFIG.ball1);
  bindName('player2-name', 'player2-label-name', 'ball-2', CONFIG.ball2);
}

function bindName(inputId, labelId, ballId, ballConfig) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!input || !label) return;

  // Restore previously set name
  const saved = state.playerNames?.[ballId];
  if (saved && saved !== ballConfig.name) {
    input.value = saved;
    label.textContent = saved;
    ballConfig.name = saved;
  }

  input.addEventListener('input', () => {
    const name = input.value.trim() || input.placeholder;
    label.textContent = name;
    ballConfig.name = name;
    if (state.playerNames) state.playerNames[ballId] = name;

    // Also update any running ball's name
    const ball = state.balls.find(b => b.id === ballId);
    if (ball) ball.name = name;
  });
}

// ── Colour Selectors ─────────────────────────────────────────

function initColourSelectors() {
  const btns = document.querySelectorAll('.colour-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const playerNum = btn.dataset.player; // '1' or '2'
      const colour    = btn.dataset.colour; // 'blue' | 'red' | 'green'
      const ballId    = playerNum === '1' ? 'ball-1' : 'ball-2';

      // Update active state within this player's selector
      const selector = document.getElementById(`player${playerNum}-colour`);
      if (selector) {
        selector.querySelectorAll('.colour-btn').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');

      // Update state → renderer picks it up next frame automatically
      if (state.playerColors) {
        state.playerColors[ballId] = colour;
      }
    });
  });
  
  initExtendedColorPicker();
}

// ── Extended Color Picker ──────────────────────────────────────

import { EXTENDED_COLORS } from './extended-colors.js';

function initExtendedColorPicker() {
  const popover = document.getElementById('extended-color-picker');
  const grid = document.getElementById('extended-color-grid');
  const selectBtn = document.getElementById('extended-color-select-btn');
  const triggers = document.querySelectorAll('.colour-picker-trigger');
  
  if (!popover || !grid || !selectBtn) return;
  
  let activePlayerBtn = null;
  let selectedExtendedColor = null;
  let activePlayerNum = null;

  // Build grid
  EXTENDED_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'extended-color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.colour = color;
    
    swatch.addEventListener('click', () => {
      // Remove active class from all
      grid.querySelectorAll('.extended-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      selectedExtendedColor = color;
    });
    
    grid.appendChild(swatch);
  });
  
  // Handle Trigger clicks
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent document click from closing it immediately
      
      const playerNum = trigger.dataset.player;
      activePlayerNum = playerNum;
      activePlayerBtn = trigger;
      
      // Position the popover
      const rect = trigger.getBoundingClientRect();
      
      // Place it to the right of the trigger
      popover.style.display = 'block';
      popover.style.top = `${rect.top - popover.offsetHeight / 2 + rect.height / 2 + window.scrollY}px`;
      popover.style.left = `${rect.right + 10}px`;
      
      // Reset selection
      selectedExtendedColor = null;
      grid.querySelectorAll('.extended-color-swatch').forEach(s => s.classList.remove('active'));
    });
  });
  
  // Handle Select Button
  selectBtn.addEventListener('click', () => {
    if (selectedExtendedColor && activePlayerNum) {
      const ballId = activePlayerNum === '1' ? 'ball-1' : 'ball-2';
      
      // Update state
      if (state.playerColors) {
        state.playerColors[ballId] = selectedExtendedColor;
      }
      
      // Update the main UI for that player
      const selector = document.getElementById(`player${activePlayerNum}-colour`);
      if (selector) {
        // Clear active classes
        selector.querySelectorAll('.colour-btn').forEach(b => b.classList.remove('active'));
        
        // See if there's already a custom button
        let customBtn = selector.querySelector('.colour-btn--custom');
        if (!customBtn) {
          customBtn = document.createElement('button');
          customBtn.className = 'colour-btn colour-btn--custom';
          customBtn.dataset.player = activePlayerNum;
          // Insert before the trigger
          selector.insertBefore(customBtn, selector.querySelector('.colour-picker-trigger'));
          
          // Re-attach standard click handler for the new button
          customBtn.addEventListener('click', () => {
             selector.querySelectorAll('.colour-btn').forEach(b => b.classList.remove('active'));
             customBtn.classList.add('active');
             if (state.playerColors) state.playerColors[ballId] = customBtn.dataset.colour;
          });
        }
        
        customBtn.dataset.colour = selectedExtendedColor;
        customBtn.style.backgroundColor = selectedExtendedColor;
        customBtn.title = selectedExtendedColor;
        customBtn.classList.add('active');
      }
    }
    
    // Close popover
    popover.style.display = 'none';
  });
  
  // Close popover if clicked outside
  document.addEventListener('click', (e) => {
    if (popover.style.display === 'block' && !popover.contains(e.target)) {
      popover.style.display = 'none';
    }
  });
}
