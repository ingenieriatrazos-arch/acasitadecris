const { getStore } = require('@netlify/blobs');

const SITE_ID = 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9';
const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'ingenieriatrazos@gmail.com';
const NOTIFY_FROM = 'checkin@acasitadecris.com';

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

function fmtES(iso){
  const p = String(iso).split('-');
  return p[2]+'/'+p[1]+'/'+p[0];
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

async function sendEmail(subject, html){
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: NOTIFY_FROM, to: NOTIFY_TO, subject: subject, html: html })
    });
  } catch (e) {
    console.error('Error enviando notificacion:', e);
  }
}

async function notifyNewExternal(added){
  const nice = { booking: 'Booking', airbnb: 'Airbnb' };
  const items = added.map(function(a){
    return '<li style="margin-bottom:6px"><b>' + nice[a.src] + '</b>: ' + fmtES(a.r.from) + ' &rarr; ' + fmtES(a.r.to) + '</li>';
  }).join('');
  const first = added[0];
  const subject = 'Nueva reserva en ' + nice[first.src] + ': ' + fmtES(first.r.from) + ' - ' + fmtES(first.r.to) + (added.length > 1 ? ' (+' + (added.length - 1) + ' mas)' : '');
  const html = '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
    + '<div style="background:#1a6a8f;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-size:16px;font-weight:700">A Casina de Cris - Nueva ocupacion detectada</div>'
    + '<div style="border:1px solid #d0e8f5;border-top:none;border-radius:0 0 10px 10px;padding:20px">'
    + '<p style="font-size:14px;color:#1a3a4a">Se han detectado fechas nuevas en la sincronizacion de calendarios:</p>'
    + '<ul style="font-size:14px;color:#1a3a4a">' + items + '</ul>'
    + '<p style="font-size:12px;color:#5a8a9a">Consulta el detalle del huesped en el panel de la plataforma. Calendario: <a href="https://acasitadecris.com/admin.html">acasitadecris.com/admin.html</a></p>'
    + '</div></div>';
  await sendEmail(subject, html);
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
  const added = [];
  const hadPrevious = !!ext.updatedAt;
  for (const key of Object.keys(sources)){
    if (!sources[key]) continue;
    try {
      out[key] = await fetchIcal(sources[key]);
      if (hadPrevious) {
        const oldSet = new Set((ext[key] || []).map(function(r){ return r.from + '|' + r.to; }));
        out[key].forEach(function(r){
          if (!oldSet.has(r.from + '|' + r.to)) added.push({ src: key, r: r });
        });
      }
    } catch(e){
      out.errors[key] = e.message;
    }
  }
  await store.setJSON('externos', out);
  if (added.length) {
    try { await notifyNewExternal(added); } catch(e){ console.error(e); }
  }
  return out;
}

module.exports = { reservasStore, parseICS, expandDays, ensureFreshExternal, fmtDate, addDaysCompact, sendEmail, fmtES };
