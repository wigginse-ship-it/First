// ---------- the end of each area: a landmark that shows where the road goes next ----------
// Every passage between areas has something standing at the end of the road that hints at what is past it: the mouth of
// the Thornwood, a sinkhole hung with roots, a rope ladder up into the cloudbank, the lift cage, a great standing mirror,
// a crystal iris... It wakes (glows, opens, stirs) once the last wave there is beaten. And once that last wave falls, the
// road is cut short: the landmark is just ahead instead of a long walk away.
const THRESH = {};
const exitX = () => stage.len - 130;
function trimArea() { // after the last wave the way on is close by
  if (stage.bossRoom || stage.trimmed || !stage.waves.length || waveActive || waveIdx < stage.waves.length || zoneTrans) return;
  stage.trimmed = true; stage.wake = 0;
  const len = Math.min(stage.len, Math.max(camX + VW + 200, P.x + 340));
  stage.len = len; props = props.filter(p => p.x < len - 120);
  if (typeof covers !== 'undefined') covers = covers.filter(c => c.x < len - 100);
}
function threshKind() { if (stage.bossRoom || stage.secret && stage.room && !stage.room.kind) return null; const T = ZONES[stageIdx]; return T && T.trans ? T.trans[zoneIdx] : null; }
{
  const _sec = updateSecret;
  updateSecret = function (dt) { _sec(dt); trimArea(); if (stage.trimmed) stage.wake = Math.min(1, (stage.wake || 0) + dt * .8); };
  const _zone = enterZone; // a crystal pod or two left sitting past the last fight is moved into it
  enterZone = function (z, Zs) { _zone(z, Zs);
    if (stage.waves.length && !stage.bossRoom) { const last = waveAt(stage.waves.length - 1); for (const p of props) if (p.x > last + VW * .7) p.x = last + rand(120, VW * .6); } };
  const _mb = mechBoxes;
  mechBoxes = function (box) { _mb(box); const k = threshKind(); if (k && THRESH[k]) box(exitX(), FLOOR_TOP + 20, 0, 170, 260); };
  const _ml = mechList;
  mechList = function (list, t) { _ml(list, t); const k = threshKind(); if (!k || !THRESH[k] || stage.secret) return; const x = exitX();
    if (x > camX - 200 && x < camX + VW + 200) list.push([FLOOR_TOP + 4, () => THRESH[k](x, FLOOR_TOP + 4, stage.wake || 0, t)]); };
}
const glowAt = (x, y, r, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(x, y, r); ctx.fill(); ctx.restore(); };
// the Vale → the Thornwood Hollow: two great dark trees lean together into a tunnel of thorns
THRESH.canopy = (x, y, k, t) => {
  const dg = ctx.createLinearGradient(0, y - 130, 0, y + 10); dg.addColorStop(0, 'rgba(14,22,16,.95)'); dg.addColorStop(1, 'rgba(30,40,26,.85)'); // the dark inside: a tunnel mouth, not a hole
  ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(x - 64, y + 10); ctx.quadraticCurveTo(x - 66, y - 120, x, y - 128); ctx.quadraticCurveTo(x + 66, y - 120, x + 64, y + 10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,120,70,.35)'; ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { const s = 1 - i * .2; ctx.beginPath(); ctx.moveTo(x - 64 * s, y + 10); ctx.quadraticCurveTo(x - 66 * s, y - 120 * s, x, y - 128 * s); ctx.quadraticCurveTo(x + 66 * s, y - 120 * s, x + 64 * s, y + 10); ctx.stroke(); } // the arches of the tunnel going back
  glowAt(x + 14, y - 40, 50, '140,190,120', .18 * k * (1 + .2 * Math.sin(t * 2)));
  for (const s of [-1, 1]) { ctx.fillStyle = C('#3E2E22'); ctx.beginPath(); ctx.moveTo(x + s * 70, y + 8); ctx.quadraticCurveTo(x + s * 76, y - 80, x + s * 10, y - 150); ctx.lineTo(x + s * 26, y - 152); ctx.quadraticCurveTo(x + s * 96, y - 80, x + s * 92, y + 8); ctx.closePath(); ctx.fill(); outline(1.5); }
  ctx.fillStyle = C('#2E4A2A'); for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; ell(x + Math.cos(a) * 80, y - 140 + Math.sin(a) * 30, 30, 20); ctx.fill(); outline(1.2); }
  ctx.strokeStyle = C('#5A3A2A'); ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 60, y - 60 - Math.sin(a) * 70); ctx.lineTo(x + Math.cos(a) * 68, y - 64 - Math.sin(a) * 78); ctx.stroke(); } // thorns
};
// the Thornwood → the Sunken Grove: the road ends at a sinkhole, hung with roots, water glinting far below
THRESH.roots = (x, y, k, t) => {
  const yy = y + 34; ctx.fillStyle = 'rgba(8,10,10,.92)'; ell(x, yy, 80, 22); ctx.fill(); ctx.strokeStyle = C('#4A3A26'); ctx.lineWidth = 3; ctx.stroke();
  glowAt(x, yy + 4, 60, '120,190,180', .25 * (.4 + .6 * k) * (1 + .2 * Math.sin(t * 1.5)));
  ctx.strokeStyle = C('#5A4430'); ctx.lineWidth = 2.5; for (let i = 0; i < 8; i++) { const rx = x - 70 + i * 20; ctx.beginPath(); ctx.moveTo(rx, yy - 18 + Math.abs(i - 3.5) * 2); ctx.quadraticCurveTo(rx + Math.sin(t + i) * 3, yy - 2, rx + 2, yy + 10 + (i % 3) * 4); ctx.stroke(); }
  ctx.fillStyle = C('#5A4A30'); ctx.fillRect(x - 96, yy - 60, 6, 60); ctx.fillRect(x - 108, yy - 52, 30, 14); ctx.beginPath(); ctx.rect(x - 108, yy - 52, 30, 14); outline(1.2); // an old signpost
  ctx.strokeStyle = C('#E8D8B0'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 102, yy - 45); ctx.lineTo(x - 84, yy - 45); ctx.lineTo(x - 88, yy - 40); ctx.stroke();
};
// the Skyport → the Gearworks Deck: a rope ladder hangs down out of a cloudbank from a galleon's keel
THRESH.clouds = (x, y, k, t) => {
  const top = Y_OFF + 10, sway = Math.sin(t * 1.2) * 4 * (.5 + k);
  ctx.fillStyle = C('#5A4030'); ctx.beginPath(); ctx.moveTo(x - 120, top + 6); ctx.quadraticCurveTo(x, top + 44, x + 140, top + 6); ctx.lineTo(x + 140, top - 10); ctx.lineTo(x - 120, top - 10); ctx.closePath(); ctx.fill(); outline(1.5); // the keel
  ctx.strokeStyle = C('#C8A050'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 100, top + 10); ctx.quadraticCurveTo(x, top + 38, x + 120, top + 10); ctx.stroke();
  drawCloud(x - 60, top + 30, 1, t); drawCloud(x + 70, top + 26, 1, t);
  ctx.strokeStyle = C('#6A4A30'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, top + 30); ctx.lineTo(x - 10 + sway, y + 30); ctx.moveTo(x + 14, top + 30); ctx.lineTo(x + 14 + sway, y + 30); ctx.stroke();
  ctx.lineWidth = 2.5; for (let r = top + 44; r < y + 30; r += 14) { const f = (r - top) / (y + 30 - top); ctx.beginPath(); ctx.moveTo(x - 10 + sway * f, r); ctx.lineTo(x + 14 + sway * f, r); ctx.stroke(); }
  glowAt(x + 2, top + 34, 50, '255,230,180', .3 * k);
};
// the Gearworks → the Foundry Crown: a lift cage on chains, furnace-light glowing up through its floor
THRESH.lift = (x, y, k, t) => {
  const top = Y_OFF + 4, yy = y + 30;
  ctx.strokeStyle = C('#3A3A40'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 40, top); ctx.lineTo(x - 40, yy - 110); ctx.moveTo(x + 40, top); ctx.lineTo(x + 40, yy - 110); ctx.stroke();
  glowAt(x, yy - 10, 80, '255,150,70', .3 * (.4 + .6 * k) * (1 + .15 * Math.sin(t * 3)));
  ctx.fillStyle = C('#4A3A30'); ctx.fillRect(x - 52, yy - 112, 104, 10); ctx.fillRect(x - 52, yy - 6, 104, 10); ctx.beginPath(); ctx.rect(x - 52, yy - 112, 104, 116); outline(1.5);
  ctx.strokeStyle = C('#8A6A4A'); ctx.lineWidth = 2; for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x - 50 + i * 16.6, yy - 102); ctx.lineTo(x - 50 + i * 16.6, yy - 6); ctx.stroke(); }
  ctx.save(); ctx.translate(x, top + 14); ctx.rotate(t * .6 * (.2 + k)); ctx.fillStyle = C('#B88A48'); circle(0, 0, 16); ctx.fill(); outline(1.3); ctx.fillStyle = C('#5A4030'); for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * TAU); ctx.fillRect(-3, -21, 6, 6); ctx.restore(); } circle(0, 0, 5); ctx.fill(); ctx.restore();
};
// the Prism road → the Inverted Gallery: a great standing mirror, and in it the world upside down
THRESH.shatter = (x, y, k, t) => {
  const w = 70, h = 150, y0 = y + 20;
  ctx.fillStyle = C('#3A2A4A'); rrect(x - w / 2 - 8, y0 - h - 8, w + 16, h + 16, 10); ctx.fill(); outline(1.5);
  const g = ctx.createLinearGradient(0, y0 - h, 0, y0); g.addColorStop(0, '#3A3060'); g.addColorStop(.5, '#8A70B0'); g.addColorStop(1, '#C8B0E8'); ctx.fillStyle = g; rrect(x - w / 2, y0 - h, w, h, 6); ctx.fill(); // the sky, upside down
  ctx.fillStyle = 'rgba(40,30,60,.7)'; for (let i = 0; i < 5; i++) { const cx = x - 26 + i * 13; ctx.beginPath(); ctx.moveTo(cx - 5, y0 - h); ctx.lineTo(cx, y0 - h + 30 + (i % 2) * 20); ctx.lineTo(cx + 5, y0 - h); ctx.fill(); } // crystals hanging down
  ctx.strokeStyle = `rgba(255,255,255,${.3 + .3 * k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 20, y0 - 30); ctx.lineTo(x + 10, y0 - h + 20); ctx.stroke();
  if (k > .5) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y0 - h / 2); ctx.lineTo(x - 18, y0 - h / 2 - 22); ctx.moveTo(x, y0 - h / 2); ctx.lineTo(x + 20, y0 - h / 2 + 14); ctx.moveTo(x, y0 - h / 2); ctx.lineTo(x + 6, y0 - h / 2 - 30); ctx.stroke(); } // it begins to crack
  glowAt(x, y0 - h / 2, 70, '200,170,255', .2 * k);
};
// the Gallery → the Wyrm's Nest: a crystal arch with a kaleidoscope iris turning slowly in it
THRESH.invert = (x, y, k, t) => {
  const cy = y - 50, r = 54;
  ctx.fillStyle = 'rgba(10,6,20,.9)'; circle(x, cy, r); ctx.fill();
  ctx.save(); ctx.translate(x, cy); ctx.rotate(t * .25 * (.3 + k));
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * TAU); ctx.fillStyle = C(['#8CC8D0', '#C8A0E8'][i % 2]); ctx.beginPath(); ctx.moveTo(0, -r * .2 * (1 + k)); ctx.lineTo(r * .42, -r); ctx.lineTo(-r * .1, -r); ctx.closePath(); ctx.fill(); outline(1); ctx.restore(); }
  ctx.restore(); glowAt(x, cy, 40, '230,220,255', .35 * k);
  for (const s of [-1, 1]) { ctx.fillStyle = C('#9FD8E0'); ctx.beginPath(); ctx.moveTo(x + s * 60, y + 10); ctx.lineTo(x + s * 74, cy - 40); ctx.lineTo(x + s * 30, cy - 92); ctx.lineTo(x + s * 50, cy - 40); ctx.lineTo(x + s * 50, y + 10); ctx.closePath(); ctx.fill(); outline(1.3); }
};
// the Courts' road → the Thelbane Spires: the Logrus writhing up out of a crack in the road
THRESH.w4logrus = (x, y, k, t) => {
  ctx.fillStyle = 'rgba(14,4,20,.92)'; ell(x, y + 30, 70, 14); ctx.fill();
  glowAt(x, y - 20, 70, '190,110,240', .22 * (.4 + .6 * k));
  ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.strokeStyle = C(i % 2 ? '#6A3A8A' : '#B07AD8'); ctx.beginPath(); ctx.moveTo(x - 50 + i * 20, y + 30);
    for (let s = 1; s <= 6; s++) ctx.lineTo(x - 50 + i * 20 + Math.sin(t * (1 + k) + s + i) * 14, y + 30 - s * (18 + i * 2)); ctx.stroke(); }
};
// the Spires → the Rim of the Abyss: a towering Trump card standing on its edge at the brink
THRESH.w4trump = (x, y, k, t) => {
  const w = 70, h = 120, y0 = y + 26;
  ctx.save(); ctx.translate(x, y0); ctx.rotate(-.05 + Math.sin(t * .8) * .01);
  ctx.fillStyle = C('#1E1626'); rrect(-w / 2, -h, w, h, 6); ctx.fill(); ctx.strokeStyle = '#EED48A'; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1; rrect(-w / 2 + 6, -h + 6, w - 12, h - 12, 4); ctx.stroke();
  ctx.fillStyle = `rgba(238,212,138,${.5 + .5 * k})`; drawTrumpGlyph('stillness', 0, -h / 2, 16); ctx.restore();
  glowAt(x, y0 - h / 2, 70, '238,212,138', .25 * k);
};
