'use strict';
// Breakable armor for the elites of Rebma (world 7) and Lorraine (world 8): see world.js, "breakable armor".
// The armor itself is painted by each creature in its own layers (art_w7.js / art_w8.js, W7.armor and W8.armor), so it
// follows every pose; here are its pieces, its shards and what breaking it does. What was under it is drawn by the
// creature when e.bare is set.
(() => {
  // a stat changed for this one foe only (its def is shared with every other of its kind)
  const ownDef = (e, o) => { e.def = Object.assign({}, e.def, o); };
  const faster = (e, k) => ownDef(e, { spd: e.def.spd * k });
  const quicker = (e, k) => ownDef(e, { cd: [e.def.cd[0] * k, e.def.cd[1] * k] });
  const noDraw = () => {};

  if (window.W7 && W7.armor) {
    const A = W7.armor;
    const bub = (e, n) => { if (W7.bubbles) W7.bubbles(e.x, e.y, e.hh * .6, n, 60); };
    ARMOR.w7drowned = { draw: noDraw, cols: ['#E6E2CC', '#A9A690', '#22304A'],
      pieces: [{ x: 1, y: 58, fn: A.drownedHelm }, { x: 0, y: 42, fn: A.drownedPlate }],
      onBreak(e) { faster(e, 1.15); bub(e, 10); floatText(e.x, e.y, e.z + e.hh + 40, 'THE REEF GIVES UP ITS DEAD', '#DCEEE6', 11); } };
    ARMOR.w7lamp = { draw: noDraw, cols: ['#F2FBF6', '#BEE6DA', '#9AF0B0'],
      pieces: [{ x: 2, y: 108, fn: A.lampGlobe }, { x: 4, y: 57, fn: () => A.scallop(1) }],
      onBreak(e) { quicker(e, .8); bub(e, 8); floatText(e.x, e.y, e.z + e.hh + 40, 'THE FLAME GETS LOOSE', '#9AF0B0', 11); } };
    ARMOR.w7guard = { draw: noDraw, cols: ['#FFF4E6', '#E6D0BA', '#E89A9A'],
      pieces: [{ x: 1, y: 59, fn: A.conchHelm }, { x: 3, y: 47, fn: () => A.scallop(.9, '#F2E2D6') }],
      onBreak(e) { faster(e, 1.15); bub(e, 8); floatText(e.x, e.y, e.z + e.hh + 40, 'NO MAN UNDER THE HELM', '#DCEEE6', 11); } };
    ARMOR.w7triton = { draw: noDraw, cols: ['#E2DCC6', '#C86A5A', '#A49C84'],
      pieces: [{ x: 0, y: 87, fn: () => { ctx.scale(1.04, 1.04); A.tritonCrown(); } }, { x: -16, y: 64, fn: () => { ctx.scale(.98, .98); A.tritonReef(-1); } }, { x: 16, y: 64, fn: () => { ctx.scale(.98, .98); A.tritonReef(1); } }],
      onBreak(e) { faster(e, 1.15); bub(e, 12); floatText(e.x, e.y, e.z + e.hh + 40, 'IT WAS HOLLOW', '#DCEEE6', 11); } };
    // the Knight in the Glass Bell: an elite's bell is its guard, hung in a gilt cage. Breaking the guard shatters the
    // bell (its own crack counter does the same, and then breaks the guard with it: a9_dom.js)
    const shard = (i) => () => A.bellShard(i);
    ARMOR.w7bellk = { draw: noDraw, cols: ['#E8F8FF', '#BEEAD8', '#F2D68A'],
      pieces: [{ x: -14, y: 60, fn: shard(1) }, { x: 12, y: 54, fn: shard(2) }, { x: -6, y: 36, fn: shard(3) }, { x: 16, y: 30, fn: shard(4) }, { x: 0, y: 70, fn: shard(5) }, { x: 0, y: 46, fn: () => A.bellBand(18) }, { x: 0, y: 76, fn: () => { A.coralSprig(-3, 0, .8, -.4); A.coralSprig(3, 0, .8, .4, '#D87A5A'); } }],
      onBreak(e, dir) { if (e.w7bare) return; e.w7bare = 1; e.plan = null; e.hh = 46; e.hw = 14; bub(e, 24); floatText(e.x, e.y, e.hh + 24, 'THE BELL SHATTERS', '#E8F8FF', 15); } };
  }
  if (window.W8 && W8.armor) {
    const A = W8.armor, IR = ['#B4AA98', '#6E665C', '#9A4E2A'];
    const say = (e, s) => floatText(e.x, e.y, e.z + e.hh + 40, s, '#F2D890', 11);
    ARMOR.w8hollow = { draw: noDraw, cols: IR,
      pieces: [{ x: 3, y: 74, fn: () => A.kettleHat() }, { x: 1, y: 33, fn: A.breastplate }],
      onBreak(e) { faster(e, 1.15); say(e, 'SOMEONE IS STILL IN THERE'); } };
    ARMOR.w8flag = { draw: noDraw, cols: IR.concat(['#D8D0BC']),
      pieces: [{ x: 14, y: 67, fn: () => A.potHelm(.95) }, { x: 24, y: 59, fn: () => A.potHelm(.95) }, { x: 4, y: 75, fn: () => A.potHelm(.95) }, { x: -14, y: 30, fn: A.chainPiece }, { x: 14, y: 30, fn: A.chainPiece }],
      onBreak(e) { faster(e, 1.12); say(e, 'THE SHEET TEARS OPEN'); } };
    ARMOR.w8halberd = { draw: noDraw, cols: IR.concat(['#C89A86']),
      pieces: [{ x: -5, y: 61, fn: () => A.earPlate(-1) }, { x: 9, y: 61, fn: () => A.earPlate(1) }, { x: 3, y: 25, fn: A.eyeVisor }],
      onBreak(e) { faster(e, 1.12); say(e, 'ITS OTHER EYES OPEN'); } };
    ARMOR.w8xbow = { draw: noDraw, cols: IR.concat(['#C86A6A']),
      pieces: [{ x: -12, y: 30, fn: () => A.bridlePiece(-1) }, { x: 20, y: 30, fn: () => A.bridlePiece(1) }, { x: 33, y: 29, fn: A.padlock }],
      onBreak(e) { quicker(e, .82); say(e, 'THE BRIDLE SNAPS'); } };
    ARMOR.w8bell = { draw: noDraw, cols: IR.concat(['#C8884A', '#7A4A26']),
      pieces: [{ x: -15, y: 45, fn: () => A.hoop(32) }, { x: 3, y: 45, fn: () => A.hoop(38) }, { x: 19, y: 45, fn: () => A.hoop(32) }, { x: 27, y: 38, fn: A.padlock }, { x: 38, y: 39, fn: A.handBell }],
      onBreak(e) { e.w8crack = 2; faster(e, 1.1); say(e, 'THE CASE IS STOVED IN'); } }; // (the case no longer turns blows from the front: art_w8.js, 'w8crack')
    ARMOR.w8egg = { draw: noDraw, cols: ['#FFFDF6', '#ECE4D2', '#6E665C', '#E8B040'],
      pieces: [{ x: 1, y: 66, fn: A.eggLid }, { x: 0, y: 47, fn: A.eggHoop }],
      onBreak(e) { quicker(e, .85); say(e, 'IT HATCHES'); } };
    ARMOR.w8crow = { draw: noDraw, cols: IR,
      pieces: [{ x: 14, y: 28, fn: A.crowMask }],
      onBreak(e) { faster(e, 1.1); say(e, 'A MAN\'S EYE UNDER THE IRON'); } };
  }
})();
