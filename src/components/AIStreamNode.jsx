import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, ArrowUpRight, Route, MapPin } from 'lucide-react';
import { hudAudio } from '../utils/audioFX';
import RouteFlowchart from './RouteFlowchart';

export default function AIStreamNode({ activeQuery, onExecuteChip }) {
  if (!activeQuery) return null;

  const isRoute = activeQuery.intent === 'ROUTE';

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'facility': return { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/20' };
      case 'gates': return { text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/20' };
      case 'hologram': return { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/20' };
      case 'timings': return { text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/20' };
      case 'network': return { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/20' };
      default: return { text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/20' };
    }
  };

  const style = getCategoryColor(activeQuery.category);

  return (
    <motion.div
      key={activeQuery.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative p-6 rounded-3xl glass-panel-active border border-cyan-500/40 shadow-2xl space-y-4"
    >
      {/* Top Bar: Metro Intelligence Synthesizer */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${style.bg} ${style.border} ${style.text}`}>
            {isRoute ? <Route className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4 animate-spin" />}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              {isRoute ? 'NAMMA METRO ROUTE INTELLIGENCE' : 'AI METRO SYNTHESIS'}
            </span>
            <h4 className="text-sm font-bold text-slate-100">{activeQuery.title}</h4>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
          {isRoute ? `QUERY: ${activeQuery.mode?.toUpperCase() || 'FULL'}` : `INTENT: ${activeQuery.category?.toUpperCase()}`}
        </span>
      </div>

      {isRoute ? (
        /* Route response: minimal info driven by query mode */
        <RouteFlowchart
          initialFrom={activeQuery.from}
          initialTo={activeQuery.to}
          mode={activeQuery.mode || 'full'}
        />
      ) : (
        <>
          {/* Structured synthesis — metro-focused facts only */}
          <div className="text-xs text-slate-200 leading-relaxed font-sans space-y-2">
            <p className="font-medium text-slate-300">
              {activeQuery.subtitle || 'Synthesizing BMRCL transit streams and station telemetry for instant decision support.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-purple-300">
                <Bot className="w-3.5 h-3.5 shrink-0" />
                <span>3 Lines • 96.1 km Network</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Fares ₹11 – ₹95 (2026)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-emerald-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>83 Operational Stations</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Action Orbit Chips */}
      {activeQuery.chips && activeQuery.chips.length > 0 && (
        <div className="pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
            ACTION CHIPS:
          </span>
          {activeQuery.chips.map((chip, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                hudAudio.playClick();
                onExecuteChip && onExecuteChip(chip);
              }}
              className="px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1 shrink-0 transition-colors"
            >
              <span>{chip}</span>
              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
