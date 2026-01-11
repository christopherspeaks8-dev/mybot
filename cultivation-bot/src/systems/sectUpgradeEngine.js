const datastore = require("../core/datastore");
const { SectVaultEngine } = require("./sectVaultEngine");

/* ======================================================
   DEFAULT UPGRADES
====================================================== */

const DEFAULT_UPGRADES = [
  {
    name: "Vault Expansion",
    description: "Increases vault capacity by 50,000 coins/Qi.",
    cost: 5000,
    apply: (sect) => {
      sect.vault.capacity += 50000;
    }
  },
  {
    name: "Advanced Shop",
    description: "Unlocks special shop items for the sect.",
    cost: 8000,
    apply: (sect) => {
      sect.upgrades.push({ unlockedShopItems: true });
    }
  },
  {
    name: "Contribution Boost",
    description: "Members’ coin deposits count 1.5x toward sect upgrades.",
    cost: 12000,
    apply: (sect) => {
      sect.upgrades.push({ contributionMultiplier: 1.5 });
    }
  },
  {
    name: "Quest Reward Boost",
    description: "Quests give extra Qi and rare items.",
    cost: 15000,
    apply: (sect) => {
      sect.upgrades.push({ questRewardMultiplier: 1.5 });
    }
  },
  {
    name: "Elite Training Grounds",
    description: "Increases Qi gain for tribulations & breakthroughs (passive).",
    cost: 20000,
    apply: (sect) => {
      sect.upgrades.push({ eliteTraining: true });
    }
  }
];

/* ======================================================
   SECT UPGRADE ENGINE
====================================================== */

const SectUpgradeEngine = {

  name: "sectUpgradeEngine",

  init() {
    console.log("⚡ Sect Upgrade Engine Loaded");
  },

  getAvailableUpgrades() {
    return DEFAULT_UPGRADES;
  },

  purchaseUpgrade(sectId, leaderId, upgradeName) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return { success: false, message: "Sect not found." };
    if (sect.leader !== leaderId) return { success: false, message: "Only the Leader can purchase upgrades." };
    if (!sect.vault) sect.vault = SectVaultEngine.getVault(sectId);

    const upgrade = DEFAULT_UPGRADES.find(u => u.name === upgradeName);
    if (!upgrade) return { success: false, message: "Upgrade not found." };
    if (sect.vault.coins < upgrade.cost) return { success: false, message: "Not enough coins in vault." };

    // Deduct coins
    sect.vault.coins -= upgrade.cost;

    // Apply upgrade effect
    upgrade.apply(sect);

    // Log upgrade purchase
    if (!sect.upgrades) sect.upgrades = [];
    sect.upgrades.push({ name: upgrade.name, timestamp: Date.now() });

    // History
    if (!sect.vault.history) sect.vault.history = [];
    sect.vault.history.push({
      type: "upgradePurchase",
      user: leaderId,
      upgrade: upgrade.name,
      cost: upgrade.cost,
      timestamp: Date.now()
    });

    datastore.set("sects", sectId, sect);
    return { success: true, message: `Upgrade "${upgradeName}" purchased successfully.` };
  },

  getSectUpgrades(sectId) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return [];
    return sect.upgrades || [];
  }
};

module.exports = { SectUpgradeEngine };
