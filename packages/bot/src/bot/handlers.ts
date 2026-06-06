import { CommandInteraction, ChannelType, EmbedBuilder, ThreadChannel } from 'discord.js';
import { db } from '../db/client.js';
import { agentThreads, messageLogs } from '../db/schema.js';
import { ThreadOrchestrator } from '../orchestrator/planner.js';
import crypto from 'crypto';

/**
 * Handle slash command triggers
 */
export async function handleCommand(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'agentic') {
    const subcommand = options.getSubcommand();

    if (subcommand === 'ask') {
      const prompt = options.getString('prompt', true);

      await interaction.deferReply();

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.editReply('This command can only be used in standard guild text channels.');
        return;
      }

      try {
        // 1. Create a public thread for agent deliberations
        const thread = await channel.threads.create({
          name: `🤖-agentic-${interaction.user.username.slice(0, 10)}`,
          autoArchiveDuration: 60,
          reason: `Agentic request: ${prompt.slice(0, 50)}`,
        });

        // Add the triggering user to the thread
        await thread.members.add(interaction.user.id);

        // 2. Insert thread session into database
        await db.insert(agentThreads).values({
          id: thread.id,
          guildId: interaction.guildId!,
          channelId: interaction.channelId!,
          status: 'active',
          currentAgentId: null,
          createdAt: new Date(),
        });

        await interaction.editReply(`Spawned collaborative agent thread: ${thread.toString()}`);

        // 3. Initiate agentic pipeline asynchronously so Discord doesn't timeout
        runAgentLoop(thread, prompt).catch((err) => {
          console.error(`[Bot] Error running agent loop for thread ${thread.id}:`, err);
        });
      } catch (err) {
        console.error('[Bot] Failed to initiate agentic session:', err);
        await interaction.editReply('Failed to initialize agent thread due to Discord permission limits.');
      }
    }
  }
}

/**
 * Executes the agent loop sequentially inside the Discord thread
 */
async function runAgentLoop(thread: ThreadChannel, prompt: string) {
  const orchestrator = new ThreadOrchestrator(thread.id);
  let userQuery = prompt;
  let nextStep: 'coder' | 'reviewer' | 'qa' | 'complete' = 'coder';

  const welcomeEmbed = new EmbedBuilder()
    .setTitle('🤖 Agentic Orchestration Initiated')
    .setDescription(`**Prompt:** ${prompt}\n\nOur team of virtual AI agents is joining the thread to collaborate on this challenge.`)
    .setColor('#00D9FF')
    .setTimestamp();

  await thread.send({ embeds: [welcomeEmbed] });

  // Run the state machine steps sequentially
  while (nextStep !== 'complete') {
    // 1. Notify thread which agent is active
    let activeAgentName = 'Architect.AI (Planner)';
    let activeAgentRole = 'System Design';
    let color: `#${string}` = '#00D9FF';

    if (nextStep === 'coder') {
      activeAgentName = 'DevCore.AI (Coder)';
      activeAgentRole = 'Code Engineering';
      color = '#FF6B6B';
    } else if (nextStep === 'reviewer') {
      activeAgentName = 'ShieldReview.AI (Reviewer)';
      activeAgentRole = 'Security & Quality';
      color = '#FFCA28';
    } else if (nextStep === 'qa') {
      activeAgentName = 'QAValidator.AI (QA)';
      activeAgentRole = 'Verification & Delivery';
      color = '#3ECF8E';
    }

    const thinkingMsg = await thread.send({
      content: `⏳ **${activeAgentName}** is thinking about the ${activeAgentRole}...`,
    });

    // 2. Deliberate
    const result = await orchestrator.deliberateNext(userQuery);

    // Delete the thinking message
    await thinkingMsg.delete().catch(() => {});

    if (!result) {
      await thread.send('⚠️ An error occurred in the agent communication stack.');
      break;
    }

    if (result.nextStep === 'complete') {
      // Final message
      const completedEmbed = new EmbedBuilder()
        .setTitle('✅ Project Deliberation Completed')
        .setDescription('All agents have delivered their insights. Ready for implementation!')
        .setColor('#3ECF8E')
        .setTimestamp();
      await thread.send({ embeds: [completedEmbed] });
      break;
    }

    // 3. Post agent response
    const agentEmbed = new EmbedBuilder()
      .setAuthor({ name: result.agentName, iconURL: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png' })
      .setTitle(`Output: ${result.role}`)
      .setDescription(result.content.slice(0, 4000) || 'No output generated.')
      .setColor(color)
      .setTimestamp();

    await thread.send({ embeds: [agentEmbed] });
    
    // Check for overflow response if LLM returned longer contents
    if (result.content.length > 4000) {
      await thread.send({
        content: `*Part 2:*\n${result.content.slice(4000, 6000)}`
      });
    }

    // Advance loop
    nextStep = result.nextStep;
    userQuery = ''; // Clear prompt so it loads from historical database logs subsequently
    
    // Add artificial delay for readability on Discord
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
