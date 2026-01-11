const datastore = require("../core/datastore");

/* ======================================================
   REALM DEFINITIONS (ALL I–IX)
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
   DEFAULT USER STATE
====================================================== */

const DEFAULT_USER = {
  realmIndex: 0,
  level: 1, // I–IX

  qi: 0,
  maxQi: 120,

  cultivationSpeed: 1.0,
  foundation: 1.0,        // base stability
  daoComprehension: 1.0,  // late-game importance

  qiDensity: 1.0,         // affects Qi gain & cap
  meridians: 1.0,         // limits flow (bottlenecks)

  deviationRisk: 0,       // Qi deviation chance
  tribulationPrep: 0,     // reduces future tribulation difficulty

  lastCultivate: Date.now()
};

/* ======================================================
   HELPERS
====================================================== */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function realmData(i) {
  return REALMS[i];
}

function qiRequired(realmIndex, level, qiDensity) {
  const realm = realmData(realmIndex);
  return Math.floor(
    realm.qiBase *
    Math.pow(realm.qiGrowth, level - 1) *
    qiDensity
  );
}

/* ======================================================
   CULTIVATION ENGINE
====================================================== */

const CultivationEngine = {
  name: "cultivation",

  init() {
    console.log("🌌 Cultivation Online–Grade Engine Loaded");
  },

  /* ---------------- USER DATA ---------------- */

  getUser(userId) {
    return datastore.get(
      "users",
      userId,
      structuredClone(DEFAULT_USER)
    );
  },

  saveUser(userId, data) {
    datastore.set("users", userId, data);
  },

  /* ---------------- CULTIVATION ---------------- */

  cultivate(userId) {
    const user = this.getUser(userId);
    const now = Date.now();

    const elapsed = Math.floor((now - user.lastCultivate) / 1000);
    user.lastCultivate = now;

    const realm = realmData(user.realmIndex);

    // Offline scaling (Cultivation Online–style soft cap)
    const offlineFactor = clamp(Math.log10(elapsed + 10), 1, 5);

    // Realm pressure slows cultivation at higher realms
    const pressurePenalty = 1 / realm.pressure;

    // Bottleneck if meridians are weak
    const meridianLimit = clamp(user.meridians, 0.3, 1.2);

    const baseGain =
      (25 + user.level * 8) *
      user.cultivationSpeed *
      user.daoComprehension *
      pressurePenalty *
      meridianLimit;

    const gainedQi = Math.floor(baseGain * offlineFactor);

    user.maxQi = qiRequired(
      user.realmIndex,
      user.level,
      user.qiDensity
    );

    user.qi = clamp(user.qi + gainedQi, 0, user.maxQi);

    // Qi deviation buildup if pushing too hard
    if (user.qi >= user.maxQi * 0.95) {
      user.deviationRisk += 0.01 * realm.pressure;
    }

    this.saveUser(userId, user);
    return { gainedQi, elapsed };
  },

  /* ---------------- BREAKTHROUGH ---------------- */

  canBreakthrough(userId) {
    const user = this.getUser(userId);
    return user.qi >= user.maxQi;
  },

  breakthrough(userId) {
    const user = this.getUser(userId);
    const realm = realmData(user.realmIndex);

    if (!this.canBreakthrough(userId)) {
      return { success: false, reason: "NOT_FULL_QI" };
    }

    const minor = user.level < 9;

    let chance =
      (minor ? 0.9 : 0.35) *
      user.foundation *
      user.daoComprehension *
      (1 - user.deviationRisk);

    chance -= realm.pressure * 0.05;
    chance = clamp(chance, 0.02, 0.95);

    const roll = Math.random();

    if (roll <= chance) {
      // SUCCESS
      user.qi = 0;
      user.deviationRisk = clamp(user.deviationRisk - 0.1, 0, 1);
      user.foundation += minor ? 0.03 : 0.08;
      user.qiDensity += minor ? 0.02 : 0.05;
      user.meridians += minor ? 0.01 : 0.04;

      if (minor) {
        user.level++;
      } else {
        // Major realm breakthrough
        user.realmIndex++;
        user.level = 1;
        user.tribulationPrep += 1;
      }

      user.maxQi = qiRequired(
        user.realmIndex,
        user.level,
        user.qiDensity
      );

      this.saveUser(userId, user);
      return { success: true, chance };
    }

    // FAILURE (Cultivation Online accurate penalties)
    user.qi = Math.floor(user.qi * 0.5);
    user.deviationRisk = clamp(user.deviationRisk + 0.15, 0, 1);
    user.foundation = clamp(user.foundation - 0.07, 0.4, 3.0);

    this.saveUser(userId, user);
    return { success: false, chance };
  },

  /* ---------------- STATUS ---------------- */

  getStatus(userId) {
    const user = this.getUser(userId);
    const realm = realmData(user.realmIndex);

    return {
      realm: realm.name,
      level: `Level ${user.level} / IX`,
      qi: user.qi,
      maxQi: user.maxQi,
      foundation: user.foundation.toFixed(2),
      dao: user.daoComprehension.toFixed(2),
      qiDensity: user.qiDensity.toFixed(2),
      meridians: user.meridians.toFixed(2),
      deviationRisk: user.deviationRisk.toFixed(2),
      tribulationPrep: user.tribulationPrep
    };
  },

  /* ---------------- MODIFIER HOOK ---------------- */

  applyModifier(userId, fn) {
    const user = this.getUser(userId);
    fn(user);
    this.saveUser(userId, user);
  }
};

module.exports = CultivationEngine;
