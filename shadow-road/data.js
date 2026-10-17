'use strict';
// ---------- weapons ----------
// Each weapon is a combo tree. Keys are the inputs so far: L = Attack, H = Heavy,
// D = attack while running, DH = heavy while running, A = attack in the air, R = attack out of a dodge roll.
// A move: dur (s), h = active window as a fraction of dur, x0..x1 = reach in front, depth = lane tolerance,
// dmg, kb = knockback speed, launch = upward speed given to the enemy, lunge/hop = how the player moves,
// rot = full-body spin over the move, arc = weapon swing angles, around = hits both sides,
// multi = re-hit interval, bounce = ground bounce, shock = shockwave radius on impact, power 0-2 = hit weight.
const P_ = Math.PI;
const WEAPONS = {
  fists: { name: 'Fists', reach: 14, look: 'fists', desc: 'Fast, close, never runs out.',
    tree: {
      L:    { dur: .2,  h: [.3, .6], x0: 0, x1: 34, dmg: 6, kb: 50, arc: [.9, -.15], lunge: 70 },
      LL:   { dur: .22, h: [.3, .6], x0: 0, x1: 34, dmg: 7, kb: 50, arc: [.9, -.15], lunge: 70 },
      LLL:  { dur: .4,  h: [.3, .65], x0: 0, x1: 40, dmg: 12, kb: 300, kick: 1, lunge: 120, hop: 170, power: 1 },
      H:    { dur: .48, h: [.25, .55], x0: 0, x1: 34, dmg: 13, kb: 60, launch: 430, arc: [1.6, -1.8], hop: 210, power: 1 },
      D:    { dur: .44, h: [.1, .7], x0: 0, x1: 40, dmg: 12, kb: 300, kick: 1, lunge: 420, hop: 190, power: 1 },
      R:    { dur: .5,  h: [.2, .6], x0: 0, x1: 36, dmg: 14, kb: 80, launch: 380, kick: 1, lunge: 220, hop: 240, rot: -TAU * .5, power: 1 },
      A:    { dur: .5,  h: [.1, .95], x0: 0, x1: 38, dmg: 10, kb: 180, kick: 1, dive: 1, power: 1 },
      LH:   { lvl: 2, name: 'Shoulder Bash', desc: 'Charge shoulder-first and slam enemies into the edge of the screen.', how: 'Attack, Heavy', dur: .45, h: [.15, .7], x0: 0, x1: 38, dmg: 15, kb: 420, lunge: 460, arc: [.2, .2], power: 2, wall: 1 },
      LLH:  { lvl: 3, name: 'Whirlwind Kick', desc: 'Leap into a spinning kick that hits everything around you, again and again.', how: 'Attack ×2, Heavy', dur: .62, h: [.15, .85], x0: 0, x1: 42, dmg: 6, kb: 220, kick: 1, around: 1, multi: .11, hop: 260, rot: -TAU, power: 1 },
      HL:   { lvl: 4, name: 'Sky Hammer', desc: 'After the uppercut launches them, jump after them and smash them back down so they bounce.', how: 'Heavy, Attack', dur: .55, h: [.55, .8], x0: 0, x1: 40, dmg: 18, kb: 120, arc: [-2.6, 1.4], hop: 280, bounce: 1, power: 2 },
      DH:   { lvl: 5, name: 'Meteor Fist', desc: 'A flying punch at full sprint that sends a shockwave through the crowd.', how: 'Heavy while running', dur: .5, h: [.15, .7], x0: 0, x1: 42, dmg: 26, kb: 520, lunge: 560, arc: [0, 0], power: 2, shock: 60, wall: 1 },
    } },
  hammer: { name: 'Hammer', reach: 46, look: 'hammer', desc: 'Slow and crushing. Every heavy shakes the ground.',
    tree: {
      L:    { dur: .44, h: [.4, .62], x0: 0, x1: 62, dmg: 15, kb: 200, arc: [-2, 1.2], lunge: 50, power: 1 },
      LL:   { dur: .5,  h: [.4, .62], x0: 0, x1: 62, dmg: 17, kb: 260, arc: [1.2, -1.8], lunge: 60, power: 1 },
      H:    { dur: .64, h: [.45, .62], x0: 0, x1: 66, dmg: 24, kb: 90, launch: 330, arc: [-2.7, 1.5], hop: 140, bounce: 1, shock: 70, power: 2 },
      D:    { dur: .56, h: [.1, .6], x0: 0, x1: 60, dmg: 18, kb: 360, arc: [1.4, 1.4], lunge: 440, crouch: 1, power: 1 },
      R:    { dur: .6,  h: [.25, .7], x0: 0, x1: 64, dmg: 22, kb: 300, arc: [-P_, P_], around: 1, rot: -TAU, lunge: 120, power: 2 },
      A:    { dur: .55, h: [.15, .97], x0: 0, x1: 54, dmg: 22, kb: 160, arc: [-2, 1.5], dive: 1, shock: 64, power: 2 },
      LLL:  { lvl: 2, name: 'Hammer Cyclone', desc: 'Spin with the hammer held out, hitting everyone around you many times.', how: 'Attack ×3', dur: .85, h: [.12, .88], x0: 0, x1: 62, dmg: 9, kb: 200, arc: [-P_, 3 * P_], around: 1, multi: .13, lunge: 140, power: 1 },
      LH:   { lvl: 3, name: 'Golf Swing', desc: 'An upward swing that launches enemies sky-high, ready for juggling.', how: 'Attack, Heavy', dur: .55, h: [.35, .6], x0: 0, x1: 62, dmg: 20, kb: 80, launch: 560, arc: [2.3, -2.6], power: 2 },
      HH:   { lvl: 4, name: 'Earthquake', desc: 'Leap, flip and slam down hard enough to launch everything near you.', how: 'Heavy, Heavy', dur: .78, h: [.62, .78], x0: 0, x1: 70, dmg: 28, kb: 200, launch: 380, arc: [-2.8, 1.5], hop: 320, rot: -TAU, around: 1, shock: 140, power: 2 },
      LLH:  { lvl: 5, name: 'Comet Drop', desc: 'Somersault high into the air and come down like a falling star.', how: 'Attack ×2, Heavy', dur: .8, h: [.62, .8], x0: 0, x1: 70, dmg: 38, kb: 160, launch: 300, arc: [-2.8, 1.5], hop: 420, rot: TAU, lunge: 220, bounce: 1, shock: 110, power: 2 },
    } },
  staff: { name: 'Bowstaff', reach: 54, look: 'staff', desc: 'Long reach, spins that hit all around, and big acrobatics.',
    tree: {
      L:    { dur: .26, h: [.3, .6], x0: 8, x1: 72, dmg: 7, kb: 50, arc: [.25, -.05], lunge: 50 },
      LL:   { dur: .28, h: [.3, .6], x0: 0, x1: 68, dmg: 7, kb: 50, arc: [-1.4, 1.0], lunge: 50 },
      LLL:  { dur: .28, h: [.3, .6], x0: 0, x1: 68, dmg: 8, kb: 60, arc: [1.0, -1.4], lunge: 50 },
      LLLL: { dur: .5,  h: [.2, .8], x0: 0, x1: 70, dmg: 13, kb: 260, arc: [-P_, P_], around: 1, hop: 150, power: 1 },
      H:    { dur: .55, h: [.3, .75], x0: 0, x1: 70, dmg: 12, kb: 90, launch: 320, arc: [-P_, 1.5 * P_], around: 1, depth: 24, power: 1 },
      D:    { dur: .62, h: [.35, .85], x0: 0, x1: 46, dmg: 18, kb: 220, launch: 340, kick: 1, lunge: 400, hop: 320, power: 1 },
      R:    { dur: .55, h: [.2, .8], x0: 0, x1: 68, dmg: 8, kb: 140, arc: [-P_, 2 * P_], around: 1, multi: .12, hop: 200, lunge: 260, rot: -TAU, power: 1 },
      A:    { dur: .5,  h: [.1, .9], x0: 0, x1: 66, dmg: 6, kb: 120, arc: [-1.6, 4.6], around: 1, multi: .12 },
      LH:   { lvl: 2, name: 'Rising Spiral', desc: 'Corkscrew upward, carrying enemies into the air with you.', how: 'Attack, Heavy', dur: .62, h: [.15, .8], x0: 0, x1: 66, dmg: 7, kb: 60, launch: 440, arc: [-P_, 3 * P_], around: 1, multi: .12, hop: 380, rot: -TAU, power: 1 },
      HL:   { lvl: 3, name: 'Pole Flip', desc: 'Vault over enemies and crack them down from the other side.', how: 'Heavy, Attack', dur: .62, h: [.5, .75], x0: 0, x1: 70, dmg: 18, kb: 160, arc: [-2, 1.4], hop: 300, rot: TAU, lunge: 260, bounce: 1, power: 1 },
      LLH:  { lvl: 4, name: 'Thousand Strikes', desc: 'A blur of rapid long-range jabs. Plant your feet and keep them back.', how: 'Attack ×2, Heavy', dur: .9, h: [.08, .85], x0: 8, x1: 76, dmg: 4, kb: 40, arc: [.15, -.15], multi: .07, lunge: 30, power: 0 },
      HH:   { lvl: 5, name: 'Storm Vault', desc: 'Pole-vault into a huge flying kick that launches anything it hits.', how: 'Heavy, Heavy', dur: .7, h: [.35, .8], x0: 0, x1: 48, dmg: 24, kb: 260, launch: 520, kick: 1, lunge: 320, hop: 440, rot: -TAU, power: 2 },
    } },
  sword: { name: 'Great Sword', reach: 64, look: 'sword', charge: true, desc: 'Huge damage. Hold Heavy to charge, release to strike.',
    tree: {
      L:    { dur: .5,  h: [.4, .62], x0: 0, x1: 84, dmg: 18, kb: 200, arc: [-1.9, 1.1], lunge: 50, depth: 20, power: 1 },
      LL:   { dur: .6,  h: [.4, .62], x0: 0, x1: 86, dmg: 22, kb: 300, arc: [1.1, -1.7], lunge: 60, depth: 20, power: 1 },
      D:    { dur: .55, h: [.1, .6], x0: 0, x1: 88, dmg: 22, kb: 420, arc: [.1, .1], lunge: 480, power: 1, wall: 1 },
      R:    { dur: .6,  h: [.3, .7], x0: 0, x1: 86, dmg: 28, kb: 320, arc: [-P_, P_], around: 1, rot: TAU, lunge: 160, power: 2, depth: 22 },
      A:    { dur: .55, h: [.15, .97], x0: 0, x1: 70, dmg: 24, kb: 160, arc: [-2, 1.5], dive: 1, shock: 60, bounce: 1, power: 2 },
      LLL:  { lvl: 2, name: 'Wheel Cleave', desc: 'A full spinning cut that hits both sides at once.', how: 'Attack ×3', dur: .62, h: [.25, .7], x0: 0, x1: 86, dmg: 26, kb: 320, arc: [-P_, P_], around: 1, hop: 160, rot: -TAU, power: 2 },
      LH:   { lvl: 3, name: 'Rising Slash', desc: 'Leap upward with a rising cut that launches enemies.', how: 'Attack, Heavy', dur: .55, h: [.2, .55], x0: 0, x1: 80, dmg: 22, kb: 80, launch: 500, arc: [1.6, -2.3], hop: 320, power: 1 },
      HL:   { lvl: 5, name: 'Helm Splitter', desc: 'Right after a charged swing, flip into the air and split the ground in front of you.', how: 'Charged Heavy, Attack', dur: .75, h: [.55, .75], x0: 0, x1: 86, dmg: 44, kb: 160, arc: [-2.7, 1.5], hop: 340, rot: TAU, lunge: 170, bounce: 1, shock: 90, power: 2 },
    },
    charged: [
      { dur: .5,  h: [.35, .6], x0: 0, x1: 84, dmg: 18, kb: 200, arc: [-2, 1.2], depth: 20, power: 1 },
      { dur: .55, h: [.35, .6], x0: 0, x1: 92, dmg: 34, kb: 300, launch: 220, arc: [-2.2, 1.3], depth: 22, power: 2 },
      { dur: .6,  h: [.35, .6], x0: 0, x1: 100, dmg: 54, kb: 420, launch: 340, arc: [-2.4, 1.4], depth: 28, power: 2, shock: 80 },
      { dur: .65, h: [.35, .6], x0: 0, x1: 100, dmg: 54, kb: 420, launch: 340, arc: [-2.4, 1.4], depth: 28, power: 2, shock: 80, wave: 1 },
    ],
    extra: [{ lvl: 4, name: 'Shadow Cleave', desc: 'Charge past the third flash and your swing sends a wave of shadow down the street.', how: 'Hold Heavy past the third flash' }] },
};
const WEAPON_ORDER = ['fists', 'hammer', 'staff', 'sword'];
for (const id of WEAPON_ORDER) for (const k in WEAPONS[id].tree) WEAPONS[id].tree[k].key = k;
function unlockList(id) {
  const w = WEAPONS[id], list = [];
  for (const k in w.tree) if (w.tree[k].lvl) list.push(w.tree[k]);
  if (w.extra) list.push(...w.extra);
  return list.sort((a, b) => a.lvl - b.lvl);
}
const wMult = (id) => 1 + 0.2 * (save.wl[id] - 1);
const maxHp = () => 120 + 30 * (save.armor - 1);

// ---------- enemies ----------
// move: ground | hop | fly. plans: attack patterns the AI picks from. mat: what flies out when hit.
const EDEF = {
  slime:     { name: 'Jellybloom', draw: 'slime', mat: 'goo', move: 'hop', hp: 34, spd: 60, hw: 14, hh: 22, dmg: 8, plans: ['pounce'], wind: .45, cd: [1.2, 2.2], reach: 70, weight: 1.15, shards: [3, 6] },
  boar:      { name: 'Thornboar', draw: 'boar', mat: 'fur', move: 'ground', hp: 46, spd: 70, hw: 20, hh: 26, dmg: 10, plans: ['charge', 'bite'], wind: .6, cd: [1.4, 2.4], reach: 34, weight: 1, shards: [4, 7] },
  wisp:      { name: 'Pollen Pixie', draw: 'wisp', mat: 'spark', move: 'fly', hover: 46, hp: 24, spd: 64, hw: 12, hh: 22, dmg: 8, plans: ['shoot'], wind: .7, cd: [1.6, 2.6], ranged: 1, weight: 1.2, shards: [4, 7] },
  golem:     { name: 'Mossling Golem', draw: 'golem', mat: 'rock', move: 'ground', hp: 130, spd: 36, hw: 24, hh: 58, dmg: 17, plans: ['swing', 'slam'], wind: .75, cd: [1.6, 2.6], reach: 50, weight: .55, poise: 3, shards: [10, 14], sigil: .45 },
  drone:     { name: 'Sky Drone', draw: 'drone', mat: 'metal', move: 'fly', hover: 52, hp: 26, spd: 70, hw: 14, hh: 18, dmg: 9, plans: ['shoot'], wind: .65, cd: [1.4, 2.4], ranged: 1, weight: 1.2, shards: [4, 7] },
  spider:    { name: 'Cog Spider', draw: 'spider', mat: 'metal', move: 'ground', hp: 32, spd: 92, hw: 18, hh: 18, dmg: 9, plans: ['pounce', 'bite'], wind: .4, cd: [1.0, 1.9], reach: 70, weight: 1.1, shards: [3, 6] },
  knight:    { name: 'Brass Automaton', draw: 'knight', mat: 'metal', move: 'ground', hp: 56, spd: 58, hw: 14, hh: 54, dmg: 11, plans: ['swing'], wind: .5, cd: [1.1, 2.0], reach: 46, weight: .9, shards: [5, 8] },
  tank:      { name: 'Kettle Tank', draw: 'tank', mat: 'metal', move: 'ground', hp: 140, spd: 34, hw: 28, hh: 40, dmg: 15, plans: ['volley', 'charge'], wind: .8, cd: [1.8, 2.8], ranged: 1, weight: .5, poise: 3, shards: [10, 14], sigil: .45 },
  imp:       { name: 'Prism Imp', draw: 'imp', mat: 'crystal', move: 'hop', hp: 34, spd: 96, hw: 12, hh: 30, dmg: 10, plans: ['pounce', 'bite'], wind: .35, cd: [.9, 1.7], reach: 70, weight: 1.2, shards: [4, 7] },
  jelly:     { name: 'Aurora Jelly', draw: 'jelly', mat: 'goo', move: 'fly', hover: 56, hp: 32, spd: 54, hw: 16, hh: 26, dmg: 10, plans: ['shoot', 'shoot', 'volley'], wind: .7, cd: [1.6, 2.6], ranged: 1, weight: 1.1, shards: [5, 8] },
  shardling: { name: 'Shard Crab', draw: 'crab', mat: 'crystal', move: 'ground', hp: 70, spd: 60, hw: 22, hh: 26, dmg: 13, plans: ['bite', 'charge'], wind: .5, cd: [1.2, 2.2], reach: 44, weight: .8, poise: 2, shards: [6, 10], sigil: .2 },
  // humans
  bandit:    { name: 'Briar Bandit', draw: 'human', look: 'bandit', mat: 'flesh', move: 'ground', hp: 40, spd: 76, hw: 12, hh: 62, dmg: 9, plans: ['swing', 'pounce'], wind: .45, cd: [1.0, 1.9], reach: 42, weight: 1, shards: [4, 7], kind: 'human' },
  archer:    { name: 'Thorn Archer', draw: 'human', look: 'archer', mat: 'flesh', move: 'ground', hp: 30, spd: 62, hw: 12, hh: 62, dmg: 9, plans: ['shoot'], wind: .7, cd: [1.5, 2.5], ranged: 1, weight: 1, shards: [4, 7], kind: 'human' },
  corsair:   { name: 'Sky Corsair', draw: 'human', look: 'corsair', mat: 'flesh', move: 'ground', hp: 54, spd: 72, hw: 12, hh: 62, dmg: 11, plans: ['swing', 'charge'], wind: .45, cd: [1.0, 1.9], reach: 46, weight: 1, shards: [5, 8], kind: 'human' },
  gunner:    { name: 'Aether Gunner', draw: 'human', look: 'gunner', mat: 'flesh', move: 'ground', hp: 42, spd: 60, hw: 12, hh: 62, dmg: 10, plans: ['shoot', 'volley'], wind: .7, cd: [1.4, 2.4], ranged: 1, weight: 1, shards: [5, 8], kind: 'human' },
  cultist:   { name: 'Prism Cultist', draw: 'human', look: 'cultist', mat: 'flesh', move: 'ground', hp: 58, spd: 74, hw: 12, hh: 62, dmg: 12, plans: ['swing', 'pounce'], wind: .4, cd: [.9, 1.7], reach: 48, weight: 1, shards: [6, 9], kind: 'human' },
  witch:     { name: 'Rift Witch', draw: 'human', look: 'witch', mat: 'flesh', move: 'ground', hp: 46, spd: 58, hw: 12, hh: 62, dmg: 11, plans: ['volley', 'shoot'], wind: .7, cd: [1.4, 2.4], ranged: 1, weight: 1, shards: [6, 9], sigil: .15, kind: 'human' },
  // more robots and creatures
  sentinel:  { name: 'Moss Sentinel', draw: 'knight', look: 'moss', mat: 'metal', move: 'ground', hp: 60, spd: 54, hw: 14, hh: 60, dmg: 11, plans: ['swing'], wind: .5, cd: [1.1, 2.0], reach: 46, weight: .9, shards: [5, 8], kind: 'robot' },
  lantern:   { name: 'Lantern Drone', draw: 'drone', pal: 'lantern', mat: 'metal', move: 'fly', hover: 50, hp: 24, spd: 70, hw: 14, hh: 18, dmg: 8, plans: ['shoot'], wind: .65, cd: [1.5, 2.5], ranged: 1, weight: 1.2, shards: [4, 7], kind: 'robot' },
  sdrone:    { name: 'Shard Drone', draw: 'drone', pal: 'prism', mat: 'crystal', move: 'fly', hover: 54, hp: 32, spd: 76, hw: 14, hh: 18, dmg: 10, plans: ['shoot', 'volley'], wind: .6, cd: [1.3, 2.2], ranged: 1, weight: 1.2, shards: [5, 8], kind: 'robot' },
  skyray:    { name: 'Sky Ray', draw: 'skyray', mat: 'fur', move: 'fly', hover: 58, hp: 34, spd: 84, hw: 22, hh: 16, dmg: 10, plans: ['charge', 'shoot'], wind: .6, cd: [1.3, 2.3], ranged: 1, weight: 1.1, shards: [5, 8], kind: 'creature' },
  cloudram:  { name: 'Cloud Ram', draw: 'boar', pal: 'ram', mat: 'fur', move: 'ground', hp: 58, spd: 72, hw: 20, hh: 28, dmg: 12, plans: ['charge', 'bite'], wind: .6, cd: [1.3, 2.3], reach: 36, weight: .9, shards: [5, 8], kind: 'creature' },
  cgolem:    { name: 'Prism Construct', draw: 'golem', mat: 'crystal', move: 'ground', hp: 150, spd: 40, hw: 24, hh: 58, dmg: 19, plans: ['swing', 'slam'], wind: .7, cd: [1.5, 2.5], reach: 50, weight: .55, poise: 3, shards: [12, 16], sigil: .5, crystal: 1 },
};
const BOSSES = {
  // bosses fight in two phases: below half health they roar, enrage, speed up and add new attacks (p2)
  mossback: { name: 'Old Mossback', title: 'THE WALKING GROVE', draw: 'mossback', mat: 'rock', move: 'ground', hp: 780, spd: 46, hw: 60, hh: 96, dmg: 16, reach: 84, wind: .7, cd: [.7, 1.4], weight: .3, poise: 9,
    p1: ['bite', 'sweep', 'roll', 'erupt'], p2: ['bite', 'sweep', 'roll', 'erupt', 'rain', 'summon'], summon: ['slime', 'bandit'] },
  colossus: { name: 'The Brass Colossus', title: 'WARDEN OF THE SKYPORT', draw: 'colossus', mat: 'metal', move: 'ground', hp: 900, spd: 52, hw: 34, hh: 118, dmg: 17, reach: 80, wind: .6, cd: [.7, 1.3], weight: .3, poise: 9, ranged: 1,
    p1: ['swing', 'volley', 'groundwave', 'charge'], p2: ['swing', 'groundwave', 'beam', 'rain', 'volley', 'summon'], summon: ['drone', 'corsair'] },
  wyrm:     { name: 'The Kaleidoscope Wyrm', title: 'EATER OF COLORS', draw: 'wyrm', mat: 'crystal', move: 'fly', hover: 64, hp: 1080, spd: 64, hw: 44, hh: 56, dmg: 19, reach: 80, wind: .6, cd: [.6, 1.2], weight: .3, poise: 10, ranged: 1,
    p1: ['bite', 'breath', 'charge', 'rain'], p2: ['bite', 'breath', 'beam', 'erupt', 'rain', 'slam', 'summon'], summon: ['imp', 'cultist'] },
};

// ---------- stages ----------
const STAGES = [
  { name: 'Bloomwild Vale', sub: 'THE FIRST SHADOW', theme: 'bloom', len: 2600,
    pods: [880, 1650],
    waves: [['bandit', 'boar', 'lantern'], ['archer', 'slime', 'sentinel', 'bandit', 'wisp', 'lantern'], ['golem', 'bandit', 'sentinel', 'archer', 'slime', 'lantern']],
    drops: [{ wave: 0, type: 'boar', weapon: 'hammer' }, { wave: 2, type: 'golem', weapon: 'staff' }], boss: 'mossback' },
  { name: 'The Clockwork Skyport', sub: 'THE SECOND SHADOW', theme: 'sky', len: 2700,
    pods: [700, 1900],
    waves: [['corsair', 'skyray', 'spider'], ['knight', 'corsair', 'gunner', 'cloudram', 'skyray', 'drone'], ['tank', 'gunner', 'corsair', 'cloudram', 'skyray', 'spider']],
    drops: [{ wave: 1, type: 'knight', weapon: 'sword' }], boss: 'colossus' },
  { name: 'The Prism Rim', sub: 'THE THIRD SHADOW', theme: 'prism', len: 2800,
    pods: [650, 1500, 2100], drops: [],
    waves: [['cultist', 'imp', 'sdrone'], ['witch', 'cultist', 'jelly', 'imp', 'sdrone', 'sdrone'], ['cgolem', 'cultist', 'witch', 'shardling', 'jelly', 'sdrone']],
    boss: 'wyrm' },
];

// ---------- trump cards (what sigils are for) ----------
const TRUMPS = {
  stag:      { name: 'The Storm Stag', cost: 2, desc: 'A stag of lightning gallops down the street, launching everything in its path.' },
  brand:     { name: 'The Elemental Brand', cost: 3, desc: 'For 15 seconds your weapon carries an element, a new one each time you play it. Fire: enemies keep burning. Frost: hits slow them, and the fourth hit freezes them solid. Storm: lightning leaps from each hit to two more enemies.' },
  mirror:    { name: 'The Mirror Twin', cost: 3, desc: 'For 10 seconds a reflection fights beside you and repeats every hit you land.' },
  phoenix:   { name: 'The Phoenix', cost: 3, desc: 'Heal half your health and burst into flame, blasting nearby enemies away.' },
  stillness: { name: 'The Still Hour', cost: 4, desc: 'Freeze every enemy for 5 seconds. Frozen enemies take double damage.' },
};
const TRUMP_ORDER = ['stag', 'brand', 'mirror', 'phoenix', 'stillness'];
const ELEMENTS = { fire: { name: 'Fire Brand', col: '#FF8A4A', rgb: '255,138,74' }, frost: { name: 'Frost Brand', col: '#9FE0FF', rgb: '159,224,255' }, storm: { name: 'Storm Brand', col: '#E8E0FF', rgb: '200,190,255' } };
const TRUMP_CHARGE = 240; // damage you must deal to charge a card
