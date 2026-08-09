const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { reservasStore } = require('./ical-lib');

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
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: 'Webhook Error: ' + err.message };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const ci = parseFecha(session.metadata && session.metadata.checkin);
    const co = parseFecha(session.metadata && session.metadata.checkout);

    if (ci && co) {
      try {
        const store = reservasStore();
        const current = await store.get('ocupados', { type: 'json' }) || { busyRanges: [] };

        const lastNight = co > ci ? addDaysISO(co, -1) : ci;
        const email = session.customer_email || (session.customer_details && session.customer_details.email) || '';
        const amount = session.amount_total ? (session.amount_total / 100) : 0;

        current.busyRanges = current.busyRanges || [];
        current.busyRanges.push({
          from: ci,
          to: lastNight,
          type: 'reserva',
          email: email,
          amount: amount
        });

        current.notes = current.notes || [];
        current.notes.push({
          from: ci,
          to: lastNight,
          note: 'Reserva web' + (email ? ' - ' + email : '') + (amount ? ' (' + amount + ' EUR)' : ''),
          phone: ''
        });

        await store.setJSON('ocupados', current);
        console.log('Reserva guardada:', ci, '->', lastNight, email, amount);
      } catch (err) {
        console.error('Error guardando reserva:', err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
