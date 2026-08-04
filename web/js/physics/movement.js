/**
 * Ball Movement & Wall Bouncing
 *
 * Moves a ball by its velocity and reflects off the board walls.
 * No gravity — constant speed, perfect elastic wall reflection.
 */

/**
 * Update ball position and bounce off walls.
 * @param {Object} ball  - Ball state object (x, y, vx, vy, radius)
 * @param {number} boardWidth  - Board width in pixels
 * @param {number} boardHeight - Board height in pixels
 * @param {string} boardShape  - 'rectangle' or 'circle'
 */
export function updateBall(ball, boardWidth, boardHeight, boardShape) {
  // Move
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (boardShape === 'circle') {
    const cx = boardWidth / 2;
    const cy = boardHeight / 2;
    // Assuming width and height are the same for a circle
    const boardRadius = boardWidth / 2;

    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist + ball.radius >= boardRadius && dist > 0) {
      // Push the ball back inside the circle bounds
      const overlap = (dist + ball.radius) - boardRadius;
      const nx = dx / dist; // normal x
      const ny = dy / dist; // normal y
      
      ball.x -= nx * overlap;
      ball.y -= ny * overlap;

      // Reflect the velocity vector
      const dotProduct = ball.vx * nx + ball.vy * ny;
      ball.vx = ball.vx - 2 * dotProduct * nx;
      ball.vy = ball.vy - 2 * dotProduct * ny;
    }
  } else {
    // Left wall
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
    }
    // Right wall
    if (ball.x + ball.radius >= boardWidth) {
      ball.x = boardWidth - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }
    // Top wall
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
    // Bottom wall
    if (ball.y + ball.radius >= boardHeight) {
      ball.y = boardHeight - ball.radius;
      ball.vy = -Math.abs(ball.vy);
    }
  }
}
