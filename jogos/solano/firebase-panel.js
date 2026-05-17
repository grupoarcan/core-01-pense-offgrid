import { auth, db, storage, FIREBASE_PROJECT_ID } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';

const ADMIN_KEY = 'solano_game_admin_config_v2';
const REMOTE_DOC = doc(db, 'games', 'solano', 'config', 'admin');
const $ = (id) => document.getElementById(id);
const notify = (msg) => {
  const t = $('toast');
  if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
  else alert(msg);
};

function readLocalConfig(){
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}'); }
  catch(e){ return {}; }
}
function writeLocalConfig(config){
  localStorage.setItem(ADMIN_KEY, JSON.stringify(config || {}));
}
function downloadJson(name, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

async function publishConfig(){
  if (!auth.currentUser) return notify('Faça login Firebase antes de publicar.');
  const config = readLocalConfig();
  await setDoc(REMOTE_DOC, {
    config,
    publishedAt: serverTimestamp(),
    publishedBy: auth.currentUser.email,
    version: '5.22'
  }, { merge: true });
  localStorage.setItem('solano_firebase_last_publish', String(Date.now()));
  notify('Configurações publicadas no Firebase.');
}

async function loadRemoteConfig(){
  const snap = await getDoc(REMOTE_DOC);
  if (!snap.exists()) return notify('Nenhuma configuração remota publicada ainda.');
  const data = snap.data();
  if (!data.config) return notify('Documento remoto existe, mas não tem config.');
  writeLocalConfig(data.config);
  notify('Config remota carregada. Reabrindo painel...');
  setTimeout(()=>location.reload(), 600);
}

async function backupRemote(){
  const snap = await getDoc(REMOTE_DOC);
  if (!snap.exists()) return notify('Nada remoto para exportar.');
  downloadJson('solano-firebase-config-backup.json', snap.data());
}

async function uploadImage(file, folder='admin-assets'){
  if (!auth.currentUser) throw new Error('Faça login Firebase antes de subir imagem.');
  const safe = file.name.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
  const path = `solano/${folder}/${Date.now()}_${safe}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
  return await getDownloadURL(storageRef);
}

async function loginAndOpenPanel(email, password){
  if(!email || !password) throw new Error('Informe e-mail e senha.');
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

function injectFirebasePanel(){
  const hero = document.querySelector('.adminHero');
  if (!hero || $('firebaseAdminBox')) return;
  const box = document.createElement('section');
  box.id = 'firebaseAdminBox';
  box.className = 'firebaseBox';
  box.innerHTML = `
    <div class="firebaseHeader">
      <div>
        <b>Firebase Real</b>
        <small id="fbStatus">Projeto: ${FIREBASE_PROJECT_ID} • aguardando login</small>
      </div>
      <span id="fbBadge" class="fbBadge off">offline</span>
    </div>
    <div class="firebaseGrid">
      <label><span>E-mail Firebase Auth</span><input id="fbEmail" type="email" placeholder="admin@email.com"></label>
      <label><span>Senha</span><input id="fbPassword" type="password" placeholder="senha"></label>
      <button id="fbLogin" type="button">Entrar Firebase</button>
      <button id="fbLogout" type="button">Sair</button>
      <button id="fbPublish" type="button">Publicar alterações</button>
      <button id="fbLoad" type="button">Carregar remoto</button>
      <button id="fbBackup" type="button">Exportar remoto</button>
    </div>
    <p class="firebaseHelp">Fluxo recomendado: edite o painel normalmente, teste local, depois clique em <b>Publicar alterações</b>. O jogo carrega a config remota e mantém fallback local se a internet/Firebase falhar.</p>
  `;
  hero.insertAdjacentElement('afterend', box);

  $('fbLogin').onclick = async () => {
    try { await signInWithEmailAndPassword(auth, $('fbEmail').value.trim(), $('fbPassword').value); notify('Login Firebase realizado.'); }
    catch(e){ notify('Erro Firebase Auth: ' + (e.message || e)); }
  };
  $('fbLogout').onclick = () => signOut(auth);
  $('fbPublish').onclick = async () => { try { await publishConfig(); } catch(e){ notify('Erro ao publicar: ' + (e.message || e)); } };
  $('fbLoad').onclick = async () => { try { await loadRemoteConfig(); } catch(e){ notify('Erro ao carregar remoto: ' + (e.message || e)); } };
  $('fbBackup').onclick = async () => { try { await backupRemote(); } catch(e){ notify('Erro no backup remoto: ' + (e.message || e)); } };
}

function wireStorageUploads(){
  const pairs = [
    ['itemFile', 'itemImage', 'items'],
    ['adFile', 'adImage', 'ctas'],
    ['editItemFile', 'editItemImage', 'items'],
    ['editAdFile', 'editAdImage', 'ctas']
  ];
  for (const [fileId, urlId, folder] of pairs) {
    const input = $(fileId);
    if (!input || input.dataset.firebaseWired) continue;
    input.dataset.firebaseWired = '1';
    input.addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!auth.currentUser) return notify('Para upload real, faça login Firebase. Sem login, o painel pode usar preview local/base64.');
      try {
        notify('Enviando imagem para Firebase Storage...');
        const url = await uploadImage(file, folder);
        const urlInput = $(urlId);
        if (urlInput) { urlInput.value = url; urlInput.dispatchEvent(new Event('input', {bubbles:true})); urlInput.dispatchEvent(new Event('change', {bubbles:true})); }
        input.dataset.firebaseUploaded = '1';
        notify('Imagem enviada para Firebase Storage e URL aplicada.');
      } catch(e){ notify('Erro no upload: ' + (e.message || e)); }
    }, true);
  }
}

onAuthStateChanged(auth, (user) => {
  const st = $('fbStatus'), badge = $('fbBadge');
  if (!st || !badge) return;
  if (user) { st.textContent = `Logado como ${user.email} • projeto ${FIREBASE_PROJECT_ID}`; badge.textContent = 'online'; badge.className = 'fbBadge on'; }
  else { st.textContent = `Projeto: ${FIREBASE_PROJECT_ID} • aguardando login`; badge.textContent = 'offline'; badge.className = 'fbBadge off'; }
});

document.addEventListener('solano:configSaved', () => {
  const btn = $('fbPublish');
  if (btn) btn.classList.add('needsPublish');
  notify('Salvo localmente. Clique em Publicar alterações para enviar ao Firebase.');
});

document.addEventListener('DOMContentLoaded', () => {
  injectFirebasePanel();
  wireStorageUploads();
  setInterval(wireStorageUploads, 1500);
});

window.SolanoFirebasePanel = { publishConfig, loadRemoteConfig, uploadImage, loginAndOpenPanel };
