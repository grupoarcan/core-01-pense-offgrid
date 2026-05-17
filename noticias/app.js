import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8",
  authDomain: "ecossistema-penseoffgrid.firebaseapp.com",
  projectId: "ecossistema-penseoffgrid",
  storageBucket: "ecossistema-penseoffgrid.firebasestorage.app",
  messagingSenderId: "673004231949",
  appId: "1:673004231949:web:c52c6c3f9a357a48926444",
  measurementId: "G-9K321C694B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newsCollection = collection(
  db,
  "ecosystem",
  "penseoffgrid",
  "modules",
  "news",
  "posts"
);

const $ = (id) => document.getElementById(id);
let posts = [];
(function injectArticleMarkdownStyles(){
  if(document.getElementById("pense-news-markdown-style")) return;
  const style = document.createElement("style");
  style.id = "pense-news-markdown-style";
  style.textContent = `#articleContent a{color:#FFC078;font-weight:900;text-decoration:underline;text-underline-offset:3px}.article-inline-image{margin:22px 0;border:1px solid rgba(255,255,255,.1);border-radius:22px;overflow:hidden;background:rgba(255,255,255,.035)}.article-inline-image img{width:100%;max-height:520px;object-fit:contain;background:#050505}.article-inline-image figcaption{padding:10px 14px;color:#AEB7C6;font-size:13px;text-align:center}`;
  document.head.appendChild(style);
})();

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function postUrl(post){
  return `/noticias/?post=${encodeURIComponent(post.slug || post.id)}`;
}

function shareUrl(post){
  return `/.netlify/functions/news-share?post=${encodeURIComponent(post.slug || post.id)}`;
}

function dateLabel(date){
  if(!date) return "Pense Offgrid";
  try{
    const [y,m,d] = String(date).split("-");
    if(!y || !m || !d) return String(date);
    return `${d}/${m}/${y}`;
  }catch{
    return String(date);
  }
}

function normalizeStatus(post){
  return String(post.status || "published").toLowerCase();
}
function isPublishDateReached(post){
  if(!post.publishAt) return true;
  const timestamp = new Date(post.publishAt).getTime();
  if(Number.isNaN(timestamp)) return true;
  return timestamp <= Date.now();
}
function isPublicPost(post){
  const status = normalizeStatus(post);
  if(status === "published") return true;
  if(status === "scheduled") return isPublishDateReached(post);
  return false;
}

function fallbackPosts(){
  return [
    {
      id:"energia-solar-autonomia",
      slug:"energia-solar-autonomia",
      title:"Energia solar continua puxando interesse de quem busca autonomia",
      category:"solar",
      date:new Date().toISOString().slice(0,10),
      excerpt:"O crescimento da busca por sistemas próprios reforça a importância de entender consumo, geração e armazenamento antes da compra.",
      content:"A energia solar segue ganhando espaço entre pessoas que buscam autonomia, economia e mais controle sobre o próprio consumo.\n\nPara quem pensa em sistemas próprios, o ponto de partida não deve ser apenas escolher um inversor ou comprar painéis. O primeiro passo é entender o consumo real, a rotina da casa, a necessidade de autonomia e o orçamento disponível.\n\nEsse é o objetivo do Pense Offgrid: transformar informação técnica em decisão prática.",
      imageUrl:"",
      featured:true,
      status:"published"
    }
  ];
}

async function loadPosts(){
  try{
    const snap = await getDocs(newsCollection);
    posts = [];

    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      if(isPublicPost(data)){
        posts.push(data);
      }
    });

    if(!posts.length) posts = fallbackPosts();

    posts.sort((a,b) => {
      const byDate = String(b.date || "").localeCompare(String(a.date || ""));
      if(byDate !== 0) return byDate;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }catch(error){
    console.error("Erro ao carregar notícias:", error);
    posts = fallbackPosts();
  }

  route();
}

function categoryIcon(category){
  return {
    solar:"☀️",
    baterias:"🔋",
    inversores:"⚡",
    economia:"📉",
    tecnologia:"🧠",
    offgrid:"🏕️",
    mundo:"🌎",
    brasil:"🇧🇷"
  }[category] || "📰";
}

function renderList(){
  $("listHero")?.classList.remove("hidden");
  $("categoryBar")?.classList.remove("hidden");
  $("listView")?.classList.remove("hidden");
  $("articleView")?.classList.add("hidden");

  document.title = "Notícias de Energia | Pense Offgrid";
  document.querySelector('meta[name="description"]')?.setAttribute("content", "Notícias, análises e tendências sobre energia solar, baterias, inversores, tecnologia, economia e mundo offgrid.");
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Notícias de Energia | Pense Offgrid");
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", "Energia solar, baterias, inversores, economia, tecnologia e mundo offgrid em linguagem prática.");
  document.querySelector('meta[property="og:image"]')?.setAttribute("content", "https://www.penseoffgrid.com.br/og-thumb.png");

  const featured = posts.find(p => p.featured) || posts[0];

  if($("featuredBox") && featured){
    $("featuredBox").innerHTML = `
      ${featured.imageUrl ? `<img class="featured-img" src="${escapeHtml(featured.imageUrl)}" alt="">` : `<div class="featured-visual">⚡</div>`}
      <div class="featured-content">
        <div class="post-meta">
          <span class="pill">Destaque</span>
          <span class="pill">${escapeHtml(featured.category || "Notícia")}</span>
          <span class="date">${escapeHtml(dateLabel(featured.date))}</span>
        </div>
        <h2>${escapeHtml(featured.title)}</h2>
        <p>${escapeHtml(featured.excerpt)}</p>
        <div class="actions">
          <a class="btn primary" href="${postUrl(featured)}">Ler notícia</a>
          <a class="btn ghost" href="/calculadora/">Simular meu sistema</a>
        </div>
      </div>
    `;
  }

  if($("miniList")){
    $("miniList").innerHTML = posts.slice(0,4).map((post) => `
      <a class="mini-post" href="${postUrl(post)}">
        <strong>${escapeHtml(post.title)}</strong>
        <small>${escapeHtml(post.category || "notícia")} • ${escapeHtml(dateLabel(post.date))}</small>
      </a>
    `).join("");
  }

  renderCards("todas");
}

function renderCards(filter = "todas"){
  const filtered = posts.filter((post) => filter === "todas" || post.category === filter);

  if(!$("newsGrid")) return;

  $("newsGrid").innerHTML = filtered.map((post) => `
    <article class="news-card glass" data-category="${escapeHtml(post.category || "")}">
      <a href="${postUrl(post)}" class="thumb">
        ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy">` : categoryIcon(post.category)}
      </a>
      <div class="news-body">
        <div class="post-meta">
          <span class="pill">${escapeHtml(post.category || "Notícia")}</span>
          <span class="date">${escapeHtml(dateLabel(post.date))}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <a class="read" href="${postUrl(post)}">Ler notícia →</a>
      </div>
    </article>
  `).join("") || `<div class="loading">Nenhuma notícia nesta categoria.</div>`;
}

function isSafeContentUrl(url){ return /^(https?:\/\/|\/)/i.test(String(url || "")); }
function renderInlineMarkdown(text){
  let html = escapeHtml(text || "");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
}
function formatContent(content){
  return String(content || "").split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean).map(paragraph => {
    const imageMatch = paragraph.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if(imageMatch && isSafeContentUrl(imageMatch[2])) return `<figure class="article-inline-image"><img src="${escapeHtml(imageMatch[2])}" alt="${escapeHtml(imageMatch[1])}" loading="lazy">${imageMatch[1] ? `<figcaption>${escapeHtml(imageMatch[1])}</figcaption>` : ""}</figure>`;
    return `<p>${renderInlineMarkdown(paragraph).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function renderArticle(slug){
  const post = posts.find((item) => item.slug === slug || item.id === slug);

  if(!post){
    renderList();
    return;
  }

  $("listHero")?.classList.add("hidden");
  $("categoryBar")?.classList.add("hidden");
  $("listView")?.classList.add("hidden");
  $("articleView")?.classList.remove("hidden");

  document.title = `${post.title} | Pense Offgrid`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", post.excerpt || "");
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", post.title || "");
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", post.excerpt || "");
  if(post.imageUrl){
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", post.imageUrl);
  }

  $("articleCategory").textContent = post.category || "Notícia";
  $("articleDate").textContent = dateLabel(post.date);
  $("articleTitle").textContent = post.title || "";
  $("articleExcerpt").textContent = post.excerpt || "";
  let articleHtml = formatContent(post.content || post.excerpt || "");
  if(post.bodyImageUrl && !String(post.content || "").includes(post.bodyImageUrl)){
    articleHtml += `<figure class="article-inline-image"><img src="${escapeHtml(post.bodyImageUrl)}" alt="${escapeHtml(post.bodyImageAlt || post.title || "Imagem da notícia")}" loading="lazy">${post.bodyImageAlt ? `<figcaption>${escapeHtml(post.bodyImageAlt)}</figcaption>` : ""}</figure>`;
  }
  $("articleContent").innerHTML = articleHtml;

  if(post.imageUrl){
    $("articleImage").src = post.imageUrl;
    $("articleImage").alt = post.title || "";
    $("articleImageBox").classList.remove("hidden");
  }else{
    $("articleImageBox").classList.add("hidden");
  }

  const readableUrl = location.origin + postUrl(post);
  const shareAbsoluteUrl = location.origin + shareUrl(post);
  $("whatsShare").href = `https://wa.me/?text=${encodeURIComponent((post.title || "Notícia Pense Offgrid") + " - " + shareAbsoluteUrl)}`;

  $("copyLinkBtn").onclick = async () => {
    await navigator.clipboard.writeText(shareAbsoluteUrl);
    alert("Link de compartilhamento copiado.");
  };

  window.scrollTo({top:0, behavior:"smooth"});
}

function route(){
  const slug = new URLSearchParams(location.search).get("post");
  if(slug) renderArticle(slug);
  else renderList();
}

document.querySelectorAll(".cat").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".cat").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderCards(filter);
  });
});

window.addEventListener("popstate", route);
loadPosts();
