/**
 * Ball-Ball Collision
 *
 * Detects overlap between two circular balls and resolves
 * with a perfect elastic collision (equal mass).
 */

/**
 * Resolve an elastic collision between two equal-mass balls.
 * Swaps the normal component of velocity on impact and
 * pushes balls apart to prevent overlapping.
 *
 * @param {Object} b1 - First ball state object
 * @param {Object} b2 - Second ball state object
 */
export function resolveBallCollision(b1, b2) {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = b1.radius + b2.radius;

  if (dist < minDist && dist > 0) {
    // Collision normal (from b1 toward b2)
    const nx = dx / dist;
    const ny = dy / dist;

    // Relative velocity of b1 w.r.t. b2 along normal
    const dvx = b1.vx - b2.vx;
    const dvy = b1.vy - b2.vy;
    const dvn = dvx * nx + dvy * ny;

    // Only resolve if the balls are approaching
    if (dvn > 0) {
      b1.vx -= dvn * nx;
      b1.vy -= dvn * ny;
      b2.vx += dvn * nx;
      b2.vy += dvn * ny;
    }

    // Separate overlapping balls
    const overlap = minDist - dist;
    const sepX = (overlap / 2 + 0.5) * nx;
    const sepY = (overlap / 2 + 0.5) * ny;
    b1.x -= sepX;
    b1.y -= sepY;
    b2.x += sepX;
    b2.y += sepY;
  }
}
