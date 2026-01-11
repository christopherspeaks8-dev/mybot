const config = require("../config/config");
const datastore = require("./datastore");

module.exports = {
  start() {
    setInterval(() => {
      datastore.saveAll();
      console.log("💾 Autosave complete");
    }, config.autosaveInterval);
  }
};
