// ---------- how enemies arrive ----------
// Each kind of enemy comes on in a way that fits what it is. Bandits and boars burst out from behind the trees and bushes
// along the road; archers and jellyblooms drop out of the branches; golems break up out of the ground; cog spiders let
// themselves down on a thread; the Skyport's machines are beamed down by an airship overhead, its kettle tanks float down
// in parachute crates and its corsairs swing in on a line from the rigging; pixies open out of a flower; prism constructs
// pull themselves together out of flying shards; the Courts' knights climb up out of the abyss... A few still walk in.
const ENTRY = {
  slime: ['canopy', 'ooze'], boar: ['behind', 'behind', 'leap'], wisp: ['bud'], golem: ['rise', 'drop'], drone: ['beam', 'swoop'],
  spider: ['thread'], knight: ['beam', 'behind'], tank: ['parachute'], imp: ['mirror', 'leap'], jelly: ['drift'], shardling: ['rise'],
  bandit: ['behind', 'leap'], archer: ['canopy', 'behind'], corsair: ['swing'], gunner: ['rope', 'behind'], cultist: ['behind', 'smoke'],
  witch: ['rift'], sentinel: ['rise'], lantern: ['beam', 'swoop'], sdrone: ['beam', 'swoop'], skyray: ['surge'], cloudram: ['cloud'],
  cgolem: ['assemble'], chknight: ['climb', 'leap'], chadept: ['smoke'], chborel: ['leap'], chhound: ['behind', 'leap'], cheye: ['open'],
  chmoth: ['swarm'], chbrute: ['drop'], eric: ['trump'],
};
// ---------- cover along the road: what they hide behind ----------
let covers = [];
const coverKind = (th) => /^(bloom|unicorn)/.test(th) ? ['tree', 'bush', 'tree'] : /^sky/.test(th) ? ['crates'] : /^prism/.test(th) ? ['crystal'] : /^chaos/.test(th) ? ['pillar'] : [];
function placeCovers() {
  covers = []; const kinds = coverKind(stage.theme); if (!kinds.length || stage.bossRoom || (stage.room && stage.room.kind !== 'grove')) return;
  const r = mulberry(stageIdx * 131 + zoneIdx * 17 + 5);
  for (let x = 260 + r() * 80; x < stage.len - 160; x += 170 + r() * 120) {
    const kind = kinds[Math.floor(r() * kinds.length)];
    covers.push({ kind, x, y: FLOOR_TOP + 6 + r() * 10, s: .85 + r() * .3, seed: r(), shake: 0 });
  }
  for (const c of covers) coverPaint(c.kind, Math.floor(c.seed * 3)); // painted now, while the place is being set up, rather than mid-fight
}
function coverNear(e, kinds) { // a piece of cover in view, not right beside him
  const ok = covers.filter(c => (!kinds || kinds.includes(c.kind)) && c.x > camX + 40 && c.x < camX + VW - 40 && Math.abs(c.x - P.x) > 80);
  return ok.length ? pick(ok) : null;
}
// The cover is painted the way the background around it is (paint.js propSprite): a tree like the vale's own trees, a
// bush of the same leaf dabs, crates of weathered planks, a crystal cluster, a standing stone of the Courts.
const COVER_PAL = { // leaves (dark, body, lit) and a glint of blossom, by place
  bloom: [['#2F5446', '#3D6A52', '#C9C57E'], '#F6CDB0', '#E8A0B0'], bloom2: [['#22382E', '#36523E', '#8E9A62'], '#F0C080', '#C8A0A8'],
  unicornGrove: [['#24384A', '#3A5468', '#A8BCC8'], '#E6ECFF', '#C8C8F0'] };
const coverPal = () => COVER_PAL[stage.theme] || COVER_PAL[/^bloom/.test(stage.theme) ? 'bloom' : 'unicornGrove'] || COVER_PAL.bloom;
function coverPaint(kind, v) { // v: which of three versions of it
  const r = mulberry(v * 977 + kind.length * 31 + 7), pal = coverPal();
  if (kind === 'tree') return propSprite('tree' + v, 210, 214, 105, 198, (th, s) => {
    paintTree(0, 0, 158 + v * 8, r, pal[0], v !== 1 ? pal[1] : null);
    for (let i = 0; i < 9; i++) dab((r() - .5) * 30, -1 - r() * 3, 2 + r() * 3, i % 2 ? pal[0][0] : '#3A2C2A', .7); // grass and roots about its foot
  }, { foot: 30, seed: 5 + v });
  if (kind === 'bush') return propSprite('bush' + v, 120, 74, 60, 62, (th, s) => {
    const g = [shade(pal[0][0], -.3), pal[0][0], pal[0][1], pal[0][2]];
    awBush(0, 2, 62 + v * 6, 24, r, g);
    for (let i = 0; i < 7; i++) { const x = (r() - .5) * 52, y = -14 - r() * 18; dab(x, y, 1.8 + r() * 1.2, pal[2], .85); dab(x + s * .6, y - .6, .9, '#FFF0E8', .7); } // blossom
  }, { foot: 14, seed: 11 + v });
  if (kind === 'crates') return propSprite('crates' + v, 96, 92, 50, 80, (th, s) => {
    const wood = ['#6A4A2E', '#765234', '#62442A'][v], box = (x, y, w, h, k) => { // one crate: planked faces, a lit top, the shadow side darker, a brace, brass at the corners
      const body = shade(wood, (k - 1) * .06), top = 4.5;
      ctx.fillStyle = body; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = shade(body, .26); awPath([x, y, x + w, y, x + w + s * 3, y - top, x + s * 3, y - top]); ctx.fill(); // the lid catching the light
      ctx.fillStyle = shade(body, -.5); ctx.fillRect(x, y + h - 2.2, w, 2.2); // its seat, dark where it rests
      ctx.fillStyle = shade(body, -.5); s > 0 ? ctx.fillRect(x - 3.5, y - top * .5, 3.5, h + top * .5) : ctx.fillRect(x + w, y - top * .5, 3.5, h + top * .5); // the shadowed end
      for (let k2 = 1; k2 < 4; k2++) { const py = y + h * k2 / 4; ctx.fillStyle = shade(body, -.3); ctx.fillRect(x + 1, py - .4, w - 2, .9); ctx.fillStyle = shade(body, .2); ctx.globalAlpha = .6; ctx.fillRect(x + 1, py + .6, w - 2, .6); ctx.globalAlpha = 1; } // plank seams
      for (let i = 0; i < 14; i++) dab(x + 2 + r() * (w - 4), y + 2 + r() * (h - 4), 1.4 + r() * 2.4, r() < .5 ? shade(body, .16) : shade(body, -.2), .45); // weathering
      ctx.strokeStyle = shade(body, -.42); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 3, y + h - 3); ctx.lineTo(x + w - 3, y + 3); ctx.stroke(); // the brace
      ctx.strokeStyle = shade(body, .28); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x + 3.5, y + h - 4.2); ctx.lineTo(x + w - 4.2, y + 3.5); ctx.stroke();
      ctx.fillStyle = '#9A7A44'; for (const [cx, cy] of [[x, y], [x + w - 4, y], [x, y + h - 4], [x + w - 4, y + h - 4]]) { ctx.fillRect(cx, cy, 4, 4); } ctx.fillStyle = '#E8C890'; ctx.globalAlpha = .7; for (const cx of [x, x + w - 4]) ctx.fillRect(cx + (s > 0 ? 2.6 : 0), y, 1.2, 4); ctx.globalAlpha = 1;
    };
    if (v === 2) { box(-34, -28, 28, 28, 0); box(-4, -30, 30, 30, 1); box(-20, -56, 24, 24, 2); }
    else { box(-30, -30, 30, 30, 0); box(0, -26, 26, 26, 1); if (v === 0) box(-18, -56, 26, 26, 2); else { box(-26, -54, 22, 22, 2); } }
  }, { foot: 12, seed: 13 + v, haze: .04, warm: .08, line: .85, lw: .9 });
  if (kind === 'crystal') return propSprite('crystal' + v, 170, 150, 85, 132, (th, s) => {
    const hue = [190, 280, 320][v];
    awCluster(0, -3, 76 + v * 6, hue, r, 54);
    for (let i = 0; i < 6; i++) dab((r() - .5) * 50, -1 - r() * 3, 2 + r() * 3, '#2A2044', .7); // shards and grit about its foot
  }, { foot: 22, seed: 17 + v, haze: .08 });
  if (kind === 'pillar') return propSprite('pillar' + v, 70, 112, 35, 100, (th, s) => {
    const bone = stage.theme === 'chaos2', P = bone ? { base: '#9A8274', lit: '#F2DCC0', dark: '#3E2C48', glyph: '#C9A040' } : { base: '#1E1428', lit: '#4E3A62', dark: '#08050C', glyph: '#FF8A3C' };
    const h = 72 + v * 6, pts = [-14, 0, -13, -h + 6, -6 + v, -h - 4, 1, -h + 6 - v * 2, 7, -h + 1, 13, -h + 8, 14, 0];
    awPath(pts); ctx.fillStyle = P.base; ctx.fill();
    ctx.save(); awPath(pts); ctx.clip();
    ctx.fillStyle = P.lit; ctx.globalAlpha = .75; ctx.fillRect(s > 0 ? 4 : -14, -h - 10, 10, h + 10); ctx.globalAlpha = 1; // the face toward the light
    ctx.fillStyle = P.dark; ctx.globalAlpha = .55; ctx.fillRect(s > 0 ? -14 : 9, -h - 10, 5, h + 10); ctx.globalAlpha = 1;
    for (let i = 0; i < 40; i++) dab((r() - .5) * 26, -r() * h, 1 + r() * 1.8, r() < .5 ? P.lit : P.dark, bone ? .14 : .22); // the stone's grain
    ctx.strokeStyle = P.dark; ctx.lineWidth = .8; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(-6 + v, -h - 2); ctx.lineTo(-3, -h + 14); ctx.lineTo(-7, -h + 24); ctx.stroke(); ctx.globalAlpha = 1; // a crack from the broken top
    ctx.restore();
    ctx.fillStyle = shade(P.base, -.2); ctx.fillRect(-18, -6, 36, 6); ctx.fillStyle = P.lit; ctx.globalAlpha = .6; ctx.fillRect(-18, -6, 36, 1.2); ctx.globalAlpha = 1; // its plinth
    awGlow(P.glyph, 5, () => { ctx.strokeStyle = P.glyph; ctx.globalAlpha = .75; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-5, -20 - i * 16); ctx.lineTo(0, -26 - i * 16); ctx.lineTo(5, -20 - i * 16); } ctx.stroke(); ctx.globalAlpha = 1; }); // the chevrons, smouldering
    for (let i = 0; i < 6; i++) dab((r() - .5) * 40, -2 - r() * 2, 1.5 + r() * 2, P.dark, .4); // grit at its foot
  }, { foot: 16, seed: 19 + v, haze: .1 });
  return null;
}
function drawCover(c, t) {
  const sh = c.shake > 0 ? Math.sin(t * 60) * 2.5 * Math.min(1, c.shake * 3) : 0, s = coverPaint(c.kind, Math.floor(c.seed * 3)); if (!s) return;
  const tree = c.kind === 'tree', o = { sx: c.s, sy: c.s, sh: { tree: 46, bush: 38, crates: 40, crystal: 40, pillar: 26 }[c.kind] };
  if (tree) o.sk = sh * .01; // the tree sways from its foot, its crown thrashing
  propDraw(s, c.x + (tree ? 0 : sh * (c.kind === 'bush' ? 1 : .4)), c.y, o);
}
function leafBurst(c, n) {
  const leaf = c.kind === 'tree' || c.kind === 'bush', z = c.kind === 'tree' ? 100 : 20, pal = leaf ? coverPal()[0] : null;
  for (let i = 0; i < n; i++) parts.push({ x: c.x + rand(-26, 26), y: c.y + rand(-3, 3), z: z + rand(-14, 20), vx: rand(-60, 60), vy: 0, vz: rand(-10, 60), life: 1.2, max: 1.2,
    col: leaf ? pick(pal) : c.kind === 'crystal' ? pick(['#8CB8C8', '#C8B0E0']) : c.kind === 'pillar' ? pick(['#2A1E36', '#4E3A62']) : pick(['#6B4A2E', '#4A3A26']), size: rand(2, 4), shape: leaf ? 'tuft' : 'chunk', rot: rand(0, 6), vr: 4 });
}

// ---------- the entrances ----------
function entranceSpot(e) { // somewhere in view, but never right on top of him
  for (let i = 0; i < 10; i++) { const x = rand(camX + 70, camX + VW - 70); if (Math.abs(x - P.x) > 100 && !enemies.some(o => o !== e && o.state === 'enter' && Math.abs(o.x - x) < 50)) return x; }
  return clamp(P.x + (P.x < camX + VW / 2 ? 170 : -170), camX + 60, camX + VW - 60);
}
function setEntrance(e, kind) {
  const D = ENTER_FX[kind]; if (!D) return false;
  const n = { kind, t: 0, max: D.max };
  if (D.cover) { n.c = coverNear(e, D.cover); if (!n.c) return false; }
  e.ent = n; e.state = 'enter'; e.plan = null; e.vx = 0;
  D.start(e, n); if (!D.keepFace) e.facing = Math.sign(P.x - e.x) || -1;
  return true;
}
function chooseEntrance(e) {
  if (stage.secret && stage.room && stage.room.kind === 'hall') return setEntrance(e, 'trump'); // in the Hall of Trumps, everyone comes by card
  const opts = (ENTRY[e.type] || [e.def.move === 'fly' ? 'swoop' : 'leap']).slice().sort(() => Math.random() - .5);
  if (e.type !== 'eric' && Math.random() < .2) return false; // now and then one just walks in
  for (const k of opts) if (setEntrance(e, k)) return true;
  return setEntrance(e, e.def.move === 'fly' ? 'swoop' : 'leap');
}
const lerp2 = (a, b, k) => a + (b - a) * k;
const groundY = () => rand(FLOOR_TOP + 16, FLOOR_BOT - 8);
const ENTER_FX = {
  behind: { max: 1.05, cover: ['tree', 'bush', 'crates', 'crystal', 'pillar'], // hidden behind it: it shakes, then out they come
    start(e, n) { const c = n.c; c.shake = .5; n.x0 = c.x; n.y0 = c.y - 1; n.dir = Math.sign(P.x - c.x) || 1; n.x1 = c.x + n.dir * (e.def.draw === 'boar' || e.def.draw === 'w4hound' ? 110 : 55); n.y1 = groundY(); e.x = n.x0; e.y = n.y0; },
    update(e, n, dt) {
      if (n.t < .45) { if (Math.random() < dt * 20) leafBurst(n.c, 1); return false; }
      if (!n.out) { n.out = true; leafBurst(n.c, 10); sfx(e.def.draw === 'boar' ? 'growl' : 'whoosh'); }
      const k = Math.min(1, (n.t - .45) / .6); e.x = lerp2(n.x0, n.x1, ease(k)); e.y = lerp2(n.y0, n.y1, ease(k)); e.z = Math.sin(Math.PI * k) * (e.def.move === 'hop' ? 40 : 18); e.walk += dt * 10;
      if (k >= 1) { e.z = 0; dust(e.x, e.y, 4); return true; } return false;
    },
    draw(e, n, t, inner) { if (n.t >= .45) inner(); },
  },
  canopy: { max: 2.2, cover: ['tree'], // up in the branches: the crown shakes, then down it comes (a jellybloom on a string of goo)
    start(e, n) { const c = n.c; c.shake = .6; e.x = c.x + rand(-14, 14); e.y = c.y + 4; n.z0 = 100 * c.s; e.z = n.z0; n.x1 = c.x + (Math.sign(P.x - c.x) || 1) * 40; n.y1 = groundY(); },
    update(e, n, dt) {
      if (n.t < .55) { if (Math.random() < dt * 25) leafBurst(n.c, 1); return false; }
      if (!n.go) { n.go = true; leafBurst(n.c, 12); sfx('whoosh'); e.vz = e.def.draw === 'slime' ? -10 : 120; }
      if (e.def.draw === 'slime' && n.t < 1.35) { e.z = n.z0 - (n.z0 - 40) * ease((n.t - .55) / .8); return false; } // hangs on its goo, then lets go
      e.vz -= GRAV * dt; e.z += e.vz * dt; e.x += (n.x1 - e.x) * Math.min(1, dt * 3); e.y += (n.y1 - e.y) * Math.min(1, dt * 3);
      if (e.z <= 0) { e.z = 0; e.sqx = 1.3; e.sqy = .7; dust(e.x, e.y, 6); sfx(e.def.draw === 'slime' ? 'hit-goo' : 'slam'); return true; } return false;
    },
    draw(e, n, t, inner) {
      if (n.t < .55) return;
      if (e.def.draw === 'slime' && n.t < 1.35) { ctx.strokeStyle = 'rgba(217,140,160,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(n.c.x, n.c.y - n.z0 + 6); ctx.lineTo(e.x, e.y - e.z - e.hh * .8); ctx.stroke(); }
      inner();
    },
  },
  thread: { max: 2.2, // a cog spider lets itself down on a thread from the rigging, hangs a moment, then drops
    start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 30; e.z = n.z0; },
    update(e, n, dt) {
      if (n.t < 1.1) { e.z = lerp2(n.z0, 50, ease(n.t / 1.1)); return false; }
      if (n.t < 1.5) { e.z = 50 + Math.sin(n.t * 9) * 3; return false; }
      if (!n.cut) { n.cut = true; e.vz = 0; sfx('whoosh'); }
      e.vz -= GRAV * dt; e.z += e.vz * dt; if (e.z <= 0) { e.z = 0; dust(e.x, e.y, 5); sfx('hit-metal'); return true; } return false;
    },
    draw(e, n, t, inner) {
      if (!n.cut) { ctx.strokeStyle = 'rgba(230,230,240,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e.x, Y_OFF - 6); ctx.lineTo(e.x, e.y - e.z - e.hh * .5); ctx.stroke(); }
      ctx.save(); if (!n.cut) { ctx.translate(e.x, e.y - e.z - e.hh / 2); ctx.rotate(Math.sin(n.t * 2) * .3); ctx.translate(-e.x, -(e.y - e.z - e.hh / 2)); } inner(); ctx.restore();
    },
  },
  rise: { max: 1.3, // the ground splits and it climbs up out of it (a shard crab bursts up through crystal grit)
    start(e, n) { e.x = entranceSpot(e); e.z = 0; sfx('crunch'); n.crystal = e.def.draw === 'crab'; },
    update(e, n, dt) {
      if (Math.random() < .5) { const chaos = /^chaos/.test(stage.theme);
        parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y + rand(-4, 4), z: 2, vx: rand(-40, 40), vy: 0, vz: rand(60, 160), life: .7, max: .7, col: n.crystal ? pick(['#9FD8E0', '#E0C8FF', '#FFFFFF']) : chaos ? pick(['#6A3A8A', '#2A1B2C', '#B07AD8']) : pick(['#6B4A2E', '#4A3A26', '#8A6A44']), size: rand(2, 4), shape: n.crystal ? 'shard' : chaos ? 'puff' : 'chunk', rot: 0, vr: 4 }); }
      if (n.t > .4 && !n.up) { n.up = true; sfx(n.crystal ? 'hit-crystal' : 'growl'); shakeMag = Math.max(shakeMag, e.def.draw === 'golem' || e.def.draw === 'knight' ? 6 : 3); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const k = clamp((n.t - .4) / .8, 0, 1), w = e.hw * 1.3 * Math.min(1, n.t / .3);
      ctx.fillStyle = /^chaos/.test(stage.theme) ? 'rgba(30,10,40,.85)' : 'rgba(30,20,12,.8)'; ell(e.x, e.y, w, w / 3.2); ctx.fill(); // the hole
      ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = 1.5; // cracks running out from it
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * w * .8, e.y + Math.sin(a) * w * .25); ctx.lineTo(e.x + Math.cos(a) * w * 1.6, e.y + Math.sin(a) * w * .5); ctx.stroke(); }
      if (k <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(e.x - 200, e.y - 400, 400, 400 + 3); ctx.clip(); // only what is above the ground shows
      ctx.translate(0, (1 - ease(k)) * e.hh * 1.25); inner(); ctx.restore();
    },
  },
  drop: { max: 2.2, // falls from far overhead: a ring on the floor marks where it lands
    start(e, n) { e.x = entranceSpot(e); e.z = e.y - Y_OFF + 60; e.vz = -120; },
    update(e, n, dt) {
      if (n.landed) { e.sqx = 1.25; e.sqy = .72; return n.t > n.landed + .3; }
      if (n.t < (n.wait || 0)) return false;
      e.vz -= GRAV * .9 * dt; e.z += e.vz * dt;
      if (e.z <= 0) { e.z = 0; e.vz = 0; n.landed = n.t; dust(e.x, e.y, 10); shakeMag = Math.max(shakeMag, e.hh > 50 ? 9 : 5); sfx('slam');
        fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .3, max: .3, r: 34, col: '#FFFFFF' });
        if (Math.hypot(P.x - e.x, (P.y - e.y) * 2) < 40 && P.z < 10) playerDamage(Math.round(e.dmg * .5), e.x, true); }
      return false;
    },
    draw(e, n, t, inner) {
      if (!n.landed) { const k = clamp(1 - e.z / 300, 0, 1); ctx.strokeStyle = `rgba(232,76,61,${.25 + .5 * k})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 40 - 20 * k, (40 - 20 * k) / 2.2, 0, 0, TAU); ctx.stroke(); }
      if (n.cloud) drawCloud(n.cx, e.y - n.cz - 10 + Math.max(0, n.t - .6) * -30, Math.max(0, 1 - Math.max(0, n.t - 1) / .8), t);
      if (!n.cloud || n.t > .5) inner();
    },
  },
  leap: { max: .9, // vaults in over the scenery at the back of the road
    start(e, n) { e.x = entranceSpot(e); n.y1 = groundY(); n.y0 = FLOOR_TOP - rand(18, 34); n.x0 = e.x + rand(-60, 60); n.x1 = e.x; e.y = n.y0; sfx('whoosh'); dust(n.x0, n.y0, 4); },
    update(e, n, dt) {
      const k = Math.min(1, n.t / n.max); e.x = lerp2(n.x0, n.x1, k); e.y = lerp2(n.y0, n.y1, k); e.z = Math.sin(Math.PI * k) * 110;
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
  swing: { max: 1.6, keepFace: 1, // a corsair swings in on a line from the rigging, lets go and lands
    start(e, n) { n.dir = P.x > camX + VW / 2 ? -1 : 1; n.px = clamp(P.x - n.dir * 120, camX + 60, camX + VW - 60); n.pz = e.y - Y_OFF + 10; n.L = n.pz - 40;
      n.a0 = -n.dir * 1.15; e.facing = n.dir; swingPos(e, n, n.a0); sfx('whoosh'); },
    update(e, n, dt) {
      if (!n.free) { const k = Math.min(1, n.t / .8); n.a = lerp2(n.a0, n.dir * .55, Math.sin(k * Math.PI / 2)); swingPos(e, n, n.a);
        if (k >= 1) { n.free = true; n.rt = n.t; e.vx = n.dir * 160; e.vz = 160; } return false; }
      e.vz -= GRAV * dt; e.z += e.vz * dt; e.x += e.vx * dt;
      if (e.z <= 0) { e.z = 0; e.vx = 0; dust(e.x, e.y, 6); sfx('slam'); e.sqx = 1.2; e.sqy = .8; return true; } return false;
    },
    draw(e, n, t, inner) {
      const py = e.y - n.pz; let hx = e.x, hy = e.y - e.z - e.hh * .85;
      if (n.free) { const k = Math.min(1, (n.t - n.rt) * 2); hx = n.px + n.L * Math.sin(n.dir * .55 * (1 - k)); hy = py + n.L * Math.cos(n.dir * .55 * (1 - k)); } // the line swings back empty
      ctx.strokeStyle = C('#4A3424'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(n.px, py); ctx.lineTo(hx, hy); ctx.stroke(); inner();
    },
  },
  beam: { max: 1.9, // an airship slides in overhead and beams it down in a column of light
    start(e, n) { e.x = entranceSpot(e); e.z = e.def.move === 'fly' ? e.def.hover : 0; sfx('charge'); },
    update(e, n, dt) {
      if (n.t > .5 && !n.hum) { n.hum = true; sfx('charge', 2); }
      if (n.t > 1.3 && !n.done) { n.done = true; flashT = Math.max(flashT, .04); burst(e.x, e.y, e.z + e.hh / 2, ['#FFF0C0', '#9FE0FF'], 10, 'spark', 0, true); }
      return n.t >= n.max;
    },
    draw(e, n, t, inner) {
      const sx = n.t < .45 ? ease(n.t / .45) : n.t > 1.45 ? 1 + ease((n.t - 1.45) / .45) : 1, shipX = e.x + (1 - sx) * 260, shipY = Y_OFF + 30; // in, hold, away
      const beamK = n.t < .45 ? 0 : n.t < .6 ? (n.t - .45) / .15 : n.t < 1.3 ? 1 : Math.max(0, 1 - (n.t - 1.3) / .2);
      if (beamK > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, shipY, 0, e.y); g.addColorStop(0, `rgba(255,236,190,${.45 * beamK})`); g.addColorStop(1, `rgba(160,220,255,${.3 * beamK})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e.x - 8, shipY + 10); ctx.lineTo(e.x + 8, shipY + 10); ctx.lineTo(e.x + e.hw + 18, e.y + 4); ctx.lineTo(e.x - e.hw - 18, e.y + 4); ctx.closePath(); ctx.fill();
        ell(e.x, e.y, e.hw + 18, 7); ctx.fillStyle = `rgba(255,240,200,${.35 * beamK})`; ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.translate(shipX, shipY); // the airship: a brass-banded gasbag over a little gondola
      ctx.fillStyle = C('#8A6A4A'); ell(0, -14, 54, 14); ctx.fill(); outline(1.4); ctx.strokeStyle = C('#C8A050'); ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 18, -26); ctx.lineTo(i * 18, -2); ctx.stroke(); }
      ctx.fillStyle = C('#6A4A34'); ctx.beginPath(); ctx.moveTo(52, -14); ctx.lineTo(66, -26); ctx.lineTo(66, -2); ctx.closePath(); ctx.fill(); outline(1.1);
      ctx.fillStyle = C('#5A4030'); ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(18, 10); ctx.lineTo(-18, 10); ctx.closePath(); ctx.fill(); outline(1.2);
      ctx.fillStyle = C('#FFE6A0'); circle(0, 9, 4); ctx.fill(); ctx.restore();
      if (n.t < .6) return; // it materialises from the top down
      const k = Math.min(1, (n.t - .6) / .7), top = e.y - e.z - e.hh * 1.3 - 10;
      ctx.save(); ctx.beginPath(); ctx.rect(e.x - 200, top - 20, 400, (e.y + 10 - top + 20) * k + 1); ctx.clip(); if (k < 1) ctx.globalAlpha = .55 + .45 * k; inner(); ctx.restore();
    },
  },
  parachute: { max: 2.6, // a crate floats down under a parachute, thumps down and bursts open
    start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 40; e.z = n.z0; },
    update(e, n, dt) {
      if (!n.land) { e.z = Math.max(0, n.z0 - n.t * 150); e.x += Math.sin(n.t * 2) * 10 * dt; if (e.z <= 0) { n.land = n.t; shakeMag = Math.max(shakeMag, 4); sfx('slam'); dust(e.x, e.y, 8); } return false; }
      if (!n.open && n.t > n.land + .35) { n.open = true; sfx('break'); burst(e.x, e.y, 20, ['#9A7448', '#C8A050', '#5A4028'], 18, 'chunk', 0, true); }
      return n.open && n.t > n.land + .55;
    },
    draw(e, n, t, inner) {
      if (n.open) { inner(); return; }
      const y = e.y - e.z, w = e.hw + 10, h = e.hh + 4;
      if (!n.land) { ctx.strokeStyle = C('#3A2A1E'); ctx.lineWidth = 1; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(e.x + s * w, y - h); ctx.lineTo(e.x + s * 34, y - h - 46); } ctx.stroke();
        ctx.fillStyle = C('#D8C8A8'); ctx.beginPath(); ctx.moveTo(e.x - 38, y - h - 44); ctx.quadraticCurveTo(e.x, y - h - 92, e.x + 38, y - h - 44); ctx.quadraticCurveTo(e.x, y - h - 56, e.x - 38, y - h - 44); ctx.fill(); outline(1.3);
        ctx.strokeStyle = C('#B85A4A'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, y - h - 70); ctx.lineTo(e.x, y - h - 50); ctx.stroke(); }
      const jit = n.land ? Math.sin(t * 50) * 1.5 : 0;
      ctx.fillStyle = C('#9A7448'); ctx.fillRect(e.x - w + jit, y - h, w * 2, h); ctx.beginPath(); ctx.rect(e.x - w + jit, y - h, w * 2, h); outline(1.4);
      ctx.strokeStyle = C('#C8A050'); ctx.lineWidth = 2.5; ctx.strokeRect(e.x - w + 3 + jit, y - h + 3, w * 2 - 6, h - 6); ctx.strokeStyle = C('#5A4028'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x - w + 4 + jit, y - h + 4); ctx.lineTo(e.x + w - 4 + jit, y - 4); ctx.stroke();
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
  ooze: { max: 1.3, // a puddle spreads on the road and bubbles itself up into a jellybloom
    start(e, n) { e.x = entranceSpot(e); },
    update(e, n, dt) { if (Math.random() < dt * 14) parts.push({ x: e.x + rand(-14, 14), y: e.y, z: 1, vx: 0, vy: 0, vz: rand(30, 70), life: .4, max: .4, col: 'rgba(240,170,190,.7)', size: rand(2, 3.5), shape: 'blob' }); if (n.t > .5 && !n.s) { n.s = 1; sfx('hit-goo'); } return n.t >= n.max; },
    draw(e, n, t, inner) {
      const p = Math.min(1, n.t / .4); ctx.fillStyle = C('#D98CA0'); ell(e.x, e.y, (e.hw + 8) * p, 5 * p); ctx.fill(); outline(1);
      const k = clamp((n.t - .45) / .7, 0, 1); if (k <= 0) return;
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1 + (1 - k) * .4, ease(k)); ctx.translate(-e.x, -e.y); inner(); ctx.restore();
    },
  },
  bud: { max: 1.6, // a great flower bud pushes up out of the grass, opens, and a pixie flies out of it
    start(e, n) { e.x = entranceSpot(e); e.z = 22; },
    update(e, n, dt) { if (n.t > .8) { if (!n.out) { n.out = 1; sfx('whoosh'); } e.z = lerp2(22, e.def.hover, ease(Math.min(1, (n.t - .8) / .7))); } return n.t >= n.max; },
    draw(e, n, t, inner) {
      const g = ease(Math.min(1, n.t / .5)), op = clamp((n.t - .5) / .3, 0, 1), fade = n.t > 1.2 ? 1 - (n.t - 1.2) / .4 : 1, h = 26 * g;
      ctx.save(); ctx.globalAlpha = Math.max(0, fade); ctx.strokeStyle = C('#4E7A3A'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.quadraticCurveTo(e.x - 4, e.y - h / 2, e.x, e.y - h); ctx.stroke();
      ctx.fillStyle = C('#7EA460'); ell(e.x - 7, e.y - 6, 7 * g, 3 * g, -.4); ctx.fill(); outline(1);
      for (let i = 0; i < 5; i++) { const a = (i - 2) * (.18 + .5 * op); ctx.fillStyle = C(i % 2 ? '#E8A0B8' : '#D98CA0'); ctx.save(); ctx.translate(e.x, e.y - h); ctx.rotate(a); ell(0, -10 * g, 5 * g, 10 * g); ctx.fill(); outline(1); ctx.restore(); }
      ctx.restore(); if (n.t > .7) inner();
    },
  },
  drift: { max: 2, // an aurora jelly drifts slowly down from the sky, trailing ribbons of light
    start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 60; e.z = n.z0; n.x0 = e.x; },
    update(e, n, dt) { const k = ease(Math.min(1, n.t / n.max)); e.z = lerp2(n.z0, e.def.hover, k); e.x = n.x0 + Math.sin(n.t * 2.2) * 18 * (1 - k);
      if (Math.random() < dt * 20) parts.push({ x: e.x + rand(-8, 8), y: e.y, z: e.z + e.hh * .6, vx: 0, vy: 0, vz: 20, life: .9, max: .9, col: pick(['rgba(160,230,220,.6)', 'rgba(220,170,240,.6)']), size: rand(2, 3.5), shape: 'puff' }); return n.t >= n.max; },
    draw(e, n, t, inner) { inner(); },
  },
  surge: { max: 1.2, // a sky ray comes up from the clouds below the deck
    start(e, n) { n.x1 = entranceSpot(e); n.x0 = n.x1 + rand(-80, 80); n.y1 = e.y; e.y = FLOOR_BOT; n.z0 = -160; e.x = n.x0; e.z = n.z0; sfx('whoosh'); },
    update(e, n, dt) { const k = ease(Math.min(1, n.t / n.max)); e.x = lerp2(n.x0, n.x1, k); e.y = lerp2(FLOOR_BOT, n.y1, k); e.z = lerp2(n.z0, e.def.hover, k) + Math.sin(k * Math.PI) * 50; return n.t >= n.max; },
    draw(e, n, t, inner) { inner(); },
  },
  cloud: { max: 2.4, // a cloud ram bursts out of a cloud drifting overhead
    start(e, n) { e.x = entranceSpot(e); n.cx = e.x; n.cz = e.y - Y_OFF - 60; e.z = n.cz; e.vz = 0; n.wait = .6; n.cloud = 1; },
    update(e, n, dt) { if (n.t > .5 && !n.b) { n.b = 1; sfx('growl'); for (let i = 0; i < 10; i++) parts.push({ x: e.x + rand(-30, 30), y: e.y, z: n.cz + rand(-10, 10), vx: rand(-50, 50), vy: 0, vz: rand(-30, 30), life: .8, max: .8, col: 'rgba(250,250,255,.8)', size: rand(5, 9), shape: 'puff' }); }
      return ENTER_FX.drop.update(e, n, dt); },
    draw(e, n, t, inner) { ENTER_FX.drop.draw(e, n, t, inner); },
  },
  assemble: { max: 1.4, // a prism construct pulls itself together out of shards flying in from all round
    start(e, n) { e.x = entranceSpot(e); n.sh = []; for (let i = 0; i < 16; i++) { const a = rand(0, TAU), r = rand(90, 170); n.sh.push({ dx: Math.cos(a) * r, dz: Math.sin(a) * r * .6 + 40, rot: rand(0, 6), col: pick(['#9FD8E0', '#C8A0E8', '#E0F0FF']) }); } sfx('charge'); },
    update(e, n, dt) { if (n.t > 1 && !n.d) { n.d = 1; sfx('hit-crystal'); flashT = Math.max(flashT, .04); burst(e.x, e.y, e.hh * .5, ['#FFFFFF', '#9FD8E0'], 14, 'crystal', 0, true); } return n.t >= n.max; },
    draw(e, n, t, inner) {
      const k = Math.min(1, n.t / 1);
      if (k < 1) for (const s of n.sh) { const x = e.x + s.dx * (1 - ease(k)), y = e.y - e.hh * .5 - s.dz * (1 - ease(k)); ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot + k * 6); ctx.fillStyle = C(s.col); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 0); ctx.lineTo(0, 7); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill(); outline(1); ctx.restore(); }
      if (n.t > .6) { ctx.save(); ctx.globalAlpha = Math.min(1, (n.t - .6) / .4); inner(); ctx.restore(); }
    },
  },
  climb: { max: 1.4, // a knight of the Courts hauls himself up over the near edge of the abyss
    start(e, n) { e.x = entranceSpot(e); n.y1 = groundY(); e.y = FLOOR_BOT + 4; n.y0 = e.y; e.z = -e.hh * 1.2; n.z0 = e.z; },
    update(e, n, dt) {
      if (n.t < .8) { e.z = lerp2(n.z0, -4, ease(n.t / .8)); if (Math.random() < dt * 12) parts.push({ x: e.x + rand(-14, 14), y: e.y, z: 0, vx: rand(-20, 20), vy: 0, vz: rand(20, 60), life: .8, max: .8, col: pick(['rgba(106,58,138,.6)', 'rgba(42,27,44,.6)']), size: rand(4, 8), shape: 'puff' }); return false; }
      if (!n.up) { n.up = 1; sfx('slam'); dust(e.x, e.y, 6); }
      const k = Math.min(1, (n.t - .8) / .6); e.z = Math.sin(k * Math.PI) * 26; e.y = lerp2(n.y0, n.y1, k); return k >= 1;
    },
    draw(e, n, t, inner) { ctx.save(); if (n.t < .8) { ctx.beginPath(); ctx.rect(e.x - 200, 0, 400, e.y + 2); ctx.clip(); } inner(); ctx.restore(); },
  },
  smoke: { max: 1.3, // black smoke spirals up off the road and a figure stands in it
    start(e, n) { e.x = entranceSpot(e); sfx('whoosh'); },
    update(e, n, dt) { if (n.t < 1 && Math.random() < dt * 40) { const a = n.t * 12 + rand(0, 1); parts.push({ x: e.x + Math.cos(a) * 14, y: e.y, z: rand(0, e.hh * 1.2), vx: -Math.sin(a) * 40, vy: 0, vz: rand(20, 50), life: .7, max: .7, col: pick(['rgba(30,20,36,.7)', 'rgba(70,40,90,.6)']), size: rand(6, 11), shape: 'puff' }); } return n.t >= n.max; },
    draw(e, n, t, inner) { if (n.t < .4) return; ctx.save(); ctx.globalAlpha = Math.min(1, (n.t - .4) / .6); inner(); ctx.restore(); },
  },
  open: { max: 1.7, // an eye opens in the sky, then the watcher sinks down out of it
    start(e, n) { e.x = entranceSpot(e); n.hz = e.y - Y_OFF - 50; e.z = n.hz; sfx('charge'); },
    update(e, n, dt) { if (n.t > .8) e.z = lerp2(n.hz, e.def.hover, ease(Math.min(1, (n.t - .8) / .9))); return n.t >= n.max; },
    draw(e, n, t, inner) {
      const o = n.t < .5 ? n.t / .5 : n.t < 1 ? 1 : Math.max(0, 1 - (n.t - 1) / .4), y = e.y - n.hz - e.hh * .5;
      if (o > 0) { ctx.fillStyle = 'rgba(20,6,26,.9)'; ctx.beginPath(); ctx.moveTo(e.x - 50, y); ctx.quadraticCurveTo(e.x, y - 34 * o, e.x + 50, y); ctx.quadraticCurveTo(e.x, y + 34 * o, e.x - 50, y); ctx.fill(); ctx.strokeStyle = C('#B07AD8'); ctx.lineWidth = 2; ctx.stroke(); }
      if (n.t > .4) inner();
    },
  },
  swarm: { max: 1.4, // a cloud of little moths gathers into one great one
    start(e, n) { e.x = entranceSpot(e); e.z = e.def.hover; n.m = []; for (let i = 0; i < 22; i++) n.m.push({ x: rand(-VW / 2, VW / 2), z: rand(-60, 160), f: rand(0, 6) }); sfx('whoosh'); },
    update(e, n, dt) { return n.t >= n.max; },
    draw(e, n, t, inner) {
      const k = ease(Math.min(1, n.t / 1.1));
      if (k < 1) { ctx.fillStyle = C('#D8B0F0'); ctx.strokeStyle = C('#2A1B2C'); ctx.lineWidth = 1; for (const m of n.m) { const x = e.x + m.x * (1 - k) + Math.sin(t * 8 + m.f) * 6, y = e.y - e.z - e.hh * .5 - m.z * (1 - k), w = 4 + Math.abs(Math.sin(t * 20 + m.f)) * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w, y - 4); ctx.lineTo(x - w, y + 3); ctx.closePath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y - 4); ctx.lineTo(x + w, y + 3); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
      if (n.t > .8) { ctx.save(); ctx.globalAlpha = Math.min(1, (n.t - .8) / .5); inner(); ctx.restore(); }
    },
  },
  rift: { max: 1.1, // a rift witch tears open Shadow itself and shoulders through
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
  trump: { max: 1.5, // (only in the Hall of Trumps, and for Eric) a Trump card stands up on the road and the figure on it steps out
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
    update(e, n, dt) { const k = ease(Math.min(1, n.t / n.max)); e.x = lerp2(n.x0, n.x1, k); e.z = lerp2(n.z0, e.def.hover, k); e.facing = Math.sign(n.x1 - n.x0); return n.t >= n.max; },
    draw(e, n, t, inner) { inner(); },
  },
};
function swingPos(e, n, a) { e.x = n.px + n.L * Math.sin(a); e.z = n.pz - n.L * Math.cos(a); }
function drawCloud(x, y, a, t) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  for (const [dx, dy, r] of [[-30, 4, 18], [-10, -6, 24], [14, -2, 22], [34, 6, 16], [0, 8, 20]]) { ctx.fillStyle = C('#F4F2F8'); ell(x + dx + Math.sin(t + dx) * 2, y + dy, r, r * .7); ctx.fill(); outline(1.1); }
  ctx.restore();
}
// hook the entrances in: wave spawns and summons (not bosses, not the title screen's sparring pair)
{
  const _spawn = spawnEnemy;
  spawnEnemy = function (type, side, isBoss) {
    const e = _spawn(type, side, isBoss);
    if (!isBoss && mode === 'play' && typeof stage !== 'undefined' && stage) chooseEntrance(e);
    return e;
  };
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.state !== 'enter') return _upd(e, dt);
    e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); e.flash = Math.max(0, e.flash - dt);
    const n = e.ent; n.t += dt;
    if (ENTER_FX[n.kind].update(e, n, dt) || n.t > 4) { e.state = 'idle'; e.ent = null; if (e.def.move !== 'fly') e.z = 0; e.vz = 0; e.vx = 0; e.y = clamp(e.y, FLOOR_TOP + 8, FLOOR_BOT); e.cd = Math.max(e.cd, rand(.35, .8)); }
  };
  const _strike = strike; // nothing lands on them until they're through
  strike = function (e, ...a) { if (e.state === 'enter') return; return _strike(e, ...a); };
  const _draw = drawEnemy;
  drawEnemy = function (e, t) {
    if (e.state !== 'enter' || !e.ent) return _draw(e, t);
    ENTER_FX[e.ent.kind].draw(e, e.ent, t, () => _draw(e, t));
  };
  const _zone = enterZone;
  enterZone = function (z, Zs) { _zone(z, Zs); placeCovers(); };
  const _mb = mechBoxes; // the ink box must reach up to whatever they come down from, and take in the cover
  mechBoxes = function (box) { _mb(box); for (const e of enemies) if (e.state === 'enter') box(e.x, e.y, 0, 130, e.y - Y_OFF + 30);
    for (const c of covers) if (c.x > camX - 80 && c.x < camX + VW + 80) box(c.x, c.y, 0, 60, 150); };
  const _ml = mechList;
  mechList = function (list, t) { _ml(list, t);
    for (const c of covers) { if (c.shake > 0) c.shake -= 1 / 60; if (c.x > camX - 80 && c.x < camX + VW + 80) list.push([c.y, () => drawCover(c, t)]); } };
}
