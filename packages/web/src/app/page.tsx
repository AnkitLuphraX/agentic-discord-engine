'use client';

import React, { useEffect, useRef, useState } from 'react';

// Struct representation of active agents
interface AgentNode {
  id: string;
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
}

// Log message template
interface TerminalLog {
  timestamp: string;
  sender: string;
  message: string;
  type: 'info' | 'code' | 'warning' | 'success';
}

export default function TelemetryDashboard() {
  const [activeAgentIdx, setActiveAgentIdx] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [totalTokens, setTotalTokens] = useState<number>(1420);
  const [runCost, setRunCost] = useState<number>(0.00284);
  const [latencySum, setLatencySum] = useState<number>(8.4);
  
  // Theme state controls
  const [glassBlur, setGlassBlur] = useState<number>(12);
  const [glowIntensity, setGlowIntensity] = useState<number>(50);
  const [sweepSpeed, setSweepSpeed] = useState<number>(1);
  const [logs, setLogs] = useState<TerminalLog[]>([
    { timestamp: '21:30:00', sender: 'SYSTEM', message: 'Agentic Orchestration Web Telemetry Service initialized.', type: 'info' },
    { timestamp: '21:30:01', sender: 'DATABASE', message: 'Connected to Turso SQLite database node on replica cluster.', type: 'success' },
    { timestamp: '21:30:03', sender: 'DISCORD', message: 'Discord Gateway client connected and listening to guild interactions.', type: 'info' },
  ]);

  const canvasWaveRef = useRef<HTMLCanvasElement | null>(null);
  const canvasGraphRef = useRef<HTMLCanvasElement | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Initialize node list coordinates
  const agentNodes: AgentNode[] = [
    { id: 'user', name: 'User Client', role: 'Trigger', color: '#FFFFFF', x: 100, y: 150 },
    { id: 'planner', name: 'Architect.AI', role: 'Planner', color: '#00D9FF', x: 280, y: 80 },
    { id: 'coder', name: 'DevCore.AI', role: 'Coder', color: '#FF6B6B', x: 440, y: 80 },
    { id: 'reviewer', name: 'ShieldReview.AI', role: 'Reviewer', color: '#FFCA28', x: 440, y: 220 },
    { id: 'qa', name: 'QAValidator.AI', role: 'QA', color: '#3ECF8E', x: 280, y: 220 },
  ];

  // 2. Real-time Multi-channel Oscilloscope rendering
  useEffect(() => {
    const canvas = canvasWaveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const render = () => {
      // Handle resizing if pixel bounds don't match layout
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const h = canvas.height;
      const w = canvas.width;
      
      // Draw gridlines
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 20; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let j = 20; j < h; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(w, j);
        ctx.stroke();
      }

      // Base sine parameters
      offset += 0.02 * sweepSpeed;

      // Draw Channel 1: CPU Activity (Cyan Wave)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.6)';
      ctx.shadowColor = 'rgba(0, 217, 255, 0.4)';
      ctx.shadowBlur = glowIntensity / 10;
      ctx.lineWidth = 2.5;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.01 + offset) * 20 * Math.cos(x * 0.002) + Math.sin(x * 0.05) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Channel 2: Memory Footprint (Pink Wave)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.45)';
      ctx.shadowColor = 'rgba(255, 107, 107, 0.3)';
      ctx.shadowBlur = glowIntensity / 12;
      ctx.lineWidth = 1.8;
      for (let x = 0; x < w; x++) {
        const y = h / 2.2 + Math.sin(x * 0.007 - offset * 1.3) * 32 * Math.sin(x * 0.003) + Math.cos(x * 0.02) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Channel 3: DB IO Telemetry (Green Wave)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(62, 207, 142, 0.55)';
      ctx.shadowColor = 'rgba(62, 207, 142, 0.3)';
      ctx.shadowBlur = glowIntensity / 15;
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = h / 1.8 + Math.cos(x * 0.015 + offset * 0.8) * 15 * Math.sin(offset) + Math.sin(x * 0.008) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Reset shadow blurs
      ctx.shadowBlur = 0;

      // Laser sweep bar
      const sweepX = (offset * 120) % w;
      ctx.fillStyle = 'rgba(0, 217, 255, 0.12)';
      ctx.fillRect(sweepX - 2, 0, 4, h);
      ctx.fillStyle = 'rgba(0, 217, 255, 0.4)';
      ctx.fillRect(sweepX - 1, 0, 2, h);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [glowIntensity, sweepSpeed]);

  // 3. Interactive Deliberation Node Graph rendering
  useEffect(() => {
    const canvas = canvasGraphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let pulseOffset = 0;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pulseOffset += 0.03;

      // Connections topology map: fromIdx -> toIdx
      const links = [
        { from: 0, to: 1 }, // User -> Planner
        { from: 1, to: 2 }, // Planner -> Coder
        { from: 2, to: 3 }, // Coder -> Reviewer
        { from: 3, to: 4 }, // Reviewer -> QA
        { from: 4, to: 1 }, // QA loopback to Planner
      ];

      // Draw connection lines and signal pulses
      links.forEach(({ from, to }) => {
        const start = agentNodes[from];
        const end = agentNodes[to];

        ctx.strokeStyle = 'rgba(0, 217, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Animated pulse signal travelling along paths
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Render 2 pulses along each line path
        for (let p = 0; p < 2; p++) {
          const ratio = ((pulseOffset + p * 0.5) % 1.0);
          const px = start.x + dx * ratio;
          const py = start.y + dy * ratio;

          ctx.fillStyle = 'rgba(0, 217, 255, 0.8)';
          ctx.shadowColor = '#00D9FF';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });

      // Draw nodes
      agentNodes.forEach((node, idx) => {
        const isActive = activeAgentIdx === idx;

        // Outer glow rings for active node state
        if (isActive) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = glowIntensity / 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Inner solid core node
        ctx.fillStyle = isActive ? node.color : 'rgba(26, 11, 46, 0.8)';
        ctx.strokeStyle = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node labels
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 12px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y - 30);

        ctx.fillStyle = isActive ? node.color : '#8B8B9F';
        ctx.font = `500 10px 'Fira Code', monospace`;
        ctx.fillText(node.role, node.x, node.y + 24);
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [activeAgentIdx, glowIntensity]);

  // 4. Scroll terminal to bottom on new log additions
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 5. Simulated deliberation state machine workflow
  const triggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveAgentIdx(1); // Start with Planner

    // Reset stats slightly for a new run
    setTotalTokens(210);
    setRunCost(0.00042);
    setLatencySum(1.2);

    const formatTime = () => new Date().toTimeString().split(' ')[0];

    const simulationSteps = [
      {
        agentIdx: 1, // Planner
        log: { timestamp: formatTime(), sender: 'Architect.AI', message: 'Scanning user guidelines. Generating functional roadmap: Segmented tasks compiled.', type: 'info' as const },
        delay: 2000,
        statAdd: { tokens: 340, cost: 0.00068, latency: 1.8 }
      },
      {
        agentIdx: 2, // Coder
        log: { timestamp: formatTime(), sender: 'DevCore.AI', message: 'Writing base structures. Integrated Drizzle database queries and client loaders. Executing build checks... compile clean.', type: 'code' as const },
        delay: 3500,
        statAdd: { tokens: 710, cost: 0.00142, latency: 3.4 }
      },
      {
        agentIdx: 3, // Reviewer
        log: { timestamp: formatTime(), sender: 'ShieldReview.AI', message: 'Running security sanity checker. Bypassed token overflow risks. Validated query input bounds. Code approved.', type: 'warning' as const },
        delay: 2500,
        statAdd: { tokens: 280, cost: 0.00056, latency: 2.1 }
      },
      {
        agentIdx: 4, // QA
        log: { timestamp: formatTime(), sender: 'QAValidator.AI', message: 'Formatting final deliverables. Rendered telemetry SVG card. System components deployed successfully.', type: 'success' as const },
        delay: 2000,
        statAdd: { tokens: 190, cost: 0.00038, latency: 1.5 }
      }
    ];

    setLogs(prev => [...prev, {
      timestamp: formatTime(),
      sender: 'SYSTEM',
      message: 'Running simulated /agentic trigger: "Setup Postgres API router schemas"',
      type: 'info'
    }]);

    let currentStep = 0;

    const runStep = () => {
      if (currentStep >= simulationSteps.length) {
        setIsSimulating(false);
        setActiveAgentIdx(-1);
        setLogs(prev => [...prev, {
          timestamp: formatTime(),
          sender: 'SYSTEM',
          message: 'Simulation pipeline execution complete.',
          type: 'success'
        }]);
        return;
      }

      const step = simulationSteps[currentStep];
      setActiveAgentIdx(step.agentIdx);
      setLogs(prev => [...prev, step.log]);
      
      // Increment execution values
      setTotalTokens(t => t + step.statAdd.tokens);
      setRunCost(c => c + step.statAdd.cost);
      setLatencySum(l => l + step.statAdd.latency);

      currentStep++;
      setTimeout(runStep, step.delay);
    };

    setTimeout(runStep, 1000);
  };

  return (
    <main className="min-h-screen crt-scanlines p-4 sm:p-8 flex flex-col items-center justify-start max-w-7xl mx-auto">
      
      {/* Title & telemetry indicator */}
      <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 font-[family-name:var(--font-outfit)]">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 pulsing-dot shadow-[0_0_10px_#3ECF8E]" />
            AGENTIC DISCORD ENGINE
          </h1>
          <p className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase mt-1">
            Production Monitor | Service Status: Online
          </p>
        </div>
        <button
          onClick={triggerSimulation}
          disabled={isSimulating}
          className={`px-5 py-2.5 rounded-lg border font-[family-name:var(--font-outfit)] font-semibold transition-all duration-300 ${
            isSimulating
              ? 'border-zinc-700 bg-zinc-900 text-zinc-500 cursor-not-allowed'
              : 'border-[#00D9FF] bg-gradient-to-r from-[rgba(0,217,255,0.1)] to-[rgba(255,107,107,0.1)] hover:from-[rgba(0,217,255,0.2)] hover:to-[rgba(255,107,107,0.2)] text-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.15)] hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:scale-[1.02]'
          }`}
        >
          {isSimulating ? 'Simulating Deliberation...' : 'Run Simulation Loop'}
        </button>
      </header>

      {/* Primary Analytics Grid */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Real-time stats */}
        <div className="cyber-card p-6 flex flex-col justify-between min-h-[140px] hover:translate-y-[-2px]">
          <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase">Total Tokens</span>
          <h2 className="text-5xl font-extrabold text-white mt-4 font-[family-name:var(--font-outfit)]">
            {totalTokens}
          </h2>
          <p className="text-xs text-emerald-400 font-[family-name:var(--font-fira)] mt-2">
            ▲ +{isSimulating ? 'active calculation' : '0'} tokens
          </p>
        </div>

        <div className="cyber-card p-6 flex flex-col justify-between min-h-[140px] hover:translate-y-[-2px]">
          <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase">Accumulated Costs</span>
          <h2 className="text-5xl font-extrabold text-white mt-4 font-[family-name:var(--font-outfit)]">
            ${runCost.toFixed(5)}
          </h2>
          <p className="text-xs text-indigo-400 font-[family-name:var(--font-fira)] mt-2">
            Gemini Flash Pricing Scale
          </p>
        </div>

        <div className="cyber-card p-6 flex flex-col justify-between min-h-[140px] hover:translate-y-[-2px]">
          <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase">Pipeline Latency</span>
          <h2 className="text-5xl font-extrabold text-white mt-4 font-[family-name:var(--font-outfit)]">
            {latencySum.toFixed(1)}s
          </h2>
          <p className="text-xs text-amber-400 font-[family-name:var(--font-fira)] mt-2">
            Average response time
          </p>
        </div>

      </section>

      {/* Multi-Channel Graphs and Node Network */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Oscilloscope Panel */}
        <div className="cyber-card p-6 flex flex-col">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase">Real-time Telemetry Oscilloscope</span>
            <div className="flex gap-4 text-[10px] font-[family-name:var(--font-fira)]">
              <span className="text-[#00D9FF]">● CPU</span>
              <span className="text-[#FF6B6B]">● RAM</span>
              <span className="text-[#3ECF8E]">● LATENCY</span>
            </div>
          </div>
          <div className="flex-1 min-h-[260px] bg-[rgba(17,7,32,0.6)] rounded-lg overflow-hidden border border-[rgba(0,217,255,0.05)]">
            <canvas ref={canvasWaveRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Dynamic Node Graph Panel */}
        <div className="cyber-card p-6 flex flex-col">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase">Cooperative Agent Graph</span>
            <span className="text-[10px] text-amber-400 font-[family-name:var(--font-fira)] uppercase pulsing-dot">
              {activeAgentIdx !== -1 ? `Deliberating: ${agentNodes[activeAgentIdx].name}` : 'Await Input'}
            </span>
          </div>
          <div className="flex-1 min-h-[260px] bg-[rgba(17,7,32,0.6)] rounded-lg overflow-hidden border border-[rgba(0,217,255,0.05)]">
            <canvas ref={canvasGraphRef} className="w-full h-full block" />
          </div>
        </div>

      </section>

      {/* Terminal logs Console & Adjustable Settings sliders */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Deliberations Output Log Console */}
        <div className="cyber-card p-6 lg:col-span-2 flex flex-col min-h-[300px]">
          <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase mb-3 block">Deliberation logs</span>
          <div className="flex-1 bg-black/70 rounded-lg p-4 font-[family-name:var(--font-fira)] text-sm overflow-y-auto max-h-[240px] flex flex-col gap-2.5 border border-zinc-900">
            {logs.map((log, index) => {
              let color = 'text-[#00D9FF]';
              if (log.type === 'success') color = 'text-[#3ECF8E]';
              if (log.type === 'warning') color = 'text-[#FFCA28]';
              if (log.type === 'code') color = 'text-[#FF6B6B]';

              return (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">
                  <span className="text-zinc-600">[{log.timestamp}]</span>{' '}
                  <span className={`${color} font-semibold`}>[{log.sender}]</span>{' '}
                  <span className="text-zinc-300">{log.message}</span>
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>
        </div>

        {/* Real-time Visual Settings Adjuster */}
        <div className="cyber-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#8B8B9F] font-[family-name:var(--font-fira)] uppercase mb-5 block">Dashboard customizer</span>
            
            {/* Slider 1 */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Glass Blur backdrop</span>
                <span className="font-semibold">{glassBlur}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="24" 
                value={glassBlur} 
                onChange={(e) => setGlassBlur(Number(e.target.value))}
                className="w-full h-1 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#00D9FF]"
              />
            </div>

            {/* Slider 2 */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Accents Glow intensity</span>
                <span className="font-semibold">{glowIntensity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={glowIntensity} 
                onChange={(e) => setGlowIntensity(Number(e.target.value))}
                className="w-full h-1 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#00D9FF]"
              />
            </div>

            {/* Slider 3 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Oscilloscope sweeping speed</span>
                <span className="font-semibold">{sweepSpeed}x</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="0.1" 
                value={sweepSpeed} 
                onChange={(e) => setSweepSpeed(Number(e.target.value))}
                className="w-full h-1 bg-[#1A0B2E] rounded-lg appearance-none cursor-pointer accent-[#00D9FF]"
              />
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 font-[family-name:var(--font-fira)] text-center mt-6 lg:mt-0">
            UI theme properties bind directly to real-time custom elements.
          </div>
        </div>

      </section>

      {/* CSS dynamic injection to match sliders */}
      <style jsx global>{`
        :root {
          --card-bg: rgba(26, 11, 46, ${Math.max(0.1, glassBlur / 40)});
          --card-border: rgba(0, 217, 255, ${Math.max(0.05, glowIntensity / 250)});
        }
        .cyber-card {
          backdrop-filter: blur(${glassBlur}px) !important;
        }
      `}</style>
      
    </main>
  );
}
