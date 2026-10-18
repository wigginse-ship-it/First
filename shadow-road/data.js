'use strict';
// ---------- weapons ----------
// Each weapon is a combo tree. Keys are the inputs so far: L = Attack, H = Heavy, X = hold Attack (launcher),
// A/AA/AAA = attacks in the air, D = attack while running, R = attack out of a dodge roll.
// Every combo is there from the start. Levels teach each weapon its own new moves (lvl), on new inputs:
// AH = Heavy in the air, M = Attack while walking, HC = hold Heavy, DH = Heavy while running,
// RH = Heavy out of a dodge, J2 = jump again in mid-air, AX = hold Attack in the air. Fists never level up.
// A move: dur (s), h = active window as a fraction of dur, x0..x1 = reach in front, depth = lane tolerance,
// dmg, kb = knockback speed, launch = upward speed given to the enemy, lunge/hop = how the player moves,
// rot = full-body spin over the move, arc = weapon swing angles, around = hits both sides, multi = re-hit interval,
// bounce = ground bounce, shock = shockwave radius on impact, spike = drives an airborne enemy into the floor,
// smash = a downward blow (hammer kills splat), power 0-2 = hit weight.
const P_ = Math.PI;
const WEAPONS = {
  fists: { name: 'Fists', reach: 14, look: 'fists', desc: 'Fast, close, never runs out.',
    tree: {
      L:    { dur: .2,  h: [.3, .6], x0: 0, x1: 34, dmg: 6, kb: 50, arc: [.9, -.15], lunge: 70 },
      LL:   { dur: .22, h: [.3, .6], x0: 0, x1: 34, dmg: 7, kb: 50, arc: [.9, -.15], lunge: 70 },
      LLL:  { name: 'Hook', dur: .3, h: [.3, .65], x0: 0, x1: 38, dmg: 9, kb: 160, arc: [.3, .3], lunge: 60 },
      LLLL: { name: 'Roundhouse', dur: .4, h: [.3, .65], x0: 0, x1: 40, dmg: 12, kb: 300, kick: 1, lunge: 120, hop: 170, power: 1 },
      H:    { name: 'Jumping Uppercut', dur: .48, h: [.25, .55], x0: 0, x1: 34, dmg: 13, kb: 60, launch: 430, arc: [1.6, -1.8], hop: 210, lunge: 210, power: 1 },
      HH:   { name: 'Thunder Palm', dur: .46, h: [.3, .6], x0: 0, x1: 42, dmg: 16, kb: 380, arc: [.2, .2], lunge: 200, power: 2, wall: 1 }, // both palms driven forward hard enough to bounce them off a wall
      HHH:  { name: 'Dragon Fist', dur: .55, h: [.32, .6], x0: 0, x1: 46, dmg: 24, kb: 460, arc: [.1, .1], lunge: 320, power: 2, wall: 1 }, // the whole body behind one straight punch: sends them flying into the wall
      LH:   { name: 'Shoulder Bash', dur: .45, h: [.15, .7], x0: 0, x1: 38, dmg: 15, kb: 420, lunge: 460, arc: [.2, .2], power: 2, wall: 1 },
      LLH:  { name: 'Whirlwind Kick', dur: .62, h: [.15, .85], x0: 0, x1: 42, dmg: 6, kb: 220, kick: 1, around: 1, multi: .11, hop: 260, rot: -TAU, power: 1 },
      HL:   { name: 'Sky Hammer', dur: .55, h: [.55, .8], x0: 0, x1: 40, dmg: 18, kb: 120, arc: [-2.6, 1.4], hop: 280, lunge: 110, bounce: 1, power: 2 },
      X:    { name: 'Rising Fist', dur: .45, h: [.3, .55], x0: 0, x1: 36, dmg: 10, kb: 30, launch: 580, arc: [1.6, -1.8], launcher: 1, power: 1 },
      A:    { dur: .28, h: [.2, .6], x0: 0, x1: 38, dmg: 7, kb: 60, arc: [.9, -.2] },
      AA:   { dur: .3,  h: [.2, .6], x0: 0, x1: 40, dmg: 8, kb: 60, kick: 1 },
      AAA:  { dur: .4,  h: [.2, .65], x0: 0, x1: 42, dmg: 12, kb: 120, arc: [-2.4, 1.4], spike: 1, power: 1 },
      D:    { dur: .44, h: [.18, .68], x0: 0, x1: 42, dmg: 12, kb: 300, kick: 1, lunge: 440, power: 1 }, // a stepping front kick driven in off the run
      R:    { dur: .5,  h: [.22, .62], x0: 0, x1: 40, dmg: 14, kb: 80, launch: 380, kick: 1, lunge: 300, hop: 220, power: 1 }, // springs out of the roll into a flying kick
    } },
  hammer: { name: 'Hammer', reach: 46, look: 'hammer', desc: 'Slow and crushing. Every heavy shakes the ground.',
    tree: {
      L:    { dur: .46, h: [.35, .65], x0: 0, x1: 64, dmg: 15, kb: 220, arc: [.35, .35], lunge: 50, depth: 24, power: 1 },
      LL:   { dur: .5,  h: [.35, .65], x0: 0, x1: 64, dmg: 17, kb: 260, arc: [.35, .35], lunge: 60, depth: 24, power: 1 },
      LLL:  { name: 'Hammer Cyclone', dur: .85, h: [.12, .88], x0: 0, x1: 62, dmg: 9, kb: 200, arc: [-P_, 3 * P_], around: 1, multi: .13, lunge: 140, power: 1 },
      H:    { name: 'Overhead Smash', smash: 1, dur: .64, h: [.45, .62], x0: 0, x1: 66, dmg: 24, kb: 90, launch: 330, arc: [-2.7, 1.5], hop: 140, lunge: 150, bounce: 1, shock: 70, power: 2 },
      LH:   { name: 'Golf Swing', dur: .55, h: [.35, .6], x0: 0, x1: 62, dmg: 20, kb: 80, launch: 560, arc: [2.3, -2.6], power: 2 },
      HH:   { name: 'Fault Line', smash: 1, dur: .62, h: [.42, .62], x0: 0, x1: 68, dmg: 26, kb: 120, launch: 340, arc: [-2.8, 1.5], lunge: 90, shock: 60, wave: 30, waveKind: 'quake', power: 2 }, // drive the hammer into the ground and split the earth in a line ahead
      HHH:  { name: 'Avalanche', smash: 1, dur: .78, h: [.46, .62], x0: 0, x1: 72, dmg: 34, kb: 260, launch: 380, arc: [-2.9, 1.5], lunge: 70, shock: 150, power: 2 }, // a two-handed slam whose shockwave throws up everyone nearby
      LLH:  { name: 'Comet Drop', smash: 1, dur: .8, h: [.62, .8], x0: 0, x1: 70, dmg: 38, kb: 160, launch: 300, arc: [-2.8, 1.5], hop: 420, rot: TAU, lunge: 220, bounce: 1, shock: 110, power: 2 },
      X:    { name: 'Uplift', dur: .55, h: [.3, .55], x0: 0, x1: 62, dmg: 16, kb: 40, launch: 580, arc: [2.3, -2.4], launcher: 1, power: 1 },
      A:    { dur: .36, h: [.25, .6], x0: 0, x1: 58, dmg: 12, kb: 120, arc: [-1.8, 1.0] },
      AA:   { dur: .4,  h: [.25, .6], x0: 0, x1: 58, dmg: 13, kb: 120, arc: [1.0, -1.6] },
      AAA:  { dur: .5,  h: [.25, .65], x0: 0, x1: 60, dmg: 18, kb: 140, arc: [-2.6, 1.5], spike: 1, smash: 1, power: 2 },
      D:    { dur: .56, h: [.1, .6], x0: 0, x1: 60, dmg: 18, kb: 360, arc: [1.4, 1.4], lunge: 440, crouch: 1, power: 1 },
      R:    { dur: .6,  h: [.25, .7], x0: 0, x1: 64, dmg: 22, kb: 300, arc: [-P_, P_], around: 1, rot: -TAU, lunge: 120, power: 2 },
      AH:   { lvl: 3, name: 'Hammer Plunge', how: 'Heavy in the air', desc: 'Fall from the sky hammer-first; the landing sends a shockwave out both ways.', smash: 1, dur: .55, h: [.15, .97], x0: 0, x1: 54, dmg: 22, kb: 160, arc: [-2, 1.5], dive: 1, shock: 70, power: 2 },
      RH:   { lvl: 4, name: 'Pivot Quake', how: 'Heavy out of a dodge', desc: 'Come out of the dodge spinning and slam the hammer down; the quake hits everyone around you.', smash: 1, dur: .7, h: [.5, .7], x0: 0, x1: 70, dmg: 30, kb: 260, launch: 320, arc: [-P_, 1.5], around: 1, rot: -TAU, shock: 120, power: 2 },
      HC:   { lvl: 2, name: 'Titan Slam', how: 'Hold Heavy, then let go', desc: 'Wind up, leap and flip, and bring the hammer down hard enough to launch everyone near you.', smash: 1, dur: .85, h: [.65, .8], x0: 0, x1: 76, dmg: 40, kb: 220, launch: 420, arc: [-2.8, 1.5], hop: 300, rot: -TAU, around: 1, shock: 170, power: 2 },
      DH:   { lvl: 5, name: 'Rampage', how: 'Heavy while running', desc: 'Charge through the crowd spinning the hammer, hitting everything in your path.', dur: .8, h: [.1, .9], x0: 0, x1: 62, dmg: 10, kb: 260, arc: [-P_, 3 * P_], around: 1, multi: .1, lunge: 520, power: 1 },
    } },
  staff: { name: 'Bowstaff', reach: 54, look: 'staff', desc: 'Long reach, spins that hit all around, and big acrobatics.',
    tree: {
      L:    { dur: .26, h: [.3, .6], x0: 8, x1: 72, dmg: 7, kb: 50, arc: [.25, -.05], lunge: 50 },
      LL:   { name: 'Low Sweep', dur: .3, h: [.3, .65], x0: 0, x1: 70, dmg: 7, kb: 70, arc: [.9, .9], lunge: 40, depth: 28 },
      LLL:  { name: 'Double Jab', dur: .32, h: [.2, .75], x0: 8, x1: 76, dmg: 5, kb: 60, arc: [.1, .1], multi: .12, lunge: 40 },
      LLLL: { name: 'Spinning Finish', dur: .5, h: [.2, .8], x0: 0, x1: 70, dmg: 13, kb: 260, arc: [-P_, P_], around: 1, hop: 150, power: 1 },
      H:    { name: 'Sweep', dur: .55, h: [.3, .75], x0: 0, x1: 70, dmg: 12, kb: 90, launch: 320, arc: [-P_, 1.5 * P_], around: 1, depth: 24, power: 1 },
      LH:   { name: 'Rising Spiral', dur: .62, h: [.15, .8], x0: 0, x1: 66, dmg: 7, kb: 60, launch: 440, arc: [-P_, 3 * P_], around: 1, multi: .12, hop: 380, rot: -TAU, power: 1 },
      HL:   { name: 'Pole Flip', dur: .62, h: [.5, .75], x0: 0, x1: 70, dmg: 18, kb: 160, arc: [-2, 1.4], hop: 300, rot: TAU, lunge: 260, bounce: 1, power: 1 },
      LLH:  { name: 'Thousand Strikes', dur: .9, h: [.08, .85], x0: 8, x1: 76, dmg: 4, kb: 40, arc: [.15, -.15], multi: .07, lunge: 30, power: 0 },
      HH:   { name: 'Sweeping Tide', dur: .6, h: [.2, .62], x0: 0, x1: 80, depth: 34, dmg: 20, kb: 90, launch: 280, arc: [-P_, 3 * P_], around: 1, crouch: 1, lunge: 90, bounce: 1, power: 2 }, // a low full-circle sweep that knocks everyone around you off their feet
      HHH:  { name: 'Piercing Lance', dur: .55, h: [.28, .62], x0: 8, x1: 112, dmg: 13, kb: 380, arc: [.05, .05], multi: .14, lunge: 150, power: 2, wall: 1 }, // drive the staff straight through the whole front of the crowd, twice
      X:    { name: 'Rising Pole', dur: .45, h: [.3, .6], x0: 0, x1: 68, dmg: 10, kb: 40, launch: 580, arc: [1.4, -1.8], launcher: 1, power: 1 },
      A:    { dur: .3,  h: [.15, .7], x0: 0, x1: 66, dmg: 6, kb: 80, arc: [-1.6, 1.6], around: 1, multi: .12 },
      AA:   { dur: .3,  h: [.15, .7], x0: 0, x1: 66, dmg: 6, kb: 80, arc: [1.6, -1.6], around: 1, multi: .12 },
      AAA:  { dur: .42, h: [.2, .65], x0: 0, x1: 68, dmg: 12, kb: 140, arc: [-2.2, 1.4], spike: 1, power: 1 },
      D:    { dur: .62, h: [.35, .85], x0: 0, x1: 46, dmg: 18, kb: 220, launch: 340, kick: 1, lunge: 400, hop: 320, power: 1 },
      R:    { dur: .55, h: [.2, .8], x0: 0, x1: 68, dmg: 8, kb: 140, arc: [-P_, 2 * P_], around: 1, multi: .12, hop: 200, lunge: 260, rot: -TAU, power: 1 },
      J2:   { lvl: 3, name: 'Pole Vault', how: 'Jump again in mid-air', desc: 'Plant the staff on thin air and vault higher, kicking whatever is in front of you on the way up.', dur: .55, h: [.15, .6], x0: 0, x1: 46, dmg: 14, kb: 160, launch: 360, kick: 1, hop: 420, lunge: 140, rot: -TAU, power: 1 },
      M:    { lvl: 2, name: 'Lunging Thrust', how: 'Attack while walking', desc: 'Throw your whole body behind a long thrust that skewers the front of the crowd.', dur: .42, h: [.15, .6], x0: 8, x1: 84, dmg: 16, kb: 320, arc: [.2, -.05], lunge: 440, power: 1, wall: 1 },
      AX:   { lvl: 4, name: 'Helicopter', how: 'Hold Attack in the air', desc: 'Spin the staff overhead like a rotor and hover, shredding everything around you before you drop.', hover: 1, dur: 1.0, h: [.05, .9], x0: 0, x1: 76, dmg: 5, kb: 90, arc: [-P_, 5 * P_], around: 1, multi: .09, power: 1 },
      DH:   { lvl: 5, name: 'Comet Pole', how: 'Heavy while running', desc: 'Vault high off a sprint and come down with a ground-splitting strike.', dur: .75, h: [.55, .8], x0: 0, x1: 72, dmg: 28, kb: 200, launch: 300, arc: [-2.4, 1.4], hop: 380, lunge: 360, rot: TAU, bounce: 1, shock: 90, power: 2 },
    } },
  sword: { name: 'Great Sword', reach: 64, look: 'sword', charge: true, desc: 'Huge damage. Hold Heavy to charge, release to strike.',
    tree: {
      L:    { dur: .5,  h: [.4, .62], x0: 0, x1: 84, dmg: 18, kb: 200, arc: [-1.9, 1.1], lunge: 50, depth: 20, power: 1 },
      LL:   { name: 'Horizontal Cleave', dur: .55, h: [.35, .65], x0: 0, x1: 90, dmg: 22, kb: 300, arc: [.25, .25], lunge: 60, depth: 28, power: 1 },
      LLL:  { name: 'Piercing Thrust', dur: .5, h: [.35, .6], x0: 0, x1: 112, dmg: 24, kb: 340, arc: [.05, .05], lunge: 120, power: 1, wall: 1 },
      LLLL: { name: 'Wheel Cleave', dur: .62, h: [.25, .7], x0: 0, x1: 86, dmg: 26, kb: 320, arc: [-P_, P_], around: 1, hop: 160, rot: -TAU, power: 2 },
      LH:   { name: 'Rising Slash', dur: .55, h: [.2, .55], x0: 0, x1: 80, dmg: 22, kb: 80, launch: 500, arc: [1.6, -2.3], hop: 320, lunge: 170, power: 1 },
      HL:   { name: 'Helm Splitter', dur: .75, h: [.55, .75], x0: 0, x1: 86, dmg: 44, kb: 160, arc: [-2.7, 1.5], hop: 340, rot: TAU, lunge: 170, bounce: 1, shock: 90, power: 2 },
      HH:   { name: 'Crescent Rend', dur: .6, h: [.28, .6], x0: 0, x1: 94, depth: 30, dmg: 30, kb: 300, arc: [.3, .3], around: 1, lunge: 120, power: 2 }, // a huge level sweep that cuts down both sides at once
      HHH:  { name: 'Executioner\'s Fall', dur: .82, h: [.5, .66], x0: 0, x1: 98, dmg: 46, kb: 200, launch: 300, arc: [-2.9, 1.4], lunge: 100, shock: 90, wave: 1, power: 2 }, // lift the blade high and bring it down: the ground splits and a wave of shadow runs down the street
      X:    { name: 'Upward Cleave', dur: .55, h: [.3, .55], x0: 0, x1: 84, dmg: 18, kb: 40, launch: 580, arc: [1.6, -2.3], launcher: 1, power: 1 },
      A:    { dur: .38, h: [.25, .6], x0: 0, x1: 80, dmg: 14, kb: 120, arc: [-1.8, 1.0] },
      AA:   { dur: .42, h: [.25, .6], x0: 0, x1: 80, dmg: 15, kb: 120, arc: [1.0, -1.6] },
      AAA:  { dur: .5,  h: [.25, .65], x0: 0, x1: 82, dmg: 22, kb: 160, arc: [-2.6, 1.5], spike: 1, power: 2 },
      D:    { dur: .55, h: [.1, .6], x0: 0, x1: 88, dmg: 22, kb: 420, arc: [.1, .1], lunge: 480, power: 1, wall: 1 },
      R:    { dur: .6,  h: [.3, .7], x0: 0, x1: 86, dmg: 28, kb: 320, arc: [-P_, P_], around: 1, rot: TAU, lunge: 160, power: 2, depth: 22 },
      RH:   { lvl: 3, name: 'Riposte', how: 'Heavy out of a dodge', desc: 'Dodge past the attack and answer with a precise cut that always lands as a critical hit.', crit: 1, dur: .5, h: [.3, .6], x0: 0, x1: 90, dmg: 30, kb: 300, arc: [1.2, -1.8], lunge: 260, power: 2 },
      AH:   { lvl: 4, name: 'Plunging Blade', how: 'Heavy in the air', desc: 'Point the blade down and drop; whatever is underneath is pinned to the ground.', dur: .55, h: [.15, .97], x0: 0, x1: 70, dmg: 24, kb: 160, arc: [-2, 1.5], dive: 1, shock: 60, bounce: 1, power: 2 },
      DH:   { lvl: 5, name: 'Phantom Rush', how: 'Heavy while running', desc: 'Blur through the crowd in a flurry of afterimage cuts.', dur: .6, h: [.1, .85], x0: 0, x1: 90, dmg: 9, kb: 140, arc: [-1.2, 1.2], multi: .08, lunge: 620, power: 1 },
    },
    charged: [
      { dur: .5,  h: [.35, .6], x0: 0, x1: 84, dmg: 18, kb: 200, arc: [-2, 1.2], depth: 20, power: 1 },
      { dur: .55, h: [.35, .6], x0: 0, x1: 92, dmg: 34, kb: 300, launch: 220, arc: [-2.2, 1.3], depth: 22, power: 2 },
      { dur: .6,  h: [.35, .6], x0: 0, x1: 100, dmg: 54, kb: 420, launch: 340, arc: [-2.4, 1.4], depth: 28, power: 2, shock: 80 },
      { dur: .65, h: [.35, .6], x0: 0, x1: 100, dmg: 54, kb: 420, launch: 340, arc: [-2.4, 1.4], depth: 28, power: 2, shock: 80, wave: 1 },
    ],
    extra: [{ lvl: 2, name: 'Shadow Cleave', how: 'Hold Heavy past the third flash', desc: 'Charge past the third flash and your swing sends a wave of shadow down the street.' }] },
};
const WEAPON_ORDER = ['fists', 'hammer', 'staff', 'sword'];
// how each swing moves: thrust = a stab straight out, sweep / sweepR = horizontal, around the body; the rest swing on their arcs
const STYLES = {
  fists: { L: 'thrust', LL: 'thrust', LLL: 'sweep', LH: 'thrust', HH: 'thrust', HHH: 'thrust', A: 'thrust' },
  hammer: { L: 'sweep', LL: 'sweepR', D: 'sweep', A: 'sweep', AA: 'sweepR', DH: 'sweep' },
  staff: { L: 'thrust', LL: 'sweep', HH: 'sweep', HHH: 'thrust', LLL: 'thrust', LLH: 'thrust', M: 'thrust', AA: 'sweep' },
  sword: { LL: 'sweep', HH: 'sweep', LLL: 'thrust', D: 'thrust', A: 'sweep', AA: 'thrust', RH: 'sweep', DH: 'sweep' },
};
for (const id in STYLES) for (const k in STYLES[id]) if (WEAPONS[id].tree[k]) WEAPONS[id].tree[k].style = STYLES[id][k];
for (const id of WEAPON_ORDER) for (const k in WEAPONS[id].tree) WEAPONS[id].tree[k].key = k;
function unlockList(id) {
  const w = WEAPONS[id], list = [];
  for (const k in w.tree) if (w.tree[k].lvl) list.push(w.tree[k]);
  if (w.extra) list.push(...w.extra);
  return list.sort((a, b) => a.lvl - b.lvl);
}
const wMult = (id) => 1 + 0.2 * (save.wl[id] - 1); // every weapon level adds 20% damage on top of its new move
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
  // bosses fight in three phases (at 2/3 and 1/3 health they roar, drop health for you and get faster); each phase adds an attack.
// No two bosses share an attack type: each fight is its own puzzle.
  mossback: { close: 'bramble', name: 'Old Mossback', title: 'THE WALKING GROVE', draw: 'mossback', mat: 'rock', move: 'ground', hp: 780, spd: 46, hw: 60, hh: 96, dmg: 16, reach: 84, wind: .7, cd: [.7, 1.4], weight: .3, poise: 9,
    p1: ['bite', 'sweep', 'roll'], p2: ['bite', 'sweep', 'roll', 'erupt'], p3: ['bite', 'sweep', 'roll', 'erupt', 'quake'] },
  colossus: { close: 'vent', name: 'The Brass Colossus', title: 'WARDEN OF THE SKYPORT', draw: 'colossus', mat: 'metal', move: 'ground', hp: 900, spd: 52, hw: 34, hh: 118, dmg: 17, reach: 80, wind: .6, cd: [.7, 1.3], weight: .3, poise: 9, ranged: 1,
    p1: ['swing', 'volley', 'groundwave'], p2: ['swing', 'volley', 'groundwave', 'beam', 'mines'], p3: ['swing', 'volley', 'groundwave', 'beam', 'mines', 'magnet'] },
  wyrm:     { close: 'coil', name: 'The Kaleidoscope Wyrm', title: 'EATER OF COLORS', draw: 'wyrm', mat: 'crystal', move: 'fly', hover: 64, tail: 150, reachDown: 50, hp: 1080, spd: 64, hw: 44, hh: 56, dmg: 19, reach: 80, wind: .6, cd: [.6, 1.2], weight: .3, poise: 10, ranged: 1,
    p1: ['dive', 'breath', 'rain'], p2: ['dive', 'breath', 'rain', 'orbit'], p3: ['dive', 'breath', 'rain', 'orbit', 'prismwall'] },
};

// ---------- stages ----------
const STAGES = [
  { name: 'Bloomwild Vale', sub: 'THE FIRST SHADOW', theme: 'bloom', len: 2600,
    pods: [880, 1650],
    waves: [['bandit', 'boar', 'lantern'], ['archer', 'slime', 'sentinel', 'bandit', 'wisp', 'lantern'], ['golem', 'bandit', 'sentinel', 'archer', 'slime', 'lantern']],
    drop: [.5, .1], boss: 'mossback' }, // odds of a first and a second weapon in this world; any weapon you lack can be the one
  { name: 'The Clockwork Skyport', sub: 'THE SECOND SHADOW', theme: 'sky', len: 2700,
    pods: [700, 1900],
    waves: [['corsair', 'skyray', 'spider'], ['knight*', 'gunner', 'knight', 'gunner', 'cloudram', 'skyray'], ['tank', 'corsair*', 'gunner', 'cloudram', 'skyray', 'cloudram', 'drone']], // later waves pair guards with gunners behind them, and fliers with chargers
    drop: [.65, .25], boss: 'colossus' },
  { name: 'The Prism Rim', sub: 'THE THIRD SHADOW', theme: 'prism', len: 2800,
    pods: [650, 1500, 2100], drop: [.8, .4],
    waves: [['cultist', 'imp', 'sdrone'], ['shardling*', 'witch', 'shardling', 'witch', 'imp', 'sdrone'], ['cgolem*', 'cultist', 'witch', 'cultist*', 'jelly', 'imp', 'sdrone']],
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
