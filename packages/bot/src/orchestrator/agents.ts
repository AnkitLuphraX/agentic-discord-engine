import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db/client.js';
import { messageLogs } from '../db/schema.js';
import crypto from 'crypto';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  temperature: number;
  modelName?: string;
}

export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  planner: {
    id: 'planner',
    name: 'Architect.AI',
    role: 'Planner',
    systemPrompt: `You are an expert Systems Architect. Your role is to analyze user requests, break them down into architectural components, design structural outlines, and outline task lists. Do NOT write final implementation code. Focus on the logical planning, data flow, and API endpoints. Return step-by-step goals for the Coder agent.`,
    temperature: 0.3,
    modelName: 'gemini-1.5-flash-latest',
  },
  coder: {
    id: 'coder',
    name: 'DevCore.AI',
    role: 'Coder',
    systemPrompt: `You are a Senior Software Engineer. Your role is to write clean, modular, and functional TypeScript/JavaScript or HTML/CSS code matching the plan provided by the Planner agent. Write complete files, avoid placeholders, and ensure proper error handling.`,
    temperature: 0.5,
    modelName: 'gemini-1.5-flash-latest',
  },
  reviewer: {
    id: 'reviewer',
    name: 'ShieldReview.AI',
    role: 'Reviewer',
    systemPrompt: `You are a Security Auditor and Code Quality Reviewer. Analyze the code written by the Coder agent. Spot syntax errors, memory leaks, security vulnerabilities (like SQL injection or XSS), or missing error flows. Provide constructive feedback or concrete code modifications to resolve those issues.`,
    temperature: 0.2,
    modelName: 'gemini-1.5-flash-latest',
  },
  qa: {
    id: 'qa',
    name: 'QAValidator.AI',
    role: 'QA / Delivery',
    systemPrompt: `You are a QA Tester and Technical Technical Writer. Review the conversation deliberations and final assets. Consolidate them into a beautiful, ready-to-use delivery format. Structure it with code blocks, descriptions, and manual testing steps. Present it cleanly for the end user on Discord.`,
    temperature: 0.2,
    modelName: 'gemini-1.5-flash-latest',
  },
};

export class AgentInstance {
  private config: AgentConfig;
  private ai: any;

  constructor(config: AgentConfig) {
    this.config = config;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.ai = new GoogleGenerativeAI(apiKey);
    }
  }

  get id() {
    return this.config.id;
  }

  get name() {
    return this.config.name;
  }

  get role() {
    return this.config.role;
  }

  /**
   * Run agent deliberation loop
   */
  async deliberate(threadId: string, history: { role: string; content: string }[]): Promise<string> {
    const startTime = Date.now();
    const systemInstruction = this.config.systemPrompt;

    let responseText = '';
    let tokensUsed = 0;

    if (!this.ai) {
      // Fallback response if API key is not configured
      console.warn(`[Warning] Gemini API Key not configured. Simulating agent '${this.name}' response.`);
      responseText = `[Local Offline Mode - ${this.name} (${this.role})]\nI received the request to process. Because GEMINI_API_KEY is not set in the .env file, I am completing this step offline.\n\nReady for next step in the agent chain.`;
      tokensUsed = 120;
    } else {
      try {
        const model = this.ai.getGenerativeModel({
          model: this.config.modelName || 'gemini-1.5-flash',
          generationConfig: {
            temperature: this.config.temperature,
          },
          systemInstruction,
        });

        // Convert message format to Gemini's expected array of contents
        const contents = history.map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        }));

        const result = await model.generateContent({ contents });
        responseText = result.response.text();
        
        // Approx token calculation fallback if token counts are not returned
        tokensUsed = Math.round((responseText.length + history.reduce((acc, h) => acc + h.content.length, 0)) / 4);
      } catch (err) {
        console.error(`[Error] Agent '${this.name}' failed to generate content:`, err);
        responseText = `Failed to process request due to internal provider error.`;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log the message run to our relational database
    try {
      await db.insert(messageLogs).values({
        id: crypto.randomUUID(),
        threadId,
        senderType: 'agent',
        senderId: this.id,
        senderName: this.name,
        content: responseText,
        tokensUsed,
        latencyMs,
        createdAt: new Date(),
      });
    } catch (dbErr) {
      console.error('[Error] Failed to log message to DB:', dbErr);
    }

    return responseText;
  }
}
