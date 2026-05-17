(function () {
  const PROFILE_STORAGE_KEY = "pense_offgrid_profile_v1";

  function now() {
    return Date.now();
  }

  function createDefaultProfile() {
    const t = now();
    return {
      version: 2,
      player: {
        id: null,
        name: "",
        createdAt: t,
        lastSeenAt: t
      },
      shared: {
        solarTokens: 0,
        unlockedBadges: [],
        unlockedSkins: [],
        pendingRewards: {
          simulator: [],
          solano: []
        },
        stats: {
          totalPlayTimeSec: 0,
          sessions: 0
        }
      },
      simulator: {
        watts: 0,
        wps: 0,
        baseClickValue: 1,
        clickUpgrades: 0,
        clickUpgradeCost: 50,
        systemHealth: 100,
        prestigeSeals: 0,
        items: [],
        bestWatts: 0,
        bestWps: 0,
        level: 1,
        xp: 0,
        medals: [],
        titles: []
      },
      solano: {
        bestScore: 0,
        bestDistance: 0,
        bestStage: 0,
        totalRuns: 0,
        totalDeaths: 0,
        unlockedPerks: [],
        unlockedCharacters: [],
        medals: [],
        titles: []
      },
      systems: {
        missions: {
          slots: [null, null, null],
          completedHistory: [],
          lastRefreshAt: t
        },
        ranking: {
          score: 0,
          activityScore: 0,
          resetCount: 0,
          lastScoreResetAt: null,
          explanationSeen: false
        }
      },
      meta: {
        saveSlot: "local",
        updatedAt: t,
        checksum: ""
      }
    };
  }


  function ensureSystemBlocks(profile) {
    if (!profile.systems || typeof profile.systems !== "object") {
      profile.systems = {};
    }

    if (!profile.systems.missions || typeof profile.systems.missions !== "object") {
      profile.systems.missions = {
        slots: [null, null, null],
        completedHistory: [],
        lastRefreshAt: now()
      };
    }

    if (!Array.isArray(profile.systems.missions.slots)) {
      profile.systems.missions.slots = [null, null, null];
    }

    while (profile.systems.missions.slots.length < 3) {
      profile.systems.missions.slots.push(null);
    }

    profile.systems.missions.slots = profile.systems.missions.slots.slice(0, 3);

    if (!Array.isArray(profile.systems.missions.completedHistory)) {
      profile.systems.missions.completedHistory = [];
    }

    if (!profile.systems.ranking || typeof profile.systems.ranking !== "object") {
      profile.systems.ranking = {
        score: 0,
        activityScore: 0,
        resetCount: 0,
        lastScoreResetAt: null,
        explanationSeen: false
      };
    }

    profile.systems.ranking.score = Number(profile.systems.ranking.score) || 0;
    profile.systems.ranking.activityScore = Number(profile.systems.ranking.activityScore) || 0;
    profile.systems.ranking.resetCount = Number(profile.systems.ranking.resetCount) || 0;

    return profile;
  }

  function migrateProfile(profile) {
    const migrated = profile && typeof profile === "object" ? profile : createDefaultProfile();

    if (!migrated.version || migrated.version < 1) {
      migrated.version = 1;
    }

    if (migrated.version < 2) {
      ensureSystemBlocks(migrated);
      migrated.version = 2;
    } else {
      ensureSystemBlocks(migrated);
    }

    return migrated;
  }

  function validateProfile(profile) {
    return !!(
      profile &&
      typeof profile === "object" &&
      profile.version &&
      profile.player &&
      profile.shared &&
      profile.simulator &&
      profile.solano &&
      profile.meta
    );
  }

  function getProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);

      if (!raw) {
        const fresh = createDefaultProfile();
        saveProfile(fresh);
        return fresh;
      }

      const parsed = migrateProfile(JSON.parse(raw));

      if (!validateProfile(parsed)) {
        const fresh = createDefaultProfile();
        saveProfile(fresh);
        return fresh;
      }

      return parsed;
    } catch (error) {
      console.error("Erro ao carregar profile:", error);
      const fresh = createDefaultProfile();
      saveProfile(fresh);
      return fresh;
    }
  }

  function saveProfile(profile) {
    const t = now();
    profile.player.lastSeenAt = t;
    profile.meta.updatedAt = t;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }

  function updateProfile(mutatorFn) {
    const profile = getProfile();
    mutatorFn(profile);
    return saveProfile(profile);
  }

  function exportProfile() {
    const profile = getProfile();
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `penseoffgrid-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProfileFromText(fileText) {
    const parsed = migrateProfile(JSON.parse(fileText));

    if (!validateProfile(parsed)) {
      throw new Error("Arquivo de backup inválido.");
    }

    saveProfile(parsed);
    return parsed;
  }

  function consumeRewards(gameKey) {
    const profile = getProfile();
    const rewards = Array.isArray(profile.shared.pendingRewards[gameKey])
      ? [...profile.shared.pendingRewards[gameKey]]
      : [];

    profile.shared.pendingRewards[gameKey] = [];
    saveProfile(profile);
    return rewards;
  }

  function queueReward(targetGameKey, reward) {
    const profile = getProfile();

    if (!profile.shared.pendingRewards[targetGameKey]) {
      profile.shared.pendingRewards[targetGameKey] = [];
    }

    profile.shared.pendingRewards[targetGameKey].push({
      id: reward.id || `reward_${Date.now()}`,
      source: reward.source || "unknown",
      type: reward.type || "generic",
      value: reward.value || 0,
      createdAt: reward.createdAt || Date.now()
    });

    saveProfile(profile);
  }

  window.ProfileStorage = {
    PROFILE_STORAGE_KEY,
    createDefaultProfile,
    validateProfile,
    migrateProfile,
    getProfile,
    saveProfile,
    updateProfile,
    exportProfile,
    importProfileFromText,
    consumeRewards,
    queueReward
  };
})();