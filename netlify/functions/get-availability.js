const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore('reservas');
    const data = await store.get('ocupados', { type: 'json' });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data || { busyRanges: [] })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ busyRanges: [] })
    };
  }
};
