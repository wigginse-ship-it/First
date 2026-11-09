(function () {
  'use strict';
  const N = window.Nav;
  const params = new URLSearchParams(location.search);
  const DEMO = params.has('demo');
  const UNITS = params.get('units') || (/^en-(US|LR|MM)/i.test(navigator.language || '') ? 'imperial' : 'metric');

  const $ = (id) => document.getElementById(id);
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
    zoom: 1,
    ways: [], waysCenter: null, waysBusy: false,
    route: null, dest: null, snapSeg: 0, snap: null, prog: null, offCount: 0, spoken: -1,
    muted: false, toast: '', toastUntil: 0, sim: null, lastFix: 0,
  };
  let W = 600, H = 600, K = 1, DPR = 1;

  // ---------------------------------------------------------------- helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  const PATHS = new Set(['footway', 'path', 'pedestrian', 'steps', 'cycleway', 'track', 'bridleway', 'corridor']);
  async function maybeFetchWays() {
    if (DEMO || S.waysBusy || !S.pos) return;
    if (S.waysCenter && Math.hypot(S.pos.x - S.waysCenter.x, S.pos.y - S.waysCenter.y) < 150) return;
    S.waysBusy = true;
    const c = { x: S.pos.x, y: S.pos.y };
    try {
      const q = `[out:json][timeout:20];way(around:500,${S.pos.lat.toFixed(5)},${S.pos.lon.toFixed(5)})[highway][highway!~"^(motorway|motorway_link|proposed|construction|raceway)$"];out geom;`;
      const j = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) }, 25000);
      S.ways = j.elements.filter((e) => e.geometry && e.geometry.length > 1).map((e) => {
        const w = { ll: e.geometry.map((g) => ({ lat: g.lat, lon: g.lon })), path: PATHS.has(e.tags.highway) };
        projectWay(w); return w;
      });
      S.waysCenter = c;
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
    S.dest = dest; S.snapSeg = 0; S.offCount = 0; S.spoken = -1; S.snap = null; S.prog = null;
    updateProgress();
  }
  function endRoute() { S.route = null; S.dest = null; S.prog = null; S.snap = null; if (S.sim) S.sim = null; toast('Route ended'); }

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
      speak(`In ${d.v} ${({ ft: 'feet', mi: 'miles', m: 'metres', km: 'kilometres' })[d.u]}, ${N.instruction(p.next)}`);
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
    const ways = [];
    const names = ['Market St', 'Mission St', 'Howard St', 'Folsom St', 'Harrison St'];
    for (let i = -6; i <= 6; i++) {
      for (const horiz of [true, false]) {
        const pts = [];
        for (let j = -8; j <= 8; j++) pts.push(horiz ? S.proj.toLL(j * 60, i * 90) : S.proj.toLL(i * 90, j * 60));
        ways.push({ ll: pts, path: Math.abs(i) % 3 === 2 });
      }
    }
    // a diagonal path and a park loop for variety
    ways.push({ ll: [S.proj.toLL(-300, -300), S.proj.toLL(-100, -60), S.proj.toLL(100, 120), S.proj.toLL(330, 300)], path: true });
    ways.forEach(projectWay);
    S.ways = ways; S.waysCenter = { x: 0, y: 0 };
    const wp = [[0, 0], [0, 270], [360, 270], [360, 450], [540, 450]];
    const ll = wp.map(([x, y]) => S.proj.toLL(x, y));
    const mk = (type, modifier, name, d, p) => ({ maneuver: { type, modifier, location: [ll[p].lon, ll[p].lat] }, name, distance: d });
    const osrm = {
      distance: 270 + 360 + 180 + 180, duration: 990 / 1.3,
      geometry: { coordinates: ll.map((p) => [p.lon, p.lat]) },
      legs: [{ steps: [mk('depart', '', 'Mission St', 270, 0), mk('turn', 'right', 'Howard St', 360, 1), mk('turn', 'left', 'Folsom St', 180, 2), mk('turn', 'right', 'Harrison St', 180, 3), mk('arrive', '', '', 0, 4)] }],
    };
    onFix(o.lat, o.lon, 5, 0, 0);
    setRoute(osrm, { name: 'Demo destination', lat: ll[4].lat, lon: ll[4].lon });
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
  // Each camera turns world metres into screen pixels. `line(points)` returns visible path segments.
  function makeCamera() {
    const u = S.pos || { x: 0, y: 0 };
    const mode = S.view;
    if (mode === 'overview' && S.route) {
      const xs = S.route.pts.map((p) => p.x), ys = S.route.pts.map((p) => p.y);
      const minx = Math.min(...xs, u.x), maxx = Math.max(...xs, u.x), miny = Math.min(...ys, u.y), maxy = Math.max(...ys, u.y);
      const span = Math.max(maxx - minx, maxy - miny, 80) * 1.25;
      return { mode, kind: 'flat', cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, heading: 0, scale: Math.min(W, H) / span, ax: W / 2, ay: H / 2 };
    }
    if (mode === 'overhead' || mode === 'overview' || mode === 'turn') {
      const span = OVERHEAD_SPANS[S.zoom] || 250;
      return { mode, kind: 'flat', cx: u.x, cy: u.y, heading: S.heading, scale: Math.min(W, H) / span, ax: W / 2, ay: H * 0.64 };
    }
    // chase: low camera behind you looking ahead, Tesla-style
    const F = H * 0.38 * [1.5, 1, 0.7, 0.5][S.zoom];
    return { mode, kind: 'persp', cx: u.x, cy: u.y, heading: S.heading, back: 14, height: 20, F, horizon: H * 0.2, ax: W / 2, far: 300 / [1.5, 1, 0.7, 0.5][S.zoom] * 1.0 };
  }
  function camSegments(cam, pts) {
    // returns array of polylines in screen space
    const out = []; let cur = null;
    const fwd = (p) => N.toForward(p.x - cam.cx, p.y - cam.cy, cam.heading);
    if (cam.kind === 'flat') {
      const pr = (f) => ({ x: cam.ax + f.x * cam.scale, y: cam.ay - f.y * cam.scale });
      const o = []; for (const p of pts) o.push(pr(fwd(p))); return [o];
    }
    const near = 1.5;
    const pr = (p) => ({ x: cam.ax + (cam.F * p.x) / p.y, y: cam.horizon + (cam.F * cam.height) / p.y, d: p.y });
    let prev = null;
    for (const p of pts) {
      const f = fwd(p), c = { x: f.x, y: f.y + cam.back };
      if (prev) {
        const clip = N.clipNear(prev, c, near);
        if (clip) {
          if (!cur) { cur = [pr(clip[0])]; out.push(cur); }
          cur.push(pr(clip[1]));
          if (clip[1] !== c) cur = null; // far end was clipped: start a new polyline next time
        } else cur = null;
      }
      prev = c;
    }
    return out;
  }
  function strokeLine(cam, s, meters) {
    if (cam.kind === 'flat') {
      ctx.lineWidth = lineW(cam, meters); ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y); ctx.stroke(); return;
    }
    const base = ctx.globalAlpha;
    for (let i = 1; i < s.length; i++) { // width and fade follow depth, segment by segment
      const d = (s[i - 1].d + s[i].d) / 2;
      ctx.lineWidth = lineW(cam, meters, d);
      ctx.globalAlpha = base * clamp(1.15 - d / (cam.far * 1.05), 0.12, 1);
      ctx.beginPath(); ctx.moveTo(s[i - 1].x, s[i - 1].y); ctx.lineTo(s[i].x, s[i].y); ctx.stroke();
    }
    ctx.globalAlpha = base;
  }
  function lineW(cam, meters, d) {
    if (cam.kind === 'flat') return clamp(meters * cam.scale, 1.2 * K, 40 * K);
    return clamp((cam.F * meters) / Math.max(d || 30, 3), 1 * K, 16 * K);
  }

  // ---------------------------------------------------------------- drawing
  function drawWorld(cam) {
    const range = cam.kind === 'persp' ? cam.far + 60 : (Math.max(W, H) / cam.scale) * 0.9;
    const cx = cam.cx, cy = cam.cy;
    const visible = S.ways.filter((w) => Math.hypot(w.c.x - cx, w.c.y - cy) - w.r < range);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const pass of [false, true]) { // roads first, then footpaths on top
      ctx.strokeStyle = pass ? '#5fae8f' : '#6f8b97';
      for (const w of visible) {
        if (w.path !== pass) continue;
        const segs = camSegments(cam, w.xy);
        for (const s of segs) {
          if (s.length < 2) continue;
          ctx.globalAlpha = 0.9;
          strokeLine(cam, s, pass ? 1.2 : 3.2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawRoute(cam) {
    if (!S.route) return;
    // remaining part of the route, starting at the snapped point
    const r = S.route, sn = S.snap;
    const pts = sn ? [{ x: sn.x, y: sn.y }, ...r.pts.slice(sn.seg + 1)] : r.pts;
    const segs = camSegments(cam, pts);
    for (const [wm, col, a] of [[8, '#19e0ff', 0.28], [4.2, '#19e0ff', 1]]) {
      for (const s of segs) {
        if (s.length < 2) continue;
        ctx.globalAlpha = a; ctx.strokeStyle = col;
        strokeLine(cam, s, wm);
      }
    }
    ctx.globalAlpha = 1;
    // destination ring
    const dpt = r.pts[r.pts.length - 1];
    const sl = camSegments(cam, [dpt, { x: dpt.x + 0.01, y: dpt.y }])[0];
    const sd = sl && sl[0];
    if (sd) {
      const rr = cam.kind === 'flat' ? 9 * K : clamp((cam.F * 6) / Math.max(sd.d, 3), 5 * K, 40 * K);
      ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 4 * K;
      ctx.beginPath(); ctx.arc(sd.x, sd.y, rr, 0, 7); ctx.stroke();
      if (cam.kind === 'persp') { ctx.beginPath(); ctx.moveTo(sd.x, sd.y); ctx.lineTo(sd.x, sd.y - rr * 3); ctx.stroke(); }
    }
  }
  function drawUser(cam) {
    let x, y, rot = 0;
    if (cam.kind === 'persp') { x = cam.ax; y = cam.horizon + (cam.F * cam.height) / cam.back; }
    else if (cam.mode === 'overview' && S.pos) {
      const f = N.toForward(S.pos.x - cam.cx, S.pos.y - cam.cy, 0); x = cam.ax + f.x * cam.scale; y = cam.ay - f.y * cam.scale; rot = S.heading;
    } else { x = cam.ax; y = cam.ay; }
    const s = 15 * K;
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
    text(N.instruction(step), pad + 108 * K, pad / 2 + 94 * K, 22 * K, '#f2fbff', 'left', W - pad * 2 - 108 * K);
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
    text(N.instruction(step), W / 2, H * 0.81, 30 * K, '#f2fbff', 'center', W - 40 * K);
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
      drawWorld(cam); drawRoute(cam); drawUser(cam);
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
