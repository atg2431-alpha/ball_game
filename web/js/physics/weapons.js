import { CONFIG } from '../config.js';
import { state } from '../state.js';

let weaponIdCounter = 0;

/**
 * Handles spawning new weapon items on the board.
 * @param {number} timestamp - Current game time in ms
 */
export function spawnWeapon(timestamp) {
  if (timestamp - state.lastSpawnTime > CONFIG.weapons.spawnInterval) {
    state.lastSpawnTime = timestamp;

    const container = document.getElementById('weapon-container');
    if (!container) return;

    // Keep it slightly away from edges
    const padding = 20;
    const x = padding + Math.random() * (state.boardWidth - padding * 2);
    const y = padding + Math.random() * (state.boardHeight - padding * 2);

    const type = state.selectedWeapon;
    const el = document.createElement('div');
    el.className = type === 'longsword' ? 'item-longsword' : 'item-sword';
    el.textContent = type === 'longsword' ? '🗡️' : '⚔️';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    container.appendChild(el);

    state.spawnedItems.push({
      id: `weapon-${weaponIdCounter++}`,
      x,
      y,
      radius: 12, // Hitbox for pickup
      type,
      el,
    });
  }
}

/**
 * Updates weapon logic: pickup, orbit, and combat.
 * @param {number} timestamp - Current game time in ms
 */
export function updateWeapons(timestamp) {
  // 1. Check for item pickup
  for (let i = state.spawnedItems.length - 1; i >= 0; i--) {
    const item = state.spawnedItems[i];
    let absorbed = false;

    for (const ball of state.balls) {
      const dx = ball.x - item.x;
      const dy = ball.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius + item.radius) {
        // Absorb!
        if (ball.weaponExpiry && ball.weaponExpiry > timestamp) {
          ball.weaponExpiry += CONFIG.weapons.duration;
        } else {
          ball.weaponExpiry = timestamp + CONFIG.weapons.duration;
          
          // Create orbiting element
          const orbitEl = document.createElement('div');
          orbitEl.className = item.type === 'longsword' ? 'orbit-longsword' : 'orbit-sword';
          orbitEl.textContent = item.type === 'longsword' ? '🗡️' : '⚔️';
          document.getElementById('weapon-container').appendChild(orbitEl);
          ball.orbitEl = orbitEl;
          ball.weaponType = item.type;
        }
        
        // Remove item from board
        item.el.remove();
        state.spawnedItems.splice(i, 1);
        absorbed = true;
        break;
      }
    }
  }

  // 2. Handle orbits and combat
  for (let i = 0; i < state.balls.length; i++) {
    const ball = state.balls[i];
    const enemy = state.balls[1 - i]; // The other ball (assumes 2 balls)

    if (ball.weaponExpiry && ball.weaponExpiry > timestamp) {
      // Calculate orbit position
      const angle = timestamp * CONFIG.weapons.orbitSpeed;
      const swordX = ball.x + Math.cos(angle) * CONFIG.weapons.orbitRadius;
      const swordY = ball.y + Math.sin(angle) * CONFIG.weapons.orbitRadius;

      // Render orbit
      if (ball.orbitEl) {
        if (ball.weaponType === 'longsword') {
          // Long sword sticks out radially from the edge
          // The emoji 🗡️ naturally points down-left. We want it to point outward (angle).
          // We add Math.PI / 4 (45 degrees) to make it point up-right relative to container,
          // but CSS rotation starts from top. Let's just use CSS transform and rotate(angle).
          const edgeX = ball.x + Math.cos(angle) * ball.radius;
          const edgeY = ball.y + Math.sin(angle) * ball.radius;
          ball.orbitEl.style.left = `${edgeX}px`;
          ball.orbitEl.style.top = `${edgeY}px`;
          // Rotate it so it points outward. +90 deg or +45 deg depends on emoji orientation.
          // 🗡️ points top-right, or bottom-left depending on OS. Usually it's diagonal.
          // A standard CSS rotate(${angle}rad) will work if we adjust the baseline in CSS.
          // Added Math.PI (180deg) to flip the sword outward.
          ball.orbitEl.style.transform = `translate(0%, -50%) rotate(${angle + Math.PI/4 + Math.PI}rad)`;
        } else {
          ball.orbitEl.style.left = `${swordX}px`;
          ball.orbitEl.style.top = `${swordY}px`;
        }
      }

        if (enemy) {
          let hit = false;
          if (ball.weaponType === 'longsword') {
            // Line segment collision (blade sticks out 40px)
            const S1x = ball.x + Math.cos(angle) * ball.radius;
            const S1y = ball.y + Math.sin(angle) * ball.radius;
            const length = 40;
            const S2x = ball.x + Math.cos(angle) * (ball.radius + length);
            const S2y = ball.y + Math.sin(angle) * (ball.radius + length);
            
            const L2 = length * length;
            let t = 0;
            if (L2 > 0) {
              t = Math.max(0, Math.min(1, ((enemy.x - S1x) * (S2x - S1x) + (enemy.y - S1y) * (S2y - S1y)) / L2));
            }
            const ProjX = S1x + t * (S2x - S1x);
            const ProjY = S1y + t * (S2y - S1y);
            const dist = Math.sqrt((enemy.x - ProjX) ** 2 + (enemy.y - ProjY) ** 2);
            
            if (dist < enemy.radius + 6) hit = true; // 6 is half-width of blade
          } else {
            // Normal point collision
            const dx = enemy.x - swordX;
            const dy = enemy.y - swordY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.radius + 10) hit = true; // 10 is sword impact radius
          }

          if (hit) {
          // Hit! Check invincibility
          if (!enemy.lastHitTime || timestamp - enemy.lastHitTime > CONFIG.weapons.invincibility) {
            enemy.hp = Math.max(0, enemy.hp - CONFIG.weapons.damage);
            enemy.lastHitTime = timestamp;
            enemy.hpDisplay.value = enemy.hp;
            if (enemy.innerHpEl) {
              enemy.innerHpEl.textContent = enemy.hp;
            }

            // Visual feedback
            enemy.el.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
              if (enemy.el) enemy.el.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
          }
        }
      }
    } else if (ball.weaponExpiry && ball.weaponExpiry <= timestamp) {
      // Weapon expired
      ball.weaponExpiry = null;
      if (ball.orbitEl) {
        ball.orbitEl.remove();
        ball.orbitEl = null;
      }
    }
  }
}

/**
 * Clears all spawned and orbiting weapons from the DOM and state.
 */
export function resetWeapons() {
  const container = document.getElementById('weapon-container');
  if (container) container.innerHTML = '';
  state.spawnedItems = [];
  state.lastSpawnTime = 0;
  
  for (const ball of state.balls) {
    ball.weaponExpiry = null;
    ball.orbitEl = null;
    ball.lastHitTime = null;
  }
}
