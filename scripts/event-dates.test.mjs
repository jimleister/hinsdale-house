import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeEventDate, applyEventOverrides, eventIsUpcoming } from './event-dates.mjs';

const data = JSON.parse(fs.readFileSync('public/data/events.json', 'utf8'));
const overrides = JSON.parse(fs.readFileSync('public/data/events-overrides.json', 'utf8'));
const script = fs.readFileSync('public/events.js', 'utf8');

async function render(events, zone) {
  const list = { innerHTML: '' };
  const root = { dataset: {}, querySelector: () => list, querySelectorAll: () => [] };
  // Emulate a visitor whose default zone differs from Fayetteville.
  const context = { document: { querySelector: () => root }, URL,
    Intl: { DateTimeFormat: function(locale, options) {
      return new Intl.DateTimeFormat(locale, { timeZone: zone, ...options });
    } }, fetch: async () => ({ ok: true, json: async () => ({ events }) }) };
  vm.runInNewContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return list.innerHTML;
}

test('calendar dates retain their date and have no fabricated time', async () => {
  assert.equal(normalizeEventDate('2026-11-07', 'city'), '2026-11-07');
  assert.equal(normalizeEventDate('2026-11-07T00:00:00.000Z', 'distinctly'), '2026-11-07');
  assert.equal(normalizeEventDate('2026-11-07T00:00:00Z', 'crown'), '2026-11-07T00:00:00.000Z');
  for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Kathmandu']) {
    const html = await render([{ title: 'Date only', start: '2026-11-07' }], zone);
    assert.match(html, /Nov 7, 2026/);
    assert.match(html, /See source for hours/);
    assert.doesNotMatch(html, /7:00 PM/);
  }
});

test('verified parade replaces imported date and renders Eastern time everywhere', async () => {
  const parade = overrides.find(e => e.replacesId?.includes('veterans-day-parade'));
  const stale = { id: parade.replacesId, start: '2026-11-07' };
  assert.deepEqual(applyEventOverrides([stale], [parade]), [parade]);
  assert.ok(data.events.filter(e => /Veterans Day Parade/.test(e.title)).length <= 1);
  for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Kathmandu']) {
    const html = await render([parade], zone);
    assert.match(html, /Nov 7, 2026/);
    assert.match(html, /10:00 AM EST/);
  }
});

test('daylight saving time uses the event date', async () => {
  assert.match(await render([{ title: 'Summer', start: '2027-04-20T11:30:00Z' }], 'UTC'), /7:30 AM EDT/);
});

test('multi-day exhibits display a range and remain through their final day', async () => {
  const event = { start: '2026-11-06', end: '2026-12-20' };
  const html = await render([event], 'UTC');
  assert.match(html, /Nov 6, 2026 – Dec 20, 2026/);
  assert.equal(eventIsUpcoming(event, new Date('2026-11-08T12:00:00Z'), new Date('2027-01-01')), true);
  assert.equal(eventIsUpcoming(event, new Date('2026-12-22'), new Date('2027-01-01')), false);
});

test('published snapshot has verified corrections and no Simpleview midnight placeholders', () => {
  assert.equal(overrides.find(e => e.id.includes('grilled-cheese')).start, '2026-11-07T13:00:00-05:00');
  for (const event of data.events) {
    assert.ok(normalizeEventDate(event.start, event.sourceKey));
    if (event.sourceKey === 'distinctly') assert.doesNotMatch(event.start, /T00:00:00/);
  }
});
