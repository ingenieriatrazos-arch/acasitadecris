const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const store = getStore({
      name: 'reservas',
      siteID: 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9',
      token: process.env.NETLIFY_TOKEN,
      consistency: 'strong'
    });

    const data = await store.get('ocupados', { type: 'json' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data || { busyRanges: [], config: {} })
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
