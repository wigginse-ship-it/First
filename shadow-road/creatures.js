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
    const ram = e.def.pal === 'ram', ph = a.walk, lunge = a.wind ? -4 * a.wind : a.atk ? 6 : 0;
    ctx.save(); ctx.translate(lunge, 0);
    [[-14, 0], [-8, 1], [8, 0], [14, 1]].forEach(([x, p], i) => limb([x, -12, x + Math.sin(ph + p * 3) * 5, 0], '#6B3A1E', 5));
    ell(0, -18, 24, 13); ctx.fillStyle = C(ram ? '#CFCBD6' : '#B86A3E'); ctx.fill(); outline(2.2);
    ctx.fillStyle = C(ram ? '#EEEAF0' : '#D8A27A'); ell(2, -12, 16, 5); ctx.fill();
    if (ram) { for (let i = 0; i < 6; i++) dab(-18 + i * 7, -27 - (i % 2) * 2, 6, C('#E6E2EC'), 1); }
    else { ctx.fillStyle = C('#5E8A52'); for (let i = 0; i < 5; i++) { const x = -16 + i * 7; ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x + 3, -38 - (i % 2) * 4); ctx.lineTo(x + 6, -28); ctx.fill(); } }
    circle(22, -18, 10); ctx.fillStyle = C(ram ? '#8A8496' : '#B86A3E'); ctx.fill(); outline(2);
    if (ram) { ctx.strokeStyle = C('#D8C08A'); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(18, -24, 7, Math.PI * 1.1, Math.PI * 2.4); ctx.stroke(); }
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
    const pal = e.def.pal === 'lantern' ? ['#8A7458', '#D8AA55', '#F2C98A'] : e.def.pal === 'prism' ? ['#8C7AB8', '#8CC8D0', '#D8A0E8'] : ['#D8DCE6', '#B88A48', '#4E9A90'];
    const tilt = a.wind ? -.2 : a.atk ? .1 : Math.sin(a.t * 2) * .08;
    ctx.save(); ctx.translate(0, -12); ctx.rotate(tilt);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = 'rgba(111,211,255,.6)'; ell(0, 12, 6, 10 + Math.sin(a.t * 40) * 3); ctx.fill(); ctx.restore();
    ell(0, 0, 18, 8); ctx.fillStyle = C(pal[0]); ctx.fill(); outline(2);
    ctx.fillStyle = C(pal[1]); ctx.fillRect(-18, -1, 36, 3);
    limb([-14, -6, -14, -12], '#8E9BB8', 2); limb([14, -6, 14, -12], '#8E9BB8', 2);
    ctx.fillStyle = C('rgba(220,230,255,.8)'); ell(-14, -13, 10 * Math.abs(Math.sin(a.t * 50)), 1.6); ctx.fill(); ell(14, -13, 10 * Math.abs(Math.cos(a.t * 50)), 1.6); ctx.fill();
    circle(9, 1, 4.5); ctx.fillStyle = C(a.wind ? '#D04A62' : pal[2]); ctx.fill(); outline(1.5);
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
  knight(e, a) { drawHumanoid(e.def.look === 'moss' ? KNIGHT_MOSS : KNIGHT, a.pose); },
  human(e, a) { drawHumanoid(HUMANS[e.def.look], a.pose); },
  skyray(e, a) {
    const flap = Math.sin(a.t * 6) * 6, dive = a.atk ? .3 : a.wind ? -.2 : 0;
    ctx.save(); ctx.translate(0, -14); ctx.rotate(dive);
    ctx.strokeStyle = C('#4A4A6E'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-34, 4 + flap * .3, -46, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.quadraticCurveTo(4, -14 - flap, -14, -4); ctx.quadraticCurveTo(-4, 0, -14, 4); ctx.quadraticCurveTo(4, 14 + flap, 18, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, C('#6E7AA8')); g.addColorStop(1, C('#C8C0D8')); ctx.fillStyle = g; ctx.fill(); outline(1.8);
    ctx.fillStyle = C('rgba(255,255,255,.35)'); ell(2, -4, 8, 2.5); ctx.fill();
    eyes(12, -2, 2, a, 1);
    ctx.restore();
  },
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
  mossback(e, a) { // an ancient tortoise carrying a grove on its back
    const ph = a.walk, rage = e.enraged, phase = e.phase || 1, lunge = a.atk ? 22 : a.wind ? -10 * a.wind : Math.sin(a.t * 1.6) * 2;
    ctx.save(); ctx.scale(1.3, 1.3);
    limb([-58, -22, -86, -10 + Math.sin(a.t * 2) * 3, -96, -16], '#5A6E48', 12); // stone tail
    [[-40, 0], [-18, 1], [18, 0], [40, 1]].forEach(([x, p]) => { limb([x, -24, x + Math.sin(ph + p * 3) * 7, -2], '#56704A', 16); ctx.fillStyle = C('#D8CFB8'); for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.moveTo(x + Math.sin(ph + p * 3) * 7 + c * 5, 0); ctx.lineTo(x + Math.sin(ph + p * 3) * 7 + c * 5 + 3, 4); ctx.lineTo(x + Math.sin(ph + p * 3) * 7 + c * 5 + 6, 0); ctx.fill(); } });
    ctx.save(); ctx.translate(58 + lunge, -36); // head with horns and a moss beard
    limb([-14, 6, 0, 0], '#56704A', 16);
    ctx.fillStyle = C('#4E6A3E'); ctx.beginPath(); ctx.moveTo(-4, 10); ctx.quadraticCurveTo(4, 30, 10, 22); ctx.quadraticCurveTo(14, 30, 18, 14); ctx.closePath(); ctx.fill();
    circle(4, 0, 18); ctx.fillStyle = C('#7E9A64'); ctx.fill(); outline(2.2);
    ctx.strokeStyle = C('#D8CFB8'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.quadraticCurveTo(-18, -34, -6, -46); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, -16); ctx.quadraticCurveTo(10, -36, 26, -40); ctx.stroke();
    ctx.save(); if (!FLASH) { ctx.shadowColor = rage ? '#FF8A4A' : '#EED48A'; ctx.shadowBlur = 10; } ctx.fillStyle = C(phase === 3 ? '#FF5A3A' : rage ? '#FF9A5A' : '#EED48A'); ell(10, -4, 5, 3.5); ctx.fill(); ctx.restore();
    ctx.fillStyle = C('#C9A86A'); ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(30, 8 + (a.atk ? 8 : 0)); ctx.lineTo(14, 14); ctx.fill(); outline(1.5);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -34, 64, 50, 0, Math.PI, 0); ctx.closePath(); // the shell
    const g = ctx.createLinearGradient(0, -84, 0, -34); g.addColorStop(0, C(phase === 3 ? '#4A4038' : '#6E8A58')); g.addColorStop(1, C(phase === 3 ? '#221C1C' : '#34503A')); ctx.fillStyle = g; ctx.fill(); outline(2.6);
    if (phase >= 2) { // phase two: thorns burst through the shell
      ctx.fillStyle = C(phase === 3 ? '#2A1A16' : '#5A3E2A');
      for (let i = 0; i < 11; i++) { const an = Math.PI + (i + .5) / 11 * Math.PI, bx = Math.cos(an) * 62, by = -34 + Math.sin(an) * 48; ctx.beginPath(); ctx.moveTo(bx - 4, by + 2); ctx.lineTo(bx + Math.cos(an) * 14, by + Math.sin(an) * 14); ctx.lineTo(bx + 4, by + 2); ctx.closePath(); ctx.fill(); outline(1.2); }
    }
    ctx.save(); if (!FLASH) { ctx.shadowColor = rage ? '#FF7A3A' : '#9FE8C8'; ctx.shadowBlur = rage ? 12 : 6; }
    ctx.strokeStyle = C(rage ? 'rgba(255,140,80,.9)' : 'rgba(159,232,200,.55)'); ctx.lineWidth = 2;
    [[-34, -54], [0, -66], [34, -54], [-17, -42], [17, -42]].forEach(([x, y]) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k / 6 * TAU; ctx.lineTo(x + Math.cos(an) * 12, y + Math.sin(an) * 9); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.stroke(); });
    ctx.restore();
    ctx.fillStyle = C('#D8CFB8'); rrect(-66, -38, 132, 9, 4); ctx.fill(); outline(2);
    limb([-12, -80, -14, -118, -2, -138], '#4A3A30', 7); limb([-13, -108, -30, -124], '#4A3A30', 4); // the grove
    for (let i = 0; i < 16; i++) { const an = i * 2.4, d = (i % 5) * 6; dab(-8 + Math.cos(an) * d * 1.6, -138 + Math.sin(an) * d, 11 + (i % 3) * 3, C(phase === 3 ? (i % 3 ? '#5A3A2A' : '#3A2620') : i % 3 ? '#3D6A52' : '#2F5446'), .95); }
    if (phase === 3 && !e.dead) { // phase three: the grove on its back is ablaze
      ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter';
      for (let i = 0; i < 7; i++) { const fx = -24 + i * 7, fy = -150 - Math.abs(Math.sin(a.t * 9 + i)) * 14; const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 14); fg.addColorStop(0, 'rgba(255,220,140,.9)'); fg.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = fg; circle(fx, fy, 14); ctx.fill(); }
      ctx.restore();
    }
    for (let i = 0; i < 7; i++) { const an = i * 2.1 + .5, d = 6 + (i * 7) % 18; dab(-8 + Math.cos(an) * d * 1.5, -140 + Math.sin(an) * d * .8, 2.4, C(rage ? '#F09A5A' : '#E8B8C8'), .95); }
    ctx.fillStyle = C('#8A8478'); rrect(22, -92, 20, 12, 5); ctx.fill(); outline(1.5); dab(30, -94, 6, C('#5E8A52'), 1);
    ctx.restore();
  },
  colossus(e, a) { // a walking fortress of brass with a furnace for a heart
    const rage = e.enraged, phase = e.phase || 1;
    ctx.save(); ctx.scale(1.9, 1.9);
    for (const [x, h] of [[-12, 20], [-6, 26]]) { rrect(x - 2, -66 - h, 5, h, 1.5); ctx.fillStyle = C('#5A4A3E'); ctx.fill(); outline(1.2); } // smokestacks
    drawHumanoid(COLOSSUS, a.pose);
    ctx.save(); ctx.translate(-2, -48); ctx.rotate(a.wind && e.plan === 'volley' ? -.3 : 0); // shoulder cannon
    rrect(-6, -6, 24, 9, 3); ctx.fillStyle = C('#8A6A3A'); ctx.fill(); outline(1.4); ctx.fillStyle = C(rage ? '#FF7A8A' : '#EED48A'); circle(18, -1.5, 2.4); ctx.fill(); ctx.restore();
    ctx.save(); if (!FLASH) { ctx.shadowColor = rage ? '#FF5A4A' : '#F2A65A'; ctx.shadowBlur = rage ? 16 : 8; } // the furnace
    rrect(-6, -44, 12, 10, 2); ctx.fillStyle = C(rage ? '#FFB08A' : '#E8945A'); ctx.fill(); ctx.restore();
    ctx.strokeStyle = C('#4A3A2A'); ctx.lineWidth = 1.2; for (let i = -4; i <= 4; i += 4) { ctx.beginPath(); ctx.moveTo(i, -44); ctx.lineTo(i, -34); ctx.stroke(); }
    if (phase >= 2) { // phase two: plates blown away, a cracked and glowing core
      ctx.strokeStyle = C('#2A1E16'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, -50); ctx.lineTo(-4, -46); ctx.lineTo(-7, -40); ctx.moveTo(8, -32); ctx.lineTo(4, -28); ctx.lineTo(7, -25); ctx.stroke();
      ctx.save(); if (!FLASH) { ctx.shadowColor = '#FF7A4A'; ctx.shadowBlur = 14; } ctx.fillStyle = C('#FFD2A0'); circle(0, -39, phase === 3 ? 6 : 4.5); ctx.fill(); ctx.restore();
    }
    if (phase === 3 && !FLASH) { // phase three: red-hot all over
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,70,40,${.18 + .08 * Math.sin(a.t * 8)})`; rrect(-14, -66, 28, 66, 8); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    if (phase >= 2 && !e.dead && !FLASH && Math.random() < .25) parts.push({ x: e.x + rand(-14, 14), y: e.y, z: e.z + rand(70, 110), vx: rand(-80, 80), vy: 0, vz: rand(40, 160), life: .5, max: .5, col: pick(['#FFD27A', '#FF9A5A']), size: 2, shape: 'streak', rot: 0, vr: 0 });
    if (!FLASH && !e.dead && Math.random() < .3) parts.push({ x: e.x - e.facing * 18, y: e.y, z: e.z + 168 + rand(0, 10), vx: rand(-10, 10), vy: 0, vz: 30, life: 1, max: 1, col: rage ? 'rgba(80,60,60,.5)' : 'rgba(220,210,200,.45)', size: rand(5, 9), shape: 'puff', rot: 0, vr: 0 });
  },
  wyrm(e, a) { // a serpent of living crystal that drinks color
    const n = 15, rage = e.enraged, phase = e.phase || 1, hueBase = rage ? 300 : 0;
    const segs = [];
    for (let i = n; i >= 1; i--) segs.push([i, -i * 12, -20 + Math.sin(a.t * 3 - i * .5) * 14 + i * 1.3, 18 - i * .85]);
    for (const [i, x, y, r] of segs) {
      if (i === 3) for (const s of [-1, 1]) { // crystal wings
        ctx.save(); ctx.translate(x, y - 6); ctx.rotate(s * .2 - .5 + Math.sin(a.t * 4) * .25 * s);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -44); ctx.lineTo(-6, -34); ctx.lineTo(-18, -62); ctx.lineTo(10, -30); ctx.closePath();
        ctx.fillStyle = C(`hsla(${(hueBase + a.t * 40 + s * 40) % 360},45%,72%,.75)`); ctx.fill(); outline(1.6); ctx.restore();
      }
      circle(x, y, r); ctx.fillStyle = C(phase === 3 ? (i % 2 ? '#1E1428' : '#2E2038') : `hsl(${(hueBase + a.t * 50 + i * 26) % 360},${rage ? 70 : 50}%,${rage ? 64 : 60}%)`); ctx.fill(); outline(2);
      if (phase === 3) { ctx.strokeStyle = C('#E8C06A'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r - 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.fillStyle = C('rgba(255,255,255,.5)'); circle(x - r * .3, y - r * .35, r * .3); ctx.fill();
      if (i % 2 === 0 || phase >= 2) { ctx.fillStyle = C(phase === 3 ? '#E8C06A' : rage ? '#FFD27A' : '#F2E2A8'); ctx.beginPath(); ctx.moveTo(x - 4, y - r + 2); ctx.lineTo(x, y - r - 11); ctx.lineTo(x + 4, y - r + 2); ctx.fill(); }
    }
    const open = a.atk ? .8 : a.wind ? .45 * a.wind : .1;
    ctx.save(); ctx.translate(10, -24);
    ctx.fillStyle = C('#E0B55A'); for (const [bx, tx, ty] of [[-8, -20, -40], [0, -6, -46], [8, 10, -42]]) { ctx.beginPath(); ctx.moveTo(bx - 3, -14); ctx.lineTo(tx, ty); ctx.lineTo(bx + 4, -14); ctx.fill(); outline(1.2); }
    ctx.save(); ctx.rotate(open); rrect(0, 0, 34, 10, 4); ctx.fillStyle = C('#7E5AA8'); ctx.fill(); outline(2);
    ctx.fillStyle = C('#FFFFFF'); for (let i = 6; i < 32; i += 6) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 2, -4); ctx.lineTo(i + 4, 0); ctx.fill(); } ctx.restore();
    ctx.save(); ctx.rotate(-open * .4); rrect(-8, -18, 44, 20, 9); ctx.fillStyle = C('#A07AC8'); ctx.fill(); outline(2.2);
    ctx.fillStyle = C('#FFFFFF'); for (let i = 8; i < 34; i += 6) { ctx.beginPath(); ctx.moveTo(i, 2); ctx.lineTo(i + 2, 6); ctx.lineTo(i + 4, 2); ctx.fill(); } ctx.restore();
    ctx.save(); if (!FLASH) { ctx.shadowColor = rage ? '#FFB060' : '#9FE8F0'; ctx.shadowBlur = 10; } ctx.fillStyle = C(phase === 3 ? '#FFFFFF' : rage ? '#FFD08A' : '#DFF8FF'); ell(14, -10, phase === 3 ? 7 : 6, 4); ctx.fill(); ctx.restore();
    if (phase === 3 && !e.dead && !FLASH && Math.random() < .4) parts.push({ x: e.x - e.facing * rand(20, 150), y: e.y, z: e.z + rand(0, 50), vx: 0, vy: 0, vz: rand(20, 60), life: .8, max: .8, col: pick(['#E8C06A', '#FFF0C0']), size: 2.5, shape: 'star', rot: 0, vr: 4 });
    ctx.fillStyle = C(OUT); ell(16, -10, 1.6, 3.4); ctx.fill();
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
// the breakable pods: painted like the place around them (paint.js propSprite), with a slow glint of light that marks them out
function podPaint(theme) {
  return propSprite('pod-' + theme, 50, 50, 25, 42, (th, s) => {
    const col = theme === 'sky' ? '#A87A40' : theme === 'prism' ? '#6EA8B8' : '#C87890', lit = shade(col, .38), dk = shade(col, -.4);
    if (theme === 'bloom') for (const a of [-1, 1]) { ctx.fillStyle = a === s ? '#5E8A4E' : '#2F5446'; ell(a * 9, -3, 9, 3.2, a * -.35); ctx.fill(); } // the leaves it sits in
    ctx.fillStyle = col; ell(0, -16, 14, 16); ctx.fill();
    ctx.save(); ell(0, -16, 14, 16); ctx.clip();
    for (let i = 0; i < 9; i++) dab(-s * (4 + (i % 4) * 2.4), -6 - (i * 3.7) % 24, 4 + (i % 3) * 1.5, dk, .45); // round into shadow away from the light
    for (let i = 0; i < 7; i++) dab(s * (2 + (i % 3) * 2.6), -14 - (i * 4.3) % 14, 2.5 + (i % 2) * 2, lit, .55); // and into light toward it
    if (theme === 'sky') for (const y of [-24, -9]) { ctx.fillStyle = '#4A3A30'; ctx.fillRect(-15, y, 30, 2.6); ctx.fillStyle = '#F0D49A'; ctx.globalAlpha = .55; ctx.fillRect(-15, y, 30, .8); ctx.globalAlpha = 1; } // brass bands
    else if (theme === 'prism') { ctx.strokeStyle = lit; ctx.lineWidth = .8; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-4, -26); ctx.lineTo(8, -20); ctx.lineTo(14, -12); ctx.moveTo(-4, -26); ctx.lineTo(-2, 0); ctx.stroke(); ctx.globalAlpha = 1; } // facets
    else { ctx.strokeStyle = dk; ctx.lineWidth = 1.2; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(0, -32); ctx.quadraticCurveTo(s * 2, -16, 0, 0); ctx.stroke(); ctx.globalAlpha = 1; } // its seam
    ctx.restore();
    dab(s * 5, -23, 2.6, '#FFF4E4', .7); dab(s * 6.5, -25, 1.2, '#FFFFFF', .8); // a glint
  }, { foot: 8, seed: 31, haze: .06, line: .75 });
}
function podGlint(p, t, rgb = '255,236,200') { onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(p.x, p.y - 16, 20, rgb, .1 + .08 * Math.max(0, Math.sin(t * 2.4 + p.x))); ctx.restore(); }); } // a slow glint: something worth breaking
function drawPod(p, t) {
  const sq = 1 + Math.sin(t * 3 + p.x) * .04;
  propDraw(podPaint(p.theme === 'sky' || p.theme === 'prism' ? p.theme : 'bloom'), p.x, p.y, { sy: sq, sh: 20, flash: FLASH }); podGlint(p, t);
}
function drawWeaponPickup(k, t) {
  ctx.save(); ctx.translate(k.x, k.y); shadow(0, 0, 18);
  const bob = Math.sin(t * 3) * 4 - 26 - k.z;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(0, bob); ctx.rotate(t + i / 6 * TAU); ctx.fillStyle = 'rgba(255,220,120,.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(50, -6); ctx.lineTo(50, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.save(); ctx.translate(-30, bob); ctx.rotate(-.5 + Math.sin(t * 2) * .15); drawWeapon(k.weapon, { noHand: 1, tier: k.lvl || 1 }); ctx.restore(); // (drawn as the level it comes at)
  ctx.restore();
}
