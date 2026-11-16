// Función de servidor (Vercel): lee los feeds RSS y devuelve JSON unificado en /api/news
// Para añadir un periódico, añade una línea a FEEDS.
const FEEDS = [
  { name: "Marca", url: "https://www.marca.com/rss/googlenews/portada.xml" },
  { name: "AS", url: "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/portada/" },
  { name: "Mundo Deportivo", url: "https://www.mundodeportivo.com/feed/rss/home" },
  { name: "Sport", url: "https://www.sport.es/es/rss/last-news/news.xml" }
];
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function dec(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}
function txt(s) {
  s = String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = dec(s.replace(/<[^>]*>/g, " "));
  return dec(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
function tag(b, n) {
  const m = b.match(new RegExp("<" + n + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + n + ">", "i"));
  return m ? m[1] : "";
}
function guess(s) {
  s = s.toLowerCase();
  if (/baloncesto|\bnba\b|\bacb\b|euroliga|basket/.test(s)) return "Baloncesto";
  if (/tenis|\batp\b|\bwta\b|roland garros|wimbledon/.test(s)) return "Tenis";
  if (/f[oó]rmula 1|\bf1\b|motogp|moto2|rally|motor/.test(s)) return "Motor";
  if (/ciclismo|tour de|vuelta a|giro de/.test(s)) return "Ciclismo";
  if (/f[uú]tbol|laliga|liga|champions|real madrid|bar[cç]a|atl[eé]tico|entrenador|partido/.test(s)) return "Fútbol";
  return "General";
}
function parse(xml, src) {
  const out = [], re = /<(item|entry)[\s>][\s\S]*?<\/\1>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[0];
    let link = txt(tag(b, "link"));
    if (!link) { const h = b.match(/<link[^>]*href=["']([^"']+)["']/i); link = h ? dec(h[1]) : ""; }
    const t = txt(tag(b, "title"));
    if (!t || !/^https?:\/\//i.test(link)) continue;
    let ts = Date.parse(txt(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date")));
    ts = isNaN(ts) ? Date.now() : Math.min(ts, Date.now());
    out.push({ src, t, u: link, n: txt(tag(b, "description") || tag(b, "summary")).slice(0, 240), ts, c: guess(txt(tag(b, "category")) + " " + t) });
  }
  return out;
}
module.exports = async (req, res) => {
  const sources = [], items = [];
  await Promise.all(FEEDS.map(async (f) => {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 8000);
    try {
      const r = await fetch(f.url, { signal: ac.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; KioskoDeportivo/1.0)", Accept: "application/rss+xml, application/xml, text/xml, */*" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const list = parse(await r.text(), f.name).slice(0, 40);
      if (!list.length) throw new Error("Sin noticias legibles");
      items.push(...list);
      sources.push({ name: f.name, ok: true, count: list.length });
    } catch (e) {
      sources.push({ name: f.name, ok: false, error: e.name === "AbortError" ? "Tiempo agotado" : e.message });
    } finally { clearTimeout(to); }
  }));
  items.sort((a, b) => b.ts - a.ts);
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify({ updated: Date.now(), sources, items }));
};
module.exports.parse = parse;
