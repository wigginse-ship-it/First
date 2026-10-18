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

// ======================================================================================================
// WORLDS — painted once per world into two 1280-wide layers that tile (far, mid) plus a floor strip.
// Every placed object goes through awWrap so it continues across the seam; every ridge uses whole harmonics.
// ======================================================================================================
const AW_W = 1280, AW_FT0 = FLOOR_TOP - 44; // the floor strip starts a little above the ground line (for the verge)
let AW_SUN = 1; // which side the light comes from while a world is painted: +1 from the right, -1 from the left
let awFloorC = null, awFloorKey = '', awSeams = [];
function awWrap(x, w, fn) { fn(x); if (x - w < 0) fn(x + AW_W); if (x + w > AW_W) fn(x - AW_W); }
function awWave(seed, terms) { // a sum of sines with whole numbers of waves across the layer, so it tiles
  const r = mulberry(seed), hs = terms.map(([k, a]) => [k * TAU / AW_W, a, r() * TAU]);
  return (x) => { let s = 0; for (const [f, a, p] of hs) s += Math.sin(x * f + p) * a; return s; };
}
function awFillPts(pts, col, a = 1) { awPath(pts); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; }
function awMix(a, b, k) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
function awGlow(col, blur, fn) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = blur * K; fn(); ctx.restore(); } // build time only
function awSoft(x, y, rx, ry, rgb, a) { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); softDab(0, 0, rx, rgb, a); ctx.restore(); }

// a hazy ridge; the same signature as before, but it now tiles (its frequency is rounded to whole waves)
function ridge(y0, amp, freq, col, seed) {
  const k = Math.max(1, Math.round(freq * AW_W / TAU)), w = awWave(seed * 7 + 1, [[k, amp], [k * 3 - 1, amp * .3], [k * 7 + 2, amp * .08]]);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP);
  for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, y0 + w(x));
  ctx.lineTo(AW_W, FLOOR_TOP); ctx.fill();
}
// rolling ground with light caught on the slopes that face the sun
function awHills(y0, terms, seed, col, lit, litA, bottom = FLOOR_TOP) {
  const w = awWave(seed, terms), y = (x) => y0 + w(x);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, bottom); for (let x = 0; x <= AW_W; x += 6) ctx.lineTo(x, y(x)); ctx.lineTo(AW_W, bottom); ctx.fill();
  if (lit) { // slopes facing the light get a warm plane that fades down the hill
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, bottom); for (let x = 0; x <= AW_W; x += 6) ctx.lineTo(x, y(x)); ctx.lineTo(AW_W, bottom); ctx.clip();
    for (let x = 0; x <= AW_W; x += 6) { const sl = (y(x + 3) - y(x - 3)) / 6 * -AW_SUN; if (sl > .02) { ctx.globalAlpha = Math.min(1, sl * 3) * litA; ctx.fillStyle = lit; ctx.fillRect(x - 3, y(x) - 1, 6.5, 18 + sl * 40); } }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  return y;
}
// a mountain range of jagged peaks; each peak has a lit plane on its sunward face, snow on the tallest ones
function awRange(rnd, o) {
  const n = o.n, pk = [];
  for (let i = 0; i < n; i++) pk.push([(i + .15 + rnd() * .7) * AW_W / n, o.base - o.hMin - rnd() * (o.hMax - o.hMin)]);
  pk.push([pk[0][0] + AW_W, pk[0][1]]);
  const P = [], faces = [], steps = o.steps || 6, jag = o.jag || 6;
  const walk = (a, b) => { for (let s = 1; s < steps; s++) { const k = s / steps; P.push([lerp(a[0], b[0], k) + (rnd() - .5) * jag * .5, lerp(a[1], b[1], k) + (rnd() - .5) * jag]); } };
  for (let i = 0; i < n; i++) {
    const a = pk[i], b = pk[i + 1], lo = Math.max(a[1], b[1]);
    const v = [lerp(a[0], b[0], .3 + rnd() * .4), lo + (o.base - lo) * (o.vDepth ?? (.25 + rnd() * .4))];
    const ia = P.length; P.push(a); walk(a, v); const iv = P.length; P.push(v); walk(v, b);
    const ib = P.length; // index the next apex will get
    // the sunward face: right slope (a -> v) when the sun is right, left slope (v -> b) when it is left
    const pts = AW_SUN > 0 ? P.slice(ia, iv + 1) : null;
    faces.push({ a, v, b, ia, iv, ib, rnd: rnd(), r2: rnd(), pts });
  }
  P.push(pk[n]);
  for (const f of faces) if (!f.pts) f.pts = P.slice(f.iv, f.ib + 1);
  const sil = () => { ctx.beginPath(); ctx.moveTo(P[0][0], FLOOR_TOP); for (const p of P) ctx.lineTo(p[0], p[1]); ctx.lineTo(P[P.length - 1][0], FLOOR_TOP); ctx.closePath(); };
  for (const ox of [-AW_W, 0]) {
    ctx.save(); ctx.translate(ox, 0);
    sil(); ctx.fillStyle = o.col; ctx.fill();
    ctx.save(); sil(); ctx.clip();
    if (o.shade) { const g = ctx.createLinearGradient(0, o.base - o.hMax, 0, o.base); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, o.shade); ctx.fillStyle = g; ctx.fillRect(-10, o.base - o.hMax - 20, AW_W + 20, o.hMax + 60); }
    for (const f of faces) { // lit plane: the sunward slope, closed by a crease running from the summit down into the face
      const top = AW_SUN > 0 ? f.a : f.b, bot = f.v, crease = [lerp(top[0], bot[0], .18 + f.rnd * .2), lerp(top[1], o.base, .75)];
      const pts = f.pts.slice(); if (AW_SUN < 0) pts.reverse(); // now runs summit -> valley
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(bot[0], o.base + 10); ctx.lineTo(crease[0], o.base + 10);
      for (let s = 4; s >= 1; s--) { const k = s / 5; ctx.lineTo(lerp(top[0], crease[0], k) + (Math.sin(s * 9.1 + f.r2 * 20) * jag * .4), lerp(top[1], crease[1], k)); }
      ctx.closePath(); ctx.globalAlpha = o.litA; ctx.fillStyle = o.lit; ctx.fill(); ctx.globalAlpha = 1;
      if (o.gully) { // gullies run down the faces
        ctx.strokeStyle = o.gully; ctx.lineWidth = .8;
        for (let g = 0; g < 4; g++) { const k = (g + .5) / 4, sx = lerp(top[0], bot[0], k * .8), sy = lerp(top[1], bot[1], k * .8) + 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - AW_SUN * 2 + Math.sin(g * 5 + f.r2 * 9) * 3, sy + 10 + k * 14); ctx.stroke(); }
      }
      if (o.snow && top[1] < o.snow) { // snow on the summit: bright on the lit side, lavender in shadow
        const d = (o.snow - top[1]) * .8 + 6;
        ctx.save(); ctx.beginPath(); ctx.moveTo(top[0] - 80, top[1] - 4);
        for (let s = 0; s <= 8; s++) { const x = top[0] - 40 + s * 10, y = top[1] + d * (1 - Math.abs(s - 4) / 6) + (s % 2 ? 6 : -2) * (.6 + f.rnd * .6); ctx.lineTo(x, y); }
        ctx.lineTo(top[0] + 80, top[1] - 4); ctx.closePath(); ctx.clip();
        ctx.fillStyle = o.snowShade; ctx.fillRect(top[0] - 80, top[1] - 4, 160, d + 20);
        ctx.fillStyle = o.snowLit; ctx.beginPath(); ctx.moveTo(top[0], top[1] - 4); ctx.lineTo(top[0] + AW_SUN * 80, top[1] - 4); ctx.lineTo(top[0] + AW_SUN * 80, top[1] + d + 20); ctx.lineTo(crease[0], top[1] + d + 20); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.restore();
  }
  return P;
}

// ---------- foliage ----------
// a mass of leaves: a shadowed underside, mid-tone body, lit crown on the sun side, specks of highlight and a broken edge
function awLeaves(cx, cy, r, rnd, g, n = 1) {
  const s = AW_SUN;
  for (let i = 0; i < 7 * n; i++) { const a = rnd() * TAU, d = rnd() * r * .7; dab(cx + Math.cos(a) * d - s * r * .1, cy + Math.sin(a) * d * .75 + r * .18, r * (.32 + rnd() * .22), g[0], 1); }
  for (let i = 0; i < 9 * n; i++) { const a = rnd() * TAU, d = rnd() * r * .6; dab(cx + Math.cos(a) * d + s * r * .06, cy + Math.sin(a) * d * .7 - r * .06, r * (.2 + rnd() * .2), g[1], .95); }
  for (let i = 0; i < 8 * n; i++) { const a = -Math.PI / 2 + s * rnd() * 1.5, d = r * (.25 + rnd() * .45); dab(cx + Math.cos(a) * d * .9, cy + Math.sin(a) * d * .8, r * (.12 + rnd() * .16), g[2], .9); }
  for (let i = 0; i < 5 * n; i++) { const a = -Math.PI / 2 + s * (.3 + rnd() * 1.1), d = r * (.55 + rnd() * .35); dab(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, r * (.06 + rnd() * .07), g[3], .85); }
  for (let i = 0; i < 12 * n; i++) { const a = rnd() * TAU, d = r * (.85 + rnd() * .25); dab(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .78, 1.4 + rnd() * 1.8, Math.sin(a) * s < 0 && Math.cos(a) * s > 0 ? g[2] : g[0], .95); } // leaves breaking the edge
}
// a tree: a tapering trunk with a root flare, a few branches, and a crown built of clustered leaf masses
function paintTree(x, base, h, rnd, greens, glow) {
  const s = AW_SUN, g = [shade(greens[0], -.35), greens[0], greens[1], greens[2], '#F6E9B0'];
  const lean = (rnd() - .5) * h * .14, cx = x + lean, cy = base - h * .72, cw = h * .34;
  const masses = [];
  for (let i = 0; i < 6 + (h > 150 ? 2 : 0); i++) { const a = -Math.PI / 2 + (rnd() - .5) * 3.6, d = .3 + rnd() * .6; masses.push([cx + Math.cos(a) * cw * d * 1.1, cy + Math.sin(a) * h * .2 * d, cw * (.36 + rnd() * .2)]); }
  masses.push([cx + s * cw * .1, cy - h * .12, cw * .5]);
  masses.sort((p, q) => p[1] - q[1]);
  for (const [mx, my, r] of masses) for (let k = 0; k < 5; k++) dab(mx + (rnd() - .5) * r, my + (rnd() - .4) * r * .6, r * (.5 + rnd() * .3), g[0], 1); // the dark heart of the crown
  // trunk and root flare
  const tw = Math.max(4.5, h * .045), bark = '#3A2C2A', barkLit = '#8E6C50', ty = base - h * .7;
  ctx.fillStyle = bark; ctx.beginPath(); ctx.moveTo(x - tw * 1.9, base + 1); ctx.quadraticCurveTo(x - tw, base - 4, x - tw * .9, base - h * .2);
  ctx.quadraticCurveTo(x - tw * .5 + lean * .3, base - h * .5, cx - tw * .4, ty); ctx.lineTo(cx + tw * .4, ty); ctx.quadraticCurveTo(x + tw * .6 + lean * .3, base - h * .5, x + tw * .9, base - h * .2);
  ctx.quadraticCurveTo(x + tw, base - 4, x + tw * 2, base + 1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = barkLit; ctx.lineWidth = 1.4; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(x + s * tw * .8, base - 2); ctx.quadraticCurveTo(x + s * tw * .55 + lean * .3, base - h * .5, cx + s * tw * .3, ty + 4); ctx.stroke();
  ctx.strokeStyle = '#1E1618'; ctx.lineWidth = .7; ctx.beginPath(); for (let k = 0; k < 5; k++) { const yy = base - 6 - k * h * .1; ctx.moveTo(x - tw * .3 + lean * k * .05, yy); ctx.lineTo(x - tw * .1 + lean * k * .05, yy - 8); } ctx.stroke(); ctx.globalAlpha = 1; // bark furrows
  ctx.lineCap = 'round';
  for (let b = 0; b < 4; b++) { // branches reaching into the crown
    const k = .45 + b * .09, bx = lerp(x, cx, k), by = base - h * k, d = b % 2 ? 1 : -1, ex = bx + d * cw * (.5 + rnd() * .4), ey = by - h * (.12 + rnd() * .1);
    ctx.strokeStyle = bark; ctx.lineWidth = tw * .55; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(lerp(bx, ex, .5), by - 2, ex, ey); ctx.stroke();
    ctx.lineWidth = tw * .25; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + d * 6, ey - 8); ctx.stroke();
    if (d === s) { ctx.strokeStyle = barkLit; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(bx, by - tw * .2); ctx.quadraticCurveTo(lerp(bx, ex, .5), by - 2 - tw * .2, ex, ey - tw * .2); ctx.stroke(); }
  }
  for (const [mx, my, r] of masses) awLeaves(mx, my, r, rnd, g.slice(1), .9);
  if (glow) for (let i = 0; i < 9; i++) { const m = masses[Math.floor(rnd() * masses.length)]; awGlow(glow, 6, () => dab(m[0] + (rnd() - .5) * m[2] * 1.4, m[1] + (rnd() - .5) * m[2], 1.8 + rnd(), glow, .95)); }
}
function awBush(x, base, w, h, rnd, g) {
  const n = Math.max(2, Math.round(w / 14));
  for (let i = 0; i < n; i++) { const k = (i + .5) / n; awLeaves(x - w / 2 + k * w, base - h * (.45 + Math.sin(k * Math.PI) * .35), h * (.5 + rnd() * .2), rnd, g, .55); }
}
function awFern(x, base, len, col, lit) {
  ctx.lineCap = 'round';
  for (let f = 0; f < 5; f++) {
    const a = -Math.PI / 2 + (f - 2) * .42, ex = x + Math.cos(a) * len, ey = base + Math.sin(a) * len * .8, mx = x + Math.cos(a) * len * .5, my = base + Math.sin(a) * len * .5 - 4;
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
    for (let t = .2; t < 1; t += .14) { const px = lerp(lerp(x, mx, t), lerp(mx, ex, t), t), py = lerp(lerp(base, my, t), lerp(my, ey, t), t), l = (1 - t) * 4 + 1.2;
      ctx.strokeStyle = (f - 2) * AW_SUN > 0 ? lit : col; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - l, py - l * .6); ctx.moveTo(px, py); ctx.lineTo(px + l, py - l * .6); ctx.stroke(); }
  }
}

// ---------- stonework ----------
function awBlock(x, y, w, h, st, rnd) { // one dressed stone: its own tone, a lit top and sun-side edge, a dark seat, a chip or two
  const tone = rnd(); ctx.fillStyle = tone < .3 ? awMix(st.base, st.dark, .25) : tone > .8 ? awMix(st.base, st.lit, .2) : st.base;
  ctx.fillRect(x + .4, y + .4, w - .8, h - .8);
  ctx.fillStyle = st.lit; ctx.globalAlpha = .55; ctx.fillRect(x + .6, y + .5, w - 1.2, 1.1); ctx.fillRect(AW_SUN > 0 ? x + w - 1.6 : x + .5, y + .6, 1.1, h - 1.2);
  ctx.fillStyle = st.dark; ctx.globalAlpha = .6; ctx.fillRect(x + .5, y + h - 1.6, w - 1, 1.2);
  if (rnd() < .3) { ctx.fillStyle = st.mortar; ctx.globalAlpha = .7; ctx.beginPath(); const cx = x + rnd() * w; ctx.moveTo(cx, y + .5); ctx.lineTo(cx + 2.2, y + .5); ctx.lineTo(cx + 1, y + 2.4); ctx.fill(); }
  if (rnd() < .2) { ctx.strokeStyle = st.mortar; ctx.globalAlpha = .5; ctx.lineWidth = .5; ctx.beginPath(); const cx = x + w * (.3 + rnd() * .4); ctx.moveTo(cx, y + 1); ctx.lineTo(cx + 1.5, y + h * .5); ctx.lineTo(cx + .5, y + h - 1); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
// an old stone arch overgrown with ivy: coursed piers with imposts, a ring of wedge-shaped voussoirs and a keystone;
// some have lost part of a pier and the stones above it, which lie in the grass
function awArch(cx, base, rnd, o) {
  const st = { base: '#948AA0', lit: '#F0CCA8', dark: '#5A506A', mortar: '#3A3046' }, ivy = ['#1E3A2C', '#2F5446', '#4A7A52', '#9AB86A', '#E0D890'];
  const pw = 15, ri = 23 + rnd() * 4, ring = 12, ro = ri + ring, ph = 58 + rnd() * 16, sy = base - ph, br = o.broken || 0, N = 11;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - ri - pw : cx + ri, top = br === side ? sy + 16 + rnd() * 12 : sy - 6;
    ctx.fillStyle = st.mortar; ctx.fillRect(x0, top, pw, base - top);
    let y = base, row = 0;
    while (y > top + 1) {
      const hh = Math.min(6.5 + rnd() * 2.5, y - top);
      const xs = row % 2 ? [x0, x0 + pw * (.35 + rnd() * .3), x0 + pw] : [x0, x0 + pw];
      for (let k = 0; k < xs.length - 1; k++) awBlock(xs[k], y - hh, xs[k + 1] - xs[k], hh, st, rnd);
      y -= hh; row++;
    }
    if (br === side) { ctx.fillStyle = st.dark; awFillPts([x0, top + 1, x0 + 4, top - 4, x0 + 8, top + 1, x0 + 12, top - 2, x0 + pw, top + 1, x0 + pw, top + 3, x0, top + 3], st.base); } // broken top
    else { ctx.fillStyle = st.dark; ctx.fillRect(x0 - 2.5, sy - 6, pw + 5, 4.5); ctx.fillStyle = st.lit; ctx.globalAlpha = .7; ctx.fillRect(x0 - 2.5, sy - 6, pw + 5, 1.3); ctx.globalAlpha = 1; } // impost
    const lg = ctx.createLinearGradient(x0, 0, x0 + pw, 0); // light across the pier
    lg.addColorStop(0, AW_SUN > 0 ? 'rgba(40,24,70,.35)' : 'rgba(255,220,170,.18)'); lg.addColorStop(1, AW_SUN > 0 ? 'rgba(255,220,170,.18)' : 'rgba(40,24,70,.35)');
    ctx.fillStyle = lg; ctx.fillRect(x0, top, pw, base - top);
    ctx.fillStyle = 'rgba(30,20,50,.3)'; ctx.fillRect(x0, base - 8, pw, 8); // damp at the foot
  }
  const yc = sy - 6, mid = (N - 1) / 2, gone = (k) => (br > 0 && k >= N - 4) || (br < 0 && k <= 3);
  for (let k = 0; k < N; k++) {
    if (gone(k)) continue;
    const a0 = Math.PI + k * Math.PI / N, a1 = a0 + Math.PI / N, am = (a0 + a1) / 2, key = k === mid ? 3.5 : 0;
    const lit = Math.max(0, AW_SUN * Math.cos(am) * .55 - Math.sin(am) * .45);
    ctx.beginPath(); ctx.arc(cx, yc, ro + key, a0, a1); ctx.arc(cx, yc, ri, a1, a0, true); ctx.closePath();
    ctx.fillStyle = awMix(awMix(st.base, st.dark, rnd() * .25), st.lit, lit * .7); ctx.fill();
    ctx.strokeStyle = st.mortar; ctx.lineWidth = .9; ctx.stroke();
    if (key) { ctx.fillStyle = st.lit; ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(cx, yc, ro + key, a0, a1); ctx.arc(cx, yc, ro + key - 2, a1, a0, true); ctx.fill(); ctx.globalAlpha = 1; }
  }
  ctx.strokeStyle = 'rgba(30,18,40,.45)'; ctx.lineWidth = 2.4; ctx.beginPath(); // the soffit falls into shadow
  const aS = Math.PI + (br < 0 ? 4 : 0) * Math.PI / N, aE = 2 * Math.PI - (br > 0 ? 4 : 0) * Math.PI / N; ctx.arc(cx, yc, ri + 1.2, aS, aE); ctx.stroke();
  for (let i = 0; i < 3 + (br ? 3 : 0); i++) { // stones lying in the grass
    const fx = cx + (br || (rnd() < .5 ? -1 : 1)) * (ri + pw + 6 + rnd() * 22), w = 7 + rnd() * 7, h = 4 + rnd() * 3;
    ctx.save(); ctx.translate(fx, base - h * .4); ctx.rotate((rnd() - .5) * .5); awBlock(-w / 2, -h / 2, w, h, st, rnd); ctx.restore();
  }
  // ivy: a mat over the crown, strands hanging from the ring, a climb up one pier, a few flowers
  for (let k = 0; k < N; k++) { if (gone(k) || rnd() < .35) continue; const a = Math.PI + (k + .5) * Math.PI / N; awLeaves(cx + Math.cos(a) * (ro - 2), yc + Math.sin(a) * (ro - 2) - 1, 5 + rnd() * 4, rnd, ivy.slice(1), .35); }
  for (let i = 0; i < 9; i++) {
    const k = Math.floor(rnd() * N); if (gone(k)) continue;
    const a = Math.PI + (k + .5) * Math.PI / N, sx = cx + Math.cos(a) * (ro - 4), sy0 = yc + Math.sin(a) * (ro - 4), L = 10 + rnd() * 34;
    ctx.strokeStyle = '#2A3A26'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.quadraticCurveTo(sx + 3, sy0 + L * .5, sx + Math.sin(i) * 3, sy0 + L); ctx.stroke();
    for (let t = 0; t < L; t += 2.6) { const px = sx + Math.sin(t * .25 + i) * 2; dab(px, sy0 + t, 1.6 + rnd() * 1.4 * (1 - t / L) + .6, rnd() < .3 ? ivy[3] : rnd() < .5 ? ivy[2] : ivy[1], .95); }
  }
  const cs = br ? -br : (rnd() < .5 ? -1 : 1), px0 = cs < 0 ? cx - ri - pw : cx + ri;
  for (let i = 0; i < 26; i++) { const t = rnd(); dab(px0 + rnd() * pw * (1 - t * .6) + (cs < 0 ? 0 : pw * t * .6), base - 2 - t * ph * .75, 1.8 + rnd() * 2.2, rnd() < .3 ? ivy[3] : ivy[1 + Math.floor(rnd() * 2)], .95); }
  for (let i = 0; i < 6; i++) dab(cx + (rnd() - .5) * ro * 2, yc - ro * (.3 + rnd() * .6), 1.1, rnd() < .5 ? '#F2B8C8' : '#FFF2E0', 1);
}
// a hilltop castle in the haze: a crenellated curtain wall, round towers with conical roofs, lit windows and a pennant
function awCastle(x, base, sc, p) {
  ctx.save(); ctx.translate(x, base); ctx.scale(sc, sc);
  ctx.fillStyle = p.wall; ctx.fillRect(-36, -24, 74, 26);
  for (let mx = -36; mx < 38; mx += 6) ctx.fillRect(mx, -28, 3.5, 4.5);
  ctx.fillStyle = p.lit; ctx.globalAlpha = .5; ctx.fillRect(AW_SUN > 0 ? 20 : -36, -24, 18, 26); ctx.globalAlpha = 1;
  for (const [dx, th, tw] of [[-32, 44, 10], [-14, 70, 13], [6, 56, 11], [30, 40, 9]]) {
    ctx.fillStyle = p.wall; ctx.fillRect(dx - tw / 2, -th, tw, th + 2);
    ctx.fillStyle = p.lit; ctx.globalAlpha = .6; ctx.fillRect(AW_SUN > 0 ? dx : dx - tw / 2, -th, tw / 2, th + 2); ctx.globalAlpha = 1;
    ctx.fillStyle = p.roof; awPath([dx - tw / 2 - 2, -th, dx, -th - tw * 1.5, dx + tw / 2 + 2, -th]); ctx.fill();
    ctx.fillStyle = p.roofLit; awPath([dx, -th, dx, -th - tw * 1.5, dx + AW_SUN * (tw / 2 + 2), -th]); ctx.fill();
    ctx.fillStyle = p.win; for (let wy = -th + 8; wy < -10; wy += 13) if (Math.sin(dx * 3 + wy) > -.2) ctx.fillRect(dx - .8, wy, 1.8, 3);
  }
  ctx.strokeStyle = p.wall; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-14, -91); ctx.lineTo(-14, -102); ctx.stroke();
  ctx.fillStyle = p.flag; awPath([-14, -102, -6, -100, -14, -97]); ctx.fill();
  ctx.restore();
}
// a floating island: an inverted crag of banded rock with a lit face, roots hanging below, a grassy top with trees,
// a waterfall pouring off the rim into mist
function awIsland(x, y, w, rnd, p, extra) {
  const seed = Math.floor(rnd() * 1e9), d = w * (.75 + rnd() * .35);
  awWrap(x, w, (x) => {
    const r = mulberry(seed), L = [], R = [], tip = [x + (r() - .5) * w * .2, y + d];
    for (let k = 0; k <= 7; k++) { const t = k / 7, e = Math.pow(t, .8); L.push([lerp(x - w / 2, tip[0], e) + (r() - .5) * 5 * (1 - t), y + d * t + (r() - .5) * 3]); R.push([lerp(x + w / 2, tip[0], e) + (r() - .5) * 5 * (1 - t), y + d * t + (r() - .5) * 3]); }
    const rock = () => { ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const q of L) ctx.lineTo(q[0], q[1]); for (let k = R.length - 1; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]); ctx.closePath(); };
    for (let i = 0; i < 7; i++) { const k = 1 + Math.floor(r() * 5), q = (r() < .5 ? L : R)[k]; ctx.strokeStyle = p.root; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.quadraticCurveTo(q[0] + (r() - .5) * 8, q[1] + 8, q[0] + (r() - .5) * 6, q[1] + 10 + r() * 16); ctx.stroke(); } // roots
    rock(); ctx.fillStyle = p.rock; ctx.fill();
    ctx.save(); rock(); ctx.clip();
    const S = AW_SUN > 0 ? R : L; ctx.beginPath(); ctx.moveTo(S[0][0], S[0][1] - 2); for (const q of S) ctx.lineTo(q[0], q[1]); // the sunward face
    ctx.lineTo(tip[0] + AW_SUN * 2, tip[1] - d * .3); ctx.lineTo(x + AW_SUN * w * .12, y + d * .3); ctx.lineTo(x + AW_SUN * w * .05, y - 2); ctx.closePath(); ctx.fillStyle = p.lit; ctx.globalAlpha = .75; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = p.band; ctx.lineWidth = 1.2; for (let b = 0; b < 4; b++) { const by = y + 6 + b * d * .17 + r() * 4; ctx.beginPath(); ctx.moveTo(x - w / 2, by); for (let bx = x - w / 2; bx <= x + w / 2; bx += 8) ctx.lineTo(bx, by + Math.sin(bx * .2 + b) * 1.6 + (bx - x) * .05); ctx.stroke(); } // strata
    ctx.fillStyle = 'rgba(30,20,50,.35)'; ctx.fillRect(x - w, y, w * 2, 5); // shade under the turf
    ctx.restore();
    // turf
    ctx.fillStyle = p.grass; ctx.beginPath(); ctx.moveTo(x - w / 2 - 3, y + 3); ctx.quadraticCurveTo(x - w * .25, y - 7, x + w * .05, y - 6); ctx.quadraticCurveTo(x + w * .3, y - 6, x + w / 2 + 3, y + 3); ctx.closePath(); ctx.fill();
    for (let i = 0; i < w / 4; i++) dab(x - w / 2 + r() * w, y + 2 + r() * 2.5, 1.6 + r() * 2, p.grass, 1); // turf hanging over the rim
    for (let i = 0; i < w / 6; i++) dab(x + AW_SUN * r() * w * .45, y - 4 - r() * 2, 1.4 + r() * 1.6, p.grassLit, .9);
    for (let t = 0; t < (extra.trees || 0); t++) { const tx = x + (r() - .5) * w * .7, th = 14 + r() * 14; ctx.strokeStyle = p.root; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, y - 2); ctx.lineTo(tx, y - th * .6); ctx.stroke(); awLeaves(tx, y - th * .75, th * .32, r, [p.tree0, p.tree1, p.tree2, p.grassLit], .4); }
    if (extra.tower) { // a little ruined watchtower
      const tx = x - AW_SUN * w * .18, tw = 7, th = 22;
      ctx.fillStyle = p.stone; ctx.fillRect(tx - tw / 2, y - 3 - th, tw, th); ctx.fillStyle = p.lit; ctx.globalAlpha = .7; ctx.fillRect(AW_SUN > 0 ? tx : tx - tw / 2, y - 3 - th, tw / 2, th); ctx.globalAlpha = 1;
      ctx.fillStyle = p.roof; awPath([tx - tw / 2 - 1.5, y - 3 - th, tx + 1, y - 3 - th - 12, tx + tw / 2 + 1.5, y - 3 - th]); ctx.fill();
      ctx.fillStyle = '#FFE2A8'; ctx.fillRect(tx - .7, y - th + 4, 1.6, 2.8);
    }
    if (extra.fall) { // a waterfall off the rim, fading into spray
      const fx = x + AW_SUN * w * (.15 + r() * .2), len = 70 + r() * 70;
      const wg = ctx.createLinearGradient(0, y, 0, y + len); wg.addColorStop(0, 'rgba(236,240,255,.85)'); wg.addColorStop(.6, 'rgba(236,240,255,.35)'); wg.addColorStop(1, 'rgba(236,240,255,0)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(fx - 1.6, y + 1); ctx.lineTo(fx + 1.8, y + 1); ctx.lineTo(fx + 3.4, y + len); ctx.lineTo(fx - 3, y + len); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(fx, y + 2); ctx.lineTo(fx + .6, y + len * .6); ctx.stroke();
      softDab(fx, y + len * .8, 14, '240,236,255', .25);
    }
  });
}

// ---------- the skyport ----------
// a bank of cumulus below the port, the tops of the puffs catching the low sun
function awCloudBank(y, rnd, p, step = 34, rMin = 14, rMax = 30) {
  const puffs = []; for (let x = 0; x < AW_W; x += step * (.6 + rnd() * .7)) puffs.push([x, y + (rnd() - .5) * 14, rMin + rnd() * (rMax - rMin)]);
  for (const layer of [0, 1, 2]) for (const [px, py, r] of puffs) awWrap(px, r * 1.4, (px) => {
    if (layer === 0) { ctx.fillStyle = p.shadow; circle(px, py + r * .25, r); ctx.fill(); ctx.fillRect(px - r, py + r * .25, r * 2, FLOOR_TOP); }
    else if (layer === 1) { ctx.fillStyle = p.body; circle(px - AW_SUN * r * .08, py - r * .02, r * .86); ctx.fill(); }
    else { ctx.fillStyle = p.lit; ctx.globalAlpha = .85; circle(px - AW_SUN * r * .26, py - r * .28, r * .55); ctx.fill(); ctx.globalAlpha = .9; ctx.fillStyle = p.rim; ctx.beginPath(); ctx.arc(px - AW_SUN * r * .08, py - r * .02, r * .86, AW_SUN > 0 ? -Math.PI * .75 : Math.PI * 1.1, AW_SUN > 0 ? -Math.PI * .1 : Math.PI * 1.75); ctx.lineWidth = 1.6; ctx.strokeStyle = p.rim; ctx.stroke(); ctx.globalAlpha = 1; }
  });
}
// a far tower of the port: banded stonework, arched windows (some lit), a balcony, and a dome, spire or clock
function awTower(x, base, w, h, rnd, p, kind) {
  const seed = Math.floor(rnd() * 1e9);
  awWrap(x, w * 2, (x) => {
    const r = mulberry(seed), top = base - h, tw = w * .86, sx = AW_SUN;
    ctx.fillStyle = p.wall; awPath([x - w / 2, base, x - tw / 2, top, x + tw / 2, top, x + w / 2, base]); ctx.fill();
    ctx.fillStyle = p.lit; ctx.globalAlpha = .55; awPath(sx < 0 ? [x - w / 2, base, x - tw / 2, top, x - tw * .15, top, x - w * .15, base] : [x + w * .15, base, x + tw * .15, top, x + tw / 2, top, x + w / 2, base]); ctx.fill();
    ctx.fillStyle = p.dark; ctx.globalAlpha = .35; awPath(sx < 0 ? [x + w * .3, base, x + tw * .3, top, x + tw / 2, top, x + w / 2, base] : [x - w / 2, base, x - tw / 2, top, x - tw * .3, top, x - w * .3, base]); ctx.fill(); ctx.globalAlpha = 1;
    for (let y = top + 14 + r() * 8; y < base - 6; y += 18 + r() * 10) { // cornices, each with a lit lip, and a row of windows above
      const ww = lerp(w, tw, (base - y) / h) + 3; ctx.fillStyle = p.dark; ctx.fillRect(x - ww / 2, y, ww, 2.4); ctx.fillStyle = p.lit; ctx.fillRect(x - ww / 2, y - .6, ww, .9);
      const nw = w > 26 ? 3 : w > 16 ? 2 : 1;
      for (let i = 0; i < nw; i++) { const wx = x + (i - (nw - 1) / 2) * (w / (nw + .6)), wy = y - 10, on = r() < .45;
        ctx.fillStyle = on ? p.win : p.winDark; ctx.beginPath(); ctx.moveTo(wx - 1.6, wy + 7); ctx.lineTo(wx - 1.6, wy + 1.5); ctx.arc(wx, wy + 1.5, 1.6, Math.PI, 0); ctx.lineTo(wx + 1.6, wy + 7); ctx.closePath(); ctx.fill();
        if (on && p.glow) awGlow(p.glow, 6, () => { ctx.fillStyle = p.win; ctx.fillRect(wx - .6, wy + 2, 1.2, 4); }); }
    }
    if (r() < .5) { const by = top + h * (.25 + r() * .3), bw = lerp(w, tw, (base - by) / h) + 8; ctx.fillStyle = p.dark; ctx.fillRect(x - bw / 2, by, bw, 2); ctx.strokeStyle = p.dark; ctx.lineWidth = .5; ctx.beginPath(); for (let bx = x - bw / 2; bx <= x + bw / 2; bx += 2) { ctx.moveTo(bx, by); ctx.lineTo(bx, by - 3.2); } ctx.moveTo(x - bw / 2, by - 3.2); ctx.lineTo(x + bw / 2, by - 3.2); ctx.stroke(); } // balcony
    const k = kind || ['dome', 'spire', 'onion', 'dome'][Math.floor(r() * 4)];
    if (k === 'clock') { // a clock face under a dome
      const cy = top - tw * .55, cr = tw * .5;
      ctx.fillStyle = p.wall; ctx.fillRect(x - tw / 2 - 1, cy - cr - 2, tw + 2, cr * 2 + 4);
      ctx.fillStyle = p.roof; ctx.beginPath(); ctx.ellipse(x, cy - cr - 2, tw / 2 + 2, tw * .5, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = p.roofLit; ctx.beginPath(); ctx.ellipse(x, cy - cr - 2, tw / 2 + 2, tw * .5, 0, sx < 0 ? Math.PI : Math.PI * 1.5, sx < 0 ? Math.PI * 1.5 : 0); ctx.lineTo(x, cy - cr - 2); ctx.fill();
      ctx.strokeStyle = p.dark; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, cy - cr - 2 - tw * .5); ctx.lineTo(x, cy - cr - 10 - tw * .5); ctx.stroke();
      awGlow(p.glow || p.win, 10, () => { ctx.fillStyle = p.face; circle(x, cy, cr * .82); ctx.fill(); });
      ctx.strokeStyle = p.dark; ctx.lineWidth = 1; circle(x, cy, cr * .82); ctx.stroke();
      ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.moveTo(x + Math.cos(a) * cr * .66, cy + Math.sin(a) * cr * .66); ctx.lineTo(x + Math.cos(a) * cr * .76, cy + Math.sin(a) * cr * .76); } ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + cr * .3, cy - cr * .42); ctx.moveTo(x, cy); ctx.lineTo(x - cr * .55, cy + cr * .1); ctx.stroke();
    } else if (k === 'spire') {
      ctx.fillStyle = p.roof; awPath([x - tw / 2 - 1.5, top, x, top - tw * 2.4, x + tw / 2 + 1.5, top]); ctx.fill();
      ctx.fillStyle = p.roofLit; awPath([x, top, x, top - tw * 2.4, x + sx * (tw / 2 + 1.5), top]); ctx.fill();
    } else if (k === 'onion') {
      const cy = top - tw * .5; ctx.fillStyle = p.roof; ctx.beginPath(); ctx.moveTo(x - tw * .4, top); ctx.bezierCurveTo(x - tw * .9, cy, x - tw * .2, cy - tw * .4, x, cy - tw * .95); ctx.bezierCurveTo(x + tw * .2, cy - tw * .4, x + tw * .9, cy, x + tw * .4, top); ctx.fill();
      ctx.fillStyle = p.roofLit; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + sx * tw * .4, top); ctx.bezierCurveTo(x + sx * tw * .9, cy, x + sx * tw * .2, cy - tw * .4, x, cy - tw * .95); ctx.fill();
    } else {
      ctx.fillStyle = p.roof; ctx.beginPath(); ctx.ellipse(x, top, tw / 2 + 1, tw * .55, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = p.roofLit; ctx.beginPath(); ctx.ellipse(x, top, tw / 2 + 1, tw * .55, 0, sx < 0 ? Math.PI : Math.PI * 1.5, sx < 0 ? Math.PI * 1.5 : 0); ctx.lineTo(x, top); ctx.fill();
      ctx.strokeStyle = p.dark; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, top - tw * .55); ctx.lineTo(x, top - tw * .55 - 9); ctx.stroke();
      if (r() < .6) { ctx.fillStyle = p.flag; awPath([x, top - tw * .55 - 9, x - sx * 7, top - tw * .55 - 7.5, x, top - tw * .55 - 6]); ctx.fill(); }
    }
  });
}
// an airship: a ribbed, seamed envelope lit from the sun side, tail fins, a rigged gondola with lit windows,
// a propeller blur and a lantern at the bow
function awAirship(x, y, s, dir, p) {
  awWrap(x, 70 * s, (x) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const ls = AW_SUN * dir; // the sun's side in the ship's own frame
    const env = () => { ctx.beginPath(); ctx.moveTo(52, 0); ctx.bezierCurveTo(52, -17, 22, -20, -10, -18); ctx.bezierCurveTo(-34, -16, -48, -8, -56, 0); ctx.bezierCurveTo(-48, 8, -34, 16, -10, 18); ctx.bezierCurveTo(22, 20, 52, 17, 52, 0); ctx.closePath(); };
    for (const fy of [-1, 1]) { ctx.fillStyle = p.fin; awPath([-34, fy * 10, -58, fy * 24, -62, fy * 22, -54, fy * 2]); ctx.fill(); } // fins
    ctx.strokeStyle = p.rig; ctx.lineWidth = .6; ctx.beginPath(); for (const [ax, gx] of [[-26, -18], [-8, -8], [10, 6], [28, 16]]) { ctx.moveTo(ax, 16); ctx.lineTo(gx, 25); } ctx.moveTo(-26, 16); ctx.lineTo(16, 25); ctx.moveTo(28, 16); ctx.lineTo(-18, 25); ctx.stroke(); // rigging
    env(); const eg = ctx.createLinearGradient(0, -20, 0, 20); eg.addColorStop(0, p.envTop); eg.addColorStop(.55, p.env); eg.addColorStop(1, p.envBot); ctx.fillStyle = eg; ctx.fill();
    ctx.save(); env(); ctx.clip();
    ctx.fillStyle = p.envLit; ctx.globalAlpha = .7; ell(ls * 20, -9, 30, 8, 0); ctx.fill(); ctx.globalAlpha = 1; // the light on its back
    ctx.strokeStyle = p.seam; ctx.lineWidth = .7; ctx.beginPath(); for (const gy of [-9, 0, 9]) { ctx.moveTo(54, gy * .4); ctx.bezierCurveTo(20, gy * 1.3, -30, gy * 1.2, -58, gy * .2); } ctx.stroke(); // gores
    ctx.beginPath(); for (const rx of [-40, -24, -8, 8, 24, 38]) { ctx.moveTo(rx, -20); ctx.quadraticCurveTo(rx + 3.5, 0, rx, 20); } ctx.stroke(); // frame rings
    ctx.restore();
    ctx.fillStyle = p.fin; awPath([-40, -1.5, -62, -1, -62, 1, -40, 1.5]); ctx.fill();
    // gondola
    ctx.fillStyle = p.hull; ctx.beginPath(); ctx.moveTo(-24, 24); ctx.lineTo(22, 24); ctx.quadraticCurveTo(26, 25, 24, 30); ctx.quadraticCurveTo(0, 36, -20, 31); ctx.quadraticCurveTo(-26, 29, -24, 24); ctx.fill();
    ctx.fillStyle = p.trim; ctx.fillRect(-24, 23.4, 46, 1.3);
    for (let wx = -16; wx < 18; wx += 6) awGlow(p.glow, 5, () => { ctx.fillStyle = p.win; ctx.fillRect(wx, 26, 2.6, 2.2); });
    ctx.fillStyle = p.hull; ctx.fillRect(-27, 26, 3, 2); ctx.globalAlpha = .45; ctx.fillStyle = p.prop; ell(-28, 27, 1.6, 7); ctx.fill(); ctx.globalAlpha = 1; // propeller
    awGlow(p.glow, 10, () => { ctx.fillStyle = p.win; circle(25, 27.5, 1.6); ctx.fill(); }); // lantern
    ctx.restore();
  });
}
// a great gear: trapezoid teeth, a rim with rivets, tapered spokes, a teal-patinated hub with a ring of bolts
function awGear(x, y, r, n, rot, p) {
  const t = r * .17, ri = r * .66;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  for (let k = 0; k < n; k++) { const a = rot + k / n * TAU, da = TAU / n;
    const P = (aa, rr) => [Math.cos(aa) * rr, Math.sin(aa) * rr];
    const q = [P(a, r), P(a + da * .12, r + t), P(a + da * .4, r + t), P(a + da * .52, r)];
    if (k === 0) ctx.moveTo(q[0][0], q[0][1]); else ctx.lineTo(q[0][0], q[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.arc(0, 0, r, a + da * .52, a + da);
  }
  ctx.closePath(); ctx.moveTo(ri, 0); ctx.arc(0, 0, ri, 0, TAU, true);
  const lg = ctx.createLinearGradient(-r * AW_SUN, -r, r * AW_SUN, r); lg.addColorStop(0, p.lit); lg.addColorStop(.45, p.base); lg.addColorStop(1, p.dark);
  ctx.fillStyle = lg; ctx.fill('evenodd');
  const ns = r > 26 ? 6 : 5;
  for (let k = 0; k < ns; k++) { const a = rot * 1.3 + k / ns * TAU, c = Math.cos(a), s = Math.sin(a), w0 = r * .11, w1 = r * .07;
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(-s * w0, c * w0); ctx.lineTo(c * (ri + 1) - s * w1, s * (ri + 1) + c * w1); ctx.lineTo(c * (ri + 1) + s * w1, s * (ri + 1) - c * w1); ctx.lineTo(s * w0, -c * w0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = p.dark; ctx.lineWidth = .6; ctx.stroke(); }
  ctx.strokeStyle = p.dark; ctx.lineWidth = 1; circle(0, 0, ri + .5); ctx.stroke(); circle(0, 0, r * .86); ctx.globalAlpha = .6; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.strokeStyle = p.edge; ctx.lineWidth = 1.4; ctx.beginPath(); const la = AW_SUN > 0 ? -Math.PI * .45 : -Math.PI * .95; ctx.arc(0, 0, r - .8, la - .7, la + .7); ctx.stroke(); // a glint along the rim
  ctx.fillStyle = p.dark; for (let k = 0; k < n; k++) { const a = rot + (k + .3) / n * TAU; circle(Math.cos(a) * r * .76, Math.sin(a) * r * .76, Math.max(.7, r * .028)); ctx.fill(); }
  ctx.fillStyle = p.edge; for (let k = 0; k < n; k++) { const a = rot + (k + .3) / n * TAU; circle(Math.cos(a) * r * .76 - .3 * AW_SUN * -1, Math.sin(a) * r * .76 - .3, Math.max(.35, r * .013)); ctx.fill(); }
  ctx.fillStyle = p.hub; circle(0, 0, r * .25); ctx.fill(); ctx.strokeStyle = p.dark; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = p.hubLit; ctx.beginPath(); ctx.arc(0, 0, r * .25, AW_SUN > 0 ? -Math.PI * .8 : Math.PI * .7, AW_SUN > 0 ? Math.PI * .2 : Math.PI * 1.7); ctx.closePath(); ctx.globalAlpha = .6; ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = p.dark; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rot; circle(Math.cos(a) * r * .17, Math.sin(a) * r * .17, Math.max(.6, r * .025)); ctx.fill(); }
  circle(0, 0, r * .07); ctx.fill();
  ctx.restore();
}
// an iron column: plinth, riveted shaft with bands, a flared capital; lit on the sun side
function awPillar(x, top, base, w, p) {
  const lg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); const L = AW_SUN < 0;
  lg.addColorStop(0, L ? p.lit : p.dark); lg.addColorStop(.35, p.base); lg.addColorStop(1, L ? p.dark : p.lit);
  ctx.fillStyle = lg; ctx.fillRect(x - w / 2, top, w, base - top);
  ctx.fillStyle = p.dark; ctx.fillRect(x - w / 2 - 4, base - 10, w + 8, 10); ctx.fillRect(x - w / 2 - 2, base - 14, w + 4, 4); // plinth
  ctx.fillStyle = p.lit; ctx.globalAlpha = .6; ctx.fillRect(x - w / 2 - 4, base - 10, w + 8, 1.2); ctx.fillRect(x - w / 2 - 2, base - 14, w + 4, 1); ctx.globalAlpha = 1;
  ctx.fillStyle = p.dark; awPath([x - w / 2, top + 7, x - w / 2 - 4, top, x + w / 2 + 4, top, x + w / 2, top + 7]); ctx.fill(); // capital
  for (let y = top + 22; y < base - 18; y += 26) { ctx.fillStyle = p.dark; ctx.fillRect(x - w / 2 - 1, y, w + 2, 3); ctx.fillStyle = p.lit; ctx.globalAlpha = .5; ctx.fillRect(x - w / 2 - 1, y, w + 2, .8); ctx.globalAlpha = 1; }
  for (let y = top + 10; y < base - 16; y += 5) for (const dx of [-w / 2 + 2, w / 2 - 2]) { ctx.fillStyle = p.dark; circle(dx + x, y, .8); ctx.fill(); ctx.fillStyle = p.lit; circle(dx + x - .25, y - .25, .35); ctx.fill(); }
}
// a riveted lattice girder running the full width (it tiles by construction)
function awTruss(y, h, p) {
  ctx.fillStyle = p.dark; ctx.fillRect(0, y, AW_W, 3); ctx.fillRect(0, y + h - 3, AW_W, 3);
  ctx.fillStyle = p.lit; ctx.globalAlpha = .55; ctx.fillRect(0, y, AW_W, .9); ctx.fillRect(0, y + h - 3, AW_W, .9); ctx.globalAlpha = 1;
  ctx.strokeStyle = p.dark; ctx.lineWidth = 1.8; ctx.beginPath(); for (let x = 0; x < AW_W; x += h) { ctx.moveTo(x, y + 2); ctx.lineTo(x + h / 2, y + h - 2); ctx.lineTo(x + h, y + 2); } ctx.stroke();
  ctx.fillStyle = p.lit; for (let x = 0; x < AW_W; x += h / 2) { circle(x, y + 1.5, .6); ctx.fill(); }
}

// ---------- the prism rim ----------
// a hexagonal crystal: three visible faces (shadow, body, lit), a faceted cap, a glowing core and bright edges
function awCrystal(x, base, len, w, ang, hue, sat = 55, lum = 52) {
  ctx.save(); ctx.translate(x, base); ctx.rotate(ang);
  const top = -len, cap = top - w * .9, xL = -w / 2, xA = -w * .12, xB = w * .26, xR = w / 2, ax = w * .06;
  const face = (x0, x1, l0, l1) => { const g = ctx.createLinearGradient(0, 0, 0, top); g.addColorStop(0, `hsl(${hue},${sat}%,${l0 * .45}%)`); g.addColorStop(1, `hsl(${hue},${sat}%,${l1}%)`); ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, len + 2); };
  face(xL, xA, lum * .5, lum * .62); face(xA, xB, lum * .8, lum); face(xB, xR, lum, Math.min(92, lum * 1.45));
  const capF = (pts, l) => { awPath(pts); ctx.fillStyle = `hsl(${hue},${sat}%,${l}%)`; ctx.fill(); };
  capF([xL, top, xA, top, ax, cap], lum * .7); capF([xA, top, xB, top, ax, cap], lum * 1.15); capF([xB, top, xR, top, ax, cap], Math.min(95, lum * 1.6));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cg = ctx.createLinearGradient(0, 0, 0, cap); cg.addColorStop(0, `hsla(${hue},80%,70%,0)`); cg.addColorStop(.7, `hsla(${hue},80%,72%,.35)`); cg.addColorStop(1, `hsla(${hue},90%,85%,.6)`);
  ctx.fillStyle = cg; ctx.fillRect(xA + 1, cap, xB - xA - 2, -cap); // the glowing core
  ctx.strokeStyle = `hsla(${hue},90%,88%,.75)`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(xB, 0); ctx.lineTo(xB, top); ctx.lineTo(ax, cap); ctx.moveTo(xA, top * .3); ctx.lineTo(xA, top); ctx.lineTo(ax, cap); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(xB + (xR - xB) * .4, top * .2); ctx.lineTo(xB + (xR - xB) * .5, top * .85); ctx.moveTo(xA + 2, top * .55); ctx.lineTo(xB - 2, top * .7); ctx.stroke(); // a streak of light and a fracture
  ctx.restore();
  ctx.restore();
}
function awCluster(x, base, size, hue, rnd, lum = 50) {
  const n = 3 + Math.floor(rnd() * 4), list = [];
  for (let i = 0; i < n; i++) { const c = i === 0; list.push([x + (c ? 0 : (rnd() - .5) * size * .9), c ? size : size * (.35 + rnd() * .5), c ? size * .22 : size * (.1 + rnd() * .1), c ? (rnd() - .5) * .2 : (rnd() - .5) * 1.1, hue + (rnd() - .5) * 30]); }
  list.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3])); // the leaning ones behind the upright
  for (const [cx, l, w, a, h] of list) awCrystal(cx, base + 3, l, w, a, h, 55, lum * (.85 + rnd() * .3));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; awSoft(x, base, size * .7, size * .25, '200,150,255', .22); ctx.restore();
}
// a monolith of black glass carved with glowing glyphs, cracked across the top
function awMonolith(x, base, w, h, rnd, glyph) {
  const top = base - h, tilt = (rnd() - .5) * 6;
  const pts = [x - w / 2, base, x - w * .42 + tilt, top + 8, x - w * .1 + tilt, top, x + w * .2 + tilt, top + 6, x + w * .44 + tilt, top + 2, x + w / 2, base];
  awFillPts(pts, '#1C1630');
  ctx.save(); awPath(pts); ctx.clip();
  ctx.fillStyle = '#3E3466'; ctx.globalAlpha = .8; awPath([x + w * .18, base, x + w * .26 + tilt, top, x + w + tilt, top, x + w, base]); ctx.fill(); ctx.globalAlpha = 1; // the lit face
  ctx.fillStyle = 'rgba(160,140,230,.5)'; ctx.fillRect(x + w * .18 + tilt * .5, top, 1, h); // edge highlight
  ctx.restore();
  awGlow(glyph, 8, () => {
    ctx.strokeStyle = glyph; ctx.lineWidth = 1; ctx.beginPath();
    for (let gy = top + 16; gy < base - 14; gy += 13) { const gx = x - w * .12 + tilt * (1 - (gy - top) / h); const t = Math.floor(rnd() * 4);
      if (t === 0) { ctx.moveTo(gx - 3, gy); ctx.lineTo(gx + 3, gy); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx, gy + 4); }
      else if (t === 1) { ctx.moveTo(gx + 3.4, gy); ctx.arc(gx, gy, 3.4, 0, TAU); }
      else if (t === 2) { ctx.moveTo(gx - 3, gy + 3); ctx.lineTo(gx, gy - 4); ctx.lineTo(gx + 3, gy + 3); }
      else { ctx.moveTo(gx - 3, gy - 3); ctx.lineTo(gx + 3, gy + 3); ctx.moveTo(gx + 3, gy - 3); ctx.lineTo(gx - 3, gy + 3); } }
    ctx.stroke();
  });
}

// place something that uses its own random stream, drawn again across the seam with the same numbers
function awWR(x, w, rnd, fn) { const s = Math.floor(rnd() * 1e9); awWrap(x, w, (x) => fn(x, mulberry(s))); }

// ---------- the three worlds ----------
function awBloomFar(rnd, th, f) {
  AW_SUN = 1;
  awRange(rnd, { n: 6, base: 178, hMin: 42, hMax: 96, col: '#9A90BC', lit: '#F2C2A8', litA: .55, snow: 112, snowLit: '#FFF2E2', snowShade: '#CCC2E4', gully: 'rgba(80,60,120,.22)', shade: 'rgba(150,120,170,.35)', jag: 7 });
  hazeBand(f, th.haze, 110, FLOOR_TOP, .5);
  const ip = { rock: '#7E7298', lit: '#DCA8A0', band: 'rgba(60,40,80,.3)', root: '#4A3E58', grass: '#729C82', grassLit: '#E0DCA0', tree0: '#4E7A6A', tree1: '#6E9A80', tree2: '#B8C890', stone: '#A096B0', roof: '#6A4E6A' };
  for (let i = 0; i < 5; i++) awIsland(110 + i * 256 + rnd() * 50, 96 + rnd() * 44, 50 + rnd() * 44, rnd, ip, { trees: 1 + Math.floor(rnd() * 3), tower: i === 1 || i === 4, fall: i % 2 === 0 });
  for (let i = 0; i < 7; i++) { const x = rnd() * AW_W, y = 80 + rnd() * 80, s = 3 + rnd() * 5; awWrap(x, 10, (x) => { awFillPts([x - s, y, x + s, y, x + s * .2, y + s * 1.6], '#7E7298'); awFillPts([x + s * .1, y, x + s, y, x + s * .2, y + s * 1.6], '#DCA8A0', .7); ctx.fillStyle = '#729C82'; ctx.fillRect(x - s, y - 1.2, s * 2, 1.6); }); } // little drifting rocks
  const hy = awHills(194, [[3, 8], [7, 4], [13, 2]], 41, '#8090A4', '#ECC6A6', .45);
  for (let x = 0; x < AW_W; x += 3.2) if (Math.sin(x * .021) + Math.sin(x * .047) > -.4) dab(x, hy(x) - 1.5 - rnd() * 2, 2.4 + rnd() * 2.2, rnd() < .35 ? '#9AA4B4' : '#72829A', .95); // a tree line along the crest
  const cx = 860 + rnd() * 80; awWrap(cx, 40, (x) => awCastle(x, hy(cx) + 2, .62, { wall: '#7E86A2', lit: '#E8C8B4', roof: '#6A6492', roofLit: '#C8A0AE', win: '#FFE2A8', flag: '#C8607A' }));
  hazeBand(f, th.haze, 168, FLOOR_TOP, .5);
}
function awBloomMid(rnd) {
  AW_SUN = 1;
  awHills(206, [[2, 9], [5, 5], [11, 2]], 77, '#4E6656', '#A8B070', .5);
  for (let i = 0; i < 6; i++) awWR(i * 213 + 100 + rnd() * 60, 70, rnd, (x, r) => paintTree(x, FLOOR_TOP - 14, 84 + r() * 30, r, ['#3E5E58', '#56786A', '#A8B888'], null)); // a far row of trees
  for (let i = 0; i < 3; i++) { const ax = 214 + i * 427 + rnd() * 40; awWR(ax, 70, rnd, (x, r) => awArch(x, FLOOR_TOP, r, { broken: [0, 1, -1][i] })); }
  for (const tx of [20, 420, 860, 1150]) awWR(tx + rnd() * 50, 100, rnd, (x, r) => paintTree(x, FLOOR_TOP + 2, 135 + r() * 55, r, ['#2F5446', '#3D6A52', '#C9C57E'], r() < .6 ? '#F6CDB0' : null));
  const g = ['#1E3A2C', '#2F5446', '#4A7A52', '#B8C878'];
  for (let x = 0; x < AW_W; x += 46) awWR(x + rnd() * 20, 30, rnd, (x, r) => { awBush(x, FLOOR_TOP + 3, 26 + r() * 30, 10 + r() * 10, r, g); if (r() < .5) awFern(x + 18, FLOOR_TOP + 2, 12 + r() * 6, '#2F5446', '#8AA860'); });
}
function awSkyFar(rnd, th, f) {
  AW_SUN = -1;
  awCloudBank(196, rnd, { shadow: '#9C88A8', body: '#C4A4B0', lit: '#F4CDB0', rim: '#FFE4CC' }, 40, 16, 34);
  hazeBand(f, th.haze, 120, FLOOR_TOP, .3);
  const pa = { wall: '#9088AC', lit: '#E8BCA8', dark: '#6E6890', roof: '#7A90A0', roofLit: '#D8C0B0', win: '#FFE6C0', winDark: '#6A6488', flag: '#C88A9A', glow: null };
  for (let i = 0; i < 9; i++) awTower(i * 142 + rnd() * 60, 205, 12 + rnd() * 10, 70 + rnd() * 70, rnd, pa);
  hazeBand(f, th.haze, 90, FLOOR_TOP, .35);
  const pb = { wall: '#6E6A8E', lit: '#E2A890', dark: '#4A4668', roof: '#4E7A80', roofLit: '#C8B49A', win: '#FFE0A8', winDark: '#3E3A58', flag: '#B8445A', glow: '#FFC98A', face: '#FFF0C8' };
  for (let i = 0; i < 7; i++) awTower(60 + i * 183 + rnd() * 50, FLOOR_TOP, 18 + rnd() * 14, 96 + rnd() * 66, rnd, pb, i === 3 ? 'clock' : null);
  const sp = { fin: '#5A4E70', rig: '#3A3048', envTop: '#B89AB0', env: '#7E6A90', envBot: '#4A3E5E', envLit: '#F4C8A8', seam: 'rgba(40,30,60,.45)', hull: '#4A3A40', trim: '#C9A060', win: '#FFE2B0', glow: '#FFC98A', prop: '#D8C8D8' };
  for (let i = 0; i < 3; i++) awAirship(200 + i * 427 + rnd() * 80, 92 + rnd() * 50, .62 + rnd() * .3, rnd() < .5 ? -1 : 1, sp);
  awAirship(rnd() * AW_W, 70 + rnd() * 20, .3, 1, Object.assign({}, sp, { env: '#9A88A8', envBot: '#7A6A90', envTop: '#C8B0C0', hull: '#7A6A80' }));
  awCloudBank(226, rnd, { shadow: '#B094A8', body: '#D8B0B0', lit: '#F8D6B8', rim: '#FFEAD6' }, 46, 12, 24);
  hazeBand(f, th.haze, 200, FLOOR_TOP, .3);
}
function awSkyMid(rnd) {
  AW_SUN = -1;
  const iron = { base: '#4A4458', lit: '#B8908A', dark: '#2E2A3A' }, brass = { base: '#8A6A3E', lit: '#E8C08A', dark: '#4E3A22', edge: '#FFE0A8', hub: '#4E7A74', hubLit: '#9FD0C0' };
  awTruss(176, 14, iron);
  const cols = [];
  for (let i = 0; i < 6; i++) cols.push([70 + i * 213 + rnd() * 50, FLOOR_TOP - 78 - rnd() * 42, 22 + rnd() * 15]);
  for (let i = 0; i < cols.length; i++) { // pipes from column to column, with flanges, a valve wheel and a breath of steam
    const a = cols[i], b = cols[(i + 1) % cols.length], bx = i === cols.length - 1 ? b[0] + AW_W : b[0], py = FLOOR_TOP - 24 - rnd() * 22;
    for (const ox of [0, -AW_W]) {
      ctx.lineCap = 'butt'; ctx.strokeStyle = iron.dark; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0] + ox, py); ctx.lineTo(bx + ox, py); ctx.stroke();
      ctx.strokeStyle = '#7E6E7E'; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#D8B0A0'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(a[0] + ox, py - 1.4); ctx.lineTo(bx + ox, py - 1.4); ctx.stroke();
      for (let x = a[0] + 30; x < bx - 20; x += 44) { ctx.fillStyle = brass.base; ctx.fillRect(x + ox, py - 4.4, 3, 8.8); ctx.fillStyle = brass.lit; ctx.fillRect(x + ox, py - 4.4, 1, 8.8); }
      const vx = (a[0] + bx) / 2 + ox; ctx.strokeStyle = '#B8445A'; ctx.lineWidth = 1.4; circle(vx, py - 9, 4.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(vx - 4, py - 9); ctx.lineTo(vx + 4, py - 9); ctx.moveTo(vx, py - 13); ctx.lineTo(vx, py - 5); ctx.stroke();
      ctx.fillStyle = iron.dark; ctx.fillRect(vx - 1, py - 5, 2, 3);
    }
  }
  for (const [x, y, r] of cols) awWR(x, r * 1.9, rnd, (x, rr) => {
    awPillar(x, y, FLOOR_TOP, 12, iron);
    for (const s of [-1, 1]) { ctx.strokeStyle = iron.dark; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + s * 6, y + r * .9); ctx.lineTo(x + s * r * .8, FLOOR_TOP - 4); ctx.stroke(); } // splayed struts
    if (rr() < .6) { const r2 = r * (.45 + rr() * .15), a = -.5 - rr() * .6, d = r + r2 + r * .12, gx = x + Math.cos(a) * d * (rr() < .5 ? 1 : -1), gy = y + Math.sin(a) * d;
      ctx.strokeStyle = iron.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(gx, gy); ctx.stroke(); awGear(gx, gy, r2, 10, rr() * TAU, brass); }
    awGear(x, y, r, Math.round(r * .55), rr() * TAU, brass);
  });
  for (let i = 0; i < 6; i++) awWR(cols[i][0] + 100 + rnd() * 20, 12, rnd, (x) => { // street lamps
    ctx.fillStyle = iron.dark; ctx.fillRect(x - 1.2, FLOOR_TOP - 54, 2.4, 54); ctx.fillRect(x - 3.5, FLOOR_TOP - 6, 7, 6);
    ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP - 54); ctx.quadraticCurveTo(x + 2, FLOOR_TOP - 62, x + 8, FLOOR_TOP - 60); ctx.lineWidth = 1.6; ctx.strokeStyle = iron.dark; ctx.stroke();
    awGlow('#FFC98A', 12, () => { ctx.fillStyle = '#FFE6B8'; circle(x + 8, FLOOR_TOP - 56, 3); ctx.fill(); });
    ctx.fillStyle = brass.base; ctx.fillRect(x + 5, FLOOR_TOP - 61, 6, 2);
  });
}
function awPrismFar(rnd, th, f) {
  AW_SUN = 1;
  for (let i = 0; i < 170; i++) { ctx.fillStyle = `rgba(255,245,255,${.25 + rnd() * .65})`; circle(rnd() * AW_W, rnd() * 175, rnd() * 1.1 + .3); ctx.fill(); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const x = rnd() * AW_W, y = rnd() * 160, s = 2.5 + rnd() * 3.5; awWrap(x, 8, (x) => { ctx.fillStyle = 'rgba(255,240,255,.85)'; awPath([x, y - s, x + .6, y - .6, x + s, y, x + .6, y + .6, x, y + s, x - .6, y + .6, x - s, y, x - .6, y - .6]); ctx.fill(); }); }
  for (let i = 0; i < 10; i++) { const x = rnd() * AW_W, y = 50 + rnd() * 100, r = 70 + rnd() * 80; awWrap(x, r, (x) => awSoft(x, y, r, r * .55, ['110,80,190', '170,70,150', '60,110,180'][i % 3], .32)); }
  ctx.restore();
  for (let i = 0; i < 14; i++) { // drifting crystals, glowing from inside
    const x = rnd() * AW_W, y = 60 + rnd() * 110, s = 7 + rnd() * 13, hue = [190, 280, 330, 45][i % 4], a = (rnd() - .5) * .8;
    awWrap(x, s * 2, (x) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, y, s * 2.2, '200,170,255', .25); ctx.restore(); awCrystal(x, y, s, s * .55, a, hue, 50, 58); awCrystal(x, y, s * .55, s * .55, a + Math.PI, hue, 50, 48); });
  }
  awRange(rnd, { n: 9, base: 206, hMin: 34, hMax: 96, col: '#2E2452', lit: '#7A68B8', litA: .5, jag: 10, steps: 3, gully: 'rgba(170,230,255,.18)', shade: 'rgba(120,60,140,.35)' });
  hazeBand(f, th.haze, 150, FLOOR_TOP, .4);
  awRange(rnd, { n: 15, base: 230, hMin: 8, hMax: 44, col: '#241C44', lit: '#5E4E98', litA: .55, jag: 6, steps: 2, vDepth: .3 });
  for (let i = 0; i < 8; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => awCluster(x, 222, 18 + r() * 22, [190, 280, 320, 170][i % 4], r, 40));
  hazeBand(f, th.haze, 200, FLOOR_TOP, .3);
}
function awPrismMid(rnd) {
  AW_SUN = 1;
  awRange(rnd, { n: 11, base: 240, hMin: 4, hMax: 24, col: '#1E1834', lit: '#4A3E78', litA: .6, jag: 5, steps: 2, vDepth: .5 });
  for (let i = 0; i < 3; i++) awWR(150 + i * 427 + rnd() * 60, 30, rnd, (x, r) => awMonolith(x, FLOOR_TOP, 18 + r() * 8, 70 + r() * 40, r, ['#7FF5F0', '#F0A0E0', '#B8A0FF'][i]));
  for (let i = 0; i < 8; i++) { const sz = 50 + rnd() * 75; awWR(i * 160 + rnd() * 90, sz, rnd, (x, r) => awCluster(x, FLOOR_TOP, sz, [190, 280, 320, 170][i % 4], r, 52)); }
  for (let i = 0; i < 14; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => awCluster(x, FLOOR_TOP + 2, 12 + r() * 16, [190, 280, 320, 170][i % 4], r, 46));
}

function buildBackground(themeId, seed) {
  const key = themeId + K + seed; if (key === bgKey) return; bgKey = key;
  const rnd = mulberry(seed), th = THEMES[themeId];
  const [fc, f] = makeLayer(1280, FLOOR_TOP), [mc, m] = makeLayer(1280, FLOOR_TOP);
  const old = ctx;
  const far = { bloom: awBloomFar, sky: awSkyFar, prism: awPrismFar }[themeId] || awBloomFar, mid = { bloom: awBloomMid, sky: awSkyMid, prism: awPrismMid }[themeId] || awBloomMid;
  ctx = f; far(rnd, th, f);
  ctx = m; mid(rnd);
  ctx = old;
  paintLayer(fc, { ink: '#3A2A30', line: .3, lw: .9, brush: .8, hatch: 0, seed: 3 });
  paintLayer(mc, { ink: '#1A100C', line: .85, lw: 1.1, brush: 1, hatch: .2, seed: 7 });
  releaseScratch(); retire(bgFar); retire(bgMid); // give the old world's layers and the working canvases back right away
  bgFar = fc; bgMid = mc;
  awBuildFloor(themeId, th, seed);
  if (!grain) { // canvas-and-brush texture laid over the whole picture
    grain = document.createElement('canvas'); grain.width = grain.height = 256;
    const g = grain.getContext('2d'), r2 = mulberry(7);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const v = Math.floor(100 + r2() * 56); g.fillStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.ellipse(r2() * 256, r2() * 256, 2 + r2() * 9, 1 + r2() * 3, r2() * 3, 0, TAU); g.fill(); }
  }
}

// ---------- the floor: painted once per world into a 1280-wide strip that tiles, then scrolled with the world ----------
function awRow(rnd, min, max) { // piece widths that add up to exactly one tile, so every row repeats seamlessly
  const ws = []; let s = 0; while (s < AW_W - max) { const w = min + rnd() * (max - min); ws.push(w); s += w; }
  ws.push(AW_W - s); const out = []; let x = 0; for (const w of ws) { out.push([x, w]); x += w; } return out;
}
function awBlades(rnd, n, y0, y1, len, cols, wdt = 1) { // painted grass: one path per tone, blades leaning a little with the breeze
  ctx.lineCap = 'round';
  for (const col of cols) {
    ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath();
    for (let i = 0; i < n / cols.length; i++) {
      const x = rnd() * AW_W, y = y0 + rnd() * (y1 - y0), l = len * (.5 + rnd() * .7) * (.7 + (y - FLOOR_TOP) / 200), lean = (rnd() - .35) * l * .5;
      for (const ox of x < 8 ? [0, AW_W] : x > AW_W - 8 ? [0, -AW_W] : [0]) { ctx.moveTo(x + ox, y); ctx.quadraticCurveTo(x + ox + lean * .2, y - l * .6, x + ox + lean, y - l); }
    }
    ctx.stroke();
  }
}
function awFloorBloom(rnd, th) {
  const T = FLOOR_TOP, fg = ctx.createLinearGradient(0, T - 4, 0, VH);
  fg.addColorStop(0, '#7E9452'); fg.addColorStop(.3, '#6A7E48'); fg.addColorStop(1, '#34482C'); ctx.fillStyle = fg; ctx.fillRect(0, T - 4, AW_W, VH - T + 4);
  for (let i = 0; i < 260; i++) { const x = rnd() * AW_W, y = T + rnd() * (VH - T); awWrap(x, 12, (x) => dab(x, y, 4 + rnd() * 8, rnd() < .5 ? '#88A05A' : '#4E6A3C', .35)); } // mottled turf
  // the road: packed earth with ragged edges, then cobbles laid in rows that widen toward us
  const P0 = T + 28, P1 = T + 98;
  ctx.fillStyle = '#8E7458'; ctx.fillRect(0, P0 + 4, AW_W, P1 - P0 - 8);
  for (let x = 0; x < AW_W; x += 5) { for (const [y, s] of [[P0 + 4, -1], [P1 - 4, 1]]) awWrap(x, 8, (x) => dab(x, y + s * rnd() * 3, 3 + rnd() * 4, '#8E7458', 1)); }
  let y = P0 + 3, row = 0;
  for (const h of [6, 7, 8, 9, 10, 11, 12]) {
    const edge = row === 0 || row === 6, wear = 1 - Math.abs(row - 3) / 3;
    for (const [x, w] of awRow(rnd, h * 1.5, h * 2.6)) {
      if (rnd() < (edge ? .32 : .05)) { if (rnd() < .5) dab(x + w / 2, y + h * .6, h * .3, '#5E7A3E', .8); continue; } // a lost stone
      const sx = x + .9, sy = y + .7, sw = w - 1.8, sh = h - 1.4, rr = Math.min(sw, sh) * .42;
      const base = ['#B3A086', '#A08C70', '#BCA98C', '#97836A', '#AE9878'][Math.floor(rnd() * 5)], col = awMix(base, '#D8C8A8', wear * .25);
      ctx.fillStyle = 'rgba(52,38,26,.75)'; rrect(sx - .9, sy + 1, sw, sh, rr); ctx.fill();
      ctx.fillStyle = col; rrect(sx, sy, sw, sh, rr); ctx.fill();
      ctx.fillStyle = awMix(col, '#FFF0D8', .45); ctx.globalAlpha = .6; rrect(sx + sw * .3, sy + .5, sw * .64, sh * .42, rr * .6); ctx.fill(); ctx.globalAlpha = 1;
      if (rnd() < .5) { ctx.fillStyle = '#FFF6E4'; ctx.globalAlpha = .55; ell(sx + sw * .72, sy + sh * .3, sw * .1, sh * .1); ctx.fill(); ctx.globalAlpha = 1; }
      if (rnd() < .18) dab(sx + sw * .22, sy + sh * .75, sh * .35, '#6E8A4A', .55); // moss
      if (rnd() < .15) { ctx.strokeStyle = 'rgba(60,40,30,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(sx + sw * .3, sy + 1); ctx.lineTo(sx + sw * .45, sy + sh * .5); ctx.lineTo(sx + sw * .4, sy + sh - 1); ctx.stroke(); }
    }
    y += h; row++;
  }
  awBlades(rnd, 520, P0 - 2, P0 + 8, 7, ['#5E7A3E', '#7E9A4E', '#A8BC6A']); awBlades(rnd, 380, P1 - 8, P1 + 2, 8, ['#4E6A36', '#6E8A44', '#9AB060']); // grass creeping over the road edges
  awBlades(rnd, 1300, T, P0, 7, ['#4E6A36', '#6A8A44', '#8EA85A', '#B8C878']); awBlades(rnd, 900, P1, VH, 11, ['#2E4226', '#3E5630', '#56723E', '#7E9A50'], 1.3);
  for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, yy = rnd() < .5 ? T + 4 + rnd() * 22 : P1 + 4 + rnd() * 20, c = ['#F2B8C8', '#FFF2E0', '#F6D870', '#C8A8F0'][Math.floor(rnd() * 4)]; awWrap(x, 4, (x) => { dab(x, yy, 1.6, c, 1); dab(x + .5, yy - .5, .6, '#FFFFFF', .8); }); }
  // the verge: hedges of leaves, ferns and mossy stones along the back of the meadow
  const g = ['#1E3A2C', '#2F5446', '#4A7A52', '#C9C57E'];
  for (let x = 0; x < AW_W; x += 34) awWR(x + rnd() * 14, 34, rnd, (x, r) => { awBush(x, T + 3, 30 + r() * 26, 12 + r() * 14, r, g); if (r() < .4) dab(x + 6, T - 8 - r() * 8, 2.2, r() < .5 ? '#F6D6B8' : '#F2B8C8', 1); });
  for (let i = 0; i < 14; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => awFern(x, T + 6, 10 + r() * 8, '#2F5446', '#9AB060'));
  for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 14, rnd, (x, r) => { const w = 7 + r() * 7; ctx.fillStyle = '#6E6878'; ell(x, T + 6, w, w * .6); ctx.fill(); ctx.fillStyle = '#D8B8A0'; ctx.globalAlpha = .6; ell(x + w * .3, T + 4, w * .5, w * .3); ctx.fill(); ctx.globalAlpha = 1; dab(x - w * .3, T + 3, w * .4, '#5E7A3E', .9); });
  const sh = ctx.createLinearGradient(0, VH - 30, 0, VH); sh.addColorStop(0, 'rgba(20,24,30,0)'); sh.addColorStop(1, 'rgba(20,24,30,.35)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 30, AW_W, 30);
}
function awFloorSky(rnd, th) {
  const T = FLOOR_TOP, brass = '#B88A48', iron = '#3E3440';
  // the railing at the edge of the deck
  for (let x = 0; x < AW_W; x += 80) awWrap(x, 12, (x) => { if ((x / 80) % 2 === 0 || x > AW_W) return; ctx.fillStyle = iron; ctx.fillRect(x - 1.2, T - 62, 2.4, 30); ctx.beginPath(); ctx.moveTo(x, T - 62); ctx.quadraticCurveTo(x + 2, T - 70, x + 8, T - 68); ctx.lineWidth = 1.6; ctx.strokeStyle = iron; ctx.stroke(); ctx.fillStyle = brass; ctx.fillRect(x + 5, T - 69, 6, 2); softDab(x + 8, T - 64, 18, '255,200,140', .35); awGlow('#FFC98A', 10, () => { ctx.fillStyle = '#FFE6B8'; circle(x + 8, T - 64, 3); ctx.fill(); }); });
  for (let x = 4; x < AW_W; x += 8) { ctx.fillStyle = iron; ctx.fillRect(x - .9, T - 28, 1.8, 20); ell(x, T - 18, 1.8, 3); ctx.fill(); ctx.fillStyle = '#9A8A9A'; ctx.fillRect(x + .2, T - 27, .6, 18); }
  for (let x = 0; x <= AW_W; x += 80) awWrap(x, 8, (x) => { ctx.fillStyle = iron; ctx.fillRect(x - 3, T - 34, 6, 30); ctx.fillStyle = '#8A7A8A'; ctx.fillRect(x - 3, T - 34, 1.4, 30); ctx.fillStyle = brass; circle(x, T - 36, 3.4); ctx.fill(); ctx.fillStyle = '#F0D090'; circle(x - 1, T - 37, 1.2); ctx.fill(); });
  for (const [y, h] of [[T - 31, 3.4], [T - 10, 2.6]]) { ctx.fillStyle = brass; ctx.fillRect(0, y, AW_W, h); ctx.fillStyle = '#F0D090'; ctx.fillRect(0, y, AW_W, .9); ctx.fillStyle = '#6A4A28'; ctx.fillRect(0, y + h - .7, AW_W, .7); }
  // the deck's edge girder
  const bg = ctx.createLinearGradient(0, T - 8, 0, T + 7); bg.addColorStop(0, '#6A5A64'); bg.addColorStop(1, '#2E2630'); ctx.fillStyle = bg; ctx.fillRect(0, T - 8, AW_W, 15);
  for (let x = 3; x < AW_W; x += 6) { ctx.fillStyle = '#1E1820'; circle(x, T - 1, .9); ctx.fill(); ctx.fillStyle = '#C8A8A0'; circle(x - .3, T - 1.3, .4); ctx.fill(); }
  // planks, wider toward us, with staggered joints, grain, knots and nails
  let y = T + 7, h = 8;
  while (y < VH) {
    ctx.fillStyle = '#2E2018'; ctx.fillRect(0, y, AW_W, h);
    for (const [x, w] of awRow(rnd, 70, 170)) {
      const col = ['#A0825E', '#957754', '#AA8C66', '#8C6E4C', '#9A7A58'][Math.floor(rnd() * 5)];
      ctx.fillStyle = col; ctx.fillRect(x + .6, y, w - 1.2, h - 1.1);
      ctx.fillStyle = 'rgba(255,230,190,.35)'; ctx.fillRect(x + .6, y, w - 1.2, .9);
      ctx.fillStyle = 'rgba(40,24,14,.3)'; ctx.fillRect(x + .6, y + h - 2.2, w - 1.2, 1.1);
      ctx.strokeStyle = 'rgba(60,36,20,.3)'; ctx.lineWidth = .5; ctx.beginPath();
      for (let k = 0; k < 3; k++) { const gy = y + h * (.25 + k * .22) + rnd(); ctx.moveTo(x + 2, gy); ctx.bezierCurveTo(x + w * .3, gy + rnd() * 1.4 - .7, x + w * .6, gy + rnd() * 1.4 - .7, x + w - 2, gy); } ctx.stroke();
      if (rnd() < .25) { const kx = x + w * (.2 + rnd() * .6), ky = y + h * .5; ctx.strokeStyle = 'rgba(60,36,20,.55)'; ctx.lineWidth = .6; ell(kx, ky, 2.2, h * .2); ctx.stroke(); ctx.fillStyle = 'rgba(60,36,20,.5)'; ell(kx, ky, .9, h * .08); ctx.fill(); }
      ctx.fillStyle = '#3A2E30'; for (const nx of [x + 3, x + w - 3]) for (const ny of [y + h * .28, y + h * .68]) { circle(nx, ny, .7); ctx.fill(); }
      if (rnd() < .12) { ctx.fillStyle = 'rgba(30,20,20,.18)'; ell(x + w * rnd(), y + h * .5, 8 + rnd() * 8, h * .4); ctx.fill(); } // an oil stain
    }
    y += h; h += 1.3;
  }
  ctx.fillStyle = 'rgba(255,230,190,.08)'; ctx.fillRect(0, T + 30, AW_W, 64); // the walked middle of the deck is worn paler
  ctx.strokeStyle = 'rgba(255,236,210,.18)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 160; i++) { const x = rnd() * AW_W, yy = T + 30 + rnd() * 64; ctx.moveTo(x, yy); ctx.lineTo(x + 3 + rnd() * 6, yy + (rnd() - .5)); } ctx.stroke(); // scuffs
  for (let i = 0; i < 3; i++) { // riveted hatches with teal grilles, and brass inlay strips
    const x = 120 + i * 427 + rnd() * 80, yy = T + 40 + rnd() * 30, w = 36, hh = 16;
    ctx.fillStyle = '#3E5A5A'; rrect(x, yy, w, hh, 2); ctx.fill(); ctx.strokeStyle = '#1E2A2A'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#9FD0C0'; ctx.fillRect(x + 1, yy + .5, w - 2, .9);
    ctx.fillStyle = '#1A2626'; for (let gx = x + 6; gx < x + w - 6; gx += 4) ctx.fillRect(gx, yy + 4, 2, hh - 8);
    ctx.fillStyle = '#C8A870'; for (const [rx, ry] of [[x + 2.5, yy + 2.5], [x + w - 2.5, yy + 2.5], [x + 2.5, yy + hh - 2.5], [x + w - 2.5, yy + hh - 2.5]]) { circle(rx, ry, 1); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(200,160,90,.6)'; ctx.fillRect(0, T + 99, AW_W, 1.2);
  const sh = ctx.createLinearGradient(0, VH - 30, 0, VH); sh.addColorStop(0, 'rgba(30,18,20,0)'); sh.addColorStop(1, 'rgba(30,18,20,.4)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 30, AW_W, 30);
}
function awFloorPrism(rnd, th) {
  const T = FLOOR_TOP; awSeams = [];
  ctx.fillStyle = '#0C0818'; ctx.fillRect(0, T - 2, AW_W, VH - T + 2);
  let y = T + 2, h = 9, row = 0;
  while (y < VH) {
    for (const [x, w] of awRow(rnd, h * 2.2, h * 3.4)) {
      const g = ctx.createLinearGradient(0, y, 0, y + h); const lt = 1 - row * .06;
      g.addColorStop(0, `hsl(${255 + rnd() * 20},38%,${30 * lt}%)`); g.addColorStop(1, `hsl(${250 + rnd() * 20},40%,${13 * lt}%)`);
      ctx.fillStyle = g; ctx.fillRect(x + .7, y + .7, w - 1.4, h - 1.4);
      ctx.fillStyle = 'rgba(170,150,240,.5)'; ctx.fillRect(x + .9, y + .7, w - 1.8, .8); ctx.fillStyle = 'rgba(140,120,220,.3)'; ctx.fillRect(x + .7, y + .7, .7, h - 1.4); // bevels
      ctx.fillStyle = `hsla(${[190, 300, 330][Math.floor(rnd() * 3)]},70%,70%,.09)`; const rx = x + rnd() * w * .7; ctx.fillRect(rx, y + 1, 2 + rnd() * 5, h - 2); // a reflection of the spires
      if (rnd() < .3) { ctx.fillStyle = '#0C0818'; awPath([x + w - .7, y + .7, x + w - 4, y + .7, x + w - .7, y + 3.5]); ctx.fill(); } // a chipped corner
      if (rnd() < .14) { // a crack that glows from below
        const pts = [], n = 4, hue = rnd() < .5 ? 180 : 320; for (let k = 0; k <= n; k++) pts.push([x + 2 + (w - 4) * k / n, y + 1.5 + rnd() * (h - 3)]);
        awSeams.push({ pts, hue, ph: rnd() * TAU });
        awGlow(`hsl(${hue},80%,65%)`, 5, () => { ctx.strokeStyle = `hsla(${hue},80%,72%,.8)`; ctx.lineWidth = .8; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
      }
      if (rnd() < .2) { ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(x + rnd() * w, y + rnd() * h, .5); ctx.fill(); }
    }
    y += h; h += 2; row++;
  }
  for (let i = 0; i < 3; i++) { // rune circles inlaid in the floor
    const x = 200 + i * 427 + rnd() * 60, yy = T + 52 + rnd() * 24, r = 26;
    awGlow('#7FF5F0', 8, () => { ctx.strokeStyle = 'rgba(127,245,240,.45)'; ctx.lineWidth = 1; ell(x, yy, r, r * .28); ctx.stroke(); ell(x, yy, r * .78, r * .22); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, c = Math.cos(a), s = Math.sin(a); ctx.moveTo(x + c * r * .8, yy + s * r * .23); ctx.lineTo(x + c * r * .96, yy + s * r * .27); } ctx.stroke(); });
  }
  // crystals and obsidian rubble along the back edge
  for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 16, rnd, (x, r) => { const w = 8 + r() * 10; awFillPts([x - w, T + 4, x - w * .6, T - w * .5, x + w * .2, T - w * .7, x + w, T + 4], '#1E1834'); awFillPts([x + w * .2, T - w * .7, x + w, T + 4, x + w * .1, T + 4], '#4A3E78', .8); });
  for (let i = 0; i < 16; i++) awWR(rnd() * AW_W, 24, rnd, (x, r) => awCluster(x, T + 1, 10 + r() * 16, [190, 280, 320, 170][i % 4], r, 50));
  const sh = ctx.createLinearGradient(0, VH - 34, 0, VH); sh.addColorStop(0, 'rgba(6,4,14,0)'); sh.addColorStop(1, 'rgba(6,4,14,.45)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 34);
}
function awBuildFloor(themeId, th, seed) {
  retire(awFloorC); awFloorC = null;
  const [c, g] = makeLayer(AW_W, VH - AW_FT0), old = ctx; ctx = g; ctx.translate(0, -AW_FT0);
  const rnd = mulberry(seed * 31 + 5);
  ({ bloom: awFloorBloom, sky: awFloorSky, prism: awFloorPrism }[themeId] || awFloorBloom)(rnd, th);
  ctx = old; awFloorC = c; awFloorKey = themeId;
}
// every frame: the painted floor strip scrolls with the world (anchored to world x, so nothing swims), plus a few live touches
function drawFloorLayer(themeId, th, camX, t) {
  if (!awFloorC || awFloorKey !== themeId) { const fg = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH); fg.addColorStop(0, th.floorA); fg.addColorStop(1, th.floorB); ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_TOP - 4, VW, VH - FLOOR_TOP + 4); return; }
  const ox = -((camX % AW_W + AW_W) % AW_W);
  ctx.drawImage(awFloorC, ox, AW_FT0, AW_W, VH - AW_FT0); if (ox + AW_W < VW) ctx.drawImage(awFloorC, ox + AW_W, AW_FT0, AW_W, VH - AW_FT0);
  const off = (n) => ((-camX) % n + n) % n - n;
  const hsh = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }; // stable per-tile randomness
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (themeId === 'bloom') { // motes of pollen drifting in the low sun
    for (let x = off(150); x < VW + 150; x += 150) { const w = Math.floor((x + camX) / 150 + .5), a = .35 + .3 * Math.sin(t * 1.7 + w * 3);
      ctx.fillStyle = `rgba(255,236,170,${a})`; circle(x + hsh(w) * 140 + Math.sin(t * .6 + w) * 6, FLOOR_TOP - 8 + hsh(w + 1) * 40 + Math.sin(t * .9 + w * 2) * 4, 1.3); ctx.fill(); }
  } else if (themeId === 'prism') { // the cracks in the floor breathe, and crystal grit twinkles
    const x0 = camX % AW_W < 0 ? camX % AW_W + AW_W : camX % AW_W;
    ctx.lineWidth = 1.4;
    for (const s of awSeams) for (const tile of [0, AW_W]) {
      const sx = s.pts[0][0] + tile - x0; if (sx > VW + 4 || s.pts[s.pts.length - 1][0] + tile - x0 < -4) continue;
      ctx.strokeStyle = `hsla(${s.hue},80%,70%,${.18 + .18 * Math.sin(t * 2 + s.ph)})`; ctx.beginPath(); s.pts.forEach((p, i) => i ? ctx.lineTo(p[0] + tile - x0, p[1]) : ctx.moveTo(p[0] + tile - x0, p[1])); ctx.stroke();
    }
    for (let x = off(70); x < VW + 70; x += 70) { const w = Math.floor((x + camX) / 70 + .5), a = Math.max(0, Math.sin(t * 2.4 + w * 2.1)); if (a < .2) continue;
      const px = x + hsh(w) * 60, py = FLOOR_TOP + 10 + hsh(w + 3) * 100, s = 1 + a * 2.2; ctx.fillStyle = `rgba(255,240,255,${a * .8})`; awPath([px, py - s, px + .4, py - .4, px + s, py, px + .4, py + .4, px, py + s, px - .4, py + .4, px - s, py, px - .4, py - .4]); ctx.fill(); }
  }
  ctx.restore();
}
