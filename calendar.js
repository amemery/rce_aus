/*  calendar.js – month view of events (FullCalendar v6). */

document.addEventListener("DOMContentLoaded", async () => {
  const calendarEl = document.getElementById("calendar");
  if (typeof FullCalendar === "undefined") {
    console.error("FullCalendar failed to load");
    calendarEl.hidden = true;
    return;
  }

  let data;
  try {
    data = await RCE.load();
  } catch (e) {
    console.error(e);   // list.js shows the message
    return;
  }

  const fcEvents = data.events.map(ev => ({
    id: ev.url,
    title: ev.title,
    start: ev.date,
    allDay: true,
    url: ev.url,
    classNames: RCE.isRegistered(ev.url) ? ["is-registered"] : [],
  }));

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    firstDay: 1,
    events: fcEvents,
    eventClick: info => {
      info.jsEvent.preventDefault();
      window.open(info.event.url, "_blank", "noopener");
    },
  });
  calendar.render();
});
