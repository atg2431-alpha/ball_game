/**
 * Power-Up Configuration UI
 * 
 * Dynamically builds a popover panel from the power-up registry,
 * allowing users to toggle individual power-ups and tweak their attributes.
 */

import { getRegistry, getConfigurableAttributes } from '../systems/powerup-registry.js';

/**
 * Initialize the power-up popover UI.
 * Call this after all power-up modules have been imported (so the registry is populated).
 */
export function initPowerupUI() {
  const popover = document.getElementById('powerup-popover');
  const openBtn = document.getElementById('powerup-popover-btn');
  const closeBtn = document.getElementById('powerup-popover-close');
  const listEl = document.getElementById('powerup-popover-list');

  if (!popover || !openBtn || !closeBtn || !listEl) return;

  // Build the list from the registry
  const registry = getRegistry();
  
  for (const [type, def] of registry) {
    const item = createPowerupItem(def);
    listEl.appendChild(item);
  }

  // Open popover
  openBtn.addEventListener('click', () => {
    popover.style.display = 'flex';
  });

  // Close popover
  closeBtn.addEventListener('click', () => {
    popover.style.display = 'none';
  });
}

/**
 * Create a single power-up item element with toggle, chevron, and accordion settings.
 * @param {Object} def - Power-up definition from the registry
 * @returns {HTMLElement}
 */
function createPowerupItem(def) {
  const container = document.createElement('div');
  container.className = 'powerup-item';

  // ── Main Row: Icon | Name | Toggle | Chevron ──
  const row = document.createElement('div');
  row.className = 'powerup-item__row';

  // Icon
  const icon = document.createElement('span');
  icon.className = 'powerup-item__icon';
  icon.textContent = def.icon;

  // Name
  const name = document.createElement('span');
  name.className = 'powerup-item__name';
  name.textContent = def.name;

  // Toggle switch
  const toggle = document.createElement('label');
  toggle.className = 'powerup-item__toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = def.enabled !== false;
  const slider = document.createElement('span');
  slider.className = 'slider';
  toggle.appendChild(checkbox);
  toggle.appendChild(slider);

  // Toggle handler
  checkbox.addEventListener('change', (e) => {
    def.enabled = e.target.checked;
    name.classList.toggle('disabled', !e.target.checked);
  });

  // Settings chevron (only if configurable attributes exist)
  const attrs = def.configurable || [];
  let chevron = null;
  let settingsPanel = null;

  if (attrs.length > 0) {
    chevron = document.createElement('button');
    chevron.className = 'powerup-item__chevron';
    chevron.textContent = '›';
    chevron.title = 'Settings';

    // ── Settings Accordion ──
    settingsPanel = document.createElement('div');
    settingsPanel.className = 'powerup-item__settings';

    const settingsInner = document.createElement('div');
    settingsInner.className = 'powerup-item__settings-inner';

    for (const attr of attrs) {
      const settingRow = document.createElement('div');
      settingRow.className = 'powerup-setting-row';

      const label = document.createElement('span');
      label.textContent = attr.label;

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'powerup-setting-input';
      input.min = attr.min;
      input.max = attr.max;
      input.step = attr.step;

      // Display value: if multiplier is set (e.g., duration in ms → show seconds), divide
      const displayValue = attr.multiplier ? def[attr.key] / attr.multiplier : def[attr.key];
      input.value = displayValue;

      // Change handler
      input.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = displayValue;
        // Clamp
        val = Math.max(attr.min, Math.min(attr.max, val));
        e.target.value = val;
        // Apply multiplier if needed (e.g., seconds → ms)
        def[attr.key] = attr.multiplier ? val * attr.multiplier : val;
      });

      settingRow.appendChild(label);
      settingRow.appendChild(input);
      settingsInner.appendChild(settingRow);
    }

    settingsPanel.appendChild(settingsInner);

    // Toggle accordion
    chevron.addEventListener('click', () => {
      const isOpen = settingsPanel.classList.toggle('open');
      chevron.classList.toggle('expanded', isOpen);
    });
  }

  // Assemble row
  row.appendChild(icon);
  row.appendChild(name);
  row.appendChild(toggle);
  if (chevron) row.appendChild(chevron);

  container.appendChild(row);
  if (settingsPanel) container.appendChild(settingsPanel);

  return container;
}
