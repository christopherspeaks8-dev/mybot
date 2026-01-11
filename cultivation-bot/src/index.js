const createClient = require("./bot");
const config = require("./config/config");

const loadCommands = require("./handlers/commandLoader");
const loadEvents = require("./handlers/eventLoader");
const loadSystems = require("./handlers/systemLoader");
const scheduler = require("./core/scheduler");

const client = createClient();

(async () => {
  try {
    await loadSystems(client);
    await loadCommands(client);
    await loadEvents(client);

    scheduler.start(client);

    await client.login(config.token);
  } catch (err) {
    console.error("FATAL STARTUP ERROR:", err);
    process.exit(1);
  }
})();
