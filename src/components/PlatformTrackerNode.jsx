import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Navigation, 
  Users, 
  Layers, 
  TrainTrack,
  Activity
} from 'lucide-react';
import { hudAudio } from '../utils/audioFX';

export default function PlatformTrackerNode({ platforms, onSimulateDelay }) {
  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-cyan-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Namma Metro Live Platform Tracker</h3>
            <p className="text-xs text-slate-400 font-mono">REAL-TIME TRAIN ETAS • MAJESTIC & RV ROAD FEED</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>BMRCL REAL-TIME FEED ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Platform Arrival Board Feed */}
      <div className="space-y-4">
        {platforms.map((p) => {
          const isDelayed = p.status === 'DELAYED';
          const minutes = Math.floor(p.etaSeconds / 60);
          const seconds = p.etaSeconds % 60;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${
                isDelayed
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                  : 'bg-slate-900/60 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Train & Line Info */}
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-2xl flex items-center justify-center font-mono font-bold text-sm"
                    style={{ backgroundColor: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}
                  >
                    {p.platform}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-100">{p.destination}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {p.id}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-3">
                      <span>{p.lineName}</span>
                      <span>•</span>
                      <span>{p.track}</span>
                      {p.note && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">{p.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticking Countdown ETA Timer */}
                <div className="text-right">
                  <div className={`text-2xl font-black font-mono tracking-tight ${isDelayed ? 'text-rose-400' : 'text-cyan-300'}`}>
                    {p.etaSeconds <= 0 ? (
                      <span className="animate-pulse text-emerald-400">BOARDING NOW</span>
                    ) : (
                      `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[11px] font-mono">
                    {isDelayed ? (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        +{p.delayMinutes} MIN DELAY
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ON TIME
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delay Reason alert box if delayed */}
              {isDelayed && p.delayReason && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-center justify-between">
                  <span>⚠️ Reason: {p.delayReason}</span>
                  <button
                    onClick={() => {
                      hudAudio.playClick();
                      onSimulateDelay(p.id);
                    }}
                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-white font-bold text-[10px]"
                  >
                    RESOLVE DELAY
                  </button>
                </div>
              )}

              {/* Carriage Congestion Heatmap */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CARRIAGE CROWD DENSITY:</span>
                  </span>
                  <span className="font-bold text-slate-200">{p.crowdingPct}% ({p.crowdLabel})</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {p.carriages.map((pct, idx) => {
                    let color = 'bg-emerald-500';
                    if (pct > 50) color = 'bg-amber-500';
                    if (pct > 75) color = 'bg-rose-500';
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="h-2 rounded-md bg-slate-800 overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 text-center">C{idx + 1}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
