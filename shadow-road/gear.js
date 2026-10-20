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

// the five sets. Each slot names its costume part (art_gear.js adds them to CORWIN.parts) and a flat palette whose
// keys carry the slot's prefix (m_ mail, p_ legs, g_ gauntlets, w_ waist), so a mix of sets mixes cleanly and a greyed
// copy of the look (the Phantom in Tir-na Nog'th) greys every piece
const GEAR_SETS = [null,
  { key: 'wayfarer', name: "Wayfarer's Leathers", short: 'Wayfarer', col: '#C9A26A', where: 'the Bloomwild',
    pieces: { mail: "Wayfarer's Jerkin", pants: "Wayfarer's Breeches", gauntlets: "Wayfarer's Bracers", waist: "Wayfarer's Rope Belt" },
    look: 'worn tan leather laced over rough oatmeal wool, wrapped shins, a rope belt with a pouch',
    pal: { m_a: '#7A5634', m_b: '#4A3220', m_c: '#C2B394', m_d: '#C89A68', m_collar: '#C2B394',
      p_a: '#6E6250', p_b: '#8C7C5E', p_boot: '#4A3424', p_c: '#7A5634', p_d: '#C2B394',
      g_sleeve: '#8E7E62', g_a: '#7A5634', g_c: '#C2B394', g_pau: '#6A4A2E', glove: '#8A6A4A',
      w_a: '#A88A5A', w_b: '#6E5636', w_c: '#6A4A2E', w_d: '#C2B394' },
    b2: { txt: '+5% move speed', s: { speed: .05 } }, b4: { name: "Wayfarer's Stride", txt: 'dodges recover 30% sooner (same distance, same safety)', s: { dodgeFast: .3 } } },
  { key: 'corsair', name: "Sky-Corsair's Rig", short: 'Corsair', col: '#E0705E', where: 'the Clockwork Skyport',
    pieces: { mail: "Corsair's Studded Coat", pants: "Corsair's Sky-Breeches", gauntlets: "Corsair's Brass Gauntlets", waist: "Corsair's Crimson Sash" },
    look: 'an oxblood coat with brass buttons and a studded bandolier, navy breeches in cuffed sea-boots, brass, a crimson sash',
    pal: { m_a: '#8A2A2A', m_b: '#3A2418', m_c: '#D8AA50', m_d: '#B8524A', m_collar: '#E8D8B0',
      p_a: '#2A3452', p_b: '#2E1E16', p_boot: '#2E1E16', p_c: '#D8AA50', p_d: '#E8D8B0', p_e: '#6A4228',
      g_sleeve: '#E8D8B0', g_a: '#5A2A1E', g_c: '#D8AA50', g_pau: '#C99A44', glove: '#4A2A1E',
      w_a: '#B8283A', w_b: '#7A1424', w_c: '#D8AA50', w_d: '#E8D8B0' },
    b2: { txt: '+15% shards from foes', s: { shards: .15 } }, b4: { name: 'Fair Winds', txt: '+10% move speed, and an arrow comes back to the quiver every 15 seconds', s: { speed: .1, arrowRefill: 15 } } },
  { key: 'prism', name: 'Prism-Glass Scale', short: 'Prism', col: '#B89CFF', where: 'the Prism Rim',
    pieces: { mail: 'Prism Scale Hauberk', pants: 'Prism Scale Greaves', gauntlets: 'Prism Vambraces', waist: 'Prism Light-Sash' },
    look: 'violet glass scales that catch cyan light, faceted crystal greaves and vambraces, a sash woven of pale light',
    pal: { m_a: '#4A2E78', m_b: '#7A5AB8', m_c: '#9FE8F0', m_d: '#D2C4FF', m_collar: '#7A5AB8',
      p_a: '#3A2462', p_b: '#6A4AA8', p_boot: '#2A1A48', p_c: '#A88EF0', p_d: '#9FE8F0',
      g_sleeve: '#3A2462', g_a: '#7A5AB8', g_c: '#9FE8F0', g_pau: '#8A6ACF', glove: '#4A2E78',
      w_a: '#C8B0FF', w_b: '#7A5AB8', w_c: '#9FE8F0', w_d: '#5A3A8A' },
    b2: { txt: 'shots and hazards hurt 10% less', s: { resist: .1 } }, b4: { name: 'Mirror of the Rim', txt: 'one shot in three that strikes you is turned back on the shooter', s: { reflect: .34 } } },
  { key: 'chaos', name: 'Chaos Plate', short: 'Chaos', col: '#FF7A3A', where: 'the Courts of Chaos',
    pieces: { mail: 'Chaos Plate Cuirass', pants: 'Chaos Plate Cuisses', gauntlets: 'Chaos Talons', waist: 'Chaos Chain Girdle' },
    look: 'black plate inlaid with blood-red, its seams glowing like embers, spiked pauldrons and knees, clawed gauntlets, a chain girdle',
    pal: { m_a: '#1E1418', m_b: '#3E2C32', m_c: '#FF7A3A', m_d: '#6A1418', m_collar: '#2A1418',
      p_a: '#1E1418', p_b: '#3A2228', p_boot: '#2A1418', p_c: '#7A1820', p_d: '#FF7A3A',
      g_sleeve: '#2A1A20', g_a: '#3A2228', g_c: '#7A1820', g_d: '#FF7A3A', g_pau: '#2A1A1E', glove: '#3A2228',
      w_a: '#4A3E44', w_b: '#2A1418', w_c: '#8A1A22', w_d: '#FF7A3A' },
    b2: { txt: 'foes who strike you take 10% of the blow back', s: { thorns: .1 } }, b4: { name: 'Ember Seams', txt: 'foes who strike you take another 30% back, and catch fire', s: { thorns: .3, burn: 1 } } },
  { key: 'moon', name: "Moon-Silver of Tir-na Nog'th", short: 'Moon-Silver', col: '#E8F0FF', where: "Tir-na Nog'th",
    pieces: { mail: 'Moon-Silver Cuirass', pants: 'Moon-Silver Greaves', gauntlets: 'Moon-Silver Gauntlets', waist: 'Moon-Silver Girdle' },
    look: 'moon-silver plate chased with silver-leaf filigree, a crescent at the breast, fine mail at the joints, a girdle with a moonstone',
    pal: { m_a: '#C4CCDC', m_b: '#8496BE', m_c: '#FFFFFF', m_d: '#EEF2FA', m_collar: '#DDE2EE',
      p_a: '#8E9AB4', p_b: '#D2D8E6', p_boot: '#C4CCDC', p_c: '#EEF2FA', p_d: '#FFFFFF',
      g_sleeve: '#8E9AB4', g_a: '#D2D8E6', g_c: '#8496BE', g_d: '#FFFFFF', g_pau: '#D8DEEA', glove: '#C4CCDC',
      w_a: '#E4E8F2', w_b: '#8496BE', w_c: '#FFFFFF', w_d: '#7FA8E8' },
    b2: { txt: 'regain 1 health every 2 seconds once you have gone 3 seconds unhurt', s: { regen: .5 } }, b4: { name: 'The Moon Refuses', txt: 'once in each place, a killing blow leaves you standing at 40% health', s: { deathSave: 1 } } },
];
const PART_KEY = { mail: 'Mail', pants: 'Legs', gauntlets: 'Arms', waist: 'Waist' }; // a set's part in each slot is key + this (e.g. chaosMail)
const SLOT_PAL = { mail: /^m_/, pants: /^p_/, gauntlets: /^(g_|glove$)/, waist: /^w_/ };
// his look, built from what he wears: each worn slot names its set's part and brings that slot's palette
function buildHeroLook(eq) {
  const L = Object.assign({}, HERO);
  for (const s of GEAR_SLOTS) {
    const it = eq[s]; if (!it) continue;
    const S = GEAR_SETS[it.set]; L[s] = S.key + PART_KEY[s];
    for (const k in S.pal) if (SLOT_PAL[s].test(k)) L[k] = S.pal[k];
    if (s === 'pants') { L.legs = S.pal.p_a; L.boots = S.pal.p_boot; }
    if (s === 'gauntlets' && it.set >= 4) L.gauntPlate = 1; // plate gauntlets: the hands are plated too
  }
  L.enchanted = GEAR_SLOTS.some(s => eq[s] && eq[s].ench.length) ? 1 : 0;
  return L;
}
let heroLookCache = null;
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
function gearChanged() { GEAR_V++; gearCache = null; heroLookCache = null; if (typeof onGearChanged === 'function') onGearChanged(); }
const itemTier = (it) => it.set;
const itemDef = (it) => Math.round(GEAR_DEF[it.slot][it.set - 1] * qMul(it.q));
const itemHp = (it) => Math.round(GEAR_HP[it.set - 1] * qMul(it.q));
const affixVal = (it, a) => AFFIXES[a.k].v[it.set - 1] * (.8 + .4 * (a.r ?? .5)) * (1 + .1 * (it.q || 0));
function setCounts(eq) { const n = {}; for (const s of GEAR_SLOTS) if (eq[s]) n[eq[s].set] = (n[eq[s].set] || 0) + 1; return n; }
function statsFor(eq) {
  const st = { def: 0, hp: 0, sets: [] };
  const add = (k, v) => { st[k] = (st[k] || 0) + v; };
  for (const s of GEAR_SLOTS) { const it = eq[s]; if (!it) continue; add('def', itemDef(it)); add('hp', itemHp(it)); add('pieceHp', itemHp(it)); for (const a of it.ench) add(a.k, affixVal(it, a)); }
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
const GEAR_ODDS = { normal: [.06, .1, .25], elite: [.22, .25, .35], champ: [.6, .4, .45], boss: [1, .55, .6] };
const BOSS_SECOND = .4; // a boss sometimes leaves a second piece
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
  if (e.boss && Math.random() < BOSS_SECOND) { const t = rollTier(true); gearDrop(e.x, e.y, t, rollEnchants(t, pe * .6, p2)); }
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
  const tx = clamp(P.x, camX + 120, camX + VW - 120); // a long name stays on the screen
  floatText(tx, P.y, 92, itemName(it).toUpperCase(), it.ench.length ? '#E8C8FF' : S.col, 12);
  floatText(tx, P.y, 76, r === 'worn' ? 'PUT ON · DEF ' + itemDef(it) : 'TO THE BAG · PAUSE › INVENTORY', 'rgba(240,230,210,.9)', 10);
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

