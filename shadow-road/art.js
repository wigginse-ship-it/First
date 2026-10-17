'use strict';
// ---------- palette & drawing helpers ----------
const OUT = '#2A1B2C';          // warm dark ink used for every outline
let FLASH = false;              // when true, every color helper returns white (hit flash)
const C = (c) => FLASH ? '#FFFFFF' : c;
function outline(w = 1.6) { ctx.lineWidth = w; ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.stroke(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function limb(pts, col, w) { // a thick round-capped limb with an outline
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = FLASH ? '#fff' : OUT; ctx.lineWidth = w + 2.2; ctx.stroke();
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
}
function shadow(x, y, rx) { ctx.fillStyle = 'rgba(40,20,80,.28)'; ell(x, y, rx, rx * .28); ctx.fill(); }

// ---------- weapons (drawn in hand space: the hand is at (16,0), pointing along +x) ----------
function drawWeapon(kind, pose) {
  if (kind === 'fists' || !kind) { circle(17, 0, 4.5); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); outline(1.5); return; }
  if (kind === 'hammer') {
    limb([4, 0, 44, 0], '#9A6234', 4);
    rrect(36, -12, 18, 24, 4); ctx.fillStyle = C('#8E9BB8'); ctx.fill(); outline();
    ctx.fillStyle = C('#D8AA55'); ctx.fillRect(43, -12, 4, 24);
    ctx.fillStyle = C('#8FB8D8'); circle(45, 0, 2.6); ctx.fill();
    circle(17, 0, 4); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); return;
  }
  if (kind === 'staff') {
    limb([-28, 0, 58, 0], '#B56B2E', 3.5);
    ctx.fillStyle = C('#D8AA55'); ctx.fillRect(-30, -2.5, 6, 5); ctx.fillRect(54, -2.5, 6, 5);
    ctx.strokeStyle = C('#C8607A'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-34, 8, -38 + Math.sin(performance.now() / 120) * 3, 14); ctx.stroke();
    circle(17, 0, 4); ctx.fillStyle = C('#FFF1E0'); ctx.fill(); return;
  }
  if (kind === 'sword' || kind === 'blade' || kind === 'prism') {
    const len = kind === 'sword' ? 64 : 44;
    const bc = kind === 'prism' ? '#C9F6FF' : kind === 'blade' ? '#BFF5EF' : '#E8F0FF';
    limb([6, 0, 17, 0], '#5A3A2A', 4);
    rrect(16, -9, 4, 18, 2); ctx.fillStyle = C('#D8AA55'); ctx.fill(); outline(1.5);
    ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(20 + len, -3); ctx.lineTo(26 + len, 0); ctx.lineTo(20 + len, 3); ctx.lineTo(20, 5); ctx.closePath();
    ctx.fillStyle = C(bc); ctx.fill(); outline(1.8);
    ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(22, -3, len - 4, 1.4);
    if (pose && pose.glow) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55;
      ctx.fillStyle = pose.glow; rrect(16, -10, len + 14, 20, 8); ctx.fill(); ctx.restore();
    }
    return;
  }
  if (kind === 'dagger') { limb([6, 0, 17, 0], '#4A3A2A', 3.5); ctx.beginPath(); ctx.moveTo(18, -3); ctx.lineTo(36, 0); ctx.lineTo(18, 3); ctx.closePath(); ctx.fillStyle = C('#D8DCE6'); ctx.fill(); outline(1.2); return; }
  if (kind === 'bow') { ctx.strokeStyle = C('#6E4A2A'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(10, 0, 18, -1.3, 1.3); ctx.stroke(); ctx.strokeStyle = C('#E8E0D0'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.3) * 18, Math.sin(-1.3) * 18); ctx.lineTo(2, 0); ctx.lineTo(10 + Math.cos(1.3) * 18, Math.sin(1.3) * 18); ctx.stroke(); circle(17, 0, 4); ctx.fillStyle = C('#E8C4A4'); ctx.fill(); return; }
  if (kind === 'rifle') { rrect(2, -3, 34, 6, 2); ctx.fillStyle = C('#5A4A3E'); ctx.fill(); outline(1.4); ctx.fillStyle = C('#9A7038'); ctx.fillRect(14, -4.5, 12, 2); ctx.fillStyle = C('#9FD8E8'); circle(36, 0, 2.2); ctx.fill(); return; }
  if (kind === 'orb') { limb([4, 0, 30, 0], '#3A3050', 3); ctx.save(); if (!FLASH) { ctx.shadowColor = '#9FE8F0'; ctx.shadowBlur = 10; } circle(33, 0, 6); ctx.fillStyle = C('#BFF0F5'); ctx.fill(); ctx.restore(); return; }
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
  // long hair streams behind the head
  if (look.longHair) {
    const flow = (pose.flow || 0) * .8 + Math.abs(sw) * 2;
    ctx.beginPath(); ctx.moveTo(-4, -64 + cr); ctx.quadraticCurveTo(-14 - flow, -56 + cr, -12 - flow * 1.3, -38 + cr + Math.sin(walk * .7) * 2);
    ctx.lineTo(-6, -44 + cr); ctx.quadraticCurveTo(-6, -54 + cr, 0, -60 + cr); ctx.closePath(); ctx.fillStyle = C(look.hair); ctx.fill(); outline(1.4);
  }
  // tattered coat tails swing from the waist
  if (look.coat) {
    const flow = (pose.flow || 0) + Math.abs(sw) * 5;
    for (const [dx, k] of [[-2, 1], [3, .7]]) {
      ctx.beginPath(); ctx.moveTo(dx - 6, -30 + cr); ctx.quadraticCurveTo(dx - 12 - flow * k, -16 + cr, dx - 14 - flow * 1.5 * k, -4 + Math.sin(walk + dx) * 2);
      ctx.lineTo(dx - 10 - flow * k, -8); ctx.lineTo(dx - 8 - flow * k * .8, -2); ctx.lineTo(dx - 4, -10 + cr * .5); ctx.lineTo(dx + 2, -28 + cr); ctx.closePath();
      ctx.fillStyle = C(k === 1 ? look.coat : look.coat2 || look.coat); ctx.fill(); outline(1.4);
    }
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
    if (look.chain) { ctx.strokeStyle = C(look.trim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-8, -26 + cr); ctx.quadraticCurveTo(-2, -20 + cr, 6, -25 + cr); ctx.stroke(); }
  }
  // head
  const hy = -58 + cr;
  if (look.robot) {
    rrect(-8, hy - 8, 17, 15, 4); ctx.fillStyle = C(look.helm); ctx.fill(); outline();
    ctx.fillStyle = C(look.visor); ctx.fillRect(1, hy - 3, 8, 3.5);
    if (look.plume) { ctx.fillStyle = C(look.plume); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.quadraticCurveTo(-14, hy - 18, -20, hy - 8); ctx.quadraticCurveTo(-12, hy - 10, -6, hy - 4); ctx.fill(); }
  } else {
    circle(1, hy, 8.5); ctx.fillStyle = C(look.skin); ctx.fill(); outline();
    if (look.hood) { // a deep hood hides the face in shadow
      ctx.fillStyle = C(look.hood); ctx.beginPath(); ctx.moveTo(-10, hy + 7); ctx.quadraticCurveTo(-12, hy - 12, 2, hy - 12); ctx.quadraticCurveTo(12, hy - 10, 10, hy + 2); ctx.lineTo(4, hy + 1); ctx.quadraticCurveTo(2, hy - 6, -4, hy - 2); ctx.lineTo(-5, hy + 8); ctx.closePath(); ctx.fill(); outline(1.4);
    } else {
      ctx.fillStyle = C(look.hair); ctx.beginPath(); ctx.arc(0, hy - 1, 9, Math.PI * .95, Math.PI * 2.05); ctx.lineTo(-8, hy + 6); ctx.closePath(); ctx.fill();
      if (look.fringe) { ctx.beginPath(); ctx.moveTo(2, hy - 9); ctx.quadraticCurveTo(10, hy - 6, 8, hy + 2); ctx.lineTo(5, hy - 3); ctx.closePath(); ctx.fill(); }
    }
    if (look.crown) { ctx.fillStyle = C(look.crown); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.lineTo(-4, hy - 13); ctx.lineTo(-1, hy - 9); ctx.lineTo(2, hy - 14); ctx.lineTo(4, hy - 9); ctx.lineTo(6, hy - 12); ctx.lineTo(7, hy - 7); ctx.closePath(); ctx.fill(); }
    if (look.mask) { ctx.fillStyle = C(look.mask); ctx.fillRect(-1, hy + 1, 9, 4); }
    if (look.eye) { ctx.save(); if (!FLASH) { ctx.shadowColor = look.eye; ctx.shadowBlur = 6; } ctx.fillStyle = C(look.eye); ctx.fillRect(4, hy - 1.5, 3, 2.2); ctx.restore(); }
    else { ctx.fillStyle = C(OUT); ctx.fillRect(4.5, hy - 1, 2, 3); }
  }
  // front arm + weapon
  const arm = pose.arm ?? (1.1 + sw * .35);
  if (pose.trail) drawTrail(0, -45 + cr, pose);
  ctx.save(); ctx.translate(1, -45 + cr); ctx.rotate(arm);
  limb([0, 0, 15, 0], look.sleeve || look.body, 5.5);
  drawWeapon(pose.weapon || look.weapon, pose);
  ctx.restore();
  if (look.pauldron) { ctx.beginPath(); ctx.ellipse(1, -45 + cr, 8, 6, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); ctx.fillStyle = C(look.pauldron); ctx.fill(); outline(1.4); ctx.fillStyle = C(look.trim); ctx.fillRect(-4, -47 + cr, 9, 1.5); }
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
// the fallen prince of shadow: pale, raven-haired, a torn coat and one blackened pauldron, a violet ember for an eye
const HERO = { skin: '#D9CCD2', hair: '#1C1726', longHair: 1, fringe: 1, body: '#2A2433', sleeve: '#231E2C', trim: '#9A96AE', legs: '#1C1824', boots: '#2E2630', coat: '#2F2838', coat2: '#3A3046', pauldron: '#3E3A4C', eye: '#B89CFF', chain: 1 };
// human enemies, a third of every world
const HUMANS = {
  bandit:   { skin: '#C9A07E', hood: '#5A6A3E', body: '#6E5A3E', sleeve: '#5A4A34', trim: '#A88A5A', legs: '#3E3428', boots: '#2E2418', mask: '#3A3428', weapon: 'dagger' },
  archer:   { skin: '#D2AE8C', hood: '#3E5A4A', body: '#4E6A52', sleeve: '#3E5642', trim: '#C9B07A', legs: '#2E3A30', boots: '#2A2418', weapon: 'bow' },
  corsair:  { skin: '#C0906E', hair: '#2A1E1A', body: '#8A3A3A', sleeve: '#6E2E2E', trim: '#D8AA55', legs: '#2E2A38', boots: '#3A2418', mask: '#2A2030', weapon: 'blade' },
  gunner:   { skin: '#D8B898', hair: '#5A3A2A', body: '#3E5A70', sleeve: '#344C5E', trim: '#C9A060', legs: '#2A2E3A', boots: '#2E2418', weapon: 'rifle', pauldron: '#8A6A3A' },
  cultist:  { skin: '#B8A0C0', hood: '#4A2A5A', body: '#3A2048', sleeve: '#30183C', trim: '#C878A8', legs: '#24142E', boots: '#1A0E20', eye: '#E8A0D8', weapon: 'prism' },
  witch:    { skin: '#D8C0D0', hood: '#2E3A6A', body: '#283460', sleeve: '#222C52', trim: '#8CC8D0', legs: '#1A2040', boots: '#141830', eye: '#9FE8F0', weapon: 'orb' },
};
const KNIGHT = { robot: 1, body: '#B88A48', sleeve: '#9A7038', trim: '#4E9A90', legs: '#6A4A28', boots: '#43301C', helm: '#C99B55', visor: '#9FF0E8', core: '#9FF0E8', plume: '#4E9A90', weapon: 'blade' };
const KNIGHT_MOSS = { robot: 1, body: '#7E8A6A', sleeve: '#6A7458', trim: '#5E8A52', legs: '#4A503E', boots: '#33382A', helm: '#8A9474', visor: '#EED48A', core: '#EED48A', plume: '#5E8A52', weapon: 'blade' };
const COLOSSUS = { robot: 1, body: '#A87A3A', sleeve: '#8A6030', trim: '#3E8A84', legs: '#5A3E22', boots: '#3A2816', helm: '#C2934E', visor: '#E86A80', core: '#F08A9A', plume: '#B8445A', weapon: 'cannon', cape: '#2E5E62' };

// ---------- worlds (painted in layers: far ridges fade into the sky, near things are rich and dark) ----------
const THEMES = {
  bloom: { name: 'golden hour', sky: ['#2F3D6B', '#7D6FA0', '#E2A487', '#F6D9A8'], sun: [0.78, 0.36, '255,214,150'], haze: '232,190,160',
    floorA: '#6E7E4A', floorB: '#3E5134', path: '#B89A72', grade: { desat: .22, top: 'rgba(70,90,170,.45)', bot: 'rgba(240,160,90,.45)', vig: 'rgba(40,20,50,.55)' } },
  sky:   { sky: ['#283560', '#5A6A9E', '#D69479', '#F2C99C'], sun: [0.2, 0.42, '255,200,160'], haze: '220,180,170',
    floorA: '#A08868', floorB: '#6E5C48', path: '#5E8F88', grade: { desat: .25, top: 'rgba(60,80,160,.45)', bot: 'rgba(230,150,100,.42)', vig: 'rgba(30,20,45,.55)' } },
  prism: { sky: ['#120E2A', '#33225C', '#723873', '#B8607A'], sun: [0.5, 0.25, '200,170,255'], haze: '150,110,190',
    floorA: '#3A2E58', floorB: '#1C1630', path: '#7FC7C9', grade: { desat: .18, top: 'rgba(60,70,190,.5)', bot: 'rgba(200,90,130,.4)', vig: 'rgba(10,6,25,.6)' } },
};
let bgFar = null, bgMid = null, bgKey = '', grain = null;
function makeLayer(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); const g = c.getContext('2d'); g.scale(K, K); return [c, g]; }
function dab(x, y, r, col, a = 1) { // a brush dab; its shape comes from its position so it never flickers
  const h = Math.abs(Math.sin(x * 12.99 + y * 78.23)) * 1000 % 1;
  ctx.globalAlpha = a; ctx.fillStyle = col; ell(x, y, r, r * (.72 + h * .28), h * 3); ctx.fill(); ctx.globalAlpha = 1;
}
function softDab(x, y, r, rgb, a) { // a feathered puff of color, for clouds and nebulae
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.55, `rgba(${rgb},${a * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function ridge(y0, amp, freq, col, seed) { // a hazy mountain ridge
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP);
  for (let x = 0; x <= 1280; x += 16) ctx.lineTo(x, y0 + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.7 + seed * 2) * amp * .35);
  ctx.lineTo(1280, FLOOR_TOP); ctx.fill();
}
function hazeBand(g, col, y0, y1, a) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`); g.fillStyle = gr; g.fillRect(0, y0, 1280, y1 - y0); }
function paintTree(x, base, h, rnd, greens, glow) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2A2226'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 6, base - h * .5, x + 4, base - h * .8); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 1, base - h * .55); ctx.quadraticCurveTo(x + 18, base - h * .7, x + 26, base - h * .82); ctx.stroke();
  for (let i = 0; i < 26; i++) { // canopy painted with overlapping dabs, lit from the upper right
    const a = rnd() * TAU, d = rnd() * 30, cx = x + 4 + Math.cos(a) * d * 1.3, cy = base - h * .86 + Math.sin(a) * d * .8;
    dab(cx, cy, 9 + rnd() * 9, greens[Math.floor(rnd() * 2)], .9);
  }
  for (let i = 0; i < 10; i++) dab(x + 10 + rnd() * 26, base - h * .95 + rnd() * 26, 4 + rnd() * 6, greens[2], .55);
  if (glow) for (let i = 0; i < 5; i++) { const gx = x - 20 + rnd() * 50, gy = base - h * .8 + rnd() * 30; ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 8; dab(gx, gy, 2.2, glow, .95); ctx.restore(); }
}
function buildBackground(themeId, seed) {
  const key = themeId + K + seed; if (key === bgKey) return; bgKey = key;
  const rnd = mulberry(seed), th = THEMES[themeId];
  const [fc, f] = makeLayer(1280, FLOOR_TOP), [mc, m] = makeLayer(1280, FLOOR_TOP);
  const old = ctx;
  if (themeId === 'bloom') {
    ctx = f;
    ridge(150, 26, .006, '#8C86AE', 1); hazeBand(f, th.haze, 120, FLOOR_TOP, .55);
    for (let i = 0; i < 5; i++) { // drifting islands with thin falls of water
      const x = 120 + i * 250 + rnd() * 60, y = 60 + rnd() * 50, w = 60 + rnd() * 50;
      ctx.fillStyle = '#7E7AA0'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y + w * .9, x + w / 2, y); ctx.fill();
      for (let j = 0; j < 8; j++) dab(x - w / 2 + rnd() * w, y - 4 - rnd() * 10, 6 + rnd() * 6, '#6E8A86', .9);
      const wf = ctx.createLinearGradient(0, y, 0, y + 110); wf.addColorStop(0, 'rgba(240,235,255,.35)'); wf.addColorStop(1, 'rgba(240,235,255,0)'); ctx.fillStyle = wf; ctx.fillRect(x + w * .15, y + 6, 2, 110);
    }
    ridge(178, 18, .009, '#6F7E8E', 3); hazeBand(f, th.haze, 160, FLOOR_TOP, .45);
    ctx = m;
    ridge(205, 10, .012, '#4E6656', 5);
    for (let i = 0; i < 9; i++) paintTree(rnd() * 1280, FLOOR_TOP, 120 + rnd() * 70, rnd, ['#2F5446', '#3D6A52', '#C9C57E'], i % 2 ? '#F2C9A0' : null);
    for (let i = 0; i < 3; i++) { // an old stone arch overgrown with ivy
      const x = 200 + i * 420 + rnd() * 60;
      ctx.fillStyle = '#6A6470'; ctx.fillRect(x, FLOOR_TOP - 70, 12, 70); ctx.fillRect(x + 58, FLOOR_TOP - 70, 12, 70);
      ctx.beginPath(); ctx.arc(x + 35, FLOOR_TOP - 70, 35, Math.PI, 0); ctx.arc(x + 35, FLOOR_TOP - 70, 23, 0, Math.PI, true); ctx.fill();
      for (let j = 0; j < 14; j++) dab(x + rnd() * 70, FLOOR_TOP - 100 + rnd() * 70, 3 + rnd() * 4, '#3D6A52', .9);
    }
  } else if (themeId === 'sky') {
    ctx = f;
    ridge(160, 14, .005, '#8C7FA6', 2); hazeBand(f, th.haze, 120, FLOOR_TOP, .5);
    for (let i = 0; i < 10; i++) { // far towers, lamps already lit
      const x = i * 130 + rnd() * 40, w = 22 + rnd() * 20, h = 80 + rnd() * 80;
      ctx.fillStyle = '#6E6A8E'; ctx.fillRect(x, FLOOR_TOP - h, w, h);
      ctx.beginPath(); ctx.arc(x + w / 2, FLOOR_TOP - h, w / 2, Math.PI, 0); ctx.fillStyle = '#5E7E86'; ctx.fill();
      for (let y = FLOOR_TOP - h + 12; y < FLOOR_TOP - 8; y += 16) if (rnd() < .6) { ctx.save(); ctx.shadowColor = '#FFD9A0'; ctx.shadowBlur = 6; ctx.fillStyle = '#FFE2B0'; ctx.fillRect(x + w / 2 - 2, y, 4, 6); ctx.restore(); }
    }
    for (let i = 0; i < 3; i++) { // airships against the dusk
      const x = 220 + i * 420 + rnd() * 60, y = 50 + rnd() * 40;
      ctx.fillStyle = '#5E5272'; ell(x, y, 46, 14); ctx.fill(); ctx.fillStyle = '#7A6A86'; ell(x - 4, y - 5, 34, 5); ctx.fill();
      ctx.fillStyle = '#4A3E58'; rrect(x - 14, y + 14, 28, 7, 3); ctx.fill();
      ctx.save(); ctx.shadowColor = '#FFC98A'; ctx.shadowBlur = 8; ctx.fillStyle = '#FFD9A0'; circle(x + 10, y + 18, 2); ctx.fill(); ctx.restore();
    }
    hazeBand(f, th.haze, 150, FLOOR_TOP, .4);
    ctx = m;
    for (let i = 0; i < 6; i++) { // weathered gears on iron pillars
      const x = 80 + i * 220 + rnd() * 50, y = FLOOR_TOP - 70 - rnd() * 40, r = 22 + rnd() * 14;
      ctx.fillStyle = '#3E3A46'; ctx.fillRect(x - 5, y, 10, FLOOR_TOP - y);
      ctx.fillStyle = '#8A6A3E'; for (let k = 0; k < 10; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k / 10 * TAU); ctx.fillRect(r - 2, -4, 8, 8); ctx.restore(); }
      circle(x, y, r); ctx.fill(); ctx.fillStyle = '#A8844A'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.7); ctx.lineTo(x, y); ctx.fill();
      ctx.fillStyle = '#4E7A74'; circle(x, y, r * .35); ctx.fill();
    }
  } else {
    ctx = f;
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,245,255,${.3 + rnd() * .6})`; circle(rnd() * 1280, rnd() * 140, rnd() * 1.2 + .3); ctx.fill(); }
    for (let i = 0; i < 7; i++) softDab(rnd() * 1280, 40 + rnd() * 80, 80 + rnd() * 70, ['110,80,190', '170,70,150', '60,110,180'][i % 3], .35);
    for (let i = 0; i < 14; i++) { // drifting crystals, glowing from inside
      const x = rnd() * 1280, y = 30 + rnd() * 120, s = 8 + rnd() * 18, hue = [190, 280, 330, 45][i % 4];
      ctx.save(); ctx.shadowColor = `hsl(${hue},70%,70%)`; ctx.shadowBlur = 14;
      ctx.fillStyle = `hsla(${hue},45%,62%,.9)`; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .55, y); ctx.lineTo(x, y + s * 1.2); ctx.lineTo(x - s * .55, y); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .55, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    }
    ridge(185, 20, .007, '#3A2A5E', 4); hazeBand(f, th.haze, 150, FLOOR_TOP, .35);
    ctx = m;
    for (let i = 0; i < 11; i++) { // crystal spires
      const x = rnd() * 1280, h = 50 + rnd() * 110, w = 14 + rnd() * 16, hue = [190, 280, 330, 170][i % 4];
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, `hsl(${hue},35%,30%)`); g.addColorStop(.6, `hsl(${hue},45%,52%)`); g.addColorStop(1, `hsl(${hue},55%,72%)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, FLOOR_TOP); ctx.lineTo(x - w / 2, FLOOR_TOP - h); ctx.lineTo(x, FLOOR_TOP - h - w); ctx.lineTo(x + w / 2, FLOOR_TOP - h); ctx.lineTo(x + w / 2, FLOOR_TOP); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.shadowColor = `hsl(${hue},80%,75%)`; ctx.shadowBlur = 10; ctx.fillStyle = `hsla(${hue},80%,85%,.7)`; ctx.fillRect(x + w / 2 - 3, FLOOR_TOP - h, 1.5, h * .8); ctx.restore();
    }
  }
  ctx = old;
  bgFar = fc; bgMid = mc;
  if (!grain) { // canvas-and-brush texture laid over the whole picture
    grain = document.createElement('canvas'); grain.width = grain.height = 256;
    const g = grain.getContext('2d'), r2 = mulberry(7);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const v = Math.floor(100 + r2() * 56); g.fillStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.ellipse(r2() * 256, r2() * 256, 2 + r2() * 9, 1 + r2() * 3, r2() * 3, 0, TAU); g.fill(); }
  }
}
function drawWorld(themeId, camX, t) {
  const th = THEMES[themeId];
  const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP);
  g.addColorStop(0, th.sky[0]); g.addColorStop(.45, th.sky[1]); g.addColorStop(.82, th.sky[2]); g.addColorStop(1, th.sky[3]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP);
  const sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
  const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 160); sg.addColorStop(0, `rgba(${th.sun[2]},.95)`); sg.addColorStop(.15, `rgba(${th.sun[2]},.5)`); sg.addColorStop(1, `rgba(${th.sun[2]},0)`);
  ctx.fillStyle = sg; ctx.fillRect(sx - 160, sy - 160, 320, 320);
  if (themeId === 'prism') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `hsla(${170 + i * 60 + Math.sin(t * .3) * 20},60%,60%,.12)`; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(-20, 80 + i * 24); for (let x = 0; x <= VW + 40; x += 40) ctx.lineTo(x, 80 + i * 24 + Math.sin(x * .01 + t * .5 + i) * 16); ctx.stroke(); }
    ctx.restore();
  } else {
    for (let i = 0; i < 5; i++) { // soft painted clouds catching the low sun
      const cx = ((i * 300 - camX * .06 - t * 4) % 1500 + 1500) % 1500 - 200, cy = Y_OFF + 20 + (i * 41) % 70;
      softDab(cx, cy, 60, th.haze, .45); softDab(cx + 50, cy - 10, 48, '255,236,220', .4); softDab(cx + 100, cy + 4, 44, th.haze, .35);
    }
  }
  const fx = -((camX * .15) % 1280), mx = -((camX * .45) % 1280);
  ctx.drawImage(bgFar, fx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgFar, fx + 1280, 0, 1280, FLOOR_TOP);
  ctx.drawImage(bgMid, mx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgMid, mx + 1280, 0, 1280, FLOOR_TOP);
  // the low sun washes warm light over the middle distance
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const wash = ctx.createRadialGradient(sx, sy, 10, sx, sy, VW * .7); wash.addColorStop(0, `rgba(${th.sun[2]},.22)`); wash.addColorStop(1, `rgba(${th.sun[2]},0)`);
  ctx.fillStyle = wash; ctx.fillRect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF);
  ctx.restore();
  drawFloor(themeId, th, camX, t);
}
function drawFloor(themeId, th, camX, t) {
  const fg = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH);
  fg.addColorStop(0, th.floorA); fg.addColorStop(1, th.floorB);
  ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_TOP - 4, VW, VH - FLOOR_TOP + 4);
  const off = (n) => ((-camX) % n + n) % n - n;
  const hsh = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }; // stable per-tile randomness
  if (themeId === 'bloom') {
    for (let x = off(46); x < VW + 46; x += 46) { const w = Math.floor((x + camX) / 46); dab(x, FLOOR_TOP - 6, 22, '#2F5446', 1); dab(x + 22, FLOOR_TOP - 10, 18, '#3D6A52', 1); if (hsh(w) > .6) { ctx.save(); ctx.shadowColor = '#F2C9A0'; ctx.shadowBlur = 6; dab(x + 12, FLOOR_TOP - 18, 2.5, '#F6D6B8', 1); ctx.restore(); } }
    const pg = ctx.createLinearGradient(0, FLOOR_TOP + 30, 0, FLOOR_TOP + 92); pg.addColorStop(0, 'rgba(184,154,114,0)'); pg.addColorStop(.3, 'rgba(184,154,114,.85)'); pg.addColorStop(.75, 'rgba(160,128,92,.85)'); pg.addColorStop(1, 'rgba(160,128,92,0)');
    ctx.fillStyle = pg; ctx.fillRect(0, FLOOR_TOP + 30, VW, 62);
    for (let x = off(34); x < VW + 34; x += 34) { const w = Math.floor((x + camX) / 34); dab(x + hsh(w) * 20, FLOOR_TOP + 46 + hsh(w + 1) * 36, 6 + hsh(w + 2) * 6, hsh(w + 3) > .5 ? '#C9AE86' : '#9A7E5E', .55); }
    for (let x = off(28); x < VW + 28; x += 28) { const w = Math.floor((x + camX) / 28); ctx.strokeStyle = hsh(w) > .5 ? '#86A05E' : '#506E40'; ctx.lineWidth = 1.5; const gy = FLOOR_TOP + 10 + hsh(w + 5) * 22; ctx.beginPath(); ctx.moveTo(x, gy + 6); ctx.lineTo(x + 2, gy - 2); ctx.moveTo(x + 4, gy + 6); ctx.lineTo(x + 7, gy); ctx.stroke(); if (hsh(w + 9) > .7) dab(x + 3, gy - 3, 2.2, hsh(w + 4) > .5 ? '#D98CA0' : '#F0E0C0', 1); }
    for (let x = off(40); x < VW + 40; x += 40) { const w = Math.floor((x + camX) / 40); dab(x + hsh(w) * 30, VH - 14 + hsh(w + 1) * 10, 10 + hsh(w + 2) * 8, '#33482C', .6); }
  } else if (themeId === 'sky') {
    ctx.fillStyle = '#4A3E46'; ctx.fillRect(0, FLOOR_TOP - 22, VW, 3); ctx.fillRect(0, FLOOR_TOP - 6, VW, 6);
    for (let x = off(36); x < VW + 36; x += 36) ctx.fillRect(x, FLOOR_TOP - 22, 3, 18);
    for (let row = 0, y = FLOOR_TOP; y < VH; row++, y += 18 + row * 3) {
      ctx.fillStyle = 'rgba(60,44,40,.35)'; ctx.fillRect(0, y, VW, 1.2);
      for (let x = off(64) + (row % 2) * 32; x < VW + 64; x += 64) {
        const w = Math.floor((x + camX) / 64) + row * 31;
        ctx.fillStyle = 'rgba(60,44,40,.3)'; ctx.fillRect(x, y, 1.2, 18 + row * 3);
        dab(x + 32, y + 9, 10, hsh(w) > .5 ? 'rgba(200,170,130,.35)' : 'rgba(110,90,70,.25)', 1);
        if (hsh(w + 3) > .65) dab(x + 20, y + 10, 4, 'rgba(94,143,136,.6)', 1);
      }
    }
  } else {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let x = off(90); x < VW + 90; x += 90) { // glowing veins in the obsidian
      const w = Math.floor((x + camX) / 90), y0 = FLOOR_TOP + 8 + hsh(w) * 80;
      ctx.strokeStyle = `hsla(${hsh(w + 1) > .5 ? 180 : 320},70%,65%,${.25 + .15 * Math.sin(t * 2 + w)})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 24, y0 + 6); ctx.lineTo(x + 40, y0 - 2); ctx.lineTo(x + 70, y0 + 8); ctx.stroke();
    }
    ctx.restore();
    for (let x = off(30); x < VW + 30; x += 30) { const w = Math.floor((x + camX) / 30); ctx.fillStyle = `hsl(${[190, 280, 330][w % 3 < 0 ? 0 : w % 3]},30%,${40 + hsh(w) * 15}%)`; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.lineTo(x + 7, FLOOR_TOP - 10 - hsh(w) * 10); ctx.lineTo(x + 14, FLOOR_TOP); ctx.fill(); }
  }
}
// a final pass that grades the whole frame like a painting: calmer saturation, warm/cool light, canvas texture, vignette
function gradeFrame(themeId) {
  const gd = THEMES[themeId].grade, y = Y_OFF, h = VIEW_H;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${gd.desat})`; ctx.fillRect(0, y, VW, h);
  ctx.globalCompositeOperation = 'soft-light';
  const lg = ctx.createLinearGradient(0, y, 0, y + h); lg.addColorStop(0, gd.top); lg.addColorStop(1, gd.bot); ctx.fillStyle = lg; ctx.fillRect(0, y, VW, h);
  if (grain) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .28; ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, y, VW, h); ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'multiply';
  const vg = ctx.createRadialGradient(VW / 2, y + h * .55, h * .45, VW / 2, y + h * .55, VW * .72); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, gd.vig);
  ctx.fillStyle = vg; ctx.fillRect(0, y, VW, h);
  ctx.restore();
}
