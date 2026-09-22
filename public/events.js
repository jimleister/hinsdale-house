const eventsRoot = document.querySelector('[data-events-root]');

if (eventsRoot) {
  const list = eventsRoot.querySelector('[data-events-list]');
  const filters = [...eventsRoot.querySelectorAll('[data-events-filter]')];
  const limit = Number(eventsRoot.dataset.limit || 0);
  let events = [];

  const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const safeUrl = value => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; }
    catch { return '#'; }
  };

  function render(filter = 'all') {
    const selected = events.filter(event => filter === 'all' || event.area === filter || event.category === filter);
    const visible = limit ? selected.slice(0, limit) : selected;
    if (!visible.length) {
      list.innerHTML = '<p class="events-empty">No matching events are listed right now. Please check again soon.</p>';
      return;
    }
    list.innerHTML = visible.map(event => {
      const start = new Date(event.start);
      const area = event.area === 'nearby' ? 'Haymount & Downtown' : 'Worth the short drive';
      return `<article class="event-card">
        <div class="event-date"><strong>${dateFormat.format(start)}</strong><span>${timeFormat.format(start)}</span></div>
        <div><div class="event-tags"><span>${escapeHtml(area)}</span><span>${escapeHtml(event.category)}</span>${event.free === true ? '<span>Free</span>' : ''}</div>
        <h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.venue)}</p>${event.accessNote ? `<p class="event-access">${escapeHtml(event.accessNote)}</p>` : ''}<a href="${safeUrl(event.url)}" rel="noopener">Official details →</a></div>
      </article>`;
    }).join('');
  }

  fetch('/data/events.json').then(response => response.ok ? response.json() : Promise.reject()).then(data => {
    events = data.events || [];
    render();
  }).catch(() => { list.innerHTML = '<p class="events-empty">Upcoming events are temporarily unavailable.</p>'; });

  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    render(button.dataset.eventsFilter);
  }));
}
