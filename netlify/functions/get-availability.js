const { reservasStore, ensureFreshExternal } = require('./ical-lib');

function addDaysISO(iso, n){
  const d = new Date(String(iso) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = reservasStore();
    const data = await store.get('ocupados', { type: 'json' }) || { busyRanges: [], config: {} };

    let partes = [];
    try {
      const log = await store.get('partes', { type: 'json' });
      if (log && log.items) partes = log.items.filter(function(p){ return p.ok; }).map(function(p){
        const ultimaNoche = (p.salida && p.salida > p.entrada) ? addDaysISO(p.salida, -1) : p.entrada;
        return { from: p.entrada, to: ultimaNoche, salida: p.salida, personas: p.personas, fecha: p.fecha, lote: p.lote || '' };
      });
    } catch(e) { console.error(e); }

    const force = event.queryStringParameters && event.queryStringParameters.force === '1';
    let external = { booking: [], airbnb: [], updatedAt: null };
    try {
      external = await ensureFreshExternal(store, force ? 0 : 30);
    } catch (e) {
      console.error('Error syncing external icals:', e);
    }

    const merged = (data.busyRanges || [])
      .concat(external.booking || [])
      .concat(external.airbnb || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        busyRanges: merged,
        config: data.config || {},
        notes: data.notes || [],
        partes: partes,
        manualRanges: data.busyRanges || [],
        external: {
          booking: external.booking || [],
          airbnb: external.airbnb || [],
          updatedAt: external.updatedAt || null,
          errors: external.errors || {},
          sources: {
            booking: !!process.env.BOOKING_ICAL_URL,
            airbnb: !!process.env.AIRBNB_ICAL_URL
          }
        }
      })
    };
  } catch (error) {
    console.error('Error reading blobs:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ busyRanges: [], config: {}, notes: [], partes: [], error: error.message })
    };
  }
};
