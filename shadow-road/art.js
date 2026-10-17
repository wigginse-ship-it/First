'use strict';
// ---------- palette & drawing helpers ----------
const OUT = '#2A1640';          // outline ink used on every character
let FLASH = false;              // when true, every color helper returns white (hit flash)
const C = (c) => FLASH ? '#FFFFFF' : c;
function outline(w = 2) { ctx.lineWidth = w; ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.stroke(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function limb(pts, col, w) { // a thick round-capped limb with an outline
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = FLASH ? '#fff' : OUT; ctx.lineWidth = w + 3; ctx.stroke();
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
}
function shadow(x, y, rx) { ctx.fillStyle = 'rgba(40,20,80,.28)'; ell(x, y, rx, rx * .28); ctx.fill(); }

// ---------- weapons (drawn in hand space: the hand is at (16,0), pointing along +x) ----------
function drawWeapon(kind, pose) {
  if (kind === 'fists' || !kind) { circle(17, 0, 4.5); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); outline(1.5); return; }
  if (kind === 'hammer') {
    limb([4, 0, 44, 0], '#9A6234', 4);
    rrect(36, -12, 18, 24, 4); ctx.fillStyle = C('#8E9BB8'); ctx.fill(); outline();
    ctx.fillStyle = C('#FFC94A'); ctx.fillRect(43, -12, 4, 24);
    ctx.fillStyle = C('#6FD3FF'); circle(45, 0, 2.6); ctx.fill();
    circle(17, 0, 4); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); return;
  }
  if (kind === 'staff') {
    limb([-28, 0, 58, 0], '#B56B2E', 3.5);
    ctx.fillStyle = C('#FFC94A'); ctx.fillRect(-30, -2.5, 6, 5); ctx.fillRect(54, -2.5, 6, 5);
    ctx.strokeStyle = C('#FF6FB5'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-34, 8, -38 + Math.sin(performance.now() / 120) * 3, 14); ctx.stroke();
    circle(17, 0, 4); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); return;
  }
  if (kind === 'sword' || kind === 'blade' || kind === 'prism') {
    const len = kind === 'sword' ? 64 : 44;
    const bc = kind === 'prism' ? '#C9F6FF' : kind === 'blade' ? '#BFF5EF' : '#E8F0FF';
    limb([6, 0, 17, 0], '#5A3A2A', 4);
    rrect(16, -9, 4, 18, 2); ctx.fillStyle = C('#FFC94A'); ctx.fill(); outline(1.5);
    ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(20 + len, -3); ctx.lineTo(26 + len, 0); ctx.lineTo(20 + len, 3); ctx.lineTo(20, 5); ctx.closePath();
    ctx.fillStyle = C(bc); ctx.fill(); outline(1.8);
    ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(22, -3, len - 4, 1.4);
    if (pose && pose.glow) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55;
      ctx.fillStyle = pose.glow; rrect(16, -10, len + 14, 20, 8); ctx.fill(); ctx.restore();
    }
    return;
  }
  if (kind === 'cannon') { rrect(4, -6, 26, 12, 4); ctx.fillStyle = C('#3CC6C0'); ctx.fill(); outline(); ctx.fillStyle = C('#FFF4A8'); circle(30, 0, 3); ctx.fill(); return; }
}

// ---------- humanoids: the hero, the brass automatons and the colossus ----------
// Feet at y=0, hips at -26, shoulders at -46, head at -56. +x is the facing direction.
function drawHumanoid(look, pose) {
  const walk = pose.walk || 0, sw = Math.sin(walk);
  ctx.save();
  if (pose.rot) { ctx.translate(0, -30); ctx.rotate(pose.rot); ctx.translate(0, 30); }
  if (pose.down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
  const cr = pose.crouch ? 7 : 0;
  // cape flows behind
  if (look.cape) {
    const flow = (pose.flow || 0) + Math.abs(sw) * 4;
    ctx.beginPath(); ctx.moveTo(-3, -46 + cr); ctx.quadraticCurveTo(-18 - flow, -30 + cr, -16 - flow * 1.4, -8 + Math.sin(walk * .5) * 3);
    ctx.lineTo(-4, -14 + cr); ctx.closePath(); ctx.fillStyle = C(look.cape); ctx.fill(); outline(1.8);
  }
  // back arm
  const ba = pose.backArm ?? (1.25 - sw * .4);
  limb([-2, -44 + cr, -2 + Math.cos(ba) * 15, -44 + cr + Math.sin(ba) * 15], look.sleeve || look.body, 5.5);
  // legs
  const hipY = -26 + cr;
  if (pose.kick) {
    limb([-2, hipY, -6, hipY + 12, -4, 0], look.legs, 6);
    limb([2, hipY, 18, hipY - 2, 32, hipY - 4], look.legs, 6);
    ctx.fillStyle = C(look.boots); circle(33, hipY - 4, 4.5); ctx.fill(); outline(1.5);
  } else if (pose.down) {
    limb([-2, hipY, -4, -12, -6, 0], look.legs, 6); limb([2, hipY, 6, -12, 8, 0], look.legs, 6);
  } else {
    const run = pose.run ? 1.6 : 1;
    const f1 = sw * 9 * run, f2 = -sw * 9 * run;
    const k1 = cr ? 8 : Math.max(0, sw) * 5, k2 = cr ? 8 : Math.max(0, -sw) * 5;
    limb([-3, hipY, -3 + f1 * .5 + k1, -13 + cr * .4, -3 + f1, 0], look.legs, 6);
    limb([3, hipY, 3 + f2 * .5 + k2, -13 + cr * .4, 3 + f2, 0], look.legs, 6);
    ctx.fillStyle = C(look.boots); rrect(-6 + f1, -4, 9, 5, 2); ctx.fill(); rrect(0 + f2, -4, 9, 5, 2); ctx.fill();
  }
  // torso (leans around the hips)
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(pose.lean || 0); ctx.translate(0, -hipY);
  if (look.robot) {
    rrect(-11, -50 + cr, 22, 26, 5); ctx.fillStyle = C(look.body); ctx.fill(); outline();
    ctx.fillStyle = C(look.trim); ctx.fillRect(-11, -30 + cr, 22, 4);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = C(look.core); circle(0, -40 + cr, 4.5); ctx.fill(); ctx.restore();
  } else {
    rrect(-9, -48 + cr, 18, 25, 6); ctx.fillStyle = C(look.body); ctx.fill(); outline();
    ctx.fillStyle = C(look.trim); ctx.fillRect(-9, -28 + cr, 18, 3.5); ctx.fillRect(-1.5, -48 + cr, 3, 20);
    if (look.rose) { ctx.fillStyle = C('#F4F6FF'); circle(5, -42 + cr, 2.2); ctx.fill(); }
  }
  // head
  const hy = -58 + cr;
  if (look.robot) {
    rrect(-8, hy - 8, 17, 15, 4); ctx.fillStyle = C(look.helm); ctx.fill(); outline();
    ctx.fillStyle = C(look.visor); ctx.fillRect(1, hy - 3, 8, 3.5);
    if (look.plume) { ctx.fillStyle = C(look.plume); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.quadraticCurveTo(-14, hy - 18, -20, hy - 8); ctx.quadraticCurveTo(-12, hy - 10, -6, hy - 4); ctx.fill(); }
  } else {
    circle(1, hy, 8.5); ctx.fillStyle = C(look.skin); ctx.fill(); outline();
    ctx.fillStyle = C(look.hair); ctx.beginPath(); ctx.arc(0, hy - 1, 9, Math.PI * .95, Math.PI * 2.05); ctx.lineTo(-8, hy + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C(look.crown || '#FFC94A'); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.lineTo(-4, hy - 13); ctx.lineTo(-1, hy - 9); ctx.lineTo(2, hy - 14); ctx.lineTo(4, hy - 9); ctx.lineTo(6, hy - 12); ctx.lineTo(7, hy - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C(OUT); ctx.fillRect(4.5, hy - 1, 2, 3);
  }
  // front arm + weapon
  const arm = pose.arm ?? (1.1 + sw * .35);
  if (pose.trail) drawTrail(0, -45 + cr, pose);
  ctx.save(); ctx.translate(1, -45 + cr); ctx.rotate(arm);
  limb([0, 0, 15, 0], look.sleeve || look.body, 5.5);
  drawWeapon(pose.weapon || look.weapon, pose);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
function drawTrail(cx, cy, pose) {
  const a0 = pose.trailFrom, a1 = pose.arm, r = pose.trail;
  if (Math.abs(a1 - a0) < .05) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = pose.trailCol; ctx.globalAlpha = .55 - i * .15; ctx.lineWidth = (pose.trailW || 6) - i * 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r - i * 6, lo, hi); ctx.stroke();
  }
  ctx.restore();
}
const HERO = { skin: '#F6D7BC', hair: '#3B2766', body: '#2F6FE0', sleeve: '#2A5CC0', trim: '#FFC94A', legs: '#2B2F6A', boots: '#7A4A2A', cape: '#FF4F7B', rose: 1 };
const KNIGHT = { robot: 1, body: '#E0A640', sleeve: '#C98B2A', trim: '#3CC6C0', legs: '#8A5A20', boots: '#5A3A14', helm: '#F0B850', visor: '#7FF7FF', core: '#7FF7FF', plume: '#3CC6C0', weapon: 'blade' };
const COLOSSUS = { robot: 1, body: '#D99A36', sleeve: '#B87A20', trim: '#2FB8B0', legs: '#7A4A18', boots: '#4A2A10', helm: '#F2BB55', visor: '#FF6FB5', core: '#FF8FD0', plume: '#FF6FB5', weapon: 'cannon', cape: '#2FB8B0' };

// ---------- worlds ----------
const THEMES = {
  bloom: { sky: ['#6CC8FF', '#B7E6FF', '#FFD6EC', '#FFF0C8'], floorA: '#7ED957', floorB: '#5DBB45', path: '#F2D9A6', pathEdge: '#D9B67A', ambient: 'petal' },
  sky:   { sky: ['#4FB6FF', '#9FDCFF', '#E6F7FF', '#FFE6B8'], floorA: '#F4E6C8', floorB: '#E6D2A8', path: '#3CC6C0', pathEdge: '#B88A3A', ambient: 'cloud' },
  prism: { sky: ['#4B2A9E', '#9A3FC0', '#FF7FB0', '#FFC27A'], floorA: '#5A3FB0', floorB: '#4A2F98', path: '#8FE9FF', pathEdge: '#FF8FD0', ambient: 'mote' },
};
let bgFar = null, bgMid = null, bgKey = '';
function makeLayer(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); const g = c.getContext('2d'); g.scale(K, K); return [c, g]; }
function buildBackground(themeId, seed) {
  const key = themeId + K + seed; if (key === bgKey) return; bgKey = key;
  const rnd = mulberry(seed);
  const [fc, f] = makeLayer(1280, FLOOR_TOP), [mc, m] = makeLayer(1280, FLOOR_TOP);
  const old = ctx;
  if (themeId === 'bloom') {
    ctx = f;
    for (let i = 0; i < 6; i++) { // floating islands with waterfalls
      const x = 80 + i * 210 + rnd() * 60, y = 60 + rnd() * 70, w = 70 + rnd() * 60;
      ctx.fillStyle = '#B9A8F0'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * .15, y + w * .6); ctx.lineTo(x - w * .2, y + w * .45); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8FE08A'; ell(x, y, w / 2 + 4, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x + w * .2, y + 4, 5, FLOOR_TOP);
      ctx.fillStyle = '#5FCB7A'; circle(x - w * .2, y - 10, 12); ctx.fill(); circle(x - w * .05, y - 16, 14); ctx.fill();
    }
    ctx.fillStyle = '#A7E3B8';
    ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP); for (let x = 0; x <= 1280; x += 40) ctx.lineTo(x, 175 + Math.sin(x * .008) * 20 + Math.sin(x * .021) * 8); ctx.lineTo(1280, FLOOR_TOP); ctx.fill();
    ctx = m;
    for (let i = 0; i < 10; i++) { // giant mushrooms and round trees
      const x = rnd() * 1280, h = 70 + rnd() * 70;
      if (i % 2) {
        limb([x, FLOOR_TOP, x + 4, FLOOR_TOP - h], '#FFF1D6', 12);
        const cap = ['#FF5C8A', '#FF8A3D', '#B36BFF'][i % 3];
        ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x + 4, FLOOR_TOP - h, 34, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); outline(2.5);
        ctx.fillStyle = '#FFF6E8'; [[-14, -10], [6, -16], [18, -6], [-2, -4]].forEach(([dx, dy]) => { circle(x + 4 + dx, FLOOR_TOP - h + dy, 3.5); ctx.fill(); });
      } else {
        limb([x, FLOOR_TOP, x, FLOOR_TOP - h * .6], '#9A6A44', 9);
        ctx.fillStyle = ['#4FCB6B', '#6FDB5A', '#3FBF8F'][i % 3];
        [[0, -h * .75, 30], [-22, -h * .6, 22], [22, -h * .62, 24]].forEach(([dx, dy, r]) => { circle(x + dx, FLOOR_TOP + dy, r); ctx.fill(); });
        ctx.fillStyle = '#FF7FC8'; for (let j = 0; j < 5; j++) { circle(x + rnd() * 50 - 25, FLOOR_TOP - h * .6 - rnd() * 30, 3); ctx.fill(); }
      }
    }
  } else if (themeId === 'sky') {
    ctx = f;
    for (let i = 0; i < 9; i++) { // brass towers with teal domes
      const x = i * 145 + rnd() * 40, w = 30 + rnd() * 26, h = 90 + rnd() * 90;
      ctx.fillStyle = '#E8C98A'; ctx.fillRect(x, FLOOR_TOP - h, w, h);
      ctx.fillStyle = '#5ED6CF'; ctx.beginPath(); ctx.arc(x + w / 2, FLOOR_TOP - h, w / 2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#FFF4D6'; for (let y = FLOOR_TOP - h + 10; y < FLOOR_TOP - 10; y += 14) ctx.fillRect(x + w / 2 - 3, y, 6, 8);
      ctx.fillStyle = '#C9A050'; ctx.fillRect(x + w / 2 - 1, FLOOR_TOP - h - w / 2 - 14, 2, 14);
    }
    for (let i = 0; i < 3; i++) { // airships
      const x = 200 + i * 420 + rnd() * 60, y = 40 + rnd() * 40;
      ctx.fillStyle = '#FF8FB1'; ell(x, y, 44, 14); ctx.fill(); ctx.fillStyle = '#FFC0D2'; ell(x, y - 4, 34, 6); ctx.fill();
      ctx.fillStyle = '#B87A3A'; rrect(x - 14, y + 14, 28, 8, 3); ctx.fill();
    }
    ctx = m;
    for (let i = 0; i < 6; i++) { // big gears on pillars
      const x = 80 + i * 220 + rnd() * 50, y = FLOOR_TOP - 60 - rnd() * 40, r = 22 + rnd() * 14;
      ctx.fillStyle = '#C98B2A'; ctx.fillRect(x - 5, y, 10, FLOOR_TOP - y);
      ctx.fillStyle = '#E0A640'; for (let k = 0; k < 10; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k / 10 * TAU); ctx.fillRect(r - 2, -4, 8, 8); ctx.restore(); }
      circle(x, y, r); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.fillStyle = '#3CC6C0'; circle(x, y, r * .35); ctx.fill();
    }
  } else {
    ctx = f;
    for (let i = 0; i < 18; i++) { // floating prisms
      const x = rnd() * 1280, y = 20 + rnd() * 140, s = 8 + rnd() * 22, hue = Math.floor(rnd() * 360);
      ctx.fillStyle = `hsla(${hue},90%,75%,.85)`; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .6, y); ctx.lineTo(x, y + s * 1.2); ctx.lineTo(x - s * .6, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .6, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    }
    ctx = m;
    for (let i = 0; i < 12; i++) { // crystal spires
      const x = rnd() * 1280, h = 50 + rnd() * 110, w = 14 + rnd() * 16, hue = [190, 300, 45, 160][i % 4];
      ctx.fillStyle = `hsl(${hue},85%,68%)`; ctx.beginPath(); ctx.moveTo(x - w / 2, FLOOR_TOP); ctx.lineTo(x - w / 2, FLOOR_TOP - h); ctx.lineTo(x, FLOOR_TOP - h - w); ctx.lineTo(x + w / 2, FLOOR_TOP - h); ctx.lineTo(x + w / 2, FLOOR_TOP); ctx.closePath(); ctx.fill(); outline(2.5);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x - w / 2 + 3, FLOOR_TOP - h, 3, h);
    }
  }
  ctx = old;
  bgFar = fc; bgMid = mc;
}
function drawWorld(themeId, camX, t) {
  const th = THEMES[themeId];
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP);
  g.addColorStop(0, th.sky[0]); g.addColorStop(.45, th.sky[1]); g.addColorStop(.8, th.sky[2]); g.addColorStop(1, th.sky[3]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP);
  // sun / aurora
  if (themeId === 'prism') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = `hsla(${(t * 30 + i * 70) % 360},90%,70%,.18)`; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-20, 40 + i * 24); for (let x = 0; x <= VW + 40; x += 40) ctx.lineTo(x, 40 + i * 24 + Math.sin(x * .012 + t * .8 + i) * 14); ctx.stroke(); }
    ctx.restore();
  } else {
    const sx = 500 - camX * .02, sy = 70;
    const sg = ctx.createRadialGradient(sx, sy, 6, sx, sy, 90); sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(.25, 'rgba(255,240,180,.8)'); sg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - 90, sy - 90, 180, 180);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 6; i++) { const cx = ((i * 260 - camX * .08 - t * 6) % 1560 + 1560) % 1560 - 160, cy = 30 + (i * 37) % 80; circle(cx, cy, 16); ctx.fill(); circle(cx + 18, cy - 6, 20); ctx.fill(); circle(cx + 40, cy, 15); ctx.fill(); ell(cx + 20, cy + 6, 34, 9); ctx.fill(); }
  }
  const fx = -((camX * .15) % 1280), mx = -((camX * .45) % 1280);
  ctx.drawImage(bgFar, fx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgFar, fx + 1280, 0, 1280, FLOOR_TOP);
  ctx.drawImage(bgMid, mx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgMid, mx + 1280, 0, 1280, FLOOR_TOP);
  drawFloor(themeId, th, camX, t);
}
function drawFloor(themeId, th, camX, t) {
  const fg = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH);
  fg.addColorStop(0, th.floorA); fg.addColorStop(1, th.floorB);
  ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_TOP - 4, VW, VH - FLOOR_TOP + 4);
  const off = (n) => ((-camX) % n + n) % n - n;
  if (themeId === 'bloom') {
    // a hedge along the back edge, a cobbled path, scattered flowers
    for (let x = off(56); x < VW + 56; x += 56) { ctx.fillStyle = '#3FAE55'; circle(x, FLOOR_TOP - 4, 20); ctx.fill(); circle(x + 26, FLOOR_TOP - 8, 22); ctx.fill(); ctx.fillStyle = '#FF7FC8'; circle(x + 10, FLOOR_TOP - 14, 3); ctx.fill(); ctx.fillStyle = '#FFE46B'; circle(x + 34, FLOOR_TOP - 20, 3); ctx.fill(); }
    ctx.fillStyle = th.path; ctx.fillRect(0, FLOOR_TOP + 36, VW, 52);
    for (let row = 0; row < 3; row++) for (let x = off(40) + row * 13; x < VW + 40; x += 40) { ctx.fillStyle = row % 2 ? '#EBCB8E' : '#F7E2B4'; ell(x, FLOOR_TOP + 46 + row * 16, 16, 6); ctx.fill(); }
    for (let x = off(90); x < VW + 90; x += 90) { [[0, 22, '#FF5C8A'], [30, 100, '#FFE46B'], [60, 18, '#B36BFF']].forEach(([dx, dy, c]) => { ctx.fillStyle = '#3F9E45'; ctx.fillRect(x + dx, FLOOR_TOP + dy, 2, 7); ctx.fillStyle = c; circle(x + dx + 1, FLOOR_TOP + dy, 3.5); ctx.fill(); ctx.fillStyle = '#FFF'; circle(x + dx + 1, FLOOR_TOP + dy, 1.2); ctx.fill(); }); }
  } else if (themeId === 'sky') {
    // brass railing and polished tiles with teal inlays
    ctx.fillStyle = '#C98B2A'; ctx.fillRect(0, FLOOR_TOP - 22, VW, 4); ctx.fillRect(0, FLOOR_TOP - 6, VW, 6);
    for (let x = off(36); x < VW + 36; x += 36) { ctx.fillRect(x, FLOOR_TOP - 22, 4, 18); }
    for (let row = 0, y = FLOOR_TOP; y < VH; row++, y += 18 + row * 3) {
      ctx.fillStyle = 'rgba(184,138,58,.35)'; ctx.fillRect(0, y, VW, 1.5);
      for (let x = off(64) + (row % 2) * 32; x < VW + 64; x += 64) { ctx.fillRect(x, y, 1.5, 18 + row * 3); ctx.fillStyle = 'rgba(60,198,192,.45)'; ctx.beginPath(); ctx.moveTo(x + 32, y + 4); ctx.lineTo(x + 38, y + 10); ctx.lineTo(x + 32, y + 16); ctx.lineTo(x + 26, y + 10); ctx.fill(); ctx.fillStyle = 'rgba(184,138,58,.35)'; }
    }
  } else {
    // crystal curb and iridescent tiles with glowing seams
    for (let x = off(30); x < VW + 30; x += 30) { ctx.fillStyle = `hsl(${(x + camX) * .5 % 360},80%,72%)`; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.lineTo(x + 8, FLOOR_TOP - 18); ctx.lineTo(x + 16, FLOOR_TOP); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let row = 0, y = FLOOR_TOP + 4; y < VH; row++, y += 20 + row * 3) {
      ctx.fillStyle = `hsla(${(t * 40 + row * 50) % 360},90%,70%,.35)`; ctx.fillRect(0, y, VW, 2);
      for (let x = off(70) + (row % 2) * 35; x < VW + 70; x += 70) ctx.fillRect(x, y, 2, 20 + row * 3);
    }
    ctx.restore();
  }
}
