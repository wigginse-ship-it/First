'use strict';
// ---------- chiptune music: two pulse leads, a triangle bass and noise drums, sequenced in 16th notes ----------
// All tunes are original, written in the spirit of 8- and 16-bit RPG soundtracks.
// Melodies: 16 tokens per bar. A note like E5 starts a note, '-' holds it, '.' is a rest.
const TRACKS = {
  title: { bpm: 88, chords: ['C', 'Am', 'F', 'G'], style: 'calm', duty: .5,
    lead: ['E5 - - - G5 - - - C6 - - - B5 - - -', 'A5 - - - - - - - E5 - - - - - - -', 'F5 - - - A5 - - - C6 - - - D6 - - -', 'B5 - - - - - - - G5 - - - - - - -'] },
  bloom: { bpm: 132, chords: ['D', 'C', 'G', 'D', 'D', 'C', 'G', 'A'], style: 'march', duty: .25,
    lead: ['F#5 - - - A5 - - - D6 - C6 - A5 - - -', 'G5 - - - E5 - G5 - C6 - - - B5 - A5 -', 'B5 - - - D6 - - - G5 - A5 - B5 - - -', 'A5 - - - F#5 - D5 - F#5 - A5 - - - - -',
           'D6 - - - C6 - A5 - F#5 - A5 - D6 - E6 -', 'G6 - - - E6 - - - C6 - D6 - E6 - - -', 'D6 - - - B5 - G5 - B5 - C6 - D6 - B5 -', 'A5 - - - - - - - C#6 - - - E6 - - -'] },
  sky: { bpm: 140, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C'], style: 'bounce', duty: .25,
    lead: ['C6 - A5 - F5 - A5 - C6 - - - D6 - C6 -', 'A5 - - - F5 - D5 - F5 - A5 - D6 - - -', 'D6 - - - Bb5 - F5 - D5 - F5 - Bb5 - A5 -', 'G5 - - - E5 - C5 - E5 - G5 - C6 - - -',
           'F6 - - - E6 - C6 - A5 - C6 - F6 - - -', 'D6 - - - A5 - F5 - A5 - D6 - F6 - E6 -', 'D6 - - - Bb5 - G5 - Bb5 - D6 - G6 - F6 -', 'E6 - - - C6 - - - G5 - - - C6 - - -'] },
  prism: { bpm: 126, chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B'], style: 'mystic', duty: .125,
    lead: ['E5 - - - G5 - B5 - - - A5 - G5 - F#5 -', 'E5 - - - - - G5 - C6 - - - B5 - A5 -', 'F#5 - - - A5 - D6 - - - C6 - A5 - F#5 -', 'D#5 - - - F#5 - B5 - - - - - D#6 - - -',
           'E6 - - - D6 - B5 - G5 - B5 - E6 - F#6 -', 'G6 - - - E6 - C6 - - - E6 - G6 - - -', 'A6 - - - G6 - E6 - C6 - E6 - A5 - - -', 'B5 - - - - - - - D#6 - - - F#6 - - -'] },
  boss: { bpm: 156, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E'], style: 'battle', duty: .25,
    lead: ['A4 - C5 - E5 - - A5 - G5 E5 - D5 - C5 -', 'F5 - - - E5 - D5 - C5 - - - A4 - C5 -', 'D5 - - B4 - G4 - B4 D5 - G5 - F5 - D5 -', 'E5 - - - - - G#4 - B4 - E5 - G#5 - - -',
           'A5 - - - G5 - E5 - C5 - E5 - A5 - B5 -', 'C6 - - - B5 - A5 - F5 - A5 - C6 - - -', 'D6 - C6 - A5 - F5 - D5 - F5 - A5 - G5 -', 'E5 - - - - - - - G#5 - B5 - E6 - - -'] },
  fallen: { bpm: 70, chords: ['Am', 'F', 'E', 'Am'], style: 'calm', duty: .5, once: true,
    lead: ['E5 - - - C5 - - - A4 - - - - - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -', 'B4 - - - G#4 - - - E4 - - - - - - -', 'A4 - - - - - - - - - - - . . . .'] },
};
const NOTE_IX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midiOf(n) { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + NOTE_IX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
function chordTones(sym) { // root midi in octave 3, plus third and fifth
  const m = /^([A-G][#b]?)(m?)$/.exec(sym), root = midiOf(m[1] + '3');
  return [root, root + (m[2] ? 3 : 4), root + 7];
}
// turn a track into a list of note events per 16th-note step
function compile(tr) {
  const bars = tr.lead.length, steps = bars * 16, ev = [];
  tr.lead.forEach((bar, b) => {
    const tk = bar.trim().split(/\s+/);
    tk.forEach((t, i) => {
      if (t === '-' || t === '.') return;
      let len = 1; while (tk[i + len] === '-') len++;
      ev.push({ s: b * 16 + i, ch: 'lead', midi: midiOf(t), len });
    });
  });
  for (let b = 0; b < bars; b++) {
    const [r, third, fifth] = chordTones(tr.chords[b % tr.chords.length]), at = b * 16;
    const arp = [r + 12, third + 12, fifth + 12, r + 24];
    for (let i = 0; i < 16; i++) {
      // harmony: rolling arpeggios (fast for battle, gentle for calm)
      if (tr.style === 'battle' || tr.style === 'mystic') ev.push({ s: at + i, ch: 'arp', midi: arp[i % 4] + (tr.style === 'mystic' && i >= 8 ? 12 : 0), len: 1 });
      else if (tr.style === 'calm') { if (i % 4 === 0) ev.push({ s: at + i, ch: 'arp', midi: arp[(i / 4) % 4], len: 4 }); }
      else if (i % 2 === 0) ev.push({ s: at + i, ch: 'arp', midi: arp[(i / 2) % 4], len: 2 });
      // bass: driving octaves in battle, marching roots and fifths elsewhere
      if (tr.style === 'battle') { if (i % 2 === 0) ev.push({ s: at + i, ch: 'bass', midi: r - 12 + (i % 4 === 2 ? 12 : 0), len: 2 }); }
      else if (tr.style === 'calm') { if (i % 8 === 0) ev.push({ s: at + i, ch: 'bass', midi: r - 12, len: 8 }); }
      else if (i % 4 === 0) ev.push({ s: at + i, ch: 'bass', midi: (i % 8 === 4 ? r - 5 : r - 12), len: 3 });
      // drums
      if (tr.style !== 'calm') {
        const kick = tr.style === 'battle' ? [0, 6, 8, 10].includes(i) : i % 8 === 0, snare = i % 8 === 4, hat = tr.style === 'battle' ? i % 2 === 1 : i % 2 === 0;
        if (kick) ev.push({ s: at + i, ch: 'kick' }); if (snare) ev.push({ s: at + i, ch: 'snare' }); if (hat && !snare) ev.push({ s: at + i, ch: 'hat' });
      }
    }
  }
  const by = [...Array(steps)].map(() => []);
  for (const e of ev) by[e.s].push(e);
  return { steps, by, stepDur: 60 / tr.bpm / 4, once: tr.once, duty: tr.duty };
}
const COMPILED = {};
let musicOn = true, musicWant = null, musicCur = null, musicStep = 0, musicNext = 0, musicTimer = null, musicGain = null, waves = {};
try { musicOn = localStorage.getItem('shadowroad-music') !== '0'; } catch (e) {}
function pulseWave(duty) { // a square wave with the given duty cycle, as in the old sound chips
  if (waves[duty]) return waves[duty];
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
  return (waves[duty] = actx.createPeriodicWave(re, im));
}
function voice(t, midi, dur, type, vol, duty) {
  const o = actx.createOscillator(), g = actx.createGain();
  if (type === 'pulse') o.setPeriodicWave(pulseWave(duty)); else o.type = type;
  o.frequency.setValueAtTime(freqOf(midi), t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006);
  g.gain.setValueAtTime(vol * .8, t + dur * .6); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(musicGain); o.start(t); o.stop(t + dur + .02);
}
function drum(t, kind) {
  if (kind === 'kick') { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .12); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g).connect(musicGain); o.start(t); o.stop(t + .15); return; }
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
  const len = kind === 'hat' ? .03 : .12, v = kind === 'hat' ? .12 : .32;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f).connect(g).connect(musicGain); s.start(t); s.stop(t + len + .01);
}
function musicTick() {
  if (!actx || !musicCur) return;
  const tr = COMPILED[musicCur];
  while (musicNext < actx.currentTime + .15) {
    for (const e of tr.by[musicStep]) {
      const dur = (e.len || 1) * tr.stepDur;
      if (e.ch === 'lead') voice(musicNext, e.midi, dur * .95, 'pulse', .16, tr.duty);
      else if (e.ch === 'arp') voice(musicNext, e.midi, dur * .8, 'pulse', .06, .125);
      else if (e.ch === 'bass') voice(musicNext, e.midi, dur * .9, 'triangle', .3);
      else drum(musicNext, e.ch);
    }
    musicNext += tr.stepDur; musicStep++;
    if (musicStep >= tr.steps) { if (tr.once) { musicCur = null; return; } musicStep = 0; }
  }
}
function playMusic(name) { // switch tracks; waits for the first touch before any sound can play
  musicWant = name;
  if (!actx || !musicOn) return;
  if (name === musicCur) return;
  if (!COMPILED[name]) COMPILED[name] = compile(TRACKS[name]);
  if (!musicGain) { musicGain = actx.createGain(); musicGain.gain.value = .5; musicGain.connect(actx.destination); }
  musicCur = name; musicStep = 0; musicNext = actx.currentTime + .08;
  if (!musicTimer) musicTimer = setInterval(musicTick, 30);
}
function stopMusic() { musicCur = null; }
function setMusic(on) {
  musicOn = on; try { localStorage.setItem('shadowroad-music', on ? '1' : '0'); } catch (e) {}
  if (!on) stopMusic(); else if (musicWant) playMusic(musicWant);
}
