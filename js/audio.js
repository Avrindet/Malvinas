/**
 * Audio — Marcha de las Malvinas (banda militar sintetizada o MP3 opcional) y ambiente de combate.
 */
import { MENU_MUSIC } from './config.js';
import {
  MARCHA_MALVINAS, beatIntervalSec,
  createMarchReverb, connectMarchBus, scheduleMarchStep, playMarchDrumBeat,
} from './marcha-band.js';
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.muted = false;
    this.musicMode = null;
    this.musicNodes = [];
    this.melodyTimeout = null;
    this.windRaf = null;
    this.windGustTimer = null;
    this._melodyStep = 0;
    this._bassStep = 0;
    this._menuGain = null;
    this._windGain = null;
    this._windFilter = null;
    this._windNoise = null;
    this._windLfo = null;
    this._windLfoGain = null;
    this._windGustGain = null;
    this._windHowl = null;
    this._howlGain = null;
    this._windIntensity = 0.35;
    this._windTargetIntensity = 0.35;
    this._gustPhase = 0;
    this.unlocked = false;
    this._ambientProfile = null;
    this._wavesGain = null;
    this._wavesNoise = null;
    this._wavesFilter = null;
    this._seagullTimer = null;
    this._wavesLevel = 0.03;
    this._wavesTarget = 0.03;
    this._marchDrumInterval = null;
    this._marchBeat = 0;
    this._marchBus = null;
    this._marchReverb = null;
    this._marchaAudio = null;
    this._marchaAudioGain = null;
  }

  get musicRunning() {
    return this.musicMode !== null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);

    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.85;
    this.sfx.connect(this.master);

    this.music = this.ctx.createGain();
    this.music.gain.value = 0.28;
    this.music.connect(this.master);
  }

  async unlock() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }
    this.unlocked = this.ctx.state === 'running';
    return this.unlocked;
  }

  isUnlocked() {
    return this.unlocked && this.ctx?.state === 'running';
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return !this.muted;
  }

  isMuted() {
    return this.muted;
  }

  _now() {
    return this.ctx.currentTime;
  }

  _env(gain, t0, peak, dur, out = 0.001) {
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(out, t0 + dur);
  }

  _fadeMusicLevel(level, dur = 0.6) {
    if (!this.music) return;
    const t = this._now();
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setValueAtTime(this.music.gain.value, t);
    this.music.gain.linearRampToValueAtTime(level, t + dur);
  }

  _stopMusic() {
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
    if (this._marchDrumInterval) {
      clearInterval(this._marchDrumInterval);
      this._marchDrumInterval = null;
    }
    if (this._marchaAudio) {
      try {
        this._marchaAudio.pause();
        this._marchaAudio.currentTime = 0;
      } catch { /* ok */ }
    }
    if (this.windGustTimer) {
      clearInterval(this.windGustTimer);
      this.windGustTimer = null;
    }
    if (this.windRaf) {
      cancelAnimationFrame(this.windRaf);
      this.windRaf = null;
    }
    for (const node of this.musicNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect?.();
      } catch { /* ya detenido */ }
    }
    this.musicNodes = [];
    this._menuGain = null;
    this._marchBus = null;
    this._marchReverb = null;
    this._windGain = null;
    this._windFilter = null;
    this._windNoise = null;
    this._windLfo = null;
    this._windLfoGain = null;
    this._windGustGain = null;
    this._windHowl = null;
    this._howlGain = null;
    this._stopAmbient();
    this.musicMode = null;
    this._melodyStep = 0;
    this._bassStep = 0;
    this._marchBeat = 0;
  }

  _noise(t0, dur, peak, freq = 800, q = 0.6, dest = this.sfx) {
    const bufferSize = Math.ceil(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this._env(g, t0, peak, dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  _playTone(freq, t0, dur, peak, type = 'triangle', dest) {
    if (!freq || freq === 'rest') return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), t0 + 0.02);
    g.gain.setValueAtTime(peak * 0.85, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    this.musicNodes.push(osc, g);
  }

  _startMarchRecording() {
    const cfg = MENU_MUSIC || {};
    if (!cfg.useRecording || !cfg.recordingUrl) return false;

    if (!this._marchaAudio) {
      this._marchaAudio = new Audio(cfg.recordingUrl);
      this._marchaAudio.loop = true;
      this._marchaAudio.preload = 'auto';
    }

    if (!this._marchaMediaSource) {
      try {
        this._marchaAudioGain = this.ctx.createGain();
        this._marchaAudioGain.gain.value = 0.55;
        this._marchaAudioGain.connect(this.music);
        this._marchaMediaSource = this.ctx.createMediaElementSource(this._marchaAudio);
        this._marchaMediaSource.connect(this._marchaAudioGain);
        this.musicNodes.push(this._marchaAudioGain);
      } catch {
        this._marchaAudio = null;
        return false;
      }
    }

    const played = this._marchaAudio.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => {
        this._marchaAudio?.pause();
      });
    }
    return true;
  }

  _scheduleMarchaMelody() {
    if (this.musicMode !== 'menu' || !this.ctx || !this._marchBus) return;

    const note = MARCHA_MALVINAS[this._melodyStep % MARCHA_MALVINAS.length];
    const t = this._now() + 0.02;

    scheduleMarchStep(
      this.ctx, this._marchBus, this.musicNodes,
      this._melodyStep, this._bassStep, t,
    );

    const waitMs = note.d * 1000;
    this._melodyStep++;
    if (note.d >= 0.55) this._bassStep++;

    this.melodyTimeout = setTimeout(() => this._scheduleMarchaMelody(), waitMs);
  }

  _startMarchDrums() {
    const beatMs = beatIntervalSec() * 1000;
    this._marchBeat = 0;
    this._marchDrumInterval = setInterval(() => {
      if (this.musicMode !== 'menu' || !this._marchBus) return;
      playMarchDrumBeat(this.ctx, this._marchBus, this.musicNodes, this._marchBeat, this._now());
      this._marchBeat++;
    }, beatMs);
  }

  startMenuMusic() {
    if (!this.ctx || this.muted) return;
    if (this.musicMode === 'menu') return;

    this._stopMusic();
    this.musicMode = 'menu';
    this._fadeMusicLevel(MENU_MUSIC?.useRecording ? 0.38 : 0.32, 0.01);

    const t = this._now();
    this._menuGain = this.ctx.createGain();
    this._menuGain.gain.setValueAtTime(0.001, t);
    this._menuGain.gain.linearRampToValueAtTime(1, t + 1.4);
    this._menuGain.connect(this.music);
    this.musicNodes.push(this._menuGain);

    if (this._startMarchRecording()) {
      return;
    }

    this._marchReverb = createMarchReverb(this.ctx);
    this.musicNodes.push(this._marchReverb.convolver, this._marchReverb.wet, this._marchReverb.dry);
    this._marchBus = connectMarchBus(this.ctx, this._menuGain, this._marchReverb);
    this.musicNodes.push(this._marchBus);

    this._melodyStep = 0;
    this._bassStep = 0;
    this._startMarchDrums();
    this._scheduleMarchaMelody();
  }

  startCombatWind() {
    if (!this.ctx || this.muted) return;
    if (this.musicMode === 'combat') return;

    this._stopMusic();
    this.musicMode = 'combat';
    this._fadeMusicLevel(0.26, 0.01);

    const t = this._now();
    const sr = this.ctx.sampleRate;
    const bufferSize = sr * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    this._windNoise = this.ctx.createBufferSource();
    this._windNoise.buffer = buffer;
    this._windNoise.loop = true;

    this._windFilter = this.ctx.createBiquadFilter();
    this._windFilter.type = 'bandpass';
    this._windFilter.frequency.value = 320;
    this._windFilter.Q.value = 0.35;

    this._windLfo = this.ctx.createOscillator();
    this._windLfo.type = 'sine';
    this._windLfo.frequency.value = 0.12;
    this._windLfoGain = this.ctx.createGain();
    this._windLfoGain.gain.value = 180;
    this._windLfo.connect(this._windLfoGain);
    this._windLfoGain.connect(this._windFilter.frequency);

    this._windGustGain = this.ctx.createGain();
    this._windGustGain.gain.value = 0.35;

    this._windGain = this.ctx.createGain();
    this._windGain.gain.setValueAtTime(0.001, t);
    this._windGain.gain.linearRampToValueAtTime(1, t + 2.5);

    this._windHowl = this.ctx.createOscillator();
    this._windHowl.type = 'sine';
    this._windHowl.frequency.value = 95;
    this._howlGain = this.ctx.createGain();
    this._howlGain.gain.value = 0.04;

    this._windNoise.connect(this._windFilter);
    this._windFilter.connect(this._windGustGain);
    this._windGustGain.connect(this._windGain);
    this._windGain.connect(this.music);
    this._windHowl.connect(this._howlGain);
    this._howlGain.connect(this.music);

    this._windNoise.start(t);
    this._windLfo.start(t);
    this._windHowl.start(t);

    this.musicNodes.push(
      this._windNoise, this._windFilter, this._windLfo, this._windLfoGain,
      this._windGustGain, this._windGain, this._windHowl, this._howlGain,
    );

    this._gustPhase = 0;
    const animateWind = () => {
      if (this.musicMode !== 'combat' || !this._windGustGain) return;
      this._gustPhase += 0.016;
      this._windIntensity += (this._windTargetIntensity - this._windIntensity) * 0.045;
      const int = this._windIntensity;
      const base = 0.18 + int * 0.42 + Math.sin(this._gustPhase * 0.7) * 0.1 * int;
      const gust = Math.max(0, Math.sin(this._gustPhase * 2.3)) * 0.28 * int;
      this._windGustGain.gain.value = base + gust;
      if (this._windFilter) {
        this._windFilter.frequency.value = 200 + int * 320;
        this._windFilter.Q.value = 0.2 + int * 0.35 + Math.sin(this._gustPhase * 1.1) * 0.12;
      }
      if (this._windLfo) {
        this._windLfo.frequency.value = 0.07 + int * 0.28;
      }
      if (this._howlGain) {
        this._howlGain.gain.value = 0.015 + int * 0.06;
      }
      if (this._windHowl) {
        this._windHowl.frequency.value = 72 + int * 45;
      }
      this.windRaf = requestAnimationFrame(animateWind);
    };
    this.windRaf = requestAnimationFrame(animateWind);

    this.windGustTimer = setInterval(() => {
      if (this.musicMode !== 'combat' || !this._windGain || this.muted) return;
      const chance = 0.25 + this._windIntensity * 0.45;
      if (Math.random() > chance) return;
      const gt = this._now();
      const peak = 1.2 + this._windIntensity * 0.55;
      this._windGain.gain.cancelScheduledValues(gt);
      this._windGain.gain.setValueAtTime(this._windGain.gain.value, gt);
      this._windGain.gain.linearRampToValueAtTime(peak, gt + 0.35);
      this._windGain.gain.linearRampToValueAtTime(1, gt + 1.6 + this._windIntensity);
    }, 2800);
  }

  updateCombatWind(weather) {
    if (this.musicMode !== 'combat' || !weather) return;
    let target = 0.3;
    if (weather.baseType === 'wind') target += 0.24;
    if (weather.baseType === 'rain') target += 0.12;
    if (weather.fogWarningActive) target += 0.16;
    if (weather.fogActive) target += 0.2 + weather.fogIntensity * 0.42;
    this._windTargetIntensity = Math.min(1.1, target);
  }

  _stopAmbient() {
    if (this._seagullTimer) {
      clearInterval(this._seagullTimer);
      this._seagullTimer = null;
    }
    for (const key of ['_wavesNoise', '_wavesFilter', '_wavesGain']) {
      const node = this[key];
      if (node) {
        try {
          if (node.stop) node.stop();
          node.disconnect?.();
        } catch { /* ok */ }
        this[key] = null;
      }
    }
    this._ambientProfile = null;
  }

  startCombatAmbience(profile) {
    if (!this.ctx || this.muted) return;
    this._stopAmbient();
    this._ambientProfile = profile;
    this._startWavesLoop();
    if (profile?.seagulls) {
      this._seagullTimer = setInterval(() => {
        if (this.musicMode !== 'combat' || this.muted) return;
        if (Math.random() < 0.38) this._playSeagull();
      }, 9000 + Math.random() * 11000);
    }
  }

  _startWavesLoop() {
    const t = this._now();
    const sr = this.ctx.sampleRate;
    const bufferSize = sr * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, sr);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    this._wavesNoise = this.ctx.createBufferSource();
    this._wavesNoise.buffer = buffer;
    this._wavesNoise.loop = true;

    this._wavesFilter = this.ctx.createBiquadFilter();
    this._wavesFilter.type = 'lowpass';
    this._wavesFilter.frequency.value = 420;
    this._wavesFilter.Q.value = 0.4;

    this._wavesGain = this.ctx.createGain();
    this._wavesGain.gain.setValueAtTime(0.001, t);
    this._wavesGain.gain.linearRampToValueAtTime(this._ambientProfile?.coastal ? 0.045 : 0.02, t + 2);

    this._wavesNoise.connect(this._wavesFilter);
    this._wavesFilter.connect(this._wavesGain);
    this._wavesGain.connect(this.music);
    this._wavesNoise.start(t);
    this.musicNodes.push(this._wavesNoise, this._wavesFilter, this._wavesGain);
  }

  updateCombatAmbience(nearWater = false) {
    if (this.musicMode !== 'combat') return;
    const coastal = this._ambientProfile?.coastal;
    this._wavesTarget = nearWater ? (coastal ? 0.11 : 0.07) : (coastal ? 0.035 : 0.018);
    if (this._wavesGain) {
      const t = this._now();
      this._wavesLevel += (this._wavesTarget - this._wavesLevel) * 0.04;
      this._wavesGain.gain.setTargetAtTime(this._wavesLevel, t, 0.35);
    }
  }

  _playSeagull() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const freqs = [880 + Math.random() * 120, 920 + Math.random() * 80, 760 + Math.random() * 100];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      this._env(g, t + i * 0.09, 0.04, 0.08);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.1);
    });
  }

  playFootstep() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    this._noise(t, 0.05, 0.05, 250 + Math.random() * 80, 1.4);
  }

  /** @deprecated Usar startMenuMusic o startCombatWind */
  startMusic() {
    this.startMenuMusic();
  }

  stopMusic() {
    this._fadeMusicLevel(0.001, 0.5);
    setTimeout(() => this._stopMusic(), 520);
  }

  duckMusic(duck = true) {
    if (!this.music) return;
    const level = duck ? 0.04 : (this.musicMode === 'menu' ? 0.3 : 0.26);
    this._fadeMusicLevel(level, 0.25);
  }

  playGunshot(weaponIndex = 0) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const loud = weaponIndex === 1 ? 0.35 : weaponIndex === 3 ? 0.45 : 0.28;
    const freq = weaponIndex === 3 ? 120 : weaponIndex === 1 ? 200 : 450;
    this._noise(t, weaponIndex === 3 ? 0.18 : 0.07, loud, freq, 0.8);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(weaponIndex === 3 ? 80 : 140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    this._env(g, t, loud * 0.4, 0.08);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playReload() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 900 - i * 200;
      this._env(g, t + i * 0.12, 0.15, 0.04);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.06);
    }
  }

  playGrenadeThrow() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.22);
    this._env(g, t, 0.12, 0.22);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playExplosion() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    this._noise(t, 0.35, 0.5, 180, 0.5);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
    this._env(g, t, 0.35, 0.4);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  playHit() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    this._env(g, t, 0.2, 0.15);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playAlert(type = 'attack') {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const steps = type === 'fog' ? 3 : 4;
    for (let i = 0; i < steps; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      const base = type === 'fog' ? 440 : type === 'boss' ? 520 : 580;
      osc.frequency.value = base + (i % 2) * (type === 'fog' ? 80 : 120);
      this._env(g, t + i * 0.18, type === 'fog' ? 0.08 : 0.12, 0.14);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.16);
    }
  }

  playRescue() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      this._env(g, t + i * 0.08, 0.1, 0.12);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.14);
    });
  }

  playHeal() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      this._env(g, t + i * 0.07, 0.09, 0.1);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.12);
    });
  }

  playVictory(fanfare = false) {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const notes = fanfare
      ? [392, 494, 587, 784, 988, 784]
      : [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      this._env(g, t + i * 0.14, fanfare ? 0.18 : 0.14, fanfare ? 0.35 : 0.28);
      osc.connect(g);
      g.connect(this.sfx);
      osc.start(t + i * 0.14);
      osc.stop(t + i * 0.14 + (fanfare ? 0.38 : 0.3));
    });
  }
}
