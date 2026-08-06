/**
 * Sound Hooks System
 *
 * Maps game events to audio cue definitions.
 * Ready for Web Audio API integration — currently logs sound triggers.
 * Each hook defines the cue name, volume, and pitch variation.
 */

import { events, EVENTS } from './event-bus.js';

/** Sound cue definitions */
export const SOUND_CUES = {
  impact_thud:     { name: 'Impact Thud',     volume: 0.7, pitchRange: [0.9, 1.1] },
  slash_hit:       { name: 'Slash Hit',        volume: 0.8, pitchRange: [0.95, 1.05] },
  gunshot:         { name: 'Gunshot',          volume: 0.6, pitchRange: [0.9, 1.1] },
  magic_chime:     { name: 'Magic Chime',      volume: 0.6, pitchRange: [0.8, 1.2] },
  explosion_boom:  { name: 'Explosion Boom',   volume: 1.0, pitchRange: [0.85, 1.0] },
  ominous_drone:   { name: 'Ominous Drone',    volume: 0.5, pitchRange: [1.0, 1.0], loop: true },
  heartbeat:       { name: 'Heartbeat',        volume: 0.4, pitchRange: [1.0, 1.0], loop: true },
  bounce:          { name: 'Bounce',           volume: 0.3, pitchRange: [0.8, 1.3] },
  powerup_activate:{ name: 'Power-up Activate', volume: 0.7, pitchRange: [1.0, 1.2] },
  shield_hit:      { name: 'Shield Hit',       volume: 0.5, pitchRange: [0.9, 1.1] },
};

/** Event-to-sound mapping */
const EVENT_SOUND_MAP = new Map([
  [EVENTS.BALL_COLLISION,  'impact_thud'],
  [EVENTS.WALL_COLLISION,  'bounce'],
  [EVENTS.DAMAGE_DEALT,    'slash_hit'],
  [EVENTS.BALL_KILLED,     'explosion_boom'],
  [EVENTS.WEAPON_PICKUP,   'magic_chime'],
  [EVENTS.POWERUP_PICKUP,  'powerup_activate'],
  [EVENTS.PROJECTILE_HIT,  'gunshot'],
]);

let soundEnabled = false;
let audioContext = null;

/**
 * Initialize sound hooks — wire event bus to sound triggers.
 */
export function initSoundHooks() {
  for (const [eventName, cueName] of EVENT_SOUND_MAP) {
    events.on(eventName, (data) => {
      triggerSound(cueName, data);
    });
  }
}

/**
 * Enable/disable sound.
 */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  if (enabled && !audioContext) {
    // Reserve AudioContext for future integration
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available');
    }
  }
}

/**
 * Trigger a sound cue.
 * Currently logs to console — replace with actual audio playback when assets are ready.
 * @param {string} cueName - Key from SOUND_CUES
 * @param {Object} [eventData] - Event data for context
 */
function triggerSound(cueName, eventData) {
  if (!soundEnabled) return;
  
  const cue = SOUND_CUES[cueName];
  if (!cue) return;
  
  // Future: play actual audio here
  // For now, this is a no-op in production (uncomment for debugging):
  // console.log(`🔊 ${cue.name} (vol: ${cue.volume})`);
}

/** Get the AudioContext (for future use) */
export function getAudioContext() {
  return audioContext;
}
