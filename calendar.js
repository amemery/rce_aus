document.addEventListener('DOMContentLoaded', async () => {
  const resp = await fetch('data/events.json');
  const events = await resp.json();

  const fcEvents = events.map(ev => ({
    title: ev.title,
    start: ev.date,
    url: ev.url,
    extendedProps: { registered: ev.registered }
  }));

  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: fcEvents,
    eventClick: info => {
      // open RCE page in new tab
      window.open(info.event.url, '_blank');
      info.jsEvent.preventDefault();
    },
    eventDidMount: info => {
      const reg = info.event.extendedProps.registered ? "✅" : "❌";
      const el = info.el;
      el.insertAdjacentHTML('beforeend', `<span class="reg-status">${reg}</span>`);
    }
  });
  calendar.render();
});