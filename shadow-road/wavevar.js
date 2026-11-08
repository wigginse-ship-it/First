'use strict';
// ======================================================================================================
// THE GREAT SWORD'S WAVE AND THE HAMMER'S QUAKE, cursed and purified (the plain ones are world.js's and draw.js's own):
//   sword, cursed    the Bloodmoon Crescent: a taller black crescent rimmed in blood, slower; what it cuts bleeds
//   sword, purified  the Dawn Crescent: white-gold and fast; where it ends it breaks into three rays fanned along the street
//   hammer, cursed   the Black Fault: the crack it runs stays open behind it, and a moment later all of it erupts again
//   hammer, purified the Sunquake: a golden quake, wider, throwing them higher, ending in a pillar of sunlight
// game.js hands each new wave to waveSpawn; world.js and draw.js hand a variant to waveTick / drawWaveVar.
// ======================================================================================================
(() => {
  const VAR = () => { if (!P || (P.w !== 'sword' && P.w !== 'hammer')) return ''; const c = save && save.cw && save.cw[P.w]; return c ? (c.pure ? 'pure' : 'cursed') : ''; };
  const LATE = [];
  const near = (x, y, r) => enemies.filter(e => !e.dead && e.state !== 'enter' && Math.hypot(e.x - x, (e.y - y) * 2) < r + e.hw);
  const hitE = (e, d, dir, o) => { if (e && !e.dead) strike(e, d, dir, Object.assign({ dmg: d, power: 2 }, o)); };

  window.waveSpawn = (p) => { const v = VAR(); if (!v) return p; p.wv = v;
    if (p.quake) { if (v === 'cursed') { p.dmg = Math.round(p.dmg * 1.3); p.fault = []; p.fx0 = p.x; } else { p.dmg = Math.round(p.dmg * 1.55); p.vx *= 1.15; p.wide = 42; } }
    else { if (v === 'cursed') { p.dmg = Math.round(p.dmg * 1.3); p.vx *= .8; p.life = 1.2; p.tall = 1.4; } else { p.dmg = Math.round(p.dmg * 1.55); p.vx *= 1.4; p.life = .75; } }
    p.max = p.life; return p; };

  window.waveTick = (p, dt) => {
    const d = Math.sign(p.vx) || 1, reach = p.wide || (p.tall ? 34 : 26);
    for (const e of enemies) {
      if (e.dead || p.hit.has(e) || Math.abs(p.x - e.x) > 24 + e.hw * .3 || Math.abs(p.y - e.y) > reach) continue;
      p.hit.add(e);
      if (p.quake) { if (p.wv === 'pure') hitE(e, p.dmg, d, { kb: 140, launch: 520, smash: 1 }); else hitE(e, p.dmg, d, { kb: 120, launch: 360, smash: 1 }); }
      else if (p.wv === 'cursed') { hitE(e, p.dmg, d, { kb: 300, launch: 260 }); e.cwBleed = { t: 2.4, tick: .4, d: Math.max(1, Math.round(p.dmg * .12)) }; }
      else { hitE(e, p.dmg, d, { kb: 320, launch: 300 }); burst(e.x, e.y, e.hh * .5, ['#FFFFFF', '#FFF0C8', '#FFD27A'], 10, 'spark', 0, true); }
    }
    if (p.quake) { if (Math.random() < .9) dust(p.x, p.y, 1);
      if (p.wv === 'cursed' && Math.abs(p.x - (p.fault.length ? p.fault[p.fault.length - 1] : p.fx0)) > 24) p.fault.push(p.x);
      if (p.life <= dt) { if (p.wv === 'cursed') LATE.push({ k: 'fault', xs: p.fault.slice(), y: p.y, t: 0, at: .45, max: 1, dmg: Math.round(p.dmg * .7), d, done: false });
        else LATE.push({ k: 'sun', x: p.x, y: p.y, t: 0, at: .1, max: .9, dmg: Math.round(p.dmg * 1.3), done: false }); } }
    else if (p.wv === 'pure' && p.life <= dt && !p.split) { p.split = 1; // the dawn breaks into three rays, fanned along the street
      for (const dy of [-34, 0, 34]) projs.push({ owner: 'p', x: p.x, y: clamp(p.y + dy * .3, FLOOR_TOP + 6, FLOOR_BOT), vy: dy * 2.2, z: 0, vx: d * 420, dmg: Math.round(p.dmg * .55), life: .45, max: .45, hit: new Set(p.hit), wave: 1, wv: 'ray' });
      sfx('learned', .4); }
  };

  window.drawWaveVar = (p, t) => {
    const d = Math.sign(p.vx) || 1, a = Math.min(1, p.life / ((p.max || 1) * .35) + .0, 1), x = p.x, y = p.y - (p.z || 0), tt = performance.now() / 1000;
    ctx.save();
    if (p.quake) { // a running crack: black and blood, or gold light thrown up out of it
      const cur = p.wv === 'cursed';
      ctx.strokeStyle = cur ? '#14080E' : '#6A4A10'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - d * 70, p.y); for (let i = 0; i <= 7; i++) ctx.lineTo(x - d * (70 - i * 10), p.y + (i % 2 ? 3 : -2)); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = cur ? 'rgba(255,50,80,.85)' : 'rgba(255,230,150,.9)'; ctx.lineWidth = 1.1; ctx.stroke();
      for (let i = 0; i < 5; i++) { const sx = x - d * i * 13, h = (cur ? 26 : 34 - i * 4) * (1 + .2 * Math.sin(t * 30 + i)); const g = ctx.createLinearGradient(0, p.y, 0, p.y - h); g.addColorStop(0, cur ? 'rgba(200,30,60,.75)' : 'rgba(255,220,120,.85)'); g.addColorStop(1, cur ? 'rgba(60,8,24,0)' : 'rgba(255,250,220,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 6, p.y); ctx.lineTo(sx - 1, p.y - h); ctx.lineTo(sx + 5, p.y); ctx.closePath(); ctx.fill(); }
      if (!cur) { const g = ctx.createRadialGradient(x, p.y, 2, x, p.y, 60); g.addColorStop(0, 'rgba(255,236,170,.5)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ell(x, p.y, 60, 18); ctx.fill(); }
    } else { // a crescent: black-and-blood and tall, or white-gold, or one of the dawn's rays
      const cur = p.wv === 'cursed', ray = p.wv === 'ray', s = (p.tall || 1) * (ray ? .7 : 1);
      const cres = (ox, k) => { ctx.beginPath(); ctx.moveTo(x + ox - d * 10 * k, y); ctx.quadraticCurveTo(x + ox + d * 26 * k, y - 40 * k, x + ox + d * 6 * k, y - 82 * k); ctx.quadraticCurveTo(x + ox + d * 8 * k, y - 38 * k, x + ox - d * 22 * k, y); ctx.closePath(); };
      for (let i = 3; i >= 1; i--) { ctx.globalAlpha = a * (.18 * (4 - i)); cres(-d * 16 * i, s * (1 - i * .1)); ctx.fillStyle = cur ? '#3A0814' : '#FFE6A0'; ctx.fill(); }
      ctx.globalAlpha = a; cres(0, s);
      const g = ctx.createLinearGradient(x - d * 20, 0, x + d * 20, 0);
      if (cur) { g.addColorStop(0, 'rgba(10,2,6,.95)'); g.addColorStop(.7, '#3A0612'); g.addColorStop(1, '#FF3A5A'); } else { g.addColorStop(0, 'rgba(255,220,140,.4)'); g.addColorStop(.6, '#FFF4D0'); g.addColorStop(1, '#FFFFFF'); }
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = cur ? '#14040A' : 'rgba(200,150,60,.8)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = cur ? 'rgba(255,60,90,.9)' : 'rgba(255,255,240,.95)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x - d * 8 * s, y - 2); ctx.quadraticCurveTo(x + d * 24 * s, y - 40 * s, x + d * 6 * s, y - 80 * s); ctx.stroke();
      if (cur) for (let i = 0; i < 4; i++) { const k = (tt * 2 + i / 4) % 1; ctx.fillStyle = `rgba(200,20,50,${(1 - k) * .8 * a})`; circle(x - d * (4 + i * 6), y - 20 * s - k * 40, 1.6 + k); ctx.fill(); } // blood flung off its edge
      else { const hg = ctx.createRadialGradient(x, y - 40 * s, 4, x, y - 40 * s, 60 * s); hg.addColorStop(0, `rgba(255,240,200,${.4 * a})`); hg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = hg; ctx.fillRect(x - 60 * s, y - 100 * s, 120 * s, 110 * s); }
    }
    ctx.restore();
  };

  // what they leave: the fault erupting, the sun's pillar; and the bleeding
  { const _uh = updateHazards; updateHazards = function (dt) { _uh(dt);
    for (const L of LATE) { L.t += dt;
      if (L.k === 'fault' && !L.done && L.t >= L.at) { L.done = true; const seen = new Set(); for (const fx0 of L.xs) for (const e of near(fx0, L.y, 22)) { if (seen.has(e)) continue; seen.add(e); hitE(e, L.dmg, L.d, { kb: 80, launch: 380, smash: 1 }); } shakeMag = Math.max(shakeMag, 7); sfx('slam', .6); for (const fx0 of L.xs) burst(fx0, L.y, 4, ['#14080E', '#8A1E34', '#FF4A6A'], 3, 'rock', 0, true); }
      if (L.k === 'sun' && !L.done && L.t >= L.at) { L.done = true; for (const e of near(L.x, L.y, 90)) hitE(e, L.dmg, Math.sign(e.x - L.x) || 1, { kb: 100, launch: 600 }); shakeMag = Math.max(shakeMag, 8); sfx('learned', .5); fx.push({ kind: 'ring', x: L.x, y: L.y, z: 2, t: .6, max: .6, r: 110, col: '#FFE9A8', flat: 1 }); } }
    for (let i = LATE.length - 1; i >= 0; i--) if (LATE[i].t > LATE[i].max) LATE.splice(i, 1);
    for (const e of enemies) { const b = e.cwBleed; if (!b) continue; if (e.dead) { e.cwBleed = null; continue; } b.t -= dt; b.tick -= dt;
      if (b.tick <= 0) { b.tick = .4; strike(e, b.d, Math.sign(e.x - P.x) || 1, { dmg: b.d, kb: 0, launch: 0, power: 0, noStun: 1 }); }
      if (Math.random() < dt * 12 && parts.length < 420) parts.push({ x: e.x + rand(-e.hw, e.hw) * .5, y: e.y, z: e.z + rand(10, e.hh * .7), vx: rand(-20, 20), vy: 0, vz: rand(-20, 30), life: .5, max: .5, col: pick(['#8A1020', '#C02040']), size: rand(1.6, 2.6), shape: 'puff' });
      if (b.t <= 0) e.cwBleed = null; }
  }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const L of LATE) list.push([L.y + (L.k === 'sun' ? .3 : -40), () => onMain(() => { const q = L.t / L.max; ctx.save();
      if (L.k === 'fault') { const open = L.done ? Math.max(0, 1 - (L.t - L.at) / .5) : 1; ctx.strokeStyle = `rgba(16,6,12,${(.9 * open).toFixed(3)})`; ctx.lineWidth = 3; ctx.beginPath(); L.xs.forEach((fx0, i) => { const yy = L.y + (i % 2 ? 2 : -2); i ? ctx.lineTo(fx0, yy) : ctx.moveTo(fx0, yy); }); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,50,80,${((L.done ? 1 : .4 + .4 * Math.sin(L.t * 30)) * open).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.stroke();
        if (L.done && L.t - L.at < .3) for (const fx0 of L.xs) { const h = 40 * (1 - (L.t - L.at) / .3); ctx.fillStyle = 'rgba(200,30,60,.6)'; ctx.beginPath(); ctx.moveTo(fx0 - 5, L.y); ctx.lineTo(fx0, L.y - h); ctx.lineTo(fx0 + 5, L.y); ctx.fill(); } }
      else if (L.k === 'sun') { const A = 1 - q, w = 34 * (1 - q * .6), lg = ctx.createLinearGradient(L.x - w, 0, L.x + w, 0); ctx.globalCompositeOperation = 'lighter';
        lg.addColorStop(0, 'rgba(255,210,120,0)'); lg.addColorStop(.5, `rgba(255,252,236,${(.9 * A).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = lg; ctx.fillRect(L.x - w, L.y - 360, w * 2, 360); }
      ctx.restore(); })]);
  }; }
})();
