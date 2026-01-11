require("dotenv").config();

module.exports = {
  token: process.env.BOT_TOKEN,
  prefix: "!",
  autosaveInterval: 60_000
};
