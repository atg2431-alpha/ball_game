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
const WALLPAPER_KEY = 'insta_game_wallpaper';

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
    powerups: {},
    customise: {
      boardContrast: state.boardContrast !== undefined ? state.boardContrast : 50
    }
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

    // Restore customise settings
    if (data.customise) {
      if (data.customise.boardContrast !== undefined) {
        state.boardContrast = data.customise.boardContrast;
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

  // Sync contrast slider
  const contrastSlider = document.getElementById('board-contrast');
  if (contrastSlider && state.boardContrast !== undefined) {
    contrastSlider.value = state.boardContrast;
  }
}

// ─── Wallpaper Storage (separate key due to large data) ─────

/**
 * Save a cropped wallpaper data URL to localStorage.
 * @param {string} dataUrl - JPEG base64 data URL
 */
export function saveWallpaper(dataUrl) {
  try {
    localStorage.setItem(WALLPAPER_KEY, dataUrl);
  } catch (e) {
    console.warn('Failed to save wallpaper to localStorage (may exceed quota):', e);
  }
}

/**
 * Load the saved wallpaper data URL from localStorage.
 * @returns {string|null}
 */
export function loadWallpaper() {
  try {
    return localStorage.getItem(WALLPAPER_KEY);
  } catch (e) {
    console.warn('Failed to load wallpaper from localStorage:', e);
    return null;
  }
}

/**
 * Clear the saved wallpaper from localStorage.
 */
export function clearWallpaper() {
  try {
    localStorage.removeItem(WALLPAPER_KEY);
  } catch (e) {
    console.warn('Failed to clear wallpaper from localStorage:', e);
  }
}
