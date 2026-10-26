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
  const FAMILY = [
    { name: 'BENEDICT', skin: '#D0A482', hair: '#3A2A20', robe: '#C8782A', trim: '#5A3A1E', bg: ['#EDB868', '#6E3E18'], em: 'sword', brow: 1 },
    { name: 'RANDOM', skin: '#D8B090', hair: '#B08A48', robe: '#8A4A2A', trim: '#D8AA55', bg: ['#D49866', '#4A2A1A'], em: 'drum', curl: 1 },
    { name: 'FIONA', skin: '#F0D8C6', hair: '#C2442A', robe: '#3E7A4A', trim: '#D8C080', bg: ['#A8D0AC', '#284A38'], em: 'star', long: 1 },
    { name: 'BLEYS', skin: '#E0BEA0', hair: '#C8542A', beard: 'full', robe: '#C83A2A', trim: '#E8B040', bg: ['#F2A656', '#76281A'], em: 'flame', circ: '#E8C060' },
    { name: 'BRAND', skin: '#E2C4A8', hair: '#B83A22', beard: 'short', robe: '#3A6A3A', trim: '#A8C070', bg: ['#86A87A', '#1E3020'], em: 'tower' },
    { name: 'GÉRARD', skin: '#D4A882', hair: '#6A4428', beard: 'full', robe: '#4A6A9A', trim: '#B8B8C0', bg: ['#A2B6D0', '#2A3A5A'], em: 'anchor', big: 1 },
    { name: 'DEIRDRE', skin: '#F2DED0', hair: '#141018', robe: '#2A2A48', trim: '#C0C8D8', bg: ['#B0BCD6', '#2A2E4A'], em: 'rose', long: 1 },
    { name: 'ERIC', skin: '#E0C0A4', hair: '#141018', beard: 'full', robe: '#9A1E24', trim: '#E0B850', bg: ['#C8503E', '#2A0E10'], em: 'crown', circ: '#E8C060', brow: 1 },
    { name: 'CAINE', skin: '#D8B898', hair: '#1A1418', beard: 'short', robe: '#1E4A36', trim: '#0E1412', bg: ['#62927A', '#0E1A14'], em: 'dagger' },
    { name: 'JULIAN', skin: '#E4CCB4', hair: '#141018', robe: '#E4E2DA', trim: '#3A6A4A', bg: ['#CED8C4', '#3A4A3A'], em: 'horn', scale: 1 },
    { name: 'FLORA', skin: '#F2DCC8', hair: '#E2B85A', robe: '#6A9A5A', trim: '#F0E0A0', bg: ['#EADCA6', '#6A5A3A'], em: 'flower', long: 1 },
    { name: 'LLEWELLA', skin: '#D6E0CE', hair: '#3A8A6A', robe: '#2A6A7A', trim: '#B0E0D8', bg: ['#86C4C4', '#1A3A48'], em: 'wave', long: 1 },
  ];
  function emblem(kind, x, y, s, col) { // their device, small, in the corner of the field, in gold
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    if (kind === 'sword') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(1.4, -7); ctx.lineTo(1.2, 5); ctx.lineTo(-1.2, 5); ctx.lineTo(-1.4, -7); ctx.closePath(); ctx.fill(); ctx.fillRect(-4.5, 5, 9, 1.6); ctx.fillRect(-.8, 6.6, 1.6, 3.4); }
    else if (kind === 'drum') { ell(0, -2, 6, 2.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6, 4); ctx.quadraticCurveTo(0, 7, 6, 4); ctx.lineTo(6, -2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(1, -2.6); ctx.moveTo(4, -8); ctx.lineTo(2, -3); ctx.stroke(); }
    else if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, r = i % 2 ? 2.6 : 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
    else if (kind === 'flame') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(6, -2, 4, 4); ctx.quadraticCurveTo(2, 8, 0, 8); ctx.quadraticCurveTo(-5, 7, -4.5, 2); ctx.quadraticCurveTo(-4, -2, -1, -3); ctx.quadraticCurveTo(-1.5, -6, 0, -9); ctx.fill(); }
    else if (kind === 'tower') { ctx.fillRect(-3.5, -4, 7, 13); for (const dx of [-3.5, -.8, 1.9]) ctx.fillRect(dx, -6.5, 1.6, 2.6); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-.8, 0, 1.6, 2.6); }
    else if (kind === 'anchor') { ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-3.5, -4); ctx.lineTo(3.5, -4); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-5, 7.5, 0, 7.5); ctx.quadraticCurveTo(5, 7.5, 6, 2); ctx.stroke(); circle(0, -8.4, 1.6); ctx.stroke(); }
    else if (kind === 'rose') { ctx.restore(); silverRose(x, y, s * 2.2, true, '#C8CED8'); return; }
    else if (kind === 'crown') { ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-7, -3); ctx.lineTo(-3.5, 1); ctx.lineTo(0, -5); ctx.lineTo(3.5, 1); ctx.lineTo(7, -3); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill(); }
    else if (kind === 'dagger') { ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(1.6, 2); ctx.lineTo(-1.6, 2); ctx.closePath(); ctx.fill(); ctx.fillRect(-3.5, 2, 7, 1.4); ctx.fillRect(-.7, 3.4, 1.4, 3.6); }
    else if (kind === 'horn') { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.quadraticCurveTo(-4, 6, 6, 3); ctx.stroke(); ell(6.4, 2.6, 1.6, 3, -.4); ctx.fill(); }
    else if (kind === 'flower') { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 2.8, 1.8, a); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,.35)'; circle(0, 0, 1.6); ctx.fill(); }
    else if (kind === 'wave') { ctx.lineWidth = 1.4; for (const dy of [-3, 1.5, 6]) { ctx.beginPath(); ctx.moveTo(-7, dy); ctx.quadraticCurveTo(-3.5, dy - 3.5, 0, dy); ctx.quadraticCurveTo(3.5, dy + 3.5, 7, dy); ctx.stroke(); } }
    ctx.restore();
  }
  function paintFace(F, w, h) { // head and shoulders against a field of their colour, as the Trumps show them
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, F.bg[0]); g.addColorStop(1, F.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const lg = ctx.createRadialGradient(w * .55, h * .36, 2, w * .55, h * .36, w * .62); lg.addColorStop(0, 'rgba(255,244,220,.32)'); lg.addColorStop(1, 'rgba(255,244,220,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,240,200,.18)'; ctx.lineWidth = .5; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(w * .5, h * .38); const a = -Math.PI * (.08 + i * .105); ctx.lineTo(w * .5 + Math.cos(a) * w, h * .38 + Math.sin(a) * w); ctx.stroke(); } // the gilt rays tooled into the field
    emblem(F.em, w * .17, h * .14, w * .0115, '#E8C670');
    const cx = w * .5, hy = h * .4, hr = w * (F.big ? .19 : .17), hry = w * .22, sk = F.skin, hair = F.hair;
    if (F.long) { ctx.fillStyle = shade(hair, -.12); ctx.beginPath(); ctx.moveTo(cx - hr * 1.2, hy - hry * .4); ctx.quadraticCurveTo(cx - hr * 1.7, hy + hry * 1.4, cx - hr * 1.55, hy + hry * 2.5); ctx.lineTo(cx + hr * 1.55, hy + hry * 2.5); ctx.quadraticCurveTo(cx + hr * 1.7, hy + hry * 1.4, cx + hr * 1.2, hy - hry * .4); ctx.closePath(); ctx.fill(); outline(.7); }
    // the shoulders, in their colours, the neckline edged
    const sy = h * .7, rg = ctx.createLinearGradient(0, sy, w, h); rg.addColorStop(0, shade(F.robe, -.25)); rg.addColorStop(.6, F.robe); rg.addColorStop(1, shade(F.robe, .18));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(w * .0, h); ctx.lineTo(w * .03, h * .88); ctx.quadraticCurveTo(w * .07, sy + h * .02, cx - w * (F.big ? .24 : .2), sy); ctx.lineTo(cx + w * (F.big ? .24 : .2), sy); ctx.quadraticCurveTo(w * .93, sy + h * .02, w * .97, h * .88); ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); outline(.9);
    if (F.scale) { ctx.strokeStyle = 'rgba(80,90,90,.45)'; ctx.lineWidth = .4; for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) { const x = w * .06 + i * w * .11 + (r % 2) * w * .055, y = sy + 3 + r * 3.4; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI); ctx.stroke(); } } // Julian's white scale mail
    ctx.fillStyle = shade(F.robe, -.4); ctx.beginPath(); ctx.moveTo(cx - w * .13, sy); ctx.lineTo(cx, sy + h * .1); ctx.lineTo(cx + w * .13, sy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = F.trim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - w * .14, sy); ctx.lineTo(cx, sy + h * .105); ctx.lineTo(cx + w * .14, sy); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * .06, h * .9); ctx.quadraticCurveTo(w * .1, sy + 4, cx - w * .19, sy + 1); ctx.moveTo(w * .94, h * .9); ctx.quadraticCurveTo(w * .9, sy + 4, cx + w * .19, sy + 1); ctx.stroke(); // the seams over the shoulder
    // the neck and head
    ctx.fillStyle = shade(sk, -.18); ctx.fillRect(cx - hr * .5, hy + hry * .6, hr, sy - hy - hry * .6 + 1); ctx.beginPath(); ctx.rect(cx - hr * .5, hy + hry * .6, hr, sy - hy - hry * .6 + 1); outline(.6);
    const fg = ctx.createRadialGradient(cx + hr * .35, hy - hry * .35, 1, cx, hy, hry * 1.2); fg.addColorStop(0, shade(sk, .18)); fg.addColorStop(.7, sk); fg.addColorStop(1, shade(sk, -.2));
    ctx.fillStyle = fg; ell(cx, hy, hr, hry); ctx.fill(); outline(1);
    ctx.fillStyle = 'rgba(200,90,80,.16)'; ell(cx - hr * .52, hy + hry * .3, hr * .25, hry * .14); ctx.fill(); ell(cx + hr * .52, hy + hry * .3, hr * .25, hry * .14); ctx.fill();
    if (F.beard) { const bl = F.beard === 'full' ? 1.6 : 1.22; ctx.fillStyle = shade(hair, .04); ctx.beginPath(); ctx.moveTo(cx - hr * .98, hy + hry * .02); ctx.quadraticCurveTo(cx - hr * 1.02, hy + hry * bl, cx, hy + hry * bl); ctx.quadraticCurveTo(cx + hr * 1.02, hy + hry * bl, cx + hr * .98, hy + hry * .02);
      ctx.quadraticCurveTo(cx + hr * .7, hy + hry * .6, cx + hr * .35, hy + hry * .46); ctx.quadraticCurveTo(cx, hy + hry * .38, cx - hr * .35, hy + hry * .46); ctx.quadraticCurveTo(cx - hr * .7, hy + hry * .6, cx - hr * .98, hy + hry * .02); ctx.fill(); outline(.7);
      ctx.strokeStyle = shade(hair, .3); ctx.lineWidth = .4; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * hr * .3, hy + hry * .7); ctx.lineTo(cx + i * hr * .34, hy + hry * (bl - .15)); ctx.stroke(); } }
    for (const sx of [-1, 1]) { const ex = cx + sx * hr * .42, ey = hy - hry * .04; // the eyes, under heavy brows
      ctx.fillStyle = '#F2EADC'; ell(ex, ey, hr * .2, hry * .075); ctx.fill(); ctx.fillStyle = '#2A2018'; circle(ex + hr * .02, ey, hry * .07); ctx.fill();
      ctx.strokeStyle = '#2A1A16'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(ex - hr * .22, ey); ctx.quadraticCurveTo(ex, ey - hry * .13, ex + hr * .22, ey); ctx.stroke();
      ctx.strokeStyle = shade(hair, -.2); ctx.lineWidth = F.brow ? 1.3 : .9; ctx.beginPath(); ctx.moveTo(ex - sx * hr * .3, ey - hry * (F.brow ? .2 : .24)); ctx.quadraticCurveTo(ex, ey - hry * .3, ex + sx * hr * .26, ey - hry * (F.brow ? .26 : .2)); ctx.stroke(); }
    ctx.strokeStyle = shade(sk, -.35); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(cx + hr * .04, hy + hry * .02); ctx.lineTo(cx + hr * .12, hy + hry * .34); ctx.lineTo(cx - hr * .08, hy + hry * .38); ctx.stroke();
    ctx.strokeStyle = '#7A3A30'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(cx - hr * .24, hy + hry * .56); ctx.quadraticCurveTo(cx, hy + hry * .6, cx + hr * .24, hy + hry * .55); ctx.stroke();
    // the hair over the brow
    ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(cx - hr * 1.04, hy + hry * .12); ctx.quadraticCurveTo(cx - hr * 1.2, hy - hry * 1.3, cx, hy - hry * 1.14); ctx.quadraticCurveTo(cx + hr * 1.22, hy - hry * 1.24, cx + hr * 1.04, hy + hry * .12);
    if (F.curl) { for (let i = 0; i < 5; i++) { const u = 1 - i / 4; ctx.quadraticCurveTo(cx + (u - .5) * hr * 2.1 + hr * .2, hy - hry * .3, cx + (u - .5) * hr * 2 - hr * .25, hy - hry * .62); } ctx.lineTo(cx - hr * 1.04, hy + hry * .12); }
    else { ctx.quadraticCurveTo(cx + hr * .92, hy - hry * .52, cx + hr * .32, hy - hry * .62); ctx.quadraticCurveTo(cx - hr * .2, hy - hry * .44, cx - hr * .62, hy - hry * .64); ctx.quadraticCurveTo(cx - hr * .96, hy - hry * .4, cx - hr * 1.04, hy + hry * .12); }
    ctx.closePath(); ctx.fill(); outline(.8);
    ctx.strokeStyle = shade(hair, .32); ctx.lineWidth = .5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - hr * .6 + i * hr * .4, hy - hry * 1.02); ctx.quadraticCurveTo(cx - hr * .3 + i * hr * .4, hy - hry * .9, cx - hr * .5 + i * hr * .46, hy - hry * .64); ctx.stroke(); }
    if (F.circ) { ctx.strokeStyle = F.circ; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - hr * 1.02, hy - hry * .5); ctx.quadraticCurveTo(cx, hy - hry * .78, cx + hr * 1.02, hy - hry * .5); ctx.stroke(); ctx.fillStyle = '#9A2A3A'; circle(cx, hy - hry * .66, 1.1); ctx.fill(); }
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
    relic: { key: 'silverArm', name: "Benedict's silver arm", desc: 'Fight bare-handed and the arm is on you: silver to the shoulder, and stronger every cycle.' } });
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
  function bakeAll(C) { // the family's cards and the back, painted once at the size they are seen at
    const s = K * 1.35, b = FW * .07;
    C.K = K; C.back = bake(FW, FH, s, () => paintBack(FW, FH));
    C.faces = FAMILY.map(F => { const face = bake(FW, FH, s, () => paintFace(F, FW, FH)); return { F, c: face }; });
    C.b = b;
  }

  function choose(sc, o = {}) {
    if (CH) return;
    const E = o.from, cards = ROADS.map(s => ({ stage: s, c: cardFor(s), open: isOpen(s) }));
    const hx = E ? E.wx : VW * .3, hy = E ? E.hy : FLOOR_TOP + 66;
    const C = CH = { t: 0, real: 0, last: performance.now(), sc, rate: save.cycle > 0 ? 1.6 : 1, cards, sel: 0, pos: [], wx: hx, hy, side: E ? E.side : 1,
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
  function render(t) {
    const C = CH, now = performance.now(), rdt = Math.min(.05, (now - C.last) / 1000); C.last = now; C.real += rdt;
    if (C.K !== K) bakeAll(C); // (the window was resized)
    pollPad();
    const dt = HOLD.at !== null && C.t >= HOLD.at ? 0 : rdt * (C.commitT !== null || C.t < T_BROWSE ? C.rate : 1); C.t += dt; const T = C.t;
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
    const ty = Y_OFF + 16, any = Object.keys(save.endings || {}).some(k => save.endings[k]);
    if (C.commitT === null && T < T_BROWSE) {
      const a1 = sm((T - .4) / .6) * (1 - sm((T - 3.3) / .4)), a2 = sm((T - 3.6) / .5) * (1 - sm((T - 6.9) / .4)), a3 = sm((T - 7.2) / .5);
      say(any ? 'The Rim again, and the deck again; and some of the cards were still warm from the last time.' : 'He woke on the Rim of the Abyss, and the Trumps of Amber were still in his doublet.', ty, a1, 9, '240,232,214', VW - 60, 'Spectral');
      say('Before it woke, the Sleeper had dreamed of three places, and he had seen them over its shoulder.', ty, a2, 9, '240,232,214', VW - 60, 'Spectral');
      say('Three cards came up cold under his thumb: three roads, and he could walk only one.', ty, a3, 9, '240,232,214', VW - 60, 'Spectral');
    }
    if (T >= T_BROWSE && C.commitT === null) {
      const a = sm((T - T_BROWSE) / .5), k = C.cards[C.sel], c = k.c;
      say('THE TRUMPS OF AMBER  ·  ONE ROAD FROM THE RIM', ty, a, 8, '214,200,160');
      let y = G.cy + G.H / 2 + bS(G.H) + 13;
      y = say(k.open ? (STAGES[k.stage].name || c.name).toUpperCase() : c.name, y, a, 11, '244,226,170');
      y = say(k.open ? c.line : 'The card is cold and grey, and whatever is painted on it will not come clear. The way is not open yet.', y - 2, a, 8.5, '236,230,218', Math.min(VW - 80, 430), 'Spectral');
      const st = [];
      if (c.relic && c.relic.name && k.open) st.push(relicWon(c) ? `RELIC WON: ${c.relic.name.toUpperCase()}` : `AT THE ROAD'S END: ${c.relic.name.toUpperCase()}`);
      if (seen(c)) st.push('ENDING SEEN');
      if (st.length) y = say(st.join('  ·  '), y, a * .9, 6.5, relicWon(c) ? '232,200,110' : '190,196,214');
      const armed = sm((C.real - C.armAt) / .4);
      say(KBD ? '◄  ►  CHOOSE   ·   ENTER  STEP THROUGH' : 'TAP A CARD  ·  TAP IT AGAIN TO STEP THROUGH', VH - 8, armed * .85, 7, '214,206,184');
      // the chevrons at the ends of the row
      ctx.save(); ctx.globalAlpha = a * .8; ctx.strokeStyle = '#DCE2F0'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const sd of [-1, 1]) { if ((sd < 0 && C.sel === 0) || (sd > 0 && C.sel === 2)) continue; const x = G.dx + sd * (G.gap * 1.5 + 18), y2 = G.cy; ctx.beginPath(); ctx.moveTo(x - sd * 5, y2 - 9); ctx.lineTo(x + sd * 4, y2); ctx.lineTo(x - sd * 5, y2 + 9); ctx.stroke(); }
      ctx.restore();
    }
    if (C.commitT !== null) { const c = T - C.commitT, k = C.cards[C.sel].c; say(k.go || `He held up the Trump of ${STAGES[C.cards[C.sel].stage] ? STAGES[C.cards[C.sel].stage].name : k.name}, and looked into it until it was cold under his fingers, and the picture on it began to move.`, ty, sm(c / .5) * (1 - sm((c - 2.6) / .5)), 9, '240,232,214', VW - 60, 'Spectral'); }
    if (C.t < T_BROWSE && C.real > 1 && C.commitT === null) { ctx.save(); ctx.globalAlpha = cl01(C.real - 1) * .8; ctx.fillStyle = 'rgba(232,222,200,.75)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); ctx.restore(); }
    paperFrame();
    if (C.commitT !== null && T - C.commitT >= 3.9) finish();
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
    test: { hold: (T) => { HOLD.at = T ?? null; }, seek: (T) => { if (CH) { CH.t = T; HOLD.at = T; } }, skip: () => skip(), sel: (j) => { if (CH) { CH.sel = j; CH.selT = -1; } }, pick: () => { if (CH) { CH.armAt = 0; CH.selT = -1; } return commit(); },
      state: () => CH && { t: CH.t, real: CH.real, sel: CH.sel, commit: CH.commitT, cards: CH.cards.map(k => ({ stage: k.stage, id: k.c.id, open: k.open, stub: !!k.c.stub, won: relicWon(k.c), seen: seen(k.c) })) } },
  };
})();
