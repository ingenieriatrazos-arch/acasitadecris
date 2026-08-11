const { getStore } = require('@netlify/blobs');

// Devuelve la lista de check-ins completados (para pintar el punto verde en el panel).
exports.handler = async function() {
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
    const list = (await store.get('checkins', { type: 'json' })) || [];
    return { statusCode: 200, headers, body: JSON.stringify({ checkins: list }) };
  } catch (error) {
    console.error('Error get-checkins:', error);
    return { statusCode: 200, headers, body: JSON.stringify({ checkins: [], error: error.message }) };
  }
};
