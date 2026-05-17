import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBV69nCf2jbIP_Km4IZEKCHNxG1v7llxb8",
  authDomain: "ecossistema-penseoffgrid.firebaseapp.com",
  projectId: "ecossistema-penseoffgrid",
  storageBucket: "ecossistema-penseoffgrid.firebasestorage.app",
  messagingSenderId: "673004231949",
  appId: "1:673004231949:web:c52c6c3f9a357a48926444",
  measurementId: "G-9K321C694B"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const ROOT = ["ecosystem", "penseoffgrid", "modules"];
const publishedStatuses = new Set(["published", "ativo", "ativa", "active", "publicado", "publicada", "finished"]);

function moduleDoc(moduleId) {
  return doc(db, ...ROOT, moduleId);
}

function collectionRef(moduleId, collectionName) {
  return collection(moduleDoc(moduleId), collectionName);
}

function normalizeItem(docSnap) {
  const data = docSnap.data() || {};
  return { id: docSnap.id, ...data };
}

export function isPublicItem(item = {}) {
  const status = String(item.status || "published").toLowerCase();
  return publishedStatuses.has(status) && status !== "draft" && status !== "hidden";
}

export function sortPublicItems(items = []) {
  return items
    .filter(isPublicItem)
    .sort((a, b) => {
      const ao = Number(a.order ?? a.ordem ?? 9999);
      const bo = Number(b.order ?? b.ordem ?? 9999);
      if (ao !== bo) return ao - bo;
      return String(a.title || a.name || a.id || "").localeCompare(String(b.title || b.name || b.id || ""), "pt-BR");
    });
}

export async function getSettings(moduleId, docId = "main") {
  try {
    const snap = await getDoc(doc(moduleDoc(moduleId), "settings", docId));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn(`[PenseOffgrid Firebase] settings fallback: ${moduleId}/${docId}`, error);
    return null;
  }
}

export async function getCollection(moduleId, collectionName) {
  try {
    let snap;
    try {
      snap = await getDocs(query(collectionRef(moduleId, collectionName), orderBy("order", "asc")));
    } catch (error) {
      snap = await getDocs(collectionRef(moduleId, collectionName));
    }
    const docs = snap.docs.map(normalizeItem);
    if (collectionName === "buyers" || collectionName === "reservations") return docs;
    return sortPublicItems(docs);
  } catch (error) {
    console.warn(`[PenseOffgrid Firebase] collection fallback: ${moduleId}/${collectionName}`, error);
    return [];
  }
}

export async function addPublicCollectionDoc(moduleId, collectionName, payload = {}) {
  try {
    const ref = await addDoc(collectionRef(moduleId, collectionName), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: payload.source || "public-site"
    });
    return { ok: true, id: ref.id };
  } catch (error) {
    console.warn(`[PenseOffgrid Firebase] public write fallback: ${moduleId}/${collectionName}`, error);
    return { ok: false, error };
  }
}

export function youtubeEmbed(url = "") {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

export function splitTextareaList(value = "") {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}


const DEFAULT_GLOBAL_LINKS = {
  vipGroup: "https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",
  openGroup: "https://chat.whatsapp.com/EwVxNCXMypJFf2zlxM5wZi",
  youtube: "https://www.youtube.com/@penseoffgrid",
  instagram: "https://www.instagram.com/penseoffgrid",
  tiktok: "https://www.tiktok.com/@penseoffgrid",
  telegram: "",
  whatsapp: "",
  support: "",
  coupons: "",
  vipPage: "/vip.html"
};

const GLOBAL_LINK_ALIASES = {
  vipgroup: "vipGroup",
  grupovip: "vipGroup",
  vip: "vipGroup",
  comunidadevip: "vipGroup",
  grupoaberto: "openGroup",
  conversas: "openGroup",
  opengroup: "openGroup",
  youtube: "youtube",
  instagram: "instagram",
  tiktok: "tiktok",
  telegram: "telegram",
  whatsapp: "whatsapp",
  suporte: "support",
  support: "support",
  cupons: "coupons",
  coupons: "coupons",
  vippage: "vipPage"
};

function normalizeGlobalKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function inferGlobalLinkKey(item = {}) {
  const candidates = [item.key, item.slug, item.id, item.title, item.label, item.type, item.context]
    .filter(Boolean)
    .map(normalizeGlobalKey);
  for (const candidate of candidates) {
    if (GLOBAL_LINK_ALIASES[candidate]) return GLOBAL_LINK_ALIASES[candidate];
  }
  const text = normalizeGlobalKey(`${item.title || ""} ${item.label || ""} ${item.description || ""}`);
  if (text.includes("grupovip") || text.includes("comunidadevip")) return "vipGroup";
  if (text.includes("grupoaberto") || text.includes("conversas")) return "openGroup";
  if (text.includes("youtube")) return "youtube";
  if (text.includes("instagram")) return "instagram";
  if (text.includes("tiktok")) return "tiktok";
  if (text.includes("telegram")) return "telegram";
  if (text.includes("whatsapp")) return "whatsapp";
  if (text.includes("suporte")) return "support";
  if (text.includes("cupom") || text.includes("cupons")) return "coupons";
  return "";
}

let globalLinksCache = null;

export async function getGlobalLinks(force = false) {
  if (globalLinksCache && !force) return globalLinksCache;
  const map = {...DEFAULT_GLOBAL_LINKS};
  try {
    const links = await getCollection("global", "links");
    links.forEach((item) => {
      const url = String(item.url || item.linkUrl || "").trim();
      if (!url) return;
      const key = inferGlobalLinkKey(item);
      if (key) map[key] = url;
      const explicit = normalizeGlobalKey(item.key || item.slug || item.id || item.title || "");
      if (explicit) map[explicit] = url;
    });
  } catch (error) {
    console.warn("[PenseOffgrid Firebase] global links fallback", error);
  }
  globalLinksCache = map;
  return map;
}

export async function applyGlobalLinks(root = document) {
  const links = await getGlobalLinks();
  const replacements = [
    [DEFAULT_GLOBAL_LINKS.vipGroup, links.vipGroup],
    [DEFAULT_GLOBAL_LINKS.openGroup, links.openGroup],
    [DEFAULT_GLOBAL_LINKS.youtube, links.youtube],
    [DEFAULT_GLOBAL_LINKS.instagram, links.instagram],
    [DEFAULT_GLOBAL_LINKS.tiktok, links.tiktok],
    [DEFAULT_GLOBAL_LINKS.vipPage, links.vipPage]
  ].filter(([, to]) => to);

  root.querySelectorAll("[data-global-link]").forEach((el) => {
    const key = normalizeGlobalKey(el.getAttribute("data-global-link"));
    const resolved = links[GLOBAL_LINK_ALIASES[key] || key];
    if (!resolved) return;
    if (el.tagName === "A") el.href = resolved;
    else el.setAttribute("data-url", resolved);
  });

  root.querySelectorAll("a[href]").forEach((anchor) => {
    const raw = anchor.getAttribute("href") || "";
    const match = replacements.find(([from]) => raw === from || raw.replace(/\/$/, "") === from.replace(/\/$/, ""));
    if (match?.[1]) anchor.setAttribute("href", match[1]);
  });

  window.PENSE_GLOBAL_LINKS = links;
  return links;
}


export async function bootGlobalLinks(root = document) {
  await applyGlobalLinks(root);
  if (typeof MutationObserver === "undefined" || !document.body) return;
  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => applyGlobalLinks(root), 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.PENSE_GLOBAL_LINKS_OBSERVER = observer;
}
