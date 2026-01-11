const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  const base = path.join(__dirname, "../commands");

  for (const type of ["prefix", "slash"]) {
    const dir = path.join(base, type);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      const cmd = require(path.join(dir, file));
      client.commands[type].set(cmd.name, cmd);
    }
  }

  console.log("✅ Commands loaded");
};
