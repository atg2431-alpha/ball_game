import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { EVENTS, events } from '../systems/event-bus.js';

let weaponIdCounter = 0;

/**
 * Handles spawning new weapon items on the board.
 * @param {number} timestamp - Current game time in ms
 */
export function spawnWeapon(timestamp) {
  const type = state.selectedWeapon;
  // If for some reason type isn't set, default to sword config
  const weaponConfig = CONFIG.weapons[type] || CONFIG.weapons.sword;

  if (timestamp - state.lastSpawnTime > weaponConfig.spawnInterval) {
    state.lastSpawnTime = timestamp;

    // Keep it slightly away from edges
    const padding = 20;
    const x = padding + Math.random() * (state.boardWidth - padding * 2);
    const y = padding + Math.random() * (state.boardHeight - padding * 2);

    state.spawnedItems.push({
      id: `weapon-${weaponIdCounter++}`,
      x,
      y,
      radius: 12, // Hitbox for pickup
      type,
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
        const weaponConfig = CONFIG.weapons[item.type];
        if (ball.weaponExpiry && ball.weaponExpiry > timestamp && ball.weaponType === item.type) {
          ball.weaponExpiry += weaponConfig.duration;
        } else {
          ball.weaponExpiry = timestamp + weaponConfig.duration;
          ball.weaponType = item.type;
          ball.lastFireTime = 0; // For gun
        }
        
        events.emit(EVENTS.WEAPON_PICKUP, { ball, weaponType: item.type });
        
        // Remove item from board
        state.spawnedItems.splice(i, 1);
        absorbed = true;
        break;
      }
    }
  }

  // 2. Handle orbits and combat
  for (let i = 0; i < state.balls.length; i++) {
    const ball = state.balls[i];

    if (ball.weaponExpiry && ball.weaponExpiry > timestamp) {
      // Calculate orbit position
      const baseAngle = timestamp * CONFIG.weapons.orbitSpeed;
      // Update angle on the ball state for the renderer
      ball.weaponAngle = baseAngle;
      
      const weaponConfig = CONFIG.weapons[ball.weaponType];
      const count = weaponConfig.count || 1;
      const angleStep = (Math.PI * 2) / count;

      for (let j = 0; j < state.balls.length; j++) {
        if (j === i) continue;
        const enemy = state.balls[j];

        let hit = false;
        
        // Check collision against all weapon instances
        for (let k = 0; k < count; k++) {
          const angle = baseAngle + k * angleStep;
          
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
            
            if (dist < enemy.radius + 6) hit = true;
          } else if (ball.weaponType === 'sword') {
            const swordX = ball.x + Math.cos(angle) * CONFIG.weapons.orbitRadius;
            const swordY = ball.y + Math.sin(angle) * CONFIG.weapons.orbitRadius;
            // Normal point collision
            const dx = enemy.x - swordX;
            const dy = enemy.y - swordY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < enemy.radius + 10) hit = true;
          }
          
          if (hit) break;
        }

        if (hit) {
          // Hit! Check invincibility
          if (!enemy.lastHitTime || timestamp - enemy.lastHitTime > CONFIG.weapons.invincibility) {
            const damage = CONFIG.weapons[ball.weaponType].damage;
            enemy.hp = Math.max(0, enemy.hp - damage);
            enemy.lastHitTime = timestamp;
            enemy.hpDisplay.value = enemy.hp;
            
            events.emit(EVENTS.DAMAGE_DEALT, { source: ball, target: enemy, amount: damage, weaponType: ball.weaponType });
          }
        }
      }

      // Gun Firing Logic
      if (ball.weaponType === 'gun') {
        const gunConfig = CONFIG.weapons.gun;
        if (!ball.lastFireTime) ball.lastFireTime = timestamp;
        
        if (timestamp - ball.lastFireTime > gunConfig.fireRate) {
          ball.lastFireTime = timestamp;
          
          // Spawn Bullet for all instances
          for (let k = 0; k < count; k++) {
            const angle = baseAngle + k * angleStep;
            const edgeX = ball.x + Math.cos(angle) * ball.radius;
            const edgeY = ball.y + Math.sin(angle) * ball.radius;
            
            state.projectiles.push({
              x: edgeX,
              y: edgeY,
              dx: Math.cos(angle),
              dy: Math.sin(angle),
              speed: gunConfig.bulletSpeed,
              lifetime: gunConfig.bulletLifetime,
              spawnTime: timestamp,
              ownerId: ball.id,
            });
          }
        }
      }
    } else if (ball.weaponExpiry && ball.weaponExpiry <= timestamp) {
      // Weapon expired
      ball.weaponExpiry = null;
      events.emit(EVENTS.WEAPON_EXPIRED, { ball, weaponType: ball.weaponType });
    }
  }
}

/**
 * Clears all spawned and orbiting weapons from the DOM and state.
 */
export function resetWeapons() {
  state.spawnedItems = [];
  state.lastSpawnTime = 0;
  
  for (const ball of state.balls) {
    ball.weaponExpiry = null;
    ball.lastHitTime = null;
    ball.weaponType = null;
    ball.lastFireTime = null;
    ball.weaponAngle = null;
  }
}

/**
 * Updates projectiles (bullets): movement, collisions, lifecycle.
 * @param {number} timestamp 
 */
export function updateProjectiles(timestamp) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];

    // Check lifetime
    if (timestamp - proj.spawnTime > proj.lifetime) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // Move bullet
    proj.x += proj.dx * proj.speed;
    proj.y += proj.dy * proj.speed;

    // Boundary collision
    if (proj.x < 0 || proj.x > state.boardWidth || proj.y < 0 || proj.y > state.boardHeight) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // Enemy collision
    let hitEnemy = false;
    for (const enemy of state.balls) {
      if (enemy.id !== proj.ownerId) {
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bulletRadius = 4;

        if (dist < enemy.radius + bulletRadius) {
          hitEnemy = true;
          if (!enemy.lastHitTime || timestamp - enemy.lastHitTime > CONFIG.weapons.invincibility) {
            enemy.hp = Math.max(0, enemy.hp - CONFIG.weapons.gun.damage);
            enemy.lastHitTime = timestamp;
            enemy.hpDisplay.value = enemy.hp;
            
            events.emit(EVENTS.PROJECTILE_HIT, { projectile: proj, target: enemy, damage: CONFIG.weapons.gun.damage });
          }
          break; // Stop checking enemies for this bullet
        }
      }
    }

    if (hitEnemy) {
      state.projectiles.splice(i, 1);
    }
  }
}
