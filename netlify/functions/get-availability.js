const { reservasStore, ensureFreshExternal } = require('./ical-lib');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = reservasStore();
    const data = await store.get('ocupados', { type: 'json' }) || { busyRanges: [], config: {} };

    let external = { booking: [], airbnb: [], updatedAt: null };
    try {
      external = await ensureFreshExternal(store, 30);
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
        manualRanges: data.busyRanges || [],
        external: {
          booking: external.booking || [],
          airbnb: external.airbnb || [],
          updatedAt: external.updatedAt || null
        }
      })
    };
  } catch (error) {
    console.error('Error reading blobs:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ busyRanges: [], config: {}, error: error.message })
    };
  }
};
