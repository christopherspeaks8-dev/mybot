const { Client, GatewayIntentBits, Collection } = require("discord.js");

module.exports = () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });

  client.commands = {
    prefix: new Collection(),
    slash: new Collection()
  };

  client.systems = new Collection();
  client.cooldowns = new Collection();

  return client;
};
