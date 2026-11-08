'use strict';
// ======================================================================================================
// THE CURSED WEAPONS' OWN ART (cursedw.js draws every cursed or purified weapon through CWART instead of the
// weapon's own form: in his hand, on the street as a drop, on its forge card and in the HUD, and its swing trails)
// ------------------------------------------------------------------------------------------------------
// Each is drawn in hand space like every weapon (the hand at (16,0), the weapon along +x), at the reach of the form it
// replaces. The curse takes more of it from C3 to C8 (K: 0 at C3, 1 at C8); purified, it is the curse burned out.
//   Nightrender   fused obsidian and bone, a molten seam down its core, the Black Circle a void in its guard, smoke
//                 pouring off its edge; at C7-C8 the blade cracks and the void shows through
//   Dawnrender    sunlit crystal edged in gold, a white-burning core, a halo of turning rays at the guard, gold wings
//   Gravemaul     a coffin of black iron for a head, nailed and banded, chains hanging off it, a grave-sigil burning
//                 red on its lid; the lid works loose as the curse deepens, and something looks out
//   Dawnmaul      a bell of white gold with a sun on its waist, a clapper swinging, rings of sound going out of it
//   Blackthorn    black briar with a thorned vine crawling up it, red sap in its cracks, a skull-knot for a head
//   Whitethorn    white ash wound with a gold vine in flower, a great bloom for a head, a spear of light out of it
//   Thorn of      a black-steel blade barbed with thorns, a black rose for a cup that bleeds and sheds its petals,
//   Lorraine      the blood running down the blade's channel and dripping from its point
//   Rose of       a white-and-gold blade, a white rose with a gold heart for a cup, petals of light drifting off it
//   Lorraine
//   Black         black clawed gauntlets, the Circle a void on the back of each hand, claws lengthening with the curse
//   Knuckles
//   Dawn          gilded gauntlets in white enamel, a sunburst over the knuckles
//   Knuckles
// Every color goes through C() (FLASH: flat white, TINT: one color); glows only when plain; smoke, embers, motes and
// petals, and the soft halos, only when detailed (not LITE / lighter paint / a crowd); no drifting things on a card. Motion from performance.now().
// ======================================================================================================
const CWART = (() => {
  const P_ = Math.PI, TW = Math.PI * 2;
  let T = 0, PL = true, DET = true, GLOW = true, K = 0, ICONQ = false;
  const H = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const lite = () => (typeof LITE !== 'undefined' && LITE) || (typeof PAINT_LITE !== 'undefined' && PAINT_LITE) || (typeof PAINT_Q !== 'undefined' && PAINT_Q === 0) || (typeof CROWD !== 'undefined' && CROWD);
  const setup = (A, icon) => { T = performance.now() / 1000; PL = !FLASH && !TINT; DET = PL && !lite() && !icon; GLOW = PL && (!!icon || DET); ICONQ = !!icon; K = A.pure ? 1 : (clamp(A.lvl || 3, 3, 8) - 3) / 5; };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const shape = (pts, fill, w) => { poly(pts); ctx.fillStyle = typeof fill === 'string' ? C(fill) : fill; ctx.fill(); if (w) outline(w); };
  const vg = (y0, y1, col, lt = .35, dk = -.35) => { if (!PL) return C(col); const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(col, lt)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, dk)); return g; };
  const add = (fn) => { if (!PL) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const halo = (x, y, r, rgb, a, sy = 1) => GLOW && add(() => { ctx.translate(x, y); ctx.scale(1, sy); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`); g.addColorStop(.45, `rgba(${rgb},${(a * .4).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); });
  const inked = (col, w, fn) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = w + 1.7 * OUTK; ctx.beginPath(); fn(); ctx.stroke(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke(); };
  const star = (x, y, r, a, col) => { ctx.fillStyle = col; gbStar(x, y, r, a); };
  const UP = () => typeof t8Up === 'function' ? t8Up() : [0, -1];
  const beatOf = (sp) => { const p = (T * sp) % 1; return Math.exp(-(((p - .08) / .05) ** 2)) + .6 * Math.exp(-(((p - .26) / .05) ** 2)); };
  // things that leave the weapon and drift in the world's up (smoke, embers) or fall (blood, sap, petals): src(i) -> [x, y]
  // kind: 'puff' (dark, drawn over), 'ember' / 'mote' / 'glint' (light, added), 'petal' (a petal, its colour cols[i])
  function drift(src, n, rise, kind, cols, size, fall) {
    if (!DET || n <= 0) return;
    const [u0, u1] = UP(), ux = fall ? -u0 : u0, uy = fall ? -u1 : u1, px = -uy, py = ux;
    onPage(() => { ctx.save();
      if (kind !== 'puff' && kind !== 'petal') ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const sp = .35 + .35 * H(i + 7), p = (T * sp + H(i * 3.1)) % 1, [x, y] = src(i), d = rise * (fall ? p * p : p), sw = Math.sin(T * 1.7 + i * 2.3) * (kind === 'petal' ? 6 : 3) * p;
        const X = x + ux * d + px * sw, Y = y + uy * d + py * sw, a = Math.sin(P_ * Math.min(1, p * 1.2)) * (kind === 'puff' ? .75 : .95);
        if (a <= .02) continue;
        ctx.globalAlpha = a; ctx.fillStyle = cols[i % cols.length];
        if (kind === 'puff') { circle(X, Y, size * (.55 + 1.1 * p)); ctx.fill(); }
        else if (kind === 'petal') { ell(X, Y, size, size * .55, T * 2 + i * 1.3); ctx.fill(); }
        else if (kind === 'glint') gbStar(X, Y, size * (.6 + .6 * Math.sin(P_ * p)), a);
        else { circle(X, Y, size * (1 - .5 * p)); ctx.fill(); }
      }
      ctx.restore();
    });
  }
  const swingGlow = (pose, x, w, h) => { if (pose.glow && PL) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.fillStyle = pose.glow; rrect(x, -h / 2, w, h, Math.min(9, h / 2)); ctx.fill(); ctx.restore(); } };
  const thorn = (x, y, ang, len, w, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, -w); ctx.quadraticCurveTo(len * .5, -w * .5, len, w * .3); ctx.quadraticCurveTo(len * .45, w * .5, 0, w); ctx.closePath(); ctx.fillStyle = C(col); ctx.fill(); outline(.45); ctx.restore(); };
  const sunburst = (x, y, r0, r1, n, rot, rgb, a) => GLOW && add(() => { ctx.translate(x, y); ctx.rotate(rot); for (let i = 0; i < n; i++) { ctx.rotate(TW / n); const L = i % 2 ? r1 * .7 : r1; ctx.fillStyle = `rgba(${rgb},${(i % 2 ? a * .6 : a).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(r0, -1.3); ctx.lineTo(L, 0); ctx.lineTo(r0, 1.3); ctx.closePath(); ctx.fill(); } });

  // ======================================================================================================
  // THE GREAT SWORD
  // ======================================================================================================
  function nightrender(pose) {
    const x0 = 22, len = 88, tip = x0 + len + 6, W = 9.2, xm = x0 + len * .84, k = K, beat = .5 + .5 * Math.sin(T * 2.4);
    if (PL) halo(x0 + len * .5, 0, len * .62, '150,16,50', .16 + .08 * beat + .08 * k, .3);
    // smoke pouring off both edges, embers rising off the seam
    drift((i) => [x0 + 8 + H(i + 90) * (len - 12), (i % 2 ? -1 : 1) * W * .7], 4 + Math.round(6 * k), 24 + 10 * k, 'puff', ['rgba(12,6,16,.6)', 'rgba(46,18,54,.5)', 'rgba(80,14,30,.4)'], 2.4);
    drift((i) => [x0 + 6 + H(i + 40) * len * (.5 + .4 * k), 0], 3 + Math.round(4 * k), 30, 'ember', ['#FF5A2A', '#FFB070', '#FF2A3A'], .9);
    // the grip, bound in red cord; a horned pommel with a red eye
    limb([3, 0, 18, 0], '#120C14', 4.8);
    if (PL) { ctx.strokeStyle = '#7A1424'; ctx.lineWidth = .8; ctx.beginPath(); for (let x = 5; x < 17; x += 2) { ctx.moveTo(x, -2.3); ctx.lineTo(x + 1.4, 2.3); } ctx.stroke(); }
    shape([[-5, 0], [-1.4, -3.4], [-2.4, -8.4], [2.2, -3.8], [4.4, 0], [2.2, 3.8], [-2.4, 8.4], [-1.4, 3.4]], vg(-8, 8, '#2E2636'), 1);
    ctx.fillStyle = C('#E8303A'); ell(.4, 0, 1.7, .8); ctx.fill(); halo(.4, 0, 6, '255,40,50', .5 * beat);
    // the blade: obsidian, its back toothed with bone, a hook torn out of its edge
    const yt = (x) => -W * (1 - .36 * clamp((x - x0) / (xm - x0), 0, 1));
    const top = [[x0, -W - 1]], nT = 4 + Math.round(6 * k), za = x0 + 12, st = (xm - 6 - za) / nT;
    for (let i = 0; i < nT; i++) { const xa = za + i * st, h = 3 + 2.4 * H(i + 3) + 2.2 * k; top.push([xa, yt(xa)], [xa + st * .72, yt(xa + st * .72) - h], [xa + st * .8, yt(xa + st * .8)]); }
    top.push([xm, -W * .64], [tip, 0]);
    const blade = top.concat([[xm, W * .6], [x0 + len * .7, W * .76], [x0 + len * .655, W * (1.22 + .3 * k)], [x0 + len * .61, W * .86], [x0 + len * .3, W * .98], [x0 + 6, W * 1.1], [x0, W + 1]]);
    poly(blade);
    if (PL) { const g = ctx.createLinearGradient(0, -W, 0, W); g.addColorStop(0, '#4E4260'); g.addColorStop(.3, '#1E1828'); g.addColorStop(.7, '#0A080E'); g.addColorStop(1, '#2A1E30'); ctx.fillStyle = g; } else ctx.fillStyle = C('#1A1420');
    ctx.fill();
    if (GLOW) {
      ctx.save(); poly(blade); ctx.clip();
      for (let i = 0; i < 7; i++) { const x = x0 + 2 + i * 12.6 + H(i) * 4, w = 7 + H(i + 9) * 6, s = i % 2 ? 1 : -1; ctx.fillStyle = `rgba(${i % 3 ? '150,130,190' : '90,70,120'},${(.08 + .1 * H(i + 2)).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(x, -W * 1.3); ctx.lineTo(x + w, s * W * .2); ctx.lineTo(x + w * .3, W * 1.3); ctx.closePath(); ctx.fill(); }
      const bx1 = x0 + len * (.4 + .42 * k);
      for (let x = x0 + 3; x < bx1; x += 5.2) { ell(x, yt(x) + 2.6, 2.5, 1.35); ctx.fillStyle = '#A89880'; ctx.fill(); ctx.strokeStyle = '#3A2C26'; ctx.lineWidth = .45; ctx.stroke(); }
      ctx.restore();
      add(() => { ctx.strokeStyle = `rgba(230,40,60,${(.35 + .25 * beat).toFixed(3)})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x0 + 4, W * .95); ctx.lineTo(x0 + len * .6, W * .8); ctx.moveTo(x0 + len * .7, W * .7); ctx.lineTo(xm, W * .55); ctx.lineTo(tip - 1, 0); ctx.stroke(); });
    }
    poly(blade); outline(1.8);
    // the molten seam down its core, branching as the curse deepens
    const se = x0 + 6 + len * (.5 + .4 * k), seam = [];
    for (let x = x0 + 4, i = 0; x <= se; x += 4, i++) seam.push([x, (H(i + 31) - .5) * 2.6 * (1 - (x - x0) / len * .5)]);
    const nb = Math.round(1 + 5 * k);
    const seamPath = () => { ctx.beginPath(); seam.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      for (let j = 0; j < nb; j++) { const p = seam[2 + Math.floor(H(j + 50) * (seam.length - 3))]; if (!p) continue; const s = j % 2 ? 1 : -1, l = 4 + 5 * H(j + 51); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + l * .6, p[1] + s * l * .45); ctx.lineTo(p[0] + l, p[1] + s * l * .7); } };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    seamPath(); ctx.strokeStyle = C(PL ? '#3A0A0C' : '#C02030'); ctx.lineWidth = PL ? 2.4 : 1.2; ctx.stroke();
    add(() => { seamPath(); ctx.strokeStyle = `rgba(255,50,30,${(.45 + .3 * beat).toFixed(3)})`; ctx.lineWidth = 3.6; ctx.stroke(); seamPath(); ctx.strokeStyle = `rgba(255,190,120,${(.7 + .3 * beat).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke(); if (!GLOW) return;
      const hx = x0 + 4 + ((T * .35) % 1) * (se - x0 - 4), g = ctx.createRadialGradient(hx, 0, 0, hx, 0, 8); g.addColorStop(0, 'rgba(255,200,140,.8)'); g.addColorStop(1, 'rgba(255,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(hx - 8, -8, 16, 16); });
    // the cracks: the void showing through the blade
    const nc = Math.max(0, Math.floor((k - .5) * 6));
    for (let j = 0; j < nc; j++) { const cx = x0 + 24 + j * 22 + H(j + 70) * 5, hw = 3 + 1.4 * H(j + 71);
      const cr = [[cx - hw, -W * .55], [cx - hw * .2, -W * .95], [cx + hw * .3, -W * .35], [cx + hw, W * .05], [cx + hw * .3, W * .85], [cx - hw * .5, W * .25]];
      shape(cr, '#020103', 0);
      if (PL) { add(() => { if (GLOW) for (let s = 0; s < 4; s++) star(cx + (H(j * 9 + s) - .5) * hw * 1.4, (H(j * 9 + s + 4) - .5) * W, .7 + .8 * Math.max(0, Math.sin(T * 3 + s * 2 + j)), .9, '#C8A0FF'); poly(cr); ctx.strokeStyle = `rgba(255,70,50,${(.55 + .35 * beat).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke(); }); } }
    // the guard: the Black Circle, a ring of spiked iron round a void, bone horns sweeping off it
    const gx = 20, R = 11.5 + 1.5 * k;
    inked('#9C8E78', 2, () => { ctx.moveTo(gx + 1, -R * .8); ctx.quadraticCurveTo(gx + 9, -R - 2, gx + 15, -R - 5 - 3 * k); ctx.moveTo(gx + 1, R * .8); ctx.quadraticCurveTo(gx + 8, R + 1, gx + 12, R + 4 + 3 * k); });
    ctx.save(); ctx.translate(gx, 0); ctx.scale(.62, 1);
    const ns = 8 + Math.round(6 * k);
    for (let i = 0; i < ns; i++) { const a = i / ns * TW + .2, l = R + 3 + 3 * H(i + 20) + 2 * k, c = Math.cos(a), s = Math.sin(a), q = .22;
      shape([[Math.cos(a - q) * (R - 1), Math.sin(a - q) * (R - 1)], [c * l, s * l], [Math.cos(a + q) * (R - 1), Math.sin(a + q) * (R - 1)]], '#1A1420', .7); }
    circle(0, 0, R); ctx.fillStyle = vg(-R, R, '#3A3244'); ctx.fill(); outline(1.4);
    circle(0, 0, R - 3);
    if (PL) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R - 3); g.addColorStop(0, '#000000'); g.addColorStop(.65, '#12061A'); g.addColorStop(1, '#5A0A24'); ctx.fillStyle = g; } else ctx.fillStyle = C('#050308');
    ctx.fill(); outline(.9);
    if (GLOW) add(() => { ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = T * (.8 + .3 * i) * (i % 2 ? -1 : 1) + i * 2; ctx.strokeStyle = i === 1 ? 'rgba(170,90,255,.5)' : `rgba(255,50,70,${(.4 + .3 * beat).toFixed(3)})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0, 0, (R - 3) * (.35 + .22 * i), a, a + 2.2); ctx.stroke(); } });
    ctx.restore();
    swingGlow(pose, 16, len + 14, 22);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }
  function dawnrender(pose) {
    const x0 = 22, len = 88, tip = x0 + len + 6, W = 9, xm = x0 + len * .86, beat = .5 + .5 * Math.sin(T * 2);
    // the halo at the guard: a ring of gold, its rays turning; the light of the blade
    if (PL) { halo(x0 + len * .5, 0, len * .66, '255,214,130', .14 + .08 * beat, .34); halo(20, 0, 26, '255,226,160', .45); }
    sunburst(20, 0, 14, 30, 16, T * .25, '255,222,150', .5);
    add(() => { ctx.strokeStyle = 'rgba(255,226,140,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(20, 0, 15, 0, TW); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .6; ctx.stroke(); });
    drift((i) => [x0 + 6 + H(i + 90) * (len - 8), (i % 2 ? -1 : 1) * W * .6], 9, 34, 'glint', ['rgba(255,240,190,1)', 'rgba(255,255,255,1)'], 2);
    drift((i) => [x0 + 6 + H(i + 60) * len, (H(i + 61) - .5) * W], 6, 26, 'mote', ['rgba(255,226,140,.9)', 'rgba(255,250,230,.9)'], 1.1);
    // the grip: white leather in gold wire; a sunburst pommel
    limb([3, 0, 18, 0], '#F2EADC', 4.6);
    if (PL) { ctx.strokeStyle = '#D8A040'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 5; x < 17; x += 1.8) { ctx.moveTo(x, -2.2); ctx.lineTo(x + 1.2, 2.2); } ctx.stroke(); }
    { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TW, r = i % 2 ? 2.6 : 5.6; pts.push([.5 + Math.cos(a) * r, Math.sin(a) * r]); } shape(pts, vg(-5.6, 5.6, '#F2C860', .45, -.35), .9); circle(.5, 0, 2); ctx.fillStyle = C('#FFFFFF'); ctx.fill(); }
    // the blade: sunlit crystal, a leaf of it, inlaid with gold
    const blade = [[x0, -W], [x0 + len * .45, -W * 1.08], [xm, -W * .72], [tip, 0], [xm, W * .72], [x0 + len * .45, W * 1.08], [x0, W]];
    poly(blade);
    if (PL) { const g = ctx.createLinearGradient(0, -W, 0, W); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.3, '#FFEDB8'); g.addColorStop(.6, '#F2BE58'); g.addColorStop(.85, '#FFE6A8'); g.addColorStop(1, '#D8A048'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF0C8');
    ctx.fill();
    if (GLOW) {
      ctx.save(); poly(blade); ctx.clip();
      for (let i = 0; i < 8; i++) { const x = x0 + i * 12 + H(i + 5) * 4, w = 6 + H(i + 9) * 6, s = i % 2 ? 1 : -1; ctx.fillStyle = i % 3 ? 'rgba(255,255,255,.45)' : 'rgba(190,225,255,.3)'; ctx.beginPath(); ctx.moveTo(x, -W * 1.3); ctx.lineTo(x + w, s * W * .15); ctx.lineTo(x + w * .2, W * 1.3); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = '#A86A18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 3, -W * .74); ctx.lineTo(x0 + len * .45, -W * .8); ctx.lineTo(xm - 2, -W * .5); ctx.lineTo(tip - 7, 0); ctx.lineTo(xm - 2, W * .5); ctx.lineTo(x0 + len * .45, W * .8); ctx.lineTo(x0 + 3, W * .74); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.moveTo(x0 + 2, -W + .4); ctx.lineTo(x0 + len * .45, -W * 1.08 + .4); ctx.lineTo(xm, -W * .72 + .4); ctx.lineTo(xm, -W * .72 + 1.4); ctx.lineTo(x0 + len * .45, -W * 1.08 + 1.6); ctx.lineTo(x0 + 2, -W + 1.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    poly(blade); outline(1.7);
    // the core, burning white, a flare running down it to the point
    const core = [[x0 + 4, -2.4], [xm - 2, -1.3], [tip - 8, 0], [xm - 2, 1.3], [x0 + 4, 2.4]];
    shape(core, PL ? '#FFFDF4' : '#FFFFFF', 0);
    add(() => { poly(core); ctx.strokeStyle = `rgba(255,210,120,${(.5 + .3 * beat).toFixed(3)})`; ctx.lineWidth = 3.2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,240,.6)'; ctx.fill();
      const hx = x0 + 6 + ((T * .4) % 1) * (len - 12), g = ctx.createRadialGradient(hx, 0, 0, hx, 0, 10); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(hx - 10, -10, 20, 20);
      star(tip, 0, 3 + 2.2 * beat, .9, '#FFFFFF'); });
    // the guard: wings of gold feathers, a sun-gem at their root
    for (const s of [-1, 1]) for (let f = 0; f < 3; f++) { const tx = 15 - f * 3.4 + (f === 0 ? 0 : 2), ty = s * (18 - f * 3.4);
      ctx.beginPath(); ctx.moveTo(23, s * 2.4); ctx.quadraticCurveTo(26 - f * 2, s * (11 - f), tx, ty); ctx.quadraticCurveTo(17 - f * 2, s * (8 - f), 18.5, s * 2.4); ctx.closePath();
      ctx.fillStyle = vg(-18, 18, f % 2 ? '#F6D27A' : '#E8B850', .45, -.3); ctx.fill(); outline(.9); }
    rrect(17.4, -4, 5.4, 8, 1.8); ctx.fillStyle = vg(-4, 4, '#F2C860', .5, -.35); ctx.fill(); outline(1);
    circle(20, 0, 2.8);
    if (PL) { const g = ctx.createRadialGradient(19.4, -.6, 0, 20, 0, 2.8); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#FFE6A0'); g.addColorStop(1, '#D89A30'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF0C0');
    ctx.fill(); outline(.7);
    add(() => star(20, 0, 5 + 1.5 * beat, .85, '#FFFFFF'));
    swingGlow(pose, 16, len + 14, 22);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }

  // ======================================================================================================
  // THE MAUL
  // ======================================================================================================
  function chain(ax, ay, n, ph, lock) { // a chain hanging from (ax, ay) toward the ground, swaying; a padlock on its end
    const [ux, uy] = UP(), sw = Math.sin(T * 1.5 + ph) * .3, c = Math.cos(sw), s = Math.sin(sw), dx = -ux * c + uy * s, dy = -ux * s - uy * c, ang = Math.atan2(dy, dx);
    for (let i = 0; i < n; i++) { const d = 2 + i * 3.3; ctx.save(); ctx.translate(ax + dx * d, ay + dy * d); ctx.rotate(ang);
      ell(0, 0, 2.2, i % 2 ? .6 : 1.4); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 2.2; ctx.stroke(); ctx.strokeStyle = C(i % 2 ? '#4A4452' : '#6A6474'); ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
    const ex = ax + dx * (2 + n * 3.3), ey = ay + dy * (2 + n * 3.3);
    if (lock) { ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang - P_ / 2); ctx.beginPath(); ctx.arc(0, -1.6, 1.6, P_, 0); ctx.strokeStyle = C('#5A5464'); ctx.lineWidth = .9; ctx.stroke(); rrect(-2.4, -1.4, 4.8, 4.2, 1); ctx.fillStyle = C('#2A2430'); ctx.fill(); outline(.7); ctx.fillStyle = C(PL ? '#E83040' : '#A01828'); ctx.fillRect(-.4, .2, .8, 1.6); ctx.restore(); }
  }
  function gravemaul(pose) {
    const L = 50, cx = 46, k = K, b = beatOf(.8), heat = .45 + .55 * k;
    if (PL) halo(cx, 0, 40, '150,14,40', .14 + .12 * b * heat);
    drift((i) => [cx + (H(i + 3) - .5) * 20, (H(i + 4) - .5) * 40], 3 + Math.round(5 * k), 24, 'puff', ['rgba(12,6,16,.55)', 'rgba(40,16,40,.45)', 'rgba(80,16,30,.35)'], 3);
    drift((i) => [cx + (H(i + 13) - .5) * 8, -3 + (H(i + 14) - .5) * 10], 2 + Math.round(4 * k), 34, 'ember', ['#FF4A2A', '#FFB070'], 1);
    // the haft: black iron wound with chain; a coffin-nail for a pommel
    shape([[-10, 0], [-3, -3.4], [2, -3.2], [2, 3.2], [-3, 3.4]], vg(-3.4, 3.4, '#3A3442'), 1);
    limb([0, 0, L, 0], '#1E1820', 5);
    for (let i = 0; i < 9; i++) { const x = 6 + i * 3; ell(x, 0, 1.9, i % 2 ? .9 : 3.1); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 1.9; ctx.stroke(); ctx.strokeStyle = C(i % 2 ? '#4A4452' : '#6E6878'); ctx.lineWidth = .9; ctx.stroke(); }
    // the hooked grave-spike out of its back, and the chains (behind the coffin)
    shape([[cx + 10, -7], [cx + 22, -5 - 2 * k], [cx + 28, -12 - 4 * k], [cx + 25, -2], [cx + 10, 5]], vg(-12, 5, '#2E2836'), 1.1);
    chain(cx - 10, -22, 4 + Math.round(2 * k), 0, true); chain(cx - 9, 22, 3 + Math.round(2 * k), 2, false);
    // the coffin: nails out of its faces, iron bands, a lid with the grave-sigil burning on it
    const cof = [[cx - 8, -25], [cx + 8, -25], [cx + 13.5, -12], [cx + 7.5, 25], [cx - 7.5, 25], [cx - 13.5, -12]];
    const nS = 2 + Math.round(3 * k);
    for (let i = 0; i < nS; i++) { const u = nS === 1 ? .5 : i / (nS - 1), x = cx - 6 + 12 * u, h = 5 + 3 * H(i + 1) + 2 * k; shape([[x - 1.7, -24], [x + (H(i) - .5) * 2, -25 - h], [x + 1.7, -24]], '#2E2836', .8);
      const xb = cx - 5.5 + 11 * u, hb = 4 + 3 * H(i + 5) + 2 * k; shape([[xb - 1.6, 24], [xb + (H(i + 2) - .5) * 2, 25 + hb], [xb + 1.6, 24]], '#2E2836', .8); }
    shape(cof, vg(-25, 25, '#302A36', .3, -.45), 1.9);
    const lid = cof.map(([x, y]) => [cx + (x - cx) * .72, y * .82]);
    shape(lid, vg(-20, 20, '#3C3446', .3, -.4), .8);
    if (PL) { ctx.save(); poly(cof); ctx.clip(); ctx.fillStyle = '#4E4658'; ctx.fillRect(cx - 15, -19, 30, 3); ctx.fillRect(cx - 15, 15, 30, 3);
      ctx.fillStyle = '#9A90A8'; for (const y of [-17.5, 16.5]) for (const x of [cx - 9, cx, cx + 9]) { circle(x, y, .8); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 12.5, -12); ctx.lineTo(cx - 7.2, 24); ctx.stroke(); ctx.restore(); }
    // the lid works loose: red light along its seam, and at the last, eyes in the gap
    add(() => { poly(lid); ctx.strokeStyle = `rgba(255,40,40,${(.12 + .55 * k * (.5 + .5 * b)).toFixed(3)})`; ctx.lineWidth = 1 + 1.6 * k; ctx.stroke(); });
    if (k > .7) { ctx.fillStyle = C('#FF3A3A'); ell(cx - 2.6, -21.4, .9, .5); ctx.fill(); ell(cx + 2.6, -21.4, .9, .5); ctx.fill(); halo(cx, -21.4, 6, '255,40,40', .6 * (k - .5)); }
    const sig = () => { ctx.beginPath(); ctx.arc(cx, -6, 4.6, 0, TW); ctx.moveTo(cx, -15); ctx.lineTo(cx, 14); ctx.moveTo(cx - 7.4, -6); ctx.lineTo(cx + 7.4, -6); ctx.moveTo(cx - 3, 14); ctx.lineTo(cx + 3, 14); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    sig(); ctx.strokeStyle = C(PL ? '#14080E' : '#C02030'); ctx.lineWidth = PL ? 2.4 : 1.2; ctx.stroke();
    add(() => { sig(); ctx.strokeStyle = `rgba(255,40,40,${(.3 + .55 * b * heat).toFixed(3)})`; ctx.lineWidth = 3.2; ctx.stroke(); sig(); ctx.strokeStyle = `rgba(255,170,140,${(.55 + .4 * b * heat).toFixed(3)})`; ctx.lineWidth = .9; ctx.stroke(); });
    halo(cx, -6, 12, '255,40,50', .25 + .35 * b * heat);
    swingGlow(pose, cx - 16, 32, 52);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }
  function dawnmaul(pose) {
    const L = 50, cx = 46, beat = .5 + .5 * Math.sin(T * 1.8), sway = Math.sin(T * 2.2);
    if (PL) { halo(cx, 0, 40, '255,224,150', .32 + .14 * beat); }
    sunburst(cx, 2, 13, 34, 18, T * .2, '255,226,160', .32);
    add(() => { ctx.lineWidth = 1.3; for (let i = 0; i < 2; i++) { const p = (T * .55 + i * .5) % 1; ctx.strokeStyle = `rgba(255,232,170,${((1 - p) * .7).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(cx, 25 + p * 7, 17 + p * 14, 2.6 + p * 4, 0, 0, TW); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, -28 - p * 7, 7 + p * 14, 2 + p * 3, 0, 0, TW); ctx.stroke(); } });
    drift((i) => [cx + (H(i + 3) - .5) * 30, (H(i + 4) - .5) * 44], 9, 30, 'glint', ['#FFF4D0', '#FFFFFF'], 2);
    // the haft: white ash banded in gold; a sun for a pommel
    limb([0, 0, L, 0], '#EFE6D2', 5);
    if (PL) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(2, -1.6, L - 4, .8); }
    for (const x of [9, 21, 33]) { rrect(x, -3.2, 2.6, 6.4, .8); ctx.fillStyle = vg(-3.2, 3.2, '#E8B850', .5, -.35); ctx.fill(); outline(.6); }
    { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TW, r = i % 2 ? 2.8 : 5.8; pts.push([-2 + Math.cos(a) * r, Math.sin(a) * r]); } shape(pts, vg(-5.8, 5.8, '#F2C860', .45, -.35), .9); circle(-2, 0, 2); ctx.fillStyle = C('#FFFFFF'); ctx.fill(); }
    // the bell
    const bell = () => { ctx.beginPath(); ctx.moveTo(cx - 8, -22); ctx.quadraticCurveTo(cx, -29.5, cx + 8, -22); ctx.quadraticCurveTo(cx + 11.5, -12, cx + 11.5, 4); ctx.quadraticCurveTo(cx + 12, 16, cx + 17, 23); ctx.quadraticCurveTo(cx, 27.5, cx - 17, 23); ctx.quadraticCurveTo(cx - 12, 16, cx - 11.5, 4); ctx.quadraticCurveTo(cx - 11.5, -12, cx - 8, -22); ctx.closePath(); };
    inked('#E8C060', 2.2, () => { ctx.moveTo(cx - 4, -25.5); ctx.quadraticCurveTo(cx, -33, cx + 4, -25.5); });
    // the clapper, swinging out of its mouth
    ctx.save(); ctx.translate(cx, 18); ctx.rotate(sway * .25); limb([0, 0, 0, 9], '#B8862C', 1.4); circle(0, 10, 2.8); ctx.fillStyle = vg(7, 13, '#F2C860'); ctx.fill(); outline(.8); ctx.restore();
    bell();
    if (PL) { const g = ctx.createLinearGradient(cx - 17, 0, cx + 17, 0); g.addColorStop(0, '#A8761E'); g.addColorStop(.32, '#FFF6D6'); g.addColorStop(.55, '#F0C862'); g.addColorStop(1, '#94641C'); ctx.fillStyle = g; } else ctx.fillStyle = C('#F2D080');
    ctx.fill(); outline(1.9);
    ctx.beginPath(); ctx.ellipse(cx, 23.6, 16.4, 2.4, 0, 0, TW); ctx.fillStyle = C('#6A4814'); ctx.fill(); outline(.9);
    if (PL) { ctx.save(); bell(); ctx.clip(); ctx.lineWidth = 1.2;
      for (const [y, rx] of [[-14, 10.6], [-11, 11], [14, 13], [17, 14.2]]) { ctx.strokeStyle = 'rgba(120,80,20,.55)'; ctx.beginPath(); ctx.ellipse(cx, y + .6, rx, 1.8, 0, 0, P_); ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,220,.85)'; ctx.beginPath(); ctx.ellipse(cx, y, rx, 1.8, 0, 0, P_); ctx.stroke(); }
      ctx.fillStyle = 'rgba(120,80,20,.5)'; for (let i = 0; i < 7; i++) { circle(cx - 8 + i * 2.7, 15.6 + Math.sin(i / 6 * P_) * 1.6, .45); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(cx - 5, -6, 1.6, 12, .05, 0, TW); ctx.fill(); ctx.restore(); }
    // the sun on its waist
    sunburst(cx, 2, 4.5, 9.5, 12, -T * .5, '255,240,190', .9);
    circle(cx, 2, 4.6);
    if (PL) { const g = ctx.createRadialGradient(cx - 1, 1, 0, cx, 2, 4.6); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#FFE8A0'); g.addColorStop(1, '#D89A30'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF0C0');
    ctx.fill(); outline(.9);
    halo(cx, 2, 14, '255,250,220', .4 + .3 * beat);
    swingGlow(pose, cx - 18, 36, 56);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }

  // ======================================================================================================
  // THE STAFF
  // ======================================================================================================
  function blackthorn(pose) {
    const back = -28, len = 62, k = K, b = beatOf(.7), hx = len + 5, vineY = (x) => Math.sin(x * .36 - T * 1.4) * 3.2;
    if (PL) { halo(hx, 0, 22, '170,20,50', .2 + .15 * b); halo(16, 0, 50, '120,10,50', .07 + .06 * k, .25); }
    drift((i) => [hx + (i % 2 ? 3 : -1.5), -2], 2 + Math.round(3 * k), 22, 'puff', ['rgba(12,6,16,.6)', 'rgba(70,14,30,.45)'], 2.2);
    drift((i) => [back + 8 + H(i + 21) * (len - back - 12), 2.4], 2 + Math.round(3 * k), 12, 'mote', ['#E8203A', '#FF6A50'], .9, true);
    // roots out of its foot
    inked('#1E1218', 1.3, () => { for (const s of [-1, 0, 1]) { ctx.moveTo(back + 2, s * 1.2); ctx.quadraticCurveTo(back - 5, s * 4.4, back - 9 - (s ? 0 : 3), s * 6.4 + Math.sin(T + s) * .6); } });
    // the briar haft, gnarled
    const top = [], bot = [];
    for (let x = back; x <= len; x += 3) { const n = Math.sin(x * .7) * .6 + (H(Math.round(x) + 300) - .5) * 1.1; top.push([x, -2.8 - n]); bot.push([x, 2.8 + n * .6]); }
    shape(top.concat(bot.reverse()), vg(-3, 3, '#2E1C22', .3, -.5), 1.3);
    for (const x of [-14, 10, 36]) { ell(x, -.4, 2.2, 1.5); ctx.fillStyle = C('#140A0E'); ctx.fill(); if (PL) { ctx.strokeStyle = '#4A3036'; ctx.lineWidth = .5; ctx.stroke(); } }
    // red sap in its cracks
    const ns = 2 + Math.round(5 * k);
    const sap = () => { ctx.beginPath(); for (let i = 0; i < ns; i++) { const x = back + 6 + H(i + 80) * (len - back - 10), l = 3 + 4 * H(i + 81), y = (H(i + 82) - .5) * 2.4; ctx.moveTo(x, y); ctx.lineTo(x + l * .5, y + (H(i + 83) - .5) * 1.6); ctx.lineTo(x + l, y + (H(i + 84) - .5) * 1.6); } };
    sap(); ctx.strokeStyle = C(PL ? '#3A080C' : '#A01828'); ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
    add(() => { sap(); ctx.strokeStyle = `rgba(255,40,50,${(.45 + .45 * b).toFixed(3)})`; ctx.lineWidth = 1.6; ctx.stroke(); sap(); ctx.strokeStyle = 'rgba(255,170,150,.8)'; ctx.lineWidth = .5; ctx.stroke(); });
    // the vine crawling up it, its thorns crawling with it
    inked('#0E0810', 1.3, () => { for (let x = back + 4; x <= len - 2; x += 1.5) { const y = vineY(x); x === back + 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } });
    const nTh = 5 + Math.round(7 * k), span = len - back - 10;
    for (let i = 0; i < nTh; i++) { const x = back + 6 + ((i * span / nTh + T * 3) % span), y = vineY(x), s = Math.cos(x * .36 - T * 1.4) > 0 ? -1 : 1; thorn(x, y, s * (P_ / 2 + .55), 4 + 1.8 * H(i) + 1.6 * k, 1.2, '#3A2028'); }
    // the head: a crown of thorns round a skull-knot, a long thorn out of its front
    const nc = 5 + Math.round(4 * k);
    for (let i = 0; i < nc; i++) { const a = -2.5 + i / (nc - 1) * 5, l = 7 + 4 * H(i + 60) + 5 * k; if (Math.abs(a) < .5) continue; thorn(hx + Math.cos(a) * 5, Math.sin(a) * 5, a + .25 * Math.sign(a), l, 1.5, '#24141A'); }
    shape([[hx + 3, -2.6], [hx + 14, -1.6], [hx + 24 + 2 * k, 0], [hx + 14, 1.6], [hx + 3, 2.6]], vg(-2.6, 2.6, '#2A1820'), 1.1);
    add(() => { ctx.strokeStyle = `rgba(255,50,60,${(.4 + .3 * b).toFixed(3)})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(hx + 6, -1.5); ctx.lineTo(hx + 23, -.2); ctx.stroke(); });
    ell(hx, 0, 8.6, 7.6, .1); ctx.fillStyle = vg(-7.6, 7.6, '#3A262C', .3, -.45); ctx.fill(); outline(1.3);
    if (PL) { ctx.strokeStyle = 'rgba(10,4,8,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(hx - 1, 0, 5.6, 1.8, 3.6); ctx.moveTo(hx + 4, -6); ctx.quadraticCurveTo(hx + 6, -2, hx + 7.4, -3); ctx.stroke(); }
    for (const ex of [-2.6, 2.4]) { ell(hx + ex, -1.8, 1.9, 1.6); ctx.fillStyle = C('#050204'); ctx.fill(); }
    ctx.fillStyle = C('#050204'); ctx.beginPath(); ctx.moveTo(hx - .2, .6); ctx.lineTo(hx + .9, 2.4); ctx.lineTo(hx - 1.2, 2.4); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const x = hx - 3.6 + i * 1.8; ctx.beginPath(); ctx.moveTo(x - .7, 3.6); ctx.lineTo(x, 5.6 + (i % 2) * .8); ctx.lineTo(x + .7, 3.6); ctx.closePath(); ctx.fillStyle = C('#B8A890'); ctx.fill(); }
    ctx.fillStyle = C(PL ? '#FF3030' : '#C02030'); circle(hx - 2.6, -1.7, .75); ctx.fill(); circle(hx + 2.4, -1.7, .75); ctx.fill();
    halo(hx - 2.6, -1.7, 4, '255,40,40', .5 + .4 * b); halo(hx + 2.4, -1.7, 4, '255,40,40', .5 + .4 * b);
    swingGlow(pose, back - 4, len - back + 28, 16);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }
  function flower(x, y, r, rot, petal, heart) {
    for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TW; ell(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62, r * .62, r * .4, a); ctx.fillStyle = C(i % 2 ? petal : shade(petal, -.06)); ctx.fill(); outline(.4); }
    circle(x, y, r * .32); ctx.fillStyle = C(heart); ctx.fill();
  }
  function whitethorn(pose) {
    const back = -28, len = 62, hx = len + 5, beat = .5 + .5 * Math.sin(T * 1.6), vineY = (x) => Math.sin(x * .36 + T * .4) * 3;
    if (PL) { halo(hx, 0, 26, '255,230,160', .28 + .1 * beat); halo(16, 0, 50, '255,236,180', .1, .25); }
    sunburst(hx, 0, 9, 24, 14, T * .3, '255,232,170', .3);
    drift((i) => [hx + (H(i + 3) - .5) * 8, (H(i + 4) - .5) * 8], 6, 30, 'petal', ['rgba(255,252,240,.95)', 'rgba(255,230,160,.95)', 'rgba(255,236,236,.95)'], 1.6);
    drift((i) => [back + 6 + H(i + 21) * (len - back - 8), (H(i) - .5) * 4], 6, 26, 'glint', ['#FFF4D0', '#FFFFFF'], 1.6);
    // a gold cap with a bud on its foot
    shape([[back + 3, -3], [back - 4, -2.6], [back - 8, 0], [back - 4, 2.6], [back + 3, 3]], vg(-3, 3, '#E8B850', .5, -.35), .9);
    flower(back - 9, 0, 2.2, T * .2, '#FFF8EC', '#F2C040');
    // the white ash haft
    limb([back, 0, len, 0], '#F2EADA', 3.9);
    if (PL) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(back + 2, -1.6, len - back - 4, .8); ctx.fillStyle = 'rgba(160,130,90,.25)'; ctx.fillRect(back + 2, .8, len - back - 4, 1); }
    // the gold vine, its leaves, its flowers
    inked('#D8A840', .9, () => { for (let x = back + 4; x <= len - 2; x += 1.5) { const y = vineY(x); x === back + 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } });
    for (let i = 0; i < 7; i++) { const x = back + 10 + i * 11, y = vineY(x), s = i % 2 ? 1 : -1; ell(x + 1.2, y + s * 1.6, 2, .9, s * .6); ctx.fillStyle = C('#D8E0A0'); ctx.fill(); outline(.35); }
    for (const [i, x] of [[0, -16], [1, 2], [2, 26], [3, 46]]) { const y = vineY(x); flower(x, y, 2.6 + (i % 2) * .6, T * .25 + i, '#FFF8EC', '#F2C040'); add(() => { ctx.fillStyle = `rgba(255,230,150,${(.35 + .25 * Math.sin(T * 2 + i)).toFixed(3)})`; circle(x, y, 3.8); ctx.fill(); }); }
    // the spear of light out of the bloom
    shape([[hx + 3, -2.8], [hx + 12, -2.6], [hx + 23, 0], [hx + 12, 2.6], [hx + 3, 2.8]], vg(-2.8, 2.8, '#FFF4D4', .5, -.25), 1);
    add(() => { ctx.strokeStyle = 'rgba(255,240,190,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hx + 5, 0); ctx.lineTo(hx + 22, 0); ctx.stroke(); star(hx + 23, 0, 3 + 2 * beat, .9, '#FFFFFF'); });
    // the bloom
    for (let i = 0; i < 9; i++) { const a = i / 9 * TW + T * .12; ell(hx + Math.cos(a) * 5, Math.sin(a) * 5, 5.2, 2.6, a); ctx.fillStyle = C(i % 2 ? '#FFFFFF' : '#FFF4E4'); ctx.fill(); outline(.6); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TW - T * .2 + .3; ell(hx + Math.cos(a) * 2.8, Math.sin(a) * 2.8, 3, 1.7, a); ctx.fillStyle = C(i % 2 ? '#FFE6A0' : '#FFD880'); ctx.fill(); outline(.4); }
    circle(hx, 0, 2.4);
    if (PL) { const g = ctx.createRadialGradient(hx, 0, 0, hx, 0, 2.4); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F2B030'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF0C0');
    ctx.fill();
    halo(hx, 0, 8, '255,250,220', .35 + .2 * beat);
    swingGlow(pose, back - 4, len - back + 28, 16);
    if (!pose.noHand) gripHand(pose.glove || '#FFF1E0');
  }

  // ======================================================================================================
  // THE RAPIER
  // ======================================================================================================
  function rose(x, y, r, outer, inner, core, rim) {
    for (let i = 0; i < 7; i++) { const a = i / 7 * TW + .4; ell(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .62, r * .42, a); ctx.fillStyle = C(i % 2 ? outer : shade(outer, .14)); ctx.fill(); outline(.55); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TW + 1.1; ell(x + Math.cos(a) * r * .26, y + Math.sin(a) * r * .26, r * .4, r * .28, a); ctx.fillStyle = C(i % 2 ? inner : shade(inner, .12)); ctx.fill(); outline(.4); }
    circle(x, y, r * .24); ctx.fillStyle = C(core); ctx.fill(); outline(.4);
    if (PL && rim) { ctx.strokeStyle = rim; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(x, y, r * .5, .3, 2.4); ctx.moveTo(x + r * .14, y); ctx.arc(x, y, r * .14, 0, 4); ctx.stroke(); }
  }
  function thornLorraine(pose) {
    const x0 = 20, len = 56, tip = x0 + len + 5, w = 2.6, xm = x0 + len * .84, k = K, b = beatOf(.75), rr = 7.2 * (1 + .2 * k);
    if (PL) { halo(19, 0, 20, '160,10,40', .3 + .2 * b); halo(x0 + len * .5, 0, len * .55, '120,10,40', .08 + .08 * k, .25); }
    drift((i) => [19 + (H(i + 2) - .5) * rr, (H(i + 3) - .5) * rr], 2 + Math.round(3 * k), 30, 'petal', ['rgba(60,6,22,.95)', 'rgba(110,12,36,.95)', 'rgba(24,4,12,.95)'], 1.9, true);
    drift((i) => [i % 2 ? 19 + (H(i) - .5) * 4 : tip - 2, i % 2 ? 3 : 0], 2 + Math.round(2 * k), 18, 'mote', ['#E01830', '#B01028'], .8 + .4 * k, true);
    drift((i) => [x0 + 6 + H(i + 9) * len * .8, 0], 2 + Math.round(3 * k), 14, 'puff', ['rgba(14,6,16,.5)', 'rgba(60,10,30,.4)'], 1.6);
    // the grip, bound in red; a black rosebud for a pommel
    limb([5, 0, 17, 0], '#140C12', 3.8);
    if (PL) { ctx.strokeStyle = '#8A1428'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 6.6; x < 16; x += 1.5) { ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); } ctx.stroke(); }
    for (const s of [-1, 1]) shape([[5.2, s * .6], [3.4, s * 3.6], [6.6, s * 1.8]], '#1A2418', .5);
    ell(2.8, 0, 3, 2.4); ctx.fillStyle = vg(-2.4, 2.4, '#3A0A18'); ctx.fill(); outline(.9);
    if (PL) { ctx.strokeStyle = '#8A1028'; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(2.4, 0, 1.4, -1, 2.4); ctx.stroke(); }
    // the blade: black steel, its edge red, barbed with thorns that grow back toward the hand
    const blade = [[x0, -w * 1.1], [xm, -w * .7], [tip, 0], [xm, w * .7], [x0, w * 1.1]];
    const n = 2 + Math.round(5 * k);
    for (let i = 0; i < n; i++) { const x = x0 + 9 + i * (len * .7 / n), s = i % 2 ? 1 : -1; shape([[x, s * w * .6], [x - 4 - 1.6 * k, s * (w + 3.4 + 2 * k)], [x + 2, s * w * .55]], vg(-6, 6, '#3A2430'), .5); }
    poly(blade);
    if (PL) { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#5A5064'); g.addColorStop(.45, '#16101A'); g.addColorStop(1, '#30243A'); ctx.fillStyle = g; } else ctx.fillStyle = C('#1E1822');
    ctx.fill(); outline(1.4);
    ctx.fillStyle = C('#B01C34'); ctx.beginPath(); ctx.moveTo(x0 + 2, -w * .95); ctx.lineTo(xm, -w * .62); ctx.lineTo(tip - 2, -.2); ctx.lineTo(xm, -w * .4); ctx.lineTo(x0 + 2, -w * .6); ctx.closePath(); ctx.fill();
    const ce = x0 + 4 + (len - 10) * (.35 + .6 * k);
    add(() => { const g = ctx.createLinearGradient(x0, 0, ce, 0), p = (T * .5) % 1; g.addColorStop(0, 'rgba(255,40,60,.5)'); g.addColorStop(Math.max(0, p - .08), 'rgba(255,40,60,.5)'); g.addColorStop(p, 'rgba(255,170,160,.95)'); g.addColorStop(Math.min(1, p + .08), 'rgba(255,40,60,.5)'); g.addColorStop(1, 'rgba(255,40,60,.1)');
      ctx.fillStyle = g; ctx.fillRect(x0 + 4, -.55, ce - x0 - 4, 1.1); });
    if (!PL) { ctx.fillStyle = C('#B01C34'); ctx.fillRect(x0 + 4, -.5, ce - x0 - 4, 1); }
    // a drop of blood gathering at the point
    if (k > .3 && !ICONQ) { const p = (T * .5) % 1, [ux, uy] = UP(), d = p < .7 ? 0 : (p - .7) * 30, r = (.6 + .9 * k) * Math.min(1, p / .6); ctx.fillStyle = C('#B01028'); circle(tip - 1 - ux * (1.4 + d), -uy * (1.4 + d), r); ctx.fill(); }
    // the guard: a knuckle bow and quillons of black briar
    const bow = () => { ctx.moveTo(18, -5); ctx.bezierCurveTo(13, -13, 5, -9.5, 3, -3.4); };
    inked('#1A1016', 1.5, bow);
    for (const q of [.25, .5, .75]) { const x = 18 - 15 * q, y = -5 - 7 * Math.sin(q * P_); thorn(x, y, -P_ / 2 - .5 + q, 2.8, .8, '#2A161C'); }
    inked('#1A1016', 1.5, () => { ctx.moveTo(19, -2); ctx.quadraticCurveTo(23, -10, 29, -12); ctx.quadraticCurveTo(31, -12.4, 30.4, -10.4); ctx.moveTo(19, 2); ctx.quadraticCurveTo(15, 10, 9.5, 12); ctx.quadraticCurveTo(7.6, 12.4, 8.2, 10.4); });
    thorn(25, -8.6, -.6, 2.6, .7, '#2A161C'); thorn(13, 8.6, 2.5, 2.6, .7, '#2A161C');
    // the black rose for a cup
    ctx.save(); ctx.translate(19, 0); ctx.scale(.75, 1); rose(0, 0, rr, '#1E0812', '#4A0A1C', '#8A1028', '#C0203A'); ctx.restore();
    halo(19, 0, 7, '255,40,60', .3 + .3 * b);
    swingGlow(pose, 16, len + 12, 16);
    if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
  }
  function roseLorraine(pose) {
    const x0 = 20, len = 56, tip = x0 + len + 5, w = 2.6, xm = x0 + len * .84, beat = .5 + .5 * Math.sin(T * 1.8);
    if (PL) { halo(19, 0, 22, '255,226,190', .32 + .12 * beat); halo(x0 + len * .5, 0, len * .55, '255,236,190', .14, .26); }
    sunburst(19, 0, 8, 19, 12, T * .3, '255,230,190', .3);
    drift((i) => [19 + (H(i + 2) - .5) * 10, (H(i + 3) - .5) * 10], 6, 30, 'petal', ['rgba(255,250,246,.95)', 'rgba(255,214,222,.95)', 'rgba(255,232,170,.95)'], 1.8);
    drift((i) => [x0 + 4 + H(i + 9) * len, 0], 6, 22, 'glint', ['#FFF4D8', '#FFFFFF'], 1.6);
    // the grip, white bound in gold; a gold rosebud for a pommel
    limb([5, 0, 17, 0], '#F2EADC', 3.8);
    if (PL) { ctx.strokeStyle = '#D8A040'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 6.6; x < 16; x += 1.5) { ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); } ctx.stroke(); }
    for (const s of [-1, 1]) shape([[5.2, s * .6], [3.4, s * 3.6], [6.6, s * 1.8]], '#C8D890', .5);
    ell(2.8, 0, 3, 2.4); ctx.fillStyle = vg(-2.4, 2.4, '#F2C860', .5, -.35); ctx.fill(); outline(.9);
    // the blade: white, edged gold, a gold vine engraved round it, its core alight
    const blade = [[x0, -w * 1.1], [xm, -w * .7], [tip, 0], [xm, w * .7], [x0, w * 1.1]];
    poly(blade);
    if (PL) { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, '#F6EEDC'); g.addColorStop(1, '#D8BC80'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF4DC');
    ctx.fill(); outline(1.4);
    ctx.fillStyle = C('#E0A840'); ctx.beginPath(); ctx.moveTo(x0 + 2, -w * .95); ctx.lineTo(xm, -w * .62); ctx.lineTo(tip - 2, -.2); ctx.lineTo(xm, -w * .42); ctx.lineTo(x0 + 2, -w * .62); ctx.closePath(); ctx.fill();
    if (PL) { ctx.strokeStyle = '#C8902A'; ctx.lineWidth = .5; ctx.beginPath(); for (let x = x0 + 3; x <= xm; x += .8) { const y = Math.sin(x * .55 - T * .6) * w * .6; x === x0 + 3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    add(() => { const p = (T * .45) % 1, g = ctx.createLinearGradient(x0, 0, tip, 0); g.addColorStop(0, 'rgba(255,240,200,.5)'); g.addColorStop(Math.max(0, p - .08), 'rgba(255,240,200,.5)'); g.addColorStop(p, 'rgba(255,255,255,1)'); g.addColorStop(Math.min(1, p + .08), 'rgba(255,240,200,.5)'); g.addColorStop(1, 'rgba(255,240,200,.3)');
      ctx.fillStyle = g; ctx.fillRect(x0 + 3, -.6, len - 2, 1.2); star(tip, 0, 2.8 + 2 * beat, .9, '#FFFFFF'); });
    // the guard: gold bow and quillons ending in leaves
    inked('#E8C060', 1.4, () => { ctx.moveTo(18, -5); ctx.bezierCurveTo(13, -13, 5, -9.5, 3, -3.4); });
    inked('#E8C060', 1.5, () => { ctx.moveTo(19, -2); ctx.quadraticCurveTo(23, -10, 29, -12); ctx.moveTo(19, 2); ctx.quadraticCurveTo(15, 10, 9.5, 12); });
    for (const [x, y, a] of [[29.6, -12.2, -.3], [9, 12.2, 2.8], [11, -9, -2.2]]) { ell(x, y, 2.4, 1.1, a); ctx.fillStyle = C('#D8E0A0'); ctx.fill(); outline(.45); }
    // the white rose
    ctx.save(); ctx.translate(19, 0); ctx.scale(.75, 1); rose(0, 0, 7.4, '#FFFFFF', '#FFE8EC', '#F2C040', '#E8B850'); ctx.restore();
    halo(19, 0, 7, '255,240,200', .3 + .2 * beat);
    swingGlow(pose, 16, len + 12, 16);
    if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
  }

  // ======================================================================================================
  // THE FISTS
  // ======================================================================================================
  function knuckles(pose, pure) {
    const k = K, b = beatOf(.8), beat = .5 + .5 * Math.sin(T * 2);
    drawHand(pure ? '#E2BC66' : '#221A26', pose && pose.openHand);
    ctx.save(); if (HAND_S !== 1) { ctx.translate(14, 0); ctx.scale(HAND_S, HAND_S); ctx.translate(-14, 0); }
    if (pure) {
      if (PL) halo(21, 0, 16, '255,226,150', .4 + .2 * beat);
      sunburst(22.4, 0, 3, 10, 12, T * .6, '255,236,170', .7);
      drift((i) => [20 + (H(i) - .5) * 6, (H(i + 1) - .5) * 8], 5, 18, 'glint', ['#FFF4D0', '#FFFFFF'], 1.3);
      shape([[9.6, -5.8], [13.6, -4.8], [13.6, 4.8], [9.6, 5.8], [8.6, 0]], vg(-6, 6, '#E8B850', .5, -.35), .8);
      if (PL) { ctx.fillStyle = '#FFF8EC'; ctx.fillRect(10.4, -1, 2.6, 2); }
      rrect(13.4, -4.2, 5.2, 8.4, 1.4); ctx.fillStyle = vg(-4.2, 4.2, '#FFF6E6', .4, -.15); ctx.fill(); outline(.7);
      ctx.strokeStyle = C('#D8A040'); ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(16, 0, 1.8, 0, TW); ctx.stroke();
      rrect(18.6, -4.9, 3.6, 9.8, 1.2); ctx.fillStyle = vg(-4.9, 4.9, '#F2C860', .5, -.35); ctx.fill(); outline(.6);
      circle(22.4, 0, 2.8);
      if (PL) { const g = ctx.createRadialGradient(22, -.6, 0, 22.4, 0, 2.8); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#FFE8A0'); g.addColorStop(1, '#D89A30'); ctx.fillStyle = g; } else ctx.fillStyle = C('#FFF0C0');
      ctx.fill(); outline(.6);
      add(() => star(22.4, 0, 4 + 1.5 * beat, .9, '#FFFFFF'));
    } else {
      if (PL) halo(18, 0, 14, '170,20,60', .22 + .15 * b);
      drift((i) => [24 + 4 * k, -3.4 + (i % 3) * 3.4], 2 + Math.round(3 * k), 16, 'puff', ['rgba(12,6,16,.6)', 'rgba(60,16,40,.45)'], 1.5);
      shape([[9.6, -5.8], [13.6, -4.8], [13.6, 4.8], [9.6, 5.8], [8.2, 3.2], [5.6, 4.8 + k], [7.4, 0], [5.6, -4.8 - k], [8.2, -3.2]], vg(-6, 6, '#2E2636'), .8);
      rrect(13.4, -4.2, 5.2, 8.4, 1.4); ctx.fillStyle = vg(-4.2, 4.2, '#3A3244'); ctx.fill(); outline(.7);
      circle(16, 0, 2.4); ctx.fillStyle = C('#050206'); ctx.fill(); ctx.strokeStyle = C('#6A5A78'); ctx.lineWidth = .6; ctx.stroke();
      add(() => { ctx.strokeStyle = `rgba(255,50,70,${(.45 + .45 * b).toFixed(3)})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(16, 0, 1.5, T * 2, T * 2 + 4); ctx.stroke(); });
      halo(16, 0, 4, '255,40,60', .3 + .3 * b);
      const cl = 5 + 6 * k;
      for (let i = 0; i < 3; i++) { const y = -3.4 + i * 3.4, x = 21.6;
        ctx.beginPath(); ctx.moveTo(x, y - 1.2); ctx.quadraticCurveTo(x + cl * .6, y - 1.8, x + cl, y + 1.4); ctx.quadraticCurveTo(x + cl * .5, y + .2, x, y + 1.2); ctx.closePath(); ctx.fillStyle = vg(y - 1.8, y + 1.4, '#2A2232'); ctx.fill(); outline(.5);
        add(() => { ctx.strokeStyle = `rgba(255,60,70,${(.35 + .3 * b).toFixed(3)})`; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x + 1, y - 1.1); ctx.quadraticCurveTo(x + cl * .6, y - 1.6, x + cl - .4, y + 1); ctx.stroke(); }); }
      rrect(18.6, -4.9, 3.6, 9.8, 1.2); ctx.fillStyle = vg(-4.9, 4.9, '#443A50'); ctx.fill(); outline(.6);
      for (const y of [-3.4, 0, 3.4]) { ctx.fillStyle = C('#1A1420'); ctx.beginPath(); ctx.moveTo(20, y - 1); ctx.lineTo(23 + k, y); ctx.lineTo(20, y + 1); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }

  // ======================================================================================================
  // THE DISPATCH, THE TRAILS
  // ======================================================================================================
  const FORMS = { sword: [nightrender, dawnrender], hammer: [gravemaul, dawnmaul], staff: [blackthorn, whitethorn], rapier: [thornLorraine, roseLorraine] };
  const FIT = { hammer: [30, .8, 40], staff: [15, .86, 22], sword: [40, .82, 40], rapier: [0, 1, 0] }; // (a card: kept inside its frame)
  // A: { id, lvl, pure, drop? }; icon: drawn on a card. Returns false if it could not draw (the caller falls back).
  function draw(id, A, pose, icon) {
    setup(A, icon);
    ctx.save();
    try {
      if (id === 'fists') knuckles(pose, !!A.pure);
      else { const f = FORMS[id]; if (!f) return false; const fit = icon && FIT[id]; if (fit) { ctx.translate(fit[0], 0); ctx.scale(fit[1], fit[1]); ctx.translate(-fit[2], 0); } f[A.pure ? 1 : 0](pose); }
      if (pose.streak && !icon) streak(pose, A);
    } finally { ctx.restore(); }
    return true;
  }
  // a thrust's streak, in the weapon's frame (its point along +x)
  function streak(pose, A) {
    if (!DET) return; const s = pose.streak, x1 = 15 + s.len;
    onPage(() => { ctx.save(); ctx.globalAlpha = s.a; ctx.lineCap = 'round';
      if (!A.pure) { ctx.strokeStyle = 'rgba(10,4,14,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); for (const dy of [-5, 0, 5]) { ctx.moveTo(22, dy); ctx.lineTo(x1 + 6, dy * .4); } ctx.stroke(); }
      ctx.globalCompositeOperation = 'lighter'; const q = Math.floor(T * 30);
      for (let i = 0; i < 9; i++) { const u = H(i * 5.1 + q * .31), x = 22 + (x1 - 22) * u, y = (H(i + q * .7) - .5) * 9 * (1 - u * .6);
        if (A.pure) { ctx.fillStyle = i % 2 ? '#FFF4D0' : '#FFFFFF'; gbStar(x, y, 1.4 + H(i + 2), s.a); } else { ctx.fillStyle = i % 3 ? '#FF5A2A' : '#FFB070'; circle(x, y, .6 + .7 * H(i + 3)); ctx.fill(); } }
      ctx.restore(); });
  }
  // the swing trails: base() draws the game's own brushed trail (in the weapon's trail colour)
  function sparks(pt, n, A, w) { // embers (cursed), or petals and glints of light (pure), scattered along a trail: pt(u, off) -> [x, y]
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const q = Math.floor(T * 24);
    for (let i = 0; i < n; i++) { const u = .15 + .85 * H(i * 7.3 + q * .37), [x, y] = pt(u, (H(i + q * 1.3) - .5) * w * 1.8);
      if (A.pure) { if (i % 3 === 0) { ctx.fillStyle = 'rgba(255,214,222,.85)'; ell(x, y, 2.2, 1.1, H(i + q) * 6); ctx.fill(); } else { ctx.fillStyle = i % 2 ? '#FFF4D0' : '#FFFFFF'; gbStar(x, y, 1.4 + 1.6 * H(i + 2) * u, .9); } }
      else { ctx.fillStyle = i % 3 ? 'rgba(255,90,40,.95)' : 'rgba(255,200,120,.95)'; circle(x, y, .6 + 1 * H(i + 3) * u); ctx.fill(); } }
    ctx.restore();
  }
  function trail(cx, cy, pose, A, base) {
    const a0 = pose.trailFrom, a1 = pose.arm, r = pose.trail, lo = Math.min(a0, a1), hi = Math.max(a0, a1), lead = a1 > a0, w = (pose.trailW || 6) * 1.6;
    T = performance.now() / 1000; PL = !FLASH && !TINT; DET = PL && !lite();
    if (hi - lo < .05 || !PL) return base();
    const at = (u) => lead ? lo + (hi - lo) * u : hi - (hi - lo) * u, R = Math.max(1, r - 4);
    onPage(() => { ctx.save(); ctx.lineCap = 'round'; const N = DET ? 6 : 3;
      for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, R - w * .15), Math.min(at(u0), at(u1)), Math.max(at(u0), at(u1)));
        if (A.pure) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,190,${(.04 + .14 * u1).toFixed(3)})`; ctx.lineWidth = w * (1.2 + .8 * u1); }
        else { ctx.strokeStyle = `rgba(10,4,14,${(.1 + .45 * u1).toFixed(3)})`; ctx.lineWidth = w * (.5 + .8 * u1); }
        ctx.stroke(); }
      ctx.restore(); });
    base();
    onPage(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      ctx.strokeStyle = A.pure ? 'rgba(255,255,240,.8)' : 'rgba(255,70,50,.55)'; ctx.lineWidth = A.pure ? 1.4 : 1; ctx.beginPath(); ctx.arc(cx, cy, R, Math.min(at(.55), at(1)), Math.max(at(.55), at(1))); ctx.stroke(); ctx.restore();
      if (DET) sparks((u, o) => { const a = at(u), rr = R + o; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }, A.pure ? 12 : 10, A, w); });
  }
  function flat(cx, cy, f, A, base) {
    T = performance.now() / 1000; PL = !FLASH && !TINT; DET = PL && !lite();
    if (!PL) return base();
    const s = f.rev ? P_ * (1 - f.k) : 0, e = f.rev ? P_ : P_ * f.k, w = f.w * 1.4;
    const pt = (u, o) => { const a = f.rev ? P_ - (P_ - s) * u : e * u, r = f.r + o; return [cx + Math.cos(a) * r, cy + 6 + Math.sin(a) * r * .3]; };
    if (!A.pure) onPage(() => { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,4,14,.4)'; ctx.lineWidth = w * 1.1; ctx.beginPath(); ctx.ellipse(cx, cy + 6, Math.max(1, f.r), Math.max(1, f.r * .3), 0, s, e); ctx.stroke(); ctx.restore(); });
    base();
    if (DET && e - s > .05) onPage(() => sparks(pt, A.pure ? 10 : 8, A, w));
  }
  // the card portrait of the fists: a gauntlet, knuckles forward (draw.js drawIcon's frame)
  function fistIcon(canvas, A, scale) {
    const W = canvas.width, H = canvas.height, tmp = document.createElement('canvas'); tmp.width = W * 2; tmp.height = H * 2; // (drawn large, then fitted: nothing cut off at the card's edge)
    const g = tmp.getContext('2d'), old = ctx; ctx = g;
    try { const s = W / 64 * (scale || 1); g.setTransform(s, 0, 0, s, W / 2, H / 2);
      g.translate(32, 33); g.rotate(-.25); g.scale(2.3, 2.3); g.translate(-17, 0);
      draw('fists', A, {}, true);
      ctx = old; if (typeof fitArt === 'function') fitArt(tmp, canvas); if (typeof paintCard === 'function') paintCard(canvas, s * .7);
    } finally { g.setTransform(1, 0, 0, 1, 0, 0); ctx = old; }
  }
  return { draw, trail, flat, fistIcon };
})();
