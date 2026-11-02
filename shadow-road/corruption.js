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
    pearlKill: -.5, cleanWorld: -5, cleanWave: -1.2, parry: -.8, perfect: -.6, restraint: -.4, shrine: -22, boss: -2.5, villSaved: -.6,
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
    heart: null, roadT: 4, itemDone: false, flick: 0, flickT: 2, rate: {}, lastWave: 0, villSaved: 0, cBurn: 0, cBurnT: 0, drumLast: 0, stdT: 0, coda: null, log: [] }; }
  const LOG = [];
  const note = (why, d) => { LOG.push({ why, d: Math.round(d * 100) / 100, v: Math.round(CS().v * 10) / 10, t: Math.round(now() * 10) / 10 }); if (LOG.length > 80) LOG.shift(); };
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
    if (NG() && CTX && CTX.own && !e.boss && e.hp > 0 && dmg > Math.max(1, e.hp) * 3 && dmg - e.hp > 30 && rl('ovk', .4)) feed(WT.overkill, 'cruelty: overkill');
    return _he(e, dmg, dir, m, crit);
  };
  // ---------------- every kill ----------------
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    const was = e.dead; const r = _kill(e, dir, m);
    if (!NG() || was || !e.dead) return r;
    m = m || {};
    const t = now(); L.kills.push(t); L.kills = L.kills.filter(k => t - k < 2);
    if (L.kills.length >= 5) { L.kills = []; feed(WT.massacre, 'massacre'); }
    if (m.pearl && !m.trump) ease(-WT.pearlKill, 'a Pearl kill');
    const ctx0 = CTX && CTX.e === e ? CTX : null;
    if (ctx0 && ctx0.behind) feed(WT.backKill, e.w7turn > 0 ? 'a kill from behind (the glass turned it)' : 'a kill from behind');
    // thrown into a hazard: the death came from the place, not from him, moments after he sent it flying
    if (!mine(m) && m.trump && !(e.burn > 0) && e.cHitT && t - e.cHitT < 2.5 && !trumpBusy()) feed(WT.hazardKill, 'a kill by a hazard');
    if (e.boss) ease(-WT.boss, 'a lord of a world falls');
    if (e.cursed && !e.boss) cursedDeath(e);
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
  { const _rp = riposte; riposte = function (fromX) { if (NG() && rl('parry', .3)) ease(-WT.parry, 'a perfect parry'); return _rp(fromX); }; }
  { const _pc = perfectCue; perfectCue = function () { if (NG() && rl('perf', .3)) ease(-WT.perfect, 'a perfect charge'); return _pc.apply(this, arguments); }; }
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
    L.mimics = []; L.cloot = []; L.burns = []; L.fx = null; L.fxNext = rand(10, 18); L.rec = []; L.itemDone = false; L.kills = []; L.roadT = rand(5, 9);
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
    corpseHits(); villagers(); mimicStep(dt); clootStep(dt); verseStep(dt); patternStep(dt); roadStep(dt); pearlStep(dt); weaponStep(dt); heartStep(dt); fxSchedule(dt);
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
      feed(WT.corpse, 'cruelty: a corpse struck');
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
  // ---------------- corrupted foes ----------------
  const MASKS = { mossback: { col: '#5E7A3A', dk: '#2A3A18', atk: 'spike' }, colossus: { col: '#B88A48', dk: '#5A3A18', atk: 'ring' }, wyrm: { col: '#9FD8E0', dk: '#3A4A8A', atk: 'beam' },
    tyiga: { col: '#B880C0', dk: '#4A2050', atk: 'fall' }, sleeper: { col: '#E8E0D0', dk: '#6A6058', atk: 'ring' }, benedict: { col: '#C8D4EA', dk: '#4A566E', atk: 'beam' },
    w7king: { col: '#BFE8E8', dk: '#2A5A6A', atk: 'spike' }, w8goat: { col: '#3A3034', dk: '#0A0808', atk: 'cring' } };
  const _se = spawnEnemy;
  spawnEnemy = function (type, side, isBoss) {
    const e = _se(type, side, isBoss);
    if (!NG() || !e || e.boss) { if (e && e.boss && NG()) { try { bossInit(e); } catch (err) { console.error(err); } } return e; }
    const t = teff(), p = [0, 0, .12, .22, .35][t] * (finalHigh() ? 1.5 : 1);
    if (!(stage && stage.secret && !L.heart) && !e.cNoCurse && Math.random() < p) curseFoe(e);
    return e;
  };
  function curseFoe(e, trait) {
    if (e.cursed) { if (trait) e.cTrait = trait; return; }
    e.cursed = true; e.cid = e.cid || Math.random();
    e.cTrait = trait || (e.elite ? 'mask' : pick(['mimic', 'split', 'loot', 'mimic', 'split']));
    if (e.cTrait === 'mask') { const own = stage && STAGES[stageIdx] ? STAGES[stageIdx].boss : '', ids = Object.keys(MASKS).filter(k => k !== own && BOSSES[k]); e.cMask = pick(ids); e.cAtkT = rand(3, 5);
      if (playing()) floatText(e.x, e.y, e.hh + 40, 'IT WEARS THE FACE OF ' + BOSSES[e.cMask].name.toUpperCase(), '#C8C2CC', 12); }
    e.hp = e.maxHp = Math.round(e.maxHp * 1.15);
  }
  function cursedDeath(e) {
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
    if (e.cTrait === 'mask' && ['idle', 'walk', 'recover'].includes(e.state) && Math.abs(e.x - P.x) < 300) { e.cAtkT -= dt; if (e.cAtkT <= 0) { e.cAtkT = rand(5.5, 8.5); borrowed(e, MASKS[e.cMask].atk); } }
  }
  function borrowed(e, k) { // one of another lord's attacks, borrowed with its face
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
  function drawMask(e, x, y, s, t) { // another lord's face, worn
    const M = MASKS[e.cMask]; if (!M) return; ctx.save(); ctx.translate(x, y); ctx.scale(e.facing * s, s);
    ctx.fillStyle = '#1A1218'; ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 11.5, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(-8, -10, 8, 10); g.addColorStop(0, awMixSafe(M.col, '#FFFFFF', .2)); g.addColorStop(1, awMixSafe(M.col, '#6A6070', .45)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 10.5, 0, 0, TAU); ctx.fill();
    const k = e.cMask; ctx.fillStyle = M.dk; ctx.strokeStyle = M.dk; ctx.lineWidth = 1.2;
    if (k === 'w8goat') { ctx.beginPath(); ctx.moveTo(-5, -8); ctx.quadraticCurveTo(-16, -16, -12, -2); ctx.moveTo(5, -8); ctx.quadraticCurveTo(16, -16, 12, -2); ctx.lineWidth = 2.6; ctx.stroke(); }
    if (k === 'mossback') { for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s2 * 8, -9, 5, 2.4, s2 * .6, 0, TAU); ctx.fill(); } }
    if (k === 'colossus') { ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2.6, 3); ctx.lineTo(i * 2.6, 8); ctx.stroke(); } }
    if (k === 'wyrm') { ctx.beginPath(); ctx.moveTo(0, -10.5); ctx.lineTo(4, -2); ctx.lineTo(0, 10.5); ctx.lineTo(-4, -2); ctx.closePath(); ctx.globalAlpha = .45; ctx.fill(); ctx.globalAlpha = 1; }
    if (k === 'tyiga') { ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-6, -14); ctx.lineTo(-2, -8); ctx.moveTo(8, -6); ctx.lineTo(6, -14); ctx.lineTo(2, -8); ctx.fill(); ctx.lineWidth = .7; ctx.beginPath(); for (const s2 of [-1, 1]) { ctx.moveTo(s2 * 3, 3); ctx.lineTo(s2 * 11, 1); ctx.moveTo(s2 * 3, 4.5); ctx.lineTo(s2 * 11, 5); } ctx.stroke(); }
    if (k === 'w7king') { ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 3.5 - 1.5, -9); ctx.lineTo(i * 3.5, -15); ctx.lineTo(i * 3.5 + 1.5, -9); } ctx.fill(); }
    if (k === 'benedict') { ctx.fillRect(-8, -2, 16, 2.4); }
    // the eyes: slits, a red light in them
    const eyeA = k === 'sleeper' ? 0 : 1; ctx.fillStyle = '#0A0608';
    for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s2 * 3.6, -2.5, 2.4, k === 'sleeper' ? .5 : 1.3, 0, 0, TAU); ctx.fill(); }
    if (eyeA) { ctx.fillStyle = `rgba(230,50,50,${.8 + .2 * Math.sin(t * 5)})`; for (const s2 of [-1, 1]) { circle(s2 * 3.6, -2.5, .9); ctx.fill(); } }
    ctx.restore();
  }
  const _de = drawEnemy;
  drawEnemy = function (e, t) {
    if (!NG() || DBL_DRAW) return _de(e, t);
    const puppet = L.fx && L.fx.k === 'puppet' && fxAmt() > .4;
    if (puppet && !TINT) { TINT = '#140C0A'; try { return _de(e, t); } finally { TINT = null; } }
    _de(e, t);
    if (!e.cursed || (e.state === 'dying' && e.death && e.death !== 'pop')) return;
    const sc = (e.boss ? e.size || 1 : e.champ ? 1.3 : 1) * (e.shrink || 1);
    if (!LITE && !lite() && !TINT && !FLASH) { const tt = TINT; ctx.save(); ctx.globalAlpha *= e.boss ? .32 : .5; TINT = '#77727C'; try { _de(e, t); } finally { TINT = tt; ctx.restore(); } } // (grey: painted over itself in the Circle's ash)
    { // (painted on the figure itself, in its own layer, so the figure does not cover it)
      const cy = e.y - e.z - e.hh * sc * .55;
      if (lite() || LITE) { ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#6A6670'; ell(e.x, cy, e.hw * .9, e.hh * .5 * sc); ctx.fill(); ctx.restore(); }
      if (e.cB) bossMark(e, e.x + e.facing * e.hw * .15, cy, sc, t); else circleMark(e.x + e.facing * e.hw * .15, cy, e.boss ? 9 : 5.5, t);
      if (e.cMask) drawMask(e, e.x + e.facing * e.hw * .25, e.y - e.z - e.hh * sc * .86, .95 * Math.min(1.6, Math.max(.8, e.hh / 60)), t);
      if (Math.random() < .25) parts.push({ x: e.x + rand(-e.hw, e.hw) * .6, y: e.y, z: e.z + rand(0, e.hh), vx: rand(-8, 8), vy: 0, vz: rand(20, 50), life: .7, max: .7, col: pick(['rgba(30,24,30,.7)', 'rgba(90,84,92,.6)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 });
    }
  };
  { const _dd = drawDeath; drawDeath = function (e, t) { if (NG() && L.fx && L.fx.k === 'puppet' && fxAmt() > .4 && !TINT) { TINT = '#140C0A'; try { return _dd(e, t); } finally { TINT = null; } } return _dd(e, t); }; }
  { const _dp = drawPlayerAt; drawPlayerAt = function (x, y, z, f, pose, a) { if (NG() && L.fx && L.fx.k === 'puppet' && fxAmt() > .4 && !TINT) { TINT = '#140C0A'; try { return _dp(x, y, z, f, pose, a); } finally { TINT = null; } } return _dp(x, y, z, f, pose, a); }; }

  // ---------------- the shifts of the view: each comes and goes in a stretch ----------------
  const FX_BY_TIER = { 2: ['drain', 'tilt', 'tear'], 3: ['drain', 'tilt', 'tear', 'mirror', 'puppet', 'rewind', 'tapestry'], 4: ['drain', 'tilt', 'tear', 'mirror', 'puppet', 'rewind', 'tapestry', 'close'] };
  const FX_DUR = { drain: [5, 8], tilt: [4.5, 7], tear: [1.4, 2.2], mirror: [4, 5.5], puppet: [5, 7], rewind: [1.3, 1.3], tapestry: [5, 7], close: [4, 6] };
  const busy = () => !!((typeof zoneTrans !== 'undefined' && zoneTrans) || (window.W8 && W8.cine && W8.cine()) || (window.ENDINGS && ENDINGS.active) || L.coda);
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
    if (P && P.w && P.w !== 'pearlw' && !c.wc[P.w] && WEAPONS[P.w]) opts.push('w');
    for (const s of GEAR_SLOTS) if (save.gear.eq[s] && !save.gear.eq[s].curse) opts.push(s);
    if (!opts.length) return false;
    const o = which || pick(opts);
    if (o === 'w') { const k = pick(Object.keys(WCURSE)); c.wc[P.w] = k; banner(WCURSE[k].name + ' ' + WEAPONS[P.w].name, 'BLACK VEINS RUN THROUGH IT · ' + WCURSE[k].txt.toUpperCase(), 2.4); }
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
  // the forge can draw the black out too, at a price
  const cleanseCost = () => ({ s: Math.round(260 * (1 + .5 * (save.cycle || 0))), g: 2 });
  { const _rf = renderForge; renderForge = function (note) { _rf(note); try { forgeRow(); } catch (e) { console.error(e); } }; }
  function forgeRow() {
    let el = document.getElementById('cForge'); const c = NG() ? CS() : null;
    const items = c ? [...Object.keys(c.wc).filter(w => WEAPONS[w]).map(w => `${WCURSE[c.wc[w]].name} ${WEAPONS[w].name}`), ...GEAR_SLOTS.filter(s => save.gear.eq[s] && save.gear.eq[s].curse).map(s => itemName(save.gear.eq[s]))] : [];
    if (!items.length) { if (el) el.remove(); return; }
    const anchor = document.getElementById('walkBtn'); if (!anchor) return;
    if (!el) { el = document.createElement('div'); el.id = 'cForge'; el.style.cssText = 'margin:8px auto;max-width:520px;padding:8px 10px;border:1px solid #5A4A5A;border-radius:6px;background:rgba(20,12,18,.6);color:#E8DCE4;font:13px/1.35 Georgia,serif;text-align:left'; anchor.parentElement.insertBefore(el, anchor); }
    const k = cleanseCost(), ok = save.shards >= k.s && save.sigils >= k.g;
    el.innerHTML = `<b style="font-family:Cinzel,Georgia,serif;color:#C8A0B0">BLACK VEINS</b> · ${items.join(' · ')}<br><span style="opacity:.8">The smith can draw the black out of them in the forge-fire.</span> <button type="button" class="buy" id="cCleanse" ${ok ? '' : 'disabled'}>Cleanse · ${costTxt(k)}</button>`;
    const b = el.querySelector('#cCleanse'); if (b) b.addEventListener('click', () => { const kk = cleanseCost(); if (save.shards < kk.s || save.sigils < kk.g) return; save.shards -= kk.s; save.sigils -= kk.g; const n = cleanseAll(); sfx('buy'); renderForge(n ? 'THE BLACK IS DRAWN OUT IN THE FIRE' : ''); });
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
    circleMark(D.x, cy, 6, t);
  }
  // ---------------- its mark: the Circle's ring, red-black veins out of it, and when it lies open, a glowing heart ----------------
  function bossMark(e, x, y, sc, t) {
    const B = e.cB, r = 9 + Math.min(5, e.hh / 40), n = lite() || LITE ? 4 : 7, len = Math.min(80, e.hh * .55);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a0 = hsh(i + 1) * TAU, L2 = (.5 + hsh(i + 9) * .6) * len * (1 + .12 * Math.sin(t * 2 + i)); ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 1; s <= 4; s++) { const aa = a0 + (hsh(i * 7 + s) - .5) * .9; ctx.lineTo(x + Math.cos(aa) * L2 * s / 4, y + Math.sin(aa) * L2 * s / 4 * .9); }
      ctx.strokeStyle = 'rgba(14,6,10,.75)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = `rgba(${(170 + 50 * Math.sin(t * 3 + i)) | 0},30,40,.85)`; ctx.lineWidth = 1.1; ctx.stroke(); }
    if (B.wind > 0) { const k = B.wind / .8, R = e.hw * .9 + 30 + 90 * k; ctx.strokeStyle = `rgba(8,4,8,${.85 * (1 - k * .5)})`; ctx.lineWidth = 7; ell(e.x, e.y, R, R * .3); ctx.stroke();
      ctx.strokeStyle = 'rgba(190,30,44,.8)'; ctx.lineWidth = 1.6; ell(e.x, e.y, R, R * .3); ctx.stroke(); }
    const open = B.open > 0 || B.wind > 0, pulse = .6 + .4 * Math.sin(t * 10);
    if (B.burn > 0 || open) { const k = B.burn > 0 ? 1 : B.wind > 0 ? 1 : Math.min(1, B.open / .5); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); g.addColorStop(0, B.burn > 0 ? `rgba(255,236,190,${.8 * k})` : `rgba(255,70,60,${.75 * k * pulse})`); g.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
      ctx.globalCompositeOperation = 'source-over';
      if (B.open > 0 && B.burn <= 0) { ctx.strokeStyle = `rgba(255,220,200,${.85 * pulse})`; ctx.lineWidth = 1.5; circle(x, y, r * 1.9); ctx.stroke(); for (let i = 0; i < Math.min(3, B.pts | 0); i++) { ctx.fillStyle = '#FFE6C0'; circle(x - 8 + i * 8, y - r * 2.4, 2); ctx.fill(); } } }
    ctx.restore();
    if (B.burn > 0) { ctx.save(); ctx.globalAlpha = .55; circleMark(x, y, r * .8, t); ctx.restore(); } else circleMark(x, y, r, t);
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
  { const _wc = winCard; winCard = function (i) { const r = _wc(i); if (!isCursedEnd() || L.codaDone) return r;
    const c = CS(); c.ends[endingId(i)] = 'cursed'; persist();
    const ov = document.getElementById('winOv'); if (ov) ov.style.visibility = 'hidden';
    L.coda = { t: 0, i, last: performance.now() }; setTimeout(() => cursedWinText(), 0); return r; }; }
  function cursedWinText() { const k = $('#winOv .kicker'), h2 = $('#winOv .h2'); if (k) k.textContent = 'THE CURSE IS WALKED';
    if (h2) h2.textContent = 'A road of his own making';
    $('#winText').textContent = 'He reached the end of the road with the Black Circle in him, and walked a Pattern of his own at its heart while Chaos poured in. It holds. But the Black Road he made runs on from his feet to Lorraine, and what he loosed in Eric\'s dungeon is not finished with him. Walk the road again, gentler, and it may let him go.'; }
  function endCoda() { const ov = document.getElementById('winOv'); if (ov) ov.style.visibility = ''; L.coda = null; L.codaDone = true; cursedWinText(); }
  const codaSkip = () => { if (L.coda && L.coda.t > 1) { if (L.coda.t < 9) L.coda.t = 9; else endCoda(); } };
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, (e) => { if (L.coda) { codaSkip(); e.stopPropagation(); } }, true);
  function drawCoda(t) {
    const C = L.coda, nowT = performance.now(), dt = Math.min(.05, (nowT - C.last) / 1000); C.last = nowT; C.t += dt; const T = C.t;
    const line = Math.min(2, Math.floor(T / 3.4));
    if (T > 11.5) { endCoda(); return; }
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
    { const u = T - line * 3.4, a = Math.min(sm(u / .6), line < 2 ? sm((3.4 - u) / .5) : 1); g.textAlign = 'center'; g.globalAlpha = a;
      g.font = '700 17px Cinzel, Georgia, serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,6,10,.85)'; g.strokeText(CODA_LINES[line][0], VW / 2, Y_OFF + 40); g.fillStyle = '#EDE4F0'; g.fillText(CODA_LINES[line][0], VW / 2, Y_OFF + 40);
      g.font = '600 10px Cinzel, Georgia, serif'; g.lineWidth = 3; g.strokeText(CODA_LINES[line][1], VW / 2, Y_OFF + 58); g.fillStyle = '#C8A0B0'; g.fillText(CODA_LINES[line][1], VW / 2, Y_OFF + 58); g.globalAlpha = 1; }
    const fade = Math.min(sm(T / 1.2), sm((11.5 - T) / 1)); g.fillStyle = `rgba(0,0,0,${1 - fade})`; view();
    g.restore();
  }
  function playerPoseSafe() { try { const s = P.state; P.state = 'idle'; const p = playerPose(); P.state = s; return p; } catch (e) { return { walk: 0 }; } }

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
  const TIER_NAMES = ['UNTOUCHED', 'WHISPERS', 'TAINT', 'BLIGHT', 'CONSUMED'], HORN_NAMES = ['', 'SOUR', 'TURNING', 'TURNED', 'BLACK'];
  let meterEl = null;
  function meter() {
    const show = SHOW_METER && NG() && !!save.w8relic && (mode === 'play' || mode === 'pause'); // (only once Lorraine is beaten: the Horn in hand)
    if (!show) { if (meterEl) meterEl.hidden = true; return; }
    if (!meterEl) { const bars = document.querySelector('.hud-l .bars'); if (!bars) return;
      meterEl = document.createElement('div'); meterEl.id = 'curseMeter'; meterEl.style.cssText = 'margin:3px 0 1px;pointer-events:none;font:700 8px/1.1 sans-serif;letter-spacing:.08em;color:#D8B8D0;filter:drop-shadow(0 1px 1px #000)';
      meterEl.innerHTML = '<div style="position:relative;height:6px;width:min(150px,30vw);background:rgba(20,10,24,.75);border:1px solid #6A4A6A;border-radius:3px;overflow:hidden"><div id="cmFill" style="height:100%;width:0;background:linear-gradient(90deg,#7A5A8A,#A03050,#200810)"></div>' +
        TIERS.map(x => `<div style="position:absolute;top:0;bottom:0;left:${x}%;width:1px;background:rgba(255,255,255,.35)"></div>`).join('') + '</div><div id="cmTxt" style="margin-top:1px"></div>';
      bars.appendChild(meterEl); }
    meterEl.hidden = false;
    const c = CS(), t = tier(), hs = hornSt();
    meterEl.querySelector('#cmFill').style.width = c.v.toFixed(1) + '%';
    meterEl.querySelector('#cmTxt').textContent = `CURSE ${Math.round(c.v)} · ${TIER_NAMES[t]}${hs ? ' · HORN ' + HORN_NAMES[hs] : ''}`;
  }
  setInterval(() => { try { meter(); } catch (e) {} }, 250);

  window.CURSE = {
    TIERS, TIER_NAME, HORN_ST, HIGH_END, RESIDUE, HORN_KEEP, WT, CURSED_VERSE, MASKS, WCURSE, ACURSE,
    state: () => NG() ? Object.assign({ tier: tier(), teff: teff(), hornSt: hornSt(), finalHigh: finalHigh() }, JSON.parse(JSON.stringify(CS()))) : null,
    live: () => L, log: () => LOG.slice(),
    set: (v, h) => { if (!NG()) return null; const c = CS(); if (v != null) c.v = clamp(+v, 0, 100); if (h != null) c.horn = clamp(+h, 0, 100); return c; },
    boss: { FAM: BFAM, tier: bTier, fire: (k) => boss && boss.cB && bossFire(boss, k || boss.cB.set[0]), burn: () => boss && boss.cB && burnBack(boss), cad: B_CAD },
    feed, ease, tier, teff, hornSt, hornWords, hornNotes, onHornBlow, fxAmt,
    fx: (k, dur) => NG() ? startFx(k, dur) : null, road: makeRoad, burnAt, curseFoe, corruptItem, cleanseAll, finalHigh, isCursedEnd,
    dev: { heart() { if (!NG()) return; const c = CS(); c.endCyc = save.cycle | 0; c.endHigh = true; c.heartDone = false; if (isFinal(stageIdx)) startHeart(); return 'heart'; },
      endHigh(on) { const c = CS(); c.endCyc = save.cycle | 0; c.endHigh = !!on; c.heartDone = false; persist(); return on; },
      finishHeart() { if (L.heart) L.heart.prog = 1; } },
  };
})();
