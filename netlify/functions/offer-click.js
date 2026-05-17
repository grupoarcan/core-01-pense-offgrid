const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(statusCode, body){ return { statusCode, headers:CORS, body: JSON.stringify(body) }; }
function clean(value="", max=240){ return String(value || "").trim().slice(0,max); }
function docId(){ return `click_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
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
  let data = null;
  try{ data = text ? JSON.parse(text) : null; }catch(error){ data = {raw:text}; }
  if(!res.ok) throw new Error(data?.error?.message || res.statusText || "Erro Firestore");
  return data;
}
async function getOfferByIdOrSlug(key){
  if(!key) return null;
  const safe = encodeURIComponent(String(key));
  try{
    const doc = await firestoreFetch(`ecosystem/penseoffgrid/modules/offers/items/${safe}`);
    return { id:safe, ...firestoreFieldsToJs(doc.fields || {}) };
  }catch(error){}
  const body = { structuredQuery:{ from:[{collectionId:"items"}], where:{ fieldFilter:{ field:{fieldPath:"slug"}, op:"EQUAL", value:{stringValue:String(key)} } }, limit:1 } };
  const result = await firestoreFetch("ecosystem/penseoffgrid/modules/offers:runQuery", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
  const row = result.find(r => r.document?.name);
  if(!row) return null;
  return { id:row.document.name.split("/").pop(), ...firestoreFieldsToJs(row.document.fields || {}) };
}
async function patchOfferClicks(offer){
  const id = encodeURIComponent(offer.id);
  const clicks = Number(offer.clicks || 0) + 1;
  await firestoreFetch(`ecosystem/penseoffgrid/modules/offers/items/${id}?updateMask.fieldPaths=clicks&updateMask.fieldPaths=lastClickAt`, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({fields:jsToFirestoreFields({clicks,lastClickAt:new Date().toISOString()})})
  });
  return clicks;
}
async function createClick(payload){
  const id = encodeURIComponent(docId());
  await firestoreFetch(`ecosystem/penseoffgrid/modules/offers/clicks?documentId=${id}`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({fields:jsToFirestoreFields(payload)})
  });
}

exports.handler = async function(event){
  if(event.httpMethod === "OPTIONS") return {statusCode:204, headers:CORS, body:""};
  if(event.httpMethod !== "POST") return json(405, {ok:false, message:"Método não permitido."});
  try{
    const body = JSON.parse(event.body || "{}");
    const key = clean(body.offerId || body.offerSlug || body.id || "", 120);
    const offer = await getOfferByIdOrSlug(key);
    if(!offer) return json(404, {ok:false, message:"Oferta não encontrada."});
    const clicks = await patchOfferClicks(offer);
    await createClick({
      offerId: offer.id,
      offerSlug: offer.slug || offer.id,
      offerTitle: offer.title || "Oferta",
      store: offer.store || "",
      targetUrl: offer.affiliateUrl || offer.url || offer.linkUrl || "",
      source: clean(body.source || "offer_page", 80),
      createdAtText: new Date().toLocaleString("pt-BR", {timeZone:"America/Recife"}),
      createdAt: new Date().toISOString(),
      userAgent: clean(event.headers["user-agent"] || "", 500)
    });
    return json(200, {ok:true, clicks});
  }catch(error){
    console.error(error);
    return json(500, {ok:false, message:error.message || "Erro ao registrar clique."});
  }
};
