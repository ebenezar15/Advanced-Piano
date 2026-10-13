// Sampled grand piano (Salamander Grand, 3 velocity layers) on raw Web Audio.

const SAMPLE_NOTES = ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4',
  'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8'];
const LAYERS = [
  { id: 'v4', max: 0.4 },
  { id: 'v9', max: 0.74 },
  { id: 'v15', max: 1.01 },
];

function sampleMidi(name) {
  const pc = { C: 0, Ds: 3, Fs: 6, A: 9 }[name.replace(/\d+$/, '')];
  return (parseInt(name.match(/\d+$/)[0], 10) + 1) * 12 + pc;
}

export const VELOCITY_CURVES = {
  soft: v => Math.pow(v, 0.7),
  linear: v => v,
  hard: v => Math.pow(v, 1.4),
};

export class PianoEngine {
  constructor() {
    this.ctx = null;
    this.buffers = { v4: new Map(), v9: new Map(), v15: new Map() };
    this.loaded = 0;
    this.total = SAMPLE_NOTES.length * LAYERS.length;
    this.onProgress = () => {};
    this.curve = VELOCITY_CURVES.linear;
    this.ready = false;
  }

  async init() {
    if (this.ctx) { if (this.ctx.state !== 'running') await this.ctx.resume(); return; }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -10; this.comp.ratio.value = 3; this.comp.attack.value = 0.005; this.comp.release.value = 0.2;
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(2.6, 2.8);
    this.input = ctx.createGain();
    this.input.connect(this.dry); this.input.connect(this.reverb);
    this.reverb.connect(this.wet);
    this.dry.connect(this.comp); this.wet.connect(this.comp);
    this.comp.connect(this.master); this.master.connect(ctx.destination);
    this.setReverb(0.22);
    this._load();
  }

  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // early reflections + smooth diffuse tail
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < rate * 0.012 ? 0.2 : 1);
      }
    }
    return buf;
  }

  async _load() {
    const order = ['v9', 'v4', 'v15'];
    for (const layer of order) {
      await Promise.all(SAMPLE_NOTES.map(async name => {
        try {
          const res = await fetch(`samples/piano/${layer}/${name}.mp3`);
          const arr = await res.arrayBuffer();
          const buf = await this.ctx.decodeAudioData(arr);
          this.buffers[layer].set(sampleMidi(name), buf);
        } catch (e) { /* missing sample: fall back to neighbours */ }
        this.loaded++;
        this.onProgress(this.loaded / this.total);
      }));
      if (layer === 'v9') this.ready = true;
    }
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.now, 0.03); }
  setReverb(w) {
    if (!this.wet) return;
    this.wet.gain.setTargetAtTime(w * 0.9, this.now, 0.05);
    this.dry.gain.setTargetAtTime(1 - w * 0.35, this.now, 0.05);
  }
  async setOutput(deviceId) {
    if (this.ctx && typeof this.ctx.setSinkId === 'function') {
      await this.ctx.setSinkId(deviceId === 'default' ? '' : deviceId);
      return true;
    }
    return false;
  }

  _pick(midi, vel) {
    let order = vel < LAYERS[0].max ? ['v4', 'v9', 'v15'] : vel < LAYERS[1].max ? ['v9', 'v4', 'v15'] : ['v15', 'v9', 'v4'];
    for (const id of order) {
      const map = this.buffers[id];
      if (!map.size) continue;
      let best = null, bd = 99;
      for (const m of map.keys()) { const d = Math.abs(m - midi); if (d < bd) { bd = d; best = m; } }
      if (best !== null && bd <= 4) return { buf: map.get(best), root: best, layer: id };
    }
    return null;
  }

  /** Start a note. Returns a voice handle for stop(). */
  play(midi, velocity = 0.7, when = 0) {
    if (!this.ctx) return null;
    const ctx = this.ctx;
    const t = Math.max(when || 0, ctx.currentTime);
    const v = Math.max(0.02, Math.min(1, this.curve(velocity)));
    const g = ctx.createGain();
    // Within-layer dynamics: quieter notes are also slightly darker.
    const gain = 0.12 + Math.pow(v, 1.6) * 0.95;
    const s = this._pick(midi, v);
    let src;
    if (s) {
      src = ctx.createBufferSource();
      src.buffer = s.buf;
      src.playbackRate.value = Math.pow(2, (midi - s.root) / 12);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800 + v * 16000;
      src.connect(lp); lp.connect(g);
    } else {
      // fallback tone while samples load
      src = ctx.createOscillator();
      src.type = 'triangle';
      src.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      src.connect(g);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.004);
    if (!s) g.gain.setTargetAtTime(gain * 0.3, t + 0.01, 0.4);
    g.connect(this.input);
    src.start(t);
    const voice = { src, g, midi, stopped: false, sampled: !!s };
    // natural decay end
    const maxLen = s ? s.buf.duration / src.playbackRate.value : 4;
    src.stop(t + maxLen + 0.05);
    src.onended = () => { try { g.disconnect(); } catch { } };
    return voice;
  }

  /** Damp a voice. High strings (above F6) have no dampers, like a real piano. */
  stop(voice, when = 0) {
    if (!voice || voice.stopped || !this.ctx) return;
    voice.stopped = true;
    const t = Math.max(when || 0, this.ctx.currentTime);
    const undamped = voice.midi >= 90;
    const tau = undamped ? 0.9 : (voice.midi < 48 ? 0.16 : 0.09);
    try {
      voice.g.gain.cancelScheduledValues(t);
      voice.g.gain.setTargetAtTime(0, t, tau);
      voice.src.stop(t + tau * 8);
    } catch { }
  }

  /** Short percussive click for metronomes. */
  click(when = 0, accent = false, vol = 0.5) {
    if (!this.ctx) return;
    const t = Math.max(when, this.ctx.currentTime);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1180;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.25, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.06);
  }
}
