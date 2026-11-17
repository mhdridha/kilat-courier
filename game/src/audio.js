// Kilat Courier — every sound is synthesized with WebAudio, so the game
// ships zero audio files and never touches the network. All calls are
// guarded: with no user gesture yet (or in a headless screenshot run)
// there is no AudioContext and every function just returns.
let ctx = null;
let engineOsc = null;
let engineOsc2 = null;
let engineGain = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch (e) {
    return null;
  }
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (engineGain) engineGain.gain.value = muted ? 0 : 0.045;
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch (e) {
    /* audio is garnish, never fatal */
  }
}

function noiseBurst(dur, vol, cutoff) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  } catch (e) {
    /* audio is garnish, never fatal */
  }
}

export function sfxPickup() {
  tone(660, 0.09, 'sine', 0.16, 0, 990);
}

export function sfxDeliver(combo) {
  const base = 523 + Math.min(combo, 5) * 40;
  tone(base, 0.12, 'triangle', 0.2);
  tone(base * 1.25, 0.12, 'triangle', 0.2, 0.09);
  tone(base * 1.5, 0.2, 'triangle', 0.22, 0.18);
}

export function sfxCrash() {
  noiseBurst(0.28, 0.5, 900);
  tone(110, 0.3, 'sawtooth', 0.25, 0, 45);
}

export function sfxClick() {
  tone(880, 0.05, 'square', 0.08);
}

export function sfxBoost() {
  noiseBurst(0.35, 0.16, 2400);
}

export function sfxNearMiss() {
  tone(1180, 0.07, 'sine', 0.14, 0, 1560);
}

export function sfxLevelUp() {
  tone(523, 0.1, 'triangle', 0.2);
  tone(659, 0.1, 'triangle', 0.2, 0.09);
  tone(784, 0.18, 'triangle', 0.22, 0.18);
}

export function sfxPowerup() {
  tone(880, 0.08, 'sine', 0.16, 0, 1320);
  tone(1320, 0.12, 'sine', 0.14, 0.07);
}

export function sfxGameOver() {
  tone(392, 0.22, 'triangle', 0.2);
  tone(311, 0.22, 'triangle', 0.2, 0.2);
  tone(233, 0.45, 'triangle', 0.22, 0.4);
}

export function startEngine() {
  if (muted) return;
  const c = ensureCtx();
  if (!c || engineOsc) return;
  try {
    engineOsc = c.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 52;
    engineOsc2 = c.createOscillator();
    engineOsc2.type = 'square';
    engineOsc2.frequency.value = 26;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    engineGain = c.createGain();
    engineGain.gain.value = 0.045;
    engineOsc.connect(f);
    engineOsc2.connect(f);
    f.connect(engineGain).connect(c.destination);
    engineOsc.start();
    engineOsc2.start();
  } catch (e) {
    /* audio is garnish, never fatal */
  }
}

export function setEngine(speedNorm, boosting) {
  if (!ctx || !engineOsc || muted) return;
  try {
    const f = 48 + speedNorm * 70 + (boosting ? 26 : 0);
    engineOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
    engineOsc2.frequency.setTargetAtTime(f / 2, ctx.currentTime, 0.08);
  } catch (e) {
    /* audio is garnish, never fatal */
  }
}

export function stopEngine() {
  try {
    if (engineOsc) engineOsc.stop();
    if (engineOsc2) engineOsc2.stop();
  } catch (e) {
    /* already stopped */
  }
  engineOsc = null;
  engineOsc2 = null;
  engineGain = null;
}
