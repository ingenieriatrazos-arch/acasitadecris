const { reservasStore, ensureFreshExternal, expandDays } = require('./ical-lib');

function toCompact(d){ return String(d).replace(/-/g, ''); }

function addDaysISO(iso, n){
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

exports.handler = async function(event, context) {
  try {
    const src = (event.queryStringParameters && event.queryStringParameters.src) || '';
    const store = reservasStore();
    const data = await store.get('ocupados', { type: 'json' }) || {};

    let external = { booking: [], airbnb: [] };
    try { external = await ensureFreshExternal(store, 30); } catch(e) { console.error(e); }

    let ranges = (data.busyRanges || []).slice();
    if (src !== 'booking') ranges = ranges.concat(external.booking || []);
    if (src !== 'airbnb') ranges = ranges.concat(external.airbnb || []);

    const days = [...expandDays(ranges)].sort();
    const blocks = [];
    for (const d of days){
      const last = blocks[blocks.length - 1];
      if (last && addDaysISO(last.to, 1) === d) { last.to = d; }
      else { blocks.push({ from: d, to: d }); }
    }

    const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//A Casina de Cris//Disponibilidad//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:A Casina de Cris'
    ];
    blocks.forEach(function(b){
      lines.push('BEGIN:VEVENT');
      lines.push('UID:casina-' + b.from + '-' + b.to + '@acasitadecris.com');
      lines.push('DTSTAMP:' + now);
      lines.push('DTSTART;VALUE=DATE:' + toCompact(b.from));
      lines.push('DTEND;VALUE=DATE:' + toCompact(addDaysISO(b.to, 1)));
      lines.push('SUMMARY:Ocupado');
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:OPAQUE');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="acasitadecris.ics"',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: lines.join('\r\n') + '\r\n'
    };
  } catch (error) {
    return { statusCode: 500, body: 'Error: ' + error.message };
  }
};
