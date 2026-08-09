import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Accessibility, 
  Car, 
  QrCode, 
  Bath, 
  ArrowUpRight,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { STATION_FACILITIES } from '../data/metroData';
import { hudAudio } from '../utils/audioFX';

export default function FacilityMatrixNode() {
  const [facilities, setFacilities] = useState(STATION_FACILITIES);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedFacility, setSelectedFacility] = useState(null);

  const filtered = filterCategory === 'ALL'
    ? facilities
    : facilities.filter(f => f.category === filterCategory);

  const getIcon = (type) => {
    switch (type) {
      case 'Elevator':
      case 'Ramp':
        return <Accessibility className="w-5 h-5 text-cyan-400" />;
      case 'Restroom':
        return <Bath className="w-5 h-5 text-emerald-400" />;
      case 'Parking':
        return <Car className="w-5 h-5 text-purple-400" />;
      case 'Ticketing':
        return <QrCode className="w-5 h-5 text-amber-400" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const toggleMaintenance = (id) => {
    hudAudio.playChime(600, 0.1);
    setFacilities(prev => prev.map(f => {
      if (f.id === id) {
        const isOp = f.status === 'OPERATIONAL';
        return {
          ...f,
          status: isOp ? 'MAINTENANCE' : 'OPERATIONAL',
          health: isOp ? 50 : 100
        };
      }
      return f;
    }));
    if (selectedFacility && selectedFacility.id === id) {
      setSelectedFacility(prev => ({
        ...prev,
        status: prev.status === 'OPERATIONAL' ? 'MAINTENANCE' : 'OPERATIONAL',
        health: prev.status === 'OPERATIONAL' ? 50 : 100
      }));
    }
  };

  return (
    <div className="relative p-6 rounded-3xl glass-panel border border-emerald-500/30 overflow-hidden shadow-2xl space-y-6">
      {/* Glow Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Majestic Station Facility Telemetry</h3>
            <p className="text-xs text-slate-400 font-mono">ISOMETRIC AMENITY MATRIX & HEALTH MONITORING</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
          {[
            { id: 'ALL', label: `ALL (${facilities.length})` },
            { id: 'elevators', label: `ELEVATORS & RAMPS (${facilities.filter(f => f.category === 'elevators').length})` },
            { id: 'restrooms', label: `RESTROOMS (${facilities.filter(f => f.category === 'restrooms').length})` },
            { id: 'parking', label: `PARKING & KIOSKS (${facilities.filter(f => f.category === 'parking' || f.category === 'kiosks').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                hudAudio.playClick();
                setFilterCategory(tab.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                filterCategory === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D/Isometric Style Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isOperational = item.status === 'OPERATIONAL';
          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => {
                hudAudio.playClick();
                setSelectedFacility(item);
              }}
              className={`relative p-5 rounded-2xl border transition-all cursor-pointer group ${
                isOperational
                  ? 'bg-slate-900/60 hover:bg-slate-800/80 border-emerald-500/30 hover:border-emerald-400 shadow-lg shadow-emerald-500/5'
                  : 'bg-rose-950/20 hover:bg-rose-900/30 border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-500/10'
              }`}
            >
              {/* Top Row: Icon + Health Meter */}
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                  {getIcon(item.type)}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isOperational
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  }`}>
                    {isOperational ? 'OPERATIONAL' : 'MAINTENANCE'}
                  </span>
                </div>
              </div>

              {/* Title & Location */}
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">{item.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{item.location}</p>
              </div>

              {/* Health Rating Bar */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Health Meter:</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOperational ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${item.health}%` }}
                    />
                  </div>
                  <span className={`font-bold ${isOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.health}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Facility Detail Drawer Modal */}
      <AnimatePresence>
        {selectedFacility && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg p-6 rounded-3xl glass-panel-active border border-emerald-500/40 shadow-2xl space-y-5"
            >
              <button
                onClick={() => setSelectedFacility(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
                  {getIcon(selectedFacility.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedFacility.name}</h3>
                  <p className="text-xs font-mono text-emerald-400">{selectedFacility.location}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">{selectedFacility.description}</p>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono">
                  <div>
                    <span className="text-slate-400">Accessible Ramp/Path:</span>
                    <div className="font-bold text-emerald-400">{selectedFacility.accessible ? 'YES (WCAG Compliant)' : 'NO'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Telemetry Check:</span>
                    <div className="font-bold text-slate-200">{selectedFacility.lastInspection}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => toggleMaintenance(selectedFacility.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs font-mono transition-all ${
                    selectedFacility.status === 'OPERATIONAL'
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>
                    {selectedFacility.status === 'OPERATIONAL' ? 'SIMULATE MAINTENANCE' : 'MARK OPERATIONAL'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
