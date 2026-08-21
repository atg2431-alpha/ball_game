/**
 * Sound Hooks System
 *
 * Loads WAV audio files and plays them via Web Audio API.
 * Maps game events to audio cues with volume and pitch variation.
 */

import { events, EVENTS } from './event-bus.js';

// ── Audio file paths (relative to web root) ──
const AUDIO_BASE = 'utils/audio/';

/** Sound cue definitions with file mapping */
export const SOUND_CUES = {
  ball_collision:   { file: 'ball_collision.wav',   volume: 0.7,  pitchRange: [0.9, 1.1] },
  wall_bounce:      { file: 'wall_bounce.wav',      volume: 0.3,  pitchRange: [0.8, 1.3] },
  slash_hit:        { file: 'slash_hit.wav',         volume: 0.8,  pitchRange: [0.95, 1.05] },
  gunshot:          { file: 'gunshot.wav',            volume: 0.6,  pitchRange: [0.9, 1.1] },
  explosion:        { file: 'explosion.wav',          volume: 1.0,  pitchRange: [0.85, 1.0] },
  weapon_pickup:    { file: 'weapon_pickup.wav',      volume: 0.6,  pitchRange: [0.8, 1.2] },
  weapon_expired:   { file: 'weapon_expired.wav',     volume: 0.5,  pitchRange: [0.9, 1.1] },
  powerup_spawn:    { file: 'powerup_spawn.wav',      volume: 0.5,  pitchRange: [0.9, 1.1] },
  powerup_pickup:   { file: 'powerup_pickup.wav',     volume: 0.7,  pitchRange: [1.0, 1.2] },
  status_applied:   { file: 'status_applied.wav',     volume: 0.5,  pitchRange: [0.9, 1.1] },
  power_down:       { file: 'power_down.wav',         volume: 0.5,  pitchRange: [0.9, 1.1] },
  arena_shrink:     { file: 'arena_shrink.wav',       volume: 0.5,  pitchRange: [1.0, 1.0], loop: true },
  hazard_trigger:   { file: 'hazard_trigger.wav',     volume: 0.5,  pitchRange: [0.9, 1.1] },
  game_start:       { file: 'game_start.wav',         volume: 0.8,  pitchRange: [1.0, 1.0] },
  game_over:        { file: 'game_over.wav',          volume: 0.8,  pitchRange: [1.0, 1.0] },
  ui_click:         { file: 'ui_click.wav',           volume: 0.4,  pitchRange: [0.9, 1.1] },
};

/** Event-to-sound mapping */
const EVENT_SOUND_MAP = new Map([
  [EVENTS.BALL_COLLISION,   'ball_collision'],
  [EVENTS.WALL_COLLISION,   'wall_bounce'],
  [EVENTS.DAMAGE_DEALT,     'slash_hit'],
  [EVENTS.BALL_KILLED,      'explosion'],
  [EVENTS.WEAPON_PICKUP,    'weapon_pickup'],
  [EVENTS.WEAPON_EXPIRED,   'weapon_expired'],
  [EVENTS.POWERUP_SPAWN,    'powerup_spawn'],
  [EVENTS.POWERUP_PICKUP,   'powerup_pickup'],
  [EVENTS.PROJECTILE_HIT,   'gunshot'],
  [EVENTS.STATUS_APPLIED,   'status_applied'],
  [EVENTS.STATUS_EXPIRED,   'power_down'],
  [EVENTS.POWERUP_EXPIRED,  'power_down'],
  [EVENTS.ARENA_SHRINK,     'arena_shrink'],
  [EVENTS.HAZARD_TRIGGER,   'hazard_trigger'],
  [EVENTS.GAME_START,       'game_start'],
  [EVENTS.GAME_OVER,        'game_over'],
]);

let soundEnabled = false;
let audioContext = null;
let masterGainNode = null;
let mediaStreamDestination = null;

/** Cache of decoded AudioBuffers keyed by cue name */
const audioBuffers = new Map();

/** Track looping sources so we can stop them */
const loopingSources = new Map();

/** Preload promise so we can await it */
let preloadPromise = null;

/**
 * Ensure AudioContext exists (must be called after user gesture).
 */
function ensureAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioContext.createGain();
      masterGainNode.connect(audioContext.destination);
      
      mediaStreamDestination = audioContext.createMediaStreamDestination();
      masterGainNode.connect(mediaStreamDestination);
      console.log('🔊 AudioContext created');
    } catch (e) {
      console.warn('🔇 Web Audio API not available:', e);
      return false;
    }
  }
  // Resume if suspended (browsers require user gesture)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return true;
}

/**
 * Preload all audio files into AudioBuffers.
 * Returns a promise that resolves when all files are loaded.
 */
function preloadAudio() {
  // Return existing promise if already loading/loaded
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    if (!audioContext) return;

    console.log('🔊 Preloading audio files...');

    const loadPromises = Object.entries(SOUND_CUES).map(async ([cueName, cue]) => {
      try {
        const url = AUDIO_BASE + cue.file;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`🔇 Failed to load: ${url} (${response.status})`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.set(cueName, audioBuffer);
      } catch (err) {
        console.warn(`🔇 Error loading ${cue.file}:`, err.message);
      }
    });

    await Promise.all(loadPromises);
    console.log(`🔊 Audio loaded: ${audioBuffers.size}/${Object.keys(SOUND_CUES).length} sounds ready`);
  })();

  return preloadPromise;
}

/**
 * Initialize sound hooks — wire event bus to sound triggers.
 */
export function initSoundHooks() {
  for (const [eventName, cueName] of EVENT_SOUND_MAP) {
    events.on(eventName, (data) => {
      triggerSound(cueName, data);
    });
  }
  console.log('🔊 Sound hooks initialized');
}

/**
 * Enable/disable sound.
 */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  console.log(`🔊 Sound ${enabled ? 'ENABLED' : 'DISABLED'}`);
  if (enabled) {
    if (ensureAudioContext()) {
      preloadAudio();
    }
  } else {
    // Stop all looping sounds when disabled
    for (const [name, source] of loopingSources) {
      try { source.stop(); } catch (e) { /* already stopped */ }
    }
    loopingSources.clear();
  }
}

/**
 * Play a sound cue with volume and random pitch variation.
 * @param {string} cueName - Key from SOUND_CUES
 * @param {Object} [eventData] - Event data for context
 */
function triggerSound(cueName, eventData) {
  if (!soundEnabled || !audioContext) return;

  const cue = SOUND_CUES[cueName];
  if (!cue) return;

  const buffer = audioBuffers.get(cueName);
  if (!buffer) {
    // Buffer not yet loaded — this is normal during preload
    return;
  }

  // For looping sounds, don't restart if already playing
  if (cue.loop && loopingSources.has(cueName)) return;

  try {
    // Resume context if it got suspended (e.g. tab was inactive)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    // Random pitch variation within range
    const [minPitch, maxPitch] = cue.pitchRange;
    source.playbackRate.value = minPitch + Math.random() * (maxPitch - minPitch);

    // Looping
    if (cue.loop) {
      source.loop = true;
      loopingSources.set(cueName, source);
      source.onended = () => loopingSources.delete(cueName);
    }

    // Volume via GainNode
    const gainNode = audioContext.createGain();
    gainNode.gain.value = cue.volume;

    // Connect: source → gain → output
    source.connect(gainNode);
    gainNode.connect(masterGainNode);

    source.start(0);
  } catch (err) {
    console.warn(`🔇 Playback error for ${cueName}:`, err.message);
  }
}

/**
 * Stop a specific looping sound.
 * @param {string} cueName
 */
export function stopLoopingSound(cueName) {
  const source = loopingSources.get(cueName);
  if (source) {
    try { source.stop(); } catch (e) { /* already stopped */ }
    loopingSources.delete(cueName);
  }
}

/**
 * Play the UI click sound (convenience for buttons/toggles).
 */
export function playUIClick() {
  triggerSound('ui_click');
}

/** Get the AudioContext */
export function getAudioContext() {
  return audioContext;
}

/** Get the MediaStream from MediaStreamDestination */
export function getAudioStream() {
  return mediaStreamDestination ? mediaStreamDestination.stream : null;
}
