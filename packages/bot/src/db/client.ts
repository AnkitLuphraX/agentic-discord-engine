import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const url = process.env.DATABASE_URL || 'file:local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Create the LibSQL client
const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

/**
 * Auto-bootstrap the database with correct tables and initial seed data
 */
export async function bootstrapDatabase() {
  console.log('[DB] Checking database structures...');
  try {
    // 1. Create agents table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        temperature REAL DEFAULT 0.7,
        model_name TEXT DEFAULT 'gemini-1.5-flash-latest',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER
      )
    `);

    // 2. Create agent_threads table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS agent_threads (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        current_agent_id TEXT REFERENCES agents(id),
        created_at INTEGER
      )
    `);

    // 3. Create message_logs table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id TEXT PRIMARY KEY,
        thread_id TEXT REFERENCES agent_threads(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL,
        sender_id TEXT,
        sender_name TEXT NOT NULL,
        content TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        created_at INTEGER
      )
    `);

    console.log('[DB] Schema verified.');

    // 4. Seed initial agent configurations
    const agentSeeds = [
      {
        id: 'planner',
        name: 'Architect.AI',
        role: 'Planner',
        systemPrompt: `You are an expert Systems Architect. Your role is to analyze user requests, break them down into architectural components, design structural outlines, and outline task lists. Do NOT write final implementation code. Focus on the logical planning, data flow, and API endpoints. Return step-by-step goals for the Coder agent.`,
        temperature: 0.3,
      },
      {
        id: 'coder',
        name: 'DevCore.AI',
        role: 'Coder',
        systemPrompt: `You are a Senior Software Engineer. Your role is to write clean, modular, and functional TypeScript/JavaScript or HTML/CSS code matching the plan provided by the Planner agent. Write complete files, avoid placeholders, and ensure proper error handling.`,
        temperature: 0.5,
      },
      {
        id: 'reviewer',
        name: 'ShieldReview.AI',
        role: 'Reviewer',
        systemPrompt: `You are a Security Auditor and Code Quality Reviewer. Analyze the code written by the Coder agent. Spot syntax errors, memory leaks, security vulnerabilities (like SQL injection or XSS), or missing error flows. Provide constructive feedback or concrete code modifications to resolve those issues.`,
        temperature: 0.2,
      },
      {
        id: 'qa',
        name: 'QAValidator.AI',
        role: 'QA / Delivery',
        systemPrompt: `You are a QA Tester and Technical Technical Writer. Review the conversation deliberations and final assets. Consolidate them into a beautiful, ready-to-use delivery format. Structure it with code blocks, descriptions, and manual testing steps. Present it cleanly for the end user on Discord.`,
        temperature: 0.2,
      },
    ];

    for (const seed of agentSeeds) {
      await client.execute({
        sql: `
          INSERT INTO agents (id, name, role, system_prompt, temperature, model_name, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, 'gemini-1.5-flash-latest', 1, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            role = excluded.role,
            system_prompt = excluded.system_prompt,
            temperature = excluded.temperature,
            model_name = 'gemini-1.5-flash-latest'
        `,
        args: [seed.id, seed.name, seed.role, seed.systemPrompt, seed.temperature, Date.now()],
      });
    }

    console.log('[DB] Default agent profiles synchronized.');
  } catch (err) {
    console.error('[DB] Failed to auto-bootstrap database tables:', err);
  }
}
