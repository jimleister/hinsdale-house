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
      const data = new FormData(form);
      data.append('_subject', 'New Hinsdale House stay inquiry');
      data.append('_template', 'table');
      data.append('_captcha', 'false');

      const response = await fetch('https://formsubmit.co/ajax/122.hinsdale@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Unable to send inquiry.');
      }

      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          lead_source: 'website_inquiry',
          suite_preference: data.get('suite') || 'No preference',
          stay_type: data.get('stay_type') || 'Not specified'
        });
      }

      status.textContent = 'Thanks — your inquiry has been sent to Hinsdale House. We’ll be in touch soon.';
      status.className = 'form-status success';
      form.reset();
    } catch (error) {
      status.textContent = 'We couldn’t send your inquiry. Please try again or use Furnished Finder.';
      status.className = 'form-status error';
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
