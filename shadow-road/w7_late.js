'use strict';
// ======================================================================================================
// REBMA'S RELIC, AND ITS ENDING (world 7 of eight, stage index 6: data_w7.js, art_w7.js)
// ------------------------------------------------------------------------------------------------------
// THE PEARL OF JUDGEMENT. When the King in the Glass breaks, the Pearl falls out of his crown onto the Pattern of Rebma
// (save.w7relic, set as he falls: art_w7.js). It is the sea's reflection of the Jewel of Judgement, which commands the
// weather; this commands the tide, and it goes with Corwin into every world afterward, whatever he fights with:
//   UNDERTOW      every dodge leaves a whirlpool where he stood: it drags foes in and grinds at them
//   THE SPLASH    every foe that falls bursts in a crown of seawater that strikes the foes round it and pushes them
//                 back a little; a foe the splash kills splashes too, but the chain stops two splashes deep
// In New Game+ it is far stronger: wider and longer whirlpools that grind harder, and wider splashes that hit harder.
// It shows on the weapon card (a black pearl, its ring filling as the next whirlpool gathers), in the forge, and at the
// head of the move list.
// Test: in the console, w7relic() gives it (w7relic(false) takes it away).
//
// THE ENDING. The Pearl lies on the Pattern; he takes it up. Then, painted: he walks the Pattern of Rebma forward, the way
// it was laid, as once he walked it to win back his memory, carrying the Pearl (as the Jewel is attuned, by walking the
// Pattern with it), and the reversed Pattern burns blue behind him; Queen Moire on her throne of nacre bids him keep it;
// and at dawn he climbs Faiella-bionin up out of the sea, with Amber on Kolvir above the water and Rebma in it below,
// each the other's reflection, the right way round. A few lines, the credits, and the win card (ui.js, from the card's words).
// ======================================================================================================
(() => {
  if (!window.W7) { console.error('w7_late.js: art_w7.js missing'); return; }
  const cl01 = (k) => clamp(k, 0, 1), sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const has = () => !!(typeof save !== 'undefined' && save && save.w7relic);
  const PW = () => (save.cycle > 0 ? 1.6 + .25 * Math.min(3, save.cycle - 1) : 1); // how strongly the tide answers: far more in New Game+
  const bub = (x, y, z, n, sp) => { if (W7.bubbles) W7.bubbles(x, y, z, n, sp); };
  window.w7relic = (on = true) => { save.w7relic = !!on; if (typeof persist === 'function') persist(); if (typeof refreshHud === 'function' && P) refreshHud(true); return on ? 'the Pearl of Judgement is yours' : 'the Pearl is put away'; };

  // ======================================================================================================
  // THE RELIC
  // ======================================================================================================
  const R = W7.R = { pools: [], splashes: [], poolCd: 0 };
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter');
  const POOL_CD = .8;
  // UNDERTOW: every dodge leaves a whirlpool where he stood
  { const _sd = startDodge; startDodge = function () { const x = P.x, y = P.y; _sd();
    if (has() && P.state === 'dodge' && R.poolCd <= 0) { const k = PW(); R.poolCd = POOL_CD; R.pools.push({ x, y, t: 0, max: .9 + .55 * k, r: 54 * Math.sqrt(k), tick: 0 }); sfx('hit-goo', .4); bub(x, y, 10, 8, 50); } }; }
  // THE SPLASH: whatever falls bursts in a crown of seawater that strikes everything near it and pushes it back a little.
  // A foe the splash kills splashes in its turn, but only twice over (so a crowd can go up in a chain, never a whole road)
  const SPLASH_DEPTH = 2;
  function splash(e, dir, depth) {
    const k = PW(), r = 80 * Math.sqrt(k), wl = (save.wl && save.wl[P.w]) || 1, dmg = Math.round((8 + 3 * wl + Math.min(60, e.maxHp * .1)) * k * (depth ? .8 : 1));
    const S = { x: e.x, y: e.y, z: Math.max(0, e.z || 0), t: 0, max: 1.1, r, seed: Math.random() * 9 };
    R.splashes.push(S); if (R.splashes.length > 14) R.splashes.shift();
    for (let i = 0, n = CROWD ? 6 : 12; i < n && parts.length < 420; i++) { const a = rand(0, TAU), sp = rand(30, 110), life = rand(.9, 1.3); // drops flung up out of it, raining back down
      parts.push({ x: S.x + Math.cos(a) * 8, y: S.y + Math.sin(a) * 3, z: S.z + rand(20, 50), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .3, vz: rand(240, 400), life, max: life, col: pick(['rgba(220,250,245,.9)', 'rgba(160,225,220,.85)', '#FFFFFF']), size: rand(1.6, 2.8), shape: 'puff', rot: 0, vr: 0 }); }
    sfx('hit-goo', .7); if (sfxOn && actx) noise(.25, .06, 1600);
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), v = rand(80, 200); parts.push({ x: e.x, y: e.y + rand(-4, 4), z: S.z + rand(4, 20), vx: Math.cos(a) * v, vy: Math.sin(a) * v * .25, vz: rand(140, 300), life: .9, max: .9, col: pick(['#BFE6E0', '#E8FAF6', '#6AB0B0']), size: rand(1.6, 3.2), shape: 'blob', rot: 0, vr: 0 }); }
    bub(e.x, e.y, S.z + 10, 8, 70);
    for (const o of foes()) { if (o === e || Math.hypot(o.x - e.x, (o.y - e.y) * 2) > r + o.hw || o.z > 90) continue;
      const d = Math.max(1, Math.round(dmg * (o.boss ? .4 : 1))), dr = Math.sign(o.x - e.x) || dir || 1;
      strike(o, d, dr, { dmg: d, kb: 140, launch: 0, power: 1, el: 1, w7splash: depth + 1 }); }
  }
  { const _kill = killEnemy; killEnemy = function (e, dir, m) { const was = e.dead; _kill(e, dir, m);
    if (!was && e.dead && has() && mode === 'play') { const depth = (m && m.w7splash) || 0; if (depth <= SPLASH_DEPTH) splash(e, dir, depth); } }; }
  // the undertow's grind: a plain tick of damage, a white number and a flinch of light; never a critical, never boosted by
  // powers or cards, and no hit freeze or shake (it ticks on every foe in it, all the time)
  function poolTick(e, d, dir) {
    if (e.dead || d <= 0) return;
    e.hp -= d; e.flash = .06; floatText(e.x, e.y, e.z + e.hh + 8, String(d), '#FFFFFF', 12);
    if (e.hp <= 0) killEnemy(e, dir, { el: 1 });
  }
  { const _up = updatePlayer; updatePlayer = function (dt) {
    _up(dt);
    R.poolCd = Math.max(0, R.poolCd - dt);
    if (R.stage !== stage) { R.stage = stage; R.pools = []; R.splashes = []; }
    const k = PW();
    for (const p of R.pools) { p.t += dt; p.tick -= dt;
      for (const e of foes()) { if (e.boss) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy * 2); if (d < p.r * 1.9 && d > 6) { e.x += dx / d * 110 * k * dt; e.y += dy / Math.max(1, Math.abs(dy)) * Math.min(Math.abs(dy), 40 * dt); } }
      if (p.tick <= 0) { p.tick = .35; for (const e of foes()) if (Math.hypot(e.x - p.x, (e.y - p.y) * 2) < p.r + e.hw && e.z < 40) { const d = Math.round((4 + 1.5 * (save.wl[P.w] || 1)) * k); poolTick(e, d, Math.sign(e.x - p.x) || 1); } }
      if (Math.random() < dt * 20) bub(p.x + rand(-p.r, p.r) * .6, p.y, 4, 1, 20); }
    R.pools = R.pools.filter(p => p.t < p.max);
    for (const S of R.splashes) S.t += dt;
    R.splashes = R.splashes.filter(S => S.t < S.max);
  }; }
  function drawPool(p, t) { const a = Math.min(1, p.t / .15, (p.max - p.t) / .3); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const r = p.r * (.3 + i * .18), s = t * (5 - i * .6); ctx.strokeStyle = `rgba(190,250,240,${.35 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r / 2.4, 0, s, s + 3.6); ctx.stroke(); }
    ctx.fillStyle = `rgba(30,90,110,${.25 * a})`; ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * .5, p.r * .2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  // the splash, painted: a crown of seawater thrown up round where it fell, its spikes rising and falling back, a ring of
  // foam running out over the floor to the edge of what it struck
  function drawSplash(S, t) {
    const u = S.t / S.max, rise = u < .28 ? Math.sin(u / .28 * Math.PI / 2) : Math.max(0, 1 - Math.pow((u - .28) / .72, 1.6)), y = S.y - S.z; // (up fast, hangs, then falls back)
    ctx.save();
    const rr = S.r * Math.min(1, u * 2.4), fa = 1 - u;
    ctx.fillStyle = `rgba(40,110,120,${.22 * fa})`; ctx.beginPath(); ctx.ellipse(S.x, S.y, rr, rr / 2.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(235,255,250,${.85 * fa})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(S.x, S.y, rr, rr / 2.4, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(150,220,215,${.6 * fa})`; ctx.beginPath(); ctx.ellipse(S.x, S.y, rr * .7, rr * .7 / 2.4, 0, 0, TAU); ctx.stroke();
    const n = 13, cr = 14 + 18 * Math.min(1, u * 2);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + S.seed, back = Math.sin(a) < 0, bx = S.x + Math.cos(a) * cr, by = y + Math.sin(a) * cr / 2.4, h = (44 + 30 * hsh(i + S.seed)) * rise, lean = Math.cos(a) * 12 * rise;
      ctx.strokeStyle = back ? `rgba(110,180,185,${.8 * fa + .2})` : `rgba(200,245,238,${.9 * fa + .1})`; ctx.lineWidth = 3.2 - (back ? 1 : 0); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + lean * .3, by - h * .6, bx + lean, by - h); ctx.stroke();
      if (h > 4) { ctx.fillStyle = `rgba(250,255,255,${fa})`; ctx.beginPath(); ctx.arc(bx + lean, by - h - 2, 1.8, 0, TAU); ctx.fill(); } }
    { // and a column of seawater shooting up out of the middle of it, white at its head
      const H = 92 * rise, w = 7 * (1 - u * .5), g = ctx.createLinearGradient(0, y, 0, y - H);
      g.addColorStop(0, `rgba(90,170,175,${.75 * fa + .1})`); g.addColorStop(.7, `rgba(190,240,235,${.85 * fa + .1})`); g.addColorStop(1, `rgba(255,255,255,${fa})`);
      if (H > 2) { ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(S.x - w, y); ctx.quadraticCurveTo(S.x - w * .45, y - H * .6, S.x - w * .3, y - H); ctx.lineTo(S.x + w * .3, y - H); ctx.quadraticCurveTo(S.x + w * .45, y - H * .6, S.x + w, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${fa})`; ctx.beginPath(); ctx.ellipse(S.x, y - H - 2, w * .9, w * .6, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const p of R.pools) box(p.x, p.y, 0, p.r + 20, 40); for (const S of R.splashes) box(S.x, S.y, 0, S.r + 20, 130); }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const p of R.pools) list.push([p.y - .3, () => onMain(() => drawPool(p, t))]);
    for (const S of R.splashes) list.push([S.y + 8, () => onMain(() => drawSplash(S, t))]); }; }
  W7.splashTest = (e) => splash(e, 1, 0); // (tests)

  // ---------------- where it shows: the weapon card, the forge, the move list ----------------
  function pearlIcon(g, s, k, t) { // the black pearl in a ring of gold, the ring filling as the next whirlpool gathers
    const old = ctx; ctx = g; try { g.clearRect(0, 0, 40, 40); if (W7.drawPearl) { g.save(); g.translate(20, 26); W7.drawPearl(0, 0, 2.1 * s, t, false); g.restore(); }
      g.strokeStyle = 'rgba(30,24,10,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(20, 13.4, 16, 0, TAU); g.stroke();
      g.strokeStyle = k >= 1 ? '#F2D68A' : '#9A7A3A'; g.lineWidth = 2.2; g.beginPath(); g.arc(20, 13.4, 16, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); } finally { ctx = old; }
  }
  let hudCv = null;
  function hudBadge() {
    if (!hudCv) { const card = document.querySelector('.wcard'); if (!card) return; hudCv = document.createElement('canvas'); hudCv.id = 'w7pearlHud'; hudCv.width = 40; hudCv.height = 40; hudCv.title = 'The Pearl of Judgement';
      hudCv.style.cssText = 'position:absolute;right:-12px;top:-10px;width:20px;height:20px;pointer-events:none'; card.appendChild(hudCv); }
    hudCv.hidden = !has(); if (!has()) return;
    pearlIcon(hudCv.getContext('2d'), 1, 1 - R.poolCd / POOL_CD, performance.now() / 1000);
  }
  { const _ht = hudTick; hudTick = function () { _ht(); try { hudBadge(); } catch (e) {} }; }
  const RELIC_TEXT = () => `The sea's reflection of the Jewel of Judgement, out of the King in the Glass. Whatever you fight with: every dodge leaves an undertow that drags foes in and grinds at them, and every foe that falls bursts in a splash of seawater that strikes the foes round it and pushes them back (a splash can set off another, two deep).${save.cycle > 0 ? ' In this cycle the tide runs strong: wider, harder whirlpools and splashes.' : ' In New Game+ it is far stronger.'}`;
  { const _of = openForge; openForge = function (kicker) { _of(kicker);
    let row = document.getElementById('w7relicRow');
    if (!has()) { if (row) row.remove(); return; }
    if (!row) { row = document.createElement('div'); row.id = 'w7relicRow'; row.style.cssText = 'display:flex;gap:10px;align-items:center;margin:10px 0 4px;padding:8px 10px;border:1px solid rgba(200,170,90,.5);border-radius:8px;background:rgba(10,30,40,.55)';
      const cv2 = document.createElement('canvas'); cv2.width = 40; cv2.height = 40; cv2.style.cssText = 'width:34px;height:34px;flex:none'; row.appendChild(cv2);
      const tx = document.createElement('div'); tx.style.cssText = 'font-size:12px;line-height:1.35'; row.appendChild(tx);
      const foot = document.querySelector('#forgeOv .forge-foot'); if (foot && foot.parentNode) foot.parentNode.insertBefore(row, foot); else return; }
    row.lastChild.innerHTML = `<b style="color:#F2D68A">RELIC · THE PEARL OF JUDGEMENT</b><br>${RELIC_TEXT()}`;
    pearlIcon(row.firstChild.getContext('2d'), 1, 1, 0); }; }
  { const _mh = moveListHtml; moveListHtml = function (id) { const s = _mh(id); if (!has()) return s; return `<p class="small" style="margin:0 0 8px"><b style="color:#F2D68A">The Pearl of Judgement</b> · ${RELIC_TEXT()}</p>` + s; }; }

  // ======================================================================================================
  // THE ENDING
  // ======================================================================================================
  let END = null;
  const isMine = () => typeof baseStage !== 'undefined' && baseStage && baseStage.theme === 'rebma' && stageIdx === 6;
  const SECT = [0, 5, 13.5, 20, 27]; // the live hall; the Pattern walked; Moire; the shore at dawn; the credits
  const LINES = {
    a: 'The King broke like glass, and the Pearl of Judgement lay on the Pattern of Rebma, the reversed Pattern turning in it.',
    b: 'So he walked it again, as once he had walked it to win back his memory: forward, the way it was laid, the Pearl in his hand. And the Pattern of Rebma remembered which way it ran.',
    c: '"Keep it, Corwin," said Moire. "The sea has had enough of kings. Take its tides with you, wherever your road goes."',
    d: 'He came up Faiella-bionin into the morning. Above the water Amber stood on Kolvir, and under it Rebma, each the other\'s reflection, the right way round.',
  };
  const CREDITS = [['SHADOW ROAD', 22], ['the road beneath the sea', 9], ['', 8], ['REBMA', 12], ['FAIELLA-BIONIN · THE STREETS OF REBMA · THE PATTERN OF REBMA', 8], ['', 10],
    ['after Roger Zelazny\'s The Chronicles of Amber', 10], ['', 8], ['CORWIN', 11], ['Prince of Amber, who remembers', 8], ['', 6], ['MOIRE', 11], ['Queen of Rebma', 8], ['', 6], ['THE KING IN THE GLASS', 11], ['who had no one left to follow', 8], ['', 6], ['THE SEA-BISHOP', 11], ['who wished only to go back to the sea', 8], ['', 10],
    ['painted in lapis, nacre and gold leaf, under the water', 9], ['', 14], ['Thank you for walking the road.', 12]];
  function wrapRows(s, w) { const rows = []; let row = ''; for (const word of s.split(' ')) { const tr = row ? row + ' ' + word : word; if (ctx.measureText(tr).width > w && row) { rows.push(row); row = word; } else row = tr; } if (row) rows.push(row); return rows; }
  function textPanel(s, x, y, w, a, size = 10, col = '240,246,250') { if (a <= 0) return; ctx.save(); ctx.font = `700 ${size}px Cinzel, Georgia, serif`; ctx.textAlign = 'left'; const rows = wrapRows(s, w);
    ctx.fillStyle = `rgba(4,12,20,${.5 * a})`; rrect(x - 10, y - size - 6, w + 20, rows.length * (size + 5) + 14, 6); ctx.fill();
    rows.forEach((r, i) => { ctx.fillStyle = `rgba(${col},${a})`; ctx.fillText(r, x, y + i * (size + 5)); }); ctx.restore(); }
  function brushOver(soft) { if (!soft) skyWash(0); ctx.save(); ctx.globalAlpha = soft ? .3 : .5; ctx.fillStyle = texPat(ctx, 'brush'); ctx.scale(.5, .5); ctx.fillRect(0, Y_OFF * 2, VW * 2, (VH - Y_OFF) * 2); ctx.restore(); }
  const kit = () => (window.ENDINGS && ENDINGS.kit) || null;
  function hero(x, y, s, facing, state, walk, a = 1) { const K2 = kit(); if (!K2) return; const pose = K2.poseAs(state, walk); K2.inkHero(x, y, s, facing, pose, a, false); }
  // ---------------- B: the Pattern of Rebma from above, as a mosaic; he walks its line, and it lights behind him ----------------
  function panelPattern(T, t) {
    const Y0 = Y_OFF, H = VH - Y0, cx = VW * .36, cy = Y0 + H * .52, Rr = H * .44, u = cl01((T - SECT[1] - .6) / 6.4);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, VW * .7); g.addColorStop(0, '#16284A'); g.addColorStop(1, '#04080E'); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
    for (let i = 0; i < 700; i++) { ctx.fillStyle = hsh(i) < .1 ? 'rgba(200,160,80,.35)' : `rgba(${hsh(i + 1) < .5 ? '40,70,130' : '10,20,40'},.4)`; ctx.fillRect(hsh(i + 2) * VW, Y0 + hsh(i + 3) * H, 2.4, 2.4); } // the floor's tesserae
    const pts = W7.patPts || [], sc = Rr / W7.PAT_R, n = pts.length / 2, idx = Math.floor(u * (n - 1));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(-T * .03); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = (a, b) => { ctx.beginPath(); ctx.moveTo(pts[a * 2], pts[a * 2 + 1]); for (let i = a + 1; i <= b; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1]); };
    ctx.strokeStyle = '#0A1430'; ctx.lineWidth = 12; path(0, n - 1); ctx.stroke(); ctx.strokeStyle = '#1E3A78'; ctx.lineWidth = 7; ctx.stroke();
    if (idx > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(110,150,255,.9)'; ctx.lineWidth = 6; path(0, idx); ctx.stroke(); ctx.strokeStyle = 'rgba(230,240,255,.9)'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.strokeStyle = PAL_GOLD; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, W7.PAT_R + 6, 0, TAU); ctx.stroke();
    const hx = pts[idx * 2], hy = pts[idx * 2 + 1]; ctx.restore();
    const a = -T * .03, px = cx + (hx * Math.cos(a) - hy * Math.sin(a)) * sc, py = cy + (hx * Math.sin(a) + hy * Math.cos(a)) * sc;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const q = (t * 2 + hsh(i)) % 1, ang = hsh(i + 4) * TAU; ctx.fillStyle = `rgba(140,180,255,${.9 * (1 - q)})`; ctx.fillRect(px + Math.cos(ang) * q * 16, py + Math.sin(ang) * q * 16 - q * 6, 1.6, 1.6); } ctx.restore(); // blue sparks round his feet
    ctx.fillStyle = '#0A0A10'; ctx.beginPath(); ctx.arc(px, py, 3.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#C8C8D8'; ctx.beginPath(); ctx.arc(px + 1, py - 1, 1.2, 0, TAU); ctx.fill(); // he, seen from above: a dark cloak, a glint
    if (u >= 1) { const q = cl01((T - SECT[1] - 7) / .8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(cx, cy, 2, cx, cy, Rr * 1.1); gg.addColorStop(0, `rgba(160,190,255,${.45 * q})`); gg.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = gg; ctx.fillRect(cx - Rr * 1.2, cy - Rr * 1.2, Rr * 2.4, Rr * 2.4); ctx.restore(); }
    textPanel(LINES.b, VW * .66, Y0 + H * .3, VW * .3, cl01((T - SECT[1] - .8) / 1) * (1 - cl01((T - SECT[2] + .7) / .6)));
  }
  const PAL_GOLD = '#C89A3A';
  // ---------------- C: Moire on her throne of nacre ----------------
  // She is a painted picture, not drawn here: moire.webp, the Queen cut out with her couch of nacre (1100 x 756, loaded at
  // startup), set into her palace as the picture itself has it, painted here: a colonnade of nacre and glass whose
  // arches open on the sea and the castle on its cliff (moire_sea.webp), a floor of pearl mosaic. She is inked round and graded into its light once, when
  // she loads. Her hair and the loose sea-silk of her gown sway in the current: the picture is cut into a grid of cells
  // (MO_CS px), and each frame the cells holding hair or loose cloth are drawn bent by a smooth field of displacement (a wave
  // running out along the hair from her head, a slower swell through the cloth, her breath at the breast), each cell an affine
  // piece of the field; face, body, limbs and shell are left in one still piece beneath them
  const MO_SRC = 'moire.webp', MO_CS = 28, MO_PAD = 6, MO_W = 1100, MO_H = 756;
  // how much each grid point sways ('.' not at all, a-z hair, A-Z cloth), a row for every MO_CS px down the picture
  // (made from the picture with the hair, sleeve, hem and scarf marked, and her skin held still: change it with the picture)
  const MO_GRID = '.........................................|.........................................|.........................................|.......aba...............................|......dfdb......bb.......................|....ckmjfc.....bdge......................|..bkttqmif......gjmja....................|agsyywspka......anqtnb...................|rxzzzs..b........muwxoa..................|zzzzz.............vyzub..................|zzzzxg.............wyvc..................|zzzi.EB............dhf...................|vtjH.MC..................................|bP....B..................................|ARTM.....................................|.........................................|.........................................|.........................................|........AAAABBBBBBBBBAAA.............FE..|.....CDEEEEEEEEEEEEEEEEEDC...........OM..|....BHIIIIIIIIIIIIIIIIIIIHE..........SR..|..AAGMNNNNNNNNNNNNNNNNNNNMLE.........BD..|IJKKNRRRRRRRRRRRRRRRRRRRRRRLA............|MMMMTVVVVVVVVVVVVVVVVVVVVVVRC............|MMMMUYYYYYYYYYYYYYYYYYYYYYYVF............|MMMMSZZZZZZZZZZZZZZZZZZZZZZXI............|MMMMOZZZZZZZZZZZZZZZZZZZZZZYL............|MMMMMYZZZZZZZZZZZZZZZZZZZZZZNA...........';
  const MO = W7.moire = { ok: false, failed: false, S: null, B: null, cells: null, bg: null, bgKey: '' };
  { const im = new Image(); im.onload = () => { const go = () => { try { moirePrep(im); } catch (e) { MO.failed = true; console.warn('moire.webp', e); } }; if (im.decode) im.decode().then(go, go); else go(); };
    im.onerror = () => { MO.failed = true; }; im.src = MO_SRC; }
  function moirePrep(im) {
    const IW = im.naturalWidth, IH = im.naturalHeight, P = MO_PAD, CW = IW + P * 2, CH = IH + P * 2, [S, g] = texCanvas(CW, CH);
    { const [sil, sg] = texCanvas(CW, CH); sg.drawImage(im, P, P); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#071216'; sg.fillRect(0, 0, CW, CH);
      g.globalAlpha = .85; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.drawImage(sil, Math.cos(a) * 2.6, Math.sin(a) * 2.6); } g.globalAlpha = 1; retire(sil);
      g.clearRect(0, 0, CW, P + 90 * IW / MO_W); } // an ink line round her, as round everything painted here (but not where her shell fades out at the top)
    g.drawImage(im, P, P);
    // graded into the hall's light: the deep's blue-green over all, deeper below, a little warmth where the light from the surface falls
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, 'rgba(30,96,116,.10)'); gr.addColorStop(.6, 'rgba(14,52,84,.17)'); gr.addColorStop(1, 'rgba(6,20,38,.38)'); g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
    const gl = g.createRadialGradient(CW * .62, 0, 10, CW * .62, 0, CW * .62); gl.addColorStop(0, 'rgba(255,224,160,.12)'); gl.addColorStop(1, 'rgba(255,224,160,0)'); g.fillStyle = gl; g.fillRect(0, 0, CW, CH);
    g.globalAlpha = .2; g.fillStyle = texPat(g, 'brush'); g.fillRect(0, 0, CW, CH); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // the grid, and what sways at each of its points
    const rows = MO_GRID.split('|'), nx = rows[0].length, ny = rows.length, q = IW / MO_W, n = nx * ny;
    const U = new Float32Array(n), V = new Float32Array(n), wh = new Float32Array(n), wc = new Float32Array(n), wb = new Float32Array(n), ph = new Float32Array(n);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, c = rows[j].charCodeAt(i) || 46, u = Math.min(i * MO_CS * q, IW), v = Math.min(j * MO_CS * q, IH);
      U[k] = u; V[k] = v; if (c >= 97) wh[k] = (c - 96) / 26; else if (c >= 65 && c <= 90) wc[k] = (c - 64) / 26;
      const bx = (u / q - 318) / 92, by = (v / q - 290) / 64; wb[k] = Math.max(0, 1 - bx * bx - by * by) ** 2; // her breast, rising and falling
      ph[k] = wh[k] ? Math.hypot(u / q - 345, (v / q - 70) * 1.1) * .016 : v / q * .011 - u / q * .006; } // the wave runs out along her hair from her head; down and across the cloth
    // the still picture has the swaying cells cut out of it; they are drawn bent over the holes
    const [B, bgc] = texCanvas(CW, CH); bgc.drawImage(S, 0, 0); const cells = [], moving = (i, j) => { const k = j * nx + i; return [k, k + 1, k + nx, k + nx + 1].some(m => wh[m] || wc[m] || wb[m] > .002); };
    const cell = (i, j, di, dj) => { const k = j * nx + i, kr = k + di, kb = k + dj * nx, sx = P + U[k], sy = P + V[k], cw = U[kr] - U[k], ch = V[kb] - V[k]; if (cw < 1 || ch < 1) return; cells.push(sx, sy, cw, ch, k, kr, kb); bgc.clearRect(sx, sy, cw, ch); };
    for (let j = 0; j < ny - 1; j += 2) for (let i = 0; i < nx - 1; i += 2) { // cells in fours where only the cloth's broad swell moves them, one by one where hair does
      const sub = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]].filter(([a, b]) => a < nx - 1 && b < ny - 1);
      let big = sub.length === 4 && sub.every(([a, b]) => moving(a, b)); for (let b = j; big && b <= j + 2; b++) for (let a = i; a <= i + 2; a++) if (wh[b * nx + a]) big = false;
      if (big) cell(i, j, 2, 2); else for (const [a, b] of sub) if (moving(a, b)) cell(a, b, 1, 1); }
    for (const c of [S, B]) { const fg = c.getContext('2d'), gr = fg.createLinearGradient(P, 0, P + 40 * q, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); fg.globalCompositeOperation = 'destination-out'; fg.fillStyle = gr; fg.fillRect(0, P + 250 * q, P + 40 * q + 1, CH); fg.globalCompositeOperation = 'source-over'; } // the picture is cut off at its left edge (her right, once she is turned about): it fades there, into the shadow behind her post
    Object.assign(MO, { S, B, cells, nx, U, V, wh, wc, wb, ph, IW, IH, VX: new Float32Array(n), VY: new Float32Array(n), draw: moireDraw, ok: true }); // (draw: for timing it in tests)
  }
  // the picture with its top left at (x0, y0), s world units to each of its pixels
  function moireDraw(x0, y0, s, t) {
    const M = MO, P = MO_PAD, n = M.U.length, VX = M.VX, VY = M.VY, U = M.U, V = M.V, IH = M.IH, q = M.IW / MO_W;
    const surge = (Math.sin(t * .37) * .6 + Math.sin(t * .23 + 1) * .4) * q; // the current's slow swell
    for (let k = 0; k < n; k++) { let dx = 0, dy = 0; const h = M.wh[k], c = M.wc[k], b = M.wb[k];
      if (h) { const a = t * .85 - M.ph[k]; dx += h * ((7.5 * Math.sin(a) + 2.4 * Math.sin(a * 1.7 + 1.3)) * q + 4.5 * surge); dy += h * 4 * q * Math.cos(a * .8 + .5); }
      if (c) { const a = t * .7 - M.ph[k]; dx += c * ((6.5 * Math.sin(a) + 1.8 * Math.sin(t * 1.3 + U[k] * .03)) * q + 3 * surge); dy += c * 3 * q * Math.cos(a * 1.1) * cl01((IH - V[k]) / (60 * q)); } // (the hem stays down at the frame)
      if (b) dy -= b * 1.3 * q * (.5 + .5 * Math.sin(t * 1.25));
      VX[k] = x0 + (P + U[k] + dx) * s; VY[k] = y0 + (P + V[k] + dy) * s; }
    ctx.drawImage(M.B, x0, y0, M.B.width * s, M.B.height * s);
    const T0 = ctx.getTransform(), ma = T0.a, mb = T0.b, mc = T0.c, md = T0.d, me = T0.e, mf = T0.f, C = M.cells, S = M.S;
    for (let i = 0; i < C.length; i += 7) { const sx = C[i], sy = C[i + 1], cw = C[i + 2], ch = C[i + 3], k = C[i + 4], kr = C[i + 5], kb = C[i + 6];
      const x = VX[k], y = VY[k], ax = (VX[kr] - x) / cw, ay = (VY[kr] - y) / cw, bx = (VX[kb] - x) / ch, by = (VY[kb] - y) / ch, ex = x - ax * sx - bx * sy, ey = y - ay * sx - by * sy;
      ctx.setTransform(ma * ax + mc * ay, mb * ax + md * ay, ma * bx + mc * by, mb * bx + md * by, ma * ex + mc * ey + me, mb * ex + md * ey + mf);
      ctx.drawImage(S, sx - 2, sy - 2, cw + 4, ch + 4, sx - 2, sy - 2, cw + 4, ch + 4); } // each two pixels larger all round, so no seam opens between them
    ctx.setTransform(T0);
  }
  // where things stand in the panel: she sits at the back of the hall, on her couch of nacre, set on a dais of sea-green
  // stone at the head of a short flight of steps, in a niche whose half-dome is a scallop shell; the picture is turned
  // about, so that she looks across at Corwin, who stands on the floor at the left. Behind her the colonnade of her
  // palace, its arches open on the sea and the drowned towers of the mirror city
  function moireLay() {
    const Y0 = Y_OFF, H = VH - Y0;
    // where she sat when she filled the panel: the words and Corwin still keep to it
    const sOld = Math.min((H + 6) * .86 / MO_H, VW * .64 / 1072), xOld = Math.max(VW - 1072 * sOld - 8, VW * .34);
    const s = Math.min(H * .6 / MO_H, VW * .42 / MO_W), iw = MO_W * s, ih = MO_H * s, cx = Math.min(VW * .655, VW - iw * .5 - 40), x0 = cx - iw / 2;
    const dT = Y0 + H * .69, N = 4, r = H * .03, tr = H * .012, pw = Math.max(10, iw * .05);
    return { Y0, H, s, iw, ih, cx, x0, y0: dT + 3 - (MO_H + MO_PAD) * s, iy: dT + 3 - ih, dT, N, r, tr, dW: iw * 1.1, dB: dT + (N + 1) * r + tr, sW: iw * .6, pw,
      pR: x0 + iw - pw * .35, pL: x0 - pw * .25, pTop: dT + 3 - ih * .67,
      wall: Y0 + H * .6, fl: Y0 + H * .92, apex: Y0 + H * .1, spring: Y0 + H * .27, sill: Y0 + H * .5, bw: Math.max(80, Math.min(112, H * .31)), aw: iw * .6, aSpring: Y0 + H * .37, aR: H * .3,
      textW: Math.max(150, Math.min(VW * .36, xOld + 30 - VW * .045)), hx: Math.max(VW * .13, xOld * .46) };
  }
  // the sea seen through the arches (moire_sea.webp: the castle on its cliff, cut from her picture's own window), the
  // hall behind her, and what stands in front of her (the dais's face, the steps, the two posts with their pearls), each
  // painted once into its own canvas; the light, the caustics, the fish and the motes go between them, live
  { const im = new Image(); im.onload = () => { MO.sea = im; MO.bgKey = ''; }; im.src = 'moire_sea.webp'; }
  const MO_INK = '#0A1A22';
  function moireArch(g, x, w, L) { const y0 = L.Y0, sp = L.spring - y0, ap = L.apex - y0, sl = L.sill - y0, r = w / 2; // a pointed arch, its opening
    g.beginPath(); g.moveTo(x - r, sl); g.lineTo(x - r, sp); g.quadraticCurveTo(x - r, ap + (sp - ap) * .25, x, ap); g.quadraticCurveTo(x + r, ap + (sp - ap) * .25, x + r, sp); g.lineTo(x + r, sl); g.closePath(); }
  // the arches either side of her niche, and the columns between them
  function moireBays(L) { const out = []; for (let j = 0; j < 12; j++) for (const d of [-1, 1]) { const x = L.cx + d * (L.aw + 14 + L.bw * (.5 + j)); if (x > -L.bw && x < VW + L.bw) out.push(x); } return out; }
  function moireCols(L) { const out = []; for (let j = 0; j < 12; j++) for (const d of [-1, 1]) { const x = L.cx + d * (L.aw + 14 + L.bw * j); if (x > -L.bw && x < VW + L.bw) out.push(x); } return out; }
  // a shaft of glass and pearl, lit from the upper right (where the light comes down), its edge caught by it
  function moireShaft(g, x, w, top, bot, rnd, dk = 0) {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, dk ? '#0E2028' : '#3A5664'); gr.addColorStop(.35, dk ? '#22404A' : '#9CB6C2'); gr.addColorStop(.7, dk ? '#36606A' : '#E4EEF2'); gr.addColorStop(.86, dk ? '#1A3640' : '#A6C0CA'); gr.addColorStop(1, dk ? '#0A1820' : '#4A6878');
    g.fillStyle = gr; g.fillRect(x - w / 2, top, w, bot - top);
    if (!dk) for (let y = top; y < bot; y += 2.6) if (rnd() < .3) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.45)' : 'rgba(200,170,230,.35)'; g.fillRect(x - w / 2 + rnd() * w, y, 1.4, 1.4); } // glints of nacre in the glass
    g.strokeStyle = dk ? 'rgba(0,0,0,.4)' : 'rgba(10,26,34,.4)'; g.lineWidth = .7; for (const f of [-.25, 0, .25]) { g.beginPath(); g.moveTo(x + f * w, top); g.lineTo(x + f * w, bot); g.stroke(); } // fluting
    g.fillStyle = dk ? 'rgba(150,220,215,.35)' : 'rgba(255,255,255,.55)'; g.fillRect(x + w / 2 - 1.6, top, 1, bot - top); // the rim light
    g.strokeStyle = MO_INK; g.lineWidth = 1; g.strokeRect(x - w / 2, top, w, bot - top);
  }
  // a tower of the drowned city: a shaft in tiers, crowned with a spire, a dome or a turret, a few windows lit
  function moireTower(g, x, base, w, h, rnd, col, lit) {
    g.fillStyle = col; const tiers = 2 + (rnd() * 3 | 0); let y = base, ww = w;
    for (let i = 0; i < tiers; i++) { const th = h / tiers * (1 - i * .1); g.fillStyle = col; g.fillRect(x - ww / 2, y - th, ww, th + .6);
      if (lit) for (let k = 0; k < 4; k++) if (rnd() < .45) { g.fillStyle = lit; g.fillRect(x - ww / 2 + 1 + rnd() * Math.max(1, ww - 3), y - th + 2 + rnd() * Math.max(1, th - 5), 1, 1.8); }
      g.fillStyle = col; y -= th; g.fillRect(x - ww * .62, y - 1.2, ww * 1.24, 1.4); ww *= .74; }
    const k = rnd(); g.beginPath();
    if (k < .5) { g.moveTo(x - ww / 2, y); g.lineTo(x, y - h * (.3 + rnd() * .35)); g.lineTo(x + ww / 2, y); }
    else if (k < .8) { g.moveTo(x - ww / 2, y); g.quadraticCurveTo(x - ww * .75, y - ww * .8, x, y - ww * 1.3); g.quadraticCurveTo(x + ww * .75, y - ww * .8, x + ww / 2, y); }
    else { g.rect(x - ww * .62, y - ww * .55, ww * 1.24, ww * .55); for (let i = 0; i < 3; i++) g.rect(x - ww * .62 + i * ww * .5, y - ww * .85, ww * .24, ww * .3); }
    g.fill();
  }
  function moireCity(v, L, rnd) {
    const H = L.H, sl = L.sill - L.Y0;
    // the water: lit from the surface above, deep blue below
    { const gr = v.createLinearGradient(0, 0, 0, sl); gr.addColorStop(0, '#86D2D8'); gr.addColorStop(.22, '#4AA2B4'); gr.addColorStop(.55, '#22667E'); gr.addColorStop(1, '#0E3246'); v.fillStyle = gr; v.fillRect(0, 0, VW, sl + 6); }
    { const gr = v.createRadialGradient(L.cx + H * .3, -H * .1, 4, L.cx + H * .3, -H * .1, VW * .7); gr.addColorStop(0, 'rgba(255,246,214,.35)'); gr.addColorStop(1, 'rgba(255,246,214,0)'); v.fillStyle = gr; v.fillRect(0, 0, VW, sl); } // where the sun stands over the water
    // the mirror city's reflection hanging in the surface (as Rebma is Amber's), faint, and then the city itself in three
    // ranks, each nearer one darker and sharper, the deep's haze between them
    const ranks = [[sl * .9, .22, .44, '#5AA6B8', null, .9], [sl * .97, .16, .34, '#3B7E94', null, 1.2], [sl + 3, .1, .26, '#1C4C60', 'rgba(255,226,160,.75)', 1.6]];
    v.save(); v.globalAlpha = .18; v.translate(0, sl * .52); v.scale(1, -.5); for (let x = -10; x < VW + 20; x += 18 + rnd() * 26) moireTower(v, x, 0, 6 + rnd() * 8, H * (.1 + rnd() * .16), rnd, '#BFE8EC'); v.restore();
    ranks.forEach(([base, h0, h1, col, lit, wk], ri) => {
      v.fillStyle = col; v.beginPath(); v.moveTo(0, sl + 6); for (let i = 0; i <= 14; i++) v.lineTo(i / 14 * VW, base - (.02 + rnd() * .05) * H); v.lineTo(VW, sl + 6); v.closePath(); v.fill(); // the sea floor's ridge it stands on
      for (let x = -12 + rnd() * 10; x < VW + 20; x += (16 + rnd() * 28) * wk) moireTower(v, x, base - .02 * H, (5 + rnd() * 13) * wk, H * (h0 + rnd() * (h1 - h0)) * (.7 + .3 * wk), rnd, col, lit);
      if (ri === 1 && MO.sea) { const h = H * .5, w = h * MO.sea.width / MO.sea.height; v.save(); v.globalAlpha = .9; v.drawImage(MO.sea, VW * .9 - w / 2, sl - h + 4, w, h); v.drawImage(MO.sea, VW * .12 - w / 2, sl - h * .8 + 4, w * .8, h * .8); v.restore(); }
      const hz = v.createLinearGradient(0, sl * .2, 0, sl); hz.addColorStop(0, 'rgba(60,140,160,0)'); hz.addColorStop(1, `rgba(40,110,132,${.35 - ri * .1})`); v.fillStyle = hz; v.fillRect(0, 0, VW, sl + 6); }); // the haze before it
    v.save(); v.globalAlpha = .14; v.fillStyle = texPat(v, 'sky'); v.fillRect(0, 0, VW, sl); v.restore();
  }
  // the half-dome of her niche: a scallop shell, its flutes of nacre radiating from the hinge, each tinted as nacre is
  function moireScallop(g, L, rnd) {
    const cx = L.cx, sp = L.aSpring - L.Y0, aw = L.aw, aR = L.aR, M = 11, pt = (a, f = 1) => [cx + Math.cos(a) * aw * f, sp + Math.sin(a) * aR * f];
    const tint = ['rgba(255,190,225,.22)', 'rgba(150,240,226,.22)', 'rgba(255,226,160,.18)', 'rgba(180,180,255,.2)'];
    for (let i = 0; i < M; i++) { const a0 = Math.PI + i / M * Math.PI, a1 = Math.PI + (i + 1) / M * Math.PI, am = (a0 + a1) / 2, [x0, y0] = pt(a0), [x1, y1] = pt(a1), [xm, ym] = pt(am, 1.07);
      g.beginPath(); g.moveTo(cx, sp); g.lineTo(x0, y0); g.quadraticCurveTo(xm, ym, x1, y1); g.closePath();
      const [lx, ly] = pt(a0 + (a1 - a0) * .7, .8), [dx, dy] = pt(a0 + (a1 - a0) * .1, .8), gr = g.createLinearGradient(dx, dy, lx, ly); // each flute rounded: dark in its furrow, bright on its ridge
      gr.addColorStop(0, '#3A4458'); gr.addColorStop(.5, '#B4AEBE'); gr.addColorStop(.78, '#F4EEEA'); gr.addColorStop(1, '#9A92A6'); g.fillStyle = gr; g.fill();
      g.fillStyle = tint[i % 4]; g.fill();
      const rg = g.createRadialGradient(cx, sp, 2, cx, sp, aw); rg.addColorStop(0, 'rgba(8,24,32,.6)'); rg.addColorStop(.4, 'rgba(8,24,32,.18)'); rg.addColorStop(1, 'rgba(8,24,32,0)'); g.fillStyle = rg; g.fill(); // darker in toward the hinge
      g.strokeStyle = 'rgba(10,26,34,.7)'; g.lineWidth = .8; g.stroke(); }
    g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 900; i++) { const a = Math.PI + rnd() * Math.PI, f = .25 + rnd() * .8, [x, y] = pt(a, f); g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.35)' : rnd() < .5 ? 'rgba(220,170,240,.3)' : 'rgba(140,230,220,.3)'; g.fillRect(x, y, 1.3, 1.3); } g.restore(); // nacre's glitter
    g.beginPath(); for (let i = 0; i <= M; i++) { const a0 = Math.PI + (i - 1) / M * Math.PI, a1 = Math.PI + i / M * Math.PI, [x1, y1] = pt(a1); if (!i) { g.moveTo(x1, y1); continue; } const [xm, ym] = pt((a0 + a1) / 2, 1.07); g.quadraticCurveTo(xm, ym, x1, y1); }
    g.strokeStyle = PAL_GOLD; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = 'rgba(255,236,190,.7)'; g.lineWidth = .8; g.stroke(); // its gilded edge
    g.fillStyle = '#C8D8E0'; g.beginPath(); g.ellipse(cx, sp, aw * .12, aR * .07, 0, Math.PI, 0); g.fill(); g.strokeStyle = MO_INK; g.lineWidth = 1; g.stroke(); // the hinge
  }
  function moireHall(L) {
    const key = [VW, K, L.H, L.cx.toFixed(1), !!MO.sea].join(); if (MO.bg && MO.bgKey === key) return MO.bg;
    if (MO.bg) for (const c of Object.values(MO.bg)) if (c && c.getContext) retire(c);
    const H = L.H, Y0 = L.Y0, W = Math.ceil(VW * K), Hh = Math.ceil(H * K), rnd = mulberry(77), wall = L.wall - Y0, sl = L.sill - Y0, bays = moireBays(L), ow = L.bw * .74, cx = L.cx;
    const dT = L.dT - Y0, dB = L.dB - Y0, x0 = L.x0, iw = L.iw, aw = L.aw, asp = L.aSpring - Y0, aR = L.aR;
    // ---- the sea and the drowned city
    const [vc, v] = texCanvas(W, Hh); v.scale(K, K); moireCity(v, L, rnd);
    // ---- the hall: a wall of nacre mosaic, the arches cut through it, slender columns of glass and pearl between them
    const [wc, g] = texCanvas(W, Hh); g.scale(K, K);
    { const gr = g.createLinearGradient(0, 0, 0, wall); gr.addColorStop(0, '#16242E'); gr.addColorStop(.45, '#3A5260'); gr.addColorStop(1, '#22364A'); g.fillStyle = gr; g.fillRect(0, 0, VW, wall + 1); }
    for (let y = 0; y < wall; y += 3.2) for (let x = (y / 3.2 % 2) * 1.6; x < VW; x += 3.2) { const k = rnd(); if (k > .55) continue; g.fillStyle = k < .05 ? 'rgba(240,248,255,.45)' : k < .12 ? 'rgba(200,170,230,.22)' : k < .2 ? 'rgba(150,220,220,.2)' : k < .38 ? 'rgba(170,196,206,.12)' : 'rgba(8,20,30,.18)'; g.fillRect(x, y, 2.6, 2.6); } // its tesserae, some glinting
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; for (const x of bays) { moireArch(g, x, ow, L); g.fill(); } g.restore();
    for (const x of bays) { moireArch(g, x, ow + 8, L); g.strokeStyle = '#A8BECA'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(240,248,252,.75)'; g.lineWidth = 1.2; g.stroke(); moireArch(g, x, ow, L); g.strokeStyle = MO_INK; g.lineWidth = 1.2; g.stroke(); // its moulding, pearl-bright
      moireArch(g, x, ow + 14, L); g.strokeStyle = 'rgba(10,26,34,.55)'; g.lineWidth = .8; g.stroke();
      g.fillStyle = '#9AB2BE'; g.fillRect(x - ow / 2 - 4, sl - 1, ow + 8, 5); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - ow / 2 - 4, sl - 1, ow + 8, 1); g.strokeStyle = MO_INK; g.lineWidth = .8; g.strokeRect(x - ow / 2 - 4, sl - 1, ow + 8, 5); // the sill
      const ty = L.spring - Y0 + (sl - L.spring + Y0) * .5; g.strokeStyle = 'rgba(200,226,236,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - ow / 2, ty); g.lineTo(x + ow / 2, ty); g.moveTo(x, ty); g.lineTo(x, sl); g.stroke(); // a glass transom and mullion
      g.strokeStyle = 'rgba(200,226,236,.35)'; g.lineWidth = .9; g.beginPath(); g.arc(x, L.spring - Y0 - ow * .05, ow * .2, 0, TAU); g.stroke(); } // and a rose of tracery in the head
    for (const x of moireCols(L)) { const w = Math.max(9, L.bw * .13); moireShaft(g, x, w, -2, wall, rnd);
      for (const [y, h] of [[L.spring - Y0 - 7, 7], [sl - 2, 5], [wall - 9, 9]]) { g.fillStyle = '#C8D8E0'; g.fillRect(x - w * .85, y, w * 1.7, h); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x - w * .85, y, w * 1.7, 1); g.strokeStyle = MO_INK; g.lineWidth = .9; g.strokeRect(x - w * .85, y, w * 1.7, h); } } // capital, band and base
    // ---- her niche: dark within, so that she shows against it, a glow behind her head, the scallop for its half-dome
    const niche = (f, ex = 0) => { f.beginPath(); f.moveTo(cx - aw - ex, wall); f.lineTo(cx - aw - ex, asp); f.ellipse(cx, asp, aw + ex, aR + ex, 0, Math.PI, 0); f.lineTo(cx + aw + ex, wall); f.closePath(); };
    niche(g, 10); g.fillStyle = '#1C3038'; g.fill();
    niche(g); { const gr = g.createRadialGradient(cx, asp + H * .1, 6, cx, asp + H * .1, aw * 1.3); gr.addColorStop(0, '#2C5A62'); gr.addColorStop(.6, '#16343E'); gr.addColorStop(1, '#0A1A22'); g.fillStyle = gr; g.fill(); }
    g.save(); niche(g); g.clip();
    g.strokeStyle = 'rgba(150,210,210,.08)'; g.lineWidth = 2; for (let x = cx - aw; x < cx + aw; x += 7) { g.beginPath(); g.moveTo(x, asp); g.lineTo(x, wall); g.stroke(); } // the niche's fluting below the shell
    moireScallop(g, L, rnd);
    { const hx = x0 + iw * .66, hy = L.iy - Y0 + L.ih * .2, gr = g.createRadialGradient(hx, hy, 4, hx, hy, aw * .9); gr.addColorStop(0, 'rgba(190,240,230,.35)'); gr.addColorStop(.5, 'rgba(120,200,200,.12)'); gr.addColorStop(1, 'rgba(120,200,200,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(cx - aw, 0, aw * 2, wall); g.globalCompositeOperation = 'source-over'; } // the glow behind her
    g.restore();
    niche(g, 6); g.strokeStyle = '#B4C8D2'; g.lineWidth = 7; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.stroke(); niche(g); g.strokeStyle = MO_INK; g.lineWidth = 1.3; g.stroke(); niche(g, 10); g.strokeStyle = MO_INK; g.lineWidth = 1; g.stroke(); // its archivolt
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + .5) / 9 * Math.PI; g.fillStyle = '#E8EEF2'; g.beginPath(); g.arc(cx + Math.cos(a) * (aw + 6), asp + Math.sin(a) * (aR + 6), 1.8, 0, TAU); g.fill(); g.strokeStyle = MO_INK; g.lineWidth = .6; g.stroke(); } // pearls set in it
    for (const d of [-1, 1]) { const x = cx + d * (aw + 16), w = 11; moireShaft(g, x, w, asp - aR * .55, wall, rnd); g.fillStyle = '#C8D8E0'; g.fillRect(x - w * .8, asp - aR * .55 - 6, w * 1.6, 6); g.strokeStyle = MO_INK; g.lineWidth = .9; g.strokeRect(x - w * .8, asp - aR * .55 - 6, w * 1.6, 6); } // its pilasters
    { const sh = g.createLinearGradient(0, 0, 0, wall); sh.addColorStop(0, 'rgba(4,14,22,.5)'); sh.addColorStop(.35, 'rgba(4,14,22,.08)'); sh.addColorStop(1, 'rgba(4,14,22,.32)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, VW, wall); g.restore(); } // the deep's dimness, heaviest at the vault
    // ---- the floor: polished nacre and sea-green stone in squares, running back to her, the hall glimmering in it
    { const gr = g.createLinearGradient(0, wall, 0, H); gr.addColorStop(0, '#6E8E9C'); gr.addColorStop(.3, '#3E5C6C'); gr.addColorStop(1, '#14242E'); g.fillStyle = gr; g.fillRect(0, wall, VW, H - wall); }
    const vpY = wall - H * .9, xAt = (i, y) => cx + i * L.bw * .3 * (y - vpY) / (wall - vpY), rowY = (j) => wall + (H - wall) * Math.pow(j / 9, 1.55);
    for (let j = 0; j < 9; j++) for (let i = -40; i < 40; i++) { if ((i + j) % 2) continue; const ya = rowY(j), yb = rowY(j + 1); if (xAt(i + 1, yb) < 0 || xAt(i, yb) > VW) continue;
      g.fillStyle = 'rgba(120,190,176,.16)'; g.beginPath(); g.moveTo(xAt(i, ya), ya); g.lineTo(xAt(i + 1, ya), ya); g.lineTo(xAt(i + 1, yb), yb); g.lineTo(xAt(i, yb), yb); g.closePath(); g.fill(); } // the sea-green squares
    g.strokeStyle = 'rgba(8,22,30,.35)'; g.lineWidth = .7; g.beginPath(); for (let j = 1; j <= 9; j++) { const y = rowY(j); g.moveTo(0, y); g.lineTo(VW, y); } for (let i = -40; i <= 40; i++) { if (xAt(i, H) < -40 || xAt(i, H) > VW + 40) continue; g.moveTo(xAt(i, wall), wall); g.lineTo(xAt(i, H), H); } g.stroke();
    g.strokeStyle = 'rgba(230,244,248,.14)'; g.lineWidth = .6; g.beginPath(); for (let j = 1; j <= 9; j++) { const y = rowY(j) + .8; g.moveTo(0, y); g.lineTo(VW, y); } g.stroke(); // each joint's pearl edge
    for (let i = 0; i < 700; i++) { const y = wall + Math.pow(rnd(), 1.3) * (H - wall), x = rnd() * VW; g.fillStyle = rnd() < .5 ? 'rgba(240,248,255,.22)' : 'rgba(200,170,230,.16)'; g.fillRect(x, y, 1.2, 1); } // nacre's glitter in it
    g.save(); g.globalCompositeOperation = 'lighter'; // the hall glimmering in the polished floor: the columns, the arches' light, the glow of her niche
    for (const x of moireCols(L)) { const gr = g.createLinearGradient(0, wall, 0, wall + H * .22); gr.addColorStop(0, 'rgba(180,210,220,.2)'); gr.addColorStop(1, 'rgba(180,210,220,0)'); g.fillStyle = gr; g.fillRect(x - 5, wall, 10, H * .22); }
    for (const x of bays) { const gr = g.createLinearGradient(0, wall, 0, wall + H * .16); gr.addColorStop(0, 'rgba(110,190,200,.16)'); gr.addColorStop(1, 'rgba(110,190,200,0)'); g.fillStyle = gr; g.fillRect(x - ow * .4, wall, ow * .8, H * .16); }
    g.restore();
    g.fillStyle = '#9FB6C2'; g.fillRect(0, wall - 4, VW, 5); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, wall - 4, VW, 1); g.strokeStyle = MO_INK; g.lineWidth = .9; g.beginPath(); g.moveTo(0, wall + 1); g.lineTo(VW, wall + 1); g.stroke(); // the skirting
    // ---- the top of her dais, either side of her couch
    { const yb = dT - H * .05, wb = L.dW * .93; g.beginPath(); g.moveTo(cx - wb / 2, yb); g.lineTo(cx + wb / 2, yb); g.lineTo(cx + L.dW / 2, dT); g.lineTo(cx - L.dW / 2, dT); g.closePath();
      const gr = g.createLinearGradient(0, yb, 0, dT); gr.addColorStop(0, '#5E8E88'); gr.addColorStop(1, '#9CC6BC'); g.fillStyle = gr; g.fill(); g.strokeStyle = MO_INK; g.lineWidth = 1; g.stroke();
      g.strokeStyle = 'rgba(200,154,58,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(cx - wb / 2 + 5, yb + 2.5); g.lineTo(cx + wb / 2 - 5, yb + 2.5); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .28; g.fillStyle = texPat(g, 'brush'); g.fillRect(0, 0, VW, H); g.restore();
    // ---- in front of her: the face of the dais, the flight of steps, the two posts with their pearls
    const [fc, f] = texCanvas(W, Hh); f.scale(K, K);
    const marble = (x, y, w, h, c0, c1) => { const gr = f.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c0); gr.addColorStop(1, c1); f.fillStyle = gr; f.fillRect(x, y, w, h);
      f.save(); f.beginPath(); f.rect(x, y, w, h); f.clip(); f.lineWidth = .6; for (let i = 0; i < Math.max(2, w / 22); i++) { const sx = x + rnd() * w; f.strokeStyle = rnd() < .6 ? 'rgba(220,250,240,.2)' : 'rgba(6,24,24,.3)'; f.beginPath(); f.moveTo(sx, y - 2); f.bezierCurveTo(sx + (rnd() - .5) * 30, y + h * .3, sx + (rnd() - .5) * 30, y + h * .7, sx + (rnd() - .5) * 40, y + h + 2); f.stroke(); } f.restore(); }; // sea-green stone, veined
    { const x = cx - L.dW / 2, w = L.dW, h = dB - dT; marble(x, dT, w, h, '#3E7C72', '#173C3A');
      const fy = dT + 3, fh = Math.min(L.r * .85, 9); f.fillStyle = '#C6D8D6'; f.fillRect(x + 3, fy, w - 6, fh); f.strokeStyle = 'rgba(10,26,34,.8)'; f.lineWidth = .9; f.beginPath(); // a frieze: the running wave, in pearl, on the stone
      for (let wx = x + 5; wx < x + w - 8; wx += fh * 1.4) { f.moveTo(wx, fy + fh * .8); f.quadraticCurveTo(wx + fh * .2, fy + fh * .1, wx + fh * .7, fy + fh * .35); f.quadraticCurveTo(wx + fh * .9, fy + fh * .7, wx + fh * .55, fy + fh * .6); } f.stroke();
      f.strokeStyle = PAL_GOLD; f.lineWidth = .9; f.strokeRect(x + 3, fy, w - 6, fh); f.strokeStyle = MO_INK; f.lineWidth = 1.1; f.strokeRect(x, dT, w, h);
      f.fillStyle = PAL_GOLD; f.fillRect(x, dT, 2.4, h); f.fillRect(x + w - 2.4, dT, 2.4, h); }
    { const x = cx - L.dW / 2 - 2, w = L.dW + 4; f.fillStyle = '#D8E6E8'; f.fillRect(x, dT - 2, w, 4); f.fillStyle = 'rgba(255,255,255,.85)'; f.fillRect(x, dT - 2, w, 1); f.strokeStyle = MO_INK; f.lineWidth = 1; f.strokeRect(x, dT - 2, w, 4); } // the dais's lip of pearl, over the hem of her gown
    { const gr = f.createLinearGradient(0, dB, 0, dB + 6); gr.addColorStop(0, 'rgba(2,10,16,.5)'); gr.addColorStop(1, 'rgba(2,10,16,0)'); f.fillStyle = gr; f.fillRect(cx - L.dW / 2 - 4, dB, L.dW + 8, 6); } // its shadow on the floor
    for (let k = 1, wp = L.sW; k <= L.N; k++) { const w = L.sW * (1 + .07 * k), yt = dT + k * L.r + (k - 1) * L.tr, yr = yt + L.tr; // each step: its tread, flaring a little as it comes forward, then its riser
      f.beginPath(); f.moveTo(cx - wp / 2, yt); f.lineTo(cx + wp / 2, yt); f.lineTo(cx + w / 2, yr); f.lineTo(cx - w / 2, yr); f.closePath(); const gt = f.createLinearGradient(0, yt, 0, yr); gt.addColorStop(0, '#7EA8A0'); gt.addColorStop(1, '#C4DED8'); f.fillStyle = gt; f.fill(); f.strokeStyle = MO_INK; f.lineWidth = .9; f.stroke();
      marble(cx - w / 2, yr, w, L.r, '#4A887E', '#204A46');
      f.fillStyle = 'rgba(255,255,255,.75)'; f.fillRect(cx - w / 2, yr, w, .9); const gs = f.createLinearGradient(0, yr + 1, 0, yr + 4); gs.addColorStop(0, 'rgba(2,12,16,.45)'); gs.addColorStop(1, 'rgba(2,12,16,0)'); f.fillStyle = gs; f.fillRect(cx - w / 2, yr + 1, w, 3); // the nosing's bright edge, its shadow under
      f.strokeStyle = 'rgba(200,154,58,.65)'; f.lineWidth = .7; f.beginPath(); f.moveTo(cx - w / 2 + 3, yr + L.r * .62); f.lineTo(cx + w / 2 - 3, yr + L.r * .62); f.stroke(); // an inlay of gold
      f.strokeStyle = MO_INK; f.lineWidth = 1; f.strokeRect(cx - w / 2, yr, w, L.r); wp = w; }
    { const yb = dT + (L.N + 1) * L.r + L.N * L.tr, w = L.sW * (1 + .07 * L.N), gr = f.createLinearGradient(0, yb, 0, yb + 7); gr.addColorStop(0, 'rgba(2,10,16,.55)'); gr.addColorStop(1, 'rgba(2,10,16,0)'); f.fillStyle = gr; f.fillRect(cx - w / 2 - 3, yb, w + 6, 7); }
    const pTop = L.pTop - Y0, pw = L.pw;
    for (const x of [L.pL, L.pR]) { // the posts at either side of her couch, a pearl on each in a cup of gold
      const bh = pw * .7; marble(x - pw * .78, dT - bh, pw * 1.56, bh + 1, '#5A968A', '#28544E'); f.strokeStyle = MO_INK; f.lineWidth = 1; f.strokeRect(x - pw * .78, dT - bh, pw * 1.56, bh + 1);
      const gr = f.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0); gr.addColorStop(0, '#1C4440'); gr.addColorStop(.4, '#4E8C82'); gr.addColorStop(.72, '#A8D2C8'); gr.addColorStop(.88, '#5E9A90'); gr.addColorStop(1, '#1E4642'); f.fillStyle = gr; f.fillRect(x - pw / 2, pTop, pw, dT - bh - pTop);
      f.strokeStyle = 'rgba(6,24,24,.45)'; f.lineWidth = .7; for (const q of [-.22, 0, .22]) { f.beginPath(); f.moveTo(x + q * pw, pTop + 4); f.lineTo(x + q * pw, dT - bh); f.stroke(); }
      f.fillStyle = 'rgba(230,255,248,.55)'; f.fillRect(x + pw / 2 - 1.8, pTop, 1, dT - bh - pTop); f.strokeStyle = MO_INK; f.lineWidth = 1; f.strokeRect(x - pw / 2, pTop, pw, dT - bh - pTop);
      for (const [y, h] of [[pTop, pw * .3], [pTop + (dT - pTop) * .45, pw * .18], [dT - bh - pw * .2, pw * .2]]) { f.fillStyle = PAL_GOLD; f.fillRect(x - pw * .62, y, pw * 1.24, h); f.fillStyle = 'rgba(255,236,180,.7)'; f.fillRect(x - pw * .62, y, pw * 1.24, .9); f.strokeStyle = MO_INK; f.lineWidth = .8; f.strokeRect(x - pw * .62, y, pw * 1.24, h); } // its gilded bands
      f.fillStyle = PAL_GOLD; f.beginPath(); f.moveTo(x - pw * .7, pTop); f.quadraticCurveTo(x, pTop + pw * .25, x + pw * .7, pTop); f.quadraticCurveTo(x + pw * .6, pTop - pw * .5, x, pTop - pw * .45); f.quadraticCurveTo(x - pw * .6, pTop - pw * .5, x - pw * .7, pTop); f.fill(); f.strokeStyle = MO_INK; f.lineWidth = .9; f.stroke(); // the cup
      const pr = pw * .5, py = pTop - pw * .45 - pr * .7, pg = f.createRadialGradient(x + pr * .35, py - pr * .35, pr * .1, x, py, pr); pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(.35, '#F2E8F0'); pg.addColorStop(.75, '#B8B4D0'); pg.addColorStop(1, '#6E7A94');
      f.fillStyle = pg; f.beginPath(); f.arc(x, py, pr, 0, TAU); f.fill(); f.strokeStyle = MO_INK; f.lineWidth = .9; f.stroke(); }
    // ---- the caustics: one tile of the light's net, made once; and where it may fall (the floor, the dais and the steps)
    const [cc, cg] = texCanvas(W, Hh), [mc, m] = texCanvas(W, Hh); m.scale(K, K); m.fillStyle = '#fff'; m.fillRect(0, wall - 3, VW, H - wall + 3);
    m.globalCompositeOperation = 'destination-out'; m.fillRect(x0, 0, iw, dT - 2); for (const x of [L.pL, L.pR]) m.fillRect(x - pw * .8, pTop - pw * 1.6, pw * 1.6, dT - pTop + pw * 1.6);
    if (!MO.ctile) MO.ctile = moireCausticTile();
    { const gm = m.createLinearGradient(0, wall, 0, H); gm.addColorStop(0, 'rgba(0,0,0,.55)'); gm.addColorStop(.4, 'rgba(0,0,0,0)'); m.fillStyle = gm; m.fillRect(0, wall, VW, H - wall); } // fainter far off
    // ---- the vignette, and a column standing dark in the near water at the right, the light catching its edge
    const [vgc, vg] = texCanvas(W, Hh); vg.scale(K, K);
    { const gr = vg.createRadialGradient(cx * .9, H * .5, H * .3, cx * .9, H * .5, VW * .78); gr.addColorStop(0, 'rgba(2,8,14,0)'); gr.addColorStop(.7, 'rgba(2,8,14,.3)'); gr.addColorStop(1, 'rgba(2,8,14,.62)'); vg.fillStyle = gr; vg.fillRect(0, 0, VW, H);
      const gt = vg.createLinearGradient(0, 0, 0, H * .2); gt.addColorStop(0, 'rgba(2,8,14,.35)'); gt.addColorStop(1, 'rgba(2,8,14,0)'); vg.fillStyle = gt; vg.fillRect(0, 0, VW, H * .2); }
    moireShaft(vg, VW - 6, 26, -4, H + 4, rnd, 1);
    MO.bg = { view: vc, wall: wc, front: fc, cc, cg, mask: mc, vig: vgc, cpat: cg.createPattern(MO.ctile, 'repeat') }; MO.bgKey = key; return MO.bg;
  }
  // the light's net on the sea floor: a tile of it, seamless, its threads where two cells of a (tiled, warped) Voronoi meet
  function moireCausticTile() {
    const N = 128, [c, g] = texCanvas(N, N), id = g.createImageData(N, N), rnd = mulberry(9), P = [];
    for (let i = 0; i < 18; i++) P.push(rnd() * N, rnd() * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x + 3.2 * Math.sin(y / N * TAU * 2 + Math.sin(x / N * TAU) * 1.3), v = y + 3.2 * Math.sin(x / N * TAU * 2 + 1.7);
      let d1 = 1e9, d2 = 1e9; for (let i = 0; i < P.length; i += 2) { let dx = Math.abs(u - P[i]) % N, dy = Math.abs(v - P[i + 1]) % N; if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      const e = Math.sqrt(d2) - Math.sqrt(d1), a = Math.pow(Math.max(0, 1 - e / 5), 3), o = (y * N + x) * 4;
      id.data[o] = 210; id.data[o + 1] = 246; id.data[o + 2] = 238; id.data[o + 3] = a * 255 | 0; }
    g.putImageData(id, 0, 0); return c;
  }
  // the caustics, live: two layers of the net drifting across each other, cut to the floor and the steps
  function moireCaustics(HB, L, t) {
    const g = HB.cg, W = HB.cc.width, Hh = HB.cc.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, Hh); g.fillStyle = HB.cpat;
    for (const [sx, sy, vx, vy, a] of [[.55, .22, 9, 2.5, 1], [.7, .28, -6, 4, .8]]) { g.save(); g.globalAlpha = a; g.scale(K * sx, K * sy); g.translate(t * vx, t * vy + Math.sin(t * .5) * 6); g.fillRect(-t * vx - 140, -t * vy - 140, VW / sx + 280, L.H / sy + 280); g.restore(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(HB.mask, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .17 + .04 * Math.sin(t * .9); ctx.drawImage(HB.cc, 0, L.Y0, VW, L.H); ctx.restore();
  }
  // if the picture could not be had: her empty throne of nacre, lit, on its dais
  function moireFallback(L, t) {
    const x = L.cx, y = L.dT - 2, r = L.H * .26;
    ctx.save(); ctx.fillStyle = '#E6DCD4'; ctx.beginPath(); ctx.moveTo(x - r, y); for (let k = 0; k <= 7; k++) { const a = Math.PI + k / 7 * Math.PI; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAL_GOLD; ctx.lineWidth = 3; ctx.stroke(); for (let k = 1; k < 7; k++) { const a = Math.PI + k / 7 * Math.PI; ctx.strokeStyle = k % 2 ? 'rgba(170,150,190,.6)' : 'rgba(150,200,190,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * 1.05); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(x, y - r * .4, 0, x, y - r * .4, r); gg.addColorStop(0, `rgba(236,232,246,${.2 + .05 * Math.sin(t * 1.3)})`); gg.addColorStop(1, 'rgba(236,232,246,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r * 1.4, r * 2, r * 2);
    ctx.restore();
  }
  function panelMoire(T, t) {
    const L = moireLay(), Y0 = L.Y0, H = L.H, fl = L.fl;
    const HB = moireHall(L);
    ctx.drawImage(HB.view, 0, Y0, VW, H);
    // in the sea beyond the arches: the light let down from the surface in slanting shafts, slowly swaying, and fish going by
    const shafts = (k, y1) => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const x0 = VW * (.08 + i * .2) + Math.sin(t * .4 + i * 1.9) * 12, a = k * (.07 + .03 * Math.sin(t * .7 + i * 2.3)), dx = -(y1 - Y0) * .35, w0 = 4 + (i % 3) * 3, w1 = 16 + (i % 3) * 8;
        const gg = ctx.createLinearGradient(0, Y0, 0, y1); gg.addColorStop(0, `rgba(200,236,240,${a})`); gg.addColorStop(1, 'rgba(200,236,240,0)'); ctx.fillStyle = gg;
        for (const f of [1, .6, .3]) { ctx.beginPath(); ctx.moveTo(x0 - w0 * f, Y0); ctx.lineTo(x0 + w0 * f, Y0); ctx.lineTo(x0 + dx + w1 * f, y1); ctx.lineTo(x0 + dx - w1 * f, y1); ctx.closePath(); ctx.fill(); } } // (each laid three times, narrower each time: soft-edged)
      ctx.restore(); };
    shafts(1.6, L.sill);
    for (let i = 0; i < 6; i++) { const dir = i % 2 ? 1 : -1, sp = 7 + hsh(i + 80) * 8, span = VW + 80, x = dir > 0 ? (hsh(i + 81) * span + t * sp) % span - 40 : span - 40 - (hsh(i + 81) * span + t * sp) % span, y = L.apex + (L.sill - L.apex) * (.25 + hsh(i + 82) * .5) + Math.sin(t * .8 + i) * 3, z = .45 + hsh(i + 83) * .4;
      ctx.save(); ctx.translate(x, y); ctx.scale(dir * z, z); ctx.fillStyle = `rgba(16,48,62,${.45 + .2 * z})`; ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.6, 0, 0, TAU); ctx.fill(); // a fish, dark against the blue
      const fl2 = Math.sin(t * 6 + i) * 1.6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-13, -3 + fl2); ctx.lineTo(-13, 3 + fl2); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.drawImage(HB.wall, 0, Y0, VW, H);
    // she is turned about (the picture mirrored), so that she looks across the hall at Corwin
    if (MO.ok) { ctx.save(); ctx.translate(L.cx * 2, 0); ctx.scale(-1, 1); moireDraw(L.x0 - MO_PAD * L.s, L.y0, L.s * MO_W / MO.IW, t); ctx.restore(); } else moireFallback(L, t);
    ctx.drawImage(HB.front, 0, Y0, VW, H);
    moireCaustics(HB, L, t);
    // the light let down onto her from above, slowly swaying, and the pearls on her posts glowing with it
    { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = .1 + .03 * Math.sin(t * .6), sx = Math.sin(t * .3) * 6, tx = L.cx + H * .34 + sx, bx = L.cx + sx * .4, y1 = L.dB;
      const gg = ctx.createLinearGradient(0, Y0, 0, y1); gg.addColorStop(0, `rgba(220,246,240,${a})`); gg.addColorStop(.75, `rgba(220,246,240,${a * .5})`); gg.addColorStop(1, 'rgba(220,246,240,0)'); ctx.fillStyle = gg;
      for (const f of [1, .7, .45]) { ctx.beginPath(); ctx.moveTo(tx - L.iw * .14 * f, Y0); ctx.lineTo(tx + L.iw * .14 * f, Y0); ctx.lineTo(bx + L.iw * .56 * f, y1); ctx.lineTo(bx - L.iw * .56 * f, y1); ctx.closePath(); ctx.fill(); }
      const pr = L.pw * .5; for (const [i, x] of [L.pL, L.pR].entries()) { const py = L.pTop - L.pw * .45 - pr * .7, R = pr * (3.2 + .5 * Math.sin(t * 1.4 + i * 2)), pg = ctx.createRadialGradient(x, py, 0, x, py, R); pg.addColorStop(0, 'rgba(240,236,255,.4)'); pg.addColorStop(1, 'rgba(240,236,255,0)'); ctx.fillStyle = pg; ctx.fillRect(x - R, py - R, R * 2, R * 2); }
      ctx.restore(); }
    shafts(.25, VH); // and a little of it on the floor
    // bubbles going up through the hall, and motes adrift in the current
    ctx.save(); for (let i = 0; i < 18; i++) { const sp = 14 + hsh(i + 40) * 16, y = VH + 6 - ((t * sp + hsh(i + 41) * H) % (H + 12)), x = (i < 10 ? L.x0 + hsh(i + 42) * L.iw : hsh(i + 42) * VW) + Math.sin(t * 1.3 + i * 2.3) * 3, r = .7 + hsh(i + 43) * 1.5;
      ctx.strokeStyle = 'rgba(220,245,240,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - r * .5, y - r * .5, .7, .7); }
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const x = (hsh(i + 60) * VW + t * (5 + hsh(i + 61) * 6)) % VW, y = Y0 + hsh(i + 62) * H + Math.sin(t * .7 + i) * 4; ctx.fillStyle = `rgba(190,230,220,${.12 + .1 * Math.sin(t * 1.4 + i * 3)})`; ctx.fillRect(x, y, 1.2, 1.2); }
    ctx.restore();
    const hx = L.hx, hs = H / 165;
    hero(hx, fl + 4, hs, 1, 'idle', 0, 1);
    if (W7.drawPearl) { ctx.save(); W7.drawPearl(hx + 14 * hs, fl - 40 * hs, H / 210, t, true); ctx.restore(); }
    ctx.drawImage(HB.vig, 0, Y0, VW, H);
    textPanel(LINES.c, VW * .045, Y0 + H * .1, L.textW, cl01((T - SECT[2] - .7) / 1) * (1 - cl01((T - SECT[3] + .7) / .6)), 10, '232,248,240');
  }
  // ---------------- D: the shore at dawn: Amber above the water, Rebma in it ----------------
  function panelShore(T, t) {
    const Y0 = Y_OFF, H = VH - Y0, sea = Y0 + H * .56, k = cl01((T - SECT[3]) / 6);
    const g = ctx.createLinearGradient(0, Y0, 0, sea); g.addColorStop(0, '#2A3A6A'); g.addColorStop(.6, '#D89A8A'); g.addColorStop(1, '#FFE0B0'); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, sea - Y0);
    ctx.fillStyle = `rgba(255,240,200,${.8 + .2 * k})`; ctx.beginPath(); ctx.arc(VW * .82, sea - 4 - k * 12, 14, Math.PI, 0); ctx.fill(); // the sun coming up out of the sea
    const kolvir = (flip) => { ctx.save(); if (flip) { ctx.translate(0, sea * 2); ctx.scale(1, -1); ctx.globalAlpha = .45; }
      const kp = [VW * .2, sea, VW * .3, sea - H * .12, VW * .36, sea - H * .2, VW * .39, sea - H * .27, VW * .46, sea - H * .3, VW * .52, sea - H * .26, VW * .58, sea - H * .19, VW * .64, sea - H * .1, VW * .72, sea];
      ctx.fillStyle = flip ? '#3A5A7A' : '#4A3A5A'; ctx.beginPath(); ctx.moveTo(kp[0], kp[1]); for (let i = 2; i < kp.length; i += 2) ctx.lineTo(kp[i], kp[i + 1]); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 14; i++) { const fx = VW * (.3 + hsh(i) * .32), fy = sea - H * (.04 + hsh(i + 3) * .2), fw = 8 + hsh(i + 5) * 14; ctx.fillStyle = flip ? 'rgba(200,230,240,.18)' : 'rgba(255,190,160,.28)'; ctx.beginPath(); ctx.moveTo(fx - fw, fy); ctx.lineTo(fx - fw * .2, fy - fw * .4); ctx.lineTo(fx + fw, fy); ctx.closePath(); ctx.fill(); } // its crags catching the dawn
      const top = sea - H * .3, wallC = flip ? '#B8D4D4' : '#E8C8A0', shC = flip ? '#6E8A9A' : '#9A7060', roofC = flip ? '#4A7A8A' : '#5A3A4A';
      ctx.fillStyle = wallC; ctx.fillRect(VW * .41, top - 8, VW * .1, 10); // the walls along the summit
      for (let i = 0; i < 7; i++) { const x = VW * (.405 + i * .016), w = 5 + (i % 3) * 1.5, h = 14 + (3 - Math.abs(i - 3)) * 8 + (i % 2) * 4, y0 = top - 6 + Math.abs(i - 3) * 2;
        ctx.fillStyle = wallC; ctx.fillRect(x, y0 - h, w, h); ctx.fillStyle = shC; ctx.fillRect(x + w * .6, y0 - h, w * .4, h);
        ctx.fillStyle = roofC; ctx.beginPath(); ctx.moveTo(x - 1, y0 - h); ctx.lineTo(x + w / 2, y0 - h - w * 1.6); ctx.lineTo(x + w + 1, y0 - h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = flip ? 'rgba(255,255,255,.6)' : 'rgba(255,230,160,.9)'; ctx.fillRect(x + w * .3, y0 - h * .6, 1.2, 2); }
      // Amber's towers (Rebma's, below)
      ctx.restore(); };
    kolvir(false);
    const sg = ctx.createLinearGradient(0, sea, 0, VH); sg.addColorStop(0, '#E8B89A'); sg.addColorStop(.25, '#5A7A8A'); sg.addColorStop(1, '#1A3040'); ctx.fillStyle = sg; ctx.fillRect(0, sea, VW, VH - sea);
    kolvir(true);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const y = sea + 4 + i * 6, a = .18 - i * .01; ctx.strokeStyle = `rgba(255,230,190,${a})`; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= VW; x += 16) ctx.lineTo(x, y + Math.sin(x * .05 + t * 1.2 + i) * 1.5); ctx.stroke(); } ctx.restore(); // the swell, catching the dawn
    // Faiella-bionin coming up out of the water at the left to the shore, and he on it
    for (let i = 0; i < 9; i++) { const x = VW * .02 + i * 18, y = VH - 8 - i * 9; ctx.fillStyle = i % 2 ? '#C8C0B0' : '#B0A898'; ctx.fillRect(x, y, 40, 6); ctx.fillStyle = 'rgba(255,240,220,.6)'; ctx.fillRect(x, y, 40, 1); }
    const u = cl01((T - SECT[3]) / 5.5), hx = VW * .02 + 20 + u * 8 * 18, hy = VH - 8 - u * 8 * 9;
    hero(hx, hy, H / 300, 1, 'walk', T * 7, 1);
    textPanel(LINES.d, VW * .5, Y0 + H * .1, VW * .44, cl01((T - SECT[3] - 1) / 1) * (1 - cl01((T - SECT[4] + .6) / .6)), 10, '255,248,236');
  }
  function renderEnding(t) {
    const now = performance.now(), dt = Math.min(.05, (now - END.last) / 1000); END.last = now; END.t += dt;
    if (END.t >= SECT[2] && END.t < SECT[3] + dt) { // C: Moire's panel waits for the player: time stops just before it fades, until a button is pressed
      if (END.cAge == null) END.cAge = 0; END.cAge += dt; if (!END.goC && END.t > MO_HOLD) END.t = MO_HOLD; moirePad(); }
    const T = END.t;
    if (T < SECT[1] + .8) { // A: the hall, live: he walks to the Pearl and takes it up; the Pattern burns
      const pr = W7.pearl; if (pr && !END.took) { const dx = pr.x - 16 - P.x; if (Math.abs(dx) > 4 || Math.abs(pr.y - P.y) > 4) { P.state = 'walk'; P.facing = Math.sign(dx) || 1; P.walk += dt * 9; P.x += clamp(dx, -70 * dt, 70 * dt); P.y += clamp(pr.y - P.y, -40 * dt, 40 * dt); } else { P.state = 'idle'; P.facing = 1; if (T > 2.8) { END.took = 1; W7.pearl = null; sfx('learned'); flashT = .12; } } }
      if (END.took) { P.state = 'idle'; }
      if (W7.G) { W7.G.patLit = lerp(.5, 1.4, cl01(T / 4)); W7.G.spin = .25; W7.G.patRot = (W7.G.patRot || 0) + dt * .25; }
      updateFx(dt);
      END.orig(t);
      if (END.took && W7.drawPearl) { ctx.save(); ctx.translate(-camX, 0); W7.drawPearl(P.x + P.facing * 10, P.y - 50, 1, t, true); ctx.restore(); }
      textPanel(LINES.a, VW * .08, Y_OFF + 30, VW * .55, cl01((T - .6) / 1) * (1 - cl01((T - SECT[1] + .4) / .6)));
      if (T > SECT[1]) { ctx.fillStyle = `rgba(4,8,16,${cl01((T - SECT[1]) / .8)})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); }
      paperFrame(); return;
    }
    const fadeIn = (s) => cl01((T - s) / .8), fadeOut = (s) => cl01((T - (s - .8)) / .8);
    if (T < SECT[2]) { panelPattern(T, t); brushOver(); }
    else if (T < SECT[3]) { panelMoire(T, t); brushOver(MO.ok); } // (over her picture, the brush's grain but not the long strokes of the water: those are in the hall behind her)
    else if (T < SECT[4] + 1.2) { panelShore(T, t); brushOver(); }
    for (const s of [SECT[1] + .8, SECT[2], SECT[3]]) { const a = 1 - fadeIn(s); if (T >= s && a > 0) { ctx.fillStyle = `rgba(4,8,16,${a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); } }
    for (const s of [SECT[2], SECT[3]]) { const a = fadeOut(s); if (T < s && a > 0) { ctx.fillStyle = `rgba(4,8,16,${a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); } }
    if (T > SECT[4]) { const k = T - SECT[4], a = cl01(k / 1.2); ctx.fillStyle = `rgba(4,10,18,${.88 * a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      let y = VH + 10 - k * 26; ctx.textAlign = 'center';
      for (const [s, sz] of CREDITS) { y += sz + 8; if (!s) continue; const fa = cl01((y - Y_OFF) / 40) * cl01((VH - y) / 40); ctx.fillStyle = `rgba(226,244,240,${fa})`; ctx.font = `700 ${sz}px Cinzel, Georgia, serif`; ctx.fillText(s, VW / 2, y); }
      if (y < Y_OFF - 10) { finishEnding(); return; } }
    if (inMoire()) { if (END.cAge > 1.5 && !END.goC) { const a = cl01((END.cAge - 1.5) / .6) * (.6 + .4 * Math.sin(END.cAge * 4)); ctx.save(); ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; // the prompt to go on, glowing softly
        ctx.shadowColor = `rgba(150,230,210,${.8 * a})`; ctx.shadowBlur = 6; ctx.fillStyle = `rgba(232,248,240,${a})`; ctx.fillText((KBD ? 'PRESS ANY KEY' : 'TAP') + ' TO CONTINUE ▸', VW - 14, VH - 10); ctx.restore(); } }
    else if (T > 2) { ctx.fillStyle = 'rgba(200,230,226,.55)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); }
    paperFrame();
  }
  // Moire's panel holds until the player answers: any key, a tap or click, or a gamepad button goes on (it fades out as
  // usual); for its first moments a press is ignored, so the press that skipped the last panel does not skip this one too
  const MO_HOLD = SECT[3] - .85;
  const inMoire = () => !!END && END.t >= SECT[2] && END.t < SECT[3] && !END.goC;
  function moireGo() { if (!inMoire() || !(END.cAge > .6)) return false; END.goC = true; END.t = Math.max(END.t, MO_HOLD); return true; }
  function moirePad() { let down = false; try { for (const gp of (navigator.getGamepads ? navigator.getGamepads() : [])) if (gp) for (const b of gp.buttons) if (b && b.pressed) down = true; } catch (e) {}
    if (down && !END.padDown) moireGo(); END.padDown = down; }
  function skipEnding() { if (!END || END.t < 1.2) return; if (END.t >= SECT[2] && END.t < SECT[3]) { moireGo(); return; } const T = END.t; const nx = SECT.find(s => s > T + .05); if (nx === undefined) finishEnding(); else END.t = nx === SECT[1] ? SECT[1] + .8 : nx; }
  function finishEnding() {
    if (!END) return; const sc = END.sc; END = null; W7.ending = false;
    app.classList.remove('nocontrols', 'sr-end'); $('#banner').classList.remove('on');
    sc();
  }
  W7.startEnding = (sc) => {
    END = { t: 0, last: performance.now(), sc, orig: W7.origDraw }; W7.ending = true; mode = 'ending';
    save.w7relic = true; persist(); clearInput();
    hitstop = 0; slowmo = 0; shakeMag = 0; zoom = 0; flashT = 0; hurtFlash = 0; mirrorT = 0; stillT = 0; P.inv = 0; P.z = 0; P.vz = 0; P.state = 'idle'; P.move = null;
    $('#bossbar').hidden = true; app.classList.add('nocontrols', 'sr-end'); app.classList.remove('playing');
    if (typeof TRACKS !== 'undefined' && TRACKS.w7tide) playMusic('w7tide');
  };
  W7.setEndT = (v) => { if (END) { END.t = v; END.last = performance.now(); } }; // (for tests: jump the ending's clock)
  W7.endT = () => END && END.t; W7.skipEnding = skipEnding; W7.finishEnding = finishEnding;
  { const _sc = stageClear; stageClear = function () { if (isMine() && !END) { W7.startEnding(_sc); return; } return _sc(); }; }
  { const _ds = drawScene; W7.origDraw = _ds; drawScene = function (t) { if (END && mode !== 'ending') { END = null; W7.ending = false; } if (END) { renderEnding(t); return; } return _ds(t); }; }
  window.addEventListener('keydown', (e) => { if (!END) return; if (!e.repeat && (['Enter', 'NumpadEnter', 'Space', 'Escape', 'KeyJ'].includes(e.code) || inMoire())) skipEnding(); e.stopImmediatePropagation(); e.preventDefault(); }, true);
  window.addEventListener('pointerdown', (e) => { if (END) { skipEnding(); e.preventDefault(); } }, true);
})();
