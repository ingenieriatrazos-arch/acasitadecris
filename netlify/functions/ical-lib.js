const { getStore } = require('@netlify/blobs');

const SITE_ID = 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9';

function reservasStore() {
  return getStore({
    name: 'reservas',
    siteID: SITE_ID,
    token: process.env.NETLIFY_TOKEN,
    consistency: 'strong'
  });
}

function pad(n){ return String(n).padStart(2,'0'); }

function fmtDate(yyyymmdd){
  return yyyymmdd.slice(0,4)+'-'+yyyymmdd.slice(4,6)+'-'+yyyymmdd.slice(6,8);
}

function addDaysCompact(yyyymmdd, n){
  const d = new Date(Date.UTC(+yyyymmdd.slice(0,4), +yyyymmdd.slice(4,6)-1, +yyyymmdd.slice(6,8)));
  d.setUTCDate(d.getUTCDate()+n);
  return ''+d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate());
}

function parseICS(text){
  const ranges = [];
  const events = String(text).split('BEGIN:VEVENT').slice(1);
  for (const ev of events){
    const body = ev.split('END:VEVENT')[0];
    const ds = body.match(/DTSTART[^:]*:(\d{8})/);
    if (!ds) continue;
    const de = body.match(/DTEND[^:]*:(\d{8})/);
    const from = fmtDate(ds[1]);
    const to = de ? fmtDate(addDaysCompact(de[1], -1)) : from;
    if (to >= from) ranges.push({ from: from, to: to });
  }
  return ranges;
}

function expandDays(ranges){
  const days = new Set();
  for (const r of (ranges || [])){
    let d = String(r.from).replace(/-/g,'');
    const end = String(r.to).replace(/-/g,'');
    let guard = 0;
    while (d <= end && guard++ < 800){
      days.add(fmtDate(d));
      d = addDaysCompact(d, 1);
    }
  }
  return days;
}

async function fetchIcal(url){
  const res = await fetch(url, { headers: { 'User-Agent': 'acasitadecris-ical-sync' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return parseICS(await res.text());
}

async function ensureFreshExternal(store, maxAgeMinutes){
  const max = (maxAgeMinutes === undefined || maxAgeMinutes === null) ? 30 : maxAgeMinutes;
  const ext = await store.get('externos', { type: 'json' }) || {};
  const age = ext.updatedAt ? (Date.now() - new Date(ext.updatedAt).getTime()) / 60000 : Infinity;
  const sources = {
    booking: process.env.BOOKING_ICAL_URL,
    airbnb: process.env.AIRBNB_ICAL_URL
  };
  if (!sources.booking && !sources.airbnb) {
    return { booking: [], airbnb: [], updatedAt: null };
  }
  if (age < max) return ext;

  const out = {
    booking: ext.booking || [],
    airbnb: ext.airbnb || [],
    updatedAt: new Date().toISOString(),
    errors: {}
  };
  for (const key of Object.keys(sources)){
    if (!sources[key]) continue;
    try {
      out[key] = await fetchIcal(sources[key]);
    } catch(e){
      out.errors[key] = e.message;
    }
  }
  await store.setJSON('externos', out);
  return out;
}

module.exports = { reservasStore, parseICS, expandDays, ensureFreshExternal, fmtDate, addDaysCompact };
