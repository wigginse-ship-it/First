// Fetches Chris Tomer's most recent forecast post and writes data/latest.json.
// Run daily by .github/workflows/snow-daily.yml (Node 20+, no dependencies).
import { writeFile, mkdir } from "node:fs/promises";

const API = "https://unofficialnetworks.com/wp-json/wp/v2/posts?search=chris%20tomer&per_page=5&_fields=title,date,link,content";
const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

try {
  const res = await fetch(API, { headers: { "User-Agent": "snow-brief/1.0" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const posts = (await res.json()).sort((a, b) => b.date.localeCompare(a.date));
  const p = posts[0];
  if (!p) throw new Error("no posts found");
  await mkdir("data", { recursive: true });
  await writeFile("data/latest.json", JSON.stringify({
    title: strip(p.title.rendered), date: p.date, link: p.link,
    text: strip(p.content.rendered), fetchedAt: new Date().toISOString(),
  }));
  console.log("Saved:", strip(p.title.rendered), p.date);
} catch (e) {
  console.error("Fetch failed, keeping app fallback:", e.message);
}
