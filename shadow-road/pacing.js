'use strict';
// ---------- the pacing of the waves ----------
// A wave no longer comes all at once into one locked screen. Each place paces its waves in its own way, chosen for what
// the place is, and keeps to it so the player learns it (the same foes, the same number, the same champions and carriers):
//   trickle   the wave arrives a few at a time: a first handful, then one more whenever the fight on screen thins out
//             (or a few seconds pass). Pips under the top of the view show how many are still to come
//   roll      the lock is a stretch of road about two screens long that he can walk through, its ends shown by a soft
//             veil; some of the wave already stand further down it. Once most of the wave is down the lock lifts (GO),
//             and the last of them follow him on
//   reinf     a core of the wave at the start, then one or two bursts mid-fight, each told a beat before it comes: a
//             shadow on the floor where each will land (or a mark at the screen's edge), a sound, a cry
//   roam      part of the next wave is already out in the place before it begins, idle by a fire, asleep, patrolling or
//             standing stock still. He can sneak up on them (a first blow on a sleeper lands harder). When one notices
//             him it calls the rest, and the wave begins
// Bosses, minibosses and the scripted fights are left exactly as they were: the places not listed here, and the waves
// left out of a listed place (the Plough's), keep the old single-screen wave.
const PACE_ZONES = {
  // Bloomwild Vale: the road through the vale passes a bandits' camp; the hollow's foes creep out of the thorns
  bloom: { roam: 'camp', trickle: 1, roamTypes: { bandit: 'sleep', slime: 'sleep', archer: 'watch', boar: 'patrol' } },
  bloom2: { trickle: 1 },
  // the Clockwork Skyport: the crews come down off the rigging and out of the airships overhead
  sky: { reinf: 1, roll: 1, cry: 'FROM THE RIGGING!' },
  sky2: { reinf: 1, cry: 'MORE COME DOWN!' },
  // the Prism Rim: things pull themselves together out of the light one by one, all along the open rim
  prism: { trickle: 1, roll: 1 },
  // the Courts of Chaos: they climb up out of the Abyss at your back
  chaos: { reinf: 1, cry: 'OUT OF THE ABYSS!' },
  // the dream: the piazza's figures stand still as statues until you come near; more step out of the pictures
  dream: { roam: 'piazza', reinf: 1, cry: 'OUT OF THE PICTURES!', roamTypes: { w6mannequin: 'still', w6bowler: 'still', w6clock: 'still', w6elephant: 'patrol' } },
  dream2: { reinf: 1, cry: 'OUT OF THE PICTURES!' },
  // Tir-na Nog'th: the ghosts of the city kindle out of the moonlight one at a time
  moon: { trickle: 1 },
  moon2: { trickle: 1 },
  // Rebma: the long sunken streets; the drowned rise from the sand and the swimmers come down from the water above
  rebma: { reinf: 1, roll: 1, cry: 'FROM THE WATER ABOVE!' },
  rebma2: { reinf: 1, roll: 1, cry: 'FROM THE WATER ABOVE!' },
  // Lorraine: the Circle's things crawl up out of the ground (the Plough's wave, the Edge's last, is left as it was)
  lorraine: { reinf: 1, rise: 'w8rise', cry: 'THE CIRCLE GIVES UP MORE' },
  lorraine2: { reinf: 1, rise: 'w8rise', cry: 'THE CIRCLE GIVES UP MORE', waves: [0] },
};
const PACE_T = { cue: .85, roll: 1.7, release: .2, nextGap: .45, trickleGap: [3.5, 6], trickleMin: 2.2, burstWait: 9, stray: 3 };
let PACE = null;
function paceReset() { PACE = { gen: (PACE ? PACE.gen : 0) + 1, stage, W: null, camp: null, fires: [], nextMin: -1e9, spot: null, cover: null, noAuto: false, held: [] }; }
paceReset();
function paceZone() { // this place's pacing, if it has one and the fight here is an ordinary wave
  if (typeof stage === 'undefined' || !stage || stage.secret || stage.bossRoom || bossSpawned) return null;
  return PACE_ZONES[stage.theme] || null;
}
const pacedWave = (Z, i) => !!Z && (!Z.waves || Z.waves.includes(i));
const paceVis = (x, m = 0) => x > camX + m && x < camX + VW - m;
const paceType = (t) => t.replace(/[*!]/g, '');
function paceCarrier(wi, j) { const d = carriers.find(c => c.wave === stage.w0 + wi && c.slot === j && !save.owned[c.weapon]); return d ? d.weapon : null; }
// spawn one of the wave's foes the way the queue does (a champion's '!', a carrier's weapon), without an entrance
function paceSpawn(type, side, drop, champ) {
  if (type.endsWith('!')) { type = type.slice(0, -1); champ = true; }
  PACE.noAuto = true; let e;
  try { e = spawnEnemy(type, side, false, champ); } finally { PACE.noAuto = false; }
  if (!e) return null;
  if (drop) e.dropWeapon = drop;
  if (champ) makeChampion(e);
  return e;
}

// ---------- the hooks ----------
{ const _ce = chooseEntrance; chooseEntrance = function (e) { if (PACE.noAuto) return false; return _ce(e); }; }
// an arrival that was told ahead lands where its shadow was shown
{ const _es = entranceSpot; entranceSpot = function (e) { if (PACE.spot != null) return PACE.spot; return _es(e); }; }
{ const _cn = coverNear; coverNear = function (e, kinds) { if (PACE.cover && (!kinds || kinds.includes(PACE.cover.kind))) return PACE.cover; return _cn(e, kinds); }; }
{ const _ez = enterZone; enterZone = function (z, Zs) { _ez(z, Zs); paceReset(); }; } // (a camp is set out on the first frame of play there)
// a first blow on a foe that hasn't seen him lands harder
{ const _st = strike; strike = function (e, base, dir, m, ...a) {
  if (e && e.parked && !e.dead && (e.parked.mode === 'sleep' || e.parked.mode === 'still') && !(m && m.trump)) { base = Math.round(base * 1.5); floatText(e.x, e.y, e.hh + 40, 'CAUGHT UNAWARES', '#EED48A', 12); }
  return _st(e, base, dir, m, ...a); }; }
{ const _wr = waveReady; waveReady = function () {
  const Z = paceZone(); if (!Z) return _wr();
  if (P.x < Math.min(PACE.nextMin, stage.len - 160)) return false; // (after a rolling fight: half a screen's walk before the next)
  const g = PACE.camp;
  if (g && g.wave === waveIdx) { // a camp's wave begins when they raise the alarm, or when he walks right through it
    if (g.alarm !== null) return g.alarm <= 0;
    const live = g.members.filter(e => !e.dead);
    return !live.length ? _wr() : P.x > g.cx + 70;
  }
  return _wr(); }; }
{ const _bw = beginWave; beginWave = function () {
  _bw();
  const Z = paceZone(); if (!pacedWave(Z, waveIdx)) return;
  try { paceBegin(Z); } catch (err) { console.error(err); } }; }
{ const _uw = updateWorld; updateWorld = function (dt) {
  if (!P || !stage) return _uw(dt);
  if (PACE.stage !== stage) paceReset();
  if (window.W8 && W8.cine && W8.cine()) return _uw(dt);
  const gen = PACE.gen, st0 = stage;
  try { pacePre(dt); } catch (err) { console.error(err); }
  // foes standing out in the place (not yet in the fight) are kept clear of the fight's own rules while it runs: the edge of
  // the view that pulls everyone in, and the rules of the place that throw everything about
  let held = null;
  for (const e of enemies) if (e.parked && !e.dead) (held = held || []).push(e);
  PACE.heldN = held ? held.length : 0; // (the way on stays shut while these still stand, world.js)
  if (held) enemies = enemies.filter(e => !(e.parked && !e.dead));
  let r;
  try { r = _uw(dt); } finally { if (held && PACE.gen === gen && stage === st0) for (const e of held) if (!e.remove && !enemies.includes(e)) enemies.push(e); }
  try { pacePost(dt); } catch (err) { console.error(err); }
  return r; }; }

// ---------- a wave begins ----------
function paceBegin(Z) {
  // the wave's own foes, in their order, then any strangers the approach brings (and their champion): all paced alike
  const own = spawnQ.filter(s => s.wj !== undefined).concat(spawnQ.filter(s => s.wj === undefined && !s.pace));
  spawnQ = spawnQ.filter(s => s.pace);
  const n = own.length;
  const W = { Z, n, wave: waveIdx, members: [], q: [], cues: [], staged: [], waking: [], stageTodo: [], since: 0, t: 0, burst: 0, bursts: [], roll: null, low: n <= 6 ? 1 : 2, gap: 4, done: false };
  PACE.W = W;
  // the camp's foes are part of this wave: they're woken now if they're still asleep
  const g = PACE.camp && PACE.camp.wave === waveIdx ? PACE.camp : null; let roamN = 0;
  if (g) {
    for (const e of g.members) { W.members.push(e); roamN++; const s = own.find(o => o.wj === e.paceJ); if (s && s.drop && !e.dropWeapon) e.dropWeapon = s.drop; }
    let k = 0; for (const e of g.members) if (e.parked && !e.dead) { paceWake(e, .25 + (k++) * .3); W.waking.push(e); }
    for (let i = own.length - 1; i >= 0; i--) if (g.members.some(e => e.paceJ === own[i].wj)) own.splice(i, 1);
    PACE.camp = null;
  }
  let rest = own.map((s, i) => ({ s, at: null }));
  if (Z.roll) { const L = lockX; W.roll = { L, R: Math.max(L + VW, Math.min(stage.len, L + VW * PACE_T.roll)), on: true, fade: 0 }; }
  if (Z.reinf) { // the core now, then the bursts
    const bs = n <= 3 ? [1] : n <= 5 ? [2] : n <= 8 ? [2, 2] : [3, 3];
    for (let b = bs.length - 1; b >= 0; b--) { const take = Math.min(bs[b], Math.max(0, rest.length - 1)); if (take > 0) W.bursts.unshift(rest.splice(rest.length - take, take)); }
    W.coreN = rest.length + roamN;
  } else if (Z.trickle) { // a first handful, then one at a time
    const first = Math.max(0, (n <= 3 ? 2 : n <= 6 ? 3 : Math.ceil(n * .4)) - roamN);
    W.singles = rest.splice(first); W.gap = clamp(24 / Math.max(1, W.singles.length), PACE_T.trickleGap[0], PACE_T.trickleGap[1]);
  }
  // in a rolling fight some of the core already stand further down the road
  if (W.roll && W.roll.R - W.roll.L > VW + 120 && rest.length >= 3) {
    const nS = Math.floor(rest.length * .4);
    W.stageTodo = rest.splice(rest.length - nS, nS);
  }
  rest.forEach((it, i) => { it.at = i * .8; W.q.push(it); });
  paceHold(W);
}
// the wave isn't over while any of it is still to come: a marker at the back of the queue says so
function paceHold(W) {
  const need = !W.done && (W.q.length || W.cues.length || W.staged.length || W.waking.length || W.stageTodo.length || (W.singles && W.singles.length) || W.burst < W.bursts.length);
  const i = spawnQ.findIndex(s => s.pace);
  if (i >= 0) spawnQ.splice(i, 1);
  if (need) spawnQ.push({ type: '__pace', side: 1, at: 1e9, drop: null, pace: 1 });
}
function paceLive(W) { let a = 0, on = 0; for (const e of W.members) if (!e.dead && !e.remove) { a++; if (!e.parked && paceVis(e.x, -20)) on++; } return { a, on }; }

// ---------- each frame, before the world moves ----------
function pacePre(dt) {
  if (stillT > 0) return;
  const g = PACE.camp;
  if (g) { if (g.alarm !== null) g.alarm -= dt; for (const e of g.members) if (e.parked) parkStep(e, dt, g); }
  const W = PACE.W; if (!W || W.done) return;
  W.t += dt; W.since += dt;
  for (const e of W.staged) if (e.parked) parkStep(e, dt, null);
  for (const e of W.waking) if (e.parked) parkStep(e, dt, null);
  W.staged = W.staged.filter(e => e.parked && !e.dead); W.waking = W.waking.filter(e => e.parked && !e.dead);
  const { a, on } = paceLive(W);
  // the next to come
  for (const it of W.q) if (it.at !== null) it.at -= dt;
  for (let i = 0; i < W.q.length; i++) { const it = W.q[i]; if (it.at !== null && it.at <= 0) { W.q.splice(i--, 1); paceCue(W, it); } }
  if (!W.q.length && !W.cues.length) {
    if (W.singles && W.singles.length) { // trickle: the next one when the fight thins out, or after a while
      if ((on <= W.low && W.since >= PACE_T.trickleMin) || W.since >= W.gap) { const it = W.singles.shift(); it.at = on <= W.low ? .3 : 0; W.q.push(it); }
    } else if (W.burst < W.bursts.length) { // a burst: when the core is mostly down, or after a while
      const coreLeft = a - W.staged.length;
      if (coreLeft <= Math.max(1, Math.floor((W.coreN || 3) * .35)) || W.since >= PACE_T.burstWait) {
        const B = W.bursts[W.burst++]; B.forEach((it, i) => { it.at = i * .22; it.burst = true; W.q.push(it); });
        if (W.Z.cry) floatText(clamp(P.x, camX + 200, camX + VW - 200), P.y, 96, W.Z.cry, '#F2D8A8', 14);
        sfx('growl', .6);
      }
    }
  }
  for (const c of W.cues) c.t -= dt;
  for (let i = 0; i < W.cues.length; i++) { const c = W.cues[i]; if (c.t <= 0) { W.cues.splice(i--, 1); paceArrive(W, c); } }
  // the ones standing further down the road come for him once they're in view, or when he's left with nobody to fight
  if (W.staged.length) {
    if (on === 0 && !W.cues.length) { W.strayT = (W.strayT || 0) + dt; if (W.strayT > PACE_T.stray) { W.strayT = 0; const e = W.staged[0]; W.cues.push({ t: PACE_T.cue, x: camX + VW - 40, y: e.y, edge: 1, wakeE: e }); } }
    else W.strayT = 0;
  }
  // the rolling lock follows him along its stretch of road, and lifts once most of the wave is down
  const R = W.roll;
  if (R && R.on) {
    if (lockX === null) R.on = false;
    else {
      lockX = clamp(P.x - VW * .4, R.L, R.R - VW);
      const left = a + W.q.length + W.cues.length + W.stageTodo.length + (W.singles ? W.singles.length : 0) + W.bursts.slice(W.burst).reduce((s, B) => s + B.length, 0);
      if (!W.staged.length && !W.q.length && !W.cues.length && (!W.singles || !W.singles.length) && W.burst >= W.bursts.length && left <= Math.max(1, Math.round(W.n * PACE_T.release))) {
        R.on = false; lockX = null; $('#go').hidden = false; sfx('pick', .6);
        floatText(clamp(P.x + 90, camX + 120, camX + VW - 80), P.y, 112, 'ONWARD', '#EED48A', 13);
      }
    }
  }
  if (R && !R.on) R.fade = Math.min(1, R.fade + dt * 1.6);
}
// ---------- each frame, after ----------
function pacePost(dt) {
  const W = PACE.W;
  if (W && !W.done) {
    if (W.stageTodo.length) paceStageNow(W);
    if (!waveActive || waveIdx !== W.wave) { W.done = true; PACE.W = null; if (W.roll) PACE.nextMin = P.x + VW * PACE_T.nextGap; }
    else paceHold(W);
  }
  if (!PACE.W) { const i = spawnQ.findIndex(s => s.pace); if (i >= 0) spawnQ.splice(i, 1); }
  // a camp waits out in the place for the next wave
  const Z = paceZone();
  if (Z && Z.roam && !waveActive && !PACE.camp && waveIdx < stage.waves.length && pacedWave(Z, waveIdx) && PACE.campFor !== waveIdx) placeCamp(waveIdx);
}

// ---------- telling an arrival ahead, and its arrival ----------
function paceCue(W, it) {
  const type = paceType(it.s.type), def = EDEF[type] || {}, fly = def.move === 'fly', Z = W.Z;
  let opts = (ENTRY[type] || [fly ? 'swoop' : 'leap']).slice().sort(() => Math.random() - .5);
  if (Z.rise && it.burst && !fly && ENTER_FX[Z.rise]) opts = [Z.rise];
  let kind = null, cover = null;
  for (const k of opts) { const D = ENTER_FX[k]; if (!D) continue;
    if (D.cover) { const c = coverNear(null, D.cover); if (!c || W.cues.some(o => o.cover === c)) continue; cover = c; }
    kind = k; break; }
  if (!kind) kind = ENTER_FX[fly ? 'swoop' : 'leap'] ? (fly ? 'swoop' : 'leap') : null;
  let x, y = rand(FLOOR_TOP + 16, FLOOR_BOT - 8);
  if (cover) { x = cover.x; y = cover.y + 8; }
  else if (kind === 'swing') { const d = P.x > camX + VW / 2 ? -1 : 1; x = clamp(P.x - d * 120 + d * 60, camX + 60, camX + VW - 60); }
  else x = paceSpot(W);
  const edge = kind === 'w8march' || kind === 'w8rollin' ? (P.x > x ? -1 : 1) : 0;
  W.cues.push({ t: PACE_T.cue, max: PACE_T.cue, x, y, kind, cover, edge, it, fly });
  if (W.cues.length === 1 || !it.burst) sfx('whoosh', .5);
}
function paceSpot(W) { // somewhere in view, well clear of him and of the others coming
  for (let i = 0; i < 14; i++) { const x = rand(camX + 70, camX + VW - 70);
    if (Math.abs(x - P.x) > 140 && !W.cues.some(c => Math.abs(c.x - x) < 60) && !enemies.some(o => o.state === 'enter' && Math.abs(o.x - x) < 50)) return x; }
  return clamp(P.x + (P.x < camX + VW / 2 ? 190 : -190), camX + 60, camX + VW - 60);
}
function paceArrive(W, c) {
  if (c.wakeE) { const e = c.wakeE; if (e.parked && !e.dead) { e.x = Math.min(e.x, camX + VW + 50); paceWake(e, 0); } return; }
  const it = c.it, s = it.s, side = c.edge || (c.x < P.x ? -1 : 1);
  PACE.spot = c.x; PACE.cover = c.cover;
  try {
    const e = paceSpawn(s.type, side, s.drop, s.champ); if (!e) return;
    W.members.push(e); e.paceW = W;
    if (c.kind) { e.y = clamp(c.y, FLOOR_TOP + 8, FLOOR_BOT); if (!setEntrance(e, c.kind)) setEntrance(e, c.fly ? 'swoop' : 'leap'); }
  } finally { PACE.spot = null; PACE.cover = null; }
  W.since = 0;
}
// the ones already standing further down a rolling fight's road
function paceStageNow(W) {
  const R = W.roll, todo = W.stageTodo; W.stageTodo = [];
  const x0 = Math.max(R.L + VW + 30, camX + VW + 40), x1 = R.R - 50;
  todo.forEach((it, i) => {
    const e = paceSpawn(it.s.type, 1, it.s.drop, it.s.champ); if (!e) return;
    const k = todo.length > 1 ? i / (todo.length - 1) : .5;
    e.x = lerp(x0, Math.max(x0, x1), k) + rand(-20, 20); e.y = rand(FLOOR_TOP + 18, FLOOR_BOT - 10); e.facing = -1; e.state = 'idle'; e.plan = null;
    e.parked = { mode: 'watch', hx: e.x, dir: -1, ph: rand(0, 6), seen: 0, hp0: e.hp, staged: 1 };
    W.members.push(e); W.staged.push(e); e.paceW = W;
  });
}

// ---------- the camp: part of the next wave, out in the place before it begins ----------
function placeCamp(wi) {
  const Z = paceZone(); if (!Z || !Z.roam || !stage.waves[wi]) return;
  PACE.campFor = wi;
  const list = stage.waves[wi], n = list.length, max = Math.ceil(n / 2), picks = [];
  for (let j = 0; j < n && picks.length < max; j++) { const t = paceType(list[j]); if (Z.roamTypes[t]) picks.push(j); }
  if (!picks.length) return;
  let cx = waveAt(wi) + 130;
  const span = 110;
  if (cx - span < camX + VW + 40 && waveActive === false && (wi > 0 || camX > 0)) cx = camX + VW + 40 + span; // (always placed out of view)
  cx = Math.min(cx, stage.len - 260);
  const cy = FLOOR_TOP + (FLOOR_BOT - FLOOR_TOP) * .5;
  const g = { wave: wi, cx, cy, members: [], alarm: null, fire: Z.roam === 'camp' ? { x: cx - 10, y: cy + 4 } : null, kind: Z.roam };
  picks.forEach((j, i) => {
    const t = list[j], mode = Z.roamTypes[paceType(t)];
    const e = paceSpawn(t, 1, paceCarrier(wi, j), false); if (!e) return;
    const a = picks.length > 1 ? (i / picks.length) * TAU + .4 : 0;
    e.x = cx + Math.cos(a) * (mode === 'patrol' ? span * 1.1 : span * .7); e.y = clamp(cy + Math.sin(a) * 26, FLOOR_TOP + 12, FLOOR_BOT - 6);
    e.facing = g.fire ? (e.x < g.fire.x ? 1 : -1) : (Math.random() < .5 ? -1 : 1); if (mode === 'watch') e.facing = -1;
    e.state = 'idle'; e.plan = null; e.walk = 0; e.paceJ = j;
    e.parked = { mode, hx: e.x, dir: e.facing, ph: rand(0, 6), seen: 0, hp0: e.hp };
    g.members.push(e);
  });
  PACE.camp = g.members.length ? g : null;
  if (PACE.camp && g.fire) PACE.fires.push(g.fire); // (the fire burns on after they've left it)
}
// one standing out in the place: idle, asleep, on its rounds or on watch, until it notices him
function parkStep(e, dt, g) {
  const k = e.parked;
  if (e.dead || e.state !== 'idle' || e.hp < k.hp0 || e.air) { paceWake(e, -1); if (g && g.alarm === null) paceAlarm(g); return; } // (struck: it's in the fight now)
  e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt);
  e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
  const t = performance.now() / 1000, fly = e.def.move === 'fly';
  if (fly) e.z += (e.def.hover + Math.sin(t * 2 + k.ph) * 5 - e.z) * Math.min(1, dt * 3);
  if (k.mode === 'patrol') { e.x += k.dir * e.def.spd * .35 * dt; e.walk += dt * 6; if (Math.abs(e.x - k.hx) > 70) { k.dir = -Math.sign(e.x - k.hx); } e.facing = k.dir; }
  else e.walk = 0;
  if (k.mode === 'sleep') e.sqy = 1 + Math.sin(t * 2.4 + k.ph) * .03;
  if (k.wakeIn !== undefined) { k.wakeIn -= dt; if (k.wakeIn <= 0) paceNotice(e, g); return; }
  const dx = P.x - e.x, ad = Math.abs(dx), ady = Math.abs(P.y - e.y), seen = paceVis(e.x, 20) && P.state !== 'dead';
  if (k.mode === 'still' && ad < 260 && Math.random() < dt * .8) e.jit = .08; // (a tremor, now and then, as he comes near)
  let notice = false;
  if (seen) {
    if (k.mode === 'sleep' || k.mode === 'still') notice = ad < 110 && ady < 60;
    else notice = (ad < 190 && dx * e.facing > -30 && ady < 90) || ad < 90;
    if (k.staged) { k.seen += dt; notice = notice || k.seen > .35; }
  }
  if (notice) paceNotice(e, g);
}
function paceNotice(e, g) {
  if (!e.parked) return;
  floatText(e.x, e.y, e.hh + 26, '!', '#FFE6A0', 24); sfx('growl', .5);
  paceWake(e, -1);
  if (e.def.move !== 'fly' && !e.air) { e.vz = 150; e.z = 1; }
  if (g && g.alarm === null) paceAlarm(g);
}
function paceAlarm(g) { // the rest of the camp take it up, one after another, and the wave begins a moment later
  g.alarm = 1.1; let k = 0;
  for (const o of g.members) if (o.parked && !o.dead && o.parked.wakeIn === undefined) o.parked.wakeIn = .45 + (k++) * .3;
}
function paceWake(e, delay) {
  if (!e.parked) return;
  if (delay > 0) { e.parked.wakeIn = Math.min(e.parked.wakeIn ?? 9, delay); return; }
  e.parked = null; e.cd = Math.max(e.cd, rand(.8, 1.2)); if (e.state === 'idle') e.plan = null;
}

// ---------- what the player sees ----------
// the veils at the ends of a rolling fight's road, the shadows where the next will land: painted on the floor under the figures
{ const _ml = mechList; mechList = function (list, t) { _ml(list, t);
  if (!PACE) return;
  const W = PACE.W, g = PACE.camp;
  for (const f of PACE.fires) if (f.x > camX - 60 && f.x < camX + VW + 60) list.push([f.y, () => paceFire(f, t, !g || g.alarm !== null)]);
  if (!W) return;
  list.push([-1e5, () => onMain(() => {
    for (const c of W.cues) { if (c.edge && !c.kind) continue; const k = 1 - c.t / (c.max || PACE_T.cue);
      ctx.save(); ctx.fillStyle = `rgba(16,10,22,${.3 + .4 * k})`; ell(c.x, c.y, 8 + 18 * k, (8 + 18 * k) * .32); ctx.fill();
      ctx.strokeStyle = `rgba(255,232,170,${.45 + .5 * Math.abs(Math.sin(t * 9))})`; ctx.lineWidth = 2; ell(c.x, c.y, 30 - 10 * k, (30 - 10 * k) * .32); ctx.stroke();
      ctx.strokeStyle = 'rgba(30,18,24,.6)'; ctx.lineWidth = 1; ell(c.x, c.y, 31 - 10 * k, (31 - 10 * k) * .32); ctx.stroke(); ctx.restore();
      if (Math.random() < .12) dust(c.x + rand(-10, 10), c.y, 1); }
    const R = W.roll; if (R && R.fade < 1) { const a = (1 - R.fade) * (1 + .6 * Math.max(0, 1 - W.t / 1.5)); // (a pulse as the fight begins, so its ends are seen)
      for (const [x0, s] of [[R.L, -1], [R.R, 1]]) { const x = x0 - s * 28; if (x < camX - 90 || x > camX + VW + 90) continue;
        const g2 = ctx.createLinearGradient(x - s * 60, 0, x0, 0); g2.addColorStop(0, 'rgba(18,12,28,0)'); g2.addColorStop(1, `rgba(18,12,28,${Math.min(.8, .55 * a)})`);
        ctx.save(); ctx.fillStyle = g2; ctx.fillRect(s < 0 ? x0 - 200 : x - 60, Y_OFF, 260 + 28, VH - Y_OFF);
        ctx.restore(); } }
  })]); }; }
{ const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (PACE) for (const f of PACE.fires) if (f.x > camX - 60 && f.x < camX + VW + 60) box(f.x, f.y, 0, 40, 60); }; }
function paceFire(f, t, roused) { // the camp's fire: a few logs and a low flame
  ctx.save(); ctx.translate(f.x, f.y);
  ctx.fillStyle = '#4A3424'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  for (const a of [-.35, .35]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-14, -3, 28, 5); ctx.strokeRect(-14, -3, 28, 5); ctx.restore(); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.fillStyle = '#7A7268'; ell(Math.cos(a) * 17, Math.sin(a) * 5 + 1, 3.5, 2.4); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  onMain(() => { ctx.save(); ctx.translate(f.x, f.y); ctx.globalCompositeOperation = 'lighter';
    softDab(0, -10, 34, '255,160,70', .22 + .05 * Math.sin(t * 7));
    for (let i = 0; i < 4; i++) { const h = 14 + 6 * Math.sin(t * (8 + i) + i * 2); ctx.fillStyle = i % 2 ? 'rgba(255,200,90,.85)' : 'rgba(255,120,40,.8)';
      ctx.beginPath(); ctx.moveTo(-7 + i * 4, -1); ctx.quadraticCurveTo(-6 + i * 4, -h * .6, -3 + i * 4 + Math.sin(t * 9 + i) * 2, -h); ctx.quadraticCurveTo(-1 + i * 4, -h * .5, 1 + i * 4, -1); ctx.closePath(); ctx.fill(); }
    ctx.restore(); });
  if (Math.random() < .15) parts.push({ x: f.x + rand(-5, 5), y: f.y, z: 16, vx: rand(-8, 8), vy: 0, vz: rand(20, 50), life: 1, max: 1, col: roused ? '#FFB050' : '#FFD27A', size: 1.6, shape: 'star', rot: 0, vr: 3 });
}
// above everything: the sleepers' breath, the marks at the screen's edge, and the pips of the wave still to come
{ const _ds = drawScene; drawScene = function (t) { _ds(t); if (mode === 'play' && PACE) { try { paceOverlay(t); } catch (err) { console.error(err); } } }; }
function paceOverlay(t) {
  ctx.save(); ctx.textAlign = 'center';
  const g = PACE.camp;
  if (g) for (const e of g.members) if (e.parked && e.parked.mode === 'sleep' && !e.dead && paceVis(e.x, -20)) {
    for (let i = 0; i < 2; i++) { const k = (t * .5 + i * .5 + e.parked.ph) % 1, x = e.x - camX + 6 + k * 10, y = e.y - e.z - e.hh - 8 - k * 18;
      ctx.globalAlpha = Math.sin(k * Math.PI) * .85; ctx.font = `700 ${9 + k * 5}px Cinzel, Georgia, serif`; ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.strokeText('z', x, y); ctx.fillStyle = '#E8E0F0'; ctx.fillText('z', x, y); } }
  ctx.globalAlpha = 1;
  const W = PACE.W;
  // (the ends of a rolling fight's stretch carry no gold line: the soft veil alone marks them)
  if (W && !W.done) {
    for (const c of W.cues) { const side = c.edge || (c.wakeE ? 1 : 0); if (!side) continue;
      const x = side < 0 ? 12 : VW - 12, y = clamp(c.y - 34, Y_OFF + 30, FLOOR_BOT - 20), a = .45 + .45 * Math.abs(Math.sin(t * 8));
      ctx.fillStyle = `rgba(255,224,160,${a})`; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) { const ox = x - side * i * 9; ctx.beginPath(); ctx.moveTo(ox + side * 5, y); ctx.lineTo(ox - side * 3, y - 8); ctx.lineTo(ox - side * 3, y + 8); ctx.closePath(); ctx.stroke(); ctx.fill(); } }
    // the wave's pips: gold for each still to come, a ring for each in the fight, a faint dot for each put down
    const toCome = W.q.length + W.cues.filter(c => !c.wakeE).length + W.staged.length + W.stageTodo.length + (W.singles ? W.singles.length : 0) + W.bursts.slice(W.burst).reduce((s, B) => s + B.length, 0);
    {
      const down = W.members.filter(e => e.dead).length, present = Math.max(0, W.n - toCome - down), gap = 9, x0 = VW / 2 - (W.n - 1) * gap / 2, y = Y_OFF + 14;
      ctx.fillStyle = 'rgba(14,8,20,.35)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0 - 9, y - 6, (W.n - 1) * gap + 18, 12, 6) : ctx.rect(x0 - 9, y - 6, (W.n - 1) * gap + 18, 12); ctx.fill();
      for (let i = 0; i < W.n; i++) { const x = x0 + i * gap;
        if (i < down) { ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(x, y, 2); ctx.fill(); }
        else if (i < down + present) { ctx.strokeStyle = '#F4ECD8'; ctx.lineWidth = 1.3; circle(x, y, 3); ctx.stroke(); }
        else { ctx.fillStyle = '#EED48A'; circle(x, y, 3.2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); } }
    }
  }
  ctx.restore();
}
