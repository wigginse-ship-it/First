'use strict';
// ---------- the foes' shots, each its own ----------
// Every foe that fires from range (the 'shoot' and 'volley' plans in world.js, and the few world plans that put a plain
// shot in flight) used to throw the same glowing orb. Here each shot is tagged at the moment it is loosed with what
// loosed it (p.look), and drawn as that: the Thorn Archer's leaf-fletched arrow, flying on an arc and sticking in the
// ground when it misses; the Aether Gunner's brass slug on a cyan tracer; the Rift Witch's twisting bolt; the Pollen
// Pixie's puff of pollen with petals spinning round it; brass shells, steam slugs, prism shards, jelly-light, a Logrus
// serpent, a glaring lens, a little eclipse, moon dust, silver quills. Each has its own small flourish where it lands.
// Only the look changes: every shot keeps its speed, damage, hitbox and timing (the arrow's arc is drawn over its true,
// level flight, meeting it again where the prince stands). The shapes are painted once into offscreen canvases and laid
// down turned along the flight; the moving parts (ribbons, tendrils, trails) are a few strokes each, fewer in a crowd.
// What it hooks (visual only): bolt(e, y) and execute(e) (to tag the shots), updateWorld (the arc, trails, landings),
// drawProj (the painters). A shot that already has its own look (fire, ground waves, apples, clock hands, the Mouth's
// bolt) is left alone.
const EPROJ = (() => {
  const RS = 4, INKC = '#2A1B2C', cache = new Map();
  const lite = () => (typeof PAINT_LITE !== 'undefined' && PAINT_LITE) || (typeof PAINT_Q !== 'undefined' && PAINT_Q === 0);
  const busy = () => lite() || (typeof CROWD !== 'undefined' && CROWD);
  // a sprite: w x h units, anchored at (ax, ay) units from its top left; paint(g) draws in units with the anchor at 0,0
  function sprite(key, w, h, ax, ay, paint) {
    let S = cache.get(key); if (S) return S;
    const c = document.createElement('canvas'); c.width = Math.ceil(w * RS); c.height = Math.ceil(h * RS);
    const g = c.getContext('2d'); g.setTransform(RS, 0, 0, RS, ax * RS, ay * RS); g.lineJoin = 'round'; g.lineCap = 'round'; paint(g);
    S = { c, w, h, ax, ay }; cache.set(key, S); return S;
  }
  // lay a sprite down at x, y: flipped to the shot's side (d), turned along its flight (rot), sc times its size
  function put(S, x, y, sc = 1, rot = 0, d = 1, sy = 1) {
    ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); if (rot) ctx.rotate(rot); ctx.scale(sc, sc * sy);
    ctx.drawImage(S.c, -S.ax, -S.ay, S.w, S.h); ctx.restore();
  }
  // a soft round glow (rgb 'r,g,b'), cached per colour
  const glow = (rgb, a = .8) => sprite('glow' + rgb + a, 32, 32, 16, 16, (g) => {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 16); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.35, `rgba(${rgb},${a * .45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(-16, -16, 32, 32); });
  function lit(fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; try { fn(); } finally { ctx.restore(); } }
  const star4 = (g, x, y, r, k = .3) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * k : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };

  // ---------------- the sprites (all drawn pointing along +x, the tip at the anchor unless said) ----------------
  const SPR = {
    // the Thorn Archer's arrow: a bark-brown shaft set with little thorns, a leaf-blade head of dark iron, two green leaves
    // for fletching and a red-wrapped nock. 32 units long, anchored at its point
    arrow: () => sprite('arrow', 36, 12, 33, 6, (g) => {
      g.lineCap = 'butt';
      g.strokeStyle = INKC; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-30.5, 0); g.lineTo(-3, 0); g.stroke();
      g.strokeStyle = '#8A5A32'; g.lineWidth = 1.3; g.stroke();
      g.strokeStyle = '#C89A62'; g.lineWidth = .45; g.beginPath(); g.moveTo(-30, -.35); g.lineTo(-4, -.35); g.stroke();
      g.fillStyle = '#4A2E18'; for (const [x, s] of [[-21, -1], [-15.5, 1], [-10, -1]]) { g.beginPath(); g.moveTo(x - 1.2, s * .5); g.lineTo(x + .9, s * 2.1); g.lineTo(x + .5, s * .5); g.closePath(); g.fill(); }
      // the head: a leaf of dark iron, a lit edge along its top
      g.beginPath(); g.moveTo(1.2, 0); g.quadraticCurveTo(-3, -2.9, -7, -.9); g.lineTo(-6, 0); g.lineTo(-7, .9); g.quadraticCurveTo(-3, 2.9, 1.2, 0); g.closePath();
      g.fillStyle = lin(g, 0, -3, 0, 3, ['#A8B0BC', '#5E6470', '#3A3E48']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.strokeStyle = 'rgba(240,244,255,.8)'; g.lineWidth = .4; g.beginPath(); g.moveTo(.4, -.2); g.quadraticCurveTo(-3, -2, -6, -.8); g.stroke();
      // the fletching: two leaves, the upper lit, the lower in shade, a pale midrib down each
      const leaf = (s, f) => { g.beginPath(); g.moveTo(-30, s * .5); g.quadraticCurveTo(-27.5, s * 4.6, -20.5, s * .6); g.quadraticCurveTo(-25, s * 1.4, -30, s * .5); g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = INKC; g.lineWidth = .6; g.stroke();
        g.strokeStyle = 'rgba(214,240,170,.75)'; g.lineWidth = .35; g.beginPath(); g.moveTo(-29.4, s * .8); g.quadraticCurveTo(-26, s * 2.4, -21.4, s * .8); g.stroke(); };
      leaf(1, '#46702C'); leaf(-1, '#6E9A44');
      g.fillStyle = '#B03A2A'; g.fillRect(-19.6, -1, 1.4, 2); g.fillStyle = INKC; g.fillRect(-31.6, -1.1, 1.4, 2.2); // the red thread, the nock
    }),
    // a brass bullet: a round nose, a dark band, a hot copper base
    shell: () => sprite('shell', 14, 8, 11, 4, (g) => {
      g.beginPath(); g.moveTo(-9, -2.3); g.lineTo(-3, -2.3); g.quadraticCurveTo(1.6, -2, 2, 0); g.quadraticCurveTo(1.6, 2, -3, 2.3); g.lineTo(-9, 2.3); g.closePath();
      g.fillStyle = lin(g, 0, -2.3, 0, 2.3, ['#FFF0B0', '#E0B050', '#9A6A22', '#6A4416']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.fillStyle = '#5A3A14'; g.fillRect(-6.4, -2.2, .9, 4.4); g.fillStyle = '#FF9A5A'; g.fillRect(-9, -1.6, .9, 3.2);
      g.strokeStyle = 'rgba(255,255,240,.9)'; g.lineWidth = .4; g.beginPath(); g.moveTo(-8, -1.4); g.lineTo(-1, -1.4); g.stroke();
    }),
    // the Aether Gunner's slug: a brass jacket round a core of cyan aether showing through vents
    aether: () => sprite('aether', 16, 8, 12, 4, (g) => {
      g.beginPath(); g.moveTo(-10, -2); g.lineTo(-2.5, -2.4); g.quadraticCurveTo(2.4, -2, 2.6, 0); g.quadraticCurveTo(2.4, 2, -2.5, 2.4); g.lineTo(-10, 2); g.closePath();
      g.fillStyle = lin(g, 0, -2.4, 0, 2.4, ['#F8E2A0', '#C8963A', '#7A5420']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.fillStyle = '#BFF6FF'; for (const x of [-8, -5.6]) { g.fillRect(x, -1.3, 1, 2.6); } g.fillStyle = '#5ADCF0'; g.fillRect(-3.4, -1.1, .8, 2.2);
      g.strokeStyle = 'rgba(255,255,240,.85)'; g.lineWidth = .4; g.beginPath(); g.moveTo(-9, -1.4); g.lineTo(-1, -1.6); g.stroke();
    }),
    // a cannon slug for the Kettle Tank: an iron ball with a brass band and a rivet, anchored at its middle
    slug: () => sprite('slug', 14, 14, 7, 7, (g) => {
      g.beginPath(); g.arc(0, 0, 4.8, 0, TAU); const gr = g.createRadialGradient(-1.6, -1.8, .4, 0, 0, 5); gr.addColorStop(0, '#B8B4C0'); gr.addColorStop(.45, '#5E5A68'); gr.addColorStop(1, '#2A2830');
      g.fillStyle = gr; g.fill(); g.strokeStyle = INKC; g.lineWidth = .8; g.stroke();
      g.beginPath(); g.ellipse(0, 0, 1.6, 4.7, 0, -Math.PI / 2, Math.PI / 2); g.strokeStyle = '#C8963A'; g.lineWidth = 1.3; g.stroke(); g.strokeStyle = INKC; g.lineWidth = .35; g.stroke();
      g.fillStyle = '#F4D58A'; g.beginPath(); g.arc(1.4, -2.6, .55, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-2, -2.2, .9, 0, TAU); g.fill();
    }),
    // the Lantern Drone's lamp-oil: a drop of burning amber, the flame swept back off it; anchored at its front
    cinder: () => sprite('cinder', 16, 10, 12, 5, (g) => {
      g.beginPath(); g.moveTo(2.4, 0); g.bezierCurveTo(2.4, -3.2, -3, -3.4, -10, 0); g.bezierCurveTo(-3, 3.4, 2.4, 3.2, 2.4, 0); g.closePath();
      g.fillStyle = lin(g, 2, 0, -10, 0, ['#FFF2C4', '#FFC24A', '#E8641C', 'rgba(184,42,22,.6)']); g.fill(); g.strokeStyle = 'rgba(74,18,8,.85)'; g.lineWidth = .6; g.stroke();
      g.fillStyle = '#FFFBE8'; g.beginPath(); g.ellipse(0, -.4, 1.6, 1.1, 0, 0, TAU); g.fill();
    }),
    // a prism shard: a long faceted crystal, its facets lit differently; pal picks violet (the Shard Drone) or ice-blue
    prism: (pal) => sprite('prism' + pal, 18, 9, 16, 4.5, (g) => {
      const C3 = pal === 'ice' ? ['#E8FCFF', '#8FE0F0', '#3E8AA8'] : ['#F8E0FF', '#C080F0', '#6A2EA0'];
      const pts = [[1, 0], [-5, -3.2], [-14.5, -1.4], [-15.5, .9], [-6, 3.1]];
      g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fillStyle = C3[1]; g.fill();
      g.beginPath(); g.moveTo(1, 0); g.lineTo(-5, -3.2); g.lineTo(-14.5, -1.4); g.lineTo(-6, -.2); g.closePath(); g.fillStyle = C3[0]; g.fill();
      g.beginPath(); g.moveTo(1, 0); g.lineTo(-6, 3.1); g.lineTo(-15.5, .9); g.lineTo(-6, -.2); g.closePath(); g.fillStyle = C3[2]; g.fill();
      g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = .4; g.beginPath(); g.moveTo(-.5, -.4); g.lineTo(-5, -2.4); g.lineTo(-12, -1.1); g.stroke();
    }),
    // the Sky Ray's tail-barb: a slender night-blue dart, serrated, with little stars in it
    barb: () => sprite('barb', 20, 8, 17, 4, (g) => {
      g.beginPath(); g.moveTo(1.5, 0); g.lineTo(-4, -2); g.lineTo(-5, -1.2); g.lineTo(-8, -2.2); g.lineTo(-9, -1.2); g.lineTo(-12, -2); g.lineTo(-15.5, -.4); g.lineTo(-15.5, .4); g.lineTo(-12, 1.6); g.lineTo(-4, 1.8); g.closePath();
      g.fillStyle = lin(g, 0, -2.2, 0, 1.8, ['#6A78C8', '#2E3878', '#1A1E48']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .65; g.stroke();
      g.fillStyle = '#FFFFFF'; for (const [x, y] of [[-3, -.2], [-7.5, .5], [-11.5, -.3]]) { star4(g, x, y, .9, .35); g.fill(); }
      g.strokeStyle = 'rgba(200,215,255,.8)'; g.lineWidth = .35; g.beginPath(); g.moveTo(.6, -.3); g.lineTo(-4, -1.6); g.stroke();
    }),
    // pollen: a spiky golden grain, dusted, anchored at its middle
    pollen: () => sprite('pollen', 16, 16, 8, 8, (g) => {
      g.strokeStyle = '#B8801C'; g.lineWidth = .6; g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); } g.stroke();
      g.beginPath(); g.arc(0, 0, 4.4, 0, TAU); const gr = g.createRadialGradient(-1.4, -1.6, .3, 0, 0, 4.6); gr.addColorStop(0, '#FFF6B0'); gr.addColorStop(.5, '#F4C83A'); gr.addColorStop(1, '#C88A1C');
      g.fillStyle = gr; g.fill(); g.strokeStyle = INKC; g.lineWidth = .65; g.stroke();
      g.fillStyle = 'rgba(160,100,20,.55)'; for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 1 + (i % 3) * 1.1; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, .45, 0, TAU); g.fill(); }
    }),
    // a rose petal dart, anchored at its tip
    petal: () => sprite('petal', 10, 6, 8.5, 3, (g) => {
      g.beginPath(); g.moveTo(1, 0); g.quadraticCurveTo(-3, -2.8, -7, -.6); g.quadraticCurveTo(-6, 0, -7, .6); g.quadraticCurveTo(-3, 2.8, 1, 0); g.closePath();
      g.fillStyle = lin(g, 1, 0, -7, 0, ['#FFE0EE', '#F49AC0', '#C85A8A']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .5; g.stroke();
    }),
    // the Aurora Jelly's blob: a little bell of jelly-light, the dome leading, anchored at its middle
    jelly: () => sprite('jelly', 16, 14, 8, 7, (g) => {
      g.beginPath(); g.moveTo(-4, -5); g.bezierCurveTo(5, -6.4, 6.4, 6.4, -4, 5); g.quadraticCurveTo(-2.6, 2.4, -4.4, 1.6); g.quadraticCurveTo(-2.4, 0, -4.4, -1.6); g.quadraticCurveTo(-2.6, -2.4, -4, -5); g.closePath();
      const gr = g.createRadialGradient(1.6, -1, .5, 0, 0, 6.4); gr.addColorStop(0, 'rgba(255,244,255,.95)'); gr.addColorStop(.45, 'rgba(240,150,230,.8)'); gr.addColorStop(1, 'rgba(120,90,220,.55)');
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(42,27,44,.7)'; g.lineWidth = .6; g.stroke();
      g.strokeStyle = 'rgba(160,250,255,.9)'; g.lineWidth = .7; g.beginPath(); g.moveTo(-3.4, -4.2); g.bezierCurveTo(3.6, -5, 4.8, 4.6, -3.4, 4.2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(1.6, -2, 1.4, .7, -.5, 0, TAU); g.fill();
    }),
    // the Watcher's gaze: a gold almond lens with a black slit for a pupil, anchored at its middle
    gaze: () => sprite('gaze', 18, 12, 9, 6, (g) => {
      g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(0, -6, 7, 0); g.quadraticCurveTo(0, 6, -7, 0); g.closePath();
      const gr = g.createRadialGradient(0, 0, .5, 0, 0, 6); gr.addColorStop(0, '#FFF6C0'); gr.addColorStop(.55, '#FFC84A'); gr.addColorStop(1, '#C8641C');
      g.fillStyle = gr; g.fill(); g.strokeStyle = INKC; g.lineWidth = .8; g.stroke();
      g.beginPath(); g.ellipse(.6, 0, .9, 2.6, 0, 0, TAU); g.fillStyle = '#140A10'; g.fill();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(-1.4, -1.2, .7, 0, TAU); g.fill();
    }),
    // the Eclipse Moth's little eclipse: a black moon over a ring of gold corona, anchored at its middle
    corona: () => sprite('corona', 26, 26, 13, 13, (g) => {
      const gr = g.createRadialGradient(0, 0, 3.5, 0, 0, 12); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.18, 'rgba(255,220,140,.85)'); gr.addColorStop(.5, 'rgba(230,140,60,.3)'); gr.addColorStop(1, 'rgba(160,60,40,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,200,.75)'; g.lineWidth = .4; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 5.5 + (i % 3) * 1.6; g.moveTo(Math.cos(a) * 4.6, Math.sin(a) * 4.6); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke();
    }),
    moon: () => sprite('moon', 12, 12, 6, 6, (g) => {
      g.beginPath(); g.arc(0, 0, 4.2, 0, TAU); g.fillStyle = '#120A16'; g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.strokeStyle = 'rgba(255,240,200,.95)'; g.lineWidth = .5; g.beginPath(); g.arc(0, 0, 4.4, -2.2, -.4); g.stroke();
    }),
    // a moth's scale, shed (dark, with a gold eye on it)
    scale: () => sprite('scale', 6, 6, 3, 3, (g) => {
      g.beginPath(); g.moveTo(0, -2.4); g.quadraticCurveTo(2.2, 0, 0, 2.4); g.quadraticCurveTo(-2.2, 0, 0, -2.4); g.fillStyle = '#3A2A3A'; g.fill(); g.strokeStyle = INKC; g.lineWidth = .4; g.stroke();
      g.fillStyle = '#E8B850'; g.beginPath(); g.arc(0, 0, .6, 0, TAU); g.fill();
    }),
    // a soft silver puff of moon dust, anchored at its middle
    dust: () => sprite('dust', 24, 24, 12, 12, (g) => {
      for (const [x, y, r] of [[0, 0, 7], [-4, 2, 5], [4, -2, 5], [2, 3, 4.5], [-3, -3, 4]]) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(240,244,255,.75)'); gr.addColorStop(.6, 'rgba(200,214,240,.35)'); gr.addColorStop(1, 'rgba(180,196,230,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    }),
    // a silver quill from the Sphinx's wing: a white shaft, the vane cut in a few notches, darker toward its root
    quill: () => sprite('quill', 26, 9, 23, 4.5, (g) => {
      g.beginPath(); g.moveTo(1.5, 0); g.quadraticCurveTo(-6, -3.6, -16, -2.4); g.lineTo(-14.5, -1.2); g.lineTo(-18.5, -1.8); g.lineTo(-20, -.4); g.lineTo(-20, .4); g.lineTo(-17, 1.6); g.lineTo(-13, 1.2); g.lineTo(-14, 2.4); g.quadraticCurveTo(-6, 3, 1.5, 0); g.closePath();
      g.fillStyle = lin(g, 1, 0, -20, 0, ['#FFFFFF', '#E4EAF4', '#A8B4C8', '#6A7488']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .6; g.stroke();
      g.strokeStyle = '#F8FAFF'; g.lineWidth = .6; g.beginPath(); g.moveTo(.8, 0); g.lineTo(-22, .2); g.stroke();
      g.strokeStyle = 'rgba(80,90,120,.6)'; g.lineWidth = .3; g.beginPath(); for (let x = -3; x > -16; x -= 2.2) { g.moveTo(x, -.1); g.lineTo(x - 1.6, -2.2); g.moveTo(x, .3); g.lineTo(x - 1.6, 2); } g.stroke();
    }),
    // a stone chip, for a foe of rock
    pebble: () => sprite('pebble', 12, 12, 6, 6, (g) => {
      g.beginPath(); g.moveTo(-4, -.6); g.lineTo(-1.6, -3.6); g.lineTo(2.6, -3); g.lineTo(4, .8); g.lineTo(.6, 3.6); g.lineTo(-3.2, 2.6); g.closePath();
      g.fillStyle = '#9A8A74'; g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.fillStyle = 'rgba(30,20,20,.3)'; g.beginPath(); g.moveTo(4, .8); g.lineTo(.6, 3.6); g.lineTo(-3.2, 2.6); g.lineTo(.4, .6); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,248,230,.6)'; g.beginPath(); g.moveTo(-1.6, -3.2); g.lineTo(2.2, -2.6); g.lineTo(.2, -1.2); g.closePath(); g.fill();
    }),
    // the Logrus serpent's head: a hooked, barbed fang of dark crimson
    fang: () => sprite('fang', 12, 10, 6, 5, (g) => {
      g.beginPath(); g.moveTo(4.4, 0); g.quadraticCurveTo(1, -3.6, -4, -2.2); g.lineTo(-2.4, -.6); g.lineTo(-4.4, 0); g.lineTo(-2.4, .6); g.lineTo(-4, 2.2); g.quadraticCurveTo(1, 3.6, 4.4, 0); g.closePath();
      g.fillStyle = lin(g, 0, -3, 0, 3, ['#E85A7A', '#8A1A3A', '#3A0A1C']); g.fill(); g.strokeStyle = INKC; g.lineWidth = .7; g.stroke();
      g.fillStyle = '#FFD0DA'; g.beginPath(); g.arc(1.2, -.6, .55, 0, TAU); g.fill();
    }),
  };

  // ---------------- who throws what ----------------
  const BY_TYPE = { archer: 'arrow', gunner: 'aether', witch: 'rift', wisp: 'pollen', drone: 'shell', lantern: 'cinder', sdrone: 'prism', skyray: 'barb', tank: 'steam', jelly: 'jelly',
    chadept: 'logrus', cheye: 'gaze', chmoth: 'eclipse', w5moth: 'moondust', w5sphinx: 'quill', colossus: 'bigshell' };
  const BY_LOOK = { archer: 'arrow', gunner: 'aether', witch: 'rift', w4adept: 'logrus' }; // (a human foe's look, for foes made over from these)
  const BY_DRAW = { wisp: 'pollen', tank: 'steam', jelly: 'jelly', skyray: 'barb', w4eye: 'gaze', w4moth: 'eclipse', colossus: 'bigshell', w5moth: 'moondust', w5sphinx: 'quill' };
  const BY_PAL = { lantern: 'cinder', prism: 'prism' };
  const BY_MAT = { metal: 'shell', crystal: 'ice', goo: 'jelly', rock: 'pebble', fur: 'barb', china: 'ice', wood: 'arrow' };
  function lookOf(e, p) {
    if (!e || !e.def || p.fire || p.ground || p.orbit || p.wave || p.quake || p.w6apple || p.w6hand || p.w8bolt) return null; // (those have their own look already)
    const d = e.def;
    return BY_TYPE[e.type] || BY_LOOK[d.look] || (d.draw === 'drone' && BY_PAL[d.pal]) || BY_DRAW[d.draw] || BY_MAT[d.mat] || (d.draw === 'human' ? 'arrow' : 'magic');
  }
  const live = [];
  function tag(p, e) {
    const look = lookOf(e, p); if (!look) return;
    p.look = look; p.l0 = p.life; p.va = 0; p.vs = 0; p.seed = Math.random() * 99; live.push(p);
    if (look === 'arrow') { const ahead = (P.x - p.x) * Math.sign(p.vx || 1); p.arc = 1; p.a0 = 0; p.T = Math.min(2.5, Math.max(.2, ahead / Math.abs(p.vx || 200))); p.H = Math.min(26, Math.max(6, ahead * .08)); }
  }
  { const _bolt = bolt; bolt = function (e, y) { const n = projs.length; const r = _bolt(e, y); for (let i = n; i < projs.length; i++) if (projs[i].owner === 'e' && !projs[i].look) tag(projs[i], e); return r; }; }
  { const _ex = execute; execute = function (e) { const n = projs.length; const r = _ex(e); for (let i = n; i < projs.length; i++) if (projs[i].owner === 'e' && !projs[i].look && projs[i].l0 === undefined) tag(projs[i], e); return r; }; }

  // ---------------- landings ----------------
  const puffs = (x, y, z, cols, n, sz = 4, up = 30) => { for (let i = 0; i < n && parts.length < 420; i++) parts.push({ x: x + rand(-5, 5), y: y + rand(-3, 3), z: z + rand(-4, 4), vx: rand(-30, 30), vy: rand(-8, 8), vz: rand(up * .4, up), life: rand(.4, .7), max: .7, col: pick(cols), size: rand(sz * .6, sz), shape: 'puff', rot: 0, vr: 0 }); };
  const ring = (x, y, z, r, col, tt = .3) => fx.push({ kind: 'ring', x, y, z, t: tt, max: tt, r, col });
  const stars = (x, y, z, cols, n) => { for (let i = 0; i < n && parts.length < 420; i++) { const a = rand(0, TAU), s = rand(40, 130); parts.push({ x, y, z, vx: Math.cos(a) * s, vy: rand(-10, 10), vz: Math.sin(a) * s + 30, life: rand(.25, .45), max: .45, col: pick(cols), size: rand(2, 3.4), shape: 'star', rot: rand(0, 6), vr: rand(-8, 8) }); } };
  // where a shot ends: on him (hit) or spent in the air (k: a smaller show)
  function land(p, hit) {
    const x = p.x, y = p.y, z = Math.max(2, (p.z || 0) + (p.va || 0)), dir = Math.sign(p.vx || 1), k = hit ? 1 : .5, n = (m) => Math.max(1, Math.round(m * k * (busy() ? .5 : 1)));
    switch (p.look) {
      case 'arrow': burst(x, y, z, ['#8A5A32', '#6E9A44', '#C89A62'], n(5), 'fur', -dir); break; // splinters and a torn leaf
      case 'aether': ring(x, y, z, 22, '#9FF0FF', .22); stars(x, y, z, ['#BFF6FF', '#FFFFFF', '#F4D58A'], n(6)); break;
      case 'rift': ring(x, y, z, 30, '#B48CFF'); stars(x, y, z, ['#B48CFF', '#7FE8F0', '#FFFFFF'], n(8)); break;
      case 'pollen': puffs(x, y, z, ['rgba(244,210,74,.6)', 'rgba(255,240,160,.55)', 'rgba(244,154,192,.5)'], n(7), 6); stars(x, y, z, ['#FFE27A', '#F49AC0'], n(4)); break;
      case 'shell': case 'bigshell': burst(x, y, z, ['#FFD27A', '#FF8A4A', '#FFF2C0'], n(p.look === 'bigshell' ? 9 : 6), 'metal', -dir); puffs(x, y, z, ['rgba(90,80,80,.45)'], n(3), 5); if (p.look === 'bigshell') ring(x, y, z, 30, '#FFB35A', .25); break;
      case 'steam': puffs(x, y, z, ['rgba(240,240,248,.55)', 'rgba(220,224,232,.5)'], n(8), 8, 50); burst(x, y, z, ['#C8963A', '#FFD27A'], n(3), 'metal', -dir); break;
      case 'cinder': for (let i = 0; i < n(6); i++) FXEL.emberP(x, y, z, 'fire', .8); if (!busy()) FXEL.flameP(x, y, z, 10, 'fire'); break;
      case 'prism': case 'ice': burst(x, y, z, p.look === 'ice' ? ['#E8FCFF', '#8FE0F0', '#3E8AA8'] : ['#F8E0FF', '#C080F0', '#FFFFFF'], n(6), 'crystal', -dir); break;
      case 'barb': stars(x, y, z, ['#FFFFFF', '#C8D0FF'], n(5)); burst(x, y, z, ['#2E3878', '#6A78C8'], n(2), 'fur', -dir); break;
      case 'jelly': burst(x, y, z, ['rgba(240,150,230,.85)', 'rgba(160,250,255,.85)', 'rgba(180,255,190,.8)'], n(6), 'goo', -dir); ring(x, y, z, 20, '#F4A0E0', .25); break;
      case 'logrus': ring(x, y, z, 26, '#FF4A6A', .28); stars(x, y, z, ['#FF4A6A', '#8A1A3A', '#FFD0DA'], n(7)); break;
      case 'gaze': ring(x, y, z, 26, '#FFC84A', .28); stars(x, y, z, ['#FFE27A', '#FFFFFF'], n(6)); break;
      case 'eclipse': ring(x, y, z, 24, '#FFF0C0', .3); burst(x, y, z, ['#3A2A3A', '#E8B850'], n(5), 'fur', -dir); break;
      case 'moondust': puffs(x, y, z, ['rgba(232,238,252,.55)', 'rgba(200,214,240,.5)'], n(6), 7); stars(x, y, z, ['#FFFFFF', '#DCE8F4'], n(5)); break;
      case 'quill': burst(x, y, z, ['#F4F6FC', '#A8B4C8'], n(4), 'fur', -dir); stars(x, y, z, ['#FFFFFF'], n(3)); break;
      case 'pebble': burst(x, y, z, ['#9A8A74', '#6E604E'], n(5), 'rock', -dir); break;
      default: stars(x, y, z, [p.col || '#EED48A', '#FFFFFF'], n(6));
    }
  }
  // a missed arrow driven into the ground at the angle it fell, a little mound of earth thrown up round it; it stays a while
  const KEEP = 8;
  HAZARD_FX.estuck = {
    update(h) { },
    draw(h, t) { const a = Math.min(1, Math.max(0, h.t) / .6); if (a <= 0) return; const S = SPR.arrow(), sink = 7 + h.sink;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(40,20,60,.28)'; ell(h.x - h.d * 9, h.y + 1, 10, 2); ctx.fill(); // its shadow along the ground
      ctx.translate(h.x, h.y); if (h.d < 0) ctx.scale(-1, 1); ctx.rotate(h.ang);
      const vis = S.ax - sink; // (the head and a little of the shaft are under the earth: draw only what shows, from the nock to the ground)
      ctx.drawImage(S.c, 0, 0, vis * RS, S.h * RS, -vis, -S.ay, vis, S.h);
      ctx.restore();
      ctx.fillStyle = C('#6A5236'); ell(h.x, h.y, 3.4, 1.2); ctx.fill(); ctx.fillStyle = 'rgba(255,240,210,.35)'; ell(h.x - .6, h.y - .4, 1.6, .5); ctx.fill(); },
  };
  function stick(p) {
    const old = hazards.filter(h => h.kind === 'estuck'); if (old.length >= KEEP) old[0].t = Math.min(old[0].t, .5);
    const ang = Math.min(1.1, Math.max(.35, Math.atan2(-p.vs, Math.abs(p.vx || 1))));
    hazards.push({ kind: 'estuck', x: p.x, y: p.y, d: Math.sign(p.vx || 1), ang, sink: rand(0, 4), t: 6, max: 6 });
    if (typeof dust === 'function') dust(p.x, p.y, 2);
    p.gone = 1; p.life = 0; p.x = -1e6; // (taken out of the fight where it can touch nothing, and dropped with the rest next frame)
  }

  // ---------------- each frame: the arrow's arc, the trails, the landings ----------------
  const _uw = updateWorld;
  updateWorld = function (dt) {
    const r = _uw(dt);
    const inProjs = new Set(projs), keep = [];
    for (const p of live) {
      const there = inProjs.has(p);
      if (!there || p.life <= 0) { if (!p.gone && p.life <= 0) { const near = p.owner === 'e' && Math.abs(p.x - P.x) < 22 && Math.abs(p.y - P.y) < 22; if (near || (p.x > camX - 10 && p.x < camX + VW + 10)) land(p, near); } continue; }
      keep.push(p);
      const age = p.l0 - p.life;
      if (p.arc && p.owner === 'e') { // the arrow's drawn arc: up from the bow, back down to its true height where he stands, then on down into the ground
        let u = (age - p.a0) / p.T;
        if (u >= 1 && !p.falling) {
          const ahead = (P.x - p.x) * Math.sign(p.vx || 1);
          if (ahead > 24) { p.a0 = age; p.T = Math.min(2.5, Math.max(.25, ahead / Math.abs(p.vx || 200))); p.H = Math.min(26, Math.max(4, ahead * .08)); u = 0; } // (he backed off: it arcs on toward him)
          else p.falling = 1;
        }
        const tf = Math.max(0, age - p.a0 - p.T);
        p.va = 4 * p.H * u * (1 - u) - (p.falling ? 500 * tf * tf : 0);
        p.vs = 4 * p.H * (1 - 2 * u) / p.T - (p.falling ? 1000 * tf : 0);
        const passed = (p.x - P.x) * Math.sign(p.vx || 1) > 30;
        if (p.z + p.va <= 1) { if (passed && p.falling) { stick(p); keep.pop(); continue; } p.va = 1 - p.z; p.vs = 0; } // (not yet past him: it skims on)
      } else if (p.va) { p.va *= .85; p.vs = 0; if (Math.abs(p.va) < .3) p.va = 0; } // (turned back by him: it levels out)
      if (stillT > 0 || busy() || parts.length > 360) continue;
      const z = p.z + p.va, L = p.look;
      if (L === 'pollen' && Math.random() < dt * 14) parts.push({ x: p.x - Math.sign(p.vx) * 4, y: p.y, z: z + rand(-3, 3), vx: rand(-15, 15), vy: rand(-5, 5), vz: rand(-20, 10), life: .6, max: .6, col: pick(['#FFE27A', '#F4C83A', '#FFF6B0']), size: rand(1, 1.8), shape: 'blob', rot: 0, vr: 0 });
      else if (L === 'cinder' && Math.random() < dt * 22) FXEL.flameP(p.x - Math.sign(p.vx) * 6, p.y, z, rand(5, 8), 'fire', -p.vx * .2, -10);
      else if ((L === 'steam' || L === 'bigshell') && Math.random() < dt * (L === 'steam' ? 16 : 10)) parts.push({ x: p.x - Math.sign(p.vx) * 8, y: p.y, z: z + rand(-2, 2), vx: -p.vx * .08, vy: 0, vz: rand(10, 30), life: .55, max: .55, col: pick(['rgba(240,240,248,.45)', 'rgba(214,218,228,.4)']), size: rand(3, 5), shape: 'puff', rot: 0, vr: 0 });
      else if (L === 'moondust' && Math.random() < dt * 10) parts.push({ x: p.x + rand(-6, 6), y: p.y, z: z + rand(-5, 5), vx: 0, vy: 0, vz: rand(-30, -10), life: .5, max: .5, col: '#FFFFFF', size: rand(1.4, 2.2), shape: 'star', rot: rand(0, 6), vr: 3 });
      else if (L === 'eclipse' && Math.random() < dt * 6) parts.push({ x: p.x, y: p.y, z, vx: -p.vx * .1, vy: 0, vz: -30, life: .8, max: .8, col: '#3A2A3A', size: 2.2, shape: 'tuft', rot: rand(0, 6), vr: 6 });
      else if (L === 'rift' && Math.random() < dt * 10) parts.push({ x: p.x - Math.sign(p.vx) * 10, y: p.y, z: z + rand(-4, 4), vx: 0, vy: 0, vz: rand(-10, 20), life: .35, max: .35, col: pick(['#B48CFF', '#7FE8F0']), size: 2, shape: 'star', rot: 0, vr: 5 });
    }
    live.length = 0; live.push(...keep);
    return r;
  };

  // ---------------- the painters ----------------
  // each gets the shot, where it is drawn (x, y: its true place lifted by the arrow's arc), its side (d), its angle of
  // flight as drawn on that side (a), the time and its age in flight
  const streak = (x, y, d, a, len, rgb, w, al = .9) => { // a tracer: a tapered line of light behind the shot
    lit(() => { ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); ctx.rotate(a);
      const g = ctx.createLinearGradient(-len, 0, 0, 0); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${al})`);
      ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-2, 0); ctx.stroke();
      if (w > 1.6) { ctx.lineWidth = w * .35; ctx.strokeStyle = `rgba(255,255,255,${al * .8})`; ctx.beginPath(); ctx.moveTo(-len * .5, 0); ctx.lineTo(-2, 0); ctx.stroke(); }
      ctx.restore(); }); };
  const PAINT = {
    arrow(p, x, y, d, a) { streak(x, y, d, a, 16, '255,250,230', 1, .35); put(SPR.arrow(), x, y, 1.15, a, d); },
    aether(p, x, y, d, a, t) { streak(x, y, d, a, 34, '120,230,255', 3.2); lit(() => put(glow('120,230,255'), x, y, .55));
      if (!busy()) { const k = (t * 6 + p.seed) % 1; ctx.save(); ctx.globalAlpha = .7 * (1 - k); ctx.strokeStyle = '#9FF0FF'; ctx.lineWidth = .8; ell(x - d * (6 + k * 14), y, 2 + k * 2, 3 + k * 4); ctx.stroke(); ctx.restore(); } // the aether's wake, rings shed behind it
      put(SPR.aether(), x, y, 1, a, d); },
    shell(p, x, y, d, a) { streak(x, y, d, a, 24, '255,140,80', 2.4); put(SPR.shell(), x, y, 1, a, d); lit(() => put(glow('255,150,80', .6), x - d * 8, y, .25)); },
    bigshell(p, x, y, d, a) { streak(x, y, d, a, 30, '255,170,90', 3.4); put(SPR.shell(), x, y, 1.7, a, d); lit(() => put(glow('255,150,80', .6), x - d * 14, y, .4)); },
    steam(p, x, y, d, a, t) { // the slug in a wrap of steam: three puffs dragged out behind it
      for (let i = busy() ? 1 : 3; i >= 1; i--) { const ox = x - d * (6 + i * 6), oy = y + Math.sin(t * 9 + i * 1.7 + p.seed) * 1.6, r = 3 + i * 1.5; ctx.fillStyle = `rgba(250,250,255,${.75 - i * .15})`; circle(ox, oy, r); ctx.fill(); ctx.fillStyle = `rgba(200,206,222,${.4 - i * .08})`; circle(ox + d * .8, oy + r * .35, r * .7); ctx.fill(); }
      put(SPR.slug(), x, y, 1, t * 8 * d, 1); },
    cinder(p, x, y, d, a, t) { lit(() => put(glow('255,150,60', .75), x, y, .8 + .08 * Math.sin(t * 30 + p.seed))); put(SPR.cinder(), x, y, 1, a, d, 1 + .12 * Math.sin(t * 24 + p.seed)); },
    prism(p, x, y, d, a, t) { const s = .55 + .45 * Math.abs(Math.cos(t * 10 + p.seed));
      if (!busy()) lit(() => { ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); ctx.rotate(a); ctx.lineWidth = .9; ctx.lineCap = 'round';
        [['255,140,220', -1.6], ['140,230,255', 0], ['255,236,140', 1.6]].forEach(([c, o]) => { const g = ctx.createLinearGradient(-36, 0, -10, 0); g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},.75)`); ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(-36, o * 1.6); ctx.lineTo(-10, o * .4); ctx.stroke(); });
        ctx.restore(); }); // a little rainbow split off behind it
      put(SPR.prism(p.look === 'ice' ? 'ice' : 'violet'), x, y, 1, a, d, s);
      if (s > .9) lit(() => { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const q = i * Math.PI / 4, r = i % 2 ? 1 : 4; ctx.lineTo(x - d * 4 + Math.cos(q) * r, y - 1 + Math.sin(q) * r); } ctx.fill(); }); }, // a glint as a face turns to the light
    barb(p, x, y, d, a) { streak(x, y, d, a, 26, '200,214,255', 1.6, .7); put(SPR.barb(), x, y, 1, a, d); },
    pollen(p, x, y, d, a, t) { // the grain spinning in a soft gold haze, three petals darting round it
      lit(() => put(glow('255,226,120', .55), x, y, .7));
      if (!busy()) for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(244,200,58,${.5 - i * .12})`; circle(x - d * (5 + i * 5), y + Math.sin(t * 12 + i + p.seed) * 2, 1.6 - i * .3); ctx.fill(); }
      put(SPR.pollen(), x, y, 1, t * 5 * d, 1);
      const n = busy() ? 2 : 3; for (let i = 0; i < n; i++) { const q = t * 9 + i * TAU / n + p.seed, px = x + Math.cos(q) * 8, py = y + Math.sin(q) * 4.5; put(SPR.petal(), px, py, .9, q + Math.PI / 2, 1); } },
    jelly(p, x, y, d, a, t) { // the bell leads; its tendrils stream back, rippling
      lit(() => put(glow('240,160,240', .5), x, y, .8));
      const n = busy() ? 2 : 3, cols = ['rgba(160,250,255,.8)', 'rgba(244,160,224,.8)', 'rgba(180,255,190,.75)'];
      ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); ctx.rotate(a); ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 2.6, w = t * 14 + i * 1.9 + p.seed; ctx.strokeStyle = cols[i]; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(-3, o); ctx.bezierCurveTo(-9, o + Math.sin(w) * 3, -14, o + Math.sin(w + 1.4) * 3.6, -22 - i * 2, o * 1.6 + Math.sin(w + 2.6) * 3); ctx.stroke(); }
      ctx.restore();
      put(SPR.jelly(), x, y, 1, a, d, 1 + .1 * Math.sin(t * 16 + p.seed)); },
    rift(p, x, y, d, a, t, col) { // a white-hot heart, two ribbons (violet and teal) twisting round each other behind it
      const c2 = col || ['180,140,255', '127,232,240'];
      lit(() => { put(glow(c2[0], .8), x, y, .8);
        ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); ctx.rotate(a); ctx.lineCap = 'round';
        const N = busy() ? 6 : 10;
        for (let r = 0; r < 2; r++) { ctx.beginPath(); for (let i = 0; i <= N; i++) { const k = i / N, xx = -k * 30, yy = Math.sin(k * 7 - t * 22 + r * Math.PI + p.seed) * 4.2 * Math.min(1, k * 2.4) * (1 - k * .4); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
          ctx.strokeStyle = `rgba(${c2[r]},.85)`; ctx.lineWidth = 1.7; ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 2.6, 0, 0, TAU); ctx.fill();
        ctx.restore(); });
      ctx.strokeStyle = 'rgba(42,27,44,.6)'; ctx.lineWidth = .7; ell(x, y, 4.6, 3, a * d); ctx.stroke(); },
    magic(p, x, y, d, a, t) { const c = hexRgb(p.col || '#EED48A'); PAINT.rift(p, x, y, d, a, t, [c, '255,255,255']); },
    logrus(p, x, y, d, a, t) { // a serpent of the Logrus, writhing as it comes, its fang leading
      const N = busy() ? 6 : 9, pts = [];
      for (let i = 0; i <= N; i++) { const k = i / N; pts.push([-k * 28, Math.sin(k * 8 - t * 20 + p.seed) * (1 + k * 3.4)]); }
      ctx.save(); ctx.translate(x, y); if (d < 0) ctx.scale(-1, 1); ctx.rotate(a); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); };
      lit(() => { path(); ctx.strokeStyle = 'rgba(255,60,100,.35)'; ctx.lineWidth = 6; ctx.stroke(); });
      path(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.6; ctx.stroke(); ctx.strokeStyle = '#6A1A3E'; ctx.lineWidth = 2.2; ctx.stroke();
      lit(() => { path(); ctx.strokeStyle = 'rgba(255,90,120,.9)'; ctx.lineWidth = .8; ctx.stroke(); });
      ctx.restore(); put(SPR.fang(), x + d * 2, y, 1, a, d); },
    gaze(p, x, y, d, a, t) { // the lens stares as it comes, two fading after-images of it left behind
      lit(() => put(glow('255,200,90', .7), x, y, .9));
      if (!busy()) for (let i = 2; i >= 1; i--) { ctx.save(); ctx.globalAlpha = .4 - i * .14; put(SPR.gaze(), x - d * i * 9, y, 1 - i * .12, 0, d); ctx.restore(); }
      put(SPR.gaze(), x, y, 1, 0, d, .85 + .15 * Math.abs(Math.sin(t * 5 + p.seed))); },
    eclipse(p, x, y, d, a, t) { lit(() => put(SPR.corona(), x, y, .9 + .1 * Math.sin(t * 14 + p.seed), t * 2)); put(SPR.moon(), x, y, 1, 0, d);
      if (!busy()) for (let i = 1; i <= 2; i++) put(SPR.scale(), x - d * (8 + i * 6), y + Math.sin(t * 8 + i * 2 + p.seed) * 3, .9, t * 6 + i, 1); },
    moondust(p, x, y, d, a, t) { const S = SPR.dust();
      lit(() => { for (let i = busy() ? 1 : 3; i >= 1; i--) { ctx.save(); ctx.globalAlpha = .45 + .2 * (3 - i); put(S, x - d * (i - 1) * 6 + Math.sin(t * 7 + i + p.seed) * 2, y + Math.cos(t * 6 + i * 2) * 2, .7 + i * .12, t * (i % 2 ? 1 : -1)); ctx.restore(); } });
      lit(() => { for (let i = 0; i < 4; i++) { const k = (t * 2.2 + i / 4 + p.seed) % 1, b = Math.sin(k * Math.PI); ctx.fillStyle = `rgba(255,255,255,${b * .9})`; const gx = x + Math.cos(i * 2.3 + p.seed) * 7, gy = y + Math.sin(i * 1.7 + p.seed) * 5; ctx.beginPath(); for (let j = 0; j < 8; j++) { const q = j * Math.PI / 4, r = j % 2 ? .4 : 1.8 * b; ctx.lineTo(gx + Math.cos(q) * r, gy + Math.sin(q) * r); } ctx.fill(); } }); },
    quill(p, x, y, d, a) { streak(x, y, d, a, 18, '230,240,255', 1.4, .6); put(SPR.quill(), x, y, 1, a, d); },
    pebble(p, x, y, d, a, t) { put(SPR.pebble(), x, y, 1, t * 10 * d, 1); },
  };
  PAINT.ice = PAINT.prism;
  const hexRgb = (h) => { if (!h || h[0] !== '#' || h.length !== 7) return '238,212,138'; const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };

  const _dp = drawProj;
  drawProj = function (p, t) {
    if (!p.look || p.arrow || p.tornado) return _dp(p, t);
    if (p.gone) return;
    const d = Math.sign(p.vx || 1), va = p.va || 0, z = p.z + va, x = p.x, y = p.y - z;
    const sy = (p.vy || 0) - (p.vz || 0) - (p.vs || 0), a = Math.atan2(sy, Math.abs(p.vx || 1));
    shadow(p.x, p.y, p.look === 'bigshell' ? 7 : 5);
    (PAINT[p.look] || PAINT.magic)(p, x, y, d, a, t);
  };
  return { lookOf, SPR, PAINT, land };
})();
