'use strict';
// ---------- chiptune music: pulse lead + counter voice, pulse arpeggios, a triangle bass and noise drums ----------
// All tunes are original, written in the spirit of 8- and 16-bit RPG and beat 'em up soundtracks.
// Melodies: one string per bar of 16 tokens (or the part's `n` steps). A note like E5 starts a note, '-' holds it,
// '.' is a rest and '|' is ignored (it only helps the eye). Chords: one per bar; 'C G' splits a bar in halves.
// Chord symbols: root + optional m, dim, aug, sus2, sus4, 5, 7, m7, maj7, m7b5, and an optional /bass note.
//
// A track is either a single part (bpm, chords, lead, ...) or { parts: {A: {...}, B: {...}}, form: ['A', 'B', 'A+2'] },
// where '+2' / '-3' transposes that pass. Any setting may be given on a part, the track, or come from its style:
//   bpm, n (steps per bar, default 16), style, duty, lv (lead volume), harm (counter-melody bars) + hduty, hv,
//   double (a quieter copy of the lead at this interval), arp / bass (pattern strings, or arrays cycled per bar),
//   arpOct, arpDuty, av, bv, drums ({k,s,h,o,t,u,m,c} lanes, or an array cycled per bar), fill, fillEvery.
// Track-only: kit ('std', 'heavy', 'metal', 'soft'), swing (0..1 of a 16th, the off-beats lean late), echo (0..1 wet),
//   echoSteps, vib (lead vibrato in cents on long notes), vol, once.
// Arp patterns: digits pick chord tones counted up from the root an octave above the chord (0 root, 1 third, 2 fifth,
//   3 the next root for triads ...). Bass patterns: R root, O octave up, F fifth, V fifth below, T third, S seventh,
//   C a half step under the next chord's root. Drums: x hit, X accent, g ghost. '-' holds, '.' rests.
const MUS_STYLES = {
  calm:   { arp: '0---1---2---3---', bass: 'R-------R-------', drums: null },
  drive:  { arp: '0-2-4-2-0-2-4-2-', bass: 'RRRORRRORRRORRRO', drums: { k: 'x..x....x..x....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' } },
  mystic: { arp: '0123012334563456', bass: 'R--.F--.R--.F--.', drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' } },
  battle: { arp: '0123012301230123', bass: 'R-O-R-O-R-O-R-O-', drums: { k: 'x.....x.x.x.....', s: '....x.......x...', h: '.x.x.x.x.x.x.x.x' } },
  plain:  { arp: '0-1-2-3-0-1-2-3-', bass: 'R--.F--.R--.F--.', drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' } },
  creep:  { arp: '0..2..1..0..2.1.', bass: 'R..R..V.R..R..O.', drums: { k: 'x.......x.......', t: '......x.......x.', h: '..g...g...g...g.' }, fill: { t: '............x.xx' } },
  ambient:{ arp: '0---2---4---2---', bass: 'R---------------', drums: { k: 'x..g............' }, fill: false },
  tribal: { arp: '0--.....2--.....', bass: 'R--RR--.R--RO-V-', drums: { k: 'X.....x...x.....', s: '........X.......', t: '...x..x....x.x..', h: 'g...g...g...g...' }, fill: { t: '........x.x.xxxx', u: '.........x.x....' } },
  shuffle:{ arp: '..0...2...1...2.', bass: 'R...T...F...C...', drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.g.x.g.x.g.x.g.', m: '...........g....' }, fill: { s: '............x.xx' } },
  industrial: { arp: '0..1..2.0..1..2.', bass: 'R.R.RRR.R.R.RSO.', drums: { k: 'X..x..x...x..x..', m: '....x.......x...', h: '..g...g...g...g.' }, fill: { t: '............xxxx' } },
  march:  { arp: '0.2.1.2.0.2.1.2.', bass: 'R.RRR.RRR.RRO.OR', drums: { k: 'x...x...x...x...', s: '....x..x....x.xx', m: '..g...g...g...g.' }, fill: { s: '........xxxxxxxx' } },
  hymn:   { arp: '0-1-2-3-4-3-2-1-', bass: 'R-------O-------', drums: null },
  grand:  { arp: '0.....2.....1...', bass: 'R-------V-------',
            drums: [{ k: 'X.......x.x.....', s: '........X.......', c: 'x...............' }, { k: 'X.......x.x.....', s: '........X.......', t: '..............x.' }] },
  waltz:  { n: 12, arp: '....0-..2-..', bass: ['R---........', 'V---........'], drums: { k: 'x...........', s: '....g...g...', h: '..x...x...x.' }, fill: { u: '......x.x.xx' } },
};
const MUS_KITS = { // kick [from Hz, to Hz, decay s, vol], snare [band Hz, decay s, vol], hat vol
  std:   { k: [140, 40, .14, .55], s: [1800, .12, .32], h: .12 },
  heavy: { k: [115, 32, .24, .66], s: [1250, .16, .34], h: .1 },
  metal: { k: [150, 45, .12, .55], s: [2300, .09, .3], h: .11 },
  soft:  { k: [120, 42, .12, .36], s: [1500, .1, .18], h: .07 },
};

// the tunes; the bar helpers stay local so they can't clash with the game's globals
const TRACKS = (() => {
function W(n) { return n + ' -'.repeat(15); } // a note held for a whole 16-step bar
function H(a, b) { return a + ' -'.repeat(7) + ' ' + b + ' -'.repeat(7); } // two half notes
function R(n) { return '.' + ' .'.repeat((n || 16) - 1); } // a bar of rest

// shared bars
const BLOOM2_A = ['F#4 - - - . . C#5 - A4 - - - . . G#4 A4', 'C#5 - - - - - - - B4 - A4 - G#4 - F#4 -', 'A4 - - - D5 - - - F#5 - - - E5 - D5 -', 'C#5 - - - - - - - G#4 - - - E#4 - - -',
  'F#5 - - - . . A5 - G#5 - F#5 - E5 - C#5 -', 'D5 - - - F#5 - - - B5 - - - A5 - F#5 -', 'G5 - - - - - F#5 - D5 - - - B4 - G4 -', 'G#4 - - - B4 - - - E#5 - - - G#5 - - -'];
const BLOOM2_B = ['F#5 - - - E5 - D5 - C#5 - D5 - B4 - - -', 'C#5 - - - A4 - - - F#4 - G#4 - A4 - - -', 'B4 - D5 - F#5 - - - E5 - D5 - C#5 - B4 -', 'C#5 - - - - - - - . . . . G#4 - C#5 -',
  'D5 - - - F#5 - A5 - - - G#5 - A5 - F#5 -', 'E5 - - - C#5 - - - A4 - - - E5 - - -', 'D5 - - - C#5 - B4 - A#4 - B4 - D5 - - -', 'C#5 - - - E#5 - - - G#5 - - - B5 - A5 G#5'];
const BBOSS_A = [H('F5', 'Db5'), 'C5 - - - - - Db5 - Bb4 - - - - - - -', 'Bb4 - - - Db5 - - - Gb5 - - - - - - -', 'F5 - - - - - - - E5 - - - C5 - - -',
  'Db5 - - - F5 - - - Bb5 - - - - - - -', 'Ab5 - - - Gb5 - - - - - - - Eb5 - - -', 'Db5 - - - - - - - Bb4 - Db5 - Gb5 - - -', 'F5 - - - - - - - - - - - . . . .'];
const MOSS_A = ['C4 - - Eb4 - - F4 - G4 - - - - - Bb4 -', 'C5 - - Bb4 - - G4 - F4 - Eb4 - F4 - - -', 'Eb4 - - F4 - - Ab4 - C5 - - - Bb4 - Ab4 -', 'G4 - - - - - - - F4 - - - D4 - - -',
  'C4 - - Eb4 - - F4 - G4 - - - - - Bb4 -', 'C5 - - Eb5 - - F5 - G5 - - - F5 - Eb5 -', 'Eb5 - - - Bb4 - - - G4 - Bb4 - Eb5 - - -', 'F5 - - - Eb5 - C5 - Bb4 - - - G4 - - -'];
const TITLE_A = ['D5 - - - F5 - - - A5 - - - - - G5 -', 'F5 - - - - - D5 - Bb4 - - - - - - -', 'G4 - - - Bb4 - - - D5 - - - G5 - - -', 'E5 - - - - - - - C#5 - - - A4 - - -'];

return {
  // ---- menus ----
  title: { bpm: 84, style: 'calm', duty: .5, vib: 10, form: ['A', 'H', 'B'], parts: {
    A: { chords: ['Dm', 'Bb', 'Gm', 'A'], lead: TITLE_A },
    H: { chords: ['Dm', 'Bb', 'Gm', 'A'], lead: TITLE_A, harm: [H('A4', 'D5'), H('Bb4', 'F4'), H('D4', 'Bb4'), H('C#5', 'E4')] },
    B: { chords: ['Bb', 'C', 'Am', 'A'], lead: ['D5 - - - - - F5 - Bb5 - - - A5 - G5 -', 'G5 - - - - - E5 - C5 - - - - - - -', 'E5 - - - - - C5 - A4 - - - C5 - E5 -', 'A5 - - - - - - - G5 - - - E5 - C#5 -'],
         harm: [H('F4', 'D5'), H('E4', 'G4'), H('C5', 'A4'), H('C#5', 'A4')] } } },
  fallen: { bpm: 70, chords: ['Am', 'F', 'E', 'Am'], style: 'calm', duty: .5, once: true, vib: 10,
    lead: ['E5 - - - C5 - - - A4 - - - - - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -', 'B4 - - - G#4 - - - E4 - - - - - - -', 'A4 - - - - - - - - - - - . . . .'],
    harm: [H('C5', 'E4'), H('A4', 'F4'), H('G#4', 'B3'), 'C4 - - - - - - - - - - - . . . .'] },
  // F major in a rocking 12/8: each step is an eighth note
  forge: { bpm: 50, n: 12, vol: 1.15, style: 'calm', duty: .5, vib: 8, arp: '024024024024', arpDuty: .5, av: .05, bass: 'R-----F-----', bv: .24, form: ['A', 'B'], parts: {
    A: { chords: ['F', 'C/E', 'Dm', 'Bb', 'F', 'Gm7', 'C', 'C7'],
         lead: ['C5 - - A4 - C5 F5 - - - - -', 'E5 - D5 C5 - - G4 - - - - -', 'A4 - Bb4 C5 - D5 F5 - - E5 - D5', 'D5 - - - - - . . . C5 - D5',
                'C5 - - A4 - C5 F5 - - A5 - G5', 'F5 - - D5 - - Bb4 - - - - -', 'C5 - D5 E5 - F5 G5 - - - - -', 'E5 - - - - - Bb4 - - - - -'] },
    B: { chords: ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'F'],
         lead: ['D5 - - F5 - - Bb5 - - - - -', 'G5 - - - - - E5 - - C5 - -', 'C5 - - E5 - - A5 - - G5 - E5', 'F5 - - - - - D5 - - - - -',
                'Bb4 - - D5 - - G5 - - F5 - D5', 'E5 - - - - - G5 - - - - -', 'F5 - - - - - A4 - - C5 - -', 'F4 - - - - - - - - . . .'],
         harm: ['F4 - - Bb4 - - D5 - - - - -', 'C5 - - - - - G4 - - E4 - -', 'A4 - - C5 - - E5 - - E5 - C5', 'A4 - - - - - F4 - - - - -',
                'G4 - - Bb4 - - D5 - - D5 - Bb4', 'C5 - - - - - E5 - - - - -', 'C5 - - - - - F4 - - A4 - -', 'A3 - - - - - - - - . . .'] } } },

  // ---- world 1: Bloomwild Vale ----
  // G major, bright and striding, with a bVII (F) lift in the second half. Shuffled: eight-bar parts drawn at random
  // (A and A2 share chords with new contours, B and B2 the same for the lift, D a hushed breakdown that builds back)
  bloom: { bpm: 132, style: 'drive', duty: .25, vib: 12, shuffle: true,
    start: ['A', 'A', 'A2', 'D'],
    next: { A: ['B', 'B', 'B2', 'A2', 'D'], A2: ['B', 'B2', 'B2', 'D'], B: ['A', 'A', 'A2', 'B2', 'D'], B2: ['A', 'A2', 'A2', 'D'], D: ['A', 'A2', 'B'] },
    arr: [{}, {}, { duty: .125 }, { arpDuty: .25, av: .05 }],
    orn: { scale: [7, 9, 11, 0, 2, 4, 6], pass: .3, turn: .25, dv: .3, arpP: .35,
      dvar: [{ k: '..............x.' }, { h: '...............g' }, { k: '......x.........' }, { s: '.......g.......g' }],
      fills: [{ s: '............xxxx' }, { s: '........x.x.xxxx' }, { s: '............x.xx', k: '............x...' }, { t: '..........x.x.xx', s: '............x...' }],
      arps: ['0-2-4-2-3-2-4-2-', '0-2-3-2-4-3-2-1-', '0-1-2-4-2-1-0-2-'] },
    parts: {
      A: { chords: ['G', 'D/F#', 'Em', 'C', 'G', 'Bm', 'C', 'D'],
        lead: ['D5 - G5 - A5 - B5 - - - A5 - G5 - D5 -', 'F#5 - - - E5 - D5 - E5 - F#5 - A5 - - -', 'G5 - - - F#5 - E5 - B4 - - - E5 - G5 -', 'E5 - - - D5 - C5 - D5 - E5 - G5 - - -',
               'D5 - G5 - A5 - B5 - - - D6 - B5 - G5 -', 'F#5 - - - D5 - F#5 - B5 - A5 - F#5 - D5 -', 'E5 - G5 - C6 - B5 - A5 - G5 - E5 - C5 -', 'D5 - - - - - F#5 - A5 - - - C6 - B5 A5'] },
      A2: { chords: ['G', 'D/F#', 'Em', 'C', 'G', 'Bm', 'C', 'D'],
        lead: ['B5 - - - A5 - G5 - D5 - - - G5 - B5 -', 'A5 - - - F#5 - D5 - - - E5 - F#5 - A5 -', 'G5 - - - - - B5 - A5 - G5 - E5 - - -', 'E5 - G5 - C6 - - - B5 - G5 - E5 - D5 -',
               'D5 - - - G5 - B5 - D6 - - - B5 - G5 -', 'F#5 - - - B5 - - - D6 - - - B5 - A5 -', 'G5 - E5 - C5 - E5 - G5 - - - A5 - B5 -', 'C6 - - - B5 - A5 - - - F#5 - D5 - - -'] },
      B: { chords: ['C', 'D', 'Em', 'Em/D', 'C', 'D', 'F', 'D'],
        lead: ['E5 - - - - - - - G5 - - - E5 - C5 -', 'D5 - - - - - - - F#5 - A5 - - - F#5 -', 'G5 - - - - - - - B5 - - - A5 - G5 -', 'F#5 - - - E5 - - - D5 - - - B4 - - -',
               'C5 - E5 - G5 - C6 - - - B5 - G5 - E5 -', 'F#5 - A5 - D6 - - - C6 - A5 - F#5 - D5 -', 'F5 - - - A5 - C6 - - - - - A5 - F5 -', 'F#5 - - - A5 - - - D5 - E5 - F#5 - A5 -'],
        harm: [H('G4', 'C5'), H('A4', 'D5'), H('B4', 'E5'), H('A4', 'F#4'), H('E4', 'G4'), H('A4', 'D5'), H('A4', 'C5'), H('A4', 'D5')] },
      B2: { chords: ['C', 'D', 'Em', 'Em/D', 'C', 'D', 'F', 'D'], arp: '0-2-3-2-4-3-2-3-',
        lead: ['G5 - - - E5 - G5 - C6 - - - B5 - G5 -', 'A5 - - - F#5 - A5 - D6 - - - C6 - A5 -', 'B5 - - - G5 - B5 - E6 - - - D6 - B5 -', 'A5 - - - G5 - F#5 - - - E5 - D5 - - -',
               'E5 - - - G5 - - - C6 - - - E6 - D6 -', 'D6 - - - C6 - A5 - F#5 - - - A5 - - -', 'C6 - - - A5 - - - F5 - - - A5 - C6 -', 'D6 - - - - - - - A5 - F#5 - D5 - - -'],
        harm: [H('E4', 'G4'), H('F#4', 'A4'), H('G4', 'B4'), H('G4', 'B4'), H('G4', 'C5'), H('F#4', 'A4'), H('F4', 'A4'), H('F#4', 'A4')] },
      D: { chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'D'], duty: .5, arp: '0...2...4...2...', bass: 'R-------R---O---',
        drums: { k: 'x.......x.......', h: '..g...g...g...g.' }, fillEvery: 8, fill: { k: 'x.......x...x...', s: '........x.x.xxxx' }, orn: { dv: 0, fills: null, turn: .15 },
        lead: ['B4 - - - - - - - E5 - - - G5 - - -', 'G5 - - - - - - - E5 - - - C5 - - -', 'D5 - - - - - - - G5 - - - B5 - - -', 'A5 - - - - - - - - - - - F#5 - - -',
               'G5 - - - - - - - B5 - - - E6 - - -', 'C6 - - - - - - - B5 - - - G5 - - -', 'A5 - - - - - - - C6 - - - E5 - - -', 'F#5 - - - - - - - A5 - B5 - C6 - B5 A5'] } } },
  // F# minor, hushed pizzicato steps through the dark wood; the bII (G) and a lydian G# keep it uneasy
  // shuffled by halves: A and B, a hushed A over a bare heartbeat, and B doubled an octave down
  bloom2: { bpm: 100, vol: 1.2, style: 'creep', duty: .25, kit: 'soft', echo: .25, vib: 14, shuffle: true,
    start: ['A', 'A', 'Aq'], next: { A: ['B', 'B', 'Bd'], Aq: ['B', 'Bd'], B: ['A', 'Aq', 'Bd'], Bd: ['A', 'Aq'] },
    orn: { scale: [6, 8, 9, 11, 1, 2, 4], pass: .25, turn: .15, dv: .25,
      dvar: [{ t: '..............x.' }, { h: 'g...............' }, { k: '...........x....' }],
      fills: [{ t: '............x.xx' }, { t: '..........x.x.x.' }, { t: '............xxxx', k: '............x...' }] },
    parts: {
      A: { chords: ['F#m', 'F#m', 'D', 'C#', 'F#m', 'Bm', 'G', 'C#'], lead: BLOOM2_A },
      Aq: { chords: ['F#m', 'F#m', 'D', 'C#', 'F#m', 'Bm', 'G', 'C#'], lead: BLOOM2_A, arp: '0.......2.......', drums: { k: 'x.......x.......', h: '..g...g...g...g.' }, fill: false, orn: { dv: 0 } },
      B: { chords: ['Bm', 'F#m', 'Bm', 'C#', 'D', 'A/C#', 'Bm', 'C#7'], lead: BLOOM2_B },
      Bd: { chords: ['Bm', 'F#m', 'Bm', 'C#', 'D', 'A/C#', 'Bm', 'C#7'], lead: BLOOM2_B, double: -12 } } },
  // Bb minor, slow and drowned: a heartbeat under hollow flute tones and long echoes
  bloomBoss: { bpm: 66, style: 'ambient', duty: .5, kit: 'soft', echo: .4, echoSteps: 4, vib: 14, arpDuty: .25, av: .055, shuffle: true,
    next: { A: ['B'], A2: ['B'], B: ['A', 'A2'] }, start: ['A', 'A2'],
    orn: { scale: [10, 0, 1, 3, 5, 6, 8], pass: .2, turn: .2, dv: .3, dvar: [{ k: '........x.......' }, { k: '........x..g....' }] },
    parts: {
      A: { chords: ['Bbm', 'Bbm', 'Gb', 'F', 'Bbm', 'Ebm', 'Gb', 'F'], lead: BBOSS_A },
      A2: { chords: ['Bbm', 'Bbm', 'Gb', 'F', 'Bbm', 'Ebm', 'Gb', 'F'], lead: BBOSS_A, arp: '0---1---2---3---', double: -12 },
      B: { chords: ['Ebm', 'Bbm/Db', 'Cdim', 'F'], lead: ['Gb4 - - - Bb4 - - - Eb5 - - - - - - -', H('F5', 'Db5'), H('Eb5', 'Gb5'), 'E5 - - - - - - - A4 - - - C5 - - -'] } } },
  // C minor, a stomping half-time beast: pentatonic riffs in parallel fifths over toms
  boss_mossback: { bpm: 116, vol: .88, style: 'tribal', kit: 'heavy', duty: .5, lv: .2, shuffle: true, start: ['A'], next: { A: ['B', 'B', 'A2'], A2: ['B'], B: ['A', 'A2'] },
    orn: { scale: [0, 2, 3, 5, 7, 8, 10], pass: .2, turn: .15, dv: .3, dvar: [{ t: '..............x.' }, { k: '...........x....' }, { u: '.............x..' }],
      fills: [{ t: '........x.x.xxxx', u: '.........x.x....' }, { t: '............xxxx', u: '........x.x.....' }, { t: '........xxxx....', s: '............x.xx' }] }, parts: {
    A: { double: -7, chords: ['C5', 'C5', 'Ab5', 'Bb5', 'C5', 'C5', 'Eb5', 'F5'], lead: MOSS_A },
    A2: { double: -12, chords: ['C5', 'C5', 'Ab5', 'Bb5', 'C5', 'C5', 'Eb5', 'F5'], lead: MOSS_A },
    B: { double: -12, chords: ['Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'Bb', 'G', 'G'],
         lead: ['C5 - - - - - - - Eb5 - - - C5 - Ab4 -', 'D5 - - - - - - - F5 - - - D5 - Bb4 -', H('Eb5', 'G5'), 'F5 - Eb5 - D5 - C5 - Bb4 - - - G4 - - -',
                'C5 - - - Eb5 - - - Ab5 - - - G5 - F5 -', 'F5 - - - D5 - - - Bb4 - - - D5 - F5 -', 'G5 - - - - - - - F5 - Eb5 - D5 - - -', 'B4 - - - - - - - D5 - - - G4 - - -'] } } },

  // ---- world 2: the Clockwork Skyport ----
  // Eb major, a swung, bustling harbour tune with walking bass and ticking clockwork
  sky: { bpm: 124, vol: 1.35, style: 'shuffle', swing: .6, duty: .25, vib: 10,
    chords: ['Eb', 'Ab', 'Bb', 'Eb', 'Cm', 'Ab', 'F7', 'Bb7', 'Ab', 'Bb', 'G7', 'Cm', 'Ab', 'Bb', 'Eb', 'Bb7'],
    lead: ['Eb5 - G5 - Bb5 - - - G5 - Ab5 - Bb5 - - -', 'C6 - - - Bb5 - Ab5 - G5 - F5 - Eb5 - - -', 'F5 - - - D5 - F5 - Bb5 - Ab5 - F5 - D5 -', 'Eb5 - - - - - - - . . G4 - Bb4 - Eb5 -',
           'G5 - - - Eb5 - G5 - C6 - - - Bb5 - G5 -', 'Ab5 - - - C6 - - - Eb6 - - - C6 - Ab5 -', 'A5 - - - F5 - A5 - C6 - - - Eb6 - - -', 'D6 - - - C6 - Bb5 - Ab5 - F5 - D5 - Bb4 -',
           'C5 - - - Eb5 - - - Ab5 - - - G5 - Ab5 -', 'Bb5 - - - - - - - F5 - - - D5 - - -', 'B4 - D5 - F5 - - - G5 - F5 - D5 - B4 -', 'C5 - - - - - - - Eb5 - D5 - C5 - G4 -',
           'Ab4 - C5 - Eb5 - - - Ab5 - G5 - F5 - Eb5 -', 'D5 - F5 - Bb5 - - - D6 - C6 - Bb5 - Ab5 -', 'G5 - - - Eb5 - G5 - Bb5 - - - - - - -', 'Ab5 - - - F5 - - - D5 - - - Bb4 - - -'] },
  // A mixolydian, a galloping deck chase with a counter-voice in the first half
  sky2: { bpm: 160, style: 'drive', duty: .25, vib: 12,
    chords: ['A', 'G', 'D', 'A', 'A', 'G', 'D', 'E', 'F#m', 'D', 'E', 'A', 'F#m', 'D', 'G', 'E'],
    lead: ['E5 - A5 - C#6 - - - B5 - A5 - E5 - - -', 'D5 - - - G5 - B5 - - - A5 - G5 - D5 -', 'F#5 - - - A5 - D6 - - - C#6 - A5 - F#5 -', 'E5 - - - - - - - C#5 - E5 - A5 - - -',
           'E5 - A5 - C#6 - - - E6 - D6 - C#6 - B5 -', 'B5 - - - D6 - - - G5 - B5 - D6 - - -', 'D6 - C#6 - A5 - F#5 - A5 - - - D6 - - -', 'E6 - - - - - - - G#5 - B5 - D6 - - -',
           'C#6 - - - - - A5 - F#5 - - - A5 - C#6 -', 'D6 - - - - - - - A5 - - - F#5 - - -', 'E5 - - - G#5 - B5 - E6 - - - D6 - B5 -', 'C#6 - - - A5 - - - E5 - - - - - - -',
           'A5 - - - C#6 - F#6 - - - E6 - C#6 - A5 -', 'F#6 - - - - - D6 - A5 - - - D6 - F#6 -', 'D6 - - - B5 - G5 - D5 - G5 - B5 - - -', 'E6 - - - - - - - B5 - G#5 - E5 - D5 -'],
    harm: [H('A4', 'C#5'), H('B4', 'D5'), H('A4', 'F#4'), H('C#5', 'A4'), H('C#5', 'E5'), H('D5', 'B4'), H('A5', 'F#5'), H('B4', 'D5'), R(), R(), R(), R(), R(), R(), R(), R()] },
  // F minor, furnace dread: anvils, a grinding ostinato and a tritone-haunted melody
  skyBoss: { bpm: 92, style: 'industrial', kit: 'metal', duty: .5, lv: .18, vib: 16, echo: .15,
    chords: ['Fm', 'Fm', 'Db', 'C', 'Fm', 'Fm', 'Gb', 'C', 'Bbm', 'Fm', 'Db', 'C', 'Bbm', 'Gb', 'Db', 'C7'],
    lead: ['F4 - - - - - - - Ab4 - - - G4 - - -', 'F4 - - - - - C5 - - - - - B4 - - -', 'Ab4 - - - Bb4 - - - C5 - - - Db5 - - -', 'C5 - - - - - - - E4 - - - G4 - - -',
           'F5 - - - - - - - Eb5 - - - Db5 - - -', 'C5 - - - - - Db5 - - - - - B4 - - -', 'Bb4 - - - Db5 - - - Gb5 - - - F5 - - -', 'E5 - - - - - - - - - - - G4 - - -',
           'Db5 - - - F5 - - - Bb5 - - - - - Ab5 -', 'Ab5 - - - G5 - - - F5 - - - C5 - - -', 'F5 - - - Ab5 - - - Db6 - - - C6 - - -', 'C6 - - - - - - - G5 - - - E5 - - -',
           'F5 - - - Db5 - - - Bb4 - - - Db5 - F5 -', 'Gb5 - - - - - - - F5 - - - Db5 - - -', 'Ab4 - - - Db5 - - - F5 - - - Ab5 - - -', 'G5 - - - E5 - - - C5 - - - Bb4 - - -'] },
  // G minor, a relentless clockwork march: dotted rhythms, snare rolls and clanking steam
  boss_colossus: { bpm: 150, style: 'march', kit: 'metal', duty: .25, form: ['A', 'B'], parts: {
    A: { chords: ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Gm', 'Cm', 'D'],
         lead: ['G4 - - G4 Bb4 - - G4 D5 - - - - - - -', 'D5 - - C5 Bb4 - - A4 G4 - - - D4 - - -', 'Eb5 - - D5 C5 - - Bb4 C5 - - - G4 - - -', 'D5 - - - - - - - F#4 - - - A4 - - -',
                'G5 - - G5 F5 - - D5 Bb4 - - - D5 - G5 -', 'A5 - - Bb5 A5 - - G5 F#5 - - - D5 - - -', 'Eb5 - - - G5 - - - C6 - - - Bb5 - A5 -', 'A5 - - - F#5 - - - D5 - - - - - - -'] },
    B: { double: -12, chords: ['Eb', 'F', 'D', 'Gm', 'Eb', 'F', 'D', 'D7'],
         lead: ['Bb4 - - - Eb5 - - - G5 - - - Bb5 - - -', 'A5 - - - - - - - F5 - - - C5 - - -', 'F#5 - - - A5 - - - D6 - - - C6 - Bb5 -', 'Bb5 - - A5 G5 - - - D5 - - - - - - -',
                'G5 - - G5 Bb5 - - G5 Eb5 - - - G5 - - -', 'A5 - - A5 C6 - - A5 F5 - - - A5 - - -', 'D6 - - - C6 - - - Bb5 - - - A5 - - -', 'F#5 - - - - - - - C5 - - - A4 - F#4 -'] } } },

  // ---- world 3: the Prism Rim ----
  // E harmonic minor, glassy and wide: shimmering arpeggios and a dotted-eighth echo
  prism: { bpm: 132, style: 'mystic', duty: .25, echo: .22, vib: 12,
    chords: ['Em', 'Cmaj7', 'Am', 'B', 'Em', 'Cmaj7', 'Am7', 'B7', 'Cmaj7', 'D', 'Em', 'Em', 'Am', 'B', 'Cmaj7', 'B'],
    lead: ['B4 - - - E5 - - - F#5 - G5 - - - F#5 -', 'E5 - - - - - - - B4 - - - G4 - - -', 'A4 - - - C5 - - - E5 - A5 - - - G5 -', 'F#5 - - - - - D#5 - - - B4 - - - - -',
           'B4 - - - E5 - - - F#5 - G5 - - - B5 -', 'B5 - - - - - A5 - G5 - - - E5 - - -', 'C6 - - - B5 - A5 - G5 - - - E5 - C5 -', 'D#5 - - - F#5 - - - A5 - - - B5 - - -',
           'G5 - - - - - - - E5 - - - B4 - - -', 'F#5 - - - - - - - A5 - - - D6 - - -', 'B5 - - - - - G5 - - - E5 - - - - -', 'D#5 - E5 - F#5 - G5 - A5 - G5 - F#5 - D#5 -',
           'C6 - - - - - B5 - A5 - - - E5 - - -', 'D#6 - - - - - - - B5 - - - F#5 - - -', 'E5 - - - G5 - - - B5 - - - C6 - - -', 'B5 - - - - - - - - - - - . . . .'] },
  // D lydian in a quick 3/4 waltz; every other pass the whole gallery flips a tritone down
  prism2: { bpm: 176, vol: 1.3, style: 'waltz', duty: .25, echo: .18, echoSteps: 4, form: ['A', 'B', 'A-6', 'B-6'], parts: {
    A: { chords: ['D', 'E/D', 'F#m', 'E', 'D', 'E/D', 'Bm', 'A'],
         lead: ['A4 - D5 - F#5 - A5 - - - G#5 -', 'B5 - - - G#5 - E5 - - - D5 -', 'C#5 - - - F#5 - A5 - C#6 - - -', 'B5 - - - - - G#5 - - - E5 -',
                'F#5 - A5 - D6 - - - C#6 - B5 -', 'G#5 - B5 - E6 - - - D6 - B5 -', 'A5 - - - F#5 - D5 - - - B4 -', 'C#5 - - - E5 - - - A4 - - -'] },
    B: { chords: ['C', 'D', 'E', 'F#', 'Bb', 'C', 'D', 'E7'],
         lead: ['C5 - E5 - G5 - - - E5 - C5 -', 'D5 - F#5 - A5 - - - F#5 - D5 -', 'E5 - G#5 - B5 - - - G#5 - E5 -', 'F#5 - A#5 - C#6 - - - A#5 - F#5 -',
                'Bb4 - D5 - F5 - - - D5 - Bb4 -', 'C5 - E5 - G5 - C6 - - - B5 -', 'A5 - - - F#5 - D5 - - - E5 -', 'G#5 - - - D5 - - - B4 - - -'] } } },
  // Db lydian, a slow crystal chorale in two voices; timpani gather before the Wyrm wakes
  prismBoss: { bpm: 72, style: 'hymn', duty: .5, kit: 'soft', echo: .35, echoSteps: 4, vib: 12, av: .045, form: ['A', 'B'], parts: {
    A: { chords: ['Db', 'Eb/Db', 'Fm', 'Bbm', 'Gbmaj7', 'Eb', 'Ab', 'Ab7'],
         lead: [H('F5', 'Ab5'), 'G5 - - - - - - - Bb5 - - - G5 - - -', H('Ab5', 'C6'), 'Db6 - - - - - C6 - Bb5 - - - F5 - - -',
                'F5 - - - - - - - Db5 - - - Bb4 - - -', 'G5 - - - - - - - Eb5 - - - Bb4 - - -', 'C5 - - - Eb5 - - - Ab5 - - - C6 - - -', 'Bb5 - - - - - - - Gb5 - - - Eb5 - - -'],
         harm: [H('Db5', 'F5'), H('Eb5', 'G5'), H('F5', 'Ab5'), H('F5', 'Db5'), H('Bb4', 'F4'), H('Bb4', 'G4'), H('Ab4', 'Eb5'), H('Eb5', 'C5')] },
    B: { chords: ['Bbm', 'Gb', 'Eb', 'Ab'], arp: '0123012301230123', drums: { k: 'x.......x.......', t: '..........x.x.xx' }, fill: { t: '........xxxxxxxx', c: '...............x' },
         lead: ['Bb4 - - - - - - - Db5 - - - F5 - - -', 'Gb5 - - - - - - - F5 - - - Db5 - - -', 'Eb5 - - - G5 - - - Bb5 - - - Eb6 - - -', 'C6 - - - - - - - - - - - . . . .'],
         harm: [H('F4', 'Bb4'), H('Bb4', 'Db5'), H('Bb4', 'Eb5'), 'Eb5 - - - - - - - - - - - . . . .'] } } },
  // B minor, soaring over battle arpeggios; climbs to C# minor and slides home through a bridge
  boss_wyrm: { bpm: 168, style: 'battle', duty: .25, echo: .12, vib: 14, form: ['A', 'B', 'A+2', 'C'], parts: {
    A: { chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
         lead: ['B4 - - - F#5 - - - - - - - E5 - F#5 -', 'G5 - - - - - F#5 - E5 - - - D5 - E5 -', 'F#5 - - - A5 - - - D6 - - - - - C#6 -', 'C#6 - - - - - - - A5 - - - E5 - - -',
                'B5 - - - - - A5 - B5 - D6 - - - C#6 -', 'B5 - - - - - - - G5 - - - D5 - - -', 'E5 - G5 - B5 - - - A5 - G5 - F#5 - E5 -', 'F#5 - - - - - - - A#5 - - - C#6 - - -'] },
    B: { chords: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'F#', 'F#7'],
         lead: ['D6 - - - - - - - B5 - - - G5 - - -', 'C#6 - - - - - - - E5 - - - A5 - - -', 'A5 - - - - - C#6 - - - - - F#5 - - -', 'B5 - - - D6 - - - F#6 - - - - - - -',
                'G5 - - - B5 - - - D6 - - - B5 - G5 -', 'A5 - - - C#6 - - - E6 - - - - - - -', 'C#6 - - - A#5 - - - F#5 - - - A#5 - C#6 -', 'E6 - - - - - - - C#6 - - - A#5 - - -'],
         harm: [H('G4', 'B4'), H('A4', 'C#5'), H('F#4', 'A4'), H('B4', 'D5'), H('D5', 'G4'), H('E5', 'C#5'), H('A#4', 'C#5'), H('A#4', 'E5')] },
    C: { chords: ['A', 'B', 'G', 'F#7'],
         lead: ['C#6 - - - - - - - E6 - - - C#6 - A5 -', 'D#6 - - - - - - - B5 - - - F#5 - - -', 'D6 - - - B5 - - - G5 - - - B5 - D6 -', 'C#6 - - - - - - - A#5 - - - F#5 - E5 -'],
         harm: [H('E5', 'A4'), H('F#5', 'D#5'), H('B4', 'D5'), H('A#4', 'C#5')] } } },

  // ---- world 4: the Courts of Chaos ----
  // C# phrygian, a grand processional on the Black Road: tolling arps and dark parallel fourths
  chaos: { bpm: 108, style: 'grand', kit: 'heavy', duty: .25, double: -5, vib: 12, echo: .15,
    chords: ['C#m', 'D', 'C#m', 'Bm', 'C#m', 'D', 'G', 'C#', 'A', 'G', 'F#m', 'D', 'A', 'G', 'D', 'C#'],
    lead: ['C#5 - - - - - - - D5 - - - C#5 - - -', 'F#5 - - - - - - - A5 - - - D5 - - -', 'E5 - - - - - D5 - C#5 - - - G#4 - - -', 'D5 - - - - - - - F#5 - - - B4 - - -',
           'C#5 - - - E5 - - - G#5 - - - - - A5 -', 'A5 - - - - - - - F#5 - - - D5 - - -', 'G5 - - - - - - - D5 - - - B4 - - -', 'C#5 - - - - - - - E#5 - - - G#5 - - -',
           'A5 - - - - - - - G#5 - - - E5 - - -', 'B5 - - - - - - - G5 - - - D5 - - -', 'C#6 - - - - - - - A5 - - - F#5 - - -', 'D6 - - - - - C#6 - - - - - A5 - - -',
           'E5 - - - A5 - - - C#6 - - - B5 - A5 -', 'B5 - - - - - - - D6 - - - G5 - - -', 'F#5 - - - A5 - - - D6 - - - E6 - - -', 'G#5 - - - - - - - E#5 - - - C#5 - D5 -'] },
  // Eb octatonic, fast and lurching: bars of 3/4 and 7/8 trip up the gallop
  chaos2: { bpm: 152, style: 'drive', duty: .25, vib: 10, form: ['A', 'S', 'A+3', 'S+3', 'B', 'C', 'B', 'C'], parts: {
    A: { chords: ['Ebm', 'C', 'Ebm', 'A'],
         lead: ['Eb5 - - Gb5 - - Bb5 - A5 - Gb5 - Eb5 - E5 -', 'G5 - - - E5 - C5 - Db5 - - - Eb5 - - -', 'Eb5 - - Gb5 - - Bb5 - Db6 - C6 - A5 - Gb5 -', 'A5 - - - - - E5 - C#5 - - - A4 - Bb4 -'] },
    S: { n: 12, chords: ['Gb A', 'C Eb'], arp: '024024024024', bass: 'RRORRORRORRO', drums: { k: 'X..x..X..x..', s: '...x.....x..', h: 'x.x.x.x.x.x.' }, fill: false,
         lead: ['Bb4 - Db5 - E5 - G5 - Bb5 - A5 -', 'Gb5 - Eb5 - C5 - A4 - Gb4 - - -'] },
    B: { chords: ['Cm', 'Ab', 'Cm', 'D'], harm: [H('G4', 'C5'), H('C5', 'Eb5'), H('G4', 'Eb5'), H('A4', 'D5')],
         lead: ['C5 - - - Eb5 - - - G5 - - - F#5 - G5 -', 'Ab5 - - - - - G5 - Eb5 - - - C5 - - -', 'Eb5 - G5 - C6 - - - B5 - - - G5 - Eb5 -', 'F#5 - - - A5 - - - D6 - - - C6 - A5 -'] },
    C: { n: 14, chords: ['Eb', 'E'], arp: '0-2-4-0-2-4-2-', bass: 'R.RR.RO.R.RR.O', drums: { k: 'X...X...X.x...', s: '....x.......x.', h: 'x.x.x.x.x.x.x.' }, fill: { s: '..........xxxx' },
         lead: ['Eb5 - G5 - Bb5 - - Bb5 - A5 - G5 - -', 'G#5 - - E5 - B4 - E5 - G#5 - B5 - -'] } } },
  // G# minor, the ground falling away: a heartbeat that quickens as the tempo climbs, part by part
  chaosBoss: { kit: 'heavy', duty: .5, lv: .17, vib: 16, echo: .3, echoSteps: 4, form: ['A', 'B', 'C'], parts: {
    A: { bpm: 60, style: 'ambient', arp: R(), bass: 'R---------------', drums: { k: 'X..x............' }, fill: false, chords: ['G#m', 'G#m/A', 'G#m', 'G#m/G'],
         lead: [W('G#4'), H('A4', 'G#4'), H('B4', 'D#5'), H('D5', 'C#5')] },
    B: { bpm: 68, style: 'ambient', arp: '0...1...2...1...', bass: 'R-------R-------', drums: { k: 'X..x....X..x....', t: '..........x...x.' }, fill: { t: '............xxxx' }, chords: ['E', 'D#', 'E', 'D#'],
         lead: ['G#4 - - - B4 - - - E5 - - - - - - -', H('D#5', 'A#4'), 'B4 - - - E5 - - - G#5 - - - - - - -', H('G#5', 'G5')] },
    C: { bpm: 76, style: 'mystic', bass: 'R.R.R.R.R.R.R.R.', fill: false, double: -12, chords: ['G#m', 'E', 'C#m', 'D#', 'G#m', 'E', 'D', 'D#7'],
         drums: [{ k: 'X...x...X...x...', s: '....x.......x...', h: '..x...x...x...x.', c: 'x...............' }, { k: 'X...x...X...x...', s: '....x.......x...', h: '..x...x...x...x.' },
                 { k: 'X...x...X...x...', s: '....x.......x...', h: '..x...x...x...x.' }, { k: 'X...x...X.x.x.x.', s: '....x...xxxxXXXX', t: '........x...x...' }],
         lead: ['D#5 - - - - - - - G#5 - - - - - F#5 -', H('E5', 'B4'), 'C#5 - - - E5 - - - G#5 - - - C#6 - - -', 'A#5 - - - - - - - G5 - - - D#5 - - -',
                'B5 - - - - - A#5 - G#5 - - - D#5 - - -', 'E5 - - - G#5 - - - B5 - - - - - - -', 'A5 - - - - - - - F#5 - - - D5 - - -', W('D#5')] } } },
  // the Ty'iga: E phrygian in 3+3+2, a 7/8 shift up to F, a crooked waltz in Bb, then an E-minor frenzy
  boss_tyiga: { duty: .25, vib: 12, form: ['A', 'B', 'A', 'C', 'D'], parts: {
    A: { bpm: 158, style: 'battle', chords: ['Em', 'F', 'Em', 'Bb'], arp: '0120120101201201', bass: 'R..R..R.R..R..O.', drums: { k: 'X..x..x.X..x..x.', s: '......X.......X.', h: '.x..x....x..x...' },
         lead: ['E5 - - F5 - - E5 - B4 - - Bb4 - - G4 -', 'A4 - - C5 - - F5 - E5 - - - F5 - - -', 'G5 - - F5 - - E5 - D5 - - C5 - - B4 -', 'Bb4 - D5 - F5 - Bb5 - - - A5 - - - Bb5 -'] },
    B: { bpm: 158, n: 14, style: 'battle', double: -6, chords: ['Fm', 'Gb', 'Fm', 'B'], arp: '01201201230123', bass: 'R..R..R.R..R..', drums: { k: 'X..x..x.X..x..', s: '......X.....X.', h: '.x..x..x..x..x' }, fill: { s: '..........xxxx' },
         lead: ['F5 - - Ab5 - - C6 - Bb5 - Ab5 - G5 -', 'Gb5 - - Db5 - - Bb4 - - - Db5 - - -', 'C5 - - F5 - - Ab5 - G5 - F5 - E5 -', 'D#5 - - F#5 - - B5 - - - A#5 - - -'] },
    C: { bpm: 132, n: 12, style: 'waltz', chords: ['Bbm', 'Bbm', 'Gb', 'F'], arp: '....0-1-2-1-', harm: ['Db4 - - - - - - - - - C4 -', 'Db4 - - - - - - - - - Bb3 -', 'Db4 - - - - - - - - - - -', 'C4 - - - - - - - - - A3 -'],
         lead: ['Bb4 - - - Db5 - F5 - - - E5 -', 'F5 - - - Gb5 - F5 - - - Db5 -', 'Bb4 - - - Db5 - Gb5 - - - F5 -', 'E5 - - - - - A4 - - - C5 -'] },
    D: { bpm: 172, style: 'battle', chords: ['Em', 'Em', 'C', 'B7'],
         lead: ['E5 - G5 - B5 - E6 - D#6 - B5 - G5 - E5 -', 'F5 - - - E5 - - - D#5 - - - E5 - - -', 'G5 - C6 - E6 - - - D6 - C6 - B5 - G5 -', 'F#5 - - - A5 - - - D#5 - - - B4 - - -'] } } },

  // the generic boss theme, for any boss without its own
  boss: { bpm: 162, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'G#dim', 'E'], style: 'battle', duty: .25,
    lead: ['A4 - C5 - E5 - - A5 - G5 E5 - D5 - C5 -', 'F5 - - - E5 - D5 - C5 - - - A4 - C5 -', 'D5 - - B4 - G4 - B4 D5 - G5 - F5 - D5 -', 'E5 - - - - - G#4 - B4 - E5 - G#5 - - -',
           'A5 - - - G5 - E5 - C5 - E5 - A5 - B5 -', 'C6 - - - B5 - A5 - F5 - A5 - C6 - - -', 'D6 - B5 - G#5 - F5 - D5 - F5 - G#5 - B5 -', 'E5 - - - - - - - G#5 - B5 - E6 - - -'] },
};
})();

// ---------- compiling a track into per-step events ----------
const NOTE_IX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midiOf(n) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n);
  if (!m) throw new Error('bad note ' + n);
  return 12 * (+m[3] + 1) + NOTE_IX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const MUS_QUAL = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], 5: [0, 7],
  7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m7b5: [0, 3, 6, 10] };
function musChord(sym, tp) { // {root: midi in octave 3, iv: intervals, bass: midi of the bass root in octave 2}
  const m = /^([A-G][#b]?)(maj7|m7b5|m7|sus2|sus4|dim|aug|m|7|5)?(?:\/([A-G][#b]?))?$/.exec(sym);
  if (!m) throw new Error('bad chord ' + sym);
  let root = midiOf(m[1] + '3') + tp; while (root < 48) root += 12; while (root >= 60) root -= 12;
  let bass = (m[3] ? midiOf(m[3] + '3') + tp : root) - 12; while (bass < 33) bass += 12; while (bass >= 45) bass -= 12;
  return { root, iv: MUS_QUAL[m[2] || ''], bass };
}
const musTokens = (s) => s.trim().split(/\s+/).filter(t => t !== '|');
const musPick = (p, b) => Array.isArray(p) ? p[b % p.length] : p;
const musAny = (a, rnd) => a[Math.floor(rnd() * a.length) % a.length];
function musBarScale(scale, c) { // the key's pitch classes, bent to fit a chord that borrows a note (an F in G major)
  const sc = new Set(scale);
  for (const iv of c.iv) { const pc = (c.root + iv) % 12; if (!sc.has(pc)) { sc.delete((pc + 1) % 12); sc.delete((pc + 11) % 12); sc.add(pc); } }
  return sc;
}
// opt (for shuffled tracks): { rnd, orn } where orn may set scale (pitch classes of the key), pass / turn (odds of a
// passing note between notes a third apart, or a turn on a long note), dv + dvar (odds per bar of one drum overlay),
// fills (fill bars pick one at random), arps + arpP (odds per 4 bars of an alternate arpeggio). A part's own orn wins.
function compile(tr, opt) {
  const parts = tr.parts || { A: tr }, form = tr.form || ['A'], bars = [];
  for (const f of form) {
    const m = /^(\w+?)([+-]\d+)?$/.exec(f), p = parts[m[1]], tp = +(m[2] || 0);
    if (!p) throw new Error('no part ' + f);
    const st = MUS_STYLES[p.style || tr.style] || MUS_STYLES.plain;
    const get = (k) => p[k] !== undefined ? p[k] : tr[k] !== undefined ? tr[k] : st[k];
    const harm = get('harm');
    if (harm && harm.length !== p.lead.length) throw new Error('harm and lead differ in length');
    p.lead.forEach((lead, b) => bars.push({ p, get, b, tp, n: get('n') || 16, lead, harm: harm && harm[b], chord: get('chords')[b % get('chords').length] }));
  }
  const kit = MUS_KITS[tr.kit] || MUS_KITS.std, vol = tr.vol || 1, ev = [], sd = [], off = [];
  const rnd = (opt && opt.rnd) || Math.random, ornAt = [], sclAt = [];
  let at = 0, arpAlt = null;
  bars.forEach((bar, bi) => {
    const { get, b, tp, n } = bar, bpm = get('bpm'), dur = 60 / bpm / 4, sw = tr.swing || 0;
    const O = opt && opt.orn ? Object.assign({}, opt.orn, bar.p.orn || {}) : null;
    for (let i = 0; i < n; i++) { sd.push(dur); off.push(sw * dur * [0, .5, 1, .5][i % 4]); }
    // the tune and its voices
    const line = (str, ch, v, d, dbl) => {
      if (!str) return;
      const tk = musTokens(str);
      if (tk.length !== n) throw new Error(`a ${ch} bar has ${tk.length} steps, not ${n}: ${str}`);
      tk.forEach((t, i) => {
        if (t === '-' || t === '.') return;
        let len = 1; while (tk[i + len] === '-') len++;
        const midi = midiOf(t) + tp;
        ev.push({ s: at + i, ch, midi, len, v, d });
        if (dbl) ev.push({ s: at + i, ch: 'dbl', midi: midi + dbl, len, v: v * .42, d: .5 });
      });
    };
    line(bar.lead, 'lead', (get('lv') || .16) * vol, get('duty') || .25, get('double'));
    line(bar.harm, 'harm', (get('hv') || .085) * vol, get('hduty') || .5);
    // the chords, the arpeggio and the bass
    const segs = bar.chord.trim().split(/\s+/).map(c => musChord(c, tp));
    const nextBar = bars[(bi + 1) % bars.length], nextFirst = musChord(nextBar.chord.trim().split(/\s+/)[0], nextBar.tp);
    if (b % 4 === 0) arpAlt = O && O.arps && bar.p.arp === undefined && rnd() < (O.arpP || 0) ? musAny(O.arps, rnd) : null;
    if (O && O.scale) for (let i = 0; i < n; i++) { ornAt[at + i] = O; sclAt[at + i] = musBarScale(O.scale, segs[Math.floor(i * segs.length / n)]); }
    const arp = arpAlt || musPick(get('arp'), b), bass = musPick(get('bass'), b), arpOct = get('arpOct') || 0;
    const ad = get('arpDuty') || .125, av = (get('av') || .06) * vol, bv = (get('bv') || .3) * vol;
    const hold = (pat, i) => { let len = 1; while (pat[(i + len) % pat.length] === '-' && i + len < n) len++; return len; };
    for (let i = 0; i < n; i++) {
      const k = Math.floor(i * segs.length / n), c = segs[k], next = k + 1 < segs.length ? segs[k + 1] : nextFirst;
      const a = arp[i % arp.length];
      if (a >= '0' && a <= '9') {
        const d = +a, nt = c.iv.length; let midi = c.root + 12 + arpOct + c.iv[d % nt] + 12 * Math.floor(d / nt);
        while (midi > 86) midi -= 12; // keep the sparkle below a squeal
        ev.push({ s: at + i, ch: 'arp', midi, len: hold(arp, i), v: av, d: ad });
      }
      const L = c.bass, bc = bass[i % bass.length];
      const bm = { R: L, O: L + 12, F: L + 7, V: L - 5 < 31 ? L + 7 : L - 5, T: L + (c.iv[1] || 7), S: L + (c.iv[3] || 10), C: next.bass - 1 < 31 ? next.bass + 11 : next.bass - 1 }[bc];
      if (bm !== undefined) ev.push({ s: at + i, ch: 'bass', midi: bm, len: hold(bass, i), v: bv });
    }
    // drums
    const drums = musPick(get('drums'), b);
    if (drums) {
      const fe = get('fillEvery') || 4;
      let fill = get('fill') === undefined ? { s: '............xxxx' } : get('fill');
      const doFill = fill && bi % fe === fe - 1;
      if (doFill && O && O.fills) fill = musAny(O.fills, rnd);
      const over = !doFill && O && O.dvar && rnd() < (O.dv || 0) ? musAny(O.dvar, rnd) : null;
      for (let i = 0; i < n; i++) {
        const hit = {};
        for (const lane in drums) { const c = drums[lane][i]; if (c === 'x' || c === 'X' || c === 'g') hit[lane] = c; }
        if (doFill) for (const lane in fill) { const c = fill[lane][i]; if (c === 'x' || c === 'X' || c === 'g') hit[lane] = c; }
        if (over) for (const lane in over) { const c = over[lane][i]; if ((c === 'x' || c === 'g') && !hit[lane]) hit[lane] = c; }
        if (hit.s && hit.h) delete hit.h;
        for (const lane in hit) ev.push({ s: at + i, ch: lane, v: (hit[lane] === 'X' ? 1.35 : hit[lane] === 'g' ? .45 : 1) * vol });
      }
    }
    at += n;
  });
  if (opt && opt.orn) { // ornaments on the tune: a passing note between notes a third apart, a turn on a long note
    const lead = ev.filter(e => e.ch === 'lead').sort((x, y) => x.s - y.s), dbl = {};
    for (const e of ev) if (e.ch === 'dbl') dbl[e.s] = e;
    for (let i = 0; i + 1 < lead.length; i++) {
      const e = lead[i], nx = lead[i + 1], d = nx.midi - e.midi, O = ornAt[e.s];
      if (!O || nx.s !== e.s + e.len || e.len < 4) continue; // only between notes that touch
      const sc = sclAt[e.s + e.len - 2], inKey = (m) => sc.has(((m % 12) + 12) % 12);
      let ins = null;
      if ((Math.abs(d) === 3 || Math.abs(d) === 4) && rnd() < (O.pass || 0)) {
        for (let k = 1; k < Math.abs(d); k++) { const m = e.midi + Math.sign(d) * k; if (inKey(m)) { ins = [[m, 2]]; break; } }
      } else if (e.len >= 6 && Math.abs(d) <= 2 && rnd() < (O.turn || 0)) {
        const u = inKey(e.midi + 1) ? e.midi + 1 : inKey(e.midi + 2) ? e.midi + 2 : 0;
        if (u) ins = [[u, 1], [e.midi, 1]];
      }
      if (!ins) continue;
      const dd = dbl[e.s]; e.len -= 2; if (dd) dd.len -= 2;
      let s = e.s + e.len;
      for (const [m, len] of ins) {
        ev.push({ s, ch: 'lead', midi: m, len, v: e.v, d: e.d });
        if (dd) ev.push({ s, ch: 'dbl', midi: m + dd.midi - e.midi, len, v: dd.v, d: dd.d });
        s += len;
      }
    }
  }
  const by = [...Array(at)].map(() => []);
  for (const e of ev) by[e.s].push(e);
  return { steps: at, by, sd, off, stepDur: sd[0], once: tr.once, duty: tr.duty, kit, echo: tr.echo || 0, echoSteps: tr.echoSteps || 3, vib: tr.vib || 0 };
}

// ---------- playing ----------
const COMPILED = {};
// a shuffled track ({ shuffle: true, parts, next, start, arr, orn }) plays one part at a time, each a fresh compile with
// its own ornaments; when a part ends the next is drawn from next[part] (or any part), never the same one twice running.
// Each time it starts it draws a starting part from start and one arrangement from arr (small tone changes).
function musPhrase(name, prev) {
  const T = TRACKS[name], rnd = Math.random, keys = Object.keys(T.parts);
  const st = prev ? prev.dyn : { arr: T.arr ? musAny(T.arr, rnd) : null, last: null, n: 0 };
  let opts = ((prev ? T.next && T.next[st.last] : T.start) || keys).filter(k => k !== st.last && T.parts[k]);
  if (!opts.length) opts = keys.filter(k => k !== st.last);
  const k = musAny(opts, rnd);
  const c = compile(Object.assign({}, T, st.arr || {}, { form: [k] }), { rnd, orn: T.orn });
  c.dyn = { arr: st.arr, last: k, n: st.n + 1 }; c.part = k;
  return c;
}
let musicOn = true, musicWant = null, musicCur = null, musicStep = 0, musicNext = 0, musicTimer = null, musicGain = null, waves = {};
let echoIn = null, echoDelay = null, echoWet = null;
try { musicOn = localStorage.getItem('shadowroad-music') !== '0'; } catch (e) {}
function pulseWave(duty) { // a square wave with the given duty cycle, as in the old sound chips
  if (waves[duty]) return waves[duty];
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
  return (waves[duty] = actx.createPeriodicWave(re, im));
}
function voice(t, midi, dur, type, vol, duty, vib, echo) {
  const o = actx.createOscillator(), g = actx.createGain();
  if (type === 'pulse') o.setPeriodicWave(pulseWave(duty)); else o.type = type;
  o.frequency.setValueAtTime(freqOf(midi), t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006);
  g.gain.setValueAtTime(vol * .8, t + dur * .6); g.gain.linearRampToValueAtTime(0, t + dur);
  if (vib && dur > .4) { // a delayed vibrato on long notes
    const l = actx.createOscillator(), lg = actx.createGain();
    l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + .2); lg.gain.linearRampToValueAtTime(vib, t + .5);
    l.connect(lg).connect(o.detune); l.start(t); l.stop(t + dur + .02);
  }
  o.connect(g).connect(musicGain); if (echo && echoIn) g.connect(echoIn);
  o.start(t); o.stop(t + dur + .02);
}
function drum(t, kind, v, kit) {
  if (kind === 'kick' || kind === 'k' || kind === 't' || kind === 'u') { // the kick and two toms are falling sine thumps
    const o = actx.createOscillator(), g = actx.createGain();
    const [f0, f1, dec, vol] = kind === 'k' || kind === 'kick' ? kit.k : kind === 't' ? [190, 70, .2, .4] : [280, 120, .16, .32];
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dec * .85);
    g.gain.setValueAtTime(vol * v, t); g.gain.exponentialRampToValueAtTime(.001, t + dec);
    o.connect(g).connect(musicGain); o.start(t); o.stop(t + dec + .01); return;
  }
  if (kind === 'm') { // a clank of metal: two inharmonic squares, briefly
    const g = actx.createGain(), f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 2;
    g.gain.setValueAtTime(.09 * v, t); g.gain.exponentialRampToValueAtTime(.001, t + .09); f.connect(g).connect(musicGain);
    for (const hz of [523, 789]) { const o = actx.createOscillator(); o.type = 'square'; o.frequency.value = hz; o.connect(f); o.start(t); o.stop(t + .1); }
    return;
  }
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  const snare = kind === 's' || kind === 'snare', crash = kind === 'c', openHat = kind === 'o';
  s.buffer = noiseBuf; f.type = snare ? 'bandpass' : 'highpass'; f.frequency.value = snare ? kit.s[0] : crash ? 3500 : 6000;
  const len = snare ? kit.s[1] : crash ? .38 : openHat ? .12 : .03, vol = (snare ? kit.s[2] : crash ? .09 : openHat ? kit.h * .8 : kit.h) * v;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f).connect(g).connect(musicGain); s.start(t); s.stop(t + len + .01);
}
function musicTick() {
  if (!actx || !musicCur) return;
  let tr = COMPILED[musicCur];
  while (musicNext < actx.currentTime + .15) {
    const sd = tr.sd[musicStep], t = musicNext + tr.off[musicStep];
    for (const e of tr.by[musicStep]) {
      const dur = (e.len || 1) * sd;
      if (e.ch === 'lead') voice(t, e.midi, dur * .95, 'pulse', e.v, e.d, tr.vib, tr.echo);
      else if (e.ch === 'harm' || e.ch === 'dbl') voice(t, e.midi, dur * .92, 'pulse', e.v, e.d, 0, tr.echo);
      else if (e.ch === 'arp') voice(t, e.midi, dur * .8, 'pulse', e.v, e.d);
      else if (e.ch === 'bass') voice(t, e.midi, dur * .9, 'triangle', e.v);
      else drum(t, e.ch, e.v, tr.kit);
    }
    musicNext += sd; musicStep++;
    if (musicStep >= tr.steps) {
      if (tr.once) { musicCur = null; return; }
      if (tr.dyn) tr = COMPILED[musicCur] = musPhrase(musicCur, tr); // the next part of a shuffled track; every part keeps the tempo
      musicStep = 0;
    }
  }
}
function musicBus() { // master gain -> a gentle low-pass (no squeal), with a feedback echo send
  musicGain = actx.createGain(); musicGain.gain.value = .5;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500; lp.Q.value = .5;
  musicGain.connect(lp).connect(actx.destination);
  echoIn = actx.createGain(); echoDelay = actx.createDelay(1.5); echoWet = actx.createGain(); echoWet.gain.value = 0;
  const fb = actx.createGain(), tone = actx.createBiquadFilter(); fb.gain.value = .32; tone.type = 'lowpass'; tone.frequency.value = 3000;
  echoIn.connect(echoDelay).connect(tone).connect(fb).connect(echoDelay); tone.connect(echoWet).connect(musicGain);
}
function playMusic(name) { // switch tracks; waits for the first touch before any sound can play
  musicWant = name;
  if (!actx || !musicOn) return;
  if (name === musicCur) return;
  if (!TRACKS[name]) return;
  if (TRACKS[name].shuffle) COMPILED[name] = musPhrase(name); // a new start every time it comes on
  else if (!COMPILED[name]) COMPILED[name] = compile(TRACKS[name]);
  if (!musicGain) musicBus();
  const tr = COMPILED[name];
  echoDelay.delayTime.setValueAtTime(Math.min(1.4, tr.echoSteps * tr.sd[0]), actx.currentTime);
  echoWet.gain.setTargetAtTime(tr.echo, actx.currentTime, .05);
  musicCur = name; musicStep = 0; musicNext = actx.currentTime + .08;
  if (!musicTimer) musicTimer = setInterval(musicTick, 30);
}
function stopMusic() { musicCur = null; }
function setMusic(on) {
  musicOn = on; try { localStorage.setItem('shadowroad-music', on ? '1' : '0'); } catch (e) {}
  if (!on) stopMusic(); else if (musicWant) playMusic(musicWant);
}
