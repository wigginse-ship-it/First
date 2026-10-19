'use strict';
// ---------- gear: armor that drops as loot and is worn in four slots ----------
// There is no helmet: Corwin's face stays bare. Mail (the torso, its shoulder guards and the coat tails), legs
// (thighs, shins and boots), gauntlets (forearms and hands) and a waist piece (belt or sash). Five sets, one per
// world, each with its own look; wearing two or four pieces of one set wakes its set bonus. Any piece can come
// enchanted: the same piece with one affix (two at high tiers), a gold-violet glint and a faint aura on him.
// Every stat the gear touches is read through gearStat(name), cached until the gear changes.
const GEAR_SLOTS = ['mail', 'pants', 'gauntlets', 'waist'];
const SLOT_NAME = { mail: 'Mail', pants: 'Legs', gauntlets: 'Gauntlets', waist: 'Waist' };
const BAG_MAX = 24;
const GEAR_DEF = { mail: [3, 8, 16, 25, 35], pants: [2, 6, 11, 17, 25], gauntlets: [2, 5, 9, 14, 20], waist: [1, 5, 9, 14, 20] }; // full sets: 8, 24, 45, 70, 100
const GEAR_HP = [2, 4, 6, 8, 10]; // max health per piece, by tier
const BASE_HP = 120;
const qMul = (q) => 1 + .15 * (q || 0); // each NG+ cycle's "+1" quality

// the five sets. Palettes are flat strings so a greyed copy of the look (the Phantom in Tir-na Nog'th) greys them too:
// m* mail (m1 main, m2 second, m3 accent, m4 light, mt1/mt2 coat tails, ms sleeves, mp shoulder guards),
// p* legs (p1 thigh, ps shin, p2 boots, p3 knee accent, p4 detail), g* gauntlets (g1 forearm, g2 hand, g3 cuff, g4 detail),
// w* waist (w1 band, w2 clasp, w3 detail)
const GEAR_SETS = [null,
  { name: "Wayfarer's Leathers", short: 'Wayfarer', col: '#C9A26A', glow: '216,196,150', where: 'the Bloomwild',
    pieces: { mail: "Wayfarer's Jerkin", pants: "Wayfarer's Breeches", gauntlets: "Wayfarer's Bracers", waist: "Wayfarer's Rope Belt" },
    pal: { m1: '#7A5634', m2: '#C2B394', m3: '#4A3220', m4: '#C89A68', mt1: '#5E5242', mt2: '#6E604C', ms: '#8E7E62', mp: '#6A4A2E',
      p1: '#6E6250', ps: '#8C7C5E', p2: '#4A3424', p3: '#7A5634', p4: '#C2B394', g1: '#7A5634', g2: '#8A6A4A', g3: '#C2B394', g4: '#4A3220', w1: '#A88A5A', w2: '#6A4A2E', w3: '#6E5636' },
    b2: { txt: '+5% move speed', s: { speed: .05 } }, b4: { name: "Wayfarer's Stride", txt: 'dodges recover 30% sooner (same distance, same safety)', s: { dodgeFast: .3 } } },
  { name: "Sky-Corsair's Rig", short: 'Corsair', col: '#D86A5A', glow: '150,220,170', where: 'the Clockwork Skyport',
    pieces: { mail: "Corsair's Studded Coat", pants: "Corsair's Sky-Breeches", gauntlets: "Corsair's Brass Gauntlets", waist: "Corsair's Crimson Sash" },
    pal: { m1: '#8A2A2A', m2: '#3A2418', m3: '#D8AA50', m4: '#B8524A', mt1: '#7A2424', mt2: '#5A1A1E', ms: '#6E2222', mp: '#C99A44',
      p1: '#2A3452', ps: '#4A2E1E', p2: '#3A2418', p3: '#D8AA50', p4: '#E8D8B0', g1: '#5A2A1E', g2: '#4A2A1E', g3: '#C99A44', g4: '#FFE8A0', w1: '#B8283A', w2: '#D8AA50', w3: '#7A1424' },
    b2: { txt: '+15% shards from foes', s: { shards: .15 } }, b4: { name: 'Fair Winds', txt: '+10% move speed, and an arrow comes back to the quiver every 15 seconds', s: { speed: .1, arrowRefill: 15 } } },
  { name: 'Prism-Glass Scale', short: 'Prism', col: '#B89CFF', glow: '150,190,255', where: 'the Prism Rim',
    pieces: { mail: 'Prism Scale Hauberk', pants: 'Prism Scale Greaves', gauntlets: 'Prism Vambraces', waist: 'Prism Light-Sash' },
    pal: { m1: '#4A2E78', m2: '#7A5AB8', m3: '#9FE8F0', m4: '#D2C4FF', mt1: '#5A3A8A', mt2: '#3E2868', ms: '#3A2462', mp: '#8A6ACF',
      p1: '#3A2462', ps: '#6A4AA8', p2: '#2A1A48', p3: '#A88EF0', p4: '#9FE8F0', g1: '#7A5AB8', g2: '#4A2E78', g3: '#9FE8F0', g4: '#D2C4FF', w1: '#C8B0FF', w2: '#9FE8F0', w3: '#7A5AB8' },
    b2: { txt: 'shots and hazards hurt 10% less', s: { resist: .1 } }, b4: { name: 'Mirror of the Rim', txt: 'one shot in three that strikes you is turned back on the shooter', s: { reflect: .34 } } },
  { name: 'Chaos Plate', short: 'Chaos', col: '#FF7A3A', glow: '255,130,70', where: 'the Courts of Chaos',
    pieces: { mail: 'Chaos Plate Cuirass', pants: 'Chaos Plate Cuisses', gauntlets: 'Chaos Talons', waist: 'Chaos Chain Girdle' },
    pal: { m1: '#1E1418', m2: '#6A1418', m3: '#FF7A3A', m4: '#3E2C32', mt1: '#2A1418', mt2: '#4A1218', ms: '#2A1A20', mp: '#2A1A1E',
      p1: '#1E1418', ps: '#3A1C20', p2: '#2A1418', p3: '#7A1820', p4: '#FF7A3A', g1: '#2A1A1E', g2: '#3A1A1E', g3: '#7A1820', g4: '#FF7A3A', w1: '#4A3E44', w2: '#8A1A22', w3: '#FF7A3A' },
    b2: { txt: 'foes who strike you take 10% of the blow back', s: { thorns: .1 } }, b4: { name: 'Ember Seams', txt: 'foes who strike you take another 30% back, and catch fire', s: { thorns: .3, burn: 1 } } },
  { name: "Moon-Silver of Tir-na Nog'th", short: 'Moon-Silver', col: '#E8F0FF', glow: '220,232,255', where: "Tir-na Nog'th",
    pieces: { mail: 'Moon-Silver Cuirass', pants: 'Moon-Silver Greaves', gauntlets: 'Moon-Silver Gauntlets', waist: 'Moon-Silver Girdle' },
    pal: { m1: '#C4CCDC', m2: '#8496BE', m3: '#FFFFFF', m4: '#EEF2FA', mt1: '#DDE2EE', mt2: '#AEB8CE', ms: '#8E9AB4', mp: '#D8DEEA',
      p1: '#8E9AB4', ps: '#D2D8E6', p2: '#C4CCDC', p3: '#EEF2FA', p4: '#FFFFFF', g1: '#D2D8E6', g2: '#C4CCDC', g3: '#FFFFFF', g4: '#8496BE', w1: '#E4E8F2', w2: '#FFFFFF', w3: '#7FA8E8' },
    b2: { txt: 'regain 1 health every 2 seconds once you have gone 3 seconds unhurt', s: { regen: .5 } }, b4: { name: 'The Moon Refuses', txt: 'once in each place, a killing blow leaves you standing at 40% health', s: { deathSave: 1 } } },
];
// enchantments: values by tier (×0.8–1.2 per roll, and +10% per quality step); suffix for the first, prefix for a second
const AFFIXES = {
  crit:    { v: [.03, .04, .05, .065, .08], pct: 1, txt: 'critical chance', suf: 'of Keen Shadow', pre: 'Keen' },
  hp:      { v: [8, 12, 18, 24, 30], txt: 'max health', suf: 'of the Unicorn', pre: 'Hale' },
  leech:   { v: [.015, .02, .025, .03, .04], pct: 1, txt: 'of damage dealt heals you', suf: 'of Thirst', pre: 'Thirsting' },
  thorns:  { v: [.1, .14, .18, .24, .3], pct: 1, txt: 'of a blow struck back at the striker', suf: 'of Thorns', pre: 'Thorned' },
  speed:   { v: [.03, .04, .05, .06, .08], pct: 1, txt: 'move speed', suf: 'of the Hellride', pre: 'Swift' },
  trump:   { v: [.08, .12, .16, .2, .25], pct: 1, txt: 'Trump charge from hits', suf: 'of Dworkin', pre: 'Inked' },
  shards:  { v: [.08, .12, .16, .2, .25], pct: 1, txt: 'shards from foes', suf: 'of the Gilded Hand', pre: 'Gilded' },
  iframes: { v: [.03, .04, .05, .06, .08], sec: 1, txt: 'longer dodge safety', suf: 'of Shadow-Step', pre: 'Fleeting' },
  arrow:   { v: [.1, .14, .18, .22, .28], pct: 1, txt: 'arrow damage', suf: "of Julian's Hunt", pre: 'Fletched' },
  resist:  { v: [.05, .07, .09, .12, .15], pct: 1, txt: 'less harm from shots and hazards', suf: 'of Embers', pre: 'Warded' },
};
const AFFIX_IDS = Object.keys(AFFIXES);
const STAT_CAP = { crit: .3, speed: .3, resist: .5, leech: .1, iframes: .25, reflect: .6 };

// ---------- the save: what is worn and what is carried ----------
const freshGear = () => ({ eq: { mail: null, pants: null, gauntlets: null, waist: null }, bag: [], pity: 0, uid: 1 });
const validItem = (it) => it && typeof it === 'object' && GEAR_SETS[it.set] && GEAR_SLOTS.includes(it.slot);
function makeGearItem(set, slot, opts = {}) {
  const g = save.gear;
  const it = { id: g.uid++, set: clamp(set | 0, 1, 5), slot: slot || pick(GEAR_SLOTS), q: opts.q ?? (save.cycle || 0), ench: [] };
  for (const k of opts.ench || []) if (AFFIXES[k] && !it.ench.some(a => a.k === k)) it.ench.push({ k, r: Math.random() });
  return it;
}
(function migrateGear() {
  const old = save.armor;
  if (!save.gear || typeof save.gear !== 'object') save.gear = freshGear();
  const g = save.gear, f = freshGear();
  g.eq = Object.assign(f.eq, g.eq || {}); g.bag = Array.isArray(g.bag) ? g.bag.filter(validItem).slice(0, BAG_MAX) : []; g.pity = g.pity | 0; g.uid = Math.max(1, g.uid | 0);
  for (const s of GEAR_SLOTS) if (!validItem(g.eq[s]) || g.eq[s].slot !== s) g.eq[s] = null;
  for (const it of [...g.bag, ...GEAR_SLOTS.map(s => g.eq[s])]) if (it) { it.ench = Array.isArray(it.ench) ? it.ench.filter(a => a && AFFIXES[a.k]) : []; it.q = it.q | 0; g.uid = Math.max(g.uid, (it.id | 0) + 1); }
  if (typeof old === 'number') { // a save from before the loot: the forge's Rose Mail becomes a full set of the matching tier
    if (old > 1 && GEAR_SLOTS.every(s => !g.eq[s])) for (const s of GEAR_SLOTS) g.eq[s] = makeGearItem(Math.min(5, old), s, { q: 0 });
    delete save.armor; persist();
  }
})();

// ---------- stats ----------
let GEAR_V = 0, gearCache = null;
function gearChanged() { GEAR_V++; gearCache = null; heroLookCache = null; }
const itemTier = (it) => it.set;
const itemDef = (it) => Math.round(GEAR_DEF[it.slot][it.set - 1] * qMul(it.q));
const itemHp = (it) => Math.round(GEAR_HP[it.set - 1] * qMul(it.q));
const affixVal = (it, a) => AFFIXES[a.k].v[it.set - 1] * (.8 + .4 * (a.r ?? .5)) * (1 + .1 * (it.q || 0));
function setCounts(eq) { const n = {}; for (const s of GEAR_SLOTS) if (eq[s]) n[eq[s].set] = (n[eq[s].set] || 0) + 1; return n; }
function statsFor(eq) {
  const st = { def: 0, hp: 0, sets: [] };
  const add = (k, v) => { st[k] = (st[k] || 0) + v; };
  for (const s of GEAR_SLOTS) { const it = eq[s]; if (!it) continue; add('def', itemDef(it)); add('hp', itemHp(it)); for (const a of it.ench) add(a.k, affixVal(it, a)); }
  const n = setCounts(eq);
  for (const id in n) {
    const S = GEAR_SETS[id]; if (n[id] < 2) continue;
    st.sets.push({ id: +id, n: n[id] });
    for (const k in S.b2.s) add(k, S.b2.s[k]);
    if (n[id] >= 4) for (const k in S.b4.s) add(k, S.b4.s[k]);
  }
  for (const k in STAT_CAP) if (st[k] > STAT_CAP[k]) st[k] = STAT_CAP[k];
  return st;
}
function gearStat(name) { if (!gearCache) gearCache = statsFor(save.gear.eq); return gearCache[name] || 0; }
const gearDR = (def) => def / (100 + def); // the share of a blow the armor turns aside
const gearMaxHp = () => BASE_HP + Math.round(gearStat('hp'));

// ---------- names ----------
function itemName(it) {
  const S = GEAR_SETS[it.set], e = it.ench;
  let n = S.pieces[it.slot];
  if (e[0]) n += ' ' + AFFIXES[e[0].k].suf;
  if (e[1]) n = AFFIXES[e[1].k].pre + ' ' + n;
  if (it.q) n += ' +' + it.q;
  return n;
}
function affixTxt(it, a) {
  const A = AFFIXES[a.k], v = affixVal(it, a);
  return A.pct ? `+${Math.round(v * 100)}% ${A.txt}` : A.sec ? `+${v.toFixed(2)}s ${A.txt}` : `+${Math.round(v)} ${A.txt}`;
}
const salvageValue = (it) => Math.round((8 + 10 * it.set) * (1 + .5 * (it.q || 0)) * (1 + it.ench.length) * cyc());

// ---------- equipping ----------
function hpAdjust(before) { // more max health is yours at once; less trims what you have
  if (!P) return; const after = maxHp();
  if (after > before && P.hp > 0) P.hp += after - before;
  P.hp = Math.min(P.hp, after);
}
function equipItem(bagIdx) {
  const g = save.gear, it = g.bag[bagIdx]; if (!it) return false;
  const before = maxHp(), old = g.eq[it.slot];
  g.eq[it.slot] = it; g.bag.splice(bagIdx, 1); if (old) g.bag.splice(bagIdx, 0, old);
  gearChanged(); hpAdjust(before); persist(); return true;
}
function unequipSlot(slot) {
  const g = save.gear; if (!g.eq[slot] || g.bag.length >= BAG_MAX) return false;
  const before = maxHp(); g.bag.push(g.eq[slot]); g.eq[slot] = null;
  gearChanged(); hpAdjust(before); persist(); return true;
}
function salvageItem(where, key) {
  const g = save.gear, it = where === 'eq' ? g.eq[key] : g.bag[key]; if (!it) return 0;
  const before = maxHp(), v = salvageValue(it);
  if (where === 'eq') g.eq[key] = null; else g.bag.splice(key, 1);
  save.shards += v; gearChanged(); hpAdjust(before); persist(); return v;
}
// a new piece: worn at once if that slot is empty, otherwise into the bag; false when the bag is full
function storeGear(it) {
  const g = save.gear;
  if (!g.eq[it.slot]) { const before = maxHp(); g.eq[it.slot] = it; gearChanged(); hpAdjust(before); persist(); return 'worn'; }
  if (g.bag.length >= BAG_MAX) return false;
  g.bag.push(it); persist(); return 'bag';
}

// ---------- drops ----------
const worldTier = () => clamp((stageIdx || 0) + 1, 1, 5);
function rollTier(boss) { // mostly this world's tier, sometimes one lower, rarely one higher (a boss: now and then one higher)
  const base = worldTier(), r = Math.random();
  const t = boss ? (r < .2 ? base + 1 : base) : r < .1 ? base + 1 : r < .32 ? base - 1 : base;
  return clamp(t, 1, 5);
}
function rollEnchants(tier, chance, two) {
  if (Math.random() >= chance) return [];
  const ids = AFFIX_IDS.slice().sort(() => Math.random() - .5);
  return ids.slice(0, tier >= 4 && Math.random() < two ? 2 : 1);
}
// the odds for each kind of foe: [drop, enchanted, two affixes]
const GEAR_ODDS = { normal: [.05, .1, .25], elite: [.18, .25, .35], champ: [.5, .4, .45], boss: [1, .55, .6] };
const PITY_STEP = .01, PITY_MAX = 22; // every kill without a drop raises the odds a little; after 22 the next one drops
function gearDrop(x, y, tier, ench) {
  const it = makeGearItem(tier, pick(GEAR_SLOTS), { ench });
  loot.push(Object.assign(makeLoot('gear', x, y, 0), { item: it }));
  return it;
}
function maybeDropGear(e) {
  if (e.noGear) return;
  const g = save.gear, kind = e.boss ? 'boss' : e.champ ? 'champ' : e.elite ? 'elite' : 'normal', [p, pe, p2] = GEAR_ODDS[kind];
  const chance = g.pity >= PITY_MAX ? 1 : p + g.pity * PITY_STEP;
  if (Math.random() < chance) { const t = rollTier(e.boss); gearDrop(e.x, e.y, t, rollEnchants(t, pe, p2)); g.pity = 0; }
  else g.pity++;
  if (window.__gearLog) window.__gearLog.push({ kind, pity: g.pity });
}
// secret rooms pay in armor too
function secretGear(x, y, enchChance, n = 1) { for (let i = 0; i < n; i++) { const t = rollTier(true); gearDrop(x, y, t, rollEnchants(t, enchChance, .6)); } save.gear.pity = 0; }

// picking a piece up (or sweeping it up when leaving a place)
let bagFullMsgT = 0;
function pickGear(k) {
  const it = k.item, r = storeGear(it);
  if (!r) {
    if (performance.now() > bagFullMsgT) { bagFullMsgT = performance.now() + 1600; floatText(P.x, P.y, 86, 'BAG FULL · SALVAGE SOMETHING', '#FF9A8A', 12); }
    return false;
  }
  const S = GEAR_SETS[it.set];
  sfx(it.ench.length ? 'learned' : 'pick'); sfx('buy');
  floatText(P.x, P.y, 92, itemName(it).toUpperCase(), it.ench.length ? '#E8C8FF' : S.col, 13);
  floatText(P.x, P.y, 76, r === 'worn' ? 'PUT ON · DEF ' + itemDef(it) : 'TO THE BAG · PAUSE › INVENTORY', 'rgba(240,230,210,.9)', 10);
  burst(P.x, P.y, 40, [S.col, '#FFFFFF', ...(it.ench.length ? ['#E8C060', '#B89CFF'] : [])], 16, 'spark', 0, true);
  refreshHud(); return true;
}
function sweepGear(k) { // leaving a place: what's left on the floor is taken if there's room, salvaged if not
  if (storeGear(k.item)) return;
  const v = salvageValue(k.item); save.shards += v; if (typeof runShards !== 'undefined') runShards += v;
}

// ---------- in play: set bonuses that tick ----------
let arrowRefillT = 0;
function updateGear(dt) {
  if (!P || P.state === 'dead') return;
  P.hurtT = (P.hurtT || 0) + dt;
  const regen = gearStat('regen');
  if (regen && P.hurtT > 3 && P.hp < maxHp()) { P.regenAcc = (P.regenAcc || 0) + regen * dt; if (P.regenAcc >= 1) { const n = Math.floor(P.regenAcc); P.regenAcc -= n; P.hp = Math.min(maxHp(), P.hp + n); } }
  const every = gearStat('arrowRefill');
  if (every && (save.arrows || 0) < ARROW_MAX) { arrowRefillT += dt; if (arrowRefillT >= every) { arrowRefillT = 0; gainArrow(); } } else arrowRefillT = 0;
}
// how a blow lands on him through the armor. src: { kind: 'melee' | 'proj', e, p } or null (hazards)
let HIT_SRC = null;
function hitPlayer(src, dmg, fromX, big) { HIT_SRC = src; try { playerDamage(dmg, fromX, big); } finally { HIT_SRC = null; } }
function armorDamage(dmg) {
  const src = HIT_SRC, kind = src ? src.kind : 'hazard';
  let d = dmg * (1 - gearDR(gearStat('def')));
  if (kind !== 'melee') d *= 1 - gearStat('resist');
  return Math.max(1, Math.round(d));
}
function tryReflect() { // the prism set turns a shot back
  const src = HIT_SRC; if (!src || src.kind !== 'proj' || !src.p) return false;
  const p = src.p; if (p.ground || p.orbit || p.big || !(Math.random() < gearStat('reflect'))) return false;
  p.owner = 'p'; p.vx = -(p.vx || 0) * 1.25 || P.facing * 260; p.vy = 0; p.hit = new Set(); p.dmg = Math.round((p.dmg || 10) * 2); p.life = 1.6; p.reflected = true; p.col = '#9FE8F0';
  floatText(P.x, P.y, 80, 'REFLECTED', '#9FE8F0', 13); sfx('hit-crystal'); burst(P.x + P.facing * 10, P.y, 40, ['#9FE8F0', '#D2C4FF', '#FFFFFF'], 12, 'crystal', Math.sign(p.vx));
  fx.push({ kind: 'ring', x: P.x, y: P.y, z: 40, t: .25, max: .25, r: 30, col: '#9FE8F0' });
  return true;
}
function thornsBack(raw) { // chaos plate: the striker takes part of the blow back
  const src = HIT_SRC; if (!src || src.kind !== 'melee' || !src.e || src.e.dead) return;
  const e = src.e, th = gearStat('thorns');
  if (th > 0) { const d = Math.max(1, Math.round(raw * th)); strike(e, d, Math.sign(e.x - P.x) || 1, { dmg: d, kb: 60, power: 0, trump: 1, noStun: 1, thorns: 1 }, true); }
  if (gearStat('burn') && !e.dead) { e.burn = 3; e.burnBase = Math.max(3, raw * .12); burst(e.x, e.y, e.z + e.hh * .5, ['#FF7A3A', '#FFD27A'], 8, 'spark'); }
}
function deathSave() { // moon-silver: once in each place
  if (!gearStat('deathSave') || P.moonSaved) return false;
  P.moonSaved = true; P.hp = Math.round(maxHp() * .4); P.inv = 1.2;
  banner('THE MOON REFUSES', 'MOON-SILVER HOLDS · ONCE IN EACH PLACE', 1.6); flashT = .2; slowmo = .5; sfx('trump');
  burst(P.x, P.y, 40, ['#FFFFFF', '#E8F0FF', '#9FB8E8'], 36, 'spark', 0, true);
  fx.push({ kind: 'ring', x: P.x, y: P.y, z: 20, t: .5, max: .5, r: 90, col: '#E8F0FF', flat: 1 });
  return true;
}
// a new place: the moon's refusal is ready again
{ const _ez = enterZone; enterZone = function (z, Zs) { if (P) P.moonSaved = false; return _ez(z, Zs); }; }

// ---------- painting the gear on him ----------
// heroLook() (art.js) builds his look from what he wears; each slot sets its colors and hands drawHumanoid a set id,
// and drawHumanoid calls these painters for the details: mail over the torso, shoulder guards, knee cops, cuffs, belt.
let heroLookCache = null;
function buildHeroLook(eq) {
  const L = Object.assign({}, HERO), sp = (it) => it ? GEAR_SETS[it.set].pal : null;
  const m = sp(eq.mail), p = sp(eq.pants), g = sp(eq.gauntlets), w = sp(eq.waist);
  if (m) { L.mailSet = eq.mail.set; L.body = m.m1; L.sleeve = m.ms; L.coat = m.mt1; L.coat2 = m.mt2; L.pauldron = m.mp; for (const k of ['m1', 'm2', 'm3', 'm4', 'mp']) L['g_' + k] = m[k]; }
  if (p) { L.pantsSet = eq.pants.set; L.legs = p.p1; L.shin = p.ps; L.boots = p.p2; for (const k of ['p1', 'p2', 'p3', 'p4', 'ps']) L['g_' + k] = p[k]; }
  if (g) { L.gauntSet = eq.gauntlets.set; L.bracer = g.g1; L.glove = g.g2; for (const k of ['g1', 'g2', 'g3', 'g4']) L['g_' + k] = g[k]; }
  if (w) { L.waistSet = eq.waist.set; L.chain = 0; for (const k of ['w1', 'w2', 'w3']) L['g_' + k] = w[k]; }
  L.enchanted = GEAR_SLOTS.some(s => eq[s] && eq[s].ench.length);
  return L;
}
const glow = (col, b) => { if (!FLASH && !TINT) { ctx.shadowColor = col; ctx.shadowBlur = b; } };
const gfill = (col) => { ctx.fillStyle = C(col); ctx.fill(); };
function polyP(pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); }
// mail, painted inside the torso's outline (ty: the shoulder line, H: the waist; light from the upper right)
const GEAR_MAIL = {
  1(L, ty, H, back) { // a worn leather jerkin laced over a rough wool shirt: stitched seams, a scuffed patch
    if (!back) {
      ctx.fillStyle = C(L.g_m2); polyP([-4.6, ty - 1, 0, ty + 10, 4.8, ty - 1]); ctx.fill();
      ctx.strokeStyle = C(shade(L.g_m2, -.25)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-2, ty + 1); ctx.lineTo(-1.2, ty + 6); ctx.moveTo(2.4, ty + 1); ctx.lineTo(1.4, ty + 6); ctx.stroke(); // the weave
      ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .8; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const y = ty + 3 + i * 2.6, a = 2.6 - i * .6; ctx.moveTo(-a, y); ctx.lineTo(a, y + 2.2); ctx.moveTo(a, y); ctx.lineTo(-a, y + 2.2); }
      ctx.stroke();
    }
    ctx.save(); ctx.setLineDash([1.1, 1.3]); ctx.strokeStyle = C(L.g_m4); ctx.lineWidth = .6; ctx.beginPath();
    ctx.moveTo(-6.4, ty + 3); ctx.quadraticCurveTo(-5.4, ty + 12, -6.2, H + 1); ctx.moveTo(6.8, ty + 3); ctx.quadraticCurveTo(5.8, ty + 12, 6.4, H + 1); ctx.moveTo(-10, ty + 4); ctx.quadraticCurveTo(0, ty + 1.6, 10, ty + 4); ctx.stroke(); ctx.restore();
    rrect(back ? -6.4 : 2.6, ty + 12, 4.4, 4, 1); ctx.fillStyle = C(shade(L.g_m1, -.22)); ctx.fill(); outline(.5); // the patch
  },
  2(L, ty, H, back) { // an oxblood coat, brass buttons in two rows and a studded bandolier across the chest
    if (!back) {
      ctx.fillStyle = C(L.g_m4); polyP([-7.4, ty, -1.2, ty + 10, -1.6, H + 2, -4.2, H + 2, -4.8, ty + 9]); ctx.fill(); // the turned-back facing
      ctx.fillStyle = C(L.g_m3); for (const y of [ty + 6, ty + 10.5, ty + 15]) for (const x of [1.4, 5]) { circle(x, y, .95); ctx.fill(); }
    }
    ctx.strokeStyle = C(L.g_m2); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(back ? 11 : -11, ty + 2); ctx.lineTo(back ? -9 : 9, H); ctx.stroke();
    ctx.fillStyle = C(L.g_m3); for (const k of [.12, .3, .48, .66, .84]) { circle(lerp(back ? 11 : -11, back ? -9 : 9, k), lerp(ty + 2, H, k), .75); ctx.fill(); }
    ctx.strokeStyle = C(shade(L.g_m1, -.35)); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-9, ty + 17); ctx.quadraticCurveTo(0, ty + 19, 9, ty + 17); ctx.stroke(); // the coat's waist seam
  },
  3(L, ty, H, back) { // overlapping scales of violet glass, lit to the right, a few catching cyan
    let r = 0;
    for (let y = ty - 1; y < H + 2; y += 3.1, r++) {
      let i = 0;
      for (let x = -11.5 + (r % 2) * 2.2; x < 12; x += 4.4, i++) {
        ctx.beginPath(); ctx.moveTo(x - 2.3, y); ctx.quadraticCurveTo(x - 2.3, y + 3.4, x, y + 4); ctx.quadraticCurveTo(x + 2.3, y + 3.4, x + 2.3, y); ctx.closePath();
        ctx.fillStyle = C(x > 3 ? L.g_m2 : x > -3 ? shade(L.g_m2, -.16) : shade(L.g_m2, -.34)); ctx.fill();
        ctx.strokeStyle = C(shade(L.g_m1, -.4)); ctx.lineWidth = .45; ctx.stroke();
        if ((r * 3 + i) % 4 === 1 && x > -2) { ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x + .4, y + .8); ctx.lineTo(x + 1.4, y + 2.6); ctx.stroke(); }
      }
    }
    if (!back) { // a crystal gorget at the throat
      polyP([-4.4, ty - .6, 0, ty + 5, 4.6, ty - .6, 0, ty + 1.4]); ctx.fillStyle = C(L.g_m4); ctx.fill(); outline(.6);
      ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, ty + 1.4); ctx.lineTo(0, ty + 4.4); ctx.stroke();
    }
  },
  4(L, ty, H, back) { // black plate inlaid with blood-red, its seams glowing like embers
    const g = ctx.createLinearGradient(-10, ty, 10, ty + 14); g.addColorStop(0, C(shade(L.g_m4, -.3))); g.addColorStop(.6, C(L.g_m4)); g.addColorStop(1, C(shade(L.g_m4, .35)));
    polyP([-10.6, ty + 2, -3, ty - .6, 3, ty - .6, 10.6, ty + 2, 8.4, ty + 13, 0, ty + 16.5, -8.2, ty + 13]); ctx.fillStyle = g; ctx.fill(); outline(.9);
    polyP([-6.6, ty + 4, 0, ty + 2.4, 6.8, ty + 4, 5.4, ty + 11, 0, ty + 13.6, -5.2, ty + 11]); ctx.fillStyle = C(L.g_m2); ctx.fill();
    for (const y of [ty + 17.4, ty + 20.6]) { rrect(-9, y, 18, 2.8, 1); ctx.fillStyle = C(shade(L.g_m4, -.1)); ctx.fill(); outline(.6); } // the lames over the belly
    ctx.save(); glow(L.g_m3, 4); ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .7; ctx.beginPath(); // the ember seams
    ctx.moveTo(0, ty + 2.6); ctx.lineTo(-1, ty + 6); ctx.lineTo(.8, ty + 8.4); ctx.lineTo(-.4, ty + 12.6);
    ctx.moveTo(-8.2, ty + 13.4); ctx.lineTo(0, ty + 16.8); ctx.lineTo(8.4, ty + 13.4); ctx.moveTo(-8.6, ty + 20.2); ctx.lineTo(8.6, ty + 20.2); ctx.stroke(); ctx.restore();
  },
  5(L, ty, H, back) { // a moon-silver cuirass chased with silver-leaf filigree, a crescent at the breast
    const g = ctx.createLinearGradient(-10, ty, 10, ty + 18); g.addColorStop(0, C(L.g_m2)); g.addColorStop(.45, C(L.g_m1)); g.addColorStop(.72, C(L.g_m4)); g.addColorStop(1, C(L.g_m1));
    ctx.beginPath(); ctx.moveTo(-10, ty + 2.5); ctx.quadraticCurveTo(0, ty - 1.6, 10, ty + 2.5); ctx.lineTo(8.2, ty + 16); ctx.quadraticCurveTo(0, ty + 21, -8, ty + 16); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); outline(.8);
    for (const y of [ty + 18.6, ty + 21.4]) { ctx.strokeStyle = C(L.g_m2); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-8, y); ctx.quadraticCurveTo(0, y + 1.6, 8, y); ctx.stroke(); }
    ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .55; ctx.beginPath(); // filigree: a vine curling out each side, with leaves
    for (const d of [-1, 1]) { ctx.moveTo(0, ty + 15); ctx.bezierCurveTo(d * 3, ty + 12, d * 7, ty + 14, d * 6.6, ty + 9); ctx.bezierCurveTo(d * 6.2, ty + 6, d * 3.4, ty + 6.4, d * 4, ty + 8.4); }
    ctx.stroke(); ctx.fillStyle = C(L.g_m3);
    for (const d of [-1, 1]) for (const [x, y, a] of [[4.4, ty + 12.6, .6], [7, ty + 11.4, -.4], [5.6, ty + 6.6, 1.2]]) { ell(d * x, y, 1.1, .5, d * a); ctx.fill(); }
    if (!back) { ctx.fillStyle = C(L.g_m3); ctx.beginPath(); ctx.arc(.4, ty + 4.2, 2.4, .6, Math.PI * 2 - .6, false); ctx.arc(1.6, ty + 4.2, 1.9, Math.PI * 2 - .9, .9, true); ctx.closePath(); ctx.fill(); outline(.4); } // the crescent
  },
};
// shoulder guards on the near shoulder (drawn where the default pauldron was)
const GEAR_PAULDRON = {
  1(L, S) { ctx.beginPath(); ctx.ellipse(1, S + 1.4, 6.6, 4.8, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); gfill(L.g_mp); outline(1.2);
    ctx.save(); ctx.setLineDash([1, 1.2]); ctx.strokeStyle = C(L.g_m4); ctx.lineWidth = .55; ctx.beginPath(); ctx.ellipse(1, S + 1.4, 5, 3.4, -.3, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.restore(); },
  2(L, S) { ctx.beginPath(); ctx.ellipse(1, S + 1, 8.8, 6.6, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath();
    const g = ctx.createLinearGradient(-6, S - 4, 8, S + 4); g.addColorStop(0, C(shade(L.g_mp, -.3))); g.addColorStop(.6, C(L.g_mp)); g.addColorStop(1, C(shade(L.g_mp, .4))); ctx.fillStyle = g; ctx.fill(); outline(1.3);
    ctx.fillStyle = C(L.g_m2); for (const [x, y] of [[-3.6, S + 1], [0, S - 2.6], [4, S - 2.4], [6.6, S + .4]]) { circle(x, y, .8); ctx.fill(); } },
  3(L, S) { for (const [pts, col] of [[[-6, S + 4, -4, S - 4, 2, S - 6.4, 4, S + 1], L.g_mp], [[1, S + 3, 3, S - 7.6, 9, S - 3, 8, S + 4], shade(L.g_mp, .2)]]) { polyP(pts); gfill(col); outline(1); }
    ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(3.6, S - 6); ctx.lineTo(7.6, S - 2.6); ctx.stroke(); },
  4(L, S) { ctx.beginPath(); ctx.ellipse(1, S + 1, 9.4, 6.8, -.3, Math.PI * .88, Math.PI * 2.12); ctx.closePath(); gfill(L.g_mp); outline(1.3);
    for (const [x, h] of [[-1.6, 7], [4.4, 5.4]]) { polyP([x - 1.8, S - 3.2, x + .8, S - 3.4 - h, x + 2, S - 3.6]); gfill(L.g_m4); outline(.8); } // spikes
    ctx.save(); glow(L.g_m3, 3); ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(1, S + 1, 7.6, 5.2, -.3, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C(L.g_m2); ctx.fillRect(-4, S + 2, 9, 1.6); },
  5(L, S) { for (const [dy, rx, ry, k] of [[2.4, 8.4, 5.6, -.12], [0, 8.8, 6.4, 0]]) { ctx.beginPath(); ctx.ellipse(1, S + 1 + dy, rx, ry, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); gfill(shade(L.g_mp, k)); outline(1.1); }
    ctx.strokeStyle = C(L.g_m3); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-3, S - .6); ctx.quadraticCurveTo(1, S - 4.4, 5, S - 2.4); ctx.quadraticCurveTo(3, S - 1, 4.2, S + .6); ctx.stroke();
    if (!FLASH && !TINT) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(4.4, S - 3, 2.6, .9, -.3); ctx.fill(); } },
};
// a knee cop or patch at the knee (kx, ky); far: the leg further from us
const GEAR_KNEE = {
  1(L, kx, ky) { rrect(kx - 2.6, ky - 2.4, 5, 4.6, 1.2); gfill(L.g_p3); outline(.6); },
  2(L, kx, ky) { ctx.fillStyle = C(L.g_p2); ctx.fillRect(kx - 3.4, ky + .6, 6.8, 2); ctx.fillStyle = C(L.g_p3); ctx.fillRect(kx + .6, ky + .2, 2, 2.8); }, // the tall boot's cuff, buckled in brass
  3(L, kx, ky) { polyP([kx - 3, ky, kx, ky - 3.4, kx + 3.4, ky, kx, ky + 3]); gfill(L.g_p3); outline(.6); ctx.strokeStyle = C(L.g_p4); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(kx, ky - 3); ctx.lineTo(kx + 1.6, ky); ctx.stroke(); },
  4(L, kx, ky) { polyP([kx - 3, ky - 2.4, kx + 2.6, ky - 3, kx + 6.4, ky - 1, kx + 2.8, ky + .4, kx + 2.4, ky + 3, kx - 2.6, ky + 2.6]); gfill(L.g_p3); outline(.7);
    ctx.save(); glow(L.g_p4, 3); ctx.fillStyle = C(L.g_p4); circle(kx, ky, .8); ctx.fill(); ctx.restore(); },
  5(L, kx, ky) { circle(kx, ky, 3.2); gfill(L.g_p3); outline(.7); ctx.strokeStyle = C(L.g_m3 || L.g_p4); ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(kx, ky, 1.8, -.4, 3.6); ctx.stroke(); },
};
// the cuff of a gauntlet, on the forearm from the elbow (x0, y0) to the wrist (x1, y1)
const GEAR_CUFF = {
  1(L, x0, y0, x1, y1) { ctx.strokeStyle = C(L.g_g3); ctx.lineWidth = .9; ctx.beginPath(); for (const k of [.35, .55, .75]) { const x = lerp(x0, x1, k), y = lerp(y0, y1, k); ctx.moveTo(x - .8, y - 2.6); ctx.lineTo(x + .8, y + 2.6); } ctx.stroke(); },
  2(L, x0, y0, x1, y1) { const a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.translate(lerp(x0, x1, .72), lerp(y0, y1, .72)); ctx.rotate(a);
    polyP([-2.6, -3.4, 2.4, -4.6, 2.4, 4.6, -2.6, 3.4]); gfill(L.g_g3); outline(.8); ctx.fillStyle = C(L.g_g4); ctx.fillRect(-1.6, -3, .9, 6); ctx.restore(); },
  3(L, x0, y0, x1, y1) { const a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.translate(lerp(x0, x1, .5), lerp(y0, y1, .5)); ctx.rotate(a);
    polyP([-4, -2.6, 0, -4.2, 4, -2.6, 2, -1.6, -2, -1.6]); gfill(L.g_g4); outline(.6); ctx.strokeStyle = C(L.g_g3); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-3, -1.9); ctx.lineTo(3.4, -1.9); ctx.stroke(); ctx.restore(); },
  4(L, x0, y0, x1, y1) { const a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.translate(lerp(x0, x1, .45), lerp(y0, y1, .45)); ctx.rotate(a);
    polyP([-4, -3, 4, -2.6, 2, -6.4, 6, -2.2, 4.6, 2.6, -4, 2.8]); gfill(L.g_g3); outline(.7);
    ctx.save(); glow(L.g_g4, 3); ctx.strokeStyle = C(L.g_g4); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3.6, 0); ctx.stroke(); ctx.restore(); ctx.restore(); },
  5(L, x0, y0, x1, y1) { const a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.translate(lerp(x0, x1, .7), lerp(y0, y1, .7)); ctx.rotate(a);
    rrect(-2.2, -3.6, 4.4, 7.2, 1.2); gfill(shade(L.g_g1, .12)); outline(.7); ctx.strokeStyle = C(L.g_g4); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-1.2, -2.4); ctx.quadraticCurveTo(1.4, 0, -1.2, 2.4); ctx.stroke(); ctx.restore(); },
};
// the waist piece, drawn where his belt was (H: the waist line)
const GEAR_WAIST = {
  1(L, H, back) { // a twisted rope belt with a pouch on the hip
    rrect(-8.2, H - 2.6, 16.4, 3.4, 1.4); gfill(L.g_w1); outline(.6);
    ctx.strokeStyle = C(L.g_w3); ctx.lineWidth = .6; ctx.beginPath(); for (let x = -7; x < 8; x += 2) { ctx.moveTo(x, H - 2.4); ctx.lineTo(x + 1.4, H + .6); } ctx.stroke();
    if (!back) { rrect(-7.6, H, 4.6, 4.6, 1.4); gfill(L.g_w2); outline(.7); ctx.fillStyle = C(shade(L.g_w2, .25)); ctx.fillRect(-7.2, H + .4, 3.8, 1.2); }
  },
  2(L, H, back) { // a wide crimson sash, knotted at the hip, its ends hanging
    rrect(-8.4, H - 3.6, 16.8, 5, 1.6); gfill(L.g_w1); outline(.7);
    ctx.strokeStyle = C(L.g_w3); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-8, H - 1.6); ctx.quadraticCurveTo(0, H - .4, 8, H - 1.6); ctx.stroke();
    if (!back) { for (const [dx, len] of [[-6.4, 9], [-4, 7]]) { polyP([dx - 1.4, H, dx + 1.6, H, dx + 2, H + len, dx - .2, H + len - 1.4, dx - 1.8, H + len]); gfill(shade(L.g_w1, dx < -5 ? -.14 : 0)); outline(.6); }
      circle(-5.2, H - 1, 2); gfill(shade(L.g_w1, .12)); outline(.6); ctx.fillStyle = C(L.g_w2); ctx.fillRect(1.6, H - 3.2, 2.4, 4.2); }
  },
  3(L, H, back) { // a sash woven of pale light, a crystal at its clasp
    rrect(-8.2, H - 3, 16.4, 4, 1.4); gfill(L.g_w1); outline(.6);
    ctx.strokeStyle = C(L.g_w3); ctx.lineWidth = .5; ctx.beginPath(); for (const y of [H - 1.8, H - .2]) { ctx.moveTo(-8, y); ctx.lineTo(8, y); } ctx.stroke();
    if (!back) { ctx.save(); glow(L.g_w2, 5); polyP([2.8, H - 1, 4.6, H - 4.2, 6.4, H - 1, 4.6, H + 2.2]); gfill(L.g_w2); ctx.restore(); polyP([2.8, H - 1, 4.6, H - 4.2, 6.4, H - 1, 4.6, H + 2.2]); outline(.6); }
  },
  4(L, H, back) { // a girdle of black chain, a red-iron plate at its front
    ctx.strokeStyle = C(L.g_w1); ctx.lineWidth = 1.1; for (let x = -7.4, i = 0; x < 8; x += 2.4, i++) { ell(x, H - .8 + (i % 2) * .4, 1.5, 1.1); ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.8; ctx.stroke(); ell(x, H - .8 + (i % 2) * .4, 1.5, 1.1); ctx.strokeStyle = C(L.g_w1); ctx.lineWidth = .9; ctx.stroke(); }
    if (!back) { polyP([.6, H - 3.6, 6, H - 3.6, 6.4, H + 1, 3.3, H + 3, .2, H + 1]); gfill(L.g_w2); outline(.7); ctx.save(); glow(L.g_w3, 4); ctx.fillStyle = C(L.g_w3); circle(3.3, H - .6, .9); ctx.fill(); ctx.restore(); }
  },
  5(L, H, back) { // a moon-silver girdle, a crescent clasp set with a pale blue stone
    const g = ctx.createLinearGradient(0, H - 3, 0, H + 1.4); g.addColorStop(0, C(L.g_w1)); g.addColorStop(1, C(shade(L.g_w1, -.3)));
    rrect(-8.2, H - 3, 16.4, 4.2, 1.2); ctx.fillStyle = g; ctx.fill(); outline(.6);
    ctx.strokeStyle = C(shade(L.g_w1, -.4)); ctx.lineWidth = .45; ctx.beginPath(); for (let x = -6.6; x < 7; x += 3.3) { ctx.moveTo(x, H - .8); ctx.quadraticCurveTo(x + .8, H - 2.6, x + 1.6, H - .8); } ctx.stroke();
    if (!back) { ctx.fillStyle = C(L.g_w2); ctx.beginPath(); ctx.arc(3.4, H - .9, 2.8, .7, Math.PI * 2 - .7); ctx.arc(4.6, H - .9, 2.1, Math.PI * 2 - 1, 1, true); ctx.closePath(); ctx.fill(); outline(.5);
      ctx.save(); glow(L.g_w3, 4); ctx.fillStyle = C(L.g_w3); circle(2.6, H - .9, .9); ctx.fill(); ctx.restore(); }
  },
};
// hooks drawHumanoid calls (each does nothing for a slot he isn't wearing anything in)
function gearMail(L, ty, H, back) { const f = GEAR_MAIL[L.mailSet]; if (f) { ctx.save(); f(L, ty, H, back); ctx.restore(); } }
function gearPauldron(L, S) { const f = GEAR_PAULDRON[L.mailSet]; if (!f) return false; ctx.save(); f(L, S); ctx.restore(); return true; }
function gearKnee(L, kx, ky) { const f = GEAR_KNEE[L.pantsSet]; if (f) { ctx.save(); f(L, kx, ky); ctx.restore(); } }
function gearCuff(L, x0, y0, x1, y1) { const f = GEAR_CUFF[L.gauntSet]; if (f) { ctx.save(); f(L, x0, y0, x1, y1); ctx.restore(); } }
function gearWaist(L, H, back) { const f = GEAR_WAIST[L.waistSet]; if (!f) return false; ctx.save(); f(L, H, back); ctx.restore(); return true; }

// an enchanted piece on him: a faint gold-violet glow and three motes circling slowly (painted on the page, behind the ink)
function drawGearAura(t) {
  const L = heroLook(); if (!L.enchanted || !P || P.state === 'dead') return;
  const cy = P.y - P.z - 36;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(P.x, cy, 6, P.x, cy, 42); g.addColorStop(0, 'rgba(232,192,96,.16)'); g.addColorStop(.6, 'rgba(184,140,255,.1)'); g.addColorStop(1, 'rgba(184,140,255,0)');
  ctx.fillStyle = g; ell(P.x, cy, 30, 44); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a = t * .9 + i * TAU / 3, x = P.x + Math.cos(a) * 17, y = cy + 6 + Math.sin(a * 1.3 + i) * 22 - Math.sin(a) * 3;
    const mg = ctx.createRadialGradient(x, y, 0, x, y, 3.4); mg.addColorStop(0, i === 1 ? 'rgba(210,180,255,.85)' : 'rgba(255,226,150,.85)'); mg.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = mg; circle(x, y, 3.4); ctx.fill();
  }
  ctx.restore();
}

// ---------- the pieces on their own: inventory icons and loot on the floor ----------
// drawn in a 64 x 64 box centred on (32, 32)
function drawGearPiece(it) {
  const L = buildHeroLook({ [it.slot]: it }), S = GEAR_SETS[it.set];
  ctx.save(); ctx.translate(32, 32);
  if (it.slot === 'mail') { // the torso with both shoulder guards, coat tails behind
    ctx.scale(1.6, 1.6); ctx.translate(0, 8);
    const H = -30, ty = -51;
    for (const [dx, col] of [[-6, L.coat2], [6, L.coat]]) { polyP([dx - 5, H, dx + 5, H, dx + 6, H + 15, dx + 1, H + 13, dx - 4, H + 15]); gfill(col); outline(1); }
    for (const d of [-1, 1]) { ctx.save(); ctx.scale(d, 1); seg(9, ty + 3, 13, ty + 15, 6.6, 5.4, L.sleeve, .8); ctx.restore(); }
    const torso = () => { ctx.beginPath(); ctx.moveTo(-10.4, ty + 2); ctx.quadraticCurveTo(0, ty - 2.4, 10.4, ty + 2); ctx.quadraticCurveTo(11, ty + 9, 7.6, ty + 15); ctx.quadraticCurveTo(6.4, H - 4, 7.6, H + 1.5); ctx.lineTo(-7.6, H + 1.5); ctx.quadraticCurveTo(-6.6, H - 4, -7.8, ty + 15); ctx.quadraticCurveTo(-11, ty + 9, -10.4, ty + 2); ctx.closePath(); };
    const tg = ctx.createLinearGradient(-10, ty, 10, ty + 20); tg.addColorStop(0, C(shade(L.body, -.32))); tg.addColorStop(.55, C(L.body)); tg.addColorStop(1, C(shade(L.body, .2)));
    torso(); ctx.fillStyle = tg; ctx.fill(); ctx.save(); torso(); ctx.clip(); gearMail(L, ty, H, false); ctx.restore(); torso(); outline(1.2);
    for (const d of [-1, 1]) { ctx.save(); ctx.scale(d, 1); ctx.translate(7.6, 0); gearPauldron(L, -49); ctx.restore(); }
  } else if (it.slot === 'pants') { // both legs, hips to boots
    ctx.scale(1.25, 1.25); ctx.translate(0, 24);
    rrect(-7.6, -33, 15.2, 6, 2); gfill(L.legs); outline(1);
    for (const [x, f, col] of [[-3.6, -3, shade(L.legs, -.12)], [3.6, 3, L.legs]]) {
      const kx = x + f * .5, ky = -15;
      seg(x, -29, kx, ky, 8.4, 6.2, col, .9); seg(kx, ky, x + f, -8, 6.2, 4.6, L.shin || col, 1);
      ctx.save(); ctx.translate(x + f, 0); boot(0, L.boots); ctx.restore(); gearKnee(L, kx, ky);
    }
  } else if (it.slot === 'gauntlets') { // a forearm and hand, fist forward
    ctx.rotate(-.5); ctx.scale(1.7, 1.7); ctx.translate(-16, 0);
    seg(0, 0, 15, 0, 7, 5.2, L.bracer, .9); gearCuff(L, 0, 0, 15, 0);
    ctx.translate(15 - 13, 0); drawHand(L.glove, false);
  } else { // the waist piece laid out flat
    ctx.scale(2.2, 2.2); ctx.translate(0, 30);
    ctx.save(); ctx.globalAlpha = .35; rrect(-8.4, -34, 16.8, 9, 3); ctx.fillStyle = C('#2C2934'); ctx.fill(); ctx.restore();
    gearWaist(L, -30, false);
  }
  ctx.restore();
  return S;
}
// a little four-pointed glint: the mark of an enchanted piece (gold, ringed in violet)
function drawGlint(x, y, s) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.2); g.addColorStop(0, 'rgba(255,230,160,.9)'); g.addColorStop(.45, 'rgba(184,140,255,.45)'); g.addColorStop(1, 'rgba(184,140,255,0)');
  ctx.fillStyle = g; circle(x, y, s * 2.2); ctx.fill();
  ctx.fillStyle = '#FFF0C0'; ctx.beginPath(); ctx.moveTo(x, y - s * 1.6); ctx.lineTo(x + s * .35, y - s * .35); ctx.lineTo(x + s * 1.6, y); ctx.lineTo(x + s * .35, y + s * .35); ctx.lineTo(x, y + s * 1.6); ctx.lineTo(x - s * .35, y + s * .35); ctx.lineTo(x - s * 1.6, y); ctx.lineTo(x - s * .35, y - s * .35); ctx.closePath(); ctx.fill();
  ctx.restore();
}
const TIER_GLOW = [null, '226,206,160', '140,220,160', '140,180,255', '255,130,70', '232,240,255'];
function drawGearLoot(k, t) { // on the floor: the piece itself, upright and slowly turning, in a glow of its tier's color
  const it = k.item, x = k.x, y = k.y - k.z - 16 - Math.sin(t * 3 + k.x) * 2, rgb = TIER_GLOW[it.set], en = it.ench.length;
  shadow(k.x, k.y, 8);
  onPage(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 2, x, y, 24); g.addColorStop(0, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; circle(x, y, 24); ctx.fill();
    if (en) { ctx.strokeStyle = 'rgba(214,170,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y + 12, 15, 4, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = `rgba(${rgb},.35)`; ctx.fillRect(x - .6, y + 6, 1.2, k.y - y - 6); // a thread of light down to the floor
    ctx.restore(); });
  ctx.save(); ctx.translate(x - 32 * .36 * Math.cos(t * 1.4 + k.x), y - 32 * .36); ctx.scale(.36 * Math.cos(t * 1.4 + k.x), .36);
  if (Math.abs(Math.cos(t * 1.4 + k.x)) < .12) ctx.scale(Math.sign(Math.cos(t * 1.4 + k.x)) * .12 / Math.max(.01, Math.abs(Math.cos(t * 1.4 + k.x))), 1);
  drawGearPiece(it); ctx.restore();
  if (en) onPage(() => drawGlint(x + 9, y - 9, 2.6));
}
// a piece's portrait on a small canvas (inventory cells)
function drawGearIcon(canvas, it) {
  const g = canvas.getContext('2d'), old = ctx; ctx = g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
  if (!it) { ctx = old; return; }
  const s = canvas.width / 64; g.setTransform(s, 0, 0, s, 0, 0);
  try { drawGearPiece(it); } finally { ctx = old; }
  paintCard(canvas, s * .7);
  if (it.ench.length) { const o = ctx; ctx = g; g.setTransform(s, 0, 0, s, 0, 0); drawGlint(52, 12, 3.4); ctx = o; }
}
