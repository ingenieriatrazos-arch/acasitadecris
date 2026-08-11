const tls = require('tls');

function pem(der){
  const b64 = der.toString('base64').match(/.{1,64}/g).join('\n');
  return '-----BEGIN CERTIFICATE-----\n' + b64 + '\n-----END CERTIFICATE-----';
}

exports.handler = async function(event){
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  const q=event.queryStringParameters||{};

  if(q.ca){
    try{
      const res=await fetch(q.ca);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const buf=Buffer.from(await res.arrayBuffer());
      const txt=buf.toString('utf8');
      const out = txt.indexOf('-----BEGIN CERTIFICATE-----')>=0 ? txt.trim() : pem(buf);
      return {statusCode:200,headers,body:JSON.stringify({url:q.ca,bytes:buf.length,pem:out})};
    }catch(e){
      return {statusCode:500,headers,body:JSON.stringify({error:e.message,cause:(e.cause&&(e.cause.code||e.cause.message))||''})};
    }
  }

  const host=q.host||'hospedajes.ses.mir.es';
  try{
    const data = await new Promise(function(resolve,reject){
      const s=tls.connect({host:host,port:443,servername:host,rejectUnauthorized:false},function(){
        const out=[];
        let c=s.getPeerCertificate(true);
        const seen={};
        let aia=null;
        while(c&&c.raw&&!seen[c.fingerprint256]){
          seen[c.fingerprint256]=1;
          if(!aia&&c.infoAccess)aia=c.infoAccess;
          out.push({subjectCN:(c.subject&&c.subject.CN)||'?',issuerCN:(c.issuer&&c.issuer.CN)||'?',issuerO:(c.issuer&&c.issuer.O)||'?',fingerprint256:c.fingerprint256,valid_to:c.valid_to,pem:pem(c.raw)});
          c=c.issuerCertificate;
        }
        s.end(); resolve({chain:out,aia:aia});
      });
      s.setTimeout(12000,function(){s.destroy();reject(new Error('timeout'));});
      s.on('error',reject);
    });
    return {statusCode:200,headers,body:JSON.stringify({host:host,count:data.chain.length,aia:data.aia,chain:data.chain},null,1)};
  }catch(e){
    return {statusCode:500,headers,body:JSON.stringify({error:e.message})};
  }
};
