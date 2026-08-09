import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  Send,
  Compass,
  Radio,
  MapPin,
  Activity,
  Route
} from 'lucide-react';
import { SUGGESTED_QUERIES } from '../data/metroData';
import { buildRouteQuery, searchStations } from '../utils/metroEngine';
import { hudAudio } from '../utils/audioFX';

export default function CommandRing({ onExecuteQuery, activeCategory, soundEnabled, setSoundEnabled, isProcessing }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!inputText.trim()) {
      setSuggestions([]);
    } else {
      const qMatch = SUGGESTED_QUERIES.filter(q =>
        q.title.toLowerCase().includes(inputText.toLowerCase()) ||
        q.subtitle.toLowerCase().includes(inputText.toLowerCase()) ||
        q.chips.some(c => c.toLowerCase().includes(inputText.toLowerCase()))
      ).map(q => ({ ...q, kind: 'query' }));

      const stMatch = searchStations(inputText).map(name => ({
        id: 'st-' + name,
        title: name,
        subtitle: 'Namma Metro Station',
        category: 'hologram',
        intent: 'STATION',
        kind: 'station',
        stationName: name
      }));

      setSuggestions([...qMatch, ...stMatch].slice(0, 8));
    }
  }, [inputText]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    hudAudio.playClick();

    const routeQuery = buildRouteQuery(inputText);
    if (routeQuery) {
      onExecuteQuery(routeQuery);
    } else {
      onExecuteQuery({
        id: 'custom-' + Date.now(),
        title: inputText,
        subtitle: 'Custom Namma Metro query',
        category: detectCategory(inputText),
        intent: 'CUSTOM',
        customText: inputText
      });
    }
    setInputText('');
    setSuggestions([]);
  };

  const detectCategory = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('facility') || lower.includes('elevator') || lower.includes('restroom') || lower.includes('parking')) return 'facility';
    if (lower.includes('gate') || lower.includes('exit') || lower.includes('bus') || lower.includes('railway')) return 'gates';
    if (lower.includes('fare') || lower.includes('route') || lower.includes('cost') || lower.includes('ticket') || lower.includes('path')) return 'hologram';
    if (lower.includes('timing') || lower.includes('schedule') || lower.includes('delay') || lower.includes('train')) return 'timings';
    if (lower.includes('network') || lower.includes('map') || lower.includes('line')) return 'network';
    return 'orbital';
  };

  const handleVoiceSimulate = () => {
    hudAudio.playPulseSound();
    setIsListening(true);
    const phrases = [
      "Show the Namma Metro network map",
      "What is the fare from Majestic to Whitefield",
      "Route from Indiranagar to Electronic City",
      "How long is the journey to Silk Institute",
      "Show live platform timings at Majestic"
    ];
    const chosen = phrases[Math.floor(Math.random() * phrases.length)];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx <= chosen.length) {
        setInputText(chosen.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          hudAudio.playSuccess();
          const routeQuery = buildRouteQuery(chosen);
          if (routeQuery) {
            onExecuteQuery(routeQuery);
          } else {
            onExecuteQuery({
              id: 'voice-' + Date.now(),
              title: chosen,
              subtitle: 'Voice recognized metro query',
              category: detectCategory(chosen),
              intent: 'VOICE',
              customText: chosen
            });
          }
          setInputText('');
        }, 500);
      }
    }, 40);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Waveform & Status Indicator Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 rounded-full glass-panel border border-cyan-500/20 text-xs font-mono text-cyan-300/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="tracking-widest uppercase text-[11px] font-bold">NAMMA METRO SPATIAL ENGINE v4.0</span>
        </div>

        {/* Audio Waveform Equalizer when processing */}
        <div className="flex items-center gap-1.5">
          {isProcessing || isListening ? (
            <div className="flex items-center gap-0.5 h-4 px-2">
              {[0.4, 0.9, 0.3, 0.8, 0.5, 1, 0.6].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '30%'] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: 'easeInOut' }}
                  className="w-0.5 bg-cyan-400 rounded-full"
                />
              ))}
              <span className="text-[10px] text-cyan-400 font-mono ml-2 animate-pulse">
                {isListening ? 'LISTENING INPUT...' : 'PROCESSING INTENT...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>BMRCL NETWORK ACTIVE</span>
            </div>
          )}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            const newState = hudAudio.toggleSound();
            setSoundEnabled(newState);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-cyan-400 transition-colors"
          title={soundEnabled ? "Mute HUD Sound FX" : "Enable HUD Sound FX"}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="text-[10px] font-mono">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
        </button>
      </div>

      {/* Main Floating Command Input Bar */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 ${
          isProcessing ? 'glass-panel-active ring-1 ring-cyan-500/50' : 'glass-panel hover:border-cyan-500/40'
        }`}>
          {/* Orbital Cyan Core Icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
            <div className="absolute -inset-1 rounded-xl bg-cyan-500/20 blur-sm -z-10"></div>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Namma Metro Assistant... (e.g. 'Fare to Whitefield', 'Route from Indiranagar to Electronic City')"
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm font-medium focus:outline-none px-2"
          />

          {/* Voice Simulation Trigger */}
          <button
            type="button"
            onClick={handleVoiceSimulate}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : 'bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10'
            }`}
            title="Simulate Voice Query Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <span>DISPATCH</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Autocomplete Dropdown */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 p-2 rounded-2xl glass-panel border border-cyan-500/30 shadow-2xl space-y-1"
            >
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    hudAudio.playClick();
                    if (s.kind === 'station') {
                      onExecuteQuery(buildRouteQuery(`fare to ${s.stationName}`));
                    } else {
                      onExecuteQuery(s);
                    }
                    setInputText('');
                    setSuggestions([]);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {s.kind === 'station' ? (
                      <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">{s.title}</div>
                      <div className="text-[11px] text-slate-400">{s.subtitle}</div>
                    </div>
                  </div>
                  {s.kind === 'station' ? (
                    <Route className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {s.category}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Preset Scenario Orbit Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>CANVAS INTENTS:</span>
        </span>

        {SUGGESTED_QUERIES.map((q) => {
          const isActive = activeCategory === q.category;
          return (
            <button
              key={q.id}
              onClick={() => {
                hudAudio.playClick();
                onExecuteQuery(q);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{q.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
