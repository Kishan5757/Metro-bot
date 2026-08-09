import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Navigation,
  GitBranch,
  Train,
  Network,
  MapPin,
  Users
} from 'lucide-react';
import { CURRENT_STATION, METRO_LINES, LINE_BY_ID } from '../data/metroData';
import { spokesForStation, stationOnLine } from '../utils/metroEngine';
import { hudAudio } from '../utils/audioFX';

export default function OrbitalStationNode({ platforms, onSelectPlatform }) {
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [hoveredNode, setHoveredNode] = useState(null);

  const RADIUS = 128;
  const spokes = spokesForStation(CURRENT_STATION.shortName, RADIUS);

  const centerName = CURRENT_STATION.shortName;
  const centerLines = CURRENT_STATION.lines;

  const visibleSpokes = spokes.filter(
    s => selectedLine === 'ALL' || s.line === selectedLine
  );

  // Live train blips placed on the spoke that leads toward their destination
  const trainBlips = platforms
    .map(p => {
      const spoke = spokes.find(s => s.line === p.line);
      if (!spoke) return null;
      const destNode = spoke.nodes.find(n => n.name === p.destination);
      const tip = spoke.nodes[spoke.nodes.length - 1];
      const base = destNode || tip;
      const f = 0.12 + 0.55 * Math.min(1, p.etaSeconds / 600);
      return {
        ...p,
        x: 160 + (base.x - 160) * f,
        y: 160 + (base.y - 160) * f,
        nodeRadius: Math.hypot(base.x - 160, base.y - 160) * f
      };
    })
    .filter(Boolean);

  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-cyan-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Background Ambient Mesh Radial */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Node Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100 tracking-wide">{CURRENT_STATION.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {CURRENT_STATION.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">NAMMA METRO NETWORK RADAR • LIVE LINE VIEW</p>
          </div>
        </div>

        {/* Line Filter Matrix */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
          {['ALL', ...METRO_LINES.map(l => l.short)].map((label) => {
            const lineId = label === 'ALL' ? 'ALL' : label.toLowerCase();
            const isActive = selectedLine === lineId;
            return (
              <button
                key={label}
                onClick={() => {
                  hudAudio.playClick();
                  setSelectedLine(lineId);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Orbital Radial Diagram SVG Canvas */}
      <div className="relative flex items-center justify-center py-6">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Radar Scanner Ray Sweep */}
          <div className="absolute inset-0 rounded-full animate-radar opacity-20 pointer-events-none bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(0,243,255,0.4)_360deg)]" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
            {/* Concentric Orbit Rings */}
            <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(139, 92, 246, 0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="160" cy="160" r="96" fill="none" stroke="rgba(16, 185, 129, 0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="160" cy="160" r="52" fill="none" stroke="rgba(245, 184, 30, 0.18)" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Crosshair Lines */}
            <line x1="160" y1="10" x2="160" y2="310" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
            <line x1="10" y1="160" x2="310" y2="160" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

            {/* Metro line spokes */}
            {visibleSpokes.map((spoke, si) => {
              const line = LINE_BY_ID[spoke.line];
              const pts = spoke.nodes.map(n => `${n.x},${n.y}`).join(' ');
              const radius = Math.hypot(spoke.nodes[spoke.nodes.length - 1].x - 160, spoke.nodes[spoke.nodes.length - 1].y - 160);
              return (
                <g key={si}>
                  {/* Glow underlay */}
                  <polyline points={pts} fill="none" stroke={line.color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />
                  <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />

                  {/* Direction arc label */}
                  {(() => {
                    const tip = spoke.nodes[spoke.nodes.length - 1];
                    const ang = Math.atan2(tip.y - 160, tip.x - 160);
                    const labelR = (radius / 2) * 1.22;
                    return (
                      <text
                        x={160 + labelR * Math.cos(ang)}
                        y={160 + labelR * Math.sin(ang) + 3}
                        fill={line.color}
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        opacity="0.9"
                      >
                        {spoke.direction.split(' (')[0]}
                      </text>
                    );
                  })()}

                  {/* Station nodes on spoke */}
                  {spoke.nodes.slice(1).map((n, ni) => {
                    const isRv = n.name === 'Rashtreeya Vidyalaya Road';
                    const isTerminal = ni === spoke.nodes.length - 2;
                    return (
                      <g key={ni} pointerEvents="all" style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredNode({ ...n, line: spoke.line })}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <circle cx={n.x} cy={n.y} r={isRv ? 6 : isTerminal ? 5 : 4} fill="#0b0e16" stroke={line.color} strokeWidth="2.4" />
                        {isRv && (
                          <circle cx={n.x} cy={n.y} r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Hover crosshair */}
            {hoveredNode && (
              <g pointerEvents="none">
                <line x1={hoveredNode.x - 8} y1={hoveredNode.y} x2={hoveredNode.x + 8} y2={hoveredNode.y} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                <line x1={hoveredNode.x} y1={hoveredNode.y - 8} x2={hoveredNode.x} y2={hoveredNode.y + 8} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
              </g>
            )}

            {/* Live train blips */}
            {trainBlips.map(t => (
              <g key={t.id} pointerEvents="all" style={{ cursor: 'pointer' }}
                onClick={() => onSelectPlatform && onSelectPlatform(t)}
              >
                <circle cx={t.x} cy={t.y} r="4.5" fill={t.color}>
                  <animate attributeName="r" values="3.5;5.5;3.5" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle cx={t.x} cy={t.y} r="8" fill="none" stroke={t.color} strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" values="6;12;6" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Center Station Hub Core */}
            <g>
              <circle cx="160" cy="160" r="34" fill="rgba(13,16,26,0.9)" stroke="rgba(0,243,255,0.6)" strokeWidth="2">
                <animate attributeName="r" values="32;36;32" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {centerLines.map((l, i) => (
                <circle key={l} cx={160 + (i === 0 ? -9 : 9)} cy="160" r="5" fill={LINE_BY_ID[l].color} />
              ))}
              <text x="160" y="156" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                {centerName.split(' ')[0]}
              </text>
              <text x="160" y="170" textAnchor="middle" fill="rgba(0,243,255,0.9)" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                INTERCHANGE
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Hovered station info strip */}
      <div className="min-h-[34px] flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/70 border border-white/10 text-xs font-mono">
        {hoveredNode ? (
          <>
            <span className="flex items-center gap-2 text-slate-200">
              <MapPin className="w-4 h-4" style={{ color: LINE_BY_ID[hoveredNode.line].color }} />
              <span className="font-bold">{hoveredNode.name}</span>
              <span className="text-slate-500">•</span>
              <span style={{ color: LINE_BY_ID[hoveredNode.line].color }}>{LINE_BY_ID[hoveredNode.line].name}</span>
            </span>
            <span className="text-slate-400">
              {stationOnLine(hoveredNode.name, hoveredNode.line)?.dist ?? 0} km from line origin
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-slate-400">
              <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
              Hover any node for station telemetry
            </span>
            <span className="text-cyan-300">{centerLines.map(l => LINE_BY_ID[l].short).join(' • ')} AT CORE</span>
          </>
        )}
      </div>

      {/* Station Metro Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">LINES SERVED</div>
            <div className="text-xs font-bold text-purple-300 font-mono">{CURRENT_STATION.lines.map(l => LINE_BY_ID[l].short).join(' + ')}</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <Network className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">INTERCHANGE</div>
            <div className="text-xs font-bold text-cyan-300 font-mono">PURPLE ↔ GREEN</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <Train className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">LIVE TRAINS</div>
            <div className="text-xs font-bold text-emerald-300 font-mono">{platforms.length} ON RADAR</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <Users className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">HUB CROWD</div>
            <div className="text-xs font-bold text-amber-300 font-mono">{CURRENT_STATION.crowdDensity}% Density</div>
          </div>
        </div>
      </div>
    </div>
  );
}
