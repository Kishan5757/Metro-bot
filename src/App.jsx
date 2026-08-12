import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Activity, 
  Clock, 
  Building2, 
  Compass, 
  Zap, 
  MapPin, 
  HelpCircle,
  Volume2
} from 'lucide-react';
import { INITIAL_PLATFORM_SCHEDULES, SUGGESTED_QUERIES, CURRENT_STATION } from './data/metroData';
import { buildRouteQuery } from './utils/metroEngine';
import { hudAudio } from './utils/audioFX';

import CommandRing from './components/CommandRing';
import OrbitalStationNode from './components/OrbitalStationNode';
import FacilityMatrixNode from './components/FacilityMatrixNode';
import GateFlowCanvasNode from './components/GateFlowCanvasNode';
import RouteHologramNode from './components/RouteHologramNode';
import PlatformTrackerNode from './components/PlatformTrackerNode';
import AIStreamNode from './components/AIStreamNode';
import MetroNetworkMapNode from './components/MetroNetworkMapNode';

export default function App() {
  const [platforms, setPlatforms] = useState(INITIAL_PLATFORM_SCHEDULES);
  const [activeCategory, setActiveCategory] = useState('network'); // network, orbital, facility, gates, hologram, timings
  const [activeQuery, setActiveQuery] = useState(SUGGESTED_QUERIES[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('SPATIAL'); // SPATIAL grid vs FOCUSED node
  const [focusedNode, setFocusedNode] = useState(null);

  // Real-time GTFS simulation tick effect (updates train ETAs every second!)
  useEffect(() => {
    const timer = setInterval(() => {
      setPlatforms((prev) =>
        prev.map((p) => {
          if (p.etaSeconds <= 0) {
            // Train arrives, reset schedule
            return {
              ...p,
              etaSeconds: 300 + Math.floor(Math.random() * 120),
              status: 'ON_TIME',
              delayMinutes: 0
            };
          }
          return {
            ...p,
            etaSeconds: p.etaSeconds - 1
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExecuteQuery = (queryObj) => {
    setIsProcessing(true);
    setActiveCategory(queryObj.category);
    setActiveQuery(queryObj);
    hudAudio.playPulseSound();

    setTimeout(() => {
      setIsProcessing(false);
      hudAudio.playSuccess();
    }, 450);
  };

  const handleSimulateDelay = (trainId) => {
    hudAudio.playChime(700, 0.1);
    setPlatforms(prev => prev.map(p => {
      if (p.id === trainId) {
        return {
          ...p,
          status: 'ON_TIME',
          delayMinutes: 0,
          delayReason: null
        };
      }
      return p;
    }));
  };

  const handleChipAction = (chipText) => {
    const routeQuery = buildRouteQuery(chipText);
    if (routeQuery) {
      handleExecuteQuery(routeQuery);
      return;
    }
    handleExecuteQuery({
      id: 'chip-' + Date.now(),
      title: `Action: ${chipText}`,
      subtitle: `Dispatched Namma Metro command: ${chipText}`,
      category: activeCategory,
      intent: 'CHIP_ACTION',
      chips: [chipText]
    });
  };

  return (
    <div className="min-h-screen bg-[#07080c] bg-spatial-grid text-slate-100 relative flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Top Header Glass Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 glass-panel px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm -z-10" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider font-mono text-slate-100">
                METRO<span className="text-cyan-400">//</span>SPATIAL HUD
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                PROD v4.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              BENGALURU NAMMA METRO • {CURRENT_STATION.name} ({CURRENT_STATION.code})
            </p>
          </div>
        </div>

        {/* View Mode & HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Spatial Grid vs Focused Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                hudAudio.playClick();
                setViewMode('SPATIAL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'SPATIAL'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SPATIAL GRID</span>
            </button>

            <button
              onClick={() => {
                hudAudio.playClick();
                setViewMode('FOCUSED');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'FOCUSED'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FOCUSED NODE</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Spatial Canvas Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Floating Command Bar at top center of canvas */}
        <CommandRing
          onExecuteQuery={handleExecuteQuery}
          activeCategory={activeCategory}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          isProcessing={isProcessing}
        />

        {/* AI Stream Intelligence Synthesis Node */}
        <AIStreamNode activeQuery={activeQuery} onExecuteChip={handleChipAction} />

        {/* Dynamic Canvas Nodes Layout Grid */}
        <AnimatePresence mode="wait">
          {viewMode === 'SPATIAL' ? (
            <motion.div
              key="spatial-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Node 0: Full Width Namma Metro Network Map */}
              <div className={`lg:col-span-2 ${activeCategory === 'network' ? 'ring-2 ring-cyan-500/50 rounded-3xl' : ''}`}>
                <MetroNetworkMapNode onSelectMapRoute={handleExecuteQuery} />
              </div>

              {/* Node 1: Orbital Station Overview */}
              <div className={activeCategory === 'orbital' ? 'ring-2 ring-cyan-500/50 rounded-3xl' : ''}>
                <OrbitalStationNode platforms={platforms} />
              </div>

              {/* Node 2: Live Platform Timings */}
              <div className={activeCategory === 'timings' ? 'ring-2 ring-cyan-500/50 rounded-3xl' : ''}>
                <PlatformTrackerNode platforms={platforms} onSimulateDelay={handleSimulateDelay} />
              </div>

              {/* Node 3: Interactive Facility Matrix */}
              <div className={activeCategory === 'facility' ? 'ring-2 ring-emerald-500/50 rounded-3xl' : ''}>
                <FacilityMatrixNode />
              </div>

              {/* Node 4: Gate Flow Interactive Canvas */}
              <div className={activeCategory === 'gates' ? 'ring-2 ring-cyan-500/50 rounded-3xl' : ''}>
                <GateFlowCanvasNode />
              </div>

              {/* Node 5: Full Width Hologram Route Planner */}
              <div className={`lg:col-span-2 ${activeCategory === 'hologram' ? 'ring-2 ring-purple-500/50 rounded-3xl' : ''}`}>
                <RouteHologramNode />
              </div>
            </motion.div>
          ) : (
            /* Focused Single Node Mode */
            <motion.div
              key="focused-node"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {activeCategory === 'network' && <MetroNetworkMapNode onSelectMapRoute={handleExecuteQuery} />}
              {activeCategory === 'orbital' && <OrbitalStationNode platforms={platforms} />}
              {activeCategory === 'timings' && <PlatformTrackerNode platforms={platforms} onSimulateDelay={handleSimulateDelay} />}
              {activeCategory === 'facility' && <FacilityMatrixNode />}
              {activeCategory === 'gates' && <GateFlowCanvasNode />}
              {activeCategory === 'hologram' && <RouteHologramNode />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Ambient Telemetry Bar */}
      <footer className="border-t border-white/10 glass-panel px-4 sm:px-8 py-3 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>CONNECTED TO BMRCL GTFS ENGINE</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>LAT: 12.9716° N</span>
          <span>LNG: 77.5946° E</span>
          <span className="text-cyan-400">BENGALURU NAMMA METRO • PURPLE • GREEN • YELLOW</span>
        </div>
      </footer>
    </div>
  );
}
