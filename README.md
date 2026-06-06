# 🤖 Agentic Discord Engine

An advanced multi-agent orchestration engine integrated with a real-time Next.js cyber-themed telemetry dashboard. It enables cooperative AI agents to join collaborative Discord threads and iterate sequentially to solve complex challenges.

---

## 🚀 Key Features

*   **Multi-Agent Pipelines**: Sequences tasks through specialised virtual agents:
    *   **Architect.AI (Planner)**: Analyzes requests and designs structures.
    *   **DevCore.AI (Coder)**: Generates robust TypeScript/HTML solutions.
    *   **ShieldReview.AI (Reviewer)**: Conducts security audits and syntax inspections.
    *   **QAValidator.AI (QA & Delivery)**: Packages and verifies final assets.
*   **Real-time Cyber Telemetry Dashboard**: A Next.js Web app showing real-time metrics, agent processing latency, database logs, and dynamic system state charts.
*   **Persistent Memory Layer**: Powered by a relational database layer (Drizzle ORM + SQLite/LibSQL) to persist thread sessions, conversation history, and tokens consumed.

---

## 🛠️ Tech Stack

*   **Discord Bot**: Discord.js v14, TypeScript, tsx, Node.js.
*   **Web Dashboard**: Next.js (Turbopack), React, Tailwind CSS, SVG Visual Map Renderer.
*   **Database**: Drizzle ORM, SQLite (`file:local.db`) or Turso DB (LibSQL).
*   **AI Engine**: Google Gen AI SDK (Gemini 1.5 Flash).

---

## 📦 Setup & Installation

### 1. Clone & Configure Environment
Duplicate the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials in `.env`:
*   `DISCORD_TOKEN`: Your Discord Bot Token.
*   `GEMINI_API_KEY`: Your Google Gemini API Key.
*   `DISCORD_CLIENT_ID` / `DISCORD_GUILD_ID`: Your target testing server keys.

### 2. Install Dependencies
Run the installation in both folders:
```bash
# Install Bot packages
cd packages/bot
npm install

# Install Web packages
cd ../web
npm install
```

### 3. Start Development Servers
Start both modules:
```bash
# Start Discord Bot
cd packages/bot
npm run dev

# Start Telemetry Dashboard
cd packages/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the telemetry console. Open Discord and use `/agentic ask [prompt]` to spawn the agent thread!
