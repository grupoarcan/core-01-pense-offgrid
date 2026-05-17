/*
  Solano Game Config — camada segura para futuro painel admin.
  Este arquivo NÃO roda a lógica do jogo. Ele só expõe dados editáveis.
  Quando o Firebase/painel existir, ele poderá sobrescrever estes valores sem reescrever o runner.
*/
window.SOLANO_GAME_CONFIG = {
  version: "5.21.3-regras-profundas-por-item",
  source: "local-fallback",
  runner: {
    baseSpeed: 340,
    maxSpeed: 680,
    distanceSpeedFactor: 0.045,
    turboMultiplier: 1.18,
    initialObstacleTimer: 0.9,
    initialPlatformTimer: 2.1,
    initialLootTimer: 0.35,
    obstacleTimerBase: 0.9,
    obstacleTimerRandom: 0.62,
    platformTimerBase: 2.4,
    platformTimerRandom: 1.5,
    lootTimerBase: 0.65,
    lootTimerRandom: 0.7,
    resumeInvulnerabilitySeconds: 4,
    shieldBreakInvulnerabilitySeconds: 1.2
  },
  economy: {
    panelWhPerMinuteFactor: 0.012,
    inverterWhPerMinuteFactor: 0.0012,
    defaultKwhPrice: 0.30
  },
  catalog: {
    assetFolders: {
      inverters: "assets/itens/inversores",
      panels: "assets/itens/paineis",
      batteries: "assets/itens/baterias",
      characters: "assets/personagens",
      tools: "assets/itens/ferramentas"
    },
    rarityOrder: ["comum", "colecionável", "raro", "épico"],
    panelRangeWp: [100, 200, 300, 450, 550, 700],
    batteryRangeAh: [100, 200, 300, 400, 500]
  },
  adminSchema: {
    futureFirestoreCollection: "games/solano/config",
    editableGroups: ["runner", "economy", "missions", "lootTable", "texts", "visual", "shop", "characters", "tools", "panels", "batteries", "inverters", "affiliatePopups", "assets"],
    safeRule: "O painel deve alterar configuração, nunca substituir game.js.",
    localAdminKey: "solano_game_admin_config_v1",
    futureStorage: "Firebase Storage para uploads; Imgur/URL direta como solução prática inicial."
  }
};
