/*  list.js – renders the event list. In admin mode (?admin) each event gets a
 *  toggle that records whether you've registered; see data.js.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl   = document.getElementById("event-list");
  const statusEl = document.getElementById("status");
  const showError = msg => { statusEl.textContent = msg; statusEl.hidden = false; };

  if (RCE.isAdmin) document.getElementById("admin-banner").hidden = false;

  let data;
  try {
    data = await RCE.load();
  } catch (e) {
    console.error(e);
    showError(e.message);
    return;
  }

  const el = (tag, props = {}, text) => {
    const n = Object.assign(document.createElement(tag), props);
    if (text !== undefined) n.textContent = text;
    return n;
  };

  const render = () => {
    listEl.replaceChildren();

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
      );

      if (RCE.isAdmin) {
        const btn = el("button", { className: "reg-btn", type: "button" },
          registered ? "Registered ✅" : "Mark registered");
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "Saving…";
          statusEl.hidden = true;
          try {
            await RCE.setRegistered(ev.url, !registered);   // fires rce:registered-changed → re-render
          } catch (e) {
            console.error(e);
            showError(e.message);
            render();
          }
        });
        li.append(btn);
      } else {
        li.append(registered
          ? el("span", { className: "reg-status" }, "Registered ✅")
          : el("a", { href: ev.url, target: "_blank", rel: "noopener", className: "reg-btn" }, "Register on RCE ↗"));
      }

      listEl.append(li);
    }
  };

  document.addEventListener("rce:registered-changed", render);
  render();
});
