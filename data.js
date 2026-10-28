/*  data.js – shared data layer for calendar.js and list.js.
 *
 *  data/events.json      written daily by the scraper (GitHub Action)
 *  data/registered.json  array of event URLs you've registered for –
 *                        edit by hand on GitHub
 */

const RCE = (() => {
  async function fetchJson(path, fallback) {
    const resp = await fetch(path, { cache: "no-cache" });
    if (resp.status === 404 && fallback !== undefined) return fallback;
    if (!resp.ok) throw new Error(`Couldn't load ${path} (HTTP ${resp.status}). Try reloading the page.`);
    return resp.json();
  }

  let loading = null;
  let registered = new Set();

  function load() {
    loading ??= (async () => {
      const [events, urls] = await Promise.all([
        fetchJson("data/events.json"),
        fetchJson("data/registered.json", []),
      ]);
      registered = new Set(urls);
      return { events };
    })();
    return loading;
  }

  const isRegistered = url => registered.has(url);

  // "2026-11-28" -> local Date at midnight (no timezone shift), or null.
  function parseDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // "Northgate, QLD, Australia" -> { place: "Northgate", state: "QLD" }
  function splitLocation(location = "") {
    const parts = location.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) return { place: parts.slice(0, -2).join(", "), state: parts.at(-2) };
    return { place: parts[0] || "", state: "" };
  }

  return { load, isRegistered, parseDate, splitLocation };
})();
