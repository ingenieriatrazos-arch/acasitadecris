const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore({
      name: 'reservas',
      consistency: 'strong'
    });
    
    const data = await store.get('ocupados', { type: 'json' });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data || { busyRanges: [] })
    };
  } catch (error) {
    console.error('Error reading blobs:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ busyRanges: [], error: error.message })
    };
  }
};
