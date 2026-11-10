// Pure navigation maths: no DOM, so it runs in the browser and under node (test.js).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Nav = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;

  function haversine(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // Local flat-earth projection: x east, y north, metres from origin.
  function makeProjector(origin) {
    const kx = Math.cos(rad(origin.lat)) * 111320, ky = 110540;
    return {
      origin,
      toXY: (lat, lon) => ({ x: (lon - origin.lon) * kx, y: (lat - origin.lat) * ky }),
      toLL: (x, y) => ({ lat: origin.lat + y / ky, lon: origin.lon + x / kx }),
    };
  }

  // Compass bearing (deg clockwise from north) of vector dx,dy.
  const bearing = (dx, dy) => ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  const angleDiff = (a, b) => ((b - a + 540) % 360) - 180; // shortest signed a->b

  // Rotate world offset so `heading` points up. Returns {x: right, y: forward}.
  function toForward(dx, dy, heading) {
    const t = rad(heading), c = Math.cos(t), s = Math.sin(t);
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }

  // Cumulative distance along an XY polyline.
  function cumulative(pts) {
    const out = [0];
    for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return out;
  }

  // Snap point p to polyline; returns {along, dist, seg, t, x, y}. `from` limits the search
  // window start (segment index) so a route that doubles back can't snap to its later half.
  function snap(pts, cum, p, from = 0, window = 40) {
    let best = null;
    const end = Math.min(pts.length - 1, from + window);
    for (let i = Math.max(0, from); i < end; i++) {
      const a = pts[i], b = pts[i + 1];
      const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy;
      let t = l2 ? ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      const x = a.x + vx * t, y = a.y + vy * t, d = Math.hypot(p.x - x, p.y - y);
      if (!best || d < best.dist) best = { seg: i, t, x, y, dist: d, along: cum[i] + Math.sqrt(l2) * t };
    }
    return best;
  }

  // ---- OSRM route -> internal route -------------------------------------------------------
  function buildRoute(osrmRoute, proj) {
    const ll = osrmRoute.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }));
    const pts = ll.map((p) => proj.toXY(p.lat, p.lon));
    const cum = cumulative(pts);
    const scale = osrmRoute.distance && cum[cum.length - 1] ? osrmRoute.distance / cum[cum.length - 1] : 1;
    const steps = [];
    let acc = 0;
    for (const leg of osrmRoute.legs) {
      for (const s of leg.steps) {
        acc += s.distance;
        steps.push({
          type: s.maneuver.type,
          modifier: s.maneuver.modifier || '',
          name: s.name || '',
          distance: s.distance,
          end: acc / scale, // along-distance (in our measured metres) where this step ends
          at: proj.toXY(s.maneuver.location[1], s.maneuver.location[0]),
        });
      }
    }
    return { ll, pts, cum, total: cum[cum.length - 1], steps, duration: osrmRoute.duration, distance: osrmRoute.distance };
  }

  // The maneuver you're approaching: steps[i].end is where step i finishes, and step i+1's
  // maneuver is what you do there.
  function progress(route, along) {
    let i = 0;
    while (i < route.steps.length - 1 && route.steps[i].end <= along + 0.5) i++;
    const cur = route.steps[i];
    const next = route.steps[i + 1] || null;
    const toManeuver = Math.max(0, cur.end - along);
    return { index: i, cur, next, toManeuver, remaining: Math.max(0, route.total - along), arrived: !next && toManeuver < 15 };
  }

  const MOD_ANGLE = { straight: 0, 'slight right': 35, right: 90, 'sharp right': 140, uturn: 180, 'sharp left': -140, left: -90, 'slight left': -35 };

  // Arrow rotation in degrees (0 = straight ahead, + = clockwise/right).
  function arrowAngle(step) {
    if (!step) return 0;
    if (step.type === 'arrive') return 0;
    return MOD_ANGLE[step.modifier] ?? 0;
  }

  function instruction(step) {
    if (!step) return 'Continue';
    const t = step.type, m = step.modifier, name = step.name;
    const on = name ? ` onto ${name}` : '';
    if (t === 'arrive') return 'Arrive at destination';
    if (t === 'depart') return name ? `Head out on ${name}` : 'Start walking';
    if (m === 'uturn') return 'Make a U-turn';
    if (t === 'roundabout' || t === 'rotary') return `Take the roundabout${on}`;
    if (t === 'continue' || m === 'straight' || t === 'new name') return name ? `Continue on ${name}` : 'Continue straight';
    if (m) return `Turn ${m}${on}`;
    return name ? `Continue on ${name}` : 'Continue';
  }

  function formatDist(m, units) {
    if (units === 'metric') {
      if (m < 1000) return { v: String(Math.max(0, Math.round(m / 10) * 10)), u: 'm' };
      return { v: (m / 1000).toFixed(m < 10000 ? 1 : 0), u: 'km' };
    }
    const ft = m * 3.28084;
    if (ft < 530) return { v: String(Math.max(0, Math.round(ft / 10) * 10)), u: 'ft' };
    const mi = m / 1609.344;
    return { v: mi.toFixed(mi < 10 ? 1 : 0), u: 'mi' };
  }

  function formatEta(seconds) {
    const m = Math.max(1, Math.round(seconds / 60));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
  }

  // Clip a segment (in camera space, y = forward) to the near plane. Returns null or [a,b].
  function clipNear(a, b, near) {
    const ina = a.y >= near, inb = b.y >= near;
    if (ina && inb) return [a, b];
    if (!ina && !inb) return null;
    const t = (near - a.y) / (b.y - a.y);
    const m = { x: a.x + (b.x - a.x) * t, y: near };
    return ina ? [a, m] : [m, b];
  }

  return { haversine, makeProjector, bearing, angleDiff, toForward, cumulative, snap, buildRoute, progress, arrowAngle, instruction, formatDist, formatEta, clipNear };
});
