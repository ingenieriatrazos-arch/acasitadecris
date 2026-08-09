const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { reservasStore, ensureFreshExternal, expandDays } = require('./ical-lib');

const MESES = {
  enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
  julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
};

function parseFecha(str){
  const s = String(str || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.toLowerCase().split(' de ');
  if (parts.length === 3) {
    const day = parts[0].trim().padStart(2, '0');
    const month = MESES[parts[1].trim()];
    const year = parts[2].trim();
    if (month && /^\d{4}$/.test(year)) return year + '-' + month + '-' + day;
  }
  return null;
}

function addDaysISO(iso, n){
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { email, checkin, checkout } = JSON.parse(event.body);

    const ci = parseFecha(checkin);
    const co = parseFecha(checkout);
    const hoy = new Date().toISOString().slice(0, 10);

    if (!ci || !co || co <= ci) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Fechas no validas' }) };
    }
    if (ci < hoy) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'La fecha de entrada ya ha pasado' }) };
    }

    const store = reservasStore();
    const data = await store.get('ocupados', { type: 'json' }) || {};
    let external = { booking: [], airbnb: [] };
    try { external = await ensureFreshExternal(store, 10); } catch(e) { console.error(e); }

    const busy = expandDays((data.busyRanges || []).concat(external.booking || [], external.airbnb || []));

    const cfg = data.config || {};
    const priceLow = cfg.priceLow || 160;
    const priceHigh = cfg.priceHigh || 180;
    const highStart = (cfg.highStart !== undefined) ? cfg.highStart : 6;
    const highEnd = (cfg.highEnd !== undefined) ? cfg.highEnd : 7;
    const minLow = cfg.minLow || 2;
    const minHigh = cfg.minHigh || 5;

    let total = 0, nights = 0, anyHigh = false;
    for (let d = ci; d < co; d = addDaysISO(d, 1)) {
      if (busy.has(d)) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Alguna de las fechas ya no esta disponible. Recarga el calendario.' }) };
      }
      const m = parseInt(d.slice(5, 7), 10) - 1;
      const high = m >= highStart && m <= highEnd;
      if (high) anyHigh = true;
      total += high ? priceHigh : priceLow;
      nights++;
    }

    const minimo = anyHigh ? minHigh : minLow;
    if (nights < minimo) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Estancia minima de ' + minimo + ' noches en estas fechas' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Reserva A Casina de Cris',
            description: 'Del ' + ci + ' al ' + co + ' (' + nights + ' noches)'
          },
          unit_amount: total * 100
        },
        quantity: 1
      }],
      mode: 'payment',
      customer_email: email || undefined,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      success_url: 'https://acasitadecris.com/?reserva=ok',
      cancel_url: 'https://acasitadecris.com/?reserva=cancelada',
      metadata: { checkin: ci, checkout: co, nights: String(nights) }
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (error) {
    console.error('Stripe error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
