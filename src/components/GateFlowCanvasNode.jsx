import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  MapPin, 
  Bus, 
  Car, 
  Bike, 
  Footprints, 
  CheckCircle, 
  AlertCircle,
  Accessibility,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { STATION_GATES } from '../data/metroData';
import { hudAudio } from '../utils/audioFX';

export default function GateFlowCanvasNode() {
  const [selectedGate, setSelectedGate] = useState(STATION_GATES[0]);

  const getTransferIcon = (type) => {
    switch (type) {
      case 'bus': return <Bus className="w-4 h-4 text-cyan-400" />;
      case 'taxi': return <Car className="w-4 h-4 text-amber-400" />;
      case 'bike': return <Bike className="w-4 h-4 text-emerald-400" />;
      default: return <Footprints className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-cyan-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Majestic Exit Gate & Transfer Flow</h3>
            <p className="text-xs text-slate-400 font-mono">SPATIAL EXITS, BMTC BUS BAYS & LANDMARK MATRIX</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{STATION_GATES.length} EXITS ACTIVE</span>
        </div>
      </div>

      {/* Spatial Gate Nodes Compass Map Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATION_GATES.map((gate) => {
          const isSelected = selectedGate.id === gate.id;
          return (
            <motion.button
              key={gate.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                hudAudio.playClick();
                setSelectedGate(gate);
              }}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden ${
                isSelected
                  ? 'glass-panel-active border-cyan-400 shadow-xl shadow-cyan-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400">{gate.code}</span>
                {gate.elevatorAccess ? (
                  <Accessibility className="w-3.5 h-3.5 text-emerald-400" title="Accessible Elevator Available" />
                ) : (
                  <Accessibility className="w-3.5 h-3.5 text-slate-600" title="Stairs / Escalator Only" />
                )}
              </div>
              
              <div className="text-sm font-extrabold text-slate-100">{gate.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">{gate.direction}</div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 shadow-md shadow-cyan-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Detailed Flow Visualizer Panel for Selected Gate */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGate.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{selectedGate.code} OVERVIEW</span>
              <h4 className="text-xl font-bold text-slate-100">{selectedGate.name}</h4>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                STATUS: {selectedGate.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                FLOW: {selectedGate.crowdFlow}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nearby Landmarks & Walking Paths */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>NEARBY LANDMARKS & EXITS</span>
              </h5>

              <div className="space-y-2">
                {selectedGate.landmarks.map((lm, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{lm.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{lm.distance} away</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[11px] font-bold">
                      🚶 {lm.walk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Transit Transfer Connections */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Bus className="w-4 h-4 text-cyan-400" />
                <span>CONNECTING TRANSIT & SHUTTLES</span>
              </h5>

              <div className="space-y-2">
                {selectedGate.transfers.map((tr, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                        {getTransferIcon(tr.type)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{tr.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {tr.arrival ? `Next arrival: ${tr.arrival}` : tr.wait ? `Wait time: ${tr.wait}` : tr.available || tr.distance}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
