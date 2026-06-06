import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerCommands } from './bot/commands.js';
import { handleCommand } from './bot/handlers.js';
import { startTelemetryServer } from './server.js';
import { bootstrapDatabase } from './db/client.js';

// Resolve directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Auto-bootstrap database tables and agent metadata
await bootstrapDatabase();

// Start local database telemetry HTTP server
startTelemetryServer();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || token === 'your_discord_bot_token_here') {
  console.warn('[Warning] DISCORD_TOKEN is not configured in .env file. Bot startup bypassed.');
} else {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once('ready', async () => {
    console.log(`[Success] Logged in as ${client.user?.tag || 'Agentic Discord Bot'}!`);
    
    // Auto-register command schema upon startup
    if (clientId && clientId !== 'your_discord_client_id_here') {
      await registerCommands(token, clientId, guildId);
    } else {
      console.warn('[Commands] Skipping command registration: DISCORD_CLIENT_ID is not configured.');
    }
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      await handleCommand(interaction as any);
    } catch (err) {
      console.error('[Event] Error processing interaction event:', err);
    }
  });

  client.login(token).catch((err) => {
    console.error('[Error] Failed to login to Discord:', err);
  });
}
