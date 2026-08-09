const { reservasStore, expandDays } = require('./ical-lib');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { password, busyRanges, config, notes } = JSON.parse(event.body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const store = reservasStore();
    const existing = await store.get('ocupados', { type: 'json' }) || {};

    let manualRanges = existing.busyRanges || [];
    if (busyRanges !== undefined) {
      const ext = await store.get('externos', { type: 'json' }) || {};
      const externalDays = expandDays((ext.booking || []).concat(ext.airbnb || []));
      const previousManualDays = expandDays(existing.busyRanges || []);
      const postedDays = expandDays(busyRanges || []);

      const days = [...postedDays].filter(function(d){
        return !externalDays.has(d) || previousManualDays.has(d);
      }).sort();
      manualRanges = days.map(function(d){ return { from: d, to: d }; });
    }

    const dataToSave = {
      busyRanges: manualRanges,
      config: config !== undefined ? config : (existing.config || {}),
      notes: notes !== undefined ? notes : (existing.notes || [])
    };
    await store.setJSON('ocupados', dataToSave);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, saved: manualRanges.length, notes: dataToSave.notes.length })
    };
  } catch (error) {
    console.error('Error saving blobs:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
