'use strict';
// ---------- Level-7 weapon art: past legend, into the lore of Amber itself ----------
// Drawn in hand space like every weapon (the hand at (16,0), the weapon pointing along +x). Any level of 7 or more
// (NG+ can push levels higher) draws the level-7 form; level 6 falls through to art_tier6.js, lower levels to drawWeapon.
//   hammer  Judgment: the Jewel of Judgment cut as a maul's head, a great faceted ruby in gold claws, the Pattern
//           turning in its depths, its heart beating, and a ring of storm cloud circling it (the Jewel rules the weather)
//   staff   the Logrus Stave: two strands of black Chaos-iron twisted round a core of green Chaos-fire, the twist crawling
//           slowly along it; at either end a crown of writhing iron tines, the Logrus's shifting lines, holding a turning
//           shard of Chaos-crystal, with now and then a thread of lightning snapping from a tine to the shard's point
//   sword   the Trumpblade: the blade is a window cut into Shadow, the land seen through it walking past and changing
//           (dusk over Kolvir, night, aurora, the red sky of Chaos), rimmed in silver with light splitting at its edges;
//           its guard is a fan of Trumps, one of them always cold with a contact
//   rapier  Grayswandir Ascendant: a blade of clear, frozen light, the Pattern lifted off the steel and wound round it
//           in a slow helix of blue-white fire, its guard a disc of the Pattern itself with a light walking its path
// All motion is slow and gentle, driven by performance.now(); glows and see-through effects are skipped while FLASH or
// TINT is set. Reuses art_tier6.js's helpers (t6Plain, t6Add, t6Halo, t6Path, t6Shape, t6VG, t6Inked, t6Star, t6SwingGlow).
const t7Now = () => performance.now() / 1000;
const t7Beat = (now) => { const p = (now * .75) % 1; return Math.exp(-(((p - .08) / .045) ** 2)) + .6 * Math.exp(-(((p - .25) / .05) ** 2)); }; // lub-dub
function t7Ribbon(pts, w0, w1) { // a tapered ribbon along a polyline: w0 wide at its root, w1 at its end
  const top = [], bot = [], n = pts.length - 1;
  pts.forEach(([x, y], i) => { const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(n, i + 1)], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, k = i / n, w = w1 + (w0 - w1) * (1 - k ** 2.2) * Math.min(1, .55 + k * 3);
    top.push([x - dy / L * w, y + dx / L * w]); bot.push([x + dy / L * w, y - dx / L * w]); });
  ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = n; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
}
function t7Curve(x0, y0, x1, y1, x2, y2, N = 8) { const p = []; for (let i = 0; i <= N; i++) { const k = i / N; p.push([(1 - k) * (1 - k) * x0 + 2 * k * (1 - k) * x1 + k * k * x2, (1 - k) * (1 - k) * y0 + 2 * k * (1 - k) * y1 + k * k * y2]); } return p; }

// ======================================================================================================
// JUDGMENT — the Jewel of Judgment as a maul's head: a great ruby in gold claws, a storm circling it
// ======================================================================================================
function t7Hammer(pose) {
  const now = t7Now(), plain = t6Plain(), beat = t7Beat(now), L = 52, cx = 46;
  const fit = !!pose.noHand; if (fit) { ctx.save(); ctx.translate(30, 0); ctx.scale(.76, .76); ctx.translate(-40, 0); } // the card portrait: the head centred and inside its frame
  // the storm ring: three small clouds circling the jewel's waist, the far side passing behind it
  const RX = 27, RY = 7.5, TILT = -.22, clouds = [0, 1, 2, 3].map(i => { const a = now * .42 + i * TAU / 4 + (i % 2) * .3, c = Math.cos(a), s = Math.sin(a);
    return { x: cx + c * RX * Math.cos(TILT) - s * RY * Math.sin(TILT), y: c * RX * Math.sin(TILT) + s * RY * Math.cos(TILT), front: s > 0, k: .78 + .22 * s, i }; });
  const ringArc = (front) => { ctx.beginPath(); ctx.ellipse(cx, 0, RX, RY, TILT, front ? 0 : Math.PI, front ? Math.PI : TAU); };
  const cloud = (c) => {
    const r = (i => [4.4, 3.6, 4.8, 3.4][i])(c.i) * c.k; ctx.save(); ctx.translate(c.x, c.y);
    const puffs = [[-r * .9, r * .2, r * .8], [r * .95, r * .25, r * .75], [0, -r * .15, r]];
    ctx.beginPath(); for (const [x, y, rr] of puffs) { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU); }
    ctx.fillStyle = C(c.front ? '#5E5880' : '#48425E'); ctx.fill(); ctx.lineWidth = 1 * OUTK; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.stroke();
    ctx.beginPath(); for (const [x, y, rr] of puffs) { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU); } ctx.fillStyle = C(c.front ? '#5E5880' : '#48425E'); ctx.fill(); // (fill again, so the puffs merge into one cloud)
    if (plain) { ctx.fillStyle = c.front ? 'rgba(226,222,250,.9)' : 'rgba(190,186,224,.5)'; for (const [x, y, rr] of puffs) { ell(x - rr * .15, y - rr * .42, rr * .66, rr * .4); ctx.fill(); } ctx.fillStyle = 'rgba(20,14,40,.35)'; ell(0, r * .55, r * 1.5, r * .3); ctx.fill(); }
    ctx.restore();
  };
  if (plain) t6Add(() => { ringArc(false); ctx.strokeStyle = 'rgba(170,160,230,.22)'; ctx.lineWidth = 2.2; ctx.stroke(); });
  for (const c of clouds) if (!c.front) cloud(c);
  // the haft: black-red heartwood, gold bands, a crimson cord wound between them
  limb([0, 0, L, 0], '#2E1418', 5);
  if (plain) { ctx.strokeStyle = 'rgba(255,170,170,.2)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(2, -1.6); ctx.lineTo(L - 4, -1.6); ctx.stroke(); }
  ctx.strokeStyle = C('#B0203A'); ctx.lineWidth = 1; ctx.beginPath(); for (let x = 31; x < 44; x += 2.4) { ctx.moveTo(x, -2.4); ctx.lineTo(x + 1.6, 2.4); } ctx.stroke();
  for (const x of [5, 11, 23, 29]) { rrect(x - 1.2, -3.6, 2.6, 7.2, 1); ctx.fillStyle = t6VG(-3.6, 3.6, '#D8AA48', .4, -.35); ctx.fill(); outline(.8); }
  // the pommel: a ruby drop in a gold cage
  t6Shape([-8, 0, -3.5, -4.6, 2.6, -4.2, 3.6, 0, 2.6, 4.2, -3.5, 4.6], t6VG(-4.6, 4.6, '#D8AA48', .45, -.4), 1.1);
  circle(-1.6, 0, 2.3); ctx.fillStyle = C('#D0203E'); ctx.fill(); outline(.7); if (plain) { ctx.fillStyle = '#FFD0D8'; ctx.fillRect(-2.6, -1.3, .9, .9); }
  t6Halo(-1.6, 0, 6, '255,60,90', .3 + .25 * beat);
  // a gold finial beyond the head, tipped with a ruby bead
  t6Shape([60, -6.5, 70, -3.5, 77, 0, 70, 3.5, 60, 6.5], t6VG(-6.5, 6.5, '#D8AA48', .45, -.4), 1.2);
  if (plain) { ctx.fillStyle = 'rgba(255,248,220,.6)'; t6Path([62, -5, 74, -1, 62, -2.6]); ctx.fill(); }
  circle(74.5, 0, 1.9); ctx.fillStyle = C('#E0304A'); ctx.fill(); outline(.7);
  // the socket where the haft meets the jewel
  rrect(26, -7.5, 6, 15, 2); ctx.fillStyle = t6VG(-7.5, 7.5, '#D8AA48', .45, -.4); ctx.fill(); outline(1.2);
  // the Jewel: an emerald-cut ruby, standing tall across the haft
  const O = [[31, -19], [36, -25], [56, -25], [61, -19], [61, 19], [56, 25], [36, 25], [31, 19]];
  const T = [[37.5, -12.5], [40.5, -16.5], [51.5, -16.5], [54.5, -12.5], [54.5, 12.5], [51.5, 16.5], [40.5, 16.5], [37.5, 12.5]];
  const gem = () => { ctx.beginPath(); O.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
  const dark = [70, 8, 24], lite = [255, 96, 116], mix = (k) => `rgb(${dark.map((d, j) => Math.round(d + (lite[j] - d) * k)).join(',')})`;
  const M = O.map(([x, y], i) => [(x + T[i][0]) / 2, (y + T[i][1]) / 2]);
  for (let i = 0; i < 8; i++) { // the step-cut facets in two rows, each lit by its slope toward the light (high, to the left); the inner row turned the other way
    const j = (i + 1) % 8, mx = (O[i][0] + O[j][0]) / 2 - cx, my = (O[i][1] + O[j][1]) / 2, lk = .5 + .5 * Math.cos(Math.atan2(my, mx) + 2.2);
    t6Path([O[i][0], O[i][1], O[j][0], O[j][1], M[j][0], M[j][1], M[i][0], M[i][1]]); ctx.fillStyle = C(mix(.04 + .96 * lk * lk)); ctx.fill();
    t6Path([M[i][0], M[i][1], M[j][0], M[j][1], T[j][0], T[j][1], T[i][0], T[i][1]]); ctx.fillStyle = C(mix(.2 + .55 * (1 - lk))); ctx.fill();
  }
  const table = () => { ctx.beginPath(); T.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
  table();
  if (plain) { const g = ctx.createRadialGradient(cx - 2, -3, 0, cx, 0, 19); g.addColorStop(0, `rgb(255,${120 + 60 * beat | 0},${130 + 40 * beat | 0})`); g.addColorStop(.45, '#D41838'); g.addColorStop(1, '#5A0618'); ctx.fillStyle = g; }
  else ctx.fillStyle = C('#C8203A');
  ctx.fill();
  if (plain) { // the Pattern, seen turning in the jewel's depths: a spiral of gold light, foreshortened as it turns
    ctx.save(); table(); ctx.clip();
    const rot = now * .35, sq = .45 + .4 * Math.abs(Math.cos(now * .21));
    const spiral = () => { ctx.beginPath(); for (let t = 0; t <= 4.2 * Math.PI; t += .22) { const r = .8 + t * .85, x = cx + Math.cos(t + rot) * r * sq, y = Math.sin(t + rot) * r * 1.05; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
    t6Add(() => { ctx.lineCap = 'round'; spiral(); ctx.strokeStyle = `rgba(255,150,90,${.18 + .14 * beat})`; ctx.lineWidth = 2; ctx.stroke(); spiral(); ctx.strokeStyle = `rgba(255,232,170,${.42 + .3 * beat})`; ctx.lineWidth = .6; ctx.stroke(); });
    ctx.restore();
  }
  // the facet edges: fine lines, darker where they turn from the light
  ctx.lineWidth = .7; ctx.strokeStyle = C('#4A0614'); ctx.beginPath(); for (let i = 0; i < 8; i++) { ctx.moveTo(O[i][0], O[i][1]); ctx.lineTo(T[i][0], T[i][1]); } M.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
  table(); ctx.strokeStyle = C('#FF9AA8'); ctx.lineWidth = .7; ctx.stroke();
  if (plain) { ctx.fillStyle = 'rgba(255,240,244,.55)'; t6Path([33, -18.5, 37, -23.5, 47, -23.5, 40, -17.5, 37.5, -13]); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; t6Path([39, -14, 45, -14.5, 38.5, -6]); ctx.fill(); } // light caught on the facets
  gem(); outline(1.9);
  // gold claws holding it, a band across each striking face
  for (const s of [-1, 1]) {
    const y = s < 0 ? -29.5 : 24; rrect(33, y, 26, 5.5, 2); ctx.fillStyle = t6VG(y, y + 5.5, '#D8AA48', .45, -.4); ctx.fill(); outline(1.3);
    for (const x of [36, 46, 56]) { t6Shape([x - 2, s * 24.5, x + 2, s * 24.5, x + 1.3, s * 21, x, s * 20, x - 1.3, s * 21], t6VG(-2, 2, '#E8BC58', .4, -.3), .9); }
    if (plain) { ctx.fillStyle = 'rgba(255,246,210,.7)'; ctx.fillRect(35, y + 1, 22, .8); }
    circle(46, y + 2.75, 1.5); ctx.fillStyle = C('#E0304A'); ctx.fill(); outline(.6); // a small ruby set in each band
  }
  t6Halo(cx, 0, 18, '255,90,110', .3 + .35 * beat);
  t6Add(() => { ctx.fillStyle = 'rgba(255,250,240,.95)'; gbStar(40, -14, 2.4 + 2.2 * beat, .9); }); // a glint that flares with each heartbeat
  // lightning: now and then a fork leaps from the nearest cloud to the jewel
  if (plain) {
    const per = 2.7, cyc = Math.floor(now / per), u = now / per - cyc;
    if (u < .1) { const c = clouds.reduce((a, b) => (b.k > a.k ? b : a)), tx = cx + (c.x > cx ? 14 : -14), ty = c.y * .4, rnd = (j) => Math.sin(cyc * 12.9898 + j * 78.233) * 43758.5453 % 1;
      t6Add(() => { const bolt = () => { ctx.beginPath(); ctx.moveTo(c.x, c.y); for (let j = 1; j < 4; j++) { const k = j / 4; ctx.lineTo(c.x + (tx - c.x) * k + rnd(j) * 3, c.y + (ty - c.y) * k + rnd(j + 5) * 3); } ctx.lineTo(tx, ty); };
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; bolt(); ctx.strokeStyle = 'rgba(170,190,255,.5)'; ctx.lineWidth = 3; ctx.stroke(); bolt(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.stroke(); });
      t6Halo(c.x, c.y, 10, '200,210,255', .6 * (1 - u / .1));
    }
  }
  for (const c of clouds) if (c.front) cloud(c);
  if (plain) t6Add(() => { ringArc(true); ctx.strokeStyle = 'rgba(190,180,255,.3)'; ctx.lineWidth = 1.6; ctx.stroke(); });
  t6SwingGlow(pose, 26, 54, 60);
  if (fit) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
}

// ======================================================================================================
// THE LOGRUS STAVE — black Chaos-iron twisted round a core of green Chaos-fire, the Logrus writhing at either end
// ======================================================================================================
// Two strands of black iron wound about a core of green Chaos-fire, the twist crawling slowly along the staff with light
// travelling down the core between the strands. Each end is a crown of curved iron tines, never quite still, like the
// Logrus's own shifting lines, and holds a long shard of Chaos-crystal that turns slowly; now and then a thread of the
// Logrus's lightning snaps from a tine to the shard's point. The far end is the same crown a little smaller, so either
// end looks right when the staff slides through the hands.
function t7Staff(pose) {
  const now = t7Now(), plain = t6Plain(), len = 62, back = -28, pulse = .5 + .5 * Math.sin(now * .9);
  const sc = pose.noHand ? .86 : 1; if (sc !== 1) { ctx.save(); ctx.translate(15, 0); ctx.scale(sc, sc); ctx.translate(-22, 0); } // the card portrait: kept inside its frame
  const IRON = '#363040', IRON2 = '#26222E', IRON3 = '#4A4458';
  // the core: green Chaos-fire, with slow bright pulses travelling along it (seen only between the strands)
  limb([back, 0, len, 0], plain ? '#22C487' : '#2AA878', 5);
  t6Add(() => { ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const p = (now * .16 + i / 3) % 1, x = back + 2 + p * (len - back - 4), a = Math.sin(p * Math.PI);
      ctx.strokeStyle = `rgba(150,255,200,${.7 * a})`; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 6, 0); ctx.lineTo(x + 6, 0); ctx.stroke();
      ctx.strokeStyle = `rgba(240,255,248,${.8 * a})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x - 3.5, 0); ctx.lineTo(x + 3.5, 0); ctx.stroke(); } });
  // the two strands of iron: the twist crawls slowly along the staff; the strand passing behind is darker
  { const pb = new Path2D(), pf = new Path2D(), ph = new Path2D(), A = 1.4, step = 1.1, crawl = now * .7;
    for (const s of [0, Math.PI]) for (let x = back + .6; x < len - .6; x += step) {
      const a = x * .27 - crawl + s, y0 = Math.sin(a) * A, y1 = Math.sin(a + step * .27) * A, front = Math.cos(a) > 0, P = front ? pf : pb;
      P.moveTo(x, y0); P.lineTo(x + step + .25, y1); if (front && plain) { ph.moveTo(x, y0 - .7); ph.lineTo(x + step + .25, y1 - .7); } }
    ctx.lineCap = 'butt'; ctx.strokeStyle = C('#16141C'); ctx.lineWidth = 2.2; ctx.stroke(pb);
    ctx.strokeStyle = C(IRON); ctx.lineWidth = 2.5; ctx.stroke(pf);
    if (plain) { ctx.strokeStyle = 'rgba(200,235,225,.5)'; ctx.lineWidth = .55; ctx.stroke(ph); } }
  ctx.lineCap = 'round';
  for (const x of [8, 25]) { rrect(x - 1.3, -3, 2.6, 6, 1); ctx.fillStyle = t6VG(-3, 3, IRON3, .5, -.4); ctx.fill(); outline(.8); } // iron collars either side of the grip
  // a crown of the Logrus at one end: swept iron fins inlaid with green fire round a turning shard of Chaos-crystal (drawn pointing along +x)
  const crown = (X, dir, s, seed) => {
    ctx.save(); ctx.translate(X, 0); ctx.scale(dir * s, s);
    // a fin: a flat blade of iron swept forward, a channel of green fire let into it; the fins open and close a little, slowly
    const FIN = [0, -2.4, 5, -9.5, 8.5, -11.6, 12, -10.9, 23, -6.2, 11, -6.8, 6.5, -4.6, 3, -2.2], INL = [5.2, -7.4, 9, -9.6, 18.5, -6.8];
    const ang = (k) => .06 * Math.sin(now * .8 + seed + k * 2.2);
    const at = ([x, y], sy, a) => [x * Math.cos(a) + y * Math.sin(a), (y * Math.cos(a) - x * Math.sin(a)) * sy]; // a fin point in the crown's frame
    const fin = (sy, k, col) => { const a = ang(k); ctx.save(); ctx.scale(1, sy); ctx.rotate(-a);
      t6Shape(FIN, t6VG(-12, -2, col, .5, -.35), 1);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C('#0E5A40'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(INL[0], INL[1]); ctx.lineTo(INL[2], INL[3]); ctx.lineTo(INL[4], INL[5]); ctx.stroke();
      t6Add(() => { ctx.strokeStyle = `rgba(110,255,190,${.6 + .35 * Math.sin(now * 1.7 + k * 2 + seed)})`; ctx.lineWidth = .65; ctx.stroke(); });
      ctx.restore(); return at([23, -6.2], sy, a); };
    const barb = (sy) => { ctx.save(); ctx.scale(1, sy); t6Shape([1, -2.6, -1.5, -6.5, -5, -10, -.4, -7.4, 3, -3.4], t6VG(-10, -2, IRON2, .5, -.3), .9); ctx.restore(); }; // short barbs swept back
    barb(-1); barb(1);
    const botTip = fin(-1, 1, IRON2);
    // the shard: a long eight-sided crystal, its ridge turning as it rotates, floating a little
    const sx = 3.6 + Math.sin(now * 1.1 + seed) * .5, sw = 4, r = Math.sin(now * .7 + seed) * 2.9, tip = sx + 22;
    t6Path([sx, 0, sx + 7, -sw, tip, 0, sx + 7, r]); ctx.fillStyle = C('#A8FFD8'); ctx.fill();
    t6Path([sx, 0, sx + 7, r, tip, 0, sx + 7, sw]); ctx.fillStyle = C('#0C7A56'); ctx.fill();
    t6Path([sx, 0, sx + 7, -sw, tip, 0, sx + 7, sw]); outline(1);
    if (plain) { ctx.strokeStyle = 'rgba(230,255,245,.9)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(sx + .8, 0); ctx.lineTo(sx + 7, r); ctx.lineTo(tip - .8, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; t6Path([sx + 2.4, -.7, sx + 7, -sw + .9, sx + 9.5, -sw * .55]); ctx.fill(); }
    const topTip = fin(1, 0, IRON);
    t6Shape([-1, -3.4, 4.6, -2.8, 6.4, 0, 4.6, 2.8, -1, 3.4], t6VG(-3.4, 3.4, IRON3, .5, -.4), .9); // the clasp round the shard's foot
    rrect(-2.5, -3.7, 4.4, 7.4, 1.4); ctx.fillStyle = t6VG(-3.7, 3.7, IRON3, .5, -.4); ctx.fill(); outline(.9); // the socket
    circle(-.3, 0, 1.15); ctx.fillStyle = C('#6CFFC0'); ctx.fill(); outline(.5);
    // glints, and a thread of the Logrus's lightning now and then from a tine's point to the shard's
    t6Add(() => { ctx.fillStyle = 'rgba(235,255,245,.95)'; gbStar(tip, 0, 1.6 + .9 * pulse, .9); ctx.fillStyle = 'rgba(200,255,230,.9)'; gbStar(-.3, 0, 1, .8);
      const c = now * .55 + seed * .37, ph = c % 1;
      if (ph < .2) { const n = Math.floor(c), q = Math.floor(now * 14), a = 1 - ph / .2, from = n % 2 ? topTip : botTip, j = (k) => Math.sin(n * 12.9 + q * 7.3 + k * 4.1) * 1.6;
        const pts = [from]; for (let k = 1; k < 4; k++) { const u = k / 4; pts.push([from[0] + (tip - from[0]) * u + j(k) * .4, from[1] * (1 - u) + j(k + 5)]); } pts.push([tip, 0]);
        const line = () => { ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
        ctx.lineJoin = 'round'; line(); ctx.strokeStyle = `rgba(60,255,170,${.5 * a})`; ctx.lineWidth = 1.5; ctx.stroke(); line(); ctx.strokeStyle = `rgba(240,255,250,${.95 * a})`; ctx.lineWidth = .55; ctx.stroke(); } });
    ctx.restore();
  };
  crown(back, -1, .9, 2.3); crown(len, 1, 1.1, 0);
  t6SwingGlow(pose, back - 26, len - back + 56, 20);
  if (sc !== 1) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
}

// ======================================================================================================
// THE TRUMPBLADE — a blade that is a window into Shadow, the land walking past inside it; a fan of Trumps for a guard
// ======================================================================================================
const T7_SHADOWS = [ // the Shadows seen through the blade, in turn: sky top, sky at the horizon, far hills, near land, sun, extras
  { top: '#2A3A80', low: '#F2A070', far: '#7A5A88', near: '#2A1E3A', sun: '#FFE2A0' }, // dusk over Kolvir
  { top: '#060A22', low: '#24366A', far: '#1C2850', near: '#080A18', sun: '#E8F0FF', stars: 1 }, // night
  { top: '#0C2236', low: '#3A8A8A', far: '#1E4A50', near: '#0A1E22', sun: '#E0FFF4', stars: 1, aurora: 1 }, // the northern lights
  { top: '#3A0A2A', low: '#F2604A', far: '#6A1E3A', near: '#22061A', sun: '#FFD890' }, // the red sky toward Chaos
];
function t7Sword(pose) {
  const now = t7Now(), plain = t6Plain(), pulse = .5 + .5 * Math.sin(now * 1.0);
  const sc = pose.noHand ? .8 : 1; if (sc !== 1) { ctx.save(); ctx.translate(40, 0); ctx.scale(sc, sc); ctx.translate(-40, 0); } // keep the card portrait inside its frame
  const x0 = 22, len = 88, tip = x0 + len + 6, W = 8.6, xs = x0 + len * .76;
  // the grip, black wound with silver; a pommel set with a stone that holds the sky
  limb([3, 0, 18, 0], '#16141E', 4.6);
  if (plain) { ctx.strokeStyle = '#C8D0E4'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 5; x < 17; x += 1.7) { ctx.moveTo(x, -2.2); ctx.lineTo(x + 1.2, 2.2); } ctx.stroke(); }
  t6Shape([-3.6, 0, 1.2, -5.2, 5, 0, 1.2, 5.2], t6VG(-5.2, 5.2, '#E2B85A', .45, -.4), 1.1);
  circle(1, 0, 2.3);
  if (plain) { const g = ctx.createLinearGradient(0, -2.3, 0, 2.3); g.addColorStop(0, '#6AA8F0'); g.addColorStop(1, '#F2C890'); ctx.fillStyle = g; } else ctx.fillStyle = C('#8AB8F0');
  ctx.fill(); outline(.7);
  // the blade: broad and straight, a clipped point
  const blade = () => { ctx.beginPath(); ctx.moveTo(x0, -W); ctx.lineTo(xs, -W + .6); ctx.lineTo(tip, 0); ctx.lineTo(xs + 6, W - 2.6); ctx.lineTo(xs, W - .6); ctx.lineTo(x0, W); ctx.closePath(); };
  const win = () => { const i = 1.9, wx = x0 + 9; ctx.beginPath(); ctx.moveTo(wx, -W + i); ctx.lineTo(xs - .5, -W + .6 + i); ctx.lineTo(tip - 5.4, 0); ctx.lineTo(xs + 4.5, W - 2.6 - i * .9); ctx.lineTo(xs - .5, W - .6 - i); ctx.lineTo(wx, W - i); ctx.closePath(); };
  blade(); const bg = ctx.createLinearGradient(0, -W, 0, W); bg.addColorStop(0, C('#FFFFFF')); bg.addColorStop(.4, C('#D4DCEC')); bg.addColorStop(1, C('#7A84A0')); ctx.fillStyle = bg; ctx.fill(); outline(2);
  // the window into Shadow
  win(); ctx.fillStyle = C('#1A2448'); ctx.fill();
  if (plain) {
    ctx.save(); win(); ctx.clip();
    const cyc = now / 7, i0 = Math.floor(cyc) % T7_SHADOWS.length, u = cyc % 1, fade = clamp((u - .78) / .22, 0, 1), walk = now * 9;
    const scene = (S, a) => {
      ctx.globalAlpha = a;
      const sky = ctx.createLinearGradient(0, -W, 0, 3); sky.addColorStop(0, S.top); sky.addColorStop(1, S.low); ctx.fillStyle = sky; ctx.fillRect(x0, -W, len + 8, W * 2);
      if (S.stars) { ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 16; i++) { const x = x0 + 10 + ((i * 37.3 - walk * .15) % 80 + 80) % 80, y = -W + 2 + (i * 5.7 % 6); ctx.globalAlpha = a * (.4 + .5 * (.5 + .5 * Math.sin(now * 1.3 + i * 2.1))); ctx.fillRect(x, y, .8, .8); } ctx.globalAlpha = a; }
      if (S.aurora) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .55; ctx.strokeStyle = '#4AF0A0'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let x = x0 + 8; x < tip; x += 2) { const y = -3 + Math.sin(x * .12 + now * .6) * 1.6; x === x0 + 8 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore(); ctx.globalAlpha = a; }
      const sx = x0 + 58; const sg = ctx.createRadialGradient(sx, -1, 0, sx, -1, 9); sg.addColorStop(0, S.sun); sg.addColorStop(.3, S.sun + '88'); sg.addColorStop(1, S.sun + '00'); ctx.fillStyle = sg; ctx.fillRect(sx - 9, -10, 18, 18);
      ctx.fillStyle = S.sun; circle(sx, -1, 2.6); ctx.fill();
      ctx.fillStyle = S.far; ctx.beginPath(); ctx.moveTo(x0, W); for (let x = x0; x <= tip; x += 2) { const q = x + walk * .45; ctx.lineTo(x, 1.4 - 2.2 * Math.abs(Math.sin(q * .07)) - 1.1 * Math.sin(q * .23)); } ctx.lineTo(tip, W); ctx.closePath(); ctx.fill();
      ctx.fillStyle = S.near; ctx.beginPath(); ctx.moveTo(x0, W); for (let x = x0; x <= tip; x += 2) { const q = x + walk; ctx.lineTo(x, 3.6 - 1.4 * Math.sin(q * .05) - .6 * Math.sin(q * .17)); } ctx.lineTo(tip, W); ctx.closePath(); ctx.fill();
      // Amber on Kolvir: a castle on its mountain passing now and then
      const kx = x0 + 100 - ((walk * .45) % 150); if (kx > x0 - 10 && kx < tip + 10) { ctx.fillStyle = S.far; ctx.beginPath(); ctx.moveTo(kx - 9, 3); ctx.lineTo(kx - 2, -2.4); ctx.lineTo(kx + 2.5, -2.4); ctx.lineTo(kx + 9, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(S.near, .12); for (const [dx, h] of [[-2, 3.6], [0, 5.6], [2, 4.2]]) ctx.fillRect(kx + dx - .6, -2.4 - h, 1.3, h + .5); for (const [dx, h] of [[-2, 3.6], [0, 5.6], [2, 4.2]]) { ctx.beginPath(); ctx.moveTo(kx + dx - .9, -2.4 - h); ctx.lineTo(kx + dx + .05, -3.9 - h); ctx.lineTo(kx + dx + 1, -2.4 - h); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,220,140,.9)'; ctx.fillRect(kx - .1, -5, .6, .6); }
      ctx.globalAlpha = 1;
    };
    scene(T7_SHADOWS[i0], 1); if (fade > 0) scene(T7_SHADOWS[(i0 + 1) % T7_SHADOWS.length], fade);
    // glass: a sheen sliding along the window now and then
    const sp = ((now * .22) % 1.6) * (len + 30) + x0 - 20; ctx.globalCompositeOperation = 'lighter'; const sh = ctx.createLinearGradient(sp - 8, 0, sp + 8, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(sp - 6, -W); ctx.lineTo(sp + 4, -W); ctx.lineTo(sp - 1, W); ctx.lineTo(sp - 11, W); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,20,.35)'; ctx.fillRect(x0, -W, len + 8, 1.2); // the inner shadow of the rim
    ctx.restore();
  }
  win(); ctx.lineWidth = 1 * OUTK; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.stroke();
  // light bending at the window's edge: a red and a blue fringe either side of it
  t6Add(() => { ctx.save(); ctx.translate(0, -.7); win(); ctx.strokeStyle = 'rgba(255,90,120,.45)'; ctx.lineWidth = .8; ctx.stroke(); ctx.translate(0, 1.4); win(); ctx.strokeStyle = 'rgba(90,170,255,.45)'; ctx.stroke(); ctx.restore(); });
  if (plain) { ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 2, -W + .9); ctx.lineTo(xs, -W + 1.4); ctx.lineTo(tip - 2.2, -.3); ctx.stroke(); }
  // the ricasso: a plate of silver engraved with the Unicorn's horn
  if (plain) { ctx.strokeStyle = 'rgba(80,90,120,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x0 + 2.5, 2.4); ctx.lineTo(x0 + 7, -2.6); ctx.moveTo(x0 + 3.6, 1.2); ctx.lineTo(x0 + 4.6, 1.8); ctx.moveTo(x0 + 4.6, 0); ctx.lineTo(x0 + 5.6, .6); ctx.stroke(); }
  t6Add(() => { ctx.fillStyle = '#FFFFFF'; gbStar(tip - 1, 0, 3 + .8 * pulse, .9); });
  // the guard: a fan of Trumps either side of the hilt, leaning back over the hand
  const faces = ['#2A2836', '#E8A030', '#3A6AC8', '#C83A4A', '#3A8A5A', '#7A4AB8'], marks = ['#D8DCEC', '#FFF0C0', '#E0ECFF', '#FFD8D0', '#D8FFE0', '#F0E0FF'];
  const lit = Math.floor(now / 2.2) % 6, litA = Math.sin(((now / 2.2) % 1) * Math.PI);
  const card = (bx, by, ang, s, n) => {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(s * Math.cos(ang), -Math.sin(ang)) - Math.PI / 2);
    rrect(-3.7, 1.5, 7.4, 11.6, 1.2); ctx.fillStyle = C('#F2E6C4'); ctx.fill(); outline(1); // the card, its gilt edge
    rrect(-2.5, 2.7, 5, 9.2, .7); ctx.fillStyle = C(faces[n]); ctx.fill();
    if (plain) { ctx.fillStyle = marks[n]; circle(0, 5.6, 1.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-1.5, 10.6); ctx.lineTo(0, 6.8); ctx.lineTo(1.5, 10.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-2.5, 2.7, 1.1, 9.2); } // a little figure on its face
    if (n === lit) t6Add(() => { ctx.fillStyle = `rgba(200,230,255,${.55 * litA})`; rrect(-4.2, 1, 8.4, 12.6, 1.5); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${.8 * litA})`; gbStar(0, 5.6, 2.8 * litA + .5, .9); });
    ctx.restore();
  };
  for (const s of [-1, 1]) [[1.12, 0], [.7, 1], [.28, 2]].forEach(([ang, j]) => card(21, s * 4.5, ang, s, (s < 0 ? 0 : 3) + j));
  rrect(17.5, -7.5, 7, 15, 2.4); ctx.fillStyle = t6VG(-7.5, 7.5, '#E2B85A', .45, -.4); ctx.fill(); outline(1.3);
  circle(21, 0, 3); ctx.fillStyle = C('#1A2040'); ctx.fill(); outline(.9);
  t6Halo(21, 0, 9, '190,220,255', .45 + .2 * pulse); t6Add(() => { ctx.translate(21, 0); ctx.rotate(now * .3); ctx.fillStyle = 'rgba(235,245,255,.95)'; gbStar(0, 0, 2.6, .95); });
  t6SwingGlow(pose, 16, len + 18, 20);
  if (sc !== 1) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
}

// ======================================================================================================
// GRAYSWANDIR ASCENDANT — a blade of frozen light, the Pattern wound round it, its guard a disc of the Pattern itself
// ======================================================================================================
function t7Rapier(pose) {
  const now = t7Now(), plain = t6Plain(), pulse = .5 + .5 * Math.sin(now * .9);
  const len = 56, x0 = 20, tip = x0 + len + 5, w = 2.3;
  // the grip, black wound with silver, a green stone in silver claws for a pommel
  limb([5, 0, 17, 0], '#141218', 3.8);
  ctx.strokeStyle = C('#DCE0EC'); ctx.lineWidth = .7; ctx.beginPath(); for (let x = 6.6; x < 16; x += 1.5) { ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); } ctx.stroke();
  t6Shape([-.6, 0, 2.4, -3.6, 5.6, -2.2, 5.6, 2.2, 2.4, 3.6], t6VG(-3.6, 3.6, '#D8DCE8', .45, -.35), 1);
  circle(2.6, 0, 1.8); ctx.fillStyle = C('#3FBF6A'); ctx.fill(); outline(.6); t6Halo(2.6, 0, 5, '110,230,150', .35);
  // the helix: the Pattern lifted off the steel, a ribbon of blue-white fire wound round the blade, running to the point
  const h0 = x0 + 5, h1 = tip - 2, amp = (x) => 6 * (1 - .65 * (x - h0) / (h1 - h0)), ph = (x) => x * .3 - now * 1.6;
  const helix = (front) => { ctx.beginPath(); let on = false; for (let x = h0; x <= h1; x += .7) { const p = ph(x), f = Math.cos(p) >= 0, y = Math.sin(p) * amp(x); if (f === front) { on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true; } else on = false; } };
  if (plain) t6Add(() => { ctx.lineCap = 'round'; helix(false); ctx.strokeStyle = 'rgba(120,150,255,.4)'; ctx.lineWidth = 1.2; ctx.stroke(); });
  else { ctx.lineCap = 'round'; helix(false); ctx.strokeStyle = C('#9AB0FF'); ctx.lineWidth = .8; ctx.stroke(); }
  // the blade: clear, frozen light, long and narrow to a needle point
  const blade = () => { ctx.beginPath(); ctx.moveTo(x0, -w * 1.1); ctx.lineTo(x0 + 6, -w * 1.1); ctx.lineTo(x0 + 7.5, -w); ctx.lineTo(x0 + len * .84, -w * .66); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .84, w * .66); ctx.lineTo(x0 + 7.5, w); ctx.lineTo(x0 + 6, w * 1.1); ctx.lineTo(x0, w * 1.1); ctx.closePath(); };
  blade();
  if (plain) { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.3, 'rgba(200,222,255,.75)'); g.addColorStop(.7, 'rgba(140,170,240,.62)'); g.addColorStop(1, 'rgba(210,228,255,.88)'); ctx.fillStyle = g; }
  else ctx.fillStyle = C('#C8D6FF');
  ctx.fill(); outline(1.4);
  if (plain) {
    ctx.save(); blade(); ctx.clip();
    t6Add(() => { // the core of the blade, burning
      const p = x0 + 7 + ((now * .2) % 1.3) * (len - 4);
      const g = ctx.createLinearGradient(x0, 0, tip, 0); const st = (x, a) => g.addColorStop(clamp((x - x0) / (tip - x0), 0, 1), `rgba(200,220,255,${a})`);
      st(x0, .5); st(p - 10, .5); st(p, 1); st(p + 10, .5); st(tip, .4);
      ctx.fillStyle = g; ctx.fillRect(x0, -.7, len + 6, 1.4);
    });
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x0 + 1, -w * 1.1, len + 4, w * .35); // the edge catching the light
    ctx.restore();
  }
  // the near half of the helix, bright, over the blade
  if (plain) t6Add(() => { ctx.lineCap = 'round'; helix(true); ctx.strokeStyle = 'rgba(110,150,255,.5)'; ctx.lineWidth = 3; ctx.stroke(); helix(true); ctx.strokeStyle = 'rgba(200,225,255,.95)'; ctx.lineWidth = 1.2; ctx.stroke(); helix(true); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .45; ctx.stroke(); });
  else { ctx.lineCap = 'round'; helix(true); ctx.strokeStyle = C('#E0E8FF'); ctx.lineWidth = 1.2; ctx.stroke(); }
  // sparks thrown off where the ribbon crosses the blade, and a star at the point
  t6Add(() => {
    for (let i = 0; i < 5; i++) { const ph2 = (now * .35 + i / 5) % 1, x = h0 + 6 + ((i * 11.3 + now * 6) % (h1 - h0 - 10)), y = -ph2 * 7 * (i % 2 ? 1 : -1); t6Star(x, y, .9 + Math.sin(ph2 * Math.PI) * 1.1, Math.sin(ph2 * Math.PI) * .8, '#E8F0FF'); }
  });
  // the knuckle bow and swept quillons: plain silver lines, a star at each quillon's end
  t6Inked('#D8DCE8', 1.4, () => { ctx.moveTo(18, -5); ctx.bezierCurveTo(13, -13, 5, -9.5, 3, -3.4); });
  t6Inked('#D8DCE8', 1.6, () => { ctx.moveTo(19, -2); ctx.quadraticCurveTo(23, -10, 29, -12); ctx.moveTo(19, 2); ctx.quadraticCurveTo(15, 10, 9.5, 12); });
  t6Add(() => { ctx.fillStyle = 'rgba(230,240,255,.95)'; gbStar(29.2, -12.1, 2.2 + .6 * pulse, .9); gbStar(9.3, 12.1, 2.2 + .6 * (1 - pulse), .9); });
  // the guard: a disc of the Pattern, turned toward the hand, its paths alight and a light walking them
  const RX = 19, RS = .58, R = 7.4;
  ctx.save(); ctx.translate(RX, 0); ctx.scale(RS, 1);
  circle(0, 0, R); ctx.fillStyle = C('#D8DCE8'); ctx.fill(); outline(1.1 / RS * .7);
  circle(0, 0, R - 1.1);
  if (plain) { const g = ctx.createRadialGradient(-1, -1, 0, 0, 0, R); g.addColorStop(0, '#2E3456'); g.addColorStop(1, '#0E1020'); ctx.fillStyle = g; } else ctx.fillStyle = C('#1A1E34');
  ctx.fill();
  const rings = [[2.9, .3, 1], [4.3, -.24, -1], [5.6, .17, 1]];
  const arcs = () => { ctx.beginPath(); rings.forEach(([r, sp, d], j) => { const a = now * sp + j * 2.1; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.arc(0, 0, r, a, a + TAU - .9); const b = a + TAU - .9; ctx.moveTo(Math.cos(b) * r, Math.sin(b) * r); ctx.lineTo(Math.cos(b) * (r + 1.4 * d), Math.sin(b) * (r + 1.4 * d)); }); };
  if (plain) t6Add(() => { ctx.lineCap = 'round'; arcs(); ctx.strokeStyle = `rgba(110,150,255,${.45 + .2 * pulse})`; ctx.lineWidth = 1.6; ctx.stroke(); arcs(); ctx.strokeStyle = 'rgba(220,235,255,.95)'; ctx.lineWidth = .55; ctx.stroke();
    const [r, sp] = rings[2], a = now * sp + 4.2 + ((now * .5) % 1) * (TAU - .9); ctx.fillStyle = '#FFFFFF'; circle(Math.cos(a) * r, Math.sin(a) * r, .9); ctx.fill(); }); // the walker on the outer path
  else { arcs(); ctx.strokeStyle = C('#9AB0FF'); ctx.lineWidth = .6; ctx.stroke(); }
  ctx.restore();
  // the green stone at its heart, the colour of his eyes
  circle(RX, 0, 2.3); ctx.fillStyle = C('#E4E8F2'); ctx.fill(); outline(.7);
  circle(RX, 0, 1.7);
  if (plain) { const g = ctx.createRadialGradient(RX - .5, -.6, 0, RX, 0, 1.7); g.addColorStop(0, '#D8FFE4'); g.addColorStop(.45, '#4FCB7A'); g.addColorStop(1, '#0E4A28'); ctx.fillStyle = g; } else ctx.fillStyle = C('#4FAE6A');
  ctx.fill(); t6Halo(RX, 0, 7, '110,240,150', .4 + .15 * pulse);
  t6SwingGlow(pose, 16, len + 12, 16);
  if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
}

const _drawWeapon7 = drawWeapon;
drawWeapon = function (kind, pose) {
  if (pose && pose.tier >= 7) {
    const f = { hammer: t7Hammer, staff: t7Staff, sword: t7Sword, grayblade: t7Rapier, rapier: t7Rapier }[kind];
    if (f) { f(pose); return; }
  }
  return _drawWeapon7(kind, pose);
};
