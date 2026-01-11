const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { SpiritRootEngine } = require('../systems/spiritRootEngine');
const { datastore } = require('../core/datastore');
const { BreakthroughEngine } = require('../systems/breakthroughEngine');
const { IntegratedTechniqueEngine } = require('../systems/integratedTechniqueEngine');
const { MoneyEngine } = require('../systems/moneyEngine');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Begin your epic cultivation journey'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Check if user already started
    const existing = datastore.get("users", userId);
    if (existing && existing.started) {
      return interaction.reply({ content: "🀄 You have already begun your cultivation journey. Use /status to see your progress.", ephemeral: true });
    }

    // Channel Embed — cinematic message
    const channelEmbed = new EmbedBuilder()
      .setTitle("🌌 The Path of Immortality Awaits...")
      .setDescription(
        `Legends speak of a world where only those with courage and ambition may ascend beyond mortality.  
        🌠 Ancient sects rise and fall, techniques lost to time, and treasures hidden in the void.  

        You feel a tremor in your soul — a whisper of Qi, beckoning you.  
        Will you accept your destiny and step into a world of cultivation, danger, and eternal glory?`
      )
      .setColor(0x00FFFF)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Your journey begins the moment you click the button in your DMs." });

    await interaction.reply({ embeds: [channelEmbed] });

    // DM — cinematic multi-embed storytelling
    try {
      const dmIntro = await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚡ Awakening to the Cultivation World")
            .setDescription(
              `You awaken to a serene world. Mist drifts across mountains and rivers, Qi flowing through everything.  
              Your heart beats faster as a latent power within you stirs — the Spirit Root, hidden for eons, seeks a worthy host.  

              As you rise to your feet, the winds seem to whisper secrets of forgotten techniques and trials that will test your resolve.`
            )
            .setColor(0xAA00FF)
            .setFooter({ text: "✨ Every choice shapes your destiny." }),
          new EmbedBuilder()
            .setTitle("🌌 A World Full of Trials")
            .setDescription(
              `Rival sects, ancient tribulations, and the chaos of the mortal world await you.  
              You may stumble, fall, or rise to glory. The path is perilous, but the reward — immortality — is unparalleled.  

              Your Qi hums, resonating with the energies of the realm. Every step you take will determine your cultivation fate.`
            )
            .setColor(0xFFAA00)
            .setFooter({ text: "⚔️ Only the brave shall ascend." }),
          new EmbedBuilder()
            .setTitle("🌟 A Choice Must Be Made")
            .setDescription(
              `Do you dare to step onto the path of cultivation?  
              Accept your Spirit Root, embrace the tribulations, and seek mastery over Qi and techniques.  

              Or will you retreat, leaving this destiny unfulfilled?`
            )
            .setColor(0x00FFAA)
            .setFooter({ text: "💎 Click wisely." })
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('start_cultivation')
              .setLabel('🌱 Start Cultivation')
              .setStyle(ButtonStyle.Success)
              .setEmoji('🌟'),
            new ButtonBuilder()
              .setCustomId('decline_cultivation')
              .setLabel('🛑 Decline Fate')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('❌')
          )
        ]
      });

      // Collector for buttons
      const filter = i => i.user.id === userId;
      const collector = dmIntro.createMessageComponentCollector({ filter, time: 120000, max: 1 });

      collector.on('collect', async i => {
        if (i.customId === 'start_cultivation') {
          // Assign random Spirit Root
          const spiritRoot = SpiritRootEngine.assignRandomRoot(userId);

          // Initialize user stats and techniques
          BreakthroughEngine.initUserCultivation(userId);
          IntegratedTechniqueEngine.initUserTechniques(userId);
          MoneyEngine.addCoins(userId, 1000); // starter coins

          // Mark user as started
          const userData = datastore.get("users", userId, {});
          userData.started = true;
          userData.spiritRoot = spiritRoot;
          datastore.set("users", userId, userData);

          // Cinematic Spirit Root Awakening — multiple embeds with GIF
          await i.update({ content: "🌌 You embrace your destiny...", embeds: [], components: [] });

          const awakeningEmbeds = [
            new EmbedBuilder()
              .setTitle("💠 Awakening Ceremony Initiated")
              .setDescription(
                `You feel a surge of Qi beneath your feet.  
                Energy swirls around you like a thousand streams of light, converging upon your body.  
                Your heart beats faster as the universe itself acknowledges your presence.`
              )
              .setColor(0xAA00FF)
              .setImage("https://tenor.com/view/grandmaster-of-demonic-cultivation-mo-dao-zu-shi-anime-wei-wuxian-yiling-patriarch-gif-16020778")
              .setFooter({ text: "✨ Spirit Root awakening in progress..." }),
            new EmbedBuilder()
              .setTitle(`🌱 Your Spirit Root Awakens!`)
              .setDescription(
                `The veil of mystery lifts, revealing your Spirit Root: **${spiritRoot.name}**!  
                Its essence resonates with your Qi, binding with your soul.  
                From this moment, your cultivation journey begins in earnest.`
              )
              .setColor(0x00FFAA)
              .setFooter({ text: "💫 Embrace the trials and grow stronger!" }),
            new EmbedBuilder()
              .setTitle("⚡ Finalizing Awakening")
              .setDescription(
                `Your initial techniques have been imprinted into your soul.  
                Qi flows freely, your body and spirit aligned.  
                You have received 1000 starter coins to aid in your journey.  

                Check your stats anytime with **/status** and begin cultivating towards greatness.`
              )
              .setColor(0xFFAA00)
              .setFooter({ text: "🀄 The world awaits your ascension..." })
          ];

          for (const embed of awakeningEmbeds) {
            await i.user.send({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 1500)); // cinematic delay
          }

        } else if (i.customId === 'decline_cultivation') {
          await i.update({
            content: "You have declined the path of cultivation. Your destiny waits for another day...",
            embeds: [],
            components: []
          });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          dmIntro.send("⏳ You did not respond in time. The world of cultivation awaits whenever you are ready...");
        }
      });

    } catch (err) {
      console.error("Failed to DM user for /start command:", err);
      interaction.followUp({ content: "❌ I could not send you a DM. Please make sure your DMs are open.", ephemeral: true });
    }
  }
};
