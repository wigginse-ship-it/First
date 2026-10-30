'use strict';
// ---------- particles & effects ----------
function burst(x, y, z, cols, n, mat, dir = 0, big) {
  cols = Array.isArray(cols) ? cols : [cols];
  for (let i = 0; i < n && parts.length < 420; i++) {
    const sp = big ? rand(80, 260) : rand(60, 200), a = rand(0, TAU);
    const shape = mat === 'flesh' ? (i % 2 ? 'blob' : 'tuft') : mat === 'goo' ? 'blob' : mat === 'metal' ? (i % 3 ? 'streak' : 'bolt') : mat === 'crystal' ? 'shard' : mat === 'rock' ? 'chunk' : mat === 'fur' ? 'tuft' : 'star';
    parts.push({ x, y: y + rand(-4, 4), z, vx: Math.cos(a) * sp * .8 + dir * rand(40, 160), vy: rand(-30, 30), vz: rand(60, big ? 380 : 260),
      life: rand(.4, .8) + (shape !== 'streak' && shape !== 'star' ? rand(1.2, 2.6) : 0), max: 0, col: pick(cols), size: rand(2, big ? 6 : 4.5), shape, rot: rand(0, TAU), vr: rand(-12, 12), rest: false });
    parts[parts.length - 1].max = parts[parts.length - 1].life;
  }
}
function dust(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-8, 8), y, z: 1, vx: rand(-60, 60), vy: rand(-8, 8), vz: rand(20, 70), life: .45, max: .45, col: 'rgba(255,255,255,.7)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); }
// ---------- bits of a hard material, thrown up when a hard thing is smashed or its armor chips and breaks ----------
// kinds: 'machine' (gears, bolts and plate: a smashed automaton), 'metal' (plate and rivets: a helm or cuirass), 'glass',
// 'crystal', 'stone', 'porcelain'. Each bit is a small solid thing that tumbles, bounces and settles on the floor.
const MAT_BITS = {
  machine: { shapes: ['gear', 'plate', 'bolt', 'plate'], cols: ['#8A909C', '#C4CAD4', '#C89A52', '#5A5E6A'], size: [2.8, 4.8] },
  metal: { shapes: ['plate', 'bolt', 'plate'], cols: ['#8A909C', '#C4CAD4', '#5A5E6A'], size: [2.6, 4.4] },
  glass: { shapes: ['glass'], cols: ['#DCEEFF', '#A8D0E0', '#FFFFFF'], size: [2.6, 4.6] },
  crystal: { shapes: ['shard', 'glass'], cols: ['#9FD8E0', '#D8A0C8', '#FFFFFF'], size: [2.2, 4] },
  stone: { shapes: ['chip'], cols: ['#8E8478', '#B4AA9A', '#6A6258'], size: [2.4, 4.4] },
  porcelain: { shapes: ['plate', 'plate', 'glass'], cols: ['#F6F0E6', '#E2D8C8', '#C8B49A'], size: [2.6, 4.4] },
};
// what an enemy's own body is made of, if it is hard enough to burst (soft things, goo, fur, flesh, ghosts and dreams do not)
const MAT_KIND = { metal: 'machine', bronze: 'machine', w7bronze: 'machine', crystal: 'crystal', w7glass: 'glass', rock: 'stone', china: 'porcelain', shell: 'porcelain' };
// an armor's material (ARMOR[type].mat) as a kind of bits; wood and cloth give none
const ARMOR_KIND = { metal: 'metal', iron: 'metal', brass: 'metal', bronze: 'metal', glass: 'glass', crystal: 'crystal', stone: 'stone', porcelain: 'porcelain' };
function matBurst(x, y, z, kind, n, dir = 0, cols, small) {
  const B = MAT_BITS[kind]; if (!B || n <= 0) return;
  cols = cols && cols.length ? cols : B.cols;
  for (let i = 0; i < n && parts.length < 420; i++) {
    const a = rand(0, TAU), sp = small ? rand(30, 110) : rand(50, 190), life = rand(1.6, 2.8);
    parts.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), z, vx: Math.cos(a) * sp + dir * rand(20, small ? 90 : 150), vy: Math.sin(a) * sp * .22, vz: small ? rand(90, 220) : rand(170, 380),
      life, max: life, col: pick(cols), size: rand(B.size[0], B.size[1]) * (small ? .8 : 1), shape: B.shapes[i % B.shapes.length], rot: rand(0, TAU), vr: rand(-14, 14), rest: false });
  }
}
// a chip off an armor as one pip of its guard goes (the struck side), or the whole of it bursting as the guard breaks
function armorChip(e, dir) {
  const A = ARMOR[e.type], kind = A && ARMOR_KIND[A.mat]; if (!kind || e.bare) return;
  matBurst(e.x - dir * e.hw * .35, e.y, e.z + e.hh * .62, kind, CROWD ? 3 : 5, -dir * .4, A.cols && A.cols.slice(0, 3), true);
  if (kind === 'metal') burst(e.x - dir * e.hw * .4, e.y, e.z + e.hh * .62, ['#FFE6A0', '#FFFFFF'], 3, 'spark', -dir);
}

// ---------- the hammer's mark: a dent pressed into the floor where a body was smashed flat ----------
// It is painted onto the floor itself (under every figure, outside the ink), and fades after a few seconds. Each world's
// floor takes it its own way: stone, wood and street crack; moss, earth and mud give under it in a soft dent with the dirt
// thrown up round it; the sea floor puffs up silt; the dream floor ripples like water.
let craters = [];
function floorKind(id) {
  id = id || '';
  if (/^dream/.test(id)) return 'ripple';
  if (/^rebma/.test(id)) return 'silt';
  if (/^(bloom|lorraine)/.test(id)) return 'soft';
  return 'crack';
}
function floorTone(th, y) { // the floor's own colour where the mark is, as #rrggbb (the gradient it is painted with)
  const hx = (c) => { if (typeof c !== 'string') return null; if (/^#[0-9a-f]{6}$/i.test(c)) return c; const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('') : null; };
  const a = hx(th && th.floorA) || '#7A7060', b = hx(th && th.floorB) || shade(a, -.4), k = clamp((y - FLOOR_TOP) / Math.max(1, VH - FLOOR_TOP), 0, 1);
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16), ch = (s) => Math.round(lerp((na >> s) & 255, (nb >> s) & 255, k));
  return '#' + [16, 8, 0].map(ch).map(v => v.toString(16).padStart(2, '0')).join('');
}
function makeCrater(e, dir) {
  const id = stage ? stage.theme : '', th = THEMES[id], kind = floorKind(id), base = floorTone(th, e.y);
  const r = clamp(e.hw * 1.5 + 10, 24, 62) * (e.boss ? 1.3 : 1), sd = Math.random() * 1000;
  const c = { x: e.x, y: e.y, r, kind, wet: /^lorraine/.test(id), grain: /^sky/.test(id), t: 0, max: kind === 'ripple' ? 3.6 : 4.6, sd,
    dark: shade(base, -.62), deep: shade(base, -.8), lite: shade(base, .5), dust: shade(base, .32), clod: shade(base, -.3), cracks: [], chips: [], clods: [] };
  const h = (n) => { const v = Math.sin(sd + n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const jag = kind === 'crack' ? .16 : .06; c.rim = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, q = 1 + (h(i + 80) - .5) * jag * 2; c.rim.push([Math.cos(a) * q, Math.sin(a) * q * .36]); } // its edge, broken on hard floors
  if (kind === 'crack') {
    const n = 6 + Math.floor(h(1) * 2);
    for (let i = 0; i < n; i++) { // jagged lines out from the rim; on the deck they run along the planks
      let a = (i + h(i + 3) * .7) / n * TAU; if (c.grain) a = (h(i + 9) < .5 ? 0 : Math.PI) + (h(i + 5) - .5) * .7;
      const len = r * (.45 + h(i + 7) * .6), pts = [], segs = 3 + Math.floor(h(i + 11) * 2);
      for (let k = 0; k <= segs; k++) { const d = r * .92 + len * k / segs, j = k ? (h(i * 7 + k) - .5) * .5 : 0; pts.push([Math.cos(a + j) * d, Math.sin(a + j) * d * .36]); }
      c.cracks.push(pts);
      if (h(i + 21) < .45) { const m = pts[1 + Math.floor(h(i + 23) * (pts.length - 2))], b = a + (h(i + 25) < .5 ? -1 : 1) * (.5 + h(i + 27) * .4), l = len * .4; // a branch
        c.cracks.push([m, [m[0] + Math.cos(b) * l * .5, m[1] + Math.sin(b) * l * .18 + 1], [m[0] + Math.cos(b) * l, m[1] + Math.sin(b) * l * .36]]); }
    }
    for (let i = 0; i < 5; i++) { const a = h(i + 40) * TAU, d = r * (.95 + h(i + 41) * .5); c.chips.push([Math.cos(a) * d, Math.sin(a) * d * .36, 1.4 + h(i + 42) * 1.6, h(i + 43) * 3]); }
  } else if (kind === 'soft' || kind === 'silt') {
    for (let i = 0; i < 11; i++) { const a = (i + h(i + 60) * .8) / 11 * TAU, d = r * (1.02 + h(i + 61) * .32); c.clods.push([Math.cos(a) * d, Math.sin(a) * d * .36, 2.4 + h(i + 62) * 3.4]); }
  }
  craters.push(c); if (craters.length > 8) craters.shift();
  // pebbles or clods hop up off the floor round it (none on the dream's water-floor; the sea floor puffs up silt and bubbles)
  if (kind === 'crack' || kind === 'soft') {
    const cols = kind === 'soft' ? [c.clod, shade(base, -.45), shade(base, .15)] : [shade(base, -.2), shade(base, .25), c.dark];
    for (let i = 0, n = CROWD ? 3 : 6; i < n && parts.length < 420; i++) { const a = rand(0, TAU), life = rand(1, 1.8);
      parts.push({ x: e.x + Math.cos(a) * r * .8, y: e.y + Math.sin(a) * r * .3, z: 1, vx: Math.cos(a) * rand(40, 120) + dir * rand(0, 40), vy: Math.sin(a) * rand(10, 30), vz: rand(110, 230), life, max: life, col: pick(cols), size: rand(1.8, 3.2), shape: 'chip', rot: rand(0, TAU), vr: rand(-12, 12), rest: false }); }
  }
  if (kind === 'silt' && window.W7 && W7.bubbles) W7.bubbles(e.x, e.y, 4, CROWD ? 5 : 9, 60);
  return c;
}
function floatText(x, y, z, txt, col, size = 14) { nums.push({ x, y, z, txt, col, size, t: .85, max: .85 }); }
function floatIcon(x, y, z, icon, size = 14) { nums.push({ x, y, z, txt: '', col: '#FFFFFF', size, t: .85, max: .85, icon }); } // a blow turned aside: just the icon, no words
function iconNums(n0, icon, pips) { for (let i = n0; i < nums.length; i++) if (/^\d+!?$/.test(String(nums[i].txt))) { nums[i].icon = icon; if (pips !== undefined) nums[i].pips = pips; } } // tag the damage numbers a hit just made
function updateFx(dt) {
  for (const p of parts) {
    p.life -= dt;
    if (p.rest) continue;
    p.vz -= GRAV * .9 * dt; p.z += p.vz * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.z <= 0) {
      p.z = 0;
      if (p.shape === 'puff' || p.shape === 'star' || p.shape === 'streak') { p.life = Math.min(p.life, .1); continue; }
      if (Math.abs(p.vz) > 90) { p.vz *= -.35; p.vx *= .5; } else { p.rest = true; p.vz = 0; if (p.shape === 'blob') { p.size *= 1.6; p.flat = 1; } }
    }
  }
  parts = parts.filter(p => p.life > 0);
  if (craters.length) { if (hitstop <= 0) for (const c of craters) c.t += dt; // (the mark is pressed in as the body flattens, after the hit freeze)
    craters = craters.filter(c => c.t < c.max); }
  for (const f of fx) f.t -= dt; fx = fx.filter(f => f.t > 0);
  for (const n of nums) { n.t -= dt; n.z += 30 * dt; } nums = nums.filter(n => n.t > 0);
  for (const g of ghosts) g.a -= dt * 1.6; ghosts = ghosts.filter(g => g.a > 0);
}

// ---------- enemies ----------
const scaleStat = (v, k) => v * (1 + k * save.cycle);
// New Game+ blows keep pace with the armor each cycle drops: a cycle's pieces are five tiers up (gear.js effTier), so a full
// set turns far more aside and adds health. Enemy damage is scaled so that, against the armor this world normally drops,
// a blow costs the same share of your health as it did on the first cycle, and then a quarter more for every cycle.
function ngDmgK() {
  const q = save.cycle || 0; if (!q) return 1;
  const t0 = clamp((stageIdx || 0) + 1, 1, 5), setDef = (T) => GEAR_SLOTS.reduce((a, s) => a + GEAR_DEF[s][Math.min(T, 5) - 1] * pastTop(T, .3), 0);
  const setHp = (T) => BASE_HP + GEAR_SLOTS.length * GEAR_HP[Math.min(T, 5) - 1] * pastTop(T, .32);
  const taken = (T) => (1 - gearDR(setDef(T))) / setHp(T); // the share of your health one point of damage takes, in full gear of tier T
  return taken(t0) / taken(t0 + 5 * q) * (1 + .6 * q); // (a cycle carries the relics of the road's ends: each one hits that much harder)
}
// each world is harder than the last: enemies take more hits to bring down, hit a little harder and attack more often.
// Your own damage doesn't change, so leveling your weapons is what keeps pace.
const WORLD_DIFF = [{ hp: 1, boss: 1, dmg: 1, cd: 1 }, { hp: 1.4, boss: 1.2, dmg: 1.12, cd: .88 }, { hp: 1.85, boss: 1.4, dmg: 1.25, cd: .78 }, { hp: 2.35, boss: 1.65, dmg: 1.4, cd: .7 }];
const worldDiff = () => WORLD_DIFF[Math.min(stageIdx || 0, WORLD_DIFF.length - 1)];
// worlds 2 and 3 field armored elites: a gold guard soaks up light hits until a heavy, launcher or slam breaks it
// a champion: a bigger, tougher, armored version of a wave's own foe, announced by name, and it pays well
const EARLY = () => stageIdx <= 1; // the first two worlds: no armored foes, and gentler champions
function makeChampion(e) {
  if (EARLY()) { e.champ = true; e.hp = e.maxHp = Math.round(e.maxHp * 1.6); e.guard = e.guardMax = 0; e.hw *= 1.3; e.hh *= 1.3; e.dmg = Math.round(e.dmg * 1.1); }
  else { if (!e.elite) makeElite(e);
  e.champ = true; e.hp = e.maxHp = Math.round(e.maxHp * 2.4); e.guard = e.guardMax = e.guardMax + (stageIdx ? 2 : 1); e.hw *= 1.3; e.hh *= 1.3; e.dmg = Math.round(e.dmg * 1.25); }
  floatText(e.x, e.y, e.hh + 30, 'CHAMPION ' + e.def.name.toUpperCase(), '#EED48A', 15); sfx('growl');
}
function makeElite(e) {
  if (EARLY()) return; // no armored foes in the first two worlds
  e.elite = true; e.guardMax = e.guard = stageIdx >= 2 ? 4 : 3;
  e.hp = e.maxHp = Math.round(e.hp * 1.5); e.dmg = Math.round(e.dmg * 1.15);
}
// ---------- breakable armor: what an elite's guard looks like on its body, and what breaking it does ----------
// ARMOR[type] = {
//   draw(e, a)        the armor, drawn in the creature's own space right after the creature (only while e.guard > 0);
//   pieces            [{ x, y, fn, w? }]: the bits that fly off when it breaks, each drawn by fn() about its own middle,
//                     x, y where it sits on the body (creature space, feet at 0, up is negative);
//   cols              the colours of the shards it breaks into;
//   mat               what it is made of: 'metal' | 'glass' | 'stone' | 'porcelain' | 'crystal' (these chip off a few bits
//                     with each pip of guard lost and burst into bits as it breaks: matBurst) | 'wood' | 'cloth' (no bits);
//   onBreak(e, dir)   optional: anything more the break does (the new form, a changed stat, sounds);
// }
// When the guard breaks the pieces tumble away and e.bare = 1, which the creature's own drawing may read to show what was
// underneath. A killed elite whose guard still held sheds its armor the same way.
const ARMOR = {};
function armorBreak(e, dir) {
  const A = ARMOR[e.type]; if (!A || e.bare) return; e.bare = 1;
  const s = e.size || 1, sx = e.sqx || 1, sy = e.sqy || 1;
  for (const p of A.pieces || []) {
    const bx = e.x + p.x * e.facing * s * sx, bz = e.z - p.y * s * sy;
    hazards.push({ kind: 'armorbit', fn: p.fn, x: bx, y: e.y + rand(-2, 2), z: bz, vx: dir * rand(90, 200) + rand(-40, 40), vz: rand(160, 300), rot: 0, vr: dir * rand(5, 11), sc: s, facing: e.facing, t: 2.2, max: 2.2, bounced: 0 });
  }
  const kind = ARMOR_KIND[A.mat]; // a hard armor bursts into bits of what it was made of; anything else into its shards
  if (kind) { matBurst(e.x, e.y, e.z + e.hh * .6, kind, CROWD ? 8 : 14, dir, A.cols && A.cols.slice(0, 3)); if (kind === 'metal') burst(e.x, e.y, e.z + e.hh * .6, ['#FFE6A0', '#FFFFFF', '#FFB050'], 6, 'spark', dir); }
  else if (A.cols) burst(e.x, e.y, e.z + e.hh * .6, A.cols, 18, 'crystal', dir, true);
  if (A.onBreak) A.onBreak(e, dir);
}
function spawnEnemy(type, side, isBoss) {
  let forceElite = false;
  if (!isBoss && type.endsWith('*')) { type = type.slice(0, -1); forceElite = stageIdx >= 1; }
  const def = isBoss ? BOSSES[type] : EDEF[type];
  const wd = worldDiff(), hp = Math.round(scaleStat(def.hp, .8) * ngPow() * (isBoss ? wd.boss : wd.hp) * (!isBoss && def.ranged && !def.poise ? .65 : 1)); // shooters are fragile: close the gap and they drop fast (the armored tank isn't)
  const e = { type, def, boss: !!isBoss, x: side > 0 ? camX + VW + 40 : camX - 40, y: isBoss ? 300 : rand(FLOOR_TOP + 14, FLOOR_BOT - 6),
    z: def.move === 'fly' ? def.hover : 0, vx: 0, vz: 0, facing: -side, hp, maxHp: hp, hw: def.hw, hh: def.hh,
    dmg: Math.round(def.dmg * ngDmgK() * (isBoss ? 1.6 : 1.35) * wd.dmg), cd: rand(.6, 1.4), poiseMax: (def.poise || 0) * (isBoss ? 1.6 : 1), poise: (def.poise || 0) * (isBoss ? 1.6 : 1),
    state: 'idle', t: 0, plan: null, slot: rand(-26, 26), flash: 0, jit: 0, sqx: 1, sqy: 1, sq: 1, rotA: 0, spin: 0, walk: rand(0, 6), hopT: rand(0, .5), air: false, jug: 0, walls: 0 };
  if (!isBoss && (forceElite || (stageIdx >= 1 && def.move !== 'fly' && Math.random() < [0, 0, .3, .38, .44][Math.min(stageIdx, 4)]))) makeElite(e);
  if (isBoss) { e.phase = 1; e.baseDmg = e.dmg; e.size = 1.15; e.hw = def.hw * e.size; e.hh = def.hh * e.size; e.rageT = 0; e.staggers = 0; }
  enemies.push(e); return e;
}
// a boss's damage: higher each phase, and higher again while enraged
const edmg = (e) => Math.round(e.dmg * (e.enraged ? 1.2 : 1));
let hazards = [], carriers = [], corpses = [];
// the fallen stay where they fell for the rest of the world (the oldest fade once there are too many)
function toCorpse(e, kind) {
  e.remove = true; e.corpse = true; e.z = 0; e.vx = e.vz = 0;
  if (kind) e.death = kind;
  corpses.push(e); if (corpses.length > 30) corpses.shift();
} // telegraphed boss attacks: ground marks that erupt, falling strikes, lane beams
function attackers() { let n = 0; for (const e of enemies) if (!e.dead && ['wind', 'strike', 'dash', 'pounce', 'leap'].includes(e.state)) n++; return n; }
function leftWall() { return (lockX !== null ? lockX : camX) + 14; }
function rightWall() { return (lockX !== null ? lockX : camX) + VW - 14; }
function updateEnemy(e, dt) {
  e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt); e.flinch = Math.max(0, (e.flinch || 0) - dt);
  e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
  if (stillT > 0 && !e.dead) return;
  if (updateElements(e, dt)) return;
  if (e.boss && !e.dead) {
    e.rageT = Math.max(0, e.rageT - dt); e.enraged = e.rageT > 0;
    if (['idle', 'recover'].includes(e.state)) {
      const ph = e.hp < e.maxHp * .34 ? 3 : e.hp < e.maxHp * .67 ? 2 : 1;
      if (ph > e.phase) { // a new phase: it transforms, grows, hits harder, and flies into a rage
        for (let q = e.phase + 1; q <= ph; q++) phaseDrop(e);
        e.phase = ph; e.size = 1.15 * (1 + .09 * (ph - 1)); e.hw = e.def.hw * e.size; e.hh = e.def.hh * e.size;
        e.dmg = Math.round(e.baseDmg * [1, 1.15, 1.32][ph - 1]);
        e.rageT = 10; e.roarWhy = 'phase'; e.plan = 'roar'; wind(e, .5);
        burst(e.x, e.y, e.hh * .6, ['#FFFFFF', '#FFB35A', '#E86A80'], 40, e.def.mat, 0, true);
      } else if (e.rageQ) { e.rageQ = false; e.rageT = 10; e.roarWhy = 'rage'; e.plan = 'roar'; wind(e, .45); }
    }
  }
  if (e.boss) e.closeCd = Math.max(0, (e.closeCd || 0) - dt);
  e.cd -= dt * (e.boss ? [1, 1.35, 1.7][e.phase - 1] * (e.enraged ? 1.4 : 1) : 1);
  const fly = e.def.move === 'fly';
  const ballistic = e.air || e.state === 'leap' || e.state === 'pounce' || (!fly && (e.z > 0 || e.vz > 0)); // vz > 0 lets a hop leave the ground
  if (ballistic) {
    e.vz -= GRAV * dt; e.z += e.vz * dt; e.x += e.vx * dt; e.rotA += e.spin * dt;
    if (e.wallOK && (e.walls || 0) < 2 && ((e.x < leftWall() && e.vx < -150) || (e.x > rightWall() && e.vx > 150))) {
      e.vx = -e.vx * .55; e.vz = Math.max(e.vz, 200); e.walls++; e.wallOK = e.walls < 2;
      shakeMag = Math.max(shakeMag, 6); hitstop = Math.max(hitstop, .06); sfx('slam');
      burst(e.x, e.y, e.z + 20, ['#FFFFFF', '#EED48A'], 12, 'spark', Math.sign(e.vx));
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: e.z + 20, t: .25, max: .25, r: 30, col: '#FFFFFF' });
    }
    if (e.z <= 0) { e.z = 0; enemyLand(e); }
  } else if (fly && e.state === 'wind' && e.plan === 'dive') { e.z += (e.def.hover + 70 - e.z) * Math.min(1, dt * 4); // rears up high
  } else if (fly && (e.grounded || 0) > 0) { e.grounded -= dt; // sprawled on the floor after a dive: hit it now
  } else if (fly && !['down', 'dying', 'dive'].includes(e.state) && !e.dead) {
    e.z += (e.def.hover + Math.sin(performance.now() / 300 + e.walk) * 6 - e.z) * Math.min(1, dt * 3);
  }
  e.x = clamp(e.x, camX - 60, camX + VW + 60);
  // knocked back, knocked down, dodging or swinging, a foe stops at the edge of the view instead of sliding out past it
  // (and staying there, out of reach): only walking in, its own special moves and dying take it beyond. In the air it is
  // held at the wall itself, after a hard enough throw has bounced off it (above)
  if (!e.boss && !e.dead && ['hurt', 'down', 'recover', 'evade', 'block', 'wind', 'strike', 'charge', 'pounce', 'leap'].includes(e.state)) {
    const m = e.air ? 0 : Math.min(e.hw * .6, 30), lo = leftWall() + m, hi = rightWall() - m;
    if (e.x < lo) { e.x = lo; if (e.vx < 0) e.vx = 0; } else if (e.x > hi) { e.x = hi; if (e.vx > 0) e.vx = 0; }
  }
  const dxp = P.x - e.x, dyp = P.y - e.y;
  switch (e.state) {
    case 'dying':
      e.t -= dt;
      if (e.death === 'pop') { if (e.t <= 0 && !e.popped) { e.popped = true; popEnemy(e); toCorpse(e, 'lie'); } return; }
      e.x += e.vx * dt; e.vx *= Math.pow(.03, dt);
      if (fly && e.z > 0) { e.vz -= GRAV * dt; e.z = Math.max(0, e.z + e.vz * dt); if (e.z === 0) { dust(e.x, e.y, 6); e.vz = 0; } }
      if (e.t <= 0) toCorpse(e);
      return;
    case 'hurt':
      e.t -= dt; if (!e.air) { e.x += e.vx * dt; e.vx *= Math.pow(.02, dt); if (Math.abs(e.vx) > 160 && Math.random() < .5) dust(e.x, e.y, 1); }
      if (e.t <= 0 && !e.air) { e.state = 'idle'; e.jug = 0; }
      return;
    case 'down':
      e.t -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.002, dt);
      if (e.t <= 0) { e.state = 'idle'; e.rotA = 0; e.cd = Math.max(e.cd, .6); e.jug = 0; e.walls = 0; }
      return;
    case 'idle': {
      if (!e.plan) e.plan = pick(e.boss ? [e.def.p1, e.def.p2, e.def.p3][e.phase - 1] : e.def.plans);
      const p = e.plan, side = Math.sign(e.x - P.x) || 1;
      e.facing = -side;
      // anyone outside the view walks straight in before doing anything else
      const inL = camX + 26 + e.hw, inR = camX + VW - 26 - e.hw;
      if (e.x < inL || e.x > inR) { approach(e, clamp(e.x, inL + 30, inR - 30), P.y, dt, 1.5); return; }
      if (p === 'roar') { wind(e, .45); return; }
      // crowded at close range, a boss doesn't back off to line up its attack: it lashes out all around itself
      // (at most once every few seconds, so you get a real chance to fight up close between bursts)
      if (e.boss && e.cd <= 0 && (e.closeCd || 0) <= 0 && P.state !== 'dead' && Math.abs(dxp) < e.hw + 46 && Math.abs(dyp) < 34) { e.plan = e.def.close; e.closeCd = 4.5; wind(e, 1); return; }
      const melee = p === 'bite' || p === 'swing' || p === 'pounce';
      const busy = attackers() >= 2 && !e.boss;
      let tx, ready;
      if (p === 'shoot' || p === 'volley') { tx = P.x + side * 150; ready = Math.abs(dyp) < 10; }
      else if (p === 'charge') { tx = P.x + side * 150; ready = Math.abs(dyp) < 10 && Math.abs(e.x - tx) < 50; }
      else if (p === 'slam' || p === 'summon') { tx = P.x + side * 100; ready = true; }
      else { const reach = p === 'pounce' ? 90 : e.def.reach; tx = P.x + side * (reach * .75 + e.hw * .5); ready = Math.abs(e.x - tx) < 10 && Math.abs(dyp) < 8; }
      if (busy && !ready) tx = P.x + side * Math.max(90, Math.abs(tx - P.x)); // wait close by, spread out, never far away
      tx = clamp(tx, inL, inR);
      if (ready && e.cd <= 0 && !busy && P.state !== 'dead') wind(e, p === 'charge' ? e.def.wind + .2 : p === 'slam' ? .5 : p === 'summon' ? .8 : e.def.wind);
      else if (ready && melee) e.walk = 0;
      else approach(e, tx, P.y + (busy ? e.slot : 0), dt, busy ? .85 : 1.2);
      return;
    }
    case 'wind': e.t -= dt; if (e.plan !== 'charge') e.facing = Math.sign(dxp) || e.facing; if (e.t <= 0) execute(e); return;
    case 'strike':
      e.t -= dt;
      if (!e.struck) {
        e.struck = true;
        const fwd = (P.x - e.x) * (e.around ? Math.sign(P.x - e.x) || 1 : e.facing), reach = e.def.reach + e.hw;
        if (fwd > -10 && fwd < reach && Math.abs(dyp) < 18 + e.hw * .2 && P.z < 40) hitPlayer({ kind: 'melee', e }, edmg(e), e.x, e.hw > 22 || e.boss);
      }
      if (e.t <= 0) { e.around = false; recover(e, .5); }
      return;
    case 'dash':
      e.t -= dt; e.x += e.facing * (e.plan === 'roll' ? 400 : e.boss ? 330 : 300) * dt; if (e.plan === 'roll') e.rotA += e.facing * dt * 14;
      if (Math.random() < .7) dust(e.x - e.facing * e.hw, e.y, 1);
      if (!e.struck && Math.abs(P.x - e.x) < e.hw + 12 && Math.abs(dyp) < 18 && P.z < 30) { e.struck = true; hitPlayer({ kind: 'melee', e }, Math.round(edmg(e) * 1.2), e.x, true); }
      if (e.rolls > 0 && (e.x < leftWall() || e.x > rightWall())) { // the rolling shell rebounds off the edges
        e.rolls--; e.facing *= -1; e.t = .9; e.struck = false; e.x = clamp(e.x, leftWall(), rightWall()); shakeMag = 8; sfx('slam'); dust(e.x, e.y, 10);
      } else if (e.t <= 0 || e.x < leftWall() || e.x > rightWall()) { e.rolls = 0; e.rotA = 0; e.x = clamp(e.x, leftWall(), rightWall()); recover(e, .8); }
      return;
    case 'pounce': case 'leap':
      if (e.state === 'pounce' && !e.struck && Math.abs(P.x - e.x) < e.hw + 12 && Math.abs(dyp) < 16 && zOverlap(P.z, 60, e.z, e.hh)) { e.struck = true; hitPlayer({ kind: 'melee', e }, edmg(e), e.x, false); }
      if (e.state === 'leap') e.y += (e.ty - e.y) * Math.min(1, dt * 3);
      return;
    case 'dive': { // the wyrm plunges at the marked spot
      e.t -= dt; const k = 1 - Math.max(0, e.t) / .5;
      e.x = lerp(e.dx0, e.tx, k); e.y = lerp(e.dy0, e.ty, k); e.z = lerp(e.dz0, 0, k);
      if (!e.struck && Math.abs(P.x - e.x) < e.hw + 10 && Math.abs(P.y - e.y) < 22 && P.z < 40) { e.struck = true; hitPlayer({ kind: 'melee', e }, Math.round(edmg(e) * 1.2), e.x, true); }
      if (e.t <= 0) { e.z = 0; e.grounded = 1.3; shakeMag = 10; sfx('slam'); burst(e.x, e.y, 6, ['#FFFFFF', '#D8A0E8', '#9FD8E0'], 24, 'crystal', 0, true); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .4, max: .4, r: 90, col: '#FFFFFF', flat: 1 }); recover(e, 1.3); }
      return;
    }
    case 'pull': { // the colossus drags you in on a magnetic field, then strikes
      e.t -= dt;
      if (P.state !== 'dodge' && P.state !== 'dead') { P.x += Math.sign(e.x - P.x) * 150 * dt; P.y += Math.sign(e.y - P.y) * 40 * dt; }
      if (Math.random() < .8) parts.push({ x: P.x + rand(-60, 60), y: P.y, z: rand(10, 70), vx: Math.sign(e.x - P.x) * 220, vy: 0, vz: 0, life: .35, max: .35, col: '#9FD8E8', size: 2, shape: 'streak', rot: 0, vr: 0 });
      if (e.t <= 0) { e.plan = 'swing'; e.around = true; e.state = 'strike'; e.t = .3; e.struck = false; sfx('slam'); shakeMag = 8; }
      return;
    }
    case 'recover': e.t -= dt; if (e.t <= 0) { e.state = 'idle'; e.plan = null; } return;
    case 'evade': // a quick hop back out of reach of a big attack
      e.t -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.03, dt); if (Math.random() < .4) dust(e.x, e.y, 1);
      if (e.t <= 0) { e.state = 'idle'; e.cd = Math.min(e.cd, .25); } return; // and it comes straight back at you
    case 'block': e.t -= dt; e.facing = Math.sign(P.x - e.x) || e.facing; if (e.t <= 0) { e.state = 'idle'; e.cd = Math.min(e.cd, .2); } return;
  }
}
function enemyLand(e) {
  e.sqx = 1.35; e.sqy = .65;
  if (e.state === 'dying') { if (e.death === 'pop' && !e.popped) { e.popped = true; popEnemy(e); toCorpse(e, 'lie'); } return; }
  if (e.bounce) { e.bounce = false; e.vz = 300 * (e.boss ? .4 : e.def.weight); e.air = true; shakeMag = Math.max(shakeMag, 5); dust(e.x, e.y, 8); sfx('slam'); return; }
  if (e.state === 'leap') { slamLand(e); return; }
  if (e.state === 'pounce') { dust(e.x, e.y, 5); e.vx = 0; recover(e, .6); return; } // (the pounce is spent: its speed must not carry into the hops after it)
  if (e.air) { e.air = false; e.spin = 0; e.state = 'down'; e.t = e.stagger || .85; e.stagger = 0; e.walls = 0; dust(e.x, e.y, 8); shakeMag = Math.max(shakeMag, 2.5); }
  if (e.def.move === 'hop') { e.sq = .7; }
}
function approach(e, tx, ty, dt, k) {
  const dx = tx - e.x, dy = ty - e.y, sp = e.def.spd * k * (e.boss ? [1, 1.15, 1.35][e.phase - 1] * (e.enraged ? 1.2 : 1) : 1) * (e.chill > 0 ? .5 : 1);
  const moving = Math.abs(dx) > 3 || Math.abs(dy) > 3;
  if (e.def.move === 'hop') { // jellybloom-style hopping
    e.sq += (1 - e.sq) * Math.min(1, dt * 8);
    if (e.z <= 0 && moving) { e.hopT -= dt; if (e.hopT <= 0) { e.vz = 230; e.vx = 0; e.hopT = rand(.35, .6); e.sq = 1.25; } }
    if (e.z <= 0) return;
  }
  if (Math.abs(dx) > 3) e.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt * (e.def.move === 'hop' ? 1.7 : 1));
  if (Math.abs(dy) > 3) e.y += Math.sign(dy) * Math.min(Math.abs(dy), sp * .7 * dt);
  e.walk = moving ? e.walk + dt * 10 : 0;
  for (const o of enemies) {
    if (o === e || o.dead) continue;
    const ox = e.x - o.x, oy = e.y - o.y;
    if (Math.abs(ox) < (e.hw + o.hw) * .8 && Math.abs(oy) < 12) { e.y += (oy >= 0 ? 1 : -1) * 30 * dt; e.x += (ox >= 0 ? 1 : -1) * 16 * dt; }
  }
  e.y = clamp(e.y, FLOOR_TOP + 8, FLOOR_BOT);
}
// bosses take longer to wind up, so every big attack can be read and dodged
const BOSS_WIND = { submerge: .7, bramble: 1.1, vent: 1.15, coil: 1.05, quake: .9, mines: .7, magnet: .8, dive: .95, orbit: .7, prismwall: .6, bite: .85, swing: .85, sweep: 1.0, roll: 1.1, charge: 1.0, slam: .85, erupt: .8, rain: .7, beam: .6, groundwave: .8, breath: .8, volley: .7, summon: .8 };
// in the third world, enemies cover for each other: when one winds up, a nearby ally may attack with it
function recruitPartner(e) {
  if (e.boss || stageIdx < 2 || Math.random() > .35) return;
  const mates = enemies.filter(o => o !== e && !o.dead && !o.boss && o.state === 'idle' && Math.abs(o.x - e.x) < 240 && o.cd < 1.2);
  if (!mates.length) return;
  const o = pick(mates), plans = o.def.plans;
  o.plan = plans.includes('pounce') ? 'pounce' : plans.includes('charge') ? 'charge' : plans.includes('shoot') ? 'shoot' : plans[0];
  o.facing = Math.sign(P.x - o.x) || o.facing; o.paired = true;
  wind(o, o.def.wind);
}
function wind(e, t) {
  if (e.boss && BOSS_WIND[e.plan]) { t = BOSS_WIND[e.plan] * [1, .88, .76][e.phase - 1] * (e.enraged ? .9 : 1); sfx('growl'); if (e.plan === 'slam' || e.plan === 'dive') e.ty = P.y, e.tx = P.x; }
  e.state = 'wind'; e.t = t; e.windMax = t; e.struck = false; e.walk = 0;
  if (!e.paired) recruitPartner(e); e.paired = false;
}
// each new cycle every foe has that much more health again (on top of its own increase)
const ngPow = () => 1 + .5 * (save.cycle || 0);
const ngCd = () => Math.max(.72, 1 - .09 * (save.cycle || 0)); // in later cycles foes press their attacks sooner
function recover(e, t) { e.state = 'recover'; e.t = t; e.cd = rand(e.def.cd[0], e.def.cd[1]) * worldDiff().cd * ngCd(); }
// extension points: other files can add attack plans (PLAN_FX[plan](e)), their tells (TELL_FX[plan](e, t, k)) and hazard kinds
// (HAZARD_FX[kind] = { update(h, dt), draw(h, t) }) without touching this file
const PLAN_FX = {}, TELL_FX = {}, HAZARD_FX = {};
// the bits of an elite's armor tumbling away when it breaks (see armorBreak)
HAZARD_FX.armorbit = {
  update(h, dt) { h.vz -= 900 * dt; h.x += h.vx * dt; h.z += h.vz * dt; h.rot += h.vr * dt;
    if (h.z <= 0) { h.z = 0; if (h.vz < -60 && h.bounced < 2) { h.bounced++; h.vz = -h.vz * .35; h.vx *= .5; h.vr *= .5; } else { h.vz = 0; h.vx *= Math.pow(.02, dt); h.vr *= Math.pow(.02, dt); } } },
  draw(h, t) { const a = Math.min(1, h.t / .5); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= .3 * a; ctx.fillStyle = '#000'; ell(h.x, h.y, 10 * h.sc, 3 * h.sc); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(h.x, h.y - h.z); ctx.rotate(h.rot); ctx.scale(h.facing * h.sc, h.sc); try { h.fn(); } finally { ctx.restore(); } },
};
function execute(e) {
  const p = e.plan;
  if (PLAN_FX[p]) { PLAN_FX[p](e); return; }
  if (p === 'bite' || p === 'swing') { e.state = 'strike'; e.t = .2; sfx('swing'); e.vx = 0; }
  else if (p === 'pounce') { e.state = 'pounce'; e.vz = 300; e.vx = clamp((P.x - e.x) / .6, -340, 340); e.struck = false; e.sq = 1.3; sfx('jump'); }
  else if (p === 'shoot') { bolt(e, e.y); recover(e, .5); }
  else if (p === 'volley') { [-22, 0, 22].forEach(o => bolt(e, clamp(e.y + o, FLOOR_TOP + 6, FLOOR_BOT))); recover(e, .8); }
  else if (p === 'charge') { e.state = 'dash'; e.t = .8; e.struck = false; sfx('whoosh'); }
  else if (p === 'slam') { const tx = e.boss && e.tx !== undefined ? e.tx : P.x; e.state = 'leap'; e.vz = 420; e.vx = (tx - e.x) / .84; e.ty = e.boss && e.ty !== undefined ? e.ty : P.y; e.tx = undefined; }
  else if (p === 'sweep') { e.state = 'strike'; e.t = .3; e.around = true; sfx('whoosh'); shakeMag = Math.max(shakeMag, 3); }
  else if (p === 'roll') { e.state = 'dash'; e.t = .9; e.rolls = e.phase + 1; e.struck = false; sfx('whoosh'); }
  else if (p === 'erupt') {
    const spots = [[0, 0], [-70, -14], [70, 14], [-140, 10], [140, -10]].slice(0, e.phase * 2 - 1);
    for (const [ox, oy] of spots) hazards.push({ kind: 'spike', x: P.x + ox, y: clamp(P.y + oy, FLOOR_TOP + 8, FLOOR_BOT), r: 40, t: .95, max: .95, dmg: edmg(e), col: e.def.mat === 'crystal' ? '159,216,224' : '126,164,96' });
    sfx('charge'); recover(e, .8);
  }
  else if (p === 'rain') {
    const n = 3 + e.phase * 2;
    for (let i = 0; i < n; i++) hazards.push({ kind: 'fall', x: P.x + rand(-130, 130) * (i ? 1 : 0), y: clamp(P.y + rand(-34, 34) * (i ? 1 : 0), FLOOR_TOP + 8, FLOOR_BOT), r: 28, t: .85 + i * .16, max: .85 + i * .16, dmg: Math.round(edmg(e) * .8), fire: fiery(e) ? 1 : 0, col: fiery(e) ? '255,140,60' : e.def.mat === 'metal' ? '232,106,128' : e.def.mat === 'crystal' ? '216,160,232' : '216,186,120' });
    recover(e, .9);
  }
  else if (p === 'beam') { if (e.phase === 3) hazards.push({ kind: 'beam', y: clamp(P.y + (P.y > 290 ? -46 : 46), FLOOR_TOP + 8, FLOOR_BOT), t: 1.25, max: 1.25, dmg: Math.round(edmg(e) * 1.4), col: '255,170,120', hit: false }); hazards.push({ kind: 'beam', y: P.y, t: 1.25, max: 1.25, dmg: Math.round(edmg(e) * 1.4), col: e.def.mat === 'metal' ? '255,120,140' : '200,170,255', hit: false }); sfx('charge', 2); recover(e, 1.4); }
  else if (p === 'groundwave') { for (const d of e.phase >= 2 ? [-1, 1] : [e.facing]) projs.push({ owner: 'e', ground: 1, x: e.x + d * e.hw, y: e.y, z: 0, vx: d * 260, dmg: edmg(e), life: 3, col: '#EED48A' }); shakeMag = 8; sfx('slam'); recover(e, .7); }
  else if (p === 'breath') { [-44, -22, 0, 22, 44].forEach((o, i) => setTimeout(() => !e.dead && bolt(e, clamp(e.y + o, FLOOR_TOP + 6, FLOOR_BOT)), i * 60)); recover(e, 1); }
  else if (p === e.def.close) {
    const R = e.hw + 70, col = { bramble: '#7EA460', vent: '#FFE2C0', coil: '#C8A0FF' }[p];
    if (Math.hypot(P.x - e.x, (P.y - e.y) * 2.2) < R && P.z < 70) { hitPlayer({ kind: 'melee', e }, Math.round(edmg(e) * 1.1), e.x, true); if (p === 'vent' && P.state === 'hurt') P.vx = Math.sign(P.x - e.x || 1) * 360; } // the steam blows you clear
    fx.push({ kind: 'nova', style: p, x: e.x, y: e.y, z: 0, r: R, t: .5, max: .5, col, seed: Math.random() * 6 });
    burst(e.x, e.y, 20, [col, '#FFFFFF'], 22, p === 'bramble' ? 'rock' : p === 'vent' ? 'spark' : 'crystal', 0, true);
    shakeMag = 10; sfx(p === 'vent' ? 'whoosh' : 'slam'); recover(e, 1.1); // it stays spent for a moment afterward: your opening
  }
  else if (p === 'roar') {
    banner(e.def.name, e.roarWhy === 'rage' ? 'ENRAGED' : e.roarWhy === 'phase' ? (e.phase === 3 ? 'FINAL PHASE · ENRAGED' : 'PHASE TWO · ENRAGED') : e.def.title, 1.8); e.roarWhy = null; sfx('roar'); shakeMag = 14; zoom = .06; flashT = .12;
    fx.push({ kind: 'ring', x: e.x, y: e.y, z: e.hh * .6, t: .7, max: .7, r: 240, col: '#FFFFFF' });
    if (Math.abs(P.x - e.x) < 200 && P.state !== 'dodge' && P.state !== 'dead') { P.state = 'hurt'; P.knocked = false; P.t = .5; P.vx = Math.sign(P.x - e.x || 1) * 320; }
    recover(e, .6);
  }
  else if (p === 'quake') { // shockwave rings ripple out across the floor: jump them
    for (let i = 0; i < e.phase; i++) hazards.push({ kind: 'ring', x: e.x, y: e.y, r: 10, delay: i * .5, speed: 250, dmg: Math.round(edmg(e) * .8), t: 9, max: 9 });
    shakeMag = 12; sfx('slam'); recover(e, .6 + e.phase * .4);
  }
  else if (p === 'mines') { // proximity mines lobbed around you
    for (let i = 0; i < 2 + e.phase; i++) hazards.push({ kind: 'mine', x: clamp(P.x + rand(-150, 150), leftWall() + 20, rightWall() - 20), y: clamp(P.y + rand(-40, 40), FLOOR_TOP + 10, FLOOR_BOT), drop: .45 + i * .1, arm: .9 + i * .1, t: 6, max: 6, r: 52, dmg: edmg(e) });
    sfx('shoot'); recover(e, .8);
  }
  else if (p === 'magnet') { e.state = 'pull'; e.t = 1.2; sfx('charge', 2); }
  else if (p === 'dive') { e.state = 'dive'; e.t = .5; e.struck = false; e.dx0 = e.x; e.dy0 = e.y; e.dz0 = e.z; e.tx = e.tx ?? P.x; e.ty = e.ty ?? P.y; sfx('whoosh'); }
  else if (p === 'orbit') { // shards circle the wyrm, then burst outward
    for (let i = 0; i < 8; i++) projs.push({ owner: 'e', orbit: e, ang: i / 8 * TAU, rad: 20, otime: 1.1, x: e.x, y: e.y, z: e.z + 20, vx: 0, vy: 0, dmg: Math.round(edmg(e) * .7), life: 5, col: fiery(e) ? '#FF8A3A' : '#D8A0E8', fire: fiery(e) ? 1 : 0 }); // (the wyrm's: a wheel of fireballs)
    sfx('charge'); recover(e, 1.3);
  }
  else if (p === 'prismwall') { // a crystal wall sweeps across the arena with a single gap
    const from = Math.random() < .5 ? -1 : 1;
    hazards.push({ kind: 'wall', x: from < 0 ? leftWall() - 10 : rightWall() + 10, dir: -from, gapY: rand(FLOOR_TOP + 24, FLOOR_BOT - 18), wait: .9, speed: 230, dmg: edmg(e), t: 6, max: 6, hit: false });
    sfx('charge', 2); recover(e, 1.6);
  }
  else if (p === 'summon') {
    if (enemies.filter(o => !o.dead && !o.boss).length < 3) e.def.summon.forEach((s, i) => spawnEnemy(s, i % 2 ? -1 : 1));
    burst(e.x, e.y, 60, ['#D08AB0', '#EED48A', '#FFFFFF'], 20, 'spark'); recover(e, .6);
  }
}
function phaseDrop(e) { // each cleared boss phase leaves a little health on the floor (and now and then a great heart)
  floatText(e.x, e.y, e.z + e.hh + 30, 'PHASE CLEARED', '#EED48A', 16);
  if (Math.random() < BIG_HEART.phase) loot.push(makeLoot('bigheal', e.x - e.facing * 30, e.y, 0));
  for (let i = 0; i < 2; i++) loot.push(makeLoot('heal', e.x - e.facing * 30, e.y, 22));
  for (let i = 0; i < 3; i++) loot.push(makeLoot('shard', e.x, e.y, 4));
}
function slamLand(e) {
  shakeMag = 9; sfx('slam'); e.vx = 0;
  fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 110, col: '#FFFFFF', flat: 1 });
  burst(e.x, e.y, 4, ['#FFFFFF', '#E9D8B0'], 18, 'rock', 0, true);
  if (Math.hypot(P.x - e.x, (P.y - e.y) * 2) < 95 && P.z < 16) hitPlayer({ kind: 'melee', e }, Math.round(edmg(e) * 1.3), e.x, true);
  recover(e, .9);
}
const fiery = (e) => e.def.draw === 'wyrm'; // the Kaleidoscope Wyrm breathes fire: every shot of its is a ball of flame
function bolt(e, y) {
  projs.push({ owner: 'e', x: e.x + e.facing * (e.hw + 6), y, z: Math.max(24, e.z + e.hh * .5), vx: e.facing * (e.boss ? 230 : 200), dmg: edmg(e), life: 3.5, fire: fiery(e) ? 1 : 0,
    col: fiery(e) ? '#FF8A3A' : e.def.mat === 'metal' ? '#D04A62' : e.def.mat === 'crystal' || e.def.mat === 'goo' ? '#8FE9FF' : '#EED48A' });
  sfx(fiery(e) ? 'whoosh' : 'shoot');
}

// ---------- loot ----------
// the great heart: rarer than the little green one, and it heals half of all your health. heal: the share of your health;
// the rest are its chances of dropping: from a foe, an elite, a champion, each cleared boss phase, and a fallen boss
const BIG_HEART = { heal: .5, foe: .02, elite: .06, champ: .15, phase: .3, boss: .5 };
{ const _dl = dropLoot; dropLoot = function (e) { _dl(e);
  const p = e.boss ? BIG_HEART.boss : e.champ ? BIG_HEART.champ : e.elite ? BIG_HEART.elite : BIG_HEART.foe;
  if (Math.random() < p) loot.push(makeLoot('bigheal', e.x, e.y, 0)); }; }
function updateLoot(dt) {
  for (const k of loot) {
    k.t += dt;
    k.x = clamp(k.x, leftWall() + 12, rightWall() - 12); // loot never lands outside where you can walk
    if (k.z > 0 || k.vz > 0) { k.vz -= GRAV * dt; k.z = Math.max(0, k.z + k.vz * dt); k.x += k.vx * dt; if (k.z === 0) { k.vz = Math.abs(k.vz) > 120 ? -k.vz * .4 : 0; k.vx *= .5; } }
    const d = Math.hypot(P.x - k.x, (P.y - k.y) * 1.5);
    if (P.state === 'dead' || k.t < .5) continue;
    if (k.kind === 'weapon') { if (d < 30) { k.got = true; gainWeapon(k.weapon, k.lvl); } continue; }
    if (k.kind === 'gear') { if (d < 30) k.got = pickGear(k); continue; } // armor: worn at once if the slot is empty, otherwise into the bag
    if (k.kind === 'arrow') { if (d < 36) { k.got = true; if ((save.arrows || 0) < ARROW_MAX) gainArrow(); } continue; }
    if (k.kind === 'power') { if (k.t > 8) { k.got = true; continue; } if (d < 22) { k.got = true; gainPower(k.power); } continue; } // grab it before it fades
    if (d < 80) { k.x += (P.x - k.x) * Math.min(1, dt * 9); k.y += (P.y - k.y) * Math.min(1, dt * 9); }
    if (d < 14) {
      k.got = true; sfx('pick');
      if (k.kind === 'shard') { save.shards += k.val; runShards += k.val; }
      else if (k.kind === 'sigil') { save.sigils += k.val; runSigils += k.val; floatText(P.x, P.y, 80, '+SIGIL', '#C8607A', 14); }
      else if (k.kind === 'bigheal') { // the great heart: half of all your health at once
        const v = Math.max(k.val || 0, Math.round(maxHp() * BIG_HEART.heal)); P.hp = Math.min(maxHp(), P.hp + v);
        floatText(P.x, P.y, 92, '+' + v, '#FFD27A', 20); sfx('learned'); flashT = Math.max(flashT, .05);
        fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .45, max: .45, r: 70, col: '#FFD27A', flat: 1 });
        burst(P.x, P.y, 50, ['#FFE8A0', '#E8B040', '#D03048', '#FFFFFF'], 18, 'spark', 0, true);
      }
      else { P.hp = Math.min(maxHp(), P.hp + k.val); floatText(P.x, P.y, 80, '+' + k.val, '#7EC2B0', 15); }
      refreshHud();
    }
  }
  loot = loot.filter(k => !k.got);
}
function gainWeapon(id, lvl = 1) {
  runFoundW = true;
  save.wl[id] = Math.max(save.wl[id] || 1, lvl); // (found further on, it is already a level or three up)
  save.owned[id] = true; save.weapon = id; P.w = id; P.seq = ''; persist();
  sfx('weapon'); flashT = .15; zoom = .05; slowmo = .4;
  burst(P.x, P.y, 50, ['#EED48A', '#FFFFFF', '#D08AB0'], 30, 'spark', 0, true);
  banner(WEAPONS[id].name + ' found', 'NEW WEAPON · SWAP TO CHANGE · LEVEL IT AT THE FORGE', 2.6);
  refreshHud(true);
}

// ---------- the stage ----------
function startStage(i) {
  stageIdx = i; stage = baseStage = STAGES[i]; runFoundW = false; zoneTrans = null;
  P = newPlayer();
  enemies = []; projs = []; parts = []; fx = []; nums = []; loot = []; ghosts = []; echoes = []; spawnQ = []; hazards = []; corpses = []; craters = [];
  setZoom(VIEW_NORMAL);
  camX = 0; lockX = null; waveIdx = 0; waveActive = false; bossSpawned = false; boss = null;
  hitstop = 0; shakeMag = 0; zoom = 0; slowmo = 0; clearT = 0; flashT = 0; hurtFlash = 0;
  runShards = 0; runSigils = 0; comboN = 0; comboT = 0; trumpCharge = 0; mirrorT = 0; stillT = 0; stags = []; phoenixT = 0; brandT = 0; resetPowers();
  // each run, a random enemy in a random wave carries each weapon this world can give
  // weapons you don't own yet, in a random order: any of them can turn up in any world
  carriers = [];
  const pool = WEAPON_ORDER.filter(id => id !== 'fists' && !save.owned[id]).sort(() => Math.random() - .5);
  stage.drop.forEach((chance, n) => {
    if (!pool[n]) return;
    if (Math.random() < chance + (n === 0 ? save.pity.any || 0 : 0)) {
      const w = 1 + Math.floor(Math.random() * (stage.waves.length - 1)); // never the first wave
      carriers.push({ weapon: pool[n], wave: w, slot: Math.floor(Math.random() * stage.waves[w].length) });
      if (n === 0) delete save.pity.any;
    } else if (n === 0) { save.pity.any = Math.min(.5, (save.pity.any || 0) + .2); }
  });
  persist();
  enterZone(0);
  $('#bossbar').hidden = true; $('#go').hidden = true;
  refreshHud(true); refreshCombo(); refreshArrows();
  banner(stage.name, stage.sub + (save.cycle ? ' · CYCLE ' + (save.cycle + 1) : ''), 2.4);
}
const waveAt = (i) => 520 + i * ((stage.len - 1300) / stage.waves.length);
function updateWorld(dt) {
  if (!waveActive && waveIdx < stage.waves.length && P.x > waveAt(waveIdx)) {
    waveActive = true; lockX = clamp(camX, 0, stage.len - VW); $('#go').hidden = true;
    const wave = stage.waves[waveIdx];
    wave.forEach((t, j) => spawnQ.push({ type: t, side: j % 2 ? -1 : 1, at: j * .8, drop: null }));
    if (zoneIdx === 1 && waveIdx === 0 && !stage.secret) { // the approach's first wave brings strangers: a couple of foes from this or earlier worlds, and a champion
      boostDrop();
      const firstWorld = (k) => STAGES.findIndex(st => (st.waves || []).some(w => w.some(t => t.replace(/[*!]/g, '') === k))); // the first world a foe appears in
      const pool = Object.keys(EDEF).filter(k => !wave.includes(k) && !EDEF[k].noRandom && firstWorld(k) >= 0 && (firstWorld(k) <= Math.min(stageIdx, 4) || firstWorld(k) === stageIdx)); // (only foes already met on the road: none from later worlds, nor from the roads past the Rim not taken)
      for (let j = 0; j < 2; j++) spawnQ.push({ type: pick(pool), side: j % 2 ? 1 : -1, at: 1.2 + j * 1.4, drop: null });
      spawnQ.push({ type: pick(wave.map(t => t.replace('*', '')).filter(t => EDEF[t] && EDEF[t].move !== 'fly')), side: 1, at: 3.4, drop: null, champ: true });
      spawnQ.sort((a, b) => a.at - b.at);
    }
    for (const d of carriers) if (d.wave === stage.w0 + waveIdx && !save.owned[d.weapon]) spawnQ[d.slot].drop = d.weapon; // nothing marks the carrier
  }
  if (!stage.bossRoom && !waveActive && !zoneTrans && waveIdx >= stage.waves.length && P.x > stage.len - (typeof exitX === 'function' && typeof threshKind === 'function' && THRESH[threshKind()] ? stage.len - exitX() + 18 : 90)) startZoneTrans(); // on to the next place: you step into the landmark at the end of the road
  if (stage.bossRoom && !bossSpawned && P.x > stage.len - VW * .75) {
    setZoom(VIEW_BOSS); // pull the camera back so the whole arena and the boss fit
    bossSpawned = true; waveActive = true; lockX = stage.len - VW; $('#go').hidden = true;
    boss = spawnEnemy(stage.boss, 1, true);
    $('#bossname').textContent = boss.def.name; $('#bossbar').hidden = false;
    boss.plan = 'roar'; playMusic(TRACKS['boss_' + boss.def.draw] ? 'boss_' + boss.def.draw : 'boss'); // each boss has its own theme
  }
  for (const s of spawnQ) s.at -= dt;
  while (spawnQ.length && spawnQ[0].at <= 0) { const s = spawnQ.shift(); if (s.type.endsWith('!')) { s.type = s.type.slice(0, -1); s.champ = true; } const e = spawnEnemy(s.type, s.side, false, s.champ); if (s.drop) e.dropWeapon = s.drop; if (s.champ) makeChampion(e); }
  if (waveActive && !bossSpawned && !spawnQ.length && !enemies.some(e => !e.dead)) { waveActive = false; lockX = null; waveIdx++; $('#go').hidden = false; }
  const target = clamp(P.x - VW * .4, 0, stage.len - VW);
  if (lockX !== null) camX += (lockX - camX) * Math.min(1, dt * 5);
  else camX = Math.max(camX, camX + (target - camX) * Math.min(1, dt * 5));
  camX = clamp(camX, 0, Math.max(0, stage.len - VW));

  updateMech(dt); updateShrink(P, dt); updateBossRoom(dt); updateSecret(dt);
  for (const e of enemies) { updateShrink(e, dt); const k = e.shrink || 1;
    if (e.punted && !['hurt', 'down'].includes(e.state) && !e.air) e.punted = false; // (a punt lasts until it is back on its feet)
    if (k >= 1 || e.punted) { updateEnemy(e, dt); continue; } // (punted by a full-size prince: it flies the full distance)
    // shrunk by the spores, a foe moves in proportion to its size: every step, lunge, knockback and arc covers a scaled-down
    // stretch of ground in the same time, so it looks as fast as it did at full size, only smaller
    const x0 = e.x, y0 = e.y, z0 = e.z; updateEnemy(e, dt);
    e.x = x0 + (e.x - x0) * k; e.y = y0 + (e.y - y0) * k; if (e.z > 0 || z0 > 0) e.z = Math.max(0, z0 + (e.z - z0) * k); }
  enemies = enemies.filter(e => !e.remove);
  if (stillT <= 0) for (const p of projs) {
    if (p.orbit) {
      const o = p.orbit;
      if (p.otime > 0 && !o.dead) { p.otime -= dt; p.ang += 4 * dt; p.rad = Math.min(84, p.rad + 90 * dt); p.x = o.x + Math.cos(p.ang) * p.rad; p.y = clamp(o.y + Math.sin(p.ang) * p.rad * .35, FLOOR_TOP + 4, FLOOR_BOT); p.z = o.z + 20; }
      else { p.orbit = null; p.vx = Math.cos(p.ang) * 230; p.vy = Math.sin(p.ang) * 70; }
    }
    p.x += p.vx * dt; p.y = clamp(p.y + (p.vy || 0) * dt, FLOOR_TOP + 4, FLOOR_BOT); p.life -= dt; if (p.vz) p.z += p.vz * dt;
    if (p.fire && Math.random() < dt * 40) parts.push({ x: p.x + rand(-4, 4), y: p.y, z: p.z + rand(-4, 4), vx: -(p.vx || 0) * .15 + rand(-20, 20), vy: 0, vz: rand(20, 70), life: .45, max: .45, col: pick(['#FFD27A', '#FF8A3A', '#E84A2A', '#7A3A2A']), size: rand(2, 4), shape: 'puff' }); // a fireball sheds flame and embers
    if (p.owner === 'e') {
      if (p.ground && Math.random() < .7) dust(p.x, p.y, 1);
      if (Math.abs(p.x - P.x) < (p.ground ? 16 : 12) && Math.abs(p.y - P.y) < (p.ground ? 16 : 12) && P.z < (p.ground ? 14 : 40) && P.state !== 'dead') { hitPlayer({ kind: 'proj', p }, p.dmg, p.x - p.vx, false); if (p.owner === 'e') p.life = 0; }
    } else {
      if (p.tornado) { tornadoTick(p, dt); continue; }
      if (p.arrow) { steerArrow(p, dt); if (p.z < 2) { p.life = 0; dust(p.x, p.y, 2); continue; } if (arrowHit(p)) p.life = 0; continue; } // an arrow aimed low ends in the ground
      for (const e of enemies) if (!e.dead && !p.hit.has(e) && Math.abs(p.x - e.x) < 24 && Math.abs(p.y - e.y) < 26) { p.hit.add(e); strike(e, p.dmg, Math.sign(p.vx), p.quake ? { dmg: p.dmg, kb: 120, launch: 380, power: 2, smash: 1 } : { dmg: p.dmg, kb: 300, launch: 300, power: 2 }); }
      if (p.quake) { if (Math.random() < .8) dust(p.x, p.y, 1); }
      else if (Math.random() < .9) parts.push({ x: p.x, y: p.y + rand(-10, 10), z: rand(0, 40), vx: 0, vy: 0, vz: 40, life: .4, max: .4, col: '#D08AB0', size: 3, shape: 'star', rot: 0, vr: 4 });
    }
  }
  projs = projs.filter(p => p.life > 0 && p.x > camX - 60 && p.x < camX + VW + 60);
  for (const p of props) p.flash = Math.max(0, (p.flash || 0) - dt);
  props = props.filter(p => !p.broken);
  updateLoot(dt); updateTrumps(dt); updatePowers(dt); updateGear(dt); updateHazards(dt);
  if (boss && !boss.dead && Math.random() < dt * 14) { // each boss's arena has its own weather
    const kind = boss.def.draw, x = camX + rand(0, VW);
    if (kind === 'mossback') parts.push({ x, y: rand(FLOOR_TOP, FLOOR_BOT), z: 260, vx: rand(-30, 10), vy: 0, vz: -40, life: 5, max: 5, col: pick(['#C9A86A', '#8A6A3A', boss.phase === 3 ? '#FF8A4A' : '#7EA460']), size: 3, shape: 'tuft', rot: rand(0, 6), vr: 2 });
    else if (kind === 'colossus') parts.push({ x, y: rand(FLOOR_TOP, FLOOR_BOT), z: 0, vx: 0, vy: 0, vz: rand(40, 80), life: 1.4, max: 1.4, col: 'rgba(230,220,210,.35)', size: rand(6, 10), shape: 'puff', rot: 0, vr: 0 });
    else parts.push({ x, y: rand(FLOOR_TOP, FLOOR_BOT), z: rand(20, 160), vx: rand(-10, 10), vy: 0, vz: 30, life: 1.6, max: 1.6, col: pick(['#D8A0E8', '#9FD8E0', '#FFF0C0']), size: 2, shape: 'star', rot: 0, vr: 3 });
  }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) endCombo(); }
  if (clearT > 0) { clearT -= dt; if (clearT <= 0) stageClear(); }
}
function endCombo() {
  if (comboN >= 10) { const b = Math.floor(comboN / 7); save.shards += b; runShards += b; floatText(P.x, P.y, 96, `${comboN} HITS · +${b} SHARDS`, '#7EC2B0', 14); }
  comboN = 0; refreshCombo();
}

function updateHazards(dt) {
  if (stillT > 0) return;
  for (const h of hazards) {
    h.t -= dt;
    if (HAZARD_FX[h.kind]) { HAZARD_FX[h.kind].update(h, dt); continue; }
    if (h.kind === 'ring') {
      if (h.delay > 0) { h.delay -= dt; continue; }
      h.r += h.speed * dt;
      const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2);
      if (!h.hit && Math.abs(d - h.r) < 14 && P.z < 10) { h.hit = true; playerDamage(h.dmg, h.x, true); }
      if (h.r > 520) h.t = -1;
      continue;
    }
    if (h.kind === 'mine') {
      h.drop -= dt; h.arm -= dt;
      const near = Math.hypot(P.x - h.x, (P.y - h.y) * 2) < 36;
      if (!h.done && h.arm <= 0 && (near || h.t <= .05)) {
        h.done = true; h.t = Math.min(h.t, 0);
        if (Math.hypot(P.x - h.x, (P.y - h.y) * 2) < h.r && P.z < 24) playerDamage(h.dmg, h.x, true);
        burst(h.x, h.y, 6, ['#FFD27A', '#FF7A4A', '#FFFFFF'], 18, 'metal', 0, true); fx.push({ kind: 'ring', x: h.x, y: h.y, z: 4, t: .35, max: .35, r: h.r * 1.3, col: '#FFB35A', flat: 1 }); shakeMag = Math.max(shakeMag, 6); sfx('slam');
      }
      continue;
    }
    if (h.kind === 'wall') {
      if (h.wait > 0) { h.wait -= dt; continue; }
      h.x += h.dir * h.speed * dt;
      if (!h.hit && Math.abs(P.x - h.x) < 12 && Math.abs(P.y - h.gapY) > 20 && P.state !== 'dead') { h.hit = true; playerDamage(h.dmg, h.x - h.dir * 20, true); }
      if (h.x < camX - 40 || h.x > camX + VW + 40) h.t = -1;
      continue;
    }
    if (h.kind === 'beam') {
      if (h.t < .35 && !h.fired) { h.fired = true; sfx('shoot'); shakeMag = Math.max(shakeMag, 7); flashT = .05; }
      if (h.fired && !h.hit && Math.abs(P.y - h.y) < 14 && P.z < 60) { h.hit = true; playerDamage(h.dmg, P.x - P.facing, true); }
    } else if (h.t <= 0 && !h.done) {
      h.done = true;
      if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r + 8 && P.z < 24) playerDamage(h.dmg, h.x, true);
      burst(h.x, h.y, 4, [`rgb(${h.col})`, '#FFFFFF'], 14, h.kind === 'spike' ? 'crystal' : 'rock', 0, true);
      fx.push({ kind: 'ring', x: h.x, y: h.y, z: 2, t: .3, max: .3, r: h.r * 1.4, col: '#FFFFFF', flat: 1 });
      shakeMag = Math.max(shakeMag, 5); sfx(h.kind === 'spike' ? 'crunch' : 'slam');
    }
  }
  hazards = hazards.filter(h => h.t > -.4 || (h.kind === 'mine' && !h.done));
}
