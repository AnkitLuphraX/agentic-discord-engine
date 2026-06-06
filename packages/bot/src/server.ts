import http from 'http';
import { db } from './db/client.js';
import { messageLogs, agentThreads } from './db/schema.js';
import { sql } from 'drizzle-orm';

const PORT = process.env.PORT ? parseInt(process.env.PORT) + 1 : 3001; // Fallback to 3001 if dashboard is on 3000

export function startTelemetryServer() {
  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/api/telemetry' && req.method === 'GET') {
      try {
        // Query database metrics
        const totalLogs = await db.select({ count: sql<number>`count(*)` }).from(messageLogs);
        const tokenStats = await db.select({ sum: sql<number>`sum(tokens_used)` }).from(messageLogs);
        const avgLatency = await db.select({ avg: sql<number>`avg(latency_ms)` }).from(messageLogs);
        
        const activeSessions = await db.select({ count: sql<number>`count(*)` })
          .from(agentThreads)
          .where(sql`status = 'active'`);

        // Fetch recent logs
        const recentLogs = await db.select()
          .from(messageLogs)
          .orderBy(sql`created_at desc`)
          .limit(10);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'online',
          activeSessionsCount: activeSessions[0]?.count || 0,
          totalLogsCount: totalLogs[0]?.count || 0,
          totalTokens: tokenStats[0]?.sum || 0,
          avgLatencyMs: Math.round(avgLatency[0]?.avg || 0),
          recentLogs,
        }));
      } catch (err) {
        console.error('[Telemetry Server] Failed to query database metrics:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch database telemetry.' }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found.' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`[Telemetry Server] Running telemetry server at http://localhost:${PORT}/api/telemetry`);
  });

  return server;
}
