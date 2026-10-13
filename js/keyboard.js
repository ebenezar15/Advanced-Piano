// 88-key keyboard (A0–C8) with velocity colouring, sustain glow and theory markers.

export const LOW = 21, HIGH = 108;
const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = m => BLACK.has(m % 12);

/** Geometry shared by keyboard and piano roll. Units are fractions of total width. */
export function keyGeometry() {
  const whites = [];
  for (let m = LOW; m <= HIGH; m++) if (!isBlack(m)) whites.push(m);
  const ww = 1 / whites.length;
  const geo = new Map();
  whites.forEach((m, i) => geo.set(m, { x: i * ww, w: ww, black: false }));
  const bw = ww * 0.62;
  // classic black-key offsets within an octave
  const offs = { 1: -0.08, 3: 0.08, 6: -0.1, 8: 0, 10: 0.1 };
  for (let m = LOW; m <= HIGH; m++) {
    if (!isBlack(m)) continue;
    const left = geo.get(m - 1);
    const cx = left.x + ww + offs[m % 12] * bw;
    geo.set(m, { x: cx - bw / 2, w: bw, black: true });
  }
  return geo;
}

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export class Keyboard {
  constructor(el, handlers) {
    this.el = el;
    this.h = handlers;
    this.keys = new Map();
    this.geo = keyGeometry();
    this.showNames = false;
    this.mouseDown = false;
    this.mouseNote = null;
    this._build();
  }

  _build() {
    this.el.innerHTML = '';
    this.el.classList.add('kb');
    for (const pass of [false, true]) {
      for (let m = LOW; m <= HIGH; m++) {
        if (isBlack(m) !== pass) continue;
        const g = this.geo.get(m);
        const k = document.createElement('div');
        k.className = 'key ' + (g.black ? 'black' : 'white');
        k.style.left = (g.x * 100) + '%';
        k.style.width = (g.w * 100) + '%';
        k.dataset.midi = m;
        const mark = document.createElement('span');
        mark.className = 'mark';
        k.appendChild(mark);
        if (!g.black) {
          const lab = document.createElement('span');
          lab.className = 'lab';
          lab.textContent = m % 12 === 0 ? 'C' + (Math.floor(m / 12) - 1) : '';
          k.appendChild(lab);
        }
        this.el.appendChild(k);
        this.keys.set(m, k);
      }
    }
    const velFromEvent = (e, k) => {
      const r = k.getBoundingClientRect();
      const y = ((e.touches ? e.touches[0].clientY : e.clientY) - r.top) / r.height;
      return Math.max(0.15, Math.min(1, 0.25 + y * 0.8));
    };
    const start = (e) => {
      const k = e.target.closest('.key');
      if (!k) return;
      e.preventDefault();
      this.mouseDown = true;
      const m = +k.dataset.midi;
      this.mouseNote = m;
      this.h.down(m, velFromEvent(e, k));
    };
    const move = (e) => {
      if (!this.mouseDown) return;
      const pt = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(pt.clientX, pt.clientY);
      const k = el && el.closest && el.closest('.key');
      if (!k) return;
      const m = +k.dataset.midi;
      if (m !== this.mouseNote) {
        if (this.mouseNote !== null) this.h.up(this.mouseNote);
        this.mouseNote = m;
        this.h.down(m, velFromEvent(e, k));
      }
    };
    const end = () => {
      if (!this.mouseDown) return;
      this.mouseDown = false;
      if (this.mouseNote !== null) this.h.up(this.mouseNote);
      this.mouseNote = null;
    };
    this.el.addEventListener('mousedown', start);
    this.el.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    this.el.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  }

  press(m, vel, kind = 'user') {
    const k = this.keys.get(m);
    if (!k) return;
    k.classList.add('down', kind);
    k.classList.remove('sus');
    k.style.setProperty('--vel', vel.toFixed(2));
  }
  release(m, sustained = false, kind) {
    const k = this.keys.get(m);
    if (!k) return;
    if (kind && !k.classList.contains(kind)) return;
    k.classList.remove('down', 'user', 'example');
    k.classList.toggle('sus', sustained);
  }
  unsustain(m) { const k = this.keys.get(m); if (k) k.classList.remove('sus'); }
  clearAll() { for (const k of this.keys.values()) k.classList.remove('down', 'user', 'example', 'sus'); }

  /** marks: Map midi -> {label, cls} */
  setMarks(marks) {
    for (const [m, k] of this.keys) {
      const mk = k.querySelector('.mark');
      const v = marks && marks.get(m);
      k.classList.toggle('marked', !!v);
      k.classList.remove('mk-root', 'mk-guide', 'mk-color', 'mk-scale', 'mk-lh', 'mk-rh');
      if (v) { mk.textContent = v.label || ''; if (v.cls) v.cls.split(' ').forEach(c => k.classList.add('mk-' + c)); }
      else mk.textContent = '';
    }
  }

  setNames(on) {
    this.showNames = on;
    for (const [m, k] of this.keys) {
      const lab = k.querySelector('.lab');
      if (lab) lab.textContent = on ? NAMES[m % 12].replace('♯', '#') + (m % 12 === 0 ? (Math.floor(m / 12) - 1) : '') : (m % 12 === 0 ? 'C' + (Math.floor(m / 12) - 1) : '');
    }
    this.el.classList.toggle('names', on);
  }

  scrollTo(m) {
    const wrap = this.el.closest('.kb-scroll');
    if (!wrap) return;
    const g = this.geo.get(m);
    wrap.scrollLeft = g.x * this.el.scrollWidth - wrap.clientWidth / 2;
  }
}
