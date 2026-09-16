const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
const suiteParam = params.get('suite');
const attributionKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const attribution = {};
attributionKeys.forEach(key => {
  const value = params.get(key);
  if (value) sessionStorage.setItem(`hh_${key}`, value);
  attribution[key] = value || sessionStorage.getItem(`hh_${key}`) || '';
});

const form = document.getElementById('stay-inquiry');
const status = document.getElementById('form-status');

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`);
  return Math.max(0, Math.round(ms / 86400000));
}

if (form) {
  const arrival = form.elements.arrival;
  const departure = form.elements.departure;
  const suiteSelect = form.elements.suite;
  const summary = document.getElementById('stay-summary');
  const today = new Date().toISOString().split('T')[0];
  arrival.min = today;
  departure.min = today;

  if (suiteParam && suiteSelect) {
    const matchingOption = [...suiteSelect.options].find(option => option.value === suiteParam || option.text === suiteParam);
    if (matchingOption) suiteSelect.value = matchingOption.value;
  }

  function updateSummary() {
    const nights = nightsBetween(arrival.value, departure.value);
    if (summary) summary.textContent = nights ? `${nights}-night stay · ${suiteSelect.value}` : '';
  }

  arrival.addEventListener('change', () => {
    departure.min = arrival.value || today;
    if (departure.value && departure.value < departure.min) departure.value = '';
    updateSummary();
  });
  departure.addEventListener('change', updateSummary);
  suiteSelect?.addEventListener('change', updateSummary);

  let formStarted = false;
  form.addEventListener('input', () => {
    if (!formStarted && typeof gtag === 'function') {
      formStarted = true;
      gtag('event', 'form_start', { form_name: 'stay_inquiry' });
    }
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
      const stayLength = nightsBetween(data.get('arrival'), data.get('departure'));
      data.append('stay_length_nights', String(stayLength));
      attributionKeys.forEach(key => { if (attribution[key]) data.append(key, attribution[key]); });
      data.append('landing_page', sessionStorage.getItem('hh_landing_page') || window.location.pathname);
      data.append('_subject', 'New Hinsdale House stay inquiry');
      data.append('_template', 'table');
      data.append('_captcha', 'false');

      const response = await fetch('https://formsubmit.co/ajax/d8b2ae1a9ce7b3e2efe6cecbf9736a19', {
        method: 'POST', headers: { 'Accept': 'application/json' }, body: data
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Unable to send inquiry.');

      if (typeof gtag === 'function') gtag('event', 'generate_lead', {
        lead_source: attribution.utm_source || 'website_direct',
        suite_preference: data.get('suite') || 'No preference',
        stay_type: data.get('stay_type') || 'Not specified',
        stay_length_nights: stayLength
      });

      status.textContent = 'Thanks — your inquiry has been sent to Hinsdale House. We’ll be in touch soon.';
      status.className = 'form-status success';
      form.reset();
      if (summary) summary.textContent = '';
    } catch (error) {
      status.textContent = 'We couldn’t send your inquiry. Please try again or use Furnished Finder.';
      status.className = 'form-status error';
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

if (!sessionStorage.getItem('hh_landing_page')) sessionStorage.setItem('hh_landing_page', window.location.pathname);

document.querySelectorAll('[data-suite-interest]').forEach(link => link.addEventListener('click', () => {
  if (typeof gtag === 'function') gtag('event', 'suite_interest', { suite_name: link.dataset.suiteInterest, link_text: link.textContent.trim() });
}));
document.querySelectorAll('[data-track]').forEach(link => link.addEventListener('click', () => {
  if (typeof gtag === 'function') gtag('event', link.dataset.track, { link_url: link.href, link_text: link.textContent.trim() });
}));
