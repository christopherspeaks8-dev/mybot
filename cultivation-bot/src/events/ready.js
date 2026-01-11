module.exports = {
  name: "ready",
  execute(client) {
    console.log(`🧘 ${client.user.tag} ONLINE`);
    client.user.setActivity("Cultivating the Dao", { type: 0 });
  }
};
