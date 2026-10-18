// ---------- how enemies arrive ----------
// Most no longer just walk in from the edge: each world has its own ways in. In the Vale they burst up out of the earth,
// drop from the canopy or vault in over the hedges behind the road; on the Skyport they rappel down from the airships
// overhead; on the Prism Rim they step out of crystal mirrors or tears in Shadow; in the Courts they crawl up out of the
// abyss. Now and then (and always, for a champion) a Trump card stands up on the road and someone steps out of it.
const ENTRANCES = {
  bloom: ['rise', 'drop', 'leap', 'rise', 'side'],
  sky: ['rope', 'drop', 'leap', 'rope', 'side'],
  prism: ['mirror', 'rift', 'leap', 'mirror', 'side'],
  chaos: ['rise', 'rift', 'drop', 'leap', 'side'],
  trump: ['trump', 'trump', 'drop', 'rift'],
};
function entranceSpot(e) { // somewhere in view, but never right on top of him
  for (let i = 0; i < 10; i++) { const x = rand(camX + 70, camX + VW - 70); if (Math.abs(x - P.x) > 100 && !enemies.some(o => o !== e && o.state === 'enter' && Math.abs(o.x - x) < 50)) return x; }
  return clamp(P.x + (P.x < camX + VW / 2 ? 170 : -170), camX + 60, camX + VW - 60);
}
function setEntrance(e, kind) {
  const D = ENTER_FX[kind]; if (!D) return;
  e.ent = { kind, t: 0, max: D.max }; e.state = 'enter'; e.plan = null; e.vx = 0;
  D.start(e, e.ent); e.facing = Math.sign(P.x - e.x) || -1;
}
function pickEntrance(e) {
  if (e.def.move === 'fly') return Math.random() < .6 ? 'swoop' : 'side';
  if (Math.random() < .08) return 'trump';
  const w = stage.secret ? 'trump' : (STAGES[stageIdx] || {}).theme;
  return pick(ENTRANCES[w] || ENTRANCES.bloom);
}
const ENTER_FX = {
  drop: { max: 2, // falls from far overhead: a ring on the floor marks where it lands
    start(e, n) { e.x = entranceSpot(e); e.z = e.y - Y_OFF + 60; e.vz = -120; },
    update(e, n, dt) {
      if (n.landed) { e.sqx = 1.25; e.sqy = .72; return n.t > n.landed + .3; }
      e.vz -= GRAV * .9 * dt; e.z += e.vz * dt;
      if (e.z <= 0) { e.z = 0; e.vz = 0; n.landed = n.t; dust(e.x, e.y, 10); shakeMag = Math.max(shakeMag, 5); sfx('slam');
        fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .3, max: .3, r: 34, col: '#FFFFFF' });
        if (Math.hypot(P.x - e.x, (P.y - e.y) * 2) < 40 && P.z < 10) playerDamage(Math.round(e.dmg * .5), e.x, true); }
      return false;
    },
    draw(e, n, t, inner) {
      if (!n.landed) { const k = clamp(1 - e.z / 300, 0, 1); ctx.strokeStyle = `rgba(232,76,61,${.25 + .5 * k})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 40 - 20 * k, (40 - 20 * k) / 2.2, 0, 0, TAU); ctx.stroke(); }
      inner();
    },
  },
  rise: { max: 1.3, // the ground splits and it climbs up out of it
    start(e, n) { e.x = entranceSpot(e); e.z = 0; sfx('crunch'); },
    update(e, n, dt) {
      if (Math.random() < .5) { const chaos = (STAGES[stageIdx] || {}).theme === 'chaos';
        parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y + rand(-4, 4), z: 2, vx: rand(-40, 40), vy: 0, vz: rand(60, 160), life: .7, max: .7, col: chaos ? pick(['#6A3A8A', '#2A1B2C', '#B07AD8']) : pick(['#6B4A2E', '#4A3A26', '#8A6A44']), size: rand(2, 4), shape: chaos ? 'puff' : 'chunk', rot: 0, vr: 4 }); }
      if (n.t > .4 && !n.up) { n.up = true; sfx('growl'); shakeMag = Math.max(shakeMag, 3); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const k = clamp((n.t - .4) / .8, 0, 1), w = e.hw * 1.3 * Math.min(1, n.t / .3);
      ctx.fillStyle = (STAGES[stageIdx] || {}).theme === 'chaos' ? 'rgba(30,10,40,.85)' : 'rgba(30,20,12,.8)'; ell(e.x, e.y, w, w / 3.2); ctx.fill(); // the hole
      ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = 1.5; // cracks running out from it
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * w * .8, e.y + Math.sin(a) * w * .25); ctx.lineTo(e.x + Math.cos(a) * w * 1.6, e.y + Math.sin(a) * w * .5); ctx.stroke(); }
      if (k <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(e.x - 200, e.y - 400, 400, 400 + 3); ctx.clip(); // only what is above the ground shows
      ctx.translate(0, (1 - ease(k)) * e.hh * 1.25); inner(); ctx.restore();
    },
  },
  leap: { max: .9, // vaults in over the scenery at the back of the road
    start(e, n) { e.x = entranceSpot(e); n.y1 = e.y; n.y0 = FLOOR_TOP - rand(18, 34); n.x0 = e.x + rand(-60, 60); n.x1 = e.x; e.y = n.y0; sfx('whoosh'); dust(n.x0, n.y0, 4); },
    update(e, n, dt) {
      const k = Math.min(1, n.t / n.max); e.x = n.x0 + (n.x1 - n.x0) * k; e.y = n.y0 + (n.y1 - n.y0) * k; e.z = Math.sin(Math.PI * k) * 110;
      if (k >= 1) { e.z = 0; dust(e.x, e.y, 8); sfx('slam'); e.sqx = 1.2; e.sqy = .8; return true; }
      return false;
    },
    draw(e, n, t, inner) { const s = .55 + .45 * Math.min(1, n.t / n.max); // small while it is still far back
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(s, s); ctx.translate(-e.x, -e.y); inner(); ctx.restore(); },
  },
  rope: { max: 1.4, // a line drops from an airship overhead and it slides down it
    start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 50; e.z = n.z0; sfx('whoosh'); },
    update(e, n, dt) {
      const k = Math.min(1, n.t / .9); e.z = n.z0 * (1 - ease(k));
      if (k >= 1 && !n.down) { n.down = true; e.z = 0; dust(e.x, e.y, 6); sfx('slam'); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const top = Y_OFF - 10, back = n.down ? (n.t - .9) / .5 : 0, end = e.y - e.z - e.hh * (n.down ? 1 : .9);
      const bottom = n.down ? end - (end - top) * Math.min(1, back) : end; // the rope is hauled back up once it lands
      ctx.strokeStyle = C('#4A3424'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x + 3, top); ctx.quadraticCurveTo(e.x + 3 + Math.sin(t * 7) * 4, (top + bottom) / 2, e.x + 3, bottom); ctx.stroke();
      ctx.strokeStyle = C('#B8B8C0'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x + 3, bottom + 4, 4, Math.PI, TAU); ctx.stroke(); // the hook
      inner();
    },
  },
  mirror: { max: 1.3, // a pane of crystal rises out of the road; its reflection steps out and the glass shatters
    start(e, n) { e.x = entranceSpot(e); sfx('charge'); },
    update(e, n, dt) {
      if (n.t > .85 && !n.broke) { n.broke = true; sfx('hit-crystal'); burst(e.x, e.y, e.hh * .6, ['#E0C8FF', '#9FD8E0', '#FFFFFF'], 18, 'crystal', 0, true); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const h = (e.hh + 26) * ease(Math.min(1, n.t / .35)), w = e.hw + 14;
      if (!n.broke) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(e.x - w, e.y); ctx.lineTo(e.x - w + 8, e.y - h); ctx.lineTo(e.x + w, e.y - h - 6); ctx.lineTo(e.x + w - 6, e.y); ctx.closePath();
        const g = ctx.createLinearGradient(e.x - w, e.y - h, e.x + w, e.y); g.addColorStop(0, 'rgba(200,180,240,.55)'); g.addColorStop(1, 'rgba(120,180,200,.35)');
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = C('#E8DCFF'); ctx.lineWidth = 1.5; ctx.stroke(); ctx.clip();
        if (n.t > .3) { ctx.globalAlpha = clamp((n.t - .3) / .4, 0, 1) * .85; inner(); }
        ctx.restore();
      } else inner();
    },
  },
  rift: { max: 1.1, // a black tear in Shadow, edged in silver, opens on the road and it shoulders through
    start(e, n) { e.x = entranceSpot(e); sfx('whoosh'); },
    update(e, n, dt) { return n.t >= n.max; },
    draw(e, n, t, inner) {
      const open = n.t < .8 ? ease(Math.min(1, n.t / .3)) : 1 - (n.t - .8) / .3, h = (e.hh + 30) * open, cy = e.y - (e.hh + 30) / 2;
      if (open > 0) { ctx.fillStyle = 'rgba(10,6,14,.92)'; ctx.beginPath(); ctx.moveTo(e.x, cy - h / 2); ctx.quadraticCurveTo(e.x + 16 * open, cy, e.x, cy + h / 2); ctx.quadraticCurveTo(e.x - 16 * open, cy, e.x, cy - h / 2); ctx.fill();
        ctx.strokeStyle = C('#C8CCD8'); ctx.lineWidth = 1.5; ctx.stroke(); }
      const k = clamp((n.t - .25) / .45, 0, 1); if (k <= 0) return;
      ctx.save(); ctx.translate(e.x, 0); ctx.scale(k, 1); ctx.translate(-e.x, 0); inner(); ctx.restore();
    },
  },
  trump: { max: 1.5, // a Trump card stands up on the road, the figure on it comes alive and steps out
    start(e, n) { e.x = entranceSpot(e); sfx('trump'); },
    update(e, n, dt) {
      if (n.t > 1.05 && !n.out) { n.out = true; flashT = Math.max(flashT, .05); burst(e.x, e.y, e.hh * .6, ['#EED48A', '#FFFFFF'], 14, 'spark', 0, true); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const sc = e.champ ? 1.3 : 1, cw = (e.hw + 14) * sc, ch = (e.hh + 28) * sc, rise = ease(Math.min(1, n.t / .4)), x0 = e.x - cw, y0 = e.y - ch * rise;
      if (!n.out) {
        ctx.save(); ctx.fillStyle = '#1E1626'; rrect(x0, y0, cw * 2, ch * rise, 5); ctx.fill(); ctx.strokeStyle = '#EED48A'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(238,212,138,.5)'; ctx.lineWidth = 1; rrect(x0 + 4, y0 + 4, cw * 2 - 8, Math.max(0, ch * rise - 8), 3); ctx.stroke();
        ctx.beginPath(); ctx.rect(x0 + 4, y0 + 4, cw * 2 - 8, Math.max(0, ch * rise - 8)); ctx.clip();
        if (n.t > .4) { ctx.globalAlpha = clamp((n.t - .4) / .5, 0, 1); inner(); }
        ctx.restore();
      } else { const k = 1 - (n.t - 1.05) / .45; // the empty card folds away
        ctx.strokeStyle = `rgba(238,212,138,${k})`; ctx.lineWidth = 2; ctx.strokeRect(e.x - cw * k, y0, cw * 2 * k, ch); inner(); }
    },
  },
  swoop: { max: .9, // flyers dive in from high above and pull up into their hover
    start(e, n) { n.x1 = entranceSpot(e); n.x0 = n.x1 + (Math.random() < .5 ? -1 : 1) * 160; n.z0 = e.y - Y_OFF + 80; e.x = n.x0; e.z = n.z0; sfx('whoosh'); },
    update(e, n, dt) { const k = ease(Math.min(1, n.t / n.max)); e.x = n.x0 + (n.x1 - n.x0) * k; e.z = n.z0 + (e.def.hover - n.z0) * k; e.facing = Math.sign(n.x1 - n.x0); return n.t >= n.max; },
    draw(e, n, t, inner) { inner(); },
  },
};
// hook the entrances in: wave spawns and summons (not bosses, not the title screen's sparring pair)
{
  const _spawn = spawnEnemy;
  spawnEnemy = function (type, side, isBoss) {
    const e = _spawn(type, side, isBoss);
    if (!isBoss && mode === 'play' && typeof stage !== 'undefined' && stage) { const k = pickEntrance(e); if (k !== 'side') setEntrance(e, k); }
    return e;
  };
  const _champ = makeChampion; // a champion always makes an entrance through a Trump
  makeChampion = function (e) { _champ(e); if (e.def.move !== 'fly') setEntrance(e, 'trump'); };
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.state !== 'enter') return _upd(e, dt);
    e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); e.flash = Math.max(0, e.flash - dt);
    const n = e.ent; n.t += dt;
    if (ENTER_FX[n.kind].update(e, n, dt) || n.t > 4) { e.state = 'idle'; e.ent = null; e.z = e.def.move === 'fly' ? e.z : 0; e.vz = 0; e.cd = Math.max(e.cd, rand(.35, .8)); }
  };
  const _strike = strike; // nothing lands on them until they're through
  strike = function (e, ...a) { if (e.state === 'enter') return; return _strike(e, ...a); };
  const _draw = drawEnemy;
  drawEnemy = function (e, t) {
    if (e.state !== 'enter' || !e.ent) return _draw(e, t);
    ENTER_FX[e.ent.kind].draw(e, e.ent, t, () => _draw(e, t));
  };
}
{ // the ink box must reach up to whatever they come down from
  const _mb = mechBoxes;
  mechBoxes = function (box) { _mb(box); for (const e of enemies) if (e.state === 'enter') box(e.x, e.y, 0, 90, e.y - Y_OFF + 30); };
}
