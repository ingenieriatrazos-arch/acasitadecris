const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
 
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
 
  try {
    const { amount, currency, description, email, checkin, checkout, nights } = JSON.parse(event.body);
 
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'eur',
          product_data: {
            name: 'Reserva A Casiña de Cris',
            description: description,
          },
          unit_amount: Math.round(amount),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email || undefined,
      success_url: 'https://acasitadecris.com/?reserva=ok',
      cancel_url: 'https://acasitadecris.com/?reserva=cancelada',
      metadata: {
        checkin: checkin,
        checkout: checkout,
        nights: String(nights),
      }
    });
 
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };
 
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
 
