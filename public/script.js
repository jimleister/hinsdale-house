document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('stay-inquiry');
const status = document.getElementById('form-status');

if (form) {
  const arrival = form.elements.arrival;
  const departure = form.elements.departure;
  const today = new Date().toISOString().split('T')[0];
  arrival.min = today;
  departure.min = today;
  arrival.addEventListener('change', () => {
    departure.min = arrival.value || today;
    if (departure.value && departure.value < departure.min) departure.value = '';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    status.className = 'form-status';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/inquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to send inquiry.');
      status.textContent = 'Thanks — your inquiry has been sent to Hinsdale House. We’ll be in touch soon.';
      status.className = 'form-status success';
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'We couldn’t send your inquiry. Please try again or use Furnished Finder.';
      status.className = 'form-status error';
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
