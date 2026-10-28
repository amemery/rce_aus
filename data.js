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
    if (!resp.ok) throw new Error(`Failed to load ${path} (${resp.status})`);
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

  // "2026-11-28" -> local date, no timezone shift.
  function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-AU", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  }

  return { load, isRegistered, formatDate };
})();
