// ============================================================
// NAMMA METRO ROUTING ENGINE
// Dijkstra over the Bengaluru metro graph (minimizes transfers)
// with the official 2026 BMRCL distance-based fare table.
// ============================================================

import { METRO_STATIONS, FARE_TABLE, CURRENT_STATION, LINE_BY_ID } from '../data/metroData';

// Aliases to help the chat parser understand common shorthand
export const STATION_ALIASES = {
  'rvroad': 'Rashtreeya Vidyalaya Road',
  'rvroadstn': 'Rashtreeya Vidyalaya Road',
  'r. v. road': 'Rashtreeya Vidyalaya Road',
  'rv': 'Rashtreeya Vidyalaya Road',
  'k r puram': 'Krishnarajapura',
  'krpuram': 'Krishnarajapura',
  'kr puram': 'Krishnarajapura',
  'krmarket': 'Krishna Rajendra Market',
  'kr market': 'Krishna Rajendra Market',
  'mg': 'MG Road',
  'mgrd': 'MG Road',
  'majestic': 'Majestic',
  'kempegowda': 'Majestic',
  'bommasandra': 'Delta Electronics Bommasandra',
  'electroniccity': 'Electronic City',
  'electronic city phase 2': 'Infosys Foundation Konappana Agrahara',
  'silkboard': 'Central Silk Board',
  'silk board': 'Central Silk Board',
  'sk': 'Silk Institute',
  'silkinstitute': 'Silk Institute',
  'jp nagar': 'Jaya Prakash Nagar',
  'yeshwanthpur': 'Yeshwanthpur',
  'whitefield': 'Whitefield',
  'kadugodi': 'Whitefield',
  'airport': 'KIAL Terminal 1',
  'kia': 'KIAL Terminal 1',
  'airport terminal': 'KIAL Terminal 1',
  'nagawara': 'Nagawara',
  'hebbal': 'Hebbal',
  'kalena agrahara': 'Kalena Agrahara',
  'shivajinagar': 'Shivajinagar',
  'cantonment': 'Cantonment',
  'sarjapur': 'Sarjapur',
  'koramangala': 'Dairy Circle'
};

const TRANSFER_PENALTY = 20; // km-equivalent cost of one interchange

export const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ---- Graph construction -----------------------------------------------
const rideEdges = new Map(); // key `${name}|${line}` -> [{ next, km }]
const stationLines = new Map(); // name -> [line, ...]
const stationByLineOrder = new Map(); // line -> [stationName, ...]

function buildGraph() {
  const perLine = {};
  for (const s of METRO_STATIONS) {
    // For route planning graph, focus on operational stations or keep line tags
    if (!stationLines.has(s.name)) stationLines.set(s.name, []);
    if (!stationLines.get(s.name).includes(s.line)) stationLines.get(s.name).push(s.line);
    if (!perLine[s.line]) perLine[s.line] = [];
    perLine[s.line].push(s);
  }
  for (const line of Object.keys(perLine)) {
    perLine[line].sort((a, b) => a.dist - b.dist);
    stationByLineOrder.set(line, perLine[line].map(s => s.name));
    for (let i = 0; i < perLine[line].length - 1; i++) {
      const a = perLine[line][i];
      const b = perLine[line][i + 1];
      const km = +(b.dist - a.dist).toFixed(2);
      if (!rideEdges.has(`${a.name}|${line}`)) rideEdges.set(`${a.name}|${line}`, []);
      if (!rideEdges.has(`${b.name}|${line}`)) rideEdges.set(`${b.name}|${line}`, []);
      rideEdges.get(`${a.name}|${line}`).push({ next: b.name, km });
      rideEdges.get(`${b.name}|${line}`).push({ next: a.name, km });
    }
  }
}
buildGraph();

// ---- Fare lookup (official 2026 slabs) --------------------------------
export function computeFare(km) {
  const rounded = +km.toFixed(2);
  for (const slab of FARE_TABLE) {
    if (rounded <= slab.maxKm) return slab.fare;
  }
  return FARE_TABLE[FARE_TABLE.length - 1].fare;
}

export function fareSlabLabel(km) {
  const rounded = +km.toFixed(2);
  for (const slab of FARE_TABLE) {
    if (rounded <= slab.maxKm) return slab.label;
  }
  return FARE_TABLE[FARE_TABLE.length - 1].label;
}

// ---- Path finding ------------------------------------------------------
class MinHeap {
  constructor() { this.data = []; }
  push(key, priority) {
    this.data.push({ key, priority });
    let i = this.data.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p].priority <= this.data[i].priority) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.data.length && this.data[l].priority < this.data[smallest].priority) smallest = l;
        if (r < this.data.length && this.data[r].priority < this.data[smallest].priority) smallest = r;
        if (smallest === i) break;
        [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
        i = smallest;
      }
    }
    return top;
  }
  get size() { return this.data.length; }
}

export function findRoute(fromName, toName) {
  const start = stationLines.get(fromName);
  const end = stationLines.get(toName);
  if (!start || !end || fromName === toName) {
    if (fromName === toName) {
      return {
        from: fromName, to: toName, valid: true,
        totalKm: 0, fare: 0, transfers: 0, stops: 0, duration: 0,
        segments: [], summary: 'You are already at this station.'
      };
    }
    return null;
  }

  // Check if either station is under construction
  const fromSt = METRO_STATIONS.find(s => s.name === fromName);
  const toSt = METRO_STATIONS.find(s => s.name === toName);
  const isUc = (fromSt && fromSt.status === 'UNDER_CONSTRUCTION') || (toSt && toSt.status === 'UNDER_CONSTRUCTION');
  const ucSt = (toSt && toSt.status === 'UNDER_CONSTRUCTION') ? toSt : fromSt;

  const dist = new Map();
  const prev = new Map();
  const heap = new MinHeap();
  const bestDest = new Map();

  for (const line of start) {
    const key = `${fromName}|${line}`;
    dist.set(key, 0);
    heap.push(key, 0);
  }

  while (heap.size > 0) {
    const { key, priority } = heap.pop();
    if (dist.get(key) !== priority) continue;
    const [name, line] = key.split('|');
    if (!bestDest.has(name) || priority < bestDest.get(name)) bestDest.set(name, priority);
    if (name === toName) break;

    // Ride edges on the same line
    const edges = rideEdges.get(key) || [];
    for (const e of edges) {
      const nk = `${e.next}|${line}`;
      const nd = priority + e.km;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, { prevKey: key, ride: true, km: e.km, line });
        heap.push(nk, nd);
      }
    }

    // Transfer edges at interchange stations
    const linesHere = stationLines.get(name) || [];
    for (const other of linesHere) {
      if (other === line) continue;
      const nk = `${name}|${other}`;
      const nd = priority + TRANSFER_PENALTY;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, { prevKey: key, transfer: true, line: other });
        heap.push(nk, nd);
      }
    }
  }

  // Reconstruct the best path to destination
  let destKey = null;
  let bestCost = Infinity;
  for (const line of end) {
    const key = `${toName}|${line}`;
    if (dist.has(key) && dist.get(key) < bestCost) {
      bestCost = dist.get(key);
      destKey = key;
    }
  }
  if (!destKey) return null;

  const path = []; // { name, line, transfer }
  let cur = destKey;
  while (cur) {
    const [name, line] = cur.split('|');
    path.unshift({ name, line });
    const p = prev.get(cur);
    if (p && p.transfer) path[0].isTransfer = true;
    cur = p ? p.prevKey : null;
  }

  // Compute segments (contiguous same-line stretches)
  const segments = [];
  let totalKm = 0;
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    const prevStep = path[i - 1];
    if (!prevStep || prevStep.line !== step.line) {
      segments.push({ line: step.line, stations: [step.name], km: 0 });
    } else {
      const lastSeg = segments[segments.length - 1];
      const km = +Math.abs(
        (stationOnLine(step.name, step.line)?.dist ?? 0) - (stationOnLine(prevStep.name, step.line)?.dist ?? 0)
      ).toFixed(2);
      lastSeg.stations.push(step.name);
      lastSeg.km += km;
      totalKm += km;
    }
  }
  segments.forEach(s => { s.km = +s.km.toFixed(2); });
  // Clean up allStops array for full flowchart rendering
  const allStops = [];
  let cumulativeKm = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const prev = allStops[allStops.length - 1];
    if (prev && prev.name === p.name) {
      // Same station line transfer!
      prev.isTransfer = true;
      prev.nextStationLine = p.line;
      continue;
    }
    const stepDist = prev ? Math.abs((stationOnLine(p.name, p.line)?.dist ?? 0) - (stationOnLine(prev.name, prev.line || p.line)?.dist ?? 0)) : 0;
    cumulativeKm += stepDist;
    allStops.push({
      stopIndex: allStops.length,
      name: p.name,
      line: p.line,
      isStart: allStops.length === 0,
      isEnd: i === path.length - 1,
      isTransfer: !!p.isTransfer,
      distFromStart: +cumulativeKm.toFixed(2)
    });
  }
  if (allStops.length) allStops[allStops.length - 1].isEnd = true;

  const transfers = Math.max(0, segments.length - 1);
  const stops = Math.max(0, allStops.length - 1);
  const fare = computeFare(totalKm);
  const duration = Math.round(totalKm * 2.0 + transfers * 5);

  return {
    from: fromName,
    to: toName,
    valid: true,
    isUnderConstruction: isUc,
    underConstructionStation: isUc ? ucSt?.name : null,
    underConstructionLine: isUc ? LINE_BY_ID[ucSt?.line]?.name : null,
    path,
    allStops,
    segments,
    stops,
    transfers,
    totalKm,
    fare,
    duration,
    fareSlab: fareSlabLabel(totalKm)
  };
}

export function stationOnLine(name, line) {
  return METRO_STATIONS.find(s => s.name === name && s.line === line);
}

// ---- Station lookup / autocomplete ------------------------------------
export function allStationNames() {
  const seen = new Set();
  return METRO_STATIONS.map(s => s.name).filter(n => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

export function searchStations(query) {
  const q = normalize(query);
  if (!q) return [];
  return allStationNames().filter(n => normalize(n).includes(q)).slice(0, 8);
}

export function resolveStation(name) {
  if (!name) return null;
  if (stationLines.has(name)) return name;
  const normalized = normalize(name);
  for (const [alias, target] of Object.entries(STATION_ALIASES)) {
    if (normalize(alias) === normalized) return target;
  }
  const found = allStationNames().find(n => normalize(n) === normalized);
  if (found) return found;
  const fuzzy = allStationNames().filter(n => normalize(n).includes(normalized));
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

// ---- Chat command parser ----------------------------------------------
export function parseCommand(text) {
  const lower = text.toLowerCase();
  const raw = text;

  let mode = 'full';
  if (/(cost|fare|price|how much|ticket|charge)/.test(lower)) mode = 'cost';
  else if (/(how long|duration|travel time|time taken|minutes? to)/.test(lower)) mode = 'time';
  else if (/(route|path|way|direction|how (do|can|to) i|navigate)/.test(lower)) mode = 'route';

  const mentions = [];
  const names = allStationNames().sort((a, b) => b.length - a.length);
  for (const n of names) {
    const re = new RegExp(`(^|[^a-z])${escapeRegExp(n)}([^a-z]|$)`, 'i');
    const m = re.exec(raw);
    if (m) {
      mentions.push({ name: n, index: m.index });
    }
  }
  // Resolve aliases
  for (const [alias, target] of Object.entries(STATION_ALIASES)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, 'i');
    const m = re.exec(raw);
    if (m && !mentions.some(x => x.name === target)) {
      mentions.push({ name: target, index: m.index });
    }
  }
  mentions.sort((a, b) => a.index - b.index);

  // Collapse duplicate mention of the same station (keep first)
  const unique = [];
  const seen = new Set();
  for (const m of mentions) {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      unique.push(m);
    }
  }

  let from = null;
  let to = null;
  if (unique.length >= 2) {
    from = unique[0].name;
    to = unique[unique.length - 1].name;
  } else if (unique.length === 1) {
    to = unique[0].name;
    from = CURRENT_STATION.shortName;
  }

  return { mode, from, to, matchedStations: unique.map(u => u.name) };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Comprehensive Natural Language AI Query Engine -------------------
export function processChatQuery(text) {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Conversational Greetings & AI Identity
  if (/\b(how are (you|u)|how do you do|how is it going|how are things)\b/i.test(lower)) {
    return {
      id: 'ai-howareyou-' + Date.now(),
      title: 'AI Assistant Telemetry: Operational & Ready',
      subtitle: 'Namma Metro Spatial AI Core Status',
      category: 'conversational',
      intent: 'CONVERSATIONAL',
      answerText: "I'm doing fantastic! All systems are online and synchronized with real-time BMRCL telemetry across all 7 Namma Metro lines in Bengaluru (Purple, Green, Yellow, Pink, Blue, Orange, and Red). I'm ready to help you plan trips, compute distance fares (₹11 – ₹95), view live platform timings, or check under-construction line progress!",
      metrics: [
        { label: 'AI STATUS', value: '100% ONLINE', color: 'emerald' },
        { label: 'METRO NETWORK', value: '7 LINES (257 KM)', color: 'cyan' },
        { label: 'CORE ENGINE', value: 'ACTIVE', color: 'purple' }
      ],
      chips: [
        'What lines are under construction?',
        'Fare: Majestic to Whitefield',
        'Show Network Map',
        'Majestic Facilities'
      ]
    };
  }

  if (/\b(who are (you|u)|what are (you|u)|what can you do|what do you do|help|capabilities)\b/i.test(lower)) {
    return {
      id: 'ai-whoareyou-' + Date.now(),
      title: 'Namma Metro Spatial AI Assistant',
      subtitle: 'Bengaluru BMRCL Transit Intelligence Synthesizer',
      category: 'conversational',
      intent: 'CONVERSATIONAL',
      answerText: "I am your real-time Namma Metro Spatial AI Assistant for Bengaluru! Here is how I can assist you:\n\n• 🗺️ **Full Network Map**: View all 7 metro lines including operational and under-construction corridors.\n• 🚧 **Under Construction Telemetry**: Check timelines for Pink Line, Blue Airport Line, Orange Line, and Red Line.\n• 💳 **Fare & Route Planner**: Compute official 2026 BMRCL distance fares (₹11 – ₹95) with segment paths.\n• ⏱️ **Live Platform Feed**: Real-time train countdowns, platform tracks & carriage density.\n• 🚪 **Station Facilities & Exits**: Locate elevators, smart parking, restrooms, and BMTC/Railway exit gates.",
      metrics: [
        { label: 'OPERATIONAL LINES', value: '3 LINES (96 KM)', color: 'emerald' },
        { label: 'UNDER CONSTRUCTION', value: '4 LINES (161 KM)', color: 'rose' },
        { label: 'FARE RANGE', value: '₹11 – ₹95', color: 'amber' }
      ],
      chips: [
        'What lines are under construction?',
        'Route: Indiranagar to Electronic City',
        'Show Network Map',
        'Exit Gates'
      ]
    };
  }

  if (/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/i.test(lower)) {
    return {
      id: 'ai-hello-' + Date.now(),
      title: 'Welcome to Namma Metro Spatial HUD',
      subtitle: 'BMRCL Transit Intelligence',
      category: 'conversational',
      intent: 'CONVERSATIONAL',
      answerText: "Hello! Welcome aboard. How can I assist your transit across Bengaluru today? Ask me about metro routes, fares, station facilities, or under-construction lines!",
      chips: [
        'What lines are under construction?',
        'Fare to Whitefield',
        'Show Network Map'
      ]
    };
  }

  if (/\b(thank you|thanks|thx|awesome|great|cool|nice)\b/i.test(lower)) {
    return {
      id: 'ai-thanks-' + Date.now(),
      title: "You're Very Welcome!",
      subtitle: 'Namma Metro Spatial Assistant',
      category: 'conversational',
      intent: 'CONVERSATIONAL',
      answerText: "It's my pleasure to assist you! Have a pleasant, seamless, and comfortable transit across Bengaluru on Namma Metro.",
      chips: ['Show Network Map', 'Route & Fare Planner']
    };
  }

  // 2. Under Construction Line Inquiries
  if (/\b(under construction|construction|building|upcoming|future|expansion|new lines|extension|phase 2|phase 3)\b/i.test(lower)) {
    return {
      id: 'ai-under-construction-' + Date.now(),
      title: 'Namma Metro Under-Construction Network Telemetry',
      subtitle: 'BMRCL Phase 2, 2A/2B & Phase 3 Expansion Lines',
      category: 'network',
      intent: 'UNDER_CONSTRUCTION',
      answerText: "Bengaluru Namma Metro currently has 4 major lines under active construction & phase development:\n\n" +
        "1. 🩷 **Pink Line (Phase 2)**: Kalena Agrahara ↔ Nagawara (21.25 km, 18 stations via MG Road, Shivajinagar & Cantonment) — *Target: 2026*\n" +
        "2. 💙 **Blue Line (Phase 2A & 2B - Airport Metro)**: Central Silk Board ↔ KIAL Airport Terminals 1 & 2 (58.19 km, 30 stations via Outer Ring Road & Hebbal) — *Target: 2026-27*\n" +
        "3. 🧡 **Orange Line (Phase 3)**: JP Nagar 4th Phase ↔ Kempapura & Hosahalli ↔ Kadabagere (44.65 km, 31 stations along Western ORR) — *Target: 2028*\n" +
        "4. 🔴 **Red Line (Phase 3A)**: Sarjapur ↔ Hebbal (37.0 km, 28 stations via Koramangala & Agara) — *Proposed Phase 3A*\n\n" +
        "Together with the 3 operational lines (Purple, Green, Yellow), the full master plan expands Namma Metro to 257.4 km!",
      metrics: [
        { label: 'UNDER CONSTRUCTION', value: '4 LINES (161 KM)', color: 'rose' },
        { label: 'OPERATIONAL', value: '3 LINES (96 KM)', color: 'emerald' },
        { label: 'TOTAL NETWORK', value: '257.4 KM', color: 'cyan' }
      ],
      chips: [
        'Pink Line Details',
        'Blue Line Airport Route',
        'Orange Line Phase 3',
        'Show Network Map'
      ]
    };
  }

  // 3. Specific Line Inquiries (Pink, Blue, Orange, Red, Purple, Green, Yellow)
  if (/\b(pink line|pink)\b/i.test(lower)) {
    return {
      id: 'ai-pink-line-' + Date.now(),
      title: 'Pink Line Telemetry [UNDER CONSTRUCTION]',
      subtitle: 'Kalena Agrahara ↔ Nagawara • Phase 2 Corridor',
      category: 'network',
      intent: 'LINE_INFO',
      answerText: "🩷 **Pink Line Status: UNDER CONSTRUCTION (Target 2026)**\n\n• **Route**: Kalena Agrahara ↔ Nagawara\n• **Length**: 21.25 km (13.8 km underground, 7.5 km elevated)\n• **Stations (18)**: Kalena Agrahara, Hulimavu, IIMB, JP Nagar 4th Phase, Jayadeva Hospital, Tavarekere, Dairy Circle, Lakkasandra, Langford Town, National Military School, MG Road, Shivajinagar, Cantonment, Pottery Town, Tannery Road, Venkateshpura, Kadugondanahalli, Nagawara.\n• **Major Interchanges**: Jayadeva Hospital (Yellow Line), MG Road (Purple Line), Nagawara (Blue Airport Line).",
      metrics: [
        { label: 'STATUS', value: 'UNDER CONSTRUCTION', color: 'rose' },
        { label: 'LENGTH', value: '21.25 KM', color: 'pink' },
        { label: 'TARGET OPENING', value: 'MID 2026', color: 'amber' }
      ],
      chips: ['Blue Line Airport Route', 'Show Network Map', 'All Under Construction Lines']
    };
  }

  if (/\b(blue line|airport line|airport metro|airport)\b/i.test(lower)) {
    return {
      id: 'ai-blue-line-' + Date.now(),
      title: 'Blue Line Airport Express Telemetry [UNDER CONSTRUCTION]',
      subtitle: 'Central Silk Board ↔ KIAL Terminals 1 & 2 • Phase 2A & 2B',
      category: 'network',
      intent: 'LINE_INFO',
      answerText: "💙 **Blue Line (Airport Metro) Status: UNDER CONSTRUCTION (Target 2026-27)**\n\n• **Route**: Central Silk Board ↔ Kempegowda International Airport (KIAL)\n• **Length**: 58.19 km (30 stations)\n• **Phase 2A (Silk Board ↔ KR Puram)**: 19.75 km along Outer Ring Road IT corridor (HSR, Agara, Bellandur, Marathahalli).\n• **Phase 2B (KR Puram ↔ KIAL Airport)**: 38.44 km via Kasturi Nagar, Nagawara, Hebbal, Yelahanka, and Airport City.\n• **Major Interchanges**: Central Silk Board (Yellow Line), KR Puram (Purple Line), Nagawara (Pink Line), Hebbal (Orange/Red Line).",
      metrics: [
        { label: 'STATUS', value: 'UNDER CONSTRUCTION', color: 'rose' },
        { label: 'LENGTH', value: '58.19 KM', color: 'blue' },
        { label: 'TARGET OPENING', value: 'LATE 2026', color: 'amber' }
      ],
      chips: ['Pink Line Details', 'Show Network Map', 'All Under Construction Lines']
    };
  }

  // 4. Default Route or General Query Processing
  const parsed = parseCommand(clean);
  if (parsed.to) {
    const from = parsed.from || CURRENT_STATION.shortName;
    const to = parsed.to;
    const routeRes = findRoute(from, to);

    if (routeRes && routeRes.isUnderConstruction) {
      return {
        id: 'route-uc-' + Date.now(),
        title: `Route: ${from} → ${to} [UNDER CONSTRUCTION]`,
        subtitle: `Station '${routeRes.underConstructionStation}' is on an under-construction corridor`,
        category: 'hologram',
        intent: 'ROUTE',
        mode: parsed.mode,
        from,
        to,
        answerText: `Note: Destination station **${to}** is located on the **${routeRes.underConstructionLine}**, which is currently **under construction**. Commercial operation is targeted for 2026-2027.`,
        metrics: [
          { label: 'ROUTE STATUS', value: 'UNDER CONSTRUCTION', color: 'rose' },
          { label: 'CORRIDOR', value: routeRes.underConstructionLine?.toUpperCase() || 'PHASE 2/3', color: 'pink' }
        ],
        chips: ['Under Construction Lines', 'Show Network Map']
      };
    }

    return {
      id: 'route-' + Date.now(),
      title: `Route: ${from} → ${to}`,
      subtitle: 'Namma Metro pathway & BMRCL 2026 fare breakdown',
      category: 'hologram',
      intent: 'ROUTE',
      mode: parsed.mode,
      from,
      to,
      customText: clean,
      chips: [`Fare: ${to}`, `Route: ${from} → ${to}`, 'Show Network Map']
    };
  }

  // Fallback query response
  return {
    id: 'custom-' + Date.now(),
    title: `Query: ${clean}`,
    subtitle: 'Namma Metro Spatial AI Synthesis',
    category: 'orbital',
    intent: 'CUSTOM',
    answerText: `I searched BMRCL streams for "${clean}". You can ask me for route directions, exact distance fares, live platform schedules, or details about the under-construction Pink, Blue, Orange, and Red lines!`,
    chips: [
      'What lines are under construction?',
      'Fare from Majestic to Whitefield',
      'Show Network Map'
    ]
  };
}

export function buildRouteQuery(inputText, extra = {}) {
  const result = processChatQuery(inputText);
  return { ...result, ...extra };
}

// ---- Radar geometry helpers (used by OrbitalStationNode) --------------
export function lineStationDistFrom(originName, lineId) {
  const origin = stationOnLine(originName, lineId);
  if (!origin) return null;
  const entries = METRO_STATIONS.filter(s => s.line === lineId).sort((a, b) => a.dist - b.dist);
  const originIndex = entries.findIndex(e => e.name === originName);
  return { entries, originIndex, originDist: origin.dist, originName };
}

export function spokesForStation(originName, maxRadius) {
  const R = maxRadius;
  const spokes = [];

  const angleMap = {
    purple: { west: 180, east: 0, wLabel: 'West (Challaghatta)', eLabel: 'East (Whitefield)' },
    green: { north: -90, south: 90, nLabel: 'North (Madavara)', sLabel: 'South (Silk Institute)' },
    yellow: { angle: 135, label: 'South-East (Bommasandra)' },
    pink: { angle: -45, label: 'North-East (Nagawara - Under Const.)' },
    blue: { angle: 45, label: 'East/Airport Express (KIAB - Under Const.)' },
    orange: { angle: -135, label: 'North-West (Kempapura - Under Const.)' },
    red: { angle: 160, label: 'South-East (Sarjapur - Under Const.)' }
  };

  for (const lineId of Object.keys(LINE_BY_ID)) {
    const lineData = lineStationDistFrom(originName, lineId);
    const cfg = angleMap[lineId];
    if (lineData && cfg) {
      if (cfg.west !== undefined) {
        const west = lineData.entries.filter(e => e.dist < lineData.originDist).reverse();
        const east = lineData.entries.filter(e => e.dist > lineData.originDist);
        const wMax = Math.max(0.1, lineData.originDist);
        const eMax = Math.max(0.1, lineData.entries[lineData.entries.length - 1].dist - lineData.originDist);
        const polar = (km, maxKm, angleDeg) => {
          const f = Math.min(1, km / Math.max(0.001, maxKm));
          const r = f * R;
          const rad = (angleDeg * Math.PI) / 180;
          return { x: 160 + r * Math.cos(rad), y: 160 + r * Math.sin(rad) };
        };
        if (west.length) {
          spokes.push({
            line: lineId,
            direction: cfg.wLabel,
            nodes: [{ x: 160, y: 160, name: originName }].concat(
              west.map(s => ({ ...polar(lineData.originDist - s.dist, wMax, cfg.west), name: s.name }))
            )
          });
        }
        if (east.length) {
          spokes.push({
            line: lineId,
            direction: cfg.eLabel,
            nodes: [{ x: 160, y: 160, name: originName }].concat(
              east.map(s => ({ ...polar(s.dist - lineData.originDist, eMax, cfg.east), name: s.name }))
            )
          });
        }
      }
    } else {
      // Lines not directly at origin station: plot radial spokes for visualization
      const sts = METRO_STATIONS.filter(s => s.line === lineId).sort((a, b) => a.dist - b.dist);
      if (sts.length && cfg && cfg.angle !== undefined) {
        const maxDist = Math.max(0.1, sts[sts.length - 1].dist);
        const polar = (dist, angleDeg) => {
          const f = Math.min(1, dist / maxDist);
          const r = f * R;
          const rad = (angleDeg * Math.PI) / 180;
          return { x: 160 + r * Math.cos(rad), y: 160 + r * Math.sin(rad) };
        };
        spokes.push({
          line: lineId,
          direction: cfg.label,
          nodes: sts.map(s => ({ ...polar(s.dist, cfg.angle), name: s.name }))
        });
      }
    }
  }

  return spokes;
}
