import { db } from '../db/client.js';
import { agentThreads, messageLogs, agents as agentsTable } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { AGENT_REGISTRY, AgentInstance } from './agents.js';
import crypto from 'crypto';

export type DeliberationResult = {
  agentId: string;
  agentName: string;
  role: string;
  content: string;
  nextStep: 'coder' | 'reviewer' | 'qa' | 'complete';
};

export class ThreadOrchestrator {
  private threadId: string;

  constructor(threadId: string) {
    this.threadId = threadId;
  }

  /**
   * Determine the current active state of the thread and route to the next agent
   */
  async deliberateNext(userPrompt: string): Promise<DeliberationResult | null> {
    // 1. Fetch thread details
    const threads = await db.select().from(agentThreads).where(eq(agentThreads.id, this.threadId));
    let thread = threads[0];

    if (!thread) {
      console.warn(`[Orchestrator] Thread session ${this.threadId} not found in database. Initializing.`);
      return null;
    }

    // 2. Fetch full message history for context
    const messages = await db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.threadId, this.threadId))
      .orderBy(asc(messageLogs.createdAt));

    // Convert logs to LLM roles
    const history = messages.map((m) => ({
      role: m.senderType === 'user' ? 'user' : 'model',
      content: `[${m.senderName} (${m.senderType})]: ${m.content}`,
    }));

    // If history is empty, add the initial user prompt
    if (history.length === 0 && userPrompt) {
      history.push({
        role: 'user',
        content: userPrompt,
      });

      // Log initial user message to database
      await db.insert(messageLogs).values({
        id: crypto.randomUUID(),
        threadId: this.threadId,
        senderType: 'user',
        senderId: 'user',
        senderName: 'Discord User',
        content: userPrompt,
        createdAt: new Date(),
      });
    }

    // 3. Determine next agent in sequence
    let currentAgentId = thread.currentAgentId;
    let nextAgentId: 'planner' | 'coder' | 'reviewer' | 'qa' | 'complete' = 'planner';

    if (!currentAgentId) {
      nextAgentId = 'planner';
    } else if (currentAgentId === 'planner') {
      nextAgentId = 'coder';
    } else if (currentAgentId === 'coder') {
      nextAgentId = 'reviewer';
    } else if (currentAgentId === 'reviewer') {
      nextAgentId = 'qa';
    } else if (currentAgentId === 'qa') {
      nextAgentId = 'complete';
    }

    if (nextAgentId === 'complete') {
      // Complete thread
      await db
        .update(agentThreads)
        .set({ status: 'completed', currentAgentId: null })
        .where(eq(agentThreads.id, this.threadId));

      return {
        agentId: 'system',
        agentName: 'System Core',
        role: 'Orchestrator',
        content: 'Deliberation complete. Final assets delivered.',
        nextStep: 'complete',
      };
    }

    // 4. Instantiate next agent
    const dbAgents = await db.select().from(agentsTable).where(eq(agentsTable.id, nextAgentId));
    const dbAgent = dbAgents[0];
    const agentConfig = dbAgent ? {
      id: dbAgent.id,
      name: dbAgent.name,
      role: dbAgent.role,
      systemPrompt: dbAgent.systemPrompt,
      temperature: dbAgent.temperature,
      modelName: dbAgent.modelName ?? undefined,
    } : AGENT_REGISTRY[nextAgentId];

    if (!agentConfig) {
      throw new Error(`Orchestration error: unknown agent profile '${nextAgentId}'`);
    }

    const agent = new AgentInstance(agentConfig);

    // 5. Update thread state in DB
    await db
      .update(agentThreads)
      .set({ currentAgentId: nextAgentId })
      .where(eq(agentThreads.id, this.threadId));

    // 6. Deliberate
    console.log(`[Orchestrator] Invoking agent '${agent.name}' (${agent.role}) for thread ${this.threadId}`);
    const response = await agent.deliberate(this.threadId, history);

    // Determine target state for next execution iteration
    const nextStepsMap: Record<string, 'coder' | 'reviewer' | 'qa' | 'complete'> = {
      planner: 'coder',
      coder: 'reviewer',
      reviewer: 'qa',
      qa: 'complete',
    };

    return {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      content: response,
      nextStep: nextStepsMap[nextAgentId],
    };
  }
}
