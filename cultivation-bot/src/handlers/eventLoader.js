const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  const dir = path.join(__dirname, "../events");

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const event = require(path.join(dir, file));
    client.on(event.name, (...args) => event.execute(client, ...args));
  }

  console.log("✅ Events loaded");
};
