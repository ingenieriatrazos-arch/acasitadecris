const { getStore } = require('@netlify/blobs');

// Guarda y sirve ficheros subidos desde el panel (video del cajetin, etc.)
exports.handler = async function (event) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  let store;
  try { store = getStore({ name: 'media', consistency: 'strong' }); }
  catch (e) { return { statusCode: 500, headers: cors, body: 'store: ' + e.message }; }

  const qs = event.queryStringParameters || {};
  const name = (qs.name || 'llave').replace(/[^a-z0-9_-]/gi, '');

  if (event.httpMethod === 'GET') {
    try {
      const meta = await store.get('meta-' + name, { type: 'json' });
      const buf = await store.get('file-' + name, { type: 'arrayBuffer' });
      if (!meta || !buf) return { statusCode: 404, headers: cors, body: 'No hay ningun fichero con ese nombre' };
      return {
        statusCode: 200,
        headers: Object.assign({}, cors, {
          'Content-Type': meta.mime || 'video/mp4',
          'Content-Length': String(buf.byteLength),
          'Accept-Ranges': 'none',
          'Cache-Control': 'public, max-age=3600'
        }),
        body: Buffer.from(buf).toString('base64'),
        isBase64Encoded: true
      };
    } catch (e) { return { statusCode: 500, headers: cors, body: e.message }; }
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'No autorizado' }) };
    }
    const key = String(body.name || 'llave').replace(/[^a-z0-9_-]/gi, '') || 'llave';
    const buf = Buffer.from(String(body.data || ''), 'base64');
    if (!buf.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Fichero vacio' }) };
    if (buf.length > 4.5 * 1024 * 1024) return { statusCode: 413, headers: cors, body: JSON.stringify({ error: 'Demasiado grande' }) };
    await store.set('file-' + key, buf);
    await store.setJSON('meta-' + key, { mime: body.mime || 'video/mp4', size: buf.length, at: new Date().toISOString() });
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, size: buf.length }) };
  } catch (e) {
    console.error('media:', e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
