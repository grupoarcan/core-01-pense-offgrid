const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://www.penseoffgrid.com.br").replace(/\/$/, "");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(statusCode, body){ return { statusCode, headers:CORS, body: JSON.stringify(body) }; }
function onlyDigits(value=""){ return String(value || "").replace(/\D/g, ""); }
function pad(num){ return String(Number(num)).padStart(3,"0"); }
function normalize(value=""){
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function parseNumbers(value){
  if(Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  return String(value || "").split(/[^0-9]+/).map(Number).filter(Number.isFinite);
}
function cleanText(value="", max=180){ return String(value || "").trim().slice(0,max); }
function reservationCode(){ return `POG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function enabled(value){ return [true, "true", "1", "yes", "sim", "enabled", "ativo", "ativado"].includes(value) || ["true", "1", "yes", "sim", "enabled", "ativo", "ativado"].includes(normalize(value)); }
function parsePrizeNumbers(value){
  const prizes = new Map();
  if(Array.isArray(value)){
    value.forEach(item => {
      if(item && typeof item === "object"){
        const n = Number(item.number || item.numero || item.ticket);
        const prize = Number(item.prize || item.valor || item.amount || 0);
        if(Number.isFinite(n) && n > 0 && prize > 0) prizes.set(n, prize);
      }else{
        const parts = String(item || "").split(/[|;:=,-]+/).map(v => v.trim()).filter(Boolean);
        const n = Number(parts[0]);
        const prize = Number(String(parts[1] || "0").replace(",","."));
        if(Number.isFinite(n) && n > 0 && prize > 0) prizes.set(n, prize);
      }
    });
    return prizes;
  }
  String(value || "").split(/\n+/).forEach(line => {
    const parts = line.split(/[|;:=,-]+/).map(v => v.trim()).filter(Boolean);
    const n = Number(parts[0]);
    const prize = Number(String(parts[1] || "0").replace(",","."));
    if(Number.isFinite(n) && n > 0 && prize > 0) prizes.set(n, prize);
  });
  return prizes;
}
function calculateOrderTotals(raffle, numbers){
  const count = numbers.length;
  const ticketPrice = Number(raffle.ticketPrice || raffle.price || 0);
  const subtotal = Number((count * ticketPrice).toFixed(2));
  const every = Math.max(0, Number(raffle.discountEveryTickets || 0));
  const percentStep = Math.max(0, Number(raffle.discountPercentPerStep || 0));
  const maxPercent = Math.max(0, Number(raffle.discountMaxPercent || 0));
  let discountPercent = 0;
  if(enabled(raffle.discountEnabled) && every > 0 && percentStep > 0 && count >= every){
    discountPercent = Math.floor(count / every) * percentStep;
    if(maxPercent > 0) discountPercent = Math.min(discountPercent, maxPercent);
    discountPercent = Math.min(discountPercent, 95);
  }
  const discountAmount = Number((subtotal * (discountPercent / 100)).toFixed(2));
  const amount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const prizeMap = parsePrizeNumbers(raffle.prizeNumbers || raffle.instantPrizeNumbers || "");
  const prizeHits = numbers.filter(n => prizeMap.has(Number(n))).map(n => ({number:Number(n), prize:Number(prizeMap.get(Number(n)) || 0)}));
  const instantPrizeAmount = Number(prizeHits.reduce((sum,item) => sum + Number(item.prize || 0), 0).toFixed(2));
  return { ticketPrice, subtotal, discountPercent, discountAmount, amount, prizeHits, instantPrizeAmount };
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
function firestoreFieldsToJs(fields={}){ const output = {}; for(const [key,value] of Object.entries(fields)) output[key] = firestoreValueToJs(value); return output; }
function jsToFirestoreValue(value){
  if(value === null || value === undefined) return { nullValue: null };
  if(typeof value === "boolean") return { booleanValue: value };
  if(typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if(Array.isArray(value)) return { arrayValue: { values: value.map(jsToFirestoreValue) } };
  if(typeof value === "object") return { mapValue: { fields: jsToFirestoreFields(value) } };
  return { stringValue: String(value) };
}
function jsToFirestoreFields(obj={}){ const fields = {}; for(const [key,value] of Object.entries(obj)) fields[key] = jsToFirestoreValue(value); return fields; }
async function firestoreFetch(path, options={}){
  const glue = path.includes("?") ? "&" : "?";
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}${glue}key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null; }catch(error){ data = { raw:text }; }
  if(!response.ok){
    const message = data?.error?.message || response.statusText || "Erro Firestore";
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}
async function getDoc(path){
  try{ return await firestoreFetch(path); }catch(error){ if(error.status === 404) return null; throw error; }
}
async function createDoc(collectionPath, documentId, payload){
  return firestoreFetch(`${collectionPath}?documentId=${encodeURIComponent(documentId)}`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ fields: jsToFirestoreFields(payload) })
  });
}
async function patchDoc(path, payload){
  const updateMask = Object.keys(payload).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  return firestoreFetch(`${path}?${updateMask}`, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ fields: jsToFirestoreFields(payload) })
  });
}
async function deleteDoc(path){
  try{ await firestoreFetch(path, { method:"DELETE" }); }catch(error){ if(error.status !== 404) throw error; }
}
async function addAuditLog(type, payload){
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  try{
    await createDoc("ecosystem/penseoffgrid/modules/raffles/auditLogs", id, {
      type,
      createdAt: new Date().toISOString(),
      ...payload
    });
  }catch(error){ console.warn("Falha ao registrar auditoria", error.message); }
}

async function getRaffleByIdOrSlug(key){
  if(!key) return null;
  const rawKey = String(key);
  const safeKey = encodeURIComponent(rawKey);
  const direct = await getDoc(`ecosystem/penseoffgrid/modules/raffles/items/${safeKey}`);
  if(direct) return { id:safeKey, ...firestoreFieldsToJs(direct.fields || {}) };

  const body = {
    structuredQuery: {
      from: [{ collectionId:"items" }],
      where: { fieldFilter: { field:{ fieldPath:"slug" }, op:"EQUAL", value:{ stringValue:rawKey } } },
      limit: 1
    }
  };
  const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
  });
  const row = result.find(item => item.document?.name);
  if(!row) return null;
  const id = row.document.name.split("/").pop();
  return { id, ...firestoreFieldsToJs(row.document.fields || {}) };
}
async function getRaffleSettings(){
  const doc = await getDoc("ecosystem/penseoffgrid/modules/raffles/settings/main");
  return doc ? firestoreFieldsToJs(doc.fields || {}) : {};
}
async function getRaffleBuyers(raffle){
  const body = {
    structuredQuery: {
      from: [{ collectionId:"buyers" }],
      where: { compositeFilter: { op:"OR", filters:[
        { fieldFilter:{ field:{fieldPath:"raffleId"}, op:"EQUAL", value:{stringValue:String(raffle.id || "")} } },
        { fieldFilter:{ field:{fieldPath:"raffleSlug"}, op:"EQUAL", value:{stringValue:String(raffle.slug || raffle.id || "")} } }
      ] } },
      limit: 1000
    }
  };
  try{
    const result = await firestoreFetch("ecosystem/penseoffgrid/modules/raffles:runQuery", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
    });
    return result.filter(r => r.document?.name).map(r => ({ id:r.document.name.split("/").pop(), ...firestoreFieldsToJs(r.document.fields || {}) }));
  }catch(error){ console.warn("Falha ao consultar compradores", error.message); return []; }
}
function buyerStatuses(buyer){
  return [buyer.paymentStatus, buyer.reservationStatus, buyer.status, buyer.state, buyer.situation, buyer.mercadoPagoStatus, buyer.mpStatus].map(normalize).filter(Boolean);
}
function buyerNumbers(buyer){ return parseNumbers(buyer.numbers ?? buyer.selectedNumbers ?? buyer.tickets ?? buyer.ticketNumbers ?? buyer.number ?? buyer.numero ?? buyer.numeros ?? []); }
function isCancelled(buyer){ return buyerStatuses(buyer).some(s => ["cancelled","canceled","cancelado","cancelada","refunded","estornado","expired","expirado","expirada","rejected","rejeitado","rejeitada","failure","failed","falhou","erro"].includes(s)); }
function isPaid(buyer){ return buyerStatuses(buyer).some(s => ["paid","pago","paga","approved","aprovado","aprovada","confirmed","confirmado","confirmada","payment_approved","pagamento_aprovado"].includes(s)); }
function isPending(buyer){
  const statuses = buyerStatuses(buyer);
  if(!statuses.length) return true;
  return statuses.some(s => ["pending","pendente","reserved","reservado","reservada","pre_reserva","pre_reservado","pre_reservada","in_process","processando","waiting","aguardando"].includes(s));
}
function unavailableNumbers(raffle, buyers=[]){
  const set = new Set(parseNumbers(raffle.soldNumbers || []).map(Number));
  const now = Date.now();
  const blockPending = raffle.blockBeforePayment !== false && raffle.blockNumbersBeforePayment !== false;
  for(const buyer of buyers){
    if(isCancelled(buyer)) continue;
    const expires = buyer.reservationExpiresAt || buyer.expiresAt || buyer.expires_at || "";
    const expired = expires ? new Date(expires).getTime() < now : false;
    if(isPaid(buyer) || (!expired && blockPending && isPending(buyer))){
      buyerNumbers(buyer).forEach(n => set.add(Number(n)));
    }
  }
  return set;
}
function lockId(raffle, number){
  const scope = String(raffle.slug || raffle.id || "rifa").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0,80);
  return `${scope}_${pad(number)}`;
}
async function getLock(lockIdValue){
  const doc = await getDoc(`ecosystem/penseoffgrid/modules/raffles/numberLocks/${encodeURIComponent(lockIdValue)}`);
  return doc ? { id: lockIdValue, ...firestoreFieldsToJs(doc.fields || {}) } : null;
}
function lockIsActive(lock){
  if(!lock) return false;
  const status = normalize(lock.status || lock.paymentStatus || lock.reservationStatus || "pending");
  if(["cancelled","canceled","cancelado","expired","expirado","refunded","rejected","rejeitado"].includes(status)) return false;
  if(["paid","pago","approved","aprovado","confirmed","confirmado"].includes(status)) return true;
  const expires = lock.expiresAt || lock.reservationExpiresAt || "";
  return Boolean(expires) && new Date(expires).getTime() > Date.now();
}
async function acquireNumberLocks({ raffle, numbers, orderCode, customer, amount, expiresAt }){
  const acquired = [];
  for(const number of numbers){
    const id = lockId(raffle, number);
    const existing = await getLock(id);
    if(lockIsActive(existing)){
      await releaseNumberLocks(acquired, "rollback_conflict");
      const error = new Error(`O número ${pad(number)} já está reservado ou vendido.`);
      error.statusCode = 409;
      throw error;
    }
    if(existing && !lockIsActive(existing)){
      await deleteDoc(`ecosystem/penseoffgrid/modules/raffles/numberLocks/${encodeURIComponent(id)}`);
    }
    const payload = {
      raffleId: String(raffle.id || ""),
      raffleSlug: String(raffle.slug || raffle.id || ""),
      raffleTitle: String(raffle.title || ""),
      number: pad(number),
      orderCode,
      buyerName: cleanText(customer.name, 120),
      buyerWhatsapp: cleanText(customer.whatsapp, 40),
      buyerEmail: cleanText(customer.email, 140),
      amount: Number(amount.toFixed(2)),
      status: "pending",
      paymentStatus: "pending",
      reservationStatus: "reserved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt
    };
    try{
      await createDoc("ecosystem/penseoffgrid/modules/raffles/numberLocks", id, payload);
      acquired.push(id);
    }catch(error){
      await releaseNumberLocks(acquired, "rollback_create_failed");
      const conflict = /ALREADY_EXISTS|already exists|409/i.test(error.message || "") || error.status === 409;
      const friendly = conflict ? `O número ${pad(number)} acabou de ser reservado por outra pessoa.` : error.message;
      const err = new Error(friendly);
      err.statusCode = conflict ? 409 : 500;
      throw err;
    }
  }
  return acquired;
}
async function releaseNumberLocks(lockIds, reason="released"){
  for(const id of lockIds || []){
    try{
      await patchDoc(`ecosystem/penseoffgrid/modules/raffles/numberLocks/${encodeURIComponent(id)}`, {
        status:"cancelled",
        paymentStatus:"cancelled",
        reservationStatus:"cancelled",
        releaseReason:reason,
        updatedAt:new Date().toISOString()
      });
    }catch(error){ console.warn("Falha ao liberar lock", id, error.message); }
  }
}
async function createBuyer(documentId, payload){
  const doc = await createDoc("ecosystem/penseoffgrid/modules/raffles/buyers", documentId, payload);
  return { id: doc.name.split("/").pop(), ...payload };
}
async function patchBuyer(documentId, payload){
  return patchDoc(`ecosystem/penseoffgrid/modules/raffles/buyers/${encodeURIComponent(documentId)}`, payload);
}
async function createPreference({raffle, settings, buyer, customer, numbers, amount, returnUrl}){
  if(!MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN não configurado no Netlify.");
  const slug = raffle.slug || raffle.id;
  const baseReturn = returnUrl || `${SITE_URL}/rifas/?r=${encodeURIComponent(slug)}`;
  const preference = {
    items: [{
      id: String(raffle.id || slug),
      title: cleanText(`Rifa: ${raffle.title || "Pense Offgrid"}`, 80),
      description: cleanText(`Números: ${numbers.map(pad).join(", ")}`, 180),
      quantity: 1,
      currency_id: "BRL",
      unit_price: Number(amount.toFixed(2))
    }],
    payer: {
      name: cleanText(customer.name, 80),
      email: cleanText(customer.email, 120),
      phone: { number: onlyDigits(customer.whatsapp).slice(-11) }
    },
    external_reference: buyer.orderCode,
    notification_url: `${SITE_URL}/.netlify/functions/mp-webhook`,
    back_urls: {
      success: `${baseReturn}${baseReturn.includes("?") ? "&" : "?"}order=${encodeURIComponent(buyer.orderCode)}&payment=success&status=approved`,
      pending: `${baseReturn}${baseReturn.includes("?") ? "&" : "?"}order=${encodeURIComponent(buyer.orderCode)}&payment=pending&status=pending`,
      failure: `${baseReturn}${baseReturn.includes("?") ? "&" : "?"}order=${encodeURIComponent(buyer.orderCode)}&payment=failure&status=failure`
    },
    auto_return: "approved",
    statement_descriptor: cleanText(settings.mercadoPagoStatementDescriptor || "PENSEOFFGRID", 22).replace(/[^A-Z0-9 ]/gi, "").toUpperCase() || "PENSEOFFGRID",
    metadata: {
      buyer_id: buyer.id,
      order_code: buyer.orderCode,
      raffle_id: String(raffle.id || ""),
      raffle_slug: String(slug || ""),
      numbers: numbers.map(pad).join(",")
    }
  };
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method:"POST",
    headers:{ "Authorization": `Bearer ${MP_ACCESS_TOKEN}`, "Content-Type":"application/json" },
    body:JSON.stringify(preference)
  });
  const data = await response.json();
  if(!response.ok) throw new Error(data?.message || data?.error || "Mercado Pago recusou a criação do checkout.");
  return data;
}

exports.handler = async function(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:204, headers:CORS, body:"" };
  if(event.httpMethod !== "POST") return json(405, {ok:false, message:"Método não permitido."});

  let acquiredLocks = [];
  let orderCode = "";
  try{
    const body = JSON.parse(event.body || "{}");
    const raffle = await getRaffleByIdOrSlug(body.raffleId || body.raffleSlug);
    if(!raffle) return json(404, {ok:false, message:"Rifa não encontrada."});
    const settings = await getRaffleSettings();
    const globalEnabled = enabled(settings.mercadoPagoEnabled);
    const raffleEnabled = enabled(raffle.mercadoPagoEnabled);
    if(!globalEnabled && !raffleEnabled) return json(409, {ok:false, message:"Mercado Pago automático está desativado para esta rifa."});

    const status = normalize(raffle.status || "published");
    if(["finished","hidden","draft","encerrada","oculta","rascunho"].includes(status)) return json(409, {ok:false, message:"Esta rifa não está disponível."});

    const numbers = parseNumbers(body.numbers).filter((n,i,arr) => n > 0 && arr.indexOf(n) === i).sort((a,b)=>a-b);
    if(!numbers.length) return json(400, {ok:false, message:"Nenhum número selecionado."});
    const totalNumbers = Number(raffle.totalNumbers || 0);
    if(totalNumbers && numbers.some(n => n > totalNumbers)) return json(400, {ok:false, message:"Número fora da faixa da rifa."});
    const max = Number(raffle.maxTicketsPerOrder || raffle.limitPerReservation || 0);
    if(max && numbers.length > max) return json(400, {ok:false, message:`Limite de ${max} número(s) por reserva.`});

    const customer = body.customer || {};
    if(!customer.name || !customer.whatsapp || !customer.email) return json(400, {ok:false, message:"Informe nome, WhatsApp e e-mail."});

    const buyers = await getRaffleBuyers(raffle);
    const unavailable = unavailableNumbers(raffle, buyers);
    const conflict = numbers.find(n => unavailable.has(n));
    if(conflict) return json(409, {ok:false, message:`O número ${pad(conflict)} já está reservado ou vendido.`});

    const totals = calculateOrderTotals(raffle, numbers);
    const amount = totals.amount;
    if(!amount || amount <= 0) return json(400, {ok:false, message:"Valor da rifa inválido."});

    orderCode = cleanText(body.orderCode || reservationCode(), 64);
    const expiresAtIso = new Date(Date.now() + Number(raffle.reservationHours || settings.pendingReservationHours || 4) * 3600000).toISOString();
    const expiresAt = expiresAtIso.slice(0,16);

    acquiredLocks = await acquireNumberLocks({ raffle, numbers, orderCode, customer, amount, expiresAt });

    const buyerPayload = {
      raffleId: String(raffle.id || ""),
      raffleSlug: String(raffle.slug || raffle.id || ""),
      raffleTitle: String(raffle.title || ""),
      name: cleanText(customer.name, 120),
      whatsapp: cleanText(customer.whatsapp, 40),
      email: cleanText(customer.email, 140),
      cpf: cleanText(customer.cpf, 30),
      city: cleanText(customer.city, 80),
      state: cleanText(customer.state, 30),
      numbers: numbers.map(pad).join(", "),
      lockIds: acquiredLocks,
      amount: Number(amount.toFixed(2)),
      subtotalAmount: totals.subtotal,
      discountAmount: totals.discountAmount,
      discountPercent: totals.discountPercent,
      instantPrizeAmount: totals.instantPrizeAmount,
      instantPrizeNumbers: totals.prizeHits.map(item => `${pad(item.number)}|${item.prize}`).join(", "),
      orderCode,
      paymentStatus: "pending",
      reservationStatus: "reserved",
      contactStatus: "checkout_created",
      source: "mercado-pago",
      selectedAt: new Date().toISOString().slice(0,16),
      reservationExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: "Reserva atômica criada antes do pagamento via Mercado Pago."
    };

    const buyer = await createBuyer(orderCode, buyerPayload);
    const preference = await createPreference({raffle, settings, buyer, customer, numbers, amount, returnUrl: body.returnUrl});

    await patchBuyer(orderCode, {
      mercadoPagoPreferenceId: preference.id || "",
      mercadoPagoPaymentUrl: preference.init_point || preference.sandbox_init_point || "",
      mercadoPagoStatus: "preference_created",
      updatedAt: new Date().toISOString()
    });
    await addAuditLog("checkout_created", { orderCode, raffleId: raffle.id || "", raffleSlug: raffle.slug || "", numbers:numbers.map(pad).join(", "), amount:Number(amount.toFixed(2)), discountAmount:totals.discountAmount, discountPercent:totals.discountPercent, instantPrizeAmount:totals.instantPrizeAmount });

    return json(200, {
      ok:true,
      orderCode,
      buyerId: buyer.id,
      preferenceId: preference.id,
      paymentUrl: preference.init_point || preference.sandbox_init_point,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
      initPoint: preference.init_point || "",
      sandboxInitPoint: preference.sandbox_init_point || "",
      expiresAt
    });
  }catch(error){
    if(acquiredLocks.length) await releaseNumberLocks(acquiredLocks, "rollback_payment_creation_error");
    await addAuditLog("checkout_error", { orderCode, message:error.message || "Erro ao criar pagamento" });
    console.error("create-raffle-payment", error);
    return json(error.statusCode || 500, {ok:false, message:error.message || "Erro ao criar pagamento."});
  }
};
