// Preserve calendar dates instead of interpreting them as midnight UTC.
export function normalizeEventDate(value, sourceKey) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  // Simpleview's date-only feed has also emitted midnight-Z placeholders.
  if (sourceKey === 'distinctly' && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

export function applyEventOverrides(events, overrides) {
  const replaced = new Set(overrides.map(event => event.replacesId).filter(Boolean));
  return [...events.filter(event => !replaced.has(event.id)), ...overrides];
}

export function eventIsUpcoming(event, now, horizon) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(event.start);
  const start = new Date(dateOnly ? `${event.start}T00:00:00` : event.start);
  // Include every day of an exhibit/fair, and expire after its published end.
  const last = event.end || event.start;
  const end = new Date(/^\d{4}-\d{2}-\d{2}$/.test(last) ? `${last}T23:59:59` : last);
  if (!event.end) end.setHours(23, 59, 59, 999);
  return !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && end >= now && start <= horizon;
}
