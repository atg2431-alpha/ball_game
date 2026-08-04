/**
 * Board Component
 *
 * Handles board setup, dimensions, and background image.
 */

/**
 * Apply a custom background image to the board element.
 */
export function applyBoardImage(boardEl, imageSrc) {
  if (!imageSrc) return;
  boardEl.style.backgroundImage = `url('${imageSrc}')`;
}

/**
 * Get the board's inner playable dimensions in pixels.
 */
export function getBoardDimensions(boardInner) {
  const rect = boardInner.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}
