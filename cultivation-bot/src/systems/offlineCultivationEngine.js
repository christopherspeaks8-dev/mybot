const datastore = require("../core/datastore");
const { SpiritRootEngine } = require("./spiritRootEngine");
const { BreakthroughEngine } = require("./breakthroughEngine");
const { TribulationEngine } = require("./tribulationEngine");
const { IntegratedTechniqueEngine } = require("./integratedTechniqueEngine");

/* ======================================================
   OFFLINE CULTIVATION ENGINE
====================================================== */

const OfflineCultivationEngine = {
  name: "offlineCultivation",

  init() {
    console.log("🌌 Offline Cultivation Engine Loaded");
  },

  /* ---------------- CALCULATE QI GAIN ---------------- */
  calculateQiGain(userId, hours = 1) {
    const user = datastore.get("users", userId, {});
    const cult = BreakthroughEngine.getUserCultivation(userId);
    const trib = TribulationEngine.getUserTribulation(userId);
    const userRoot = SpiritRootEngine.getUserRoot(userId);

    // Base Qi gain per hour depends on realm and level
    const realmData = TribulationEngine.REALMS[trib.realmIndex];
    const baseQi = realmData.qiBase * Math.pow(realmData.qiGrowth, trib.level - 1);

    // Root and mastery modifiers
    const rootMultiplier = userRoot.affinity * (1 + userRoot.mastery / 100);

    // Passive techniques boost Qi gain
    IntegratedTechniqueEngine.applyPassives(userId);

    const totalQi = Math.floor(baseQi * rootMultiplier * hours);

    return totalQi;
  },

  /* ---------------- APPLY OFFLINE QI ---------------- */
  applyOfflineQi(userId, hours = 1) {
    const user = datastore.get("users", userId, {});
    const qiGain = this.calculateQiGain(userId, hours);

    BreakthroughEngine.addQi(userId, qiGain);

    return { success: true, qiGained: qiGain, newQi: BreakthroughEngine.getCultivationStatus(userId).qi };
  },

  /* ---------------- AUTO TRIBULATION ---------------- */
  autoTribulate(userId) {
    const user = datastore.get("users", userId, {});
    const cultStatus = BreakthroughEngine.getCultivationStatus(userId);

    const trib = TribulationEngine.getUserTribulation(userId);

    // Attempt tribulation if Qi >= requirement
    const qiRequired = BreakthroughEngine.calculateQiRequirement(trib.realmIndex, trib.level);
    if (cultStatus.qi >= qiRequired) {
      return TribulationEngine.attemptTribulation(userId);
    } else {
      return { success: false, message: `Not enough Qi to tribulate. Need ${qiRequired}, have ${cultStatus.qi}.` };
    }
  },

  /* ---------------- OFFLINE SIMULATION ---------------- */
  simulateOffline(userId, hours = 1) {
    // Step 1: Add offline Qi
    const qiResult = this.applyOfflineQi(userId, hours);

    // Step 2: Auto-tribulate if possible
    const tribResult = this.autoTribulate(userId);

    return {
      success: true,
      hoursSimulated: hours,
      qiGained: qiResult.qiGained,
      qiNow: qiResult.newQi,
      tribulationResult: tribResult
    };
  }
};

module.exports = { OfflineCultivationEngine };
