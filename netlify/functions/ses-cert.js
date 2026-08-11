const tls = require('tls');

function pem(der){
  const b64 = der.toString('base64').match(/.{1,64}/g).join('\n');
  return '-----BEGIN CERTIFICATE-----\n' + b64 + '\n-----END CERTIFICATE-----';
}

exports.handler = async function(event){
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  const host=(event.queryStringParameters&&event.queryStringParameters.host)||'hospedajes.ses.mir.es';
  try{
    const chain = await new Promise(function(resolve,reject){
      const s=tls.connect({host:host,port:443,servername:host,rejectUnauthorized:false},function(){
        const out=[];
        let c=s.getPeerCertificate(true);
        const seen={};
        while(c&&c.raw&&!seen[c.fingerprint256]){
          seen[c.fingerprint256]=1;
          out.push({subject:(c.subject&&(c.subject.CN||c.subject.O))||'?',issuer:(c.issuer&&(c.issuer.CN||c.issuer.O))||'?',fingerprint256:c.fingerprint256,valid_to:c.valid_to,pem:pem(c.raw)});
          c=c.issuerCertificate;
        }
        s.end(); resolve(out);
      });
      s.setTimeout(12000,function(){s.destroy();reject(new Error('timeout'));});
      s.on('error',reject);
    });
    return {statusCode:200,headers,body:JSON.stringify({host:host,count:chain.length,chain:chain},null,1)};
  }catch(e){
    return {statusCode:500,headers,body:JSON.stringify({error:e.message})};
  }
};
