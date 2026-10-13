// Controller: ties audio, keyboard, roll, MIDI in/out, sustain pedal, dynamics, chord detection, recording and example playback.

import { detectChord, chordLabel, length as evLength } from './music.js';

export class Piano {
  constructor({ engine, keyboard, roll, midi }) {
    this.engine = engine; this.kb = keyboard; this.roll = roll; this.midi = midi;
    this.held = new Map();        // midi -> {voice, vel, rollNote}
    this.sustained = new Map();   // midi -> [voices] ringing via pedal
    this.pedalDown = false;
    this.pedalNote = null;
    this.listeners = { note: [], pedal: [], chord: [], vel: [], play: [], exchord: [] };
    this.velHistory = [];
    this.rec = null;
    this.take = null;
    this.player = null;
    this.thru = true;
    midi.on('note', (m, v, on) => on ? this.noteOn(m, v, 'midi') : this.noteOff(m));
    midi.on('pedal', d => this.setPedal(d));
  }

  on(t, f) { this.listeners[t].push(f); return () => this.listeners[t] = this.listeners[t].filter(x => x !== f); }
  _emit(t, ...a) { this.listeners[t].forEach(f => f(...a)); }

  // ------------------------------------------------------------- live playing
  noteOn(m, vel, source = 'user') {
    this.engine.init();
    if (this.held.has(m)) this.noteOff(m);
    if (this.sustained.has(m)) { this.sustained.get(m).forEach(v => this.engine.stop(v)); this.sustained.delete(m); }
    const voice = this.engine.play(m, vel);
    const rollNote = this.roll.add({ midi: m, start: performance.now(), end: null, vel, kind: 'user' });
    this.held.set(m, { voice, vel, rollNote });
    this.kb.press(m, vel, 'user');
    if (source !== 'midi' || this.thru) { if (source !== 'midi') this.midi.noteOn(m, vel); }
    this.velHistory.push(vel); if (this.velHistory.length > 48) this.velHistory.shift();
    if (this.rec) this.rec.events.push({ t: performance.now() - this.rec.t0, on: true, m, vel });
    this._emit('vel', vel);
    this._emit('note', m, vel, true);
    this._chord();
  }

  noteOff(m, source = 'user') {
    const h = this.held.get(m);
    if (!h) return;
    this.held.delete(m);
    h.rollNote.end = performance.now();
    if (this.pedalDown) {
      if (!this.sustained.has(m)) this.sustained.set(m, []);
      this.sustained.get(m).push(h.voice);
      this.kb.release(m, true);
    } else {
      this.engine.stop(h.voice);
      this.kb.release(m, false);
    }
    if (source !== 'midi') this.midi.noteOff(m);
    if (this.rec) this.rec.events.push({ t: performance.now() - this.rec.t0, on: false, m });
    this._emit('note', m, 0, false);
    this._chord();
  }

  setPedal(down) {
    if (down === this.pedalDown) return;
    this.pedalDown = down;
    if (down) this.pedalNote = this.roll.addPedal({ start: performance.now(), end: null, kind: 'user' });
    else {
      if (this.pedalNote) this.pedalNote.end = performance.now();
      for (const [m, voices] of this.sustained) {
        if (!this.held.has(m)) { voices.forEach(v => this.engine.stop(v)); this.kb.unsustain(m); }
      }
      this.sustained.clear();
    }
    this.midi.pedal(down);
    if (this.rec) this.rec.events.push({ t: performance.now() - this.rec.t0, pedal: down });
    this._emit('pedal', down);
    this._chord();
  }

  soundingNotes() { return [...new Set([...this.held.keys(), ...this.sustained.keys()])].sort((a, b) => a - b); }
  heldNotes() { return [...this.held.keys()].sort((a, b) => a - b); }

  _chord() {
    const held = this.heldNotes();
    const notes = held.length >= 2 ? held : this.soundingNotes();
    const c = detectChord(notes);
    this._emit('chord', c, notes);
  }

  panic() {
    this.stopExample();
    for (const m of [...this.held.keys()]) this.noteOff(m);
    this.setPedal(false);
    this.kb.clearAll();
    this.midi.allNotesOff();
  }

  // ------------------------------------------------------------- recording
  startRecording() { this.rec = { t0: performance.now(), events: [] }; }
  stopRecording() {
    if (!this.rec) return null;
    const r = this.rec; this.rec = null;
    const open = new Map(), events = [], pedal = [];
    let ps = null;
    for (const e of r.events) {
      const sec = e.t / 1000;
      if (e.pedal !== undefined) { if (e.pedal) ps = sec; else if (ps !== null) { pedal.push([ps, sec]); ps = null; } continue; }
      if (e.on) open.set(e.m, { t: sec, v: e.vel });
      else if (open.has(e.m)) { const o = open.get(e.m); open.delete(e.m); events.push({ t: o.t, d: Math.max(0.05, sec - o.t), n: [e.m], v: o.v }); }
    }
    const end = r.events.length ? r.events[r.events.length - 1].t / 1000 : 0;
    for (const [m, o] of open) events.push({ t: o.t, d: Math.max(0.05, end - o.t), n: [m], v: o.v });
    if (ps !== null) pedal.push([ps, end]);
    if (!events.length) return null;
    const t0 = Math.min(...events.map(e => e.t));
    this.take = {
      title: 'Your take', bpm: 60, swing: 0,
      events: events.map(e => ({ ...e, t: e.t - t0 })).sort((a, b) => a.t - b.t),
      pedal: pedal.map(([a, b]) => [Math.max(0, a - t0), b - t0]), chords: [],
    };
    return this.take;
  }

  // ------------------------------------------------------------- example playback
  /**
   * Play an example {events, bpm, swing, pedal, chords}.
   * opts: {bpm, loop, transpose, onEnd, onChord, id}
   */
  async playExample(example, opts = {}) {
    await this.engine.init();
    this.stopExample();
    const engine = this.engine;
    const bpm = opts.bpm || example.bpm || 90;
    const spb = 60 / bpm;
    const sw = 0.5 + (opts.swing ?? example.swing ?? 0) / 6;
    const warp = b => {
      if (sw === 0.5) return b;
      const beat = Math.floor(b + 1e-9), f = b - beat;
      return beat + (f <= 0.5 ? f / 0.5 * sw : sw + (f - 0.5) / 0.5 * (1 - sw));
    };
    const tr = opts.transpose || 0;
    const lenBeats = Math.max(1, Math.ceil(evLength(example.events) - 0.06));
    const loopSec = lenBeats * spb;
    const pedals = (example.pedal || []).map(([a, b]) => [warp(a) * spb, warp(b) * spb]);
    const items = example.events.map(e => {
      const s = warp(e.t) * spb, en = warp(e.t + e.d) * spb;
      let rel = en;
      for (const [a, b] of pedals) if (en >= a && en < b) rel = Math.max(rel, b);
      return { s, en, rel, notes: e.n.map(n => n + tr).filter(n => n >= 21 && n <= 108), v: e.v, hand: e.hand };
    }).sort((a, b) => a.s - b.s);
    const chords = (example.chords || []).map(c => ({ s: warp(c.t) * spb, sym: c.sym }));
    const latency = ((engine.ctx.outputLatency || 0) + (engine.ctx.baseLatency || 0)) * 1000;
    const st = {
      id: opts.id, startAudio: engine.now + 0.15, startPerf: performance.now() + 150 + latency,
      iter: 0, idxAudio: 0, idxRoll: 0, idxPedalRoll: 0, idxChord: 0, timers: new Set(), voices: new Set(), stopped: false,
      loop: !!opts.loop, items, loopSec, chords, pedals,
    };
    this.player = st;
    const schedule = () => {
      if (st.stopped) return;
      const nowA = engine.now, nowP = performance.now();
      // look ahead for the falling-notes preview (4 s) and audio (0.25 s)
      for (; ;) {
        const k = Math.floor(st.idxRoll / items.length);
        const it = items[st.idxRoll % items.length];
        if (!it || (!st.loop && k > 0)) break;
        const off = k * loopSec;
        const ps = st.startPerf + (it.s + off) * 1000;
        if (ps > nowP + 4000) break;
        for (const n of it.notes) this.roll.add({ midi: n, start: ps, end: st.startPerf + (it.en + off) * 1000, vel: it.v, kind: 'example', hand: it.hand });
        st.idxRoll++;
      }
      for (; ;) {
        const k = Math.floor(st.idxPedalRoll / Math.max(1, pedals.length));
        const p = pedals[st.idxPedalRoll % Math.max(1, pedals.length)];
        if (!p || (!st.loop && k > 0)) break;
        const off = k * loopSec;
        const ps = st.startPerf + (p[0] + off) * 1000;
        if (ps > nowP + 4000) break;
        this.roll.addPedal({ start: ps, end: st.startPerf + (p[1] + off) * 1000, kind: 'example' });
        // pedal indicator + MIDI out
        this._timer(st, ps - nowP, () => { this._emit('pedal', true, 'example'); this.midi.pedal(true); });
        this._timer(st, st.startPerf + (p[1] + off) * 1000 - nowP, () => { this._emit('pedal', this.pedalDown, 'example'); this.midi.pedal(false); });
        st.idxPedalRoll++;
      }
      for (; ;) {
        const k = Math.floor(st.idxChord / Math.max(1, chords.length));
        const c = chords[st.idxChord % Math.max(1, chords.length)];
        if (!c || (!st.loop && k > 0)) break;
        const ps = st.startPerf + (c.s + k * loopSec) * 1000;
        if (ps > nowP + 4000) break;
        this.roll.addLabel({ time: ps, text: chordLabel(c.sym) });
        this._timer(st, ps - nowP, () => { opts.onChord && opts.onChord(c.sym); this._emit('exchord', c.sym); });
        st.idxChord++;
      }
      for (; ;) {
        const k = Math.floor(st.idxAudio / items.length);
        const it = items[st.idxAudio % items.length];
        if (!st.loop && k > 0) {
          const endIn = (st.startAudio + loopSec - nowA) * 1000 + 600;
          if (!st.endTimer) st.endTimer = this._timer(st, Math.max(endIn, (Math.max(...items.map(i => i.rel)) + st.startAudio - nowA) * 1000 + 200), () => { this.stopExample(); opts.onEnd && opts.onEnd(); });
          break;
        }
        const off = k * loopSec;
        const ta = st.startAudio + it.s + off;
        if (ta > nowA + 0.3) break;
        for (const n of it.notes) {
          const v = engine.play(n, it.v, ta);
          if (v) { st.voices.add(v); engine.stop(v, st.startAudio + it.rel + off); }
          const delay = (ta - nowA) * 1000 + latency;
          const ts = performance.now() + (ta - nowA) * 1000;
          this.midi.noteOn(n, it.v, ts);
          this.midi.noteOff(n, ts + (it.en - it.s) * 1000);
          this._timer(st, delay, () => { this.kb.press(n, it.v, 'example'); this.velHistory.push(it.v); if (this.velHistory.length > 48) this.velHistory.shift(); this._emit('vel', it.v); });
          this._timer(st, delay + (it.en - it.s) * 1000, () => this.kb.release(n, it.rel > it.en + 0.01, 'example'));
          if (it.rel > it.en + 0.01) this._timer(st, delay + (it.rel - it.s) * 1000, () => this.kb.unsustain(n));
        }
        st.idxAudio++;
      }
    };
    schedule();
    st.interval = setInterval(schedule, 40);
    this._emit('play', opts.id, true);
    return st;
  }

  _timer(st, ms, fn) {
    const id = setTimeout(() => { st.timers.delete(id); if (!st.stopped) fn(); }, Math.max(0, ms));
    st.timers.add(id);
    return id;
  }

  stopExample() {
    const st = this.player;
    if (!st) return;
    st.stopped = true;
    clearInterval(st.interval);
    st.timers.forEach(clearTimeout);
    st.voices.forEach(v => this.engine.stop(v));
    this.roll.clearKind('example');
    for (const k of this.kb.keys.values()) k.classList.contains('example') && k.classList.remove('down', 'example', 'sus');
    this.kb.keys.forEach(k => { if (!k.classList.contains('down')) k.classList.remove('sus'); });
    this.midi.allNotesOff();
    this.player = null;
    this._emit('pedal', this.pedalDown, 'example');
    this._emit('play', st.id, false);
  }

  get playingId() { return this.player ? this.player.id : null; }

  /** Play a single chord/set of notes immediately (for explorers). */
  async strike(notes, { vel = 0.7, dur = 1.6, arp = 0, hand } = {}) {
    const events = notes.map((n, i) => ({ t: i * arp, d: dur, n: [n], v: vel, hand }));
    return this.playExample({ events, bpm: 60, pedal: [], chords: [] });
  }
}
