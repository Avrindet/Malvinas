/**
 * Marcha de las Malvinas (José Tieri, 1940) — arreglo tipo banda militar.
 * Síntesis Web Audio: metales, contrabajo, percusión y reverberación.
 */

export const NOTE = {
  G2: 98.0, A2: 110.0, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0,
  A3: 220.0, Bb3: 233.08, B3: 246.94, C4: 261.63, D4: 293.66,
  E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

/** Compás de marcha ~108 BPM (negra ≈ 0,556 s). */
export const MARCH_BPM = 108;

export const MARCHA_MALVINAS = [
  { n: 'C5', d: 0.55 }, { n: 'C5', d: 0.55 }, { n: 'D5', d: 0.55 }, { n: 'E5', d: 0.85 },
  { n: 'F5', d: 0.35 }, { n: 'E5', d: 0.55 }, { n: 'D5', d: 0.55 }, { n: 'C5', d: 0.55 },
  { n: 'A4', d: 0.55 }, { n: 'C5', d: 0.55 }, { n: 'D5', d: 0.55 }, { n: 'E5', d: 1.1 },
  { n: 'F5', d: 0.55 }, { n: 'F5', d: 0.55 }, { n: 'E5', d: 0.55 }, { n: 'D5', d: 0.55 },
  { n: 'C5', d: 0.55 }, { n: 'A4', d: 0.55 }, { n: 'G4', d: 1.1 },
  { n: 'C5', d: 0.55 }, { n: 'C5', d: 0.55 }, { n: 'D5', d: 0.55 }, { n: 'C5', d: 1.1 },
  { n: 'rest', d: 0.55 },
  { n: 'C5', d: 0.55 }, { n: 'C5', d: 0.55 }, { n: 'D5', d: 0.55 }, { n: 'E5', d: 0.55 },
  { n: 'F5', d: 0.85 }, { n: 'E5', d: 0.35 }, { n: 'D5', d: 0.55 }, { n: 'C5', d: 0.55 },
  { n: 'D5', d: 0.55 }, { n: 'E5', d: 1.1 },
  { n: 'F5', d: 0.55 }, { n: 'G5', d: 0.55 }, { n: 'A5', d: 0.55 }, { n: 'G5', d: 0.55 },
  { n: 'F5', d: 0.55 }, { n: 'E5', d: 1.1 },
  { n: 'C5', d: 0.55 }, { n: 'E5', d: 0.55 }, { n: 'G5', d: 0.55 }, { n: 'C5', d: 1.65 },
  { n: 'rest', d: 0.85 },
];

export const MARCHA_BASS = [
  { n: 'C3', d: 1.1 }, { n: 'C3', d: 1.1 }, { n: 'F3', d: 1.1 }, { n: 'C3', d: 1.1 },
  { n: 'G3', d: 1.1 }, { n: 'C3', d: 1.1 }, { n: 'F3', d: 1.1 }, { n: 'G3', d: 1.1 },
  { n: 'C3', d: 1.1 }, { n: 'A2', d: 1.1 }, { n: 'F3', d: 1.1 }, { n: 'G3', d: 1.1 },
  { n: 'C3', d: 2.2 },
];

/** Quinta justa debajo para armonía de metales. */
function harmonyBelow(noteName) {
  const order = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const m = noteName.match(/^([A-G])(b?)(\d)$/);
  if (!m) return null;
  const idx = order.indexOf(m[1]);
  if (idx < 0) return null;
  const hi = Math.max(2, parseInt(m[3], 10) - 1);
  const lo = (idx + 4) % 7;
  const flat = m[2] || (lo === 3 || lo === 5 ? 'b' : '');
  return `${order[lo]}${flat}${hi}`;
}

export function createMarchReverb(ctx, duration = 2.2, decay = 2.8) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  const dry = ctx.createGain();
  dry.gain.value = 0.88;
  return { convolver, wet, dry };
}

export function connectMarchBus(ctx, menuGain, reverb) {
  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(menuGain);
  bus.connect(reverb.dry);

  const send = ctx.createGain();
  send.gain.value = 0.35;
  bus.connect(send);
  send.connect(reverb.convolver);
  reverb.convolver.connect(reverb.wet);
  reverb.wet.connect(menuGain);

  return bus;
}

function brassEnvelope(gain, t0, dur, peak) {
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.028);
  gain.gain.linearRampToValueAtTime(peak * 0.82, t0 + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.04);
}

export function playBrassNote(ctx, freq, t0, dur, peak, dest, nodes) {
  if (!freq) return;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(650, t0);
  filter.frequency.linearRampToValueAtTime(2800, t0 + 0.04);
  filter.frequency.exponentialRampToValueAtTime(780, t0 + dur);
  filter.Q.value = 0.9;

  const out = ctx.createGain();
  brassEnvelope(out, t0, dur, peak);

  const vib = ctx.createOscillator();
  vib.frequency.value = 5.2;
  const vibAmt = ctx.createGain();
  vibAmt.gain.value = freq * 0.0035;

  const layers = [
    { type: 'sawtooth', detune: 0, level: 0.42 },
    { type: 'square', detune: 4, level: 0.12 },
    { type: 'triangle', detune: -7, level: 0.18 },
  ];

  for (const layer of layers) {
    const osc = ctx.createOscillator();
    osc.type = layer.type;
    osc.frequency.value = freq;
    osc.detune.value = layer.detune;
    vib.connect(vibAmt);
    vibAmt.connect(osc.frequency);
    const lg = ctx.createGain();
    lg.gain.value = layer.level;
    osc.connect(lg);
    lg.connect(filter);
    osc.start(t0);
    osc.stop(t0 + dur + 0.08);
    nodes.push(osc, lg);
  }

  vib.start(t0);
  vib.stop(t0 + dur + 0.08);

  filter.connect(out);
  out.connect(dest);
  nodes.push(filter, out, vib, vibAmt);
}

export function playTubaNote(ctx, freq, t0, dur, peak, dest, nodes) {
  if (!freq) return;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.6;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.linearRampToValueAtTime(peak, t0 + 0.04);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = freq * 0.5;

  const mix = ctx.createGain();
  mix.gain.value = 0.55;
  osc.connect(mix);
  sub.connect(mix);
  mix.connect(filter);
  filter.connect(out);
  out.connect(dest);

  osc.start(t0);
  sub.start(t0);
  osc.stop(t0 + dur + 0.05);
  sub.stop(t0 + dur + 0.05);
  nodes.push(osc, sub, mix, filter, out);
}

export function playMarchKick(ctx, t0, dest, nodes, peak = 0.38) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t0);
  osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.12);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + 0.16);
  nodes.push(osc, g);
}

export function playMarchSnare(ctx, t0, dest, nodes, peak = 0.14) {
  const len = Math.ceil(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.65;

  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);

  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + 0.13);
  nodes.push(src, bp, g);
}

export function playMarchCymbal(ctx, t0, dest, nodes, peak = 0.06) {
  const len = Math.ceil(ctx.sampleRate * 0.35);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5200;

  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);

  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + 0.34);
  nodes.push(src, hp, g);
}

export function scheduleMarchStep(ctx, dest, nodes, melodyStep, bassStep, t0) {
  const note = MARCHA_MALVINAS[melodyStep % MARCHA_MALVINAS.length];
  const bass = MARCHA_BASS[bassStep % MARCHA_BASS.length];
  const dur = note.d * 0.96;

  if (note.n !== 'rest') {
    const freq = NOTE[note.n];
    playBrassNote(ctx, freq, t0, dur, 0.11, dest, nodes);
    const harmName = harmonyBelow(note.n);
    if (harmName && NOTE[harmName]) {
      playBrassNote(ctx, NOTE[harmName], t0, dur * 0.92, 0.045, dest, nodes);
    }
  }

  if (bass.n !== 'rest') {
    playTubaNote(ctx, NOTE[bass.n], t0, bass.d * 0.95, 0.1, dest, nodes);
  }
}

export function playMarchDrumBeat(ctx, dest, nodes, beatIndex, t0) {
  const b = beatIndex % 4;
  if (b === 0 || b === 2) playMarchKick(ctx, t0, dest, nodes);
  if (b === 1 || b === 3) playMarchSnare(ctx, t0, dest, nodes);
  if (beatIndex > 0 && beatIndex % 16 === 0) {
    playMarchCymbal(ctx, t0, dest, nodes);
  }
}

export function beatIntervalSec() {
  return 60 / MARCH_BPM;
}
