const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { password, busyRanges } = JSON.parse(event.body);

    if (password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    const store = getStore({
      name: 'reservas',
      consistency: 'strong'
    });

    const dataToSave = { busyRanges: busyRanges || [] };
    await store.setJSON('ocupados', dataToSave);

    // Verify it was saved
    const verify = await store.get('ocupados', { type: 'json' });
    console.log('Saved and verified:', JSON.stringify(verify));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, saved: dataToSave })
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
