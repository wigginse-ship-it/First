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
      for (const d of save.cycle > 0 ? [1, -1] : [1]) R.waves.push({ x: P.x + d * P.facing * 20, y: P.y, dir: d * P.facing, t: 0, max: .75 + .15 * k, hit: new Set(), h: 52 + 16 * k, dmg: Math.round((16 + 4 * (save.wl[P.w] || 1)) * k) });
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
  function drawWave(w, t) { const a = Math.min(1, w.t / .08, (w.max - w.t) / .2), x = w.x, H = w.h * 1.3, d = w.dir; ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x - d * 70, 0, x, 0); g.addColorStop(0, 'rgba(40,120,130,0)'); g.addColorStop(.6, 'rgba(60,150,160,.7)'); g.addColorStop(1, 'rgba(150,230,220,.92)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - d * 76, w.y + 10); ctx.lineTo(x - d * 60, w.y - H * .45); ctx.quadraticCurveTo(x - d * 4, w.y - H * 1.1, x + d * 12, w.y - H * .7 + Math.sin(t * 20) * 2); ctx.quadraticCurveTo(x + d * 2, w.y - H * .5, x + d * 6, w.y + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,255,252,.95)'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - d * 30, w.y - H * .8); ctx.quadraticCurveTo(x - d * 4, w.y - H * 1.1, x + d * 12, w.y - H * .7 + Math.sin(t * 20) * 2); ctx.stroke(); // the crest of foam
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + d * (8 - i * 6) + Math.sin(t * 14 + i) * 2, w.y - H * .72 - Math.abs(Math.sin(i * 1.7)) * 6, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const w of R.waves) box(w.x, w.y, 0, 60, w.h * 1.6 + 20); for (const p of R.pools) box(p.x, p.y, 0, p.r + 20, 40); }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const p of R.pools) list.push([p.y - .3, () => onMain(() => drawPool(p, t))]);
    for (const w of R.waves) list.push([w.y + 20, () => onMain(() => drawWave(w, t))]); }; }

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
  // startup), set into a hall painted to match the rest of Rebma: a niche of dim gold mosaic, a rose window with the sea
  // behind it, columns of green bronze, a floor of slate and lapis. She is inked round and graded into its light once, when
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
      g.globalAlpha = .85; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.drawImage(sil, Math.cos(a) * 2.6, Math.sin(a) * 2.6); } g.globalAlpha = 1; retire(sil); } // an ink line round her, as round everything painted here
    g.drawImage(im, P, P);
    // graded into the hall's light: the deep's blue-green over all, deeper below, a little gold where the rose window's light falls
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
    const [B, bgc] = texCanvas(CW, CH); bgc.drawImage(S, 0, 0); const cells = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const k = j * nx + i;
      if (![k, k + 1, k + nx, k + nx + 1].some(m => wh[m] || wc[m] || wb[m] > .002)) continue;
      const sx = P + U[k], sy = P + V[k], cw = U[k + 1] - U[k], ch = V[k + nx] - V[k]; if (cw < 1 || ch < 1) continue;
      cells.push(sx, sy, cw, ch, k); bgc.clearRect(sx, sy, cw, ch); }
    Object.assign(MO, { S, B, cells, nx, U, V, wh, wc, wb, ph, IW, IH, VX: new Float32Array(n), VY: new Float32Array(n), ok: true });
  }
  // the picture with its top left at (x0, y0), s world units to each of its pixels
  function moireDraw(x0, y0, s, t) {
    const M = MO, P = MO_PAD, nx = M.nx, n = M.U.length, VX = M.VX, VY = M.VY, U = M.U, V = M.V, IH = M.IH, q = M.IW / MO_W;
    const surge = (Math.sin(t * .37) * .6 + Math.sin(t * .23 + 1) * .4) * q; // the current's slow swell
    for (let k = 0; k < n; k++) { let dx = 0, dy = 0; const h = M.wh[k], c = M.wc[k], b = M.wb[k];
      if (h) { const a = t * 1.15 - M.ph[k]; dx += h * ((3.4 * Math.sin(a) + 1.3 * Math.sin(a * 1.9 + 1.3)) * q + 2 * surge); dy += h * 1.7 * q * Math.cos(a * .8 + .5); }
      if (c) { const a = t * .95 - M.ph[k]; dx += c * ((3 * Math.sin(a) + 1 * Math.sin(t * 1.7 + U[k] * .03)) * q + 1.3 * surge); dy += c * 1.3 * q * Math.cos(a * 1.1) * cl01((IH - V[k]) / (60 * q)); } // (the hem stays down at the frame)
      if (b) dy -= b * 1.3 * q * (.5 + .5 * Math.sin(t * 1.25));
      VX[k] = x0 + (P + U[k] + dx) * s; VY[k] = y0 + (P + V[k] + dy) * s; }
    ctx.drawImage(M.B, x0, y0, M.B.width * s, M.B.height * s);
    const T0 = ctx.getTransform(), ma = T0.a, mb = T0.b, mc = T0.c, md = T0.d, me = T0.e, mf = T0.f, C = M.cells, S = M.S;
    for (let i = 0; i < C.length; i += 5) { const sx = C[i], sy = C[i + 1], cw = C[i + 2], ch = C[i + 3], k = C[i + 4];
      const x = VX[k], y = VY[k], ax = (VX[k + 1] - x) / cw, ay = (VY[k + 1] - y) / cw, bx = (VX[k + nx] - x) / ch, by = (VY[k + nx] - y) / ch, ex = x - ax * sx - bx * sy, ey = y - ay * sx - by * sy;
      ctx.setTransform(ma * ax + mc * ay, mb * ax + md * ay, ma * bx + mc * by, mb * bx + md * by, ma * ex + mc * ey + me, mb * ex + md * ey + mf);
      ctx.drawImage(S, sx - 1, sy - 1, cw + 2, ch + 2, sx - 1, sy - 1, cw + 2, ch + 2); } // each a pixel larger all round, so no seam opens between them
    ctx.setTransform(T0);
  }
  // where things stand in the panel: the picture on the right, standing on the frame's lower edge (her shell fades out
  // above), a column in front of its left edge; the niche and the rose window centred behind her
  function moireLay() {
    const Y0 = Y_OFF, H = VH - Y0, s = (H + 6) * .86 / MO_H, x0 = Math.max(VW - 1072 * s - 8, VW * .36), ax = x0 + 420 * s;
    return { Y0, H, s, x0, y0: VH + 4 - (MO_H + MO_PAD) * s, wall: Y0 + H * .8, fl: Y0 + H * .92, col: x0 + 7, ax, ar: 470 * s, wx: ax, wy: Y0 + H * .1, lx: x0 + 1010 * s };
  }
  // the hall behind her, painted once into its own canvas
  function moireHall(L) {
    const key = [VW, K, L.H, L.x0.toFixed(1)].join(); if (MO.bg && MO.bgKey === key) return MO.bg;
    retire(MO.bg); const H = L.H, [c, g] = texCanvas(Math.ceil(VW * K), Math.ceil(H * K)), rnd = mulberry(77), PA = W7.PAL || {};
    const gold = PA.gold || '#C89A3A', goldL = PA.goldL || '#F2D68A', goldD = PA.goldD || '#6A4A18', wall = L.wall - L.Y0, ax = L.ax, ar = L.ar, wx = L.wx, wy = L.wy - L.Y0;
    g.scale(K, K);
    { const gr = g.createLinearGradient(0, 0, 0, wall); gr.addColorStop(0, '#060E1A'); gr.addColorStop(.6, '#0E2232'); gr.addColorStop(1, '#14303C'); g.fillStyle = gr; g.fillRect(0, 0, VW, wall); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = rnd() < .08 ? 'rgba(200,160,80,.35)' : `rgba(${rnd() < .5 ? '40,90,110' : '10,30,40'},.35)`; g.fillRect(rnd() * VW, rnd() * wall, 1.8, 1.8); } // the wall's dim mosaic
    // blind arcades down the wall on his side, gold in their spandrels
    for (let x = 30; x < L.x0 - 24; x += 62) { g.fillStyle = '#0A1A24'; g.beginPath(); g.moveTo(x - 24, wall); g.lineTo(x - 24, wall - 120); g.arc(x, wall - 120, 24, Math.PI, 0); g.lineTo(x + 24, wall); g.closePath(); g.fill();
      g.strokeStyle = goldD; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(200,160,80,.25)'; g.fillRect(x + 28, wall - 160, 5, 18); }
    // the niche behind her throne: a half-dome of dim gold mosaic, mosaic waves at its foot
    g.save(); g.beginPath(); g.moveTo(ax - ar, wall); g.lineTo(ax - ar, wall - H * .55); g.ellipse(ax, wall - H * .55, ar, H * .45, 0, Math.PI, 0); g.lineTo(ax + ar, wall); g.closePath(); g.clip();
    { const gr = g.createRadialGradient(ax, wall - H * .6, 10, ax, wall - H * .5, ar * 1.2); gr.addColorStop(0, '#8A6A2A'); gr.addColorStop(.6, '#4A3A1A'); gr.addColorStop(1, '#1A1608'); g.fillStyle = gr; g.fillRect(ax - ar, 0, ar * 2, wall); }
    for (let y = 0; y < wall; y += 2.6) for (let x = ax - ar + (Math.floor(y / 2.6) % 2) * 1.3; x < ax + ar; x += 2.6) { const k = rnd(); g.fillStyle = k < .09 ? (rnd() < .6 ? gold : goldL) : shade('#4A3A1C', (rnd() - .5) * .24); g.globalAlpha = .45 + rnd() * .3; g.fillRect(x, y, 2.2, 2.2); } g.globalAlpha = 1;
    g.globalAlpha = .9; for (let row = 0; row < 3; row++) for (let k = -9; k <= 9; k++) { const x = ax + k * 22 + (row % 2) * 11, y = wall - 12 - row * 10; g.strokeStyle = row % 2 ? '#3A7A8A' : '#5AAAB4'; g.lineWidth = 2.6; g.beginPath(); g.arc(x, y, 9, Math.PI, 0); g.stroke(); } g.globalAlpha = 1;
    { const sh = g.createLinearGradient(0, 0, 0, wall); sh.addColorStop(0, 'rgba(4,10,16,.62)'); sh.addColorStop(.5, 'rgba(4,10,16,.3)'); sh.addColorStop(1, 'rgba(4,10,16,.55)'); g.fillStyle = sh; g.fillRect(ax - ar, 0, ar * 2, wall);
      const sd = g.createLinearGradient(ax - ar, 0, ax + ar, 0); sd.addColorStop(0, 'rgba(4,10,16,.5)'); sd.addColorStop(.3, 'rgba(4,10,16,0)'); sd.addColorStop(.7, 'rgba(4,10,16,0)'); sd.addColorStop(1, 'rgba(4,10,16,.5)'); g.fillStyle = sd; g.fillRect(ax - ar, 0, ar * 2, wall); } // dimmed by the deep, darker into its curve
    g.restore();
    g.strokeStyle = goldD; g.lineWidth = 6; g.beginPath(); g.moveTo(ax - ar - 3, wall); g.lineTo(ax - ar - 3, wall - H * .55); g.ellipse(ax, wall - H * .55, ar + 3, H * .45 + 3, 0, Math.PI, 0); g.lineTo(ax + ar + 3, wall); g.stroke(); g.strokeStyle = gold; g.lineWidth = 1.4; g.stroke(); // its rim
    // the rose window, the sea's light behind its glass
    { const rr = Math.min(30, H * .11), GL = ['#2A5AB8', '#2E8A6A', '#1E3A8A', '#4A98B0', '#6A3AA8', '#C8962E'];
      g.fillStyle = '#04080E'; g.beginPath(); g.arc(wx, wy, rr + 4, 0, TAU); g.fill();
      for (let k = 0; k < 12; k++) { const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU; g.fillStyle = GL[k % GL.length]; g.globalAlpha = .7; g.beginPath(); g.moveTo(wx, wy); g.arc(wx, wy, rr, a0 + .04, a1 - .04); g.closePath(); g.fill(); }
      g.globalAlpha = 1; g.fillStyle = '#C8D8F0'; g.beginPath(); g.arc(wx, wy, rr * .24, 0, TAU); g.fill(); g.strokeStyle = '#04080E'; g.lineWidth = 2;
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.moveTo(wx + Math.cos(a) * rr * .24, wy + Math.sin(a) * rr * .24); g.lineTo(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr); g.stroke(); }
      g.beginPath(); g.arc(wx, wy, rr * .62, 0, TAU); g.stroke(); g.strokeStyle = goldD; g.lineWidth = 3; g.beginPath(); g.arc(wx, wy, rr + 3, 0, TAU); g.stroke(); g.strokeStyle = gold; g.lineWidth = 1; g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter'; const gw = g.createRadialGradient(wx, wy, 0, wx, wy, rr * 2.4); gw.addColorStop(0, 'rgba(120,170,230,.28)'); gw.addColorStop(1, 'rgba(120,170,230,0)'); g.fillStyle = gw; g.fillRect(wx - rr * 2.4, wy - rr * 2.4, rr * 4.8, rr * 4.8); g.restore(); }
    // a lamp of pearl on its long chain, to the right of the niche
    if (L.lx < VW - 8) { const x = L.lx, y = H * .36; g.strokeStyle = 'rgba(160,140,90,.6)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 8); g.stroke();
      g.fillStyle = gold; g.fillRect(x - 6, y - 8, 12, 3); g.fillStyle = '#F2EEF8'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.strokeStyle = '#071216'; g.lineWidth = .8; g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter'; const gp = g.createRadialGradient(x, y, 0, x, y, 30); gp.addColorStop(0, 'rgba(236,232,246,.4)'); gp.addColorStop(1, 'rgba(236,232,246,0)'); g.fillStyle = gp; g.fillRect(x - 30, y - 30, 60, 60); g.restore(); }
    // a column of green bronze at the far left, gilded at capital and base
    { const x = 12, w = 16, top = -4; const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#8ACCB0'); gr.addColorStop(.35, '#3E8A72'); gr.addColorStop(1, '#0E2A22'); g.fillStyle = gr; g.fillRect(x - w / 2, top, w, wall - top);
      g.fillStyle = goldD; g.fillRect(x - w * .75, wall - 12, w * 1.5, 12); g.fillStyle = gold; g.fillRect(x - w * .75, wall - 12, w * 1.5, 2); }
    // the floor: polished slate with lapis in it, a border of gold and lapis mosaic along the wall
    { const gr = g.createLinearGradient(0, wall, 0, H); gr.addColorStop(0, '#16283A'); gr.addColorStop(.45, '#1E3448'); gr.addColorStop(1, '#0A1420'); g.fillStyle = gr; g.fillRect(0, wall, VW, H - wall); }
    for (let i = 0; i < 700; i++) { g.fillStyle = rnd() < .5 ? 'rgba(80,120,170,.09)' : 'rgba(0,0,0,.13)'; g.fillRect(rnd() * VW, wall + rnd() * (H - wall), 2, 1.4); }
    g.fillStyle = goldD; g.fillRect(0, wall, VW, 6); for (let x = 0; x < VW; x += 8) { g.fillStyle = (x / 8) % 2 ? gold : '#2A4A6A'; g.fillRect(x + 1, wall + 1, 6, 4); }
    g.save(); g.globalAlpha = .35; g.fillStyle = texPat(g, 'sky'); g.fillRect(0, 0, VW, wall); g.restore(); // long brushstrokes in the water
    MO.bg = c; MO.bgKey = key; return c;
  }
  // the column standing before the left edge of her niche (and of the picture)
  function moireColumn(L) {
    const x = L.col, w = 18, top = L.Y0 - 4, base = VH - 3, gr = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0), PA = W7.PAL || {};
    gr.addColorStop(0, '#8ACCB0'); gr.addColorStop(.35, '#3E8A72'); gr.addColorStop(1, '#0E2A22'); ctx.fillStyle = gr; ctx.fillRect(x - w / 2, top, w, base - top);
    ctx.strokeStyle = 'rgba(4,20,16,.5)'; ctx.lineWidth = .8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * w * .18, top + 30); ctx.lineTo(x + k * w * .18, base - 12); ctx.stroke(); }
    ctx.fillStyle = PA.gold || PAL_GOLD; ctx.beginPath(); ctx.moveTo(x - w * .9, L.Y0 + 14); ctx.lineTo(x + w * .9, L.Y0 + 14); ctx.lineTo(x + w * .55, L.Y0 + 26); ctx.lineTo(x - w * .55, L.Y0 + 26); ctx.closePath(); ctx.fill(); ctx.fillStyle = PA.goldL || '#F2D68A'; ctx.fillRect(x - w * .9, L.Y0 + 12, w * 1.8, 2.4);
    ctx.fillStyle = PA.goldD || '#6A4A18'; ctx.fillRect(x - w * .8, base - 12, w * 1.6, 14); ctx.fillStyle = PA.gold || PAL_GOLD; ctx.fillRect(x - w * .8, base - 12, w * 1.6, 2);
    ctx.strokeStyle = '#071216'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, top, w, base - top);
  }
  // if the picture could not be had: her empty throne of nacre, lit
  function moireFallback(L, t) {
    const x = L.x0 + 150 * L.s * 2, y = L.wall, r = L.H * .42;
    ctx.save(); ctx.fillStyle = '#E6DCD4'; ctx.beginPath(); ctx.moveTo(x - r, y); for (let k = 0; k <= 7; k++) { const a = Math.PI + k / 7 * Math.PI; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAL_GOLD; ctx.lineWidth = 3; ctx.stroke(); for (let k = 1; k < 7; k++) { const a = Math.PI + k / 7 * Math.PI; ctx.strokeStyle = k % 2 ? 'rgba(170,150,190,.6)' : 'rgba(150,200,190,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * 1.05); ctx.stroke(); }
    ctx.restore(); if (W7.drawPearl) W7.drawPearl(x, y - r * .5, L.H / 200, t, true);
  }
  function panelMoire(T, t) {
    const L = moireLay(), Y0 = L.Y0, H = L.H, fl = L.fl;
    ctx.drawImage(moireHall(L), 0, Y0, VW, H);
    // the rose window's light let down through the water onto her, its shafts slowly swaying
    const shafts = (k) => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const sw = Math.sin(t * .5 + i * 1.7) * 10, a = k * (.05 + .025 * Math.sin(t * .8 + i * 2.1)), x1 = L.x0 + (120 + i * 230) * L.s + sw, w0 = 5 + i, w1 = 22 + i * 6;
        const gg = ctx.createLinearGradient(L.wx, L.wy, x1, VH); gg.addColorStop(0, `rgba(190,220,240,${a})`); gg.addColorStop(1, 'rgba(190,220,240,0)'); ctx.fillStyle = gg;
        for (const f of [1, .66, .33]) { ctx.beginPath(); ctx.moveTo(L.wx - w0 * f, L.wy); ctx.lineTo(L.wx + w0 * f, L.wy); ctx.lineTo(x1 + w1 * f, VH); ctx.lineTo(x1 - w1 * f, VH); ctx.closePath(); ctx.fill(); } } // (each laid three times, narrower each time: soft-edged)
      ctx.restore(); };
    shafts(1);
    if (MO.ok) moireDraw(L.x0 - MO_PAD * L.s, L.y0, L.s * MO_W / MO.IW, t); else moireFallback(L, t);
    shafts(.35); // and a little of it on her
    moireColumn(L);
    // bubbles going up through the hall, and motes adrift in the current
    ctx.save(); for (let i = 0; i < 18; i++) { const sp = 14 + hsh(i + 40) * 16, y = VH + 6 - ((t * sp + hsh(i + 41) * H) % (H + 12)), x = (i < 10 ? L.x0 + hsh(i + 42) * 400 * L.s : hsh(i + 42) * VW) + Math.sin(t * 1.3 + i * 2.3) * 3, r = .7 + hsh(i + 43) * 1.5;
      ctx.strokeStyle = 'rgba(220,245,240,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - r * .5, y - r * .5, .7, .7); }
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const x = (hsh(i + 60) * VW + t * (5 + hsh(i + 61) * 6)) % VW, y = Y0 + hsh(i + 62) * H + Math.sin(t * .7 + i) * 4; ctx.fillStyle = `rgba(190,230,220,${.12 + .1 * Math.sin(t * 1.4 + i * 3)})`; ctx.fillRect(x, y, 1.2, 1.2); }
    ctx.restore();
    const hx = Math.max(VW * .13, L.x0 * .46), hs = H / 165;
    hero(hx, fl + 4, hs, 1, 'idle', 0, 1);
    if (W7.drawPearl) { ctx.save(); W7.drawPearl(hx + 14 * hs, fl - 40 * hs, H / 210, t, true); ctx.restore(); }
    textPanel(LINES.c, VW * .045, Y0 + H * .1, Math.max(150, Math.min(VW * .36, L.x0 + 30 - VW * .045)), cl01((T - SECT[2] - .7) / 1) * (1 - cl01((T - SECT[3] + .7) / .6)), 10, '232,248,240');
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
    else if (T < SECT[3]) { panelMoire(T, t); brushOver(MO.ok); } // (over her picture, the brush's grain but not the long strokes of the water: those are in the hall behind her)
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
