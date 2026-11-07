'use strict';
// ======================================================================================================
// CURSED WEAPONS: "WHAT THE CIRCLE GIVES BACK"
// ------------------------------------------------------------------------------------------------------
// In a corrupted run (New Game+ with the Horn of Lorraine, corruption.js NG()), foes now and then drop a cursed version
// of one of his weapons: more often the corrupted foes, elites, champions and lords, and more as the curse deepens. It
// lies on the street in a pool of ink, the black veins of it crawling outward; stand in the black a moment to take it.
// It REPLACES the weapon of that kind (save.cw[id], same id, same slot, every move of the old weapon kept):
//   THE TRACK     it comes at its own level 3 (of 8) and starts a little weaker than a fully tempered weapon (x0.8 of
//                 it); the forge feeds it up to 8 (dearer than any temper), each level a step of power and, at 3, 5
//                 and 7, a NEW CURSED MOVE that only the cursed weapon has. At 8 the smith can draw the curse out of it
//                 (PURIFY, a great price): the drawback and the gift both go, and it comes out x1.3 a fully tempered
//                 weapon, its moves turned from ink to white fire.
//   THE CURSE     while cursed, one DRAWBACK (DB) and one GIFT (BF), rolled when it is taken and kept until purified,
//                 in or out of a corrupted run.
// The forge's old weapon cleanse (corruption.js: a weapon corrupted in hand, cleansed to 'keen') is folded into this:
// the curse now offers its black weapon on the ground instead of turning the one in hand, and old corrupted weapons in
// a save are turned into cursed weapons of this kind (migrate). Armor curses and the Hallowed cleanse stay as they were.
// Everything hooks in by wrapping (strike, hurtEnemy, killEnemy, nextMove, begin, moveExtras, movePoseKey, playerPose,
// drawWeapon, drawIcon, drawLoot, updateLoot, updatePlayer, updateEnemy, startDodge, chargeTiming, renderForge,
// moveListHtml, refreshHud, drawFx, mechList, mechBoxes, startStage, enterZone). Console and tests: CURSEDW.
// ======================================================================================================
(() => {
  const NG = () => typeof save !== 'undefined' && !!save && (save.cycle | 0) >= 1 && !!save.w8relic;
  const now = () => performance.now() / 1000;
  const lite = () => typeof PAINT_LITE !== 'undefined' && (PAINT_LITE || PAINT_Q === 0) || (typeof CROWD !== 'undefined' && CROWD);
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const VOID = '#070309', INKC = '#0E0812';

  // ---------------- the numbers ----------------
  const IDS = ['fists', 'hammer', 'staff', 'sword', 'rapier'];
  const NAMES = { fists: ['Black Knuckles', 'Dawn Knuckles'], hammer: ['Gravemaul', 'Dawnmaul'], staff: ['Blackthorn', 'Whitethorn'], sword: ['Nightrender', 'Dawnrender'], rapier: ['Thorn of Lorraine', 'Rose of Lorraine'] };
  const LORE = {
    fists: ['Something black closed his fists for him, and they reach further than his arms ever did.', 'The black drawn out of them, his fists burn white where the ink was.'],
    hammer: ['A maul that came up out of a grave. It rings like a funeral bell, and the street gives way under it.', 'The grave-iron burned clean: it rings like a church bell now, and the street still gives.'],
    staff: ['The staff has put out thorns. Spun, it drags the dark in after it.', 'Its thorns gone white as bone; spun, it drags the light in after it.'],
    sword: ['The great blade tears what it cuts: the street, the air, the light.', 'The tearing edge burned clean: what it opens now pours out light.'],
    rapier: ['Grayswandir as the Black Circle would have it: every wound it leaves keeps opening.', 'Grayswandir with the Circle burned out of it: its wounds open into roses of light.'],
  };
  // a fully tempered weapon, the measure (data.js wMult at WMAX in a new cycle; fists never level, their measure is lower)
  const REF = { fists: 1.2, hammer: 2.8, staff: 2.8, sword: 2.8, rapier: 3.0 };
  const LV0 = 3, LVMAX = 8;
  const CK = { 3: .8, 4: .86, 5: .92, 6: .98, 7: 1.04, 8: 1.1 }, PURE_K = 1.3;
  const COST_S = [700, 950, 1250, 1600, 2000], COST_G = [6, 7, 9, 11, 13], PURE_S = 3200, PURE_G = 24;
  const cy = () => typeof cyc === 'function' ? cyc() : 1 + .5 * (save.cycle || 0);
  const lvlCost = (lv) => ({ s: Math.round(COST_S[lv - LV0] * cy()), g: Math.round(COST_G[lv - LV0] * cy()) });
  const pureCost = () => ({ s: Math.round(PURE_S * cy()), g: Math.round(PURE_G * cy()) });

  // the curse's price, and its gift (rolled when it is taken; both go when it is purified)
  const DB = {
    blood: { name: 'Bloodprice', txt: 'every finisher drinks a little of your blood' },
    turn: { name: 'Turncoat', txt: 'now and then a finisher turns on you' },
    leaden: { name: 'Leaden', txt: 'your dodges are shorter, and over sooner' },
    feed: { name: 'Feeding Dark', txt: 'a blow that cuts only air heals the foes around you' },
    hunger: { name: 'Hungering', txt: 'each kill feeds the curse; go long without one and it feeds on you' },
    graceless: { name: 'Graceless', txt: 'no parries, and no perfect charges' },
  };
  const BF = {
    pyre: { name: 'Black Pyre', txt: 'kills burst into black flame that spreads to those nearby' },
    echo: { name: 'Shadow Echo', txt: 'every third blow is struck again by its own shadow' },
    chain: { name: 'Black Lightning', txt: 'critical hits arc black lightning to three more foes' },
    circle: { name: 'The Circle', txt: 'heavy blows leave a Black Circle that drains foes and feeds you' },
    double: { name: 'Shadow-Corwin', txt: 'finishers raise a shadow of you that strikes them again' },
  };
  const dbFor = (id) => Object.keys(DB).filter(k => !(k === 'graceless' && id === 'fists'));

  // ---------------- the save ----------------
  const cw = (id) => (save && save.cw && id && save.cw[id]) || null;
  const lvOf = (c) => c ? (c.pure ? LVMAX : c.lvl) : 0;
  const held = () => (P && cw(P.w)) || null;
  const cursedHeld = () => { const c = held(); return c && !c.pure ? c : null; };
  const hasDB = (k) => { const c = cursedHeld(); return !!c && c.db === k; };
  const hasBF = (k) => { const c = cursedHeld(); return !!c && c.bf === k; };
  const CM = (id) => { const c = cw(id); return c ? REF[id] * (c.pure ? PURE_K : CK[clamp(c.lvl, LV0, LVMAX)]) : wMult(id); };
  const ratio = (id) => { const w = wMult(id); return w > 0 ? CM(id) / w : 1; };
  function setCw(id, lvl, db, bf, pure) {
    if (!save.cw) save.cw = {};
    const old = save.cw[id];
    save.cw[id] = { lvl: clamp(lvl | 0 || LV0, LV0, LVMAX), db: DB[db] ? db : pick(dbFor(id)), bf: BF[bf] ? bf : pick(Object.keys(BF)), pure: !!pure, prevWl: old ? old.prevWl : save.wl[id] || 1, at: save.cycle | 0 };
    if (save.cw[id].db === 'graceless' && id === 'fists') save.cw[id].db = 'blood';
    save.owned[id] = true;
    if (id !== 'fists') save.wl[id] = Math.max(save.wl[id] || 1, wLearn(id)); // (every move of the old weapon is kept, and drawn at its finest)
    return save.cw[id];
  }
  // the old corrupted weapons (corruption.js c.wc, cleansed into 'keen') are this now: one coherent path
  function migrate() {
    if (!save || !save.curse || !save.curse.wc) return;
    const wc = save.curse.wc, map = { behind: 'turn', drain: 'blood', hunger: 'hunger' };
    for (const id of Object.keys(wc)) { if (!WEAPONS[id] || id === 'pearlw' || !IDS.includes(id)) { delete wc[id]; continue; }
      if (!cw(id)) { const v = save.wl[id] || 1, L = wLearn(id); setCw(id, clamp(LV0 + Math.floor(Math.max(0, v - L) / 2), LV0, 6), map[wc[id]] || null, null); }
      delete wc[id]; }
  }
  try { migrate(); } catch (e) { console.error(e); }

  // the weapon's name follows what it has become
  for (const id of IDS) { const W = WEAPONS[id]; if (!W) continue;
    const d = Object.getOwnPropertyDescriptor(W, 'name'), base = d && d.get ? d.get : (() => d.value);
    Object.defineProperty(W, 'name', { configurable: true, enumerable: true, get() { const c = typeof save !== 'undefined' && save ? cw(id) : null; return c ? NAMES[id][c.pure ? 1 : 0] : base.call(W); } }); }

  // ======================================================================================================
  // THE NEW CURSED MOVES (only the cursed weapon has them; cl: the cursed level that teaches it)
  // ======================================================================================================
  const P_ = Math.PI;
  const CT = {
    hammer: {
      HL: { cl: 3, name: 'Grave Bell', seq: ['H', 'A'], how: 'Heavy, then Attack', desc: 'Bring the maul down like a bell-clapper: three black rings toll out across the street, each one hurling back whoever it reaches.',
        dur: .78, h: [.48, .66], x0: 0, x1: 72, dmg: 22, kb: 200, launch: 240, arc: [-2.8, 1.5], hop: 140, lunge: 110, smash: 1, power: 2, depth: 26, cx: 'bell' },
      LLLH: { cl: 5, name: 'Sinkhole', seq: ['A', 'A', 'A', 'H'], how: 'Three Attacks, then Heavy', desc: 'Out of the cyclone, drive the maul into the street: it opens into a black pit that drags everyone near into it, grinds at them, and throws them all high when it shuts.',
        dur: .9, h: [.55, .72], x0: 0, x1: 70, dmg: 18, kb: 60, arc: [-2.9, 1.5], hop: 90, lunge: 60, smash: 1, power: 2, depth: 26, cx: 'pit' },
      LHH: { cl: 7, name: 'Coffin Rise', seq: ['A', 'H', 'H'], how: 'Attack, Heavy, Heavy', desc: 'Heave the maul up from the street: three black grave-slabs burst up in a row before you, one after another, throwing everything on them into the air.',
        dur: .7, h: [.35, .55], x0: 0, x1: 66, dmg: 16, kb: 80, launch: 420, arc: [2.4, -2.5], lunge: 60, power: 2, cx: 'coffins' },
    },
    staff: {
      HHL: { cl: 3, name: 'Thornline', seq: ['H', 'H', 'A'], how: 'Heavy, Heavy, Attack', desc: 'Stab the staff into the street: black thorns burst up out of it in a line, running away from you down the street.',
        dur: .62, h: [.4, .6], x0: 0, x1: 70, dmg: 10, kb: 60, arc: [-2.2, 1.3], lunge: 40, power: 1, cx: 'thorns' },
      LLLH: { cl: 5, name: 'Gloam Vortex', seq: ['A', 'A', 'A', 'H'], how: 'Three Attacks, then Heavy', desc: 'Spin the staff until the dark comes loose: a black vortex crawls down the street, dragging foes into it and grinding them, and bursts.',
        dur: .75, h: [.2, .7], x0: 0, x1: 66, dmg: 3, kb: 40, arc: [.2, .2], twirl: 4, ends: 1, multi: .1, power: 1, cx: 'vortex' },
      HHHL: { cl: 7, name: 'Night Orbit', seq: ['H', 'H', 'H', 'A'], how: 'Three Heavies, then Attack', desc: 'Whirl the staff once round you and three ink-moons come loose of it: for a few seconds they circle you, striking whatever comes near.',
        dur: .6, h: [.2, .8], x0: 0, x1: 72, dmg: 8, kb: 200, arc: [-P_, P_], around: 1, spin: 1, twirl: 1, power: 1, cx: 'orbit' },
    },
    sword: {
      LLH: { cl: 3, name: 'Rift Cleave', seq: ['A', 'A', 'H'], how: 'Attack, Attack, Heavy', desc: 'Bring the great blade down hard enough to tear the street: a black rift runs away from you, throwing up whoever stands on it, and stays open a moment, burning.',
        dur: .78, h: [.5, .66], x0: 0, x1: 96, dmg: 26, kb: 160, launch: 280, arc: [-2.9, 1.45], lunge: 110, power: 2, depth: 26, cx: 'rift' },
      LLLH: { cl: 5, name: 'Crescent Volley', seq: ['A', 'A', 'A', 'H'], how: 'Three Attacks, then Heavy', desc: 'Three cuts so fast the dark comes off the blade: three black crescents fly down the street, one in each lane, through everyone in their way.',
        dur: .62, h: [.22, .62], x0: 0, x1: 90, dmg: 10, kb: 120, arc: [-1.8, 1.2], multi: .14, lunge: 80, power: 1, cx: 'volley' },
      HHL: { cl: 7, name: 'Doom Pillars', seq: ['H', 'H', 'A'], how: 'Heavy, Heavy, Attack', desc: 'Drive the blade into the street: the Circle\'s mark opens under every foe near you, and a heartbeat later a black pillar bursts up out of each.',
        dur: .9, h: [.4, .58], x0: 0, x1: 80, dmg: 14, kb: 80, arc: [-2.4, 1.6], crouch: 1, power: 2, cx: 'pillars' },
    },
    rapier: {
      LLLH: { cl: 3, name: 'Rending Passage', seq: ['A', 'A', 'A', 'H'], how: 'Three Attacks, then Heavy', desc: 'Pass clean through the crowd on one long lunge, untouchable; every foe you pass is left a black cut, and a moment later every cut bursts.',
        dur: .5, h: [.12, .55], x0: -40, x1: 60, dmg: 3, kb: 20, arc: [.02, .02], lunge: 660, power: 1, noStun: 1, style: 'thrust', cx: 'rend' },
      HHL: { cl: 5, name: 'Crown of Thorns', seq: ['H', 'H', 'A'], how: 'Heavy, Heavy, Attack', desc: 'A double pirouette, and the blade sheds a ring of black thorns that fly out all round you.',
        dur: .6, h: [.25, .75], x0: 0, x1: 70, dmg: 4, kb: 90, arc: [-P_, 3 * P_], around: 1, multi: .08, spin: 2, power: 1, cx: 'needles' },
      HHHL: { cl: 7, name: 'Black Constellation', seq: ['H', 'H', 'H', 'A'], how: 'Three Heavies, then Attack', desc: 'Prick a star into every foe around you and draw the Circle\'s lines between them; then cut the lines: the more stars, the deeper each one bleeds.',
        dur: .55, h: [.3, .5], x0: 0, x1: 90, dmg: 8, kb: 60, arc: [.04, .04], power: 1, style: 'thrust', cx: 'stars' },
    },
    fists: {
      LLLH: { cl: 3, name: 'Grasp of the Circle', seq: ['A', 'A', 'A', 'H'], how: 'Three Attacks, then Heavy', desc: 'A black hand shoots out of your fist far down the street, takes the first foe it finds and drags them back onto your knuckles.',
        dur: .55, h: [.25, .5], x0: 0, x1: 40, dmg: 8, kb: 40, arc: [.2, .2], lunge: 40, power: 1, style: 'thrust', cx: 'grasp' },
      LLLLH: { cl: 5, name: 'Hollow Barrage', seq: ['A', 'A', 'A', 'A', 'H'], how: 'Four Attacks, then Heavy', desc: 'A storm of punches into the air, and fists of ink fly on from every one of them, the last one twice the size.',
        dur: .7, h: [.15, .75], x0: 0, x1: 44, dmg: 3, kb: 30, multi: .08, lunge: 30, power: 1, style: 'thrust', flurry: 1, cx: 'barrage' },
      LHH: { cl: 7, name: 'Eclipse Drop', seq: ['A', 'H', 'H'], how: 'Attack, Heavy, Heavy', desc: 'Leap and drive both fists down into the street: it blackens into an eclipse where every foe is slowed and slowly drained.',
        dur: .72, h: [.55, .78], x0: 0, x1: 46, dmg: 16, kb: 120, launch: 300, arc: [-2.6, 1.4], hop: 380, lunge: 60, bounce: 1, smash: 1, shock: 90, power: 2, cx: 'eclipse' },
    },
  };
  for (const id in CT) for (const k in CT[id]) Object.assign(CT[id][k], { key: k, cw: 1 });
  const cmList = (id) => Object.values(CT[id] || {}).sort((a, b) => a.cl - b.cl);
  const cmOK = (id, m) => { const c = cw(id); return !!c && !!m && lvOf(c) >= m.cl; };

  // a combo that runs on into a cursed move
  { const _nm = nextMove; nextMove = function (key) {
    if (P && P.seq && held()) { const m = CT[P.w] && CT[P.w][P.seq + key]; if (m && cmOK(P.w, m)) return m; }
    return _nm(key); }; }
  const isFin = (m) => { if (!m || !m.key || !P) return false; if (m.cw) return true; if (!/^[LH]{3,}$/.test(m.key)) return false;
    const t = WEAPONS[P.w] && WEAPONS[P.w].tree, c = CT[P.w] || {}; return !!t && !t[m.key + 'L'] && !t[m.key + 'H'] && !c[m.key + 'L'] && !c[m.key + 'H']; };

  // ---------------- the live state (not saved) ----------------
  let LS = fresh();
  function fresh() { return { fx: [], dropped: {}, acc: 0, nextDrop: 0, rec: null, starve: 0, starveT: 0, hitN: 0, pyreT: [], dbl: null, feedT: 0, smokeT: 0 }; }
  const fxOn = () => LS.fx.length || LS.dbl;

  // ======================================================================================================
  // THE BLOWS: the cursed weapon's weight, its gift and its price
  // ======================================================================================================
  const wpnBlow = (m) => !!m && !m.trump && !m.thorns && !m.el && !m.pearl && !m.arrow && !m.cEnv && !m.w8v;
  let CTXW = null;
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    const c = held();
    if (!c || !e || e.dead || !m || !wpnBlow(m)) return _strike(e, base, dir, m, echo);
    const k = m.cwx ? 1 : ratio(P.w), b = base * k, n0 = echoes.length, hp0 = e.hp, prev = CTXW;
    CTXW = { e, m, b };
    let r; try { r = _strike(e, b, dir, m, echo); } finally { CTXW = prev; }
    if (k !== 1) for (let i = n0; i < echoes.length; i++) echoes[i].dmg /= k; // (an echo struck inside comes back through here and is weighed again)
    if (e.hp < hp0 && !m.cwx && !c.pure) landed(e, b, dir, m, echo, c);
    if (e.hp < hp0 && !m.cwx && LS.rec && LS.rec.id === P.moveId) LS.rec.hit = true;
    return r;
  };
  function landed(e, b, dir, m, echo, c) {
    if (c.bf === 'echo' && !echo && !m.cwEcho) { LS.hitN++; if (LS.hitN % 3 === 0) { // the blow struck again by its own shadow
      echoes.push({ e, dmg: b * .55, dir, m: Object.assign({}, m, { cwx: 1, cwEcho: 1, noStun: 1 }), t: .13 });
      fx.push({ kind: 'slash', x: e.x - dir * 10, y: e.y, z: e.z + e.hh * .55, ang: rand(-.7, .7), t: .3, max: .3, size: 34 + e.hw, col: '#4A2A6A' }); } }
    if (c.bf === 'circle' && m.power === 2 && P.cwCircled !== P.moveId && LS.fx.filter(f => f.k === 'circle').length < 3) { P.cwCircled = P.moveId; addFx({ k: 'circle', x: e.x, y: e.y, R: 62, life: 2.6, tick: .4, d: 3 * CM(P.w) }); sfx('growl', .35); }
    if (c.db === 'blood' && isFin(P.move) && P.cwBled !== P.moveId && P.hp > 1) { P.cwBled = P.moveId; const d = Math.max(1, Math.round(maxHp() * .025)); P.hp = Math.max(1, P.hp - d); floatText(P.x, P.y, 78, '-' + d, '#9A4AC8', 13);
      burst(P.x, P.y, 46, ['#2A1030', '#8A2040'], 6, 'flesh'); }
  }
  // black lightning off a critical hit
  { const _he = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) {
    const r = _he(e, dmg, dir, m, crit);
    if (crit && CTXW && CTXW.e === e && !CTXW.m.cwx && !m.cwx && hasBF('chain')) {
      const tg = enemies.filter(o => o !== e && !o.dead && Math.hypot(o.x - e.x, (o.y - e.y) * 2) < 190).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x)).slice(0, 3);
      for (const o of tg) { fx.push({ kind: 'bolt', x: e.x, y: e.y, z: e.z + e.hh * .55, x2: o.x, y2: o.y, z2: o.z + o.hh * .55, t: .3, max: .3, col: '#8A3AC8', seed: Math.random() });
        hit(o, dmg * .45, Math.sign(o.x - e.x) || dir, { power: 0, kb: 60, noStun: 0 }); }
      if (tg.length) sfx('hit-crystal', .6);
    }
    return r; }; }
  // kills: the pyre, the hunger, and the drops
  { const _ke = killEnemy; killEnemy = function (e, dir, m) {
    const was = e.dead, r = _ke(e, dir, m);
    if (was || !e.dead) return r;
    try {
      const c = held(), mine = c && m && wpnBlow(m);
      if (mine && !c.pure && c.bf === 'pyre') pyre(e);
      if (mine && !c.pure && c.db === 'hunger') { LS.starve = 0; if (NG() && window.CURSE) CURSE.feed(.3, 'the cursed weapon feeds'); }
      if (mine && c.pure && NG() && window.CURSE) { // a purified weapon's kill draws a little of the curse out of the world: a ring of dawn-light off the body
        const k = e.boss ? 3 : e.cursed ? 1 : (e.elite || e.champ) ? .8 : .35, d = CURSE.ease(k, 'a purified blade cleanses');
        if (d > 0) { const sz = Math.min(1.6, (e.hh || 60) / 60); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .55, max: .55, r: 60 + 50 * sz + (e.cursed ? 40 : 0), col: '#FFE9A8', flat: 1 });
          for (let i = 0; i < (e.cursed || e.boss ? 14 : 7) && parts.length < 420; i++) parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y, z: rand(6, (e.hh || 60) * .9), vx: rand(-20, 20), vy: 0, vz: rand(50, 120), life: .8, max: .8, col: pick(['#FFF4C8', '#FFE08A', '#FFFFFF']), size: rand(1.4, 2.6), shape: 'star', rot: 0, vr: 4 });
          LS.pureN = (LS.pureN || 0) + 1; if (e.cursed || e.boss || LS.pureN % 6 === 1) floatText(e.x, e.y, (e.hh || 60) + 34, e.cursed || e.boss ? 'THE CURSE IS DRAWN OUT' : 'THE CURSE EASES', '#FFE9A8', 12); } }
      maybeDrop(e, m);
    } catch (err) { console.error(err); }
    return r; }; }
  function pyre(e) {
    const t = now(); LS.pyreT = LS.pyreT.filter(x => x > t - 1); if (LS.pyreT.length >= 6) return; LS.pyreT.push(t);
    addFx({ k: 'flame', x: e.x, y: e.y, life: 1.4, r: 16 + e.hw * .5 }); sfx('growl', .3);
    const d = 4 * CM(P.w);
    const tg = enemies.filter(o => !o.dead && o !== e && Math.hypot(o.x - e.x, (o.y - e.y) * 2) < 120 + o.hw).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x)).slice(0, 2);
    for (const o of tg) { o.cwBurn = { t: 2, tick: .2, d }; addFx({ k: 'leap', x: e.x, y: e.y, x2: o.x, y2: o.y, life: .3 }); }
  }

  // ---------------- the price: the dodge, the parry, the perfect charge ----------------
  { const _sd = startDodge; startDodge = function () {
    const c = cursedHeld(), W = P && WEAPONS[P.w], keep = W && W.parry, was = P && P.state;
    if (c && c.db === 'graceless' && keep) W.parry = false;
    let r; try { r = _sd(); } finally { if (W && keep) W.parry = keep; }
    if (c && c.db === 'leaden' && was !== 'dodge' && P.state === 'dodge') { P.dvx *= .72; P.dvy *= .72; P.t *= .82; P.dodgeDur *= .82; P.inv = Math.max(.12, P.inv - .1);
      for (let i = 0; i < 5; i++) parts.push({ x: P.x + rand(-8, 8), y: P.y, z: rand(4, 30), vx: rand(-30, 30), vy: 0, vz: rand(-10, 20), life: .5, max: .5, col: 'rgba(30,14,40,.7)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); }
    return r; }; }
  { const _ct = chargeTiming; chargeTiming = function (w) { const r = _ct(w); if (r.open && hasDB('graceless')) return Object.assign({}, r, { open: false }); return r; }; }

  // ======================================================================================================
  // THE MOVES' OWN WORK, AND THE CUE
  // ======================================================================================================
  { const _b = begin; begin = function (m) {
    const r = _b(m);
    try {
      if (m && m !== 'charge' && P && (P.state === 'atk' || P.state === 'air') && held()) {
        const c = held();
        if (m.cw) { P.cwFired = -1; P.cwCast = P.moveId; castCue(m, c); }
        if (m.cw && !c.pure && !(P.move && P.move.perfect) && NG() && window.CURSE) CURSE.feed(.3, 'a cursed skill used'); // (the curse grows a little each time its own moves are called on: not when it is a perfect charged release)
        if (m.cw && m.cx === 'rend') P.inv = Math.max(P.inv, m.dur * .9);
        if (!c.pure && c.bf === 'double' && isFin(P.move) && !LS.dbl) { // the shadow rises on the far side of whoever he strikes at, and swings back at them as they are thrown into it
          const f0 = P.facing, foe = enemies.filter(e => !e.dead && (e.x - P.x) * f0 > -10 && (e.x - P.x) * f0 < 220 && Math.abs(e.y - P.y) < 40).sort((a, b2) => Math.abs(a.x - P.x) - Math.abs(b2.x - P.x))[0];
          const x = foe ? clamp(foe.x + f0 * (foe.hw + 46), camX + 20, camX + VW - 20) : P.x - f0 * 30, sf = foe ? -f0 : f0;
          LS.dbl = { id: P.moveId, m: P.move, x, y: clamp(P.y + 4, FLOOR_TOP + 6, FLOOR_BOT), f: sf, sg: sf * f0, poses: [], t: -.16, hit: new Set(), z: 0 };
          for (let i = 0; i < 10; i++) parts.push({ x: x + rand(-12, 12), y: LS.dbl.y, z: rand(0, 50), vx: rand(-30, 30), vy: 0, vz: rand(20, 80), life: .6, max: .6, col: pick(['rgba(14,6,20,.8)', 'rgba(60,30,90,.7)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); }
        LS.rec = { id: P.moveId, m: P.move, hit: false, fin: isFin(P.move) };
      }
    } catch (err) { console.error(err); }
    return r; }; }
  function castCue(m, c) {
    const pure = c.pure; sfx(pure ? 'learned' : 'growl', .6); shakeMag = Math.max(shakeMag, 3);
    burst(P.x + P.facing * 14, P.y, 46, pure ? ['#FFF4D8', '#FFE08A', '#FFFFFF'] : ['#0A0608', '#4A2A5A', '#9A2038'], 14, 'spark', P.facing, true);
    floatText(P.x, P.y, 104, m.name.toUpperCase(), pure ? '#FFE8B0' : '#C8A0E8', 12);
  }
  { const _mx = moveExtras; moveExtras = function (m, k, dt, airborne) {
    if (m && m.cw && held() && P.cwCast === P.moveId) { try { castStep(m, k, dt, airborne); } catch (err) { console.error(err); } }
    return _mx(m, k, dt, airborne); }; }
  { const _mp = movePoseKey; movePoseKey = function (m) { return m && m.poseAs ? P.w + ':' + m.poseAs : _mp(m); }; }

  const pureNow = () => { const c = held(); return !!c && !!c.pure; };
  const D = (x) => x * CM(P.w); // a cursed move's own blows: weighed here, and not again (cwx)
  function hit(e, d, dir, o) { if (!e || e.dead) return; const q = Math.max(1, d); strike(e, q, dir || (Math.sign(e.x - P.x) || P.facing), Object.assign({ dmg: q, kb: 140, power: 1, cwx: 1 }, o)); }
  const addFx = (f) => { f.t = 0; f.pure = f.pure ?? pureNow(); LS.fx.push(f); if (LS.fx.length > 40) LS.fx.shift(); return f; };
  const lane = (y) => clamp(y, FLOOR_TOP + 8, FLOOR_BOT);
  function castStep(m, k, dt, airborne) {
    const f = P.facing, fire = (at) => { if (k >= at && P.cwFired !== P.moveId) { P.cwFired = P.moveId; return true; } return false; };
    switch (m.cx) {
      case 'bell': if (fire(m.h[0] + .02)) { const x = P.x + f * 50; for (let i = 0; i < 3; i++) addFx({ k: 'ring', x, y: P.y, at: i * .2, R: [120, 170, 220][i], life: .5 + i * .2, d: D(9), hit: new Set(), up: i === 2 }); shakeMag = Math.max(shakeMag, 8); sfx('slam'); } break;
      case 'pit': if (fire(m.h[0] + .03)) { addFx({ k: 'pit', x: P.x + f * 80, y: P.y, R: 92, life: 1.9, tick: .3, d: D(4), fin: D(22) }); shakeMag = Math.max(shakeMag, 9); sfx('slam'); } break;
      case 'coffins': if (fire(m.h[0])) { for (let i = 0; i < 3; i++) addFx({ k: 'slab', x: P.x + f * (64 + i * 66), y: lane(P.y + (i - 1) * 4), at: i * .11, life: .95 + i * .11, d: D(16), hit: new Set(), f }); sfx('slam'); } break;
      case 'thorns': if (fire(m.h[0])) { for (let i = 0; i < 6; i++) addFx({ k: 'thorn', x: P.x + f * (48 + i * 40), y: lane(P.y + rand(-4, 4)), at: i * .055, life: .6 + i * .055, d: D(9), hit: new Set(), f, h: 44 + i * 4 }); sfx('break'); } break;
      case 'vortex': if (fire(m.h[0] + .3)) { addFx({ k: 'vortex', x: P.x + f * 60, y: P.y, vx: f * 80, life: 2.4, tick: .25, d: D(3), fin: D(15) }); sfx('whoosh'); } break;
      case 'orbit': if (fire(m.h[0] + .1)) { for (let i = 0; i < 3; i++) addFx({ k: 'orb', a: i / 3 * TAU, life: 4.5, d: D(6), cd: new Map() }); sfx('whoosh'); } break;
      case 'rift': if (fire(m.h[0] + .02)) { addFx({ k: 'rift', x0: P.x + f * 44, y: P.y, len: 330, f, life: 1.75, grow: .42, d: D(15), tickD: D(3), tick: .3, hit: new Set(), seed: Math.random() * 99 }); shakeMag = Math.max(shakeMag, 10); sfx('slam'); } break;
      case 'volley': if (fire(m.h[0] + .08)) { [0, -26, 26].forEach((dy, i) => addFx({ k: 'cres', x: P.x + f * 30, y: lane(P.y + dy), at: i * .07, vx: f * 460, life: .9 + i * .07, d: D(13), hit: new Set(), f })); sfx('slice'); } break;
      case 'pillars': if (fire(m.h[0])) { const tg = enemies.filter(e => !e.dead && Math.abs(e.x - P.x) < 360 && e.x > camX && e.x < camX + VW).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x)).slice(0, 5);
        if (!tg.length) addFx({ k: 'pillar', e: null, x: P.x + f * 90, y: P.y, at: .45, life: 1.1, d: D(26), done: false });
        for (const e of tg) addFx({ k: 'pillar', e, x: e.x, y: e.y, at: .5, life: 1.15, d: D(26), done: false }); shakeMag = Math.max(shakeMag, 6); sfx('growl', .7); } break;
      case 'rend': { if (k >= m.h[0] && k <= m.h[1]) for (const e of enemies) { if (e.dead || e.cwRend === P.moveId) continue; if (Math.abs(e.x - P.x) < 34 + e.hw && Math.abs(e.y - P.y) < 26 && e.z < 60) { e.cwRend = P.moveId; addFx({ k: 'cut', e, at: .55, life: .85, d: D(15), sp: D(6), ang: rand(-.5, .5) }); } }
        if (Math.random() < dt * 40) addGhostDark(); break; }
      case 'needles': if (fire(.45)) { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .15; addFx({ k: 'needle', x: P.x, y: P.y, z: 36, vx: Math.cos(a) * 430, vy: Math.sin(a) * 160, life: .55, d: D(8), a }); } sfx('slice'); } break;
      case 'stars': if (fire(m.h[0])) { const tg = enemies.filter(e => !e.dead && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 300).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x)).slice(0, 6);
        addFx({ k: 'stars', es: tg, at: .65, life: 1.05, d: D(11), per: D(4), done: false }); sfx('hit-crystal', .8); } break;
      case 'grasp': if (fire(m.h[0])) { addFx({ k: 'grasp', x: P.x + f * 18, y: P.y, f, reach: 210, life: .75, e: null, d: D(12), phase: 0 }); sfx('whoosh'); } break;
      case 'barrage': { if (k < m.h[0]) break; if (P.cwBarId !== P.moveId) { P.cwBarId = P.moveId; P.cwBar = -1; }
        const j = Math.min(5, Math.floor((k - m.h[0]) / .09));
        while (P.cwBar < j) { P.cwBar++; const big = P.cwBar === 5;
          addFx({ k: 'fist', x: P.x + f * 26, y: lane(P.y + rand(-9, 9)), z: rand(28, 44), vx: f * (big ? 420 : 540), f, life: .5, d: D(big ? 12 : 5), big, hit: new Set() }); sfx(big ? 'whoosh' : 'swing', .5); }
        break; }
      case 'eclipse': if (!airborne && k >= m.h[0] && P.cwFired !== P.moveId) { P.cwFired = P.moveId; addFx({ k: 'eclipse', x: P.x + f * 16, y: P.y, R: 112, life: 2.8, tick: .4, d: D(3) }); shakeMag = Math.max(shakeMag, 9); sfx('slam'); } break;
    }
  }
  function addGhostDark() { if (ghosts.length < 18) ghosts.push({ x: P.x, y: P.y, z: P.z, facing: P.facing, pose: playerPose(), a: .6, dark: 1 }); }

  // ---------------- the effects, step by step ----------------
  const foesIn = (x, y, r) => enemies.filter(e => !e.dead && Math.hypot(e.x - x, (e.y - y) * 2) < r + e.hw);
  function pull(e, x, y, sp, dt) { if (e.boss || e.dead || e.def && e.def.weight === 0) return; const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy * 2) || 1, v = Math.min(d, sp * dt * (e.def && e.def.weight || 1));
    e.x += dx / d * v; e.y = lane(e.y + dy / d * v * .5); if (e.state === 'idle' || e.state === 'walk') { e.state = 'hurt'; e.t = Math.max(e.t || 0, .2); e.plan = null; } }
  const smoke = (x, y, z, n, cols) => { for (let i = 0; i < n && parts.length < 400; i++) parts.push({ x: x + rand(-10, 10), y: y + rand(-3, 3), z: z + rand(0, 10), vx: rand(-20, 20), vy: 0, vz: rand(20, 70), life: .8, max: .8, col: pick(cols || ['rgba(14,6,20,.75)', 'rgba(60,30,80,.6)', 'rgba(130,24,40,.5)']), size: rand(3, 7), shape: 'puff', rot: 0, vr: 0 }); };
  const pcols = (f) => f.pure ? ['rgba(255,244,214,.7)', 'rgba(255,224,138,.6)', 'rgba(255,255,255,.6)'] : null;
  function stepFx(dt) {
    for (const f of LS.fx) {
      f.t += dt; const a = f.t - (f.at || 0);
      switch (f.k) {
        case 'ring': if (a > 0) { const r = f.R * sm(a / .45); for (const e of enemies) { if (e.dead || f.hit.has(e) || e.z > 50) continue; const d = Math.hypot(e.x - f.x, (e.y - f.y) * 2.4); if (d < r + e.hw && d > r - 46 - e.hw) { f.hit.add(e); hit(e, f.d, Math.sign(e.x - f.x) || 1, { kb: 300, launch: f.up ? 360 : 120, power: 1 }); } } } break;
        case 'pit': { const life = f.life; if (f.t < life - .25) { for (const e of foesIn(f.x, f.y, 210)) pull(e, f.x, f.y, 230, dt);
          f.tk = (f.tk || 0) - dt; if (f.tk <= 0) { f.tk = f.tick; for (const e of foesIn(f.x, f.y, f.R)) hit(e, f.d, Math.sign(e.x - f.x) || 1, { power: 0, kb: 0, noStun: 1 }); }
          if (Math.random() < dt * 20) smoke(f.x + rand(-f.R, f.R) * .7, f.y, 2, 1, pcols(f)); }
          else if (!f.done) { f.done = true; shakeMag = Math.max(shakeMag, 10); sfx('slam'); for (const e of foesIn(f.x, f.y, f.R + 30)) hit(e, f.fin, Math.sign(e.x - f.x) || 1, { power: 2, kb: 120, launch: 520 });
            burst(f.x, f.y, 6, f.pure ? ['#FFF4D8', '#FFE08A'] : ['#0A0608', '#3A1A4A', '#9A2038'], 26, 'rock', 0, true); } break; }
        case 'slab': if (a > 0 && !f.up) { f.up = true; shakeMag = Math.max(shakeMag, 6); burst(f.x, f.y, 4, ['#2A2028', '#0A0608', '#5A3A4A'], 10, 'rock', 0, true);
          for (const e of enemies) if (!e.dead && !f.hit.has(e) && Math.abs(e.x - f.x) < 30 + e.hw && Math.abs(e.y - f.y) < 26) { f.hit.add(e); hit(e, f.d, f.f, { power: 2, kb: 100, launch: 560 }); } } break;
        case 'thorn': if (a > 0 && !f.up) { f.up = true; for (const e of enemies) if (!e.dead && !f.hit.has(e) && Math.abs(e.x - f.x) < 26 + e.hw && Math.abs(e.y - f.y) < 22) { f.hit.add(e); hit(e, f.d, f.f, { power: 1, kb: 50, launch: 380 }); } } break;
        case 'vortex': { if (f.t < f.life - .2) { f.x += f.vx * dt; f.vx *= Math.pow(.6, dt); for (const e of foesIn(f.x, f.y, 150)) pull(e, f.x, f.y, 200, dt);
          f.tk = (f.tk || 0) - dt; if (f.tk <= 0) { f.tk = f.tick; for (const e of foesIn(f.x, f.y, 46)) hit(e, f.d, Math.sign(e.x - f.x) || 1, { power: 0, kb: 0, noStun: 1 }); } }
          else if (!f.done) { f.done = true; sfx('whoosh'); shakeMag = Math.max(shakeMag, 6); for (const e of foesIn(f.x, f.y, 84)) hit(e, f.fin, Math.sign(e.x - f.x) || 1, { power: 2, kb: 160, launch: 520 }); smoke(f.x, f.y, 10, 14, pcols(f)); } break; }
        case 'orb': { f.a += dt * 4.2; const ox = P.x + Math.cos(f.a) * 66, oy = P.y + Math.sin(f.a) * 24, oz = P.z + 34; f.x = ox; f.y = oy; f.z = oz;
          for (const e of enemies) { if (e.dead) continue; if (Math.abs(e.x - ox) < 20 + e.hw && Math.abs(e.y - oy) < 22 && oz > e.z - 6 && oz < e.z + e.hh + 20 && !((f.cd.get(e) || 0) > f.t)) { f.cd.set(e, f.t + .4); hit(e, f.d, Math.sign(e.x - P.x) || 1, { power: 0, kb: 160, launch: 60 }); } } break; }
        case 'rift': { const L = f.len * sm(f.t / f.grow), xa = f.x0, xb = f.x0 + f.f * L;
          for (const e of enemies) { if (e.dead || f.hit.has(e) || e.z > 40) continue; if ((e.x - xa) * f.f > -e.hw && (e.x - xb) * f.f < e.hw && Math.abs(e.y - f.y) < 22 + e.hw * .3) { f.hit.add(e); hit(e, f.d, f.f, { power: 2, kb: 60, launch: 440 }); } }
          if (f.t > f.grow) { f.tk = (f.tk || 0) - dt; if (f.tk <= 0 && f.t < f.life - .3) { f.tk = f.tick; for (const e of enemies) if (!e.dead && e.z < 30 && (e.x - xa) * f.f > -e.hw && (e.x - xb) * f.f < e.hw && Math.abs(e.y - f.y) < 18) hit(e, f.tickD, f.f, { power: 0, kb: 0, noStun: 1 }); } }
          if (f.t < f.grow && Math.random() < dt * 40) burst(xb, f.y, 2, f.pure ? ['#FFF4D8', '#E8D8B0'] : ['#2A2028', '#0A0608', '#8A2038'], 2, 'rock', f.f);
          if (Math.random() < dt * 14) smoke(xa + f.f * rand(0, L), f.y, 1, 1, pcols(f)); break; }
        case 'cres': if (a > 0) { f.x += f.vx * dt; for (const e of enemies) { if (e.dead || f.hit.has(e)) continue; if (Math.abs(e.x - f.x) < 18 + e.hw && Math.abs(e.y - f.y) < 22 && e.z < 70) { f.hit.add(e); hit(e, f.d, f.f, { power: 1, kb: 220 }); } } } break;
        case 'pillar': if (a > 0 && !f.done) { f.done = true; if (f.e && !f.e.dead) { f.x = f.e.x; f.y = f.e.y; } shakeMag = Math.max(shakeMag, 7); sfx('slam', .6);
          for (const e of enemies) if (!e.dead && Math.abs(e.x - f.x) < 26 + e.hw && Math.abs(e.y - f.y) < 22) hit(e, f.d, Math.sign(e.x - P.x) || 1, { power: 2, kb: 60, launch: 560 });
          burst(f.x, f.y, 10, f.pure ? ['#FFF4D8', '#FFE08A', '#FFFFFF'] : ['#0A0608', '#3A1A4A', '#C02040'], 18, 'spark', 0, true); }
          else if (a < 0 && f.e && !f.e.dead) { f.x = f.e.x; f.y = f.e.y; } break;
        case 'cut': if (a > 0 && !f.done) { f.done = true; const e = f.e; if (e && !e.dead) { hit(e, f.d, Math.sign(e.x - P.x) || P.facing, { power: 1, kb: 160, launch: 160 });
            for (const o of enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, (o.y - e.y) * 2) < 54 + o.hw) hit(o, f.sp, Math.sign(o.x - e.x) || 1, { power: 0, kb: 120 }); }
          if (e) { f.x = e.x; f.y = e.y; f.z = e.z + e.hh * .55; burst(f.x, f.y, f.z, f.pure ? ['#FFF4D8', '#FFE08A', '#FFC0D0'] : ['#0A0608', '#5A2A6A', '#C02040'], 14, 'spark', 0, true); } sfx('slice'); } break;
        case 'needle': { f.x += f.vx * dt; f.y += f.vy * dt; if (f.y < FLOOR_TOP + 4 || f.y > FLOOR_BOT + 4) f.vy = -f.vy; if (!f.spent) for (const e of enemies) { if (e.dead) continue; if (Math.abs(e.x - f.x) < 10 + e.hw && Math.abs(e.y - f.y) < 20 && f.z > e.z - 4 && f.z < e.z + e.hh + 10) { f.spent = true; f.life = Math.min(f.life, f.t + .05); hit(e, f.d, Math.sign(f.vx) || 1, { power: 0, kb: 90 }); break; } } break; }
        case 'stars': if (a > 0 && !f.done) { f.done = true; const live = f.es.filter(e => !e.dead), n = live.length; for (const e of live) hit(e, f.d + f.per * Math.max(0, n - 1), Math.sign(e.x - P.x) || 1, { power: n >= 3 ? 2 : 1, kb: 120, launch: 220 });
          if (n) { sfx('crit', .7); flashT = Math.max(flashT, .05); } } break;
        case 'grasp': { const out = .2, back = .22;
          if (f.phase === 0) { const r = f.reach * sm(f.t / out); f.tip = f.x + f.f * r;
            const e = enemies.filter(o => !o.dead && (o.x - f.x) * f.f > -6 && (o.x - f.x) * f.f < r + o.hw && Math.abs(o.y - f.y) < 26 && o.z < 70).sort((a2, b2) => Math.abs(a2.x - f.x) - Math.abs(b2.x - f.x))[0];
            if (e) { f.e = e; f.phase = 1; f.t1 = f.t; f.tip = e.x; sfx('hit-flesh'); if (!e.boss) { e.state = 'hurt'; e.t = .9; e.plan = null; e.vx = 0; } }
            else if (f.t >= out) { f.phase = 2; f.t1 = f.t; } }
          else if (f.phase === 1) { const e = f.e, q = sm((f.t - f.t1) / back), tx = P.x + P.facing * (30 + e.hw);
            if (!e.dead && !e.boss) { e.x += (tx - e.x) * Math.min(1, q * .9 + dt * 12); e.y = lane(e.y + (P.y - e.y) * Math.min(1, dt * 10)); e.z = Math.max(0, e.z * .8); }
            f.tip = e.boss ? e.x : e.x; if (q >= 1 || e.dead) { f.phase = 3; f.t1 = f.t; hit(e, f.d, P.facing, { power: 2, kb: 160, launch: 260 }); f.life = f.t + .2; } }
          else if (f.phase === 2) { const q = sm((f.t - f.t1) / back); f.tip = f.x + f.f * f.reach * (1 - q); if (q >= 1) f.life = f.t; }
          f.x = P.x + P.facing * 18; f.y = P.y; break; }
        case 'fist': { f.x += f.vx * dt; for (const e of enemies) { if (e.dead || f.hit.has(e)) continue; if (Math.abs(e.x - f.x) < 14 + e.hw && Math.abs(e.y - f.y) < 22 && f.z > e.z - 8 && f.z < e.z + e.hh + 16) { f.hit.add(e); hit(e, f.d, f.f, { power: f.big ? 2 : 0, kb: f.big ? 360 : 60, wall: f.big ? 1 : 0 }); if (!f.big) { f.life = Math.min(f.life, f.t + .05); break; } } } break; }
        case 'eclipse': { for (const e of foesIn(f.x, f.y, f.R)) e.cwSlow = Math.max(e.cwSlow || 0, .3); f.tk = (f.tk || 0) - dt; if (f.tk <= 0 && f.t < f.life - .3) { f.tk = f.tick; for (const e of foesIn(f.x, f.y, f.R)) hit(e, f.d, Math.sign(e.x - f.x) || 1, { power: 0, kb: 0, noStun: 1 }); } break; }
        case 'circle': { f.tk = (f.tk || 0) - dt; if (f.tk <= 0 && f.t < f.life - .2) { f.tk = f.tick; let n = 0; for (const e of foesIn(f.x, f.y, f.R)) { hit(e, f.d, Math.sign(e.x - f.x) || 1, { power: 0, kb: 0, noStun: 1 }); n++; }
          if (n && P.hp > 0) { const h = Math.min(n, 2) * Math.max(1, Math.round(maxHp() * .004)); P.hp = Math.min(maxHp(), P.hp + h); } } break; }
        case 'flame': if (Math.random() < dt * 24) parts.push({ x: f.x + rand(-f.r, f.r) * .6, y: f.y + rand(-3, 3), z: rand(4, 26), vx: rand(-10, 10), vy: 0, vz: rand(50, 110), life: .55, max: .55, col: pick(f.pure ? ['#FFF4D8', '#FFE08A'] : ['#0A0608', '#3A1A4A', '#7A2A9A', '#C02040']), size: rand(2, 4), shape: 'star', rot: 0, vr: 4 }); break;
      }
    }
    LS.fx = LS.fx.filter(f => f.t < f.life);
    // the burning: black flame on those the pyre leapt to
    for (const e of enemies) { const b = e.cwBurn; if (!b) continue; if (e.dead) { e.cwBurn = null; continue; } b.t -= dt; b.tick -= dt;
      if (b.tick <= 0) { b.tick = .5; hit(e, b.d, Math.sign(e.x - P.x) || 1, { power: 0, kb: 0, noStun: 1, pyre: 1 }); }
      if (Math.random() < dt * 16 && parts.length < 400) parts.push({ x: e.x + rand(-e.hw, e.hw) * .6, y: e.y, z: e.z + rand(4, e.hh * .8), vx: rand(-10, 10), vy: 0, vz: rand(40, 90), life: .5, max: .5, col: pick(['#0A0608', '#5A2A7A', '#C02040']), size: rand(2, 3.6), shape: 'star', rot: 0, vr: 4 });
      if (b.t <= 0) e.cwBurn = null; }
    // the shadow of him that strikes again
    const S = LS.dbl;
    if (S) { S.t += dt; if (P.moveId === S.id && (P.state === 'atk' || P.state === 'air')) S.poses.push({ pose: playerPose(), z: P.z, dx: (P.x - S.px0) || 0 });
      if (S.px0 === undefined) S.px0 = P.x;
      const m = S.m, k = S.t / m.dur;
      if (k >= m.h[0] && k <= m.h[1]) { const fr = S.poses[Math.min(S.poses.length - 1, Math.max(0, Math.round(S.t * 60)))]; const sx = S.x + (fr ? fr.dx * S.sg : 0);
        for (const e of enemies) { if (e.dead || S.hit.has(e)) continue; const dx = (e.x - sx) * S.f; if ((m.around ? Math.abs(e.x - sx) <= m.x1 + 20 + e.hw : dx >= (m.x0 || 0) - 20 - e.hw && dx <= m.x1 + 20 + e.hw) && Math.abs(e.y - S.y) < (m.depth || 18) + 14 && e.z < 90) { S.hit.add(e); hit(e, (m.dmg || 10) * CM(P.w) * .5, S.f, { power: m.power || 1, kb: m.kb || 120, launch: m.launch || 0 }); } } }
      if (S.t > m.dur + .3 || S.t > 3) LS.dbl = null; }
  }

  // ---------------- every frame: the price that runs on, the smoke, the whiffs ----------------
  { const _up = updatePlayer; updatePlayer = function (dt) {
    _up(dt);
    if (!P || !stage) return;
    try { frame(dt); } catch (err) { console.error(err); }
  }; }
  function frame(dt) {
    if (LS.fx.length || LS.dbl || enemies.some(e => e.cwBurn)) stepFx(dt);
    const c = held();
    if (c) { // black (or, purified, white-gold) smoke off the weapon in his hands
      LS.smokeT -= dt; if (LS.smokeT <= 0 && parts.length < 360) { LS.smokeT = lite() ? .14 : .06; const at = P.w === 'fists' ? 16 : rand(18, 46);
        parts.push({ x: P.x + P.facing * at, y: P.y, z: P.z + rand(30, 54), vx: rand(-12, 12), vy: 0, vz: rand(18, 46), life: .7, max: .7, col: pick(c.pure ? ['rgba(255,240,200,.55)', 'rgba(255,214,130,.5)'] : ['rgba(16,8,20,.75)', 'rgba(70,40,90,.6)', 'rgba(150,26,40,.55)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 }); }
    }
    // a move just over: the whiff, the turn
    const cur = (P.state === 'atk' || P.state === 'air') ? P.moveId : null;
    if (LS.rec && LS.rec.id !== cur) { const R = LS.rec; LS.rec = null; if (cursedHeld()) moveOver(R); }
    if (!c || c.pure) return;
    if (c.db === 'hunger' && waveActive) { LS.starve += dt; if (LS.starve > 6) { LS.starveT -= dt; if (LS.starveT <= 0) { LS.starveT = 1.5; if (P.hp > 1) { const d = Math.max(1, Math.round(maxHp() * .02)); P.hp = Math.max(1, P.hp - d); floatText(P.x, P.y, 76, 'HUNGRY', '#9A4AC8', 11); burst(P.x, P.y, 50, ['#3A1010', '#8A2020'], 4, 'flesh'); } } } }
    else if (c.db === 'hunger') LS.starve = Math.min(LS.starve, 3);
  }
  function moveOver(R) {
    const c = cursedHeld(); if (!c || !R.m) return;
    if (c.db === 'feed' && !R.hit && !R.m.cw) { const near = enemies.filter(e => !e.dead && Math.abs(e.x - P.x) < 150 && Math.abs(e.y - P.y) < 50);
      if (near.length && now() > LS.feedT) { LS.feedT = now() + .6; for (const e of near) { const h = Math.max(1, Math.round(e.maxHp * (e.boss ? .015 : .06))); e.hp = Math.min(e.maxHp, e.hp + h); floatText(e.x, e.y, e.z + e.hh + 12, '+' + h, '#7A9A7A', 11);
        for (let i = 0; i < 5; i++) parts.push({ x: P.x + P.facing * 30, y: P.y, z: 40, vx: (e.x - P.x) * rand(1.5, 2.5), vy: (e.y - P.y) * 2, vz: rand(-10, 30), life: .45, max: .45, col: pick(['rgba(20,40,20,.7)', 'rgba(60,90,60,.6)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 }); } } }
    if (c.db === 'turn' && R.fin && Math.random() < .25 && P.hp > 1 && P.state !== 'dead') { const d = Math.max(1, Math.round(maxHp() * .05)); P.hp = Math.max(1, P.hp - d); hurtFlash = .22; shakeMag = Math.max(shakeMag, 5);
      floatText(P.x, P.y, 92, 'IT TURNS ON YOU  -' + d, '#B060D0', 12); fx.push({ kind: 'slash', x: P.x, y: P.y, z: 40, ang: rand(-1, 1), t: .3, max: .3, size: 54, col: '#5A2A7A' }); sfx('hurt', .6); }
  }
  // the slowing eclipse
  { const _ue = updateEnemy; updateEnemy = function (e, dt) { if (e && e.cwSlow > 0) { e.cwSlow -= dt; return _ue(e, dt * .45); } return _ue(e, dt); }; }
  // a new world (and each place in it): the effects and the drops start again
  { const _ss = startStage; startStage = function (i) { LS = fresh(); try { migrate(); } catch (e) { console.error(e); } return _ss(i); }; }
  { const _ez = enterZone; enterZone = function (z, Zs) { const d = LS.dropped, acc = LS.acc; LS = fresh(); LS.dropped = d; LS.acc = acc; return _ez(z, Zs); }; }

  // ======================================================================================================
  // THE DROPS: the Circle gives one back
  // ======================================================================================================
  const dropChance = (e) => e.boss ? .4 : e.champ ? .25 : e.elite ? .1 : e.cursed ? .05 : .006;
  const armWon = () => !!(save && save.silverArm); // the Black Knuckles are found only by one who already wears Benedict's silver arm (Tir-na Nog'th's relic)
  const canDrop = (id) => id !== 'fists' || armWon();
  const eligible = () => IDS.filter(id => WEAPONS[id] && !cw(id) && !LS.dropped[id] && canDrop(id));
  function maybeDrop(e, m) {
    if (!NG() || !e || e.noLoot) return;
    if (loot.some(k => k.kind === 'cweapon') || now() < LS.nextDrop) return;
    const ids = eligible(); if (!ids.length) return;
    const t = window.CURSE ? CURSE.teff() : 0, p = dropChance(e) * (1 + .25 * t);
    LS.acc += p;
    if (Math.random() < p || LS.acc >= 1.5) { LS.acc = 0; const pref = ids.filter(id => id === P.w); dropAt(Math.random() < .35 && pref.length ? pref[0] : pick(ids), e.x, e.y); }
  }
  function dropAt(id, x, y) {
    if (!WEAPONS[id] || !IDS.includes(id) || cw(id) || !canDrop(id)) return null;
    LS.dropped[id] = 1; LS.nextDrop = now() + 20;
    const k = { kind: 'cweapon', weapon: id, val: 0, x: clamp(x, camX + 40, camX + VW - 40), y: lane(y), z: 120, vz: 0, vx: 0, t: 0, stand: 0, landed: false };
    loot.push(k);
    sfx('growl'); shakeMag = Math.max(shakeMag, 5); floatText(k.x, k.y, 120, 'SOMETHING BLACK FALLS', '#C8A0E8', 13);
    return k;
  }
  // its fall, its landing, and the taking (stand in the black a moment)
  { const _ul = updateLoot; updateLoot = function (dt) {
    if (!loot.some(k => k.kind === 'cweapon')) return _ul(dt);
    const mine = loot.filter(k => k.kind === 'cweapon'); loot = loot.filter(k => k.kind !== 'cweapon');
    try { _ul(dt); } finally { loot = loot.concat(mine); }
    for (const k of mine) { k.t += dt;
      if (!k.landed) { k.vz -= 500 * dt; k.z = Math.max(0, k.z + k.vz * dt); if (k.z <= 0) { k.landed = true; shakeMag = Math.max(shakeMag, 8); sfx('slam'); burst(k.x, k.y, 4, ['#0A0608', '#3A1A4A', '#9A2038'], 24, 'rock', 0, true); fx.push({ kind: 'ring', x: k.x, y: k.y, z: 2, t: .45, max: .45, r: 70, col: '#6A2A7A', flat: 1 }); } continue; }
      if (Math.random() < dt * (lite() ? 6 : 14)) smoke(k.x + rand(-20, 20), k.y, 2, 1);
      const d = Math.hypot(P.x - k.x, (P.y - k.y) * 1.5), on = d < 30 && P.state !== 'dead' && P.z < 10;
      k.stand = on ? k.stand + dt : Math.max(0, k.stand - dt * 2);
      if (on && !k.told) { k.told = true; floatText(P.x, P.y, 96, 'STAND IN THE BLACK TO TAKE IT', '#C8A0E8', 11); }
      if (k.stand >= .75) { k.got = true; take(k.weapon); }
    }
    loot = loot.filter(k => !k.got);
  }; }
  function take(id, lvl, db, bf) {
    const c = setCw(id, lvl || LV0, db, bf, false);
    save.weapon = id; if (P) { P.w = id; P.seq = ''; }
    persist();
    sfx('weapon'); sfx('growl'); flashT = .18; zoom = .06; slowmo = .6; shakeMag = Math.max(shakeMag, 8);
    if (P) { burst(P.x, P.y, 50, ['#0A0608', '#3A1A4A', '#9A2038', '#C8A0E8'], 36, 'spark', 0, true); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .6, max: .6, r: 110, col: '#5A1A3A', flat: 1 });
      for (let i = 0; i < 18; i++) parts.push({ x: P.x + rand(-14, 14), y: P.y, z: rand(0, 60), vx: rand(-40, 40), vy: 0, vz: rand(40, 140), life: 1, max: 1, col: pick(['rgba(10,6,12,.85)', 'rgba(70,30,90,.7)', 'rgba(160,30,50,.6)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); }
    banner(NAMES[id][0] + ' taken', `CURSED · ✕ ${DB[c.db].name.toUpperCase()}: ${DB[c.db].txt.toUpperCase()} · ✦ ${BF[c.bf].name.toUpperCase()}: ${BF[c.bf].txt.toUpperCase()}`, 4.6);
    refreshHud(true);
    return c;
  }
  // drawn on the street: a pool of ink, the weapon standing in it point-down, the veins of it crawling outward
  { const _dl = drawLoot; drawLoot = function (k, t) { if (k.kind === 'cweapon') { try { drawDrop(k, t); } catch (e) { console.error(e); } return; } return _dl(k, t); }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const k of loot) if (k.kind === 'cweapon') box(k.x, k.y, 0, 80, 150); }; }
  const DROP_LEN = { fists: 0, hammer: 52, staff: 70, sword: 98, rapier: 80 };
  function drawDrop(k, t) {
    const x = k.x, y = k.y, land = k.landed ? sm(Math.min(1, (k.t - (k.landT || (k.landT = k.t))) / .5)) : 0, L = lite(), pulse = .5 + .5 * Math.sin(t * 3.2 + x);
    onMain(() => { ctx.save();
      // the pool, and the black veins crawling out of it over the street
      if (k.landed) { const R = 34 * land;
        if (!L) { ctx.strokeStyle = 'rgba(8,4,10,.85)'; ctx.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hsh(i + x) * .5, l = (40 + 34 * hsh(i * 3 + x)) * land; let px = x, py = y; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(px, py);
          for (let j = 1; j <= 6; j++) { const q = j / 6, wob = Math.sin(j * 1.7 + i) * 6 * q; px = x + Math.cos(a) * l * q + wob * -Math.sin(a); py = y + (Math.sin(a) * l * q + wob * Math.cos(a)) * .36; ctx.lineTo(px, py); } ctx.stroke();
          ctx.strokeStyle = `rgba(220,40,50,${.35 + .4 * pulse})`; ctx.lineWidth = .9; ctx.setLineDash([3, 9]); ctx.lineDashOffset = -t * 18; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(8,4,10,.85)'; } }
        const g = ctx.createRadialGradient(x, y, 2, x, y, R * 1.4); g.addColorStop(0, 'rgba(4,2,6,.95)'); g.addColorStop(.7, 'rgba(14,6,18,.85)'); g.addColorStop(1, 'rgba(40,10,30,0)');
        ctx.fillStyle = g; ell(x, y, R * 1.4, R * .5); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,40,60,${.25 + .35 * pulse})`; ctx.lineWidth = 1.4; ell(x, y, R * 1.05, R * .38); ctx.stroke();
        // the column of its glow, violet and blood
        if (!L) softDab(x, y - 40, 46, '140,40,120', .1 + .06 * pulse);
        // the taking: a ring closing round him as he stands in it
        if (k.stand > 0) { ctx.strokeStyle = `rgba(230,170,255,${.6 + .4 * pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 40, 14, 0, -P_ / 2, -P_ / 2 + TAU * Math.min(1, k.stand / .75)); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over'; }
      else { ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(x, y, 16, 5); ctx.fill(); }
      ctx.restore(); });
    // the weapon itself, standing in the black (in the ink layer, outlined like all things)
    const bob = Math.sin(t * 2.2 + x) * 2, sink = k.landed ? 6 * land : 0, z = k.z;
    ctx.save(); ctx.translate(x, y - z + sink + bob - 6);
    const art = { id: k.weapon, lvl: LV0, pure: false, drop: 1 };
    if (k.weapon === 'fists') { ctx.translate(0, -26); ctx.rotate(-P_ / 2 + .2); ctx.scale(1.6, 1.6); drawWeapon('fists', { cwArt: art, glove: '#2A2030' }); }
    else { ctx.rotate(P_ / 2 - .12); const len = DROP_LEN[k.weapon] || 60; ctx.translate(-len, 0); drawWeapon(k.weapon === 'rapier' ? 'grayblade' : k.weapon, { noHand: 1, tier: k.weapon === 'rapier' ? 8 : 7, cwArt: art }); }
    ctx.restore();
  }

  // ======================================================================================================
  // THE ART: each cursed weapon its own dark form, and purified, its radiant one (art_cursedw.js)
  // ======================================================================================================
  // (the art itself is art_cursedw.js: CWART draws each cursed or purified weapon as its own form, and its trails)
  let ICON = null; // (drawIcon: the weapon on its card)
  { const _di = drawIcon; drawIcon = function (canvas, id, scale) {
    if (canvas && canvas.dataset) canvas.dataset.wid = id;
    const c = cw(id); ICON = c ? { id, lvl: lvOf(c), pure: c.pure } : null;
    if (c && id === 'fists' && typeof CWART !== 'undefined') { const A = ICON; ICON = null; try { CWART.fistIcon(canvas, A, scale); return; } catch (e) { console.error(e); } }
    try { _di(canvas, id, scale); } finally { ICON = null; }
  }; }
  { const _pp = playerPose; playerPose = function () {
    const pose = _pp(); const c = P && cw(P.w); if (!c) return pose;
    const art = pose.cwArt = { id: P.w, lvl: lvOf(c), pure: c.pure };
    const tc = c.pure ? 'rgba(255,226,150,.95)' : 'rgba(190,40,90,.95)', gold = 'rgba(216,170,85,.95)', base = TRAIL[P.w];
    if (pose.trailCol === base || pose.trailCol === gold) pose.trailCol = tc;
    if (pose.flat) { pose.flat = Object.assign({}, pose.flat, { cwArt: art }); if (pose.flat.col === base || pose.flat.col === gold) pose.flat.col = tc; }
    if (pose.streak && (pose.streak.col === base || pose.streak.col === gold)) pose.streak.col = tc;
    return pose; }; }
  { const _dw = drawWeapon; drawWeapon = function (kind, pose) {
    const A = (pose && pose.cwArt) || (ICON && (kind === ICON.id || (ICON.id === 'rapier' && kind === 'grayblade')) ? ICON : null);
    const k2 = kind === 'grayblade' ? 'rapier' : kind || 'fists';
    if (!A || k2 !== A.id || typeof CWART === 'undefined') return _dw(kind, pose);
    let ok = false; try { ok = CWART.draw(A.id, A, pose || {}, A === ICON); } catch (e) { console.error(e); }
    if (!ok) _dw(kind, pose);
  }; }
  // the swing trails: ink and embers while cursed, gold light and petals once purified
  { const _dt = drawTrail; drawTrail = function (cx, cy, pose) { const A = pose && pose.cwArt;
    if (!A || typeof CWART === 'undefined') return _dt(cx, cy, pose); try { CWART.trail(cx, cy, pose, A, () => _dt(cx, cy, pose)); } catch (e) { console.error(e); } }; }
  { const _ft = drawFlatTrail; drawFlatTrail = function (cx, cy, f) { const A = f && f.cwArt;
    if (!A || typeof CWART === 'undefined') return _ft(cx, cy, f); try { CWART.flat(cx, cy, f, A, () => _ft(cx, cy, f)); } catch (e) { console.error(e); } }; }

  // ---------------- the effects drawn: on the street (under everyone) and in front ----------------
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!P) return;
    if (LS.fx.length) list.push([FLOOR_TOP - 4, () => onMain(() => { try { drawFloor(t); } catch (e) { console.error(e); } })]);
    const S = LS.dbl; if (S && S.t > 0 && S.poses.length) { const fr = S.poses[Math.min(S.poses.length - 1, Math.round(S.t * 60))], a = .75 * Math.min(1, S.t * 6) * Math.min(1, (S.m.dur + .3 - S.t) * 4);
      if (fr && a > 0) list.push([S.y - .03, () => onMain(() => { ctx.save(); const tt = TINT; TINT = '#1A0C22'; try { drawPlayerAt(S.x + fr.dx * S.sg, S.y, fr.z, S.f, Object.assign({}, fr.pose, { noCloak: 1 }), a); } finally { TINT = tt; } ctx.restore(); })]); }
    if (LS.fx.length) { let any = false; for (const f of fx) if (f.kind === 'cwF') { any = true; break; } if (!any) fx.push({ kind: 'cwF', x: 0, y: 0, z: 0, t: 1e9, max: 1e9 }); }
  }; }
  { const _mb2 = mechBoxes; mechBoxes = function (box) { _mb2(box); const S = LS.dbl; if (S) box(S.x, S.y, 0, 170, 170, 64); }; }
  { const _df = drawFx; drawFx = function (f) { if (f.kind === 'cwF') { if (!LS.fx.length) { f.t = 0; return; } try { drawFront(now()); } catch (e) { console.error(e); } return; } return _df(f); }; }
  const RGB = (f) => f.pure ? '255,214,120' : '220,40,60', DARK = (f) => f.pure ? '#FFF4DC' : VOID, MID = (f) => f.pure ? '#E8C878' : '#3A1A4A';
  function crackPath(x0, x1, y, w, seed, f) { const r = mulberry(seed | 0), n = 16, pts = []; for (let i = 0; i <= n; i++) { const q = i / n; pts.push([x0 + (x1 - x0) * q, y + (r() - .5) * 5, w * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (.6 + .4 * r())]); }
    ctx.beginPath(); for (const p of pts) ctx.lineTo(p[0], p[1] - p[2]); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + p2(pts[i])); ctx.closePath(); return pts; function p2(p) { return p[2] * .7; } }
  function drawFloor(t) {
    const g = ctx, L = lite(); g.save();
    for (const f of LS.fx) { const a = f.t - (f.at || 0), out = Math.min(1, (f.life - f.t) * 3), rgb = RGB(f);
      if (f.k === 'ring' && a > 0) { const r = f.R * sm(a / .45), al = (1 - sm(a / (f.life - (f.at || 0)))) * .9; g.lineWidth = 10 * al + 2; g.strokeStyle = f.pure ? `rgba(255,240,200,${al * .6})` : `rgba(6,2,8,${al})`; ell(f.x, f.y, r, r * .36); g.stroke();
        g.globalCompositeOperation = 'lighter'; g.lineWidth = 2; g.strokeStyle = `rgba(${rgb},${al})`; g.stroke(); g.globalCompositeOperation = 'source-over'; }
      if (f.k === 'pit') { const open = sm(f.t / .3) * (f.done ? Math.max(0, 1 - (f.t - (f.life - .25)) * 4) : 1), R = f.R * open;
        if (R > 1) { const q = g.createRadialGradient(f.x, f.y, 1, f.x, f.y, R); q.addColorStop(0, f.pure ? 'rgba(255,255,240,1)' : 'rgba(0,0,0,1)'); q.addColorStop(.7, f.pure ? 'rgba(255,230,160,.9)' : 'rgba(18,6,22,.95)'); q.addColorStop(1, f.pure ? 'rgba(255,214,120,0)' : 'rgba(90,20,40,0)');
          g.fillStyle = q; ell(f.x, f.y, R * 1.15, R * .42); g.fill();
          if (!L) { g.strokeStyle = f.pure ? 'rgba(200,150,60,.7)' : 'rgba(120,60,150,.6)'; g.lineWidth = 1.3; for (let i = 0; i < 5; i++) { g.beginPath(); for (let j = 0; j <= 20; j++) { const u = j / 20, an = i / 5 * TAU - t * 3 + u * 4, rr = R * (1 - u) * 1.05; g.lineTo(f.x + Math.cos(an) * rr, f.y + Math.sin(an) * rr * .38); } g.stroke(); } }
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},${.5 + .3 * Math.sin(t * 8)})`; g.lineWidth = 2; ell(f.x, f.y, R * 1.08, R * .4); g.stroke(); g.globalCompositeOperation = 'source-over'; } }
      if (f.k === 'rift') { const Lr = f.len * sm(f.t / f.grow), x1 = f.x0 + f.f * Lr, al = out; if (Lr > 2) { g.globalAlpha = al; crackPath(f.x0, x1, f.y, 9, f.seed, f); g.fillStyle = DARK(f); g.fill();
          if (!L) { g.strokeStyle = f.pure ? 'rgba(200,150,60,.8)' : 'rgba(90,40,110,.9)'; g.lineWidth = 1.2; g.stroke(); }
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},${.5 + .4 * Math.sin(t * 9 + f.seed)})`; g.lineWidth = 1.8; g.beginPath(); const r = mulberry(f.seed | 0); for (let i = 0; i <= 16; i++) { const q = i / 16; g.lineTo(f.x0 + (x1 - f.x0) * q, f.y + (r() - .5) * 5); } g.stroke();
          g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; } }
      if (f.k === 'pillar' && a < 0) { const q = sm(f.t / .2), r = 26 * q; g.save(); g.globalAlpha = .9; g.strokeStyle = f.pure ? 'rgba(255,230,160,.9)' : `rgba(200,30,50,${.6 + .4 * Math.sin(t * 16)})`; g.lineWidth = 2; ell(f.x, f.y, r, r * .36); g.stroke();
        g.save(); g.translate(f.x, f.y); g.scale(1, .36); g.rotate(t * 2); g.beginPath(); for (let i = 0; i < 3; i++) { const an = i / 3 * TAU; g.moveTo(Math.cos(an) * r, Math.sin(an) * r); g.lineTo(Math.cos(an + 2.1) * r, Math.sin(an + 2.1) * r); } g.stroke(); g.restore(); g.restore(); }
      if (f.k === 'eclipse') { const R = f.R * sm(f.t / .25) * out; if (R > 1) { const q = g.createRadialGradient(f.x, f.y, 1, f.x, f.y, R); q.addColorStop(0, f.pure ? 'rgba(255,250,230,.95)' : 'rgba(0,0,0,.92)'); q.addColorStop(.82, f.pure ? 'rgba(255,230,170,.7)' : 'rgba(10,4,12,.85)'); q.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = q; ell(f.x, f.y, R, R * .38); g.fill(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 3; g.strokeStyle = `rgba(${f.pure ? '255,220,140' : '230,60,40'},${.55 + .25 * Math.sin(t * 5)})`; ell(f.x, f.y, R * .96, R * .36); g.stroke(); g.globalCompositeOperation = 'source-over'; } }
      if (f.k === 'circle') { const R = f.R * sm(f.t / .2) * out; if (R > 1) { g.lineWidth = 3; g.strokeStyle = f.pure ? 'rgba(255,240,200,.6)' : 'rgba(8,2,8,.8)'; ell(f.x, f.y, R, R * .36); g.stroke(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 1.2; g.strokeStyle = `rgba(${rgb},.7)`; ell(f.x, f.y, R * .86, R * .31); g.stroke();
          if (!L) { g.save(); g.translate(f.x, f.y); g.scale(1, .36); g.rotate(-t * .8); g.fillStyle = `rgba(${rgb},.65)`; for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillRect(R * .88, -2, 3, 4); } g.restore(); } g.globalCompositeOperation = 'source-over'; } }
      if (f.k === 'slab' || f.k === 'thorn') { if (a > -.02) { g.fillStyle = 'rgba(0,0,0,.35)'; ell(f.x, f.y, f.k === 'slab' ? 24 : 12, f.k === 'slab' ? 7 : 4); g.fill(); } }
    }
    g.restore();
  }
  function drawFront(t) {
    const g = ctx, L = lite(); g.save();
    for (const f of LS.fx) { const a = f.t - (f.at || 0), out = Math.min(1, (f.life - f.t) * 4), rgb = RGB(f);
      if (f.k === 'slab' && a > 0) { const up = sm(a / .12) * Math.min(1, (f.life - f.t) / .3), h = 62 * up, w = 22; if (h > 1) { g.save(); g.translate(f.x, f.y); g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + 8); g.quadraticCurveTo(-w / 2, -h, 0, -h - 2); g.quadraticCurveTo(w / 2, -h, w / 2, -h + 8); g.lineTo(w / 2, 0); g.closePath();
          g.fillStyle = f.pure ? '#F0E4C8' : '#16101A'; g.fill(); g.strokeStyle = f.pure ? '#B89048' : '#000'; g.lineWidth = 1.6; g.stroke();
          g.strokeStyle = f.pure ? 'rgba(200,150,60,.9)' : 'rgba(80,60,90,.9)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -h + 10); g.lineTo(0, -h + 26); g.moveTo(-6, -h + 15); g.lineTo(6, -h + 15); g.stroke();
          if (!L) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},${.6 + .3 * Math.sin(t * 7 + f.x)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(-w / 2 + 3, -h * .5); g.lineTo(-2, -h * .35); g.lineTo(3, -h * .55); g.lineTo(w / 2 - 2, -h * .3); g.stroke(); }
          g.restore(); } }
      if (f.k === 'thorn' && a > 0) { const up = sm(a / .07) * Math.min(1, (f.life - f.t) / .25), h = f.h * up; if (h > 1) { g.save(); g.translate(f.x, f.y);
          for (let i = -1; i <= 1; i++) { const hh = h * (i ? .62 : 1), lean = i * .32; g.save(); g.rotate(lean); g.beginPath(); g.moveTo(-5 + i * 2, 2); g.quadraticCurveTo(-2, -hh * .5, 0, -hh); g.quadraticCurveTo(2, -hh * .5, 5 + i * 2, 2); g.closePath(); g.fillStyle = f.pure ? '#FFF2D8' : '#120A14'; g.fill(); g.strokeStyle = f.pure ? '#C8A050' : '#4A2050'; g.lineWidth = 1; g.stroke(); g.restore(); }
          if (!L) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${rgb},.7)`; circle(0, -h, 1.6); g.fill(); } g.restore(); } }
      if (f.k === 'vortex') { const op = sm(f.t / .3) * Math.min(1, (f.life - f.t) / .3), H = 96 * op; if (H > 2) { g.save(); g.translate(f.x, f.y);
          const n = L ? 5 : 9; for (let i = 0; i < n; i++) { const u = i / (n - 1), w = (10 + 40 * u) * op, y = -u * H, ph = t * 9 + i * .9; g.lineWidth = 3 + 3 * (1 - u); g.strokeStyle = f.pure ? `rgba(255,240,200,${.7 - .3 * u})` : `rgba(${i % 2 ? '14,6,20' : '60,26,80'},${.85 - .3 * u})`;
            g.beginPath(); g.ellipse(Math.sin(ph * .3) * 6 * u, y, w, w * .32, 0, ph % TAU, ph % TAU + 4.4); g.stroke(); }
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},.6)`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -H * .5, 22 * op, 7 * op, 0, -t * 10, -t * 10 + 3); g.stroke(); g.restore(); } }
      if (f.k === 'orb') { const x = f.x, y = f.y - f.z; if (x !== undefined) { const fade = Math.min(1, f.t * 4, (f.life - f.t) * 3); g.save(); g.globalAlpha = fade;
          if (!L) { g.strokeStyle = f.pure ? 'rgba(255,230,160,.5)' : 'rgba(80,30,110,.55)'; g.lineWidth = 5; g.beginPath(); for (let j = 0; j < 8; j++) { const aa = f.a - j * .09; g.lineTo(P.x + Math.cos(aa) * 66, P.y + Math.sin(aa) * 24 - f.z); } g.stroke(); }
          const q = g.createRadialGradient(x - 2, y - 2, 1, x, y, 9); q.addColorStop(0, f.pure ? '#FFFFFF' : '#5A2A6A'); q.addColorStop(.6, f.pure ? '#FFE8A8' : '#14081A'); q.addColorStop(1, f.pure ? '#D8A850' : '#000'); g.fillStyle = q; circle(x, y, 8); g.fill();
          g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${rgb},${.7 + .3 * Math.sin(t * 9 + f.a)})`; circle(x, y, 2.4); g.fill(); g.restore(); } }
      if (f.k === 'cres' && a > 0) { g.save(); g.translate(f.x, f.y - 34); g.scale(f.f, 1); const al = out;
          g.globalAlpha = al; g.beginPath(); g.moveTo(-6, -30); g.quadraticCurveTo(26, 0, -6, 30); g.quadraticCurveTo(10, 0, -6, -30); g.closePath(); g.fillStyle = DARK(f); g.fill();
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${f.pure ? '255,230,160' : '170,90,230'},.85)`; g.lineWidth = 1.6; g.stroke();
          if (!L) for (let i = 1; i <= 3; i++) { g.globalAlpha = al * .18 * (4 - i); g.save(); g.translate(-i * 14, 0); g.beginPath(); g.moveTo(-6, -26); g.quadraticCurveTo(20, 0, -6, 26); g.stroke(); g.restore(); }
          g.restore(); }
      if (f.k === 'pillar' && a > 0) { const q = Math.min(1, a / .1), fade = Math.max(0, 1 - (a - .1) / (f.life - f.at - .1)), H = 150 * q, w = 26 * (1 - .4 * (1 - fade));
          g.save(); g.globalAlpha = fade; const lg = g.createLinearGradient(f.x - w, 0, f.x + w, 0); const c0 = f.pure ? 'rgba(255,240,200,' : 'rgba(10,4,14,'; lg.addColorStop(0, c0 + '0)'); lg.addColorStop(.25, c0 + '.95)'); lg.addColorStop(.75, c0 + '.95)'); lg.addColorStop(1, c0 + '0)');
          g.fillStyle = lg; g.fillRect(f.x - w, f.y - H, w * 2, H); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${rgb},.55)`; g.fillRect(f.x - 2.5, f.y - H, 5, H); g.restore(); }
      if (f.k === 'cut') { const e = f.e; if (e && !f.done && !e.dead) { f.x = e.x; f.y = e.y; f.z = e.z + e.hh * .55; } if (f.x !== undefined) {
          if (!f.done) { const s = 10 + 3 * Math.sin(t * 14); g.save(); g.translate(f.x, f.y - f.z); g.rotate(f.ang); g.strokeStyle = f.pure ? '#FFF4D8' : '#0A0408'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s); g.lineTo(-s, s); g.stroke();
            g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},${.6 + .4 * Math.sin(t * 20)})`; g.lineWidth = 1.2; g.stroke(); g.restore(); }
          else { const q = (f.t - f.at) / (f.life - f.at); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},${1 - q})`; g.lineWidth = 3 * (1 - q) + 1; circle(f.x, f.y - f.z, 8 + 40 * q); g.stroke(); g.restore(); } } }
      if (f.k === 'needle') { g.save(); g.translate(f.x, f.y - f.z); g.rotate(Math.atan2(f.vy * .5, f.vx)); g.globalAlpha = out; g.fillStyle = f.pure ? '#FFF2D8' : '#100810'; g.beginPath(); g.moveTo(10, 0); g.lineTo(-8, -1.6); g.lineTo(-8, 1.6); g.closePath(); g.fill();
          g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${rgb},.9)`; circle(9, 0, 1.3); g.fill(); g.restore(); }
      if (f.k === 'stars') { const live = f.es.filter(e => !e.dead), q = Math.min(1, f.t / .25); g.save();
          if (!f.done) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${f.pure ? '255,230,160' : '170,90,230'},${.5 * q + .2 * Math.sin(t * 12)})`; g.lineWidth = 1.2; g.beginPath(); let px = P.x, py = P.y - 40; for (const e of live) { g.moveTo(px, py); px = e.x; py = e.y - e.z - e.hh * .6; g.lineTo(px, py); } g.stroke(); }
          for (const e of live) { const x = e.x, y = e.y - e.z - e.hh * .6, s = (f.done ? 14 * Math.max(0, 1 - (f.t - f.at) * 3) : 7 * q) + 1; g.globalCompositeOperation = 'lighter'; g.fillStyle = f.done ? `rgba(${rgb},.9)` : (f.pure ? '#FFF4D8' : '#D8B8FF');
            g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * .25, y - s * .25); g.lineTo(x + s, y); g.lineTo(x + s * .25, y + s * .25); g.lineTo(x, y + s); g.lineTo(x - s * .25, y + s * .25); g.lineTo(x - s, y); g.lineTo(x - s * .25, y - s * .25); g.closePath(); g.fill(); }
          g.restore(); }
      if (f.k === 'grasp' && f.tip !== undefined) { const x0 = f.x, y0 = f.y - P.z - 40, x1 = f.tip, y1 = f.e ? f.e.y - f.e.z - f.e.hh * .55 : f.y - 40, d = Math.abs(x1 - x0);
        if (d > 4) { g.save(); g.strokeStyle = f.pure ? '#FFF2D8' : '#0C0610'; g.lineCap = 'round'; for (let pass = 0; pass < 2; pass++) { g.lineWidth = pass ? 2 : 6; g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i <= 10; i++) { const u = i / 10; g.lineTo(lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * 9 + t * 20) * 4 * (1 - u)); } if (pass) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${rgb},.6)`; } g.stroke(); }
          g.globalCompositeOperation = 'source-over'; g.translate(x1, y1); g.scale(Math.sign(x1 - x0) || 1, 1); g.fillStyle = f.pure ? '#FFF2D8' : '#0C0610'; g.beginPath(); g.ellipse(0, 0, 7, 8, 0, 0, TAU); g.fill();
          g.lineWidth = 2.4; g.strokeStyle = f.pure ? '#FFF2D8' : '#0C0610'; g.beginPath(); for (let i = 0; i < 4; i++) { const an = -.9 + i * .6; g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(an) * 10, Math.sin(an) * 10, Math.cos(an + .5) * 14, Math.sin(an + .5) * 14); } g.stroke(); g.restore(); } }
      if (f.k === 'fist') { g.save(); g.translate(f.x, f.y - f.z); g.scale(f.f * (f.big ? 1.8 : 1), f.big ? 1.8 : 1); g.globalAlpha = out;
          if (!L) { g.fillStyle = f.pure ? 'rgba(255,240,200,.35)' : 'rgba(30,10,40,.45)'; for (let i = 1; i <= 3; i++) { g.beginPath(); g.ellipse(-i * 7, 0, 6 - i, 5 - i, 0, 0, TAU); g.fill(); } }
          g.fillStyle = f.pure ? '#FFF2D8' : '#120A16'; g.beginPath(); g.ellipse(0, 0, 7, 6, 0, 0, TAU); g.fill(); g.strokeStyle = f.pure ? '#C8A050' : '#6A3A8A'; g.lineWidth = 1; g.stroke();
          g.strokeStyle = f.pure ? '#C8A050' : '#3A1A4A'; g.beginPath(); for (const y of [-2.5, 0, 2.5]) { g.moveTo(3, y); g.lineTo(7, y); } g.stroke();
          g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(${rgb},.7)`; circle(-1, 0, 1.4); g.fill(); g.restore(); }
      if (f.k === 'flame') { const q = f.t / f.life, h = (30 + f.r) * Math.sin(Math.PI * Math.min(1, q * 1.4)); if (h > 1) { g.save(); g.translate(f.x, f.y);
          for (let i = 0; i < (L ? 3 : 5); i++) { const ox = (i - 2) * f.r * .35, hh = h * (1 - Math.abs(i - 2) * .22) * (.85 + .15 * Math.sin(t * 14 + i)), sw = Math.sin(t * 9 + i * 1.7) * 4;
            g.beginPath(); g.moveTo(ox - 6, 0); g.quadraticCurveTo(ox - 6 + sw, -hh * .5, ox + sw * 1.5, -hh); g.quadraticCurveTo(ox + 6 + sw, -hh * .5, ox + 6, 0); g.closePath(); g.fillStyle = f.pure ? 'rgba(255,240,200,.85)' : 'rgba(10,4,14,.9)'; g.fill();
            g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${f.pure ? '255,220,140' : '170,40,120'},.7)`; g.lineWidth = 1.2; g.stroke(); g.globalCompositeOperation = 'source-over'; }
          g.restore(); } }
      if (f.k === 'leap') { const q = f.t / f.life; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(170,40,120,${1 - q})`; g.lineWidth = 2; g.beginPath(); g.moveTo(f.x, f.y - 20); g.quadraticCurveTo((f.x + f.x2) / 2, Math.min(f.y, f.y2) - 60, lerp(f.x, f.x2, Math.min(1, q * 2)), lerp(f.y, f.y2, Math.min(1, q * 2)) - 20); g.stroke(); g.restore(); }
    }
    g.restore();
  }

  // ======================================================================================================
  // THE FORGE, THE MOVE LIST, THE HUD
  // ======================================================================================================
  const esc = (s) => String(s).replace(/</g, '&lt;');
  function cwMovesHtml(id, c) {
    const lv = lvOf(c);
    return cmList(id).map(m => `<li class="${lv >= m.cl ? 'got' : m.cl === lv + 1 || m.cl === lv + 2 && m.cl > lv ? 'next' : ''}"><b style="color:${c.pure ? '#FFE8B0' : '#D8B0F0'}">${c.pure ? 'PURE' : 'CURSED'} LV${m.cl} · ${esc(m.name)}</b> ${typeof chips === 'function' ? chips(id, m) : ''}<br><em>${lv >= m.cl ? m.desc : 'Locked: ' + m.desc}</em></li>`).join('');
  }
  const curseBox = (c) => c.pure ? `<div style="font-size:11.5px;line-height:1.35;color:#F8E8C0;background:rgba(80,60,20,.35);border:1px solid #B89048;border-radius:6px;padding:5px 7px;text-align:left;width:100%;box-sizing:border-box">Purified: no price, no gift. Its moves burn white.</div>`
    : `<div style="font-size:11.5px;line-height:1.35;color:#EAD8F0;background:rgba(30,8,24,.6);border:1px solid #7A2A4A;border-radius:6px;padding:5px 7px;text-align:left;width:100%;box-sizing:border-box"><span style="color:#E86A7A">✕ <b>${DB[c.db].name}</b></span>: ${DB[c.db].txt}.<br><span style="color:#C8A0F0">✦ <b>${BF[c.bf].name}</b></span>: ${BF[c.bf].txt}.</div>`;
  { const _rf = renderForge; renderForge = function (note) {
    _rf(note);
    try { forgeCards(); } catch (e) { console.error(e); }
  }; }
  function forgeCards() {
    const wrap = document.getElementById('forgeCards'); if (!wrap || !save.cw) return;
    for (const id of IDS) { const c = cw(id); if (!c) continue;
      let card = null; const cv = wrap.querySelector(`canvas[data-wid="${id}"]`); if (cv) card = cv.closest('.card');
      const d = document.createElement('div'); d.className = 'card cwcard'; d.dataset.cw = id; d.dataset.sec = 'cursed';
      d.style.cssText = c.pure ? 'box-shadow:0 0 0 1px #E8C878,0 0 18px rgba(255,214,120,.35)' : 'box-shadow:0 0 0 1px #7A2A4A,0 0 18px rgba(150,30,70,.45)';
      const lv = lvOf(c), max = c.pure, top = !c.pure && c.lvl >= LVMAX, cost = c.pure ? null : top ? pureCost() : lvlCost(c.lvl), can = !!cost && save.shards >= cost.s && save.sigils >= cost.g;
      const next = !c.pure && !top ? cmList(id).find(m => m.cl === c.lvl + 1) : null;
      d.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv" style="color:${c.pure ? '#FFE8B0' : '#E890B0'}">${c.pure ? 'PURIFIED' : `CURSED · LV ${c.lvl}/${LVMAX}`} · DAMAGE ×${CM(id).toFixed(2)}</div><div class="nm">${esc(WEAPONS[id].name)}</div>
        <p>${LORE[id][c.pure ? 1 : 0]} It knows every move the old ${id === 'fists' ? 'fists' : 'weapon'} knew, and its own.</p>${curseBox(c)}<ul>${cwMovesHtml(id, c)}</ul>
        ${max ? '<button class="buy" type="button" disabled>Purified: as strong as it will ever be</button>' : `<button class="buy ${top ? 'pink' : ''}" type="button" ${can ? '' : 'disabled'}>${top ? `Draw out the curse: purify, ×${(REF[id] * PURE_K).toFixed(2)} · ${costTxt(cost)}` : `Feed it: level ${c.lvl + 1}${next ? ', new cursed move' : ''} · ${costTxt(cost)}`}</button>`}`;
      drawIcon(d.querySelector('canvas'), id, .78);
      const b = d.querySelector('button.buy:not([disabled])');
      if (b) b.addEventListener('click', () => { const k = top ? pureCost() : lvlCost(c.lvl); if (save.shards < k.s || save.sigils < k.g) return; save.shards -= k.s; save.sigils -= k.g;
        if (top) { c.pure = true; persist(); sfx('learned'); flashT = Math.max(flashT, .1); renderForge(`THE CURSE IS DRAWN OUT: ${WEAPONS[id].name.toUpperCase()} COMES OUT OF THE FIRE BURNING WHITE · DAMAGE ×${CM(id).toFixed(2)}`); }
        else { c.lvl++; persist(); sfx('buy'); const m = cmList(id).find(q => q.cl === c.lvl); renderForge(`${WEAPONS[id].name} is fed: level ${c.lvl}, damage ×${CM(id).toFixed(2)}.${m ? ` New cursed move: ${m.name} (${m.how}).` : ''}${c.lvl >= LVMAX ? ' It can be purified now.' : ''}`); } });
      if (card) card.replaceWith(d); else wrap.insertBefore(d, wrap.firstChild);
    }
  }
  { const _mh = moveListHtml; moveListHtml = function (id) { const s = _mh(id), c = cw(id); if (!c || !CT[id]) return s;
    const head = `<li class="got" style="list-style:none"><b style="color:${c.pure ? '#FFE8B0' : '#E890B0'}">${esc(WEAPONS[id].name)} · ${c.pure ? 'PURIFIED' : 'CURSED LV ' + c.lvl + '/' + LVMAX}</b><br><em>${c.pure ? 'Purified: no price, no gift.' : `✕ ${DB[c.db].name}: ${DB[c.db].txt}. ✦ ${BF[c.bf].name}: ${BF[c.bf].txt}.`}</em></li>`;
    return s.replace('<ul class="moves">', '<ul class="moves">' + head + cwMovesHtml(id, c)); }; }
  { const _rh = refreshHud; refreshHud = function (full) { _rh(full); if (!full || !P) return; try { hudNote(); } catch (e) { console.error(e); } }; }
  function hudNote() {
    let el = document.getElementById('cwNote'); const c = held();
    if (!c) { if (el) el.hidden = true; return; }
    if (!el) { const after = document.getElementById('wname'); if (!after) return; el = document.createElement('div'); el.id = 'cwNote'; el.style.cssText = 'font:700 7.5px/1.2 sans-serif;letter-spacing:.06em;margin-top:1px;pointer-events:none;filter:drop-shadow(0 1px 1px #000);max-width:min(190px,40vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; after.after(el); }
    el.hidden = false; el.style.color = c.pure ? '#FFE8B0' : '#D8B0E8';
    el.textContent = c.pure ? 'PURIFIED' : `CURSED ${c.lvl}/${LVMAX} · ✕ ${DB[c.db].name.toUpperCase()} · ✦ ${BF[c.bf].name.toUpperCase()}`;
    const wl = document.getElementById('wlv'); if (wl) wl.textContent = c.pure ? 'PURE' : 'C' + c.lvl;
  }

  // ======================================================================================================
  // CONSOLE AND TESTS
  // ======================================================================================================
  window.CURSEDW = {
    IDS, NAMES, REF, CK, PURE_K, LV0, LVMAX, DB, BF, CT, cmList, lvlCost, pureCost,
    cw, CM, ratio, held, live: () => LS, isFin,
    give(id, lvl, db, bf) { if (!IDS.includes(id)) return null; const pure = lvl === 'pure' || lvl === 9; const c = setCw(id, pure ? LVMAX : lvl || LV0, db, bf, pure); save.weapon = id; if (P) { P.w = id; P.seq = ''; } persist(); if (P) refreshHud(true); return c; },
    take, drop: (id, x, y) => dropAt(id || pick(eligible().length ? eligible() : IDS), x ?? (P ? P.x + P.facing * 60 : 300), y ?? (P ? P.y : 300)),
    canOffer: (id) => NG() && IDS.includes(id) && canDrop(id) && !cw(id) && !LS.dropped[id] && !loot.some(k => k.kind === 'cweapon'),
    clear(id) { if (save.cw) { if (id) delete save.cw[id]; else save.cw = {}; } persist(); if (P) refreshHud(true); },
    eligible, migrate,
  };
})();
