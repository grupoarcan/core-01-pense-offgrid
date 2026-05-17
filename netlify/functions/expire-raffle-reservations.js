const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";
const ADMIN_SECRET = process.env.RAFFLE_ADMIN_SECRET || "";
const HEADERS = { "Content-Type":"application/json; charset=utf-8" };
function json(statusCode, body){ return {statusCode, headers:HEADERS, body:JSON.stringify(body)}; }
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
  if(value === null || value === undefined) return {nullValue:null};
  if(typeof value === "boolean") return {booleanValue:value};
  if(typeof value === "number") return Number.isInteger(value) ? {integerValue:String(value)} : {doubleValue:value};
  if(Array.isArray(value)) return {arrayValue:{values:value.map(jsToFirestoreValue)}};
  if(typeof value === "object") return {mapValue:{fields:jsToFirestoreFields(value)}};
  return {stringValue:String(value)};
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
async function patchDoc(path, payload){
  const updateMask = Object.keys(payload).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  return firestoreFetch(`${path}?${updateMask}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({fields:jsToFirestoreFields(payload)}) });
}
async function createDoc(collectionPath, documentId, payload){
  return firestoreFetch(`${collectionPath}?documentId=${encodeURIComponent(documentId)}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({fields:jsToFirestoreFields(payload)}) });
}
async function addAuditLog(type, payload){
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  try{ await createDoc("ecosystem/penseoffgrid/modules/raffles/auditLogs", id, {type, createdAt:new Date().toISOString(), ...payload}); }catch(error){}
}
async function patchBuyer(documentId, payload){ return patchDoc(`ecosystem/penseoffgrid/modules/raffles/buyers/${encodeURIComponent(documentId)}`, payload); }
async function patchLock(documentId, payload){ return patchDoc(`ecosystem/penseoffgrid/modules/raffles/numberLocks/${encodeURIComponent(documentId)}`, payload); }
async function queryCollection(collectionId){
  const body = { structuredQuery:{ from:[{collectionId}], limit:1000 } };
  const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  return result.filter(row => row.document?.name).map(row => ({ id:row.document.name.split("/").pop(), ...firestoreFieldsToJs(row.document.fields || {}) }));
}
function isFinal(status){ return ["paid","pago","approved","aprovado","confirmed","confirmado","cancelled","canceled","cancelado","expired","expirado","refunded","estornado","rejected","rejeitado"].includes(normalize(status)); }
function isPaid(status){ return ["paid","pago","approved","aprovado","confirmed","confirmado"].includes(normalize(status)); }
function isExpired(item, now){
  const expires = item.reservationExpiresAt || item.expiresAt || item.expires_at || "";
  return Boolean(expires && new Date(expires).getTime() < now);
}
exports.handler = async function(event){
  try{
    if(ADMIN_SECRET){
      const provided = event.headers["x-raffle-secret"] || event.queryStringParameters?.secret || "";
      if(provided !== ADMIN_SECRET) return json(401, {ok:false, message:"Não autorizado."});
    }
    const now = Date.now();
    const buyers = await queryCollection("buyers");
    const expiredBuyers = buyers.filter(item => {
      const status = item.paymentStatus || item.reservationStatus || item.status || "pending";
      if(isPaid(status)) return false;
      if(isFinal(status)) return false;
      return isExpired(item, now);
    });
    for(const item of expiredBuyers){
      await patchBuyer(item.id, { paymentStatus:"expired", reservationStatus:"expired", contactStatus:"expired_auto", updatedAt:new Date().toISOString(), notes:"Reserva expirada automaticamente." });
      const lockIds = Array.isArray(item.lockIds) ? item.lockIds : [];
      for(const lockId of lockIds){
        await patchLock(lockId, { status:"expired", paymentStatus:"expired", reservationStatus:"expired", updatedAt:new Date().toISOString(), releaseReason:"buyer_expired" });
      }
    }
    const locks = await queryCollection("numberLocks");
    const expiredLocks = locks.filter(lock => {
      const status = lock.status || lock.paymentStatus || lock.reservationStatus || "pending";
      if(isPaid(status)) return false;
      if(isFinal(status)) return false;
      return isExpired(lock, now);
    });
    for(const lock of expiredLocks){
      await patchLock(lock.id, { status:"expired", paymentStatus:"expired", reservationStatus:"expired", updatedAt:new Date().toISOString(), releaseReason:"lock_expired" });
    }
    await addAuditLog("reservations_expired", { expiredBuyers:expiredBuyers.length, expiredLocks:expiredLocks.length });
    return json(200, {ok:true, expired:expiredBuyers.length, expiredLocks:expiredLocks.length});
  }catch(error){
    console.error("expire-raffle-reservations", error);
    return json(500, {ok:false, message:error.message || "Erro ao expirar reservas."});
  }
};
