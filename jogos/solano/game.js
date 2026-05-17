(()=>{
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("game");
const ctx=canvas.getContext("2d");
const SAVE="solano_v519_painel_profissional";
const ADMIN_CONFIG_KEY="solano_game_admin_config_v2";
const DEFAULT_ADMIN_CONFIG={
  auth:{email:"admin@solano.local",password:"solano123",users:[{email:"admin@solano.local",password:"solano123",role:"superadmin"}]},
  runner:{baseSpeed:340,maxSpeed:680,resumeInvulnerabilitySeconds:4,jumpForce:780,gravity:1650,lives:3,spawnRate:1,lootRate:1,healthMode:"lives"},
  economy:{defaultKwhPrice:.30,resaleRate:.70,panelWhPerMinuteFactor:.012,inverterWhPerMinuteCapFactor:.10,systemEfficiency:.86,batteryChargeEfficiency:.94,solarFactor:1},
  plant:{starterPanelsWp:120,starterBatteriesWh:300,starterInverterW:600,stringBoxLabel:"STRING BOX",stringBoxImage:"",drLabel:"DR",drImage:"",panelFallbackImage:"",advancedRulesEnabled:true,maxPanelsPerString:10,maxStringsSimple:1,maxStringsEpic:2,adaptivePanelStringLimit:true,lowWpExtraPanelsPer100:2,enforceSamePanelWp:true,enforceVoltageCompatibility:false,defaultBatteryVoltage:12,allowParallelInverters:true,solarCycleEnabled:true,fullSunHours:5,nightGenerationFactor:0,dayCycleMinutes:12},
  catalog:{customShopItems:[]},
  ads:{enabled:false,intervalSeconds:600,displaySeconds:8,items:[
    {id:"cta_grupo_ofertas",title:"Grupo de ofertas OffGrid",text:"Quer acompanhar ofertas reais de inversores, baterias e ferramentas?",description:"Abra em nova aba sem perder a corrida.",link:"https://viapromo.netlify.app/",image:"",type:"whatsapp",active:true}
  ]}
};
function deepMerge(a,b){const out=Array.isArray(a)?[...a]:{...(a||{})};for(const k in (b||{})){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))out[k]=deepMerge(out[k]||{},b[k]);else out[k]=b[k]}return out}
function readAdminConfig(){try{return deepMerge(DEFAULT_ADMIN_CONFIG,JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY)||"{}"))}catch(e){return deepMerge(DEFAULT_ADMIN_CONFIG,{})}}
function saveAdminConfig(cfg){localStorage.setItem(ADMIN_CONFIG_KEY,JSON.stringify(cfg))}
const ADMIN_CONFIG=readAdminConfig();
const GAME_CONFIG=deepMerge(window.SOLANO_GAME_CONFIG||{},ADMIN_CONFIG||{});
const RUNNER_CONFIG=GAME_CONFIG.runner||{};
const ECONOMY_CONFIG=GAME_CONFIG.economy||{};
const CONTROL_SCHEMA=GAME_CONFIG.adminSchema||{};
const CUSTOM_SHOP_ITEMS=(GAME_CONFIG.catalog&&GAME_CONFIG.catalog.customShopItems)||[];


const INV=[
{id:"inv_sumry_3kw",name:"SUMRY 3kW 24V",rarity:"comum",chance:31,cpo:.75,w:35,color:"#94a3b8"},
{id:"inv_felicity_5kw",name:"Felicity 5kW 48V",rarity:"comum",chance:24,cpo:.90,w:45,color:"#e5e7eb"},
{id:"inv_anenji_4kw",name:"ANENJI 4kW 24V",rarity:"colecionável",chance:12,cpo:1.35,w:70,color:"#facc15"},
{id:"inv_anenji_62kw",name:"ANENJI 6.2kW 48V",rarity:"raro",chance:9,cpo:2.10,w:110,color:"#38bdf8"},
{id:"inv_swipower_62kw",name:"Swipower 6.2kW 48V",rarity:"raro",chance:8,cpo:1.90,w:100,color:"#22d3ee"},
{id:"inv_sumry_62kw",name:"SUMRY 6.2kW 48V",rarity:"raro",chance:8,cpo:1.80,w:95,color:"#0ea5e9"},
{id:"inv_anenji_11kw",name:"ANENJI 11kW 48V",rarity:"épico",chance:3,cpo:5,w:220,color:"#a855f7"}
];
const imgs={};INV.forEach(i=>{imgs[i.id]=new Image();imgs[i.id].src=`assets/itens/inversores/${i.id}.png`});
const RARITY_ORDER={"comum":1,"colecionavel":2,"colecionável":2,"raro":3,"epico":4,"épico":4};
const PANELS=(GAME_CONFIG.catalog&&GAME_CONFIG.catalog.panels)||[
{id:"panel_100wp",type:"panel",name:"Painel Solar 100Wp",brand:"Linha Base",rarity:"comum",wp:100,price:44,desc:"Aumenta a potência instalada da usina.",effect:"+100 Wp",image:"assets/itens/paineis/panel_100wp.png"},
{id:"panel_200wp",type:"panel",name:"Painel Solar 200Wp",brand:"Linha Base",rarity:"comum",wp:200,price:86,desc:"Evolução equilibrada para gerar mais energia passiva.",effect:"+200 Wp",image:"assets/itens/paineis/panel_200wp.png"},
{id:"panel_300wp",type:"panel",name:"Painel Solar 300Wp",brand:"Linha Forte",rarity:"colecionável",wp:300,price:132,desc:"Boa expansão para usinas médias.",effect:"+300 Wp",image:"assets/itens/paineis/panel_300wp.png"},
{id:"panel_450wp",type:"panel",name:"Painel Solar 450Wp",brand:"Linha Pro",rarity:"raro",wp:450,price:245,desc:"Salto forte na produção de energia.",effect:"+450 Wp",image:"assets/itens/paineis/panel_450wp.png"},
{id:"panel_550wp",type:"panel",name:"Painel Solar 550Wp",brand:"Linha Pro",rarity:"raro",wp:550,price:330,desc:"Painel moderno para alta geração.",effect:"+550 Wp",image:"assets/itens/paineis/panel_550wp.png"},
{id:"panel_700wp",type:"panel",name:"Painel Solar 700Wp",brand:"Linha Elite",rarity:"épico",wp:700,price:520,desc:"Painel de elite para acelerar a evolução da usina.",effect:"+700 Wp",image:"assets/itens/paineis/panel_700wp.png"}
];
const BATTERIES=(GAME_CONFIG.catalog&&GAME_CONFIG.catalog.batteries)||[
{id:"bat_100ah",type:"battery",name:"Bateria 100Ah",brand:"Linha Base",rarity:"comum",ah:100,wh:1200,price:76,desc:"Aumenta o banco de armazenamento da usina.",effect:"+1.200 Wh",image:"assets/itens/baterias/bat_100ah.png"},
{id:"bat_200ah",type:"battery",name:"Bateria 200Ah",brand:"Linha Base",rarity:"comum",ah:200,wh:2400,price:150,desc:"Mais autonomia para guardar energia.",effect:"+2.400 Wh",image:"assets/itens/baterias/bat_200ah.png"},
{id:"bat_300ah",type:"battery",name:"Bateria 300Ah",brand:"Linha Forte",rarity:"colecionável",ah:300,wh:3600,price:235,desc:"Banco intermediário para uma usina mais séria.",effect:"+3.600 Wh",image:"assets/itens/baterias/bat_300ah.png"},
{id:"bat_400ah",type:"battery",name:"Bateria 400Ah",brand:"Linha Pro",rarity:"raro",ah:400,wh:4800,price:340,desc:"Grande reserva para vender energia com mais frequência.",effect:"+4.800 Wh",image:"assets/itens/baterias/bat_400ah.png"},
{id:"bat_500ah",type:"battery",name:"Bateria 500Ah",brand:"Linha Elite",rarity:"épico",ah:500,wh:6000,price:460,desc:"Banco de elite para armazenamento robusto.",effect:"+6.000 Wh",image:"assets/itens/baterias/bat_500ah.png"}
];
const TOOLS=(GAME_CONFIG.catalog&&GAME_CONFIG.catalog.tools)||[
{id:"tool_stringbox",type:"tool",name:"String Box",rarity:"comum",price:85,desc:"Proteção do lado dos painéis. Reduz penalidade de segurança da usina e prepara regras de strings.",effect:"Remove penalidade de String Box",image:"assets/itens/ferramentas/stringbox.png"},
{id:"tool_dr",type:"tool",name:"DR de Proteção",rarity:"comum",price:75,desc:"Dispositivo de proteção contra choque/fuga de corrente no lado AC da usina.",effect:"Remove penalidade de DR",image:"assets/itens/ferramentas/dr.png"},
{id:"tool_kit_tecnico",type:"tool",name:"Kit Técnico",rarity:"comum",price:55,desc:"Conjunto básico para acelerar evolução técnica.",effect:"+50 XP",icon:"🧰"},
{id:"tool_multimetro",type:"tool",name:"Multímetro",rarity:"colecionável",price:120,desc:"Ferramenta essencial para medições e upgrades futuros.",effect:"+90 XP",icon:"📟"},
{id:"tool_alicate",type:"tool",name:"Alicate de Crimpar",rarity:"raro",price:180,desc:"Prepara o universo de ferramentas avançadas.",effect:"+130 XP",icon:"🛠️"},
{id:"tool_fonte",type:"tool",name:"Fonte Carregadora",rarity:"épico",price:280,desc:"Item avançado para futuras mecânicas de bateria.",effect:"+220 XP",icon:"🔋"}
];
const SHOP_ITEMS=[...PANELS,...BATTERIES,...INV.map(i=>({id:i.id,type:"inverter",name:i.name,rarity:i.rarity,price:Math.max(65,Math.round(i.w*2.2)),desc:"Inversor instalável que aumenta a capacidade AC da usina.",effect:`+${i.w} W no inversor`,image:`assets/itens/inversores/${i.id}.png`,w:i.w})),...TOOLS,...CUSTOM_SHOP_ITEMS];
function latestCustomItems(){const cfg=readAdminConfig();return ((cfg.catalog&&cfg.catalog.customShopItems)||[]).filter(i=>i&&i.id)}
function baseShopItems(){return [...PANELS,...BATTERIES,...INV.map(i=>({id:i.id,type:"inverter",name:i.name,rarity:i.rarity,price:Math.max(65,Math.round(i.w*2.2)),desc:"Inversor instalável que aumenta a capacidade AC da usina e destrava geração maior.",effect:`+${i.w} W no inversor`,image:`assets/itens/inversores/${i.id}.png`,w:i.w})),...TOOLS]}
function applyItemOverrides(items){const cfg=readAdminConfig();const overrides=(cfg.catalog&&cfg.catalog.itemOverrides)||{};const disabled=new Set((cfg.catalog&&cfg.catalog.disabledItemIds)||[]);return items.map(it=>({...it,...(overrides[it.id]||{})})).filter(i=>i.status!=="inactive"&&!disabled.has(i.id))}
function allShopItems(){const latest=latestCustomItems();return [...applyItemOverrides(baseShopItems()),...latest].filter(i=>i.status!=="inactive")}
function catalogItemById(id){return allShopItems().find(i=>i.id===id)||SHOP_ITEMS.find(i=>i.id===id)}
function itemSpecs(it){it=it||{};const sp=it.specs||{};return {wp:Number(sp.wp||it.wp||it.power||0),wh:Number(sp.wh||it.wh||it.power||0),w:Number(sp.w||it.w||it.power||0),ah:Number(sp.ah||it.ah||0),tensao:Number(sp.tensao||sp.voltage||0),tensaoBanco:Number(sp.tensaoBanco||sp.voltageBank||0),corrente:Number(sp.corrente||sp.current||0),maxSolarWp:Number(sp.maxSolarWp||0),mppt:Number(sp.mppt||0),strings:Number(sp.strings||0),permiteParalelo:!!sp.permiteParalelo,limiteParalelo:Number(sp.limiteParalelo||0)}}
function itemRules(it){it=it||{};const rg=it.regras||{};return {maxPorString:Number(rg.maxPorString||0),permiteMistura:!!rg.permiteMistura,nivelErro:rg.nivelErro||currentPlantConfig().panelMixSeverity||"trava",penalidadeMistura:Number(rg.penalidadeMistura||.25)}}
function severityBlocks(level){return level==="trava"||level==="risco"||level==="critico"}
function inferVoltageFromName(name){const m=String(name||"").match(/(12|24|48)s*V/i);return m?Number(m[1]):0}
function dominantInverterVoltage(){const inv=dominantInverter();if(!inv)return 0;const sp=itemSpecs(inv);return sp.tensaoBanco||inferVoltageFromName(inv.name)||0}
function installedBatteryVoltages(){return Object.entries(state.plant.installedBatteries||{}).filter(([id,q])=>Number(q)>0).map(([id])=>{const it=catalogItemById(id);const sp=itemSpecs(it);return sp.tensao||Number(currentPlantConfig().defaultBatteryVoltage||0)}).filter(Boolean)}

function ensureInventoryKey(id){if(id&&state.plant.inventory[id]===undefined)state.plant.inventory[id]=0}


const state={
player:null,w:1000,h:520,dpr:1,ground:0,running:false,paused:false,last:0,time:0,distance:0,best:0,runCpo:0,combo:1,lives:3,speed:340,spawnTimer:.9,platformTimer:2.2,lootTimer:.35,shield:0,magnet:0,turbo:0,invulnerable:0,obstacles:[],platforms:[],loots:[],particles:[],ranking:[],feed:[],price:Number(ECONOMY_CONFIG.defaultKwhPrice||.30),dailyClaimed:"",configReady:true,adPause:false,adTimer:0,currentAd:null,
runStats:{items:0,rare:0,epic:0,drops:[]},
plant:{wallet:28,storedWh:80,panelsWp:Number((GAME_CONFIG.plant||{}).starterPanelsWp||120),batteriesWh:Number((GAME_CONFIG.plant||{}).starterBatteriesWh||300),inverterW:Number((GAME_CONFIG.plant||{}).starterInverterW||600),soldWh:0,lostWh:0,xp:0,level:1,inventory:{panel:0,battery:0,cable:0,plug:0,controller:0,inverter:0},installedInverters:{},installedBatteries:{},installedPanels:{},tools:{}},
runner:{x:120,y:0,w:52,h:82,vy:0,jumps:0,grounded:true,sliding:false}
};
INV.forEach(i=>{state.plant.inventory[i.id]=0;state.plant.installedInverters[i.id]=0});PANELS.forEach(i=>{state.plant.inventory[i.id]=0;state.plant.installedPanels[i.id]=0});BATTERIES.forEach(i=>{state.plant.inventory[i.id]=0;state.plant.installedBatteries[i.id]=0});TOOLS.forEach(i=>{state.plant.inventory[i.id]=0;state.plant.tools[i.id]=0});CUSTOM_SHOP_ITEMS.forEach(i=>{state.plant.inventory[i.id]=0;if(i.type==="inverter")state.plant.installedInverters[i.id]=0;if(i.type==="battery")state.plant.installedBatteries[i.id]=0;if(i.type==="panel")state.plant.installedPanels[i.id]=0});

function fmt(n,d=0){return Number(n).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d})}
function fmtEnergyWh(wh,d=1){wh=Number(wh)||0;return wh>=1000?fmt(wh/1000,d)+" kWh":fmt(wh,0)+" Wh"}
function fmtPowerW(w,d=1){w=Number(w)||0;return w>=1000?fmt(w/1000,d)+" kW":fmt(w,0)+" W"}
function load(){try{let raw=localStorage.getItem(SAVE);if(raw){let s=JSON.parse(raw);if(s.player)state.player=s.player;if(s.best)state.best=s.best;if(s.ranking)state.ranking=s.ranking;if(s.dailyClaimed)state.dailyClaimed=s.dailyClaimed;if(s.plant)Object.assign(state.plant,s.plant)}}catch(e){}state.plant.lostWh??=0;if(!state.plant.inventory)state.plant.inventory={};if(!state.plant.installedInverters)state.plant.installedInverters={};if(!state.plant.installedBatteries)state.plant.installedBatteries={};if(!state.plant.installedPanels)state.plant.installedPanels={};if(!state.plant.tools)state.plant.tools={};["panel","battery","cable","plug","controller","inverter"].forEach(k=>state.plant.inventory[k]??=0);INV.forEach(i=>{state.plant.inventory[i.id]??=0;state.plant.installedInverters[i.id]??=0});PANELS.forEach(i=>{state.plant.inventory[i.id]??=0;state.plant.installedPanels[i.id]??=0});BATTERIES.forEach(i=>{state.plant.inventory[i.id]??=0;state.plant.installedBatteries[i.id]??=0});TOOLS.forEach(i=>{state.plant.inventory[i.id]??=0;state.plant.tools[i.id]??=0});CUSTOM_SHOP_ITEMS.forEach(i=>{state.plant.inventory[i.id]??=0;if(i.type==="inverter")state.plant.installedInverters[i.id]??=0;if(i.type==="battery")state.plant.installedBatteries[i.id]??=0;if(i.type==="panel")state.plant.installedPanels[i.id]??=0});if(state.player)$("gate").classList.remove("active")}
function save(){localStorage.setItem(SAVE,JSON.stringify({player:state.player,best:state.best,ranking:state.ranking,dailyClaimed:state.dailyClaimed,plant:state.plant}))}
function resize(){let r=canvas.parentElement.getBoundingClientRect();state.dpr=Math.min(window.devicePixelRatio||1,2);state.w=Math.max(320,Math.floor(r.width));state.h=Math.max(320,Math.floor(r.height));canvas.width=Math.floor(state.w*state.dpr);canvas.height=Math.floor(state.h*state.dpr);ctx.setTransform(state.dpr,0,0,state.dpr,0,0);state.ground=state.h-78;state.runner.y=Math.min(state.runner.y||state.ground-state.runner.h,state.ground-state.runner.h)}
function toast(m){let t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1400);feed(m)}
function feed(m){state.feed.unshift({m,t:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});state.feed=state.feed.slice(0,7);renderFeed()}
function notice(m){let n=$("notice");n.textContent=m;n.classList.add("show");clearTimeout(notice.t);notice.t=setTimeout(()=>n.classList.remove("show"),1200)}
function itemToast(title,text,img){let el=$("itemToast");el.innerHTML=`${img?`<img src="${img}">`:"<b>⚡</b>"}<div><b>${title}</b><br><small>${text}</small></div>`;el.classList.add("show");clearTimeout(itemToast.t);itemToast.t=setTimeout(()=>el.classList.remove("show"),1150)}
function shake(){let w=$("canvasWrap");w.classList.remove("shake");void w.offsetWidth;w.classList.add("shake")}
function currentEconomy(){return deepMerge(DEFAULT_ADMIN_CONFIG.economy,readAdminConfig().economy||{})}
function currentPlantConfig(){return deepMerge(DEFAULT_ADMIN_CONFIG.plant,readAdminConfig().plant||{})}
function panelStringLimitByWp(wp){const pc=currentPlantConfig();const base=Number(pc.maxPanelsPerString||10);if(!pc.adaptivePanelStringLimit)return base;wp=Number(wp||0);if(!wp||wp>=400)return base;const steps=Math.ceil((400-wp)/100);return base+steps*Number(pc.lowWpExtraPanelsPer100||2)}
function activeStringLimit(){
  const pc=currentPlantConfig();
  const inv=dominantInverter();
  const invRank=inv?rarityRank(inv.rarity):1;
  const isp=inv?itemSpecs(inv):{};
  const strings=isp.strings||isp.mppt||(invRank>=4?Number(pc.maxStringsEpic||2):Number(pc.maxStringsSimple||1));
  const panel=dominantPanel();
  const pr=panel?itemRules(panel):{};
  const perString=pr.maxPorString||panelStringLimitByWp(panel&&(itemSpecs(panel).wp||panel.wp||panel.power));
  const maxSolarWp=isp.maxSolarWp||0;
  let total=Math.max(1,strings*perString);
  if(maxSolarWp&&panel){const pwp=itemSpecs(panel).wp||panel.wp||panel.power||100;total=Math.min(total,Math.max(1,Math.floor(maxSolarWp/pwp)));}
  return {strings,perString,total,invRank,inv,maxSolarWp};
}
function installedProtectionCount(kind){
  const tools=state.plant.tools||{};
  const inv=state.plant.inventory||{};
  const ids=kind==="stringbox"?["stringbox","string_box","tool_stringbox","tool_string_box","string_box_protecao"]:["dr","tool_dr","dispositivo_dr"];
  return ids.reduce((sum,id)=>sum+Number(tools[id]||0)+Number(inv[id]||0),0);
}
function plantGargaloWarnings(st){
  const warnings=[];
  if(st.panelCount>st.stringTotalLimit)warnings.push(`String sobrecarregada: ${st.panelCount} painéis instalados para limite de ${st.stringTotalLimit}.`);
  if(st.panelRaw>st.inverterCap*1.05)warnings.push("Inversor saturado: instale inversor mais forte para liberar geração.");
  if(st.batteryFull)warnings.push("Bateria cheia: energia excedente pode ser desperdiçada.");
  if(st.stringBoxPenalty>0)warnings.push("Sem String Box instalada: eficiência reduzida por segurança/proteção.");
  if(st.drPenalty>0)warnings.push("Sem DR instalado: eficiência reduzida por proteção elétrica.");
  if(!warnings.length)warnings.push(`Sistema equilibrado: eficiência atual ${fmt(st.finalEfficiency*100,0)}%.`);
  return warnings;
}
function plantEnergyStats(){
  const eco=currentEconomy();
  const solar=Number(eco.solarFactor||1);
  const panelFactor=Number(eco.panelWhPerMinuteFactor||.012);
  const inverterFactor=Number(eco.inverterWhPerMinuteCapFactor||.10);
  const baseEfficiency=Math.max(.1,Math.min(1,Number(eco.systemEfficiency||.86)));
  const chargeEff=Math.max(.1,Math.min(1,Number(eco.batteryChargeEfficiency||.94)));
  const panelCount=Object.values(state.plant.installedPanels||{}).reduce((a,b)=>a+(Number(b)||0),0)||Math.ceil((state.plant.panelsWp||0)/100);
  const sl=activeStringLimit();
  const stringOverflow=Math.max(0,panelCount-sl.total);
  const stringPenalty=stringOverflow>0?Math.min(.35,.08+stringOverflow*.025):0;
  const stringBoxPenalty=installedProtectionCount("stringbox")>0?0:.05;
  const drPenalty=installedProtectionCount("dr")>0?0:.03;
  const finalEfficiency=Math.max(.25,baseEfficiency-stringPenalty-stringBoxPenalty-drPenalty);
  const panelRaw=Math.max(0,state.plant.panelsWp*panelFactor*solar);
  const stringCap=panelRaw*Math.max(.35,1-stringPenalty);
  const inverterCap=Math.max(0,state.plant.inverterW*inverterFactor);
  const clipped=Math.min(panelRaw,stringCap,inverterCap);
  const stringLoss=Math.max(0,panelRaw-stringCap);
  const clippingLoss=Math.max(0,Math.min(panelRaw,stringCap)-inverterCap);
  const inverterLoss=Math.max(0,clipped*(1-finalEfficiency));
  const afterSystem=clipped*finalEfficiency;
  const chargeLoss=Math.max(0,afterSystem*(1-chargeEff));
  const toBattery=afterSystem*chargeEff;
  const batteryFull=state.plant.batteriesWh>0&&state.plant.storedWh>=state.plant.batteriesWh*.96;
  let limitedBy="painéis";
  if(panelRaw>inverterCap*1.05)limitedBy="inversor";
  if(stringOverflow>0)limitedBy="strings";
  if(batteryFull)limitedBy="bateria";
  return {panelRaw,stringCap,inverterCap,clipped,afterSystem,toBattery,technicalLossPerMin:clippingLoss+inverterLoss+chargeLoss+stringLoss,stringLoss,clippingLoss,inverterLoss,chargeLoss,efficiency:baseEfficiency,finalEfficiency,chargeEff,solar,limitedBy,panelCount,stringOverflow,stringTotalLimit:sl.total,stringPerString:sl.perString,strings:sl.strings,stringPenalty,stringBoxPenalty,drPenalty,batteryFull};
}
function genPotential(){return plantEnergyStats().panelRaw}
function inverterGenerationCap(){return plantEnergyStats().inverterCap}
function genMin(){return plantEnergyStats().toBattery}
function genLimitReason(){let st=plantEnergyStats();return ({inversor:"inversor limitando a geração",strings:"limite de strings reduzindo eficiência",bateria:"bateria cheia desperdiçando energia",painéis:"painéis definem a geração"})[st.limitedBy]||"sistema equilibrado"}
function plantAdvice(){
  const st=plantEnergyStats();
  if(st.batteryFull)return "Banco quase cheio: venda energia ou instale mais baterias.";
  if(st.stringOverflow>0)return `String sobrecarregada: remova painéis ou instale inversor/MPPT superior. Limite atual: ${st.stringTotalLimit} painéis.`;
  if(st.panelRaw>st.inverterCap*1.08)return "Seu inversor virou gargalo: instale inversor mais forte.";
  if(st.stringBoxPenalty>0)return "Instale String Box para reduzir perdas e preparar proteção da usina.";
  if(st.drPenalty>0)return "Instale DR para melhorar segurança e eficiência do sistema.";
  if(state.plant.panelsWp<state.plant.inverterW*.35)return "Há folga no inversor: mais painéis aumentam a geração.";
  return "Sistema equilibrado: painéis, inversor e bateria trabalhando juntos.";
}
function rarityRank(r){return RARITY_ORDER[String(r||"comum").toLowerCase()]||1}
function dominantByRarity(catalog,installed){let best=null;for(let item of catalog){let qty=installed&&installed[item.id]||0;if(qty<=0)continue;if(!best||rarityRank(item.rarity)>rarityRank(best.rarity)||(rarityRank(item.rarity)===rarityRank(best.rarity)&&qty>(installed[best.id]||0))){best=item}}return best}
function normalizeImageUrl(src){src=String(src||"").trim();if(!src)return"";let m=src.match(/imgur\.com\/(?:gallery\/|a\/)?([A-Za-z0-9]+)(?:\.[a-zA-Z]+)?/);if(m&&!src.includes("i.imgur.com"))return `https://i.imgur.com/${m[1]}.png`;return src}
function imageHtml(src,fallback,cls=""){src=normalizeImageUrl(src);return src?`<img class="${cls}" src="${src}" onerror="this.replaceWith(document.createTextNode('▣'))">`:fallback}
function timeAgo(ts){if(!ts)return"sem atividade";let sec=Math.max(0,Math.floor((Date.now()-ts)/1000));if(sec<45)return"ativo agora";if(sec<90)return"há 1 minuto";if(sec<3600)return`há ${Math.floor(sec/60)} min`;if(sec<7200)return"há 1 hora";if(sec<86400)return`há ${Math.floor(sec/3600)} h`;return`há ${Math.floor(sec/86400)} d`}
function ensureStartOverlay(){if(!state.running&&!state.paused&&!$("resultOverlay").classList.contains("active"))$("startOverlay").classList.add("active")}
function scoreOf(distance=state.best){return Math.floor(distance + state.plant.panelsWp*1.5 + state.plant.batteriesWh*.25 + state.plant.inverterW*.45 + state.plant.soldWh*.02)}
function comboName(){if(state.combo>=4.6)return"MODO USINA";if(state.combo>=3.7)return"OVERLOAD";if(state.combo>=2.8)return"POTÊNCIA";if(state.combo>=1.8)return"OTIMIZANDO";return"NORMAL"}

function startRun(){state.running=true;state.paused=false;state.distance=0;state.runCpo=0;state.combo=1;state.lives=3;state.speed=Number(RUNNER_CONFIG.baseSpeed||340);state.shield=0;state.magnet=0;state.turbo=0;state.invulnerable=0;state.obstacles=[];state.platforms=[];state.loots=[];state.particles=[];state.runStats={items:0,rare:0,epic:0,drops:[]};state.spawnTimer=Number(RUNNER_CONFIG.initialObstacleTimer||.9);state.platformTimer=Number(RUNNER_CONFIG.initialPlatformTimer||2.1);state.lootTimer=Number(RUNNER_CONFIG.initialLootTimer||.35);let p=state.runner;p.y=state.ground-p.h;p.vy=0;p.jumps=0;p.grounded=true;p.sliding=false;$("startOverlay").classList.remove("active");$("resultOverlay").classList.remove("active");$("resumeOverlay").classList.remove("show");notice("Missão iniciada")}
function finishRun(reason){state.running=false;state.paused=false;let dist=Math.floor(state.distance);state.best=Math.max(state.best,dist);state.plant.wallet+=state.runCpo;state.plant.xp+=Math.floor(dist/25);state.plant.level=1+Math.floor(state.plant.xp/120);let entry={name:state.player?.name||"Jogador",city:state.player?.city||"—",uf:state.player?.uf||"—",distance:dist,cpo:state.runCpo.toFixed(2),score:scoreOf(dist),level:state.plant.level,lastActiveAt:Date.now()};state.ranking.push(entry);state.ranking=state.ranking.sort((a,b)=>(b.distance||0)-(a.distance||0)||(b.score||0)-(a.score||0)).slice(0,10);document.dispatchEvent(new CustomEvent('solano:submitRanking',{detail:entry}));renderResult(dist);$("resultOverlay").classList.add("active");$("startOverlay").classList.remove("active");save();renderRanking();renderMissions();updateUI()}
function damage(reason){if(state.invulnerable>0)return;if(state.shield>0){state.shield=0;state.invulnerable=Number(RUNNER_CONFIG.shieldBreakInvulnerabilitySeconds||1.2);itemToast("ESCUDO QUEBRADO","impacto absorvido");shake();return}state.lives--;shake();burst(state.runner.x+28,state.runner.y+40,"#ef4444",window.innerWidth<=720?20:38);if(state.lives<=0){finishRun(reason);return}state.running=false;state.paused=true;state.runner.sliding=false;$("resumeOverlay").classList.add("show");itemToast("-1 VIDA","toque para continuar")}
function resumeRun(){if(state.adPause)return;if(!state.paused)return;state.paused=false;state.running=true;state.invulnerable=Number(RUNNER_CONFIG.resumeInvulnerabilitySeconds||4);$("resumeOverlay").classList.remove("show");notice(`Invencível por ${state.invulnerable.toFixed(0)}s`)}
function jump(){if(!state.running)return;let p=state.runner;if(p.jumps<2){p.vy=p.jumps?-670:-820;p.jumps++;p.grounded=false}}
function slide(on){if(state.running)state.runner.sliding=on}
function chooseInv(){let total=INV.reduce((s,i)=>s+i.chance,0),r=Math.random()*total;for(let i of INV){r-=i.chance;if(r<=0)return i}return INV[0]}
function spawnObstacle(){let upper=state.distance>220&&Math.random()<.38;if(upper){state.obstacles.push({x:state.w+55,y:state.ground-112,w:110,h:28,upper:true,hit:false});return}let h=42+Math.random()*52;state.obstacles.push({x:state.w+55,y:state.ground-h,w:48+Math.random()*30,h,upper:false,hit:false})}
function spawnPlatform(){let y=state.ground-(145+Math.random()*92),w=150+Math.random()*100;state.platforms.push({x:state.w+70,y,w,h:16})}
function chooseCatalogLoot(){
  const candidates=allShopItems().filter(i=>["panel","battery","inverter","tool"].includes(i.type));
  if(!candidates.length)return null;
  const weights={"comum":38,"colecionavel":16,"colecionável":16,"raro":7,"epico":2,"épico":2};
  let total=candidates.reduce((sum,item)=>sum+(weights[String(item.rarity||"comum").toLowerCase()]||10),0);
  let r=Math.random()*total;
  for(const item of candidates){r-=weights[String(item.rarity||"comum").toLowerCase()]||10;if(r<=0)return item}
  return candidates[0];
}
function spawnLoot(){
  const powerups=["shield","magnet","turbo","heart"];
  if(Math.random()<.16){let type=powerups[Math.floor(Math.random()*powerups.length)];state.loots.push({x:state.w+55,y:state.ground-120-Math.random()*145,r:24,type,dead:false});return}
  const item=chooseCatalogLoot();
  if(item){state.loots.push({x:state.w+55,y:state.ground-150-Math.random()*135,r:item.type==="inverter"?30:26,type:item.id,item,dead:false});return}
  state.loots.push({x:state.w+55,y:state.ground-120-Math.random()*145,r:24,type:"cable",dead:false})
}
function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function collect(l){l.dead=true;state.runStats.items++;if(l.type==="heart"){if(state.lives<3)state.lives++;itemToast("VIDA EXTRA","+1 vida");burst(l.x,l.y,"#ef4444",16);return}if(l.type==="shield"){state.shield=7;itemToast("ESCUDO","proteção temporária");return}if(l.type==="magnet"){state.magnet=8;itemToast("IMÃ","atrai peças");return}if(l.type==="turbo"){state.turbo=6;itemToast("TURBO","velocidade temporária");return}if(l.item){let item=l.item;ensureInventoryKey(item.id);state.plant.inventory[item.id]=(state.plant.inventory[item.id]||0)+1;if(rarityRank(item.rarity)>=3)state.runStats.rare++;if(rarityRank(item.rarity)>=4)state.runStats.epic++;state.runStats.drops.push({name:item.name,img:item.image});let gain=Number(item.cpo||({panel:.35,battery:.48,inverter:.90,tool:.25}[item.type]||.15))*(1+(state.combo-1)*.14);state.runCpo+=gain;state.combo=Math.min(5,state.combo+(rarityRank(item.rarity)>=4?.65:.22));itemToast(item.name||label(item.type),(item.effect||item.desc||"guardado no inventário")+" • +"+gain.toFixed(2)+" CPO",item.image||"");burst(l.x,l.y,rarityRank(item.rarity)>=4?"#a855f7":rarityRank(item.rarity)>=3?"#38bdf8":"#ff7a18",rarityRank(item.rarity)>=4?44:22);save();renderInventory();return}if(l.inv){let inv=l.inv;state.plant.inventory[inv.id]=(state.plant.inventory[inv.id]||0)+1;if(inv.rarity==="raro"||inv.rarity==="colecionável")state.runStats.rare++;if(inv.rarity==="épico")state.runStats.epic++;state.runStats.drops.push({name:inv.name,img:`assets/itens/inversores/${inv.id}.png`});let gain=inv.cpo*(1+(state.combo-1)*.14);state.runCpo+=gain;state.combo=Math.min(5,state.combo+(inv.rarity==="épico"?.75:.28));itemToast(inv.rarity==="épico"?"INVERSOR ÉPICO":`INVERSOR ${inv.rarity.toUpperCase()}`,`${inv.name} • +${gain.toFixed(2)} CPO`,`assets/itens/inversores/${inv.id}.png`);burst(l.x,l.y,inv.color,inv.rarity==="épico"?48:26);save();renderInventory();return}let base={panel:.3,battery:.45,cable:.12,plug:.18,controller:.55,inverter:.4}[l.type]||.1;state.plant.inventory[l.type]=(state.plant.inventory[l.type]||0)+1;state.runCpo+=base;state.combo=Math.min(5,state.combo+.16);state.runStats.drops.push({name:label(l.type)});itemToast(label(l.type),"guardado no inventário");burst(l.x,l.y,"#ff7a18",14);renderInventory()}
function label(t){return{panel:"PAINEL",battery:"BATERIA",cable:"CABO",plug:"TOMADA",controller:"CONTROLADOR",inverter:"INVERSOR"}[t]||t.toUpperCase()}

let plantFxTimer=0;
function update(dt){state.time+=dt;checkAdPause(dt);let stEnergy=plantEnergyStats();let producedTick=stEnergy.toBattery*(dt/60);let room=Math.max(0,state.plant.batteriesWh-state.plant.storedWh);let storedTick=Math.min(room,producedTick);let overflowLoss=Math.max(0,producedTick-storedTick);state.plant.storedWh=Math.min(state.plant.batteriesWh,state.plant.storedWh+storedTick);state.plant.lostWh=(state.plant.lostWh||0)+(stEnergy.technicalLossPerMin*(dt/60))+overflowLoss;plantFxTimer-=dt;if(plantFxTimer<=0){plantFxTimer=window.innerWidth<=720?2.7:1.4;if(window.innerWidth>720||window.scrollY>180)spawnEnergyFx()}if(!state.running){updateParticles(dt);return}if(state.invulnerable>0)state.invulnerable=Math.max(0,state.invulnerable-dt);if(state.shield>0)state.shield-=dt;if(state.magnet>0)state.magnet-=dt;if(state.turbo>0)state.turbo-=dt;state.speed=Math.min(Number(RUNNER_CONFIG.maxSpeed||680),(Number(RUNNER_CONFIG.baseSpeed||340)+state.distance*Number(RUNNER_CONFIG.distanceSpeedFactor||.045))*(state.turbo>0?Number(RUNNER_CONFIG.turboMultiplier||1.18):1));state.distance+=(state.speed*dt)/8.5;let p=state.runner;p.h=(p.sliding&&p.grounded)?46:82;p.vy+=1650*dt;p.y+=p.vy*dt;if(p.y+p.h>=state.ground){p.y=state.ground-p.h;p.vy=0;p.grounded=true;p.jumps=0}state.spawnTimer-=dt;if(state.spawnTimer<=0){state.spawnTimer=Number(RUNNER_CONFIG.obstacleTimerBase||.9)+Math.random()*Number(RUNNER_CONFIG.obstacleTimerRandom||.62);spawnObstacle()}state.platformTimer-=dt;if(state.platformTimer<=0){state.platformTimer=Number(RUNNER_CONFIG.platformTimerBase||2.4)+Math.random()*Number(RUNNER_CONFIG.platformTimerRandom||1.5);spawnPlatform()}state.lootTimer-=dt;if(state.lootTimer<=0){state.lootTimer=Number(RUNNER_CONFIG.lootTimerBase||.65)+Math.random()*Number(RUNNER_CONFIG.lootTimerRandom||.7);spawnLoot()}state.obstacles.forEach(o=>o.x-=state.speed*dt);state.platforms.forEach(pl=>pl.x-=state.speed*dt);state.loots.forEach(l=>{l.x-=state.speed*dt;if(state.magnet>0&&Math.abs(l.x-p.x)<250){l.x+=(p.x+28-l.x)*dt*2.2;l.y+=(p.y+35-l.y)*dt*4.2}});state.obstacles=state.obstacles.filter(o=>o.x+o.w>-60);state.platforms=state.platforms.filter(pl=>pl.x+pl.w>-60);state.loots=state.loots.filter(l=>l.x+l.r>-60&&!l.dead);if(p.vy>=0){for(let pl of state.platforms){let was=(p.y+p.h-p.vy*dt)<=pl.y+8,onX=p.x+p.w>pl.x&&p.x<pl.x+pl.w;if(was&&onX&&p.y+p.h>=pl.y&&p.y+p.h<=pl.y+28){p.y=pl.y-p.h;p.vy=0;p.grounded=true;p.jumps=0}}}let pb={x:p.x+14,y:p.y+10,w:p.w-26,h:p.h-20};for(let o of state.obstacles){if(!o.hit&&rect(pb,o)){o.hit=true;damage(o.upper?"não deslizou sob o cabo":"bateu no obstáculo")}}for(let l of state.loots){if(rect(pb,{x:l.x-l.r,y:l.y-l.r,w:l.r*2,h:l.r*2}))collect(l)}state.combo=Math.max(1,state.combo-dt*.1);updateParticles(dt)}
function updateParticles(dt){state.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt});state.particles=state.particles.filter(p=>p.life>0)}
function burst(x,y,color,count=20){if(window.innerWidth<=720)count=Math.min(count,24);for(let i=0;i<count;i++)state.particles.push({x,y,vx:(Math.random()-.5)*360,vy:(Math.random()-.5)*320,life:.75+Math.random()*.35,color})}
function spawnEnergyFx(){let box=$("energyFx");let el=document.createElement("div");el.className="energyFloat";el.textContent=`+${fmt(genMin(),2)} Wh`;el.style.left=(25+Math.random()*45)+"%";el.style.bottom=(38+Math.random()*28)+"%";box.appendChild(el);setTimeout(()=>el.remove(),1800)}

function draw(){drawBg();drawPlatforms();drawLoots();drawObs();drawRunner();drawParticles()}
function drawBg(){let g=ctx.createLinearGradient(0,0,0,state.h);g.addColorStop(0,"#07101e");g.addColorStop(.6,"#111827");g.addColorStop(1,"#050505");ctx.fillStyle=g;ctx.fillRect(0,0,state.w,state.h);let off=(state.time*state.speed/35)%150;for(let i=0;i<12;i++){let x=i*150-off-80;ctx.fillStyle=i%2?"rgba(0,229,255,.06)":"rgba(255,122,24,.075)";ctx.fillRect(x,state.ground-165+(i%3)*24,90,150)}ctx.fillStyle="#15171e";ctx.fillRect(0,state.ground,state.w,state.h-state.ground);ctx.fillStyle="#ff7a18";ctx.fillRect(0,state.ground,state.w,3)}
function round(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.fill()}
function drawRunner(){let p=state.runner,run=Math.sin(state.time*18);ctx.save();if(state.invulnerable>0){ctx.globalAlpha=Math.floor(state.time*18)%2?.38:1;}ctx.translate(p.x,p.y);if(p.sliding&&p.grounded){ctx.translate(0,24);ctx.scale(1.08,.82)}round(-8,-8,p.w+20,p.h+16,16,state.shield>0?"rgba(168,85,247,.30)":"rgba(255,122,24,.13)");ctx.strokeStyle="#111827";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(20,54);ctx.lineTo(13+run*7,78);ctx.moveTo(34,54);ctx.lineTo(41-run*7,78);ctx.stroke();ctx.fillStyle="#050505";ctx.fillRect(7+run*7,76,15,7);ctx.fillRect(35-run*7,76,15,7);round(12,23,30,36,10,"#ff7a18");round(17,29,20,25,7,"#111827");ctx.fillStyle="#22d3ee";ctx.fillRect(20,32,14,5);ctx.fillStyle="#f2c38b";ctx.beginPath();ctx.arc(27,16,11,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fbbf24";ctx.beginPath();ctx.arc(27,12,13,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(13,11,28,5);ctx.strokeStyle="#f2c38b";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(15,33);ctx.lineTo(5+run*4,46);ctx.moveTo(39,33);ctx.lineTo(50-run*4,43);ctx.stroke();ctx.restore()}
function drawPlatforms(){for(let pl of state.platforms){ctx.save();ctx.shadowColor="#00e5ff";ctx.shadowBlur=14;round(pl.x,pl.y,pl.w,pl.h,8,"rgba(0,229,255,.72)");ctx.shadowBlur=0;ctx.fillStyle="rgba(255,255,255,.55)";ctx.fillRect(pl.x+8,pl.y+4,pl.w-16,3);ctx.restore()}}
function drawObs(){for(let o of state.obstacles){if(o.upper){round(o.x,o.y,o.w,o.h,10,"#64748b");ctx.fillStyle="#111827";ctx.font="900 9px Outfit";ctx.fillText("CABO BAIXO",o.x+15,o.y+18)}else{round(o.x,o.y,o.w,o.h,9,"#7f1d1d");ctx.fillStyle="#fff";ctx.font="900 9px Outfit";ctx.fillText("CURTO",o.x+12,o.y+25)}}}
function drawLoots(){drawLoots.cache=drawLoots.cache||{};for(let l of state.loots){ctx.save();ctx.translate(l.x,l.y);if(l.item){ctx.shadowColor=rarityRank(l.item.rarity)>=4?"#a855f7":rarityRank(l.item.rarity)>=3?"#38bdf8":"#ff7a18";ctx.shadowBlur=rarityRank(l.item.rarity)>=4?28:16;ctx.fillStyle="rgba(255,255,255,.10)";ctx.beginPath();ctx.arc(0,0,42,0,Math.PI*2);ctx.fill();if(l.item.image){let temp=drawLoots.cache[l.item.id]||(drawLoots.cache[l.item.id]=new Image());temp.src=normalizeImageUrl(l.item.image||"");if(temp.complete&&temp.naturalWidth)ctx.drawImage(temp,-34,-34,68,68);else round(-22,-18,44,36,8,"#ff7a18")}else{ctx.font="900 32px Arial";ctx.textAlign="center";ctx.fillStyle="#ff7a18";ctx.fillText(l.item.type==="panel"?"▦":l.item.type==="battery"?"▣":l.item.type==="tool"?"🧰":"▤",0,10)}}else if(l.inv){let img=imgs[l.inv.id];ctx.shadowColor=l.inv.color;ctx.shadowBlur=l.inv.rarity==="épico"?30:18;ctx.fillStyle="rgba(255,255,255,.1)";ctx.beginPath();ctx.arc(0,0,48,0,Math.PI*2);ctx.fill();if(img.complete&&img.naturalWidth)ctx.drawImage(img,-44,-44,88,88);else round(-24,-20,48,40,8,"#ff7a18")}else{let map={panel:"▦",battery:"▣",cable:"⌁",plug:"🔌",controller:"⚙",shield:"🛡️",magnet:"🧲",turbo:"⚡",heart:"♥"};ctx.font="900 34px Arial";ctx.textAlign="center";ctx.fillStyle=l.type==="heart"?"#ef4444":"#ff7a18";ctx.fillText(map[l.type]||"●",0,11)}ctx.restore()}}
function drawParticles(){for(let p of state.particles){ctx.globalAlpha=Math.max(0,p.life/1.05);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,4+p.life*5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}}

function dominantInverter(){return dominantByRarity([...INV,...latestCustomItems().filter(i=>i.type==="inverter")],state.plant.installedInverters)}
function dominantBattery(){return dominantByRarity([...BATTERIES,...latestCustomItems().filter(i=>i.type==="battery")],state.plant.installedBatteries)}
function dominantPanel(){return dominantByRarity([...PANELS,...latestCustomItems().filter(i=>i.type==="panel")],state.plant.installedPanels)}
function renderPlant(){
  const pc=currentPlantConfig();
  let box=$("solarField");box.innerHTML="";
  let panel=dominantPanel();
  let installedPanelCount=Object.values(state.plant.installedPanels||{}).reduce((a,b)=>a+(Number(b)||0),0);
  let count=Math.max(1,Math.min(20,installedPanelCount||Math.ceil(state.plant.panelsWp/100)));
  for(let i=0;i<count;i++){let d=document.createElement("div");d.className="solar-panel";let img=(panel&&panel.image)||pc.panelFallbackImage||"";if(img)d.innerHTML=imageHtml(img,"","panel-img");box.appendChild(d)}
  let inv=dominantInverter();let bat=dominantBattery();
  $("plantInvImg").innerHTML=inv?imageHtml(inv.image||`assets/itens/inversores/${inv.id}.png`,"▤"):"▤";
  let bIcon=document.querySelector(".batteryIcon");if(bIcon)bIcon.innerHTML=bat?imageHtml(bat.image,"▣"):"▣";
  if($("stringBoxIcon"))$("stringBoxIcon").innerHTML=pc.stringBoxImage?imageHtml(pc.stringBoxImage,"▧"):"▧";
  if($("drIcon"))$("drIcon").innerHTML=pc.drImage?imageHtml(pc.drImage,"⏚"):"⏚";
  if($("stringBoxLabel"))$("stringBoxLabel").textContent=pc.stringBoxLabel||"STRING BOX";
  if($("drLabel"))$("drLabel").textContent=pc.drLabel||"DR";
}
function install(type, qty=1){
  qty=Math.max(1,Math.floor(Number(qty)||1));
  let done=0;
  for(let n=0;n<qty;n++){
    if((state.plant.inventory[type]||0)<=0)break;
    const item=catalogItemById(type);
    state.plant.inventory[type]--;
    if(item&&item.type==="panel"){let val=Number(item.wp||item.power||100);const pc=currentPlantConfig();if(pc.enforceSamePanelWp){const groups=Object.entries(state.plant.installedPanels||{}).map(([id,qty])=>({id,qty:Number(qty)||0,it:catalogItemById(id)})).filter(g=>g.qty>0&&g.it);const current=groups.length?Number(groups[0].it.wp||groups[0].it.power||0):0;if(current&&current!==val){const ok=confirm("Seu string atual usa painéis de "+current+"Wp. Instalar "+val+"Wp reiniciará o campo solar para essa potência.\n\nOK = trocar para "+val+"Wp e devolver os antigos ao inventário.\nCancelar = manter o string atual.");if(!ok){state.plant.inventory[type]++;break;}for(const g of groups){state.plant.inventory[g.id]=(state.plant.inventory[g.id]||0)+g.qty;}state.plant.installedPanels={};state.plant.panelsWp=0;}}state.plant.panelsWp+=val;state.plant.installedPanels[item.id]=(state.plant.installedPanels[item.id]||0)+1;if(done===0)itemToast("PAINEL INSTALADO",item.name+" • +"+fmt(val)+" Wp",item.image||"")}
    else if(item&&item.type==="battery"){let val=Number(item.wh||item.power||1200);state.plant.batteriesWh+=val;state.plant.installedBatteries[item.id]=(state.plant.installedBatteries[item.id]||0)+1;if(done===0)itemToast("BATERIA INSTALADA",item.name+" • +"+fmtEnergyWh(val),item.image||"")}
    else if(item&&item.type==="inverter"){let val=Number(item.w||item.power||100);state.plant.inverterW+=val;state.plant.installedInverters[item.id]=(state.plant.installedInverters[item.id]||0)+1;if(done===0)itemToast("INVERSOR INSTALADO",item.name+" • +"+fmtPowerW(val),item.image||("assets/itens/inversores/"+item.id+".png"))}
    else if(item&&item.type==="tool"){let val=Number(item.xp||item.power||50);state.plant.xp+=val;state.plant.tools[item.id]=(state.plant.tools[item.id]||0)+1;if(done===0)itemToast("FERRAMENTA ATIVADA",item.name+" • "+(item.effect||("+"+val+" XP")),item.image||"")}
    else if(type==="panel"){state.plant.panelsWp+=25}else if(type==="battery"){state.plant.batteriesWh+=80}else if(type==="inverter"){state.plant.inverterW+=30}else if(type==="plug"){state.plant.wallet+=.2}else if(type==="controller"){state.plant.panelsWp+=10;state.plant.inverterW+=10}else if(type==="cable"){state.plant.xp+=3}
    done++;
  }
  if(done>1)toast(`${done} itens instalados`);
  renderInventory();renderPlant();save();updateUI();
}
function resaleValue(type){let it=catalogItemById(type);let base=Number(it&&it.price?it.price:({panel:12,battery:18,inverter:25,cable:4,plug:5,controller:16}[type]||8));return Math.max(.1,base*Number((readAdminConfig().economy||{}).resaleRate||.70))}
function sellInventory(type, qty=1){qty=Math.max(1,Math.floor(Number(qty)||1));let have=state.plant.inventory[type]||0;if(have<=0)return toast("Item indisponível");let n=Math.min(have,qty);let gain=resaleValue(type)*n;state.plant.inventory[type]-=n;state.plant.wallet+=gain;toast(`Vendido: +${fmt(gain,2)} CPO`);renderInventory();renderShop();updateUI();save()}
function installedQty(type){const item=catalogItemById(type);if(!item)return 0;if(item.type==="panel")return Number(state.plant.installedPanels&&state.plant.installedPanels[type]||0);if(item.type==="battery")return Number(state.plant.installedBatteries&&state.plant.installedBatteries[type]||0);if(item.type==="inverter")return Number(state.plant.installedInverters&&state.plant.installedInverters[type]||0);if(item.type==="tool")return Number(state.plant.tools&&state.plant.tools[type]||0);return 0}
function removeInstalled(type,qty=1,mode="inventory"){qty=Math.max(1,Math.floor(Number(qty)||1));const item=catalogItemById(type);if(!item)return toast("Item não encontrado");let have=installedQty(type);if(have<=0)return toast("Nada instalado desse item");let n=Math.min(have,qty);let refund=0;if(mode==="sell")refund=resaleValue(type)*n;if(item.type==="panel"){let val=Number(item.wp||item.power||100);state.plant.installedPanels[type]-=n;state.plant.panelsWp=Math.max(0,(state.plant.panelsWp||0)-(val*n));}
else if(item.type==="battery"){let val=Number(item.wh||item.power||1200);state.plant.installedBatteries[type]-=n;state.plant.batteriesWh=Math.max(0,(state.plant.batteriesWh||0)-(val*n));state.plant.storedWh=Math.min(state.plant.storedWh,state.plant.batteriesWh);}
else if(item.type==="inverter"){let val=Number(item.w||item.power||100);state.plant.installedInverters[type]-=n;state.plant.inverterW=Math.max(0,(state.plant.inverterW||0)-(val*n));}
else if(item.type==="tool"){state.plant.tools[type]-=n;}
if(mode==="sell"){state.plant.wallet+=refund;toast(`${n} instalado(s) vendido(s): +${fmt(refund,2)} CPO`)}else{state.plant.inventory[type]=(state.plant.inventory[type]||0)+n;toast(`${n} item(ns) removido(s) para o inventário`)}
renderInventory();renderPlant();renderShop();updateUI();save()}
function backToPlant(){if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});document.body.classList.remove("runnerFullscreen");if($("resultOverlay"))$("resultOverlay").classList.remove("active");if($("navPlant"))$("navPlant").classList.add("active");if($("navRunner"))$("navRunner").classList.remove("active");setTimeout(()=>{resize();$("plantSection").scrollIntoView({behavior:"smooth",block:"start"})},80)}
function itemDetailHtml(it,mode="shop"){
  const q=state.plant.inventory[it.id]||0;
  const installed=(state.plant.installedPanels&&state.plant.installedPanels[it.id]||0)+(state.plant.installedBatteries&&state.plant.installedBatteries[it.id]||0)+(state.plant.installedInverters&&state.plant.installedInverters[it.id]||0)+(state.plant.tools&&state.plant.tools[it.id]||0);
  const img=it.image?imageHtml(it.image,it.icon||"▣","detailImg"):`<div class="detailFallback">${it.icon||"▣"}</div>`;
  const specs=[];
  if(it.type)specs.push(`<span>Tipo: <b>${it.type}</b></span>`);
  if(it.rarity)specs.push(`<span>Raridade: <b>${it.rarity}</b></span>`);
  if(it.wp)specs.push(`<span>Potência: <b>${fmt(it.wp)} Wp</b></span>`);
  if(it.w)specs.push(`<span>Inversor: <b>${fmtPowerW(it.w)}</b></span>`);
  if(it.wh)specs.push(`<span>Armazenamento: <b>${fmtEnergyWh(it.wh)}</b></span>`);
  if(it.ah)specs.push(`<span>Bateria: <b>${fmt(it.ah)} Ah</b></span>`);
  specs.push(`<span>No inventário: <b>${fmt(q)}</b></span>`);
  if(installed)specs.push(`<span>Instalados: <b>${fmt(installed)}</b></span>`);
  const price=Number(it.price||0);
  return `<div class="itemDetailHero">${img}</div><div class="itemDetailBody"><h3>${it.name||it.id}</h3><p class="detailRarity">${it.rarity||"comum"} • ${it.type||"item"}</p><p class="detailDesc">${it.desc||"Item configurável do universo Solano."}</p><div class="detailEffect"><b>Efeito no jogo</b><span>${it.effect||"Efeito configurável"}</span></div><div class="detailSpecs">${specs.join("")}</div>${price?`<p class="detailPrice">${fmt(price,2)} CPO cada</p>`:""}<div class="detailActions"><button class="primary" data-detail-install="${it.id}" ${q<=0?"disabled":""}>Instalar 1</button><button class="ghost" data-detail-install-all="${it.id}" ${q<=0?"disabled":""}>Instalar todos</button>${installed?`<button class="ghost" data-detail-remove="${it.id}">Remover 1</button><button class="ghost" data-detail-sell-installed="${it.id}">Vender instalado(s)</button>`:""}</div></div>`;
}
function openItemDetail(id){
  const invItems=INV.map(i=>({id:i.id,type:"inverter",name:i.name,rarity:i.rarity,price:Math.max(65,Math.round(i.w*2.2)),desc:"Inversor instalável que aumenta a capacidade AC da usina.",effect:`+${i.w} W no inversor`,image:`assets/itens/inversores/${i.id}.png`,w:i.w}));
  const it=catalogItemById(id)||PANELS.find(x=>x.id===id)||BATTERIES.find(x=>x.id===id)||TOOLS.find(x=>x.id===id)||invItems.find(x=>x.id===id);
  if(!it)return;
  if($("itemDetailTitle"))$("itemDetailTitle").textContent=it.name||"Item";
  if($("itemDetailSubtitle"))$("itemDetailSubtitle").textContent="detalhes, imagem, descrição e efeito";
  if($("itemDetailContent"))$("itemDetailContent").innerHTML=itemDetailHtml(it);
  document.querySelectorAll("[data-detail-install]").forEach(b=>b.onclick=()=>{install(b.dataset.detailInstall,1);openItemDetail(b.dataset.detailInstall)});
  document.querySelectorAll("[data-detail-install-all]").forEach(b=>b.onclick=()=>{install(b.dataset.detailInstallAll,state.plant.inventory[b.dataset.detailInstallAll]||0);openItemDetail(b.dataset.detailInstallAll)});
  document.querySelectorAll("[data-detail-remove]").forEach(b=>b.onclick=()=>{removeInstalled(b.dataset.detailRemove,1,"inventory");openItemDetail(b.dataset.detailRemove)});
  document.querySelectorAll("[data-detail-sell-installed]").forEach(b=>b.onclick=()=>{removeInstalled(b.dataset.detailSellInstalled,installedQty(b.dataset.detailSellInstalled),"sell");openItemDetail(b.dataset.detailSellInstalled)});
  const d=$("itemDetailModal"); if(d&&!d.open)d.showModal();
}
function renderInventory(){
  let base=[["panel","▦","Painel genérico","+25 Wp"],["battery","▣","Bateria genérica","+80 Wh"],["inverter","▤","Inversor genérico","+30 W"],["cable","⌁","Cabo","+3 XP"],["plug","🔌","Tomada","+0.20 CPO"],["controller","⚙","Controlador","+10 Wp/W"]];
  let catalog=[...base.map(([id,ic,n,d])=>({id,icon:ic,name:n,effect:d})),...PANELS.map(i=>({...i,icon:"▦"})),...BATTERIES.map(i=>({...i,icon:"▣"})),...INV.map(i=>({id:i.id,type:"inverter",name:i.name,rarity:i.rarity,price:Math.max(65,Math.round(i.w*2.2)),effect:`${i.rarity.toUpperCase()}: +${i.w} W`,image:`assets/itens/inversores/${i.id}.png`,w:i.w})),...TOOLS.map(i=>({...i})),...latestCustomItems().map(i=>({...i}))];
  $("inventoryGrid").innerHTML=catalog.map(it=>{ensureInventoryKey(it.id);let q=state.plant.inventory[it.id]||0,src=it.image||"",ic=it.icon||"▣",rar=it.rarity?`<small>${it.rarity}</small>`:"";let inst=installedQty(it.id);return`<div class="invCard ${q<=0&&inst<=0?"disabled":""}" data-type="${it.id}" data-detail="${it.id}"><div class="invImg">${src?imageHtml(src,ic):ic}</div><div><h3>${it.name}</h3><p>${it.effect||it.desc||"Item instalável"}</p>${rar}<b>Inventário: ${q}</b>${inst?`<b class="installedLine">Instalados: ${inst}</b>`:""}<div class="invActions"><button data-inv-install="${it.id}" ${q<=0?"disabled":""}>Instalar 1</button><button data-inv-install-all="${it.id}" ${q<=0?"disabled":""}>Instalar todos</button><button data-inv-sell="${it.id}" ${q<=0?"disabled":""}>Vender 1</button><button data-inv-sell-all="${it.id}" ${q<=0?"disabled":""}>Vender todos</button>${inst?`<button data-inv-remove="${it.id}">Remover 1</button><button data-inv-sell-installed="${it.id}">Vender instalados</button>`:""}</div></div></div>`}).join("");
  document.querySelectorAll("[data-inv-install]").forEach(b=>b.onclick=e=>{e.stopPropagation();install(b.dataset.invInstall,1)});
  document.querySelectorAll("[data-inv-install-all]").forEach(b=>b.onclick=e=>{e.stopPropagation();install(b.dataset.invInstallAll,state.plant.inventory[b.dataset.invInstallAll]||0)});
  document.querySelectorAll("[data-inv-sell]").forEach(b=>b.onclick=e=>{e.stopPropagation();sellInventory(b.dataset.invSell,1)});
  document.querySelectorAll("[data-inv-sell-all]").forEach(b=>b.onclick=e=>{e.stopPropagation();sellInventory(b.dataset.invSellAll,state.plant.inventory[b.dataset.invSellAll]||0)});
  document.querySelectorAll("[data-inv-remove]").forEach(b=>b.onclick=e=>{e.stopPropagation();removeInstalled(b.dataset.invRemove,1,"inventory")});
  document.querySelectorAll("[data-inv-sell-installed]").forEach(b=>b.onclick=e=>{e.stopPropagation();removeInstalled(b.dataset.invSellInstalled,installedQty(b.dataset.invSellInstalled),"sell")});
  document.querySelectorAll("#inventoryGrid [data-detail]").forEach(card=>card.onclick=e=>{if(e.target.closest("button"))return;openItemDetail(card.dataset.detail)});
}
function renderShop(){let items=allShopItems();if($("shopBalance"))$("shopBalance").textContent=`Saldo atual: ${fmt(state.plant.wallet,2)} CPO`;
  $("shopGrid").innerHTML=items.map((it,i)=>{ensureInventoryKey(it.id);const price=Number(it.price||0);return`<div class="shopCard richShop" data-detail="${it.id}"><div class="shopIcon">${it.image?imageHtml(it.image,it.icon||"▣"):it.icon||"▣"}</div><div><h3>${it.name}</h3><p class="rarity">${it.rarity||"comum"} • ${it.type||"item"}</p><p>${it.desc||"Item configurável do universo Solano."}</p><b>${it.effect||"Efeito configurável"}</b><p class="price">${fmt(price,2)} CPO cada</p><button class="ghost smallDetail" data-open-detail="${it.id}">Ver detalhes</button><div class="buyLine"><input type="number" min="1" step="1" value="1" data-buy-qty="${i}" aria-label="Quantidade"><span data-buy-total="${i}">Total: ${fmt(price,2)} CPO</span></div><button class="primary" data-buy="${i}">Comprar</button></div></div>`}).join("");
  document.querySelectorAll("[data-buy-qty]").forEach(inp=>inp.oninput=()=>{let it=items[+inp.dataset.buyQty],q=Math.max(1,Math.floor(Number(inp.value)||1));inp.value=q;let t=document.querySelector(`[data-buy-total="${inp.dataset.buyQty}"]`);if(t)t.textContent=`Total: ${fmt((Number(it.price)||0)*q,2)} CPO`});
  document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{let it=items[+b.dataset.buy],inp=document.querySelector(`[data-buy-qty="${b.dataset.buy}"]`),qty=Math.max(1,Math.floor(Number(inp&&inp.value)||1)),total=(Number(it.price)||0)*qty;if(state.plant.wallet<total)return toast("CPO insuficiente");state.plant.wallet-=total;ensureInventoryKey(it.id);state.plant.inventory[it.id]=(state.plant.inventory[it.id]||0)+qty;toast(`${qty}x ${it.name} enviado ao inventário`);renderInventory();renderPlant();updateUI();renderShop();save()});
  document.querySelectorAll("[data-open-detail]").forEach(b=>b.onclick=e=>{e.stopPropagation();openItemDetail(b.dataset.openDetail)});
  document.querySelectorAll("#shopGrid [data-detail]").forEach(card=>card.onclick=e=>{if(e.target.closest("button,input"))return;openItemDetail(card.dataset.detail)});
}
function missionList(){return[{id:"m1",title:"Rápida",desc:"Percorra 500m no Solano.",done:state.distance>=500||state.best>=500,reward:12,cool:"10 min",coolMs:10*60*1000},{id:"m2",title:"Diária",desc:"Venda energia uma vez.",done:state.plant.soldWh>0,reward:40,cool:"24 h",coolMs:24*60*60*1000},{id:"m3",title:"Semanal",desc:"Colete um inversor raro ou épico.",done:state.runStats.rare>0||state.runStats.epic>0,reward:120,cool:"7 dias",coolMs:7*24*60*60*1000}]}
function missionState(m,claimed){let last=claimed[m.id]||0,remaining=last+m.coolMs-Date.now();if(last&&remaining>0)return{label:"resgatada",disabled:true,extra:"Renova em "+Math.ceil(remaining/60000)+" min"};if(m.done)return{label:"resgatar",disabled:false,extra:"Concluída • renova em "+m.cool};return{label:"em progresso",disabled:true,extra:"Renova em "+m.cool}}
function renderMissions(){let claimed=JSON.parse(localStorage.getItem(SAVE+"_missions")||"{}");$("missionsGrid").innerHTML=missionList().map(m=>{let st=missionState(m,claimed);return`<div class="missionCard"><h3>${m.title}</h3><p>${m.desc}</p><b>+${m.reward} CPO</b><p class="missionState">${st.extra}</p><button class="claim" data-claim="${m.id}" ${st.disabled?"disabled":""}>${st.label.toUpperCase()}</button></div>`}).join("");document.querySelectorAll("[data-claim]").forEach(b=>b.onclick=()=>claimMission(b.dataset.claim))}
function claimMission(id){let missions=missionList(),m=missions.find(x=>x.id===id),claimed=JSON.parse(localStorage.getItem(SAVE+"_missions")||"{}");if(!m)return;let st=missionState(m,claimed);if(st.disabled||!m.done)return;state.plant.wallet+=m.reward;claimed[id]=Date.now();localStorage.setItem(SAVE+"_missions",JSON.stringify(claimed));toast(`Missão resgatada: +${m.reward} CPO`);renderMissions();updateUI();save()}
function renderRanking(){let me={name:state.player?.name||"Você",city:state.player?.city||"—",uf:state.player?.uf||"—",distance:state.best,score:scoreOf(),level:state.plant.level,lastActiveAt:Date.now(),me:true};let remote=state.remoteRanking||[];let list=[me,...remote,...state.ranking].sort((a,b)=>(b.distance||0)-(a.distance||0)||(b.score||0)-(a.score||0)).slice(0,10);$("rankingList").innerHTML=list.map((r,i)=>`<div class="rankCard ${r.me?"me":""}"><div class="rankTop"><div><h3>#${i+1} ${r.name}</h3><p>${r.city}/${r.uf} • LVL ${r.level||Math.max(1,Math.floor((r.distance||0)/300))}</p><span class="activity ${Date.now()-(r.lastActiveAt||0)<45000?"online":""}">${timeAgo(r.lastActiveAt)}</span></div><div class="rankScore">${fmt(r.distance||0)}m<br><small>${fmt(r.score||0)} pts</small></div></div><div class="rankMeta"><span>Distância principal</span><span>CPO run: ${r.cpo||"0.00"}</span></div></div>`).join("")}
function renderFeed(){$("feed").innerHTML=(state.feed.length?state.feed:[{t:"Agora",m:"Usina pronta. Jogue Solano para coletar inversores."}]).map(f=>`<div class="feedItem"><b>${f.t}</b> — ${f.m}</div>`).join("")}
function renderResult(dist){let upgrades=Object.values(state.plant.inventory).reduce((a,b)=>a+(Number(b)||0),0);$("resultStats").innerHTML=`<div><small>Distância</small><b>${dist}m</b></div><div><small>Itens</small><b>${state.runStats.items}</b></div><div><small>CPO</small><b>${state.runCpo.toFixed(2)}</b></div><div><small>Raros</small><b>${state.runStats.rare}</b></div><div><small>Épicos</small><b>${state.runStats.epic}</b></div><div><small>Upgrades</small><b>${upgrades}</b></div>`;let drops=state.runStats.drops.slice(-8).reverse();$("resultDrops").innerHTML=drops.length?drops.map(d=>`<div class="dropCard">${d.img?`<img src="${d.img}">`:"⚡"}<small>${d.name}</small></div>`).join(""):`<div class="dropCard"><small>Nenhum drop raro</small></div>`}
function sellEnergy(){if(state.plant.storedWh<10)return toast("Energia insuficiente");let gain=(state.plant.storedWh/1000)*state.price;state.plant.wallet+=gain;state.plant.soldWh+=state.plant.storedWh;state.plant.storedWh=0;toast(`+${gain.toFixed(2)} CPO`);updateUI();renderMissions();save()}
function claimDaily(){let today=new Date().toISOString().slice(0,10);if(state.dailyClaimed===today)return toast("Bônus já coletado");let gain=8+state.plant.level*2;state.plant.wallet+=gain;state.plant.storedWh=Math.min(state.plant.batteriesWh,state.plant.storedWh+60);state.dailyClaimed=today;itemToast("BÔNUS DIÁRIO",`+${gain} CPO e +60 Wh`);updateUI();save()}
function updateUI(){
  if(state.player)state.lastActiveAt=Date.now();
  let p=state.player, st=plantEnergyStats();
  $("playerLine").textContent=p?`${p.name} (${p.city}/${p.uf}) • LVL ${state.plant.level}`:"Operação Solano";
  $("hudPlayer").textContent=p?`${p.name} • ${p.city}/${p.uf}`:"—";
  $("hudLives").textContent="❤".repeat(state.lives)+"♡".repeat(3-state.lives);
  $("hudDistance").textContent=fmt(Math.floor(state.distance))+"m";
  $("hudCpo").textContent=state.runCpo.toFixed(2);
  $("hudCombo").textContent="x"+state.combo.toFixed(1);
  $("hudBest").textContent=fmt(state.best)+"m";
  $("wallet").textContent=fmt(state.plant.wallet,2);
  $("energy").textContent=fmtEnergyWh(state.plant.storedWh);
  $("wp").textContent=fmt(state.plant.panelsWp)+" Wp";
  $("gen").textContent=genMin()>=1000?fmt(genMin()/1000,2)+" kWh/min":fmt(genMin(),2)+" Wh/min";
  if($("genNote")){
    const lost=(st.technicalLossPerMin>=1000?fmt(st.technicalLossPerMin/1000,2)+" kWh/min":fmt(st.technicalLossPerMin,2)+" Wh/min");
    $("genNote").innerHTML=`Painéis: ${fmt(st.panelRaw,2)} Wh/min • Inversor aceita: ${fmt(st.inverterCap,2)} Wh/min • Eficiência: ${fmt(st.efficiency*100,0)}% • Perdas: ${lost}<br><strong>${plantAdvice()}</strong>`;
  }
  $("stored").textContent=fmtEnergyWh(state.plant.storedWh);
  $("price").textContent=fmt(state.price,2);
  $("plantInv").textContent=fmtPowerW(state.plant.inverterW);
  $("plantBat").textContent=fmtEnergyWh(state.plant.batteriesWh);
  $("batteryFill").style.width=Math.min(100,state.plant.storedWh/state.plant.batteriesWh*100)+"%";
  $("xpFill").style.width=Math.min(100,(state.plant.xp%120)/120*100)+"%";
  $("comboName").textContent=comboName();
  $("comboFill").style.width=Math.min(100,(state.combo-1)/4*100)+"%";
  $("genPulse").textContent="+"+fmt(genMin(),2)+" Wh";
  $("dailyBtn").textContent=state.dailyClaimed===new Date().toISOString().slice(0,10)?"✅ Bônus coletado":"🎁 Bônus"
}
function getAdsConfig(){return (readAdminConfig().ads)||DEFAULT_ADMIN_CONFIG.ads}
function checkAdPause(dt){
  if(!state.running||state.paused||state.adPause)return;
  const ads=getAdsConfig();
  if(!ads.enabled||!(ads.items||[]).some(a=>a.active!==false))return;
  state.adTimer+=dt;
  const interval=Math.max(60,Number(ads.intervalSeconds||600));
  if(state.adTimer>=interval){state.adTimer=0;showAffiliatePause()}
}
function loop(ts){let now=ts/1000,dt=Math.min(.033,now-(state.last||now));state.last=now;update(dt);draw();loop.ui=(loop.ui||0)+dt;if(loop.ui>=.12){loop.ui=0;updateUI()}requestAnimationFrame(loop)}

function closeAffiliateResume(){
  const d=$("affiliateModal");
  if(d&&d.open)d.close();
  if(state.adPause){state.adPause=false;state.paused=false;state.running=true;notice("Corrida retomada")}
}
function showAffiliatePause(){
  const ads=getAdsConfig(), list=(ads.items||[]).filter(a=>a.active!==false);
  if(!list.length)return;
  const ad=list[Math.floor(Math.random()*list.length)];
  state.currentAd=ad;state.running=false;state.paused=true;state.adPause=true;
  $("affiliateTitle").textContent=ad.title||"Oferta OffGrid";
  $("affiliateHeadline").textContent=ad.title||"Oferta relacionada";
  $("affiliateText").textContent=(ad.text||"Abra em nova aba sem perder sua corrida.")+(ad.description?("\n"+ad.description):"");
  $("affiliateImage").innerHTML=ad.image?imageHtml(ad.image,"⚡"):"⚡";
  $("affiliateOpen").onclick=()=>{if(ad.link)window.open(ad.link,"_blank","noopener,noreferrer")};
  if(!$("affiliateModal").open)$("affiliateModal").showModal();
}
function openAdminLogin(){const d=$("adminLoginModal");if(d&&!d.open)d.showModal()}
function openGameAdmin(){renderGameAdmin();const d=$("gameAdminModal");if(d&&!d.open)d.showModal()}
function renderGameAdmin(){
  const cfg=readAdminConfig();cfg.auth.users=cfg.auth.users||[{email:cfg.auth.email,password:cfg.auth.password,role:"superadmin"}];
  if($("adminMetricItems"))$("adminMetricItems").textContent=(cfg.catalog.customShopItems||[]).length;
  if($("adminMetricAds"))$("adminMetricAds").textContent=(cfg.ads.items||[]).length;
  if($("admAdsEnabled"))$("admAdsEnabled").checked=!!cfg.ads.enabled;
  if($("admAdsInterval"))$("admAdsInterval").value=cfg.ads.intervalSeconds||600;
  if($("admAdsDisplay"))$("admAdsDisplay").value=cfg.ads.displaySeconds||8;
  if($("admBaseSpeed"))$("admBaseSpeed").value=cfg.runner.baseSpeed||RUNNER_CONFIG.baseSpeed||340;
  if($("admMaxSpeed"))$("admMaxSpeed").value=cfg.runner.maxSpeed||RUNNER_CONFIG.maxSpeed||680;
  if($("admInvul"))$("admInvul").value=cfg.runner.resumeInvulnerabilitySeconds||RUNNER_CONFIG.resumeInvulnerabilitySeconds||4;
  if($("admKwhPrice"))$("admKwhPrice").value=cfg.economy.defaultKwhPrice||ECONOMY_CONFIG.defaultKwhPrice||0.30;
  if($("admResaleRate"))$("admResaleRate").value=cfg.economy.resaleRate||0.70;
  if($("admJson"))$("admJson").value=JSON.stringify(cfg,null,2);
  if($("admShopList"))$("admShopList").innerHTML=(cfg.catalog.customShopItems||[]).map((it,i)=>`<div class="adminItemRow"><div><b>${it.name||it.id}</b><small>${it.type||"item"} • ${it.rarity||"comum"} • ${it.price||0} CPO<br>${(it.desc||"").slice(0,120)}</small></div><div class="adminRowActions"><button data-edit-item="${i}">Editar</button><button data-dup-item="${i}">Duplicar</button><button class="dangerSmall" data-del-item="${i}">Excluir</button></div></div>`).join("")||"<p>Nenhum item extra cadastrado.</p>";
  if($("admAdsList"))$("admAdsList").innerHTML=(cfg.ads.items||[]).map((ad,i)=>`<div class="adminItemRow"><div><b>${ad.title||ad.id}</b><small>${ad.type||"cta"} • ${(ad.link||"").slice(0,60)}<br>${(ad.text||"").slice(0,120)}</small></div><div class="adminRowActions"><button data-edit-ad="${i}">Editar</button><button data-dup-ad="${i}">Duplicar</button><button class="dangerSmall" data-del-ad="${i}">Excluir</button></div></div>`).join("")||"<p>Nenhum CTA cadastrado.</p>";
  if($("admUsersList"))$("admUsersList").innerHTML=(cfg.auth.users||[]).map((u,i)=>`<div class="adminItemRow"><div><b>${u.email}</b><small>${u.role||"admin"}</small></div><div class="adminRowActions"><button data-edit-user="${i}">Editar</button><button class="dangerSmall" data-del-user="${i}">Excluir</button></div></div>`).join("");
  document.querySelectorAll("[data-edit-item]").forEach(b=>b.onclick=()=>openItemEditor(+b.dataset.editItem));
  document.querySelectorAll("[data-dup-item]").forEach(b=>b.onclick=()=>{const c=readAdminConfig();let src={...c.catalog.customShopItems[+b.dataset.dupItem]};src.id=(src.id||"item")+"_copy_"+Date.now();src.name=(src.name||"Item")+" Cópia";c.catalog.customShopItems.splice(+b.dataset.dupItem+1,0,src);saveAdminConfig(c);renderGameAdmin();renderShop();toast("Item duplicado")});
  document.querySelectorAll("[data-del-item]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este item da loja?")){const c=readAdminConfig();c.catalog.customShopItems.splice(+b.dataset.delItem,1);saveAdminConfig(c);renderGameAdmin();renderShop();renderInventory();toast("Item excluído")}});  
  document.querySelectorAll("[data-edit-ad]").forEach(b=>b.onclick=()=>openAdEditor(+b.dataset.editAd));
  document.querySelectorAll("[data-dup-ad]").forEach(b=>b.onclick=()=>{const c=readAdminConfig();let src={...c.ads.items[+b.dataset.dupAd]};src.id="cta_"+Date.now();src.title=(src.title||"CTA")+" Cópia";c.ads.items.splice(+b.dataset.dupAd+1,0,src);saveAdminConfig(c);renderGameAdmin();toast("CTA duplicado")});
  document.querySelectorAll("[data-del-ad]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este CTA?")){const c=readAdminConfig();c.ads.items.splice(+b.dataset.delAd,1);saveAdminConfig(c);renderGameAdmin();toast("CTA excluído")}});  
  document.querySelectorAll("[data-edit-user]").forEach(b=>b.onclick=()=>{const c=readAdminConfig(),u=c.auth.users[+b.dataset.editUser];$("admUserEmail").value=u.email;$("admUserPass").value=u.password;$("admUserRole").value=u.role||"admin";$("admUserIndex").value=b.dataset.editUser});
  document.querySelectorAll("[data-del-user]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este acesso admin local?")){const c=readAdminConfig();c.auth.users.splice(+b.dataset.delUser,1);if(!c.auth.users.length)c.auth.users=[{email:c.auth.email,password:c.auth.password,role:"superadmin"}];saveAdminConfig(c);renderGameAdmin();toast("Usuário removido")}}); 
}
function fillItemEditor(it={},index=""){$("editItemIndex").value=index;$("editItemId").value=it.id||"";$("editItemName").value=it.name||"";$("editItemType").value=it.type||"panel";$("editItemRarity").value=it.rarity||"comum";$("editItemPrice").value=it.price||0;$("editItemPower").value=it.power||it.wp||it.wh||it.w||it.xp||0;$("editItemImage").value=it.image||"";$("editItemDesc").value=it.desc||"";$("editItemEffect").value=it.effect||"";$("editItemStatus").value=it.status||"active"}
function openItemEditor(index=""){const cfg=readAdminConfig(),it=index===""?{}:(cfg.catalog.customShopItems||[])[index]||{};fillItemEditor(it,index);if(!$("itemEditModal").open)$("itemEditModal").showModal()}
function saveItemEditor(){const cfg=readAdminConfig();cfg.catalog.customShopItems=cfg.catalog.customShopItems||[];let idx=$("editItemIndex").value;let id=($("editItemId").value||$("editItemName").value||"item").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");const type=$("editItemType").value,val=Number($("editItemPower").value||0);const item={id,type,name:$("editItemName").value||id,rarity:$("editItemRarity").value,price:Number($("editItemPrice").value||0),power:val,wp:type==="panel"?val:undefined,wh:type==="battery"?val:undefined,w:type==="inverter"?val:undefined,xp:type==="tool"?val:undefined,desc:$("editItemDesc").value||"Item criado no painel.",effect:$("editItemEffect").value||(val?`+${val} ${type==="battery"?"Wh":type==="panel"?"Wp":type==="inverter"?"W":"XP"}`:"Efeito configurável"),image:normalizeImageUrl($("editItemImage").value||""),status:$("editItemStatus").value};if(idx==="")cfg.catalog.customShopItems.push(item);else cfg.catalog.customShopItems[Number(idx)]=item;saveAdminConfig(cfg);ensureInventoryKey(item.id);renderGameAdmin();renderShop();renderInventory();$("itemEditModal").close();toast("Item salvo")}
function fillAdEditor(ad={},index=""){$("editAdIndex").value=index;$("editAdTitle").value=ad.title||"";$("editAdType").value=ad.type||"shopee";$("editAdLink").value=ad.link||"";$("editAdImage").value=ad.image||"";$("editAdText").value=ad.text||"";$("editAdDescription").value=ad.description||"";$("editAdActive").checked=ad.active!==false}
function openAdEditor(index=""){const cfg=readAdminConfig(),ad=index===""?{}:(cfg.ads.items||[])[index]||{};fillAdEditor(ad,index);if(!$("adEditModal").open)$("adEditModal").showModal()}
function saveAdEditor(){const cfg=readAdminConfig();cfg.ads.items=cfg.ads.items||[];let idx=$("editAdIndex").value;let ad={id:idx===""?"cta_"+Date.now():(cfg.ads.items[Number(idx)]||{}).id||"cta_"+Date.now(),title:$("editAdTitle").value||"Oferta OffGrid",type:$("editAdType").value,link:$("editAdLink").value||"",image:normalizeImageUrl($("editAdImage").value||""),text:$("editAdText").value||"Confira uma oferta relacionada ao jogo.",description:$("editAdDescription").value||"",active:$("editAdActive").checked};if(idx==="")cfg.ads.items.push(ad);else cfg.ads.items[Number(idx)]=ad;saveAdminConfig(cfg);renderGameAdmin();$("adEditModal").close();toast("CTA salvo")}
function initAdminPanel(){
  let clicks=0,timer=0;const secret=$("adminSecret")||document.querySelector(".logo");
  if(secret)secret.addEventListener("click",()=>{clearTimeout(timer);clicks++;timer=setTimeout(()=>clicks=0,1800);if(clicks>=10){clicks=0;openAdminLogin()}});
  if($("adminLoginBtn"))$("adminLoginBtn").onclick=()=>{const cfg=readAdminConfig();const users=cfg.auth.users||[{email:cfg.auth.email,password:cfg.auth.password}];if(users.some(u=>$("adminEmail").value===u.email&&$("adminPass").value===u.password)){$("adminLoginModal").close();openGameAdmin()}else toast("Login admin inválido")};
  document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".adminTab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.adminTab).classList.add("active")});
  const file=$("admItemFile");if(file)file.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("admItemImage").value=r.result};r.readAsDataURL(f)};

  const editFile=$("editItemFile");if(editFile)editFile.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("editItemImage").value=r.result};r.readAsDataURL(f)};
  const editAdFile=$("editAdFile");if(editAdFile)editAdFile.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("editAdImage").value=r.result};r.readAsDataURL(f)};
  if($("admAddItem"))$("admAddItem").onclick=()=>openItemEditor("");
  if($("admAddAd"))$("admAddAd").onclick=()=>openAdEditor("");
  if($("admSaveRunner"))$("admSaveRunner").onclick=()=>{const cfg=readAdminConfig();cfg.runner.baseSpeed=Number($("admBaseSpeed").value||340);cfg.runner.maxSpeed=Number($("admMaxSpeed").value||680);cfg.runner.resumeInvulnerabilitySeconds=Number($("admInvul").value||4);cfg.economy.defaultKwhPrice=Number($("admKwhPrice").value||0.30);cfg.economy.resaleRate=Number($("admResaleRate").value||0.70);saveAdminConfig(cfg);toast("Config salva. Recarregue para aplicar física/economia base.")};
  if($("admSaveJson"))$("admSaveJson").onclick=()=>{try{saveAdminConfig(JSON.parse($("admJson").value));renderGameAdmin();toast("JSON salvo")}catch(e){toast("JSON inválido")}};
  if($("admExportJson"))$("admExportJson").onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(readAdminConfig(),null,2));toast("JSON copiado")};
  if($("admResetJson"))$("admResetJson").onclick=()=>{if(confirm("Resetar configuração local do painel?")){localStorage.removeItem(ADMIN_CONFIG_KEY);renderGameAdmin();toast("Painel resetado")}};

  if($("admSaveAds"))$("admSaveAds").onclick=()=>{const cfg=readAdminConfig();cfg.ads.enabled=$("admAdsEnabled").checked;cfg.ads.intervalSeconds=Number($("admAdsInterval").value||600);cfg.ads.displaySeconds=Number($("admAdsDisplay").value||8);saveAdminConfig(cfg);renderGameAdmin();toast("Config de CTA salva")};
  if($("admSaveUser"))$("admSaveUser").onclick=()=>{const cfg=readAdminConfig();cfg.auth.users=cfg.auth.users||[];let idx=$("admUserIndex").value;let user={email:$("admUserEmail").value,password:$("admUserPass").value,role:$("admUserRole").value||"admin"};if(!user.email||!user.password)return toast("Informe email e senha");if(idx==="")cfg.auth.users.push(user);else cfg.auth.users[Number(idx)]=user;cfg.auth.email=cfg.auth.users[0].email;cfg.auth.password=cfg.auth.users[0].password;saveAdminConfig(cfg);$("admUserIndex").value="";$("admUserEmail").value="";$("admUserPass").value="";renderGameAdmin();toast("Admin salvo")};
  if($("saveItemEditor"))$("saveItemEditor").onclick=saveItemEditor;
  if($("saveAdEditor"))$("saveAdEditor").onclick=saveAdEditor;
  if($("affiliateContinue"))$("affiliateContinue").onclick=closeAffiliateResume;
  if($("affiliateClose"))$("affiliateClose").onclick=closeAffiliateResume;
}

function enterRunnerFullscreen(){
  const el=$("runnerSection")||$("canvasWrap");
  if(el.requestFullscreen)el.requestFullscreen().then(()=>{document.body.classList.add("runnerFullscreen");resize();}).catch(()=>toast("Tela cheia indisponível"));
  else {document.body.classList.toggle("runnerFullscreen");resize();}
}
function exitRunnerFullscreen(){if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();document.body.classList.remove("runnerFullscreen");resize()}
document.addEventListener("fullscreenchange",()=>{document.body.classList.toggle("runnerFullscreen",!!document.fullscreenElement);setTimeout(resize,80)});

function initEvents(){$("savePlayer").onclick=()=>{state.player={name:$("playerName").value.trim()||"Offgrideiro",city:$("playerCity").value.trim()||"Cidade",uf:($("playerUF").value.trim()||"BR").toUpperCase().slice(0,2)};$("gate").classList.remove("active");save();updateUI()};$("startRun").onclick=startRun;if($("fullscreenRunner"))$("fullscreenRunner").onclick=enterRunnerFullscreen;if($("exitFullscreenRunner"))$("exitFullscreenRunner").onclick=exitRunnerFullscreen;if($("mobileBackPlant"))$("mobileBackPlant").onclick=backToPlant;if($("resultBackPlant"))$("resultBackPlant").onclick=backToPlant;$("runAgain").onclick=()=>{$("resultOverlay").classList.remove("active");startRun()};if($("closeResult"))$("closeResult").onclick=()=>{$("resultOverlay").classList.remove("active");ensureStartOverlay()};$("goInventory").onclick=()=>{$("resultOverlay").classList.remove("active");renderInventory();$("inventoryModal").showModal()};$("sellEnergy").onclick=sellEnergy;$("sellTop").onclick=sellEnergy;$("dailyBtn").onclick=claimDaily;$("resumeOverlay").onclick=resumeRun;$("canvasWrap").addEventListener("pointerdown",e=>{if(state.paused){resumeRun();return}});canvas.addEventListener("pointerdown",e=>{if(state.paused){resumeRun();return}let r=canvas.getBoundingClientRect();if(e.clientX-r.left>r.width/2)jump();else slide(true)});canvas.addEventListener("pointerup",()=>slide(false));canvas.addEventListener("pointercancel",()=>slide(false));document.addEventListener("touchstart",()=>{if(state.paused)resumeRun()},{passive:true});window.addEventListener("keydown",e=>{if(state.paused&&(e.code==="Space"||e.code==="Enter"))return resumeRun();if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}if(e.code==="ArrowDown")slide(true)});window.addEventListener("keyup",e=>{if(e.code==="ArrowDown")slide(false)});window.addEventListener("resize",resize);$("navPlant").onclick=backToPlant;$("navRunner").onclick=()=>{$("runnerSection").scrollIntoView({behavior:"smooth"});$("navRunner").classList.add("active");$("navPlant").classList.remove("active");ensureStartOverlay()};document.querySelectorAll("[data-modal]").forEach(b=>b.onclick=()=>{let id=b.dataset.modal;if(id==="inventoryModal")renderInventory();if(id==="shopModal")renderShop();if(id==="rankingModal")renderRanking();if(id==="missionsModal")renderMissions();$(id).showModal()});document.querySelectorAll(".close").forEach(b=>b.onclick=()=>b.closest("dialog").close());document.querySelectorAll("dialog").forEach(d=>d.addEventListener("close",ensureStartOverlay))}
document.addEventListener('solano:remoteRanking', ev=>{state.remoteRanking=(ev.detail||[]).filter(r=>r&&r.name);try{renderRanking()}catch(e){}});
function init(){load();resize();renderPlant();renderInventory();renderShop();renderRanking();renderMissions();renderFeed();updateUI();initEvents();initAdminPanel();requestAnimationFrame(loop)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();