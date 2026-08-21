const { getStore } = require('@netlify/blobs');

// Guarda y sirve ficheros subidos desde el panel (video del cajetin, etc.)
// La subida se hace por trozos y la descarga admite Range, para no chocar
// con el limite de 6 MB por peticion de las funciones de Netlify.
const MAX_SLICE = 2 * 1024 * 1024;

exports.handler = async function (event) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  let store;
  try { store = getStore({ name: 'media', consistency: 'strong' }); }
  catch (e) {
    try {
      store = getStore({
        name: 'media',
        siteID: 'd74f1b1b-aa23-4d68-b9c3-151e6eb458f9',
        token: process.env.NETLIFY_TOKEN,
        consistency: 'strong'
      });
    } catch (e2) { return { statusCode: 500, headers: cors, body: 'store: ' + e2.message }; }
  }

  const clean = function (s, def) { return String(s || def).replace(/[^a-z0-9_-]/gi, '') || def; };
  const qs = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    const name = clean(qs.name, 'llave');
    try {
      const meta = await store.get('meta-' + name, { type: 'json' });
      const raw = await store.get('file-' + name, { type: 'arrayBuffer' });
      if (!meta || !raw) return { statusCode: 404, headers: cors, body: 'No hay ningun fichero con ese nombre' };
      const buf = Buffer.from(raw);
      const total = buf.length;
      const h = event.headers || {};
      const range = h.range || h.Range || '';
      let start = 0, end = total - 1;
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m) {
        if (m[1] !== '') start = parseInt(m[1], 10);
        if (m[2] !== '') end = parseInt(m[2], 10);
      }
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end > total - 1) end = total - 1;
      if (end < start) end = start;
      const partial = (end - start + 1) > MAX_SLICE || !!range || total > MAX_SLICE;
      if ((end - start + 1) > MAX_SLICE) end = start + MAX_SLICE - 1;
      if (end > total - 1) end = total - 1;
      const slice = buf.slice(start, end + 1);
      const head = Object.assign({}, cors, {
        'Content-Type': meta.mime || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(slice.length),
        'Cache-Control': 'public, max-age=3600'
      });
      if (partial) head['Content-Range'] = 'bytes ' + start + '-' + end + '/' + total;
      return {
        statusCode: partial ? 206 : 200,
        headers: head,
        body: slice.toString('base64'),
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
    const key = clean(body.name, 'llave');
    const mime = String(body.mime || 'video/mp4').slice(0, 60);
    const data = Buffer.from(String(body.data || ''), 'base64');
    if (!data.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Trozo vacio' }) };

    const total = Math.max(1, parseInt(body.total, 10) || 1);
    const idx = Math.max(0, parseInt(body.idx, 10) || 0);

    if (total === 1) {
      await store.set('file-' + key, data);
      await store.setJSON('meta-' + key, { mime: mime, size: data.length, at: new Date().toISOString() });
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, size: data.length }) };
    }

    await store.set('tmp-' + key + '-' + idx, data);
    if (idx < total - 1) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, part: idx, of: total }) };
    }

    const partes = [];
    for (let i = 0; i < total; i++) {
      const c = await store.get('tmp-' + key + '-' + i, { type: 'arrayBuffer' });
      if (!c) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Falta el trozo ' + (i + 1) }) };
      partes.push(Buffer.from(c));
    }
    const full = Buffer.concat(partes);
    await store.set('file-' + key, full);
    await store.setJSON('meta-' + key, { mime: mime, size: full.length, at: new Date().toISOString() });
    for (let i = 0; i < total; i++) { try { await store.delete('tmp-' + key + '-' + i); } catch (e) {} }
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, size: full.length }) };
  } catch (e) {
    console.error('media:', e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
