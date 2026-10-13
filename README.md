# Keystone · Piano Harmony Lab

An interactive app for learning and practising piano theory, jazz, black gospel and classical piano: structured
lessons, playable examples on an 88-key piano roll, MIDI keyboard input, real grand-piano sound and your own
course videos attached to each lesson.

## Run it

It's a static web app with no build step. Serve the folder and open it in **Chrome or Edge**. They support Web MIDI and
choosing an audio-interface output. Safari also works, but without MIDI.

```bash
npm start                     # serves on http://localhost:8080 and opens the browser
# or
python3 -m http.server 8080   # then open http://localhost:8080
```

Opening `index.html` directly from disk will not work, because the browser blocks module scripts and samples on `file://`.

## What's inside

**Learning path: 9 stages, 48 lessons, in order**

| Stage | Covers |
|---|---|
| I. Foundations | the 88 keys, intervals, major & minor scales, triads & inversions, swing & subdivision |
| II. Harmony Core | diatonic chords & numbers, 7ths, extensions & altered tensions, ii–V–I, modes, modal interchange |
| III. Voicings | shells, rootless A/B, drop 2 & spread, quartal / “So What”, upper-structure triads & poly chords, slash chords & pedal points |
| IV. Harmonic Motion & Reharmonization | secondary dominants, tritone subs, passing (diminished / chromatic) chords, turnarounds & transitions, reharm strategies |
| V. Black Gospel | church foundations, gospel 2-5-1 & 3-6-2-5-1, walk-ups, fills & runs, shout & stacked chords, hymn reharmonization |
| VI. Jazz & Genres | comping rhythms, walking bass, blues (shuffle / jazz / minor), bossa nova, neo-soul, Latin montuno, stride |
| VII. Rhythm Mastery | rhythmic displacement, polyrhythms (3:2, 4:3, 5:4), hemiola |
| VIII. Melody & Improvisation | guide-tone lines, enclosures & bebop scales, sequences & motif development, building lines |
| IX. Classical Piano | cadences & SATB voice leading, Alberti / waltz accompaniment, arpeggios & legato pedaling, Neapolitan & augmented 6ths, counterpoint |

Each lesson has a concept explanation, playable examples (play / loop / tempo / swing / transpose / show on keys),
**alternate suggestions** (substitutions you can hear side by side), an exercise that listens to your playing,
creative challenges and the matching videos and files from your library.

**Studio tools:** Chord Explorer (any chord × 15 voicing styles + substitutions in context), Scale Explorer
(22 scales/modes + diatonic chords), Reharm Lab (8 reharmonization techniques on any progression), Rhythm Lab
(polyrhythm clock + displacement grooves), Practice Room (live chord detector, timed chord drills, ear training).

**Piano dock:** 88-key keyboard (A0–C8) with velocity colours, sustain glow and theory markers; piano roll where
lesson notes fall onto the keys and your notes rise from them, with chord labels and a pedal band; a dynamics meter (pp–ff) with
history; a chord detector; recording with playback and `.mid` export.

## MIDI & audio interface

* Click **Connect MIDI** (top right) and allow access. Note on/off, velocity and the **sustain pedal (CC64)** are read
  from every input, or choose one in Settings. MIDI ports on an audio interface work the same way.
* **MIDI output:** send lesson examples to an external synth, digital piano or DAW.
* **Audio output:** in Chrome/Edge, pick your audio interface in Settings (“Show device names” reveals the labels).
* No MIDI keyboard? Click the keys, or play from the computer keyboard: `A W S E D F T G Y H U J K O L P ;`,
  `Z`/`X` octave, `C`/`V` velocity, **Space** = sustain, `R` = record, `Esc` = stop all.

## Your course videos & files

Open **Video & Materials → Connect folder** and choose your course folder. The app scans videos (MP4/MOV/WEBM),
PDFs, audio, MIDI files (they play on the 88-key roll), images and notes. It then:

* matches each file to lessons by its file and folder names (you can **Keep**, remove, or **Add to lesson** manually);
* **removes the connected folder's own name from every displayed title**, and any other words you list under “Hidden
  words in titles”;
* gives videos 0.5×–1.25× speed, A–B looping and picture-in-picture for practising along.

Files stay on your computer. Nothing is uploaded or committed. For a fixed, curated mapping, see [`media/README.md`](media/README.md).

## Colours & fonts

Seven colour schemes (Midnight Jazz, Sanctuary, Bossa Sunset, Neon Studio, Forest Blues, Ivory Concert, Daylight)
plus a custom accent colour, from the palette button. Typography uses **Avenir Next** (built into macOS/iOS), with
Nunito Sans as the closest free fallback on other systems.

## Project layout

```
index.html            app shell
css/styles.css        themes, layout, keyboard
js/app.js             routing, dock, lessons view, exercises, settings
js/lessons.js         the curriculum (stages, lessons, examples)
js/music.js           theory engine: chords, scales, voicings, voice leading, detection, reharmonization, MIDI files
js/piano.js           live playing, sustain, recording, sample-accurate example playback
js/audio.js           sampled grand piano (3 velocity layers) on Web Audio
js/keyboard.js        88-key keyboard
js/roll.js            piano-roll visualizer
js/midi.js            Web MIDI in/out
js/library.js         local folder library & lesson matching
js/tools.js           studio tools
samples/piano/        Salamander Grand Piano samples (CC-BY 3.0, see LICENSE.txt)
```

To add a lesson, append an object to `LESSONS` in `js/lessons.js`. The helpers `prog()`, `line()`, `walk()` and
`poly()` turn chord symbols and note strings into playable examples.

## Credits

Piano samples: *Salamander Grand Piano V3* by Alexander Holm, CC BY 3.0.
