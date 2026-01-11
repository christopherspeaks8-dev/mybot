const datastore = require("../core/datastore");

/* ======================================================
   DEFAULT USER BALANCE
====================================================== */

const DEFAULT_USER_BALANCE = {
  coins: 1000 // Starting in-game currency for new players
};

/* ======================================================
   MONEY ENGINE
====================================================== */

const MoneyEngine = {
  name: "moneyEngine",

  init() {
    console.log("💰 Money Engine Loaded");
  },

  getBalance(userId) {
    const user = datastore.get("users", userId, {});
    if (!user.money) user.money = structuredClone(DEFAULT_USER_BALANCE);
    return user.money.coins;
  },

  addCoins(userId, amount) {
    const user = datastore.get("users", userId, {});
    if (!user.money) user.money = structuredClone(DEFAULT_USER_BALANCE);
    user.money.coins += amount;
    datastore.set("users", userId, user);
    return { success: true, newBalance: user.money.coins };
  },

  removeCoins(userId, amount) {
    const user = datastore.get("users", userId, {});
    if (!user.money) user.money = structuredClone(DEFAULT_USER_BALANCE);
    if (user.money.coins < amount) return { success: false, message: "Not enough coins." };
    user.money.coins -= amount;
    datastore.set("users", userId, user);
    return { success: true, newBalance: user.money.coins };
  },

  transferCoins(fromUserId, toUserId, amount) {
    const removeResult = this.removeCoins(fromUserId, amount);
    if (!removeResult.success) return removeResult;
    this.addCoins(toUserId, amount);
    return { success: true, message: `Transferred ${amount} coins to ${toUserId}.` };
  }
};

module.exports = { MoneyEngine };
