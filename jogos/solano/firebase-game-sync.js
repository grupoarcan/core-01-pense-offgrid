import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

const ADMIN_KEY = 'solano_game_admin_config_v2';
const REMOTE_DOC = doc(db, 'games', 'solano', 'config', 'admin');
const RANKING_COL = collection(db, 'games', 'solano', 'ranking');
const SESSION_KEY = 'solano_remote_config_loaded_v522';

function notify(msg){
  const t = document.getElementById('toast');
  if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
  else console.log(msg);
}
function safeId(v){return String(v||'jogador').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||('player_'+Date.now())}
async function ensureAnonAuth(){
  if(auth.currentUser) return auth.currentUser;
  try{return await signInAnonymously(auth).then(r=>r.user)}catch(e){console.warn('Auth anônimo indisponível para ranking.', e); return null;}
}
async function submitRanking(entry){
  try{
    await ensureAnonAuth();
    const id=safeId((entry.name||'jogador')+'_'+(entry.city||'cidade')+'_'+(entry.uf||'br'));
    const ref=doc(db,'games','solano','ranking',id);
    const snap=await getDoc(ref);
    const old=snap.exists()?snap.data():{};
    const best=Math.max(Number(old.distance||0), Number(entry.distance||0));
    await setDoc(ref,{...old,...entry,distance:best,score:Math.max(Number(old.score||0),Number(entry.score||0)),lastActiveAt:Date.now(),updatedAt:serverTimestamp(),source:'game'}, {merge:true});
    return true;
  }catch(e){console.warn('Falha ao enviar ranking Firebase.', e);return false;}
}
async function loadRanking(){
  try{
    const snap=await getDocs(query(RANKING_COL, orderBy('distance','desc'), limit(50)));
    const list=[]; snap.forEach(d=>list.push({id:d.id,...d.data()}));
    document.dispatchEvent(new CustomEvent('solano:remoteRanking',{detail:list}));
    return list;
  }catch(e){console.warn('Falha ao carregar ranking Firebase.', e);return []}
}
async function syncRemoteConfig(){
  try{
    const snap = await getDoc(REMOTE_DOC);
    if(!snap.exists()) return;
    const data = snap.data();
    if(!data || !data.config) return;
    const remoteJson = JSON.stringify(data.config);
    const localJson = localStorage.getItem(ADMIN_KEY) || '{}';
    if(remoteJson !== localJson){
      localStorage.setItem(ADMIN_KEY, remoteJson);
      if(!sessionStorage.getItem(SESSION_KEY)){
        sessionStorage.setItem(SESSION_KEY, '1');
        notify('Config Firebase carregada. Atualizando jogo...');
        setTimeout(()=>location.reload(), 700);
      } else notify('Config Firebase atualizada para a próxima abertura.');
    }
  }catch(e){console.warn('Firebase indisponível, usando config local.', e);}
}

document.addEventListener('solano:submitRanking', ev=>submitRanking(ev.detail||{}).then(ok=>ok&&loadRanking()));
document.addEventListener('DOMContentLoaded', ()=>{syncRemoteConfig(); ensureAnonAuth().finally(loadRanking)});
setInterval(syncRemoteConfig, 60000);
setInterval(loadRanking, 90000);
window.SolanoRankingSync={submitRanking,loadRanking};
