'use strict';
const TRAIL = { fists: 'rgba(255,255,255,.9)', hammer: 'rgba(216,170,85,.95)', staff: 'rgba(126,194,176,.95)', sword: 'rgba(143,184,216,.95)' };
const ease = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function playerPose() {
  const w = WEAPONS[P.w], pose = { walk: P.walk, weapon: w.look, tier: P.w === 'fists' ? 1 : save.wl[P.w] };
  if (P.state === 'atk' || P.state === 'air') {
    const m = P.move, k = P.t / m.dur, arc = m.arc || [1, 1];
    const kk = k < m.h[0] ? 0 : k > m.h[1] ? 1 : (k - m.h[0]) / (m.h[1] - m.h[0]);
    pose.arm = lerp(arc[0], arc[1], kk); pose.walk = 0;
    const tcol = brandT > 0 ? `rgba(${ELEMENTS[brandEl].rgb},.95)` : m.power === 2 ? 'rgba(216,170,85,.95)' : TRAIL[P.w];
    if (m.style === 'thrust') { // pull back, then drive straight out
      pose.arm = arc[0]; pose.ext = k < m.h[0] ? -.35 : Math.min(1, kk * 1.6);
      if (k >= m.h[0] && k <= m.h[1] + .1) pose.streak = { len: w.reach + 26, a: .8 * (1 - Math.max(0, kk - .6)), col: tcol };
      pose.lean = .22 * Math.max(0, pose.ext);
    } else if (m.style === 'sweep' || m.style === 'sweepR') { // come around the body, side to side
      const rev = m.style === 'sweepR';
      pose.arm = arc[0]; pose.sweep = rev ? lerp(1, -1, kk) : lerp(-1, 1, kk); pose.ext = .4;
      if (k >= m.h[0] && k <= m.h[1] + .12) pose.flat = { r: w.reach + 22, k: kk, rev, col: tcol, w: P.w === 'sword' || P.w === 'hammer' ? 8 : 5 };
      pose.lean = .1;
    }
    if (m.kick) { pose.kick = 1; pose.arm = -.5; }
    if (m.crouch || m.dive) pose.crouch = 1;
    if (m.rot) pose.rot = m.rot * ease(k / .75);
    if (!m.style && k >= m.h[0] && k <= m.h[1] + .12 && !m.kick && Math.abs(arc[1] - arc[0]) > .1) {
      pose.trail = w.reach + 18; pose.trailFrom = arc[0];
      pose.trailCol = brandT > 0 ? `rgba(${ELEMENTS[brandEl].rgb},.95)` : m.power === 2 ? 'rgba(216,170,85,.95)' : TRAIL[P.w]; pose.trailW = P.w === 'sword' || P.w === 'hammer' ? 9 : 6;
    }
    if (!m.style) pose.lean = m.power ? .16 : .08;
    pose.flow = Math.abs(P.vx) * .02;
  } else if (P.state === 'charge') {
    pose.arm = -2.2; pose.crouch = 1; pose.walk = 0;
    pose.glow = ['', '#D8AA55', '#FFE9A0', '#C8607A'][P.clvl] || '';
    if (P.clvl && Math.sin(performance.now() / 45) > 0) pose.glow = '#FFFFFF';
  } else if (P.state === 'run') { pose.run = 1; pose.lean = .28; pose.flow = 8; pose.arm = 1.9; pose.backArm = 2.2; }
  else if (P.state === 'jump') { pose.crouch = 1; pose.arm = .2; pose.rot = P.vz < 0 ? 0 : 0; pose.flow = 4; }
  else if (P.state === 'dodge') {
    const k = 1 - P.t / .34;
    if (P.dk === 'fwd') { pose.crouch = 1; pose.run = 1; pose.walk = 1.3; pose.lean = .55; pose.arm = 2.5; pose.backArm = 2.8; pose.flow = 12; } // a low lunge, arms swept back
    else if (P.dk === 'back') { pose.walk = -1.2; pose.lean = -.32; pose.arm = -.25; pose.backArm = .5; pose.flow = -4; pose.crouch = k > .75 ? 1 : 0; } // a backstep, guard up
    else { pose.crouch = 1; pose.walk = Math.sin(k * Math.PI) * 1.1; pose.lean = .12; pose.arm = .5; pose.backArm = 1.6; } // a quick sidestep
  }
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
  else if (e.state === 'strike') { pose.arm = 1.1; pose.lean = .2; pose.trail = 60; pose.trailFrom = -2.2; pose.trailCol = 'rgba(208,74,98,.9)'; }
  else if (e.state === 'dash') { pose.arm = .1; pose.lean = .4; pose.run = 1; }
  else if (e.state === 'leap') { pose.arm = -2.6; pose.crouch = 1; }
  else if (e.state === 'hurt') { pose.arm = -1; pose.lean = -.35; }
  else if (e.def.ranged) pose.arm = .1;
  return pose;
}
function drawPlayerAt(x, y, z, facing, pose, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(x, y - z); ctx.scale(facing, 1);
  drawHumanoid(heroLook(), pose);
  ctx.restore();
}
function drawEnemy(e, t) {
  if (e.state === 'dying' && e.death && e.death !== 'pop') { drawDeath(e, t); return; }
  const scale = e.boss ? e.size : 1;
  const a = { walk: e.dead ? 0 : e.walk, t: e.dead ? e.deadAt : t, wind: e.state === 'wind' ? 1 - e.t / e.windMax : 0, atk: ['strike', 'dash', 'pounce'].includes(e.state), hurt: ['hurt', 'down', 'dying'].includes(e.state) };
  if (e.def.draw === 'knight' || e.def.draw === 'colossus' || e.def.draw === 'human') { a.pose = humanEnemyPose(e); if (e.state === 'down' || (e.state === 'dying' && !e.air)) a.pose.down = 1; }
  shadow(e.x, e.y, e.hw * 1.1 * Math.max(.4, 1 - e.z / 200));
  if (e.boss && e.enraged && !e.dead) { // an enraged boss smoulders
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cy = e.y - e.z - e.hh * .55, gg = ctx.createRadialGradient(e.x, cy, 10, e.x, cy, e.hh * 1.3);
    gg.addColorStop(0, `rgba(255,120,90,${.22 + .1 * Math.sin(t * 6)})`); gg.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = gg; circle(e.x, cy, e.hh * 1.3); ctx.fill(); ctx.restore();
    if (Math.random() < .5) parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y, z: e.z + rand(0, e.hh), vx: rand(-20, 20), vy: 0, vz: rand(60, 120), life: .8, max: .8, col: pick(['#FF9A5A', '#FFD27A', '#E86A80']), size: rand(2, 3.5), shape: 'star', rot: 0, vr: 6 });
  }
  const jx = e.jit > 0 ? rand(-3, 3) : 0;
  ctx.save();
  ctx.translate(e.x + jx, e.y - e.z);
  let rot = e.rotA || 0;
  if ((e.state === 'down' || (e.state === 'dying' && !e.air)) && !a.pose) rot = e.def.move === 'hop' ? 0 : -1.35;
  ctx.scale(e.facing, 1);
  if (rot) { ctx.translate(0, -e.hh * .5); ctx.rotate(rot * e.facing); ctx.translate(0, e.hh * .5); }
  if (e.boss && e.state === 'wind') { const w = 1 - e.t / e.windMax; ctx.translate(-e.hw * .6, 0); ctx.rotate(-.1 * w); ctx.translate(e.hw * .6, 0); } // rears back before striking
  ctx.scale(e.sqx * scale, e.sqy * scale);
  if (e.state === 'down' && e.def.move === 'hop') ctx.scale(1.3, .55);
  FLASH = e.flash > 0 || (e.state === 'wind' && e.t < .25 && Math.floor(t * 20) % 2 === 0);
  CREATURES[e.def.draw](e, a);
  FLASH = false;
  ctx.restore();
  if (!e.dead) hatchActor(e.x, e.y - e.z, e.hw * scale, e.hh * scale);
  if ((e.chill > 0 || e.frozen > 0) && !e.dead) { // frost: a pale blue sheen, or a block of ice
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = e.frozen > 0 ? 'rgba(170,220,255,.5)' : 'rgba(140,200,255,.22)'; ell(e.x, e.y - e.z - e.hh / 2, e.hw + 6, e.hh / 2 + 6); ctx.fill(); ctx.restore();
    if (e.frozen > 0) { ctx.strokeStyle = 'rgba(230,248,255,.9)'; ctx.lineWidth = 1.5; rrect(e.x - e.hw - 6, e.y - e.z - e.hh - 6, e.hw * 2 + 12, e.hh + 8, 4); ctx.stroke(); }
  }
  if (stillT > 0 && !e.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(111,211,255,.3)'; ell(e.x, e.y - e.z - e.hh / 2, e.hw + 6, e.hh / 2 + 6); ctx.fill(); ctx.restore(); }
  if (e.state === 'wind') { // attack warning
    const y = e.y - e.z - e.hh - 16;
    ctx.fillStyle = '#D04A62'; circle(e.x, y, 9); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 13px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, y + 5);
  }
  if (!e.boss && !e.dead && e.hp < e.maxHp) {
    const w = 30 + e.hw, x = e.x - w / 2, y = e.y - e.z - e.hh - 10;
    ctx.fillStyle = 'rgba(28,18,64,.75)'; rrect(x - 2, y - 2, w + 4, 7, 3); ctx.fill();
    ctx.fillStyle = '#D0566A'; rrect(x, y, Math.max(0, w * e.hp / e.maxHp), 3, 1.5); ctx.fill();
  }
}
// ---------- weapon-specific deaths ----------
function drawDeath(e, t) {
  const el = e.corpse ? (e.dmax || 1) : e.dmax - e.t, dl = (e.dir || 1) * e.facing; // dl: knock direction in the enemy's own facing space
  const a = { walk: 0, t: e.deadAt || t, wind: 0, atk: false, hurt: true }; // the clock stops: no whirring rotors or flapping wings
  if (e.def.draw === 'knight' || e.def.draw === 'colossus' || e.def.draw === 'human') a.pose = { arm: -1, lean: -.3 };
  const draw = () => CREATURES[e.def.draw](e, a);
  shadow(e.x, e.y, e.hw * 1.1);
  ctx.save(); ctx.globalAlpha = e.fade !== undefined ? e.fade : 1;
  ctx.translate(e.x, e.y - e.z); ctx.scale(e.facing, 1); if (e.boss) ctx.scale(e.size, e.size);
  FLASH = el < .08;
  if (e.death === 'lie') { // knocked flat and left where it landed
    FLASH = false;
    if (e.def.move === 'hop') ctx.scale(1.4, .5);
    else if (a.pose) { a.pose.down = 1; }
    else { ctx.rotate(-1.4 * Math.sign(dl || 1)); ctx.translate(e.hh * .45 * Math.sign(dl || 1), -e.hw * .2); }
    draw();
  } else if (e.death === 'slice') {
    const cutY = -e.hh * .5, ang = e.cut * dl;
    const piece = (upper) => {
      ctx.save();
      if (upper) { // the top half is thrown clear, spinning, and lands beside the legs
        const k = Math.min(el, .9);
        ctx.translate(-dl * 70 * k, Math.min(e.hh * .42, -170 * el + 460 * el * el));
        ctx.translate(0, cutY); ctx.rotate(-dl * 2.4 * k); ctx.translate(0, -cutY);
      } else ctx.rotate(dl * Math.min(1, Math.max(0, el - .15) / .5) * 1.35); // the legs stagger and topple
      ctx.save(); ctx.translate(0, cutY); ctx.rotate(ang); ctx.beginPath(); ctx.rect(-400, upper ? -400 : 0, 800, 400); ctx.restore(); ctx.clip();
      draw();
      if (el < .7) { // the fresh cut glows
        ctx.save(); ctx.translate(0, cutY); ctx.rotate(ang); ctx.globalAlpha *= 1 - el / .7;
        ctx.fillStyle = MAT_COL[e.def.mat][0]; ctx.fillRect(-e.hw * 1.6, -2, e.hw * 3.2, 4);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-e.hw * 1.6, -.8, e.hw * 3.2, 1.6); ctx.restore();
      }
      ctx.restore();
    };
    piece(false); piece(true);
  } else if (e.death === 'crumple') {
    const c = Math.min(1, el / .2), wob = Math.sin(el * 30) * .22 * Math.max(0, 1 - el / .6);
    const fall = el > .75 ? Math.min(1, (el - .75) / .3) : 0;
    ctx.rotate(dl * fall * 1.35);
    ctx.translate(0, -e.hh * .5); ctx.rotate(wob); ctx.translate(0, e.hh * .5);
    ctx.transform(1, 0, -.28 * c * dl, 1, 0, 0);
    ctx.scale(1 + .16 * c, 1 - .36 * c);
    draw();
    FLASH = false;
    for (const d of e.dents) { // dents and bends where the staff landed
      const x = d.x * e.hw, y = -d.y * e.hh;
      ctx.strokeStyle = 'rgba(30,20,35,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, d.r, .3, Math.PI - .3); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y - 1.5, d.r, Math.PI + .5, TAU - .5); ctx.stroke();
    }
    if (el < 1.2) for (let i = 0; i < 3; i++) { // the stars of a good hard knock
      const an = el * 6 + i * TAU / 3, sx = Math.cos(an) * 16, sy = -e.hh - 6 + Math.sin(an) * 4;
      ctx.fillStyle = '#EED48A'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const q = -Math.PI / 2 + k * TAU / 5; ctx.lineTo(sx + Math.cos(q) * 4, sy + Math.sin(q) * 4); ctx.lineTo(sx + Math.cos(q + TAU / 10) * 1.6, sy + Math.sin(q + TAU / 10) * 1.6); } ctx.fill();
    }
  } else { // splat
    const c = Math.min(1, el / .07), settle = Math.sin(el * 32) * .05 * Math.exp(-el * 6);
    FLASH = false;
    ctx.save(); ctx.scale(e.facing, 1); // the splatter is drawn flat on the floor
    const col = MAT_COL[e.def.mat][0];
    for (const s of e.splat) { ctx.fillStyle = col; ctx.save(); ctx.scale(1, .32); ctx.rotate(s.a); ctx.beginPath(); ctx.ellipse(e.hw * .9 + s.l * 14, 0, s.l * 14, s.w, 0, 0, TAU); ctx.fill(); circle(e.hw * .9 + s.l * 30, 0, s.w * .8); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = col; ell(0, 0, e.hw * 1.6, e.hw * .45); ctx.fill();
    ctx.restore();
    FLASH = el < .06;
    ctx.scale(lerp(1, 1.9, c) - settle, Math.max(.08, lerp(1, .14, c) + settle));
    draw();
  }
  FLASH = false;
  ctx.restore();
}
function drawLoot(k, t) {
  if (k.kind === 'weapon') { drawWeaponPickup(k, t); return; }
  const x = k.x, y = k.y - k.z - 6 - Math.sin(t * 6 + k.x) * 2;
  shadow(k.x, k.y, 5);
  if (k.kind === 'shard') {
    ctx.fillStyle = '#7EC2B0'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); outline(1.5);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 1, y - 3, 1.5, 3);
  } else if (k.kind === 'sigil') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * .2);
    rrect(-6, -8, 12, 16, 2); ctx.fillStyle = '#C8607A'; ctx.fill(); outline(1.5);
    ctx.fillStyle = '#EED48A'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * TAU / 5; ctx.lineTo(Math.cos(an) * 4, Math.sin(an) * 4); ctx.lineTo(Math.cos(an + TAU / 10) * 1.8, Math.sin(an + TAU / 10) * 1.8); } ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = '#7EC2B0'; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.bezierCurveTo(x - 10, y - 2, x - 5, y - 9, x, y - 4); ctx.bezierCurveTo(x + 5, y - 9, x + 10, y - 2, x, y + 6); ctx.fill(); outline(1.5);
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
  for (const h of hazards) if (h.kind !== 'beam') drawHazard(h, t);
  for (const e of enemies) if (e.boss && e.state === 'wind' && e.plan !== 'roar') drawTell(e, t);
  // every figure is painted into the ink layer; this box (generous, so swings and debris fit) is where the ink work happens
  const boxes = [], box = (x, y, z, hw, hh) => boxes.push([x - hw, y - z - hh, x + hw, y + 12]);
  box(P.x, P.y, P.z, 160, 170);
  for (const e of enemies) { const s = e.boss ? e.size : 1; box(e.x, e.y, e.z, (e.hw + 110 + (e.def.tail || 0)) * s, (e.hh + 90) * s); }
  for (const c of corpses) box(c.x, c.y, 0, 110, 110);
  for (const p of props) box(p.x, p.y, 0, 60, 100);
  for (const k of loot) box(k.x, k.y, k.z || 0, 40, 50);
  for (const p of projs) box(p.x, p.y, p.z || 0, 50, 50);
  if (stag) box(stag.x, stag.y, 0, 90, 130);
  inkBegin(boxes);
  corpses.forEach((c, i) => { c.fade = corpses.length >= 30 && i < 3 ? .5 : 1; drawDeath(c, t); });
  const list = [];
  for (const p of props) list.push([p.y, () => { FLASH = p.flash > 0; drawPod(p, t); FLASH = false; }]);
  for (const k of loot) list.push([k.y, () => drawLoot(k, t)]);
  for (const e of enemies) list.push([e.y, () => drawEnemy(e, t)]);
  // afterimages are light, not ink, so they are painted straight onto the page
  for (const g of ghosts) list.push([g.y - .1, () => onMain(() => { ctx.globalCompositeOperation = 'lighter'; drawPlayerAt(g.x, g.y, g.z, g.facing, g.pose, g.a * .6); })]);
  if (mirrorT > 0) list.push([P.y - .05, () => onMain(() => { ctx.globalCompositeOperation = 'lighter'; drawPlayerAt(P.x - P.facing * 34, P.y - 6, P.z, P.facing, playerPose(), .55); })]);
  list.push([P.y + .1, () => {
    shadow(P.x, P.y, 13 * Math.max(.5, 1 - P.z / 220));
    if (P.inv > 0 && !['dodge', 'down', 'dead'].includes(P.state) && Math.floor(t * 18) % 2) return;
    drawPlayerAt(P.x, P.y, P.z, P.facing, playerPose(), 1);
    hatchActor(P.x, P.y - P.z, 13, 50);
  }]);
  for (const p of projs) list.push([p.y, () => drawProj(p, t)]);
  if (stag) list.push([stag.y + .2, () => drawStag(stag, t)]);
  list.sort((a, b) => a[0] - b[0]).forEach(o => o[1]());
  inkEnd(t);
  for (const p of parts) if (!p.rest) drawPart(p);
  for (const h of hazards) if (h.kind === 'beam') drawHazard(h, t);
  for (const f of fx) drawFx(f);
  ctx.textAlign = 'center';
  for (const n of nums) {
    const k = n.t / n.max, pop = 1 + Math.max(0, (k - .82) / .18) * .7;
    ctx.globalAlpha = Math.min(1, n.t * 3);
    ctx.font = `700 ${Math.round(n.size * pop)}px Cinzel, Georgia, serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.strokeText(n.txt, n.x, n.y - n.z);
    ctx.fillStyle = n.col; ctx.fillText(n.txt, n.x, n.y - n.z);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  gradeFrame(stage.theme);
  if (boss && !boss.dead) { // the boss arena is lit in the boss's own color
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = { mossback: 'rgba(120,170,80,.35)', colossus: 'rgba(230,120,60,.35)', wyrm: 'rgba(150,90,220,.4)' }[boss.def.draw]; ctx.fillRect(0, Y_OFF, VW, VIEW_H); ctx.restore();
  }
  if (stillT > 0) { ctx.fillStyle = 'rgba(111,180,255,.14)'; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
  if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(.7, flashT * 4)})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
  if (hurtFlash > 0) {
    const g = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H / 2, VIEW_H * .35, VW / 2, Y_OFF + VIEW_H / 2, VW * .7);
    g.addColorStop(0, 'rgba(255,60,90,0)'); g.addColorStop(1, `rgba(255,60,90,${hurtFlash * 1.6})`);
    ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  }
  if (slowmo > 0) { ctx.fillStyle = `rgba(255,220,140,${Math.min(.12, slowmo * .1)})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H); }
  paperFrame();
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
  } else if (f.kind === 'crit') { // a starburst of light on a critical hit
    ctx.translate(f.x, f.y - f.z); const r = f.r * (1.3 - k * .5);
    ctx.fillStyle = 'rgba(255,200,120,.95)';
    for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(r * (i % 2 ? .6 : 1), 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(0, 0, 6 * k + 2); ctx.fill();
  } else if (f.kind === 'bolt') { // forked lightning between two enemies
    const r = mulberry(Math.floor(f.seed * 1000 + f.t * 60));
    ctx.strokeStyle = f.col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(f.x, f.y - f.z);
    for (let i = 1; i < 8; i++) { const q = i / 8; ctx.lineTo(lerp(f.x, f.x2, q) + (r() - .5) * 18, lerp(f.y - f.z, f.y2 - f.z2, q) + (r() - .5) * 18); }
    ctx.lineTo(f.x2, f.y2 - f.z2); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.stroke();
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
  if (p.quake) { // the hammer's fault line: shards of rock bursting up in a running crack
    ctx.strokeStyle = '#2A1B2C'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - Math.sign(p.vx) * 60, p.y); for (let i = 0; i <= 6; i++) ctx.lineTo(x - Math.sign(p.vx) * (60 - i * 10), p.y + (i % 2 ? 3 : -2)); ctx.stroke();
    for (let i = 0; i < 4; i++) { const sx = x - Math.sign(p.vx) * i * 12, h = (22 - i * 5) * (1 + .2 * Math.sin(t * 30 + i)); ctx.fillStyle = i % 2 ? '#8A7458' : '#B89A6E'; ctx.beginPath(); ctx.moveTo(sx - 7, p.y); ctx.lineTo(sx - 1, p.y - h); ctx.lineTo(sx + 2, p.y - h * .7); ctx.lineTo(sx + 7, p.y); ctx.closePath(); ctx.fill(); outline(1.2); }
    return;
  }
  if (p.ground) { // a shockwave tearing along the floor: jump it
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const g = ctx.createRadialGradient(x - Math.sign(p.vx) * i * 10, p.y, 2, x - Math.sign(p.vx) * i * 10, p.y, 26 - i * 5); g.addColorStop(0, 'rgba(255,230,170,.8)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ell(x - Math.sign(p.vx) * i * 10, p.y - 8, 26 - i * 5, 16 - i * 3); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#8A7458'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 10 + i * 6, p.y); ctx.lineTo(x - 7 + i * 6, p.y - 10 - (i % 2) * 6); ctx.lineTo(x - 4 + i * 6, p.y); ctx.fill(); }
    return;
  }
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
  drawHumanoid(heroLook(), { arm: id === 'sword' ? -1 : id === 'staff' ? -.6 : id === 'hammer' ? -1.2 : .2, weapon: id, walk: 0, tier: id === 'fists' ? 1 : save.wl[id] });
  ctx = old;
  paintCard(canvas, s * .7);
}

function drawHazard(h, t) {
  const k = 1 - Math.max(0, h.t) / h.max;
  if (h.kind === 'ring') { // a shockwave ring rolling across the floor
    if (h.delay > 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,220,160,.85)'; ctx.lineWidth = 7; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .3); ctx.stroke(); ctx.restore(); return;
  }
  if (h.kind === 'mine') { // a brass mine with a blinking light; it lands, arms, then waits for you
    if (h.done) return;
    const z = Math.max(0, h.drop) / .45 * 120;
    shadow(h.x, h.y, 9);
    rrect(h.x - 9, h.y - z - 8, 18, 8, 4); ctx.fillStyle = '#8A6A3A'; ctx.fill(); outline(1.4);
    const on = h.arm > 0 ? Math.sin(t * 10) > 0 : Math.sin(t * 26) > 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = h.arm > 0 ? 'rgba(255,210,120,.9)' : on ? 'rgba(255,80,60,1)' : 'rgba(255,80,60,.3)'; circle(h.x, h.y - z - 9, 3); ctx.fill();
    if (h.arm <= 0) { ctx.strokeStyle = 'rgba(255,90,70,.35)'; ctx.lineWidth = 1.5; ell(h.x, h.y, 36, 12); ctx.stroke(); }
    ctx.restore(); return;
  }
  if (h.kind === 'wall') { // a sweeping wall of crystal with one way through
    ctx.save();
    for (let y = FLOOR_TOP + 6; y <= FLOOR_BOT; y += 9) {
      if (Math.abs(y - h.gapY) < 20) continue;
      const hgt = 70 + Math.sin(y * .7) * 12;
      ctx.beginPath(); ctx.moveTo(h.x - 7, y); ctx.lineTo(h.x + 2, y - hgt); ctx.lineTo(h.x + 8, y); ctx.closePath();
      ctx.fillStyle = h.wait > 0 ? 'rgba(216,160,232,.35)' : 'rgba(216,160,232,.85)'; ctx.fill(); if (h.wait <= 0) outline(1.2);
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${.25 + .2 * Math.sin(t * 12)})`; ell(h.x, h.gapY, 18, 8); ctx.fill();
    ctx.restore(); return;
  }
  if (h.kind === 'beam') {
    const y = h.y - 22, x0 = camX - 20, w = VW + 40;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (!h.fired) { // warning: a flickering line along your lane
      ctx.globalAlpha = .35 + .35 * Math.sin(t * 40); ctx.fillStyle = `rgba(${h.col},.9)`; ctx.fillRect(x0, y - 1, w, 2);
      ctx.globalAlpha = .25 * k; ctx.fillStyle = `rgba(${h.col},.6)`; ctx.fillRect(x0, y - 10, w, 20);
    } else {
      const f = Math.max(0, h.t) / .35;
      const g = ctx.createLinearGradient(0, y - 18, 0, y + 18); g.addColorStop(0, `rgba(${h.col},0)`); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, `rgba(${h.col},0)`);
      ctx.globalAlpha = f; ctx.fillStyle = g; ctx.fillRect(x0, y - 18, w, 36);
    }
    ctx.restore(); return;
  }
  if (h.t > 0) { // the glowing mark on the floor fills up before it strikes
    ctx.strokeStyle = `rgba(${h.col},.9)`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .32); ctx.stroke();
    ctx.fillStyle = `rgba(${h.col},${.15 + .25 * k})`; ell(h.x, h.y, h.r * k, h.r * .32 * k); ctx.fill();
    if (h.kind === 'fall' && h.t < .4) { // something plummets onto the mark
      const z = h.t / .4 * 300;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, h.y - z - 60, 0, h.y - z); g.addColorStop(0, `rgba(${h.col},0)`); g.addColorStop(1, 'rgba(255,255,255,.95)');
      ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(h.x, h.y - z - 60); ctx.lineTo(h.x, h.y - z); ctx.stroke(); ctx.restore();
      ctx.fillStyle = `rgb(${h.col})`; circle(h.x, h.y - z, 7); ctx.fill(); outline(1.5);
    }
  } else if (h.kind === 'spike') { // spikes burst out of the ground
    const up = Math.min(1, -h.t / .07), fade = 1 + h.t / .4;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade);
    for (let i = -2; i <= 2; i++) {
      const sx = h.x + i * h.r * .38, sh = (46 - Math.abs(i) * 10) * up;
      ctx.beginPath(); ctx.moveTo(sx - 7, h.y + Math.abs(i) * 2); ctx.lineTo(sx + i * 2, h.y - sh); ctx.lineTo(sx + 7, h.y + Math.abs(i) * 2); ctx.closePath();
      ctx.fillStyle = `rgb(${h.col})`; ctx.fill(); outline(1.4);
    }
    ctx.restore();
  }
}

// a boss shows where its attack will land: a red zone that fills as the wind-up runs out
function drawTell(e, t) {
  const k = 1 - e.t / e.windMax, a = .12 + .3 * k + .1 * Math.sin(t * 20), p = e.plan, f = e.facing;
  ctx.save();
  ctx.fillStyle = `rgba(230,70,70,${a})`; ctx.strokeStyle = `rgba(255,120,110,${.5 + .4 * k})`; ctx.lineWidth = 2;
  if (p === 'bite' || p === 'swing') {
    const len = e.def.reach + e.hw, x0 = f > 0 ? e.x : e.x - len;
    rrect(x0, e.y - 20, len, 40, 18); ctx.fill(); ctx.stroke();
  } else if (p === 'sweep') {
    ell(e.x, e.y, e.def.reach + e.hw, (e.def.reach + e.hw) * .3); ctx.fill(); ctx.stroke();
  } else if (p === 'roll' || p === 'charge') {
    const x1 = f > 0 ? camX + VW : camX, x0 = e.x;
    ctx.fillRect(Math.min(x0, x1), e.y - 16, Math.abs(x1 - x0), 32);
    for (let i = 1; i < 6; i++) { const ax = x0 + f * (i * 70 + (t * 160) % 70); ctx.beginPath(); ctx.moveTo(ax, e.y - 10); ctx.lineTo(ax + f * 14, e.y); ctx.lineTo(ax, e.y + 10); ctx.stroke(); }
  } else if (p === 'slam' && e.tx !== undefined) {
    ell(e.tx, e.ty, 95, 30); ctx.fill(); ctx.stroke();
  } else if (p === 'quake') {
    for (let i = 1; i <= 3; i++) { ell(e.x, e.y, 60 * i * k, 18 * i * k); ctx.stroke(); }
  } else if (p === 'dive' && e.tx !== undefined) {
    ell(e.tx, e.ty, 70, 22); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.tx - 14, e.ty); ctx.lineTo(e.tx + 14, e.ty); ctx.moveTo(e.tx, e.ty - 6); ctx.lineTo(e.tx, e.ty + 6); ctx.stroke();
  } else if (p === 'magnet') {
    ctx.strokeStyle = `rgba(159,216,232,${.4 + .5 * k})`; for (let i = 0; i < 3; i++) { ell(e.x, e.y - e.hh * .5, 50 + i * 30 - (t * 60 % 30), (50 + i * 30 - (t * 60 % 30)) * .6); ctx.stroke(); }
  } else if (p === 'groundwave') {
    const x1 = f > 0 ? camX + VW : camX; ctx.fillRect(Math.min(e.x, x1), e.y - 10, Math.abs(x1 - e.x), 20);
  }
  ctx.restore();
  // the boss itself glows with warning
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cy = e.y - e.z - e.hh * .55, g = ctx.createRadialGradient(e.x, cy, 10, e.x, cy, e.hh);
  g.addColorStop(0, `rgba(255,80,60,${.15 + .3 * k})`); g.addColorStop(1, 'rgba(255,80,60,0)');
  ctx.fillStyle = g; circle(e.x, cy, e.hh); ctx.fill(); ctx.restore();
}
