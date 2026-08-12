import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Clock,
  IndianRupee,
  GitCommit,
  MapPin,
  Sparkles
} from 'lucide-react';
import { ROUTE_DESTINATIONS, CURRENT_STATION, LINE_BY_ID } from '../data/metroData';
import { findRoute, stationOnLine } from '../utils/metroEngine';
import { hudAudio } from '../utils/audioFX';

export default function RouteHologramNode() {
  const [selectedDestId, setSelectedDestId] = useState('whitefield');
  const [isPeakHour, setIsPeakHour] = useState(false);
  const [useSmartCard, setUseSmartCard] = useState(true);

  const target = ROUTE_DESTINATIONS.find(d => d.id === selectedDestId) || ROUTE_DESTINATIONS[0];
  const targetName = target.name;
  const route = useMemo(
    () => findRoute(CURRENT_STATION.shortName, targetName),
    [targetName]
  );

  // Token fare or smart card fare (5% peak / 10% off-peak discount)
  const discount = useSmartCard ? (isPeakHour ? 0.95 : 0.9) : 1;
  const baseFare = route ? Math.round(route.fare * discount) : 0;
  const tokenFare = route ? route.fare : 0;

  const selectedStation = stationOnLine(targetName, route?.segments?.[route.segments.length - 1]?.line) || stationOnLine(targetName, 'purple');

  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-purple-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Glow Ambient background */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Namma Metro Route & Fare Engine</h3>
            <p className="text-xs text-slate-400 font-mono">DYNAMIC TRIP PATHS • BMRCL 2026 FARE SLABS (₹11 – ₹95)</p>
          </div>
        </div>

        {/* Peak / Payment Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { hudAudio.playClick(); setUseSmartCard(!useSmartCard); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              useSmartCard
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${useSmartCard ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{useSmartCard ? 'SMART CARD (₹ DISCOUNT)' : 'TOKEN / QR'}</span>
          </button>

          <button
            onClick={() => { hudAudio.playClick(); setIsPeakHour(!isPeakHour); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              isPeakHour
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPeakHour ? 'bg-rose-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isPeakHour ? 'PEAK HOURS' : 'OFF-PEAK'}</span>
          </button>
        </div>
      </div>

      {/* Destination Selector Matrix */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
          SELECT DESTINATION STATION:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ROUTE_DESTINATIONS.map((st) => {
            const stRoute = findRoute(CURRENT_STATION.shortName, st.name);
            const line = stRoute?.segments?.[stRoute.segments.length - 1]?.line;
            const color = line ? LINE_BY_ID[line].color : '#a78bfa';
            const isSelected = selectedDestId === st.id;
            return (
              <motion.button
                key={st.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { hudAudio.playClick(); setSelectedDestId(st.id); }}
                className={`p-3 rounded-2xl border text-left font-mono text-xs transition-all ${
                  isSelected
                    ? 'shadow-lg'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-purple-500/30'
                }`}
                style={isSelected ? { backgroundColor: `${color}20`, color, borderColor: `${color}88` } : {}}
              >
                <div className="font-bold truncate">{st.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {st.underConstruction || stRoute?.isUnderConstruction
                    ? '🚧 UNDER CONST.'
                    : (stRoute ? `${stRoute.totalKm} km • ₹${stRoute.fare}` : '—')}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Animated SVG Holographic Path Renderer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-slate-400 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-100 font-bold">{CURRENT_STATION.shortName}</span>
          </div>

          <div className="flex items-center gap-2 text-purple-400">
            <GitCommit className="w-4 h-4 animate-spin" />
            <span>
              {route && route.transfers > 0
                ? `${route.transfers} TRANSFER${route.transfers > 1 ? 'S' : ''} • ${route.stops} STOPS`
                : `DIRECT • ${route?.stops ?? 0} STOPS`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-slate-100 font-bold">{target.name}</span>
          </div>
        </div>

        {/* Segment chain visualization */}
        <div className="relative py-4 space-y-3">
          {route && route.segments.length > 0 ? (
            route.segments.map((seg, si) => {
              const line = LINE_BY_ID[seg.line];
              const isLast = si === route.segments.length - 1;
              return (
                <div key={si} className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: line.color, boxShadow: `0 0 10px ${line.color}` }}
                    />
                    <div className="flex-1 relative h-3 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.9, delay: si * 0.2, ease: 'easeOut' }}
                        className="h-full"
                        style={{ background: `linear-gradient(to right, ${line.color}, ${line.color}88)` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: line.color }}>
                      {line.short} • {seg.km} km
                    </span>
                  </div>
                  {!isLast && (
                    <div className="flex items-center gap-3 pl-1.5 mt-3">
                      <span className="text-[10px] font-mono text-amber-400">↳ Interchange → {LINE_BY_ID[route.segments[si + 1].line].short}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs font-mono text-slate-400">Computing route...</div>
          )}

          {/* Pulse Train Node travelling */}
          <motion.div
            animate={{ left: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-purple-400 border-2 border-white shadow-xl shadow-purple-400 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
          </motion.div>
        </div>

        {/* Trip Hologram Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>EST. DURATION</span>
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {route ? `${route.duration} Min` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
              <IndianRupee className="w-3.5 h-3.5 text-purple-400" />
              <span>{useSmartCard ? 'SMART CARD FARE' : 'TOKEN FARE'}</span>
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">₹{baseFare}</div>
            <div className="text-[9px] font-mono text-slate-500">Token: ₹{tokenFare}</div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>DISTANCE</span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
              {route ? `${route.totalKm} km` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
              <GitCommit className="w-3.5 h-3.5 text-amber-400" />
              <span>TRANSFERS</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {route ? (route.transfers === 0 ? 'Direct' : `${route.transfers}`) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Fare note */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pt-2 border-t border-white/10">
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Distance-based BMRCL fare • effective 09 Feb 2026</span>
        </span>
        <span className="text-slate-500">
          {selectedStation ? `${selectedStation.name} • ${LINE_BY_ID[selectedStation.line].short} LINE` : ''}
        </span>
      </div>
    </div>
  );
}
