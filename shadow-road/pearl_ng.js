'use strict';
// ======================================================================================================
// THE PEARL OF JUDGEMENT IN NEW GAME+ (the relic: save.w7relic, won in Rebma; its first form and its ending: w7_late.js)
// ------------------------------------------------------------------------------------------------------
// In a later cycle (save.cycle >= 1) the Pearl changes how the whole run plays. Two mechanics, each with its own switch
// (PEARL_NG, w7_late.js; the dev panel has a box for each):
//   THE EVOLVING PEARL (PEARL_NG.evolve)  the Pearl hangs at his shoulder, and when each of the first five worlds' boss
//        falls it rises out of the boss and a card offers three traits, one on each of three axes:
//          FORM     how it fights     edge (cuts), orb (thrown, comes back), shell (guards, counters), spire (long, thrusts)
//          CURRENT  its element       tide (pushes, whirlpools), nacre (shards, bleeding), storm (chains), abyss (pulls, drains)
//          TEMPER   its feel          quick, heavy, wild (random extra shots), patient (hold to charge, a perfect window)
//        Offers lean toward the tags he already holds (about 60%); some traits are only offered once two tags are held.
//        Every pick adds a part to the orb, and changes how it is thrown: Light + Heavy pressed together (or the PEARL
//        button) throws the orb itself, out and back like a boomerang, striking each foe once on the way out and once on
//        the way back. The Form shapes the flight (a cutting disc, a heavy moon that hops foe to foe, a shell that bursts
//        at the far end, a straight lance, three fanned), the Current what its hits do, the Temper its reach, speed and
//        weight (patient: hold to wind it up). Each leg lands about like a charged heavy, growing with the choices. The progress is the save's (save.pearlEvo): it is
//        never lost to a death or a retry, and it carries on into the next cycle if the road ran out first.
//        After the fifth pick, at the start of the road's last world, it is reforged into a weapon of its own
//        (pearl_weapon.js), kept for good: then the companion is gone, the weapon throws a pearl the same way as its signature move.
//   CURRENTS, NOT FOOTSTEPS (PEARL_NG.currents)  he does not walk: holding a direction lays a current under him and he
//        glides on it, quick to gather speed and slow to lose it, turning in a curve. Dodge (or a double-tap) throws a
//        strong current that flings him across the street (the dodge's own i-frames and counters are kept): whatever he
//        passes through at speed is struck and thrown, the harder the faster; he comes off the screen's edges and off
//        the big ones like a pinball. An attack at speed carries further and hits harder; a jump keeps the speed.
//        It runs whenever the Pearl is his in New Game+, and whenever the reforged weapon is in his hand.
// The old undertow and splash (PEARL_NG.legacy) are in w7_late.js, switched off.
// Console: pearlNG('evolve', false) etc. switches (dev games only); PEARLNG.take('undertow') adds a trait;
// PEARLNG.autoPick() fills the five picks; PEARLNG.pick() shows the next card.
// ======================================================================================================
(() => {
  if (!window.W7 || typeof PEARL_NG === 'undefined') { console.error('pearl_ng.js: w7_late.js missing'); return; }
  const SW = PEARL_NG, WID = 'pearlw';
  const owned = () => !!(typeof save !== 'undefined' && save && save.w7relic && (save.cycle | 0) >= 1);
  const forged = () => !!(typeof save !== 'undefined' && save && save.pearlForge && save.owned && save.owned[WID]);
  const held = () => !!(P && (P.w === WID || P.pwProxy) && forged()); // (pwProxy: while the weapon's poses borrow another weapon's, pearl_weapon.js)
  const evoOn = () => owned() && SW.evolve && !forged();
  const curOn = () => !!SW.currents && (forged() ? held() : owned()); // (once the Pearl is reforged, only its own weapon glides; before that, all of them do)
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter' && e.state !== 'w5morph' && e.state !== 'w5riddle');
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const bub = (x, y, z, n, sp) => { if (W7.bubbles) W7.bubbles(x, y, z, n, sp); };
  const live = () => !!(typeof mode !== 'undefined' && mode === 'play' && P && stage);
  const PCW = () => (typeof PC_WIN !== 'undefined' ? PC_WIN : .13);
  const W = () => (typeof wMult === 'function' && P && save.wl[P.w] ? wMult(P.w) : 1); // (it strikes as hard as the weapon in hand is tempered)

  // ======================================================================================================
  // THE TRAITS
  // ======================================================================================================
  const AX = { form: ['edge', 'orb', 'shell', 'spire'], current: ['tide', 'nacre', 'storm', 'abyss'], temper: ['quick', 'heavy', 'wild', 'patient'] };
  const AXNAME = { form: 'FORM', current: 'CURRENT', temper: 'TEMPER' };
  const TAGNAME = { edge: 'Edge', orb: 'Orb', shell: 'Shell', spire: 'Spire', tide: 'Tide', nacre: 'Nacre', storm: 'Storm', abyss: 'Abyss', quick: 'Quick', heavy: 'Heavy', wild: 'Wild', patient: 'Patient' };
  // id, axis, tag (or req: the two tags that must be held before it is offered), name, one line, the part it adds, words for the weapon's name
  const TRAITS = [
    // ---- FORM ----
    { id: 'crescent', ax: 'form', tag: 'edge', name: 'Nacre Crescent', part: 'crescent', adj: ['Crescent', 'Reaping'],
      desc: 'A crescent of mother-of-pearl grows from it: thrown, it wheels like a cutting disc through all it passes.' },
    { id: 'serrate', ax: 'form', tag: 'edge', name: 'Cockle Lip', part: 'serrate', adj: ['Notched', 'Biting'],
      desc: 'Its rim is notched like a cockle\'s lip: every cut it makes bites twice, a heartbeat apart.' },
    { id: 'moon', ax: 'form', tag: 'orb', name: 'The Drowned Moon', part: 'ring', adj: ['Moonlit', 'Drowned'],
      desc: 'It swells into a ringed moon: thrown, it hits harder, throws foes further and hops on to the next one before it comes home.' },
    { id: 'tether', ax: 'form', tag: 'orb', name: 'Kelp-Gold Tether', part: 'chain', adj: ['Tethered', 'Long-Chained'],
      desc: 'A chain of kelp-gold binds it to your hand: everything it does reaches a third further.' },
    { id: 'coral', ax: 'form', tag: 'shell', name: 'Coral Guard', part: 'coral', adj: ['Coral', 'Warding'],
      desc: 'Red coral grows over it: every six seconds it catches a blow meant for you and answers it.' },
    { id: 'scallop', ax: 'form', tag: 'shell', name: 'Scallop Mirror', part: 'scallop', adj: ['Mirrored', 'Scalloped'],
      desc: 'A fan of shell held before you throws shots back; thrown, it bursts at the far end of its flight and turns every shot in reach.' },
    { id: 'narwhal', ax: 'form', tag: 'spire', name: 'Narwhal Spire', part: 'horn', adj: ['Spiralled', 'Piercing'],
      desc: 'A long spiralled horn: it flies out straight as a lance, far, and straight back.' },
    { id: 'tines', ax: 'form', tag: 'spire', name: 'Trident Tines', part: 'tines', adj: ['Three-Tined', 'Forked'],
      desc: 'Two more tines branch from it: it is thrown as three, fanned down the street, and all three come back.' },
    // ---- CURRENT ----
    { id: 'undertow', ax: 'current', tag: 'tide', name: 'Undertow', part: 'swirl', adj: ['Dragging', 'Ebbing'],
      desc: 'What it strikes, it leaves in a whirlpool that drags the crowd in and grinds at them.' },
    { id: 'breaker', ax: 'current', tag: 'tide', name: 'Breaker', part: 'foam', adj: ['Breaking', 'Foaming'],
      desc: 'Its blows shove like surf; a heavy one runs a breaking wave on down the street.' },
    { id: 'shardfall', ax: 'current', tag: 'nacre', name: 'Shardfall', part: 'shards', adj: ['Splintered', 'Nacreous'],
      desc: 'Each hit throws splinters of nacre at the two foes nearest the one struck.' },
    { id: 'weeping', ax: 'current', tag: 'nacre', name: 'Weeping Nacre', part: 'drops', adj: ['Weeping', 'Rose-Bled'],
      desc: 'Its cuts weep: whatever it strikes bleeds for a few seconds after.' },
    { id: 'static', ax: 'current', tag: 'storm', name: 'Static Pearl', part: 'static', adj: ['Singing', 'Crackling'],
      desc: 'Lightning leaps from every hit to two more foes.' },
    { id: 'squall', ax: 'current', tag: 'storm', name: 'Eye of the Squall', part: 'cloud', adj: ['Thundering', 'Squalling'],
      desc: 'Every fourth hit calls a bolt down out of the sky onto the one struck.' },
    { id: 'blacktide', ax: 'current', tag: 'abyss', name: 'Black Tide', part: 'halo', adj: ['Black', 'Fathomless'],
      desc: 'Its blows drag the foes near them in toward the one struck.' },
    { id: 'drowning', ax: 'current', tag: 'abyss', name: 'The Drowning Deep', part: 'core', adj: ['Drinking', 'Drowning'],
      desc: 'It drinks: every hit gives you back a little health.' },
    // ---- TEMPER ----
    { id: 'quickwater', ax: 'temper', tag: 'quick', name: 'Quickwater', part: 'ribbons', adj: ['Darting', 'Quicksilver'],
      desc: 'A short, quick throw, lighter, back in a blink; the weapon it becomes strikes quicker.' },
    { id: 'riptide', ax: 'temper', tag: 'quick', name: 'Riptide Reflex', part: 'fin', adj: ['Riptide', 'Restless'],
      desc: 'Out of every dodge it throws itself, for nothing.' },
    { id: 'deep', ax: 'temper', tag: 'heavy', name: 'Deep Weight', part: 'cage', adj: ['Sunken', 'Leaden'],
      desc: 'A long, slow, heavy throw that hits a third again as hard and throws what it strikes.' },
    { id: 'anchor', ax: 'temper', tag: 'heavy', name: 'Sunken Anchor', part: 'anchor', adj: ['Anchored', 'Fathom-Heavy'],
      desc: 'It lands like a dropped anchor: a shockwave where it strikes.' },
    { id: 'moonstruck', ax: 'temper', tag: 'wild', name: 'Moonstruck', part: 'charm', adj: ['Moonstruck', 'Wayward'],
      desc: 'Its flight wavers wildly, it hops on to one more foe, and now and then two or three are thrown at once.' },
    { id: 'rogue', ax: 'temper', tag: 'wild', name: 'Rogue Wave', part: 'wave', adj: ['Rogue', 'Wild'],
      desc: 'Any hit may wake a Current you have not chosen.' },
    { id: 'still', ax: 'temper', tag: 'patient', name: 'Still Water', part: 'stillring', adj: ['Still', 'Waiting'],
      desc: 'Hold Light + Heavy to wind it up; let go in the gleam for a perfect throw: further, harder, a sure critical.' },
    { id: 'slack', ax: 'temper', tag: 'patient', name: 'Slack Tide', part: 'dial', adj: ['Slack-Water', 'Patient'],
      desc: 'Every perfect release of a charged Heavy throws the Pearl as well, for nothing.' },
    // ---- COMBINED (offered only once both tags are held) ----
    { id: 'thunder', ax: 'form', req: ['edge', 'storm'], name: 'Thunder Lamella', part: 'thunder', adj: ['Thunder-Edged', 'Storm-Struck'],
      desc: 'Its edges are struck with lightning: every cut chains a bolt, and it flies faster.' },
    { id: 'maelstrom', ax: 'form', req: ['orb', 'tide'], name: 'Maelstrom Moon', part: 'maelstrom', adj: ['Maelstrom', 'Whirling'],
      desc: 'Thrown, it drags whirlpools along behind it all the way out and back.' },
    { id: 'corallance', ax: 'current', req: ['spire', 'nacre'], name: 'Coral Lance', part: 'corallance', adj: ['Coral-Tipped', 'Branching'],
      desc: 'At the far end of its flight it bursts into a spray of nacre shards.' },
    { id: 'heldthunder', ax: 'temper', req: ['patient', 'storm'], name: 'Held Thunder', part: 'bolt', adj: ['Gathered', 'Thunder-Held'],
      desc: 'A perfect throw brings lightning down on every foe in front of you.' },
  ];
  const TR = {}; for (const t of TRAITS) { t.tags = {}; if (t.tag) t.tags[t.tag] = 1; if (t.req) for (const g of t.req) t.tags[g] = 1; TR[t.id] = t; }
  const CUR_IDS = ['undertow', 'breaker', 'shardfall', 'weeping', 'static', 'squall', 'blacktide', 'drowning'];
  const PICKS = 5; // after the first five worlds' bosses

  // the tags held, each axis's tags strongest first (a tie goes to the one picked first)
  function prof(picks) {
    const sc = {}, first = {}, has = new Set(picks.filter(id => TR[id]));
    picks.forEach((id, i) => { const T = TR[id]; if (!T) return; for (const g in T.tags) { sc[g] = (sc[g] || 0) + T.tags[g]; if (first[g] === undefined) first[g] = i; } });
    const top = (ax) => AX[ax].filter(g => sc[g] > 0).sort((a, b) => sc[b] - sc[a] || first[a] - first[b]);
    return { sc, first, has, form: top('form'), current: top('current'), temper: top('temper'), n: has.size };
  }
  // the three on a card: one for each axis. A combined trait whose two tags are held comes up often; otherwise about
  // 60% lean to the axis's strongest tag, the rest open a new direction. Seeded per save and per pick, so it is fixed
  function offers(picks, seed) {
    const r = mulberry(((seed | 0) ^ Math.imul(picks.length + 1, 0x9E3779B1)) >>> 0), pr = prof(picks), out = [];
    const free = (t) => !pr.has.has(t.id) && !out.includes(t) && (!t.req || t.req.every(g => pr.sc[g] > 0));
    const one = (arr) => arr[Math.floor(r() * arr.length)];
    for (const ax of ['form', 'current', 'temper']) {
      const pool = TRAITS.filter(t => t.ax === ax && free(t)), combos = pool.filter(t => t.req), plain = pool.filter(t => !t.req);
      let c = combos.length && r() < .8 ? one(combos) : null;
      if (!c) {
        const top = pr[ax][0], mine = plain.filter(t => t.tag === top), other = plain.filter(t => t.tag !== top);
        const lean = top && mine.length && (r() < .6 || !other.length);
        c = lean ? one(mine) : other.length ? one(other) : mine.length ? one(mine) : null;
      }
      if (!c) { const any = TRAITS.filter(free); if (any.length) c = one(any); }
      if (c) out.push(c);
    }
    return out;
  }

  // ---------------- the save: never reset by a death, a retry or a new cycle ----------------
  function ES() {
    let s = save.pearlEvo;
    if (!s || typeof s !== 'object') s = save.pearlEvo = { seed: (Math.random() * 2147483647) | 0, picks: [], got: {} };
    if (!Array.isArray(s.picks)) s.picks = [];
    if (s.picks.some(id => !TR[id])) s.picks = s.picks.filter(id => TR[id]);
    if (!s.got || typeof s.got !== 'object') s.got = {};
    if (!Number.isFinite(s.seed)) s.seed = 1;
    return s;
  }
  const picksNow = () => (held() ? (save.pearlForge.picks || []) : evoOn() ? ES().picks : []);
  const pickKey = () => (save.cycle | 0) + ':' + stageIdx;

  // ======================================================================================================
  // THE SHOT: what Light + Heavy fires, from the picks
  // ======================================================================================================
  const KIND = { edge: 'disc', orb: 'orb', shell: 'burst', spire: 'lance' };
  const PAL = {
    pearl: { b: ['#FFFFFF', '#F4FBF7', '#D0EDE3', '#8CC6B9', '#4C8A84'], metal: '#D6AE58', metalLt: '#F2D68A', glow: '190,245,235', haft: '#2E5E5C', blade: '#DDF2EA', bladeDk: '#7CC4B4', edge: '#FFFFFF', accent: '#F6C2D4', trail: 'rgba(200,245,235,.95)' },
    tide: { b: ['#FFFFFF', '#E2FAF3', '#9FE2D3', '#3FA39C', '#195560'], metal: '#D6AE58', metalLt: '#F2D68A', glow: '120,230,210', haft: '#1A4650', blade: '#C6F0E5', bladeDk: '#3A948F', edge: '#F2FFFC', accent: '#7FD8C8', trail: 'rgba(126,216,200,.95)' },
    nacre: { b: ['#FFFFFF', '#FFF3F6', '#F5D3DD', '#D49EB0', '#8A5468'], metal: '#E4C27A', metalLt: '#FFF0C0', glow: '255,205,222', haft: '#5A2C3A', blade: '#FCEEF2', bladeDk: '#C68CA2', edge: '#FFFFFF', accent: '#F6C2D4', trail: 'rgba(250,206,222,.95)' },
    storm: { b: ['#FFFFFF', '#EEF1FF', '#C2CAFF', '#7A84DE', '#2E3384'], metal: '#E2D48A', metalLt: '#FFF6C8', glow: '178,190,255', haft: '#22244A', blade: '#DAE0FF', bladeDk: '#6670CC', edge: '#FFFFFF', accent: '#FFF09A', trail: 'rgba(200,206,255,.95)' },
    abyss: { b: ['#A8FFEA', '#5E6898', '#393266', '#211A3E', '#0B0916'], metal: '#9A8CD8', metalLt: '#D6CEFF', glow: '110,224,192', haft: '#15121E', blade: '#57508A', bladeDk: '#1E1A38', edge: '#86F2D6', accent: '#6FE0C0', trail: 'rgba(110,224,192,.95)' },
  };
  const SHOTNAME = { pearl: 'Pearl Shot', disc: 'Nacre Disc', orb: 'Pearl Moon', burst: 'Shell Burst', lance: 'Pearl Lance' };
  const CURWORD = { tide: 'Tidal', nacre: 'Nacre', storm: 'Storm', abyss: 'Abyssal' };
  // THE THROW'S WEIGHT. Each leg (out, and back) is meant to land about like one of his charged heavies at this point of
  // the road: a charged heavy is about REF times the weapon's tempering (wMult), so the throw is REF times the best tempering
  // among his weapons (fists in hand do not make it weak), grown with the choices from 58% (a bare speck) to 100% (five),
  // 115% once reforged, and shaped by the Temper. Bosses take half, as they shrug off arrows.
  const REF = 16; // (toned down from 53: no foe is felled by one throw, out and back, even full grown; it wears them down)
  const wBest = () => { let m = 1; if (typeof wMult === 'function' && save && save.owned) for (const id in save.owned) if (save.owned[id] && id !== 'fists' && save.wl[id]) m = Math.max(m, wMult(id)); return m; };
  const legDmg = (S, mul = 1) => REF * wBest() * S.dmgK * mul;
  function stats(picks, wpn) {
    const pr = prof(picks), f = pr.has, sc = pr.sc, n = Math.min(PICKS, picks.length);
    const form = pr.form[0] || null, tmp = pr.temper[0] || null, cur = pr.current[0] || null;
    const S = { picks: picks.slice(), pr, f, n, wpn: !!wpn, form, cur, cur2: pr.current[1] || null, tmp, kind: form ? KIND[form] : 'pearl',
      size: 1 + .05 * n, range: 1 + (f.has('tether') ? .33 : 0), tines: f.has('tines') ? 3 : 1, rehit: f.has('serrate') ? .12 : 0, power: 1, kb: 1,
      charge: tmp === 'patient', extraP: 0, edgeN: sc.edge || 0, shellN: sc.shell || 0, pal: PAL[cur || 'pearl'] };
    S.dmgK = wpn ? 1.15 : .58 + .084 * n;
    if (f.has('moon')) { S.size *= 1.3; S.kb *= 1.4; }
    if (f.has('narwhal')) S.range *= 1.4;
    if (f.has('breaker')) S.kb *= 1.5;
    // the Temper on top sets the throw: its reach, its speed, the beat before it can go again, its weight
    let D = 230, tO = .38, beat = .3;
    if (tmp === 'quick') { D = 170; tO = .26; beat = .15; S.dmgK *= .7; }
    else if (tmp === 'heavy') { D = 300; tO = .55; beat = .45; S.dmgK *= 1.3; S.size *= 1.3; S.power = 2; S.kb *= 1.3; }
    else if (tmp === 'wild') { S.dmgK *= .95; S.extraP = .3; }
    if (f.has('quickwater') && tmp !== 'quick') { beat *= .8; tO *= .9; }
    if (f.has('deep') && tmp !== 'heavy') { S.dmgK *= 1.1; S.power = 2; }
    if (f.has('moonstruck')) S.extraP = Math.max(S.extraP, .35);
    if (f.has('still') && tmp !== 'patient') S.charge = true;
    if (f.has('thunder')) tO *= .85;
    S.straight = form === 'spire'; S.burst = form === 'shell';
    S.dist = D * (1 + .04 * n) * S.range * (S.straight ? 1.15 : 1); S.tOut = tO * (S.straight ? .8 : 1); S.tBack = S.tOut * 1.05; S.beat = beat; S.cd = beat;
    S.arcY = S.straight ? 0 : S.burst ? 34 : 22; S.arcZ = S.straight ? 3 : 20; S.spin = (9 + 1.6 * n) * (form === 'edge' ? 1.8 : 1);
    S.bounces = (form === 'orb' ? 1 + (f.has('moon') ? 1 : 0) : 0) + (tmp === 'wild' ? 1 : 0); S.erratic = tmp === 'wild';
    S.name = (cur ? CURWORD[cur] + ' ' : '') + { pearl: 'Pearl Throw', disc: 'Disc Throw', orb: 'Moon Throw', burst: 'Shell Throw', lance: 'Lance Throw' }[S.kind];
    return S;
  }
  let statKey = '', statVal = null;
  function curStats() {
    const ph = held() ? 'w' : evoOn() ? 'e' : '';
    if (!ph) return null;
    const pk = picksNow(), key = ph + pk.join(',');
    if (key !== statKey) { statKey = key; statVal = stats(pk, ph === 'w'); }
    return statVal;
  }

  // ---------------- the state of the orb, its shots and the water they leave ----------------
  const O = { a: 0, x: 0, y: 0, z: 0, r: 3, on: false, pop: 0, flash: 0, cd: 0, chg: null, gleamed: false, lastL: -1e9, lastH: -1e9,
    shots: [], throws: [], pools: [], rise: null, parryCd: 0, reflCd: 0, ripCd: 0, squall: 0, stage: null, zone: -1 };
  const CUR = { vx: 0, vy: 0, trail: [], clock: 0, cd: new WeakMap(), wasRun: false, glide: false, lay: 0, layA: 0, bounceT: 0 };
  function resetPlace() {
    O.shots = []; O.throws = []; O.pools = []; O.chg = null; O.flash = 0; O.rise = null;
    CUR.vx = CUR.vy = 0; CUR.trail = []; CUR.cd = new WeakMap(); CUR.wasRun = false;
    if (P) { O.x = P.x - P.facing * 21; O.y = P.y; O.z = P.z + 66; }
  }
  const cool = (map, e, t) => { const n = CUR.clock; if ((map.get(e) || -1e9) > n) return false; map.set(e, n + t); return true; };
  function nick(e, d, dir, push) { // a light, frequent grind: a white number and a flinch, never a critical, no hit freeze
    if (e.dead || d <= 0) return;
    e.hp -= d; e.flash = .06; floatText(e.x, e.y, e.z + e.hh + 8, String(d), '#FFFFFF', 12);
    if (!e.boss && push && !e.air) e.x += dir * push;
    if (e.hp <= 0) killEnemy(e, dir, { el: 1, kb: 160, pearl: 1 });
  }
  function touches(e, x, y, z, r) {
    const down = (e.def && e.def.reachDown) || 0;
    return Math.abs(e.x - x) < e.hw + r && Math.abs(e.y - y) < 12 + r * .5 + e.hw * .3 && zOverlap(z - r, r * 2, e.z - down, e.hh + down);
  }
  const near = (x, y, range, not) => foes().filter(o => o !== not && Math.hypot(o.x - x, (o.y - y) * 1.6) < range).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  function sparkle(x, y, z, n, cols) { for (let i = 0; i < n && parts.length < 420; i++) { const a = rand(0, TAU), v = rand(40, 140);
    parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .3, vz: rand(20, 120), life: .35, max: .35, col: pick(cols || ['#FFFFFF', '#D8F4EC', '#F2D68A']), size: rand(1.2, 2.2), shape: 'star', rot: 0, vr: 6 }); } }
  const palCols = (S) => [S.pal.edge, S.pal.b[2], S.pal.metalLt];

  // ---------------- the throw: the orb itself, from where it floats, out and back like a boomerang ----------------
  const anchor = () => held() ? { x: P.x + P.facing * ((WEAPONS[WID] && WEAPONS[WID].reach) || 50) * .6, y: P.y, z: P.z + 40 } : { x: P.x - P.facing * 21, y: P.y, z: P.z + 66 };
  // the foe it seeks: the nearest live one in front of him (on his facing side, a small margin at his own x) within reach,
  // his lane favoured; never one behind him (with none in front it flies straight out ahead). skip: foes another orb of the
  // same throw is already after (taken only if there is no other). from: where the search is measured from (a hop's orb)
  const ahead = (e) => (e.x - P.x) * P.facing > -12;
  function pickTarget(x, y, reach, skip) {
    let best = null, bs = 1e9;
    for (const pass of [0, 1]) {
      for (const e of foes()) {
        if ((skip && pass === 0 && skip.has(e)) || !ahead(e)) continue;
        const dd = Math.hypot(e.x - x, (e.y - y) * 1.6);
        if (dd > reach * 1.15 || e.x < camX - 10 || e.x > camX + VW + 10) continue;
        const sc = Math.abs(e.x - x) + Math.abs(e.y - y) * 2.2;
        if (sc < bs) { bs = sc; best = e; }
      }
      if (best || !skip) break;
    }
    return best;
  }
  function fire(S, o = {}) {
    if (!P || !S || O.throws.length) return false;
    const dir = P.facing, a = anchor(), x0 = O.on ? O.x : a.x, z0 = O.on ? O.z : a.z, perfect = !!o.perfect, far = perfect ? 1.3 : 1;
    const extra = S.extraP && Math.random() < S.extraP ? (Math.random() < .4 ? 2 : 1) : 0, lanes = S.tines === 3 ? [0, -18, 18] : [0];
    for (let i = 0; i < extra; i++) lanes.push((i % 2 ? 1 : -1) * (lanes.length > 1 ? 30 : 16));
    const taken = new Set();
    lanes.forEach((lane, i) => {
      const main = i === 0 || S.tines === 3 && i < 3, wob = S.erratic ? rand(-1, 1) : 0;
      const tg = pickTarget(P.x, P.y + lane * .5, S.dist * far * (main ? 1 : .8), taken); if (tg) taken.add(tg);
      O.throws.push({ S, k: 'throw', x: x0, y: P.y, z: z0, x0, y0: P.y, z0, dir, lane, ghost: !main, phase: 'out', u: 0, t: 0, dist: S.dist * far * (main ? 1 : .8), yOff: S.arcY * (S.erratic ? (1 + wob) : 1) * (i % 2 ? -1 : 1), wob,
        hitOut: new Set(), hitBack: new Set(), hit: new Map(), dmg: legDmg(S, (o.mul || 1) * (main ? 1 : .6)), perfect, r: (5 + .7 * S.n) * S.size * (main ? 1 : .7), spin: 0, bounces: S.bounces, pools: 0, trail: [],
        seek: tg, ex: x0 + dir * S.dist * far * (main ? 1 : .8), ey: P.y + lane, ez: P.z + 26, sw: O.on && O.sw ? swCopy(O.sw) : swNew() });
    });
    O.flash = .3; O.pop = 0;
    sfx('whoosh'); if (S.power >= 2) sfx('swing'); sfx('hit-crystal', .25);
    if (extra) floatText(P.x, P.y, P.z + 88, 'MOONSTRUCK', '#F2D68A', 11);
    sparkle(x0, P.y, z0, 6, palCols(S));
    return true;
  }
  function burstAt(S, x, y, R) { // the shell, at the far end of its flight: a ring that turns shots back and throws the crowd off
    O.shots.push({ S, k: 'burst', x, y, z: 30, R: R * (1 + .06 * S.n), max: .34, t: 0, d: 0, hit: new Map(), dmg: 0, spin: 0, pools: 0 });
  }
  // where it is caught: in front of him (the evolving orb then drifts back to his shoulder; the weapon's is its head)
  const catchAt = () => held() ? anchor() : { x: P.x + P.facing * 12, y: P.y, z: P.z + 54 };
  function caught(th) {
    th.dead = true; if (th.ghost) return;
    const a = catchAt(); O.cd = th.S.beat; O.pop = 1; O.flash = .25; O.x = a.x; O.y = a.y; O.z = a.z;
    if (th.sw) O.sw = th.sw; // (its hangers still swinging as it comes back to his shoulder)
    fx.push({ kind: 'ring', x: a.x, y: a.y, z: a.z, t: .18, max: .18, r: 10 + th.r, col: '#FFFFFF' }); sfx('hit-crystal', .5);
  }
  function stepThrow(th, dt) {
    const S = th.S; th.t += dt; th.spin += dt * S.spin;
    if (th.phase === 'out') {
      th.u = Math.min(1, th.u + dt / S.tOut); const u = th.u, e = 1 - (1 - u) * (1 - u), s = Math.sin(Math.PI * u), w = S.erratic ? Math.sin(th.t * 23 + th.wob * 9) * 9 * s : 0;
      // with a foe to seek, the end of the leg is drawn in toward it (a little past it, so it goes through), eased so the
      // flight bends in on a curve rather than snapping; with none, it flies straight out its full reach
      const tg = th.seek && !th.seek.dead && enemies.includes(th.seek) ? th.seek : null;
      if (tg) { const q = Math.min(1, dt * 7), over = Math.min(34, tg.hw + 14), tx = tg.x + Math.sign(tg.x - th.x0 || th.dir) * over;
        th.ex += (tx - th.ex) * q; th.ey += (tg.y - th.ey) * q; th.ez += (tg.z + Math.min(30, tg.hh * .5) - th.ez) * q; }
      th.x = lerp(th.x0, th.ex, e); th.y = clamp(lerp(th.y0, th.ey, e) + th.yOff * s * (tg ? .6 : 1) + (tg ? 0 : th.lane * Math.min(1, u * 2) - th.lane * e) + w, FLOOR_TOP + 6, FLOOR_BOT);
      th.z = lerp(th.z0, th.ez, Math.min(1, u * 2.2)) + S.arcZ * s + (S.erratic ? Math.cos(th.t * 17) * 6 * s : 0);
      if (u >= 1) {
        if (S.burst && !th.ghost) burstAt(S, th.x, th.y, 64 + 14 * S.shellN + (S.f.has('scallop') ? 18 : 0));
        if (S.f.has('corallance') && !th.ghost) { for (const e of near(th.x, th.y, 150).slice(0, 5)) shard(th, e, Math.max(1, th.dmg * .3), S); sparkle(th.x, th.y, th.z, 12, ['#E86A5A', '#FFFFFF', '#F6C2D4']); }
        th.phase = 'hop'; th.u = 0;
      }
    }
    if (th.phase === 'hop') { // an orb (or a wild one) hops on to the next foe before it turns home
      if (!th.tgt) { th.hopTo = th.bounces > 0 && !th.ghost ? pickTarget(th.x, th.y, 170, th.hitOut) : null; if (th.hopTo && th.hitOut.has(th.hopTo)) th.hopTo = null; if (th.hopTo) { th.tgt = th.hopTo; th.bounces--; th.hx = th.x; th.hy = th.y; th.hz = th.z; th.u = 0; } else { th.phase = 'back'; th.u = 0; th.bx = th.x; th.by = th.y; th.bz = th.z; } }
      if (th.tgt) { const e = th.tgt; th.u = Math.min(1, th.u + dt / .16); th.x = lerp(th.hx, e.x, th.u); th.y = lerp(th.hy, e.y, th.u); th.z = lerp(th.hz, e.z + Math.min(30, e.hh * .5), th.u) + 14 * Math.sin(Math.PI * th.u); if (th.u >= 1 || e.dead) th.tgt = null; }
    }
    if (th.phase === 'back') {
      th.u = Math.min(1, th.u + dt / S.tBack); const u = th.u, k = u * u, s = Math.sin(Math.PI * u), a = catchAt();
      th.x = lerp(th.bx, a.x, k); th.y = lerp(th.by, a.y, k) - th.yOff * .7 * s; th.z = lerp(th.bz, a.z, k) + S.arcZ * .5 * s;
      if (u >= 1 || th.t > 4) { caught(th); return; }
    }
    if (th.t > 5) { caught(th); return; }
    th.trail.push(th.x, th.y - th.z); if (th.trail.length > 16) th.trail.splice(0, 2);
    // its hangers flung out behind its flight (trailed further than at his shoulder), wobbling a little with the spin
    if (th.sw) swStep(th.sw, th.x, th.y - th.z, dt, { drag: .0006, gain: .45, push: .07 * Math.sin(th.spin * .35) });
    if (S.f.has('maelstrom') && th.pools < 4 && !th.ghost && th.t - (th.lastPool || 0) > .16) { th.lastPool = th.t; th.pools++; addPool(th.x, th.y, th.dmg, S); }
    if (Math.random() < dt * 24 && parts.length < 380) parts.push({ x: th.x, y: th.y, z: th.z + rand(-3, 3), vx: rand(-20, 20), vy: 0, vz: rand(-10, 20), life: .3, max: .3, col: pick(palCols(S)), size: rand(1.2, 2.2), shape: 'star', rot: 0, vr: 4 });
    // it strikes all it passes through: each foe once on the way out and once on the way back
    const back = th.phase === 'back', set = back ? th.hitBack : th.hitOut, reach = th.r + 5;
    for (const e of foes()) {
      if (set.has(e) || (!back && !ahead(e)) || !touches(e, th.x, th.y, th.z, reach)) continue;
      set.add(e); const dir = back ? -th.dir : th.dir;
      hitFoe(th, e, dir, 1, S.form === 'orb' ? { kb: 260 * S.kb, launch: 120, wall: 1 } : S.straight ? { kb: 220 * S.kb, wall: 1 } : { kb: 190 * S.kb });
      if (S.rehit) echoes.push({ e, dmg: Math.max(1, Math.round(th.dmg * .4 * (e.boss ? .5 : 1))), dir, m: { dmg: 1, kb: 40, power: 0, el: 1, pearl: 1 }, t: S.rehit });
      sparkle(e.x, e.y, e.z + e.hh * .5, 6, palCols(S));
    }
  }
  function throwsStep(dt) {
    for (const th of O.throws) { try { stepThrow(th, dt); } catch (err) { th.dead = true; console.error(err); } }
    O.throws = O.throws.filter(th => !th.dead);
  }
  function shard(from, e, dmg, S) { // a splinter of nacre, thrown at one foe
    if (O.shots.length > 34) return;
    O.shots.push({ S, k: 'shard', x: from.x, y: from.y, z: (from.z || 0) + 26, tgt: e, dmg, t: 0, d: 0, hit: new Map(), r: 2.6, v: 430, max: 260, dir: Math.sign(e.x - from.x) || 1, spin: rand(0, 6) });
  }
  // a foe struck by the Pearl: a real blow (it can crit), then what the Current does
  function hitFoe(s, e, dir, mul = 1, extra) {
    const S = s.S, d = Math.max(1, Math.round(s.dmg * mul * (e.boss ? (s.k === 'throw' ? .5 : .6) : 1))), hp0 = e.hp;
    strike(e, d, dir, Object.assign({ dmg: d, el: 1, pearl: 1, pform: S.form || 'speck', pcur: S.cur || null, kb: 170 * S.kb, power: s.k === 'shard' ? 0 : S.power, perfect: s.perfect ? 1 : 0, launch: 0, wall: S.power >= 2 ? 1 : 0 }, extra), true);
    if (e.hp < hp0 || e.dead) { procs(s, e, d, dir); return true; }
    return false;
  }
  // ---------------- the Currents, on a hit ----------------
  const PROC = {
    undertow(s, e, d) { if (s.pools < (s.k === 'burst' ? 2 : 1)) { s.pools++; addPool(e.x, e.y, d, s.S); } },
    breaker(s, e, d, dir) {
      if (!e.dead && !e.boss) e.vx = (e.vx || 0) + dir * 140;
      if (!s.waved && (s.S.power >= 2 || s.perfect || s.big)) { s.waved = 1; projs.push({ owner: 'p', x: e.x, y: e.y, z: 0, vx: dir * 300, dmg: Math.max(1, Math.round(d * .5)), life: .7, hit: new Set([e]), wave: 1, quake: true }); }
    },
    shardfall(s, e, d) { for (const o of near(e.x, e.y, 170, e).slice(0, 2)) shard(e, o, Math.max(1, d * .35), s.S); },
    weeping(s, e, d) { if (e.dead) return; e.bleedPer = Math.max(e.bleed > 0 ? e.bleedPer || 0 : 0, Math.max(1, d * .09)); e.bleed = 2.4; e.bleedTick = e.bleedTick > 0 ? e.bleedTick : .4; },
    static(s, e, d, dir) {
      const cz = e.z + e.hh * .5;
      for (const o of near(e.x, e.y, 140, e).slice(0, 2)) {
        fx.push({ kind: 'bolt', x: e.x, y: e.y, z: cz, x2: o.x, y2: o.y, z2: o.z + o.hh * .5, t: .2, max: .2, col: '#C8D0FF', seed: Math.random() * 99 });
        const q = Math.max(1, Math.round(d * .4)); strike(o, q, Math.sign(o.x - e.x) || dir, { dmg: q, kb: 60, power: 0, el: 1, pearl: 1 }, true);
      }
      if (Math.random() < .5) sfx('shoot');
    },
    squall(s, e, d, dir) {
      O.squall++; if (O.squall % 4 || e.dead) return;
      fx.push({ kind: 'bolt', x: e.x + rand(-20, 20), y: e.y, z: e.z + 260, x2: e.x, y2: e.y, z2: e.z + e.hh * .5, t: .28, max: .28, col: '#E8ECFF', seed: Math.random() * 99 });
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .3, max: .3, r: 40, col: '#C8D0FF', flat: 1 });
      const q = Math.max(1, Math.round(d * .8)); strike(e, q, dir, { dmg: q, kb: 90, launch: 200, power: 2, el: 1, pearl: 1 }, true); sfx('shoot'); flashT = Math.max(flashT, .04);
    },
    blacktide(s, e) {
      if (s.pulled) return; s.pulled = 1;
      for (const o of near(e.x, e.y, 120, e)) if (!o.boss) { o.x += (e.x - o.x) * .45; o.y += (e.y - o.y) * .45; }
      for (let i = 0; i < 8 && parts.length < 420; i++) { const a = rand(0, TAU); parts.push({ x: e.x + Math.cos(a) * 40, y: e.y + Math.sin(a) * 12, z: rand(4, 40), vx: -Math.cos(a) * 120, vy: -Math.sin(a) * 30, vz: 0, life: .35, max: .35, col: pick(['rgba(40,28,80,.85)', 'rgba(110,224,192,.8)']), size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 }); }
    },
    drowning(s, e, d) { if (P.hp > 0) P.hp = Math.min(maxHp(), P.hp + Math.min(6, 1 + d * .04)); },
  };
  function procs(s, e, d, dir) {
    const S = s.S, f = S.f;
    if (s.k === 'shard') return; // (splinters carry no Current of their own: no chains of chains)
    for (const id of CUR_IDS) if (f.has(id)) PROC[id](s, e, d, dir);
    if (f.has('rogue') && Math.random() < .25) { const pool = CUR_IDS.filter(id => !f.has(id)); if (pool.length) PROC[pick(pool)](s, e, d * .8, dir); }
    if (f.has('thunder') && !f.has('static') && (S.form === 'edge' || s.k === 'wpn')) PROC.static(s, e, d * .7, dir);
    if (f.has('anchor') && !s.shocked && s.k !== 'burst') { s.shocked = 1; anchorShock(e.x, e.y, d, dir, e); }
  }
  function anchorShock(x, y, d, dir, not) {
    fx.push({ kind: 'ring', x, y, z: 2, t: .35, max: .35, r: 70, col: '#F2D68A', flat: 1 }); shakeMag = Math.max(shakeMag, 4); sfx('slam', .4);
    for (const o of foes()) if (o !== not && Math.hypot(o.x - x, (o.y - y) * 2) < 64 + o.hw && o.z < 50) { const q = Math.max(1, Math.round(d * .5 * (o.boss ? .6 : 1))); strike(o, q, Math.sign(o.x - x) || dir, { dmg: q, kb: 160, launch: 220, power: 1, el: 1, pearl: 1 }, true); }
  }
  function addPool(x, y, d, S) {
    O.pools.push({ x, y, t: 0, max: 1.7, r: 46 * Math.sqrt(S.size), tick: .15, d: Math.max(1, Math.round(d * .16)), pal: S.pal });
    if (O.pools.length > 4) O.pools.shift(); sfx('hit-goo', .4); bub(x, y, 8, 6, 50);
  }
  function poolsStep(dt) {
    for (const p of O.pools) { p.t += dt; p.tick -= dt;
      for (const e of foes()) { if (e.boss) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy * 2); if (d < p.r * 1.9 && d > 6) { e.x += dx / d * 110 * dt; e.y += Math.sign(dy) * Math.min(Math.abs(dy), 40 * dt); } }
      if (p.tick <= 0) { p.tick = .3; for (const e of foes()) if (Math.hypot(e.x - p.x, (e.y - p.y) * 2) < p.r + e.hw && e.z < 40) nick(e, e.boss ? Math.max(1, Math.round(p.d * .6)) : p.d, Math.sign(e.x - p.x) || 1); }
      if (Math.random() < dt * 14) bub(p.x + rand(-p.r, p.r) * .6, p.y, 4, 1, 20); }
    O.pools = O.pools.filter(p => p.t < p.max);
  }
  // a shot thrown back off the shell (or caught in its burst)
  function turnShot(p, S, big) {
    if (p.big && !big) { p.life = 0; sparkle(p.x, p.y, p.z || 30, 10); sfx('hit-crystal'); return true; }
    p.owner = 'p'; p.vx = P.facing * Math.max(280, Math.abs(p.vx || 0) * 1.3); p.vy = 0; p.vz = 0; p.hit = new Set(); p.dmg = Math.round((p.dmg || 10) * (1.5 + .25 * (S ? S.n : 2))); p.life = 1.6; p.reflected = true; p.col = '#BFF0E4';
    sfx('hit-crystal'); fx.push({ kind: 'ring', x: p.x, y: p.y, z: p.z || 30, t: .25, max: .25, r: 18, col: '#BFF0E4' });
    return true;
  }
  // ---------------- each shot, stepped ----------------
  function shotsStep(dt) {
    for (const s of O.shots) { s.t += dt; s.spin += dt * 16; try { stepShot(s, dt); } catch (err) { s.dead = true; console.error(err); } }
    O.shots = O.shots.filter(s => !s.dead);
  }
  function endShot(s) {
    s.dead = true; const S = s.S;
    if (s.k === 'lance' && S.f.has('corallance')) { for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .5, fake = { x: s.x + Math.cos(a) * 60 * s.dir, y: s.y + Math.sin(a) * 12, z: 0, hw: 1, hh: 1 };
        const tg = near(fake.x, fake.y, 140)[0]; if (tg) shard(s, tg, Math.max(1, s.dmg * .3), S); }
      sparkle(s.x, s.y, s.z, 12, ['#E86A5A', '#FFFFFF', '#F6C2D4']); sfx('hit-crystal'); }
    else if (s.k !== 'shard') sparkle(s.x, s.y, s.z, 5, palCols(S));
  }
  function stepShot(s, dt) {
    const S = s.S;
    if (s.k === 'burst') {
      const R = s.R * sm(s.t / (s.max * .7));
      for (const e of foes()) if (!s.hit.has(e) && Math.hypot(e.x - s.x, (e.y - s.y) * 2) < R + e.hw && e.z < 100) { s.hit.set(e, s.t); const d = legDmg(S, .6);
        const hp0 = e.hp, q = Math.max(1, Math.round(d * (e.boss ? .5 : 1))); strike(e, q, Math.sign(e.x - s.x) || P.facing, { dmg: q, kb: 300 * S.kb, power: Math.max(1, S.power), el: 1, pearl: 1 }, true);
        if ((e.hp < hp0 || e.dead) && S.f.has('coral') && !e.dead && !e.boss) { e.state = 'hurt'; e.t = Math.max(e.t, .5); e.plan = null; } }
      for (const p of projs) if (p.owner === 'e' && !p.ground && !p.orbit && Math.hypot(p.x - s.x, (p.y - s.y) * 2) < R + 10) turnShot(p, S, S.f.has('scallop'));
      if (s.t >= s.max) s.dead = true;
      return;
    }
    const e = s.tgt && !s.tgt.dead ? s.tgt : null;
    if (e) { const tx = e.x, ty = e.y, tz = e.z + e.hh * .5, dx = tx - s.x, dy = ty - s.y, dz = tz - s.z, d = Math.hypot(dx, dy, dz) || 1, v = s.v * dt; s.x += dx / d * v; s.y += dy / d * v; s.z += dz / d * v; s.dir = Math.sign(dx) || s.dir; }
    else s.x += s.dir * s.v * dt;
    s.d += s.v * dt; if (s.d > s.max || s.t > 1) { s.dead = true; return; }
    for (const o of foes()) if (!s.hit.has(o) && touches(o, s.x, s.y, s.z, s.r + 4)) { s.hit.set(o, s.t); hitFoe(s, o, Math.sign(o.x - s.x) || s.dir); s.dead = true; return; }
  }

  // ---------------- Light + Heavy together: the shot (the second press within a short beat of the first, either way round) ----------------
  const GLEAM = .55;
  function chargeTimingP(c) {
    if (c < .18) return { mul: .6 };
    if (c < GLEAM) return { mul: .6 + .4 * (c - .18) / (GLEAM - .18) };
    if (c <= GLEAM + PCW()) return { mul: 1.55, perfect: true };
    return { mul: Math.max(.85, 1.15 - (c - GLEAM - PCW()) * .3) }; // (held past the gleam it sours a little)
  }
  function perfectShotFx(S) {
    floatText(P.x, P.y, P.z + 96, 'PERFECT', '#FFE08A', 15); flashT = Math.max(flashT, .06); sfx('crit');
    fx.push({ kind: 'ring', x: P.x, y: P.y, z: P.z + 46, t: .22, max: .22, r: 44, col: '#FFF4D0' });
    if (S.f.has('heldthunder')) { const fx0 = P.x + P.facing * 120;
      for (const e of near(fx0, P.y, 170).slice(0, 6)) { fx.push({ kind: 'bolt', x: e.x + rand(-16, 16), y: e.y, z: e.z + 240, x2: e.x, y2: e.y, z2: e.z + e.hh * .5, t: .3, max: .3, col: '#FFF2C0', seed: Math.random() * 99 });
        const q = Math.max(1, Math.round(legDmg(S, .7) * (e.boss ? .5 : 1))); strike(e, q, Math.sign(e.x - P.x) || P.facing, { dmg: q, kb: 120, launch: 260, power: 2, el: 1, pearl: 1 }, true); }
      sfx('shoot'); shakeMag = Math.max(shakeMag, 6); }
  }
  const BUSY = ['hurt', 'down', 'dead'];
  function lhInput(S, dt) {
    const now = CUR.clock;
    O.cd = Math.max(0, O.cd - dt); O.parryCd = Math.max(0, O.parryCd - dt); O.reflCd = Math.max(0, O.reflCd - dt); O.ripCd = Math.max(0, O.ripCd - dt);
    if (O.chg !== null) { // gathering it (patient): both held
      if (['hurt', 'down', 'dead'].includes(P.state)) { O.chg = null; return; }
      if (input.light && input.heavy) { O.chg += dt;
        if (!O.gleamed && O.chg >= GLEAM) { O.gleamed = true; sfx('charge', 3); sparkle(O.on ? O.x : P.x + P.facing * 20, P.y, O.on ? O.z : P.z + 40, 10, ['#FFFFFF', '#FFF2C0']); }
        if (Math.random() < dt * 20 && parts.length < 400) { const a = rand(0, TAU), x = O.on ? O.x : P.x + P.facing * 22, z = O.on ? O.z : P.z + 40; parts.push({ x: x + Math.cos(a) * 18, y: P.y, z: z + Math.sin(a) * 14, vx: -Math.cos(a) * 60, vy: 0, vz: -Math.sin(a) * 50, life: .3, max: .3, col: pick(palCols(S)), size: rand(1.2, 2), shape: 'star', rot: 0, vr: 4 }); }
        return; }
      const pc = chargeTimingP(O.chg); O.chg = null; O.gleamed = false;
      if (fire(S, pc) && pc.perfect) perfectShotFx(S);
      return;
    }
    // the throw goes on top of whatever he is doing (a blow, a combo, the air, a dodge): nothing he is doing is cancelled
    // and his combo runs on. Only the pair is used up: pressed together both are; pressed one after the other, the first
    // press has already done its own work (a blow, the next link of the combo) and only the second is taken
    if (pressed.light) O.lastL = now; if (pressed.heavy) O.lastH = now;
    if (BUSY.includes(P.state)) return;
    const same = pressed.light && pressed.heavy, lateH = !same && pressed.heavy && input.light && now - O.lastL < .16, lateL = !same && pressed.light && input.heavy && now - O.lastH < .16;
    if (!(same || lateH || lateL) || O.cd > 0 || O.throws.length) return;
    if (same) { pressed.light = pressed.heavy = false; } else if (lateH) pressed.heavy = false; else pressed.light = false;
    P.holdUsed = true;
    const busy = ['atk', 'air', 'charge', 'shoot', 'dodge'].includes(P.state);
    if (S.charge && !busy) { O.chg = 0; O.gleamed = false; sfx('charge', 1); return; } // (the patient wind-up only while he is free; mid-blow it goes at once)
    fire(S, S.charge ? { mul: .85 } : undefined);
  }
  // the free shots: out of a dodge (riptide), and a perfect charged Heavy (slack tide)
  { const _sd = startDodge; startDodge = function () { _sd(); const S = live() && P.state === 'dodge' ? curStats() : null; if (S && S.f.has('riptide') && O.ripCd <= 0) { O.ripCd = 1.1; fire(S, { mul: .7 }); } }; }
  { const _pc = perfectCue; perfectCue = function () { _pc(); const S = live() ? curStats() : null; if (S && S.f.has('slack')) fire(S, { mul: .9 }); }; }

  // ---------------- the orb at his shoulder (while it is still evolving) ----------------
  function orbStep(dt) {
    O.a += dt; O.pop = Math.max(0, O.pop - dt * 3); O.flash = Math.max(0, O.flash - dt);
    const n = ES().picks.length, bob = Math.sin(CUR.clock * 2.6) * 2, front = O.chg !== null;
    const tx = P.x + P.facing * (front ? 20 : -21) + Math.cos(O.a * 1.3) * 4, ty = P.y - 1 + Math.sin(O.a * 1.3) * 2, tz = P.z + (front ? 40 : 66) + bob, q = Math.min(1, dt * 9);
    O.x += (tx - O.x) * q; O.y += (ty - O.y) * q; O.z += (tz - O.z) * q; O.r = 3.6 + 1.05 * n;
    if (!O.sw) O.sw = swNew();
    swStep(O.sw, O.x, O.y - O.z, dt);
  }
  // the coral parries a blow, every few seconds; the scallop turns a shot from in front
  function parry(e, fromX, S) {
    O.parryCd = 6; O.flash = .45; P.inv = Math.max(P.inv, .4);
    const dir = Math.sign((e ? e.x : fromX) - P.x) || P.facing; P.facing = dir;
    floatText(P.x, P.y, P.z + 84, 'PARRIED', '#F0A090', 15); sfx('hit-metal', .6); sfx('hit-crystal'); hitstop = Math.max(hitstop, .08);
    fx.push({ kind: 'ring', x: P.x + dir * 22, y: P.y, z: P.z + 30, t: .3, max: .3, r: 34, col: '#F0A090' }); sparkle(P.x + dir * 22, P.y, P.z + 30, 14, ['#FFFFFF', '#F0A090', '#F2D68A']);
    if (e && !e.dead) { const d = Math.max(1, Math.round((6 + 4 * S.n) * W())); strike(e, d, dir, { dmg: d, kb: 280, power: 1, el: 1, pearl: 1 }, true); if (!e.dead && !e.boss) { e.state = 'hurt'; e.t = Math.max(e.t, .5); e.plan = null; } }
  }
  { const _pd = playerDamage; playerDamage = function (dmg, fromX, big) {
    const S = P && live() ? curStats() : null;
    if (S && P.inv <= 0 && P.state !== 'dead' && P.state !== 'dodge' && !(P.state === 'parry' && P.t < .28) && P.state !== 'down') {
      const src = typeof HIT_SRC !== 'undefined' ? HIT_SRC : null;
      if (src && src.kind === 'proj' && src.p && !src.p.ground && S.f.has('scallop') && O.reflCd <= 0 && Math.sign(fromX - P.x) === P.facing) { O.reflCd = 2.5; O.flash = .35; turnShot(src.p, S); floatText(P.x, P.y, P.z + 80, 'THROWN BACK', '#BFF0E4', 12); return; }
      if (src && src.kind === 'melee' && S.f.has('coral') && O.parryCd <= 0) { parry(src.e, fromX, S); return; }
    }
    return _pd(dmg, fromX, big);
  }; }

  // ======================================================================================================
  // THE PICK: the Pearl rises out of the fallen boss, and a card offers three traits
  // ======================================================================================================
  const pickPending = () => evoOn() && ES().picks.length < PICKS && stageIdx <= (typeof FORK !== 'undefined' ? FORK : 4) && stage && !stage.secret && !ES().got[pickKey()];
  function take(id, quiet) {
    const s = ES(); if (!TR[id] || s.picks.includes(id)) return false;
    s.picks.push(id); if (typeof stageIdx !== 'undefined' && !quiet) s.got[pickKey()] = 1;
    statKey = ''; persist(); O.pop = 1;
    if (P && !quiet) { floatText(P.x, P.y, P.z + 96, TR[id].name.toUpperCase(), '#F2D68A', 15); sparkle(O.x || P.x, P.y, (O.z || P.z + 40), 18); sfx('learned'); }
    return true;
  }
  function autoPick(n = PICKS, rnd = Math.random) { const s = ES(); let k = 0; while (s.picks.length < Math.min(PICKS, n)) { const o = offers(s.picks, s.seed); if (!o.length) break; take(o[Math.floor(rnd() * o.length)].id, true); if (++k > 9) break; } statKey = ''; persist(); return s.picks.slice(); }
  // the boss falls: the Pearl rises out of it while the world goes still
  { const _kill = killEnemy; killEnemy = function (e, dir, m) { const was = e.dead; _kill(e, dir, m);
    if (!was && e.dead && e.boss && live() && pickPending()) O.rise = { x: e.x, y: e.y, z: e.z + e.hh * .6, t: 0, x0: e.x, y0: e.y, z0: e.z + e.hh * .6 }; }; }
  // ---------------- the Pearl's own deaths: only when a Pearl hit is the killing blow ----------------
  // each Form finishes a foe its own way (drawn in draw.js's drawDeath): the Edge cuts it clean in two along a nacre line,
  // the Orb punts it crushed and tumbling down the street, the Shell seals it in nacre that cracks and bursts into pieces,
  // the Spire throws it back and pins it to the floor with light pouring out, and the bare speck dissolves it into motes,
  // leaving a little pearl. The Current adds its touch: a puddle and a splash (tide), shards stuck in it (nacre), char and
  // sparks (storm), or a small dark vortex that swallows what is left (abyss). Bosses and the worlds' own deaths are kept
  const PDEATH = { edge: 'slice', orb: 'plcrush', shell: 'plshatter', spire: 'plpin', speck: 'plspeck' };
  const PDUR = { slice: 2, plcrush: 1.6, plshatter: 1.5, plpin: 1.6, plspeck: 1.3 }, ABYSS_T = .8;
  const NACRE = ['#FFFFFF', '#F6E6FF', '#D8F4EC', '#F2D68A', '#F6C2D4'];
  function pearlDeath(e, dir, m) {
    const S = curStats(), form = m.pform || (S && S.form) || 'speck', cur = m.pcur !== undefined ? m.pcur : S ? S.cur : null;
    const kind = PDEATH[form] || 'plspeck', sk = e.shrink || 1, cy = e.z + e.hh * .5 * sk, cols = MAT_COL[e.def.mat] || MAT_COL.fur;
    e.death = kind; e.pform = form; e.pcur = cur || null; e.pfx = 0;
    e.air = false; e.spin = 0; e.rotA = 0; e.vz = 0; e.vx = 0;
    e.t = e.dmax = PDUR[kind] + (e.pcur === 'abyss' ? ABYSS_T : 0);
    dropLoot(e); // (a pop would have dropped it on landing)
    if (kind === 'slice') {
      e.cut = rand(-.45, .45); e.vx = dir * 40;
      for (let i = -4; i <= 4; i++) burst(e.x + Math.cos(e.cut) * i * e.hw * .3 * sk, e.y, cy + Math.sin(-e.cut) * i * e.hw * .3 * sk, i % 2 ? cols : NACRE, 2, e.def.mat, dir);
      fx.push({ kind: 'slash', x: e.x, y: e.y, z: cy, ang: -e.cut, t: .3, max: .3, size: (46 + e.hw) * sk, col: '#F6E6FF' }); sfx('slice'); sfx('hit-crystal', .4);
    } else if (kind === 'plcrush') {
      e.vx = dir * 360 * sk;
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: cy, t: .25, max: .25, r: (26 + e.hw) * sk, col: '#F6E6FF' });
      burst(e.x - dir * e.hw * .5 * sk, e.y, cy, cols, 10, e.def.mat === 'flesh' ? 'rock' : e.def.mat, dir);
      sfx('crunch'); sfx('slam', .5); shakeMag = Math.max(shakeMag, 6); hitstop = Math.max(hitstop, .16);
    } else if (kind === 'plshatter') {
      e.pshards = []; for (let i = 0; i < 7; i++) { const x = rand(-.8, .8); e.pshards.push({ x, y: rand(.12, .92), vx: (x + rand(-.25, .25)) * rand(90, 170), vz: rand(80, 220), r: rand(.16, .3), a: rand(0, TAU), w: rand(-9, 9), n: i % 3 === 1 ? 4 : 3, s: rand(0, 99), body: i % 2 }); }
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: cy, t: .3, max: .3, r: (20 + e.hw) * sk, col: '#F6E6FF' }); sfx('hit-crystal');
    } else if (kind === 'plpin') {
      e.vx = dir * 300 * sk;
      fx.push({ kind: 'slash', x: e.x, y: e.y, z: cy, ang: 0, t: .25, max: .25, size: (30 + e.hw) * sk, col: '#FFF4D0' }); sfx('slice'); sfx('whoosh', .5);
    } else { sfx('hit-crystal', .6); sparkle(e.x, e.y, cy, 8, NACRE); }
    if (e.pcur === 'tide') { for (let i = 0; i < 12 && parts.length < 420; i++) parts.push({ x: e.x + rand(-8, 8) * sk, y: e.y + rand(-3, 3), z: 2, vx: rand(-110, 110) * sk, vy: rand(-10, 10), vz: rand(90, 230) * sk, life: rand(.4, .7), max: .7, col: pick(['#BFF0FF', '#7FD0E8', '#FFFFFF']), size: rand(1.4, 2.6) * sk, shape: 'blob' }); sfx('hit-goo', .6); bub(e.x, e.y, 6, 6, 40); }
    else if (e.pcur === 'nacre') { e.pspk = []; for (let i = 0; i < 3; i++) e.pspk.push({ x: rand(-.55, .55), y: rand(.3, .8), a: -Math.PI / 2 + rand(-1.1, 1.1), l: rand(7, 12) }); sparkle(e.x, e.y, cy, 6, ['#FFFFFF', '#F6C2D4', '#E86A5A']); }
    else if (e.pcur === 'storm') { fx.push({ kind: 'bolt', x: e.x + rand(-10, 10), y: e.y, z: e.z + 240, x2: e.x, y2: e.y, z2: cy, t: .22, max: .22, col: '#E8ECFF', seed: Math.random() * 99 }); burst(e.x, e.y, cy, ['#FFFFFF', '#BFD8FF', '#FFE08A'], 10, 'spark', 0, true); sfx('shoot', .6); }
  }
  // the timed beats of those deaths (the shell bursting, the spire biting into the floor, motes rising), stepped with him
  function pearlDeathStep(dt) {
    for (const e of enemies) {
      if (!e.pform || e.state !== 'dying' || e.corpse) continue;
      const el = e.dmax - e.t, sk = e.shrink || 1, cy = e.z + e.hh * .5 * sk;
      if (e.death === 'plshatter' && !(e.pfx & 1) && el >= .62) { e.pfx |= 1; sfx('break'); sfx('hit-crystal', .6); shakeMag = Math.max(shakeMag, 3); sparkle(e.x, e.y, cy, 14, NACRE); }
      else if (e.death === 'plpin' && !(e.pfx & 1) && el >= .4) { e.pfx |= 1; sfx('slam', .5); dust(e.x, e.y, 6); shakeMag = Math.max(shakeMag, 4); }
      else if (e.death === 'plcrush' && Math.abs(e.vx) > 120 && Math.random() < .5) dust(e.x, e.y, 1);
      else if (e.death === 'plspeck' && el < 1.15 && Math.random() < dt * 28 && parts.length < 400) parts.push({ x: e.x + rand(-e.hw, e.hw) * sk, y: e.y, z: e.z + rand(0, e.hh) * sk, vx: rand(-12, 12), vy: 0, vz: rand(40, 90), life: .6, max: .6, col: pick(NACRE), size: rand(1.2, 2.2) * sk, shape: 'star', rot: 0, vr: 4 });
      if (e.pcur === 'storm' && el < .9 && Math.random() < dt * 12 && parts.length < 400) parts.push({ x: e.x + rand(-e.hw, e.hw) * sk, y: e.y, z: e.z + rand(4, e.hh) * sk, vx: rand(-60, 60), vy: 0, vz: rand(30, 110), life: .3, max: .3, col: pick(['#FFFFFF', '#BFD8FF', '#FFE08A']), size: rand(1, 2), shape: 'star', rot: 0, vr: 8 });
      if (e.pcur === 'abyss' && el >= e.dmax - ABYSS_T) {
        if (!(e.pfx & 2)) { e.pfx |= 2; sfx('whoosh', .6); sfx('hit-goo', .3); }
        if (Math.random() < dt * 20 && parts.length < 400) { const a = rand(0, TAU), r = (30 + e.hw) * sk; parts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r * .3, z: 3, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * .6, vz: 0, life: .4, max: .4, col: pick(['rgba(40,28,80,.85)', 'rgba(110,224,192,.8)']), size: rand(1.6, 3), shape: 'puff', rot: 0, vr: 0 }); }
      }
    }
  }
  { let swap = null; const _kill = killEnemy; killEnemy = function (e, dir, m) {
    const pl = !!(m && m.pearl && !m.trump) && !e.boss && !e.dead;
    if (!pl) { // (a kill set off inside a Pearl kill, by a splash or a jewel's lightning, keeps its weapon's own death)
      if (!swap) return _kill(e, dir, m);
      const s = swap; swap = null; if (s.had) DEATH_BY[s.k] = s.v; else delete DEATH_BY[s.k];
      try { return _kill(e, dir, m); } finally { swap = s; DEATH_BY[s.k] = 'pop'; }
    }
    if (swap) return _kill(e, dir, m); // (already a Pearl kill under way: the weapon's death is already set aside)
    // the weapon in hand must not cut, cave in or run through what the Pearl killed: the kill is made as a plain one first
    const k = P ? P.w : '', had = Object.prototype.hasOwnProperty.call(DEATH_BY, k); swap = { k, had, v: DEATH_BY[k] }; DEATH_BY[k] = 'pop';
    try { _kill(e, dir, m); } finally { const s = swap; swap = null; if (s.had) DEATH_BY[s.k] = s.v; else delete DEATH_BY[s.k]; }
    if (e.dead && !e.boss && e.state === 'dying' && e.death === 'pop' && !e.popped) pearlDeath(e, dir, m); // (a world's own death for its creature stands)
  }; }
  // swallowed by the abyss: nothing is left lying there
  { const _tc = toCorpse; toCorpse = function (e, kind) { _tc(e, kind); if (e.pcur === 'abyss' && e.pform) { const i = corpses.indexOf(e); if (i >= 0) corpses.splice(i, 1); } }; }
  { const _up = updatePlayer; updatePlayer = function (dt) { _up(dt); try { pearlDeathStep(dt); } catch (err) { console.error(err); } }; }
  function riseStep(dt) {
    const R = O.rise; if (!R) return; R.t += dt;
    const up = sm(R.t / 1.2), go = sm((R.t - 1.3) / 1.2);
    const hx = P.x - P.facing * 21, hz = P.z + 66;
    R.x = lerp(R.x0, hx, go); R.y = lerp(R.y0, P.y, go); R.z = lerp(R.z0 + 70 * up, hz, go);
    if (Math.random() < dt * 30 && parts.length < 400) parts.push({ x: R.x + rand(-6, 6), y: R.y, z: R.z + rand(-6, 6), vx: rand(-20, 20), vy: 0, vz: rand(-30, 10), life: .5, max: .5, col: pick(['#FFFFFF', '#D8F4EC', '#F2D68A']), size: rand(1.2, 2.4), shape: 'star', rot: 0, vr: 4 });
    if (R.t > 3.2) O.rise = null;
  }
  let card = null;
  function closeCard() { if (card) { card.el.remove(); card = null; app.classList.remove('nocontrols'); } }
  function openPick(after) {
    closeCard(); const s = ES(); if (s.picks.length >= PICKS) { if (after) after(); return false; }
    const opts = offers(s.picks, s.seed); if (!opts.length) { if (after) after(); return false; }
    const el = document.createElement('div'); el.id = 'pearlPick';
    const bossName = boss && boss.def && boss.def.name ? boss.def.name : null;
    const heldTxt = s.picks.length ? s.picks.map(id => TR[id].name).join(' · ') : 'nothing yet: a speck of nacre';
    el.innerHTML = `<style>
      #pearlPick { position: absolute; inset: 0; z-index: 7; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at 50% 45%, rgba(10,40,48,.8), rgba(4,12,18,.93)); font-family: var(--label, Georgia, serif); color: #EAF6F0; padding: 10px 16px; box-sizing: border-box; }
      #pearlPick .bx { width: min(780px, 100%); max-height: 100%; overflow: auto; text-align: center; }
      #pearlPick .kk { font: 700 11px var(--label, Georgia, serif); letter-spacing: .18em; color: #F2D68A; }
      #pearlPick h2 { margin: 2px 0 2px; font: 700 clamp(15px, 3.2vw, 23px) Cinzel, Georgia, serif; color: #FFFFFF; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
      #pearlPick .sub { font-size: 11.5px; opacity: .8; margin-bottom: 8px; }
      #pearlPick .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      #pearlPick button { all: unset; cursor: pointer; box-sizing: border-box; border-radius: 9px; padding: 6px 7px 8px; border: 1.5px solid rgba(242,214,138,.45); background: linear-gradient(170deg, rgba(40,96,100,.6), rgba(8,28,36,.88)); display: grid; gap: 3px; justify-items: center; align-content: start; transition: transform .08s; }
      #pearlPick button:hover, #pearlPick button:focus-visible, #pearlPick button.sel { border-color: #F2D68A; box-shadow: 0 0 0 2px rgba(242,214,138,.35), 0 0 18px rgba(160,230,215,.35); transform: translateY(-2px); }
      #pearlPick canvas { width: 100%; max-width: 150px; aspect-ratio: 4 / 3; }
      #pearlPick .ax { font: 700 9.5px var(--label, Georgia, serif); letter-spacing: .16em; color: #9FE2D3; }
      #pearlPick .ax.combo { color: #FFD27A; }
      #pearlPick b { font: 700 12.5px Cinzel, Georgia, serif; color: #F2D68A; letter-spacing: .03em; }
      #pearlPick i { font-style: normal; font-size: 11px; line-height: 1.3; opacity: .92; }
      #pearlPick .n { font-size: 10px; opacity: .55; }
      #pearlPick .held { margin-top: 8px; font-size: 10.5px; opacity: .7; }
      @media (max-height: 340px) { #pearlPick canvas { max-width: 96px; } #pearlPick .sub { display: none; } }
    </style><div class="bx"><div class="kk">THE PEARL OF JUDGEMENT · CHOICE ${s.picks.length + 1} OF ${PICKS}</div>
      <h2>${bossName ? `The Pearl rises out of ${bossName}` : 'The Pearl rises'}: what does it take?</h2>
      <div class="sub">Choose one. Light + Heavy throws it.</div>
      <div class="row">${opts.map((t, i) => `<button type="button" data-k="${t.id}" class="${i ? '' : 'sel'}"><canvas width="300" height="225"></canvas>
        <span class="ax ${t.req ? 'combo' : ''}">${AXNAME[t.ax]} · ${t.req ? t.req.map(g => TAGNAME[g].toUpperCase()).join(' + ') : TAGNAME[t.tag].toUpperCase()}</span><b>${t.name}</b><i>${t.desc}</i><span class="n">${KBD ? i + 1 : ''}</span></button>`).join('')}</div>
      <div class="held">Already in it: ${heldTxt}</div></div>`;
    app.appendChild(el); app.classList.add('nocontrols');
    const prev = mode; mode = 'pearlpick'; card = { el, after, prev, i: 0, opts, t0: performance.now() };
    const cvs = [...el.querySelectorAll('canvas')], draw = (t) => cvs.forEach((c, i) => pickArt(c, s.picks, opts[i], t));
    draw(0);
    const spin = () => { if (!card || card.el !== el) return; draw((performance.now() - card.t0) / 1000); try { requestAnimationFrame(spin); } catch (e) {} };
    try { requestAnimationFrame(spin); } catch (e) {}
    el.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-k]'); if (b) choose(b.dataset.k); });
    const first = el.querySelector('button.sel'); if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }
  function choose(id) {
    if (!card) return; const after = card.after; closeCard();
    take(id); if (mode === 'pearlpick') mode = 'play'; clearInput(); for (const q in pressed) pressed[q] = false;
    if (after) after();
  }
  { const _ok = onKeyMenu; onKeyMenu = (e) => {
    if (mode !== 'pearlpick' || !card) return _ok ? _ok(e) : false;
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code], btns = [...card.el.querySelectorAll('button[data-k]')], N = btns.length;
    if (n !== undefined && n < N) { e.preventDefault(); choose(btns[n].dataset.k); return true; }
    if (/Arrow(Left|Right|Up|Down)|Key[ADWS]/.test(e.code)) { e.preventDefault(); const d = /Left|KeyA|Up|KeyW/.test(e.code) ? -1 : 1; card.i = (card.i + d + N) % N; btns.forEach((b, i) => b.classList.toggle('sel', i === card.i)); try { btns[card.i].focus({ preventScroll: true }); } catch (_) {} return true; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ') { e.preventDefault(); const f = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k; choose(f || btns[card.i].dataset.k); return true; }
    return true;
  }; }
  // a boss of the first five worlds falls: the card comes up before the world is cleared (its ending, the forge, the Rim)
  { const _sc = stageClear; stageClear = function () { if (live() && pickPending()) { O.rise = null; if (openPick(() => _sc())) return; } return _sc(); }; }
  { const _play = play; play = function (i, zone) { closeCard(); return _play(i, zone); }; }

  // ======================================================================================================
  // CURRENTS, NOT FOOTSTEPS
  // ======================================================================================================
  // tuning (world units a second; the street's depth is drawn at about .6 of its width, so depth speeds are scaled by YK)
  const T = { cruise: 290, acc: 820, turn: .16, coast: .2, over: .3, overFling: .78, fling: 375, flingDur: .34,
    hitMin: 300, bounce: .78, bounceMin: 90, YK: .62 };
  const LOCO = ['idle', 'walk', 'run'];
  const speedE = () => Math.hypot(CUR.vx, CUR.vy / T.YK); // speed, depth counted as the screen draws it
  const spd = () => (W_SPEED[P.w] || 1) * (P.shrink || 1) * (pw('haste') ? 1.3 : 1) * (1 + gearStat('speed')) * (typeof roomSlow !== 'undefined' ? roomSlow : 1);
  const rightEdge = () => lockX !== null ? lockX + VW - 14 : stage.len - 14;
  function fling(dx, dy) {
    let d = Math.hypot(dx, dy);
    if (d < .2) { const s = speedE(); if (s > 80) { dx = CUR.vx; dy = CUR.vy / T.YK; } else { dx = -P.facing; dy = 0; } d = Math.hypot(dx, dy) || 1; }
    const k = Math.sqrt(P.shrink || 1) * (1 + gearStat('speed') * .5);
    CUR.vx = dx / d * T.fling * k; CUR.vy = dy / d * T.fling * k * T.YK; CUR.flingT = T.flingDur;
    sfx('whoosh'); sfx('hit-goo', .5); bub(P.x, P.y, 8, 8, 60);
    for (let i = 0; i < 10 && parts.length < 420; i++) parts.push({ x: P.x - dx / d * rand(0, 12), y: P.y + rand(-3, 3), z: 2, vx: -dx / d * rand(60, 200) + rand(-30, 30), vy: rand(-12, 12), vz: rand(60, 200), life: .5, max: .5, col: pick(['rgba(220,250,245,.95)', 'rgba(150,215,210,.9)', '#FFFFFF']), size: rand(2, 3.4), shape: 'puff', rot: 0, vr: 0 });
  }
  function bounceFx(x, y, nx) { sfx('hit-goo', .45); shakeMag = Math.max(shakeMag, 3); CUR.bounceT = .2;
    for (let i = 0; i < 8 && parts.length < 420; i++) parts.push({ x, y: y + rand(-4, 4), z: rand(2, 20), vx: nx * rand(40, 160), vy: rand(-20, 20), vz: rand(80, 220), life: .5, max: .5, col: pick(['rgba(220,250,245,.95)', '#FFFFFF', 'rgba(150,215,210,.9)']), size: rand(1.8, 3), shape: 'puff', rot: 0, vr: 0 }); }
  // the glide itself, once the game has had its turn at him (it never walked him: his stick was hidden from it)
  function glide(dt, st0, mx, my, runTap) {
    const st = P.state, s0 = speedE();
    if (st === 'hurt' || st === 'down' || st === 'dead') { CUR.vx = CUR.vy = 0; CUR.glide = false; return; }
    if (st === 'dodge' && st0 !== 'dodge') { fling(mx, my); P.dvx = P.dvy = 0; if (P.dk === 'back') P.vz = Math.min(P.vz, 120); }
    if (st === 'jump' && LOCO.includes(st0)) { P.jvx = CUR.vx; P.jvy = CUR.vy * .7; P.runJump = Math.abs(CUR.vx) > 260; }
    if (st === 'jump' || st === 'air') { CUR.vx = P.jvx || 0; CUR.vy = st === 'jump' ? P.jvy || 0 : 0; CUR.glide = false; return; } // (a jump keeps the speed, and lands with it)
    if (!LOCO.includes(st) && st !== 'dodge') { CUR.vx *= Math.pow(st === 'atk' ? .05 : .01, dt); CUR.vy *= Math.pow(st === 'atk' ? .05 : .01, dt); CUR.glide = false; return; }
    if (runTap && LOCO.includes(st)) fling(mx, my); // a double-tap throws the current as a dodge does (but leaves him open)
    const sp = spd(), inp = Math.hypot(mx, my), dodging = st === 'dodge';
    { const was = CUR.flingT || 0; CUR.flingT = Math.max(0, was - dt); if (was > 0 && CUR.flingT === 0) CUR.post = .3; CUR.post = Math.max(0, (CUR.post || 0) - (was > 0 ? 0 : dt)); } // (post: just after the fling, still easing down)
    // lay the current: gather speed along the stick, bleed the part of the speed that goes across it (a curve, not a skid)
    const cr = T.cruise * sp;
    if (inp > .15) { const nx = mx / inp, ny = my / inp, a = T.acc * sp * (dodging ? .35 : 1), top = cr * Math.min(1, inp);
      const vyE = CUR.vy / T.YK; let along = CUR.vx * nx + vyE * ny; const px = CUR.vx - along * nx, py = vyE - along * ny, keep = Math.pow(dodging ? .7 : T.turn, dt);
      if (along < top) along = Math.min(top, along + a * dt * (along < 0 ? 1.6 : 1)); // (up to cruising speed along the stick; a current laid against the way he goes bites harder)
      CUR.vx = along * nx + px * keep; CUR.vy = (along * ny + py * keep) * T.YK;
      CUR.layA = Math.atan2(ny, nx); CUR.lay = Math.min(1, CUR.lay + dt * 5); }
    else { const c = Math.pow(dodging ? .8 : T.coast, dt); CUR.vx *= c; CUR.vy *= c; CUR.lay = Math.max(0, CUR.lay - dt * 3); }
    // over cruising speed (a fling, a bounce) it eases back down, slowly while the fling is still being thrown
    const s = speedE();
    // the fling's speed is all at the front of the dodge: held through its first half, then it eases quickly back to cruising
    // speed over the second half and the moment after, so the glide it leaves him in carries no second burst
    const ease = CUR.flingT > T.flingDur * .5 ? T.overFling : (CUR.flingT > 0 || CUR.post > 0) ? .004 : T.over;
    if (s > cr) { const k = (cr + (s - cr) * Math.pow(ease, dt)) / s; CUR.vx *= k; CUR.vy *= k; }
    if (speedE() < 4 && inp < .15) { CUR.vx = CUR.vy = 0; }
    P.x += CUR.vx * dt; P.y += CUR.vy * dt;
    // the screen's edges (and a locked fight's walls), the street's near and far sides: off them like a pinball
    // (steered into a wall at cruising speed he only stops against it: it is a thrown body that comes off)
    const L = camX + 14, Rr = rightEdge(), off = (v, push) => Math.abs(v) > T.bounceMin && (!push || Math.abs(v) > cr * 1.15);
    if (P.x < L) { P.x = L; if (CUR.vx < 0 && off(CUR.vx, mx < -.15)) { CUR.vx = -CUR.vx * T.bounce; bounceFx(P.x, P.y, 1); } else CUR.vx = Math.max(0, CUR.vx); }
    if (P.x > Rr) { P.x = Rr; if (CUR.vx > 0 && off(CUR.vx, mx > .15)) { CUR.vx = -CUR.vx * T.bounce; bounceFx(P.x, P.y, -1); } else CUR.vx = Math.min(0, CUR.vx); }
    const y0 = FLOOR_TOP + 6, y1 = FLOOR_BOT;
    if (P.y < y0) { P.y = y0; CUR.vy = CUR.vy < 0 && off(CUR.vy / T.YK, my < -.15) ? -CUR.vy * .6 : Math.max(0, CUR.vy); }
    if (P.y > y1) { P.y = y1; CUR.vy = CUR.vy > 0 && off(CUR.vy / T.YK, my > .15) ? -CUR.vy * .6 : Math.min(0, CUR.vy); }
    // through them at speed: struck and thrown, the harder the faster; the big ones throw him back, but a boss he goes clean through
    const sE = speedE();
    if (sE > T.hitMin && P.z < 40) for (const e of foes()) {
      if (Math.abs(e.x - P.x) > e.hw + 12 || Math.abs(e.y - P.y) > 16 + e.hw * .3 || e.z > 60) continue;
      const big = !e.boss && ((e.def.weight || 1) < .7 || (e.def.poise || 0) >= 3); // (a boss is passed clean through, struck as he goes)
      if (big) { const nx = P.x - e.x || -Math.sign(CUR.vx) || 1, ny = (P.y - e.y) * 2, nd = Math.hypot(nx, ny) || 1, ux = nx / nd, uy = ny / nd, vyE = CUR.vy / T.YK, dot = CUR.vx * ux + vyE * uy;
        if (dot < 0) { CUR.vx = (CUR.vx - 2 * dot * ux) * T.bounce; CUR.vy = (vyE - 2 * dot * uy) * T.bounce * T.YK; P.x = e.x + ux * (e.hw + 13); bounceFx(P.x, P.y, Math.sign(ux) || 1); } }
      if (!cool(CUR.cd, e, .4)) continue;
      const q = clamp((sE - 200) / 240, .25, 1.4), d = Math.max(1, Math.round((5 + 12 * q) * W() * (e.boss ? .6 : 1))), dir = Math.sign(CUR.vx) || P.facing;
      strike(e, d, dir, { dmg: d, kb: 120 + sE * .55, launch: sE > 480 ? 160 : 0, power: sE > 480 ? 1 : 0, el: 1, current: 1, pearl: 1, wall: sE > 480 ? 1 : 0 }, true);
      if (!big && !e.boss) { CUR.vx *= .9; CUR.vy *= .9; }
      bub(e.x, e.y, 20, 4, 60);
    }
    // facing follows the stick (with nothing held, he keeps it: he can drift back with his eyes on them)
    if (LOCO.includes(st)) { if (Math.abs(mx) > .1) P.facing = Math.sign(mx); P.state = sE > 18 || inp > .15 ? 'walk' : 'idle'; P.walk = 0; }
    CUR.glide = LOCO.includes(st) && sE > 18;
    // spray off him at speed
    if (sE > 300 && Math.random() < dt * 40 * Math.min(2, sE / 400) && parts.length < 420) { const a = Math.atan2(CUR.vy, CUR.vx);
      parts.push({ x: P.x - Math.cos(a) * 8 + rand(-4, 4), y: P.y + rand(-2, 2), z: 1, vx: -Math.cos(a) * rand(30, 90) + rand(-40, 40), vy: rand(-10, 10), vz: rand(60, 170), life: .45, max: .45, col: pick(['rgba(230,252,248,.95)', 'rgba(170,230,225,.9)', '#FFFFFF']), size: rand(1.6, 3), shape: 'puff', rot: 0, vr: 0 }); }
    P.y = clamp(P.y, y0, y1); P.x = clamp(P.x, L, Rr);
  }

  // an attack at speed carries further and lands harder
  { const _begin = begin; begin = function (m) {
    if (!curOn() || !m || typeof m !== 'object' || !P) return _begin(m);
    const s = speedE(), b = clamp((s - 140) / 460, 0, 1);
    if (b > 0) m = Object.assign({}, m, { dmg: (m.dmg || 0) * (1 + .5 * b), kb: (m.kb || 0) * (1 + .7 * b), x1: (m.x1 || 0) + 24 * b, curB: b });
    _begin(m);
    if (b > 0 && P.state === 'atk') { P.vx += CUR.vx * .7; CUR.vx *= .35; CUR.vy *= .35; if (b > .4) { fx.push({ kind: 'speed', x: P.x, y: P.y, z: 30, dir: P.facing, t: .25, max: .25 }); bub(P.x, P.y, 10, 4, 50); } }
    else if (b > 0 && P.state === 'air') P.jvx = (P.jvx || 0) * .5 + CUR.vx * .6;
  }; }

  // ======================================================================================================
  // the hooks: his update, his stance
  // ======================================================================================================
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    CUR.clock += dt;
    if (O.stage !== stage || O.zone !== (typeof zoneIdx !== 'undefined' ? zoneIdx : 0)) { O.stage = stage; O.zone = typeof zoneIdx !== 'undefined' ? zoneIdx : 0; resetPlace(); }
    const lv = live(), S = lv ? curStats() : null, cur = curOn() && lv;
    if (S) lhInput(S, dt); else O.chg = null;
    const st0 = P.state, mx = input.mx, my = input.my, run = input.run, L0 = input.light, H0 = input.heavy, hideAtk = O.chg !== null;
    let runTap = false;
    if (cur) {
      const loco = LOCO.includes(st0) && P.z <= 0;
      runTap = loco && run && !CUR.wasRun; CUR.wasRun = run;
      const act = pressed.light || pressed.heavy || pressed.jump || pressed.dodge || pressed.shoot;
      if (loco && !act) { input.mx = 0; input.my = 0; input.run = false; } // (the game's own walk is hidden from it: the current carries him instead)
      else if (loco && pressed.dodge) input.run = false;
    } else { CUR.vx = CUR.vy = 0; CUR.glide = false; CUR.lay = 0; }
    if (hideAtk) { input.light = input.heavy = false; } // (gathering the Pearl's shot: his own blows wait)
    try { _up(dt); } finally { if (cur) { input.mx = mx; input.my = my; input.run = run; } if (hideAtk) { input.light = L0; input.heavy = H0; } }
    if (cur) glide(dt, st0, mx, my, runTap);
    // the wake behind him
    if (cur && P.z < 6 && speedE() > 40) CUR.trail.push({ x: P.x, y: P.y, t: CUR.clock, s: speedE() });
    while (CUR.trail.length && (CUR.clock - CUR.trail[0].t > .75 || CUR.trail.length > 60)) CUR.trail.shift();
    O.on = evoOn() && lv;
    if (O.on) orbStep(dt);
    if (lv) { throwsStep(dt); shotsStep(dt); poolsStep(dt); riseStep(dt); }
  };
  // his stance on the current: no strides, leaning into the way he is carried
  { const _pp = playerPose; playerPose = function () { const pose = _pp();
    if (curOn() && CUR.glide && LOCO.includes(P.state)) { const s = speedE(), f = CUR.vx * P.facing;
      pose.walk = .55; pose.run = 0; pose.lean = clamp(f / 650, -.3, .5); pose.flow = clamp(f / 45, -10, 14); if (s > 260) pose.crouch = 1; }
    return pose; }; }

  // ======================================================================================================
  // THE LOOK. Rebma's sea-green, nacre and gold: soft painted shading, an ink line round each piece
  // ======================================================================================================
  // the pearl itself: the Pearl of Judgement exactly as it drops in Rebma (W7.pearlCore, art_w7.js), black, the reversed
  // Pattern turning in it, at any size; what each pick adds is drawn round it, and its light is behind (orbGlow)
  // which look a pearl takes: the bare Pearl is the relic itself; once it has taken a shape it is the nacre pearl of its
  // Current (the first designs: more distinct from one another). Pearl style 2.0, every pearl the relic, is kept behind a
  // switch: pearlNG('v2', true) in the console, or the dev panel
  const STYLE_KEY = 'shadowroad-pearl-style';
  const V2 = () => { try { return localStorage.getItem(STYLE_KEY) === 'v2'; } catch (e) { return false; } };
  function pearlBody(x, y, r, t, nl, pal, relic) {
    if (r < .4) return;
    if (relic === undefined) relic = V2();
    if (relic) W7.pearlCore(x, y, r, t); else nacreBody(x, y, r, t, nl, pal);
  }
  // the first design: nacre shading through the Current's colours, orient bands drifting over it, the edges of its layers
  // catching the light, a highlight, the ink line round it
  function nacreBody(x, y, r, t, nl, pal) {
    if (r < .4) return; const B = (pal || PAL.pearl).b;
    const g = ctx.createRadialGradient(x - r * .38, y - r * .42, r * .05, x + r * .1, y + r * .12, r * 1.05);
    g.addColorStop(0, B[0]); g.addColorStop(.22, B[1]); g.addColorStop(.55, B[2]); g.addColorStop(.82, B[3]); g.addColorStop(1, B[4]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (r > 2.4) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); const a = t * .7;
      ctx.globalAlpha = .34; ctx.fillStyle = '#F6C2D4'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * .3, y + r * .5, r * .95, r * .34, Math.sin(a) * .3, 0, TAU); ctx.fill();
      ctx.globalAlpha = .28; ctx.fillStyle = '#F2D68A'; ctx.beginPath(); ctx.ellipse(x + r * .48, y + Math.sin(a) * r * .22, r * .3, r * .78, -.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = .22; ctx.fillStyle = '#7FD8C8'; ctx.beginPath(); ctx.ellipse(x - r * .55, y + r * .2, r * .3, r * .6, .4, 0, TAU); ctx.fill();
      ctx.globalAlpha = .55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(.3, r * .045);
      for (let i = 1; i <= nl; i++) { const q = 1 - i / (nl + 1.4), o = r * .14 * (1 - q); ctx.beginPath(); ctx.arc(x - o, y - o, r * q, Math.PI * .9 + i * .45, Math.PI * 1.65 + i * .45); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(x - r * .4, y - r * .45, r * .32, r * .19, -.6, 0, TAU); ctx.fill();
    if (r > 2) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x + r * .44, y + r * .36, r * .1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = clamp(r * .12, .6, 1.3); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  const glow = (x, y, r, rgb, a) => { if (r <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const inkW = (r, k = .12) => clamp(r * k, .5, 1.2);
  const stroke = (col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
  // AN EDGE ORB (any Edge trait taken) is the Nacre Blade of the Growing Pearl (design A, bc6856a): three long, thin
  // crescents of pale nacre, gilt along the cutting side, round a small pearl hub, so it reads as a saw blade first. HUB is
  // the hub's share of the orb's radius r; the blades then reach about 1.9r, as the full-grown Nacre Blade's did
  const HUB = .6, BLADE_R = HUB / .78;
  // one crescent blade, drawn about 0,0 at angle a; r is the Nacre Blade's own measure (its hub pearl was .78r). Cockle
  // Lip sets gilt saw teeth along the outer, cutting side; Thunder Lamella runs a bolt down the blade and whitens the gilt
  function crescentBlade(r, a, pal, lightning, teeth) {
    const c = Math.cos, s = Math.sin, L = r * 2.5;
    const p0 = [c(a) * r * .6, s(a) * r * .6], tip = [c(a + 1.05) * L, s(a + 1.05) * L], cO = [c(a + .45) * L * 1.15, s(a + .45) * L * 1.15], cI = [c(a + .95) * L * .5, s(a + .95) * L * .5], p1 = [c(a + .9) * r * .6, s(a + .9) * r * .6];
    const edge = () => { ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cO[0], cO[1], tip[0], tip[1]); };
    const body = () => { ctx.beginPath(); edge(); ctx.quadraticCurveTo(cI[0], cI[1], p1[0], p1[1]); ctx.closePath(); };
    // the outer (cutting) curve at u, and the inner curve at the same distance along, from base to tip
    const q = (A, B, C, u) => [(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * B[0] + u * u * C[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * B[1] + u * u * C[1]];
    const out = (u) => q(p0, cO, tip, u), inn = (u) => q(p1, cI, tip, u);
    if (teeth) {
      // the cockle's lip: raked teeth along the outer side (drawn first, so the blade covers their roots)
      ctx.beginPath(); const n = 6;
      for (let i = 0; i < n; i++) { const u0 = .1 + i * .78 / n, u1 = u0 + .78 / n, a0 = out(u0), a1 = out(u1), m = out(u0 + (u1 - u0) * .8), w = inn(u0 + (u1 - u0) * .8);
        let nx = m[0] - w[0], ny = m[1] - w[1]; const d = Math.hypot(nx, ny) || 1, h = r * (.42 - .22 * (i / n)); nx = nx / d * h; ny = ny / d * h;
        ctx.moveTo(a0[0], a0[1]); ctx.lineTo(m[0] + nx, m[1] + ny); ctx.lineTo(a1[0], a1[1]); ctx.closePath(); }
      ctx.fillStyle = '#E2BE66'; ctx.fill(); stroke(OUT, clamp(r * .07, .35, .7));
    }
    const lg = ctx.createLinearGradient(p0[0], p0[1], tip[0], tip[1]); lg.addColorStop(0, '#E8F6F0'); lg.addColorStop(.55, '#BFE3D8'); lg.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = lg; body(); ctx.fill();
    if (lightning) {
      // a bolt down the middle of the blade, from root to near the tip
      const zig = () => { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const u = .12 + i * .7 / 6, o = out(u), w = inn(u), k = .5 + (i % 2 ? .24 : -.24) * (i && i < 6 ? 1 : 0); const x = w[0] + (o[0] - w[0]) * k, y = w[1] + (o[1] - w[1]) * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
      ctx.lineJoin = 'round'; zig(); stroke('#5E66C8', Math.max(.45, r * .16)); zig(); stroke('#FFFFFF', Math.max(.2, r * .055));
    }
    ctx.beginPath(); edge(); stroke(lightning ? '#FFF2A8' : '#E2BE66', Math.max(.5, r * .16));
    ctx.beginPath(); edge(); stroke('rgba(255,248,220,.9)', Math.max(.25, r * .06));
    body(); stroke(OUT, clamp(r * .1, .5, 1));
  }
  // ---------------- the hangers: what hangs from the pearl swings, a damped pendulum per orb ----------------
  // HANG: each hanging part and its links. Its painter takes sw, the links' angles (0 hangs as drawn; + swings the lower
  // end back towards -x, as ctx.rotate turns it), plus sw.fl (how fast it is going, 0..1, for a ribbon's flutter) and sw.t.
  // The pendulum lives in the world's frame; blitOrb turns its angles into the picture's by the facing (the picture is
  // mirrored, so the angle's sign flips with it and a turn never makes it jump). The pearl_weapon.js ornaments share it.
  const HANG = { anchor: 1, drops: 1, chain: 3, ribbons: 3 };
  const SW_MAX = .6, SW_G = 1800, SW_A = 2400, SW_W2 = 46, SW_C = 4.6, SW_K = 170, SW_KC = 10; // (SW_A: the sideways shove that tips it a radian)
  const SW0 = Object.assign([0, 0, 0], { fl: 0, t: 0 });
  const swNew = () => ({ a: [0, 0, 0], v: [0, 0, 0], px: null, py: 0, vx: 0, vy: 0, t: Math.random() * 9, fl: 0 });
  const swCopy = (s) => Object.assign({}, s, { a: s.a.slice(), v: s.v.slice() });
  // one step, x and y the pivot's place in the picture (x, y - z). o.drag: how far its speed trails it; o.push: a lean;
  // o.gain: how hard its acceleration shoves it
  function swStep(s, x, y, dt, o) {
    if (!s || !(dt > 0)) return; dt = Math.min(dt, 1 / 30); s.t += dt; o = o || {};
    if (s.px === null || Math.abs(x - s.px) > 140 || Math.abs(y - s.py) > 140) { s.px = x; s.py = y; s.vx = s.vy = 0; return; } // (a jump: a catch, a new place)
    const vx = (x - s.px) / dt, vy = (y - s.py) / dt, ax = clamp((vx - s.vx) / dt, -5000, 5000), ay = clamp((vy - s.vy) / dt, -5000, 5000);
    s.px = x; s.py = y; s.vx = vx; s.vy = vy;
    const g = clamp(1 - ay / SW_G, .35, 2), sp = Math.hypot(vx, vy), a = s.a, v = s.v;
    s.fl += (clamp(sp / 260, 0, 1) - s.fl) * Math.min(1, dt * 4);
    // where it would settle: straight down, a breath of idle sway (the orb's bob), trailed back by its speed, and any lean
    const rest = .05 * Math.sin(s.t * 1.9) + clamp(vx * (o.drag ?? .0003), -.22, .22) + (o.push || 0), kA = (o.gain ?? 1) * SW_W2 / SW_A;
    // the first link: a pendulum on a pivot shoved by the orb's acceleration (it lags as the orb speeds up, swings back, settles)
    v[0] += (-SW_W2 * g * Math.sin(a[0] - rest) + ax * kA * Math.cos(a[0]) - SW_C * v[0]) * dt;
    // each further link follows the one above it, a little late
    for (let i = 1; i < 3; i++) v[i] += (-SW_K * (a[i] - a[i - 1]) + ax * .3 * kA - SW_KC * v[i]) * dt;
    for (let i = 0; i < 3; i++) { a[i] += v[i] * dt; if (a[i] > SW_MAX) { a[i] = SW_MAX; if (v[i] > 0) v[i] *= -.25; } else if (a[i] < -SW_MAX) { a[i] = -SW_MAX; if (v[i] < 0) v[i] *= -.25; } }
  }
  // the angles as a painter takes them: for a picture mirrored (facing < 0) the sign flips. With no pendulum (a card, the
  // badge), a gentle idle sway from the clock
  function swView(s, facing, t) {
    const k = facing < 0 ? -1 : 1;
    if (!s) { const q = .09 * Math.sin(t * 1.9); return Object.assign([q * k, q * 1.2 * k, q * 1.4 * k], { fl: 0, t }); }
    return Object.assign([s.a[0] * k, s.a[1] * k, s.a[2] * k], { fl: s.fl, t: s.t });
  }
  // the parts each trait adds to the orb: [layer, painter(r, pal)] (orb space: the pearl at 0,0 of radius r, facing +x)
  const shellPath = (rx, ry, n = 12) => { ctx.beginPath(); ctx.moveTo(0, ry * 1.05); for (let i = 0; i <= n; i++) { const a = Math.PI * .62 + i / n * Math.PI * 1.76, rr = i % 2 ? .97 : 1.08; ctx.lineTo(Math.cos(a) * rx * rr, Math.sin(a) * ry * rr); } ctx.closePath(); };
  const PART = {
    ring: ['both', (r, p, back) => { ctx.save(); ctx.rotate(-.32); const a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * .44, 0, a0, a1); stroke(OUT, Math.max(1, r * .24));
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * .44, 0, a0, a1); stroke(p.metal, Math.max(.6, r * .14));
      ctx.beginPath(); ctx.ellipse(0, -r * .02, r * 1.7, r * .44, 0, a0, a1); stroke('rgba(255,242,190,.85)', Math.max(.3, r * .05)); ctx.restore(); }],
    // (the tether's links, each turned by its own link angle from the pearl's underside, so the chain bends as it swings)
    chain: ['front', (r, p, sw = SW0) => { let x = -r * .29, y = r * .84; const dx = -r * .42, dy = r * .32;
      for (let i = 0; i < 4; i++) { const a = sw[Math.min(i, 2)], k = i ? 1 : .5, c = Math.cos(a), s = Math.sin(a); x += (dx * c - dy * s) * k; y += (dx * s + dy * c) * k;
        ctx.beginPath(); ctx.ellipse(x, y, r * (i % 2 ? .14 : .3), r * (i % 2 ? .3 : .16), -.6 + a, 0, TAU); stroke(OUT, Math.max(.8, r * .2)); ctx.beginPath(); ctx.ellipse(x, y, r * (i % 2 ? .14 : .3), r * (i % 2 ? .3 : .16), -.6 + a, 0, TAU); stroke(p.metalLt, Math.max(.4, r * .1)); } }],
    coral: ['back', (r) => { ctx.lineCap = 'round'; const br = (x0, y0, x1, y1, w) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 - r * .2, (y0 + y1) / 2, x1, y1); stroke(OUT, w + 1.2); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 - r * .2, (y0 + y1) / 2, x1, y1); stroke('#E2604E', w); ctx.beginPath(); ctx.moveTo(x0 + w * .2, y0); ctx.quadraticCurveTo((x0 + x1) / 2 - r * .25, (y0 + y1) / 2, x1, y1); stroke('#FFA090', w * .35); };
      const w = Math.max(.9, r * .26); br(-r * .2, -r * .6, -r * 1.1, -r * 1.9, w); br(-r * .8, -r * 1.25, -r * 1.7, -r * 1.5, w * .7); br(r * .3, -r * .7, r * .5, -r * 2, w * .85); br(r * .42, -r * 1.4, r * 1.2, -r * 1.75, w * .6); }],
    // a scallop shell fanned out behind the pearl, centred on it and the same on both sides: its hinge under the pearl, ears
    // either side of the hinge, ribs running up into a scalloped rim, silvered inside like a mirror
    scallop: ['back', (r, p) => { ctx.save(); const R = r * 1.95, hy = r * .62, n = 9, A0 = Math.PI * 1.06, A1 = Math.PI * 1.94;
      const fan = (k = 1) => { ctx.beginPath(); ctx.moveTo(0, hy); for (let i = 0; i <= n * 2; i++) { const a = A0 + (A1 - A0) * i / (n * 2), rr = R * k * (i % 2 ? 1.06 : .97); ctx.lineTo(Math.cos(a) * rr, hy + Math.sin(a) * rr); } ctx.closePath(); };
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, hy - r * .1); ctx.lineTo(sd * r * .62, hy - r * .22); ctx.lineTo(sd * r * .7, hy + r * .18); ctx.lineTo(0, hy + r * .2); ctx.closePath(); ctx.fillStyle = p.bladeDk; ctx.fill(); stroke(OUT, inkW(r, .09)); } // the ears
      const g = ctx.createLinearGradient(0, hy - R, 0, hy); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, p.blade); g.addColorStop(1, p.bladeDk); ctx.fillStyle = g; fan(); ctx.fill();
      ctx.save(); fan(); ctx.clip();
      ctx.strokeStyle = 'rgba(60,110,110,.42)'; ctx.lineWidth = Math.max(.4, r * .09); for (let i = 1; i < n * 2; i += 2) { const a = A0 + (A1 - A0) * i / (n * 2); ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(Math.cos(a) * R * 1.1, hy + Math.sin(a) * R * 1.1); ctx.stroke(); } // the ribs
      ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(0, hy - R * .58, R * .7, R * .2, 0, 0, TAU); ctx.fill(); // the mirror's sheen, a band of light across it
      ctx.restore();
      fan(); stroke(p.metal, Math.max(.7, r * .15)); fan(1.05); stroke(OUT, inkW(r, .1)); ctx.restore(); }],
    horn: ['front', (r, p) => { const x0 = r * .6, x1 = r * 3.1, w = r * .42;
      ctx.beginPath(); ctx.moveTo(x0, -w); ctx.quadraticCurveTo(x1 * .7, -w * .5, x1, 0); ctx.quadraticCurveTo(x1 * .7, w * .5, x0, w); ctx.closePath();
      const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#FFFDF4'); g.addColorStop(.6, '#EADFC6'); g.addColorStop(1, '#B8A684'); ctx.fillStyle = g; ctx.fill(); stroke(OUT, inkW(r, .1));
      ctx.strokeStyle = 'rgba(120,100,70,.7)'; ctx.lineWidth = Math.max(.35, r * .06); for (let i = 1; i < 6; i++) { const x = x0 + (x1 - x0) * i / 6, hw = w * (1 - i / 6.5); ctx.beginPath(); ctx.moveTo(x - hw * .5, -hw); ctx.lineTo(x + hw * .5, hw); ctx.stroke(); } }],
    tines: ['front', (r, p) => { ctx.lineCap = 'round'; const t = (y0, y1, len) => { ctx.beginPath(); ctx.moveTo(r * .7, y0); ctx.quadraticCurveTo(r * 1.6, y0, r * len, y1); stroke(OUT, Math.max(1.2, r * .3)); ctx.beginPath(); ctx.moveTo(r * .7, y0); ctx.quadraticCurveTo(r * 1.6, y0, r * len, y1); stroke(p.metal, Math.max(.6, r * .16)); };
      t(-r * .35, -r * .9, 2.3); t(r * .35, r * .9, 2.3); t(0, 0, 2.7); ctx.fillStyle = p.metalLt; for (const [x, y] of [[2.3, -.9], [2.3, .9], [2.7, 0]]) { ctx.beginPath(); ctx.moveTo(r * x, r * y - r * .22); ctx.lineTo(r * (x + .38), r * y); ctx.lineTo(r * x, r * y + r * .22); ctx.closePath(); ctx.fill(); stroke(OUT, inkW(r, .07)); } }],
    swirl: ['both', (r, p, back) => { ctx.lineCap = 'round'; for (let i = 0; i < 2; i++) { const R = r * (1.45 + i * .3), a0 = back ? Math.PI * 1.05 + i : .1 + i, a1 = a0 + Math.PI * .85; ctx.beginPath(); ctx.ellipse(0, r * .1, R, R * .5, -.2, a0, a1); stroke(back ? 'rgba(40,120,130,.85)' : 'rgba(210,250,242,.95)', Math.max(.6, r * (.16 - i * .04))); } }],
    foam: ['front', (r) => { ctx.fillStyle = '#FFFFFF'; for (const [x, y, s] of [[-.5, -1.02, .3], [-.1, -1.18, .34], [.32, -1.1, .3], [.66, -.9, .22]]) { ctx.beginPath(); ctx.arc(r * x, r * y, r * s, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-r * .8, -r * .85); ctx.quadraticCurveTo(-r * .1, -r * 1.55, r * .8, -r * .95); ctx.quadraticCurveTo(r * .3, -r * 1.05, r * .55, -r * .7); stroke('rgba(60,140,150,.7)', Math.max(.4, r * .07)); }],
    shards: ['front', (r, p) => { for (const [a, d, s] of [[-2.3, 1.7, .36], [-.8, 1.9, .3], [2.4, 1.65, .28]]) { const x = Math.cos(a) * r * d, y = Math.sin(a) * r * d * .8, S = r * s; ctx.beginPath(); ctx.moveTo(x, y - S * 1.4); ctx.lineTo(x + S * .6, y); ctx.lineTo(x, y + S); ctx.lineTo(x - S * .6, y); ctx.closePath();
      const g = ctx.createLinearGradient(x - S, y - S, x + S, y + S); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, p.accent); g.addColorStop(1, p.bladeDk); ctx.fillStyle = g; ctx.fill(); stroke(OUT, inkW(r, .07)); } }],
    drops: ['front', (r, p, sw = SW0) => { const x = r * .15, y = r * 1.05; ctx.translate(x, r * .88); ctx.rotate(sw[1]); ctx.translate(-x, -r * .88); ctx.fillStyle = p.metal; ctx.beginPath(); ctx.arc(x, y, r * .2, 0, TAU); ctx.fill(); stroke(OUT, inkW(r, .06));
      ctx.beginPath(); ctx.moveTo(x, y + r * .15); ctx.quadraticCurveTo(x + r * .42, y + r * .75, x, y + r * 1); ctx.quadraticCurveTo(x - r * .42, y + r * .75, x, y + r * .15); const g = ctx.createLinearGradient(x, y, x, y + r); g.addColorStop(0, '#FFE0EA'); g.addColorStop(1, '#C8405A'); ctx.fillStyle = g; ctx.fill(); stroke(OUT, inkW(r, .07));
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x - r * .08, y + r * .5, r * .07, 0, TAU); ctx.fill(); }],
    static: ['front', (r) => { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * .98, 0, TAU); ctx.clip(); ctx.beginPath(); ctx.moveTo(-r, r * .1); for (let i = 1; i <= 6; i++) ctx.lineTo(-r + i * r / 3, r * (i % 2 ? -.18 : .22)); stroke('#5E66C8', Math.max(.6, r * .2)); ctx.beginPath(); ctx.moveTo(-r, r * .1); for (let i = 1; i <= 6; i++) ctx.lineTo(-r + i * r / 3, r * (i % 2 ? -.18 : .22)); stroke('#FFF2A0', Math.max(.35, r * .09)); ctx.restore(); }],
    cloud: ['back', (r) => { const y = -r * 1.65; ctx.fillStyle = '#4A5288'; for (const [x, yy, s] of [[-.55, 0, .42], [0, -.18, .55], [.55, 0, .4]]) { ctx.beginPath(); ctx.arc(r * x, y + r * yy, r * s, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7A84C8'; ctx.beginPath(); ctx.arc(-r * .1, y - r * .3, r * .3, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF2A0'; ctx.beginPath(); ctx.ellipse(0, y + r * .05, r * .2, r * .11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2A2050'; ctx.beginPath(); ctx.arc(0, y + r * .05, r * .07, 0, TAU); ctx.fill(); }],
    halo: ['back', (r, p) => { ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); stroke('rgba(20,14,40,.85)', Math.max(1, r * .45)); ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); stroke('rgba(110,224,192,.75)', Math.max(.3, r * .08)); ctx.beginPath(); ctx.arc(0, 0, r * 1.72, -.6, 1.4); stroke('rgba(110,224,192,.45)', Math.max(.3, r * .06)); }],
    core: ['front', (r) => { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * .99, 0, TAU); ctx.clip(); const g = ctx.createRadialGradient(r * .15, r * .1, 0, r * .15, r * .1, r * .6); g.addColorStop(0, 'rgba(8,6,16,.95)'); g.addColorStop(.7, 'rgba(30,20,60,.7)'); g.addColorStop(1, 'rgba(30,20,60,0)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.fillStyle = '#86F2D6'; ctx.beginPath(); ctx.arc(r * .05, 0, r * .09, 0, TAU); ctx.fill(); ctx.restore(); }],
    // (each ribbon's points turned about its root by the links' angles, the further ones more, and fluttering with speed)
    ribbons: ['back', (r, p, sw = SW0) => { ctx.lineCap = 'round'; for (const [y, k] of [[-r * .35, 1], [r * .3, .8]]) {
      const x0 = -r * .6, pt = (x, yy, i) => { const a = sw[i] * .6 + sw.fl * .14 * Math.sin(sw.t * 11 - i * 1.4 + k * 3), c = Math.cos(a), s = Math.sin(a), dx = x - x0, dy = yy - y; return [x0 + dx * c - dy * s, y + dx * s + dy * c]; };
      const A = pt(-r * 1.6, y - r * .6 * k, 0), B = pt(-r * 2.1, y + r * .5 * k, 1), E = pt(-r * 3, y - r * .2, 2), path = () => { ctx.beginPath(); ctx.moveTo(x0, y); ctx.bezierCurveTo(A[0], A[1], B[0], B[1], E[0], E[1]); };
      path(); stroke(OUT, Math.max(1, r * .32)); path(); stroke(p.accent, Math.max(.5, r * .2)); } }],
    fin: ['front', (r, p) => { ctx.beginPath(); ctx.moveTo(-r * .5, -r * .85); ctx.quadraticCurveTo(-r * .4, -r * 1.9, -r * 1.25, -r * 2.05); ctx.quadraticCurveTo(-r * .2, -r * 1.55, r * .45, -r * .9); ctx.closePath(); const g = ctx.createLinearGradient(0, -r * 2, 0, -r * .8); g.addColorStop(0, p.edge); g.addColorStop(1, p.bladeDk); ctx.fillStyle = g; ctx.fill(); stroke(OUT, inkW(r, .08)); }],
    cage: ['front', (r, p) => { for (const [k, rot] of [[.42, 0], [1, 0], [.42, Math.PI / 2]]) { ctx.beginPath(); if (rot) ctx.ellipse(0, 0, r * 1.15, r * 1.15 * k, 0, 0, TAU); else ctx.ellipse(0, 0, r * 1.15 * k, r * 1.15, 0, 0, TAU); stroke(OUT, Math.max(.9, r * .22)); ctx.beginPath(); if (rot) ctx.ellipse(0, 0, r * 1.15, r * 1.15 * k, 0, 0, TAU); else ctx.ellipse(0, 0, r * 1.15 * k, r * 1.15, 0, 0, TAU); stroke(p.metal, Math.max(.5, r * .12)); }
      ctx.fillStyle = p.metalLt; ctx.beginPath(); ctx.arc(0, -r * 1.2, r * .2, 0, TAU); ctx.fill(); stroke(OUT, inkW(r, .06)); }],
    anchor: ['front', (r, p, sw = SW0) => { const x = -r * .1, y = r * 1.2; ctx.translate(x, r * .98); ctx.rotate(sw[0]); ctx.translate(-x, -r * .98); ctx.lineCap = 'round'; const a = () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + r * 1.1); ctx.moveTo(x - r * .3, y + r * .25); ctx.lineTo(x + r * .3, y + r * .25); ctx.moveTo(x - r * .5, y + r * .75); ctx.quadraticCurveTo(x, y + r * 1.35, x + r * .5, y + r * .75); };
      a(); stroke(OUT, Math.max(1.1, r * .26)); a(); stroke(p.metal, Math.max(.5, r * .13)); ctx.beginPath(); ctx.arc(x, y - r * .05, r * .14, 0, TAU); stroke(p.metal, Math.max(.4, r * .08)); }],
    charm: ['front', (r, p) => { const x = r * 1.25, y = -r * 1.05, R = r * .42; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.arc(x + R * .45, y - R * .2, R * .85, 0, TAU, true); ctx.fillStyle = p.metalLt; ctx.fill('evenodd'); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); stroke(OUT, inkW(r, .06)); }],
    wave: ['front', (r, p) => { ctx.beginPath(); ctx.moveTo(-r * 1.4, r * 1.05); ctx.quadraticCurveTo(-r * .3, r * .55, r * .35, r * .95); ctx.quadraticCurveTo(r * .8, r * 1.2, r * .55, r * .7); ctx.quadraticCurveTo(r * 1.3, r * .8, r * 1.3, r * 1.3); ctx.lineTo(-r * 1.4, r * 1.3); ctx.closePath();
      const g = ctx.createLinearGradient(0, r * .6, 0, r * 1.3); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, p.b[3]); ctx.fillStyle = g; ctx.fill(); stroke(OUT, inkW(r, .07)); }],
    stillring: ['back', (r, p) => { ctx.beginPath(); ctx.ellipse(0, -r * 1.45, r * .95, r * .26, 0, 0, TAU); stroke(OUT, Math.max(.9, r * .2)); ctx.beginPath(); ctx.ellipse(0, -r * 1.45, r * .95, r * .26, 0, 0, TAU); stroke('#FFF2C8', Math.max(.45, r * .1)); }],
    dial: ['back', (r, p) => { ctx.fillStyle = p.metal; ctx.beginPath(); ctx.arc(-r * .3, -r * .1, r * 1.42, 0, TAU); ctx.fill(); stroke(OUT, inkW(r, .08)); ctx.strokeStyle = p.metalLt; ctx.lineWidth = Math.max(.35, r * .07);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(-r * .3 + Math.cos(a) * r * 1.18, -r * .1 + Math.sin(a) * r * 1.18); ctx.lineTo(-r * .3 + Math.cos(a) * r * 1.36, -r * .1 + Math.sin(a) * r * 1.36); ctx.stroke(); } }],
    maelstrom: ['back', (r, p) => { ctx.save(); ctx.scale(1, .42); ctx.translate(0, r * 2.6); for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 1.6 + i * 2.1, R = r * (.4 + k / 20 * 1.6); k ? ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R) : ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); } stroke(i ? 'rgba(160,232,224,.75)' : 'rgba(30,100,112,.9)', Math.max(.5, r * .16)); } ctx.restore(); }],
    corallance: ['front', (r) => { ctx.lineCap = 'round'; const br = (x0, y0, x1, y1, w) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); stroke(OUT, w + 1.2); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); stroke('#E2604E', w); };
      const w = Math.max(.8, r * .24); br(r * .7, 0, r * 3, -r * .1, w); br(r * 1.7, -r * .05, r * 2.3, -r * .7, w * .7); br(r * 2.2, -r * .08, r * 2.7, r * .5, w * .6); br(r * 1.3, 0, r * 1.6, r * .55, w * .55); }],
    bolt: ['front', (r) => { const x = r * 1.2, y = -r * 1.5; ctx.beginPath(); ctx.moveTo(x - r * .1, y - r * .6); ctx.lineTo(x + r * .32, y - r * .6); ctx.lineTo(x + r * .05, y - r * .05); ctx.lineTo(x + r * .35, y - r * .05); ctx.lineTo(x - r * .25, y + r * .7); ctx.lineTo(x - r * .02, y + r * .1); ctx.lineTo(x - r * .3, y + r * .1); ctx.closePath(); ctx.fillStyle = '#FFF2A0'; ctx.fill(); stroke(OUT, inkW(r, .07)); }],
  };
  // the Edge traits: they make the orb the spinning Nacre Blade (drawn on their own, rotated), not parts round the pearl
  const SPIN = { crescent: 1, serrate: 1, thunder: 1 };
  // (only: 'still' leaves the hangers out, for the cached pictures; 'hang' draws just the hangers, live, swung by sw.
  // With no sw, a card's gentle idle sway from t)
  function drawOrbParts(picks, r, pal, t, layer, only, sw) {
    if (!sw) sw = swView(null, 1, t || 0);
    for (const id of picks) { const T = TR[id]; if (!T || SPIN[T.part]) continue; const P_ = PART[T.part]; if (!P_) continue;
      const h = !!HANG[T.part]; if ((only === 'still' && h) || (only === 'hang' && !h)) continue;
      const L = P_[0]; if (L === 'both') { ctx.save(); P_[1](r, pal, layer === 'back'); ctx.restore(); } else if (L === layer) { ctx.save(); P_[1](r, pal, sw); ctx.restore(); } }
  }
  function drawSpinner(picks, r, pal, spin) {
    if (!hasSpin(picks)) return;
    const ar = r * BLADE_R, lit = picks.includes('thunder'), teeth = picks.includes('serrate');
    for (let i = 0; i < 3; i++) crescentBlade(ar, spin + i * TAU / 3, pal, lit, teeth);
  }
  // the Nacre Blade's sweep of light behind its turning blades (as the Growing Pearl's blade had in the street)
  function bladeSweep(r, spin, rgb) {
    if (FLASH || TINT) return; const ar = r * BLADE_R;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb || '190,245,235'},.22)`; ctx.lineWidth = ar * 1.6; ctx.beginPath(); ctx.arc(0, 0, ar * 1.7, spin, spin + 4.2); ctx.stroke(); ctx.restore();
  }
  // the whole orb, at 0,0 (cards draw it straight; the street uses the cached picture below)
  // (an Edge orb's pearl is the small hub of its blades, and the other parts sit round that hub)
  function drawOrb(picks, r, pal, t, spin) {
    const hr = hasSpin(picks) ? r * HUB : r;
    drawOrbParts(picks, hr, pal, t, 'back');
    drawSpinner(picks, r, pal, spin);
    pearlBody(0, 0, hr, t, 1 + Math.min(4, picks.length), pal, !picks.length || V2());
    drawOrbParts(picks, hr, pal, t, 'front');
  }
  const palOf = (picks) => PAL[prof(picks).current[0] || 'pearl'];
  // cached: the orb's still parts as pictures (the parts behind the pearl, the parts in front; redrawn only when a pick
  // changes them), its spinning crescents, and the pearl itself, its Pattern turning, as a ring of kept frames
  const SPR = new Map(), SC = 4;
  function withCtx(g, fn) { const old = ctx; ctx = g; try { fn(); } finally { ctx = old; } }
  // (each picture is painted at about the scale it is shown at, so it is never shrunk a long way and left ragged)
  const resOf = () => { const m = ctx.getTransform(); return clamp(Math.ceil(Math.hypot(m.a, m.b) * 2) / 2, 1, 8); };
  function sprite(picks, r, kind, sc = SC) {
    const key = kind + picks.join(',') + '|' + r.toFixed(1) + '@' + sc;
    let c = SPR.get(key); if (c) return c;
    if (SPR.size > 36) SPR.clear();
    const ext = r * (kind === 'spin' ? 2.8 : 3.4); c = document.createElement('canvas'); c.width = c.height = Math.max(8, Math.ceil(ext * 2 * sc)); c.ext = ext;
    const g = c.getContext('2d'), pal = palOf(picks);
    withCtx(g, () => { g.setTransform(sc, 0, 0, sc, ext * sc, ext * sc); if (kind === 'spin') drawSpinner(picks, r, pal, 0); else if (kind === 'nacre') nacreBody(0, 0, r, 0, 1 + Math.min(4, picks.length), pal); else drawOrbParts(picks, r, pal, 0, kind, 'still'); });
    SPR.set(key, c); return c;
  }
  // the pearl's frames: the Pattern in it turns at 1.5 a second, both ways, so CORE_N frames go once round in CORE_P seconds
  const CORE = new Map(), CORE_N = 32, CORE_P = TAU / 1.5;
  function coreSprite(r, t, sc = SC) {
    const f = Math.floor((((t % CORE_P) + CORE_P) % CORE_P) / CORE_P * CORE_N) % CORE_N, key = f + '|' + r.toFixed(1) + '@' + sc;
    let c = CORE.get(key); if (c) return c;
    if (CORE.size > 160) CORE.clear();
    const ext = r * 1.1 + 1; c = document.createElement('canvas'); c.width = c.height = Math.max(4, Math.ceil(ext * 2 * sc)); c.ext = ext;
    withCtx(c.getContext('2d'), () => { ctx.setTransform(sc, 0, 0, sc, ext * sc, ext * sc); pearlBody(0, 0, r, f / CORE_N * CORE_P, 1, null, true); });
    CORE.set(key, c); return c;
  }
  const hasSpin = (picks) => picks.some(id => TR[id] && SPIN[TR[id].part]);
  // (hang: whether it asks after the hangers, drawn live, or the still parts, in the cached pictures)
  const hasLayer = (picks, layer, hang) => picks.some(id => TR[id] && PART[TR[id].part] && !SPIN[TR[id].part] && !!HANG[TR[id].part] === !!hang && (PART[TR[id].part][0] === layer || PART[TR[id].part][0] === 'both'));
  // (sw: the orb's pendulum, for its hangers; without one they sway gently on their own)
  function blitOrb(picks, x, y, r, facing, spin, alpha = 1, sw) {
    ctx.save(); ctx.translate(x, y); if (alpha < 1) ctx.globalAlpha *= alpha; const sc = resOf();
    const glowRgb = picks && picks.length ? palOf(picks).glow : null, edge = hasSpin(picks), hr = edge ? r * HUB : r;
    orbGlow(r, glowRgb); // (behind everything it is: it never covers the orb's own detail)
    ctx.save(); if (facing < 0) ctx.scale(-1, 1);
    if (edge) { bladeSweep(r, spin, glowRgb); const s = sprite(picks, r, 'spin', sc); ctx.save(); ctx.rotate(spin); ctx.drawImage(s, -s.ext, -s.ext, s.ext * 2, s.ext * 2); ctx.restore(); }
    if (hasLayer(picks, 'back')) { const c = sprite(picks, hr, 'back', sc); ctx.drawImage(c, -c.ext, -c.ext, c.ext * 2, c.ext * 2); }
    const hb = hasLayer(picks, 'back', 1), hf = hasLayer(picks, 'front', 1), A = hb || hf ? swView(sw, facing, performance.now() / 1000) : null;
    if (hb) drawOrbParts(picks, hr, palOf(picks), 0, 'back', 'hang', A);
    ctx.restore();
    // (the pearl is not turned with him: its light stays at the upper left, as on the relic; an Edge orb's is the small hub)
    const k = picks && picks.length && !V2() ? sprite(picks, hr, 'nacre', sc) : coreSprite(hr, performance.now() / 1000, sc); ctx.drawImage(k, -k.ext, -k.ext, k.ext * 2, k.ext * 2);
    if (facing < 0) ctx.scale(-1, 1);
    if (hasLayer(picks, 'front')) { const c = sprite(picks, hr, 'front', sc); ctx.drawImage(c, -c.ext, -c.ext, c.ext * 2, c.ext * 2); }
    if (hf) drawOrbParts(picks, hr, palOf(picks), 0, 'front', 'hang', A);
    ctx.restore();
  }
  // a soft light of its own behind the Pearl, slowly breathing: pearl-white while it is bare, its Current's colour once shaped
  function orbGlow(r, rgb) {
    if (FLASH || TINT) return;
    const t = performance.now() / 1000, pu = .5 + .5 * Math.sin(t * 2.4), R = Math.max(r * 3.6, 17) * (1 + .15 * pu);
    if (rgb) { const hg = ctx.createRadialGradient(0, 0, r * .5, 0, 0, R); hg.addColorStop(0, `rgba(${rgb},${.56 + .16 * pu})`); hg.addColorStop(.4, `rgba(${rgb},${.24 + .08 * pu})`); hg.addColorStop(1, `rgba(${rgb},0)`);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore(); return; } // a shaped Pearl glows in its own colour, behind its parts
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createRadialGradient(0, 0, r * .4, 0, 0, R);
    hg.addColorStop(0, `rgba(240,252,255,${.62 + .2 * pu})`); hg.addColorStop(.3, `rgba(200,240,245,${.34 + .14 * pu})`); hg.addColorStop(.6, `rgba(180,225,240,${.12 + .06 * pu})`); hg.addColorStop(1, 'rgba(170,220,235,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // the card's picture: the orb as it would be with this trait taken, the new part flaring
  function pickArt(cv2, picks, T, t) {
    const g = cv2.getContext('2d'), w = cv2.width, h = cv2.height, next = picks.concat([T.id]), pal = palOf(next);
    withCtx(g, () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      const bg = g.createRadialGradient(w / 2, h * .45, 4, w / 2, h * .5, w * .62); bg.addColorStop(0, '#2E6E70'); bg.addColorStop(.6, '#123A44'); bg.addColorStop(1, '#06161C'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(150,230,215,.12)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w / 2, h * .84, w * (.12 + i * .1), h * (.04 + i * .025), 0, 0, TAU); g.stroke(); } g.restore();
      const r = h * .13, cx = w / 2 - r * .3, cy = h * .47 + Math.sin(t * 2) * h * .015;
      glow(cx, cy, r * 4, pal.glow, .28 + .1 * Math.sin(t * 3));
      // the new part's flare, behind the orb (its light round the pearl, never over it)
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 + .25 * Math.sin(t * 4); glow(cx, cy, r * 2.4, '255,240,200', .5); g.restore();
      g.save(); g.translate(cx, cy); drawOrb(next, r, pal, t, t * 2.2); g.restore();
      g.strokeStyle = T.req ? 'rgba(255,210,122,.75)' : 'rgba(242,214,138,.55)'; g.lineWidth = 2; g.strokeRect(5, 5, w - 10, h - 10); });
  }

  // ---------------- in the street ----------------
  function drawWave(p) { // a whirlpool on the floor
    const a = Math.min(1, p.t / .15, (p.max - p.t) / .3), t = CUR.clock, col = p.pal ? p.pal.glow : '190,250,240';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const r = p.r * (.3 + i * .22), s = t * (5 - i * .7); ctx.strokeStyle = `rgba(${col},${.4 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r / 2.4, 0, s, s + 3.6); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(20,70,90,${.28 * a})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * .5, p.r * .2, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  function drawShot(s, t) {
    const S = s.S, pal = S.pal, y = s.y - s.z;
    if (s.k === 'burst') { const u = s.t / s.max, R = s.R * sm(s.t / (s.max * .7)), fa = 1 - u;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${pal.glow},${.85 * fa})`; ctx.lineWidth = 5 * fa + 1; ctx.beginPath(); ctx.ellipse(s.x, s.y - 20, R, R * .55, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${.8 * fa})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(s.x, s.y - 20, R * .9, R * .5, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = `rgba(${pal.glow},${.12 * fa})`; ctx.beginPath(); ctx.ellipse(s.x, s.y, R, R / 2.4, 0, 0, TAU); ctx.fill(); ctx.restore();
      if (S.f.has('scallop') || S.f.has('coral')) { ctx.save(); ctx.globalAlpha = fa; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + s.t * 3; ctx.save(); ctx.translate(s.x + Math.cos(a) * R * .85, s.y - 20 + Math.sin(a) * R * .47); ctx.scale(.5, .5); PART[S.f.has('coral') ? 'coral' : 'scallop'][1](8, pal); ctx.restore(); } ctx.restore(); }
      return; }
    if (s.k === 'shard') { ctx.save(); ctx.translate(s.x, y); ctx.rotate(s.spin); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(1.8, 0); ctx.lineTo(0, 3); ctx.lineTo(-1.8, 0); ctx.closePath(); ctx.fillStyle = pal.accent; ctx.fill(); stroke(OUT, .6); ctx.restore(); return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createLinearGradient(s.x, 0, s.x - s.dir * (s.k === 'lance' ? s.len * 1.3 : 50), 0); lg.addColorStop(0, `rgba(${pal.glow},.6)`); lg.addColorStop(1, `rgba(${pal.glow},0)`);
    ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(s.x - s.dir * (s.k === 'lance' ? s.len * .6 : 24), y, s.k === 'lance' ? s.len * .7 : 26, s.r * (s.k === 'lance' ? 1.4 : .9), 0, 0, TAU); ctx.fill(); ctx.restore();
    if (s.k === 'lance') { const lanes = S.tines === 3 ? [-14, 0, 14] : [0];
      for (const o of lanes) { const ly = y + o, x0 = s.x - s.dir * s.len, w = s.r * .8; ctx.beginPath(); ctx.moveTo(x0, ly - w * .5); ctx.lineTo(s.x - s.dir * s.r * 2, ly - w); ctx.lineTo(s.x + s.dir * s.r * 1.2, ly); ctx.lineTo(s.x - s.dir * s.r * 2, ly + w); ctx.lineTo(x0, ly + w * .5); ctx.closePath();
        const g = ctx.createLinearGradient(0, ly - w, 0, ly + w); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, pal.blade); g.addColorStop(1, pal.bladeDk); ctx.fillStyle = g; ctx.fill(); stroke(OUT, .9);
        if (S.f.has('narwhal')) { ctx.strokeStyle = 'rgba(80,80,90,.45)'; ctx.lineWidth = .6; for (let i = 1; i < 6; i++) { const x = x0 + s.dir * (s.len - s.r * 2) * i / 6; ctx.beginPath(); ctx.moveTo(x - 1.5, ly - w * .7); ctx.lineTo(x + 1.5, ly + w * .7); ctx.stroke(); } } }
      return; }
    if (s.k === 'orb' || s.k === 'disc') { glow(s.x, y, s.r * 3, pal.glow, .25); blitOrb(S.picks, s.x, y, s.r, s.dir, s.spin, 1); return; }
    glow(s.x, y, s.r * 3, pal.glow, .3); pearlBody(s.x, y, s.r, t, 2, pal, !(S.picks && S.picks.length) || V2());
  }
  // the currents on the floor: a dark band of moving water along his wake, foam lines running in it, and the current he
  // is laying just ahead of his feet
  function drawCurrents(t) {
    const tr = CUR.trail, now = CUR.clock;
    if (tr.length > 2) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < tr.length; i++) { const a = tr[i - 1], b = tr[i], age = (now - b.t) / .75, k = (1 - age) * Math.min(1, b.s / 320); if (k <= .02) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d * .5;
          if (pass === 0) { ctx.strokeStyle = `rgba(28,92,104,${.42 * k})`; ctx.lineWidth = 13 * (.5 + .5 * k); ctx.beginPath(); ctx.moveTo(a.x, a.y + 1); ctx.lineTo(b.x, b.y + 1); ctx.stroke(); continue; }
          const off = (pass - 2) * 4.5 * (.6 + .6 * (1 - k)), wob = Math.sin(b.t * 30 + pass * 2 - t * 6) * 1.4;
          ctx.strokeStyle = pass === 2 ? `rgba(240,255,252,${.9 * k})` : `rgba(170,232,224,${.75 * k})`; ctx.lineWidth = pass === 2 ? 2 * k + .5 : 1.4 * k + .4;
          ctx.beginPath(); ctx.moveTo(a.x + nx * (off + wob), a.y + ny * (off + wob) + 1); ctx.lineTo(b.x + nx * (off + wob), b.y + ny * (off + wob) + 1); ctx.stroke(); }
      }
      ctx.restore();
    }
    if (CUR.lay > .05 && P.z < 4) { // the current under his feet, flowing the way the stick holds
      const a = CUR.layA, ca = Math.cos(a), sa = Math.sin(a) * .5, L = 34, al = CUR.lay;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(28,92,104,${.32 * al})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(P.x - ca * 10, P.y - sa * 10 + 1); ctx.lineTo(P.x + ca * L, P.y + sa * L + 1); ctx.stroke();
      for (let i = 0; i < 4; i++) { const ph = ((t * 2.4 + i / 4) % 1), px = P.x + ca * (-10 + ph * (L + 10)), py = P.y + sa * (-10 + ph * (L + 10)) + 1, side = (i % 2 ? 1 : -1) * 3, ex = -sa * 2 * side, ey = ca * .5 * side;
        ctx.strokeStyle = `rgba(235,255,250,${.75 * al * Math.sin(ph * Math.PI)})`; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px + ex - ca * 5, py + ey - sa * 5); ctx.lineTo(px + ex + ca * 3, py + ey + sa * 3); ctx.stroke(); }
      ctx.restore();
    }
  }
  const shadowAt = (x, y, z, rr) => onMain(() => { ctx.fillStyle = `rgba(10,20,30,${clamp(.28 - z / 400, .06, .28)})`; ctx.beginPath(); ctx.ellipse(x, y, rr * 1.2, rr * .4, 0, 0, TAU); ctx.fill(); });
  // the orb in flight: a ribbon of light along its path, the orb itself turning fast (an Edge orb wheels as the Nacre Blade)
  function drawThrow(th, t) {
    const S = th.S, pal = S.pal, y = th.y - th.z, tr = th.trail;
    shadowAt(th.x, th.y, th.z, th.r);
    onMain(() => { if (tr.length >= 6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 2; i < tr.length; i += 2) { const k = i / tr.length; ctx.strokeStyle = `rgba(${pal.glow},${(.55 * k).toFixed(2)})`; ctx.lineWidth = th.r * 1.5 * k + 1; ctx.beginPath(); ctx.moveTo(tr[i - 2], tr[i - 1]); ctx.lineTo(tr[i], tr[i + 1]); ctx.stroke(); }
        ctx.restore(); }
      glow(th.x, y, th.r * 3.2, pal.glow, th.perfect ? .5 : .3); });
    blitOrb(S.picks, th.x, y, th.r, th.phase === 'back' ? -th.dir : th.dir, th.spin, th.ghost ? .8 : 1, th.sw);
  }
  function orbItems(list, t) {
    if (O.rise) { const R = O.rise, pk = ES().picks, rr = 3.6 + 1.05 * pk.length + 2 * sm(R.t / .8) * (1 - sm((R.t - 2) / 1));
      list.push([R.y + .4, () => { onMain(() => { glow(R.x, R.y - R.z, rr * 6, '220,250,240', .35); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(242,214,138,.5)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const q = (t * 1.2 + i / 3) % 1; ctx.beginPath(); ctx.arc(R.x, R.y - R.z, rr * (1.4 + q * 3), 0, TAU); ctx.globalAlpha = 1 - q; ctx.stroke(); } ctx.restore(); }); blitOrb(pk, R.x, R.y - R.z, rr, P.facing, t * 2); }]); }
    if (O.on && P && !O.rise && !O.throws.length) {
      const pk = ES().picks, pal = palOf(pk), r = O.r * (1 + .25 * O.pop), sy = O.y - O.z, front = O.chg !== null;
      const k = O.chg !== null ? clamp(O.chg / GLEAM, 0, 1) : 0, gl = O.chg !== null && O.chg >= GLEAM && O.chg <= GLEAM + PCW();
      list.push([O.y - .02, () => { shadowAt(O.x, O.y, O.z, r); onMain(() => glow(O.x, sy, r * (3.4 + 2 * k), gl ? '255,244,200' : pal.glow, .2 + .25 * O.flash + .25 * k + (gl ? .3 : 0))); }]);
      list.push([front ? P.y + .3 : P.y - .3, () => { blitOrb(pk, O.x, sy, r, P.facing, t * (hasSpin(pk) ? 9 : 2.4), 1, O.sw);
        if (pk.includes('static') || pk.includes('thunder') || pk.includes('squall')) { if (Math.random() < .35) { ctx.save(); ctx.strokeStyle = '#E8ECFF'; ctx.lineWidth = .8; ctx.beginPath(); const a = rand(0, TAU); let x = O.x + Math.cos(a) * r, y = sy + Math.sin(a) * r; ctx.moveTo(x, y); for (let i = 0; i < 3; i++) { x += Math.cos(a) * r * .5 + rand(-2, 2); y += Math.sin(a) * r * .5 + rand(-2, 2); ctx.lineTo(x, y); } ctx.stroke(); ctx.restore(); } } }]);
    }
    for (const th of O.throws) list.push([th.y + .05, () => drawThrow(th, t)]);
    for (const s of O.shots) list.push([s.y + .05, () => drawShot(s, t)]);
    for (const p of O.pools) list.push([p.y - .3, () => onMain(() => drawWave(p))]);
  }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (O.on) box(O.x, O.y, O.z, 60, 70); for (const th of O.throws) box(th.x, th.y, th.z, 60, 70); if (O.rise) box(O.rise.x, O.rise.y, O.rise.z, 70, 80); for (const s of O.shots) box(s.x, s.y, s.z || 0, s.k === 'burst' ? (s.R || 60) + 20 : s.k === 'lance' ? (s.len || 40) + 30 : 50, s.k === 'burst' ? 90 : 60); for (const p of O.pools) box(p.x, p.y, 0, p.r + 20, 40); }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    if (curOn() && (CUR.trail.length > 2 || CUR.lay > .05)) list.push([FLOOR_TOP - 4, () => onMain(() => drawCurrents(t))]);
    orbItems(list, t); }; }

  // ---------------- the weapon card's badge: the orb (or the weapon's sigil), a ring as the shot gathers, a pip per choice ----------------
  let hudCv = null, hudN = 0;
  function hudBadge() {
    if (!hudCv) { const cardEl = document.querySelector('.wcard'); if (!cardEl) return; hudCv = document.createElement('canvas'); hudCv.id = 'pearlNgHud'; hudCv.width = 64; hudCv.height = 64;
      hudCv.style.cssText = 'position:absolute;right:-13px;bottom:-11px;width:26px;height:26px;z-index:1;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))'; cardEl.appendChild(hudCv); }
    const S = P && (mode === 'play' || mode === 'pause') ? curStats() : null; hudCv.hidden = !S; if (!S) return;
    const ready = O.chg !== null ? clamp(O.chg / GLEAM, 0, 1) : O.throws.length ? 0 : 1 - clamp(O.cd / Math.max(.01, S.cd), 0, 1), sig = ready.toFixed(2) + S.picks.join() + (O.chg !== null);
    if ((hudN++ % 3) && hudCv.dataset.k === sig) return; hudCv.dataset.k = sig;
    hudCv.title = `The Pearl of Judgement: ${S.name} (Light + Heavy)${held() ? '' : ` · ${S.n} of ${PICKS} choices`}`;
    const g = hudCv.getContext('2d'), pal = S.pal;
    withCtx(g, () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 64, 64);
      const bg = g.createRadialGradient(32, 28, 2, 32, 32, 28); bg.addColorStop(0, '#2A6A6C'); bg.addColorStop(1, '#071A20'); g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 27, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(20,14,8,.9)'; g.lineWidth = 6; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.stroke();
      g.strokeStyle = ready >= 1 ? (O.chg !== null && O.chg >= GLEAM ? '#FFFFFF' : '#F2D68A') : `rgba(${pal.glow},.85)`; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 28, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(.02, ready)); g.stroke();
      if (!held()) for (let i = 0; i < PICKS; i++) { const a = Math.PI / 2 + (i - (PICKS - 1) / 2) * .38; g.fillStyle = i < S.n ? '#F2D68A' : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(32 + Math.cos(a) * 21, 32 + Math.sin(a) * 21, 2.6, 0, TAU); g.fill(); }
      const pk = S.picks, r = 8 + .9 * Math.min(5, pk.length); blitOrb(pk, 32, 30, r, 1, performance.now() / 400); });
  }
  { const _ht = hudTick; hudTick = function () { _ht(); try { hudBadge(); } catch (e) {} }; }

  // ---------------- the forge: the relic row's words ----------------
  W7.ngText = () => {
    const s = save.pearlEvo && Array.isArray(save.pearlEvo.picks) ? save.pearlEvo.picks.filter(id => TR[id]) : [];
    const evo = forged() ? `Light + Heavy: the boomerang throw.`
      : `Light + Heavy: throw the Pearl. Beat a boss to choose a trait.${s.length ? ` (${s.length} of ${PICKS})` : ''}`;
    const cur = 'Hold a direction to glide. Dodge to fling yourself.';
    const on = [SW.evolve || forged() ? evo : '', SW.currents ? cur : ''].filter(Boolean).join(' ');
    if (!owned()) return `Wakes in New Game+. ${on}`;
    return on || '(Switched off.)';
  };
  { const _of = openForge; openForge = function (kicker) { _of(kicker); try { const row = document.getElementById('w7relicRow'); if (row && row.firstChild && row.firstChild.getContext) withCtx(row.firstChild.getContext('2d'), () => { const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 40, 40); const pk = forged() ? save.pearlForge.picks || [] : save.pearlEvo ? (save.pearlEvo.picks || []).filter(id => TR[id]) : []; blitOrb(pk, 20, 21, 6 + .6 * Math.min(5, pk.length), 1, 0); }); } catch (e) { console.error(e); } }; }

  // ---------------- for the weapon (pearl_weapon.js), the dev panel and tests ----------------
  window.PEARLNG = {
    state: () => ({ owned: owned(), evolve: evoOn(), forged: forged(), held: held(), currents: curOn(), picks: picksNow().slice(), seed: save.pearlEvo ? save.pearlEvo.seed : null, cd: O.cd, chg: O.chg, shots: O.shots.length, throws: O.throws.length, pools: O.pools.length,
      vx: CUR.vx, vy: CUR.vy, speed: speedE(), orb: { on: O.on, x: O.x, y: O.y, z: O.z, r: O.r }, pending: !!(typeof stage !== 'undefined' && stage && pickPending()), card: !!card }),
    TRAITS, TR, AX, AXNAME, TAGNAME, PAL, PICKS, prof, offers, stats, curStats, ES, take, autoPick, pick: openPick, choose, card: () => card && card.opts.map(t => t.id),
    fire: (o) => { const S = curStats(); return S ? fire(S, o) : false; }, legDmg: (S) => legDmg(S || curStats()), wBest,
    procs, hitFoe, addPool, owned, forged, held, evoOn, curOn, O, CUR, T, GLEAM,
    art: { pearlBody, drawOrb, drawOrbParts, drawSpinner, blitOrb, crescentBlade, PART, glow, withCtx, sparkle, palOf, HANG, swNew, swStep, swView },
    style: (v) => { try { if (v === 'v2' || v === true) localStorage.setItem(STYLE_KEY, 'v2'); else if (v !== undefined) localStorage.removeItem(STYLE_KEY); } catch (e) {} SPR.clear(); return V2() ? 'v2' : 'v3'; }, V2,
    devJump: (i) => { if (!evoOn()) return; const want = Math.min(PICKS, Math.max(0, i | 0)); if (ES().picks.length < want) autoPick(want); },
  };
})();
