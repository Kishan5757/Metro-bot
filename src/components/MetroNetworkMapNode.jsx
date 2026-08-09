import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, GitBranch, X, Train } from 'lucide-react';
import { METRO_LINES, METRO_STATIONS, INTERCHANGE_STATIONS, LINE_BY_ID } from '../data/metroData';
import { hudAudio } from '../utils/audioFX';

const VIEW_W = 1280;
const VIEW_H = 1420;

export default function MetroNetworkMapNode() {
  const [activeLine, setActiveLine] = useState('ALL');
  const [hovered, setHovered] = useState(null);

  const uniqueNames = {};
  for (const s of METRO_STATIONS) {
    if (!uniqueNames[s.name]) uniqueNames[s.name] = [];
    uniqueNames[s.name].push(s);
  }
  const interchangeNames = new Set(INTERCHANGE_STATIONS.map(i => i.name));
  const stationsPerLine = {};
  for (const line of METRO_LINES) {
    stationsPerLine[line.id] = METRO_STATIONS.filter(s => s.line === line.id).sort((a, b) => a.dist - b.dist);
  }

  const dimmed = activeLine !== 'ALL';
  const isActiveStation = (s) => activeLine === 'ALL' || s.line === activeLine;

  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-cyan-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Ambient glow */}
      <div className="absolute -right-24 -top-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Namma Metro Network Map</h3>
            <p className="text-xs text-slate-400 font-mono">PURPLE • GREEN • YELLOW — 96.1 KM OPERATIONAL SCHEMATIC</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5" />
            <span>{new Set(METRO_STATIONS.map(s => s.name)).size} STATIONS</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{INTERCHANGE_STATIONS.length} INTERCHANGES</span>
          </span>
        </div>
      </div>

      {/* Line filter legend */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { hudAudio.playClick(); setActiveLine('ALL'); }}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            activeLine === 'ALL'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
              : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          ALL LINES
        </button>
        {METRO_LINES.map(line => (
          <button
            key={line.id}
            onClick={() => { hudAudio.playClick(); setActiveLine(activeLine === line.id ? 'ALL' : line.id); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
              activeLine === line.id
                ? 'shadow-md'
                : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
            }`}
            style={activeLine === line.id ? { backgroundColor: `${line.color}22`, color: line.color, borderColor: `${line.color}66` } : {}}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
            <span>{line.short}</span>
            <span className="text-[10px] text-slate-400 font-normal">{line.stationCount}</span>
          </button>
        ))}
      </div>

      {/* Schematic SVG map */}
      <div className="relative rounded-2xl bg-slate-950/70 border border-white/10 overflow-hidden">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto max-h-[560px]">
          {/* Grid dots backdrop */}
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={'gx' + i}>
              {Array.from({ length: 14 }).map((_, j) => (
                <circle key={`${i}-${j}`} cx={i * 80 + 40} cy={j * 100 + 50} r="1.5" fill="rgba(255,255,255,0.06)" />
              ))}
            </g>
          ))}

          {/* Line traces */}
          {METRO_LINES.map(line => {
            const sts = stationsPerLine[line.id];
            const pts = sts.map(s => `${s.x},${s.y}`).join(' ');
            const visible = activeLine === 'ALL' || activeLine === line.id;
            return (
              <g key={line.id} opacity={visible ? 1 : 0.15} style={{ transition: 'opacity 0.3s' }}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.25"
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Station nodes */}
          {METRO_STATIONS.map((s, i) => {
            const visible = isActiveStation(s);
            const isInterchange = interchangeNames.has(s.name);
            const entry = uniqueNames[s.name];
            const isJoint = entry.length > 1;
            const lineColor = LINE_BY_ID[s.line].color;
            return (
              <g
                key={i}
                opacity={visible ? 1 : 0.12}
                style={{ transition: 'opacity 0.3s', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered(s)}
              >
                {isInterchange ? (
                  <circle cx={s.x} cy={s.y} r="13" fill="rgba(7,8,12,0.9)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                ) : null}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isInterchange ? 7 : 5}
                  fill={isJoint ? lineColor : '#0b0e16'}
                  stroke={isJoint ? '#0b0e16' : lineColor}
                  strokeWidth="2.5"
                />
                {(s.name === 'Majestic' || s.name === 'Rashtreeya Vidyalaya Road') && (
                  <circle cx={s.x} cy={s.y} r="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3">
                    <animate attributeName="r" values="13;18;13" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Terminal labels */}
          {['Challaghatta', 'Whitefield', 'Madavara', 'Silk Institute', 'Delta Electronics Bommasandra'].map(name => {
            const st = METRO_STATIONS.find(s => s.name === name);
            if (!st) return null;
            return (
              <g key={name} opacity={dimmed && !isActiveStation(st) ? 0.12 : 1}>
                <text x={st.x + 14} y={st.y + 4} fill={LINE_BY_ID[st.line].color} fontSize="15" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                  {name}
                </text>
              </g>
            );
          })}
          {METRO_LINES.map(line => {
            const labelPos = {
              purple: { x: 700, y: 330 },
              green: { x: 525, y: 140 },
              yellow: { x: 720, y: 1330 }
            }[line.id];
            return (
              <g key={'lbl-' + line.id} opacity={dimmed && activeLine !== line.id ? 0.12 : 1}>
                <text x={labelPos.x} y={labelPos.y} fill={line.color} fontSize="19" fontWeight="800" letterSpacing="3" fontFamily="JetBrains Mono, monospace" opacity="0.85">
                  {line.short} LINE
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute pointer-events-none z-20 p-3 rounded-2xl glass-panel-active border border-cyan-500/40 shadow-2xl max-w-[240px]"
              style={{
                left: Math.min(12 + (hovered.x / VIEW_W) * 100 + 2, 78) + '%',
                top: Math.max(2, (hovered.y / VIEW_H) * 100 - 8) + '%'
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-100">{hovered.name}</span>
                {interchangeNames.has(hovered.name) && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    INTERCHANGE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {uniqueNames[hovered.name].map((e, idx) => {
                  const lc = LINE_BY_ID[e.line].color;
                  return (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold" style={{ color: lc, borderColor: lc + '55', backgroundColor: lc + '18' }}>
                      {LINE_BY_ID[e.line].name}
                    </span>
                  );
                })}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1.5">
                {Math.round(hovered.dist)} km along {LINE_BY_ID[hovered.line].name}
              </div>
              {hovered.name === 'Majestic' && (
                <div className="text-[10px] font-mono text-cyan-300 mt-1">Major interchange • Purple ↔ Green</div>
              )}
              {hovered.name === 'Rashtreeya Vidyalaya Road' && (
                <div className="text-[10px] font-mono text-amber-300 mt-1">Interchange • Green ↔ Yellow</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">OPERATIONAL LINES</div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-1">Purple • Green • Yellow</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">NETWORK LENGTH</div>
          <div className="text-sm font-bold font-mono text-purple-300 mt-1">96.1 KM</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">FARE RANGE</div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-1">₹11 – ₹95</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">OPERATOR</div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">BMRCL</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
        <X className="w-3 h-3" />
        <span>Interchange nodes • Schematic layout (not to geographical scale)</span>
      </div>
    </div>
  );
}
