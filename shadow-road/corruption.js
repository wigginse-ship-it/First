'use strict';
// ======================================================================================================
// NG+ CORRUPTION: "THE CURSE FOLLOWS HIM"
// ------------------------------------------------------------------------------------------------------
// Blind in Eric's dungeon, Corwin laid a curse on Amber; it took root in Lorraine first, as the Black Circle. In New
// Game+ (save.cycle >= 1), once Lorraine has been beaten in an earlier cycle (save.w8relic), it follows him across every shadow, feeds on how he fights and seeps into the Horn. There is no
// meter: it shows only as omens and changes in the world. The value is hidden in the save (save.curse); the dev panel
// alone shows it (a readout and sliders while a dev game is running, DEV.active).
//   THE CURSE      save.curse.v, 0..100. Fed by deaths (more with each death in the cycle), cruelty (blows on downed
//                  foes, on corpses, great overkill), massacres, kills by hazards, kills from behind, the villagers of
//                  Lorraine let die or left, the Horn's call, the Abyss in the Pearl and the Black Road. Eased by Pearl
//                  kills, clean worlds and waves, parries and perfect charges, restraint, the shrine rooms and every lord
//                  of a world brought down. A new cycle keeps a quarter of it (the residue). Five hidden tiers (TIERS).
//   THE HORN       save.curse.horn: rises each time the Horn of Lorraine is blown (always, at the start of each world,
//                  w8_late.js), faster as the curse deepens. The call goes flat and sour, the words out of its bell come
//                  reversed, then scrambled, then wrong; its verses can turn (a cursed form with a dark upside); at worst
//                  its call sends a pulse of the Black Circle over the place and corrupts it on the spot.
//   THE WORLD      omens by tier: grey at the edges, his cloak greying, the light guttering; colour drained to the
//                  Circle's greys and reds, corrupted foes, the Patterns flickering, stretches of a changed view (tilt,
//                  mirror, shadow-puppets, tears and rewinds, a tapestry, a close view); the Black Road across the floor;
//                  items turning; the Pearl blackening; the last world taken by the Circle, and its heart.
// Everything hooks in by wrapping (strike, hurtEnemy, killEnemy, playerDamage, spawnEnemy, updateEnemy, updatePlayer,
// updateWorld, startStage, enterZone, stageClear, gameOver, drawScene, drawBossRoom, mechList ...) and through hooks the
// other files offer (W8.hornNotes / hornWords / onHornBlow, W7.drawPattern, PEARLNG.O, SR_KINDS, HAZARD_FX).
// Console and tests: CURSE (see the end of the file).
// ======================================================================================================
(() => {
  // (the curse starts only once Lorraine has been beaten in an earlier cycle: New Game+ with the Horn of Lorraine in hand)
  const NG = () => typeof save !== 'undefined' && !!save && (save.cycle | 0) >= 1 && !!save.w8relic;
  const playing = () => typeof mode !== 'undefined' && mode === 'play' && !!P && !!stage;
  const cl01 = (k) => clamp(k, 0, 1), sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const now = () => performance.now() / 1000;
  const lite = () => typeof PAINT_LITE !== 'undefined' && (PAINT_LITE || PAINT_Q === 0);

  // ---------------- the numbers (never shown to the player) ----------------
  const TIERS = [10, 28, 50, 75]; // tier 1 Whispers, 2 Taint, 3 Blight, 4 Consumed
  const TIER_NAME = ['Untouched', 'Whispers', 'Taint', 'Blight', 'Consumed'];
  const HORN_ST = [12, 30, 50, 75]; // the Horn: flat, sour, wrong words and turning verses, the pulse
  const HIGH_END = 50; // reaching the last world at or past this, the Circle has taken it
  const RESIDUE = .25, HORN_KEEP = .6;
  const WT = { // what feeds it (+) and what eases it (-)
    death: 5, deathStep: 3, deathMax: 20, downHit: .5, corpse: .6, overkill: .35, massacre: 3, hazardKill: 1.2, backKill: .4,
    villLost: 2.5, villLeft: .6, hornBase: 1.5, hornTier: .75, abyss: 4, cloot: 1.5, roadPerSec: .3, roadMul: 1.5,
    pearlKill: -.5, cleanWorld: -5, cleanWave: -1.2, parry: -.8, perfect: -1, restraint: -.4, shrine: -22, boss: -2.5, villSaved: -.6,
  };
  const tierOf = (v) => v >= TIERS[3] ? 4 : v >= TIERS[2] ? 3 : v >= TIERS[1] ? 2 : v >= TIERS[0] ? 1 : 0;
  const hornStOf = (h) => h >= HORN_ST[3] ? 4 : h >= HORN_ST[2] ? 3 : h >= HORN_ST[1] ? 2 : h >= HORN_ST[0] ? 1 : 0;

  // ---------------- the save ----------------
  function CS() {
    let c = save.curse;
    if (!c || typeof c !== 'object') c = save.curse = { v: 0, horn: 0, cyc: save.cycle | 0, deaths: 0, fell: {}, abyssN: 0, wc: {}, residue: 0, endCyc: -1, endHigh: false, heartDone: false, ends: {} };
    if (!c.fell) c.fell = {}; if (!c.bfell) c.bfell = {}; if (!c.wc) c.wc = {}; if (!c.ends) c.ends = {};
    if (c.cyc !== (save.cycle | 0)) { if ((save.cycle | 0) > c.cyc) newCycle(c); c.cyc = save.cycle | 0; }
    return c;
  }
  function newCycle(c) { // most of it lifts as the road begins again; a residue stays with him
    c.v = Math.round(c.v * RESIDUE * 10) / 10; c.residue = c.v; c.horn = Math.round(c.horn * HORN_KEEP * 10) / 10;
    c.deaths = 0; c.fell = {}; c.bfell = {}; c.endCyc = -1; c.endHigh = false; c.heartDone = false;
  }
  const V = () => NG() ? CS().v : 0;
  const tier = () => NG() ? tierOf(CS().v) : 0;
  const hornV = () => NG() ? CS().horn : 0;
  const hornSt = () => NG() ? Math.max(hornStOf(CS().horn), tier() >= 4 ? 4 : 0) : 0; // (Consumed: the Horn is turned)
  // the live state of a world (not saved)
  let L = freshL();
  function freshL() { return { kills: [], waveHit: false, cv: {}, spike: false, pulse: null, road: null, burns: [], mimics: [], cloot: [], fx: null, fxNext: 14, rec: [], recT: 0,
    heart: null, roadT: 4, itemDone: false, flick: 0, flickT: 2, rate: {}, lastWave: 0, villSaved: 0, cBurn: 0, cBurnT: 0, drumLast: 0, stdT: 0, coda: null, log: [],
    wisps: [], shade: null, ripT: 0, carSaid: false, cStat: { hops: 0, broke: 0, burnt: 0, risen: 0, shades: 0, sank: 0, last: null } }; }
  const LOG = [];
  const note = (why, d) => { LOG.push({ why, d: Math.round(d * 100) / 100, v: Math.round(CS().v * 10) / 10, t: Math.round(now() * 10) / 10 }); if (LOG.length > 80) LOG.shift(); tick(why, d); };
  // the live ticker under the curse meter: like reasons within 2s are summed into one line
  const TICK = [];
  function tick(why, d) { const t = performance.now() / 1000, base = String(why || '?').replace(/ \(\d+ this cycle\)$/, ''), last = TICK.find(x => x.base === base && x.sgn === Math.sign(d) && t - x.t < 2);
    if (last) { last.d += d; last.n++; last.t = t; last.why = why; } else { TICK.unshift({ base, why, d, n: 1, t, t0: t, sgn: Math.sign(d) }); if (TICK.length > 12) TICK.pop(); } }
  const rl = (k, gap) => { const t = now(); if ((L.rate[k] || 0) > t) return false; L.rate[k] = t + gap; return true; };
  const onRoad = () => !!(L.road && P && roadHas(P.x) && Math.abs(P.y - L.road.y) < L.road.h && P.z < 30);
  const cursedGirdle = () => !!(save.gear && save.gear.eq && save.gear.eq.waist && save.gear.eq.waist.curse);
  function feed(amt, why) {
    if (!NG() || !(amt > 0)) return 0;
    const c = CS(), d = amt * (onRoad() ? WT.roadMul : 1) * (cursedGirdle() ? 1.25 : 1), t0 = tierOf(c.v);
    c.v = clamp(c.v + d, 0, 100); note(why, d); if (tierOf(c.v) !== t0) onTier(t0, tierOf(c.v)); return d;
  }
  function ease(amt, why) {
    if (!NG() || !(amt > 0)) return 0;
    const c = CS(), t0 = tierOf(c.v); c.v = clamp(c.v - amt, 0, 100); note(why, -amt); if (tierOf(c.v) !== t0) onTier(t0, tierOf(c.v)); return amt;
  }
  function onTier(a, b) { if (b > a && b >= 2 && playing()) { sfx('growl'); shakeMag = Math.max(shakeMag, 3); L.flick = .5; } }
  let persistT = 0; // (the save is written now and then, not on every blow)
  const keep = () => { if (now() > persistT) { persistT = now() + 2; persist(); } };

  // ======================================================================================================
  // 1. WHAT FEEDS IT AND WHAT EASES IT
  // ======================================================================================================
  const mine = (m) => !!m && !m.trump && !m.thorns && !m.cEnv && !m.w8v;
  const body = (m) => mine(m) && !m.pearl && !m.arrow && !m.el;
  let CTX = null; // the blow being struck right now (for the kill it may make)

  // ---------------- every blow ----------------
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    if (!NG() || !e || e.dead || !m) return _strike(e, base, dir, m, echo);
    const own = mine(m), c = CS();
    if (own) {
      if (e.state === 'down' && !e.boss) { e.cDownHit = true; if (rl('down' + (e.cid || (e.cid = Math.random())), .5)) feed(WT.downHit, 'cruelty: a downed foe'); }
      if (onRoad()) base *= 1.3;
      const wc = c.wc[P.w];
      if (wc === 'drain' && body(m)) base *= 1.45;
      if (eqCurse('gauntlets') && body(m)) base *= 1.25;
      base *= verseMul(e, m);
    }
    const prev = CTX; CTX = { m, own, behind: own && body(m) && (P.x - e.x) * e.facing < 0, e };
    const hp0 = e.hp;
    let r; try { r = _strike(e, base, dir, m, echo); } finally { CTX = prev; }
    if (own && e.hp < hp0) {
      if (c.wc[P.w] === 'drain' && body(m) && P.hp > 1) { P.cDrain = (P.cDrain || 0) + .8; if (P.cDrain >= 1) { const d = Math.floor(P.cDrain); P.cDrain -= d; P.hp = Math.max(1, P.hp - d); } }
      if (e.cursed && e.cTrait === 'mimic' && !e.dead && body(m) && !L.mimics.some(q => q.e === e) && rl('mim' + e.cid, 1.2)) L.mimics.push({ e, pose: playerPose(), m: P.move || m, t: 0 });
    }
    return r;
  };
  // ---------------- great overkill ----------------
  const _he = hurtEnemy;
  hurtEnemy = function (e, dmg, dir, m, crit) {
    if (NG() && CTX && CTX.own && !pureHand() && !(m && m.perfect) && !e.boss && e.hp > 0 && dmg > Math.max(1, e.hp) * 3 && dmg - e.hp > 30 && rl('ovk', .4)) feed(WT.overkill, 'cruelty: overkill'); // (a purified blade is never cruel)
    const hp0 = e.hp, r = _he(e, dmg, dir, m, crit);
    if (NG() && m && m.perfect && !m.trump && e.hp < hp0 && ((CTX && CTX.own) || m.pearl || m.arrow)) perfectPurge(m.arrow ? 'a perfect draw lands' : m.pearl ? 'a perfect throw lands' : 'a perfect charge lands');
    return r;
  };
  // ---------------- every kill ----------------
  const pureHand = () => !!(P && save && save.cw && save.cw[P.w] && save.cw[P.w].pure); // (a purified weapon in hand: cursedw.js)
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    const was = e.dead; const r = _kill(e, dir, m);
    if (!NG() || was || !e.dead) return r;
    m = m || {};
    const t = now(); L.kills.push(t); L.kills = L.kills.filter(k => t - k < 2);
    const pureBlow = !!m.perfect && !m.trump; // a perfect charged blow (any weapon, a perfect bow release too) is never cruel, and it cleanses as a purified blade does
    if (L.kills.length >= 5) { L.kills = []; if (!pureHand() && !pureBlow) feed(WT.massacre, 'massacre'); }
    if (pureBlow && !pureHand()) { const k = e.boss ? 3 : e.cursed ? 1 : (e.elite || e.champ) ? .8 : .35, d = ease(k, 'a perfect blow cleanses');
      if (d > 0 && playing()) { fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .5, max: .5, r: 60 + Math.min(1.6, (e.hh || 60) / 60) * 50, col: '#FFE9A8', flat: 1 });
        for (let i = 0; i < 6 && parts.length < 420; i++) parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y, z: rand(6, (e.hh || 60) * .9), vx: rand(-20, 20), vy: 0, vz: rand(50, 120), life: .7, max: .7, col: pick(['#FFF4C8', '#FFE08A', '#FFFFFF']), size: rand(1.4, 2.4), shape: 'star', rot: 0, vr: 4 });
        if (e.cursed || e.boss || rl('pureTxt', 6)) floatText(e.x, e.y, (e.hh || 60) + 34, e.cursed || e.boss ? 'THE CURSE IS DRAWN OUT' : 'THE CURSE EASES', '#FFE9A8', 12); } }
    if (m.pearl && !m.trump) ease(-WT.pearlKill, 'a Pearl kill');
    const ctx0 = CTX && CTX.e === e ? CTX : null;
    if (ctx0 && ctx0.behind && !pureHand() && !pureBlow) feed(WT.backKill, e.w7turn > 0 ? 'a kill from behind (the glass turned it)' : 'a kill from behind');
    // thrown into a hazard: the death came from the place, not from him, moments after he sent it flying
    if (!mine(m) && m.trump && !(e.burn > 0) && e.cHitT && t - e.cHitT < 2.5 && !trumpBusy()) feed(WT.hazardKill, 'a kill by a hazard');
    if (e.boss) ease(-WT.boss, 'a lord of a world falls');
    if (e.cursed && !e.boss) cursedDeath(e, m);
    keep();
    return r;
  };
  const trumpBusy = () => (stags && stags.length) || phoenixT > 0 || (L.trumpAt && now() - L.trumpAt < 1.5);
  { const _pt = playTrump; playTrump = function () { L.trumpAt = now(); return _pt(); }; }
  // a blow of his own marks a foe for a moment (a fall into a hazard soon after counts against him)
  { const _h2 = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) { if (NG() && CTX && CTX.own) e.cHitT = now(); return _h2(e, dmg, dir, m, crit); }; }

  // ---------------- blows on him ----------------
  const _pd = playerDamage;
  playerDamage = function (dmg, fromX, big) {
    if (!NG() || !P) return _pd(dmg, fromX, big);
    const src = typeof HIT_SRC !== 'undefined' ? HIT_SRC : null;
    if (L.cv.charge && src && src.e && !src.e.cFirstOnP) { src.e.cFirstOnP = true; dmg *= 2; }
    if (L.cv.hunt && P.hp < maxHp() / 3) dmg *= 1.3;
    if (eqCurse('gauntlets')) dmg *= 1.2;
    const h0 = P.hp, st0 = P.state, r = _pd(Math.round(dmg), fromX, big);
    if (P.hp < h0) { L.waveHit = true; if (L.heart && !L.heart.done) L.heart.prog = Math.max(L.heart.start, L.heart.prog - .015); }
    return r;
  };
  // ---------------- a death ----------------
  const _go = gameOver;
  gameOver = function () {
    if (NG()) { const c = CS(); feed(Math.min(WT.deathMax, WT.death + WT.deathStep * c.deaths), 'a death (' + (c.deaths + 1) + ' this cycle)'); c.deaths++; c.fell[stageIdx] = 1; persist(); }
    return _go();
  };
  // ---------------- discipline ----------------
  { const _rp = riposte; riposte = function (fromX) { if (NG() && rl('parry', .3)) ease(-WT.parry, 'a perfect parry'); if (NG()) L.ripT = now() + 1; return _rp(fromX); }; }
  function perfectPurge(why) { if (!NG() || !rl('perf', .3)) return; const d = ease(-WT.perfect, why); if (d > 0 && P && playing()) { fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .45, max: .45, r: 70, col: '#FFE9A8', flat: 1 }); if (rl('perfTxt', 4)) floatText(P.x, P.y, 120, 'THE CURSE EASES', '#FFE9A8', 11); } } // (a perfect release that lands draws a little of the curse out; a whiff does nothing)
  window.__perfectPurge = perfectPurge;
  // a perfect release purifies only when it lands: see the hurtEnemy wrapper
  { const _pc = perfectCue; perfectCue = function () { return _pc.apply(this, arguments); }; }
  // ---------------- restraint: a downed foe let up unhit ----------------
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) {
    if (!NG()) return _ue(e, dt);
    const s0 = e.state; const r = _ue(e, dt);
    if (e.state === 'down' && s0 !== 'down') { e.cDownHit = false; e.cDownT = 0; }
    else if (e.state === 'down') e.cDownT = (e.cDownT || 0) + dt;
    else if (s0 === 'down' && !e.dead && !e.boss && !e.cDownHit && (e.cDownT || 0) > .3 && P && Math.abs(P.x - e.x) < 220 && rl('restraint', 2)) ease(-WT.restraint, 'restraint');
    if (!e.dead) enemyCurse(e, dt);
    return r;
  };
  // ---------------- the stage, the place, the clear ----------------
  const _ss = startStage;
  startStage = function (i) {
    const r = _ss(i);
    L = freshL();
    if (NG()) { const c = CS(); abyssCheck();
      if (isFinal(i) && c.endCyc !== (save.cycle | 0)) { c.endCyc = save.cycle | 0; c.endHigh = c.v >= HIGH_END; c.heartDone = false; persist(); } }
    return r;
  };
  const _ez = enterZone;
  enterZone = function (z, Zs) {
    const r = _ez(z, Zs);
    if (!NG()) return r;
    L.mimics = []; L.cloot = []; L.burns = []; L.wisps = []; L.shade = null; L.fx = null; L.fxNext = rand(10, 18); L.rec = []; L.itemDone = false; L.kills = []; L.roadT = rand(5, 9);
    L.road = null;
    if (!(Zs && Zs.cHeart) && !(stage && stage.secret) && teff() >= 3) makeRoad();
    if (teff() >= 3 && !(stage && stage.secret)) maybeCorruptItem(false);
    return r;
  };
  const _sc = stageClear;
  stageClear = function () {
    if (!NG() || !stage) return _sc();
    const c = CS();
    if (isFinal(stageIdx) && finalHigh() && !c.heartDone && !(L.heart && L.heart.done) && mode === 'play') { startHeart(); return; }
    if (!c.fell[stageIdx] && !L.cleanPaid) { L.cleanPaid = true; ease(-WT.cleanWorld, 'a world walked without falling'); }
    persist();
    return _sc();
  };
  // ---------------- the world each frame ----------------
  const _uw = updateWorld;
  updateWorld = function (dt) {
    if (!NG() || !P || !stage) return _uw(dt);
    const wi = waveIdx, wa = waveActive;
    const r = _uw(dt);
    if (!wa && waveActive) L.waveHit = false;
    if (waveIdx > wi && !L.waveHit && !stage.bossRoom) ease(-WT.cleanWave, 'a wave cleared unhit');
    if (!(window.W8 && W8.cine && W8.cine())) { try { worldStep(dt); } catch (err) { console.error(err); } } // (the fight waits on the Horn's call, and so does the curse)
    return r;
  };
  function worldStep(dt) {
    const c = CS();
    if (onRoad()) feed(WT.roadPerSec * dt / WT.roadMul, 'standing on the Black Road');
    corpseHits(); villagers(); mimicStep(dt); clootStep(dt); verseStep(dt); patternStep(dt); roadStep(dt); pearlStep(dt); weaponStep(dt); heartStep(dt); fxSchedule(dt); carrierStep(dt);
    if (boss && boss.cB && !boss.dead && enemies.includes(boss)) bossStep(boss, dt);
    if ((L.abT = (L.abT || 0) - dt) <= 0) { L.abT = 1; abyssCheck(); }
    if (P.cBurn > 0) burnHim(dt);
    L.recT -= dt; if (L.recT <= 0) { L.recT = .05; L.rec.push({ x: P.x, y: P.y, z: P.z, f: P.facing, pose: Object.assign({}, playerPose()) }); if (L.rec.length > 24) L.rec.shift(); }
    keep();
  }
  // ---------------- cruelty: blows on the fallen ----------------
  function corpseHits() {
    if (!P.move || (P.state !== 'atk' && P.state !== 'air')) return;
    const m = P.move, k = P.t / (m.dur || 1); if (!m.h || k < m.h[0] || k > m.h[1]) return;
    for (const co of corpses) {
      if (co.boss || co.cHitMove === P.moveId || (co.cHits || 0) >= 3) continue;
      if (!inReach(m, co.x, co.y, 0, co.hw || 14, 24)) continue;
      co.cHitMove = P.moveId; co.cHits = (co.cHits || 0) + 1;
      // (striking a corpse no longer feeds the curse: the body still flinches)
      burst(co.x, co.y, 8, ['#2A2028', '#5A4A50', '#8A2A30'], 7, 'flesh', P.facing); sfx('hit-flesh', .2); co.sqx = 1.15; co.sqy = .9;
    }
  }
  // ---------------- Lorraine's villagers ----------------
  function villagers() {
    if (!mech || mech.kind !== 'w8flight' || !mech.vs || !window.W8 || !W8.vill) return;
    for (const v of mech.vs) {
      if (v.state === 'dead' && !v.cDead) { v.cDead = 1; feed(WT.villLost, 'a villager of Lorraine lost'); }
      if (v.hurtT > .55 && !v.cHurtNoted) { v.cHurtNoted = 1; if (Math.abs(P.x - v.x) > 240) feed(WT.villLeft, 'a villager left to the Circle'); }
      if (v.hurtT <= 0) v.cHurtNoted = 0;
    }
    const s = W8.vill.saved || 0; if (s > L.villSaved) { ease(-WT.villSaved * (s - L.villSaved), 'a villager saved'); } L.villSaved = s;
  }
  // ---------------- the Abyss in the Pearl ----------------
  function abyssCheck() {
    if (!NG() || !window.PEARLNG) return;
    const c = CS(), TR = PEARLNG.TR || {}, src = save.pearlForge && save.owned && save.owned.pearlw ? save.pearlForge.picks : save.pearlEvo && save.pearlEvo.picks;
    const n = Array.isArray(src) ? src.filter(id => TR[id] && TR[id].tag === 'abyss').length : 0;
    if (n > (c.abyssN || 0)) feed(WT.abyss * (n - (c.abyssN || 0)), 'the Abyss taken into the Pearl');
    c.abyssN = n;
  }

  // ======================================================================================================
  // 2. THE HORN OF LORRAINE CORRUPTS AS IT IS BLOWN (hooks offered by w8_late.js)
  // ======================================================================================================
  const CURSED_VERSE = {
    charge:    { name: 'The Charge, Turned', line: 'First blows land with double weight. So do theirs, on you.' },
    banner:    { name: 'The Bloody Banner', line: 'The gold wave runs both ways, harder. It is paid for in your blood.' },
    iron:      { name: 'Iron Breaks', line: 'The cracks run long and deep, and one opens under you.' },
    drum:      { name: 'The Death-Drum', line: 'Each beat strikes harder. When the drum falls silent, it beats on you.' },
    hunt:      { name: 'The Hunted', line: 'The wounded die faster. Wounded, so do you.' },
    dead:      { name: 'Lorraine\'s Dead, Unquiet', line: 'Sometimes the rider comes for you. Let it pass, and it rides back through them.' },
    watchfire: { name: 'The Black Watchfire', line: 'The fires burn hotter, and they reach for you.' },
    standard:  { name: 'The Black Standard', line: 'It rises sooner and strikes harder, but under it you bleed.' },
  };
  const WRONG = [['I', 'Curse', 'Amber'], ['Eric\'s', 'Blood', 'On', 'Stone'], ['The', 'Circle', 'Is', 'Hungry'], ['Blind', 'In', 'The', 'Dark'], ['Let', 'It', 'Spread'], ['The', 'Road', 'Is', 'Black'], ['No', 'Song', 'At', 'All']];
  const scramble = (w, seed) => { const a = w.split(''); const r = mulberry(seed | 0); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } const s = a.join(''); return s === w && w.length > 2 ? w.slice(1) + w[0] : s; };
  function hornWords(ws, id) {
    const st = hornSt(); if (!st) return null;
    const seed = Math.floor(hornV() * 7) + (save.cycle | 0) * 31;
    if (st === 1) return ws.slice().reverse().map(w => w.split('').reverse().join('')); // mirror-writing: the song read backward
    if (st === 2) return ws.map((w, i) => scramble(w, seed + i * 13));
    return WRONG[(seed + (id ? id.length : 0)) % WRONG.length].slice(); // (and at worst, the words are not the song at all)
  }
  function hornNotes(base, short, id) {
    const st = hornSt(); if (!st) return null;
    const flat = [1, .965, .94, .91, .88][st], out = base.map(n => [n[0] * (st >= 3 ? .985 : 1), n[1], n[2], flat]);
    if (st >= 2) { const last = base[base.length - 1], end = last[1] + last[2]; out.push([base[0][0] * 1.06, end * .55, Math.min(.5, end * .4), .9]); } // the sour note: a semitone off the call's own root
    if (st >= 4) out.push([base[0][0] * .5 * 1.414, 0, (base[base.length - 1][1] + base[base.length - 1][2]) * .9, .8]); // and a low tritone groaning under it all
    return out;
  }
  function onHornBlow(c) {
    if (!NG()) return;
    const cs = CS(), t = tier();
    cs.horn = clamp(cs.horn + 3 + 2.5 * t, 0, 100);
    feed(WT.hornBase + WT.hornTier * t, 'the Horn of Lorraine blown');
    const st = hornSt(); L.cv = {};
    if (st >= 3) { const p = st >= 4 ? .65 : .35; for (const id of c.v || []) if (Math.random() < p) L.cv[id] = true; }
    if (st >= 4) { L.pulse = { t: 0, x: P.x, y: P.y }; L.spike = true; shakeMag = Math.max(shakeMag, 8); sfx('roar'); if (!L.road) makeRoad(); }
    try { cursePanel(st); } catch (e) {}
    persist();
  }
  function cursePanel(st) { // the scroll the horn's call shows: greyer, and the turned verses written over
    const el = document.getElementById('w8hornCall'); if (!el || !st) return;
    el.style.filter = `grayscale(${[0, .25, .45, .65, .85][st]}) contrast(${1 + .05 * st})`;
    const v = window.W8 && W8.cine && W8.cine() ? W8.cine().v || [] : [];
    const grid = el.children[1], rows = grid ? [...grid.children] : [];
    v.forEach((id, i) => { const row = rows[i], tx = row && row.lastElementChild; if (!L.cv[id] || !tx) return; const C = CURSED_VERSE[id];
      tx.innerHTML = `<b style="font-family:Cinzel,Georgia,serif;color:#2A0606">${C.name}</b> <span style="color:#6A1010">${C.line}</span>`;
      row.style.background = 'linear-gradient(90deg,rgba(40,8,8,.2),rgba(40,8,8,0))'; });
  }
  if (window.W8) { W8.hornWords = (ws, id) => NG() ? hornWords(ws, id) : null; W8.hornNotes = (b, s, id) => NG() ? hornNotes(b, s, id) : null; W8.onHornBlow = (c) => { try { onHornBlow(c); } catch (e) { console.error(e); } }; }
  // ---------------- the turned verses at work ----------------
  const hasV = (id) => !!(L.cv[id] && window.W8 && W8.hasVerse && W8.hasVerse(id));
  function verseMul(e, m) {
    if (!window.W8 || !W8.hasVerse || !Object.keys(L.cv).length || m.w8v) return 1;
    let k = 1;
    if (hasV('charge') && !e.w8struck) k *= 1.6;
    if (hasV('drum') && W8.S && W8.S.drum > 0) k *= 1 + .06 * W8.S.drum;
    if (hasV('hunt') && e.hp < e.maxHp / 3) k *= 1.35;
    if (hasV('standard') && P.hp < maxHp() * .6) k *= 1.3;
    return k;
  }
  function verseStep(dt) {
    if (!window.W8 || !W8.S || !Object.keys(L.cv).length) return;
    const S = W8.S;
    if (hasV('banner')) for (const w of S.waves) if (!w.cSeen) { w.cSeen = 1; if (w.cTwin) continue; w.dmg = Math.round(w.dmg * 1.5); S.waves.push(Object.assign({}, w, { f: -w.f, x: P.x - w.f * 16, dist: 0, hit: new Set(), cSeen: 1, cTwin: 1 })); bleed(.03, 'BANNER'); }
    if (hasV('iron')) for (const k of S.cracks) if (!k.cSeen) { k.cSeen = 1; k.dmg = Math.round(k.dmg * 1.5); k.len *= 1.3; hazards.push({ kind: 'cpit', x: P.x, y: P.y, r: 30, t: .75, max: .75, dmg: Math.round(maxHp() * .07) }); }
    if (hasV('drum')) { if (L.drumLast >= 3 && S.drum === 0) { const d = Math.max(1, Math.round(maxHp() * .02 * L.drumLast)); hitHim(d, 'THE DRUM'); } L.drumLast = S.drum; }
    if (hasV('standard') && P.hp < maxHp() * .4 && P.hp > 1) { L.stdT -= dt; if (L.stdT <= 0) { L.stdT = 1.2; P.hp = Math.max(1, P.hp - Math.max(1, Math.round(maxHp() * .01))); burst(P.x, P.y, 30, ['#3A1010', '#8A2020'], 3, 'flesh'); } }
    if (hasV('watchfire')) { for (const e of enemies) { if (e.dead) continue; if (e.w8fire && e.burn > 0 && !e.cWf) { e.cWf = 1; e.burnBase *= 1.5; }
      if (e.w8fire && e.burn > 0 && Math.abs(e.x - P.x) < 30 + e.hw * .5 && Math.abs(e.y - P.y) < 18 && P.z < 24) P.cBurn = Math.max(P.cBurn || 0, 1.6); } }
    if (hasV('dead')) for (const r of S.riders) {
      if (!r.cSeen) { r.cSeen = 1; if (Math.random() < .5) { r.cAtP = true; r.y = P.y; banner('LORRAINE\'S DEAD', 'THE RIDER HAS COME FOR YOU', 1.2); } }
      if (r.cAtP && !r.cDone && Math.abs(r.x - P.x) < 28 && Math.abs(r.y - P.y) < 22) {
        r.cDone = true;
        if (P.inv > 0 || P.state === 'dodge' || P.z > 34) { r.f = -r.f; r.hit = new Set(); r.t = 0; r.cBack = true; floatText(P.x, P.y, 96, 'IT RIDES BACK THROUGH THEM', '#C8D4EA', 12); sfx('roar'); }
        else hitHim(Math.round(maxHp() * .14), null, r.x);
      }
      if (r.cBack) { r.cHit = r.cHit || new Set(); for (const o of r.hit) if (!r.cHit.has(o)) { r.cHit.add(o); if (!o.dead) { const d = o.boss ? Math.round(o.maxHp * .03) : Math.round(o.maxHp * .6); strike(o, d, r.f, { dmg: d, kb: 380, launch: 300, power: 2, w8v: 1 }); } } }
    }
  }
  function hitHim(d, word, fromX) { if (!P || P.state === 'dead') return; if (word) floatText(P.x, P.y, 100, word, '#8A2020', 12); playerDamage(d, fromX ?? P.x - P.facing, false); }
  function bleed(k, word) { if (!P || P.hp <= 1) return; P.hp = Math.max(1, P.hp - Math.max(1, Math.round(maxHp() * k))); floatText(P.x, P.y, 92, word, '#8A2020', 11); burst(P.x, P.y, 40, ['#5A1010', '#A02020', '#2A0808'], 8, 'flesh'); }
  function burnHim(dt) {
    P.cBurn -= dt; L.cBurnT -= dt;
    if (Math.random() < .7) parts.push({ x: P.x + rand(-10, 10), y: P.y, z: rand(5, 60), vx: rand(-10, 10), vy: 0, vz: rand(60, 110), life: .45, max: .45, col: pick(['#3A1A10', '#A03A1A', '#FF8A3A']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 });
    if (L.cBurnT <= 0) { L.cBurnT = .5; const d = Math.max(1, Math.round(maxHp() * .025)); if (P.hp - d <= 0) playerDamage(d, P.x, false); else { P.hp -= d; floatText(P.x, P.y, 70, '-' + d, '#FF8A4A', 12); } }
  }
  HAZARD_FX.cpit = { // the ground breaking under him (the iron verse turned)
    update(h) { if (h.t <= 0 && !h.done) { h.done = true; if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r + 6 && P.z < 20) playerDamage(h.dmg, h.x, true);
      burst(h.x, h.y, 4, ['#2A2420', '#5A5048', '#8A2020'], 16, 'rock', 0, true); shakeMag = Math.max(shakeMag, 6); sfx('crunch'); } },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max, a = h.done ? Math.max(0, 1 + h.t / .4) : 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = `rgba(30,10,10,${.6 + .3 * Math.sin(t * 30)})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .32); ctx.stroke();
      ctx.fillStyle = `rgba(20,6,6,${.25 + .45 * k})`; ell(h.x, h.y, h.r * k, h.r * .32 * k); ctx.fill();
      ctx.strokeStyle = 'rgba(160,30,30,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a2 = i / 6 * TAU + hsh(h.x + i) * .5; ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(a2) * h.r * k, h.y + Math.sin(a2) * h.r * .32 * k); } ctx.stroke(); ctx.restore(); } };

  // ======================================================================================================
  // 3. THE WORLD: OMENS, SHIFTS OF THE VIEW, CORRUPTED FOES
  // ======================================================================================================
  const finalHigh = () => NG() && typeof stageIdx !== 'undefined' && isFinal(stageIdx) && CS().endCyc === (save.cycle | 0) && !!CS().endHigh;
  function teff() { if (!NG()) return 0; let t = tier(); if (L.spike) t = 4; if (finalHigh()) t = Math.max(t, 3); return t; }
  // ---------------- his cloak greys ----------------
  { const _hl = heroLook; heroLook = function () { const Lk = _hl(); const t = NG() ? teff() : 0; if (t >= 1) { const k = [0, .3, .45, .58, .7][t];
    for (const key of ['cloak', 'cloakSlate', 'cloakGrey', 'cloakLt']) if (Lk[key]) Lk[key] = awMixSafe(Lk[key], key === 'cloak' ? '#5A5660' : '#8A8690', k); } return Lk; }; }
  function awMixSafe(a, b, k) { try { const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); } catch (e) { return a; } }
  // ---------------- corrupted foes (how they look: cursed_foes.js; an elite is marked by another world's lord, MASKS:
  // its colours and the blow it borrows) ----------------
  const MASKS = { mossback: { col: '#5E7A3A', dk: '#2A3A18', atk: 'spike' }, colossus: { col: '#B88A48', dk: '#5A3A18', atk: 'ring' }, wyrm: { col: '#9FD8E0', dk: '#3A4A8A', atk: 'beam' },
    tyiga: { col: '#B880C0', dk: '#4A2050', atk: 'fall' }, sleeper: { col: '#E8E0D0', dk: '#6A6058', atk: 'ring' }, benedict: { col: '#C8D4EA', dk: '#4A566E', atk: 'beam' },
    w7king: { col: '#BFE8E8', dk: '#2A5A6A', atk: 'spike' }, w8goat: { col: '#3A3034', dk: '#0A0808', atk: 'cring' } };
  const _se = spawnEnemy;
  spawnEnemy = function (type, side, isBoss) {
    const e = _se(type, side, isBoss);
    if (!NG() || !e || e.boss) { if (e && e.boss && NG()) { try { bossInit(e); } catch (err) { console.error(err); } } return e; }
    const t = teff(), p = [.08, .12, .18, .26, .36][t] * (finalHigh() ? 1.5 : 1); // (from the first step of a cursed run: more of them as the curse deepens)
    if (!(stage && stage.secret && !L.heart) && !e.cNoCurse && Math.random() < p) curseFoe(e);
    return e;
  };
  function curseFoe(e, trait) {
    if (e.cursed) { if (trait) { e.cTrait = trait; if (trait === 'carrier') { e.cMask = null; carrierInit(e); } } return; }
    e.cursed = true; e.cid = e.cid || Math.random();
    e.cTrait = trait || (e.elite ? 'mask' : pick(carrierOK() ? ['mimic', 'split', 'loot', 'carrier', 'mimic', 'split', 'carrier'] : ['mimic', 'split', 'loot', 'mimic', 'split']));
    if (e.cTrait === 'mask') { const own = stage && STAGES[stageIdx] ? STAGES[stageIdx].boss : '', ids = Object.keys(MASKS).filter(k => k !== own && BOSSES[k]); e.cMask = pick(ids); e.cAtkT = rand(3, 5);
      if (playing()) floatText(e.x, e.y, e.hh + 40, 'MARKED BY ' + BOSSES[e.cMask].name.toUpperCase(), '#C8C2CC', 12); }
    e.hp = e.maxHp = Math.round(e.maxHp * 1.15);
    if (e.cTrait === 'carrier') carrierInit(e);
  }
  function cursedDeath(e, m) {
    if (e.cTrait === 'carrier') { try { carrierDeath(e, m); } catch (err) { console.error(err); } return; }
    if (e.cTrait === 'split' && !e.cChild) { for (const s of [-1, 1]) { const c = spawnEnemy(e.type, s, false); if (!c) continue; c.cNoCurse = 1;
        c.x = clamp(e.x + s * 26, camX + 30, camX + VW - 30); c.y = clamp(e.y + rand(-10, 10), FLOOR_TOP + 8, FLOOR_BOT); c.cursed = true; c.cTrait = 'none'; c.cChild = 1; c.cid = Math.random();
        c.hp = c.maxHp = Math.max(1, Math.round(c.maxHp * .35)); c.state = 'idle'; c.cd = rand(.8, 1.4); c.vz = 160; c.z = 1; c.vx = s * 90; c.air = true; c.dropWeapon = null; }
      floatText(e.x, e.y, e.hh + 20, 'IT SPLITS IN TWO', '#C8C2CC', 13); waveActive = true; if (lockX === null) lockX = clamp(camX, 0, stage.len - VW); }
    if (e.cTrait === 'loot' || (e.cTrait === 'mask' && Math.random() < .5)) L.cloot.push({ x: e.x, y: e.y, z: 20, vz: 200, t: 0 });
  }
  function enemyCurse(e, dt) {
    if (!e.cursed) return;
    if (e.cRoad && L.road && Math.abs(e.x - P.x) > 110) e.y += (L.road.y - e.y) * Math.min(1, dt * 8); // (a thing of the road keeps to it until it is on him)
    if (e.boss) return; // (a corrupted lord is stepped from worldStep: some fights' own rules never pass it down this far)
    if (e.cTrait === 'carrier') { try { carrierFoe(e, dt); } catch (err) { console.error(err); } }
    if (e.cTrait === 'mask' && ['idle', 'walk', 'recover'].includes(e.state) && Math.abs(e.x - P.x) < 300) { e.cAtkT -= dt; if (e.cAtkT <= 0) { e.cAtkT = rand(5.5, 8.5); e.cFireT = now(); borrowed(e, MASKS[e.cMask].atk); } } // (cFireT: when it struck, for its growths' flare)
  }
  function borrowed(e, k) { // one of another lord's attacks, borrowed by an elite that lord has marked (its growths: cursed_foes.js)
    const dmg = Math.max(4, Math.round(e.dmg * .9)), col = '150,140,160';
    if (k === 'ring') { hazards.push({ kind: 'ring', x: e.x, y: e.y, r: 0, speed: 230, delay: .6, dmg, t: 99 }); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .6, max: .6, r: 40, col: '#8A8090', flat: 1 }); }
    else if (k === 'beam') hazards.push({ kind: 'beam', y: clamp(P.y, FLOOR_TOP + 10, FLOOR_BOT - 4), t: 1.2, max: 1.2, dmg, col: '160,120,200' });
    else if (k === 'fall') for (let i = 0; i < 3; i++) { const t = .95 + i * .2; hazards.push({ kind: 'fall', x: P.x + rand(-50, 50), y: clamp(P.y + rand(-16, 16), FLOOR_TOP + 8, FLOOR_BOT), r: 24, t, max: t, dmg, col }); }
    else if (k === 'spike') { const d = Math.sign(P.x - e.x) || 1; for (let i = 0; i < 5; i++) { const t = .7 + i * .09; hazards.push({ kind: 'spike', x: e.x + d * (40 + i * 34), y: clamp(e.y + (P.y - e.y) * (i + 1) / 5, FLOOR_TOP + 8, FLOOR_BOT), r: 18, t, max: t, dmg, col: '90,80,96' }); } }
    else if (k === 'cring') hazards.push({ kind: 'cring', x: e.x, y: e.y, r: 0, speed: 220, delay: .6, dmg, t: 99 });
    sfx('growl'); e.sqx = 1.15; e.sqy = .9;
  }
  HAZARD_FX.cring = { // a ring of the Black Circle rolling out over the floor: jump it
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; return; } h.r += h.speed * dt; const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2);
      if (!h.hit && Math.abs(d - h.r) < 14 && P.z < 10 && P.state !== 'dead') { h.hit = true; playerDamage(h.dmg, h.x, true); } if (h.r > 560) h.t = -1; },
    draw(h, t) { if (h.delay > 0) { ctx.save(); ctx.strokeStyle = `rgba(20,10,14,${.4 + .4 * Math.sin(t * 30)})`; ctx.lineWidth = 3; ell(h.x, h.y, 26, 8); ctx.stroke(); ctx.restore(); return; }
      ctx.save(); ctx.strokeStyle = 'rgba(8,4,8,.85)'; ctx.lineWidth = 9; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke();
      ctx.strokeStyle = `rgba(170,30,40,${.6 + .3 * Math.sin(t * 12)})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke(); ctx.restore(); } };
  HAZARD_FX.cgrasp = { // the Circle's hands, up out of the floor where he stands
    update(h) { if (h.t <= 0 && !h.done) { h.done = true; if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r + 6 && P.z < 26) playerDamage(h.dmg, h.x, true); sfx('crunch'); burst(h.x, h.y, 6, ['#1A1014', '#4A3A44', '#8A2030'], 14, 'rock', 0, true); } },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max;
      if (!h.done) { ctx.save(); ctx.fillStyle = `rgba(10,6,10,${.2 + .5 * k})`; ell(h.x, h.y, h.r * (.4 + .6 * k), h.r * .3 * (.4 + .6 * k)); ctx.fill(); ctx.strokeStyle = 'rgba(150,30,40,.7)'; ctx.lineWidth = 1.5; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke(); ctx.restore(); return; }
      const a = Math.max(0, 1 + h.t / .45); if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0C080C'; ctx.strokeStyle = '#3A2A34'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) { const x = h.x + (i - 2) * h.r * .36, hh = (40 - Math.abs(i - 2) * 9) * Math.min(1, -h.t / .08);
        ctx.beginPath(); ctx.moveTo(x - 5, h.y); ctx.quadraticCurveTo(x - 6, h.y - hh * .6, x + (i - 2) * 2, h.y - hh); ctx.quadraticCurveTo(x + 6, h.y - hh * .6, x + 5, h.y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore(); } };
  // ---------------- the mimic: it gives his last blow back to him ----------------
  function mimicStep(dt) {
    for (const q of L.mimics) { q.t += dt; const e = q.e;
      if (e.dead || ['hurt', 'down', 'dying'].includes(e.state)) { q.t = 9; continue; }
      if (q.t >= .42 && !q.done) { q.done = true; e.facing = Math.sign(P.x - e.x) || e.facing; const m = q.m || {}, reach = (m.x1 || 50) + 18, dx = (P.x - e.x) * e.facing;
        e.vx = e.facing * Math.min(260, m.lunge || 120); sfx('swing');
        if (dx > -10 && dx < reach + e.hw && Math.abs(P.y - e.y) < 24 && P.z < 44) hitPlayer({ kind: 'melee', e }, Math.max(3, Math.round(e.dmg * .9)), e.x, m.power === 2); } }
    L.mimics = L.mimics.filter(q => q.t < .75);
  }
  // ---------------- cursed loot: black shards that pay well and stain ----------------
  function clootStep(dt) {
    for (const k of L.cloot) { k.t += dt; if (k.z > 0 || k.vz > 0) { k.vz -= GRAV * dt; k.z = Math.max(0, k.z + k.vz * dt); if (k.z === 0) k.vz = 0; }
      k.x = clamp(k.x, leftWall() + 12, rightWall() - 12); k.y = clamp(k.y, FLOOR_TOP + 6, FLOOR_BOT); // (where he can reach it, and drawn to him when he is near, like any loot)
      { const dd = Math.hypot(P.x - k.x, (P.y - k.y) * 1.5); if (k.t > .6 && dd < 80) { k.x += (P.x - k.x) * Math.min(1, dt * 9); k.y += (P.y - k.y) * Math.min(1, dt * 9); } }
      if (k.t > .6 && !k.got && Math.hypot(P.x - k.x, (P.y - k.y) * 1.5) < 16 && P.state !== 'dead') { k.got = true; const n = Math.round(30 * (1 + stageIdx * .6) * (1 + .5 * save.cycle)); save.shards += n; runShards += n;
        floatText(P.x, P.y, 86, '+' + n + ' BLACK SHARDS', '#B8A8C0', 13); sfx('pick'); burst(P.x, P.y, 30, ['#1A1018', '#5A4A60', '#8A2030'], 10, 'spark'); feed(WT.cloot, 'cursed loot taken');
        if (teff() >= 3 && Math.random() < .3) maybeCorruptItem(true); refreshHud(); }
      if (k.t > 14) k.got = true; }
    L.cloot = L.cloot.filter(k => !k.got);
  }

  // ---------------- what the corrupted look like ----------------
  function circleMark(x, y, r, t) { // the Black Circle's mark: a black ring with an ember of red in it
    ctx.save(); ctx.lineWidth = r * .42; ctx.strokeStyle = 'rgba(12,8,12,.92)'; circle(x, y, r); ctx.stroke();
    ctx.lineWidth = Math.max(.6, r * .12); ctx.strokeStyle = 'rgba(150,140,150,.65)'; circle(x, y, r * 1.24); ctx.stroke();
    ctx.fillStyle = `rgba(${190 + Math.round(50 * Math.sin(t * 4 + x))},36,44,1)`; circle(x, y, r * .34); ctx.fill(); ctx.restore();
  }
  // ---------------- a corrupted lord: each one turned by the Circle in its own way ----------------
  // The lord is drawn as ever; then its own silhouette is caught in a small offscreen mask (one more pass of its own art,
  // all in white), and the Circle's work is laid over the body through that mask, so every vein and crack keeps to its
  // outline whatever the art is: its colour drained to grisaille, a pigment multiplied in (each lord its own: dead moss,
  // rust, obsidian, bruise, soot, nightmare, cold glass, char) with its veins creeping over it from the ground and from the
  // mark, then a surface of its own (roots and thorns, rust blooms and weeping seams, obsidian facets, eyes opening in the
  // flesh, sword-cuts that bleed ink, craquelure and moths, a shattered mirror, burning sigils and black fire). Behind it, a
  // dark halo; round it, its motes. All of it deepens with the curse tier and flares at the surge; while the curse burns
  // back it shrinks and the veins run gold. In the lighter paint there is no mask: its veins and growths only.
  // The body's extent (and a coarse map of where its body is) is read once from a small private drawing, now and then again.
  const CV_PX = 220000; // (the most pixels the working canvases take for one lord)
  const CV = { m: null, mg: null, f: null, fg: null, c: null, cg: null, cal: new WeakMap(), geo: {}, H: null, o: null };
  function cvCan(k, w, h) { // (the working canvases, grown when needed and never made per frame)
    const c = CV[k]; if (c && c.width >= w && c.height >= h) return CV[k + 'g'];
    const n = document.createElement('canvas'); n.width = Math.max(64, Math.ceil(w * 1.15), c ? c.width : 0); n.height = Math.max(64, Math.ceil(h * 1.15), c ? c.height : 0);
    if (c) { c.width = 1; c.height = 1; } CV[k] = n; return (CV[k + 'g'] = n.getContext('2d'));
  }
  const cvTier = (B) => B ? (B.surge ? 1.12 : [.5, .6, .74, .88, 1][Math.min(4, B.bt | 0)]) * (B.burn > 0 ? .62 : 1) : .6;
  const hex3 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const tow = (h, k) => { const c = hex3(h), q = cl01(k); return `rgb(${Math.round(255 + (c[0] - 255) * q)},${Math.round(255 + (c[1] - 255) * q)},${Math.round(255 + (c[2] - 255) * q)})`; }; // (white toward a pigment: a multiply of k)
  // where its body is: drawn once, small, into a private canvas and read back; again every few seconds (it changes shape)
  function calib(e, draw, a) {
    const old = CV.cal.get(e), T = now(); if (old && (T < old.next || lite())) return old;
    const S = .5, W = 420, H = 400, OX = 210, OY = 320, sc = e.size || 1;
    let c = { x0: -e.hw * 1.7, x1: e.hw * 1.7, y0: -e.hh * 1.5, y1: e.hh * .12, top: null, cells: null, grid: null, gs: 16, gx0: -OX / S, gy0: -OY / S, gw: 0, gh: 0 };
    try {
      if (!CV.c) { CV.c = document.createElement('canvas'); CV.c.width = W; CV.c.height = H; CV.cg = CV.c.getContext('2d', { willReadFrequently: true }) || CV.c.getContext('2d'); }
      const g = CV.cg; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.setTransform(S, 0, 0, S, OX, OY);
      const oc = ctx, tt = TINT, fl = FLASH; ctx = g; TINT = '#FFFFFF'; FLASH = false; try { draw(e, a); } finally { ctx = oc; TINT = tt; FLASH = fl; }
      const d = g.getImageData(0, 0, W, H).data, gp = 8, gw = W / gp | 0, gh = H / gp | 0, grid = new Uint8Array(gw * gh), top = [], cells = [];
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { let n = 0; for (let yy = 1; yy < gp; yy += 3) for (let xx = 1; xx < gp; xx += 3) if (d[((gy * gp + yy) * W + gx * gp + xx) * 4 + 3] > 140) n++;
        if (n >= 5) { grid[gy * gw + gx] = 1; const lx = (gx * gp + gp / 2 - OX) / S, ly = (gy * gp + gp / 2 - OY) / S; cells.push(lx, ly); x0 = Math.min(x0, lx - 8); x1 = Math.max(x1, lx + 8); y0 = Math.min(y0, ly - 8); y1 = Math.max(y1, ly + 8); } }
      for (let gx = 0; gx < gw; gx++) { let ty = null; for (let gy = 0; gy < gh; gy++) if (grid[gy * gw + gx]) { ty = (gy * gp - OY) / S; break; } top.push(ty); }
      if (cells.length >= 12) c = { x0, x1, y0, y1, top, cells, grid, gs: gp / S, gx0: -OX / S, gy0: -OY / S, gw, gh };
    } catch (err) { /* (a tainted drawing can't be read: the plain box serves) */ }
    c.cx = (c.x0 + c.x1) / 2; c.cy = (c.y0 + c.y1) / 2; c.w = c.x1 - c.x0; c.h = c.y1 - c.y0; c.sc = sc;
    c.next = T + (e.state === 'enter' || (e.cB && e.cB.age < 2) ? .6 : 3.2); c.early = e.state === 'enter';
    CV.cal.set(e, c); return c;
  }
  const inBody = (c, x, y) => { if (!c.grid) return x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1; const gx = Math.floor((x - c.gx0) / c.gs), gy = Math.floor((y - c.gy0) / c.gs); return gx >= 0 && gy >= 0 && gx < c.gw && gy < c.gh && !!c.grid[gy * c.gw + gx]; };
  const onBody = (c, r, f) => { // (a point on its body, optionally where f says: f(x, y) true)
    if (!c.cells) { for (let i = 0; i < 30; i++) { const x = c.x0 + r() * c.w, y = c.y0 + r() * c.h; if (!f || f(x, y)) return [x, y]; } return [c.cx, c.cy]; }
    for (let i = 0; i < 40; i++) { const k = (r() * c.cells.length / 2 | 0) * 2, x = c.cells[k] + (r() - .5) * c.gs, y = c.cells[k + 1] + (r() - .5) * c.gs; if (!f || f(x, y)) return [x, y]; }
    return [c.cells[0], c.cells[1]];
  };
  const topAt = (c, x) => { if (!c.top) return c.y0; const i = clamp(Math.round((x - c.gx0) / c.gs - .5), 0, c.top.length - 1); for (let d = 0; d < 6; d++) { if (c.top[i + d] != null) return c.top[i + d]; if (c.top[i - d] != null) return c.top[i - d]; } return c.y0; };
  const topPts = (c, r, n, edge) => { // (points along its top edge, spread out, with the outward lean there)
    const out = []; for (let i = 0; i < n; i++) { const x = c.x0 + c.w * ((i + .5 + (r() - .5) * .7) / n) * (1 - edge * 2) + c.w * edge, y = topAt(c, x), yl = topAt(c, x - 6), yr = topAt(c, x + 6); out.push({ x, y: y + 2, n: Math.atan2(-12, yr - yl), i, rk: r() }); } return out; };
  const edgePts = (c, r, n, f) => { // (points on its upper edges, where its body has open air just above, with the lean there)
    const out = []; for (let i = 0; i < n * 12 && out.length < n; i++) { const [x, y] = onBody(c, r, f); if (inBody(c, x, y - c.gs * .9)) continue; const l = inBody(c, x - c.gs, y - c.gs * .5), rr = inBody(c, x + c.gs, y - c.gs * .5);
      if (out.some(q => Math.hypot(q.x - x, q.y - y) < c.gs * .8)) continue; out.push({ x, y: y - c.gs * .3, n: -Math.PI / 2 + (l && !rr ? .5 : rr && !l ? -.5 : 0) + (r() - .5) * .5, i: out.length, rk: r() }); } return out; };
  const stip = (r, c, n, f, s0, s1) => { const p = new Path2D(); for (let i = 0; i < n; i++) { const [x, y] = onBody(c, r, f), q = s0 + r() * (s1 - s0); p.moveTo(x + q, y); p.arc(x, y, q, 0, TAU); } return p; }; // (a grain of dots over its body)
  // veins: random walks from where they start, branching, pulled the way the style says; they die where the body ends
  function veins(r, c, srcs, o) {
    const V = [], seg = o.seg || 6, ad = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
    const go = (x, y, an, len, w, d, rk) => {
      const pts = [x, y]; let l = 0, dir = an, miss = 0;
      while (l < len) {
        if (o.snap) { if (r() < (o.turn || .22)) an += (r() < .5 ? -1 : 1) * o.snap; if (o.up) an += ad(an, -Math.PI / 2) * o.up * (r() < .3 ? 1 : 0); dir = Math.round(an / o.snap) * o.snap + (r() - .5) * (o.jit || .08); }
        else { an += (r() - .5) * o.wig; if (o.up) an += ad(an, -Math.PI / 2) * o.up; if (o.out) an += ad(an, Math.atan2(y - o.out[1], x - o.out[0])) * .08; dir = an; }
        x += Math.cos(dir) * seg; y += Math.sin(dir) * seg; l += seg; pts.push(x, y);
        if (!inBody(c, x, y)) { if (++miss > 2) break; } else miss = 0;
        if (d < (o.depth || 2) && r() < (o.br || .1)) go(x, y, an + (r() < .5 ? -1 : 1) * (o.spread || .75) * (.6 + r() * .6), (len - l) * (.4 + r() * .35), w * .62, d + 1, rk);
      }
      if (pts.length > 3) V.push({ pts, w, d, rk, len: l });
    };
    srcs.forEach((s, i) => go(s[0], s[1], s[2], s[3], s[4], 0, s[5] !== undefined ? s[5] : i / srcs.length));
    return V;
  }
  function vPath(V, f, dmin, dmax, smooth) { // (one path of all the veins of a depth that the tier shows)
    const p = new Path2D(); for (const v of V) { if (v.rk > f || v.d < dmin || v.d > dmax) continue; const q = v.pts; p.moveTo(q[0], q[1]);
      if (smooth) { for (let i = 2; i < q.length - 2; i += 2) p.quadraticCurveTo(q[i], q[i + 1], (q[i] + q[i + 2]) / 2, (q[i + 1] + q[i + 3]) / 2); p.lineTo(q[q.length - 2], q[q.length - 1]); }
      else for (let i = 2; i < q.length; i += 2) p.lineTo(q[i], q[i + 1]); }
    return p;
  }
  const FRAC = [.34, .48, .64, .82, 1];
  function vSet(G, key, V, smooth) { // (the veins as paths per tier and depth, made once)
    G[key] = []; for (let t = 0; t < 5; t++) G[key].push([vPath(V, FRAC[t], 0, 0, smooth), vPath(V, FRAC[t], 1, 1, smooth), vPath(V, FRAC[t], 2, 9, smooth)]);
  }
  const markL = (e) => { const sc = e.size || 1; return [e.hw * .15 / sc, -e.hh * .55]; }; // (where its mark sits, in its own drawing's space)
  const grow = (e) => sm(((e.cB && e.cB.age) || 0) / 3.2); // (on its entrance the corruption spreads over it)
  // stroke a vein set: widths per depth, dashed to its growth on the entrance
  function vStroke(g, P, w, col, gr, len) { g.strokeStyle = col; if (gr < 1) g.setLineDash([len * gr, 1e4]); for (let i = 0; i < 3; i++) { g.lineWidth = w[i]; g.stroke(P[i]); } if (gr < 1) g.setLineDash([]); }
  function vPulse(g, P, w, col, t, sp, dash) { g.strokeStyle = col; g.setLineDash(dash || [5, 26]); g.lineDashOffset = -t * (sp || 24); for (let i = 0; i < 2; i++) { g.lineWidth = w[i]; g.stroke(P[i]); } g.setLineDash([]); g.lineDashOffset = 0; }
  const STY = {};
  // ---- Old Mossback: the grove on his shell dies. Moss and leaves go to ash-brown and black, black roots climb his legs
  // and shell with red sap beating in them, black shelf-fungus breaks out, and black thorn-briars burst from his back.
  STY.mossback = {
    halo: '18,10,6', rim: '170,40,28', mote: () => ({ shape: 'tuft', col: pick(['#4A4034', '#2E2620', '#6A5A44', '#1A1410']), size: rand(2.4, 4), vz: rand(10, 40), life: 1.6 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), lo = c.y1 - c.h * .12, S = [];
      for (let i = 0; i < 6; i++) { const [x, y] = onBody(c, r, (x, y) => y > lo - c.h * .1); S.push([x, y, -Math.PI / 2 + (r() - .5) * 1.2, c.h * (.4 + r() * .4), 6]); }
      for (let i = 0; i < 4; i++) S.push([mx, my, i / 4 * TAU + r() * .8, c.h * (.3 + r() * .25), 5]);
      S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length));
      vSet(G, 'v', veins(r, c, S, { wig: .5, up: .05, depth: 2, br: .09, seg: 6 }), true);
      G.grain = [stip(r, c, 480, (x, y) => r() < 1 - (y - c.y0) / c.h, .25, .7), stip(r, c, 200, (x, y) => r() < 1 - (y - c.y0) / c.h, .2, .5)];
      G.blot = []; for (let i = 0; i < 16; i++) { const [x, y] = onBody(c, r, (x, y) => y < c.cy + c.h * .1); G.blot.push([x, y, 7 + r() * 16, r()]); }
      G.fun = []; for (let i = 0; i < 9; i++) { const [x, y] = onBody(c, r); G.fun.push([x, y, 3 + r() * 4, r(), r() < .5 ? -1 : 1]); }
      G.thorn = edgePts(c, r, 14, (x, y) => y > c.y0 + c.h * .36 && y < c.y0 + c.h * .72 && Math.abs(x - c.cx) < c.w * .34).map(p => Object.assign(p, { len: 28 + r() * 24, curl: (r() < .5 ? -1 : 1) * (.35 + r() * .45), sw: r() * TAU }));
      G.crack = []; for (let i = 0; i < 7; i++) { const [x, y] = onBody(c, r, (x, y) => y < c.cy), q = [x, y]; let an = r() * TAU; for (let s = 0; s < 8; s++) { an += (r() - .5) * 1.1; q.push(q[q.length - 2] + Math.cos(an) * 5, q[q.length - 1] + Math.sin(an) * 5); } G.crack.push({ q, rk: r() }); }
    },
    mul(g, e, c, G, t, k, gr) { const lg = g.createLinearGradient(0, c.y0, 0, c.y1); lg.addColorStop(0, tow('#4A4038', k)); lg.addColorStop(.3, tow('#7A6E64', k)); lg.addColorStop(.65, tow('#A09890', k)); lg.addColorStop(1, tow('#B8B0B4', k * .9)); g.fillStyle = lg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop';
      for (const b of G.blot) { if (b[3] > FRAC[e.cB.bt]) continue; const rg = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2] * gr); rg.addColorStop(0, `rgba(40,30,26,${.5 * k})`); rg.addColorStop(1, 'rgba(40,30,26,0)'); g.fillStyle = rg; g.fillRect(b[0] - b[2], b[1] - b[2], b[2] * 2, b[2] * 2); }
      vStroke(g, G.v[e.cB.bt], [5, 3, 1.6], '#3A3230', gr, c.h * 1.3); },
    surf(g, e, c, G, t, k, gr) { const P = G.v[e.cB.bt];
      g.globalAlpha = (.4 + .5 * k) * gr; g.fillStyle = '#1E1814'; g.fill(G.grain[0]); g.fillStyle = '#8A7A68'; g.fill(G.grain[1]); g.globalAlpha = 1;
      vStroke(g, P, [3.2, 2, 1.1], '#16100E', gr, c.h * 1.3);
      g.save(); g.translate(-.9, -1); vStroke(g, P, [1, .7, .4], 'rgba(130,114,100,.6)', gr, c.h * 1.3); g.restore();
      if (gr >= 1) vPulse(g, P, [1.3, .8], e.cB.burn > 0 ? 'rgba(255,214,120,.95)' : `rgba(${200 + 40 * Math.sin(t * 3) | 0},34,26,.72)`, t, 18, [3, 24]);
      for (const f of G.fun) { if (f[3] > FRAC[e.cB.bt]) continue; const s = f[2] * gr; g.save(); g.translate(f[0], f[1]); g.scale(f[4], 1); g.fillStyle = '#120C0C'; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s * .2, -s * 1.1, s * 1.2, -s * .2); g.quadraticCurveTo(s * .3, s * .3, -s, 0); g.fill(); g.strokeStyle = 'rgba(150,130,120,.6)'; g.lineWidth = .7; g.beginPath(); g.moveTo(-s * .8, -.4); g.quadraticCurveTo(-s * .1, -s * .9, s, -s * .25); g.stroke(); g.restore(); }
      for (const q of G.crack) { if (q.rk > FRAC[e.cB.bt]) continue; fissure(g, q.q, 3.4 * gr, e.cB.burn > 0 ? '255,220,140' : '235,50,40', .55 + .35 * Math.sin(t * 4 + q.rk * 9)); } },
    top(e, c, G, t, k, gr) { // black briars out of his back, thorned, arching over; red berries of the Circle on the oldest
      const f = FRAC[e.cB.bt], B = e.cB, off = (e.plan === 'sweep' || e.plan === 'roll' || e.plan === 'submerge') && ['wind', 'strike', 'dash', 'recover'].includes(e.state); B.vTop = lerp(B.vTop ?? 1, off ? 0 : 1, .25); if (B.vTop < .05) return; ctx.globalAlpha *= B.vTop;
      for (const p of G.thorn) { if (p.rk > f) continue; const L = p.len * gr * (.75 + .35 * k) * (.5 + .5 * B.vTop), sw = Math.sin(t * 1.3 + p.sw) * .1;
        briar(p.x, p.y, p.n + sw, L, p.curl, 4.8, p.rk < f * .45 ? t + p.sw : -1); if (L > 14) briar(p.x + Math.cos(p.n) * L * .3, p.y + Math.sin(p.n) * L * .3, p.n - p.curl * .7 + sw, L * .5, -p.curl * .8, 2.2, -1); } },
  };
  function fissure(g, q, w, rgb, a) { // (a crack opened in it: a black wedge widest at its middle, the void's light down in it)
    const n = q.length / 2; g.beginPath(); for (let i = 0; i < n; i++) { const j = Math.min(n - 2, i), dx = q[j * 2 + 2] - q[j * 2], dy = q[j * 2 + 3] - q[j * 2 + 1], l = Math.hypot(dx, dy) || 1, ww = w * Math.sin(Math.PI * i / (n - 1)); g.lineTo(q[i * 2] - dy / l * ww, q[i * 2 + 1] + dx / l * ww); }
    for (let i = n - 1; i >= 0; i--) { const j = Math.min(n - 2, i), dx = q[j * 2 + 2] - q[j * 2], dy = q[j * 2 + 3] - q[j * 2 + 1], l = Math.hypot(dx, dy) || 1, ww = w * Math.sin(Math.PI * i / (n - 1)) * .7; g.lineTo(q[i * 2] + dy / l * ww, q[i * 2 + 1] - dx / l * ww); }
    g.closePath(); g.fillStyle = '#050305'; g.fill(); g.strokeStyle = 'rgba(200,190,200,.35)'; g.lineWidth = .5; g.stroke();
    g.beginPath(); g.moveTo(q[2], q[3]); for (let i = 2; i < n - 1; i++) g.lineTo(q[i * 2], q[i * 2 + 1]); g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = Math.max(.5, w * .32); g.stroke();
  }
  function briar(x, y, a, L, curl, w0, berry) { // (one cane: a tapered arching stem, thorns hooked back along it)
    const n = 7, P = []; let an = a, px = x, py = y; for (let i = 0; i <= n; i++) { P.push([px, py, an]); px += Math.cos(an) * L / n; py += Math.sin(an) * L / n; an += curl * .32; }
    ctx.beginPath(); for (let i = 0; i <= n; i++) { const q = P[i], w = w0 * (1 - i / n * .88), nx = -Math.sin(q[2]) * w, ny = Math.cos(q[2]) * w; ctx.lineTo(q[0] + nx, q[1] + ny); }
    for (let i = n; i >= 0; i--) { const q = P[i], w = w0 * (1 - i / n * .88), nx = -Math.sin(q[2]) * w, ny = Math.cos(q[2]) * w; ctx.lineTo(q[0] - nx, q[1] - ny); }
    ctx.closePath(); ctx.fillStyle = '#0D0809'; ctx.fill();
    ctx.strokeStyle = 'rgba(140,120,124,.5)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < n; i++) { const q = P[i], w = w0 * (1 - i / n * .88) * .6; ctx.lineTo(q[0] - Math.sin(q[2]) * -w, q[1] + Math.cos(q[2]) * -w); } ctx.stroke();
    ctx.fillStyle = '#0D0809'; for (let i = 1; i < n; i++) { const q = P[i], sd = i % 2 ? 1 : -1, w = w0 * (1 - i / n * .88), s = 1.4 + w * 1.1, na = q[2] + sd * 1.57, bx = q[0] + Math.cos(na) * w * .8, by = q[1] + Math.sin(na) * w * .8, ta = q[2] + sd * 2.3;
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(q[2]) * s * .7, by + Math.sin(q[2]) * s * .7); ctx.lineTo(bx + Math.cos(ta) * s * 1.6, by + Math.sin(ta) * s * 1.6); ctx.lineTo(bx - Math.cos(q[2]) * s * .5, by - Math.sin(q[2]) * s * .5); ctx.closePath(); ctx.fill(); }
    if (berry >= 0) { const q = P[n]; ctx.fillStyle = '#1A0608'; circle(q[0], q[1], 2.2); ctx.fill(); ctx.fillStyle = `rgba(${200 + 50 * Math.sin(berry * 3) | 0},36,40,.95)`; circle(q[0] - .3, q[1] - .3, 1.4); ctx.fill(); ctx.fillStyle = 'rgba(255,220,220,.8)'; circle(q[0] - .7, q[1] - .8, .45); ctx.fill(); }
  }
  // ---- the Brass Colossus: rust-black eats it from the feet up. Its seams run black and glow like a forge's cracks, rust
  // blooms in crusted clusters on its plates, and black oil weeps from its joints in runs that drip.
  STY.colossus = {
    halo: '20,10,4', rim: '220,90,30', mote: () => ({ shape: pick(['chip', 'bolt']), col: pick(['#5A2E18', '#3A1E10', '#7A4022', '#1A100C']), size: rand(1.8, 3.2), vz: rand(20, 60), life: 1.2 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), S = [];
      for (let i = 0; i < 7; i++) { const [x, y] = onBody(c, r, (x, y) => y > c.y1 - c.h * .25); S.push([x, y, -Math.PI / 2, c.h * (.35 + r() * .45), 3.6]); }
      for (let i = 0; i < 4; i++) S.push([mx, my, i / 4 * TAU, c.h * (.2 + r() * .2), 3.2]);
      S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length));
      vSet(G, 'v', veins(r, c, S, { snap: Math.PI / 2, turn: .18, up: .3, jit: .04, depth: 2, br: .1, spread: Math.PI / 2, seg: 5 }), false);
      G.rust = []; for (let i = 0; i < 12; i++) { const [x, y] = onBody(c, r), bl = []; for (let j = 0; j < 6; j++) bl.push([(r() - .5) * 7, (r() - .5) * 5, .8 + r() * 2.2, r()]); G.rust.push({ x, y, bl, rk: (y - c.y0) / c.h > .5 ? r() * .6 : .3 + r() * .7 }); }
      G.grain = [0, 1, 2].map(j => stip(r, c, 420, (x, y) => r() < Math.pow((y - c.y0) / c.h, 1.6), .2 + j * .08, .45 + j * .12));
      G.stain = []; for (let i = 0; i < 14; i++) { const [x, y] = onBody(c, r); G.stain.push([x, y, 1.5 + r() * 2.5, 8 + r() * 22, r()]); }
      G.drip = []; for (let i = 0; i < 9; i++) { const [x, y] = onBody(c, r, (x, y) => y < c.y1 - c.h * .3); G.drip.push({ x, y, len: 12 + r() * 26, ph: r(), sp: .25 + r() * .3, rk: r() }); }
      G.vent = topPts(c, r, 5, .2);
    },
    mul(g, e, c, G, t, k, gr) { const h = .25 + .55 * k * gr, lg = g.createLinearGradient(0, c.y1, 0, c.y0); lg.addColorStop(0, tow('#3A2014', k)); lg.addColorStop(h * .55, tow('#7A4428', k)); lg.addColorStop(Math.min(1, h), tow('#A88A7A', k * .8)); lg.addColorStop(1, tow('#A8A2A8', k * .7));
      g.fillStyle = lg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; vStroke(g, G.v[e.cB.bt], [4, 2.4, 1.5], '#3A2216', gr, c.h * 1.2); },
    surf(g, e, c, G, t, k, gr) { const f = FRAC[e.cB.bt], P = G.v[e.cB.bt];
      for (const s of G.stain) { if (s[4] > f) continue; const lg = g.createLinearGradient(0, s[1], 0, s[1] + s[3] * gr); lg.addColorStop(0, 'rgba(120,52,20,.75)'); lg.addColorStop(.3, 'rgba(90,40,18,.5)'); lg.addColorStop(1, 'rgba(90,40,18,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(s[0] - s[2], s[1]); g.lineTo(s[0] + s[2], s[1]); g.lineTo(s[0] + s[2] * .3, s[1] + s[3] * gr); g.lineTo(s[0] - s[2] * .4, s[1] + s[3] * gr); g.closePath(); g.fill(); }
      g.globalAlpha = .55 + .4 * k; g.fillStyle = '#7A3A1A'; g.fill(G.grain[0]); g.fillStyle = '#2A140C'; g.fill(G.grain[1]); g.fillStyle = '#A8582A'; g.fill(G.grain[2]); g.globalAlpha = 1;
      for (const q of G.rust) { if (q.rk > f * gr) continue; for (const b of q.bl) { g.fillStyle = b[3] < .3 ? '#1E0E08' : b[3] < .7 ? '#7A3A1C' : '#B0602E'; circle2(g, q.x + b[0], q.y + b[1], b[2] * (.7 + .3 * k)); g.fill(); }
        g.fillStyle = 'rgba(255,180,120,.4)'; circle2(g, q.x - 1, q.y - 1, .8); g.fill(); }
      vStroke(g, P, [2.4, 1.5, .9], '#0E0806', gr, c.h * 1.2); g.save(); g.translate(.8, .8); vStroke(g, P, [.7, .5, .3], 'rgba(220,180,150,.35)', gr, c.h * 1.2); g.restore();
      if (gr >= 1) { vPulse(g, P, [1.1, .7], e.cB.burn > 0 ? 'rgba(255,220,130,.95)' : `rgba(255,${110 + 40 * Math.sin(t * 5) | 0},40,.95)`, t, 30, [5, 22]); }
      g.lineCap = 'round'; for (const d of G.drip) { if (d.rk > f) continue; const u = (t * d.sp + d.ph) % 1, L = d.len * Math.min(1, u * 1.6) * gr; g.strokeStyle = 'rgba(8,4,6,.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x, d.y + L); g.stroke();
        g.fillStyle = '#080406'; ell2(g, d.x, d.y + L + 1.2, 1.3, 2); g.fill(); g.fillStyle = 'rgba(160,140,200,.5)'; circle2(g, d.x - .6, d.y + L + .8, .6); g.fill(); } },
    top(e, c, G, t, k, gr) { if (Math.random() < .12 * k) { const v = pick(G.vent), w = locW(e, v.x, v.y); parts.push({ x: w[0], y: e.y, z: e.y - w[1], vx: rand(-10, 10), vy: 0, vz: rand(30, 60), life: 1.1, max: 1.1, col: pick(['rgba(14,8,6,.55)', 'rgba(40,24,18,.45)']), size: rand(3, 6) * c.sc, shape: 'puff', rot: 0, vr: 0 }); } },
  };
  // ---- the Kaleidoscope Wyrm: its colours eaten at last; the crystal turns to obsidian. Black glass with a cold sheen
  // sweeping over it, facets catching hard white edges, blood-violet light in its fractures, black shards growing from its back.
  STY.wyrm = {
    halo: '16,6,20', rim: '200,40,120', mote: () => ({ shape: 'shard', col: pick(['#0E0A12', '#1C1626', '#2A2236']), size: rand(1.6, 3), vz: rand(10, 40), life: 1.3 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), S = [];
      for (let i = 0; i < 12; i++) { const [x, y] = onBody(c, r); S.push([x, y, r() * TAU, c.w * (.2 + r() * .3), 3.2]); }
      for (let i = 0; i < 5; i++) S.push([mx, my, i / 5 * TAU, c.w * .3, 3]);
      S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length));
      vSet(G, 'v', veins(r, c, S, { snap: Math.PI / 4, turn: .3, jit: .12, depth: 2, br: .12, spread: Math.PI / 4, seg: 6 }), false);
      G.fac = []; for (let i = 0; i < 46; i++) { const [x, y] = onBody(c, r), s = 5 + r() * 9, a = r() * TAU, n = 3 + (r() * 2 | 0), q = []; for (let j = 0; j < n; j++) { const aa = a + j / n * TAU + (r() - .5) * .6, rr = s * (.6 + r() * .5); q.push(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } G.fac.push({ q, l: r(), e: r() * n | 0, rk: r() }); }
    },
    mul(g, e, c, G, t, k, gr) { const lg = g.createLinearGradient(c.x0, c.y0, c.x1, c.y1); lg.addColorStop(0, tow('#2E2638', k * gr)); lg.addColorStop(.5, tow('#4A4058', k * gr)); lg.addColorStop(1, tow('#241E2C', k * gr)); g.fillStyle = lg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; },
    surf(g, e, c, G, t, k, gr) { const f = FRAC[e.cB.bt] * gr;
      g.lineJoin = 'miter'; for (const F of G.fac) { if (F.rk > f) continue; const q = F.q, n = q.length / 2; g.beginPath(); g.moveTo(q[0], q[1]); for (let j = 1; j < n; j++) g.lineTo(q[j * 2], q[j * 2 + 1]); g.closePath();
        g.fillStyle = F.l < .35 ? 'rgba(4,2,8,.55)' : F.l < .7 ? 'rgba(60,50,80,.28)' : 'rgba(150,140,190,.16)'; g.fill(); g.strokeStyle = 'rgba(8,4,12,.7)'; g.lineWidth = .8; g.stroke();
        const a = F.e, b = (F.e + 1) % n; g.strokeStyle = `rgba(230,224,255,${.4 + .45 * Math.max(0, Math.sin(t * 1.7 + F.l * 9))})`; g.lineWidth = .7; g.beginPath(); g.moveTo(q[a * 2], q[a * 2 + 1]); g.lineTo(q[b * 2], q[b * 2 + 1]); g.stroke(); }
      const P = G.v[e.cB.bt]; vStroke(g, P, [2.6, 1.6, 1], '#050208', gr, c.w); if (gr >= 1) vPulse(g, P, [1.1, .8], e.cB.burn > 0 ? 'rgba(255,230,160,.95)' : `rgba(255,${50 + 30 * Math.sin(t * 4) | 0},140,.9)`, t, 22, [6, 20]);
      const u = ((t * .32) % 1.6) - .3, sx = c.x0 + c.w * u, sg = g.createLinearGradient(sx - 30, c.y0, sx + 30, c.y1); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(235,230,255,${.28 * k})`); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(c.x0, c.y0, c.w, c.h); },
    top(e, c, G, t, k, gr) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const F of G.fac) { if (F.rk > FRAC[e.cB.bt] * .5) continue; const gl = Math.sin(t * 1.9 + F.l * 40); if (gl < .9) continue; star4(F.q[0], F.q[1], 6 * (gl - .9) / .1, 'rgba(240,232,255,.9)'); } ctx.restore(); },
  };
  // ---- the Ty'iga: its stolen flesh turns to ink and bruise. Veins swell with its heartbeat, ink spreads and draws back
  // under its skin, and eyes open all over it: red, slit, every one turned on him, blinking out of time.
  STY.tyiga = {
    halo: '22,4,20', rim: '200,30,90', mote: () => ({ shape: 'blob', col: pick(['#14060F', '#2A0C22', '#3A1030']), size: rand(1.6, 2.8), vz: rand(-10, 20), life: 1.4 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), S = [];
      for (let i = 0; i < 10; i++) { const [x, y] = onBody(c, r); S.push([x, y, r() * TAU, c.w * (.25 + r() * .3), 4.4]); }
      for (let i = 0; i < 5; i++) S.push([mx, my, i / 5 * TAU, c.w * .3, 4]);
      S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length));
      vSet(G, 'v', veins(r, c, S, { wig: .7, depth: 2, br: .14, seg: 5 }), true);
      G.ink = []; for (let i = 0; i < 9; i++) { const [x, y] = onBody(c, r); G.ink.push([x, y, 10 + r() * 14, r() * TAU, r()]); }
      G.eye = []; const R = mulberry(31); for (let i = 0; i < 9; i++) { const [x, y] = onBody(c, R, (x, y) => Math.hypot(x - mx, y - my) > 16 && G.eye.every(q => Math.hypot(q.x - x, q.y - y) > 13)); G.eye.push({ x, y, s: 3 + R() * 2.6, ph: R() * 9, sp: .18 + R() * .2, rot: (R() - .5) * .7, rk: i / 9 }); }
    },
    mul(g, e, c, G, t, k, gr) { g.fillStyle = tow('#7A5A7A', k); g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop';
      for (const b of G.ink) { const x = b[0] + Math.sin(t * .5 + b[3]) * 6, y = b[1] + Math.cos(t * .4 + b[3]) * 4, R = b[2] * gr * (.7 + .3 * Math.sin(t * .8 + b[4] * 6)) * (.6 + .5 * k), rg = g.createRadialGradient(x, y, 0, x, y, R); rg.addColorStop(0, `rgba(30,6,30,${.85 * k})`); rg.addColorStop(.6, `rgba(60,20,60,${.4 * k})`); rg.addColorStop(1, 'rgba(60,20,60,0)'); g.fillStyle = rg; g.fillRect(x - R, y - R, R * 2, R * 2); } },
    surf(g, e, c, G, t, k, gr) { const hb = Math.pow(Math.max(0, Math.sin(t * 6.8)), 6) + .6 * Math.pow(Math.max(0, Math.sin(t * 6.8 - .9)), 6), Q = G.v[e.cB.bt], sw = 1 + .35 * hb;
      vStroke(g, Q, [3.6 * sw, 2.2 * sw, 1.2 * sw], '#1E0618', gr, c.w); g.save(); g.translate(-.7, -.7); vStroke(g, Q, [1, .7, .4], `rgba(190,110,170,${.35 + .3 * hb})`, gr, c.w); g.restore();
      if (gr >= 1) vPulse(g, Q, [1.4 * sw, .9], e.cB.burn > 0 ? 'rgba(255,220,140,.95)' : `rgba(240,40,80,${.6 + .35 * hb})`, t, 34, [3, 14]);
      const f = FRAC[e.cB.bt] * gr, lk = e.facing * Math.sign((P ? P.x : e.x) - e.x) || 1;
      for (const E of G.eye) { if (E.rk > f) continue; const cyc = (t * E.sp + E.ph) % 1, op = cyc < .08 ? cyc / .08 : cyc > .9 ? (1 - cyc) / .1 : cyc > .5 && cyc < .54 ? Math.abs(cyc - .52) / .02 : 1, s = E.s * (.85 + .25 * k);
        g.save(); g.translate(E.x, E.y); g.rotate(E.rot); g.fillStyle = '#12040E'; ell2(g, 0, 0, s * 1.5, s * .95); g.fill();
        if (op > .05) { g.beginPath(); g.moveTo(-s * 1.25, 0); g.quadraticCurveTo(0, -s * 1.15 * op, s * 1.25, 0); g.quadraticCurveTo(0, s * .9 * op, -s * 1.25, 0); g.fillStyle = '#E8D6B8'; g.fill(); g.save(); g.clip();
          const ix = lk * s * .35; g.fillStyle = '#C01828'; circle2(g, ix, 0, s * .62); g.fill(); g.fillStyle = '#FF5A3A'; circle2(g, ix - s * .12, -s * .12, s * .3); g.fill(); g.fillStyle = '#080206'; ell2(g, ix, 0, s * .14, s * .52); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; circle2(g, ix - s * .25, -s * .25, s * .12); g.fill(); g.restore(); }
        g.strokeStyle = '#12040E'; g.lineWidth = .9; g.beginPath(); g.moveTo(-s * 1.3, 0); g.quadraticCurveTo(0, -s * 1.2 * Math.max(op, .1), s * 1.3, 0); g.stroke(); g.restore(); } },
    top(e, c, G, t, k, gr) {},
  };
  // ---- the Phantom of Benedict: the master of arms cut to pieces by the Circle. A soot-dark wash runs down him in streaks,
  // he is scored all over with sword-cuts that weep black ink, the freshest still red, and black wisps tear off him.
  STY.benedict = {
    halo: '10,8,16', rim: '170,30,40', mote: () => ({ shape: 'puff', col: pick(['rgba(10,8,14,.55)', 'rgba(30,26,36,.5)']), size: rand(2.4, 4.4), vz: rand(20, 50), life: 1 }),
    gen(r, c, G, e) { G.str = []; for (let i = 0; i < 14; i++) { const x = c.x0 + r() * c.w; G.str.push([x, c.y0 + r() * c.h * .5, 3 + r() * 7, c.h * (.3 + r() * .6), r()]); }
      G.cut = []; for (let i = 0; i < 18; i++) { const [x, y] = onBody(c, r), a = (r() - .5) * 2.6, l = 6 + r() * 9; G.cut.push({ x, y, a, l, rk: r(), ph: r(), drip: r() < .5 ? 6 + r() * 14 : 0 }); } },
    mul(g, e, c, G, t, k, gr) { g.fillStyle = tow('#6E6878', k); g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop';
      for (const s of G.str) { if (s[4] > FRAC[e.cB.bt]) continue; const L = s[3] * gr, lg = g.createLinearGradient(0, s[1], 0, s[1] + L); lg.addColorStop(0, `rgba(30,26,40,${.8 * k})`); lg.addColorStop(1, 'rgba(30,26,40,0)'); g.fillStyle = lg; g.fillRect(s[0] - s[2] / 2, s[1], s[2], L); } },
    surf(g, e, c, G, t, k, gr) { const f = FRAC[e.cB.bt] * gr; g.lineCap = 'round';
      for (const q of G.cut) { if (q.rk > f) continue; const ca = Math.cos(q.a) * q.l / 2, sa = Math.sin(q.a) * q.l / 2, nx = -Math.sin(q.a) * 1.6, ny = Math.cos(q.a) * 1.6;
        g.beginPath(); g.moveTo(q.x - ca, q.y - sa); g.quadraticCurveTo(q.x + nx, q.y + ny, q.x + ca, q.y + sa); g.quadraticCurveTo(q.x - nx, q.y - ny, q.x - ca, q.y - sa); g.fillStyle = '#06040A'; g.fill();
        const fresh = (t * .23 + q.ph) % 1 < .4; g.strokeStyle = e.cB.burn > 0 ? 'rgba(255,220,140,.9)' : fresh ? 'rgba(255,70,64,1)' : 'rgba(190,40,50,.85)'; g.lineWidth = fresh ? 1.1 : .75; g.beginPath(); g.moveTo(q.x - ca * .8, q.y - sa * .8); g.lineTo(q.x + ca * .8, q.y + sa * .8); g.stroke();
        g.strokeStyle = 'rgba(220,214,235,.4)'; g.lineWidth = .5; g.beginPath(); g.moveTo(q.x - ca + nx * .9, q.y - sa + ny * .9 - .6); g.lineTo(q.x + ca + nx * .9, q.y + sa + ny * .9 - .6); g.stroke();
        if (q.drip) { const u = (t * .3 + q.ph) % 1, L = q.drip * Math.min(1, u * 1.5); g.strokeStyle = 'rgba(6,4,10,.85)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x, q.y + L); g.stroke(); g.fillStyle = '#06040A'; circle2(g, q.x, q.y + L, 1.3); g.fill(); } } },
    top(e, c, G, t, k, gr) { if (Math.random() < .5 * k * gr) { const [x, y] = onBody(c, Math.random, (x, y) => y < c.cy + c.h * .2), w = locW(e, x, y); cpEmit({ k: 'wisp', x: w[0], y: w[1], vx: -e.facing * rand(14, 34), vy: rand(-34, -16), life: rand(.8, 1.3), max: 1.3, s: rand(3, 5.5) * c.sc, ph: rand(0, TAU) }); } },
  };
  // ---- the Sleeper: the dream goes to nightmare. Its pale skin crazes like old porcelain, chips falling out of it onto a
  // starless void with red light far down in it, the edges going dark; black moths circle it.
  STY.sleeper = {
    halo: '8,8,20', rim: '120,60,180', mote: () => ({ shape: 'chip', col: pick(['#D8D4DC', '#A8A4B0', '#0C0A10']), size: rand(1.4, 2.6), vz: rand(-10, 20), life: 1.3 }),
    gen(r, c, G, e) { const S = []; for (let i = 0; i < 26; i++) { const [x, y] = onBody(c, r); S.push([x, y, r() * TAU, c.w * (.12 + r() * .2), 1.2]); }
      S.forEach((s, i) => s.push(i / S.length)); vSet(G, 'v', veins(r, c, S, { snap: .9, turn: .45, jit: .3, depth: 3, br: .3, spread: 1.1, seg: 5 }), false);
      G.chip = []; for (let i = 0; i < 10; i++) { const [x, y] = onBody(c, r), s = 4 + r() * 8, q = []; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + (r() - .5) * .7, rr = s * (.55 + r() * .6); q.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } G.chip.push({ q, x, y, s, rk: r(), st: [r(), r(), r(), r(), r(), r()] }); }
      G.moth = []; for (let i = 0; i < 9; i++) G.moth.push({ ph: r() * TAU, sp: .5 + r() * .7, rx: c.w * (.45 + r() * .3), ry: c.h * (.3 + r() * .25), s: 4 + r() * 3, rk: i / 9, f: 14 + r() * 8 }); },
    mul(g, e, c, G, t, k, gr) { g.fillStyle = tow('#8C8AA2', k); g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; const R = Math.max(c.w, c.h) * .62, rg = g.createRadialGradient(c.cx, c.cy, R * .35, c.cx, c.cy, R); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, tow('#2E2840', k * gr)); g.fillStyle = rg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); },
    surf(g, e, c, G, t, k, gr) { const P = G.v[e.cB.bt], f = FRAC[e.cB.bt] * gr; vStroke(g, P, [1.3, .9, .6], 'rgba(20,14,26,.9)', gr, c.w * .5); g.save(); g.translate(.7, .7); vStroke(g, P, [.6, .4, .3], 'rgba(255,250,255,.45)', gr, c.w * .5); g.restore();
      for (const q of G.chip) { if (q.rk > f) continue; const n = q.q.length / 2; g.beginPath(); g.moveTo(q.q[0], q.q[1]); for (let j = 1; j < n; j++) g.lineTo(q.q[j * 2], q.q[j * 2 + 1]); g.closePath();
        const rg = g.createRadialGradient(q.x, q.y + q.s * .3, 0, q.x, q.y, q.s * 1.2); rg.addColorStop(0, e.cB.burn > 0 ? '#5A4020' : `rgba(${90 + 50 * Math.sin(t * 2 + q.x) | 0},14,30,1)`); rg.addColorStop(.6, '#0A0610'); rg.addColorStop(1, '#040208'); g.fillStyle = rg; g.fill();
        g.strokeStyle = 'rgba(250,246,255,.75)'; g.lineWidth = .8; g.stroke(); g.fillStyle = 'rgba(220,210,255,.8)'; for (let j = 0; j < 3; j++) { circle2(g, q.x + (q.st[j] - .5) * q.s, q.y + (q.st[j + 3] - .5) * q.s, .35 + .3 * Math.abs(Math.sin(t * 3 + j))); g.fill(); } } },
    top(e, c, G, t, k, gr) { const f = FRAC[e.cB.bt];
      for (const m of G.moth) { if (m.rk > f * gr) continue; const a = t * m.sp + m.ph, x = c.cx + Math.cos(a) * m.rx, y = c.cy + Math.sin(a * 1.3) * m.ry - 6, fl = Math.abs(Math.sin(t * m.f + m.ph)), d = Math.sign(-Math.sin(a)) || 1, s = m.s;
        ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.fillStyle = '#08060C'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s * .4, sd * s * 1.6 * (.3 + .7 * fl), -s * 1.6, sd * s * 1.1 * (.3 + .7 * fl)); ctx.quadraticCurveTo(-s * 1.1, sd * s * .2, 0, 0); ctx.fill(); }
        ctx.fillStyle = 'rgba(200,40,60,.85)'; circle(.6, 0, .55); ctx.fill(); ctx.restore(); } },
  };
  // ---- the King in the Glass: the mirror he is cracks. Starbursts of fracture from where the Circle struck him, shards
  // set askew so each holds a darker or brighter reflection, the worst of them fallen out to show the black behind.
  STY.w7king = {
    halo: '6,10,18', rim: '120,170,230', mote: () => ({ shape: 'glass', col: pick(['#1A1C26', '#3A4050', '#0A0C12']), size: rand(1.8, 3.2), vz: rand(10, 40), life: 1.3 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), hits = [[mx, my, 1]]; for (let i = 0; i < 3; i++) { const [x, y] = onBody(c, r, (x, y) => Math.hypot(x - mx, y - my) > c.h * .25); hits.push([x, y, .55 + r() * .3]); }
      G.sh = []; G.ray = new Path2D(); G.ring = new Path2D(); G.rays = [];
      hits.forEach((h, hi) => { const n = 9 + (r() * 5 | 0), R = Math.max(c.w, c.h) * .55 * h[2], ang = []; for (let i = 0; i < n; i++) ang.push(i / n * TAU + (r() - .5) * .35);
        const rk = hi / hits.length, rings = [.18, .38, .66, 1].map(q => q * R), pt = (i, j) => { const a = ang[i % n], d = rings[j] * (.85 + .3 * hsh(hi * 97 + i * 13 + j)); return [h[0] + Math.cos(a) * d, h[1] + Math.sin(a) * d]; };
        const P = hi === 0 ? G.ray : new Path2D(); for (let i = 0; i < n; i++) { P.moveTo(h[0], h[1]); for (let j = 0; j < 4; j++) { const p = pt(i, j); P.lineTo(p[0], p[1]); } }
        const Q = hi === 0 ? G.ring : new Path2D(); for (let j = 0; j < 3; j++) { const p0 = pt(0, j); Q.moveTo(p0[0], p0[1]); for (let i = 1; i <= n; i++) { if (hsh(hi * 31 + i * 7 + j) < .25) { const p = pt(i, j); Q.moveTo(p[0], p[1]); continue; } const p = pt(i, j); Q.lineTo(p[0], p[1]); } }
        G.rays.push({ P, Q, rk });
        for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const v = r(); if (v > .55) continue; const b = pt(i, j), cc = pt(i + 1, j), d = j === 0 ? [h[0], h[1]] : pt(i + 1, j - 1);
          G.sh.push({ q: j === 0 ? [h[0], h[1], b[0], b[1], cc[0], cc[1]] : [pt(i, j - 1)[0], pt(i, j - 1)[1], b[0], b[1], cc[0], cc[1], d[0], d[1]], v, j, rk: rk * .6 + r() * .4, dx: (r() - .5) * 1.6, dy: (r() - .5) * 1.6 }); } }); },
    mul(g, e, c, G, t, k, gr) { const lg = g.createLinearGradient(c.x0, c.y0, c.x1, c.y1); lg.addColorStop(0, tow('#6A7484', k)); lg.addColorStop(.5, tow('#A0A8B6', k * .8)); lg.addColorStop(1, tow('#4A5262', k)); g.fillStyle = lg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; },
    surf(g, e, c, G, t, k, gr) { const f = FRAC[e.cB.bt] * gr; g.lineJoin = 'miter';
      for (const s of G.sh) { if (s.rk > f) continue; const q = s.q; g.beginPath(); g.moveTo(q[0] + s.dx, q[1] + s.dy); for (let j = 2; j < q.length; j += 2) g.lineTo(q[j] + s.dx, q[j + 1] + s.dy); g.closePath();
        g.fillStyle = s.v < .12 && s.j < 2 ? '#020206' : s.v < .3 ? 'rgba(6,8,16,.5)' : s.v < .45 ? 'rgba(230,240,255,.22)' : 'rgba(40,50,70,.3)'; g.fill(); if (s.v < .12 && s.j < 2) { g.strokeStyle = `rgba(220,40,60,${.5 + .4 * Math.sin(t * 3 + s.v * 50)})`; g.lineWidth = .7; g.stroke(); } }
      for (const R of G.rays) { if (R.rk > f) continue; g.strokeStyle = 'rgba(4,4,10,.85)'; g.lineWidth = 1.1; g.stroke(R.P); g.lineWidth = .8; g.stroke(R.Q); g.save(); g.translate(-.7, -.7); g.strokeStyle = 'rgba(240,248,255,.45)'; g.lineWidth = .5; g.stroke(R.P); g.stroke(R.Q); g.restore(); }
      const u = ((t * .25) % 1.5) - .25, sx = c.x0 + c.w * u, sg = g.createLinearGradient(sx - 18, c.y0, sx + 18, c.y0 + 30); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(240,248,255,${.22 * k})`); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(c.x0, c.y0, c.w, c.h); },
    top(e, c, G, t, k, gr) {},
  };
  // ---- the Goat-Lord: he came in by the curse, and it burns in him. Charred black from the hooves up, the Circle's sigils
  // branded into his hide and glowing, magma-cracks through the char, and black fire with red edges licking off his back.
  STY.w8goat = {
    halo: '24,6,4', rim: '255,80,30', mote: () => ({ shape: 'blob', col: pick(['#FF7A30', '#FFB050', '#E04020', '#1A0A08']), size: rand(1, 2), vz: rand(50, 90), life: .9 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), S = [];
      for (let i = 0; i < 10; i++) { const [x, y] = onBody(c, r, (x, y) => y > c.y1 - c.h * .3); S.push([x, y, -Math.PI / 2 + (r() - .5), c.h * (.4 + r() * .5), 3.6]); }
      for (let i = 0; i < 5; i++) S.push([mx, my, i / 5 * TAU, c.h * .3, 3.4]);
      S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length)); vSet(G, 'v', veins(r, c, S, { wig: .9, up: .04, depth: 2, br: .16, seg: 5, spread: .9 }), false);
      G.sig = []; for (let i = 0; i < 7; i++) { const [x, y] = onBody(c, r, (x, y) => Math.hypot(x - mx, y - my) > 18 && G.sig.every(q => Math.hypot(q.x - x, q.y - y) > 20)); G.sig.push({ x, y, s: 4.5 + r() * 3, a: r() * TAU, kind: r() * 3 | 0, ph: r() * 9, rk: i / 7 }); } },
    mul(g, e, c, G, t, k, gr) { const h = .3 + .5 * k * gr, lg = g.createLinearGradient(0, c.y1, 0, c.y0); lg.addColorStop(0, tow('#1E1210', k)); lg.addColorStop(h * .6, tow('#4A2E28', k)); lg.addColorStop(Math.min(1, h + .15), tow('#9A8884', k * .8)); lg.addColorStop(1, tow('#A89C9C', k * .7)); g.fillStyle = lg; g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; },
    surf(g, e, c, G, t, k, gr) { const P = G.v[e.cB.bt], f = FRAC[e.cB.bt] * gr, fl = (i) => .75 + .25 * Math.sin(t * 9 + i * 2.1) * Math.sin(t * 5.3 + i);
      vStroke(g, P, [3.4, 2.2, 1.3], '#0A0404', gr, c.h); if (gr >= 1) { g.strokeStyle = e.cB.burn > 0 ? 'rgba(255,230,150,.95)' : `rgba(255,${90 + 50 * fl(0) | 0},30,.92)`; for (let i = 0; i < 3; i++) { g.lineWidth = [1.3, .9, .5][i]; g.stroke(P[i]); } }
      g.lineCap = 'round'; for (const s of G.sig) { if (s.rk > f) continue; const R = s.s * (.9 + .2 * k), a = fl(s.ph); g.save(); g.translate(s.x, s.y); g.rotate(s.a);
        const ink = () => { g.beginPath(); g.arc(0, 0, R, 0, TAU); g.moveTo(R * .5, 0); g.arc(0, 0, R * .5, 0, TAU); for (let j = 0; j < (s.kind + 3); j++) { const q = j / (s.kind + 3) * TAU; g.moveTo(Math.cos(q) * R, Math.sin(q) * R); g.lineTo(Math.cos(q) * R * 1.45, Math.sin(q) * R * 1.45); } g.moveTo(-R * .5, 0); g.lineTo(R * .5, 0); if (s.kind === 1) { g.moveTo(0, -R * .5); g.lineTo(0, R * .5); } };
        ink(); g.strokeStyle = '#0A0404'; g.lineWidth = 2.4; g.stroke(); ink(); g.strokeStyle = e.cB.burn > 0 ? 'rgba(255,236,170,.95)' : `rgba(255,${60 + 70 * a | 0},${24 + 30 * a | 0},${.65 + .35 * a})`; g.lineWidth = 1; g.stroke(); g.restore(); } },
    top(e, c, G, t, k, gr) { for (let i = 0; i < 3; i++) if (Math.random() < .4 * k * gr) { const [x, y] = onBody(c, Math.random, (x, y) => y < c.cy + c.h * .15), w = locW(e, x, y); cpEmit({ k: 'flame', x: w[0], y: w[1], vx: rand(-6, 6), vy: rand(-40, -22), life: rand(.45, .85), max: .85, s: rand(2.4, 4.4) * c.sc, ph: rand(0, TAU) }); } },
  };
  STY._ = { halo: '14,8,14', rim: '190,40,50', mote: () => ({ shape: 'puff', col: pick(['rgba(30,24,30,.7)', 'rgba(90,84,92,.6)']), size: rand(2, 4), vz: rand(20, 50), life: .7 }),
    gen(r, c, G, e) { const [mx, my] = markL(e), S = []; for (let i = 0; i < 12; i++) { const [x, y] = onBody(c, r); S.push([x, y, r() * TAU, c.w * .3, 4]); } for (let i = 0; i < 5; i++) S.push([mx, my, i / 5 * TAU, c.w * .3, 4]); S.sort(() => r() - .5); S.forEach((s, i) => s.push(i / S.length)); vSet(G, 'v', veins(r, c, S, { wig: .6, depth: 2, br: .12 }), true); },
    mul(g, e, c, G, t, k, gr) { g.fillStyle = tow('#77727C', k); g.fillRect(c.x0 - 20, c.y0 - 20, c.w + 40, c.h + 40); g.globalCompositeOperation = 'source-atop'; vStroke(g, G.v[e.cB.bt], [5, 3, 2], '#201820', gr, c.w); },
    surf(g, e, c, G, t, k, gr) { const P = G.v[e.cB.bt]; vStroke(g, P, [3, 2, 1.2], '#0A0608', gr, c.w); if (gr >= 1) vPulse(g, P, [1.2, .8], 'rgba(220,40,50,.9)', t); },
    top() {} };
  STY.w6sleeper = STY.sleeper; STY.w5benedict = STY.benedict;
  const styOf = (e) => STY[e.type] || STY[e.def.draw] || STY._;
  function circle2(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); }
  function ell2(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); }
  function star4(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .22, y - r * .22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .22, y + r * .22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .22, y + r * .22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .22, y - r * .22); ctx.closePath(); ctx.fill(); }
  const locW = (e, x, y) => { const s = e.size || 1; return [e.x + x * s * e.facing, (e.y - e.z) + y * s]; }; // (a point of its drawing, in the world: near enough for motes)
  function geoOf(e, c) { // (its veins, growths and marks, laid out once from where its body is)
    const key = e.type + ':' + (c.grid ? 1 : 0); let G = CV.geo[key];
    if (G && !(G.early && !c.early)) return G;
    G = { early: c.early }; styOf(e).gen(mulberry(((e.type.length * 7919) ^ 0x5EED) + (e.type.charCodeAt(0) | 0)), c, G, e); CV.geo[key] = G; return G;
  }
  // its own motes, in the world: black flames off the Goat-Lord, ink-smoke torn off the Phantom (they drift off the body, so
  // where on it they rise from need only be near enough)
  const CP = []; let cpT = 0;
  const cpEmit = (p) => { if (CP.length < (lite() ? 24 : 72)) CP.push(p); };
  function cpDraw(t) {
    const dt = cpT ? clamp(t - cpT, 0, .05) : 0; cpT = t; if (!CP.length) return; ctx.save();
    for (let i = CP.length - 1; i >= 0; i--) { const p = CP[i]; p.life -= dt; if (p.life <= 0) { CP.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; const u = 1 - p.life / p.max, a = Math.min(1, p.life / .25) * Math.min(1, u * 6);
      if (p.k === 'flame') { const s = p.s * (1 - u * .45), x = p.x, y = p.y, hg = s * 4.8 * (1 - u * .3), w1 = Math.sin(t * 11 + p.ph) * s * .6 * (.3 + u), w2 = Math.sin(t * 7 + p.ph * 2) * s * .45;
        const flame = (q, dy) => { const yb = y - dy; ctx.beginPath(); ctx.moveTo(x - s * q, yb); ctx.bezierCurveTo(x - s * 1.15 * q, yb - hg * .35 * q, x - s * .25 * q + w2, yb - hg * .62 * q, x + w1, yb - hg * q); ctx.bezierCurveTo(x + s * .35 * q + w2, yb - hg * .5 * q, x + s * 1.15 * q, yb - hg * .3 * q, x + s * q, yb); ctx.quadraticCurveTo(x, yb + s * .7 * q, x - s * q, yb); ctx.closePath(); ctx.fill(); };
        ctx.globalAlpha = a * .95; const fg2 = ctx.createLinearGradient(0, y + s, 0, y - hg * 1.3); fg2.addColorStop(0, '#FFC060'); fg2.addColorStop(.35, '#FF5A20'); fg2.addColorStop(1, 'rgba(160,20,20,.6)'); ctx.fillStyle = fg2; flame(1.32, -s * .15);
        ctx.fillStyle = '#0C0406'; flame(1, s * .35); }
      else { ctx.globalAlpha = a * .55 * (1 - u * .5); const s = p.s * (1 + u * 1.8); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) + Math.sin(t * 3 + p.ph) * .3); ctx.scale(1.9, .75); const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, s); rg.addColorStop(0, 'rgba(8,6,12,.9)'); rg.addColorStop(.55, 'rgba(14,10,20,.45)'); rg.addColorStop(1, 'rgba(14,10,20,0)'); ctx.fillStyle = rg; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore(); } }
    ctx.restore();
  }
  // behind the body: a dark halo, smoke turning slowly in it, and a rim of the Circle's red
  function curseHalo(e, c, S, t, k) {
    const R = Math.max(c.w, c.h) * .56, cx = c.cx, cy = c.cy; ctx.save();
    const rg = ctx.createRadialGradient(cx, cy, R * .2, cx, cy, R * (1.05 + .05 * Math.sin(t * 1.7))); rg.addColorStop(0, `rgba(${S.halo},${.34 * k})`); rg.addColorStop(.5, `rgba(${S.halo},${.18 * k})`); rg.addColorStop(1, `rgba(${S.halo},0)`);
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.1, R * .9, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = t * (.25 + i * .05) * (i % 2 ? 1 : -1) + i * 1.3, d = R * (.5 + .12 * Math.sin(t * .9 + i)), x = cx + Math.cos(a) * d * 1.05, y = cy + Math.sin(a) * d * .8, r = R * (.3 + .04 * i), q = ctx.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, `rgba(${S.halo},${.26 * k})`); q.addColorStop(1, `rgba(${S.halo},0)`); ctx.fillStyle = q; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const a0 = t * .6 + i * 2.1, len = .7 + .4 * Math.sin(t * 1.3 + i); ctx.strokeStyle = `rgba(${S.rim},${.13 * k})`; ctx.beginPath(); ctx.ellipse(cx, cy, R * .86, R * .7, 0, a0, a0 + len); ctx.stroke(); }
    ctx.restore();
  }
  // the whole of it, laid over the body just drawn (ctx holds its drawing's transform)
  function curseBody(e, a, draw, t) {
    const B = e.cB, S = styOf(e), vis = ctx.globalAlpha * (e.w4vis ?? 1); if (vis < .03) return;
    const c = calib(e, draw, a), G = geoOf(e, c), k = cvTier(B), gr = grow(e), cheap = lite();
    if (cheap) { ctx.save(); ctx.globalAlpha = vis * .8 * k; const P = G.v ? G.v[B.bt] : null; if (P) { vStroke(ctx, P, [2.6, 1.6, 1], 'rgba(16,10,14,.85)', gr, c.h); if (gr >= 1) vPulse(ctx, P, [1, .7], 'rgba(220,40,50,.85)', t); } ctx.restore(); ctx.save(); ctx.globalAlpha = vis; S.top(e, c, G, t, k, gr); ctx.restore(); return; }
    const M = ctx.getTransform(), cv = ctx.canvas, pad = 16; let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    for (const [px, py] of [[c.x0 - pad, c.y0 - pad], [c.x1 + pad, c.y0 - pad], [c.x0 - pad, c.y1 + pad], [c.x1 + pad, c.y1 + pad]]) { const X = M.a * px + M.c * py + M.e, Y = M.b * px + M.d * py + M.f; X0 = Math.min(X0, X); X1 = Math.max(X1, X); Y0 = Math.min(Y0, Y); Y1 = Math.max(Y1, Y); }
    X0 = Math.max(0, Math.floor(X0)); Y0 = Math.max(0, Math.floor(Y0)); X1 = Math.min(cv.width, Math.ceil(X1)); Y1 = Math.min(cv.height, Math.ceil(Y1));
    const W = X1 - X0, H = Y1 - Y0; if (W < 4 || H < 4) return;
    const q = Math.min(1, Math.sqrt(CV_PX / (W * H))), w = Math.ceil(W * q), h = Math.ceil(H * q); // (a big lord on a dense screen is worked at a little less than full size)
    const mg = cvCan('m', w, h), fg = cvCan('f', w, h), loc = (g) => g.setTransform(M.a * q, M.b * q, M.c * q, M.d * q, (M.e - X0) * q, (M.f - Y0) * q), id = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
    const blit = (cn, op, al) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = op; ctx.globalAlpha = vis * al; ctx.drawImage(cn, 0, 0, w, h, X0, Y0, W, H); ctx.restore(); };
    // the mask: its own art once more; then its pigment and veins painted into it (only where it is), to be multiplied in
    id(mg); mg.globalAlpha = 1; mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, w + 1, h + 1); loc(mg);
    { const oc = ctx, tt = TINT, fl = FLASH; ctx = mg; TINT = '#FFFFFF'; FLASH = false; try { draw(e, a); } finally { ctx = oc; TINT = tt; FLASH = fl; } }
    mg.save(); mg.globalAlpha = 1; mg.globalCompositeOperation = 'source-in'; mg.lineCap = 'round'; mg.lineJoin = 'round'; try { S.mul(mg, e, c, G, t, k, gr); } finally { mg.restore(); }
    blit(CV.m, 'saturation', Math.min(1, (.55 + .45 * k) * (.4 + .6 * gr)));
    blit(CV.m, 'multiply', Math.min(1, .55 + .45 * gr));
    // its surface: drawn apart, then cut to the mask
    id(fg); fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, w + 1, h + 1); loc(fg); fg.save(); fg.lineCap = 'round'; fg.lineJoin = 'round'; try { S.surf(fg, e, c, G, t, k, gr); } finally { fg.restore(); }
    id(fg); fg.globalCompositeOperation = 'destination-in'; fg.drawImage(CV.m, 0, 0, w, h, 0, 0, w, h); fg.globalCompositeOperation = 'source-over';
    blit(CV.f, 'source-over', Math.min(1, .3 + .7 * gr));
    ctx.save(); ctx.globalAlpha = vis; S.top(e, c, G, t, k, gr); ctx.restore();
    if (Math.random() < .3 * k) { const m = S.mote(), [x, y] = onBody(c, Math.random), w = locW(e, x, y); parts.push({ x: w[0], y: e.y + rand(-2, 2), z: Math.max(2, e.y - w[1]), vx: rand(-14, 14), vy: 0, vz: m.vz, life: m.life, max: m.life, col: m.col, size: m.size, shape: m.shape, rot: rand(0, TAU), vr: rand(-4, 4) }); }
  }
  const _de = drawEnemy;
  drawEnemy = function (e, t) {
    if (!NG() || DBL_DRAW) return _de(e, t);
    const puppet = L.fx && L.fx.k === 'puppet' && fxAmt() > .4;
    if (e.cB && e.def && e.def.ownCurse) return _de(e, t);
    const own = e.cursed && !e.cB && !(e.state === 'dying' && e.death && e.death !== 'pop') && window.CURSED_LOOK; // (a cursed foe: the curse grown into its own body, cursed_foes.js)
    if (puppet && !TINT) { TINT = '#140C0A'; try { return own ? CURSED_LOOK.draw(e, t, _de) : _de(e, t); } finally { TINT = null; } }
    if (e.cB && e.def && e.def.ownCurse) return _de(e, t); // (a lord that wears the curse in its own drawing, its weak point built into it: no overlay, no halo, no mark)
    const lord = e.cB && !TINT && !(e.state === 'dying' && e.death && e.death !== 'pop') && e.def && CREATURES[e.def.draw];
    if (lord) { // (a corrupted lord: the Circle's work is laid on its body as it is drawn, in the drawing's own space; its halo behind)
      const key = e.def.draw, o = CREATURES[key]; let done = false;
      CREATURES[key] = function (en, a) { if (en !== e || done) return o(en, a); done = true;
        if (!FLASH && (en.w4vis ?? 1) > .03) { try { const c = calib(e, o, a); curseHalo(e, c, styOf(e), t, cvTier(e.cB) * grow(e) * ctx.globalAlpha * (en.w4vis ?? 1)); } catch (err) { console.error(err); } }
        o(en, a);
        if (!FLASH) { try { curseBody(e, a, o, t); } catch (err) { console.error(err); } } };
      try { _de(e, t); } finally { CREATURES[key] = o; }
      cpDraw(t);
    } else if (own) CURSED_LOOK.draw(e, t, _de);
    else _de(e, t);
    if (!e.cursed || (e.state === 'dying' && e.death && e.death !== 'pop')) return;
    const sc = (e.boss ? e.size || 1 : e.champ ? 1.3 : 1) * (e.shrink || 1);
    if (!own && !e.cB && !LITE && !lite() && !TINT && !FLASH) { const tt = TINT; ctx.save(); ctx.globalAlpha *= e.boss ? .32 : .5; TINT = '#77727C'; try { _de(e, t); } finally { TINT = tt; ctx.restore(); } } // (grey: painted over itself in the Circle's ash)
    { // (painted on the figure itself, in its own layer, so the figure does not cover it)
      const cy = e.y - e.z - e.hh * sc * .55;
      if (e.cB) { if ((e.w4vis ?? 1) > .03) { ctx.save(); ctx.globalAlpha *= Math.min(1, e.w4vis ?? 1); bossMark(e, e.x + e.facing * e.hw * .15, cy, sc, t); ctx.restore(); } } else if (!own) circleMark(e.x + e.facing * e.hw * .15, cy, e.boss ? 9 : 5.5, t);
      if (!e.cB && Math.random() < (own ? .12 : .25)) parts.push({ x: e.x + rand(-e.hw, e.hw) * .6, y: e.y, z: e.z + rand(0, e.hh), vx: rand(-8, 8), vy: 0, vz: rand(20, 50), life: .7, max: .7, col: pick(['rgba(30,24,30,.7)', 'rgba(90,84,92,.6)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 });
    }
  };
  // (a lord that draws its own curse keeps the ground's telegraph: the Circle's ring closing on it as its attack winds)
  { const _w = drawEnemy; drawEnemy = function (e, t) { const r = _w(e, t); if (e && e.cB && ownCurse(e) && NG() && !DBL_DRAW && !e.dead) markWind(e); return r; }; }
  { const _dd = drawDeath; drawDeath = function (e, t) { if (NG() && L.fx && L.fx.k === 'puppet' && fxAmt() > .4 && !TINT) { TINT = '#140C0A'; try { return _dd(e, t); } finally { TINT = null; } } return _dd(e, t); }; }
  { const _dp = drawPlayerAt; drawPlayerAt = function (x, y, z, f, pose, a) { if (NG() && L.fx && L.fx.k === 'puppet' && fxAmt() > .4 && !TINT) { TINT = '#140C0A'; try { return _dp(x, y, z, f, pose, a); } finally { TINT = null; } } return _dp(x, y, z, f, pose, a); }; }

  // ---------------- the shifts of the view: each comes and goes in a stretch ----------------
  const FX_BY_TIER = { 2: ['drain', 'tilt', 'tear'], 3: ['drain', 'tilt', 'tear', 'mirror', 'puppet', 'rewind', 'tapestry'], 4: ['drain', 'tilt', 'tear', 'mirror', 'puppet', 'rewind', 'tapestry', 'close'] };
  const FX_DUR = { drain: [5, 8], tilt: [4.5, 7], tear: [1.4, 2.2], mirror: [4, 5.5], puppet: [5, 7], rewind: [1.3, 1.3], tapestry: [5, 7], close: [4, 6] };
  const busy = () => !!((typeof zoneTrans !== 'undefined' && zoneTrans) || (window.W8 && W8.cine && W8.cine()) || (window.ENDINGS && ENDINGS.active) || (window.W8 && W8.releasing) || L.coda); // (W8.releasing: the curse let go, w8_late.js, paints its own grey)
  function fxSchedule(dt) {
    const t = teff();
    if (L.fx) { L.fx.t += dt; if (L.fx.t >= L.fx.dur) { L.fx = null; L.fxNext = t >= 4 ? rand(12, 24) : t >= 3 ? rand(18, 32) : rand(26, 44); } return; }
    if (t < 2 || busy() || L.heart) return;
    L.fxNext -= dt; if (L.fxNext > 0) return;
    startFx(pick(FX_BY_TIER[Math.min(4, t)]));
  }
  function startFx(k, dur) { const d = FX_DUR[k] || [4, 6]; L.fx = { k, t: 0, dur: dur || rand(d[0], d[1]), seed: Math.random() * 999, dir: Math.random() < .5 ? -1 : 1 };
    if (k === 'mirror') { floatText(P.x, P.y, 110, 'THE WORLD TURNS ROUND', '#C8C2CC', 12); sfx('whoosh'); }
    if (k === 'rewind') sfx('whoosh'); return L.fx; }
  function fxAmt() { const f = L.fx; if (!f) return 0; return Math.min(sm(f.t / .5), sm((f.dur - f.t) / .6)); }
  // mirrored, his left is his right
  { const _rm = readMove; readMove = function () { _rm(); if (NG() && L.fx && L.fx.k === 'mirror' && fxAmt() > .5) input.mx = -input.mx; }; }

  // ---------------- painting it all ----------------
  let BUF = null, BUFG = null, FOG = null, WEAVE = null, WEAVEP = null, WEAVEPC = null, PEND_NUMS = null;
  function buf(w, h) { if (!BUF || BUF.width !== w || BUF.height !== h) { BUF = document.createElement('canvas'); BUF.width = w; BUF.height = h; BUFG = BUF.getContext('2d'); } return BUFG; }
  function fogCanvas() { // grey creeping in from the edges: painted once, small, stretched over the view
    if (FOG) return FOG; const c = document.createElement('canvas'); c.width = 192; c.height = 108; const g = c.getContext('2d'), r = mulberry(77);
    const rg = g.createRadialGradient(96, 54, 30, 96, 54, 112); rg.addColorStop(0, 'rgba(120,116,124,0)'); rg.addColorStop(.62, 'rgba(120,116,124,.12)'); rg.addColorStop(1, 'rgba(96,92,100,.9)'); g.fillStyle = rg; g.fillRect(0, 0, 192, 108);
    for (let i = 0; i < 70; i++) { const a = r() * TAU, d = 70 + r() * 40, x = 96 + Math.cos(a) * d * 1.1, y = 54 + Math.sin(a) * d * .62, R = 6 + r() * 16;
      const q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, `rgba(${r() < .2 ? '40,34,40' : '140,136,144'},${.25 + r() * .3})`); q.addColorStop(1, 'rgba(140,136,144,0)'); g.fillStyle = q; g.fillRect(x - R, y - R, R * 2, R * 2); }
    return (FOG = c);
  }
  function weavePat(g) { // a tapestry's threads, as a small repeating tile
    if (!WEAVE) { const c = document.createElement('canvas'); c.width = 6; c.height = 6; const w = c.getContext('2d'); w.fillStyle = 'rgba(80,60,40,.0)'; w.fillRect(0, 0, 6, 6);
      w.fillStyle = 'rgba(60,40,24,.5)'; w.fillRect(0, 0, 6, 1); w.fillRect(0, 3, 6, 1); w.fillStyle = 'rgba(255,240,210,.35)'; w.fillRect(0, 1, 3, 1); w.fillRect(3, 4, 3, 1); w.fillStyle = 'rgba(60,40,24,.35)'; w.fillRect(2, 0, 1, 6); w.fillRect(5, 0, 1, 6); WEAVE = c; }
    if (WEAVEPC !== g) { WEAVEP = g.createPattern(WEAVE, 'repeat'); WEAVEPC = g; } return WEAVEP;
  }
  const view = () => ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  const _ds = drawScene;
  drawScene = function (t) {
    if (!NG()) return _ds(t);
    if (L.coda) return drawCoda(t);
    const f = L.fx, k = f ? fxAmt() : 0, mirror = f && f.k === 'mirror' && k > 0;
    let held = null; if (mirror) { held = nums; nums = []; }
    try { _ds(t); } finally { if (mirror) { const extra = nums; nums = held.concat(extra); } }
    PEND_NUMS = held;
    try { postFx(t, f, k); } catch (err) { console.error(err); } finally { PEND_NUMS = null; }
  };
  function postFx(t, f, k) {
    if (busy() && !(window.W8 && W8.cine && W8.cine())) return;
    const T = teff(), g = ctx;
    // the transforms of the whole picture (copied, then laid back turned, mirrored or nearer)
    if (f && k > 0 && ['tilt', 'mirror', 'close', 'tear', 'rewind'].includes(f.k)) {
      const W = cv.width, H = cv.height, half = lite(), bw = half ? Math.ceil(W / 2) : W, bh = half ? Math.ceil(H / 2) : H, b = buf(bw, bh);
      b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(cv, 0, 0, bw, bh);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (f.k === 'tilt') { const a = f.dir * k * 5.5 * Math.PI / 180, s = 1.1 + .03 * k, bend = 22 * k * K; g.fillStyle = '#0A080C'; g.fillRect(0, 0, W, H);
        g.translate(W / 2, H / 2); g.rotate(a); g.scale(s, s); g.translate(-W / 2, -H / 2);
        const n = 10; for (let i = 0; i < n; i++) { const x0 = i / n, dy = -bend * Math.sin(Math.PI * (x0 + .5 / n)); g.drawImage(BUF, x0 * bw, 0, bw / n + 1, bh, x0 * W, dy + bend * .6, W / n + 1, H); } }
      else if (f.k === 'mirror') { g.globalAlpha = 1; g.translate(W, 0); g.scale(-1, 1); g.drawImage(BUF, 0, 0, W, H); if (k < 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - k; g.drawImage(BUF, 0, 0, W, H); } }
      else if (f.k === 'close') { const s = 1 + .38 * k, px = clamp((P.x - camX) * K, W * .3, W * .7), py = clamp((P.y - 40 - Y_OFF) * K, H * .35, H * .7);
        g.translate(px, py); g.scale(s, s); g.translate(-px, -py); g.drawImage(BUF, 0, 0, W, H); }
      else if (f.k === 'tear') { const r = mulberry(Math.floor(t * 12) + (f.seed | 0)), n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) { const y = r() * H, h = (6 + r() * 30) * K, dx = (r() - .5) * 60 * K * k; g.drawImage(BUF, 0, y * bh / H, bw, h * bh / H, dx, y, W, h);
          if (r() < .5) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25; g.fillStyle = r() < .5 ? '#FF3040' : '#30E0FF'; g.fillRect(0, y, W, Math.max(1, K)); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } } }
      else if (f.k === 'rewind') { const r = mulberry(Math.floor(t * 20)); g.globalAlpha = .35 * k; g.drawImage(BUF, -10 * K * k, 0, W, H); g.globalAlpha = 1;
        for (let i = 0; i < 4; i++) { const y = r() * H, h = (2 + r() * 8) * K; g.drawImage(BUF, 0, y * bh / H, bw, h * bh / H, (r() - .5) * 30 * K, y, W, h); }
        g.globalAlpha = .12 * k; g.fillStyle = '#000'; for (let y = 0; y < H; y += 3 * K) g.fillRect(0, y, W, Math.max(1, K * .8)); }
      g.restore();
      if (f.k === 'mirror' && PEND_NUMS) drawNumsMirrored(PEND_NUMS);
    }
    g.save();
    // the omens that stay: grey at the edges, the light guttering
    if (T >= 1) { const fa = [0, .34, .46, .56, .68][T] * (1 + .08 * Math.sin(t * .7)); g.globalAlpha = Math.min(1, fa); g.drawImage(fogCanvas(), -VW * .06 + VW * .03 * Math.sin(t * .3), Y_OFF - VIEW_H * .02, VW * 1.12, VIEW_H * 1.04); g.globalAlpha = 1;
      L.flickT -= 1 / 60; if (L.flickT <= 0) { L.flickT = rand(1.5, 5) / T; L.flick = rand(.12, .3); } if (L.flick > 0) { L.flick -= 1 / 60; g.fillStyle = `rgba(8,4,10,${Math.min(.32, L.flick) * (.4 + .2 * T)})`; view(); } }
    // the Circle's greys and reds: drained colour, a red in the corners
    const drain = (T >= 2 ? .2 + .14 * (T - 2) : 0) + (f && f.k === 'drain' ? .65 * k : 0) + (finalHigh() ? .4 : 0) + (L.pulse ? .5 * Math.max(0, 1 - L.pulse.t / 2.5) : 0);
    if (drain > 0) { if (lite()) { g.fillStyle = `rgba(110,106,114,${Math.min(.55, drain * .5)})`; view(); }
      else { g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${Math.min(1, drain)})`; view(); g.globalCompositeOperation = 'source-over'; }
      const rg = g.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .55, VIEW_H * .3, VW / 2, Y_OFF + VIEW_H * .55, VW * .72); rg.addColorStop(0, 'rgba(150,20,30,0)'); rg.addColorStop(1, `rgba(150,20,30,${Math.min(.4, drain * .32)})`);
      g.globalCompositeOperation = lite() ? 'source-over' : 'multiply'; g.fillStyle = lite() ? `rgba(120,20,30,${Math.min(.18, drain * .14)})` : rg; view(); g.globalCompositeOperation = 'source-over'; }
    if (f && k > 0) {
      if (f.k === 'puppet') { const vg = g.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .45, VIEW_H * .2, VW / 2, Y_OFF + VIEW_H * .5, VW * .62); vg.addColorStop(0, 'rgba(40,16,4,0)'); vg.addColorStop(1, `rgba(30,12,4,${.75 * k})`); g.fillStyle = vg; view();
        g.globalAlpha = .1 * k; g.fillStyle = weavePat(g); view(); g.globalAlpha = 1; }
      if (f.k === 'tapestry') { if (!lite()) { g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(150,120,80,${.7 * k})`; view(); g.globalCompositeOperation = 'source-over'; }
        g.fillStyle = `rgba(236,220,190,${.28 * k})`; view(); g.globalAlpha = .6 * k; g.fillStyle = weavePat(g); g.save(); g.scale(.75, .75); g.fillRect(0, Y_OFF / .75, VW / .75, VIEW_H / .75); g.restore(); g.globalAlpha = 1;
        const vg = g.createRadialGradient(VW / 2, Y_OFF + VIEW_H / 2, VIEW_H * .35, VW / 2, Y_OFF + VIEW_H / 2, VW * .7); vg.addColorStop(0, 'rgba(90,60,30,0)'); vg.addColorStop(1, `rgba(90,60,30,${.55 * k})`); g.fillStyle = vg; view();
        g.strokeStyle = `rgba(110,70,30,${.8 * k})`; g.lineWidth = 6; g.strokeRect(5, Y_OFF + 5, VW - 10, VIEW_H - 10); g.strokeStyle = `rgba(220,180,90,${.7 * k})`; g.lineWidth = 1.5; g.strokeRect(11, Y_OFF + 11, VW - 22, VIEW_H - 22); }
    }
    // the worst of the Horn: the Black Circle's pulse goes out over everything
    if (L.pulse) { const p = L.pulse; p.t += 1 / 60; const R = p.t * 520, a = Math.max(0, 1 - p.t / 1.8), sx = p.x - camX, sy = p.y - 40;
      if (a > 0) { g.lineWidth = 46 * a + 6; g.strokeStyle = `rgba(6,2,6,${.8 * a})`; g.beginPath(); g.ellipse(sx, sy, R, R * .62, 0, 0, TAU); g.stroke(); g.lineWidth = 3; g.strokeStyle = `rgba(190,30,40,${a})`; g.stroke();
        g.fillStyle = `rgba(20,10,16,${.35 * a})`; view(); } if (p.t > 2.5) L.pulse = null; }
    if (L.heart) heartOverlay(t);
    g.restore();
  }
  function drawNumsMirrored(list) { // the numbers stay readable in a mirrored stretch: set where they would be, in plain writing
    const g = ctx; g.save(); g.textAlign = 'center';
    for (const n of list) { const k = n.t / n.max, pop = 1 + Math.max(0, (k - .82) / .18) * .7, x = VW - (n.x - camX); g.globalAlpha = Math.min(1, n.t * 3);
      g.font = `700 ${Math.round(n.size * pop)}px Cinzel, Georgia, serif`; g.lineWidth = 4; g.strokeStyle = OUT; g.strokeText(n.txt, x, n.y - n.z); g.fillStyle = n.col; g.fillText(n.txt, x, n.y - n.z); }
    g.restore();
  }

  // ======================================================================================================
  // 4. CORRUPTED ITEMS AND THE CORRUPTED PEARL
  // ======================================================================================================
  const WCURSE = { behind: { name: 'Backbiter', txt: 'its last blow cuts behind you' }, drain: { name: 'Bloodprice', txt: 'it strikes far harder, and drinks your blood for it' }, hunger: { name: 'Hungering', txt: 'kills feed you; go long without one and it feeds on you' } };
  const ACURSE = { mail: { name: 'Thirsting', txt: 'turns far more aside, and drinks; what heals you heals by half' }, gauntlets: { name: 'Wrathful', txt: 'your blows land harder, and theirs on you' },
    pants: { name: 'Fleet', txt: 'swift, and each dodge costs you blood' }, waist: { name: 'Girded', txt: 'much more health; the curse takes hold faster' } };
  const eqCurse = (slot) => !!(NG() && save.gear && save.gear.eq && save.gear.eq[slot] && save.gear.eq[slot].curse);
  function maybeCorruptItem(force) {
    if (!NG() || L.itemDone && !force) return false;
    const t = teff(); if (t < 3) return false;
    if (!force && Math.random() > (t >= 4 ? .35 : .2)) return false;
    L.itemDone = true; return corruptItem();
  }
  function corruptItem(which) {
    const c = CS(), opts = [];
    if (P && P.w && window.CURSEDW && CURSEDW.canOffer(P.w)) opts.push('w'); // (the weapon in hand: the Circle offers its black twin on the street, cursedw.js)
    for (const s of GEAR_SLOTS) if (save.gear.eq[s] && !save.gear.eq[s].curse) opts.push(s);
    if (!opts.length) return false;
    const o = which || pick(opts);
    if (o === 'w') { if (!CURSEDW.drop(P.w, P.x + P.facing * 70, P.y)) return false; banner('The Circle offers a weapon', 'A BLACK TWIN OF YOUR ' + WEAPONS[P.w].name.toUpperCase() + ' · STAND IN THE BLACK TO TAKE IT', 2.4); }
    else { const it = save.gear.eq[o]; if (!it) return false; it.curse = o; gearChanged(); banner('Black-Veined ' + SLOT_NAME[o], ACURSE[o].txt.toUpperCase(), 2.4); }
    sfx('growl'); flashT = Math.max(flashT, .08); if (P) burst(P.x, P.y, 50, ['#0A0608', '#4A3A44', '#8A2030'], 24, 'spark', 0, true); persist(); refreshHud(true); return o;
  }
  function cleanseAll() {
    const c = CS(); let n = Object.keys(c.wc).length; c.wc = {};
    for (const s of GEAR_SLOTS) { const it = save.gear.eq[s]; if (it && it.curse) { delete it.curse; n++; } }
    for (const it of save.gear.bag || []) if (it && it.curse) { delete it.curse; n++; }
    gearChanged(); persist(); return n;
  }
  // armor: the upside in its stats, the name shows what it has become
  { const _sf = statsFor; statsFor = function (eq) { const st = _sf(eq); if (!NG()) return st;
    for (const s of GEAR_SLOTS) { const it = eq[s]; if (!it || !it.curse) continue;
      if (s === 'mail') { st.def = (st.def || 0) + itemDef(it) * .8; st.leech = (st.leech || 0) + .03; }
      if (s === 'gauntlets') st.crit = (st.crit || 0) + .06;
      if (s === 'pants') { st.speed = (st.speed || 0) + .1; st.iframes = (st.iframes || 0) + .06; }
      if (s === 'waist') st.hp = (st.hp || 0) + 35; }
    return st; }; }
  { const _in = itemName; itemName = function (it) { const n = _in(it); return it && it.curse ? 'Black-Veined ' + n : n; }; }
  { const _ul = updateLoot; updateLoot = function (dt) { if (!NG() || !eqCurse('mail') || !P) return _ul(dt); const h0 = P.hp, lv = loot.some(k => k.kind === 'heal' || k.kind === 'bigheal'); _ul(dt); if (lv && P.hp > h0) P.hp = h0 + (P.hp - h0) / 2; }; }
  { const _sd = startDodge; startDodge = function () { const r = _sd(); if (NG() && eqCurse('pants') && P && P.state === 'dodge' && P.hp > 1) P.hp = Math.max(1, P.hp - Math.max(1, Math.round(maxHp() * .02))); return r; }; }
  // weapons: the finisher that cuts behind, the hunger
  const isFinisher = (m) => !!(m && m.key && /^[LH]{3,}$/.test(m.key) && WEAPONS[P.w] && !WEAPONS[P.w].tree[m.key + 'L'] && !WEAPONS[P.w].tree[m.key + 'H']);
  function weaponStep(dt) {
    const c = CS(), wc = c.wc[P.w], ac = GEAR_SLOTS.some(s => save.gear.eq[s] && save.gear.eq[s].curse);
    if ((wc || ac) && Math.random() < dt * (wc ? 14 : 6) && parts.length < 380) { // black veins smoking off what he carries
      const atW = wc && Math.random() < .75; parts.push({ x: P.x + P.facing * (atW ? rand(14, 40) : rand(-6, 6)), y: P.y, z: P.z + (atW ? rand(30, 56) : rand(24, 50)), vx: rand(-14, 14), vy: 0, vz: rand(20, 50), life: .7, max: .7, col: pick(['rgba(16,8,20,.75)', 'rgba(70,40,90,.6)', 'rgba(140,30,40,.55)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 }); }
    if (!wc) return;
    if (wc === 'behind' && P.state === 'atk' && isFinisher(P.move)) { const m = P.move, k = P.t / m.dur;
      if (k >= m.h[0] && P.cBackMove !== P.moveId) { P.cBackMove = P.moveId; fx.push({ kind: 'slash', x: P.x - P.facing * 40, y: P.y, z: 40, ang: Math.PI + rand(-.4, .4), t: .3, max: .3, size: 60, col: '#6A4A7A' });
        for (const e of enemies) { if (e.dead) continue; const dx = (e.x - P.x) * -P.facing; if (dx > -6 && dx < (m.x1 || 60) + e.hw + 10 && Math.abs(e.y - P.y) < (m.depth || 18) + 8 && e.z < 70) strike(e, m.dmg * wMult(P.w) * 1.3, -P.facing, Object.assign({}, m, { around: 0 }), true); } } }
    if (wc === 'hunger') { P.cHungry = (P.cHungry || 0) + dt; if (P.cHungry > 4 && waveActive) { P.cHungry = 2.8; if (P.hp > 1) { P.hp = Math.max(1, P.hp - Math.max(1, Math.round(maxHp() * .02))); burst(P.x, P.y, 50, ['#3A1010', '#8A2020'], 4, 'flesh'); } } }
  }
  { const _k2 = killEnemy; killEnemy = function (e, dir, m) { const was = e.dead, r = _k2(e, dir, m); if (NG() && !was && e.dead && P && CS().wc[P.w] === 'hunger' && mine(m || {})) { P.cHungry = 0; P.hp = Math.min(maxHp(), P.hp + Math.round(maxHp() * .03)); } return r; }; }
  // the forge can draw the black out too, at a price. (Weapons: the old in-hand weapon curses (c.wc) and their 'keen' cleanse are
  // folded into the cursed weapons of cursedw.js, which turns any left in a save into one of its own; only armor is cleansed here.)
  // drawing the black out at the forge is dear, one thing at a time, and what comes out of the fire is better than it ever was:
  // armor comes out HALLOWED (well past ordinary armor, with a blessing of its own); a weapon comes out clean and keener (+15%)
  const cleanseCost = (kind) => kind === 'w' ? { s: Math.round(1100 * (1 + .5 * (save.cycle || 0))), g: 8 } : { s: Math.round(1800 * (1 + .5 * (save.cycle || 0))), g: 12 };
  const HALLOW = { mail: { name: 'Hallowed', txt: 'turns aside more than twice what it did, and slowly mends you' }, gauntlets: { name: 'Hallowed', txt: 'blows land true: far more criticals, and they burn the curse' },
    pants: { name: 'Hallowed', txt: 'swifter, and every dodge is a long breath of grace' }, waist: { name: 'Hallowed', txt: 'far more health, and blows that reach you are lessened' } };
  function cleanseOne(kind, key) {
    const c = CS();
    if (kind === 'w') { if (!c.wc[key]) return false; delete c.wc[key]; save.keen = save.keen || {}; save.keen[key] = 1; } // (data.js wMult: +15% for good)
    else { const it = save.gear.eq[key]; if (!it || !it.curse) return false; delete it.curse; it.hallow = key; }
    gearChanged(); persist(); return true;
  }
  // a hallowed piece keeps its blessing in every run after, cursed or not
  { const _sf2 = statsFor; statsFor = function (eq) { const st = _sf2(eq);
    for (const s of GEAR_SLOTS) { const it = eq[s]; if (!it || !it.hallow || it.curse) continue;
      if (s === 'mail') { st.def = (st.def || 0) + itemDef(it) * 1.2 + 10; st.regen = (st.regen || 0) + 1.6; }
      if (s === 'gauntlets') { st.crit = (st.crit || 0) + .12; st.thorns = (st.thorns || 0) + .25; }
      if (s === 'pants') { st.speed = (st.speed || 0) + .16; st.iframes = (st.iframes || 0) + .12; }
      if (s === 'waist') { st.hp = (st.hp || 0) + 70; st.resist = Math.min(.5, (st.resist || 0) + .2); } }
    return st; }; }
  { const _in2 = itemName; itemName = function (it) { const n = _in2(it); return it && it.hallow && !it.curse ? 'Hallowed ' + n : n; }; }
  { const _rf = renderForge; renderForge = function (note) { _rf(note); try { forgeRow(); } catch (e) { console.error(e); } }; }
  function forgeRow() {
    let el = document.getElementById('cForge'); const c = NG() ? CS() : null;
    const items = c ? [...Object.keys(c.wc).filter(w => WEAPONS[w]).map(w => `${WCURSE[c.wc[w]].name} ${WEAPONS[w].name}`), ...GEAR_SLOTS.filter(s => save.gear.eq[s] && save.gear.eq[s].curse).map(s => itemName(save.gear.eq[s]))] : [];
    if (!items.length) { if (el) el.remove(); return; }
    const anchor = document.getElementById('walkBtn'); if (!anchor) return;
    if (!el) { el = document.createElement('div'); el.id = 'cForge'; el.dataset.sec = 'cleanse'; el.style.cssText = 'margin:8px auto;max-width:520px;padding:8px 10px;border:1px solid #5A4A5A;border-radius:6px;background:rgba(20,12,18,.6);color:#E8DCE4;font:13px/1.35 Georgia,serif;text-align:left'; anchor.parentElement.insertBefore(el, anchor); }
    const rows = [...Object.keys(c.wc).filter(w => WEAPONS[w]).map(w => ({ kind: 'w', key: w, name: `${WCURSE[c.wc[w]].name} ${WEAPONS[w].name}`, gain: 'comes out clean and keener: +15% damage, for good' })),
      ...GEAR_SLOTS.filter(s => save.gear.eq[s] && save.gear.eq[s].curse).map(s => ({ kind: 'a', key: s, name: itemName(save.gear.eq[s]), gain: 'comes out HALLOWED: ' + HALLOW[s].txt }))];
    el.innerHTML = `<b style="font-family:Cinzel,Georgia,serif;color:#C8A0B0">BLACK VEINS</b><br><span style="opacity:.8">The smith can draw the black out in the forge-fire, one piece at a time, at a great price; what comes out is better than it ever was.</span>` +
      rows.map((r, i) => { const k = cleanseCost(r.kind), ok = save.shards >= k.s && save.sigils >= k.g; return `<div style="margin-top:6px"><b>${r.name}</b> <span style="opacity:.75">· ${r.gain}</span><br><button type="button" class="buy" data-ci="${i}" ${ok ? '' : 'disabled'}>Cleanse · ${costTxt(k)}</button></div>`; }).join('');
    for (const b of el.querySelectorAll('button[data-ci]')) b.addEventListener('click', () => { const r = rows[+b.dataset.ci], kk = cleanseCost(r.kind); if (save.shards < kk.s || save.sigils < kk.g) return;
      save.shards -= kk.s; save.sigils -= kk.g; if (!cleanseOne(r.kind, r.key)) return; sfx('learned'); flashT = Math.max(flashT, .08);
      renderForge(r.kind === 'w' ? `THE BLACK IS DRAWN OUT OF ${WEAPONS[r.key].name.toUpperCase()}: IT COMES OUT OF THE FIRE KEENER THAN IT WENT IN` : `${itemName(save.gear.eq[r.key]).toUpperCase()}: ${HALLOW[r.key].txt.toUpperCase()}`); });
  }
  // ---------------- the corrupted Pearl: black, wild, and it comes back at him ----------------
  const pearlBlack = () => NG() && teff() >= 4 && !!window.PEARLNG;
  function pearlStep(dt) {
    if (!pearlBlack()) return;
    const O = PEARLNG.O; if (!O || !O.throws) return;
    for (const th of O.throws) { if (th.ghost) continue;
      if (th.phase === 'out') { const n = th.hitOut ? th.hitOut.size : 0; if (n > (th.cN || 0)) { th.cN = n; th.ex += rand(-90, 90); th.ey = clamp(th.ey + rand(-50, 50), FLOOR_TOP + 6, FLOOR_BOT); th.seek = null; sparkBlack(th); } }
      if (th.phase === 'back') {
        if (!th.cRet) { const sd = Math.sign(th.bx - P.x) || th.dir || 1, ly = (Math.random() < .5 ? -1 : 1) * rand(30, 44); th.cRet = { x: clamp(P.x + sd * rand(45, 90), camX + 30, camX + VW - 30), y: P.y + ly < FLOOR_TOP + 8 || P.y + ly > FLOOR_BOT ? P.y - ly : P.y + ly, x0: th.bx, y0: th.by, z0: th.bz }; } // (it turns home wild, toward a point short of him in another lane: he must step into its way)
        const R = th.cRet, u = th.u;
        if (!th.cCaught && !th.cHit) {
          if (u < .78) { const q = sm(u / .78); th.x = lerp(R.x0, R.x, q); th.y = lerp(R.y0, R.y, q); th.z = lerp(R.z0, 30, q); }
          else { const q = sm((u - .78) / .22); th.x = lerp(R.x, P.x, q); th.y = lerp(R.y, P.y, q); th.z = lerp(30, P.z + 40, q); }
          if (Math.abs(th.x - P.x) < 22 && Math.abs(th.y - P.y) < 16 && u > .06 && u < .8) { th.cCaught = true; floatText(P.x, P.y, 90, 'CAUGHT', '#D8C8E8', 12); sfx('hit-crystal'); }
          else if (u >= .93) { th.cHit = true; const d = Math.max(2, Math.round(maxHp() * .08)); playerDamage(d, th.x, false); floatText(P.x, P.y, 96, 'THE PEARL TURNS ON YOU', '#B8A0D0', 11); }
        }
      }
    }
  }
  function sparkBlack(th) { for (let i = 0; i < 8; i++) parts.push({ x: th.x, y: th.y, z: th.z, vx: rand(-120, 120), vy: rand(-20, 20), vz: rand(-40, 120), life: .4, max: .4, col: pick(['#1A0E24', '#5A3A8A', '#C8A0F0']), size: rand(1.5, 3), shape: 'star', rot: 0, vr: 5 }); sfx('hit-crystal', .3); }
  function pearlBlacken(list, t) {
    if (!pearlBlack()) return;
    const O = PEARLNG.O; if (!O) return;
    const dark = (x, y, z, r) => list.push([y + .07, () => { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(14,6,20,.78)'; circle(x, y - z, r * 1.8 + 2); ctx.fill(); ctx.restore();
      onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(46,24,66,.9)'; circle(x, y - z, r * 1.8 + 2); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(150,90,220,${.5 + .3 * Math.sin(t * 7)})`; ctx.lineWidth = 1.2; circle(x, y - z, r * 1.25 + 2.5); ctx.stroke(); ctx.restore(); }); }]);
    if (O.on && !O.throws.length) dark(O.x, O.y, O.z, O.r || 7);
    for (const th of O.throws) { dark(th.x, th.y, th.z, th.r || 7);
      if (th.cRet && !th.cCaught && !th.cHit && th.phase === 'back') { const R = th.cRet; list.push([FLOOR_TOP - 3, () => onMain(() => { // where it will come back: a violet streak on the floor
        ctx.save(); ctx.strokeStyle = `rgba(140,90,210,${.35 + .2 * Math.sin(t * 10)})`; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(R.x0, R.y0); ctx.lineTo(R.x, R.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(140,90,210,.25)'; ell(R.x, R.y, 20, 7); ctx.fill(); ctx.restore(); })]); } }
  }
  // (the Pearl's own art is untouched: the black is laid over it as it is drawn, and the flights bent from here)

  // ======================================================================================================
  // 5. THE BLACK ROAD AND THE CORRUPTED PATTERNS
  // ======================================================================================================
  let ROADC = null, ROADK = 0;
  const ROAD_W = 256;
  function roadStrip(h) { // the road, painted once as a strip that tiles along the street
    if (ROADC && ROADK === K && ROADC.hh === h) return ROADC;
    const S = Math.min(2, K), H = h * 2 + 8, c = document.createElement('canvas'); c.width = Math.ceil(ROAD_W * S); c.height = Math.ceil(H * S); const g = c.getContext('2d'); g.scale(S, S);
    const r = mulberry(1213), edge = (x, s) => s * (h - 1.5 * hsh(x * .37) - 2.2 * Math.sin(x * .09) - 1.2 * Math.sin(x * .23 + 1));
    g.beginPath(); for (let x = 0; x <= ROAD_W; x += 4) g.lineTo(x, 4 + h + edge(x % ROAD_W, -1)); for (let x = ROAD_W; x >= 0; x -= 4) g.lineTo(x, 4 + h + edge((x + 101) % ROAD_W, 1)); g.closePath();
    const gr = g.createLinearGradient(0, 4, 0, H - 4); gr.addColorStop(0, '#1E181E'); gr.addColorStop(.5, '#0C0A0E'); gr.addColorStop(1, '#16121A'); g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 26; i++) { const x = r() * ROAD_W, y = 4 + r() * h * 2; g.fillStyle = `rgba(${r() < .5 ? '60,52,60' : '4,2,6'},${.3 + r() * .4})`; g.beginPath(); g.ellipse(x, y, 4 + r() * 10, 1 + r() * 2, 0, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; for (let i = 0; i < 10; i++) { let x = r() * ROAD_W, y = 4 + r() * h * 2; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += 6 + r() * 10; y += (r() - .5) * 6; g.lineTo(x, y); } g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(120,110,120,.45)'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= ROAD_W; x += 4) g.lineTo(x, 4 + h + edge(x % ROAD_W, -1)); g.stroke();
    c.hh = h; c.S = S; c.H = H; ROADC = c; ROADK = K; return c;
  }
  function makeRoad() { if (!stage) return; const h = 13; L.road = { y: FLOOR_TOP + (FLOOR_BOT - FLOOR_TOP) * rand(.32, .68), h, t: 0 }; L.burns = []; }
  const roadHas = (x) => !L.burns.some(b => x > b.x0 && x < b.x1);
  function roadStep(dt) {
    const R = L.road; if (!R) return; R.t += dt;
    for (const b of L.burns) b.t -= dt; L.burns = L.burns.filter(b => b.t > 0);
    if (window.PEARLNG && PEARLNG.O) for (const th of PEARLNG.O.throws || []) if (Math.abs(th.y - R.y) < R.h + 6 && th.z < 70) burnAt(th.x);
    // its creatures come along it
    if (waveActive && !stage.bossRoom && !L.heart) { L.roadT -= dt; if (L.roadT <= 0) { L.roadT = rand(9, 15); const alive = enemies.filter(e => !e.dead).length;
      if (alive < 6) { const pool = (baseStage.waves || []).flat().map(t => t.replace(/[*!]/g, '')).filter(k => EDEF[k] && EDEF[k].move !== 'fly'); if (pool.length) {
        const side = P.x - camX > VW / 2 ? -1 : 1, e = spawnEnemy(pick(pool), side, false); if (e) { e.cNoCurse = 1; if (!e.cursed) curseFoe(e); e.y = R.y; e.cRoad = 1; e.state = 'idle';
          for (let i = 0; i < 10; i++) parts.push({ x: e.x, y: R.y, z: rand(0, 40), vx: -side * rand(20, 80), vy: 0, vz: rand(10, 50), life: .8, max: .8, col: pick(['rgba(10,6,10,.8)', 'rgba(60,50,60,.6)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); } } } } }
    for (const e of enemies) if (e.cRoad && !e.dead && Math.random() < dt * 8) parts.push({ x: e.x, y: e.y, z: 2, vx: rand(-20, 20), vy: 0, vz: rand(10, 30), life: .6, max: .6, col: 'rgba(16,10,16,.6)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 });
  }
  function burnAt(x) { // a Pearl's throw across it: a stretch burns away for a while
    const b = L.burns.find(b => x > b.x0 - 30 && x < b.x1 + 30);
    if (b) { b.x0 = Math.min(b.x0, x - 46); b.x1 = Math.max(b.x1, x + 46); b.t = 7; }
    else { L.burns.push({ x0: x - 46, x1: x + 46, t: 7 }); if (L.road) for (let i = 0; i < 10; i++) parts.push({ x: x + rand(-40, 40), y: L.road.y + rand(-8, 8), z: 2, vx: rand(-20, 20), vy: 0, vz: rand(40, 90), life: .7, max: .7, col: pick(['#FFFFFF', '#F6E2C8', '#C8E8E0']), size: rand(1.5, 3), shape: 'star', rot: 0, vr: 4 }); }
  }
  function drawRoad(t) { // on the floor, under every figure (screen space: drawBossRoom)
    const R = L.road; if (!R) return; const c = roadStrip(R.h), y0 = R.y - R.h - 4, cam = camX;
    ctx.save();
    if (L.burns.length) { ctx.beginPath(); ctx.rect(-20, y0 - 4, VW + 40, c.H + 8); for (const b of L.burns) ctx.rect(b.x1 - cam, y0 - 4, -(b.x1 - b.x0), c.H + 8); ctx.clip('evenodd'); }
    const ox = -(((cam % ROAD_W) + ROAD_W) % ROAD_W);
    for (let x = ox; x < VW + ROAD_W; x += ROAD_W) ctx.drawImage(c, x, y0, ROAD_W, c.H);
    if (!lite()) { ctx.globalCompositeOperation = 'lighter'; for (let x = ox; x < VW + ROAD_W; x += 64) { const w = Math.floor((x - ox + cam) / 64), a = .18 + .14 * Math.sin(t * 2.3 + w * 1.7); ctx.fillStyle = `rgba(180,30,40,${a})`; ctx.fillRect(x + hsh(w) * 50, R.y - 1 + (hsh(w + 3) - .5) * R.h, 10 + hsh(w + 1) * 18, 1.4); } }
    ctx.restore();
    for (const b of L.burns) { const a = Math.min(1, b.t / 1.5); for (const ex of [b.x0, b.x1]) { const x = ex - cam; if (x < -20 || x > VW + 20) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, R.y, 0, x, R.y, 22); g.addColorStop(0, `rgba(240,230,210,${.45 * a})`); g.addColorStop(1, 'rgba(240,230,210,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, R.y - 22, 44, 44); ctx.restore(); } }
  }
  // ---------------- Rebma's reversed Pattern: it flickers black, skips lines, and its dark stretches burn ----------------
  const patCursed = () => NG() && teff() >= 2;
  const DARK = [[.4, .95], [2.3, 2.85], [4.1, 4.7]];
  if (window.W7 && W7.drawPattern) { const _dp = W7.drawPattern; W7.drawPattern = function (cx, cy, rot, a, lit, t) {
    _dp(cx, cy, rot, a, lit, t); if (!patCursed()) return;
    const R = W7.PAT_R || 300, fl = Math.sin(t * 23) > .55 ? 1 : 0; ctx.save(); ctx.translate(cx, cy); ctx.scale(1, W7.PAT_SQ || .17); ctx.rotate(rot);
    for (const [a0, a1] of DARK) { const pulse = .7 + .25 * Math.sin(t * 3 + a0); ctx.fillStyle = `rgba(4,2,8,${(.72 + .2 * fl) * pulse * a})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R + 10, a0, a1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(200,36,48,${(.6 + .3 * Math.sin(t * 5 + a0)) * a})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(Math.cos(a0) * 30, Math.sin(a0) * 30); ctx.lineTo(Math.cos(a0) * (R + 6), Math.sin(a0) * (R + 6)); ctx.arc(0, 0, R + 6, a0, a1); ctx.lineTo(Math.cos(a1) * 30, Math.sin(a1) * 30); ctx.stroke();
      for (let k = 0; k < 9; k++) { const u = hsh(a0 * 10 + k), aa = lerp(a0, a1, hsh(k + a1)), rr = 40 + u * (R - 40), q = Math.max(0, Math.sin(t * 4 + k * 1.7)); ctx.fillStyle = `rgba(230,60,60,${.7 * q * a})`; ctx.beginPath(); ctx.arc(Math.cos(aa) * rr, Math.sin(aa) * rr, 5, 0, TAU); ctx.fill(); } }
    if (Math.sin(t * 7.3) > .82) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(0, 0, R + 10, 0, TAU); ctx.fill(); }
    ctx.restore(); }; }
  // ---------------- Tir-na Nog'th's Pattern runs backward in places ----------------
  const MOON_REV = [1, 3, 5];
  function moonPattern(t) {
    const x0 = ((camX % AW_W) + AW_W) % AW_W, R = 250, ry = .2, cy = FLOOR_TOP + 58;
    ctx.save(); ctx.lineCap = 'round';
    for (const tile of [0, AW_W]) { const cx = 690 + tile - x0; if (cx < -R - 40 || cx > VW + R + 40) continue;
      for (const i of MOON_REV) { const r = R * (1 - i * .12), gap = i * 1.9 + .6, gw = .32;
        ctx.strokeStyle = 'rgba(10,4,18,.7)'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * ry, 0, gap + gw, gap + TAU - gw); ctx.stroke();
        ctx.strokeStyle = `rgba(190,90,255,${.75 + .2 * Math.sin(t * 9 + i)})`; ctx.lineWidth = 2.2; ctx.setLineDash([12, 12]); ctx.lineDashOffset = t * 40; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * ry, 0, gap + gw, gap + TAU - gw); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.restore();
  }
  function patternStep(dt) {
    if (!patCursed() || !stage) return;
    if (stage.theme === 'rebmaBoss' && window.W7) { // standing on a dark stretch of the reversed Pattern hurts
      const Lx = lockX !== null ? lockX : stage.len - VW, cx = Lx + VW / 2, cy = (FLOOR_TOP + FLOOR_BOT) / 2 + 4, rot = (W7.G && W7.G.patRot) || 0, sq = W7.PAT_SQ || .17;
      const dx = P.x - cx, dy = (P.y - cy) / sq, r = Math.hypot(dx, dy); let a = Math.atan2(dy, dx) - rot; a = ((a % TAU) + TAU) % TAU;
      const on = r < (W7.PAT_R || 300) && P.z < 10 && DARK.some(([a0, a1]) => a > a0 && a < a1);
      if (on) { L.patT = (L.patT || 0) - dt; if (L.patT <= 0) { L.patT = .6; const d = Math.max(1, Math.round(maxHp() * .035)); if (P.hp - d <= 0) playerDamage(d, P.x, false); else { P.hp -= d; floatText(P.x, P.y, 70, '-' + d, '#B060D0', 12); } burst(P.x, P.y, 6, ['#0A0410', '#6A2A8A'], 6, 'spark'); } }
      else L.patT = .2;
    }
    if (stage.theme === 'moonBoss') { // a reversed ring of the ghost Pattern carries him back the wrong way
      const x0 = ((camX % AW_W) + AW_W) % AW_W, cy = FLOOR_TOP + 58;
      for (const tile of [0, AW_W]) { const cxS = 690 + tile - x0, cxW = cxS + camX, dx = P.x - cxW, dy = (P.y - cy) / .2, rr = Math.hypot(dx, dy);
        for (const i of MOON_REV) { const r = 250 * (1 - i * .12); if (Math.abs(rr - r) < 14 && P.z < 8) { const a = Math.atan2(dy, dx), tx = Math.sin(a), ty = -Math.cos(a) * .2; P.x += tx * 60 * dt; P.y = clamp(P.y + ty * 60 * dt, FLOOR_TOP + 6, FLOOR_BOT); } } }
    }
  }
  // ---------------- the Pattern Arrows' fire turns black-violet, and can arc back ----------------
  { const _dap = drawArrowProj; drawArrowProj = function (p) { _dap(p); if (!patCursed() || !p || p.shard || (p.arrow | 0) < 7) return;
    const ang = Math.atan2(p.vz || 0, Math.abs(p.vx)); ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.scale(Math.sign(p.vx) || 1, 1); ctx.rotate(-ang);
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(40,10,60,.62)'; ctx.fillRect(-34, -5.5, 52, 11); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(150,70,220,${.6 + .3 * Math.sin(performance.now() / 70)})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(13, 0); ctx.stroke(); ctx.restore(); }; }
  { const _df = drawFx; drawFx = function (f) { if (patCursed() && f.kind === 'bolt' && (f.col === '#6AA8FF' || f.cBack)) { const c0 = f.col; f.col = '#3A1050'; _df(f); f.col = c0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(170,80,240,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f.x, f.y - f.z); ctx.lineTo(f.x2, f.y2 - f.z2); ctx.stroke(); ctx.restore(); return; } return _df(f); }; }
  { const _ah = arrowHit; arrowHit = function (p) { const first = !p.struck, n0 = fx.length, r = _ah(p);
    if (patCursed() && first && p.struck && p.chain && (p.arrow | 0) >= 7 && fx.slice(n0).some(f => f.kind === 'bolt') && Math.random() < .3 && P && P.state !== 'dead') { // the fire arcs back at the archer
      fx.push({ kind: 'bolt', x: p.x, y: p.y, z: p.z, x2: P.x, y2: P.y, z2: P.z + 40, t: .25, max: .25, col: '#3A1050', seed: Math.random() * 99, cBack: 1 }); hitHim(Math.max(2, Math.round(maxHp() * .05)), 'THE FIRE TURNS', p.x); }
    return r; }; }

  // ======================================================================================================
  // 6. THE ENDGAME: THE CIRCLE TAKES THE LAST WORLD, AND ITS HEART
  // ======================================================================================================
  // ---------------- every lord of a world, corrupted (New Game+, once Lorraine has fallen) ----------------
  // From the moment it appears the Circle is in it: grey, the Circle's mark and red-black veins, its arena ringed in black
  // under the Circle in the sky, its title card naming it. It gains the Circle's attacks, each telegraphed (the ring closes
  // on it and its mark flares, the ground is marked, then it strikes) and scaled to it. After each one its mark lies open:
  // strike it (or land the Pearl) and the curse burns back, a few seconds of extra damage with a stagger. The tier sets how
  // much: 0-1 its own corrupted attack and one of the Circle's, slowly; 2-3 faster, more of them, and a shadow double that
  // echoes its attacks a beat later from his other side; 4 everything, and at a quarter of its health the corruption surges.
  // Reaching the last world past HIGH_END (finalHigh) it fights as tier 3 at least, and the heart of the curse follows.
  // Beaten without a death to it this cycle, the curse eases more; a death to it feeds the curse.
  const BFAM = { mossback: { atk: 'grasp', word: 'THE BLACK ROOTS' }, colossus: { atk: 'close', word: 'THE CIRCLE TIGHTENS' }, wyrm: { atk: 'fall', word: 'BLACK GLASS FALLS' },
    tyiga: { atk: 'cring', word: 'THE CIRCLE OPENS' }, sleeper: { atk: 'close', word: 'THE NIGHTMARE CLOSES' }, benedict: { atk: 'beam', word: 'A BLACK CUT' },
    w7king: { atk: 'spike', word: 'BLACK GLASS RISES' }, w8goat: { atk: 'grasp', word: 'THE HANDS OF THE CIRCLE' } };
  const B_ALL = ['cring', 'grasp', 'close', 'fall', 'spike', 'beam'];
  const B_CAD = [[8, 10], [7.5, 9.5], [5.8, 7.2], [5.2, 6.6], [4.4, 5.6]];
  const B_BUSY = ['enter', 'dying', 'down', 'w5morph', 'w8morph'];
  const B_ECHO = ['ring', 'spike', 'fall', 'beam', 'mine', 'cring', 'cgrasp', 'cclose'];
  const B_LUNGE = ['strike', 'dash', 'pounce', 'leap', 'charge'];
  const bTier = () => finalHigh() ? Math.max(3, tier()) : tier();
  const noStun = (e) => e.def === BOSSES.sleeper || e.def === BOSSES.w7king; // (their fights are run by their arenas' rules, not by their own step)
  const canHit = (e) => e.def !== BOSSES.w7king || !window.W7 || !W7.kingVuln || !!W7.kingVuln(e);
  // (the Sleeper is struck through its crutches while it dreams: a blow on one, with its mark open, counts on the mark)
  const markOf = (e) => e && e.cB ? e : e && e.type === 'w6crutch' && boss && boss.cB && boss.def === BOSSES.sleeper && !boss.dead ? boss : null;
  function bossInit(e) {
    const fam = BFAM[e.type] || { atk: 'cring', word: 'THE CIRCLE ANSWERS' }, bt = bTier();
    e.cursed = true; e.cid = e.cid || Math.random();
    e.hp = e.maxHp = Math.round(e.maxHp * 1.08);
    const set = bt >= 4 ? B_ALL.slice() : bt >= 2 ? [fam.atk, 'cring', fam.atk === 'grasp' ? 'close' : 'grasp'] : [fam.atk, fam.atk === 'cring' ? 'grasp' : 'cring'];
    e.cB = { bt, fam, set: [...new Set(set)], n: 0, age: 0, wind: 0, k: null, open: 0, pts: 0, burn: 0, stun: 0, surge: false, fired: 0, burns: 0, echoes: 0, named: false, titled: false, hint: false,
      dbl: bt >= 2 ? { x: e.x, y: e.y, a: 0, q: [], last: -9, flash: 0, lash: 0 } : null };
    e.cBossT = rand(4.5, 6);
  }
  function bossBusy(e) {
    if (e.dead || B_BUSY.includes(e.state) || e.w4shift > 0 || e.plan === 'roar' || e.ent || e.cB.age < 3.5 || !P || P.state === 'dead' || stillT > 0 || busy()) return true;
    if (e.def === BOSSES.sleeper && window.W6 && W6.B && !['asleep', 'down', 'board', 'waking'].includes(W6.B.mode)) return true;
    return false;
  }
  function bossStep(e, dt) {
    const B = e.cB; B.age += dt;
    if (!B.named && boss === e) { B.named = true; const el = document.getElementById('bossname'); if (el && !/Corrupted/.test(el.textContent)) el.textContent = e.def.name + ' · Corrupted'; }
    if (canHit(e)) B.open = Math.max(0, B.open - dt); B.burn = Math.max(0, B.burn - dt); // (the mark waits while the fight's own rules shut him out)
    if (B.open <= 0 && B.pts > 0) B.pts = Math.max(0, B.pts - dt * .5);
    if (B.bt >= 4 && !B.surge && e.hp <= e.maxHp * .25) { B.surge = true; floatText(e.x, e.y - e.z, e.hh + 60, 'THE CORRUPTION SURGES', '#E8C8D0', 16); sfx('roar'); shakeMag = Math.max(shakeMag, 10); flashT = Math.max(flashT, .1);
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .7, max: .7, r: 170, col: '#200810', flat: 1 }); e.cBossT = Math.min(e.cBossT, 1.2); }
    if (B.dbl) dblStep(e, dt);
    if (B.wind > 0) { B.wind -= dt; if (B.wind <= 0) bossFire(e, B.k); return; }
    if (B.burn > 0 || bossBusy(e)) return;
    e.cBossT -= dt; if (e.cBossT > 0) return;
    const c = B_CAD[B.bt]; e.cBossT = rand(c[0], c[1]) * (B.surge ? .78 : 1);
    B.k = B.set[B.n++ % B.set.length]; B.wind = .8;
    floatText(e.x, e.y - e.z, e.hh + 44, B.k === B.fam.atk ? B.fam.word : 'THE CIRCLE ANSWERS', '#C8C2CC', 12); sfx('growl');
  }
  function bossFire(e, k) {
    const B = e.cB, d = (m) => Math.max(4, Math.round(edmg(e) * m)), lo = leftWall() + 24, hi = rightWall() - 24, yy = (y) => clamp(y, FLOOR_TOP + 8, FLOOR_BOT);
    const put = (h) => { h.cMine = 1; h.cTag = 1; hazards.push(h); return h; };
    if (e.dead || !P || P.state === 'dead') return;
    if (k === 'cring') put({ kind: 'cring', x: e.x, y: e.y, r: 0, speed: 230 + 15 * B.bt, delay: .5, dmg: d(.55), t: 99 });
    else if (k === 'grasp') { const n = B.bt >= 4 ? 5 : B.bt >= 2 ? 4 : 3; for (let i = 0; i < n; i++) { const t = .9 + i * .22; put({ kind: 'cgrasp', x: clamp(P.x + (i ? rand(-60, 60) : 0), lo, hi), y: yy(P.y + (i ? rand(-18, 18) : 0)), r: 26, t, max: t, dmg: d(.5) }); } }
    else if (k === 'close') put({ kind: 'cclose', x: clamp(P.x, lo, hi), y: yy(P.y), r0: 150, r1: 44, r: 150, t: 1.6, max: 1.6, dmg: d(.6) });
    else if (k === 'fall') { const n = B.bt >= 2 ? 4 : 3; for (let i = 0; i < n; i++) { const t = .95 + i * .2; put({ kind: 'fall', x: clamp(P.x + rand(-55, 55), lo, hi), y: yy(P.y + rand(-16, 16)), r: 24, t, max: t, dmg: d(.5), col: '60,40,56' }); } }
    else if (k === 'spike') { const s = Math.sign(P.x - e.x) || 1; for (let i = 0; i < 6; i++) { const t = .75 + i * .09; put({ kind: 'spike', x: clamp(e.x + s * (40 + i * 36), lo, hi), y: yy(e.y + (P.y - e.y) * (i + 1) / 6), r: 18, t, max: t, dmg: d(.5), col: '70,50,66' }); } }
    else if (k === 'beam') put({ kind: 'beam', y: yy(P.y), t: 1.25, max: 1.25, dmg: d(.6), col: '120,30,50' });
    B.fired++; B.open = 3; e.sqx = 1.12; e.sqy = .92;
    if (!B.hint) { B.hint = true; floatText(e.x, e.y - e.z, e.hh + 72, 'ITS MARK LIES OPEN · STRIKE IT', '#F0D0C8', 12); }
  }
  function burnBack(e) {
    const B = e.cB; B.pts = 0; B.open = 0; B.wind = 0; B.burn = 4; B.burns++;
    if (!noStun(e) && !B_BUSY.includes(e.state) && !(e.w4shift > 0)) B.stun = .8;
    e.flash = .2; e.jit = .3; hitstop = Math.max(hitstop, .1); shakeMag = Math.max(shakeMag, 8); sfx('hit-crystal'); sfx('growl');
    floatText(e.x, e.y - e.z, e.hh + 60, 'THE CURSE BURNS BACK', '#FFF0D0', 15);
    burst(e.x, e.y, e.z + e.hh * .55, ['#FFFFFF', '#FFE6B0', '#8A2030', '#1A1014'], 24, 'spark', 0, true);
    for (const h of hazards) if (h.cMine && h.kind === 'cclose' && !h.done) { h.done = true; h.t = -1; }
    e.cBossT = Math.max(e.cBossT, 5.5);
  }
  HAZARD_FX.cclose = { // the Circle's ring closing on him where he stood: get out of it before it shuts
    update(h) { const k = 1 - Math.max(0, h.t) / h.max; h.r = lerp(h.r0, h.r1, sm(k));
      if (h.t <= 0 && !h.done) { h.done = true; if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r1 + 6 && P.z < 20) playerDamage(h.dmg, h.x, true);
        burst(h.x, h.y, 6, ['#0A0608', '#4A3A44', '#A02030'], 16, 'rock', 0, true); fx.push({ kind: 'ring', x: h.x, y: h.y, z: 2, t: .35, max: .35, r: h.r1 * 1.5, col: '#2A0A12', flat: 1 }); shakeMag = Math.max(shakeMag, 7); sfx('crunch'); } },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max, a = h.done ? Math.max(0, 1 + h.t / .4) : 1; if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = `rgba(90,10,20,${.08 + .3 * k})`; ell(h.x, h.y, h.r1, h.r1 * .3); ctx.fill();
      ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(230,120,120,${.5 + .3 * Math.sin(t * 16)})`; ctx.lineWidth = 1.3; ell(h.x, h.y, h.r1, h.r1 * .3); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(8,4,8,.88)'; ctx.lineWidth = 9; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke();
      ctx.strokeStyle = `rgba(180,30,44,${.6 + .3 * Math.sin(t * 12)})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke(); ctx.restore(); } };
  // ---------------- the shadow double: it stands on his other side and gives back the lord's last attack a beat later ----------------
  function dblStep(e, dt) {
    const D = e.cB.dbl, lo = leftWall() + 30, hi = rightWall() - 30, k = Math.min(1, dt * 2.5);
    D.x += (clamp(2 * P.x - e.x, lo, hi) - D.x) * k; D.y += (clamp(e.y, FLOOR_TOP + 6, FLOOR_BOT) - D.y) * k;
    D.a += ((e.cB.burn > 0 || e.cB.age < 2 ? .2 : 1) - D.a) * Math.min(1, dt * 3); D.flash = Math.max(0, D.flash - dt); D.lash = Math.max(0, D.lash - dt);
    let found = null, spots = null, lash = false;
    for (const h of hazards) { if (h.cTag) continue; h.cTag = 1; if (h.cMine || h.cEcho) continue;
      if (B_ECHO.includes(h.kind)) { if (h.t > .2 && h.t < 100) (found || (found = [])).push(h); }
      else if (typeof h.x === 'number' && typeof h.y === 'number' && Number.isFinite(h.x) && Number.isFinite(h.y)) (spots || (spots = [])).push(h);
      else lash = true; } // (a lord's own kind of attack: the shadow answers where it struck with the Circle's hands, or, where it has no place, with a lunge of its own)
    if (found) echoQueue(e, found, false);
    else if (spots) echoQueue(e, spots.slice(0, 3).map(h => ({ kind: 'cgrasp', x: h.x, y: clamp(h.y, FLOOR_TOP + 8, FLOOR_BOT), r: 26, t: .85, max: .85, dmg: Math.max(4, Math.round(edmg(e) * .65)) })), false);
    else if (lash) echoQueue(e, [], true);
    for (const q of D.q) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true; echoFire(e, q); } }
    if (D.q.length) D.q = D.q.filter(q => !q.done);
  }
  function echoQueue(e, hs, melee) {
    const B = e.cB, D = B.dbl, T = now(); if (!D || T - D.last < (B.bt >= 4 ? 1.3 : 1.8) || B.burn > 0 || B.age < 3 || !P || P.state === 'dead') return;
    D.last = T; const lo = leftWall() + 24, hi = rightWall() - 24, cx = P.x;
    const clones = hs.slice(0, 6).map(h => { const c = Object.assign({}, h); c.cEcho = 1; c.cTag = 1; c.hit = false; c.done = false; c.fired = false;
      if (typeof c.x === 'number') c.x = clamp(2 * cx - h.x, lo, hi); if (typeof c.dmg === 'number') c.dmg = Math.max(2, Math.round(c.dmg * .6)); return c; });
    D.q.push({ t: .6, clones, melee });
  }
  function echoFire(e, q) {
    const D = e.cB.dbl; if (e.dead || e.cB.burn > 0 || !P) return;
    D.flash = .35; e.cB.echoes++;
    for (const c of q.clones) hazards.push(c);
    if (q.melee) { const s = Math.sign(P.x - D.x) || 1, reach = Math.min(110, e.hw * .7 + 60); D.lash = .3; sfx('swing');
      fx.push({ kind: 'slash', x: D.x + s * 34, y: D.y, z: 50, ang: s > 0 ? 0 : Math.PI, t: .3, max: .3, size: 70, col: '#3A1A2A' });
      if (Math.abs(P.x - D.x) < reach && Math.abs(P.y - D.y) < 26 && P.z < 44 && P.state !== 'dead') playerDamage(Math.max(3, Math.round(edmg(e) * .5)), D.x, false); }
    if (rl('dblTxt', 6)) floatText(D.x, D.y, e.hh + 30, 'ITS SHADOW ANSWERS', '#B8A8C0', 11);
  }
  let DBL_DRAW = false; // (the shadow is drawn through every hand that draws its lord, but without the lord's own marks)
  function drawDouble(e, D, t) {
    const warn = D.q.length ? 1 : 0, a = D.a * (.5 + .25 * warn + (D.flash > 0 ? .2 : 0)), cy = D.y - e.z - e.hh * (e.size || 1) * .55;
    ctx.save(); ctx.fillStyle = `rgba(0,0,0,${.25 * D.a})`; ell(D.x, D.y, e.hw * .8, 6); ctx.fill(); ctx.restore();
    { const sx = e.x, sy = e.y, sf = e.facing, fl = e.flash, tt = TINT; e.x = D.x; e.y = D.y; e.facing = Math.sign(P.x - D.x) || -sf; e.flash = 0;
      ctx.save(); ctx.globalAlpha *= a; TINT = '#140A12'; DBL_DRAW = true; try { drawEnemy(e, t); } catch (err) { console.error(err); } finally { DBL_DRAW = false; TINT = tt; ctx.restore(); e.x = sx; e.y = sy; e.facing = sf; e.flash = fl; } }
    if (warn || D.lash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(D.x, cy, 0, D.x, cy, 40); g.addColorStop(0, `rgba(220,40,50,${.5 * D.a})`); g.addColorStop(1, 'rgba(220,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(D.x - 40, cy - 40, 80, 80); ctx.restore(); }
    if (!ownCurse(e)) circleMark(D.x, cy, 6, t);
  }
  // ---------------- the curse drawn as a lord's own body (window.CURSE_ART) ----------------
  // A lord whose def says ownCurse (BOSSES.x.ownCurse = true) draws its corruption itself, inside its own drawing: its parts
  // transform as its phases pass and as the curse deepens, and its weak point is one of its own parts that opens when the
  // mark lies open and burns back gold when struck. The generic overlay (curseHalo, curseBody) and the sigil (bossMark)
  // are skipped for it; only the closing ring on the ground as its attack winds stays (markWind).
  // look(e) gives what the art needs, null when it is not corrupted:
  //   bt (tier 1-4), d (depth 0..1, past 1 in the surge), g (spread on its entrance 0..1), wind (0..1 as its attack winds),
  //   open (0..1, eased in when the mark opens and out as it shuts), burn (0..1: 1 when struck, fading), flare (0..1 the
  //   first instant of the burn), pts/need (blows landed / wanted), surge, det (fine detail allowed), lite (cheap paint).
  // morph(e, ph) gives 0..1 since its last phase change (0 just now, 1 settled), for the transformations to grow in.
  const ownCurse = (e) => !!(e && e.def && e.def.ownCurse);
  const VEINS = new Map();
  const VOID = '#070309';
  const CA = window.CURSE_ART = {
    look(e) {
      const B = e && e.cB; if (!B || !e.cursed || !NG()) return null; const T = now(), op = B.open > 0 && !(B.burn > 0);
      if (op && !B.aOt) B.aOt = T; if (!op) B.aOt = 0;
      return { bt: B.bt | 0, d: B.surge ? 1.15 : [0, .35, .58, .8, 1][Math.min(4, B.bt | 0)], g: sm(B.age / 2.6), wind: B.wind > 0 ? sm(1 - B.wind / .8) : 0,
        open: op ? sm((T - B.aOt) / .3) * Math.min(1, B.open / .45) : 0, burn: B.burn > 0 ? B.burn / 4 : 0, flare: B.burn > 3.4 ? (B.burn - 3.4) / .6 : 0,
        pts: B.pts | 0, need: B.bt >= 4 ? 4 : 3, surge: !!B.surge, T, det: !FLASH && !TINT && !LITE, lite: lite() || !!LITE };
    },
    morph(e, ph) { const T = now(); if (e.aPh === undefined || ph < e.aPh) { e.aPh = ph; e.aPt = -99; } if (ph > e.aPh) { e.aPh = ph; e.aPt = T; } return sm((T - e.aPt) / 1.4); },
    mix: (a, b, k) => awMixSafe(a, b, cl01(k)),
    sm, hsh, VOID,
    // the way the player lies, in the lord's own drawing (its x is mirrored by its facing): -1 / 1
    toward(e) { return !P || !e || e.x === undefined ? 1 : Math.sign((P.x - e.x) * (e.facing || 1)) || 1; },
    // the weak point's light: an ember while shut, flaring as it winds, white-hot (with the blows still wanted, as sparks
    // round it) while open, gold as it burns back. r is the size of the part it lives in.
    core(x, y, r, L, o) {
      if (!L || FLASH) return; o = o || {}; const t = L.T, p = .5 + .5 * Math.sin(t * 9), op = L.open, bu = L.burn, w = L.wind, det = !TINT;
      ctx.save();
      if (TINT) { ctx.restore(); return; }
      ctx.globalCompositeOperation = 'lighter';
      const k = Math.max(.25 + .25 * w, op), R = r * (1.4 + 1.9 * op + .6 * w + 1.6 * bu) * (o.reach || 1);
      { const g = ctx.createRadialGradient(x, y, 0, x, y, R), c = bu > 0 ? '255,196,96' : '255,44,40';
        g.addColorStop(0, `rgba(${c},${Math.min(1, (bu > 0 ? .5 + .5 * bu : .3 + .5 * k) * (.82 + .18 * p))})`); g.addColorStop(.35, `rgba(${c},${(bu > 0 ? .25 * bu : .14 * k + .1 * op)})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
      if ((op > .05 || bu > .05) && !L.lite) { // its light breaking out of it in rays, turning slowly
        const n = 7, a0 = t * .5, s = Math.max(op, bu); ctx.fillStyle = bu > 0 ? `rgba(255,226,150,${.5 * s})` : `rgba(255,170,150,${.38 * s * (.75 + .25 * p)})`; ctx.beginPath();
        for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU + hsh(i + 4) * .6, l = r * (2 + 1.6 * hsh(i + 9) + .5 * Math.sin(t * 5 + i)) * (o.reach || 1), wd = .07 + .05 * hsh(i);
          ctx.moveTo(x + Math.cos(a - wd) * r * .4, y + Math.sin(a - wd) * r * .4); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.lineTo(x + Math.cos(a + wd) * r * .4, y + Math.sin(a + wd) * r * .4); }
        ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      { const hr = r * (.28 + .1 * w + .34 * op + .3 * bu) * (o.coreR || 1), g = ctx.createRadialGradient(x, y, 0, x, y, hr);
        if (bu > 0) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, '#FFE6A0'); g.addColorStop(1, `rgba(230,150,40,${.6 + .4 * bu})`); }
        else if (op > 0) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(.4, '#FFD2B0'); g.addColorStop(1, 'rgba(232,40,40,.9)'); }
        else { g.addColorStop(0, `rgb(${200 + 55 * p | 0},${60 + 50 * w | 0},${50 + 30 * w | 0})`); g.addColorStop(1, 'rgba(110,10,20,.0)'); }
        ctx.fillStyle = g; circle(x, y, hr); ctx.fill(); }
      if (op > .3 && det) { // the blows it still wants: sparks circling it
        const left = Math.max(0, L.need - L.pts); for (let i = 0; i < left; i++) { const a = t * 2.2 + i / L.need * TAU, rr = r * 1.7 * (o.reach || 1), sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * .8, s = 2.2;
          ctx.fillStyle = '#FFF0D8'; ctx.beginPath(); ctx.moveTo(sx, sy - s * 1.4); ctx.lineTo(sx + s * .7, sy); ctx.lineTo(sx, sy + s * 1.4); ctx.lineTo(sx - s * .7, sy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(90,10,16,.9)'; ctx.lineWidth = .7; ctx.stroke(); } }
      ctx.restore();
    },
    // a lens-shaped wound in it (a split shell, a crack in a face, a torn robe): shut it is a dark seam, open it parts on
    // the void with the heart's light in it, struck it pours gold. len along ang; w0 shut, w1 open (half-widths).
    wound(x, y, len, ang, w0, w1, L, o) {
      o = o || {}; const op = L ? L.open : 0, bu = L ? L.burn : 0, wd = (w0 + (w1 - w0) * Math.max(op, bu * .6)) * (1 + .25 * (L ? L.wind : 0)), n = 9, t = L ? L.T : 0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const P = []; for (let i = 0; i <= n; i++) { const u = i / n, j = (hsh(i * 3 + (o.seed || 0)) - .5) * len * .07; P.push([(u - .5) * len, j, Math.pow(Math.sin(Math.PI * u), .8)]); }
      const lens = (k) => { ctx.beginPath(); for (const q of P) ctx.lineTo(q[0], q[1] - wd * q[2] * k); for (let i = P.length - 1; i >= 0; i--) ctx.lineTo(P[i][0], P[i][1] + wd * q2(i) * k); ctx.closePath(); };
      const q2 = (i) => P[i][2] * (o.under || .8);
      if (o.lip && wd > .6) { lens(1.35); ctx.fillStyle = C(o.lip); ctx.fill(); if (!FLASH && !TINT) { ctx.strokeStyle = o.lipLt || 'rgba(255,240,220,.35)'; ctx.lineWidth = .8; ctx.stroke(); } }
      lens(1); ctx.fillStyle = C(VOID); ctx.fill();
      if (!FLASH && !TINT && wd > .5) {
        ctx.save(); lens(1); ctx.clip();
        if (o.heart) o.heart(wd, L); // (the thing inside, in the wound's own space)
        const c = bu > 0 ? '255,210,120' : '235,40,44', a = bu > 0 ? .5 + .5 * bu : .25 + .35 * (L ? Math.max(L.wind, op) : 0) + .15 * Math.sin(t * 4 + (o.seed || 0));
        ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = Math.max(.6, wd * .35); ctx.beginPath(); for (const q of P) ctx.lineTo(q[0], q[1] - wd * q[2] * .78); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1] + wd * q2(i) * .78); ctx.stroke();
        ctx.restore();
      }
      lens(1); ctx.strokeStyle = C(o.ink || '#0A0508'); ctx.lineWidth = o.ow || 1; ctx.stroke();
      ctx.restore();
      if (L && (op > .02 || bu > .02 || L.wind > 0 || o.ember)) CA.core(x, y, Math.max(len * .32, 5), L, o);
    },
    // a crack opened in it: a black wedge widest at its middle with the void's light down in it (gold as it burns back)
    crack(q, w, L, o) {
      o = o || {}; const n = q.length / 2; if (n < 2) return; const bu = L ? L.burn : 0, t = L ? L.T : 0;
      ctx.beginPath(); for (let i = 0; i < n; i++) { const j = Math.min(n - 2, i), dx = q[j * 2 + 2] - q[j * 2], dy = q[j * 2 + 3] - q[j * 2 + 1], l = Math.hypot(dx, dy) || 1, ww = w * Math.sin(Math.PI * i / (n - 1)); ctx.lineTo(q[i * 2] - dy / l * ww, q[i * 2 + 1] + dx / l * ww); }
      for (let i = n - 1; i >= 0; i--) { const j = Math.min(n - 2, i), dx = q[j * 2 + 2] - q[j * 2], dy = q[j * 2 + 3] - q[j * 2 + 1], l = Math.hypot(dx, dy) || 1, ww = w * Math.sin(Math.PI * i / (n - 1)) * .7; ctx.lineTo(q[i * 2] + dy / l * ww, q[i * 2 + 1] - dx / l * ww); }
      ctx.closePath(); ctx.fillStyle = C(VOID); ctx.fill();
      if (FLASH || TINT || w < .5) return;
      if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = .5; ctx.stroke(); }
      const c = bu > 0 ? '255,214,130' : o.rgb || '235,46,44', a = (bu > 0 ? .9 : (o.a ?? .6)) * (.75 + .25 * Math.sin(t * 4 + (o.seed || q[0])));
      ctx.beginPath(); ctx.moveTo(q[2], q[3]); for (let i = 2; i < n - 1; i++) ctx.lineTo(q[i * 2], q[i * 2 + 1]); ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = Math.max(.5, w * .3); ctx.stroke();
    },
    // an eye that opens in it: k how open (0..1), r its half-length, look -1..1 (toward the player), lid its skin
    eye(x, y, r, k, o) {
      o = o || {}; if (k <= .02) { if (o.lid) { ctx.strokeStyle = C(shade(o.lid, -.5)); ctx.lineWidth = Math.max(.6, r * .14); ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * .25, x + r, y); ctx.stroke(); } return; }
      const t = o.t || 0, blink = o.blink !== false && ((t + (o.seed || 0) * 3.7) % (4.6 + (o.seed || 0) % 2)) < .14, h = r * .62 * k * (blink ? .1 : 1), rot = o.rot || 0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      const al = () => { ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r * .1, -h * 1.5, r, 0); ctx.quadraticCurveTo(r * .1, h * 1.3, -r, 0); ctx.closePath(); };
      if (o.lid) { ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, Math.max(h * 1.25, r * .3), 0, 0, TAU); ctx.fillStyle = C(o.lid); ctx.fill(); }
      al(); ctx.fillStyle = C(o.white || '#D8CDB4'); ctx.fill();
      if (!FLASH && !TINT) {
        ctx.save(); al(); ctx.clip();
        const lx = (o.look || 0) * r * .32, ir = r * .5, g = ctx.createRadialGradient(lx, 0, 0, lx, 0, ir); g.addColorStop(0, o.iris2 || '#FF6A40'); g.addColorStop(.6, o.iris || '#B01820'); g.addColorStop(1, '#3A0408'); ctx.fillStyle = g; circle(lx, 0, ir); ctx.fill();
        ctx.fillStyle = '#050204'; ell(lx, 0, ir * (o.round ? .45 : .16), ir * .78); ctx.fill();
        ctx.fillStyle = 'rgba(30,6,10,.45)'; ctx.fillRect(-r, -h * 1.5, r * 2, h * .55); // the lid's shadow on it
        ctx.fillStyle = 'rgba(255,248,236,.9)'; circle(lx + ir * .35, -ir * .35, Math.max(.35, ir * .18)); ctx.fill();
        ctx.restore();
      } else { ctx.fillStyle = C('#300'); circle(0, 0, r * .3); ctx.fill(); }
      al(); ctx.strokeStyle = C(o.ink || '#0A0508'); ctx.lineWidth = Math.max(.6, r * .16); ctx.stroke();
      ctx.restore();
    },
    // a great eye in its body as its weak point: shut, a lid with an ember in its seam; trembling half open as an attack
    // winds; wide and blazing while the mark lies open; gold and wincing as it burns back. r its half-length.
    bigEye(x, y, r, L, o) {
      o = o || {}; if (!L) return; const op = L.open, bu = L.burn, k = Math.max(.12 * L.wind, op, bu * .45), t = L.T;
      if (k < .03) { // shut: the lid, its lashes, the red in the seam
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y - r * .55, x + r, y); ctx.quadraticCurveTo(x, y + r * .45, x - r, y); ctx.closePath(); ctx.fillStyle = C(o.lid || '#1A1014'); ctx.fill();
        ctx.strokeStyle = C(o.ink || '#070305'); ctx.lineWidth = Math.max(.8, r * .14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - r * .92, y + r * .02); ctx.quadraticCurveTo(x, y + r * .22, x + r * .92, y + r * .02); ctx.strokeStyle = C('#050204'); ctx.lineWidth = Math.max(1, r * .16); ctx.stroke();
        if (!FLASH && !TINT) { ctx.strokeStyle = `rgba(230,40,44,${.45 + .3 * Math.sin(t * 3)})`; ctx.lineWidth = Math.max(.5, r * .07); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x - r * .6, y - r * .3); ctx.quadraticCurveTo(x, y - r * .5, x + r * .6, y - r * .3); ctx.stroke(); }
        ctx.strokeStyle = C('#050204'); ctx.lineWidth = Math.max(.6, r * .07); ctx.beginPath(); for (let i = 1; i < 6; i++) { const u = i / 6 - .5, lx = x + u * r * 1.8, ly = y + r * .2 * (1 - 4 * u * u) * .9 + r * .03; ctx.moveTo(lx, ly); ctx.lineTo(lx + u * r * .3, ly + r * .28); } ctx.stroke();
        CA.core(x, y, r * .7, L, { coreR: .6 }); return;
      }
      CA.eye(x, y, r, Math.min(1, .2 + k), { t, seed: o.seed || 1, look: o.look || 0, lid: o.lid || '#1A1014', white: bu > 0 ? '#FFF2D0' : o.white || '#E6D6B8', iris: bu > 0 ? '#E09A20' : '#C01A1E', iris2: bu > 0 ? '#FFFFFF' : '#FFB080', blink: false, round: op > .5 });
      CA.core(x, y, r * .8, L, { coreR: .5, reach: 1.2 });
    },
    // black strands hanging from a point and swaying, in locks of three (fungal hair, ink, threads)
    strands(pts, t, col, w) { ctx.strokeStyle = C(col || '#0C0809'); w = w || 1;
      for (let pass = 0; pass < 2; pass++) { ctx.lineWidth = pass ? w * .55 : w; ctx.beginPath();
        for (let i = 0; i < pts.length; i += 3) { const x = pts[i], y = pts[i + 1], l0 = pts[i + 2]; if (l0 < 1) continue;
          for (let k = pass ? 1 : 0; k < (pass ? 3 : 1); k++) { const l = l0 * [1, .72, .5][k], ox = [0, -1.1, 1][k] * w, sw = Math.sin(t * 1.6 + x * .3 + i + k * 1.7) * l * .2, cu = (hsh(i + k) - .5) * l * .3;
            ctx.moveTo(x + ox, y); ctx.bezierCurveTo(x + ox + sw * .2, y + l * .35, x + ox + sw + cu, y + l * .7, x + ox * 1.6 + sw * 1.3 - cu * .5, y + l); } }
        ctx.stroke(); } },
    // black veins spreading from a point (worked out once per key), the Circle's red beating outward along them
    veins(key, x, y, src, L, o) {
      o = o || {}; let V = VEINS.get(key);
      if (!V) { const r = mulberry(key.length * 977 + key.charCodeAt(0) * 31 + (key.charCodeAt(key.length - 1) | 0)), P0 = new Path2D(), P1 = new Path2D();
        const go = (px, py, an, len, d) => { const P = d ? P1 : P0; P.moveTo(px, py); let l = 0; while (l < len) { an += (r() - .5) * (o.wig || .7); px += Math.cos(an) * 4; py += Math.sin(an) * 4; l += 4; P.lineTo(px, py); if (d < 1 && r() < .13) go(px, py, an + (r() < .5 ? -.8 : .8), (len - l) * .55, d + 1); } };
        for (const [an, len] of src) go(0, 0, an, len, 0); V = [P0, P1]; VEINS.set(key, V); }
      const k = o.k ?? 1; if (k <= .01) return; ctx.save(); ctx.translate(x, y); if (o.sx) ctx.scale(o.sx, o.sy || o.sx); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha *= Math.min(1, k * 1.5); ctx.strokeStyle = C(o.col || '#0A0608'); ctx.lineWidth = (o.w || 2) * Math.min(1, k * 1.2); ctx.stroke(V[0]); ctx.lineWidth = (o.w || 2) * .55; ctx.stroke(V[1]);
      if (L && !FLASH && !TINT && !L.lite) { ctx.strokeStyle = L.burn > 0 ? `rgba(255,214,120,${.5 + .5 * L.burn})` : `rgba(230,40,44,${.55 + .35 * Math.max(L.open, L.wind)})`; ctx.lineWidth = (o.w || 2) * .45; ctx.setLineDash([3, 14]); ctx.lineDashOffset = -L.T * 20; ctx.stroke(V[0]); ctx.setLineDash([]); }
      ctx.restore(); },
    // ink running down from an edge in tapering drips, a drop falling from the longest now and then
    drips(pts, t, col) { ctx.fillStyle = C(col || '#0A0608'); ctx.beginPath();
      for (let i = 0; i < pts.length; i += 4) { const x = pts[i], y = pts[i + 1], l = pts[i + 2] * (.85 + .15 * Math.sin(t * 1.3 + i)), w = pts[i + 3];
        ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * .7, y + l * .6, x - w * .3, y + l); ctx.arc(x, y + l, w * .45, Math.PI, 0, true); ctx.quadraticCurveTo(x + w * .7, y + l * .6, x + w, y); ctx.closePath();
        const f = (t * .7 + hsh(i) * 7) % 1.6; if (f < 1 && l > 5) { const fy = y + l + f * f * 30; ctx.moveTo(x + w * .5, fy); ctx.arc(x, fy, w * .5 * (1 - f * .5), 0, TAU); } }
      ctx.fill(); },
  };
  // ---------------- its mark: the Circle's sigil set in it. Shut: a black ring in a crown of thorns round a red ember. As
  // an attack winds: the ring closes on it on the ground, the sigil flares. Open (strike it): the ring splits like an iris
  // round a white-hot heart, and arrows close on it. Burning back: it goes gold and fades. ----------------
  function markWind(e) { // (as its attack winds: the Circle's ring closes on it on the ground)
    const B = e.cB; if (!(B.wind > 0)) return; const q = B.wind / .8, R = e.hw * .9 + 30 + 90 * q; ctx.save();
    ctx.strokeStyle = `rgba(8,4,8,${.85 * (1 - q * .5)})`; ctx.lineWidth = 7; ell(e.x, e.y, R, R * .3); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,30,44,.8)'; ctx.lineWidth = 1.6; ell(e.x, e.y, R, R * .3); ctx.stroke(); ctx.restore();
  }
  function bossMark(e, x, y, sc, t) {
    const B = e.cB, cal = CV.cal.get(e), r0 = (9 + Math.min(5, e.hh / 40)) * 1.12 * (cal ? clamp(cal.h * (e.size || 1) / 150, .66, 1) : 1), wind = B.wind > 0, burn = B.burn > 0, open = B.open > 0 && !burn, pulse = .6 + .4 * Math.sin(t * 10);
    if (open && !B.vOt) B.vOt = t; if (!open) B.vOt = 0; // (when it opened, for the drawing only)
    const ko = open ? sm((t - B.vOt) / .28) : 0, kw = wind ? sm(1 - B.wind / .8) : 0, k = cvTier(B), r = r0 * (1 + .22 * ko + .1 * kw);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (wind) markWind(e);
    if (burn) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.6); g.addColorStop(0, 'rgba(255,240,200,.85)'); g.addColorStop(.4, 'rgba(255,190,90,.4)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 3.6, y - r * 3.6, r * 7.2, r * 7.2);
      ctx.strokeStyle = 'rgba(255,230,170,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = hsh(i + 3) * TAU + t * .3, l = r * (1.6 + 1.2 * hsh(i + 11)) * (.8 + .2 * Math.sin(t * 12 + i)); ctx.moveTo(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6); ctx.lineTo(x + Math.cos(a + .1) * l * .6, y + Math.sin(a + .1) * l * .6); ctx.lineTo(x + Math.cos(a - .05) * l, y + Math.sin(a - .05) * l); } ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= .5; }
    // a dark plate behind it, so it reads on any colour
    { const g = ctx.createRadialGradient(x, y, r * .5, x, y, r * 2.1); g.addColorStop(0, 'rgba(6,2,6,.7)'); g.addColorStop(1, 'rgba(6,2,6,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.1, y - r * 2.1, r * 4.2, r * 4.2); }
    // the crown of thorns, turning slowly; longer and red-edged as it flares or lies open
    { const n = 10, rot = t * .35, ext = 1 + .35 * kw + .5 * ko; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, l = r * (i % 2 ? 1.45 : 1.85) * ext, w = .2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a - w) * r * 1.05, y + Math.sin(a - w) * r * 1.05); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.lineTo(x + Math.cos(a + w) * r * 1.05, y + Math.sin(a + w) * r * 1.05); ctx.closePath();
      ctx.fillStyle = '#0A0508'; ctx.fill(); if (kw > 0 || ko > 0 || k > .8) { ctx.strokeStyle = `rgba(230,50,50,${Math.max(kw, ko, .35) * .8})`; ctx.lineWidth = .7; ctx.stroke(); } } }
    // the thin silver ring outside it, broken in three, turning the other way, with its ticks
    { const R = r * 1.32, rot = -t * .5; ctx.strokeStyle = 'rgba(200,192,206,.75)'; ctx.lineWidth = Math.max(.7, r * .1);
      for (let i = 0; i < 3; i++) { const a0 = rot + i / 3 * TAU + .18; ctx.beginPath(); ctx.arc(x, y, R, a0, a0 + TAU / 3 - .36); ctx.stroke(); }
      ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = rot + i / 12 * TAU; ctx.moveTo(x + Math.cos(a) * R * .93, y + Math.sin(a) * R * .93); ctx.lineTo(x + Math.cos(a) * R * 1.09, y + Math.sin(a) * R * 1.09); } ctx.stroke(); }
    // the black ring: whole when shut, split into four and drawn back like an iris when it lies open
    { const lw = r * .42, gap = ko * .55, push = ko * r * .38; ctx.lineCap = 'butt';
      for (let i = 0; i < 4; i++) { const a0 = i / 4 * TAU + t * .2 * ko + gap / 2, a1 = a0 + TAU / 4 - gap, mx = Math.cos((a0 + a1) / 2) * push, my = Math.sin((a0 + a1) / 2) * push;
        ctx.strokeStyle = '#0A0508'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x + mx, y + my, r, a0, a1); ctx.stroke();
        ctx.strokeStyle = `rgba(${190 + 50 * Math.sin(t * 4) | 0},40,48,.7)`; ctx.lineWidth = Math.max(.6, r * .07); ctx.beginPath(); ctx.arc(x + mx, y + my, r - lw * .5, a0, a1); ctx.stroke(); } ctx.lineCap = 'round'; }
    // its heart: an ember while shut, flaring as it winds, white-hot when open
    { const hr = r * (.34 + .14 * kw + .35 * ko); ctx.globalCompositeOperation = 'lighter';
      const bl = r * (1.4 + 1.6 * Math.max(kw, ko)), g = ctx.createRadialGradient(x, y, 0, x, y, bl); g.addColorStop(0, `rgba(255,${70 + 150 * ko | 0},${60 + 120 * ko | 0},${(.35 + .45 * Math.max(kw * pulse, ko)) * (.8 + .2 * pulse)})`); g.addColorStop(1, 'rgba(255,50,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - bl, y - bl, bl * 2, bl * 2);
      ctx.globalCompositeOperation = 'source-over'; const hg = ctx.createRadialGradient(x, y, 0, x, y, hr); hg.addColorStop(0, ko > 0 ? '#FFFFFF' : '#FF8A6A'); hg.addColorStop(.45, ko > 0 ? '#FFE0A8' : `rgb(${200 + 50 * Math.sin(t * 4 + x) | 0},40,44)`); hg.addColorStop(1, ko > 0 ? '#E83A30' : '#7A1018'); ctx.fillStyle = hg; circle(x, y, hr); ctx.fill(); }
    // open: four arrows close on it, a ring round it, the blows it still wants as pips
    if (open) { const R = r * (2.25 + .25 * Math.sin(t * 9)) * (1.4 - .4 * ko), a = ko;
      ctx.strokeStyle = `rgba(255,224,200,${.85 * pulse * a})`; ctx.lineWidth = 1.5; circle(x, y, r * 1.95); ctx.stroke();
      for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + TAU / 8, cx = x + Math.cos(an) * R, cy = y + Math.sin(an) * R, s = r * .58; ctx.save(); ctx.translate(cx, cy); ctx.rotate(an + Math.PI);
        ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * .6, -s * .8); ctx.lineTo(-s * .2, 0); ctx.lineTo(-s * .6, s * .8); ctx.closePath(); ctx.fillStyle = `rgba(255,236,214,${a})`; ctx.fill(); ctx.strokeStyle = `rgba(40,6,10,${a})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      for (let i = 0; i < Math.min(3, B.pts | 0); i++) { ctx.fillStyle = '#FFE6C0'; circle(x - 8 + i * 8, y - r * 2.6, 2.2); ctx.fill(); ctx.strokeStyle = '#3A0A10'; ctx.lineWidth = .8; ctx.stroke(); } }
    ctx.restore();
  }
  // ---------------- a stagger (it holds still a moment), the shadow's cue for a lunge, extra damage while the curse burns back ----------------
  { const _u = updateEnemy; updateEnemy = function (e, dt) {
    const B = e && e.cB; if (!B || e.dead || !NG()) return _u(e, dt);
    if (B.stun > 0) { B.stun -= dt; e.flash = Math.max(0, e.flash - dt); e.jit = .06; e.vx = 0; e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); return; }
    const s0 = e.state, r = _u(e, dt);
    if (B.dbl && s0 !== e.state && B_LUNGE.includes(e.state)) echoQueue(e, [], true);
    return r; }; }
  { const _h = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) {
    const M = markOf(e), B = M && M.cB; if (!B || e.dead || M.dead || !NG()) return _h(e, dmg, dir, m, crit);
    const pearl = !!(m && m.pearl && !m.trump), own = pearl || !!(CTX && CTX.own && CTX.e === e);
    if (B.burn > 0 && own && M === e) dmg = Math.round(dmg * 1.35);
    const hp0 = e.hp, r = _h(e, dmg, dir, m, crit);
    if (own && e.hp < hp0 && B.burn <= 0 && (M === e ? !e.dead : B.open > 0)) { const add = B.open > 0 ? (pearl ? 3 : 1) : (pearl ? 1 : 0); if (add && rl('bwp' + M.cid, .12)) { B.pts += add; if (B.pts >= (B.bt >= 4 ? 4 : 3)) burnBack(M); } }
    return r; }; }
  { const _k = killEnemy; killEnemy = function (e, dir, m) { const was = e.dead, r = _k(e, dir, m);
    if (NG() && e.cB && !was && e.dead) { const c = CS(); if (!c.bfell[e.type]) ease(4, 'a corrupted lord beaten cleanly'); e.cB.open = e.cB.wind = 0; if (e.cB.dbl) e.cB.dbl.q = [];
      for (const h of hazards) if (h.cMine || h.cEcho) { h.done = true; h.t = Math.min(h.t, -1); } }
    return r; }; }
  { const _g = gameOver; gameOver = function () { if (NG() && boss && boss.cB && !boss.dead && stage && stage.bossRoom) { const c = CS(); c.bfell[boss.type] = 1; feed(3, 'a death to a corrupted lord'); } return _g(); }; }
  { const _bn = banner; banner = function (title, sub, dur) { // (its title card names it corrupted)
    if (NG() && boss && boss.cB && !boss.dead && title === boss.def.name && !boss.cB.titled) { boss.cB.titled = true; sub = 'CORRUPTED BY THE BLACK CIRCLE' + (sub ? ' · ' + sub : ''); }
    return _bn(title, sub, dur); }; }
  { const _ml2 = mechList; mechList = function (list, t) { _ml2(list, t); if (!NG() || !boss || boss.dead || !boss.cB || !boss.cB.dbl || boss.cB.dbl.a < .05) return; const e = boss, D = e.cB.dbl;
    list.push([D.y - .02, () => drawDouble(e, D, t)]); }; }
  { const _mb2 = mechBoxes; mechBoxes = function (box) { _mb2(box); if (NG() && boss && !boss.dead && boss.cB && boss.cB.dbl) box(boss.cB.dbl.x, boss.cB.dbl.y, boss.z, boss.hw * 2.4, boss.hh * 1.6 + 40); }; }
  function circleArena(t) { // the boss's floor is the Circle: a ring of black laid round the fight
    const Lx = lockX !== null ? lockX : Math.max(0, stage.len - VW), cx = Lx + VW / 2 - camX, cy = (FLOOR_TOP + FLOOR_BOT) / 2 + 6, R = VW * .44;
    ctx.save(); ctx.fillStyle = 'rgba(40,36,44,.32)'; ell(cx, cy, R, R * .22); ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(6,4,8,.85)'; ell(cx, cy, R, R * .22); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = `rgba(170,30,40,${.55 + .25 * Math.sin(t * 2)})`; ell(cx, cy, R + 2, R * .22 + 1); ctx.stroke(); ctx.restore();
  }
  function skyCircle(t) { // the Black Circle hangs over the world it has taken
    const x = VW * .5, y = Y_OFF + 52 + (GLIDE_DY ? -GLIDE_DY * .3 : 0), R = 34; ctx.save();
    const g = ctx.createRadialGradient(x, y, R * .6, x, y, R * 2.6); g.addColorStop(0, 'rgba(60,56,64,.55)'); g.addColorStop(1, 'rgba(60,56,64,0)'); ctx.fillStyle = g; ctx.fillRect(x - R * 3, y - R * 3, R * 6, R * 6);
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(8,6,10,.92)'; circle(x, y, R); ctx.stroke(); ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(190,40,50,${.5 + .2 * Math.sin(t)})`; circle(x, y, R + 5); ctx.stroke(); ctx.restore();
  }
  { const _br = drawBossRoom; drawBossRoom = function (t) {
    if (NG() && L.heart) { try { heartFloor(t); } catch (err) { console.error(err); } return; }
    _br(t); if (!NG() || !stage) return;
    try {
      if (L.fx && L.fx.k === 'puppet') { const k = fxAmt(); ctx.save(); ctx.fillStyle = `rgba(236,186,118,${.78 * k})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H); const g = ctx.createRadialGradient(VW / 2, FLOOR_TOP - 30, 10, VW / 2, FLOOR_TOP - 30, VW * .6); g.addColorStop(0, `rgba(255,236,190,${.6 * k})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H); ctx.restore(); }
      if (finalHigh() || stage.bossRoom) { skyCircle(t); if (stage.bossRoom) circleArena(t); }
      if (patCursed() && stage.theme === 'moonBoss') moonPattern(t);
      drawRoad(t);
    } catch (err) { console.error(err); } }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!NG() || !P) return;
    for (const q of L.mimics) { const e = q.e; if (e.dead) continue; const a = Math.sin(Math.PI * Math.min(1, q.t / .75)) * .8; list.push([e.y + .05, () => onMain(() => { ctx.save(); const tt = TINT; TINT = '#1C1024'; try { drawPlayerAt(e.x - e.facing * 4, e.y, e.z, e.facing, Object.assign({}, q.pose, { noCloak: 1 }), a); } finally { TINT = tt; } ctx.restore(); })]); }
    for (const k of L.cloot) list.push([k.y, () => onMain(() => { const y = k.y - k.z - 6 + Math.sin(t * 3 + k.x) * 2; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(k.x, k.y, 6, 2); ctx.fill();
      ctx.fillStyle = '#100A12'; ctx.beginPath(); ctx.moveTo(k.x, y - 7); ctx.lineTo(k.x + 4.5, y); ctx.lineTo(k.x, y + 7); ctx.lineTo(k.x - 4.5, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8A7A90'; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,40,50,${.5 + .3 * Math.sin(t * 6 + k.x)})`; circle(k.x, y, 1.6); ctx.fill(); ctx.restore(); })]);
    if (window.W8 && W8.S) for (const r of W8.S.riders) if (r.cAtP || r.cBack) list.push([r.y + .12, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(120,40,40,.55)'; ell(r.x, r.y - 50, 46, 56); ctx.fill(); ctx.restore(); })]);
    if (L.fx && L.fx.k === 'rewind' && L.rec.length > 2) { const u = cl01(L.fx.t / L.fx.dur), i = Math.max(0, Math.min(L.rec.length - 1, Math.round((1 - u) * (L.rec.length - 1)))), q = L.rec[i];
      list.push([q.y - .05, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const tt = TINT; TINT = '#6A8AC8'; try { drawPlayerAt(q.x, q.y, q.z, q.f, Object.assign({}, q.pose, { noCloak: 1 }), .45); } finally { TINT = tt; } ctx.restore(); })]); }
    pearlBlacken(list, t);
  }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (!NG()) return; for (const q of L.mimics) box(q.e.x, q.e.y, q.e.z, 160, 170); for (const k of L.cloot) box(k.x, k.y, 0, 20, 30); if (L.fx && L.fx.k === 'rewind') for (const q of L.rec) box(q.x, q.y, q.z, 60, 100); }; }

  // ---------------- the heart of the curse: a Pattern of his own, walked while Chaos pours in ----------------
  function heartPath() { // a Pattern half drawn: arcs round a centre, turning back on themselves, and in to its heart
    const cx = VW / 2, cy = (FLOOR_TOP + FLOOR_BOT) / 2 + 4, ry = .3, pts = [], RX = Math.min(VW * .4, 270);
    const rings = [1, .76, .52, .3], P_ = (r, a) => pts.push([cx + Math.cos(a) * r * RX, cy + Math.sin(a) * r * RX * ry]);
    let a = Math.PI; P_(1.1, a);
    rings.forEach((r, i) => { const dir = i % 2 ? -1 : 1, span = TAU * .82, n = Math.ceil(span * r * RX / 14);
      for (let k = 0; k <= n; k++) P_(r, a + dir * span * k / n); a += dir * span;
      if (i < rings.length - 1) { const r2 = rings[i + 1]; for (let k = 1; k <= 5; k++) P_(lerp(r, r2, k / 5), a); } });
    for (let k = 1; k <= 6; k++) P_(.3 * (1 - k / 6), a);
    return pts;
  }
  const HEART_Z = { title: 'The Heart of the Curse', sub: 'WALK A PATTERN OF YOUR OWN · HOLD AGAINST THE CHAOS', len: 0, pods: [], rawWaves: [], boss: 1, cHeart: 1 };
  function startHeart() {
    const z = Object.assign({}, HEART_Z, { theme: THEMES.chaos ? 'chaos' : stage.theme, len: VW });
    enemies = []; spawnQ = [];
    enterZone(zoneIdx, z);
    stage.len = VW; lockX = 0; camX = 0; bossSpawned = true; boss = null; waveActive = true; clearT = 0; $('#bossbar').hidden = true; setZoom(VIEW_BOSS);
    const pts = heartPath(); P.x = pts[0][0] - 30; P.y = pts[0][1]; P.facing = 1; P.inv = 1.5; P.hp = Math.max(P.hp, Math.round(maxHp() * .6));
    L.heart = { t: 0, pts, start: .5, prog: .5, spawnT: 2, done: false, white: 0, burnT: 0, n: 0 };
    L.road = null; L.fx = null;
    banner(z.title, z.sub, 3); sfx('roar'); shakeMag = 8; flashT = .2;
  }
  const heartIdx = (H) => Math.min(H.pts.length - 1, Math.floor(Math.min(1, H.prog) * (H.pts.length - 1)));
  function heartStep(dt) {
    const H = L.heart; if (!H) return; H.t += dt;
    if (H.done) { H.white = Math.max(0, H.white - dt * .5); H.endT -= dt; if (H.endT <= 0 && !H.cleared) { H.cleared = true; CS().heartDone = true; persist(); stageClear(); } return; }
    // tracing: the next stretch of the line, if he is on it
    const i = heartIdx(H), pts = H.pts;
    for (let j = i; j < Math.min(pts.length, i + 7); j++) { const [x, y] = pts[j]; if (Math.abs(P.x - x) < 18 && Math.abs(P.y - y) < 11 && P.z < 30) { H.prog = Math.min(1, Math.max(H.prog, (j + 1) / (pts.length - 1))); } }
    // the line burns Chaos where it is drawn
    H.burnT -= dt; if (H.burnT <= 0) { H.burnT = .5; const n = heartIdx(H); for (const e of enemies) { if (e.dead) continue; for (let j = 0; j < n; j += 3) { const [x, y] = pts[j]; if (Math.abs(e.x - x) < 14 + e.hw * .3 && Math.abs(e.y - y) < 10) { strike(e, 6 + stageIdx, Math.sign(e.x - x) || 1, { dmg: 6, kb: 80, power: 0, el: 1, cEnv: 1, noStun: 1 }, true); burst(e.x, e.y, 6, ['#FFFFFF', '#9FC0FF', '#EED48A'], 4, 'spark'); break; } } } }
    // Chaos pours in from the edges
    H.spawnT -= dt; const alive = enemies.filter(e => !e.dead).length + spawnQ.length;
    if (H.spawnT <= 0 && alive < 4 + Math.min(2, Math.floor(H.prog * 4))) { H.spawnT = rand(1.3, 2.2); const pool = (baseStage.waves || []).flat().map(t => t.replace(/[*!]/g, '')).filter(k => EDEF[k]);
      if (pool.length) { const e = spawnEnemy(pick(pool), Math.random() < .5 ? 1 : -1, false); if (e) { e.cNoCurse = 1; curseFoe(e, Math.random() < .3 ? 'split' : 'none'); e.dropWeapon = null; } } }
    waveActive = true;
    if (H.prog >= .999) { H.done = true; H.white = 1; H.endT = 3.2; shakeMag = 12; flashT = .4; sfx('trump'); sfx('roar');
      for (const e of enemies) if (!e.dead) { e.remove = true; burst(e.x, e.y, e.hh * .5, ['#FFFFFF', '#9FC0FF', '#2A1830'], 18, 'spark', 0, true); }
      spawnQ.length = 0; ease(30, 'the Pattern of his own walked'); banner('THE PATTERN IS WALKED', 'THE CURSE BREAKS AGAINST IT', 3); }
  }
  let HEARTBG = null;
  function heartBg() { // the void at the curse's heart, painted once
    const w = Math.ceil(VW), key = w + '|' + K + '|' + FLOOR_TOP; if (HEARTBG && HEARTBG.key === key) return HEARTBG;
    const S = Math.min(2, K), c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(VH * S); const g = c.getContext('2d'); g.scale(S, S); const r = mulberry(4242);
    const sk = g.createLinearGradient(0, 0, 0, FLOOR_TOP); sk.addColorStop(0, '#050307'); sk.addColorStop(.6, '#1A1420'); sk.addColorStop(1, '#3A3240'); g.fillStyle = sk; g.fillRect(0, 0, w, FLOOR_TOP);
    for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * FLOOR_TOP, L2 = 40 + r() * 140, a = r() * TAU; g.strokeStyle = `rgba(${r() < .3 ? '150,40,50' : '110,100,120'},${.08 + r() * .14})`; g.lineWidth = 1 + r() * 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L2 * .5 + 30, y + Math.sin(a) * L2 * .3, x + Math.cos(a) * L2, y + Math.sin(a) * L2 * .5); g.stroke(); }
    const fl = g.createLinearGradient(0, FLOOR_TOP, 0, VH); fl.addColorStop(0, '#2A242C'); fl.addColorStop(1, '#0C0A0E'); g.fillStyle = fl; g.fillRect(0, FLOOR_TOP - 2, w, VH - FLOOR_TOP + 2);
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; for (let i = 0; i < 40; i++) { let x = r() * w, y = FLOOR_TOP + r() * (VH - FLOOR_TOP); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (r() - .5) * 40; y += (r() - .3) * 8; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(160,150,170,.35)'; g.fillRect(0, FLOOR_TOP - 2, w, 1.5);
    c.key = key; c.S = S; HEARTBG = c; return c;
  }
  { const _dw = drawWorld; drawWorld = function (themeId, cam, t) { if (!NG() || !L.heart) return _dw(themeId, cam, t);
    const c = heartBg(); ctx.drawImage(c, 0, 0, c.width / c.S, c.height / c.S);
    const x = VW * .5, y = Y_OFF + 60, R = 46 + 3 * Math.sin(t); ctx.save(); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(6,4,8,.95)'; circle(x, y, R); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(190,40,50,${.6 + .2 * Math.sin(t * 2)})`; circle(x, y, R + 9); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + t * .2; ctx.strokeStyle = 'rgba(120,100,140,.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (R + 12), y + Math.sin(a) * (R + 12)); ctx.lineTo(x + Math.cos(a + .3) * (R + 80), y + Math.sin(a + .3) * (R + 80)); ctx.stroke(); } ctx.restore(); }; }
  function heartFloor(t) {
    const H = L.heart, pts = H.pts, n = heartIdx(H); ctx.save(); ctx.translate(-camX, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (a, b) => { ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); for (let j = a + 1; j <= b; j++) ctx.lineTo(pts[j][0], pts[j][1]); };
    // what is yet to be walked: faint, broken
    ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(160,150,180,.35)'; ctx.lineWidth = 2; line(n, pts.length - 1); ctx.stroke(); ctx.setLineDash([]);
    // what is drawn: the Pattern's own fire
    ctx.strokeStyle = 'rgba(10,20,50,.85)'; ctx.lineWidth = 8; line(0, n); ctx.stroke(); ctx.strokeStyle = '#3A6AD8'; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#E8F0FF'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(140,180,255,${.25 + .1 * Math.sin(t * 3)})`; ctx.lineWidth = 12; line(Math.max(0, n - 30), n); ctx.stroke();
    const [tx, ty] = pts[n]; const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 26); g.addColorStop(0, 'rgba(255,250,230,.95)'); g.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(tx - 26, ty - 26, 52, 52);
    if (pts[Math.min(pts.length - 1, n + 6)]) { const [nx, ny] = pts[Math.min(pts.length - 1, n + 6)]; ctx.fillStyle = `rgba(255,240,200,${.5 + .4 * Math.sin(t * 6)})`; circle(nx, ny, 2.4); ctx.fill(); }
    ctx.restore();
    // Chaos at the edges: black smoke banked against both sides
    ctx.save(); for (const s of [0, 1]) { const g2 = ctx.createLinearGradient(s ? VW : 0, 0, s ? VW - 140 : 140, 0); g2.addColorStop(0, `rgba(6,4,8,${.8 + .1 * Math.sin(t * 2 + s)})`); g2.addColorStop(1, 'rgba(6,4,8,0)'); ctx.fillStyle = g2; ctx.fillRect(s ? VW - 140 : 0, Y_OFF, 140, VIEW_H); } ctx.restore();
  }
  function heartOverlay(t) { const H = L.heart; if (H.white > 0) { ctx.fillStyle = `rgba(255,252,240,${Math.min(.85, H.white)})`; view(); } }

  // ---------------- the cursed ending: after the world's own, a closing scene of the curse walked ----------------
  const CODA_LINES = [['I had cursed Amber, blind, in Eric\'s dark.', 'AND THE CURSE WALKED WITH ME THROUGH EVERY SHADOW'], ['The Pattern I drew holds.', 'BUT THE ROAD I MADE RUNS ON, BLACK, TO THE CIRCLE'], ['What I loosed I must still answer for.', 'LORRAINE BURNS GREY BEHIND ME']];
  const isCursedEnd = () => NG() && CS().heartDone && CS().endCyc === (save.cycle | 0) && CS().endHigh;
  // (each line stays up long enough to read: 2.6s and .05s a letter, with .6s to come and .6s to go)
  const CODA_FADE = .6, CODA_AT = []; let CODA_END = 0;
  { let at = .3; for (const [a, b] of CODA_LINES) { const hold = 2.6 + .05 * (a.length + b.length); CODA_AT.push([at, hold]); at += CODA_FADE * 2 + hold; } const L2 = CODA_AT[CODA_AT.length - 1]; CODA_END = L2[0] + CODA_FADE + L2[1] + 1.2; }
  { const _wc = winCard; winCard = function (i) { const r = _wc(i); if (!isCursedEnd() || L.codaDone) return r;
    const c = CS(); c.ends[endingId(i)] = 'cursed'; persist();
    const ov = document.getElementById('winOv'); if (ov) ov.style.visibility = 'hidden';
    L.coda = { t: 0, i, last: performance.now() }; setTimeout(() => cursedWinText(), 0); return r; }; }
  function cursedWinText() { const k = $('#winOv .kicker'), h2 = $('#winOv .h2'); if (k) k.textContent = 'THE CURSE IS WALKED';
    if (h2) h2.textContent = 'A road of his own making';
    $('#winText').textContent = 'He reached the end of the road with the Black Circle in him, and walked a Pattern of his own at its heart while Chaos poured in. It holds. But the Black Road he made runs on from his feet to Lorraine, and what he loosed in Eric\'s dungeon is not finished with him. Walk the road again, gentler, and it may let him go.'; }
  function endCoda() { const ov = document.getElementById('winOv'); if (ov) ov.style.visibility = ''; L.coda = null; L.codaDone = true; cursedWinText(); }
  const codaSkip = () => { if (L.coda && L.coda.t > 1) { const last = CODA_AT[CODA_AT.length - 1][0]; if (L.coda.t < last) L.coda.t = last; else endCoda(); } }; // (a first press goes to the last line, a second ends it)
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, (e) => { if (L.coda) { codaSkip(); e.stopPropagation(); } }, true);
  function drawCoda(t) {
    const C = L.coda, nowT = performance.now(), dt = Math.min(.05, (nowT - C.last) / 1000); C.last = nowT; C.t += dt; const T = C.t;
    let line = 0; for (let i = 0; i < CODA_AT.length; i++) if (T >= CODA_AT[i][0]) line = i;
    if (T > CODA_END) { endCoda(); return; }
    const g = ctx; g.save();
    const sk = g.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP); sk.addColorStop(0, '#08060A'); sk.addColorStop(.7, '#2A2430'); sk.addColorStop(1, '#5A5260'); g.fillStyle = sk; g.fillRect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF);
    const cxs = VW * .5, cys = FLOOR_TOP - 34; g.lineWidth = 7; g.strokeStyle = 'rgba(6,4,8,.95)'; circle(cxs, cys, 22); g.stroke(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(190,40,50,.7)'; circle(cxs, cys, 26); g.stroke();
    const fl = g.createLinearGradient(0, FLOOR_TOP, 0, VH); fl.addColorStop(0, '#4A444C'); fl.addColorStop(1, '#16121A'); g.fillStyle = fl; g.fillRect(0, FLOOR_TOP, VW, VH - FLOOR_TOP);
    // the Black Road, from his feet to the Circle on the horizon
    const fx0 = VW * .5, fy = VH - 30; g.fillStyle = '#0C0A0E'; g.beginPath(); g.moveTo(fx0 - 70, VH); g.lineTo(fx0 + 70, VH); g.lineTo(cxs + 5, FLOOR_TOP); g.lineTo(cxs - 5, FLOOR_TOP); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,30,40,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(fx0, VH); g.lineTo(cxs, FLOOR_TOP); g.stroke();
    // his own Pattern, round him, burning
    const k = sm(T / 3); g.save(); g.translate(fx0, fy - 16); g.scale(1, .26); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(110,150,255,${.55 * k})`; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 40 + i * 22, i * 1.3, i * 1.3 + TAU * .85 * k); g.stroke(); g.strokeStyle = `rgba(240,245,255,${.6 * k})`; g.lineWidth = 1; g.stroke(); }
    g.restore();
    // and him on it, his back to us, the grey cloak
    try { drawPlayerAt(fx0, fy, 0, 1, playerPoseSafe(), 1); } catch (e) {}
    // ash falling
    for (let i = 0; i < 40; i++) { const x = (hsh(i) * VW + T * 8 * (hsh(i + 1) - .5)) % VW, y = Y_OFF + ((hsh(i + 2) * VIEW_H + T * (18 + hsh(i + 3) * 20)) % VIEW_H); g.fillStyle = `rgba(200,195,205,${.3 + .3 * hsh(i + 4)})`; g.fillRect(x, y, 1.6, 1.6); }
    // the words, one line at a time
    { const [st, hold] = CODA_AT[line], u = T - st, last = line === CODA_AT.length - 1, a = Math.min(sm(u / CODA_FADE), last ? 1 : sm((CODA_FADE * 2 + hold - u) / CODA_FADE)); g.textAlign = 'center'; g.globalAlpha = a;
      g.font = '700 17px Cinzel, Georgia, serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,6,10,.85)'; g.strokeText(CODA_LINES[line][0], VW / 2, Y_OFF + 40); g.fillStyle = '#EDE4F0'; g.fillText(CODA_LINES[line][0], VW / 2, Y_OFF + 40);
      g.font = '600 10px Cinzel, Georgia, serif'; g.lineWidth = 3; g.strokeText(CODA_LINES[line][1], VW / 2, Y_OFF + 58); g.fillStyle = '#C8A0B0'; g.fillText(CODA_LINES[line][1], VW / 2, Y_OFF + 58); g.globalAlpha = 1; }
    const fade = Math.min(sm(T / 1.2), sm((CODA_END - T) / 1)); g.fillStyle = `rgba(0,0,0,${1 - fade})`; view();
    g.restore();
  }
  function playerPoseSafe() { try { const s = P.state; P.state = 'idle'; const p = playerPose(); P.state = s; return p; } catch (e) { return { walk: 0 }; } }

  // ======================================================================================================
  // THE PASSING CURSE: a curse that will not die with its host (the 'carrier' trait)
  // ------------------------------------------------------------------------------------------------------
  // A carrier wears a wisp of the Circle on its back: a knot of ink with eyes in it, rooted into the body (its roots:
  // cursed_foes.js), a thread of ink trailing. Killed, the
  // curse does not die. It tears out of the body (and for a moment, rimmed in gold, it can be struck and broken), then flies
  // in a high arc to the nearest uncursed foe and takes it: the new host is bigger, harder, faster and heals whole, wears a
  // bead of the Circle on its thread for every hop, and wears pieces of the hosts before it (their heads and shoulders grafted on, grey,
  // stitched in red). Its blows leave grey puddles that drag at him; from the third hop it lashes and spits ink with what it
  // has taken. With no foe to go to it raises the nearest corpse ("the dead get up wrong"), and failing that it dives into
  // Corwin's own shadow, which stands up behind him and follows where he was a moment ago, striking, until he strikes it.
  // Killed with a finisher, a perfect charge or a riposte, or struck as it leaves, the curse breaks: gold, a heal, shards for
  // every hop, the curse eased, the puddles gone, the grafts torn off. Each hop it is let make feeds the curse. At the fifth
  // it is the Chimera of the Curse; brought down any way at all, the curse burns out with the richest reward.
  // ======================================================================================================
  const tn = (...a) => { if (typeof sfxOn !== 'undefined' && sfxOn && typeof actx !== 'undefined' && actx) { try { tone(...a); } catch (e) {} } }; // (a note, when there is sound)
  const CAR = { CAP: 5, OUT: .6, FLY: 1, HP: .3, DMG: .12, SPD: .08, SIZE: .09, SHADE: 5.5, RANGE: 520 };
  const carrierOK = () => !L.heart && !(stage && stage.secret);
  const carScale = (e) => (e.cHops | 0) >= CAR.CAP ? 1.5 : 1 + CAR.SIZE * (e.cHops | 0);
  const HOW = { finisher: 'A FINISHER', perfect: 'A PERFECT CHARGE', riposte: 'A RIPOSTE', wisp: 'STRUCK AS IT LEFT', shadow: 'HIS SHADOW STRUCK FREE', burn: 'EVERY HOST IT WORE' };
  function carrierInit(e) {
    e.cHops = e.cHops | 0; e.cChain = e.cChain || []; e.cAtkT = e.cAtkT || rand(2, 3);
    if (!e.cBase) e.cBase = { hp: e.maxHp, dmg: e.dmg, hw: e.hw, hh: e.hh, spd: e.def.spd || 0 };
  }
  function applyHop(o) { // (its stats from its own, for the hops the curse has made)
    const B = o.cBase, h = o.cHops, ch = h >= CAR.CAP, k = carScale(o);
    o.maxHp = o.hp = Math.round(B.hp * (1 + CAR.HP * h) * (ch ? 1.6 : 1)); o.dmg = Math.round(B.dmg * (1 + CAR.DMG * h));
    o.hw = B.hw * k; o.hh = B.hh * k; o.def = Object.assign({}, o.def, { spd: B.spd * (1 + CAR.SPD * h) }); o.cAtkT = rand(1.4, 2.4);
  }
  // a host remembered: a still copy of it, to be worn by the next
  function graftOf(e) {
    const B = e.cBase || e, s = Object.assign({}, e, { dead: false, state: 'idle', t: 0, flash: 0, jit: 0, elite: false, guard: 0, bare: 1, cursed: false, cTrait: null, cChain: null, cMask: null, cB: null,
      sqx: 1, sqy: 1, rotA: 0, z: 0, vx: 0, vz: 0, air: false, death: null, wounds: null, shrink: 1, frozen: 0, chill: 0, hw: B.hw, hh: B.hh });
    return { s, draw: e.def.draw, name: (e.def.name || e.type).toUpperCase(), hw: B.hw, hh: B.hh, seed: Math.random() };
  }
  const ripNow = () => now() < (L.ripT || 0);
  function playerHits(x, y, z, hw, hh) { // (his own blow, in its striking frames, reaching this point)
    const m = P && P.move; if (!m || (P.state !== 'atk' && P.state !== 'air') || !m.h) return false;
    const k = P.t / (m.dur || 1); if (k < m.h[0] || k > m.h[1]) return false;
    return inReach(m, x, y, z, hw, hh);
  }
  const sigilAt = (e) => { const b = Math.sin(now() * 3 + (e.cid || 0) * 9) * 2; return [e.x - e.facing * e.hw * .62, e.y - e.z - e.hh * .96 + b]; };
  // ---------------- the carrier, each frame ----------------
  function carrierFoe(e, dt) {
    if (!e.cBase) carrierInit(e);
    if (e.cRise > 0) { e.cRise -= dt; if (e.state !== 'hurt') { e.state = 'hurt'; e.t = Math.max(e.t, e.cRise); } }
    e.cTrT = (e.cTrT || 0) - dt; if (e.cTrT <= 0) { e.cTrT = .035; (e.cTr = e.cTr || []).push(sigilAt(e)); if (e.cTr.length > 8) e.cTr.shift(); }
    if (!CS().carSeen && playing() && !busy() && e.x > camX + 20 && e.x < camX + VW - 20) { CS().carSeen = 1; banner('THE PASSING CURSE', 'IT DOES NOT DIE WITH ITS HOST · BREAK IT WITH A FINISHER, A PERFECT CHARGE OR A RIPOSTE, OR STRIKE THE WISP AS IT LEAVES', 3.4); }
    if (e.cS0 === 'wind' && e.state !== 'wind' && e.cHops >= 1 && !['hurt', 'down', 'dying'].includes(e.state)) inkPool(e.x + e.facing * (e.hw + 14), e.y, 20 + 3 * e.cHops, 2.4 + .3 * e.cHops); // (its blows leave the Circle's grey on the floor)
    e.cS0 = e.state;
    if (e.cHops >= 3 && e.cChain.length && ['idle', 'walk', 'recover'].includes(e.state) && Math.abs(e.x - P.x) < 340 && P.state !== 'dead' && !busy()) {
      e.cAtkT -= dt; if (e.cAtkT <= 0) { e.cAtkT = e.cHops >= CAR.CAP ? rand(2.6, 3.8) : rand(4.2, 6); graftAttack(e); } }
  }
  // ---------------- what it does with what it wore: an ink lash along the floor, or ink spat over him ----------------
  function graftAttack(e) {
    const g = e.cChain[e.cChain.length - 1], spit = e.cHops >= 4 && Math.random() < .5, dmg = Math.max(4, Math.round(e.dmg * .8));
    if (!e.cArmSaid) { e.cArmSaid = 1; floatText(e.x, e.y, e.hh + 48, 'IT STRIKES WITH THE ' + g.name, '#C8C2CC', 12); }
    if (spit) { for (let i = 0; i < 3; i++) { const t = .9 + i * .18; hazards.push({ kind: 'cblob', src: e, sx: e.x, sy: e.y, sz: e.hh * .9, x: P.x + rand(-46, 46), y: clamp(P.y + rand(-14, 14), FLOOR_TOP + 8, FLOOR_BOT), r: 20, t, max: t, dmg }); } sfx('growl', .5); }
    else { const d = Math.sign(P.x - e.x) || e.facing; e.facing = d; hazards.push({ kind: 'clash', src: e, x0: e.x + d * e.hw * .5, x1: e.x + d * 250, y: clamp(P.y, FLOOR_TOP + 6, FLOOR_BOT), d, t: 1, max: 1, dmg, seed: Math.random() }); sfx('growl', .4); tn(98, .5, 'sawtooth', .04, 62); }
    e.sqx = 1.15; e.sqy = .9; e.cd = Math.max(e.cd, 1.1);
  }
  function inkPool(x, y, r, dur) {
    let n = 0; for (let i = hazards.length - 1; i >= 0; i--) if (hazards[i].kind === 'cink' && hazards[i].t > .3 && ++n >= 8) hazards[i].t = .3; // (the oldest dry first)
    hazards.push({ kind: 'cink', x: clamp(x, leftWall(), rightWall()), y: clamp(y, FLOOR_TOP + 4, FLOOR_BOT), r, t: dur, max: dur, seed: Math.random() });
    if (Math.random() < .6) sfx('hit-goo', .2);
  }
  function clearInk() { for (const h of hazards) { if (h.kind === 'cink') h.t = Math.min(h.t, .25); if (h.kind === 'clash' || h.kind === 'cblob') { h.done = true; h.t = -1; } } }
  HAZARD_FX.cink = { // a puddle of the Circle's grey: it drags at his feet
    update() {},
    draw(h, t) { const a = Math.min(1, h.t / .4, (h.max - h.t) / .2 + .1); if (a <= 0) return; const r = h.r * Math.min(1, .5 + (h.max - h.t) * 3); ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(20,16,24,.72)'; ell(h.x, h.y, r, r * .3); ctx.fill();
      ctx.fillStyle = 'rgba(70,64,78,.5)'; ell(h.x - r * .2, h.y - r * .06, r * .45, r * .08); ctx.fill();
      ctx.strokeStyle = 'rgba(150,142,156,.45)'; ctx.lineWidth = 1; ell(h.x, h.y, r, r * .3); ctx.stroke();
      ctx.fillStyle = 'rgba(20,16,24,.72)'; for (let i = 0; i < 3; i++) { const q = hsh(h.seed * 99 + i), an = q * TAU; circle(h.x + Math.cos(an) * r * 1.2, h.y + Math.sin(an) * r * .36, 1.5 + q * 2); ctx.fill(); }
      if (!lite()) { const u = (t * .7 + h.seed) % 1; ctx.strokeStyle = `rgba(190,180,196,${.3 * (1 - u)})`; ell(h.x, h.y, r * u, r * .3 * u); ctx.stroke(); }
      ctx.restore(); } };
  HAZARD_FX.clash = { // the lash: a dashed red line along the floor first (0.7s), then the ink whips down it
    update(h) { if (h.done) return; if (h.src && h.src.dead) { h.done = true; h.t = -1; return; }
      if (h.t <= .3 && !h.struck) { h.struck = true; sfx('swing'); sfx('hit-goo', .4); const lo = Math.min(h.x0, h.x1), hi = Math.max(h.x0, h.x1);
        if (P.x > lo - 8 && P.x < hi + 8 && Math.abs(P.y - h.y) < 16 && P.z < 28 && P.state !== 'dead') hitPlayer({ kind: 'melee', e: h.src }, h.dmg, h.x0, false);
        inkPool(h.x1, h.y, 22, 2.6); } },
    draw(h, t) { if (h.done) return; const lo = Math.min(h.x0, h.x1), len = Math.abs(h.x1 - h.x0); ctx.save();
      if (h.t > .3) { const k = 1 - (h.t - .3) / .7; ctx.strokeStyle = `rgba(200,40,50,${.35 + .45 * k * (.6 + .4 * Math.sin(t * 30))})`; ctx.lineWidth = 1.5 + 2 * k; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 40 * h.d;
        ctx.beginPath(); ctx.moveTo(h.x0, h.y); ctx.lineTo(h.x1, h.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(16,10,18,${.2 + .3 * k})`; ctx.fillRect(lo, h.y - 3 * k, len, 6 * k); }
      else { const k = clamp(1 - h.t / .3, 0, 1), a = h.t < 0 ? Math.max(0, 1 + h.t / .4) : 1, tip = h.x0 + (h.x1 - h.x0) * Math.min(1, k * 1.6); ctx.globalAlpha = a; ctx.strokeStyle = '#0C080E'; ctx.lineCap = 'round';
        ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(h.x0, h.y - 30); for (let i = 1; i <= 8; i++) { const u = i / 8, x = h.x0 + (tip - h.x0) * u; ctx.lineTo(x, h.y - 30 * (1 - u) * (1 - u) + Math.sin(u * 9 + h.seed * 9 + t * 20) * 3 * (1 - u)); } ctx.stroke();
        ctx.strokeStyle = 'rgba(200,40,50,.8)'; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.restore(); } };
  HAZARD_FX.cblob = { // a gobbet of ink lobbed over him: its ring on the floor closes as it comes down
    update(h) { if (h.done) return; if (h.t <= 0) { h.done = true; if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r + 6 && P.z < 24 && P.state !== 'dead') hitPlayer({ kind: 'ranged', e: h.src }, h.dmg, h.x, false);
      inkPool(h.x, h.y, 24, 2.8); burst(h.x, h.y, 4, ['#140E16', '#4A424E', '#8A2030'], 8, 'goo'); } },
    draw(h, t) { if (h.done) return; const k = 1 - Math.max(0, h.t) / h.max; ctx.save();
      ctx.strokeStyle = `rgba(200,40,50,${.4 + .4 * k})`; ctx.lineWidth = 1.5; ell(h.x, h.y, h.r * (1.6 - .6 * k), h.r * .32 * (1.6 - .6 * k)); ctx.stroke();
      ctx.fillStyle = `rgba(16,10,18,${.15 + .35 * k})`; ell(h.x, h.y, h.r * k, h.r * .32 * k); ctx.fill();
      const x = h.sx + (h.x - h.sx) * k, y = h.sy + (h.y - h.sy) * k, z = h.sz * (1 - k) + Math.sin(Math.PI * k) * 120; ctx.fillStyle = '#0C080E'; ctx.beginPath(); ctx.ellipse(x, y - z, 6, 5 + 2 * Math.abs(Math.cos(k * 6)), 0, 0, TAU); ctx.fill();
      ctx.restore(); } };
  // ---------------- its death: the curse breaks, burns out, or tears free ----------------
  function carrierDeath(e, m) {
    m = m || {}; carrierInit(e);
    const h = e.cHops | 0, own = mine(m) || !!(m.pearl && !m.trump), chain = e.cChain.concat([graftOf(e)]).slice(-3);
    const [sx, sy] = sigilAt(e);
    if (h >= CAR.CAP) { breakCurse(e.x, e.y, e.z + e.hh * .6, h + 2, 'burn', e); return; }
    const how = own ? (m.finBase ? 'finisher' : m.perfect ? 'perfect' : ripNow() ? 'riposte' : null) : null;
    if (how) { breakCurse(e.x, e.y, e.z + e.hh * .6, h, how, e); return; }
    const z0 = clamp(e.y - sy, 28, 64);
    L.wisps.push({ x: sx, y: e.y, z: z0, z0, ph: 'out', t: 0, hops: h, chain, from: e, tr: [], trT: 0, seed: Math.random() });
    floatText(e.x, e.y, e.hh + 30, 'THE CURSE TEARS FREE', '#C8C2CC', 12); sfx('growl'); tn(116, .5, 'sawtooth', .05, 72);
    burst(sx, e.y, z0, ['#0C080E', '#3A3240', '#8A2030'], 12, 'goo', 0, true);
  }
  function breakCurse(x, y, z, h, how, e) {
    const burn = how === 'burn', n = Math.round(18 * (1 + stageIdx * .5) * (1 + .5 * (save.cycle | 0)) * (1 + h) * (burn ? 1.5 : 1)), pcs = Math.min(12, 3 + h * 2);
    for (let i = 0; i < pcs; i++) { const k = makeLoot('shard', x, y, Math.ceil(n / pcs)); k.vz += 140; k.vx *= 2.4; loot.push(k); }
    const heal = Math.round(maxHp() * ((burn ? .2 : .05) + .03 * h));
    if (P && P.hp > 0) { P.hp = Math.min(maxHp(), P.hp + heal); floatText(P.x, P.y, 92, '+' + heal, '#8AE8A0', 13); }
    ease((burn ? 4 : 1.2) + .6 * h, burn ? 'the passing curse burnt out' : 'the passing curse broken (' + how + ')');
    clearInk();
    floatText(x, y, z + 56, burn ? 'THE CURSE BURNS OUT' : 'THE CURSE BREAKS', '#FFE2A0', burn ? 21 : 18); floatText(x, y, z + 36, HOW[how] || '', '#E8D0A0', 11);
    slowmo = Math.max(slowmo, burn ? 1.1 : .75); flashT = Math.max(flashT, .2); hitstop = Math.max(hitstop, .12); shakeMag = Math.max(shakeMag, burn ? 11 : 8); zoom = Math.max(zoom, .05);
    fx.push({ kind: 'ring', x, y, z: 2, t: .7, max: .7, r: 150 + 22 * h, col: '#FFD27A', flat: 1 }); fx.push({ kind: 'ring', x, y, z, t: .4, max: .4, r: 60, col: '#FFFFFF' });
    burst(x, y, z, ['#FFE6A0', '#FFD27A', '#FFFFFF', '#D8AA55'], (lite() ? 16 : 30) + 5 * h, 'spark', 0, true);
    burst(x, y, z, ['#0C080E', '#3A3240'], 10, 'goo', 0, true);
    for (let i = 0, N = lite() ? 14 : 30; i < N; i++) parts.push({ x: x + rand(-110, 110), y: y + rand(-14, 14), z: rand(120, 230), vx: rand(-20, 20), vy: 0, vz: rand(-60, 10), life: rand(.9, 1.6), max: 1.6, col: pick(['#FFE6A0', '#FFD27A', '#FFF4D8', '#D8AA55']), size: rand(2.6, 4.6), shape: 'star', rot: 0, vr: rand(-6, 6) }); // (gold rain)
    sfx('learned'); sfx('break'); tn(523, .5, 'triangle', .06); tn(659, .5, 'triangle', .05, 0, .07); tn(784, .8, 'triangle', .05, 0, .14); if (burn) tn(1047, 1, 'sine', .05, 0, .24);
    if (e) graftsFly(e);
    L.cStat.broke++; if (burn) L.cStat.burnt++; L.cStat.last = how;
  }
  function graftsFly(e) { // (torn off it, they tumble away grey and are gone)
    const ch = e.cChain || []; if (!ch.length) return;
    ch.forEach((g, i) => { const sl = GSLOT[i % 3], k = carScale(e); hazards.push({ kind: 'armorbit', fn: () => graftPiece(g, e), x: e.x + sl[0] * e.cBase.hw * k * e.facing, y: e.y + rand(-3, 3), z: e.z - sl[1] * e.cBase.hh * k,
      vx: rand(-240, 240), vz: rand(260, 400), rot: 0, vr: rand(-11, 11), sc: k, facing: e.facing, t: 1.5, max: 1.5, bounced: 0, fading: 1 }); });
  }
  // ---------------- the wisp, between hosts ----------------
  function pickHost(w) {
    let best = null, bd = CAR.RANGE;
    for (const o of enemies) { if (o.dead || o.cursed || o.boss || o.cNoCurse || o === w.from || !EDEF[o.type] || o.remove) continue;
      if (o.x < camX - 40 || o.x > camX + VW + 40) continue; const d = Math.hypot(o.x - w.x, (o.y - w.y) * 1.5); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function pickCorpse(w) { // (never its own host, just fallen)
    let best = null, bd = 420;
    for (const c of corpses) { if (c === w.from || c.boss || !EDEF[c.type] || c.pform || c.cGone) continue; const d = Math.hypot(c.x - w.x, (c.y - w.y) * 1.5); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  const wispGoal = (w) => w.tg ? [w.tg.x - w.tg.facing * w.tg.hw * .6, w.tg.y, w.tg.z + w.tg.hh * .95] : w.co ? [w.co.x, w.co.y, 10] : [P.x, P.y, 0];
  function wispStep(w, dt) {
    w.t += dt; w.trT -= dt; if (w.trT <= 0) { w.trT = .03; w.tr.push([w.x, w.y - w.z]); if (w.tr.length > 10) w.tr.shift(); }
    if (w.ph === 'out') { // (tearing free: rimmed in gold, open to a blow)
      const k = w.t / CAR.OUT; w.z = w.z0 + 16 * sm(k); w.x += Math.sin(w.t * 40) * .6;
      if (playerHits(w.x, w.y, w.z - 12, 14, 26)) { w.done = true; breakCurse(w.x, w.y, w.z, w.hops, 'wisp', null); return; }
      if (w.t >= CAR.OUT) launch(w);
      return;
    }
    if (w.ph === 'fly') {
      if (w.tg && (w.tg.dead || w.tg.cursed)) { w.tg = null; const o = pickHost(w); if (o) w.tg = o; else { w.co = pickCorpse(w); } }
      if (w.co && (w.co.cGone || !corpses.includes(w.co))) w.co = null;
      const k = cl01(w.t / w.dur), u = sm(k), [gx, gy, gz] = wispGoal(w);
      w.x = w.sx + (gx - w.sx) * u; w.y = w.sy + (gy - w.sy) * u; w.z = w.sz + (gz - w.sz) * u + Math.sin(Math.PI * k) * w.arc;
      if (playerHits(w.x, w.y, w.z - 12, 14, 26)) { w.done = true; breakCurse(w.x, w.y, w.z, w.hops, 'wisp', null); return; }
      if (k >= 1) { w.done = true; if (w.tg && !w.tg.dead && !w.tg.cursed) possess(w.tg, w); else if (w.co && corpses.includes(w.co)) raise(w.co, w); else startShade(w); }
    }
  }
  function launch(w) {
    w.ph = 'fly'; w.t = 0; w.sx = w.x; w.sy = w.y; w.sz = w.z;
    w.tg = pickHost(w); if (!w.tg) w.co = pickCorpse(w);
    const [gx, gy] = wispGoal(w), d = Math.hypot(gx - w.x, gy - w.y); w.dur = clamp(.8 + d / 900, .8, 1.2) * CAR.FLY; w.arc = 70 + Math.min(110, d * .25);
    sfx('whoosh'); tn(196, .7, 'triangle', .035, 98);
  }
  function possess(o, w) {
    const h = Math.min(CAR.CAP, w.hops + 1);
    curseFoe(o, 'carrier'); o.cHops = h; o.cChain = w.chain; o.cArmSaid = 0; applyHop(o);
    o.flash = .2; o.jit = .45; o.sqx = 1.35; o.sqy = .72; o.state = 'hurt'; o.t = .4; o.plan = null; o.vx = 0;
    feed(.6 + .2 * h, 'the curse passes on (' + h + ')'); L.cStat.hops++;
    burst(o.x, o.y, o.hh * .8, ['#0C080E', '#3A3240', '#8A2030', '#77727C'], 18, 'goo', 0, true); fx.push({ kind: 'ring', x: o.x, y: o.y, z: 2, t: .4, max: .4, r: 50 + 6 * h, col: '#3A3240', flat: 1 });
    sfx('growl'); tn(82, .6, 'sawtooth', .06, 55); shakeMag = Math.max(shakeMag, 3 + h);
    if (h >= CAR.CAP) chimera(o);
    else if (!L.carSaid) { L.carSaid = true; floatText(o.x, o.y, o.hh + 56, 'THE CURSE PASSES ON', '#D8D0DC', 15); }
    else floatText(o.x, o.y, o.hh + 46, 'IT PASSES ON · ' + h, '#C8C2CC', 12);
  }
  function chimera(o) {
    o.cChim = 1; banner('CHIMERA OF THE CURSE', 'IT WEARS EVERY HOST IT HAS TAKEN · BRING IT DOWN AND THE CURSE BURNS OUT', 2.6);
    sfx('roar'); shakeMag = Math.max(shakeMag, 9); flashT = Math.max(flashT, .08); o.cAtkT = 1.6;
  }
  function raise(co, w) { // (the dead get up wrong)
    const i = corpses.indexOf(co); if (i < 0) return startShade(w);
    const c = spawnEnemy(co.type, 1, false); if (!c) return startShade(w);
    corpses.splice(i, 1); co.cGone = 1;
    c.x = co.x; c.y = co.y; c.z = 0; c.facing = Math.sign(P.x - co.x) || co.facing; c.dropWeapon = null; c.cRisen = 1; c.cRise = .9; c.state = 'hurt'; c.t = .9; c.cd = 1.6; c.plan = null;
    if (c.elite) { c.elite = false; c.guard = c.guardMax = 0; } c.cMask = null;
    curseFoe(c, 'carrier'); c.cBase.hp = Math.round(c.cBase.hp * .7);
    possess(c, w); c.state = 'hurt'; c.t = .9; L.cStat.risen++;
    floatText(c.x, c.y, c.hh + 70, 'THE DEAD GET UP WRONG', '#C8C2CC', 13); sfx('crunch');
    waveActive = true; if (lockX === null) lockX = clamp(camX, 0, stage.len - VW);
  }
  // ---------------- his own shadow, taken ----------------
  function startShade(w) {
    if (!P || P.state === 'dead') return;
    const h = Math.min(CAR.CAP, w.hops + 1);
    if (L.shade) { L.shade.hops = Math.max(L.shade.hops, h); L.shade.dur += 2; return; }
    L.shade = { t: 0, rise: .9, dur: CAR.SHADE, hops: h, x: P.x, y: P.y, z: 0, f: P.facing, pose: playerPose(), atkT: 1.7, wind: 0, seed: Math.random() };
    feed(.6 + .2 * h, 'the curse took his shadow'); L.cStat.shades++;
    floatText(P.x, P.y, 124, 'IT TAKES HIS OWN SHADOW', '#D8D0DC', 14); sfx('growl'); tn(73, 1, 'sawtooth', .06, 49);
  }
  function shadeStep(S, dt) {
    S.t += dt; const q = L.rec[Math.max(0, L.rec.length - 13)];
    if (q) { S.x += (q.x - S.x) * Math.min(1, dt * 7); S.y += (q.y - S.y) * Math.min(1, dt * 7); S.z = q.z; S.f = q.f; S.pose = q.pose; }
    if (S.t > .3 && playerHits(S.x, S.y, S.z, 14, 60)) { L.shade = null; breakCurse(S.x, S.y, 40, S.hops, 'shadow', null); return; }
    if (S.t >= S.dur || P.state === 'dead') { L.shade = null; feed(1.2 + .3 * S.hops, 'his shadow kept the curse'); L.cStat.sank++; floatText(P.x, P.y, 110, 'IT SINKS BACK INTO HIM', '#A898B0', 12);
      burst(S.x, S.y, 30, ['#0C080E', '#3A3240'], 14, 'goo'); return; }
    if (S.t < S.rise) return;
    if (S.wind > 0) { S.wind -= dt; if (S.wind <= 0) { S.atkT = rand(1.1, 1.5); sfx('swing');
        fx.push({ kind: 'slash', x: S.x + S.f * 20, y: S.y, z: 40, ang: rand(-.4, .4), t: .2, max: .2, size: 44, col: '#3A1A24' });
        if (Math.abs(P.x - S.x) < 52 && Math.abs(P.y - S.y) < 20 && P.z < 36) playerDamage(Math.max(4, Math.round(maxHp() * (.05 + .01 * S.hops))), S.x, false); } }
    else { S.atkT -= dt; if (S.atkT <= 0) { S.wind = .5; sfx('growl', .4); } }
  }
  function carrierStep(dt) {
    for (const w of L.wisps) wispStep(w, dt);
    L.wisps = L.wisps.filter(w => !w.done);
    if (L.shade) shadeStep(L.shade, dt);
  }
  // its puddles drag at his feet (not while he dodges or is off the ground)
  { const _up = updatePlayer; updatePlayer = function (dt) {
    const x0 = P ? P.x : 0, y0 = P ? P.y : 0; const r = _up(dt);
    if (!NG() || !P || P.state === 'dodge' || P.z > 4 || !hazards.length || Math.abs(P.x - x0) > 24) return r; // (not a blink or a jump of place)
    for (const h of hazards) if (h.kind === 'cink' && h.t > .25 && Math.hypot(P.x - h.x, (P.y - h.y) * 3.2) < h.r) {
      P.x = x0 + (P.x - x0) * .5; P.y = y0 + (P.y - y0) * .5;
      if (Math.abs(P.x - x0) > .2 && Math.random() < .25) parts.push({ x: P.x + rand(-6, 6), y: P.y, z: 1, vx: rand(-30, 30), vy: 0, vz: rand(40, 90), life: .35, max: .35, col: pick(['#1A141E', '#4A424E']), size: rand(1.5, 3), shape: 'blob', rot: 0, vr: 0 });
      break; }
    return r; }; }
  // ---------------- what it looks like ----------------
  function wispArt(x, y, r, t, o) { // a knot of ink with eyes in it, a thread of ink trailing; rimmed in gold while it can be broken
    const sd = o.seed || 0; ctx.save(); ctx.lineCap = 'round';
    const tr = o.tr; if (tr && tr.length > 1 && !lite()) { const n = tr.length; for (let i = 1; i < n; i++) { const a = tr[i - 1], b = tr[i], k = i / n; ctx.strokeStyle = `rgba(12,8,14,${.12 + .6 * k})`; ctx.lineWidth = Math.max(.6, r * .6 * k); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      const a = tr[n - 1]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(x, y); ctx.lineWidth = r * .6; ctx.strokeStyle = 'rgba(12,8,14,.72)'; ctx.stroke(); }
    if (o.open) { const g = .5 + .5 * Math.sin(t * 22); ctx.fillStyle = `rgba(255,210,120,${.16 + .14 * g})`; circle(x, y, r * 2.1); ctx.fill(); }
    ctx.beginPath(); for (let j = 0; j <= 9; j++) { const an = j / 9 * TAU, rr = r * (1 + .2 * Math.sin(t * 5 + j * 2.1 + sd * 7)), px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * .86; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath();
    ctx.fillStyle = '#0B070D'; ctx.fill(); ctx.lineWidth = Math.max(.8, r * (o.open ? .2 : .12)); ctx.strokeStyle = o.open ? `rgba(255,214,120,${.65 + .35 * Math.sin(t * 22)})` : 'rgba(150,140,152,.62)'; ctx.stroke();
    if (!lite()) { ctx.strokeStyle = 'rgba(14,10,16,.72)'; ctx.lineWidth = Math.max(.6, r * .22); ctx.beginPath();
      for (let j = 0; j < 3; j++) { const an = Math.PI * (.3 + j * .2) + Math.sin(t * 3 + j + sd) * .3, x1 = x + Math.cos(an) * r * .85, y1 = y + Math.sin(an) * r * .75; ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + Math.cos(an + 1) * r * .8, y1 + r * .7, x1 + Math.sin(t * 4 + j) * r * .5, y1 + r * 1.5); } ctx.stroke(); }
    const bl = (t * .31 + sd) % 1 < .04 ? .15 : 1;
    for (const s of [-1, 1]) { const ex = x + s * r * .36, ey = y - r * .1; ctx.fillStyle = o.open ? '#FFF2D0' : '#D8D0D8'; ctx.beginPath(); ctx.ellipse(ex, ey, r * .21, r * .13 * bl, s * -.3, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(232,40,48,${.85 + .15 * Math.sin(t * 7)})`; circle(ex, ey, r * .085); ctx.fill(); }
    ctx.restore();
  }
  const GSLOT = [[-.5, -.9, -.55], [.4, -.92, .5], [-.05, -1.04, -.08]]; // (where the grafts grow, in its own drawing: the back shoulder, the front one, the crown)
  function graftDraw(g, t, atk) { // (a host worn: its upper half, its own drawing, greyed; the cut at 0,0)
    const ga = { walk: 0, t, wind: 0, atk: !!atk, hurt: false }; if (g.draw === 'knight' || g.draw === 'colossus' || g.draw === 'human') ga.pose = humanEnemyPose(g.s);
    ctx.save(); ctx.translate(0, g.hh * .35); ctx.beginPath(); ctx.rect(-g.hw * 4 - 40, -g.hh * 1.8 - 30, g.hw * 8 + 80, g.hh * 1.45 + 30); ctx.clip();
    try { CREATURES[g.draw](g.s, ga); if (!LITE && !lite() && !FLASH && !TINT) { const tt = TINT; ctx.globalAlpha *= .6; TINT = '#77727C'; try { CREATURES[g.draw](g.s, ga); } finally { TINT = tt; } } } catch (err) { console.error(err); }
    ctx.restore();
  }
  function graftScale(g, e) { return clamp(e.cBase.hh * .8 / Math.max(10, g.hh), .42, .8) * (e.cHops >= CAR.CAP ? 1.15 : 1); }
  function graftPiece(g, e) { const s = graftScale(g, e); ctx.save(); ctx.scale(s, s); ctx.translate(0, g.hh * .4); graftDraw(g, now(), false); ctx.restore(); }
  function seam(r) { // (where a graft is stitched on: a black seam, red stitches across it)
    ctx.fillStyle = '#0C080C'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .42, 0, 0, TAU); ctx.fill();
    if (FLASH || TINT) return; ctx.strokeStyle = 'rgba(200,40,50,.9)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * r * .36 - 1.5, -r * .5); ctx.lineTo(i * r * .36 + 1.5, r * .5); } ctx.stroke();
  }
  function wearGrafts(e, a, t) {
    const ch = e.cChain; if (!ch || !ch.length) return; const B = e.cBase, n = (LITE || lite()) ? 1 : 3, list = ch.slice(-n);
    list.forEach((g, j) => { const i = ch.length - list.length + j, sl = GSLOT[i % 3];
      const sway = Math.sin(t * 2.3 + g.seed * 9) * .14 + (a.atk ? (i % 2 ? .45 : -.45) : 0) + (a.wind || 0) * -.3, s = graftScale(g, e);
      ctx.save(); ctx.translate(sl[0] * B.hw, sl[1] * B.hh); ctx.rotate(sl[2] + sway);
      ctx.save(); ctx.scale(s, s); graftDraw(g, t, a.atk); ctx.restore(); seam(Math.max(4, B.hw * .32)); ctx.restore(); });
  }
  { const _w = drawEnemy; drawEnemy = function (e, t) {
    if (!NG() || !e || e.cTrait !== 'carrier' || !e.cBase || DBL_DRAW || (e.state === 'dying' && e.death && e.death !== 'pop')) return _w(e, t);
    const k = carScale(e), hw = e.hw, hh = e.hh, B = e.cBase, rs = e.cRise > 0 ? sm(1 - e.cRise / .9) : 1, key = e.def.draw, o = CREATURES[key]; let done = false;
    CREATURES[key] = function (en, a) { if (en !== e || done || TINT) return o(en, a); done = true; o(en, a); if (!e.dead) wearGrafts(e, a, t); };
    e.hw = B.hw; e.hh = B.hh; ctx.save();
    ctx.translate(e.x, e.y); if (e.cRisen && !e.dead) ctx.rotate((1 - rs) * -1.2 * e.facing + Math.sin(t * 2.1) * .05 + (Math.sin(t * 13 + e.cid * 50) > .94 ? .12 * e.facing : 0)); ctx.scale(k, k * (.3 + .7 * rs)); ctx.translate(-e.x, -e.y); // (one of the risen: it gets up wrong and twitches)
    try { _w(e, t); } finally { CREATURES[key] = o; e.hw = hw; e.hh = hh; ctx.restore(); }
    if (e.dead || TINT || FLASH) return;
    const h = e.cHops | 0, [sx, sy] = sigilAt(e);
    wispArt(sx, sy, (6 + .9 * h) * Math.min(1.2, Math.sqrt(B.hh / 40)), t, { tr: e.cTr, seed: e.cid });
    const my = e.y - e.z - e.hh - 10 * k - 12;
    for (let i = 0; i < h; i++) circleMark(sx - e.facing * (8 + i * 6.5), sy - 3 - i * 2.4 + Math.sin(t * 3 + i) * 1.2, 2.6, t + i); // (a mark of the Circle for every hop the curse has made: beads on the ink thread trailing off its knot)
    if (e.cChim) { const w = 120, x = e.x - w / 2, y = my - 16; ctx.save(); ctx.fillStyle = 'rgba(10,6,12,.85)'; rrect(x - 2, y - 2, w + 4, 8, 3); ctx.fill(); ctx.fillStyle = '#A02838'; rrect(x, y, Math.max(0, w * e.hp / e.maxHp), 4, 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.font = '700 10px Cinzel, Georgia, serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#0A060C'; ctx.strokeText('CHIMERA OF THE CURSE', e.x, y - 5); ctx.fillStyle = '#D8D0DC'; ctx.fillText('CHIMERA OF THE CURSE', e.x, y - 5); ctx.restore(); }
  }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!NG() || !P) return;
    for (const w of L.wisps) {
      if (w.ph === 'fly') { const [gx, gy] = wispGoal(w), k = cl01(w.t / w.dur); list.push([gy - .3, () => onMain(() => { ctx.save(); ctx.strokeStyle = `rgba(14,10,16,${.4 + .4 * k})`; ctx.lineWidth = 3; ell(gx, gy, 46 - 28 * k, (46 - 28 * k) * .3); ctx.stroke();
        ctx.strokeStyle = `rgba(200,40,50,${.4 + .4 * Math.sin(t * 20)})`; ctx.lineWidth = 1.2; ell(gx, gy, 50 - 30 * k, (50 - 30 * k) * .3); ctx.stroke(); ctx.restore(); })]); } // (where it will land: a ring of ink closing)
      list.push([w.y + .3, () => { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(w.x, w.y, 7, 2.2); ctx.fill(); ctx.restore(); wispArt(w.x, w.y - w.z, 8 + .6 * w.hops, t, { tr: w.tr, seed: w.seed, open: w.ph === 'out' || w.t < .25 }); }]); }
    const S = L.shade; if (S) { const a = S.t < S.rise ? S.t / S.rise : Math.min(1, (S.dur - S.t) / .4);
      list.push([P.y - .2, () => onMain(() => { ctx.save(); ctx.fillStyle = `rgba(8,4,10,${.55 * (S.t < S.rise ? 1 - a * .4 : .6)})`; ell(P.x - P.facing * 4, P.y + 2, 22 + 18 * (S.t < S.rise ? a : 1), 6); ctx.fill(); ctx.restore(); })]); // (his shadow, gone black under him)
      if (S.t > .15) list.push([S.y - .04, () => onMain(() => { ctx.save(); const tt = TINT; TINT = S.wind > 0 && Math.floor(t * 20) % 2 ? '#5A1018' : '#0C070E';
        if (S.t < S.rise) { ctx.beginPath(); ctx.rect(S.x - 80, S.y - S.z - 120 * a, 160, 130 * a + 4); ctx.clip(); }
        try { drawPlayerAt(S.x, S.y, S.z, S.f, Object.assign({}, S.pose || {}, { noCloak: 1 }), .88 * a); } finally { TINT = tt; }
        for (const s of [-1, 1]) { ctx.fillStyle = S.wind > 0 ? '#FFD0C0' : 'rgba(232,40,48,.95)'; circle(S.x + S.f * 3 + s * 2.6, S.y - S.z - 60, 1.3); ctx.fill(); }
        ctx.restore(); })]); }
  }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (!NG()) return;
    for (const e of enemies) if (e.cTrait === 'carrier' && !e.dead) box(e.x, e.y, e.z, e.hw * 2 + 90, e.hh * 1.5 + 90);
    for (const w of L.wisps) box(w.x, w.y, w.z, 40, 50); }; }
  const CARRIER = { CAR, live: () => ({ get wisps() { return L.wisps; }, get shade() { return L.shade; }, get stat() { return L.cStat; } }), possess: (o, hops, from) => possess(o, { hops: (hops | 0) - 1, chain: from ? from.map(graftOf) : [] }), breakCurse, ripNow };

  // ======================================================================================================
  // THE SHRINE ROOMS: behind a card gate, a font that washes the curse out (shadowrooms.js deals it)
  // ======================================================================================================
  if (typeof SR_KINDS !== 'undefined') {
    SR_KINDS.cleanse = { place: ['Font', 'Spring', 'Well', 'Chapel', 'Lustral Pool'], sub: () => 'THE WATER REMEMBERS WHAT YOU WERE',
      build(G) { G.forceMood = 'pale'; return { len: 1200, rawWaves: [] }; },
      start(R) { R.pads = [{ id: 'font', x: 620, y: FLOOR_TOP + 50, p: 0 }]; },
      update(R, dt) { if (R.chosen) return; srPads(R, dt, 1.1, (pd) => { R.chosen = 'font'; pd.done = true; R.chosenAt = R.t; shrineCleanse(pd); }); },
      list(R, list, t) { const pd = R.pads[0]; list.push([pd.y, () => {
        const sp = propSprite('cfont' + R.gen.seed, 90, 80, 45, 64, () => { const s = R.gen.pal.stone; ctx.fillStyle = s.dark; ell(0, -4, 40, 11); ctx.fill(); ctx.fillStyle = s.base; ctx.fillRect(-34, -26, 68, 22); ctx.fillStyle = s.lit; ctx.fillRect(-34, -26, 68, 4);
          ctx.fillStyle = s.base; ell(0, -26, 36, 10); ctx.fill(); ctx.fillStyle = '#9FC8D8'; ell(0, -27, 30, 7.5); ctx.fill(); ctx.fillStyle = s.mortar; ctx.fillRect(-4, -44, 8, 18); ctx.fillStyle = s.lit; circle(0, -48, 6); ctx.fill(); }, { foot: 14, seed: 91 });
        propDraw(sp, pd.x, pd.y, { sh: 40 });
        onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = R.chosen ? .15 : .35 + .1 * Math.sin(t * 2); softDab(pd.x, pd.y - 30, 40, '200,230,255', a);
          for (let i = 0; i < 6; i++) { const u = (t * .4 + i / 6) % 1; ctx.fillStyle = `rgba(230,245,255,${(1 - u) * .7})`; circle(pd.x + Math.sin(i * 2.3 + t) * 20, pd.y - 30 - u * 50, 1.4); ctx.fill(); } ctx.restore();
          if (!R.chosen) { srLabel(pd.x, pd.y - 74, 'STAND IN THE WATER', 9); srRing(pd, pd.x, pd.y); } else srLabel(pd.x, pd.y - 74, 'WASHED', 9); }); }]); },
      boxes(R, box) { for (const pd of R.pads) box(pd.x, pd.y, 0, 70, 120); } };
  }
  function shrineCleanse(pd) {
    const c = CS(), items = cleanseAll(); c.horn = Math.round(c.horn * .55 * 10) / 10; ease(-WT.shrine, 'a shrine room');
    banner('THE WATER TAKES IT', items ? 'THE BLACK WASHES OUT OF YOUR GEAR' : 'THE CURSE LOOSENS ITS HOLD ON YOU', 2.6);
    sfx('learned'); flashT = .2; P.hp = maxHp();
    burst(pd.x, pd.y, 40, ['#FFFFFF', '#C8E8F8', '#9FC8D8'], 40, 'spark', 0, true); fx.push({ kind: 'ring', x: pd.x, y: pd.y, z: 2, t: .6, max: .6, r: 120, col: '#C8E8F8', flat: 1 }); persist(); refreshHud(true);
  }
  if (typeof srDeal === 'function') { const _sd = srDeal; srDeal = function () {
    const want = NG() && tier() >= 1 && !L.shrineDealt && window.__forceRoom == null && Math.random() < (tier() >= 3 ? .6 : .45);
    if (!want && window.__forceRoom !== 'cleanse') return _sd();
    L.shrineDealt = true; const fr = window.__forceRoom, rm = window.__roomMods; SR_KIND_W.cleanse = 1e-6; window.__forceRoom = 'cleanse'; window.__roomMods = [];
    try { return _sd(); } finally { delete SR_KIND_W.cleanse; window.__forceRoom = fr === 'cleanse' ? null : fr; window.__roomMods = rm; }
  }; }

  // ======================================================================================================
  // DEV: a readout and sliders (dev games only), and the console
  // ======================================================================================================
  let devEl = null;
  function devHud() {
    const show = !!(window.DEV && DEV.active) && (mode === 'play' || mode === 'pause');
    if (!show) { if (devEl) devEl.hidden = true; return; }
    if (!devEl) { devEl = document.createElement('div'); devEl.id = 'curseDev'; devEl.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:60;background:rgba(10,6,14,.82);border:1px solid #6A4A6A;border-radius:6px;padding:5px 7px;color:#EADCE6;font:11px/1.35 system-ui,sans-serif;width:230px;pointer-events:auto';
      devEl.innerHTML = '<div id="cdTxt"></div><label style="display:flex;gap:4px;align-items:center">curse <input id="cdV" type="range" min="0" max="100" step="1" style="flex:1"></label><label style="display:flex;gap:4px;align-items:center">horn <input id="cdH" type="range" min="0" max="100" step="1" style="flex:1"></label>' +
        '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px"><select id="cdFx" style="font-size:10px"><option value="">view effect…</option>' + Object.keys(FX_DUR).map(k => `<option>${k}</option>`).join('') + '</select><button data-c="item" style="font-size:10px">item</button><button data-c="road" style="font-size:10px">road</button><button data-c="shrine" style="font-size:10px">shrine</button><button data-c="heart" style="font-size:10px">heart</button></div>';
      document.body.appendChild(devEl);
      const stop = (e) => e.stopPropagation(); for (const ev of ['pointerdown', 'touchstart', 'keydown', 'click']) devEl.addEventListener(ev, stop);
      devEl.querySelector('#cdV').addEventListener('input', (e) => { if (NG()) { CS().v = +e.target.value; } });
      devEl.querySelector('#cdH').addEventListener('input', (e) => { if (NG()) { CS().horn = +e.target.value; } });
      devEl.querySelector('#cdFx').addEventListener('change', (e) => { if (e.target.value && NG()) startFx(e.target.value); e.target.value = ''; });
      devEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !NG()) return; const k = b.dataset.c;
        if (k === 'item') corruptItem(); if (k === 'road') makeRoad(); if (k === 'shrine' && typeof srTest === 'function') srTest(null, 'cleanse'); if (k === 'heart') CURSE.dev.heart(); }); }
    devEl.hidden = false;
    const txt = devEl.querySelector('#cdTxt');
    if (!NG()) { txt.textContent = 'curse: NG+ only (cycle 0)'; return; }
    const c = CS(); txt.innerHTML = `<b>curse</b> ${c.v.toFixed(1)} · tier ${tier()} ${TIER_NAME[tier()]} (eff ${teff()})<br><b>horn</b> ${c.horn.toFixed(1)} · stage ${hornSt()} · deaths ${c.deaths}${L.fx ? ' · fx ' + L.fx.k : ''}${finalHigh() ? ' · CIRCLE' : ''}${L.road ? ' · road' : ''}`;
    const sv = devEl.querySelector('#cdV'), sh = devEl.querySelector('#cdH'); if (document.activeElement !== sv) sv.value = c.v; if (document.activeElement !== sh) sh.value = c.horn;
  }
  setInterval(() => { try { devHud(); } catch (e) {} }, 250);
  // ---------------- THE CURSE METER (for testing): a bar under his health in every New Game+ game. Set SHOW_METER to
  // false to hide it again (the curse is meant to be felt, not read)
  const SHOW_METER = true;
  const SMALL = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches || innerWidth < 700; } catch (e) { return false; } })();
  const TIER_NAMES = ['UNTOUCHED', 'WHISPERS', 'TAINT', 'BLIGHT', 'CONSUMED'], HORN_NAMES = ['', 'SOUR', 'TURNING', 'TURNED', 'BLACK'];
  // a few words on what each reason is (shown after it in the ticker)
  const GLOSS = {
    'cruelty: overkill': 'a blow far past what it needed', 'massacre': '5 kills in quick succession', 'a kill from behind': 'a foe slain from its back',
    'a kill from behind (the glass turned it)': 'the mirror turned it', 'cruelty: a downed foe': 'hit a foe while it was down', 'cruelty: a corpse struck': 'hit a body',
    'a kill by a hazard': 'a foe killed by the world, not you', 'standing on the Black Road': 'step off it', 'cursed loot taken': 'black shards picked up',
    'a death': 'more each death this cycle', 'a death to a corrupted lord': 'fell to a cursed boss', 'the cursed weapon feeds': 'its hunger drawback',
    'the curse took his shadow': 'a cursed foe caught you', 'his shadow kept the curse': 'the shade was not broken in time',
    'the curse passes on': 'a carrier passed it on', 'the passing curse broken': 'carrier slain before it passed', 'the passing curse burnt out': 'carrier ran out of time',
    'restraint': 'let a downed foe get up unhit', 'a perfect parry': 'parry timed exactly', 'a perfect blow cleanses': 'a perfect charge that landed',
    'a perfect charge lands': 'perfect charged attack hit', 'a perfect draw lands': 'perfect bow draw hit', 'a perfect throw lands': 'perfect Pearl throw hit',
    'a purified blade cleanses': 'kill with a purified weapon', 'a Pearl kill': 'the Pearl purifies', 'a wave cleared unhit': 'no damage taken that wave',
    'a villager saved': 'Lorraine', 'a villager of Lorraine lost': 'Lorraine', 'a villager left to the Circle': 'Lorraine',
    'a shrine room': 'the shrine cleanses gear too', 'a lord of a world falls': 'boss beaten', 'a corrupted lord beaten cleanly': 'cursed boss, no deaths',
    'a world walked without falling': 'cleared a world without dying', 'the Horn of Lorraine blown': 'the Horn', 'the Pattern of his own walked': 'the Pattern',
    'the Abyss taken into the Pearl': 'the Pearl drinks the Abyss',
  };
  const gloss = (b) => GLOSS[b] || GLOSS[b.replace(/ \(.*\)$/, '')] || '';
  let meterEl = null, hist = [];
  function meter() {
    const show = SHOW_METER && NG() && !!save.w8relic && (mode === 'play' || mode === 'pause'); // (only once Lorraine is beaten: the Horn in hand)
    if (!show) { hist = []; if (meterEl) meterEl.hidden = true; return; }
    if (!meterEl) { const bars = document.querySelector('.hud-l .bars'); if (!bars) return;
      const W = SMALL ? 'min(160px,44vw)' : '225px';
      meterEl = document.createElement('div'); meterEl.id = 'curseMeter'; meterEl.style.cssText = `margin:3px 0 1px;pointer-events:none;font:700 ${SMALL ? 8 : 9}px/1.25 sans-serif;letter-spacing:.04em;color:#D8B8D0;text-shadow:0 1px 1px #000,0 0 2px #000;width:${W};background:rgba(12,6,16,.42);padding:2px 4px 3px;border-radius:3px`;
      meterEl.innerHTML = '<div style="position:relative;height:6px;width:100%;background:rgba(20,10,24,.75);border:1px solid #6A4A6A;border-radius:3px;overflow:hidden"><div id="cmFill" style="height:100%;width:0;background:linear-gradient(90deg,#7A5A8A,#A03050,#200810);transition:width .2s"></div>' +
        TIERS.map(x => `<div style="position:absolute;top:0;bottom:0;left:${x}%;width:1px;background:rgba(255,255,255,.35)"></div>`).join('') + '</div><div id="cmTxt" style="margin-top:1px;white-space:nowrap"></div><div id="cmTick" style="font-weight:600;letter-spacing:0"></div>';
      bars.appendChild(meterEl); }
    meterEl.hidden = false;
    const c = CS(), t = tier(), hs = hornSt(), tn = performance.now() / 1000;
    hist.push({ t: tn, v: c.v }); while (hist.length && tn - hist[0].t > 10) hist.shift();
    const dv = c.v - hist[0].v, next = TIERS.find(x => x > c.v);
    meterEl.querySelector('#cmFill').style.width = c.v.toFixed(1) + '%';
    const trend = Math.abs(dv) < .05 ? '<span style="color:#9A8A9A">— steady</span>' : dv > 0 ? `<span style="color:#FF7A8A">▲ +${dv.toFixed(1)}</span>` : `<span style="color:#FFE08A">▼ ${dv.toFixed(1)}</span>`;
    meterEl.querySelector('#cmTxt').innerHTML = `CURSE <b style="color:#fff">${c.v.toFixed(1)}</b> ${TIER_NAMES[t]} ${trend}<span style="color:#9A8A9A"> /10s</span>` +
      `<br><span style="color:#9A8A9A;font-weight:600">${next != null ? 'next tier at ' + next : 'max tier'} · horn ${c.horn.toFixed(0)}${hs ? ' ' + HORN_NAMES[hs] : ''}</span>`;
    const max = SMALL ? 3 : 5, rows = TICK.filter(x => tn - x.t < 7).slice(0, max);
    meterEl.querySelector('#cmTick').innerHTML = rows.map(x => { const a = Math.max(.25, 1 - Math.max(0, tn - x.t - 4) / 3), up = x.d > 0, g = gloss(x.base);
      return `<div style="opacity:${a.toFixed(2)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="color:${up ? '#FF7A8A' : '#FFE08A'}">${up ? '+' : '−'}${Math.abs(x.d).toFixed(2)}</span> ${x.why.replace(/ \(\d+ this cycle\)$/, '')}${x.n > 1 ? ' ×' + x.n : ''}${g && !SMALL ? `<span style="color:#9A8A9A"> · ${g}</span>` : ''}</div>`; }).join('');
  }
  setInterval(() => { try { meter(); } catch (e) {} }, 250);

  window.CURSE = {
    TIERS, TIER_NAME, HORN_ST, HIGH_END, RESIDUE, HORN_KEEP, WT, CURSED_VERSE, MASKS, WCURSE, ACURSE,
    state: () => NG() ? Object.assign({ tier: tier(), teff: teff(), hornSt: hornSt(), finalHigh: finalHigh() }, JSON.parse(JSON.stringify(CS()))) : null,
    live: () => L, log: () => LOG.slice(),
    set: (v, h) => { if (!NG()) return null; const c = CS(); if (v != null) c.v = clamp(+v, 0, 100); if (h != null) c.horn = clamp(+h, 0, 100); return c; },
    boss: { FAM: BFAM, tier: bTier, fire: (k) => boss && boss.cB && bossFire(boss, k || boss.cB.set[0]), burn: () => boss && boss.cB && burnBack(boss), cad: B_CAD },
    feed, ease, tier, teff, hornSt, hornWords, hornNotes, onHornBlow, fxAmt,
    carrier: CARRIER,
    fx: (k, dur) => NG() ? startFx(k, dur) : null, road: makeRoad, burnAt, curseFoe, corruptItem, cleanseAll, finalHigh, isCursedEnd,
    dev: { heart() { if (!NG()) return; const c = CS(); c.endCyc = save.cycle | 0; c.endHigh = true; c.heartDone = false; if (isFinal(stageIdx)) startHeart(); return 'heart'; },
      endHigh(on) { const c = CS(); c.endCyc = save.cycle | 0; c.endHigh = !!on; c.heartDone = false; persist(); return on; },
      finishHeart() { if (L.heart) L.heart.prog = 1; } },
  };
})();
