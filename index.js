require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

const { getMissingEnvVars, getMinestratorContext } = require("./src/config");
const { MinestratorError } = require("./src/minestrator");

const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Démarrer votre serveur Minestrator"),

  new SlashCommandBuilder()
    .setName("servers")
    .setDescription("Lister vos serveurs Minestrator"),
].map((cmd) => cmd.toJSON());

async function handleStart(interaction) {
  const ctx = getMinestratorContext();
  if (!ctx) {
    await interaction.reply({
      content: "⚠️ Configuration Minestrator manquante côté serveur.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const server = await ctx.client.getServer(ctx.serverId);
    await ctx.client.startServer(ctx.serverId);
    const name = server.name ?? `Serveur ${ctx.serverId}`;
    await interaction.editReply(`🚀 Démarrage de **${name}** en cours...`);
  } catch (err) {
    const msg = err instanceof MinestratorError ? err.message : String(err);
    await interaction.editReply(`❌ Erreur : ${msg}`);
  }
}

async function handleServers(interaction) {
  const ctx = getMinestratorContext();
  if (!ctx) {
    await interaction.reply({
      content: "⚠️ Configuration Minestrator manquante côté serveur.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const user = await ctx.client.getUser();
    const servers = await ctx.client.listServers(user.id);

    if (!servers.length) {
      await interaction.editReply("Aucun serveur trouvé.");
      return;
    }

    const lines = servers.map(
      (server) => `• **${server.name ?? "?"}** — ID \`${server.id}\``
    );

    await interaction.editReply(
      `Serveurs de **${user.pseudo}** :\n${lines.join("\n")}`
    );
  } catch (err) {
    const msg = err instanceof MinestratorError ? err.message : String(err);
    await interaction.editReply(`❌ Erreur : ${msg}`);
  }
}

async function main() {
  const missing = getMissingEnvVars();
  if (missing.length) {
    console.error(
      `Variables d'environnement manquantes : ${missing.join(", ")}\n` +
        "Copiez .env.example vers .env et renseignez les valeurs."
    );
    process.exit(1);
  }

  const token = process.env.DISCORD_TOKEN;
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log(`Connecté en tant que ${client.user.tag} (${client.user.id})`);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (interaction.commandName === "start") {
        await handleStart(interaction);
      } else if (interaction.commandName === "servers") {
        await handleServers(interaction);
      }
    } catch (err) {
      console.error(err);
      const content = "❌ Une erreur inattendue est survenue.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(content);
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
  });

  await client.login(token);
}

main();
