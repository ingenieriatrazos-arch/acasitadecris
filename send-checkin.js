exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { titular, acompanantes, reserva } = data;

  // Build HTML email
  const rowStyle = 'padding:8px 12px;border-bottom:1px solid #e8f4fa;';
  const labelStyle = 'font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#2e8bb5;font-weight:600;';
  const valueStyle = 'font-size:14px;color:#0a2d40;font-weight:500;margin-top:2px;';

  function personaHTML(p, titulo) {
    return `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#2e8bb5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #2e8bb5;">${titulo}</div>
        <table style="width:100%;border-collapse:collapse;background:#f0f7fa;border-radius:8px;overflow:hidden;">
          <tr style="${rowStyle}"><td><div style="${labelStyle}">Nombre completo</div><div style="${valueStyle}">${p.nombre || '—'}</div></td></tr>
          <tr style="${rowStyle}"><td><div style="${labelStyle}">DNI / NIE / Pasaporte</div><div style="${valueStyle}">${p.dni || '—'}</div></td></tr>
          <tr style="${rowStyle}"><td><div style="${labelStyle}">Fecha de nacimiento</div><div style="${valueStyle}">${p.nacimiento || '—'}</div></td></tr>
          <tr style="${rowStyle}"><td><div style="${labelStyle}">Nacionalidad</div><div style="${valueStyle}">${p.nacionalidad || '—'}</div></td></tr>
          ${p.telefono ? `<tr style="${rowStyle}"><td><div style="${labelStyle}">Teléfono</div><div style="${valueStyle}">${p.telefono}</div></td></tr>` : ''}
          ${p.email ? `<tr style="${rowStyle}"><td><div style="${labelStyle}">Email</div><div style="${valueStyle}">${p.email}</div></td></tr>` : ''}
          ${p.direccion ? `<tr style="${rowStyle}"><td><div style="${labelStyle}">Dirección</div><div style="${valueStyle}">${p.direccion}</div></td></tr>` : ''}
        </table>
      </div>`;
  }

  let acompHTML = '';
  if (acompanantes && acompanantes.length > 0) {
    acompanantes.forEach((a, i) => {
      acompHTML += personaHTML(a, `Acompañante ${i + 1}`);
    });
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f0f7fa;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a2d40,#1a6a8f);padding:30px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;color:#fff;font-weight:400;">A Casiña <span style="color:#7dd3f5;">de Cris</span></div>
      <div style="font-size:13px;color:rgba(200,235,255,0.8);margin-top:6px;">✅ Nuevo Check-in Online</div>
    </div>

    <div style="padding:30px;">

      <!-- Reserva -->
      <div style="background:linear-gradient(135deg,#0a2d40,#1a6a8f);border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7dd3f5;font-weight:600;">Fechas de la reserva</div>
          <div style="font-size:16px;color:#fff;font-weight:600;margin-top:4px;">📅 ${reserva.checkin || '—'} → ${reserva.checkout || '—'}</div>
        </div>
      </div>

      ${personaHTML(titular, '👤 Titular')}
      ${acompHTML}

      <!-- Footer nota -->
      <div style="background:#fff8e8;border:1.5px solid #f5d88a;border-radius:10px;padding:14px 16px;margin-top:10px;">
        <div style="font-size:12px;color:#6a5010;line-height:1.6;">
          ⚠️ <strong>Recuerda:</strong> Debes registrar estos datos en <strong>SES.HOSPEDERÍA</strong> antes de las 24h siguientes a la llegada del viajero.
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

  // Send via Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'checkin@acasitadecris.com',
        to: 'ingenieriatrazos@gmail.com',
        subject: `✅ Check-in: ${titular.nombre} — ${reserva.checkin} → ${reserva.checkout}`,
        html
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return { statusCode: 500, body: 'Email error: ' + err };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error:', e);
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};
