import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, GitBranch, AlertTriangle, Train, CheckCircle2, MapPin, Navigation, ArrowRight, IndianRupee, Clock, Route, RotateCcw, Sparkles } from 'lucide-react';
import { METRO_LINES, METRO_STATIONS, INTERCHANGE_STATIONS, LINE_BY_ID } from '../data/metroData';
import { findRoute, buildRouteQuery } from '../utils/metroEngine';
import { hudAudio } from '../utils/audioFX';

const VIEW_W = 1280;
const VIEW_H = 1420;

export default function MetroNetworkMapNode({ onSelectMapRoute }) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'OPERATIONAL', 'UC', or lineId
  const [hovered, setHovered] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);

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

  const isLineVisible = (lineId) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPERATIONAL') return LINE_BY_ID[lineId].status === 'OPERATIONAL';
    if (activeFilter === 'UC') return LINE_BY_ID[lineId].status === 'UNDER_CONSTRUCTION';
    return activeFilter === lineId;
  };

  const isStationVisible = (s) => isLineVisible(s.line);

  const operationalCount = METRO_LINES.filter(l => l.status === 'OPERATIONAL').length;
  const ucCount = METRO_LINES.filter(l => l.status === 'UNDER_CONSTRUCTION').length;

  const mapRoute = useMemo(() => {
    if (selectedFrom && selectedTo) {
      return findRoute(selectedFrom, selectedTo);
    }
    return null;
  }, [selectedFrom, selectedTo]);

  const handleStationClick = (st) => {
    hudAudio.playClick();
    if (!selectedFrom) {
      setSelectedFrom(st.name);
      setSelectedTo(null);
    } else if (!selectedTo && selectedFrom !== st.name) {
      setSelectedTo(st.name);
      const query = buildRouteQuery(`route from ${selectedFrom} to ${st.name}`);
      if (onSelectMapRoute) onSelectMapRoute(query);
    } else {
      setSelectedFrom(st.name);
      setSelectedTo(null);
    }
  };

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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100 tracking-wide">Namma Metro Network Map</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                7 CORRIDORS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              3 OPERATIONAL • 4 UNDER CONSTRUCTION (257.4 KM MASTER NETWORK)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>3 OPERATIONAL</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>4 UNDER CONSTRUCTION</span>
          </span>
        </div>
      </div>

      {/* Line filter legend bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { hudAudio.playClick(); setActiveFilter('ALL'); }}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            activeFilter === 'ALL'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
              : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          ALL LINES
        </button>

        <button
          onClick={() => { hudAudio.playClick(); setActiveFilter('OPERATIONAL'); }}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            activeFilter === 'OPERATIONAL'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          OPERATIONAL ({operationalCount})
        </button>

        <button
          onClick={() => { hudAudio.playClick(); setActiveFilter('UC'); }}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            activeFilter === 'UC'
              ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/30'
              : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          UNDER CONSTRUCTION ({ucCount})
        </button>

        <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

        {METRO_LINES.map(line => {
          const isSelected = activeFilter === line.id;
          const isUc = line.status === 'UNDER_CONSTRUCTION';
          return (
            <button
              key={line.id}
              onClick={() => { hudAudio.playClick(); setActiveFilter(isSelected ? 'ALL' : line.id); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                isSelected
                  ? 'shadow-md'
                  : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
              }`}
              style={isSelected ? { backgroundColor: `${line.color}22`, color: line.color, borderColor: `${line.color}66` } : {}}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isUc ? 'border border-dashed border-white' : ''}`} style={{ backgroundColor: line.color }} />
              <span>{line.short}</span>
              {isUc && (
                <span className="text-[9px] font-mono px-1 rounded bg-rose-500/30 text-rose-300">
                  UC
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schematic SVG map */}
      <div className="relative rounded-2xl bg-slate-950/70 border border-white/10 overflow-hidden">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto max-h-[600px]">
          {/* Grid dots backdrop */}
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={'gx' + i}>
              {Array.from({ length: 14 }).map((_, j) => (
                <circle key={`${i}-${j}`} cx={i * 80 + 40} cy={j * 100 + 50} r="1.5" fill="rgba(255,255,255,0.05)" />
              ))}
            </g>
          ))}

          {/* Line traces */}
          {METRO_LINES.map(line => {
            const sts = stationsPerLine[line.id] || [];
            if (!sts.length) return null;
            const pts = sts.map(s => `${s.x},${s.y}`).join(' ');
            const visible = isLineVisible(line.id);
            const isUc = line.status === 'UNDER_CONSTRUCTION';
            return (
              <g key={line.id} opacity={visible ? 1 : 0.12} style={{ transition: 'opacity 0.3s' }}>
                {/* Glow underlay */}
                <polyline
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isUc ? "8 6" : "none"}
                  opacity="0.22"
                />
                {/* Main line trace */}
                <polyline
                  points={pts}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={isUc ? "3" : "4"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isUc ? "7 5" : "none"}
                />
              </g>
            );
          })}

          {/* Station nodes */}
          {METRO_STATIONS.map((s, i) => {
            const visible = isStationVisible(s);
            const isInterchange = interchangeNames.has(s.name);
            const entry = uniqueNames[s.name];
            const isJoint = entry.length > 1;
            const lineObj = LINE_BY_ID[s.line];
            const lineColor = lineObj ? lineObj.color : '#38bdf8';
            const isUc = s.status === 'UNDER_CONSTRUCTION';
            const isFrom = selectedFrom === s.name;
            const isTo = selectedTo === s.name;

            return (
              <g
                key={i}
                opacity={visible ? 1 : 0.1}
                style={{ transition: 'opacity 0.3s', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleStationClick(s)}
              >
                {isInterchange ? (
                  <circle cx={s.x} cy={s.y} r="12" fill="rgba(7,8,12,0.9)" stroke={isUc ? "rgba(244,63,94,0.7)" : "rgba(255,255,255,0.6)"} strokeWidth="1.5" strokeDasharray={isUc ? "3 3" : "none"} />
                ) : null}

                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isFrom || isTo ? 8 : (isInterchange ? 6.5 : (isUc ? 4.5 : 5))}
                  fill={isFrom ? '#10b981' : isTo ? '#ec4899' : (isJoint ? lineColor : '#0b0e16')}
                  stroke={isFrom ? '#ffffff' : isTo ? '#ffffff' : (isJoint ? '#0b0e16' : lineColor)}
                  strokeWidth={isFrom || isTo ? "3" : "2.5"}
                  strokeDasharray={isUc && !isJoint && !isFrom && !isTo ? "3 2" : "none"}
                />

                {(isFrom || isTo) && (
                  <circle cx={s.x} cy={s.y} r="18" fill="none" stroke={isFrom ? "#10b981" : "#ec4899"} strokeWidth="2">
                    <animate attributeName="r" values="14;22;14" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Key Terminal & Landmark Station Labels */}
          {[
            'Challaghatta', 'Whitefield', 'Madavara', 'Silk Institute',
            'Delta Electronics Bommasandra', 'Kalena Agrahara', 'KIAL Terminal 1', 'Kadabagere', 'Sarjapur'
          ].map(name => {
            const st = METRO_STATIONS.find(s => s.name === name);
            if (!st) return null;
            const lineObj = LINE_BY_ID[st.line];
            const isUc = st.status === 'UNDER_CONSTRUCTION';
            return (
              <g key={name} opacity={isStationVisible(st) ? 1 : 0.1}>
                <text
                  x={st.x + 12}
                  y={st.y + 4}
                  fill={lineObj.color}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {name} {isUc ? '[UC]' : ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 2-Click Station Selection Banner Overlay on SVG map */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl glass-panel border border-cyan-500/30 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            {!selectedFrom ? (
              <span className="text-slate-300">
                Click any <strong className="text-emerald-400 font-bold">Origin station</strong> on the map, then click <strong className="text-rose-400 font-bold">Destination</strong>.
              </span>
            ) : !selectedTo ? (
              <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Origin: {selectedFrom} — Now click Destination station on map!
              </span>
            ) : (
              <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                <Route className="w-4 h-4 text-cyan-400" />
                Route: {selectedFrom} → {selectedTo}
              </span>
            )}
          </div>

          {(selectedFrom || selectedTo) && (
            <button
              onClick={() => {
                hudAudio.playClick();
                setSelectedFrom(null);
                setSelectedTo(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors font-bold text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR SELECTION</span>
            </button>
          )}
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute pointer-events-none z-20 p-3.5 rounded-2xl glass-panel-active border border-cyan-500/40 shadow-2xl max-w-[260px]"
              style={{
                left: Math.min(10 + (hovered.x / VIEW_W) * 100, 75) + '%',
                top: Math.max(2, (hovered.y / VIEW_H) * 100 - 10) + '%'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-100">{hovered.name}</span>
                {hovered.status === 'UNDER_CONSTRUCTION' ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    UNDER CONST.
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    OPERATIONAL
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {uniqueNames[hovered.name].map((e, idx) => {
                  const lineObj = LINE_BY_ID[e.line];
                  const lc = lineObj ? lineObj.color : '#38bdf8';
                  return (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
                      style={{ color: lc, borderColor: lc + '55', backgroundColor: lc + '18' }}
                    >
                      {lineObj ? lineObj.name : e.line}
                    </span>
                  );
                })}
              </div>

              <div className="text-[10px] font-mono text-slate-400 mt-2">
                Click station to set {selectedFrom ? 'Destination' : 'Origin'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive 2-Station Route & All-Stops Flowchart Drawer */}
      {mapRoute && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-4 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-100 font-mono">
                INTERACTIVE MAP ROUTE & FARE FLOWCHART
              </h4>
            </div>

            <button
              onClick={() => {
                hudAudio.playClick();
                const query = buildRouteQuery(`route from ${selectedFrom} to ${selectedTo}`);
                if (onSelectMapRoute) onSelectMapRoute(query);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/30 transition-all"
            >
              <span>DISPATCH TO AI SYNTHESIZER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Fare & Travel Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">TOKEN FARE</div>
              <div className="text-xl font-black text-purple-300 mt-0.5">₹{mapRoute.fare}</div>
              <div className="text-[9px] text-slate-500">{mapRoute.fareSlab}</div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">SMART CARD FARE</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">₹{Math.round(mapRoute.fare * 0.95)}</div>
              <div className="text-[9px] text-emerald-400/80">5% Discounted</div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">TRAVEL TIME</div>
              <div className="text-xl font-black text-cyan-300 mt-0.5">{mapRoute.duration} Min</div>
              <div className="text-[9px] text-slate-500">{mapRoute.totalKm} km total</div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">STOPS & TRANSFERS</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{mapRoute.stops} Stops</div>
              <div className="text-[9px] text-slate-500">{mapRoute.transfers === 0 ? 'Direct' : `${mapRoute.transfers} Transfers`}</div>
            </div>
          </div>

          {/* All Intermediate Station Stops Flowchart Timeline */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 max-h-64 overflow-y-auto space-y-1 font-mono no-scrollbar">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
              <span>ALL INTERMEDIATE STOPS ({mapRoute.allStops ? mapRoute.allStops.length - 1 : mapRoute.stops} STOPS)</span>
              <span>{mapRoute.from} ➔ {mapRoute.to}</span>
            </div>

            <div className="space-y-1">
              {mapRoute.allStops && mapRoute.allStops.map((stop, idx) => {
                const lineObj = LINE_BY_ID[stop.line] || LINE_BY_ID.purple;
                const isFirst = idx === 0;
                const isLast = idx === mapRoute.allStops.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                      isFirst
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                        : isLast
                        ? 'bg-purple-500/15 text-purple-200 border border-purple-500/30'
                        : stop.isTransfer
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                        : 'bg-white/5 text-slate-200 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0" style={{ backgroundColor: lineObj.color }}>
                        {isFirst ? 'A' : isLast ? 'B' : idx}
                      </span>
                      <span className="font-bold">{stop.name}</span>
                      {stop.isTransfer && !isLast && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          TRANSFER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span style={{ color: lineObj.color }}>{lineObj.short}</span>
                      <span>•</span>
                      <span>{stop.distFromStart} km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Network stats summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">OPERATIONAL NETWORK</div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">3 Lines • 96.4 KM</div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">UNDER CONSTRUCTION</div>
          <div className="text-sm font-bold font-mono text-rose-300 mt-1">4 Lines • 161.0 KM</div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">TOTAL MASTER NETWORK</div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-1">257.4 KM • 192 STNS</div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">FARE TABLE (2026)</div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-1">₹11 – ₹95 SLABS</div>
        </div>
      </div>
    </div>
  );
}
