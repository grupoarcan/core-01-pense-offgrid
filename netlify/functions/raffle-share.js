const FIREBASE_PROJECT_ID = "ecossistema-penseoffgrid";
const API_KEY = "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firestoreValueToJs(value) {
  if (!value || typeof value !== "object") return "";
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(firestoreValueToJs);
  if ("mapValue" in value) return firestoreFieldsToJs(value.mapValue.fields || {});
  return "";
}

function firestoreFieldsToJs(fields = {}) {
  const output = {};
  for (const [key, value] of Object.entries(fields)) output[key] = firestoreValueToJs(value);
  return output;
}

async function getRaffleByDocumentId(slug) {
  const safeSlug = encodeURIComponent(slug);
  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/ecosystem/penseoffgrid/modules/raffles/items/${safeSlug}` +
    `?key=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) return null;
  const json = await response.json();
  return { id: slug, ...firestoreFieldsToJs(json.fields || {}) };
}

async function getRaffleBySlugField(slug) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents:runQuery?key=${API_KEY}`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "items", allDescendants: true }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug }
        }
      },
      limit: 1
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) return null;
  const json = await response.json();
  const found = json.find((row) => row.document && row.document.name);
  if (!found) return null;
  const nameParts = found.document.name.split("/");
  const id = nameParts[nameParts.length - 1];
  return { id, ...firestoreFieldsToJs(found.document.fields || {}) };
}

async function getRaffle(slug) {
  return (await getRaffleByDocumentId(slug)) || (await getRaffleBySlugField(slug));
}

function absoluteUrl(url = "", host = "www.penseoffgrid.com.br", protocol = "https") {
  const value = String(url || "").trim();
  if (!value) return `${protocol}://${host}/og-thumb.png`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `${protocol}:${value}`;
  if (value.startsWith("/")) return `${protocol}://${host}${value}`;
  return value;
}

function statusIsPublic(status = "published") {
  const normalized = String(status || "published").toLowerCase();
  return !["hidden", "draft", "rascunho", "oculta", "oculto"].includes(normalized);
}

function money(value) {
  const number = Number(value || 0);
  if (!number) return "valor informado na página";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number);
}

function buildHtml(raffle, canonicalUrl, readerUrl, host, protocol) {
  const title = escapeHtml(raffle.title || raffle.headline || "Rifa Pense Offgrid");
  const priceText = money(raffle.ticketPrice);
  const description = escapeHtml(
    raffle.shareDescription ||
    raffle.description ||
    `Participe da rifa Pense Offgrid. Número por ${priceText}. Escolha seus números e acompanhe as regras.`
  );
  const image = escapeHtml(absoluteUrl(raffle.imageUrl || raffle.coverUrl || raffle.thumbnail || "", host, protocol));
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeReader = escapeHtml(readerUrl);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <link rel="canonical" href="${safeCanonical}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pense Offgrid Rifas">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:url" content="${safeCanonical}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">

  <meta http-equiv="refresh" content="1;url=${safeReader}">

  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#030303;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}
    .box{max-width:720px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:linear-gradient(145deg,#17191f,#050507);padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
    img{width:100%;max-height:420px;object-fit:contain;border-radius:18px;margin-bottom:18px;background:#111}
    h1{margin:0 0 10px;line-height:1;font-size:clamp(30px,6vw,52px);letter-spacing:-.06em;text-transform:uppercase}
    p{color:#cbd5e1;line-height:1.6;margin:0 0 18px}
    a{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:16px;padding:0 18px;background:linear-gradient(90deg,#F7931E,#FFC078);color:#120700;font-weight:900;text-transform:uppercase;text-decoration:none;font-size:13px}
  </style>
</head>
<body>
  <main class="box">
    <img src="${image}" alt="">
    <h1>${title}</h1>
    <p>${description}</p>
    <a href="${safeReader}">Abrir rifa</a>
  </main>
  <script>
    setTimeout(function(){ window.location.href = ${JSON.stringify(readerUrl)}; }, 700);
  </script>
</body>
</html>`;
}

exports.handler = async function(event) {
  try {
    const slug = event.queryStringParameters && (event.queryStringParameters.r || event.queryStringParameters.raffle);
    if (!slug) return { statusCode: 302, headers: { Location: "/rifas/" }, body: "" };

    const raffle = await getRaffle(slug);
    if (!raffle || !statusIsPublic(raffle.status)) {
      return { statusCode: 302, headers: { Location: "/rifas/" }, body: "" };
    }

    const host = event.headers["x-forwarded-host"] || event.headers.host || "www.penseoffgrid.com.br";
    const protocol = event.headers["x-forwarded-proto"] || "https";
    const canonicalUrl = `${protocol}://${host}/.netlify/functions/raffle-share?r=${encodeURIComponent(slug)}`;
    const readerUrl = `${protocol}://${host}/rifas/?r=${encodeURIComponent(slug)}`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=120"
      },
      body: buildHtml(raffle, canonicalUrl, readerUrl, host, protocol)
    };
  } catch (error) {
    console.error("raffle-share error:", error);
    return { statusCode: 302, headers: { Location: "/rifas/" }, body: "" };
  }
};
