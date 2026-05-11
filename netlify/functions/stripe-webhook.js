const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require('@netlify/blobs');

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
    const checkin = session.metadata.checkin;
    const checkout = session.metadata.checkout;

    if (checkin && checkout) {
      try {
        const store = getStore('reservas');
        const current = await store.get('ocupados', { type: 'json' }) || { busyRanges: [] };
        
        // Convert date format from "15 de julio 2026" to "2026-07-15"
        function parseSpanishDate(str) {
          const months = {
            'enero':'01','febrero':'02','marzo':'03','abril':'04',
            'mayo':'05','junio':'06','julio':'07','agosto':'08',
            'septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12'
          };
          const parts = str.toLowerCase().split(' de ');
          if (parts.length === 3) {
            const day = parts[0].trim().padStart(2, '0');
            const month = months[parts[1].trim()] || '01';
            const year = parts[2].trim();
            return year + '-' + month + '-' + day;
          }
          return str;
        }

        const fromDate = parseSpanishDate(checkin);
        const toDate = parseSpanishDate(checkout);

        current.busyRanges.push({
          from: fromDate,
          to: toDate,
          type: 'reserva',
          email: session.customer_email || '',
          amount: session.amount_total / 100
        });

        await store.set('ocupados', JSON.stringify(current));
        console.log('Reserva guardada:', fromDate, '->', toDate);
      } catch (err) {
        console.error('Error guardando reserva:', err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
