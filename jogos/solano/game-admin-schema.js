/*
  Esboço de schema para o futuro painel do Pencilgrid.
  Use como referência quando criar a aba administrativa do jogo.
*/
window.SOLANO_ADMIN_SCHEMA = {
  moduleId: "solano-game",
  title: "Solano Game Control Center",
  access: "admin-only",
  collections: {
    config: "games/solano/config",
    seasons: "games/solano/seasons",
    publicRanking: "games/solano/ranking",
    events: "games/solano/events"
  },
  editableSections: [
    { id: "runner", label: "Runner", description: "Velocidade, cooldown, spawns e dificuldade." },
    { id: "economy", label: "Economia", description: "Geração, CPO, preço e multiplicadores." },
    { id: "missions", label: "Missões", description: "Missões diárias, semanais e recompensas." },
    { id: "lootTable", label: "Loot", description: "Itens, raridade, chances e recompensas." },
    { id: "texts", label: "Textos", description: "Títulos, banners e mensagens públicas." },
    { id: "shop", label: "Loja", description: "Itens compráveis, preço, imagem, descrição e efeito." },
    { id: "affiliatePopups", label: "Pop-ups/CTA", description: "Pausas monetizáveis com links afiliados, WhatsApp e ofertas." },
    { id: "assets", label: "Assets", description: "URLs Imgur, links diretos e futuro upload via Firebase Storage." },
    { id: "characters", label: "Personagens", description: "Skins, PNG base, atributos, salto, velocidade e progressão." },
    { id: "panels", label: "Painéis", description: "Potências de 100Wp a 700Wp, raridade e imagem." },
    { id: "batteries", label: "Baterias", description: "Capacidades em Ah, marca, raridade e imagem." },
    { id: "tools", label: "Ferramentas", description: "Alicate, multímetro, fonte e upgrades futuros." }
  ],
  itemModel: {
    id: "string",
    type: "panel | battery | inverter | tool | character",
    name: "string",
    rarity: "comum | colecionável | raro | épico",
    price: "number",
    image: "string URL/path",
    description: "string",
    effect: "string",
    stats: { speed: "number", jump: "number", xpBonus: "number" }
  }
};
