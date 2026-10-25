// ---------- the end of each area: the road turns, little by little, into the next place ----------
// Over the last stretch of every area the scenery itself changes into the place ahead. The next place's own painted
// layers (made just after this one is entered, so moving on is instant) show through a ragged, brushed edge that creeps
// in from the right, and a few things painted in the same hand bridge the two: the Thornwood's dark trunks closing over
// the Vale's road, a root-bound lip above the misty grove, a galleon moored overhead with a ladder let down... At the
// very end stands the way on itself. It stirs (light, an opening, movement) once the last wave there is beaten, and when
// that wave falls the road is cut short so the way on is close by (at the spot the scenery was painted for, so nothing
// jumps). Nothing here goes into the figures' ink layer, so nothing gets a figure's hard contour: it is painted onto the
// picture behind the fighters right after the world, and (overhanging leaves, mist) a little in front of them after.
// A passage is THRESH[kind] = { edge(y) / mask(): where the next place shows; haze, back, front: painters (cached, x
// relative to the way on; frontInk: false leaves the brushwork's contour off); live, liveFront(x, wake, t): what moves;
// nextDX, nextDY, nextA: where and how strongly the next place shows }.
const THRESH = {};
const exitX = () => stage.len - 130;
function trimArea() { // after the last wave the way on is close by
  if (stage.bossRoom || stage.trimmed || !stage.waves.length || waveActive || waveIdx < stage.waves.length || zoneTrans) return;
  stage.trimmed = true; stage.wake = 0;
  const len = Math.min(stage.len, Math.max(camX + VW + 200, P.x + 340, (stage.endX || 0) + 130));
  stage.len = len; props = props.filter(p => p.x < len - 120);
  if (typeof covers !== 'undefined') covers = covers.filter(c => c.x < len - 100);
}
function threshKind() { if (stage.bossRoom || stage.secret && stage.room && !stage.room.kind) return null; const T = ZONES[stageIdx]; return T && T.trans ? T.trans[zoneIdx] : null; }
const threshX = () => stage.trimmed || stage.endX == null ? exitX() : stage.endX; // where the way on stands
const glowAt = (x, y, r, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(x, y, r); ctx.fill(); ctx.restore(); };
const MX0_TH = -820; // how far back from the way on the next place can show
const thCl = (k) => clamp(k, 0, 1), thSm = (k) => { k = thCl(k); return k * k * (3 - 2 * k); };
const thHash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
{
  const _sec = updateSecret;
  updateSecret = function (dt) { _sec(dt); trimArea(); if (stage.trimmed) stage.wake = Math.min(1, (stage.wake || 0) + dt * .8); };
  // ---------------- the next place's layers, made ahead ----------------
  let NX = null;
  const getSet = () => ({ far: bgFar, mid: bgMid, floor: awFloorC, fkey: awFloorKey, key: bgKey, seams: awSeams, sun: AW_SUN });
  const putSet = (s) => { bgFar = s.far; bgMid = s.mid; awFloorC = s.floor; awFloorKey = s.fkey; bgKey = s.key; awSeams = s.seams; AW_SUN = s.sun; };
  const dropNX = () => { if (NX) { retire(NX.far); retire(NX.mid); retire(NX.floor); NX = null; } };
  const nextSpec = () => { const k = threshKind(), z = zoneIdx + 1; return k && THRESH[k] && ZONES[stageIdx].zones[z] ? { theme: zoneTheme(z), seed: stageIdx * 97 + 13 + z * 7 } : null; }; // (as enterZone will build it)
  const _bb = buildBackground;
  function prepNext() {
    if (!stage || stage.bossRoom) return null;
    const s = nextSpec(); if (!s) return null;
    if (NX && NX.theme === s.theme && NX.seed === s.seed && NX.K === K) return NX;
    dropNX(); const A = getSet();
    try { bgFar = bgMid = awFloorC = null; bgKey = ''; _bb(s.theme, s.seed); NX = Object.assign(getSet(), s, { K }); } finally { putSet(A); }
    return NX;
  }
  buildBackground = function (themeId, seed) { // stepping into the next place: its layers are already painted
    if (NX && NX.theme === themeId && NX.seed === seed && NX.K === K) { retire(bgFar); retire(bgMid); retire(awFloorC); putSet(NX); NX = null; return; }
    _bb(themeId, seed);
  };
  const _zone = enterZone; // a crystal pod or two left sitting past the last fight is moved into it
  enterZone = function (z, Zs) { _zone(z, Zs);
    if (stage.waves.length && !stage.bossRoom) { const last = waveAt(stage.waves.length - 1); for (const p of props) if (p.x > last + VW * .7) p.x = last + rand(120, VW * .6);
      stage.endX = Math.min(stage.len - 130, last + VW * .6 + 200); } // the last fight's view ends 200 short of the way on: the change is already creeping in at its right
    else stage.endX = stage.len - 130;
    setTimeout(() => { if (mode === 'play') prepNext(); }, 60); }; // (a frame after the move, so the two paint jobs don't land on one frame)
  // ---------------- painted pieces, cached ----------------
  const SPR = new Map(); let sprKey = '';
  function sprite(kind, part, T) { // painted once per passage and scale, x relative to the way on; the solid parts get the layers' brushwork and fine contour
    const KS = Math.min(K, 2.5), key = kind + KS;
    if (sprKey !== key) { for (const c of SPR.values()) retire(c); SPR.clear(); sprKey = key; }
    let c = SPR.get(part); if (c) return c;
    const b = T[part + 'B'] || [-600, Y_OFF - 10, 240, VH], paint = T[part], [cv2, g] = texCanvas(Math.ceil((b[2] - b[0]) * KS), Math.ceil((b[3] - b[1]) * KS));
    const old = ctx, sun = AW_SUN; ctx = g; g.setTransform(KS, 0, 0, KS, -b[0] * KS, -b[1] * KS); AW_SUN = 1;
    try { paint(mulberry(kind.length * 977 + part.length * 31)); } finally { ctx = old; AW_SUN = sun; }
    if (part !== 'haze' && T[part + 'Ink'] !== false) { const k0 = K; K = KS; try { paintLayer(cv2, { ink: '#1A100C', line: part === 'front' ? .7 : .6, lw: 1, brush: .9, hatch: .12, seed: 5 }); } finally { K = k0; releaseScratch(); } }
    c = cv2; c.b = b; SPR.set(part, c); return c;
  }
  const drawSpr = (kind, T, part, L) => { if (!T[part]) return; const c = sprite(kind, part, T), b = c.b; ctx.drawImage(c, L + b[0], b[1], b[2] - b[0], b[3] - b[1]); };
  // ---------------- the next place, showing through ----------------
  const MS = .25, MX0 = MX0_TH, MX1 = 220; // the mask is soft, so it is kept small
  let mkC = null, mkKey = '', nwC = null, nwG = null, nwKey = '', nwT = 0;
  function edgeMask(T) { // the next place shows right of a ragged, brushed edge: T.edge(y) is where it is half there, T.feather how soft
    const f = T.feather || 110, r = mulberry(11), at = (y) => T.edge(y) + Math.sin(y * .05 + 1) * 16 + Math.sin(y * .13 + 2) * 8 + Math.sin(y * .31) * 4;
    for (let y = 0; y < VH; y += 3) { const x = at(y), g = ctx.createLinearGradient(x - f, 0, x + f, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); ctx.fillStyle = g; ctx.fillRect(x - f, y, MX1 - x + f, 3.4); }
    for (let i = 0; i < 46; i++) { const y = r() * VH, x = at(y) - f * (.2 + r() * .7); softDab(x, y, 14 + r() * 26, '255,255,255', .45); } // blots where the brush went over the edge
  }
  function maskFor(kind, T) {
    if (mkKey === kind && mkC) return mkC;
    if (!mkC) [mkC] = texCanvas(Math.ceil((MX1 - MX0) * MS), Math.ceil(VH * MS));
    const g = mkC.getContext('2d'), old = ctx; ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, mkC.width, mkC.height); g.setTransform(MS, 0, 0, MS, -MX0 * MS, 0);
    try { T.mask ? T.mask(edgeMask) : edgeMask(T); } finally { ctx = old; }
    mkKey = kind; return mkC;
  }
  function drawNext(kind, T, L, t) {
    const B = NX && NX.K === K ? NX : prepNext(); if (!B) return;
    const sx0 = L + MX0 - camX; if (sx0 > VW || L + MX1 - camX < 0) return;
    if (!nwC || nwC.width !== cv.width || nwC.height !== cv.height) { retire(nwC); [nwC, nwG] = texCanvas(cv.width, cv.height); }
    const m = ctx.getTransform(), g = nwG, W = nwC.width, H = nwC.height, px0 = m.b || m.c ? 0 : clamp(Math.floor(m.a * sx0 + m.e) - 2, 0, W), pw = W - px0; // (the part of the canvas it can show in)
    if (pw <= 0) return;
    const key = [kind, camX.toFixed(1), m.a, m.b, m.c, m.d, m.e.toFixed(1), m.f.toFixed(1), W, H, B.theme].join(); // while the view holds still it is only repainted now and then (its sky drifts slowly)
    if (key !== nwKey || Math.abs(t - nwT) > .15) { nwKey = key; nwT = t;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(px0, 0, pw, H);
    g.save(); g.beginPath(); g.rect(px0, 0, pw, H); g.clip(); g.setTransform(m); // its world, only where it can show
    if (T.nextDY) g.translate(0, T.nextDY);
    const old = ctx, A = getSet(); ctx = g; putSet(B);
    try { drawWorld(B.theme, camX + (T.nextDX || 0), t); } finally { putSet(A); ctx = old; }
    g.setTransform(m); g.globalCompositeOperation = 'destination-in'; g.drawImage(maskFor(kind, T), L + MX0 - camX, 0, MX1 - MX0, VH); g.restore(); } // through its ragged edge
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = T.nextA ?? 1; ctx.drawImage(nwC, px0, 0, pw, H, px0, 0, pw, H); ctx.restore();
  }
  window.nextWorldInto = (g, t, o = {}) => { // the next place's world painted into g (a passage's last moments use it), or false if it isn't ready
    const B = NX && NX.K === K ? NX : prepNext(); if (!B) return false;
    const old = ctx, A = getSet(); ctx = g; putSet(B);
    try { drawWorld(B.theme, o.cam || 0, t); } finally { putSet(A); ctx = old; }
    return true;
  };
  // ---------------- drawn every frame ----------------
  const active = () => { if (!stage || stage.bossRoom) return null; const k = threshKind(), T = k && THRESH[k], L = T && threshX(); return T && L - 900 < camX + VW && L + 900 > camX ? [k, T, L] : null; };
  const _br = drawBossRoom;
  drawBossRoom = function (t) { _br(t); const a = active(); if (!a) return; const [k, T, L] = a;
    drawNext(k, T, L, t);
    ctx.save(); ctx.translate(-camX, 0); drawSpr(k, T, 'haze', L); drawSpr(k, T, 'back', L); if (T.live) T.live(L, stage.wake || 0, t); ctx.restore(); };
  const _ga = drawGearAura;
  drawGearAura = function (t, front) { _ga(t, front); if (!front) return; const a = active(); if (!a) return; const [k, T, L] = a; // (in front of the figures)
    drawSpr(k, T, 'front', L); if (T.liveFront) T.liveFront(L, stage.wake || 0, t); };
}
// ---------- the passages: painted in the backgrounds' own hand (soft dabs, the next place's haze and light) ----------
// a soft sweep across the view, for the moves between places: a band of something (dark wood, mist, cloud) whose edges are
// ragged with painted dabs; x0..x1 the band in screen x, fill(y0, y1) paints its body, dabs: colors for the ragged edges
function thSweep(x0, x1, fill, dabs, s = 1) {
  const Y0 = Y_OFF, Y1 = VH, edge = (x, y, k) => x + Math.sin(y * .045 + k) * 18 + Math.sin(y * .11 + k * 2) * 9;
  if (x1 - x0 < 1) return;
  ctx.save(); ctx.beginPath(); ctx.moveTo(edge(x0, Y0, s), Y0); for (let y = Y0; y <= Y1; y += 8) ctx.lineTo(edge(x0, y, s), y); for (let y = Y1; y >= Y0; y -= 8) ctx.lineTo(edge(x1, y, s + 3), y); ctx.closePath();
  fill(); ctx.restore();
  for (let i = 0; i < 70; i++) { const y = Y0 + thHash(i + s * 7) * (Y1 - Y0), side = i % 2, x = side ? edge(x1, y, s + 3) : edge(x0, y, s); if (x < -60 || x > VW + 60) continue; // the edge, feathered with soft dabs and broken by small ones
    softDab(x + (thHash(i + 3) - .5) * 30, y, 22 + thHash(i + 5) * 26, dabs[0], .8); if (i % 3 === 0) dab(x + (side ? 1 : -1) * (6 + thHash(i + 8) * 14), y, 2.5 + thHash(i + 6) * 4, dabs[1 + i % (dabs.length - 1)], .75); }
}
// a thorny briar: a dark cane with a lit back, hooked thorns along it
function thBriar(ax, ay, cx, cy, ex, ey, w = 2.6) {
  ctx.lineCap = 'round'; ctx.strokeStyle = '#1A120C'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,96,64,.7)'; ctx.lineWidth = w * .35; ctx.beginPath(); ctx.moveTo(ax, ay - w * .3); ctx.quadraticCurveTo(cx, cy - w * .3, ex, ey - w * .3); ctx.stroke();
  ctx.fillStyle = '#1A120C'; ctx.beginPath();
  for (let u = .08; u < .95; u += .11) { const iu = 1 - u, x = iu * iu * ax + 2 * iu * u * cx + u * u * ex, y = iu * iu * ay + 2 * iu * u * cy + u * u * ey, s = (u * 9) % 2 < 1 ? 1 : -1; ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.lineTo(x + 3, y + s * 4.5); }
  ctx.fill();
}
const thFlies = (x, y, w, h, n, a, t) => { for (let i = 0; i < n; i++) { const ph = thHash(i) * TAU, px = x + thHash(i + 1) * w + Math.sin(t * .4 + ph) * 18, py = y + thHash(i + 2) * h + Math.sin(t * .6 + ph) * 9, k = a * (.45 + .55 * Math.sin(t * 1.7 + ph * 3));
  if (k <= 0) continue; ctx.fillStyle = `rgba(190,255,170,${k * .22})`; circle(px, py, 4.5); ctx.fill(); ctx.fillStyle = `rgba(236,255,206,${k})`; circle(px, py, 1.2); ctx.fill(); } }; // fireflies
const thShaft = (x, y0, y1, w, slant, rgb, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.35, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * .3, y0); ctx.lineTo(x + w * .3, y0); ctx.lineTo(x + slant + w, y1); ctx.lineTo(x + slant - w, y1); ctx.closePath(); ctx.fill(); ctx.restore(); };

// the Vale → the Thornwood Hollow: the Thornwood's dusk comes over the road from ahead (its canopy first, overhead, then
// its trunks and its leaf-littered path); at the edge of the wood two great trunks lean together over a gate of roots,
// barred with briars, the dark of the wood beyond. Awake: the briars draw back, and low sun and fireflies show the way in
THRESH.canopy = {
  edge: (y) => y < 160 ? -470 + (y - 84) * .9 : lerp(-400, -200, thCl((y - 160) / 80)), feather: 120,
  hazeB: [-600, 74, 240, 350], haze(r) {
    const T = FLOOR_TOP, g = ctx.createLinearGradient(-460, 0, 150, 0); g.addColorStop(0, 'rgba(10,16,12,0)'); g.addColorStop(.7, 'rgba(10,16,12,.3)'); g.addColorStop(1, 'rgba(10,16,12,.55)'); ctx.fillStyle = g; ctx.fillRect(-460, 74, 700, 276); // the shade under the trees, deepening toward the gate
    for (let i = 0; i < 12; i++) softDab(-50 + i * 16, T - 50 + (r() - .5) * 70, 50 + r() * 40, '6,10,8', .5); // the dark inside the wood, past the gate
    const fg = ctx.createLinearGradient(0, T, 0, VH); fg.addColorStop(0, 'rgba(8,12,8,.5)'); fg.addColorStop(1, 'rgba(8,12,8,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-60, T); ctx.lineTo(240, T); ctx.lineTo(240, VH); ctx.lineTo(60, VH); ctx.closePath(); ctx.fill(); // its shade reaching out over the road
  },
  backB: [-600, 60, 260, 300], back(r) {
    const Z = window.ZB_ART, T = FLOOR_TOP, bark = Z.TH_BARK, lv = ['#0E1812', '#1A2A20', '#3A5236', '#A8A86A'];
    for (const [x, w] of [[-440, 6], [-360, 9], [-318, 5]]) Z.farTrunk(x, T - 2, w, r, '#2A3A3A', '#8A8460', 40); // dim trunks where the wood begins
    Z.giantTrunk(-250, T + 2, 18, r, bark, { shelves: [[176, 1, 9]], glow: 2 }); // one standing at the wood's edge
    Z.giantTrunk(-112, T + 2, 22, r, bark, { shelves: [[150, -1, 11], [174, -1, 8]], glow: 3 }); // two leaning together over the gate
    Z.giantTrunk(170, T + 2, 30, r, bark, { glow: 3 });
    Z.rootArch(-84, 126, T + 2, 112, 15, r, bark, { hang: .55, hangL: 30 }); // a root heaving out of the road and arching over it: the gate
    for (let i = 0; i < 17; i++) { const x = -520 + i * 44 + (r() - .5) * 20; awLeaves(x, 84 + r() * 20 + Math.max(0, -x - 200) * .05, 24 + r() * 16, r, lv, .8); } // the crowns meet overhead, low and heavy
    for (const x of [-310, -215, -160, 46, 214]) awBush(x, T + 3, 28 + r() * 24, 9 + r() * 10, r, ['#141E16', '#22341F', '#3E5636', '#8E9658']);
    for (const x of [-196, -138, 100]) awFern(x, T + 4, 12 + r() * 6, '#22341F', '#7E9454');
  },
  frontB: [-560, 70, 260, VH + 6], front(r) {
    const Z = window.ZB_ART, lv = ['#0A120C', '#142218', '#2E4630', '#8A9058'];
    for (let i = 0; i < 15; i++) { const x = -540 + i * 52 + (r() - .5) * 24, k = thCl((x + 540) / 600); if (r() > .3 + k) continue; awLeaves(x, 72 + r() * 10 * k, 14 + k * 20 + r() * 8, r, lv, .7); } // the canopy's lowest leaves, thickening overhead
    for (let i = 0; i < 8; i++) Z.mossStrand(-360 + r() * 560, 82 + r() * 8, 16 + r() * 26, r, Z.TH_BARK.hangC);
    Z.tube(Z.wiggle(Z.bez([70, VH + 14], [92, 312], [140, 262], [262, 236], 16), 4, r), (t) => 24 - t * 12, Object.assign({ furrow: Z.TH_BARK.furrow, dabs: 1, moss: .5, mossC: Z.TH_BARK.moss }, Z.TH_BARK), r); // a great root in the near ground; the road bends past it into the wood
    awBush(170, VH + 6, 80, 24, r, ['#0C140E', '#18261A', '#2E4630', '#7E8A50']);
  },
  live(x, k, t) {
    const T = FLOOR_TOP;
    glowAt(x + 24, T - 44, 120, '255,190,110', (.05 + .2 * k) * (1 + .1 * Math.sin(t * 1.3))); // the low sun, found again past the trees
    thShaft(x + 10, 110, T + 30, 12, -34, '255,210,150', .18 * k); thShaft(x + 62, 110, T + 30, 8, -30, '255,210,150', .13 * k);
    thFlies(x - 70, T - 120, 180, 110, 9, .12 + .7 * k, t);
    const o = thSm(k * 1.3); // the briars across the gate draw back to the trunks
    for (let i = 0; i < 6; i++) { const y0 = T - 6 - i * 21, sag = 8 + thHash(i) * 12, mx = x + 18 + (thHash(i + 4) - .5) * 30;
      for (const s of [-1, 1]) { const ax = s < 0 ? x - 80 : x + 112, ay = y0 + (thHash(i + 9 + s) - .5) * 16, ex = lerp(mx, ax - s * 14, o), ey = lerp(y0 + sag, ay + 10, o) + Math.sin(t * 1.4 + i) * 1.2;
        thBriar(ax, ay, lerp(ax, ex, .5), lerp(ay, ey, .5) + sag * (1 - o) * .8 + 6 * o, ex, ey, 2.4 - i * .15); } }
  },
};
TRANS_FX.canopy = (T, p, c, inP, t) => { // into the wood: its dark comes over him from ahead and slides away behind him, onto the hollow
  const x0 = inP ? lerp(VW + 90, -90, c) : -400, x1 = inP ? VW + 400 : lerp(-90, VW + 90, c);
  thSweep(x0, x1, () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, '#08100C'); g.addColorStop(.6, '#121C14'); g.addColorStop(1, '#1C2616'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 4; i++) thShaft(x0 + 60 + i * 170, Y_OFF, VH, 10 + i * 3, -60, '255,206,140', .12);
    thFlies(Math.max(0, x0), Y_OFF + 40, Math.min(VW, x1) - Math.max(0, x0), VIEW_H - 60, 16, .9, t); }, ['12,20,14', '#1A2A1C', '#2A4026', '#46623A', '#5E7A44'], 1);
};
// the same, as a band across the view between y0 (its top) and y1, for the moves that go up or down
function thSweepV(y0, y1, fill, dabs, s = 1) {
  const edge = (y, x, k) => y + Math.sin(x * .03 + k) * 12 + Math.sin(x * .085 + k * 2) * 6;
  if (y1 - y0 < 1) return;
  ctx.save(); ctx.beginPath(); ctx.moveTo(-20, edge(y0, -20, s)); for (let x = -20; x <= VW + 20; x += 10) ctx.lineTo(x, edge(y0, x, s)); for (let x = VW + 20; x >= -20; x -= 10) ctx.lineTo(x, edge(y1, x, s + 3)); ctx.closePath();
  fill(); ctx.restore();
  for (let i = 0; i < 60; i++) { const x = thHash(i + s * 5) * VW, side = i % 2, y = side ? edge(y1, x, s + 3) : edge(y0, x, s); if (y < Y_OFF - 60 || y > VH + 60) continue;
    softDab(x, y + (thHash(i + 3) - .5) * 24, 24 + thHash(i + 5) * 26, dabs[0], .8); if (i % 3 === 0) dab(x + (thHash(i + 9) - .5) * 30, y + (side ? 1 : -1) * (5 + thHash(i + 8) * 10), 2.5 + thHash(i + 6) * 4, dabs[1 + i % (dabs.length - 1)], .7); }
}
// the Thornwood → the Sunken Grove: the hollow opens ahead under a last great root, and the path comes to a lip where the
// ground falls away: below, the grove's misty water and standing stones (its own layers, set lower), great roots draped
// over the edge down into it. Asleep, a thick mist fills it; awake, the mist sinks, the water glints and glowing caps light the
// way down the roots one by one
THRESH.roots = {
  nextDY: 34,
  edge: (y) => y >= FLOOR_TOP ? lerp(-60, -22, (y - FLOOR_TOP) / (VH - FLOOR_TOP)) : -250, feather: 60,
  mask(edgeMask) { edgeMask(this); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; const g = ctx.createLinearGradient(0, 70, 0, 150); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(MX0_TH, 0, 1200, 150); ctx.restore(); }, // the canopy stays overhead
  hazeB: [-420, 74, 260, VH], haze(r) {
    const T = FLOOR_TOP;
    for (let i = 0; i < 22; i++) { const x = -40 + r() * 280, y = T - 30 + r() * (VH - T + 30); softDab(x, y, 30 + r() * 40, '214,222,206', .22); } // mist lying in the drop
    for (let i = 0; i < 8; i++) softDab(-220 + i * 50, T - 70 + r() * 40, 50 + r() * 30, '214,222,206', .16); // and the grove's light hazing the opening
  },
  backB: [-460, 60, 280, VH + 6], back(r) {
    const Z = window.ZB_ART, T = FLOOR_TOP, bark = Z.TH_BARK;
    Z.giantTrunk(-350, T + 2, 24, r, bark, { shelves: [[160, 1, 10]], glow: 2 }); // the last of the hollow's trunks
    Z.rootArch(-300, 250, T + 4, 98, 17, r, bark, { hang: .65, hangL: 40 }); // a last great root, framing the way down
    for (let i = 0; i < 10; i++) awLeaves(-420 + i * 70 + (r() - .5) * 20, 80 + r() * 16, 22 + r() * 14, r, ['#0E1812', '#1A2A20', '#3A5236', '#A8A86A'], .7);
    const lip = (u) => [lerp(-62, -24, u) + Math.sin(u * 9) * 6 + Math.sin(u * 23) * 2.5, lerp(T - 2, VH + 4, u)]; // the lip: a ragged bank of loam and leaf litter
    for (let u = 0; u < 1; u += .012) { const [x, y] = lip(u), fw = 18 + u * 34, g = ctx.createLinearGradient(x, 0, x + fw, 0); g.addColorStop(0, 'rgba(46,34,22,.95)'); g.addColorStop(.5, 'rgba(60,50,36,.6)'); g.addColorStop(1, 'rgba(120,130,110,0)'); ctx.fillStyle = g; ctx.fillRect(x - 1, y, fw + 1, 1.6); } // its face, falling away into the mist
    for (let u = 0; u < 1; u += .012) { const [x, y] = lip(u); ctx.fillStyle = 'rgba(112,90,58,.9)'; ctx.fillRect(x - 10 - u * 6, y, 10 + u * 6, 1.6); } // the trodden top, right to the edge
    for (let u = 0; u < 1; u += .03) { const [x, y] = lip(u); dab(x + (r() - .5) * 6, y, 2 + r() * 3, ['#5A3A20', '#7E5428', '#4A3A22', '#3E5230'][Math.floor(r() * 4)], .9); } // leaves on the edge
    for (const [u, dx, dy, w] of [[.08, 40, 46, 10], [.38, 54, 60, 13], [.7, 66, 60, 12]]) { // great roots draped over the edge and down into the mist: the way down
      const [lx, ly] = lip(u); Z.tube(Z.wiggle(Z.bez([lx - 16, ly - 3], [lx + 14, ly - 8], [lx + dx * .7, ly + dy * .2], [lx + dx, ly + dy], 14), 3, r), (t) => w * (1 - t * .55), Object.assign({ furrow: bark.furrow, dabs: 1, moss: .55, mossC: bark.moss }, bark), r); }
    for (let i = 0; i < 6; i++) { const [x, y] = lip(r()); Z.tube(Z.bez([x, y], [x + 8, y + 10], [x + 4, y + 24], [x + 10 + r() * 10, y + 30 + r() * 20], 8), (t) => 4 * (1 - t * .7), Object.assign({ furrow: bark.furrow, mossC: bark.moss }, bark), r); } // rootlets over the edge
    for (const [x, y] of [[-60, T + 50], [30, T + 30], [80, T + 64], [150, T + 100]]) Z.reeds(x + 80, y + 20, 8, 20, r, ['#4E5E34', '#6A7A40', '#8E9A52']); // the first reeds of the bog below
  },
  frontB: [-420, 74, 260, VH + 6], front(r) {
    const Z = window.ZB_ART, bark = Z.TH_BARK;
    for (let i = 0; i < 7; i++) { const x = -260 + i * 62 + (r() - .5) * 20, l = 40 + r() * 70; Z.tube(Z.wiggle(Z.bez([x, 70], [x + 4, 70 + l * .4], [x - 6, 70 + l * .7], [x + (r() - .5) * 10, 70 + l], 10), 2, r), (t) => 5 * (1 - t * .6), Object.assign({ furrow: bark.furrow, mossC: bark.moss, hang: .5, hangL: 14 }, bark), r); } // roots hanging from the canopy
    awBush(-170, VH + 8, 90, 26, r, ['#0C140E', '#18261A', '#2E4630', '#7E8A50']); awFern(-120, VH + 2, 16, '#1A2A1C', '#6E8A4A');
  },
  live(x, k, t) {
    const T = FLOOR_TOP;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,244,214,${.08 + .3 * k})`; ctx.lineWidth = .9; ctx.beginPath(); // the water below catching the light
    for (let i = 0; i < 9; i++) { const px = x + 10 + thHash(i) * 220, py = T + 50 + thHash(i + 3) * 60, l = 8 + thHash(i + 5) * 20, s = Math.sin(t * 1.3 + i * 2); ctx.moveTo(px + s * 3, py); ctx.lineTo(px + l + s * 3, py); } ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) { const on = thSm((k - i * .18) * 3), [px, py] = [[x - 34, T + 4], [x + 8, T + 30], [x + 4, T + 72], [x + 36, T + 96]][i]; if (on <= 0) continue; // glowing caps along the root steps, lighting one by one
      glowAt(px, py - 4, 18, '160,245,215', .4 * on); ctx.fillStyle = `rgba(200,255,230,${on})`; ctx.beginPath(); ctx.ellipse(px, py - 4, 2.6, 1.6, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(px + 5, py - 2, 1.8, 1.1, 0, Math.PI, 0); ctx.fill(); }
    for (let i = 0; i < 5; i++) { const ph = thHash(i + 20) * TAU, px = x + 20 + thHash(i + 21) * 200 + Math.sin(t * .3 + ph) * 12, py = T + 70 - ((t * 9 + thHash(i + 22) * 120) % 140), a = .5 * k * Math.sin(Math.PI * (((t * 9 + thHash(i + 22) * 120) % 140) / 140));
      ctx.fillStyle = `rgba(210,255,190,${a * .3})`; circle(px, py, 4); ctx.fill(); ctx.fillStyle = `rgba(240,255,220,${a})`; circle(px, py, 1); ctx.fill(); } // marsh-lights drifting up out of the hollow
    for (let i = 0; i < 7; i++) { const dx = ((t * 6 + i * 40) % 280) - 40; softDab(x - 20 + dx, T + 10 + (i % 4) * 26 - k * 30, 46 + (i % 3) * 12, '226,230,214', .5 * (1 - k * .85)); } // the mist that hid the way down, sinking away
  },
};
TRANS_FX.roots = (T, p, c, inP, t) => { // down the roots into the mist: it rises past him, thick, and lifts away above onto the grove
  const y0 = inP ? lerp(VH + 70, Y_OFF - 70, c) : Y_OFF - 300, y1 = inP ? VH + 300 : lerp(Y_OFF - 70, VH + 70, c);
  thSweepV(y0, y1, () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, '#C4CCBC'); g.addColorStop(.5, '#A8B4A4'); g.addColorStop(1, '#7E8A7C'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 22; i++) { const x = thHash(i + 30) * VW, y = Y_OFF + ((thHash(i + 31) * 460 - p * 700) % 460 + 460) % 460 - 50; softDab(x, y, 50 + thHash(i + 32) * 60, i % 3 ? '236,240,226' : '110,126,104', i % 3 ? .4 : .3); } // banks of mist, lighter and darker, rising past
    for (let i = 0; i < 6; i++) { const side = i % 2, x = side ? VW - 30 - thHash(i) * 90 : 30 + thHash(i) * 90, yy = Y_OFF + ((thHash(i + 1) * 520 - p * 1300) % 520 + 520) % 520 - 80, l = 110 + thHash(i + 4) * 90; // roots slipping up past him, soft in the mist
      ctx.lineCap = 'round'; for (const [w, a] of [[16, .1], [10, .18], [5, .3]]) { ctx.strokeStyle = `rgba(52,42,30,${a})`; ctx.lineWidth = w * (.7 + thHash(i + 7) * .6); ctx.beginPath(); ctx.moveTo(x, yy - l / 2); ctx.quadraticCurveTo(x + (thHash(i + 5) - .5) * 30, yy, x - 8, yy + l / 2); ctx.stroke(); } } // (a few strokes over each other, so they stay soft)
  }, ['226,232,218', '#9AA690', '#C8D0BC'], 2);
};
// the Skyport → the Gearworks Deck: past the last of the port the open sunset sky of the cloud sea comes in overhead, and
// the galleon itself rides moored above the end of the pier, its copper-sheathed keel and lit ports looming out of the
// cloud; mooring lines run down to the bollards and the pier itself runs out into cloudbank. Asleep, the rope ladder is
// rolled up under the hull; awake, the lanterns along the hull come on and the ladder unrolls down to the planks
const thKeel = (x) => 150 - 66 * Math.pow((x + 40) / 330, 2); // the underside of the hull, overhead
THRESH.clouds = {
  edge: (y) => y < FLOOR_TOP - 66 ? -330 : 900, feather: 150,
  hazeB: [-520, 74, 300, VH], haze(r) {
    for (let i = 0; i < 10; i++) { const x = -480 + r() * 760, y = thKeel(x) - 10 - r() * 30; softDab(x, y, 30 + r() * 30, '255,214,190', .25); } // the sunset caught in the haze behind the hull
    for (let i = 0; i < 14; i++) softDab(-60 + r() * 340, FLOOR_TOP - 20 + r() * 40, 40 + r() * 30, '255,236,220', .35); // and lying over the end of the pier
  },
  backB: [-520, 60, 300, VH], back(r) {
    const T = FLOOR_TOP, X0 = -500, X1 = 300, at = (x, d) => thKeel(x) - d;
    ctx.beginPath(); ctx.moveTo(X0, 40); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, 0)); ctx.lineTo(X1, 40); ctx.closePath();
    const hg = ctx.createLinearGradient(0, 70, 0, 152); hg.addColorStop(0, '#2E1C1C'); hg.addColorStop(.55, '#5A3A2C'); hg.addColorStop(1, '#8E5E40'); ctx.fillStyle = hg; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(X0, at(X0, 0)); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, 0)); for (let x = X1; x >= X0; x -= 8) ctx.lineTo(x, at(x, 9)); ctx.closePath(); ctx.fillStyle = '#5A6A5C'; ctx.fill(); // copper sheathing gone to verdigris
    for (let i = 0; i < 70; i++) { const x = X0 + r() * (X1 - X0); dab(x, at(x, 1 + r() * 7), 2 + r() * 3, ['#7E9A88', '#4A5A4E', '#8A7A5A'][i % 3], .6); }
    for (let d = 9; d < 80; d += 6) { ctx.strokeStyle = 'rgba(40,22,14,.55)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(X0, at(X0, d)); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, d)); ctx.stroke(); // the strakes
      for (let x = X0 + (d * 7) % 40; x < X1; x += 40 + (d % 3) * 9) { ctx.beginPath(); ctx.moveTo(x, at(x, d)); ctx.lineTo(x, at(x, d + 6)); ctx.stroke(); } }
    for (let i = 0; i < 60; i++) { const x = X0 + r() * (X1 - X0), d = 14 + r() * 40; dab(x, at(x, d), 2 + r() * 4, r() < .5 ? 'rgba(255,214,170,.18)' : 'rgba(40,20,14,.2)', 1); } // weathering in the planks
    ctx.fillStyle = '#B08038'; ctx.beginPath(); ctx.moveTo(X0, at(X0, 24)); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, 24)); for (let x = X1; x >= X0; x -= 8) ctx.lineTo(x, at(x, 26.5)); ctx.closePath(); ctx.fill(); // the brass wale
    for (let x = X0 + 30; x < X1; x += 34) { const y = at(x, 36); ctx.fillStyle = '#2A1810'; circle(x, y, 3.6); ctx.fill(); ctx.fillStyle = '#C8903E'; ctx.lineWidth = 1.2; ctx.strokeStyle = '#C8903E'; circle(x, y, 3.6); ctx.stroke(); } // the ports
    ctx.restore();
    ctx.strokeStyle = '#2A1A14'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, -1)); ctx.stroke(); // the keel
    ctx.strokeStyle = 'rgba(255,200,150,.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = X0; x <= X1; x += 8) ctx.lineTo(x, at(x, -2.5)); ctx.stroke();
    ctx.fillStyle = '#2A1A14'; ctx.fillRect(-26, at(-14, -1), 28, 6); ctx.fillStyle = '#C8903E'; ctx.fillRect(-26, at(-14, -1) + 4, 28, 1.4); // the ladder hatch and its winch
    for (const [hx, bx, by] of [[-380, -430, T - 34], [200, 250, T - 30]]) { // mooring lines down to bollards on the pier
      ctx.strokeStyle = '#4A3424'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, at(hx, -2)); ctx.quadraticCurveTo((hx + bx) / 2 + 6, (at(hx, 0) + by) / 2 + 14, bx, by); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,170,.45)'; ctx.lineWidth = .7; ctx.stroke();
      ctx.fillStyle = '#3E3440'; ctx.fillRect(bx - 4, by - 2, 8, 12); ctx.fillStyle = '#B88A48'; ctx.fillRect(bx - 5, by - 3, 10, 2.4); }
  },
  frontInk: false, frontB: [-520, 74, 300, VH + 10], front(r) {
    for (let i = 0; i < 30; i++) { const x = -500 + r() * 780, y = thKeel(x) + 2 + r() * 20; if (Math.abs(x + 10) < 40) continue; softDab(x, y, 22 + r() * 26, i % 3 ? '255,232,214' : '232,186,180', .5); } // cloud wrapped round the keel
    for (let i = 0; i < 26; i++) { const y = FLOOR_TOP + 10 + r() * (VH - FLOOR_TOP), x = 70 + (y - FLOOR_TOP) * .35 + r() * 200; softDab(x, y, 26 + r() * 30, i % 4 ? '250,226,214' : '214,170,170', .7); } // the pier runs out into cloudbank
    for (let i = 0; i < 12; i++) { const y = FLOOR_TOP + 10 + r() * (VH - FLOOR_TOP), x = 90 + (y - FLOOR_TOP) * .35 + r() * 160; dab(x, y - 8, 8 + r() * 10, 'rgba(255,244,232,.5)', 1); }
  },
  live(x, k, t) {
    const T = FLOOR_TOP;
    for (let i = 0; i < 24; i++) { const px = x - 470 + i * 34, py = thKeel(px - x) - 36; glowAt(px, py, 10, '255,206,130', (.08 + .45 * thSm(k * 3 - i / 24 * 2)) * (1 + .1 * Math.sin(t * 3 + i))); } // the ports lit one after another
    const top = thKeel(-12) + 4, full = T + 26 - top, len = lerp(16, full, thSm(k)), sway = Math.sin(t * 1.1) * (2 + 2 * k), roll = 1 - thSm(k); // the rope ladder unrolling
    ctx.lineCap = 'round'; ctx.strokeStyle = '#5A3E2A'; ctx.lineWidth = 1.8;
    for (const dx of [-21, 1]) { ctx.beginPath(); ctx.moveTo(x + dx, top); ctx.quadraticCurveTo(x + dx + sway * .4, top + len * .6, x + dx + sway, top + len); ctx.stroke(); }
    for (let y = 10; y < len; y += 11) { const f = y / len; ctx.strokeStyle = '#7A5638'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 21 + sway * f * f, top + y); ctx.lineTo(x + 1 + sway * f * f, top + y + 1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,170,.5)'; ctx.lineWidth = .7; ctx.stroke(); }
    if (roll > .02) { ctx.fillStyle = '#6A4A30'; ell(x - 10 + sway, top + len, 14, 6 * roll + 2); ctx.fill(); ctx.strokeStyle = '#3A2618'; ctx.lineWidth = 1; ctx.stroke(); } // the roll of it, getting smaller
    glowAt(x - 10, T + 20, 60, '255,214,160', .16 * k); // lantern light pooled at its foot
  },
};
TRANS_FX.clouds = (T, p, c, inP, t) => { // up the ladder into the cloud: it comes down over him, thick and lit gold, and streams away below onto the deck
  const y0 = inP ? Y_OFF - 300 : lerp(VH + 70, Y_OFF - 70, c), y1 = inP ? lerp(Y_OFF - 70, VH + 70, c) : VH + 300;
  thSweepV(y0, y1, () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, '#F6DCCB'); g.addColorStop(.6, '#EEC6B4'); g.addColorStop(1, '#D8A8A0'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 26; i++) { const x = thHash(i) * VW, y = Y_OFF + ((thHash(i + 1) * 420 + p * (600 + thHash(i + 3) * 600)) % 420) - 40, r = 40 + thHash(i + 2) * 60; softDab(x, y + r * .2, r, '214,160,160', .4); softDab(x - r * .2, y - r * .2, r * .7, '255,242,230', .6); } // cloud streaming down past him, its tops lit
    const lx = VW * .52, sh = (p * 900) % 22; ctx.strokeStyle = 'rgba(90,62,42,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx - 11, Y_OFF); ctx.lineTo(lx - 11, VH); ctx.moveTo(lx + 11, Y_OFF); ctx.lineTo(lx + 11, VH); ctx.stroke(); // the ladder he climbs
    ctx.lineWidth = 3; for (let y = Y_OFF + sh; y < VH; y += 22) { ctx.beginPath(); ctx.moveTo(lx - 11, y); ctx.lineTo(lx + 11, y); ctx.stroke(); }
    glowAt(VW * .6, Y_OFF + 20, 220, '255,214,150', .3); }, ['250,232,220', '#F0C8B8', '#FFE8D8'], 3);
};

// the Gearworks Deck → the Foundry Crown: the deck runs into the foundry's iron flank; its furnace-lit hall comes in from
// ahead, framed by riveted girders under a great gear, and at the end a lift cage stands on a grating, the glow of the
// furnaces below coming up through its floor. Awake, the gear turns, the chains run, the cage's gate rises, sparks lift
const thIron = { base: '#4A3634', lit: '#C27A5A', dark: '#1E1414', warm: '#7A4632', rivet: '#E0A070' }, thBrass = { base: '#8A5E30', lit: '#F0B060', dark: '#3E2614', edge: '#FFD08A', hub: '#5A3A2A', hubLit: '#D88A50' };
const thCage = (y) => [lerp(-40, -58, (y - FLOOR_TOP - 14) / 78), lerp(96, 78, (y - FLOOR_TOP - 14) / 78)]; // the platform's edges, back (y = T + 14) to front (T + 92)
THRESH.lift = {
  edge: (y) => -250 + (y < 150 ? -60 : 0), feather: 120,
  hazeB: [-480, 74, 300, VH], haze(r) {
    for (let i = 0; i < 10; i++) softDab(-200 + r() * 460, 90 + r() * 80, 40 + r() * 40, '40,20,18', .35); // smoke under the foundry roof
    softDab(30, FLOOR_TOP + 50, 120, '255,120,50', .18);
  },
  backB: [-480, 60, 300, VH], back(r) {
    const T = FLOOR_TOP, chainP = { dark: '#140C0C', lit: '#B07050' };
    zskGirder(-236, 60, T + 4, 22, thIron); zskGirder(170, 60, T + 4, 26, thIron); // the iron portal into the foundry
    ctx.fillStyle = '#2A1C1A'; ctx.fillRect(-260, 92, 460, 16); ctx.fillStyle = '#C27A5A'; ctx.globalAlpha = .6; ctx.fillRect(-260, 106, 460, 1.4); ctx.globalAlpha = 1; for (let x = -254; x < 196; x += 9) awRivet(x, 100, .9, '#E0A070');
    for (const y of [T + 14]) { const [a, b] = thCage(y); for (const x of [a, b]) { ctx.fillStyle = '#241818'; ctx.fillRect(x - 1.5, 112, 3, y - 112); ctx.fillStyle = '#B07050'; ctx.fillRect(x - 1.5, 112, .8, y - 112); } } // the cage's back posts
    ctx.fillStyle = '#241818'; ctx.fillRect(-66, 110, 168, 5); // its roof frame
    zskChain(-40, 108, -40, 60, chainP, 1.2); zskChain(100, 108, 100, 60, chainP, 1.2);
    ctx.strokeStyle = 'rgba(26,16,16,.45)'; ctx.lineWidth = .8; for (let i = 0; i < 11; i++) { const x = -50 + i * 13; ctx.beginPath(); ctx.moveTo(x, 115); ctx.lineTo(x - 6, T + 14); ctx.stroke(); } // the back of the cage, a lattice
    for (const [x, h] of [[-300, 40], [230, 56]]) zskSteam(x, T - 6, h, .4); // vents breathing at the foot of the girders
  },
  frontB: [-120, 100, 200, VH + 6], front(r) {
    const T = FLOOR_TOP; const [a, b] = thCage(T + 92);
    for (const x of [a, b]) { ctx.fillStyle = '#2A1C1A'; ctx.fillRect(x - 1.8, 112, 3.6, T + 92 - 112); ctx.fillStyle = '#C27A5A'; ctx.fillRect(x - 1.8, 112, 1, T + 92 - 112); } // the cage's front posts (he steps in between them)
    ctx.fillStyle = '#2A1C1A'; ctx.fillRect(a - 4, 108, b - a + 8, 6);
  },
  live(x, k, t) {
    const T = FLOOR_TOP, heat = .35 + .65 * k;
    ctx.save(); ctx.translate(x, 0); // the grating, the furnaces' light coming up through it
    ctx.beginPath(); { const [a0, b0] = thCage(T + 14), [a1, b1] = thCage(T + 92); ctx.moveTo(a0, T + 14); ctx.lineTo(b0, T + 14); ctx.lineTo(b1, T + 92); ctx.lineTo(a1, T + 92); ctx.closePath(); }
    ctx.fillStyle = 'rgba(40,26,22,.85)'; ctx.fill(); // the platform: an iron floor, the furnace light seeping up through its slots
    ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; for (let y = T + 22; y < T + 90; y += 12) { const [a, b] = thCage(y); for (let sx = a + 10; sx < b - 12; sx += 22) { const g = ctx.createLinearGradient(0, y - 2, 0, y + 3); g.addColorStop(0, 'rgba(255,140,60,0)'); g.addColorStop(.5, `rgba(255,150,70,${.5 * heat})`); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(sx, y - 2, 14, 5); } } ctx.restore();
    ctx.strokeStyle = 'rgba(200,120,80,.4)'; ctx.lineWidth = .8; ctx.stroke();
    ctx.restore();
    glowAt(x + 30, T + 50, 110, '255,140,60', .2 * heat * (1 + .15 * Math.sin(t * 4)));
    ctx.save(); ctx.translate(x - 30, 84); awGear(0, 0, 30, 16, t * .5 * k + .4, thBrass); ctx.restore(); // the great gear on the lintel
    const gate = thSm(k * 1.2), [ga] = thCage(T + 50); ctx.strokeStyle = '#3A2620'; ctx.lineWidth = 1.6; ctx.beginPath(); // the gate on the near side of the cage, rising
    for (let i = 0; i < 7; i++) { const yy = lerp(T + 14, T + 92, i / 6); const [a] = thCage(yy), top = lerp(118, 112, gate), bot = lerp(yy, 124, gate); ctx.moveTo(a, top); ctx.lineTo(a, bot); }
    ctx.stroke();
    for (let i = 0; i < 8; i++) { const ph = thHash(i) * 3, life = ((t * .7 + ph) % 1.6) / 1.6, px = x + 30 + (thHash(i + 1) - .5) * 120 + Math.sin(t * 3 + i) * 6, py = T + 60 - life * 140; // sparks lifting off the grate
      ctx.fillStyle = `rgba(255,${200 - life * 80},90,${k * (1 - life)})`; circle(px, py, 1.2); ctx.fill(); }
    for (let i = 0; i < 3; i++) { const life = ((t * .25 + i / 3) % 1); softDab(x + 150 + i * 20 + life * 30, T - 10 - life * 90, 16 + life * 30, '236,222,214', .25 * (1 - life) * (.4 + .6 * k)); } // steam
  },
};
TRANS_FX.lift = (T, p, c, inP, t) => { // down in the cage: the shaft's iron walls rise past him, glowing red from below, and fall away onto the foundry
  const y0 = inP ? lerp(VH + 70, Y_OFF - 70, c) : Y_OFF - 300, y1 = inP ? VH + 300 : lerp(Y_OFF - 70, VH + 70, c);
  thSweepV(y0, y1, () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, '#140C0C'); g.addColorStop(.7, '#3A1C14'); g.addColorStop(1, '#7A3418'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 6; i++) { const y = Y_OFF + ((i * 70 - p * 1100) % 420 + 420) % 420 - 40; ctx.fillStyle = '#2A1A16'; ctx.fillRect(0, y, VW, 12); ctx.fillStyle = 'rgba(255,150,80,.35)'; ctx.fillRect(0, y + 11, VW, 1.2); for (let x = 8; x < VW; x += 18) awRivet(x, y + 6, 1, '#C88060'); } // girders rising past
    glowAt(VW / 2, VH + 40, VW * .7, '255,120,40', .35);
    for (let i = 0; i < 14; i++) { const u = (thHash(i) + p * 2.4) % 1; ctx.fillStyle = `rgba(255,${190 - u * 60},90,${.8 * (1 - u)})`; circle(thHash(i + 1) * VW, VH - u * VIEW_H, 1.3); ctx.fill(); } // sparks rising with him
    for (let i = 0; i < 6; i++) softDab(thHash(i + 20) * VW, Y_OFF + ((thHash(i + 21) * 300 - p * 600) % 300 + 300) % 300, 50, '20,10,10', .4); // smoke
    for (let i = 0; i < 9; i++) { const x = (i + .5) / 9 * VW; ctx.fillStyle = 'rgba(14,8,8,.8)'; ctx.fillRect(x - 3, Y_OFF, 6, VIEW_H); ctx.fillStyle = 'rgba(255,140,80,.3)'; ctx.fillRect(x + 2, Y_OFF, 1, VIEW_H); } }, ['30,16,14', '#4A2A20', '#7A3A22'], 4); // (the cage's bars, close by)
};
// the Prism road → the Inverted Gallery: the crystal plain gives way to the gallery ahead (its arches and stairs hanging
// head-down out of the sky, its polished floor), crystals still growing up the feet of its first marble columns; the road
// ends at a gilded archway glazed with a great mirror, the gallery standing in it upside down. Asleep, the glass is clouded;
// awake, it clears, light runs over it in prismatic bands and spills on the floor in front
const thArch = { cx: 6, ri: 46, top: 150 }; // the mirror arch: its centre, half-width and where it springs
THRESH.shatter = {
  edge: (y) => y < 170 ? -340 + (y - 84) * .4 : lerp(-306, -200, thCl((y - 170) / 70)), feather: 130,
  hazeB: [-200, 60, 220, VH], haze(r) { softDab(10, FLOOR_TOP + 40, 120, '200,170,255', .2); },
  backB: [-200, 74, 220, FLOOR_TOP + 20], back(r) {
    const Z = window.ZP_ART, T = FLOOR_TOP, P = Z.MARBLE, { cx, ri, top } = thArch, ring = 14;
    for (const x of [cx - ri - 9, cx + ri + 9]) Z.zColumn(x, top, T + 2, 15, P, { cap: true, foot: true }, r); // the archway's columns
    ctx.beginPath(); ctx.arc(cx, top, ri + ring + 6, Math.PI, 0); ctx.arc(cx, top, ri + 2, 0, Math.PI, true); ctx.closePath(); // the arch over them
    const g = ctx.createLinearGradient(cx - ri, 0, cx + ri, 0); g.addColorStop(0, P.dark); g.addColorStop(.6, P.base); g.addColorStop(1, P.lit); ctx.fillStyle = g; ctx.fill();
    for (let k = 1; k < 9; k++) { const a = Math.PI + k / 9 * Math.PI; ctx.strokeStyle = P.dark; ctx.globalAlpha = .4; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (ri + 2), top + Math.sin(a) * (ri + 2)); ctx.lineTo(cx + Math.cos(a) * (ri + ring + 6), top + Math.sin(a) * (ri + ring + 6)); ctx.stroke(); } ctx.globalAlpha = 1; // voussoirs
    ctx.strokeStyle = P.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, top, ri + 3, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = P.goldLit; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(cx, top - 1, ri + 3, Math.PI * 1.55, Math.PI * 1.95); ctx.stroke(); // gilt on its inner edge
    ctx.fillStyle = P.gold; ctx.beginPath(); ctx.moveTo(cx - 6, top - ri - ring - 8); ctx.lineTo(cx + 6, top - ri - ring - 8); ctx.lineTo(cx + 4, top - ri - 1); ctx.lineTo(cx - 4, top - ri - 1); ctx.closePath(); ctx.fill(); // keystone
    for (const [x, s] of [[cx - ri - 20, 26], [cx + ri + 22, 22], [cx - ri - 46, 14], [-150, 24]]) awCluster(x, T + 2, s, [190, 280, 320][Math.floor(r() * 3)], r, 50); // crystals growing up the columns' feet
  },
  live(x, k, t) {
    const T = FLOOR_TOP, { ri, top } = thArch, cx = x + thArch.cx, o = thSm(k), glass = () => { ctx.beginPath(); ctx.moveTo(cx - ri, T + 2); ctx.lineTo(cx - ri, top); ctx.arc(cx, top, ri, Math.PI, 0); ctx.lineTo(cx + ri, T + 2); ctx.closePath(); };
    ctx.save(); glass(); ctx.clip();
    const g = ctx.createLinearGradient(0, top - ri, 0, T); g.addColorStop(0, '#2E2458'); g.addColorStop(.55, '#8A6AAE'); g.addColorStop(1, '#E8BCC8'); ctx.fillStyle = g; ctx.fillRect(cx - ri, top - ri, ri * 2, T - top + ri + 4); // the gallery's dusk, seen upside down: its glow overhead, its floor below
    for (const [dx, w, l] of [[-28, 9, 70], [-2, 7, 44], [24, 10, 80]]) { for (let s = 0; s <= 8; s++) softDab(cx + dx, top - ri + l * s / 8, w * (s === 8 ? 1.3 : .85), '46,34,86', .32); softDab(cx + dx + w * .3, top - ri + l * .5, w * .5, '232,206,236', .12); } // its columns, hanging from its floor, soft in the glass
    for (let i = 0; i < 6; i++) softDab(cx - ri + thHash(i) * ri * 2, T - 20 - thHash(i + 1) * 40, 14, '255,220,230', .25);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sw = ((t * .3) % 2.4) - .7; // a band of split light running over the glass
    for (const [h, dd] of [[350, -5], [130, 0], [205, 5]]) { const gx = cx - ri + sw * ri * 2 + dd, lg = ctx.createLinearGradient(gx - 24, 0, gx + 24, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.5, `hsla(${h},80%,75%,${.06 + .2 * o})`); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.save(); ctx.translate(gx, 0); ctx.transform(1, 0, -.4, 1, 0, 0); ctx.fillRect(-24, top - ri, 48, T - top + ri); ctx.restore(); }
    ctx.restore();
    for (let i = 0; i < 14; i++) softDab(cx - ri + thHash(i + 9) * ri * 2, top - ri + thHash(i + 10) * (T - top + ri), 18 + thHash(i + 11) * 14, '226,214,240', .55 * (1 - o)); // the clouding on it, clearing
    ctx.restore();
    ctx.strokeStyle = `rgba(255,240,255,${.2 + .35 * o})`; ctx.lineWidth = 1; glass(); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, T + 24); ctx.scale(1, .22); const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, 110); fg.addColorStop(0, `rgba(220,190,255,${.35 * o})`); fg.addColorStop(1, 'rgba(220,190,255,0)'); ctx.fillStyle = fg; ctx.fillRect(-110, -110, 220, 220); ctx.restore(); // its light on the floor
  },
};
TRANS_FX.shatter = (T, p, c, inP, t) => { // through the glass: it crazes from where he touches it, then the old picture falls away in pieces onto the gallery
  if (inP) {
    const ox = P.x - camX + 6, oy = P.y - 50; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const a = hash1(i) * TAU, len = (120 + hash1(i + 1) * 380) * c; ctx.strokeStyle = `hsla(${200 + i * 22},70%,82%,${.35 * c + .1})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, oy);
      for (let s = 1; s <= 4; s++) ctx.lineTo(ox + Math.cos(a + (hash1(i * 4 + s) - .5) * .5) * len * s / 4, oy + Math.sin(a + (hash1(i * 4 + s) - .5) * .5) * len * s / 4); ctx.stroke(); }
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 260 * c); g.addColorStop(0, `rgba(230,210,255,${.3 * c})`); g.addColorStop(1, 'rgba(230,210,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H); ctx.restore();
  } else if (snapC) {
    const q = (p - .5) * 2, cols = 8, rows = 5, cw = snapC.width / cols, ch = snapC.height / rows;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) for (const tri of [0, 1]) {
      const id = (r * cols + cI) * 2 + tri, x = cI * cw, y = r * ch, pts = tri ? [[x, y], [x + cw, y], [x, y + ch]] : [[x + cw, y], [x + cw, y + ch], [x, y + ch]];
      const mx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, my = (pts[0][1] + pts[1][1] + pts[2][1]) / 3, d = hash1(id + 11) * .35, qq = thCl((q - d) / (1 - d)); // (not all at once)
      const dx = (hash1(id) - .5) * 260 * K * qq, dy = (680 * qq * qq + hash1(id + 7) * 120 * qq) * K, rot = (hash1(id + 3) - .5) * 4 * qq;
      ctx.save(); ctx.globalAlpha = 1 - qq * qq; ctx.translate(mx + dx, my + dy); ctx.rotate(rot); ctx.translate(-mx, -my);
      ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath(); ctx.clip(); ctx.drawImage(snapC, x, y, cw, ch, x, y, cw, ch);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,200,255,.35)'; ctx.lineWidth = 1.2 * K; ctx.stroke(); ctx.restore();
    }
  }
};

// the Inverted Gallery → the Wyrm's Nest: the gallery's dusk goes out overhead into the nest's starry dark, and great ribs
// of crystal bone come down out of it over the road, the first of the wyrm's cage; a broken column or two lies where the
// gallery gives out. Awake, the stars between the ribs open: they are eyes, and they watch him come
THRESH.invert = {
  edge: (y) => y < 180 ? -370 + (y - 84) * .4 : lerp(-332, -200, thCl((y - 180) / 60)), feather: 140,
  backB: [-520, 60, 280, FLOOR_TOP + 20], back(r) {
    const Z = window.ZP_ART, T = FLOOR_TOP;
    Z.zColumn(-330, 150, T + 2, 15, Z.MARBLE, { foot: true, brk: true }, r); // the gallery giving out
    ctx.save(); ctx.translate(-270, T - 4); ctx.rotate(1.45); Z.zColumn(0, -14, 14, 13, Z.MARBLE, {}, r); ctx.restore(); // a drum fallen in the road
    Z.zRib(-260, 66, -20, 52, 20, T + 6, 22, 8, Z.BONE_FAR, r, 4); // ribs of crystal bone, bowing down over the road
    Z.zRib(-120, 60, 140, 50, 170, T + 6, 28, 10, Z.BONE, r, 5);
    awCluster(160, T + 2, 32, 210, r, 54); awCluster(10, T + 2, 18, 290, r, 50); awCluster(-300, T + 2, 14, 190, r, 46);
    for (let k = 0; k < 6; k++) Z.zScale(120 + r() * 80, T - 1 - r() * 4, 5 + r() * 3, (r() - .5) * 2, 180 + r() * 160, 1, .6); // shed scales
  },
  live(x, k, t) { // the stars that are eyes
    for (let i = 0; i < 7; i++) {
      const ex = x - 200 + thHash(i + 3) * 330, ey = 96 + thHash(i + 4) * 70, open = thSm(k * 2.2 - thHash(i + 5) * 1.2) * (.85 + .15 * Math.sin(t * .7 + i)), blink = (t * .23 + thHash(i + 6) * 7) % 7 < .12 ? .1 : 1;
      glowAt(ex, ey, 14, '210,200,255', .12 + .3 * open);
      ctx.fillStyle = `rgba(255,250,255,${.5 + .5 * (1 - open)})`; ctx.beginPath(); ctx.ellipse(ex, ey, 1.4 + 3.6 * open, Math.max(.6, 1.4 * (1 - open) + 2.6 * open * blink), 0, 0, TAU); ctx.fill();
      if (open > .2) { const lk = clamp((P.x - ex) / 300, -1, 1); ctx.fillStyle = `rgba(${i % 2 ? '150,230,240' : '230,160,240'},${open})`; ctx.beginPath(); ctx.ellipse(ex + lk * 1.6 * open, ey + .4, .9 * open, 2.2 * open * blink, 0, 0, TAU); ctx.fill(); }
    }
  },
};
TRANS_FX.invert = (T, p, c, inP, t) => { // the world turns over (zoneViewTurn) and the starry dark closes in round him, then opens on the nest
  const cx = VW / 2, cy = Y_OFF + VIEW_H / 2, R = Math.hypot(VW, VIEW_H) * .62 * (1 - c), rot = p * Math.PI;
  ctx.save(); ctx.beginPath(); ctx.rect(-10, Y_OFF - 10, VW + 20, VIEW_H + 20); ctx.moveTo(cx + R, cy);
  for (let i = 1; i <= 48; i++) { const a = i / 48 * TAU, rr = R * (1 + .08 * Math.sin(a * 5 + rot * 3) + .05 * Math.sin(a * 9 - rot * 2)); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.closePath(); const g = ctx.createRadialGradient(cx, cy, R * .8, cx, cy, VW * .8); g.addColorStop(0, '#1E1440'); g.addColorStop(1, '#06040E'); ctx.fillStyle = g; ctx.fill('evenodd'); ctx.restore();
  for (let i = 0; i < 26; i++) softDab(cx + Math.cos(i / 26 * TAU + rot) * R * 1.02, cy + Math.sin(i / 26 * TAU + rot) * R * 1.02, 30 + hash1(i) * 30, '70,40,130', .5 * c); // its edge, soft as nebula
  for (let i = 0; i < 60; i++) { const a = hash1(i) * TAU, d = R + hash1(i + 1) * VW * .6; if (d < R * 1.05) continue; ctx.fillStyle = `rgba(240,236,255,${(.4 + .6 * hash1(i + 2)) * c})`; circle(cx + Math.cos(a + rot * .5) * d, cy + Math.sin(a + rot * .5) * d, .6 + hash1(i + 3) * 1.2); ctx.fill(); } // its stars
};
// the Black Road → the Thelbane Spires: the pale city comes up out of the haze ahead, its spires overhead first, then its
// paving under the black glass of the road; two of its bone-white spires stand either side of the way like gateposts, a
// chain swagged between them, and the Logrus writhes between them like smoke. Awake, it sinks back into the road and a
// sulfur-gold light shows the way through
const thSpire = { base: '#B49C8C', lit: '#FFEACC', dark: '#3E2C48', band: '#C9A040', win: '#FFD860' };
THRESH.w4logrus = {
  edge: (y) => y < 170 ? -360 + (y - 84) * .5 : lerp(-317, -200, thCl((y - 170) / 70)), feather: 130,
  hazeB: [-300, 74, 260, VH], haze(r) { for (let i = 0; i < 10; i++) softDab(-40 + r() * 170, 120 + r() * 120, 30 + r() * 40, i % 2 ? '240,200,140' : '200,140,170', .22); },
  backB: [-480, 60, 280, FLOOR_TOP + 20], back(r) {
    const W = window.W4_ART, T = FLOOR_TOP;
    W.thornTree(-340, T + 2, 120, r); W.thornTree(-250, T + 2, 70, r); // the last of the Black Road's thorns
    W.crag(-300, T - 40, 16, r, W.OBS, { veins: 1 });
    W.spire(-62, T + 6, 150, 18, thSpire, r, { bulbs: 2.4, ph: .6 }); W.spire(132, T + 6, 172, 22, thSpire, r, { bulbs: 2.2, ph: 1.4 }); // the gateposts of Thelbane
    W.chain(-56, 128, 126, 118, 24, '#3A2A3A', '#B89A88'); W.chain(-58, 168, 128, 160, 14, '#3A2A3A', '#B89A88');
    W.stairs(150, 120, 5, 4.4, { dark: '#5E4A62', base: '#C8B49C', lit: '#FFF2D8' }, 1); // a flight of steps floating up out of sight
  },
  live(x, k, t) {
    const T = FLOOR_TOP, o = thSm(k * 1.2), cx = x + 34;
    glowAt(cx, T - 40, 90, '255,210,130', .06 + .22 * o);
    ctx.lineCap = 'round';
    softDab(cx, T + 4, 80, '20,8,28', .5 * (1 - .7 * o)); // where it comes up out of the road
    for (let i = 0; i < 7; i++) { // the Logrus: tendrils of smoke, writhing up between the posts; awake, they sink and part
      const bx = cx - 60 + i * 20, h = (100 + thHash(i) * 60) * (1 - .8 * o), lean = (i - 3) * 9 * (1 + 2.5 * o);
      for (let s = 0; s <= 16; s++) { const u = s / 16, px = bx + lean * u + Math.sin(t * (1.1 + i * .13) + s * .5 + i) * 9 * u, py = T + 6 - h * u;
        softDab(px, py, (18 - u * 10) * (1 - .4 * o), i % 2 ? '34,12,46' : '16,6,24', .9 * (1 - u * .4) * (1 - .55 * o)); }
      ctx.strokeStyle = `rgba(${i % 2 ? '196,140,236' : '150,100,210'},${.55 * (1 - o)})`; ctx.lineWidth = 1.2; ctx.beginPath(); // a gleam of violet along each
      for (let s = 0; s <= 10; s++) { const u = s / 10, px = bx + lean * u + Math.sin(t * (1.1 + i * .13) + s * .8 + i) * 9 * u + 3, py = T + 6 - h * u; s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(230,180,90,${.15 + .35 * o})`; ctx.lineWidth = 1; ctx.beginPath(); // its gold sign, tracing itself in the air as it goes
    for (let a = 0; a < TAU * 1.6 * (.3 + .7 * o); a += .2) { const rr = 3 + a * 5.5; const px = cx + Math.cos(a + t * .3) * rr, py = T - 60 + Math.sin(a + t * .3) * rr * 1.1; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
  },
};

// the Thelbane Spires → the Rim of the Abyss: the pale city runs out at the edge of everything; ahead the Abyss's red
// light comes up and the eclipse hangs over it, the terrace's balustrade broken off at the brink, and stones of the
// broken causeway hang in the air beyond it. Asleep they drift; awake, they float into line, a path out over the drop
const thSlab = (i) => [-10 + i * 46, FLOOR_TOP + 52 - i * 10]; // where each stone settles
THRESH.w4trump = {
  edge: (y) => y < 170 ? -340 + (y - 84) * .4 : lerp(-306, -170, thCl((y - 170) / 70)), feather: 140,
  hazeB: [-200, 74, 280, VH], haze(r) { for (let i = 0; i < 14; i++) softDab(-20 + r() * 300, FLOOR_TOP + 10 + r() * 100, 40 + r() * 40, '255,110,80', .14); },
  backB: [-200, 150, 120, VH], back(r) {
    const T = FLOOR_TOP;
    for (const [x, h, tilt] of [[-150, 26, 0], [-128, 26, 0], [-106, 22, .1], [-86, 14, .35]]) { ctx.save(); ctx.translate(x, T + 2); ctx.rotate(tilt); ctx.fillStyle = '#7A6276'; ctx.fillRect(-3, -h, 6, h); ctx.fillStyle = '#E8D8BC'; ctx.fillRect(-3, -h, 2, h); ctx.fillStyle = '#5E4A62'; ctx.fillRect(-5, -h - 3, 10, 4); ctx.restore(); } // the balustrade, broken off
    ctx.fillStyle = '#C8B49C'; ctx.fillRect(-160, T - 30, 66, 4); ctx.fillStyle = '#FFF2D8'; ctx.fillRect(-160, T - 30, 66, 1.2);
    const edge = (u) => [lerp(-56, -18, u) + Math.sin(u * 11) * 7 + Math.sin(u * 29) * 3, lerp(T, VH + 6, u)]; // the brink: the paving broken off, its rough edge lit, the rock under it falling away
    for (let u = 0; u < 1; u += .012) { const [x, y] = edge(u), fw = 26 + u * 30, g = ctx.createLinearGradient(x, 0, x + fw, 0); g.addColorStop(0, 'rgba(42,26,38,.95)'); g.addColorStop(1, 'rgba(90,30,40,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, fw, 1.6); ctx.fillStyle = 'rgba(232,216,188,.7)'; ctx.fillRect(x - 3, y, 3, 1.6); }
  },
  live(x, k, t) {
    const W = window.W4_ART, o = thSm(k * 1.1);
    glowAt(x + 120, FLOOR_TOP + 40, 160, '255,110,70', .12 + .1 * Math.sin(t * .8));
    for (let i = 0; i < 6; i++) { // the stones of the causeway: drifting, then settling into a path
      const [sx, sy] = thSlab(i), ph = thHash(i) * TAU, dx = (thHash(i + 1) - .5) * 70 * (1 - o), dy = ((thHash(i + 2) - .5) * 90 - 30) * (1 - o) + Math.sin(t * .9 + ph) * (5 - 3 * o), w = 22 - i * 1.6;
      const X = x + sx + dx, Y = sy + dy, rr = mulberry(i + 3); // a slab of the causeway: a flat paved top, a ragged root of rock under it
      ctx.fillStyle = '#2E2232'; ctx.beginPath(); ctx.moveTo(X - w, Y); for (let q = 1; q < 6; q++) ctx.lineTo(X - w + q * w * .4, Y + w * (.5 + rr() * .5) * Math.sin(q / 6 * Math.PI)); ctx.lineTo(X + w, Y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,110,130,.5)'; ctx.beginPath(); ctx.moveTo(X + w * .2, Y); ctx.lineTo(X + w, Y); ctx.lineTo(X + w * .5, Y + w * .5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#A8907E'; ctx.beginPath(); ctx.moveTo(X - w, Y); ctx.lineTo(X - w * .8, Y - 4); ctx.lineTo(X + w * .9, Y - 4.5); ctx.lineTo(X + w, Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#E8D8BC'; ctx.fillRect(X - w * .8, Y - 4.5, w * 1.7, 1.2);
      glowAt(x + sx + dx, sy + dy + w * .5, 22, '255,120,80', .2 * o);
    }
  },
};
TRANS_FX.w4trump = (T, p, c, inP, t) => { // out over the stones and into the Abyss's turning: its red spiral wheels in from the edges, and unwinds onto the rim
  const cx = VW / 2, cy = Y_OFF + VIEW_H * .45, R = Math.hypot(VW, VIEW_H) * .75, rot = p * 5, hole = R * (1 - c), k = (v) => thCl(v / R);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(42,8,18,0)'); g.addColorStop(k(hole * .7), 'rgba(42,8,18,0)'); g.addColorStop(Math.min(.99, k(hole * 1.15) + .01), 'rgba(74,20,40,1)'); g.addColorStop(1, '#12060E'); // (the middle stays open, softly)
  ctx.fillStyle = g; ctx.fillRect(-10, Y_OFF - 10, VW + 20, VIEW_H + 20);
  for (let arm = 0; arm < 4; arm++) for (let i = 0; i < 22; i++) { const u = i / 22, a = arm / 4 * TAU + u * 4.2 + rot, d = hole + u * R * .9; // the spiral arms, soft as smoke
    softDab(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7, 22 + u * 40, arm % 2 ? '230,110,80' : '120,40,90', .35 * c * (1 - u * .5)); }
  glowAt(cx, cy, 90 * c + 10, '255,214,150', .3 * c);
};

// the Stair of Moonlight → the Streets of Tir-na Nog'th: as the terrace runs out, the ghost city appears in the sky ahead,
// standing on its cloud (its own layers, lifted up into the sky), and the moon lays a stair of light from the end of
// the terrace up into it. Asleep the stair is barely there; awake, it firms, step by step, from the foot up
const thStep = (i) => [-24 + i * 15, FLOOR_TOP + 22 - i * 7.6]; // the stair: from the end of the terrace up to the city
THRESH.w5moonpath = {
  nextDY: -96, nextA: .8,
  mask() { // the city, in the sky above a bank of cloud
    for (let y = 84; y < 196; y += 3) { const x0 = -360 + (196 - y) * .3 + Math.sin(y * .1) * 12, g = ctx.createLinearGradient(x0 - 120, 0, x0 + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); ctx.fillStyle = g; ctx.fillRect(x0 - 120, y, 600, 3.4); }
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; const g = ctx.createLinearGradient(0, 150, 0, 196); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); ctx.fillStyle = g; ctx.fillRect(-900, 150, 1200, 60); ctx.restore();
  },
  hazeB: [-480, 120, 280, 220], haze(r) { // the cloud the city stands on
    for (let i = 0; i < 40; i++) { const x = -440 + r() * 700, y = 168 + r() * 26 - Math.max(0, -x - 300) * .1; softDab(x, y, 22 + r() * 30, i % 3 ? '150,168,220' : '200,214,245', .4); }
    const W = window.W5_ART; for (let i = 0; i < 4; i++) W.cloudIsle(-300 + i * 150 + r() * 40, 178 + r() * 12, 30 + r() * 20, r, 'rgba(110,126,186,.7)', 'rgba(220,230,255,.8)');
  },
  live(x, k, t) {
    const n = 34;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const [sx, sy] = thStep(i), u = i / n, on = (.12 + .88 * thSm(k * 1.6 - u)) * (1 - u * .5), w = lerp(46, 16, u), h = lerp(4.4, 1.6, u);
      const g = ctx.createLinearGradient(0, sy, 0, sy + h * 3); g.addColorStop(0, `rgba(230,238,255,${.7 * on})`); g.addColorStop(.3, `rgba(170,186,236,${.3 * on})`); g.addColorStop(1, 'rgba(120,140,210,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x + sx - w / 2, sy); ctx.lineTo(x + sx + w / 2, sy); ctx.lineTo(x + sx + w / 2 - 2, sy + h * 3); ctx.lineTo(x + sx - w / 2 + 2, sy + h * 3); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < n; i += 3) { const [sx, sy] = thStep(i); softDab(x + sx, sy + 4, 18, '200,214,250', .1 * (.3 + k)); } // its light, hazy
    for (let i = 0; i < 5; i++) { const u = ((t * .05 + i / 5) % 1), [sx, sy] = thStep(Math.floor(u * n)); ctx.fillStyle = `rgba(240,244,255,${.6 * k * Math.sin(u * Math.PI)})`; circle(x + sx + Math.sin(t + i) * 8, sy - 6 - 10 * Math.sin(t * .7 + i), 1.1); ctx.fill(); } // motes drifting up it
  },
};

// the Streets → the Moon Throne: the last houses give way to the palace's own front, pale stone fading upward into the
// night, banners of the unicorn either side, and a great door at the head of three steps; through it, the throne hall
// itself (its own layers). Asleep, the doors are shut; awake, they swing open and moonlight spills out onto the street
const thDoor = { cx: 10, w: 58, top: 128 }; // the doorway: centre, width, the top of its arch
const thDoorPath = (x, inset = 0) => { const { cx, w, top } = thDoor, hw = w / 2 - inset, T = FLOOR_TOP + 2; ctx.beginPath(); ctx.moveTo(x + cx - hw, T); ctx.lineTo(x + cx - hw, top + hw); ctx.quadraticCurveTo(x + cx - hw, top + inset, x + cx, top + inset - 6); ctx.quadraticCurveTo(x + cx + hw, top + inset, x + cx + hw, top + hw); ctx.lineTo(x + cx + hw, T); ctx.closePath(); };
THRESH.w5mist = {
  nextDX: 260,
  mask() { ctx.fillStyle = '#fff'; thDoorPath(0, -2); ctx.fill(); },
  backB: [-230, 70, 260, FLOOR_TOP + 30], back(r) {
    const W = window.W5_ART, T = FLOOR_TOP, x0 = -170, x1 = 200, top = 70;
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#24305A'); g.addColorStop(.55, '#3A4A7C'); g.addColorStop(1, '#5A6C9E'); ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, T + 4 - top); // the palace front, pale in the moon
    ctx.strokeStyle = 'rgba(10,14,32,.45)'; ctx.lineWidth = .7; ctx.beginPath(); for (let y = top + 10; y < T; y += 11) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); for (let bx = x0 + ((y / 11) % 2) * 13; bx < x1; bx += 26) { ctx.moveTo(bx, y); ctx.lineTo(bx, y + 11); } } ctx.stroke();
    for (let i = 0; i < 40; i++) dab(x0 + r() * (x1 - x0), top + r() * (T - top), 3 + r() * 6, r() < .5 ? 'rgba(200,214,245,.12)' : 'rgba(10,14,32,.15)', 1);
    for (const px of [-140, -60, 80, 160]) { const pg = ctx.createLinearGradient(px - 7, 0, px + 7, 0); pg.addColorStop(0, '#1E2A50'); pg.addColorStop(.6, '#5A6C9E'); pg.addColorStop(1, '#A8B8DC'); ctx.fillStyle = pg; ctx.fillRect(px - 7, top, 14, T + 4 - top); ctx.fillStyle = 'rgba(232,238,248,.8)'; ctx.fillRect(px + 6, top, 1, T + 4 - top); } // pilasters
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; thDoorPath(0); ctx.fill(); // the doorway, open through to the hall
    const fg = ctx.createLinearGradient(0, top, 0, top + 70); fg.addColorStop(0, 'rgba(0,0,0,.95)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = fg; ctx.fillRect(x0 - 10, top - 2, x1 - x0 + 20, 72); ctx.restore(); // its upper storeys thinning into the night
    ctx.strokeStyle = '#C8D2E4'; ctx.lineWidth = 3; thDoorPath(0, -4); ctx.stroke(); ctx.strokeStyle = '#6A7898'; ctx.lineWidth = 1; thDoorPath(0, -7); ctx.stroke(); // the arch, silver leaf
    for (let i = 0; i < 3; i++) { const y = T - 2 + i * 7, w = 80 + i * 16; ctx.fillStyle = i % 2 ? '#3E4E80' : '#56689A'; ctx.fillRect(thDoor.cx - w / 2, y, w, 7); ctx.fillStyle = 'rgba(220,230,255,.6)'; ctx.fillRect(thDoor.cx - w / 2, y, w, 1); } // three steps up to it
    W.unicornBanner(-100, 118, 46, r); W.unicornBanner(110, 118, 46, r); W.coldLamp(-44, T + 2, 54, r); W.coldLamp(66, T + 2, 54, r);
    for (const sx of [x0, x1]) for (let i = 0; i < 5; i++) softDab(sx + (r() - .5) * 30, top + 30 + r() * (T - top - 30), 26, '120,140,200', .25); // the street's mist round its corners
  },
  live(x, k, t) {
    const T = FLOOR_TOP, { cx, w, top } = thDoor, o = thSm(k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x + cx, T + 18); ctx.scale(1, .3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 120); g.addColorStop(0, `rgba(220,232,255,${.4 * o})`); g.addColorStop(1, 'rgba(220,232,255,0)'); ctx.fillStyle = g; ctx.fillRect(-120, -120, 240, 240); ctx.restore(); // moonlight spilling down the steps
    ctx.save(); thDoorPath(x); ctx.clip();
    for (const s of [-1, 1]) { const lw = w / 2 * (1 - o * .86); ctx.save(); ctx.translate(x + cx + s * w / 2, 0); ctx.scale(-s, 1); // each leaf swings back on its hinge
      const lg = ctx.createLinearGradient(0, 0, lw, 0); lg.addColorStop(0, '#1A2448'); lg.addColorStop(1, '#2E3E6E'); ctx.fillStyle = lg; ctx.fillRect(0, top - 10, lw, T + 4 - top + 10);
      ctx.strokeStyle = 'rgba(10,14,30,.6)'; ctx.lineWidth = .8; ctx.strokeRect(lw * .15, top + 26, lw * .7, 40); ctx.strokeRect(lw * .15, top + 74, lw * .7, T - top - 84);
      if (lw > 8) { const ux = lw * .5, uy = top + 46; ctx.strokeStyle = '#C8D2E4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ux - 4, uy + 12); ctx.quadraticCurveTo(ux - 5, uy + 3, ux - 1, uy - 1); ctx.lineTo(ux + 4, uy); ctx.lineTo(ux + 1.4, uy + 3); ctx.quadraticCurveTo(ux, uy + 7, ux + 3, uy + 12); ctx.moveTo(ux - 1, uy - 1); ctx.lineTo(ux + 2, uy - 9); ctx.stroke(); } // the unicorn
      ctx.restore(); }
    ctx.restore();
    glowAt(x + cx, T - 30, 60, '220,232,255', .1 + .3 * o);
  },
};
let thDoorC = null;
TRANS_FX.w5mist = (T, p, c, inP, t) => { // through the doors: the doorway opens out round him until the hall is all there is, then its silver frame goes past
  const L = threshX(), { cx, w, top } = thDoor, dx = inP ? L + cx - camX : VW / 2, dy = (top + FLOOR_TOP) / 2, s = inP ? 1 + 11 * Math.pow(c, 2.2) : 12 + 10 * (1 - c);
  ctx.save(); ctx.translate(lerp(dx, VW / 2, inP ? c : 1), lerp(dy, Y_OFF + VIEW_H / 2, inP ? c : 1)); ctx.scale(s, s); ctx.translate(-(L + cx - camX), -dy);
  const arch = () => { ctx.beginPath(); const hw = w / 2, X = L + cx - camX, B = FLOOR_TOP + 2; ctx.moveTo(X - hw, B + 20); ctx.lineTo(X - hw, top + hw); ctx.quadraticCurveTo(X - hw, top, X, top - 6); ctx.quadraticCurveTo(X + hw, top, X + hw, top + hw); ctx.lineTo(X + hw, B + 20); ctx.closePath(); };
  if (inP) { // the hall, in the doorway
    if (!thDoorC || thDoorC.width !== cv.width || thDoorC.height !== cv.height) thDoorC = texCanvas(cv.width, cv.height)[0];
    const g = thDoorC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, thDoorC.width, thDoorC.height); g.setTransform(K, 0, 0, K, 0, -Y_OFF * K);
    if (window.nextWorldInto(g, t, { cam: 0 })) { ctx.save(); arch(); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(thDoorC, 0, 0); ctx.restore(); }
    ctx.restore(); ctx.save(); ctx.fillStyle = `rgba(6,8,20,${.5 * c})`; ctx.beginPath(); ctx.rect(0, Y_OFF, VW, VIEW_H); ctx.translate(lerp(dx, VW / 2, c), lerp(dy, Y_OFF + VIEW_H / 2, c)); ctx.scale(s, s); ctx.translate(-(L + cx - camX), -dy); arch(); ctx.fill('evenodd'); // the street darkening round it
  }
  ctx.strokeStyle = `rgba(200,212,236,${inP ? .9 : c})`; ctx.lineWidth = 3 / s * 1.5; arch(); ctx.stroke(); ctx.restore();
};
TRANS_FX.w4logrus = (T, p, c, inP, t) => { // into the Logrus: its smoke comes over him from ahead, the gold of its sign burning in it, and slides away behind him onto the spires
  const x0 = inP ? lerp(VW + 90, -90, c) : -400, x1 = inP ? VW + 400 : lerp(-90, VW + 90, c);
  thSweep(x0, x1, () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, '#0E0614'); g.addColorStop(.6, '#1E0E26'); g.addColorStop(1, '#2A1020'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 18; i++) softDab(thHash(i) * VW, Y_OFF + thHash(i + 1) * VIEW_H, 40 + thHash(i + 2) * 50, i % 2 ? '60,24,80' : '30,10,40', .5); // the smoke's own turning
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(230,180,90,.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); // the gold of the sign, writhing in it
    for (let i = 0; i < 7; i++) { let x = thHash(i + 5) * VW, y = Y_OFF + thHash(i + 6) * VIEW_H, a = thHash(i + 9) * TAU; ctx.moveTo(x, y); for (let s = 0; s < 12; s++) { a += Math.sin(i * 3 + s + p * 4) * .8; x += Math.cos(a) * 14; y += Math.sin(a) * 10; ctx.lineTo(x, y); } }
    ctx.stroke(); ctx.restore(); }, ['30,10,40', '#3A1A4A', '#5A2A6A', '#C8A040'], 5);
};
// ---------- a staggered boss is stunned: it reels on the spot with stars and a ring of dizziness circling its head ----------
{
  const _draw = drawEnemy;
  drawEnemy = function (e, t) {
    _draw(e, t);
    if (!e.boss || e.dead || e.state !== 'down') return;
    const fadeIn = clamp((t - (e.stunAt || t)) / .5, 0, 1); if (fadeIn <= 0) return;
    onMain(() => {
      ctx.globalAlpha = fadeIn;
      const s = e.size || 1, hx = e.x + e.facing * e.hw * .55, hy = e.y - e.z - e.hh * s * .95, R = 16 + e.hw * .25;
      ctx.save(); ctx.strokeStyle = `rgba(238,212,138,${.35 + .2 * Math.sin(t * 6)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(hx, hy, R, R * .32, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 4; i++) { // stars and little birds chasing each other round the ring
        const a = t * 4.2 + i / 4 * TAU, x = hx + Math.cos(a) * R, y = hy + Math.sin(a) * R * .32, front = Math.sin(a) > 0, sc = front ? 1 : .7;
        ctx.globalAlpha = front ? 1 : .55;
        if (i % 2) { ctx.fillStyle = '#FFE9A0'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = (k % 2 ? 2.2 : 5.2) * sc, b = k / 10 * TAU - Math.PI / 2 + t * 2; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7A5A20'; ctx.lineWidth = .8; ctx.stroke(); }
        else { const fl = Math.sin(t * 22 + i) * 2.5; ctx.strokeStyle = '#F4EEE0'; ctx.lineWidth = 1.6 * sc; ctx.beginPath(); ctx.moveTo(x - 4 * sc, y - fl * sc); ctx.quadraticCurveTo(x - 1.5 * sc, y - 1 * sc, x, y + .5); ctx.quadraticCurveTo(x + 1.5 * sc, y - 1 * sc, x + 4 * sc, y - fl * sc); ctx.stroke(); }
      }
      ctx.restore();
    });
  };
}
