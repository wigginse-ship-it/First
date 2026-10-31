'use strict';
// World 4 data: STAGES / EDEF / BOSSES / ZONES entries (see art_w4.js for its art and attacks)
// THE COURTS OF CHAOS: the far end of the Black Road, where the road of fused glass runs out over the Abyss.
//   chaos     - The Black Road (waves 1-2)
//   chaos2    - The Thelbane Spires (wave 3: a shuffled roster and Borel, Duke of Chaos; the Abyss breathes)
//   chaosBoss - The Rim of the Abyss: the Ty'iga, Shifter of Shapes (wolf, then the Drake of the Courts, then the Mask of a Thousand Faces)
(() => {
  // the Ty'iga changes its whole body each phase, so how it moves and where it can be hit follow its current form
  const tyPhase = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.tyiga ? boss.phase || 1 : 1);
  const FORM = {
    1: { move: 'ground', hover: 0, tail: 0, reachDown: 0 },     // the great shadow-wolf
    2: { move: 'fly', hover: 56, tail: 0, reachDown: 52 },       // the Drake of the Courts, on slow wings over the arena
    3: { move: 'fly', hover: 34, tail: 0, reachDown: 34 },       // the Mask of a Thousand Faces, hanging over the floor in its mantle
  };
  // how close it closes before it starts each attack (it hunts up close as a wolf, keeps its distance as the others)
  const STANDOFF = { w4rake: 150, w4howl: 170, w4clap: 170, w4faces: 190, w4swoop: 230, w4flame: 200, w4gust: 170, w4maw: 60, w4beam: 170, w4spit: 200, w4bite: 120, w4breath: 60 };

  Object.assign(EDEF, {
    // humans of the Courts
    chknight: { name: 'Knight of the Courts', draw: 'human', look: 'w4knight', mat: 'flesh', move: 'ground', hp: 62, spd: 76, hw: 12, hh: 62, dmg: 12, plans: ['swing', 'w4blink', 'swing'], wind: .45, cd: [1.0, 1.8], reach: 50, weight: 1, shards: [6, 9], kind: 'human' },
    chadept:  { name: 'Logrus Adept', draw: 'human', look: 'w4adept', mat: 'flesh', move: 'ground', hp: 46, spd: 58, hw: 12, hh: 62, dmg: 11, plans: ['w4grasp', 'shoot', 'w4grasp'], wind: .7, cd: [1.5, 2.4], ranged: 1, reach: 150, weight: 1, shards: [6, 9], sigil: .15, kind: 'human' },
    chborel:  { name: 'Borel, Duke of Chaos', noRandom: 1, draw: 'human', look: 'w4borel', w4scale: 1.16, mat: 'flesh', move: 'ground', hp: 270, spd: 72, hw: 15, hh: 72, dmg: 15, plans: ['swing', 'w4blink', 'w4flurry', 'w4flurry'], wind: .5, cd: [.9, 1.6], reach: 56, weight: .55, poise: 4, shards: [20, 28], sigil: 1, kind: 'human' },
    // the beasts and demons of the Abyss
    chhound:  { name: 'Hound of Chaos', draw: 'w4hound', mat: 'fur', move: 'ground', hp: 40, spd: 112, hw: 20, hh: 30, dmg: 10, plans: ['pounce', 'bite', 'pounce'], wind: .38, cd: [.9, 1.7], reach: 40, weight: 1.15, shards: [4, 7], kind: 'creature' },
    cheye:    { name: 'Watcher of the Abyss', draw: 'w4eye', mat: 'spark', move: 'fly', hover: 62, hp: 36, spd: 56, hw: 16, hh: 26, dmg: 11, plans: ['shoot', 'volley', 'shoot'], wind: .7, cd: [1.5, 2.5], ranged: 1, weight: 1.1, shards: [5, 8], kind: 'creature' },
    chmoth:   { name: 'Eclipse Moth', draw: 'w4moth', mat: 'fur', move: 'fly', hover: 50, hp: 34, spd: 86, hw: 20, hh: 18, dmg: 10, plans: ['charge', 'shoot'], wind: .6, cd: [1.3, 2.3], ranged: 1, weight: 1.15, shards: [5, 8], kind: 'creature' },
    chbrute:  { name: 'Abyss Brute', draw: 'w4brute', mat: 'rock', move: 'ground', hp: 150, spd: 38, hw: 26, hh: 66, dmg: 19, plans: ['swing', 'slam', 'swing'], wind: .75, cd: [1.6, 2.6], reach: 54, weight: .5, poise: 3, shards: [12, 16], sigil: .5 },
  });

  BOSSES.tyiga = {
    close: 'w4maw', name: "The Ty'iga", title: 'SHIFTER OF SHAPES', draw: 'tyiga', mat: 'flesh',
    get move() { return FORM[tyPhase()].move; }, get hover() { return FORM[tyPhase()].hover; },
    get tail() { return FORM[tyPhase()].tail; },
    // the Drake's hit box always reaches the floor, so a blow from the ground still connects with it; while it is high those
    // blows only glance off (the strike rule in art_w4.js), and only a blow from the air lands in full
    get reachDown() { const p = tyPhase(); return p === 2 && boss ? Math.max(FORM[2].reachDown, boss.z) : FORM[p].reachDown; },
    get reach() { const p = typeof boss !== 'undefined' && boss && boss.def === BOSSES.tyiga ? boss.plan : null; return STANDOFF[p] || 70; },
    hp: 1450, spd: 64, hw: 50, hh: 66, dmg: 23, wind: .6, cd: [.45, .95], weight: .3, poise: 10, ranged: 1,
    // each form has its own attacks; the Howl of Many Shapes follows it from body to body, its pack growing with every shape it has worn
    p1: ['w4rake', 'w4leap', 'w4howl', 'w4rake', 'w4leap'],
    // the Drake keeps to the air, darting and wheeling, and comes down only to strike: a dive-bomb across the arena, wing-rakes
    // along the lanes, stoops out of a circle, a rain of burning feathers. Each leaves it low for a moment: your opening
    p2: ['w4swoop', 'w4embers', 'w4rakes', 'w4circle', 'w4flame', 'w4swoop', 'w4gust', 'w4embers', 'w4rakes', 'w4sweep', 'w4circle', 'w4howl'],
    // the Mask is warded, its eyes and mouth shut, except when it opens them to attack: the beam, the spit, the bite
    p3: ['w4beam', 'w4clap', 'w4spit', 'w4bite', 'w4gaze', 'w4beam', 'w4faces', 'w4bite', 'w4spit', 'w4howl', 'w4clap', 'w4beam', 'w4sweep'],
  };

  STAGES.push({ name: 'The Courts of Chaos', sub: 'THE END OF THE BLACK ROAD', theme: 'chaos', len: 2900,
    pods: [700, 1650], drop: [.9, .5],
    waves: [['chknight', 'chhound', 'cheye'],
      ['chbrute*', 'chadept', 'chhound', 'chknight', 'chmoth', 'chadept'],
      ['chborel', 'chknight*', 'chadept', 'chhound', 'cheye', 'chmoth', 'chbrute']], // the third is shuffled anew every time you enter the spires (see the 'w4breath' rule)
    boss: 'tyiga' });

  ZONES.push({ trans: ['w4logrus', 'w4trump'], zones: [
    { theme: 'chaos', len: 2300, waves: [0, 1], pods: [700, 1650], mech: 'w4road' }, // no rule here: the 'w4road' entry only paints the attacks of the Courts in depth
    { theme: 'chaos2', len: 1700, waves: [2], pods: [1180], mech: 'w4breath', title: 'The Thelbane Spires', sub: 'THE ABYSS BREATHES · WHAT RISES MUST FALL' },
    { theme: 'chaosBoss', len: 1000, waves: [], boss: 1, mech: 'w4rim', title: 'The Rim of the Abyss', sub: 'SOMETHING OF MANY SHAPES IS WAITING' } ] });
})();
// the attacks, the approach rule and the passages (art_w4.js) register now that world.js and zones.js have loaded
if (typeof window.w4Late === 'function') window.w4Late();
