/**
 * Visual Execution Card Generator
 * Returns beautiful vector charts representing token metrics and latency.
 */
export interface TelemetryStats {
  plannerLatency: number;
  coderLatency: number;
  reviewerLatency: number;
  qaLatency: number;
  totalTokens: number;
  apiCostUSD: number;
}

export function generateTelemetrySVG(stats: TelemetryStats): string {
  const width = 800;
  const height = 450;

  // Max latency value for scaling charts (minimum 1000ms ceiling)
  const maxLatency = Math.max(
    stats.plannerLatency,
    stats.coderLatency,
    stats.reviewerLatency,
    stats.qaLatency,
    1000
  );

  // Latency percentages
  const pctPlanner = (stats.plannerLatency / maxLatency) * 100;
  const pctCoder = (stats.coderLatency / maxLatency) * 100;
  const pctReviewer = (stats.reviewerLatency / maxLatency) * 100;
  const pctQA = (stats.qaLatency / maxLatency) * 100;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Stylesheet -->
  <style>
    .text-title { font-family: 'Outfit', 'Inter', sans-serif; font-size: 22px; fill: #00D9FF; font-weight: 800; letter-spacing: 1px; }
    .text-subtitle { font-family: 'Fira Code', 'Courier New', monospace; font-size: 12px; fill: #8B8B9F; }
    .text-label { font-family: 'Inter', sans-serif; font-size: 13px; fill: #FFFFFF; font-weight: 600; }
    .text-value { font-family: 'Fira Code', monospace; font-size: 13px; fill: #00D9FF; }
    .text-stat-num { font-family: 'Outfit', sans-serif; font-size: 32px; fill: #FFFFFF; font-weight: 800; }
    .text-stat-lbl { font-family: 'Inter', sans-serif; font-size: 11px; fill: #8B8B9F; font-weight: 500; letter-spacing: 0.5px; }
  </style>

  <!-- Background Gradients -->
  <rect width="${width}" height="${height}" rx="16" fill="#110720" />
  <rect width="${width}" height="${height}" rx="16" fill="url(#bg-glow)" opacity="0.4" />

  <!-- Borders -->
  <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="14.5" stroke="url(#border-grad)" stroke-width="3" opacity="0.25" />

  <!-- Header Section -->
  <g transform="translate(40, 45)">
    <text x="0" y="0" class="text-title">AGENTIC ORCHESTRATION telemetry</text>
    <text x="0" y="22" class="text-subtitle">PROD_RUN_ID: ${Math.random().toString(36).substring(2, 9).toUpperCase()} | ACTIVE LOOP</text>
  </g>

  <!-- Divider Line -->
  <line x1="40" y1="90" x2="${width - 40}" y2="90" stroke="#00D9FF" stroke-width="1" opacity="0.15" />

  <!-- Telemetry Metrics Grid (Left Column) -->
  <g transform="translate(40, 120)">
    <!-- Card 1: Tokens -->
    <rect width="180" height="90" rx="10" fill="#1A0B2E" stroke="#00D9FF" stroke-width="1.5" opacity="0.2" />
    <rect width="180" height="90" rx="10" stroke="#00D9FF" stroke-width="1.5" opacity="0.1" />
    <text x="20" y="45" class="text-stat-num">${stats.totalTokens}</text>
    <text x="20" y="68" class="text-stat-lbl">TOTAL TOKENS</text>

    <!-- Card 2: Latency -->
    <g transform="translate(200, 0)">
      <rect width="180" height="90" rx="10" fill="#1A0B2E" stroke="#FF6B6B" stroke-width="1.5" opacity="0.2" />
      <rect width="180" height="90" rx="10" stroke="#FF6B6B" stroke-width="1.5" opacity="0.1" />
      <text x="20" y="45" class="text-stat-num">${Math.round((stats.plannerLatency + stats.coderLatency + stats.reviewerLatency + stats.qaLatency) / 100) / 10}s</text>
      <text x="20" y="68" class="text-stat-lbl">EXEC LATENCY</text>
    </g>

    <!-- Card 3: Cost -->
    <g transform="translate(400, 0)">
      <rect width="180" height="90" rx="10" fill="#1A0B2E" stroke="#3ECF8E" stroke-width="1.5" opacity="0.2" />
      <rect width="180" height="90" rx="10" stroke="#3ECF8E" stroke-width="1.5" opacity="0.1" />
      <text x="20" y="45" class="text-stat-num">$${stats.apiCostUSD.toFixed(5)}</text>
      <text x="20" y="68" class="text-stat-lbl">ESTIMATED RUN COST</text>
    </g>
  </g>

  <!-- Agent Latency Breakdown (Bars) -->
  <g transform="translate(40, 240)">
    <!-- Row 1: Planner -->
    <text x="0" y="20" class="text-label">Planner (Architect.AI)</text>
    <rect x="220" y="8" width="400" height="12" rx="6" fill="#1A0B2E" />
    <rect x="220" y="8" width="${Math.round(pctPlanner * 4)}" height="12" rx="6" fill="url(#planner-grad)" />
    <text x="640" y="20" class="text-value">${stats.plannerLatency}ms</text>

    <!-- Row 2: Coder -->
    <g transform="translate(0, 40)">
      <text x="0" y="20" class="text-label">Coder (DevCore.AI)</text>
      <rect x="220" y="8" width="400" height="12" rx="6" fill="#1A0B2E" />
      <rect x="220" y="8" width="${Math.round(pctCoder * 4)}" height="12" rx="6" fill="url(#coder-grad)" />
      <text x="640" y="20" class="text-value">${stats.coderLatency}ms</text>
    </g>

    <!-- Row 3: Reviewer -->
    <g transform="translate(0, 80)">
      <text x="0" y="20" class="text-label">Reviewer (ShieldReview.AI)</text>
      <rect x="220" y="8" width="400" height="12" rx="6" fill="#1A0B2E" />
      <rect x="220" y="8" width="${Math.round(pctReviewer * 4)}" height="12" rx="6" fill="url(#reviewer-grad)" />
      <text x="640" y="20" class="text-value">${stats.reviewerLatency}ms</text>
    </g>

    <!-- Row 4: QA -->
    <g transform="translate(0, 120)">
      <text x="0" y="20" class="text-label">QA / Delivery (QAValidator.AI)</text>
      <rect x="220" y="8" width="400" height="12" rx="6" fill="#1A0B2E" />
      <rect x="220" y="8" width="${Math.round(pctQA * 4)}" height="12" rx="6" fill="url(#qa-grad)" />
      <text x="640" y="20" class="text-value">${stats.qaLatency}ms</text>
    </g>
  </g>

  <!-- Definitions (Gradients & Glows) -->
  <defs>
    <!-- Background Radial Glow -->
    <radialGradient id="bg-glow" cx="0%" cy="0%" r="90%" fx="0%" fy="0%">
      <stop offset="0%" stop-color="#00D9FF" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#FF6B6B" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#110720" stop-opacity="0"/>
    </radialGradient>

    <!-- Border Gradient -->
    <linearGradient id="border-grad" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D9FF" />
      <stop offset="50%" stop-color="#FF6B6B" />
      <stop offset="100%" stop-color="#3ECF8E" />
    </linearGradient>

    <!-- Agent Bars Gradients -->
    <linearGradient id="planner-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D9FF" />
      <stop offset="100%" stop-color="#0088A8" />
    </linearGradient>
    <linearGradient id="coder-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B6B" />
      <stop offset="100%" stop-color="#C53A3A" />
    </linearGradient>
    <linearGradient id="reviewer-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFCA28" />
      <stop offset="100%" stop-color="#B28C1A" />
    </linearGradient>
    <linearGradient id="qa-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3ECF8E" />
      <stop offset="100%" stop-color="#218A59" />
    </linearGradient>
  </defs>
</svg>
  `.trim();
}
