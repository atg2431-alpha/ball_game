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
}
