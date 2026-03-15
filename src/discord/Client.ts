import { Client, GatewayIntentBits } from 'discord.js';
import { env } from '../utils/EnvManager.js';

const BotToken = env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

void client.login(BotToken).catch((err) => {
    console.error("Failed to login to Discord:", err)
    process.exit(1)
});

export default client;