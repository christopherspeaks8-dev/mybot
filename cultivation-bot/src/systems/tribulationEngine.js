const datastore = require("../core/datastore");
const { SpiritRootEngine } = require("./spiritRootEngine");
const { BreakthroughEngine } = require("./breakthroughEngine"); // Will handle breakthroughs
const { IntegratedTechniqueEngine } = require("./integratedTechniqueEngine");

/* ======================================================
   REALMS DATA
====================================================== */

const REALMS = [
  { name: "Qi Refining", qiBase: 120, qiGrowth: 1.28, pressure: 1.0 },
  { name: "Foundation Establishment", qiBase: 2800, qiGrowth: 1.35, pressure: 1.15 },
  { name: "Core Formation", qiBase: 22000, qiGrowth: 1.45, pressure: 1.3 },
  { name: "Nascent Soul", qiBase: 150000, qiGrowth: 1.6, pressure: 1.5 },
  { name: "Soul Ascension", qiBase: 900000, qiGrowth: 1.8, pressure: 1.75 },
  { name: "Immortal Ascension", qiBase: 6000000, qiGrowth: 2.0, pressure: 2.0 }
];

/* ======================================================
   DEFAULT USER TRIBULATION DATA
====================================================== */

const DEFAULT_USER_TRIBULATION = {
  realmIndex: 0,       // Index in REALMS array
  level: 1,            // Level I → IX
  deviationRisk: 0,    // Accumulated deviation risk (0-100%)
  lastTribulation: null // Timestamp of last tribulation
};

/* ======================================================
   TRIBULATION ENGINE
====================================================== */

const TribulationEngine = {

  name: "tribulationEngine",

  init() {
    console.log("⚡ Tribulation Engine Loaded (6 Realm System)");
  },

  getUserTribulation(userId) {
    const user = datastore.get("users", userId, {});
    if (!user.tribulation) user.tribulation = structuredClone(DEFAULT_USER_TRIBULATION);
    return user.tribulation;
  },

  /* ---------------- TRIBULATION ATTEMPT ---------------- */

  attemptTribulation(userId) {
    const user = datastore.get("users", userId, {});
    const trib = this.getUserTribulation(userId);
    const userRoot = SpiritRootEngine.getUserRoot(userId);

    const currentRealm = REALMS[trib.realmIndex];

    // Base chance depends on realm pressure and level
    let baseChance = 0.6 - ((trib.level - 1) * 0.05); // Level I easier, IX harder
    baseChance /= currentRealm.pressure; // Higher realm pressure lowers chance

    // Spirit root bonus
    const rootBonus = 0.1 * userRoot.affinity;

    // Passive technique bonus
    IntegratedTechniqueEngine.applyPassives(userId);

    const successChance = Math.min(Math.max(baseChance + rootBonus, 0.05), 0.95); // Clamp 5% → 95%
    const roll = Math.random();

    if (roll < successChance) {
      // Success → call Breakthrough Engine
      const breakthroughResult = BreakthroughEngine.attemptBreakthrough(userId, trib.realmIndex, trib.level);

      trib.lastTribulation = Date.now();
      datastore.set("users", userId, user);

      return {
        success: true,
        message: `Tribulation successful! ${breakthroughResult.message}`,
        breakthrough: breakthroughResult
      };
    } else {
      // Failure → increase deviation
      trib.deviationRisk += 0.02 + Math.random() * 0.03; // 2-5%
      if (trib.deviationRisk > 1) {
        trib.deviationRisk = 0;
        trib.level = Math.max(1, trib.level - 1); // Penalty: drop a level
      }
      trib.lastTribulation = Date.now();
      datastore.set("users", userId, user);

      return {
        success: false,
        message: trib.deviationRisk >= 1
          ? `Tribulation failed catastrophically! You dropped a level.`
          : `Tribulation failed. Deviation risk increased to ${(trib.deviationRisk * 100).toFixed(2)}%.`
      };
    }
  },

  getTribulationStatus(userId) {
    const trib = this.getUserTribulation(userId);
    const currentRealm = REALMS[trib.realmIndex];
    return {
      realm: currentRealm.name,
      level: trib.level,
      deviationRisk: (trib.deviationRisk * 100).toFixed(2) + "%",
      lastTribulation: trib.lastTribulation ? new Date(trib.lastTribulation).toLocaleString() : "Never"
    };
  },

  resetTribulation(userId) {
    const trib = this.getUserTribulation(userId);
    trib.realmIndex = 0;
    trib.level = 1;
    trib.deviationRisk = 0;
    trib.lastTribulation = null;
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true };
  }
};

module.exports = { TribulationEngine, REALMS };
