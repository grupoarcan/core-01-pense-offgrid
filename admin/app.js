import { firebaseConfig, FIREBASE_ROOT } from "./config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = (id) => document.getElementById(id);

const ROOT = [
  FIREBASE_ROOT.ecosystemCollection,
  FIREBASE_ROOT.ecosystemDocument,
  FIREBASE_ROOT.modulesCollection
];

let currentModuleId = "home";
let currentSectionKey = "";
let currentEditing = null;
let cache = {};

const MODULES = [
  {
    id:"dashboard",
    icon:"📊",
    title:"Visão geral",
    description:"Resumo do ecossistema.",
    publicUrl:"../",
    dashboard:true
  },

  {
    id:"media",
    icon:"🖼️",
    title:"Mídia",
    description:"Biblioteca global de imagens e banners do ecossistema: upload, busca, reutilização e cópia de URL para usar em notícias, projetos, rifas, cursos, tutoriais e home.",
    publicUrl:"../",
    sections:[
      {
        key:"library",
        title:"Biblioteca de mídia",
        type:"collection",
        collection:"library",
        primary:"name",
        schema:[
          field("name","Nome da mídia","text","Banner principal maio"),
          field("slug","Slug / ID","text",""),
          field("category","Categoria","select","banner",["banner","thumb","produto","projeto","noticia","tutorial","curso","rifa","logo","outro"]),
          field("tags","Tags separadas por vírgula","text","offgrid, solar, banner"),
          field("imageUrl","Imagem / URL final","image",""),
          field("alt","Texto alternativo","text","Imagem do Pense Offgrid"),
          field("sourceModule","Módulo de origem","text",""),
          field("sourceSection","Seção de origem","text",""),
          field("notes","Observações","textarea",""),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"home",
    icon:"🏠",
    title:"Home",
    description:"Controle total da página inicial: textos, carrossel, banners flutuantes, CTAs, links, redes sociais e seções.",
    publicUrl:"../",
    sections:[
      {
        key:"settings",
        title:"Textos principais",
        type:"settings",
        doc:"main",
        schema:[
          field("heroBadge","Badge superior","text","Aulas Livres • Projetos Práticos • Comunidade"),
          field("heroTitle","Título principal","textarea","MONTE SEU SISTEMA OFFGRID COM MAIS CLAREZA"),
          field("heroSubtitle","Subtítulo principal","textarea","Curso gratuito, projetos de referência, calculadora prática, jogo educativo e comunidade."),
          field("primaryButtonText","Texto do botão principal","text","Começar agora"),
          field("primaryButtonUrl","Link do botão principal","url","#ecossistema"),
          field("secondaryButtonText","Texto do botão secundário","text","Ver projetos prontos"),
          field("secondaryButtonUrl","Link do botão secundário","url","/projetos/"),
          field("seoTitle","Título SEO","text","Pense OffGrid | O caminho da independência"),
          field("seoDescription","Descrição SEO","textarea","Curso gratuito, projetos prontos, calculadora, simulador, notícias e comunidade para montar seu sistema off-grid.")
        ]
      },
      {
        key:"carousel",
        title:"Carrossel inicial",
        type:"collection",
        collection:"carousel",
        primary:"title",
        schema:[
          field("title","Título","text","Projetos prontos"),
          field("subtitle","Subtítulo","textarea","Diagramas, manuais e listas de materiais"),
          field("imageUrl","Imagem URL","image",""),
          field("linkUrl","Link de destino","url","/projetos/"),
          field("buttonText","Texto do botão","text","Abrir"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"banners",
        title:"Banners flutuantes",
        type:"collection",
        collection:"banners",
        primary:"title",
        schema:[
          field("title","Título","text","Oferta em destaque"),
          field("description","Descrição","textarea","Mensagem curta do banner."),
          field("imageUrl","Imagem URL","image",""),
          field("linkUrl","Link","url",""),
          field("position","Posição","select","bottom-right",["top-left","top-right","bottom-left","bottom-right","inline"]),
          field("startDate","Data inicial","date",""),
          field("endDate","Data final","date",""),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"ctas",
        title:"Botões e CTAs",
        type:"collection",
        collection:"ctas",
        primary:"label",
        schema:[
          field("label","Texto do botão","text","Abrir calculadora"),
          field("url","Link","url","/calculadora/"),
          field("context","Onde aparece","select","home",["home","hero","footer","floating","cards"]),
          field("style","Estilo","select","primary",["primary","secondary","whatsapp","offer"]),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"socials",
        title:"Redes sociais",
        type:"collection",
        collection:"socials",
        primary:"title",
        schema:[
          field("title","Nome","text","YouTube"),
          field("icon","Ícone / emoji","text","▶️"),
          field("url","Link","url","https://www.youtube.com/@penseoffgrid"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"calculator",
    icon:"🧮",
    title:"Calculadora",
    description:"Controle de regras, equipamentos, inversores, baterias, painéis, projetos de referência e textos da página da calculadora.",
    publicUrl:"../calculadora/",
    sections:[
      {
        key:"settings",
        title:"Página da calculadora",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título da página","text","Calculadora Offgrid"),
          field("subtitle","Subtítulo","textarea","Dimensione seu sistema com mais clareza antes de comprar."),
          field("heroImageUrl","Imagem destaque","image",""),
          field("ctaText","Texto CTA","text","Calcular agora"),
          field("ctaUrl","Link CTA","url","/calculadora/")
        ]
      },
      {
        key:"rules",
        title:"Regras do cálculo",
        type:"settings",
        doc:"rules",
        schema:[
          field("batteryReservePercent","Reserva de bateria (%)","number","30"),
          field("solarLossPercent","Perdas solares (%)","number","25"),
          field("inverterSafetyPercent","Margem do inversor (%)","number","20"),
          field("defaultSunHours","Horas de sol padrão","number","5"),
          field("minimumAutonomyDays","Autonomia mínima em dias","number","1"),
          field("notes","Observações das regras","textarea","Regras padrão do ecossistema Pense Offgrid.")
        ]
      },
      {
        key:"equipment",
        title:"Equipamentos",
        type:"collection",
        collection:"equipment",
        primary:"title",
        schema:[
          field("title","Nome do equipamento","text","Inversor 6.2kW 48V"),
          field("type","Tipo","select","inverter",["inverter","battery","panel","controller","protection","tool","other"]),
          field("brand","Marca","text",""),
          field("model","Modelo","text",""),
          field("powerW","Potência W","number","0"),
          field("voltageV","Tensão V","number","0"),
          field("capacityAh","Capacidade Ah","number","0"),
          field("imageUrl","Imagem","image",""),
          field("manualUrl","Manual / PDF","url",""),
          field("datasheetUrl","Datasheet","url",""),
          field("offerUrl","Link de oferta","url",""),
          field("description","Descrição","textarea",""),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"referenceProjects",
        title:"Projetos da calculadora",
        type:"collection",
        collection:"referenceProjects",
        primary:"title",
        schema:[
          field("title","Título","text","Sistema 48V residencial"),
          field("subtitle","Subtítulo","textarea","Projeto base para rotina residencial."),
          field("imageUrl","Imagem","image",""),
          field("recommendedInverter","Inversor recomendado","text",""),
          field("recommendedBattery","Banco de bateria","text",""),
          field("recommendedPanels","Painéis","text",""),
          field("projectUrl","Link do projeto","url","/projetos/"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"courses",
    icon:"🎓",
    title:"Cursos",
    description:"Controle da página global de cursos e aulas da playlist do YouTube.",
    publicUrl:"../cursos/",
    sections:[
      {
        key:"settings",
        title:"Página de cursos",
        type:"settings",
        doc:"main",
        schema:[
          field("badgeText","Selo da página","text","Curso gratuito para iniciantes"),
          field("title","Título principal","text","Aprenda offgrid do jeito <span>certo</span>, começando pelo básico"),
          field("subtitle","Subtítulo","textarea","Uma trilha em vídeo para quem quer entender energia solar offgrid sem ficar perdido em termos técnicos."),
          field("playlistTitle","Título da playlist","text","Playlist"),
          field("playlistDescription","Descrição da playlist","textarea","Toque em uma aula para trocar o vídeo principal. Novas aulas já têm espaço reservado."),
          field("playlistEmbed","Embed da playlist","textarea",""),
          field("heroImageUrl","Imagem destaque","image",""),
          field("ctaText","Texto CTA principal","text","Assistir aulas"),
          field("ctaUrl","Link CTA principal","url","#aulas"),
          field("secondaryCtaText","Texto CTA secundário","text","Ver projetos prontos"),
          field("secondaryCtaUrl","Link CTA secundário","url","/projetos/"),
          field("vipCtaText","Texto CTA VIP","text","Entrar no Grupo VIP"),
          field("vipCtaUrl","Link CTA VIP","url","https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"lessons",
        title:"Aulas",
        type:"collection",
        collection:"lessons",
        primary:"title",
        schema:[
          field("title","Título da aula/curso","text","Aula"),
          field("slug","Slug","text",""),
          field("youtubeUrl","Link do YouTube","url",""),
          field("embedUrl","Embed URL","url",""),
          field("description","Descrição curta","textarea",""),
          field("fullDescription","Descrição completa","textarea",""),
          field("thumbnailUrl","Thumbnail/Capa","image",""),
          field("duration","Duração","text",""),
          field("level","Nível","select","iniciante",["iniciante","intermediario","avancado","pro"]),
          field("category","Categoria","text","Offgrid"),
          field("price","Preço","text","Gratuito"),
          field("isFree","Gratuito?","checkbox",true),
          field("checkoutUrl","Link de acesso/checkout","url",""),
          field("vipUrl","Link VIP/Grupo","url",""),
          field("locked","Em breve/bloqueado?","checkbox",false),
          field("featured","Destaque?","checkbox",false),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"docs",
    icon:"📚",
    title:"Documentos",
    description:"Controle de PDFs, manuais, datasheets, diagramas e arquivos de apoio.",
    publicUrl:"../docs/",
    sections:[
      {
        key:"documents",
        title:"Documentos",
        type:"collection",
        collection:"documents",
        primary:"title",
        schema:[
          field("title","Título","text","Manual do inversor"),
          field("category","Categoria","select","manual",["manual","datasheet","diagram","pdf","planilha","outro"]),
          field("description","Descrição","textarea",""),
          field("fileUrl","Link do arquivo","url","/docs/arquivo.pdf"),
          field("imageUrl","Imagem / capa","image",""),
          field("relatedModule","Módulo relacionado","select","projects",["home","projects","calculator","courses","tutorials","raffles","games","news"]),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"games",
    icon:"🎮",
    title:"Jogos",
    description:"Controle da página global /jogos. Cada jogo pode ter seu próprio painel isolado, mas a vitrine global fica aqui.",
    publicUrl:"../jogos/",
    sections:[
      {
        key:"settings",
        title:"Página global de jogos",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título","text","Aprenda energia offgrid jogando"),
          field("subtitle","Subtítulo","textarea","Experiências interativas do Pense Offgrid."),
          field("heroImageUrl","Imagem destaque","image",""),
          field("primaryCtaText","Texto CTA principal","text","Jogar Solano"),
          field("primaryCtaUrl","Link CTA principal","url","/jogos/solano/")
        ]
      },
      {
        key:"items",
        title:"Jogos cadastrados",
        type:"collection",
        collection:"items",
        primary:"title",
        schema:[
          field("title","Nome do jogo","text","Solano Runner"),
          field("slug","Slug","text","solano"),
          field("description","Descrição","textarea","Jogo educativo do universo offgrid."),
          field("imageUrl","Imagem","image",""),
          field("gameUrl","Link do jogo","url","/jogos/solano/"),
          field("adminUrl","Painel específico do jogo","url","/jogos/solano/painel.html"),
          field("availability","Disponibilidade","select","available",["available","soon","hidden"]),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"news",
    icon:"📰",
    title:"Notícias",
    description:"Controle total do portal de notícias: posts, imagem, resumo, conteúdo, categoria, destaque e status.",
    publicUrl:"../noticias/",
    sections:[
      {
        key:"settings",
        title:"Página de notícias",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título","text","Notícias de energia"),
          field("subtitle","Subtítulo","textarea","Energia, tecnologia, mercado e mundo offgrid."),
          field("heroImageUrl","Imagem destaque","image",""),
          field("vipGroupUrl","Grupo VIP","url","")
        ]
      },
      {
        key:"posts",
        title:"Notícias",
        type:"collection",
        collection:"posts",
        primary:"title",
        schema:[
          field("title","Título","text","Título da notícia"),
          field("slug","Slug","text",""),
          field("category","Categoria","select","solar",["solar","baterias","inversores","economia","tecnologia","offgrid","mundo","brasil"]),
          field("excerpt","Resumo curto","textarea",""),
          field("content","Conteúdo em Markdown","textarea","Use Markdown: [texto do link](https://...), **negrito**, ![legenda](https://imagem.jpg)"),
          field("imageUrl","Imagem de destaque / miniatura WhatsApp","image",""),
          field("bodyImageUrl","Imagem dentro do corpo da notícia","image",""),
          field("bodyImageAlt","Legenda da imagem do corpo","text",""),
          field("source","Fonte","text",""),
          field("date","Data editorial","date",""),
          field("publishAt","Agendar publicação (data e hora)","datetime",""),
          field("featured","Destaque","boolean","false"),
          field("status","Status","select","published",["published","scheduled","draft","hidden"])

        ]
      }
    ]
  },
  {
    id:"projects",
    icon:"📐",
    title:"Projetos",
    description:"Controle total dos projetos: imagens, diagramas, manuais, datasheets, vídeos, botões, links e listas de materiais.",
    publicUrl:"../projetos/",
    sections:[
      {
        key:"settings",
        title:"Página de projetos",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título","text","Projetos de referência"),
          field("subtitle","Subtítulo","textarea","Modelos prontos para comparar diagramas, materiais e documentação técnica."),
          field("heroImageUrl","Imagem destaque","image","")
        ]
      },
      {
        key:"items",
        title:"Projetos",
        type:"collection",
        collection:"items",
        primary:"title",
        schema:[
          field("title","Título do projeto","text","Padrão Brasileiro 48V"),
          field("slug","Slug","text","padrao-brasileiro-48v"),
          field("subtitle","Subtítulo","textarea","Projeto residencial robusto."),
          field("imageUrl","Imagem principal","image",""),
          field("brand","Marca / linha técnica","text","ANENJI"),
          field("blueprintUrl","Diagrama / imagem técnica","url",""),
          field("videoUrl","Vídeo YouTube","url",""),
          field("manualUrl","Manual PDF","url",""),
          field("datasheetUrl","Datasheet PDF","url",""),
          field("techDC","Chip técnico DC","text","Banco 48V"),
          field("techPower","Chip potência","text","6.200W AC"),
          field("techAC","Chip saída AC","text","220V"),
          field("inverterSpec","Material 1 — inversor","text","Inversor ANENJI 6.2kW 48V"),
          field("inverterLink","Link loja do inversor","url",""),
          field("whatsappPostInverter","Link VIP do inversor","url",""),
          field("batterySpec","Material 2 — baterias","text","Banco 48V Rack"),
          field("batteryLink","Link loja das baterias","url",""),
          field("whatsappPostBattery","Link VIP das baterias","url",""),
          field("panelSpec","Material 3 — painéis","text","10x Painéis 550W"),
          field("panelLink","Link loja dos painéis","url",""),
          field("whatsappPostPanel","Link VIP dos painéis","url",""),
          field("offerUrl","Link geral de oferta","url",""),
          field("vipUrl","Canal VIP geral","url",""),
          field("materials","Observações / lista extra de materiais","textarea",""),
          field("level","Nível","select","referencia",["iniciante","intermediario","referencia","avancado"]),
          field("order","Ordem","number","1"),
          field("featured","Destaque principal","boolean","false"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"raffles",
    icon:"🎟️",
    title:"Rifas",
    description:"Controle de rifas: produto, imagem, números, preço, regras, status e histórico.",
    publicUrl:"../rifas/",
    sections:[
      {
        key:"settings",
        title:"Página de rifas",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título","text","Rifas Pense Offgrid"),
          field("subtitle","Subtítulo","textarea","Participe de campanhas de equipamentos offgrid."),
          field("rulesGlobal","Regras gerais","textarea",""),
          field("defaultWhatsappUrl","WhatsApp padrão / atendimento","url",""),
          field("defaultGroupUrl","Grupo da rifa padrão","url",""),
          field("defaultWhatsappMessage","Mensagem pronta padrão","textarea","Olá! Entrei pela página da rifa Pense Offgrid. Quero confirmar minha pré-reserva.\n\nRifa: {{rifa}}\nCódigo: {{codigo}}\nNúmeros: {{numeros}}\nTotal: {{total}}\nNome: {{nome}}\nWhatsApp: {{whatsapp}}"),
          field("pixKey","Chave Pix padrão","text",""),
          field("paymentInstructions","Instruções de pagamento padrão","textarea","Após reservar, envie o comprovante no WhatsApp oficial para confirmação manual."),
          field("legalNotice","Aviso/observação legal","textarea","Campanha sujeita às regras informadas pelo organizador. Pagamentos e confirmações devem ser validados manualmente no painel."),
          field("mercadoPagoEnabled","Mercado Pago automático ativo","boolean","false"),
          field("mercadoPagoEnvironment","Ambiente Mercado Pago","select","production",["production","sandbox"]),
          field("mercadoPagoMode","Modo Mercado Pago","select","checkout_pro",["checkout_pro"]),
          field("mercadoPagoPublicKey","Public Key Mercado Pago","text","APP_USR-..."),
          field("mercadoPagoWebhookUrl","Webhook configurado no Mercado Pago","url","https://www.penseoffgrid.com.br/.netlify/functions/mp-webhook"),
          field("mercadoPagoBrandName","Nome no checkout","text","Pense Offgrid"),
          field("mercadoPagoStatementDescriptor","Descrição na fatura/extrato","text","PENSEOFFGRID"),
          field("mercadoPagoRetryEnabled","Permitir nova tentativa de pagamento","boolean","true"),
          field("mercadoPagoAutoExpireHours","Expirar reserva pendente em horas","number","4"),
          field("paymentSuccessMessage","Mensagem após pagamento aprovado","textarea","Pagamento aprovado! Seus números foram confirmados automaticamente na rifa."),
          field("paymentPendingMessage","Mensagem após pagamento pendente","textarea","Pagamento criado. Assim que o Mercado Pago confirmar, seus números serão liberados como pagos automaticamente."),
          field("mercadoPagoNotes","Observações internas da integração","textarea","O Access Token e segredos NÃO ficam aqui. Configure MP_ACCESS_TOKEN no Netlify Environment Variables.")
        ]
      },
      {
        key:"items",
        title:"Rifas",
        type:"collection",
        collection:"items",
        primary:"title",
        schema:[
          field("title","Produto da rifa","text","Inversor 11kW 48V"),
          field("slug","Slug","text","inversor-11kw-48v"),
          field("headline","Título no modal","text","Rifa do inversor 11kW 48V"),
          field("description","Descrição","textarea",""),
          field("icon","Ícone fallback","text","⚡"),
          field("imageUrl","Imagem do produto","image",""),
          field("ticketPrice","Valor do número","number","10"),
          field("totalNumbers","Total de números","number","400"),
          field("soldNumbers","Números indisponíveis/vendidos","textarea","3, 8, 17"),
          field("prizeNumbers","Números premiados instantâneos","textarea","181|10\n250|20\n777|50"),
          field("showPrizeNumbers","Destacar números premiados na página","boolean","true"),
          field("discountEnabled","Ativar desconto progressivo","boolean","false"),
          field("discountEveryTickets","A cada quantos números aplica desconto","number","2"),
          field("discountPercentPerStep","Desconto por faixa (%)","number","5"),
          field("discountMaxPercent","Desconto máximo (%)","number","20"),
          field("minimumSoldPercent","Venda mínima (%)","number","50"),
          field("maxTicketsPerOrder","Limite por reserva","number","20"),
          field("reservationHours","Validade da pré-reserva (horas)","number","4"),
          field("drawDate","Data do sorteio","date",""),
          field("drawTime","Hora do sorteio","text","19:00"),
          field("drawReference","Referência do sorteio","text","Loteria Federal"),
          field("drawRules","Regras do sorteio","textarea","Sorteio pela Loteria Federal."),
          field("recentBuyers","Últimas participações","textarea","Rafael|Recife|PE|4"),
          field("paymentUrl","Link de pagamento/agregador","url",""),
          field("whatsappUrl","Link WhatsApp/checkout manual","url",""),
          field("groupUrl","Grupo específico da rifa","url",""),
          field("whatsappMessageTemplate","Mensagem pronta da rifa","textarea","Olá! Quero confirmar minha pré-reserva na rifa {{rifa}}.\n\nCódigo: {{codigo}}\nNúmeros: {{numeros}}\nTotal: {{total}}\nNome: {{nome}}\nWhatsApp: {{whatsapp}}\nCidade/UF: {{cidadeUf}}\n\nEnviei/irei enviar o comprovante para validação manual."),
          field("pixKey","Chave Pix específica","text",""),
          field("pixCopyPaste","Pix copia e cola","textarea",""),
          field("paymentInstructions","Instruções de pagamento","textarea","Reserve seus números e envie o comprovante no WhatsApp para confirmação manual."),
          field("mercadoPagoEnabled","Usar Mercado Pago automático nesta rifa","boolean","false"),
          field("autoReserveBeforePayment","Bloquear números antes do pagamento","boolean","true"),
          field("telegramNotify","Telegram bot/webhook","url",""),
          field("winnerName","Ganhador","text",""),
          field("winnerCity","Cidade do ganhador","text",""),
          field("winnerNumbers","Número(s) vencedor(es)","text",""),
          field("resultUrl","Link do resultado/comprovante","url",""),
          field("showProgress","Mostrar progresso","boolean","true"),
          field("showCountdown","Mostrar contagem regressiva","boolean","true"),
          field("featured","Destaque","boolean","false"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","active","draft","hidden","finished"])
        ]
      },
      {
        key:"buyers",
        title:"Compradores / histórico",
        type:"collection",
        collection:"buyers",
        primary:"name",
        schema:[
          field("raffleSlug","Slug da rifa","text",""),
          field("name","Nome","text",""),
          field("whatsapp","WhatsApp","text",""),
          field("email","E-mail","text",""),
          field("city","Cidade","text",""),
          field("state","Estado","text",""),
          field("cpf","CPF opcional","text",""),
          field("numbers","Números comprados","textarea",""),
          field("amount","Valor total","number","0"),
          field("subtotalAmount","Subtotal sem desconto","number","0"),
          field("discountAmount","Desconto aplicado","number","0"),
          field("discountPercent","Percentual de desconto","number","0"),
          field("instantPrizeAmount","Prêmio instantâneo total","number","0"),
          field("instantPrizeNumbers","Números premiados acertados","textarea",""),
          field("orderCode","Código da reserva","text",""),
          field("paymentStatus","Status do pagamento","select","pending",["pending","reserved","paid","cancelled","refunded","expired"]),
          field("reservationStatus","Status da reserva","select","reserved",["clicked","reserved","confirmed","cancelled","expired"]),
          field("contactStatus","Status do contato","select","waiting",["waiting","sent_message","answered","no_answer","invalid_contact"]),
          field("source","Origem","select","public-site",["public-site","admin","whatsapp","manual","grupo","outro"]),
          field("selectedAt","Selecionou em","datetime",""),
          field("reservationExpiresAt","Reserva expira em","datetime",""),
          field("paidAt","Pago em","datetime",""),
          field("proofUrl","Comprovante/URL","url",""),
          field("mercadoPagoPreferenceId","ID preferência Mercado Pago","text",""),
          field("mercadoPagoPaymentId","ID pagamento Mercado Pago","text",""),
          field("mercadoPagoStatus","Status bruto Mercado Pago","text",""),
          field("mercadoPagoPaymentUrl","Link de pagamento Mercado Pago","url",""),
          field("groupMessage","Mensagem enviada/pronta","textarea",""),
          field("notes","Observações","textarea",""),
          field("createdDate","Data","date","")
        ]
      }
    ]
  },
  {
    id:"tutorials",
    icon:"🛠️",
    title:"Tutoriais",
    description:"Controle de tutoriais, categorias, PDFs, textos, imagens e passo a passo.",
    publicUrl:"../tutoriais/",
    sections:[
      {
        key:"settings",
        title:"Página de tutoriais",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título","text","Tutoriais Offgrid"),
          field("subtitle","Subtítulo","textarea","Adaptações, pequenos ajustes e soluções práticas."),
          field("statusText","Mensagem enquanto estiver em breve","textarea","Em breve, tutoriais de adaptações e pequenos ajustes para sua offgrid decolar.")
        ]
      },
      {
        key:"categories",
        title:"Categorias",
        type:"collection",
        collection:"categories",
        primary:"title",
        schema:[
          field("title","Categoria","text","Inversores"),
          field("slug","Slug","text","inversores"),
          field("description","Descrição","textarea",""),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"items",
        title:"Tutoriais",
        type:"collection",
        collection:"items",
        primary:"title",
        schema:[
          field("title","Título","text","Tutorial"),
          field("slug","Slug","text",""),
          field("category","Categoria","text",""),
          field("level","Nível","select","iniciante",["iniciante","intermediario","avancado","pro"]),
          field("readTime","Tempo de leitura","text","5 min"),
          field("excerpt","Resumo","textarea",""),
          field("content","Corpo do tutorial em Markdown","textarea","Use texto, **negrito**, [links](https://...) e imagens: ![legenda](URL_DA_IMAGEM)"),
          field("imageUrl","Imagem/capa do tutorial","image",""),
          field("bodyImageUrl","Imagem para inserir no corpo","image",""),
          field("bodyImageAlt","Legenda da imagem do corpo","text",""),
          field("galleryUrls","Galeria / imagens extras no corpo (uma URL por linha)","textarea",""),
          field("pdfUrl","PDF opcional","url",""),
          field("videoUrl","Vídeo opcional","url",""),
          field("ctaText","Texto CTA","text","Ver curso relacionado"),
          field("ctaUrl","Link CTA","url","/cursos/"),
          field("vipUrl","Link VIP/Grupo","url",""),
          field("featured","Destaque?","boolean","false"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  },
  {
    id:"offers",
    icon:"🛒",
    title:"Ofertas",
    description:"Produtos, cupons e links afiliados rastreáveis com página intermediária própria do Pense Offgrid.",
    publicUrl:"../oferta/",
    sections:[
      {
        key:"settings",
        title:"Configurações de ofertas",
        type:"settings",
        doc:"main",
        schema:[
          field("title","Título da central","text","Ofertas Pense Offgrid"),
          field("subtitle","Subtítulo","textarea","Produtos, ferramentas e equipamentos selecionados para sistemas off-grid."),
          field("defaultButtonText","Texto padrão do botão","text","Abrir oferta"),
          field("disclaimer","Aviso / transparência","textarea","Alguns links podem gerar comissão para apoiar o ecossistema Pense Offgrid, sem custo extra para você."),
          field("whatsappUrl","WhatsApp de suporte","url",""),
          field("status","Status geral","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"items",
        title:"Produtos e ofertas",
        type:"collection",
        collection:"items",
        primary:"title",
        schema:[
          field("title","Nome do produto/oferta","text","Inversor 6200W 48V"),
          field("slug","Slug / ID da oferta","text","inversor-6200w-48v"),
          field("category","Categoria","text","inversores"),
          field("store","Loja / marketplace","text","Mercado Livre"),
          field("brand","Marca","text",""),
          field("price","Preço exibido","text","R$ 1.999,90"),
          field("oldPrice","Preço anterior opcional","text",""),
          field("coupon","Cupom","text",""),
          field("description","Descrição curta","textarea","Oferta selecionada para sistemas off-grid."),
          field("details","Detalhes / observações","textarea",""),
          field("imageUrl","Imagem do produto","image",""),
          field("affiliateUrl","Link afiliado final","url",""),
          field("buttonText","Texto do botão","text","Abrir oferta"),
          field("badge","Selo destaque","text","Oferta verificada"),
          field("featured","Destaque?","boolean","false"),
          field("clicks","Cliques registrados","number","0"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"clicks",
        title:"Histórico de cliques",
        type:"collection",
        collection:"clicks",
        primary:"offerTitle",
        schema:[
          field("offerId","ID da oferta","text",""),
          field("offerSlug","Slug da oferta","text",""),
          field("offerTitle","Oferta","text",""),
          field("store","Loja","text",""),
          field("targetUrl","URL destino","url",""),
          field("source","Origem","text",""),
          field("createdAtText","Data/hora","text",""),
          field("userAgent","User agent","textarea","")
        ]
      }
    ]
  },
  {
    id:"promotional",
    icon:"📣",
    title:"Promocional",
    description:"Central de mensagens prontas, grupos, canais, links afiliados, cupons e histórico de disparos.",
    publicUrl:"../",
    sections:[
      {
        key:"settings",
        title:"Configuração promocional",
        type:"settings",
        doc:"main",
        schema:[
          field("defaultSignature","Assinatura padrão","textarea","Pense Offgrid ⚡\nEnergia, autonomia e oportunidades offgrid."),
          field("mainWhatsAppGroup","Grupo principal WhatsApp","url",""),
          field("mainTelegramGroup","Canal/Grupo Telegram","url",""),
          field("mainAffiliateUrl","Link afiliado principal","url",""),
          field("mainCouponUrl","Link global de cupons","url","")
        ]
      },
      {
        key:"templates",
        title:"Modelos de mensagem",
        type:"collection",
        collection:"templates",
        primary:"title",
        schema:[
          field("title","Nome do modelo","text","Divulgação de notícia"),
          field("channel","Canal","select","whatsapp",["whatsapp","telegram","youtube_community","instagram","tiktok","generic"]),
          field("message","Mensagem pronta","textarea","⚡ {title}\n\n{excerpt}\n\nLeia aqui: {url}\n\n{signature}"),
          field("affiliateUrl","Link afiliado opcional","url",""),
          field("coupon","Cupom opcional","text",""),
          field("tags","Hashtags","text","#PenseOffgrid #EnergiaSolar #Offgrid"),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"groups",
        title:"Grupos e canais",
        type:"collection",
        collection:"groups",
        primary:"title",
        schema:[
          field("title","Nome do grupo/canal","text","Grupo VIP Pense Offgrid"),
          field("type","Tipo","select","whatsapp",["whatsapp","telegram","youtube","instagram","tiktok","email","other"]),
          field("url","Link do grupo/canal","url",""),
          field("description","Descrição","textarea",""),
          field("priority","Prioridade","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"affiliateLinks",
        title:"Links afiliados e cupons",
        type:"collection",
        collection:"affiliateLinks",
        primary:"title",
        schema:[
          field("title","Nome do link","text","Shopee referência"),
          field("platform","Plataforma","select","shopee",["shopee","mercadolivre","aliexpress","amazon","site","other"]),
          field("url","Link afiliado","url",""),
          field("coupon","Cupom","text",""),
          field("description","Descrição","textarea",""),
          field("category","Categoria","text","geral"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"broadcasts",
        title:"Histórico de disparos",
        type:"collection",
        collection:"broadcasts",
        primary:"title",
        schema:[
          field("title","Título do disparo","text","Disparo"),
          field("channel","Canal","select","whatsapp",["whatsapp","telegram","youtube_community","instagram","tiktok","generic"]),
          field("message","Mensagem","textarea",""),
          field("targetUrl","Link divulgado","url",""),
          field("relatedModule","Módulo relacionado","text",""),
          field("relatedId","ID relacionado","text",""),
          field("date","Data","date",""),
          field("status","Status","select","draft",["sent","draft","archived"])
        ]
      }
    ]
  },
  {
    id:"global",
    icon:"🔗",
    title:"Links globais",
    description:"Controle de links comissionados, grupos de WhatsApp, botões globais, cupons e campanhas.",
    publicUrl:"../",
    sections:[
      {
        key:"links",
        title:"Links e cupons",
        type:"collection",
        collection:"links",
        primary:"title",
        schema:[
          field("title","Nome","text","Grupo VIP"),
          field("key","Chave global","text","vipGroup"),
          field("type","Tipo","select","whatsapp",["affiliate","whatsapp","social","coupon","contact","other"]),
          field("url","Link","url",""),
          field("description","Descrição","textarea",""),
          field("coupon","Cupom","text",""),
          field("context","Onde usar","select","global",["global","home","news","projects","courses","raffles","footer"]),
          field("order","Ordem","number","1"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      },
      {
        key:"campaigns",
        title:"Mensagens de divulgação",
        type:"collection",
        collection:"campaigns",
        primary:"title",
        schema:[
          field("title","Título da campanha","text","Divulgação notícia"),
          field("channel","Canal","select","whatsapp",["whatsapp","telegram","youtube_community","instagram","tiktok","email"]),
          field("message","Mensagem","textarea",""),
          field("targetUrl","Link de destino","url",""),
          field("imageUrl","Imagem","image",""),
          field("status","Status","select","draft",["published","draft","hidden"])
        ]
      }
    ]
  }
  ,
  {
    id:"seo",
    icon:"🔎",
    title:"SEO",
    description:"SEO avançado, sitemap, Open Graph e prévias sociais do ecossistema.",
    publicUrl:"../sitemap.xml",
    sections:[
      {
        key:"settings",
        title:"Configuração global de SEO",
        type:"settings",
        doc:"main",
        schema:[
          field("siteName","Nome do site","text","Pense Offgrid"),
          field("siteUrl","URL oficial","url","https://www.penseoffgrid.com.br"),
          field("defaultTitle","Título padrão","text","Pense Offgrid | Energia solar, off-grid e autonomia"),
          field("defaultDescription","Descrição padrão","textarea","Projetos, cursos, tutoriais, rifas, notícias e ofertas para quem quer montar sistemas off-grid com clareza e segurança."),
          field("defaultOgImage","Imagem padrão de compartilhamento","image","/og-thumb.png"),
          field("twitterHandle","Twitter/X handle opcional","text",""),
          field("robotsMode","Robots","select","index",["index","noindex"]),
          field("sitemapEnabled","Sitemap ativo","boolean","true"),
          field("shareFunctionEnabled","Prévia social dinâmica ativa","boolean","true"),
          field("organizationName","Nome da organização","text","Pense Offgrid"),
          field("organizationLogo","Logo da organização","image","/og-thumb.png")
        ]
      },
      {
        key:"pages",
        title:"SEO por página/módulo",
        type:"collection",
        collection:"pages",
        primary:"title",
        schema:[
          field("title","Título interno","text","Página / módulo"),
          field("module","Módulo","select","home",["home","news","projects","raffles","courses","tutorials","offers","calculator","games","vip","custom"]),
          field("targetSlug","Slug/ID do conteúdo opcional","text",""),
          field("publicUrl","URL pública","url","/"),
          field("metaTitle","Meta title","text",""),
          field("metaDescription","Meta description","textarea",""),
          field("keywords","Keywords separadas por vírgula","text","offgrid, energia solar, autonomia"),
          field("ogImageUrl","Imagem OG personalizada","image",""),
          field("canonicalUrl","Canonical URL","url",""),
          field("schemaType","Schema JSON-LD","select","WebPage",["WebPage","Article","Product","Course","Event","FAQPage","BreadcrumbList"]),
          field("priority","Prioridade sitemap","number","0.7"),
          field("changefreq","Frequência sitemap","select","weekly",["always","hourly","daily","weekly","monthly","yearly","never"]),
          field("includeInSitemap","Incluir no sitemap","boolean","true"),
          field("status","Status","select","published",["published","draft","hidden"])
        ]
      }
    ]
  }

];

function field(name,label,type,placeholder="",options=[]){
  return {name,label,type,placeholder,options};
}

function modulePath(moduleId){
  return [...ROOT, moduleId];
}

function settingsRef(moduleId, docId="main"){
  return doc(db, ...modulePath(moduleId), "settings", docId);
}

function collectionRef(moduleId, collectionName){
  return collection(db, ...modulePath(moduleId), collectionName);
}

function itemRef(moduleId, collectionName, id){
  return doc(db, ...modulePath(moduleId), collectionName, id);
}

function slugify(text){
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,90);
}

function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function toast(message){
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2600);
}

function getModule(id){
  return MODULES.find(m => m.id === id);
}

function getCurrentModule(){
  return getModule(currentModuleId);
}

function getSection(moduleId, key){
  const mod = getModule(moduleId);
  return mod?.sections?.find(s => s.key === key);
}

function getPrimaryText(item, section){
  if(!item) return "Item";
  const primary = section.primary || "title";
  return item[primary] || item.title || item.label || item.name || item.slug || item.id || "Item";
}

function normalizeForSave(data, schema){
  const output = {};
  schema.forEach(f => {
    let value = data[f.name];

    if(f.type === "number"){
      value = Number(value || 0);
    }

    if(f.type === "boolean"){
      value = value === true || value === "true";
    }

    output[f.name] = value ?? "";
  });

  if(!output.slug){
    const source = output.title || output.label || output.name || output.id || "";
    if(source) output.slug = slugify(source);
  }

  return output;
}

async function compressImage(file, maxWidth = 1400, quality = 0.78){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => {
        if(!blob) reject(new Error("Falha ao compactar imagem."));
        else resolve(blob);
      }, "image/jpeg", quality);
    };

    img.onerror = () => reject(new Error("Imagem inválida."));
    img.src = url;
  });
}

async function uploadImage(file, moduleId, sectionKey, preferredName){
  if(!file) return "";
  const blob = await compressImage(file);
  const clean = slugify(preferredName || file.name || "imagem") || "imagem";
  const filename = `${Date.now()}_${clean}.jpg`;
  const storagePath = `penseoffgrid/${moduleId}/${sectionKey}/${filename}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, {
    contentType:"image/jpeg",
    customMetadata:{
      module:moduleId,
      section:sectionKey,
      source:"penseoffgrid-admin-global-v2",
      originalName:file.name || ""
    }
  });

  const url = await getDownloadURL(storageRef);
  await registerUploadedMedia({
    url,
    storagePath,
    moduleId,
    sectionKey,
    preferredName,
    originalName:file.name || "",
    size:file.size || 0
  });
  return url;
}

async function registerUploadedMedia({url, storagePath, moduleId, sectionKey, preferredName, originalName, size}){
  if(!url || moduleId === "media") return;
  try{
    const baseName = preferredName || originalName || "imagem";
    const id = `${slugify(moduleId)}-${slugify(sectionKey)}-${Date.now()}`;
    const name = String(baseName || "Imagem").replace(/\.[a-z0-9]+$/i, "").trim() || "Imagem";
    await setDoc(itemRef("media", "library", id), {
      id,
      name,
      slug:id,
      imageUrl:url,
      category:mediaCategoryFromContext(moduleId, sectionKey),
      tags:[moduleId, sectionKey].filter(Boolean).join(", "),
      alt:name,
      sourceModule:moduleId,
      sourceSection:sectionKey,
      storagePath,
      originalName:originalName || "",
      sizeBytes:Number(size || 0),
      status:"published",
      order:Date.now(),
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    }, {merge:true});
  }catch(error){
    console.warn("Imagem enviada, mas não foi possível registrar na biblioteca de mídia:", error);
  }
}

function mediaCategoryFromContext(moduleId, sectionKey){
  const map = {
    home:"banner",
    news:"noticia",
    projects:"projeto",
    raffles:"rifa",
    courses:"curso",
    tutorials:"tutorials"
  };
  if(moduleId === "tutorials") return "tutorial";
  return map[moduleId] || sectionKey || "outro";
}

function renderModuleTabs(){
  const nav = $("moduleTabs");
  nav.innerHTML = MODULES.map(mod => {
    const count = countModuleItems(mod.id);
    const active = mod.id === "dashboard" ? "active" : "";
    return `<button class="module-tab ${active}" type="button" data-module="${mod.id}">
      <span>${mod.icon} ${escapeHtml(mod.title)}</span>
      <small>${count}</small>
    </button>`;
  }).join("");

  nav.querySelectorAll("[data-module]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.module;
      if(id === "dashboard"){
        openDashboard();
      }else{
        openModule(id);
      }
    });
  });
}

function countModuleItems(moduleId){
  const data = cache[moduleId] || {};
  let total = 0;
  Object.keys(data).forEach(key => {
    if(Array.isArray(data[key])) total += data[key].length;
  });
  return total;
}

function setActiveTab(moduleId){
  document.querySelectorAll(".module-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.module === moduleId);
  });
}

function openDashboard(){
  currentModuleId = "dashboard";
  setActiveTab("dashboard");
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  $("dashboardPanel").classList.add("active");
  renderDashboard();
}

function openModule(moduleId){
  const mod = getModule(moduleId);
  if(!mod || !mod.sections?.length) return;

  currentModuleId = moduleId;
  currentSectionKey = mod.sections[0].key;

  setActiveTab(moduleId);
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  $("modulePanel").classList.add("active");

  $("moduleEyebrow").textContent = "Módulo do ecossistema";
  $("moduleTitle").textContent = mod.title;
  $("moduleDescription").textContent = mod.description;
  $("openPublicPage").href = mod.publicUrl || "../";

  renderSectionTabs();
  renderCurrentSection();
}

function renderSectionTabs(){
  const mod = getCurrentModule();
  $("sectionTabs").innerHTML = mod.sections.map(section => `
    <button class="section-tab ${section.key === currentSectionKey ? "active" : ""}" type="button" data-section="${section.key}">
      ${escapeHtml(section.title)}
    </button>
  `).join("");

  $("sectionTabs").querySelectorAll("[data-section]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentSectionKey = btn.dataset.section;
      renderSectionTabs();
      renderCurrentSection();
    });
  });
}

function renderCurrentSection(){
  const mod = getCurrentModule();
  const section = getSection(mod.id, currentSectionKey);

  $("createMainItemBtn").style.display = section.type === "collection" ? "inline-flex" : "none";
  $("createMainItemBtn").textContent = section.type === "collection" ? `Novo ${section.title}` : "Salvar";

  if(section.type === "settings"){
    renderSettingsSection(mod, section);
  }else{
    renderCollectionSection(mod, section);
  }
}

function renderSettingsSection(mod, section){
  const data = cache[mod.id]?.settings?.[section.doc] || {};
  const area = $("sectionArea");

  area.innerHTML = `
    <div class="glass card">
      <div class="card-head">
        <div>
          <span class="eyebrow">${escapeHtml(mod.title)}</span>
          <h2>${escapeHtml(section.title)}</h2>
          <p>Campos globais salvos em settings/${escapeHtml(section.doc)}.</p>
        </div>
        <div class="header-actions">
          ${mod.id === "home" && section.key === "settings" ? '<button class="btn green" id="importLegacyHomeBtn" type="button">Importar home atual</button>' : ""}
          ${mod.id === "raffles" && section.key === "settings" ? '<button class="btn ghost" id="testMercadoPagoBtn" type="button">Testar Mercado Pago</button>' : ""}
          <button class="btn primary" id="saveSettingsBtn" type="button">Salvar configurações</button>
        </div>
      </div>
      <form class="settings-grid" id="settingsForm">
        ${section.schema.map(fieldHtml(data)).join("")}
      </form>
    </div>
  `;

  attachSlugAuto("settingsForm");
  area.querySelector("#saveSettingsBtn").addEventListener("click", () => saveSettings(mod.id, section));
  area.querySelector("#importLegacyHomeBtn")?.addEventListener("click", () => importLegacyHome());
  area.querySelector("#importGlobalLinksBtn")?.addEventListener("click", () => importDefaultGlobalLinks());
  area.querySelector("#testMercadoPagoBtn")?.addEventListener("click", () => testMercadoPagoConnection());
}

async function testMercadoPagoConnection(){
  const button = document.getElementById("testMercadoPagoBtn");
  const original = button?.textContent || "Testar Mercado Pago";
  try{
    if(button){ button.disabled = true; button.textContent = "Testando..."; }
    const response = await fetch("/.netlify/functions/mp-health", { method:"GET", headers:{"Accept":"application/json"} });
    const payload = await response.json().catch(() => ({}));
    if(!response.ok || !payload.ok){
      throw new Error(payload.message || "Falha no teste da integração Mercado Pago.");
    }
    const parts = [
      payload.message || "Mercado Pago conectado.",
      payload.siteUrl ? `Site: ${payload.siteUrl}` : "",
      payload.webhookUrl ? `Webhook: ${payload.webhookUrl}` : ""
    ].filter(Boolean);
    toast(parts.join(" | "));
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao testar Mercado Pago.");
  }finally{
    if(button){ button.disabled = false; button.textContent = original; }
  }
}

function renderCollectionSection(mod, section){
  const area = $("sectionArea");
  const items = cache[mod.id]?.[section.collection] || [];
  const statuses = uniqueValues(items, ["status", "availability"]);
  const categories = uniqueValues(items, ["category", "level", "type"]);
  const sortOptions = collectionSortOptions(section);
  const bulkFields = getBulkEditableFields(section);

  area.innerHTML = `
    <div class="glass card">
      <div class="card-head">
        <div>
          <span class="eyebrow">${escapeHtml(mod.title)}</span>
          <h2>${escapeHtml(section.title)}</h2>
          <p>Crie, edite, duplique, exclua, publique, filtre e edite itens em massa desta seção.</p>
        </div>
        <button class="btn primary" id="newItemBtn" type="button">Novo item</button>
      </div>

      <div class="toolbar advanced-toolbar">
        <input class="search-input" id="sectionSearch" placeholder="Buscar por título, slug, status, categoria ou conteúdo..."/>
        <select id="sectionStatusFilter" aria-label="Filtrar status">
          <option value="">Todos os status</option>
          ${statuses.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(labelOption(v))}</option>`).join("")}
        </select>
        <select id="sectionCategoryFilter" aria-label="Filtrar categoria/tipo">
          <option value="">Todas categorias/tipos</option>
          ${categories.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(labelOption(v))}</option>`).join("")}
        </select>
        <select id="sectionSortFilter" aria-label="Ordenar itens">
          ${sortOptions.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join("")}
        </select>
        <button class="btn ghost" id="reloadSectionBtn" type="button">Recarregar</button>
        <button class="btn ghost" id="seedSectionBtn" type="button">Exemplo</button>
        ${mod.id === "projects" && section.collection === "items" ? '<button class="btn green" id="importLegacyProjectsBtn" type="button">Importar projetos atuais</button>' : ""}
        ${mod.id === "raffles" && section.collection === "items" ? '<button class="btn green" id="importLegacyRafflesBtn" type="button">Importar rifas atuais</button>' : ""}
        ${mod.id === "courses" && section.collection === "lessons" ? '<button class="btn green" id="importLegacyCoursesBtn" type="button">Importar cursos atuais</button>' : ""}
        ${mod.id === "tutorials" && section.collection === "items" ? '<button class="btn green" id="importLegacyTutorialsBtn" type="button">Importar tutoriais atuais</button>' : ""}
        ${mod.id === "home" ? '<button class="btn green" id="importLegacyHomeBtn" type="button">Importar home atual</button>' : ""}
        ${mod.id === "global" && section.collection === "links" ? '<button class="btn green" id="importGlobalLinksBtn" type="button">Importar links padrão</button>' : ""}
      </div>

      <div class="bulk-toolbar" id="bulkToolbar">
        <label class="bulk-check"><input id="selectVisibleItems" type="checkbox"/> Selecionar filtrados</label>
        <span class="bulk-count" id="bulkCount">0 selecionados</span>
        <select id="bulkFieldSelect" aria-label="Campo para edição em massa">
          <option value="">Campo para editar em massa</option>
          ${bulkFields.map(f => `<option value="${escapeHtml(f.name)}">${escapeHtml(f.label || f.name)}</option>`).join("")}
        </select>
        <input id="bulkFieldValue" placeholder="Novo valor"/>
        <button class="btn green" id="applyBulkFieldBtn" type="button">Aplicar campo</button>
        <select id="bulkStatusSelect" aria-label="Status em massa">
          <option value="">Status rápido</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
          <option value="hidden">Oculto</option>
        </select>
        <button class="btn ghost" id="applyBulkStatusBtn" type="button">Aplicar status</button>
        <button class="btn ghost" id="duplicateBulkBtn" type="button">Duplicar</button>
        <button class="btn danger" id="deleteBulkBtn" type="button">Excluir</button>
      </div>

      <div class="list-summary" id="listSummary"></div>
      <div class="table-list" id="itemsList"></div>
    </div>
  `;

  const rerender = () => renderItemsList(mod, section);

  area.querySelector("#newItemBtn").addEventListener("click", () => openEditor(mod.id, section.key, null));
  area.querySelector("#reloadSectionBtn").addEventListener("click", () => loadModule(mod.id).then(() => renderCurrentSection()));
  area.querySelector("#seedSectionBtn").addEventListener("click", () => seedExample(mod.id, section.key));
  area.querySelector("#importLegacyProjectsBtn")?.addEventListener("click", () => importLegacyProjects());
  area.querySelector("#importLegacyRafflesBtn")?.addEventListener("click", () => importLegacyRaffles());
  area.querySelector("#importLegacyCoursesBtn")?.addEventListener("click", () => importLegacyCourses());
  area.querySelector("#importLegacyTutorialsBtn")?.addEventListener("click", () => importLegacyTutorials());
  area.querySelector("#importLegacyHomeBtn")?.addEventListener("click", () => importLegacyHome());
  area.querySelector("#importGlobalLinksBtn")?.addEventListener("click", () => importDefaultGlobalLinks());
  area.querySelector("#sectionSearch").addEventListener("input", rerender);
  area.querySelector("#sectionStatusFilter").addEventListener("change", rerender);
  area.querySelector("#sectionCategoryFilter").addEventListener("change", rerender);
  area.querySelector("#sectionSortFilter").addEventListener("change", rerender);
  area.querySelector("#selectVisibleItems").addEventListener("change", (event) => toggleVisibleSelection(event.target.checked));
  area.querySelector("#applyBulkFieldBtn").addEventListener("click", () => applyBulkFieldUpdate(mod.id, section.key));
  area.querySelector("#applyBulkStatusBtn").addEventListener("click", () => applyBulkStatusUpdate(mod.id, section.key));
  area.querySelector("#duplicateBulkBtn").addEventListener("click", () => duplicateSelectedItems(mod.id, section.key));
  area.querySelector("#deleteBulkBtn").addEventListener("click", () => deleteSelectedItems(mod.id, section.key));

  renderItemsList(mod, section);
}

function uniqueValues(items, keys){
  const values = new Set();
  items.forEach(item => {
    keys.forEach(key => {
      const value = item && item[key] !== undefined && item[key] !== null ? String(item[key]).trim() : "";
      if(value) values.add(value);
    });
  });
  return [...values].sort((a,b) => a.localeCompare(b, "pt-BR"));
}

function collectionSortOptions(section){
  const names = new Set((section.schema || []).map(f => f.name));
  const options = [
    {value:"order-asc", label:"Ordem crescente"},
    {value:"updated-desc", label:"Atualizados primeiro"},
    {value:"title-asc", label:"Título A-Z"},
    {value:"title-desc", label:"Título Z-A"}
  ];
  if(names.has("date") || names.has("publishAt")) options.splice(1, 0, {value:"date-desc", label:"Data mais recente"});
  if(names.has("price") || names.has("ticketPrice") || names.has("targetValue")) options.push({value:"price-desc", label:"Maior valor"});
  return options;
}

function getBulkEditableFields(section){
  return (section.schema || []).filter(f => !["image"].includes(f.type));
}

function getPrimaryComparable(item){
  return String(item.title || item.label || item.name || item.slug || item.id || "").toLowerCase();
}

function timestampValue(value){
  if(!value) return 0;
  if(typeof value.toMillis === "function") return value.toMillis();
  if(typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getCollectionFilterState(){
  return {
    query:String($("sectionSearch")?.value || "").toLowerCase().trim(),
    status:String($("sectionStatusFilter")?.value || ""),
    category:String($("sectionCategoryFilter")?.value || ""),
    sort:String($("sectionSortFilter")?.value || "order-asc")
  };
}

function itemMatchesFilters(item, state){
  if(state.query && !JSON.stringify(item).toLowerCase().includes(state.query)) return false;
  if(state.status){
    const statusValues = [item.status, item.availability].map(v => String(v || ""));
    if(!statusValues.includes(state.status)) return false;
  }
  if(state.category){
    const categoryValues = [item.category, item.level, item.type].map(v => String(v || ""));
    if(!categoryValues.includes(state.category)) return false;
  }
  return true;
}

function sortCollectionItems(items, sort){
  const sorted = [...items];
  sorted.sort((a,b) => {
    if(sort === "title-desc") return getPrimaryComparable(b).localeCompare(getPrimaryComparable(a), "pt-BR");
    if(sort === "title-asc") return getPrimaryComparable(a).localeCompare(getPrimaryComparable(b), "pt-BR");
    if(sort === "updated-desc") return timestampValue(b.updatedAt || b.createdAt) - timestampValue(a.updatedAt || a.createdAt);
    if(sort === "date-desc") return timestampValue(b.publishAt || b.date || b.createdAt) - timestampValue(a.publishAt || a.date || a.createdAt);
    if(sort === "price-desc") return Number(b.price || b.ticketPrice || b.targetValue || 0) - Number(a.price || a.ticketPrice || a.targetValue || 0);
    return Number(a.order || 9999) - Number(b.order || 9999) || getPrimaryComparable(a).localeCompare(getPrimaryComparable(b), "pt-BR");
  });
  return sorted;
}

function getFilteredItems(mod, section){
  const state = getCollectionFilterState();
  const all = cache[mod.id]?.[section.collection] || [];
  return sortCollectionItems(all.filter(item => itemMatchesFilters(item, state)), state.sort);
}

function selectedItemIds(){
  return [...document.querySelectorAll(".bulk-item-check:checked")].map(input => input.value).filter(Boolean);
}

function updateBulkCount(){
  const count = selectedItemIds().length;
  const countEl = $("bulkCount");
  if(countEl) countEl.textContent = `${count} selecionado${count === 1 ? "" : "s"}`;
  const visibleChecks = [...document.querySelectorAll(".bulk-item-check")];
  const selectAll = $("selectVisibleItems");
  if(selectAll){
    selectAll.checked = visibleChecks.length > 0 && visibleChecks.every(input => input.checked);
    selectAll.indeterminate = visibleChecks.some(input => input.checked) && !selectAll.checked;
  }
}

function toggleVisibleSelection(checked){
  document.querySelectorAll(".bulk-item-check").forEach(input => { input.checked = checked; });
  updateBulkCount();
}

function normalizeBulkFieldValue(field, rawValue){
  if(!field) return rawValue;
  if(field.type === "boolean") return ["true", "sim", "1", "yes", "on", "ativado"].includes(String(rawValue).trim().toLowerCase());
  if(field.type === "number") return Number(rawValue || 0);
  return rawValue;
}

async function applyBulkFieldUpdate(moduleId, sectionKey){
  const section = getSection(moduleId, sectionKey);
  const ids = selectedItemIds();
  const fieldName = $("bulkFieldSelect")?.value || "";
  const field = (section.schema || []).find(f => f.name === fieldName);
  if(!ids.length) return toast("Selecione pelo menos um item.");
  if(!field) return toast("Escolha um campo para editar em massa.");
  if(!confirm(`Aplicar o campo "${field.label || field.name}" em ${ids.length} item(ns)?`)) return;

  const value = normalizeBulkFieldValue(field, $("bulkFieldValue")?.value || "");
  const payload = {[field.name]:value, updatedAt:serverTimestamp()};

  try{
    for(const id of ids) await setDoc(itemRef(moduleId, section.collection, id), payload, {merge:true});
    toast("Edição em massa aplicada.");
    await loadModule(moduleId);
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro na edição em massa.");
  }
}

async function applyBulkStatusUpdate(moduleId, sectionKey){
  const section = getSection(moduleId, sectionKey);
  const ids = selectedItemIds();
  const status = $("bulkStatusSelect")?.value || "";
  if(!ids.length) return toast("Selecione pelo menos um item.");
  if(!status) return toast("Escolha um status rápido.");
  if(!confirm(`Aplicar status "${labelOption(status)}" em ${ids.length} item(ns)?`)) return;

  try{
    for(const id of ids) await setDoc(itemRef(moduleId, section.collection, id), {status, updatedAt:serverTimestamp()}, {merge:true});
    toast("Status aplicado em massa.");
    await loadModule(moduleId);
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao aplicar status.");
  }
}

async function duplicateSelectedItems(moduleId, sectionKey){
  const section = getSection(moduleId, sectionKey);
  const items = cache[moduleId]?.[section.collection] || [];
  const ids = selectedItemIds();
  if(!ids.length) return toast("Selecione pelo menos um item.");
  if(!confirm(`Duplicar ${ids.length} item(ns)?`)) return;

  try{
    for(const id of ids){
      const item = items.find(i => i.id === id);
      if(!item) continue;
      const baseSlug = slugify(item.slug || item.title || item.label || item.name || item.id);
      const newId = `${baseSlug || "item"}-copia-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2,5)}`;
      const copy = {...item};
      delete copy.createdAt;
      delete copy.updatedAt;
      copy.id = newId;
      copy.slug = newId;
      if(copy.title) copy.title = `${copy.title} (cópia)`;
      if(copy.label) copy.label = `${copy.label} (cópia)`;
      if(copy.status) copy.status = "draft";
      copy.createdAt = serverTimestamp();
      copy.updatedAt = serverTimestamp();
      await setDoc(itemRef(moduleId, section.collection, newId), copy, {merge:true});
    }
    toast("Itens duplicados.");
    await loadModule(moduleId);
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao duplicar em massa.");
  }
}

async function deleteSelectedItems(moduleId, sectionKey){
  const section = getSection(moduleId, sectionKey);
  const ids = selectedItemIds();
  if(!ids.length) return toast("Selecione pelo menos um item.");
  if(!confirm(`Excluir definitivamente ${ids.length} item(ns)? Esta ação não pode ser desfeita.`)) return;

  try{
    for(const id of ids) await deleteDoc(itemRef(moduleId, section.collection, id));
    toast("Itens excluídos.");
    await loadModule(moduleId);
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao excluir em massa.");
  }
}

function promotionalPublicUrl(moduleId, item){
  const slug = item && (item.slug || item.id) ? String(item.slug || item.id) : "";
  if(moduleId === "news") return "/noticias/?post=" + encodeURIComponent(slug);
  if(moduleId === "projects") return "/projetos/?p=" + encodeURIComponent(slug);
  if(moduleId === "tutorials") return "/tutoriais/?t=" + encodeURIComponent(slug);
  if(moduleId === "offers") return "/oferta/?id=" + encodeURIComponent(slug);
  if(moduleId === "raffles") return "/rifas/?r=" + encodeURIComponent(slug);
  if(moduleId === "games") return item && item.gameUrl ? item.gameUrl : "/jogos/";
  if(moduleId === "courses") return "/cursos/";
  if(moduleId === "calculator") return "/calculadora/";
  return item && (item.url || item.linkUrl || item.targetUrl) ? (item.url || item.linkUrl || item.targetUrl) : "/";
}

function promotionalMessage(moduleId, item, template){
  const title = item && (item.title || item.label || item.name) ? (item.title || item.label || item.name) : "Pense Offgrid";
  const excerpt = item && (item.excerpt || item.subtitle || item.description) ? (item.excerpt || item.subtitle || item.description) : "";
  const url = new URL(promotionalPublicUrl(moduleId, item), location.origin).href;
  const signature = cache.promotional && cache.promotional.settings && cache.promotional.settings.main && cache.promotional.settings.main.defaultSignature ? cache.promotional.settings.main.defaultSignature : "Pense Offgrid ⚡";
  const tags = template && template.tags ? template.tags : "#PenseOffgrid #Offgrid";
  const affiliate = template && template.affiliateUrl ? template.affiliateUrl : (item && (item.affiliateUrl || item.offerUrl) ? (item.affiliateUrl || item.offerUrl) : "");
  const coupon = template && template.coupon ? template.coupon : (item && item.coupon ? item.coupon : "");

  let text = template && template.message ? template.message : "⚡ {title}\n\n{excerpt}\n\nAcesse: {url}\n\n{signature}";
  text = text.split("{title}").join(title);
  text = text.split("{excerpt}").join(excerpt);
  text = text.split("{description}").join(excerpt);
  text = text.split("{url}").join(url);
  text = text.split("{signature}").join(signature);
  text = text.split("{tags}").join(tags);
  text = text.split("{affiliateUrl}").join(affiliate);
  text = text.split("{coupon}").join(coupon);

  if(affiliate && text.indexOf(affiliate) === -1) text += "\n\nOferta/apoio: " + affiliate;
  if(coupon && text.indexOf(coupon) === -1) text += "\nCupom: " + coupon;
  if(tags && text.indexOf(tags) === -1) text += "\n\n" + tags;

  return text.trim();
}

async function promotionalCopy(text){
  await navigator.clipboard.writeText(text);
  toast("Mensagem copiada.");
}

function promotionalWhatsApp(text){
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
}

function promotionalTelegram(text, url){
  const finalUrl = url || location.origin;
  window.open("https://t.me/share/url?url=" + encodeURIComponent(finalUrl) + "&text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
}

async function promotionalHistory(moduleId, item, channel, message){
  try{
    const rawId = item && (item.id || item.slug || item.title) ? (item.id || item.slug || item.title) : "item";
    const id = slugify(moduleId + "-" + rawId + "-" + Date.now());
    const payload = {
      id:id,
      title:item && (item.title || item.label || item.name) ? (item.title || item.label || item.name) : "Disparo",
      channel:channel,
      message:message,
      targetUrl:new URL(promotionalPublicUrl(moduleId, item), location.origin).href,
      relatedModule:moduleId,
      relatedId:item && (item.id || item.slug) ? (item.id || item.slug) : "",
      date:today(),
      status:"draft",
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    };
    await setDoc(itemRef("promotional", "broadcasts", id), payload, {merge:true});
  }catch(error){
    console.warn("Histórico promocional não salvo.", error);
  }
}

async function promotionalAction(moduleId, itemId, mode){
  const mod = getModule(moduleId);
  if(!mod || !mod.sections) return toast("Módulo não encontrado.");

  let item = null;
  for(const s of mod.sections){
    if(s.type !== "collection") continue;
    const arr = cache[moduleId] && cache[moduleId][s.collection] ? cache[moduleId][s.collection] : [];
    item = arr.find(i => i.id === itemId);
    if(item) break;
  }

  if(!item) return toast("Item não encontrado para divulgação.");

  const templates = cache.promotional && cache.promotional.templates ? cache.promotional.templates : [];
  const activeTemplates = templates.filter(t => (t.status || "published") === "published");
  const template = activeTemplates.find(t => t.channel === mode) || activeTemplates[0] || null;
  const text = promotionalMessage(moduleId, item, template);
  const url = new URL(promotionalPublicUrl(moduleId, item), location.origin).href;

  if(mode === "copy") await promotionalCopy(text);
  if(mode === "whatsapp") promotionalWhatsApp(text);
  if(mode === "telegram") promotionalTelegram(text, url);

  await promotionalHistory(moduleId, item, mode, text);
}

async function promotionalTemplateAction(itemId, mode){
  const arr = cache.promotional && cache.promotional.templates ? cache.promotional.templates : [];
  const template = arr.find(i => i.id === itemId);
  if(!template) return toast("Modelo não encontrado.");

  const fakeItem = {
    id:template.id,
    title:template.title,
    excerpt:template.description || "",
    url:template.defaultUrl || template.affiliateUrl || "/"
  };

  const text = promotionalMessage("promotional", fakeItem, template);
  if(mode === "copy") await promotionalCopy(text);
  if(mode === "whatsapp") promotionalWhatsApp(text);
  if(mode === "telegram") promotionalTelegram(text, template.defaultUrl || template.affiliateUrl || location.origin);

  await promotionalHistory("promotional", template, mode, text);
}



const LEGACY_HOME_IMPORT = {
  settings:{
    heroBadge:"Aulas Livres • Projetos Práticos • Comunidade",
    heroTitle:"MONTE SEU SISTEMA OFFGRID COM MAIS CLAREZA",
    heroSubtitle:"Curso gratuito, projetos de referência, calculadora prática, jogo educativo e comunidade para você sair da teoria e começar certo.",
    primaryButtonText:"Começar agora",
    primaryButtonUrl:"#ecossistema",
    secondaryButtonText:"Ver projetos prontos",
    secondaryButtonUrl:"/projetos/",
    proof1Kicker:"Entrada",
    proof1Text:"Curso gratuito para começar sem travar",
    proof2Kicker:"Aplicação",
    proof2Text:"Projetos prontos para copiar e adaptar",
    proof3Kicker:"Teste",
    proof3Text:"Simulador e calculadora para validar ideias",
    carouselKicker:"Projetos prontos",
    carouselTitle:"Diagramas, manuais e listas de materiais",
    carouselDescription:"Toque no carrossel para abrir os projetos de referência.",
    ecosystemKicker:"Escolha seu caminho",
    ecosystemTitle:"Por onde você quer começar?",
    ecosystemDescription:"O Pense Offgrid foi dividido em áreas simples para você aprender, simular, comparar, jogar, acompanhar projetos e entrar na comunidade sem se perder.",
    ecosystemTag:"Ecossistema modular",
    featureKicker:"Prática sem risco",
    featureTitle:"Jogo Solano",
    featureDescription:"Aprenda conceitos de geração, baterias, inversores e consumo em uma experiência leve, visual e competitiva.",
    featureIcon:"🎮",
    featurePrimaryText:"Jogar Solano",
    featurePrimaryUrl:"/jogos/solano/",
    featureSecondaryText:"Ver projetos",
    featureSecondaryUrl:"/projetos/",
    footerKicker:"Canais",
    footerTitle:"Siga o Pense Offgrid",
    seoTitle:"Pense OffGrid | O caminho da independência",
    seoDescription:"Curso gratuito, projetos prontos, calculadora, simulador, notícias e comunidade para montar seu sistema off-grid."
  },
  carousel:[
    {id:"projetos-prontos",title:"Projetos prontos",subtitle:"Diagramas, manuais e listas de materiais",imageUrl:"https://i.imgur.com/T8FQpOb.png",linkUrl:"/projetos/",buttonText:"Abrir projetos",order:1,status:"published"},
    {id:"diagrama-48v",title:"Diagramas 48V",subtitle:"Referências visuais para montagem e estudo",imageUrl:"https://i.imgur.com/WLGNLU4.png",linkUrl:"/projetos/",buttonText:"Ver diagrama",order:2,status:"published"},
    {id:"sistema-12v",title:"Sistema compacto 12V",subtitle:"Primeiros testes e aprendizado prático",imageUrl:"https://i.imgur.com/NwJhdB4.png",linkUrl:"/projetos/",buttonText:"Ver projeto",order:3,status:"published"},
    {id:"alta-performance",title:"Alta performance",subtitle:"Projetos maiores para cargas mais exigentes",imageUrl:"https://i.imgur.com/d3DSGc9.png",linkUrl:"/projetos/",buttonText:"Ver avançado",order:4,status:"published"}
  ],
  cards:[
    {id:"jogos",kicker:"Jogos",title:"Jogue Solano",description:"Aprenda energia solar brincando e competindo.",url:"/jogos/",order:1,status:"published"},
    {id:"calculadora",kicker:"Ferramenta",title:"Calculadora",description:"Dimensione consumo, baterias, painéis e inversores.",url:"/calculadora/",order:2,status:"published"},
    {id:"projetos",kicker:"Referência",title:"Projetos",description:"Escolha modelos prontos para copiar e adaptar.",url:"/projetos/",order:3,status:"published"},
    {id:"noticias",kicker:"Atualização",title:"Notícias",description:"Mercado, energia, tecnologia e mundo offgrid.",url:"/noticias/",order:4,status:"published"},
    {id:"rifas",kicker:"Oportunidade",title:"Rifas",description:"Inversores, baterias e itens do universo offgrid.",url:"/rifas/",order:5,status:"published"},
    {id:"cursos",kicker:"Aprender",title:"Cursos",description:"Trilhas para instalação, diagnóstico e prática.",url:"/cursos/",order:6,status:"published"},
    {id:"tutoriais",kicker:"Resolver",title:"Tutoriais",description:"Soluções para inversores, baterias e instalações.",url:"/tutoriais/",order:7,status:"published"},
    {id:"grupo-vip",kicker:"Comunidade",title:"Grupo VIP",description:"Acompanhe ofertas, alertas e novidades.",url:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",order:8,status:"published"}
  ],
  ctas:[
    {id:"hero-comecar",label:"Começar agora",url:"#ecossistema",context:"hero",style:"primary",order:1,status:"published"},
    {id:"hero-projetos",label:"Ver projetos prontos",url:"/projetos/",context:"hero",style:"secondary",order:2,status:"published"},
    {id:"footer-vip",label:"Entrar no grupo VIP",url:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",context:"footer",style:"whatsapp",order:3,status:"published"}
  ],
  socials:[
    {id:"youtube",title:"YouTube",icon:"▶️",url:"https://www.youtube.com/@penseoffgrid",order:1,status:"published"},
    {id:"instagram",title:"Instagram",icon:"📸",url:"https://www.instagram.com/penseoffgrid",order:2,status:"published"},
    {id:"tiktok",title:"TikTok",icon:"🎵",url:"https://www.tiktok.com/@penseoffgrid",order:3,status:"published"},
    {id:"grupo-vip",title:"Grupo VIP",icon:"⚡",url:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",order:4,status:"published"},
    {id:"conversas",title:"Conversas",icon:"💬",url:"https://chat.whatsapp.com/EwVxNCXMypJFf2zlxM5wZi",order:5,status:"published"}
  ],
  banners:[
    {id:"vip-offgrid",title:"Grupo VIP Pense Offgrid",description:"Receba alertas, ofertas e novidades do ecossistema.",imageUrl:"",linkUrl:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",position:"bottom-right",order:1,status:"hidden"}
  ]
};

const LEGACY_PROJECTS_IMPORT = [
  {
    id:"nomade",
    slug:"nomade",
    title:"Projeto Essencial 12V",
    subtitle:"Inversor Off-Grid multifuncional com MPPT integrado de 60A. Ideal para sistemas portáteis e ativação de baterias de lítio.",
    imageUrl:"https://i.imgur.com/NwJhdB4.png",
    blueprintUrl:"https://i.imgur.com/XvhFmSH.png",
    videoUrl:"https://www.youtube.com/embed/videoseries?list=PLOyGYhtc2VVc7VB4FrDQJDm6nh6XKzu6n",
    manualUrl:"/docs/manual-y&h-1000w-12v.pdf",
    datasheetUrl:"",
    brand:"FELICITY",
    techDC:"Banco 12V",
    techPower:"1.000W Real",
    techAC:"Saída: 230V",
    inverterSpec:"Felicity Solar IVCM1012",
    inverterLink:"https://s.shopee.com.br/5VQ3F2WfQR",
    whatsappPostInverter:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/263",
    batterySpec:"Lítio ou Chumbo 12V",
    batteryLink:"https://mercadolivre.com/sec/2uMB4LT",
    whatsappPostBattery:"",
    panelSpec:"Até 900Wp de Painéis",
    panelLink:"https://s.shopee.com.br/4VYjgTNPQy",
    whatsappPostPanel:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/456",
    level:"iniciante",
    order:1,
    featured:false,
    status:"published"
  },
  {
    id:"essencial",
    slug:"essencial",
    title:"Simples & Móvel (24V 4kW 220V)",
    subtitle:"Residências básicas e motorhomes.",
    imageUrl:"https://i.imgur.com/NQLAc71.png",
    blueprintUrl:"https://i.imgur.com/WLGNLU4.png",
    videoUrl:"https://www.youtube.com/embed/videoseries?list=PLOyGYhtc2VVc7VB4FrDQJDm6nh6XKzu6n",
    manualUrl:"/docs/manual-anenji-4000w-24v.pdf",
    datasheetUrl:"/docs/datasheet-anenji-4000w-24v.pdf",
    brand:"ANENJI",
    techDC:"Banco 24V",
    techPower:"Inversor 4.200W",
    techAC:"Saída: Rede 220V",
    inverterSpec:"Inversor Híbrido 24V 4.0kW",
    inverterLink:"https://s.click.aliexpress.com/e/_mOsgvNN",
    whatsappPostInverter:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y",
    batterySpec:"Banco 24V (Lítio)",
    batteryLink:"https://mercadolivre.com/sec/2uMB4LT",
    whatsappPostBattery:"",
    panelSpec:"4x Painéis 550W (Série)",
    panelLink:"https://www.minhacasasolar.com.br/painel-solar",
    whatsappPostPanel:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/275",
    level:"intermediario",
    order:2,
    featured:false,
    status:"published"
  },
  {
    id:"total",
    slug:"total",
    title:"Padrão Brasileiro (48V)",
    subtitle:"Melhor escolha residencial fixa. Funciona geladeira, ar-condicionado e as cargas de rotina tranquilamente.",
    imageUrl:"https://i.imgur.com/Qta9pp1.png",
    blueprintUrl:"https://i.imgur.com/T8FQpOb.png",
    videoUrl:"https://www.youtube.com/embed/28idbbRXW40",
    manualUrl:"/docs/manual-anenji-6200w-48v.pdf",
    datasheetUrl:"/docs/datasheet-anenji-6200w-48v.pdf",
    brand:"ANENJI",
    techDC:"Banco 48V",
    techPower:"Inversor 6.200W",
    techAC:"Saída: Rede 220V",
    inverterSpec:"Inversor ANENJI 6.2kW 48V",
    inverterLink:"https://a.aliexpress.com/_mMnFQVf",
    whatsappPostInverter:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/254",
    batterySpec:"Banco 48V Rack (Moura/ZTE)",
    batteryLink:"https://mercadolivre.com/sec/2EKdzmw",
    whatsappPostBattery:"",
    panelSpec:"10x 550W",
    panelLink:"https://www.minhacasasolar.com.br/painel-solar",
    whatsappPostPanel:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/275",
    level:"avancado",
    order:3,
    featured:true,
    status:"published"
  },
  {
    id:"performance",
    slug:"performance",
    title:"Alta Performance (11kW)",
    subtitle:"Para comércios, grandes propriedades ou altíssimo consumo elétrico.",
    imageUrl:"https://i.imgur.com/c8Vm80l.png",
    blueprintUrl:"https://i.imgur.com/d3DSGc9.png",
    videoUrl:"https://www.youtube.com/embed/videoseries?list=PLOyGYhtc2VVc7VB4FrDQJDm6nh6XKzu6n",
    manualUrl:"/docs/manual-anenji-11000w-48v.pdf",
    datasheetUrl:"/docs/datasheet-anenji-11000w-48v.pdf",
    brand:"ANENJI",
    techDC:"Banco 48V",
    techPower:"Inversor 11.000W",
    techAC:"Saída: Rede 220V",
    inverterSpec:"Inversor 11kW Twin",
    inverterLink:"https://s.click.aliexpress.com/e/_mr3nQr3",
    whatsappPostInverter:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y",
    batterySpec:"Banco 48V 200Ah+",
    batteryLink:"https://mercadolivre.com/sec/2EKdzmw",
    whatsappPostBattery:"",
    panelSpec:"16+ Painéis 550W",
    panelLink:"https://www.minhacasasolar.com.br/painel-solar",
    whatsappPostPanel:"https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/275",
    level:"avancado",
    order:4,
    featured:false,
    status:"published"
  }
];


const LEGACY_COURSES_IMPORT = {
  settings:{
    badgeText:"Curso gratuito para iniciantes",
    title:"Aprenda offgrid do jeito <span>certo</span>, começando pelo básico",
    subtitle:"Uma trilha em vídeo para quem quer entender energia solar offgrid sem ficar perdido em termos técnicos. Escolha a aula na playlist, assista no player principal e avance no seu ritmo.",
    playlistTitle:"Playlist",
    playlistDescription:"Toque em uma aula para trocar o vídeo principal. Novas aulas já têm espaço reservado.",
    ctaText:"Assistir aulas",
    ctaUrl:"#aulas",
    secondaryCtaText:"Ver projetos prontos",
    secondaryCtaUrl:"/projetos/",
    vipCtaText:"Entrar no Grupo VIP",
    vipCtaUrl:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq",
    status:"published"
  },
  lessons:[
    {
      id:"aula-01",
      slug:"aula-01",
      title:"Aula 1",
      youtubeUrl:"https://www.youtube.com/watch?v=Qrc-Fp5aJjk",
      embedUrl:"https://www.youtube.com/embed/Qrc-Fp5aJjk?si=6HyR5kYtelCo7ue6",
      description:"Disponível agora",
      fullDescription:"Primeira aula da trilha Pense Offgrid para quem está começando do jeito certo.",
      category:"Fundamentos",
      level:"iniciante",
      price:"Gratuito",
      isFree:true,
      locked:false,
      featured:true,
      order:1,
      status:"published"
    },
    {
      id:"aula-02",
      slug:"aula-02",
      title:"Aula 2",
      youtubeUrl:"https://www.youtube.com/watch?v=7AYGv7zIXbo",
      embedUrl:"https://www.youtube.com/embed/7AYGv7zIXbo?si=GqHwh0RIKa7QHk8T",
      description:"Disponível agora",
      fullDescription:"Segunda aula da sequência de aprendizado offgrid.",
      category:"Fundamentos",
      level:"iniciante",
      price:"Gratuito",
      isFree:true,
      locked:false,
      featured:false,
      order:2,
      status:"published"
    },
    {
      id:"aula-03",
      slug:"aula-03",
      title:"Aula 3",
      youtubeUrl:"https://www.youtube.com/watch?v=oTLFaoTyOZY",
      embedUrl:"https://www.youtube.com/embed/oTLFaoTyOZY?si=UNjWpYOyZKXvjtZ0",
      description:"Disponível agora",
      fullDescription:"Terceira aula da trilha Pense Offgrid.",
      category:"Fundamentos",
      level:"iniciante",
      price:"Gratuito",
      isFree:true,
      locked:false,
      featured:false,
      order:3,
      status:"published"
    },
    {id:"aula-04", slug:"aula-04", title:"Aula 4", description:"Em breve", category:"Fundamentos", level:"iniciante", price:"Gratuito", isFree:true, locked:true, order:4, status:"published"},
    {id:"aula-05", slug:"aula-05", title:"Aula 5", description:"Em breve", category:"Fundamentos", level:"iniciante", price:"Gratuito", isFree:true, locked:true, order:5, status:"published"},
    {id:"aula-06", slug:"aula-06", title:"Aula 6", description:"Em breve", category:"Fundamentos", level:"iniciante", price:"Gratuito", isFree:true, locked:true, order:6, status:"published"},
    {id:"aula-07", slug:"aula-07", title:"Aula 7", description:"Em breve", category:"Fundamentos", level:"iniciante", price:"Gratuito", isFree:true, locked:true, order:7, status:"published"},
    {id:"aula-08", slug:"aula-08", title:"Aula 8", description:"Em breve", category:"Fundamentos", level:"iniciante", price:"Gratuito", isFree:true, locked:true, order:8, status:"published"}
  ]
};


const LEGACY_RAFFLES_IMPORT = [
  {
    id:"rifa-inversor-anenji-11000w",
    slug:"rifa-inversor-anenji-11000w",
    title:"Inversor Anenji 11.000W 48V",
    headline:"Rifa do inversor Anenji 11.000W 48V",
    description:"Campanha para concorrer a um inversor de alta potência para sistemas offgrid robustos.",
    icon:"⚡",
    imageUrl:"",
    totalNumbers:400,
    ticketPrice:10,
    minimumSoldPercent:50,
    drawReference:"Loteria Federal",
    drawRules:"O sorteio será informado oficialmente na página da rifa.\nA referência padrão poderá ser a Loteria Federal.\nCom 50% dos números vendidos, o sorteio já poderá ocorrer conforme decisão da organização.\nNúmeros confirmados só ficam indisponíveis após confirmação de pagamento.\nO participante deve informar dados corretos para contato e validação.",
    soldNumbers:"3, 8, 17, 28, 33, 44, 57, 71, 88, 99, 104, 121, 139, 156, 177, 199, 207, 222, 248, 260, 277, 301, 319, 333, 350, 372, 388",
    recentBuyers:"Rafael|Recife|PE|4\nMarcos|Petrolina|PE|2\nAndré|Caruaru|PE|6",
    order:1,
    featured:true,
    status:"published"
  },
  {
    id:"rifa-bateria-lifepo4",
    slug:"rifa-bateria-lifepo4",
    title:"Banco de Baterias LiFePO4",
    headline:"Rifa do banco de baterias LiFePO4",
    description:"Uma oportunidade para concorrer a armazenamento de energia para seu sistema offgrid.",
    icon:"🔋",
    imageUrl:"",
    totalNumbers:400,
    ticketPrice:8,
    minimumSoldPercent:50,
    drawReference:"Loteria Federal",
    drawRules:"O sorteio será informado oficialmente na página da rifa.\nA referência padrão poderá ser a Loteria Federal.\nCom 50% dos números vendidos, o sorteio já poderá ocorrer conforme decisão da organização.\nNúmeros confirmados só ficam indisponíveis após confirmação de pagamento.\nO participante deve informar dados corretos para contato e validação.",
    soldNumbers:"5, 11, 22, 45, 66, 89, 101, 120, 167, 188, 212, 245, 289, 320, 355",
    recentBuyers:"João|Maceió|AL|3\nCarlos|Natal|RN|5\nPaulo|João Pessoa|PB|2",
    order:2,
    featured:false,
    status:"published"
  },
  {
    id:"rifa-kit-ferramentas",
    slug:"rifa-kit-ferramentas",
    title:"Kit Técnico Offgrid",
    headline:"Rifa do kit técnico offgrid",
    description:"Ferramentas e acessórios para quem monta, ajusta e cuida de sistemas offgrid.",
    icon:"🛠️",
    imageUrl:"",
    totalNumbers:200,
    ticketPrice:5,
    minimumSoldPercent:50,
    drawReference:"Loteria Federal",
    drawRules:"O sorteio será informado oficialmente na página da rifa.\nA referência padrão poderá ser a Loteria Federal.\nCom 50% dos números vendidos, o sorteio já poderá ocorrer conforme decisão da organização.\nNúmeros confirmados só ficam indisponíveis após confirmação de pagamento.\nO participante deve informar dados corretos para contato e validação.",
    soldNumbers:"2, 9, 18, 24, 37, 48, 59, 73, 91, 102, 130, 150, 175",
    recentBuyers:"Eduardo|Arcoverde|PE|4\nBruno|Salgueiro|PE|1\nLucas|Fortaleza|CE|3",
    order:3,
    featured:false,
    status:"published"
  }
];


async function importDefaultGlobalLinks(){
  if(currentModuleId !== "global" || currentSectionKey !== "links") return toast("Abra Links Globais > Links e cupons.");
  if(!confirm("Importar/atualizar os links globais padrão do ecossistema?")) return;
  const defaults = [
    {id:"vipGroup", key:"vipGroup", title:"Grupo VIP", type:"whatsapp", url:"https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq", description:"Grupo VIP principal do Pense Offgrid.", context:"global", order:1, status:"published"},
    {id:"openGroup", key:"openGroup", title:"Grupo aberto / Conversas", type:"whatsapp", url:"https://chat.whatsapp.com/EwVxNCXMypJFf2zlxM5wZi", description:"Grupo aberto para conversas e comunidade.", context:"global", order:2, status:"published"},
    {id:"youtube", key:"youtube", title:"YouTube", type:"social", url:"https://www.youtube.com/@penseoffgrid", description:"Canal oficial no YouTube.", context:"global", order:3, status:"published"},
    {id:"instagram", key:"instagram", title:"Instagram", type:"social", url:"https://www.instagram.com/penseoffgrid", description:"Perfil oficial no Instagram.", context:"global", order:4, status:"published"},
    {id:"tiktok", key:"tiktok", title:"TikTok", type:"social", url:"https://www.tiktok.com/@penseoffgrid", description:"Perfil oficial no TikTok.", context:"global", order:5, status:"published"},
    {id:"vipPage", key:"vipPage", title:"Página VIP", type:"contact", url:"/vip.html", description:"Página interna de redirecionamento VIP.", context:"global", order:6, status:"published"}
  ];
  try{
    await Promise.all(defaults.map(item => setDoc(itemRef("global", "links", item.id), {...item, updatedAt:serverTimestamp(), createdAt:item.createdAt || serverTimestamp()}, {merge:true})));
    toast("Links globais padrão importados.");
    await loadModule("global");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar links globais.");
  }
}

async function importLegacyHome(){
  if(currentModuleId !== "home") return toast("Abra o módulo Home para importar.");

  const ok = confirm("Importar/mesclar o conteúdo atual da Home para o Firebase? Isso não apaga campos extras já criados; apenas preenche/atualiza a base editável.");
  if(!ok) return;

  try{
    const currentSettings = cache.home?.settings?.main || {};
    await setDoc(settingsRef("home", "main"), {
      ...LEGACY_HOME_IMPORT.settings,
      ...currentSettings,
      legacyImported:true,
      updatedAt:serverTimestamp()
    }, {merge:true});

    const collections = ["carousel", "cards", "ctas", "socials", "banners"];
    for(const collectionName of collections){
      const existing = cache.home?.[collectionName] || [];
      for(const item of LEGACY_HOME_IMPORT[collectionName] || []){
        const current = existing.find(entry => entry.id === item.id || entry.slug === item.id) || {};
        const payload = {
          ...item,
          ...current,
          id:item.id,
          legacyImported:true,
          updatedAt:serverTimestamp()
        };
        if(!current.createdAt) payload.createdAt = serverTimestamp();
        await setDoc(itemRef("home", collectionName, item.id), payload, {merge:true});
      }
    }

    toast("Home atual importada para o Firebase.");
    await loadModule("home");
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar Home atual.");
  }
}

async function importLegacyProjects(){
  if(currentModuleId !== "projects" || currentSectionKey !== "items") return toast("Abra Projetos > Projetos para importar.");

  const existing = cache.projects?.items || [];
  const existingIds = new Set(existing.map(item => item.id));
  const existingSlugs = new Set(existing.map(item => item.slug).filter(Boolean));
  const willCreate = LEGACY_PROJECTS_IMPORT.filter(project => !existingIds.has(project.id) && !existingSlugs.has(project.slug));
  const willMerge = LEGACY_PROJECTS_IMPORT.filter(project => existingIds.has(project.id) || existingSlugs.has(project.slug));

  const message = existing.length
    ? `Já existem ${existing.length} projeto(s) no Firebase. A importação vai criar ${willCreate.length} novo(s) e atualizar/mesclar ${willMerge.length} existente(s), sem apagar campos extras. Continuar?`
    : `Importar os ${LEGACY_PROJECTS_IMPORT.length} projetos atuais da página para o Firebase?`;

  if(!confirm(message)) return;

  try{
    for(const project of LEGACY_PROJECTS_IMPORT){
      const current = existing.find(item => item.id === project.id || item.slug === project.slug) || {};
      const payload = {
        ...project,
        ...current,
        id:project.id,
        slug:project.slug,
        legacyImported:true,
        updatedAt:serverTimestamp()
      };
      if(!current.createdAt) payload.createdAt = serverTimestamp();
      await setDoc(itemRef("projects", "items", project.id), payload, {merge:true});
    }

    toast("Projetos atuais importados para o Firebase.");
    await loadModule("projects");
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar projetos atuais.");
  }
}


async function importLegacyCourses(){
  if(currentModuleId !== "courses" || currentSectionKey !== "lessons") return toast("Abra Cursos > Aulas para importar.");

  const existing = cache.courses?.lessons || [];
  const existingIds = new Set(existing.map(item => item.id));
  const existingSlugs = new Set(existing.map(item => item.slug).filter(Boolean));
  const willCreate = LEGACY_COURSES_IMPORT.lessons.filter(lesson => !existingIds.has(lesson.id) && !existingSlugs.has(lesson.slug));
  const willMerge = LEGACY_COURSES_IMPORT.lessons.filter(lesson => existingIds.has(lesson.id) || existingSlugs.has(lesson.slug));

  const message = existing.length
    ? `Já existem ${existing.length} aula(s)/curso(s) no Firebase. A importação vai criar ${willCreate.length} novo(s) e atualizar/mesclar ${willMerge.length} existente(s), sem apagar campos extras. Continuar?`
    : `Importar as ${LEGACY_COURSES_IMPORT.lessons.length} aulas atuais da página para o Firebase?`;

  if(!confirm(message)) return;

  try{
    const currentSettings = cache.courses?.settings?.main || {};
    await setDoc(settingsRef("courses", "main"), {
      ...LEGACY_COURSES_IMPORT.settings,
      ...currentSettings,
      legacyImported:true,
      updatedAt:serverTimestamp()
    }, {merge:true});

    for(const lesson of LEGACY_COURSES_IMPORT.lessons){
      const current = existing.find(item => item.id === lesson.id || item.slug === lesson.slug) || {};
      const payload = {
        ...lesson,
        ...current,
        id:lesson.id,
        slug:lesson.slug,
        legacyImported:true,
        updatedAt:serverTimestamp()
      };
      if(!current.createdAt) payload.createdAt = serverTimestamp();
      await setDoc(itemRef("courses", "lessons", lesson.id), payload, {merge:true});
    }

    toast("Cursos/aulas atuais importados para o Firebase.");
    await loadModule("courses");
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar cursos atuais.");
  }
}


const LEGACY_TUTORIALS_IMPORT = {
  settings:{
    title:"Pequenos ajustes para sua vida <span>offgrid</span> decolar",
    subtitle:"Tutoriais práticos de adaptações, melhorias simples, soluções rápidas e ajustes úteis para sistemas offgrid.",
    statusText:"Os tutoriais serão publicados aos poucos, organizados por tema e disponíveis para consulta rápida."
  },
  categories:[
    {id:"categorias-modulares", title:"Categorias modulares", slug:"categorias-modulares", description:"Temas organizados pelo painel conforme novos tutoriais forem surgindo.", order:1, status:"published"},
    {id:"passo-a-passo", title:"Passo a passo", slug:"passo-a-passo", description:"Conteúdos em formato simples, direto, visual e fácil de seguir no celular.", order:2, status:"published"},
    {id:"texto-imagem-pdf", title:"Texto, imagem ou PDF", slug:"texto-imagem-pdf", description:"Tutoriais com descrição, fotos, links e arquivos de apoio.", order:3, status:"published"},
    {id:"consulta-rapida", title:"Consulta rápida", slug:"consulta-rapida", description:"Ajuda para quem está montando, ajustando ou melhorando um sistema offgrid na prática.", order:4, status:"published"}
  ],
  items:[
    {id:"exemplo-tutorial-offgrid", title:"Exemplo de tutorial offgrid", slug:"exemplo-tutorial-offgrid", category:"consulta-rapida", level:"iniciante", readTime:"4 min", excerpt:"Modelo de tutorial para você editar pelo painel, com texto, links e imagens no corpo.", content:"Use este modelo para criar seu primeiro tutorial real.\n\nVocê pode inserir **texto em negrito**, links e imagens no corpo do conteúdo.\n\n![Exemplo de imagem](URL_DA_IMAGEM)", imageUrl:"", bodyImageUrl:"", bodyImageAlt:"", galleryUrls:"", pdfUrl:"", videoUrl:"", ctaText:"Ver cursos", ctaUrl:"/cursos/", vipUrl:"", featured:false, order:1, status:"draft"}
  ]
};

async function importLegacyTutorials(){
  if(currentModuleId !== "tutorials" || currentSectionKey !== "items") return toast("Abra Tutoriais > Tutoriais para importar.");
  const existing = cache.tutorials?.items || [];
  const existingIds = new Set(existing.map(item => item.id));
  const existingSlugs = new Set(existing.map(item => item.slug).filter(Boolean));
  const willCreate = LEGACY_TUTORIALS_IMPORT.items.filter(item => !existingIds.has(item.id) && !existingSlugs.has(item.slug));
  const message = willCreate.length
    ? `Importar estrutura atual de tutoriais, categorias e ${willCreate.length} modelo(s) em rascunho?`
    : "Atualizar configurações e categorias dos tutoriais? Nenhum novo tutorial será criado.";
  if(!confirm(message)) return;
  try{
    await setDoc(settingsRef("tutorials", "main"), {...LEGACY_TUTORIALS_IMPORT.settings, updatedAt:serverTimestamp()}, {merge:true});
    for(const category of LEGACY_TUTORIALS_IMPORT.categories){
      await setDoc(itemRef("tutorials", "categories", category.id), {...category, updatedAt:serverTimestamp()}, {merge:true});
    }
    for(const item of willCreate){
      await setDoc(itemRef("tutorials", "items", item.id), {...item, createdAt:serverTimestamp(), updatedAt:serverTimestamp()}, {merge:true});
    }
    await loadModule("tutorials");
    renderCurrentSection();
    toast("Tutoriais atuais importados para o painel.");
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar tutoriais.");
  }
}

async function importLegacyRaffles(){
  if(currentModuleId !== "raffles" || currentSectionKey !== "items") return toast("Abra Rifas > Rifas para importar.");

  const existing = cache.raffles?.items || [];
  const existingIds = new Set(existing.map(item => item.id));
  const existingSlugs = new Set(existing.map(item => item.slug).filter(Boolean));
  const willCreate = LEGACY_RAFFLES_IMPORT.filter(raffle => !existingIds.has(raffle.id) && !existingSlugs.has(raffle.slug));
  const willMerge = LEGACY_RAFFLES_IMPORT.filter(raffle => existingIds.has(raffle.id) || existingSlugs.has(raffle.slug));

  const message = existing.length
    ? `Já existem ${existing.length} rifa(s) no Firebase. A importação vai criar ${willCreate.length} nova(s) e atualizar/mesclar ${willMerge.length} existente(s), sem apagar campos extras. Continuar?`
    : `Importar as ${LEGACY_RAFFLES_IMPORT.length} rifas atuais da página para o Firebase?`;

  if(!confirm(message)) return;

  try{
    const currentSettings = cache.raffles?.settings?.main || {};
    await setDoc(settingsRef("raffles", "main"), {
      title: currentSettings.title || "Escolha uma rifa e concorra a equipamentos <span>offgrid</span>",
      subtitle: currentSettings.subtitle || "Selecione uma campanha ativa, escolha seus números e acompanhe as regras de cada sorteio.",
      rulesGlobal: currentSettings.rulesGlobal || "O sorteio será informado oficialmente na página da rifa.\nA referência padrão poderá ser a Loteria Federal.\nNúmeros confirmados só ficam indisponíveis após confirmação de pagamento.",
      legacyImported:true,
      updatedAt:serverTimestamp()
    }, {merge:true});

    for(const raffle of LEGACY_RAFFLES_IMPORT){
      const current = existing.find(item => item.id === raffle.id || item.slug === raffle.slug) || {};
      const payload = {
        ...raffle,
        ...current,
        id:raffle.id,
        slug:raffle.slug,
        legacyImported:true,
        updatedAt:serverTimestamp()
      };
      if(!current.createdAt) payload.createdAt = serverTimestamp();
      await setDoc(itemRef("raffles", "items", raffle.id), payload, {merge:true});
    }

    toast("Rifas atuais importadas para o Firebase.");
    await loadModule("raffles");
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao importar rifas atuais.");
  }
}

async function unsetOtherFeaturedProjects(activeId){
  const projects = cache.projects?.items || [];
  for(const project of projects){
    if(project.id !== activeId && project.featured){
      await setDoc(itemRef("projects", "items", project.id), {featured:false, updatedAt:serverTimestamp()}, {merge:true});
    }
  }
}

async function setProjectFeatured(itemId){
  if(!itemId) return;
  try{
    await unsetOtherFeaturedProjects(itemId);
    await setDoc(itemRef("projects", "items", itemId), {featured:true, status:"published", updatedAt:serverTimestamp()}, {merge:true});
    toast("Projeto definido como destaque.");
    await loadModule("projects");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao definir destaque.");
  }
}

async function toggleProjectStatus(itemId){
  const project = (cache.projects?.items || []).find(item => item.id === itemId);
  if(!project) return toast("Projeto não encontrado.");
  const nextStatus = (project.status || "published") === "published" ? "hidden" : "published";
  try{
    await setDoc(itemRef("projects", "items", itemId), {status:nextStatus, updatedAt:serverTimestamp()}, {merge:true});
    toast(nextStatus === "published" ? "Projeto publicado." : "Projeto ocultado.");
    await loadModule("projects");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao alterar status.");
  }
}

async function moveProjectOrder(itemId, direction){
  const projects = [...(cache.projects?.items || [])].sort((a,b) => Number(a.order || 9999) - Number(b.order || 9999));
  const index = projects.findIndex(item => item.id === itemId);
  const targetIndex = index + direction;
  if(index < 0 || targetIndex < 0 || targetIndex >= projects.length) return;

  const current = projects[index];
  const target = projects[targetIndex];
  const currentOrder = Number(current.order || index + 1);
  const targetOrder = Number(target.order || targetIndex + 1);

  try{
    await setDoc(itemRef("projects", "items", current.id), {order:targetOrder, updatedAt:serverTimestamp()}, {merge:true});
    await setDoc(itemRef("projects", "items", target.id), {order:currentOrder, updatedAt:serverTimestamp()}, {merge:true});
    toast("Ordem atualizada.");
    await loadModule("projects");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao ordenar projetos.");
  }
}


async function toggleRaffleStatus(itemId){
  const raffle = (cache.raffles?.items || []).find(item => item.id === itemId);
  if(!raffle) return toast("Rifa não encontrada.");
  const current = String(raffle.status || "published");
  const nextStatus = ["published", "active"].includes(current) ? "hidden" : "published";
  try{
    await setDoc(itemRef("raffles", "items", itemId), {status:nextStatus, updatedAt:serverTimestamp()}, {merge:true});
    toast(nextStatus === "published" ? "Rifa publicada." : "Rifa ocultada.");
    await loadModule("raffles");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao alterar status da rifa.");
  }
}

async function finishRaffle(itemId){
  const raffle = (cache.raffles?.items || []).find(item => item.id === itemId);
  if(!raffle) return toast("Rifa não encontrada.");
  if(!confirm(`Encerrar a rifa "${raffle.title || itemId}"? Ela continuará visível como finalizada se a página pública permitir status finished.`)) return;
  try{
    await setDoc(itemRef("raffles", "items", itemId), {status:"finished", updatedAt:serverTimestamp()}, {merge:true});
    toast("Rifa encerrada.");
    await loadModule("raffles");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao encerrar rifa.");
  }
}

async function moveRaffleOrder(itemId, direction){
  const raffles = [...(cache.raffles?.items || [])].sort((a,b) => Number(a.order || 9999) - Number(b.order || 9999));
  const index = raffles.findIndex(item => item.id === itemId);
  const targetIndex = index + direction;
  if(index < 0 || targetIndex < 0 || targetIndex >= raffles.length) return;

  const current = raffles[index];
  const target = raffles[targetIndex];
  const currentOrder = Number(current.order || index + 1);
  const targetOrder = Number(target.order || targetIndex + 1);

  try{
    await setDoc(itemRef("raffles", "items", current.id), {order:targetOrder, updatedAt:serverTimestamp()}, {merge:true});
    await setDoc(itemRef("raffles", "items", target.id), {order:currentOrder, updatedAt:serverTimestamp()}, {merge:true});
    toast("Ordem das rifas atualizada.");
    await loadModule("raffles");
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao ordenar rifas.");
  }
}

function parseNumbersForAdmin(value){
  if(Array.isArray(value)) return value.map(Number).filter(Boolean);
  return String(value || "")
    .split(/\n|,|;/)
    .map(item => Number(String(item).trim()))
    .filter(Boolean);
}

function formatNumbersForAdmin(value){
  return parseNumbersForAdmin(value).map(num => String(num).padStart(3, "0")).join(", ");
}

function raffleBuyerDashboard(items = [], all = []){
  const count = (fn) => items.filter(fn).length;
  const paid = count(item => String(item.paymentStatus || "").toLowerCase() === "paid");
  const pending = count(item => ["pending", "reserved", ""].includes(String(item.paymentStatus || "").toLowerCase()));
  const cancelled = count(item => ["cancelled", "expired", "refunded"].includes(String(item.paymentStatus || item.reservationStatus || "").toLowerCase()));
  const clicked = count(item => String(item.reservationStatus || "").toLowerCase() === "clicked");
  const numbersReserved = items.reduce((sum, item) => sum + parseNumbersForAdmin(item.numbers).length, 0);
  const totalPending = items
    .filter(item => String(item.paymentStatus || "").toLowerCase() !== "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = items
    .filter(item => String(item.paymentStatus || "").toLowerCase() === "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const money = (value) => Number(value || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  return `
    <div class="raffle-admin-dashboard">
      <strong>${items.length} de ${all.length} registro(s) exibidos</strong>
      <span>Pagos: ${paid}</span>
      <span>Reservados/pendentes: ${pending}</span>
      <span>Clicaram/selecionaram: ${clicked}</span>
      <span>Cancelados/expirados: ${cancelled}</span>
      <span>Números no filtro: ${numbersReserved}</span>
      <span>Pago: ${money(totalPaid)}</span>
      <span>Pendente: ${money(totalPending)}</span>
    </div>
  `;
}

function maskBuyerName(name=""){
  const parts = String(name || "Participante").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "Participante";
  if(parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].slice(0,1)}.`;
}

function buildBuyerMessage(buyer){
  if(!buyer) return "";
  const raffle = findRaffleForBuyer(buyer) || {};
  const status = String(buyer.paymentStatus || buyer.reservationStatus || "pending").toLowerCase();
  const numbers = formatNumbersForAdmin(buyer.numbers);
  const amount = Number(buyer.amount || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  const group = raffle.groupUrl || raffle.whatsappUrl || "";
  const raffleTitle = raffle.title || buyer.raffleTitle || buyer.raffleSlug || "Rifa Pense Offgrid";
  if(status === "paid" || status === "approved"){
    return `Olá, ${buyer.name || "participante"}! ✅

Seu pagamento na rifa ${raffleTitle} foi confirmado.
Números confirmados: ${numbers || "não informado"}
Código: ${buyer.orderCode || "sem código"}
Total: ${amount}

Guarde esta mensagem como comprovante.
${group ? "Grupo oficial da rifa: " + group : ""}

Obrigado por participar e boa sorte!`;
  }
  if(["cancelled","expired","refunded","rejected"].includes(status)){
    return `Olá, ${buyer.name || "participante"}! Vi que sua reserva na rifa ${raffleTitle} não foi concluída.

Números: ${numbers || "não informado"}
Total: ${amount}

Ainda dá tempo de participar. Entre novamente na página da rifa ou fale comigo por aqui que eu ajudo você a concluir.
${group ? "Grupo oficial: " + group : ""}`;
  }
  return `Olá, ${buyer.name || "participante"}! Passando para lembrar da sua reserva na rifa ${raffleTitle}. ⏳

Números reservados: ${numbers || "não informado"}
Código: ${buyer.orderCode || "sem código"}
Total: ${amount}

Sua reserva fica garantida somente após a confirmação do pagamento.
${group ? "Grupo oficial da rifa: " + group : ""}`;
}

function getRaffleBuyers(raffle){
  const slug = String(raffle?.slug || raffle?.id || "").trim();
  return (cache.raffles?.buyers || []).filter(buyer => {
    const buyerSlug = String(buyer.raffleSlug || buyer.raffleId || "").trim();
    return buyerSlug && (buyerSlug === slug || buyerSlug === String(raffle?.id || ""));
  });
}

function raffleStatusLabel(value){
  const status = String(value || "").toLowerCase();
  return {
    paid:"Pago", confirmed:"Confirmado", reserved:"Reservado", pending:"Pendente", clicked:"Clicou/selecionou",
    cancelled:"Cancelado", expired:"Expirado", refunded:"Reembolsado", waiting:"Aguardando", sent_message:"Mensagem enviada",
    answered:"Respondeu", no_answer:"Sem resposta", invalid_contact:"Contato inválido"
  }[status] || (value || "Não informado");
}

function formatMoney(value){
  return Number(value || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}

function formatDateTime(value){
  if(!value) return "-";
  if(typeof value === "object" && value.seconds) return new Date(value.seconds * 1000).toLocaleString("pt-BR");
  const parsed = new Date(value);
  if(Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("pt-BR");
}

function getRaffleOperationalStats(raffle){
  const buyers = getRaffleBuyers(raffle);
  const soldFromRaffle = parseNumbersForAdmin(raffle?.soldNumbers);
  const paidBuyers = buyers.filter(item => String(item.paymentStatus || "").toLowerCase() === "paid");
  const reservedBuyers = buyers.filter(item => ["reserved", "pending", ""].includes(String(item.paymentStatus || "").toLowerCase()));
  const clickedBuyers = buyers.filter(item => String(item.reservationStatus || "").toLowerCase() === "clicked");
  const cancelledBuyers = buyers.filter(item => ["cancelled", "expired", "refunded"].includes(String(item.paymentStatus || item.reservationStatus || "").toLowerCase()));
  const paidNumbers = paidBuyers.flatMap(item => parseNumbersForAdmin(item.numbers));
  const reservedNumbers = reservedBuyers.flatMap(item => parseNumbersForAdmin(item.numbers));
  const clickedNumbers = clickedBuyers.flatMap(item => parseNumbersForAdmin(item.numbers));
  const unavailable = [...new Set([...soldFromRaffle, ...paidNumbers, ...reservedNumbers])].sort((a,b)=>a-b);
  const totalNumbers = Math.max(Number(raffle?.totalNumbers || 0), unavailable.length);
  const soldPercent = totalNumbers ? Math.round((unavailable.length / totalNumbers) * 100) : 0;
  const totalPaid = paidBuyers.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPending = reservedBuyers.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const possibleGross = totalNumbers * Number(raffle?.ticketPrice || 0);
  return {buyers, paidBuyers, reservedBuyers, clickedBuyers, cancelledBuyers, soldFromRaffle, paidNumbers, reservedNumbers, clickedNumbers, unavailable, totalNumbers, soldPercent, totalPaid, totalPending, possibleGross};
}

function getRaffleShareUrlAdmin(raffle){
  const slug = encodeURIComponent(raffle?.slug || raffle?.id || "");
  return `${location.origin.replace(/\/$/, "")}/.netlify/functions/raffle-share?r=${slug}`;
}

function getRaffleReaderUrlAdmin(raffle){
  const slug = encodeURIComponent(raffle?.slug || raffle?.id || "");
  return `${location.origin.replace(/\/$/, "")}/rifas/?r=${slug}`;
}

function buildRaffleShareText(raffle){
  const title = raffle?.title || "Rifa Pense Offgrid";
  const price = raffle?.ticketPrice ? `${formatMoney(raffle.ticketPrice)} por número` : "valor informado na página";
  const url = getRaffleShareUrlAdmin(raffle);
  return `🔥 ${title}\n\nParticipe da rifa Pense Offgrid.\nValor: ${price}\nSorteio: ${raffle?.drawReference || "conforme regras da campanha"}\n\nAcesse aqui:\n${url}`;
}

function buildRaffleNumberGrid(raffle, stats){
  const total = Math.min(Number(stats.totalNumbers || raffle?.totalNumbers || 0), 1000);
  if(!total) return '<div class="empty-state">Total de números não informado.</div>';
  const paid = new Set(stats.paidNumbers);
  const reserved = new Set(stats.reservedNumbers);
  const clicked = new Set(stats.clickedNumbers);
  const staticSold = new Set(stats.soldFromRaffle);
  let html = '<div class="raffle-number-grid">';
  for(let i=1;i<=total;i++){
    const cls = paid.has(i) || staticSold.has(i) ? 'paid' : reserved.has(i) ? 'reserved' : clicked.has(i) ? 'clicked' : 'free';
    html += `<span class="raffle-number ${cls}" title="${raffleStatusLabel(cls)}">${String(i).padStart(3, "0")}</span>`;
  }
  html += '</div>';
  if(Number(stats.totalNumbers || 0) > 1000){
    html += '<p class="muted small">Mostrando os primeiros 1000 números para preservar desempenho do painel.</p>';
  }
  return html;
}

function buildRaffleScarcityText(raffle, stats){
  const title = raffle?.title || "Rifa Pense Offgrid";
  const publicUrl = getRaffleShareUrlAdmin(raffle);
  const paidLines = stats.paidBuyers
    .slice(-6)
    .reverse()
    .map(b => `• ${maskBuyerName(b.name)} — ${formatNumbersForAdmin(b.numbers)} confirmado`)
    .join(String.fromCharCode(10));
  const soldCount = stats.paidNumbers.length;
  const interactions = stats.buyers.length;
  const remaining = Math.max(0, Number(stats.totalNumbers || 0) - Number(stats.unavailable?.length || 0));
  return `🔥 ${title}

A rifa já está movimentando a comunidade Pense Offgrid!

✅ ${soldCount} número(s) confirmado(s)
👀 ${interactions} participação(ões)/interação(ões) registradas
⚡ Restam aproximadamente ${remaining} número(s) disponíveis

Últimas confirmações:
${paidLines || "• Seja um dos primeiros confirmados"}

Garanta seus números aqui:
${publicUrl}`;
}

function buildRaffleCsv(raffle, stats){
  const rows = [["numero","status","nome_parcial","telefone","valor","codigo"]];
  const byNumber = new Map();
  stats.buyers.forEach(buyer => {
    const status = raffleStatusLabel(buyer.paymentStatus || buyer.reservationStatus || "pending");
    parseNumbersForAdmin(buyer.numbers).forEach(num => byNumber.set(num, buyer));
  });
  for(let i=1; i<=Number(stats.totalNumbers || raffle?.totalNumbers || 0); i++){
    const b = byNumber.get(i);
    rows.push([String(i).padStart(3,"0"), b ? raffleStatusLabel(b.paymentStatus || b.reservationStatus) : "Livre", b ? maskBuyerName(b.name) : "", b?.whatsapp || "", b?.amount || "", b?.orderCode || ""]);
  }
  return rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g,'""')}"`).join(";")).join(String.fromCharCode(10));
}

function downloadTextFile(filename, content, type="text/plain;charset=utf-8"){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function bulkUpdateRaffleBuyers(ids, payload, label){
  const list = [...new Set(ids.filter(Boolean))];
  if(!list.length) return toast("Selecione pelo menos um participante.");
  if(!confirm(`${label || "Aplicar ação"} em ${list.length} registro(s)?`)) return;
  try{
    for(const id of list){
      await setDoc(itemRef("raffles", "buyers", id), {...payload, updatedAt:serverTimestamp()}, {merge:true});
    }
    await loadModule("raffles");
    toast("Ação em massa aplicada.");
    const anyBuyer = findBuyer(list[0]);
    refreshRaffleMonitorAfterBuyerChange(anyBuyer || {});
  }catch(error){
    console.error(error);
    toast(error.message || "Erro na ação em massa.");
  }
}

function buildBuyerMiniTable(items, title, emptyText){
  const sectionId = `sec_${String(title).toLowerCase().replace(/[^a-z0-9]+/g,"_")}`;
  const rows = items.slice(0, 160).map(item => `
    <tr>
      <td><input type="checkbox" data-buyer-select="${escapeHtml(item.id)}" data-section="${sectionId}"></td>
      <td><strong>${escapeHtml(item.name || "Sem nome")}</strong><br><small>${escapeHtml(item.whatsapp || "")}</small></td>
      <td>${escapeHtml(formatNumbersForAdmin(item.numbers) || "-")}</td>
      <td>${escapeHtml(formatMoney(item.amount || 0))}</td>
      <td>${escapeHtml(raffleStatusLabel(item.paymentStatus || item.reservationStatus))}</td>
      <td>${escapeHtml(formatDateTime(item.selectedAt || item.createdAt || item.createdDate))}</td>
      <td class="raffle-table-actions">
        <button class="btn tiny green" type="button" data-buyer-paid="${escapeHtml(item.id)}">Pago</button>
        <button class="btn tiny orange" type="button" data-buyer-reserve="${escapeHtml(item.id)}">Reservar</button>
        <button class="btn tiny ghost" type="button" data-buyer-edit="${escapeHtml(item.id)}">Editar</button>
        <button class="btn tiny danger" type="button" data-buyer-cancel="${escapeHtml(item.id)}">Desfazer</button>
        <button class="btn tiny ghost" type="button" data-buyer-whatsapp="${escapeHtml(item.id)}">WhatsApp</button>
        <button class="btn tiny ghost" type="button" data-buyer-copy-msg="${escapeHtml(item.id)}">Copiar</button>
      </td>
    </tr>`).join("");
  return `
    <section class="raffle-popup-section" data-buyer-section="${sectionId}">
      <h4>${escapeHtml(title)} <span>${items.length}</span></h4>
      ${rows ? `<div class="raffle-bulk-toolbar"><button class="btn tiny ghost" type="button" data-select-section="${sectionId}">Selecionar todos</button><button class="btn tiny green" type="button" data-bulk-paid="${sectionId}">Marcar pago</button><button class="btn tiny orange" type="button" data-bulk-reserve="${sectionId}">Marcar pendente</button><button class="btn tiny danger" type="button" data-bulk-cancel="${sectionId}">Desfazer/cancelar</button></div><div class="raffle-table-wrap"><table class="raffle-buyer-table"><thead><tr><th></th><th>Participante</th><th>Números</th><th>Valor</th><th>Status</th><th>Quando</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state">${escapeHtml(emptyText)}</div>`}
    </section>`;
}

function selectedBuyerIds(root, sectionId){
  return [...root.querySelectorAll(`input[data-buyer-select][data-section="${sectionId}"]:checked`)].map(input => input.dataset.buyerSelect);
}

function attachRafflePopupActions(root){
  root.querySelectorAll("[data-buyer-paid]").forEach(btn => btn.addEventListener("click", () => updateBuyerPaymentStatus(btn.dataset.buyerPaid, "paid", "confirmed")));
  root.querySelectorAll("[data-buyer-reserve]").forEach(btn => btn.addEventListener("click", () => updateBuyerPaymentStatus(btn.dataset.buyerReserve, "pending", "reserved")));
  root.querySelectorAll("[data-buyer-cancel]").forEach(btn => btn.addEventListener("click", () => cancelBuyerReservation(btn.dataset.buyerCancel)));
  root.querySelectorAll("[data-buyer-edit]").forEach(btn => btn.addEventListener("click", () => openBuyerEditor(btn.dataset.buyerEdit)));
  root.querySelectorAll("[data-buyer-whatsapp]").forEach(btn => btn.addEventListener("click", () => openBuyerWhatsapp(btn.dataset.buyerWhatsapp)));
  root.querySelectorAll("[data-buyer-copy-msg]").forEach(btn => btn.addEventListener("click", () => copyBuyerMessage(btn.dataset.buyerCopyMsg)));
  root.querySelectorAll("[data-select-section]").forEach(btn => btn.addEventListener("click", () => {
    const section = btn.dataset.selectSection;
    const inputs = [...root.querySelectorAll(`input[data-buyer-select][data-section="${section}"]`)];
    const shouldCheck = inputs.some(input => !input.checked);
    inputs.forEach(input => input.checked = shouldCheck);
  }));
  root.querySelectorAll("[data-bulk-paid]").forEach(btn => btn.addEventListener("click", () => bulkUpdateRaffleBuyers(selectedBuyerIds(root, btn.dataset.bulkPaid), {paymentStatus:"paid", reservationStatus:"confirmed", paidAt:new Date().toISOString().slice(0,16), confirmedAt:new Date().toISOString()}, "Marcar como pago")));
  root.querySelectorAll("[data-bulk-reserve]").forEach(btn => btn.addEventListener("click", () => bulkUpdateRaffleBuyers(selectedBuyerIds(root, btn.dataset.bulkReserve), {paymentStatus:"pending", reservationStatus:"reserved", reservedAt:new Date().toISOString()}, "Marcar como pendente")));
  root.querySelectorAll("[data-bulk-cancel]").forEach(btn => btn.addEventListener("click", () => bulkUpdateRaffleBuyers(selectedBuyerIds(root, btn.dataset.bulkCancel), {paymentStatus:"cancelled", reservationStatus:"cancelled", cancelledAt:new Date().toISOString(), cancelReason:"Cancelado em massa pelo painel"}, "Desfazer/cancelar")));
}

function closeRaffleMonitor(){
  const existing = document.getElementById("raffleMonitorModal");
  if(existing) existing.remove();
}

function openRaffleMonitor(itemId){
  const raffle = (cache.raffles?.items || []).find(item => item.id === itemId);
  if(!raffle) return toast("Rifa não encontrada.");
  const stats = getRaffleOperationalStats(raffle);
  const slug = raffle.slug || raffle.id;
  const publicUrl = getRaffleReaderUrlAdmin(raffle);
  const shareUrl = getRaffleShareUrlAdmin(raffle);
  const shareText = buildRaffleShareText(raffle);
  const modal = document.createElement("div");
  modal.id = "raffleMonitorModal";
  modal.className = "raffle-monitor-modal active";
  modal.innerHTML = `
    <div class="raffle-monitor-backdrop" data-close-raffle-monitor></div>
    <div class="raffle-monitor-panel" role="dialog" aria-modal="true" aria-label="Acompanhamento da rifa">
      <div class="raffle-monitor-hero">
        <div class="raffle-monitor-image">${raffle.imageUrl ? `<img src="${escapeHtml(raffle.imageUrl)}" alt="">` : `<span>${escapeHtml(raffle.icon || "🎟️")}</span>`}</div>
        <div class="raffle-monitor-title">
          <p>Central operacional da rifa</p>
          <h2>${escapeHtml(raffle.title || "Rifa")}</h2>
          <div class="raffle-monitor-tags">
            <span>${escapeHtml(raffleStatusLabel(raffle.status || "published"))}</span>
            <span>${escapeHtml(raffle.drawReference || "Sorteio não informado")}</span>
            <span>${escapeHtml(raffle.ticketPrice ? formatMoney(raffle.ticketPrice) + " / número" : "Preço não informado")}</span>
          </div>
        </div>
        <button class="btn ghost raffle-monitor-close" type="button" data-close-raffle-monitor>Fechar</button>
      </div>

      <div class="raffle-monitor-actions">
        <a class="btn green" target="_blank" rel="noopener noreferrer" href="${escapeHtml(publicUrl)}">Abrir página</a>
        <button class="btn ghost" type="button" id="copyRaffleShareBtn">Copiar divulgação</button>
        <button class="btn green" type="button" id="openRaffleWhatsappBtn">Compartilhar WhatsApp</button>
        <button class="btn ghost" type="button" id="copyRaffleReportBtn">Copiar relatório</button>
        <button class="btn orange" type="button" id="copyRaffleScarcityBtn">Copiar mensagem de escassez</button>
        <button class="btn ghost" type="button" id="downloadRaffleCsvBtn">Baixar planilha CSV</button>
      </div>

      <div class="raffle-monitor-kpis">
        <article><strong>${stats.buyers.length}</strong><span>interações totais</span></article>
        <article><strong>${stats.paidBuyers.length}</strong><span>pagos</span></article>
        <article><strong>${stats.reservedBuyers.length}</strong><span>reservados/pendentes</span></article>
        <article><strong>${stats.clickedBuyers.length}</strong><span>clicaram e não pagaram</span></article>
        <article><strong>${stats.unavailable.length}/${stats.totalNumbers || 0}</strong><span>números ocupados</span></article>
        <article><strong>${stats.soldPercent}%</strong><span>progresso</span></article>
        <article><strong>${formatMoney(stats.totalPaid)}</strong><span>confirmado</span></article>
        <article><strong>${formatMoney(stats.totalPending)}</strong><span>pendente</span></article>
      </div>

      <div class="raffle-monitor-progress"><span style="width:${Math.max(0, Math.min(100, stats.soldPercent))}%"></span></div>

      <div class="raffle-monitor-grid">
        <section class="raffle-popup-section wide">
          <h4>Mapa dos números <span>Pago • Reservado • Clique • Livre</span></h4>
          <div class="raffle-number-legend"><b class="paid"></b>Pago <b class="reserved"></b>Reservado <b class="clicked"></b>Clicou <b class="free"></b>Livre</div>
          ${buildRaffleNumberGrid(raffle, stats)}
        </section>
        <section class="raffle-popup-section">
          <h4>Detalhes da campanha</h4>
          <dl class="raffle-detail-list">
            <dt>Slug</dt><dd>${escapeHtml(slug)}</dd>
            <dt>Data/Hora</dt><dd>${escapeHtml([raffle.drawDate, raffle.drawTime].filter(Boolean).join(" às ") || "Não informado")}</dd>
            <dt>Mínimo venda</dt><dd>${escapeHtml(String(raffle.minimumSoldPercent || 0))}%</dd>
            <dt>Limite por reserva</dt><dd>${escapeHtml(String(raffle.maxTicketsPerOrder || "Não informado"))}</dd>
            <dt>Validade reserva</dt><dd>${escapeHtml(String(raffle.reservationHours || "Não informado"))}h</dd>
            <dt>Pix</dt><dd>${escapeHtml(raffle.pixKey || "Não informado")}</dd>
            <dt>Potencial bruto</dt><dd>${formatMoney(stats.possibleGross)}</dd>
          </dl>
        </section>
      </div>

      ${buildBuyerMiniTable(stats.paidBuyers, "Compradores confirmados", "Nenhum pagamento confirmado nesta rifa.")}
      ${buildBuyerMiniTable(stats.reservedBuyers, "Reservas pendentes", "Nenhuma reserva pendente nesta rifa.")}
      ${buildBuyerMiniTable(stats.clickedBuyers, "Clicaram/selecionaram e não pagaram", "Nenhum clique pendente registrado.")}
      ${buildBuyerMiniTable(stats.cancelledBuyers, "Cancelados/expirados", "Nenhum cancelamento registrado.")}
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-raffle-monitor]").forEach(el => el.addEventListener("click", closeRaffleMonitor));
  modal.querySelector("#copyRaffleShareBtn")?.addEventListener("click", () => copyTextToClipboard(shareText));
  modal.querySelector("#openRaffleWhatsappBtn")?.addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer"));
  modal.querySelector("#copyRaffleReportBtn")?.addEventListener("click", () => {
    const report = `RELATÓRIO OPERACIONAL - ${raffle.title || slug}\n\nStatus: ${raffleStatusLabel(raffle.status || "published")}\nInterações registradas: ${stats.buyers.length}\nCompradores confirmados: ${stats.paidBuyers.length}\nReservas pendentes: ${stats.reservedBuyers.length}\nCancelados/expirados: ${stats.cancelledBuyers.length}\nNúmeros ocupados: ${stats.unavailable.length}/${stats.totalNumbers || 0} (${stats.soldPercent}%)\nValor confirmado: ${formatMoney(stats.totalPaid)}\nValor pendente: ${formatMoney(stats.totalPending)}\nPágina pública: ${publicUrl}\nLink de compartilhamento: ${shareUrl}`;
    copyTextToClipboard(report);
  });
  modal.querySelector("#copyRaffleScarcityBtn")?.addEventListener("click", () => copyTextToClipboard(buildRaffleScarcityText(raffle, stats)));
  modal.querySelector("#downloadRaffleCsvBtn")?.addEventListener("click", () => downloadTextFile(`rifa-${slug || "penseoffgrid"}.csv`, "\ufeff" + buildRaffleCsv(raffle, stats), "text/csv;charset=utf-8"));
  attachRafflePopupActions(modal);
}

function copyBuyerMessage(itemId){
  const buyer = (cache.raffles?.buyers || []).find(item => item.id === itemId);
  if(!buyer) return toast("Participante não encontrado.");
  copyTextToClipboard(buildBuyerMessage(buyer));
}

async function openBuyerWhatsapp(itemId){
  const buyer = (cache.raffles?.buyers || []).find(item => item.id === itemId);
  if(!buyer) return toast("Participante não encontrado.");
  const cleanPhone = String(buyer.whatsapp || "").replace(/\D/g, "");
  if(!cleanPhone) return copyBuyerMessage(itemId);
  const phone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildBuyerMessage(buyer))}`, "_blank", "noopener,noreferrer");
  try{
    await setDoc(itemRef("raffles", "buyers", itemId), {contactStatus:"sent_message", updatedAt:serverTimestamp()}, {merge:true});
    await loadModule("raffles");
    renderCurrentSection();
  }catch(error){
    console.warn(error);
  }
}

function findBuyer(itemId){
  return (cache.raffles?.buyers || []).find(item => item.id === itemId);
}

function findRaffleForBuyer(buyer){
  if(!buyer) return null;
  const key = String(buyer.raffleSlug || buyer.raffleId || "").trim();
  return (cache.raffles?.items || []).find(raffle => String(raffle.slug || "") === key || String(raffle.id || "") === key) || null;
}

function refreshRaffleMonitorAfterBuyerChange(buyer){
  const raffle = findRaffleForBuyer(buyer);
  const modalOpen = Boolean(document.getElementById("raffleMonitorModal"));
  renderCurrentSection();
  if(modalOpen && raffle){
    closeRaffleMonitor();
    openRaffleMonitor(raffle.id);
  }
}

async function updateBuyerPaymentStatus(itemId, paymentStatus, reservationStatus){
  const buyer = findBuyer(itemId);
  if(!buyer) return toast("Participante não encontrado.");
  const label = paymentStatus === "paid" ? "confirmar pagamento e travar os números" : "confirmar reserva sem pagamento";
  if(!confirm(`Deseja ${label} de "${buyer.name || itemId}"?`)) return;
  try{
    const payload = {paymentStatus, reservationStatus, updatedAt:serverTimestamp()};
    if(paymentStatus === "paid"){
      payload.paidAt = new Date().toISOString().slice(0,16);
      payload.confirmedAt = new Date().toISOString();
    }
    if(reservationStatus === "reserved") payload.reservedAt = new Date().toISOString();
    await setDoc(itemRef("raffles", "buyers", itemId), payload, {merge:true});
    await loadModule("raffles");
    toast(paymentStatus === "paid" ? "Pagamento confirmado e números travados." : "Reserva confirmada como pendente.");
    refreshRaffleMonitorAfterBuyerChange({...buyer, ...payload});
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao atualizar participante.");
  }
}

async function cancelBuyerReservation(itemId){
  const buyer = findBuyer(itemId);
  if(!buyer) return toast("Participante não encontrado.");
  const reason = prompt(`Motivo para desfazer/cancelar a reserva de "${buyer.name || itemId}"?`, "Reserva desfeita manualmente pelo administrador");
  if(reason === null) return;
  try{
    await setDoc(itemRef("raffles", "buyers", itemId), {
      paymentStatus:"cancelled",
      reservationStatus:"cancelled",
      cancelledAt:new Date().toISOString(),
      cancelReason:reason || "Reserva desfeita manualmente pelo administrador",
      updatedAt:serverTimestamp()
    }, {merge:true});
    await loadModule("raffles");
    toast("Reserva desfeita. Os números voltam a ficar livres no acompanhamento.");
    refreshRaffleMonitorAfterBuyerChange(buyer);
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao desfazer reserva.");
  }
}

function openBuyerEditor(itemId){
  const buyer = findBuyer(itemId);
  if(!buyer) return toast("Participante não encontrado.");
  const existing = document.getElementById("raffleBuyerEditorModal");
  if(existing) existing.remove();
  const modal = document.createElement("div");
  modal.id = "raffleBuyerEditorModal";
  modal.className = "raffle-monitor-modal active raffle-buyer-editor-modal";
  modal.innerHTML = `
    <div class="raffle-monitor-backdrop" data-close-buyer-editor></div>
    <div class="raffle-monitor-panel raffle-buyer-editor-panel" role="dialog" aria-modal="true" aria-label="Editar participante da rifa">
      <div class="raffle-monitor-hero compact">
        <div class="raffle-monitor-title">
          <p>Editar reserva/participante</p>
          <h2>${escapeHtml(buyer.name || "Participante")}</h2>
          <div class="raffle-monitor-tags">
            <span>${escapeHtml(buyer.raffleSlug || buyer.raffleId || "rifa não informada")}</span>
            <span>${escapeHtml(raffleStatusLabel(buyer.paymentStatus || buyer.reservationStatus))}</span>
          </div>
        </div>
        <button class="btn ghost raffle-monitor-close" type="button" data-close-buyer-editor>Fechar</button>
      </div>
      <form id="raffleBuyerEditorForm" class="raffle-buyer-editor-form">
        <label>Nome<input name="name" value="${escapeHtml(buyer.name || "")}" placeholder="Nome do participante"></label>
        <label>WhatsApp<input name="whatsapp" value="${escapeHtml(buyer.whatsapp || "")}" placeholder="81999999999"></label>
        <label>Cidade<input name="city" value="${escapeHtml(buyer.city || "")}" placeholder="Cidade"></label>
        <label>UF<input name="state" value="${escapeHtml(buyer.state || "")}" placeholder="PE"></label>
        <label>Números<input name="numbers" value="${escapeHtml(formatNumbersForAdmin(buyer.numbers))}" placeholder="001, 002, 003"></label>
        <label>Valor total<input name="amount" type="number" step="0.01" value="${escapeHtml(String(buyer.amount || ""))}" placeholder="75"></label>
        <label>Código<input name="orderCode" value="${escapeHtml(buyer.orderCode || "")}" placeholder="Código da reserva"></label>
        <label>Slug/ID da rifa<input name="raffleSlug" value="${escapeHtml(buyer.raffleSlug || buyer.raffleId || "")}" placeholder="slug-da-rifa"></label>
        <label>Status pagamento<select name="paymentStatus">${["pending","paid","cancelled","expired","refunded"].map(value => `<option value="${value}" ${String(buyer.paymentStatus || "pending") === value ? "selected" : ""}>${raffleStatusLabel(value)}</option>`).join("")}</select></label>
        <label>Status reserva<select name="reservationStatus">${["reserved","confirmed","clicked","cancelled","expired"].map(value => `<option value="${value}" ${String(buyer.reservationStatus || "reserved") === value ? "selected" : ""}>${raffleStatusLabel(value)}</option>`).join("")}</select></label>
        <label>Status contato<select name="contactStatus">${["","waiting","sent_message","answered","no_answer","invalid_contact"].map(value => `<option value="${value}" ${String(buyer.contactStatus || "") === value ? "selected" : ""}>${value ? raffleStatusLabel(value) : "Não informado"}</option>`).join("")}</select></label>
        <label class="wide">Observações<textarea name="notes" rows="4" placeholder="Anotações internas, comprovante, observações de atendimento...">${escapeHtml(buyer.notes || buyer.adminNotes || "")}</textarea></label>
        <div class="raffle-buyer-editor-actions wide">
          <button class="btn green" type="submit">Salvar alterações</button>
          <button class="btn orange" type="button" id="buyerEditorReserveBtn">Confirmar reserva</button>
          <button class="btn green" type="button" id="buyerEditorPaidBtn">Confirmar pago</button>
          <button class="btn danger" type="button" id="buyerEditorCancelBtn">Desfazer reserva</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-buyer-editor]").forEach(el => el.addEventListener("click", () => modal.remove()));
  modal.querySelector("#buyerEditorReserveBtn")?.addEventListener("click", () => updateBuyerPaymentStatus(itemId, "pending", "reserved"));
  modal.querySelector("#buyerEditorPaidBtn")?.addEventListener("click", () => updateBuyerPaymentStatus(itemId, "paid", "confirmed"));
  modal.querySelector("#buyerEditorCancelBtn")?.addEventListener("click", () => cancelBuyerReservation(itemId));
  modal.querySelector("#raffleBuyerEditorForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name:String(form.get("name") || "").trim(),
      whatsapp:String(form.get("whatsapp") || "").trim(),
      city:String(form.get("city") || "").trim(),
      state:String(form.get("state") || "").trim().toUpperCase(),
      numbers:String(form.get("numbers") || "").split(/[\s,;]+/).map(v => v.trim()).filter(Boolean),
      amount:Number(form.get("amount") || 0),
      orderCode:String(form.get("orderCode") || "").trim(),
      raffleSlug:String(form.get("raffleSlug") || "").trim(),
      raffleId:String(form.get("raffleSlug") || "").trim(),
      paymentStatus:String(form.get("paymentStatus") || "pending"),
      reservationStatus:String(form.get("reservationStatus") || "reserved"),
      contactStatus:String(form.get("contactStatus") || ""),
      notes:String(form.get("notes") || "").trim(),
      adminNotes:String(form.get("notes") || "").trim(),
      updatedAt:serverTimestamp()
    };
    if(payload.paymentStatus === "paid" && !buyer.paidAt) payload.paidAt = new Date().toISOString().slice(0,16);
    if(payload.reservationStatus === "reserved" && !buyer.reservedAt) payload.reservedAt = new Date().toISOString();
    try{
      await setDoc(itemRef("raffles", "buyers", itemId), payload, {merge:true});
      await loadModule("raffles");
      toast("Participante atualizado.");
      modal.remove();
      refreshRaffleMonitorAfterBuyerChange({...buyer, ...payload});
    }catch(error){
      console.error(error);
      toast(error.message || "Erro ao salvar participante.");
    }
  });
}

function renderItemsList(mod, section){
  const list = $("itemsList");
  const all = cache[mod.id]?.[section.collection] || [];
  const items = getFilteredItems(mod, section);
  const summary = $("listSummary");
  if(summary){
    summary.textContent = `${items.length} de ${all.length} item(ns) exibidos • ${section.title}`;
    if(mod.id === "raffles" && section.key === "buyers"){
      summary.innerHTML = raffleBuyerDashboard(items, all);
    }
  }

  if(!items.length){
    list.innerHTML = `<div class="empty-state">Nenhum item encontrado nesta seção. Ajuste a busca ou os filtros.</div>`;
    updateBulkCount();
    return;
  }

  list.innerHTML = items.map(item => {
    const title = getPrimaryText(item, section);
    const status = item.status || item.availability || "";
    const meta = [
      item.slug ? `slug: ${item.slug}` : "",
      item.category ? `categoria: ${item.category}` : "",
      item.type ? `tipo: ${item.type}` : "",
      item.date ? `data: ${item.date}` : "",
      (mod.id === "projects" || mod.id === "raffles") && item.order !== undefined ? `ordem: ${item.order}` : "",
      mod.id === "projects" && item.featured ? "destaque" : "",
      mod.id === "raffles" && section.key === "items" && item.ticketPrice !== undefined ? `número: R$ ${item.ticketPrice}` : "",
      mod.id === "raffles" && section.key === "items" && item.totalNumbers !== undefined ? `total: ${item.totalNumbers}` : "",
      mod.id === "raffles" && section.key === "buyers" && item.raffleSlug ? `rifa: ${item.raffleSlug}` : "",
      mod.id === "raffles" && section.key === "buyers" && item.numbers ? `números: ${formatNumbersForAdmin(item.numbers)}` : "",
      mod.id === "raffles" && section.key === "buyers" && item.amount !== undefined ? `valor: R$ ${item.amount}` : "",
      mod.id === "raffles" && section.key === "buyers" && item.paymentStatus ? `pagamento: ${item.paymentStatus}` : "",
      mod.id === "raffles" && section.key === "buyers" && item.contactStatus ? `contato: ${item.contactStatus}` : "",
      mod.id === "raffles" && item.featured ? "destaque" : "",
      status ? `status: ${status}` : ""
    ].filter(Boolean).join(" • ");

    const img = item.imageUrl || item.heroImageUrl || item.thumbnailUrl || "";

    return `<article class="item-row">
      <label class="row-select" title="Selecionar item"><input class="bulk-item-check" type="checkbox" value="${escapeHtml(item.id)}"/></label>
      <div class="thumb">${img ? `<img src="${escapeHtml(img)}" alt="">` : mod.icon}</div>
      <div>
        <h3 class="item-title">${escapeHtml(title)}</h3>
        <div class="item-meta">${escapeHtml(meta || "Sem metadados")}</div>
        <div class="item-meta">${escapeHtml(item.excerpt || item.subtitle || item.description || "")}</div>
      </div>
      <div class="item-actions">
        <button class="btn ghost" type="button" data-edit="${escapeHtml(item.id)}">Editar</button>
        <button class="btn ghost" type="button" data-duplicate="${escapeHtml(item.id)}">Duplicar</button>
        ${mod.id !== "promotional" ? '<button class="btn green" type="button" data-promotional-copy="' + escapeHtml(item.id) + '">Copiar divulgação</button><button class="btn green" type="button" data-promotional-whatsapp="' + escapeHtml(item.id) + '">WhatsApp</button><button class="btn green" type="button" data-promotional-telegram="' + escapeHtml(item.id) + '">Telegram</button>' : ""}
        ${mod.id === "promotional" && section.key === "templates" ? '<button class="btn green" type="button" data-template-copy="' + escapeHtml(item.id) + '">Copiar msg</button><button class="btn green" type="button" data-template-whatsapp="' + escapeHtml(item.id) + '">WhatsApp</button><button class="btn green" type="button" data-template-telegram="' + escapeHtml(item.id) + '">Telegram</button>' : ""}
        ${mod.id === "projects" && section.key === "items" ? '<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="../projetos/?p=' + encodeURIComponent(item.slug || item.id) + '">Ver</a><button class="btn ghost" type="button" data-project-order-up="' + escapeHtml(item.id) + '">↑</button><button class="btn ghost" type="button" data-project-order-down="' + escapeHtml(item.id) + '">↓</button><button class="btn green" type="button" data-project-featured="' + escapeHtml(item.id) + '">' + (item.featured ? 'Destaque ✓' : 'Definir destaque') + '</button><button class="btn ghost" type="button" data-project-toggle-status="' + escapeHtml(item.id) + '">' + ((item.status || 'published') === 'published' ? 'Ocultar' : 'Publicar') + '</button>' : ""}
        ${mod.id === "raffles" && section.key === "items" ? '<button class="btn green" type="button" data-raffle-monitor="' + escapeHtml(item.id) + '">Acompanhar</button><a class="btn ghost" target="_blank" rel="noopener noreferrer" href="../rifas/?r=' + encodeURIComponent(item.slug || item.id) + '">Ver</a><button class="btn ghost" type="button" data-raffle-order-up="' + escapeHtml(item.id) + '">↑</button><button class="btn ghost" type="button" data-raffle-order-down="' + escapeHtml(item.id) + '">↓</button><button class="btn ghost" type="button" data-raffle-toggle-status="' + escapeHtml(item.id) + '">' + ((item.status || 'published') === 'published' || (item.status || '') === 'active' ? 'Ocultar' : 'Publicar') + '</button><button class="btn green" type="button" data-raffle-finish="' + escapeHtml(item.id) + '">Encerrar</button>' : ""}
        ${mod.id === "raffles" && section.key === "buyers" ? '<button class="btn green" type="button" data-buyer-paid="' + escapeHtml(item.id) + '">Marcar pago</button><button class="btn ghost" type="button" data-buyer-reserved="' + escapeHtml(item.id) + '">Reservado</button><button class="btn ghost" type="button" data-buyer-copy-msg="' + escapeHtml(item.id) + '">Copiar msg</button><button class="btn green" type="button" data-buyer-whatsapp="' + escapeHtml(item.id) + '">WhatsApp</button><button class="btn ghost" type="button" data-buyer-cancel="' + escapeHtml(item.id) + '">Cancelar</button>' : ""}
        ${mod.id === "media" && section.key === "library" ? '<button class="btn green" type="button" data-media-copy-url="' + escapeHtml(item.id) + '">Copiar URL</button>' + (item.imageUrl ? '<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(item.imageUrl) + '">Abrir</a>' : '') : ""}
        <button class="btn danger" type="button" data-delete="${escapeHtml(item.id)}">Excluir</button>
      </div>
    </article>`;
  }).join("");

  list.querySelectorAll(".bulk-item-check").forEach(input => {
    input.addEventListener("change", updateBulkCount);
  });

  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditor(mod.id, section.key, btn.dataset.edit));
  });

  list.querySelectorAll("[data-duplicate]").forEach(btn => {
    btn.addEventListener("click", () => duplicateItem(mod.id, section.key, btn.dataset.duplicate));
  });

  list.querySelectorAll("[data-promotional-copy]").forEach(btn => {
    btn.addEventListener("click", () => promotionalAction(mod.id, btn.dataset.promotionalCopy, "copy"));
  });

  list.querySelectorAll("[data-promotional-whatsapp]").forEach(btn => {
    btn.addEventListener("click", () => promotionalAction(mod.id, btn.dataset.promotionalWhatsapp, "whatsapp"));
  });

  list.querySelectorAll("[data-promotional-telegram]").forEach(btn => {
    btn.addEventListener("click", () => promotionalAction(mod.id, btn.dataset.promotionalTelegram, "telegram"));
  });

  list.querySelectorAll("[data-template-copy]").forEach(btn => {
    btn.addEventListener("click", () => promotionalTemplateAction(btn.dataset.templateCopy, "copy"));
  });

  list.querySelectorAll("[data-template-whatsapp]").forEach(btn => {
    btn.addEventListener("click", () => promotionalTemplateAction(btn.dataset.templateWhatsapp, "whatsapp"));
  });

  list.querySelectorAll("[data-template-telegram]").forEach(btn => {
    btn.addEventListener("click", () => promotionalTemplateAction(btn.dataset.templateTelegram, "telegram"));
  });

  list.querySelectorAll("[data-project-order-up]").forEach(btn => {
    btn.addEventListener("click", () => moveProjectOrder(btn.dataset.projectOrderUp, -1));
  });

  list.querySelectorAll("[data-project-order-down]").forEach(btn => {
    btn.addEventListener("click", () => moveProjectOrder(btn.dataset.projectOrderDown, 1));
  });

  list.querySelectorAll("[data-project-featured]").forEach(btn => {
    btn.addEventListener("click", () => setProjectFeatured(btn.dataset.projectFeatured));
  });

  list.querySelectorAll("[data-project-toggle-status]").forEach(btn => {
    btn.addEventListener("click", () => toggleProjectStatus(btn.dataset.projectToggleStatus));
  });

  list.querySelectorAll("[data-raffle-monitor]").forEach(btn => {
    btn.addEventListener("click", () => openRaffleMonitor(btn.dataset.raffleMonitor));
  });

  list.querySelectorAll("[data-raffle-order-up]").forEach(btn => {
    btn.addEventListener("click", () => moveRaffleOrder(btn.dataset.raffleOrderUp, -1));
  });

  list.querySelectorAll("[data-raffle-order-down]").forEach(btn => {
    btn.addEventListener("click", () => moveRaffleOrder(btn.dataset.raffleOrderDown, 1));
  });

  list.querySelectorAll("[data-raffle-toggle-status]").forEach(btn => {
    btn.addEventListener("click", () => toggleRaffleStatus(btn.dataset.raffleToggleStatus));
  });

  list.querySelectorAll("[data-raffle-finish]").forEach(btn => {
    btn.addEventListener("click", () => finishRaffle(btn.dataset.raffleFinish));
  });

  list.querySelectorAll("[data-buyer-paid]").forEach(btn => {
    btn.addEventListener("click", () => updateBuyerPaymentStatus(btn.dataset.buyerPaid, "paid", "confirmed"));
  });

  list.querySelectorAll("[data-buyer-reserved]").forEach(btn => {
    btn.addEventListener("click", () => updateBuyerPaymentStatus(btn.dataset.buyerReserved, "reserved", "reserved"));
  });

  list.querySelectorAll("[data-buyer-copy-msg]").forEach(btn => {
    btn.addEventListener("click", () => copyBuyerMessage(btn.dataset.buyerCopyMsg));
  });

  list.querySelectorAll("[data-buyer-whatsapp]").forEach(btn => {
    btn.addEventListener("click", () => openBuyerWhatsapp(btn.dataset.buyerWhatsapp));
  });

  list.querySelectorAll("[data-buyer-cancel]").forEach(btn => {
    btn.addEventListener("click", () => updateBuyerPaymentStatus(btn.dataset.buyerCancel, "cancelled", "cancelled"));
  });

  list.querySelectorAll("[data-media-copy-url]").forEach(btn => {
    btn.addEventListener("click", () => copyMediaUrl(btn.dataset.mediaCopyUrl));
  });

  list.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteItem(mod.id, section.key, btn.dataset.delete));
  });

  updateBulkCount();
}

function copyTextToClipboard(text){
  if(!text) return toast("Nada para copiar.");
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(text).then(() => toast("URL copiada.")).catch(() => fallbackCopyText(text));
  }else{
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text){
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try{
    document.execCommand("copy");
    toast("URL copiada.");
  }catch(error){
    console.error(error);
    toast("Não foi possível copiar automaticamente.");
  }finally{
    input.remove();
  }
}

function copyMediaUrl(itemId){
  const items = cache.media?.library || [];
  const item = items.find(i => i.id === itemId);
  copyTextToClipboard(item?.imageUrl || "");
}

function fieldHtml(data = {}){
  return (f) => {
    const value = data[f.name] ?? f.placeholder ?? "";
    const full = ["textarea","image"].includes(f.type) ? "field-full" : "";
    const safeValue = escapeHtml(value);

    if(f.type === "textarea"){
      return `<label class="${full}">${escapeHtml(f.label)}
        <textarea name="${escapeHtml(f.name)}" placeholder="${escapeHtml(f.placeholder || "")}">${safeValue}</textarea>
      </label>`;
    }

    if(f.type === "select"){
      return `<label class="${full}">${escapeHtml(f.label)}
        <select name="${escapeHtml(f.name)}">
          ${(f.options || []).map(opt => `<option value="${escapeHtml(opt)}" ${String(value) === String(opt) ? "selected" : ""}>${escapeHtml(labelOption(opt))}</option>`).join("")}
        </select>
      </label>`;
    }

    if(f.type === "boolean"){
      const checked = value === true || value === "true";
      return `<label class="${full}">${escapeHtml(f.label)}
        <span class="switch-line">
          <input type="checkbox" name="${escapeHtml(f.name)}" ${checked ? "checked" : ""}/>
          <span>Ativado</span>
        </span>
      </label>`;
    }

    if(f.type === "image"){
      return `<label class="${full}">${escapeHtml(f.label)}
        <input name="${escapeHtml(f.name)}" type="url" value="${safeValue}" placeholder="https://... ou envie abaixo"/>
        <input name="${escapeHtml(f.name)}__file" type="file" accept="image/*"/>
        <small class="form-help">Aceita URL externa ou upload compactado para Firebase Storage.</small>
      </label>`;
    }

    const inputType = f.type === "url" ? "url" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : "text";
    return `<label class="${full}">${escapeHtml(f.label)}
      <input name="${escapeHtml(f.name)}" type="${inputType}" value="${safeValue}" placeholder="${escapeHtml(f.placeholder || "")}"/>
    </label>`;
  };
}

function labelOption(opt){
  const map = {
    published:"Publicado",
    active:"Ativo",
    draft:"Rascunho",
    hidden:"Oculto",
    scheduled:"Programada",
    finished:"Finalizado",
    pending:"Pendente",
    reserved:"Reservado",
    confirmed:"Confirmado",
    paid:"Pago",
    cancelled:"Cancelado",
    refunded:"Reembolsado",
    expired:"Expirado",
    available:"Disponível",
    soon:"Em breve",
    true:"Sim",
    false:"Não",
    inverter:"Inversor",
    battery:"Bateria",
    panel:"Painel",
    controller:"Controlador",
    protection:"Proteção",
    tool:"Ferramenta",
    other:"Outro",
    affiliate:"Afiliado",
    whatsapp:"WhatsApp",
    social:"Rede social",
    coupon:"Cupom",
    contact:"Contato",
    banner:"Banner",
    thumb:"Thumbnail",
    produto:"Produto",
    projeto:"Projeto",
    noticia:"Notícia",
    tutorial:"Tutorial",
    curso:"Curso",
    rifa:"Rifa",
    logo:"Logo",
    outro:"Outro"
  };
  return map[opt] || opt;
}

function formToData(form, schema){
  const data = {};
  schema.forEach(f => {
    if(f.type === "boolean"){
      data[f.name] = Boolean(form.querySelector(`[name="${CSS.escape(f.name)}"]`)?.checked);
    }else{
      data[f.name] = form.querySelector(`[name="${CSS.escape(f.name)}"]`)?.value ?? "";
    }
  });
  return normalizeForSave(data, schema);
}

async function uploadImagesFromForm(form, schema, data, moduleId, sectionKey){
  for(const f of schema){
    if(f.type !== "image") continue;
    const input = form.querySelector(`[name="${CSS.escape(f.name)}__file"]`);
    const file = input?.files?.[0];
    if(file){
      try{
        toast(`Compactando e enviando imagem: ${f.label || f.name}...`);
        data[f.name] = await uploadImage(file, moduleId, sectionKey, data.slug || data.title || data.label || f.name);
        toast(`Imagem enviada: ${f.label || f.name}.`);
      }catch(error){
        console.error("Falha no upload de imagem", {field:f.name, moduleId, sectionKey, error});
        throw new Error(`Falha ao enviar imagem (${f.label || f.name}): ${error.message || error}`);
      }
    }
  }
  return data;
}

function isNewsPostContext(moduleId, sectionKey){ return moduleId === "news" && sectionKey === "posts"; }
function isProjectsItemContext(moduleId, sectionKey){ return moduleId === "projects" && sectionKey === "items"; }
function isTutorialItemContext(moduleId, sectionKey){ return moduleId === "tutorials" && sectionKey === "items"; }
function ensureNewsPostData(data){
  if(!data) return data;
  if(data.publishAt && data.status === "published"){
    const scheduledDate = new Date(data.publishAt);
    if(!Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now()) data.status = "scheduled";
  }
  if(data.bodyImageUrl){
    const alt = data.bodyImageAlt || data.title || "Imagem da notícia";
    const markdownImage = `![${alt}](${data.bodyImageUrl})`;
    if(!String(data.content || "").includes(data.bodyImageUrl)) data.content = `${String(data.content || "").trim()}\n\n${markdownImage}`.trim();
  }
  return data;
}
function ensureTutorialData(data){
  if(!data) return data;
  data.status = data.status || "published";
  data.order = Number(data.order || 999);
  data.featured = data.featured === true || String(data.featured).toLowerCase() === "true";
  data.slug = data.slug || slugify(data.title || data.id || "tutorial");
  if(data.bodyImageUrl){
    const alt = data.bodyImageAlt || data.title || "Imagem do tutorial";
    const markdownImage = `![${alt}](${data.bodyImageUrl})`;
    if(!String(data.content || "").includes(data.bodyImageUrl)) data.content = `${String(data.content || "").trim()}\n\n${markdownImage}`.trim();
  }
  return data;
}

function ensureProjectData(data){
  if(!data) return data;
  data.status = data.status || "published";
  data.order = Number(data.order || 999);
  data.featured = data.featured === true || String(data.featured).toLowerCase() === "true";
  data.slug = data.slug || slugify(data.title || data.id || "projeto");
  return data;
}
function insertAtCursor(textarea, text){
  if(!textarea) return;
  const start = textarea.selectionStart || 0, end = textarea.selectionEnd || 0;
  textarea.value = `${textarea.value.slice(0,start)}${text}${textarea.value.slice(end)}`;
  textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.dispatchEvent(new Event("input", {bubbles:true}));
}
function markdownPreviewHtml(input = ""){
  const safeUrl = (url) => /^(https?:\/\/|\/)/i.test(String(url || ""));
  return String(input || "").split(/\n{2,}/).map(block => block.trim()).filter(Boolean).map(block => {
    const imageMatch = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if(imageMatch && safeUrl(imageMatch[2])) return `<figure style="margin:14px 0"><img src="${escapeHtml(imageMatch[2])}" alt="${escapeHtml(imageMatch[1])}" style="max-width:100%;border-radius:14px"><figcaption style="color:#AEB7C6;font-size:12px;margin-top:6px">${escapeHtml(imageMatch[1])}</figcaption></figure>`;
    let html = escapeHtml(block);
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#FFC078;font-weight:900;text-decoration:underline">$1</a>');
    return `<p style="line-height:1.65;color:#d9e1ee">${html.replace(/\n/g,"<br>")}</p>`;
  }).join("");
}
function enhanceNewsEditor(moduleId, sectionKey){
  if(!isNewsPostContext(moduleId, sectionKey)) return;
  const form = $("editorForm"); const content = form?.querySelector('[name="content"]');
  if(!form || !content || form.querySelector(".news-editor-tools")) return;
  const tools = document.createElement("div"); tools.className = "field-full news-editor-tools";
  tools.innerHTML = `<div style="border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;background:rgba(255,255,255,.035)"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn ghost" type="button" id="insertMarkdownLinkBtn">Inserir link</button><button class="btn ghost" type="button" id="insertMarkdownImageBtn">Inserir imagem do corpo</button><button class="btn ghost" type="button" id="previewMarkdownBtn">Atualizar prévia</button></div><small class="form-help">Links: [texto do link](https://...). Imagem no corpo: envie no campo “Imagem dentro do corpo” e use o botão inserir imagem, ou escreva ![legenda](URL).</small><div id="markdownPreviewBox" style="margin-top:12px;border-top:1px solid rgba(255,255,255,.08);padding-top:12px"></div></div>`;
  form.appendChild(tools);
  const preview = () => { const box = form.querySelector("#markdownPreviewBox"); if(box) box.innerHTML = markdownPreviewHtml(content.value); };
  form.querySelector("#insertMarkdownLinkBtn")?.addEventListener("click", () => { insertAtCursor(content, "[texto do link](https://seulink.com)"); preview(); });
  form.querySelector("#insertMarkdownImageBtn")?.addEventListener("click", () => { const imageUrl = form.querySelector('[name="bodyImageUrl"]')?.value || "URL_DA_IMAGEM"; const alt = form.querySelector('[name="bodyImageAlt"]')?.value || "Imagem da notícia"; insertAtCursor(content, `\n\n![${alt}](${imageUrl})\n\n`); preview(); });
  form.querySelector("#previewMarkdownBtn")?.addEventListener("click", preview); content.addEventListener("input", preview); preview();
}

function enhanceTutorialEditor(moduleId, sectionKey){
  if(!isTutorialItemContext(moduleId, sectionKey)) return;
  const form = $("editorForm"); const content = form?.querySelector('[name="content"]');
  if(!form || !content || form.querySelector(".tutorial-editor-tools")) return;
  const tools = document.createElement("div"); tools.className = "field-full tutorial-editor-tools";
  tools.innerHTML = `<div style="border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;background:rgba(255,255,255,.035)"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn ghost" type="button" id="insertTutorialLinkBtn">Inserir link</button><button class="btn ghost" type="button" id="insertTutorialImageBtn">Inserir imagem enviada</button><button class="btn ghost" type="button" id="insertTutorialExternalImageBtn">Inserir imagem por URL</button><button class="btn ghost" type="button" id="previewTutorialMarkdownBtn">Atualizar prévia</button></div><small class="form-help">Para imagem no corpo: envie no campo “Imagem para inserir no corpo” ou cole uma URL direta. O conteúdo aceita Markdown: **negrito**, [link](https://...), ![legenda](URL).</small><div id="tutorialMarkdownPreviewBox" style="margin-top:12px;border-top:1px solid rgba(255,255,255,.08);padding-top:12px"></div></div>`;
  form.appendChild(tools);
  const preview = () => { const box = form.querySelector("#tutorialMarkdownPreviewBox"); if(box) box.innerHTML = markdownPreviewHtml(content.value); };
  form.querySelector("#insertTutorialLinkBtn")?.addEventListener("click", () => { insertAtCursor(content, "[texto do link](https://seulink.com)"); preview(); });
  form.querySelector("#insertTutorialImageBtn")?.addEventListener("click", () => { const imageUrl = form.querySelector('[name="bodyImageUrl"]')?.value || "URL_DA_IMAGEM"; const alt = form.querySelector('[name="bodyImageAlt"]')?.value || "Imagem do tutorial"; insertAtCursor(content, `\n\n![${alt}](${imageUrl})\n\n`); preview(); });
  form.querySelector("#insertTutorialExternalImageBtn")?.addEventListener("click", () => { const url = prompt("Cole a URL direta da imagem:"); if(url) insertAtCursor(content, `\n\n![Imagem do tutorial](${url})\n\n`); preview(); });
  form.querySelector("#previewTutorialMarkdownBtn")?.addEventListener("click", preview); content.addEventListener("input", preview); preview();
}

async function saveSettings(moduleId, section){
  try{
    const form = $("settingsForm");
    let data = formToData(form, section.schema);
    data = await uploadImagesFromForm(form, section.schema, data, moduleId, section.key);
    data.updatedAt = serverTimestamp();

    await setDoc(settingsRef(moduleId, section.doc), data, {merge:true});
    toast("Configurações salvas.");
    await loadModule(moduleId);
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao salvar.");
  }
}


function isRaffleItemEditor(moduleId, sectionKey){
  return moduleId === "raffles" && sectionKey === "items";
}

function raffleEditorTabDefinitions(){
  return [
    {id:"geral", label:"Geral", fields:["title","slug","headline","description","icon","featured","order","status"]},
    {id:"midia", label:"Imagem e divulgação", fields:["imageUrl","recentBuyers","showProgress","showCountdown"]},
    {id:"numeros", label:"Números e preço", fields:["ticketPrice","totalNumbers","soldNumbers","minimumSoldPercent","maxTicketsPerOrder","reservationHours"]},
    {id:"mercadopago", label:"Mercado Pago", fields:["mercadoPagoEnabled","autoReserveBeforePayment","paymentUrl","pixKey","pixCopyPaste","paymentInstructions","telegramNotify"]},
    {id:"whatsapp", label:"WhatsApp e grupo", fields:["whatsappUrl","groupUrl","whatsappMessageTemplate"]},
    {id:"regras", label:"Regras e sorteio", fields:["drawDate","drawTime","drawReference","drawRules"]},
    {id:"resultado", label:"Resultado", fields:["winnerName","winnerCity","winnerNumbers","resultUrl"]}
  ];
}

function raffleEditorTabsHtml(section, data = {}){
  const schema = section.schema || [];
  const byName = new Map(schema.map(f => [f.name, f]));
  const used = new Set();
  const renderer = fieldHtml(data);
  const tabs = raffleEditorTabDefinitions().map(group => {
    const fields = group.fields.map(name => byName.get(name)).filter(Boolean);
    fields.forEach(f => used.add(f.name));
    return {...group, fields};
  }).filter(group => group.fields.length);

  const advanced = schema.filter(f => !used.has(f.name));
  if(advanced.length) tabs.push({id:"avancado", label:"Avançado", fields:advanced});

  const nav = tabs.map((tab, index) => `
    <button class="raffle-editor-tab ${index === 0 ? "active" : ""}" type="button" data-raffle-tab="${escapeHtml(tab.id)}">${escapeHtml(tab.label)}</button>
  `).join("");

  const panels = tabs.map((tab, index) => `
    <section class="raffle-editor-panel ${index === 0 ? "active" : ""}" data-raffle-panel="${escapeHtml(tab.id)}">
      <div class="raffle-editor-panel-head">
        <h3>${escapeHtml(tab.label)}</h3>
        <p>${escapeHtml(raffleEditorTabHelp(tab.id))}</p>
      </div>
      <div class="raffle-editor-grid">${tab.fields.map(renderer).join("")}</div>
    </section>
  `).join("");

  return `
    <div class="raffle-editor-shell">
      <div class="raffle-editor-tabs" role="tablist" aria-label="Configurações da rifa">${nav}</div>
      <div class="raffle-editor-panels">${panels}</div>
    </div>
  `;
}

function raffleEditorTabHelp(tabId){
  const map = {
    geral:"Identificação, status, destaque e ordem da rifa.",
    midia:"Imagem, elementos visuais e opções de exibição pública.",
    numeros:"Quantidade de números, preço, reservas e progresso.",
    mercadopago:"Pagamento automático, Pix, instruções e travamento antes do pagamento.",
    whatsapp:"Links de atendimento, grupo oficial e mensagem pronta da rifa.",
    regras:"Data, horário, referência e regras que aparecem para o público.",
    resultado:"Dados do ganhador, número vencedor e comprovante de resultado.",
    avancado:"Campos extras preservados para compatibilidade com versões anteriores."
  };
  return map[tabId] || "Configurações desta seção.";
}

function enhanceRaffleEditorTabs(moduleId, sectionKey){
  if(!isRaffleItemEditor(moduleId, sectionKey)) return;
  const form = $("editorForm");
  if(!form) return;
  const tabs = [...form.querySelectorAll("[data-raffle-tab]")];
  const panels = [...form.querySelectorAll("[data-raffle-panel]")];
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.raffleTab;
      tabs.forEach(item => item.classList.toggle("active", item === btn));
      panels.forEach(panel => panel.classList.toggle("active", panel.dataset.rafflePanel === target));
    });
  });
}

function openEditor(moduleId, sectionKey, itemId){
  const section = getSection(moduleId, sectionKey);
  const mod = getModule(moduleId);
  const items = cache[moduleId]?.[section.collection] || [];
  const item = itemId ? items.find(i => i.id === itemId) : null;

  currentEditing = {
    moduleId,
    sectionKey,
    itemId:item?.id || "",
    mode:item ? "edit" : "create"
  };

  $("modalEyebrow").textContent = `${mod.title} • ${section.title}`;
  $("modalTitle").textContent = item ? `Editar ${getPrimaryText(item, section)}` : `Novo item`;
  $("editorForm").innerHTML = isRaffleItemEditor(moduleId, sectionKey)
    ? raffleEditorTabsHtml(section, item || {})
    : section.schema.map(fieldHtml(item || {})).join("");

  attachSlugAuto("editorForm");
  enhanceRaffleEditorTabs(moduleId, sectionKey);
  $("duplicateModalBtn").style.display = item ? "inline-flex" : "none";
  $("deleteModalBtn").style.display = item ? "inline-flex" : "none";

  enhanceNewsEditor(moduleId, sectionKey);
  enhanceTutorialEditor(moduleId, sectionKey);

  $("editorModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeEditor(){
  $("editorModal").classList.remove("active");
  document.body.style.overflow = "";
  currentEditing = null;
}

async function saveEditor(){
  if(!currentEditing) return;

  const {moduleId, sectionKey, itemId} = currentEditing;
  const section = getSection(moduleId, sectionKey);
  const form = $("editorForm");

  try{
    let data = formToData(form, section.schema);
    data = await uploadImagesFromForm(form, section.schema, data, moduleId, sectionKey);
    if(isNewsPostContext(moduleId, sectionKey)) data = ensureNewsPostData(data);
    if(isTutorialItemContext(moduleId, sectionKey)) data = ensureTutorialData(data);
    if(isProjectsItemContext(moduleId, sectionKey)) data = ensureProjectData(data);

    const desiredId = data.slug || slugify(data.title || data.label || data.name || itemId || Date.now());
    const finalId = desiredId || String(Date.now());
    data.id = finalId;
    data.updatedAt = serverTimestamp();

    const refDoc = itemRef(moduleId, section.collection, finalId);
    const existing = await getDoc(refDoc);

    if(!existing.exists()){
      data.createdAt = serverTimestamp();
    }

    if(isProjectsItemContext(moduleId, sectionKey) && data.featured){
      await unsetOtherFeaturedProjects(finalId);
    }

    await setDoc(refDoc, data, {merge:true});

    if(itemId && itemId !== finalId){
      await deleteDoc(itemRef(moduleId, section.collection, itemId));
    }

    toast("Item salvo.");
    closeEditor();
    await loadModule(moduleId);
    renderModuleTabs();
    renderCurrentSection();
  }catch(error){
    console.error(error);
    toast(error.message || "Erro ao salvar item.");
  }
}

async function duplicateCurrentEditor(){
  if(!currentEditing?.itemId) return;
  await duplicateItem(currentEditing.moduleId, currentEditing.sectionKey, currentEditing.itemId);
  closeEditor();
}

async function deleteCurrentEditor(){
  if(!currentEditing?.itemId) return;
  await deleteItem(currentEditing.moduleId, currentEditing.sectionKey, currentEditing.itemId);
  closeEditor();
}

async function duplicateItem(moduleId, sectionKey, itemId){
  const section = getSection(moduleId, sectionKey);
  const items = cache[moduleId]?.[section.collection] || [];
  const item = items.find(i => i.id === itemId);

  if(!item) return toast("Item não encontrado.");

  const baseSlug = slugify(item.slug || item.title || item.label || item.name || item.id);
  const newId = `${baseSlug || "item"}-copia-${Date.now().toString().slice(-5)}`;

  const copy = {...item};
  delete copy.createdAt;
  delete copy.updatedAt;

  copy.id = newId;
  copy.slug = newId;

  if(copy.title) copy.title = `${copy.title} (cópia)`;
  if(copy.label) copy.label = `${copy.label} (cópia)`;
  if(copy.status) copy.status = "draft";

  copy.createdAt = serverTimestamp();
  copy.updatedAt = serverTimestamp();

  await setDoc(itemRef(moduleId, section.collection, newId), copy, {merge:true});
  toast("Item duplicado.");
  await loadModule(moduleId);
  renderModuleTabs();
  renderCurrentSection();
}

async function deleteItem(moduleId, sectionKey, itemId){
  const section = getSection(moduleId, sectionKey);
  const items = cache[moduleId]?.[section.collection] || [];
  const item = items.find(i => i.id === itemId);
  const title = getPrimaryText(item, section);

  if(!confirm(`Excluir "${title}"?`)) return;

  await deleteDoc(itemRef(moduleId, section.collection, itemId));
  toast("Item excluído.");
  await loadModule(moduleId);
  renderModuleTabs();
  renderCurrentSection();
}

async function seedExample(moduleId, sectionKey){
  const section = getSection(moduleId, sectionKey);
  const schema = section.schema || [];

  const sample = {};
  schema.forEach(f => {
    if(f.type === "number") sample[f.name] = Number(f.placeholder || 1);
    else if(f.type === "boolean") sample[f.name] = false;
    else if(f.type === "select") sample[f.name] = f.placeholder || f.options?.[0] || "";
    else if(f.type === "date") sample[f.name] = today();
    else sample[f.name] = f.placeholder || exemploTexto(f.name);
  });

  const data = normalizeForSave(sample, schema);
  const id = data.slug || slugify(data.title || data.label || "exemplo") || `exemplo-${Date.now()}`;

  data.id = id;
  data.createdAt = serverTimestamp();
  data.updatedAt = serverTimestamp();

  await setDoc(itemRef(moduleId, section.collection, id), data, {merge:true});
  toast("Exemplo criado.");
  await loadModule(moduleId);
  renderModuleTabs();
  renderCurrentSection();
}

function exemploTexto(name){
  const map = {
    title:"Novo item",
    label:"Novo botão",
    subtitle:"Subtítulo do item",
    description:"Descrição do item",
    excerpt:"Resumo curto para card e compartilhamento.",
    content:"Conteúdo completo editável pelo painel.",
    url:"/",
    linkUrl:"/",
    imageUrl:"",
    status:"published"
  };
  return map[name] || "";
}

function attachSlugAuto(formId){
  const form = $(formId);
  const title = form?.querySelector('[name="title"],[name="label"],[name="name"]');
  const slug = form?.querySelector('[name="slug"]');

  if(title && slug){
    title.addEventListener("input", () => {
      if(!slug.value.trim()){
        slug.value = slugify(title.value);
      }
    });
  }
}

async function loadModule(moduleId){
  const mod = getModule(moduleId);
  if(!mod || !mod.sections) return;

  cache[moduleId] = cache[moduleId] || {};

  for(const section of mod.sections){
    if(section.type === "settings"){
      cache[moduleId].settings = cache[moduleId].settings || {};
      const snap = await getDoc(settingsRef(moduleId, section.doc));
      cache[moduleId].settings[section.doc] = snap.exists() ? snap.data() : {};
    }else{
      const snap = await getDocs(collectionRef(moduleId, section.collection));
      const arr = [];
      snap.forEach(d => arr.push({id:d.id, ...d.data()}));
      arr.sort((a,b) => Number(a.order || 9999) - Number(b.order || 9999) || String(b.date || "").localeCompare(String(a.date || "")));
      cache[moduleId][section.collection] = arr;
    }
  }
}

async function loadAll(){
  renderModuleTabs();

  const loadable = MODULES.filter(m => m.sections?.length);

  for(const mod of loadable){
    try{
      await loadModule(mod.id);
    }catch(error){
      console.warn("Falha ao carregar módulo:", mod.id, error);
      cache[mod.id] = cache[mod.id] || {};
    }
  }

  renderModuleTabs();
  renderDashboard();
}


function dashboardStatusValue(item={}){
  return String(item.status || item.paymentStatus || item.reservationStatus || "").toLowerCase();
}

function dashboardIsPublished(item={}){
  const s = dashboardStatusValue(item);
  return ["published","active","paid","approved","confirmed","finished"].includes(s) || item.published === true || item.featured === true;
}

function dashboardMoney(value){
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}

function dashboardNumber(value){
  return Number(value || 0).toLocaleString("pt-BR");
}

function dashboardDate(value){
  if(!value) return "—";
  try{
    const d = new Date(value.seconds ? value.seconds * 1000 : value);
    if(Number.isNaN(d.getTime())) return String(value).slice(0,16);
    return d.toLocaleString("pt-BR", {timeZone:"America/Recife", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"});
  }catch(error){ return String(value).slice(0,16); }
}

function dashboardItems(moduleId, key){
  const data = cache[moduleId] || {};
  return Array.isArray(data[key]) ? data[key] : [];
}

function dashboardAllCollectionItems(moduleId){
  const data = cache[moduleId] || {};
  return Object.values(data).flatMap(value => Array.isArray(value) ? value : []);
}

function dashboardOpenModule(moduleId){
  if(moduleId === "dashboard") return openDashboard();
  openModule(moduleId);
}

function dashboardPaidBuyers(){
  return dashboardItems("raffles", "buyers").filter(b => {
    const status = `${b.paymentStatus || ""} ${b.mercadoPagoStatus || ""} ${b.reservationStatus || ""}`.toLowerCase();
    return /paid|approved|confirmado|pago|confirmed/.test(status);
  });
}

function dashboardTicketCount(buyer={}){
  if(Array.isArray(buyer.numbers)) return buyer.numbers.length;
  return String(buyer.numbers || "").split(/[;,\s]+/).map(v => v.trim()).filter(Boolean).length;
}

function dashboardMaskName(name=""){
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "Participante";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return `${first}${last ? " " + last.charAt(0) + "." : ""}`;
}

function dashboardModuleSummary(){
  return MODULES.filter(m => m.sections?.length).map(mod => {
    const data = cache[mod.id] || {};
    const collections = Object.entries(data).filter(([,value]) => Array.isArray(value));
    const total = collections.reduce((sum, [,items]) => sum + items.length, 0);
    const published = collections.reduce((sum, [,items]) => sum + items.filter(dashboardIsPublished).length, 0);
    const hidden = collections.reduce((sum, [,items]) => sum + items.filter(item => ["hidden","draft","cancelled","expired"].includes(dashboardStatusValue(item))).length, 0);
    return {mod,total,published,hidden};
  });
}

function dashboardLatestItems(){
  const rows = [];
  const map = [
    ["news", "posts", "Notícia"],
    ["raffles", "buyers", "Rifa"],
    ["offers", "clicks", "Oferta"],
    ["courses", "lessons", "Curso"],
    ["tutorials", "items", "Tutorial"]
  ];
  map.forEach(([moduleId, key, label]) => {
    dashboardItems(moduleId, key).forEach(item => {
      rows.push({
        label,
        moduleId,
        title: item.title || item.name || item.offerTitle || item.headline || item.orderCode || item.slug || "Registro",
        status: item.paymentStatus || item.status || item.reservationStatus || "—",
        date: item.paidAt || item.createdAt || item.createdAtText || item.selectedAt || item.updatedAt || item.date || "",
      });
    });
  });
  return rows.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0,8);
}

function dashboardAlerts(){
  const alerts = [];
  const raffles = dashboardItems("raffles", "items");
  const buyers = dashboardItems("raffles", "buyers");
  const offers = dashboardItems("offers", "items");
  const pending = buyers.filter(b => ["pending","reserved"].includes(String(b.paymentStatus || "").toLowerCase())).length;
  const cancelled = buyers.filter(b => ["cancelled","expired"].includes(String(b.paymentStatus || b.reservationStatus || "").toLowerCase())).length;
  const rafflesWithoutMp = raffles.filter(r => dashboardIsPublished(r) && String(r.mercadoPagoEnabled) !== "true" && r.mercadoPagoEnabled !== true).length;
  const offersWithoutLink = offers.filter(o => dashboardIsPublished(o) && !(o.affiliateUrl || o.url || o.linkUrl)).length;
  if(pending) alerts.push({tone:"warn", text:`${pending} reserva(s) pendente(s) aguardando ação.`});
  if(cancelled) alerts.push({tone:"muted", text:`${cancelled} registro(s) cancelado(s)/expirado(s) nas rifas.`});
  if(rafflesWithoutMp) alerts.push({tone:"warn", text:`${rafflesWithoutMp} rifa(s) publicada(s) sem Mercado Pago automático.`});
  if(offersWithoutLink) alerts.push({tone:"warn", text:`${offersWithoutLink} oferta(s) publicada(s) sem link final.`});
  if(!alerts.length) alerts.push({tone:"ok", text:"Nenhum alerta crítico encontrado nos dados carregados."});
  return alerts;
}

function renderDashboard(){
  const grid = $("kpiGrid");
  const paidBuyers = dashboardPaidBuyers();
  const raffleRevenue = paidBuyers.reduce((sum,b) => sum + Number(b.amount || b.totalAmount || 0), 0);
  const ticketsSold = paidBuyers.reduce((sum,b) => sum + dashboardTicketCount(b), 0);
  const pendingBuyers = dashboardItems("raffles", "buyers").filter(b => ["pending","reserved"].includes(String(b.paymentStatus || "").toLowerCase())).length;
  const offerClicks = dashboardItems("offers", "clicks").length || dashboardItems("offers", "items").reduce((sum,o) => sum + Number(o.clicks || 0), 0);
  const publishedContent = ["news","projects","courses","tutorials","offers","raffles"].reduce((sum,moduleId) => {
    return sum + dashboardAllCollectionItems(moduleId).filter(dashboardIsPublished).length;
  }, 0);
  const mediaTotal = dashboardItems("media", "library").length;
  const activeRaffles = dashboardItems("raffles", "items").filter(r => ["published","active"].includes(dashboardStatusValue(r))).length;
  const moduleRows = dashboardModuleSummary();
  const latest = dashboardLatestItems();
  const alerts = dashboardAlerts();
  const lastPaid = paidBuyers.slice().sort((a,b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0)).slice(0,5);

  grid.innerHTML = `
    <div class="kpi glass"><small>🎟️ Receita confirmada em rifas</small><b>${dashboardMoney(raffleRevenue)}</b><em>${ticketsSold} número(s) pago(s)</em></div>
    <div class="kpi glass"><small>⏳ Reservas pendentes</small><b>${dashboardNumber(pendingBuyers)}</b><em>acompanhar no popup da rifa</em></div>
    <div class="kpi glass"><small>🛒 Cliques em ofertas</small><b>${dashboardNumber(offerClicks)}</b><em>links afiliados rastreados</em></div>
    <div class="kpi glass"><small>✅ Conteúdos publicados</small><b>${dashboardNumber(publishedContent)}</b><em>notícias, projetos, cursos e mais</em></div>
    <div class="kpi glass"><small>🖼️ Mídias na biblioteca</small><b>${dashboardNumber(mediaTotal)}</b><em>imagens reutilizáveis</em></div>
    <div class="kpi glass"><small>🔥 Rifas ativas</small><b>${dashboardNumber(activeRaffles)}</b><em>campanhas públicas</em></div>

    <div class="dashboard-wide glass dashboard-v214-card">
      <div class="card-head">
        <div><span class="eyebrow">Operação</span><h2>Atalhos rápidos</h2></div>
      </div>
      <div class="dashboard-v214-actions">
        <button class="btn primary" type="button" data-dashboard-open="raffles">🎟️ Gerenciar rifas</button>
        <button class="btn ghost" type="button" data-dashboard-open="offers">🛒 Ver ofertas</button>
        <button class="btn ghost" type="button" data-dashboard-open="news">📰 Notícias</button>
        <button class="btn ghost" type="button" data-dashboard-open="courses">🎓 Cursos</button>
        <button class="btn ghost" type="button" data-dashboard-open="tutorials">🧰 Tutoriais</button>
        <button class="btn ghost" type="button" data-dashboard-open="media">🖼️ Mídia</button>
      </div>
    </div>

    <div class="dashboard-wide dashboard-v214-grid">
      <div class="glass dashboard-v214-card">
        <div class="card-head"><div><span class="eyebrow">Módulos</span><h2>Resumo por área</h2></div></div>
        <div class="dashboard-v214-table">
          ${moduleRows.map(row => `
            <button type="button" class="dashboard-v214-row" data-dashboard-open="${row.mod.id}">
              <span><b>${row.mod.icon} ${escapeHtml(row.mod.title)}</b><small>${escapeHtml(row.mod.description || "")}</small></span>
              <strong>${dashboardNumber(row.total)}</strong>
              <em>${dashboardNumber(row.published)} ativos</em>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="glass dashboard-v214-card">
        <div class="card-head"><div><span class="eyebrow">Atenção</span><h2>Alertas e pendências</h2></div></div>
        <div class="dashboard-v214-alerts">
          ${alerts.map(alert => `<div class="dashboard-v214-alert ${alert.tone}">${escapeHtml(alert.text)}</div>`).join("")}
        </div>
      </div>
    </div>

    <div class="dashboard-wide dashboard-v214-grid">
      <div class="glass dashboard-v214-card">
        <div class="card-head"><div><span class="eyebrow">Rifas</span><h2>Últimos compradores pagos</h2></div></div>
        <div class="dashboard-v214-list">
          ${lastPaid.length ? lastPaid.map(b => `
            <div class="dashboard-v214-list-item">
              <span><b>${escapeHtml(dashboardMaskName(b.name))}</b><small>${escapeHtml([b.city,b.state].filter(Boolean).join("/") || "Cidade não informada")}</small></span>
              <strong>${dashboardTicketCount(b)} nº</strong>
              <em>${dashboardMoney(b.amount || 0)}</em>
            </div>
          `).join("") : `<div class="dashboard-v214-empty">Ainda não há compradores pagos carregados.</div>`}
        </div>
      </div>

      <div class="glass dashboard-v214-card">
        <div class="card-head"><div><span class="eyebrow">Movimento</span><h2>Últimos registros</h2></div></div>
        <div class="dashboard-v214-list">
          ${latest.length ? latest.map(item => `
            <div class="dashboard-v214-list-item">
              <span><b>${escapeHtml(item.label)} • ${escapeHtml(item.title)}</b><small>${escapeHtml(item.status)}</small></span>
              <em>${dashboardDate(item.date)}</em>
            </div>
          `).join("") : `<div class="dashboard-v214-empty">Nenhum registro recente encontrado.</div>`}
        </div>
      </div>
    </div>
  `;

  grid.querySelectorAll("[data-dashboard-open]").forEach(btn => {
    btn.addEventListener("click", () => dashboardOpenModule(btn.dataset.dashboardOpen));
  });
}
function exportAll(){
  $("backupPanel").classList.add("active");
  $("dashboardPanel").classList.remove("active");
  $("modulePanel").classList.remove("active");
  $("backupText").value = JSON.stringify(cache, null, 2);
  toast("Backup carregado na área de texto.");
}

function setupButtons(){
  $("reloadAllBtn").addEventListener("click", async () => {
    toast("Recarregando...");
    await loadAll();
    toast("Dados recarregados.");
  });

  $("exportAllBtn").addEventListener("click", exportAll);
  $("createMainItemBtn").addEventListener("click", () => {
    const section = getSection(currentModuleId, currentSectionKey);
    if(section?.type === "collection") openEditor(currentModuleId, currentSectionKey, null);
  });

  $("closeModalBtn").addEventListener("click", closeEditor);
  $("cancelModalBtn").addEventListener("click", closeEditor);
  $("saveModalBtn").addEventListener("click", saveEditor);
  $("duplicateModalBtn").addEventListener("click", duplicateCurrentEditor);
  $("deleteModalBtn").addEventListener("click", deleteCurrentEditor);

  $("editorModal").addEventListener("click", event => {
    if(event.target.id === "editorModal") closeEditor();
  });
}

function setupAuth(){
  $("loginBtn").addEventListener("click", async () => {
    try{
      await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    }catch(error){
      console.error(error);
      toast(error.message);
    }
  });

  $("googleBtn").addEventListener("click", async () => {
    try{
      await signInWithPopup(auth, new GoogleAuthProvider());
    }catch(error){
      console.error(error);
      toast(error.message);
    }
  });

  $("logoutBtn").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, async user => {
    const online = Boolean(user);
    $("authDot").classList.toggle("online", online);
    $("authStatus").querySelector("b").textContent = online ? (user.email || "Online") : "Offline";
    $("authCard").classList.toggle("hidden", online);
    $("adminApp").classList.toggle("hidden", !online);

    if(online){
      toast("Carregando ecossistema...");
      try{
        await loadAll();
      }catch(error){
        console.warn("Carregamento parcial do painel:", error);
        renderModuleTabs();
        renderDashboard();
      }
      openDashboard();
      toast("Painel carregado.");
    }
  });
}

setupButtons();
setupAuth();


// V2.20 Calculadora painel
window.calculadoraPainelConfig = {
  seo:true,
  banners:true,
  ctas:true,
  products:true
};
