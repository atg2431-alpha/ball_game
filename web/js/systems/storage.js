/**
 * Storage System
 * 
 * Handles saving and loading configuration and game settings to localStorage.
 * This ensures user tweaks persist across page reloads.
 */

import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { getRegistry } from './powerup-registry.js';

const STORAGE_KEY = 'insta_game_settings';

export function saveSettings() {
  const data = {
    weapons: CONFIG.weapons,
    ball1Hp: CONFIG.ball1.hp,
    ball2Hp: CONFIG.ball2.hp,
    toggles: {
      recordingEnabled: state.recordingEnabled,
      powerupsEnabled: state.powerupsEnabled,
      shrinkZoneEnabled: state.shrinkZoneEnabled,
      gravityWellsEnabled: state.gravityWellsEnabled,
      bouncePadsEnabled: state.bouncePadsEnabled,
      hazardsEnabled: state.hazardsEnabled,
      soundEnabled: state.soundEnabled
    },
    powerups: {}
  };

  const registry = getRegistry();
  for (const [type, def] of registry) {
    data.powerups[type] = {
      enabled: def.enabled
    };
    if (def.configurable) {
      for (const attr of def.configurable) {
        data.powerups[type][attr.key] = def[attr.key];
      }
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export function loadSettings() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return; // No saved settings

    const data = JSON.parse(json);

    // Restore weapons config
    if (data.weapons) {
      // Deep merge weapon config to avoid overwriting missing properties
      for (const weapon in data.weapons) {
        if (CONFIG.weapons[weapon]) {
          Object.assign(CONFIG.weapons[weapon], data.weapons[weapon]);
        }
      }
    }

    // Restore HP
    if (data.ball1Hp !== undefined) CONFIG.ball1.hp = data.ball1Hp;
    if (data.ball2Hp !== undefined) CONFIG.ball2.hp = data.ball2Hp;

    // Restore toggles
    if (data.toggles) {
      Object.assign(state, data.toggles);
    }

    // Restore powerup settings
    if (data.powerups) {
      const registry = getRegistry();
      for (const [type, savedDef] of Object.entries(data.powerups)) {
        const def = registry.get(type);
        if (def) {
          def.enabled = savedDef.enabled;
          if (def.configurable) {
            for (const attr of def.configurable) {
              if (savedDef[attr.key] !== undefined) {
                def[attr.key] = savedDef[attr.key];
              }
            }
          }
        }
      }
    }

    updateUIFromLoadedSettings();

  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
}

/**
 * Updates DOM inputs and checkboxes to match loaded state.
 */
function updateUIFromLoadedSettings() {
  // Sync Toggles
  const syncToggle = (id, stateKey) => {
    const el = document.getElementById(id);
    if (el && state[stateKey] !== undefined) {
      el.checked = state[stateKey];
    }
  };

  syncToggle('record-toggle', 'recordingEnabled');
  syncToggle('powerup-toggle', 'powerupsEnabled');
  syncToggle('shrink-toggle', 'shrinkZoneEnabled');
  syncToggle('gravity-toggle', 'gravityWellsEnabled');
  syncToggle('bounce-pad-toggle', 'bouncePadsEnabled');
  syncToggle('hazard-toggle', 'hazardsEnabled');
  syncToggle('sound-toggle', 'soundEnabled');

  // Sync HP Inputs
  const hp1 = document.getElementById('ball-1-hp');
  if (hp1) hp1.value = CONFIG.ball1.hp;
  const hp2 = document.getElementById('ball-2-hp');
  if (hp2) hp2.value = CONFIG.ball2.hp;

  // Sync Weapon Inputs
  const syncWeaponInput = (id, weaponConfig, key, multiplier = 1) => {
    const el = document.getElementById(id);
    if (el && weaponConfig[key] !== undefined) {
      el.value = weaponConfig[key] / multiplier;
    }
  };

  syncWeaponInput('sword-spawn', CONFIG.weapons.sword, 'spawnInterval', 1000);
  syncWeaponInput('sword-duration', CONFIG.weapons.sword, 'duration', 1000);
  syncWeaponInput('sword-count', CONFIG.weapons.sword, 'count', 1);

  syncWeaponInput('longsword-spawn', CONFIG.weapons.longsword, 'spawnInterval', 1000);
  syncWeaponInput('longsword-duration', CONFIG.weapons.longsword, 'duration', 1000);
  syncWeaponInput('longsword-count', CONFIG.weapons.longsword, 'count', 1);

  syncWeaponInput('gun-spawn', CONFIG.weapons.gun, 'spawnInterval', 1000);
  syncWeaponInput('gun-duration', CONFIG.weapons.gun, 'duration', 1000);
  syncWeaponInput('gun-fire-rate', CONFIG.weapons.gun, 'fireRate', 1000);
  syncWeaponInput('gun-bullet-life', CONFIG.weapons.gun, 'bulletLifetime', 1000);
}
