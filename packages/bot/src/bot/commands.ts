import { SlashCommandBuilder, Routes, PermissionFlagsBits } from 'discord.js';
import { REST } from '@discordjs/rest';

export const agenticCommand = new SlashCommandBuilder()
  .setName('agentic')
  .setDescription('Control the Agentic Multi-Agent loop')
  .addSubcommand((sub) =>
    sub
      .setName('ask')
      .setDescription('Create a collaborative agent thread session to solve a coding or planning challenge')
      .addStringOption((opt) =>
        opt
          .setName('prompt')
          .setDescription('What challenge would you like the agents to solve?')
          .setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);

/**
 * Register Slash Commands with the Discord REST API
 */
export async function registerCommands(token: string, clientId: string, guildId?: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  const commandsJSON = [agenticCommand.toJSON()];

  try {
    console.log('[Commands] Registering application (/) slash commands...');

    if (guildId) {
      // Guild-only registration for instant updates during development
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsJSON }
      );
      console.log(`[Commands] Registered ${commandsJSON.length} guild commands successfully.`);
    } else {
      // Global registration
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsJSON }
      );
      console.log(`[Commands] Registered ${commandsJSON.length} global commands successfully.`);
    }
  } catch (err) {
    console.error('[Commands] Failed to register slash commands:', err);
  }
}
