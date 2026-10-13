// Web MIDI input/output: keyboards, controllers and audio-interface MIDI ports.

export class MidiHub {
  constructor() {
    this.access = null;
    this.inputId = 'all';
    this.outputId = 'none';
    this.listeners = { note: [], pedal: [], devices: [] };
    this.supported = 'requestMIDIAccess' in navigator;
    this.error = null;
  }

  on(type, fn) { this.listeners[type].push(fn); }
  _emit(type, ...a) { this.listeners[type].forEach(f => f(...a)); }

  async connect() {
    if (!this.supported) { this.error = 'This browser has no Web MIDI. Use Chrome, Edge or Opera on desktop.'; this._emit('devices'); return false; }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch (e) {
      this.error = 'MIDI permission was blocked.';
      this._emit('devices');
      return false;
    }
    this.access.onstatechange = () => { this._bind(); this._emit('devices'); };
    this._bind();
    this._emit('devices');
    return true;
  }

  get inputs() { return this.access ? [...this.access.inputs.values()] : []; }
  get outputs() { return this.access ? [...this.access.outputs.values()] : []; }
  get output() {
    if (!this.access || this.outputId === 'none') return null;
    return this.access.outputs.get(this.outputId) || null;
  }

  setInput(id) { this.inputId = id; this._bind(); this._emit('devices'); }
  setOutput(id) { this.allNotesOff(); this.outputId = id; this._emit('devices'); }

  _bind() {
    for (const input of this.inputs) {
      input.onmidimessage = (this.inputId === 'all' || input.id === this.inputId) ? e => this._handle(e) : null;
    }
  }

  _handle(e) {
    const [st, d1, d2] = e.data;
    const type = st & 0xf0;
    if (type === 0x90 && d2 > 0) this._emit('note', d1, d2 / 127, true);
    else if (type === 0x80 || (type === 0x90 && d2 === 0)) this._emit('note', d1, 0, false);
    else if (type === 0xb0 && d1 === 64) this._emit('pedal', d2 >= 64);
    else if (type === 0xb0 && (d1 === 123 || d1 === 120)) this._emit('pedal', false);
  }

  send(bytes, timestamp) {
    const out = this.output;
    if (!out) return;
    try { out.send(bytes, timestamp); } catch { }
  }
  noteOn(midi, vel, ts) { this.send([0x90, midi, Math.max(1, Math.min(127, Math.round(vel * 127)))], ts); }
  noteOff(midi, ts) { this.send([0x80, midi, 0], ts); }
  pedal(down, ts) { this.send([0xb0, 64, down ? 127 : 0], ts); }
  allNotesOff() {
    const out = this.output;
    if (!out) return;
    try { out.send([0xb0, 64, 0]); out.send([0xb0, 123, 0]); } catch { }
  }
}
