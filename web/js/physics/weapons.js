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

    const el = document.createElement('div');
    el.className = `item-sword`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    container.appendChild(el);

    state.spawnedItems.push({
      id: `weapon-${weaponIdCounter++}`,
      x,
      y,
      radius: 8, // Half of 16px
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
          orbitEl.className = 'orbit-sword';
          document.getElementById('weapon-container').appendChild(orbitEl);
          ball.orbitEl = orbitEl;
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
        ball.orbitEl.style.left = `${swordX}px`;
        ball.orbitEl.style.top = `${swordY}px`;
      }

      // Check combat collision with enemy
      if (enemy) {
        const dx = enemy.x - swordX;
        const dy = enemy.y - swordY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const swordRadius = 6; // Half of 12px

        if (dist < enemy.radius + swordRadius) {
          // Hit! Check invincibility
          if (!enemy.lastHitTime || timestamp - enemy.lastHitTime > CONFIG.weapons.invincibility) {
            enemy.hp = Math.max(0, enemy.hp - CONFIG.weapons.damage);
            enemy.lastHitTime = timestamp;
            enemy.hpDisplay.value = enemy.hp;

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
