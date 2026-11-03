'use strict';
// ======================================================================================================
// NEW GAME+ ENDINGS: the road's three last worlds, walked again
// ------------------------------------------------------------------------------------------------------
// On a new cycle of the road (save.cycle >= 1) each of the three worlds past the Rim (Tir-na Nog'th, Rebma, Lorraine)
// ends with this file's cutscene instead of its own (art_w5.js, w7_late.js, w8_late.js keep theirs for the first walk,
// untouched). It is put together from authored beats, each a painted panel with one line of narration:
//   OPENING    the world just cleared: the moon going out at dawn, the sea settling over the Pattern of Rebma, the colour
//              coming back into Lorraine; worded for a world walked before (save.endings) or reached for the first time
//   RELICS     one for each of the other two relics he already carries (the silver arm, the Pearl of Judgement or the
//              weapon it was reforged into, the Horn of Lorraine), each with its own moment in its own world's light;
//              under a heavy curse the Pearl has a vein of black, the arm a tarnish, the Horn speaks his curse backward
//   CURSE      only while the Horn's curse is on him (the Black Circle, corruption.js): light, the grey at the edges of
//              the view and one line of the Pattern running thin; heavy, the grey closing in, the Pattern's flaw cracking
//              open under him and the Black Road running from his feet to the Circle; his own curse, coming home
//   CLOSING    by the cycle (the second walking, the third, and every one after): the Vale at evening, the road's first
//              stretch, and the walks before this one going on ahead of him as pale echoes; then a short roll of credits
//              (what he carried, and what carried him) over the same scene, and the win card with its New Game+ button
// So every world (3) x relics carried (4) x curse (none / light / heavy) x cycle (1 / 2 / 3+) plays differently.
// Each line stays up 2.6s and a twentieth of a second a letter, fading in and out over .6s, one at a time; the credits
// roll at 15px a second. Tap, click, Enter, Space or J (or a gamepad button) skips to the next beat; Escape, or a skip
// during the credits, goes straight on to the win card.
// It hooks in by wrapping each world's ending start (W5 / W7 / W8 .startEnding, which their stageClear wrappers and
// branch.js call) and drawScene; it also gives the world 1-5 vignettes (endings.js) their words on a new cycle (vignette).
// Console / tests: NGEND.preview({ world: 'moon' | 'rebma' | 'lorraine', relics: ['arm', 'pearl', 'horn'], forged,
// curse: 'none' | 'light' | 'heavy', cycle, first }) plays any permutation from wherever the game is; NGEND.compose(o)
// gives its beats and lines without playing it; NGEND.state(), NGEND.skip(), NGEND.hold(T), NGEND.all().
// ======================================================================================================
(() => {
  const KIT = window.ENDINGS && ENDINGS.kit; if (!KIT) { console.error('ng_endings.js: endings.js kit missing'); return; }
  const { buildAlt, dropAlt, withSet, paintWorld, cycleTint, inkHero, poseAs, glowR, sm, cl01, hsh } = KIT;
  const view = () => ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  const lite = () => typeof PAINT_LITE !== 'undefined' && (PAINT_LITE || PAINT_Q === 0);
  const readT = (s) => 2.6 + .05 * String(s || '').length; // how long a line stays up, once faded in
  const FADE = .6, BEAT_FADE = .5, CRED_SPEED = 15;
  const WORLDS = ['moon', 'rebma', 'lorraine'], STAGE_OF = { moon: 5, rebma: 6, lorraine: 7 };
  const NAME = { moon: "TIR-NA NOG'TH", rebma: 'REBMA', lorraine: 'LORRAINE' };
  const OTHERS = { moon: ['pearl', 'horn'], rebma: ['arm', 'horn'], lorraine: ['arm', 'pearl'] }; // (always in this order: the arm, the Pearl, the Horn)
  const OWN = { moon: 'arm', rebma: 'pearl', lorraine: 'horn' };
  const RELIC_NAME = { arm: "Benedict's silver arm", pearl: 'the Pearl of Judgement', horn: 'the Horn of Lorraine' };
  const RELIC_KEY = { arm: 'silverArm', pearl: 'w7relic', horn: 'w8relic' };
  const THEME = { moon: 'moonBoss', rebma: 'rebmaBoss', lorraine: 'lorraineBoss' }; // where each world's road ended
  const ZONE = { moon: 'moon', rebma: 'rebma', lorraine: 'lorraine' }; // each world's first stretch: the relics' moments are painted there
  const MUSIC = { moon: 'w5dawn', rebma: 'w7tide', lorraine: 'w8spring' };
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const ordOf = (n) => ORD[n - 1] || `${n}th`;
  const cycB = (c) => c >= 3 ? 3 : c >= 2 ? 2 : 1;

  // ======================================================================================================
  // THE WORDS
  // ======================================================================================================
  const OPENING = {
    moon: { first: "He had walked the road before, but never so far up into the sky. Dawn came, and Tir-na Nog'th went out round him like a lamp.",
      again: "Dawn came, and Tir-na Nog'th went out like a lamp, as he had watched it go out before; and again the stair thinned under his feet." },
    rebma: { first: 'The King in the Glass broke, and the sea lay still over the Pattern of Rebma. He had walked the road before, but never down into the water.',
      again: 'The King in the Glass broke again, and the sea of Rebma settled over its Pattern as it had settled before, as though it had expected him.' },
    lorraine: { first: 'The Circle closed on nothing. He had walked the road before, but it had not brought him to Lorraine, and he had not seen what he had made there.',
      again: 'The Circle closed on nothing once more. He had watched it close before, and he knew now that closing was not the same as ending.' },
  };
  // the other relics he carries, by where he is now; heavy: what the curse has done to them
  const RELIC = {
    arm: { rebma: 'Under the sea the silver arm shone as it had under the moon, and the fingers he had taken from Benedict\'s ghost closed when he told them to.',
      lorraine: 'In the grey light of Lorraine his silver hand did not grey. Whatever the Circle took, it could not take what had come down out of the sky.',
      heavy: 'Even the silver arm had a tarnish on it now, a bloom of grey at the joints that no polishing would lift.' },
    pearl: { moon: 'The Pearl of Judgement turned in his palm as the moon went down, and the tide in it turned with it, a long way below the clouds.',
      lorraine: 'He held up the Pearl over the dead ground, and the tide in it ran, and for a moment the fields of Lorraine smelled of the sea.',
      heavy: 'There was a vein of black in the Pearl now, fine as a hair, and it did not run with the tide.' },
    forged: { moon: (n) => `The Pearl was a weapon now, ${n}, and in the dawn over Tir-na Nog'th its nacre took the colour of the sky.`,
      lorraine: (n) => `He leaned on ${n} in the ruined field, the Pearl made a weapon in his hands, and the dead ground under its point went dark with water.`,
      heavy: (n) => `There was a vein of black in the nacre of ${n} now, fine as a hair, and it did not run with the tide.` },
    horn: { moon: 'He set Ganelon\'s horn to his lips on the stair of the moon, and its call went down through the cloud to a country that had forgotten it.',
      rebma: 'Under the sea the Horn of Lorraine could not be blown; he only held it, and felt it hum against his ribs with every bell in Rebma.',
      heavy: 'He blew the Horn of Lorraine, and what came out of its bell was his own voice, backward, cursing Amber in the dark.' },
  };
  const CURSE_LINE = {
    moon: { light: 'At the edges of the morning the colour had begun to go, the way it went at the rim of the Black Circle. He told himself it was the moonset.',
      heavy: 'The grey came in from every side of the dawn, and in the stair under him he felt the flaw he had drawn, blind, in Eric\'s dark. The curse had followed him into the sky.' },
    rebma: { light: 'The sea at the edge of sight was a little greyer than the sea should be. In the Pattern of Rebma one line ran thin, and he did not look at it long.',
      heavy: 'The grey came down through the water like silt, and the Pattern of Rebma showed him its flaw, and the flaw was his. The curse he laid on Amber had found the drowned city too.' },
    lorraine: { light: 'The Circle was gone, but a little of its grey stayed at the edges of things, as a stain stays in cloth after the washing.',
      heavy: 'The Circle was gone from the ground and not from him. The grey came in at every edge of the field, and he knew it at last for what it was: his own curse, coming home.' },
  };
  const CLOSING = {
    1: { moon: 'So the road was walked twice, and the second time he remembered it: every shadow, every turning, and the stair at the end of it, going up into the moon.',
      rebma: 'So the road was walked twice, and the second time he remembered it, as he had remembered Amber once on the Pattern under the sea.',
      lorraine: 'So the road was walked twice, and the second time he remembered it; and he remembered, too, who had laid the curse that waited at the end of it.' },
    2: { moon: 'Three times now he had come down from the moon. He knew the road the way a man knows a song he has sung too often, and still it was not finished with him.',
      rebma: 'Three times now he had come up out of the sea. The road ran under his feet like a tide, out and back, and each time it went out a little farther.',
      lorraine: 'Three times now he had come through Lorraine. Each time the fields were a little greener behind him, and the grey a little nearer ahead.' },
    3: { moon: 'He no longer counted the times he had walked the road. The moon counted for him; it rose over Kolvir each night a little fuller, waiting.',
      rebma: 'He no longer counted the times he had walked the road. Somewhere beneath the sea the Pattern of Rebma kept the count, one turning for each.',
      lorraine: 'He no longer counted the times he had walked the road. Only the curse kept count, and it was patient, and it had all the time in Shadow.' },
  };
  const WORLD_SUB = { moon: 'THE CITY IN THE SKY', rebma: 'AMBER\'S REFLECTION BENEATH THE SEA', lorraine: 'THE FIELDS OF THE BLACK CIRCLE' };
  // the worlds 1-5 vignettes (endings.js), on a new cycle: by the cycle, and under the curse by its weight
  const VIGNETTE = {
    bloom: { 1: ['The Waters Went Down Again', 'HE KNEW THIS GROVE; HE HAD SEEN IT FLOWER ONCE BEFORE, AND THE ROAD UP OUT OF THE VALE WAS WHERE HE HAD LEFT IT'],
      2: ['The Vale, a Third Time', 'THE OLD GROVE FLOWERED AS IT ALWAYS FLOWERED FOR HIM, AND HE DID NOT STAY TO WATCH IT'],
      3: ['The Vale, and the Vale Again', 'HE HAD STOPPED COUNTING THE SPRINGS; THE PETALS FELL, AND THE ROAD WENT ON'],
      light: 'THE PETALS FELL, AND ONE OR TWO OF THEM CAME DOWN GREY', heavy: 'THE GROVE FLOWERED, BUT GREY AT THE EDGES, AS IF THE BLACK CIRCLE HAD BEEN HERE BEFORE HIM' },
    sky: { 1: ['The Fires Went Out Again', 'AND THE SHIP SLIPPED HER MOORINGS AS SHE HAD BEFORE, AND HE KNEW WHICH WAY THE WIND WOULD TAKE HER'],
      2: ['A Third Sailing', 'THE COLOSSUS RAN DOWN, GEAR BY GEAR, AND HE WAS ALREADY AT THE RAIL'],
      3: ['The Same Sunset', 'HOW MANY TIMES HAD HE WATCHED IT? THE SHIP SAILED, AND HE LET IT CARRY HIM'],
      light: 'THE SUNSET HAD A SMEAR OF GREY IN IT THAT NO SKY OF THE SKYPORT HAD EVER HAD', heavy: 'THE FIRES WENT OUT, AND THE SMOKE THAT ROSE FROM THEM WAS THE GREY OF THE BLACK CIRCLE' },
    prism: { 1: ['The Colors Fell Still Again', 'AND THE BLACK ROAD RAN ON INTO THE DARK, AND THIS TIME HE KNEW WHERE IT WENT'],
      2: ['The Black Road, Once More', 'HE HAD WALKED IT TWICE BEFORE, AND IT HAD NOT GROWN ANY SHORTER'],
      3: ['Night on the Rim', 'THE WYRM BROKE AS IT ALWAYS BROKE, AND THE ROAD WAS WAITING, AS IT ALWAYS WAITED'],
      light: 'NIGHT CAME, AND THE COLOURS WENT OUT OF THE RIM; SOME OF THEM DID NOT COME BACK WITH THE STARS', heavy: 'THE BLACK ROAD RAN ON INTO THE DARK, AND HE SAW NOW THAT HE HAD LAID IT, AS HE HAD LAID THE CURSE' },
    chaos: { 1: ['A Thousand Faces, Silent Again', 'THE TY\'IGA LET HIM SLEEP AGAIN AT THE BRINK, AND THIS TIME HE KNEW WHO WAS DREAMING'],
      2: ['The Brink Once More', 'HE LAY DOWN ON THE RIM OF THE ABYSS LIKE A MAN GOING HOME, AND THE SLEEPER DREAMED HIM IN'],
      3: ['The Old Dream', 'THE MASKS FELL, AND HE SLEPT, AND HE NO LONGER WONDERED WHERE HE WOULD WAKE'],
      light: 'THE MASKS FELL QUIET, AND HE SLEPT, AND AT THE EDGES OF THE DREAM SOMETHING GREY WAS WAITING', heavy: 'HE SLEPT AT THE BRINK, AND HIS CURSE SLEPT BESIDE HIM, AND THE SLEEPER DREAMED THEM BOTH' },
    dream: { 1: ['And the Dreamer Woke Again', 'AND SO DID HE, ON THE RIM, WITH THE TRUMPS STILL IN HIS DOUBLET, AND HE REMEMBERED THE CARDS'],
      2: ['The Rim, a Third Time', 'HE WOKE, AND HIS HAND WAS ALREADY ON THE DECK BEFORE HIS EYES WERE OPEN'],
      3: ['The Waking', 'THE DREAM WENT OUT, AND THE RIM CAME BACK, AND THE TRUMPS OF AMBER WERE WHERE THEY ALWAYS WERE'],
      light: 'HE WOKE ON THE RIM WITH THE TRUMPS IN HIS DOUBLET, AND A LITTLE GREY IN THE CORNERS OF HIS EYES', heavy: 'HE WOKE ON THE RIM, AND THE GREY OF THE BLACK CIRCLE HAD COME OUT OF THE DREAM WITH HIM' },
  };

  // ---------------- what he carries, and what carries him ----------------
  function curseNow() {
    if (!save || !save.w8relic || !window.CURSE || !CURSE.state) return { curse: 'none', v: 0 };
    let st = null; try { st = CURSE.state(); } catch (e) {}
    if (!st) return { curse: 'none', v: 0 };
    const heavy = st.v >= (CURSE.HIGH_END || 50) || !!st.finalHigh || !!st.heartDone;
    return { curse: heavy ? 'heavy' : 'light', v: st.v };
  }
  function pearlName() { try { const W = WEAPONS.pearlw; if (W && W.name) return W.name.replace(/^The /, 'the '); } catch (e) {} return 'the reforged Pearl'; }
  function readSave(world) { // read as the ending starts, before this world's own relic is given
    const has = { arm: !!save.silverArm, pearl: !!save.w7relic, horn: !!save.w8relic };
    const forged = !!(window.PEARLNG && PEARLNG.forged && PEARLNG.forged());
    const cu = curseNow();
    return { world, relics: OTHERS[world].filter(k => has[k]), forged, curse: cu.curse, v: cu.v, cycle: save.cycle | 0, first: !(save.endings && save.endings[world]) };
  }
  function norm(o) { // a full permutation, from whatever was given (the save fills in the rest)
    const world = WORLDS.includes(o.world) ? o.world : 'moon', base = o.fromSave ? readSave(world) : null;
    const relics = (o.relics || (base ? base.relics : [])).filter(k => OTHERS[world].includes(k));
    const cycle = Math.max(1, (o.cycle ?? (base ? base.cycle : save.cycle)) | 0);
    return { world, relics: OTHERS[world].filter(k => relics.includes(k)), forged: !!(o.forged ?? (base && base.forged)) && relics.includes('pearl'),
      curse: ['none', 'light', 'heavy'].includes(o.curse) ? o.curse : base ? base.curse : 'none', v: o.v ?? (base ? base.v : 0), cycle, cyc: cycB(cycle),
      first: !!(o.first ?? (base ? base.first : false)), name: o.name || pearlName() };
  }

  // ---------------- the beats ----------------
  function compose(o) {
    const c = o.cyc ? o : norm(o), w = c.world, heavy = c.curse === 'heavy', beats = [];
    beats.push({ id: `open:${w}:${c.first ? 'first' : 'again'}`, kind: 'open', line: OPENING[w][c.first ? 'first' : 'again'], lead: 1.7, min: 6.5, set: 'cur', theme: THEME[w],
      head: `${NAME[w]}  ·  THE ROAD WALKED A ${ordOf(c.cycle + 1).toUpperCase()} TIME` });
    for (const r of c.relics) {
      const forged = r === 'pearl' && c.forged, tab = forged ? RELIC.forged : RELIC[r];
      let line = heavy ? tab.heavy : tab[w]; if (typeof line === 'function') line = line(c.name);
      beats.push({ id: `relic:${r}${forged ? ':forged' : ''}:${w}${heavy ? ':heavy' : ''}`, kind: 'relic', relic: r, forged, line, lead: .8, min: 6.5, set: 'zone', theme: ZONE[w] });
    }
    if (c.curse !== 'none') beats.push({ id: `curse:${w}:${c.curse}`, kind: 'curse', weight: c.curse, line: CURSE_LINE[w][c.curse], lead: .9, min: heavy ? 8 : 7, set: 'cur', theme: THEME[w] });
    beats.push({ id: `close:${w}:c${c.cyc}`, kind: 'close', line: CLOSING[c.cyc][w], lead: .8, min: 7, set: 'road', theme: 'bloom', noOut: 1 });
    beats.push({ id: 'credits', kind: 'credits', line: null, set: 'road', theme: 'bloom', noIn: 1 });
    for (const b of beats) b.dur = b.kind === 'credits' ? Infinity : Math.max(b.min, b.lead + FADE + readT(b.line) + FADE + .45);
    return { c, beats, key: beats.map(b => b.id).join(' > ') };
  }
  function credits(c) {
    const rows = [['SHADOW ROAD', 22], [`the road walked a ${ordOf(c.cycle + 1)} time`, 9], ['', 8], [NAME[c.world], 12], [WORLD_SUB[c.world], 8], ['', 10], ['WHAT HE CARRIED', 9]];
    const all = ['arm', 'pearl', 'horn'].filter(k => k === OWN[c.world] || c.relics.includes(k));
    for (const k of all) rows.push([k === 'pearl' && c.forged ? c.name : RELIC_NAME[k], 8.5]);
    if (c.curse !== 'none') rows.push(['', 8], ['WHAT CARRIED HIM', 9], [c.curse === 'heavy' ? 'the Black Circle, his own curse, come home' : 'the Black Circle, a little, at the edges', 8.5]);
    rows.push(['', 10], ['after Roger Zelazny\'s The Chronicles of Amber', 10], ['', 14], ['Thank you for walking the road again.', 12]);
    return rows;
  }

  // ======================================================================================================
  // THE PAINTING
  // ======================================================================================================
  let E = null; const HOLD = { at: null };
  function setFor(b) { // the painted layers a beat stands on, built as it begins (behind the black) and let go once done with
    let B = E.sets[b.set];
    if (B && B.K !== K) { dropAlt(B); B = null; }
    if (!B) { B = E.sets[b.set] = buildAlt(b.theme, 300 + WORLDS.indexOf(E.c.world) * 17 + (b.set.length * 7)); }
    return B;
  }
  function release(keep) { for (const k in E.sets) if (!keep.includes(k)) { dropAlt(E.sets[k]); delete E.sets[k]; } }
  const floorY = () => FLOOR_TOP + 64;
  function narr(str, a, y, size = 10) { // the line: wrapped, on a soft plate of shadow, inked so it reads on any sky
    if (a <= 0 || !str) return;
    ctx.save(); ctx.font = `700 ${size}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const maxW = Math.min(VW - 80, 520), rows = []; let row = '';
    for (const w of str.split(' ')) { const tr = row ? row + ' ' + w : w; if (ctx.measureText(tr).width > maxW && row) { rows.push(row); row = w; } else row = tr; } if (row) rows.push(row);
    const lh = size * 1.55, wMax = Math.max(...rows.map(r => ctx.measureText(r).width));
    ctx.fillStyle = `rgba(10,7,14,${.46 * a})`; rrect(VW / 2 - wMax / 2 - 14, y - size - 7, wMax + 28, rows.length * lh + 10, 7); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = `rgba(10,6,14,${.7 * a})`; ctx.fillStyle = `rgba(246,240,228,${a})`;
    rows.forEach((r, i) => { ctx.strokeText(r, VW / 2, y + i * lh); ctx.fillText(r, VW / 2, y + i * lh); });
    ctx.restore();
  }
  function heading(str, a) {
    if (a <= 0) return; ctx.save(); ctx.font = '700 7.5px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 2.4; ctx.strokeStyle = `rgba(10,6,14,${.7 * a})`; ctx.fillStyle = `rgba(232,212,160,${a})`;
    ctx.strokeText(str, VW / 2, Y_OFF + 14); ctx.fillText(str, VW / 2, Y_OFF + 14); ctx.restore();
  }
  function motes(n, rgb, T, a, rise = 1) { // light rising off the place, or ash coming down on it (rise < 0)
    if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = rise > 0 ? 'lighter' : 'source-over'; const N = lite() ? n >> 1 : n;
    for (let i = 0; i < N; i++) { const life = (T * .09 * (1 + hsh(i + 3)) + hsh(i)) % 1, x = hsh(i + 1) * VW + Math.sin(T * .7 + i) * 8, y = rise > 0 ? VH - life * VIEW_H : Y_OFF + life * VIEW_H;
      ctx.fillStyle = `rgba(${rgb},${Math.sin(life * Math.PI) * a * (.5 + .5 * hsh(i + 7))})`; circle(x, y, .8 + hsh(i + 9) * 1.2); ctx.fill(); }
    ctx.restore();
  }
  function wash(rgb, a, op = 'soft-light') { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = op; ctx.fillStyle = `rgba(${rgb},${a})`; view(); ctx.restore(); }
  function vignetteDark(a) { if (a <= 0) return; ctx.save(); const g = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .55, VIEW_H * .3, VW / 2, Y_OFF + VIEW_H * .55, VW * .75); g.addColorStop(0, 'rgba(8,6,14,0)'); g.addColorStop(1, `rgba(8,6,14,${a})`); ctx.fillStyle = g; view(); ctx.restore(); }
  // the grey of the Black Circle, creeping in from the edges of the view: k its strength, inner how far in it has come (0..1)
  function greyEdges(k, inner, T) {
    if (k <= 0) return; const cx = VW / 2, cy = Y_OFF + VIEW_H * .55, R = Math.hypot(VW, VIEW_H) * .55, r0 = R * inner, r1 = Math.max(r0 + 20, R * Math.min(1.05, inner + .4));
    ctx.save(); ctx.globalCompositeOperation = 'saturation'; let g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1); g.addColorStop(0, 'rgba(128,128,128,0)'); g.addColorStop(1, `rgba(128,128,128,${k})`); ctx.fillStyle = g; view();
    ctx.globalCompositeOperation = 'multiply'; g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1); g.addColorStop(0, 'rgba(200,196,204,0)'); g.addColorStop(1, `rgba(150,144,156,${.6 * k})`); ctx.fillStyle = g; view();
    ctx.restore();
    const n = lite() ? 8 : 16; for (let i = 0; i < n; i++) { const a = i / n * TAU + T * .05, d = r1 * (.92 + .1 * Math.sin(T * .6 + i)), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .6; softDab(x, y, 50 + hsh(i) * 30, '110,104,116', .22 * k); } // wisps of it at the rim
  }
  function blackCircle(x, y, r, t, a) { // the Circle on the horizon: a ring of dead ground, black at its heart, an ember of red in its rim
    if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#0E0A10'; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const q = i / 30 * TAU, rr = r * (1 + (hsh(i + 7) - .5) * .16); ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr * .22); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(170,50,60,${.5 + .2 * Math.sin(t * 2)})`; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,110,130,.35)'; ctx.lineWidth = 4; ell(x, y, r * 1.12, r * .26); ctx.stroke();
    ctx.restore();
  }
  // a Pattern laid round his feet, seen low: its turns as arcs of blue fire; flaw (0..1) is the break he put in it
  function patternAt(x, y, R, k, flaw, t, heavy) {
    if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, .26); ctx.lineCap = 'round';
    const rings = 5, fa = -.5; // (the flaw sits on the near side, to his right)
    for (let i = 0; i < rings; i++) { const r = R * (.32 + i * .17), a0 = i * 1.3 + .4, span = TAU * .86 * k;
      for (const [lw, col] of [[7, 'rgba(10,20,50,.55)'], [3.2, `rgba(90,140,255,${.75 * k})`], [1.1, `rgba(236,242,255,${.8 * k})`]]) {
        ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath();
        if (flaw > 0) { const g0 = fa - .12 - flaw * .3, g1 = fa + .12 + flaw * .3; // the arc, broken where the flaw runs through
          ctx.arc(0, 0, r, Math.max(a0, g1), a0 + span); ctx.stroke(); ctx.beginPath(); if (g0 > a0 - TAU + span) ctx.arc(0, 0, r, a0, Math.min(a0 + span, g0 + TAU)); }
        else ctx.arc(0, 0, r, a0, a0 + span);
        ctx.stroke(); } }
    if (flaw > 0) { // the flaw itself: a crack of black through every turn, and the grey bleeding out of it
      ctx.strokeStyle = `rgba(6,4,8,${.9 * flaw})`; ctx.lineWidth = heavy ? 5 : 2.4; ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const u = i / 12, r = R * (.25 + u * .85), q = fa + Math.sin(u * 9 + 1) * .06 * (1 + flaw); i ? ctx.lineTo(Math.cos(q) * r, Math.sin(q) * r) : ctx.moveTo(Math.cos(q) * r, Math.sin(q) * r); } ctx.stroke();
      if (heavy) { ctx.strokeStyle = `rgba(170,40,50,${.55 * flaw * (.7 + .3 * Math.sin(t * 5))})`; ctx.lineWidth = 1; ctx.stroke(); } }
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowR(x, y, R * .9, '110,150,255', .14 * k * (1 - flaw * .6)); ctx.restore();
  }
  function blackRoad(x0, y0, x1, y1, k, t) { // from his feet to the Circle on the horizon
    if (k <= 0) return; const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
    ctx.save(); ctx.fillStyle = 'rgba(10,8,12,.92)'; ctx.beginPath(); ctx.moveTo(x0 - 34, y0 + 6); ctx.lineTo(x0 + 34, y0 + 6); ctx.lineTo(xe + 4 * (1 - k) + 3, ye); ctx.lineTo(xe - 3, ye); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(170,30,40,${.4 + .15 * Math.sin(t * 3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + 6); ctx.lineTo(xe, ye); ctx.stroke(); ctx.restore();
  }
  function hero(x, y, s, f, pose, a = 1) { inkHero(x, y, s, f, pose, a, false); } // (his cloak hangs still: these are paintings, and several of him may be on one)
  function idlePose(weapon) { const p = poseAs('idle'); p.weapon = weapon || 'fists'; return p; }
  function walkPose(walk, weapon) { const p = poseAs('walk', walk); p.weapon = weapon || 'fists'; return p; }

  // ---------------- the opening: the world just cleared ----------------
  const OPEN = {
    moon(b, T, t) { // dawn under the city of the moon: it thins to mist and motes, and the stair goes faint under him
      const k = sm(T / 6), cam = 260 + T * 7;
      withSet(setFor(b), () => paintWorld('moonBoss', { cam, midA: 1 - k * .65, farA: 1 - k * .3 }, t));
      gradeFrame('moonBoss');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, 0, VW, 0); g.addColorStop(0, `rgba(255,190,150,${.32 * k})`); g.addColorStop(.6, 'rgba(255,190,150,0)'); ctx.fillStyle = g; view(); ctx.restore(); // the sun, coming from the east
      wash('255,214,180', .38 * k); wash('235,240,255', .14 * k, 'screen'); // the dawn coming up warm, and the city going to mist
      motes(46, '255,240,225', T, .8 * k);
      const x = VW * .34 + Math.min(T, 4.5) * 10, y = floorY();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const u = i / 8, a = (1 - k * .8) * (.5 - Math.abs(u - .5) * .6); ctx.fillStyle = `rgba(225,235,255,${a})`; ctx.fillRect(x - 70 + i * 16, y + 2 + i * .6, 14, 2.2); } ctx.restore(); // the stair, fading under his feet
      hero(x, y, 1.05, 1, T < 4.5 ? walkPose(T * 6) : idlePose());
    },
    rebma(b, T, t) { // the hall of the Pattern, the water gone still over it; light comes down through it in shafts
      const cam = 320;
      withSet(setFor(b), () => paintWorld('rebmaBoss', { cam }, t));
      gradeFrame('rebmaBoss');
      const x = VW * .44, y = floorY();
      patternAt(x, y + 4, Math.min(260, VW * .4), sm(T / 2.4), 0, t, false);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const sx = VW * (.12 + i * .2) + Math.sin(t * .4 + i) * 14, a = .07 * (.6 + .4 * Math.sin(t * .8 + i * 2)); ctx.fillStyle = `rgba(170,230,235,${a})`; ctx.beginPath(); ctx.moveTo(sx - 12, Y_OFF); ctx.lineTo(sx + 12, Y_OFF); ctx.lineTo(sx + 60, FLOOR_BOT); ctx.lineTo(sx + 14, FLOOR_BOT); ctx.closePath(); ctx.fill(); } ctx.restore();
      motes(30, '220,250,255', T, .6, 1); // bubbles
      hero(x, y, 1.05, 1, idlePose());
    },
    lorraine(b, T, t) { // the grey goes out of the Circle's heart from where he stands, and the colour comes back
      const cam = 300, x = VW * .42, y = floorY();
      withSet(setFor(b), () => paintWorld('lorraineBoss', { cam }, t));
      gradeFrame('lorraineBoss');
      const r = sm((T - .6) / 5) * VW * 1.2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, Y_OFF, VW, VIEW_H); ctx.ellipse(x, y - 30, Math.max(1, r), Math.max(1, r * .6), 0, 0, TAU, true); ctx.clip('evenodd');
      ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.9)'; view(); ctx.restore(); // (outside the ring, still grey)
      if (r > 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - 30, r, r * .6, 0, 0, TAU); ctx.clip(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(140,210,110,.55)'; view(); ctx.restore();
        for (let i = 0; i < (lite() ? 30 : 60); i++) { const fx = hsh(i) * VW, fy = FLOOR_TOP + 8 + hsh(i + 1) * (FLOOR_BOT - FLOOR_TOP - 10), d = Math.hypot(fx - x, (fy - y + 30) / .6); if (d > r) continue; const kk = cl01((r - d) / 50);
          ctx.strokeStyle = '#4E7A30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 4 * kk); ctx.stroke(); ctx.fillStyle = ['#F6E8EE', '#F2D24A', '#E8F0F6', '#D86A8A'][i % 4]; circle(fx, fy - 4 * kk, .8 + kk); ctx.fill(); } }
      hero(x, y, 1.05, 1, idlePose());
    },
  };

  // ---------------- the relics he carries, each with its own moment, in the light of the world he stands in ----------------
  function forgedPic(size) { // the reforged Pearl, painted once into its own canvas for the beat (never per frame)
    if (E.fpic && E.fpic.K === K && E.fpic.size === size) return E.fpic;
    const spec = window.PEARLW && PEARLW.spec && PEARLW.spec(); if (!spec) return null;
    const c = document.createElement('canvas'), S = Math.min(2, K); c.width = Math.ceil(size * S); c.height = Math.ceil(size * S);
    const g = c.getContext('2d'); g.scale(S, S); const fl = FLASH, ti = TINT; FLASH = false; TINT = null;
    try { PEARLW.drawBig(g, spec, size / 2, size / 2, size * .92, -.62); } catch (e) { console.error(e); return null; } finally { FLASH = fl; TINT = ti; }
    c.K = K; c.size = size; E.fpic = c; return c;
  }
  function relicGround(b, w, T, t, cam) { // the world's own first stretch, lit for the moment
    withSet(setFor(b), () => paintWorld(ZONE[w], { cam: cam + T * 4 }, t));
    gradeFrame(ZONE[w]);
    if (w === 'moon') { wash('255,206,170', .3 * sm(T / 4)); vignetteDark(.4); } // the moon going down, the dawn coming
    else if (w === 'rebma') { vignetteDark(.45); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const sx = VW * (.2 + i * .22) + Math.sin(t * .3 + i) * 12; ctx.fillStyle = `rgba(160,230,230,${.06 + .03 * Math.sin(t + i)})`; ctx.beginPath(); ctx.moveTo(sx - 10, Y_OFF); ctx.lineTo(sx + 10, Y_OFF); ctx.lineTo(sx + 50, FLOOR_BOT); ctx.lineTo(sx + 10, FLOOR_BOT); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    else { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.55)'; view(); ctx.restore(); vignetteDark(.4); } // the grey light of Lorraine, after the Circle
  }
  const RELICS = {
    arm(b, T, t, heavy, f, w) { // he lifts the silver hand, and the arm it is part of hangs in the air beside him, turning, shining
      relicGround(b, w, T, t, 520);
      const ax = VW * .63, ay = Y_OFF + VIEW_H * .44 + Math.sin(T * 1.1) * 4, k = sm((T - .4) / 1.4);
      glowR(ax, ay, 130, w === 'rebma' ? '170,230,240' : '210,222,255', .5 * k);
      if (window.W5 && W5.kit && W5.kit.silverArm) { const SA_ = W5.kit.silverArm, s = 3.6; ctx.save(); ctx.globalAlpha = k; ctx.translate(ax, ay); ctx.rotate(Math.sin(T * .5) * .1);
        try { SA_.quiet = true; SA_(-11 * s, 2 * s, -.12, 0, sm((T - 1.5) / 1.2), s, t); } finally { SA_.quiet = false; } ctx.restore(); }
      if (heavy) { for (let i = 0; i < 7; i++) softDab(ax - 40 + hsh(i) * 90, ay + (hsh(i + 3) - .5) * 24, 10 + hsh(i + 5) * 10, '110,106,118', .5 * k); } // the tarnish, at its joints
      else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const q = ((T * .45 + i / 5) % 1); ctx.strokeStyle = `rgba(225,232,255,${.3 * (1 - q) * k})`; ctx.lineWidth = 1; ell(ax, ay, 30 + q * 110, 8 + q * 30); ctx.stroke(); } ctx.restore(); }
      const pose = idlePose(); const lift = sm((T - 1) / 1.6); pose.arm = lerp(.7, -1.25, lift); pose.elbow = .2 * lift;
      hero(VW * .3, floorY(), 1.15, 1, pose);
      if (lift > .2) glowR(VW * .3 + 16, floorY() - 112, 26, '230,236,255', .5 * lift); // and his own hand, silver, catching the light
      motes(24, w === 'rebma' ? '220,250,255' : '230,236,255', T, .5);
    },
    pearl(b, T, t, heavy, forged, w) { // the Pearl rises off his palm and hangs there, the tide turning in it; or the weapon it became, in his hands
      relicGround(b, w, T, t, 860);
      const hx = VW * .34, y = floorY(), k = sm((T - .3) / 1.6);
      if (forged) {
        const sz = Math.min(230, VIEW_H * .8), c = forgedPic(sz), px = VW * .66, py = Y_OFF + VIEW_H * .5 + Math.sin(T) * 3;
        glowR(px, py, sz * .55, heavy ? '120,110,140' : '150,220,240', .4 * k);
        if (c) { ctx.save(); ctx.globalAlpha = k; ctx.drawImage(c, px - sz / 2, py - sz / 2, sz, sz); ctx.restore(); }
        else if (window.W7 && W7.drawPearl) W7.drawPearl(px, py, 3.2 * k, t, true);
        if (heavy) { ctx.save(); ctx.globalAlpha = .8 * k; ctx.strokeStyle = '#08050A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px - sz * .24, py + sz * .2); ctx.quadraticCurveTo(px - sz * .02, py - sz * .02, px + sz * .16, py - sz * .26); ctx.stroke(); ctx.restore(); }
        if (w === 'lorraine') { ctx.save(); ctx.globalAlpha = .55 * sm((T - 1.5) / 2); ctx.fillStyle = '#2A3A46'; ell(hx + 40, y + 4, 34 * sm((T - 1.5) / 3), 7 * sm((T - 1.5) / 3)); ctx.fill(); ctx.restore(); } // the dead ground going dark with water
        hero(hx, y, 1.15, 1, idlePose(window.WEAPONS && WEAPONS.pearlw ? 'pearlw' : 'fists'));
      } else {
        const pose = idlePose(); const lift = sm((T - .5) / 1.2); pose.arm = lerp(.7, -.35, lift); pose.elbow = .5 * lift;
        hero(hx, y, 1.15, 1, pose);
        const ox = hx + 34, oy = y - 96 - sm((T - 1.4) / 2) * 30 + Math.sin(T * 1.6) * 2, r = 10 + 5 * sm((T - 1.4) / 2);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const q = ((T * .35 + i / 4) % 1); ctx.strokeStyle = `rgba(170,230,240,${.45 * (1 - q) * k})`; ctx.lineWidth = 1.2; ell(ox, oy, r + q * 90, (r + q * 90) * .3); ctx.stroke(); } ctx.restore(); // the tide, going out from it in rings
        glowR(ox, oy, r * 5, heavy ? '120,110,140' : '150,200,255', .5 * k);
        const picks = (window.PEARLNG && PEARLNG.state && PEARLNG.state().picks) || [];
        try { if (window.PEARLNG && PEARLNG.art && PEARLNG.art.blitOrb) PEARLNG.art.blitOrb(picks, ox, oy, r, 1, t * .8, k); else if (window.W7 && W7.drawPearl) W7.drawPearl(ox, oy + 6, r / 6, t, true); } catch (e) { if (window.W7 && W7.drawPearl) W7.drawPearl(ox, oy + 6, r / 6, t, true); }
        if (heavy) { ctx.save(); ctx.globalAlpha = .85 * k; ctx.strokeStyle = '#06040A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox - r * .7, oy + r * .3); ctx.quadraticCurveTo(ox - r * .1, oy - r * .1, ox + r * .5, oy - r * .7); ctx.stroke(); ctx.restore(); } // the vein of black in it
        if (w === 'lorraine') { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(120,200,220,${.35 * k})`; view(); ctx.restore(); } // the field, for a moment, in the light of the sea
      }
      motes(26, '220,250,255', T, .55);
    },
    horn(b, T, t, heavy, f, w) { // he lifts the Horn and blows, and its call goes out; under the sea he only holds it, and it hums
      relicGround(b, w, T, t, 300);
      const x = VW * .36, y = floorY(), blow = heavy || w !== 'rebma', A = .7, Bl = 1.6, END_ = blow ? 5.4 : 1e9, Tl = END_ + 1;
      const hp = window.W8 && W8.hornPoseAt ? W8.hornPoseAt(blow ? T : Math.min(T, A + .4), A, Bl, END_, Tl) : idlePose(); hp.Y = .25;
      const ih = window.W8 ? W8.hornInHand : false; if (window.W8) W8.hornInHand = !!hp.inHand || !W8.hornPoseAt;
      try { if (!hp.inHand && window.W8 && W8.hornPoseAt) hp.weapon = 'fists'; hero(x, y, 1.15, 1, hp); } finally { if (window.W8) W8.hornInHand = ih; }
      if (!blow) { const k = sm((T - 1) / 1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const q = ((T * .6 + i / 4) % 1); ctx.strokeStyle = `rgba(240,214,140,${.4 * (1 - q) * k})`; ctx.lineWidth = 1; ell(x + 10, y - 70, 14 + q * 40, 10 + q * 26); ctx.stroke(); } ctx.restore(); } // the hum of it, against his ribs
      else if (T > Bl && T < END_ + .6) { const k = sm((T - Bl) / .4) * (1 - sm((T - END_) / .6)), bx = x + 24, by = y - 92; // the call, going out of the bell
        glowR(bx, by, 40, heavy ? '150,40,60' : '255,220,150', .45 * k);
        ctx.save(); ctx.globalCompositeOperation = heavy ? 'source-over' : 'lighter';
        for (let i = 0; i < 5; i++) { let q = ((T - Bl) * .45 + i / 5) % 1; if (heavy) q = 1 - q; const r = 10 + q * 220;
          ctx.strokeStyle = heavy ? `rgba(24,14,24,${.8 * (1 - q * .5) * k})` : `rgba(255,226,150,${.85 * (1 - q) * k})`; ctx.lineWidth = heavy ? 3 : 2.2; ctx.beginPath(); ctx.ellipse(bx, by, r, r * .55, 0, -.7, .7); ctx.stroke();
          if (heavy) { ctx.strokeStyle = `rgba(190,40,50,${.7 * (1 - q * .5) * k})`; ctx.lineWidth = 1.1; ctx.stroke(); } }
        ctx.restore();
        if (!E.blown) { E.blown = 1; if (typeof tone === 'function' && sfxOn && actx) { const d = heavy ? .94 : 1; tone(147 * d, 1.4, 'sawtooth', .06, heavy ? 130 : 196); tone(220 * d, 1.1, 'sawtooth', .045, heavy ? 200 : 294, .6); tone(294 * d, 1.5, 'triangle', .05, 0, 1.1); } } }
      if (w === 'moon') motes(30, '255,240,225', T, .5);
      if (heavy) greyEdges(.5, .55, T);
    },
  };

  // ---------------- the curse: the grey at the edges, the Pattern's flaw, the Black Road ----------------
  function paintCurse(b, T, t) {
    const heavy = b.weight === 'heavy', w = E.c.world, x = VW * .42, y = floorY();
    withSet(setFor(b), () => paintWorld(THEME[w], { cam: 300 + T * 3 }, t));
    gradeFrame(THEME[w]);
    const grow = sm(T / (b.dur * .7));
    if (heavy) wash('70,64,76', .35 * grow, 'multiply');
    const cx = VW * .74, cy = FLOOR_TOP - 3; blackCircle(cx, cy, heavy ? lerp(50, 120, grow) : 34, t, heavy ? 1 : .7 * sm(T / 2));
    patternAt(x, y + 4, Math.min(240, VW * .36), sm(T / 1.8), heavy ? lerp(.15, 1, grow) : .12 * sm((T - 1.5) / 2), t, heavy);
    if (heavy) blackRoad(x + 6, y + 6, cx, cy + 1, sm((T - 1.2) / 3.5), t);
    hero(x, y, 1.05, 1, idlePose());
    greyEdges(heavy ? .95 : .55, heavy ? lerp(.85, .18, grow) : lerp(1, .62, grow), T);
    if (heavy) motes(50, '40,34,44', T, .7 * grow, -1); // ash
  }

  // ---------------- the closing: the road again, from its start; the walks before go on ahead of him ----------------
  function paintClose(b, T, t) {
    const cam = 200 + T * 18, y = floorY(), x = VW * .38, n = Math.min(E.c.cycle, 5);
    withSet(setFor(b), () => paintWorld('bloom', { cam }, t));
    gradeFrame('bloom');
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, 'rgba(160,90,150,.45)'); g.addColorStop(1, 'rgba(255,160,90,.4)'); ctx.fillStyle = g; view(); ctx.restore(); // evening, on the Vale
    for (let i = n; i >= 1; i--) { // the walks before this one, pale, going on ahead
      const gx = x + i * 52 + Math.sin(T * .3 + i) * 4, a = .34 / Math.sqrt(i) * sm((T - .3 * i) / 1.5), ti = TINT; TINT = '#B8C2E0';
      try { hero(gx, y - i * 3, 1 - i * .05, 1, walkPose(T * 6.5 + i * 1.7), a); } finally { TINT = ti; }
    }
    hero(x, y, 1, 1, walkPose(T * 6.5));
    if (E.c.curse !== 'none') greyEdges(E.c.curse === 'heavy' ? .6 : .3, E.c.curse === 'heavy' ? .6 : .85, T);
  }

  // ======================================================================================================
  // RUNNING IT
  // ======================================================================================================
  function render(t) {
    const now = performance.now(), rdt = Math.min(.05, (now - E.last) / 1000); E.last = now; E.real += rdt;
    const dt = HOLD.at !== null && E.bt >= HOLD.at ? 0 : rdt; E.bt += dt;
    let b = E.beats[E.i];
    if (E.bt >= b.dur) { next(); b = E.beats[E.i]; }
    pollPad();
    const T = E.bt;
    ctx.fillStyle = '#08060C'; view();
    try {
      if (b.kind === 'open') OPEN[E.c.world](b, T, t);
      else if (b.kind === 'relic') RELICS[b.relic](b, T, t, E.c.curse === 'heavy', b.forged, E.c.world);
      else if (b.kind === 'curse') paintCurse(b, T, t);
      else paintClose(b, E.closeT0 + T, t);
      cycleTint();
    } catch (err) { if (!E.warned) { E.warned = 1; console.error(err); } }
    if (b.kind === 'open') heading(b.head, sm((T - .3) / FADE) * (1 - sm((T - (b.dur - BEAT_FADE - FADE)) / FADE)));
    if (b.line) { const la = sm((T - b.lead) / FADE) * (1 - sm((T - (b.lead + FADE + readT(b.line))) / FADE)); narr(b.line, la, Y_OFF + (b.kind === 'open' ? 42 : 28)); }
    if (b.kind === 'credits') rollCredits(T);
    const fin = b.noIn ? 1 : sm(T / BEAT_FADE), fout = b.noOut || b.dur === Infinity ? 0 : sm((T - (b.dur - BEAT_FADE)) / BEAT_FADE), dark = Math.max(1 - fin, fout);
    if (dark > 0) { ctx.fillStyle = `rgba(8,6,12,${dark})`; view(); }
    if (E.real > 1) { ctx.save(); ctx.globalAlpha = cl01(E.real - 1) * .8; ctx.fillStyle = 'rgba(232,222,200,.75)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); ctx.restore(); }
    paperFrame();
    if (E && E.credEnd) finish();
  }
  function rollCredits(T) {
    const a = cl01(T / 1.2); ctx.fillStyle = `rgba(6,5,10,${.8 * a})`; view();
    let y = VH + 10 - T * CRED_SPEED; ctx.save(); ctx.textAlign = 'center';
    for (const [s, sz] of E.credits) { y += sz + 8; if (!s) continue; const fa = cl01((y - Y_OFF) / 40) * cl01((VH - y) / 40); if (fa <= 0) continue; ctx.fillStyle = `rgba(236,230,214,${fa})`; ctx.font = `700 ${sz}px Cinzel, Georgia, serif`; ctx.fillText(s, VW / 2, y); }
    ctx.restore(); E.credY = y;
    if (y < Y_OFF - 10) E.credEnd = true;
  }
  function next() {
    const b = E.beats[E.i]; if (b.kind === 'close') E.closeT0 = E.bt; // (the credits roll over the same walk, going on)
    if (E.i >= E.beats.length - 1) { E.credEnd = true; return; }
    E.i++; E.bt = 0; E.blown = 0; E.fpic = null;
    const nb = E.beats[E.i], keep = E.beats.slice(E.i).map(x => x.set); release(keep);
    if (nb.kind === 'relic') sfx('learned');
    if (nb.kind === 'curse' && nb.weight === 'heavy') sfx('roar', .4);
  }
  function skip(all) {
    if (!E || E.real < .5) return false;
    const b = E.beats[E.i];
    if (all || b.kind === 'credits') { finish(); return true; }
    if (E.bt < .35) return false; // (the press that skipped the last beat does not skip this one too)
    next(); return true;
  }
  let pad = false;
  function pollPad() { let down = false; try { for (const gp of (navigator.getGamepads ? navigator.getGamepads() : [])) if (gp) for (const bt of gp.buttons) if (bt && bt.pressed) down = true; } catch (e) {} if (down && !pad) skip(); pad = down; }
  function start(world, sc, o) {
    if (E) return;
    const preview = !!(o && o.preview), c = norm(Object.assign({ world, fromSave: !preview }, o || {}));
    const comp = compose(c);
    if (!preview) { save[RELIC_KEY[OWN[world]]] = true; persist(); } // this world's own relic, as its first-walk ending gives it
    E = { c, beats: comp.beats, key: comp.key, i: 0, bt: 0, real: 0, last: performance.now(), sc, sets: {}, credits: credits(c), closeT0: 0, preview, log: [] };
    mode = 'ending'; clearInput();
    hitstop = 0; slowmo = 0; shakeMag = 0; zoom = 0; flashT = 0; hurtFlash = 0; mirrorT = 0; stillT = 0;
    if (P) { P.inv = 0; P.z = 0; P.vz = 0; P.state = 'idle'; P.move = null; }
    if (window.W7 && world === 'rebma') W7.pearl = null; if (window.W8 && world === 'lorraine') { W8.hornDrop = null; W8.hornInHand = false; }
    $('#bossbar').hidden = true; $('#banner').classList.remove('on'); bannerT = 0;
    app.classList.add('nocontrols', 'sr-end'); app.classList.remove('playing');
    const m = MUSIC[world]; if (typeof TRACKS !== 'undefined' && TRACKS[m]) playMusic(m);
  }
  function cleanup() { if (!E) return null; const e = E; E = null; for (const k in e.sets) dropAlt(e.sets[k]); e.sets = {}; e.fpic = null; app.classList.remove('nocontrols', 'sr-end'); if (P && P.state !== 'dead') { P.state = 'idle'; P.walk = 0; } return e; }
  let swallowT = 0;
  function finish() {
    const e = cleanup(); if (!e) return; swallowT = performance.now() + 450;
    LAST = { key: e.key, ids: e.beats.map(b => b.id), lines: e.beats.map(b => b.line).filter(Boolean), c: e.c };
    e.sc();
    if (mode === 'win') winWords(e.c);
  }
  function winWords(c) { // the win card, for a road walked again (the curse's own coda, corruption.js, may write over it after)
    const k = $('#winOv .kicker'), h2 = $('#winOv .h2'), again = !c.first;
    const W = { moon: ['THE MOON IS DOWN', again ? 'You came down from the moon again' : 'You came down from the moon', "Tir-na Nog'th faded with the dawn, and Benedict's silver arm came down the stair with you."],
      rebma: ['THE TIDE HAS TURNED', again ? 'You came up out of Rebma again' : 'You came up out of Rebma', 'The King in the Glass is broken, the Pattern of Rebma runs the right way again, and the Pearl of Judgement is yours.'],
      lorraine: ['THE CIRCLE IS BROKEN', again ? 'You unmade it again' : 'You unmade what you made', 'The Black Circle is gone out of Lorraine, and Ganelon\'s war-horn is yours, and with it the Long March.'] }[c.world];
    if (k) k.textContent = `${W[0]} · THE ${ordOf(c.cycle + 1).toUpperCase()} WALKING`; if (h2) h2.textContent = W[1];
    const carried = c.relics.map(r => r === 'pearl' && c.forged ? c.name : RELIC_NAME[r]);
    const cs = c.curse === 'heavy' ? ' The curse walks with you, heavier than it was.' : c.curse === 'light' ? ' The curse walks with you still, quietly, at the edges.' : '';
    $('#winText').textContent = `${W[2]}${carried.length ? ` You carried ${carried.join(' and ')} down this road too.` : ''}${cs} Walking the road again starts a harder cycle: enemies hit harder and have more health, but drop more shards. Your weapons, levels, cards and relics come with you.`;
  }
  let LAST = null;

  // ---------------- hooks ----------------
  const NGP = () => typeof save !== 'undefined' && !!save && (save.cycle | 0) >= 1;
  function hook(Wobj, world) {
    if (!Wobj || typeof Wobj.startEnding !== 'function') { console.error('ng_endings.js: no ending to replace for ' + world); return; }
    const orig = Wobj.startEnding;
    Wobj.startEnding = function (sc) { if (E) return; if (NGP()) { start(world, sc || (() => {})); return; } return orig.apply(this, arguments); };
  }
  hook(window.W5, 'moon'); hook(window.W7, 'rebma'); hook(window.W8, 'lorraine');
  { const _hl = heroLook; heroLook = function () { const L = _hl(); // (a preview of a road where he carries the arm: his hands are silver, as art_w5.js makes them once it is his)
    if (E && E.preview && !save.silverArm && (E.c.world === 'moon' || E.c.relics.includes('arm'))) { L.glove = '#C8D0DE'; L.gauntPlate = 1; } return L; }; }
  const _ds = drawScene;
  drawScene = function (t) {
    if (E && mode !== 'ending') cleanup(); // something else took over (a menu, or a test): let it go quietly
    if (E) { render(t); return; }
    return _ds(t);
  };
  window.addEventListener('keydown', (e) => {
    if (!E) { if (performance.now() < swallowT && (e.repeat || ['Enter', 'NumpadEnter', 'Space'].includes(e.code))) { e.stopImmediatePropagation(); e.preventDefault(); } return; }
    if (!e.repeat) { if (e.code === 'Escape') skip(true); else if (['Enter', 'NumpadEnter', 'Space', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyO'].includes(e.code)) skip(); }
    e.stopImmediatePropagation(); e.preventDefault(); // nothing else hears keys while it plays
  }, true);
  window.addEventListener('pointerdown', (e) => { if (E) { skip(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // ---------------- the worlds 1-5 vignettes' words on a new cycle (endings.js asks) ----------------
  function vignette(theme) {
    if (!NGP() || !VIGNETTE[theme]) return null;
    const V = VIGNETTE[theme], cy = cycB(save.cycle | 0), cu = curseNow().curse, [title, sub] = V[cy];
    return { title, sub: cu === 'none' ? sub : V[cu], key: `${theme}:c${cy}:${cu}` };
  }

  // ---------------- console and tests ----------------
  function bossZone(st) { const Z = ZONES[st] && ZONES[st].zones; return Z ? Math.max(0, Z.findIndex(z => z.boss)) : 0; }
  window.NGEND = {
    WORLDS, OTHERS, compose: (o) => { const r = compose(norm(o || {})); return { key: r.key, ids: r.beats.map(b => b.id), lines: r.beats.map(b => b.line).filter(Boolean), durs: r.beats.map(b => b.dur), c: r.c }; },
    all() { // every permutation: world x relics x curse x cycle
      const out = []; for (const world of WORLDS) { const [a, b] = OTHERS[world]; for (const relics of [[], [a], [b], [a, b]]) for (const curse of ['none', 'light', 'heavy']) for (const cycle of [1, 2, 3]) out.push({ world, relics, curse, cycle }); } return out; },
    vignette, VIGNETTE, readT,
    // play one permutation from wherever the game is (its world's boss room is loaded first if need be); the save is left as it was
    preview(o = {}) { const world = WORLDS.includes(o.world) ? o.world : 'moon', st = STAGE_OF[world];
      if (E) cleanup(); const go = () => start(world, () => { mode = 'win'; winCard(st); showOnly('winOv'); playMusic('title'); }, Object.assign({ cycle: Math.max(1, save.cycle | 0) }, o, { world, preview: true }));
      if (!stage || stageIdx !== st || mode === 'title') { play(st, bossZone(st)); setTimeout(go, 50); } else go();
      return this.compose(Object.assign({}, o, { world })).key; },
    get active() { return !!E; },
    state: () => E && { i: E.i, id: E.beats[E.i].id, kind: E.beats[E.i].kind, t: E.bt, dur: E.beats[E.i].dur, real: E.real, key: E.key, ids: E.beats.map(b => b.id), c: E.c, credY: E.credY },
    last: () => LAST, skip: (all) => skip(all), hold: (T) => { HOLD.at = T ?? null; }, seek: (i, T = 0) => { if (!E) return; while (E && E.i < i && !E.credEnd) next(); if (E) E.bt = T; },
  };
  // index.html?ngend=world,relic+relic,curse,cycle (e.g. ?ngend=lorraine,arm+pearl,heavy,3): play that one as the page opens
  try { const q = new URLSearchParams(location.search).get('ngend'); if (q) { const [world, rel, curse, cycle] = q.split(','); setTimeout(() => NGEND.preview({ world, relics: rel ? rel.split('+').filter(Boolean) : [], curse, cycle: +cycle || 1, forged: /forged/.test(q) }), 600); } } catch (e) {}
})();
