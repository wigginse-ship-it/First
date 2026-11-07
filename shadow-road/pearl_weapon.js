'use strict';
// ======================================================================================================
// THE PEARL REFORGED: the weapon the evolving Pearl becomes (pearl_ng.js has the Pearl, its choices and its shot)
// ------------------------------------------------------------------------------------------------------
// After its fifth choice, as the road's last world begins (whichever of the three roads from the Rim it is), the
// Pearl's parts fly together and it is reforged: a card names the weapon and lists its moves, and it goes into his
// hands and onto the weapon wheel (swap, the forge) beside the others, as WEAPONS.pearlw, kept for good in the save
// (save.pearlForge: the seed and the five choices; the weapon is rebuilt from them each time the game loads). A later
// cycle makes no new Pearl.
// THE GENERATOR, deterministic from the save's seed and the choices:
//   its kind     from the strongest Form tag: edge, a glaive or a sword-staff; orb, a flail or a chakram; shell, a
//                spear and shield; spire, a trident or a lance. A tie between two Forms makes a hybrid: the second
//                Form's piece is set on it too (a spur blade, a pearl on a chain, a shell guard, a butt spike).
//   its moves    a whole moveset built on the closest of his weapons (glaive: the great sword; sword-staff, trident,
//                lance: the bowstaff; flail: the hammer; chakram, spear and shield: the rapier), so every pose and
//                animation is that weapon's own: the light combo shaped by the Form, the heavies by the Temper, the
//                charged heavy (hold Heavy, the perfect window as ever) by the Current, the jump attack, and
//                Light + Heavy, the Pearl's shot, as its signature. Its blows carry the Current's tricks.
//   its look     drawn from the parameters: head or blade length and curve, tines, head mass, the Current's palette,
//                one ornament for each trait, a glow and motes by the Temper. Painted once into a picture and kept.
//   its name     from the choices, e.g. "The Weeping Glaive of the Undertow".
//   its level    it comes at the level of the best of his other weapons, and is levelled in the forge like them.
// Console: PEARLW.dev.roll() makes a random one (dev games), PEARLW.spec() is the one in hand.
// ======================================================================================================
(() => {
  const PN = window.PEARLNG; if (!PN || typeof WEAPONS === 'undefined') { console.error('pearl_weapon.js: pearl_ng.js missing'); return; }
  const ID = 'pearlw', TR = PN.TR, PAL = PN.PAL, ART = PN.art;
  const TYPES = {
    glaive:      { base: 'sword',  noun: 'Glaive',          short: 'glaive',  form: 'edge',  death: 'slice' },
    swordstaff:  { base: 'staff',  noun: 'Sword-Staff',     short: 'staff',   form: 'edge',  death: 'slice' },
    flail:       { base: 'hammer', noun: 'Flail',           short: 'flail',   form: 'orb',   death: 'crumple' },
    chakram:     { base: 'rapier', noun: 'Chakram',         short: 'chakram', form: 'orb',   death: 'slice' },
    shieldspear: { base: 'rapier', noun: 'Spear and Shield', short: 'spear',  form: 'shell', death: 'pop' },
    warshield:   { base: 'hammer', noun: 'Warshield',       short: 'shield',  form: 'shell', death: 'crumple' },
    trident:     { base: 'staff',  noun: 'Trident',         short: 'trident', form: 'spire', death: 'pop' },
    lance:       { base: 'staff',  noun: 'Lance',           short: 'lance',   form: 'spire', death: 'pop' },
  };
  const BY_FORM = { edge: ['glaive', 'swordstaff'], orb: ['flail', 'chakram'], shell: ['shieldspear', 'warshield'], spire: ['trident', 'lance'] };
  const HYB_WORD = { edge: 'Blade', orb: 'Moon', shell: 'Shell', spire: 'Spire' };
  const PLACES = { tide: ['the Undertow', 'the Long Ebb', 'the Breakers', 'Faiella-bionin'], nacre: ['the Nacre Halls', 'the Oyster Throne', 'Moire\'s Court', 'the Pearl Beds'],
    storm: ['the Squall', 'the Thunder Reef', 'the Jewel\'s Weather', 'the Drowned Storm'], abyss: ['the Abyss', 'the Drowned Stair', 'the Deep Below Rebma', 'the Black Water'],
    pearl: ['Rebma', 'the Glass King', 'the Sea-Pattern', 'the Mirror Sea'] };
  const CURNAME = { tide: 'the Tide', nacre: 'Nacre', storm: 'the Storm', abyss: 'the Abyss' };
  const one = (r, a) => a[Math.floor(r() * a.length)];

  // ======================================================================================================
  // THE DESIGN: what the choices make
  // ======================================================================================================
  function design(seed, picks) {
    picks = (picks || []).filter(id => TR[id]);
    const r = mulberry(((seed | 0) ^ 0x2F6B3A9D) >>> 0), pr = PN.prof(picks), sc = pr.sc;
    const top = pr.form[0] || one(r, ['edge', 'orb', 'shell', 'spire']);
    const hyb = pr.form[1] && sc[pr.form[1]] === sc[top] ? pr.form[1] : null;
    const type = one(r, BY_FORM[top]), T = TYPES[type];
    const cur = pr.current[0] || null, cur2 = pr.current[1] || null, tmp = pr.temper[0] || null;
    const len = clamp(1 + .1 * (sc.spire || 0) + (r() - .5) * .22, .85, 1.35);
    const curve = clamp(.16 + .12 * (sc.edge || 0) + r() * .16, .1, .62);
    const mass = clamp(1 + .12 * (sc.orb || 0) + .16 * (sc.heavy || 0) + (r() - .5) * .16, .85, 1.5);
    const tines = type === 'trident' ? (pr.has.has('tines') ? 5 : 3) : 1;
    const spikes = 5 + Math.floor(r() * 3) + (sc.heavy || 0);
    // the name: a word from the Temper (or from any choice), the kind, and a place of the sea from the Current
    const tmpT = picks.map(id => TR[id]).filter(t => t.ax === 'temper'), from = tmpT.length && r() < .55 ? tmpT[0] : TR[one(r, picks.length ? picks : ['still'])];
    let adj = one(r, from.adj); const noun = (hyb ? HYB_WORD[hyb] + '-' : '') + T.noun;
    if (noun.toLowerCase().includes(adj.toLowerCase().slice(0, 4))) adj = from.adj[0] === adj ? from.adj[1] : from.adj[0];
    const place = one(r, PLACES[cur || 'pearl']);
    const name = `The ${adj} ${noun} of ${place}`;
    const pal = PAL[cur || 'pearl'], pal2 = cur2 ? PAL[cur2] : null;
    const tag = `${T.noun}${hyb ? ' and ' + HYB_WORD[hyb].toLowerCase() : ''}${cur ? ' of ' + CURNAME[cur] : ''}${tmp ? ', ' + PN.TAGNAME[tmp].toLowerCase() : ''}`;
    return { seed: seed | 0, picks: picks.slice(), type, base: T.base, form: top, hyb, cur, cur2, tmp, len, curve, mass, tines, spikes, name, noun, adj, place, pal, pal2, tag,
      sc: Object.assign({}, sc), has: new Set(picks), parts: picks.map(id => TR[id].part), key: (seed | 0) + ':' + picks.join(',') };
  }

  // ======================================================================================================
  // THE MOVES: the closest weapon's own moveset, reshaped by the choices
  // ======================================================================================================
  const LIGHT = ['L', 'LL', 'LLL', 'LLLL', 'M', 'A', 'AA', 'AAA', 'D', 'DA', 'R', 'X'];
  const HEAVY = ['H', 'HH', 'HHH', 'HHHH', 'LH', 'HL', 'LLH', 'DX', 'DH', 'RH', 'RHH', 'AH'];
  const FIN = { edge: 'Crescent Reaping', orb: 'Moonfall Round', shell: 'Coral Answer', spire: 'Narwhal Run' };
  const HNAME = { quick: 'Quickwater Cut', heavy: 'Fathom Drop', wild: 'Moonstruck Swing', patient: 'Still-Water Stroke' };
  const HCNAME = { tide: 'Undertow Crash', nacre: 'Nacre Bloom', storm: 'Thunderclap', abyss: 'The Abyssal Maw' };
  const HCDESC = { tide: 'it lands in a whirlpool and runs a breaking wave down the street', nacre: 'it bursts in a spray of nacre shards at every foe near', storm: 'bolts come down out of the sky on the foes round you', abyss: 'the Abyss drags every foe near into the blow first' };
  const JNAME = { edge: 'Falling Crescent', orb: 'Moon Drop', shell: 'Shell Comet', spire: 'Diving Narwhal' };
  const WORDS = /\b(Great Sword|great sword|Bowstaff|bowstaff|Hammer|hammer|Sword|sword|Staff|staff|Rapier|rapier|Pole|pole|blade|Blade)\b/g;
  function reword(s, spec) { if (!s) return s; const n = TYPES[spec.type].short; return s.replace(WORDS, (w) => (w[0] === w[0].toUpperCase() ? n[0].toUpperCase() + n.slice(1) : n)); }
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function buildTree(spec) {
    if (window.PEARLM) return PEARLM.build(spec); // (each kind's own moveset: pearl_moves.js)
    const B = WEAPONS[spec.base], t = clone(B.tree), sc = spec.sc, has = spec.has;
    delete t.HC1; delete t.HC2; delete t.J7;
    if (spec.base === 'sword') { t.H = Object.assign(clone(B.charged[0]), { name: 'Overhead' }); } // (the great sword's heavy is its charge: a plain heavy for this one)
    const reachK = clamp(.94 + .1 * (spec.len - 1) + .04 * (sc.spire || 0) + (has.has('tether') ? .06 : 0), .9, 1.2);
    for (const k in t) { const m = t[k]; if (m.x1) m.x1 = Math.round(m.x1 * reachK); }
    for (const k of LIGHT) { const m = t[k]; if (!m) continue;
      if (sc.edge) { m.dmg *= 1 + .05 * sc.edge; m.dur *= 1 - .03 * sc.edge; }
      if (sc.orb) { m.kb = (m.kb || 0) * (1 + .15 * sc.orb); if (m.launch) m.launch *= 1.06; }
      if (sc.shell) m.dmg *= 1 + .03 * sc.shell;
      if (sc.spire) { m.x1 += 7 * sc.spire; m.depth = (m.depth || 18) + 3 * sc.spire; }
      m.pe = .3; }
    for (const k of HEAVY) { const m = t[k]; if (!m) continue;
      if (spec.tmp === 'quick' || has.has('quickwater')) { m.dur *= .9; m.dmg *= .95; }
      if (spec.tmp === 'heavy' || has.has('deep')) { m.dmg *= 1.15; m.kb = (m.kb || 0) * 1.15; if (k === 'H' || k === 'HH') m.power = 2; if (k === 'HHH' && !m.shock) m.shock = 70; }
      m.pe = spec.tmp === 'wild' ? .75 : .55; }
    if (spec.tmp === 'quick' || has.has('quickwater')) for (const k of LIGHT) if (t[k]) t[k].dur *= .94;
    // the charged heavy: the weapon's own held heavy (the great sword's charged blow for the glaive), the Current's
    const hc = Object.assign(clone(B.tree.HC || B.charged[2]), { key: 'HC' }); delete hc.lvl; delete hc.how;
    if (hc.x1) hc.x1 = Math.round(hc.x1 * reachK);
    hc.name = spec.cur ? HCNAME[spec.cur] : 'Judgement of the Sea';
    hc.desc = `Hold Heavy, then let go (in the gleam for a perfect): ${spec.cur ? HCDESC[spec.cur] : 'the sea answers the blow in a ring of light'}.`;
    hc.peRel = spec.cur || 'pearl'; hc.peRelAt = spec.cur === 'abyss' ? .06 : Math.max(.05, hc.h[0]); hc.pe = 1;
    if (spec.tmp === 'patient' || has.has('still')) hc.dmg *= 1.2;
    t.HC = hc;
    // the shell answers: a parry and riposte, as the rapier's
    if (sc.shell && !t.RIP) t.RIP = Object.assign(clone(WEAPONS.rapier.tree.RIP), { x1: Math.round(92 * reachK) });
    // names in the weapon's own voice
    for (const k in t) { const m = t[k]; m.key = k; if (m.name) m.name = reword(m.name, spec); if (m.desc) m.desc = reword(m.desc, spec); if (m.how) m.how = reword(m.how, spec); m.dmg = Math.max(1, Math.round(m.dmg)); m.dur = Math.max(.16, m.dur); if (m.fin && m.fin.dmg) m.fin.dmg = Math.max(1, Math.round(m.fin.dmg)); }
    const finK = t.LLLL ? 'LLLL' : 'LLL'; t[finK].name = FIN[spec.form]; t[finK].pe = .7;
    t.H.name = spec.tmp ? HNAME[spec.tmp] : 'Pearl Heavy';
    if (t.JH) { t.JH.name = JNAME[spec.form]; t.JH.pe = .7; }
    const S = PN.stats(spec.picks, true);
    t.SIG = { name: S.name, key: 'SIG', seq: ['A', '+H'], dur: .3, h: [.3, .6], x0: 0, x1: 40, dmg: 1, kb: 40, arc: [.3, -.3],
      desc: `Light and Heavy together: a pearl thrown from its head out and back like a boomerang, striking all it passes on both legs${{ pearl: '', disc: ', spinning like a cutting disc', orb: ', heavy, hopping on to the next foe', burst: ', bursting at the far end to turn every shot', lance: ', straight as a lance' }[S.kind]}${S.charge ? '; gathered while both are held (let go in the gleam)' : ''}.` };
    return { tree: t, reachK, sig: S };
  }

  // ======================================================================================================
  // THE LOOK. Painted in hand space (the hand at 17,0; forward along +x), with the game's ink and its shading
  // ======================================================================================================
  const det = () => !FLASH && !TINT;
  // a painted shape: its colour, a shadow side below, a lit side above, an ink line (path(ox, oy, cont) adds itself to the path)
  function cel(path, col, o = {}) {
    path(0, 0); ctx.fillStyle = C(col); ctx.fill();
    if (det()) {
      ctx.save(); path(0, 0); ctx.clip();
      const d = o.d ?? 1.4, r = o.r ?? .9;
      if (d) { ctx.beginPath(); ctx.rect(-500, -500, 1000, 1000); path(0, -d, true); ctx.fillStyle = o.dark || shade(col, -.32); ctx.fill('evenodd'); }
      if (r) { ctx.beginPath(); ctx.rect(-500, -500, 1000, 1000); path(0, r, true); ctx.fillStyle = o.lite || shade(col, .34); ctx.fill('evenodd'); }
      if (o.tex) o.tex();
      ctx.restore();
    }
    if (o.w !== 0) { path(0, 0); outline(o.w ?? 1.2); }
    ctx.beginPath();
  }
  const PL = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  const PF = (fn) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); fn(ox, oy); ctx.closePath(); };
  const PE = (x, y, rx, ry, rot = 0) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox + Math.cos(rot) * rx, y + oy + Math.sin(rot) * rx); ctx.ellipse(x + ox, y + oy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  const RR = (x, y, w, h, rr) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); x += ox; y += oy; ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); x -= ox; y -= oy; };
  // a rod of metal: an ink stroke, the colour, a lit line along its top
  function rod(fn, w, col, lite) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); fn(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = w + 2.2 * OUTK; ctx.stroke();
    ctx.beginPath(); fn(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
    if (det()) { ctx.save(); ctx.translate(0, -w * .22); ctx.beginPath(); fn(); ctx.strokeStyle = lite || shade(col, .38); ctx.lineWidth = Math.max(.35, w * .3); ctx.stroke(); ctx.restore(); }
  }
  const qpt = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  // the haft: a long tapering rod, wrapped at the grip, banded in the trim
  function haft(x0, x1, w, p, wrapAt) {
    cel(RR(x0, -w / 2, x1 - x0, w, w / 2), p.haft, { d: w * .32, r: w * .22, w: 1.1 });
    if (det()) { ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = .4; for (const y of [-w * .15, w * .2]) { ctx.beginPath(); ctx.moveTo(x0 + 3, y); ctx.lineTo(x1 - 3, y * .8); ctx.stroke(); } }
    if (wrapAt) { const [a, b] = wrapAt; ctx.fillStyle = C(shade(p.haft, -.25)); ctx.fillRect(a, -w / 2 - .3, b - a, w + .6);
      if (det()) { ctx.strokeStyle = C(shade(p.metal, -.2)); ctx.lineWidth = .55; ctx.beginPath(); for (let x = a + .6; x < b; x += 1.7) { ctx.moveTo(x, -w / 2); ctx.lineTo(x + 1.1, w / 2); } ctx.stroke(); } }
  }
  const band = (x, w, h, p) => cel(RR(x - w / 2, -h / 2, w, h, Math.min(w, h) * .3), p.metal, { d: h * .18, r: h * .14, lite: p.metalLt, w: .9 });
  function pommel(x, r, p, cap) { cel(PE(x, 0, r * (cap ? .8 : 1), r), p.metal, { d: r * .4, r: r * .3, lite: p.metalLt, w: 1 }); if (det()) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - r * .25, -r * .35, r * .22, 0, TAU); ctx.fill(); } }
  // a pearl set in it: the Pearl of Judgement's own sphere (W7.pearlCore, through pearl_ng.js), at this size; a dry run
  // with SPOTS set gathers where each one lies, in weapon space, for its light behind (backlight, below)
  let SPOTS = null;
  const pearl = (x, y, r, p) => {
    if (SPOTS) { const m = ctx.getTransform(), q = m.transformPoint({ x, y }); SPOTS.push([q.x, q.y, r * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c))]); }
    ART.pearlBody(x, y, r, 1.3, 2, p);
  };
  // a curved single-edged blade from x0 (its edge on top, -y), bending up by curve; returns its tip
  function curvedBlade(x0, L, W, curve, p, o = {}) {
    const tip = [x0 + L, -curve * L * .55 - W * .2], sp0 = [x0, W * .42], spC = [x0 + L * .55, W * .5 - curve * L * .12], ed0 = [x0, -W * .62], edC = [x0 + L * .5, -W * 1.08 - curve * L * .42];
    const path = PF((ox, oy) => { ctx.moveTo(sp0[0] + ox, sp0[1] + oy); ctx.quadraticCurveTo(spC[0] + ox, spC[1] + oy, tip[0] + ox, tip[1] + oy); ctx.quadraticCurveTo(edC[0] + ox, edC[1] + oy, ed0[0] + ox, ed0[1] + oy); });
    cel(path, p.blade, { d: W * .36, r: W * .16, dark: p.bladeDk, lite: p.edge, w: 1.3, tex: () => {
      if (o.thunder) { ctx.beginPath(); for (let i = 0; i <= 7; i++) { const q = qpt([x0 + 2, -W * .05], [x0 + L * .5, -curve * L * .3], tip, i / 8); ctx.lineTo(q[0], q[1] + (i % 2 ? -1.1 : 1.1)); } ctx.strokeStyle = '#FFF2A0'; ctx.lineWidth = .9; ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x0 + 2, W * .02); ctx.quadraticCurveTo(x0 + L * .5, -curve * L * .26, tip[0] - L * .12, tip[1] + W * .2); ctx.strokeStyle = C(shade(p.bladeDk, -.1)); ctx.globalAlpha = .55; ctx.lineWidth = .8; ctx.stroke(); ctx.globalAlpha = 1; } } });
    if (det()) { ctx.beginPath(); ctx.moveTo(ed0[0] + 1.2, ed0[1] + .6); ctx.quadraticCurveTo(edC[0], edC[1] + .9, tip[0] - .8, tip[1] + .2); ctx.strokeStyle = C(p.edge); ctx.lineWidth = .8; ctx.stroke(); }
    if (o.serrate) { ctx.fillStyle = C(p.metalLt); for (let i = 1; i < 7; i++) { const q = qpt(ed0, edC, tip, i / 7.4), q2 = qpt(ed0, edC, tip, i / 7.4 + .05), nx = q2[1] - q[1], ny = -(q2[0] - q[0]), nd = Math.hypot(nx, ny) || 1;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + (q2[0] - q[0]) * .5 + nx / nd * 2.1, q[1] + (q2[1] - q[1]) * .5 + ny / nd * 2.1); ctx.lineTo(q2[0], q2[1]); ctx.closePath(); ctx.fill(); outline(.6); } }
    return tip;
  }
  function leaf(x0, L, W, p, o = {}) { // a spear's leaf-shaped point, a rib down its middle
    const path = PF((ox, oy) => { ctx.moveTo(x0 + ox, -W * .38 + oy); ctx.quadraticCurveTo(x0 + L * .32 + ox, -W + oy, x0 + L + ox, oy); ctx.quadraticCurveTo(x0 + L * .32 + ox, W + oy, x0 + ox, W * .38 + oy); });
    cel(path, p.blade, { d: W * .5, r: W * .3, dark: p.bladeDk, lite: p.edge, w: 1.2 });
    if (det()) { ctx.beginPath(); ctx.moveTo(x0 + 1, 0); ctx.lineTo(x0 + L - 2, 0); ctx.strokeStyle = C(o.thunder ? '#FFF2A0' : shade(p.bladeDk, -.15)); ctx.lineWidth = .8; ctx.stroke(); }
    if (o.spiral) { ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = .5; for (let i = 1; i < 6; i++) { const x = x0 + L * i / 6.5, hw = W * (1 - i / 6.5) * .8; ctx.beginPath(); ctx.moveTo(x - hw * .4, -hw); ctx.lineTo(x + hw * .4, hw); ctx.stroke(); } }
    return [x0 + L, 0];
  }
  function barb(x, y, dx, s, p) { cel(PL([x, y - s * .55, x + dx * s * 1.3, y, x, y + s * .55]), p.metalLt, { d: s * .3, r: s * .2, w: .8 }); }
  function scallopShield(x, rx, ry, p) {
    const path = (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox, ry * 1.04 + oy); const n = 14; for (let i = 0; i <= n; i++) { const a = Math.PI * .62 + i / n * Math.PI * 1.76, rr = i % 2 ? .96 : 1.06; ctx.lineTo(x + ox + Math.cos(a) * rx * rr, oy + Math.sin(a) * ry * rr); } ctx.closePath(); };
    cel(path, p.blade, { d: rx * .5, r: rx * .3, dark: p.bladeDk, lite: '#FFFFFF', w: 1.3, tex: () => { ctx.strokeStyle = C(shade(p.bladeDk, -.2)); ctx.globalAlpha = .5; ctx.lineWidth = .6;
      for (let i = 0; i < 7; i++) { const a = Math.PI * .75 + i / 6 * Math.PI * 1.5; ctx.beginPath(); ctx.moveTo(x, ry * .72); ctx.lineTo(x + Math.cos(a) * rx * 1.1, Math.sin(a) * ry * 1.1); ctx.stroke(); } ctx.globalAlpha = 1; } });
    path(0, 0); ctx.strokeStyle = C(p.metal); ctx.lineWidth = 1.1; ctx.stroke();
    pearl(x, ry * .55, Math.min(rx, ry) * .4, p);
  }
  function chainLinks(x0, x1, y0, y1, p, n) { for (let i = 0; i < n; i++) { const q = (i + .5) / n, x = lerp(x0, x1, q), y = lerp(y0, y1, q), a = Math.atan2(y1 - y0, x1 - x0); ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0, 0, (x1 - x0) / n * .62, i % 2 ? .9 : 2.1, 0, 0, TAU); ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 2.4 * OUTK + .8; ctx.stroke(); ctx.strokeStyle = C(p.metal); ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore(); } }
  function spikedBall(cx, R, n, p, kind) {
    for (let i = 0; i < n; i++) { const a = i / n * TAU + .3, b = .32, x0a = cx + Math.cos(a - b) * R * .92, y0a = Math.sin(a - b) * R * .92, x0b = cx + Math.cos(a + b) * R * .92, y0b = Math.sin(a + b) * R * .92, tx = cx + Math.cos(a) * R * 1.52, ty = Math.sin(a) * R * 1.52;
      cel(PL([x0a, y0a, tx, ty, x0b, y0b]), kind === 'nacre' ? p.accent : p.metal, { d: 1, r: .7, lite: kind === 'nacre' ? '#FFFFFF' : p.metalLt, w: .9 }); }
    pearl(cx, 0, R, p);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, 0, R, 0, TAU); ctx.clip(); ctx.strokeStyle = C(p.metal); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(cx, 0, R * .35, R * 1.02, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function tineSet(x0, L, n, p, o) { // the trident's head: a collar and n tines, barbed
    const ys = n === 5 ? [-11, -5.5, 0, 5.5, 11] : [-6.5, 0, 6.5];
    for (const y of ys) { const c = y === 0, l = c ? L : L * (Math.abs(y) > 8 ? .66 : .84), ex = x0 + l;
      rod(() => { ctx.moveTo(x0, y * .25); ctx.quadraticCurveTo(x0 + l * .28, y * 1.08, ex, y); }, c ? 2.6 : 2.1, p.metal, p.metalLt);
      barb(ex, y, 1, c ? 3.4 : 2.7, p); if (det() && !c) { ctx.fillStyle = C(p.metalLt); ctx.beginPath(); ctx.moveTo(ex - 3, y); ctx.lineTo(ex - 5, y + Math.sign(y) * 2.4); ctx.lineTo(ex - 6.2, y); ctx.fill(); } }
    band(x0 - 1, 5, 7, p); if (o.thunder) { ctx.strokeStyle = '#FFF2A0'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x0 + 3, -.5); ctx.lineTo(x0 + L * .4, .8); ctx.lineTo(x0 + L * .6, -.8); ctx.lineTo(x0 + L * .85, .5); ctx.stroke(); }
  }
  // one ornament for each trait, set on the slot it suits
  const ORN = {
    crescent: ['collar', (x, y, p) => { ctx.save(); ctx.translate(x, y - 6.5); ctx.rotate(-.5); cel(PF((ox, oy) => { ctx.arc(ox, oy, 4.6, Math.PI * .1, Math.PI * 1.15); ctx.arc(ox + 1.6, oy - .8, 3.9, Math.PI * 1.15, Math.PI * .1, true); }), p.blade, { d: .8, r: .6, dark: p.bladeDk, lite: '#FFFFFF', w: .9 }); ctx.restore(); }],
    serrate: ['flag'],
    ring: ['collar', (x, y, p) => { ctx.beginPath(); ctx.ellipse(x, y, 2.2, 6.4, 0, 0, TAU); ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = C(p.metal); ctx.lineWidth = 1.3; ctx.stroke(); pearl(x + .4, y, 3, p); }],
    chain: ['haft', (x, y, p, w) => { for (let i = 0; i < 4; i++) { const xx = x - 6 + i * 3.6; ctx.beginPath(); ctx.moveTo(xx, -w / 2 - .4); ctx.lineTo(xx + 2.4, w / 2 + .4); ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = C(p.metalLt); ctx.lineWidth = .9; ctx.stroke(); } }],
    coral: ['collar', (x, y) => { ctx.save(); ctx.translate(x - 1, y + 2); const br = (a, b, c, d, w) => rod(() => { ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2 - 1.5, (b + d) / 2, c, d); }, w, '#D9573F', '#FF9C86');
      br(0, 0, -6, 7, 1.7); br(-3, 3.6, -8.5, 4, 1.1); br(-4.4, 5.6, -4, 10, 1); br(1, 0, 3, 7.5, 1.2); ctx.restore(); }],
    scallop: ['collar', (x, y, p) => { ctx.save(); ctx.translate(x - 1, y); ctx.scale(.5, 1); const R = 7; const path = (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(ox, R + oy); for (let i = 0; i <= 10; i++) { const a = Math.PI * .62 + i / 10 * Math.PI * 1.76, rr = i % 2 ? .95 : 1.06; ctx.lineTo(ox + Math.cos(a) * R * rr, oy + Math.sin(a) * R * rr); } ctx.closePath(); };
      cel(path, p.blade, { d: 2, r: 1.2, dark: p.bladeDk, lite: '#FFFFFF', w: 1.6 }); ctx.restore(); }],
    horn: ['pommel', (x, y) => { cel(PF((ox, oy) => { ctx.moveTo(x + ox, -2.4 + oy); ctx.lineTo(x - 12 + ox, oy); ctx.lineTo(x + ox, 2.4 + oy); }), '#EFE4C8', { d: 1, r: .7, lite: '#FFFFF4', w: .9, tex: () => { ctx.strokeStyle = 'rgba(110,90,60,.6)'; ctx.lineWidth = .45; for (let i = 1; i < 5; i++) { const xx = x - i * 2.4; ctx.beginPath(); ctx.moveTo(xx + .6, -2.4); ctx.lineTo(xx - .6, 2.4); ctx.stroke(); } } }); }],
    tines: ['flag'],
    swirl: ['haft', (x, y, p, w) => { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU * 1.3, rr = .6 + i * .2; ctx.lineTo(x + Math.cos(a) * rr, Math.sin(a) * rr * .9); } ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 1.8; ctx.stroke(); ctx.strokeStyle = C(p.accent); ctx.lineWidth = .8; ctx.stroke(); }],
    foam: ['collar', (x, y) => { cel(PF((ox, oy) => { ctx.moveTo(x - 7 + ox, -2 + oy); ctx.quadraticCurveTo(x - 3 + ox, -10 + oy, x + 3 + ox, -8 + oy); ctx.quadraticCurveTo(x + ox, -6.5 + oy, x + 1 + ox, -4 + oy); ctx.quadraticCurveTo(x - 2 + ox, -3 + oy, x - 2 + ox, -1.5 + oy); }), '#F4FFFC', { d: .8, r: 0, dark: '#A8DCD6', w: .9 }); }],
    shards: ['collar', (x, y, p) => { for (const [dx, l] of [[-2.5, 7], [1.5, 9]]) { ctx.strokeStyle = C(p.metal); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x + dx, 2); ctx.lineTo(x + dx, l - 1); ctx.stroke(); cel(PL([x + dx, l - 2, x + dx + 1.5, l + 1.4, x + dx, l + 4.4, x + dx - 1.5, l + 1.4]), p.accent, { d: .6, r: .5, lite: '#FFFFFF', w: .7 }); } }],
    drops: ['collar', (x, y, p) => { ctx.strokeStyle = C(p.metal); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x - .5, 2.5); ctx.lineTo(x - .5, 6); ctx.stroke(); cel(PF((ox, oy) => { ctx.moveTo(x - .5 + ox, 6 + oy); ctx.quadraticCurveTo(x + 2.6 + ox, 10 + oy, x - .5 + ox, 11.4 + oy); ctx.quadraticCurveTo(x - 3.6 + ox, 10 + oy, x - .5 + ox, 6 + oy); }), '#E0506A', { d: .9, r: .6, lite: '#FFC0CE', w: .8 }); }],
    static: ['haft', (x, y, p, w) => { ctx.beginPath(); ctx.moveTo(x - 6, 0); for (let i = 1; i <= 6; i++) ctx.lineTo(x - 6 + i * 2, (i % 2 ? -1 : 1) * w * .32); ctx.strokeStyle = C('#FFF2A0'); ctx.lineWidth = .9; ctx.stroke(); }],
    cloud: ['haft', (x, y, p, w) => { cel(PE(x, 0, 2.8, 2.2), '#3A4282', { d: .8, r: .6, w: .9 }); if (det()) { ctx.fillStyle = '#FFF2A0'; ctx.beginPath(); ctx.ellipse(x, 0, 1.5, .9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1E1838'; ctx.beginPath(); ctx.arc(x, 0, .5, 0, TAU); ctx.fill(); } }],
    halo: ['haft', (x, y, p, w) => { ctx.fillStyle = C('#14102A'); ctx.fillRect(x - 2, -w / 2 - .5, 4, w + 1); ctx.beginPath(); ctx.rect(x - 2, -w / 2 - .5, 4, w + 1); outline(.7); if (det()) { ctx.fillStyle = '#6FE0C0'; ctx.fillRect(x - .3, -w / 2 - .5, .6, w + 1); } }],
    core: ['pommel', (x) => { pearl(x, 0, 3.4, PAL.abyss); }],
    // (sw: the streamers' link angles, drawHangers below; each point turned about the root, the further ones more)
    ribbons: ['pommel', (x, y, p, sw) => { for (const [dy, k] of [[-1, 1], [1, -.7]]) { const pt = (px, py, i) => { if (!sw) return [px, py]; const a = sw[i] * .7 + sw.fl * .18 * Math.sin(sw.t * 12 - i * 1.4 + k * 3), c = Math.cos(a), s = Math.sin(a), ex = px - x, ey = py - dy; return [x + ex * c - ey * s, dy + ex * s + ey * c]; };
      const A = pt(x - 5, dy + 6 * k, 0), B = pt(x - 9, dy - 4 * k, 1), E = pt(x - 15, dy + 5 * k, 2); rod(() => { ctx.moveTo(x, dy); ctx.bezierCurveTo(A[0], A[1], B[0], B[1], E[0], E[1]); }, 1.5, p.accent); } }],
    fin: ['head', (x, y, p) => { cel(PF((ox, oy) => { ctx.moveTo(x - 4 + ox, 3 + oy); ctx.quadraticCurveTo(x - 4 + ox, 9 + oy, x - 11 + ox, 10.5 + oy); ctx.quadraticCurveTo(x - 4 + ox, 7 + oy, x + 3 + ox, 3 + oy); }), p.bladeDk, { d: .8, r: .6, lite: p.blade, w: .9 }); }],
    cage: ['collar', (x, y, p) => { band(x, 4.2, 8.4, p); band(x - 4.6, 2.2, 6.4, p); }],
    anchor: ['pommel', (x, y, p) => { rod(() => { ctx.moveTo(x, 0); ctx.lineTo(x - 7, 0); ctx.moveTo(x - 4, -3.4); ctx.lineTo(x - 4, 3.4); ctx.moveTo(x - 9, -4.6); ctx.quadraticCurveTo(x - 4.4, 0, x - 9, 4.6); }, 1.3, p.metal, p.metalLt); }],
    charm: ['pommel', (x, y, p) => { ctx.strokeStyle = C(p.metal); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x + 1, 1.5); ctx.lineTo(x + 1, 6); ctx.stroke(); cel(PF((ox, oy) => { ctx.arc(x + 1 + ox, 8.6 + oy, 2.8, 0, TAU); ctx.arc(x + 2.4 + ox, 8 + oy, 2.3, TAU, 0, true); }), p.metalLt, { d: .5, r: .4, w: .7 }); }],
    wave: ['collar', (x, y, p) => { cel(PF((ox, oy) => { ctx.moveTo(x - 8 + ox, 2 + oy); ctx.quadraticCurveTo(x - 4 + ox, 7.5 + oy, x + 2 + ox, 6 + oy); ctx.quadraticCurveTo(x + 4.5 + ox, 4.2 + oy, x + 2 + ox, 2.6 + oy); ctx.quadraticCurveTo(x + 1 + ox, 4.4 + oy, x - 1 + ox, 3.4 + oy); }), p.b[2], { d: .9, r: .6, lite: '#FFFFFF', w: .9 }); }],
    stillring: ['head', (x, y, p) => { ctx.beginPath(); ctx.ellipse(x, y, 3, 10, 0, 0, TAU); ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 1.9; ctx.stroke(); ctx.strokeStyle = C('#FFF2C8'); ctx.lineWidth = .8; ctx.stroke(); }],
    dial: ['haft', (x, y, p) => { cel(PE(x, 0, 3.6, 3.6), p.metal, { d: .9, r: .7, lite: p.metalLt, w: .9 }); if (det()) { ctx.strokeStyle = shade(p.metal, -.4); ctx.lineWidth = .4; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 2.2, Math.sin(a) * 2.2); ctx.lineTo(x + Math.cos(a) * 3.2, Math.sin(a) * 3.2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 1.6, -1.6); ctx.stroke(); } }],
    thunder: ['flag'],
    maelstrom: ['collar', (x, y, p) => { cel(PE(x, 0, 2.4, 6.6), p.b[3], { d: 1, r: .8, w: .9, tex: () => { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU * 1.6, rr = .3 + i * .16; ctx.lineTo(x + Math.cos(a) * rr * .4, Math.sin(a) * rr); } ctx.stroke(); } }); }],
    corallance: ['head', (x, y) => { ctx.save(); ctx.translate(x, y); const br = (a, b, c, d, w) => rod(() => { ctx.moveTo(a, b); ctx.lineTo(c, d); }, w, '#D9573F', '#FF9C86'); br(-6, -2, 0, -7.5, 1.2); br(-3, -5, -.5, -9, .9); br(-6, 2, 1, 7, 1.1); ctx.restore(); }],
    bolt: ['pommel', (x, y) => { cel(PL([x + 1, 2, x + 3.4, 2, x + 2, 5.4, x + 4, 5.4, x, 10.5, x + 1, 6.6, x - 1, 6.6]), '#FFF2A0', { d: .5, r: 0, w: .7 }); }],
  };
  // each kind's own shape; returns the slots its ornaments sit on
  function paintBody(spec) {
    const p = spec.pal, q = spec.pal2 || spec.pal, f = spec.has, L = spec.len, M = spec.mass, thunder = f.has('thunder'), serr = f.has('serrate'), spiral = f.has('narwhal');
    const hybPiece = (x, back) => { // the second Form of a hybrid, at the butt end
      if (!spec.hyb) return;
      if (spec.hyb === 'edge') { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, back ? -1 : 1); curvedBlade(0, 15, 5, .35, q, { serrate: serr }); ctx.restore(); }
      else if (spec.hyb === 'orb') { const fn = () => { chainLinks(x - 9, x, 4, 0, p, 3); pearl(x - 13, 5.5, 4.4, q); };
        if (HLIST) HLIST.push({ tx: 0, ty: 0, rot: 0, piv: [x, 0], rest: -1.17, fn }); else fn(); }
      else if (spec.hyb === 'shell') scallopShield(x - 4, 3.4, 8.5, q);
      else { cel(PL([x, -2.2, x - 16, 0, x, 2.2]), q.blade, { d: 1, r: .6, dark: q.bladeDk, lite: q.edge, w: 1 }); }
    };
    let S = null;
    if (spec.type === 'glaive') {
      const bl = 38 * L, w = 6.4 * Math.sqrt(M);
      hybPiece(-6); haft(-6, 54, 3.6, p, [8, 22]); pommel(-6, 2.9, p);
      cel(PL([53, 2.4, 57, 7.5, 55.5, 2.4]), p.metal, { d: .6, r: .4, lite: p.metalLt, w: .9 });
      const tip = curvedBlade(52, bl, w, spec.curve, p, { thunder, serrate: serr });
      band(51, 4.4, 8, p);
      S = { pommel: [-8, 0], haft: [30, 38, 44, 2], collar: [47, 0], head: [52 + bl * .45, -spec.curve * bl * .25], w: 3.6, tip, x0: -24, x1: tip[0] + 6, y0: -spec.curve * bl * .6 - w * 1.4 - 12, y1: 16 };
    } else if (spec.type === 'swordstaff') {
      const bl = 25 * L, w = 6.6 * Math.sqrt(M);
      haft(-26, 56, 3.4, p, [10, 24]);
      const tip = curvedBlade(55, bl, w, spec.curve, p, { thunder, serrate: serr });
      ctx.save(); ctx.translate(-25, 0); ctx.scale(-1, -1); curvedBlade(0, bl * .8, w * .9, spec.curve, p, { thunder, serrate: serr }); ctx.restore();
      band(55, 4.2, 7.4, p); band(-25, 4.2, 7.4, p);
      if (spec.hyb) { if (spec.hyb === 'orb') pearl(-25 - bl * .8 - 3, 0, 4, q); else if (spec.hyb === 'shell') scallopShield(38, 3, 7.5, q); else hybPiece(-25 - bl * .75); }
      S = { pommel: [-25 - bl * .8 - 2, 0], haft: [34, 42, -12, 0], collar: [50, 0], head: [55 + bl * .45, -spec.curve * bl * .25], w: 3.4, tip, x0: -28 - bl - 14, x1: tip[0] + 6, y0: -spec.curve * bl * .6 - w * 1.3 - 12, y1: spec.curve * bl * .5 + w * 1.3 + 12 };
    } else if (spec.type === 'flail') {
      const R = 7.6 * M, cl = 14, bx = 38 + cl + R * .95;
      hybPiece(1); haft(1, 38, 4.4, p, [8, 25]); pommel(1, 3.4, p);
      band(37, 4.6, 7.6, p); chainLinks(39, 39 + cl, 0, 0, p, 4);
      if (spec.hyb === 'edge') { for (const a of [-1, 1]) { ctx.save(); ctx.translate(bx, 0); ctx.rotate(a * 1.2); curvedBlade(R * .6, R * 1.3, 4, .3, q, {}); ctx.restore(); } }
      spikedBall(bx, R, spec.spikes, p, spec.cur === 'nacre' ? 'nacre' : '');
      if (spec.hyb === 'spire') cel(PL([bx + R * .9, -2.4, bx + R + 14, 0, bx + R * .9, 2.4]), q.blade, { d: 1, r: .6, dark: q.bladeDk, lite: q.edge, w: 1 });
      if (thunder && det()) { ctx.strokeStyle = '#FFF2A0'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(bx - R * .6, -R * .3); ctx.lineTo(bx - R * .1, R * .2); ctx.lineTo(bx + R * .2, -R * .2); ctx.lineTo(bx + R * .6, R * .3); ctx.stroke(); }
      S = { pommel: [-1, 0], haft: [30, 34, 4, 2], collar: [36, 0], head: [bx, -R * .2], w: 4.4, tip: [bx + R, 0], x0: -22, x1: bx + R * 1.6 + 18, y0: -R * 1.7 - 12, y1: R * 1.7 + 14 };
    } else if (spec.type === 'chakram') {
      const R = 13 * Math.sqrt(M), cx = 21 + R, th = 4.2;
      hybPiece(4); haft(4, 21, 3.4, p, [9, 20]); pommel(4, 2.8, p);
      const ring = (ox, oy, cont) => { if (!cont) ctx.beginPath(); const n = serr ? 28 : 0; if (n) { for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = R * (i % 2 ? 1 : 1.1); i ? ctx.lineTo(cx + ox + Math.cos(a) * rr, oy + Math.sin(a) * rr) : ctx.moveTo(cx + ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } ctx.closePath(); } else { ctx.moveTo(cx + ox + R, oy); ctx.arc(cx + ox, oy, R, 0, TAU); }
        ctx.moveTo(cx + ox + R - th, oy); ctx.arc(cx + ox, oy, R - th, 0, TAU, true); };
      for (const a of [Math.PI * .5, Math.PI * 1.17, Math.PI * 1.83]) rod(() => { ctx.moveTo(cx + Math.cos(a) * (R - th), Math.sin(a) * (R - th)); ctx.lineTo(cx + Math.cos(a) * 3, Math.sin(a) * 3); }, 1.4, p.metal, p.metalLt);
      cel(ring, p.blade, { d: 2, r: 1.2, dark: p.bladeDk, lite: p.edge, w: 1.2 });
      ctx.beginPath(); ctx.arc(cx, 0, R - th, 0, TAU); ctx.strokeStyle = C(p.metal); ctx.lineWidth = 1.2; ctx.stroke();
      if (det()) { ctx.beginPath(); ctx.arc(cx, 0, R - .9, Math.PI * 1.05, Math.PI * 1.7); ctx.strokeStyle = p.edge; ctx.lineWidth = .8; ctx.stroke(); }
      if (thunder && det()) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU, rr = R - th / 2 + (i % 2 ? .9 : -.9); ctx.lineTo(cx + Math.cos(a) * rr, Math.sin(a) * rr); } ctx.strokeStyle = '#FFF2A0'; ctx.lineWidth = .7; ctx.stroke(); }
      pearl(cx, 0, 3.6, p);
      if (spec.hyb === 'spire') cel(PL([cx + R - 1, -2.2, cx + R + 13, 0, cx + R - 1, 2.2]), q.blade, { d: 1, r: .6, dark: q.bladeDk, lite: q.edge, w: 1 });
      cel(RR(19, -6.5, 3, 13, 1.2), p.metal, { d: 1, r: .6, lite: p.metalLt, w: 1 });
      const rs = (a) => [cx + Math.cos(a) * (R - th / 2), Math.sin(a) * (R - th / 2), a + Math.PI / 2];
      S = { pommel: [2, 0], haft: [rs(-2.2), rs(2.2), rs(-1), rs(1)], collar: [cx - R * .35, R - .5], cstep: 6, head: [cx + R * .5, -R * .6], w: th, tip: [cx + R, 0], x0: -20, x1: cx + R * 1.2 + 16, y0: -R * 1.2 - 12, y1: R * 1.2 + 14 };
    } else if (spec.type === 'shieldspear') {
      const pl = 19 * L, rx = 5.4, ry = 14 * Math.sqrt(M), sx = 25;
      hybPiece(2); haft(2, 64, 2.8, p, [10, 21]); pommel(2, 2.4, p, true);
      const tip = leaf(63, pl, 5.4, p, { thunder, spiral }); band(62.5, 3.6, 5.6, p);
      scallopShield(sx, rx, ry, p);
      S = { pommel: [0, 0], haft: [40, 48, 54, 34], collar: [58, 0], head: [63 + pl * .4, 0], w: 2.8, tip, x0: -20, x1: tip[0] + 6, y0: -ry * 1.2 - 12, y1: ry * 1.2 + 12 };
    } else if (spec.type === 'warshield') { // a round war-shield strapped along the forearm (the arm runs x 3..15, the hand at 15), its face toward +y, seen three-quarters
      const R = 16.5 * Math.sqrt(M), cx = 10, cy = 3.4, K = .5, ry = R * K;
      // the far edge of the dish (its thickness, toward the arm), then the face: rim, bands in to the boss, a sea star on it
      cel(PE(cx, cy - 2, R * .99, ry), shade(p.metal, -.28), { d: 0, r: .6, w: 1.2 });
      const sh = (r, dy) => PE(cx, cy + dy, R * r, ry * r);
      cel(sh(1, 0), p.metal, { d: 1.1, r: .8, lite: p.metalLt, w: 1.3 });
      if (serr) { ctx.fillStyle = C(p.metalLt); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * ry, ox = Math.cos(a) * 3, oy = Math.sin(a) * 3 * K;
        ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * 1.4, y + Math.cos(a) * 1.4 * K); ctx.lineTo(x + ox, y + oy); ctx.lineTo(x + Math.sin(a) * 1.4, y - Math.cos(a) * 1.4 * K); ctx.closePath(); ctx.fill(); outline(.5); } }
      cel(sh(.84, .5), p.blade, { d: .9, r: .7, dark: p.bladeDk, lite: '#FFFFFF', w: .9, tex: () => {
        if (det()) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(cx - R * .1, cy - ry * .25, R * .7, ry * .55, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke(); } } });
      cel(sh(.64, .9), p.b[3], { d: .7, r: .6, dark: p.b[4], lite: p.b[2], w: .8 });
      cel(sh(.46, 1.2), p.blade, { d: .6, r: .5, dark: p.bladeDk, lite: '#FFFFFF', w: .8 });
      if (thunder && det()) { ctx.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, rr = .74 + (i % 2 ? .05 : -.05); ctx.lineTo(cx + Math.cos(a) * R * rr, cy + .7 + Math.sin(a) * ry * rr); } ctx.strokeStyle = '#FFF2A0'; ctx.lineWidth = .8; ctx.stroke(); }
      const bx = cx, by = cy + 1.5, star = PF((ox, oy) => { for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? R * .13 : R * .33; const x = bx + ox + Math.cos(a) * rr, y = by + oy + Math.sin(a) * rr * K * 1.2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } });
      cel(star, p.accent, { d: .5, r: .4, lite: '#FFFFFF', w: .8 });
      pearl(bx, by, R * .12, p);
      // a hybrid's second Form on the rim: a blade out of the leading edge, a spike out of the boss, a pearl on a chain
      if (spec.hyb === 'edge') curvedBlade(cx + R * .9, 13, 4.4, .32, q, { serrate: serr });
      else if (spec.hyb === 'spire') cel(PL([cx + R - 1, cy - 2.2, cx + R + 15, cy, cx + R - 1, cy + 2.2]), q.blade, { d: 1, r: .6, dark: q.bladeDk, lite: q.edge, w: 1 });
      else if (spec.hyb) hybPiece(cx - R + 3);
      S = { pommel: [cx - R - 1, cy], haft: [[cx - R * .55, cy + ry * .55, 0], [cx + R * .55, cy + ry * .55, 0]], collar: [cx - R * .62, cy - ry * .2], cstep: 5, head: [bx, by], w: 3, tip: [cx + R, cy],
        x0: cx - R - 18, x1: cx + R + (spec.hyb === 'spire' || spec.hyb === 'edge' ? 20 : 8), y0: cy - ry - 14, y1: cy + ry + 14 };
    } else if (spec.type === 'trident') {
      const tl = 24 * L;
      haft(-26, 52, 3.4, p, [10, 24]); pommel(-26, 3, p);
      if (spec.hyb) hybPiece(-26);
      tineSet(54, tl, spec.tines, p, { thunder });
      if (spiral && det()) { ctx.strokeStyle = 'rgba(60,50,40,.4)'; ctx.lineWidth = .45; for (let i = 0; i < 5; i++) { const x = 58 + i * tl * .16; ctx.beginPath(); ctx.moveTo(x, -1); ctx.lineTo(x + 1, 1); ctx.stroke(); } }
      S = { pommel: [-28, 0], haft: [34, 42, -10, 0], collar: [48, 0], head: [54 + tl * .55, spec.tines === 5 ? -12 : -8], w: 3.4, tip: [54 + tl + 4, 0], x0: -48, x1: 54 + tl + 10, y0: -24, y1: 24 };
    } else { // the lance
      const ll = 46 * L, vr = 8.5 * Math.sqrt(M);
      haft(-24, 32, 3.4, p, [10, 24]); pommel(-24, 3, p);
      if (spec.hyb) hybPiece(-24);
      cel(PL([28, -2.6, 40, -vr, 42, -vr, 42, vr, 40, vr, 28, 2.6]), p.metal, { d: vr * .3, r: vr * .2, lite: p.metalLt, w: 1.2 });
      const path = PF((ox, oy) => { ctx.moveTo(41 + ox, -vr * .72 + oy); ctx.lineTo(41 + ll + ox, oy); ctx.lineTo(41 + ox, vr * .72 + oy); });
      cel(path, p.blade, { d: vr * .4, r: vr * .22, dark: p.bladeDk, lite: p.edge, w: 1.3, tex: () => { ctx.strokeStyle = C(thunder ? '#FFF2A0' : shade(p.bladeDk, -.2)); ctx.globalAlpha = thunder ? .9 : .5; ctx.lineWidth = .6;
        for (let i = 1; i < 8; i++) { const x = 41 + ll * i / 8.6, hw = vr * .72 * (1 - i / 8.6); ctx.beginPath(); ctx.moveTo(x - hw * .5, -hw); ctx.quadraticCurveTo(x, 0, x + hw * .5, hw); ctx.stroke(); } ctx.globalAlpha = 1; } });
      S = { pommel: [-26, 0], haft: [16, 22, -10, 4], collar: [36, 0], head: [41 + ll * .3, -vr * .4], w: 3.4, tip: [41 + ll, 0], x0: -46, x1: 41 + ll + 8, y0: -vr - 14, y1: vr + 14 };
    }
    return S;
  }
  // ---------------- the hangers: the ornaments that hang (a drop, a charm, shards on threads, the hybrid's pearl on a chain)
  // and the streaming ribbons. While the kept picture is painted (HLIST set) they are listed instead of painted, and
  // drawHangers draws them live over it: each turned about its pivot so it hangs down under gravity whatever the weapon's
  // angle, and swung by the pivot's own motion (the orb's pendulum, pearl_ng.js). HANGW: the pivot in the ornament's own
  // space; str: a streamer (it bends with the swing, it does not hang)
  const HANGW = { drops: { piv: [-.5, 2.5] }, charm: { piv: [1, 1.5] }, shards: { piv: [-.5, 2] }, ribbons: { piv: [0, 0], str: 1 } };
  let HLIST = null;
  const HSW = new Map();
  function paintWeapon(spec) {
    const S = paintBody(spec), p = spec.pal, used = { haft: 0, collar: 0, head: 0, pommel: 0 };
    const at = (x, y, rot, fn, part) => { const h = HLIST && HANGW[part]; if (h) { HLIST.push({ tx: x, ty: y, rot: rot || 0, piv: h.piv, str: h.str, rest: 0, fn }); return; } ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); fn(); ctx.restore(); };
    for (const part of spec.parts) { const o = ORN[part]; if (!o || o[0] === 'flag') continue;
      const slot = o[0], n = used[slot]++;
      if (slot === 'haft') { const h = S.haft[n % S.haft.length], hx = Array.isArray(h) ? h : [h, 0, 0]; at(hx[0], hx[1], hx[2], () => o[1](0, 0, p, S.w)); }
      else if (slot === 'collar') at(S.collar[0] + n * (S.cstep ?? -5.5), S.collar[1], 0, (sw) => o[1](0, 0, p, sw), part);
      else if (slot === 'head') at(S.head[0] - n * 4, S.head[1], 0, (sw) => o[1](0, 0, p, sw), part);
      else at(S.pommel[0] - n * 4, S.pommel[1], 0, (sw) => o[1](0, 0, p, sw), part);
    }
    return S;
  }

  // each pearl on it lit from behind: a soft light in the Current's colour, drawn before the weapon so it never covers it
  // (not kept in the picture, so a hit flash or a shadow tint of the picture has no halo)
  const SPOTC = new Map();
  function pearlSpots(spec) {
    let sp = SPOTC.get(spec.key); if (sp) return sp;
    const probe = document.createElement('canvas'); probe.width = probe.height = 2; sp = [];
    SPOTS = sp; try { ART.withCtx(probe.getContext('2d'), () => { paintWeapon(spec); }); } finally { SPOTS = null; }
    if (SPOTC.size > 30) SPOTC.clear(); SPOTC.set(spec.key, sp); return sp;
  }
  function backlight(spec) {
    if (!det()) return; const now = performance.now() / 1000, pu = .5 + .5 * Math.sin(now * 2.4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r] of pearlSpots(spec)) ART.glow(x, y, Math.max(r * 3.4, 7) * (1 + .12 * pu), spec.pal.glow, .5 + .14 * pu);
    ctx.restore();
  }

  // ---------------- the picture, painted once and kept ----------------
  const W_SC = 4, CACHE = new Map();
  function picture(spec) {
    let c = CACHE.get(spec.key); if (c) return c;
    if (CACHE.size > 30) CACHE.clear();
    // a dry run for its size (painted off-screen at once, then again into its own canvas at that size)
    const probe = document.createElement('canvas'); probe.width = probe.height = 2; let S;
    ART.withCtx(probe.getContext('2d'), () => { S = paintBody(spec); });
    const x0 = Math.floor(S.x0), y0 = Math.floor(S.y0), w = Math.ceil(S.x1 - x0), h = Math.ceil(S.y1 - y0);
    c = document.createElement('canvas'); c.width = Math.max(4, w * W_SC); c.height = Math.max(4, h * W_SC); c.bx = x0; c.by = y0; c.bw = w; c.bh = h; c.slots = S; c.tint = {};
    const ok = OUTK, ik = INK, fl = FLASH, ti = TINT; OUTK = .62; INK = '#170D0C'; FLASH = false; TINT = null;
    c.hang = []; HLIST = c.hang;
    try { ART.withCtx(c.getContext('2d'), () => { ctx.setTransform(W_SC, 0, 0, W_SC, -x0 * W_SC, -y0 * W_SC); paintWeapon(spec); }); } finally { OUTK = ok; INK = ik; FLASH = fl; TINT = ti; HLIST = null; }
    CACHE.set(spec.key, c); return c;
  }
  function tinted(c, col) { // one colour all over (a hit flash, a shadow afterimage)
    let t = c.tint[col]; if (t) return t;
    t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const g = t.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, t.width, t.height);
    if (Object.keys(c.tint).length > 8) c.tint = {}; c.tint[col] = t; return t;
  }
  // the hangers, live over the kept picture. Down is found from the canvas's own transform (so they hang under gravity
  // as the weapon turns, on an icon as in his hand); the swing steps once a frame, on the game's clock, only for the
  // weapon in his hand (step), from where its pivot really goes on the canvas
  function drawHangers(spec, c, step) {
    const L = c.hang; if (!L || !L.length) return;
    const m = ctx.getTransform(), dm = m.a * m.d - m.b * m.c; if (!dm) return;
    const sg = dm < 0 ? -1 : 1, sc = Math.sqrt(Math.abs(dm)) || 1, gr = Math.atan2(m.a / dm, -m.c / dm) - Math.PI / 2, clk = PN.CUR.clock, now = performance.now() / 1000;
    const ok = OUTK, ik = INK; OUTK = .62; INK = '#170D0C';
    try {
      for (let i = 0; i < L.length; i++) { const h = L[i], key = spec.key + '#' + i, cr = Math.cos(h.rot), sr = Math.sin(h.rot);
        let s = HSW.get(key); if (!s) { if (HSW.size > 24) HSW.clear(); s = ART.swNew(); s.clk = clk; HSW.set(key, s); }
        if (step && clk !== s.clk) { const lx = h.tx + h.piv[0] * cr - h.piv[1] * sr, ly = h.ty + h.piv[0] * sr + h.piv[1] * cr, dt = clk - s.clk; s.clk = clk;
          if (dt > .2) s.px = null; ART.swStep(s, (m.a * lx + m.c * ly + m.e) / sc, (m.b * lx + m.d * ly + m.f) / sc, dt, { drag: .0004 }); }
        const A = step ? ART.swView(s, sg, now) : ART.swView(null, sg, now);
        ctx.save(); ctx.translate(h.tx, h.ty); if (h.rot) ctx.rotate(h.rot);
        if (h.str) h.fn(A);
        else { ctx.translate(h.piv[0], h.piv[1]); ctx.rotate(gr - h.rot + h.rest + A[0]); ctx.translate(-h.piv[0], -h.piv[1]); h.fn(); }
        ctx.restore(); }
    } finally { OUTK = ok; INK = ik; }
  }
  const GLOWS = { quick: { per: .45, a: .3 }, heavy: { per: 1.7, a: .42 }, wild: { per: .3, a: .32, flick: 1 }, patient: { per: 2.8, a: .26 } };
  function drawPW(pose) {
    const W = WEAPONS[ID], spec = W && W.pearl; if (!spec) return;
    const hand = pose.glove || '#FFF1E0', withHand = !pose.noHand;
    if (withHand) gripBack(hand, 17.1);
    // the light: the head's glow by the Temper and each pearl's own, behind the weapon (it lights round it, never over it)
    backlight(spec);
    if (det() && !pose.noGlow) { const c = picture(spec), hd = c.slots.head, G = GLOWS[spec.tmp] || { per: 2, a: .2 }, now = performance.now() / 1000;
      let k = .6 + .4 * Math.sin(now * TAU / G.per); if (G.flick) k = .5 + .5 * Math.random();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ART.glow(hd[0], hd[1], 16 + 6 * spec.mass, spec.pal.glow, G.a * k); ctx.restore(); }
    if (pose.vector) { paintWeapon(spec); }
    else { const c = picture(spec), img = FLASH ? tinted(c, '#FFFFFF') : TINT ? tinted(c, TINT) : c; ctx.drawImage(img, c.bx, c.by, c.bw, c.bh); drawHangers(spec, c, !pose.noHand && !TINT && mode === 'play'); }
    if (det() && !pose.noGlow && pose.glow) { const c = picture(spec); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.fillStyle = pose.glow; rrect(c.bx + c.bw * .45, -7, c.bw * .5, 14, 6); ctx.fill(); ctx.restore(); }
    if (withHand) gripFront(hand, 17.1);
  }
  { const _dw = drawWeapon; drawWeapon = function (kind, pose) { if (kind === ID) { drawPW(pose || {}); return; } return _dw(kind, pose); }; }
  { const _di = drawIcon; drawIcon = function (canvas, id, scale) {
    if (id !== ID || !WEAPONS[ID] || !WEAPONS[ID].pearl) return _di(canvas, id, scale);
    const g = canvas.getContext('2d'), old = ctx; ctx = g; const c = picture(WEAPONS[ID].pearl);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
    const s = canvas.width / 64 * (scale || 1), len = Math.hypot(c.bw, c.bh * .6), k = 74 / len;
    g.setTransform(s, 0, 0, s, 0, 0); ctx.translate(32, 32); ctx.rotate(-.8); ctx.scale(k, k); ctx.translate(-(c.bx + c.bw / 2), -(c.by + c.bh / 2)); drawPW({ noHand: 1, noGlow: 1 });
    ctx = old; centerArt(canvas); paintCard(canvas, s * .7);
  }; }
  // a big close-up, for the reforging and the sheets (painted straight, not from the kept picture)
  function drawBig(g, spec, cx, cy, size, rot = -.32, hmax) {
    const old = ctx; ctx = g; const c = picture(spec), len = c.bw, k = Math.min(size / len, hmax ? hmax / (c.bh * .72) : 1e9);
    const ok = OUTK, ik = INK; OUTK = .7; INK = '#170D0C';
    try { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k); ctx.translate(-(c.bx + c.bw / 2), -(c.by + c.bh / 2)); backlight(spec); paintWeapon(spec); ctx.restore(); } finally { ctx = old; OUTK = ok; INK = ik; }
  }

  // ======================================================================================================
  // THE WEAPON IN THE GAME: put on the wheel, its poses borrowed, its blows carrying the Current
  // ======================================================================================================
  const forgedRec = () => (save && save.pearlForge && Array.isArray(save.pearlForge.picks) ? save.pearlForge : null);
  const others = () => Object.keys(save.wl).filter(id => id !== ID && id !== 'fists' && save.owned[id] && WEAPONS[id]);
  const startLevel = () => clamp(Math.max(1, ...others().map(id => save.wl[id] || 1)), 1, typeof WMAX === 'function' ? WMAX() : 7);
  function register(F) {
    const spec = design(F.seed, F.picks), built = buildTree(spec), B = WEAPONS[spec.base];
    WEAPONS[ID] = { name: spec.name, short: spec.noun, reach: Math.round(B.reach * built.reachK), look: ID, base: spec.base, pearl: spec, sig: built.sig,
      parry: !!spec.sc.shell && !built.pm, pm: !!built.pm, tree: built.tree,
      desc: `The Pearl of Judgement, reforged: a ${spec.tag}. Hold Heavy for ${built.tree.HC.name}.` };
    W_SPEED[ID] = (W_SPEED[spec.base] || 1) * (spec.tmp === 'quick' ? 1.06 : spec.tmp === 'heavy' ? .95 : 1);
    TRAIL[ID] = spec.pal.trail; DEATH_BY[ID] = TYPES[spec.type].death;
    return spec;
  }
  function sync() { // on the wheel (swap, the forge, the title's list) only while it is his
    const F = forgedRec(), on = !!F;
    if (on) { if (!WEAPONS[ID] || !WEAPONS[ID].pearl || WEAPONS[ID].pearl.key !== design(F.seed, F.picks).key) register(F); save.owned[ID] = true; if (!save.wl[ID]) save.wl[ID] = startLevel(); }
    else if (save.owned) delete save.owned[ID];
    const i = WEAPON_ORDER.indexOf(ID);
    if (on && i < 0) WEAPON_ORDER.push(ID); else if (!on && i >= 0) WEAPON_ORDER.splice(i, 1);
    if (!on && P && P.w === ID) { P.w = save.owned[save.weapon] && save.weapon !== ID ? save.weapon : 'fists'; }
    if (!on && save.weapon === ID) save.weapon = 'fists';
  }
  // it is kept in the save as its seed and its choices; the save itself never names it as the weapon in hand (an older
  // copy of the game, or the boot before this file has run, would not know it), so that is kept beside it
  { const _ps = persist; persist = function () {
    const F = forgedRec(); if (!F || !save.owned) return _ps();
    const w = save.weapon, o = save.owned[ID]; F.inHand = w === ID; if (F.inHand) save.weapon = F.prev && save.owned[F.prev] ? F.prev : 'fists'; else F.prev = w;
    delete save.owned[ID]; try { _ps(); } finally { save.weapon = w; if (o) save.owned[ID] = o; }
  }; }
  function restoreHand() { const F = forgedRec(); if (F && F.inHand && save.owned[ID]) save.weapon = ID; }
  sync(); restoreHand(); if (P && forgedRec() && save.weapon === ID && !(typeof mode !== 'undefined' && mode === 'play')) { P.w = ID; try { refreshHud(true); } catch (e) {} }
  { const _sw = swapWeapon; swapWeapon = function () { sync(); return _sw(); }; }
  { const _rf = renderForge; renderForge = function (note) { sync(); return _rf(note); }; }
  { const _rt = refreshTitle; refreshTitle = function () { sync(); restoreHand(); return _rt(); }; }
  { const _pl = play; play = function (i, zone) { sync(); restoreHand(); scenePending = false; return _pl(i, zone); }; }
  // the poses: the closest weapon's own, the picture its own
  { const _pp = playerPose; playerPose = function () {
    if (!P || P.w !== ID || !WEAPONS[ID] || !WEAPONS[ID].pearl || WEAPONS[ID].pm) return _pp(); // (its own moveset poses itself: pearl_moves.js)
    const base = WEAPONS[ID].base; let pose;
    P.w = base; P.pwProxy = true;
    try { pose = _pp(); } finally { P.w = ID; P.pwProxy = false; }
    pose.weapon = ID; pose.tier = Math.min(7, save.wl[ID] || 1);
    const tc = TRAIL[base], mine = TRAIL[ID]; if (pose.trailCol === tc) pose.trailCol = mine; if (pose.flat && pose.flat.col === tc) pose.flat.col = mine; if (pose.streak && pose.streak.col === tc) pose.streak.col = mine;
    return pose;
  }; }
  // its blows carry the Current (a chance on each, more on the heavy ones, always on the charged heavy)
  { const _st = strike; strike = function (e, base, dir, m, echo) {
    const hp0 = e ? e.hp : 0; _st(e, base, dir, m, echo);
    if (!P || P.w !== ID || !m || m.pearl || echo || !m.pe || !e || !(e.hp < hp0 || e.dead) || Math.random() >= m.pe) return;
    const S = PN.curStats(); if (!S) return;
    let s = P._pwS; if (!s || s.id !== P.moveId) s = P._pwS = { id: P.moveId, S, k: 'wpn', dmg: base, pools: 0 };
    s.S = S; PN.procs(s, e, Math.max(1, base * .6), dir);
  }; }
  // the charged heavy's release: what its Current does as the blow comes
  function release(m) {
    const f = P.facing, d = Math.max(1, m.dmg * wMult(ID) * (m.pmul || 1)), S = PN.curStats(), fx0 = P.x + f * 50, foes = enemies.filter(e => !e.dead && e.state !== 'enter');
    const near = (x, r) => foes.filter(e => Math.hypot(e.x - x, (e.y - P.y) * 1.6) < r).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
    if (m.peRel === 'tide') { if (S) PN.addPool(fx0, P.y, d * .6, S); projs.push({ owner: 'p', x: P.x + f * 40, y: P.y, z: 0, vx: f * 300, dmg: Math.round(d * .5), life: .9, hit: new Set(), wave: 1, quake: true }); }
    else if (m.peRel === 'nacre') { for (const e of near(P.x, 230).slice(0, 6)) { const q = Math.max(1, Math.round(d * .35 * (e.boss ? .6 : 1))); strike(e, q, Math.sign(e.x - P.x) || f, { dmg: q, kb: 120, power: 0, el: 1, pearl: 1 }, true); ART.sparkle(e.x, e.y, e.z + e.hh * .5, 6, ['#FFFFFF', '#F6C2D4', '#F2D68A']); } sfx('hit-crystal'); }
    else if (m.peRel === 'storm') { for (const e of near(P.x, 220).slice(0, 4)) { fx.push({ kind: 'bolt', x: e.x + rand(-14, 14), y: e.y, z: e.z + 250, x2: e.x, y2: e.y, z2: e.z + e.hh * .5, t: .28, max: .28, col: '#E8ECFF', seed: Math.random() * 99 }); const q = Math.max(1, Math.round(d * .55 * (e.boss ? .6 : 1))); strike(e, q, Math.sign(e.x - P.x) || f, { dmg: q, kb: 80, launch: 200, power: 2, el: 1, pearl: 1 }, true); } sfx('shoot'); flashT = Math.max(flashT, .05); }
    else if (m.peRel === 'abyss') { for (const e of near(fx0, 180)) if (!e.boss) { e.x += (fx0 - e.x) * .7; e.y += (P.y - e.y) * .6; } ART.sparkle(fx0, P.y, 30, 12, ['#6FE0C0', '#2A2050', '#FFFFFF']); sfx('hit-goo', .7); }
    else { fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .35, max: .35, r: 80, col: '#FFFFFF', flat: 1 }); for (const e of near(P.x, 90)) { const q = Math.max(1, Math.round(d * .4)); strike(e, q, Math.sign(e.x - P.x) || f, { dmg: q, kb: 200, power: 1, el: 1, pearl: 1 }, true); } }
  }
  { const _up = updatePlayer; updatePlayer = function (dt) {
    _up(dt);
    if (!P || P.w !== ID || !WEAPONS[ID]) return;
    const m = P.move;
    if ((P.state === 'atk' || P.state === 'air') && m && m.peRel && P.peRelId !== P.moveId && P.t / m.dur >= (m.peRelAt || 0)) { P.peRelId = P.moveId; try { release(m); } catch (e) { console.error(e); } }
    // the Temper's motes off the weapon's head
    const spec = WEAPONS[ID].pearl, rate = { quick: 7, heavy: 4, wild: 9, patient: 3 }[spec.tmp] || 2;
    if (Math.random() < dt * rate && parts.length < 380) { const hx = P.x + P.facing * WEAPONS[ID].reach * .7, hz = P.z + 30 + rand(-10, 16), col = pick([spec.pal.edge, spec.pal.accent, spec.pal.metalLt]);
      if (spec.tmp === 'heavy') parts.push({ x: hx, y: P.y, z: hz, vx: 0, vy: 0, vz: -40, life: .7, max: .7, col: spec.pal.metalLt, size: rand(1.4, 2.2), shape: 'blob' });
      else if (spec.tmp === 'quick') parts.push({ x: hx, y: P.y, z: hz, vx: -P.facing * rand(60, 120), vy: 0, vz: rand(-10, 10), life: .3, max: .3, col, size: rand(1, 1.8), shape: 'star', rot: 0, vr: 6 });
      else if (spec.tmp === 'wild') parts.push({ x: hx + rand(-8, 8), y: P.y, z: hz, vx: rand(-60, 60), vy: 0, vz: rand(-30, 60), life: .35, max: .35, col: pick(['#FFF2A0', '#F6C2D4', '#9FE2D3', '#C2CAFF']), size: rand(1.2, 2), shape: 'star', rot: 0, vr: 9 });
      else parts.push({ x: hx, y: P.y, z: hz, vx: rand(-6, 6), vy: 0, vz: rand(12, 26), life: 1, max: 1, col, size: rand(1, 1.6), shape: 'star', rot: 0, vr: 2 }); }
  }; }

  // ======================================================================================================
  // THE REFORGING: as the road's last world begins, the parts fly together into the weapon
  // ======================================================================================================
  let scene = null, scenePending = false;
  const ready = () => PN.evoOn() && PN.ES().picks.length >= PN.PICKS; // (normally the fifth choice reforges it at once: reforgeThen; this catches a save left between the two)
  { const _ht = hudTick; hudTick = function () { _ht();
    if (!scene && mode === 'play' && !zoneTrans && P && P.state !== 'dead' && !(window.ENDINGS && ENDINGS.active) && ready()) { if (!scenePending) { scenePending = performance.now(); } else if (performance.now() - scenePending > 700) openScene(); } }; }
  function forgeNow(seed, picks, equip = true) {
    const F = save.pearlForge = { seed: seed | 0, picks: picks.slice(0, PN.PICKS), at: save.cycle | 0, inHand: !!equip, prev: save.weapon !== ID ? save.weapon : 'fists' };
    save.owned[ID] = true; save.wl[ID] = startLevel(); register(F); sync();
    if (equip && P) { P.w = ID; save.weapon = ID; P.seq = ''; }
    persist(); if (P) try { refreshHud(true); } catch (e) {}
    return WEAPONS[ID];
  }
  function moveRows(W) {
    if (window.PEARLM) return PEARLM.rows(W);
    const t = W.tree, fin = t.LLLL ? 'LLLL' : 'LLL';
    return [['Light combo', `Attack ×${fin.length}`, t[fin].name], ['Heavy', 'Heavy', t.H.name], ['Charged heavy', 'Hold Heavy, let go in the gleam', t.HC.name], ['Jump attack', 'Jump, then Heavy', t.JH ? t.JH.name : 'Air Heavy']];
  }
  function openScene(o = {}) {
    if (scene) return; scenePending = false;
    const s = PN.ES(), picks = o.picks || s.picks.slice(0, PN.PICKS), seed = o.seed ?? s.seed, spec = design(seed, picks), prev = mode;
    mode = 'pearlforge'; app.classList.add('nocontrols'); clearInput();
    const el = document.createElement('div'); el.id = 'pearlForgeOv';
    el.innerHTML = `<style>
      #pearlForgeOv { position: absolute; inset: 0; z-index: 8; background: radial-gradient(ellipse at 50% 42%, #164A50, #04121A 75%); color: #EAF6F0; font-family: var(--label, Georgia, serif); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 16px; box-sizing: border-box; overflow: hidden; }
      #pearlForgeOv canvas { width: min(760px, 100%); max-height: 54%; aspect-ratio: 16 / 7; flex: 0 1 auto; }
      #pearlForgeOv .tx { width: min(720px, 100%); text-align: center; opacity: 0; transition: opacity .6s; max-height: 46%; overflow: auto; }
      #pearlForgeOv .tx.on { opacity: 1; }
      #pearlForgeOv .kk { font: 700 11px var(--label, Georgia, serif); letter-spacing: .2em; color: #F2D68A; }
      #pearlForgeOv h2 { margin: 2px 0; font: 700 clamp(16px, 3.4vw, 26px) Cinzel, Georgia, serif; color: #FFFFFF; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
      #pearlForgeOv .sub { font-size: 12px; opacity: .85; margin-bottom: 6px; }
      #pearlForgeOv ul { list-style: none; margin: 0 auto 8px; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px 12px; text-align: left; font-size: 11.5px; }
      #pearlForgeOv li b { color: #F2D68A; font: 700 11.5px Cinzel, Georgia, serif; } #pearlForgeOv li em { font-style: normal; opacity: .7; font-size: 10.5px; }
      #pearlForgeOv button { font: 700 14px Cinzel, Georgia, serif; padding: 7px 18px; border-radius: 8px; border: 1.5px solid #F2D68A; background: linear-gradient(170deg, #2E6E70, #0C2A32); color: #FFFFFF; cursor: pointer; }
    </style><canvas width="960" height="420"></canvas><div class="tx"><div class="kk">THE PEARL OF JUDGEMENT IS REFORGED</div><h2></h2><div class="sub"></div><ul></ul><button type="button">Take it up</button></div>`;
    app.appendChild(el);
    const cvs = el.querySelector('canvas'), g = cvs.getContext('2d'), tx = el.querySelector('.tx');
    const W0 = { tree: buildTree(spec).tree, sig: PN.stats(picks, true), pearl: spec };
    tx.querySelector('h2').textContent = spec.name; tx.querySelector('.sub').textContent = `A ${spec.tag}. It is yours for good: it stays on your weapon wheel through every cycle of the road, and you glide on the Currents while it is in your hands.`;
    tx.querySelector('ul').innerHTML = moveRows(W0).map(([a, b, c]) => `<li><b>${c}</b><br><em>${a} · ${b}</em></li>`).join('');
    if (window.PEARLM) tx.querySelector('ul').insertAdjacentHTML('beforebegin', PEARLM.statsHtml(spec)); // (what the five choices made of it: pearl_moves.js)
    scene = { el, t0: performance.now() - (o.skip ? 3000 : 0), spec, picks, seed, prev, shown: false, after: o.after || null };
    const take = () => { if (!scene) return; const S2 = scene; scene = null; el.remove(); app.classList.remove('nocontrols'); window.removeEventListener('keydown', key, true);
      const W = forgeNow(S2.seed, S2.picks); mode = S2.after && S2.prev === 'ending' ? 'ending' : 'play'; clearInput(); for (const q in pressed) pressed[q] = false;
      if (S2.after) { try { S2.after(); } catch (err) { console.error(err); } }
      if (P) { floatText(P.x, P.y, P.z + 100, W.name.toUpperCase(), '#F2D68A', 14); ART.sparkle(P.x + P.facing * 30, P.y, P.z + 40, 24); sfx('weapon'); } };
    const skip = () => { if (!scene) return; const t = (performance.now() - scene.t0) / 1000; if (t < 3) scene.t0 = performance.now() - 3000; else if (scene.shown) take(); };
    const key = (e) => { if (!scene) return; if (['Enter', 'NumpadEnter', 'Space', 'KeyJ', 'KeyZ', 'Escape'].includes(e.code) && !e.repeat) { e.preventDefault(); e.stopImmediatePropagation(); skip(); } else { e.stopImmediatePropagation(); } };
    window.addEventListener('keydown', key, true);
    tx.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); take(); });
    cvs.addEventListener('click', skip);
    scene.take = take; scene.skip = skip;
    sfx('trump');
    const loop = () => { if (!scene || scene.el !== el) return; const t = (performance.now() - scene.t0) / 1000; try { drawForge(g, cvs.width, cvs.height, t, scene); } catch (e) { console.error(e); }
      if (t >= 3.1 && !scene.shown) { scene.shown = true; tx.classList.add('on'); sfx('learned'); }
      try { requestAnimationFrame(loop); } catch (e) {} };
    try { drawForge(g, cvs.width, cvs.height, scene.t0 ? (performance.now() - scene.t0) / 1000 : 0, scene); } catch (e) { console.error(e); }
    if (o.skip) { scene.shown = true; tx.classList.add('on'); }
    try { requestAnimationFrame(loop); } catch (e) {}
    return true;
  }
  function drawForge(g, w, h, t, sc) {
    const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }, spec = sc.spec, pal = spec.pal, picks = sc.picks, cx = w / 2, cy = h * .5, R0 = h * .085;
    ART.withCtx(g, () => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      const bg = g.createRadialGradient(cx, cy, 10, cx, cy, w * .6); bg.addColorStop(0, '#1F5E62'); bg.addColorStop(.55, '#0C2A34'); bg.addColorStop(1, '#040E14'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { g.strokeStyle = `rgba(${pal.glow},${.08 + .04 * Math.sin(t * 2 + i)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy + h * .34, w * (.08 + i * .07), h * (.03 + i * .018), 0, 0, TAU); g.stroke(); } g.restore();
      const out = sm((t - .5) / .7), inn = sm((t - 1.5) / 1), flash = t > 2.5 ? Math.max(0, 1 - (t - 2.5) / .7) : 0, show = sm((t - 2.5) / .6);
      if (t < 2.6) { // the orb, its parts drawn out round it on a ring, then flung back in together
        const n = picks.length, spin = t * (1.2 + 3 * inn);
        ART.glow(cx, cy, R0 * (5 + 4 * inn), pal.glow, .35 + .3 * inn);
        g.save(); g.translate(cx, cy); ART.pearlBody(0, 0, R0 * (1 - .3 * out + .5 * inn), t, 4, pal); g.restore();
        picks.forEach((id, i) => { const a = spin + i / n * TAU, rr = (h * .32) * out * (1 - inn), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .6, r = R0 * .55 * (1 - .6 * inn);
          if (out < .05) return; g.save(); g.translate(x, y); g.globalAlpha = Math.min(1, out * 1.5); ART.drawOrb([id], r, PAL[(TR[id].tag && PAL[TR[id].tag]) ? TR[id].tag : spec.cur || 'pearl'], t, t * 3); g.restore();
          if (inn > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${pal.glow},${.5 * inn})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(cx, cy); g.stroke(); g.restore(); } });
        if (t < .6) { g.save(); g.translate(cx, cy); ART.drawOrb(picks, R0, pal, t, t * 2); g.restore(); }
      }
      if (show > 0) { // the weapon, held up in the light
        ART.glow(cx, cy, w * .32, pal.glow, .28 * show);
        g.save(); g.globalAlpha = show; const bob = Math.sin(t * 1.6) * h * .015; drawBig(g, spec, cx, cy + bob, w * (.5 + .08 * show), -.18 + Math.sin(t * .8) * .03); g.restore();
        if (Math.random() < .5) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,250,230,${.6 * show})`; const x = cx + rand(-w * .3, w * .3), y = cy + rand(-h * .25, h * .25); g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 1.4, y); g.lineTo(x, y + 5); g.lineTo(x - 1.4, y); g.fill(); g.restore(); }
      }
      if (flash > 0) { g.fillStyle = `rgba(255,252,240,${flash * .9})`; g.fillRect(0, 0, w, h); }
    });
  }

  // ---------------- for the dev panel and tests ----------------
  const devOK = () => !!(window.DEV && DEV.active);
  function randomPicks(seed) { const r = mulberry((seed ^ 0x13579BDF) >>> 0), pk = []; for (let i = 0; i < PN.PICKS; i++) { const o = PN.offers(pk, seed); if (!o.length) break; pk.push(o[Math.floor(r() * o.length)].id); } return pk; }
  // right after the fifth choice: the reforging, then after (true if the scene opened; after runs when it is taken up)
  function reforgeThen(after) { if (scene || !ready()) { if (after) after(); return false; } scenePending = false; return openScene({ after }); }
  window.PEARLW = {
    reforgeThen,
    ID, TYPES, design, buildTree, randomPicks, reregister: () => { const F = forgedRec(); if (F) { register(F); sync(); } }, forgeNow, openScene, drawBig, picture, spec: () => WEAPONS[ID] && WEAPONS[ID].pearl, scene: () => scene, sync, moveRows,
    dev: {
      card() { if (!devOK()) return 'dev games only'; if (!PN.evoOn()) return 'the Pearl is not evolving (NG+, the Pearl, the switch, and not yet reforged)'; return PN.pick(null); },
      auto() { if (!devOK()) return 'dev games only'; if (!PN.evoOn()) return 'the Pearl is not evolving'; return PN.autoPick(); },
      reforge() { if (!devOK()) return 'dev games only'; if (!PN.evoOn()) return 'the Pearl is not evolving'; PN.autoPick(); return openScene(); },
      roll(seed) { if (!devOK()) return 'dev games only'; const sd = seed ?? ((Math.random() * 2147483647) | 0), pk = randomPicks(sd); save.pearlEvo = { seed: sd, picks: pk.slice(), got: {} }; if (mode === 'play') { delete save.pearlForge; sync(); return openScene({ seed: sd, picks: pk, skip: true }); } forgeNow(sd, pk); return WEAPONS[ID].name; },
    },
  };
})();
