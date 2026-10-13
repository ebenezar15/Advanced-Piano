// Piano roll: lesson notes fall onto the keys (preview), notes you play rise up from them.
// Velocity drives brightness and width; sustain pedal shows as a glowing band.

import { keyGeometry, LOW, HIGH } from './keyboard.js';

export class PianoRoll {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.geo = keyGeometry();
    this.notes = [];
    this.pedals = [];
    this.speed = 0.11; // px per ms
    this.colors = {};
    this.chordLabels = [];
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.c.width = Math.max(1, Math.round(r.width * dpr));
    this.c.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr;
    this.readColors();
  }

  readColors() {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue(n).trim();
    this.colors = {
      user: g('--roll-user') || '#7cf', example: g('--roll-example') || '#fc6', lh: g('--roll-lh') || '#9f7',
      grid: g('--roll-grid') || 'rgba(255,255,255,.05)', pedal: g('--roll-pedal') || 'rgba(255,200,80,.08)', text: g('--text') || '#fff',
    };
  }

  add(note) { this.notes.push(note); return note; }
  addPedal(p) { this.pedals.push(p); return p; }
  addLabel(l) { this.chordLabels.push(l); }
  clearKind(kind) {
    this.notes = this.notes.filter(n => n.kind !== kind);
    this.pedals = this.pedals.filter(p => p.kind !== kind);
    if (kind === 'example') this.chordLabels = [];
  }

  _loop() {
    this.draw();
    requestAnimationFrame(this._loop);
  }

  draw() {
    const { ctx, c } = this;
    const W = c.width, H = c.height, dpr = this.dpr;
    const now = performance.now();
    const sp = this.speed * dpr;
    ctx.clearRect(0, 0, W, H);

    // octave grid
    ctx.fillStyle = this.colors.grid;
    for (let m = LOW; m <= HIGH; m++) {
      if (m % 12 === 0) { const g = this.geo.get(m); ctx.fillRect(Math.round(g.x * W), 0, 1, H); }
    }

    // pedal bands
    for (const p of this.pedals) {
      const end = p.end ?? now;
      let y0, y1;
      if (p.kind === 'example') { y0 = H - (end - now) * sp; y1 = H - (p.start - now) * sp; }
      else { y0 = H - (now - p.start) * sp; y1 = H - (now - end) * sp; }
      y0 = Math.max(0, y0); y1 = Math.min(H, y1);
      if (y1 <= y0) continue;
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, this.colors.pedal); grd.addColorStop(0.5, 'transparent'); grd.addColorStop(1, this.colors.pedal);
      ctx.fillStyle = grd;
      ctx.fillRect(0, y0, W, y1 - y0);
      ctx.fillStyle = this.colors.pedal.replace(/[\d.]+\)$/, '0.6)');
      ctx.fillRect(0, y0, 3 * dpr, y1 - y0);
    }

    // notes
    const keep = [];
    for (const n of this.notes) {
      const g = this.geo.get(n.midi);
      if (!g) continue;
      const end = n.end ?? now;
      let top, bot;
      if (n.kind === 'example') {
        top = H - (end - now) * sp;
        bot = H - (n.start - now) * sp;
        bot = Math.min(bot, H);
        if (top >= H) continue; // finished
      } else {
        top = H - (now - n.start) * sp;
        bot = H - (now - end) * sp;
        if (bot < 0) continue;
      }
      keep.push(n);
      if (bot <= 0 || bot - top < 0.5) continue;
      top = Math.max(top, -10);
      const v = n.vel;
      const pad = g.black ? 0.5 : 1.5;
      const x = g.x * W + pad * dpr, w = g.w * W - pad * 2 * dpr;
      const color = n.kind === 'example' ? (n.hand === 'lh' ? this.colors.lh : this.colors.example) : this.colors.user;
      const active = n.kind === 'example' ? (now >= n.start && now <= end) : n.end === null;
      ctx.globalAlpha = 0.35 + v * 0.65;
      ctx.fillStyle = color;
      if (active) { ctx.shadowColor = color; ctx.shadowBlur = 14 * dpr * (0.5 + v); }
      roundRect(ctx, x, top, w, bot - top, Math.min(5 * dpr, w / 2));
      ctx.fill();
      ctx.shadowBlur = 0;
      // velocity tick at the onset
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + v * 0.6) + ')';
      const onsetY = n.kind === 'example' ? bot - 2 * dpr : top;
      if (onsetY > 0 && onsetY < H) ctx.fillRect(x + 1, onsetY, Math.max(1, (w - 2) * v), 2 * dpr);
      ctx.globalAlpha = 1;
    }
    this.notes = keep;
    this.pedals = this.pedals.filter(p => p.kind === 'example' ? (H - ((p.end ?? now) - now) * sp) < H : (p.end === null || (H - (now - p.end) * sp) > 0));

    // falling chord labels
    ctx.font = `600 ${12 * dpr}px "Avenir Next", Avenir, "Nunito Sans", sans-serif`;
    ctx.textBaseline = 'bottom';
    this.chordLabels = this.chordLabels.filter(l => H - (l.time - now) * sp > -40 * dpr && (now - l.time) < 1500);
    for (const l of this.chordLabels) {
      const y = H - (l.time - now) * sp;
      if (y < 14 * dpr || y > H + 40 * dpr) continue;
      const yy = Math.min(y, H - 2 * dpr);
      ctx.fillStyle = this.colors.text;
      ctx.globalAlpha = l.time <= now ? Math.max(0, 1 - (now - l.time) / 1500) : 0.85;
      ctx.fillText(l.text, 8 * dpr, yy);
      ctx.fillRect(0, yy, W, 1);
      ctx.globalAlpha = 1;
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
