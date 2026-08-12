import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowDown,
  IndianRupee,
  Clock,
  Route,
  GitBranch,
  Train,
  Repeat,
  ChevronDown
} from 'lucide-react';
import { findRoute, allStationNames, fareSlabLabel } from '../utils/metroEngine';
import { LINE_BY_ID } from '../data/metroData';
import { hudAudio } from '../utils/audioFX';

function LinePill({ line }) {
  const def = LINE_BY_ID[line];
  if (!def) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border"
      style={{ color: def.color, backgroundColor: `${def.color}18`, borderColor: `${def.color}55` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
      {def.name}
    </span>
  );
}

function FlowNode({ label, sub, color, icon: Icon, isTransfer, isEnd }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border min-w-[170px] max-w-full ${
          isEnd
            ? 'glass-panel-active'
            : isTransfer
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'bg-slate-900/80 border-white/15'
        }`}
      >
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-100 truncate">{label}</div>
          {sub && <div className="text-[10px] font-mono text-slate-400 truncate">{sub}</div>}
        </div>
      </motion.div>

      {!isEnd && (
        <div className="flex flex-col items-center py-0.5">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="w-0.5 h-4"
            style={{ backgroundColor: `${color}88` }}
          />
          <ArrowDown className="w-3.5 h-3.5 -mt-1" style={{ color: `${color}99` }} />
        </div>
      )}
    </div>
  );
}

export default function RouteFlowchart({ initialFrom, initialTo, mode = 'full' }) {
  const stations = useMemo(() => allStationNames(), []);
  const [from, setFrom] = useState(initialFrom || 'Majestic');
  const [to, setTo] = useState(initialTo || 'Whitefield');

  const route = useMemo(() => findRoute(from, to), [from, to]);

  const smartCardOffPeak = route ? Math.round(route.fare * 0.9) : 0;
  const smartCardPeak = route ? Math.round(route.fare * 0.95) : 0;

  return (
    <div className="space-y-4">
      {/* Origin / Destination selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> ORIGIN
          </label>
          <div className="relative">
            <select
              value={from}
              onChange={(e) => { hudAudio.playClick(); setFrom(e.target.value); }}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/15 text-slate-100 text-sm font-medium focus:outline-none focus:border-emerald-500/60 pr-10 cursor-pointer"
            >
              {stations.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" /> DESTINATION
          </label>
          <div className="relative">
            <select
              value={to}
              onChange={(e) => { hudAudio.playClick(); setTo(e.target.value); }}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/15 text-slate-100 text-sm font-medium focus:outline-none focus:border-rose-500/60 pr-10 cursor-pointer"
            >
              {stations.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {!route ? (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-mono">
          Could not compute a route between these stations.
        </div>
      ) : route.stops === 0 ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
          You are already at this station — no travel required.
        </div>
      ) : (
        <>
          {/* === COST-ONLY OUTPUT (minimal info) === */}
          {mode === 'cost' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">TOTAL FARE (TOKEN)</div>
                  <div className="text-4xl font-black font-mono text-purple-300">₹{route.fare}</div>
                  <div className="text-[11px] font-mono text-slate-400">Distance {route.totalKm} km • {route.fareSlab}</div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 leading-relaxed sm:ml-auto">
                <div className="text-slate-200 font-bold">{route.from} → {route.to}</div>
                <div>Smart card: ₹{smartCardOffPeak} (off-peak) • ₹{smartCardPeak} (peak)</div>
                <div>BMRCL fare revision effective 09 Feb 2026</div>
              </div>
            </motion.div>
          )}

          {/* === TIME-ONLY OUTPUT === */}
          {mode === 'time' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">EST. TRAVEL TIME</div>
                  <div className="text-4xl font-black font-mono text-cyan-300">{route.duration} MIN</div>
                  <div className="text-[11px] font-mono text-slate-400">{route.totalKm} km • {route.stops} stops</div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 leading-relaxed sm:ml-auto">
                <div className="text-slate-200 font-bold">{route.from} → {route.to}</div>
                <div>{route.transfers === 0 ? 'Direct service — no interchange' : `${route.transfers} interchange${route.transfers > 1 ? 's' : ''} (allow ~5 min each)`}</div>
              </div>
            </motion.div>
          )}

          {/* === ROUTE FLOWCHART (Complete All-Stops Pathway) === */}
          {(mode === 'route' || mode === 'full') && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-white/10 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-300">
                  <Route className="w-4 h-4 text-cyan-400" />
                  <span>PATHWAY ({route.allStops ? route.allStops.length - 1 : route.stops} STOPS): <span className="font-bold text-slate-100">{route.from}</span> → <span className="font-bold text-slate-100">{route.to}</span></span>
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  {route.transfers === 0 ? 'DIRECT SERVICE' : `${route.transfers} INTERCHANGE${route.transfers > 1 ? 'S' : ''}`}
                </span>
              </div>

              {/* Complete Step-by-Step Station Timeline Flowchart */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/25 max-h-[460px] overflow-y-auto no-scrollbar space-y-1">
                <div className="flex flex-col items-center gap-1 min-w-max mx-auto py-2">
                  {route.allStops && route.allStops.length > 0 ? (
                    route.allStops.map((stop, idx) => {
                      const line = LINE_BY_ID[stop.line] || LINE_BY_ID.purple;
                      const isFirst = idx === 0;
                      const isLast = idx === route.allStops.length - 1;

                      return (
                        <div key={idx} className="flex flex-col items-center">
                          {/* Station node card */}
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border min-w-[280px] sm:min-w-[340px] max-w-md ${
                              isFirst
                                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                : isLast
                                ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                : stop.isTransfer
                                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-900/90 border-white/10'
                            }`}
                          >
                            {/* Stop Index Badge */}
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 text-slate-950"
                              style={{ backgroundColor: line.color }}
                            >
                              {isFirst ? 'START' : isLast ? 'END' : idx}
                            </span>

                            {/* Station Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-100 truncate">{stop.name}</span>
                                {isFirst && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    BOARD
                                  </span>
                                )}
                                {isLast && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                    ALIGHT
                                  </span>
                                )}
                                {stop.isTransfer && !isLast && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    TRANSFER
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                <span style={{ color: line.color }} className="font-bold">{line.name}</span>
                                <span>•</span>
                                <span>{stop.distFromStart} km</span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Connecting arrow line to next stop */}
                          {!isLast && (
                            <div className="flex flex-col items-center py-1">
                              <motion.div
                                animate={{ height: [8, 16, 8] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="w-0.5 bg-slate-700 rounded-full"
                                style={{ backgroundColor: `${line.color}aa` }}
                              />
                              <ArrowDown className="w-3.5 h-3.5 -mt-1" style={{ color: line.color }} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback to segments */
                    route.segments.map((seg, si) => {
                      const line = LINE_BY_ID[seg.line];
                      return (
                        <div key={si} className="text-xs text-slate-300 font-mono">
                          {line.name} ({seg.km} km)
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {/* === SUMMARY STRIP (shown for full mode) === */}
          {mode === 'full' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <IndianRupee className="w-3.5 h-3.5 text-purple-400" /> TOTAL COST
                </div>
                <div className="text-xl font-black font-mono text-purple-300 mt-1">₹{route.fare}</div>
                <div className="text-[10px] font-mono text-slate-500">Token • {route.fareSlab}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> DURATION
                </div>
                <div className="text-xl font-black font-mono text-cyan-300 mt-1">{route.duration} min</div>
                <div className="text-[10px] font-mono text-slate-500">{route.totalKm} km</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" /> TRANSFERS
                </div>
                <div className="text-xl font-black font-mono text-amber-300 mt-1">{route.transfers}</div>
                <div className="text-[10px] font-mono text-slate-500">{route.transfers === 0 ? 'Direct' : 'Line swap'}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                  <Train className="w-3.5 h-3.5 text-emerald-400" /> STOPS
                </div>
                <div className="text-xl font-black font-mono text-emerald-300 mt-1">{route.stops}</div>
                <div className="text-[10px] font-mono text-slate-500">{route.transfers === 0 ? 'Direct service' : `+ ~${route.transfers * 5} min transfer`}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
