'use strict';
// ======================================================================================================
// THE TRUMPS: the choice of road, on the Rim of the Abyss, after the dream
// ======================================================================================================
// The dream's ending (endings.js, W6E) leaves Corwin standing on the Rim with his deck of Trumps out of his doublet, and
// hands over to this. The view closes in on his hands: he cuts the deck and riffles it, squares it, turns it face up and
// thumbs through it, the family going by in their silver-leaf frames (Benedict, Random, Fiona, Bleys, Brand, Gérard,
// Deirdre, Eric, Caine, Julian, Flora, Llewella), turns it down again, and deals three cards out into the air, which turn
// face up: the three roads from the Rim. The player picks one; the card comes alive, he walks into it, it opens out to
// fill the view, and the road goes on there (the forge first, as between any two worlds).
//
// Controls: left / right (arrow keys, A / D, a swipe, the chevrons, a gamepad's stick or d-pad) move between the cards;
// Enter, Space or J (or gamepad A) steps through the one held up; on a touchscreen a tap holds a card up, and a second tap
// on the card held up steps through it. While the deck is being shuffled any of those skips straight to the three cards
// dealt; the cards take a moment to settle before one can be picked, so a skip never picks by accident.
//
// ---------------------------------------- how a world plugs in ----------------------------------------
// 1. Its STAGES entry is pushed at index 6 (Rebma, data_w7.js) or 7 (Lorraine, data_w8.js). A card whose STAGES entry is
//    missing shows as "the way is not open yet" and cannot be picked.
// 2. It registers its Trump at load time:
//      (window.BRANCHES = window.BRANCHES || []).push({
//        stage: 6, id: 'rebma', name: 'REBMA',
//        line: 'one sentence: why Corwin would go there now',          // shown under the card when it is held up
//        draw(ctx, w, h, t) {...},                                      // the picture, painted into w x h at the origin
//        relic: { key: 'w7relic', name: '...', desc: '...' },           // save[key] is true once won
//        // optional:
//        go: 'the line of narration as he steps through it',
//        focus: .5,                                                     // where the world's own picture is centred as the card opens out (0..1 of the view's width)
//        win: { kicker, title, text },                                  // the win card's words (ui.js winCard), unless the world writes its own
//        onCycle(save) {...},                                           // a new cycle begins (#cycleBtn) and the relic is won: equip it
//      });
//    Until it does, a painted stand-in card (below) is used, which still cannot be picked while the world is missing.
// 3. Its ending: wrap stageClear from the world's own late file, the art_w5.js way:
//      const _sc = stageClear; stageClear = function () { if (stageIdx === 6 && !mine) { startMyEnding(_sc); return; } return _sc(); };
//    and when the ending is over call that _sc(). It goes on through ui.js stageClear, which, for any world past the fork
//    (stages 5, 6, 7), records save.endings[id] = true (id from the registry), sets save.done, keeps save.stage on that
//    world, writes the win card (winCard: the card's `win` words or a plain one naming the relic) and shows it with its
//    New Game+ button. A world that wants its own words on the win card writes them after _sc() returns (as art_w5.js
//    does) or gives `win` in its card. The relic itself (save[relic.key] = true; persist()) is the world's to give,
//    when its boss falls.
// 4. New Game+ (#cycleBtn in ui.js) clears save.branch, so the deck comes out again on the Rim, and calls BRANCH.newCycle(),
//    which calls each won relic's card.onCycle(save).
//
// The road itself (ui.js): save.branch is the stage picked here; clearing stage 4 goes on to it; stages 5-7 are each the
// last. save.atChoice is set while the deck is out, so a game left on the Rim comes back to it (Continue).
// Tir-na Nog'th's own ending (art_w5.js) only starts by itself while it is the last entry of STAGES; once the other worlds
// are in, it is started from here (the stageClear wrapper below), and plays exactly as before.
(() => {
  const KIT = window.ENDINGS && ENDINGS.kit; if (!KIT) { console.error('branch.js: endings.js kit missing'); return; }
  const { buildAlt, dropAlt, withSet, paintWorld, inkHero, poseAs, trumpPose, deckInHand, mask, sm, cl01, hsh } = KIT;
  const BR = window.BRANCHES = window.BRANCHES || [];
  const ROADS = [6, 5, 7]; // left to right: the sea, the moon, the Black Circle
  const view = () => ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  const ease = (k) => { k = cl01(k); return 1 - Math.pow(1 - k, 3); };
  const FW = 62, FH = 100; // a Trump's face, in its own units (the frame is outside this)

  // ---------------- the silver-leaf frame every Trump is set in ----------------
  function frame(x, y, w, h, label, o = {}) {
    const b = Math.max(1.6, w * .07);
    ctx.beginPath(); ctx.rect(x - b, y - b, w + b * 2, h + b * 2); ctx.rect(x, y, w, h);
    const fg = ctx.createLinearGradient(x, y, x + w, y + h); fg.addColorStop(0, '#F4F7FC'); fg.addColorStop(.5, '#8E9AB4'); fg.addColorStop(1, '#DCE4F0'); ctx.fillStyle = fg; ctx.fill('evenodd');
    ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(.6, w * .012); ctx.strokeRect(x - b, y - b, w + b * 2, h + b * 2); ctx.strokeRect(x, y, w, h);
    if (w > 30) { ctx.fillStyle = 'rgba(40,48,80,.55)'; const n = Math.round(w / 4.2); for (let i = 0; i <= n; i++) { const q = i / n; circle(x - b / 2 + q * (w + b), y - b / 2, b * .16); ctx.fill(); circle(x - b / 2 + q * (w + b), y + h + b / 2, b * .16); ctx.fill(); }
      for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) silverRose(x + w / 2 + px * (w / 2 + b / 2), y + h / 2 + py * (h / 2 + b / 2), b * .3, false); }
    if (label && h > 40) { const ph = Math.max(7, h * .1), fs = Math.max(4.5, h * .052);
      ctx.fillStyle = 'rgba(8,12,30,.85)'; rrect(x + w * .08, y + h - ph - h * .03, w * .84, ph, Math.min(3, ph * .3)); ctx.fill();
      ctx.fillStyle = '#E8EEF8'; ctx.font = `700 ${fs.toFixed(1)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let s = label; while (ctx.measureText(s).width > w * .8 && s.length > 3) s = s.slice(0, -1); ctx.fillText(s, x + w / 2, y + h - ph / 2 - h * .03); ctx.textBaseline = 'alphabetic'; }
  }
  // paint something into its own canvas, at the scale it will be shown at, and give it the brushwork of a panel painting
  function bake(w, h, s, fn, painted = true) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w * s); c.height = Math.ceil(h * s);
    const g = c.getContext('2d'), old = ctx, fl = FLASH, ti = TINT; g.scale(s, s); ctx = g; FLASH = false; TINT = null;
    try { fn(); } finally { ctx = old; FLASH = fl; TINT = ti; }
    if (painted) try { paintCard(c, s); } catch (e) {}
    return c;
  }

  // ---------------- the family, as painted on their Trumps ----------------
  // Painted as oil portraits: lit by a warm key light from the upper right, the shadows cool, the forms built up in soft
  // glazes. Each one: their colours, device (em), place and dress; the head: sz (its size), fw (width of the face),
  // jaw (0 round .. 1 square), chin (its length), cheek (how strong the cheekbones), gaunt, lines (age and weather),
  // yaw (the head turned: + toward the light, - away from it), tilt; the eyes: eye (colour), eh (how open), lid (heavy
  // lids); the brows: brow (weight), arch, slant (+ sly or angry at the inner end); the nose: nlen, nw (width), hook;
  // the mouth: mw (width), lip (fullness), set (+ smiling, - stern), smirk, teeth; the hair: hstyle, hl (where the
  // hairline is), vol (how it stands off the head), len, wave, grey; beard and blen; rosy; freckles; neck and sh (the
  // build of neck and shoulders)
  const FAMILY = [
    { name: 'BENEDICT', skin: '#C4937A', hair: '#3A2A22', eye: '#6E7A5E', robe: '#6A4426', trim: '#C09A58', bg: ['#F2C67E', '#6E3A18'], em: 'sword', place: 'avalon', dress: 'leather',
      sz: 1, fw: .88, jaw: .72, chin: 1.06, cheek: 1, gaunt: .9, lines: 1, yaw: -.16, tilt: .015, eh: .78, lid: .55, brow: 1.05, arch: .1, nlen: 1.1, nw: .86, hook: .35, mw: .92, lip: .35, set: -.35,
      hstyle: 'crop', hl: .13, recede: .05, vol: .2, grey: .12, rosy: .5, neck: .95, sh: .95 },
    { name: 'RANDOM', skin: '#E0B696', hair: '#B48A52', eye: '#5E8EAE', robe: '#6A3C24', trim: '#D8AA55', bg: ['#3C3666', '#120C1E'], em: 'drum', place: 'street', dress: 'vest',
      sz: .97, fw: .97, jaw: .32, chin: .96, cheek: .35, yaw: .17, tilt: .06, eh: 1, lid: .1, brow: .8, arch: .3, nlen: .9, nw: .95, mw: 1.08, lip: .75, set: 1, teeth: 1,
      hstyle: 'shaggy', hl: .17, vol: .9, rosy: 1, freckles: .5, neck: .9, sh: .92 },
    { name: 'FIONA', skin: '#ECD2C0', hair: '#B8402A', eye: '#3E9A5E', robe: '#2C6640', trim: '#D8C080', bg: ['#26345E', '#080C22'], em: 'star', place: 'stars', dress: 'gownHigh', fem: 1,
      sz: .91, fw: .85, jaw: .04, chin: .96, cheek: .65, yaw: .2, tilt: -.05, eh: 1.02, lid: .25, brow: .6, arch: 1, nlen: .88, nw: .76, mw: .84, lip: .95, set: .12,
      hstyle: 'long', hl: .17, vol: .5, len: 1.05, wave: .25, rosy: .9, freckles: .35 },
    { name: 'BLEYS', skin: '#E2BC9E', hair: '#C4542A', eye: '#6A8EB0', robe: '#A82C28', trim: '#E8B040', bg: ['#F4A858', '#6E2416'], em: 'flame', place: 'battle', dress: 'doublet',
      sz: 1, fw: 1, jaw: .55, chin: 1.02, cheek: .55, yaw: .12, tilt: -.04, eh: .98, lid: .15, brow: 1, arch: .5, nlen: 1, nw: 1, hook: .1, mw: 1.04, lip: .7, set: .55,
      hstyle: 'swept', hl: .15, vol: 1.5, len: .32, wave: 1, beard: 'full', blen: .5, circ: '#E8C060', rosy: 1 },
    { name: 'BRAND', skin: '#E2CAB6', hair: '#A63824', eye: '#B6DCD4', robe: '#284E2C', trim: '#A8C070', bg: ['#6E8E5E', '#101A10'], em: 'tower', place: 'tower', dress: 'chain',
      sz: .99, fw: .82, jaw: .45, chin: 1.1, cheek: 1, gaunt: 1, lines: .35, yaw: -.22, tilt: 0, eh: 1.08, lid: 0, brow: 1.05, arch: .2, slant: .9, nlen: 1.1, nw: .8, hook: .8, mw: .88, lip: .35, set: -.25,
      hstyle: 'swept', hl: .15, vol: .45, len: .45, wave: .3, beard: 'short', blen: .1, rosy: .35, neck: .9, sh: .92 },
    { name: 'GÉRARD', skin: '#CA9A76', hair: '#5C3C24', eye: '#5E7E9C', robe: '#3A5A88', trim: '#B8B8C0', bg: ['#B0CCE2', '#26385A'], em: 'anchor', place: 'sea', dress: 'mail',
      sz: 1.07, fw: 1.14, jaw: 1, chin: 1, cheek: .4, yaw: .06, tilt: 0, eh: .85, lid: .35, brow: 1.3, arch: .1, nlen: 1.02, nw: 1.3, hook: .1, mw: 1.08, lip: .75, set: 0,
      hstyle: 'crop', hl: .15, vol: .5, beard: 'full', blen: 1, rosy: 1.1, neck: 1.45, sh: 1.25 },
    { name: 'DEIRDRE', skin: '#EAD4C6', hair: '#16121A', eye: '#4C6CAA', robe: '#22223E', trim: '#C0C8D8', bg: ['#4C5678', '#101426'], em: 'rose', place: 'roses', dress: 'gownNeck', fem: 1,
      sz: .93, fw: .85, jaw: .04, chin: .97, cheek: .75, yaw: .22, tilt: -.06, eh: 1.06, lid: .3, brow: .7, arch: 1, nlen: .92, nw: .76, mw: .88, lip: 1.1, set: .18,
      hstyle: 'longWavy', hl: .17, vol: .8, len: 1.25, wave: 1, rosy: .7 },
    { name: 'ERIC', skin: '#DCBCA0', hair: '#18141A', eye: '#3E5E8E', robe: '#861A22', trim: '#E0B850', bg: ['#C4503E', '#280C10'], em: 'crown', place: 'throne', dress: 'royal',
      sz: 1, fw: .98, jaw: .8, chin: 1.04, cheek: .6, yaw: 0, tilt: 0, eh: .86, lid: .4, brow: 1.3, slant: .35, nlen: 1.04, nw: .98, hook: .25, mw: 1, lip: .6, set: -.6,
      hstyle: 'swept', hl: .15, vol: .7, len: .22, wave: .4, beard: 'full', blen: .62, crown: 1, rosy: .6 },
    { name: 'CAINE', skin: '#CEAC8C', hair: '#1A1418', eye: '#4A7E5A', robe: '#163A2C', trim: '#B8C4C0', bg: ['#2E5C5C', '#06121A'], em: 'dagger', place: 'fleet', dress: 'highCollar',
      sz: .99, fw: .9, jaw: .5, chin: 1.08, cheek: .75, yaw: -.3, tilt: .05, eh: .74, lid: .6, brow: 1, arch: .5, slant: 1, nlen: 1.06, nw: .9, hook: .7, mw: .94, lip: .5, set: .15, smirk: 1,
      hstyle: 'slick', hl: .15, vol: .3, beard: 'goatee', blen: .6, rosy: .5 },
    { name: 'JULIAN', skin: '#E2CCB8', hair: '#141018', eye: '#3C6E4E', robe: '#E4E2DA', trim: '#3A6A4A', bg: ['#9CBA9C', '#1A2C1C'], em: 'horn', place: 'arden', dress: 'scale',
      sz: 1, fw: .88, jaw: .45, chin: 1.07, cheek: .85, gaunt: .3, yaw: .16, tilt: 0, eh: .84, lid: .5, brow: .9, slant: .2, nlen: 1.06, nw: .84, hook: .2, mw: .9, lip: .45, set: -.15,
      hstyle: 'shoulder', hl: .15, vol: .45, len: .45, wave: .1, rosy: .35 },
    { name: 'FLORA', skin: '#F0D8C4', hair: '#DEB25A', eye: '#4C7EBA', robe: '#5A8A4A', trim: '#F0E0A0', bg: ['#F4E4AA', '#788A48'], em: 'flower', place: 'meadow', dress: 'gownLow', fem: 1,
      sz: .94, fw: .87, jaw: .06, chin: .95, cheek: .5, yaw: .1, tilt: .04, eh: 1.05, lid: .2, brow: .62, arch: 1, nlen: .88, nw: .76, mw: .88, lip: 1.05, set: .5,
      hstyle: 'curls', hl: .17, vol: 1.2, len: .7, rosy: 1.1 },
    { name: 'LLEWELLA', skin: '#C8D8C4', hair: '#2A7A62', eye: '#2A9C8C', robe: '#1C5A6A', trim: '#B0E0D8', bg: ['#4C9EAA', '#08263A'], em: 'wave', place: 'rebma', dress: 'pearls', fem: 1,
      sz: .93, fw: .86, jaw: .1, chin: .98, cheek: .7, yaw: -.14, tilt: .03, eh: 1.04, lid: .3, brow: .62, arch: .8, nlen: .92, nw: .8, mw: .88, lip: 1, set: .08,
      hstyle: 'longWavy', hl: .17, vol: .6, len: 1.25, wave: .8, rosy: .5, sea: 1 },
  ];
  function emblem(kind, x, y, s, col) { // their device, small, in the corner of the field, in gold leaf
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (col === 'leaf') { const g = ctx.createLinearGradient(-8, -9, 7, 9); g.addColorStop(0, '#FFF2B8'); g.addColorStop(.35, '#E2B850'); g.addColorStop(.6, '#9A6A1E'); g.addColorStop(.8, '#E8C468'); g.addColorStop(1, '#8A5A18'); col = g;
      ctx.shadowColor = 'rgba(30,14,0,.6)'; ctx.shadowBlur = .9 * s * PS; ctx.shadowOffsetX = -.25 * s * PS; ctx.shadowOffsetY = .35 * s * PS; }
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    if (kind === 'sword') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(1.4, -7); ctx.lineTo(1.2, 5); ctx.lineTo(-1.2, 5); ctx.lineTo(-1.4, -7); ctx.closePath(); ctx.fill(); ctx.fillRect(-4.5, 5, 9, 1.6); ctx.fillRect(-.8, 6.6, 1.6, 3.4); }
    else if (kind === 'drum') { ell(0, -2, 6, 2.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6, 4); ctx.quadraticCurveTo(0, 7, 6, 4); ctx.lineTo(6, -2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(1, -2.6); ctx.moveTo(4, -8); ctx.lineTo(2, -3); ctx.stroke(); }
    else if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, r = i % 2 ? 2.6 : 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
    else if (kind === 'flame') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(6, -2, 4, 4); ctx.quadraticCurveTo(2, 8, 0, 8); ctx.quadraticCurveTo(-5, 7, -4.5, 2); ctx.quadraticCurveTo(-4, -2, -1, -3); ctx.quadraticCurveTo(-1.5, -6, 0, -9); ctx.fill(); }
    else if (kind === 'tower') { ctx.fillRect(-3.5, -4, 7, 13); for (const dx of [-3.5, -.8, 1.9]) ctx.fillRect(dx, -6.5, 1.6, 2.6); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(40,20,0,.55)'; ctx.fillRect(-.8, 0, 1.6, 2.6); }
    else if (kind === 'anchor') { ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-3.5, -4); ctx.lineTo(3.5, -4); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-5, 7.5, 0, 7.5); ctx.quadraticCurveTo(5, 7.5, 6, 2); ctx.stroke(); circle(0, -8.4, 1.6); ctx.stroke(); }
    else if (kind === 'rose') { ctx.restore(); silverRose(x, y, s * 2.2, true, '#C8CED8'); return; }
    else if (kind === 'crown') { ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-7, -3); ctx.lineTo(-3.5, 1); ctx.lineTo(0, -5); ctx.lineTo(3.5, 1); ctx.lineTo(7, -3); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill(); }
    else if (kind === 'dagger') { ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(1.6, 2); ctx.lineTo(-1.6, 2); ctx.closePath(); ctx.fill(); ctx.fillRect(-3.5, 2, 7, 1.4); ctx.fillRect(-.7, 3.4, 1.4, 3.6); }
    else if (kind === 'horn') { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.quadraticCurveTo(-4, 6, 6, 3); ctx.stroke(); ell(6.4, 2.6, 1.6, 3, -.4); ctx.fill(); }
    else if (kind === 'flower') { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 2.8, 1.8, a); ctx.fill(); } ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(60,30,0,.45)'; circle(0, 0, 1.6); ctx.fill(); }
    else if (kind === 'wave') { ctx.lineWidth = 1.4; for (const dy of [-3, 1.5, 6]) { ctx.beginPath(); ctx.moveTo(-7, dy); ctx.quadraticCurveTo(-3.5, dy - 3.5, 0, dy); ctx.quadraticCurveTo(3.5, dy + 3.5, 7, dy); ctx.stroke(); } }
    ctx.restore();
  }

  // ---------------- the means of painting them: scratch layers, soft glazes, colour ----------------
  // Everything is painted in card units; PS is canvas pixels per unit and PT the card's own transform while one is painted.
  // A glaze is painted sharp on a scratch layer and laid onto another through a blur, so its edges melt into the paint.
  // While REG is set (a box of the card, in pixels), the scratch layers are only that box, so the work on the face or the
  // hair is done on a small canvas rather than the whole card.
  const LAY = {};
  let PS = 1, PT = null, REG = null;
  function layer(name) { // a scratch canvas the size of the one being painted (or of REG), cleared
    const W = REG ? REG[2] : ctx.canvas.width, H = REG ? REG[3] : ctx.canvas.height; let c = LAY[name];
    if (!c || c.width !== W || c.height !== H) { c = LAY[name] = document.createElement('canvas'); c.width = W; c.height = H; }
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, W, H); return g;
  }
  const into = (g, fn, T) => { const old = ctx; ctx = g; g.setTransform(REG ? new DOMMatrix([1, 0, 0, 1, -REG[0], -REG[1]]).multiply(T || PT) : (T || PT)); try { fn(); } finally { ctx = old; } return g; };
  const regionOf = (x, y, w, h) => { const W = ctx.canvas.width, H = ctx.canvas.height, x0 = clamp(Math.floor(PT.a * x + PT.e), 0, W - 1), y0 = clamp(Math.floor(PT.d * y + PT.f), 0, H - 1); return [x0, y0, Math.max(1, Math.min(W - x0, Math.ceil(PT.a * w) + 1)), Math.max(1, Math.min(H - y0, Math.ceil(PT.d * h) + 1))]; };
  function inRegion(box, fn) { const old = REG; REG = box; try { return fn(); } finally { REG = old; } }
  function lay(dst, src, box, r = 0, a = 1) { // a layer painted in a region, laid onto the whole card
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = a; if (r > 0) dst.filter = `blur(${(r * PS).toFixed(2)}px)`; dst.drawImage(src.canvas, box[0], box[1]); dst.restore(); }
  function blurTo(dst, src, r, op = 'source-over', a = 1, box) { // lay one layer onto another, softened by r card units (only within box, in pixels, if given)
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = op; dst.globalAlpha = a;
    if (r > 0) dst.filter = `blur(${(r * PS).toFixed(2)}px)`;
    if (box && !REG) dst.drawImage(src.canvas, box[0], box[1], box[2], box[3], box[0], box[1], box[2], box[3]); else dst.drawImage(src.canvas, 0, 0); dst.restore();
  }
  const pxBox = (x, y, w, h) => { const W = ctx.canvas.width, H = ctx.canvas.height, x0 = clamp(Math.floor(PT.a * x + PT.e), 0, W - 1), y0 = clamp(Math.floor(PT.d * y + PT.f), 0, H - 1); return [x0, y0, Math.max(1, Math.min(W - x0, Math.ceil(PT.a * w))), Math.max(1, Math.min(H - y0, Math.ceil(PT.d * h)))]; };
  function layerAt(name, q) { // a scratch canvas at a fraction q of the size of the one being painted, cleared
    const W = Math.max(1, Math.ceil((REG ? REG[2] : ctx.canvas.width) * q)), H = Math.max(1, Math.ceil((REG ? REG[3] : ctx.canvas.height) * q)); let c = LAY[name];
    if (!c || c.width !== W || c.height !== H) { c = LAY[name] = document.createElement('canvas'); c.width = W; c.height = H; }
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, W, H); return g;
  }
  function glaze(dst, r, op, fn, T, a = 1, box) {
    if (r * PS < 7) return blurTo(dst, into(layer('pass'), fn, T), r, op, a, box);
    // a broad glaze is painted and softened at a half or a quarter of the size, which looks the same and costs far less
    const q = r * PS >= 16 ? .25 : .5, M = T || PT, g = layerAt('lo' + q, q); const M2 = REG ? new DOMMatrix([1, 0, 0, 1, -REG[0], -REG[1]]).multiply(M) : M, R0 = REG; REG = null; try { into(g, fn, new DOMMatrix([M2.a * q, M2.b * q, M2.c * q, M2.d * q, M2.e * q, M2.f * q])); } finally { REG = R0; }
    const g2 = layerAt('lo2' + q, q); g2.filter = `blur(${(r * PS * q).toFixed(2)}px)`; g2.drawImage(g.canvas, 0, 0); g2.filter = 'none';
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = op; dst.globalAlpha = a; dst.imageSmoothingQuality = 'high'; dst.drawImage(g2.canvas, 0, 0, g2.canvas.width / q, g2.canvas.height / q); dst.restore();
  }
  const hexRGB = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => clamp(Math.round(v + (B[i] - v) * t), 0, 255).toString(16).padStart(2, '0')).join(''); };
  const rgba = (c, a) => { const A = hexRGB(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
  const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const seedOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  function curve(P, closed) { // a smooth path through the points (Catmull-Rom, as Béziers)
    const n = P.length, g = (i) => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
    ctx.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
    if (closed) ctx.closePath();
  }
  function spline(P, m) { // m + 1 points along a Catmull-Rom through P, each with its unit normal
    const n = P.length - 1, out = [];
    for (let k = 0; k <= m; k++) { const f = k / m * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)], t2 = t * t, t3 = t2 * t;
      const q = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1]), 0, 0]); }
    for (let k = 0; k <= m; k++) { const a = out[Math.max(0, k - 1)], b = out[Math.min(m, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; out[k][2] = -dy / l; out[k][3] = dx / l; }
    return out;
  }
  // hair and beards: each lock a spine (p) with its width at root and tip (w), a wave (amp, fq, ph: coherent locks wave
  // all together, as a curl or a wave does), and n strands. The locks are laid in first as one soft mass, shaded toward
  // the light, then the strands are drawn over it one by one, each a little lighter or darker, catching the light where
  // the hair turns to it.
  function hairLocks(locks, col, T, o) {
    const r = o.r, main = ctx, pal = [];
    for (let i = 0; i <= 12; i++) { const k = i / 6 - 1; pal.push(k < 0 ? mix(col, o.dark || '#080406', -k * .8) : mix(col, o.hiCol || '#FFF0D6', k * (o.hi || .6))); }
    if (!locks.length) return;
    for (const L of locks) L.S = spline(L.p, Math.min(20, L.m || 14));
    const wave = (L, v, ph) => (L.amp || 0) * Math.sin(v * (L.fq || 0) + ph);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const L of locks) { const wm = Math.max(L.w[0], L.w[1]) + (L.amp || 0) * 2 + 2; for (const p of L.S) { const q = T.transformPoint(new DOMPoint(p[0], p[1])); x0 = Math.min(x0, (q.x - PT.e) / PT.a - wm); y0 = Math.min(y0, (q.y - PT.f) / PT.d - wm); x1 = Math.max(x1, (q.x - PT.e) / PT.a + wm); y1 = Math.max(y1, (q.y - PT.f) / PT.d + wm); } }
    const HBX = regionOf(x0, y0, x1 - x0, y1 - y0), R0 = REG; REG = HBX;
    const M = into(layer('hair'), () => {
      ctx.fillStyle = pal[o.base ?? 3];
      for (const L of locks) { const S = L.S, n = S.length - 1, side = (sg) => { for (let k = sg > 0 ? 0 : n; sg > 0 ? k <= n : k >= 0; k += sg) { const v = k / n, wd = (L.w[0] + (L.w[1] - L.w[0]) * v) * .5 * (o.mass ?? .85) * sg, d = wave(L, v, L.ph || 0) + wd; ctx.lineTo(S[k][0] + S[k][2] * d, S[k][1] + S[k][3] * d); } };
        ctx.beginPath(); side(1); side(-1); ctx.closePath(); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-atop'; const g = ctx.createLinearGradient(o.lx[0], o.lx[1], o.lx[2], o.lx[3]);
      g.addColorStop(0, 'rgba(255,236,200,.16)'); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,4,10,.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
      const rg = ctx.createRadialGradient(o.lx[4], o.lx[5], o.lx[6] * .3, o.lx[4], o.lx[5], o.lx[6] * 2.4); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(.5, 'rgba(0,0,0,.12)'); rg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, 200, 200);
    }, T);
    if (o.erase) glaze(M, o.erase[0], 'destination-out', o.erase[1], T);
    REG = R0; lay(main, M, HBX, o.soft ?? .35, o.massA ?? 1);
    main.save(); main.setTransform(T); main.lineCap = 'round'; main.lineJoin = 'round';
    for (const L of locks) { const S = L.S, n = S.length - 1, ns = Math.round((L.n || 16) * (o.dens || 1) * .75), LS = S.map(p => o.light(p[0], p[1], p[3], -p[2])); // (the light is reckoned along the lock's spine, once)
      for (let j = 0; j < ns; j++) {
        const off = clamp((r() + r() - 1) * .62 + (r() - .5) * .35, -.48, .48), ph = L.coh === false ? r() * TAU : (L.ph || 0) + (r() - .5) * .5, v0 = r() * (L.v0 ?? .1), v1 = 1 - r() * (L.v1 ?? .25), wid = (.08 + r() * .15) * (o.lw || 1);
        const base = (r() - .5) * (o.vary ?? .45) + (L.tone || 0), jit = (r() - .5) * .5, k0 = Math.floor(v0 * n), k1 = Math.max(k0 + 1, Math.ceil(v1 * n)), seg = [];
        for (let k = k0; k <= k1; k++) { const v = k / n, wd = (L.w[0] + (L.w[1] - L.w[0]) * v) * .5, d = wave(L, v, ph) + off * 2 * wd + jit * wd * .3 * Math.sin(v * 7 + j);
          seg.push([S[k][0] + S[k][2] * d, S[k][1] + S[k][3] * d, k]); }
        main.lineWidth = wid; main.globalAlpha = (.28 + r() * .55) * (o.alpha || 1);
        const s0 = seg[0], s1 = seg[seg.length - 1], sg = main.createLinearGradient(s0[0], s0[1], s1[0], s1[1]), nq = seg.length - 1;
        for (let q = 0; q <= 2; q++) { const k = seg[Math.round(q / 2 * nq)][2], sh = L.amp && L.fq ? Math.cos(k / n * L.fq + ph) * (L.shine ?? .5) * Math.sign(L.amp) : 0, c = pal[clamp(Math.round((base + LS[k] + sh + 1) * 6), 0, 12)]; sg.addColorStop(q / 2, L.fade && q < 1 && k0 < 2 ? rgba(c, 0) : c); }
        main.strokeStyle = sg; main.beginPath(); main.moveTo(s0[0], s0[1]); for (let k = 1; k <= nq; k++) main.lineTo(seg[k][0], seg[k][1]); main.stroke();
      } }
    main.restore();
  }

  // the place each one is painted in, behind them, seen as if past the sitter: hazed with distance, and a little out of focus
  function trumpPlace(F, w, h) {
    const hz = h * .6, P = F.place, r = rng(seedOf(F.name + 'place'));
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, shade(F.bg[0], -.12)); g.addColorStop(.45, F.bg[0]); g.addColorStop(.62, mix(F.bg[0], F.bg[1], .35)); g.addColorStop(1, F.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const soft = (b, fn) => { const g = into(layer('soft'), fn); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${(b * PS).toFixed(2)}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore(); }; // (drawn apart and softened once)
    const glow = (x, y, rr, rgb, a) => { const gg = ctx.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, `rgba(${rgb},${a})`); gg.addColorStop(.4, `rgba(${rgb},${a * .45})`); gg.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = gg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
    const hills = (y, amp, col, ph, n = 3, col2) => { const gg = ctx.createLinearGradient(0, y - amp, 0, h); gg.addColorStop(0, col); gg.addColorStop(1, col2 || shade(col, -.35)); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, y);
      for (let x = 0; x <= w; x += 1.5) ctx.lineTo(x, y - (Math.abs(Math.sin(x / w * Math.PI * n + ph)) * .75 + .25 * Math.sin(x * .9 + ph * 3) * .5 + .12) * amp); ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); };
    const clouds = (y, n, col, a, sp = 1) => soft(1.6, () => { for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(col, a * (.5 + r() * .5)); ell(r() * w, y + (r() - .5) * 10 * sp, 6 + r() * 12, 1.2 + r() * 2.2); ctx.fill(); } });
    const haze = (y, col, a, d = 10) => { const gg = ctx.createLinearGradient(0, y - d, 0, y + d); gg.addColorStop(0, rgba(col, 0)); gg.addColorStop(.5, rgba(col, a)); gg.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gg; ctx.fillRect(0, y - d, w, d * 2); };
    const stars = (n, yMax) => { for (let i = 0; i < n; i++) { const x = r() * w, y = r() * yMax, rr = .12 + r() * r() * .45; ctx.fillStyle = `rgba(255,250,236,${.35 + r() * .6})`; circle(x, y, rr); ctx.fill(); if (rr > .35) glow(x, y, rr * 5, '220,230,255', .25); } };
    if (P === 'avalon') { glow(w * .8, hz - 8, 40, '255,232,170', .75); clouds(h * .22, 9, '#FFE6B0', .35); clouds(h * .36, 6, '#C8783A', .25);
      hills(hz - 4, 7, mix('#C89A62', F.bg[0], .55), .4, 2); hills(hz + 2, 6, mix('#9A7438', F.bg[0], .3), 1.3, 3); haze(hz, '#FFE0A8', .35);
      hills(hz + 9, 4, '#A8823A', 2.2, 2, '#5A3A16');
      soft(.6, () => { for (const [x, y, s] of [[w * .1, hz - 2, 1], [w * .2, hz, .7], [w * .9, hz + 3, .9]]) { ctx.fillStyle = 'rgba(70,52,30,.75)'; ctx.fillRect(x - .3 * s, y - 6 * s, .6 * s, 7 * s); ell(x, y - 7 * s, 3 * s, 3.4 * s); ctx.fill(); } });
      ctx.lineWidth = .3; for (let i = 0; i < 90; i++) { const x = r() * w, y = hz + 8 + r() * 36; ctx.strokeStyle = r() < .5 ? 'rgba(250,210,120,.35)' : 'rgba(110,70,26,.35)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .4, y - 1.5 - r() * 2); ctx.stroke(); } }
    else if (P === 'street') { stars(24, hz * .5); glow(w * .5, hz + 4, 34, '255,180,100', .35);
      const bl = (x, bw, bh, col, lit) => { ctx.fillStyle = col; ctx.fillRect(x, hz - bh + 8, bw, bh + 40); ctx.beginPath(); ctx.moveTo(x - 1, hz - bh + 8); ctx.lineTo(x + bw / 2, hz - bh + 3); ctx.lineTo(x + bw + 1, hz - bh + 8); ctx.fill();
        for (let rr = 0; rr < 5; rr++) for (let c = 0; c < 2; c++) if (r() < lit) { const wx = x + 2 + c * (bw / 2 - 1), wy = hz - bh + 11 + rr * 5.6; glow(wx + 1, wy + 1.2, 3, '255,190,110', .35); ctx.fillStyle = `rgba(255,${190 + r() * 40 | 0},120,.9)`; ctx.fillRect(wx, wy, 1.8, 2.4); } };
      soft(.5, () => { bl(-4, 13, 22, '#2A2238', .3); bl(14, 9, 16, '#2A2238', .3); bl(40, 10, 24, '#2A2238', .3); bl(52, 12, 18, '#2A2238', .3); });
      bl(-2, 14, 32, '#120C1C', .6); bl(47, 15, 36, '#120C1C', .6); haze(hz + 10, '#C08A70', .25, 14);
      for (const x of [w * .27, w * .73]) { ctx.fillStyle = '#0A0812'; ctx.fillRect(x - .3, hz - 6, .6, 30); glow(x, hz - 7, 7, '255,210,140', .7); } }
    else if (P === 'stars') { const mw = ctx.createLinearGradient(0, 0, w, hz); soft(3, () => { ctx.fillStyle = 'rgba(160,170,230,.16)'; ctx.beginPath(); ctx.moveTo(-5, hz * .8); ctx.quadraticCurveTo(w * .4, hz * .3, w + 5, -5); ctx.lineTo(w + 5, 8); ctx.quadraticCurveTo(w * .45, hz * .45, -5, hz); ctx.fill(); }); void mw;
      stars(110, hz); glow(w * .2, h * .16, 12, '200,220,255', .45); haze(hz - 2, '#3A4A80', .5, 8); hills(hz + 2, 14, '#1C2446', .7, 2, '#0A0E1E'); hills(hz + 9, 7, '#0C1022', 2.1, 3, '#04060E'); }
    else if (P === 'battle') { glow(w * .5, hz, 50, '255,150,70', .6); soft(2.2, () => { for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(${60 + r() * 50 | 0},${28 + r() * 20 | 0},24,${.25 + r() * .3})`; ell(r() * w, h * (.1 + r() * .38), 8 + r() * 12, 3 + r() * 5); ctx.fill(); } });
      hills(hz + 3, 5, '#6A2A18', .2, 4, '#2A0E0A'); soft(.5, () => { for (let i = 0; i < 12; i++) { const x = 1 + i * 5.4 + r() * 2, y = hz + 1 + r() * 3; ctx.strokeStyle = 'rgba(40,14,10,.9)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + (r() - .5), y - 9); ctx.stroke(); ctx.fillStyle = i % 2 ? 'rgba(232,176,64,.9)' : 'rgba(180,40,36,.9)'; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 2.5, y - 8.4, x + 4.4, y - 7.2); ctx.lineTo(x, y - 5.6); ctx.fill(); } });
      for (let i = 0; i < 6; i++) { const x = r() * w; glow(x, hz + 4, 8, '255,170,70', .45); } haze(hz + 2, '#FFB070', .25, 8); }
    else if (P === 'tower') { glow(w * .3, h * .18, 26, '200,236,180', .3); clouds(h * .2, 8, '#A8C098', .22); hills(hz, 10, '#3A4A34', 1.2, 2, '#1A2418'); haze(hz, '#9AB890', .25, 10); hills(hz + 6, 14, '#18221A', 1.9, 1, '#080C08');
      soft(.3, () => { const tx = w * .78; const tg = ctx.createLinearGradient(tx - 4, 0, tx + 4, 0); tg.addColorStop(0, '#060806'); tg.addColorStop(1, '#1E281E'); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(tx - 3, hz + 4); ctx.lineTo(tx - 2.4, hz - 30); ctx.lineTo(tx + 4.4, hz - 30); ctx.lineTo(tx + 5, hz + 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 3.4, hz - 30); ctx.lineTo(tx + 1, hz - 39); ctx.lineTo(tx + 5.4, hz - 30); ctx.fill(); });
      glow(w * .78 + 1, hz - 24, 5, '200,255,170', .6); ctx.fillStyle = 'rgba(220,255,190,.9)'; ctx.fillRect(w * .78 + .4, hz - 25, 1.3, 2); }
    else if (P === 'sea') { glow(w * .72, h * .2, 26, '255,255,240', .5); clouds(h * .16, 10, '#FFFFFF', .4); clouds(h * .32, 8, '#E8EEF4', .3);
      const sg = ctx.createLinearGradient(0, hz - 4, 0, h); sg.addColorStop(0, '#6A8CAC'); sg.addColorStop(.3, '#2E5274'); sg.addColorStop(1, '#14283E'); ctx.fillStyle = sg; ctx.fillRect(0, hz - 4, w, h); haze(hz - 4, '#E4EEF6', .45, 3);
      ctx.lineCap = 'round'; for (let i = 0; i < 70; i++) { const y = hz - 3 + Math.pow(r(), 1.6) * (h - hz), d = (y - hz) / (h - hz), x = r() * w, l = 1 + d * 5; ctx.strokeStyle = `rgba(230,240,250,${.18 + r() * .3})`; ctx.lineWidth = .2 + d * .4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - .4 - d, x + l, y); ctx.stroke(); }
      soft(.35, () => { ctx.fillStyle = '#2A2228'; ctx.beginPath(); ctx.moveTo(w * .1, hz - 4.6); ctx.lineTo(w * .3, hz - 4.6); ctx.lineTo(w * .27, hz - 2); ctx.lineTo(w * .14, hz - 2); ctx.fill(); ctx.fillStyle = '#ECE6D8'; ctx.beginPath(); ctx.moveTo(w * .2, hz - 5); ctx.quadraticCurveTo(w * .25, hz - 11, w * .2, hz - 17); ctx.lineTo(w * .27, hz - 6); ctx.fill(); ctx.fillStyle = '#C8C0B0'; ctx.beginPath(); ctx.moveTo(w * .19, hz - 5); ctx.lineTo(w * .19, hz - 14); ctx.lineTo(w * .13, hz - 5.6); ctx.fill(); }); }
    else if (P === 'roses') { glow(w * .74, h * .17, 22, '230,236,255', .5); ctx.fillStyle = '#F2F4FA'; circle(w * .74, h * .17, 3.4); ctx.fill(); ctx.fillStyle = 'rgba(170,180,200,.4)'; circle(w * .74 - .8, h * .17 - .6, 1); ctx.fill(); clouds(h * .3, 6, '#8A94B4', .25); stars(26, hz * .7);
      hills(hz + 2, 5, '#1E2436', .6, 5, '#0C0E18'); soft(.45, () => { for (let i = 0; i < 26; i++) { const x = r() * w, y = hz + 3 + r() * 26; ctx.fillStyle = 'rgba(22,34,28,.9)'; ell(x, y + 1, 3 + r() * 2, 2); ctx.fill(); } });
      for (let i = 0; i < 22; i++) { const x = r() * w, y = hz + 2 + r() * 26, rr = .7 + r() * .8, c = r() < .35 ? '#A02A44' : '#D4DAEC'; const gg = ctx.createRadialGradient(x + rr * .3, y - rr * .3, 0, x, y, rr); gg.addColorStop(0, shade(c, .3)); gg.addColorStop(1, shade(c, -.4)); ctx.fillStyle = gg; circle(x, y, rr); ctx.fill(); } }
    else if (P === 'throne') { ctx.fillStyle = 'rgba(30,8,10,.45)'; ctx.fillRect(0, hz - 2, w, h); glow(w * .5, h * .3, 34, '255,200,130', .35);
      soft(.5, () => { for (const x of [w * .08, w * .92]) { const pg = ctx.createLinearGradient(x - 5, 0, x + 5, 0); pg.addColorStop(0, '#2A0C10'); pg.addColorStop(.6, '#8A4A3A'); pg.addColorStop(1, '#3A1418'); ctx.fillStyle = pg; ctx.fillRect(x - 5, 0, 10, h); }
        for (const x of [w * .25, w * .75]) { const dg = ctx.createLinearGradient(x - 6, 0, x + 6, 0); dg.addColorStop(0, '#4A0A10'); dg.addColorStop(.35, '#9A1C22'); dg.addColorStop(.6, '#6A1018'); dg.addColorStop(1, '#3A060A'); ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(x - 6, 0); ctx.lineTo(x + 6, 0); ctx.lineTo(x + 6, 40); ctx.lineTo(x, 35); ctx.lineTo(x - 6, 40); ctx.fill(); ctx.fillStyle = '#E0B850'; ctx.fillRect(x - 1.2, 16, 2.4, 2.4); } }); }
    else if (P === 'fleet') { const sg = ctx.createLinearGradient(0, hz - 2, 0, h); sg.addColorStop(0, '#1A3A40'); sg.addColorStop(1, '#040C10'); ctx.fillStyle = sg; ctx.fillRect(0, hz - 2, w, h); stars(30, hz - 8); clouds(h * .25, 6, '#5A8A8A', .18); haze(hz - 2, '#6A9A9A', .3, 5);
      soft(.45, () => { for (const [x, s] of [[w * .1, 1], [w * .34, .65], [w * .82, .85]]) { ctx.fillStyle = '#03070A'; ctx.beginPath(); ctx.moveTo(x - 8 * s, hz - 2); ctx.lineTo(x + 8 * s, hz - 2); ctx.lineTo(x + 6 * s, hz + 1.4); ctx.lineTo(x - 6 * s, hz + 1.4); ctx.fill(); ctx.fillRect(x - .3, hz - 2 - 16 * s, .6, 16 * s); ctx.beginPath(); ctx.moveTo(x, hz - 16 * s); ctx.quadraticCurveTo(x + 6 * s, hz - 10 * s, x + .4, hz - 4 * s); ctx.fill(); } });
      for (const [x, s] of [[w * .1, 1], [w * .34, .65], [w * .82, .85]]) { glow(x + 4 * s, hz - 3, 6, '255,200,120', .8); ctx.fillStyle = 'rgba(255,190,110,.35)'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 4 * s - .5 + (r() - .5), hz + 2 + k * 2.2, 1, .4); } }
    else if (P === 'arden') { haze(h * .4, '#D8ECC8', .3, 30);
      for (let layerI = 0; layerI < 3; layerI++) soft(1.4 - layerI * .5, () => { const n = 6 + layerI * 2, col = mix('#2A4A2A', F.bg[0], .55 - layerI * .25); for (let i = 0; i < n; i++) { const x = (i + r() * .8) * w / n, tw = 1 + layerI * .9; ctx.fillStyle = mix('#3A2A1E', F.bg[0], .55 - layerI * .25); ctx.fillRect(x - tw / 2, 0, tw, h); ctx.fillStyle = col; ell(x + (r() - .5) * 4, h * (.1 + r() * .3), 5 + layerI * 2, 4 + r() * 6); ctx.fill(); } });
      soft(2, () => { ctx.fillStyle = 'rgba(236,250,210,.16)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * (.2 + i * .2), 0); ctx.lineTo(w * (.25 + i * .2), 0); ctx.lineTo(w * (.4 + i * .2), h); ctx.lineTo(w * (.32 + i * .2), h); ctx.fill(); } });
      hills(hz + 14, 3, '#2A3A20', .4, 3, '#101808'); }
    else if (P === 'meadow') { glow(w * .82, h * .12, 26, '255,250,210', .75); clouds(h * .18, 9, '#FFFFFF', .5); hills(hz - 2, 6, mix('#8AAA6A', F.bg[0], .5), 1.1, 2); haze(hz, '#F4F0C8', .35, 6); hills(hz + 6, 5, '#90B05E', .3, 3, '#4E6A2A');
      for (let i = 0; i < 70; i++) { const x = r() * w, y = hz + 6 + Math.pow(r(), .8) * 38, d = (y - hz) / 40, rr = .25 + d * .6; ctx.fillStyle = ['#F2E26A', '#F0A0B8', '#FFFFFF', '#E8784A', '#B0A0E8'][i % 5]; ctx.globalAlpha = .55 + d * .4; circle(x, y, rr); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (P === 'rebma') { soft(1.6, () => { for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(200,255,240,.12)'; ctx.beginPath(); ctx.moveTo(w * (.06 + i * .19), 0); ctx.lineTo(w * (.14 + i * .19), 0); ctx.lineTo(w * (.02 + i * .19), h); ctx.lineTo(w * (-.08 + i * .19), h); ctx.fill(); } });
      glow(w * .55, 0, 40, '210,255,240', .35); soft(.7, () => { for (let i = 0; i < 9; i++) { const x = r() * w, top = hz - 30 + r() * 30; ctx.strokeStyle = rgba(mix('#1A5A4A', F.bg[0], .3 + r() * .4), .8); ctx.lineWidth = 1 + r(); ctx.beginPath(); ctx.moveTo(x, h); for (let y = h; y > top; y -= 2) ctx.lineTo(x + Math.sin(y * .18 + i) * 2, y); ctx.stroke(); } });
      ctx.lineWidth = .25; for (let i = 0; i < 22; i++) { const x = r() * w, y = r() * h, rr = .3 + r() * .7; ctx.strokeStyle = 'rgba(220,255,250,.55)'; circle(x, y, rr); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(x + rr * .35, y - rr * .35, rr * .25); ctx.fill(); } }
  }

  // The form of the face, lit. The face is a height field: a rounded mask the width of the face at each height, with the
  // brow ridge, the sockets and the eyeballs in them, the cheekbones and their hollows, the nose, the lips and the chin
  // raised or sunk in it. It is turned (yaw), its normals are lit by the warm key light from the upper right and a cool
  // fill, with the warmth of blood where the light turns to shadow, a sheen on the nose and brow, and the hollows kept
  // dark. Painted at the canvas's own resolution over the face only, so it costs little.
  function faceShade(F, G) {
    const { R, Hh, chinT, tM, tN, yaw, fem, sk } = G, J = F.jaw ?? .5, gn = F.gaunt || 0, ck = F.cheek ?? .5, nwF = F.nw || 1, nl = F.nlen || 1, lp = F.lip ?? .7, mw = F.mw || 1, hk = F.hook || 0;
    const u0 = -1.4, u1 = 1.4, v0 = -.04, v1 = chinT + .08, W = Math.max(8, Math.ceil((u1 - u0) * R * PS)), H = Math.max(8, Math.ceil((v1 - v0) * Hh * PS));
    // the half-width of the head at each height (in R), down the contour of the face
    const prof = [[-.01, 0], [.03, .38], [.1, .64], [.2, .86], [.3, .975], [.5, 1 + .03 * ck], [.66, .92 - .07 * gn - (fem ? .02 : 0)], [.83 + .03 * J, fem ? .68 : .7 + .15 * J], [chinT - .035 - .01 * J, fem ? .33 : .26 + .16 * J], [chinT + .004, .02], [chinT + .1, 0]];
    const halfW = (v) => { if (v <= prof[0][0] || v >= prof[prof.length - 1][0]) return 0; let i = 0; while (v > prof[i + 1][0]) i++; // (a smooth Hermite curve through the profile, so the light runs smoothly down it)
      const p0 = prof[Math.max(0, i - 1)], p1 = prof[i], p2 = prof[i + 1], p3 = prof[Math.min(prof.length - 1, i + 2)], dvv = p2[0] - p1[0], t = (v - p1[0]) / dvv, m1 = (p2[1] - p0[1]) / (p2[0] - p0[0] || 1) * dvv, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0] || 1) * dvv, t2 = t * t, t3 = t2 * t;
      return Math.max(0, (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2); };
    const g2 = (du, dv, su, sv) => { if (du > 3 * su || du < -3 * su || dv > 3 * sv || dv < -3 * sv) return 0; const k = 1 - ((du * du) / (su * su) + (dv * dv) / (sv * sv)) / 9; return k > 0 ? k * k * k * k : 0; }; // (a bell that comes smoothly to nothing, so no seam shows in the light)
    // the features: [height, u, v, su, sv, mirrored]
    const FT = [[.06, .36, .445, .22, .035, 1], [.03, 0, .45, .1, .04, 0], [-.17, .38, .5, .17, .058, 1], [.08, .38, .505, .1, .035, 1], [-.025, .38, .57, .15, .025, 1],
      [.06 + .05 * ck, .58, .585, .2, .07, 1], [-.05 - .09 * gn, .62, .72, .16, .08, 1], [-.03 - .05 * gn, .88, .34, .12, .1, 1],
      [.1 * nwF, .12 * nwF, tN - .015, .065 * nwF, .028, 1], [-.07, .085 * nwF, tN + .002, .035, .012, 1], [.08, 0, tN - .025, .08 * nwF, .03, 0], [-.03, 0, tN + .045, .05, .03, 0],
      [.02 + .02 * lp, 0, tM - .016, .26 * mw, .016, 0], [.025 + .03 * lp, 0, tM + .022, .2 * mw, .02, 0], [-.04, 0, tM, .3 * mw, .006, 0], [-.035, .34 * mw, tM, .05, .02, 1],
      [-.05, 0, tM + .068, .18, .02, 0], [.07, 0, chinT - .06, .22 + .1 * J, .05, 0]];
    const NU = Math.ceil(W * 1.5), Zg = new Float32Array(NU * H), Ag = new Float32Array(NU * H), du = (u1 - u0) / NU;
    for (let j = 0; j < H; j++) { const v = v0 + (j + .5) / H * (v1 - v0), hw = halfW(v);
      const e1 = 1 - clamp((chinT + .01 - v) / .1, 0, 1), e2 = 1 - clamp((v + .02) / .25, 0, 1), dep = .8 * Math.sqrt(1 - e1 * e1) * Math.sqrt(1 - e2 * e2);
      const nk = (v - .44) / (tN - .44), nb0 = clamp((v - .38) / .07, 0, 1), nose = v > .38 && v < tN + .03 ? nl * (.06 + .3 * Math.pow(clamp(nk, 0, 1), 1.5) + .05 * hk * Math.exp(-((nk - .5) ** 2) / .02)) * nb0 * nb0 * (3 - 2 * nb0) * (v > tN - .015 ? clamp((tN + .03 - v) / .045, 0, 1) : 1) : 0, nsu = (.06 + .07 * clamp(nk, 0, 1)) * nwF;
      for (let i = 0; i < NU; i++) { const u = u0 + (i + .5) * du, au = Math.abs(u); let z, neg = 0;
        if (au < hw) { const q = au / hw; z = dep * Math.pow(1 - Math.pow(q, 2.4), 1 / 2.4); } else z = -(au - hw) * 3;
        { for (const f of FT) { const g = g2((f[5] ? au : u) - f[1], v - f[2], f[3], f[4]); if (g) { z += f[0] * g; if (f[0] < 0) neg += f[0] * g; } }
          if (nose) z += nose * Math.exp(-(u * u) / (2 * nsu * nsu)); }
        Zg[j * NU + i] = z; Ag[j * NU + i] = neg; } }
    // turned, lit, and splatted into the pixels they land on, the nearer over the farther
    const cy = Math.cos(yaw), sy = Math.sin(yaw), out = new ImageData(W, H), D = out.data, zb = new Float32Array(W).fill(-9), sx = (W / (u1 - u0));
    const L = [.52, -.55, .65], Ln = Math.hypot(...L); L[0] /= Ln; L[1] /= Ln; L[2] /= Ln; const Hv = [L[0], L[1], L[2] + 1], Hn = Math.hypot(...Hv); Hv[0] /= Hn; Hv[1] /= Hn; Hv[2] /= Hn;
    const A = hexRGB(sk).map(c => c / 255), rq = R / Hh * H / (v1 - v0) / Hh * Hh, dv = (v1 - v0) / H;
    for (let j = 0; j < H; j++) { zb.fill(-9); const v = v0 + (j + .5) * dv, row = j * NU;
      for (let i = 0; i < NU; i++) { const z = Zg[row + i], u = u0 + (i + .5) * du, xs = u * cy + Math.max(z, -.3) * sy, d = -u * sy + z * cy, px = ((xs - u0) * sx) | 0;
        if (px < 0 || px >= W || d <= zb[px]) continue; zb[px] = d;
        const zl = Zg[row + Math.max(0, i - 1)], zr = Zg[row + Math.min(NU - 1, i + 1)], zu = j > 0 ? Zg[row - NU + i] : z, zd = j < H - 1 ? Zg[row + NU + i] : z;
        let nx = -(zr - zl) / (2 * du), ny = -(zd - zu) / (2 * dv) * R / Hh, nz = 1; const nn = Math.hypot(nx, ny, nz); nx /= nn; ny /= nn; nz /= nn;
        const rx = nx * cy + nz * sy, rz = -nx * sy + nz * cy; nx = rx; nz = rz; void rq;
        const ao = clamp(1 + Ag[row + i] * 3.2, .4, 1), df = nx * L[0] + ny * L[1] + nz * L[2], wrap = clamp((df + .3) / 1.3, 0, 1), sss = Math.exp(-((df - .05) ** 2) / .05) * .22;
        const nh = Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]), oil = .1 + .25 * Math.exp(-(u * u) / .02 - ((v - tN + .06) ** 2) / .01) + .12 * Math.exp(-((u - .2) ** 2) / .1 - ((v - .28) ** 2) / .01), spec = oil * Math.pow(nh, 28) * ao;
        const bounce = Math.max(0, -nx * .7 + ny * .35 + nz * .2) * .12, lw = Math.pow(wrap, 1.15) * (.55 + .45 * ao);
        const o = (j * W + px) * 4;
        D[o] = clamp((A[0] * (.34 * ao + 1.0 * lw + bounce * .8) + sss * .45 + spec) * 255, 0, 255);
        D[o + 1] = clamp((A[1] * (.3 * ao + .9 * lw + bounce * .85) + sss * .1 + spec * .95) * 255, 0, 255);
        D[o + 2] = clamp((A[2] * (.36 * ao + .76 * lw + bounce * 1.1) + sss * .04 + spec * .9) * 255, 0, 255); D[o + 3] = 255; }
      for (let x = 1; x < W; x++) { const o = (j * W + x) * 4; if (!D[o + 3]) { D[o] = D[o - 4]; D[o + 1] = D[o - 3]; D[o + 2] = D[o - 2]; D[o + 3] = D[o - 1]; } }
      for (let x = W - 2; x >= 0; x--) { const o = (j * W + x) * 4; if (!D[o + 3]) { D[o] = D[o + 4]; D[o + 1] = D[o + 5]; D[o + 2] = D[o + 6]; D[o + 3] = D[o + 7]; } } }
    const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(out, 0, 0);
    return { c, u0, u1, v0, v1 };
  }
  // ---------------- the portrait ----------------
  function paintFace(F, w, h) { // head and shoulders before the place that is theirs, as the Trumps show them
    const main = ctx; PT = ctx.getTransform(); PS = Math.hypot(PT.a, PT.b) || 1;
    const r = rng(seedOf(F.name));
    const bg = into(layer('bg'), () => trumpPlace(F, w, h)); blurTo(main, bg, 0); blurTo(main, bg, .5, 'source-over', .85);
    // the measure of the head: Hh from crown to chin, R half the face's width; the eyes on the head's midline
    const fem = !!F.fem, sz = F.sz || 1, Hh = 30 * sz, cx = w * .5, y0 = h * .155 + (1 - sz) * 9, R = Hh * .37 * (F.fw || 1);
    const chinT = F.chin || 1, ty = (t) => y0 + Hh * t, yaw = F.yaw || 0, cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const X = (u, z) => cx + R * (u * cyw + (z === undefined ? Math.sqrt(Math.max(0, 1 - u * u)) : z) * syw); // across the face as it is turned; z: how far that point stands forward
    const fsh = (u) => { const a = Math.asin(clamp(u, -.99, .99)); return clamp(Math.cos(a + yaw) / Math.cos(a), .35, 1.4); };
    const tN = .69, tM = .7 + (chinT - .7) * .3, yb = ty(chinT) + Hh * (fem ? .23 : .2), HT = PT.translate(cx, ty(chinT)).rotate((F.tilt || 0) * 57.3).translate(-cx, -ty(chinT));
    const sk = F.skin, lit = mix(sk, '#FFE8CC', .4), shd = mix(shade(sk, -.4), '#3A3A5C', .3), deep = mix(shade(sk, -.6), '#241C30', .3), ros = F.rosy ?? .7;
    const nW = R * (fem ? .56 : .7) * (F.neck || 1), sW = (fem ? 21 : 25.5) * (F.sh || 1) * sz;
    const LX = [cx + R * 1.4, y0 - Hh * .1, cx - R * 1.3, ty(1.5), cx + R * .3, ty(.25), R];
    const hcx = cx - syw * R * .25, HL = [.5, -.6, .62], HH = [.5, -.6, 1.62], hn = Math.hypot(...HH); HH[0] /= hn; HH[1] /= hn; HH[2] /= hn;
    const hairLight = (x, y, tx, tyy) => { // the hair lit as hair is: by its surface, and with a sheen running across the strands where they turn to the light (Kajiya-Kay)
      const k = clamp((y - ty(.55)) / (Hh * .35), 0, 1); let nx = (x - hcx) / (R * 1.12), ny = (y - ty(.43)) / (Hh * .5); const d2 = nx * nx + ny * ny; if (d2 > .94) { const q = Math.sqrt(.94 / d2); nx *= q; ny *= q; }
      nx = lerp(nx, clamp((x - hcx) / (R * 1.8), -.9, .9), k); ny = lerp(ny, .12, k); const nz = Math.sqrt(Math.max(.02, 1 - nx * nx - ny * ny));
      let tz = -(tx * nx + tyy * ny) / nz; const tl = Math.hypot(tx, tyy, tz); const t0 = tx / tl, t1 = tyy / tl; tz /= tl;
      const df = clamp((nx * HL[0] + ny * HL[1] + nz * HL[2] + .25) / 1.25, 0, 1), th = t0 * HH[0] + t1 * HH[1] + tz * HH[2], sp = Math.pow(Math.max(0, 1 - th * th), 30);
      return -.7 + .8 * df + .85 * sp * (.4 + .6 * df) - Math.max(0, (y - ty(1.2)) / (Hh * 1.2)) * .35; };
    const HO = { r, light: hairLight, lx: LX };
    const hd = hairDo(F, { cx, R, Hh, ty, X, chinT, syw, yb, sW, nW, fem, r, tM });

    // 1. the hair that falls behind the shoulders
    if (hd.back.length) hairLocks(hd.back, shade(F.hair, -.12), HT, { ...HO, base: 2, soft: .45 });

    // 2. the neck and, where the dress leaves it bare, the breast: in the shadow of the head
    const neck = into(layer('neck'), () => {
      ctx.beginPath(); ctx.moveTo(cx - nW, ty(.7)); ctx.lineTo(cx - nW * 1.0, yb - Hh * .16); ctx.bezierCurveTo(cx - nW * 1.15, yb - Hh * .04, cx - sW * .5, yb + Hh * .06, cx - sW * .85, yb + Hh * .18); ctx.lineTo(cx - sW, h + 2);
      ctx.lineTo(cx + sW, h + 2); ctx.lineTo(cx + sW * .85, yb + Hh * .18); ctx.bezierCurveTo(cx + sW * .5, yb + Hh * .06, cx + nW * 1.15, yb - Hh * .04, cx + nW * 1.0, yb - Hh * .16); ctx.lineTo(cx + nW, ty(.7)); ctx.closePath();
      const g = ctx.createLinearGradient(cx - sW * .7, 0, cx + sW * .7, 0); g.addColorStop(0, shd); g.addColorStop(.45, mix(sk, shd, .25)); g.addColorStop(.75, sk); g.addColorStop(1, mix(sk, lit, .5)); ctx.fillStyle = g; ctx.fill();
    });
    glaze(neck, 1.4, 'source-atop', () => { ctx.fillStyle = rgba(deep, .75); ell(cx - R * .15, ty(chinT) + Hh * .04, R * 1.05, Hh * .13); ctx.fill(); ctx.fillStyle = rgba(shd, .5); ell(cx - nW * 1.1, yb, nW * .6, Hh * .3); ctx.fill(); });
    glaze(neck, .7, 'source-atop', () => { ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.strokeStyle = s > 0 ? rgba(lit, .35) : rgba(shd, .3); ctx.lineWidth = nW * .2; ctx.beginPath(); ctx.moveTo(cx + s * nW * .85, ty(.82)); ctx.quadraticCurveTo(cx + s * nW * .55, yb - Hh * .1, cx + s * nW * .14, yb + Hh * .03); ctx.stroke(); }
      ctx.fillStyle = rgba(deep, .45); ell(cx, yb + Hh * .04, nW * .2, Hh * .025); ctx.fill();
      if (!fem) { ctx.fillStyle = rgba(lit, .3); ell(cx + nW * .06, ty(chinT) + Hh * .14, nW * .12, Hh * .04); ctx.fill(); }
      for (const s of [-1, 1]) { ctx.strokeStyle = rgba(lit, s > 0 ? .4 : .15); ctx.lineWidth = Hh * .02; ctx.beginPath(); ctx.moveTo(cx + s * nW * .3, yb + Hh * .07); ctx.quadraticCurveTo(cx + s * sW * .3, yb + Hh * .06, cx + s * sW * .62, yb + Hh * .11); ctx.stroke();
        ctx.strokeStyle = rgba(shd, .3); ctx.lineWidth = Hh * .02; ctx.beginPath(); ctx.moveTo(cx + s * nW * .4, yb + Hh * .11); ctx.quadraticCurveTo(cx + s * sW * .3, yb + Hh * .1, cx + s * sW * .6, yb + Hh * .15); ctx.stroke(); }
      ctx.fillStyle = rgba(lit, .25); ell(cx + sW * .25, yb + Hh * .35, sW * .3, Hh * .15); ctx.fill();
    });
    blurTo(main, neck, 0);

    // 3. what they wear
    paintDress(F, { cx, R, Hh, ty, yb, sW, nW, fem, chinT, r, w, h, sk, lit, shd });

    // 4. the face, ears and skull, modelled in glazes
    const J = F.jaw ?? .5, gn = F.gaunt || 0, ck = F.cheek ?? .5;
    const side = (s) => [[s * .8, .12, .6], [s * .975, .3, .2], [s * (1 + .03 * ck), .5, .08], [s * (.92 - .07 * gn - (fem ? .02 : 0)), .66, .2], [s * (fem ? .68 : .7 + .15 * J), .83 + .03 * J, .42], [s * (fem ? .33 : .26 + .16 * J), chinT - .035 - .01 * J, .82]];
    const facePts = [[X(0, .98), ty(chinT)], ...side(1).reverse().map(([u, t, z]) => [X(u, z), ty(t)]), [X(0, .7), ty(.04)], ...side(-1).map(([u, t, z]) => [X(u, z), ty(t)])];
    const faceP = () => { ctx.beginPath(); curve(facePts, true); };
    const HB = regionOf(cx - R * 1.9, y0 - Hh * .15, R * 3.8, Hh * 1.45); REG = HB;
    const FL = layer('face');
    const fgr = () => { const g = ctx.createRadialGradient(cx + R * .45, ty(.28), R * .1, cx + R * .2, ty(.45), R * 2.0); g.addColorStop(0, lit); g.addColorStop(.3, mix(sk, lit, .4)); g.addColorStop(.55, sk); g.addColorStop(.85, mix(sk, shd, .6)); g.addColorStop(1, shd); return g; };
    const ears = [];
    into(FL, () => {
      if (!/long|shoulder|curls/.test(F.hstyle)) for (const s of [-1, 1]) { const vis = clamp(.55 - s * syw * 2.6, .12, 1), ex = X(s, 0) + s * R * .1 * vis, ey = ty(.585), ew = R * .16 * vis, eh = Hh * .125; ears.push([s, ex, ey, ew, eh]);
        ctx.fillStyle = s < 0 ? mix(sk, shd, .45) : mix(sk, lit, .1); ell(ex, ey, ew, eh, s * .12); ctx.fill(); }
      ctx.fillStyle = fgr(); ell(cx - syw * R * .25, ty(.43), R * .97, Hh * .43); ctx.fill(); faceP(); ctx.fill();
    }, HT);
    const FS = faceShade(F, { R, Hh, chinT, tM, tN, yaw, fem, sk });
    into(FL, () => { ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(FS.c, cx + FS.u0 * R, ty(FS.v0), (FS.u1 - FS.u0) * R, (FS.v1 - FS.v0) * Hh); }, HT);
    const P = (dst, b, fn, op = 'source-atop', a = 1) => glaze(dst, b, op, fn, HT, a, HB);
    const eyeU = .38, ey = ty(.5), tMy = ty(tM), nTip = [X(.0, 1.25), ty(tN - .02)];
    // the ears' warmth, the cheeks', the nose's; a cool beard-shadow on the men; the sea in Llewella
    P(FL, Hh * .1, () => { for (const [s, ex, eyy, ew, eh] of ears) { ctx.fillStyle = `rgba(200,70,60,${.3 * ros})`; ell(ex, eyy, ew, eh); ctx.fill(); } });
    P(FL, Hh * .05, () => {
      ctx.fillStyle = `rgba(214,86,72,${.36 * ros})`; for (const s of [-1, 1]) { ell(X(s * .55, .7), ty(.63), R * .32, Hh * .085); ctx.fill(); }
      ctx.fillStyle = `rgba(214,92,78,${.22 * ros})`; ell(nTip[0], nTip[1], R * .14, Hh * .04); ctx.fill();
      ctx.fillStyle = 'rgba(210,150,80,.1)'; ell(X(0), ty(.3), R * .7, Hh * .12); ctx.fill(); ctx.fillStyle = `rgba(200,80,70,${.12 * ros})`; ell(X(0, .9), ty(chinT - .05), R * .25, Hh * .05); ctx.fill();
      if (!fem) { ctx.fillStyle = F.beard ? 'rgba(70,80,110,.18)' : 'rgba(80,92,124,.2)'; ctx.beginPath(); ctx.moveTo(X(-.95, .2), ty(.66)); ctx.quadraticCurveTo(X(-.6, .6), ty(.76), X(-.25, .9), ty(tN + .03)); ctx.lineTo(X(.25, .9), ty(tN + .03)); ctx.quadraticCurveTo(X(.6, .6), ty(.76), X(.95, .2), ty(.66)); ctx.lineTo(X(.6, .5), ty(chinT + .05)); ctx.lineTo(X(-.6, .5), ty(chinT + .05)); ctx.closePath(); ctx.fill(); }
      if (F.sea) { ctx.fillStyle = 'rgba(60,140,120,.18)'; ell(cx - R * .5, ty(.6), R * .8, Hh * .5); ctx.fill(); }
    });
    // the hollows deepened a little, and the turn of the jaw
    P(FL, Hh * .03, () => {
      for (const s of [-1, 1]) { const ex = X(s * eyeU, .8), k = s < 0 ? 1.2 : .85;
        ctx.fillStyle = rgba(deep, .14 * k); ell(ex - s * R * .03, ey - Hh * .012, R * .26 * fsh(s * eyeU), Hh * .06); ctx.fill();
        ctx.fillStyle = rgba(deep, .16 * k); ell(X(s * .2, .9), ty(.475), R * .1, Hh * .035); ctx.fill(); }
      ctx.strokeStyle = rgba(deep, .2); ctx.lineWidth = R * .14; ctx.beginPath(); curve(facePts.slice(0, 3).reverse(), false); ctx.stroke(); ctx.beginPath(); curve(facePts.slice(-3).concat([facePts[0]]), false); ctx.stroke();
    });
    // the nose: its shadowed side plane, the wings, the shadow it throws on the lip; the lip's own planes
    const nw = R * .2 * (F.nw || 1), nb = ty(tN), nl = F.nlen || 1, nTop = ty(tN - .19 * nl);
    P(FL, Hh * .018, () => {
      ctx.lineCap = 'round'; ctx.fillStyle = rgba(deep, .3); ell(X(-.07, 1.05), nb + Hh * .016, nw * 1.0, Hh * .018, .15); ctx.fill();
      ctx.fillStyle = rgba(shd, .3); ell(X(-.02, 1.0), ty(tM - .035), R * .3, Hh * .022); ctx.fill();
      ctx.fillStyle = rgba(deep, .45); ell(X(-.02, .98), tMy + Hh * .062, R * .2, Hh * .018); ctx.fill();
      const nl2 = .12 + .25 * (F.lines || 0) + .12 * Math.max(0, F.set || 0); for (const s of [-1, 1]) { ctx.strokeStyle = rgba(deep, nl2 * (s < 0 ? 1.2 : .7)); ctx.lineWidth = R * .05; ctx.beginPath(); ctx.moveTo(X(s * .24, .9), nb - Hh * .015); ctx.quadraticCurveTo(X(s * .42, .8), ty(tM - .04), X(s * .4 * (F.mw || 1), .78), tMy + Hh * .03); ctx.stroke(); }
    });
    // the fine darks: nostrils, the corners of the mouth, and whatever lines the years have put there
    P(FL, Hh * .008, () => {
      for (const s of [-1, 1]) { ctx.fillStyle = s < 0 ? 'rgba(60,26,22,.75)' : 'rgba(70,32,26,.55)'; ell(X(s * .085 * (F.nw || 1), 1.05), nb - Hh * .004, nw * .3, Hh * .011, s * .25); ctx.fill(); }
      for (const [s, ex, eyy, ew, eh] of ears) { ctx.fillStyle = rgba(deep, .45); ell(ex - s * ew * .12, eyy + eh * .05, ew * .5, eh * .6, s * .12); ctx.fill(); ctx.strokeStyle = rgba(lit, s > 0 ? .4 : .15); ctx.lineWidth = ew * .2; ctx.beginPath(); ctx.ellipse(ex, eyy, ew * .8, eh * .85, s * .12, -Math.PI * .6, Math.PI * .4); ctx.stroke(); }
      const L = F.lines || 0; ctx.lineCap = 'round';
      if (L) { ctx.lineWidth = Hh * .006; for (let i = 0; i < 3; i++) { const yy = ty(.28 + i * .045); ctx.strokeStyle = rgba(deep, .22 * L); ctx.beginPath(); ctx.moveTo(X(-.45, .8), yy + Hh * .006); ctx.quadraticCurveTo(X(0, 1), yy - Hh * .008, X(.45, .8), yy + Hh * .004); ctx.stroke(); }
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(deep, .25 * L); ctx.beginPath(); ctx.moveTo(X(s * .62, .55), ey + Hh * (i - 1) * .015); ctx.lineTo(X(s * .76, .4), ey + Hh * (i - 1) * .028); ctx.stroke(); }
        for (const s of [-1, 1]) { ctx.strokeStyle = rgba(deep, .3 * L); ctx.beginPath(); ctx.moveTo(X(s * .22, .85), ey + Hh * .045); ctx.quadraticCurveTo(X(s * .4, .8), ey + Hh * .075, X(s * .58, .6), ey + Hh * .04); ctx.stroke(); } }
      if ((F.set || 0) < -.2 || (F.slant || 0) > .5 || L) { ctx.strokeStyle = rgba(deep, .35); ctx.lineWidth = Hh * .007; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(X(s * .05, .97), ty(.4)); ctx.lineTo(X(s * .065, .97), ty(.455)); ctx.stroke(); } }
    });
    // the lights: the brow, the bridge and tip of the nose, the cheekbone turned to the light, the chin
    P(FL, Hh * .045, () => {
      ctx.fillStyle = rgba('#FFF0DC', .4); ell(X(.25, .9), ty(.27), R * .42, Hh * .09); ctx.fill();
      ctx.fillStyle = rgba('#FFF0DC', .4); ell(X(.6, .7), ty(.565), R * .24, Hh * .05, -.3); ctx.fill();
      ctx.fillStyle = rgba('#FFF0DC', .14); ell(X(-.6, .7), ty(.565), R * .2, Hh * .04, .3); ctx.fill();
      ctx.fillStyle = rgba('#FFF0DC', .3); ell(X(.1, .95), ty(chinT - .055), R * .2, Hh * .035); ctx.fill();
      ctx.fillStyle = rgba('#FFF0DC', .18); ell(X(.08, 1), ty(tM - .05), R * .12, Hh * .015); ctx.fill();
    });
    P(FL, Hh * .012, () => {
      ctx.lineCap = 'round'; ctx.strokeStyle = rgba('#FFF4E6', .55); ctx.lineWidth = R * .07; ctx.beginPath(); ctx.moveTo(X(.03, 1), ty(tN - .17 * nl)); ctx.quadraticCurveTo(X(.05 + .03 * (F.hook || 0), 1.15), ty(tN - .1), X(.05, 1.2), ty(tN - .04)); ctx.stroke();
      ctx.fillStyle = rgba('#FFF8F0', .8); ell(X(.06, 1.24), ty(tN - .035), R * .045, Hh * .012); ctx.fill();
      ctx.fillStyle = rgba('#FFF4E6', .35); ell(X(.2, .9), ty(.33), R * .08, Hh * .02); ctx.fill();
    });
    // freckles
    if (F.freckles) P(FL, Hh * .003, () => { for (let i = 0; i < 70 * F.freckles; i++) { const u = (r() - .5) * 1.3, t = .55 + r() * .14 + Math.abs(u) * .04; ctx.fillStyle = `rgba(150,80,50,${.15 + r() * .25})`; circle(X(u, .8), ty(t), Hh * (.003 + r() * .004)); ctx.fill(); } });

    // the eyes: the white, never white, shadowed by the lid; the iris, its ring, the pupil; the lids, the crease, the lashes; the light in them
    const eh0 = F.eh || 1, lid = F.lid || 0, eCol = F.eye, EYES = [-1, 1].map(s => {
      const u = s * eyeU, f = fsh(u), ex = X(u, .78), ew = R * .18 * f, eh = R * .18 * .37 * eh0 * (fem ? 1.08 : 1);
      const ic = [ex - s * ew, ey + eh * .15], oc = [ex + s * ew, ey - eh * (fem ? .22 : .06)], lk = .92 - .28 * lid;
      const upper = () => { ctx.moveTo(ic[0], ic[1]); ctx.bezierCurveTo(ex - s * ew * .55, ey - eh * 1.45 * lk, ex + s * ew * .4, ey - eh * 1.4 * lk, oc[0], oc[1]); };
      const lower = () => ctx.bezierCurveTo(ex + s * ew * .45, ey + eh * 1.0, ex - s * ew * .45, ey + eh * 1.05, ic[0], ic[1]);
      return { s, ex, ew, eh, ic, oc, lk, upper, lower, open: () => { ctx.beginPath(); upper(); lower(); ctx.closePath(); }, ix: ex + ew * .03 * (1 + yaw * 2), iy: ey - eh * .12, ir: ew * .52 }; });
    const E = into(layer('eye'), () => { for (const { ex, ew, eh, ic, oc, open, ix, iy, ir } of EYES) { ctx.globalCompositeOperation = 'source-over';
      open(); const sg = ctx.createRadialGradient(ix + ew * .2, iy, ew * .1, ix, iy, ew * 1.1); sg.addColorStop(0, '#D2C8BE'); sg.addColorStop(.55, mix('#C4B8AE', sk, .4)); sg.addColorStop(1, mix(sk, shd, .6)); ctx.fillStyle = sg; ctx.fill();
      ctx.save(); open(); ctx.clip();
      const ig = ctx.createRadialGradient(ix + ir * .15, iy + ir * .2, ir * .05, ix, iy, ir); ig.addColorStop(0, shade(eCol, .45)); ig.addColorStop(.45, shade(eCol, .1)); ig.addColorStop(.8, shade(eCol, -.25)); ig.addColorStop(1, shade(eCol, -.6)); ctx.fillStyle = ig; circle(ix, iy, ir); ctx.fill();
      ctx.lineWidth = ir * .06; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + r() * .2; ctx.strokeStyle = i % 2 ? rgba(shade(eCol, .5), .35) : rgba(shade(eCol, -.5), .3); ctx.beginPath(); ctx.moveTo(ix + Math.cos(a) * ir * .4, iy + Math.sin(a) * ir * .4); ctx.lineTo(ix + Math.cos(a) * ir * .88, iy + Math.sin(a) * ir * .88); ctx.stroke(); }
      ctx.strokeStyle = rgba(shade(eCol, -.75), .75); ctx.lineWidth = ir * .16; circle(ix, iy, ir * .93); ctx.stroke();
      ctx.fillStyle = '#0A0706'; circle(ix, iy, ir * (F.eh > 1.05 ? .3 : .38)); ctx.fill();
      const lg = ctx.createLinearGradient(0, ey - eh * 1.5, 0, ey + eh * .3); lg.addColorStop(0, 'rgba(40,18,16,.75)'); lg.addColorStop(.55, 'rgba(40,18,16,.25)'); lg.addColorStop(1, 'rgba(40,18,16,0)'); ctx.fillStyle = lg; ctx.fillRect(ex - ew * 1.2, ey - eh * 2, ew * 2.4, eh * 3);
      for (const c of [ic, oc]) { const cg = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], ew * .45); cg.addColorStop(0, rgba(mix(sk, '#B05050', .3), .6)); cg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cg; ctx.fillRect(c[0] - ew, c[1] - ew, ew * 2, ew * 2); }
      ctx.restore(); } }, HT);
    blurTo(FL, E, .05, 'source-over', 1, HB);
    P(FL, Hh * .006, () => { for (const { s, ex, ew, eh, ic, oc, upper, lower } of EYES) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,16,14,.92)'; ctx.lineWidth = eh * (fem ? .5 : .38); ctx.beginPath(); upper(); ctx.stroke();
      ctx.strokeStyle = rgba(deep, .5); ctx.lineWidth = eh * .14; ctx.beginPath(); ctx.moveTo(oc[0], oc[1]); lower(); ctx.stroke();
      ctx.strokeStyle = rgba(deep, .4); ctx.lineWidth = eh * .22; ctx.beginPath(); ctx.moveTo(ic[0] + s * ew * .15, ic[1] - eh * .6); ctx.bezierCurveTo(ex - s * ew * .45, ey - eh * (2.5 - lid * .6), ex + s * ew * .45, ey - eh * (2.4 - lid * .6), oc[0] + s * ew * .12, oc[1] - eh * .5); ctx.stroke(); } }, 'source-over');
    P(FL, Hh * .004, () => { for (const { s, ex, ew, eh, ic, oc, lk, ix, iy, ir } of EYES) { ctx.strokeStyle = 'rgba(255,226,214,.4)'; ctx.lineWidth = eh * .12; ctx.beginPath(); ctx.moveTo(oc[0] - s * ew * .2, oc[1] + eh * .4); ctx.bezierCurveTo(ex + s * ew * .35, ey + eh * .82, ex - s * ew * .4, ey + eh * .85, ic[0] + s * ew * .15, ic[1] + eh * .05); ctx.stroke();
      ctx.strokeStyle = 'rgba(28,14,12,.7)'; ctx.lineWidth = eh * (fem ? .1 : .07); ctx.lineCap = 'round';
      for (let i = 0; i < (fem ? 14 : 8); i++) { const v = .3 + i / (fem ? 14 : 8) * .72, px = lerp(ic[0], oc[0], v), py = lerp(ey - eh * 1.25 * lk, oc[1], Math.pow(v, 3)) - eh * .1, len = eh * (fem ? .7 : .4) * (.6 + v * .6); ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + s * len * .3, py - len * .6, px + s * len * .7, py - len * .8); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(ix + ir * .3, iy - ir * .32, ir * .15); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(ix - ir * .3, iy + ir * .35, ir * .08); ctx.fill(); } }, 'source-over');
    // the brows: a soft mass, then the hairs, lying the way they grow
    const bCol = mix(shade(F.hair, -.35), sk, fem ? .18 : .08), bw = F.brow || 1, wd = (v) => Hh * (.024 - .016 * v) * bw * (fem ? .7 : 1);
    const BROWS = [-1, 1].map(s => { const sl = (F.slant || 0) * Hh * .016 - Math.min(0, F.set || 0) * Hh * .006, ar = (F.arch || 0) * Hh * .012;
      return { s, S: spline([[X(s * .12, .93), ty(.445) + sl], [X(s * .3, .85), ty(.425) - ar * .5 + sl * .3], [X(s * .5, .74), ty(.418) - ar], [X(s * .72, .5), ty(.44) - ar * .2]], 12) }; });
    P(FL, Hh * .02, () => { for (const { s, ex, ew, eh } of EYES) { ctx.fillStyle = rgba('#FFF2E2', s > 0 ? .3 : .12); ell(ex + s * ew * .1, ey - eh * 1.9, ew * .6, eh * .4); ctx.fill(); } });
    P(FL, Hh * .008, () => { ctx.fillStyle = rgba(bCol, .55); for (const { s, S } of BROWS) { ctx.beginPath(); for (let k = 0; k <= 12; k++) ctx.lineTo(S[k][0] - S[k][2] * wd(k / 12) * .5 * s, S[k][1] - Math.abs(S[k][3]) * wd(k / 12) * .5); for (let k = 12; k >= 0; k--) ctx.lineTo(S[k][0] + S[k][2] * wd(k / 12) * .5 * s, S[k][1] + Math.abs(S[k][3]) * wd(k / 12) * .5); ctx.closePath(); ctx.fill(); } }, 'source-over');
    into(FL, () => { ctx.lineCap = 'round'; ctx.lineWidth = Hh * .0035; for (const { s, S } of BROWS) for (let i = 0; i < 70 * bw; i++) { const v = Math.pow(r(), .8), k = Math.min(11, Math.floor(v * 12)), p = S[k], q = S[k + 1], ang = Math.atan2((q[1] - p[1]), (q[0] - p[0])) + (v < .2 ? -s * 1.1 : -s * .25) * (s < 0 ? -1 : 1), o = (r() - .5) * wd(v), x = p[0] + p[2] * o, y = p[1] + o, len = Hh * (.014 + r() * .014);
      ctx.strokeStyle = rgba(r() < .25 ? shade(bCol, .35) : bCol, .35 + r() * .45); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke(); } }, HT);
    // the mouth, modelled: the upper lip turned down out of the light, the fuller lower lip catching it, the line between
    const m = .34 * (F.mw || 1) * (fem ? .92 : 1), set = F.set || 0, lp = F.lip ?? .7, mxc = X(0, 1);
    const lc = [X(-m, .78), tMy - set * Hh * .012], rc = [X(m, .78), tMy - (set + (F.smirk || 0) * 1.1) * Hh * .012];
    const up = Hh * (.012 + .016 * lp) * (fem ? 1.1 : 1), lo = Hh * (.016 + .022 * lp) * (fem ? 1.1 : 1), gap = F.teeth ? Hh * .016 : 0, mid = tMy + Math.max(0, set) * Hh * .004;
    const lipC = mix(sk, fem ? '#A83A44' : '#94463E', fem ? .62 : .5);
    const Lp = into(layer('lip'), () => {
      if (gap) { ctx.fillStyle = '#3A1614'; ctx.beginPath(); ctx.moveTo(lc[0], lc[1]); ctx.quadraticCurveTo(mxc, mid - gap * .7, rc[0], rc[1]); ctx.quadraticCurveTo(mxc, mid + gap * 1.5, lc[0], lc[1]); ctx.fill();
        const tg = ctx.createLinearGradient(lc[0], 0, rc[0], 0); tg.addColorStop(0, '#7A6A5E'); tg.addColorStop(.35, '#E4DACA'); tg.addColorStop(.7, '#F0E8DA'); tg.addColorStop(1, '#8A786A'); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(lerp(lc[0], mxc, .25), lerp(lc[1], mid, .3) - gap * .3); ctx.quadraticCurveTo(mxc, mid - gap * .75, lerp(rc[0], mxc, .25), lerp(rc[1], mid, .3) - gap * .3); ctx.lineTo(lerp(rc[0], mxc, .3), lerp(rc[1], mid, .3) + gap * .3); ctx.quadraticCurveTo(mxc, mid + gap * .4, lerp(lc[0], mxc, .3), lerp(lc[1], mid, .3) + gap * .3); ctx.fill(); }
      const ug = ctx.createLinearGradient(0, mid - up, 0, mid); ug.addColorStop(0, shade(lipC, -.08)); ug.addColorStop(1, shade(lipC, -.3)); ctx.fillStyle = ug;
      ctx.beginPath(); ctx.moveTo(lc[0], lc[1]); ctx.bezierCurveTo(lerp(lc[0], mxc, .45), mid - up * .55, X(-.11, .98), mid - up * 1.08, mxc, mid - up * .78); ctx.bezierCurveTo(X(.11, .98), mid - up * 1.08, lerp(rc[0], mxc, .45), mid - up * .55, rc[0], rc[1]); ctx.quadraticCurveTo(mxc, mid - gap * .7 + Hh * .002, lc[0], lc[1]); ctx.fill();
      const lg = ctx.createLinearGradient(0, mid, 0, mid + lo); lg.addColorStop(0, shade(lipC, -.05)); lg.addColorStop(.45, mix(lipC, lit, .12)); lg.addColorStop(1, shade(lipC, -.15)); ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(lc[0], lc[1]); ctx.quadraticCurveTo(mxc, mid + gap * 1.5 + Hh * .002, rc[0], rc[1]); ctx.bezierCurveTo(lerp(rc[0], mxc, .35), mid + lo * 1.15 + gap, lerp(lc[0], mxc, .35), mid + lo * 1.15 + gap, lc[0], lc[1]); ctx.fill();
    }, HT);
    blurTo(FL, Lp, Hh * .005, 'source-over', fem ? 1 : .85, HB);
    P(FL, Hh * .005, () => { ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(56,20,20,.8)'; ctx.lineWidth = Hh * .006; ctx.beginPath(); ctx.moveTo(lc[0], lc[1]); ctx.quadraticCurveTo(mxc, mid + (gap ? -gap * .7 : Hh * .003), rc[0], rc[1]); ctx.stroke(); if (gap) { ctx.beginPath(); ctx.moveTo(lc[0], lc[1]); ctx.quadraticCurveTo(mxc, mid + gap * 1.5, rc[0], rc[1]); ctx.stroke(); }
      ctx.fillStyle = rgba(deep, .5); for (const c of [lc, rc]) { circle(c[0], c[1], Hh * .006); ctx.fill(); } }, 'source-over');
    P(FL, Hh * .01, () => { ctx.fillStyle = 'rgba(255,238,228,.5)'; ell(mxc + R * .07, mid + gap + lo * .42, R * .11, lo * .17); ctx.fill(); ctx.fillStyle = rgba(lit, .3); ell(X(.02, 1), mid - up * 1.15, R * .05, Hh * .008); ctx.fill(); }, 'source-over');
    // a cool edge of reflected light along the shadowed cheek
    P(FL, Hh * .03, () => { ctx.strokeStyle = 'rgba(150,160,200,.16)'; ctx.lineWidth = R * .12; ctx.beginPath(); curve(facePts.slice(-5), false); ctx.stroke(); });
    REG = null; lay(main, FL, HB, Hh * .002);

    // 5. the beard, then the hair over the head and the locks that fall in front
    if (F.beard) { const bl = beardDo(F, { cx, R, Hh, ty, X, chinT, tM, tN, r, fem });
      hairLocks(bl.beard, F.hair, HT, { ...HO, base: 3, soft: Hh * .02, massA: .85, mass: .8, dens: 1.1, lw: .9, erase: [Hh * .035, () => { ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineWidth = Hh * .07; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(X(s * .99, .05), ty(.47)); ctx.lineTo(X(s * .5, .8), ty(tM - .01)); ctx.stroke(); } }] });
      if (bl.mous.length) hairLocks(bl.mous, F.hair, HT, { ...HO, base: 3, soft: Hh * .01, mass: .7, massA: .75, lw: .8 }); }
    hairLocks(hd.front, F.hair, HT, { ...HO, base: 3, soft: hd.soft ?? .3, mass: hd.mass ?? .9, grey: F.grey });
    if (F.grey) { const gl = hd.front.filter(() => r() < F.grey); hairLocks(gl, '#B8B0A8', HT, { ...HO, base: 6, soft: 0, mass: 0, massA: 0, dens: .35, alpha: .7 }); }

    // 6. a circlet, or Eric's crown, in worked gold
    const gold = (x0, y0g, x1, y1g) => { const g = ctx.createLinearGradient(x0, y0g, x1, y1g); g.addColorStop(0, '#7A4E14'); g.addColorStop(.3, '#E8C060'); g.addColorStop(.5, '#FFF0B0'); g.addColorStop(.65, '#C89238'); g.addColorStop(1, '#6A4210'); return g; };
    const gem = (x, y, rr, c) => { const g = ctx.createRadialGradient(x + rr * .3, y - rr * .3, 0, x, y, rr); g.addColorStop(0, shade(c, .6)); g.addColorStop(.5, c); g.addColorStop(1, shade(c, -.6)); ctx.fillStyle = g; circle(x, y, rr); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(x + rr * .35, y - rr * .35, rr * .22); ctx.fill(); };
    if (F.circ) into(main, () => { const yy = ty(.2), g = gold(cx, yy - 1, cx, yy + 1); ctx.strokeStyle = 'rgba(30,14,4,.5)'; ctx.lineWidth = Hh * .03; ctx.beginPath(); ctx.moveTo(X(-1.05, 0), ty(.3)); ctx.quadraticCurveTo(X(0, 1.1), ty(.12), X(1.05, 0), ty(.3)); ctx.stroke(); ctx.strokeStyle = g; ctx.lineWidth = Hh * .022; ctx.stroke(); gem(X(0, 1.1), ty(.205), Hh * .022, '#A0203A'); }, HT);
    if (F.crown) into(main, () => { const cy2 = ty(.03), bw2 = R * 1.12, bh = Hh * .07;
      ctx.fillStyle = 'rgba(20,10,4,.45)'; ctx.fillRect(cx - bw2, cy2 + bh * .9, bw2 * 2, Hh * .02);
      ctx.beginPath(); ctx.moveTo(cx - bw2, cy2 + bh); for (let k = 0; k <= 8; k++) { const x = cx - bw2 + k * bw2 / 4; ctx.lineTo(x - bw2 * .06, cy2); ctx.lineTo(x, cy2 - (k % 2 ? Hh * .05 : Hh * .12)); ctx.lineTo(x + bw2 * .06, cy2); } ctx.lineTo(cx + bw2, cy2 + bh); ctx.quadraticCurveTo(cx, cy2 + bh * 1.4, cx - bw2, cy2 + bh); ctx.closePath();
      ctx.fillStyle = gold(cx - bw2, cy2, cx + bw2, cy2 + bh); ctx.fill(); ctx.fillStyle = 'rgba(30,14,0,.35)'; ctx.fillRect(cx - bw2, cy2 + bh * .2, bw2 * .6, bh);
      for (let k = 0; k <= 8; k += 2) { const x = cx - bw2 + k * bw2 / 4; gem(x, cy2 - Hh * .12, Hh * .014, '#F0E6C8'); }
      gem(cx, cy2 + bh * .5, Hh * .022, '#C01C34'); gem(cx - bw2 * .55, cy2 + bh * .55, Hh * .016, '#1C4AB0'); gem(cx + bw2 * .55, cy2 + bh * .55, Hh * .016, '#1C4AB0'); }, HT);

    // 7. the brushwork, laid over all of it, then the finish
    brushwork(main, w, h, r, [cx, ty(.56), R * 1.05, Hh * .55]);
    // 7. the finish: an old varnish, warm and a little yellowed, darkening toward the edges; the gold-leaf device
    into(main, () => {
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(200,150,70,.45)'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply'; const vg = ctx.createRadialGradient(cx + 3, h * .4, h * .2, cx, h * .45, h * .78); vg.addColorStop(0, 'rgba(255,250,240,0)'); vg.addColorStop(.6, 'rgba(120,90,60,.25)'); vg.addColorStop(1, 'rgba(30,18,8,.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPat(ctx); ctx.globalAlpha = .1; ctx.save(); ctx.scale(1 / PS, 1 / PS); ctx.fillRect(0, 0, w * PS, h * PS); ctx.restore(); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over'; emblem(F.em, w * .13, h * .085, w * .0085, 'leaf');
    });
  }
  // The brushwork: short strokes of the painting's own colour laid over it, lying along the forms (across the way the
  // light changes) and broader in the background and the cloth than in the face, and never across a hard edge, so the
  // features stay crisp. The colours come from one read of the canvas, so it costs a few thousand strokes and no more.
  function brushwork(g, w, h, r, face) {
    const W = g.canvas.width, H = g.canvas.height, D = g.getImageData(0, 0, W, H).data, at = (x, y) => { const i = ((clamp(y | 0, 0, H - 1) * W) + clamp(x | 0, 0, W - 1)) * 4; return i; };
    const lum = (i) => D[i] * .3 + D[i + 1] * .59 + D[i + 2] * .11;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineCap = 'round';
    const n = Math.round(w * h / 4);
    for (let q = 0; q < n; q++) { const ux = r() * w, uy = r() * h, fx = (ux - face[0]) / face[2], fy = (uy - face[1]) / face[3], inFace = fx * fx + fy * fy < 1;
      const k = inFace ? .4 : 1, px = ux * PS, py = uy * PS, st = Math.max(1, PS * .5), i0 = at(px, py);
      const gx = lum(at(px + st, py)) - lum(at(px - st, py)), gy = lum(at(px, py + st)) - lum(at(px, py - st)), gm = Math.hypot(gx, gy);
      if (gm > (inFace ? 14 : 30)) continue;
      const ang = gm > 3 ? Math.atan2(gy, gx) + Math.PI / 2 : -1.05 + (r() - .5) * .6, len = (1 + r() * 1.6) * k * PS, wd = (.35 + r() * .5) * k * PS, j = (r() - .5) * 14;
      g.strokeStyle = `rgba(${clamp(D[i0] + j, 0, 255) | 0},${clamp(D[i0 + 1] + j, 0, 255) | 0},${clamp(D[i0 + 2] + j * .9, 0, 255) | 0},${inFace ? .22 : .4})`; g.lineWidth = wd;
      g.beginPath(); g.moveTo(px - Math.cos(ang) * len / 2, py - Math.sin(ang) * len / 2); g.lineTo(px + Math.cos(ang) * len / 2, py + Math.sin(ang) * len / 2); g.stroke(); }
    g.restore();
  }
  let GRAIN = null;
  function grainPat(g) { // a fine canvas weave and grain, for the varnish to sit in
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 96; const q = GRAIN.getContext('2d'), d = q.createImageData(96, 96), rr = rng(99);
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const i = (y * 96 + x) * 4, wv = ((x % 3 === 0) ? 18 : 0) + ((y % 3 === 0) ? 18 : 0), v = clamp(128 + (rr() - .5) * 90 + wv - 12, 0, 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      q.putImageData(d, 0, 0); }
    return g.createPattern(GRAIN, 'repeat');
  }
  // the locks of each hairstyle, as spines over the head: front (over the face and shoulders) and back (behind them)
  function hairDo(F, G) {
    const { cx, R, Hh, ty, X, chinT, syw, r } = G, back = [], front = [], st = F.hstyle, vol = F.vol ?? .5, len = F.len ?? .3, wv = F.wave || 0;
    const hc = cx - syw * R * .25, hl = F.hl ?? .16, rc = F.recede || 0;
    const so = (a, lift = 1) => [hc + R * 1.0 * lift * Math.sin(a), ty(.43) - Hh * .45 * lift * Math.cos(a)]; // a point on the skull's outline
    const hline = (u) => { const au = Math.abs(u), s = Math.sign(u) || 1; // the hairline, across the brow and down to the ear
      if (au < .6) { const k = au / .6; return [X(u / .6 * .8, .55), ty(hl + .04 * k * k + rc * k * k)]; }
      const k = (au - .6) / .4; return [hc + s * R * lerp(.84, 1.0, k), ty(lerp(hl + .04 + rc, .52, k))]; };
    if (st === 'crop' || st === 'slick' || st === 'shaggy') {
      const n = 48, lift = 1 + .04 * vol, comb = st === 'slick' ? -Hh * .07 : -Hh * .025;
      for (let i = 0; i < n; i++) { const u = -1 + 2 * (i + .2 + r() * .6) / n, au = Math.abs(u), o = so(u * 1.45, lift), e = hline(u), m = [lerp(o[0], e[0], .5) + (o[0] - hc) * .1 + comb * (1 - au), lerp(o[1], e[1], .5) - Hh * .03 * vol];
        if (st === 'shaggy' && au < .72) { const e2 = [e[0] + (r() - .3) * R * .25, e[1] + Hh * (.04 + r() * .1)]; front.push({ p: [o, m, e2], w: [Hh * .12, Hh * .03], n: 20, v1: .25, coh: false }); continue; }
        front.push({ p: [o, m, e], w: [Hh * .11, Hh * .07], n: st === 'slick' ? 20 : 16, v0: .02, v1: .3, coh: false }); }
      for (const s of [-1, 1]) front.push({ p: [[X(s, 0), ty(.4)], [X(s * .99, .04), ty(.5)], [X(s * .97, .1), ty(st === 'slick' ? .63 : .58)]], w: [Hh * .07, Hh * .03], n: 14, v1: .3 });
      if (st === 'shaggy') { for (const s of [-1, 1]) for (let i = 0; i < 7; i++) front.push({ p: [so(s * (1.1 + i * .07), lift), [hc + s * R * (1.13 + .02 * i), ty(.5 + i * .02)], [hc + s * R * (1.04 + r() * .12), ty(.62 + i * .02 + r() * .05)]], w: [Hh * .1, Hh * .03], n: 16, v1: .25 });
        for (let i = 0; i < 16; i++) { const a = (r() - .5) * 2.9; front.push({ p: [so(a * .8, .88), so(a, 1.04 + .04 * vol), so(a + (r() - .3) * .5, 1.12 + .1 * r())], w: [Hh * .09, Hh * .02], n: 10, v1: .2 }); } }
    } else if (st === 'swept') {
      const n = 46, lift = 1 + .07 * vol;
      if (len > .12) for (const s of [-1, 1]) for (let i = 0; i < 8; i++) back.push({ p: [[hc + s * R * .5, ty(.35)], [hc + s * R * (.95 + .03 * i + .05 * vol), ty(.62)], [hc + s * R * (.88 + .05 * i + .1 * vol + (r() - .5) * .1), ty(.78 + len + (r() - .5) * .2)]], w: [Hh * .15, Hh * .03], n: 14, amp: Hh * .015 * wv, fq: 7, ph: i * .3, v1: .35 });
      for (let i = 0; i < n; i++) { const u = -1 + 2 * (i + .2 + r() * .6) / n, au = Math.abs(u), s = Math.sign(u) || 1, e = hline(u), o = so(u * 1.15, lift), up = [lerp(e[0], o[0], .45) + (e[0] - hc) * .12, lerp(e[1], o[1], .5) - Hh * .05 * vol];
        if (au < .55) front.push({ p: [e, up, o, so(u * 1.4, lift * .98)], w: [Hh * .07, Hh * .12], n: 18, amp: Hh * .012 * wv, fq: 6, ph: r() * .5, v0: .28, v1: .05 });
        else { const k = (au - .55) / .45; front.push({ p: [e, [hc + s * R * (1.0 + .06 * vol), ty(.36 + .08 * k)], [hc + s * R * (1.05 + .07 * vol), ty(.5 + .06 * k)], [hc + s * R * (.97 + .05 * vol), ty(.6 + .06 * k + .1 * len)]], w: [Hh * .07, Hh * .05], n: 18, amp: Hh * .01 * wv, fq: 6, ph: i * .3, v0: .28, v1: .2, m: 18 }); } }
    } else { // parted in the middle and falling: long, wavy, to the shoulders, or in curls
      const curls = st === 'curls', yEnd = ty(chinT) + Hh * len, N = 22, lift = 1 + .09 * vol;
      if (!curls) back.push({ p: [[hc, ty(.2)], [hc, ty(.6)], [hc, yEnd - Hh * .15]], w: [R * 2.9, R * 3.1], n: 0, amp: 0 });
      for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const k = i / 8; back.push({ p: [[hc + s * R * .55, ty(.2)], [hc + s * R * (.85 + .3 * k + .1 * vol), ty(.6)], [hc + s * R * (1.2 + .5 * k + .12 * vol), ty(chinT) + Hh * .2], [hc + s * R * (1.35 + .7 * k + .12 * vol), yEnd - Hh * r() * .3]], w: [Hh * .18, Hh * .04], n: 16, v1: .35, amp: Hh * .04 * wv * (curls ? 1.6 : 1), fq: curls ? 14 : 8, ph: i * 1.3, m: 24, shine: .6 }); }
      for (const s of [-1, 1]) for (let i = 0; i < N; i++) { const k = (i + r() * .7) / N, h0 = hline(s * .4), p0 = [hc + s * R * .03, lerp(ty(hl - .01), ty(-.02), k) - Hh * .02 * vol * k];
        const p1 = [lerp(h0[0], so(s * .75, lift)[0], k), lerp(h0[1], so(s * .75, lift)[1], k) - Hh * .015 * vol];
        const p2 = [hc + s * R * (1.04 + .06 * k + .06 * vol), ty(.3)], p3 = [hc + s * R * (1.03 + .1 * k + .06 * vol), ty(.56)];
        const a = Hh * .032 * wv, ph = i * .12 + (s > 0 ? 0 : 1.7);
        if (curls) { front.push({ p: [p0, p1, p2, p3], w: [Hh * .09, Hh * .1], n: 16, amp: Hh * .012, fq: 14, ph, m: 24, v1: .1, shine: .6 }); continue; }
        if (k < .45) { const ex = (r() - .5) * .25; front.push({ p: [p0, p1, p2, p3, [hc + s * R * (1.06 + .25 * k + .12 * vol), ty(chinT - .1)], [hc + s * R * (1.2 + .4 * k + .12 * vol + ex * .5), G.yb + Hh * .02], [hc + s * R * (1.22 + .6 * k + .12 * vol + ex), yEnd + Hh * (r() - .4) * .35]], w: [Hh * .09, Hh * .03], n: 26, amp: a, fq: 10, ph, m: 34, v0: .04, v1: .45, shine: .5 }); }
        else front.push({ p: [p0, p1, p2, p3], w: [Hh * .09, Hh * .04], n: 16, amp: a * .5, fq: 6, ph, m: 18, v0: .04, v1: .35 }); }
      if (curls) for (const s of [-1, 1]) for (let i = 0; i < 11; i++) { const k = i / 10, root = [hc + s * R * (.98 + .2 * k), ty(.3 + .3 * k)], tip = [hc + s * R * (1.1 + .5 * k + r() * .1), ty(chinT) + Hh * (len * (.4 + .5 * k) + r() * .2)];
        (k < .55 ? front : back).push({ p: [root, [lerp(root[0], tip[0], .5) + s * R * .05, lerp(root[1], tip[1], .5)], tip], w: [Hh * .1, Hh * .07], n: 22, amp: Hh * .03, fq: 15 + r() * 3, ph: r() * TAU, m: 32, shine: .9, v1: .05 }); }
      if (curls) for (let i = 0; i < 12; i++) { const a = -1.4 + 2.8 * i / 11; front.push({ p: [so(a * .9, .95), so(a, 1.06 + .05 * vol), so(a * 1.05, 1.12 + .06 * vol)], w: [Hh * .1, Hh * .07], n: 14, amp: Hh * .022, fq: 12, ph: r() * TAU, m: 18, shine: .8 }); }
    }
    return { back, front };
  }
  // a beard: the locks growing down from the cheek and under the lip, over the jaw; and the moustache
  function beardDo(F, G) {
    const { R, Hh, ty, X, chinT, tM, tN, r } = G, beard = [], mous = [], t = F.beard, bl = F.blen ?? .5;
    if (t === 'full' || t === 'short') { const n = t === 'full' ? 44 : 40;
      for (let i = 0; i < n; i++) { const u = -1 + 2 * (i + .2 + r() * .6) / n, au = Math.abs(u), s = Math.sign(u) || 1;
        let root; if (au > .45) { const k = (au - .45) / .55; root = [X(s * lerp(.52, .97, k), lerp(.8, .05, k)), ty(lerp(tM + .02, .5, k) + (r() - .5) * .05)]; } else root = [X(u * 1.15, .92), ty(tM + .065 + r() * .02)];
        const jaw = [X(u * lerp(.72, .92, au), lerp(.95, .3, au)), ty(lerp(chinT - .01, .8, au))], tip = [X(u * (.85 - .3 * bl), .8), ty(chinT) + Hh * (.02 + bl * .3 * (1 - .5 * u * u))];
        tip[1] += (r() - .5) * Hh * .1 * bl; tip[0] += (r() - .5) * R * .1; beard.push({ fade: au > .4, p: [root, jaw, tip], w: [Hh * .08, Hh * .025], n: t === 'full' ? 22 : 14, amp: Hh * .006, fq: 10, ph: r() * 6, coh: false, v0: .35, v1: .4, m: 14 }); } }
    if (t === 'goatee') for (let i = 0; i < 16; i++) { const u = -.3 + .6 * (i + r() * .5) / 16; beard.push({ p: [[X(u, .93), ty(tM + .06)], [X(u * .75, .9), ty(chinT - .02)], [X(u * .15, .85), ty(chinT) + Hh * .2 * bl]], w: [Hh * .05, Hh * .02], n: 16, v0: .3, m: 12 }); }
    const mN = 16, ml = t === 'goatee' ? .07 : t === 'short' ? .015 : .045;
    for (const s of [-1, 1]) for (let i = 0; i < mN; i++) { const k = (i + r() * .6) / mN;
      const rx = .02 + .26 * k, ry = ty(tN + .03 + .012 * k); mous.push({ p: [[X(s * rx, 1), ry], [X(s * (rx + .08 + .05 * k), .95), lerp(ry, ty(tM), .55)], [X(s * (rx + .12 + .1 * k), .85), ty(tM + .005 + ml * k * k)]], w: [Hh * .04, Hh * .01], n: 10, v0: .2, v1: .3, m: 12 }); }
    return { beard, mous };
  }
  // what they wear: cut, folds and sheen of the cloth, then its trim, laid on as a layer of its own
  function paintDress(F, G) {
    const { cx, R, Hh, yb, sW, nW, chinT, ty, r, w, h, sk, lit } = G, D = F.dress, rb = F.robe, tr = F.trim, main = ctx;
    const torso = () => { ctx.beginPath(); ctx.moveTo(cx - sW * .97, h + 2); ctx.bezierCurveTo(cx - sW * 1.03, yb + Hh * .7, cx - sW * 1.05, yb + Hh * .32, cx - sW * .86, yb + Hh * .2); ctx.bezierCurveTo(cx - sW * .55, yb + Hh * .08, cx - nW * 1.6, yb - Hh * .02, cx - nW * 1.02, yb - Hh * .14); ctx.quadraticCurveTo(cx, yb + Hh * .02, cx + nW * 1.02, yb - Hh * .14); ctx.bezierCurveTo(cx + nW * 1.6, yb - Hh * .02, cx + sW * .55, yb + Hh * .08, cx + sW * .86, yb + Hh * .2); ctx.bezierCurveTo(cx + sW * 1.05, yb + Hh * .32, cx + sW * 1.03, yb + Hh * .7, cx + sW * .97, h + 2); ctx.closePath(); };
    const low = { gownNeck: .34, gownLow: .44, pearls: .3, vest: 1.2 }[D], nx = D === 'vest' ? sW * .36 : sW * .5;
    const neckline = () => { ctx.beginPath(); ctx.moveTo(cx - nx, yb - Hh * .3); ctx.lineTo(cx - nx, yb + Hh * .03); ctx.bezierCurveTo(cx - nx * .75, yb + Hh * low * .6, cx - nx * .35, yb + Hh * low, cx, yb + Hh * low); ctx.bezierCurveTo(cx + nx * .35, yb + Hh * low, cx + nx * .75, yb + Hh * low * .6, cx + nx, yb + Hh * .03); ctx.lineTo(cx + nx, yb - Hh * .3); ctx.closePath(); };
    const shadeX = (x) => clamp((x - cx) / sW, -1, 1);
    const C = into(layer('cloth'), () => {
      torso(); const g = ctx.createLinearGradient(cx - sW, 0, cx + sW, 0); g.addColorStop(0, shade(rb, -.5)); g.addColorStop(.45, shade(rb, -.12)); g.addColorStop(.8, rb); g.addColorStop(1, mix(rb, '#FFF0D8', .2)); ctx.fillStyle = g; ctx.fill();
      if (D === 'mail') { ctx.fillStyle = '#3A3E46'; torso(); ctx.fill(); }
      if (low) { ctx.globalCompositeOperation = 'destination-out'; neckline(); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      if (D === 'vest') { // the shirt, open at the throat, between the coat's fronts
        for (const s of [-1, 1]) { const sg = ctx.createLinearGradient(cx - nx, 0, cx + nx, 0); sg.addColorStop(0, '#8A8478'); sg.addColorStop(.6, '#E8E2D4'); sg.addColorStop(1, '#F6F2E8'); ctx.fillStyle = sg;
          ctx.beginPath(); ctx.moveTo(cx + s * nW * 1.2, yb - Hh * .07); ctx.quadraticCurveTo(cx + s * nW * .7, yb + Hh * .08, cx + s * nW * .12, yb + Hh * .3); ctx.lineTo(cx + s * nW * .2, h + 2); ctx.lineTo(cx + s * nx * 1.1, h + 2); ctx.lineTo(cx + s * nx * 1.05, yb); ctx.closePath(); ctx.fill();
          ctx.fillStyle = s > 0 ? '#F4F0E6' : '#B8B2A6'; ctx.beginPath(); ctx.moveTo(cx + s * nW * 1.2, yb - Hh * .07); ctx.lineTo(cx + s * nW * 1.6, yb + Hh * .12); ctx.lineTo(cx + s * nW * .55, yb + Hh * .2); ctx.closePath(); ctx.fill(); } }
      if (D === 'mail') { // mail, ring on ring, then the surcoat over it from the breast down
        ctx.save(); torso(); ctx.clip(); ctx.lineWidth = .22;
        for (let y = yb - Hh * .08, row = 0; y < h + 1; y += .78, row++) for (let x = cx - sW - 4 + (row % 2) * .5; x < cx + sW + 4; x += 1) { const L = shadeX(x) * .5 + .5;
          ctx.strokeStyle = `rgba(${30 + L * 40 | 0},${34 + L * 42 | 0},${40 + L * 46 | 0},.9)`; ctx.beginPath(); ctx.arc(x, y, .5, Math.PI * .05, Math.PI * .95); ctx.stroke();
          ctx.strokeStyle = `rgba(${150 + L * 100 | 0},${160 + L * 95 | 0},${170 + L * 85 | 0},${.25 + L * .5})`; ctx.beginPath(); ctx.arc(x, y - .1, .45, -Math.PI * .85, -Math.PI * .35); ctx.stroke(); }
        ctx.restore();
        const sg = ctx.createLinearGradient(cx - sW, 0, cx + sW, 0); sg.addColorStop(0, shade(rb, -.55)); sg.addColorStop(.5, shade(rb, -.1)); sg.addColorStop(.85, rb); sg.addColorStop(1, shade(rb, .2)); ctx.fillStyle = sg;
        ctx.beginPath(); ctx.moveTo(cx - sW * .7, h + 2); ctx.lineTo(cx - sW * .6, yb + Hh * .72); ctx.quadraticCurveTo(cx, yb + Hh * .86, cx + sW * .6, yb + Hh * .72); ctx.lineTo(cx + sW * .7, h + 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = tr; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(cx - sW * .6, yb + Hh * .72); ctx.quadraticCurveTo(cx, yb + Hh * .86, cx + sW * .6, yb + Hh * .72); ctx.stroke(); }
      if (D === 'scale') { // white scale, lapped row over row, each scale catching the light
        ctx.save(); torso(); ctx.clip(); const sw2 = 2.5, sh2 = 2.1, rows = [];
        for (let y = yb - Hh * .1, row = 0; y < h + 2; y += sh2 * .62, row++) rows.push([y, row]);
        for (let q = rows.length - 1; q >= 0; q--) { const [y, row] = rows[q]; for (let x = cx - sW - 4 + (row % 2) * sw2 / 2; x < cx + sW + 4; x += sw2) { const L = shadeX(x) * .5 + .5 + (r() - .5) * .08, c = mix(mix('#6A6E6A', rb, .5), '#FFFFF6', L * .9);
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - sw2 / 2, y); ctx.lineTo(x - sw2 / 2, y + sh2 * .4); ctx.quadraticCurveTo(x - sw2 / 2, y + sh2, x, y + sh2 * 1.04); ctx.quadraticCurveTo(x + sw2 / 2, y + sh2, x + sw2 / 2, y + sh2 * .4); ctx.lineTo(x + sw2 / 2, y); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = `rgba(40,50,44,${.35 + (1 - L) * .3})`; ctx.lineWidth = .14; ctx.stroke(); ctx.fillStyle = `rgba(255,255,250,${.15 + L * .45})`; ell(x + sw2 * .14, y + sh2 * .6, sw2 * .18, sh2 * .14, -.4); ctx.fill();
          ctx.fillStyle = `rgba(30,40,34,${.2 + (1 - L) * .2})`; ctx.fillRect(x - sw2 / 2, y, sw2, sh2 * .22); } }
        ctx.restore(); }
    });
    // the folds and the light on the cloth
    const velvet = /gown|royal|doublet|pearls|highCollar|chain/.test(D);
    glaze(C, 3, 'source-atop', () => { ctx.fillStyle = 'rgba(8,6,16,.5)'; ell(cx - sW * 1.15, yb + Hh * .9, sW * .75, Hh * 1.3); ctx.fill(); const bg2 = ctx.createLinearGradient(0, h * .8, 0, h); bg2.addColorStop(0, 'rgba(0,0,0,0)'); bg2.addColorStop(1, 'rgba(6,4,10,.45)'); ctx.fillStyle = bg2; ctx.fillRect(0, h * .8, w, h * .2); });
    glaze(C, 1.8, 'source-atop', () => { ctx.fillStyle = `rgba(255,236,200,${D === 'scale' ? .2 : .3})`; ell(cx + sW * .62, yb + Hh * .17, sW * .32, Hh * .1); ctx.fill(); ctx.fillStyle = 'rgba(12,6,14,.5)'; ell(cx - R * .25, yb + Hh * .05, nW * 1.9, Hh * .13); ctx.fill(); for (const s of [-1, 1]) { ctx.strokeStyle = `rgba(8,4,10,${s < 0 ? .45 : .3})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx + s * sW * .66, yb + Hh * .3); ctx.quadraticCurveTo(cx + s * sW * .7, yb + Hh * .8, cx + s * sW * .6, h + 2); ctx.stroke(); } });
    glaze(C, 1.1, 'source-atop', () => { ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const sd = i % 2 ? 1 : -1, x0 = cx + sd * sW * (.25 + r() * .55), y0 = yb + Hh * (.15 + r() * .2), x1 = cx + sd * sW * (.05 + r() * .3), bend = sd * (1 + r() * 3), L = shadeX(x0) * .5 + .5;
        ctx.strokeStyle = `rgba(0,0,0,${.16 + (1 - L) * .12})`; ctx.lineWidth = 1.2 + r() * 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + bend, (y0 + h) / 2, x1, h + 2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,240,220,${(velvet ? .1 : .06) + L * (velvet ? .16 : .08)})`; ctx.lineWidth = .8 + r() * .8; ctx.beginPath(); ctx.moveTo(x0 + 1.4, y0 + .5); ctx.quadraticCurveTo(x0 + bend + 1.4, (y0 + h) / 2, x1 + 1.4, h + 2); ctx.stroke(); } });
    glaze(C, .8, 'source-atop', () => { for (const s of [-1, 1]) { ctx.strokeStyle = s > 0 ? `rgba(255,236,200,${D === 'leather' ? .3 : .18})` : 'rgba(255,236,200,.06)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + s * nW * 1.4, yb - Hh * .02); ctx.quadraticCurveTo(cx + s * sW * .5, yb + Hh * .06, cx + s * sW * .88, yb + Hh * .24); ctx.stroke(); } });
    // the trim and what is worn over the cloth
    into(C, () => {
      const collar = (fill, ht, edge) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(cx - nW * 1.03, yb - Hh * .17); ctx.quadraticCurveTo(cx, yb - Hh * .05, cx + nW * 1.03, yb - Hh * .17); ctx.lineTo(cx + nW * 1.14, yb - Hh * (.17 - ht)); ctx.quadraticCurveTo(cx, yb + Hh * (ht - .03), cx - nW * 1.14, yb - Hh * (.17 - ht)); ctx.closePath(); ctx.fill(); if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = .3; ctx.stroke(); } };
      const goldG = (x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#6A4612'); g.addColorStop(.55, '#D8B050'); g.addColorStop(.8, '#FFF0B0'); g.addColorStop(1, '#B08030'); return g; };
      const bead = (x, y, rr, c) => { const g = ctx.createRadialGradient(x + rr * .35, y - rr * .35, 0, x, y, rr); g.addColorStop(0, shade(c, .7)); g.addColorStop(.45, c); g.addColorStop(1, shade(c, -.55)); ctx.fillStyle = g; circle(x, y, rr); ctx.fill(); };
      if (low && D !== 'vest') { ctx.strokeStyle = D === 'gownLow' ? '#F0E6C0' : tr; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(cx - nx, yb + Hh * .03); ctx.bezierCurveTo(cx - nx * .75, yb + Hh * low * .6, cx - nx * .35, yb + Hh * low, cx, yb + Hh * low); ctx.bezierCurveTo(cx + nx * .35, yb + Hh * low, cx + nx * .75, yb + Hh * low * .6, cx + nx, yb + Hh * .03); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .3; ctx.stroke(); }
      if (D === 'leather') { ctx.fillStyle = '#2E241C'; ctx.beginPath(); ctx.moveTo(cx - nW * .8, yb - Hh * .02); ctx.lineTo(cx, yb + Hh * .38); ctx.lineTo(cx + nW * .8, yb - Hh * .02); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#B89060'; ctx.lineWidth = .3; for (let i = 0; i < 4; i++) { const y = yb + Hh * (.05 + i * .075), hw = nW * .7 * (1 - i * .22); ctx.beginPath(); ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y + Hh * .06); ctx.moveTo(cx + hw, y); ctx.lineTo(cx - hw, y + Hh * .06); ctx.stroke(); }
        ctx.setLineDash([.6, .5]); ctx.strokeStyle = 'rgba(220,180,120,.4)'; ctx.lineWidth = .2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * nW * 1.3, yb); ctx.quadraticCurveTo(cx + s * sW * .6, yb + Hh * .08, cx + s * sW * .9, yb + Hh * .3); ctx.stroke(); } ctx.setLineDash([]);
        bead(cx - sW * .55, yb + Hh * .2, 1.6, '#B08848'); ctx.strokeStyle = 'rgba(40,24,8,.6)'; ctx.lineWidth = .25; circle(cx - sW * .55, yb + Hh * .2, 1.1); ctx.stroke(); }
      if (D === 'vest') { ctx.strokeStyle = tr; ctx.lineWidth = .45; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * nx, yb + Hh * .03); ctx.lineTo(cx + s * nx * 1.05, h); ctx.stroke(); } for (let i = 0; i < 3; i++) bead(cx + nx * 1.18, yb + Hh * (.4 + i * .25), .7, '#C8A050'); }
      if (D === 'gownHigh') { const cy0 = ty(chinT) + Hh * .14; ctx.fillStyle = goldG(cx - nW * 1.2, cx + nW * 1.2); ctx.beginPath(); ctx.moveTo(cx - nW * 1.12, cy0); ctx.quadraticCurveTo(cx, cy0 + Hh * .05, cx + nW * 1.12, cy0); ctx.lineTo(cx + nW * 1.3, yb + Hh * .06); ctx.quadraticCurveTo(cx, yb + Hh * .14, cx - nW * 1.3, yb + Hh * .06); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(rb, -.2); ctx.beginPath(); ctx.moveTo(cx - nW * 1.05, cy0 + Hh * .035); ctx.quadraticCurveTo(cx, cy0 + Hh * .08, cx + nW * 1.05, cy0 + Hh * .035); ctx.lineTo(cx + nW * 1.15, yb + Hh * .02); ctx.quadraticCurveTo(cx, yb + Hh * .1, cx - nW * 1.15, yb + Hh * .02); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 9; i++) bead(cx - nW + i * nW / 4, yb - Hh * .01 + Math.abs(i - 4) * -.3 + Hh * .04, .35, '#F0D890');
        ctx.fillStyle = goldG(cx - 1.4, cx + 1.4); ctx.fillRect(cx - 1, yb + Hh * .12, 2, h); for (let y = yb + Hh * .2; y < h; y += 3) bead(cx, y, .45, '#E8D090'); }
      if (D === 'doublet' || D === 'royal') { collar(goldG(cx - nW * 1.2, cx + nW * 1.2), .07, 'rgba(60,36,6,.6)');
        for (let i = 0; i < 6; i++) { const y = yb + Hh * (.14 + i * .12); ctx.strokeStyle = goldG(cx - 4, cx + 4); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(cx - 3.6, y); ctx.quadraticCurveTo(cx, y + .6, cx + 3.6, y); ctx.stroke(); bead(cx, y + .3, .7, '#E0B850'); } }
      if (D === 'royal') { for (const s of [-1, 1]) { const fg = ctx.createLinearGradient(cx + s * sW, 0, cx + s * sW * .5, 0); fg.addColorStop(0, '#08060A'); fg.addColorStop(1, s > 0 ? '#2E2A30' : '#141016'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(cx + s * nW * 1.25, yb - Hh * .04); ctx.quadraticCurveTo(cx + s * sW * .7, yb + Hh * .02, cx + s * (sW + 2), yb + Hh * .35); ctx.lineTo(cx + s * (sW + 4), h + 2); ctx.lineTo(cx + s * sW * .62, h + 2); ctx.quadraticCurveTo(cx + s * sW * .45, yb + Hh * .3, cx + s * nW * 1.25, yb - Hh * .04); ctx.fill();
          ctx.lineWidth = .18; for (let i = 0; i < 120; i++) { const t = r(), x = lerp(cx + s * nW * 1.3, cx + s * sW * .95, t) + (r() - .5) * 3, y = yb + Hh * (.02 + t * .3) + r() * Hh * .5; ctx.strokeStyle = `rgba(${r() < .5 ? '90,84,96' : '10,8,12'},${.4 + r() * .4})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * .3, y + .9); ctx.stroke(); } }
        ctx.lineCap = 'round'; for (let i = 0; i <= 22; i++) { const a = Math.PI * i / 22, x = cx - Math.cos(a) * sW * .5, y = yb + Hh * .06 + Math.sin(a) * Hh * .42; ctx.strokeStyle = goldG(x - .8, x + .8); ctx.lineWidth = .4; ell(x, y, .75, .5, a + Math.PI / 2 * (i % 2)); ctx.stroke(); }
        const my = yb + Hh * .5; bead(cx, my, 2.2, '#D8A840'); bead(cx, my, 1.2, '#E8C060'); bead(cx, my, .6, '#B01830'); }
      if (D === 'chain') { ctx.lineCap = 'round'; for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18, x = cx - Math.cos(a) * sW * .58, y = yb + Hh * .02 + Math.sin(a) * Hh * .45, L = shadeX(x) * .5 + .5; ctx.strokeStyle = `rgb(${100 + L * 140 | 0},${108 + L * 136 | 0},${118 + L * 130 | 0})`; ctx.lineWidth = .45; ell(x, y, .95, .6, a + Math.PI / 2 * (i % 2)); ctx.stroke(); ctx.strokeStyle = 'rgba(10,14,12,.5)'; ctx.lineWidth = .15; ctx.stroke(); }
        collar(shade(rb, -.35), .07, tr); }
      if (D === 'highCollar') { for (const s of [-1, 1]) { const cg = ctx.createLinearGradient(cx + s * nW * 1.6, 0, cx + s * nW * .3, 0); cg.addColorStop(0, '#040806'); cg.addColorStop(1, s > 0 ? shade(rb, .1) : shade(rb, -.4)); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx + s * nW * .35, yb + Hh * .1); ctx.lineTo(cx + s * nW * 1.25, ty(chinT) + Hh * .02); ctx.lineTo(cx + s * nW * 1.65, ty(chinT) + Hh * .06); ctx.lineTo(cx + s * nW * 1.5, yb + Hh * .12); ctx.quadraticCurveTo(cx + s * nW, yb + Hh * .2, cx + s * nW * .35, yb + Hh * .1); ctx.fill(); ctx.strokeStyle = rgba(tr, .5); ctx.lineWidth = .25; ctx.stroke(); }
        for (let i = 0; i < 5; i++) { const y = yb + Hh * (.18 + i * .14); bead(cx - 1.2, y, .45, '#C8D4D0'); bead(cx + 1.2, y, .45, '#C8D4D0'); ctx.strokeStyle = 'rgba(200,212,208,.7)'; ctx.lineWidth = .25; ctx.beginPath(); ctx.moveTo(cx - 1.2, y); ctx.lineTo(cx + 1.2, y); ctx.stroke(); } }
      if (D === 'scale') { const gg = ctx.createLinearGradient(cx - nW * 1.3, 0, cx + nW * 1.3, 0); gg.addColorStop(0, '#7A7E78'); gg.addColorStop(.6, '#E8E6DC'); gg.addColorStop(1, '#FFFFF4'); collar(gg, .11, tr); }
      if (D === 'gownNeck') { ctx.strokeStyle = 'rgba(220,226,236,.85)'; ctx.lineWidth = .22; ctx.beginPath(); ctx.moveTo(cx - nW * .95, yb - Hh * .04); ctx.quadraticCurveTo(cx, yb + Hh * .16, cx + nW * .95, yb - Hh * .04); ctx.stroke(); bead(cx, yb + Hh * .12, .9, '#5A7AD0'); ctx.strokeStyle = 'rgba(230,236,246,.8)'; ctx.lineWidth = .2; circle(cx, yb + Hh * .12, 1.05); ctx.stroke(); }
      if (D === 'gownLow') { for (let i = 0; i < 9; i++) { const t = i / 8, x = lerp(cx - nx * .9, cx + nx * .9, t), y = yb + Hh * (.04 + low * Math.sin(t * Math.PI) * .95); const c = ['#F0A0B8', '#FFFFFF', '#F2E26A'][i % 3]; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; bead(x + Math.cos(a) * .55, y + Math.sin(a) * .55, .42, c); } bead(x, y, .25, '#E8B040'); } }
      if (D === 'pearls') for (const [k, n] of [[.07, 15], [.14, 19]]) for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; bead(cx - Math.cos(a) * nW * (1.02 + k * 2), yb - Hh * .03 + Math.sin(a) * Hh * (k + .04), .5, '#EEEAE0'); }
    });
    blurTo(main, C, .04);
    glaze(main, .7, 'source-over', () => { ctx.strokeStyle = 'rgba(20,10,8,.35)'; ctx.lineWidth = .8; ctx.beginPath(); if (low && D !== 'vest') { ctx.moveTo(cx - nx, yb + Hh * .03); ctx.bezierCurveTo(cx - nx * .75, yb + Hh * low * .6, cx - nx * .35, yb + Hh * low, cx, yb + Hh * low); ctx.bezierCurveTo(cx + nx * .35, yb + Hh * low, cx + nx * .75, yb + Hh * low * .6, cx + nx, yb + Hh * .03); } else { ctx.moveTo(cx - nW * 1.1, yb - Hh * .04); ctx.quadraticCurveTo(cx, yb + Hh * .02, cx + nW * 1.1, yb - Hh * .04); } ctx.stroke(); });
    void lit; void sk;
  }
  function paintBack(w, h) { // the back of every Trump: midnight blue, a lattice tooled in silver, the Pattern and his rose
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#222C5E'); g.addColorStop(1, '#0A0E26'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(w * .08, h * .06, w * .84, h * .88); ctx.clip(); ctx.strokeStyle = 'rgba(200,212,236,.16)'; ctx.lineWidth = .5;
    for (let d = -h; d < w + h; d += 6) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.moveTo(d, h); ctx.lineTo(d + h, 0); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = '#C8D0E0'; ctx.lineWidth = .8; rrect(w * .08, h * .06, w * .84, h * .88, 2); ctx.stroke(); rrect(w * .12, h * .085, w * .76, h * .83, 1.5); ctx.stroke();
    ctx.fillStyle = '#10163A'; circle(w / 2, h / 2, w * .25); ctx.fill(); ctx.strokeStyle = '#D8DEEA'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(210,220,240,.7)'; ctx.lineWidth = .6; for (let r = 0; r < 3; r++) { const R = w * (.2 - r * .045); ctx.beginPath(); ctx.arc(w / 2, h / 2, R, r * 1.3 + .4, r * 1.3 + .4 + TAU * .82); ctx.stroke(); } // the Pattern's turns
    silverRose(w / 2, h / 2 + 1, w * .045, true);
  }

  // ---------------- the three roads: the moon's card is painted here; the other two are their worlds' own ----------------
  function moonDraw(c, w, h, t) { // the ghost of Amber in the sky, the full moon over it, and a phantom on its stair
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#080E2C'); g.addColorStop(.5, '#22306A'); g.addColorStop(.78, '#4A5A90'); g.addColorStop(1, '#1A2246'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) { c.fillStyle = `rgba(235,240,255,${.25 + hsh(i + 3) * .45})`; circle(hsh(i) * w, hsh(i + 9) * h * .45, Math.max(.3, w * .006)); c.fill(); }
    const mx = w * .68, my = h * .19, mr = w * .15;
    c.fillStyle = 'rgba(220,230,255,.12)'; circle(mx, my, mr * 1.35); c.fill(); c.fillStyle = '#F2F5FB'; circle(mx, my, mr); c.fill();
    c.fillStyle = 'rgba(160,172,200,.55)'; circle(mx - mr * .3, my - mr * .1, mr * .22); c.fill(); circle(mx + mr * .35, my + mr * .3, mr * .16); c.fill(); circle(mx + mr * .1, my - mr * .45, mr * .1); c.fill();
    for (let i = 0; i < 3; i++) { const cy = h * (.28 + i * .05), dx = ((t * (4 + i * 2) + i * 40) % (w * 1.6)) - w * .3; c.fillStyle = `rgba(70,84,130,${.5 - i * .1})`; ell(dx, cy, w * .3, h * .018); c.fill(); }
    const by = h * .55; // the city, standing on a bank of cloud, pale and not quite there
    c.save(); c.globalAlpha = .78 + .12 * Math.sin(t * 1.3);
    c.fillStyle = '#C8D4EE'; c.beginPath(); c.moveTo(w * .08, by);
    for (const [x, ht, sp] of [[.12, .1, 0], [.2, .17, 1], [.28, .12, 0], [.36, .24, 1], [.44, .15, 0], [.5, .3, 1], [.57, .18, 0], [.64, .22, 1], [.72, .12, 0], [.8, .16, 1], [.88, .09, 0]]) {
      const X = w * x, H = h * ht, bw = w * .035; c.lineTo(X - bw, by - H * .7); if (sp) { c.lineTo(X - bw * .6, by - H * .7); c.lineTo(X, by - H); c.lineTo(X + bw * .6, by - H * .7); } else { c.lineTo(X - bw, by - H); c.lineTo(X + bw, by - H); } c.lineTo(X + bw, by - H * .7); }
    c.lineTo(w * .92, by); c.closePath(); c.fill(); outline(.5);
    c.fillStyle = 'rgba(255,248,220,.85)'; for (let i = 0; i < 14; i++) { const x = w * (.14 + hsh(i + 40) * .72), y = by - h * (.03 + hsh(i + 50) * .12); c.fillRect(x, y, Math.max(.5, w * .01), Math.max(.8, h * .012)); }
    c.restore();
    c.fillStyle = 'rgba(200,210,236,.9)'; for (let i = 0; i < 7; i++) { ell(w * (.04 + i * .16), by + h * .02, w * .13, h * .028); c.fill(); }
    c.save(); c.globalCompositeOperation = 'lighter'; // the stair of moonlight coming down out of the city
    for (let i = 0; i < 14; i++) { const u = i / 13, x = lerp(w * .5, w * .16, u), y = lerp(by + h * .04, h * .97, u), sw = lerp(w * .08, w * .26, u); c.fillStyle = `rgba(210,222,255,${.32 - u * .12})`; c.fillRect(x - sw / 2, y, sw, Math.max(.6, h * .012)); }
    c.restore();
    const gx = lerp(w * .5, w * .16, .52), gy = lerp(by + h * .04, h * .97, .52); // the phantom keeping watch on it: tall, one arm silver, the sword point down
    c.save(); c.globalAlpha = .7 + .15 * Math.sin(t * 2); c.fillStyle = '#DCE6FA'; c.translate(gx, gy); const s = h / 100;
    c.beginPath(); c.moveTo(-2.6 * s, 0); c.lineTo(-1.8 * s, -9 * s); c.lineTo(-2.4 * s, -13 * s); c.lineTo(2.4 * s, -13 * s); c.lineTo(1.8 * s, -9 * s); c.lineTo(2.6 * s, 0); c.closePath(); c.fill(); circle(0, -15 * s, 1.8 * s); c.fill();
    c.strokeStyle = '#F4F8FF'; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(4 * s, -11 * s); c.lineTo(4 * s, 1 * s); c.stroke(); c.restore();
  }
  BR.push({ stage: 5, id: 'moon', name: "TIR-NA NOG'TH", focus: .68,
    line: "The moon is full over Kolvir, and the ghost of Amber hangs in the sky above it. On its stair a phantom of Benedict keeps watch, and what the city shows you may never be.",
    go: 'He held up the moon, and looked into it until it was cold under his fingers, and the city on it began to move.',
    draw: (c, w, h, t) => moonDraw(c, w, h, t),
    relic: { key: 'silverArm', name: "Benedict's silver arm", desc: 'Fight bare-handed to wear it. Stronger every cycle.' } });
  // stand-ins, painted, for a world whose files have not registered a card yet; they can be picked only once its STAGES entry is there
  const STUBS = {
    6: { stage: 6, id: 'rebma', name: 'REBMA', stub: 1,
      line: "Rebma, Amber's reflection beneath the sea: the stair of Faiella-bionin goes down into the water, and Moire's court has not forgotten him.",
      relic: { key: 'w7relic', name: 'the gift of Rebma', desc: '' },
      draw(c, w, h, t) {
        const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5AAAB0'); g.addColorStop(.25, '#1E5A6A'); g.addColorStop(.7, '#0C2A40'); g.addColorStop(1, '#06142A'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x = w * (.25 + i * .25) + Math.sin(t * .5 + i) * w * .04; c.fillStyle = 'rgba(160,230,230,.07)'; c.beginPath(); c.moveTo(x - w * .05, 0); c.lineTo(x + w * .05, 0); c.lineTo(x + w * .16, h * .8); c.lineTo(x - w * .02, h * .8); c.fill(); } c.restore();
        c.strokeStyle = 'rgba(220,250,250,.6)'; c.lineWidth = Math.max(.4, w * .01); c.beginPath(); for (let x = 0; x <= w; x += w / 12) c.lineTo(x, h * .08 + Math.sin(x * .3 + t * 2) * h * .008); c.stroke();
        for (let i = 0; i < 12; i++) { const u = i / 11, x = lerp(w * .12, w * .5, u), y = lerp(h * .09, h * .62, u) + Math.sin(u * 7) * h * .02; c.fillStyle = `rgba(200,236,232,${.7 - u * .35})`; c.fillRect(x - w * .06, y, w * .12, Math.max(.6, h * .012)); }
        c.fillStyle = '#1E5A5E'; c.beginPath(); c.moveTo(0, h); for (const [x, ht] of [[.05, .22], [.16, .3], [.27, .24], [.4, .38], [.5, .44], [.6, .34], [.72, .28], [.84, .33], [.95, .2]]) { c.lineTo(w * x - w * .035, h * (1 - ht * .7)); c.quadraticCurveTo(w * x, h * (1 - ht) - h * .04, w * x + w * .035, h * (1 - ht * .7)); } c.lineTo(w, h); c.closePath(); c.fill(); outline(.5);
        c.fillStyle = 'rgba(190,250,220,.8)'; for (let i = 0; i < 12; i++) c.fillRect(w * (.08 + hsh(i + 70) * .84), h * (.72 + hsh(i + 80) * .18), Math.max(.5, w * .012), Math.max(.6, h * .014));
        c.fillStyle = 'rgba(220,250,255,.6)'; for (let i = 0; i < 9; i++) { const y = h * (1 - ((t * .08 + hsh(i + 90)) % 1)) , x = w * hsh(i + 95) + Math.sin(t * 2 + i) * w * .02; circle(x, y, Math.max(.4, w * .012)); c.fill(); }
        c.strokeStyle = '#2E6A3A'; c.lineWidth = Math.max(.6, w * .018); for (const x0 of [.06, .92]) { c.beginPath(); c.moveTo(w * x0, h); for (let k = 1; k <= 5; k++) c.lineTo(w * x0 + Math.sin(t * 1.4 + k + x0 * 9) * w * .03, h - k * h * .07); c.stroke(); }
      } },
    7: { stage: 7, id: 'lorraine', name: 'LORRAINE', stub: 1,
      line: 'Lorraine, a shadow of fields and a grey castle, where the Black Circle spreads a little wider every night, and what comes out of it does not go back.',
      relic: { key: 'w8relic', name: 'the gift of Lorraine', desc: '' },
      draw(c, w, h, t) {
        const g = c.createLinearGradient(0, 0, 0, h * .6); g.addColorStop(0, '#2A1A2E'); g.addColorStop(.6, '#7A3438'); g.addColorStop(1, '#C8704A'); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = '#3A3428'; c.beginPath(); c.moveTo(0, h * .58); c.quadraticCurveTo(w * .3, h * .5, w * .62, h * .55); c.quadraticCurveTo(w * .8, h * .44, w, h * .5); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#4E4A36'; c.fillRect(0, h * .6, w, h * .4);
        c.strokeStyle = 'rgba(30,26,18,.5)'; c.lineWidth = Math.max(.4, w * .008); for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * .02, h * .6); c.lineTo(w / 2 + i * w * .2, h); c.stroke(); }
        const kx = w * .8, ky = h * .47; c.fillStyle = '#2A2630'; c.fillRect(kx - w * .1, ky - h * .08, w * .2, h * .08); c.fillRect(kx - w * .08, ky - h * .16, w * .05, h * .1); c.fillRect(kx + w * .03, ky - h * .13, w * .05, h * .07);
        c.beginPath(); c.rect(kx - w * .1, ky - h * .16, w * .2, h * .16); outline(.4); c.fillStyle = 'rgba(255,200,120,.9)'; c.fillRect(kx - w * .065, ky - h * .12, Math.max(.6, w * .015), Math.max(.8, h * .015));
        const rx = w * .42, ry = h * .76, R = w * (.3 + .01 * Math.sin(t)); // the Circle: a ring of dead ground, black at its heart, gaining
        c.fillStyle = '#16121A'; c.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = R * (1 + (hsh(i + 7) - .5) * .18); c.lineTo(rx + Math.cos(a) * r, ry + Math.sin(a) * r * .32); } c.fill();
        c.strokeStyle = `rgba(150,90,170,${.35 + .2 * Math.sin(t * 2)})`; c.lineWidth = Math.max(.5, w * .012); c.stroke();
        c.strokeStyle = '#6A6470'; c.lineWidth = Math.max(.5, w * .012); for (let i = 0; i < 4; i++) { const x = rx + (i - 1.5) * R * .4, y = ry - h * .02; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * .1); c.moveTo(x, y - h * .06); c.lineTo(x + w * .03, y - h * .09); c.moveTo(x, y - h * .04); c.lineTo(x - w * .025, y - h * .07); c.stroke(); }
        c.fillStyle = '#1A1418'; for (let i = 0; i < 4; i++) { const x = w * (.2 + i * .12) + Math.sin(t + i) * w * .02, y = h * (.18 + hsh(i + 30) * .1); c.beginPath(); c.moveTo(x - w * .03, y - h * .01); c.quadraticCurveTo(x, y + h * .01, x + w * .03, y - h * .01); c.quadraticCurveTo(x, y, x - w * .03, y - h * .01); c.fill(); }
      } },
  };
  const cardFor = (s) => BR.find(c => c && c.stage === s) || STUBS[s];
  const isOpen = (s) => !!(STAGES[s] && cardFor(s));
  const relicWon = (c) => !!(c && c.relic && c.relic.key && save[c.relic.key]);
  const seen = (c) => !!(c && save.endings && save.endings[c.id]);

  // ---------------- the scene ----------------
  let CH = null; const HOLD = { at: null };
  const T_SPLIT = 1.8, T_RIFF = 2.1, T_TURN = 3.2, T_THUMB = 3.6, T_DOWN = 7.0, T_DEAL = 7.5, T_LOWER = 8.4, T_FLIP = 8.9, T_BROWSE = 10.0;
  const FLICKS = [.5, .44, .38, .32, .26, .2, .16, .12, .1, .09, .08, .08, .08, .09, .11, .14]; // he thumbs faster and faster, then slows
  const FLICK_T = (() => { const a = []; let t = T_THUMB; for (const d of FLICKS) { t += d; a.push(t); } return a; })();
  const geo = () => { // where things are, for the view as it is now
    const H = Math.min(150, VIEW_H * .5), Hs = H * .8, gap = Math.min(VW * .27, H * 1.02), cy = Y_OFF + VIEW_H * .43;
    const dh = Math.min(128, VIEW_H * .44), dx = VW / 2, dy = Y_OFF + VIEW_H * .6;
    return { H, Hs, gap, cy, dh, dw: dh * .62, dx, dy };
  };
  function slotOf(C, j) { const G = geo(), on = j === C.sel; return { x: G.dx + (j - 1) * G.gap, y: G.cy - (on ? 6 : 0), h: on ? G.H : G.Hs }; }
  function defaultSel(cards) {
    let i = 1; // the moon, in the middle: the road the dream was always going to
    if (save.cycle > 0) { const order = [1, 0, 2]; const fresh = order.find(j => cards[j].open && !seen(cards[j].c)); if (fresh !== undefined) i = fresh; }
    return i;
  }
  function makeMasks(hx) { const M = []; for (let i = 0; i < 7; i++) { const x = VW * (.06 + i * .145) + (hsh(i + 61) - .5) * 30; if (Math.abs(x - hx) < 44) continue; M.push({ x, y: FLOOR_TOP + 26 + hsh(i + 71) * 80, rot: (hsh(i + 81) - .5) * 1.6, s: .95 + hsh(i + 91) * .35 }); } return M; }
  // the portraits are slow to paint, so each is painted once per size and kept; and they are painted ahead of time, one
  // at a time in the browser's idle moments, so the deck never stalls when it comes out
  const FACE_CACHE = new Map(), faceScale = () => Math.min(K * 1.35, 5.2);
  const faceAt = (i, s) => { const key = i + '@' + s.toFixed(2); let c = FACE_CACHE.get(key); if (!c) { c = bake(FW, FH, s, () => paintFace(FAMILY[i], FW, FH), false); FACE_CACHE.set(key, c); } return c; };
  function prewarm() { let i = 0; const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 900 }) : (f) => setTimeout(() => f({ timeRemaining: () => 16 }), 120);
    const step = () => { if (i >= FAMILY.length) return; try { faceAt(i, faceScale()); } catch (e) { console.error(e); } i++; idle(step); }; idle(step); }
  setTimeout(prewarm, 4000);
  function bakeAll(C) { // the family's cards and the back, at the size they are seen at
    const s = faceScale(), b = FW * .07;
    C.K = K; C.back = bake(FW, FH, K * 1.35, () => paintBack(FW, FH));
    C.faces = FAMILY.map((F, i) => ({ F, c: faceAt(i, s) }));
    C.b = b;
  }

  function choose(sc, o = {}) {
    if (CH) return;
    const E = o.from, cards = ROADS.map(s => ({ stage: s, c: cardFor(s), open: isOpen(s) }));
    const hx = E ? E.wx : VW * .3, hy = E ? E.hy : FLOOR_TOP + 66;
    const C = CH = { t: 0, real: 0, last: performance.now(), sc, rate: SHUF_RATE, cards, sel: 0, pos: [], wx: hx, hy, side: E ? E.side : 1,
      B: (E && E.B) || null, masks: (E && E.masks) || makeMasks(hx), commitT: null, selT: 0, armAt: Infinity, shake: [0, 0, 0], gp: {}, sounds: {}, nextFlickSfx: 0 };
    C.sel = defaultSel(cards); C.hand = [hx + C.side * 19.5, hy - 70];
    try { if (!C.B) C.B = buildAlt('chaosBoss', 251 + FORK); bakeAll(C); }
    catch (err) { console.error(err); CH = null; dropAlt(C.B); return sc(); }
    save.atChoice = true; persist();
    for (let j = 0; j < 3; j++) C.pos[j] = slotOf(C, j);
    mode = 'choice'; clearInput(); showOnly(null);
    app.classList.add('nocontrols', 'br-on'); app.classList.remove('playing');
    $('#banner').classList.remove('on'); bannerT = 0;
    if (TRACKS.chaos) playMusic('chaos');
  }
  function finish() {
    const C = CH; if (!C) return; CH = null;
    dropAlt(C.B); dropAlt(C.B2); app.classList.remove('br-on', 'nocontrols');
    save.branch = C.cards[C.sel].stage; save.atChoice = false; persist();
    C.sc();
  }
  function abandon() { const C = CH; if (!C) return; CH = null; dropAlt(C.B); dropAlt(C.B2); app.classList.remove('br-on'); } // something else took over (a test, a menu)

  // ---------------- input ----------------
  const browsing = () => CH && CH.commitT === null && CH.t >= T_BROWSE;
  function skip() { const C = CH; if (!C || C.real < .5 || C.commitT !== null || C.t >= T_BROWSE) return false; C.t = T_BROWSE; C.armAt = C.real + .7; return true; }
  function move(d) { const C = CH; if (!browsing()) return; const j = clamp(C.sel + d, 0, 2); if (j !== C.sel) { C.sel = j; C.selT = C.real; sfx('swing', .25); } }
  function select(j) { const C = CH; if (!browsing() || j === C.sel) return; C.sel = j; C.selT = C.real; sfx('swing', .25); }
  function commit() {
    const C = CH; if (!browsing() || C.real < C.armAt || C.real - C.selT < .25) return false;
    const k = C.cards[C.sel]; if (!k.open) { C.shake[C.sel] = .45; sfx('hurt', .3); return false; }
    C.commitT = C.t; sfx('trump');
    const th = STAGES[k.stage].theme; C.theme = THEMES[th] ? th : null;
    try { if (C.theme) C.B2 = buildAlt(C.theme, k.stage === FORK + 1 ? 261 + FORK : k.stage * 97 + 13); } catch (e) { console.error(e); C.theme = null; C.B2 = null; }
    return true;
  }
  const acts = (e) => (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyJ');
  window.addEventListener('keydown', (e) => {
    if (!CH) return; if (e.code === 'KeyM') return; // (the mute key still works)
    e.stopImmediatePropagation(); e.preventDefault(); if (e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') move(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') move(1);
    else if (acts(e)) { if (CH.t < T_BROWSE) skip(); else commit(); }
  }, true);
  let down = null;
  const toWorld = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * VW, Y_OFF + (e.clientY - r.top) / r.height * VIEW_H]; };
  window.addEventListener('pointerdown', (e) => { if (!CH || (e.target && e.target.closest && e.target.closest('button'))) return; down = { x: e.clientX, y: e.clientY, at: toWorld(e) }; e.preventDefault(); }, true);
  window.addEventListener('pointerup', (e) => {
    if (!CH || !down) return; const d = down; down = null; if (CH.real < .5) return;
    const dx = e.clientX - d.x, r = cv.getBoundingClientRect(), sw = dx / r.width * VW;
    if (CH.t < T_BROWSE) { skip(); return; }
    if (Math.abs(sw) > 34) { move(sw < 0 ? 1 : -1); return; } // a swipe slides the row along
    const [x, y] = d.at, G = geo();
    if (x < G.dx - G.gap * 1.62) { move(-1); return; } if (x > G.dx + G.gap * 1.62) { move(1); return; } // the chevrons at the ends
    for (let j = 0; j < 3; j++) { const p = CH.pos[j], hw = p.h * .31 + 6; if (Math.abs(x - p.x) < hw && Math.abs(y - p.y) < p.h / 2 + 6) { if (j === CH.sel) commit(); else select(j); return; } }
  }, true);
  function pollPad() { // a gamepad, if one is plugged in: the stick or d-pad to choose, A (or Start) to step through
    const C = CH; let gp = null; try { gp = navigator.getGamepads && [...navigator.getGamepads()].find(Boolean); } catch (e) {} if (!gp) return;
    const ax = gp.axes[0] || 0, L = ax < -.5 || (gp.buttons[14] && gp.buttons[14].pressed), R = ax > .5 || (gp.buttons[15] && gp.buttons[15].pressed), A = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[9] && gp.buttons[9].pressed);
    if (L && !C.gp.L) move(-1); if (R && !C.gp.R) move(1); if (A && !C.gp.A) { if (C.t < T_BROWSE) skip(); else commit(); }
    C.gp = { L, R, A };
  }

  // ---------------- painting it ----------------
  function stack(x, y, w, h, n, rot, img, b) { // a stack of cards seen from above: the edges of the ones under it show at the side
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const th = Math.min(n, 14) * .32;
    for (let i = Math.min(n, 14); i > 0; i--) { const o = i * .32; ctx.fillStyle = i % 2 ? '#D8DEE8' : '#AEB6C6'; ctx.fillRect(-w / 2 - b + o * .5, -h / 2 - b + o, w + b * 2, h + b * 2); }
    if (th > 0) { ctx.strokeStyle = OUT; ctx.lineWidth = .6; ctx.strokeRect(-w / 2 - b + th * .5, -h / 2 - b + th, w + b * 2, h + b * 2); }
    if (n > 0) cardImg(img, 0, 0, w, h, b);
    ctx.restore();
  }
  function cardImg(img, x, y, w, h, b, label) { // a baked card (face or back), framed
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    frame(x - w / 2, y - h / 2, w, h, label);
  }
  function flipCard(x, y, w, h, rot, f, faceFn, back, b, a = 1) { // f: 0 face down ... 1 face up, turning over about its long axis
    if (a <= 0) return; const sx = Math.abs(Math.cos(Math.PI * f)), lift = 1 + .1 * Math.sin(Math.PI * f);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(Math.max(.02, sx) * lift, lift);
    ctx.fillStyle = 'rgba(8,6,16,.35)'; ctx.fillRect(-w / 2 - b + 2, -h / 2 - b + 3, w + b * 2, h + b * 2); // its shadow on the air below it
    if (f < .5) cardImg(back, 0, 0, w, h, b); else faceFn(w, h);
    ctx.restore();
  }
  function hand(px, py, side, layer, L, thumb = 0) { // a gloved hand at the deck's edge: the forearm and palm under it (layer 0), the fingers and thumb over it (layer 1)
    const gl = L.glove || '#C89A76', st = L.steel || '#A4A4A8';
    ctx.save(); ctx.translate(px, py); ctx.scale(side, 1);
    if (layer === 0) {
      const wg = ctx.createLinearGradient(-30, 0, 4, 0); wg.addColorStop(0, shade(st, -.7)); wg.addColorStop(.55, shade(st, -.38)); wg.addColorStop(.8, shade(st, -.05)); wg.addColorStop(1, shade(st, -.55));
      ctx.fillStyle = C(wg); ctx.beginPath(); ctx.moveTo(-19, 14); ctx.lineTo(3, 18); ctx.lineTo(-12, VH - py + 40); ctx.lineTo(-48, VH - py + 40); ctx.closePath(); ctx.fill(); outline(1.1); // the vambrace, steel over the forearm
      ctx.strokeStyle = C('#6A4228'); ctx.lineWidth = 2.6; for (const k of [.32, .62]) { ctx.beginPath(); ctx.moveTo(lerp(-19, -48, k) + 1, lerp(14, VH - py + 40, k)); ctx.lineTo(lerp(3, -12, k) - 1, lerp(18, VH - py + 40, k) + 2); ctx.stroke(); }
      ctx.fillStyle = C(shade(L.shirt || '#E9E3D5', -.3)); ctx.beginPath(); ctx.moveTo(-21, 12); ctx.quadraticCurveTo(-8, 8, 5, 15); ctx.lineTo(4, 19); ctx.quadraticCurveTo(-8, 14, -20, 16); ctx.closePath(); ctx.fill(); outline(.7); // the shirt cuff
      const pg = ctx.createRadialGradient(-2, -4, 2, -4, 2, 20); pg.addColorStop(0, shade(gl, .2)); pg.addColorStop(1, shade(gl, -.3));
      ctx.fillStyle = C(pg); ctx.beginPath(); ctx.moveTo(-18, 12); ctx.quadraticCurveTo(-22, -6, -10, -18); ctx.quadraticCurveTo(2, -24, 10, -12); ctx.lineTo(10, 8); ctx.quadraticCurveTo(0, 16, -18, 12); ctx.fill(); outline(1.1); // the palm and the heel of the hand
    } else {
      ctx.fillStyle = C(gl); for (let i = 0; i < 3; i++) { const fy = -16 + i * 7.4; rrect(4, fy, 11, 6.4, 3); ctx.fill(); outline(.8); ctx.fillStyle = C(shade(gl, .25)); ctx.fillRect(7, fy + 1.2, 5, 1); ctx.fillStyle = C(gl); } // the fingers, round the edge
      ctx.save(); ctx.translate(-4, 10); ctx.rotate(-.95 + thumb); const tg = ctx.createLinearGradient(0, -4, 0, 4); tg.addColorStop(0, shade(gl, .22)); tg.addColorStop(1, shade(gl, -.25));
      ctx.fillStyle = C(tg); rrect(0, -3.6, 22, 7.2, 3.6); ctx.fill(); outline(1); ctx.strokeStyle = C(shade(gl, -.35)); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(12, -3.4); ctx.lineTo(12, 3.4); ctx.stroke(); ctx.restore(); // the thumb, across the corner of the card
    }
    ctx.restore();
  }
  function say(str, y, a, size = 9, col = '240,232,214', maxW = VW - 70, font = 'Cinzel') { // a line of narration, wrapped, inked so it reads on anything
    if (a <= 0 || !str) return y;
    ctx.save(); ctx.font = `${font === 'Cinzel' ? 700 : '600 italic'} ${size}px ${font === 'Cinzel' ? 'Cinzel, Georgia, serif' : 'Spectral, Georgia, serif'}`; ctx.textAlign = 'center';
    const words = str.split(' '), rows = []; let row = ''; for (const w of words) { const tr = row ? row + ' ' + w : w; if (ctx.measureText(tr).width > maxW && row) { rows.push(row); row = w; } else row = tr; } rows.push(row);
    ctx.lineJoin = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = `rgba(10,6,14,${.75 * a})`; ctx.fillStyle = `rgba(${col},${a})`;
    for (const r of rows) { ctx.strokeText(r, VW / 2, y); ctx.fillText(r, VW / 2, y); y += size * 1.45; }
    ctx.restore(); return y;
  }
  function paintPic(k, w, h, t) { // a road's picture (under a world's own card, the stand-in, in case that paints nothing yet)
    const s = STUBS[k.stage];
    if (s && s !== k.c) try { s.draw(ctx, w, h, t); } catch (e) {}
    try { k.c.draw(ctx, w, h, t); } catch (e) { if (!paintPic.warned) { paintPic.warned = 1; console.error(e); } }
  }
  function destFace(C, j, w, h, t, alpha = 1) { // one of the three roads, face up, with what the player knows of it
    const k = C.cards[j], c = k.c;
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.translate(-w / 2, -h / 2);
    paintPic(k, w, h, t);
    if (!k.open) { ctx.fillStyle = 'rgba(96,100,116,.78)'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(200,204,214,.12)'; ell(w * hsh(i + 5), h * hsh(i + 6), w * .5, h * .08); ctx.fill(); }
      ctx.fillStyle = '#EEF0F4'; ctx.font = `700 ${(h * .055).toFixed(1)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText('THE WAY', w / 2, h * .42); ctx.fillText('IS NOT', w / 2, h * .49); ctx.fillText('OPEN YET', w / 2, h * .56); }
    ctx.restore();
    frame(-w / 2, -h / 2, w, h, c.name);
    if (seen(c)) { ctx.save(); ctx.translate(-w / 2, -h / 2); ctx.beginPath(); ctx.moveTo(0, h * .1); ctx.lineTo(h * .1, 0); ctx.lineTo(h * .2, 0); ctx.lineTo(0, h * .2); ctx.closePath(); ctx.fillStyle = '#8A1E2A'; ctx.fill(); outline(.6); // a ribbon across the corner: this road's end is seen
      ctx.translate(h * .075, h * .075); ctx.rotate(-Math.PI / 4); ctx.fillStyle = '#F4E2B8'; ctx.font = `700 ${(h * .036).toFixed(1)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WALKED', 0, 0); ctx.restore(); }
    if (relicWon(c)) { const r = h * .07; ctx.save(); ctx.translate(w / 2 - r * .3, h / 2 - r * .3); ctx.fillStyle = '#B88A30'; circle(0, 0, r); ctx.fill(); outline(.8); ctx.strokeStyle = '#F0D890'; ctx.lineWidth = .8; circle(0, 0, r * .72); ctx.stroke(); silverRose(0, 0, r * .16, false, '#F0D27A'); ctx.restore(); } // a gold seal: its relic is his
  }
  function drawRim(C, T, Tn, t) { // the Rim of the Abyss as the dream left it, the view closing in on his hands (T: the shuffle's clock, held at its end; Tn: the scene's)
    const z = 1 + .65 * ease((T - .15) / 1.4), [hx, hy] = C.hand;
    ctx.save(); ctx.translate(hx, hy); ctx.scale(z, z); ctx.translate(-hx, -hy);
    const cam = 300; withSet(C.B, () => paintWorld('chaosBoss', { cam }, t));
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(80,100,170,.4)'; ctx.fillRect(-VW, 0, VW * 3, VH * 2); ctx.restore();
    const pose = poseAs('idle'); trumpPose(5, pose, true);
    const mk = (m) => { shadow(m.x, m.y, 7 * m.s); mask(m.x, m.y - 3, m.s, m.rot, 0); };
    for (const m of C.masks) if (m.y <= C.hy) mk(m);
    ctx.save(); ctx.translate(-cam, 0); inkHero(cam + C.wx, C.hy, 1, C.side, pose, 1, true); ctx.restore();
    deckInHand(C.hand[0], C.hand[1], 1 - sm((T - .9) / .35));
    for (const m of C.masks) if (m.y > C.hy) mk(m);
    gradeFrame('chaosBoss');
    ctx.restore();
    const d = .62 * sm((T - .45) / 1.1) + (C.commitT !== null ? .25 * sm((Tn - C.commitT) / .8) : 0);
    ctx.fillStyle = `rgba(6,5,14,${d})`; view();
    const vg = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .5, VIEW_H * .3, VW / 2, Y_OFF + VIEW_H * .5, VW * .7); vg.addColorStop(0, 'rgba(4,3,10,0)'); vg.addColorStop(1, `rgba(4,3,10,${.7 * sm((T - .6) / 1)})`); ctx.fillStyle = vg; view();
  }
  // the narration's pace: each line up for 2.6s and a twentieth of a second a letter, fading in and out over .6s, one at a
  // time; the shuffle under it runs at half speed, and the cards, once dealt, wait face up until the last line is read
  const SHUF_RATE = .5, SAY_AT = .4, readT = (s) => 2.6 + .05 * String(s || '').length;
  const sayLines = () => [Object.keys(save.endings || {}).some(k => save.endings[k]) ? 'The Rim again, and the deck again; and some of the cards were still warm from the last time.' : 'He woke on the Rim of the Abyss, and the Trumps of Amber were still in his doublet.',
    'Before it woke, the Sleeper had dreamed of three places, and he had seen them over its shoulder.', 'Three cards came up cold under his thumb: three roads, and he could walk only one.'];
  const sayEnd = () => sayLines().reduce((s0, str, i, L) => s0 + .6 + readT(str) + (i < L.length - 1 ? .75 : 0), SAY_AT);
  const goLine = (C) => { const k = C.cards[C.sel].c; return k.go || `He held up the Trump of ${STAGES[C.cards[C.sel].stage] ? STAGES[C.cards[C.sel].stage].name : k.name}, and looked into it until it was cold under his fingers, and the picture on it began to move.`; };
  function render(t) {
    const C = CH, now = performance.now(), rdt = Math.min(.05, (now - C.last) / 1000); C.last = now; C.real += rdt;
    if (C.K !== K) bakeAll(C); // (the window was resized)
    pollPad();
    const dt = HOLD.at !== null && C.t >= HOLD.at ? 0 : rdt * (C.commitT !== null ? 1 : C.t < T_BROWSE ? C.rate : 1); C.t += dt;
    if (C.commitT === null && C.t >= T_BROWSE && C.t - dt < T_BROWSE && C.real < sayEnd(C)) C.t = T_BROWSE - .001; // (the cards wait, face up, until the last words are read)
    const T = C.t;
    if (C.t >= T_BROWSE && C.armAt === Infinity) C.armAt = C.real + .6;
    const G = geo(), L = heroLook(), b = C.b * (G.dh / FH), bS = (h) => C.b * (h / FH);
    drawRim(C, Math.min(T, 3), T, t);
    // ------- the deck in his hands -------
    const rise = ease((T - 1) / .8), lower = sm((T - T_LOWER) / .8), dyo = (1 - rise) * (VH - G.dy + G.dh) + lower * (VH - G.dy + G.dh * .9);
    const dx = G.dx, dy = G.dy + dyo, dw = G.dw, dh = G.dh;
    const sfxAt = (key, at, k, p) => { if (T >= at && !C.sounds[key]) { C.sounds[key] = 1; sfx(k, p); } };
    if (T > .9 && lower < 1 && C.commitT === null) {
      const split = sm((T - T_SPLIT) / .3) * (1 - sm((T - (T_RIFF + .72)) / .25)), N = 22, fell = (i) => cl01((T - (T_RIFF + i * .03)) / .09);
      const hs = split * dw * .58, hr = split * .2, nL = Math.round(11 - [...Array(N).keys()].filter(i => i % 2 === 0 && fell(i) >= 1).length), nR = Math.round(11 - [...Array(N).keys()].filter(i => i % 2 === 1 && fell(i) >= 1).length);
      const lx = dx - hs, rxp = dx + hs;
      // the hands, under the deck
      hand(lx - dw * .5 - 2, dy + dh * .12, 1, 0, L); hand(rxp + dw * .5 + 2, dy + dh * .12, -1, 0, L);
      const flipF = T < T_TURN ? 0 : T < T_DOWN ? sm((T - T_TURN) / .4) : 1 - sm((T - T_DOWN) / .4);
      if (T >= T_SPLIT && T < T_RIFF + .97) { // the riffle: cut in two, and the halves let go of their cards into each other
        const pile = [...Array(N).keys()].filter(i => fell(i) >= 1).length;
        stack(dx - hs, dy, dw, dh, nL, -hr, C.back, b); stack(dx + hs, dy, dw, dh, nR, hr, C.back, b);
        if (pile) stack(dx, dy + 2, dw, dh, pile, 0, C.back, b);
        for (let i = 0; i < N; i++) { const p = fell(i); if (p <= 0 || p >= 1) continue; const sd = i % 2 ? 1 : -1; ctx.save(); ctx.globalAlpha = .95;
          const x = lerp(dx + sd * hs, dx, p), r = lerp(sd * hr, 0, p), y = dy + 2 - 3 * Math.sin(Math.PI * p); ctx.translate(x, y); ctx.rotate(r); cardImg(C.back, 0, 0, dw, dh, b); ctx.restore(); }
        if (Math.floor((T - T_RIFF) / .07) !== C.lastTick && T > T_RIFF && T < T_RIFF + .75) { C.lastTick = Math.floor((T - T_RIFF) / .07); sfx('swing', .12); }
      } else if (T < T_THUMB || T >= T_DOWN) { // squared up, face down (or turning over)
        const top = C.faces[T >= T_DOWN ? FLICKS.length % C.faces.length : 0]; // (turned up on Benedict; turned down on whoever he stopped at)
        const bridge = T >= T_RIFF + .7 && T < T_TURN ? Math.sin(cl01((T - T_RIFF - .7) / .4) * Math.PI) : 0; // and the bridge: bowed, then let go so they fall square
        stack(dx, dy - bridge * 4, dw, dh * (1 + .04 * bridge), 18, 0, C.back, b);
        if (flipF > 0 && flipF < 1 || (T >= T_DOWN && flipF > 0)) flipCard(dx, dy, dw, dh, 0, flipF, (w, h) => cardImg(top.c, 0, 0, w, h, b, top.F.name), C.back, b);
        else if (flipF >= 1) cardImg(top.c, dx, dy, dw, dh, b, top.F.name);
        sfxAt('turn', T_TURN, 'swing', .3); sfxAt('down', T_DOWN, 'swing', .3);
      } else { // face up, and he thumbs through them: the top card pushed off past the corner, the next face under it
        const k = FLICK_T.filter(x => T >= x).length, NF = C.faces.length, top = C.faces[k % NF];
        stack(dx, dy, dw, dh, 18, 0, top.c, b); frame(dx - dw / 2, dy - dh / 2, dw, dh, top.F.name);
        if (k !== C.lastFlick) { C.lastFlick = k; if (k > 0) sfx('swing', .14); }
        C.flying = [];
        for (let i = Math.max(0, k - 4); i < k; i++) { const st = FLICK_T[i], d = FLICKS[i], dur = Math.min(.4, Math.max(.16, d * 1.7)), p = (T - st) / dur; if (p >= 1) continue;
          const F = C.faces[i % NF], q = ease(p), sd = i % 3 === 2 ? -1 : 1;
          C.flying.push(() => { ctx.save(); ctx.globalAlpha = 1 - sm((p - .55) / .45); ctx.translate(dx + sd * (dw * .2 + q * VW * .42), dy - q * dh * .55 + q * q * dh * .25); ctx.rotate(sd * q * .7); const s = 1 + q * .12; ctx.scale(s, s); cardImg(F.c, 0, 0, dw, dh, b, F.F.name); ctx.restore(); }); }
        const d = FLICKS[k] || .2; if (d >= .2 || k >= FLICKS.length - 1) C.nameA = 1; else C.nameA = Math.max(0, (C.nameA || 0) - rdt * 6); // (a name can be read only while he goes slowly)
        C.topName = top.F.name;
      }
      // the fingers and thumbs, over it
      const push = T >= T_THUMB && T < T_DOWN ? Math.max(0, Math.sin(((T - T_THUMB) % .1) / .1 * Math.PI)) * .25 : 0;
      hand(lx - dw * .5 - 2, dy + dh * .12, 1, 1, L); hand(rxp + dw * .5 + 2, dy + dh * .12, -1, 1, L, push);
      if (C.flying) { for (const f of C.flying) f(); C.flying = null; }
      if (T >= T_THUMB && T < T_DOWN && C.topName) { ctx.save(); ctx.globalAlpha = C.nameA || 0; ctx.fillStyle = '#F2E4C0'; ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(8,6,14,.8)'; ctx.strokeText(C.topName, dx, dy + dh / 2 + b + 12); ctx.fillText(C.topName, dx, dy + dh / 2 + b + 12); ctx.restore(); }
    }
    // ------- the three, dealt out into the air, then turned up -------
    for (let j = 0; j < 3; j++) {
      const tg = slotOf(C, j), p = C.pos[j], live = T >= T_BROWSE && C.commitT === null;
      if (live) { const k = Math.min(1, rdt * 12); p.x += (tg.x - p.x) * k; p.y += (tg.y - p.y) * k; p.h += (tg.h - p.h) * k; } else if (C.commitT === null) { p.x = tg.x; p.y = tg.y; p.h = tg.h; }
    }
    if (T >= T_DEAL && C.commitT === null) {
      for (let j = 0; j < 3; j++) {
        const st = T_DEAL + j * .3, q = ease((T - st) / .45); if (T < st) continue; const p = C.pos[j];
        if (q < 1 && T < T_BROWSE) { const sx = G.dx, sy = G.dy + dyo, x = lerp(sx, p.x, q), y = lerp(sy, p.y, q) - 40 * Math.sin(Math.PI * q), h = lerp(dh, p.h, q), r = (1 - q) * (j - 1) * 1.6 + (1 - q) * .3;
          if (!C.sounds['deal' + j]) { C.sounds['deal' + j] = 1; sfx('whoosh', .3); }
          flipCard(x, y, h * .62, h, r, 0, null, C.back, bS(h)); continue; }
        const f = T >= T_BROWSE ? 1 : sm((T - (T_FLIP + j * .28)) / .36); if (f > .5 && !C.sounds['up' + j]) { C.sounds['up' + j] = 1; sfx(j === 1 ? 'trump' : 'swing', j === 1 ? .6 : .3); }
        const on = j === C.sel && T >= T_BROWSE, sh = C.shake[j] > 0 ? Math.sin(C.real * 60) * 3 * C.shake[j] / .45 : 0; C.shake[j] = Math.max(0, C.shake[j] - rdt);
        const dim = T >= T_BROWSE && !on ? .72 : 1;
        if (on) { ctx.save(); const gw = p.h * .62; const gl = ctx.createRadialGradient(p.x, p.y, gw * .3, p.x, p.y, p.h * .75); gl.addColorStop(0, 'rgba(200,214,250,.16)'); gl.addColorStop(1, 'rgba(200,214,250,0)'); ctx.fillStyle = gl; ctx.fillRect(p.x - p.h, p.y - p.h, p.h * 2, p.h * 2); ctx.restore(); }
        flipCard(p.x + sh, p.y + (on ? Math.sin(C.real * 2) * 1.5 : 0), p.h * .62, p.h, 0, f, (w, h) => destFace(C, j, w, h, t + j * 3), C.back, bS(p.h));
        if (dim < 1) { ctx.save(); ctx.globalAlpha = 1 - dim; ctx.fillStyle = '#06050E'; const w = p.h * .62, bb = bS(p.h); ctx.fillRect(p.x - w / 2 - bb, p.y - p.h / 2 - bb, w + bb * 2, p.h + bb * 2); ctx.restore(); }
      }
    }
    // ------- the pick: the card held up, coming alive, and he goes into it -------
    if (C.commitT !== null) {
      const c = T - C.commitT;
      for (let j = 0; j < 3; j++) { if (j === C.sel) continue; const p = C.pos[j], q = c / .7; if (q >= 1) continue; // the other two fall away
        ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(p.x + (j - C.sel) * 20 * q, p.y + 260 * q * q); ctx.rotate((j - C.sel) * q * 1.4); ctx.translate(-p.x, -p.y);
        flipCard(p.x, p.y, p.h * .62, p.h, 0, 1, (w, h) => destFace(C, j, w, h, t), C.back, bS(p.h)); ctx.restore(); }
      stepCard(C, c, t);
      if (c > 1.8 && !C.sounds.step) { C.sounds.step = 1; sfx('whoosh'); }
      if (c > 2.6 && !C.sounds.music) { C.sounds.music = 1; const th = STAGES[C.cards[C.sel].stage].theme; if (TRACKS[th]) playMusic(th); }
    }
    // ------- the words -------
    const ty = Y_OFF + 16;
    if (C.commitT === null && T < T_BROWSE) { // the words, one after another on their own clock (real seconds), each up for as long as it takes to read
      const L = sayLines(), r = C.real; let s0 = SAY_AT;
      L.forEach((str, i) => { const n = readT(str), last = i === L.length - 1, a = sm((r - s0) / .6) * (last ? 1 : 1 - sm((r - (s0 + .6 + n)) / .6));
        say(str, ty, a, 9, '240,232,214', VW - 60, 'Spectral'); s0 += .6 + n + .6 + .15; });
    }
    if (T >= T_BROWSE && C.commitT === null) {
      const a = sm((T - T_BROWSE) / .5), k = C.cards[C.sel], c = k.c;
      say('THE TRUMPS OF AMBER  ·  ONE ROAD FROM THE RIM', ty, a, 8, '214,200,160');
      let y = G.cy + G.H / 2 + bS(G.H) + 13;
      y = say(k.open ? (STAGES[k.stage].name || c.name).toUpperCase() : c.name, y, a, 11, '244,226,170');
      y = say(k.open ? c.line : 'The card is cold and grey, and whatever is painted on it will not come clear. The way is not open yet.', y - 2, a, 8.5, '236,230,218', Math.min(VW - 80, 430), 'Spectral');
      const st = [];
      if (c.relic && c.relic.name && k.open && relicWon(c)) st.push(`RELIC WON: ${c.relic.name.toUpperCase()}`); // (what waits at a road's end is not told until it is won)
      if (seen(c)) st.push('ENDING SEEN');
      if (st.length) y = say(st.join('  ·  '), y, a * .9, 6.5, relicWon(c) ? '232,200,110' : '190,196,214');
      const armed = sm((C.real - C.armAt) / .4);
      say(KBD ? '◄  ►  CHOOSE   ·   ENTER  STEP THROUGH' : 'TAP A CARD  ·  TAP IT AGAIN TO STEP THROUGH', VH - 8, armed * .85, 7, '214,206,184');
      // the chevrons at the ends of the row
      ctx.save(); ctx.globalAlpha = a * .8; ctx.strokeStyle = '#DCE2F0'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const sd of [-1, 1]) { if ((sd < 0 && C.sel === 0) || (sd > 0 && C.sel === 2)) continue; const x = G.dx + sd * (G.gap * 1.5 + 18), y2 = G.cy; ctx.beginPath(); ctx.moveTo(x - sd * 5, y2 - 9); ctx.lineTo(x + sd * 4, y2); ctx.lineTo(x - sd * 5, y2 + 9); ctx.stroke(); }
      ctx.restore();
    }
    if (C.commitT !== null) { const c = T - C.commitT, g = goLine(C); say(g, ty, sm(c / .6) * (1 - sm((c - .6 - readT(g)) / .6)), 9, '240,232,214', VW - 60, 'Spectral'); }
    if (C.t < T_BROWSE && C.real > 1 && C.commitT === null) { ctx.save(); ctx.globalAlpha = cl01(C.real - 1) * .8; ctx.fillStyle = 'rgba(232,222,200,.75)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); ctx.restore(); }
    paperFrame();
    if (C.commitT !== null && T - C.commitT >= Math.max(3.9, 1.3 + readT(goLine(C)))) finish(); // (he walks on into the picture until the line is read)
  }
  // the card he picked, generalised from the moon's (endings.js had it once): it comes to the middle, the picture on it
  // comes alive (the world's own painted layers, at the card's scale), he walks into it, and it opens out to fill the view
  function stepCard(C, c, t) {
    const k = C.cards[C.sel], card = k.c, p0 = C.pos[C.sel], mv = ease(c / .55), alive = sm((c - .6) / 1.1), zoom = sm((c - 2.6) / 1.2);
    const hc = lerp(p0.h, Math.min(170, VIEW_H * .58), mv), cx0 = lerp(p0.x, VW / 2, mv), cy0 = lerp(p0.y, Y_OFF + VIEW_H * .48, mv);
    const S1 = [VW * (card.focus ?? .5), Y_OFF + VIEW_H / 2], VC = [VW / 2, Y_OFF + VIEW_H / 2];
    const cx = lerp(cx0, VC[0], zoom), cy = lerp(cy0, VC[1], zoom), px = lerp(cx0, S1[0], zoom), py = lerp(cy0, S1[1], zoom);
    const w = lerp(hc * .62, VW + 4, zoom), h = lerp(hc, VIEW_H + 4, zoom), sc = lerp(hc / VIEW_H, 1, zoom);
    ctx.save(); rrect(cx - w / 2, cy - h / 2, w, h, 4 * (1 - zoom)); ctx.clip();
    if (C.B2 && alive > 0) {
      ctx.save(); ctx.translate(px, py); ctx.scale(sc, sc); ctx.translate(-S1[0], -S1[1]);
      const camM = 280 + c * 6 * alive, tm = 1000 + c * alive;
      withSet(C.B2, () => paintWorld(C.theme, { cam: camM }, tm));
      if (c > 1.7) { const kk = sm((c - 1.7) / .6), mt = Math.max(0, c - 2.1); ctx.save(); ctx.translate(-camM, 0); inkHero(camM + VW * .4 + mt * 34, FLOOR_TOP + 62, 1, 1, poseAs('walk', 5 + mt * 3.4), kk, true); ctx.restore(); }
      gradeFrame(C.theme);
      ctx.restore();
    }
    const pa = C.B2 ? 1 - alive : 1;
    if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; ctx.translate(cx - w / 2, cy - h / 2); paintPic(k, w, h, t); ctx.restore(); }
    if (!C.B2 && c > 1.7) { const kk = sm((c - 1.7) / .6); ctx.save(); ctx.globalAlpha = kk * (1 - sm((c - 3) / .5)); ctx.fillStyle = 'rgba(16,12,24,.9)'; const s = h / 140; ctx.translate(cx - w * .1 + (c - 1.7) * 10 * s, cy + h * .38); ctx.scale(s, s); drawHumanoid(heroLook(), { walk: c * 7, weapon: P.w }); ctx.restore(); } // (a world with no painted layers of its own: he walks into the picture itself)
    if (alive < 1 && alive > 0) { ctx.fillStyle = `rgba(200,210,235,${.4 * (1 - alive) * Math.sin(alive * Math.PI)})`; ctx.fillRect(cx - w / 2, cy - h / 2, w, h); } // the silver mist on it, clearing
    ctx.restore();
    if (zoom < 1) { ctx.save(); ctx.globalAlpha = 1 - zoom * .7; frame(cx - w / 2, cy - h / 2, w, h, zoom < .2 ? card.name : null); ctx.restore(); }
  }

  // ---------------- hooks ----------------
  const _ds = drawScene;
  drawScene = function (t) {
    if (CH && mode !== 'choice') abandon();
    if (CH) { render(t); return; }
    return _ds(t);
  };
  { const st = document.createElement('style'); st.textContent = '#app.br-on #hud{visibility:hidden!important}'; document.head.appendChild(st); }
  // Tir-na Nog'th's own ending (art_w5.js) starts by itself only while the moon is the last entry of STAGES; with the other
  // roads in, it is started from here, so it plays for the moon road all the same (and only once: its own start is watched)
  let moonOn = false;
  if (window.W5 && W5.startEnding) { const _se = W5.startEnding; W5.startEnding = (sc) => { moonOn = true; _se(() => { try { sc(); } finally { moonOn = false; } }); }; }
  const _sc = stageClear;
  stageClear = function () {
    if (window.W5 && W5.startEnding && !moonOn && !W5.ending && typeof baseStage !== 'undefined' && baseStage && baseStage.theme === 'moon' && stageIdx === FORK + 1) { W5.startEnding(_sc); return; }
    return _sc();
  };
  // the forge: while a road past the Rim is not yet walked, the deck can come out again, to pick another
  const _rf = renderForge;
  renderForge = function (note) {
    _rf(note);
    let b = $('#redrawBtn');
    if (!b) { b = document.createElement('button'); b.id = 'redrawBtn'; b.className = 'cta alt'; b.type = 'button'; b.textContent = 'Draw another Trump'; b.addEventListener('click', () => { audioInit(); redraw(); }); $('#walkBtn').after(b); }
    b.hidden = !(save.stage > FORK && !save.done);
  };
  function back() { save.stage = branchStage(); save.atChoice = false; persist(); openForge(`THE TRUMP OF ${String(STAGES[save.stage].name).toUpperCase()} IS IN HIS HAND`); }
  function redraw() { if (CH) return; choose(back); }
  window.BRANCH = {
    FORK, ROADS, cards: () => ROADS.map(s => cardFor(s)), card: (s) => cardFor(s), idOf: (s) => { const c = cardFor(s); return c && c.id; }, isOpen,
    choose, get active() { return !!CH; },
    pending: () => !!save.atChoice, resume: () => redraw(), redraw,
    newCycle() { for (const s of ROADS) { const c = cardFor(s); if (c && c.onCycle && relicWon(c)) try { c.onCycle(save); } catch (e) { console.error(e); } } },
    // for tests: hold the clock at T (null lets it run), skip the shuffle, hold up card j, step through it, and what is shown
    test: { cached: () => FACE_CACHE.size, sheet(cv, s = 3) { const g = cv.getContext('2d'); cv.width = (FW + 8) * 6 * s; cv.height = (FH + 8) * 2 * s; FAMILY.forEach((F, i) => { const c = bake(FW, FH, s, () => paintFace(F, FW, FH), false); g.drawImage(c, ((i % 6) * (FW + 8) + 4) * s, (Math.floor(i / 6) * (FH + 8) + 4) * s); }); },
      hold: (T) => { HOLD.at = T ?? null; }, seek: (T) => { if (CH) { CH.t = T; HOLD.at = T; } }, skip: () => skip(), sel: (j) => { if (CH) { CH.sel = j; CH.selT = -1; } }, pick: () => { if (CH) { CH.armAt = 0; CH.selT = -1; } return commit(); },
      state: () => CH && { t: CH.t, real: CH.real, sel: CH.sel, commit: CH.commitT, cards: CH.cards.map(k => ({ stage: k.stage, id: k.c.id, open: k.open, stub: !!k.c.stub, won: relicWon(k.c), seen: seen(k.c) })) } },
  };
})();
