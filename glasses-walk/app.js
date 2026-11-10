(function () {
  'use strict';
  const N = window.Nav;
  const params = new URLSearchParams(location.search);
  const DEMO = params.has('demo');
  const UNITS = params.get('units') || (/^en-(US|LR|MM)/i.test(navigator.language || '') ? 'imperial' : 'metric');

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const canvas = $('c'), ctx = canvas.getContext('2d');

  // ---------------------------------------------------------------- state
  const VIEWS = ['chase', 'turn', 'overhead', 'overview'];
  const OVERHEAD_SPANS = [120, 250, 500, 1000]; // metres visible top-to-bottom
  const S = {
    proj: null,            // projector (origin = first fix)
    pos: null,             // {lat,lon,acc,x,y}
    gpsHeading: null, compass: null, speed: 0,
    heading: 0, headingInit: false,
    view: params.get('view') && VIEWS.includes(params.get('view')) ? params.get('view') : 'chase',
    zoom: params.has('zoom') ? clamp(+params.get('zoom') || 0, 0, 3) : 1,
    ways: [], buildings: [], destExtra: [], waysCenter: null, waysBusy: false,
    route: null, dest: null, snapSeg: 0, snap: null, prog: null, offCount: 0, spoken: -1,
    muted: false, toast: '', toastUntil: 0, sim: null, lastFix: 0,
  };
  let W = 600, H = 600, K = 1, DPR = 1;

  // ---------------------------------------------------------------- helpers
  const toast = (t, ms = 3500) => { S.toast = t; S.toastUntil = performance.now() + ms; };
  async function getJSON(url, opts, timeout = 15000) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(url, { ...opts, signal: ctl.signal });
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  }
  function ensureProj(lat, lon) {
    if (!S.proj || N.haversine(S.proj.origin, { lat, lon }) > 15000) {
      S.proj = N.makeProjector({ lat, lon });
      reproject();
    }
  }
  function reproject() {
    for (const w of S.ways) projectWay(w);
    for (const b of S.buildings.concat(S.destExtra)) projectWay(b);
    findDestBuilding();
    if (S.route) { const raw = S.route.raw; S.route = N.buildRoute(raw, S.proj); S.route.raw = raw; S.snapSeg = 0; }
    if (S.pos) Object.assign(S.pos, S.proj.toXY(S.pos.lat, S.pos.lon));
  }
  function projectWay(w) {
    w.xy = w.ll.map((p) => S.proj.toXY(p.lat, p.lon));
    let sx = 0, sy = 0; for (const p of w.xy) { sx += p.x; sy += p.y; }
    w.c = { x: sx / w.xy.length, y: sy / w.xy.length };
    w.r = Math.max(...w.xy.map((p) => Math.hypot(p.x - w.c.x, p.y - w.c.y)));
  }

  // ---------------------------------------------------------------- location + heading
  function onFix(lat, lon, acc, heading, speed) {
    ensureProj(lat, lon);
    const xy = S.proj.toXY(lat, lon);
    S.pos = { lat, lon, acc: acc || 0, x: xy.x, y: xy.y };
    S.lastFix = performance.now();
    if (typeof speed === 'number' && !isNaN(speed)) S.speed = speed;
    if (typeof heading === 'number' && !isNaN(heading) && S.speed > 0.8) S.gpsHeading = heading;
    updateProgress();
    maybeFetchWays();
  }
  function startGeolocation() {
    if (!navigator.geolocation) return toast('No location sensor available', 8000);
    navigator.geolocation.watchPosition(
      (p) => { if (!S.sim) onFix(p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.coords.heading, p.coords.speed); },
      (e) => toast('Location: ' + e.message, 8000),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
  }
  function startCompass() {
    const handler = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
      if (h !== null) S.compass = h;
    };
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    // iOS-style permission prompt (needs a user gesture)
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      const ask = () => { D.requestPermission().catch(() => {}); window.removeEventListener('pointerdown', ask); };
      window.addEventListener('pointerdown', ask);
    }
  }
  function currentHeadingTarget() {
    if (S.sim) return S.sim.heading;
    if (S.gpsHeading !== null && S.speed > 1.0) return S.gpsHeading; // walking: direction of travel
    if (S.compass !== null) return S.compass;                        // standing: where you're looking
    return S.gpsHeading ?? S.heading;
  }

  // ---------------------------------------------------------------- map data (OpenStreetMap)
  // Real-world widths (metres) so streets read as streets: kerb to kerb.
  const ROAD_STYLE = { trunk: 13, primary: 12, secondary: 10, tertiary: 9, residential: 7, unclassified: 7, living_street: 6, road: 7, service: 4, pedestrian: 5 };
  const PATH_STYLE = { footway: 2, path: 1.8, steps: 2, cycleway: 2.2, track: 3, bridleway: 2, corridor: 2 };
  function roadStyle(hw) {
    if (PATH_STYLE[hw]) return { path: true, w: PATH_STYLE[hw] };
    return { path: false, w: ROAD_STYLE[hw] || 6 };
  }
  async function maybeFetchWays() {
    if (DEMO || S.waysBusy || !S.pos) return;
    if (S.waysCenter && Math.hypot(S.pos.x - S.waysCenter.x, S.pos.y - S.waysCenter.y) < 120) return;
    S.waysBusy = true;
    const c = { x: S.pos.x, y: S.pos.y };
    try {
      const at = `${S.pos.lat.toFixed(5)},${S.pos.lon.toFixed(5)}`;
      const q = `[out:json][timeout:25];(way(around:500,${at})[highway][highway!~"^(motorway|motorway_link|proposed|construction|raceway)$"];way(around:300,${at})[building];);out geom;`;
      const j = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) }, 30000);
      const ways = [], blds = [];
      for (const e of j.elements) {
        if (!e.geometry || e.geometry.length < (e.tags.building ? 4 : 2)) continue;
        const ll = e.geometry.map((g) => ({ lat: g.lat, lon: g.lon }));
        if (e.tags.building) {
          const h = parseFloat(e.tags.height) || parseFloat(e.tags['building:levels']) * 3.2 || 9;
          const b = { ll, h: clamp(h, 4, 80) }; projectWay(b); blds.push(b);
        } else {
          const w = { ll, name: e.tags.name || '', ...roadStyle(e.tags.highway) }; projectWay(w); ways.push(w);
        }
      }
      S.ways = ways; S.buildings = blds.slice(0, 1800); S.waysCenter = c; findDestBuilding();
    } catch (err) { toast('Map data unavailable — retrying'); S.waysCenter = null; setTimeout(() => (S.waysBusy = false), 8000); return; }
    S.waysBusy = false;
  }

  // ---------------------------------------------------------------- search + routing
  async function geocode(q) {
    const u = new URL('https://nominatim.openstreetmap.org/search');
    u.search = new URLSearchParams({ format: 'jsonv2', q, limit: '5', addressdetails: '0' });
    if (S.pos) { // bias toward where you are (~25 km box)
      const d = 0.25; u.searchParams.set('viewbox', [S.pos.lon - d, S.pos.lat + d, S.pos.lon + d, S.pos.lat - d].join(','));
    }
    return (await getJSON(u.toString())).map((r) => ({ name: r.display_name, lat: +r.lat, lon: +r.lon }));
  }
  async function routeTo(dest, quiet) {
    if (!S.pos) { toast('Waiting for a location fix…'); return false; }
    try {
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${S.pos.lon},${S.pos.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson&steps=true`;
      const j = await getJSON(url);
      if (!j.routes || !j.routes[0]) throw new Error('no route');
      setRoute(j.routes[0], dest);
      return true;
    } catch (e) { toast(quiet ? 'Reroute failed' : 'Couldn’t find a walking route', 5000); return false; }
  }
  function setRoute(osrm, dest) {
    S.route = N.buildRoute(osrm, S.proj);
    S.route.raw = osrm;
    S.dest = dest; S.destExtra = []; S.snapSeg = 0; S.offCount = 0; S.spoken = -1; S.snap = null; S.prog = null;
    updateProgress();
    findDestBuilding(); fetchDestBuilding(dest);
  }
  // ---- destination building: the footprint containing (or nearest to) the address
  const allBuildings = () => (S.destExtra.length ? S.buildings.concat(S.destExtra) : S.buildings);
  const destName = () => (S.dest && S.dest.name ? S.dest.name.split(',')[0].trim() : '') || 'Destination';
  function ringDist(ring, p) { // 0 if inside, else distance to the outline
    let inside = false, best = Infinity;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1;
      const t = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / l2, 0, 1);
      best = Math.min(best, Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t)));
    }
    return inside ? 0 : best;
  }
  function findDestBuilding() {
    const list = allBuildings();
    for (const b of list) b.isDest = false;
    S.destB = null;
    if (!S.dest || !S.proj) return;
    const p = S.proj.toXY(S.dest.lat, S.dest.lon);
    let best = null, bd = 45; // must be within 45 m of the address point
    for (const b of list) {
      if (Math.hypot(b.c.x - p.x, b.c.y - p.y) - b.r > bd) continue;
      const d = ringDist(b.xy, p);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) { best.isDest = true; S.destB = best; }
  }
  async function fetchDestBuilding(dest) { // the area around the address may be outside the normal 300 m window
    if (DEMO) return;
    try {
      const q = `[out:json][timeout:20];way(around:60,${dest.lat.toFixed(5)},${dest.lon.toFixed(5)})[building];out geom;`;
      const j = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) }, 25000);
      if (S.dest !== dest) return; // route changed meanwhile
      S.destExtra = j.elements.filter((e) => e.geometry && e.geometry.length > 3).map((e) => {
        const h = parseFloat(e.tags.height) || parseFloat(e.tags['building:levels']) * 3.2 || 9;
        const b = { ll: e.geometry.map((g) => ({ lat: g.lat, lon: g.lon })), h: clamp(h, 4, 80) }; projectWay(b); return b;
      });
      findDestBuilding();
    } catch (e) { /* the pole and ring still mark the spot */ }
  }
  const instrText = (step) => (step && step.type === 'arrive' && S.dest ? `Arrive at ${destName()}` : N.instruction(step));
  function endRoute() { S.destExtra = []; S.destB = null; S.route = null; S.dest = null; S.prog = null; S.snap = null; if (S.sim) S.sim = null; toast('Route ended'); }

  function updateProgress() {
    if (!S.route || !S.pos) return;
    const sn = N.snap(S.route.pts, S.route.cum, S.pos, Math.max(0, S.snapSeg - 2), 60);
    if (!sn) return;
    S.snap = sn; S.snapSeg = sn.seg;
    S.prog = N.progress(S.route, sn.along);
    if (!S.sim && sn.dist > 40 && ++S.offCount >= 3) { S.offCount = 0; toast('Rerouting…'); routeTo(S.dest, true); return; }
    if (sn.dist <= 40) S.offCount = 0;
    // voice
    const p = S.prog;
    if (p.arrived) { if (S.spoken !== -2) { speak('You have arrived'); S.spoken = -2; } return; }
    if (p.next && p.toManeuver < 45 && S.spoken !== p.index) {
      S.spoken = p.index;
      const d = N.formatDist(p.toManeuver, UNITS);
      speak(`In ${d.v} ${({ ft: 'feet', mi: 'miles', m: 'metres', km: 'kilometres' })[d.u]}, ${instrText(p.next)}`);
    }
  }
  function speak(t) {
    if (S.muted || !window.speechSynthesis) return;
    try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- demo / simulator
  function startDemo() {
    const o = { lat: 37.7749, lon: -122.4194 };
    S.proj = N.makeProjector(o);
    const ways = [], blds = [];
    const vNames = { 0: 'Mission St', 4: 'Folsom St' }, hNames = { 3: 'Howard St', 5: 'Harrison St' };
    for (let i = -6; i <= 6; i++) {
      for (const horiz of [true, false]) {
        const pts = [];
        for (let j = -8; j <= 8; j++) pts.push(horiz ? S.proj.toLL(j * 60, i * 90) : S.proj.toLL(i * 90, j * 60));
        const major = i % 3 === 0;
        ways.push({ ll: pts, path: false, w: major ? 12 : 7, name: (horiz ? hNames : vNames)[i] || `${Math.abs(i) + (horiz ? 10 : 20)}th ${horiz ? 'St' : 'Ave'}` });
      }
    }
    ways.push({ ll: [S.proj.toLL(-300, -300), S.proj.toLL(-100, -60), S.proj.toLL(100, 120), S.proj.toLL(330, 300)], path: true, w: 2, name: '' });
    // city blocks: a few buildings per block, set back from the kerb
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let bi = -6; bi < 6; bi++) for (let bj = -6; bj < 6; bj++) {
      if (rnd() < 0.07 && !(bi === 5 && bj === 4)) continue; // the odd empty lot / plaza
      const x0 = bi * 90 + 8, x1 = bi * 90 + 82, y0 = bj * 90 + 8, y1 = bj * 90 + 82;
      const nx = 1 + Math.floor(rnd() * 3), ny = 1 + Math.floor(rnd() * 2);
      for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
        const ax = x0 + ((x1 - x0) * a) / nx + 1, bx = x0 + ((x1 - x0) * (a + 1)) / nx - 1;
        const ay = y0 + ((y1 - y0) * b) / ny + 1, by = y0 + ((y1 - y0) * (b + 1)) / ny - 1;
        const ring = [[ax, ay], [bx, ay], [bx, by], [ax, by], [ax, ay]].map(([x, y]) => S.proj.toLL(x, y));
        blds.push({ ll: ring, h: 7 + rnd() * rnd() * 55 });
      }
    }
    ways.forEach(projectWay); blds.forEach(projectWay);
    S.ways = ways; S.buildings = blds; S.waysCenter = { x: 0, y: 0 };
    const wp = [[0, 0], [0, 270], [360, 270], [360, 450], [540, 450]];
    const ll = wp.map(([x, y]) => S.proj.toLL(x, y));
    const mk = (type, modifier, name, d, p) => ({ maneuver: { type, modifier, location: [ll[p].lon, ll[p].lat] }, name, distance: d });
    const osrm = {
      distance: 270 + 360 + 180 + 180, duration: 990 / 1.3,
      geometry: { coordinates: ll.map((p) => [p.lon, p.lat]) },
      legs: [{ steps: [mk('depart', '', 'Mission St', 270, 0), mk('turn', 'right', 'Howard St', 360, 1), mk('turn', 'left', 'Folsom St', 180, 2), mk('turn', 'right', 'Harrison St', 180, 3), mk('arrive', '', '', 0, 4)] }],
    };
    onFix(o.lat, o.lon, 5, 0, 0);
    const dd = S.proj.toLL(500, 415);
    setRoute(osrm, { name: 'Blue Door Café, Harrison St', lat: dd.lat, lon: dd.lon });
    startSim();
  }
  function startSim() {
    S.sim = { along: 0, heading: 0, speed: 1.4 * (+params.get('speed') || 1), last: performance.now() };
  }
  function stepSim(now) {
    const s = S.sim; if (!s || !S.route) return;
    const dt = Math.min(0.1, (now - s.last) / 1000); s.last = now;
    s.along = Math.min(S.route.total, s.along + s.speed * dt);
    const { pts, cum } = S.route;
    let i = 0; while (i < pts.length - 2 && cum[i + 1] < s.along) i++;
    const a = pts[i], b = pts[i + 1], t = (s.along - cum[i]) / Math.max(0.001, cum[i + 1] - cum[i]);
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    s.heading = N.bearing(b.x - a.x, b.y - a.y);
    const ll = S.proj.toLL(x, y);
    onFix(ll.lat, ll.lon, 5, s.heading, s.speed);
  }

  // ---------------------------------------------------------------- camera
  // zoom 0..3 = walking eye level -> raised chase -> high chase -> drone (chase view)
  const CHASE = [{ h: 7, far: 230 }, { h: 9, far: 280 }, { h: 22, far: 400 }, { h: 48, far: 650 }];
  function makeCamera() {
    const u = S.pos || { x: 0, y: 0 };
    const mode = S.view;
    if (mode === 'overview' && S.route) {
      const xs = S.route.pts.map((p) => p.x), ys = S.route.pts.map((p) => p.y);
      const minx = Math.min(...xs, u.x), maxx = Math.max(...xs, u.x), miny = Math.min(...ys, u.y), maxy = Math.max(...ys, u.y);
      const span = Math.max(maxx - minx, maxy - miny, 80) * 1.25;
      return { mode, kind: 'flat', cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, heading: 0, scale: Math.min(W, H) / span, span, ax: W / 2, ay: H / 2 };
    }
    if (mode === 'overhead' || mode === 'overview' || mode === 'turn') {
      const span = OVERHEAD_SPANS[S.zoom] || 250;
      return { mode, kind: 'flat', cx: u.x, cy: u.y, heading: S.heading, scale: Math.min(W, H) / span, span, ax: W / 2, ay: H * 0.64 };
    }
    // chase: a camera just behind and above you, looking down the street
    const c = CHASE[S.zoom] || CHASE[1], horizon = H * 0.28, F = H * 0.6;
    const back = c.h / ((H * 0.78 - horizon) / F); // places you ~78% of the way down the screen
    return { mode, kind: 'persp', cx: u.x, cy: u.y, heading: S.heading, back, height: c.h, F, horizon, ax: W / 2, far: c.far };
  }
  function camSegments(cam, pts) {
    // returns array of polylines in screen space
    const out = []; let cur = null;
    const fwd = (p) => N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading);
    if (cam.kind === 'flat') {
      const o = []; for (const p of pts) { const f = fwd(p); o.push({ x: cam.ax + f.x * cam.scale, y: cam.ay - f.y * cam.scale }); } return [o];
    }
    const near = 1.5;
    let prev = null;
    for (const p of pts) {
      const f = fwd(p), c = { x: f.x, y: f.y + cam.back };
      if (prev) {
        const clip = N.clipNear(prev, c, near);
        if (clip) {
          if (!cur) { cur = [projCam(cam, clip[0], 0)]; out.push(cur); }
          cur.push(projCam(cam, clip[1], 0));
          if (clip[1] !== c) cur = null; // far end was clipped: start a new polyline next time
        } else cur = null;
      }
      prev = c;
    }
    return out;
  }
  // camera-space point {x, y(depth incl. back)} at height z above ground -> screen
  function projCam(cam, p, z) { return { x: cam.ax + (cam.F * p.x) / p.y, y: cam.horizon + (cam.F * (cam.height - z)) / p.y, d: p.y }; }
  // single world point -> screen, or null when behind the camera
  function projPoint(cam, p, z = 0) {
    const f = N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading);
    if (cam.kind === 'flat') return { x: cam.ax + f.x * cam.scale, y: cam.ay - f.y * cam.scale, d: 1 };
    const c = { x: f.x, y: f.y + cam.back };
    return c.y < 1.5 ? null : projCam(cam, c, z);
  }
  const fog = (cam, d) => clamp(1.25 - d / cam.far, 0.06, 1);
  const rgbs = (c, f) => `rgb(${(c[0] * f) | 0},${(c[1] * f) | 0},${(c[2] * f) | 0})`;
  function lineW(cam, meters, d, maxPx) {
    if (cam.kind === 'flat') return clamp(meters * cam.scale, 1.2 * K, maxPx || 40 * K);
    return clamp((cam.F * meters) / Math.max(d || 30, 3), 1 * K, maxPx || 16 * K);
  }
  // Stroke a screen polyline with a real-world width; perspective width and fog follow depth per segment.
  function strokeLine(cam, s, meters, rgb, maxPx) {
    if (cam.kind === 'flat') {
      ctx.strokeStyle = rgbs(rgb, 1); ctx.lineWidth = lineW(cam, meters, 0, maxPx);
      ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y); ctx.stroke(); return;
    }
    for (let i = 1; i < s.length; i++) {
      const d = (s[i - 1].d + s[i].d) / 2;
      ctx.strokeStyle = rgbs(rgb, fog(cam, d)); ctx.lineWidth = lineW(cam, meters, d, maxPx);
      ctx.beginPath(); ctx.moveTo(s[i - 1].x, s[i - 1].y); ctx.lineTo(s[i].x, s[i].y); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- drawing the street scene
  const C = {
    sidewalk: [58, 74, 82], curb: [150, 176, 186], asphalt: [30, 40, 46], centre: [190, 168, 80],
    pathEdge: [100, 160, 135], pathFill: [60, 100, 88],
    destWall: [150, 108, 8], destEdge: [255, 214, 80], destRoof: [215, 160, 20],
    wall: [20, 34, 42], wallEdge: [92, 124, 138], roof: [34, 54, 64], bFill: [16, 30, 38], bEdge: [48, 76, 88],
  };
  function drawWorld(cam) {
    const flat = cam.kind === 'flat';
    const range = flat ? (Math.max(W, H) / cam.scale) * 0.9 : cam.far + 60;
    const near = (o) => Math.hypot(o.c.x - cam.cx, o.c.y - cam.cy) - o.r < range;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (flat) drawBuildings(cam); // under the streets when seen from above
    const vis = S.ways.filter(near);
    for (const w of vis) w._s = camSegments(cam, w.xy);
    const roads = vis.filter((w) => !w.path), paths = vis.filter((w) => w.path);
    const pass = (list, width, rgb) => { for (const w of list) for (const s of w._s) if (s.length > 1) strokeLine(cam, s, width(w), rgb, 400 * K); };
    // all kerbs before all asphalt, so junctions read as one open space instead of crossing lines
    pass(roads, (w) => w.w + 5, C.sidewalk);
    pass(roads, (w) => w.w + 0.9, C.curb);
    pass(paths, (w) => w.w + 0.9, C.pathEdge);
    pass(roads, (w) => w.w, C.asphalt);
    pass(paths, (w) => w.w, C.pathFill);
    if (!flat || cam.span <= 300) pass(roads.filter((w) => w.w >= 7), () => 0.22, C.centre);
    if (flat) { if (cam.span <= 500) drawStreetNames(cam, roads); }
    else drawBuildings(cam);
    drawDestLabel(cam);
  }
  // A name tag floating over the destination building (pinned to the screen edge when it is off to the side).
  function drawDestLabel(cam) {
    const b = S.destB; if (!b) return;
    const g = projPoint(cam, b.c, cam.kind === 'persp' ? b.h + 5 : 0); if (!g) return;
    const name = destName(), size = 20 * K;
    ctx.font = `700 ${size}px system-ui`;
    const tw = Math.min(ctx.measureText(name).width, W * 0.7) + 28 * K, th = 34 * K;
    const x = clamp(g.x, tw / 2 + 6 * K, W - tw / 2 - 6 * K), y = clamp(g.y, 140 * K, H - 70 * K);
    ctx.fillStyle = '#ffd650'; roundRect(x - tw / 2, y - th / 2, tw, th, th / 2); ctx.fill();
    if (cam.kind === 'persp' && g.y > 140 * K && g.y < H - 70 * K && Math.abs(g.x - x) < 2) { // little pointer down to the roof
      ctx.beginPath(); ctx.moveTo(x - 7 * K, y + th / 2 - 1); ctx.lineTo(x + 7 * K, y + th / 2 - 1); ctx.lineTo(x, y + th / 2 + 10 * K); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#1a1300'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let t = name; while (ctx.measureText(t).width > tw - 20 * K && t.length > 3) t = t.slice(0, -2); if (t !== name) t = t.trimEnd() + '…';
    ctx.fillText(t, x, y + 1);
  }
  function drawStreetNames(cam, roads) {
    const seen = new Set(); let n = 0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const w of roads) {
      if (!w.name || seen.has(w.name) || n > 22) continue;
      const s = w._s[0]; if (!s || s.length < 2) continue;
      let best = 0, bi = 0; // longest on-screen segment that is fully inside the frame
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1], b = s[i], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, l = Math.hypot(b.x - a.x, b.y - a.y);
        if (l > best && mx > 40 * K && mx < W - 40 * K && my > 120 * K && my < H - 40 * K) { best = l; bi = i; }
      }
      if (best < 90 * K) continue;
      const a = s[bi - 1], b = s[bi]; let ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI; // never upside-down
      ctx.save(); ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2); ctx.rotate(ang);
      ctx.font = `700 ${Math.max(11, 14 * K)}px system-ui`; ctx.lineWidth = 4 * K; ctx.strokeStyle = '#000'; ctx.strokeText(w.name, 0, 0);
      ctx.fillStyle = '#cfe3ea'; ctx.fillText(w.name, 0, 0); ctx.restore();
      seen.add(w.name); n++;
    }
  }
  function clipPolyNear(poly, near) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ina = a.y >= near, inb = b.y >= near;
      if (ina) out.push(a);
      if (ina !== inb) { const t = (near - a.y) / (b.y - a.y); out.push({ x: a.x + (b.x - a.x) * t, y: near }); }
    }
    return out;
  }
  function drawBuildings(cam) {
    if (cam.kind === 'flat') {
      const range = (Math.max(W, H) / cam.scale) * 0.8;
      const list = allBuildings();
      for (const dest of [false, true]) { // destination last, on top
        ctx.lineWidth = Math.max(1, (dest ? 2.5 : 1.2) * K);
        ctx.fillStyle = rgbs(dest ? C.destWall : C.bFill, 1); ctx.strokeStyle = rgbs(dest ? C.destEdge : C.bEdge, 1);
        for (const b of list) {
          if (!!b.isDest !== dest || Math.hypot(b.c.x - cam.cx, b.c.y - cam.cy) - b.r > range * (dest ? 3 : 1)) continue;
          const s = camSegments(cam, b.xy)[0]; ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      return;
    }
    // Perspective: extrude each footprint into walls, then paint far-to-near.
    const items = [];
    for (const b of allBuildings()) {
      if (Math.hypot(b.c.x - cam.cx, b.c.y - cam.cy) - b.r > cam.far * (b.isDest ? 1.8 : 1)) continue;
      const f = b.xy.map((p) => { const q = N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading); return { x: q.x, y: q.y + cam.back }; });
      let mind = Infinity;
      for (let i = 0; i < f.length - 1; i++) {
        const a = f[i], c = f[i + 1], d = (a.y + c.y) / 2; mind = Math.min(mind, d);
        const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
        items.push({ a, c, h: b.h, d, dest: b.isDest, shade: 0.72 + 0.28 * (Math.abs(c.x - a.x) / len) });
      }
      if (cam.height > b.h) items.push({ roof: f, h: b.h, d: mind - 0.01, dest: b.isDest });
    }
    items.sort((p, q) => q.d - p.d);
    ctx.lineWidth = Math.max(1, 1.3 * K);
    for (const it of items) {
      if (it.roof) {
        const poly = clipPolyNear(it.roof, 1.5); if (poly.length < 3) continue;
        const sp = poly.map((p) => projCam(cam, p, it.h)), fg = it.dest ? Math.max(0.6, fog(cam, it.d)) : fog(cam, it.d);
        ctx.fillStyle = rgbs(it.dest ? C.destRoof : C.roof, fg); ctx.strokeStyle = rgbs(it.dest ? C.destEdge : C.wallEdge, fg);
        ctx.beginPath(); ctx.moveTo(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y); ctx.closePath(); ctx.fill(); ctx.stroke();
        continue;
      }
      const clip = N.clipNear(it.a, it.c, 1.5); if (!clip) continue;
      const b0 = projCam(cam, clip[0], 0), b1 = projCam(cam, clip[1], 0), t0 = projCam(cam, clip[0], it.h), t1 = projCam(cam, clip[1], it.h);
      const fg = it.dest ? Math.max(0.6, fog(cam, it.d)) : fog(cam, it.d); // the destination stays visible through the fog
      ctx.fillStyle = rgbs(it.dest ? C.destWall : C.wall, fg * it.shade); ctx.strokeStyle = rgbs(it.dest ? C.destEdge : C.wallEdge, fg);
      ctx.lineWidth = Math.max(1, (it.dest ? 2.4 : 1.3) * K);
      ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t0.x, t0.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  // Flowing chevrons painted on the ground along the route, like AR walking guidance.
  function drawChevrons(cam, now) {
    const r = S.route, sn = S.snap; if (!r || !sn) return;
    const SP = 6.5, ahead = cam.kind === 'flat' ? cam.span * 0.9 : Math.min(cam.far, 160), phase = ((now / 1000) * 2.4) % SP;
    const size = cam.kind === 'flat' ? clamp(3 / (cam.scale * 2.6), 1, 3) : 1; // keep them legible when zoomed out
    const SHAPE = [[0.9, 0], [-0.9, 1.5], [-0.9, 0.75], [0.15, 0], [-0.9, -0.75], [-0.9, -1.5]];
    let seg = sn.seg, a = { x: sn.x, y: sn.y };
    for (let s = phase; s < ahead && seg < r.pts.length - 1; s += SP) {
      // advance along the polyline by s from the snapped point
      let rem = s, p = a, i = seg;
      while (i < r.pts.length - 1) {
        const q = r.pts[i + 1], l = Math.hypot(q.x - p.x, q.y - p.y);
        if (rem <= l) break; rem -= l; p = q; i++;
      }
      if (i >= r.pts.length - 1) break;
      const q = r.pts[i + 1], l = Math.hypot(q.x - p.x, q.y - p.y) || 1, ux = (q.x - p.x) / l, uy = (q.y - p.y) / l;
      const c = { x: p.x + ux * rem, y: p.y + uy * rem };
      const pts = SHAPE.map(([f, lat]) => projPoint(cam, { x: c.x + ux * f * size - uy * lat * size, y: c.y + uy * f * size + ux * lat * size }));
      if (pts.some((v) => !v || (cam.kind === 'persp' && v.d < 6))) continue; // skip ones under your feet
      const d = pts[0].d, fade = cam.kind === 'flat' ? 1 : fog(cam, d);
      ctx.fillStyle = rgbs([25, 224, 255], fade);
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); ctx.closePath(); ctx.fill();
    }
  }
  function drawRoute(cam, now) {
    if (!S.route) return;
    // remaining part of the route, starting at the snapped point
    const r = S.route, sn = S.snap;
    const pts = sn ? [{ x: sn.x, y: sn.y }, ...r.pts.slice(sn.seg + 1)] : r.pts;
    const segs = camSegments(cam, pts);
    // a painted ribbon down the street: dark teal body, chevrons on top
    for (const [wm, col] of [[3.4, [0, 74, 92]], [2.4, [6, 120, 150]]]) for (const s of segs) if (s.length > 1) strokeLine(cam, s, wm, col, 120 * K);
    drawChevrons(cam, now);
    // destination: ring on the ground and a pole you can see from afar
    const dpt = r.pts[r.pts.length - 1], g = projPoint(cam, dpt, 0);
    if (g) {
      ctx.strokeStyle = '#ffd24a'; ctx.fillStyle = '#ffd24a'; ctx.lineWidth = 3 * K;
      if (cam.kind === 'flat') { ctx.beginPath(); ctx.arc(g.x, g.y, 9 * K, 0, 7); ctx.stroke(); }
      else {
        const top = projPoint(cam, dpt, 14), rr = clamp((cam.F * 3) / Math.max(g.d, 3), 3 * K, 40 * K);
        ctx.beginPath(); ctx.ellipse(g.x, g.y, rr, rr * 0.35, 0, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(top.x, top.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(top.x, top.y, Math.max(3 * K, rr * 0.25), 0, 7); ctx.fill();
      }
    }
  }
  function drawUser(cam) {
    let x, y, rot = 0;
    if (cam.kind === 'persp') { x = cam.ax; y = cam.horizon + (cam.F * cam.height) / cam.back; }
    else if (cam.mode === 'overview' && S.pos) {
      const f = N.toForward(S.pos.x - cam.cx, S.pos.y - cam.cy, 0); x = cam.ax + f.x * cam.scale; y = cam.ay - f.y * cam.scale; rot = S.heading;
    } else { x = cam.ax; y = cam.ay; }
    const s = (cam.kind === 'persp' ? 11 : 15) * K;
    ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180);
    if (S.pos && S.pos.acc > 12 && cam.kind === 'flat') { ctx.fillStyle = 'rgba(25,224,255,.12)'; ctx.beginPath(); ctx.arc(0, 0, S.pos.acc * cam.scale, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3 * K;
    ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, s); ctx.lineTo(0, s * 0.5); ctx.lineTo(-s, s); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  }

  function drawArrow(cx, cy, size, angleDeg, color, lw) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L = size, a = (angleDeg * Math.PI) / 180;
    const head = (x, y, dir) => { // dir in radians, 0 = up
      const h = size * 0.42; ctx.save(); ctx.translate(x, y); ctx.rotate(dir);
      ctx.beginPath(); ctx.moveTo(0, -h * 0.9); ctx.lineTo(h * 0.8, h * 0.2); ctx.lineTo(-h * 0.8, h * 0.2); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    if (Math.abs(angleDeg) >= 170) { // U-turn
      const sgn = angleDeg > 0 ? 1 : -1, r = L * 0.42;
      ctx.beginPath(); ctx.moveTo(sgn * r, L * 0.7); ctx.lineTo(sgn * r, -L * 0.2); ctx.arc(0, -L * 0.2, r, 0, -Math.PI, sgn < 0 ? false : true);
      ctx.lineTo(-sgn * r, L * 0.15); ctx.stroke(); head(-sgn * r, L * 0.2, Math.PI);
    } else if (angleDeg === 0) {
      ctx.beginPath(); ctx.moveTo(0, L * 0.7); ctx.lineTo(0, -L * 0.35); ctx.stroke(); head(0, -L * 0.45, 0);
    } else {
      const kx = Math.sin(a), ky = -Math.cos(a), seg = L * 0.7;
      ctx.translate(-kx * seg * 0.5, 0);
      ctx.beginPath(); ctx.moveTo(0, L * 0.75); ctx.lineTo(0, 0); ctx.lineTo(kx * seg, ky * seg); ctx.stroke(); head(kx * seg + kx * size * 0.1, ky * seg + ky * size * 0.1, a);
    }
    ctx.restore();
  }
  function text(str, x, y, size, color, align = 'left', maxW) {
    ctx.font = `700 ${size}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    let s = str;
    if (maxW) { while (ctx.measureText(s).width > maxW && s.length > 3) s = s.slice(0, -2); if (s !== str) s = s.trimEnd() + '…'; }
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }

  function hudBanner() {
    const p = S.prog; if (!p) return;
    const step = p.next || p.cur;
    const d = N.formatDist(p.toManeuver, UNITS);
    const pad = 14 * K;
    ctx.fillStyle = 'rgba(0,0,0,.72)'; roundRect(pad / 2, pad / 2, W - pad, 104 * K, 18 * K); ctx.fill();
    ctx.strokeStyle = '#1e3a44'; ctx.lineWidth = 2 * K; ctx.stroke();
    drawArrow(pad + 40 * K, pad / 2 + 58 * K, 46 * K, N.arrowAngle(p.next || null), '#19e0ff', 11 * K);
    text(d.v, pad + 108 * K, pad / 2 + 62 * K, 54 * K, '#fff');
    ctx.font = `700 ${54 * K}px system-ui`; const w = ctx.measureText(d.v).width;
    text(d.u, pad + 114 * K + w, pad / 2 + 62 * K, 26 * K, '#8fb0bb');
    text(instrText(step), pad + 108 * K, pad / 2 + 94 * K, 22 * K, '#f2fbff', 'left', W - pad * 2 - 108 * K);
  }
  function hudFooter() {
    if (!S.prog) return;
    const rem = N.formatDist(S.prog.remaining, UNITS);
    const eta = N.formatEta(S.route.duration * (S.prog.remaining / Math.max(1, S.route.total)));
    text(`${rem.v} ${rem.u} · ${eta}`, 16 * K, H - 16 * K, 24 * K, '#f2fbff');
    text(S.view === 'overhead' ? `overhead ${S.zoom + 1}/4` : S.view, W - 16 * K, H - 16 * K, 20 * K, '#8fb0bb', 'right');
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawTurnCard() {
    const p = S.prog; if (!p) return;
    const step = p.next || p.cur, d = N.formatDist(p.toManeuver, UNITS);
    drawArrow(W / 2, H * 0.3, 170 * K, N.arrowAngle(p.next || null), '#19e0ff', 34 * K);
    ctx.font = `800 ${104 * K}px system-ui`; const w1 = ctx.measureText(d.v).width; ctx.font = `700 ${40 * K}px system-ui`; const w2 = ctx.measureText(d.u).width;
    const x0 = W / 2 - (w1 + w2 + 12 * K) / 2;
    text(d.v, x0, H * 0.72, 104 * K, '#fff'); text(d.u, x0 + w1 + 12 * K, H * 0.72, 40 * K, '#8fb0bb');
    text(instrText(step), W / 2, H * 0.81, 30 * K, '#f2fbff', 'center', W - 40 * K);
    const nn = S.route.steps[p.index + 2];
    if (nn && p.next && p.next.type !== 'arrive' && S.route.steps[p.index + 1].distance < 120)
      text('then ' + N.instruction(nn).toLowerCase(), W / 2, H * 0.875, 22 * K, '#8fb0bb', 'center', W - 40 * K);
    // progress bar
    const frac = clamp(S.snap ? S.snap.along / S.route.total : 0, 0, 1);
    ctx.fillStyle = '#16303a'; ctx.fillRect(30 * K, H - 22 * K, W - 60 * K, 6 * K);
    ctx.fillStyle = '#19e0ff'; ctx.fillRect(30 * K, H - 22 * K, (W - 60 * K) * frac, 6 * K);
  }

  function drawIdle() {
    text('Where to?', W / 2, H * 0.42, 48 * K, '#fff', 'center');
    text(S.pos ? 'Press Enter or tap to search' : 'Waiting for GPS…', W / 2, H * 0.52, 24 * K, '#8fb0bb', 'center');
    if (S.pos) { const cam = makeCamera(); drawWorld(cam); drawUser(cam); }
  }

  function draw(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (!S.route) { drawIdle(); }
    else if (S.view === 'turn') { drawTurnCard(); }
    else {
      const cam = makeCamera();
      drawWorld(cam); drawRoute(cam, now); drawUser(cam);
      if (S.prog && S.prog.arrived) text('You have arrived', W / 2, H * 0.5, 40 * K, '#ffd24a', 'center');
      else hudBanner();
      hudFooter();
    }
    if (S.pos && performance.now() - S.lastFix > 10000 && !S.sim) text('GPS signal lost', W / 2, H * 0.3, 26 * K, '#ff6b6b', 'center');
    if (S.toast && now < S.toastUntil) {
      ctx.font = `700 ${22 * K}px system-ui`; const tw = Math.min(W - 30, ctx.measureText(S.toast).width + 36 * K);
      ctx.fillStyle = 'rgba(10,20,26,.92)'; roundRect(W / 2 - tw / 2, H * 0.58, tw, 46 * K, 14 * K); ctx.fill();
      text(S.toast, W / 2, H * 0.58 + 31 * K, 22 * K, '#f2fbff', 'center', tw - 20);
    }
  }

  // ---------------------------------------------------------------- loop
  let lastDraw = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (S.sim) stepSim(now);
    // smooth heading (shortest way round)
    const tgt = currentHeadingTarget();
    if (!S.headingInit) { S.heading = tgt; S.headingInit = true; }
    else S.heading = (S.heading + N.angleDiff(S.heading, tgt) * 0.12 + 360) % 360;
    if (now - lastDraw < 30) return; // ~30 fps is plenty and saves battery
    lastDraw = now; draw(now);
  }
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; K = Math.min(W, H) / 600;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }

  // ---------------------------------------------------------------- UI
  const tb = $('toolbar'), search = $('search');
  let tbTimer;
  function showToolbar() { tb.classList.remove('hide'); clearTimeout(tbTimer); tbTimer = setTimeout(() => tb.classList.add('hide'), 5000); updateButtons(); }
  function updateButtons() { $('bMute').textContent = S.muted ? 'Voice off' : 'Voice on'; $('bMute').classList.toggle('on', !S.muted); }
  function cycleView() { S.view = VIEWS[(VIEWS.indexOf(S.view) + 1) % VIEWS.length]; toast({ chase: 'Ahead view', turn: 'Turn-by-turn', overhead: 'Overhead — heading up', overview: 'Whole route' }[S.view], 1500); }
  function zoom(dir) { S.zoom = clamp(S.zoom + dir, 0, 3); if (S.view === 'turn' || S.view === 'overview') S.view = 'overhead'; }
  function openSearch() { search.classList.add('open'); $('q').value = ''; $('results').innerHTML = ''; $('msg').textContent = S.pos ? '' : 'Still waiting for a location fix — you can search, then pick once it arrives.'; setTimeout(() => $('q').focus(), 50); }
  function closeSearch() { search.classList.remove('open'); $('q').blur(); }

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('q').value.trim(); if (!q) return;
    $('msg').textContent = 'Searching…'; $('results').innerHTML = '';
    try {
      const rs = await geocode(q);
      $('msg').textContent = rs.length ? '' : 'No matches — try adding the city.';
      for (const r of rs) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = r.name;
        b.onclick = async () => { $('msg').textContent = 'Routing…'; if (await routeTo(r)) { closeSearch(); if (S.view === 'turn') S.view = 'chase'; } else $('msg').textContent = S.pos ? 'No walking route found.' : 'Waiting for a location fix…'; };
        $('results').appendChild(b);
      }
      const first = $('results').firstChild; if (first) first.focus();
    } catch (err) { $('msg').textContent = 'Search failed — check your connection.'; }
  });
  $('bClose').onclick = closeSearch;
  $('bView').onclick = () => { cycleView(); showToolbar(); };
  $('bIn').onclick = () => { zoom(-1); showToolbar(); };
  $('bOut').onclick = () => { zoom(1); showToolbar(); };
  $('bSearch').onclick = () => openSearch();
  $('bMute').onclick = () => { S.muted = !S.muted; if (S.muted && window.speechSynthesis) speechSynthesis.cancel(); showToolbar(); };
  $('bEnd').onclick = () => { endRoute(); showToolbar(); };

  // Tap = next view. Long-press = toolbar. Works for touch, mouse and the Neural Band's click.
  let downAt = 0, pressTimer;
  canvas.addEventListener('pointerdown', () => { downAt = performance.now(); pressTimer = setTimeout(showToolbar, 550); });
  canvas.addEventListener('pointerup', () => {
    clearTimeout(pressTimer);
    if (performance.now() - downAt < 550) { if (!S.route) openSearch(); else cycleView(); }
  });
  canvas.addEventListener('wheel', (e) => { zoom(e.deltaY > 0 ? 1 : -1); }, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (search.classList.contains('open')) { if (e.key === 'Escape') closeSearch(); return; }
    const k = e.key;
    if (k === 'Enter' || k === ' ' || k === 'v' || k === 'V') { e.preventDefault(); if (!S.route) openSearch(); else cycleView(); }
    else if (k === '+' || k === '=' || k === 'ArrowUp') zoom(-1);
    else if (k === '-' || k === 'ArrowDown') zoom(1);
    else if (k === '/' || k === 's' || k === 'S') { e.preventDefault(); openSearch(); }
    else if (k === 'm' || k === 'M') { S.muted = !S.muted; updateButtons(); }
    else if (k === 'Escape') { endRoute(); }
    else if (k === 't' || k === 'T') showToolbar();
    else return;
    showToolbar();
  });
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- go
  resize();
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* optional */ }
  startCompass();
  if (DEMO) startDemo(); else startGeolocation();
  requestAnimationFrame(loop);
  window.__walk = { S, Nav: N }; // handy for debugging in the console
})();
