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
// relative to the way on); live, liveFront(x, wake, t): what moves; next: false to keep the next place out of it }.
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
    if (part !== 'haze') { const k0 = K; K = KS; try { paintLayer(cv2, { ink: '#1A100C', line: part === 'front' ? .7 : .6, lw: 1, brush: .9, hatch: .12, seed: 5 }); } finally { K = k0; releaseScratch(); } }
    c = cv2; c.b = b; SPR.set(part, c); return c;
  }
  const drawSpr = (kind, T, part, L) => { if (!T[part]) return; const c = sprite(kind, part, T), b = c.b; ctx.drawImage(c, L + b[0], b[1], b[2] - b[0], b[3] - b[1]); };
  // ---------------- the next place, showing through ----------------
  const MS = .25, MX0 = -820, MX1 = 220; // the mask is soft, so it is kept small
  let mkC = null, mkKey = '', nwC = null, nwG = null;
  function edgeMask(T) { // the next place shows right of a ragged, brushed edge: T.edge(y) is where it is half there, T.feather how soft
    const f = T.feather || 110, r = mulberry(11), at = (y) => T.edge(y) + Math.sin(y * .05 + 1) * 16 + Math.sin(y * .13 + 2) * 8 + Math.sin(y * .31) * 4;
    for (let y = 0; y < VH; y += 3) { const x = at(y), g = ctx.createLinearGradient(x - f, 0, x + f, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); ctx.fillStyle = g; ctx.fillRect(x - f, y, MX1 - x + f, 3.4); }
    for (let i = 0; i < 46; i++) { const y = r() * VH, x = at(y) - f * (.2 + r() * .7); softDab(x, y, 14 + r() * 26, '255,255,255', .45); } // blots where the brush went over the edge
  }
  function maskFor(kind, T) {
    if (mkKey === kind && mkC) return mkC;
    if (!mkC) [mkC] = texCanvas(Math.ceil((MX1 - MX0) * MS), Math.ceil(VH * MS));
    const g = mkC.getContext('2d'), old = ctx; ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, mkC.width, mkC.height); g.setTransform(MS, 0, 0, MS, -MX0 * MS, 0);
    try { T.mask ? T.mask() : edgeMask(T); } finally { ctx = old; }
    mkKey = kind; return mkC;
  }
  function drawNext(kind, T, L, t) {
    const B = NX && NX.K === K ? NX : prepNext(); if (!B) return;
    const sx0 = L + MX0 - camX; if (sx0 > VW || L + MX1 - camX < 0) return;
    if (!nwC || nwC.width !== cv.width || nwC.height !== cv.height) { retire(nwC); [nwC, nwG] = texCanvas(cv.width, cv.height); }
    const m = ctx.getTransform(), g = nwG;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, nwC.width, nwC.height);
    g.setTransform(m); g.save(); g.beginPath(); g.rect(Math.max(0, sx0), 0, VW, VH); g.clip(); // its world, only where it can show
    if (T.nextDY) g.translate(0, T.nextDY);
    const old = ctx, A = getSet(); ctx = g; putSet(B);
    try { drawWorld(B.theme, camX + (T.nextDX || 0), t); } finally { putSet(A); ctx = old; }
    g.restore();
    g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(maskFor(kind, T), L + MX0 - camX, 0, MX1 - MX0, VH); g.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(nwC, 0, 0); ctx.restore();
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
    if (T.next !== false) drawNext(k, T, L, t);
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
