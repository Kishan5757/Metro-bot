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
  'kadugodi': 'Whitefield'
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
  totalKm = +totalKm.toFixed(2);

  const transfers = Math.max(0, segments.length - 1);
  const stops = path.length - 1;
  const fare = computeFare(totalKm);
  const duration = Math.round(totalKm * 2.0 + transfers * 5);

  return {
    from: fromName,
    to: toName,
    valid: true,
    path,
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

export function buildRouteQuery(inputText, extra = {}) {
  const parsed = parseCommand(inputText);
  if (!parsed.to) return null;
  const from = parsed.from || CURRENT_STATION.shortName;
  const to = parsed.to;
  return {
    id: 'route-' + Date.now(),
    title: `Route: ${from} → ${to}`,
    subtitle: 'Namma Metro pathway & total fare',
    category: 'hologram',
    intent: 'ROUTE',
    mode: parsed.mode,
    from,
    to,
    customText: inputText,
    chips: [`Fare: ${to}`, `Route: ${from} → ${to}`],
    ...extra
  };
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
  const purple = lineStationDistFrom(originName, 'purple');
  const green = lineStationDistFrom(originName, 'green');
  const yellow = METRO_STATIONS.filter(s => s.line === 'yellow').sort((a, b) => a.dist - b.dist);

  const R = maxRadius;
  const spokes = [];

  const purpleWestMax = purple ? purple.originDist : 0;
  const purpleEastMax = purple ? purple.entries[purple.entries.length - 1].dist - purple.originDist : 0;
  const greenNorthMax = green ? green.originDist : 0;
  const greenSouthMax = green ? green.entries[green.entries.length - 1].dist - green.originDist : 0;
  const yellowMax = yellow[yellow.length - 1].dist;

  const polar = (km, maxKm, angleDeg) => {
    const f = Math.min(1, km / Math.max(0.001, maxKm));
    const r = f * R;
    const rad = (angleDeg * Math.PI) / 180;
    return { x: 160 + r * Math.cos(rad), y: 160 + r * Math.sin(rad) };
  };

  if (purple) {
    const west = purple.entries.filter(e => e.dist < purple.originDist).reverse();
    const east = purple.entries.filter(e => e.dist > purple.originDist);
    if (west.length) {
      spokes.push({
        line: 'purple',
        direction: 'West (Challaghatta)',
        nodes: [{ x: 160, y: 160, name: originName }].concat(
          west.map(s => ({ ...polar(purple.originDist - s.dist, purpleWestMax, 180), name: s.name }))
        )
      });
    }
    if (east.length) {
      spokes.push({
        line: 'purple',
        direction: 'East (Whitefield)',
        nodes: [{ x: 160, y: 160, name: originName }].concat(
          east.map(s => ({ ...polar(s.dist - purple.originDist, purpleEastMax, 0), name: s.name }))
        )
      });
    }
  }

  if (green) {
    const north = green.entries.filter(e => e.dist < green.originDist).reverse();
    const south = green.entries.filter(e => e.dist > green.originDist);
    if (north.length) {
      spokes.push({
        line: 'green',
        direction: 'North (Madavara)',
        nodes: [{ x: 160, y: 160, name: originName }].concat(
          north.map(s => ({ ...polar(green.originDist - s.dist, greenNorthMax, -90), name: s.name }))
        )
      });
    }
    if (south.length) {
      spokes.push({
        line: 'green',
        direction: 'South (Silk Institute)',
        nodes: [{ x: 160, y: 160, name: originName }].concat(
          south.map(s => ({ ...polar(s.dist - green.originDist, greenSouthMax, 90), name: s.name }))
        )
      });
    }
  }

  // Yellow starts at RV Road (an interchange on the green south spoke)
  const rvNode = yellow.length ? polar(yellow[yellow.length - 1].dist, yellowMax, 135) : null;
  const rvDistFromGreen = green ? green.entries.find(e => e.name === 'Rashtreeya Vidyalaya Road')?.dist - green.originDist : null;
  const rvPolar = rvDistFromGreen != null ? polar(rvDistFromGreen, greenSouthMax, 90) : null;
  if (yellow.length) {
    spokes.push({
      line: 'yellow',
      direction: 'South-East (Bommasandra)',
      nodes: [
        { x: rvPolar ? rvPolar.x : 160, y: rvPolar ? rvPolar.y : 160, name: 'Rashtreeya Vidyalaya Road' }
      ].concat(
        yellow.filter(s => s.name !== 'Rashtreeya Vidyalaya Road').map(s => ({ ...polar(s.dist, yellowMax, 135), name: s.name }))
      )
    });
  }

  return spokes;
}
