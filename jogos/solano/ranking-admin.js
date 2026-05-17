import { auth, db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, writeBatch, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const RANKING_COL = collection(db, 'games', 'solano', 'ranking');
const $ = id => document.getElementById(id);
function toast(msg){const t=$('toast'); if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}else alert(msg)}
function fmt(n){return Number(n||0).toLocaleString('pt-BR')}
function download(name, data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function timeAgo(ts){const t=Number(ts||0); if(!t)return 'sem registro'; const m=Math.floor((Date.now()-t)/60000); if(m<1)return 'ativo agora'; if(m<60)return `há ${m} min`; const h=Math.floor(m/60); if(h<24)return `há ${h} h`; return `há ${Math.floor(h/24)} d`}
function requireAuth(){if(!auth.currentUser){toast('Faça login Firebase para gerenciar o ranking.');return false} return true}
async function loadRanking(){
  if(!requireAuth())return;
  const box=$('rankingAdminRows'); box.innerHTML='<p class="muted">Carregando ranking Firebase...</p>';
  try{
    const snap=await getDocs(query(RANKING_COL, orderBy('distance','desc')));
    const rows=[]; snap.forEach(d=>rows.push({id:d.id,...d.data()}));
    $('rankingAdminCount').textContent=rows.length;
    window.__solanoRankingRows=rows;
    box.innerHTML=rows.map((r,i)=>`<div class="itemRow"><div><b>#${i+1}</b></div><div><b>${r.name||'Jogador'}</b><br><small>${r.city||'—'}/${r.uf||'—'} • ${fmt(r.distance)}m • ${fmt(r.score)} pts • ${timeAgo(r.lastActiveAt)}</small><p class="muted">ID: ${r.id}</p></div><div class="rowActions"><button class="miniBtn" data-r-edit="${r.id}">Editar</button><button class="miniBtn" data-r-zero="${r.id}">Zerar</button><button class="miniBtn danger" data-r-del="${r.id}">Remover</button></div></div>`).join('')||'<p class="muted">Nenhum jogador no ranking ainda.</p>';
    box.querySelectorAll('[data-r-del]').forEach(b=>b.onclick=()=>removePlayer(b.dataset.rDel));
    box.querySelectorAll('[data-r-zero]').forEach(b=>b.onclick=()=>zeroPlayer(b.dataset.rZero));
    box.querySelectorAll('[data-r-edit]').forEach(b=>b.onclick=()=>editPlayer(b.dataset.rEdit));
  }catch(e){box.innerHTML=`<p class="muted">Erro ao carregar ranking: ${e.message||e}</p>`;}
}
async function removePlayer(id){if(!requireAuth())return; if(!confirm('Remover este jogador do ranking Firebase?'))return; await deleteDoc(doc(db,'games','solano','ranking',id)); toast('Jogador removido.'); loadRanking()}
async function zeroPlayer(id){if(!requireAuth())return; if(!confirm('Zerar distância e score deste jogador?'))return; await updateDoc(doc(db,'games','solano','ranking',id),{distance:0,score:0,updatedAt:serverTimestamp(),adminAction:'zero'}); toast('Jogador zerado.'); loadRanking()}
async function editPlayer(id){
  if(!requireAuth())return; const r=(window.__solanoRankingRows||[]).find(x=>x.id===id)||{};
  const distance=prompt('Nova distância em metros:', r.distance||0); if(distance===null)return;
  const score=prompt('Novo score:', r.score||0); if(score===null)return;
  const level=prompt('Novo nível:', r.level||1); if(level===null)return;
  await updateDoc(doc(db,'games','solano','ranking',id),{distance:Number(distance)||0,score:Number(score)||0,level:Number(level)||1,updatedAt:serverTimestamp(),adminAction:'edit'});
  toast('Parâmetros do jogador atualizados.'); loadRanking();
}
async function resetRanking(){
  if(!requireAuth())return; if(!confirm('RESETAR TODO O RANKING? Um backup JSON será baixado antes.'))return;
  const snap=await getDocs(RANKING_COL); const rows=[]; const batch=writeBatch(db); snap.forEach(d=>{rows.push({id:d.id,...d.data()}); batch.delete(d.ref)}); download('backup-ranking-solano.json',rows); await batch.commit(); toast('Ranking resetado no Firebase.'); loadRanking();
}
function installUI(){
  const side=document.querySelector('.sideAdmin'); const panel=document.querySelector('#panelArea .panelLayout > div:last-child')||document.querySelector('.panelLayout > div:last-child');
  if(!side||!panel||$('rankingAdmin'))return;
  const label=document.createElement('div'); label.className='sideLabel'; label.textContent='Competição';
  const btn=document.createElement('button'); btn.dataset.view='rankingAdmin'; btn.textContent='Ranking Firebase';
  side.insertBefore(label, side.querySelector('[data-view="users"]') || null); side.insertBefore(btn, side.querySelector('[data-view="users"]') || null);
  const view=document.createElement('div'); view.id='rankingAdmin'; view.className='adminView'; view.innerHTML=`<h2>Ranking Firebase</h2><div class="viewIntro">Gerencie a competição real do jogo. Aqui você pode remover jogador, zerar um usuário, editar parâmetros ou resetar a temporada inteira. Caminho Firestore: <b>games/solano/ranking</b>.</div><div class="adminMetrics"><div><small>Jogadores</small><b id="rankingAdminCount">0</b></div><div><small>Status</small><b>${auth.currentUser?'Online':'Login necessário'}</b></div></div><div class="toolbar"><button id="rankingRefresh" class="primary">Atualizar ranking</button><button id="rankingExport" class="miniBtn">Exportar backup</button><button id="rankingReset" class="miniBtn danger">Resetar ranking</button></div><div id="rankingAdminRows" class="itemRows"><p class="muted">Clique em Atualizar ranking.</p></div>`;
  panel.appendChild(view);
  btn.onclick=()=>{document.querySelectorAll('.sideAdmin button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.adminView').forEach(v=>v.classList.remove('active'));view.classList.add('active');loadRanking()};
  $('rankingRefresh').onclick=loadRanking;
  $('rankingExport').onclick=()=>download('ranking-solano-export.json',window.__solanoRankingRows||[]);
  $('rankingReset').onclick=resetRanking;
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(installUI,500));
