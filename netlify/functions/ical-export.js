const { getStore } = require('@netlify/blobs');

// Exporta el calendario de ocupación en formato iCal (.ics).
// Airbnb y Booking pueden SUSCRIBIRSE a esta URL para bloquear estas fechas:
//   https://acasitadecris.com/.netlify/functions/ical-export
// (o el atajo /calendario.ics si añades la redirección del netlify.toml)

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function toICSDate(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
function parseYMD(s) {
  // admite 'YYYY-MM-DD'
  const p = String(s).slice(0, 10).split('-');
  return new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
}
function addDays(d, n) { const r = new Date(d.getTime()); r.setUTCDate(r.getUTCDate() + n); return r; }

// Normaliza cualquier formato de rango a { start:Date, end:Date } (end EXCLUSIVO, estilo iCal)
function normalize(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const s = parseYMD(item);
    return { start: s, end: addDays(s, 1) };
  }
  const startRaw = item.start || item.from || item.desde || item.checkin;
  const endRaw = item.end || item.to || item.hasta || item.checkout;
  if (!startRaw) return null;
  const start = parseYMD(startRaw);
  // Si hay end lo usamos como salida (exclusivo); si no, un día
  const end = endRaw ? parseYMD(endRaw) : addDays(start, 1);
  return { start: start, end: end };
}

exports.handler = async function() {
  const headers = {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'inline; filename="acasitadecris.ics"',
    'Access-Control-Allow-Origin': '*'
  };
  try {
    const store = getStore({
      name: 'reservas',
      siteID: 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9',
      token: process.env.NETLIFY_TOKEN,
      consistency: 'strong'
    });
    const data = (await store.get('ocupados', { type: 'json' })) || {};
    const external = (await store.get('external', { type: 'json' })) || [];
    const ranges = [].concat(data.busyRanges || [], external);

    const now = new Date();
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//A Casina de Cris//Calendario//ES\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'X-WR-CALNAME:A Casina de Cris - Ocupacion\r\n';

    ranges.forEach(function (item, i) {
      const r = normalize(item);
      if (!r) return;
      ics += 'BEGIN:VEVENT\r\n';
      ics += 'UID:acasitadecris-' + toICSDate(r.start) + '-' + i + '@acasitadecris.com\r\n';
      ics += 'DTSTAMP:' + toICSDate(now) + 'T000000Z\r\n';
      ics += 'DTSTART;VALUE=DATE:' + toICSDate(r.start) + '\r\n';
      ics += 'DTEND;VALUE=DATE:' + toICSDate(r.end) + '\r\n';
      ics += 'SUMMARY:No disponible\r\n';
      ics += 'TRANSP:OPAQUE\r\n';
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return { statusCode: 200, headers, body: ics };
  } catch (error) {
    console.error('Error ical-export:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Error: ' + error.message };
  }
};
