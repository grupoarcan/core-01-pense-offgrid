const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

const HEADERS = { "Content-Type":"application/json; charset=utf-8" };
function json(statusCode, body){ return { statusCode, headers:HEADERS, body:JSON.stringify(body) }; }
function pad(num){ return String(Number(num)).padStart(3,"0"); }
function parseNumbers(value){ if(Array.isArray(value)) return value.map(Number).filter(Number.isFinite); return String(value || "").split(/[^0-9]+/).map(Number).filter(Number.isFinite); }
function normalize(value=""){ return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }

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
function firestoreFieldsToJs(fields={}){ const out={}; for(const [k,v] of Object.entries(fields)) out[k]=firestoreValueToJs(v); return out; }
function jsToFirestoreValue(value){
  if(value === null || value === undefined) return { nullValue:null };
  if(typeof value === "boolean") return { booleanValue:value };
  if(typeof value === "number") return Number.isInteger(value) ? { integerValue:String(value) } : { doubleValue:value };
  if(Array.isArray(value)) return { arrayValue:{ values:value.map(jsToFirestoreValue) } };
  if(typeof value === "object") return { mapValue:{ fields:jsToFirestoreFields(value) } };
  return { stringValue:String(value) };
}
function jsToFirestoreFields(obj={}){ const fields={}; for(const [k,v] of Object.entries(obj)) fields[k]=jsToFirestoreValue(v); return fields; }
async function firestoreFetch(path, options={}){
  const glue = path.includes("?") ? "&" : "?";
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}${glue}key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null; try{ data = text ? JSON.parse(text) : null; }catch(e){ data = {raw:text}; }
  if(!res.ok){ const err = new Error(data?.error?.message || res.statusText || "Erro Firestore"); err.status = res.status; throw err; }
  return data;
}
async function createDoc(collectionPath, documentId, payload){
  return firestoreFetch(`${collectionPath}?documentId=${encodeURIComponent(documentId)}`, {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({fields:jsToFirestoreFields(payload)})
  });
}
async function patchDoc(path, payload){
  const updateMask = Object.keys(payload).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  return firestoreFetch(`${path}?${updateMask}`, {
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({fields:jsToFirestoreFields(payload)})
  });
}
async function patchBuyer(documentId, payload){ return patchDoc(`ecosystem/penseoffgrid/modules/raffles/buyers/${encodeURIComponent(documentId)}`, payload); }
async function addAuditLog(type, payload){
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  try{ await createDoc("ecosystem/penseoffgrid/modules/raffles/auditLogs", id, {type, createdAt:new Date().toISOString(), ...payload}); }catch(error){ console.warn("audit", error.message); }
}
async function findBuyerByOrderCode(orderCode){
  const body = { structuredQuery:{ from:[{collectionId:"buyers"}], where:{ fieldFilter:{ field:{fieldPath:"orderCode"}, op:"EQUAL", value:{stringValue:String(orderCode)} } }, limit:1 } };
  const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const row = result.find(r => r.document?.name);
  if(!row) return null;
  return { id:row.document.name.split("/").pop(), ...firestoreFieldsToJs(row.document.fields || {}) };
}
async function getPayment(paymentId){
  if(!MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN não configurado.");
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers:{ Authorization:`Bearer ${MP_ACCESS_TOKEN}` } });
  const data = await res.json();
  if(!res.ok) throw new Error(data?.message || data?.error || "Não foi possível consultar pagamento.");
  return data;
}
function mapPaymentStatus(mpStatus){
  const status = String(mpStatus || "").toLowerCase();
  if(status === "approved") return { paymentStatus:"paid", reservationStatus:"confirmed", contactStatus:"paid_auto", lockStatus:"paid" };
  if(["cancelled","rejected","refunded","charged_back"].includes(status)) return { paymentStatus:"cancelled", reservationStatus:"cancelled", contactStatus:"payment_failed", lockStatus:"cancelled" };
  if(["pending","in_process","authorized"].includes(status)) return { paymentStatus:"pending", reservationStatus:"reserved", contactStatus:"payment_pending", lockStatus:"pending" };
  return { paymentStatus:"pending", reservationStatus:"reserved", contactStatus:"payment_update", lockStatus:"pending" };
}
function lockId(scope, number){ return `${String(scope || "rifa").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0,80)}_${pad(number)}`; }
async function upsertLock(id, payload){
  try{ await patchDoc(`ecosystem/penseoffgrid/modules/raffles/numberLocks/${encodeURIComponent(id)}`, payload); }
  catch(error){
    if(error.status === 404){
      try{ await createDoc("ecosystem/penseoffgrid/modules/raffles/numberLocks", id, payload); }catch(e){ console.warn("lock create", id, e.message); }
    }else{ console.warn("lock patch", id, error.message); }
  }
}
async function syncLocksFromBuyer(buyer, mapped, payment){
  const numbers = parseNumbers(buyer.numbers || payment.metadata?.numbers || "");
  const scope = buyer.raffleSlug || payment.metadata?.raffle_slug || buyer.raffleId || payment.metadata?.raffle_id || "rifa";
  for(const n of numbers){
    await upsertLock(lockId(scope, n), {
      raffleId: String(buyer.raffleId || payment.metadata?.raffle_id || ""),
      raffleSlug: String(buyer.raffleSlug || payment.metadata?.raffle_slug || ""),
      raffleTitle: String(buyer.raffleTitle || ""),
      number: pad(n),
      orderCode: String(buyer.orderCode || payment.external_reference || ""),
      buyerName: String(buyer.name || ""),
      buyerWhatsapp: String(buyer.whatsapp || ""),
      buyerEmail: String(buyer.email || ""),
      status: mapped.lockStatus,
      paymentStatus: mapped.paymentStatus,
      reservationStatus: mapped.reservationStatus,
      mercadoPagoPaymentId: String(payment.id || ""),
      mercadoPagoStatus: String(payment.status || ""),
      updatedAt: new Date().toISOString(),
      paidAt: mapped.paymentStatus === "paid" ? new Date().toISOString() : (buyer.paidAt || ""),
      expiresAt: buyer.reservationExpiresAt || buyer.expiresAt || ""
    });
  }
}
exports.handler = async function(event){
  try{
    let payload = {};
    try{ payload = event.body ? JSON.parse(event.body) : {}; }catch(e){ payload = {}; }
    const qs = event.queryStringParameters || {};
    const paymentId = payload?.data?.id || payload?.id || qs["data.id"] || qs.id;
    const topic = payload?.type || payload?.topic || qs.type || qs.topic;
    if(!paymentId || !String(topic).includes("payment")) return json(200, {ok:true, ignored:true});

    const payment = await getPayment(paymentId);
    const metadata = payment.metadata || {};
    const orderCode = metadata.order_code || payment.external_reference;
    if(!orderCode) return json(200, {ok:false, message:"Pagamento sem referência externa."});

    const buyer = await findBuyerByOrderCode(orderCode);
    const buyerId = metadata.buyer_id || buyer?.id || orderCode;
    const mapped = mapPaymentStatus(payment.status);
    const paidAt = payment.date_approved ? new Date(payment.date_approved).toISOString().slice(0,16) : new Date().toISOString().slice(0,16);
    const updatePayload = {
      paymentStatus: mapped.paymentStatus,
      reservationStatus: mapped.reservationStatus,
      contactStatus: mapped.contactStatus,
      mercadoPagoPaymentId: String(payment.id || paymentId),
      mercadoPagoStatus: String(payment.status || ""),
      mercadoPagoStatusDetail: String(payment.status_detail || ""),
      mercadoPagoPaymentMethod: String(payment.payment_method_id || payment.payment_type_id || ""),
      paidAt: mapped.paymentStatus === "paid" ? paidAt : (buyer?.paidAt || ""),
      updatedAt: new Date().toISOString(),
      notes: mapped.paymentStatus === "paid" ? "Pagamento aprovado automaticamente pelo webhook Mercado Pago." : `Atualização automática Mercado Pago: ${payment.status || "sem status"}.`
    };
    await patchBuyer(buyerId, updatePayload);
    if(buyer) await syncLocksFromBuyer({...buyer, id:buyerId}, mapped, payment);
    await addAuditLog("payment_webhook", { orderCode, buyerId, mercadoPagoPaymentId:String(payment.id || paymentId), status:String(payment.status || ""), mappedStatus:mapped.paymentStatus });
    return json(200, {ok:true, orderCode, buyerId, status:payment.status});
  }catch(error){
    console.error("mp-webhook", error);
    await addAuditLog("payment_webhook_error", { message:error.message || "Erro no webhook" });
    return json(200, {ok:false, message:error.message || "Erro no webhook"});
  }
};
