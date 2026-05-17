const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";
const SITE_URL = (process.env.SITE_URL || "https://www.penseoffgrid.com.br").replace(/\/$/, "");
const ROOT = "ecosystem/penseoffgrid/modules";
function esc(v=""){ return String(v || "").replace(/[<>&'\"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&#39;",'"':"&quot;"}[c])); }
function toJs(value){
  if(!value || typeof value !== "object") return "";
  if("stringValue" in value) return value.stringValue;
  if("integerValue" in value) return Number(value.integerValue);
  if("doubleValue" in value) return Number(value.doubleValue);
  if("booleanValue" in value) return Boolean(value.booleanValue);
  if("timestampValue" in value) return value.timestampValue;
  if("arrayValue" in value) return (value.arrayValue.values || []).map(toJs);
  if("mapValue" in value) return fieldsToJs(value.mapValue.fields || {});
  return "";
}
function fieldsToJs(fields={}){ const out={}; Object.entries(fields).forEach(([k,v]) => out[k]=toJs(v)); return out; }
async function firestoreFetch(path, options={}){
  const glue = path.includes("?") ? "&" : "?";
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}${glue}key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, options);
  if(!res.ok) return null;
  return res.json();
}
async function findBySlug(moduleId, collection, slug){
  if(!slug) return null;
  const direct = await firestoreFetch(`${ROOT}/${moduleId}/${collection}/${encodeURIComponent(slug)}`);
  if(direct?.fields) return { id:slug, ...fieldsToJs(direct.fields || {}) };
  const body = { structuredQuery:{ from:[{collectionId:collection}], where:{ fieldFilter:{ field:{fieldPath:"slug"}, op:"EQUAL", value:{stringValue:String(slug)} } }, limit:1 } };
  const result = await firestoreFetch(`${ROOT}/${moduleId}:runQuery`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const row = Array.isArray(result) ? result.find(item => item.document?.fields) : null;
  if(!row) return null;
  return { id:row.document.name.split("/").pop(), ...fieldsToJs(row.document.fields || {}) };
}
function configFor(type){
  return {
    raffle:["raffles","items","/rifas/?r="],
    rifa:["raffles","items","/rifas/?r="],
    offer:["offers","items","/oferta/?id="],
    oferta:["offers","items","/oferta/?id="],
    tutorial:["tutorials","items","/tutoriais/?t="],
    noticia:["news","posts","/noticias/?n="],
    news:["news","posts","/noticias/?n="]
  }[String(type || "").toLowerCase()] || null;
}
exports.handler = async (event) => {
  const type = event.queryStringParameters?.type || event.queryStringParameters?.t || "offer";
  const id = event.queryStringParameters?.id || event.queryStringParameters?.slug || "";
  const cfg = configFor(type);
  if(!cfg) return {statusCode:404, body:"Tipo inválido"};
  const [moduleId, collection, basePath] = cfg;
  const item = await findBySlug(moduleId, collection, id);
  if(!item) return {statusCode:404, body:"Conteúdo não encontrado"};
  const url = `${SITE_URL}${basePath}${encodeURIComponent(item.slug || item.id || id)}`;
  const title = item.metaTitle || item.seoTitle || item.title || item.headline || item.name || "Pense Offgrid";
  const description = item.metaDescription || item.seoDescription || item.description || item.excerpt || item.rules || "Conteúdo do ecossistema Pense Offgrid.";
  const image = item.ogImageUrl || item.imageUrl || item.coverUrl || item.thumbnailUrl || `${SITE_URL}/og-thumb.png`;
  const absoluteImage = String(image).startsWith("http") ? image : `${SITE_URL}${String(image).startsWith("/") ? image : `/${image}`}`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Pense Offgrid"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${esc(absoluteImage)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(absoluteImage)}"><meta http-equiv="refresh" content="0;url=${esc(url)}"></head><body style="font-family:Arial,sans-serif;background:#080b10;color:#fff;display:grid;place-items:center;min-height:100vh;text-align:center"><main><h1>${esc(title)}</h1><p>${esc(description)}</p><p><a style="color:#ff9f1c" href="${esc(url)}">Abrir conteúdo</a></p></main></body></html>`;
  return { statusCode:200, headers:{"Content-Type":"text/html; charset=utf-8", "Cache-Control":"public, max-age=900"}, body:html };
};
