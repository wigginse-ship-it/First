'use strict';
const TRAIL = { fists: 'rgba(255,255,255,.9)', hammer: 'rgba(255,201,74,.95)', staff: 'rgba(72,229,194,.95)', sword: 'rgba(111,211,255,.95)' };
const ease = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function playerPose() {
  const w = WEAPONS[P.w], pose = { walk: P.walk, weapon: w.look };
  if (P.state === 'atk' || P.state === 'air') {
    const m = P.move, k = P.t / m.dur, arc = m.arc || [1, 1];
    const kk = k < m.h[0] ? 0 : k > m.h[1] ? 1 : (k - m.h[0]) / (m.h[1] - m.h[0]);
    pose.arm = lerp(arc[0], arc[1], kk); pose.walk = 0;
    if (m.kick) { pose.kick = 1; pose.arm = -.5; }
    if (m.crouch || m.dive) pose.crouch = 1;
    if (m.rot) pose.rot = m.rot * ease(k / .75);
    if (k >= m.h[0] && k <= m.h[1] + .12 && !m.kick && Math.abs(arc[1] - arc[0]) > .1) {
      pose.trail = w.reach + 18; pose.trailFrom = arc[0];
      pose.trailCol = m.power === 2 ? 'rgba(255,201,74,.95)' : TRAIL[P.w]; pose.trailW = P.w === 'sword' || P.w === 'hammer' ? 9 : 6;
    }
    pose.lean = m.power ? .16 : .08;
    pose.flow = Math.abs(P.vx) * .02;
  } else if (P.state === 'charge') {
    pose.arm = -2.2; pose.crouch = 1; pose.walk = 0;
    pose.glow = ['', '#FFC94A', '#FFE9A0', '#FF6FB5'][P.clvl] || '';
    if (P.clvl && Math.sin(performance.now() / 45) > 0) pose.glow = '#FFFFFF';
  } else if (P.state === 'run') { pose.run = 1; pose.lean = .28; pose.flow = 8; pose.arm = 1.9; pose.backArm = 2.2; }
  else if (P.state === 'jump') { pose.crouch = 1; pose.arm = .2; pose.rot = P.vz < 0 ? 0 : 0; pose.flow = 4; }
  else if (P.state === 'dodge') { pose.crouch = 1; pose.arm = 1.4; pose.rot = -TAU * (1 - P.t / .34) * P.facing * P.facing; }
  else if (P.state === 'hurt') { pose.arm = -1; pose.lean = -.3; }
  else if (P.state === 'down' || (P.state === 'dead' && P.z <= 0)) pose.down = 1;
  else if (P.w === 'sword') pose.arm = .55;
  else if (P.w === 'hammer') pose.arm = .8;
  else if (P.w === 'staff') pose.arm = .9;
  return pose;
}
function humanEnemyPose(e) {
  const pose = { walk: e.walk };
  if (e.state === 'wind') pose.arm = e.plan === 'volley' || e.plan === 'shoot' ? 0 : -2.2;
  else if (e.state === 'strike') { pose.arm = 1.1; pose.lean = .2; pose.trail = 60; pose.trailFrom = -2.2; pose.trailCol = 'rgba(255,79,123,.9)'; }
  else if (e.state === 'dash') { pose.arm = .1; pose.lean = .4; pose.run = 1; }
  else if (e.state === 'leap') { pose.arm = -2.6; pose.crouch = 1; }
  else if (e.state === 'hurt') { pose.arm = -1; pose.lean = -.35; }
  else if (e.def.ranged) pose.arm = .1;
  return pose;
}
function drawPlayerAt(x, y, z, facing, pose, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(x, y - z); ctx.scale(facing, 1);
  drawHumanoid(HERO, pose);
  ctx.restore();
}
function drawEnemy(e, t) {
  if (e.state === 'dying' && e.t < .5 && Math.floor(t * 24) % 2) return;
  const scale = e.boss ? 1 : 1;
  const a = { walk: e.walk, t, wind: e.state === 'wind' ? 1 - e.t / e.windMax : 0, atk: ['strike', 'dash', 'pounce'].includes(e.state), hurt: ['hurt', 'down', 'dying'].includes(e.state) };
  if (e.def.draw === 'knight' || e.def.draw === 'colossus') { a.pose = humanEnemyPose(e); if (e.state === 'down' || (e.state === 'dying' && !e.air)) a.pose.down = 1; }
  shadow(e.x, e.y, e.hw * 1.1 * Math.max(.4, 1 - e.z / 200));
  const jx = e.jit > 0 ? rand(-3, 3) : 0;
  ctx.save();
  ctx.translate(e.x + jx, e.y - e.z);
  let rot = e.rotA || 0;
  if ((e.state === 'down' || (e.state === 'dying' && !e.air)) && !a.pose) rot = e.def.move === 'hop' ? 0 : -1.35;
  ctx.scale(e.facing, 1);
  if (rot) { ctx.translate(0, -e.hh * .5); ctx.rotate(rot * e.facing); ctx.translate(0, e.hh * .5); }
  ctx.scale(e.sqx * scale, e.sqy * scale);
  if (e.state === 'down' && e.def.move === 'hop') ctx.scale(1.3, .55);
  FLASH = e.flash > 0 || (e.state === 'wind' && e.t < .25 && Math.floor(t * 20) % 2 === 0);
  CREATURES[e.def.draw](e, a);
  FLASH = false;
  ctx.restore();
  if (stillT > 0 && !e.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(111,211,255,.3)'; ell(e.x, e.y - e.z - e.hh / 2, e.hw + 6, e.hh / 2 + 6); ctx.fill(); ctx.restore(); }
  if (e.state === 'wind') { // attack warning
    const y = e.y - e.z - e.hh - 16;
    ctx.fillStyle = '#FF4F7B'; circle(e.x, y, 9); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 13px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, y + 5);
  }
  if (!e.boss && !e.dead && e.hp < e.maxHp) {
    const w = 30 + e.hw, x = e.x - w / 2, y = e.y - e.z - e.hh - 10;
    ctx.fillStyle = 'rgba(28,18,64,.75)'; rrect(x - 2, y - 2, w + 4, 7, 3); ctx.fill();
    ctx.fillStyle = '#FF5A6E'; rrect(x, y, Math.max(0, w * e.hp / e.maxHp), 3, 1.5); ctx.fill();
  }
}
function drawLoot(k, t) {
  if (k.kind === 'weapon') { drawWeaponPickup(k, t); return; }
  const x = k.x, y = k.y - k.z - 6 - Math.sin(t * 6 + k.x) * 2;
  shadow(k.x, k.y, 5);
  if (k.kind === 'shard') {
    ctx.fillStyle = '#48E5C2'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); outline(1.5);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, y - 3, 1.5, 3);
  } else if (k.kind === 'sigil') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * .2);
    rrect(-6, -8, 12, 16, 2); ctx.fillStyle = '#FF6FB5'; ctx.fill(); outline(1.5);
    ctx.fillStyle = '#FFE46B'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * TAU / 5; ctx.lineTo(Math.cos(an) * 4, Math.sin(an) * 4); ctx.lineTo(Math.cos(an + TAU / 10) * 1.8, Math.sin(an + TAU / 10) * 1.8); } ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = '#48E5C2'; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.bezierCurveTo(x - 10, y - 2, x - 5, y - 9, x, y - 4); ctx.bezierCurveTo(x + 5, y - 9, x + 10, y - 2, x, y + 6); ctx.fill(); outline(1.5);
  }
}
function drawStag(s, t) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 70); g.addColorStop(0, 'rgba(191,245,255,.8)'); g.addColorStop(1, 'rgba(111,211,255,0)');
  ctx.fillStyle = g; circle(0, -40, 70); ctx.fill();
  ctx.strokeStyle = '#E6FBFF'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const ph = t * 24;
  [[-22, 0], [-14, 2], [14, 0], [22, 2]].forEach(([x, p]) => { ctx.beginPath(); ctx.moveTo(x, -34); ctx.lineTo(x + Math.sin(ph + p) * 12, 0); ctx.stroke(); });
  ctx.fillStyle = '#BFF5FF'; ell(0, -42, 30, 14); ctx.fill(); ell(30, -60, 9, 12, .5); ctx.fill();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, -70); ctx.lineTo(20, -96); ctx.lineTo(10, -104); ctx.moveTo(22, -88); ctx.lineTo(34, -100); ctx.moveTo(32, -70); ctx.lineTo(44, -92); ctx.lineTo(56, -96); ctx.stroke();
  ctx.restore();
}
function drawScene(t) {
  ctx.save();
  if (shakeMag > 0) ctx.translate(rand(-1, 1) * shakeMag + shakeDir * shakeMag * .4, rand(-1, 1) * shakeMag * .6);
  if (zoom > 0) { const px = P.x - camX, py = P.y - 40; ctx.translate(px, py); ctx.scale(1 + zoom, 1 + zoom); ctx.translate(-px, -py); }
  drawWorld(stage.theme, camX, t);
  ctx.translate(-camX, 0);
  // resting debris lies flat on the floor under everything
  for (const p of parts) if (p.rest) drawPart(p);
  const list = [];
  for (const p of props) list.push([p.y, () => { FLASH = p.flash > 0; p.kind === 'shrine' ? drawShrine(p, t) : drawPod(p, t); FLASH = false; }]);
  for (const k of loot) list.push([k.y, () => drawLoot(k, t)]);
  for (const e of enemies) list.push([e.y, () => drawEnemy(e, t)]);
  for (const g of ghosts) list.push([g.y - .1, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawPlayerAt(g.x, g.y, g.z, g.facing, g.pose, g.a * .6); ctx.restore(); }]);
  if (mirrorT > 0) list.push([P.y - .05, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawPlayerAt(P.x - P.facing * 34, P.y - 6, P.z, P.facing, playerPose(), .55); ctx.restore(); }]);
  list.push([P.y + .1, () => {
    shadow(P.x, P.y, 13 * Math.max(.5, 1 - P.z / 220));
    if (P.inv > 0 && !['dodge', 'down', 'dead'].includes(P.state) && Math.floor(t * 18) % 2) return;
    drawPlayerAt(P.x, P.y, P.z, P.facing, playerPose(), 1);
  }]);
  for (const p of projs) list.push([p.y, () => drawProj(p, t)]);
  if (stag) list.push([stag.y + .2, () => drawStag(stag, t)]);
  list.sort((a, b) => a[0] - b[0]).forEach(o => o[1]());
  for (const p of parts) if (!p.rest) drawPart(p);
  for (const f of fx) drawFx(f);
  ctx.textAlign = 'center';
  for (const n of nums) {
    const k = n.t / n.max, pop = 1 + Math.max(0, (k - .82) / .18) * .7;
    ctx.globalAlpha = Math.min(1, n.t * 3);
    ctx.font = `700 ${Math.round(n.size * pop)}px Fredoka, sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.strokeText(n.txt, n.x, n.y - n.z);
    ctx.fillStyle = n.col; ctx.fillText(n.txt, n.x, n.y - n.z);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (stillT > 0) { ctx.fillStyle = 'rgba(111,180,255,.14)'; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
  if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(.7, flashT * 4)})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
  if (hurtFlash > 0) {
    const g = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H / 2, VIEW_H * .35, VW / 2, Y_OFF + VIEW_H / 2, VW * .7);
    g.addColorStop(0, 'rgba(255,60,90,0)'); g.addColorStop(1, `rgba(255,60,90,${hurtFlash * 1.6})`);
    ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  }
  if (slowmo > 0) { ctx.fillStyle = `rgba(255,220,140,${Math.min(.12, slowmo * .1)})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
}
function drawPart(p) {
  const a = p.rest ? Math.min(1, p.life / .6) : Math.min(1, p.life / Math.min(.3, p.max));
  ctx.globalAlpha = a; ctx.fillStyle = p.col;
  const x = p.x, y = p.y - p.z, s = p.size;
  switch (p.shape) {
    case 'blob': if (p.flat) { ell(x, p.y, s * 1.4, s * .45); } else circle(x, y, s); ctx.fill(); break;
    case 'streak': ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * .03, y + p.vz * .03); ctx.stroke(); break;
    case 'bolt': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.fillStyle = '#5A4A3A'; ctx.fillRect(-1, -1, 2, 2); ctx.restore(); break;
    case 'shard': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * .6, 0); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s * .6, 0); ctx.closePath(); ctx.fill(); ctx.restore(); break;
    case 'chunk': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); rrect(-s / 2, -s / 2, s, s * .8, 1.5); ctx.fill(); ctx.restore(); break;
    case 'tuft': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ell(0, 0, s, s * .4); ctx.fill(); ctx.restore(); break;
    case 'puff': circle(x, y, s * (1.6 - p.life / p.max)); ctx.fill(); break;
    default: ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillRect(-s / 2, -s * .15, s, s * .3); ctx.fillRect(-s * .15, -s / 2, s * .3, s); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawFx(f) {
  const k = f.t / f.max;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, k * 1.5);
  if (f.kind === 'slash') {
    ctx.translate(f.x, f.y - f.z); ctx.rotate(f.ang);
    const len = f.size * (1.6 - k * .6);
    ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, -3 * k - 1); ctx.lineTo(len, 0); ctx.lineTo(0, 3 * k + 1); ctx.closePath(); ctx.fill();
    ctx.rotate(1.2); ctx.beginPath(); ctx.moveTo(-len * .6, 0); ctx.lineTo(0, -2 * k - .5); ctx.lineTo(len * .6, 0); ctx.lineTo(0, 2 * k + .5); ctx.closePath(); ctx.fill();
  } else if (f.kind === 'ring') {
    const r = f.r * (1.2 - k);
    ctx.strokeStyle = f.col; ctx.lineWidth = 2 + k * 5;
    if (f.flat) ell(f.x, f.y, r, r * .32); else circle(f.x, f.y - f.z, r);
    ctx.stroke();
  }
  ctx.restore();
}
function drawProj(p, t) {
  const x = p.x, y = p.y - p.z;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (p.wave) {
    const g = ctx.createLinearGradient(x, y - 60, x, y); g.addColorStop(0, 'rgba(255,111,181,0)'); g.addColorStop(1, 'rgba(255,111,181,.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x + Math.sign(p.vx) * 18, y - 40, x - 4, y - 64); ctx.quadraticCurveTo(x + Math.sign(p.vx) * 4, y - 30, x + 10, y); ctx.fill();
  } else {
    shadow(p.x, p.y, 6);
    const g = ctx.createRadialGradient(x, y, 1, x, y, 12); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.4, p.col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; circle(x, y, 12); ctx.fill();
  }
  ctx.restore();
}
function drawIcon(canvas, id, scale) { // weapon card portraits
  const g = canvas.getContext('2d'), old = ctx; ctx = g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
  const s = canvas.width / 64 * (scale || 1);
  g.setTransform(s, 0, 0, s, 0, 0);
  ctx.translate(30, 63); ctx.scale(.7, .7);
  drawHumanoid(HERO, { arm: id === 'sword' ? -1 : id === 'staff' ? -.6 : id === 'hammer' ? -1.2 : .2, weapon: id, walk: 0 });
  ctx = old;
}
