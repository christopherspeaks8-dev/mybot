const datastore = require("../core/datastore");

/* ======================================================
   SPIRIT ROOTS DEFINITIONS
====================================================== */

const SPIRIT_ROOTS = {
  // Common
  Fire: { rarity: "common", description: "Qi acceleration and offensive techniques" },
  Water: { rarity: "common", description: "Recovery and Qi regeneration" },
  Wood: { rarity: "common", description: "Meridian expansion and steady cultivation" },
  Earth: { rarity: "common", description: "Foundation stability and breakthrough boost" },
  Metal: { rarity: "common", description: "Defense and breakthrough chance" },
  Wind: { rarity: "common", description: "Speed of cultivation, movement techniques" },

  // Rare
  Lightning: { rarity: "rare", description: "Qi surges, temporary cultivation bursts" },
  Ice: { rarity: "rare", description: "Slows tribulations, improves mental clarity" },
  Poison: { rarity: "rare", description: "Boosts offensive Qi techniques" },
  Shadow: { rarity: "rare", description: "Increases deviation resistance" },
  Light: { rarity: "rare", description: "Improves Dao comprehension" },
  Gravity: { rarity: "rare", description: "Strengthens meridians under pressure" },

  // Extremely Rare
  Space: { rarity: "extreme", description: "Bypasses bottlenecks, alters Qi density" },
  Time: { rarity: "extreme", description: "Alters cultivation efficiency, slows/accelerates offline gains" },
  Void: { rarity: "extreme", description: "Controls empty space, reduces tribulation damage" },
  Storm: { rarity: "extreme", description: "Enhances environmental cultivation effects" },
  FlameIce: { rarity: "extreme", description: "Hybrid Fire & Ice effects" },
  ThunderMetal: { rarity: "extreme", description: "Hybrid, accelerates Qi flow dramatically" },

  // Legendary
  Eternal: { rarity: "legendary", description: "Boosts all aspects of cultivation" },
  Celestial: { rarity: "legendary", description: "Manipulate star Qi" },
  Dragon: { rarity: "legendary", description: "Enhances physical & spiritual power" },
  Phoenix: { rarity: "legendary", description: "Regeneration and Qi reincarnation" },
  Chaos: { rarity: "legendary", description: "Alters probability for breakthroughs, extremely unstable" }
};

/* ======================================================
   DEFAULT USER ROOT DATA
====================================================== */

const DEFAULT_USER_ROOT = {
  root: null,               // The main spirit root
  affinity: 1.0,            // Modifier for Qi gain, breakthrough
  mastery: 1,               // Mastery level of the root (1-100)
  potential: 1.0,           // Scaling for rare roots
  secondaryRoots: []        // Optional extra roots for hybrids
};

/* ======================================================
   ROOT WEIGHTS FOR RANDOM ASSIGNMENT
====================================================== */

const ROOT_WEIGHTS = {
  common: 60,    // 60% chance
  rare: 25,      // 25% chance
  extreme: 10,   // 10% chance
  legendary: 5   // 5% chance
};

/* ======================================================
   SPIRIT ROOT ENGINE
====================================================== */

const SpiritRootEngine = {
  name: "spiritRoots",

  init() {
    console.log("🌱 Advanced Spirit Root Engine Loaded");
  },

  getUserRoot(userId) {
    const user = datastore.get("users", userId, {});
    if (!user.spiritRoot) user.spiritRoot = structuredClone(DEFAULT_USER_ROOT);
    return user.spiritRoot;
  },

  /* ---------------- RANDOM ROOT ASSIGNMENT ---------------- */

  assignRandomRoot(userId) {
    const userRoot = this.getUserRoot(userId);
    if (userRoot.root) return { success: false, reason: "User already has a primary root." };

    // Weighted selection
    const allRoots = Object.entries(SPIRIT_ROOTS);
    const weightedRoots = [];

    for (const [name, info] of allRoots) {
      const weight = ROOT_WEIGHTS[info.rarity] || 1;
      for (let i = 0; i < weight; i++) weightedRoots.push(name);
    }

    const randomRoot = weightedRoots[Math.floor(Math.random() * weightedRoots.length)];
    userRoot.root = randomRoot;
    userRoot.affinity = 1.0;
    userRoot.mastery = 1;
    userRoot.potential = this.calculatePotential(randomRoot);
    userRoot.secondaryRoots = [];

    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, root: randomRoot, potential: userRoot.potential };
  },

  /* ---------------- MANUAL ROOT ASSIGNMENT ---------------- */

  assignRoot(userId, rootName) {
    const userRoot = this.getUserRoot(userId);
    if (!SPIRIT_ROOTS[rootName]) return { success: false, reason: "Root does not exist." };
    if (userRoot.root) return { success: false, reason: "User already has a primary root." };

    userRoot.root = rootName;
    userRoot.affinity = 1.0;
    userRoot.mastery = 1;
    userRoot.potential = this.calculatePotential(rootName);
    userRoot.secondaryRoots = [];

    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, root: rootName, potential: userRoot.potential };
  },

  /* ---------------- SECONDARY ROOTS ---------------- */

  assignSecondaryRoot(userId, rootName) {
    const userRoot = this.getUserRoot(userId);
    if (!SPIRIT_ROOTS[rootName]) return { success: false, reason: "Root does not exist." };
    if (userRoot.secondaryRoots.includes(rootName)) return { success: false, reason: "Secondary root already assigned." };
    if (SPIRIT_ROOTS[rootName].rarity === "legendary") return { success: false, reason: "Cannot assign legendary as secondary root." };

    userRoot.secondaryRoots.push(rootName);
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, secondaryRoots: userRoot.secondaryRoots };
  },

  /* ---------------- AFFINITY & MASTERY ---------------- */

  improveAffinity(userId, amount = 0.01) {
    const userRoot = this.getUserRoot(userId);
    userRoot.affinity = Math.min(userRoot.affinity + amount, 2.0);
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, newAffinity: userRoot.affinity };
  },

  improveMastery(userId, amount = 1) {
    const userRoot = this.getUserRoot(userId);
    userRoot.mastery = Math.min(userRoot.mastery + amount, 100);
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true, newMastery: userRoot.mastery };
  },

  calculatePotential(rootName) {
    const rarity = SPIRIT_ROOTS[rootName].rarity;
    switch (rarity) {
      case "common": return 1.0;
      case "rare": return 1.2;
      case "extreme": return 1.5;
      case "legendary": return 2.0;
      default: return 1.0;
    }
  },

  /* ---------------- STATUS & UTILITY ---------------- */

  getRootStatus(userId) {
    const userRoot = this.getUserRoot(userId);
    return {
      root: userRoot.root,
      affinity: userRoot.affinity.toFixed(2),
      mastery: userRoot.mastery,
      potential: userRoot.potential,
      secondaryRoots: userRoot.secondaryRoots
    };
  },

  isRootCompatible(userId, rootName) {
    const userRoot = this.getUserRoot(userId);
    return userRoot.root === rootName || userRoot.secondaryRoots.includes(rootName);
  },

  listAvailableRoots(rarityFilter = null) {
    const list = [];
    for (const root in SPIRIT_ROOTS) {
      if (!rarityFilter || SPIRIT_ROOTS[root].rarity === rarityFilter) list.push(root);
    }
    return list;
  },

  randomRoot(rarityFilter = null) {
    const roots = this.listAvailableRoots(rarityFilter);
    if (roots.length === 0) return null;
    return roots[Math.floor(Math.random() * roots.length)];
  },

  removeRoot(userId) {
    const userRoot = this.getUserRoot(userId);
    userRoot.root = null;
    userRoot.secondaryRoots = [];
    userRoot.affinity = 1.0;
    userRoot.mastery = 1;
    userRoot.potential = 1.0;
    datastore.set("users", userId, datastore.get("users", userId));
    return { success: true };
  }
};

module.exports = { SpiritRootEngine, SPIRIT_ROOTS };
