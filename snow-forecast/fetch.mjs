// Fetches Chris Tomer's most recent forecast post (text + map images) into data/.
// Run daily by .github/workflows/snow-daily.yml (Node 20+, no dependencies).
import { writeFile, mkdir } from "node:fs/promises";

const API = "https://unofficialnetworks.com/wp-json/wp/v2/posts?search=chris%20tomer&per_page=10&_fields=title,date,link,content";
const UA = { "User-Agent": "snow-brief/1.0" };
const ENT = { amp: "&", nbsp: " ", quot: '"', lt: "<", gt: ">", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', ndash: "-", mdash: "-", hellip: "..." };
const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
// Keep paragraph/heading breaks as newlines so the app can see section headings.
const toText = h => decode(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
  .replace(/<\/(p|h[1-6]|li|div|figcaption|tr)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
  .replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{2,}/g, "\n").trim();

function images(html) {
  const out = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0], attr = n => (tag.match(new RegExp(`\\b${n}=["']([^"']*)["']`, "i")) || [])[1];
    if (/wp-smiley|avatar|gravatar|logo|emoji/i.test(tag)) continue;
    let src = attr("data-src") || attr("data-lazy-src") || attr("src");
    const set = attr("srcset") || attr("data-srcset");
    if (set) { // largest candidate
      const best = set.split(",").map(x => x.trim().split(/\s+/)).map(([u, w]) => [u, parseInt(w) || 0]).sort((a, b) => b[1] - a[1])[0];
      if (best?.[0]) src = best[0];
    }
    const w = parseInt(attr("width") || "0");
    if (!src || src.startsWith("data:") || (w && w < 300)) continue;
    if (!out.some(o => o.remote === src)) out.push({ remote: src, alt: decode(attr("alt") || "") });
  }
  return out.slice(0, 8);
}

try {
  const res = await fetch(API, { headers: UA });
  if (!res.ok) throw new Error("HTTP " + res.status);
  let posts = await res.json();
  const mine = posts.filter(p => /tomer/i.test(p.title.rendered + p.content.rendered));
  posts = (mine.length ? mine : posts).sort((a, b) => b.date.localeCompare(a.date));
  const p = posts[0];
  if (!p) throw new Error("no posts found");

  await mkdir("data/maps", { recursive: true });
  const maps = [];
  for (const [i, img] of images(p.content.rendered).entries()) {
    try {
      const r = await fetch(img.remote, { headers: UA });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !type.startsWith("image/")) throw new Error(r.status + " " + type);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 4e6) throw new Error("too large");
      const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
      await writeFile(`data/maps/map-${i + 1}.${ext}`, buf);
      maps.push({ src: `data/maps/map-${i + 1}.${ext}`, alt: img.alt });
    } catch (e) { console.error("map skipped:", img.remote, e.message); }
  }
  await writeFile("data/latest.json", JSON.stringify({
    title: toText(p.title.rendered), date: p.date, link: p.link,
    text: toText(p.content.rendered), maps, fetchedAt: new Date().toISOString(),
  }));
  console.log("Saved:", toText(p.title.rendered), p.date, maps.length + " maps");
} catch (e) {
  console.error("Fetch failed, keeping app fallback:", e.message);
}
