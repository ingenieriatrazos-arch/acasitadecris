const zlib = require('zlib');
const https = require('https');

const FNMT_CA = [
`-----BEGIN CERTIFICATE-----
MIIG1jCCBL6gAwIBAgIQNMarBE42mRJRyCULbJTWwDANBgkqhkiG9w0BAQsFADA7
MQswCQYDVQQGEwJFUzERMA8GA1UECgwIRk5NVC1SQ00xGTAXBgNVBAsMEEFDIFJB
SVogRk5NVC1SQ00wHhcNMTMwNjI0MTA1MjU5WhcNMjgwNjI0MTA1MjU5WjBHMQsw
CQYDVQQGEwJFUzERMA8GA1UECgwIRk5NVC1SQ00xJTAjBgNVBAsMHEFDIENvbXBv
bmVudGVzIEluZm9ybcOhdGljb3MwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQCXVx8rdbF7/xY44CaSqzzGo5BhvzA8knxC/3KJYVzTf+CkOvMxMUDub8b0
h38MDujm/RKZhBNOWbKhxF3U61ZVhcR9xOCciuS/soT80m3BByxAKcZsNka0jCA4
XRkglDaAFxCHEZ06MOnvXsSOZDfPYahbQ3VFCVycJuhlHdAwSpmceQwcRYkR6YgX
wTiyzCNGivMKAmRS3dItqDOmDW/nxiDFq/Jd8VWY7GFkwbbAeqYId8FjN8zfvafu
nsB9SLFkUjPPMeqfmC7Bdh7HMxLpaOXROwH201cmlebiPkn0xSFxXFqwhhr6yN8U
QYZ3O/+xdHLrS6DS9+CJUF6d09ijAgMBAAGjggLIMIICxDASBgNVHRMBAf8ECDAG
AQH/AgEAMA4GA1UdDwEB/wQEAwIBBjAdBgNVHQ4EFgQUGfhYLxTWpsybBJgIDUzX
qwCng2UwgZgGCCsGAQUFBwEBBIGLMIGIMEkGCCsGAQUFBzABhj1odHRwOi8vb2Nz
cGZubXRyY21jYS5jZXJ0LmZubXQuZXMvb2NzcGZubXRyY21jYS9PY3NwUmVzcG9u
ZGVyMDsGCCsGAQUFBzAChi9odHRwOi8vd3d3LmNlcnQuZm5tdC5lcy9jZXJ0cy9B
Q1JBSVpGTk1UUkNNLmNydDAfBgNVHSMEGDAWgBT3fcX9xOiaG3dkp/UdoMy/h2Ca
bTCB6wYDVR0gBIHjMIHgMIHdBgRVHSAAMIHUMCkGCCsGAQUFBwIBFh1odHRwOi8v
d3d3LmNlcnQuZm5tdC5lcy9kcGNzLzCBpgYIKwYBBQUHAgIwgZkMgZZTdWpldG8g
YSBsYXMgY29uZGljaW9uZXMgZGUgdXNvIGV4cHVlc3RhcyBlbiBsYSBEZWNsYXJh
Y2nDs24gZGUgUHLDoWN0aWNhcyBkZSBDZXJ0aWZpY2FjacOzbiBkZSBsYSBGTk1U
LVJDTSAoIEMvIEpvcmdlIEp1YW4sIDEwNi0yODAwOS1NYWRyaWQtRXNwYcOxYSkw
gdQGA1UdHwSBzDCByTCBxqCBw6CBwIaBkGxkYXA6Ly9sZGFwZm5tdC5jZXJ0LmZu
bXQuZXMvQ049Q1JMLE9VPUFDJTIwUkFJWiUyMEZOTVQtUkNNLE89Rk5NVC1SQ00s
Qz1FUz9hdXRob3JpdHlSZXZvY2F0aW9uTGlzdDtiaW5hcnk/YmFzZT9vYmplY3Rj
bGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludIYraHR0cDovL3d3dy5jZXJ0LmZubXQu
ZXMvY3Jscy9BUkxGTk1UUkNNLmNybDANBgkqhkiG9w0BAQsFAAOCAgEAo2bsQ2xL
Dcyodieqjd+uy/lfxDw/MbrAq/ZaNFkIlcypUYamOM4vrm5rz8oLjPCoLkJ48P+n
P08Gkcl5Q6q6VFcZLia+U3gfHXrkyqToQlrtViGCGH3xA4u56XtMHGXSdk9vQ0yD
nW5f7bUEkp+uvcKewrOvNcpbIAgD4eU7gdOS0w7BagcFRBgTKBw2s3z73fRZtouJ
g/atmWYtXbBsfNjph+pCh+h5sbSyZUVzO5AemyjpYYYNMWDQrTXq+7O8zIPuPaNE
SjEexuzn+VjHG90RlUK1LygARi+Ir0opD2w6erb/hK8Eea7MFdKQ2ASqNBGJggNo
5vfPVvjHiL+Antmh7mQSKL+4YwFU64d4KK9k0C1mbJethDQFKcjTK1vMvnXFiups
IuyTqwKauo7u2zMKzY4r3VYOW9TpMyLPFIY8pII5GyNzXlL0F4nscOvduTEPEYqx
eNJfpDDPY/DO8WfxgdRTy2W3D/UoAulb+Y+nuzGGCtFQrsSMQX487R+aY0nWot/h
ajef6BcPuxhDfQrg5IafrISVmcJAplb3tXhh0sz7RbYz6jf1bke4eU5fnrTMtGlV
teUL2vjrfUPHW07kBJuaQ7sxORNV3bpHisOnHj+AriQzCn5vINpSHW6hTm7IfRkb
ltu/aQrsMuUhP7HE/v+uXe5CuboV5ubZhHU=
-----END CERTIFICATE-----`,
`-----BEGIN CERTIFICATE-----
MIIFgzCCA2ugAwIBAgIPXZONMGc2yAYdGsdUhGkHMA0GCSqGSIb3DQEBCwUAMDsx
CzAJBgNVBAYTAkVTMREwDwYDVQQKDAhGTk1ULVJDTTEZMBcGA1UECwwQQUMgUkFJ
WiBGTk1ULVJDTTAeFw0wODEwMjkxNTU5NTZaFw0zMDAxMDEwMDAwMDBaMDsxCzAJ
BgNVBAYTAkVTMREwDwYDVQQKDAhGTk1ULVJDTTEZMBcGA1UECwwQQUMgUkFJWiBG
Tk1ULVJDTTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALpxgHpMhm5/
yBNtwMZ9HACXjywMI7sQmkCpGreHiPibVmr75nuOi5KOpyVdWRHbNi63URcfqQgf
BBckWKo3Shjf5TnUV/3XwSyRAZHiItQDwFj8d0fsjz50Q7qsNI1NOHZnjrDIbzAz
WHFctPVrbtQBULgTfmxKo0nRIBnuvMApGGWn3v7v3QqQIecaZ5JCEJhfTzC8PhxF
tBDXaEAUwED653cXeuYLj2VbPNmaUtu1vZ5Gzz3rkQUCwJaydkxNEJY7kvqcfw+Z
374jNUUeAlz+taibmSXaXvMiwzn15Cou08YfxGyqxRxqAQVKL9LFwag0Jl1mpdIC
IfkYtwb1TplvqKtMUejPUBjFd8g5CSxJkjKZqLsXF3mwWsXmo8RZZUc1g16p6DUL
mbvkzSDGm0oGObVo/CK67lWMK07q87Hj/LaZmtVC+nFNCM+HHmpxffnTtOmlcYF7
wk5HlqX2doWjKI/pgG6BU6VtX7hI+cL5NqYuSf+4lsKMB7ObiFj86xsc3i1w4peS
MKGJ47xVqCfWS+2QrYv6YyVZLag13cqXM7zlzced0ezvXg5KkAYmY6252TUtB7p2
ZSysV4999AeU14ECll2jB0nVetBX+RvnU0Z1qrB5QstocQjpYL05ac70r8NWQMet
UqIJ5G+GR4of6ygnXYMgrwTJbFaai0b1AgMBAAGjgYMwgYAwDwYDVR0TAQH/BAUw
AwEB/zAOBgNVHQ8BAf8EBAMCAQYwHQYDVR0OBBYEFPd9xf3E6Jobd2Sn9R2gzL+H
YJptMD4GA1UdIAQ3MDUwMwYEVR0gADArMCkGCCsGAQUFBwIBFh1odHRwOi8vd3d3
LmNlcnQuZm5tdC5lcy9kcGNzLzANBgkqhkiG9w0BAQsFAAOCAgEAB5BK3/MjTvDD
nFFlm5wioooMhfNzKWtN/gHiqQxjAb8EZ6WdmF/9ARP67Jpi6Yb+tmLSbkyU+8B1
RXxlDPiyN8+sD8+Nb/kZ94/sHvJwnvDKuO+3/3Y3dlv2bojzr2IyIpMNOmqOFGYM
LVN0V2Ue1bLdI4E7pWYjJ2cJj+F3qkPNZVEI7VFY/uY5+ctHhKQV8Xa7pO6kO8Rf
77IzlhEYt8llvhjho6Tc+hj507wTmzl6NLrTQfv6MooqtyuGC2mDOL7Nii4LcK2N
JpLuHvUBKwrZ1pebbuCoGRw6IYsMHkCtA+fdZn71uSANA+iW+YJF1DngoABd15jm
fZ5nc8OaKveri6E6FO80vFIOiZiaBECEHX5FaZNXzuvO+FB8TxxuBEOb+dY7Ixjp
6o7RTUaN8Tvkasq6+yO3m/qZASlaWFot4/nUbQ4mrcFuNLwy+AwF+mWj2zs3gyLp
1txyM/1d8iC9djwj2ij3+RvrWWTV3F9yfiD8zYm1kGdNYno/Tq0dwzn+evQoFt9B
9kiABdcPUXmsEKvU7ANm5mqwujGSQkBqvjrTcuFqN1W8rB2Vt2lh8kORdOag0wok
RqEIr9baRRmW1FMdW4R58MD3R++Lj8UGrp1MYp3/RgT408m2ECVAdf4WqslKYIYv
uu8wd+RU4riEmViAqhOLUTpPSPaLtrM=
-----END CERTIFICATE-----`
];
const { reservasStore, sendEmail, fmtES } = require('./ical-lib');

const NAC = { 'española':'ESP','espanola':'ESP','francesa':'FRA','portuguesa':'PRT','alemana':'DEU','italiana':'ITA','británica':'GBR','britanica':'GBR' };

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function iso3(nac){
  const s=String(nac||'').trim();
  if(/^[A-Za-z]{3}$/.test(s)) return s.toUpperCase();
  return NAC[s.toLowerCase()] || 'ESP';
}

function tipoDoc(num){
  const n=String(num||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(/^\d{8}[A-Z]$/.test(n)) return 'NIF';
  if(/^[XYZ]\d{7}[A-Z]$/.test(n)) return 'NIE';
  return 'PAS';
}

const MESES={enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'};
function parseFecha(str){
  const s=String(str||'').trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){const y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');}
  const p=s.toLowerCase().split(' de ');
  if(p.length===3&&MESES[p[1].trim()]) return p[2].trim()+'-'+MESES[p[1].trim()]+'-'+p[0].trim().padStart(2,'0');
  return null;
}

const CRC_T=(function(){const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC_T[(c^buf[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

function makeZip(name, data){
  const nameB=Buffer.from(name), crc=crc32(data);
  const defl=zlib.deflateRawSync(data);
  const u16=v=>{const b=Buffer.alloc(2);b.writeUInt16LE(v);return b;};
  const u32=v=>{const b=Buffer.alloc(4);b.writeUInt32LE(v>>>0);return b;};
  const lfh=Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(8),u16(0),u16(0),u32(crc),u32(defl.length),u32(data.length),u16(nameB.length),u16(0),nameB,defl]);
  const cdh=Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(8),u16(0),u16(0),u32(crc),u32(defl.length),u32(data.length),u16(nameB.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(0),nameB]);
  const eocd=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(1),u16(1),u32(cdh.length),u32(lfh.length),u16(0)]);
  return Buffer.concat([lfh,cdh,eocd]);
}

function esMenor(nac, refIso){
  const f=parseFecha(nac); if(!f) return false;
  const ref=new Date((refIso||new Date().toISOString().slice(0,10))+'T00:00:00Z');
  const n=new Date(f+'T00:00:00Z');
  let edad=ref.getUTCFullYear()-n.getUTCFullYear();
  const m=ref.getUTCMonth()-n.getUTCMonth();
  if(m<0||(m===0&&ref.getUTCDate()<n.getUTCDate()))edad--;
  return edad<18;
}

function personaXml(p, rol, defaults){
  const doc=String(p.dni||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const tdRaw=String(p.tipoDoc||'').toUpperCase();
  const td=(tdRaw==='NIF'||tdRaw==='NIE'||tdRaw==='PAS'||tdRaw==='OTRO')?tdRaw:tipoDoc(doc);
  const ap=String(p.apellidos||'').trim().split(/\s+/);
  const a1=p.apellido1||ap[0]||'';
  const a2=p.apellido2||ap.slice(1).join(' ');
  let x='<persona><rol>'+rol+'</rol>';
  x+='<nombre>'+esc(p.nombre)+'</nombre><apellido1>'+esc(a1)+'</apellido1>';
  if(a2)x+='<apellido2>'+esc(a2)+'</apellido2>';
  if(doc){x+='<tipoDocumento>'+td+'</tipoDocumento><numeroDocumento>'+esc(doc)+'</numeroDocumento>';
    if(p.soporte&&(td==='NIF'||td==='NIE'))x+='<soporteDocumento>'+esc(String(p.soporte).toUpperCase().replace(/[^A-Z0-9]/g,''))+'</soporteDocumento>';}
  x+='<fechaNacimiento>'+parseFecha(p.nacimiento)+'</fechaNacimiento>';
  x+='<nacionalidad>'+iso3(p.nacionalidad)+'</nacionalidad>';
  var sx=String(p.sexo||'').toUpperCase();
  if(sx==='H'||sx==='M'||sx==='O')x+='<sexo>'+sx+'</sexo>';
  x+='<direccion><direccion>'+esc(p.direccion||defaults.direccion)+'</direccion><codigoPostal>'+esc(p.cp||defaults.cp)+'</codigoPostal><pais>'+iso3(p.pais||defaults.pais)+'</pais></direccion>';
  var tel=p.telefono||defaults.telefono;
  if(tel)x+='<telefono>'+esc(tel)+'</telefono>';
  var mail=p.email||(tel?'':defaults.email);
  if(mail)x+='<correo>'+esc(mail)+'</correo>';
  if(p.parentesco)x+='<parentesco>'+esc(p.parentesco)+'</parentesco>';
  x+='</persona>';
  return x;
}

async function soapCall(bodyInner){
  const user=process.env.SES_USER||process.env.SES_ARRENDADOR;
  const pass=process.env.SES_PASS;
  if(!user||!pass) throw new Error('Faltan credenciales SES (SES_USER/SES_ARRENDADOR y SES_PASS)');
  const base=process.env.SES_TEST==='1'?'https://hospedajes.pre-ses.mir.es':'https://hospedajes.ses.mir.es';
  const env='<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="http://www.soap.servicios.hospedajes.mir.es/comunicacion"><soapenv:Header/><soapenv:Body>'+bodyInner+'</soapenv:Body></soapenv:Envelope>';
  const u=new URL(base+'/hospedajes-web/ws/v1/comunicacion');
  return await new Promise(function(resolve,reject){
    const req=https.request({
      host:u.hostname, port:443, path:u.pathname, method:'POST', ca:FNMT_CA, timeout:20000,
      headers:{'Content-Type':'text/xml; charset=utf-8','SOAPAction':'','Authorization':'Basic '+Buffer.from(user+':'+pass).toString('base64'),'Content-Length':Buffer.byteLength(env)}
    },function(res){
      let data='';
      res.setEncoding('utf8');
      res.on('data',function(c){data+=c;});
      res.on('end',function(){resolve({status:res.statusCode,text:data});});
    });
    req.on('timeout',function(){req.destroy(new Error('timeout'));});
    req.on('error',function(e){reject(new Error('No se pudo conectar con SES ('+base+'): '+e.message+(e.code?' | '+e.code:'')));});
    req.write(env); req.end();
  });
}

function tag(t,xml){const m=xml.match(new RegExp('<(?:[a-zA-Z0-9]+:)?'+t+'>([\\s\\S]*?)</(?:[a-zA-Z0-9]+:)?'+t+'>'));return m?m[1].trim():null;}

exports.handler = async function(event){
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers,body:''};

  try{
    if(event.httpMethod==='GET'){
      const cat=event.queryStringParameters&&event.queryStringParameters.catalogo;
      if(!cat)return{statusCode:400,headers,body:JSON.stringify({error:'usa ?catalogo=TIPO_PAGO|TIPO_DOCUMENTO|SEXO|TIPO_PARENTESCO'})};
      const r=await soapCall('<com:catalogoRequest><peticion><catalogo>'+esc(cat)+'</catalogo></peticion></com:catalogoRequest>');
      return{statusCode:200,headers,body:JSON.stringify({status:r.status,respuesta:r.text.slice(0,4000)})};
    }

    const {reserva,titular,acompanantes,menores}=JSON.parse(event.body);
    const ci=parseFecha(reserva&&reserva.checkin), co=parseFecha(reserva&&reserva.checkout);
    if(!ci||!co)return{statusCode:400,headers,body:JSON.stringify({error:'Fechas de reserva no validas'})};
    if(!titular||!titular.nombre)return{statusCode:400,headers,body:JSON.stringify({error:'Falta titular'})};

    const defaults={direccion:titular.direccion,cp:titular.cp||'',pais:titular.pais||'ESP',telefono:titular.telefono||'',email:titular.email||''};
    const mens=(menores||[]).filter(function(m){return m&&m.nombre;});
    const tit=Object.assign({},titular);
    if(mens.length){ tit.parentesco = mens[0].parentesco || 'PM'; }
    const personas=[personaXml(tit,'TI',defaults)]
      .concat((acompanantes||[]).map(function(a){return personaXml(a,'VI',defaults);}))
      .concat(mens.map(function(m){ var mm=Object.assign({},m); delete mm.parentesco; return personaXml(mm,'VI',defaults); }));
    const nPers=1+(acompanantes||[]).length+mens.length;
    const ref='WEB-'+ci.replace(/-/g,'')+'-'+Date.now().toString(36).toUpperCase();
    const hoy=new Date().toISOString().slice(0,10);
    const tipoPago=process.env.SES_TIPOPAGO||'EFECT';

    let xml='<?xml version="1.0" encoding="UTF-8"?>';
    xml+='<alt:peticion xmlns:alt="http://www.neg.hospedajes.mir.es/altaParteHospedaje"><solicitud>';
    xml+='<codigoEstablecimiento>'+esc(process.env.SES_ESTABLECIMIENTO||'')+'</codigoEstablecimiento>';
    xml+='<comunicacion><contrato>';
    xml+='<referencia>'+ref+'</referencia><fechaContrato>'+hoy+'</fechaContrato>';
    xml+='<fechaEntrada>'+ci+'T16:00:00</fechaEntrada><fechaSalida>'+co+'T12:00:00</fechaSalida>';
    xml+='<numPersonas>'+nPers+'</numPersonas><numHabitaciones>2</numHabitaciones><internet>true</internet>';
    xml+='<pago><tipoPago>'+tipoPago+'</tipoPago></pago>';
    xml+='</contrato>'+personas.join('')+'</comunicacion></solicitud></alt:peticion>';

    const zip=makeZip('parte.xml',Buffer.from(xml,'utf8'));
    const b64=zip.toString('base64');
    const cab='<cabecera><codigoArrendador>'+esc(process.env.SES_ARRENDADOR||'')+'</codigoArrendador><aplicacion>CasinaWeb</aplicacion><tipoOperacion>A</tipoOperacion><tipoComunicacion>PV</tipoComunicacion></cabecera>';
    const r=await soapCall('<com:comunicacionRequest><peticion>'+cab+'<solicitud>'+b64+'</solicitud></peticion></com:comunicacionRequest>');

    const codigo=tag('codigo',r.text), desc=tag('descripcion',r.text), lote=tag('lote',r.text);
    const ok=r.status===200&&codigo==='0';

    try{
      const store=reservasStore();
      const log=await store.get('partes',{type:'json'})||{items:[]};
      log.items.push({fecha:new Date().toISOString(),ref:ref,entrada:ci,salida:co,personas:nPers,ok:ok,codigo:codigo,desc:desc,lote:lote,http:r.status});
      await store.setJSON('partes',log);
    }catch(e){console.error(e);}

    const subj=ok?('Parte de viajeros comunicado a Interior: '+fmtES(ci)+' ('+nPers+' pers.)')
                 :('ERROR al comunicar parte de viajeros: '+fmtES(ci));
    const html='<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
      +'<div style="background:'+(ok?'#0F6E56':'#a32d2d')+';color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;font-weight:700">SES.Hospedajes - '+(ok?'Parte comunicado':'Error en el parte')+'</div>'
      +'<div style="border:1px solid #d0e8f5;border-top:none;border-radius:0 0 10px 10px;padding:18px;font-size:14px;color:#1a3a4a">'
      +'<p><b>Estancia:</b> '+fmtES(ci)+' a '+fmtES(co)+' &middot; <b>Personas:</b> '+nPers+'</p>'
      +'<p><b>Titular:</b> '+esc(titular.nombre)+' '+esc(titular.apellidos||'')+'</p>'
      +'<p><b>Referencia:</b> '+ref+(lote?'<br><b>Lote SES:</b> '+lote:'')+'</p>'
      +'<p><b>Respuesta:</b> HTTP '+r.status+' &middot; codigo '+(codigo||'?')+' &middot; '+esc(desc||'')+'</p>'
      +(ok?'':'<p style="color:#a32d2d"><b>Debes comunicar este parte manualmente en la sede de Hospedajes.</b></p>')
      +'</div></div>';
    try{await sendEmail(subj,html);}catch(e){console.error(e);}

    return{statusCode:200,headers,body:JSON.stringify({ok:ok,codigo:codigo,desc:desc,lote:lote})};
  }catch(error){
    console.error(error);
    try{await sendEmail('ERROR al comunicar parte de viajeros','<p>'+esc(error.message)+'</p><p>Comunica el parte manualmente en la sede.</p>');}catch(e){}
    return{statusCode:500,headers,body:JSON.stringify({error:error.message})};
  }
};
