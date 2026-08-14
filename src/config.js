const { MinestratorClient } = require("./minestrator");

const REQUIRED_VARS = [
  "DISCORD_TOKEN",
  "MINESTRATOR_API_KEY",
  "MINESTRATOR_SERVER_ID",
];

function getMissingEnvVars() {
  return REQUIRED_VARS.filter((name) => !process.env[name]);
}

function getMinestratorContext() {
  const apiKey = process.env.MINESTRATOR_API_KEY;
  const serverId = Number(process.env.MINESTRATOR_SERVER_ID);

  if (!apiKey || !Number.isInteger(serverId)) {
    return null;
  }

  return {
    client: new MinestratorClient(apiKey),
    serverId,
  };
}

module.exports = { getMissingEnvVars, getMinestratorContext };
