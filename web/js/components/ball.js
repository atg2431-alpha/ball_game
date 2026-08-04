/**
 * Ball Component
 *
 * Handles ball creation, rendering, and image application.
 */

import { state } from '../state.js';

/**
 * Create a ball state object.
 * Converts percentage-based position to pixel coordinates.
 *
 * @param {Object}      config   - Ball config (startPosition, hp, etc.)
 * @param {HTMLElement}  el       - Ball DOM element
 * @param {HTMLElement}  hpDisplay - HP display element in the stats bar
 * @param {{ x: number, y: number }} velocity - Initial velocity (px/frame)
 */
export function createBall(config, el, hpDisplay, velocity) {
  const ballRect = el.getBoundingClientRect();
  const radius = ballRect.width / 2;
  const innerHpEl = el.querySelector('.ball__hp');

  return {
    id: config.id,
    name: config.name,
    el,
    hpDisplay,
    innerHpEl,
    radius,
    x: (config.startPosition.x / 100) * state.boardWidth,
    y: (config.startPosition.y / 100) * state.boardHeight,
    vx: velocity.x,
    vy: velocity.y,
    hp: config.hp,
  };
}

/**
 * Update a ball's DOM position to match its physics state.
 */
export function renderBall(ball) {
  ball.el.style.left = `${ball.x}px`;
  ball.el.style.top = `${ball.y}px`;
}

/**
 * Apply a custom image to a ball element.
 * Replaces the CSS gradient background.
 */
export function applyBallImage(ballEl, imageSrc) {
  if (!imageSrc) return;
  ballEl.style.background = `url('${imageSrc}') center/cover no-repeat`;
}
