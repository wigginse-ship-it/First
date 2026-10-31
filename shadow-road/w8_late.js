'use strict';
// LORRAINE and the BLACK CIRCLE, the late part: it runs once every other script has loaded (it needs entrances.js,
// thresholds.js, draw.js and ui.js). Its parts:
//   1. W8.dom(): the entrances, landmarks and deaths of the world (art_w8.js)
//   2. (the relic, THE LONG MARCH of the Horn of Lorraine, is in the part after this one)
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

  // ---------------- the horn, where the Goat-Lord dropped it (the relic itself, the Long March, is in the next part) ----------------
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (W8.hornDrop && boss && boss.dead) { const h = W8.hornDrop; list.push([h.y + 1, () => W8.hornDraw(h.x, h.y - 6, .9, t, 1)]); } }; }

  // ======================================================================================================
  // THE ENDING OF LORRAINE
  // ======================================================================================================
  let END = null;
  const isLorraineEnd = () => isLorraine() && STAGES[stageIdx] && STAGES[stageIdx].theme === 'lorraine';
  const lines = () => ['The Circle closed on nothing, and was gone.', 'Where it had been, the ground was only ground; in a week it was green.',
    (W8.vill && W8.vill.seen ? `${W8.vill.saved} of the ${W8.vill.seen} who ran from it across the snow came home.` : 'The people who had run from it came home across the snow.'),
    'Ganelon did not ask him how he had known what was at its heart. He only asked him to keep the horn.'];
  const CREDITS = [['SHADOW ROAD', 22], ['the way through Lorraine', 9], ['', 6], ['THE WINTER FIELDS · THE EDGE OF THE CIRCLE · THE HEART OF THE CIRCLE', 8], ['', 10],
    ['after Roger Zelazny\'s The Chronicles of Amber', 10], ['', 8], ['CORWIN', 11], ['Prince of Amber, who cursed it, and came back', 8], ['', 6], ['GANELON', 11], ['who held its edge', 8], ['', 6],
['THE GOAT-LORD OF THE CIRCLE', 11], ['who only listened', 8], ['', 10],
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
    for (const [dx, w, h] of [[-50, 16, 52], [-28, 22, 40], [-6, 14, 62], [12, 20, 44], [30, 12, 50]]) { const x = VW * .23 + dx; ctx.fillStyle = '#F2EEE4'; ctx.fillRect(x - w / 2, hz - 30 - h, w, h + 4); ctx.fillStyle = '#C8CCD0'; ctx.fillRect(x - w / 2, hz - 30 - h, w * .3, h + 4); ctx.fillStyle = '#3A5A96'; ctx.beginPath(); ctx.moveTo(x - w * .6, hz - 30 - h); ctx.lineTo(x, hz - 30 - h - w * 1.1); ctx.lineTo(x + w * .6, hz - 30 - h); ctx.fill(); }
    W8.arms(VW * .23 + 18, hz - 130, 14, 16);
    // a ploughman and his oxen, blossom on the trees along the field's edge
    const px = ((t * 8) % (VW + 200)) - 100; ctx.save(); ctx.translate(px, hz + 34); ctx.fillStyle = '#5A3A26'; for (const ox of [0, 26]) { ctx.beginPath(); ctx.ellipse(ox, -8, 11, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(ox + 8, -12, 6, 5); ctx.fillRect(ox - 8, -4, 2, 6); ctx.fillRect(ox + 6, -4, 2, 6); } ctx.fillStyle = '#E6DCC2'; ctx.fillRect(-26, -20, 7, 14); ctx.fillStyle = '#C8946A'; ctx.beginPath(); ctx.arc(-22, -23, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    for (let i = 0; i < 9; i++) { const x = (i * 97 + 30) % VW, y = hz - 2; ctx.strokeStyle = '#4A3A26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke(); for (let j = 0; j < 14; j++) { ctx.fillStyle = j % 3 ? 'rgba(250,236,240,.9)' : 'rgba(230,180,190,.9)'; ctx.beginPath(); ctx.arc(x + Math.cos(j * 2.4) * 12 * hsh(i + j), y - 30 + Math.sin(j * 2.4) * 8 * hsh(j), 2.4, 0, Math.PI * 2); ctx.fill(); } }
    ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = texPat(ctx, 'brush'); ctx.scale(.5, .5); ctx.fillRect(0, Y0 * 2, VW * 2, H * 2); ctx.restore();
  }
  // a rider: a horse in Lorraine's caparison, and on it Corwin, or Ganelon
  function rider(x, y, s, look, f, t, walk, gal, lift = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s); const o = { t, walk, gallop: gal, legCol: look.legs, bootCol: look.boots, coat: look.corwin ? 'grey' : 'bay' };
    W8.horse("back", o); ctx.save(); ctx.translate(0, -36 + W8.horseLift(o)); drawHumanoid(look, { arm: lift ? -1.6 : .6, Y: .25, weapon: lift ? 'fists' : 'rapier' }); if (lift) W8.hornDraw(10, -58, .8, t, 1, -1.1); ctx.restore(); W8.horse('front', o); ctx.restore();
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
    else { const u = cl01((T - 12.5) / 2); ctx.save(); ctx.translate(lerp(VW * .8, VW * .7, sm(u)), Hz + 96); ctx.scale(-1.05, 1.05); drawHumanoid(look, { walk: u < 1 ? t * 8 : 0, arm: .5, Y: .3, weapon: 'fists' }); W8.hornDraw(-6, -32, .7, t, 1, .5); ctx.restore(); } // he walks down to meet Ganelon, the horn at his hip
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
      $('#winText').textContent = 'The Black Circle is gone out of Lorraine, and Ganelon\'s war-horn is yours, and with it the Long March: every world you clear without falling adds a verse to the march, a lasting gift of war that holds for the rest of your road, and falling costs you only the newest. Walking the road again starts a harder cycle; the march comes with you, and it can grow longer; at the end of the dream you may draw another card.';
    }
  }
  W8.startEnding = (sc) => {
    END = { t: 0, last: performance.now(), sc: sc || (() => {}), orig: W8.origDraw }; W8.ending = true; mode = 'ending';
    save.w8relic = true; persist(); clearInput();
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
// ======================================================================================================
// THE LONG MARCH: the relic of Lorraine. Ganelon's war-horn (save.w8relic once the Goat-Lord falls) carries a song,
// and the song is the road. Every world cleared without falling in it adds a VERSE to the march: at the clear, two
// verses are laid out as illuminated cards and you take one. A verse is a gift of war that holds from then on, in every
// world, and into New Game+ (save.w8march.v keeps them). Falling costs only the newest verse. The march can hold five
// verses in the cycle it was won in, one more in each cycle after, up to all eight; and every verse is a little
// stronger in each new cycle.
//   CHARGE     the first blow on any foe lands double and puts it on the ground (gold chevrons over the unstruck)
//   BANNER     six blows running without being hit send a gold wave down the lane (six pips over Corwin fill)
//   IRON       a heavy finisher cracks the ground ahead in a line, and the line breaks under everyone on it
//   DRUM       kills close on each other beat a drum: each beat adds to every blow; blows struck on the music's beat
//              land harder and keep the drum going (rings at his feet pulse in time with the music, a count)
//   HUNT       a foe brought low is marked with a red pennon and takes more from every blow
//   THE DEAD   every few kills a rider of Lorraine's dead charges down Corwin's lane (horseshoes count toward it)
//   WATCHFIRE  blows set foes alight; one that dies burning bursts and sets fire to those near it
//   STANDARD   badly hurt, Lorraine's arms burn on the ground under Corwin and every blow lands much harder
// Corwin wears the horn at his belt (l3_horn.js), and blows it at the start of every place he comes to; the HUD shows an
// illuminated scroll of the verses held, the forge lists them. Dev: W8.verse(id or index), W8.verses([...]), W8.march().
(() => {
  if (!window.W8 || !W8.kit) return;
  const { hsh, sm, cl01, PAL } = W8.kit;
  const tn = (...a) => { if (sfxOn && actx) tone(...a); };
  const owned = () => !!(typeof save !== 'undefined' && save && save.w8relic);
  const cyc = () => (typeof save !== 'undefined' && save ? save.cycle || 0 : 0);
  const NGK = () => 1 + .12 * Math.min(5, cyc()); // each new cycle makes every verse a little stronger
  // ---------------- the verses ----------------
  const V = {
    charge:    { name: 'Verse of the Charge', col: '#D6A43A', text: () => `The first blow on any foe lands ×${(2 * NGK()).toFixed(1)} and throws it to the ground. Gold chevrons hang over every foe you have not yet struck.` },
    banner:    { name: 'Verse of the Banner', col: '#A62A26', text: () => `Six blows running without being hit send a wave of gold down your lane, hitting everything in it for ${Math.round(150 * NGK())}% of your blow. Six pips over your head fill as you go.` },
    iron:      { name: 'Verse of Iron', col: '#7A7E86', text: () => `Every heavy finisher cracks the ground ahead in a line; a breath later the line breaks under everyone on it for ${Math.round(90 * NGK())}% of the blow.` },
    drum:      { name: 'Verse of the Drum', col: '#8A5A2E', text: () => `Each kill within three seconds of the last beats the drum: +${Math.round(12 * NGK())}% to every blow per beat, up to six beats. Blows struck on the music's beat land +${Math.round(15 * NGK())}% and keep the drum going. Rings at your feet pulse in time.` },
    hunt:      { name: 'Verse of the Hunt', col: '#C23A1E', text: () => `A foe below a third of its health is marked with a red pennon and takes +${Math.round(60 * NGK())}% from every blow (a lord of a world, +${Math.round(25 * NGK())}%).` },
    dead:      { name: 'Verse of Lorraine\'s Dead', col: '#8EA2C0', text: () => `Every ${deadN()} kills, one of the riders who fell at the Circle charges down your lane, striking all it passes. The scroll counts the kills toward the next.` },
    watchfire: { name: 'Verse of the Watchfire', col: '#E8782A', text: () => `Your blows set foes alight. A foe that dies burning bursts into flame, burning those near it for ${Math.round(30 * NGK())}% of what it was.` },
    standard:  { name: 'Ganelon\'s Standard', col: '#3A5A86', text: () => `Below 40% health Lorraine's arms burn on the ground beneath you, and every blow lands +${Math.round(45 * NGK())}%.` },
  };
  const ORDER = ['charge', 'banner', 'iron', 'drum', 'hunt', 'dead', 'watchfire', 'standard'];
  const deadN = () => cyc() > 0 ? 6 : 7;
  W8.VERSES = V; W8.VORDER = ORDER;
  // one line each, for the horn's call at the start of a place (l3_horn.js)
  const LINE = { charge: () => `First blow on a foe ×${(2 * NGK()).toFixed(1)}, and it falls`, banner: () => 'Six blows unhit: a wave of gold down the lane', iron: () => 'Heavy finishers break the ground ahead',
    drum: () => `Kills beat the drum, +${Math.round(12 * NGK())}% a beat; strike on the music's beat`, hunt: () => `Foes under a third take +${Math.round(60 * NGK())}%`, dead: () => `Every ${deadN()} kills a dead rider charges`,
    watchfire: () => 'Blows set foes alight; the burning burst', standard: () => `Below 40% health, +${Math.round(45 * NGK())}% to every blow` };
  W8.VLINE = (id) => LINE[id] ? LINE[id]() : '';
  const M = () => { if (!save.w8march) save.w8march = { v: [], died: {}, c0: null }; const m = save.w8march; if (!m.v) m.v = []; if (!m.died) m.died = {}; if (owned() && (m.c0 === null || m.c0 === undefined)) m.c0 = cyc(); return m; };
  const has = (id) => owned() && M().v.includes(id);
  const cap = () => { const m = M(); return Math.min(ORDER.length, 5 + Math.max(0, cyc() - (m.c0 ?? cyc()))); };
  W8.verse = (id) => { if (typeof id === 'number') id = ORDER[id]; if (!V[id]) return 'no such verse'; save.w8relic = true; const m = M(); if (!m.v.includes(id)) m.v.push(id); persist(); refreshScroll(true); return V[id].name; };
  W8.verses = (ids) => { save.w8relic = true; M().v = (ids || []).map(i => typeof i === 'number' ? ORDER[i] : i).filter(i => V[i]); persist(); refreshScroll(true); return M().v.slice(); };
  W8.relic = (on = true) => { save.w8relic = !!on; persist(); refreshScroll(true); return on ? 'the Horn of Lorraine is yours' : 'the horn is put away'; };
  W8.march = () => ({ verses: M().v.slice(), cap: cap(), died: Object.assign({}, M().died), ngk: NGK() });

  // ---------------- the live state of a fight ----------------
  const S = W8.S = { banner: 0, bannerT: 0, drum: 0, drumT: 0, kills: 0, waves: [], cracks: [], riders: [], ironT: 0, beat: 0 };
  const reset = () => { S.banner = 0; S.drum = 0; S.drumT = 0; S.waves = []; S.cracks = []; S.riders = []; };
  const live = (e) => e && !e.dead && e.state !== 'enter';
  const standing = () => has('standard') && P && P.hp > 0 && P.hp < maxHp() * .4;
  W8.hasVerse = has; W8.NGK = NGK; W8.standing = standing; W8.owned = owned; W8.M = M;

  // ---------------- every blow ----------------
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    m = m || {};
    if (!owned() || m.w8v || m.trump || m.thorns || m.el || !e || e.dead) return _strike(e, base, dir, m, echo);
    let k = 1; const first = has('charge') && !e.w8struck;
    if (first) k *= 2 * NGK();
    if (has('drum') && S.drum > 0) k *= 1 + .12 * NGK() * S.drum;
    const onBeat = has('drum') && W8.onBeat && W8.onBeat();
    if (onBeat) { k *= 1 + .15 * NGK(); if (S.drum > 0) S.drumT = 3; S.beatHit = .3; }
    if (has('hunt') && e.hp < e.maxHp / 3) k *= 1 + (e.boss ? .25 : .6) * NGK();
    if (standing()) k *= 1 + .45 * NGK();
    k = Math.min(k, e.boss ? 2.6 : 3.4); // (strong, never a one-blow kill of a lord)
    e.w8struck = true;
    const hp0 = e.hp, r = _strike(e, base * k, dir, m, echo), dealt = Math.max(0, hp0 - e.hp);
    if (dealt <= 0) return r;
    if (first) { burst(e.x, e.y, e.z + e.hh * .7, ['#F2D890', '#D6A43A', '#FFFFFF'], 10, 'spark', dir); if (!e.boss && !e.dead) { e.state = 'down'; e.t = .8; e.plan = null; e.vx = dir * 160; } floatText(e.x, e.y, e.z + e.hh + 34, 'CHARGE', '#F2D890', 12); }
    if (has('watchfire') && !e.dead) { e.burn = Math.max(e.burn || 0, 2.6); e.burnBase = Math.max(e.burnBase || 0, Math.max(2, dealt * .15 * NGK())); e.w8fire = 1; }
    if (has('banner')) { S.banner++; S.bannerT = 2.2; S.lastHit = dealt; if (S.banner >= 6) { S.banner = 0; bannerWave(dealt); } }
    if (has('iron') && m.power === 2 && P && m === P.move && S.ironT <= 0) { S.ironT = .6; ironCrack(dealt); }
    return r;
  };
  // being hit breaks the banner's count
  const _pd = playerDamage;
  playerDamage = function (dmg, fromX, big) {
    const h0 = P.hp, r = _pd(dmg, fromX, big);
    if (owned() && P.hp < h0) { S.banner = 0; }
    if (owned() && P.state === 'dead' && !P.w8fell) { P.w8fell = 1; fell(); }
    return r;
  };
  // kills: the drum, the dead, the watchfire's burst
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    const burning = (e.burn || 0) > 0 && e.w8fire;
    _kill(e, dir, m);
    if (!owned() || !e.dead) return;
    if (has('drum')) { S.drum = S.drumT > 0 ? Math.min(6, S.drum + 1) : 1; S.drumT = 3; S.beat = 1; tn(90 + S.drum * 8, .18, 'sine', .12, 60); }
    if (has('dead') && !e.boss) { S.kills++; if (S.kills >= deadN()) { S.kills = 0; rider(); } }
    if (has('watchfire') && burning) fireBurst(e);
  };
  // ---------------- the verses' own works ----------------
  function bannerWave(d) { const f = P.facing; S.waves.push({ x: P.x + f * 16, y: P.y, f, dist: 0, dmg: Math.max(4, Math.round(d * 1.5 * NGK())), hit: new Set() }); sfx('whoosh'); tn(392, .3, 'triangle', .05, 523); floatText(P.x, P.y, 96, 'THE BANNER', '#F2D890', 13); }
  function ironCrack(d) { const f = P.facing; S.cracks.push({ x: P.x + f * 10, y: P.y, f, t: 0, len: 240, dmg: Math.max(4, Math.round(d * .9 * NGK())), done: false, seed: Math.random() * 99 }); sfx('crunch', .6); }
  function rider() { const f = P.facing; S.riders.push({ x: f > 0 ? camX - 80 : camX + VW + 80, y: P.y, f, hit: new Set(), t: 0 }); sfx('roar'); tn(147, .6, 'sawtooth', .05, 196); banner('LORRAINE\'S DEAD', 'A RIDER WHO FELL AT THE CIRCLE CHARGES WITH YOU', 1.2); }
  function fireBurst(e) { const R = 84, base = Math.max(6, Math.round(e.maxHp * .3 * NGK()));
    sfx('slam', .6); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 4, t: .35, max: .35, r: R, col: '#FF9A4A', flat: 1 }); burst(e.x, e.y, 20, ['#FFD27A', '#FF8A3A', '#E84A2A'], 22, 'spark', 0, true);
    for (const o of enemies) { if (o === e || !live(o) || Math.hypot(o.x - e.x, (o.y - e.y) * 2.2) > R) continue; const d = o.boss ? Math.min(base, Math.round(o.maxHp * .015)) : base; strike(o, d, Math.sign(o.x - e.x) || 1, { dmg: d, kb: 160, launch: 120, power: 1, w8v: 1 }); if (!o.dead) { o.burn = Math.max(o.burn || 0, 2.6); o.burnBase = Math.max(o.burnBase || 0, Math.max(2, d * .1)); o.w8fire = 1; } } }
  const inLane = (o, y, w) => live(o) && Math.abs(o.y - y) < w && o.z < 60;
  W8.marchStep = (dt) => {
    if (!P || typeof stage === 'undefined' || !stage) return;
    S.ironT = Math.max(0, S.ironT - dt); S.beatHit = Math.max(0, (S.beatHit || 0) - dt); S.beat = Math.max(0, S.beat - dt * 2.5);
    if (S.bannerT > 0) { S.bannerT -= dt; if (S.bannerT <= 0) S.banner = 0; }
    if (S.drumT > 0) { S.drumT -= dt; if (S.drumT <= 0) S.drum = 0; }
    for (const w of S.waves) { const sp = 460 * dt; w.dist += sp; w.x += w.f * sp; if (Math.random() < .7) dust(w.x, w.y, 1);
      for (const o of enemies) if (inLane(o, w.y, 20) && !w.hit.has(o) && Math.abs(o.x - w.x) < 16 + o.hw) { w.hit.add(o); strike(o, w.dmg, w.f, { dmg: w.dmg, kb: 220, launch: 160, power: 1, w8v: 1 }); } }
    S.waves = S.waves.filter(w => w.dist < 330);
    for (const c of S.cracks) { c.t += dt; if (c.t > .18 && !c.done) { c.done = true; shakeMag = Math.max(shakeMag, 6); sfx('slam', .5);
      for (const o of enemies) { const d = (o.x - c.x) * c.f; if (inLane(o, c.y, 18) && d > -10 && d < c.len) strike(o, c.dmg, c.f, { dmg: c.dmg, kb: 60, launch: 260, power: 2, w8v: 1 }); }
      for (let i = 0; i < 8; i++) burst(c.x + c.f * c.len * (i + .5) / 8, c.y, 2, ['#5A5048', '#C8B890', '#F2D890'], 3, 'rock', c.f); } }
    S.cracks = S.cracks.filter(c => c.t < .9);
    for (const r of S.riders) { r.t += dt; r.x += r.f * 560 * dt; if (Math.random() < .6) dust(r.x - r.f * 20, r.y, 1);
      for (const o of enemies) if (inLane(o, r.y, 26) && !r.hit.has(o) && Math.abs(o.x - r.x) < 26 + o.hw) { r.hit.add(o); const d = o.boss ? Math.round(o.maxHp * .025 * NGK()) : Math.round(o.maxHp * .35 * NGK()); strike(o, d, r.f, { dmg: d, kb: 360, launch: 280, power: 2, w8v: 1 }); } }
    S.riders = S.riders.filter(r => r.t < 3 && r.x > camX - 160 && r.x < camX + VW + 160);
  };
  { const _ap = W8.afterPlayer; W8.afterPlayer = (dt, x0, y0) => { if (_ap) _ap(dt, x0, y0); W8.marchStep(dt); }; }
  // (W8.afterPlayer is called from the art file's updatePlayer wrapper; make sure it exists outside Lorraine too)
  { const _ss = startStage; startStage = function (i) { const r = _ss(i); reset(); S.kills = 0; refreshScroll(true); return r; }; }
  { const _ez = enterZone; enterZone = function (z, Zs) { const r = _ez(z, Zs); reset(); return r; }; }

  // ---------------- what you see: on the foes, on Corwin, in the lane ----------------
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!owned() || !M().v.length) return;
    for (const e of enemies) { if (!live(e)) continue;
      if (has('charge') && !e.w8struck) list.push([e.y + .2, () => onMain(() => chevron(e.x, e.y - e.z - e.hh * (e.boss ? e.size || 1 : e.champ ? 1.3 : 1) - 26, t))]);
      if (has('hunt') && e.hp < e.maxHp / 3) list.push([e.y + .2, () => onMain(() => pennon(e.x + 6, e.y - e.z - e.hh * (e.boss ? e.size || 1 : 1) - 2, t, '#C23A1E', 1.5))]);
      if (has('watchfire') && e.burn > 0 && e.w8fire) list.push([e.y + .3, () => onMain(() => flames(e.x, e.y - e.z, e.hw, t))]); }
    if (P && P.state !== 'dead') { list.push([P.y - 1, () => onMain(() => marchGround(t))]); list.push([P.y + .12, () => onMain(() => marchMarks(t))]); }
    for (const w of S.waves) list.push([w.y, () => onMain(() => drawWave(w, t))]);
    for (const c of S.cracks) list.push([c.y - .5, () => onMain(() => drawCrack(c, t))]);
    for (const r of S.riders) list.push([r.y + .1, () => drawRider(r, t)]); }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const r of S.riders) box(r.x, r.y, 0, 90, 140); }; }
  function chevron(x, y, t) { const b = Math.sin(t * 4 + x * .1) * 1.4; ctx.save(); ctx.translate(x, y + b); ctx.lineJoin = 'round';
    for (const dy of [0, 5]) { ctx.beginPath(); ctx.moveTo(-6, dy - 3); ctx.lineTo(0, dy + 2); ctx.lineTo(6, dy - 3); ctx.strokeStyle = '#3A2410'; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#F2D06A'; ctx.lineWidth = 1.8; ctx.stroke(); } ctx.restore(); }
  function pennon(x, y, t, col, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
    const w = Math.sin(t * 6 + x) * 1.5; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(7, -20 + w, 14, -17 + w); ctx.lineTo(9, -15); ctx.lineTo(14, -12 + w); ctx.quadraticCurveTo(7, -11, 0, -11); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,10,6,.8)'; ctx.lineWidth = .8; ctx.stroke(); ctx.restore(); }
  function flames(x, y, hw, t) { ctx.save(); for (let i = 0; i < 4; i++) { const fx = x + (i - 1.5) * hw * .5, fl = Math.sin(t * 11 + i * 2.1 + x); ctx.fillStyle = `rgba(${i % 2 ? '255,200,90' : '240,110,40'},.8)`; ctx.beginPath(); ctx.moveTo(fx - 3, y - 2); ctx.quadraticCurveTo(fx - 1 + fl, y - 9, fx + fl * 2, y - 15 - (i % 2) * 4); ctx.quadraticCurveTo(fx + 2, y - 7, fx + 3, y - 2); ctx.fill(); } ctx.restore(); }
  // the march itself, about Corwin (the horn at his belt is l3_horn.js): the banner's pips over his head; the drum's rings
  // at his feet, beating in time with the music; and, when he is low, Lorraine's arms burning on the ground under him
  function marchGround(t) {
    const y = P.y;
    if (standing()) { const pul = .75 + .25 * Math.sin(t * 5); ctx.save(); ctx.translate(P.x, y); ctx.scale(1, .32);
      ctx.globalAlpha = .55 + .3 * pul; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.clip(); W8.arms(0, 0, 50, 58, { ow: 0 }); ctx.restore();
      ctx.save(); ctx.strokeStyle = `rgba(242,208,106,${.5 + .4 * pul})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(P.x, y, 35, 11.2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,20,8,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(P.x, y, 37, 11.8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (has('drum')) { const b = W8.beat ? W8.beat() : { ph: (t * 2) % 1 }, pulse = Math.pow(1 - b.ph, 3), act = S.drum > 0 ? Math.min(1, S.drumT / .8) : 0, n = Math.max(1, S.drum);
      ctx.save(); for (let i = 0; i < n; i++) { const r = 16 + i * 6 + pulse * 7 + (S.beatHit > 0 ? 4 : 0); const a = act ? (.4 + .45 * pulse) * (1 - i * .08) * act : .14 + .3 * pulse;
        ctx.strokeStyle = S.beatHit > 0 && i === 0 ? `rgba(242,208,106,${Math.min(1, a + .3)})` : `rgba(138,90,46,${a})`; ctx.lineWidth = 1.2 + pulse * 1.2; ctx.beginPath(); ctx.ellipse(P.x, y + 1, r, r * .3, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore(); }
  }
  function marchMarks(t) {
    const y = P.y - P.z; ctx.save();
    if (has('banner') && S.banner > 0) for (let i = 0; i < 6; i++) { const px = P.x + (i - 2.5) * 6, py = y - 92; ctx.fillStyle = i < S.banner ? '#F2D06A' : 'rgba(40,24,10,.5)'; ctx.beginPath(); ctx.moveTo(px, py - 3); ctx.lineTo(px + 2.4, py); ctx.lineTo(px, py + 3); ctx.lineTo(px - 2.4, py); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3A2410'; ctx.lineWidth = .7; ctx.stroke(); }
    if (has('drum') && S.drum > 0) { const a = Math.min(1, S.drumT / .8), b = W8.beat ? W8.beat() : { ph: 0 }, pop = 1 + .18 * Math.pow(1 - b.ph, 4);
      ctx.save(); ctx.translate(P.x, P.y + 16); ctx.scale(pop, pop); ctx.fillStyle = `rgba(242,216,144,${a})`; ctx.strokeStyle = `rgba(40,20,8,${a})`; ctx.lineWidth = 3; ctx.font = '700 10px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; const s = 'DRUM ×' + S.drum + '  +' + Math.round(12 * NGK() * S.drum) + '%'; ctx.strokeText(s, 0, 0); ctx.fillText(s, 0, 0); ctx.restore(); }
    ctx.restore();
  }
  function drawWave(w, t) { const a = 1 - w.dist / 330; ctx.save(); for (let i = 0; i < 3; i++) { const x = w.x - w.f * i * 12; ctx.beginPath(); ctx.moveTo(x - w.f * 8, w.y - 16); ctx.lineTo(x + w.f * 4, w.y); ctx.lineTo(x - w.f * 8, w.y + 16); ctx.strokeStyle = `rgba(58,36,16,${.8 * a})`; ctx.lineWidth = 5 - i; ctx.stroke(); ctx.strokeStyle = `rgba(242,208,106,${a * (1 - i * .25)})`; ctx.lineWidth = 3 - i * .7; ctx.stroke(); }
    ctx.fillStyle = `rgba(242,208,106,${.18 * a})`; ctx.fillRect(Math.min(w.x, w.x - w.f * 40), w.y - 16, 40, 32); ctx.restore(); }
  function drawCrack(c, t) { const k = Math.min(1, c.t / .18), L = c.len * k, a = 1 - cl01((c.t - .5) / .4), r = (i) => hsh(c.seed + i); ctx.save();
    ctx.strokeStyle = `rgba(30,20,12,${.9 * a})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(c.x, c.y); for (let i = 1; i <= 12; i++) { const u = i / 12; if (u * c.len > L) break; ctx.lineTo(c.x + c.f * u * c.len, c.y + (r(i) - .5) * 8); } ctx.stroke();
    ctx.strokeStyle = `rgba(242,208,106,${.95 * a})`; ctx.lineWidth = 1.6; ctx.stroke();
    if (c.done) for (let i = 0; i < 8; i++) { const x = c.x + c.f * c.len * (i + .5) / 8, h = (22 + r(i + 20) * 16) * (1 - cl01((c.t - .2) / .5)); if (h <= 0) continue; ctx.fillStyle = `rgba(150,136,118,${a})`; ctx.beginPath(); ctx.moveTo(x - 7, c.y); ctx.lineTo(x - 1, c.y - h); ctx.lineTo(x + 6, c.y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = `rgba(30,20,12,${a})`; ctx.lineWidth = .8; ctx.stroke(); }
    ctx.restore(); }
  function drawRider(r, t) { // a rider of Lorraine's dead: horse and man the grey-blue of the Circle's mist, see-through, trailing it
    onMain(() => { const o = { t, walk: t * 14, gallop: 1, legCol: '#6A7A96', bootCol: '#4A566E' }, look = Object.assign({}, heroLook(), { cloak: '#5A6A86', body: '#7A8AA6', legs: '#6A7A96', boots: '#4A566E' });
      for (let i = 2; i >= 0; i--) { ctx.save(); ctx.translate(r.x - r.f * i * 24, r.y); ctx.scale(r.f * 1.05, 1.05); ctx.globalAlpha = i ? .12 : .55; TINT = i ? '#C8D4EA' : null;
        W8.horse('back', o); ctx.save(); ctx.translate(0, -36 + W8.horseLift(o)); drawHumanoid(look, { arm: -.6, Y: .3, weapon: 'sword' }); ctx.restore(); W8.horse('front', o); TINT = null; ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(150,170,210,.25)'; ctx.beginPath(); ctx.ellipse(r.x, r.y - 50, 60, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }); }

  // ---------------- the HUD: an illuminated scroll with the verses held ----------------
  let scrollEl = null, scrollCv = null, lastKey = '';
  function refreshScroll(force) {
    if (!scrollEl) { const tb = document.getElementById('tbarWrap'); if (!tb || !tb.parentNode) return;
      scrollEl = document.createElement('div'); scrollEl.id = 'w8march'; scrollEl.style.cssText = 'margin-top:3px;pointer-events:auto;line-height:0';
      scrollCv = document.createElement('canvas'); scrollCv.style.cssText = 'height:18px;display:block'; scrollEl.appendChild(scrollCv); tb.parentNode.insertBefore(scrollEl, tb.nextSibling); }
    const v = owned() ? M().v : [];
    scrollEl.hidden = !v.length;
    if (!v.length) return;
    const key = v.join() + '|' + (standing() ? 1 : 0) + '|' + S.kills + '|' + S.drum + '|' + cap();
    if (!force && key === lastKey) return; lastKey = key;
    scrollEl.title = 'The Long March · ' + v.length + ' of ' + cap() + ' verses: ' + v.map(id => V[id].name).join(', ');
    const n = v.length, W = 22 + n * 17, H = 18, sc = 2; scrollCv.width = W * sc; scrollCv.height = H * sc; scrollCv.style.width = W + 'px';
    const g = scrollCv.getContext('2d'); g.scale(sc, sc);
    const pg = g.createLinearGradient(0, 0, 0, H); pg.addColorStop(0, '#F2E6C8'); pg.addColorStop(1, '#D8C49A'); g.fillStyle = pg; g.fillRect(5, 2, W - 10, H - 4); // the parchment
    for (const x of [3, W - 3]) { g.fillStyle = '#8A5A2E'; g.beginPath(); g.ellipse(x, H / 2, 3, H / 2 - 1, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#3A2410'; g.lineWidth = .8; g.stroke(); } // its rollers
    g.strokeStyle = '#C9982E'; g.lineWidth = .8; g.strokeRect(6, 3, W - 12, H - 6);
    v.forEach((id, i) => { const lit = id !== 'standard' || standing(); g.save(); g.globalAlpha = lit ? 1 : .5; verseIcon(g, id, 15 + i * 17, H / 2, 6.4); g.restore();
      if (id === 'dead') { g.fillStyle = '#3A2410'; g.font = '700 5px Georgia, serif'; g.textAlign = 'center'; g.fillText(S.kills + '/' + deadN(), 15 + i * 17, H - 1.5); } });
  }
  W8.refreshScroll = refreshScroll;
  { const _ht = hudTick; hudTick = function () { _ht(); refreshScroll(false); }; }
  setTimeout(() => refreshScroll(true), 0);
  // a verse's icon, painted like a Book of Hours' little picture: on a field of its colour, in gold and ink
  function verseIcon(g, id, x, y, r) {
    g.save(); g.translate(x, y);
    g.fillStyle = V[id].col; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#C9982E'; g.lineWidth = Math.max(.7, r * .14); g.stroke(); g.strokeStyle = '#2A1408'; g.lineWidth = Math.max(.4, r * .06); g.beginPath(); g.arc(0, 0, r + r * .1, 0, Math.PI * 2); g.stroke();
    const s = r / 6, gold = '#F2D06A', ink = '#1E120A'; g.lineCap = 'round'; g.lineJoin = 'round'; g.scale(s, s);
    const st = (w, c, f) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); f(); g.stroke(); };
    if (id === 'charge') { for (const dy of [-2, 1.6]) { st(2.4, ink, () => { g.moveTo(-3.4, dy - 1.4); g.lineTo(0, dy + 1.6); g.lineTo(3.4, dy - 1.4); }); st(1.3, gold, () => { g.moveTo(-3.4, dy - 1.4); g.lineTo(0, dy + 1.6); g.lineTo(3.4, dy - 1.4); }); } }
    if (id === 'banner') { st(.9, gold, () => { g.moveTo(-2.6, 4); g.lineTo(-2.6, -4.4); }); g.fillStyle = gold; g.beginPath(); g.moveTo(-2.4, -4.2); g.lineTo(3.6, -3.4); g.lineTo(1.6, -1.8); g.lineTo(3.6, -.4); g.lineTo(-2.4, -.4); g.closePath(); g.fill(); }
    if (id === 'iron') { g.fillStyle = '#D8D8DC'; g.beginPath(); g.moveTo(-3.6, -1.8); g.lineTo(3.6, -1.8); g.lineTo(2, .2); g.lineTo(1, .2); g.lineTo(1.6, 2.2); g.lineTo(-1.6, 2.2); g.lineTo(-1, .2); g.lineTo(-3.6, .2); g.closePath(); g.fill(); st(.8, gold, () => { g.moveTo(-4, 3.6); g.lineTo(-1.6, 2.8); g.lineTo(0, 3.8); g.lineTo(2, 2.8); g.lineTo(4, 3.6); }); }
    if (id === 'drum') { g.fillStyle = '#E8D8B0'; g.beginPath(); g.ellipse(0, -1.4, 3.4, 1.2, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#B8302A'; g.fillRect(-3.4, -1.4, 6.8, 3.6); st(.6, gold, () => { g.moveTo(-3.4, -1); g.lineTo(-1.2, 2); g.lineTo(1.2, -1); g.lineTo(3.4, 2); }); st(.8, '#E8D8B0', () => { g.moveTo(-1, -2.4); g.lineTo(-3.6, -4.8); g.moveTo(1, -2.4); g.lineTo(3.6, -4.8); }); }
    if (id === 'hunt') { st(.9, gold, () => { g.moveTo(-2.4, 4); g.lineTo(-2.4, -4.2); }); g.fillStyle = '#F2E6C8'; g.beginPath(); g.moveTo(-2.2, -4); g.lineTo(3.6, -2.6); g.lineTo(-2.2, -1); g.closePath(); g.fill(); st(.9, gold, () => { g.moveTo(-.4, 3.6); g.lineTo(3.4, .4); g.moveTo(3.4, .4); g.lineTo(1.8, .6); g.moveTo(3.4, .4); g.lineTo(3.2, 2); }); }
    if (id === 'dead') { g.fillStyle = '#EEF2F8'; g.beginPath(); g.moveTo(-2.6, 3.6); g.lineTo(-1.6, -1.4); g.lineTo(.6, -3.8); g.lineTo(1.2, -2.4); g.lineTo(3.6, -1); g.lineTo(3.4, .6); g.lineTo(.8, .2); g.lineTo(.6, 3.6); g.closePath(); g.fill(); g.fillStyle = ink; g.beginPath(); g.arc(1.6, -1.6, .45, 0, Math.PI * 2); g.fill(); }
    if (id === 'watchfire') { st(1, '#2A1E14', () => { g.moveTo(0, 4.2); g.lineTo(0, .6); g.moveTo(-2.4, .6); g.lineTo(2.4, .6); }); g.fillStyle = '#FFD27A'; g.beginPath(); g.moveTo(-2.2, .4); g.quadraticCurveTo(-2.6, -2.6, 0, -4.6); g.quadraticCurveTo(2.6, -2.6, 2.2, .4); g.closePath(); g.fill(); g.fillStyle = '#E84A2A'; g.beginPath(); g.moveTo(-1, .4); g.quadraticCurveTo(-1, -1.6, .2, -2.6); g.quadraticCurveTo(1.2, -1.2, 1, .4); g.fill(); }
    if (id === 'standard') { g.restore(); g.save(); g.translate(x, y); const old = ctx; ctx = g; try { W8.arms(0, 0, r * 1.1, r * 1.25, { ow: .6 }); } finally { ctx = old; } }
    g.restore();
  }
  W8.verseIcon = verseIcon;

  // ---------------- earning and losing verses ----------------
  function fell() { const m = M(); m.died[stageIdx] = true; if (!m.v.length) { persist(); return; } const id = m.v.pop(); persist(); refreshScroll(true);
    banner('THE MARCH FALTERS', (V[id].name + ' IS LOST').toUpperCase(), 2.6); W8.lostVerse = id; }
  { const _go = gameOver; gameOver = function () { _go(); if (W8.lostVerse) { const el = $('#overText'); if (el) el.textContent += ` The march falters: ${V[W8.lostVerse].name} is lost.`; W8.lostVerse = null; } }; }
  // a world cleared without falling in it: once the world's own ending is over and the forge (or the win card) is up, two
  // verses are laid out over it as illuminated cards, and you take one
  let CH = null;
  const _sc = stageClear;
  stageClear = function () {
    const m = owned() ? M() : null, i = stageIdx;
    if (m) { if (!m.died[i] && m.v.length < cap() && ORDER.some(id => !m.v.includes(id))) W8.pendingVerse = { i, name: STAGES[i] ? STAGES[i].name : 'the world' }; delete m.died[i]; persist(); }
    return _sc();
  };
  const offerNow = () => { const pv = W8.pendingVerse; if (!pv || CH || !owned()) return; W8.pendingVerse = null; const m = M(); if (m.v.length >= cap()) return;
    const pool = ORDER.filter(id => !m.v.includes(id)); if (!pool.length) return; openChoice(pool.sort(() => Math.random() - .5).slice(0, Math.min(2, pool.length)), () => { if (typeof renderForge === 'function' && mode === 'forge') renderForge(); }, pv.name); };
  { const _of = openForge; openForge = function (k) { const r = _of(k); offerNow(); return r; }; }
  { const _wc = winCard; winCard = function (i) { const r = _wc(i); setTimeout(offerNow, 0); return r; }; }
  function openChoice(offer, then, where) {
    clearInput();
    const ov = document.createElement('div'); ov.id = 'w8verseOv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(14,9,6,.78);font-family:Cinzel,Georgia,serif;color:#F2E6C8;padding:8px;box-sizing:border-box';
    const head = document.createElement('div'); head.style.cssText = 'text-align:center;margin-bottom:8px';
    head.innerHTML = `<div style="font-size:11px;letter-spacing:.18em;color:#D6A43A">THE LONG MARCH · VERSE ${M().v.length + 1} OF ${cap()}</div><div style="font-size:clamp(15px,3.4vw,22px);margin-top:3px">The horn takes up a new verse</div><div style="font-size:10px;opacity:.75;margin-top:2px">You cleared ${where} without falling. Choose one.</div>`;
    ov.appendChild(head);
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:min(3vw,18px);justify-content:center;flex-wrap:nowrap'; ov.appendChild(row);
    let sel = 0; const cards = [];
    const pickIt = (k) => { if (!CH) return; const id = offer[k]; const m = M(); if (!m.v.includes(id)) m.v.push(id); persist(); CH = null; ov.remove(); window.removeEventListener('keydown', onKey, true);
      refreshScroll(true); banner(V[id].name.toUpperCase(), 'A NEW VERSE OF THE LONG MARCH', 2.4); sfx('trump'); tn(392, .5, 'triangle', .06); tn(523, .7, 'triangle', .05, 0, .2); then(); };
    offer.forEach((id, k) => {
      const c = document.createElement('button'); c.type = 'button';
      c.style.cssText = 'width:min(40vw,230px);background:linear-gradient(#2A1C12,#1A120C);border:2px solid #C9982E;border-radius:6px;padding:8px 8px 10px;color:#F2E6C8;font-family:inherit;cursor:pointer;text-align:center;box-shadow:0 0 0 1px #3A2410 inset';
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 220; cv.style.cssText = 'width:100%;display:block;border:1px solid #C9982E;border-radius:3px';
      paintCard(cv, id);
      c.appendChild(cv);
      const nm = document.createElement('div'); nm.textContent = V[id].name; nm.style.cssText = 'font-size:clamp(11px,2.4vw,15px);margin:6px 0 3px;color:#F2D890';
      const tx = document.createElement('div'); tx.textContent = V[id].text(); tx.style.cssText = 'font-family:Georgia,serif;font-size:clamp(9px,1.9vw,12px);line-height:1.3;opacity:.9';
      c.appendChild(nm); c.appendChild(tx);
      c.addEventListener('click', () => pickIt(k)); c.addEventListener('mouseenter', () => { sel = k; mark(); });
      row.appendChild(c); cards.push(c);
    });
    const mark = () => cards.forEach((c, k) => { c.style.outline = k === sel ? '2px solid #F2D890' : 'none'; c.style.transform = k === sel ? 'translateY(-3px)' : ''; });
    const onKey = (e) => { if (!CH) return; const c = e.code; if (c === 'ArrowLeft' || c === 'KeyA') { sel = 0; mark(); } else if (c === 'ArrowRight' || c === 'KeyD') { sel = Math.min(cards.length - 1, 1); mark(); } else if (c === 'Digit1') pickIt(0); else if (c === 'Digit2' && cards[1]) pickIt(1); else if (c === 'Enter' || c === 'Space' || c === 'KeyJ' || c === 'NumpadEnter') pickIt(sel); else return; e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('keydown', onKey, true); mark();
    CH = { offer, pick: pickIt }; W8.choice = CH;
    (document.getElementById('app') || document.body).appendChild(ov);
  }
  // an illuminated card for a verse: its picture in a gilt frame, on vellum
  function paintCard(cv, id) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#F4EAD0'); bg.addColorStop(1, '#DCC8A0'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#C9982E'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = '#3A2410'; g.lineWidth = 1.5; g.strokeRect(14, 14, w - 28, h - 28);
    for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? '#3A5A86' : '#A62A26'; g.beginPath(); g.arc(24 + i * ((w - 48) / 25), 24, 2.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(24 + i * ((w - 48) / 25), h - 24, 2.6, 0, Math.PI * 2); g.fill(); } // a border of tooled dots, in Lorraine's enamels
    for (const [vx, vy] of [[40, 60], [w - 40, 60], [40, h - 60], [w - 40, h - 60]]) { g.strokeStyle = '#5A7A34'; g.lineWidth = 2; g.beginPath(); g.arc(vx, vy, 12, 0, Math.PI * 1.6); g.stroke(); g.fillStyle = '#C23A1E'; g.beginPath(); g.arc(vx + 10, vy - 6, 3.4, 0, Math.PI * 2); g.fill(); } // vine and berries in the margins
    verseIcon(g, id, w / 2, h / 2, 64);
  }

  // ---------------- the forge: the march, listed ----------------
  { const _rf = renderForge; renderForge = function (note) { _rf(note); let sec = document.getElementById('w8marchForge');
    const v = owned() ? M().v : [];
    if (!owned()) { if (sec) sec.remove(); return; }
    if (!sec) { const foot = document.querySelector('#forgeOv .forge-foot'); if (!foot) return; sec = document.createElement('div'); sec.id = 'w8marchForge'; foot.parentNode.insertBefore(sec, foot); }
    sec.innerHTML = `<h3 class="h3">The Long March</h3><p class="small">The Horn of Lorraine: ${v.length} of ${cap()} verses. Clear a world without falling to add a verse; falling loses the newest. The march comes with you into every new cycle.</p>`;
    const list = document.createElement('div'); list.className = 'cards';
    for (const id of v) { const d = document.createElement('div'); d.className = 'card'; d.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; cv.style.cssText = 'width:32px;height:32px;flex:none'; const g = cv.getContext('2d'); verseIcon(g, id, 32, 32, 28);
      const tx = document.createElement('div'); tx.innerHTML = `<b>${V[id].name}</b><br><em>${V[id].text()}</em>`; d.appendChild(cv); d.appendChild(tx); list.appendChild(d); }
    sec.appendChild(list); }; }
})();
// ======================================================================================================
// THE HORN OF LORRAINE, worn and blown. Once the Goat-Lord falls (save.w8relic), Ganelon's war-horn hangs at Corwin's
// belt: a curved ox-horn banded in silver and gold on a leather strap, riding with his hips in every pose. At the start
// of every place, while the Long March holds verses, he lifts it and blows: the fight waits; out of the bell pours the
// grey mist of the Circle, and in the mist each verse's sign (gold chevrons, a wisp of gold cloth, iron sparks, drum
// rings, a red hunting arrow, riders of the dead, embers, Lorraine's arms); a scroll says what each verse does. Any
// button cuts it short. The drum's beat is the music's beat: W8.beat() reads the music's own step clock (music.js).
(() => {
  if (!window.W8 || !W8.kit || !W8.VERSES) return;
  const { cl01, hsh } = W8.kit, V = W8.VERSES;
  const owned = () => W8.owned(), verses = () => (owned() ? W8.M().v : []);
  const cyc = () => (typeof save !== 'undefined' && save ? save.cycle || 0 : 0);

  // ---------------- the beat clock ----------------
  // where the music is in its beat, 0 at the beat's stroke; read back from the scheduler's next step (musicStep at
  // musicNext) to the step sounding now; with the music off, a steady 120 a minute
  W8.beat = () => {
    try {
      if (actx && musicOn && musicCur && COMPILED[musicCur]) {
        const tr = COMPILED[musicCur], now = actx.currentTime - (actx.outputLatency || 0);
        let s = musicStep, st = musicNext, n = 0;
        while (st > now && n++ < 96) { s = (s - 1 + tr.steps) % tr.steps; st -= tr.sd[s]; }
        if (n < 96) { const sd = tr.sd[s], fr = cl01((now - st) / sd); return { ph: ((s % 4) + fr) / 4, per: sd * 4, src: 'music', step: s }; }
      }
    } catch (e) {}
    const per = .5; return { ph: (performance.now() / 1000 / per) % 1, per, src: 'fixed' };
  };
  W8.onBeat = () => { const b = W8.beat(); return Math.min(b.ph, 1 - b.ph) * b.per < Math.min(.09, b.per * .12); };

  // ---------------- the horn itself ----------------
  // drawn along a curve from the mouthpiece (0,0) to the bell (len,0), bowed by bend; dark at the tip, ivory at the bell
  function horn(len, w1, bend, glow) {
    const N = 10, pt = (u) => [len * u, 2 * (1 - u) * u * bend], tan = (u) => { const a = pt(Math.max(0, u - .02)), b = pt(Math.min(1, u + .02)); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    const wd = (u) => .5 + (w1 - .5) * Math.pow(u, 1.5), L = [], R = [];
    for (let i = 0; i <= N; i++) { const u = i / N, [x, y] = pt(u), a = tan(u) + Math.PI / 2, w = wd(u) / 2; L.push([x + Math.cos(a) * w, y + Math.sin(a) * w]); R.push([x - Math.cos(a) * w, y - Math.sin(a) * w]); }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const p of L) ctx.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
    if (FLASH || TINT) ctx.fillStyle = C('#E8DCB8'); else { const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, '#2E2016'); g.addColorStop(.35, '#8A6A44'); g.addColorStop(.75, '#D8C49A'); g.addColorStop(1, '#F2E8CC'); ctx.fillStyle = g; }
    ctx.fill(); outline(.6);
    if (!FLASH && !TINT) { ctx.strokeStyle = 'rgba(255,248,230,.5)'; ctx.lineWidth = .4; ctx.beginPath(); for (let i = 3; i <= N - 1; i++) { const p = L[i]; const q = pt(i / N); const x = (p[0] + q[0]) / 2, y = (p[1] + q[1]) / 2; i === 3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); } // the shine along its back
    for (const [u, col] of [[.1, '#D8DCE2'], [.5, '#D6A43A'], [.96, '#D6A43A']]) { const [x, y] = pt(u), a = tan(u) + Math.PI / 2, w = wd(u) / 2 + .35; ctx.lineCap = 'butt';
      ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * w, y + Math.sin(a) * w); ctx.lineTo(x - Math.cos(a) * w, y - Math.sin(a) * w); ctx.stroke();
      ctx.strokeStyle = C(col); ctx.lineWidth = .9; ctx.stroke(); }
    { const [x, y] = pt(1), a = tan(1); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, .9, w1 / 2 + .3, 0, 0, Math.PI * 2); ctx.fillStyle = C('#3A2614'); ctx.fill(); outline(.5);
      if (glow && !FLASH && !TINT) { ctx.fillStyle = `rgba(220,230,245,${.5 * glow})`; ctx.beginPath(); ctx.ellipse(.6, 0, .6, w1 / 2, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    return pt;
  }
  W8.hornArt = horn;

  // at his belt: hung by a strap from the sword belt at the back of his near hip, the bell behind him, swinging as he moves.
  // The belt (CORWIN.parts.waist.swordbelt, wrapped here, not edited) notes where his hips are; the horn is painted just
  // before his head, so it lies over the cloak and under his near arm
  const SB = typeof CORWIN !== 'undefined' && CORWIN.parts && CORWIN.parts.waist && CORWIN.parts.waist.swordbelt;
  function beltHorn(L, g) {
    if (!owned() || W8.hornInHand || !L || !L.corwin) return;
    const { HIP, CS, Y } = g, th = 2.3, fx = 9 * .8 * Math.cos(th), lz = 9 * Math.sin(th), x = fx * CS - lz * Y;
    const sw = Math.sin(g.walk || 0) * (g.gait ? .16 : 0) + Math.sin((g.t || 0) * 1.3) * .03, ly = HIP + 3.4 - 3 * Math.sin(th);
    const sx = .45 + .55 * CS;
    ctx.save(); ctx.translate(x, ly); ctx.rotate(sw - (g.LEAN || 0) * .4);
    const ox = 2, oy = 3, r = .95, c = Math.cos(r), si = Math.sin(r), at = (lx, lyy) => [ox - sx * (lx * c - lyy * si), oy + lx * si + lyy * c];
    const p1 = at(2.2, -1.1), p2 = at(9.4, -3);
    ctx.lineCap = 'round'; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p1[0], p1[1]); ctx.moveTo(-1.5, 0); ctx.quadraticCurveTo(p2[0] + 1, (p2[1]) * .4, p2[0], p2[1]); ctx.stroke();
    ctx.strokeStyle = C('#6A4424'); ctx.lineWidth = 1; ctx.stroke();
    ctx.translate(ox, oy); ctx.scale(-sx, 1); ctx.rotate(r); horn(17, 5.2, -3.4, 0);
    ctx.restore();
  }
  let PEND = null;
  if (SB && !SB.w8horn) { const _b = SB.belts; SB.w8horn = 1;
    SB.belts = function (L, g) { _b.call(this, L, g); PEND = owned() && !W8.hornInHand && L && L.corwin ? { m: ctx.getTransform(), L, g } : null; }; }
  const paintPend = () => { if (!PEND) return; const q = PEND; PEND = null; ctx.save(); try { ctx.setTransform(q.m); beltHorn(q.L, q.g); } catch (e) {} ctx.restore(); };
  { const _h = drawCorwinHead; drawCorwinHead = function (look, hy) { paintPend(); return _h(look, hy); }; }
  { const _h = drawCorwinHeadTurn; drawCorwinHeadTurn = function (look, hy, Y) { paintPend(); return _h(look, hy, Y); }; }

  // in his hand: the weapon 'w8horn' is the horn held in his fist, the mouthpiece at his lips; drawn in his own upright
  // frame so it points where the blow wants it whatever his forearm's angle; the bell's place is kept for the mist
  const _dw = drawWeapon;
  drawWeapon = function (kind, pose) {
    if (kind !== 'w8horn') return _dw(kind, pose);
    const CDw = typeof CLOAK_DRAW !== 'undefined' ? CLOAK_DRAW : null;
    if (CDw && CDw.Binv) { try {
      const M = ctx.getTransform(), hp = M.transformPoint(new DOMPoint(17.1, 0)), F = CDw.Binv.inverse().scale(CDw.facing, 1), hf = F.inverse().transformPoint(hp);
      ctx.save(); ctx.setTransform(F); ctx.translate(hf.x, hf.y); ctx.rotate(pose.hornA ?? -.35);
      const pt = horn(19, 5, -3.6, pose.hornGlow || 0), b = pt(1), bw = new DOMPoint(b[0], b[1]);
      const bwf = new DOMMatrix().translate(hf.x, hf.y).rotate((pose.hornA ?? -.35) * 180 / Math.PI).transformPoint(bw);
      if (pose.live) W8.bellAt = { x: CDw.wx + CDw.facing * bwf.x, y: CDw.wy + bwf.y, f: CDw.facing };
      ctx.restore(); } catch (e) {} }
    return _dw('fists', pose);
  };

  // ---------------- the horn's call ----------------
  // each verse has its own short call on the horn, in its natural notes ([hertz, start, length] in seconds); the horn
  // blows the call of the verse picked last
  const MELODY = {
    charge:    [[196, 0, .14], [261.6, .14, .14], [329.6, .28, .14], [392, .42, .6]], // a quick rising charge
    banner:    [[293.7, 0, .2], [392, .2, .32], [392, .54, .14], [440, .68, .16], [493.9, .84, .6]], // a proud climb
    iron:      [[196, 0, .26], [196, .3, .14], [146.8, .46, .34], [196, .84, .6]], // low and stern
    drum:      [[392, 0, .12], [392, .2, .12], [392, .4, .12], [293.7, .6, .16], [392, .8, .5]], // on the beat
    hunt:      [[587.3, 0, .16], [493.9, .16, .16], [392, .32, .2], [493.9, .52, .16], [587.3, .68, .62]], // the hunting call
    dead:      [[293.7, 0, .36], [349.2, .36, .36], [329.6, .72, .3], [293.7, 1.02, .8]], // a slow fall, in the minor
    watchfire: [[261.6, 0, .2], [329.6, .2, .2], [392, .4, .2], [523.3, .6, .7]], // warm, rising
    standard:  [[196, 0, .18], [293.7, .2, .18], [392, .4, .3], [293.7, .72, .16], [392, .9, .7]], // a regal fanfare
  };
  function hornCall(short, id) {
    if (typeof sfxOn === 'undefined' || !sfxOn || !actx) return;
    try {
      const t0 = actx.currentTime + .03, lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; lp.connect(actx.destination);
      const notes = MELODY[id] || (short ? [[196, 0, .26], [293.7, .24, .55]] : [[196, 0, .3], [293.7, .3, .3], [392, .62, .85]]);
      lp.frequency.setValueAtTime(500, t0);
      for (const [f, d, L] of notes) { lp.frequency.setTargetAtTime(1900, t0 + d, .05); lp.frequency.setTargetAtTime(900, t0 + d + L * .6, .1);
        for (const [type, det, v] of [['sawtooth', 0, .055], ['sawtooth', 7, .04], ['triangle', -1200, .05]]) {
          const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.detune.value = det;
          o.frequency.setValueAtTime(f * .94, t0 + d); o.frequency.exponentialRampToValueAtTime(f, t0 + d + .07);
          g.gain.setValueAtTime(.0001, t0 + d); g.gain.exponentialRampToValueAtTime(v, t0 + d + .05); g.gain.setValueAtTime(v, t0 + d + L - .1); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + L);
          o.connect(g).connect(lp); o.start(t0 + d); o.stop(t0 + d + L + .03); } }
    } catch (e) {}
  }

  // ---------------- the call at the start of a place ----------------
  let CINE = null, QUEUE = null, panel = null;
  const mist = W8.mist = [];
  W8.cine = () => CINE;
  W8.hornCine = (full = true) => { QUEUE = { full }; return 'queued'; };
  // (only at the start of each world now: the call is not blown again at every place within it)
  { const _ss = startStage; startStage = function (i) { CINE = null; endPanel(); mist.length = 0; W8.hornInHand = false; const r = _ss(i); QUEUE = { full: true }; return r; }; }
  function begin(full) {
    const v = verses().slice(), ng = cyc() > 0;
    const T = full ? (ng ? 2.3 : 2.9) + Math.min(.6, v.length * .06) + .8 : (ng ? 1.4 : 1.75); // (+.8: room for the verse's name to leave the horn, word by word)
    const a = full ? .22 : .14, b = full ? .5 : .32;
    CINE = { t: 0, T, a, b, blow: b + .05, end: T - (full ? .38 : .26), full, v, called: false, spawn: {} };
    W8.bellAt = null; P.state = 'idle'; P.vx = 0; P.vy = 0; clearInput(); for (const k in pressed) pressed[k] = false;
    // the place's name waits until the call is done
    HELD = null; if (typeof bannerT !== 'undefined' && bannerT > 0) { HELD = { t: $('#bt').textContent, s: $('#bs').textContent, d: bannerT }; bannerT = 0; $('#banner').classList.remove('on'); }
    showPanel(v, full, T);
  }
  let HELD = null;
  function finish() { CINE = null; W8.hornInHand = false; endPanel(); if (HELD && mode === 'play') banner(HELD.t, HELD.s, Math.max(1.8, HELD.d)); HELD = null; }
  function step(dt) {
    const c = CINE; c.t += dt;
    if (c.t > .3 && c.t < c.end) for (const k in pressed) if (pressed[k]) { c.t = Math.max(c.t, c.end); endPanel(); break; }
    W8.hornInHand = c.t > c.a * .75 && c.t < c.T - .06;
    if (!c.called && c.t >= c.blow) { c.called = true; hornCall(!c.full, c.v[c.v.length - 1]); shakeMag = Math.max(shakeMag, 2); }
    if (c.t >= c.blow && c.t < c.end) emit(c, dt);
    if (c.t >= c.T) finish();
  }
  // the words out of the bell: the name of the verse picked last (the Long March, if none yet), each word let go when the
  // one before has drifted far enough to clear it
  const WORD_PX = 15.6, WORD_V = 110;
  function wordsFor(c, f) {
    const id = c.v[c.v.length - 1], name = id && V[id] ? V[id].name : 'The Long March', ws = name.split(' ');
    const seq = f > 0 ? ws.slice().reverse() : ws, out = []; let at = c.blow + .06, prevW = 0;
    try { ctx.save(); ctx.font = `700 ${WORD_PX}px Cinzel, Georgia, serif`; } catch (e) {}
    seq.forEach((w, i) => { let wd = w.length * 9; try { wd = ctx.measureText(w).width; } catch (e) {} if (i) at += (prevW / 2 + wd / 2 + 12) / WORD_V; out.push({ w, at }); prevW = wd; });
    try { ctx.restore(); } catch (e) {}
    return out;
  }
  function emit(c, dt) {
    const b = W8.bellAt || { x: P.x + P.facing * 22, y: P.y - 72, f: P.facing }, f = b.f, R = Math.random;
    if (R() < dt * 34) mist.push({ k: 'mist', x: b.x, y: b.y, vx: f * (60 + R() * 70), vy: -10 + R() * 26, t: 0, max: 1.3 + R() * .6, s: 5 + R() * 5, gy: P.y });
    // the song's name flows out of the bell, word by word, carried on the mist
    // (the first word out goes furthest: out of a horn pointing right the last word leads, so the line reads left to right)
    if (!c.words) c.words = wordsFor(c, f);
    c.words.forEach((o, i) => { const k = 'w' + i; if (!c.spawn[k] && c.t >= o.at) { c.spawn[k] = 1; mist.push({ k: 'word', txt: o.w, x: b.x + f * 6, y: b.y - 4, vx: f * WORD_V, vy: -9, t: 0, max: Math.max(.9, c.end - o.at + .7), f, ph: i * 1.7, gy: P.y }); } }); // (each word stays until the call is over, so the whole name can be read)
    const span = c.end - c.blow, n = Math.max(1, c.v.length), slot = Math.min(.55, span * .8 / n);
    c.v.forEach((id, i) => { const t0 = c.blow + i * slot * .85, u = c.t - t0; if (u < 0 || u > slot + .15) return; motif(id, b, f, u, c.spawn, dt); });
  }
  function motif(id, b, f, u, sp, dt) {
    const R = Math.random, once = (k) => { if (sp[k]) return false; sp[k] = 1; return true; }, base = { x: b.x, y: b.y, t: 0, gy: P.y };
    if (id === 'charge' && R() < dt * 14) mist.push(Object.assign({}, base, { k: 'chev', vx: f * (150 + R() * 60), vy: -20 + R() * 40, max: .9, f }));
    if (id === 'banner' && once('banner')) mist.push(Object.assign({}, base, { k: 'cloth', vx: f * 110, vy: -14, max: 1.3, f }));
    if (id === 'iron' && R() < dt * 50) mist.push(Object.assign({}, base, { k: 'spark', vx: f * (80 + R() * 140), vy: -60 + R() * 60, g: 260, max: .5 + R() * .3 }));
    if (id === 'drum' && once('drum' + Math.floor(u / Math.max(.18, W8.beat().per)))) mist.push(Object.assign({}, base, { k: 'ring', vx: f * 70, vy: 0, max: .7, f }));
    if (id === 'hunt' && once('hunt')) mist.push(Object.assign({}, base, { k: 'arrow', vx: f * 260, vy: -8, max: .9, f }));
    if (id === 'dead' && once('dead' + (u > .22 ? 1 : 0))) mist.push(Object.assign({}, base, { k: 'rider', x: b.x - f * 10, y: P.y + (u > .22 ? -10 : 8), vx: f * 210, vy: 0, max: 1.3, f }));
    if (id === 'watchfire' && R() < dt * 30) mist.push(Object.assign({}, base, { k: 'ember', vx: f * (40 + R() * 70), vy: -40 - R() * 50, max: .9 + R() * .4, ph: R() * 9 }));
    if (id === 'standard' && once('standard')) mist.push(Object.assign({}, base, { k: 'arms', vx: f * 50, vy: -24, max: 1.3, f }));
  }
  function stepMist(dt) {
    for (const m of mist) { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.g) m.vy += m.g * dt; if (m.k === 'mist') { m.vx *= 1 - dt * 1.2; m.s += dt * 14; } if (m.k === 'ember') m.vx *= 1 - dt; if (m.k === 'word') { m.vy *= 1 - dt * .4; } }
    for (let i = mist.length - 1; i >= 0; i--) if (mist[i].t >= mist[i].max) mist.splice(i, 1);
  }
  function drawMist(t) {
    for (const pass of [0, 1]) for (const m of mist) {
      if ((m.k === 'word') !== (pass === 1)) continue; // (the words last, over the mist)
      const u = m.t / m.max, a = Math.min(1, m.t / .12) * (1 - u); ctx.save();
      if (m.k === 'mist') { ctx.fillStyle = `rgba(150,164,192,${.3 * a})`; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.s * 1.4, m.s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(236,242,252,${.24 * a})`; ctx.beginPath(); ctx.ellipse(m.x - 2, m.y - 2, m.s * .8, m.s * .55, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (m.k === 'chev') { ctx.translate(m.x, m.y); ctx.scale(m.f, 1); ctx.globalAlpha = a; ctx.lineJoin = 'round'; for (const w of [3.6, 1.8]) { ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(3, 0); ctx.lineTo(-3, 6); ctx.strokeStyle = w > 2 ? '#3A2410' : '#F2D06A'; ctx.lineWidth = w; ctx.stroke(); } }
      else if (m.k === 'cloth') { ctx.translate(m.x, m.y); ctx.scale(m.f, 1); ctx.globalAlpha = .75 * a; const L = 30 + u * 40; ctx.beginPath(); ctx.moveTo(0, 0);
        for (let i = 0; i <= 10; i++) { const x = -L * i / 10, y = Math.sin(t * 8 + i * .8) * 3 * (i / 10); ctx.lineTo(x, y - 5); } for (let i = 10; i >= 0; i--) { const x = -L * i / 10, y = Math.sin(t * 8 + i * .8) * 3 * (i / 10); ctx.lineTo(x, y + 4 - i * .25); } ctx.closePath();
        ctx.fillStyle = 'rgba(242,208,106,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(166,42,38,.7)'; ctx.lineWidth = 1; ctx.stroke(); }
      else if (m.k === 'spark') { ctx.strokeStyle = `rgba(230,232,240,${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * .03, m.y - m.vy * .03); ctx.stroke(); ctx.fillStyle = `rgba(122,126,134,${a})`; ctx.fillRect(m.x - .8, m.y - .8, 1.6, 1.6); }
      else if (m.k === 'ring') { const r = 6 + u * 30; ctx.strokeStyle = `rgba(138,90,46,${a})`; ctx.lineWidth = 2.2 * (1 - u) + .6; ctx.beginPath(); ctx.ellipse(m.x, m.y, r * .45, r, 0, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = `rgba(242,208,106,${.6 * a})`; ctx.lineWidth = .8; ctx.stroke(); }
      else if (m.k === 'arrow') { ctx.translate(m.x, m.y); ctx.scale(m.f, 1); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(194,58,30,.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.strokeStyle = '#C23A1E'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#C23A1E'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -3.4); ctx.lineTo(3, 3.4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-27, -4); ctx.lineTo(-24, 0); ctx.lineTo(-27, 4); ctx.closePath(); ctx.fill(); }
      else if (m.k === 'ember') { const x = m.x + Math.sin(t * 6 + m.ph) * 3; ctx.fillStyle = `rgba(255,${150 + Math.round(70 * (1 - u))},70,${a})`; ctx.beginPath(); ctx.arc(x, m.y, 1.4 + (1 - u), 0, Math.PI * 2); ctx.fill(); }
      else if (m.k === 'word') { // a word of the song's name: swelling from the bell, drifting on a slow wave, fading
        const sc = .55 + .65 * Math.min(1, m.t / .5), x = m.x, y = m.y + Math.sin(t * 2.6 + m.ph) * 3.5, aw = Math.min(1, m.t / .12) * Math.min(1, (m.max - m.t) / .7); // (full until its last moments: the name reads whole)
        ctx.globalAlpha = aw; ctx.font = `700 ${Math.round(13 * sc)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(32,22,14,.75)'; ctx.strokeText(m.txt, x, y);
        ctx.fillStyle = '#F2DFA6'; ctx.fillText(m.txt, x, y); ctx.globalAlpha = aw * .45; ctx.fillStyle = '#FFF8E2'; ctx.fillText(m.txt, x - .6, y - .6); }
      else if (m.k === 'arms') { ctx.translate(m.x, m.y); ctx.globalAlpha = .7 * a; ctx.scale(.9 + u * .3, .9 + u * .3); W8.arms(0, 0, 22, 26, { ow: .6 }); }
      else if (m.k === 'rider' && W8.horse) { const o = { t, walk: t * 14, gallop: 1, legCol: '#6A7A96', bootCol: '#4A566E' }, look = Object.assign({}, heroLook(), { cloak: '#5A6A86', body: '#7A8AA6', legs: '#6A7A96', boots: '#4A566E' });
        for (let i = 1; i >= 0; i--) { ctx.save(); ctx.translate(m.x - m.f * i * 18, m.y); ctx.scale(m.f * .72, .72); ctx.globalAlpha = (i ? .1 : .42) * a; TINT = '#C8D4EA';
          try { W8.horse('back', o); ctx.save(); ctx.translate(0, -36 + W8.horseLift(o)); drawHumanoid(look, { arm: -.6, Y: .3, weapon: 'sword', noCloak: 1 }); ctx.restore(); W8.horse('front', o); } finally { TINT = null; } ctx.restore(); } }
      ctx.restore();
    }
  }
  // the pose: hand to the horn at his belt, up to his lips, the chest lifted as he blows, and back
  function cinePose() {
    const c = CINE, t = c.t, pose = { walk: 0, weapon: 'w8horn', tier: 1, breath: 0 };
    const K = [[0, 1.1, 0, 0], [c.a, 1.55, .55, .02], [c.b, .55, 2.45, -.1], [c.end, .55, 2.45, -.16], [c.T, 1.25, .3, 0]];
    let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const [t0, a0, e0, l0] = K[i], [t1, a1, e1, l1] = K[i + 1], k = W8.kit.sm ? W8.kit.sm(cl01((t - t0) / Math.max(.01, t1 - t0))) : cl01((t - t0) / Math.max(.01, t1 - t0));
    pose.arm = a0 + (a1 - a0) * k; pose.elbow = e0 + (e1 - e0) * k; pose.lean = l0 + (l1 - l0) * k; pose.backArm = 1.3; pose.backElbow = .3;
    if (!W8.hornInHand) pose.weapon = 'fists';
    const up = t > c.a ? cl01((t - c.a) / (c.b - c.a)) : 0;
    pose.hornA = t < c.b ? .9 - 1.5 * up : t < c.end ? -.6 - .06 * Math.sin(t * 9) : -.6 + 1.5 * cl01((t - c.end) / (c.T - c.end));
    pose.hornGlow = t >= c.blow && t < c.end ? .6 + .4 * Math.sin(t * 20) : 0;
    return pose;
  }
  { const _pp = playerPose; playerPose = function () { if (CINE && P) return cinePose(); return _pp(); }; }
  // the fight waits on the call
  { const _up = updatePlayer; updatePlayer = function (dt) {
      if (QUEUE && P && mode === 'play' && !(typeof zoneTrans !== 'undefined' && zoneTrans)) { const q = QUEUE; QUEUE = null; if (owned() && verses().length && P.state !== 'dead' && P.hp > 0) begin(q.full); }
      stepMist(dt);
      if (CINE) { if (mode !== 'play' || !P || P.state === 'dead') { finish(); return _up(dt); } step(dt); return; }
      return _up(dt); }; }
  { const _uw = updateWorld; updateWorld = function (dt) { if (CINE) return; return _uw(dt); }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (mist.length) list.push([(P ? P.y : 0) + 40, () => onMain(() => drawMist(t))]); }; }

  // ---------------- the scroll that says what the horn calls ----------------
  function showPanel(v, full, T) {
    endPanel(); const hud = document.getElementById('hud'); if (!hud) return;
    const el = panel = document.createElement('div'); el.id = 'w8hornCall';
    const two = v.length > 4;
    el.style.cssText = `position:absolute;left:50%;top:12.5%;transform:translate(-50%,-6px);width:min(94%,${two ? 560 : 360}px);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;z-index:6;` +
      'background:linear-gradient(#F4EAD0,#DCC8A0);border:2px solid #C9982E;box-shadow:0 0 0 1px #3A2410,0 3px 10px rgba(0,0,0,.45);border-radius:4px;padding:5px 9px 6px;color:#2A1A0E;font-family:Georgia,serif;box-sizing:border-box';
    const head = document.createElement('div'); head.style.cssText = 'text-align:center;font-family:Cinzel,Georgia,serif;font-size:clamp(9px,1.9vw,12px);letter-spacing:.16em;color:#8A2A1E;margin-bottom:3px';
    head.innerHTML = `<span style="color:#A6802A">✦</span> THE HORN OF LORRAINE <span style="color:#A6802A">✦</span><span style="color:#5A4430;letter-spacing:.06em"> · the Long March, ${v.length} ${v.length === 1 ? 'verse' : 'verses'}</span>`;
    el.appendChild(head);
    const grid = document.createElement('div'); grid.style.cssText = `display:grid;grid-template-columns:${two ? '1fr 1fr' : '1fr'};gap:2px 10px`;
    for (const id of v) { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:5px;min-width:0';
      const cv = document.createElement('canvas'); cv.width = 40; cv.height = 40; cv.style.cssText = 'width:17px;height:17px;flex:none'; try { W8.verseIcon(cv.getContext('2d'), id, 20, 20, 17); } catch (e) {}
      const tx = document.createElement('div'); tx.style.cssText = 'font-size:clamp(9px,1.75vw,11.5px);line-height:1.15;min-width:0';
      tx.innerHTML = `<b style="font-family:Cinzel,Georgia,serif;color:#6A2414">${V[id].name.replace(/^Verse of (the )?/, '')}</b> <span style="color:#3A2A1A">${W8.VLINE(id)}</span>`;
      row.appendChild(cv); row.appendChild(tx); grid.appendChild(row); }
    el.appendChild(grid);
    const foot = document.createElement('div'); foot.style.cssText = 'text-align:right;font-size:8px;color:#7A6244;margin-top:2px;font-style:italic'; foot.textContent = 'any button to march on';
    el.appendChild(foot);
    hud.appendChild(el); setTimeout(() => { if (panel === el) { el.style.opacity = '1'; el.style.transform = 'translate(-50%,0)'; } }, 30);
  }
  function endPanel() { if (!panel) return; const el = panel; panel = null; el.style.opacity = '0'; setTimeout(() => el.remove(), 260); }
})();
