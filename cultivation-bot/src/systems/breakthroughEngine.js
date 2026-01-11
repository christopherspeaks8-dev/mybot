const datastore = require("../core/datastore");
const { SpiritRootEngine } = require("./spiritRootEngine");
const { IntegratedTechniqueEngine } = require("./integratedTechniqueEngine");
const { REALMS } = require("./tribulationEngine"); // Six realms I-IX

/* ======================================================
   DEFAULT USER BREAKTHROUGH DATA
====================================================== */

const DEFAULT_USER_CULTIVATION = {
  qi: 0,            // Current Qi stored
  maxQi: 0,         // Qi required for next breakthrough
  realmIndex: 0,    // Realm index in REALMS
  level: 1          // Level I → IX
};

/* ======================================================
   BREAKTHROUGH ENGINE
====================================================== */

const BreakthroughEngine = {

  name: "breakthroughEngine",

  init() {
    console.log("🛡️ Breakthrough Engine Loaded");
  },

  getUserCultivation(userId) {
    const user = datastore.get("users", userId, {});
    if (!user.cultivation) user.cultivation = structuredClone(DEFAULT_USER_CULTIVATION);
    return user.cultivation;
  },

  /* ---------------- CALCULATE QI REQUIRED ---------------- */

  calculateQiRequirement(realmIndex, level) {
    const realm = REALMS[realmIndex];
    const qiRequired = Math.floor(realm.qiBase * Math.pow(realm.qiGrowth, level - 1));
    return qiRequired;
  },

  /* ---------------- ATTEMPT BREAKTHROUGH ---------------- */

  attemptBreakthrough(userId, realmIndex, level) {
    const user = datastore.get("users", userId, {});
    const cult = this.getUserCultivation(userId);
    const userRoot = SpiritRootEngine.getUserRoot(userId);

    // Calculate Qi needed
    const qiRequired = this.calculateQiRequirement(realmIndex, level);
    cult.maxQi = qiRequired;

    // Spirit root influence: higher affinity reduces effective Qi needed
    const effectiveQiRequired = Math.floor(qiRequired / userRoot.affinity);

    if (cult.qi < effectiveQiRequired) {
      return { success: false, message: `Insufficient Qi for breakthrough. Needed ${effectiveQiRequired}, you have ${cult.qi}.` };
    }

    // Technique influence: passives can boost breakthrough
    IntegratedTechniqueEngine.applyPassives(userId);

    // Consume Qi
    cult.qi -= effectiveQiRequired;

    // Level advancement
    if (level < 9) {
      cult.level = level + 1;
    } else {
      // Max level reached, advance to next realm
      if (realmIndex < REALMS.length - 1) {
        cult.level = 1;
        cult.realmIndex = realmIndex + 1;
      }
    }

    datastore.set("users", userId, user);

    return {
      success: true,
      message: level < 9
        ? `Breakthrough successful! You advanced to ${REALMS[realmIndex].name} ${cult.level}!`
        : `Breakthrough successful! You advanced to ${REALMS[cult.realmIndex].name} ${cult.level}!`
    };
  },

  /* ---------------- ADD QI ---------------- */

  addQi(userId, amount) {
    const cult = this.getUserCultivation(userId);
    cult.qi += amount;
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, newQi: cult.qi };
  },

  /* ---------------- GET CULTIVATION STATUS ---------------- */

  getCultivationStatus(userId) {
    const cult = this.getUserCultivation(userId);
    const currentRealm = REALMS[cult.realmIndex];
    const qiRequired = this.calculateQiRequirement(cult.realmIndex, cult.level);
    return {
      realm: currentRealm.name,
      level: cult.level,
      qi: cult.qi,
      qiRequired: qiRequired,
    };
  }
};

module.exports = { BreakthroughEngine };
