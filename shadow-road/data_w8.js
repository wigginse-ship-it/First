'use strict';
// LORRAINE and the BLACK CIRCLE: STAGES / EDEF / BOSSES / ZONES entries for world 8 of eight (stage index 7), one of the
// three last worlds the Trumps can take Corwin to after the dream (art_w8.js has its art, attacks, rules, passages and
// music; w8_late.js its hooks, its relic and its ending).
// Lorraine is a shadow-kingdom where a ring of dead land, the Black Circle, grows outward a little every season, and
// things come out of it to take the villages at its edge. Corwin fought it once beside Ganelon, and lost men there. He
// knows what feeds it: the curse he laid on Amber, blind, in Eric's dungeon. It took root here first. He goes back to
// unmake what he made.
//   lorraine     - The Winter Fields (waves 1-2; villagers flee across the field and the dead get up grey: rule 'w8flight')
//   lorraine2    - The Edge of the Circle (waves 3-4, the Hangman last; the Circle breathes across the field: rule 'w8edge')
//   lorraineBoss - The Heart of the Circle: the Goat-Lord in four shapes (rule 'w8heart')
// Its relic is the Horn of Lorraine (save.w8relic): filled by landed blows, its blast staggers and breaks guards.
(() => {
  if (STAGES.length !== 7) { console.error('data_w8.js: Lorraine is stage index 7, but ' + STAGES.length + ' stages are registered before it; not loaded'); return; }
  // the Circle's things are grey stuff all through: ash comes out of them when they are cut
  MAT_COL.ash = ['#8E887E', '#C8C2B4', '#3A3632']; MAT_SFX.ash = 'hit-flesh';
  MAT_COL.bronze = ['#C89A48', '#F2D890', '#5A8A70']; MAT_SFX.bronze = 'hit-metal';
  MAT_COL.shell = ['#F2EAD8', '#E8B040', '#C8A880']; MAT_SFX.shell = 'hit-crystal';

  Object.assign(EDEF, {
    // what the Circle makes of the people it takes, and the soldiers it has taken
    w8hollow:  { name: 'Hollow', draw: 'w8hollow', mat: 'ash', move: 'ground', hp: 62, spd: 58, hw: 12, hh: 60, dmg: 13, plans: ['w8flail', 'w8grab', 'w8flail'], wind: .6, cd: [1.0, 1.8], reach: 50, weight: 1, shards: [5, 8], kind: 'human' },
    w8halberd: { name: 'Billman of the Circle', draw: 'w8halberd', mat: 'flesh', move: 'ground', hp: 72, spd: 70, hw: 13, hh: 66, dmg: 14, plans: ['w8thrust', 'w8hook', 'w8thrust'], wind: .55, cd: [1.0, 1.7], reach: 100, weight: .9, shards: [6, 9], sigil: .15, kind: 'human' },
    w8xbow:    { name: 'Pavise Crossbowman', draw: 'w8xbow', mat: 'flesh', move: 'ground', hp: 70, spd: 56, hw: 13, hh: 62, dmg: 14, plans: ['w8bolt', 'w8bolt'], wind: .85, cd: [1.4, 2.3], ranged: 1, reach: 210, weight: 1, shards: [6, 9], sigil: .2, kind: 'human' },
    w8flag:    { name: 'Flagellant', draw: 'w8flag', mat: 'flesh', move: 'ground', hp: 52, spd: 98, hw: 12, hh: 64, dmg: 9, plans: ['w8lash', 'w8lash', 'w8frenzy'], wind: .45, cd: [.8, 1.5], reach: 74, weight: 1.1, shards: [5, 8], kind: 'human' },
    // Bosch's creatures, come out of it
    w8bell:    { name: 'Bellman', draw: 'w8bell', mat: 'bronze', move: 'ground', hp: 190, spd: 34, hw: 20, hh: 64, dmg: 19, plans: ['w8toll', 'swing', 'w8bdrop'], wind: .75, cd: [1.4, 2.4], reach: 64, weight: .4, poise: 5, shards: [12, 16], sigil: .5 },
    w8crow:    { name: 'Funnel-Hat Crow', draw: 'w8crow', mat: 'fur', move: 'fly', hover: 64, hp: 42, spd: 88, hw: 18, hh: 26, dmg: 12, plans: ['w8peck', 'w8murder', 'w8peck'], wind: .6, cd: [1.3, 2.2], ranged: 1, reach: 150, weight: 1.15, shards: [5, 8], kind: 'creature' },
    w8egg:     { name: 'Walking Egg', draw: 'w8egg', mat: 'shell', move: 'ground', hp: 64, spd: 122, hw: 15, hh: 62, dmg: 13, plans: ['w8kick', 'w8roll', 'w8kick'], wind: .5, cd: [.9, 1.6], reach: 48, weight: 1, shards: [6, 9], kind: 'creature' },
    // he waits at the gallows at the end of the edge (the last wave there; never sent anywhere else)
    w8hangman: { name: 'The Hangman of the Circle', noRandom: 1, draw: 'w8hangman', mat: 'flesh', move: 'ground', hp: 300, spd: 72, hw: 18, hh: 88, dmg: 18, plans: ['w8noose', 'w8axe', 'w8gallows', 'w8sweep', 'w8axe'], wind: .65, cd: [.9, 1.5], reach: 82, weight: .4, poise: 7, shards: [26, 34], sigil: 1, kind: 'human' },
  });

  // the Goat-Lord keeps his shape in e.w8form (1-4; art_w8.js's 'w8heart' rule); world.js only ever sees phases 1-3
  const form = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.w8goat ? boss.w8form || 1 : 1);
  const PLANS = {
    1: ['w8crook', 'w8bind', 'w8butt', 'w8crook', 'w8bind'],     // the Goat-Lord
    2: ['w8bales', 'w8mill', 'w8bales', 'w8mill'],                 // the Tithe of Lorraine (thrown from his engine)
    3: ['w8gore', 'w8hands', 'w8bind2', 'w8close', 'w8hands', 'w8gore'], // the Horned Gate
    4: ['w8curse', 'w8word', 'w8curse'],                            // your curse
  };
  const CLOSE = { 1: 'w8bleat', 2: 'w8bleat', 3: 'w8bleat', 4: 'w8bleat' };
  const STANDOFF = { w8crook: 110, w8bind: 220, w8bind2: 200, w8butt: 260, w8gore: 210, w8hands: 200, w8close: 160, w8bleat: 40, w8curse: 60, w8word: 60, w8bales: 60, w8mill: 60 };
  BOSSES.w8goat = {
    get close() { return CLOSE[form()]; }, name: 'The Goat-Lord', title: 'HE CAME IN BY YOUR CURSE', draw: 'w8goat', mat: 'flesh', move: 'ground',
    get reach() { const p = typeof boss !== 'undefined' && boss && boss.def === BOSSES.w8goat ? boss.plan : null; return STANDOFF[p] || 90; },
    hp: 1250, spd: 66, hw: 26, hh: 98, dmg: 22, wind: .6, cd: [.6, 1.1], weight: .3, poise: 10, ranged: 1,
    get p1() { return PLANS[form()]; }, get p2() { return PLANS[form()]; }, get p3() { return PLANS[form()]; },
    plansOf: PLANS,
  };

  // the hardest of the three last worlds to walk into: a step past Tir-na Nog'th
  WORLD_DIFF.push({ hp: 4.4, boss: 2.4, dmg: 4.0, cd: .48 });

  STAGES.push({ name: 'Lorraine', sub: 'THE BLACK CIRCLE IS GROWING', theme: 'lorraine', len: 3100,
    pods: [760, 1700], drop: [.95, .6],
    waves: [['w8hollow', 'w8halberd', 'w8crow', 'w8hollow'],
      ['w8bell*', 'w8xbow', 'w8hollow', 'w8flag', 'w8halberd', 'w8egg', 'w8crow'],
      ['w8flag*', 'w8xbow', 'w8egg', 'w8bell', 'w8halberd', 'w8crow', 'w8hollow', 'w8xbow'],
      ['w8hangman', 'w8hollow', 'w8hollow']],
    boss: 'w8goat' });

  ZONES.push({ trans: ['w8bells', 'w8circle'], zones: [
    { theme: 'lorraine', len: 2500, waves: [0, 1], pods: [760, 1700], mech: 'w8flight' },
    { theme: 'lorraine2', len: 2300, waves: [2, 3], pods: [1100], mech: 'w8edge', title: 'The Edge of the Circle', sub: 'WHERE IT TOUCHES, THE WORLD GOES GREY' },
    { theme: 'lorraineBoss', len: 1000, waves: [], boss: 1, mech: 'w8heart', title: 'The Heart of the Circle', sub: 'THE HOLE THEY CAME IN BY' } ] });

  // the Trump: the CHOICE deck lays this card face up after the dream
  (window.BRANCHES = window.BRANCHES || []).push({
    stage: 7, id: 'lorraine', name: 'LORRAINE',
    line: 'The Black Circle is eating Lorraine a village at a time, and Corwin knows whose curse it grew from: he goes back to unmake what he made, where Ganelon once held the line.',
    draw(ctx2, w, h, t) { if (window.W8 && W8.card) W8.card(ctx2, w, h, t); },
    relic: { key: 'w8relic', name: 'The Horn of Lorraine', desc: 'Ganelon\'s war-horn, taken back from the Goat-Lord. Landed blows fill it (the gold HORN bar); full, it sounds by itself when a foe is in front of you: a cone of sound that does little damage but staggers what it catches, breaks two pips of an armored guard and shakes a boss\'s poise. In New Game+ it fills a little faster, reaches further, staggers longer and breaks three pips.' },
  });
})();
// the attacks, rules, passages and music (art_w8.js) register now that world.js and zones.js have loaded
if (window.W8 && typeof W8.late === 'function' && STAGES.some(s => s.theme === 'lorraine')) W8.late();
