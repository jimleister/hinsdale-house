import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public', 'data');
const outputPath = path.join(dataDir, 'events.json');
const overridesPath = path.join(dataDir, 'events-overrides.json');

const sources = [
  { key: 'distinctly', name: 'DistiNCtly Fayetteville', url: 'https://www.distinctlyfayettevillenc.com/events/' },
  { key: 'city', name: 'City of Fayetteville', url: 'https://www.fayettevillenc.gov/Events' },
  { key: 'crown', name: 'Crown Complex', url: 'https://www.crowncomplexnc.com/events/all' },
  { key: 'marksmen', name: 'Fayetteville Marksmen', url: 'https://marksmenhockey.com/schedule/calendar/' },
  { key: 'dogwood', name: 'Fayetteville Dogwood Festival', url: 'https://www.thedogwoodfestival.com/2026-2027-events' },
  { key: 'gilbert', name: 'Gilbert Theater', url: 'https://www.gilberttheater.com/our-2026-2027-season/' },
  { key: 'cfrt', name: 'Cape Fear Regional Theatre', url: 'https://www.cfrt.org/' },
  { key: 'arts-council', name: 'Arts Council of Fayetteville/Cumberland County', url: 'https://www.theartscouncil.com/event-calendar' }
  ,{ key: 'fsu-athletics', name: 'Fayetteville State Athletics', url: 'https://fsubroncos.com/sports/football/schedule/2026' }
  ,{ key: 'fsu-planetarium', name: 'Fayetteville State Planetarium', url: 'https://www.uncfsu.edu/about-fsu/community/planetarium' }
  ,{ key: 'methodist-athletics', name: 'Methodist University Athletics', url: 'https://mumonarchs.com/calendar' }
  ,{ key: 'symphony', name: 'Fayetteville Symphony Orchestra', url: 'https://www.fayettevillesymphony.org/calendar/' }
  ,{ key: 'fort-bragg', name: 'Fort Bragg Family and MWR', url: 'https://bragg.armymwr.com/calendar?mode=agenda' }
  ,{ key: 'cameo', name: 'Cameo Collective', url: 'https://ticketmesandhills.com/organizations/cameocollective' }
];

const approvedVenueTerms = [
  'haymount', 'downtown fayetteville', 'festival park', 'segra stadium', '116 green',
  'gilbert theater', 'gilbert theatre', 'cape fear regional theatre', 'arts center',
  '301 hay', 'cameo art house', 'market house', 'crown coliseum', 'crown theatre',
  'crown arena', 'crown expo', '1960 coliseum', '1707 owen', 'fayetteville state',
  'fsu planetarium', 'lyons science', 'methodist university', '5400 ramsey', 'arts xl',
  'fort bragg', 'main post parade field'
];
const visitorTerms = [
  'festival', 'concert', 'parade', 'game', 'hockey', 'baseball', 'theatre', 'theater',
  'musical', 'comedy', 'performance', 'show', 'fair', 'fireworks', 'fourth friday',
  'memorial day', 'holiday', 'family', 'dance', 'art', 'market'
];
const excludedTerms = [
  'city council', 'committee meeting', 'commission meeting', 'community watch',
  'board meeting', 'networking breakfast', 'public hearing', 'routine class'
];

const now = new Date();
const horizon = new Date(now.getTime() + 180 * 86400000);

function walkJson(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) value.forEach(item => walkJson(item, found));
  else {
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some(type => ['Event', 'SportsEvent', 'MusicEvent', 'TheaterEvent', 'Festival'].includes(type))) found.push(value);
    Object.values(value).forEach(item => walkJson(item, found));
  }
  return found;
}

function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const events = [];
  for (const block of blocks) {
    try { walkJson(JSON.parse(block[1].trim()), events); } catch { /* ignore malformed publisher data */ }
  }
  return events;
}

function cleanText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function locationText(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const address = typeof location.address === 'string' ? location.address : Object.values(location.address || {}).join(' ');
  return [location.name, address].filter(Boolean).join(' · ');
}

function categoryFor(text) {
  const haystack = text.toLowerCase();
  if (/hockey|baseball|game|sports/.test(haystack)) return 'Sports';
  if (/theatre|theater|musical|play|performance/.test(haystack)) return 'Theater & Arts';
  if (/concert|comedy|music|orchestra|dance/.test(haystack)) return 'Concerts & Shows';
  if (/family|kids|children|disney/.test(haystack)) return 'Family';
  return 'Festivals';
}

function areaFor(venue) {
  return /crown|1960 coliseum|1707 owen/i.test(venue) ? 'short-drive' : 'nearby';
}

function normalize(raw, source) {
  const venue = cleanText(locationText(raw.location));
  let title = cleanText(raw.name);
  if (source.key === 'fsu-athletics') title = title.replace(/^Fayetteville State University\s+Vs\s+/i, 'Fayetteville State Football vs. ');
  const start = raw.startDate ? new Date(raw.startDate) : null;
  if (!title || !start || Number.isNaN(start.valueOf())) return null;
  const text = `${title} ${venue} ${cleanText(raw.description)}`.toLowerCase();
  if (excludedTerms.some(term => text.includes(term))) return null;
  if (source.key === 'fort-bragg' && !/open to the public|public event|special event/.test(text)) return null;
  if (source.key === 'cameo' && !/special|live|concert|symphony|open mic|reel sips|fright night|festival|karaoke|comedy|premiere|community/.test(text)) return null;
  if (source.key.endsWith('athletics') && !/fayetteville,? nc|fayetteville state|methodist university/i.test(venue)) return null;
  if (!approvedVenueTerms.some(term => text.includes(term)) && !visitorTerms.some(term => text.includes(term))) return null;
  const url = raw.url || raw.sameAs || source.url;
  return {
    id: `${source.key}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${start.toISOString().slice(0, 10)}`,
    title,
    start: start.toISOString(),
    ...(raw.endDate ? { end: new Date(raw.endDate).toISOString() } : {}),
    venue: venue || 'Fayetteville',
    area: areaFor(venue),
    category: categoryFor(`${raw['@type'] || ''} ${text}`),
    url,
    source: source.name,
    sourceKey: source.key,
    ...(source.key === 'fort-bragg' ? { accessNote: 'Installation access requirements may apply. Review the official event details before traveling.' } : {}),
    ...(raw.isAccessibleForFree === true ? { free: true } : {})
  };
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}

async function fetchSource(source) {
  const response = await fetch(source.url, { headers: { 'user-agent': 'HinsdaleHouseEvents/1.0 (+https://hinsdalehousenc.com)' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  return extractJsonLd(html).map(event => normalize(event, source)).filter(Boolean);
}

const previous = await readJson(outputPath, { events: [] });
const overrides = await readJson(overridesPath, []);
const collected = [];
const status = [];

const sourceResults = await Promise.all(sources.map(async source => {
  try { return { source, fresh: await fetchSource(source) }; }
  catch (error) { return { source, fresh: [], error }; }
}));

for (const { source, fresh, error } of sourceResults) {
  if (fresh.length) {
    collected.push(...fresh);
    status.push({ source: source.name, state: 'updated', count: fresh.length });
  } else {
    const retained = previous.events.filter(event => event.sourceKey === source.key);
    collected.push(...retained);
    status.push({ source: source.name, state: 'retained', count: retained.length, ...(error ? { error: error.message } : {}) });
  }
}

collected.push(...overrides);
const byKey = new Map();
for (const event of collected) {
  const start = new Date(event.start);
  if (Number.isNaN(start.valueOf()) || start < new Date(now.toDateString()) || start > horizon) continue;
  const key = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${event.start.slice(0, 10)}`;
  const current = byKey.get(key);
  if (!current || event.sourceKey === 'manual') byKey.set(key, event);
}

const events = [...byKey.values()].sort((a, b) => new Date(a.start) - new Date(b.start));
await fs.writeFile(outputPath, `${JSON.stringify({ updatedAt: new Date().toISOString(), horizonDays: 180, events, sources: status }, null, 2)}\n`);
console.log(`Wrote ${events.length} upcoming events.`);
