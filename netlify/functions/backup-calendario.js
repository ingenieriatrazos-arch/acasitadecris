const { reservasStore, sendEmail, todayMadrid } = require('./ical-lib');

const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'ingenieriatrazos@gmail.com';

exports.handler = async function(){
  try{
    const store = reservasStore();
    const ocupados = (await store.get('ocupados',{type:'json'})) || {};
    const externos = (await store.get('externos',{type:'json'})) || {};
    const partes   = (await store.get('partes',{type:'json'})) || {};
    const checkins = (await store.get('checkins',{type:'json'})) || [];

    const hoy = todayMadrid();
    let parteDatos = {};
    try{
      const { blobs } = await store.list({ prefix: 'parte-datos-' });
      for(const b of (blobs||[])){
        parteDatos[b.key] = await store.get(b.key, { type: 'json' });
      }
    }catch(e){ console.error('backup parte-datos:', e); }

    let ajustes = null;
    try{
      const { getStore } = require('@netlify/blobs');
      let ms;
      try{ ms = getStore({ name:'media', consistency:'strong' }); }
      catch(e){ ms = getStore({ name:'media', siteID:'d74f1b1b-aa23-4d68-b9c3-151e6eb458f9', token:process.env.NETLIFY_TOKEN, consistency:'strong' }); }
      ajustes = await ms.get('config-panel', { type:'json' });
    }catch(e){ console.error('backup ajustes:', e); }

    const backup = { generado: new Date().toISOString(), ocupados, externos, partes, checkins, parteDatos, ajustes };
    const json = JSON.stringify(backup, null, 1);
    const b64 = Buffer.from(json,'utf8').toString('base64');

    const resumen = 'Bloqueos manuales: '+((ocupados.busyRanges||[]).length)
      +' &middot; Notas: '+((ocupados.notes||[]).length)
      +' &middot; Booking: '+((externos.booking||[]).length)
      +' &middot; Airbnb: '+((externos.airbnb||[]).length)
      +' &middot; Partes enviados: '+((partes.items||[]).filter(function(p){return p.ok;}).length)
      +' &middot; Check-ins: '+checkins.length
      +' &middot; Fichas de viajeros: '+Object.keys(parteDatos).length;

    const html='<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
      +'<div style="background:#1a6a8f;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-weight:700">Copia de seguridad diaria</div>'
      +'<div style="border:1px solid #d0e8f5;border-top:none;border-radius:0 0 10px 10px;padding:20px;font-size:14px;color:#1a3a4a">'
      +'<p>Adjunto la copia del calendario y los registros a fecha '+hoy+'.</p>'
      +'<p style="font-size:13px;color:#3a5a6a">'+resumen+'</p>'
      +'<p style="font-size:12px;color:#5a8a9a">Guarda este correo: si algo se borrase o se sobrescribiese, con este fichero se puede restaurar el calendario completo.</p>'
      +'</div></div>';

    if(!process.env.RESEND_API_KEY) return {statusCode:200,body:'sin RESEND_API_KEY'};
    const res = await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
      body: JSON.stringify({
        from:'checkin@acasitadecris.com',
        to: NOTIFY_TO,
        subject:'Copia de seguridad del calendario - '+hoy,
        html: html,
        attachments:[{ filename:'casina-backup-'+hoy+'.json', content:b64 }]
      })
    });
    const okr = res.ok;
    if(!okr){ const t=await res.text(); console.error('Resend:',t); await sendEmail('Fallo en la copia de seguridad','<p>No se pudo adjuntar el backup: '+String(t).slice(0,300)+'</p>'); }
    return {statusCode:200,body:okr?'backup enviado':'error resend'};
  }catch(e){
    console.error('backup:',e);
    return {statusCode:500,body:e.message};
  }
};
