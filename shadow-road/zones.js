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
    else if (k.kind === 'weapon' && !save.owned[k.weapon]) gainWeapon(k.weapon);
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
    if (T.kind === 'roots') { for (let i = 0; i < 14; i++) parts.push({ x: P.x + rand(-30, 30), y: P.y, z: 1, vx: rand(-90, 90), vy: rand(-10, 10), vz: rand(80, 200), life: .8, max: .8, col: 'rgba(170,200,190,.75)', size: rand(2, 4), shape: 'blob' }); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .5, max: .5, r: 60, col: '#BFE0D0', flat: 1 }); sfx('slam'); }
    if (T.kind === 'invert') { flashT = .15; }
  }
  if (T.t >= T.dur) {
    zoneTrans = null; P.inv = .6; P.state = 'idle';
    const Z = stage.secret ? SECRET_ROOM : ZONES[stageIdx].zones[zoneIdx]; banner(Z.title, Z.sub, 2.6);
  }
}
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function drawZoneTrans(t) {
  const T = zoneTrans, p = T.t / T.dur, inP = p < .5, c = inP ? ease(p * 2) : 1 - ease((p - .5) * 2);
  const X0 = 0, X1 = VW, Y0 = Y_OFF, Y1 = VH, H = Y1 - Y0;
  ctx.save();
  if (TRANS_FX[T.kind]) TRANS_FX[T.kind](T, p, c, inP, t);
  else if (T.kind === 'canopy') { // the forest closes over the road: a wall of leaves sweeps in, then parts onto the hollow
    const L = inP ? X1 * (1.1 - 1.2 * c) : -60, R = inP ? X1 + 60 : X1 * (1.1 - 1.2 * (1 - c));
    const edge = (x0, y, s) => x0 + Math.sin(y * .05 + s) * 16 + Math.sin(y * .13 + s * 2) * 7;
    ctx.beginPath(); ctx.moveTo(edge(L, Y0, 1), Y0);
    for (let y = Y0; y <= Y1; y += 8) ctx.lineTo(edge(L, y, 1), y);
    for (let y = Y1; y >= Y0; y -= 8) ctx.lineTo(edge(R, y, 4), y);
    ctx.closePath(); const g = ctx.createLinearGradient(0, Y0, 0, Y1); g.addColorStop(0, '#15241A'); g.addColorStop(1, '#2A3A1E'); ctx.fillStyle = g; ctx.fill();
    for (let i = 0; i < 70; i++) { // leaves massed along the edges and scattered over the wall
      const yy = Y0 + hash1(i) * H, onEdge = i < 46, ex = onEdge ? (i % 2 ? edge(L, yy, 1) : edge(R, yy, 4)) : L + hash1(i + 9) * (R - L);
      if (ex < L - 30 || ex > R + 30) continue;
      inkDab(ex + (hash1(i + 3) - .5) * 26, yy, 9 + hash1(i + 5) * 12, ['#2E4A26', '#4E7A3A', '#3A5A2C', '#6E8A40'][i % 4]);
    }
  } else if (T.kind === 'roots') { // hanging roots come down like a curtain as the ground gives way beneath him
    const B = Y0 + (H + 70) * c;
    ctx.fillStyle = '#1A140E'; ctx.fillRect(X0, Y0, X1, B - Y0);
    ctx.lineCap = 'round';
    for (let i = 0; i < X1 / 11; i++) {
      const x = i * 11 + hash1(i) * 8, len = 22 + hash1(i + 2) * 60, w = 2.5 + hash1(i + 4) * 4;
      ctx.strokeStyle = i % 3 ? '#2E2216' : '#3E3020'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, B - 4); ctx.quadraticCurveTo(x + Math.sin(i + t) * 5, B + len * .5, x + (hash1(i + 6) - .5) * 10, B + len); ctx.stroke();
      if (i % 2) dab(x, B + len * .4, 4 + hash1(i + 8) * 4, '#4E6A34', .9); // moss
    }
  } else if (T.kind === 'clouds') { // up through the clouds to the galleon: a bank rises over everything and streams away above
    const top = inP ? Y1 - (H + 90) * c : Y0 - 90, bot = inP ? Y1 + 60 : Y0 + (H + 90) * c;
    ctx.fillStyle = 'rgb(246,232,214)'; ctx.fillRect(X0, top + 30, X1, Math.max(0, bot - top - 60));
    for (let i = 0; i < 24; i++) { const x = (i / 23) * X1, s = 34 + hash1(i) * 26; softDab(x, top + 30 + hash1(i + 1) * 20, s, '252,238,220', .95); softDab(x + 14, bot - 30 - hash1(i + 2) * 20, s, '240,214,190', .95); }
    if (p > .3 && p < .7) { // a galleon slides across the cloud
      const k = (p - .3) / .4, sx = X1 + 100 - k * (X1 + 200), sy = Y0 + H * .4;
      ctx.fillStyle = 'rgba(70,50,60,.55)'; ell(sx, sy - 22, 46, 16); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx - 40, sy); ctx.lineTo(sx + 44, sy); ctx.lineTo(sx + 30, sy + 14); ctx.lineTo(sx - 30, sy + 14); ctx.closePath(); ctx.fill();
    }
  } else if (T.kind === 'lift') { // iron shutters slam shut on the deck, the lift grinds, and they open on the foundry
    const w = (X1 / 2 + 14) * c;
    for (const side of [0, 1]) {
      const x = side ? X1 - w : 0, g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#2E2A2C'); g.addColorStop(.5, '#4E4644'); g.addColorStop(1, '#2A2426'); ctx.fillStyle = g; ctx.fillRect(x, Y0, w, H);
      ctx.fillStyle = '#9A7A48'; for (let y = Y0 + 14; y < Y1; y += 22) for (let rx = 10; rx < w; rx += 30) { circle(side ? X1 - rx : rx, y, 1.6); ctx.fill(); }
      ctx.strokeStyle = '#1A1416'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = Y0 + 60; y < Y1; y += 60) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); } ctx.stroke();
    }
    if (c > .05) { // half a gear on each shutter, turning
      const gx = X1 / 2, gy = Y0 + H / 2, rot = p * 6;
      for (const side of [-1, 1]) {
        ctx.save(); ctx.beginPath(); ctx.rect(side < 0 ? w - 60 : X1 - w, Y0, 60, H); ctx.clip();
        ctx.translate(side < 0 ? w : X1 - w, gy); ctx.rotate(rot * side);
        ctx.fillStyle = '#B8904A'; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 34 : 42; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); outline(1.5);
        ctx.fillStyle = '#5A4224'; circle(0, 0, 12); ctx.fill(); ctx.restore();
      }
    }
  } else if (T.kind === 'shatter') { // the world cracks like a mirror, then the old picture falls away in shards
    if (inP) {
      ctx.globalCompositeOperation = 'lighter'; const ox = P.x - camX, oy = P.y - 40;
      for (let i = 0; i < 16; i++) {
        const a = hash1(i) * TAU, len = (120 + hash1(i + 1) * 380) * c;
        ctx.strokeStyle = `hsla(${180 + i * 25},80%,80%,${.6 * c + .2})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ox, oy);
        for (let s = 1; s <= 4; s++) ctx.lineTo(ox + Math.cos(a + (hash1(i * 4 + s) - .5) * .5) * len * s / 4, oy + Math.sin(a + (hash1(i * 4 + s) - .5) * .5) * len * s / 4);
        ctx.stroke();
      }
    } else if (snapC) {
      const q = (p - .5) * 2, cols = 8, rows = 5, cw = snapC.width / cols, ch = snapC.height / rows;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) for (const tri of [0, 1]) {
        const id = (r * cols + cI) * 2 + tri, x = cI * cw, y = r * ch;
        const pts = tri ? [[x, y], [x + cw, y], [x, y + ch]] : [[x + cw, y], [x + cw, y + ch], [x, y + ch]];
        const mx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, my = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        const dx = (hash1(id) - .5) * 300 * K * q, dy = (700 * q * q + hash1(id + 7) * 160 * q) * K, rot = (hash1(id + 3) - .5) * 5 * q;
        ctx.save(); ctx.globalAlpha = 1 - q * .4;
        ctx.translate(mx + dx, my + dy); ctx.rotate(rot); ctx.translate(-mx, -my);
        ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath(); ctx.clip();
        ctx.drawImage(snapC, x, y, cw, ch, x, y, cw, ch);
        ctx.strokeStyle = 'rgba(230,250,255,.8)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
    }
  } else if (T.kind === 'invert') { // the world turns over and a kaleidoscope iris closes, then opens on the nest
    const cx = X1 / 2, cy = Y0 + H / 2, R = Math.hypot(X1, H) * .62 * (1 - c), rot = p * Math.PI;
    ctx.beginPath(); ctx.rect(X0 - 10, Y0 - 10, X1 + 20, H + 20);
    for (let i = 0; i <= 16; i++) { const a = rot + i / 16 * TAU, r = i % 2 ? R * .55 : R; i ? ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath(); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, X1 * .7); g.addColorStop(0, '#3A2266'); g.addColorStop(1, '#0E0820'); ctx.fillStyle = g; ctx.fill('evenodd');
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; ctx.strokeStyle = `hsla(${200 + i * 40},80%,70%,${.35 * c})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * (R + 260), cy + Math.sin(a) * (R + 260)); ctx.stroke(); }
  }
  ctx.restore();
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
      const near = Math.abs(P.x - s.x) < 250 || enemies.some(e => !e.dead && Math.abs(e.x - s.x) < 200); // they go off at a fair distance: on this road you will be shrunk often
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
function drawShroom(s, t) { // a great toadstool, its gills glowing violet
  const sq = 1 + s.puff * .5 * Math.sin(s.puff * 30);
  ctx.save(); ctx.translate(s.x, s.y); shadow(0, 0, 18); FLASH = s.flash > 0;
  ctx.fillStyle = C('#E8DCC0'); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-8, -18, -4, -30); ctx.lineTo(5, -30); ctx.quadraticCurveTo(8, -16, 6, 0); ctx.closePath(); ctx.fill(); outline(1.3);
  ctx.scale(sq, 2 - sq);
  ctx.fillStyle = C('#8A4AA8'); ctx.beginPath(); ctx.moveTo(-26, -28); ctx.quadraticCurveTo(-24, -58, 0, -60); ctx.quadraticCurveTo(24, -58, 26, -28); ctx.quadraticCurveTo(0, -22, -26, -28); ctx.closePath(); ctx.fill(); outline(1.5);
  ctx.fillStyle = C('#C890E0'); ctx.beginPath(); ctx.moveTo(-26, -28); ctx.quadraticCurveTo(0, -22, 26, -28); ctx.quadraticCurveTo(0, -32, -26, -28); ctx.fill(); // the glowing gills
  ctx.fillStyle = C('#F4E8D0'); for (const [x, y, r] of [[-12, -44, 4], [4, -52, 3.2], [14, -40, 3.6], [-2, -38, 2.4]]) { ell(x, y, r, r * .8); ctx.fill(); }
  FLASH = false; ctx.restore();
}
function drawCrate(c) { // a cargo crate, iron-banded, sliding across the deck
  ctx.save(); ctx.translate(c.x, c.y); shadow(0, 0, 18); ctx.rotate(c.rot);
  rrect(-15, -28, 30, 28, 2); ctx.fillStyle = C('#9A7448'); ctx.fill(); outline(1.4);
  ctx.strokeStyle = C('#6A4A2A'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-15, -28); ctx.lineTo(15, 0); ctx.moveTo(15, -28); ctx.lineTo(-15, 0); ctx.stroke();
  ctx.fillStyle = C('#4A4246'); ctx.fillRect(-15, -22, 30, 3); ctx.fillRect(-15, -8, 30, 3);
  ctx.restore();
}
