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

  const { titular, acompanantes, menores, reserva } = data;

  const rowStyle = 'padding:8px 12px;border-bottom:1px solid #e8f4fa;';
  const labelStyle = 'font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#2e8bb5;font-weight:600;';
  const valueStyle = 'font-size:14px;color:#0a2d40;font-weight:500;margin-top:2px;';

  function row(label, value) {
    if (!value) return '';
    return `<tr style="${rowStyle}"><td><div style="${labelStyle}">${label}</div><div style="${valueStyle}">${value}</div></td></tr>`;
  }

  function personaHTML(p, titulo, tipo) {
    tipo = tipo || 'adulto';
    let filas = '';
    filas += row('Nombre completo', p.nombreCompleto || p.nombre);
    filas += row('Sexo', p.sexo);
    if (tipo !== 'menor') {
      filas += row('Documento', (p.tipoDoc ? p.tipoDoc + ' ' : '') + (p.dni || ''));
      filas += row('Nº de soporte', p.soporte);
    } else {
      filas += row('Documento', p.dni);
    }
    filas += row('Fecha de nacimiento', p.nacimiento);
    filas += row('Nacionalidad', p.nacionalidad);
    filas += row('País de residencia', p.pais);
    filas += row('Parentesco', p.parentesco);
    filas += row('Teléfono', p.telefono);
    filas += row('Email', p.email);
    filas += row('Dirección', p.direccion ? p.direccion + (p.cp ? ' (' + p.cp + ')' : '') : '');
    if (tipo === 'titular') {
      filas += row('Pago', p.pagoTipo ? p.pagoTipo + (p.pagoId ? ' · ' + p.pagoId : '') : '');
    }
    return `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#2e8bb5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #2e8bb5;">${titulo}</div>
        <table style="width:100%;border-collapse:collapse;background:#f0f7fa;border-radius:8px;overflow:hidden;">${filas}</table>
      </div>`;
  }

  let acompHTML = '';
  if (acompanantes && acompanantes.length > 0) {
    acompanantes.forEach((a, i) => { acompHTML += personaHTML(a, `👤 Adulto acompañante ${i + 1}`, 'adulto'); });
  }
  let menoresHTML = '';
  if (menores && menores.length > 0) {
    menores.forEach((m, i) => { menoresHTML += personaHTML(m, `🧒 Menor ${i + 1}`, 'menor'); });
  }

  const totalViajeros = 1 + (acompanantes ? acompanantes.length : 0) + (menores ? menores.length : 0);

  const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f0f7fa;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0a2d40,#1a6a8f);padding:30px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;color:#fff;font-weight:400;">A Casiña <span style="color:#7dd3f5;">de Cris</span></div>
      <div style="font-size:13px;color:rgba(200,235,255,0.8);margin-top:6px;">✅ Nuevo Check-in Online · ${totalViajeros} viajero(s)</div>
    </div>
    <div style="padding:30px;">
      <div style="background:linear-gradient(135deg,#0a2d40,#1a6a8f);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7dd3f5;font-weight:600;">Fechas de la reserva</div>
        <div style="font-size:16px;color:#fff;font-weight:600;margin-top:4px;">📅 ${reserva.checkin || '—'} → ${reserva.checkout || '—'}</div>
      </div>
      ${personaHTML(titular, '👤 Titular', 'titular')}
      ${acompHTML}
      ${menoresHTML}
      <div style="background:#e8f8f0;border:1.5px solid #7fd0aa;border-radius:10px;padding:14px 16px;margin-top:10px;"><div style="font-size:12px;color:#0F6E56;line-height:1.6;">&#9989; <strong>Parte de viajeros:</strong> se comunica autom&aacute;ticamente a SES.Hospedajes (Ministerio del Interior). Recibir&aacute;s otro correo con el resultado y el n&uacute;mero de lote. Si ese correo no llega o indica error, comunica el parte a mano en la sede antes de 24&nbsp;h desde la llegada.</div></div>
    </div>
  </div>
</body></html>`;

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
        subject: `✅ Check-in: ${titular.nombreCompleto || titular.nombre} — ${reserva.checkin} → ${reserva.checkout}`,
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
