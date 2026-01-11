const datastore = require("../core/datastore");

/* ======================================================
   DEFAULT VAULT
====================================================== */

const DEFAULT_VAULT = {
  coins: 0,
  qi: 0,
  items: [],
  capacity: 100000, // max Qi or coins
  history: []
};

/* ======================================================
   SECT VAULT ENGINE
====================================================== */

const SectVaultEngine = {

  name: "sectVaultEngine",

  init() {
    console.log("🏦 Sect Vault Engine Loaded");
  },

  /* ---------------- GET VAULT ---------------- */
  getVault(sectId) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return null;
    if (!sect.vault) sect.vault = structuredClone(DEFAULT_VAULT);
    return sect.vault;
  },

  /* ---------------- DEPOSIT ---------------- */
  deposit(sectId, userId, coins = 0, qi = 0, item = null) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return { success: false, message: "Sect not found." };
    if (!sect.vault) sect.vault = structuredClone(DEFAULT_VAULT);

    const vault = sect.vault;

    // Capacity check for coins + Qi
    const totalResources = vault.coins + vault.qi + coins + qi;
    if (totalResources > vault.capacity) return { success: false, message: "Vault capacity exceeded." };

    // Deposit coins and Qi
    vault.coins += coins;
    vault.qi += qi;

    // Deposit item if provided
    if (item) vault.items.push({ owner: userId, item });

    // Log transaction
    vault.history.push({
      type: "deposit",
      user: userId,
      coins,
      qi,
      item,
      timestamp: Date.now()
    });

    datastore.set("sects", sectId, sect);
    return { success: true, vault };
  },

  /* ---------------- WITHDRAW ---------------- */
  withdraw(sectId, userId, coins = 0, qi = 0, itemName = null) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return { success: false, message: "Sect not found." };
    if (!sect.vault) sect.vault = structuredClone(DEFAULT_VAULT);
    const vault = sect.vault;

    // Permissions: only Leader can withdraw coins/Qi
    if (sect.leader !== userId) return { success: false, message: "Only the Leader can withdraw from the vault." };

    if (coins > vault.coins) return { success: false, message: "Not enough coins in vault." };
    if (qi > vault.qi) return { success: false, message: "Not enough Qi in vault." };

    vault.coins -= coins;
    vault.qi -= qi;

    // Withdraw item if provided
    let withdrawnItem = null;
    if (itemName) {
      const index = vault.items.findIndex(i => i.item === itemName);
      if (index === -1) return { success: false, message: "Item not found in vault." };
      withdrawnItem = vault.items.splice(index, 1)[0];
    }

    // Log transaction
    vault.history.push({
      type: "withdraw",
      user: userId,
      coins,
      qi,
      item: withdrawnItem ? withdrawnItem.item : null,
      timestamp: Date.now()
    });

    datastore.set("sects", sectId, sect);
    return { success: true, vault };
  },

  /* ---------------- VAULT HISTORY ---------------- */
  getHistory(sectId) {
    const vault = this.getVault(sectId);
    if (!vault) return [];
    return vault.history.sort((a, b) => b.timestamp - a.timestamp);
  },

  /* ---------------- SET VAULT CAPACITY ---------------- */
  setCapacity(sectId, leaderId, newCapacity) {
    const sect = datastore.get("sects", sectId);
    if (!sect) return { success: false, message: "Sect not found." };
    if (sect.leader !== leaderId) return { success: false, message: "Only Leader can set vault capacity." };
    if (!sect.vault) sect.vault = structuredClone(DEFAULT_VAULT);

    sect.vault.capacity = newCapacity;
    datastore.set("sects", sectId, sect);
    return { success: true, message: `Vault capacity set to ${newCapacity}.` };
  }
};

module.exports = { SectVaultEngine };
