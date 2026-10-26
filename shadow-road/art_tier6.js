'use strict';
// ---------- Level-6 weapon art: the hero's weapons in their final, legendary forms ----------
// Drawn in hand space like every weapon (the hand at (16,0), the weapon pointing along +x). Level 6 draws these forms
// (level 7 and up draws art_tier7.js's forms, which hook drawWeapon after this); lower levels fall through to the original drawWeapon.
//   hammer  the Starfall Maul: a meteorite head with a captured star for a core, molten cracks and glowing runes
//   staff   the Moonwood Staff: living silverwood wound with silver, floating rings, a crescent moon cradling a moonstone
//   sword   the Eclipse Blade: a broad blade of sun-gold with a channel of starry night, an eclipsed sun for a guard
//   rapier  Grayswandir in its true form: night-silver, the Pattern running down it in light, stars along the edge,
//           a cup of silver rose petals around a green stone
// All motion is slow and gentle, driven by performance.now(); glows are skipped while FLASH or TINT is set.
const t6Plain = () => !FLASH && !TINT;
function t6Add(fn) { if (!t6Plain()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
function t6Halo(x, y, r, rgb, a, sy = 1) { // a soft additive light, optionally squashed along y
  t6Add(() => {
    ctx.translate(x, y); ctx.scale(1, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
  });
}
function t6Path(pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); }
function t6Shape(pts, col, w = 1.3) { t6Path(pts); ctx.fillStyle = typeof col === 'string' ? C(col) : col; ctx.fill(); if (w) outline(w); }
function t6VG(y0, y1, col, lt = .35, dk = -.3) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C(shade(col, lt))); g.addColorStop(.5, C(col)); g.addColorStop(1, C(shade(col, dk))); return g; }
function t6Inked(col, w, fn) { // a stroked part with a dark line round it
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = w + 2; ctx.beginPath(); fn(); ctx.stroke();
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke();
}
function t6Star(x, y, r, a, col) { ctx.fillStyle = col; gbStar(x, y, r, a); }
function t6SwingGlow(pose, x, w, h) { if (pose && pose.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.fillStyle = pose.glow; rrect(x, -h / 2, w, h, Math.min(9, h / 2)); ctx.fill(); ctx.restore(); } }

// ======================================================================================================
// THE STARFALL MAUL — a head of black meteoric iron banded in bronze, a fallen star set in its heart
// ======================================================================================================
function t6Hammer(pose) {
  const now = performance.now() / 1000, plain = t6Plain(), pulse = .5 + .5 * Math.sin(now * 1.1), L = 52, cx = 46;
  const fit = !!pose.noHand; if (fit) { ctx.save(); ctx.translate(30, 0); ctx.scale(.78, .78); ctx.translate(-40, 0); } // the card portrait: the great head centred and inside its frame
  // the haft: blackened iron-wood, bound with bronze, a molten seam showing between the bands
  limb([0, 0, L, 0], '#2A2026', 5);
  if (plain) { ctx.strokeStyle = 'rgba(255,190,140,.22)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(2, -1.6); ctx.lineTo(L - 4, -1.6); ctx.stroke(); }
  if (plain) t6Add(() => { ctx.strokeStyle = `rgba(255,150,70,${.45 + .2 * pulse})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(6, .4); ctx.lineTo(28, .4); ctx.stroke(); });
  for (const x of [5, 11, 23, 29]) { rrect(x - 1.2, -3.6, 2.6, 7.2, 1); ctx.fillStyle = t6VG(-3.6, 3.6, '#B8843A', .4, -.35); ctx.fill(); outline(.8); }
  // the pommel: a raw chunk of the same star-iron, a coal still burning in it
  t6Shape([-7, 0, -3, -5, 2.4, -4.6, 3.6, 0, 2.4, 4.6, -3, 5], t6VG(-5, 5, '#3E363E'), 1.1);
  ctx.fillStyle = C('#FF9A4A'); circle(-1.4, 0, 1.5); ctx.fill(); t6Halo(-1.4, 0, 6, '255,150,70', .45);
  // a crowning spike along the haft, forged of the same black iron
  t6Shape([60, -7, 79, -1, 81, 0, 79, 1, 60, 7], t6VG(-7, 7, '#4A4250'), 1.3);
  if (plain) { ctx.fillStyle = 'rgba(255,230,210,.45)'; t6Path([62, -5, 78, -.8, 62, -3]); ctx.fill(); t6Add(() => { ctx.strokeStyle = `rgba(255,140,60,${.5 + .3 * pulse})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(63, 1.6); ctx.lineTo(70, 1.2); ctx.lineTo(73, .2); ctx.stroke(); }); }
  rrect(60, -8.5, 4.4, 17, 1.6); ctx.fillStyle = t6VG(-8.5, 8.5, '#C8963E', .45, -.4); ctx.fill(); outline(1.1); // a bronze collar
  // the head: a heavy anvil block, its striking faces flared and capped with bronze
  const head = [28, -21, 31, -26, 61, -26, 64, -21, 61.5, -10, 63, 0, 61.5, 10, 64, 21, 61, 26, 31, 26, 28, 21, 30.5, 10, 29, 0, 30.5, -10];
  const hg = ctx.createLinearGradient(30, -26, 62, 26); hg.addColorStop(0, C('#5A5060')); hg.addColorStop(.45, C('#342C36')); hg.addColorStop(1, C('#1A161E'));
  t6Path(head); ctx.fillStyle = hg; ctx.fill();
  if (plain) { // pitted, star-flecked iron with molten cracks running out from the core
    ctx.save(); t6Path(head); ctx.clip();
    for (const [x, y, r] of [[35, -14, 2.6], [56, -15, 1.8], [36, 13, 2], [55, 14, 2.8], [41, -20, 1.4], [52, 20, 1.3]]) {
      ctx.fillStyle = 'rgba(14,10,18,.55)'; ell(x, y, r, r * .8); ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,200,.35)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(x, y, r, r * .8, 0, Math.PI * .9, Math.PI * 1.9); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,220,255,.75)'; for (const [x, y] of [[33, -6], [58, -5], [38, 6], [57, 7], [49, -18], [44, 19], [33.5, 18], [59, -19]]) { ctx.fillRect(x, y, .9, .9); }
    ctx.fillStyle = 'rgba(255,240,230,.12)'; t6Path([31, -24, 60, -24, 58, -20, 33, -18]); ctx.fill(); // light along the top
    ctx.restore();
  }
  t6Path(head); outline(1.9);
  const cracks = [[cx - 6, -3, 40.5, -6.5, 38, -10.5, 34.5, -11.5, 31.5, -16], [cx + 6, -3, 52, -7.5, 55.5, -7, 57.5, -10.5, 61.5, -12], [cx - 5.5, 3.5, 40, 7.5, 36.5, 8, 33, 11.5, 29.5, 12.5], [cx + 5.5, 4, 52.5, 9.5, 55, 9, 57.5, 13, 61.5, 15.5],
    [cx - 1, -7.5, 47.5, -11, 45, -14, 46.5, -19.5], [cx + 1, 7.5, 44.5, 11.5, 47.5, 14.5, 45.5, 19.5], [38, -10.5, 37, -15.5], [55.5, 9, 59, 7.5], [36.5, 8, 35, 4.5]];
  const crackPath = () => { ctx.beginPath(); for (const c of cracks) { ctx.moveTo(c[0], c[1]); for (let k = 2; k < c.length; k += 2) ctx.lineTo(c[k], c[k + 1]); } };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  crackPath(); ctx.strokeStyle = FLASH ? '#FFFFFF' : '#140C10'; ctx.lineWidth = 2.6; ctx.stroke();
  t6Add(() => { crackPath(); ctx.strokeStyle = `rgba(255,110,40,${.25 + .15 * pulse})`; ctx.lineWidth = 4.5; ctx.stroke(); });
  crackPath(); ctx.strokeStyle = C('#E8642A'); ctx.lineWidth = 1.5; ctx.stroke();
  t6Add(() => { crackPath(); ctx.strokeStyle = `rgba(255,214,130,${.55 + .35 * pulse})`; ctx.lineWidth = .7; ctx.stroke(); });
  // bronze caps on both striking faces, carved with runes that glow like the core
  for (const s of [-1, 1]) {
    const y = s < 0 ? -27 : 20.5; rrect(30, y, 32, 6.5, 2); ctx.fillStyle = t6VG(y, y + 6.5, '#C8963E', .45, -.4); ctx.fill(); outline(1.3);
    ctx.fillStyle = C('#FFE8B0'); ctx.fillRect(32, s < 0 ? y + .4 : y + .6, 28, 1);
    const glyphs = [[0, -1.8, 0, 1.8, 0, -1.8, 2.6, 0], [0, 1.8, 1.4, -1.8, 2.8, 1.8, .6, 0, 2.2, 0], [0, -1.8, 2.6, 1.8, 2.6, -1.8, 0, 1.8], [1.3, -1.8, 1.3, 1.8, 1.3, -.4, 0, -1.6, 1.3, -.4, 2.6, -1.6]];
    const rune = () => { ctx.beginPath(); glyphs.forEach((gl, i) => { const rx = 35.5 + i * 7.2, ry = y + 3.3; for (let k = 0; k < gl.length; k += 2) { const f = (k === 0 || (gl.length === 12 && k === 6)) ? 'moveTo' : 'lineTo'; ctx[f](rx + gl[k], ry + gl[k + 1] * s); } }); };
    ctx.lineCap = 'round'; rune(); ctx.strokeStyle = C('#5A2A14'); ctx.lineWidth = 1.4; ctx.stroke();
    t6Add(() => { rune(); ctx.strokeStyle = `rgba(255,170,80,${.6 + .3 * pulse})`; ctx.lineWidth = .8; ctx.stroke(); });
  }
  // the core: a fallen star in a ring of bronze
  circle(cx, 0, 8.2); ctx.fillStyle = t6VG(-8, 8, '#C8963E', .45, -.4); ctx.fill(); outline(1.3);
  const cr = 5.6 + .3 * pulse;
  circle(cx, 0, cr);
  if (plain) { const g = ctx.createRadialGradient(cx - 1, -1, 0, cx, 0, cr); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.35, '#FFE9A0'); g.addColorStop(.75, '#FF8A34'); g.addColorStop(1, '#9A2C12'); ctx.fillStyle = g; }
  else ctx.fillStyle = C('#FFE9A0');
  ctx.fill(); outline(.9);
  t6Halo(cx, 0, 16, '255,200,120', .55 + .2 * pulse);
  t6Add(() => { ctx.translate(cx, 0); ctx.rotate(now * .25); ctx.fillStyle = 'rgba(255,250,230,.95)'; gbStar(0, 0, 4.8 + .6 * pulse, .9); ctx.rotate(Math.PI / 4); gbStar(0, 0, 2.8, .7); });
  // a few embers drifting slowly off the cracks
  t6Add(() => {
    for (let i = 0; i < 5; i++) {
      const ph = (now * .22 + i / 5) % 1, a = i / 5 * TAU + .6, d = 12 + ph * 24;
      ctx.fillStyle = `rgba(255,${180 + 50 * (1 - ph) | 0},110,${Math.sin(ph * Math.PI) * .75})`; circle(cx + Math.cos(a) * d * .8, Math.sin(a) * d, 1.1 - ph * .4); ctx.fill();
    }
  });
  t6SwingGlow(pose, 26, 56, 58);
  if (fit) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
}

// ======================================================================================================
// THE MOONWOOD STAFF — living silverwood wound with silver, rings of moonlight floating along it
// ======================================================================================================
function t6Staff(pose) {
  const now = performance.now() / 1000, plain = t6Plain(), len = 62, back = -30, pulse = .5 + .5 * Math.sin(now * .9);
  const sc = pose.noHand ? .86 : 1; if (sc !== 1) { ctx.save(); ctx.translate(15, 0); ctx.scale(sc, sc); ctx.translate(-22, 0); } // the card portrait: the moon kept inside its frame

  // a silver-blue ribbon, swaying slowly
  const sway = Math.sin(now * 1.3) * 3;
  { // a pennon of silver-blue silk with a forked tail, hanging from the far end
    const bx = back + 4, by = 1.5, mx = back - 3, my = 10, ex = back - 7 + sway, ey = 21, N = 8, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N, x = (1 - k) * (1 - k) * bx + 2 * k * (1 - k) * mx + k * k * ex, y = (1 - k) * (1 - k) * by + 2 * k * (1 - k) * my + k * k * ey;
      const dx = 2 * (1 - k) * (mx - bx) + 2 * k * (ex - mx), dy = 2 * (1 - k) * (my - by) + 2 * k * (ey - my), L = Math.hypot(dx, dy) || 1, hw = 2 + k * 1.4 + Math.sin(now * 1.1 + k * 3) * .3;
      top.push([x - dy / L * hw, y + dx / L * hw]); bot.push([x + dy / L * hw, y - dx / L * hw]);
    }
    const last = top.length - 1, fx = (top[last][0] + bot[last][0]) / 2, fy = (top[last][1] + bot[last][1]) / 2;
    ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(fx - (ex - mx) * .12, fy - (ey - my) * .16); // the fork
    for (let i = last; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
    ctx.fillStyle = t6VG(0, 22, '#8FB4E8', .4, -.3); ctx.fill(); outline(1);
    if (t6Plain()) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = .7; ctx.beginPath(); top.slice(1, -1).forEach(([x, y], i) => { const b = bot[i + 1], X = x * .7 + b[0] * .3, Y = y * .7 + b[1] * .3; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      ctx.fillStyle = '#E8F0FF'; const c = [(top[3][0] + bot[3][0]) / 2, (top[3][1] + bot[3][1]) / 2]; gbStar(c[0], c[1], 1.6, .9); } } // a silver star sewn on it
  // floating rings around the shaft: the far half behind it, the near half in front
  const rings = [[len - 10, 0], [len - 21, 1.7], [back + 12, 3.4]].map(([x, p]) => ({ x: x + Math.sin(now * .55 + p) * 2.4, rx: 1.6 + 1.2 * Math.abs(Math.sin(now * .4 + p)), ry: 6.6, p }));
  const ringHalf = (r, near) => { ctx.ellipse(r.x, 0, r.rx, r.ry, 0, near ? -Math.PI / 2 : Math.PI / 2, near ? Math.PI / 2 : Math.PI * 1.5); };
  for (const r of rings) t6Inked('#7E8EB0', 1, () => ringHalf(r, false));
  // the shaft: pale living wood with a grain, the silver spiral wound round it
  limb([back, 0, len, 0], '#D8C89A', 4);
  if (plain) {
    ctx.strokeStyle = 'rgba(120,96,60,.5)'; ctx.lineWidth = .5; ctx.beginPath(); for (const y of [-1, .9]) { ctx.moveTo(back + 2, y); ctx.bezierCurveTo(0, y + .6, 30, y - .6, len - 2, y); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,235,.55)'; ctx.fillRect(back + 2, -1.8, len - back - 4, .7);
  }
  for (const ph of [0, Math.PI]) { // two silver strands spiraling the shaft: bright where they pass in front
    for (let x = back + 3; x < len - 3; x += 1.2) {
      const a = x * .2 + ph, y0 = Math.sin(a) * 2.2, y1 = Math.sin(a + .24) * 2.2, front = Math.cos(a) > 0;
      ctx.strokeStyle = C(front ? '#F4F7FF' : '#8890A8'); ctx.lineWidth = front ? 1.1 : .7; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 1.3, y1); ctx.stroke();
    }
  }
  // young leaves sprouting from the wood
  for (const [x, s, a] of [[-18, -1, -.7], [2, 1, .8], [36, -1, -.6], [46, 1, .7]]) {
    ctx.save(); ctx.translate(x, s * 1.6); ctx.rotate(a); ell(2.6, 0, 2.8, 1.2); ctx.fillStyle = C('#7FBE6E'); ctx.fill(); outline(.6);
    if (plain) { ctx.strokeStyle = '#D8F0B8'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(.4, 0); ctx.lineTo(4.6, 0); ctx.stroke(); } ctx.restore();
  }
  for (const x of [8, 25]) { rrect(x - 1.4, -2.9, 2.8, 5.8, 1); ctx.fillStyle = t6VG(-3, 3, '#C8D0E0', .5, -.35); ctx.fill(); outline(.8); } // silver collars either side of the grip
  // the far end: a leaf-shaped spear of moonsilver
  ctx.beginPath(); ctx.moveTo(back + 2, -2.4); ctx.quadraticCurveTo(back - 8, -5.6, back - 20, 0); ctx.quadraticCurveTo(back - 8, 5.6, back + 2, 2.4); ctx.closePath();
  ctx.fillStyle = t6VG(-5, 5, '#DCE6F4', .45, -.35); ctx.fill(); outline(1.2);
  ctx.strokeStyle = C('#8A9ABA'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(back + 1, 0); ctx.lineTo(back - 17, 0); ctx.stroke();
  rrect(back - 1, -3.4, 4, 6.8, 1.4); ctx.fillStyle = t6VG(-3.4, 3.4, '#C8D0E0', .5, -.35); ctx.fill(); outline(.9);
  // the near end: a crescent moon cradling a moonstone, a silver point through its heart
  const X = len;
  t6Shape([X + 2, -2.8, X + 19, -2.2, X + 28, 0, X + 19, 2.2, X + 2, 2.8], t6VG(-2.8, 2.8, '#E8EEF8', .5, -.3), 1.1);
  ctx.beginPath(); ctx.moveTo(X - 2, -3); ctx.bezierCurveTo(X + 4, -16, X + 16, -21, X + 24, -16); ctx.bezierCurveTo(X + 15, -16, X + 8, -11, X + 7, 0);
  ctx.bezierCurveTo(X + 8, 11, X + 15, 16, X + 24, 16); ctx.bezierCurveTo(X + 16, 21, X + 4, 16, X - 2, 3); ctx.closePath();
  const mg = ctx.createLinearGradient(X, -20, X + 12, 20); mg.addColorStop(0, C('#FFFFFF')); mg.addColorStop(.5, C('#DCE6F6')); mg.addColorStop(1, C('#94A6C8'));
  ctx.fillStyle = mg; ctx.fill(); outline(1.3);
  if (plain) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(X + 2, -5); ctx.bezierCurveTo(X + 6, -14, X + 14, -18, X + 21, -16.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,110,160,.6)'; ctx.beginPath(); ctx.moveTo(X + 4, 6); ctx.bezierCurveTo(X + 7, 12, X + 13, 15.4, X + 20, 16); ctx.stroke(); }
  if (plain) { ctx.strokeStyle = 'rgba(110,130,180,.75)'; ctx.lineWidth = .5; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(X + 3, s * 6); ctx.quadraticCurveTo(X + 6, s * 11, X + 9, s * 10); ctx.quadraticCurveTo(X + 11, s * 9, X + 10, s * 12); ctx.quadraticCurveTo(X + 13, s * 16, X + 17, s * 16.5); } ctx.stroke(); } // filigree on the moon
  rrect(X - 3, -3.6, 4.4, 7.2, 1.5); ctx.fillStyle = t6VG(-3.6, 3.6, '#C8D0E0', .5, -.35); ctx.fill(); outline(.9);
  const ox = X + 14; circle(ox, 0, 4.6);
  if (plain) { const g = ctx.createRadialGradient(ox - 1.4, -1.4, 0, ox, 0, 4.6); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, '#D6E6FF'); g.addColorStop(1, '#7E98CC'); ctx.fillStyle = g; } else ctx.fillStyle = C('#D6E6FF');
  ctx.fill(); outline(1);

  t6Add(() => { for (let i = 0; i < 3; i++) { const a = now * .5 + i / 3 * TAU; ctx.fillStyle = `rgba(225,238,255,${.55 + .3 * Math.sin(a)})`; circle(ox + Math.cos(a) * 3.2, Math.sin(a) * 8.6, .9 + .3 * Math.sin(a)); ctx.fill(); } }); // motes circling the moonstone
  // the near half of each ring, glowing with moonlight
  for (const r of rings) { t6Inked('#E4EEFF', 1.1, () => ringHalf(r, true)); t6Add(() => { ctx.strokeStyle = `rgba(170,210,255,${.35 + .2 * pulse})`; ctx.lineWidth = 2.6; ctx.beginPath(); ringHalf(r, true); ctx.stroke(); }); }
  t6Add(() => { ctx.fillStyle = 'rgba(240,246,255,.85)'; for (let i = 0; i < 3; i++) { const a = Math.max(0, Math.sin(now * .8 - i * 2.1)); gbStar(i === 1 ? X + 28 : X + 24, (i - 1) * 16, 1 + a * 2.2, .3 + a * .6); } }); // the crescent's tips and point catch the light
  t6SwingGlow(pose, back - 20, len - back + 46, 18);
  if (sc !== 1) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
}

// ======================================================================================================
// THE ECLIPSE BLADE — a broad greatsword of sun-gold, a channel of starry night down its heart, an eclipsed sun for a guard
// ======================================================================================================
function t6Sword(pose) {
  const now = performance.now() / 1000, plain = t6Plain(), pulse = .5 + .5 * Math.sin(now * 1.0);
  const sc = pose.noHand ? .8 : 1; if (sc !== 1) { ctx.save(); ctx.translate(40, 0); ctx.scale(sc, sc); ctx.translate(-40, 0); } // keep the card portrait inside its frame
  const len = 86, x0 = 22, tip = x0 + len + 8, W = 8.4;
  const wAt = (x) => x < x0 + 6 ? W : W - (W - 5) * Math.min(1, (x - x0 - 6) / (len * .86 - 6)); // the blade's half-width along its length
  // the grip, wound with gold wire, and a sunburst pommel
  limb([3, 0, 18, 0], '#1E1A24', 4.6);
  if (plain) { ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 5; x < 17; x += 1.7) { ctx.moveTo(x, -2.2); ctx.lineTo(x + 1.2, 2.2); } ctx.stroke(); }
  ctx.save(); ctx.translate(2, 0); ctx.rotate(now * .15);
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 3.4 : 6.4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
  ctx.fillStyle = t6VG(-6, 6, '#E8B850', .45, -.35); ctx.fill(); outline(1); ctx.restore();
  circle(2, 0, 2.2); ctx.fillStyle = C('#120E1A'); ctx.fill(); outline(.8);
  // the blade: broad and long, with sun-spurs flaring at its base
  const blade = () => {
    ctx.beginPath(); ctx.moveTo(x0, -W);
    ctx.lineTo(x0 + 10, -W); ctx.lineTo(x0 + 13, -W - 3.4); ctx.lineTo(x0 + 16, -W + .6); // a spur
    ctx.quadraticCurveTo(x0 + len * .5, -W * .82, x0 + len * .86, -5); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .86, 5);
    ctx.quadraticCurveTo(x0 + len * .5, W * .82, x0 + 16, W - .6); ctx.lineTo(x0 + 13, W + 3.4); ctx.lineTo(x0 + 10, W); ctx.lineTo(x0, W); ctx.closePath();
  };
  blade();
  const bg = ctx.createLinearGradient(0, -W, 0, W); bg.addColorStop(0, C('#FFF8DC')); bg.addColorStop(.3, C('#F6D27A')); bg.addColorStop(.7, C('#E0A848')); bg.addColorStop(1, C('#9A6428'));
  ctx.fillStyle = bg; ctx.fill(); outline(2);
  if (plain) { ctx.save(); blade(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 2, -W + 1.2); ctx.lineTo(x0 + 10, -W + 1.2); ctx.moveTo(x0 + 16, -W + 1.8); ctx.quadraticCurveTo(x0 + len * .5, -W * .82 + 1.2, x0 + len * .86, -4); ctx.lineTo(tip - 2, -.3); ctx.stroke(); // the honed edge
    ctx.strokeStyle = 'rgba(120,70,20,.55)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x0 + 4, -W * .55); ctx.quadraticCurveTo(x0 + len * .5, -W * .45, tip - 6, 0); ctx.moveTo(x0 + 4, W * .55); ctx.quadraticCurveTo(x0 + len * .5, W * .45, tip - 6, 0); ctx.stroke(); // the bevels
    ctx.restore(); }
  // the channel of night down the blade's heart: stars in it, and a slow river of sunfire
  const c0 = x0 + 4, c1 = x0 + len * .8, cw = (x) => 2.8 - 1.4 * (x - c0) / (c1 - c0);
  const chan = () => { ctx.beginPath(); ctx.moveTo(c0, -cw(c0)); ctx.quadraticCurveTo((c0 + c1) / 2, -cw((c0 + c1) / 2) - .2, c1, -cw(c1)); ctx.lineTo(c1 + 4, 0); ctx.lineTo(c1, cw(c1)); ctx.quadraticCurveTo((c0 + c1) / 2, cw((c0 + c1) / 2) + .2, c0, cw(c0)); ctx.closePath(); };
  chan(); ctx.fillStyle = C('#1A1430'); ctx.fill(); outline(.9);
  if (plain) {
    ctx.save(); chan(); ctx.clip();
    const ng = ctx.createLinearGradient(0, -3, 0, 3); ng.addColorStop(0, '#3A2C66'); ng.addColorStop(.5, '#16102A'); ng.addColorStop(1, '#0C0818'); ctx.fillStyle = ng; ctx.fillRect(c0, -3, c1 - c0 + 5, 6);
    for (let i = 0; i < 14; i++) { const x = c0 + 2 + i * (c1 - c0) / 14, y = Math.sin(i * 2.7) * cw(x) * .6, a = .45 + .4 * Math.sin(now * .7 + i * 1.9); ctx.fillStyle = `rgba(255,248,230,${a})`; ctx.fillRect(x, y - .4, .8, .8); }
    ctx.restore();
    t6Add(() => { // the sunfire, a meander of gold light with a brighter swell travelling slowly toward the point
      const p = c0 + ((now * .18) % 1.3) * (c1 - c0);
      const g = ctx.createLinearGradient(c0, 0, c1, 0); const st = (x, a) => g.addColorStop(clamp((x - c0) / (c1 - c0), 0, 1), `rgba(255,210,120,${a})`);
      st(c0, .7); st(p - 14, .7); st(p, 1); st(p + 14, .7); st(c1, .7);
      const fire = () => { ctx.beginPath(); for (let x = c0 + 1; x <= c1; x += .8) { const y = (Math.sin(x * .45) * .7 + Math.sin(x * 1.1) * .2) * cw(x) * .8; x === c0 + 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      fire(); ctx.strokeStyle = 'rgba(255,150,60,.35)'; ctx.lineWidth = 2.6; ctx.stroke();
      fire(); ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();
      fire(); ctx.strokeStyle = 'rgba(255,250,225,.75)'; ctx.lineWidth = .45; ctx.stroke();
    });
  }
  // motes of light running slowly up both edges toward the point
  t6Add(() => { for (let i = 0; i < 6; i++) { const ph = (now * .1 + i / 6) % 1, x = x0 + 18 + ph * (len - 16), s = i % 2 ? 1 : -1; t6Star(x, s * (wAt(x) - 1.2), 1.4 + Math.sin(ph * Math.PI) * 1.2, Math.sin(ph * Math.PI) * .85, '#FFF6DC'); } });
  t6Add(() => { ctx.fillStyle = '#FFFBEA'; gbStar(tip - 1, 0, 3.4 + .8 * pulse, .9); });
  // the guard: fanned rays of gold like a sun's crown, swept back over the hand
  for (const s of [-1, 1]) {
    for (const [ang, L2, hw, col] of [[.78, 13, 2.2, '#C8963E'], [.42, 18, 2.6, '#D8A848'], [.1, 25, 3, '#F2C860']]) { // rays leaning back over the hand
      const bx = 21, by = s * 4, dx = -Math.sin(ang), dy = s * Math.cos(ang), px = -dy, py = dx;
      const tx = bx + dx * L2, ty = by + dy * L2;
      ctx.beginPath(); ctx.moveTo(bx + px * hw, by + py * hw); ctx.quadraticCurveTo(bx + dx * L2 * .55 + px * hw * .9, by + dy * L2 * .55 + py * hw * .9, tx, ty);
      ctx.quadraticCurveTo(bx + dx * L2 * .55 - px * hw * .6, by + dy * L2 * .55 - py * hw * .6, bx - px * hw, by - py * hw); ctx.closePath();
      const rg = ctx.createLinearGradient(bx + px * hw, by + py * hw, bx - px * hw, by - py * hw); rg.addColorStop(0, C(shade(col, .5))); rg.addColorStop(1, C(shade(col, -.3)));
      ctx.fillStyle = rg; ctx.fill(); outline(1.1);
    }
  }
  rrect(17.5, -7.5, 7, 15, 2.4); ctx.fillStyle = t6VG(-7.5, 7.5, '#E8B850', .45, -.4); ctx.fill(); outline(1.3);
  // the eclipse: a black sun with its corona turning slowly about it, a bright bead of light at its rim
  const ex = 21, er = 5.4;
  t6Halo(ex, 0, 18, '255,214,140', .5 + .2 * pulse);
  t6Add(() => { // long, faint sunbeams turning slowly about the eclipse
    ctx.translate(ex, 0); ctx.rotate(-now * .08);
    for (let i = 0; i < 10; i++) { const L3 = i % 2 ? 20 : 30; ctx.rotate(TAU / 10);
      const g = ctx.createLinearGradient(0, 0, L3, 0); g.addColorStop(0, 'rgba(255,220,150,.38)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -1.6); ctx.lineTo(L3, 0); ctx.lineTo(0, 1.6); ctx.closePath(); ctx.fill(); }
  });
  ctx.save(); ctx.translate(ex, 0); ctx.rotate(now * .2);
  ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? er + 1.4 : er + 4 + (i % 4 ? 0 : 1.6); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
  ctx.fillStyle = C('#FFE29A'); ctx.fill(); outline(.9); ctx.restore();
  circle(ex, 0, er); ctx.fillStyle = C('#0E0A16'); ctx.fill(); outline(1.1);
  if (plain) { ctx.strokeStyle = 'rgba(120,90,200,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(ex, 0, er - 1.4, 2.2, 4.4); ctx.stroke(); }
  t6Add(() => { const a = -.9 + now * .05; ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ex, 0, er, a - .7, a + .7); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; gbStar(ex + Math.cos(a) * er, Math.sin(a) * er, 3.2 + pulse, .95); });
  t6SwingGlow(pose, 16, len + 18, 22);
  if (sc !== 1) ctx.restore();
  if (!pose.noHand) gripHand(pose.glove || '#FFF1E0'); // his fingers closed over the grip
}

// ======================================================================================================
// GRAYSWANDIR, in its true form — still slim and quick: night-silver with the Pattern of Amber alight in it
// ======================================================================================================
function t6Rapier(pose) {
  const now = performance.now() / 1000, plain = t6Plain(), pulse = .5 + .5 * Math.sin(now * .9);
  const len = 54, x0 = 20, tip = x0 + len + 5, w = 2.2;
  // the grip, black and wound with silver wire, a silver rose for a pommel
  limb([5, 0, 17, 0], '#141218', 3.8);
  ctx.strokeStyle = C('#DCE0EC'); ctx.lineWidth = .7; ctx.beginPath(); for (let x = 6.6; x < 16; x += 1.5) { ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); } ctx.stroke();
  gbRose(3.4, 0, 3.9, '#D8DCE8', '#3FBF6A'); t6Halo(3.4, 0, 5, '110,230,150', .35);
  // the blade: a short ricasso, then long and narrow to a needle point
  const blade = () => { ctx.beginPath(); ctx.moveTo(x0, -w * 1.15); ctx.lineTo(x0 + 6, -w * 1.15); ctx.lineTo(x0 + 7.5, -w); ctx.lineTo(x0 + len * .84, -w * .66); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .84, w * .66); ctx.lineTo(x0 + 7.5, w); ctx.lineTo(x0 + 6, w * 1.15); ctx.lineTo(x0, w * 1.15); ctx.closePath(); };
  blade();
  const bg = ctx.createLinearGradient(0, -w, 0, w); bg.addColorStop(0, C('#E4E8FA')); bg.addColorStop(.32, C('#8890B0')); bg.addColorStop(.62, C('#3E4258')); bg.addColorStop(1, C('#5A6080'));
  ctx.fillStyle = bg; ctx.fill(); outline(1.5);
  ctx.save(); blade(); ctx.clip();
  ctx.fillStyle = C('#F4F6FF'); ctx.fillRect(x0 + 1, -w * 1.15, len + 4, w * .42); // the edge catching the light
  if (plain) { ctx.fillStyle = 'rgba(200,210,255,.55)'; ctx.fillRect(x0 + 1, w * .62, len + 4, .45); }
  ctx.restore();
  // the Pattern of Amber down the blade: etched dark, then lit, with a swell of light travelling slowly to the point
  const p0 = x0 + 7, p1 = x0 + len * .9, amp = w * .5;
  const pat = () => { ctx.beginPath(); for (let x = p0; x <= p1; x += .6) { const k = (x - p0) / (p1 - p0), y = (Math.sin(x * .5) * (1 - k * .5) + Math.sin(x * 1.15 + 1) * .28) * amp; x === p0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } };
  if (plain) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; pat(); ctx.strokeStyle = '#1C1E2C'; ctx.lineWidth = 1.3; ctx.stroke();
    t6Add(() => {
      const p = p0 + ((now * .16) % 1.4) * (p1 - p0);
      const g = ctx.createLinearGradient(p0, 0, p1, 0); const st = (x, a) => g.addColorStop(clamp((x - p0) / (p1 - p0), 0, 1), `rgba(190,205,255,${a})`);
      st(p0, .45 + .15 * pulse); st(p - 12, .45 + .15 * pulse); st(p, 1); st(p + 12, .45 + .15 * pulse); st(p1, .45 + .15 * pulse);
      pat(); ctx.strokeStyle = g; ctx.lineWidth = 1.7; ctx.stroke();
      pat(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .55; ctx.stroke();
    });
  }
  // stars caught along the edge, each breathing slowly
  t6Add(() => {
    for (let i = 0; i < 7; i++) { const k = (i + .6) / 7.4, x = x0 + 8 + (len - 10) * k, a = .3 + .55 * (.5 + .5 * Math.sin(now * .8 + i * 1.7)); t6Star(x, (i % 2 ? -1 : 1) * w * .75 * (1 - k * .3), 1.3 + a * 1.4, a, '#F2F0FF'); }
  });
  // the guard: a knuckle bow of thorned silver vine, swept quillons ending in rosebuds, a cup of silver petals
  t6Inked('#C8CCDA', 1.5, () => { ctx.moveTo(18, -4.5); ctx.bezierCurveTo(13, -12.5, 5, -9.5, 2.6, -3); });
  ctx.strokeStyle = C('#C8CCDA'); ctx.lineWidth = .9; ctx.beginPath(); for (const k of [.25, .48, .72]) { const x = 18 - 15.4 * k, y = -4.5 - 7 * Math.sin(k * Math.PI); ctx.moveTo(x, y); ctx.lineTo(x - 1.3, y - 2.3); } ctx.stroke();
  for (const [x, y, a] of [[11, -10.4, -.5], [5.6, -8.6, -1.2]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ell(0, -1.6, 1, 2); ctx.fillStyle = C('#9ACDA8'); ctx.fill(); outline(.5); ctx.restore(); } // silver-green leaves on the vine
  t6Inked('#D8DCE8', 1.7, () => { ctx.moveTo(19, -1); ctx.quadraticCurveTo(22.5, -9, 28, -11.5); ctx.moveTo(19, 1); ctx.quadraticCurveTo(15, 9.5, 9.5, 11.5); });
  for (const [x, y] of [[28.4, -11.6], [9.2, 11.6]]) { ctx.fillStyle = C('#4FAE6A'); ell(x, y, 1.7, 1.7); ctx.fill(); outline(.6); ctx.fillStyle = C('#ECEFF8'); ell(x + (y < 0 ? .7 : -.7), y, 1.5, 1.2); ctx.fill(); outline(.6); } // rosebuds
  // the rose seen three-quarters on: an oval of outer petals, a turned ring of inner ones
  const RX = 19, RS = .62; // squash across the blade, so the rose reads as a cup turned toward the hand
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; ctx.save(); ctx.translate(RX + Math.cos(a) * 5.6 * RS, Math.sin(a) * 5.6); ctx.rotate(Math.atan2(Math.sin(a), Math.cos(a) * RS)); ell(0, 0, 3.6, 3.1 * (.7 + .3 * Math.abs(Math.sin(a)))); ctx.fillStyle = t6VG(-3, 3, ['#C4CAD8', '#E6EAF4', '#D2D7E4'][i % 3], .4, -.3); ctx.fill(); outline(.8);
    if (plain) { ctx.strokeStyle = 'rgba(90,96,120,.6)'; ctx.lineWidth = .45; ctx.beginPath(); ctx.arc(-1.4, 0, 2.2, -1, 1); ctx.stroke(); } ctx.restore(); } // the outer petals, each curled at its lip
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .7; ctx.save(); ctx.translate(RX + Math.cos(a) * 3.3 * RS, Math.sin(a) * 3.3); ctx.rotate(Math.atan2(Math.sin(a), Math.cos(a) * RS)); ell(0, 0, 2.5, 2.2); ctx.fillStyle = C(i % 2 ? '#F4F6FC' : '#CDD2E0'); ctx.fill(); outline(.7); ctx.restore(); } // the inner petals
  // the green stone at its heart, the color of his eyes
  circle(19, 0, 2.9); ctx.fillStyle = C('#E4E8F2'); ctx.fill(); outline(.7);
  circle(19, 0, 2.2);
  if (plain) { const g = ctx.createRadialGradient(18.3, -.7, 0, 19, 0, 2.2); g.addColorStop(0, '#D8FFE4'); g.addColorStop(.45, '#4FCB7A'); g.addColorStop(1, '#0E4A28'); ctx.fillStyle = g; } else ctx.fillStyle = C('#4FAE6A');
  ctx.fill(); outline(.6);
  t6Halo(19, 0, 8, '110,240,150', .42 + .18 * pulse);
  t6Add(() => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(18, -1.2, .8, .8); });
  t6SwingGlow(pose, 16, len + 12, 16);
  if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
}

// level 7: the same legendary weapon, now gilt: a thin line of gold light runs its length, with a glint travelling
// slowly from the hand to the tip and a mote of gold drifting off it now and then
function t7Gilt(kind, pose) {
  if (!t6Plain()) return;
  const [a, b] = { hammer: [6, 56], staff: [-26, 64], sword: [22, 96], grayblade: [20, 70], rapier: [20, 70] }[kind] || [10, 60];
  const now = performance.now() / 1000, q = (now * .32) % 1, gx = a + (b - a) * q;
  t6Add(() => {
    ctx.strokeStyle = 'rgba(255,214,120,.32)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a, -1.8); ctx.lineTo(b, -1.8); ctx.stroke();
    const g = ctx.createRadialGradient(gx, -1.8, 0, gx, -1.8, 9); g.addColorStop(0, 'rgba(255,236,170,.75)'); g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g; ctx.fillRect(gx - 9, -11, 18, 18);
    t6Star(gx, -1.8, 2.6, .9, 'rgba(255,250,225,.95)');
  });
}
const _drawWeapon6 = drawWeapon;
drawWeapon = function (kind, pose) {
  if (pose && pose.tier >= 6) {
    const f = { hammer: t6Hammer, staff: t6Staff, sword: t6Sword, grayblade: t6Rapier, rapier: t6Rapier }[kind];
    if (f) { f(pose); if (pose.tier >= 7) t7Gilt(kind, pose); return; }
  }
  return _drawWeapon6(kind, pose);
};
