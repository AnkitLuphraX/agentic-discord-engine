import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Configuration table for agent personal profiles and prompts
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: real('temperature').default(0.7),
  modelName: text('model_name').default('gemini-1.5-flash'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Session tracker for active Discord thread operations
export const agentThreads = sqliteTable('agent_threads', {
  id: text('id').primaryKey(), // Discord Thread ID
  guildId: text('guild_id').notNull(),
  channelId: text('channel_id').notNull(),
  status: text('status').$type<'active' | 'waiting' | 'completed'>().default('active'),
  currentAgentId: text('current_agent_id').references(() => agents.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Logs of message actions and token costs
export const messageLogs = sqliteTable('message_logs', {
  id: text('id').primaryKey(), // Custom UUID/NanoID or autoincrement
  threadId: text('thread_id').references(() => agentThreads.id, { onDelete: 'cascade' }),
  senderType: text('sender_type').$type<'user' | 'agent' | 'system'>().notNull(),
  senderId: text('sender_id'), // Discord User ID or Agent ID
  senderName: text('sender_name').notNull(),
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used').default(0),
  latencyMs: integer('latency_ms').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
