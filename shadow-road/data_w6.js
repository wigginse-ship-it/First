'use strict';
// The Dreaming Shadow: STAGES / EDEF / BOSSES / ZONES entries (see art_w6.js for its art, attacks, rules, passages, music
// and ending). It loads before data_w5.js, so it is the fifth world and Tir-na Nog'th stays the sixth and last.
// A shadow that someone else is dreaming: spent after the Ty'iga, Corwin falls asleep on the Rim of the Abyss, and the vast
// Sleeper that lies far down in the Abyss beneath the Courts (whose dreams were the thousand faces the Ty'iga wore) dreams
// him into its dream, painted like the pictures of the dream-painters of a later Earth. When it wakes, he wakes back on
// the rim, and goes on to Tir-na Nog'th by a Trump (both told in endings.js).
//   dream      - The Piazza of Long Shadows (waves 1-2)
//   dream2     - The Shore of Soft Clocks (wave 3; the hours melt into pools on the sand: rule 'w6melt')
//   dreamBoss  - The Bed of the Sleeper: the Sleeper itself and its three dreams (rule 'w6sleep')
(() => {
  // the dreamer's creatures are made of strange stuff: what spills out of them when they are cut
  MAT_COL.dream = ['#F4E6C8', '#D89A52', '#5A8AC8']; MAT_SFX.dream = 'hit-goo';
  MAT_COL.china = ['#F6F0E6', '#C8B49A', '#3A3A44']; MAT_SFX.china = 'hit-crystal';

  Object.assign(EDEF, {
    // the people of the dream
    w6bowler:    { name: 'Gentleman of Golconda', draw: 'w6bowler', mat: 'dream', move: 'ground', hp: 50, spd: 70, hw: 12, hh: 64, dmg: 14, plans: ['w6brolly', 'w6apple', 'w6drop', 'w6brolly'], wind: .5, cd: [0.88, 1.6], reach: 58, weight: 1, shards: [6, 9], sigil: .12, kind: 'human' },
    w6mannequin: { name: 'Mannequin of the Muses', draw: 'w6mannequin', mat: 'china', move: 'ground', hp: 66, spd: 66, hw: 13, hh: 66, dmg: 16, plans: ['w6square', 'w6compass', 'w6square'], wind: .6, cd: [0.88, 1.52], reach: 92, weight: .9, shards: [7, 10], kind: 'human' },
    w6fish:      { name: 'Collective Invention', draw: 'w6fish', mat: 'dream', move: 'ground', hp: 44, spd: 128, hw: 14, hh: 50, dmg: 13, plans: ['w6flop', 'w6kick', 'w6flop'], wind: .42, cd: [0.64, 1.28], reach: 46, weight: 1.15, shards: [5, 8], kind: 'creature' },
    // the things of the dream
    w6clock:     { name: 'Soft Clock', draw: 'w6clock', mat: 'dream', move: 'ground', hp: 40, spd: 52, hw: 18, hh: 30, dmg: 12, plans: ['w6hands', 'w6rewind', 'w6hands'], wind: .7, cd: [1.28, 2.08], ranged: 1, reach: 160, weight: 1.1, shards: [5, 8], sigil: .2, kind: 'creature' },
    w6lobster:   { name: 'Lobster Telephone', draw: 'w6lobster', mat: 'china', move: 'ground', hp: 58, spd: 92, hw: 20, hh: 30, dmg: 14, plans: ['w6pinch', 'w6ring', 'w6pinch'], wind: .55, cd: [0.88, 1.6], reach: 48, weight: 1, shards: [6, 9], sigil: .2, kind: 'creature' },
    w6skybird:   { name: 'Bird of Daylight', draw: 'w6skybird', mat: 'dream', move: 'fly', hover: 62, hp: 36, spd: 90, hw: 20, hh: 20, dmg: 12, plans: ['w6stoop', 'w6shower', 'w6stoop'], wind: .65, cd: [1.12, 1.92], ranged: 1, reach: 140, weight: 1.15, shards: [5, 8], kind: 'creature' },
    w6elephant:  { name: 'Stilt Elephant', draw: 'w6elephant', mat: 'dream', move: 'ground', hp: 170, spd: 34, hw: 26, hh: 132, dmg: 20, plans: ['w6stomp', 'w6obelisk', 'w6stomp'], wind: .8, cd: [1.28, 2.08], reach: 60, weight: .4, poise: 4, shards: [12, 16], sigil: .5 },
    // the crutches the Sleeper leans on (part of its fight; never sent anywhere else)
    w6crutch:    { name: 'Crutch', noRandom: 1, draw: 'w6crutch', mat: 'dream', move: 'ground', hp: 70, spd: 0, hw: 15, hh: 60, dmg: 0, plans: ['w6none'], wind: 1, cd: [9, 9], reach: 0, weight: 0, shards: [3, 5] },
  });

  BOSSES.sleeper = {
    close: 'w6none', name: 'The Sleeper', title: 'IT IS DREAMING ALL OF THIS', draw: 'w6sleeper', mat: 'dream', move: 'fly', hover: 60,
    hp: 1250, spd: 60, hw: 60, hh: 104, dmg: 20, wind: .6, cd: [.8, 1.3], weight: 0, poise: 0, ranged: 1, reach: 80,
    // (its whole fight is run by the 'w6sleep' rule: these are only the dreams each phase can send)
    p1: ['w6golconda', 'w6train', 'w6golconda'], p2: ['w6rook', 'w6bishop', 'w6knight'], p3: ['w6alarm', 'w6gaze', 'w6tears'],
  };

  // a little harder than the Courts, a little easier than the last world (see the matching entries in world.js and game.js)
  WORLD_DIFF.push({ hp: 2.75, boss: 1.85, dmg: 1.75, cd: .56 }); // (the dream is a clear step past the Courts: its foes hit hard and often)

  STAGES.push({ name: 'The Dreaming Shadow', sub: 'DREAMED BY WHAT SLEEPS BENEATH THE ABYSS', theme: 'dream', len: 2950,
    pods: [720, 1680], drop: [.92, .55],
    waves: [['w6bowler', 'w6fish', 'w6bowler', 'w6clock'],
      ['w6elephant*', 'w6mannequin', 'w6bowler', 'w6skybird', 'w6fish', 'w6mannequin'],
      ['w6lobster*', 'w6clock', 'w6mannequin', 'w6skybird', 'w6elephant', 'w6fish', 'w6bowler', 'w6lobster']],
    boss: 'sleeper' });

  ZONES.push({ trans: ['w6easel', 'w6bed'], zones: [
    { theme: 'dream', len: 2300, waves: [0, 1], pods: [720, 1680], mech: 'w6piazza' },
    { theme: 'dream2', len: 1750, waves: [2], pods: [1180], mech: 'w6melt', title: 'The Shore of Soft Clocks', sub: 'THE HOURS MELT HERE · GOLD ONES SLOW THEM, RED ONES HURRY THEM' },
    { theme: 'dreamBoss', len: 1000, waves: [], boss: 1, mech: 'w6sleep', title: 'The Bed of the Sleeper', sub: 'HUSH · SOMETHING VAST IS DREAMING ALL OF THIS' } ] });

  // saves from before this world was set into the road: a game that had finished the road keeps having finished it
  // (the old fifth world, Tir-na Nog'th, is now the sixth). The marker says this browser's saves count six worlds.
  try {
    if (localStorage.getItem('shadowroad-worlds') !== '6') {
      if (localStorage.getItem(SAVE_KEY) && save.stage >= 5) { save.stage += 1; persist(); }
      localStorage.setItem('shadowroad-worlds', '6');
    }
  } catch (e) {}
})();
// the attacks, rules and passages (art_w6.js) register now that world.js and zones.js have loaded; the entrances, the
// landmarks and the ending hook into files that load after this one, so they wait until every script has run
if (typeof window.w6Late === 'function') window.w6Late();
document.addEventListener('DOMContentLoaded', () => { if (typeof window.w6Dom === 'function') window.w6Dom(); });
