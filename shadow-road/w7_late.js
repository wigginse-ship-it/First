'use strict';
// ======================================================================================================
// REBMA'S RELIC, AND ITS ENDING (world 7 of eight, stage index 6: data_w7.js, art_w7.js)
// ------------------------------------------------------------------------------------------------------
// THE PEARL OF JUDGEMENT. When the King in the Glass breaks, the Pearl falls out of his crown onto the Pattern of Rebma
// (save.w7relic, set as he falls: art_w7.js). It is the sea's reflection of the Jewel of Judgement, which commands the
// weather; this commands the tide, and it goes with Corwin into every world afterward, whatever he fights with:
//   UNDERTOW      every dodge leaves a whirlpool where he stood: it drags foes in and grinds at them
//   THE WAVE      a finishing blow (any heavy, power-2 hit) raises a wave of seawater that rolls down the lane ahead,
//                 carrying foes before it and breaking them on the walls (it gathers again after a few seconds)
//   SEA-LEGS      in the air, Jump again to kick off the water once more
// In New Game+ it is far stronger: the whirlpools are wider, last longer and grind harder; the wave rises more often,
// rolls both ways and hits harder; and he can kick off the water twice. It shows on the weapon card (a black pearl, its
// ring filling as the wave gathers), in the forge, and at the head of the move list.
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
  const R = W7.R = { pools: [], waves: [], waveCd: 0, poolCd: 0 };
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter');
  const WAVE_CD = () => (save.cycle > 0 ? 1.5 : 2.6);
  { const _sd = startDodge; startDodge = function () { const x = P.x, y = P.y; _sd();
    if (has() && P.state === 'dodge' && R.poolCd <= 0) { const k = PW(); R.poolCd = .8; R.pools.push({ x, y, t: 0, max: .9 + .55 * k, r: 54 * Math.sqrt(k), tick: 0, hit: new Map() }); sfx('hit-goo', .4); bub(x, y, 10, 8, 50); } }; }
  { const _st = strike; strike = function (e, base, dir, m, echo) { const r = _st(e, base, dir, m, echo);
    if (has() && m && P && m === P.move && m.power === 2 && R.waveCd <= 0 && mode === 'play') { R.waveCd = WAVE_CD(); const k = PW();
      for (const d of save.cycle > 0 ? [1, -1] : [1]) R.waves.push({ x: P.x + d * P.facing * 20, y: P.y, dir: d * P.facing, t: 0, max: .75 + .15 * k, hit: new Set(), h: 34 + 14 * k, dmg: Math.round((16 + 4 * (save.wl[P.w] || 1)) * k) });
      sfx('whoosh'); shakeMag = Math.max(shakeMag, 4); }
    return r; }; }
  { const _up = updatePlayer; updatePlayer = function (dt) {
    if (has() && P && pressed.jump && P.state === 'jump' && P.z > 8) { // sea-legs: kick off the water
      const tree = WEAPONS[P.w].tree, staffJ2 = tree.J2 && unlocked(tree.J2) && !P.j2;
      if (!staffJ2 && (P.w7kicks || 0) < (save.cycle > 0 ? 2 : 1)) { P.w7kicks = (P.w7kicks || 0) + 1; P.vz = Math.max(P.vz, 320); pressed.jump = false; sfx('jump'); bub(P.x, P.y, P.z, 10, 60); fx.push({ kind: 'ring', x: P.x, y: P.y, z: P.z, t: .3, max: .3, r: 22, col: '#C8F0E8' }); }
    }
    _up(dt);
    if (P.z <= 0) P.w7kicks = 0;
    R.waveCd = Math.max(0, R.waveCd - dt); R.poolCd = Math.max(0, R.poolCd - dt);
    if (R.stage !== stage) { R.stage = stage; R.pools = []; R.waves = []; }
    const k = PW();
    for (const p of R.pools) { p.t += dt; p.tick -= dt;
      for (const e of foes()) { if (e.boss) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy * 2); if (d < p.r * 1.9 && d > 6) { e.x += dx / d * 110 * k * dt; e.y += dy / Math.max(1, Math.abs(dy)) * Math.min(Math.abs(dy), 40 * dt); } }
      if (p.tick <= 0) { p.tick = .35; for (const e of foes()) if (Math.hypot(e.x - p.x, (e.y - p.y) * 2) < p.r + e.hw && e.z < 40) { const d = Math.round((4 + 1.5 * (save.wl[P.w] || 1)) * k); strike(e, d, Math.sign(e.x - p.x) || 1, { dmg: d, kb: 10, power: 0, el: 1, noStun: 1 }); } }
      if (Math.random() < dt * 20) bub(p.x + rand(-p.r, p.r) * .6, p.y, 4, 1, 20); }
    R.pools = R.pools.filter(p => p.t < p.max);
    for (const w of R.waves) { w.t += dt; w.x += w.dir * 470 * dt;
      for (const e of foes()) { if (Math.abs(e.x - w.x) < 24 + e.hw && Math.abs(e.y - w.y) < 26 && e.z < w.h + 20) { if (!w.hit.has(e)) { w.hit.add(e); strike(e, w.dmg, w.dir, { dmg: w.dmg, kb: 440, launch: 220, power: 2, wall: 1, el: 1 }); } else if (!e.boss && !e.dead) e.x += w.dir * 300 * dt; } }
      if (Math.random() < dt * 40) bub(w.x, w.y + rand(-10, 10), rand(0, w.h), 1, 40);
      if (w.x < leftWall() - 20 || w.x > rightWall() + 20) w.t = w.max; }
    R.waves = R.waves.filter(w => w.t < w.max);
  }; }
  function drawPool(p, t) { const a = Math.min(1, p.t / .15, (p.max - p.t) / .3); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const r = p.r * (.3 + i * .18), s = t * (5 - i * .6); ctx.strokeStyle = `rgba(190,250,240,${.35 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r / 2.4, 0, s, s + 3.6); ctx.stroke(); }
    ctx.fillStyle = `rgba(30,90,110,${.25 * a})`; ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * .5, p.r * .2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  function drawWave(w, t) { const a = Math.min(1, w.t / .1, (w.max - w.t) / .2), x = w.x, H = w.h * 1.4, d = w.dir; ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x - d * 40, 0, x, 0); g.addColorStop(0, 'rgba(40,120,130,0)'); g.addColorStop(1, 'rgba(90,180,180,.75)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - d * 46, w.y + 10); ctx.lineTo(x - d * 40, w.y - H * .5); ctx.quadraticCurveTo(x - d * 4, w.y - H * 1.1, x + d * 12, w.y - H * .7 + Math.sin(t * 20) * 2); ctx.quadraticCurveTo(x + d * 2, w.y - H * .5, x + d * 6, w.y + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,255,252,.95)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - d * 30, w.y - H * .8); ctx.quadraticCurveTo(x - d * 4, w.y - H * 1.1, x + d * 12, w.y - H * .7 + Math.sin(t * 20) * 2); ctx.stroke(); // the crest of foam
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + d * (8 - i * 6) + Math.sin(t * 14 + i) * 2, w.y - H * .72 - Math.abs(Math.sin(i * 1.7)) * 6, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const w of R.waves) box(w.x, w.y, 0, 60, w.h * 1.6 + 20); for (const p of R.pools) box(p.x, p.y, 0, p.r + 20, 40); }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const p of R.pools) list.push([p.y - .3, () => onMain(() => drawPool(p, t))]);
    for (const w of R.waves) list.push([w.y + .4, () => onMain(() => drawWave(w, t))]); }; }

  // ---------------- where it shows: the weapon card, the forge, the move list ----------------
  function pearlIcon(g, s, k, t) { // the black pearl in a ring of gold, the ring filling as the wave gathers
    const old = ctx; ctx = g; try { g.clearRect(0, 0, 40, 40); if (W7.drawPearl) { g.save(); g.translate(20, 26); W7.drawPearl(0, 0, 2.1 * s, t, false); g.restore(); }
      g.strokeStyle = 'rgba(30,24,10,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(20, 13.4, 16, 0, TAU); g.stroke();
      g.strokeStyle = k >= 1 ? '#F2D68A' : '#9A7A3A'; g.lineWidth = 2.2; g.beginPath(); g.arc(20, 13.4, 16, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); } finally { ctx = old; }
  }
  let hudCv = null;
  function hudBadge() {
    if (!hudCv) { const card = document.querySelector('.wcard'); if (!card) return; hudCv = document.createElement('canvas'); hudCv.id = 'w7pearlHud'; hudCv.width = 40; hudCv.height = 40; hudCv.title = 'The Pearl of Judgement';
      hudCv.style.cssText = 'position:absolute;right:-12px;top:-10px;width:20px;height:20px;pointer-events:none'; card.appendChild(hudCv); }
    hudCv.hidden = !has(); if (!has()) return;
    pearlIcon(hudCv.getContext('2d'), 1, 1 - R.waveCd / WAVE_CD(), performance.now() / 1000);
  }
  { const _ht = hudTick; hudTick = function () { _ht(); try { hudBadge(); } catch (e) {} }; }
  const RELIC_TEXT = () => `The sea's reflection of the Jewel of Judgement, out of the King in the Glass. Whatever you fight with: every dodge leaves an undertow that drags foes in; a finishing blow raises a wave that carries them down the lane; in the air, Jump again to kick off the water.${save.cycle > 0 ? ' In this cycle the tide runs strong: wider whirlpools, a wave both ways and more often, and two kicks.' : ' In New Game+ it is far stronger.'}`;
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
  function brushOver() { skyWash(0); ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = texPat(ctx, 'brush'); ctx.scale(.5, .5); ctx.fillRect(0, Y_OFF * 2, VW * 2, (VH - Y_OFF) * 2); ctx.restore(); }
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
  function moire(x, y, s, t) { // the Queen of Rebma, seated: a crown of pearls, sea-green hair floating up and out, a gown of sea-silk
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#E6DCD4'; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-30, -96); ctx.quadraticCurveTo(0, -132, 30, -96); ctx.lineTo(34, 0); ctx.closePath(); ctx.fill(); // the throne's back: a scallop of nacre
    ctx.strokeStyle = 'rgba(150,130,170,.6)'; ctx.lineWidth = 1; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 2, -6); ctx.lineTo(i * 7, -112 + Math.abs(i) * 4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,240,230,.35)'; ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(-24, -90); ctx.quadraticCurveTo(-8, -110, 0, -112); ctx.lineTo(-6, -10); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 14; i++) { const a = -Math.PI * (.15 + i / 13 * .7); ctx.strokeStyle = i % 2 ? '#2E7A62' : '#7ED0A8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -64); ctx.quadraticCurveTo(Math.cos(a) * 26 + Math.sin(t + i) * 4, -64 + Math.sin(a) * 26, Math.cos(a) * 44 + Math.sin(t * .8 + i) * 6, -60 + Math.sin(a) * 40); ctx.stroke(); } // her hair, floating
    ctx.fillStyle = '#1E3A78'; ctx.beginPath(); ctx.moveTo(-12, -52); ctx.lineTo(12, -52); ctx.lineTo(22, -2); ctx.quadraticCurveTo(0, 4, -22, -2); ctx.closePath(); ctx.fill(); // the gown
    ctx.strokeStyle = PAL_GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, -3); ctx.quadraticCurveTo(0, 3, 22, -3); ctx.moveTo(0, -50); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = '#4A6AB8'; ctx.beginPath(); ctx.moveTo(-12, -52); ctx.lineTo(-4, -52); ctx.lineTo(-10, -4); ctx.lineTo(-20, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#A8D8C6'; ctx.beginPath(); ctx.ellipse(0, -62, 7, 8.4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1A2A26'; ctx.lineWidth = 1; ctx.stroke(); // her face
    ctx.fillStyle = '#1A3A34'; ctx.fillRect(-4, -64, 2.4, 1.2); ctx.fillRect(1.6, -64, 2.4, 1.2); ctx.fillStyle = '#8A3A4A'; ctx.fillRect(-1.6, -57.5, 3.2, 1);
    ctx.fillStyle = PAL_GOLD; ctx.fillRect(-8, -72, 16, 3); for (let i = 0; i < 5; i++) { ctx.fillStyle = '#F2EEF6'; ctx.beginPath(); ctx.arc(-6 + i * 3, -74 - (i % 2) * 2.4, 1.4, 0, TAU); ctx.fill(); } // the crown of pearls
    ctx.strokeStyle = '#A8D8C6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -46); ctx.quadraticCurveTo(22, -40, 26, -52); ctx.stroke(); // a hand held out to him
    ctx.restore();
  }
  function panelMoire(T, t) {
    const Y0 = Y_OFF, H = VH - Y0, fl = Y0 + H * .8;
    const g = ctx.createLinearGradient(0, Y0, 0, VH); g.addColorStop(0, '#0A2232'); g.addColorStop(.7, '#1A4A5A'); g.addColorStop(1, '#0C2028'); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
    for (let i = 0; i < 6; i++) { const x = VW * (.08 + i * .17); ctx.fillStyle = 'rgba(200,220,214,.18)'; ctx.fillRect(x - 10, Y0, 20, fl - Y0); ctx.fillStyle = 'rgba(4,14,20,.5)'; ctx.beginPath(); ctx.moveTo(x + 10, fl); ctx.lineTo(x + 10, Y0 + 60); ctx.quadraticCurveTo(x + VW * .085, Y0 + 20, x + VW * .17 - 10, Y0 + 60); ctx.lineTo(x + VW * .17 - 10, fl); ctx.fill(); } // arcades of nacre
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const x = VW * .62 + (i - 4) * 18; const gg = ctx.createLinearGradient(0, Y0, 0, fl); gg.addColorStop(0, 'rgba(255,220,150,.22)'); gg.addColorStop(1, 'rgba(255,220,150,0)'); ctx.strokeStyle = gg; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(VW * .62, Y0); ctx.lineTo(x * 1.4 - VW * .25, fl); ctx.stroke(); } ctx.restore(); // gold rays on her
    ctx.fillStyle = '#24485A'; ctx.fillRect(0, fl, VW, VH - fl); for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#2E5868' : '#3A6878'; ctx.fillRect(VW * .5 + k * 14, fl - 8 - k * 8, VW * .3 - k * 28, 8); }
    moire(VW * .65, fl - 24, H / 170, t);
    hero(VW * .3, fl + 4, H / 210, 1, 'idle', 0, 1);
    if (W7.drawPearl) { ctx.save(); W7.drawPearl(VW * .3 + 14 * H / 210, fl - 40 * H / 210, H / 260, t, true); ctx.restore(); }
    textPanel(LINES.c, VW * .06, Y0 + H * .14, VW * .4, cl01((T - SECT[2] - .7) / 1) * (1 - cl01((T - SECT[3] + .7) / .6)), 10, '232,248,240');
  }
  // ---------------- D: the shore at dawn: Amber above the water, Rebma in it ----------------
  function panelShore(T, t) {
    const Y0 = Y_OFF, H = VH - Y0, sea = Y0 + H * .56, k = cl01((T - SECT[3]) / 6);
    const g = ctx.createLinearGradient(0, Y0, 0, sea); g.addColorStop(0, '#2A3A6A'); g.addColorStop(.6, '#D89A8A'); g.addColorStop(1, '#FFE0B0'); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, sea - Y0);
    ctx.fillStyle = `rgba(255,240,200,${.8 + .2 * k})`; ctx.beginPath(); ctx.arc(VW * .82, sea - 4 - k * 12, 14, Math.PI, 0); ctx.fill(); // the sun coming up out of the sea
    const kolvir = (flip) => { ctx.save(); if (flip) { ctx.translate(0, sea * 2); ctx.scale(1, -1); ctx.globalAlpha = .45; }
      ctx.fillStyle = flip ? '#3A5A7A' : '#4A3A5A'; ctx.beginPath(); ctx.moveTo(VW * .2, sea); ctx.lineTo(VW * .38, sea - H * .26); ctx.lineTo(VW * .46, sea - H * .3); ctx.lineTo(VW * .56, sea - H * .22); ctx.lineTo(VW * .72, sea); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 7; i++) { const x = VW * (.39 + i * .022), h = 14 + (3 - Math.abs(i - 3)) * 7; ctx.fillStyle = flip ? '#C8E4E0' : '#F2D8B0'; ctx.fillRect(x, sea - H * .3 - h + Math.abs(i - 3) * 3, 4, h); ctx.beginPath(); ctx.moveTo(x - 1, sea - H * .3 - h + Math.abs(i - 3) * 3); ctx.lineTo(x + 2, sea - H * .3 - h - 6 + Math.abs(i - 3) * 3); ctx.lineTo(x + 5, sea - H * .3 - h + Math.abs(i - 3) * 3); ctx.fill(); } // Amber's towers (Rebma's, below)
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
    const now = performance.now(), dt = Math.min(.05, (now - END.last) / 1000); END.last = now; END.t += dt; const T = END.t;
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
    else if (T < SECT[3]) { panelMoire(T, t); brushOver(); }
    else if (T < SECT[4] + 1.2) { panelShore(T, t); brushOver(); }
    for (const s of [SECT[1] + .8, SECT[2], SECT[3]]) { const a = 1 - fadeIn(s); if (T >= s && a > 0) { ctx.fillStyle = `rgba(4,8,16,${a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); } }
    for (const s of [SECT[2], SECT[3]]) { const a = fadeOut(s); if (T < s && a > 0) { ctx.fillStyle = `rgba(4,8,16,${a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); } }
    if (T > SECT[4]) { const k = T - SECT[4], a = cl01(k / 1.2); ctx.fillStyle = `rgba(4,10,18,${.88 * a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      let y = VH + 10 - k * 26; ctx.textAlign = 'center';
      for (const [s, sz] of CREDITS) { y += sz + 8; if (!s) continue; const fa = cl01((y - Y_OFF) / 40) * cl01((VH - y) / 40); ctx.fillStyle = `rgba(226,244,240,${fa})`; ctx.font = `700 ${sz}px Cinzel, Georgia, serif`; ctx.fillText(s, VW / 2, y); }
      if (y < Y_OFF - 10) { finishEnding(); return; } }
    if (T > 2) { ctx.fillStyle = 'rgba(200,230,226,.55)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); }
    paperFrame();
  }
  function skipEnding() { if (!END || END.t < 1.2) return; const T = END.t; const nx = SECT.find(s => s > T + .05); if (nx === undefined) finishEnding(); else END.t = nx === SECT[1] ? SECT[1] + .8 : nx; }
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
  W7.endT = () => END && END.t; W7.skipEnding = skipEnding; W7.finishEnding = finishEnding;
  { const _sc = stageClear; stageClear = function () { if (isMine() && !END) { W7.startEnding(_sc); return; } return _sc(); }; }
  { const _ds = drawScene; W7.origDraw = _ds; drawScene = function (t) { if (END && mode !== 'ending') { END = null; W7.ending = false; } if (END) { renderEnding(t); return; } return _ds(t); }; }
  window.addEventListener('keydown', (e) => { if (!END) return; if (['Enter', 'NumpadEnter', 'Space', 'Escape', 'KeyJ'].includes(e.code) && !e.repeat) skipEnding(); e.stopImmediatePropagation(); e.preventDefault(); }, true);
  window.addEventListener('pointerdown', (e) => { if (END) { skipEnding(); e.preventDefault(); } }, true);
})();
