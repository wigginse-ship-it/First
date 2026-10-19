'use strict';
// World 5 data: STAGES / EDEF / BOSSES / ZONES entries (see art_w5.js for its art, attacks, rules, passages and ending)
// TIR-NA NOG'TH: the ghost of Amber in the sky, which is there only by moonlight. You climb to it by a stair of
// moonlight; at dawn it fades, and so does the stair. This is the last world of the road.
//   moon      - The Stair of Moonlight (waves 1-2; the dawn comes up behind you: rule 'w5dawn')
//   moon2     - The Streets of Tir-na Nog'th (wave 3, then the Sphinx and her riddle; cloud shadows: rule 'w5cloud')
//   moonBoss  - The Moon Throne: the Phantom of Benedict (the one-armed master, the Silver Arm, the Phantom unbound)
(() => {
  // the Phantom's three shapes fight at different distances: how close he closes before each attack
  const STANDOFF = { w5lunge: 230, w5feint: 70, w5guard: 96, w5grip: 220, w5cross: 140, w5steps: 170, w5blades: 160, w5wheel: 50 };
  const benPlan = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.benedict ? boss.plan : null);
  // the ghosts of the city bleed silver when they are cut
  MAT_COL.ghost = ['#C8D4EC', '#EEF2FA', '#8A9AC8']; MAT_SFX.ghost = 'hit-crystal';

  Object.assign(EDEF, {
    // the people of the ghost city
    w5courtier: { name: 'Lantern Courtier', draw: 'w5courtier', mat: 'ghost', move: 'ground', hp: 52, spd: 60, hw: 12, hh: 64, dmg: 12, plans: ['w5moonfire', 'w5moonfire', 'w5censer'], wind: .7, cd: [1.4, 2.3], ranged: 1, reach: 130, weight: 1, shards: [6, 9], sigil: .15, kind: 'ghost' },
    w5reflect:  { name: 'Colorless Reflection', draw: 'w5reflect', mat: 'ghost', move: 'ground', hp: 62, spd: 84, hw: 12, hh: 62, dmg: 13, plans: ['w5mimic', 'w5mimic', 'swing'], wind: .55, cd: [1.0, 1.8], reach: 56, weight: 1, shards: [6, 9], kind: 'ghost' },
    w5knave:    { name: 'Knave of Moons', draw: 'w5knave', mat: 'ghost', move: 'ground', hp: 58, spd: 72, hw: 14, hh: 58, dmg: 13, plans: ['w5flip', 'w5flip', 'w5deal'], wind: .5, cd: [1.1, 2.0], reach: 110, weight: 1, shards: [6, 9], sigil: .2, kind: 'ghost' },
    w5statue:   { name: 'Weeping Watcher', draw: 'w5statue', mat: 'rock', move: 'ground', hp: 175, spd: 150, hw: 20, hh: 70, dmg: 18, plans: ['w5seize'], wind: .3, cd: [.5, 1.0], reach: 40, weight: .4, poise: 4, shards: [12, 16], sigil: .5 },
    // its beasts
    w5hound:    { name: 'Hound of the Wild Hunt', draw: 'w5hound', mat: 'fur', move: 'ground', hp: 46, spd: 124, hw: 20, hh: 30, dmg: 11, plans: ['w5course', 'pounce', 'bite'], wind: .42, cd: [.9, 1.7], reach: 40, weight: 1.15, shards: [5, 8], kind: 'creature' },
    w5moth:     { name: 'Moonmoth', draw: 'w5moth', mat: 'fur', move: 'fly', hover: 54, hp: 36, spd: 92, hw: 16, hh: 18, dmg: 9, plans: ['w5latch', 'w5latch', 'w5dust'], wind: .6, cd: [1.4, 2.4], ranged: 1, reach: 130, weight: 1.15, shards: [5, 8], kind: 'creature' },
    // she waits at the end of the street with a riddle; answered wrong, she fights (see the 'w5cloud' rule)
    w5sphinx:   { name: 'The Sphinx', noRandom: 1, draw: 'w5sphinx', mat: 'rock', move: 'ground', hp: 390, spd: 80, hw: 34, hh: 56, dmg: 17, plans: ['pounce', 'w5wings', 'w5glyphs', 'pounce'], wind: .6, cd: [.9, 1.6], reach: 70, weight: .4, poise: 7, shards: [26, 34], sigil: 1, kind: 'creature' },
  });

  BOSSES.benedict = {
    close: 'w5wheel', name: 'The Phantom of Benedict', title: 'MASTER OF ARMS OF AMBER', draw: 'w5benedict', mat: 'ghost', move: 'ground',
    get reach() { return STANDOFF[benPlan()] || 70; },
    hp: 1300, spd: 72, hw: 24, hh: 84, dmg: 21, wind: .6, cd: [.6, 1.1], weight: .3, poise: 10, ranged: 1,
    // one shape after another: the master as he is, the Silver Arm, the Phantom unbound as the dawn takes him
    p1: ['w5lunge', 'w5feint', 'w5guard', 'w5lunge', 'w5feint'],
    p2: ['w5grip', 'w5cross', 'w5lunge', 'w5guard', 'w5grip', 'w5cross'],
    p3: ['w5steps', 'w5blades', 'w5cross', 'w5grip', 'w5steps', 'w5blades', 'w5lunge'],
  };

  // the last world is harder again, and pays better (see the matching entries in world.js and game.js)
  WORLD_DIFF.push({ hp: 2.85, boss: 1.9, dmg: 1.55, cd: .64 });

  STAGES.push({ name: "Tir-na Nog'th", sub: 'THE CITY IN THE SKY · THE LAST SHADOW', theme: 'moon', len: 3000,
    pods: [760, 1700], drop: [.95, .6],
    waves: [['w5courtier', 'w5hound', 'w5moth', 'w5hound'],
      ['w5statue*', 'w5courtier', 'w5reflect', 'w5hound', 'w5knave', 'w5moth', 'w5courtier'],
      ['w5knave*', 'w5reflect', 'w5statue', 'w5courtier', 'w5hound', 'w5moth', 'w5reflect', 'w5hound']],
    boss: 'benedict' });

  ZONES.push({ trans: ['w5moonpath', 'w5mist'], zones: [
    { theme: 'moon', len: 2400, waves: [0, 1], pods: [760, 1700], mech: 'w5dawn' },
    { theme: 'moon2', len: 1800, waves: [2], pods: [1200], mech: 'w5cloud', title: "The Streets of Tir-na Nog'th", sub: 'THE CITY IS ONLY WHERE THE MOON FALLS' },
    { theme: 'moonBoss', len: 1000, waves: [], boss: 1, mech: 'w5throne', title: 'The Moon Throne', sub: 'A GHOST GUARDS THE EMPTY THRONE' } ] });
})();
// the attacks, rules, passages and music (art_w5.js) register now that world.js and zones.js have loaded; the entrances,
// landmarks and the ending hook into files that load after this one, so they wait until every script has run
if (typeof window.w5Late === 'function') window.w5Late();
document.addEventListener('DOMContentLoaded', () => { if (typeof window.w5Dom === 'function') window.w5Dom(); });
