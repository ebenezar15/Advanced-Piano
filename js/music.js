// Music theory engine: notes, chords, scales, voicings, sequences, detection, reharmonization.

export const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const KEY_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_KEYS = new Set([1, 3, 5, 8, 10]);

const PC_OF = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pcOf(name) {
  const m = /^([A-Ga-g])([#b♯♭]*)/.exec(name);
  if (!m) return null;
  let pc = PC_OF[m[1].toUpperCase()];
  for (const a of m[2]) pc += (a === '#' || a === '♯') ? 1 : -1;
  return ((pc % 12) + 12) % 12;
}

/** 'C4' -> 60, 'Bb3' -> 58 */
export function N(name) {
  const m = /^([A-Ga-g][#b]*)(-?\d)$/.exec(name.trim());
  if (!m) throw new Error('Bad note ' + name);
  const base = PC_OF[m[1][0].toUpperCase()];
  let acc = 0;
  for (const a of m[1].slice(1)) acc += a === '#' ? 1 : -1;
  return (parseInt(m[2], 10) + 1) * 12 + base + acc;
}

export function pcName(pc, preferFlat = true) {
  return (preferFlat ? FLAT : SHARP)[((pc % 12) + 12) % 12];
}
export function midiName(m, preferFlat = true) {
  return pcName(m % 12, preferFlat) + (Math.floor(m / 12) - 1);
}
export function pretty(s) {
  return String(s).replace(/b(?=\d|5|9|13|$)/g, '♭').replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭');
}

// ---------------------------------------------------------------- chords

export const QUALITIES = {
  '': { iv: [0, 4, 7], name: 'Major triad', fam: 'maj' },
  'm': { iv: [0, 3, 7], name: 'Minor triad', fam: 'min' },
  'dim': { iv: [0, 3, 6], name: 'Diminished triad', fam: 'dim' },
  'aug': { iv: [0, 4, 8], name: 'Augmented triad', fam: 'aug' },
  'sus2': { iv: [0, 2, 7], name: 'Suspended 2nd', fam: 'sus' },
  'sus4': { iv: [0, 5, 7], name: 'Suspended 4th', fam: 'sus' },
  'add9': { iv: [0, 4, 7, 14], name: 'Major add 9', fam: 'maj' },
  'madd9': { iv: [0, 3, 7, 14], name: 'Minor add 9', fam: 'min' },
  '6': { iv: [0, 4, 7, 9], name: 'Major 6th', fam: 'maj' },
  'm6': { iv: [0, 3, 7, 9], name: 'Minor 6th', fam: 'min' },
  '69': { iv: [0, 4, 7, 9, 14], name: 'Six-nine', fam: 'maj' },
  'm69': { iv: [0, 3, 7, 9, 14], name: 'Minor six-nine', fam: 'min' },
  'maj7': { iv: [0, 4, 7, 11], name: 'Major 7th', fam: 'maj' },
  'maj9': { iv: [0, 4, 7, 11, 14], name: 'Major 9th', fam: 'maj' },
  'maj13': { iv: [0, 4, 7, 11, 14, 21], name: 'Major 13th', fam: 'maj' },
  'maj7#11': { iv: [0, 4, 7, 11, 18], name: 'Lydian major 7th', fam: 'maj' },
  'maj9#11': { iv: [0, 4, 7, 11, 14, 18], name: 'Lydian major 9th', fam: 'maj' },
  'maj7#5': { iv: [0, 4, 8, 11], name: 'Augmented major 7th', fam: 'maj' },
  'm7': { iv: [0, 3, 7, 10], name: 'Minor 7th', fam: 'min' },
  'm9': { iv: [0, 3, 7, 10, 14], name: 'Minor 9th', fam: 'min' },
  'm11': { iv: [0, 3, 7, 10, 14, 17], name: 'Minor 11th', fam: 'min' },
  'm13': { iv: [0, 3, 7, 10, 14, 21], name: 'Minor 13th', fam: 'min' },
  'mMaj7': { iv: [0, 3, 7, 11], name: 'Minor-major 7th', fam: 'min' },
  'mMaj9': { iv: [0, 3, 7, 11, 14], name: 'Minor-major 9th', fam: 'min' },
  '7': { iv: [0, 4, 7, 10], name: 'Dominant 7th', fam: 'dom' },
  '9': { iv: [0, 4, 7, 10, 14], name: 'Dominant 9th', fam: 'dom' },
  '11': { iv: [0, 7, 10, 14, 17], name: 'Dominant 11th', fam: 'sus' },
  '13': { iv: [0, 4, 7, 10, 14, 21], name: 'Dominant 13th', fam: 'dom' },
  '7b9': { iv: [0, 4, 7, 10, 13], name: 'Dominant 7♭9', fam: 'dom' },
  '7#9': { iv: [0, 4, 7, 10, 15], name: 'Dominant 7♯9', fam: 'dom' },
  '7#11': { iv: [0, 4, 7, 10, 18], name: 'Dominant 7♯11', fam: 'dom' },
  '9#11': { iv: [0, 4, 7, 10, 14, 18], name: 'Dominant 9♯11', fam: 'dom' },
  '7b13': { iv: [0, 4, 7, 10, 20], name: 'Dominant 7♭13', fam: 'dom' },
  '7#5': { iv: [0, 4, 8, 10], name: 'Augmented 7th', fam: 'dom' },
  '7b5': { iv: [0, 4, 6, 10], name: 'Dominant 7♭5', fam: 'dom' },
  '7alt': { iv: [0, 4, 10, 13, 15, 20], name: 'Altered dominant', fam: 'dom' },
  '7b9b13': { iv: [0, 4, 10, 13, 20], name: 'Dominant 7♭9♭13', fam: 'dom' },
  '7#9b13': { iv: [0, 4, 10, 15, 20], name: 'Dominant 7♯9♭13', fam: 'dom' },
  '13b9': { iv: [0, 4, 7, 10, 13, 21], name: 'Dominant 13♭9', fam: 'dom' },
  '13#11': { iv: [0, 4, 7, 10, 14, 18, 21], name: 'Dominant 13♯11', fam: 'dom' },
  '7sus4': { iv: [0, 5, 7, 10], name: 'Dominant 7sus4', fam: 'sus' },
  '9sus4': { iv: [0, 5, 7, 10, 14], name: 'Dominant 9sus4', fam: 'sus' },
  '13sus4': { iv: [0, 5, 7, 10, 14, 21], name: 'Dominant 13sus4', fam: 'sus' },
  'm7b5': { iv: [0, 3, 6, 10], name: 'Half-diminished', fam: 'hdim' },
  'm9b5': { iv: [0, 3, 6, 10, 14], name: 'Half-diminished 9', fam: 'hdim' },
  'dim7': { iv: [0, 3, 6, 9], name: 'Diminished 7th', fam: 'dim' },
};

const ALIASES = {
  'maj': '', 'M': '', 'min': 'm', '-': 'm', '°': 'dim', '°7': 'dim7', 'o': 'dim', 'o7': 'dim7',
  '+': 'aug', 'sus': 'sus4', '6/9': '69', 'Δ': 'maj7', 'Δ7': 'maj7', 'M7': 'maj7', 'ø': 'm7b5',
  'ø7': 'm7b5', '-7': 'm7', 'min7': 'm7', 'm7-5': 'm7b5', 'alt': '7alt', '7sus': '7sus4',
  '9sus': '9sus4', '13sus': '13sus4', 'add2': 'add9', '2': 'add9', 'mmaj7': 'mMaj7', '+7': '7#5', 'aug7': '7#5',
};

const QUALITY_KEYS = [...Object.keys(QUALITIES), ...Object.keys(ALIASES)].sort((a, b) => b.length - a.length);

/** Parse 'Dm9', 'C/E', 'F#7alt', 'D|C7' (poly: upper|lower). */
export function parseChord(sym) {
  sym = String(sym).trim();
  if (sym.includes('|')) {
    const [u, l] = sym.split('|');
    return { poly: true, upper: parseChord(u), lower: parseChord(l), sym };
  }
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  if (!m) throw new Error('Bad chord ' + sym);
  const root = pcOf(m[1]);
  let rest = m[2];
  let bass = null;
  const slash = rest.lastIndexOf('/');
  if (slash >= 0 && /^[A-G][#b]?$/.test(rest.slice(slash + 1))) {
    bass = pcOf(rest.slice(slash + 1));
    rest = rest.slice(0, slash);
  }
  let q = null;
  for (const k of QUALITY_KEYS) {
    if (rest === k) { q = k; break; }
  }
  if (q === null) throw new Error('Unknown chord quality "' + rest + '" in ' + sym);
  if (q in ALIASES) q = ALIASES[q];
  return { root, quality: q, bass, iv: QUALITIES[q].iv, fam: QUALITIES[q].fam, sym, rootName: m[1] };
}

export function chordPcs(sym) {
  const c = typeof sym === 'string' ? parseChord(sym) : sym;
  if (c.poly) return [...new Set([...chordPcs(c.lower), ...chordPcs(c.upper)])];
  const s = c.iv.map(i => (c.root + i) % 12);
  if (c.bass !== null && !s.includes(c.bass)) s.unshift(c.bass);
  return s;
}

export function chordLabel(sym) {
  return pretty(sym).replace('|', ' over ');
}

const INTERVAL_LABELS = ['1', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];
const INTERVAL_LABELS_SIMPLE = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];
export function degreeLabel(iv, chordFam) {
  if (iv >= 12) return INTERVAL_LABELS[iv % 12];
  if (chordFam === 'dim' && iv === 9) return '°7';
  if (iv === 8 && (chordFam === 'aug' || chordFam === 'dom')) return '♯5';
  if (iv === 9 && chordFam !== 'dom') return '6';
  return INTERVAL_LABELS_SIMPLE[iv];
}
export function chordFormula(sym) {
  const c = parseChord(sym);
  if (c.poly) return chordFormula(c.upper.sym) + ' over ' + chordFormula(c.lower.sym);
  return c.iv.map(i => degreeLabel(i, c.fam)).join(' – ');
}

// Rootless / guide-tone colour sets (intervals above the root)
const COLOR_SETS = {
  '': [0, 4, 7, 14], 'add9': [0, 4, 7, 14], 'm': [0, 3, 7, 14], 'madd9': [0, 3, 7, 14],
  '6': [4, 7, 9, 14], '69': [4, 7, 9, 14], 'm6': [3, 7, 9, 14], 'm69': [3, 7, 9, 14],
  'maj7': [4, 7, 11, 14], 'maj9': [4, 7, 11, 14], 'maj13': [4, 9, 11, 14], 'maj7#11': [4, 11, 14, 18], 'maj9#11': [4, 11, 14, 18], 'maj7#5': [4, 8, 11, 14],
  'm7': [3, 7, 10, 14], 'm9': [3, 7, 10, 14], 'm11': [3, 10, 14, 17], 'm13': [3, 10, 14, 21], 'mMaj7': [3, 7, 11, 14], 'mMaj9': [3, 7, 11, 14],
  '7': [4, 9, 10, 14], '9': [4, 9, 10, 14], '13': [4, 9, 10, 14], '7b9': [4, 9, 10, 13], '13b9': [4, 9, 10, 13],
  '7#9': [4, 7, 10, 15], '7alt': [4, 8, 10, 15], '7b13': [4, 8, 10, 14], '7#11': [4, 6, 10, 14], '9#11': [4, 6, 10, 14],
  '13#11': [4, 6, 9, 10], '7#5': [4, 8, 10, 14], '7b5': [4, 6, 10, 14], '7b9b13': [4, 8, 10, 13], '7#9b13': [4, 8, 10, 15],
  '7sus4': [5, 7, 10, 14], '9sus4': [5, 7, 10, 14], '13sus4': [5, 9, 10, 14], '11': [5, 7, 10, 14],
  'm7b5': [0, 3, 6, 10], 'm9b5': [3, 6, 10, 14], 'dim7': [0, 3, 6, 9], 'dim': [0, 3, 6], 'aug': [0, 4, 8], 'sus2': [0, 2, 7], 'sus4': [0, 5, 7],
};

function colorSet(c) { return COLOR_SETS[c.quality] || c.iv.filter(i => i !== 0).slice(0, 4); }

/** Place an ordered list of pitch classes as a close voicing, choosing the rotation/octave that voice-leads best. */
function placeVoiced(pcs, lo, prev, allowStart) {
  const uniq = [...new Set(pcs.map(p => ((p % 12) + 12) % 12))];
  const cands = [];
  for (let r = 0; r < uniq.length; r++) {
    const s0 = uniq[r];
    const rot = [...uniq].sort((a, b) => ((a - s0 + 12) % 12) - ((b - s0 + 12) % 12));
    if (allowStart && !allowStart(rot[0])) continue;
    for (let base = lo - 12; base <= lo + 12; base += 12) {
      let first = base + ((rot[0] - base) % 12 + 12) % 12;
      const notes = [first];
      for (let i = 1; i < rot.length; i++) {
        let n = notes[i - 1] + 1;
        while (n % 12 !== rot[i]) n++;
        notes.push(n);
      }
      if (notes[0] < lo || notes[0] >= lo + 12) continue;
      cands.push(notes);
    }
  }
  if (!cands.length) return placeVoiced(pcs, lo, prev, null);
  const target = lo + 5;
  let best = null, bestScore = Infinity;
  for (const c of cands) {
    let score;
    if (prev && prev.length) {
      score = c.reduce((s, n) => s + Math.min(...prev.map(p => Math.abs(p - n))), 0)
        + prev.reduce((s, p) => s + Math.min(...c.map(n => Math.abs(p - n))), 0) * 0.5
        + Math.abs(c[c.length - 1] - prev[prev.length - 1]) * 0.6;
    } else {
      score = Math.abs(c[0] - target) + Math.abs((c[0] + c[c.length - 1]) / 2 - (lo + 9)) * 0.5;
    }
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return best;
}

function inWindow(pc, lo) { return lo + ((pc - lo) % 12 + 12) % 12; }

export const VOICING_STYLES = {
  'close': 'Close position (right hand)',
  'root': 'Bass root + close right hand',
  'shell': 'Shell (1-3-7) left hand',
  'rootless': 'Rootless A/B (right hand)',
  'root+rootless': 'Bass root + rootless A/B',
  'drop2': 'Drop 2 + bass root',
  'quartal': 'Quartal / “So What”',
  'gospel': 'Gospel: octave bass + upper colours',
  'spread': 'Spread ballad voicing',
  'shell+rootless': 'Shell left hand + colour right hand',
  'inv0': 'Root position', 'inv1': '1st inversion', 'inv2': '2nd inversion', 'inv3': '3rd inversion',
  'bass': 'Bass note only',
};

/** Return {lh:[], rh:[]} midi notes for a chord symbol in a given style. prev = {lh, rh} previous voicing for voice leading. */
export function voice(sym, style = 'root', prev = {}) {
  const c = typeof sym === 'string' ? parseChord(sym) : sym;
  if (c.poly) {
    const lowerC = c.lower;
    const lhPcs = lowerC.fam === 'dom' || lowerC.quality.includes('7')
      ? [0, 4, 10].map(i => (lowerC.root + (lowerC.fam === 'min' && i === 4 ? 3 : i)) % 12)
      : chordPcs(lowerC);
    const r = inWindow(lowerC.root, 36);
    const t3 = lowerC.iv.find(i => i === 3 || i === 4) ?? 7;
    const t7 = lowerC.iv.find(i => i === 10 || i === 11);
    const lh = t7 !== undefined ? [r, r + t7, r + 12 + t3] : [r, r + 7, r + 12 + t3];
    const rh = placeVoiced(chordPcs(c.upper), 62, prev.rh);
    return { lh, rh };
  }
  const root = c.root;
  const bassPc = c.bass !== null ? c.bass : root;
  const pcsFull = c.iv.map(i => (root + i) % 12);
  const colorPcs = colorSet(c).map(i => (root + i) % 12);
  const third = c.iv.find(i => i === 3 || i === 4 || i === 5);
  const seventh = c.iv.find(i => i === 10 || i === 11 || (i === 9 && (c.fam !== 'dom')));
  const guide = [third, seventh].filter(v => v !== undefined).map(i => (root + i) % 12);
  const bass = () => inWindow(bassPc, 36);
  const isGuideStart = p => guide.includes(p) || colorPcs.length < 4;

  switch (style) {
    case 'close':
      return { lh: [], rh: placeVoiced(pcsFull.slice(0, 5), 58, prev.rh) };
    case 'triad':
      return { lh: [], rh: placeVoiced(pcsFull.slice(0, 3), 58, prev.rh) };
    case 'bass':
      return { lh: [bass()], rh: [] };
    case 'root':
      return { lh: [bass(), bass() + 12].slice(0, prev.octaveBass ? 2 : 1), rh: placeVoiced(pcsFull.slice(0, 4), 57, prev.rh) };
    case 'shell': {
      // Low roots take 1-7-3 (keeps the 3rd out of the mud); higher roots take 1-3-7.
      const r = inWindow(root, 40);
      const t = third !== undefined ? third : 7;
      const s = seventh !== undefined ? seventh : (c.iv.includes(9) ? 9 : 12);
      const lh = r < 46 ? [r, r + s, r + t + 12] : [r, r + t, r + s];
      return { lh: [...new Set(lh)].sort((a, b) => a - b), rh: [] };
    }
    case 'rootless':
      return { lh: [], rh: placeVoiced(colorPcs, 50, prev.rh, isGuideStart) };
    case 'root+rootless':
      return { lh: [bass()], rh: placeVoiced(colorPcs, 52, prev.rh, isGuideStart) };
    case 'shell+rootless': {
      const r = inWindow(bassPc, 38);
      const lh = [r, ...(seventh !== undefined ? [r + seventh % 12 + (r + seventh % 12 < r ? 12 : 0)] : [r + 7])];
      const ext = colorPcs.filter(p => p !== root);
      return { lh, rh: placeVoiced(ext, 60, prev.rh) };
    }
    case 'drop2': {
      const four = (c.iv.length >= 4 ? c.iv.slice(0, 4) : [...c.iv, 12]).map(i => (root + i) % 12);
      if (c.iv.some(i => i > 12)) four[0] = (root + c.iv.find(i => i > 12)) % 12; // 9 replaces root
      const closeV = placeVoiced(four, 62, prev.rh);
      const sorted = [...closeV].sort((a, b) => a - b);
      const dropped = sorted[sorted.length - 2] - 12;
      const rh = [dropped, ...sorted.filter((_, i) => i !== sorted.length - 2)].sort((a, b) => a - b);
      return { lh: [bass()], rh };
    }
    case 'quartal': {
      if (c.fam === 'hdim' || c.fam === 'dim' || c.fam === 'aug') return voice(c, 'root+rootless', prev);
      let ivs;
      if (c.fam === 'min') ivs = [0, 5, 10, 15, 19];
      else if (c.fam === 'dom') ivs = [-2, 4, 9, 14];
      else if (c.fam === 'sus') ivs = [0, 5, 10, 14, 19];
      else ivs = [4, 9, 14, 19];
      let start = inWindow((root + ivs[0] + 24) % 12, 50);
      const notes = ivs.map(i => start + (i - ivs[0]));
      if (prev.rh?.length) {
        const shift = Math.round((prev.rh[0] - notes[0]) / 12) * 12;
        if (Math.abs(prev.rh[0] - (notes[0] + shift)) <= 7 && notes[0] + shift >= 45) notes.forEach((_, i) => notes[i] += shift);
      }
      return { lh: c.fam === 'min' ? [] : [inWindow(root, 36)], rh: notes };
    }
    case 'gospel': {
      const b = bass();
      return { lh: [b, b + 12], rh: placeVoiced(colorPcs, 58, prev.rh) };
    }
    case 'spread': {
      const b = bass();
      const lh = [b, b + (seventh !== undefined ? seventh : 7)];
      const top = colorPcs.filter(p => p !== (root + (seventh ?? 7)) % 12 && p !== root).slice(0, 3);
      return { lh, rh: placeVoiced(top, 58, prev.rh) };
    }
    default: {
      const m = /^inv(\d)$/.exec(style);
      if (m) {
        const inv = parseInt(m[1], 10);
        const base = pcsFull.slice(0, c.iv.length > 4 ? 4 : c.iv.length);
        const rot = base.slice(inv).concat(base.slice(0, inv));
        const notes = [inWindow(rot[0], 55)];
        for (let i = 1; i < rot.length; i++) { let n = notes[i - 1] + 1; while (n % 12 !== rot[i]) n++; notes.push(n); }
        return { lh: [], rh: notes };
      }
      return voice(c, 'root', prev);
    }
  }
}

// ---------------------------------------------------------------- scales

export const SCALES = {
  'major': { iv: [0, 2, 4, 5, 7, 9, 11], name: 'Major (Ionian)', use: 'Home key of most pop, classical and gospel. Over maj7, 6 and 6/9 chords (avoid holding the 4th).' },
  'naturalMinor': { iv: [0, 2, 3, 5, 7, 8, 10], name: 'Natural minor (Aeolian)', use: 'Sad, folk-like minor. Over vi chords and minor ballads; sounds dark over m7.' },
  'harmonicMinor': { iv: [0, 2, 3, 5, 7, 8, 11], name: 'Harmonic minor', use: 'Raised 7th gives a strong V7 in minor. Classical, gospel minor, Middle-Eastern colour.' },
  'melodicMinor': { iv: [0, 2, 3, 5, 7, 9, 11], name: 'Melodic minor (jazz)', use: 'Over mMaj7 and m6. Its modes give the altered and lydian-dominant sounds.' },
  'dorian': { iv: [0, 2, 3, 5, 7, 9, 10], name: 'Dorian', use: 'The jazz minor sound: ii chords, m7, m9, m11. Funk, modal jazz, neo-soul.' },
  'phrygian': { iv: [0, 1, 3, 5, 7, 8, 10], name: 'Phrygian', use: 'Spanish/flamenco colour; over sus(♭9) and iii chords.' },
  'lydian': { iv: [0, 2, 4, 6, 7, 9, 11], name: 'Lydian', use: 'Dreamy major with ♯4. Over maj7♯11 and IV chords; film and fusion.' },
  'mixolydian': { iv: [0, 2, 4, 5, 7, 9, 10], name: 'Mixolydian', use: 'Dominant sound: unaltered 7, 9, 13 and sus chords. Blues, gospel, rock.' },
  'locrian': { iv: [0, 1, 3, 5, 6, 8, 10], name: 'Locrian', use: 'Over half-diminished (m7♭5) chords, e.g. the ii in minor ii–V–i.' },
  'majorPent': { iv: [0, 2, 4, 7, 9], name: 'Major pentatonic', use: 'Safe, singing melodies over major chords. Gospel and country runs.' },
  'minorPent': { iv: [0, 3, 5, 7, 10], name: 'Minor pentatonic', use: 'Over minor chords and the blues. Builds fast runs and fills.' },
  'blues': { iv: [0, 3, 5, 6, 7, 10], name: 'Blues scale', use: 'Minor pentatonic + ♭5 “blue note”. Over 12-bar blues, gospel shouts, funk.' },
  'majorBlues': { iv: [0, 2, 3, 4, 7, 9], name: 'Major blues (gospel)', use: 'Major pentatonic + ♭3. The gospel/soul run scale over I chords.' },
  'bebopDom': { iv: [0, 2, 4, 5, 7, 9, 10, 11], name: 'Bebop dominant', use: 'Mixolydian + passing major 7th: chord tones land on downbeats in eighth-note lines.' },
  'bebopMaj': { iv: [0, 2, 4, 5, 7, 8, 9, 11], name: 'Bebop major', use: 'Major + passing ♯5: keeps chord tones on the beat over maj6/maj7.' },
  'wholeTone': { iv: [0, 2, 4, 6, 8, 10], name: 'Whole tone', use: 'Over 7♯5 / 9♯5 dominants. Dreamy, floating, impressionist.' },
  'dimHW': { iv: [0, 1, 3, 4, 6, 7, 9, 10], name: 'Diminished (half–whole)', use: 'Over 7♭9 and 13♭9 dominants. Symmetrical: repeats every minor 3rd.' },
  'dimWH': { iv: [0, 2, 3, 5, 6, 8, 9, 11], name: 'Diminished (whole–half)', use: 'Over dim7 chords. Great for gospel diminished passing runs.' },
  'altered': { iv: [0, 1, 3, 4, 6, 8, 10], name: 'Altered (super-locrian)', use: 'Over 7alt: ♭9, ♯9, ♯11, ♭13 — maximum tension resolving to I.' },
  'lydianDom': { iv: [0, 2, 4, 6, 7, 9, 10], name: 'Lydian dominant', use: 'Over 7♯11 and tritone-substitute dominants.' },
  'phrygianDom': { iv: [0, 1, 4, 5, 7, 8, 10], name: 'Phrygian dominant', use: 'Over V7♭9 in minor keys; flamenco and gospel minor.' },
  'chromatic': { iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], name: 'Chromatic', use: 'Passing tones, approach notes and fast runs.' },
};

export function scaleMidi(rootName, scale, startOct = 4, octaves = 1, descend = false) {
  const rootM = N(rootName + startOct);
  const iv = SCALES[scale].iv;
  const notes = [];
  for (let o = 0; o < octaves; o++) iv.forEach(i => notes.push(rootM + o * 12 + i));
  notes.push(rootM + octaves * 12);
  return descend ? notes.concat(notes.slice(0, -1).reverse()) : notes;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** Diatonic chords of a 7-note scale: [{sym, roman}] */
export function diatonicChords(rootName, scale = 'major', sevenths = true) {
  const iv = SCALES[scale].iv;
  if (iv.length !== 7) return [];
  const rootPc = pcOf(rootName);
  const out = [];
  for (let d = 0; d < 7; d++) {
    const stack = [0, 2, 4, 6].map(k => (iv[(d + k) % 7] - iv[d] + 12) % 12);
    const [_, t, f, s] = stack;
    let q;
    if (t === 4 && f === 7) q = sevenths ? (s === 11 ? 'maj7' : '7') : '';
    else if (t === 3 && f === 7) q = sevenths ? (s === 10 ? 'm7' : 'mMaj7') : 'm';
    else if (t === 3 && f === 6) q = sevenths ? (s === 10 ? 'm7b5' : 'dim7') : 'dim';
    else if (t === 4 && f === 8) q = sevenths ? 'maj7#5' : 'aug';
    else q = '';
    const pc = (rootPc + iv[d]) % 12;
    const name = pcName(pc, FLAT_KEYS.has(rootPc) || rootName.includes('b') || [5].includes(rootPc));
    let roman = ROMAN[d];
    if (t === 3) roman = roman.toLowerCase();
    if (f === 6) roman += (sevenths && s === 10) ? 'ø7' : '°';
    else if (sevenths) roman += q === 'maj7' ? 'maj7' : (q === '7' ? '7' : (q.startsWith('m') ? '7' : ''));
    if (f === 8) roman += '+';
    out.push({ sym: name + q, roman });
  }
  return out;
}

export function transposeSym(sym, semis) {
  const c = parseChord(sym);
  if (c.poly) return transposeSym(c.upper.sym, semis) + '|' + transposeSym(c.lower.sym, semis);
  const r = pcName((c.root + semis + 120) % 12);
  const b = c.bass !== null ? '/' + pcName((c.bass + semis + 120) % 12) : '';
  return r + c.quality + b;
}

// ---------------------------------------------------------------- sequences
// Event: {t: beats, d: beats, n: [midi], v: 0..1, hand?: 'lh'|'rh'}

/** Line notation: "C4:.5 E4 G4:1 [C4,E4,G4]:2 r:1 Bb3:.5@.9" */
export function line(str, opts = {}) {
  let t = opts.start || 0;
  let dur = opts.dur || 1;
  const vel = opts.vel ?? 0.72;
  const ev = [];
  for (const tok of str.trim().split(/\s+/)) {
    if (!tok) continue;
    const m = /^(\[[^\]]+\]|[A-Gr][#b]?-?\d?)(?::([\d.\/]+))?(?:@([\d.]+))?$/.exec(tok);
    if (!m) throw new Error('Bad token ' + tok);
    if (m[2]) dur = m[2].includes('/') ? m[2].split('/').reduce((a, b) => a / b) : parseFloat(m[2]);
    const v = m[3] ? parseFloat(m[3]) : vel;
    if (m[1] !== 'r') {
      const notes = m[1].startsWith('[') ? m[1].slice(1, -1).split(',').map(N) : [N(m[1])];
      ev.push({ t, d: dur * (opts.legato ?? 0.95), n: notes, v, hand: opts.hand });
    }
    t += dur;
  }
  return ev;
}

/**
 * Progression to events.
 * list: ['Dm9', 'G13', ['Cmaj9', 8]] — symbols with optional beats.
 * opts: {style, beats, vel, rh: [[offset,dur],...], lh: [[offset,dur]...], arp: {notes:'rh'|'all', step:.5, pattern:[idx...]}, start}
 */
export function prog(list, opts = {}) {
  const style = opts.style || 'root';
  let t = opts.start || 0;
  const ev = [];
  let prev = { octaveBass: opts.octaveBass };
  const chords = [];
  for (const item of list) {
    const [sym, beats] = Array.isArray(item) ? item : [item, opts.beats || 4];
    const v = voice(sym, style, prev);
    prev = { ...v, octaveBass: opts.octaveBass };
    chords.push({ sym, t, beats });
    const vel = opts.vel ?? 0.68;
    if (opts.arp) {
      const all = opts.arp.notes === 'rh' ? v.rh : [...v.lh, ...v.rh];
      const pat = opts.arp.pattern || all.map((_, i) => i);
      const step = opts.arp.step || 0.5;
      if (opts.arp.notes === 'rh' && v.lh.length) ev.push({ t, d: beats, n: v.lh, v: vel, hand: 'lh' });
      let k = 0;
      for (let x = 0; x < beats - 1e-6; x += step) {
        const idx = pat[k % pat.length];
        const note = idx < 0 ? null : all[Math.min(idx, all.length - 1)];
        if (note !== null) ev.push({ t: t + x, d: opts.arp.hold ? beats - x : step * 0.95, n: [note], v: vel * (k % pat.length === 0 ? 1.08 : 0.92), hand: 'rh' });
        k++;
      }
    } else {
      const lhPat = opts.lh || [[0, beats]];
      const rhPat = opts.rh || [[0, beats]];
      if (v.lh.length) for (const [o, d] of lhPat) if (o < beats) ev.push({ t: t + o, d: Math.min(d, beats - o) * 0.97, n: v.lh, v: vel * 1.02, hand: 'lh' });
      if (v.rh.length) for (const [o, d, acc] of rhPat) if (o < beats) ev.push({ t: t + o, d: Math.min(d, beats - o) * 0.95, n: v.rh, v: vel * (acc || 1), hand: 'rh' });
    }
    t += beats;
  }
  ev.chords = chords;
  return ev;
}

/** Walking bass: quarter notes — root on beat 1, chord tones, then a chromatic approach into the next root. */
export function walk(list, opts = {}) {
  let t = opts.start || 0;
  const ev = [];
  const items = list.map(i => Array.isArray(i) ? i : [i, 4]);
  let prevNote = null;
  const near = (pc, ref) => { let n = inWindow(pc, ref - 6); if (n < 31) n += 12; if (n > 53) n -= 12; return n; };
  items.forEach(([sym, beats], idx) => {
    const c = parseChord(sym);
    const nc = parseChord(items[(idx + 1) % items.length][0]);
    const r = prevNote === null ? inWindow(c.root, 36) : near(c.root, prevNote);
    const nextRoot = near(nc.root, r);
    const tones = [];
    for (const i of c.iv) for (const o of [-12, 0, 12]) { const n = r + (i % 12) + o; if (n >= 28 && n <= 55 && n !== r) tones.push(n); }
    let notes;
    if (beats >= 4) {
      let best = null;
      for (const b2 of tones) for (const b3 of tones) {
        if (b3 === b2) continue;
        const ap = nextRoot + (b3 > nextRoot ? 1 : -1);
        if (ap === b3 || b2 === ap) continue;
        const cost = Math.abs(b2 - r) + Math.abs(b3 - b2) + Math.abs(ap - b3) * 1.3 + (Math.abs(b2 - r) > 7 ? 6 : 0) + ((idx + b2) % 3 === 0 ? 0.5 : 0);
        if (!best || cost < best.cost) best = { cost, seq: [r, b2, b3, ap] };
      }
      notes = best ? best.seq : [r, r + 7, r + 12, nextRoot - 1];
      for (let b = 4; b < beats; b += 2) notes.push(notes[2], nextRoot + (notes[2] > nextRoot ? 1 : -1));
    } else if (beats >= 2) notes = [r, nextRoot + (r > nextRoot ? 1 : -1)];
    else notes = [r];
    notes.slice(0, Math.ceil(beats)).forEach((n, i) => ev.push({ t: t + i, d: 0.9, n: [n], v: (opts.vel ?? 0.7) * (i % 2 ? 0.88 : 1), hand: 'lh' }));
    prevNote = notes[Math.ceil(beats) - 1] ?? r;
    t += beats;
  });
  return ev;
}

/** Polyrhythm a:b over `len` beats, repeated `reps` times. */
export function poly(a, b, opts = {}) {
  const len = opts.len || 4, reps = opts.reps || 2;
  const na = opts.noteA ?? N('C5'), nb = opts.noteB ?? N('C3');
  const ev = [];
  for (let r = 0; r < reps; r++) {
    for (let i = 0; i < a; i++) ev.push({ t: r * len + i * len / a, d: len / a * 0.8, n: Array.isArray(na) ? na : [na], v: i === 0 ? 0.85 : 0.65, hand: 'rh' });
    for (let i = 0; i < b; i++) ev.push({ t: r * len + i * len / b, d: len / b * 0.8, n: Array.isArray(nb) ? nb : [nb], v: i === 0 ? 0.85 : 0.6, hand: 'lh' });
  }
  return ev;
}

export function shift(events, beats) { return events.map(e => ({ ...e, t: e.t + beats })); }
export function merge(...parts) {
  const out = parts.flat();
  out.chords = parts.flatMap(p => p.chords || []);
  return out;
}
export function repeat(events, times, len) {
  const out = [];
  for (let i = 0; i < times; i++) out.push(...shift(events, i * len));
  out.chords = (events.chords || []).flatMap(c => Array.from({ length: times }, (_, i) => ({ ...c, t: c.t + i * len }))).sort((a, b) => a.t - b.t);
  return out;
}
export function transposeEvents(events, semis) {
  const out = events.map(e => ({ ...e, n: e.n.map(x => x + semis) }));
  out.chords = (events.chords || []).map(c => ({ ...c, sym: transposeSym(c.sym, semis) }));
  return out;
}
export function length(events) { return events.reduce((m, e) => Math.max(m, e.t + e.d), 0); }

/** Pedal ranges per chord change: [[down, up], ...] */
export function chordPedal(events) {
  const ch = events.chords || [];
  return ch.map(c => [c.t + 0.05, c.t + c.beats - 0.02]);
}

/** Build an example object. */
export function ex(title, events, opts = {}) {
  return {
    title, events, bpm: opts.bpm || 90, swing: opts.swing || 0,
    pedal: opts.pedal === 'chord' ? chordPedal(events) : (opts.pedal || []),
    desc: opts.desc || '', chords: events.chords || opts.chords || [], loop: !!opts.loop, show: opts.show,
  };
}

// ---------------------------------------------------------------- detection

const DETECT_ORDER = ['', 'm', 'maj7', 'm7', '7', 'm7b5', 'dim7', 'dim', 'aug', 'sus4', 'sus2', '6', 'm6', 'add9', 'madd9', 'maj9', 'm9', '9', '69', 'm69', '13', 'm11', '7sus4', '9sus4', '7b9', '7#9', '7#11', '7b13', '7#5', 'mMaj7', 'maj7#11', 'maj13', 'm13', '13b9', '7alt', '13#11', '11', '9#11', '13sus4', 'mMaj9', 'maj9#11', 'maj7#5', '7b5', 'm9b5', '7b9b13', '7#9b13'];

/** Name the chord formed by midi notes. Returns {sym, root, quality, bass} or null. */
export function detectChord(notes, preferFlat = true) {
  if (!notes || notes.length < 2) return null;
  const sorted = [...new Set(notes)].sort((a, b) => a - b);
  const bassPc = sorted[0] % 12;
  const set = new Set(sorted.map(n => n % 12));
  if (set.size === 1) return null;
  if (set.size === 2) {
    const [a, b] = [...set];
    const iv = ((b - a) + 12) % 12;
    const names = { 7: '5', 5: '5' };
    if (names[iv]) {
      const root = iv === 7 ? a : b;
      return { sym: pcName(root, preferFlat) + '5', root, quality: '5', bass: bassPc, interval: true };
    }
    return null;
  }
  let best = null;
  for (const root of set) {
    DETECT_ORDER.forEach((q, rank) => {
      const iv = QUALITIES[q].iv;
      const pcs = iv.map(i => (root + i) % 12);
      const need = new Set(pcs);
      const fifth = (root + 7) % 12;
      const optional = new Set([fifth]);
      if (iv.includes(21) || iv.includes(17)) iv.filter(i => i === 14).forEach(i => optional.add((root + i) % 12));
      if (iv.length > 4 && (q !== '7alt')) optional.add(root);
      for (const p of set) if (!need.has(p)) return;
      let missing = 0;
      for (const p of need) if (!set.has(p) && !optional.has(p)) return; else if (!set.has(p)) missing++;
      const score = missing * 3 + rank * 0.05 + (root === bassPc ? 0 : 1.2) + (set.has(root) ? 0 : 1.5);
      if (!best || score < best.score) best = { root, quality: q, score };
    });
  }
  if (!best) return null;
  const rootName = pcName(best.root, preferFlat);
  const slash = best.root !== bassPc ? '/' + pcName(bassPc, preferFlat) : '';
  return { sym: rootName + best.quality + slash, root: best.root, quality: best.quality, bass: bassPc };
}

/** Does a set of played notes satisfy a target chord (any voicing, 5th & root optional for extended chords)? */
export function matchesChord(notes, sym, strictBass = false) {
  const c = parseChord(sym);
  const set = new Set(notes.map(n => n % 12));
  const pcs = chordPcs(c);
  const optional = new Set();
  if (!c.poly) {
    optional.add((c.root + 7) % 12);
    if (c.iv.length >= 5) { optional.add(c.root); if (c.iv.includes(21)) optional.add((c.root + 14) % 12); }
  }
  for (const p of pcs) if (!set.has(p) && !optional.has(p)) return false;
  for (const p of set) if (!pcs.includes(p)) return false;
  if (strictBass && notes.length) return Math.min(...notes) % 12 === (c.bass ?? c.root);
  return true;
}

// ---------------------------------------------------------------- substitutions & reharmonization

export function substitutions(sym) {
  const c = parseChord(sym);
  if (c.poly) return [];
  const R = (semi, q, why, title) => ({ sym: pcName((c.root + semi + 12) % 12) + q, why, title });
  const out = [];
  if (c.fam === 'dom') {
    out.push(R(6, '7', 'Shares the same tritone (3rd & ♭7 swap roles). Bass now slides down by half step into the I chord.', 'Tritone substitute'));
    out.push(R(0, '13', 'Adds the 9th and 13th — the rich, “finished” dominant used in jazz and gospel.', 'Extended 13th'));
    out.push(R(0, '7alt', '♭9, ♯9, ♭13 create maximum pull back to the tonic. Classic bebop and modern jazz.', 'Altered dominant'));
    out.push(R(0, '9sus4', 'Delays the 3rd: a floating, modern, gospel-friendly dominant. Often written IV/V.', 'Sus dominant'));
    out.push(R(7, 'm7', 'Precede the dominant with its ii chord to make a ii–V.', 'Add the ii (play before)'));
    out.push(R(1, 'dim7', 'Same notes as 7♭9 without the root. Use to pass upward chromatically.', 'Diminished (♭9 colour)'));
  } else if (c.fam === 'maj') {
    out.push(R(0, 'maj9', 'Adds colour while keeping the function. Default jazz/neo-soul tonic.', 'Major 9'));
    out.push(R(0, '69', 'Stable, bright tonic without the leading tone. Gospel and bossa favourite.', 'Six-nine'));
    out.push(R(9, 'm7', 'Relative minor: shares three notes with Imaj7. Smooth tonic substitute.', 'Relative minor (vi)'));
    out.push(R(4, 'm7', 'iii shares three notes with Imaj7 (3-5-7). Used in iii–VI–ii–V turnarounds.', 'Mediant (iii)'));
    out.push(R(0, 'maj7#11', 'Lydian colour: lifts the ♯4 into the chord. Dreamy, modern.', 'Lydian tonic'));
    out.push(R(5, 'm6', 'Borrowed iv from the minor key: the “gospel/plagal” sigh back to I.', 'Minor iv (modal interchange)'));
  } else if (c.fam === 'min') {
    out.push(R(0, 'm9', 'Adds the 9th: lush minor typical of jazz, R&B and gospel.', 'Minor 9'));
    out.push(R(0, 'm11', 'Stacks 9 and 11: open, modern, “neo-soul” minor.', 'Minor 11'));
    out.push(R(3, 'maj7', 'Relative major shares 3 notes (the m9 without root is a maj7).', 'Relative major'));
    out.push(R(0, 'm6', 'Dorian minor: m6 is the classic jazz minor tonic.', 'Minor 6'));
    out.push(R(5, '7', 'IV7 inside a minor-blues sound; also treat m7 → IV7 as a ii–V to ♭VII.', 'Dorian IV7'));
    out.push(R(-2, '7', 'Insert its secondary dominant (V7 of this chord) before it.', 'Approach from V7/ii'));
  } else if (c.fam === 'hdim') {
    out.push(R(0, 'm9b5', 'Natural 9 (locrian ♮2) softens the chord.', 'Half-diminished 9'));
    out.push(R(3, 'm6', 'm7♭5 = m6 of its minor-3rd-above root (same notes).', 'Minor 6 equivalent'));
    out.push(R(5, '7', 'Acts like the V9 without root of a chord a 4th up.', 'Rootless dominant 9'));
  } else if (c.fam === 'dim') {
    out.push(R(-1, '7b9', 'Diminished 7th = rootless 7♭9 a half step below.', 'Dominant 7♭9 view'));
    out.push(R(3, 'dim7', 'Symmetrical — the same chord every minor 3rd.', 'Inverted copy'));
  } else if (c.fam === 'sus') {
    out.push(R(0, '7', 'Resolve the 4th to the 3rd for a classic suspension–resolution.', 'Resolve to dominant'));
    out.push(R(10, '/' + pcName(c.root), 'Write it as a slash chord: ♭VII over root (IV/V sound).', 'Slash-chord view'));
  }
  return out.filter(s => { try { parseChord(s.sym); return true; } catch { return false; } });
}

export const REHARM_TECHNIQUES = {
  extend: { name: 'Extend colours', desc: 'Upgrade triads and 7ths to 9ths, 11ths and 13ths.' },
  secondary: { name: 'Secondary dominants', desc: 'Precede each chord with its own V7.' },
  iiV: { name: 'ii–V approaches', desc: 'Precede each chord with its own ii–V.' },
  tritone: { name: 'Tritone substitution', desc: 'Swap dominants for the dominant a tritone away.' },
  passingDim: { name: 'Passing diminished', desc: 'Connect roots a whole step apart with a ♯°7.' },
  chromatic: { name: 'Chromatic approach', desc: 'Slide into chords from a half step above.' },
  backdoor: { name: 'Backdoor dominant', desc: 'Replace V7 → I with iv7 → ♭VII7 → I.' },
  gospel: { name: 'Gospel colours', desc: '13ths, 6/9s, m11s and IV/V sus dominants.' },
};

function q(c) { return c.quality; }
function mk(root, quality) { return pcName((root + 120) % 12) + quality; }

export function reharmonize(list, techniques) {
  let chords = list.map(i => Array.isArray(i) ? { sym: i[0], beats: i[1], note: '' } : { sym: i, beats: 4, note: '' });
  const has = t => techniques.includes(t);

  if (has('extend') || has('gospel')) {
    chords = chords.map(ch => {
      const c = parseChord(ch.sym);
      if (c.poly || c.bass !== null) return ch;
      const g = has('gospel');
      const map = { '': g ? '69' : 'maj9', 'maj7': g ? 'maj9' : 'maj9', '6': '69', 'm': g ? 'm11' : 'm9', 'm7': g ? 'm11' : 'm9', '7': g ? '13' : '13', '9': '13', 'm7b5': 'm9b5' };
      if (map[q(c)] !== undefined && map[q(c)] !== q(c)) return { ...ch, sym: mk(c.root, map[q(c)]), note: g ? 'gospel colour' : 'extended' };
      return ch;
    });
  }
  if (has('backdoor')) {
    const out = [];
    chords.forEach((ch, i) => {
      const c = parseChord(ch.sym), n = chords[i + 1] && parseChord(chords[i + 1].sym);
      if (n && !c.poly && !n.poly && c.fam === 'dom' && (c.root - n.root + 12) % 12 === 7 && ch.beats >= 2) {
        out.push({ sym: mk(n.root + 5, 'm7'), beats: ch.beats / 2, note: 'backdoor iv' });
        out.push({ sym: mk(n.root + 10, '9'), beats: ch.beats / 2, note: 'backdoor ♭VII' });
      } else out.push(ch);
    });
    chords = out;
  }
  if (has('iiV') || has('secondary')) {
    const out = [];
    chords.forEach((ch, i) => {
      const n = chords[i + 1];
      if (!n) { out.push(ch); return; }
      const nc = parseChord(n.sym), c = parseChord(ch.sym);
      if (nc.poly || nc.fam === 'dim' || c.poly) { out.push(ch); return; }
      const alreadyV = c.fam === 'dom' && (c.root - nc.root + 12) % 12 === 7;
      if (alreadyV || ch.beats < 2) { out.push(ch); return; }
      const minorTarget = nc.fam === 'min' || nc.fam === 'hdim';
      if (has('iiV') && ch.beats >= 4) {
        out.push({ ...ch, beats: ch.beats / 2 });
        out.push({ sym: mk(nc.root + 2, minorTarget ? 'm7b5' : 'm7'), beats: ch.beats / 4, note: 'ii of next' });
        out.push({ sym: mk(nc.root + 7, minorTarget ? '7b9' : '7'), beats: ch.beats / 4, note: 'V of next' });
      } else {
        out.push({ ...ch, beats: ch.beats / 2 });
        out.push({ sym: mk(nc.root + 7, minorTarget ? '7b9' : '7'), beats: ch.beats / 2, note: 'secondary dominant' });
      }
    });
    chords = out;
  }
  if (has('tritone')) {
    chords = chords.map((ch, i) => {
      const c = parseChord(ch.sym);
      const n = chords[i + 1] && parseChord(chords[i + 1].sym);
      if (!c.poly && c.fam === 'dom' && c.bass === null && (!n || n.poly || (c.root - n.root + 12) % 12 === 7)) {
        return { ...ch, sym: mk(c.root + 6, q(c) === '7b9' || q(c) === '7alt' ? '7' : (q(c) === '13' ? '9#11' : '7#11')), note: 'tritone sub' };
      }
      return ch;
    });
  }
  if (has('passingDim')) {
    const out = [];
    chords.forEach((ch, i) => {
      const n = chords[i + 1];
      const c = parseChord(ch.sym);
      if (n && !c.poly && ch.beats >= 2) {
        const nc = parseChord(n.sym);
        if (!nc.poly && (nc.root - c.root + 12) % 12 === 2) {
          out.push({ ...ch, beats: ch.beats / 2 });
          out.push({ sym: pcName((c.root + 1) % 12, false) + 'dim7', beats: ch.beats / 2, note: 'passing °7' });
          return;
        }
      }
      out.push(ch);
    });
    chords = out;
  }
  if (has('chromatic')) {
    const out = [];
    chords.forEach((ch, i) => {
      const n = chords[i + 1];
      const c = parseChord(ch.sym);
      if (n && !c.poly && ch.beats >= 2) {
        const nc = parseChord(n.sym);
        if (!nc.poly && nc.bass === null && (c.root - nc.root + 12) % 12 !== 1) {
          out.push({ ...ch, beats: ch.beats - 1 });
          out.push({ sym: mk(nc.root + 1, nc.quality), beats: 1, note: 'chromatic approach' });
          return;
        }
      }
      out.push(ch);
    });
    chords = out;
  }
  if (has('gospel')) {
    chords = chords.map((ch, i) => {
      const c = parseChord(ch.sym), n = chords[i + 1] && parseChord(chords[i + 1].sym);
      if (n && !c.poly && !n.poly && c.fam === 'dom' && (c.root - n.root + 12) % 12 === 7 && c.bass === null && ch.note !== 'secondary dominant' && ch.note !== 'V of next') {
        return { ...ch, sym: mk(c.root + 10, '') + '/' + pcName(c.root), note: 'IV/V sus dominant' };
      }
      return ch;
    });
  }
  return chords;
}

export function parseProgression(text) {
  return text.split(/[\s,|]+/).filter(Boolean).map(tok => {
    const m = /^(.+?)(?:\((\d+(?:\.\d+)?)\))?$/.exec(tok);
    return m[2] ? [m[1], parseFloat(m[2])] : m[1];
  }).filter(x => { try { parseChord(Array.isArray(x) ? x[0] : x); return true; } catch { return false; } });
}

// ---------------------------------------------------------------- MIDI files

export function parseMidiFile(buf) {
  const d = new DataView(buf);
  let p = 0;
  const str = n => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(d.getUint8(p++)); return s; };
  const u32 = () => { const v = d.getUint32(p); p += 4; return v; };
  const u16 = () => { const v = d.getUint16(p); p += 2; return v; };
  const vlq = () => { let v = 0, b; do { b = d.getUint8(p++); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
  if (str(4) !== 'MThd') throw new Error('Not a MIDI file');
  const hl = u32(); u16(); const ntracks = u16(); const division = u16(); p += hl - 6;
  const raw = [];
  for (let t = 0; t < ntracks; t++) {
    if (p >= d.byteLength) break;
    const id = str(4), len = u32(), end = p + len;
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, status = 0;
    while (p < end) {
      tick += vlq();
      let b = d.getUint8(p);
      if (b & 0x80) { status = b; p++; }
      const type = status & 0xf0;
      if (status === 0xff) {
        const mt = d.getUint8(p++); const ml = vlq();
        if (mt === 0x51) raw.push({ tick, tempo: (d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2) });
        p += ml;
      } else if (status === 0xf0 || status === 0xf7) { p += vlq(); }
      else if (type === 0x90 || type === 0x80) {
        const note = d.getUint8(p++), vel = d.getUint8(p++);
        raw.push({ tick, on: type === 0x90 && vel > 0, note, vel });
      } else if (type === 0xb0) {
        const cc = d.getUint8(p++), val = d.getUint8(p++);
        if (cc === 64) raw.push({ tick, pedal: val >= 64 });
      } else if (type === 0xc0 || type === 0xd0) p += 1;
      else p += 2;
    }
    p = end;
  }
  raw.sort((a, b) => a.tick - b.tick);
  let tempo = 500000, lastTick = 0, sec = 0;
  const open = new Map(), events = [], pedal = [];
  let pedalStart = null;
  for (const e of raw) {
    sec += (e.tick - lastTick) / division * tempo / 1e6; lastTick = e.tick;
    if (e.tempo) { tempo = e.tempo; continue; }
    if (e.pedal !== undefined) {
      if (e.pedal && pedalStart === null) pedalStart = sec;
      else if (!e.pedal && pedalStart !== null) { pedal.push([pedalStart, sec]); pedalStart = null; }
      continue;
    }
    if (e.on) open.set(e.note, { t: sec, v: e.vel / 127 });
    else if (open.has(e.note)) {
      const o = open.get(e.note); open.delete(e.note);
      events.push({ t: o.t, d: Math.max(0.05, sec - o.t), n: [e.note], v: o.v });
    }
  }
  // Seconds -> beats at 60 bpm
  return { events: events.sort((a, b) => a.t - b.t), pedal, bpm: 60 };
}

export function writeMidiFile(events, pedal = [], bpm = 60) {
  const tpq = 480;
  const msgs = [];
  const tick = beats => Math.round(beats * tpq);
  for (const e of events) for (const n of e.n) {
    msgs.push({ t: tick(e.t), b: [0x90, n, Math.max(1, Math.round(e.v * 127))] });
    msgs.push({ t: tick(e.t + e.d), b: [0x80, n, 0] });
  }
  for (const [a, b] of pedal) { msgs.push({ t: tick(a), b: [0xb0, 64, 127] }); msgs.push({ t: tick(b), b: [0xb0, 64, 0] }); }
  msgs.sort((a, b) => a.t - b.t || (a.b[0] === 0x80 ? -1 : 1));
  const bytes = [];
  const vlq = v => { const s = [v & 0x7f]; while ((v >>= 7)) s.unshift((v & 0x7f) | 0x80); bytes.push(...s); };
  const us = Math.round(60e6 / bpm);
  vlq(0); bytes.push(0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255);
  let last = 0;
  for (const m of msgs) { vlq(m.t - last); last = m.t; bytes.push(...m.b); }
  vlq(0); bytes.push(0xff, 0x2f, 0);
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (tpq >> 8) & 255, tpq & 255];
  const len = bytes.length;
  const trk = [0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255];
  return new Uint8Array([...head, ...trk, ...bytes]);
}
