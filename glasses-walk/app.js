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
    ways: [], buildings: [], land: [], ground: params.get('ground') !== '0', destExtra: [], waysCenter: null, waysBusy: false,
    route: null, dest: null, snapSeg: 0, snap: null, prog: null, offCount: 0, spoken: -1,
    q: params.has('q') ? clamp(+params.get('q') || 0, 0, 2) : 2, qForced: params.has('q'), ms: 0, fps: 0, est: null,
    hint: null, geoStart: performance.now(), manual: false, geoErr: '', pendingDest: null, muted: false, toast: '', toastUntil: 0, sim: null, lastFix: 0,
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
      return true;
    }
    return false;
  }
  function reproject() {
    for (const w of S.ways) projectWay(w);
    for (const b of S.buildings.concat(S.destExtra, S.land)) projectWay(b);
    findDestBuilding();
    if (S.route) { const raw = S.route.raw; S.route = N.buildRoute(raw, S.proj); S.route.raw = raw; S.snapSeg = 0; }
    if (S.pos) Object.assign(S.pos, S.proj.toXY(S.pos.lat, S.pos.lon));
  }
  function projectWay(w) {
    w.xy = w.ll.map((p) => S.proj.toXY(p.lat, p.lon));
    let sx = 0, sy = 0; for (const p of w.xy) { sx += p.x; sy += p.y; }
    w.c = { x: sx / w.xy.length, y: sy / w.xy.length };
    w.r = Math.max(...w.xy.map((p) => Math.hypot(p.x - w.c.x, p.y - w.c.y)));
    let area = 0; for (let i = 0; i < w.xy.length - 1; i++) area += w.xy[i].x * w.xy[i + 1].y - w.xy[i + 1].x * w.xy[i].y;
    w.orient = area >= 0 ? 1 : -1; // +1 = counter-clockwise
  }

  // ---------------------------------------------------------------- location + heading
  const E = N.createFilter(); // GPS filter: weights fixes by accuracy, learns velocity, dead-reckons between fixes
  function onFix(lat, lon, acc, heading, speed, manual, ageMs) {
    const wasManual = S.manual, age = (ageMs || 0) / 1000;
    if (!manual && age > 4) { // a cached fix: fine to start from, never better than what we already know
      if (E.init) return;
      acc = (acc || 50) + age * 1.5;
    }
    S.manual = !!manual; if (!manual) S.geoErr = '';
    if (ensureProj(lat, lon)) E.init = false; // map origin moved: start the filter afresh
    const xy = S.proj.toXY(lat, lon), t = performance.now() / 1000, first = !E.init;
    if (manual || (wasManual && !manual)) E.reset(xy, acc || 30, t); else E.update(xy, acc, speed, heading, t);
    if (!manual && acc < 100) rememberHere(lat, lon);
    S.lastFix = performance.now();
    const e = E.at(t), ll = S.proj.toLL(e.x, e.y);
    if (!S.pos) S.pos = { x: e.x, y: e.y };
    Object.assign(S.pos, { lat: ll.lat, lon: ll.lon, acc: acc || 0 });
    if (manual || first) { S.pos.x = e.x; S.pos.y = e.y; } // jump, don't glide
    S.est = { x: e.x, y: e.y };
    if (typeof speed === 'number' && !isNaN(speed)) S.speed = speed;
    if (typeof heading === 'number' && !isNaN(heading) && S.speed > 0.8) S.gpsHeading = heading;
    updateProgress(true);
    maybeFetchWays();
    if (S.pendingDest && !S.route) { const d = S.pendingDest; S.pendingDest = null; routeTo(d); }
  }
  // Last known position survives reloads, so search can favour the right area before GPS has locked.
  let lastSaved = 0;
  function rememberHere(lat, lon) {
    const now = Date.now(); if (now - lastSaved < 10000) return; lastSaved = now;
    try { localStorage.setItem('walk.last', JSON.stringify({ lat, lon, t: now })); } catch (e) { /* private mode */ }
  }
  function loadHint() {
    try { const j = JSON.parse(localStorage.getItem('walk.last') || 'null'); if (j && Date.now() - j.t < 7 * 864e5) S.hint = { lat: j.lat, lon: j.lon }; } catch (e) { /* ignore */ }
  }
  // "I'm here": use when GPS is unavailable. Real GPS fixes replace it automatically if they arrive later.
  function setManualLocation(lat, lon, label) {
    onFix(lat, lon, 30, null, 0, true);
    toast(label ? 'Location set: ' + label : 'Location set', 3000);
  }
  function parseLatLon(q) {
    const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(q);
    if (!m) return null;
    const lat = +m[1], lon = +m[2];
    return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
  }
  // Cold GPS can take 30 s+. So ask three ways at once: a quick coarse fix (Wi-Fi / cell / cached) for an
  // immediate start, a precise GPS watch that refines it, and a coarse watch as a safety net.
  let geoIds = [];
  function startGeolocation() {
    if (!window.isSecureContext) S.geoErr = 'Location needs a secure (https) page';
    const geo = navigator.geolocation;
    if (!geo) { S.geoErr = 'This browser has no location sensor'; return; }
    geoIds.forEach((id) => geo.clearWatch(id)); geoIds = []; S.geoStart = performance.now();
    let loId = null, hiBad = false, loBad = false;
    const ok = (p) => {
      if (S.sim) return;
      const c = p.coords; S.geoErr = '';
      onFix(c.latitude, c.longitude, c.accuracy, c.heading, c.speed, false, Date.now() - p.timestamp);
      if (c.accuracy <= 30 && loId !== null) { geo.clearWatch(loId); loId = null; } // GPS is good now: stop the coarse watch
    };
    const bad = (hi) => (e) => {
      if (e.code === 1) { S.geoErr = 'Location permission denied'; return; }
      if (hi) hiBad = true; else loBad = true;
      if (hiBad && loBad && !S.pos) S.geoErr = e.code === 3 ? 'Location timed out' : 'Location unavailable';
    };
    geo.getCurrentPosition(ok, () => {}, { enableHighAccuracy: false, maximumAge: 600000, timeout: 4000 }); // instant if the phone has any idea
    geoIds.push(geo.watchPosition(ok, bad(true), { enableHighAccuracy: true, maximumAge: 0, timeout: 60000 }));
    loId = geo.watchPosition(ok, bad(false), { enableHighAccuracy: false, maximumAge: 120000, timeout: 15000 }); geoIds.push(loId);
    // learn about a permission change straight away instead of waiting for a timeout
    if (navigator.permissions && !startGeolocation.watching) {
      startGeolocation.watching = true;
      navigator.permissions.query({ name: 'geolocation' }).then((st) => {
        const check = () => { if (st.state === 'denied') S.geoErr = 'Location permission denied'; else if (S.geoErr === 'Location permission denied') { S.geoErr = ''; startGeolocation(); } };
        st.onchange = check; check();
      }).catch(() => {});
    }
  }
  function startCompass() {
    const handler = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
      if (h !== null) S.compass = S.compass === null ? h : N.lerpAngle(S.compass, h, 0.3); // damp sensor jitter
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
  // Standing: face where the compass says. Walking: face the way you are going, along the street when on the route.
  function headingTarget() {
    if (S.sim) return S.sim.heading;
    const e = E.at(performance.now() / 1000), sp = e ? e.speed : 0;
    let course = null;
    if (e && sp > 0.5) {
      course = N.bearing(e.vx, e.vy);
      if (S.route && S.snap && S.snap.dist <= snapTol()) { const p = S.route.pts, i = S.snap.seg; course = N.bearing(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y); }
    }
    const w = clamp((sp - 0.6) / 0.8, 0, 1);
    if (S.compass !== null && course !== null) return N.lerpAngle(S.compass, course, w);
    if (course !== null) return course;
    if (S.compass !== null) return S.compass;
    return S.gpsHeading ?? S.heading;
  }
  const snapTol = () => Math.max(12, 1.2 * ((S.pos && S.pos.acc) || 0)); // how far off the street still counts as "on it"

  // ---------------------------------------------------------------- map data (OpenStreetMap)
  // Real-world widths (metres) so streets read as streets: kerb to kerb.
  const ROAD_STYLE = { trunk: 13, primary: 12, secondary: 10, tertiary: 9, residential: 7, unclassified: 7, living_street: 6, road: 7, service: 4, pedestrian: 5 };
  const PATH_STYLE = { footway: 2, path: 1.8, steps: 2, cycleway: 2.2, track: 3, bridleway: 2, corridor: 2 };
  function roadStyle(hw) {
    if (PATH_STYLE[hw]) return { path: true, w: PATH_STYLE[hw] };
    return { path: false, w: ROAD_STYLE[hw] || 6 };
  }
  async function loadMap(lat, lon, roadR, bldR, landR, timeout) {
    const at = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    let q = `[out:json][timeout:25];(way(around:${roadR},${at})[highway][highway!~"^(motorway|motorway_link|proposed|construction|raceway)$"];way(around:${bldR},${at})[building];`;
    if (landR) q += `way(around:${landR},${at})[leisure~"^(park|garden|pitch|playground|recreation_ground|golf_course)$"];way(around:${landR},${at})[landuse~"^(grass|forest|meadow|recreation_ground|cemetery|village_green|orchard|allotments)$"];way(around:${landR},${at})[natural~"^(water|wood|scrub|grassland|wetland|beach)$"];way(around:${landR},${at})[amenity=parking];`;
    q += ');out geom;';
    const j = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) }, timeout);
    const ways = [], blds = [], land = [];
    for (const e of j.elements) {
      if (!e.geometry || e.geometry.length < (e.tags.building ? 4 : 2)) continue;
      const ll = e.geometry.map((g) => ({ lat: g.lat, lon: g.lon }));
      if (e.tags.building) {
        const h = parseFloat(e.tags.height) || parseFloat(e.tags['building:levels']) * 3.2 || 9;
        const b = { ll, h: clamp(h, 4, 80) }; projectWay(b); blds.push(b);
      } else if (e.tags.highway) {
        const w = { ll, name: e.tags.name || '', ...roadStyle(e.tags.highway) }; projectWay(w); ways.push(w);
      } else if (e.geometry.length > 3) { // land cover polygon
        const t = e.tags, kind = t.natural === 'water' || t.natural === 'wetland' ? 'water' : t.amenity === 'parking' ? 'parking' : t.natural === 'beach' ? 'sand' : 'green';
        const l = { ll, kind }; projectWay(l); land.push(l);
      }
    }
    return { ways, blds: blds.slice(0, 1800), land: land.slice(0, 500) };
  }
  async function maybeFetchWays() {
    if (DEMO || S.waysBusy || !S.pos) return;
    if (S.waysCenter && Math.hypot(S.pos.x - S.waysCenter.x, S.pos.y - S.waysCenter.y) < 120) return;
    S.waysBusy = true;
    const c = { x: S.pos.x, y: S.pos.y }, { lat, lon } = S.pos, apply = (m) => { S.ways = m.ways; S.buildings = m.blds; S.land = m.land; findDestBuilding(); };
    try {
      if (!S.ways.length) { // first load: a small patch right away so you see streets in a second or two
        apply(await loadMap(lat, lon, 220, 140, 0, 12000)); S.waysCenter = c;
      }
      apply(await loadMap(lat, lon, 500, 300, 450, 30000)); S.waysCenter = c;
    } catch (err) { toast('Map data unavailable — retrying'); if (!S.ways.length) S.waysCenter = null; setTimeout(() => (S.waysBusy = false), 8000); return; }
    S.waysBusy = false;
  }

  // ---------------------------------------------------------------- search + routing
  // Nearby-first search: look in a small box around you, widen only if that finds little,
  // and finally fall back to a worldwide search. Results are merged and sorted by distance.
  async function geocode(q) {
    const here = S.pos || S.hint, found = new Map();
    const add = (rows) => {
      for (const r of rows) {
        const lat = +r.lat, lon = +r.lon, key = lat.toFixed(5) + ',' + lon.toFixed(5);
        if (!found.has(key)) found.set(key, { name: r.display_name, lat, lon, dist: here ? N.haversine(here, { lat, lon }) : null });
      }
    };
    const query = async (extra) => {
      const u = new URL('https://nominatim.openstreetmap.org/search');
      u.search = new URLSearchParams({ format: 'jsonv2', q, limit: '10', ...extra });
      try { add(await getJSON(u.toString())); } catch (e) { if (!found.size) throw e; }
    };
    if (here) {
      for (const d of [0.05, 0.25]) { // ~5 km, then ~27 km
        const dx = d / Math.max(0.2, Math.cos((here.lat * Math.PI) / 180));
        await query({ viewbox: [here.lon - dx, here.lat + d, here.lon + dx, here.lat - d].join(','), bounded: '1' });
        if (found.size >= 3) break;
      }
    }
    if (found.size < 3) await query({}); // nothing close by: search everywhere
    return [...found.values()].sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0)).slice(0, 8);
  }
  async function routeTo(dest, quiet) {
    if (!S.pos) { toast('Waiting for a location fix…'); return false; }
    if (!S.manual && !S.sim && S.pos.acc > 60) { // coarse fix: give the GPS a few seconds to sharpen before planning from it
      toast('Sharpening your location…', 3000);
      for (const end = performance.now() + 6000; S.pos.acc > 60 && performance.now() < end;) await new Promise((r) => setTimeout(r, 250));
    }
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

  function updateProgress(isFix) {
    if (!S.route || !S.est) return;
    const sn = N.snap(S.route.pts, S.route.cum, S.est, Math.max(0, S.snapSeg - 2), 60);
    if (!sn) return;
    S.snap = sn; S.snapSeg = sn.seg;
    S.prog = N.progress(S.route, sn.along);
    const acc = (S.pos && S.pos.acc) || 0, far = Math.max(40, 3 * acc); // poor GPS must not trigger a reroute
    if (isFix && !S.sim) {
      if (sn.dist > far) { if (++S.offCount >= 3) { S.offCount = 0; toast('Rerouting…'); routeTo(S.dest, true); return; } }
      else S.offCount = 0;
    }
    // voice: warn earlier when you walk faster or the fix is poor
    const p = S.prog, e = E.at(performance.now() / 1000), lead = clamp(((e && e.speed) || 1.3) * 7 + acc, 40, 95);
    if (p.arrived) { if (S.spoken !== -2) { speak('You have arrived'); S.spoken = -2; } return; }
    if (p.next && p.toManeuver < lead && S.spoken !== p.index) {
      S.spoken = p.index;
      const d = N.formatDist(p.toManeuver, UNITS);
      speak(`In ${d.v} ${({ ft: 'feet', mi: 'miles', m: 'metres', km: 'kilometres' })[d.u]}, ${instrText(p.next)}`);
    }
  }
  // Every frame: dead-reckon from the filter, glide the dot toward it, and lock to the street when you're on it.
  function updatePose(now, dt) {
    const e = E.at(now / 1000); if (!e || !S.pos) return;
    S.est = { x: e.x, y: e.y };
    updateProgress(false);
    let tx = e.x, ty = e.y;
    if (S.route && S.snap && S.snap.dist <= snapTol()) { tx += (S.snap.x - e.x) * 0.85; ty += (S.snap.y - e.y) * 0.85; }
    const a = 1 - Math.exp(-dt / 0.07);
    S.pos.x += (tx - S.pos.x) * a; S.pos.y += (ty - S.pos.y) * a;
  }
  function speak(t) {
    if (S.muted || !window.speechSynthesis) return;
    try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- demo / simulator
  function startDemo() {
    const o = { lat: 37.7749, lon: -122.4194 };
    S.proj = N.makeProjector(o);
    const ways = [], blds = [], landDemo = [];
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
      if (rnd() < 0.07 && !(bi === 5 && bj === 4)) { // the odd park / pond / car park instead of buildings
        const kind = ['green', 'green', 'water', 'parking'][Math.floor(rnd() * 4)];
        landDemo.push({ ll: [[bi * 90 + 6, bj * 90 + 6], [bi * 90 + 84, bj * 90 + 6], [bi * 90 + 84, bj * 90 + 84], [bi * 90 + 6, bj * 90 + 84], [bi * 90 + 6, bj * 90 + 6]].map(([x, y]) => S.proj.toLL(x, y)), kind });
        continue;
      }
      const x0 = bi * 90 + 8, x1 = bi * 90 + 82, y0 = bj * 90 + 8, y1 = bj * 90 + 82;
      const nx = 1 + Math.floor(rnd() * 3), ny = 1 + Math.floor(rnd() * 2);
      for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
        const ax = x0 + ((x1 - x0) * a) / nx + 1, bx = x0 + ((x1 - x0) * (a + 1)) / nx - 1;
        const ay = y0 + ((y1 - y0) * b) / ny + 1, by = y0 + ((y1 - y0) * (b + 1)) / ny - 1;
        const ring = [[ax, ay], [bx, ay], [bx, by], [ax, by], [ax, ay]].map(([x, y]) => S.proj.toLL(x, y));
        blds.push({ ll: ring, h: 7 + rnd() * rnd() * 55 });
      }
    }
    ways.forEach(projectWay); blds.forEach(projectWay); landDemo.forEach(projectWay);
    S.land = landDemo; S.ways = ways; S.buildings = blds; S.waysCenter = { x: 0, y: 0 };
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
  // Strokes are batched: thousands of road segments collapse into a few dozen draw calls, one per
  // (colour, fog level, width) bucket, which is what keeps the first-person view fast.
  let batch = null;
  const beginBatch = () => { batch = new Map(); };
  function flushBatch() {
    if (!batch) return;
    const list = [...batch.values()].sort((a, b) => a.f - b.f); // faint/far first
    for (const b of list) { ctx.strokeStyle = rgbs(b.rgb, b.f); ctx.lineWidth = b.w; ctx.stroke(b.path); }
    batch = null;
  }
  function bucket(key, rgb, fq, wq) {
    let b = batch.get(key);
    if (!b) batch.set(key, (b = { path: new Path2D(), rgb, f: fq / 16, w: Math.max(0.5, wq / 2) }));
    return b.path;
  }
  // Add a screen polyline with a real-world width; perspective width and fog follow depth per segment.
  // Segments that are off-screen, past maxD, or too faint to matter are skipped; runs of segments that land
  // in the same bucket stay one sub-path (fewer caps/joins for the rasteriser to build).
  function strokeLine(cam, s, meters, rgb, maxPx, maxD) {
    const own = !batch; if (own) beginBatch();
    const rgbKey = (rgb[0] * 65536 + rgb[1] * 256 + rgb[2]) * 17;
    let lastKey = -1, p = null;
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i], persp = cam.kind !== 'flat';
      const d = persp ? (a.d + b.d) / 2 : 0;
      if (maxD && d > maxD) { lastKey = -1; continue; }
      const f = persp ? fog(cam, d) : 1, w = lineW(cam, meters, d, maxPx), m = w / 2 + 12;
      if ((a.x < -m && b.x < -m) || (a.x > W + m && b.x > W + m) || (a.y > H + m && b.y > H + m) || (a.y < -m && b.y < -m)) { lastKey = -1; continue; }
      if (persp && f < 0.1) { lastKey = -1; continue; }
      const fq = Math.round(f * 16), wq = Math.round(w * 2), key = (rgbKey + fq) * 4096 + wq;
      if (key !== lastKey) { p = bucket(key, rgb, fq, wq); p.moveTo(a.x, a.y); lastKey = key; }
      p.lineTo(b.x, b.y);
    }
    if (own) flushBatch();
  }

  // ---------------------------------------------------------------- drawing the street scene
  const C = {
    ground: [15, 23, 27], park: [22, 58, 38], water: [12, 42, 72], parking: [38, 44, 50], sand: [70, 64, 44],
    sidewalk: [84, 100, 108], curb: [190, 212, 220], asphalt: [54, 64, 70], centre: [210, 184, 84],
    pathEdge: [100, 160, 135], pathFill: [60, 100, 88],
    destWall: [150, 108, 8], destEdge: [255, 214, 80], destRoof: [215, 160, 20],
    wall: [20, 34, 42], wallEdge: [92, 124, 138], roof: [34, 54, 64], bFill: [16, 30, 38], bEdge: [48, 76, 88],
  };
  function drawWorld(cam) {
    const flat = cam.kind === 'flat';
    const range = flat ? (Math.max(W, H) / cam.scale) * 0.9 : cam.far + 60;
    const near = (o) => Math.hypot(o.c.x - cam.cx, o.c.y - cam.cy) - o.r < range;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    drawGround(cam, near);
    if (flat) drawBuildings(cam); // under the streets when seen from above
    const vis = S.ways.filter(near);
    for (const w of vis) w._s = camSegments(cam, w.xy);
    const roads = vis.filter((w) => !w.path), paths = vis.filter((w) => w.path);
    const pass = (list, width, rgb, maxD) => { beginBatch(); for (const w of list) for (const s of w._s) if (s.length > 1) strokeLine(cam, s, width(w), rgb, 400 * K, maxD); flushBatch(); };
    // all kerbs before all asphalt, so junctions read as one open space instead of crossing lines
    if (S.q >= 1) pass(roads, (w) => w.w + 5, C.sidewalk, 75); // sidewalks only matter up close
    pass(roads, (w) => w.w + 0.9, C.curb, 150);
    pass(paths, (w) => w.w + 0.9, C.pathEdge, 130);
    pass(roads, (w) => w.w, C.asphalt);
    pass(paths, (w) => w.w, C.pathFill, 160);
    if (S.q >= 2 && (!flat || cam.span <= 300)) pass(roads.filter((w) => w.w >= 7), () => 0.22, C.centre, 110);
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
  // Ground: a tinted surface with parks, water and car parks, so roads read against it and you are never floating in a void.
  function drawGround(cam, near) {
    if (!S.ground) return;
    const flat = cam.kind === 'flat';
    if (flat) { ctx.fillStyle = rgbs(C.ground, 1); ctx.fillRect(0, 0, W, H); }
    else {
      const g = ctx.createLinearGradient(0, cam.horizon, 0, cam.horizon + (H - cam.horizon) * 0.5);
      g.addColorStop(0, 'rgb(0,0,0)'); g.addColorStop(1, rgbs(C.ground, 1));
      ctx.fillStyle = g; ctx.fillRect(0, cam.horizon, W, H - cam.horizon);
    }
    const order = { green: 0, sand: 0, parking: 1, water: 2 };
    const vis = S.land.filter(near).sort((a, b) => order[a.kind] - order[b.kind]);
    for (const l of vis) {
      ctx.fillStyle = rgbs(C[l.kind === 'green' ? 'park' : l.kind], 1);
      if (flat) {
        const s = camSegments(cam, l.xy)[0];
        ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y); ctx.closePath(); ctx.fill();
      } else {
        const poly = clipPolyNear(l.xy.map((p) => { const f = N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading); return { x: f.x, y: f.y + cam.back }; }), 1.5);
        if (poly.length < 3) continue;
        const sp = poly.map((p) => projCam(cam, p, 0));
        ctx.beginPath(); ctx.moveTo(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y); ctx.closePath(); ctx.fill();
      }
    }
    if (!flat) { // haze: distant ground melts into the horizon
      const hz = ctx.createLinearGradient(0, cam.horizon, 0, cam.horizon + (H - cam.horizon) * 0.3);
      hz.addColorStop(0, 'rgba(0,0,0,1)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hz; ctx.fillRect(0, cam.horizon, W, (H - cam.horizon) * 0.3);
    }
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
      if (Math.hypot(b.c.x - cam.cx, b.c.y - cam.cy) - b.r > cam.far * (b.isDest ? 1.8 : [0.6, 0.85, 1][S.q])) continue;
      const f = b.xy.map((p) => { const q = N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading); return { x: q.x, y: q.y + cam.back }; });
      let mind = Infinity;
      for (let i = 0; i < f.length - 1; i++) {
        const a = f[i], c = f[i + 1], d = (a.y + c.y) / 2; mind = Math.min(mind, d);
        const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
        if (!S.noCull && ((c.x - a.x) * -a.y - (c.y - a.y) * -a.x) * (b.orient || 1) > 0) continue; // wall faces away from the camera
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
      const fg = it.dest ? Math.max(0.6, fog(cam, it.d)) : fog(cam, it.d); // the destination stays visible through the fog
      if (!it.dest && fg < 0.18) continue; // lost in the haze anyway
      const clip = N.clipNear(it.a, it.c, 1.5); if (!clip) continue;
      const b0 = projCam(cam, clip[0], 0), b1 = projCam(cam, clip[1], 0);
      if (Math.max(b0.x, b1.x) < -30 || Math.min(b0.x, b1.x) > W + 30) continue; // off to the side
      const t0 = projCam(cam, clip[0], it.h), t1 = projCam(cam, clip[1], it.h);
      if (!it.dest && b0.y - t0.y < 2 * K && b1.y - t1.y < 2 * K) continue; // smaller than a couple of pixels
      ctx.fillStyle = rgbs(it.dest ? C.destWall : C.wall, fg * it.shade); ctx.strokeStyle = rgbs(it.dest ? C.destEdge : C.wallEdge, fg);
      ctx.lineWidth = Math.max(1, (it.dest ? 2.4 : 1.3) * K);
      ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t0.x, t0.y); ctx.closePath(); ctx.fill(); if (fg > 0.45) ctx.stroke(); // distant walls: fill only
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
    for (const [wm, col] of [[3.4, [0, 74, 92]], [2.4, [6, 120, 150]]]) { beginBatch(); for (const s of segs) if (s.length > 1) strokeLine(cam, s, wm, col, 120 * K); flushBatch(); }
    drawChevrons(cam, now);
    const gd = guide();
    if (gd && S.est) { // bright line from you to the nearest point of the route, ringed
      for (const s of camSegments(cam, [{ x: S.est.x, y: S.est.y }, { x: gd.x, y: gd.y }])) if (s.length > 1) strokeLine(cam, s, 0.5, [255, 214, 80], 9 * K);
      const j = projPoint(cam, gd);
      if (j) { ctx.strokeStyle = '#ffd650'; ctx.lineWidth = 3 * K; ctx.beginPath(); ctx.arc(j.x, j.y, cam.kind === 'flat' ? 8 * K : clamp((cam.F * 2.5) / Math.max(j.d, 3), 4 * K, 30 * K), 0, 7); ctx.stroke(); }
    }
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
    if (cam.kind === 'persp' && S.pos && S.pos.acc > 8 && !S.sim) { // where the GPS thinks you could be
      ctx.strokeStyle = 'rgba(25,224,255,.5)'; ctx.lineWidth = 2 * K; ctx.beginPath(); let pen = false;
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * 6.2832, v = projPoint(cam, { x: S.pos.x + Math.cos(a) * S.pos.acc, y: S.pos.y + Math.sin(a) * S.pos.acc });
        if (!v) { pen = false; continue; } if (pen) ctx.lineTo(v.x, v.y); else ctx.moveTo(v.x, v.y); pen = true;
      }
      ctx.stroke();
    }
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

  // Standing off the route (in a park, a car park, GPS drift)? Point the way back instead of leaving you in empty space.
  function guide() {
    if (!S.route || !S.snap || !S.est || !S.prog || S.prog.arrived || S.snap.dist <= Math.max(15, 1.5 * ((S.pos && S.pos.acc) || 0))) return null;
    const rel = N.angleDiff(S.heading, N.bearing(S.snap.x - S.est.x, S.snap.y - S.est.y)), a = Math.abs(rel);
    const where = a < 25 ? 'ahead' : a > 135 ? 'behind you' : rel < 0 ? 'to your left' : 'to your right';
    return { angle: rel, dist: S.snap.dist, x: S.snap.x, y: S.snap.y, text: `Head to the route — ${where}` };
  }
  // what the banner / turn card show: the next manoeuvre, or the way back to the route
  function bannerInfo() {
    const p = S.prog, g = guide();
    if (g) return { dist: g.dist, angle: g.angle, text: g.text };
    return { dist: p.toManeuver, angle: N.arrowAngle(p.next || null), text: instrText(p.next || p.cur) };
  }
  function hudBanner() {
    const p = S.prog; if (!p) return;
    const bi = bannerInfo(), d = N.formatDist(bi.dist, UNITS);
    const pad = 14 * K;
    ctx.fillStyle = 'rgba(0,0,0,.72)'; roundRect(pad / 2, pad / 2, W - pad, 104 * K, 18 * K); ctx.fill();
    ctx.strokeStyle = '#1e3a44'; ctx.lineWidth = 2 * K; ctx.stroke();
    drawArrow(pad + 40 * K, pad / 2 + 58 * K, 46 * K, bi.angle, guide() ? '#ffd650' : '#19e0ff', 11 * K);
    text(d.v, pad + 108 * K, pad / 2 + 62 * K, 54 * K, '#fff');
    ctx.font = `700 ${54 * K}px system-ui`; const w = ctx.measureText(d.v).width;
    text(d.u, pad + 114 * K + w, pad / 2 + 62 * K, 26 * K, '#8fb0bb');
    text(bi.text, pad + 108 * K, pad / 2 + 94 * K, 22 * K, '#f2fbff', 'left', W - pad * 2 - 108 * K);
  }
  function hudFooter() {
    if (!S.prog) return;
    const rem = N.formatDist(S.prog.remaining, UNITS);
    const eta = N.formatEta(S.route.duration * (S.prog.remaining / Math.max(1, S.route.total)));
    text(`${rem.v} ${rem.u} · ${eta}`, 16 * K, H - 16 * K, 24 * K, '#f2fbff');
    if (S.pos && !S.sim) {
      const a = S.pos.acc || 0, q = S.manual ? null : a, col = q === null ? '#8fb0bb' : a <= 10 ? '#7dffb0' : a <= 25 ? '#ffd650' : '#ff8a6b';
      const lab = S.manual ? 'location set by you' : 'GPS ±' + (UNITS === 'metric' ? Math.round(a) + ' m' : Math.round(a * 3.28084) + ' ft');
      text(lab, W / 2, H - 52 * K, 16 * K, col, 'center');
    }
    if (S.waysBusy && !S.ways.length) text('Loading map…', W / 2, H * 0.4, 22 * K, '#8fb0bb', 'center');
    if (params.has('debug')) text(`${S.fps.toFixed(0)} fps · ${S.ms.toFixed(1)} ms · q${S.q}`, 12 * K, 150 * K, 16 * K, '#ffd650');
    text(S.view === 'overhead' ? `overhead ${S.zoom + 1}/4` : S.view, W - 16 * K, H - 16 * K, 20 * K, '#8fb0bb', 'right');
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawTurnCard() {
    const p = S.prog; if (!p) return;
    const bi = bannerInfo(), d = N.formatDist(bi.dist, UNITS);
    drawArrow(W / 2, H * 0.3, 170 * K, bi.angle, guide() ? '#ffd650' : '#19e0ff', 34 * K);
    ctx.font = `800 ${104 * K}px system-ui`; const w1 = ctx.measureText(d.v).width; ctx.font = `700 ${40 * K}px system-ui`; const w2 = ctx.measureText(d.u).width;
    const x0 = W / 2 - (w1 + w2 + 12 * K) / 2;
    text(d.v, x0, H * 0.72, 104 * K, '#fff'); text(d.u, x0 + w1 + 12 * K, H * 0.72, 40 * K, '#8fb0bb');
    text(bi.text, W / 2, H * 0.81, 30 * K, '#f2fbff', 'center', W - 40 * K);
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
    if (S.pos) text(S.manual ? 'Using the location you set · tap to search' : 'Press Enter or tap to search', W / 2, H * 0.52, 24 * K, '#8fb0bb', 'center');
    else {
      const secs = Math.round((performance.now() - S.geoStart) / 1000);
      text(S.geoErr || `Finding you… ${secs} s`, W / 2, H * 0.52, 24 * K, S.geoErr ? '#ff9d6b' : '#8fb0bb', 'center', W - 40 * K);
      text(secs >= 6 || S.geoErr ? 'Tap to tell me where you are' : 'Tap to search or set your location', W / 2, H * 0.6, 24 * K, '#19e0ff', 'center');
    }
    if (S.pos && !S.manual && S.pos.acc > 50) text(`Sharpening GPS · ±${UNITS === 'metric' ? Math.round(S.pos.acc) + ' m' : Math.round(S.pos.acc * 3.28084) + ' ft'}`, W / 2, H * 0.6, 20 * K, '#ffd650', 'center');
    if (S.waysBusy && !S.ways.length) text('Loading map…', W / 2, H * 0.68, 20 * K, '#8fb0bb', 'center');
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
  let lastT = 0, frames = 0, qChanged = 0, raisedAt = 0, raiseWait = 6000, dtEma = 1 / 60;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = clamp((now - (lastT || now - 16)) / 1000, 0.001, 0.1); lastT = now;
    if (S.sim) stepSim(now);
    updatePose(now, dt);
    const tgt = headingTarget();
    if (!S.headingInit) { S.heading = tgt; S.headingInit = true; }
    else S.heading = N.lerpAngle(S.heading, tgt, 1 - Math.exp(-dt / 0.15));
    const t0 = performance.now(); draw(now); const cost = performance.now() - t0;
    S.fps += (1 / dt - S.fps) * 0.1; S.ms += (cost - S.ms) * 0.1; dtEma += (dt - dtEma) * 0.08;
    // Adapt to what the device really delivers (frame interval, not just JS time: the raster work is deferred).
    // Below ~42 fps: drop detail. Comfortably at display rate for a while: bring detail back, backing off if that
    // immediately caused trouble last time.
    if (!S.qForced && !document.hidden && ++frames % 45 === 0 && frames > 90) {
      if ((dtEma > 0.024 || S.ms > 11) && S.q > 0) {
        if (now - raisedAt < 20000) raiseWait = Math.min(raiseWait * 2, 120000);
        setQuality(S.q - 1, now);
      } else if (dtEma < 0.0185 && S.ms < 6 && S.q < 2 && now - qChanged > raiseWait) { raisedAt = now; setQuality(S.q + 1, now); }
      else if (dtEma < 0.0185 && now - qChanged > 60000) raiseWait = 6000; // stable for a minute: forget the penalty
    }
  }
  function setQuality(q, now) { S.q = q; qChanged = now; dtEma = 1 / 60; frames = 0; resize(); }
  function resize() {
    DPR = Math.min([1, 1.5, 2][S.q], window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; K = Math.min(W, H) / 600;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }

  // ---------------------------------------------------------------- UI
  const tb = $('toolbar'), search = $('search');
  let tbTimer;
  function showToolbar() { tb.classList.remove('hide'); clearTimeout(tbTimer); tbTimer = setTimeout(() => tb.classList.add('hide'), 5000); updateButtons(); }
  function updateButtons() { $('bGround').textContent = S.ground ? 'Ground on' : 'Ground off'; $('bGround').classList.toggle('on', S.ground); $('bMute').textContent = S.muted ? 'Voice off' : 'Voice on'; $('bMute').classList.toggle('on', !S.muted); }
  function cycleView() { S.view = VIEWS[(VIEWS.indexOf(S.view) + 1) % VIEWS.length]; toast({ chase: 'Ahead view', turn: 'Turn-by-turn', overhead: 'Overhead — heading up', overview: 'Whole route' }[S.view], 1500); }
  function zoom(dir) { S.zoom = clamp(S.zoom + dir, 0, 3); if (S.view === 'turn' || S.view === 'overview') S.view = 'overhead'; }
  let mode = 'dest'; // 'dest' = where to?  'loc' = where am I?
  function setMode(m) {
    mode = m;
    $('title').textContent = m === 'loc' ? 'Where are you now?' : 'Where to?';
    $('q').placeholder = m === 'loc' ? 'Address, place, or lat, lon' : 'Place or address (searches near you first)';
    $('bLoc').textContent = m === 'loc' ? 'Back to destination' : 'Set my location';
  }
  function openSearch(m) {
    setMode(m || (S.pos ? 'dest' : 'loc'));
    search.classList.add('open'); $('q').value = ''; $('results').innerHTML = '';
    $('msg').textContent = mode === 'loc' ? (S.geoErr ? S.geoErr + ' — tell me where you are instead.' : 'GPS not ready? Type where you are.') : (S.pos ? '' : 'No location yet — tap “Set my location”.');
    setTimeout(() => $('q').focus(), 50);
  }
  function closeSearch() { search.classList.remove('open'); $('q').blur(); }

  $('bLoc').onclick = () => { setMode(mode === 'loc' ? 'dest' : 'loc'); $('results').innerHTML = ''; $('q').focus(); };
  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('q').value.trim(); if (!q) return;
    $('results').innerHTML = '';
    const ll = parseLatLon(q);
    if (ll) { // raw coordinates: "37.7749, -122.4194"
      if (mode === 'loc') { setManualLocation(ll.lat, ll.lon); closeSearch(); return; }
      return pick({ name: `${ll.lat}, ${ll.lon}`, lat: ll.lat, lon: ll.lon });
    }
    $('msg').textContent = mode === 'dest' && S.pos ? 'Searching near you…' : 'Searching…';
    try {
      const rs = await geocode(q);
      $('msg').textContent = rs.length ? (S.pos ? 'Nearest first' : '') : 'No matches — try adding the city.';
      for (const r of rs) {
        const b = document.createElement('button'); b.type = 'button';
        const [first, ...rest] = r.name.split(',');
        const d = r.dist == null ? '' : N.formatDist(r.dist, UNITS);
        b.textContent = first.trim() + (d ? ` · ${d.v} ${d.u}` : '');
        const sub = document.createElement('small'); sub.textContent = rest.slice(0, 3).join(',').trim(); b.appendChild(sub);
        b.onclick = () => pick(r);
        $('results').appendChild(b);
      }
      const first = $('results').firstChild; if (first) first.focus();
    } catch (err) { $('msg').textContent = 'Search failed — check your connection.'; }
  });
  async function pick(r) {
    if (mode === 'loc') { setManualLocation(r.lat, r.lon, r.name.split(',')[0]); closeSearch(); return; }
    if (!S.pos) { // remember the destination; route as soon as we know where you are
      S.pendingDest = r; setMode('loc'); $('results').innerHTML = '';
      $('msg').textContent = `Going to ${r.name.split(',')[0]}. Now tell me where you are (or wait for GPS).`; $('q').value = ''; $('q').focus(); return;
    }
    $('msg').textContent = 'Routing…';
    if (await routeTo(r)) { closeSearch(); if (S.view === 'turn') S.view = 'chase'; } else $('msg').textContent = 'No walking route found.';
  }
  $('bClose').onclick = closeSearch;
  $('bView').onclick = () => { cycleView(); showToolbar(); };
  $('bIn').onclick = () => { zoom(-1); showToolbar(); };
  $('bOut').onclick = () => { zoom(1); showToolbar(); };
  $('bSearch').onclick = () => openSearch();
  $('bGround').onclick = () => { S.ground = !S.ground; showToolbar(); };
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
  if (DEMO) startDemo();
  else {
    loadHint();
    startGeolocation();
    const pl = parseFloat(params.get('lat')), pn = parseFloat(params.get('lon'));
    if (!isNaN(pl) && !isNaN(pn)) setManualLocation(pl, pn); // e.g. ?lat=37.7749&lon=-122.4194
  }
  requestAnimationFrame(loop);
  window.__walk = { S, Nav: N, onFix, draw }; // handy for debugging in the console
})();
