/**
 * Ball Component
 *
 * Handles ball state creation. Rendering is now done by renderer.js.
 */

import { state } from '../state.js';

/**
 * Create a ball state object.
 * Converts percentage-based position to pixel coordinates.
 *
 * @param {Object}      config   - Ball config (startPosition, hp, etc.)
 * @param {HTMLElement}  hpDisplay - HP display element in the stats bar
 * @param {{ x: number, y: number }} velocity - Initial velocity (px/frame)
 */
export function createBall(config, hpDisplay, velocity) {
  // Hardcoded radius for now since we don't have DOM elements to measure
  const radius = 29; // Matches the CSS 58px / 2

  return {
    id: config.id,
    name: config.name,
    hpDisplay,
    radius,
    x: (config.startPosition.x / 100) * state.boardWidth,
    y: (config.startPosition.y / 100) * state.boardHeight,
    vx: velocity.x,
    vy: velocity.y,
    hp: config.hp,
  };
}
