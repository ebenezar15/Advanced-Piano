// The structured curriculum: stages -> lessons. Every example is playable on the 88-key roll.

import { line as L, prog as P, walk as W, poly, ex as X, merge, shift, repeat, transposeEvents, parseChord, N, voice } from './music.js';

// ---------------------------------------------------------------- pattern helpers

const CHARLESTON = [[0, 1], [1.5, 0.45, 0.9]];
const OFFBEATS = [[1.5, 0.45], [3.5, 0.45, 0.85]];
const QUARTERS = [[0, 0.9], [1, 0.9, 0.85], [2, 0.9, 0.95], [3, 0.9, 0.85]];

/** Bossa nova: LH root–fifth dotted pattern, RH syncopated rootless chords (two-bar cycle). */
function bossa(list, opts = {}) {
  const ev = [];
  let t = 0, prev = {};
  list.forEach((sym, i) => {
    const c = parseChord(sym);
    const v = voice(c, 'rootless', prev); prev = v;
    let r = 36 + ((c.root - 36) % 12 + 12) % 12;
    if (r > 43) r -= 12;
    const fifth = r + 7;
    ev.push({ t, d: 1.4, n: [r], v: 0.72, hand: 'lh' }, { t: t + 1.5, d: 0.45, n: [fifth], v: 0.55, hand: 'lh' },
      { t: t + 2, d: 1.4, n: [fifth], v: 0.66, hand: 'lh' }, { t: t + 3.5, d: 0.45, n: [r], v: 0.55, hand: 'lh' });
    const hits = i % 2 === 0 ? [[0, 0.45], [1.5, 0.9], [3, 0.45]] : [[0.5, 0.9], [2, 0.45], [3.5, 0.45]];
    hits.forEach(([o, d]) => ev.push({ t: t + o, d, n: v.rh, v: 0.6, hand: 'rh' }));
    t += 4;
  });
  ev.chords = list.map((sym, i) => ({ sym, t: i * 4, beats: 4 }));
  return ev;
}

/** Stride: LH bass on 1 & 3 (root / fifth), chord on 2 & 4. */
function stride(list) {
  const ev = [];
  let t = 0;
  list.forEach(sym => {
    const c = parseChord(sym);
    const v = voice(c, 'close');
    let r = 31 + ((c.root - 31) % 12 + 12) % 12;
    const ch = v.rh.map(n => n - 12);
    ev.push({ t, d: 0.8, n: [r, r + 12], v: 0.78, hand: 'lh' }, { t: t + 1, d: 0.6, n: ch, v: 0.58, hand: 'lh' },
      { t: t + 2, d: 0.8, n: [r - 5, r + 7], v: 0.72, hand: 'lh' }, { t: t + 3, d: 0.6, n: ch, v: 0.58, hand: 'lh' });
    t += 4;
  });
  ev.chords = list.map((sym, i) => ({ sym, t: i * 4, beats: 4 }));
  return ev;
}

/** Shuffle / boogie LH: root–5 / root–6 rocking in swung eighths. */
function shuffleLH(list) {
  const ev = [];
  let t = 0;
  list.forEach(item => {
    const [sym, beats] = Array.isArray(item) ? item : [item, 4];
    const c = parseChord(sym);
    const r = 36 + ((c.root - 36) % 12 + 12) % 12 - (c.root >= 7 ? 12 : 0);
    for (let b = 0; b < beats; b++) {
      const top = b % 2 === 0 ? r + 7 : r + 9;
      ev.push({ t: t + b, d: 0.45, n: [r, top], v: 0.66, hand: 'lh' }, { t: t + b + 0.5, d: 0.45, n: [r, top], v: 0.52, hand: 'lh' });
    }
    t += beats;
  });
  ev.chords = [];
  let tt = 0;
  list.forEach(item => { const [sym, beats] = Array.isArray(item) ? item : [item, 4]; ev.chords.push({ sym, t: tt, beats }); tt += beats; });
  return ev;
}

const ii_V_I = ['Dm7', 'G7', ['Cmaj7', 8]];

// ---------------------------------------------------------------- curriculum

export const STAGES = [
  { id: 'foundations', num: 'I', title: 'Foundations', sub: 'Keyboard, intervals, scales, triads and rhythm', hue: 200 },
  { id: 'harmony', num: 'II', title: 'Harmony Core', sub: 'Diatonic chords, 7ths, extensions, ii–V–I, modes', hue: 262 },
  { id: 'voicings', num: 'III', title: 'Voicings', sub: 'Shells, rootless, drop 2, quartal, upper structures', hue: 320 },
  { id: 'motion', num: 'IV', title: 'Harmonic Motion & Reharmonization', sub: 'Secondary dominants, tritone subs, passing chords, transitions', hue: 15 },
  { id: 'gospel', num: 'V', title: 'Black Gospel', sub: '13ths, walk-ups, runs, fills, shout and hymn reharm', hue: 38 },
  { id: 'genres', num: 'VI', title: 'Jazz & Genres in Practice', sub: 'Comping, walking bass, blues, bossa nova, neo-soul, Latin, stride', hue: 160 },
  { id: 'rhythm', num: 'VII', title: 'Rhythm Mastery', sub: 'Displacement, polyrhythms and hemiola', hue: 100 },
  { id: 'melody', num: 'VIII', title: 'Melody & Improvisation', sub: 'Guide tones, enclosures, sequences, building lines', hue: 230 },
  { id: 'classical', num: 'IX', title: 'Classical Piano', sub: 'Cadences, voice leading, Alberti bass, arpeggios, Romantic harmony, counterpoint', hue: 345 },
];

export const LESSONS = [
  // ============================================================ I. FOUNDATIONS
  {
    id: 'f-keys', stage: 'foundations', title: 'The 88 Keys: Geography & Registers', min: 8,
    keywords: ['intro', 'keyboard', 'basics', 'beginner', 'note names', 'geography'],
    summary: 'Find any note instantly, know the registers and how the sustain pedal changes the sound.',
    body: `
<p>The piano has <b>88 keys</b> from <b>A0</b> to <b>C8</b>: 52 white and 36 black. Black keys come in alternating
groups of <b>two</b> and <b>three</b>. That pattern is your map:</p>
<ul>
<li><b>C</b> sits just left of every group of two black keys. <b>F</b> sits just left of every group of three.</li>
<li><b>Middle C = C4</b>. Numbers rise at every C, so B3 is directly below C4.</li>
<li>Registers: <b>bass</b> (A0–B2) for roots and octaves, <b>middle</b> (C3–B4) for chord voicings, <b>treble</b> (C5 and up) for melody, fills and runs.</li>
</ul>
<p>A practical rule used by jazz and gospel players: keep chord tones other than the root <b>above about E3</b>. Thirds
and sevenths lower than that turn muddy. That “low-interval limit” is why the bass carries roots and octaves.</p>
<p>The <b>sustain (damper) pedal</b> lifts every damper so strings keep ringing after you release the keys. In the roll, pedal-down time glows as a band.
On your computer keyboard, hold <kbd>Space</kbd> for the pedal.</p>`,
    examples: [
      X('Every C on the piano', L('C1:.6 C2 C3 C4 C5 C6 C7 C8:2', { vel: 0.7 }), { bpm: 100, desc: 'Watch the labels: C1 … C8. Middle C is C4.' }),
      X('Lowest to highest', L('A0:1.5 C8:2.5', { vel: 0.75 }), { bpm: 70, desc: 'A0 is the lowest key; C8 the highest.' }),
      X('Same notes, pedal off vs on', merge(L('C4:.5 E4 G4 C5 r:2'), L('C4:.5 E4 G4 C5', { start: 4 })), { bpm: 90, pedal: [[4, 7.9]], desc: 'Second time the pedal is down: the notes blend into a chord.' }),
    ],
    exercise: { type: 'notes', prompt: 'Play the white keys from any C up to the next C.', targets: 'C D E F G A B C' },
    creative: ['With eyes closed, find every F♯ by feeling the group of three black keys.', 'Play one note in each register and describe its colour: dark, warm, bright, glassy.'],
  },
  {
    id: 'f-intervals', stage: 'foundations', title: 'Intervals: the DNA of Harmony', min: 12,
    keywords: ['intervals', 'half step', 'whole step', 'ear training', 'basics'],
    summary: 'Half steps, whole steps and the twelve intervals that build every chord and scale.',
    body: `
<p>An <b>interval</b> is the distance between two notes, counted in half steps (semitones):</p>
<table class="tbl"><tr><th>Half steps</th><th>Interval</th><th>Sound / use</th></tr>
<tr><td>1</td><td>minor 2nd (♭2 / ♭9)</td><td>tension, “crunch”, chromatic approach</td></tr>
<tr><td>2</td><td>major 2nd (9th)</td><td>step-wise motion, colour tone</td></tr>
<tr><td>3</td><td>minor 3rd</td><td>minor quality</td></tr>
<tr><td>4</td><td>major 3rd</td><td>major quality</td></tr>
<tr><td>5</td><td>perfect 4th (11th)</td><td>open, quartal voicings, sus chords</td></tr>
<tr><td>6</td><td>tritone (♯4/♭5)</td><td>the engine of the dominant chord</td></tr>
<tr><td>7</td><td>perfect 5th</td><td>stable, power-chord, bass motion</td></tr>
<tr><td>8</td><td>minor 6th (♭13)</td><td>bittersweet, altered dominants</td></tr>
<tr><td>9</td><td>major 6th (13th)</td><td>sweet, gospel 6ths runs</td></tr>
<tr><td>10</td><td>minor 7th</td><td>dominant & minor 7th chords</td></tr>
<tr><td>11</td><td>major 7th</td><td>dreamy maj7 sound</td></tr>
<tr><td>12</td><td>octave</td><td>bass power, gospel octaves</td></tr></table>
<p><b>Melodic</b> intervals are played one after the other; <b>harmonic</b> intervals are played together. Practice both: the ear learns
an interval’s “colour” much faster when it is sounded together.</p>`,
    examples: [
      X('All intervals up from C (melodic → harmonic)', merge(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s, i) =>
        merge([{ t: i * 2, d: 0.5, n: [60], v: 0.65 }, { t: i * 2 + 0.5, d: 0.5, n: [60 + s], v: 0.65 }, { t: i * 2 + 1, d: 0.9, n: [60, 60 + s], v: 0.7 }]))), { bpm: 110 }),
      X('Tritone tension → resolution', L('[F4,B4]:2 [E4,C5]:2 [B3,F4]:2 [C4,E4]:2'), { bpm: 70, desc: 'The tritone inside G7 (B–F) squeezes inward or outward to C–E.' }),
      X('Fourths vs fifths', L('[C4,F4]:1 [D4,G4] [E4,A4] [F4,Bb4] r:1 [C4,G4]:1 [D4,A4] [E4,B4] [F4,C5]'), { bpm: 90 }),
    ],
    exercise: { type: 'notes', prompt: 'From C4 play: a major 3rd (E), a perfect 5th (G), a major 7th (B), then the octave (C).', targets: 'C E G B C' },
    creative: ['Improvise a short melody using only 4ths and 5ths. Notice how “open” it sounds.', 'Play a tritone and resolve it three different ways.'],
  },
  {
    id: 'f-major', stage: 'foundations', title: 'The Major Scale & Keys', min: 12,
    keywords: ['major scale', 'keys', 'circle of fifths', 'fingering', 'scales'],
    summary: 'W–W–H–W–W–W–H: the pattern behind every key, with fingering and the circle of fifths.',
    body: `
<p>The major scale follows <b>whole–whole–half–whole–whole–whole–half</b>. Start that pattern on any key and you get that key’s scale.</p>
<p><b>Fingering (C, G, D, A, E):</b> right hand 1-2-3 | 1-2-3-4-5 (thumb under after 3); left hand 5-4-3-2-1 | 3-2-1 (3 over after thumb).</p>
<p><b>Circle of fifths:</b> each step up a 5th adds one sharp (C → G → D → A → E → B → F♯). Each step up a 4th adds one flat
(C → F → B♭ → E♭ → A♭ → D♭). Jazz and gospel progressions move <b>counter-clockwise</b> (by 4ths): that’s why ii–V–I and
“circle” progressions sound so strong.</p>
<p><b>Context:</b> the scale degrees later become chord numbers (I, ii, iii…), extensions (9 = 2, 11 = 4, 13 = 6) and melodic targets.</p>`,
    examples: [
      X('C major, up and down (hands together)', merge(L('C4:.5 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4:2'), L('C3:.5 D3 E3 F3 G3 A3 B3 C4 B3 A3 G3 F3 E3 D3 C3:2', { hand: 'lh', vel: 0.6 })), { bpm: 100 }),
      X('G major (one sharp: F♯)', L('G3:.5 A3 B3 C4 D4 E4 F#4 G4 F#4 E4 D4 C4 B3 A3 G3:2'), { bpm: 100 }),
      X('Roots around the circle of 4ths', P(['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G', 'C'].map(s => [s, 1]), { style: 'root' }), { bpm: 84, desc: 'Each chord falls a 5th (rises a 4th): the strongest root motion in music.' }),
    ],
    exercise: { type: 'notes', prompt: 'Play the G major scale ascending (remember F♯).', targets: 'G A B C D E F# G' },
    creative: ['Pick a key you never play. Improvise using only its scale for 2 minutes.', 'Play the scale in 3rds: C–E, D–F, E–G … you are already harmonising.'],
  },
  {
    id: 'f-minor', stage: 'foundations', title: 'Minor Scales: Natural, Harmonic, Melodic', min: 12,
    keywords: ['minor scale', 'harmonic minor', 'melodic minor', 'scales', 'relative minor'],
    summary: 'Three flavours of minor and when each one is used.',
    body: `
<ul>
<li><b>Natural minor</b> (Aeolian): the major scale started on its 6th degree. A minor is the relative minor of C major.</li>
<li><b>Harmonic minor</b>: raise the 7th (G → G♯). This gives a real <b>V7</b> (E7) in minor, with a leading tone pulling to the root. Classical cadences, gospel minor and flamenco live here.</li>
<li><b>Melodic minor</b> (jazz minor): raise the 6th and 7th going up. Jazz players use it in both directions over mMaj7 and m6 chords. Its modes give the <b>altered</b> scale and <b>lydian dominant</b>.</li>
</ul>
<p><b>Alternate:</b> <b>Dorian</b> (natural minor with a raised 6th) is the standard jazz, funk and neo-soul minor sound over m7 chords.</p>`,
    examples: [
      X('A natural minor', L('A3:.5 B3 C4 D4 E4 F4 G4 A4:2'), { bpm: 96 }),
      X('A harmonic minor + its V7 → i', merge(L('A3:.5 B3 C4 D4 E4 F4 G#4 A4:2'), P([['E7', 2], ['Am', 2]], { style: 'root', start: 4 })), { bpm: 96 }),
      X('A melodic minor (jazz)', L('A3:.5 B3 C4 D4 E4 F#4 G#4 A4 G#4 F#4 E4 D4 C4 B3 A3:2'), { bpm: 96 }),
    ],
    alternates: [
      { title: 'Dorian over a minor vamp', why: 'Raised 6th = brighter, soulful minor (funk, modal jazz, neo-soul).', ex: X('D dorian over Dm7', merge(P([['Dm7', 8]], { style: 'shell' }), L('D4:.5 E4 F4 G4 A4 B4 C5 D5 C5 B4 A4 G4 F4 E4 D4:2')), { bpm: 100 }) },
    ],
    exercise: { type: 'notes', prompt: 'Play A harmonic minor ascending.', targets: 'A B C D E F G# A' },
    creative: ['Improvise over an A minor drone, first with natural minor and then with dorian. Describe the difference.'],
  },
  {
    id: 'f-triads', stage: 'foundations', title: 'Triads & Inversions', min: 14,
    keywords: ['triads', 'inversions', 'major', 'minor', 'diminished', 'augmented', 'chords'],
    summary: 'Major, minor, diminished and augmented triads, and inversions for smooth movement.',
    body: `
<p>A <b>triad</b> stacks two 3rds:</p>
<ul><li><b>Major</b> 1–3–5 (M3 + m3): bright, stable.</li><li><b>Minor</b> 1–♭3–5 (m3 + M3): dark, tender.</li>
<li><b>Diminished</b> 1–♭3–♭5 (m3 + m3): tense, passing.</li><li><b>Augmented</b> 1–3–♯5 (M3 + M3): suspenseful, dreamy.</li></ul>
<p><b>Inversions</b> put a different chord tone on the bottom: root position (1-3-5), 1st inversion (3-5-1), 2nd inversion (5-1-3).
Choose inversions so each voice moves the shortest distance. That is <b>voice leading</b>, the skill behind smooth gospel, worship and classical playing.</p>
<p>Notice <b>C/E</b> (C with E in the bass) in the chord names. This is <b>slash-chord</b> notation, used everywhere in gospel and pop.</p>`,
    examples: [
      X('Four triad qualities on C', P(['C', 'Cm', 'Cdim', 'Caug'].map(s => [s, 2]), { style: 'inv0' }), { bpm: 80 }),
      X('C major inversions', L('[C4,E4,G4]:1.5 [E4,G4,C5]:1.5 [G4,C5,E5]:1.5 [C5,E5,G5]:2.5'), { bpm: 80 }),
      X('I–IV–V–I: jumping vs voice-led', merge(P(['C', 'F', 'G', 'C'].map(s => [s, 2]), { style: 'inv0' }), P(['C', 'F', 'G', 'C'].map(s => [s, 2]), { style: 'root', start: 8 })), { bpm: 84, desc: 'First pass jumps in root position; second pass uses the nearest inversions.' }),
    ],
    exercise: { type: 'chords', prompt: 'Play each triad (any inversion).', targets: ['C', 'Am', 'F', 'G', 'Bdim'] },
    creative: ['Play I–vi–IV–V using only inversions, so the top note stays as still as possible.', 'Turn a major triad into augmented and let it resolve somewhere unexpected.'],
  },
  {
    id: 'f-rhythm', stage: 'foundations', title: 'Pulse, Subdivision & Swing', min: 10,
    keywords: ['rhythm', 'swing', 'subdivision', 'triplets', 'groove', 'time feel'],
    summary: 'Quarters, eighths, triplets, sixteenths and the swing feel that defines jazz and gospel.',
    body: `
<p>Groove starts with feeling the <b>subdivision</b>, the smaller pulses inside each beat: 2 (eighths), 3 (triplets), 4 (sixteenths).</p>
<p><b>Swing</b> plays pairs of eighths long–short, like the first and third notes of a triplet. Gospel shuffles, jazz, blues and
neo-soul all swing in different amounts. In this app, the <b>Swing</b> slider on each example morphs straight eighths into swung ones.</p>
<p>Count out loud: “1-&-2-&”, “1-trip-let”, “1-e-&-a”. Accents on <b>2 and 4</b> (the backbeat) make it feel like jazz or gospel.</p>`,
    examples: [
      X('Subdivisions: 1, 2, 3, 4 per beat', merge(L('C5:1 C5 C5 C5 C5:.5 C5 C5 C5 C5 C5 C5 C5 C5:1/3 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5:.25 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5 C5'), L('C3:1 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3', { hand: 'lh', vel: 0.55 })), { bpm: 84 }),
      X('Straight eighths', merge(L('C5:.5 D5 E5 G5 A5 G5 E5 D5 C5:2'), L('C3:1 G3 E3 G3 C3:2', { hand: 'lh', vel: 0.5 })), { bpm: 110 }),
      X('Same line, swung', merge(L('C5:.5 D5 E5 G5 A5 G5 E5 D5 C5:2'), L('C3:1 G3 E3 G3 C3:2', { hand: 'lh', vel: 0.5 })), { bpm: 110, swing: 1 }),
    ],
    exercise: { type: 'free', prompt: 'Record yourself playing C–D–E–G as straight eighths, then swung. Play both takes back and compare.' },
    creative: ['Play one repeated note with accents on 2 and 4 only. Can you make it groove?'],
  },

  // ============================================================ II. HARMONY CORE
  {
    id: 'h-diatonic', stage: 'harmony', title: 'Diatonic Chords & Roman Numerals', min: 14,
    keywords: ['diatonic', 'roman numerals', 'chord function', 'number system', 'progressions'],
    summary: 'Build a chord on every scale degree and learn the number system that musicians use to talk about harmony.',
    body: `
<p>Stack 3rds on each degree of C major: <b>I</b> C, <b>ii</b> Dm, <b>iii</b> Em, <b>IV</b> F, <b>V</b> G, <b>vi</b> Am, <b>vii°</b> Bdim.</p>
<p>Chords have <b>functions</b>:</p>
<ul><li><b>Tonic</b> (home): I, vi, iii</li><li><b>Subdominant / pre-dominant</b> (moving away): IV, ii</li><li><b>Dominant</b> (tension → home): V, vii°</li></ul>
<p>Gospel and church musicians call chords by number (“go to the 4”), so <b>the number system transfers to every key</b>. Learn progressions as numbers, not letters.</p>`,
    examples: [
      X('Diatonic triads in C', P(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C'].map(s => [s, 1]), { style: 'inv0' }), { bpm: 80 }),
      X('I–vi–IV–V (pop / doo-wop)', repeat(P(['C', 'Am', 'F', 'G'], { style: 'root', rh: [[0, 1], [1, 1, .8], [2, 1, .9], [3, 1, .8]] }), 2, 16), { bpm: 96 }),
      X('I–IV–V–I (hymn, blues, gospel)', P(['C', 'F', 'G', 'C'], { style: 'root' }), { bpm: 84, pedal: 'chord' }),
    ],
    alternates: [
      { title: 'I–vi–ii–V', why: 'Swap IV for ii (same function, extra pull to V). This is the jazz “rhythm changes” turnaround.', ex: X('I–vi–ii–V', P(['C', 'Am', 'Dm', 'G'], { style: 'root' }), { bpm: 90 }) },
      { title: 'vi–IV–I–V', why: 'Start on the relative minor for an emotional pop/worship colour.', ex: X('vi–IV–I–V', P(['Am', 'F', 'C', 'G'], { style: 'root' }), { bpm: 90 }) },
    ],
    exercise: { type: 'chords', prompt: 'Play I–vi–IV–V in C.', targets: ['C', 'Am', 'F', 'G'] },
    creative: ['Write a 4-chord progression using only numbers, then play it in three keys.'],
  },
  {
    id: 'h-sevenths', stage: 'harmony', title: 'Seventh Chords', min: 14,
    keywords: ['seventh chords', 'maj7', 'dominant', 'm7', 'half diminished', 'dim7', 'chords'],
    summary: 'The five 7th-chord qualities that power jazz, gospel and R&B.',
    body: `
<table class="tbl"><tr><th>Chord</th><th>Formula</th><th>Sound / function</th></tr>
<tr><td>Cmaj7</td><td>1–3–5–7</td><td>dreamy tonic (I, IV)</td></tr>
<tr><td>C7</td><td>1–3–5–♭7</td><td>dominant: tension, blues home chord</td></tr>
<tr><td>Cm7</td><td>1–♭3–5–♭7</td><td>smooth minor (ii, iii, vi)</td></tr>
<tr><td>Cm7♭5 (ø)</td><td>1–♭3–♭5–♭7</td><td>ii in minor keys, vii in major</td></tr>
<tr><td>Cdim7 (°7)</td><td>1–♭3–♭5–𝄫7</td><td>symmetrical passing chord</td></tr></table>
<p>The <b>3rd</b> and <b>7th</b> are the <b>guide tones</b>. They define the quality, so the 5th can often be left out.</p>`,
    examples: [
      X('Five qualities on C', P(['Cmaj7', 'C7', 'Cm7', 'Cm7b5', 'Cdim7'].map(s => [s, 2]), { style: 'root' }), { bpm: 76 }),
      X('Diatonic 7ths in C', P(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5', 'Cmaj7'].map(s => [s, 1.5]), { style: 'root' }), { bpm: 80 }),
      X('Guide tones only (3rds & 7ths)', P(['Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', ['Am7', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'shell' }), { bpm: 80 }),
    ],
    exercise: { type: 'chords', prompt: 'Play all five 7th qualities on C.', targets: ['Cmaj7', 'C7', 'Cm7', 'Cm7b5', 'Cdim7'] },
    creative: ['Take a song you know with triads and convert every chord to its diatonic 7th.'],
  },
  {
    id: 'h-extensions', stage: 'harmony', title: 'Extensions & Altered Tensions', min: 16,
    keywords: ['extensions', '9th', '11th', '13th', 'altered', 'tensions', 'colour'],
    summary: '9ths, 11ths, 13ths and ♭9 / ♯9 / ♯11 / ♭13: where the colour lives.',
    body: `
<p>Keep stacking 3rds past the 7th: <b>9</b> (= 2), <b>11</b> (= 4), <b>13</b> (= 6). These are <b>extensions</b>.</p>
<ul>
<li><b>Major chords</b>: 9, ♯11, 13. A natural 11 clashes with the 3rd, so it’s the “avoid note”.</li>
<li><b>Minor chords</b>: 9, 11, 13 all work (dorian). The m11 is the neo-soul and gospel favourite.</li>
<li><b>Dominant chords</b> accept <b>everything</b>: natural 9/13 (smooth), or <b>altered</b> ♭9, ♯9, ♯11, ♭13 (tension that wants to resolve).</li>
</ul>
<p>Rule of thumb: <b>unaltered</b> dominants for a relaxed, bluesy sound; <b>altered</b> dominants when resolving to a minor chord or to sound more “jazz”.</p>`,
    examples: [
      X('Cmaj7 → Cmaj9 → Cmaj13 → Cmaj7♯11', P(['Cmaj7', 'Cmaj9', 'Cmaj13', 'Cmaj7#11'].map(s => [s, 2]), { style: 'root+rootless' }), { bpm: 70, pedal: 'chord' }),
      X('Dominant colours resolving to C', P([['G7', 2], ['Cmaj7', 2], ['G13', 2], ['Cmaj9', 2], ['G7b9', 2], ['Cmaj9', 2], ['G7alt', 2], ['C69', 2]], { style: 'root+rootless' }), { bpm: 76, pedal: 'chord' }),
      X('Minor: m7 → m9 → m11', P(['Dm7', 'Dm9', 'Dm11'].map(s => [s, 2.5]), { style: 'gospel' }), { bpm: 70, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play Dm9, G13, Cmaj9 (any voicing; 5ths and roots are optional).', targets: ['Dm9', 'G13', 'Cmaj9'] },
    creative: ['Sustain one dominant chord and cycle through ♭9, ♮9, ♯9 on top. Which do you prefer and why?'],
  },
  {
    id: 'h-251', stage: 'harmony', title: 'The ii–V–I (Major & Minor)', min: 18,
    keywords: ['ii v i', '2 5 1', 'two five one', 'progression', 'jazz', 'guide tones'],
    summary: 'The most important progression in jazz and gospel: in major, in minor and through all keys.',
    body: `
<p><b>ii–V–I</b> = pre-dominant → dominant → tonic. In C: <b>Dm7 – G7 – Cmaj7</b>. In minor: <b>Dm7♭5 – G7♭9 – Cm6</b>.</p>
<p><b>Voice-leading secret:</b> the 7th of each chord falls a half step to become the 3rd of the next (C → B, F → E).
Only two notes per chord need to move, which is why ii–V–Is sound so smooth.</p>
<p>Practise them descending in whole steps (C, B♭, A♭, …) and around the circle of 4ths. Recognising ii–Vs in tunes (and in gospel
progressions such as “2-5-1” and “3-6-2-5-1”) is the single biggest step toward playing by ear.</p>`,
    examples: [
      X('Major ii–V–I (root position)', P(ii_V_I, { style: 'root' }), { bpm: 84, pedal: 'chord' }),
      X('Guide-tone voice leading', P(ii_V_I, { style: 'shell' }), { bpm: 84, desc: 'Listen: C→B and F→E. Two half steps carry the whole progression.' }),
      X('Minor ii–V–i', P(['Dm7b5', 'G7b9', ['Cm69', 8]], { style: 'root+rootless' }), { bpm: 80, pedal: 'chord' }),
      X('ii–V–I down in whole steps', P(['Dm9', 'G13', 'Cmaj9', 'Cmaj9', 'Cm9', 'F13', 'Bbmaj9', 'Bbmaj9', 'Bbm9', 'Eb13', 'Abmaj9', 'Abmaj9'].map(s => [s, 2]), { style: 'root+rootless' }), { bpm: 96 }),
    ],
    alternates: [
      { title: 'Tritone substitute V', why: 'Db7 shares G7’s tritone (F & B/C♭) and lets the bass slide down by half step.', ex: X('Dm7 – D♭7 – Cmaj7', P(['Dm9', 'Db7#11', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 84 }) },
      { title: 'Backdoor ii–V', why: 'iv–♭VII (Fm7 – B♭7) borrows from minor for a warm, soulful resolution.', ex: X('Fm7 – B♭7 – Cmaj7', P(['Fm9', 'Bb13', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 84 }) },
      { title: 'Sus dominant', why: 'G9sus4 (= F/G) floats instead of pulling hard. Very gospel, very modern.', ex: X('Dm9 – G9sus4 – Cmaj9', P(['Dm9', 'G9sus4', ['Cmaj9', 8]], { style: 'gospel' }), { bpm: 84 }) },
    ],
    exercise: { type: 'chords', prompt: 'Play ii–V–I in C, then in F.', targets: ['Dm7', 'G7', 'Cmaj7', 'Gm7', 'C7', 'Fmaj7'] },
    creative: ['Play ii–V–I in three keys without stopping; connect each key by moving the fewest notes.', 'Improvise using only the guide tones as your melody.'],
  },
  {
    id: 'h-modes', stage: 'harmony', title: 'Modes in Context', min: 16,
    keywords: ['modes', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'scales', 'chord scale'],
    summary: 'Every chord has a scale. Modes are the major scale heard from a different home note.',
    body: `
<p>The modes of C major, and the chord each one belongs to:</p>
<table class="tbl"><tr><th>Mode</th><th>From</th><th>Chord</th><th>Character</th></tr>
<tr><td>Ionian</td><td>C</td><td>Cmaj7</td><td>bright home</td></tr>
<tr><td>Dorian</td><td>D</td><td>Dm7 / Dm9 / Dm11</td><td>soulful minor</td></tr>
<tr><td>Phrygian</td><td>E</td><td>Esus♭9</td><td>Spanish, dark</td></tr>
<tr><td>Lydian</td><td>F</td><td>Fmaj7♯11</td><td>floating, cinematic</td></tr>
<tr><td>Mixolydian</td><td>G</td><td>G7 / G13 / G9sus</td><td>bluesy dominant</td></tr>
<tr><td>Aeolian</td><td>A</td><td>Am7</td><td>sad minor</td></tr>
<tr><td>Locrian</td><td>B</td><td>Bm7♭5</td><td>unstable</td></tr></table>
<p><b>Application:</b> over a ii–V–I in C you can stay in C major for all three chords. Each chord just changes which notes are <b>stable</b>
(chord tones) and which are <b>colour</b>.</p>`,
    examples: [
      X('D dorian over Dm7', merge(P([['Dm9', 8]], { style: 'shell' }), L('D4:.5 E4 F4 G4 A4 B4 C5 D5 C5 A4 F4 E4 D4:2', { vel: .7 })), { bpm: 100 }),
      X('G mixolydian over G7', merge(P([['G13', 8]], { style: 'shell' }), L('G4:.5 A4 B4 C5 D5 E5 F5 G5 F5 D5 B4 A4 G4:2')), { bpm: 100 }),
      X('F lydian over Fmaj7♯11', merge(P([['Fmaj7#11', 8]], { style: 'shell' }), L('F4:.5 G4 A4 B4 C5 D5 E5 F5 E5 C5 B4 A4 F4:2')), { bpm: 90, pedal: [[0, 7.9]] }),
    ],
    exercise: { type: 'notes', prompt: 'Play D dorian ascending.', targets: 'D E F G A B C D' },
    creative: ['Vamp Dm7 to G7 and improvise only on white keys. Then vamp Fmaj7♯11 and hear how the same notes change mood.'],
  },
  {
    id: 'h-interchange', stage: 'harmony', title: 'Modal Interchange (Borrowed Chords)', min: 12,
    keywords: ['modal interchange', 'borrowed chords', 'minor iv', 'flat six', 'flat seven'],
    summary: 'Borrow chords from the parallel minor (iv, ♭VI, ♭VII) for instant emotion.',
    body: `
<p>C major can borrow chords from C minor: <b>Fm</b> (iv), <b>A♭</b> (♭VI), <b>B♭</b> (♭VII), <b>E♭</b> (♭III).</p>
<ul><li><b>IV → iv → I</b> (F → Fm → C): the bittersweet “church amen” sigh, all over gospel and soul ballads.</li>
<li><b>♭VI → ♭VII → I</b> (A♭ → B♭ → C): heroic, cinematic, rock and video-game cadence.</li>
<li><b>iv7 → ♭VII7 → I</b> (Fm7 → B♭7 → C): the <b>backdoor</b> ii–V.</li></ul>`,
    examples: [
      X('IV – iv – I', P(['F', 'Fm', ['C', 8]], { style: 'gospel' }), { bpm: 70, pedal: 'chord' }),
      X('♭VI – ♭VII – I', P(['Ab', 'Bb', ['C', 8]], { style: 'root' }), { bpm: 80, pedal: 'chord' }),
      X('Backdoor: Fm7 – B♭7 – Cmaj7', P(['Fm9', 'Bb13', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 76, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C – F – Fm – C.', targets: ['C', 'F', 'Fm', 'C'] },
    creative: ['Take I–IV–V–I and replace one chord with a borrowed chord. Write down which one moved you most.'],
  },

  // ============================================================ III. VOICINGS
  {
    id: 'v-shell', stage: 'voicings', title: 'Shell Voicings (1-3-7)', min: 14,
    keywords: ['shell voicings', 'left hand', 'guide tones', 'voicing', 'jazz piano'],
    summary: 'Three-note left-hand voicings that leave the right hand free for melody.',
    body: `
<p>A <b>shell</b> is root + 3rd + 7th (or root + 7th + 3rd). It holds everything needed to define the chord.</p>
<ul><li><b>1–3–7</b> for higher roots; <b>1–7–3</b> for low roots (so the 3rd isn’t muddy).</li>
<li>Alternate them through a ii–V–I: Dm7 (1-3-7) → G7 (1-7-3) → Cmaj7 (1-3-7). The hand barely moves.</li>
<li>Right hand: melody, guide-tone lines or extensions (9, 13).</li></ul>`,
    examples: [
      X('ii–V–I shells', P(ii_V_I, { style: 'shell' }), { bpm: 84 }),
      X('Shells + right-hand melody', merge(P(['Dm7', 'G7', ['Cmaj7', 8]], { style: 'shell' }), L('A4:1 C5 E5 D5 B4:1.5 G4:.5 F4 E4:1 r:.5 E4:1 G4 B4:1.5 r:.5', { vel: 0.8 })), { bpm: 92, swing: 0.8 }),
      X('Cycle of shells (descending 5ths)', P(['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7b5', 'B7', ['Em7', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'shell' }), { bpm: 96 }),
    ],
    exercise: { type: 'chords', prompt: 'Play shells for Dm7, G7, Cmaj7 (left hand only is fine).', targets: ['Dm7', 'G7', 'Cmaj7'] },
    creative: ['Play shells in the left hand and improvise using only the 9th and 13th of each chord in the right hand.'],
  },
  {
    id: 'v-rootless', stage: 'voicings', title: 'Rootless Voicings: A & B Positions', min: 20,
    keywords: ['rootless', 'voicings', 'a and b', 'bill evans', 'left hand voicings', 'jazz piano', 'comping'],
    summary: 'The modern jazz sound: 3-5-7-9 and 7-9-3-5, with the dominant taking the 13th.',
    body: `
<p>Leave the root to the bass player (or your left-hand pinky) and voice the colours:</p>
<ul><li><b>A position</b>: 3–5–7–9 (dominants: 3–13–♭7–9)</li><li><b>B position</b>: 7–9–3–5 (dominants: ♭7–9–3–13)</li></ul>
<p>Through a ii–V–I, alternate <b>A → B → A</b> or <b>B → A → B</b>. Each voice moves by a step or stays put.
Keep voicings roughly between <b>D3 and C5</b>.</p>
<p>In minor: Dm7♭5 → G7alt → Cm6/9 uses the same idea with altered tones (♭9, ♯9, ♭13) on the V.</p>`,
    examples: [
      X('ii–V–I rootless (with bass)', P(['Dm9', 'G13', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 84, pedal: 'chord' }),
      X('A vs B on the same chord', merge(L('[F3,A3,C4,E4]:2 [C4,E4,F4,A4]:2'), L('D2:4', { hand: 'lh' })), { bpm: 70, desc: 'Dm9 in A position (3-5-7-9) then B position (7-9-3-5).' }),
      X('Minor ii–V–i rootless', P(['Dm7b5', 'G7alt', ['Cm69', 8]], { style: 'root+rootless' }), { bpm: 80, pedal: 'chord' }),
      X('Rootless ii–V–Is through the keys', P(['Dm9', 'G13', 'Cmaj9', 'Cm9', 'F13', 'Bbmaj9', 'Bbm9', 'Eb13', 'Abmaj9', 'Abm9', 'Db13', 'Gbmaj9'].map(s => [s, 2]), { style: 'root+rootless' }), { bpm: 104 }),
    ],
    alternates: [
      { title: 'Swap G13 for G7alt', why: 'Altered dominant = darker, more tension, classic bebop resolution.', ex: X('Dm9 – G7alt – Cmaj9', P(['Dm9', 'G7alt', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 84 }) },
      { title: 'Swap G13 for D♭9 (tritone sub)', why: 'Same top voices; only the bass changes, making a chromatic bass line D–D♭–C.', ex: X('Dm9 – D♭9 – Cmaj9', P(['Dm9', 'Db9', ['Cmaj9', 8]], { style: 'root+rootless' }), { bpm: 84 }) },
    ],
    exercise: { type: 'chords', prompt: 'Play Dm9, G13, Cmaj9 as rootless voicings.', targets: ['Dm9', 'G13', 'Cmaj9'] },
    creative: ['Comp rootless voicings on a ii–V–I with a different rhythm each time through.'],
  },
  {
    id: 'v-drop2', stage: 'voicings', title: 'Drop 2 & Spread Voicings', min: 14,
    keywords: ['drop 2', 'spread voicings', 'ballad', 'open voicings', 'voicing'],
    summary: 'Open up close voicings for a big-band, ballad and solo-piano sound.',
    body: `
<p><b>Drop 2:</b> take a close-position 4-note chord and drop the <b>second-highest</b> note an octave. The result is wider and
more resonant, and the top note is free to carry a melody (the “block chord” sound).</p>
<p><b>Spread voicings</b> (ballads, solo piano): left hand plays 1–7 or 1–5–10, right hand plays 3–7–9 or 3–13–9 above.
They fill the whole piano with a warm, orchestral sound. Use with the sustain pedal, changing it on each chord.</p>`,
    examples: [
      X('Cmaj7: close vs drop 2', L('[C4,E4,G4,B4]:2 [G3,C4,E4,B4]:2 [E3,B3,D4,G4]:2'), { bpm: 70, pedal: [[0, 1.9], [2, 3.9], [4, 6]] }),
      X('ii–V–I in drop 2', P(['Dm9', 'G13', ['Cmaj9', 8]], { style: 'drop2' }), { bpm: 80, pedal: 'chord' }),
      X('Ballad spread voicings', P(['Fmaj9', 'Em9', 'A7b9', 'Dm9', 'G13', ['Cmaj9', 8]].map(s => Array.isArray(s) ? s : [s, 4]), { style: 'spread', arp: { notes: 'rh', step: 0.33, pattern: [0, 1, 2], hold: true } }), { bpm: 66, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play a drop-2 Cmaj7 (G–C–E–B), then Dm7 and G7 in drop 2.', targets: ['Cmaj7', 'Dm7', 'G7'] },
    creative: ['Pick a slow melody and harmonise every melody note with a drop-2 voicing beneath it.'],
  },
  {
    id: 'v-quartal', stage: 'voicings', title: 'Quartal & “So What” Voicings', min: 14,
    keywords: ['quartal', 'fourths', 'so what', 'modal', 'mccoy', 'voicing'],
    summary: 'Voicings stacked in 4ths: open, modern and modal.',
    body: `
<p><b>Quartal</b> voicings stack perfect 4ths instead of 3rds. They sound open and ambiguous, the sound of modal jazz and fusion.</p>
<ul><li><b>“So What” voicing</b>: three 4ths + a major 3rd on top (D–G–C–F–A over Dm7). It works on any minor 7th.</li>
<li><b>Planing</b>: move the same shape stepwise through the mode (D dorian) for instant modern comping.</li>
<li>Over dominant chords: ♭7–3–13–9 (a tritone + 4ths) keeps the quartal colour while defining the chord.</li></ul>`,
    examples: [
      X('“So What” voicings: Dm7 → E♭m7', P([['Dm7', 4], ['Ebm7', 4], ['Dm7', 4]], { style: 'quartal', rh: [[0, 0.5], [2.5, 1.2]] }), { bpm: 120, swing: 0.6 }),
      X('Quartal planing in D dorian', L('[D3,G3,C4]:.5 [E3,A3,D4] [F3,B3,E4] [G3,C4,F4]:1 [F3,B3,E4]:.5 [E3,A3,D4] [D3,G3,C4]:2 [A3,D4,G4]:1 [G3,C4,F4]:1 [D3,G3,C4]:2'), { bpm: 110 }),
      X('Quartal ii–V–I', P(['Dm7', 'G13', ['C69', 8]], { style: 'quartal' }), { bpm: 84, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play a “So What” voicing on Dm7 (D–G–C–F–A).', targets: ['Dm7'] },
    creative: ['Vamp on D dorian using only quartal shapes and syncopated rhythms for 2 minutes.'],
  },
  {
    id: 'v-ust', stage: 'voicings', title: 'Upper Structures & Poly Chords', min: 18,
    keywords: ['upper structure', 'poly chords', 'polychord', 'triad over', 'altered', 'voicing'],
    summary: 'Triads stacked over a dominant shell: instant, precise tension colours.',
    body: `
<p>An <b>upper-structure triad (UST)</b> is a simple triad played in the right hand over a <b>shell</b> (1–3–♭7) in the left.
Notation: <b>D|C7</b> means a D triad over C7.</p>
<table class="tbl"><tr><th>Triad over C7</th><th>Adds</th><th>Result</th></tr>
<tr><td>D</td><td>9, ♯11, 13</td><td>C13♯11 (lydian dominant)</td></tr>
<tr><td>A</td><td>13, ♭9, 3</td><td>C13♭9</td></tr>
<tr><td>E♭</td><td>♯9, 5, ♭7</td><td>C7♯9</td></tr>
<tr><td>A♭</td><td>♭13, 1, ♯9</td><td>C7alt (♯5♯9)</td></tr>
<tr><td>G♭ (F♯)</td><td>♭5, ♭7, ♭9</td><td>C7♭9♯11</td></tr>
<tr><td>B♭</td><td>♭7, 9, 11</td><td>C9sus / C11</td></tr></table>
<p><b>Poly chords</b> extend the idea: any triad over any other chord. Gospel and neo-soul players stack triads to get “stacked” sounds.</p>`,
    examples: [
      X('Upper structures on C7 → Fmaj9', P([['D|C7', 2], ['Fmaj9', 2], ['A|C7', 2], ['Fmaj9', 2], ['Eb|C7', 2], ['Fmaj9', 2], ['Ab|C7', 2], ['F69', 2]], { style: 'root' }), { bpm: 72, pedal: 'chord' }),
      X('Poly-chord vamp', P([['D|C', 4], ['E|D', 4], ['F#|E', 4], ['D|C', 4]], { style: 'root', rh: [[0, 1.5], [1.5, 2.5, 0.85]] }), { bpm: 84, pedal: 'chord' }),
      X('B♭ over C: the sus sound', P([['Bb|C7', 4], ['Fmaj9', 4]], { style: 'root' }), { bpm: 70, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play D triad over C7 (C13♯11), then A♭ triad over C7 (altered).', targets: ['D|C7', 'Ab|C7'] },
    creative: ['Pick one dominant chord and try all six upper structures. Rank them from sweetest to darkest.'],
  },
  {
    id: 'v-slash', stage: 'voicings', title: 'Slash Chords & Pedal Points', min: 12,
    keywords: ['slash chords', 'pedal point', 'inversions', 'bass line', 'sus'],
    summary: 'Chord over a different bass note: moving bass lines, IV/V and pedal points.',
    body: `
<p><b>C/E</b> = C chord with E in the bass. Slash chords create <b>melodic bass lines</b>, the backbone of gospel, worship and pop ballads.</p>
<ul><li><b>Descending bass</b>: C – G/B – Am – Am/G – F – C/E – Dm7 – G</li>
<li><b>IV/V</b> (F/G): the gospel and pop “sus dominant”. Softer than G7 and very modern.</li>
<li><b>Pedal point</b>: keep one bass note while chords change above it. It builds suspense (intros, endings, vamps).</li></ul>`,
    examples: [
      X('Descending bass line', P(['C', 'G/B', 'Am', 'Am/G', 'F', 'C/E', 'Dm7', 'G'].map(s => [s, 2]), { style: 'root' }), { bpm: 80, pedal: 'chord' }),
      X('IV/V resolving to I', P([['F/G', 4], ['C69', 4], ['Bb/C', 4], ['F69', 4]], { style: 'gospel' }), { bpm: 72, pedal: 'chord' }),
      X('Pedal point on C', P(['C', 'Bb/C', 'F/C', 'C'].map(s => [s, 2]), { style: 'root', octaveBass: true }), { bpm: 76, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C/E, F/G and G/B (bass note must be lowest).', targets: ['C/E', 'F/G', 'G/B'], strictBass: true },
    creative: ['Harmonise a descending chromatic bass line (C–B–B♭–A–A♭–G) with slash chords.'],
  },

  // ============================================================ IV. MOTION & REHARM
  {
    id: 'r-secdom', stage: 'motion', title: 'Secondary Dominants', min: 14,
    keywords: ['secondary dominants', 'five of', 'V of', 'reharmonization', 'reharm'],
    summary: 'Make any chord feel like a temporary home by preceding it with its own V7.',
    body: `
<p>Every diatonic chord (except vii°) can be <b>tonicised</b> by its own dominant: <b>V/ii</b> = A7 → Dm, <b>V/V</b> = D7 → G,
<b>V/vi</b> = E7 → Am, <b>V/IV</b> = C7 → F.</p>
<p>Gospel players call this “<b>the 5 of</b>” (“play the 5 of 4” = C7 → F). The raised note (C♯ in A7, F♯ in D7) is a temporary leading tone,
so the line pulls hard to the next chord.</p>
<p><b>Chains:</b> E7 → A7 → D7 → G7 → C (each chord is the V of the next). This is the “ragtime” or “rhythm changes bridge” sound.</p>`,
    examples: [
      X('I – V/ii – ii – V – I', P(['C', 'A7', 'Dm7', 'G7', ['C', 4]], { style: 'root' }), { bpm: 84, pedal: 'chord' }),
      X('V/IV: the “5 of 4”', P(['C', 'C7', 'F', 'Fm6', ['C', 4]], { style: 'gospel' }), { bpm: 76, pedal: 'chord' }),
      X('Dominant chain', P(['E9', 'A13', 'D9', 'G13', ['C69', 4]], { style: 'root+rootless' }), { bpm: 90, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C – A7 – Dm7 – G7.', targets: ['C', 'A7', 'Dm7', 'G7'] },
    creative: ['Take I–vi–IV–V and add a secondary dominant before every chord. Try it in the Reharm Lab first.'],
  },
  {
    id: 'r-tritone', stage: 'motion', title: 'Tritone Substitution', min: 14,
    keywords: ['tritone substitution', 'tritone sub', 'chromatic bass', 'reharmonization', 'reharm'],
    summary: 'Replace V7 with the dominant a tritone away: same tension, chromatic bass.',
    body: `
<p>G7’s tritone (B–F) is also D♭7’s tritone (F–C♭). Because they share the engine, <b>D♭7 can replace G7</b>.</p>
<ul><li>Dm7 – <b>D♭7</b> – Cmaj7: the bass slides D → D♭ → C.</li>
<li>The sub’s natural extensions (D♭9, D♭7♯11) are G7’s <b>altered</b> tones. Same sound family, new bass.</li>
<li>Works on any dominant, including secondary dominants: E7–A7–D7–G7 → E7–E♭7–D7–D♭7.</li></ul>`,
    examples: [
      X('V7 vs tritone sub', merge(P(['Dm9', 'G13', ['Cmaj9', 4]], { style: 'root+rootless' }), P(['Dm9', 'Db9', ['Cmaj9', 4]], { style: 'root+rootless', start: 12 })), { bpm: 80, pedal: 'chord' }),
      X('Chromatic dominant chain', P(['E9', 'Eb9', 'D9', 'Db9', ['Cmaj9', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'root+rootless' }), { bpm: 90 }),
      X('Sub of the sub: ii of D♭7', P(['Abm9', 'Db13', ['Cmaj9', 4]], { style: 'root+rootless' }), { bpm: 84, desc: 'Treat D♭7 as a V and precede it with its own ii (A♭m7).' }),
    ],
    exercise: { type: 'chords', prompt: 'Play Dm7 – D♭7 – Cmaj7.', targets: ['Dm7', 'Db7', 'Cmaj7'] },
    creative: ['In a blues, replace every dominant at the end of a phrase with its tritone sub.'],
  },
  {
    id: 'r-passing', stage: 'motion', title: 'Passing Chords: Diminished & Chromatic', min: 16,
    keywords: ['passing chords', 'diminished', 'chromatic', 'approach chords', 'transitions'],
    summary: 'Connect two chords with a chromatic passing chord: ♯°7, planing and approach chords.',
    body: `
<p>A <b>passing chord</b> lives between two structural chords and connects them smoothly.</p>
<ul><li><b>♯I°7</b>: C → C♯°7 → Dm7. The bass rises chromatically and the °7 acts like A7♭9 (V/ii) without its root.</li>
<li><b>♯IV°7</b>: F → F♯°7 → C/G, the gospel “walk-up to the 1 in second inversion”.</li>
<li><b>Chromatic approach</b>: approach any chord from a half step above (or below) with the same quality: E♭m9 → Dm9.</li>
<li><b>Planing</b>: slide a whole voicing shape chromatically (neo-soul and gospel).</li></ul>`,
    examples: [
      X('Diatonic walk with ♯°7 passing chords', P(['Cmaj7', 'C#dim7', 'Dm7', 'D#dim7', 'C/E', 'F6', 'F#dim7', 'C/G', 'G7', 'C'].map(s => [s, 1.5]), { style: 'root' }), { bpm: 84, pedal: 'chord' }),
      X('Chromatic approach chords', P([['Cmaj9', 3], ['Ebm9', 1], ['Dm9', 3], ['Ab13', 1], ['G13', 3], ['Dbmaj9', 1], ['Cmaj9', 4]], { style: 'root+rootless' }), { bpm: 84, pedal: 'chord' }),
      X('Planing m9 shapes', P([['Dm9', 2], ['Ebm9', 0.5], ['Em9', 1.5], ['Ebm9', 0.5], ['Dm9', 3.5]], { style: 'rootless' }), { bpm: 90, swing: 0.6 }),
    ],
    exercise: { type: 'chords', prompt: 'Play C – C♯°7 – Dm7.', targets: ['C', 'C#dim7', 'Dm7'] },
    creative: ['Between every two chords of a simple song, insert one passing chord. Keep the best ones.'],
  },
  {
    id: 'r-turnaround', stage: 'motion', title: 'Turnarounds & Transitions', min: 16,
    keywords: ['turnarounds', 'transitions', 'modulation', 'key change', 'endings', 'intros'],
    summary: 'Get back to the top, and travel smoothly between keys.',
    body: `
<p><b>Turnarounds</b> fill the last bars of a section and lead back to I:</p>
<ul><li>I – vi – ii – V (Cmaj7 Am7 Dm7 G7)</li><li>iii – VI – ii – V (Em7 A7 Dm7 G7)</li><li>I – ♭III – ♭VI – ♭II (Cmaj7 E♭maj7 A♭maj7 D♭maj7): tritone-sub turnaround</li></ul>
<p><b>Transitions to a new key:</b> play the ii–V of the new key (C → Fm7 B♭7 → E♭). For a more dramatic shift, use the <b>V7sus</b>
of the new key, or a chromatic step up (the gospel “truck-driver” modulation: C → D♭ via A♭7sus).</p>`,
    examples: [
      X('I – vi – ii – V', repeat(P(['Cmaj9', 'Am9', 'Dm9', 'G13'].map(s => [s, 2]), { style: 'root+rootless' }), 2, 8), { bpm: 100, swing: 0.7 }),
      X('iii – VI – ii – V – I', P(['Em9', 'A13b9', 'Dm9', 'G13', ['Cmaj9', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'root+rootless' }), { bpm: 92 }),
      X('Tritone turnaround', repeat(P(['Cmaj9', 'Ebmaj9', 'Abmaj9', 'Dbmaj9'].map(s => [s, 2]), { style: 'root+rootless' }), 2, 8), { bpm: 100 }),
      X('Modulate C → E♭ with a ii–V', P(['Cmaj9', 'Cmaj9', 'Fm9', 'Bb13', 'Ebmaj9', 'Ebmaj9'].map(s => [s, 2]), { style: 'root+rootless' }), { bpm: 90, pedal: 'chord' }),
      X('Gospel half-step lift (C → D♭)', P([['C69', 4], ['Ab9sus4', 2], ['Ab13', 2], ['Db69', 4]], { style: 'gospel' }), { bpm: 76, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play the turnaround Em7 – A7 – Dm7 – G7.', targets: ['Em7', 'A7', 'Dm7', 'G7'] },
    creative: ['Write an intro for a song in F using a turnaround, then modulate up a half step for the last chorus.'],
  },
  {
    id: 'r-strategies', stage: 'motion', title: 'Reharmonization Strategies', min: 20,
    keywords: ['reharmonization', 'reharm', 'melody', 'substitution', 'chord substitution', 'arranging'],
    summary: 'Keep the melody, change the story: three reharmonizations of one phrase.',
    body: `
<p>Reharmonization keeps the <b>melody</b> and changes the chords underneath. The core question: <b>what else can this melody note be?</b>
An E can be the 3rd of C, the 5th of Am, the 9th of Dm, the 7th of Fmaj7, the ♯9 of C♯7, the 13th of G…</p>
<ol><li><b>Diatonic subs</b>: replace chords with others of the same function (I ↔ vi ↔ iii, IV ↔ ii).</li>
<li><b>Approach</b>: add secondary dominants and ii–Vs into targets.</li><li><b>Substitute</b>: tritone subs, backdoor, modal interchange.</li>
<li><b>Bass-line first</b>: write a smooth bass line (descending, chromatic, pedal), then fit chords that contain the melody.</li></ol>
<p>The melody below is “mi – re – do” (E – D – C), heard three ways. Then open the <b>Reharm Lab</b> to experiment with your own.</p>`,
    examples: [
      X('Original: C – G7 – C', merge(P([['C', 4], ['G7', 4], ['C', 8]], { style: 'spread' }), L('E5:4@.85 D5:4@.85 C5:8@.85')), { bpm: 72, pedal: 'chord' }),
      X('Jazz: Am9 – B♭9 – A♭maj7 → Cmaj9', merge(P([['Am9', 4], ['Bb9', 4], ['Abmaj7', 4], ['Cmaj9', 4]], { style: 'spread' }), L('E5:4@.85 D5:4@.85 C5:8@.85')), { bpm: 72, pedal: 'chord', desc: 'E = 5th of Am9, D = 3rd of B♭9, C = 3rd of A♭maj7, then home.' }),
      X('Gospel: C/E – E7 – Am9 – F/G – C', merge(P([['C/E', 4], ['E7b9', 4], ['Am9', 4], ['F/G', 2], ['C69', 2]], { style: 'gospel' }), L('E5:4@.85 D5:4@.85 C5:8@.85')), { bpm: 72, pedal: 'chord', desc: 'D = ♭7 of E7, C = ♭3 of Am9: a detour through the relative minor.' }),
    ],
    exercise: { type: 'free', prompt: 'Hold E5 – D5 – C5 as your melody and record your own reharmonization underneath.' },
    creative: ['Reharmonise “Twinkle Twinkle” (public domain) using only ii–Vs into each melody note’s chord.', 'Use the Reharm Lab: enter a progression, apply 2 techniques, and keep only the changes you like.'],
  },

  // ============================================================ V. GOSPEL
  {
    id: 'g-foundations', stage: 'gospel', title: 'Gospel Foundations: The Church Sound', min: 16,
    keywords: ['gospel', 'church', 'black gospel', '1 4 5', 'praise', 'worship', 'octaves', 'number system'],
    summary: 'Octave bass, add9 and 6/9 colours, IV/V and the “Amen” cadence.',
    body: `
<p>Gospel piano comes from the church and moves by numbers (1, 4, 5, 2, 3, 6). The core textures:</p>
<ul><li><b>Left hand octaves</b> (root + root) for power. Add the 5th or 10th for warmth.</li>
<li><b>Right hand colours</b>: add9, 6/9, maj9, m11, 13. Rarely a bare triad.</li>
<li><b>IV/V</b> (F/G) instead of plain V. <b>Plagal</b> 4 → 1 (“Amen”) and the minor 4 (iv) for emotion.</li>
<li><b>Dynamics & pedal</b>: big swells, sustain on each chord, accents on 2 and 4 in praise songs.</li></ul>`,
    examples: [
      X('1 – 4 – 1 – 5 with colours', P(['C69', 'F69/C', 'C69', 'G9sus4', ['C69', 4]], { style: 'gospel' }), { bpm: 76, pedal: 'chord' }),
      X('Praise groove (2 & 4 accents)', repeat(P(['C69', 'F/G'].map(s => [s, 4]), { style: 'gospel', lh: [[0, 0.9], [1.5, 0.5], [2, 0.9]], rh: [[1, 0.4, 1.1], [2.5, 0.4, 0.8], [3, 0.4, 1.15]] }), 2, 8), { bpm: 112, swing: 0.8 }),
      X('Amen: IV – iv – I', P([['F69', 4], ['Fm6', 4], ['C69', 8]], { style: 'gospel' }), { bpm: 64, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C6/9 – F6/9 – F/G – C6/9.', targets: ['C69', 'F69', 'F/G', 'C69'] },
    creative: ['Play a 1–4–5 progression in three energy levels: worship (slow), testimony (medium swing), praise break (fast).'],
  },
  {
    id: 'g-251', stage: 'gospel', title: 'Gospel 2-5-1 & the 13th Sound', min: 18,
    keywords: ['gospel', '2 5 1', '3 6 2 5 1', '13th', 'gospel chords', 'progression'],
    summary: 'Minor 9 → 13(♭9) → maj9 / 6/9, and the 3-6-2-5-1 walk.',
    body: `
<p>The gospel ii–V–I is richer than the jazz one: <b>Dm11 – G13(♭9) – C6/9</b>. The 13 on the 5 chord, often with a ♭9 underneath, is <i>the</i> church sound.</p>
<p><b>3-6-2-5-1</b>: Em9 – A13♭9 – Dm9 – G13 – C6/9. Each chord is a dominant (or ii) of the next, cycling in 4ths.
Gospel players run this as a <b>turnaround</b> at the end of nearly every phrase.</p>
<p><b>Voicing tip</b>: right-hand voicings for 13 chords: <b>♭7–9–3–13</b> (F–A–B–E on G13); for 13♭9: <b>♭7–♭9–3–13</b>.</p>`,
    examples: [
      X('Gospel 2-5-1', P([['Dm11', 4], ['G13b9', 4], ['C69', 8]], { style: 'gospel' }), { bpm: 70, pedal: 'chord' }),
      X('3-6-2-5-1', P(['Em9', 'A13b9', 'Dm9', 'G13', ['C69', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'gospel' }), { bpm: 76, pedal: 'chord' }),
      X('Minor 2-5-1 (to the 6)', P([['Bm7b5', 2], ['E7#9', 2], ['Am9', 4]], { style: 'gospel' }), { bpm: 72, pedal: 'chord' }),
    ],
    alternates: [
      { title: 'Sus → 13 on the 5', why: 'G13sus4 → G13♭9 resolves the 4th to the 3rd before landing: a classic delayed resolution.', ex: X('Dm11 – G13sus4 – G13♭9 – C6/9', P([['Dm11', 4], ['G13sus4', 2], ['G13b9', 2], ['C69', 8]], { style: 'gospel' }), { bpm: 70, pedal: 'chord' }) },
    ],
    exercise: { type: 'chords', prompt: 'Play Em9 – A13♭9 – Dm9 – G13 – C6/9.', targets: ['Em9', 'A13b9', 'Dm9', 'G13', 'C69'] },
    creative: ['End every phrase of a hymn with a 3-6-2-5-1 turnaround.'],
  },
  {
    id: 'g-walkup', stage: 'gospel', title: 'Walk-ups & Passing Chords', min: 16,
    keywords: ['gospel', 'walk up', 'passing chords', 'diminished', 'bass line', 'transitions'],
    summary: 'The bass walks, the chords follow: 1 to 4 walk-ups and diminished connectors.',
    body: `
<p>A <b>walk-up</b> connects two chords with a step-wise bass line and a chord on every step:</p>
<ul><li><b>1 → 4</b>: C – C/E – F (bass C–E–F) or C – C7/E – F</li>
<li><b>4 → 1 (2nd inversion)</b>: F – F♯°7 – C/G</li>
<li><b>Full church walk</b>: C – C/E – F – F♯°7 – C/G – A7 – Dm7 – G7 – C</li></ul>
<p>Rhythm is half the effect: walk-ups usually happen on the last beats before the target, pushing forward.</p>`,
    examples: [
      X('1 → 4 walk-up', P([['C69', 3], ['C7/E', 1], ['F69', 4]], { style: 'gospel' }), { bpm: 80, pedal: 'chord' }),
      X('Full church walk', P(['C69', 'C/E', 'F69', 'F#dim7', 'C/G', 'A7b9', 'Dm9', 'G13', 'C69'].map((s, i) => [s, i === 8 ? 4 : 1]), { style: 'gospel' }), { bpm: 84, pedal: 'chord' }),
      X('Diminished walk 1 → 2 → 3', P(['C69', 'C#dim7', 'Dm9', 'D#dim7', 'C/E'].map((s, i) => [s, i === 4 ? 4 : 1]), { style: 'gospel' }), { bpm: 84, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C – C/E – F – F♯°7 – C/G.', targets: ['C', 'C/E', 'F', 'F#dim7', 'C/G'] },
    creative: ['Invent a walk-down from 1 to 6 (C – C/B – Am) and fill it with passing chords.'],
  },
  {
    id: 'g-runs', stage: 'gospel', title: 'Fills & Runs', min: 18,
    keywords: ['gospel runs', 'runs', 'fills', 'licks', 'pentatonic', 'blues scale', 'sixths', 'diminished'],
    summary: 'Pentatonic cascades, blues runs, 6ths and diminished runs that fill the gaps.',
    body: `
<p><b>Fills</b> answer the melody in the spaces between phrases. <b>Runs</b> are fast, scale-based fills that connect chords.</p>
<ul><li><b>Major pentatonic cascade</b>: the most common gospel run. Play it descending in triplets.</li>
<li><b>Gospel blues run</b>: major pentatonic with the ♭3 sliding into the 3 (E♭ → E).</li>
<li><b>Sixths</b>: harmonise a scale in 6ths for a sweet, singing fill.</li>
<li><b>Diminished run</b>: arpeggiate a °7 up the keyboard into a big chord.</li></ul>
<p>Practise slowly with the tempo slider, then speed up. <b>Fingering beats speed</b>: group the notes into 3s or 4s.</p>`,
    examples: [
      X('Major pentatonic cascade', merge(P([['C69', 4]], { style: 'gospel' }), L('C6:1/3 A5 G5 E5 D5 C5 A4 G4 E4 D4 C4:1@.8', { start: 0.5, vel: .7 })), { bpm: 84, pedal: [[0, 4]] }),
      X('Gospel blues run (♭3 → 3)', merge(P([['C69', 4], ['F9', 4]], { style: 'gospel' }), L('G4:.25 A4 C5 Eb5 E5 G5 A5 C6 Eb6 E6:1.5@.85', { start: 1 })), { bpm: 84, pedal: [[0, 3.9], [4, 8]] }),
      X('Sweet 6ths fill', merge(P([['F', 4], ['C/E', 4]], { style: 'bass' }), L('[A4,F5]:.5 [G4,E5] [F4,D5] [E4,C5] [D4,Bb4] [C4,A4] [Bb3,G4]:1 [C4,A4]:.5 [Bb4,G5] [A4,F5] [G4,E5] [F4,D5] [E4,C5]:2')), { bpm: 84, pedal: [[0, 3.9], [4, 8]] }),
      X('Diminished run into the 2', merge(L('C#4:1/4 E4 G4 Bb4 C#5 E5 G5 Bb5 C#6:1', { vel: .75 }), P([['Dm9', 4]], { style: 'gospel', start: 3 })), { bpm: 72, pedal: [[0, 2.9], [3, 7]] }),
    ],
    exercise: { type: 'notes', prompt: 'Play the gospel blues scale from G: G A C E♭ E G.', targets: 'G A C Eb E G' },
    creative: ['After each line of a hymn, answer with a 2-beat fill. Never repeat the same fill twice.', 'Record a run at 60 bpm, then 80, then 100.'],
  },
  {
    id: 'g-shout', stage: 'gospel', title: 'Shout Music & Stacked Chords', min: 16,
    keywords: ['shout', 'praise break', 'gospel', 'stacked chords', 'polychords', 'up tempo'],
    summary: 'Up-tempo shout patterns: octave bass on the beat, chords on the offbeat, stacked colours.',
    body: `
<p><b>Shout music</b> (praise break) is fast and driving. The engine: <b>left hand octaves on every beat</b>, <b>right hand
chord stabs on the offbeats</b> (the “&”). Blues dominants (C7, F7, G7) with ♯9s and stacked triads add grit.</p>
<p><b>Stacked chords</b>: a triad over another triad. E♭ over C = C7♯9 sound; B♭ over C = C9sus. Gospel players stack for big,
modern colours.</p>
<p><b>Practise</b> the hands separately at 100 bpm until the offbeat feels automatic, then push to 140+.</p>`,
    examples: [
      X('Shout pattern', repeat(P(['C7#9', 'F9', 'C7#9', 'G7#9'].map(s => [s, 4]), { style: 'gospel', lh: QUARTERS.map(([o, d, a]) => [o, 0.45, a]), rh: [[0.5, 0.3], [1.5, 0.3, 1.1], [2.5, 0.3], [3.5, 0.3, 1.1]] }), 2, 16), { bpm: 140 }),
      X('Stacked triads', P([['Eb|C7', 4], ['Bb|C', 4], ['Ab|Bb', 4], ['F|G', 4], ['C69', 4]], { style: 'root' }), { bpm: 70, pedal: 'chord' }),
    ],
    exercise: { type: 'chords', prompt: 'Play C7♯9, then F9, then G7♯9.', targets: ['C7#9', 'F9', 'G7#9'] },
    creative: ['Build a 4-bar shout vamp in F with your own stacked-triad colours.'],
  },
  {
    id: 'g-hymn', stage: 'gospel', title: 'Reharmonizing a Hymn', min: 20,
    keywords: ['hymn', 'reharmonization', 'gospel', 'amazing grace', 'arranging', 'melody'],
    summary: 'Turn a simple hymn into a gospel arrangement: same melody, richer harmony.',
    body: `
<p>“Amazing Grace” (public domain) in C, 3/4 time. Hear the <b>basic hymn chords</b>, then a <b>gospel reharmonization</b> that uses:</p>
<ul><li>6/9 and maj9 colours instead of triads</li><li>C/E to F69 (bass walk-up), F♯°7 passing chord</li>
<li>A7♭9 → Dm9 (secondary dominant), backdoor B♭9</li><li>A sus dominant to end the phrase</li></ul>
<p>Every new chord still contains the melody note. Check each one with the chord detector by holding the chord and melody together.</p>`,
    examples: [
      X('Basic hymn harmony', merge(P([['C', 1], ['C', 3], ['C', 3], ['F', 3], ['C', 3], ['C', 3], ['C', 3], ['G', 3]], { style: 'root' }), L('G5:1 C6:2 E6:.5 C6:.5 E6:2 D6:1 C6:2 A5:1 G5:2 G5:1 C6:2 E6:.5 C6:.5 E6:2 D6:1 G6:3', { vel: .85 })), { bpm: 84, pedal: 'chord' }),
      X('Gospel reharmonization', merge(P([['G9sus4', 1], ['C69', 3], ['C/E', 3], ['F69', 2], ['F#dim7', 1], ['C/G', 2], ['A7b9', 1], ['Dm9', 3], ['Fmaj9', 2], ['Bb9', 1], ['G13sus4', 3]], { style: 'gospel' }), L('G5:1 C6:2 E6:.5 C6:.5 E6:2 D6:1 C6:2 A5:1 G5:2 G5:1 C6:2 E6:.5 C6:.5 E6:2 D6:1 G6:3', { vel: .85 })), { bpm: 76, pedal: 'chord' }),
    ],
    exercise: { type: 'free', prompt: 'Play the melody with your right hand on top and your own reharmonization underneath. Record it.' },
    creative: ['Reharmonise the second half of the hymn using a 3-6-2-5-1 at the end.'],
  },

  // ============================================================ VI. GENRES
  {
    id: 'j-comping', stage: 'genres', title: 'Jazz Comping Rhythms', min: 16,
    keywords: ['comping', 'accompaniment', 'charleston', 'swing', 'rhythm', 'jazz piano'],
    summary: 'Charleston, anticipations and off-beat stabs: support a soloist like a pro.',
    body: `
<p><b>Comping</b> (accompanying) is conversation, not wallpaper. Core rhythms (swing feel):</p>
<ul><li><b>Charleston</b>: beat 1 + the “& of 2”.</li><li><b>Reverse Charleston</b>: the “& of 1” + beat 3.</li>
<li><b>Anticipation</b>: hit the next chord on the “& of 4” before it arrives.</li><li><b>Off-beat stabs</b>: short chords on “&2” and “&4”.</li></ul>
<p>Leave space. Respond to the soloist, and mix long and short durations. Use rootless voicings so you stay out of the bass player’s register.</p>`,
    examples: [
      X('Charleston on ii–V–I', merge(repeat(P(['Dm9', 'G13', 'Cmaj9', 'Cmaj9'], { style: 'rootless', rh: CHARLESTON }), 2, 16), repeat(W(['Dm7', 'G7', 'Cmaj7', 'Cmaj7']), 2, 16)), { bpm: 140, swing: 1 }),
      X('Off-beat stabs', merge(repeat(P(['Dm9', 'G13', 'Cmaj9', 'A7b9'], { style: 'rootless', rh: OFFBEATS }), 2, 16), repeat(W(['Dm7', 'G7', 'Cmaj7', 'A7']), 2, 16)), { bpm: 150, swing: 1 }),
      X('Anticipations (“& of 4”)', merge(P([['Dm9', 3.5], ['G13', 4], ['Cmaj9', 4], ['A7b9', 4], ['Dm9', 0.5]], { style: 'rootless', rh: [[0, 0.5], [2, 0.4, 0.85]] }), W(['Dm7', 'G7', 'Cmaj7', 'A7'])), { bpm: 140, swing: 1 }),
    ],
    exercise: { type: 'free', prompt: 'Record 16 bars of comping on Dm9 – G13 – Cmaj9 using at least three different rhythms.' },
    creative: ['Sing a melody and comp around it. Play only when you are not singing.'],
  },
  {
    id: 'j-walking', stage: 'genres', title: 'Walking Bass Lines', min: 16,
    keywords: ['walking bass', 'bass line', 'left hand', 'jazz', 'trio'],
    summary: 'Four-to-the-bar bass lines: roots, chord tones and chromatic approaches.',
    body: `
<p>A walking line plays quarter notes. A simple, reliable recipe for each bar:</p>
<ol><li><b>Beat 1</b>: root of the chord.</li><li><b>Beats 2–3</b>: chord tones (3, 5) or scale steps.</li>
<li><b>Beat 4</b>: <b>chromatic approach</b> to the next root (a half step above or below).</li></ol>
<p>Then add the right hand: rootless voicings in Charleston rhythm on top of the walking left hand is the classic
<b>solo jazz piano “two-handed trio”</b> texture.</p>`,
    examples: [
      X('Walking ii–V–I', repeat(W(['Dm7', 'G7', 'Cmaj7', 'A7']), 2, 16), { bpm: 120, swing: 1 }),
      X('Walking + comping', merge(repeat(W(['Dm7', 'G7', 'Cmaj7', 'A7']), 2, 16), repeat(P(['Dm9', 'G13', 'Cmaj9', 'A7b9'], { style: 'rootless', rh: CHARLESTON }), 2, 16)), { bpm: 132, swing: 1 }),
      X('Walking the F blues', W(['F7', 'Bb7', 'F7', 'Cm7', 'Bb7', 'Bdim7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'C7']), { bpm: 132, swing: 1 }),
    ],
    exercise: { type: 'free', prompt: 'Record a walking line over Dm7 – G7 – Cmaj7 – A7, ending each bar with a chromatic approach note.' },
    creative: ['Walk a bass line and hum the melody of a tune you know on top.'],
  },
  {
    id: 'j-blues', stage: 'genres', title: 'The Blues: 12-Bar, Jazz & Minor', min: 20,
    keywords: ['blues', '12 bar', 'shuffle', 'boogie', 'blues scale', 'minor blues', 'jazz blues'],
    summary: 'From shuffle blues to jazz blues and minor blues, plus blues-scale language.',
    body: `
<p><b>12-bar blues</b> in F: | F7 | B♭7 | F7 | F7 | B♭7 | B♭7 | F7 | F7 | C7 | B♭7 | F7 | C7 |. Every chord is a dominant 7: that’s the blues sound.</p>
<p><b>Jazz blues</b> adds movement: | F7 | B♭7 | F7 | Cm7 F7 | B♭7 | B°7 | F7 | D7 | Gm7 | C7 | F7 D7 | Gm7 C7 |.</p>
<p><b>Minor blues</b>: | Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | A♭7 | G7♯9 | Cm7 | G7♯9 |.</p>
<p><b>Language</b>: blues scale (1 ♭3 4 ♭5 5 ♭7), slide ♭3 → 3 (grace notes), repeated riffs (call & response).</p>`,
    examples: [
      X('Shuffle blues in F (boogie left hand)', shuffleLH(['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'F7', 'C7', 'Bb7', 'F7', 'C7']), { bpm: 120, swing: 1 }),
      X('Jazz blues: walking + rootless', merge(W(['F7', 'Bb7', 'F7', ['Cm7', 2], ['F7', 2], 'Bb7', 'Bdim7', 'F7', 'D7', 'Gm7', 'C7', ['F7', 2], ['D7', 2], ['Gm7', 2], ['C7', 2]]), P(['F13', 'Bb13', 'F13', ['Cm9', 2], ['F13', 2], 'Bb13', 'Bdim7', 'F13', 'D7b9', 'Gm9', 'C13', ['F13', 2], ['D7b9', 2], ['Gm9', 2], ['C13', 2]], { style: 'rootless', rh: CHARLESTON })), { bpm: 132, swing: 1 }),
      X('Blues-scale riff (call & response)', merge(L('C5:.5 Eb5 F5 Gb5 G5:1 r:1 Bb4:.5 C5:1.5 r:2 C5:.5 Eb5 F5 Gb5 G5 Bb5 G5 F5 Eb5:.5 C5:3', { vel: .8 }), P([['F7', 4], ['F7', 4], ['Bb7', 4]], { style: 'shell' })), { bpm: 110, swing: 1 }),
    ],
    alternates: [
      { title: 'Minor blues', why: 'Darker cousin: minor i and iv, with a ♭VI7 → V7 at the end.', ex: X('C minor blues', P(['Cm9', 'Cm9', 'Cm9', 'Cm9', 'Fm9', 'Fm9', 'Cm9', 'Cm9', 'Ab13', 'G7#9', 'Cm9', 'G7#9'], { style: 'root+rootless', rh: CHARLESTON }), { bpm: 120, swing: 1 }) },
    ],
    exercise: { type: 'chords', prompt: 'Play the three blues chords in F: F7, B♭7, C7.', targets: ['F7', 'Bb7', 'C7'] },
    creative: ['Improvise a 2-bar riff and repeat it through the whole 12-bar form, adapting a note when the chord changes.'],
  },
  {
    id: 'j-bossa', stage: 'genres', title: 'Bossa Nova', min: 16,
    keywords: ['bossa nova', 'brazilian', 'latin', 'bossa', 'samba', 'groove'],
    summary: 'The Brazilian groove: root–fifth bass and syncopated chord patterns, played straight.',
    body: `
<p>Bossa nova is played with <b>straight</b> (not swung) eighths and a relaxed, soft touch.</p>
<ul><li><b>Left hand</b>: root (beat 1) → 5th (beat 3) with pick-ups on the “& of 2” and the “& of 4”: a gentle dotted pulse like a surdo drum.</li>
<li><b>Right hand</b>: rootless chords in a 2-bar syncopated pattern (a 3-3-2 feel), alternating on-beat and off-beat bars.</li>
<li>Typical harmony: maj7/maj9, m9, 13, 7♭9 with smooth half-step movement.</li></ul>`,
    examples: [
      X('Bossa groove', bossa(['Cmaj9', 'Cmaj9', 'Dm9', 'G13', 'Em9', 'A7b9', 'Dm9', 'G13']), { bpm: 128 }),
      X('Chromatic bossa progression', bossa(['Dm9', 'Db13', 'Cmaj9', 'Cmaj9', 'Fmaj9', 'Bb13', 'Em9', 'A7b9']), { bpm: 128 }),
    ],
    exercise: { type: 'free', prompt: 'Record 8 bars of the bossa bass pattern alone, then add the right-hand rhythm.' },
    creative: ['Write your own 8-bar bossa progression using half-step movement between chords.'],
  },
  {
    id: 'j-neosoul', stage: 'genres', title: 'Neo-Soul & R&B Harmony', min: 16,
    keywords: ['neo soul', 'r&b', 'rnb', 'soul', 'minor 11', 'chords', 'groove'],
    summary: 'm9 / m11 / maj9♯11 colours, chromatic slides and a lazy, behind-the-beat feel.',
    body: `
<p>Neo-soul borrows jazz voicings and gospel movement, then slows down and lays back.</p>
<ul><li><b>Colours</b>: m11, maj9♯11, 9sus, 7♯9, 13. Stacked 4ths and clusters in the right hand.</li>
<li><b>Slides</b>: approach a chord from a half step above or below with the same shape.</li>
<li><b>Feel</b>: light swing (about 30–50%), ghost notes and chords played slightly behind the beat.</li></ul>`,
    examples: [
      X('Neo-soul progression', repeat(P(['Dbmaj9', 'C7#9', 'Fm11', 'Bbm9'].map(s => [s, 4]), { style: 'gospel', rh: [[0, 1.4], [1.75, 0.5, 0.7], [2.5, 1.4, 0.9]], lh: [[0, 2.5], [2.75, 1.2, 0.8]] }), 2, 16), { bpm: 78, swing: 0.4, pedal: 'chord' }),
      X('Half-step slides', P([['Ebm11', 0.5], ['Dm11', 3.5], ['Abmaj9', 0.5], ['Gmaj9', 3.5], ['F#m11', 0.5], ['Fm11', 3.5], ['Bb9sus4', 4]], { style: 'gospel' }), { bpm: 78, swing: 0.4 }),
    ],
    exercise: { type: 'chords', prompt: 'Play D♭maj9 – C7♯9 – Fm11 – B♭m9.', targets: ['Dbmaj9', 'C7#9', 'Fm11', 'Bbm9'] },
    creative: ['Loop a 2-chord neo-soul vamp (e.g. Fm11 – B♭9) and develop it rhythmically for 3 minutes.'],
  },
  {
    id: 'j-latin', stage: 'genres', title: 'Latin Montuno & Salsa Piano', min: 14,
    keywords: ['latin', 'montuno', 'salsa', 'afro cuban', 'tumbao', 'clave'],
    summary: 'Syncopated octave montunos and the anticipated tumbao bass.',
    body: `
<p>A <b>montuno</b> is a repeating, syncopated piano riff, usually played in <b>octaves</b> with chord tones filled in, locked to the <b>clave</b>.</p>
<p>The <b>tumbao</b> bass anticipates: it plays on the “& of 2” and on beat 4, rarely on beat 1. That anticipation is what makes the groove float.</p>
<p>Classic harmony: I – IV – V – IV (C – F – G7 – F) or ii – V (Dm7 – G7) vamps.</p>`,
    examples: [
      X('Montuno over C – F – G7 – F', merge(
        repeat(L('[C4,E4,C5]:.5 [G4]:.5 [E4,C5]:.5 [C4,G4]:.5 [C4,E4,C5]:.5 [A4]:.5 [F4,C5]:.5 [C4,A4]:.5 [B3,D4,B4]:.5 [G4]:.5 [D4,B4]:.5 [B3,F4]:.5 [C4,F4,C5]:.5 [A4]:.5 [F4,C5]:.5 [C4,A4]:.5', { vel: .7 }), 2, 8),
        repeat(L('r:1.5 G2:1 C2:1.5 r:1.5 C3:1 F2:1.5', { hand: 'lh', vel: .8 }), 2, 8)), { bpm: 180 }),
    ],
    exercise: { type: 'free', prompt: 'Record a 2-bar montuno over Dm7 – G7 in octaves.' },
    creative: ['Displace the montuno by one eighth note and hear how the groove changes.'],
  },
  {
    id: 'j-stride', stage: 'genres', title: 'Stride & Ragtime Left Hand', min: 14,
    keywords: ['stride', 'ragtime', 'left hand', 'oom pah', 'boogie', 'early jazz'],
    summary: 'Bass on 1 & 3, chords on 2 & 4: the original solo-piano engine.',
    body: `
<p><b>Stride</b> (Harlem stride, ragtime) makes the left hand a full rhythm section: <b>low bass note (or octave/10th) on beats 1 & 3</b>,
<b>mid-register chord on 2 & 4</b>. The jumps are big, so practise with the eyes on the bass target and let the chord be felt.</p>
<p>It pairs perfectly with secondary-dominant chains (I – VI7 – II7 – V7).</p>`,
    examples: [
      X('Stride: I – VI7 – II7 – V7', repeat(stride(['C', 'A7', 'D7', 'G7']), 2, 16), { bpm: 140, swing: 0.6 }),
      X('Stride + melody', merge(stride(['C', 'C', 'A7', 'A7', 'D7', 'G7', 'C', 'G7']), L('E5:1.5 G5:.5 E5:1 C5:1 E5:1.5 G5:.5 C6:2 C#6:1.5 A5:.5 G5:1 E5:1 A5:2 r:2 F#5:1.5 A5:.5 D6:2 F5:1.5 B4:.5 D5:2 C5:4 r:4', { vel: .82 })), { bpm: 140, swing: 0.6 }),
    ],
    exercise: { type: 'free', prompt: 'Record 8 bars of stride on C – A7 – D7 – G7. Bass notes on 1 & 3, chords on 2 & 4.' },
    creative: ['Replace every bass note on beat 3 with a 10th (root + 3rd an octave up) if your hand can reach.'],
  },

  // ============================================================ VII. RHYTHM
  {
    id: 'rh-displacement', stage: 'rhythm', title: 'Rhythmic Displacement', min: 14,
    keywords: ['rhythmic displacement', 'displacement', 'rhythm', 'syncopation', 'motif'],
    summary: 'Same notes, shifted in time: instantly new phrases from old ideas.',
    body: `
<p><b>Displacement</b> moves a motif earlier or later by an eighth, a quarter or a triplet, without changing the notes.
The ear hears new accents and new chord relationships.</p>
<ul><li>Start with a 1-bar motif on beat 1, then start it on the “& of 1”, then on beat 2.</li>
<li><b>Grouping</b>: repeat a 3-note group in straight eighths over 4/4. It realigns every 3 beats, a built-in displacement cycle.</li></ul>`,
    examples: [
      X('Motif on 1 → & of 1 → beat 2', merge(L('C5:.5 E5 G5 A5:2.5 r:4 r:.5 C5:.5 E5 G5 A5:2 r:4 r:1 C5:.5 E5 G5 A5:1.5', { vel: .8 }), L('C3:1 G3 C3 G3 C3 G3 C3 G3 C3 G3 C3 G3 C3 G3 C3 G3 C3 G3 C3 G3', { hand: 'lh', vel: .5 })), { bpm: 100 }),
      X('3-note grouping over 4/4', merge(L('C5:.5 E5 G5 C5 E5 G5 C5 E5 G5 C5 E5 G5 C5 E5 G5 C5 E5 G5 C5 E5 G5 C5 E5 G5 C6:2', { vel: .72 }), L('C3:1 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3:2', { hand: 'lh', vel: .55 })), { bpm: 110, desc: 'Listen for the accent (C) landing in a new place every beat and a half.' }),
    ],
    exercise: { type: 'free', prompt: 'Record a 4-note motif three times: on beat 1, on the “& of 1”, then on beat 2.' },
    creative: ['Displace a comping pattern by a triplet eighth for a “behind the beat” neo-soul feel.'],
  },
  {
    id: 'rh-poly', stage: 'rhythm', title: 'Polyrhythms: 3:2, 4:3, 5:4', min: 16,
    keywords: ['polyrhythm', 'polyrhythms', 'cross rhythm', '3 against 2', '3 against 4', 'independence'],
    summary: 'Two pulses at once: hand independence and hypnotic textures.',
    body: `
<p>A <b>polyrhythm</b> plays two even pulses in the same span: 3 notes in one hand against 2 in the other.</p>
<ul><li><b>3:2</b>: say “<i>nice cup-of tea</i>”: both hands on “nice”, RH on “cup”, LH on “of”, RH on “tea”.</li>
<li><b>4:3</b>: say “<i>pass the golden butter</i>”.</li>
<li>Use them in arpeggios (triplets over straight bass), in comping, and in Afro-Cuban and gospel grooves.</li></ul>
<p>Open the <b>Rhythm Lab</b> to loop any ratio with a visual circle.</p>`,
    examples: [
      X('3 against 2', poly(3, 2, { len: 2, reps: 4, noteA: N('G5'), noteB: N('C3') }), { bpm: 70 }),
      X('4 against 3', poly(4, 3, { len: 3, reps: 3, noteA: N('E5'), noteB: N('C3') }), { bpm: 60 }),
      X('Musical 3:2: triplet arpeggios over eighths', merge(L('C4:1/3 E4 G4 C5 G4 E4 D4 F4 A4 D5 A4 F4 E4 G4 B4 E5 B4 G4 C4 E4 G4 C5:2', { vel: .65 }), L('C2:.5 G2 C3 G2 D2 A2 D3 A2 E2 B2 E3 B2 C2:2', { hand: 'lh', vel: .6 })), { bpm: 60, pedal: [[0, 1.95], [2, 3.95], [4, 5.95], [6, 8]] }),
    ],
    exercise: { type: 'free', prompt: 'Record 3:2 at a slow tempo: left hand plays 2 even notes while the right plays 3.' },
    creative: ['Comp a ii–V–I where the right hand plays dotted quarters (3 over 2) against a walking bass.'],
  },
  {
    id: 'rh-hemiola', stage: 'rhythm', title: 'Hemiola & Cross-Rhythm Comping', min: 12,
    keywords: ['hemiola', 'cross rhythm', 'dotted quarter', 'comping', 'rhythm'],
    summary: 'Three-beat groupings across two bars: from Brahms to modern jazz comping.',
    body: `
<p><b>Hemiola</b>: two bars of 3/4 felt as three bars of 2/4 (or 3 against 2 at the bar level). Classical composers used it at cadences.
In jazz, <b>dotted-quarter comping</b> (a chord every 1.5 beats) floats across the bar line until it realigns after 3 bars.</p>`,
    examples: [
      X('Dotted-quarter comping', merge(P(['Dm9', 'Dm9', 'Dm9', 'G13', 'G13', 'G13', 'Cmaj9', 'Cmaj9'].map(s => [s, 1.5]), { style: 'rootless', rh: [[0, 1.2]] }), W(['Dm7', 'G7', 'Cmaj7'])), { bpm: 120, swing: 0.8 }),
      X('Classical hemiola cadence (3/4)', L('[C3,E4,C5]:1 [G3,E4,C5]:1 [G3,E4,C5]:1 [F3,F4,A4]:2 [G3,F4,B4]:2 [G2,D4,B4]:2 [C3,E4,C5]:3'), { bpm: 120, desc: 'The last bars feel like 3 groups of 2 beats across two 3/4 bars.' }),
    ],
    exercise: { type: 'free', prompt: 'Record chords every dotted quarter for 3 bars of 4/4. Count aloud to feel them land back on beat 1.' },
    creative: ['Combine hemiola comping with a walking bass in the left hand.'],
  },

  // ============================================================ VIII. MELODY
  {
    id: 'm-guide', stage: 'melody', title: 'Guide-Tone Lines', min: 14,
    keywords: ['guide tones', 'voice leading', 'melody', 'improvisation', 'thirds and sevenths'],
    summary: 'A melody made of 3rds and 7ths that outlines any progression.',
    body: `
<p>Connect the <b>3rds and 7ths</b> of each chord by the smallest step: you get a melody that “plays the changes” by itself.</p>
<p>On ii–V–I: F (♭3 of Dm7) → F (♭7 of G7) → E (3 of C): common tone, then a half step. Embellish the guide-tone line with
rhythm and approach notes and you are improvising.</p>`,
    examples: [
      X('Guide-tone line on a cycle', merge(P(['Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', ['Am7', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'bass' }), L('F4:2 F4 E4 E4 D4 D4 C4:4', { vel: .85 }), L('C5:2 B4 B4 A4 A4 G#4 G4:4', { vel: .7 })), { bpm: 80 }),
      X('Embellished guide tones', merge(P(['Dm7', 'G7', ['Cmaj7', 4]].map(s => Array.isArray(s) ? s : [s, 4]), { style: 'shell' }), L('A4:.5 G4 F4:1 r:.5 E4:.5 D4 F4 A4 G4 F4:1.5 Ab4:.5 G4 E4:3', { vel: .82 })), { bpm: 110, swing: 1 }),
    ],
    exercise: { type: 'notes', prompt: 'Play the guide-tone line F – F – E (ii–V–I in C), then C – B – B.', targets: 'F F E C B B' },
    creative: ['Improvise over ii–V–I but land on a guide tone on beat 1 of every bar.'],
  },
  {
    id: 'm-enclosures', stage: 'melody', title: 'Enclosures, Approach Notes & Bebop Scales', min: 18,
    keywords: ['enclosure', 'approach notes', 'bebop', 'bebop scale', 'chromatic', 'lines', 'improvisation'],
    summary: 'Surround target notes chromatically and keep chord tones on the beat.',
    body: `
<p><b>Approach notes</b>: hit a target chord tone from a half step below or a scale step above.</p>
<p><b>Enclosure</b>: surround the target from above and below before landing (F – D♯ – <b>E</b>). It is the bebop signature.</p>
<p><b>Bebop scales</b> add one chromatic passing tone so that, in eighth notes, <b>chord tones fall on the downbeats</b>:
<br>G bebop dominant: G A B C D E F F♯ (descend from G: G F♯ F E D C B A).</p>`,
    examples: [
      X('Enclosures into chord tones', merge(P([['Cmaj7', 8]], { style: 'shell' }), L('F4:.5 D#4 E4:1 r:.5 A4:.5 F#4 G4:1 r:.5 C5:.5 A#4 B4:1 r:.5 D5:.5 B4 C5:2', { vel: .8 })), { bpm: 110, swing: 1 }),
      X('Bebop dominant descending', merge(P([['G7', 4], ['Cmaj7', 4]], { style: 'shell' }), L('G5:.5 F#5 F5 E5 D5 C5 B4 A4 G4:.5 E4 G4 B4 D5:2', { vel: .8 })), { bpm: 120, swing: 1 }),
      X('A ii–V–I line', merge(P(ii_V_I, { style: 'shell' }), L('F4:.5 A4 C5 E5 D5 C5 A4 F4 F4 E4 D4 F4 Ab4 G4 F4 D#4 E4:1.5 G4:.5 B4 D5 C5:1 r:4', { vel: .82 })), { bpm: 132, swing: 1 }),
    ],
    exercise: { type: 'notes', prompt: 'Play the enclosure into E: F – D♯ – E, then into G: A – F♯ – G.', targets: 'F D# E A F# G' },
    creative: ['Pick a target note on each chord of a ii–V–I and enclose it. Then connect them with scale steps.'],
  },
  {
    id: 'm-sequence', stage: 'melody', title: 'Sequences & Motif Development', min: 16,
    keywords: ['sequence', 'sequences', 'motif', 'development', 'patterns', 'melody', 'composition'],
    summary: 'Repeat a motif on new pitches; vary it with inversion, augmentation and displacement.',
    body: `
<p>A <b>sequence</b> repeats a melodic idea starting on different notes: diatonically (inside the key) or exactly (transposed).</p>
<ul><li><b>1-2-3-5</b> pattern through chords: D-E-F-A (Dm7), G-A-B-D (G7), C-D-E-G (Cmaj7).</li>
<li><b>Development tools</b>: repetition, <b>inversion</b> (flip the direction), <b>augmentation</b> (double the note values), <b>fragmentation</b>, <b>displacement</b>.</li></ul>
<p>Sequences give improvised solos structure and are a classical composition staple.</p>`,
    examples: [
      X('Diatonic sequence in C', L('C4:.5 D4 E4 G4 D4 E4 F4 A4 E4 F4 G4 B4 F4 G4 A4 C5 G4 A4 B4 D5 A4 B4 C5 E5 B4 C5 D5 F5 C5:2'), { bpm: 120 }),
      X('1-2-3-5 through ii–V–I', merge(P(ii_V_I, { style: 'shell' }), L('D5:.5 E5 F5 A5 F5 E5 D5 C5 G4 A4 B4 D5 B4 A4 G4 F4 C5 D5 E5 G5 E5:2 r:2', { vel: .8 })), { bpm: 132, swing: 1 }),
      X('Motif development', L('C5:.5 E5 G5:1 r:2 G5:.5 E5 C5:1 r:2 C5:1 E5 G5:2 r:4 r:.5 C5:.5 E5 G5:1 r:1.5 C6:4', { vel: .8 }), { bpm: 100, desc: 'Motif → inversion → augmentation → displacement & octave.' }),
    ],
    exercise: { type: 'notes', prompt: 'Play the 1-2-3-5 pattern on D, G, then C.', targets: 'D E F A G A B D C D E G' },
    creative: ['Invent a 3-note motif and sequence it through the Cycle of Shells progression.'],
  },
  {
    id: 'm-lines', stage: 'melody', title: 'Building Melodic Lines & Improvisation', min: 18,
    keywords: ['improvisation', 'soloing', 'lines', 'melody', 'call and response', 'target notes', 'licks'],
    summary: 'Target notes, call & response and phrase shape: a step-by-step improvisation method.',
    body: `
<ol><li><b>Target</b>: choose a chord tone for beat 1 of each bar (3rds and 7ths are strongest).</li>
<li><b>Connect</b>: get there with scale steps, arpeggios or enclosures.</li>
<li><b>Shape</b>: phrases breathe. Play 2 bars, rest 2 bars (<b>call & response</b>).</li>
<li><b>Vary</b>: transpose, displace or answer your own phrase.</li>
<li><b>Language</b>: learn short phrases from recordings and lessons. Transpose them to all keys.</li></ol>`,
    examples: [
      X('Call & response over a vamp', merge(repeat(P([['Dm9', 4], ['G13', 4]], { style: 'rootless', rh: CHARLESTON }), 2, 8), L('A4:.5 C5 D5 F5 E5:1 r:3 r:.5 E5:.5 D5 C5 A4:1 G4:.5 F4:1.5 r:2 D5:.5 F5 A5 C6 B5:1 G5 F5:1 r:3 F5:.5 E5 D5 C5 B4 C5 D5:1', { vel: .8 }), repeat(W(['Dm7', 'G7']), 2, 8)), { bpm: 132, swing: 1 }),
      X('Arpeggio + scale + target', merge(P(ii_V_I, { style: 'shell' }), L('D4:.5 F4 A4 C5 E5 D5 C5 A4 B4 D5 F5 A5 G5 F5 D5 B4 C5:1 E5 G5 B5:1', { vel: .8 })), { bpm: 120, swing: 1 }),
    ],
    exercise: { type: 'free', prompt: 'Record 8 bars of call & response over Dm7 – G7: 2 bars of playing, 2 bars of rest.' },
    creative: ['Take one lick from a lesson video and play it in 3 keys.', 'Improvise using only 3 notes. Make it musical through rhythm.'],
  },

  // ============================================================ IX. CLASSICAL
  {
    id: 'c-cadences', stage: 'classical', title: 'Cadences & Four-Part Voice Leading', min: 18,
    keywords: ['cadences', 'voice leading', 'satb', 'four part', 'classical', 'harmony', 'chorale'],
    summary: 'Authentic, plagal, half and deceptive cadences in proper SATB voice leading.',
    body: `
<p><b>Cadences</b> are musical punctuation:</p>
<ul><li><b>Authentic</b> V(7) → I: full stop.</li><li><b>Plagal</b> IV → I: “Amen”.</li><li><b>Half</b> … → V: comma, question.</li><li><b>Deceptive</b> V → vi: surprise.</li></ul>
<p><b>Voice-leading rules</b> (SATB: soprano, alto, tenor, bass): keep common tones, move other voices by step, resolve the
leading tone up (B → C) and the 7th down (F → E), and avoid parallel 5ths and octaves between any two voices.</p>`,
    examples: [
      X('Authentic cadence I–IV–V–I', L('[C3,G3,E4,C5]:2 [F3,A3,F4,C5]:2 [G2,G3,D4,B4]:2 [C3,G3,E4,C5]:4'), { bpm: 66, pedal: [[0, 1.9], [2, 3.9], [4, 5.9], [6, 10]] }),
      X('V7 → I (7th resolves down)', L('[G2,F3,D4,B4]:2 [C3,E3,E4,C5]:4'), { bpm: 66 }),
      X('Deceptive cadence V → vi', L('[C3,G3,E4,C5]:2 [G2,D4,G4,B4]:2 [A2,C4,E4,C5]:4'), { bpm: 66 }),
      X('Half cadence: I – ii6 – V', L('[C3,G3,E4,C5]:2 [F3,A3,D4,D5]:2 [G2,G3,D4,B4]:4'), { bpm: 66 }),
    ],
    exercise: { type: 'chords', prompt: 'Play the authentic cadence C – F – G – C in four voices.', targets: ['C', 'F', 'G', 'C'] },
    creative: ['Harmonise the C major scale (soprano) in four parts, one chord per note.'],
  },
  {
    id: 'c-alberti', stage: 'classical', title: 'Alberti Bass & Accompaniment Patterns', min: 14,
    keywords: ['alberti bass', 'accompaniment', 'classical', 'mozart', 'waltz', 'left hand patterns'],
    summary: 'Alberti, waltz and broken-octave patterns from the Classical era.',
    body: `
<p><b>Alberti bass</b> breaks a chord into <b>low–high–middle–high</b> (C–G–E–G). It is the sound of the Classical style (Mozart, Haydn, Clementi):
a light, continuous texture under a singing melody.</p>
<ul><li><b>Waltz</b>: bass on 1, chord on 2 and 3 (3/4 time).</li><li><b>Broken octaves</b>: drive and excitement in fast movements.</li></ul>
<p>Keep the accompaniment <b>softer</b> than the melody. Watch the velocity colours in the roll.</p>`,
    examples: [
      X('Alberti bass + melody', merge(P(['C', 'G7/B', 'C', 'F', 'C/G', 'G7', ['C', 4]].map(s => Array.isArray(s) ? s : [s, 2]), { style: 'close', arp: { notes: 'all', step: 0.5, pattern: [0, 2, 1, 2] }, vel: 0.42 }).map(e => ({ ...e, n: e.n.map(n => n - 12), hand: 'lh' })),
        L('E5:1 G5 F5:.5 D5 B4:1 C5:.5 E5 G5 C6 A5:1 F5 E5:.5 D5 C5 E5 D5:2 C5:2', { vel: .8 })), { bpm: 112 }),
      X('Waltz accompaniment (3/4)', merge(...['C', 'G7', 'G7', 'C'].map((s, i) => P([[s, 3]], { style: 'root', start: i * 3, lh: [[0, 0.9]], rh: [[1, 0.6], [2, 0.6, 0.9]], vel: 0.5 })), L('G5:2 E5:1 F5:2 D5:1 B4:2 D5:1 C5:3', { vel: .8 })), { bpm: 132 }),
    ],
    exercise: { type: 'free', prompt: 'Record Alberti bass on C – G7 – C with a simple melody in the right hand.' },
    creative: ['Turn a pop progression (I–V–vi–IV) into a Classical-style piece with Alberti bass.'],
  },
  {
    id: 'c-arpeggios', stage: 'classical', title: 'Arpeggios, Broken Chords & Legato Pedaling', min: 14,
    keywords: ['arpeggios', 'broken chords', 'pedaling', 'legato pedal', 'romantic', 'technique'],
    summary: 'Flowing arpeggios across the hands and syncopated (legato) pedaling.',
    body: `
<p><b>Arpeggios</b> spread a chord over the keyboard. In Romantic music they pass between the hands to create a wash of sound.</p>
<p><b>Legato (syncopated) pedaling</b>: press the key of the new chord, <b>then</b> lift and re-press the pedal just after it.
This gives a seamless connection without blurring the two harmonies. Watch the pedal band reset at each chord in the roll.</p>
<p>Technique: thumb passes smoothly under, wrist stays relaxed, and the arm guides the hand horizontally.</p>`,
    examples: [
      X('C major arpeggio, 2 octaves', L('C4:1/4 E4 G4 C5 E5 G5 C6 G5 E5 C5 G4 E4 C4:1'), { bpm: 76 }),
      X('Romantic broken chords', P(['C', 'Am', 'F', 'G', 'Em', 'Am', 'Dm7', ['G7', 4], ['C', 4]].map(s => Array.isArray(s) ? s : [s, 4]), { style: 'root', arp: { notes: 'all', step: 0.5, pattern: [0, 1, 2, 3, 4, 3, 2, 1] } }), { bpm: 92, pedal: 'chord' }),
    ],
    exercise: { type: 'notes', prompt: 'Play a C major arpeggio up one octave: C E G C.', targets: 'C E G C' },
    creative: ['Play I–vi–IV–V as flowing arpeggios using legato pedaling. Make each chord change inaudible.'],
  },
  {
    id: 'c-romantic', stage: 'classical', title: 'Romantic Harmony: Neapolitan & Augmented 6th', min: 16,
    keywords: ['neapolitan', 'augmented sixth', 'chromatic harmony', 'romantic', 'classical', 'modulation'],
    summary: 'Expressive chromatic pre-dominants used by Chopin, Schubert and film composers.',
    body: `
<ul><li><b>Neapolitan (♭II6)</b>: in C minor, a D♭ major chord with F in the bass, moving to V. Dark and noble.</li>
<li><b>German augmented 6th</b>: A♭–C–E♭–F♯. A♭ falls and F♯ rises to G: the interval expands to an octave on V.
It sounds exactly like A♭7, the <b>tritone sub of D7</b>. Classical and jazz meet here.</li>
<li><b>Diminished 7th modulation</b>: any °7 can resolve to four different keys.</li></ul>`,
    examples: [
      X('Neapolitan: i – ♭II6 – V7 – i', L('[C3,G3,Eb4,C5]:2 [F3,Ab3,F4,Db5]:2 [G2,F3,D4,B4]:2 [C3,G3,Eb4,C5]:4'), { bpm: 66, pedal: [[0, 1.9], [2, 3.9], [4, 5.9], [6, 10]] }),
      X('German +6 → cadential 6/4 → V → i', L('[C3,G3,Eb4,C5]:2 [Ab2,C4,Eb4,F#4]:2 [G2,C4,Eb4,G4]:2 [G2,B3,D4,F4]:2 [C3,C4,Eb4,G4]:4'), { bpm: 66, pedal: [[0, 1.9], [2, 3.9], [4, 5.9], [6, 7.9], [8, 12]] }),
    ],
    exercise: { type: 'chords', prompt: 'Play the Neapolitan D♭/F, then G7, then Cm.', targets: ['Db/F', 'G7', 'Cm'] },
    creative: ['Use a Neapolitan chord in a minor-key gospel ballad. Notice how it works as a tritone-sub-flavoured pre-dominant.'],
  },
  {
    id: 'c-counterpoint', stage: 'classical', title: 'Counterpoint & Imitation', min: 14,
    keywords: ['counterpoint', 'canon', 'imitation', 'bach', 'two voice', 'independence', 'classical'],
    summary: 'Two independent voices: contrary motion, consonance and canons.',
    body: `
<p><b>Counterpoint</b> = independent melodies that sound good together. Basic principles:</p>
<ul><li>Prefer <b>contrary motion</b> (one voice up, the other down).</li><li>Strong beats use <b>consonances</b> (3rds, 6ths, octaves, 5ths).</li>
<li>Avoid parallel 5ths and octaves.</li><li><b>Imitation</b>: one voice states a motif, the other repeats it later. A <b>canon</b> is strict imitation.</li></ul>
<p>Counterpoint trains hand independence, which you need for stride, walking bass with comping and polyrhythms.</p>`,
    examples: [
      X('Contrary motion', merge(L('C5:1 D5 E5 F5 G5 F5 E5 D5 C5:2'), L('C4:1 B3 A3 G3 E3 F3 G3 B3 C4:2', { hand: 'lh' })), { bpm: 90 }),
      X('Two-voice canon (traditional round)', merge(
        L('C5:1 D5 E5 C5 C5 D5 E5 C5 E5 F5 G5:2 E5:1 F5 G5:2 G5:.5 A5 G5 F5 E5:1 C5 G5:.5 A5 G5 F5 E5:1 C5 C5 G4 C5:2 C5:1 G4 C5:2', { vel: .78 }),
        L('C4:1 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4:1 F4 G4:2 G4:.5 A4 G4 F4 E4:1 C4 G4:.5 A4 G4 F4 E4:1 C4 C4 G3 C4:2 C4:1 G3 C4:2', { start: 8, hand: 'lh', vel: .65 })), { bpm: 110 }),
    ],
    exercise: { type: 'free', prompt: 'Record a short canon: play a 2-bar motif in the right hand, then imitate it in the left hand 2 beats later.' },
    creative: ['Write a 4-bar melody, then add a second voice using only 3rds and 6ths with contrary motion.'],
  },
];

export function lessonById(id) { return LESSONS.find(l => l.id === id); }
export function lessonsInStage(stageId) { return LESSONS.filter(l => l.stage === stageId); }
