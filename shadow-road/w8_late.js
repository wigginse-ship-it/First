'use strict';
// LORRAINE and the BLACK CIRCLE, the late part: it runs once every other script has loaded (it needs entrances.js,
// thresholds.js, draw.js and ui.js). Three things:
//   1. W8.dom(): the entrances, landmarks and deaths of the world (art_w8.js)
//   2. THE HORN OF LORRAINE, the relic won from the Goat-Lord (save.w8relic). Ganelon's war-horn. Every blow you land
//      fills it (the HUD shows it, gold, under your health); full, it sounds by itself as soon as there is a fight, and
//      Star, the warhorse of Lorraine, comes at a gallop: you fight mounted for a while. Mounted you go half as fast
//      again, trample whatever you ride through, hit harder, take less from every blow and can't be knocked down.
//      In New Game+ (any cycle past the first) it fills about twice as fast, Star stays longer, and every one of
//      those is stronger. Test: W8.relic() gives it, W8.relic(false) takes it, W8.ride() mounts you now.
//   3. THE ENDING of Lorraine: the colour comes back into the Circle from where the Goat-Lord fell, Corwin blows the
//      horn, and Ganelon rides out of the morning with what is left of the riders of Lorraine; then the credits and
//      the win flow (whatever stageClear was before this file: CHOICE's branch.js may wrap it further)
(() => {
  if (!window.W8 || !W8.kit) return;
  if (typeof W8.dom === 'function' && STAGES.some(s => s.theme === 'lorraine')) W8.dom();
  const { DET, hsh, sm, cl01, seg, PAL } = W8.kit;
  const tn = (...a) => { if (sfxOn && actx) tone(...a); };
  const NG = () => (typeof save !== 'undefined' && save && save.cycle > 0);
  const owned = () => !!(typeof save !== 'undefined' && save && save.w8relic);
  const isLorraine = () => typeof baseStage !== 'undefined' && baseStage && baseStage.theme === 'lorraine';

  // ======================================================================================================
  // THE HORN OF LORRAINE
  // ======================================================================================================
  const R = W8.R = { fill: 0, call: 0, star: null }; // fill 0..1; call: the horn at his lips; star: the horse coming or going
  const HITS = () => NG() ? 18 : 34;                   // blows to fill it
  const RIDE = () => NG() ? Math.min(19, 13 + 2 * save.cycle) : 9; // seconds in the saddle
  const DMG_OUT = () => NG() ? 1.7 : 1.35, DMG_IN = () => NG() ? .45 : .6, TRAMPLE = () => NG() ? .2 : .13;
  W8.relic = (on = true) => { save.w8relic = !!on; persist(); refreshHornHud(); return on ? 'the Horn of Lorraine is yours' : 'the horn is put away'; };
  W8.ride = () => { if (!P) return; R.fill = 1; mount(); };
  const riding = () => P && (P.w8ride || 0) > 0;
  function mount() { P.w8ride = RIDE(); P.w8hw = 0; R.star = null; sfx('trump'); flashT = .1; shakeMag = Math.max(shakeMag, 6); banner('STAR', NG() ? 'THE WARHORSE OF LORRAINE · NEW GAME+: HE STAYS LONGER AND HITS HARDER' : 'THE WARHORSE OF LORRAINE', 1.6); dust(P.x, P.y, 14); }
  function dismount() { P.w8ride = 0; R.star = { x: P.x, y: P.y, dir: P.facing, t: 0, out: 1 }; floatText(P.x, P.y, 100, 'STAR GALLOPS OFF', '#F2E0A8', 13); sfx('whoosh'); }
  function blow() { // he lifts the horn and blows it; Star comes from behind him at a gallop
    R.fill = 0; R.call = 1.1; P.inv = Math.max(P.inv, 1.1);
    if (typeof tone === 'function' && sfxOn && actx) { tn(147, .9, 'sawtooth', .07, 196); tn(220, .7, 'sawtooth', .05, 294, .45); tn(294, 1.1, 'triangle', .06, 0, .8); }
    floatText(P.x, P.y, 110, 'THE HORN OF LORRAINE', '#F2D890', 15);
    R.star = { x: P.x - P.facing * (VW * .6), y: P.y, dir: P.facing, t: 0, out: 0 };
  }
  // the gauge fills with every blow that lands (not with the cards)
  const _hurt = hurtEnemy;
  hurtEnemy = function (e, dmg, dir, m, crit) { const r = _hurt(e, dmg, dir, m, crit); if (owned() && !riding() && !(m && (m.trump || m.w8trample)) && !R.call) { R.fill = Math.min(1, R.fill + 1 / HITS() + (e.dead ? .04 : 0)); } return r; };
  // mounted, his blows land harder (the trample has its own weight)
  const _strike = strike;
  strike = function (e, base, dir, m, echo) { if (riding() && m && !m.trump && !m.w8trample) base *= DMG_OUT(); return _strike(e, base, dir, m, echo); };
  // and blows land lighter on him, and never put him on the ground
  const _pd = playerDamage;
  playerDamage = function (dmg, fromX, big) { if (riding()) { dmg = Math.max(1, Math.round(dmg * DMG_IN())); const r = _pd(dmg, fromX, false); if (P.state === 'hurt') { P.t = Math.min(P.t, .18); P.vx *= .3; P.vz = 0; P.knocked = false; } return r; } return _pd(dmg, fromX, big); };
  W8.afterPlayer = (dt, x0, y0) => {
    if (!P || typeof stage === 'undefined' || !stage) return;
    if (R.call > 0) { R.call -= dt; P.vx = 0; if (P.state === 'walk' || P.state === 'run') P.state = 'idle'; }
    if (R.star) { const s = R.star; s.t += dt;
      if (!s.out) { const tx = P.x, sp = 520; s.x += Math.sign(tx - s.x) * Math.min(Math.abs(tx - s.x), sp * dt); s.y += (P.y - s.y) * Math.min(1, dt * 6); if (Math.random() < .6) dust(s.x - s.dir * 20, s.y, 1); if (Math.abs(s.x - tx) < 8 || s.t > 1.6) mount(); }
      else { s.x += s.dir * 480 * dt; if (Math.random() < .5) dust(s.x - s.dir * 20, s.y, 1); if (s.t > 2) R.star = null; } }
    if (riding()) {
      if (P.state === 'dead' || mode !== 'play') { P.w8ride = 0; return; }
      if (!zoneTrans) P.w8ride -= dt; if (P.w8ride <= 0) { dismount(); return; }
      // half as fast again
      if (['idle', 'walk', 'run', 'jump'].includes(P.state)) { P.x = x0 + (P.x - x0) * 1.55; P.y = y0 + (P.y - y0) * 1.4; P.x = clamp(P.x, camX + 14, lockX !== null ? lockX + VW - 14 : stage.len - 14); P.y = clamp(P.y, FLOOR_TOP + 6, FLOOR_BOT); }
      const sp = Math.abs(P.x - x0) / Math.max(dt, 1e-4); P.w8hw = (P.w8hw || 0) + dt * (sp > 20 ? 10 : 2); P.w8gal = sp > 150 ? 1 : 0;
      // the trample: whatever he rides through at speed is knocked flying
      if (sp > 70) for (const e of enemies) { if (e.dead || e.state === 'enter' || (e.w8tr || 0) > performance.now()) continue;
        if (Math.abs(e.x - P.x) < 26 + e.hw * .5 && Math.abs(e.y - P.y) < 18 && e.z < 34) { e.w8tr = performance.now() + 700; const d = Math.max(6, Math.round(e.maxHp * (e.boss ? TRAMPLE() * .14 : TRAMPLE()))); strike(e, d, Math.sign(P.x - x0) || P.facing, { dmg: d, kb: 340, launch: e.boss ? 0 : 260, power: 1, w8trample: 1 }); sfx('slam', .5); shakeMag = Math.max(shakeMag, 4); } }
      return;
    }
    // full: it sounds by itself as soon as there is a fight in view
    if (owned() && R.fill >= 1 && !R.call && !R.star && !zoneTrans && mode === 'play' && ['idle', 'walk', 'run'].includes(P.state) && enemies.some(e => !e.dead && e.state !== 'enter' && e.x > camX && e.x < camX + VW)) blow();
  };
  // a new place: he comes into it on foot (Star waits outside), but the horn keeps what it had
  { const _ez = enterZone; enterZone = function (z, Zs) { const was = riding(); const r = _ez(z, Zs); if (was) { P.w8ride = 0; R.fill = Math.max(R.fill, .5); } R.star = null; R.call = 0; return r; }; }
  { const _ss = startStage; startStage = function (i) { const r = _ss(i); R.call = 0; R.star = null; if (P) P.w8ride = 0; refreshHornHud(); return r; }; }
  // ---------------- drawing: Corwin in the saddle, the horse coming and going, the horn at his lips ----------------
  const _dpa = drawPlayerAt;
  drawPlayerAt = function (x, y, z, facing, pose, alpha) {
    if (!(P && pose && pose.live && riding() && x === P.x && y === P.y)) { _dpa(x, y, z, facing, pose, alpha); if (pose && pose.live && R.call > 0 && x === P.x) hornAtLips(x, y, z, P.facing); return; }
    const t = performance.now() / 1000, L = heroLook(), o = { t, walk: P.w8hw || 0, gallop: P.w8gal || 0 };
    ctx.save(); ctx.translate(x, y - z); ctx.scale(P.facing, 1); ctx.globalAlpha = alpha; W8.horse('back', o); ctx.restore();
    pose = Object.assign({}, pose, { walk: 0 }); _dpa(x, y, z + 30, facing, pose, alpha);
    ctx.save(); ctx.translate(x, y - z); ctx.scale(P.facing, 1); ctx.globalAlpha = alpha; W8.horse('front', Object.assign(o, { legCol: L.legs, bootCol: L.boots })); ctx.restore();
  };
  function hornAtLips(x, y, z, f) { const k = sm(Math.min(1, (1.1 - R.call) / .2)) * (1 - sm((.15 - R.call) / .15)); ctx.save(); ctx.translate(x + f * 6, y - z - 50); ctx.scale(f, 1); W8.hornDraw(4, 0, .7, 0, k, -.6); ctx.restore(); }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    if (R.star) { const s = R.star; list.push([s.y, () => { shadow(s.x, s.y, 26); ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.dir, 1); const o = { t, walk: t * 14, gallop: 1, rider: false }; W8.horse('back', o); W8.horse('front', o); ctx.restore(); }]); }
    if (W8.hornDrop && boss && boss.dead) { const h = W8.hornDrop; list.push([h.y + 1, () => W8.hornDraw(h.x, h.y - 6, .9, t, 1)]); } }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (R.star) box(R.star.x, R.star.y, 0, 70, 90); if (riding()) box(P.x, P.y, P.z, 80, 130); }; }
  // ---------------- the HUD: a horn and a gold bar under his health ----------------
  let hornEl = null, hornBar = null;
  function refreshHornHud() {
    if (!hornEl) { const tb = document.getElementById('tbarWrap'); if (!tb || !tb.parentNode) return;
      hornEl = document.createElement('div'); hornEl.className = 'bar tbar'; hornEl.id = 'w8hornWrap'; hornEl.title = 'The Horn of Lorraine';
      hornEl.style.cssText = 'position:relative;margin-top:3px;border-color:#8A6418;background:rgba(40,24,8,.55)';
      hornBar = document.createElement('i'); hornBar.style.cssText = 'background:linear-gradient(90deg,#B8862E,#F2D890);width:0%';
      const lab = document.createElement('b'); lab.textContent = 'HORN'; lab.style.cssText = 'position:absolute;left:-1px;top:-1px;font:700 7px Cinzel,Georgia,serif;color:#F2E0A8;letter-spacing:.06em;line-height:1;padding:0 2px;pointer-events:none;text-shadow:0 0 2px #000';
      hornEl.appendChild(hornBar); hornEl.appendChild(lab); tb.parentNode.insertBefore(hornEl, tb.nextSibling); }
    hornEl.hidden = !owned();
  }
  W8.refreshHornHud = refreshHornHud;
  const _ht = hudTick;
  hudTick = function () { _ht(); if (!hornEl || hornEl.hidden !== !owned()) refreshHornHud(); if (hornBar && owned()) { const v = riding() ? P.w8ride / RIDE() : R.fill; hornBar.style.width = (100 * v) + '%'; hornBar.style.opacity = riding() ? '.65' : R.fill >= 1 ? (Math.sin(performance.now() / 120) > 0 ? '1' : '.7') : '1'; } };
  setTimeout(refreshHornHud, 0);

  // ======================================================================================================
  // THE ENDING OF LORRAINE
  // ======================================================================================================
  let END = null;
  const isLorraineEnd = () => isLorraine() && STAGES[stageIdx] && STAGES[stageIdx].theme === 'lorraine';
  const lines = () => ['The Circle closed on nothing, and was gone.', 'Where it had been, the ground was only ground; in a week it was green.',
    (W8.vill && W8.vill.seen ? `${W8.vill.saved} of the ${W8.vill.seen} who ran from it across the snow came home.` : 'The people who had run from it came home across the snow.'),
    'Ganelon did not ask him how he had known what was at its heart. He gave him the horse instead.'];
  const CREDITS = [['SHADOW ROAD', 22], ['the way through Lorraine', 9], ['', 6], ['THE WINTER FIELDS · THE EDGE OF THE CIRCLE · THE HEART OF THE CIRCLE', 8], ['', 10],
    ['after Roger Zelazny\'s The Chronicles of Amber', 10], ['', 8], ['CORWIN', 11], ['Prince of Amber, who cursed it, and came back', 8], ['', 6], ['GANELON', 11], ['who held its edge', 8], ['', 6],
    ['STAR', 11], ['the warhorse of Lorraine', 8], ['', 6], ['THE GOAT-LORD OF THE CIRCLE', 11], ['who only listened', 8], ['', 10],
    ['painted after Bruegel, Bosch and the Limbourg brothers', 9], ['in tempera, gold leaf and grisaille', 9], ['', 14], ['Thank you for walking the road.', 12]];
  const GANELON = { skin: '#D49A72', hair: '#8A3A1A', hairLt: '#C06A3A', hairDk: '#4A1A0A', body: PAL.gules, sleeve: '#7A1E18', trim: PAL.or, legs: '#3A2E26', boots: '#2A1E14', plate: '#8E9296', plateTrim: PAL.or, pauldron: '#7A7E82', cape: '#24365E', eye: '#3A5A2A' };
  // a spring morning over Lorraine: a Book of Hours' March: a castle on its hill, ploughmen with oxen, blossom, the
  // last of the Circle a grey smear going out on the horizon
  function springPanel(k, t, fadeRing) {
    const Y0 = Y_OFF, H = VH - Y0, g = ctx.createLinearGradient(0, Y0, 0, VH);
    g.addColorStop(0, '#5A7AB2'); g.addColorStop(.45, '#B8C8D8'); g.addColorStop(.62, '#E8E0C8'); g.addColorStop(.63, '#8EA05A'); g.addColorStop(1, '#5A7A34');
    ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
    const hz = Y0 + H * .62;
    ctx.fillStyle = 'rgba(70,64,58,' + (.55 * (1 - fadeRing)) + ')'; ctx.beginPath(); ctx.ellipse(VW * .78, hz, 120, 6, 0, 0, Math.PI * 2); ctx.fill(); // the Circle going out like a stain drying
    for (let i = 0; i < 6; i++) { const y = hz + 6 + i * 16; ctx.strokeStyle = `rgba(${90 + i * 8},${70 + i * 6},${40},.5)`; ctx.lineWidth = 1.2 + i * .3; ctx.beginPath(); for (let x = -20; x <= VW + 20; x += 20) ctx.lineTo(x, y + Math.sin(x * .02 + i) * 2); ctx.stroke(); } // furrows
    // the castle on its hill, white towers, blue roofs, Lorraine's banner
    ctx.fillStyle = '#7E9A52'; ctx.beginPath(); ctx.moveTo(VW * .05, hz); ctx.quadraticCurveTo(VW * .22, hz - 70, VW * .42, hz); ctx.fill();
    for (const [dx, w, h] of [[-50, 16, 52], [-28, 22, 40], [-6, 14, 62], [12, 20, 44], [30, 12, 50]]) { const x = VW * .23 + dx; ctx.fillStyle = '#F2EEE4'; ctx.fillRect(x - w / 2, hz - 50 - h, w, h); ctx.fillStyle = '#C8CCD0'; ctx.fillRect(x - w / 2, hz - 50 - h, w * .3, h); ctx.fillStyle = '#3A5A96'; ctx.beginPath(); ctx.moveTo(x - w * .6, hz - 50 - h); ctx.lineTo(x, hz - 50 - h - w * 1.1); ctx.lineTo(x + w * .6, hz - 50 - h); ctx.fill(); }
    W8.arms(VW * .23 + 18, hz - 150, 14, 16);
    // a ploughman and his oxen, blossom on the trees along the field's edge
    const px = ((t * 8) % (VW + 200)) - 100; ctx.save(); ctx.translate(px, hz + 34); ctx.fillStyle = '#5A3A26'; for (const ox of [0, 26]) { ctx.beginPath(); ctx.ellipse(ox, -8, 11, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(ox + 8, -12, 6, 5); ctx.fillRect(ox - 8, -4, 2, 6); ctx.fillRect(ox + 6, -4, 2, 6); } ctx.fillStyle = '#E6DCC2'; ctx.fillRect(-26, -20, 7, 14); ctx.fillStyle = '#C8946A'; ctx.beginPath(); ctx.arc(-22, -23, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    for (let i = 0; i < 9; i++) { const x = (i * 97 + 30) % VW, y = hz - 2; ctx.strokeStyle = '#4A3A26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke(); for (let j = 0; j < 14; j++) { ctx.fillStyle = j % 3 ? 'rgba(250,236,240,.9)' : 'rgba(230,180,190,.9)'; ctx.beginPath(); ctx.arc(x + Math.cos(j * 2.4) * 12 * hsh(i + j), y - 30 + Math.sin(j * 2.4) * 8 * hsh(j), 2.4, 0, Math.PI * 2); ctx.fill(); } }
    ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = texPat(ctx, 'brush'); ctx.scale(.5, .5); ctx.fillRect(0, Y0 * 2, VW * 2, H * 2); ctx.restore();
  }
  // a rider: a horse in Lorraine's caparison, and on it Corwin, or Ganelon
  function rider(x, y, s, look, f, t, walk, gal, lift = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s); const o = { t, walk, gallop: gal, legCol: look.legs, bootCol: look.boots };
    W8.horse('back', o); ctx.save(); ctx.translate(0, -30); drawHumanoid(look, { arm: lift ? -1.6 : .6, Y: .25, weapon: lift ? 'fists' : 'rapier' }); if (lift) W8.hornDraw(10, -58, .8, t, 1, -1.1); ctx.restore(); W8.horse('front', o); ctx.restore();
  }
  function renderEnding(t) {
    const now = performance.now(), dt = Math.min(.05, (now - END.last) / 1000); END.last = now; END.t += dt; const T = END.t;
    if (T < 4.5) { // the colour comes back into the Circle from where he fell, and he walks to the horn
      const h = W8.hornDrop || { x: P.x + 60, y: P.y };
      P.state = Math.abs(P.x - h.x) > 14 ? 'walk' : 'idle'; P.facing = Math.sign(h.x - P.x) || P.facing; if (P.state === 'walk') { P.walk += dt * 9; P.x += P.facing * 50 * dt; }
      if (Math.abs(P.x - h.x) < 16 && !END.got) { END.got = 1; W8.hornDrop = null; sfx('pick'); }
      END.orig(t);
      const r = sm(T / 4.2) * VW * 1.3, cx = (W8.fallX ?? h.x) - camX, cy = h.y;
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .7, 0, 0, Math.PI * 2); ctx.clip();
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(120,200,90,.75)'; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      ctx.globalCompositeOperation = 'color'; ctx.fillStyle = 'rgba(150,170,80,.35)'; ctx.fillRect(0, FLOOR_TOP, VW, VH - FLOOR_TOP); ctx.fillStyle = 'rgba(110,150,200,.3)'; ctx.fillRect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 70; i++) { const x = hsh(i) * VW, y = FLOOR_TOP + 8 + hsh(i + 1) * (VH - FLOOR_TOP - 10), d = Math.hypot(x - cx, (y - cy) / .7); if (d > r) continue; const k = cl01((r - d) / 60); ctx.fillStyle = ['#F6E8EE', '#F2D24A', '#E8F0F6', '#D86A8A'][i % 4]; ctx.beginPath(); ctx.arc(x, y - k * 3, 1.2 + k, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5A8A34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - k * 3); ctx.stroke(); }
      ctx.restore(); paperFrame(); return;
    }
    const k = cl01((T - 4.5) / 1);
    springPanel(k, t, cl01((T - 5) / 6));
    if (T < 5.5) { ctx.fillStyle = `rgba(250,248,240,${1 - k})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF); }
    // Corwin on the near rise with the horn; at its call, the riders come out of the morning mist
    const Hz = Y_OFF + (VH - Y_OFF) * .62, look = heroLook();
    const blowing = T > 6.2 && T < 8.4; if (blowing && !END.blown) { END.blown = 1; if (typeof tone === 'function' && sfxOn && actx) { tn(147, 1.2, 'sawtooth', .07, 196); tn(220, 1, 'sawtooth', .05, 294, .6); tn(294, 1.4, 'triangle', .06, 0, 1.1); } }
    const ridersIn = cl01((T - 8) / 4.5);
    for (let i = 4; i >= 0; i--) { const x = lerp(-120 - i * 50, VW * .52 - i * 46, sm(ridersIn)), y = Hz + 70 + (i % 2) * 14; ctx.save(); ctx.globalAlpha = .5 + .5 * ridersIn; rider(x, y, i ? .62 : .8, i ? Object.assign({}, GANELON, { hair: '#4A3A2A', body: i % 2 ? PAL.or : PAL.gules }) : GANELON, 1, t, t * 12, ridersIn < 1 ? 1 : 0); ctx.restore();
      if (i % 2 === 0) { ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 6, y - 90); ctx.lineTo(x + 6, y - 40); ctx.stroke(); ctx.fillStyle = PAL.or; ctx.beginPath(); ctx.moveTo(x + 6, y - 90); ctx.quadraticCurveTo(x + 20, y - 88 + Math.sin(t * 4 + i) * 2, x + 30, y - 84); ctx.lineTo(x + 6, y - 78); ctx.fill(); ctx.strokeStyle = PAL.gules; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 8, y - 88); ctx.lineTo(x + 24, y - 82); ctx.stroke(); } }
    const mist = 1 - ridersIn; if (mist > 0) { ctx.save(); for (let i = 0; i < 12; i++) softDab(i * 60 - 40, Hz + 60 + (i % 3) * 10, 70, '240,240,236', .5 * mist); ctx.restore(); }
    if (T < 12.5) { ctx.save(); ctx.translate(VW * .8, Hz + 96); ctx.scale(-1.05, 1.05); drawHumanoid(look, { arm: blowing ? -1.6 : .5, Y: .3, weapon: 'fists' }); if (blowing) W8.hornDraw(10, -60, .8, t, 1, -1.1); else W8.hornDraw(-6, -32, .7, t, 1, .5); ctx.restore(); }
    else { const u = cl01((T - 12.5) / 2); rider(lerp(VW * .8, VW * .64, sm(u)), Hz + 96, .95, look, -1, t, u < 1 ? t * 8 : 0, 0); } // Star is brought up for him, and he mounts beside Ganelon
    if (T > 14) { const a = cl01((T - 14) / 1) * (1 - cl01((T - 23) / 1)); ctx.fillStyle = `rgba(20,14,10,${.5 * a})`; ctx.fillRect(0, Y_OFF, VW, (VH - Y_OFF) * .42);
      ctx.textAlign = 'center'; ctx.font = '700 10px Cinzel, Georgia, serif'; let ly = Y_OFF + 22;
      lines().forEach((l, i) => { const la = cl01((T - 14.5 - i * 1.6) / 1) * (1 - cl01((T - 23) / 1)); if (la > 0) { ctx.fillStyle = `rgba(246,240,226,${la})`; ctx.fillText(l, VW / 2, ly); } ly += 17; }); }
    if (T > 24) { const kk = T - 24, a = cl01(kk / 1.2); ctx.fillStyle = `rgba(14,10,8,${.86 * a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      let y = VH + 10 - kk * 26; ctx.textAlign = 'center';
      for (const [s, sz] of CREDITS) { y += sz + 8; if (!s) continue; const fa = cl01((y - Y_OFF) / 40) * cl01((VH - y) / 40); ctx.fillStyle = `rgba(242,232,206,${fa})`; ctx.font = `700 ${sz}px Cinzel, Georgia, serif`; ctx.fillText(s, VW / 2, y); }
      if (y < Y_OFF - 10) finishEnding(); }
    if (T > 2) { ctx.fillStyle = 'rgba(240,232,210,.6)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); }
    paperFrame();
  }
  function skipEnding() { if (!END || END.t < 1.5) return; if (END.t < 14) END.t = 14; else if (END.t < 24) END.t = 24; else finishEnding(); }
  function finishEnding() {
    if (!END) return; const sc = END.sc; END = null; W8.ending = false;
    app.classList.remove('nocontrols');
    save.endings = save.endings || {}; save.endings.lorraine = true; save.w8relic = true; persist();
    sc();
    if (mode === 'win') {
      const k = $('#winOv .kicker'), h2 = $('#winOv .h2'); if (k) k.textContent = 'THE CIRCLE IS BROKEN'; if (h2) h2.textContent = 'You unmade what you made';
      $('#winText').textContent = 'The Black Circle is gone out of Lorraine, and Ganelon\'s war-horn is yours: fill it with blows and it calls Star, the warhorse, to carry you through the next fight. Walking the road again starts a harder cycle, where the horn fills faster and Star stays longer and hits harder; at the end of the dream you may draw another card.';
    }
  }
  W8.startEnding = (sc) => {
    END = { t: 0, last: performance.now(), sc: sc || (() => {}), orig: W8.origDraw }; W8.ending = true; mode = 'ending';
    save.w8relic = true; persist(); clearInput(); if (P) P.w8ride = 0; R.star = null;
    $('#hud').hidden = true; $('#bossbar').hidden = true; app.classList.add('nocontrols'); app.classList.remove('playing');
    if (TRACKS.w8spring) playMusic('w8spring');
  };
  W8.endT = () => END && END.t; W8.skipEnding = skipEnding;
  { const _sc = stageClear; stageClear = function () { if (isLorraineEnd() && !END && !W8.ended) { W8.ended = true; setTimeout(() => { W8.ended = false; }, 4000); W8.startEnding(_sc); return; } return _sc(); }; }
  { const _ds = drawScene; W8.origDraw = _ds; drawScene = function (t) { if (END) { renderEnding(t); return; } return _ds(t); }; }
  window.addEventListener('keydown', (e) => { if (END && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyJ')) { skipEnding(); e.stopPropagation(); } }, true);
  window.addEventListener('pointerdown', () => { if (END) skipEnding(); }, true);
  // where he fell, for the colour coming back
  { const _k = killEnemy; killEnemy = function (e, dir, m) { _k(e, dir, m); if (W8.isGoat && W8.isGoat(e)) W8.fallX = e.x; }; }
})();
