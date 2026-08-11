exports.handler = async function(){
  return { statusCode: 410, headers:{'Content-Type':'application/json'}, body: JSON.stringify({error:'Funcion retirada'}) };
};
