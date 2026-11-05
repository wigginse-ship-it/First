'use strict';
// ---------- Level-8 art: Grayswandir revealed (the rapier alone has an eighth level) ----------
// Drawn in hand space like every weapon (the hand at (16,0), the point along +x). Level 8 and up draws this form for the
// rapier (and its 'grayblade' look); level 7 falls through to art_tier7.js, 6 to art_tier6.js, lower to art_rapier.js.
//   Grayswandir, the night blade: Corwin's own sword, the counterpart of Brand's sun-blade Werewindle. A long slim blade
//   of smoke-grey steel that drinks the light (a faint dusk about it, and motes of light drawn in and swallowed), honed
//   silver at both edges; down its fuller the Pattern inlaid in silver as one unbroken looping path, with a single
//   bright spark rising out of a crescent moon on the ricasso and walking it to the point, where it flares and is gone.
//   A black-and-silver swept hilt with crescent-moon finials and an eight-rayed star on its shell, a black grip bound
//   in silver wire, and a full moon for a pommel. Swung, it leaves a wake of grey shadow-smoke; at rest a thread of
//   shadow rises off the steel.
// All motion is slow and gentle (performance.now()); glows and smoke are skipped while FLASH or TINT is set, and the
// costlier passes (dusk, motes, smoke) while LITE is. Reuses art_tier6.js's helpers (t6Plain, t6Add, t6Halo, t6Inked).
const T8_X0 = 20, T8_LEN = 56, T8_TIP = T8_X0 + T8_LEN + 5, T8_W = 2.55;
let T8_PATH = null; // the inlaid Pattern: one looping path down the fuller, built once (blade space, [x, y] points)
function t8Path() {
  if (T8_PATH) return T8_PATH;
  const p0 = T8_X0 + 11, p1 = T8_X0 + T8_LEN * .86, N = 10, pts = [];
  for (let i = 0; i <= 900; i++) {
    const s = i / 900, th = s * N * TAU, k = 1 - s * .42;
    // a prolate trochoid: the path runs on and doubles back on itself in loops, great and small by turns, like the
    // Pattern's curves and veils
    const q = (1.05 + .45 * Math.sin(th / 2.2)) * k;
    pts.push([p0 + s * (p1 - p0) - q * Math.sin(th), -.8 * k * Math.cos(th)]);
  }
  return (T8_PATH = pts);
}
function t8Crescent(x, y, r, rot, col) { // a crescent moon, horns turned by rot
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, -P_ * .5, P_ * .5, true); ctx.arc(r * .55, 0, r * .82, P_ * .58, -P_ * .58, false); ctx.closePath();
  ctx.fillStyle = C(col); ctx.fill(); outline(.45);
  ctx.restore();
}
function t8Rays(x, y, r, a, col) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; gbStar(0, 0, r, a); ctx.rotate(P_ / 4); gbStar(0, 0, r * .62, a); ctx.restore(); }
function t8Up() { // the world's 'up' seen from the weapon's own frame (so smoke rises, however the blade is turned)
  const m = ctx.getTransform(), d = m.a * m.d - m.b * m.c || 1, x = m.c / d, y = -m.a / d, L = Math.hypot(x, y) || 1;
  return [x / L, y / L];
}
function t8Smoke(fn) { if (typeof onPage === 'function') onPage(fn); else fn(); } // off the prince's own layer, so the ink line leaves it soft

function t8Grayswandir(pose) {
  const now = performance.now() / 1000, plain = t6Plain(), det = plain && !LITE, icon = !!pose.noHand;
  const x0 = T8_X0, len = T8_LEN, tip = T8_TIP, w = T8_W, pulse = .5 + .5 * Math.sin(now * .7);
  const swingA = pose.trail && pose.trailFrom !== undefined ? (pose.arm ?? 1.1) - pose.trailFrom : 0;
  const arc = Math.abs(swingA) > .05, thrust = !arc && (!!pose.streak || (pose.ext || 0) > .35);

  // the wake: grey shadow-smoke where the blade has just been (a swing fans it out behind; a thrust streams it back)
  if (det && !icon && (arc || thrust)) t8Smoke(() => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (arc) {
      const s = Math.sign(swingA), span = Math.min(1, Math.abs(swingA)), px = 15 - (19 + (pose.ext || 0) * 12);
      const at = (phi, x, y) => { const c = Math.cos(phi), sn = Math.sin(phi); return [px + (x - px) * c - y * sn, (x - px) * sn + y * c]; }, r0 = x0 + 4;
      // the body of the wake: one fan of thin grey smoke, darkest just behind the blade and thinning away, its edge ragged
      const F = span * .95, M = 16, cg = ctx.createConicGradient(s > 0 ? -F : 0, px, 0), fr = F / TAU, dark = 'rgba(34,36,48,.55)', clear = 'rgba(34,36,48,0)', mid = 'rgba(34,36,48,.2)';
      if (s > 0) { cg.addColorStop(0, clear); cg.addColorStop(fr * .5, mid); cg.addColorStop(fr, dark); cg.addColorStop(Math.min(1, fr + .002), clear); }
      else { cg.addColorStop(0, dark); cg.addColorStop(fr * .5, mid); cg.addColorStop(fr, clear); }
      ctx.beginPath(); let q = at(0, r0, 0); ctx.moveTo(q[0], q[1]);
      for (let i = 0; i <= M; i++) { const u = i / M, R = tip + 1 + u * 5 + Math.sin(u * 9 + now * 3) * 2.5 * u; q = at(-s * F * u, R, 0); ctx.lineTo(q[0], q[1]); }
      q = at(-s * F, r0, 0); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fillStyle = cg; ctx.fill();
      // and threads curling off it, paler, the longest from the point
      for (let j = 0; j < 4; j++) {
        const rr = x0 + 18 + j * 13 + 6, k0 = .1 + j * .05; ctx.beginPath();
        for (let i = 0; i <= 10; i++) { const u = i / 10, phi = -s * span * (k0 + u * (.5 + j * .1)), q = at(phi, rr + Math.sin(u * 6 + now * 3 + j * 2) * 2.2 * u, 0); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
        ctx.strokeStyle = `rgba(160,166,186,${(.34 - j * .05).toFixed(3)})`; ctx.lineWidth = .7 + j * .25; ctx.stroke();
      }
    } else {
      for (let j = 0; j < 7; j++) { const k = j / 7, x = tip - 3 - j * 7.5, y = Math.sin(now * 2.6 + j * 1.3) * (.6 + j * .9);
        ctx.fillStyle = `rgba(48,50,64,${(.3 * (1 - k)).toFixed(3)})`; ell(x, y, 3 + j * 1.6, 1.6 + j * 1.05); ctx.fill();
        ctx.fillStyle = `rgba(160,166,186,${(.1 * (1 - k)).toFixed(3)})`; ell(x + 1, y - .8 - j * .3, 1.6 + j * .8, .6 + j * .3); ctx.fill(); }
    }
    ctx.restore();
  });
  // at rest, a thread of shadow rising off the steel, curling as it goes
  if (det && !icon && !arc && !thrust) t8Smoke(() => {
    const [ux, uy] = t8Up(), vx = -uy, vy = ux;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const ph = (now * .22 + i * .5) % 1, bx = x0 + 14 + i * 22 + Math.sin(now * .3 + i * 2) * 5, H = 16;
      let lx = bx, ly = 0;
      for (let n = 1; n <= 8; n++) { const t = n / 8, h = t * H * (.6 + .4 * ph), curl = Math.sin(t * 4.5 - now * 1.3 + i * 2.2) * 2.6 * t, x = bx + ux * h + vx * curl, y = ux * 0 + uy * h + vy * curl;
        ctx.strokeStyle = `rgba(70,74,92,${(.45 * (1 - t) * Math.sin(Math.PI * Math.min(1, ph * 1.4 + .15))).toFixed(3)})`; ctx.lineWidth = .8 + t * 1.6;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke(); lx = x; ly = y; }
    }
    ctx.restore();
  });
  // the dusk it carries: the air about the blade a shade darker, as if the steel drank the light out of it
  if (det) { ctx.save(); ctx.translate(x0 + len * .52, 0); ctx.scale(1, .2); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, len * .62); g.addColorStop(0, 'rgba(8,8,18,.26)'); g.addColorStop(.6, 'rgba(8,8,18,.1)'); g.addColorStop(1, 'rgba(8,8,18,0)'); ctx.fillStyle = g; ctx.fillRect(-len * .62, -len * .62, len * 1.24, len * 1.24); ctx.restore(); }

  // on its own (a card, a drop): a faint moonlight behind it, so the black hilt still stands out on a dark ground
  if (icon) t6Add(() => { const g = ctx.createRadialGradient(15, 0, 0, 15, 0, 15); g.addColorStop(0, 'rgba(160,175,230,.42)'); g.addColorStop(1, 'rgba(150,165,220,0)'); ctx.fillStyle = g; ctx.fillRect(0, -15, 30, 30); });
  // the grip: black, bound in twisted silver wire, a silver ferrule at either end
  limb([5, 0, 17, 0], '#0E0D12', 3.9);
  ctx.strokeStyle = C('#C9CEDA'); ctx.lineWidth = .55; ctx.beginPath(); for (let x = 6.4; x < 16.2; x += 1.25) { ctx.moveTo(x, -1.95); ctx.lineTo(x + .9, 1.95); } ctx.stroke();
  if (plain) { ctx.strokeStyle = 'rgba(20,20,28,.9)'; ctx.lineWidth = .3; ctx.beginPath(); for (let x = 7, i = 0; x < 16.2; x += 1.25, i++) { ctx.moveTo(x, -1.95); ctx.lineTo(x + .9, 1.95); } ctx.stroke(); }
  for (const x of [4.6, 16.4]) { rrect(x - .9, -2.6, 1.8, 5.2, .7); ctx.fillStyle = t6VG(-2.6, 2.6, '#C8CEDA', .45, -.4); ctx.fill(); outline(.6); }
  // the pommel: a full moon in a silver bezel, its seas faintly grey, a pale light about it
  ctx.fillStyle = C('#B8BECC'); circle(-1, 0, 1.1); ctx.fill(); outline(.5); // the finial
  circle(1.9, 0, 3.3); ctx.fillStyle = t6VG(-3.3, 3.3, '#B4BAC8', .45, -.45); ctx.fill(); outline(.8);
  circle(1.9, 0, 2.55);
  if (plain) { const g = ctx.createRadialGradient(1.2, -.9, 0, 1.9, 0, 2.6); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.55, '#E2E6F0'); g.addColorStop(1, '#9AA2B8'); ctx.fillStyle = g; } else ctx.fillStyle = C('#E8ECF4');
  ctx.fill();
  if (plain) { ctx.fillStyle = 'rgba(120,128,150,.45)'; ell(1.1, .6, .9, .7); ctx.fill(); ell(2.6, -.8, .6, .5); ctx.fill(); ell(2.8, 1.2, .45, .4); ctx.fill(); } // the moon's seas
  t6Halo(1.9, 0, 7, '205,218,255', .3 + .12 * pulse);

  // the blade: a short square ricasso, then long and slim to a needle point; dark grey steel, honed silver at the edges
  const blade = () => { ctx.beginPath(); ctx.moveTo(x0, -w * 1.12); ctx.lineTo(x0 + 8.5, -w * 1.12); ctx.lineTo(x0 + 10, -w); ctx.lineTo(x0 + len * .82, -w * .64); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .82, w * .64); ctx.lineTo(x0 + 10, w); ctx.lineTo(x0 + 8.5, w * 1.12); ctx.lineTo(x0, w * 1.12); ctx.closePath(); };
  blade();
  if (plain) { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#C4CAD8'); g.addColorStop(.18, '#7C8294'); g.addColorStop(.5, '#4A4E5E'); g.addColorStop(.82, '#5A5F70'); g.addColorStop(1, '#9AA0B2'); ctx.fillStyle = g; }
  else ctx.fillStyle = C('#5A5E6C');
  ctx.fill(); outline(1.45);
  if (plain) {
    ctx.save(); blade(); ctx.clip();
    // the honed edges: a thin line of silver along each, the only bright steel on it
    ctx.strokeStyle = '#E8ECF4'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(x0 + 1, -w * 1.12 + .35); ctx.lineTo(x0 + 8.5, -w * 1.12 + .35); ctx.lineTo(x0 + 10, -w + .35); ctx.lineTo(x0 + len * .82, -w * .64 + .3); ctx.lineTo(tip - .5, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,198,216,.8)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(x0 + 10, w - .3); ctx.lineTo(x0 + len * .82, w * .64 - .25); ctx.lineTo(tip - .5, 0); ctx.stroke();
    // a slow dark sheen sliding up the steel: the blade taking in what light there is
    const p = x0 + ((now * .11) % 1.4) * (len + 10) - 6, sg = ctx.createLinearGradient(p - 8, 0, p + 8, 0);
    sg.addColorStop(0, 'rgba(6,6,14,0)'); sg.addColorStop(.5, 'rgba(6,6,14,.38)'); sg.addColorStop(1, 'rgba(6,6,14,0)'); ctx.fillStyle = sg; ctx.fillRect(p - 8, -w * 1.2, 16, w * 2.4);
    ctx.restore();
  } else { ctx.fillStyle = C('#C8CEDA'); ctx.fillRect(x0 + 1, -w * .95, len * .8, .6); }
  // moonlight on the honed edges: a cold rim of light that shapes the dark blade against any ground
  t6Add(() => { ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x0 + 10, -w); ctx.lineTo(x0 + len * .82, -w * .64); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .82, w * .64); ctx.lineTo(x0 + 10, w);
    ctx.strokeStyle = `rgba(170,190,255,${(.22 + .1 * pulse).toFixed(3)})`; ctx.lineWidth = 2.2; ctx.stroke(); ctx.strokeStyle = 'rgba(225,232,255,.35)'; ctx.lineWidth = .7; ctx.stroke(); });
  // the ricasso: a black panel inlaid with a silver crescent moon, the Pattern's path rising from between its horns
  ell(x0 + 5.6, 0, 2.6, 1.85); ctx.fillStyle = C('#0A0A10'); ctx.fill();
  t8Crescent(x0 + 5.3, 0, 1.5, 0, '#E4E8F2');
  // the fuller: black, the Pattern laid in it in silver as one unbroken path of loops
  const f0 = x0 + 9.4, f1 = x0 + len * .88, fh = (x) => 1.12 - .45 * (x - f0) / (f1 - f0);
  ctx.beginPath(); ctx.moveTo(f0, -fh(f0)); ctx.lineTo(f1, -fh(f1)); ctx.quadraticCurveTo(f1 + 1.6, 0, f1, fh(f1)); ctx.lineTo(f0, fh(f0)); ctx.quadraticCurveTo(f0 - 1, 0, f0, -fh(f0)); ctx.closePath();
  ctx.fillStyle = C('#1A1C27'); ctx.fill();
  const PT = t8Path(), trace = (a, b) => { ctx.beginPath(); ctx.moveTo(PT[a][0], PT[a][1]); for (let i = a + 1; i <= b; i++) ctx.lineTo(PT[i][0], PT[i][1]); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (plain) { trace(0, PT.length - 1); ctx.strokeStyle = '#B4BCD0'; ctx.lineWidth = .4; ctx.stroke(); t6Add(() => { trace(0, PT.length - 1); ctx.strokeStyle = `rgba(150,170,230,${(.18 + .1 * pulse).toFixed(3)})`; ctx.lineWidth = .9; ctx.stroke(); }); }
  else { ctx.strokeStyle = C('#9AA2B8'); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(f0 + 1, 0); ctx.lineTo(f1 - 1, 0); ctx.stroke(); }
  // the walker: one spark rising out of the moon and running the Pattern to the point, a fading thread behind it
  const cyc = (now * .19) % 1.3, n = PT.length - 1;
  if (plain && cyc < 1) {
    const e = cyc < .06 ? cyc / .06 : 1, i1 = Math.round(n * cyc), i0 = Math.max(0, i1 - 70), [hx, hy] = PT[i1];
    t6Add(() => {
      for (let s = 0; s < 5; s++) { const a = i0 + Math.floor((i1 - i0) * s / 5), b = i0 + Math.floor((i1 - i0) * (s + 1) / 5); if (b <= a) continue; trace(a, b); ctx.strokeStyle = `rgba(200,220,255,${(.16 * (s + 1) * e).toFixed(3)})`; ctx.lineWidth = .5 + s * .14; ctx.stroke(); }
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5.5); g.addColorStop(0, `rgba(235,242,255,${(.95 * e).toFixed(3)})`); g.addColorStop(.35, `rgba(170,195,255,${(.4 * e).toFixed(3)})`); g.addColorStop(1, 'rgba(150,180,255,0)');
      ctx.fillStyle = g; ctx.fillRect(hx - 5.5, hy - 5.5, 11, 11);
      t8Rays(hx, hy, 1.9 * e, .9 * e, '#FFFFFF'); ctx.globalAlpha = 1;
    });
  } else if (plain && cyc < 1.16) { // it reaches the point: a cold star flares there and dies away
    const k = (cyc - 1) / .16, a = Math.sin(Math.PI * k);
    t6Halo(tip - 1, 0, 7 * a + 1, '200,215,255', .55 * a);
    t6Add(() => t8Rays(tip - 1, 0, 1.5 + 3.4 * a, .95 * a, '#F4F8FF'));
  }
  // light drawn in: motes of the world's light drifting to the steel and swallowed as they touch it
  if (det) t6Add(() => {
    for (let i = 0; i < 7; i++) {
      const p = (now * .16 + i / 7) % 1, sd = i % 2 ? 1 : -1, x = x0 + 11 + ((i * 7.7) % (len - 16)) + p * 3, d = 7 * (1 - p) ** 1.4, y = sd * (w * .8 + d), a = Math.sin(Math.PI * p) ** .7 * (1 - p) * .8;
      ctx.fillStyle = `rgba(225,232,255,${a.toFixed(3)})`; circle(x, y, .22 + .25 * (1 - p)); ctx.fill();
    }
  });

  // the hilt, black and silver: a knuckle bow and two sweeps from the quillon block, side rings, swept quillons
  const bow = () => { ctx.moveTo(18.4, -3.4); ctx.bezierCurveTo(13, -13.2, 5.6, -10.8, 3.4, -3.3); };
  const sweeps = () => { ctx.moveTo(18.6, -2.6); ctx.quadraticCurveTo(17.4, -8.4, 11.6, -10.1); ctx.moveTo(19.2, -2.2); ctx.quadraticCurveTo(15, -5.6, 7.4, -8.4); };
  const quil = () => { ctx.moveTo(19.2, -1.6); ctx.quadraticCurveTo(22.8, -8.8, 28, -11.2); ctx.moveTo(19.2, 1.6); ctx.quadraticCurveTo(15.4, 9.2, 10.2, 11.2); };
  const silverLine = (fn, lw) => { ctx.lineCap = 'round'; ctx.strokeStyle = C('#D4D9E4'); ctx.lineWidth = lw * (icon ? 1.6 : 1); ctx.beginPath(); fn(); ctx.stroke(); }; // (thicker on a card, read small)
  t6Inked('#15151C', 1.3, sweeps); silverLine(sweeps, .38);
  t6Inked('#15151C', 1.75, bow); silverLine(bow, .5);
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(21.6, sy * 3, 3, 2.1, sy * .25, 0, TAU); ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = 2.3; ctx.stroke(); ctx.strokeStyle = C('#15151C'); ctx.lineWidth = 1.1; ctx.stroke(); ctx.strokeStyle = C('#C8CEDA'); ctx.lineWidth = .35; ctx.stroke(); }
  t6Inked('#15151C', 1.8, quil); silverLine(quil, .55);
  t8Crescent(29, -11.7, 2.1, -.43, '#E2E6F0'); t8Crescent(9.1, 11.6, 2.1, 2.77, '#E2E6F0'); // crescent-moon finials
  // the shell: a black dish seen edge-on, rimmed in silver, an eight-rayed star of silver on it
  ell(19.2, 0, 2.3, 5.4); ctx.fillStyle = plain ? (() => { const g = ctx.createLinearGradient(0, -5.4, 0, 5.4); g.addColorStop(0, '#4A4C5A'); g.addColorStop(.45, '#121218'); g.addColorStop(1, '#22222C'); return g; })() : C('#16161E'); ctx.fill(); outline(.9);
  ctx.strokeStyle = C('#D4D9E4'); ctx.lineWidth = .45; ell(19.2, 0, 1.75, 4.8); ctx.stroke();
  t8Rays(19.2, 0, 2.6, 1, C('#E8ECF4'));
  if (plain) { t6Halo(19.2, 0, 6, '200,214,255', .22 + .14 * pulse); t6Add(() => { ctx.fillStyle = '#FFFFFF'; circle(19.2, 0, .5); ctx.fill(); }); }
  rrect(17.1, -2.3, 1.9, 4.6, .6); ctx.fillStyle = t6VG(-2.3, 2.3, '#C8CEDA', .45, -.4); ctx.fill(); outline(.55); // the quillon block

  // a held charge (moves.js): the edges light, and at each new level a bead of cold light runs down the blade
  const G = pose.rGlint;
  if (G && G.lvl && plain) {
    t6Add(() => {
      const hi = G.lvl >= 2, k = G.k;
      ctx.strokeStyle = G.lvl >= 3 ? 'rgba(180,170,255,.8)' : hi ? 'rgba(240,244,255,.85)' : 'rgba(220,230,255,.55)'; ctx.lineWidth = hi ? 1.1 : .8;
      ctx.beginPath(); ctx.moveTo(x0 + 8, -w + .3); ctx.lineTo(x0 + len * .82, -w * .64 + .3); ctx.lineTo(tip - .5, 0); ctx.stroke();
      if (k < 1) { const gx = x0 + 4 + (tip - x0 - 4) * k, L = hi ? 9 : 6, a = Math.sin(Math.PI * Math.min(1, k * 1.15 + .08)), g = ctx.createLinearGradient(gx - L, 0, gx + L, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${(a * (hi ? 1 : .85)).toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ell(gx, 0, L, w * (hi ? 1.6 : 1.25)); ctx.fill();
        if (hi && k > .75) t8Rays(tip, 0, 2.6 * Math.sin(Math.PI * clamp((k - .75) / .25, 0, 1)), .9, '#FFFFFF'); }
    });
  }
  t6SwingGlow(pose, 16, len + 12, 16);
  if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
}

const _drawWeapon8 = drawWeapon;
drawWeapon = function (kind, pose) {
  if (pose && pose.tier >= 8 && (kind === 'rapier' || kind === 'grayblade')) { ctx.save(); try { t8Grayswandir(pose); } finally { ctx.restore(); } return; }
  return _drawWeapon8(kind, pose);
};
