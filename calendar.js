/*  calendar.js – month view of events (FullCalendar v6). */

document.addEventListener("DOMContentLoaded", async () => {
  const calendarEl = document.getElementById("calendar");
  if (typeof FullCalendar === "undefined") {
    console.error("FullCalendar failed to load");
    calendarEl.closest("section").hidden = true;
    return;
  }

  let data;
  try {
    data = await RCE.load();
  } catch (e) {
    console.error(e);   // list.js shows the message
    calendarEl.closest("section").hidden = true;
    return;
  }

  const first = data.events.map(ev => RCE.parseDate(ev.date)).find(Boolean);
  const today = new Date();

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    initialDate: first && first > today ? first : today,
    firstDay: 1,
    locale: "en-AU",
    height: "auto",
    fixedWeekCount: false,
    headerToolbar: { left: "title", center: "", right: "today prev,next" },
    buttonText: { today: "Today" },
    events: data.events.map(ev => ({
      id: ev.url,
      title: ev.title,
      start: ev.date,
      allDay: true,
      url: ev.url,
      classNames: RCE.isRegistered(ev.url) ? ["is-registered"] : [],
    })),
    eventClick: info => {
      info.jsEvent.preventDefault();
      window.open(info.event.url, "_blank", "noopener");
    },
  });
  calendar.render();
});
