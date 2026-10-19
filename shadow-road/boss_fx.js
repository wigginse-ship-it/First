// ---------- each boss's own close-range burst, and boss rooms that change as the fight goes on ----------
// Old Mossback: brambles erupt in rings that spread out from him, one after another — jump them or get clear.
// The Brass Colossus: its vents blast jets of steam out along the floor to either side, hurling you away.
// The Kaleidoscope Wyrm: it draws you in with a pull of light, then bursts into a ring of crystal shards.
PLAN_FX.bramble = (e) => {
  const gap = e.thornGap ?? Math.atan2((P.y - e.y) * 2.2, P.x - e.x) + rand(-1.2, 1.2); e.thornGap = undefined; // one narrow gap runs through all three rings: find it
  for (let i = 0; i < 3; i++) hazards.push({ kind: 'thornring', gap: gap + rand(-.12, .12), x: e.x, y: e.y, r: 20, R: 70 + i * 50, delay: i * .28, t: 1.6, max: 1.6, dmg: Math.round(edmg(e) * .9), hit: false });
  sfx('slam'); shakeMag = 8; recover(e, 1.2);
};
PLAN_FX.vent = (e) => {
  for (const d of [-1, 1]) hazards.push({ kind: 'steamjet', x: e.x + d * e.hw * .6, y: e.y, dir: d, len: 0, L: 230, t: .9, max: .9, dmg: Math.round(edmg(e) * .8), hit: false });
  sfx('whoosh'); shakeMag = 6; recover(e, 1.1);
};
PLAN_FX.coil = (e) => {
  hazards.push({ kind: 'prismpull', x: e.x, y: e.y, z: e.z, t: .7, max: .7, e, fired: false, dmg: edmg(e) });
  sfx('charge'); recover(e, 1.2);
};
// tells: each warns in its own way
TELL_FX.bramble = (e, t, k) => { // the ground cracks in rings around him
  if (e.thornGap === undefined) e.thornGap = Math.atan2((P.y - e.y) * 2.2, P.x - e.x) + rand(-1.2, 1.2);
  ctx.strokeStyle = `rgba(126,164,96,${.3 + .5 * k})`; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const r = (70 + i * 50) * (.6 + .4 * k); ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r / 2.2, 0, e.thornGap + .45, e.thornGap + TAU - .45); ctx.stroke(); } // the cracks leave the gap unbroken
};
TELL_FX.vent = (e, t, k) => { // pressure building: the vents glow and shudder
  for (const d of [-1, 1]) { const x0 = e.x + d * e.hw * .6; const g = ctx.createLinearGradient(x0, 0, x0 + d * 230, 0); g.addColorStop(0, `rgba(255,226,192,${.4 * k + .1})`); g.addColorStop(1, 'rgba(255,226,192,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x0 + d * 230), e.y - 14, 230, 28); }
};
TELL_FX.coil = (e, t, k) => { // light spirals in toward it
  ctx.strokeStyle = `rgba(200,160,255,${.3 + .5 * k})`; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 3, r = 120 * (1 - k * .6); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r, e.y - e.z * .3 + Math.sin(a) * r * .45); ctx.lineTo(e.x + Math.cos(a + .5) * r * .5, e.y - e.z * .3 + Math.sin(a + .5) * r * .22); ctx.stroke(); }
};
HAZARD_FX.thornring = {
  update(h, dt) {
    if (h.delay > 0) { h.delay -= dt; h.t += dt; return; }
    h.r = Math.min(h.R, h.r + 420 * dt);
    const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2);
    const ang = Math.atan2((P.y - h.y) * 2.2, P.x - h.x), off = Math.abs(((ang - h.gap) % TAU + TAU * 1.5) % TAU - Math.PI);
    if (!h.hit && Math.abs(d - h.r) < 16 && P.z < 16 && off > .36) { h.hit = true; playerDamage(h.dmg, h.x, true); } // the gap is safe
    if (h.r >= h.R && !h.burst) { h.burst = true; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; dust(h.x + Math.cos(a) * h.r, h.y + Math.sin(a) * h.r / 2.2, 1); } }
  },
  draw(h, t) {
    if (h.delay > 0) return;
    const fade = Math.min(1, h.t / .4);
    for (let i = 0; i < 22; i++) { // a ring of thorns standing up out of the ground
      const a = i / 22 * TAU + h.gap; if (Math.abs(((a - h.gap) % TAU + TAU * 1.5) % TAU - Math.PI) < .3) continue; // leave the gap clear
      const px = h.x + Math.cos(a) * h.r, py = h.y + Math.sin(a) * h.r / 2.2, hgt = (16 + (i % 3) * 6) * fade;
      ctx.fillStyle = C(i % 2 ? '#5E7A3A' : '#7EA460'); ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.quadraticCurveTo(px + Math.cos(a) * 2, py - hgt * .6, px + Math.cos(a) * 5, py - hgt); ctx.lineTo(px + 4, py); ctx.closePath(); ctx.fill(); outline(1);
    }
  },
};
HAZARD_FX.steamjet = {
  update(h, dt) {
    const life = 1 - h.t / h.max; h.len = h.L * Math.min(1, life * 4);
    const dx = (P.x - h.x) * h.dir;
    if (!h.hit && dx > 0 && dx < h.len && Math.abs(P.y - h.y) < 22 && P.z < 50) { h.hit = true; playerDamage(h.dmg, h.x, true); if (P.state === 'hurt') P.vx = h.dir * 420; }
    if (Math.random() < .8) parts.push({ x: h.x + h.dir * rand(0, h.len), y: h.y + rand(-12, 12), z: rand(4, 40), vx: h.dir * rand(80, 200), vy: 0, vz: rand(10, 40), life: .5, max: .5, col: 'rgba(240,232,222,.55)', size: rand(6, 12), shape: 'puff', rot: 0, vr: 0 });
  },
  draw(h, t) {
    const a = Math.min(1, h.t / .3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(h.x, 0, h.x + h.dir * h.len, 0); g.addColorStop(0, `rgba(255,240,220,${.55 * a})`); g.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(h.x, h.y - 30); ctx.lineTo(h.x + h.dir * h.len, h.y - 48); ctx.lineTo(h.x + h.dir * h.len, h.y + 6); ctx.lineTo(h.x, h.y - 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
};
HAZARD_FX.prismpull = {
  update(h, dt) {
    if (!h.fired) { // the pull: light draws you toward it
      const dx = h.x - P.x; if (Math.abs(dx) < 260 && !['dodge', 'dead'].includes(P.state)) P.x += Math.sign(dx) * 110 * dt;
      if (h.t < .2) { h.fired = true; // then it bursts: a ring of crystal shards flies out
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; projs.push({ owner: 'e', x: h.x, y: clamp(h.y + Math.sin(a) * 10, FLOOR_TOP + 6, FLOOR_BOT), z: 30, vx: Math.cos(a) * 260, vy: Math.sin(a) * 90, dmg: Math.round(h.dmg * .8), life: 1.4, col: '#E0C8FF' }); }
        burst(h.x, h.y, 40, ['#E0C8FF', '#9FD8E0', '#FFFFFF'], 24, 'crystal', 0, true); sfx('hit-crystal'); shakeMag = 8; flashT = .08;
      }
    }
  },
  draw(h, t) {
    if (h.fired) return;
    const k = 1 - h.t / h.max; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const r = 140 * (1 - ((k * 2 + i / 3) % 1)); ctx.strokeStyle = `rgba(210,180,255,${.5 * (1 - r / 140)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(h.x, h.y, r, r / 2.2, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  },
};

// ---------- boss rooms that answer the fight ----------
// the Sunken Grove floods higher with each phase and the water drags at your feet; the Foundry's furnaces boil over and
// rain slag; in the Wyrm's Nest the pull of the world loosens (higher, floatier jumps) and shards fall from the ribs
let roomGrav = 1, roomSlow = 1, roomT = 0;
function updateBossRoom(dt) {
  roomGrav = 1; roomSlow = 1;
  if (!boss || boss.dead || !stage.bossRoom) return;
  const ph = boss.phase || 1, kind = boss.def.draw; roomT -= dt;
  if (kind === 'mossback') roomSlow = [1, .9, .8][ph - 1];
  if (kind === 'wyrm' && ph >= 2) roomGrav = .72;
  if (roomT > 0 || ph < 2) return;
  roomT = ph >= 3 ? 2.2 : 3.6;
  if (kind === 'colossus') { // the furnaces boil over
    for (let i = 0; i < ph; i++) hazards.push({ kind: 'fall', x: clamp(P.x + rand(-120, 120), camX + 30, camX + VW - 30), y: clamp(P.y + rand(-30, 30), FLOOR_TOP + 8, FLOOR_BOT), r: 26, t: .9 + i * .2, max: .9 + i * .2, dmg: Math.round(edmg(boss) * .6), col: '255,150,70' });
    sfx('charge');
  } else if (kind === 'wyrm' && ph >= 3) { // shards break from the ribs overhead
    for (let i = 0; i < 3; i++) hazards.push({ kind: 'fall', x: clamp(P.x + rand(-140, 140), camX + 30, camX + VW - 30), y: clamp(P.y + rand(-34, 34), FLOOR_TOP + 8, FLOOR_BOT), r: 24, t: .9 + i * .15, max: .9 + i * .15, dmg: Math.round(edmg(boss) * .55), col: '210,180,255' });
  }
}
function drawBossRoom(t) { // the rising water in the Sunken Grove
  if (!boss || boss.dead || boss.def.draw !== 'mossback' || !stage.bossRoom) return;
  const lvl = [0, 10, 22][(boss.phase || 1) - 1]; if (!lvl) return;
  ctx.save(); const y0 = FLOOR_TOP + 4;
  const g = ctx.createLinearGradient(0, y0, 0, VH); g.addColorStop(0, `rgba(90,140,130,${.12 + lvl * .006})`); g.addColorStop(1, `rgba(40,80,80,${.25 + lvl * .01})`);
  ctx.fillStyle = g; ctx.fillRect(0, y0, VW, VH - y0);
  ctx.strokeStyle = 'rgba(210,240,230,.25)'; ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) { const y = y0 + 8 + i * 10, x = ((i * 137 + t * 14) % (VW + 80)) - 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + lvl, y); ctx.stroke(); }
  ctx.restore();
}
// Old Mossback's jumping stomp lifts it well above its usual drawing box: give the ink room for the tree on its back
{ const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (boss && !boss.dead && boss.def.draw === 'mossback' && boss.plan === 'bramble' && boss.state === 'wind') box(boss.x, boss.y, 60, (boss.hw + 110) * boss.size, (boss.hh + 150) * boss.size); }; }
