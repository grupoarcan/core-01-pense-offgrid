const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(statusCode, body){ return { statusCode, headers:CORS, body: JSON.stringify(body) }; }
function pad(num){ return String(Number(num)).padStart(3,"0"); }
function parseNumbers(value){
  if(Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  return String(value || "").split(/[^0-9]+/).map(Number).filter(Number.isFinite);
}
function normalize(value){
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "_");
}
function firestoreValueToJs(value){
  if(!value || typeof value !== "object") return "";
  if("stringValue" in value) return value.stringValue;
  if("integerValue" in value) return Number(value.integerValue);
  if("doubleValue" in value) return Number(value.doubleValue);
  if("booleanValue" in value) return Boolean(value.booleanValue);
  if("timestampValue" in value) return value.timestampValue;
  if("nullValue" in value) return null;
  if("arrayValue" in value) return (value.arrayValue.values || []).map(firestoreValueToJs);
  if("mapValue" in value) return firestoreFieldsToJs(value.mapValue.fields || {});
  return "";
}
function firestoreFieldsToJs(fields={}){
  const output = {};
  for(const [key,value] of Object.entries(fields)) output[key] = firestoreValueToJs(value);
  return output;
}
async function firestoreFetch(path, options={}){
  const glue = path.includes("?") ? "&" : "?";
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}${glue}key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null; }catch(error){ data = { raw:text }; }
  if(!response.ok) throw new Error(data?.error?.message || response.statusText || "Erro Firestore");
  return data;
}
async function getRaffleByIdOrSlug(key){
  if(!key) return null;
  const safeKey = encodeURIComponent(String(key));
  try{
    const doc = await firestoreFetch(`ecosystem/penseoffgrid/modules/raffles/items/${safeKey}`);
    return { id:safeKey, ...firestoreFieldsToJs(doc.fields || {}) };
  }catch(error){}
  const body = { structuredQuery:{ from:[{collectionId:"items"}], where:{ fieldFilter:{ field:{fieldPath:"slug"}, op:"EQUAL", value:{stringValue:String(key)} } }, limit:1 } };
  const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const row = result.find(item => item.document?.name);
  if(!row) return null;
  const id = row.document.name.split("/").pop();
  return { id, ...firestoreFieldsToJs(row.document.fields || {}) };
}
async function getRaffleBuyers(raffle){
  const keys = Array.from(new Set([raffle.id, raffle.slug, raffle.title, raffle.headline].map(v => String(v || "").trim()).filter(Boolean)));
  const all = [];
  for(const field of ["raffleId", "raffleSlug", "raffle", "raffleKey", "campaignSlug", "campaignId", "raffleTitle"]){
    for(const key of keys){
      const body = { structuredQuery:{ from:[{collectionId:"buyers"}], where:{ fieldFilter:{ field:{fieldPath:field}, op:"EQUAL", value:{stringValue:key} } }, limit:1000 } };
      try{
        const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        result.filter(r => r.document?.name).forEach(r => {
          const id = r.document.name.split("/").pop();
          if(!all.some(x => x.id === id)) all.push({ id, ...firestoreFieldsToJs(r.document.fields || {}) });
        });
      }catch(error){}
    }
  }
  return all;
}
async function getRaffleLocks(raffle){
  const keys = Array.from(new Set([raffle.id, raffle.slug, raffle.title, raffle.headline].map(v => String(v || "").trim()).filter(Boolean)));
  const all = [];
  for(const field of ["raffleId", "raffleSlug", "raffleTitle"]){
    for(const key of keys){
      const body = { structuredQuery:{ from:[{collectionId:"numberLocks"}], where:{ fieldFilter:{ field:{fieldPath:field}, op:"EQUAL", value:{stringValue:key} } }, limit:1000 } };
      try{
        const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        result.filter(r => r.document?.name).forEach(r => {
          const id = r.document.name.split("/").pop();
          if(!all.some(x => x.id === id)) all.push({ id, ...firestoreFieldsToJs(r.document.fields || {}) });
        });
      }catch(error){}
    }
  }
  return all;
}
function lockStatus(lock){ return normalize(lock.status || lock.paymentStatus || lock.reservationStatus || "pending"); }
function lockNumber(lock){ return Number(lock.number || lock.numero || lock.ticket || lock.id?.split("_").pop()); }
function applyLocksToSets(sets, locks=[]){
  const now = Date.now();
  for(const lock of locks){
    const n = lockNumber(lock);
    if(!Number.isFinite(n) || n <= 0) continue;
    const status = lockStatus(lock);
    if(["cancelled","canceled","cancelado","expired","expirado","refunded","rejected","rejeitado"].includes(status)) continue;
    const expires = lock.expiresAt || lock.reservationExpiresAt || "";
    const expired = expires ? new Date(expires).getTime() < now : false;
    if(["paid","pago","approved","aprovado","confirmed","confirmado"].includes(status)){
      sets.paid.add(n);
      sets.unavailable.add(n);
    }else if(!expired && expires){
      sets.pending.add(n);
      sets.unavailable.add(n);
    }
  }
  return sets;
}

function buyerStatuses(buyer){
  return [buyer.paymentStatus, buyer.reservationStatus, buyer.status, buyer.state, buyer.situation, buyer.payment?.status, buyer.mercadoPago?.status, buyer.mpStatus].map(normalize).filter(Boolean);
}
function buyerNumbers(buyer){
  return parseNumbers(buyer.numbers ?? buyer.selectedNumbers ?? buyer.tickets ?? buyer.ticketNumbers ?? buyer.number ?? buyer.numero ?? buyer.numeros ?? []);
}
function isCancelled(buyer){
  return buyerStatuses(buyer).some(s => ["cancelled","canceled","cancelado","cancelada","refunded","estornado","expired","expirado","expirada","rejected","rejeitado","rejeitada","failure","failed","falhou","erro"].includes(s));
}
function isPaid(buyer){
  return buyerStatuses(buyer).some(s => ["paid","pago","paga","approved","aprovado","aprovada","confirmed","confirmado","confirmada","payment_approved","pagamento_aprovado"].includes(s));
}
function isPending(buyer){
  const statuses = buyerStatuses(buyer);
  if(!statuses.length) return true;
  return statuses.some(s => ["pending","pendente","reserved","reservado","reservada","pre_reserva","pre_reservado","pre_reservada","in_process","processando","waiting","aguardando"].includes(s));
}
function unavailableNumbers(raffle, buyers=[]){
  const paid = new Set();
  const pending = new Set();
  const unavailable = new Set(parseNumbers(raffle.soldNumbers || []));
  const now = Date.now();
  const blockPending = raffle.blockBeforePayment !== false && raffle.blockNumbersBeforePayment !== false;
  for(const buyer of buyers){
    if(isCancelled(buyer)) continue;
    const nums = buyerNumbers(buyer);
    const expires = buyer.reservationExpiresAt || buyer.expiresAt || buyer.expires_at || "";
    const expired = expires ? new Date(expires).getTime() < now : false;
    if(isPaid(buyer)){
      nums.forEach(n => { paid.add(n); unavailable.add(n); });
    }else if(!expired && blockPending && isPending(buyer)){
      nums.forEach(n => { pending.add(n); unavailable.add(n); });
    }
  }
  return { paid, pending, unavailable };
}

exports.handler = async function(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:204, headers:CORS, body:"" };
  if(event.httpMethod !== "GET") return json(405, {ok:false, message:"Método não permitido."});
  try{
    const params = new URLSearchParams(event.rawQuery || "");
    const key = params.get("r") || params.get("rifa") || params.get("raffle") || "";
    const raffle = await getRaffleByIdOrSlug(key);
    if(!raffle) return json(404, {ok:false, message:"Rifa não encontrada."});
    const buyers = await getRaffleBuyers(raffle);
    const locks = await getRaffleLocks(raffle);
    const sets = applyLocksToSets(unavailableNumbers(raffle, buyers), locks);
    return json(200, {
      ok:true,
      raffleId: raffle.id,
      raffleSlug: raffle.slug || raffle.id,
      unavailableNumbers: Array.from(sets.unavailable).sort((a,b)=>a-b),
      paidNumbers: Array.from(sets.paid).sort((a,b)=>a-b),
      pendingNumbers: Array.from(sets.pending).sort((a,b)=>a-b),
      lockCount: locks.length,
      buyers: buyers.map(b => ({
        id:b.id,
        name:b.name || b.customer?.name || "Participante",
        whatsapp:b.whatsapp || b.customer?.whatsapp || "",
        city:b.city || b.customer?.city || "",
        state:b.state || b.uf || b.customer?.state || "",
        numbers: buyerNumbers(b).map(pad).join(", "),
        paymentStatus:b.paymentStatus || b.status || "pending",
        reservationStatus:b.reservationStatus || "reserved"
      }))
    });
  }catch(error){
    return json(500, {ok:false, message:error.message || "Falha ao consultar status da rifa."});
  }
};
