'use strict';
// ---------- art pass: enemy weapons and the three painted worlds ----------
// Everything here is prefixed (AW_ / aw) so it can't collide with the other art files sharing the global scope.

// ======================================================================================================
// ENEMY WEAPONS — drawn in hand space: the hand is at (17, 0), the weapon points along +x.
// ======================================================================================================
const awPlain = () => !FLASH && !TINT;
function awPath(pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); }
function awShape(pts, col, w = 1.3) { awPath(pts); ctx.fillStyle = typeof col === 'string' ? C(col) : col; ctx.fill(); if (w) outline(w); }
function awVG(y0, y1, col, lt = .35, dk = -.3) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C(shade(col, lt))); g.addColorStop(.5, C(col)); g.addColorStop(1, C(shade(col, dk))); return g; }
function awStroke(col, w, fn, cap = 'round') { ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke(); }
function awInked(col, w, fn) { awStroke(FLASH ? '#fff' : OUT, w + 2, fn); awStroke(col, w, fn); } // a stroked part with a dark line round it
function awRivet(x, y, r = .9, col = '#E8C890') { if (!awPlain()) return; ctx.fillStyle = shade(col, -.45); circle(x + .25, y + .3, r); ctx.fill(); ctx.fillStyle = col; circle(x, y, r * .75); ctx.fill(); }
function awAdd(fn) { if (!awPlain()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); } // light added on top (no shadowBlur: cheap on phones)
function awHalo(x, y, r, rgb, a) { awAdd(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.4, `rgba(${rgb},${a * .45})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }); }
function awHand(pose) { gripHand((pose && pose.glove) || '#5E4130'); }
function awSwingGlow(pose, x0, len) { if (pose && pose.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.fillStyle = pose.glow; rrect(x0, -10, len, 20, 8); ctx.fill(); ctx.restore(); } }

const ENEMY_WEAPONS = {
  // the Briar Bandit's knife: a clipped seax with a notched spine, an iron S-guard, a cord-bound grip and a ring pommel
  dagger(pose) {
    awInked('#6E727E', 1.5, () => ctx.arc(4.6, 0, 2.6, 0, TAU)); // ring pommel
    limb([7, 0, 15, 0], '#4A2E1E', 4.2);
    if (awPlain()) { ctx.strokeStyle = '#7E8A4A'; ctx.lineWidth = .8; ctx.beginPath(); for (let x = 7.4; x < 14; x += 1.7) { ctx.moveTo(x, -2); ctx.lineTo(x + 1.2, 2); } ctx.stroke(); } // green briar cord
    awHand(pose);
    // the blade: straight spine, clipped down to the point, a full belly on the edge
    awShape([22.5, -3.2, 37, -3.6, 46.5, .4, 41, 2.6, 33, 3.9, 22.5, 3.3], awVG(-4, 4, '#C9CED8', .45, -.35), 1.25);
    if (awPlain()) {
      ctx.fillStyle = '#F4F7FC'; awPath([24, 1.6, 33, 2.4, 41, 1.4, 45.4, .3, 41, 2.6, 33, 3.9, 24, 3.3]); ctx.fill(); // the honed bevel catching light
      ctx.fillStyle = '#7E8696'; ctx.fillRect(25, -1.6, 10.5, .9); // fuller
      ctx.fillStyle = '#5A606E'; for (let x = 26; x < 35; x += 2.6) { ctx.beginPath(); ctx.moveTo(x, -3.5); ctx.lineTo(x + 1, -2.3); ctx.lineTo(x + 2, -3.6); ctx.fill(); } // notches on the spine
      ctx.fillStyle = 'rgba(120,60,40,.25)'; ell(30, .8, 1.6, .6, .1); ctx.fill(); // a little rust
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(37.6, -3.1, 5, .7);
    }
    rrect(20.4, -6, 2.8, 12, 1.2); ctx.fillStyle = awVG(-6, 6, '#7A7E8A'); ctx.fill(); outline(1.1); // S-guard
    awInked('#7A7E8A', 1.3, () => { ctx.moveTo(21.8, -6); ctx.quadraticCurveTo(24.5, -7.6, 25, -5.4); ctx.moveTo(21.8, 6); ctx.quadraticCurveTo(19, 7.8, 18.6, 5.6); });
  },

  // the Thorn Archer's recurve bow: a dark riser bound in leather, horn-tipped limbs, the string drawn back to a nocked arrow
  bow(pose) {
    const t1 = [12.5, -27], t2 = [12.5, 27], nock = [-3, -4.4];
    const limbPath = (s) => { ctx.moveTo(17.5, s * 8); ctx.bezierCurveTo(23, s * 13, 22, s * 23, t1[0], s * 27.5); ctx.quadraticCurveTo(10.6, s * 29.4, 13.4, s * 31.6); };
    awStroke('#EDE4CC', .9, () => { ctx.moveTo(t1[0] + .4, t1[1] - .4); ctx.lineTo(nock[0], nock[1]); ctx.lineTo(t2[0] + .4, t2[1] + .4); }); // the drawn string
    for (const s of [-1, 1]) { awInked('#6A4426', 3, () => limbPath(s)); if (awPlain()) awStroke('#B07A48', .9, () => { ctx.moveTo(19.6, s * 10); ctx.bezierCurveTo(23.4, s * 14, 22.2, s * 22, 14, s * 27); }); }
    for (const s of [-1, 1]) { ctx.fillStyle = C('#E8DCC0'); circle(13.4, s * 31.4, 1.6); ctx.fill(); outline(.9); } // horn nocks
    rrect(15, -10, 5, 20, 2); ctx.fillStyle = awVG(-10, 10, '#4A2E1E'); ctx.fill(); outline(1.2); // riser
    if (awPlain()) { ctx.fillStyle = '#C9B07A'; ctx.fillRect(15.2, -9, 4.6, 1.2); ctx.fillRect(15.2, 7.8, 4.6, 1.2); } // brass bands
    // the arrow, resting on the shelf above the hand
    const ay = nock[1];
    awInked('#B8956A', 1.3, () => { ctx.moveTo(nock[0], ay); ctx.lineTo(33, ay); });
    awShape([32.5, ay - 2.6, 39.5, ay, 32.5, ay + 2.6, 34, ay], awVG(ay - 3, ay + 3, '#C8CCD6', .5), 1); // a steel broadhead
    awShape([-2, ay, 3, ay - 3.6, 7.5, ay - .3], '#B8443A', .9); awShape([-2, ay, 3, ay + 3.6, 7.5, ay + .3], '#3E5A4A', .9); // fletching
    if (awPlain()) { ctx.fillStyle = '#E8E0D0'; ctx.fillRect(-3.4, ay - .8, 1.6, 1.6); }
    awHand(pose);
    if (awPlain()) { ctx.strokeStyle = '#2A1B2C'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(14, -1.2); ctx.lineTo(20.2, -1.2); ctx.stroke(); } // leather wrap edge
    if (awPlain()) { ctx.fillStyle = '#5A8A4A'; ell(22.4, -18.5, 2.2, 1, -.8); ctx.fill(); ell(22.6, 17.8, 2, .9, .8); ctx.fill(); } // thorn-leaf charms bound to the limbs
  },

  // the Aether Gunner's rifle: walnut stock, brass receiver with a glowing aether vial, a banded steel barrel,
  // a scope, a copper coil and a flared emitter at the muzzle
  rifle(pose) {
    const pulse = .75 + .25 * Math.sin(performance.now() / 260);
    awShape([-9, -3.4, 4, -3.8, 13, -3, 13, 3.6, 7, 4, -1, 7.2, -9, 7.4], awVG(-4, 8, '#7A5234', .3, -.35), 1.3); // stock
    if (awPlain()) { ctx.strokeStyle = 'rgba(40,20,10,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(0, -1.5, 11, -.6); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(1, 2.6, 8, 2.4); ctx.stroke(); }
    rrect(-10.4, -3.6, 2.4, 11.2, 1); ctx.fillStyle = C('#B88A48'); ctx.fill(); outline(1); // brass butt plate
    rrect(30, -3.2, 31, 4.6, 1.6); ctx.fillStyle = awVG(-3.2, 1.4, '#4A4E5E', .4); ctx.fill(); outline(1.3); // barrel
    rrect(29, .4, 15, 4.4, 1.8); ctx.fillStyle = awVG(.4, 4.8, '#7A5234'); ctx.fill(); outline(1.1); // walnut handguard
    ctx.fillStyle = C('#C9A060'); for (const x of [36, 45, 54]) { rrect(x, -3.8, 2.2, 5.8, .8); ctx.fill(); outline(.8); } // brass barrel bands
    if (awPlain()) { ctx.strokeStyle = '#C27A44'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 46.6; x < 53.5; x += 1.6) { ctx.moveTo(x, -3.2); ctx.lineTo(x + .8, 1.4); } ctx.stroke(); } // copper coil
    awShape([60, -4.4, 66, -6.4, 66, 3.2, 60, 1.6], awVG(-6.4, 3.2, '#B88A48'), 1.2); // flared emitter
    ctx.fillStyle = C('#2A3A44'); ell(66, -1.6, 1.2, 4.2); ctx.fill();
    rrect(11, -6, 20, 9.6, 2.4); ctx.fillStyle = awVG(-6, 3.6, '#B88A48'); ctx.fill(); outline(1.4); // receiver
    if (awPlain()) { ctx.fillStyle = shade('#B88A48', .45); ctx.fillRect(12.5, -5.2, 17, 1); }
    for (const x of [13, 29]) { awRivet(x, -3.8); awRivet(x, 1.6); }
    rrect(14.5, -3.4, 12.5, 4.4, 2); ctx.fillStyle = C('#5FD8D0'); ctx.fill(); outline(1); // the aether vial
    if (awPlain()) { ctx.fillStyle = `rgba(230,255,252,${.5 + .4 * pulse})`; ctx.fillRect(16, -2.6, 9.5, 1.1); ctx.fillStyle = '#2E8A86'; ctx.fillRect(16, -.2, 9.5, .9); }
    ctx.fillStyle = C('#8A6A3A'); ctx.fillRect(14, -3.6, 1.6, 4.8); ctx.fillRect(26, -3.6, 1.6, 4.8);
    rrect(16, -11.4, 15, 3.2, 1.4); ctx.fillStyle = awVG(-11.4, -8.2, '#3E4250', .4); ctx.fill(); outline(1); // scope
    ctx.fillStyle = C('#C9A060'); ctx.fillRect(18, -11.8, 1.6, 4); ctx.fillRect(27, -11.8, 1.6, 4); ctx.fillRect(19.5, -8.4, 1.4, 2.6); ctx.fillRect(26, -8.4, 1.4, 2.6);
    ctx.fillStyle = C('#9FF0E8'); ell(31, -9.8, .9, 1.5); ctx.fill();
    awInked('#3E4250', 1, () => { ctx.moveTo(14, 3.6); ctx.quadraticCurveTo(15.5, 8.6, 21, 6.4); }); // trigger guard
    awHand(pose);
    awHalo(66.5, -1.6, 9, '120,240,230', .55 * pulse); awHalo(20.7, -1.2, 9, '120,240,230', .25 * pulse);
    if (awPlain()) { ctx.fillStyle = '#E6FFFC'; ell(66.4, -1.6, .8, 2.6); ctx.fill(); }
  },

  // the Rift Witch's staff: twisted night-wood with silver ferrules and a glowing rune band, crowned by
  // silver claws cradling a swirling aether orb, with a feather charm hanging from the head
  orb(pose) {
    const now = performance.now() / 1000, pulse = .8 + .2 * Math.sin(now * 3.1), ox = 50, oy = 0, R = 7;
    awHalo(ox, oy, 22, '140,230,240', .38 * pulse);
    limb([-20, 0, 42, 0], '#3A2E4A', 3.4);
    if (awPlain()) { ctx.strokeStyle = '#6A5A82'; ctx.lineWidth = .8; ctx.beginPath(); for (let x = -18; x < 40; x += 4.4) { ctx.moveTo(x, 1.4); ctx.lineTo(x + 2.4, -1.4); } ctx.stroke(); } // the twist of the grain
    rrect(-23, -2.4, 4.4, 4.8, 1.2); ctx.fillStyle = awVG(-2.4, 2.4, '#B8C4D8'); ctx.fill(); outline(1); // ferrule
    ctx.fillStyle = C('#B8C4D8'); for (const x of [25, 36]) { rrect(x, -2.6, 2, 5.2, .8); ctx.fill(); outline(.8); }
    rrect(28.4, -2.4, 6, 4.8, 1); ctx.fillStyle = C('#2A3460'); ctx.fill(); outline(.8);
    awAdd(() => { ctx.fillStyle = `rgba(160,240,250,${.7 * pulse})`; for (let x = 29.2; x < 34; x += 1.6) ctx.fillRect(x, -1.4, .9, 2.8); }); // rune band
    // dangling feather charm
    awStroke('#C9B07A', .6, () => { ctx.moveTo(39, 1.6); ctx.quadraticCurveTo(38.5, 6, 37.4, 9.4); });
    ctx.save(); ctx.translate(37.4, 9.4); ctx.rotate(.25 + Math.sin(now * 2) * .15);
    ell(0, 4.4, 1.6, 4.4); ctx.fillStyle = C('#5FB8C0'); ctx.fill(); outline(.8);
    if (awPlain()) { ctx.strokeStyle = '#E8F8FA'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8.4); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = C('#B8C4D8'); circle(39.4, 1.6, 1.1); ctx.fill();
    // silver claws behind the orb
    for (const s of [-1, 1]) awInked('#AEB8CC', 1.8, () => { ctx.moveTo(41, s * 1.6); ctx.bezierCurveTo(42, s * 9, 48, s * 10.4, 53.6, s * 7.4); });
    // the orb
    const g = ctx.createRadialGradient(ox - 2, oy - 2.4, .5, ox, oy, R);
    g.addColorStop(0, C('#F4FFFF')); g.addColorStop(.35, C('#A8F0F4')); g.addColorStop(.8, C('#3E8AAA')); g.addColorStop(1, C('#2A4A78'));
    circle(ox, oy, R); ctx.fillStyle = g; ctx.fill(); outline(1.2);
    awAdd(() => { // light swirling inside
      ctx.strokeStyle = 'rgba(220,255,255,.75)'; ctx.lineWidth = .9;
      for (let k = 0; k < 2; k++) { const a = now * 2.2 + k * Math.PI; ctx.beginPath(); ctx.arc(ox, oy, R * (.42 + k * .14), a, a + 2.1); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(ox + Math.cos(now * 1.7) * 3, oy + Math.sin(now * 1.7) * 2, 1.2); ctx.fill();
    });
    if (awPlain()) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ell(ox - 2.6, oy - 3.4, 1.8, 1, -.6); ctx.fill(); }
    awInked('#AEB8CC', 1.6, () => { ctx.moveTo(42.2, 2.2); ctx.bezierCurveTo(46, 8.6, 52, 7.6, 55.4, 3.4); }); // a claw in front
    if (awPlain()) awStroke('#F0F4FA', .5, () => { ctx.moveTo(44, -6.4); ctx.quadraticCurveTo(48, -9, 52, -7.6); });
    awHand(pose);
  },

  // the brass automaton's / sentinel's / corsair's sabre: a curved, teal-white blade with a fuller lit by an aether
  // inlay, a brass collar riveted to the ricasso, a cog-ended crossguard, a knuckle bow and a gem in the pommel
  blade(pose) {
    const pulse = .7 + .3 * Math.sin(performance.now() / 300);
    ctx.fillStyle = C('#C99B55'); circle(4.6, 0, 3.2); ctx.fill(); outline(1.1); // pommel
    ctx.fillStyle = C('#4E9A90'); circle(4.4, 0, 1.4); ctx.fill();
    limb([7, 0, 16, 0], '#3A2A20', 4.2);
    if (awPlain()) { ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = .6; ctx.beginPath(); for (let x = 7.6; x < 14; x += 1.5) { ctx.moveTo(x, -2); ctx.lineTo(x + 1, 2); } ctx.stroke(); } // brass wire wrap
    awHand(pose);
    // the blade, sweeping gently up to the point
    ctx.beginPath(); ctx.moveTo(23, -4.2); ctx.quadraticCurveTo(52, -4.2, 70, -7.6); ctx.lineTo(76, -7.4); ctx.quadraticCurveTo(54, 5.6, 23, 4.6); ctx.closePath();
    ctx.fillStyle = awVG(-6, 5, '#BFE8E2', .45, -.32); ctx.fill(); outline(1.7);
    if (awPlain()) {
      ctx.fillStyle = '#F4FFFC'; ctx.beginPath(); ctx.moveTo(25, 2.4); ctx.quadraticCurveTo(54, 3.2, 74, -6.6); ctx.quadraticCurveTo(54, 5.2, 25, 4.4); ctx.closePath(); ctx.fill(); // the honed edge
      ctx.strokeStyle = '#6EA8A2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(27, -1.4); ctx.quadraticCurveTo(46, -1.2, 60, -3.8); ctx.stroke(); // fuller
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(27, -3.3); ctx.quadraticCurveTo(48, -3.4, 66, -6.5); ctx.stroke(); // light along the spine
    }
    awAdd(() => { // the aether inlay in the fuller, a little circuit
      ctx.strokeStyle = `rgba(110,250,232,${.55 * pulse})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(28, -1.4); ctx.quadraticCurveTo(40, -1.3, 50, -2.2); ctx.stroke();
      ctx.fillStyle = `rgba(190,255,245,${.8 * pulse})`; for (const [x, y] of [[33, -1.3], [42, -1.6], [50, -2.2]]) { circle(x, y, .8); ctx.fill(); }
    });
    rrect(21.6, -5.4, 4.6, 10.8, 1.2); ctx.fillStyle = awVG(-5.4, 5.4, '#C99B55'); ctx.fill(); outline(1.1); // brass collar
    awRivet(23.9, -3); awRivet(23.9, 3);
    rrect(18.6, -10, 3.8, 20, 1.6); ctx.fillStyle = awVG(-10, 10, '#C99B55'); ctx.fill(); outline(1.3); // crossguard
    for (const s of [-1, 1]) { // a little cog at each end
      ctx.save(); ctx.translate(20.5, s * 11); ctx.fillStyle = C('#B88A48');
      for (let k = 0; k < 6; k++) { ctx.rotate(TAU / 6); ctx.fillRect(-.8, 2, 1.6, 1.6); }
      circle(0, 0, 2.7); ctx.fill(); outline(1); ctx.fillStyle = C('#4E9A90'); circle(0, 0, 1); ctx.fill(); ctx.restore();
    }
    awInked('#C99B55', 1.6, () => { ctx.moveTo(20, 8.4); ctx.quadraticCurveTo(14, 11.6, 6.4, 3); }); // knuckle bow
    if (awPlain()) awStroke(shade('#C99B55', .5), .5, () => { ctx.moveTo(19.4, -9); ctx.lineTo(19.4, 8.6); });
    awSwingGlow(pose, 16, 64);
  },

  // the Prism Cultist's crystal blade: a jagged, faceted shard of living crystal with a glowing core,
  // set in a black hilt with a crown of crystal spurs for a guard
  prism(pose) {
    const now = performance.now() / 1000, pulse = .75 + .25 * Math.sin(now * 4);
    awHalo(50, 0, 30, '200,150,255', .16 * pulse);
    awShape([7, -2.8, -1.4, 0, 7, 2.8], '#E8A0D8', 1); // a shard for a pommel
    limb([6, 0, 16, 0], '#2A1A36', 4.2);
    if (awPlain()) { ctx.fillStyle = '#C878A8'; for (let x = 7.5; x < 15; x += 2.4) ctx.fillRect(x, -2.1, .9, 4.2); }
    awHand(pose);
    // the blade: one facet takes the light, the other falls into shadow; notched like broken crystal
    const top = [24, -4.4, 33, -6, 37, -4.2, 49, -7.2, 53, -4.8, 65, -5.8, 78, 0], bot = [65, 4.6, 57, 3.2, 45, 6.2, 41, 4, 31, 5.8, 24, 4.4];
    const gx = ctx.createLinearGradient(24, 0, 78, 0); gx.addColorStop(0, C('#9FE8F8')); gx.addColorStop(.5, C('#D8B8F8')); gx.addColorStop(1, C('#F8C8EC'));
    awShape(top.concat(bot), gx, 1.6);
    if (awPlain()) {
      ctx.fillStyle = 'rgba(255,255,255,.42)'; awPath([24, 0].concat(top)); ctx.fill(); // the lit facet
      ctx.fillStyle = 'rgba(70,30,120,.32)'; awPath([24, 0, 78, 0].concat(bot)); ctx.fill(); // the shadowed facet
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .5; ctx.beginPath(); // fractures from each notch to the ridge
      for (const [x, y, x2] of [[37, -4.2, 41], [53, -4.8, 57], [41, 4, 44], [57, 3.2, 60]]) { ctx.moveTo(x, y); ctx.lineTo(x2, 0); }
      ctx.stroke();
    }
    awAdd(() => { // the glowing core along the ridge, and a glint near the point
      const cg = ctx.createLinearGradient(24, 0, 78, 0); cg.addColorStop(0, `rgba(255,220,250,${.9 * pulse})`); cg.addColorStop(1, 'rgba(255,220,250,.1)');
      ctx.strokeStyle = cg; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(76, 0); ctx.stroke();
      const gx2 = 64 + Math.sin(now * 1.3) * 6; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(gx2, -3.6); ctx.lineTo(gx2 + .7, -.7); ctx.lineTo(gx2 + 3.4, 0); ctx.lineTo(gx2 + .7, .7); ctx.lineTo(gx2, 3.6); ctx.lineTo(gx2 - .7, .7); ctx.lineTo(gx2 - 3.4, 0); ctx.lineTo(gx2 - .7, -.7); ctx.closePath(); ctx.fill();
    });
    // the guard: crystal spurs fanning out of a dark silver mount
    for (const [ax, ay, tx, ty, w] of [[21, -3, 25, -14, 2.4], [21, 3, 25, 14, 2.4], [20, -3, 17, -10, 1.8], [20, 3, 17, 10, 1.8]]) awShape([ax - w, ay, tx, ty, ax + w, ay], awVG(Math.min(ay, ty), Math.max(ay, ty), '#C8A8F0', .4), 1);
    rrect(18.6, -4.6, 5, 9.2, 1.6); ctx.fillStyle = awVG(-4.6, 4.6, '#5E5478'); ctx.fill(); outline(1.1);
    ctx.fillStyle = C('#F0A8E0'); circle(21.1, 0, 1.5); ctx.fill();
    awSwingGlow(pose, 16, 66);
  },

  // the Brass Colossus's arm cannon: a riveted brass housing over the forearm, a teal boiler with a pressure gauge,
  // an exhaust pipe, a teal steel barrel wound with brass coils and a flared muzzle glowing white-hot
  cannon(pose) {
    const now = performance.now() / 1000, pulse = .7 + .3 * Math.sin(now * 5);
    awInked('#8A6030', 2.6, () => { ctx.moveTo(6, -8); ctx.quadraticCurveTo(0, -12, -2, -18); }); // exhaust pipe
    rrect(-4.6, -21, 5.4, 4, 1.2); ctx.fillStyle = C('#5A4A3E'); ctx.fill(); outline(1);
    rrect(36, -7.4, 22, 14.8, 3); ctx.fillStyle = awVG(-7.4, 7.4, '#2F7C78', .45, -.4); ctx.fill(); outline(1.6); // barrel
    if (awPlain()) { ctx.fillStyle = '#1E4E4C'; for (const x of [40, 45]) ctx.fillRect(x, -7, 2.2, 2.2); } // vents
    for (const x of [43, 48.5, 54]) { ell(x, 0, 1.9, 8.4); ctx.fillStyle = C('#C99B55'); ctx.fill(); outline(.9); if (awPlain()) { ctx.fillStyle = '#F0D08A'; ell(x - .5, -4.6, .7, 2.2); ctx.fill(); } } // brass coils
    awShape([57, -8.6, 64, -12.6, 64, 12.6, 57, 8.6], awVG(-12.6, 12.6, '#C99B55', .45), 1.5); // flared muzzle
    for (const y of [-9.6, 9.6]) awRivet(60.5, y);
    ell(64, 0, 2.6, 10.4); ctx.fillStyle = C('#3A2A22'); ctx.fill(); outline(1);
    // the housing over the forearm
    rrect(0, -11, 39, 22, 7); ctx.fillStyle = awVG(-11, 11, '#B8873E', .4, -.35); ctx.fill(); outline(2);
    if (awPlain()) {
      ctx.fillStyle = shade('#B8873E', .5); rrect(3, -9.6, 33, 2.4, 1.2); ctx.fill(); // light along the top
      ctx.fillStyle = shade('#B8873E', -.3); for (const x of [11, 22, 33]) ctx.fillRect(x, -10.6, 2.4, 21.2); // band seams
    }
    for (const x of [6, 16.5, 27.5]) { awRivet(x, -6.4); awRivet(x, 6.6); }
    awAdd(() => { ctx.strokeStyle = `rgba(100,240,220,${.6 * pulse})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(4, 3.4); ctx.lineTo(35, 3.4); ctx.stroke(); }); // aether conduit
    rrect(5, -17.6, 22, 7.6, 3.4); ctx.fillStyle = awVG(-17.6, -10, '#3E8A84', .4); ctx.fill(); outline(1.4); // boiler
    ctx.fillStyle = C('#C99B55'); for (const x of [8, 22]) { ctx.fillRect(x, -17.6, 2, 7.6); }
    circle(17, -13.8, 3.2); ctx.fillStyle = C('#F2E8D0'); ctx.fill(); outline(1); // pressure gauge
    if (awPlain()) { ctx.strokeStyle = '#B8445A'; ctx.lineWidth = .8; const a = -2.4 + Math.sin(now * 2.3) * .4 + pulse * .5; ctx.beginPath(); ctx.moveTo(17, -13.8); ctx.lineTo(17 + Math.cos(a) * 2.4, -13.8 + Math.sin(a) * 2.4); ctx.stroke(); }
    // the muzzle glow
    awHalo(64, 0, 26, '255,236,160', .5 * pulse); awHalo(64, 0, 14, '120,240,220', .45 * pulse);
    ell(64, 0, 1.7, 8); ctx.fillStyle = C(FLASH ? '#fff' : `rgb(255,${236 + 19 * pulse | 0},${180 + 60 * pulse | 0})`); ctx.fill();
    awSwingGlow(pose, 0, 66);
  },
};
