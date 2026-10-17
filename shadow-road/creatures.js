'use strict';
// Each creature is drawn in local space: feet (or hover point) at (0,0), facing +x.
// a = animation info: { walk, wind (0..1 while winding up), atk (striking), t (seconds), hurt }
const CREATURES = {
  slime(e, a) {
    const sq = e.sq || 1, w = 17 / Math.sqrt(sq), h = 26 * sq;
    const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, C('#E8B8CA')); g.addColorStop(1, C('#B05A84'));
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w, -h * .9, -w * .5, -h, 0, -h); ctx.bezierCurveTo(w * .5, -h, w, -h * .9, w, 0); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); outline(2.2);
    ctx.fillStyle = C('rgba(255,255,255,.7)'); ell(-w * .35, -h * .7, 4, 6, -.4); ctx.fill();
    limb([0, -h, 3, -h - 7], '#5E8A52', 2.5); ctx.fillStyle = C('#7EA460'); ell(7, -h - 8, 5, 2.5, -.4); ctx.fill();
    eyes(w * .25, -h * .5, 3.2, a);
  },
  boar(e, a) {
    const ph = a.walk, lunge = a.wind ? -4 * a.wind : a.atk ? 6 : 0;
    ctx.save(); ctx.translate(lunge, 0);
    [[-14, 0], [-8, 1], [8, 0], [14, 1]].forEach(([x, p], i) => limb([x, -12, x + Math.sin(ph + p * 3) * 5, 0], '#6B3A1E', 5));
    ell(0, -18, 24, 13); ctx.fillStyle = C('#B86A3E'); ctx.fill(); outline(2.2);
    ctx.fillStyle = C('#D8A27A'); ell(2, -12, 16, 5); ctx.fill();
    ctx.fillStyle = C('#5E8A52'); for (let i = 0; i < 5; i++) { const x = -16 + i * 7; ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x + 3, -38 - (i % 2) * 4); ctx.lineTo(x + 6, -28); ctx.fill(); }
    circle(22, -18, 10); ctx.fillStyle = C('#B86A3E'); ctx.fill(); outline(2);
    ell(31, -15, 5, 4); ctx.fillStyle = C('#FFB0A0'); ctx.fill(); outline(1.5);
    ctx.fillStyle = C('#FFFFFF'); ctx.beginPath(); ctx.moveTo(26, -11); ctx.quadraticCurveTo(34, -8, 33, -20); ctx.lineTo(30, -12); ctx.fill();
    eyes(22, -21, 2.6, a, 1);
    ctx.restore();
  },
  wisp(e, a) {
    const fl = Math.sin(a.t * 30) * .5 + .5;
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter';
    const g = ctx.createRadialGradient(0, -12, 2, 0, -12, 26); g.addColorStop(0, 'rgba(255,240,150,.9)'); g.addColorStop(1, 'rgba(255,140,220,0)');
    ctx.fillStyle = g; circle(0, -12, 26); ctx.fill(); ctx.restore();
    ctx.fillStyle = C('rgba(255,170,230,.75)'); ell(-10, -20, 12, 6 * (.4 + fl), -.6); ctx.fill(); ell(10, -20, 12, 6 * (.4 + fl), .6); ctx.fill();
    circle(0, -12, 10); ctx.fillStyle = C('#EED48A'); ctx.fill(); outline(2);
    eyes(3, -13, 2.2, a);
  },
  golem(e, a) {
    const cry = e.def.crystal, body = cry ? '#8CC0D0' : '#948A80', dark = cry ? '#4E6EA8' : '#6A5E54', moss = cry ? '#C878A8' : '#6E9A56';
    const ph = a.walk, raise = a.wind ? a.wind : 0;
    limb([-9, -18, -10 + Math.sin(ph) * 5, 0], dark, 11); limb([9, -18, 10 - Math.sin(ph) * 5, 0], dark, 11);
    limb([-12, -48, -20, -30 + raise * -24], dark, 12);
    rrect(-22, -60, 44, 44, 14); ctx.fillStyle = C(body); ctx.fill(); outline(2.5);
    ctx.fillStyle = C(moss); ell(-6, -58, 18, 6); ctx.fill(); if (cry) { [[-14, -60], [0, -66], [12, -60]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x, y - 12); ctx.lineTo(x + 4, y + 4); ctx.fill(); }); }
    else { ctx.fillStyle = C('#D98CA0'); circle(-12, -62, 3); ctx.fill(); ctx.fillStyle = C('#EED48A'); circle(4, -63, 3); ctx.fill(); }
    rrect(-8, -74, 26, 18, 7); ctx.fillStyle = C(body); ctx.fill(); outline(2.5);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = C(cry ? '#FFFFFF' : '#EED48A'); ctx.fillRect(6, -69, 8, 4); ctx.restore();
    const ang = a.atk ? 0.4 : a.wind ? -1.9 * a.wind : 1.2;
    ctx.save(); ctx.translate(14, -48); ctx.rotate(ang); limb([0, 0, 22, 0], dark, 12); circle(26, 0, 11); ctx.fillStyle = C(body); ctx.fill(); outline(2.5); ctx.restore();
  },
  drone(e, a) {
    const tilt = a.wind ? -.2 : a.atk ? .1 : Math.sin(a.t * 2) * .08;
    ctx.save(); ctx.translate(0, -12); ctx.rotate(tilt);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = 'rgba(111,211,255,.6)'; ell(0, 12, 6, 10 + Math.sin(a.t * 40) * 3); ctx.fill(); ctx.restore();
    ell(0, 0, 18, 8); ctx.fillStyle = C('#D8DCE6'); ctx.fill(); outline(2);
    ctx.fillStyle = C('#B88A48'); ctx.fillRect(-18, -1, 36, 3);
    limb([-14, -6, -14, -12], '#8E9BB8', 2); limb([14, -6, 14, -12], '#8E9BB8', 2);
    ctx.fillStyle = C('rgba(220,230,255,.8)'); ell(-14, -13, 10 * Math.abs(Math.sin(a.t * 50)), 1.6); ctx.fill(); ell(14, -13, 10 * Math.abs(Math.cos(a.t * 50)), 1.6); ctx.fill();
    circle(9, 1, 4.5); ctx.fillStyle = C(a.wind ? '#D04A62' : '#4E9A90'); ctx.fill(); outline(1.5);
    ctx.restore();
  },
  spider(e, a) {
    const ph = a.walk * 1.4;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const bx = (i - 1) * 7, p = ph + i * 2 + (s > 0 ? Math.PI : 0);
      limb([bx, -16, bx + s * 0 + (i - 1) * 10 + 12 * Math.cos(p) * .2 + (s > 0 ? 6 : -6), -26, bx + (i - 1) * 16 + Math.sin(p) * 5, 0], '#8A5A20', 3);
    }
    circle(0, -18, 13); ctx.fillStyle = C('#B88A48'); ctx.fill(); outline(2.2);
    for (let k = 0; k < 8; k++) { ctx.save(); ctx.translate(0, -18); ctx.rotate(k / 8 * TAU + a.t * 2); ctx.fillStyle = C('#9A7038'); ctx.fillRect(5, -1.5, 5, 3); ctx.restore(); }
    circle(0, -18, 5); ctx.fillStyle = C('#4E9A90'); ctx.fill();
    circle(11, -20, 4); ctx.fillStyle = C(a.wind ? '#D04A62' : '#EED48A'); ctx.fill(); outline(1.5);
  },
  knight(e, a) { drawHumanoid(KNIGHT, a.pose); },
  tank(e, a) {
    const roll = a.walk * 3;
    rrect(-30, -16, 60, 16, 8); ctx.fillStyle = C('#5A4A3A'); ctx.fill(); outline(2.2);
    for (let i = -2; i <= 2; i++) { circle(i * 11, -8, 5); ctx.fillStyle = C('#9A7038'); ctx.fill(); ctx.save(); ctx.translate(i * 11, -8); ctx.rotate(roll); ctx.fillStyle = C('#5A4A3A'); ctx.fillRect(-1, -4, 2, 8); ctx.restore(); }
    rrect(-26, -46, 50, 32, 10); ctx.fillStyle = C('#B88A48'); ctx.fill(); outline(2.2);
    ctx.fillStyle = C('#4E9A90'); ctx.fillRect(-26, -30, 50, 5);
    limb([-16, -46, -16, -60], '#8E9BB8', 6);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(-16 + Math.sin(a.t * 3) * 2, -66 - (a.t * 20 % 10), 5); ctx.fill();
    const ang = a.wind ? -.35 * a.wind : 0;
    ctx.save(); ctx.translate(18, -36); ctx.rotate(ang); rrect(0, -6, 26, 12, 4); ctx.fillStyle = C('#8E9BB8'); ctx.fill(); outline(2); ctx.fillStyle = C(a.wind ? '#D04A62' : '#EED48A'); circle(26, 0, 3.5); ctx.fill(); ctx.restore();
    circle(4, -38, 6); ctx.fillStyle = C('#BFF5EF'); ctx.fill(); outline(1.5);
  },
  imp(e, a) {
    const fl = Math.sin(a.t * 24);
    ctx.fillStyle = C('#7EC2CC'); ctx.beginPath(); ctx.moveTo(-4, -28); ctx.quadraticCurveTo(-24, -40 - fl * 6, -22, -18); ctx.quadraticCurveTo(-14, -24, -4, -20); ctx.fill(); outline(1.5);
    limb([-6, -10, -16, -4, -20, -14], '#7A4A98', 2.5);
    limb([-4, -12, -6 + Math.sin(a.walk) * 4, 0], '#4E2A66', 4); limb([4, -12, 6 - Math.sin(a.walk) * 4, 0], '#4E2A66', 4);
    const g = ctx.createLinearGradient(0, -34, 0, -8); g.addColorStop(0, C('#C878A8')); g.addColorStop(1, C('#6A3A8A'));
    ell(0, -22, 11, 14); ctx.fillStyle = g; ctx.fill(); outline(2);
    ctx.fillStyle = C('#D8AA55'); ctx.beginPath(); ctx.moveTo(-6, -33); ctx.lineTo(-9, -44); ctx.lineTo(-2, -35); ctx.fill(); ctx.beginPath(); ctx.moveTo(4, -34); ctx.lineTo(7, -45); ctx.lineTo(9, -33); ctx.fill();
    eyes(4, -25, 3, a);
    limb([6, -18, a.atk ? 18 : 12, a.atk ? -18 : -10], '#6A3A8A', 3.5);
  },
  jelly(e, a) {
    for (let i = 0; i < 5; i++) { const x = -10 + i * 5; ctx.strokeStyle = C(`hsla(${(a.t * 80 + i * 60) % 360},55%,72%,.85)`); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, -14); for (let k = 1; k <= 4; k++) ctx.lineTo(x + Math.sin(a.t * 6 + k + i) * 3, -14 + k * 6); ctx.stroke(); }
    const g = ctx.createRadialGradient(-4, -24, 2, 0, -18, 20); g.addColorStop(0, C('rgba(255,255,255,.95)')); g.addColorStop(.5, C(`hsla(${(a.t * 60) % 360},55%,72%,.85)`)); g.addColorStop(1, C('rgba(120,80,255,.8)'));
    ctx.beginPath(); ctx.arc(0, -14, 17, Math.PI, 0); ctx.quadraticCurveTo(0, -8, -17, -14); ctx.fillStyle = g; ctx.fill(); outline(2);
    eyes(4, -20, 2.4, a);
  },
  crab(e, a) {
    const ph = a.walk * 1.3;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) limb([s * 6, -12, s * (14 + i * 3), -18, s * (16 + i * 5) + Math.sin(ph + i) * 3, 0], '#5A4A98', 3);
    const pinch = a.atk ? .5 : a.wind ? -.4 : Math.sin(a.t * 3) * .1;
    ctx.save(); ctx.translate(18, -20); ctx.rotate(-.3 + pinch); ell(10, 0, 11, 7); ctx.fillStyle = C('#8CC8D0'); ctx.fill(); outline(2); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-22, -12); ctx.lineTo(-14, -32); ctx.lineTo(0, -38); ctx.lineTo(14, -32); ctx.lineTo(22, -12); ctx.lineTo(0, -6); ctx.closePath();
    const g = ctx.createLinearGradient(0, -38, 0, -6); g.addColorStop(0, C('#E6FBFF')); g.addColorStop(1, C('#7A6AB8')); ctx.fillStyle = g; ctx.fill(); outline(2.2);
    ctx.fillStyle = C('rgba(255,255,255,.7)'); ctx.beginPath(); ctx.moveTo(-14, -32); ctx.lineTo(0, -38); ctx.lineTo(-4, -20); ctx.fill();
    eyes(10, -26, 2.6, a);
  },
  mossback(e, a) {
    const ph = a.walk, lunge = a.atk ? 18 : a.wind ? -8 * a.wind : Math.sin(a.t * 2) * 2;
    [[-34, 0], [-14, 1], [14, 0], [34, 1]].forEach(([x, p]) => limb([x, -20, x + Math.sin(ph + p * 3) * 6, 0], '#5A8F4A', 14));
    ctx.save(); ctx.translate(48 + lunge, -30);
    circle(0, 0, 16); ctx.fillStyle = C('#7EA460'); ctx.fill(); outline(2.5);
    ctx.fillStyle = C('#EED48A'); circle(5, -4, 4); ctx.fill(); ctx.fillStyle = C(OUT); circle(6, -4, 2); ctx.fill();
    ctx.fillStyle = C('#F4C060'); ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(22, 6 + (a.atk ? 6 : 0)); ctx.lineTo(10, 10); ctx.fill(); outline(1.5);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -30, 58, 44, 0, Math.PI, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -74, 0, -30); g.addColorStop(0, C('#5E8A4E')); g.addColorStop(1, C('#3A5E3A')); ctx.fillStyle = g; ctx.fill(); outline(3);
    ctx.strokeStyle = C('rgba(30,80,30,.5)'); ctx.lineWidth = 2;
    [[-30, -50], [0, -60], [30, -50], [-15, -38], [15, -38]].forEach(([x, y]) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU; ctx.lineTo(x + Math.cos(an) * 11, y + Math.sin(an) * 8); } ctx.closePath(); ctx.stroke(); });
    ctx.fillStyle = C('#E9D8B0'); rrect(-60, -34, 120, 8, 4); ctx.fill(); outline(2);
    // a little garden grows on its back
    limb([-20, -70, -20, -96], '#9A6A44', 5); ctx.fillStyle = C('#D98CA0'); circle(-20, -100, 14); ctx.fill(); circle(-8, -94, 10); ctx.fill();
    limb([18, -70, 18, -84], '#FFF1D6', 5); ctx.fillStyle = C('#B8445A'); ctx.beginPath(); ctx.ellipse(18, -84, 13, 9, 0, Math.PI, 0); ctx.fill(); outline(2);
  },
  colossus(e, a) { ctx.save(); ctx.scale(1.6, 1.6); drawHumanoid(COLOSSUS, a.pose); ctx.restore(); },
  wyrm(e, a) {
    const n = 11;
    for (let i = n; i >= 1; i--) {
      const x = -i * 13, y = -20 + Math.sin(a.t * 3 - i * .55) * 12 + i * 1.5, r = 16 - i * .9;
      circle(x, y, r); ctx.fillStyle = C(`hsl(${(a.t * 50 + i * 32) % 360},50%,60%)`); ctx.fill(); outline(2);
      ctx.fillStyle = C('rgba(255,255,255,.55)'); circle(x - r * .3, y - r * .35, r * .3); ctx.fill();
      if (i % 3 === 0) { ctx.fillStyle = C('#FFF4A8'); ctx.beginPath(); ctx.moveTo(x - 4, y - r + 2); ctx.lineTo(x, y - r - 9); ctx.lineTo(x + 4, y - r + 2); ctx.fill(); }
    }
    const open = a.atk ? .7 : a.wind ? .4 * a.wind : .1;
    ctx.save(); ctx.translate(8, -22);
    ctx.fillStyle = C('#D8AA55'); ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-14, -34); ctx.lineTo(0, -16); ctx.fill(); ctx.beginPath(); ctx.moveTo(4, -15); ctx.lineTo(4, -36); ctx.lineTo(10, -14); ctx.fill();
    ctx.save(); ctx.rotate(open); rrect(0, 0, 30, 9, 4); ctx.fillStyle = C('#7E5AA8'); ctx.fill(); outline(2); ctx.restore();
    ctx.save(); ctx.rotate(-open * .4); rrect(-6, -16, 38, 18, 8); ctx.fillStyle = C('#A07AC8'); ctx.fill(); outline(2.2); ctx.restore();
    ctx.fillStyle = C('#FFFFFF'); circle(12, -10, 5); ctx.fill(); ctx.fillStyle = C(OUT); circle(14, -10, 2.4); ctx.fill();
    ctx.restore();
  },
};
function eyes(x, y, r, a, one) {
  const look = a.wind ? 1.2 : .6;
  const pairs = one ? [[x, y]] : [[x - r * 1.4, y], [x + r * 1.4, y]];
  for (const [ex, ey] of pairs) {
    circle(ex, ey, r); ctx.fillStyle = C('#FFFFFF'); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C(OUT); ctx.stroke();
    if (a.hurt) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ex - r * .6, ey - r * .6); ctx.lineTo(ex + r * .6, ey + r * .6); ctx.moveTo(ex + r * .6, ey - r * .6); ctx.lineTo(ex - r * .6, ey + r * .6); ctx.stroke(); }
    else { ctx.fillStyle = C(OUT); circle(ex + look, ey, r * .5); ctx.fill(); }
  }
  if (a.wind && !one) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - r * 2.6, y - r * 1.6); ctx.lineTo(x - r * .4, y - r * .9); ctx.moveTo(x + r * 2.6, y - r * 1.6); ctx.lineTo(x + r * .4, y - r * .9); ctx.stroke(); }
}

// ---------- props: bloom pods and weapon pickups ----------
function drawPod(p, t) {
  ctx.save(); ctx.translate(p.x, p.y); shadow(0, 0, 16);
  const sq = 1 + Math.sin(t * 3 + p.x) * .04;
  ctx.beginPath(); ctx.ellipse(0, -16 * sq, 14, 16 * sq, 0, 0, TAU);
  ctx.fillStyle = C(p.theme === 'sky' ? '#B88A48' : p.theme === 'prism' ? '#8CC8D0' : '#D98CA0'); ctx.fill(); outline(2);
  ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -32 * sq); ctx.lineTo(0, 0); ctx.stroke();
  ctx.fillStyle = C('rgba(255,255,255,.6)'); ell(-5, -22, 3, 6); ctx.fill();
  ctx.restore();
}
function drawWeaponPickup(k, t) {
  ctx.save(); ctx.translate(k.x, k.y); shadow(0, 0, 18);
  const bob = Math.sin(t * 3) * 4 - 26 - k.z;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(0, bob); ctx.rotate(t + i / 6 * TAU); ctx.fillStyle = 'rgba(255,220,120,.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(50, -6); ctx.lineTo(50, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.save(); ctx.translate(-30, bob); ctx.rotate(-.5 + Math.sin(t * 2) * .15); drawWeapon(k.weapon); ctx.restore();
  ctx.restore();
}
