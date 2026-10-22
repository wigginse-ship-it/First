// ---------- Old Mossback's last trick: he sinks into the flooded grove and hunts you under the water ----------
// Only the tree on his back shows above the surface, gliding toward you like a fin with a wake behind it. It follows
// you for a while (faster than you walk: run, or wait for it to stop), stops and churns, and a heartbeat later he
// bursts up out of the water right there and throws whoever is standing on the spot into the air.
// Get off the churning water. While he is under you can't hit him.
const SUB = { dive: .45, hunt: 1.6, churn: .8, rise: .35, speed: 140, R: 50 };
PLAN_FX.submerge = (e) => {
  e.sub = { t: 0, x0: e.x, y0: e.y }; e.state = 'recover'; e.t = SUB.dive + SUB.hunt + SUB.churn + SUB.rise + .5; e.plan = 'submerge';
  sfx('whoosh'); for (let i = 0; i < 18; i++) parts.push({ x: e.x + rand(-40, 40), y: e.y + rand(-6, 6), z: rand(4, 30), vx: rand(-80, 80), vy: 0, vz: rand(90, 220), life: .7, max: .7, col: 'rgba(200,232,226,.8)', size: rand(3, 6), shape: 'blob' });
};
TELL_FX.submerge = (e, t, k) => { // he hunches and draws in a breath: water rings tighten round him
  ctx.strokeStyle = `rgba(200,236,230,${.25 + .45 * k})`; ctx.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) { const r = (e.hw + 30 - i * 14) * (1.2 - .4 * k); ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r / 2.6, 0, 0, TAU); ctx.stroke(); }
};
{
  const _upd = updateBossRoom;
  updateBossRoom = function (dt) {
    _upd(dt);
    const e = boss; if (!e || e.dead || !e.sub) return;
    const s = e.sub; s.t += dt; const t1 = SUB.dive, t2 = t1 + SUB.hunt, t3 = t2 + SUB.churn, t4 = t3 + SUB.rise;
    e.state = 'recover'; e.t = Math.max(e.t, .2);
    if (s.t > t1 && s.t < t2) { // hunting: the wake slides after you
      const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy * 1.6) || 1, v = Math.min(SUB.speed * dt, d);
      e.x += dx / d * v; e.y = clamp(e.y + dy / d * v * .7, FLOOR_TOP + 8, FLOOR_BOT); e.facing = Math.sign(dx) || e.facing;
      if (Math.random() < dt * 14) parts.push({ x: e.x - e.facing * rand(10, 40), y: e.y + rand(-5, 5), z: 1, vx: -e.facing * rand(20, 60), vy: 0, vz: rand(20, 50), life: .5, max: .5, col: 'rgba(210,240,232,.7)', size: rand(3, 6), shape: 'puff' });
    }
    if (s.t >= t2 && !s.churned) { s.churned = true; s.bx = e.x; s.by = e.y; sfx('charge'); }
    if (s.t >= t2 && s.t < t3 && Math.random() < dt * 30) parts.push({ x: s.bx + rand(-SUB.R, SUB.R), y: s.by + rand(-12, 12), z: 1, vx: 0, vy: 0, vz: rand(30, 90), life: .4, max: .4, col: 'rgba(220,244,238,.8)', size: rand(2, 4), shape: 'blob' });
    if (s.t >= t3 && !s.burst) { s.burst = true; // up he comes
      e.x = s.bx; e.y = s.by; e.vz = 380; e.air = false; shakeMag = 12; sfx('slam'); flashT = Math.max(flashT, .05);
      for (let i = 0; i < 40; i++) { const a = rand(0, TAU); parts.push({ x: e.x + Math.cos(a) * rand(0, 40), y: e.y + Math.sin(a) * rand(0, 14), z: rand(2, 30), vx: Math.cos(a) * rand(40, 200), vy: 0, vz: rand(160, 380), life: .9, max: .9, col: pick(['rgba(210,240,232,.85)', 'rgba(150,200,190,.8)', 'rgba(90,120,60,.8)']), size: rand(3, 7), shape: 'blob' }); }
      if (Math.hypot(P.x - e.x, (P.y - e.y) * 2) < SUB.R && P.z < 30) { playerDamage(Math.round(edmg(e) * 1.2), e.x, true); if (P.state === 'hurt') { P.vz = 340; P.vx = Math.sign(P.x - e.x || 1) * 160; } }
    }
    if (s.t >= t4) { e.sub = null; e.state = 'recover'; e.t = .6; } // spent, on the surface: your opening
  };
  const _strike = strike; // under the water he can't be reached
  strike = function (e, ...a) { if (e.sub && !e.sub.burst) return; return _strike(e, ...a); };
  const _draw = drawEnemy;
  drawEnemy = function (e, t) {
    const s = e.sub; if (!s || s.burst) return _draw(e, t);
    const t1 = SUB.dive, t2 = t1 + SUB.hunt;
    if (s.t < t1) { const k = s.t / t1; ctx.save(); ctx.beginPath(); ctx.rect(e.x - 300, e.y - 600, 600, 600 + 2); ctx.clip(); ctx.translate(0, k * e.hh * 1.3); _draw(e, t); ctx.restore(); return; } // sinking
    // under: the tree's crown and the ridge of the shell break the surface, with a wake and ripples
    const x = e.x, y = e.y, f = e.facing, bob = Math.sin(t * 5) * 1.2;
    ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = 'rgba(30,60,60,.6)'; ell(x, y + 2, e.hw * .9, 10); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(225,245,240,.75)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + f * 20, y); ctx.quadraticCurveTo(x - f * (30 + i * 18), y - 9 - i * 4, x - f * (60 + i * 26), y - 4 - i * 3); ctx.moveTo(x + f * 20, y + 2); ctx.quadraticCurveTo(x - f * (30 + i * 18), y + 11 + i * 4, x - f * (60 + i * 26), y + 6 + i * 3); ctx.stroke(); } // the V of the wake
    ctx.fillStyle = C('#4E5A3A'); ctx.beginPath(); ctx.ellipse(x, y - 4 + bob, 30, 9, 0, Math.PI, TAU); ctx.fill(); outline(1.4); // the ridge of the shell
    ctx.fillStyle = C('#5A4030'); ctx.fillRect(x - 3, y - 40 + bob, 6, 34); // the trunk
    for (let i = 0; i < 5; i++) { const a = Math.PI + i / 4 * Math.PI; ctx.fillStyle = C((e.phase >= 3 ? ['#C8642E', '#E08A3A', '#9A4A22'] : ['#4E7A3A', '#5E8A44', '#3E6A32'])[i % 3]); ell(x + Math.cos(a) * 18, y - 44 + Math.sin(a) * 10 + bob, 14, 10); ctx.fill(); outline(1.1); }
    if (s.t >= t2) { // stopped and churning: the spot he will burst from
      const k = Math.min(1, (s.t - t2) / SUB.churn); ctx.strokeStyle = `rgba(232,76,61,${.4 + .5 * k})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(s.bx, s.by, SUB.R, SUB.R / 2.2, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(232,76,61,${.12 + .2 * k})`; ctx.fill();
    }
  };
}
