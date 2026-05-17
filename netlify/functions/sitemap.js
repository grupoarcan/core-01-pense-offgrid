const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ecossistema-penseoffgrid";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";
const SITE_URL = (process.env.SITE_URL || "https://www.penseoffgrid.com.br").replace(/\/$/, "");

const ROOT = "ecosystem/penseoffgrid/modules";
const XML_HEADERS = { "Content-Type":"application/xml; charset=utf-8", "Cache-Control":"public, max-age=900" };

function escapeXml(value=""){
  return String(value).replace(/[<>&'\"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c]));
}
function normalizeStatus(value){ return String(value || "").trim().toLowerCase(); }
function isPublished(item){ return !["hidden","draft","disabled","private"].includes(normalizeStatus(item.status)); }
function toJs(value){
  if(!value || typeof value !== "object") return "";
  if("stringValue" in value) return value.stringValue;
  if("integerValue" in value) return Number(value.integerValue);
  if("doubleValue" in value) return Number(value.doubleValue);
  if("booleanValue" in value) return Boolean(value.booleanValue);
  if("timestampValue" in value) return value.timestampValue;
  if("nullValue" in value) return null;
  if("arrayValue" in value) return (value.arrayValue.values || []).map(toJs);
  if("mapValue" in value) return fieldsToJs(value.mapValue.fields || {});
  return "";
}
function fieldsToJs(fields={}){ const out={}; Object.entries(fields).forEach(([k,v]) => out[k]=toJs(v)); return out; }
async function firestoreFetch(path){
  const glue = path.includes("?") ? "&" : "?";
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}${glue}key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if(!res.ok) return null;
  return res.json();
}
async function listDocs(moduleId, collection){
  const data = await firestoreFetch(`${ROOT}/${moduleId}/${collection}?pageSize=300`);
  return (data?.documents || []).map(doc => ({ id:doc.name.split("/").pop(), ...fieldsToJs(doc.fields || {}) }));
}
function urlFor(moduleId, item={}){
  const slug = encodeURIComponent(String(item.slug || item.id || "").trim());
  const map = {
    home: "/",
    news: slug ? `/noticias/?n=${slug}` : "/noticias/",
    projects: "/projetos/",
    raffles: slug ? `/rifas/?r=${slug}` : "/rifas/",
    courses: "/cursos/",
    tutorials: slug ? `/tutoriais/?t=${slug}` : "/tutoriais/",
    offers: slug ? `/oferta/?id=${slug}` : "/oferta/",
    calculator: "/calculadora/",
    games: "/jogos/solano/",
    vip: "/vip.html"
  };
  return map[moduleId] || "/";
}
function addUrl(urls, loc, priority="0.7", changefreq="weekly", lastmod=""){
  if(!loc) return;
  const full = loc.startsWith("http") ? loc : `${SITE_URL}${loc.startsWith("/") ? loc : `/${loc}`}`;
  if(urls.some(item => item.loc === full)) return;
  urls.push({ loc:full, priority:String(priority || "0.7"), changefreq:String(changefreq || "weekly"), lastmod:lastmod || new Date().toISOString() });
}
exports.handler = async () => {
  const urls = [];
  addUrl(urls, "/", "1.0", "daily");
  addUrl(urls, "/projetos/", "0.9", "weekly");
  addUrl(urls, "/rifas/", "0.8", "daily");
  addUrl(urls, "/cursos/", "0.8", "weekly");
  addUrl(urls, "/tutoriais/", "0.8", "weekly");
  addUrl(urls, "/noticias/", "0.8", "daily");
  addUrl(urls, "/calculadora/", "0.7", "monthly");
  addUrl(urls, "/jogos/solano/", "0.7", "monthly");

  const configs = [
    ["news","posts"], ["raffles","items"], ["tutorials","items"], ["offers","items"],
    ["projects","items"], ["courses","lessons"], ["seo","pages"]
  ];
  for(const [moduleId, collection] of configs){
    try{
      const items = await listDocs(moduleId, collection);
      items.filter(isPublished).forEach(item => {
        if(moduleId === "seo"){
          if(item.includeInSitemap === false) return;
          addUrl(urls, item.canonicalUrl || item.publicUrl || urlFor(item.module, {slug:item.targetSlug || item.slug || item.id}), item.priority || "0.7", item.changefreq || "weekly", item.updatedAt || item.createdAt);
        }else{
          addUrl(urls, urlFor(moduleId, item), item.featured ? "0.9" : "0.7", moduleId === "raffles" ? "daily" : "weekly", item.updatedAt || item.createdAt);
        }
      });
    }catch(error){ console.warn("sitemap module skipped", moduleId, error.message); }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>\n    <changefreq>${escapeXml(item.changefreq)}</changefreq>\n    <priority>${escapeXml(item.priority)}</priority>\n  </url>`).join("\n")}\n</urlset>`;
  return { statusCode:200, headers:XML_HEADERS, body };
};
