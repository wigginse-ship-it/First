'use strict';
// sky world: the new locales (approach area and boss room). Registers THEMES, AW_FAR, AW_MID and AW_FLOOR entries.
//   sky2    — The Gearworks Deck: the open deck of a sky-galleon racing through a sunset sea of cloud
//   skyBoss — The Foundry Crown: the Colossus's furnace hall on the top of a sky-fortress foundry
// Everything here is prefixed zsk so it can't collide with the other art files sharing the global scope.

let zskSea = [];              // sky2: two cloud-sea strips, painted once, that stream past the ship every frame
let zskGrates = [];           // skyBoss: the floor grates over the melt, so the live pass can let them breathe

// a 1280-wide strip from y0 down to the ground line, painted once and brushed like the main layers
function zskStrip(y0, fn, ink) {
  const [c, g] = makeLayer(AW_W, FLOOR_TOP - y0), old = ctx; ctx = g; ctx.translate(0, -y0); fn(); ctx = old;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .75; g.fillStyle = texPat(g, 'brush'); g.scale(K / 2, K / 2); g.fillRect(0, 0, c.width * 2 / K, c.height * 2 / K); g.restore();
  return c;
}
function zskBlit(c, y0, o) { const x = -(((o % AW_W) + AW_W) % AW_W), h = FLOOR_TOP - y0; ctx.drawImage(c, x, y0, AW_W, h); ctx.drawImage(c, x + AW_W, y0, AW_W, h); }
const zskHsh = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };

// ======================================================================================================
// THE GEARWORKS DECK
// ======================================================================================================
// a distant sky-galleon: a planked hull with a brass wale and lit ports, two masts with furled canvas, a jib,
// a ribbed gas envelope above, and a propeller at the stern
function zskGalleon(x, y, s, dir, p) {
  awWrap(x, 80 * s, (x) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const ls = AW_SUN * dir;
    ctx.fillStyle = p.fin; awPath([-46, -52, -70, -68, -74, -66, -60, -47]); ctx.fill(); awPath([-46, -40, -70, -24, -74, -26, -60, -45]); ctx.fill();
    ctx.strokeStyle = p.rig; ctx.lineWidth = .7; ctx.beginPath();
    for (const [ex, hx] of [[-38, -42], [-20, -22], [0, -4], [20, 12], [40, 30], [-38, -14], [40, 2]]) { ctx.moveTo(ex, -32); ctx.lineTo(hx, -3); } ctx.stroke();
    const env = () => { ctx.beginPath(); ctx.moveTo(64, -46); ctx.bezierCurveTo(64, -62, 30, -65, -6, -64); ctx.bezierCurveTo(-36, -63, -56, -55, -66, -46); ctx.bezierCurveTo(-56, -37, -36, -30, -6, -29); ctx.bezierCurveTo(30, -28, 64, -31, 64, -46); ctx.closePath(); };
    env(); const eg = ctx.createLinearGradient(0, -65, 0, -29); eg.addColorStop(0, p.envTop); eg.addColorStop(.55, p.env); eg.addColorStop(1, p.envBot); ctx.fillStyle = eg; ctx.fill();
    ctx.save(); env(); ctx.clip();
    ctx.globalAlpha = .7; ctx.fillStyle = p.envLit; ell(ls * 26, -57, 34, 6); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = p.seam; ctx.lineWidth = .7; ctx.beginPath();
    for (const gy of [-8, 0, 8]) { ctx.moveTo(66, -46 + gy * .3); ctx.bezierCurveTo(24, -46 + gy * 1.3, -30, -46 + gy * 1.2, -68, -46 + gy * .2); }
    for (const rx of [-46, -30, -14, 2, 18, 34, 50]) { ctx.moveTo(rx, -66); ctx.quadraticCurveTo(rx + 4, -46, rx, -27); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = p.mast; ctx.fillRect(-17, -31, 2.2, 29); ctx.fillRect(13, -31, 2.2, 29);
    for (const mx of [-16, 14]) { ctx.fillStyle = p.sail; rrect(mx - 11, -24, 22, 3.4, 1.6); ctx.fill(); rrect(mx - 8, -14, 16, 3, 1.4); ctx.fill(); ctx.fillStyle = p.mast; ctx.fillRect(mx - 12, -24.6, 24, .9); ctx.fillRect(mx - 9, -14.6, 18, .9); }
    awPath([17, -30, 52, -7, 19, -6]); ctx.fillStyle = p.sail; ctx.fill();
    if (ls > 0) { awPath([17, -30, 52, -7, 34, -6.5]); ctx.fillStyle = p.sailLit; ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = p.mast; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(48, -7); ctx.lineTo(68, -14); ctx.stroke(); // bowsprit
    const hull = () => { ctx.beginPath(); ctx.moveTo(-52, -11); ctx.lineTo(-39, -11); ctx.lineTo(-37, -3); ctx.lineTo(34, -3); ctx.quadraticCurveTo(46, -4, 56, -10); ctx.quadraticCurveTo(52, 4, 38, 10); ctx.quadraticCurveTo(0, 18, -34, 13); ctx.quadraticCurveTo(-49, 9, -52, -11); ctx.closePath(); };
    hull(); const hg = ctx.createLinearGradient(0, -11, 0, 16); hg.addColorStop(0, p.hullLit); hg.addColorStop(.35, p.hull); hg.addColorStop(1, p.hullDark); ctx.fillStyle = hg; ctx.fill();
    ctx.save(); hull(); ctx.clip();
    ctx.strokeStyle = p.seam; ctx.lineWidth = .5; ctx.beginPath(); for (const py of [4, 8, 12]) { ctx.moveTo(-54, py - 3); ctx.quadraticCurveTo(0, py + 3, 58, py - 12); } ctx.stroke();
    ctx.fillStyle = p.trim; ctx.beginPath(); ctx.moveTo(-54, -1.5); ctx.quadraticCurveTo(0, 1.6, 58, -7); ctx.lineTo(58, -5.4); ctx.quadraticCurveTo(0, 3.2, -54, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = p.win; for (let wx = -30; wx < 36; wx += 8) { circle(wx, 5.2 - wx * .03, 1.25); ctx.fill(); }
    ctx.fillStyle = p.hullDark; ctx.fillRect(-57, 1, 7, 2.2);
    ctx.globalAlpha = .4; ctx.fillStyle = p.prop; ell(-58, 2, 1.7, 10); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = p.flag; awPath([-16, -32, -30, -35, -40, -31, -28, -30.5]); ctx.fill(); // a pennant streaming aft
    ctx.restore();
  });
  if (p.glow) awHalo(x + 44 * s * dir, y - 4 * s, 7, p.glow, .5);
}

// one yard with its sail furled along it: the canvas sags in the middle, bound with gaskets; lifts and footropes below
function zskYard(x, y, L, top, p) {
  const sag = (u) => 2.6 + 5.4 * (1 - u * u);
  const fur = () => { ctx.beginPath(); ctx.moveTo(x - L, y); for (let k = 0; k <= 24; k++) { const u = -1 + k / 12; ctx.lineTo(x + u * L, y + sag(u) + Math.sin(k * 2.3 + x) * .7); } ctx.lineTo(x + L, y); ctx.closePath(); };
  ctx.strokeStyle = p.rope; ctx.lineWidth = .7; ctx.beginPath();
  for (const s of [-1, 1]) { ctx.moveTo(x + s * (L + 2), y); ctx.lineTo(x + s * 3, top); ctx.moveTo(x + s * (L - 2), y + 1); ctx.quadraticCurveTo(x + s * L * .5, y + 15, x + s * 4, y + 4); } ctx.stroke();
  fur(); const g = ctx.createLinearGradient(0, y, 0, y + 9); g.addColorStop(0, p.canvasLit); g.addColorStop(.45, p.canvas); g.addColorStop(1, p.canvasDark); ctx.fillStyle = g; ctx.fill();
  ctx.save(); fur(); ctx.clip();
  for (let xx = x - L + 3; xx < x + L; xx += 4.5) { const u = (xx - x) / L; dab(xx, y + 2 + sag(u) * .3, 2.2, AW_SUN * u > 0 ? p.canvasLit : p.canvas, .55); }
  ctx.strokeStyle = p.canvasDark; ctx.lineWidth = .6; ctx.beginPath();
  for (let xx = x - L + 7; xx < x + L - 4; xx += 7.5) { const u = (xx - x) / L; ctx.moveTo(xx, y + 1); ctx.quadraticCurveTo(xx + 2, y + sag(u) * .6, xx - 1, y + sag(u)); } ctx.stroke(); // folds
  ctx.restore();
  ctx.strokeStyle = p.ropeDark; ctx.lineWidth = 1.1; ctx.beginPath();
  for (let xx = x - L + 6; xx < x + L - 3; xx += 11) { const u = (xx - x) / L; ctx.moveTo(xx - 1.4, y - .5); ctx.lineTo(xx + 1.4, y + sag(u) + .4); } ctx.stroke(); // gaskets
  ctx.fillStyle = p.woodDark; awPath([x - L - 5, y - 1.1, x, y - 2.8, x + L + 5, y - 1.1, x + L + 5, y + 1.2, x, y + 2.2, x - L - 5, y + 1.2]); ctx.fill();
  ctx.fillStyle = p.woodLit; awPath([x - L - 4, y - 1.1, x, y - 2.8, x + L + 4, y - 1.1, x, y - 1.6]); ctx.globalAlpha = .8; ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = p.brass; ctx.fillRect(x - L - 6, y - 1.6, 2.4, 3.2); ctx.fillRect(x + L + 4, y - 1.6, 2.4, 3.2); ctx.fillRect(x - 6, y - 3, 12, 5);
  ctx.fillStyle = p.brassLit; ctx.fillRect(x - 6, y - 3, 12, 1); awRivet(x - 3.5, y, .8, p.brassLit); awRivet(x + 3.5, y, .8, p.brassLit);
}
// a mast rising from behind the bulwark to the envelope: shrouds with ratlines, brass bands, a top, two yards, a lantern
function zskMast(x, rr, p) {
  const top = 100, base = FLOOR_TOP, w = 9, plat = 178, y1 = 156, y2 = 200;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const ax = x + s * 4, b0 = x + s * 40, b1 = x + s * 56;
    ctx.strokeStyle = p.rope; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, plat); ctx.lineTo(b0, base); ctx.moveTo(ax, plat); ctx.lineTo(b1, base); ctx.stroke();
    ctx.lineWidth = .6; ctx.beginPath(); for (let yy = plat + 7; yy < base; yy += 5.5) { const k = (yy - plat) / (base - plat); ctx.moveTo(lerp(ax, b0, k), yy); ctx.lineTo(lerp(ax, b1, k), yy); } ctx.stroke();
  }
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); const L = AW_SUN < 0;
  g.addColorStop(0, L ? p.woodLit : p.woodDark); g.addColorStop(.45, p.wood); g.addColorStop(1, L ? p.woodDark : p.woodLit);
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, base - top);
  ctx.strokeStyle = 'rgba(40,24,16,.35)'; ctx.lineWidth = .5; ctx.beginPath(); for (const dx of [-2.4, -.6, 1.5]) { ctx.moveTo(x + dx, top); ctx.lineTo(x + dx + rr() - .5, base); } ctx.stroke();
  for (let y = top + 22; y < base; y += 28) {
    ctx.fillStyle = p.brassDark; ctx.fillRect(x - w / 2 - 1, y, w + 2, 4); ctx.fillStyle = p.brass; ctx.fillRect(x - w / 2 - 1, y, w + 2, 2.8);
    ctx.fillStyle = p.brassLit; ctx.fillRect(AW_SUN > 0 ? x + w / 2 - 3 : x - w / 2 - 1, y + .4, 3.6, 1.3);
  }
  // the top: a railed platform on knees
  ctx.fillStyle = p.woodDark; awPath([x - 24, plat, x + 24, plat, x + 20, plat + 4, x - 20, plat + 4]); ctx.fill();
  ctx.fillStyle = p.woodLit; ctx.fillRect(x - 24, plat - .6, 48, 1.2);
  ctx.strokeStyle = p.woodDark; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 16, plat + 4); ctx.quadraticCurveTo(x - 6, plat + 6, x - 4, plat + 16); ctx.moveTo(x + 16, plat + 4); ctx.quadraticCurveTo(x + 6, plat + 6, x + 4, plat + 16); ctx.stroke();
  ctx.strokeStyle = p.brass; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x - 22, plat - 9); ctx.lineTo(x + 22, plat - 9); for (let px = -22; px <= 22; px += 7.33) { ctx.moveTo(x + px, plat - 9); ctx.lineTo(x + px, plat); } ctx.stroke();
  ctx.fillStyle = p.brassLit; ctx.fillRect(x - 22, plat - 9.8, 44, .7);
  zskYard(x, y2, 60 + rr() * 8, plat + 2, p); zskYard(x, y1, 70 + rr() * 8, top + 30, p);
  // a long pennant streaming aft from just under the envelope
  const py = 147, len = 64 + rr() * 26, ph = rr() * TAU, wv = (u) => py + Math.sin(u * 8 + ph) * 3.4 * u + u * 6, hw = (u) => 3.6 * (1 - u * .75);
  ctx.fillStyle = p.flag; ctx.beginPath(); ctx.moveTo(x - 4, wv(0) - hw(0));
  for (let k = 1; k <= 14; k++) { const u = k / 14; ctx.lineTo(x - 4 - u * len, wv(u) - hw(u)); }
  ctx.lineTo(x - 4 - len * .9, wv(.93)); // the swallowtail
  for (let k = 14; k >= 0; k--) { const u = k / 14; ctx.lineTo(x - 4 - u * len, wv(u) + hw(u)); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = p.flagLit; ctx.beginPath(); ctx.moveTo(x - 4, wv(0) - hw(0)); for (let k = 1; k <= 12; k++) { const u = k / 14; ctx.lineTo(x - 4 - u * len, wv(u) - hw(u)); } for (let k = 12; k >= 0; k--) { const u = k / 14; ctx.lineTo(x - 4 - u * len, wv(u) - hw(u) * .45); } ctx.closePath(); ctx.globalAlpha = .8; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(40,10,20,.45)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 1; k < 4; k++) { const u = (k * 2 + .5) / 9, xx = x - 4 - u * len; ctx.moveTo(xx, wv(u) - hw(u)); ctx.lineTo(xx + 2, wv(u) + hw(u)); } ctx.stroke(); // folds
  // a brass lantern hung from the lower yard
  const lx = x + AW_SUN * 44, ly = y1 + 14;
  ctx.strokeStyle = p.ropeDark; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(lx, y1 + 1); ctx.lineTo(lx, ly - 4); ctx.stroke();
  ctx.fillStyle = p.brassDark; awPath([lx - 3, ly - 4, lx + 3, ly - 4, lx + 2, ly - 6, lx - 2, ly - 6]); ctx.fill(); ctx.fillRect(lx - 3, ly + 3, 6, 1.6);
  ctx.fillStyle = '#FFE6B0'; ctx.fillRect(lx - 2.2, ly - 4, 4.4, 7); ctx.fillStyle = p.brassDark; ctx.fillRect(lx - .4, ly - 4, .8, 7);
  awHalo(lx, ly, 22, '255,200,130', .55);
}
// the belly of one great gas cell overhead: longitudinal gores, frame rings, a net of cords and a brass keel rail
function zskEnvelope(cx, p) {
  const cy = 26, rx = 252, ry = 116;
  awWrap(cx, rx + 4, (cx) => {
    const sh = () => ell(cx, cy, rx, ry), yb = (u) => cy + ry * Math.sqrt(Math.max(0, 1 - (u / rx) * (u / rx)));
    sh(); const g = ctx.createLinearGradient(0, cy + 20, 0, cy + ry); g.addColorStop(0, p.top); g.addColorStop(.6, p.mid); g.addColorStop(1, p.bot); ctx.fillStyle = g; ctx.fill();
    ctx.save(); sh(); ctx.clip();
    ctx.fillStyle = p.lit; ctx.globalAlpha = .5; ell(cx + AW_SUN * rx * .5, cy + ry * .98, rx * .48, ry * .2); ctx.fill(); ctx.globalAlpha = .25; ell(cx + AW_SUN * rx * .2, cy + ry, rx * .5, ry * .14); ctx.fill(); ctx.globalAlpha = 1;
    for (let u = -rx + 10; u < rx; u += 9) dab(cx + u, yb(u) - 6 - zskHsh(u + cx) * 18, 5 + zskHsh(u * 3 + cx) * 5, zskHsh(u * 7) > .5 ? p.mid : p.bot, .35); // brushwork in the cloth
    ctx.strokeStyle = p.seam; ctx.lineWidth = .9; ctx.beginPath();
    for (const k of [.62, .76, .87, .95]) ctx.ellipse(cx, cy, rx * .995, ry * k, 0, .08 * Math.PI, .92 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = p.ring; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let u = -rx + 26; u < rx - 10; u += 32) { ctx.moveTo(cx + u, cy + 10); ctx.quadraticCurveTo(cx + u * 1.05, yb(u) - 24, cx + u * 1.03, yb(u * 1.03) + 2); } ctx.stroke();
    ctx.strokeStyle = p.net; ctx.lineWidth = .55; ctx.beginPath(); // the net of cords holding the cell to the keel
    for (let u = -rx * .8; u < rx * .8; u += 11) { ctx.moveTo(cx + u, yb(u) - 20); ctx.lineTo(cx + u + 11, yb(u + 11)); ctx.moveTo(cx + u + 11, yb(u + 11) - 20); ctx.lineTo(cx + u, yb(u)); } ctx.stroke();
    ctx.restore();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = p.brassDark; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, .3 * Math.PI, .7 * Math.PI); ctx.stroke();
    ctx.strokeStyle = p.brass; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = p.brassLit; ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(cx, cy - .9, rx, ry, 0, AW_SUN > 0 ? .3 * Math.PI : .5 * Math.PI, AW_SUN > 0 ? .5 * Math.PI : .7 * Math.PI); ctx.stroke();
    for (let a = .31; a < .7; a += .025) { const ax = cx + Math.cos(a * Math.PI) * rx, ay = cy + Math.sin(a * Math.PI) * ry; awRivet(ax, ay, .7, p.brassLit); }
  });
}
// an engine car slung between two cells: struts, a brass and timber nacelle with a lit port, a spinning propeller blurred to a disc
function zskEngine(x, y, p) {
  awWrap(x, 70, (x) => {
    ctx.strokeStyle = p.iron; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 50, y - 50); ctx.lineTo(x - 8, y - 6); ctx.moveTo(x + 50, y - 48); ctx.lineTo(x + 12, y - 6); ctx.moveTo(x - 30, y - 60); ctx.lineTo(x, y - 7); ctx.stroke();
    ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x - 50, y - 50); ctx.lineTo(x + 12, y - 6); ctx.moveTo(x + 50, y - 48); ctx.lineTo(x - 8, y - 6); ctx.stroke();
    const car = () => { ctx.beginPath(); ctx.moveTo(x - 20, y - 5); ctx.quadraticCurveTo(x + 6, y - 9, x + 24, y - 3); ctx.quadraticCurveTo(x + 30, y + 1, x + 24, y + 5); ctx.quadraticCurveTo(x + 4, y + 10, x - 20, y + 6); ctx.closePath(); };
    car(); const g = ctx.createLinearGradient(0, y - 9, 0, y + 9); g.addColorStop(0, p.brassLit); g.addColorStop(.4, p.brass); g.addColorStop(1, p.brassDark); ctx.fillStyle = g; ctx.fill();
    ctx.save(); car(); ctx.clip(); ctx.fillStyle = p.wood; ctx.fillRect(x - 21, y - 1, 52, 4); ctx.fillStyle = p.woodLit; ctx.fillRect(x - 21, y - 1, 52, .8);
    ctx.fillStyle = p.brassDark; for (const rx of [-12, 2, 16]) ctx.fillRect(x + rx, y - 10, 1.4, 20); ctx.restore();
    ctx.fillStyle = '#FFE2A8'; circle(x + 9, y - 3.5, 1.8); ctx.fill(); ctx.strokeStyle = p.brassDark; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle = p.iron; awPath([x - 20, y - 4, x - 27, y - 1.5, x - 27, y + 2.5, x - 20, y + 5]); ctx.fill(); // the drive housing
    ctx.fillStyle = p.brass; ell(x - 29, y + .5, 2.2, 2.6); ctx.fill();
    ctx.globalAlpha = .28; ctx.fillStyle = p.prop; ell(x - 30, y + .5, 3.6, 25); ctx.fill(); ctx.globalAlpha = .5; ctx.strokeStyle = p.prop; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(x - 30, y + .5, 3.6, 25, 0, -1.2, .2); ctx.moveTo(x - 30, y + 18); ctx.ellipse(x - 30, y + .5, 3.6, 25, 0, 1.9, 2.6); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = p.iron; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 30, y - 6); ctx.lineTo(x - 31, y - 19); ctx.moveTo(x - 30, y + 7); ctx.lineTo(x - 29, y + 21); ctx.stroke(); // a blade caught mid-turn
    for (let k = 1; k < 5; k++) awSoft(x - 34 - k * 13, y - 1 - k * 1.5, 7 + k * 3, 4 + k * 1.4, '236,210,206', .26 - k * .04); // exhaust
  });
}

function zskDeckFar(rnd, th, f) {
  AW_SUN = 1;
  // the sea of cloud is painted on its own two strips (live, it streams past); first lay it in
  for (const c of zskSea) retire(c);
  zskSea = [
    zskStrip(172, () => {
      awCloudBank(196, rnd, { shadow: '#B48C9E', body: '#D0A4AA', lit: '#F2C6A8', rim: '#FFE0C4' }, 15, 7, 15);
      awCloudBank(206, rnd, { shadow: '#B08498', body: '#CC9CA4', lit: '#F4C4A2', rim: '#FFE2C2' }, 18, 8, 17);
      hazeBand(ctx, th.haze, 176, FLOOR_TOP, .4);
    }, '#7A5A70'),
    zskStrip(184, () => {
      awCloudBank(212, rnd, { shadow: '#9A6E88', body: '#C48E9C', lit: '#F6BE9A', rim: '#FFE4C4' }, 24, 11, 24);
      for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, y = 200 + rnd() * 30; awWrap(x, 10, (x) => dab(x, y, 3 + rnd() * 5, rnd() < .5 ? '#E8B4A4' : '#B48296', .35)); }
      awCloudBank(226, rnd, { shadow: '#A07490', body: '#D29AA0', lit: '#FAC8A4', rim: '#FFEAD0' }, 20, 9, 20);
    }, '#6A4A60'),
  ];
  // towering cumulus castles far off, standing up out of the cloud sea
  for (let i = 0; i < 4; i++) awWR(i * 320 + rnd() * 120, 120, rnd, (x, r) => {
    const base = 196, h = 50 + r() * 50, w = 60 + r() * 50;
    for (let k = 0; k < 26; k++) { const u = r(), v = r(), px = x + (u - .5) * w * (1 - v * .55), py = base - v * h, pr = 10 + (1 - v) * 12 + r() * 8;
      dab(px, py + pr * .25, pr, '#B8909E', .9); }
    for (let k = 0; k < 22; k++) { const v = r(), px = x + (r() - .5) * w * (1 - v * .6) + AW_SUN * 6, py = base - v * h - 4, pr = 6 + (1 - v) * 8 + r() * 6;
      dab(px, py, pr, AW_SUN * (px - x) > -4 ? '#F2C4A6' : '#D6A8AC', .85); }
    for (let k = 0; k < 10; k++) { const v = .4 + r() * .6; dab(x + AW_SUN * (4 + r() * w * .3) * (1 - v * .5), base - v * h - 6, 3 + r() * 4, '#FFE2C8', .8); }
  });
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; // their feet sink into the moving sea
  { const g = ctx.createLinearGradient(0, 178, 0, 200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ctx.fillStyle = g; ctx.fillRect(0, 178, AW_W, FLOOR_TOP - 178); }
  ctx.restore();
  hazeBand(f, th.haze, 90, 186, .3);
  // the skyport left astern: a small island of towers, very hazy
  const ip = { rock: '#A88A9E', lit: '#E6B8A8', band: 'rgba(90,60,90,.25)', root: '#8A7088', grass: '#A8A49A', grassLit: '#F0D0B0', tree0: '#9A9696', tree1: '#AAA6A0', tree2: '#C8C0A8', stone: '#B4A0AE', roof: '#9A7E96' };
  const ix = 980 + rnd() * 60, iy = 150;
  awIsland(ix, iy, 64, rnd, ip, { trees: 1 });
  const pt = { wall: '#B09CB4', lit: '#EEC4B0', dark: '#9686A2', roof: '#9AA2AE', roofLit: '#E6CCB8', win: '#FFE6C8', winDark: '#9488A4', flag: '#D49AA6', glow: null };
  for (let k = 0; k < 4; k++) awTower(ix - 22 + k * 14 + rnd() * 4, iy - 3, 5 + rnd() * 3, 18 + rnd() * 26, rnd, pt);
  // other ships of the fleet, far off and hazy
  const sp = { fin: '#8A7088', rig: '#6E5A72', envTop: '#D8B8BC', env: '#AE8EA6', envBot: '#8A6E8A', envLit: '#FFD8BC', seam: 'rgba(80,56,80,.35)', hull: '#8A6A6A', hullLit: '#C89E8A', hullDark: '#6A5262', trim: '#E2BC88', win: '#FFE8C0', sail: '#E8D2C2', sailLit: '#FFF0DC', mast: '#6E5660', prop: '#F0E0E0', flag: '#C87888', glow: '255,214,160' };
  zskGalleon(230 + rnd() * 60, 150 + rnd() * 12, .62, 1, sp);
  zskGalleon(640 + rnd() * 80, 118 + rnd() * 10, .4, 1, Object.assign({}, sp, { envTop: '#E0C4C4', env: '#BEA0B2', envBot: '#9E86A0', hull: '#9E8284', hullDark: '#86708A', glow: null }));
  zskGalleon(rnd() * 200 + 1120, 128, .3, -1, Object.assign({}, sp, { envTop: '#E4CCCC', env: '#C6AABA', envBot: '#AA92AA', hull: '#A88E92', hullLit: '#D8B0A0', hullDark: '#968098', glow: null }));
  ctx.strokeStyle = 'rgba(80,56,76,.7)'; ctx.lineWidth = .9; ctx.lineCap = 'round'; // gulls riding the wind
  for (let i = 0; i < 9; i++) { const x = rnd() * AW_W, y = 100 + rnd() * 60, s = 2 + rnd() * 2.5; awWrap(x, 8, (x) => { ctx.beginPath(); ctx.moveTo(x - s, y - s * .3); ctx.quadraticCurveTo(x - s * .4, y - s * .7, x, y); ctx.quadraticCurveTo(x + s * .4, y - s * .7, x + s, y - s * .4); ctx.stroke(); }); }
  hazeBand(f, th.haze, 120, 190, .18);
}
function zskDeckMid(rnd) {
  AW_SUN = 1;
  const p = { wood: '#6E4C34', woodLit: '#D8A06A', woodDark: '#2E1C14', rope: '#5A4434', ropeDark: '#3A2A20', canvas: '#D8BC9C', canvasLit: '#FFE6C4', canvasDark: '#8E7062',
    brass: '#B8873E', brassLit: '#F4D08A', brassDark: '#5E3E1E', flag: '#A83A4E', flagLit: '#F0C070', iron: '#3A2E36', prop: '#F4E4DC' };
  const env = { top: '#1C0E18', mid: '#341824', bot: '#552A30', lit: '#E8865A', seam: 'rgba(24,10,18,.55)', ring: 'rgba(24,10,16,.6)', net: 'rgba(60,36,30,.55)', brass: p.brass, brassLit: p.brassLit, brassDark: p.brassDark };
  const cells = []; for (let i = 0; i < 3; i++) cells.push(213 + i * 427 + (rnd() - .5) * 30);
  for (const cx of cells) awWR(cx, 180, rnd, (x, r) => zskMast(x, r, p));
  for (const cx of cells) zskEnvelope(cx, env);
  for (let i = 0; i < 3; i++) { const ex = (cells[i] + (i === 2 ? cells[0] + AW_W : cells[i + 1])) / 2; zskEngine(ex % AW_W, 150 + rnd() * 14, p); }
  ctx.strokeStyle = p.ropeDark; ctx.lineWidth = .6; // suspension lines from the keel rails down to the bulwark
  for (const cx of cells) awWrap(cx, 260, (cx) => { ctx.beginPath(); for (const s of [-1, 1]) for (const [u, d] of [[150, 196], [200, 236]]) { const ex = cx + s * u, ey = 26 + 116 * Math.sqrt(1 - (u / 252) * (u / 252)); ctx.moveTo(ex, ey); ctx.lineTo(cx + s * d, FLOOR_TOP); } ctx.stroke(); });
}

function zskDeckFloor(rnd, th) {
  const T = FLOOR_TOP, brass = '#C8963E', brassLit = '#F6D490', brassDark = '#5E3E1E', rope = '#C8A47A', ropeDark = '#4A3020';
  // the open rail above the bulwark: brass posts, a brass tube and a rope swagged between the posts
  for (let x = 0; x < AW_W; x += 64) awWrap(x, 6, (x) => {
    ctx.fillStyle = brassDark; ctx.fillRect(x - 1.6, T - 44, 3.2, 20); ctx.fillStyle = brass; ctx.fillRect(x - 1.2, T - 44, 2, 20); ctx.fillStyle = brassLit; ctx.fillRect(x + .2, T - 44, .7, 20);
    ctx.fillStyle = brass; circle(x, T - 45, 2.6); ctx.fill(); ctx.fillStyle = brassLit; circle(x + .7, T - 45.8, 1); ctx.fill();
  });
  ctx.lineCap = 'round';
  for (const [col, w] of [[ropeDark, 2.2], [rope, 1.2]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let x = 0; x < AW_W; x += 64) { ctx.moveTo(x, T - 37); ctx.quadraticCurveTo(x + 32, T - 26, x + 64, T - 37); } ctx.stroke(); }
  ctx.fillStyle = brassDark; ctx.fillRect(0, T - 44, AW_W, 3); ctx.fillStyle = brass; ctx.fillRect(0, T - 44, AW_W, 2); ctx.fillStyle = brassLit; ctx.fillRect(0, T - 44, AW_W, .7);
  // the bulwark: three strakes of planking on timberheads, a cap rail, scuppers, belaying pins and hanging coils
  const B = T - 26;
  for (let row = 0; row < 3; row++) for (const [x0, w] of awRow(rnd, 60, 140)) awWR(x0, w, rnd, (x, r) => {
    const y = B + 2 + row * 7.6, col = awMix(['#7A5638', '#6E4C32', '#84603E', '#73513A'][Math.floor(r() * 4)], '#3A2418', row * .12);
    ctx.fillStyle = col; ctx.fillRect(x, y, w - .8, 7); ctx.fillStyle = 'rgba(255,214,170,.22)'; ctx.fillRect(x, y, w - .8, .9); ctx.fillStyle = 'rgba(30,16,10,.45)'; ctx.fillRect(x, y + 6, w - .8, 1);
    ctx.strokeStyle = 'rgba(40,22,14,.3)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x + 2, y + 3 + r()); ctx.bezierCurveTo(x + w * .3, y + 2 + r() * 2, x + w * .7, y + 4 + r(), x + w - 3, y + 3.5); ctx.stroke();
  });
  for (let x = 32; x < AW_W; x += 64) { // timberheads, lit on the sun side
    ctx.fillStyle = '#3E2818'; ctx.fillRect(x - 3, B, 6, 26); ctx.fillStyle = '#B07E52'; ctx.fillRect(x + 1.6, B, 1.4, 26); ctx.fillStyle = '#5A3C26'; ctx.fillRect(x - 3, B, 1.2, 26);
    awRivet(x, B + 7, .9, brassLit); awRivet(x, B + 18, .9, brassLit);
  }
  ctx.fillStyle = '#2E1C12'; ctx.fillRect(0, B - 2, AW_W, 4.4); ctx.fillStyle = '#9A6E46'; ctx.fillRect(0, B - 2, AW_W, 1.4); ctx.fillStyle = brass; ctx.fillRect(0, B + 2, AW_W, 1.2); // cap rail
  for (let x = 96; x < AW_W; x += 128) { ctx.fillStyle = '#1A0E0A'; ell(x, T - 3, 4, 1.6); ctx.fill(); }
  for (let i = 0; i < 3; i++) awWR(150 + i * 427 + rnd() * 60, 30, rnd, (x, r) => { // a pin rail with ropes made fast and hanging in coils
    ctx.fillStyle = '#4A2E1C'; ctx.fillRect(x - 16, B + 6, 32, 3); ctx.fillStyle = '#B07E52'; ctx.fillRect(x - 16, B + 6, 32, .8);
    for (let k = 0; k < 4; k++) { const px = x - 12 + k * 8; ctx.fillStyle = '#C89A62'; ctx.fillRect(px - .8, B + 1, 1.6, 12); ctx.fillStyle = '#5A3A22'; ctx.fillRect(px - .8, B + 4.5, 1.6, 1); }
    for (let k = 0; k < 3; k++) if (r() < .8) { const px = x - 8 + k * 8, cl = 7 + r() * 4;
      for (const [col, w] of [[ropeDark, 2.2], [rope, 1.1]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(px - 2.6 + j * .4, B + 5); ctx.quadraticCurveTo(px - 4 + j, B + 7 + cl + j * .6, px + 2 - j * .3, B + 5); } ctx.stroke(); } }
  });
  // the waterway along the foot of the bulwark, edged in brass
  ctx.fillStyle = '#24160E'; ctx.fillRect(0, T - 2, AW_W, 6); ctx.fillStyle = brass; ctx.fillRect(0, T + 3, AW_W, 1.6); ctx.fillStyle = brassLit; ctx.fillRect(0, T + 3, AW_W, .6);
  for (let x = 4; x < AW_W; x += 9) awRivet(x, T + 3.8, .55, '#FFE4A8');
  // the deck: narrow weathered planks laid fore and aft, black pitch in the seams, treenails at the butts
  let y = T + 4.6, h = 5.4, row = 0;
  const brassRows = new Set([5, 11]);
  while (y < VH) {
    ctx.fillStyle = '#120A06'; ctx.fillRect(0, y, AW_W, h);
    const k = (y - T) / (VH - T);
    if (brassRows.has(row)) { // a brass strake let into the deck, riveted down
      ctx.fillStyle = brassDark; ctx.fillRect(0, y, AW_W, 3.2); ctx.fillStyle = brass; ctx.fillRect(0, y + .3, AW_W, 2.2); ctx.fillStyle = brassLit; ctx.fillRect(0, y + .3, AW_W, .7);
      for (let x = 5; x < AW_W; x += 10) awRivet(x, y + 1.6, .6, '#FFE4A8');
      y += 3.4; row++; continue;
    }
    for (const [x0, w] of awRow(rnd, 100, 230)) awWR(x0, w, rnd, (x, r) => {
      let col = ['#8A5C3A', '#7C5234', '#966642', '#744C34', '#8E6040', '#82583A'][Math.floor(r() * 6)]; col = awMix(col, '#9A9088', r() * r() * .35); col = awMix(col, '#2A160E', k * .35);
      ctx.fillStyle = col; ctx.fillRect(x + .5, y, w - 1, h - 1.2);
      ctx.fillStyle = 'rgba(255,206,150,.32)'; ctx.fillRect(x + .5, y, w - 1, .7);
      ctx.fillStyle = 'rgba(30,14,6,.28)'; ctx.fillRect(x + .5, y + h - 2.4, w - 1, 1.2);
      for (let d = 0; d < w / 14; d++) dab(x + 4 + r() * (w - 8), y + h * (.3 + r() * .4), h * (.25 + r() * .2), r() < .5 ? awMix(col, '#C8A27A', .3) : awMix(col, '#3A2014', .3), .5); // brushwork along the grain
      ctx.strokeStyle = 'rgba(40,20,10,.38)'; ctx.lineWidth = .5; ctx.beginPath();
      for (let g = 0; g < 2 + (h > 9 ? 1 : 0); g++) { const gy = y + h * (.3 + g * .25) + r() * .8; ctx.moveTo(x + 2, gy); ctx.bezierCurveTo(x + w * .3, gy + r() * 1.2 - .6, x + w * .6, gy + r() * 1.2 - .6, x + w - 2, gy); } ctx.stroke();
      if (r() < .2) { const kx = x + w * (.2 + r() * .6), ky = y + h * .5; ctx.strokeStyle = 'rgba(40,20,10,.6)'; ctx.lineWidth = .6; ell(kx, ky, 2.4, h * .22); ctx.stroke(); }
      ctx.fillStyle = '#B88E62'; for (const nx of [x + 2.6, x + w - 2.6]) { circle(nx, y + h * .45, .5 + h * .04); ctx.fill(); } // treenails at the butts
      ctx.fillStyle = 'rgba(30,14,6,.6)'; for (const nx of [x + 2.6, x + w - 2.6]) { circle(nx + .3, y + h * .45 + .3, .3 + h * .02); ctx.fill(); }
    });
    y += h; h += .85; row++;
  }
  // long shadows of the rigging, thrown toward us by the sun behind the ship's side, and the bulwark's own shade
  { const g = ctx.createLinearGradient(0, T + 3, 0, T + 22); g.addColorStop(0, 'rgba(30,12,10,.45)'); g.addColorStop(1, 'rgba(30,12,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, T + 3, AW_W, 19); }
  ctx.lineCap = 'butt';
  for (let i = 0; i < 7; i++) { const x = rnd() * AW_W, n = 1 + Math.floor(rnd() * 3), sl = -.55 - rnd() * .25; awWrap(x, 90, (x) => {
    ctx.strokeStyle = 'rgba(30,12,10,.12)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let j = 0; j < n; j++) { ctx.moveTo(x + j * 7, T + 4); ctx.lineTo(x + j * 7 + (VH - T) * sl * (1 + j * .08), VH); } ctx.stroke(); }); }
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; // the low sun glances off the deck: warm sheen far, darker near
  { const g = ctx.createLinearGradient(0, T, 0, VH); g.addColorStop(0, 'rgba(255,180,110,.4)'); g.addColorStop(.45, 'rgba(255,180,110,.05)'); g.addColorStop(1, 'rgba(30,14,24,.5)'); ctx.fillStyle = g; ctx.fillRect(0, T, AW_W, VH - T); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,226,190,.13)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 120; i++) { const x = rnd() * AW_W, yy = T + 34 + rnd() * 60; ctx.moveTo(x, yy); ctx.lineTo(x + 3 + rnd() * 7, yy + (rnd() - .5) * .6); } ctx.stroke(); // scuffs where the crew walk
  // a capstan near the bulwark
  awWR(560 + rnd() * 80, 26, rnd, (x) => {
    const b = T + 15; ctx.fillStyle = 'rgba(30,16,10,.35)'; ell(x + 3, b, 16, 3.4); ctx.fill();
    const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, '#3A2416'); g.addColorStop(.5, '#7A5434'); g.addColorStop(1, '#C8925C'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 9, b); ctx.lineTo(x - 7, b - 18); ctx.lineTo(x + 7, b - 18); ctx.lineTo(x + 9, b); ctx.ellipse(x, b, 9, 2.4, 0, 0, Math.PI); ctx.fill();
    for (let wx = -6; wx <= 6; wx += 3) { ctx.fillStyle = 'rgba(30,16,10,.4)'; ctx.fillRect(x + wx, b - 15, .9, 13); } // whelps
    ctx.fillStyle = brassDark; ctx.fillRect(x - 9.4, b - 4, 18.8, 3); ctx.fillStyle = brass; ctx.fillRect(x - 9.4, b - 4, 18.8, 1.6);
    ctx.fillStyle = '#5A3A22'; ell(x, b - 18, 8, 2.2); ctx.fill(); ctx.fillStyle = brass; ell(x, b - 20, 9.5, 2.6); ctx.fill(); ctx.fillStyle = brassLit; ell(x + 1.5, b - 20.6, 6, 1.3); ctx.fill();
    ctx.strokeStyle = '#3A2416'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 24, b - 22); ctx.lineTo(x + 24, b - 18.6); ctx.stroke(); ctx.strokeStyle = '#A87A4E'; ctx.lineWidth = 1; ctx.stroke(); // a capstan bar
  });
  // grating hatches with brass corner plates, and a battened cargo hatch
  for (let i = 0; i < 2; i++) awWR(260 + i * 640 + rnd() * 80, 40, rnd, (x, r) => {
    const yy = T + 34 + r() * 26, w = 46, hh = 16;
    ctx.fillStyle = 'rgba(20,10,6,.45)'; ctx.fillRect(x - 1, yy + 1, w + 3, hh + 2);
    ctx.fillStyle = '#5A3A24'; ctx.fillRect(x, yy, w, hh); ctx.fillStyle = '#B88A5A'; ctx.fillRect(x, yy, w, 1.1);
    ctx.fillStyle = '#140A06'; ctx.fillRect(x + 3, yy + 3, w - 6, hh - 6);
    ctx.fillStyle = '#8A6040'; for (let gx = x + 3; gx < x + w - 3; gx += 4) ctx.fillRect(gx, yy + 3, 1.6, hh - 6); for (let gy = yy + 3; gy < yy + hh - 3; gy += 3.2) ctx.fillRect(x + 3, gy, w - 6, 1.2);
    ctx.fillStyle = 'rgba(255,220,170,.35)'; for (let gx = x + 3; gx < x + w - 3; gx += 4) ctx.fillRect(gx, yy + 3, 1.6, .5);
    ctx.fillStyle = brass; for (const [cx, cy] of [[x, yy], [x + w - 5, yy], [x, yy + hh - 4], [x + w - 5, yy + hh - 4]]) { ctx.fillRect(cx, cy, 5, 4); } ctx.fillStyle = brassLit; for (const cx of [x, x + w - 5]) ctx.fillRect(cx, yy, 5, .8);
  });
  awWR(1130 + rnd() * 40, 40, rnd, (x, r) => {
    const yy = T + 66, w = 58, hh = 20;
    ctx.fillStyle = 'rgba(20,10,6,.45)'; ctx.fillRect(x - 1, yy + 1, w + 3, hh + 2);
    ctx.fillStyle = '#4A2E1C'; ctx.fillRect(x, yy, w, hh);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#8E6A48', '#86623E', '#94704C', '#8A6844'][k]; ctx.fillRect(x + 2, yy + 2 + k * 4, w - 4, 3.6); ctx.fillStyle = 'rgba(255,220,170,.25)'; ctx.fillRect(x + 2, yy + 2 + k * 4, w - 4, .6); }
    for (const bx of [x + 12, x + w - 15]) { ctx.fillStyle = brassDark; ctx.fillRect(bx, yy - .5, 3.4, hh + 1); ctx.fillStyle = brass; ctx.fillRect(bx, yy - .5, 2.4, hh + 1); awRivet(bx + 1.5, yy + 4, .7, brassLit); awRivet(bx + 1.5, yy + hh - 4, .7, brassLit); }
    ctx.strokeStyle = brass; ctx.lineWidth = 1; ell(x + w / 2, yy + hh / 2, 3, 1.6); ctx.stroke(); // the lifting ring
  });
  // coils of rope flaked down on the deck, and ringbolts
  for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 18, rnd, (x, r) => {
    const yy = T + 14 + r() * 74, R = 7 + r() * 4;
    ctx.fillStyle = 'rgba(30,16,10,.35)'; ell(x + 1.5, yy + 1.4, R + 1.5, R * .36 + 1); ctx.fill();
    for (let k = 0; k < 4; k++) { const rk = R - k * 1.9; ctx.strokeStyle = ropeDark; ctx.lineWidth = 2.4; ell(x, yy - k * .5, rk, rk * .34); ctx.stroke(); ctx.strokeStyle = k % 2 ? '#B89068' : rope; ctx.lineWidth = 1.3; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,236,200,.5)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(x, yy - 1, R - 1, (R - 1) * .34, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    ctx.strokeStyle = ropeDark; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x + R, yy); ctx.quadraticCurveTo(x + R + 8, yy + 4, x + R + 14 + r() * 6, yy + 2); ctx.stroke(); ctx.strokeStyle = rope; ctx.lineWidth = 1.2; ctx.stroke();
  });
  for (let i = 0; i < 8; i++) { const x = rnd() * AW_W, yy = T + 10 + rnd() * 90; awWrap(x, 4, (x) => { ctx.strokeStyle = brassDark; ctx.lineWidth = 1.4; ell(x, yy, 2.4, 1); ctx.stroke(); ctx.strokeStyle = brassLit; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(x, yy - .2, 2.4, 1, 0, Math.PI, TAU); ctx.stroke(); }); }
  ctx.fillStyle = 'rgba(200,150,80,.55)'; ctx.fillRect(0, T + 100, AW_W, 1.3);
  const sh = ctx.createLinearGradient(0, VH - 32, 0, VH); sh.addColorStop(0, 'rgba(30,16,18,0)'); sh.addColorStop(1, 'rgba(30,16,18,.45)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 32, AW_W, 32);
}

// ======================================================================================================
// THE FOUNDRY CROWN
// ======================================================================================================
// a chain of alternating links (ring, then edge-on bar) along a segment
function zskChain(ax, ay, bx, by, p, s = 1) {
  const len = Math.hypot(bx - ax, by - ay), a = Math.atan2(by - ay, bx - ax);
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(a - Math.PI / 2);
  for (let y = 0, k = 0; y < len; y += 4.6 * s, k++) {
    if (k % 2) { ctx.fillStyle = p.dark; ctx.fillRect(-1.1 * s, y - 1, 2.2 * s, 6.6 * s); ctx.fillStyle = p.lit; ctx.fillRect(-.3 * s, y, .7 * s, 4.6 * s); }
    else { ctx.strokeStyle = p.dark; ctx.lineWidth = 1.7 * s; ell(0, y + 2.3 * s, 2.5 * s, 3.4 * s); ctx.stroke(); ctx.strokeStyle = p.lit; ctx.lineWidth = .6 * s; ctx.beginPath(); ctx.ellipse(0, y + 2.3 * s, 2.5 * s, 3.4 * s, 0, Math.PI * .9, Math.PI * 1.6); ctx.stroke(); }
  }
  ctx.restore();
}
// a hanging crucible: a bail on its trunnions, a banded iron pot, the melt glowing at the lip
function zskCrucible(x, y, s, tilt, p) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  ctx.strokeStyle = p.dark; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-17, 5); ctx.quadraticCurveTo(-17, -20, 0, -22); ctx.quadraticCurveTo(17, -20, 17, 5); ctx.stroke();
  ctx.strokeStyle = p.lit; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-16, 2); ctx.quadraticCurveTo(-16, -19, 0, -21); ctx.stroke();
  const pot = () => { ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.lineTo(19, -3); ctx.lineTo(16, 2); ctx.quadraticCurveTo(14, 20, 10, 25); ctx.lineTo(-10, 25); ctx.quadraticCurveTo(-14, 20, -15, 0); ctx.closePath(); };
  pot(); const g = ctx.createLinearGradient(-15, 0, 15, 0); g.addColorStop(0, p.lit); g.addColorStop(.4, p.base); g.addColorStop(1, p.dark); ctx.fillStyle = g; ctx.fill();
  ctx.save(); pot(); ctx.clip();
  ctx.fillStyle = p.glowLow; ctx.globalAlpha = .55; ctx.fillRect(-20, 18, 40, 8); ctx.globalAlpha = 1; // the furnace light catching its underside
  for (const by of [6, 17]) { ctx.fillStyle = p.dark; ctx.fillRect(-20, by, 40, 3); ctx.fillStyle = p.lit; ctx.fillRect(-20, by, 40, .7); }
  for (let k = 0; k < 6; k++) dab(-10 + k * 4, 10 + (k % 2) * 6, 2.4, 'rgba(120,60,40,.35)', 1);
  ctx.restore();
  for (const sx of [-1, 1]) { ctx.fillStyle = p.dark; circle(sx * 16.5, 4, 2.6); ctx.fill(); ctx.fillStyle = p.lit; circle(sx * 16.5 - .6, 3.4, 1); ctx.fill(); }
  const mg = ctx.createRadialGradient(2, 0, 1, 0, 0, 15); mg.addColorStop(0, '#FFFBE0'); mg.addColorStop(.4, '#FFD060'); mg.addColorStop(1, '#F06A1E');
  ctx.fillStyle = mg; ell(0, .4, 14.6, 3); ctx.fill();
  ctx.fillStyle = 'rgba(90,30,14,.7)'; ell(-6, .6, 3, .9); ctx.fill(); ell(5, .2, 2, .7); ctx.fill(); // floating dross
  ctx.restore();
  awHalo(x, y, 34 * s, '255,150,60', .5);
}
// a furnace mouth: a firebrick arch, the white-hot heart fading to red, a grate across it, a spill of slag over the sill
function zskFurnace(x, base, w, h, p) {
  const r = w / 2, sp = base - h + r, R = r + 12;
  awHalo(x, base - h * .45, w * 1.5, '255,120,50', .4);
  ctx.fillStyle = p.brickDark; ctx.beginPath(); ctx.moveTo(x - R - 4, base); ctx.lineTo(x - R - 4, sp); ctx.arc(x, sp, R + 4, Math.PI, 0); ctx.lineTo(x + R + 4, base); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 11; k++) { // voussoirs, a little uneven, the ones facing the light warmer
    const a0 = Math.PI + k / 11 * Math.PI + .012, a1 = Math.PI + (k + 1) / 11 * Math.PI - .012, rr = R + (k === 5 ? 4 : 0) + (zskHsh(k + x) - .5) * 1.5;
    ctx.fillStyle = [p.brick, p.brickLit, p.brick, p.brickDark][(k + Math.floor(zskHsh(k * 3 + x) * 3)) % 4];
    ctx.beginPath(); ctx.arc(x, sp, rr, a0, a1); ctx.arc(x, sp, r + .5, a1, a0, true); ctx.closePath(); ctx.fill();
  }
  for (const s of [-1, 1]) for (let yy = sp; yy < base - 2; yy += 7) { const bw = (Math.floor((yy - sp) / 7) % 2) ? 12 : 8;
    ctx.fillStyle = (Math.floor(yy) % 3) ? p.brick : p.brickLit; ctx.fillRect(s > 0 ? x + r + .5 : x - r - .5 - bw, yy + .6, bw, 6); ctx.fillStyle = p.brickDark; ctx.fillRect(s > 0 ? x + r + .5 + bw : x - r - .5 - bw - 4, yy + .6, 4, 6); }
  const mouth = () => { ctx.beginPath(); ctx.moveTo(x - r, base); ctx.lineTo(x - r, sp); ctx.arc(x, sp, r, Math.PI, 0); ctx.lineTo(x + r, base); ctx.closePath(); };
  mouth(); const g = ctx.createRadialGradient(x, base - 8, 3, x, base - h * .4, h * 1.05);
  g.addColorStop(0, '#FFF8D0'); g.addColorStop(.22, '#FFCC58'); g.addColorStop(.5, '#F2741E'); g.addColorStop(.8, '#8E2610'); g.addColorStop(1, '#3A0C06'); ctx.fillStyle = g; ctx.fill();
  ctx.save(); mouth(); ctx.clip();
  for (let k = 0; k < 5; k++) { const fx = x - r * .7 + k * r * .35 + (zskHsh(k + x * 2) - .5) * 6, fh = h * (.35 + zskHsh(k * 5 + x) * .3); // tongues of flame
    ctx.fillStyle = 'rgba(255,236,150,.55)'; ctx.beginPath(); ctx.moveTo(fx - 6, base); ctx.bezierCurveTo(fx - 7, base - fh * .5, fx + 3, base - fh * .6, fx + 1, base - fh); ctx.bezierCurveTo(fx + 6, base - fh * .5, fx + 7, base - fh * .3, fx + 6, base); ctx.closePath(); ctx.fill(); }
  for (let k = 0; k < 14; k++) dab(x - r + 4 + zskHsh(k + x) * (w - 8), base - 4 - zskHsh(k * 7 + x) * 8, 2.5 + zskHsh(k * 3) * 3, zskHsh(k * 11) > .5 ? '#FFF2B0' : '#FF9A3A', .9); // the coals
  ctx.restore();
  ctx.fillStyle = p.iron; for (let gx = x - r + 5; gx < x + r - 2; gx += 7) { ctx.fillRect(gx, base - h * .42, 2.6, h * .42); } ctx.fillRect(x - r, base - h * .42, w, 2.6); // the grate, black against the heat
  ctx.fillStyle = '#FFB060'; for (let gx = x - r + 5; gx < x + r - 2; gx += 7) ctx.fillRect(gx + (AW_SUN > 0 ? 2 : 0), base - h * .42, .6, h * .42);
  ctx.fillStyle = p.iron; ctx.fillRect(x - r - 5, base - 7, w + 10, 4); ctx.fillStyle = '#E8A060'; ctx.fillRect(x - r - 5, base - 7, w + 10, .8); // sill
  ctx.fillStyle = '#FFD070'; ctx.beginPath(); ctx.moveTo(x + r * .2, base - 6); ctx.quadraticCurveTo(x + r * .3, base - 2, x + r * .26, base); ctx.lineTo(x + r * .44, base); ctx.quadraticCurveTo(x + r * .4, base - 3, x + r * .46, base - 6); ctx.closePath(); ctx.fill(); // slag spilling over
  ctx.fillStyle = p.brass; circle(x, sp - R - 1, 4.4); ctx.fill(); ctx.fillStyle = p.iron; circle(x, sp - R - 1, 1.6); ctx.fill(); // a brass boss on the keystone
}
// a great I-beam column: a dark web between riveted flanges, stiffener plates, a bolted foot
function zskGirder(x, top, base, w, p) {
  const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, p.dark); g.addColorStop(.7, p.base); g.addColorStop(1, p.warm); ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, base - top);
  ctx.fillStyle = 'rgba(10,4,4,.45)'; ctx.fillRect(x - w / 2 + 4, top, w - 8, base - top);
  for (const s of [-1, 1]) { const fx = s < 0 ? x - w / 2 - 1 : x + w / 2 - 4; ctx.fillStyle = p.base; ctx.fillRect(fx, top, 5, base - top); ctx.fillStyle = (s === AW_SUN) ? p.lit : p.dark; ctx.globalAlpha = .7; ctx.fillRect(s < 0 ? fx : fx + 3.6, top, 1.4, base - top); ctx.globalAlpha = 1;
    for (let y = top + 4; y < base - 4; y += 7) awRivet(fx + 2.5, y, .8, p.rivet); }
  for (let y = top + 30; y < base - 20; y += 46) { ctx.fillStyle = p.base; ctx.fillRect(x - w / 2 + 4, y, w - 8, 4); ctx.fillStyle = p.lit; ctx.globalAlpha = .5; ctx.fillRect(x - w / 2 + 4, y, w - 8, .8); ctx.globalAlpha = 1; }
  ctx.fillStyle = p.dark; ctx.fillRect(x - w / 2 - 7, base - 12, w + 14, 12); ctx.fillStyle = p.base; ctx.fillRect(x - w / 2 - 4, base - 18, w + 8, 6);
  ctx.fillStyle = p.warm; ctx.fillRect(x - w / 2 - 7, base - 12, w + 14, 1.2); for (const dx of [-w / 2 - 3, w / 2 + 3]) awRivet(x + dx, base - 6, 1.4, p.rivet);
}
// a vent on a pipe, breathing a column of steam that leans with the draught
function zskSteam(x, y, h, lean) {
  for (let k = 0; k < 9; k++) { const v = k / 8, px = x + lean * v * v * h * .5, py = y - v * h, r = 5 + v * h * .28;
    awSoft(px, py, r, r * .8, '236,222,214', .3 * (1 - v * .7)); awSoft(px - AW_SUN * r * .3, py + r * .3, r * .7, r * .4, '255,160,110', .12 * (1 - v)); }
}

function zskFoundryFar(rnd, th, f) {
  AW_SUN = -1;
  // smoke from stacks beyond the walls
  const stacks = []; for (let i = 0; i < 6; i++) stacks.push([i * 213 + rnd() * 80, 200, 12 + rnd() * 8, 120 + rnd() * 50]);
  for (const [x, base, w, h] of stacks) awWR(x, 160, rnd, (x, r) => { const top = base - h;
    for (let k = 0; k < 11; k++) { const v = k / 10, px = x + v * v * 120 + (r() - .5) * 10, py = top - 6 - v * 70, rr = 8 + v * 34;
      awSoft(px, py, rr, rr * .7, '40,18,20', .6 * (1 - v * .45)); awSoft(px - 4, py + rr * .35, rr * .7, rr * .3, '230,110,60', .12 * (1 - v)); } });
  // the far ramparts of the fortress, crowned with merlons and towers, lamps lit
  const wy = awWave(rnd() * 1e6 | 0, [[2, 6], [5, 3]]);
  ctx.fillStyle = '#5E3032'; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP);
  for (let x = 0; x <= AW_W; x += 10) { const y = 172 + wy(x); ctx.lineTo(x, y); ctx.lineTo(x + 6, y); ctx.lineTo(x + 6, y + 5); ctx.lineTo(x + 10, y + 5); }
  ctx.lineTo(AW_W, FLOOR_TOP); ctx.closePath(); ctx.fill();
  const tp = { wall: '#6A3634', lit: '#C8684C', dark: '#4A2428', roof: '#5A2C30', roofLit: '#B0584A', win: '#FFB868', winDark: '#3A1C20', flag: '#E05030', glow: null, face: '#FFD9A0' };
  for (let i = 0; i < 7; i++) awTower(i * 183 + rnd() * 60, 180 + wy(i * 183) * .5, 14 + rnd() * 12, 50 + rnd() * 50, rnd, tp, i === 4 ? 'clock' : ['spire', 'dome', 'spire'][i % 3]);
  for (const [x, base, w, h] of stacks) awWrap(x, w, (x) => { // chimney stacks with glowing throats
    const top = base - h, g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#C86E52'); g.addColorStop(.4, '#7E4440'); g.addColorStop(1, '#5A2E30'); ctx.fillStyle = g;
    awPath([x - w / 2, base, x - w * .36, top, x + w * .36, top, x + w / 2, base]); ctx.fill();
    ctx.fillStyle = '#3E1E22'; for (let y = top + 14; y < base; y += 22) ctx.fillRect(x - w / 2, y, w, 2.2);
    ctx.fillStyle = '#4A2428'; ctx.fillRect(x - w * .46, top - 3, w * .92, 4);
    ctx.fillStyle = '#FFB060'; ctx.fillRect(x - w * .3, top - 3.6, w * .6, 1.4);
  });
  awWR(1000 + rnd() * 100, 60, rnd, (x) => awGear(x, 128, 44, 18, .3, { base: '#7A3E36', lit: '#C8704E', dark: '#4A2428', edge: '#E8946A', hub: '#5A2E30', hubLit: '#A05444' }));
  hazeBand(f, th.haze, 130, FLOOR_TOP, .4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; // the glow of the melt rising behind the ramparts
  for (let i = 0; i < 5; i++) { const x = i * 256 + rnd() * 100; awWrap(x, 160, (x) => awSoft(x, 200, 160, 50, '255,110,40', .25)); }
  ctx.restore();
  // a nearer rampart, darker, with a heavy crown of spikes
  ctx.fillStyle = '#3E2024'; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP);
  for (let x = 0; x <= AW_W; x += 16) { const y = 196 + wy(x * 2) * .4; ctx.lineTo(x, y); ctx.lineTo(x + 4, y); ctx.lineTo(x + 8, y - 9); ctx.lineTo(x + 12, y); ctx.lineTo(x + 16, y); }
  ctx.lineTo(AW_W, FLOOR_TOP); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, y = 206 + rnd() * 22; awWrap(x, 4, (x) => { ctx.fillStyle = '#FFB060'; ctx.fillRect(x, y, 1.6, 2.6); }); }
  hazeBand(f, th.haze, 170, FLOOR_TOP, .35);
  { const g = ctx.createLinearGradient(0, 40, 0, 130); g.addColorStop(0, 'rgba(34,14,18,.55)'); g.addColorStop(1, 'rgba(34,14,18,0)'); ctx.fillStyle = g; ctx.fillRect(0, 40, AW_W, 90); } // smoke pooling under the roof
}
function zskFoundryMid(rnd) {
  AW_SUN = -1;
  const iron = { base: '#4A3634', lit: '#C27A5A', dark: '#1E1414', warm: '#7A4632', rivet: '#E0A070' };
  const brass = { base: '#8A5E30', lit: '#F0B060', dark: '#3E2614', edge: '#FFD08A', hub: '#5A3A2A', hubLit: '#D88A50' };
  const ironGear = { base: '#34262A', lit: '#C8805C', dark: '#120A0A', edge: '#F0A070', hub: '#8A5E30', hubLit: '#F0B060' };
  const fp = { brick: '#7A3424', brickLit: '#A84E30', brickDark: '#4A1E16', iron: '#1A1010', brass: '#C8903E' };
  const cp = { base: '#3E2E2C', lit: '#A06A4E', dark: '#140C0C', glowLow: '#E07030' };
  const chainP = { dark: '#140C0C', lit: '#B07050' };
  const WT = 160; // the top of the furnace wall
  // the furnace wall: riveted plates warmed from below
  { const g = ctx.createLinearGradient(0, WT, 0, FLOOR_TOP); g.addColorStop(0, '#30201F'); g.addColorStop(.6, '#4A2C26'); g.addColorStop(1, '#6E3A2A'); ctx.fillStyle = g; ctx.fillRect(0, WT, AW_W, FLOOR_TOP - WT); }
  let row = 0;
  for (let y = WT + 6; y < FLOOR_TOP; y += 22, row++) {
    for (const [x0, w] of awRow(rnd, 50, 90)) awWR(x0, w, rnd, (x, r) => {
      ctx.fillStyle = `rgba(${r() < .5 ? '90,50,40' : '30,18,18'},${.2 + r() * .25})`; ctx.fillRect(x + 1, y + 1, w - 2, 20);
      ctx.fillStyle = '#160E0E'; ctx.fillRect(x, y, 1.2, 22);
      ctx.fillStyle = 'rgba(220,120,80,.35)'; ctx.fillRect(x + 1.2, y + 1, .8, 21);
      for (let ry = y + 4; ry < y + 21; ry += 5.5) awRivet(x + 3.4, ry, .7, '#C88262');
      if (r() < .4) { ctx.fillStyle = 'rgba(20,10,10,.35)'; ctx.fillRect(x + w * r(), y + 2, 2 + r() * 3, 14 + r() * 10); } // soot runs
    });
    ctx.fillStyle = '#160E0E'; ctx.fillRect(0, y, AW_W, 1.6); ctx.fillStyle = 'rgba(230,130,80,.4)'; ctx.fillRect(0, y + 1.6, AW_W, .8);
    for (let x = 3; x < AW_W; x += 6) awRivet(x, y + 4, .6, '#C88262');
  }
  // the crown along the top of the wall: a cornice, then a row of forged iron spikes, tall ones tipped with brass
  ctx.fillStyle = '#1A1010'; ctx.fillRect(0, WT - 5, AW_W, 11); ctx.fillStyle = '#C27A5A'; ctx.fillRect(0, WT - 5, AW_W, 1); ctx.fillStyle = '#3E2A26'; ctx.fillRect(0, WT + 3, AW_W, 3);
  for (let x = 0, k = 0; x < AW_W; x += 16, k++) {
    const tall = k % 4 === 0, mid = k % 2 === 0, sh = tall ? 30 : mid ? 18 : 11, sw = tall ? 4.4 : 3.4, cx = x + 8, b = WT - 5;
    ctx.fillStyle = '#140C0C'; awPath([cx - sw, b, cx - sw * .35, b - sh * .55, cx, b - sh, cx + sw * .35, b - sh * .55, cx + sw, b]); ctx.fill();
    ctx.fillStyle = 'rgba(214,120,84,.75)'; awPath(AW_SUN < 0 ? [cx - sw, b, cx - sw * .35, b - sh * .55, cx, b - sh, cx - sw * .1, b] : [cx + sw, b, cx + sw * .35, b - sh * .55, cx, b - sh, cx + sw * .1, b]); ctx.fill();
    if (tall) { ctx.fillStyle = '#C8903E'; circle(cx, b - sh * .5, 2.6); ctx.fill(); ctx.fillStyle = '#FFD08A'; circle(cx - .8, b - sh * .5 - .8, .9); ctx.fill(); ctx.strokeStyle = '#140C0C'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 7, b - 6); ctx.quadraticCurveTo(cx - 3, b - 8, cx - 2, b - 14); ctx.moveTo(cx + 7, b - 6); ctx.quadraticCurveTo(cx + 3, b - 8, cx + 2, b - 14); ctx.stroke(); }
  }
  // giant gears turning the hoists, set into the wall
  const gears = [[575 + rnd() * 20, 128, 66], [1215 + rnd() * 20, 120, 72]];
  for (const [x, y, r] of gears) awWR(x, r * 1.6, rnd, (x, rr) => {
    const r2 = r * .48;
    awGear(x - (r + r2) * .82, y + 58, r2, 12, rr() * TAU, ironGear);
    awGear(x, y, r, Math.round(r * .5), rr() * TAU, rr() < .5 ? brass : ironGear);
  });
  // steam pipes along the wall, with vents
  for (const py of [190]) {
    ctx.lineCap = 'butt'; ctx.strokeStyle = '#140C0C'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(AW_W, py); ctx.stroke();
    ctx.strokeStyle = '#5A3E36'; ctx.lineWidth = 4.6; ctx.stroke(); ctx.strokeStyle = '#D08A62'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, py + 1.4); ctx.lineTo(AW_W, py + 1.4); ctx.stroke();
    for (let x = 20; x < AW_W; x += 80) { ctx.fillStyle = '#8A5E30'; ctx.fillRect(x, py - 5, 3.4, 10); ctx.fillStyle = '#F0B060'; ctx.fillRect(x, py - 5, 1, 10); }
  }
  const furn = [250 + rnd() * 30, 890 + rnd() * 30];
  for (const fx of furn) awWR(fx, 100, rnd, (x, r) => zskFurnace(x, FLOOR_TOP - 2, 80, 76, fp));
  // the columns, and the great gantry beam they carry
  const cols = [60, 440 + rnd() * 20, 700 + rnd() * 20, 1080 + rnd() * 20];
  for (const cx of cols) awWrap(cx, 20, (x) => zskGirder(x, 40, FLOOR_TOP, 24, iron));
  for (const cx of cols) awWrap(cx, 60, (x) => { ctx.strokeStyle = '#1E1414'; ctx.lineWidth = 5; ctx.lineCap = 'butt'; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(x + s * 12, 104); ctx.lineTo(x + s * 46, 66); } ctx.stroke(); ctx.strokeStyle = '#6A4434'; ctx.lineWidth = 2; ctx.stroke(); }); // knee braces
  awTruss(48, 22, { dark: '#1E1414', lit: '#C27A5A' });
  { const g = ctx.createLinearGradient(0, 64, 0, 76); g.addColorStop(0, '#5A3E36'); g.addColorStop(1, '#1E1414'); ctx.fillStyle = g; ctx.fillRect(0, 66, AW_W, 10); ctx.fillStyle = '#D08A62'; ctx.fillRect(0, 66, AW_W, 1); for (let x = 4; x < AW_W; x += 8) awRivet(x, 71, .7, '#E0A070'); }
  // chains from the beam: hooks, and crucibles of melt slung over the furnaces
  for (let i = 0; i < 7; i++) { const x = rnd() * AW_W, len = 40 + rnd() * 70; awWrap(x, 8, (x) => {
    zskChain(x, 76, x, 76 + len, chainP);
    ctx.strokeStyle = '#140C0C'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 76 + len); ctx.lineTo(x, 82 + len); ctx.arc(x + 4, 82 + len, 4, Math.PI, Math.PI * .1, true); ctx.stroke();
    ctx.strokeStyle = '#B07050'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(x + 4, 82 + len, 4, Math.PI * .9, Math.PI * .4, true); ctx.stroke(); }); }
  const cru = [[furn[0] + 70, 132, .95, -.06], [furn[1] - 64, 112, 1.1, .32], [cols[2] + 120, 96, .75, .05]];
  for (const [x, y, s, tilt] of cru) awWrap(x, 70, (x) => {
    const top = y - 22 * s;
    zskChain(x - 22, 76, x, top, chainP, .9); zskChain(x + 22, 76, x, top, chainP, .9); zskChain(x, 76, x, top, chainP, .9);
    if (tilt > .2) { // pouring: a thread of melt falling to a mould behind the wall's foot
      const lx = x + Math.cos(tilt) * 19 * s - Math.sin(tilt) * -3 * s, ly = y + Math.sin(tilt) * 19 * s;
      awHalo(lx + 8, (ly + FLOOR_TOP) / 2, 60, '255,150,60', .35);
      const g = ctx.createLinearGradient(0, ly, 0, FLOOR_TOP); g.addColorStop(0, '#FFE890'); g.addColorStop(.4, '#FFB040'); g.addColorStop(1, '#E85A18');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 2, ly - 1); ctx.quadraticCurveTo(lx + 9, ly + 4, lx + 9, ly + 30); ctx.lineTo(lx + 9.5, FLOOR_TOP); ctx.lineTo(lx + 3.5, FLOOR_TOP); ctx.lineTo(lx + 4, ly + 30); ctx.quadraticCurveTo(lx + 3, ly + 9, lx - 2, ly + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,250,210,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx + 1, ly + 1); ctx.quadraticCurveTo(lx + 6.6, ly + 6, lx + 6.6, ly + 30); ctx.lineTo(lx + 6.8, FLOOR_TOP); ctx.stroke();
    }
    zskCrucible(x, y, s, tilt, cp);
  });
  for (const [x, lean] of [[cols[1] - 60, 1], [cols[3] + 46, 1.4], [cols[2] + 40, .8]]) awWrap(x, 60, (x) => { ctx.fillStyle = '#140C0C'; ctx.fillRect(x - 3, 176, 6, 12); ctx.fillStyle = '#8A5E30'; ctx.fillRect(x - 4, 175, 8, 2); zskSteam(x, 174, 64, lean); });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; // furnace light washing up the foot of the wall
  { const g = ctx.createLinearGradient(0, 180, 0, FLOOR_TOP); g.addColorStop(0, 'rgba(255,110,40,0)'); g.addColorStop(1, 'rgba(255,110,40,.22)'); ctx.fillStyle = g; ctx.fillRect(0, 180, AW_W, FLOOR_TOP - 180); }
  ctx.restore();
}

function zskFoundryFloor(rnd, th) {
  const T = FLOOR_TOP; zskGrates = [];
  { const g = ctx.createLinearGradient(0, T - 4, 0, VH); g.addColorStop(0, '#4A3230'); g.addColorStop(.4, '#2E2020'); g.addColorStop(1, '#140E0E'); ctx.fillStyle = g; ctx.fillRect(0, T - 14, AW_W, VH - T + 14); }
  // the kerb at the foot of the wall: riveted iron, bollards, ingots stacked against it
  ctx.fillStyle = '#1E1414'; ctx.fillRect(0, T - 14, AW_W, 15); ctx.fillStyle = '#5A3C34'; ctx.fillRect(0, T - 14, AW_W, 4); ctx.fillStyle = '#D08A62'; ctx.fillRect(0, T - 14, AW_W, .9);
  for (let x = 3; x < AW_W; x += 7) awRivet(x, T - 6, .7, '#C88262');
  for (let x = 80; x < AW_W; x += 160) { ctx.fillStyle = '#140C0C'; ctx.fillRect(x - 5, T - 24, 10, 12); ctx.fillStyle = '#4E3632'; ctx.fillRect(x - 5, T - 24, 3, 12); ctx.fillStyle = '#C8903E'; ell(x, T - 24, 6, 2); ctx.fill(); ctx.fillStyle = '#FFD08A'; ell(x - 1.5, T - 24.6, 2.6, .8); ctx.fill(); }
  for (let i = 0; i < 3; i++) awWR(200 + i * 427 + rnd() * 80, 24, rnd, (x, r) => {
    for (let k = 0; k < 6; k++) { const row = k < 3 ? 0 : k < 5 ? 1 : 2, ix = x + (k - [0, 3, 5][row]) * 11 + row * 5.5, iy = T - 15 - row * 5;
      ctx.fillStyle = '#5E3E1E'; awPath([ix - 5, iy, ix + 5, iy, ix + 4, iy - 5, ix - 4, iy - 5]); ctx.fill(); ctx.fillStyle = '#E8B05A'; awPath([ix - 4, iy - 5, ix + 4, iy - 5, ix + 3.4, iy - 3.6, ix - 3.4, iy - 3.6]); ctx.fill(); ctx.fillStyle = '#B07A36'; ctx.fillRect(ix - 4.5, iy - 3.6, 9, 3.6); }
  });
  // the slag channel along the back: crusted banks, a molten core, dark floes drifting
  const C0 = T + 2, C1 = T + 12;
  ctx.fillStyle = '#120A0A'; ctx.fillRect(0, C0, AW_W, C1 - C0);
  { const g = ctx.createLinearGradient(0, C0 + 1, 0, C1 - 1); g.addColorStop(0, '#C0401A'); g.addColorStop(.45, '#FFC050'); g.addColorStop(.6, '#FFE890'); g.addColorStop(1, '#D05420'); ctx.fillStyle = g; ctx.fillRect(0, C0 + 1.6, AW_W, C1 - C0 - 3); }
  for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, w = 3 + rnd() * 9, yy = C0 + 2.5 + rnd() * 5; awWrap(x, w, (x) => { ctx.fillStyle = rnd() < .5 ? 'rgba(70,24,12,.8)' : 'rgba(110,36,14,.6)'; ell(x, yy, w, .8 + rnd() * .8); ctx.fill(); ctx.fillStyle = 'rgba(255,220,140,.6)'; ctx.fillRect(x - w * .6, yy - 1, w * 1.2, .4); }); }
  for (let x = 0; x < AW_W; x += 4) awWrap(x, 6, (x) => { dab(x, C0 + .8, 1.8 + rnd() * 1.4, '#241414', 1); dab(x + 2, C1 - .8, 1.8 + rnd() * 1.4, '#1E1212', 1); });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; { const g = ctx.createLinearGradient(0, C1, 0, C1 + 30); g.addColorStop(0, 'rgba(255,120,40,.3)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, C1, AW_W, 30);
    const g2 = ctx.createLinearGradient(0, C0 - 26, 0, C0); g2.addColorStop(0, 'rgba(255,120,40,0)'); g2.addColorStop(1, 'rgba(255,120,40,.3)'); ctx.fillStyle = g2; ctx.fillRect(0, C0 - 26, AW_W, 26); }
  ctx.restore();
  // riveted deck plates, larger toward us, heat-tinted and scorched; the near ones fall into shadow
  let y = C1 + .5, h = 13, row = 0;
  while (y < VH) {
    ctx.fillStyle = '#0E0808'; ctx.fillRect(0, y, AW_W, h);
    const warm = Math.max(0, 1 - row * .22);
    for (const [x0, w] of awRow(rnd, h * 3.4, h * 6)) awWR(x0, w, rnd, (x, r) => {
      const base = ['#4A3836', '#433230', '#503C38', '#3E302E', '#48383A'][Math.floor(r() * 5)], col = awMix(base, '#1A1212', row * .08);
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, awMix(col, '#C0704A', .25 * warm)); g.addColorStop(1, col); ctx.fillStyle = g; ctx.fillRect(x + .7, y + .7, w - 1.4, h - 1.4);
      ctx.fillStyle = `rgba(255,170,110,${.12 + .2 * warm})`; ctx.fillRect(x + .9, y + .7, w - 1.8, .6);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + .7, y + h - 1.6, w - 1.4, .9);
      if (r() < .45) { // diamond tread: raised bars laid in alternating directions, catching the furnace light
        ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3.5, w - 6, h - 7); ctx.clip(); const st = 3 + h * .18, bl = st * .32;
        for (const [col, oy] of [['rgba(0,0,0,.35)', .5], [`rgba(255,170,120,${.16 + .2 * warm})`, 0]]) { ctx.strokeStyle = col; ctx.lineWidth = .7 + h * .03; ctx.beginPath();
          for (let ty = y + 4, j = 0; ty < y + h - 2; ty += st * .6, j++) for (let tx = x + 4 + (j % 2) * st * .5; tx < x + w - 2; tx += st) { const d = ((j + Math.floor((tx - x) / st)) % 2) ? 1 : -1; ctx.moveTo(tx - bl, ty + oy - d * bl * .4); ctx.lineTo(tx + bl, ty + oy + d * bl * .4); } ctx.stroke(); }
        ctx.restore();
      }
      if (r() < .45) { ctx.fillStyle = `rgba(${r() < .5 ? '120,100,170' : '90,120,160'},.13)`; ell(x + w * (.3 + r() * .4), y + h * .5, w * .3, h * .32); ctx.fill(); } // temper colours from the heat
      if (r() < .35) dab(x + w * r(), y + h * (.3 + r() * .4), h * .3, 'rgba(130,70,40,.3)', 1); // rust
      if (r() < .3) { ctx.strokeStyle = 'rgba(200,170,150,.18)'; ctx.lineWidth = .5; ctx.beginPath(); const sx = x + w * r(), sy = y + h * r(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 6 + r() * 10, sy + (r() - .5) * 2); ctx.stroke(); }
      const rs = .45 + h * .035;
      for (const rx of [x + 3.2, x + w - 3.2]) for (let ry = y + 3; ry < y + h - 2; ry += Math.max(4.5, h * .3)) awRivet(rx, ry, rs, '#B08070');
      if (r() < .07 && row > 0) { // a crack with melt showing through
        ctx.strokeStyle = '#FFA040'; ctx.lineWidth = 1; ctx.beginPath(); let cx = x + w * .2, cy = y + h * (.3 + r() * .4); ctx.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += w * .15; cy += (r() - .5) * h * .3; ctx.lineTo(cx, cy); } ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,180,.8)'; ctx.lineWidth = .4; ctx.stroke(); }
    });
    y += h; h += 4.4; row++;
    if (y < VH - 4) { // an iron strap riveted across the joint
      const sh2 = 2.6 + row * .5; ctx.fillStyle = '#1A1010'; ctx.fillRect(0, y - .6, AW_W, sh2 + 1); ctx.fillStyle = '#4E3632'; ctx.fillRect(0, y, AW_W, sh2 - .4); ctx.fillStyle = `rgba(255,170,110,${.2 + .3 * warm})`; ctx.fillRect(0, y, AW_W, .6);
      for (let x = 3; x < AW_W; x += 5 + row) awRivet(x, y + sh2 * .45, .45 + row * .1, '#C08A70');
      y += sh2 + .4;
    }
  }
  // grates over the melt pits, glowing from below
  for (let i = 0; i < 2; i++) { const gx = 120 + i * 640 + rnd() * 120, gy = T + 40 + rnd() * 10, gw = 96, gh = 30;
    awWrap(gx, gw, (gx) => {
      ctx.fillStyle = '#0A0606'; ctx.fillRect(gx - 3, gy - 3, gw + 6, gh + 6);
      const g = ctx.createRadialGradient(gx + gw / 2, gy + gh * .6, 4, gx + gw / 2, gy + gh * .5, gw * .6); g.addColorStop(0, '#FFC860'); g.addColorStop(.45, '#D85A1C'); g.addColorStop(1, '#3A0C06'); ctx.fillStyle = g; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = '#140C0C'; for (let bx = gx; bx < gx + gw; bx += 6) ctx.fillRect(bx, gy, 3, gh); for (let by = gy; by < gy + gh; by += 5) ctx.fillRect(gx, by, gw, 2.2);
      ctx.fillStyle = 'rgba(255,190,110,.55)'; for (let bx = gx; bx < gx + gw; bx += 6) ctx.fillRect(bx, gy, 2.4, .5);
      ctx.strokeStyle = '#3E2A28'; ctx.lineWidth = 3; ctx.strokeRect(gx - 1.5, gy - 1.5, gw + 3, gh + 3); ctx.strokeStyle = 'rgba(255,170,110,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(gx - 3, gy - 3); ctx.lineTo(gx + gw + 3, gy - 3); ctx.stroke();
      for (const [rx, ry] of [[gx - 1.5, gy - 1.5], [gx + gw + 1.5, gy - 1.5], [gx - 1.5, gy + gh + 1.5], [gx + gw + 1.5, gy + gh + 1.5]]) awRivet(rx, ry, 1.2, '#E0A070');
    });
    zskGrates.push([gx, gy, gw, gh]);
  }
  // lumps of cooled slag along the back
  for (let i = 0; i < 9; i++) awWR(rnd() * AW_W, 12, rnd, (x, r) => { const w = 4 + r() * 6, yy = T + 15 + r() * 6; awFillPts([x - w, yy, x - w * .6, yy - w * .6, x + w * .3, yy - w * .7, x + w, yy], '#1E1414'); awFillPts([x - w * .6, yy - w * .6, x + w * .3, yy - w * .7, x + w * .1, yy - w * .3], '#8A4A30', .8); dab(x, yy - 1, 1.2, '#FFA040', .9); });
  const sh = ctx.createLinearGradient(0, VH - 40, 0, VH); sh.addColorStop(0, 'rgba(10,4,4,0)'); sh.addColorStop(1, 'rgba(10,4,4,.55)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 40, AW_W, 40);
}

// ======================================================================================================
// themes and registration
// ======================================================================================================
THEMES.sky2 = {
  sky: ['#26305E', '#7A5C8E', '#E68C68', '#FCCF8E'], sun: [0.74, 0.43, '255,214,150'], haze: '238,176,146',
  floorA: '#9A7656', floorB: '#5A3E2C', path: '#C9A060',
  grade: { desat: .2, top: 'rgba(70,70,160,.4)', bot: 'rgba(240,160,90,.42)', vig: 'rgba(40,20,40,.5)' },
  liveSky(camX, t) {
    const th = THEMES.sky2, sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
    ctx.fillStyle = 'rgba(255,244,214,.85)'; circle(sx, sy, 14); ctx.fill(); // the sun, settling into the cloud sea
    for (let i = 0; i < 5; i++) { // high mare's-tails streaming past
      const x = ((i * 337 - camX * .07 - t * 9) % 1600 + 1600) % 1600 - 260, y = Y_OFF + 10 + (i * 31) % 64;
      awSoft(x, y, 120, 9, '255,222,200', .22); awSoft(x + 60, y + 5, 70, 5, '255,236,220', .2);
    }
    if (zskSea[0]) zskBlit(zskSea[0], 172, camX * .2 + t * 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; awSoft(sx, 196, 170, 16, '255,196,130', .32); ctx.restore(); // the sun's road across the cloud tops
    if (zskSea[1]) zskBlit(zskSea[1], 184, camX * .34 + t * 18);
  },
};
THEMES.skyBoss = {
  sky: ['#1E1016', '#4E2024', '#A8442A', '#E88A40'], sun: [0.4, 0.3, '255,150,80'], haze: '170,80,60',
  floorA: '#4A3A38', floorB: '#1E1616', path: '#F08A30',
  grade: { desat: .16, top: 'rgba(90,40,70,.45)', bot: 'rgba(240,120,50,.42)', vig: 'rgba(20,6,6,.62)' },
  liveSky(camX, t) {
    for (let i = 0; i < 6; i++) { // banks of smoke rolling slowly over the foundry
      const x = ((i * 271 + t * 5 - camX * .05) % 1600 + 1600) % 1600 - 260, y = Y_OFF + 14 + (i * 37) % 70;
      awSoft(x, y, 130, 36, '46,22,24', .4); awSoft(x + 30, y + 18, 100, 16, '210,96,52', .12);
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { // embers carried up on the heat
      const ph = (t * .05 + zskHsh(i + 3)) % 1, x = ((zskHsh(i) * 1400 - camX * .25 + Math.sin(t * .4 + i) * 8 + ph * 40) % 1400 + 1400) % 1400 - 60, y = FLOOR_TOP - 40 - ph * 170;
      ctx.fillStyle = `rgba(255,${170 + (i % 3) * 25},90,${Math.sin(ph * Math.PI) * .7})`; circle(x, y, .9 + (i % 3) * .3); ctx.fill();
    }
    ctx.restore();
  },
  liveFloor(camX, t) { // the slag channel and the pits breathe slowly; embers lift off the melt
    const T = FLOOR_TOP, x0 = ((camX % AW_W) + AW_W) % AW_W;
    ctx.fillStyle = `rgba(255,140,50,${.1 + .06 * Math.sin(t * 1.1)})`; ctx.fillRect(0, T + 3, VW, 8);
    for (const [gx, gy, gw, gh] of zskGrates) for (const tile of [0, AW_W]) { const sx = gx + tile - x0; if (sx > VW || sx + gw < 0) continue;
      ctx.fillStyle = `rgba(255,120,40,${.1 + .06 * Math.sin(t * .9 + gx)})`; ctx.fillRect(sx, gy, gw, gh); }
    for (let i = 0; i < 14; i++) {
      const ph = (t * .12 + zskHsh(i + 9)) % 1, wx = (i * 91.4 + zskHsh(i) * 60), sx = ((wx - x0) % AW_W + AW_W) % AW_W; if (sx > VW + 10) continue;
      const y = T + 7 - ph * 64, x = sx + Math.sin(t * .7 + i * 1.7) * 4 + ph * 12;
      ctx.fillStyle = `rgba(255,${180 + (i % 3) * 20},90,${Math.sin(ph * Math.PI) * .75})`; circle(x, y, 1 + (i % 2) * .4); ctx.fill();
    }
  },
};
AW_FAR.sky2 = zskDeckFar; AW_MID.sky2 = zskDeckMid; AW_FLOOR.sky2 = zskDeckFloor;
AW_FAR.skyBoss = zskFoundryFar; AW_MID.skyBoss = zskFoundryMid; AW_FLOOR.skyBoss = zskFoundryFloor;
