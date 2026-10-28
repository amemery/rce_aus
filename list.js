/*  list.js – renders the event list, linking each event to its RCE page. */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl   = document.getElementById("event-list");
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

  const el = (tag, props = {}, text) => {
    const n = Object.assign(document.createElement(tag), props);
    if (text !== undefined) n.textContent = text;
    return n;
  };

  if (!data.events.length) {
    listEl.append(el("li", { className: "empty" }, "No upcoming Australian events."));
    return;
  }

  for (const ev of data.events) {
    const registered = RCE.isRegistered(ev.url);
    const li = el("li", { className: registered ? "is-registered" : "" });
    li.append(
      el("a", { href: ev.url, target: "_blank", rel: "noopener", className: "title" }, ev.title),
      el("span", { className: "date" }, RCE.formatDate(ev.date)),
      el("span", { className: "loc" }, ev.location || ""),
      registered
        ? el("span", { className: "reg-status" }, "Registered ✅")
        : el("a", { href: ev.url, target: "_blank", rel: "noopener", className: "reg-btn" }, "Register on RCE ↗"),
    );
    listEl.append(li);
  }
});
