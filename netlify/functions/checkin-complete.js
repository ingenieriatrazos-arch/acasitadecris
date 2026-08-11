const { getStore } = require('@netlify/blobs');

// Registra que una reserva ha completado el check-in (para el punto verde del panel).
exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { checkin, checkout, email, nombre, personas } = JSON.parse(event.body);
    const store = getStore({
      name: 'reservas',
      siteID: 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9',
      token: process.env.NETLIFY_TOKEN,
      consistency: 'strong'
    });

    const list = (await store.get('checkins', { type: 'json' })) || [];
    // Clave: fechas + email. Si ya existe, se actualiza.
    const key = (checkin || '') + '|' + (checkout || '') + '|' + (email || '').toLowerCase();
    const idx = list.findIndex(function (c) {
      return ((c.checkin || '') + '|' + (c.checkout || '') + '|' + (c.email || '').toLowerCase()) === key;
    });
    const record = {
      checkin: checkin || '',
      checkout: checkout || '',
      email: email || '',
      nombre: nombre || '',
      personas: personas || 1,
      completed: true,
      ts: new Date().toISOString()
    };
    if (idx >= 0) list[idx] = record; else list.push(record);
    await store.setJSON('checkins', list);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Error checkin-complete:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
