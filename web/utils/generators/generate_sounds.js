/**
 * Ball Battle SFX Generator (Node.js)
 * 
 * Generates all 16 game sound effects as WAV files using procedural synthesis.
 * Run with: node generate_sounds.js
 * 
 * All sounds are original, royalty-free, no attribution needed.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = __dirname; // saves to web/audio/

// ──────────────────────────────────────────────
// WAV file writer
// ──────────────────────────────────────────────
function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);     // chunk size
  buffer.writeUInt16LE(1, 20);      // PCM
  buffer.writeUInt16LE(1, 22);      // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);      // block align
  buffer.writeUInt16LE(16, 34);     // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 0x7FFF), 44 + i * 2);
  }

  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`  ✅ ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ──────────────────────────────────────────────
// Sound Generators
// ──────────────────────────────────────────────

function genBallCollision() {
  const duration = 0.3;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 15);
    const freq = 80 + Math.exp(-t * 20) * 120;
    samples[i] = envelope * (
      0.6 * Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 1.5 * t) +
      0.2 * (Math.random() * 2 - 1) * Math.exp(-t * 30)
    );
  }
  return samples;
}

function genWallBounce() {
  const duration = 0.2;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 25);
    const freq = 300 + Math.exp(-t * 40) * 400;
    samples[i] = envelope * (
      0.5 * Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 2 * t)
    );
  }
  return samples;
}

function genSlashHit() {
  const duration = 0.35;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 12);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40);
    const ring = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 15);
    const low = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 10);
    samples[i] = envelope * (0.5 * noise + 0.3 * ring + 0.2 * low);
  }
  return samples;
}

function genGunshot() {
  const duration = 0.25;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const click = Math.exp(-t * 80) * 0.8;
    const body = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 20) * 0.4;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.5;
    samples[i] = click + body + noise;
  }
  return samples;
}

function genExplosion() {
  const duration = 0.8;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 4);
    const freq = 40 + Math.exp(-t * 8) * 200;
    const bass = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 6);
    const crackle = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.7;
    samples[i] = envelope * (0.4 * bass + 0.35 * noise + 0.25 * crackle);
  }
  return samples;
}

function genWeaponPickup() {
  const duration = 0.5;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  const freqs = [523, 659, 784]; // C5, E5, G5
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (let f = 0; f < freqs.length; f++) {
      const delay = f * 0.06;
      if (t > delay) {
        const lt = t - delay;
        val += Math.sin(2 * Math.PI * freqs[f] * lt) * Math.exp(-lt * 6) * 0.3;
      }
    }
    samples[i] = val;
  }
  return samples;
}

function genWeaponExpired() {
  const duration = 0.2;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const click = Math.exp(-t * 60) * 0.5;
    const tone = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 20) * 0.3;
    const tone2 = Math.sin(2 * Math.PI * 300 * t * (1 - t * 2)) * Math.exp(-t * 15) * 0.3;
    samples[i] = click + tone + tone2;
  }
  return samples;
}

function genPowerupSpawn() {
  const duration = 0.4;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.sin(Math.PI * t / 0.4) * 0.4;
    const freq = 800 + Math.sin(t * 20) * 200;
    samples[i] = env * (
      0.5 * Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 1.5 * t) +
      0.1 * (Math.random() * 2 - 1)
    );
  }
  return samples;
}

function genPowerupPickup() {
  const duration = 0.45;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 400 + t * 1600;
    const envelope = Math.exp(-t * 3) * Math.sin(Math.PI * t / 0.45);
    samples[i] = envelope * (
      0.5 * Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 2 * t)
    );
  }
  return samples;
}

function genStatusApplied() {
  const duration = 0.5;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 4);
    const mod = Math.sin(2 * Math.PI * 6 * t);
    const freq = 600 + mod * 100;
    samples[i] = env * 0.4 * (
      Math.sin(2 * Math.PI * freq * t) +
      0.5 * Math.sin(2 * Math.PI * freq * 1.5 * t)
    ) * (0.7 + 0.3 * mod);
  }
  return samples;
}

function genPowerDown() {
  const duration = 0.4;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 600 - t * 1000;
    const envelope = Math.exp(-t * 5);
    samples[i] = envelope * 0.4 * Math.sin(2 * Math.PI * Math.max(freq, 100) * t);
  }
  return samples;
}

function genArenaShrink() {
  const duration = 1.0;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = 0.3 * Math.sin(Math.PI * t / 1.0);
    const bass = Math.sin(2 * Math.PI * 45 * t);
    const sub = Math.sin(2 * Math.PI * 30 * t + Math.sin(2 * Math.PI * 0.5 * t));
    const rumble = (Math.random() * 2 - 1) * 0.15;
    samples[i] = env * (0.5 * bass + 0.3 * sub + 0.2 * rumble);
  }
  return samples;
}

function genHazardTrigger() {
  const duration = 0.35;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 200 + Math.exp(-t * 10) * 2000;
    const envelope = Math.exp(-t * 8);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
    samples[i] = envelope * (
      0.5 * Math.sin(2 * Math.PI * freq * t) +
      0.3 * noise
    );
  }
  return samples;
}

function genGameStart() {
  const duration = 0.6;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  const notes = [
    { freq: 523, start: 0.0, dur: 0.15 },
    { freq: 659, start: 0.1, dur: 0.15 },
    { freq: 784, start: 0.2, dur: 0.15 },
    { freq: 1047, start: 0.3, dur: 0.3 },
  ];
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const lt = t - note.start;
        const env = Math.exp(-lt * 4) * 0.35;
        val += env * (
          Math.sin(2 * Math.PI * note.freq * lt) +
          0.3 * Math.sin(2 * Math.PI * note.freq * 2 * lt)
        );
      }
    }
    samples[i] = val;
  }
  return samples;
}

function genGameOver() {
  const duration = 1.0;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  const chords = [
    { freqs: [392, 494, 587], start: 0.0 },
    { freqs: [349, 440, 523], start: 0.3 },
    { freqs: [262, 330, 392], start: 0.6 },
  ];
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (const chord of chords) {
      if (t >= chord.start) {
        const lt = t - chord.start;
        const env = Math.exp(-lt * 2.5) * 0.2;
        for (const freq of chord.freqs) {
          val += env * Math.sin(2 * Math.PI * freq * lt);
        }
      }
    }
    samples[i] = val;
  }
  return samples;
}

function genUIClick() {
  const duration = 0.08;
  const samples = new Float32Array(SAMPLE_RATE * duration);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const click = Math.exp(-t * 100) * 0.6;
    const tone = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 60) * 0.3;
    samples[i] = click + tone;
  }
  return samples;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
console.log('🔊 Ball Battle SFX Generator');
console.log(`   Output directory: ${OUTPUT_DIR}\n`);

const soundMap = [
  ['ball_collision.wav',  genBallCollision,  'Ball-on-ball impact thud'],
  ['wall_bounce.wav',     genWallBounce,     'Wall bounce (snappy)'],
  ['slash_hit.wav',       genSlashHit,       'Sword slash hit'],
  ['gunshot.wav',         genGunshot,        'Gunshot / projectile hit'],
  ['explosion.wav',       genExplosion,      'Death explosion'],
  ['weapon_pickup.wav',   genWeaponPickup,   'Weapon pickup chime'],
  ['weapon_expired.wav',  genWeaponExpired,  'Weapon expired click'],
  ['powerup_spawn.wav',   genPowerupSpawn,   'Power-up spawn sparkle'],
  ['powerup_pickup.wav',  genPowerupPickup,  'Power-up pickup (ascending)'],
  ['status_applied.wav',  genStatusApplied,  'Status effect applied'],
  ['power_down.wav',      genPowerDown,      'Power-up/status expired'],
  ['arena_shrink.wav',    genArenaShrink,    'Arena shrink rumble (loop)'],
  ['hazard_trigger.wav',  genHazardTrigger,  'Hazard trigger whoosh'],
  ['game_start.wav',      genGameStart,      'Match start fanfare'],
  ['game_over.wav',       genGameOver,       'Game over chords'],
  ['ui_click.wav',        genUIClick,        'UI button click'],
];

console.log('Generating sounds:\n');
for (const [filename, generator, desc] of soundMap) {
  const samples = generator();
  writeWav(filename, samples);
}

console.log(`\n🎉 Done! Generated ${soundMap.length} sound effects.`);
console.log('All sounds are procedurally generated — royalty-free, no attribution needed.');
