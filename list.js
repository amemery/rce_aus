/*  list.js – "next up" panel plus the event list grouped by month. */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl   = document.getElementById("event-list");
  const nextEl   = document.getElementById("next-up");
  const statusEl = document.getElementById("status");

  let data;
  try {
    data = await RCE.load();
  } catch (e) {
    console.error(e);
    statusEl.textContent = e.message;
    statusEl.hidden = false;
    return;
  }

  const el = (tag, props = {}, ...children) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...children.filter(c => c !== null && c !== undefined && c !== ""));
    return n;
  };
  const fmt = (d, opts) => d.toLocaleDateString("en-AU", opts);
  const link = (href, className, text) =>
    el("a", { href, className, target: "_blank", rel: "noopener" }, text);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const events = data.events
    .map(ev => ({ ...ev, when: RCE.parseDate(ev.date), ...RCE.splitLocation(ev.location) }))
    .filter(ev => !ev.when || ev.when >= today);

  if (!events.length) {
    listEl.append(el("p", { className: "empty" },
      "No Australian events are listed right now. New events show up here the day after they're added to Robot Combat Events."));
    return;
  }

  // ---- Next up -----------------------------------------------------------
  const next = events.find(ev => ev.when);
  if (next) {
    const days = Math.round((next.when - today) / 86400000);
    const countdown = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
    const registered = RCE.isRegistered(next.url);

    nextEl.append(
      el("time", { className: "next-date", dateTime: next.date },
        el("span", { className: "next-day" }, String(next.when.getDate())),
        el("span", { className: "next-month" }, fmt(next.when, { month: "short" }))),
      el("div", { className: "next-body" },
        el("p", { className: "next-countdown" }, countdown),
        el("h2", { className: "next-title" }, link(next.url, "", next.title)),
        el("p", { className: "next-where" },
          fmt(next.when, { weekday: "long" }), " in ", next.place,
          next.state ? el("span", { className: "state" }, next.state) : null),
        registered
          ? el("p", { className: "registered" }, "You're registered")
          : link(next.url, "button", "Register on RCE")));
    nextEl.hidden = false;
  }

  // ---- List grouped by month ---------------------------------------------
  const groups = new Map();
  for (const ev of events) {
    const key = ev.when ? fmt(ev.when, { month: "long", year: "numeric" }) : "Date to be confirmed";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ev);
  }

  for (const [month, items] of groups) {
    const ol = el("ol", { className: "event-rows" });
    for (const ev of items) {
      const registered = RCE.isRegistered(ev.url);
      ol.append(el("li", { className: "event" + (registered ? " is-registered" : "") },
        ev.when
          ? el("time", { className: "event-date", dateTime: ev.date },
              el("span", { className: "event-day" }, String(ev.when.getDate())),
              el("span", { className: "event-weekday" }, fmt(ev.when, { weekday: "short" })))
          : el("span", { className: "event-date" }, el("span", { className: "event-day" }, "?")),
        el("div", { className: "event-body" },
          link(ev.url, "event-title", ev.title),
          el("p", { className: "event-where" }, ev.place,
            ev.state ? el("span", { className: "state" }, ev.state) : null)),
        registered
          ? el("span", { className: "registered" }, "Registered")
          : link(ev.url, "event-action", "Register")));
    }
    listEl.append(el("section", { className: "month" }, el("h3", {}, month), ol));
  }
});
