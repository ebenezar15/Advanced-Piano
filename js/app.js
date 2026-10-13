// Keystone — app shell, routing, dock, home and lesson views.

import { PianoEngine, VELOCITY_CURVES } from './audio.js';
import { MidiHub } from './midi.js';
import { Keyboard } from './keyboard.js';
import { PianoRoll } from './roll.js';
import { Piano } from './piano.js';
import { Library } from './library.js';
import { STAGES, LESSONS, lessonById, lessonsInStage } from './lessons.js';
import { chordLabel, pretty, midiName, parseChord, chordPcs, degreeLabel, matchesChord, pcOf, writeMidiFile, parseMidiFile } from './music.js';
import { renderTool, TOOLS } from './tools.js';

// ------------------------------------------------------------------ storage
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};

const DEFAULT_SETTINGS = {
  theme: null, accent: null, volume: 0.9, reverb: 0.22, curve: 'linear', names: false, rollSpeed: 0.11,
  dock: 'md', midiIn: 'all', midiOut: 'none', audioOut: 'default', octave: 4, keyVel: 0.72,
};
const state = {
  settings: { ...DEFAULT_SETTINGS, ...LS.get('ks.settings', {}) },
  progress: { done: {}, ex: {}, last: null, ...LS.get('ks.progress', {}) },
};
const saveSettings = () => LS.set('ks.settings', state.settings);
const saveProgress = () => LS.set('ks.progress', state.progress);

// ------------------------------------------------------------------ core objects
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const engine = new PianoEngine();
const midi = new MidiHub();
const kb = new Keyboard($('#keyboard'), {
  down: (m, v) => piano.noteOn(m, v, 'mouse'),
  up: m => piano.noteOff(m, 'mouse'),
});
const roll = new PianoRoll($('#roll'));
const piano = new Piano({ engine, keyboard: kb, roll, midi });
const library = new Library();

let viewCleanup = [];
const onView = fn => viewCleanup.push(fn);

export const app = {
  engine, midi, kb, roll, piano, library, state, saveProgress, saveSettings, toast, navigate, esc,
  exampleCard, showOnKeys, clearMarks, onView, LESSONS, STAGES, lessonById, openMedia, mediaRow, LS,
};

// ------------------------------------------------------------------ helpers
function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

function navigate(hash) { location.hash = hash; }

const ICON = {
  play: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>',
  loop: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 12a6 6 0 0 1 6-6h8m0 0-3-3m3 3-3 3M20 12a6 6 0 0 1-6 6H6m0 0 3 3m-3-3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rec: '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="7" fill="currentColor"/></svg>',
  keys: '<svg viewBox="0 0 24 24" width="15" height="15"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 5v8M12 5v14M16 5v8" stroke="currentColor" stroke-width="2"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
app.ICON = ICON;

// ------------------------------------------------------------------ themes
const THEMES = [
  { id: 'midnight', name: 'Midnight Jazz', bg: '#0a0e19', text: '#edf0f8', dots: ['#f4b860', '#7cc4ff', '#141c33'] },
  { id: 'sanctuary', name: 'Sanctuary', bg: '#120a1d', text: '#f6efff', dots: ['#f2c14e', '#c77dff', '#261340'] },
  { id: 'bossa', name: 'Bossa Sunset', bg: '#1a110d', text: '#fff1e8', dots: ['#ff8a5b', '#3cc6b4', '#2d1b12'] },
  { id: 'neon', name: 'Neon Studio', bg: '#050508', text: '#f2f6ff', dots: ['#00f5d4', '#f15bb5', '#0e0e1a'] },
  { id: 'forest', name: 'Forest Blues', bg: '#0a130f', text: '#ecf6ef', dots: ['#9ae66e', '#5fa8d3', '#12231b'] },
  { id: 'ivory', name: 'Ivory Concert', bg: '#f5efe4', text: '#2a221d', dots: ['#8c2f39', '#2f6f8c', '#ebe1cf'] },
  { id: 'daylight', name: 'Daylight', bg: '#f2f5fb', text: '#1a2233', dots: ['#3a5bd9', '#e0731f', '#e3e9f5'] },
];

function applyTheme() {
  const s = state.settings;
  const theme = s.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'ivory' : 'midnight');
  document.documentElement.dataset.theme = theme;
  if (s.accent) document.documentElement.style.setProperty('--accent', s.accent);
  else document.documentElement.style.removeProperty('--accent');
  roll.readColors();
}

function openThemes() {
  const cur = document.documentElement.dataset.theme;
  modal(`<h2>Colour scheme</h2><p class="muted">Pick a mood. Your choice is remembered.</p>
    <div class="theme-grid">${THEMES.map(t => `<button class="swatch ${t.id === cur ? 'on' : ''}" data-t="${t.id}" style="--sw-bg:${t.bg};--sw-text:${t.text}">
      <div class="dots">${t.dots.map(d => `<i style="background:${d}"></i>`).join('')}</div><b>${t.name}</b></button>`).join('')}</div>
    <div class="row" style="margin-top:18px"><label class="inline">Custom accent <input type="color" id="accentPick" value="${state.settings.accent || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f4b860'}"></label>
    <button class="btn sm ghost" id="accentReset">Reset accent</button><span class="spacer"></span><button class="btn sm" data-close>Done</button></div>`, m => {
    $$('.swatch', m).forEach(b => b.onclick = () => {
      state.settings.theme = b.dataset.t; state.settings.accent = null; saveSettings(); applyTheme();
      $$('.swatch', m).forEach(x => x.classList.toggle('on', x === b));
    });
    $('#accentPick', m).oninput = e => { state.settings.accent = e.target.value; saveSettings(); applyTheme(); };
    $('#accentReset', m).onclick = () => { state.settings.accent = null; saveSettings(); applyTheme(); };
  });
}

// ------------------------------------------------------------------ modal
function modal(html, bind, wide = false) {
  const root = $('#modalRoot');
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  back.addEventListener('mousedown', e => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  root.appendChild(back);
  $$('[data-close]', back).forEach(b => b.onclick = close);
  bind && bind(back.firstElementChild, close);
  return close;
}
app.modal = modal;

// ------------------------------------------------------------------ settings
async function openSettings() {
  let outputs = [];
  try {
    const devs = await navigator.mediaDevices?.enumerateDevices?.() || [];
    outputs = devs.filter(d => d.kind === 'audiooutput');
  } catch { }
  const s = state.settings;
  const canSink = typeof (window.AudioContext?.prototype || {}).setSinkId === 'function';
  modal(`<h2>Settings</h2><p class="muted">MIDI keyboard, audio interface and piano sound.</p>
  <div class="form-grid">
    <label>MIDI connection</label>
    <div class="row">${midi.access ? `<span class="tag acc">${midi.inputs.length} input(s) found</span>` : `<button class="btn sm primary" id="midiConnect">Connect MIDI devices</button>`}
      ${midi.error ? `<span class="muted" style="font-size:13px">${esc(midi.error)}</span>` : ''}</div>
    <label for="sIn">MIDI input</label>
    <select id="sIn"><option value="all">All inputs</option>${midi.inputs.map(i => `<option value="${esc(i.id)}" ${s.midiIn === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select>
    <label for="sOut">MIDI output (send lessons to a synth/DAW)</label>
    <select id="sOut"><option value="none">None</option>${midi.outputs.map(o => `<option value="${esc(o.id)}" ${s.midiOut === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>
    <label for="sAudio">Audio output (interface)</label>
    <div class="row"><select id="sAudio" ${canSink ? '' : 'disabled'}><option value="default">System default</option>${outputs.map(o => `<option value="${esc(o.deviceId)}" ${s.audioOut === o.deviceId ? 'selected' : ''}>${esc(o.label || 'Output ' + o.deviceId.slice(0, 6))}</option>`).join('')}</select>
      ${canSink ? (outputs.some(o => o.label) ? '' : '<button class="btn xs" id="audioLabels">Show device names</button>') : '<span class="muted" style="font-size:12px">Choose the interface in your system sound settings (this browser can’t route audio).</span>'}</div>
    <label for="sVol">Volume</label><input type="range" id="sVol" min="0" max="1.2" step="0.01" value="${s.volume}">
    <label for="sRev">Room / reverb</label><input type="range" id="sRev" min="0" max="0.8" step="0.01" value="${s.reverb}">
    <label for="sCurve">Velocity response</label>
    <select id="sCurve">${Object.keys(VELOCITY_CURVES).map(k => `<option value="${k}" ${s.curve === k ? 'selected' : ''}>${{ soft: 'Soft (light touch is louder)', linear: 'Linear', hard: 'Hard (needs a firm touch)' }[k]}</option>`).join('')}</select>
    <label for="sSpeed">Piano-roll speed</label><input type="range" id="sSpeed" min="0.04" max="0.25" step="0.01" value="${s.rollSpeed}">
    <label>Note names on keys</label><label class="inline"><input type="checkbox" id="sNames" ${s.names ? 'checked' : ''}> Show all note names</label>
    <label>Progress</label><div><button class="btn sm" id="resetProg">Reset lesson progress</button></div>
  </div>
  <p class="muted" style="font-size:13px;margin-top:18px">Tip: MIDI over USB or through your audio interface’s MIDI port both work. Sustain pedal (CC64) and velocity are read automatically. Use Chrome or Edge for MIDI and audio-device selection.</p>
  <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary" data-close>Done</button></div>`, (m, close) => {
    const mc = $('#midiConnect', m);
    if (mc) mc.onclick = async () => { await midi.connect(); close(); openSettings(); };
    $('#sIn', m).onchange = e => { s.midiIn = e.target.value; midi.setInput(s.midiIn); saveSettings(); };
    $('#sOut', m).onchange = e => { s.midiOut = e.target.value; midi.setOutput(s.midiOut); saveSettings(); };
    $('#sAudio', m).onchange = async e => {
      s.audioOut = e.target.value; saveSettings();
      await engine.init();
      try { await engine.setOutput(s.audioOut); toast('Audio output changed'); } catch (err) { toast('Could not switch output: ' + err.message); }
    };
    const al = $('#audioLabels', m);
    if (al) al.onclick = async () => {
      try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => t.stop()); } catch { }
      close(); openSettings();
    };
    $('#sVol', m).oninput = e => { s.volume = +e.target.value; engine.setVolume(s.volume); saveSettings(); };
    $('#sRev', m).oninput = e => { s.reverb = +e.target.value; engine.setReverb(s.reverb); saveSettings(); };
    $('#sCurve', m).onchange = e => { s.curve = e.target.value; engine.curve = VELOCITY_CURVES[s.curve]; saveSettings(); };
    $('#sSpeed', m).oninput = e => { s.rollSpeed = +e.target.value; roll.speed = s.rollSpeed; saveSettings(); };
    $('#sNames', m).onchange = e => { s.names = e.target.checked; kb.setNames(s.names); saveSettings(); renderDock(); };
    $('#resetProg', m).onclick = () => { if (confirm('Reset all lesson progress?')) { state.progress = { done: {}, ex: {}, last: null }; saveProgress(); renderSidebar(); route(); } };
  });
}

// ------------------------------------------------------------------ status chips
function updateMidiChip() {
  const chip = $('#midiChip');
  const n = midi.inputs.length;
  chip.classList.toggle('on', n > 0);
  $('.lbl', chip).textContent = midi.access ? (n ? (n === 1 ? midi.inputs[0].name : n + ' MIDI inputs') : 'No MIDI device') : 'Connect MIDI';
}
midi.on('devices', updateMidiChip);
engine.onProgress = p => {
  const chip = $('#audioChip');
  $('.bar i', chip).style.width = Math.round(p * 100) + '%';
  $('.lbl', chip).textContent = p >= 1 ? 'Grand piano' : 'Loading piano ' + Math.round(p * 100) + '%';
  chip.classList.toggle('ready', p >= 1);
};

// ------------------------------------------------------------------ dock
let dynCanvas;
function renderDock() {
  const s = state.settings;
  const take = piano.take;
  $('#dockBar').innerHTML = `
    <button class="btn sm" id="dStop" title="Stop all (Esc)">${ICON.stop}<span>Stop</span></button>
    <button class="btn sm rec ${piano.rec ? 'on' : ''}" id="dRec" title="Record what you play (R)">${ICON.rec}<span>${piano.rec ? 'Recording…' : 'Record'}</span></button>
    <button class="btn sm" id="dTake" ${take ? '' : 'disabled'} title="Play back your take">${ICON.play}<span>Take</span></button>
    <button class="btn sm ghost" id="dExport" ${take ? '' : 'disabled'} title="Download your take as a MIDI file">${ICON.down}<span>.mid</span></button>
    <span class="sep"></span>
    <div class="readout" title="Chord detector"><b id="dChord">–</b><small id="dNotes">play a chord</small></div>
    <span class="sep"></span>
    <div class="dyn" title="Dynamics (velocity)"><span class="lvl" id="dLvl">–</span><div class="meter"><i id="dMeter"></i></div><canvas id="dSpark" width="140" height="48"></canvas></div>
    <span class="pedal ${piano.pedalDown ? 'on' : ''}" id="dPedal" title="Sustain pedal (hold Space)"><i></i>Sustain</span>
    <span class="sep"></span>
    <span class="mini" title="Computer keyboard: Z/X change octave, C/V change velocity">${ICON.keys} Oct <b id="dOct">${s.octave}</b> · Vel <b id="dVel">${Math.round(s.keyVel * 127)}</b></span>
    <label class="mini"><input type="checkbox" id="dNames" ${s.names ? 'checked' : ''}> Names</label>
    <span class="spacer"></span>
    <button class="btn xs ghost" id="dSize" title="Resize piano">${{ sm: '▢ Small', md: '▣ Medium', lg: '■ Large' }[s.dock]}</button>`;
  dynCanvas = $('#dSpark');
  $('#dStop').onclick = () => piano.panic();
  $('#dRec').onclick = toggleRec;
  $('#dTake').onclick = () => piano.take && piano.playExample(piano.take, { id: 'take' });
  $('#dExport').onclick = exportTake;
  $('#dPedal').onmousedown = () => piano.setPedal(!piano.pedalDown);
  $('#dNames').onchange = e => { s.names = e.target.checked; kb.setNames(s.names); saveSettings(); };
  $('#dSize').onclick = () => { s.dock = { sm: 'md', md: 'lg', lg: 'sm' }[s.dock]; saveSettings(); applyDock(); renderDock(); };
}
function applyDock() {
  const a = $('#app');
  a.classList.toggle('dock-min', state.settings.dock === 'sm');
  a.classList.toggle('dock-lg', state.settings.dock === 'lg');
  setTimeout(() => roll.resize(), 50);
}
function toggleRec() {
  if (piano.rec) {
    const t = piano.stopRecording();
    toast(t ? `Recorded ${t.events.length} notes. Press “Take” to hear it.` : 'Nothing recorded');
  } else { piano.startRecording(); toast('Recording: play something!'); }
  renderDock();
  document.dispatchEvent(new CustomEvent('ks:rec'));
}
function exportTake() {
  if (!piano.take) return;
  const bytes = writeMidiFile(piano.take.events, piano.take.pedal, 60);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  a.download = 'keystone-take.mid';
  a.click();
}
app.toggleRec = toggleRec;
app.exportTake = exportTake;

const DYN = [[0.2, 'pp'], [0.35, 'p'], [0.5, 'mp'], [0.65, 'mf'], [0.82, 'f'], [1.1, 'ff']];
piano.on('vel', v => {
  const m = $('#dMeter'); if (!m) return;
  m.style.width = Math.round(v * 100) + '%';
  $('#dLvl').textContent = DYN.find(([x]) => v < x)[1];
  const c = dynCanvas; if (!c) return;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  const hist = piano.velHistory, w = c.width / 48;
  g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  hist.forEach((h, i) => { const hh = Math.max(2, h * c.height); g.globalAlpha = 0.35 + 0.65 * (i / hist.length); g.fillRect(c.width - (hist.length - i) * w, c.height - hh, w - 1, hh); });
  g.globalAlpha = 1;
  $('#rollHint')?.classList.add('hide');
});
piano.on('exchord', sym => {
  const el = $('#dChord'); if (!el) return;
  el.textContent = chordLabel(sym);
  $('#dNotes').textContent = 'lesson example';
});
piano.on('play', (id, on) => { if (on) $('#rollHint')?.classList.add('hide'); });
piano.on('pedal', (down, src) => { $('#dPedal')?.classList.toggle('on', down || (src === 'example' && down)); });
piano.on('chord', (c, notes) => {
  const el = $('#dChord'); if (!el) return;
  el.textContent = c ? chordLabel(c.sym) : (notes.length === 1 ? pretty(midiName(notes[0]).replace(/\d+$/, '')) : '–');
  $('#dNotes').textContent = notes.length ? notes.map(n => pretty(midiName(n))).join(' ') : 'play a chord';
});

// ------------------------------------------------------------------ computer keyboard
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17 };
const keyDown = new Map();
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const s = state.settings;
  if (k === ' ') { e.preventDefault(); if (!e.repeat) piano.setPedal(true); return; }
  if (e.repeat) return;
  if (k === 'escape') { piano.panic(); return; }
  if (k === 'z' || k === 'x') { s.octave = Math.max(1, Math.min(7, s.octave + (k === 'z' ? -1 : 1))); saveSettings(); $('#dOct').textContent = s.octave; kb.scrollTo((s.octave + 1) * 12); return; }
  if (k === 'c' || k === 'v') { s.keyVel = Math.max(0.1, Math.min(1, s.keyVel + (k === 'c' ? -0.1 : 0.1))); saveSettings(); $('#dVel').textContent = Math.round(s.keyVel * 127); return; }
  if (k === 'r' && e.shiftKey === false && !(k in KEYMAP)) { toggleRec(); return; }
  if (k in KEYMAP) {
    const m = (s.octave + 1) * 12 + KEYMAP[k];
    if (m < 21 || m > 108) return;
    keyDown.set(k, m);
    piano.noteOn(m, s.keyVel, 'keys');
  }
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === ' ') { piano.setPedal(false); return; }
  if (keyDown.has(k)) { piano.noteOff(keyDown.get(k)); keyDown.delete(k); }
});
window.addEventListener('blur', () => { for (const m of keyDown.values()) piano.noteOff(m); keyDown.clear(); });

// ------------------------------------------------------------------ sidebar & search
function stageProgress(stageId) {
  const ls = lessonsInStage(stageId);
  const d = ls.filter(l => state.progress.done[l.id]).length;
  return { done: d, total: ls.length, pct: ls.length ? d / ls.length : 0 };
}
function totalProgress() {
  const d = LESSONS.filter(l => state.progress.done[l.id]).length;
  return { done: d, total: LESSONS.length, pct: d / LESSONS.length };
}

let openStage = null;
function renderSidebar() {
  const r = currentRoute();
  const cur = r.view === 'lesson' ? lessonById(r.arg) : null;
  if (cur && openStage === null) openStage = cur.stage;
  const tool = r.view;
  $('#sidebar').innerHTML = `
    <div class="nav-sec">
      <a class="nav-a ${r.view === 'home' ? 'active' : ''}" href="#/"><span class="ico">⌂</span>Home</a>
      <a class="nav-a ${r.view === 'library' ? 'active' : ''}" href="#/library"><span class="ico">▶</span>Video & Materials<span class="count">${library.items.length || ''}</span></a>
    </div>
    <div class="nav-sec"><div class="nav-h"><span>Learning path</span><span>${totalProgress().done}/${LESSONS.length}</span></div>
      ${STAGES.map(st => {
        const p = stageProgress(st.id);
        const open = openStage === st.id;
        return `<button class="nav-a stage-btn" style="--h:${st.hue}" data-stage="${st.id}" aria-expanded="${open}"><span class="ico">${st.num}</span><span>${st.title}</span><span class="prog"><i style="width:${p.pct * 100}%"></i></span></button>
        <div class="stage-lessons ${open ? 'open' : ''}">${lessonsInStage(st.id).map(l => `<a href="#/lesson/${l.id}" class="${state.progress.done[l.id] ? 'done' : ''} ${cur && cur.id === l.id ? 'active' : ''}"><span class="ck">${state.progress.done[l.id] ? '✓' : ''}</span>${esc(l.title)}</a>`).join('')}</div>`;
      }).join('')}
    </div>
    <div class="nav-sec"><div class="nav-h"><span>Studio tools</span></div>
      ${TOOLS.map(t => `<a class="nav-a ${tool === t.id ? 'active' : ''}" href="#/${t.id}"><span class="ico">${t.icon}</span>${t.title}</a>`).join('')}
    </div>`;
  $$('.stage-btn', $('#sidebar')).forEach(b => b.onclick = () => { openStage = openStage === b.dataset.stage ? '' : b.dataset.stage; renderSidebar(); });
}

function setupSearch() {
  const input = $('#search'), box = $('#searchResults');
  let sel = 0, results = [];
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { box.classList.remove('open'); return; }
    const words = q.split(/\s+/);
    results = [
      ...LESSONS.map(l => ({ l, hay: (l.title + ' ' + l.summary + ' ' + l.keywords.join(' ') + ' ' + STAGES.find(s => s.id === l.stage).title).toLowerCase() }))
        .filter(x => words.every(w => x.hay.includes(w))).slice(0, 8)
        .map(x => ({ href: '#/lesson/' + x.l.id, title: x.l.title, sub: STAGES.find(s => s.id === x.l.stage).title })),
      ...TOOLS.filter(t => (t.title + ' ' + t.desc).toLowerCase().includes(q)).map(t => ({ href: '#/' + t.id, title: t.title, sub: 'Tool' })),
    ];
    let chordHit = null;
    try { const c = parseChord(input.value.trim()); if (!c.poly) chordHit = input.value.trim(); } catch { }
    if (chordHit) results.unshift({ href: '#/chords?c=' + encodeURIComponent(chordHit), title: 'Explore ' + chordLabel(chordHit), sub: 'Chord Explorer' });
    sel = 0;
    box.innerHTML = results.length ? results.map((r, i) => `<a href="${r.href}" class="${i === sel ? 'sel' : ''}">${esc(r.title)}<small>${esc(r.sub)}</small></a>`).join('') : '<div class="muted" style="padding:10px">No matches</div>';
    box.classList.add('open');
  };
  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length; $$('a', box).forEach((a, i) => a.classList.toggle('sel', i === sel)); }
    if (e.key === 'Enter' && results[sel]) { location.hash = results[sel].href; input.blur(); box.classList.remove('open'); input.value = ''; }
    if (e.key === 'Escape') { input.blur(); box.classList.remove('open'); }
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('.search')) box.classList.remove('open'); });
  box.addEventListener('click', () => { box.classList.remove('open'); input.value = ''; });
}

// ------------------------------------------------------------------ keyboard marks
function clearMarks() { kb.setMarks(null); }
function showOnKeys(example) {
  const first = example.chords?.[0];
  const span = first ? first.beats : 1;
  const notes = [...new Set(example.events.filter(e => e.t < span - 0.01).flatMap(e => e.n))];
  const marks = new Map();
  let c = null;
  try { if (first) c = parseChord(first.sym); } catch { }
  for (const n of notes) {
    let label = pretty(midiName(n).replace(/\d+$/, ''));
    let cls = '';
    if (c && !c.poly) {
      const iv = ((n % 12) - c.root + 12) % 12;
      const ext = c.iv.find(i => i % 12 === iv);
      label = ext !== undefined ? degreeLabel(ext, c.fam) : label;
      if (iv === 0) cls = 'root';
    }
    marks.set(n, { label, cls });
  }
  kb.setMarks(marks);
  if (notes.length) kb.scrollTo(Math.round(notes.reduce((a, b) => a + b, 0) / notes.length));
  toast(first ? 'Showing ' + chordLabel(first.sym) + ' on the keys' : 'Showing the first notes on the keys');
}

// ------------------------------------------------------------------ example card
let exSeq = 0;
function exampleCard(example, opts = {}) {
  const id = 'ex' + (++exSeq);
  const el = document.createElement('div');
  el.className = 'card ex-card ' + (opts.alt ? 'alt-card' : '');
  const chords = example.chords || [];
  const uniqChips = chords.slice(0, 24);
  const hasSwingFeel = (example.swing || 0) > 0;
  el.innerHTML = `
    ${opts.label ? `<span class="tag acc" style="align-self:flex-start">${esc(opts.label)}</span>` : ''}
    <h4>${esc(example.title)}</h4>
    ${opts.why ? `<p class="why">${esc(opts.why)}</p>` : ''}
    ${example.desc ? `<p class="desc">${esc(example.desc)}</p>` : ''}
    ${uniqChips.length ? `<div class="chords">${uniqChips.map((c, i) => `<span class="chord-chip" data-i="${i}" title="Hear this chord">${esc(chordLabel(c.sym))}</span>`).join('')}${chords.length > 24 ? '<span class="chord-chip">…</span>' : ''}</div>` : ''}
    <div class="ex-controls">
      <button class="btn sm primary" data-act="play">${ICON.play}<span>Play</span></button>
      <button class="btn sm" data-act="loop" title="Loop">${ICON.loop}</button>
      <button class="btn sm ghost" data-act="show" title="Show the first chord on the keyboard">${ICON.keys}</button>
      <span class="knob" title="Tempo">♩ <input type="range" min="${Math.round(example.bpm * 0.4)}" max="${Math.round(example.bpm * 1.6)}" value="${example.bpm}" data-k="bpm"><b data-v="bpm">${example.bpm}</b></span>
      <span class="knob" title="Swing feel">Swing <input type="range" min="0" max="1" step="0.1" value="${example.swing || 0}" data-k="swing"></span>
      <select data-k="key" title="Transpose to another key">${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(t => `<option value="${t}" ${t === 0 ? 'selected' : ''}>${t === 0 ? 'Original key' : (t > 0 ? '+' : '') + t + ' st'}</option>`).join('')}</select>
    </div>`;
  const ctl = { bpm: example.bpm, swing: example.swing || 0, key: 0, loop: false };
  const play = (loop) => {
    if (piano.playingId === id) { piano.stopExample(); return; }
    ctl.loop = loop;
    piano.playExample(example, {
      id, bpm: ctl.bpm, swing: ctl.swing, transpose: ctl.key, loop,
      onChord: sym => { $$('.chord-chip', el).forEach((c, i) => c.classList.toggle('now', chords[i] && (chords[i].sym === sym || false) && i === nextChordIndex(sym))); },
    });
  };
  let chordCursor = -1;
  const nextChordIndex = sym => {
    for (let k = 1; k <= chords.length; k++) { const i = (chordCursor + k) % chords.length; if (chords[i].sym === sym) { chordCursor = i; return i; } }
    return -1;
  };
  $('[data-act=play]', el).onclick = () => { chordCursor = -1; play(false); };
  $('[data-act=loop]', el).onclick = () => { chordCursor = -1; play(true); };
  $('[data-act=show]', el).onclick = () => showOnKeys(example);
  $$('input[data-k], select[data-k]', el).forEach(inp => inp.oninput = () => {
    ctl[inp.dataset.k] = +inp.value;
    if (inp.dataset.k === 'bpm') $('[data-v=bpm]', el).textContent = inp.value;
  });
  $$('.chord-chip[data-i]', el).forEach(ch => ch.onclick = () => {
    const c = chords[+ch.dataset.i];
    const evs = example.events.filter(e => e.t >= c.t - 0.01 && e.t < c.t + Math.min(c.beats, 4) - 0.01 && e.t < c.t + 0.6).map(e => ({ ...e, t: 0, d: 1.8, n: e.n.map(n => n + ctl.key) }));
    piano.playExample({ events: evs, bpm: 60, pedal: [], chords: [{ sym: c.sym, t: 0, beats: 2 }] });
    showOnKeys({ events: evs, chords: [{ sym: c.sym, t: 0, beats: 2 }] });
  });
  const off = piano.on('play', (pid, on) => {
    if (pid !== id) return;
    el.classList.toggle('playing', on);
    const pb = $('[data-act=play]', el);
    pb.innerHTML = on && !ctl.loop ? ICON.stop + '<span>Stop</span>' : ICON.play + '<span>Play</span>';
    $('[data-act=loop]', el).classList.toggle('on', on && ctl.loop);
    if (!on) $$('.chord-chip', el).forEach(c => c.classList.remove('now'));
  });
  onView(off);
  return el;
}

// ------------------------------------------------------------------ media
function mediaIcon(t) { return { video: 'VID', audio: 'AUD', pdf: 'PDF', image: 'IMG', midi: 'MIDI', text: 'TXT' }[t] || 'FILE'; }
function mediaRow(item, extra = '') {
  return `<div class="media-row" data-path="${esc(item.path)}"><span class="mi ${item.type}">${mediaIcon(item.type)}</span>
    <span class="mt"><b>${esc(library.title(item))}</b><small>${esc(library.folderLabel(item) || 'Library')}</small></span>${extra}
    <button class="btn xs primary" data-open>${item.type === 'midi' ? 'Play' : 'Open'}</button></div>`;
}

async function openMedia(item, container) {
  container.innerHTML = '<div class="viewer"><div class="vbar"><span class="lbl">Loading…</span></div></div>';
  const v = container.firstElementChild;
  try {
    if (item.type === 'midi') {
      const f = await library.getFile(item);
      const parsed = parseMidiFile(await f.arrayBuffer());
      const ex = { title: library.title(item), events: parsed.events, pedal: parsed.pedal, bpm: 60, chords: [] };
      v.innerHTML = '';
      v.style.background = 'none'; v.style.border = '0';
      v.appendChild(exampleCard(ex, { label: 'MIDI file' }));
      return;
    }
    const url = await library.getURL(item);
    if (item.type === 'video') {
      v.innerHTML = `<video src="${url}" controls playsinline preload="metadata"></video>
        <div class="vbar"><span class="lbl">Speed</span>${[0.5, 0.75, 1, 1.25].map(r => `<button class="btn xs ${r === 1 ? 'on' : ''}" data-rate="${r}">${r}×</button>`).join('')}
        <span class="lbl">Loop</span><button class="btn xs" data-ab="a">Set A</button><button class="btn xs" data-ab="b">Set B</button><button class="btn xs" data-ab="x">Clear</button>
        <span class="lbl" data-abl></span><span class="spacer"></span><button class="btn xs" data-pip>Pop out</button></div>`;
      const vid = $('video', v);
      let A = null, B = null;
      $$('[data-rate]', v).forEach(b => b.onclick = () => { vid.playbackRate = +b.dataset.rate; vid.preservesPitch = true; $$('[data-rate]', v).forEach(x => x.classList.toggle('on', x === b)); });
      const lbl = () => $('[data-abl]', v).textContent = A !== null ? `${fmt(A)} → ${B !== null ? fmt(B) : '…'}` : '';
      $$('[data-ab]', v).forEach(b => b.onclick = () => {
        if (b.dataset.ab === 'a') A = vid.currentTime; else if (b.dataset.ab === 'b') B = vid.currentTime; else A = B = null;
        if (A !== null && B !== null && B < A) [A, B] = [B, A];
        lbl();
      });
      vid.addEventListener('timeupdate', () => { if (A !== null && B !== null && vid.currentTime >= B) vid.currentTime = A; });
      $('[data-pip]', v).onclick = () => vid.requestPictureInPicture?.().catch(() => toast('Picture-in-picture not available'));
      vid.addEventListener('error', () => { $('.vbar', v).insertAdjacentHTML('afterbegin', '<span class="lbl" style="color:var(--bad)">This browser can’t play this video format. Try Safari or Chrome, or convert it to MP4 (H.264).</span>'); });
    } else if (item.type === 'audio') {
      v.innerHTML = `<div class="vbar"><audio src="${url}" controls style="width:100%"></audio></div>`;
    } else if (item.type === 'pdf') {
      v.innerHTML = `<iframe src="${url}#view=FitH" title="${esc(library.title(item))}"></iframe>`;
    } else if (item.type === 'image') {
      v.innerHTML = `<img src="${url}" alt="${esc(library.title(item))}">`;
    } else if (item.type === 'text') {
      const f = await library.getFile(item);
      v.innerHTML = `<pre></pre>`;
      $('pre', v).textContent = (await f.text()).slice(0, 200000);
    }
  } catch (e) {
    v.innerHTML = `<div class="vbar"><span class="lbl" style="color:var(--bad)">Couldn’t open this file (${esc(e.message)}). Reconnect the folder in Video & Materials.</span></div>`;
  }
}
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

// ------------------------------------------------------------------ views
function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query] = h.split('?');
  const [view, arg] = path.split('/');
  return { view: view || 'home', arg, query: new URLSearchParams(query || '') };
}

function route() {
  viewCleanup.forEach(f => { try { f(); } catch { } });
  viewCleanup = [];
  piano.stopExample();
  clearMarks();
  const r = currentRoute();
  const main = $('#main');
  main.innerHTML = '';
  main.scrollTop = 0;
  $('#app').classList.remove('nav-open');
  if (r.view === 'lesson' && lessonById(r.arg)) renderLesson(main, lessonById(r.arg));
  else if (r.view === 'home') renderHome(main);
  else if (renderTool(r.view, main, app, r)) { /* tool rendered */ }
  else renderHome(main);
  renderSidebar();
  main.focus({ preventScroll: true });
}

function nextLesson() {
  return LESSONS.find(l => !state.progress.done[l.id]) || LESSONS[0];
}

function renderHome(main) {
  const tp = totalProgress();
  const nl = state.progress.last && !state.progress.done[state.progress.last] ? lessonById(state.progress.last) : nextLesson();
  const ns = STAGES.find(s => s.id === nl.stage);
  main.innerHTML = `<div class="wrap">
    <section class="hero">
      <div class="hero-keys" aria-hidden="true">${'<span></span>'.repeat(12)}</div>
      <div class="eyebrow">Theory · Jazz · Black Gospel · Classical</div>
      <h1>Hear it. <em>Understand&nbsp;it.</em> Play&nbsp;it.</h1>
      <p>A step-by-step path from your first intervals to reharmonization, upper structures, gospel runs and polyrhythms. Every lesson plays on the 88-key roll with a real grand piano, and listens to your MIDI keyboard.</p>
      <div class="row">
        <a class="btn primary" href="#/lesson/${nl.id}">${ICON.play}${tp.done ? 'Continue' : 'Start'}: ${esc(nl.title)}</a>
        <a class="btn" href="#/practice">Practice room</a>
        ${midi.access ? '' : '<button class="btn ghost" id="hMidi">Connect MIDI keyboard</button>'}
      </div>
    </section>

    <div class="sec">
      <div class="sec-h"><h2>Your learning path</h2><span class="muted">${tp.done} of ${tp.total} lessons complete · ${STAGES.length} stages, in order</span></div>
      <div class="path">${STAGES.map(st => {
        const p = stageProgress(st.id);
        const first = lessonsInStage(st.id).find(l => !state.progress.done[l.id]) || lessonsInStage(st.id)[0];
        return `<a class="stage-card" style="--h:${st.hue}" href="#/lesson/${first.id}">
          <span class="num">${st.num}</span><h3>${st.title}</h3><p>${st.sub}</p>
          <div class="meta"><span>${p.total} lessons</span><span>${p.done ? Math.round(p.pct * 100) + '%' : ''}</span></div>
          <div class="meter"><i style="width:${p.pct * 100}%"></i></div></a>`;
      }).join('')}</div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>Studio tools</h2><span class="muted">Explore, experiment, drill</span></div>
      <div class="grid g3">${TOOLS.map(t => `<a class="card tool-card" href="#/${t.id}"><span class="ti">${t.icon}</span><span><h3>${t.title}</h3><p>${t.desc}</p></span></a>`).join('')}</div>
    </div>

    <div class="sec">
      <div class="sec-h"><h2>Video & materials</h2></div>
      <div class="card row">
        <div style="flex:1;min-width:240px"><h3>${library.items.length ? `${library.items.length} files connected` : 'Connect your lesson folder'}</h3>
        <p class="muted" style="margin:4px 0 0">${library.items.length ? 'Videos, PDFs and MIDI files are matched to lessons automatically. Open any lesson to see its materials.' : 'Choose the folder with your course videos and files. Everything stays on your computer. Items are attached to matching lessons, and folder names are hidden from titles.'}</p></div>
        <a class="btn ${library.items.length ? '' : 'primary'}" href="#/library">${library.items.length ? 'Browse library' : 'Connect folder'}</a>
      </div>
    </div>
  </div>`;
  const hm = $('#hMidi', main);
  if (hm) hm.onclick = async () => { await midi.connect(); route(); };
}

function renderLesson(main, lesson) {
  state.progress.last = lesson.id; saveProgress();
  const stage = STAGES.find(s => s.id === lesson.stage);
  const idx = LESSONS.indexOf(lesson);
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const sp = stageProgress(stage.id);
  const done = !!state.progress.done[lesson.id];
  main.innerHTML = `<div class="wrap">
    <div class="crumbs"><a href="#/">Home</a> / <a href="#/lesson/${lessonsInStage(stage.id)[0].id}" style="color:hsl(${stage.hue} 70% 65%)">Stage ${stage.num} · ${stage.title}</a></div>
    <div class="lesson-head" style="margin-top:10px">
      <div style="flex:1">
        <h1 class="page-title">${esc(lesson.title)}</h1>
        <p class="lede">${esc(lesson.summary)}</p>
        <div class="meta"><span class="tag">≈ ${lesson.min} min</span><span class="tag">Lesson ${lessonsInStage(stage.id).indexOf(lesson) + 1} of ${sp.total}</span>${done ? '<span class="tag acc">✓ Completed</span>' : ''}</div>
      </div>
      <div class="ring" style="--p:${sp.pct * 100}" title="Stage progress"><b>${Math.round(sp.pct * 100)}%</b></div>
    </div>

    <div class="sec card prose" id="concept">${lesson.body}</div>

    <div class="sec"><div class="sec-h"><h2>Hear it</h2><span class="muted">Play, loop, slow down, transpose. Watch the roll and keys.</span></div>
      <div class="grid g2" id="examples"></div></div>

    ${lesson.alternates?.length ? `<div class="sec"><div class="sec-h"><h2>Alternate suggestions</h2><span class="muted">Same idea, different colours</span></div><div class="grid g2" id="alts"></div></div>` : ''}

    <div class="sec"><div class="sec-h"><h2>Your turn</h2><span class="muted">${lesson.exercise.type === 'free' ? 'Record and listen back' : 'Play on your MIDI keyboard, the on-screen keys or your computer keyboard'}</span></div>
      <div class="card exercise" id="exercise"></div></div>

    <div class="sec"><div class="sec-h"><h2>Creative challenges</h2></div>
      <div class="card"><ul class="creative prose" style="margin:0">${lesson.creative.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div></div>

    <div class="sec" id="mediaSec"></div>

    <div class="row" style="margin-top:28px"><button class="btn ${done ? '' : 'primary'}" id="markDone">${done ? '✓ Completed (undo)' : 'Mark lesson complete'}</button></div>
    <nav class="lesson-nav">
      ${prev ? `<a class="card" href="#/lesson/${prev.id}"><small>← Previous</small><b>${esc(prev.title)}</b></a>` : '<span style="flex:1"></span>'}
      ${next ? `<a class="card next" href="#/lesson/${next.id}"><small>Next →</small><b>${esc(next.title)}</b></a>` : ''}
    </nav>
  </div>`;

  const exWrap = $('#examples', main);
  lesson.examples.forEach(ex => exWrap.appendChild(exampleCard(ex)));
  const alts = $('#alts', main);
  if (alts) lesson.alternates.forEach(a => alts.appendChild(exampleCard(a.ex, { alt: true, label: a.title, why: a.why })));

  renderExercise($('#exercise', main), lesson);
  renderLessonMedia($('#mediaSec', main), lesson);

  $('#markDone', main).onclick = () => {
    state.progress.done[lesson.id] = !state.progress.done[lesson.id];
    saveProgress();
    if (state.progress.done[lesson.id]) toast('Lesson complete. Nice work!');
    route();
  };
}

function renderLessonMedia(sec, lesson) {
  const draw = () => {
    const { pinned, suggested } = library.forLesson(lesson);
    const any = pinned.length || suggested.length;
    sec.innerHTML = `<div class="sec-h"><h2>Video & materials</h2><span class="muted">${library.items.length ? 'From your connected library' : ''}</span></div>
      ${!library.items.length ? `<div class="card row"><p class="muted" style="margin:0;flex:1">Connect your lesson folder to see matching videos, PDFs and MIDI files here.</p>${library.needsPermission ? '<button class="btn primary" id="lmRe">Reconnect folder</button>' : '<a class="btn primary" href="#/library">Connect folder</a>'}</div>` :
        !any ? `<div class="card"><p class="muted" style="margin:0">No files matched this lesson automatically. Open <a href="#/library">Video & Materials</a> and use “Add to lesson” on any file.</p></div>` :
          `<div class="media-list">${pinned.map(it => mediaRow(it, `<button class="btn xs ghost" data-unpin title="Remove from this lesson">✕</button>`)).join('')}
           ${suggested.map(it => mediaRow(it, `<span class="tag">suggested</span><button class="btn xs ghost" data-pin title="Keep in this lesson">Keep</button><button class="btn xs ghost" data-unpin title="Hide from this lesson">✕</button>`)).join('')}</div>
           <div id="lmViewer"></div>`}`;
    const re = $('#lmRe', sec);
    if (re) re.onclick = async () => { await library.reconnect(); };
    $$('.media-row', sec).forEach(row => {
      const it = library.items.find(i => i.path === row.dataset.path);
      $('[data-open]', row).onclick = () => { openMedia(it, $('#lmViewer', sec)); $('#lmViewer', sec).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
      const p = $('[data-pin]', row); if (p) p.onclick = () => library.pin(it, lesson.id);
      const u = $('[data-unpin]', row); if (u) u.onclick = () => library.unpin(it, lesson.id);
    });
  };
  draw();
  const h = () => draw();
  library.listeners.push(h);
  onView(() => { library.listeners = library.listeners.filter(f => f !== h); });
}

// ------------------------------------------------------------------ exercises
function renderExercise(el, lesson) {
  const exr = lesson.exercise;
  if (exr.type === 'free') {
    const draw = () => {
      el.innerHTML = `<h3>${esc(exr.prompt)}</h3>
        <div class="row" style="margin-top:14px">
          <button class="btn ${piano.rec ? 'rec on' : 'primary'}" data-a="rec">${ICON.rec}${piano.rec ? 'Stop recording' : 'Record'}</button>
          <button class="btn" data-a="play" ${piano.take ? '' : 'disabled'}>${ICON.play}Play my take</button>
          <button class="btn ghost" data-a="exp" ${piano.take ? '' : 'disabled'}>${ICON.down}Download .mid</button>
          <span class="spacer"></span>
          <button class="btn ${state.progress.ex[lesson.id] ? 'on' : ''}" data-a="done">${state.progress.ex[lesson.id] ? '✓ Done' : 'I did it'}</button>
        </div>
        <p class="muted" style="font-size:13px;margin:12px 0 0">Recording captures notes, velocity and pedal from MIDI, the screen keys or your computer keyboard.</p>`;
      $('[data-a=rec]', el).onclick = () => toggleRec();
      $('[data-a=play]', el).onclick = () => piano.take && piano.playExample(piano.take, { id: 'take' });
      $('[data-a=exp]', el).onclick = exportTake;
      $('[data-a=done]', el).onclick = () => { state.progress.ex[lesson.id] = true; state.progress.done[lesson.id] = true; saveProgress(); toast('Marked complete'); renderSidebar(); draw(); };
    };
    draw();
    const h = () => draw();
    document.addEventListener('ks:rec', h);
    onView(() => document.removeEventListener('ks:rec', h));
    return;
  }

  const isChords = exr.type === 'chords';
  const targets = isChords ? exr.targets : exr.targets.split(/\s+/);
  let pos = 0, finished = false;
  const label = t => isChords ? chordLabel(t) : pretty(t);
  el.innerHTML = `<h3>${esc(exr.prompt)}</h3>
    <div class="steps">${targets.map((t, i) => `<span class="step ${i === 0 ? 'cur' : ''}">${esc(label(t))}</span>`).join('')}</div>
    <div class="row"><div class="feedback" id="fb">${isChords ? 'Play the highlighted chord, in any voicing.' : 'Play the highlighted note, in any octave.'}</div><span class="spacer"></span>
      <button class="btn sm" data-a="hear">${ICON.play}Hear ${isChords ? 'chord' : 'note'}</button><button class="btn sm ghost" data-a="hint">${ICON.keys}Hint</button><button class="btn sm ghost" data-a="reset">Restart</button></div>`;
  const steps = $$('.step', el), fb = $('#fb', el);
  const setFb = (t, cls) => { fb.textContent = t; fb.className = 'feedback ' + (cls || ''); };
  const update = () => steps.forEach((s, i) => { s.classList.toggle('ok', i < pos); s.classList.toggle('cur', i === pos && !finished); });
  const targetNotes = i => {
    const t = targets[i];
    if (!isChords) return [pcOf(t) + 60];
    const c = parseChord(t);
    if (c.poly) { const a = chordPcs(c.lower).map(p => 48 + p), b = chordPcs(c.upper).map(p => 60 + p); return [...a, ...b]; }
    const base = (c.bass ?? c.root) + 48;
    return [base, ...c.iv.map(iv => 60 + ((c.root + iv) % 12))];
  };
  const succeed = () => {
    finished = true; update();
    setFb('Excellent: exercise complete!', 'good');
    if (!state.progress.ex[lesson.id]) { state.progress.ex[lesson.id] = true; state.progress.done[lesson.id] = true; saveProgress(); renderSidebar(); toast('Exercise complete: lesson marked done ✓'); }
  };
  const advance = () => {
    steps[pos].classList.add('ok');
    pos++;
    if (pos >= targets.length) succeed();
    else { update(); setFb('Yes! Next: ' + label(targets[pos]), 'good'); }
  };
  let lastCheck = 0;
  const offChord = piano.on('chord', () => {
    if (!isChords || finished) return;
    const notes = piano.heldNotes().length >= 2 ? piano.heldNotes() : piano.soundingNotes();
    if (notes.length < 2) return;
    if (matchesChord(notes, targets[pos], !!exr.strictBass)) {
      const now = performance.now();
      if (now - lastCheck < 250) return;
      lastCheck = now;
      advance();
    }
  });
  const offNote = piano.on('note', (m, v, on) => {
    if (isChords || finished || !on) return;
    if (m % 12 === pcOf(targets[pos])) advance();
    else {
      steps[pos].classList.remove('miss'); void steps[pos].offsetWidth; steps[pos].classList.add('miss');
      setFb('Not quite: that was ' + pretty(midiName(m).replace(/\d+$/, '')) + '. Try again.', 'bad');
    }
  });
  onView(offChord); onView(offNote);
  $('[data-a=hear]', el).onclick = () => { if (!finished) piano.strike(targetNotes(pos), { arp: isChords ? 0.04 : 0 }); };
  $('[data-a=hint]', el).onclick = () => {
    if (finished) return;
    const notes = targetNotes(pos);
    kb.setMarks(new Map(notes.map((n, i) => [n, { label: i === 0 && isChords ? '1' : '', cls: i === 0 ? 'root' : '' }])));
    kb.scrollTo(notes[0]);
  };
  $('[data-a=reset]', el).onclick = () => { pos = 0; finished = false; steps.forEach(s => s.classList.remove('ok')); update(); setFb('Restarted.'); clearMarks(); };
}

// ------------------------------------------------------------------ boot
function boot() {
  applyTheme();
  engine.curve = VELOCITY_CURVES[state.settings.curve] || VELOCITY_CURVES.linear;
  roll.speed = state.settings.rollSpeed;
  kb.setNames(state.settings.names);
  applyDock();
  renderDock();
  setupSearch();
  updateMidiChip();
  engine.onProgress(0);
  $('#audioChip .lbl').textContent = 'Click to load piano';

  // Audio needs a user gesture.
  const start = async () => {
    await engine.init();
    engine.setVolume(state.settings.volume);
    engine.setReverb(state.settings.reverb);
    if (state.settings.audioOut !== 'default') engine.setOutput(state.settings.audioOut).catch(() => { });
  };
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, start, { once: true, capture: true }));

  // MIDI: connect immediately if already permitted, otherwise on request.
  midi.inputId = state.settings.midiIn;
  midi.outputId = state.settings.midiOut;
  (async () => {
    try {
      const p = await navigator.permissions?.query({ name: 'midi' });
      if (p && p.state === 'granted') await midi.connect();
    } catch { }
    updateMidiChip();
  })();
  $('#midiChip').onclick = async () => { if (!midi.access) await midi.connect(); openSettings(); };
  $('#settingsBtn').onclick = openSettings;
  $('#themeBtn').onclick = openThemes;
  $('#menuBtn').onclick = () => $('#app').classList.toggle('nav-open');
  $('#scrim').onclick = () => $('#app').classList.remove('nav-open');
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (!state.settings.theme) applyTheme(); });

  library.onChange(() => { renderSidebar(); });
  library.restore();

  window.addEventListener('hashchange', route);
  route();
  setTimeout(() => kb.scrollTo(60), 100);
}

boot();
