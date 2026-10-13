// Studio tools: Chord Explorer, Scale Explorer, Reharm Lab, Rhythm Lab, Practice Room, Library.

import {
  QUALITIES, SCALES, VOICING_STYLES, KEY_ROOTS, REHARM_TECHNIQUES, parseChord, chordPcs, chordLabel, chordFormula, degreeLabel,
  voice, substitutions, scaleMidi, diatonicChords, prog, reharmonize, parseProgression, poly, line, merge, ex as X, pretty, midiName,
  pcName, N, matchesChord, detectChord, walk,
} from './music.js';

export const TOOLS = [
  { id: 'chords', title: 'Chord Explorer', icon: '♯', desc: 'Any chord, any voicing: formula, sound, and substitutions with context.' },
  { id: 'scales', title: 'Scale Explorer', icon: '♪', desc: 'Scales and modes on the keyboard, with the chords they fit.' },
  { id: 'reharm', title: 'Reharm Lab', icon: '⇄', desc: 'Type a progression, apply tritone subs, ii–Vs, passing chords and more.' },
  { id: 'rhythm', title: 'Rhythm Lab', icon: '◔', desc: 'Polyrhythms with a visual clock, plus displacement and comping grooves.' },
  { id: 'practice', title: 'Practice Room', icon: '◎', desc: 'Live chord detector, chord drills and ear training.' },
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function renderTool(view, main, app, route) {
  const fn = { chords: chordExplorer, scales: scaleExplorer, reharm: reharmLab, rhythm: rhythmLab, practice: practiceRoom, library: libraryView }[view];
  if (!fn) return false;
  fn(main, app, route);
  return true;
}

const FAMILY_CONTEXT = {
  maj: 'Tonic (I) or subdominant (IV) colour. Jazz ballads, neo-soul, worship, bossa nova. Rest on it, end phrases on it.',
  min: 'ii chords in ii–V–I, vi and iii chords, minor tonics. m9 and m11 are the R&B, gospel and neo-soul staples.',
  dom: 'Tension that resolves down a 5th (V → I). Blues uses it as a home chord; gospel loves 13 and 13♭9; bebop uses altered tensions.',
  hdim: 'The ii chord in minor keys (iiø7 → V7♭9 → i). Also vii in major. Locrian / locrian ♮2 sound.',
  dim: 'Symmetrical passing chord between diatonic chords (♯I°7, ♯IV°7). Same notes as a rootless 7♭9.',
  aug: 'Suspense and chromatic motion (I → I+ → vi). Whole-tone colour.',
  sus: 'Floating dominant without the 3rd. Gospel, modern jazz and pop love IV/V and 9sus4 sounds.',
};

// ================================================================ CHORD EXPLORER
function chordExplorer(main, app, route) {
  const { piano, kb, esc } = app;
  let root = 'C', quality = 'maj7', style = 'root';
  const pre = route.query.get('c');
  if (pre) { try { const c = parseChord(pre); if (!c.poly) { root = c.rootName; quality = c.quality; } } catch { } }
  const groups = {};
  for (const [q, d] of Object.entries(QUALITIES)) (groups[d.fam] = groups[d.fam] || []).push([q, d]);
  const famNames = { maj: 'Major', min: 'Minor', dom: 'Dominant', sus: 'Suspended', hdim: 'Half-diminished', dim: 'Diminished', aug: 'Augmented' };
  main.innerHTML = `<div class="wrap">
    <div class="eyebrow">Studio tool</div><h1 class="page-title">Chord Explorer</h1>
    <p class="lede">Choose a root, a quality and a voicing. See the formula, hear it, and try substitutions in context.</p>
    <div class="sec card">
      <div class="picker" id="roots">${KEY_ROOTS.map(r => `<button data-r="${r}">${pretty(r)}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px">
        <select id="qual">${Object.entries(groups).map(([f, list]) => `<optgroup label="${famNames[f]}">${list.map(([q, d]) => `<option value="${q}">${esc(d.name)} (${q ? 'C' + q : 'C'})</option>`).join('')}</optgroup>`).join('')}</select>
        <select id="style">${Object.entries(VOICING_STYLES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn primary" id="pBlock">${app.ICON.play}Play</button><button class="btn" id="pArp">Arpeggiate</button>
      </div>
    </div>
    <div class="sec grid g2">
      <div class="card"><div class="big-chord" id="cName"></div><div class="muted" id="cFull" style="margin-top:6px;font-weight:700"></div>
        <div class="formula" id="cFormula"></div><p class="muted" id="cNotes" style="margin:12px 0 0;font-weight:600"></p>
        <p id="cContext" style="margin:14px 0 0;font-size:14px"></p></div>
      <div class="card"><h3>Inversions & voicings</h3><p class="muted" style="font-size:13px;margin:4px 0 12px">Same chord, different shapes. Click to hear and see.</p><div class="grid" id="cVoicings" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px"></div></div>
    </div>
    <div class="sec"><div class="sec-h"><h2>Substitutions & alternatives</h2><span class="muted">Hear each one resolve in context</span></div><div class="grid" id="subs"></div></div>
  </div>`;
  const sym = () => root + quality;
  const draw = () => {
    $$('#roots button', main).forEach(b => b.classList.toggle('on', b.dataset.r === root));
    $('#qual', main).value = quality; $('#style', main).value = style;
    const s = sym(), c = parseChord(s);
    $('#cName', main).textContent = chordLabel(s);
    $('#cFull', main).textContent = pretty(root) + ' ' + QUALITIES[quality].name;
    $('#cFormula', main).innerHTML = c.iv.map((iv, i) => `<span class="${i === 0 ? 'r' : ''}">${degreeLabel(iv, c.fam)}</span>`).join('');
    $('#cNotes', main).textContent = 'Notes: ' + chordPcs(c).map(p => pretty(pcName(p, !/#/.test(root)))).join(' – ');
    $('#cContext', main).innerHTML = '<b>Where it’s used:</b> ' + FAMILY_CONTEXT[c.fam];
    const v = voice(c, style);
    mark([...v.lh, ...v.rh], c);
    const shapes = ['inv0', 'inv1', 'inv2', 'inv3', 'shell', 'rootless', 'drop2', 'quartal', 'gospel', 'spread'].filter(k => !(k === 'inv3' && c.iv.length < 4));
    $('#cVoicings', main).innerHTML = shapes.map(k => `<button class="btn sm" data-v="${k}" style="justify-content:flex-start">${esc(VOICING_STYLES[k])}</button>`).join('');
    $$('#cVoicings [data-v]', main).forEach(b => b.onclick = () => { style = b.dataset.v; draw(); playBlock(); });
    const subs = substitutions(s);
    $('#subs', main).innerHTML = subs.length ? subs.map((x, i) => `<div class="sub-row"><span class="sn">${esc(chordLabel(x.sym))}</span><span style="flex:1"><b>${esc(x.title)}</b><p>${esc(x.why)}</p></span>
      <button class="btn xs" data-s="${i}" data-m="solo">Hear</button><button class="btn xs primary" data-s="${i}" data-m="ctx">In context</button></div>`).join('') : '<p class="muted">No common substitutions for this quality.</p>';
    $$('#subs [data-s]', main).forEach(b => b.onclick = () => {
      const x = subs[+b.dataset.s];
      if (b.dataset.m === 'solo') { const vv = voice(x.sym, 'root+rootless'); piano.strike([...vv.lh, ...vv.rh]); mark([...vv.lh, ...vv.rh], parseChord(x.sym)); return; }
      const ctxProg = contextFor(c, x.sym);
      piano.playExample(X('ctx', prog(ctxProg, { style: 'root+rootless' }), { bpm: 72, pedal: 'chord' }));
    });
  };
  const mark = (notes, c) => {
    kb.setMarks(new Map(notes.map(n => {
      const iv = ((n % 12) - c.root + 12) % 12;
      const ext = c.iv.find(i => i % 12 === iv);
      return [n, { label: ext !== undefined ? degreeLabel(ext, c.fam) : pretty(midiName(n).replace(/\d/g, '')), cls: iv === 0 ? 'root' : '' }];
    })));
    if (notes.length) kb.scrollTo(notes[Math.floor(notes.length / 2)]);
  };
  const notesNow = () => { const v = voice(sym(), style); return [...v.lh, ...v.rh]; };
  const playBlock = () => piano.strike(notesNow(), { dur: 2.2 });
  $$('#roots button', main).forEach(b => b.onclick = () => { root = b.dataset.r; draw(); playBlock(); });
  $('#qual', main).onchange = e => { quality = e.target.value; draw(); playBlock(); };
  $('#style', main).onchange = e => { style = e.target.value; draw(); playBlock(); };
  $('#pBlock', main).onclick = playBlock;
  $('#pArp', main).onclick = () => piano.strike(notesNow(), { arp: 0.12, dur: 2.5 });
  draw();
}

/** Give a substitute chord a natural context: original → sub → resolution. */
function contextFor(c, subSym) {
  const name = (pc, q) => pcName((pc + 120) % 12) + q;
  const s = parseChord(subSym);
  if (c.fam === 'dom') {
    const target = name(c.root + 5, 'maj9');
    return [[name(c.root + 7, 'm9'), 2], [c.sym, 2], [target, 4], [name(c.root + 7, 'm9'), 2], [subSym, 2], [target, 4]];
  }
  if (s.fam === 'dom') return [[c.sym, 4], [subSym, 2], [name(s.root + 5, s.quality === '7' && c.fam === 'min' ? 'm9' : 'maj9'), 4]];
  return [[c.sym, 4], [subSym, 4], [name(c.root + 7, '13'), 2], [c.sym, 4]];
}

// ================================================================ SCALE EXPLORER
function scaleExplorer(main, app) {
  const { piano, kb, esc } = app;
  let root = 'C', scale = 'major';
  main.innerHTML = `<div class="wrap">
    <div class="eyebrow">Studio tool</div><h1 class="page-title">Scale Explorer</h1>
    <p class="lede">See every scale and mode across the whole keyboard. Hear it, learn where it’s used, and play the chords it creates.</p>
    <div class="sec card">
      <div class="picker" id="roots">${KEY_ROOTS.map(r => `<button data-r="${r}">${pretty(r)}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><select id="scale">${Object.entries(SCALES).map(([k, s]) => `<option value="${k}">${esc(s.name)}</option>`).join('')}</select>
      <span class="spacer"></span><button class="btn primary" id="up">${app.ICON.play}Up & down</button><button class="btn" id="up2">Two octaves</button><button class="btn" id="drone">Over a drone</button></div>
    </div>
    <div class="sec grid g2">
      <div class="card"><div class="big-chord" id="sName" style="font-size:clamp(30px,5vw,52px)"></div><div class="formula" id="sFormula"></div><p id="sUse" style="margin:14px 0 0;font-size:14px"></p></div>
      <div class="card"><h3>Chords from this scale</h3><p class="muted" style="font-size:13px;margin:4px 0 12px" id="chHint">Stack 3rds on each degree. Click to hear.</p><div class="chord-strip" id="sChords"></div></div>
    </div></div>`;
  const draw = () => {
    $$('#roots button', main).forEach(b => b.classList.toggle('on', b.dataset.r === root));
    $('#scale', main).value = scale;
    const sc = SCALES[scale];
    $('#sName', main).textContent = pretty(root) + ' ' + sc.name;
    const flat = /b/.test(root) || ['F'].includes(root);
    const names = sc.iv.map(i => pretty(pcName((N(root + '4') + i) % 12, flat)));
    $('#sFormula', main).innerHTML = sc.iv.map((i, k) => `<span class="${k === 0 ? 'r' : ''}" title="${names[k]}">${['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'][i]}<small style="opacity:.6;margin-left:4px">${names[k]}</small></span>`).join('');
    $('#sUse', main).innerHTML = '<b>Use it:</b> ' + esc(sc.use);
    const rootPc = N(root + '4') % 12;
    const marks = new Map();
    for (let m = 21; m <= 108; m++) {
      const iv = (m - rootPc + 1200) % 12;
      if (sc.iv.includes(iv)) marks.set(m, { label: '', cls: 'scale' + (iv === 0 ? ' root' : '') });
    }
    kb.setMarks(marks);
    kb.scrollTo(N(root + '4'));
    const dc = diatonicChords(root, scale, true);
    $('#chHint', main).textContent = dc.length ? 'Stack 3rds on each degree. Click to hear.' : 'Diatonic chords are shown for seven-note scales.';
    $('#sChords', main).innerHTML = dc.map((c, i) => `<button class="cs" data-i="${i}"><small>${c.roman}</small><b>${esc(chordLabel(c.sym))}</b></button>`).join('');
    $$('#sChords .cs', main).forEach(b => b.onclick = () => { const v = voice(dc[+b.dataset.i].sym, 'root'); piano.strike([...v.lh, ...v.rh], { dur: 2 }); });
  };
  const play = (oct) => {
    const notes = scaleMidi(root, scale, oct === 2 ? 3 : 4, oct, true);
    piano.playExample(X('scale', line(notes.map(n => midiName(n, true)).join(':.5 ') + ':.5'), { bpm: 132 }));
  };
  $$('#roots button', main).forEach(b => b.onclick = () => { root = b.dataset.r; draw(); });
  $('#scale', main).onchange = e => { scale = e.target.value; draw(); };
  $('#up', main).onclick = () => play(1);
  $('#up2', main).onclick = () => play(2);
  $('#drone', main).onclick = () => {
    const notes = scaleMidi(root, scale, 4, 1, true);
    const r = N(root + '2');
    const ev = merge(line(notes.map(n => midiName(n, true)).join(':.5 ') + ':.5'), [{ t: 0, d: notes.length * 0.5, n: [r, r + 7, r + 12], v: 0.5, hand: 'lh' }]);
    piano.playExample(X('drone', ev, { bpm: 100, pedal: [[0, notes.length * 0.5]] }));
  };
  draw();
}

// ================================================================ REHARM LAB
const PRESETS = [
  { name: 'ii–V–I', p: 'Dm7 G7 Cmaj7 Cmaj7' },
  { name: 'I–vi–IV–V', p: 'C Am F G' },
  { name: '1–4–5 hymn', p: 'C F G C' },
  { name: 'I–IV–I–V', p: 'C F C G7' },
  { name: 'Blues in F', p: 'F7 Bb7 F7 F7 Bb7 Bb7 F7 F7 C7 Bb7 F7 C7' },
  { name: 'Minor ii–V–i', p: 'Dm7b5 G7 Cm7 Cm7' },
  { name: 'Pop 4-chord', p: 'C G Am F' },
];
function reharmLab(main, app) {
  const { piano, esc, LS } = app;
  const st = LS.get('ks.reharm', { text: 'C Am F G', tech: ['extend', 'secondary'], style: 'root+rootless', bpm: 84 });
  main.innerHTML = `<div class="wrap">
    <div class="eyebrow">Studio tool</div><h1 class="page-title">Reharm Lab</h1>
    <p class="lede">Type chords separated by spaces. Add <b>(beats)</b> for length, e.g. <code>Cmaj7(2)</code>. Default is 4 beats. Toggle techniques, then compare original and reharm.</p>
    <div class="sec card">
      <input class="prog-input" id="pIn" value="${esc(st.text)}" spellcheck="false" aria-label="Chord progression">
      <div class="row" style="margin-top:10px"><span class="muted" style="font-size:12px;font-weight:700">PRESETS</span>${PRESETS.map((p, i) => `<button class="btn xs" data-p="${i}">${esc(p.name)}</button>`).join('')}</div>
    </div>
    <div class="sec grid g3" id="techs">${Object.entries(REHARM_TECHNIQUES).map(([k, t]) => `<label class="tech ${st.tech.includes(k) ? 'on' : ''}"><input type="checkbox" value="${k}" ${st.tech.includes(k) ? 'checked' : ''}><span><b>${t.name}</b><small>${t.desc}</small></span></label>`).join('')}</div>
    <div class="sec card">
      <div class="row"><label class="inline">Voicing <select id="style">${Object.entries(VOICING_STYLES).filter(([k]) => !k.startsWith('inv')).map(([k, v]) => `<option value="${k}" ${k === st.style ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <label class="inline">Tempo <input type="range" id="bpm" min="40" max="180" value="${st.bpm}"><b id="bpmV">${st.bpm}</b></label>
      <label class="inline"><input type="checkbox" id="loop"> Loop</label><span class="spacer"></span>
      <button class="btn" id="pOrig">${app.ICON.play}Original</button><button class="btn primary" id="pRe">${app.ICON.play}Reharm</button></div>
      <h3 style="margin-top:20px">Original</h3><div class="chord-strip" id="orig" style="margin-top:8px"></div>
      <h3 style="margin-top:20px">Reharmonized</h3><div class="chord-strip" id="re" style="margin-top:8px"></div>
      <p class="muted" style="font-size:13px;margin:14px 0 0">Highlighted chords were added or changed. Click any chord to hear it.</p>
    </div></div>`;
  let orig = [], re = [];
  const save = () => LS.set('ks.reharm', st);
  const strip = (el, list, changed) => {
    el.innerHTML = list.map((c, i) => `<button class="cs ${changed && c.note ? 'changed' : ''}" data-i="${i}"><b>${esc(chordLabel(c.sym))}</b><small>${esc(c.note || '')} ${c.beats !== 4 ? '· ' + c.beats + ' beats' : ''}</small></button>`).join('');
    $$('.cs', el).forEach(b => b.onclick = () => { const v = voice(list[+b.dataset.i].sym, st.style); piano.strike([...v.lh, ...v.rh], { dur: 1.8 }); });
  };
  const compute = () => {
    const parsed = parseProgression(st.text);
    orig = parsed.map(x => Array.isArray(x) ? { sym: x[0], beats: x[1] } : { sym: x, beats: 4 });
    re = reharmonize(parsed, st.tech);
    strip($('#orig', main), orig, false);
    strip($('#re', main), re, true);
  };
  const playList = (list, which) => {
    if (!list.length) return;
    const ev = prog(list.map(c => [c.sym, c.beats]), { style: st.style });
    const strip = $(which === 'orig' ? '#orig' : '#re', main);
    let idx = -1;
    piano.playExample(X(which, ev, { bpm: st.bpm, pedal: 'chord' }), {
      loop: $('#loop', main).checked,
      onChord: () => { idx = (idx + 1) % list.length; $$('.cs', strip).forEach((b, i) => b.classList.toggle('now', i === idx)); },
    });
  };
  $('#pIn', main).oninput = e => { st.text = e.target.value; save(); compute(); };
  $$('[data-p]', main).forEach(b => b.onclick = () => { st.text = PRESETS[+b.dataset.p].p; $('#pIn', main).value = st.text; save(); compute(); });
  $$('#techs input', main).forEach(cb => cb.onchange = () => {
    st.tech = $$('#techs input', main).filter(x => x.checked).map(x => x.value);
    $$('#techs .tech', main).forEach(l => l.classList.toggle('on', $('input', l).checked));
    save(); compute();
  });
  $('#style', main).onchange = e => { st.style = e.target.value; save(); };
  $('#bpm', main).oninput = e => { st.bpm = +e.target.value; $('#bpmV', main).textContent = st.bpm; save(); };
  $('#pOrig', main).onclick = () => playList(orig, 'orig');
  $('#pRe', main).onclick = () => playList(re, 're');
  const off = piano.on('play', (id, on) => { if (!on) $$('.cs.now', main).forEach(b => b.classList.remove('now')); });
  app.onView(off);
  compute();
}

// ================================================================ RHYTHM LAB
function rhythmLab(main, app) {
  const { piano, onView } = app;
  let a = 3, b = 2, bpm = 60;
  main.innerHTML = `<div class="wrap">
    <div class="eyebrow">Studio tool</div><h1 class="page-title">Rhythm Lab</h1>
    <p class="lede">Feel two pulses at once. The outer ring is the right hand, the inner ring the left. Both start together on the top dot.</p>
    <div class="sec card">
      <div class="row"><span class="muted" style="font-weight:700">Ratio</span>
        ${[[3, 2], [2, 3], [4, 3], [3, 4], [5, 4], [5, 3], [7, 4]].map(([x, y]) => `<button class="btn sm" data-r="${x}:${y}">${x}:${y}</button>`).join('')}
        <span class="spacer"></span><label class="inline">Cycle tempo <input type="range" id="bpm" min="30" max="120" value="${bpm}"><b id="bpmV">${bpm}</b></label>
        <button class="btn primary" id="go">${app.ICON.play}Play loop</button></div>
      <div class="poly-viz sec" id="viz"></div>
      <p class="muted" style="text-align:center;font-weight:700" id="mnem"></p>
    </div>
    <div class="sec"><div class="sec-h"><h2>Displacement & grooves</h2><span class="muted">Loop them and play along</span></div><div class="grid g2" id="grooves"></div></div>
  </div>`;
  const MNEM = { '3:2': '“nice cup-of tea”', '2:3': '“nice cup-of tea” (hands swapped)', '4:3': '“pass the gol-den but-ter”', '3:4': '“pass the gol-den but-ter” (hands swapped)' };
  let raf = null, startT = 0, playing = false;
  const svg = () => {
    const R1 = 110, R2 = 70, cx = 130, cy = 130;
    const dots = (n, R, cls) => Array.from({ length: n }, (_, i) => { const ang = -Math.PI / 2 + i / n * Math.PI * 2; return `<circle class="${cls}" data-i="${i}" cx="${cx + R * Math.cos(ang)}" cy="${cy + R * Math.sin(ang)}" r="${i === 0 ? 11 : 8}" />`; }).join('');
    $('#viz', main).innerHTML = `<svg viewBox="0 0 260 260"><circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="var(--line)" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="var(--line)" stroke-width="2"/>
      <g fill="var(--roll-example)">${dots(a, R1, 'da')}</g><g fill="var(--roll-lh)">${dots(b, R2, 'db')}</g>
      <line id="hand" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - R1 - 12}" stroke="var(--text)" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text)">${a}:${b}</text></svg>`;
    $('#mnem', main).textContent = MNEM[a + ':' + b] || 'Count the smallest common subdivision: ' + (a * b) + ' pulses per cycle.';
    $$('[data-r]', main).forEach(x => x.classList.toggle('on', x.dataset.r === a + ':' + b));
  };
  const anim = () => {
    if (!playing) return;
    const cycle = 60 / bpm * 1000;
    const ph = ((performance.now() - startT) % cycle) / cycle;
    const hand = $('#hand', main);
    if (hand) hand.setAttribute('transform', `rotate(${ph * 360} 130 130)`);
    $$('.da', main).forEach((d, i) => d.style.opacity = Math.abs(ph - i / a) < 0.06 || (i === 0 && ph > 0.94) ? 1 : 0.35);
    $$('.db', main).forEach((d, i) => d.style.opacity = Math.abs(ph - i / b) < 0.06 || (i === 0 && ph > 0.94) ? 1 : 0.35);
    raf = requestAnimationFrame(anim);
  };
  const play = () => {
    if (playing) { piano.stopExample(); return; }
    const ev = poly(a, b, { len: 1, reps: 1, noteA: [N('G5')], noteB: [N('C3')] });
    piano.playExample(X('poly', ev, { bpm }), { loop: true, id: 'poly' }).then(st => { startT = st.startPerf; });
  };
  const off = piano.on('play', (id, on) => {
    if (id !== 'poly') return;
    playing = on;
    $('#go', main).innerHTML = on ? app.ICON.stop + 'Stop' : app.ICON.play + 'Play loop';
    if (on) anim(); else cancelAnimationFrame(raf);
  });
  onView(off); onView(() => cancelAnimationFrame(raf));
  $$('[data-r]', main).forEach(x => x.onclick = () => { [a, b] = x.dataset.r.split(':').map(Number); svg(); if (playing) { piano.stopExample(); play(); } });
  $('#bpm', main).oninput = e => { bpm = +e.target.value; $('#bpmV', main).textContent = bpm; };
  $('#bpm', main).onchange = () => { if (playing) { piano.stopExample(); play(); } };
  $('#go', main).onclick = play;
  svg();

  const motif = 'C5:.5 E5 G5 A5:1';
  const bassBeat = line('C3:1 G2 C3 G2 C3 G2 C3 G2', { hand: 'lh', vel: 0.5 });
  const grooves = [
    X('Motif on beat 1', merge(line(motif + ' r:2.5 ' + motif + ' r:1', { vel: .8 }), bassBeat), { bpm: 100 }),
    X('Displaced by an eighth', merge(line('r:.5 ' + motif + ' r:2.5 ' + motif + ' r:.5', { vel: .8 }), bassBeat), { bpm: 100 }),
    X('Displaced by a quarter', merge(line('r:1 ' + motif + ' r:2.5 ' + motif, { vel: .8 }), bassBeat), { bpm: 100 }),
    X('Charleston comping', merge(prog(['Dm9', 'G13', 'Cmaj9', 'A7b9'], { style: 'rootless', rh: [[0, 1], [1.5, 0.45, 0.9]] }), walk(['Dm7', 'G7', 'Cmaj7', 'A7'])), { bpm: 140, swing: 1 }),
    X('Bossa clave feel', merge(prog(['Dm9', 'G13'], { style: 'rootless', rh: [[0, 0.45], [1.5, 0.9], [3, 0.45]] }), line('D2:1.5 A2:.5 A2:1.5 D2:.5 G2:1.5 D2:.5 D2:1.5 G2:.5', { hand: 'lh', vel: .65 })), { bpm: 128 }),
    X('Dotted-quarter hemiola', merge(prog(['Dm9', 'Dm9', 'Dm9', 'G13', 'G13', 'G13', 'Cmaj9', 'Cmaj9'].map(s => [s, 1.5]), { style: 'rootless', rh: [[0, 1.2]] }), walk(['Dm7', 'G7', 'Cmaj7'])), { bpm: 120, swing: .8 }),
  ];
  grooves.forEach(g => $('#grooves', main).appendChild(app.exampleCard(g)));
}

// ================================================================ PRACTICE ROOM
const DRILL_QUALITIES = { '': 'Major', 'm': 'Minor', 'dim': 'Dim', 'aug': 'Aug', 'sus4': 'Sus4', 'maj7': 'Maj7', '7': 'Dom7', 'm7': 'Min7', 'm7b5': 'Half-dim', 'dim7': 'Dim7', 'maj9': 'Maj9', 'm9': 'Min9', '9': 'Dom9', '13': '13', '7b9': '7♭9', '7#9': '7♯9', 'm11': 'Min11', '69': '6/9' };
const EAR_SETS = {
  'Triads': ['', 'm', 'dim', 'aug'],
  '7th chords': ['maj7', '7', 'm7', 'm7b5', 'dim7'],
  'Colours': ['maj9', 'm9', '13', '7alt', '69', 'm11'],
};
function practiceRoom(main, app) {
  const { piano, esc, LS, onView } = app;
  const st = LS.get('ks.drill', { quals: ['', 'm', 'maj7', '7', 'm7'], keys: 'all', best: 0 });
  main.innerHTML = `<div class="wrap">
    <div class="eyebrow">Studio tool</div><h1 class="page-title">Practice Room</h1>
    <p class="lede">Your MIDI keyboard becomes the teacher: it names what you play, drills chords in every key and trains your ear.</p>
    <div class="sec card detector"><div class="eyebrow">Live chord detector</div><div class="big-chord" id="det">–</div><div class="notes" id="detN">Play any chord</div>
      <div class="history" id="hist"></div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn sm" id="hPlay" disabled>${app.ICON.play}Play captured progression</button><button class="btn sm ghost" id="hClear">Clear</button></div></div>

    <div class="sec grid g2">
      <div class="card"><div class="row"><h3>Chord drill</h3><span class="spacer"></span><div class="score"><span><small>Score</small><b id="sc">0</b></span><span><small>Streak</small><b id="sk">0</b></span><span><small>Best</small><b id="sb">${st.best}</b></span></div></div>
        <div class="drill-target" id="dt">–</div><div class="feedback" id="dfb">Press start, then play the chord shown (any voicing).</div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="dGo">Start</button><button class="btn" id="dSkip">Skip</button><button class="btn ghost" id="dHear">${app.ICON.play}Hear</button>
          <select id="dKeys"><option value="all">All 12 keys</option><option value="easy">C, F, G, B♭, D</option><option value="flat">Flat keys</option><option value="sharp">Sharp keys</option></select></div>
        <details style="margin-top:12px"><summary class="muted" style="cursor:pointer;font-weight:700">Chord qualities</summary><div class="row" style="margin-top:8px" id="dQuals">${Object.entries(DRILL_QUALITIES).map(([q, n]) => `<label class="inline"><input type="checkbox" value="${q}" ${st.quals.includes(q) ? 'checked' : ''}>${n}</label>`).join('')}</div></details>
      </div>
      <div class="card"><div class="row"><h3>Ear training</h3><span class="spacer"></span><select id="eSet">${Object.keys(EAR_SETS).map(k => `<option>${k}</option>`).join('')}</select></div>
        <p class="muted" style="font-size:13px">Listen and name the chord quality.</p>
        <div class="row"><button class="btn primary" id="eGo">${app.ICON.play}New chord</button><button class="btn" id="eAgain">Repeat</button><span class="spacer"></span><div class="score"><span><small>Correct</small><b id="eC">0</b></span><span><small>Tried</small><b id="eT">0</b></span></div></div>
        <div class="answer-grid" id="eAns" style="margin-top:14px"></div><div class="feedback" id="efb" style="margin-top:10px"></div>
      </div>
    </div></div>`;

  // detector + capture
  const hist = [];
  let lastSym = null, stableTimer = null;
  const offC = piano.on('chord', (c, notes) => {
    $('#det', main).textContent = c ? chordLabel(c.sym) : (notes.length === 1 ? pretty(midiName(notes[0]).replace(/\d+$/, '')) : '–');
    $('#detN', main).textContent = notes.length ? notes.map(n => pretty(midiName(n))).join('  ') : 'Play any chord';
    clearTimeout(stableTimer);
    if (c && !c.interval && c.sym !== lastSym) {
      stableTimer = setTimeout(() => {
        lastSym = c.sym;
        hist.push({ sym: c.sym, notes: [...notes] });
        if (hist.length > 16) hist.shift();
        drawHist();
      }, 280);
    }
  });
  onView(offC); onView(() => clearTimeout(stableTimer));
  const drawHist = () => {
    $('#hist', main).innerHTML = hist.map(h => `<span class="chord-chip">${esc(chordLabel(h.sym))}</span>`).join('');
    $('#hPlay', main).disabled = !hist.length;
  };
  $('#hPlay', main).onclick = () => {
    const events = hist.map((h, i) => ({ t: i * 2, d: 1.9, n: h.notes, v: 0.65 }));
    events.chords = hist.map((h, i) => ({ sym: h.sym, t: i * 2, beats: 2 }));
    piano.playExample(X('captured', events, { bpm: 80, pedal: 'chord' }));
  };
  $('#hClear', main).onclick = () => { hist.length = 0; lastSym = null; drawHist(); };

  // drill
  const KEYSETS = { all: KEY_ROOTS, easy: ['C', 'F', 'G', 'Bb', 'D'], flat: ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'], sharp: ['G', 'D', 'A', 'E', 'B', 'F#'] };
  let target = null, score = 0, streak = 0, active = false, t0 = 0;
  $('#dKeys', main).value = st.keys;
  const newTarget = () => {
    const roots = KEYSETS[st.keys] || KEY_ROOTS;
    const quals = st.quals.length ? st.quals : ['maj7'];
    let s;
    do { s = roots[Math.floor(Math.random() * roots.length)] + quals[Math.floor(Math.random() * quals.length)]; } while (s === target && roots.length * quals.length > 1);
    target = s; t0 = performance.now();
    $('#dt', main).textContent = chordLabel(target);
    $('#dfb', main).textContent = 'Play it in any voicing (the 5th is optional on bigger chords).';
    $('#dfb', main).className = 'feedback';
  };
  const offD = piano.on('chord', () => {
    if (!active || !target) return;
    const notes = piano.heldNotes();
    if (notes.length >= 3 && matchesChord(notes, target)) {
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      score++; streak++;
      if (streak > st.best) { st.best = streak; LS.set('ks.drill', st); }
      $('#sc', main).textContent = score; $('#sk', main).textContent = streak; $('#sb', main).textContent = st.best;
      $('#dfb', main).textContent = `✓ ${chordLabel(target)} in ${secs}s`;
      $('#dfb', main).className = 'feedback good';
      target = null;
      setTimeout(() => active && newTarget(), 700);
    }
  });
  onView(offD);
  $('#dGo', main).onclick = () => {
    active = !active;
    $('#dGo', main).textContent = active ? 'Stop' : 'Start';
    if (active) { score = 0; streak = 0; $('#sc', main).textContent = 0; $('#sk', main).textContent = 0; newTarget(); }
  };
  $('#dSkip', main).onclick = () => { if (active) { streak = 0; $('#sk', main).textContent = 0; newTarget(); } };
  $('#dHear', main).onclick = () => { if (target) { const v = voice(target, 'root'); piano.strike([...v.lh, ...v.rh], { arp: 0.05 }); } };
  $('#dKeys', main).onchange = e => { st.keys = e.target.value; LS.set('ks.drill', st); };
  $$('#dQuals input', main).forEach(cb => cb.onchange = () => { st.quals = $$('#dQuals input', main).filter(x => x.checked).map(x => x.value); LS.set('ks.drill', st); });

  // ear training
  let eq = null, eRoot = 'C', eC = 0, eT = 0, answered = false;
  const eDraw = () => {
    const set = EAR_SETS[$('#eSet', main).value];
    $('#eAns', main).innerHTML = set.map(q => `<button class="btn sm" data-q="${q}">${esc(QUALITIES[q].name)}</button>`).join('');
    $$('#eAns [data-q]', main).forEach(b => b.onclick = () => {
      if (!eq || answered) return;
      answered = true; eT++;
      const ok = b.dataset.q === eq;
      if (ok) eC++;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) $(`#eAns [data-q="${CSS.escape(eq)}"]`, main).classList.add('right');
      $('#eC', main).textContent = eC; $('#eT', main).textContent = eT;
      $('#efb', main).textContent = ok ? 'Correct!' : `It was ${QUALITIES[eq].name} (${chordLabel(eRoot + eq)}).`;
      $('#efb', main).className = 'feedback ' + (ok ? 'good' : 'bad');
    });
  };
  const eHear = () => { if (!eq) return; const v = voice(eRoot + eq, 'root'); piano.strike([...v.lh, ...v.rh], { arp: 0.03, dur: 2.2 }); };
  $('#eSet', main).onchange = () => { eq = null; eDraw(); };
  $('#eGo', main).onclick = () => {
    const set = EAR_SETS[$('#eSet', main).value];
    eq = set[Math.floor(Math.random() * set.length)];
    eRoot = KEY_ROOTS[Math.floor(Math.random() * 12)];
    answered = false; eDraw(); $('#efb', main).textContent = ''; eHear();
  };
  $('#eAgain', main).onclick = eHear;
  eDraw();
}

// ================================================================ LIBRARY
function libraryView(main, app) {
  const { library, esc, LESSONS, STAGES, openMedia, mediaRow, onView } = app;
  let filter = 'all', q = '';
  const draw = () => {
    const counts = library.counts();
    const items = library.items.filter(it => (filter === 'all' || it.type === filter) &&
      (!q || (library.title(it) + ' ' + library.folderLabel(it)).toLowerCase().includes(q.toLowerCase())));
    main.innerHTML = `<div class="wrap">
      <div class="eyebrow">Your materials</div><h1 class="page-title">Video & Materials</h1>
      <p class="lede">Connect the folder with your course videos, PDFs, audio and MIDI files. Files are read directly by your browser and never uploaded.
      Each file is matched to lessons by its name and folder, and you can pin any file to any lesson.</p>
      <div class="sec card lib-head">
        <div style="flex:1;min-width:240px"><h3>${library.items.length ? library.items.length + ' files' : 'No folder connected'}</h3>
          <p class="muted" style="margin:4px 0 0;font-size:13px">${library.items.length ? Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(' · ') : (library.supportsHandle ? 'Your browser will remember the folder (you may be asked to allow access again after a restart).' : 'This browser needs you to choose the folder each visit. Chrome or Edge remember it.')}</p></div>
        ${library.needsPermission ? '<button class="btn primary" id="lRe">Reconnect folder</button>' : ''}
        <button class="btn ${library.items.length ? '' : 'primary'}" id="lConnect">${library.items.length ? 'Change folder' : 'Connect folder'}</button>
      </div>
      ${library.items.length ? `
      <div class="sec lib-filters">
        ${['all', 'video', 'pdf', 'audio', 'midi', 'image', 'text'].filter(t => t === 'all' || counts[t]).map(t => `<button class="btn sm ${filter === t ? 'on' : ''}" data-f="${t}">${t === 'all' ? 'All' : t.toUpperCase()}${t !== 'all' ? ' · ' + counts[t] : ''}</button>`).join('')}
        <span class="spacer"></span><input type="text" id="lq" placeholder="Filter files…" value="${esc(q)}" style="min-width:200px">
      </div>
      <div id="lViewer"></div>
      <div class="sec media-list" id="lList">${items.slice(0, 400).map(it => {
        const m = library.lessonsFor(it, LESSONS);
        const tags = [...m.pinned.map(l => `<span class="tag acc" title="Pinned">${esc(short(l.title))}</span>`), ...m.suggested.slice(0, 2).map(l => `<span class="tag" title="Suggested match">${esc(short(l.title))}</span>`)].join('');
        return mediaRow(it, `<span class="row" style="gap:4px;flex-wrap:nowrap;overflow:hidden;max-width:40%">${tags}</span><button class="btn xs" data-assign>Add to lesson</button>`);
      }).join('')}${items.length > 400 ? `<p class="muted">Showing 400 of ${items.length}. Use the filter to narrow down.</p>` : ''}</div>` : `
      <div class="sec drop-hint"><h3>Bring your lessons in</h3><p class="muted">Supported: MP4 / MOV / WEBM video, PDF, MP3 / WAV / M4A audio, MIDI files (they play on the 88-key roll), images and text notes.</p>
      <button class="btn primary" id="lConnect2">Choose folder</button></div>`}
      <div class="sec card"><h3>Hidden words in titles</h3><p class="muted" style="font-size:13px;margin:4px 0 10px">These words or names are removed from every displayed file title. The connected folder’s own name is added automatically. One per line.</p>
        <textarea id="lHide" rows="3" style="width:100%">${esc(library.hiddenPhrases.join('\n'))}</textarea>
        <div class="row" style="margin-top:8px"><button class="btn sm" id="lHideSave">Save</button></div></div>
    </div>`;
    const connect = async () => { try { await library.connect(); } catch (e) { if (e.name !== 'AbortError') app.toast('Could not open folder: ' + e.message); } };
    $('#lConnect', main).onclick = connect;
    const c2 = $('#lConnect2', main); if (c2) c2.onclick = connect;
    const re = $('#lRe', main); if (re) re.onclick = () => library.reconnect();
    $$('[data-f]', main).forEach(b => b.onclick = () => { filter = b.dataset.f; draw(); });
    const lq = $('#lq', main);
    if (lq) lq.oninput = e => { q = e.target.value; const pos = e.target.selectionStart; draw(); const n = $('#lq', main); n.focus(); n.setSelectionRange(pos, pos); };
    $('#lHideSave', main).onclick = () => { library.setHiddenPhrases($('#lHide', main).value.split('\n')); app.toast('Titles updated'); };
    $$('.media-row', main).forEach(row => {
      const it = library.items.find(i => i.path === row.dataset.path);
      $('[data-open]', row).onclick = () => { openMedia(it, $('#lViewer', main)); main.scrollTo({ top: $('#lViewer', main).offsetTop - 80, behavior: 'smooth' }); };
      $('[data-assign]', row).onclick = () => assignDialog(it);
    });
  };
  const assignDialog = (it) => {
    const m = library.lessonsFor(it, LESSONS);
    app.modal(`<h2>Add to lesson</h2><p class="muted">${esc(library.title(it))}</p>
      <select id="aSel" style="width:100%;margin-top:10px" size="12">${STAGES.map(s => `<optgroup label="${s.num}. ${esc(s.title)}">${LESSONS.filter(l => l.stage === s.id).map(l => `<option value="${l.id}" ${m.pinned.includes(l) ? 'style="font-weight:800"' : ''}>${m.pinned.includes(l) ? '✓ ' : ''}${esc(l.title)}</option>`).join('')}</optgroup>`).join('')}</select>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="aAdd">Pin to lesson</button><button class="btn" id="aRem">Remove from lesson</button><span class="spacer"></span><button class="btn ghost" data-close>Close</button></div>`, (mm, close) => {
      const sel = $('#aSel', mm);
      if (m.suggested[0]) sel.value = m.suggested[0].id;
      $('#aAdd', mm).onclick = () => { if (sel.value) { library.pin(it, sel.value); app.toast('Pinned'); close(); } };
      $('#aRem', mm).onclick = () => { if (sel.value) { library.unpin(it, sel.value); app.toast('Removed'); close(); } };
    });
  };
  const short = t => t.length > 26 ? t.slice(0, 24) + '…' : t;
  draw();
  const h = () => draw();
  library.listeners.push(h);
  onView(() => { library.listeners = library.listeners.filter(f => f !== h); });
}
