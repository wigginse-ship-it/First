'use strict';
// REBMA, the city beneath the sea: STAGES / EDEF / BOSSES / ZONES entries for world 7 of eight (stage index 6), one of the
// three last worlds the Trumps can take Corwin to after the dream (see art_w7.js for its art, attacks, rules, passages and
// music, and w7_late.js for its relic and its ending).
// Rebma is Amber's reflection in the sea. You go down to it by Faiella-bionin, the great stair that runs down off the shore
// into the water, its torches burning under the waves; on the stair, and in the city, you breathe the sea. Its Pattern is
// Amber's turned about, and walking it once gave Corwin back his memory. Now Oberon is gone from Amber, and Rebma's
// reflection of the king, having no original left to follow, has taken the Pearl of Judgement (the sea's reflection of the
// Jewel of Judgement) and is walking the Pattern backward, to turn the sea over: Rebma to be the city and Amber the drowned
// reflection of it.
//   rebma      - Faiella-bionin, the Stair into the Sea (waves 1-2; the swell overhead: rule 'w7surge', the ninth wave)
//   rebma2     - The Streets of Rebma (wave 3, then the Sea-Bishop at the well; rule 'w7toll', the drowned bell and the vents)
//   rebmaBoss  - The Pattern of Rebma: the King in the Glass (rule 'w7glass': his three shapes)
(() => {
  if (STAGES.length !== 6) { console.error('data_w7.js: expected six worlds before Rebma, found ' + STAGES.length); return; }
  // what spills out of the drowned when they are cut: brine and pearl; sea-glass; green bronze; nacre
  MAT_COL.w7brine = ['#9CC8BE', '#E2F0EA', '#4E7E78']; MAT_SFX.w7brine = 'hit-goo';
  MAT_COL.w7glass = ['#BEE6DA', '#F2FBF6', '#6AA89A']; MAT_SFX.w7glass = 'hit-crystal';
  MAT_COL.w7bronze = ['#5E9A84', '#C89A52', '#2E4A40']; MAT_SFX.w7bronze = 'hit-metal';
  MAT_COL.w7nacre = ['#F2E8E0', '#C8D8E8', '#9A8AB0']; MAT_SFX.w7nacre = 'hit-crystal';

  Object.assign(EDEF, {
    // the people of the drowned city and its stair
    w7drowned: { name: 'Drowned of the Fleet', draw: 'w7drowned', mat: 'w7brine', move: 'ground', hp: 58, spd: 58, hw: 13, hh: 62, dmg: 14, plans: ['w7hook', 'w7hook', 'w7clutch'], wind: .6, cd: [1.0, 1.8], reach: 66, weight: 1, shards: [6, 9], kind: 'human' },
    w7lamp:    { name: 'Torchbearer of Faiella', draw: 'w7lamp', mat: 'w7brine', move: 'ground', hp: 54, spd: 56, hw: 12, hh: 72, dmg: 13, plans: ['w7flare', 'w7flare', 'w7sweep'], wind: .7, cd: [1.4, 2.2], ranged: 1, reach: 150, weight: 1, shards: [6, 9], sigil: .15, kind: 'human' },
    w7guard:   { name: 'Halberdier of Moire', draw: 'w7guard', mat: 'w7nacre', move: 'ground', hp: 66, spd: 70, hw: 14, hh: 68, dmg: 15, plans: ['w7glaive', 'w7reap', 'w7glaive'], wind: .55, cd: [.9, 1.6], reach: 92, weight: .9, shards: [7, 10], sigil: .15, kind: 'human' },
    // the creatures of the sea-maps
    w7siren:   { name: 'Siren of the Stair', draw: 'w7siren', mat: 'w7nacre', move: 'fly', hover: 44, hp: 42, spd: 72, hw: 15, hh: 40, dmg: 12, plans: ['w7song', 'w7bubble', 'w7song'], wind: .8, cd: [1.6, 2.5], ranged: 1, reach: 150, weight: 1.1, shards: [5, 8], sigil: .2, kind: 'creature' },
    w7hippo:   { name: 'Hippocamp Rider', draw: 'w7hippo', mat: 'w7nacre', move: 'fly', hover: 26, hp: 54, spd: 104, hw: 24, hh: 48, dmg: 15, plans: ['w7gallop', 'w7lance', 'w7gallop'], wind: .55, cd: [1.1, 1.9], reach: 64, weight: .9, shards: [6, 9], kind: 'creature' },
    w7triton:  { name: 'Bronze Triton', draw: 'w7triton', mat: 'w7bronze', move: 'ground', hp: 96, spd: 62, hw: 18, hh: 74, dmg: 16, plans: ['w7conch', 'w7trident', 'w7conch'], wind: .75, cd: [1.2, 2.0], reach: 74, weight: .7, poise: 2, shards: [8, 12], sigil: .3 },
    // a knight of Alexander's kind, gone down into the sea in a bell of glass: light blows glance off it until it cracks
    w7bellk:   { name: 'Knight in the Glass Bell', draw: 'w7bellk', mat: 'w7glass', move: 'ground', hp: 180, spd: 40, hw: 24, hh: 74, dmg: 18, plans: ['w7bellslam', 'w7bellroll', 'w7bellslam'], wind: .85, cd: [1.3, 2.1], reach: 58, weight: .35, poise: 5, shards: [12, 16], sigil: .5 },
    // he keeps the well that goes down to the Pattern, and will not let you by (see the 'w7toll' rule)
    w7bishop:  { name: 'The Sea-Bishop', noRandom: 1, draw: 'w7bishop', mat: 'w7nacre', move: 'ground', hp: 360, spd: 70, hw: 26, hh: 78, dmg: 17, plans: ['w7crozier', 'w7bless', 'w7plunge', 'w7crozier'], wind: .6, cd: [.8, 1.4], reach: 84, weight: .4, poise: 7, shards: [26, 34], sigil: 1, kind: 'creature' },
  });

  // (his whole fight is run by the 'w7glass' rule: these lists only name what each of his shapes can do)
  BOSSES.w7king = {
    close: 'w7none', name: 'The King in the Glass', title: "OBERON'S REFLECTION · KING OF NOTHING", draw: 'w7king', mat: 'w7glass', move: 'fly', hover: 30,
    hp: 1050, spd: 60, hw: 34, hh: 120, dmg: 21, wind: .6, cd: [.8, 1.3], weight: 0, poise: 0, ranged: 1, reach: 80,
    p1: ['w7tines', 'w7undertow', 'w7anchors', 'w7sweep'], p2: ['w7spout', 'w7whirl', 'w7drain'], p3: ['w7mirror', 'w7shards', 'w7unwind', 'w7breaker'],
  };

  // one of the last worlds: harder than Tir-na Nog'th (see the matching entries in world.js and game.js)
  WORLD_DIFF.push({ hp: 4.5, boss: 2.45, dmg: 4.1, cd: .48 });

  STAGES.push({ name: 'Rebma', sub: "AMBER'S REFLECTION BENEATH THE SEA · DOWN FAIELLA-BIONIN", theme: 'rebma', len: 3000,
    pods: [760, 1700], drop: [.95, .6],
    waves: [['w7drowned', 'w7lamp', 'w7drowned', 'w7siren'],
      ['w7bellk*', 'w7guard', 'w7lamp', 'w7hippo', 'w7drowned', 'w7siren', 'w7guard'],
      ['w7triton*', 'w7guard', 'w7hippo', 'w7bellk', 'w7siren', 'w7lamp', 'w7drowned', 'w7triton']],
    boss: 'w7king' });

  ZONES.push({ trans: ['w7gate', 'w7well'], zones: [
    { theme: 'rebma', len: 2400, waves: [0, 1], pods: [760, 1700], mech: 'w7surge' },
    { theme: 'rebma2', len: 1900, waves: [2], pods: [1200], mech: 'w7toll', title: 'The Streets of Rebma', sub: 'THE DROWNED BELL TOLLS · BE OFF THE GROUND WHEN IT STRIKES, OR RIDE THE BUBBLES' },
    { theme: 'rebmaBoss', len: 1000, waves: [], boss: 1, mech: 'w7glass', title: 'The Pattern of Rebma', sub: 'THE KING IN THE GLASS IS WALKING IT BACKWARD' } ] });

  // the Trump of Rebma, for the choice after the dream (branch.js frames it and turns it up)
  (window.BRANCHES = window.BRANCHES || []).push({
    stage: 6, id: 'rebma', name: 'REBMA',
    line: 'Rebma, the drowned mirror of Amber: its Pattern gave him back his memory once, and now something down there is walking it backward.',
    draw(ctx2, w, h, t) { if (window.W7 && W7.cardDraw) W7.cardDraw(ctx2, w, h, t); },
    relic: { key: 'w7relic', name: 'The Pearl of Judgement', desc: "The sea's reflection of the Jewel: dodges leave an undertow, finishing blows raise a wave, and you can kick off the water once in the air. Far stronger in New Game+." },
  });
})();
// the attacks, rules and passages (art_w7.js) register now that world.js and zones.js have loaded; the entrances, the
// landmarks and the late hooks wait until every script has run
if (typeof window.w7Late === 'function') window.w7Late();
document.addEventListener('DOMContentLoaded', () => { if (typeof window.w7Dom === 'function') window.w7Dom(); });
