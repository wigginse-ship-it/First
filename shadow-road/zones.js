// ---------- each stage is three places: the road in, an approach with its own strange rule, and the boss's room ----------
const ZONES = [
  { trans: ['canopy', 'roots'], zones: [
    { theme: 'bloom', len: 2200, waves: [0, 1], pods: [880, 1650] },
    { theme: 'bloom2', len: 1700, waves: [2], pods: [1180], mech: 'spores', title: 'The Thornwood Hollow', sub: 'THE SPORES SHRINK WHATEVER THEY TOUCH' },
    { theme: 'bloomBoss', len: 1000, waves: [], boss: 1, title: 'The Sunken Grove', sub: 'SOMETHING VAST STIRS IN THE WATER' } ] },
  { trans: ['clouds', 'lift'], zones: [
    { theme: 'sky', len: 2300, waves: [0, 1], pods: [700, 1900] },
    { theme: 'sky2', len: 1700, waves: [2], pods: [1200], mech: 'tilt', title: 'The Gearworks Deck', sub: 'THE SHIP BANKS · KNOCK THEM OVERBOARD' },
    { theme: 'skyBoss', len: 1000, waves: [], boss: 1, title: 'The Foundry Crown', sub: 'THE FURNACES ARE LIT' } ] },
  { trans: ['shatter', 'invert'], zones: [
    { theme: 'prism', len: 2500, waves: [0, 1, 2], pods: [650, 1500, 2100] },
    { theme: 'prism2', len: 1900, waves: [3, 4], pods: [1200], mech: 'echo', title: 'The Inverted Gallery', sub: 'TIME RUNS TWICE HERE · YOUR ECHO FIGHTS BESIDE YOU' },
    { theme: 'prismBoss', len: 1000, waves: [], boss: 1, title: "The Wyrm's Nest", sub: 'THE STARS ARE WATCHING' } ] },
];
// other files can add passages (TRANS_FX[kind](T, p, c, inP, t) draws one) and approach rules (MECH_FX[kind] = { start(m), update(m, dt), boxes(m, box), list(m, list, t) })
const TRANS_FX = {}, MECH_FX = {};
let zoneIdx = 0, zoneTrans = null, baseStage = null, mech = null, snapC = null, runFoundW = false, retryZone = 0;
const zoneTheme = (z) => (THEMES[ZONES[stageIdx].zones[z].theme] ? ZONES[stageIdx].zones[z].theme : baseStage.theme); // falls back while art is missing

function enterZone(z, Zs) { // Zs: a place outside the usual three (a hidden Trump room), entered from place z
  const Z = Zs || ZONES[stageIdx].zones[z]; zoneIdx = z;
  stage = Object.assign({}, baseStage, { theme: Zs ? Zs.theme : zoneTheme(z), len: Z.len, waves: Zs ? Zs.rawWaves : Z.waves.map(k => baseStage.waves[k]), w0: Zs ? 99 : Z.waves.length ? Z.waves[0] : baseStage.waves.length,
    pods: Z.pods || [], bossRoom: !!Z.boss, mech: Z.mech || null, secret: !!Zs });
  for (const k of loot) { // whatever was left lying in the last place comes along
    if (k.kind === 'shard') { save.shards += k.val; runShards += k.val; }
    else if (k.kind === 'sigil') { save.sigils += k.val; runSigils += k.val; }
    else if (k.kind === 'weapon' && !save.owned[k.weapon]) gainWeapon(k.weapon, k.lvl);
    else if (k.kind === 'gear') sweepGear(k); // armor left lying: into the bag, or salvaged if it is full
  }
  P.moonSaved = false; // a new place: moon-silver's refusal is ready again
  enemies = []; projs = []; loot = []; ghosts = []; echoes = []; spawnQ = []; hazards = []; corpses = []; parts = []; fx = [];
  props = stage.pods.map(x => ({ kind: 'pod', x, y: FLOOR_TOP + 46 + (x % 3) * 18, hp: 1, theme: baseStage.theme }));
  P.x = 50; P.vx = 0; camX = 0; lockX = null; waveIdx = 0; waveActive = false;
  setZoom(Z.boss ? VIEW_BOSS : VIEW_NORMAL);
  bgKey = ''; buildBackground(stage.theme, stageIdx * 97 + 13 + z * 7);
  mech = stage.mech ? { kind: stage.mech, t: 0 } : null; mechStart();
  if (z > 0) retryZone = z;
  if ((z > 0 || Zs) && typeof TRACKS !== 'undefined' && TRACKS[stage.theme]) playMusic(stage.theme); // every place has its own music
  refreshHud(true);
}
// the third wave gives you one more chance at a weapon if this stage hasn't given you one yet
function boostDrop() {
  const wi = stage.w0 + waveIdx; // the approach's first wave
  if (runFoundW || carriers.some(c => c.wave === wi && !save.owned[c.weapon])) return;
  const pool = WEAPON_ORDER.filter(id => id !== 'fists' && !save.owned[id]);
  if (pool.length && Math.random() < .3) carriers.push({ weapon: pick(pool), wave: wi, slot: Math.floor(Math.random() * baseStage.waves[wi].length) });
}

// ---------- moving between places: every world has its own two passages ----------
function startZoneTrans() {
  zoneTrans = { kind: ZONES[stageIdx].trans[zoneIdx], t: 0, dur: 1.9, swapped: false, banged: false };
  $('#go').hidden = true; P.inv = 9; sfx('whoosh');
}
function updateZoneTrans(dt) {
  const T = zoneTrans; T.t += dt;
  P.state = 'walk'; P.facing = 1; P.walk += dt * 11; P.x += 60 * dt; P.z = 0; P.vz = 0; P.vx = 0; // he walks on through it
  const p = T.t / T.dur;
  if (T.kind === 'canopy' && Math.random() < dt * 30) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP, FLOOR_BOT), z: rand(120, 220), vx: rand(-70, -20), vy: 0, vz: -50, life: 2.4, max: 2.4, col: pick(['#4E7A3A', '#7EA460', '#C9A86A']), size: rand(2.5, 4), shape: 'tuft', rot: rand(0, 6), vr: 3 });
  if (T.kind === 'lift' && !T.banged && p > .47) { T.banged = true; shakeMag = 9; sfx('slam'); }
  if (!T.swapped && p >= .5) {
    T.swapped = true;
    if (T.kind === 'shatter') { // keep a picture of the old place to break
      if (!snapC) snapC = document.createElement('canvas');
      snapC.width = cv.width; snapC.height = cv.height; snapC.getContext('2d').drawImage(cv, 0, 0);
    }
    if (T.secret) enterSecret(); else enterZone(zoneIdx + 1); P.x = 40; P.inv = 9;
    if (T.kind === 'roots') { for (let i = 0; i < 14; i++) parts.push({ x: P.x + rand(-30, 30), y: P.y, z: 1, vx: rand(-90, 90), vy: rand(-10, 10), vz: rand(80, 200), life: .8, max: .8, col: 'rgba(170,200,190,.75)', size: rand(2, 4), shape: 'blob' }); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .5, max: .5, r: 60, col: '#BFE0D0', flat: 1 }); sfx('hit-goo', .7); } // he steps down off the last root into the shallows
    if (T.kind === 'invert') { flashT = .15; }
  }
  if (T.t >= T.dur) {
    zoneTrans = null; P.inv = .6; P.state = 'idle';
    const Z = stage.secret ? SECRET_ROOM : ZONES[stageIdx].zones[zoneIdx]; banner(Z.title, Z.sub, 2.6);
  }
}
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function drawZoneTrans(t) { // (each passage is painted by TRANS_FX[kind]: thresholds.js for the ten between areas, secrets.js for the card gate)
  const T = zoneTrans, p = T.t / T.dur, inP = p < .5, c = inP ? ease(p * 2) : 1 - ease((p - .5) * 2);
  ctx.save(); if (TRANS_FX[T.kind]) TRANS_FX[T.kind](T, p, c, inP, t); ctx.restore();
}
// the 'invert' passage turns the whole view over as it goes
function zoneViewTurn() {
  if (!zoneTrans || zoneTrans.kind !== 'invert') return;
  const p = zoneTrans.t / zoneTrans.dur, a = p < .5 ? Math.PI * .5 * ease(p * 2) : -Math.PI * .5 * (1 - ease((p - .5) * 2)), s = 1 + .25 * Math.sin(p * Math.PI);
  ctx.translate(VW / 2, Y_OFF + VIEW_H / 2); ctx.rotate(a); ctx.scale(s, s); ctx.translate(-VW / 2, -(Y_OFF + VIEW_H / 2));
}

// ---------- the strange rules of each approach ----------
let WORLD_TILT = 0; // how far the airship deck has banked; the sky and the distance tilt with it
function mechStart() {
  WORLD_TILT = 0;
  if (!mech) return;
  if (MECH_FX[mech.kind]) { MECH_FX[mech.kind].start(mech); return; }
  if (mech.kind === 'spores') { mech.shrooms = [560, 800, 1040, 1300, 1520].map((x, i) => ({ x, y: FLOOR_TOP + 22 + (i % 3) * 34, cd: 2 + i * .8, puff: 0, flash: 0 })); mech.clouds = []; }
  if (mech.kind === 'tilt') { mech.phase = 'calm'; mech.t = 4; mech.dir = 1; mech.a = 0; mech.crates = []; }
  if (mech.kind === 'echo') { mech.rec = []; mech.clock = 0; mech.hit = new Map(); mech.cur = null; }
}
function puff(s) { // a toadstool lets go a cloud of glittering spores
  s.puff = .5; s.flash = .12; s.cd = rand(3.2, 4.6);
  mech.clouds.push({ x: s.x, y: s.y, r: 20, R: 135, t: 3.8 }); // it bursts: a big cloud, wide enough to catch the whole lane around it
  sfx('hit-goo', .8); sfx('whoosh', .5); shakeMag = Math.max(shakeMag, 4);
  fx.push({ kind: 'ring', x: s.x, y: s.y, z: 2, t: .45, max: .45, r: 150, col: '#E0B0FF', flat: 1 });
  for (let i = 0; i < 44; i++) { const a = rand(0, TAU), v = rand(60, 260); parts.push({ x: s.x + rand(-10, 10), y: s.y + rand(-6, 6), z: rand(20, 50), vx: Math.cos(a) * v, vy: Math.sin(a) * v * .4, vz: rand(20, 140), life: 1.4, max: 1.4, col: pick(['#D8A0F0', '#F0D0FF', '#B880E0']), size: rand(2, 4), shape: 'star', rot: 0, vr: 4 }); }
}
function updateMech(dt) {
  if (!mech) return;
  if (MECH_FX[mech.kind]) { MECH_FX[mech.kind].update(mech, dt); return; }
  if (mech.kind === 'spores') {
    const k = P.state === 'atk' && P.move ? P.t / P.move.dur : -1;
    for (const s of mech.shrooms) {
      s.puff = Math.max(0, s.puff - dt); s.flash = Math.max(0, s.flash - dt); s.cd -= dt;
      const near = Math.abs(P.x - s.x) < 195 || enemies.some(e => !e.dead && Math.abs(e.x - s.x) < 150); // they go off at a fair distance: on this road you will be shrunk often
      if (s.cd <= 0 && near) puff(s);
      if (k >= 0 && k >= P.move.h[0] && k <= P.move.h[1] && Math.abs(P.y - s.y) < 26 && (s.x - P.x) * P.facing > -10 && (s.x - P.x) * P.facing < P.move.x1 + 20 && s.cd < 3.5) puff(s); // smack one and it goes off
    }
    for (const c of mech.clouds) {
      c.t -= dt; c.r += (c.R - c.r) * Math.min(1, dt * 7);
      const inside = (x, y) => Math.hypot(x - c.x, (y - c.y) * 2.2) < c.r;
      if (inside(P.x, P.y) && P.z < 80) { if (!(P.shrinkT > 0)) floatText(P.x, P.y, 60, 'TINY!', '#E0B0FF', 14); P.shrinkT = 7; }
      for (const e of enemies) if (!e.dead && !e.boss && inside(e.x, e.y)) { if (!(e.shrinkT > 0)) floatText(e.x, e.y, e.hh + 20, 'tiny!', '#E0B0FF', 12); e.shrinkT = 7; }
    }
    mech.clouds = mech.clouds.filter(c => c.t > 0);
  }
  if (mech.kind === 'tilt') {
    mech.t -= dt;
    if (mech.t <= 0) {
      if (mech.phase === 'calm') { mech.phase = 'warn'; mech.t = 1.3; mech.dir = Math.random() < .5 ? -1 : 1; floatText(P.x, P.y, 110, mech.dir > 0 ? 'HARD TO STARBOARD!' : 'HARD TO PORT!', '#F2C99C', 16); sfx('charge', 1); }
      else if (mech.phase === 'warn') { // the deck heels over, and the cargo breaks loose
        mech.phase = 'bank'; mech.t = 3.4; shakeMag = 6;
        const x = mech.dir > 0 ? leftWall() + 10 : rightWall() - 10;
        mech.crates.push({ x, y: rand(FLOOR_TOP + 20, FLOOR_BOT - 10), vx: mech.dir * 40, rot: 0, hit: new Set(), done: false });
      } else { mech.phase = 'calm'; mech.t = rand(4.5, 6.5); }
    }
    const target = mech.phase === 'bank' ? mech.dir * .14 : 0;
    mech.a += (target - mech.a) * Math.min(1, dt * 2.6); WORLD_TILT = mech.a;
    const k = mech.a / .14; // -1 .. 1: which way everything slides, and how hard
    if (Math.abs(k) > .05) {
      if (!['dodge', 'dead'].includes(P.state)) P.x += k * 85 * dt;
      for (const e of enemies) {
        if (e.dead || e.boss) continue;
        const loose = ['hurt', 'down'].includes(e.state) || e.air || e.z > 6;
        e.x += k * (loose ? 260 : 120) * dt;
        const over = k > 0 ? e.x > rightWall() - 8 : e.x < leftWall() + 8;
        if (over && loose && Math.abs(k) > .5) { // over the rail
          floatText(e.x, e.y, e.hh + 30, 'OVERBOARD!', '#F2C99C', 16);
          strike(e, e.hp + 999, Math.sign(k), { dmg: 999, kb: 520, launch: 480, power: 2, trump: 1 });
        } else e.x = clamp(e.x, leftWall(), rightWall());
      }
    }
    for (const cr of mech.crates) { // a loose crate slides down the deck and flattens whoever is in its way
      cr.vx += mech.dir * 520 * dt * Math.max(.2, Math.abs(k)); cr.vx = clamp(cr.vx, -340, 340); cr.x += cr.vx * dt; cr.rot = Math.sin(cr.x * .05) * .08;
      if (Math.random() < .5) dust(cr.x - Math.sign(cr.vx) * 14, cr.y, 1);
      if (!cr.hitP && Math.abs(P.x - cr.x) < 18 && Math.abs(P.y - cr.y) < 14 && P.z < 22) { cr.hitP = true; playerDamage(Math.round(8 * worldDiff().dmg), cr.x, true); }
      for (const e of enemies) if (!e.dead && !e.boss && !cr.hit.has(e) && Math.abs(e.x - cr.x) < 20 + e.hw && Math.abs(e.y - cr.y) < 16) { cr.hit.add(e); strike(e, 28, Math.sign(cr.vx), { dmg: 28, kb: 420, launch: 260, power: 2, trump: 1 }); }
      if (cr.x < leftWall() - 4 || cr.x > rightWall() + 4) { cr.done = true; burst(cr.x, cr.y, 14, ['#8A6A44', '#C9A06A', '#5A4028'], 16, 'chunk', -Math.sign(cr.vx), true); sfx('break'); shakeMag = Math.max(shakeMag, 5); }
    }
    mech.crates = mech.crates.filter(c => !c.done);
  }
  if (mech.kind === 'echo') { // everything you do is recorded, and two and a half seconds later your echo does it again
    mech.clock += dt;
    if (P.state !== 'dead') mech.rec.push({ t: mech.clock, x: P.x, y: P.y, z: P.z, f: P.facing, pose: playerPose(), atk: (P.state === 'atk' || P.state === 'air') && P.move ? { m: P.move, k: P.t / P.move.dur, id: P.moveId } : null });
    while (mech.rec.length > 1 && mech.rec[1].t <= mech.clock - 2.5) mech.rec.shift();
    const r = mech.rec[0]; mech.cur = r && r.t <= mech.clock - 2.5 ? r : null;
    if (mech.cur && mech.cur.atk) {
      const { m, k, id } = mech.cur.atk;
      if (k >= m.h[0] && k <= m.h[1]) {
        const sv = [P.x, P.y, P.z, P.facing]; P.x = r.x; P.y = r.y; P.z = r.z; P.facing = r.f;
        const hits = [];
        for (const e of enemies) { if (e.dead || mech.hit.get(e) === id) continue; if (inReach(m, e.x, e.y, e.z, e.hw, e.hh)) { mech.hit.set(e, id); hits.push(e); } }
        [P.x, P.y, P.z, P.facing] = sv;
        for (const e of hits) { strike(e, m.dmg * .6 * wMult(P.w), m.around ? Math.sign(e.x - r.x) || r.f : r.f, m, true); burst(e.x, e.y, e.z + e.hh * .6, ['#9FE8F0', '#E8B0FF', '#FFFFFF'], 10, 'crystal', r.f); }
      }
    }
  }
}
// every actor's size while the spores are in them
function updateShrink(o, dt) {
  o.shrinkT = Math.max(0, (o.shrinkT || 0) - dt);
  const target = o.shrinkT > 0 ? .55 : 1; o.shrink = (o.shrink || 1) + (target - (o.shrink || 1)) * Math.min(1, dt * 7);
  if (o.shrink > .995) o.shrink = 1;
}
function mechBoxes(box) {
  if (!mech) return;
  if (MECH_FX[mech.kind]) { MECH_FX[mech.kind].boxes(mech, box); return; }
  if (mech.kind === 'spores') for (const s of mech.shrooms) box(s.x, s.y, 0, 50, 80);
  if (mech.kind === 'tilt') for (const c of mech.crates) box(c.x, c.y, 0, 40, 50);
  if (mech.kind === 'echo' && mech.cur) box(mech.cur.x, mech.cur.y, mech.cur.z, 160, 170);
}
function mechList(list, t) {
  if (!mech) return;
  if (MECH_FX[mech.kind]) { MECH_FX[mech.kind].list(mech, list, t); return; }
  if (mech.kind === 'spores') {
    for (const s of mech.shrooms) list.push([s.y, () => drawShroom(s, t)]);
    for (const c of mech.clouds) list.push([c.y + 30, () => onMain(() => { // the spore cloud: soft violet, glittering
      const a = Math.min(1, c.t / .8) * .5; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + t * .4; softDab(c.x + Math.cos(ang) * c.r * .45, c.y - 16 + Math.sin(ang) * c.r * .18, c.r * .7, '190,120,230', a * .5); }
      ctx.restore();
    })]);
  }
  if (mech.kind === 'tilt') for (const c of mech.crates) list.push([c.y, () => drawCrate(c)]);
  if (mech.kind === 'echo' && mech.cur) { const r = mech.cur; list.push([r.y - .05, () => onMain(() => { // your echo: a glassy, prismatic double
    ctx.save(); TINT = '#7FD8E8'; drawPlayerAt(r.x, r.y, r.z, r.f, Object.assign({}, r.pose), .38); TINT = null;
    ctx.globalCompositeOperation = 'lighter'; drawPlayerAt(r.x + 2, r.y, r.z, r.f, Object.assign({}, r.pose), .22); ctx.restore();
  })]); }
}
// a great toadstool, its gills glowing violet: painted like the grove's own toadstools (paint.js propSprite), with a live
// violet glow under the cap so it still reads as the thing that lets the spores go
function shroomPaint(v) {
  const r = mulberry(v * 613 + 41);
  return propSprite('shroom' + v, 84, 84, 42, 74, (th, s) => {
    const cap = ['#7A3E98', '#86469E', '#6E3A8E'][v], stem = '#D8CCB0', w = 26 + v * 2;
    ctx.fillStyle = shade(stem, -.25); ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.quadraticCurveTo(-8.5, -18, -4.5, -31); ctx.lineTo(5, -31); ctx.quadraticCurveTo(8.5, -16, 6.5, 0); ctx.closePath(); ctx.fill(); // the stem, in its own shade
    ctx.fillStyle = stem; ctx.beginPath(); ctx.moveTo(s * 6.5, 0); ctx.quadraticCurveTo(s * 8.5, -16, s * 5, -31); ctx.lineTo(-s * .5, -31); ctx.quadraticCurveTo(-s * 1, -16, -s * 1.5, 0); ctx.closePath(); ctx.fill(); // and lit on the sunward side
    for (let i = 0; i < 6; i++) dab(s * (1 + r() * 4), -4 - r() * 24, .9 + r() * 1.2, '#F6EEDA', .6); for (let i = 0; i < 5; i++) dab(-s * (2 + r() * 3), -3 - r() * 22, 1 + r() * 1.4, shade(stem, -.45), .4); // fibres
    ctx.fillStyle = '#3E2048'; ctx.beginPath(); ctx.moveTo(-w, -28); ctx.quadraticCurveTo(0, -20, w, -28); ctx.quadraticCurveTo(0, -31, -w, -28); ctx.fill(); // under the cap
    ctx.fillStyle = '#C890E0'; ctx.globalAlpha = .85; ctx.beginPath(); ctx.moveTo(-w + 3, -27.6); ctx.quadraticCurveTo(0, -22, w - 3, -27.6); ctx.quadraticCurveTo(0, -27, -w + 3, -27.6); ctx.fill(); ctx.globalAlpha = 1; // the glowing gills
    const dome = () => { ctx.beginPath(); ctx.moveTo(-w, -28); ctx.quadraticCurveTo(-w + 2, -58 - v * 2, 0, -60 - v * 2); ctx.quadraticCurveTo(w - 2, -58 - v * 2, w, -28); ctx.quadraticCurveTo(0, -31, -w, -28); ctx.closePath(); };
    dome(); ctx.fillStyle = cap; ctx.fill();
    ctx.save(); dome(); ctx.clip();
    const sg = ctx.createLinearGradient(-s * w, 0, s * w, 0); sg.addColorStop(0, 'rgba(30,10,40,.55)'); sg.addColorStop(.5, 'rgba(30,10,40,0)'); ctx.fillStyle = sg; ctx.fillRect(-w, -64, w * 2, 40); // round into shade away from the light
    const bg = ctx.createLinearGradient(0, -36, 0, -26); bg.addColorStop(0, 'rgba(30,10,40,0)'); bg.addColorStop(1, 'rgba(30,10,40,.45)'); ctx.fillStyle = bg; ctx.fillRect(-w, -36, w * 2, 10); // and under the brim
    for (let i = 0; i < 18; i++) dab(-s * (w * .2 + r() * w * .8), -30 - r() * 22, 2.5 + r() * 4, shade(cap, -.4), .5); // the cap's shadow side, dabbed
    for (let i = 0; i < 16; i++) dab(s * (r() * w * .75), -40 - r() * 18, 2 + r() * 3.6, shade(cap, .35), .7); // and the light on its crown
    for (let i = 0; i < 7; i++) dab(s * (w * .25 + r() * w * .45), -48 - r() * 9, 1.2 + r() * 1.8, '#F0C8F4', .75);
    ctx.strokeStyle = `rgba(${th.sun[2]},.55)`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, -28, w - 1, 31 + v * 2, 0, s > 0 ? -1.35 : Math.PI + .5, s > 0 ? -.5 : Math.PI + 1.35); ctx.stroke(); // light along its sunward rim
    ctx.restore();
    for (const [x, y, rr] of [[-12, -44, 4], [4, -52, 3.2], [14, -40, 3.6], [-2, -38, 2.4], [-18, -35, 2]]) { dab(x, y, rr, '#E8DCC4', .85); dab(x + s * .8, y - .8, rr * .5, '#FFF6E6', .8); } // its pale warts
    for (let i = 0; i < 8; i++) dab((r() - .5) * 26, -1 - r() * 2, 1.5 + r() * 2, '#2E2A1C', .6); // moss and leaf-litter about its foot
  }, { foot: 10, seed: 23 + v, haze: .08 });
}
function drawShroom(s, t) {
  const sq = 1 + s.puff * .5 * Math.sin(s.puff * 30), v = Math.floor(s.x / 7) % 3;
  propDraw(shroomPaint(v), s.x, s.y, { sx: sq, sy: 2 - sq, sh: 30, flash: s.flash > 0 });
  onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; // the gills' glow, breathing
    softDab(s.x, s.y - 26 * (2 - sq), 26, '190,110,230', .2 + .06 * Math.sin(t * 2.2 + s.x) + s.puff * .4); softDab(s.x, s.y - 2, 18, '170,100,220', .12); ctx.restore(); });
}
function crateSprite() { // a cargo crate, iron-banded, painted like the deck's own crates
  return propSprite('crate', 44, 44, 22, 36, (th, s) => {
    const body = '#7A5A3C';
    ctx.fillStyle = body; ctx.fillRect(-15, -28, 30, 28);
    for (let i = 0; i < 12; i++) dab(-13 + Math.abs(Math.sin(i * 7.3)) * 26, -26 + Math.abs(Math.sin(i * 3.1)) * 24, 1.6 + (i % 3), i % 2 ? shade(body, .18) : shade(body, -.22), .45); // weathering
    ctx.fillStyle = shade(body, -.35); ctx.fillRect(s > 0 ? -15 : 11, -28, 4, 28); ctx.fillStyle = shade(body, .3); ctx.fillRect(-15, -28, 30, 2.2); // its shadowed side, its lit top edge
    ctx.strokeStyle = shade(body, -.42); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -25); ctx.lineTo(12, -3); ctx.moveTo(12, -25); ctx.lineTo(-12, -3); ctx.stroke(); // the braces
    for (const y of [-22, -8]) { ctx.fillStyle = '#4A4246'; ctx.fillRect(-15, y, 30, 3); ctx.fillStyle = '#A8988E'; ctx.globalAlpha = .6; ctx.fillRect(-15, y, 30, .8); ctx.globalAlpha = 1; } // iron bands, glinting
  }, { foot: 8, seed: 29, haze: .06, line: .8 });
}
function drawCrate(c) { // it slides and tumbles, so it stays in the figure layer like the other things that can hit you
  const sp = crateSprite();
  shadow(c.x, c.y, 18); ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h); ctx.restore();
}
