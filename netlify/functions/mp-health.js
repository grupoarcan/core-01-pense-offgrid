const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://www.penseoffgrid.com.br").replace(/\/$/, "");

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function json(statusCode, body){
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

function maskToken(token){
  if(!token) return "não configurado";
  return `${token.slice(0, 10)}...${token.slice(-6)}`;
}

exports.handler = async function(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:204, headers:HEADERS, body:"" };
  if(event.httpMethod !== "GET") return json(405, {ok:false, message:"Método não permitido."});

  try{
    if(!MP_ACCESS_TOKEN){
      return json(500, {
        ok:false,
        message:"MP_ACCESS_TOKEN não está configurado no Netlify.",
        siteUrl:SITE_URL,
        webhookUrl:`${SITE_URL}/.netlify/functions/mp-webhook`
      });
    }

    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers:{ Authorization:`Bearer ${MP_ACCESS_TOKEN}` }
    });
    const data = await response.json().catch(() => ({}));

    if(!response.ok){
      return json(response.status, {
        ok:false,
        message:data?.message || data?.error || "Mercado Pago recusou o token configurado.",
        token:maskToken(MP_ACCESS_TOKEN),
        siteUrl:SITE_URL,
        webhookUrl:`${SITE_URL}/.netlify/functions/mp-webhook`
      });
    }

    return json(200, {
      ok:true,
      message:"Mercado Pago conectado com sucesso.",
      token:maskToken(MP_ACCESS_TOKEN),
      accountId:data?.id || "",
      nickname:data?.nickname || "",
      country:data?.country_id || "",
      siteUrl:SITE_URL,
      webhookUrl:`${SITE_URL}/.netlify/functions/mp-webhook`
    });
  }catch(error){
    return json(500, {
      ok:false,
      message:error.message || "Erro ao testar Mercado Pago.",
      siteUrl:SITE_URL,
      webhookUrl:`${SITE_URL}/.netlify/functions/mp-webhook`
    });
  }
};
