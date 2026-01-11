const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  const dir = path.join(__dirname, "../systems");

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const system = require(path.join(dir, file));
    client.systems.set(system.name, system);
    if (system.init) system.init(client);
  }

  console.log("✅ Systems loaded");
};
