const { getStore } = require('@netlify/blobs');

// Importa los calendarios de Airbnb y Booking (iCal) y bloquea esas fechas en la web.
// Configura en Netlify las variables de entorno con las URLs iCal de cada plataforma:
//   AIRBNB_ICAL_URL   → Airbnb: Calendario > Disponibilidad > Conectar calendarios > Exportar
//   BOOKING_ICAL_URL  → Booking: Extranet > Tarifas y disponibilidad > Sincronización de calendarios
//
// Se ejecuta solo cada hora (función programada). También puedes llamarla a mano
// abriendo: https://acasitadecris.com/.netlify/functions/ical-sync

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmt(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }

function icsDateToYMD(v) {
  // admite 20260811 o 20260811T140000Z
  const m = String(v).match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return m[1] + '-' + m[2] + '-' + m[3];
}

// Parser iCal mínimo: extrae rangos { start, end, source }
function parseICS(text, source) {
  // desdoblar líneas plegadas (RFC 5545: continúan con espacio/tab)
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const ranges = [];
  let cur = null;
  lines.forEach(function (line) {
    if (line.indexOf('BEGIN:VEVENT') === 0) { cur = {}; return; }
    if (line.indexOf('END:VEVENT') === 0) {
      if (cur && cur.start && cur.end) ranges.push({ start: cur.start, end: cur.end, source: source });
      cur = null; return;
    }
    if (!cur) return;
    if (line.indexOf('DTSTART') === 0) { const v = line.split(':').pop(); cur.start = icsDateToYMD(v); }
    else if (line.indexOf('DTEND') === 0) { const v = line.split(':').pop(); cur.end = icsDateToYMD(v); }
  });
  return ranges;
}

async function fetchICS(url, source) {
  if (!url) return [];
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'acasitadecris-sync' } });
    if (!res.ok) { console.error(source + ' HTTP ' + res.status); return []; }
    const text = await res.text();
    return parseICS(text, source);
  } catch (e) {
    console.error('Error descargando ' + source + ':', e.message);
    return [];
  }
}

exports.handler = async function() {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const airbnb = await fetchICS(process.env.AIRBNB_ICAL_URL, 'airbnb');
    const booking = await fetchICS(process.env.BOOKING_ICAL_URL, 'booking');
    const external = [].concat(airbnb, booking);

    const store = getStore({
      name: 'reservas',
      siteID: 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9',
      token: process.env.NETLIFY_TOKEN,
      consistency: 'strong'
    });
    await store.setJSON('external', external);
    await store.setJSON('external_meta', { updated: new Date().toISOString(), airbnb: airbnb.length, booking: booking.length });

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, airbnb: airbnb.length, booking: booking.length }) };
  } catch (error) {
    console.error('Error ical-sync:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

// Ejecutar automáticamente cada hora
exports.config = { schedule: '@hourly' };
