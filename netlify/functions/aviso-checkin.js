const { reservasStore, ensureFreshExternal, sendEmail, fmtES, todayMadrid } = require('./ical-lib');

function addDaysISO(iso,n){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function cleanPhone(p){var c=String(p||'').replace(/[^0-9+]/g,'');if(c.charAt(0)==='+')c=c.slice(1);if(c.length===9)c='34'+c;return c;}

exports.handler = async function(){
  try{
    const store = reservasStore();
    const data = await store.get('ocupados',{type:'json'}) || {};
    let ext = {booking:[],airbnb:[]};
    try{ ext = await ensureFreshExternal(store, 30); }catch(e){ console.error(e); }
    const partes = (await store.get('partes',{type:'json'})) || {items:[]};
    const checkins = (await store.get('checkins',{type:'json'})) || [];

    const hoy = todayMadrid();
    const objetivo = addDaysISO(hoy,2);

    const llegadas = [];
    (data.busyRanges||[]).forEach(function(r){ if(r.from===objetivo) llegadas.push({r:r,src:'Manual'}); });
    (ext.booking||[]).forEach(function(r){ if(r.from===objetivo) llegadas.push({r:r,src:'Booking'}); });
    (ext.airbnb||[]).forEach(function(r){ if(r.from===objetivo) llegadas.push({r:r,src:'Airbnb'}); });

    if(!llegadas.length) return {statusCode:200,body:'sin llegadas el '+objetivo};

    const pendientes = llegadas.filter(function(l){
      const hayParte = (partes.items||[]).some(function(p){ return p.ok && p.entrada<=l.r.to && p.salida>=l.r.from; });
      const hayCheckin = checkins.some(function(c){ return c.completed && String(c.checkin||'').indexOf(l.r.from)>=0; });
      return !hayParte && !hayCheckin;
    });

    if(!pendientes.length) return {statusCode:200,body:'todas con check-in'};

    const notas = data.notes||[];
    const filas = pendientes.map(function(l){
      const n = notas.find(function(x){ return !(x.to<l.r.from||x.from>l.r.to); });
      const tel = n && n.phone ? cleanPhone(n.phone) : '';
      const msg = encodeURIComponent('Hola'+(n&&n.note?' '+String(n.note).split(',')[0]:'')+', soy Roberto de A Casina de Cris. Para poder registrar vuestra entrada necesito que completeis el check-in online antes de llegar: https://acasitadecris.com/checkin.html Gracias!');
      return '<li style="margin-bottom:10px"><b>'+fmtES(l.r.from)+' &rarr; '+fmtES(l.r.to)+'</b> ('+l.src+')'
        + (n&&n.note?' &middot; '+esc(n.note):'')
        + (tel?' &middot; <a href="https://wa.me/'+tel+'?text='+msg+'">Enviar WhatsApp</a>':' &middot; <i>sin telefono anotado</i>')
        + '</li>';
    }).join('');

    const html='<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
      +'<div style="background:#b07010;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-size:16px;font-weight:700">Check-in pendiente &middot; llegada en 2 dias</div>'
      +'<div style="border:1px solid #d0e8f5;border-top:none;border-radius:0 0 10px 10px;padding:20px;font-size:14px;color:#1a3a4a">'
      +'<p>Estas reservas entran el <b>'+fmtES(objetivo)+'</b> y todavia no han completado el check-in online:</p>'
      +'<ul>'+filas+'</ul>'
      +'<p style="font-size:12px;color:#5a8a9a">Recuerda: el parte de viajeros debe comunicarse a Interior dentro de las 24 h desde la llegada. Enlace del check-in: <a href="https://acasitadecris.com/checkin.html">acasitadecris.com/checkin.html</a></p>'
      +'</div></div>';

    await sendEmail('Check-in pendiente: llegada el '+fmtES(objetivo)+' ('+pendientes.length+')', html);
    return {statusCode:200,body:'aviso enviado: '+pendientes.length};
  }catch(e){
    console.error('aviso-checkin:',e);
    return {statusCode:500,body:e.message};
  }
};
