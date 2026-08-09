// ============================================================
// BENGALURU NAMMA METRO - SPATIAL HUD DATA
// Operational network (2026): Purple, Green, Yellow lines
// Fares: BMRCL annual revision effective 09 Feb 2026
// ============================================================

export const METRO_LINES = [
  {
    id: 'purple',
    name: 'Purple Line',
    short: 'PURPLE',
    color: '#8b5cf6',
    dark: '#6d3fd1',
    bgClass: 'bg-purple-500/10 text-purple-300 border-purple-500/40',
    route: 'Whitefield ↔ Challaghatta',
    length: 43.7,
    stationCount: 37,
    firstTrain: '05:00 AM',
    lastTrain: '11:00 PM',
    description: 'East-West corridor via MG Road, Majestic & Kengeri'
  },
  {
    id: 'green',
    name: 'Green Line',
    short: 'GREEN',
    color: '#10b981',
    dark: '#0a8f5d',
    bgClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    route: 'Madavara ↔ Silk Institute',
    length: 33.5,
    stationCount: 32,
    firstTrain: '05:00 AM',
    lastTrain: '11:00 PM',
    description: 'North-South corridor via Yeshwanthpur, Majestic & Jayanagar'
  },
  {
    id: 'yellow',
    name: 'Yellow Line',
    short: 'YELLOW',
    color: '#f5b81e',
    dark: '#c99414',
    bgClass: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    route: 'RV Road ↔ Delta Electronics Bommasandra',
    length: 19.2,
    stationCount: 16,
    firstTrain: '06:00 AM',
    lastTrain: '11:55 PM',
    description: 'Electronic City IT corridor via Silk Board & BTM Layout'
  }
];

export const LINE_BY_ID = Object.fromEntries(METRO_LINES.map(l => [l.id, l]));

// ---- Station definitions per line ------------------------------------
// dist = distance in km from the line's western/southern origin
// x / y = schematic map coordinates (viewBox 0 0 1280 1400)

const LINE_DEFS = {
  purple: {
    xBase: 20,
    xStep: 34,
    yFixed: 460,
    names: [
      'Challaghatta', 'Kengeri', 'Kengeri Bus Terminal', 'Pattanagere', 'Jnanabharathi',
      'Rajarajeshwari Nagar', 'Nayandahalli', 'Mysuru Road', 'Deepanjali Nagar', 'Attiguppe',
      'Vijayanagar', 'Hosahalli', 'Magadi Road', 'City Railway Station', 'Majestic',
      'Sir M. Visveshwaraya', 'Vidhana Soudha', 'Cubbon Park', 'MG Road', 'Trinity',
      'Halasuru', 'Indiranagar', 'Swami Vivekananda Road', 'Baiyappanahalli', 'Benniganahalli',
      'Krishnarajapura', 'Singayyanapalya', 'Garudacharapalya', 'Hoodi', 'Seetharamapalya',
      'Kundalahalli', 'Nallurhalli', 'Sri Sathya Sai Hospital', 'Pattandur Agrahara',
      'Kadugodi Tree Park', 'Hopefarm Channasandra', 'Whitefield'
    ],
    dist: [
      0, 1.6, 3.2, 4.8, 6.4, 8.0, 9.6, 11.2, 12.7, 14.2,
      15.7, 17.2, 18.6, 20.0, 21.4, 22.7, 24.0, 25.3, 26.6, 27.9,
      29.2, 30.5, 31.8, 33.1, 34.7, 36.3, 37.4, 38.5, 39.6, 40.7,
      41.8, 42.6, 42.9, 43.2, 43.5, 43.6, 43.7
    ]
  },
  green: {
    names: [
      'Madavara', 'Chikkabidarakallu', 'Manjunath Nagar', 'Nagasandra', 'Dasarahalli',
      'Jalahalli', 'Peenya Industry', 'Peenya', 'Goraguntepalya', 'Yeshwanthpur',
      'Sandal Soap Factory', 'Mahalakshmi', 'Rajajinagar', 'Kuvempu Road', 'Srirampura',
      'Mantri Square', 'Majestic', 'Chickpete', 'Krishna Rajendra Market', 'National College',
      'Lalbagh', 'South End Circle', 'Jayanagar', 'Rashtreeya Vidyalaya Road', 'Banashankari',
      'Jaya Prakash Nagar', 'Yelachenahalli', 'Konankunte Cross', 'Doddakallasandra',
      'Vajarahalli', 'Thalaghattapura', 'Silk Institute'
    ],
    dist: [
      0, 1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9,
      11.0, 12.1, 13.2, 14.3, 15.4, 16.5, 17.6, 18.7, 19.8, 20.9,
      22.0, 23.1, 24.2, 25.3, 26.4, 27.5, 28.6, 29.7, 30.8, 31.9,
      33.0, 33.5
    ],
    x: Array(32).fill(496),
    y: [10, 38, 66, 94, 122, 150, 178, 206, 234, 262, 290, 318, 346, 374, 402, 430, 460, 490, 520, 550, 580, 610, 640, 670, 700, 730, 760, 790, 820, 850, 880, 910]
  },
  yellow: {
    names: [
      'Rashtreeya Vidyalaya Road', 'Ragigudda', 'Jayadeva Hospital', 'BTM Layout',
      'Central Silk Board', 'Bommanahalli', 'Hongasandra', 'Kudlu Gate', 'Singasandra',
      'Hosa Road', 'Beratena Agrahara', 'Electronic City', 'Infosys Foundation Konappana Agrahara',
      'Huskur Road', 'Biocon Hebbagodi', 'Delta Electronics Bommasandra'
    ],
    dist: [
      0, 1.5, 3.0, 4.5, 6.0, 7.3, 8.6, 9.9, 11.2, 12.5,
      13.8, 15.1, 16.4, 17.5, 18.4, 19.2
    ],
    x: [496, 544, 592, 640, 688, 736, 784, 832, 880, 928, 976, 1024, 1072, 1120, 1168, 1216],
    y: [670, 718, 766, 814, 862, 910, 958, 1006, 1054, 1102, 1150, 1198, 1246, 1294, 1342, 1390]
  }
};

export const METRO_STATIONS = [];
for (const line of Object.keys(LINE_DEFS)) {
  const cfg = LINE_DEFS[line];
  cfg.names.forEach((name, i) => {
    const x = cfg.x ? cfg.x[i] : cfg.xBase + i * cfg.xStep;
    const y = cfg.y ? cfg.y[i] : cfg.yFixed;
    METRO_STATIONS.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      line,
      dist: cfg.dist[i],
      x,
      y
    });
  });
}

// Interchange detection: station name present on more than one line
const _lineSet = {};
METRO_STATIONS.forEach(s => { _lineSet[s.name] = _lineSet[s.name] || new Set(); _lineSet[s.name].add(s.line); });
export const INTERCHANGE_STATIONS = Object.entries(_lineSet)
  .filter(([, lines]) => lines.size > 1)
  .map(([name, lines]) => ({
    name,
    lines: [...lines],
    station: METRO_STATIONS.find(s => s.name === name)
  }));

export const CURRENT_STATION = {
  id: 'majestic',
  name: 'Nadaprabhu Kempegowda (Majestic)',
  shortName: 'Majestic',
  code: 'NKG-01',
  zone: 'Central Bengaluru Hub',
  lines: ['purple', 'green'],
  interchanges: ['Purple Line', 'Green Line'],
  platformCount: 4,
  walkingDistance: '0 min (You are here)',
  crowdDensity: 76,
  status: 'NORMAL_OPERATION'
};

// ---- 2026 BMRCL distance-based fare slabs (effective 09 Feb 2026) ----
export const FARE_TABLE = [
  { maxKm: 2, fare: 11, label: '0-2 km' },
  { maxKm: 4, fare: 21, label: '2-4 km' },
  { maxKm: 6, fare: 32, label: '4-6 km' },
  { maxKm: 8, fare: 42, label: '6-8 km' },
  { maxKm: 10, fare: 53, label: '8-10 km' },
  { maxKm: 15, fare: 63, label: '10-15 km' },
  { maxKm: 20, fare: 74, label: '15-20 km' },
  { maxKm: 25, fare: 84, label: '20-25 km' },
  { maxKm: Infinity, fare: 95, label: '>25 km' }
];

export const FARE_MAX = 95;
export const FARE_MIN = 11;

// ---- Real-time platform feed at Majestic (Purple/Green) & RV Road (Yellow) ----
export const INITIAL_PLATFORM_SCHEDULES = [
  {
    id: 'P-1042',
    line: 'purple',
    lineName: 'Purple Line',
    color: '#8b5cf6',
    destination: 'Whitefield (Kadugodi)',
    platform: 'Platform 1',
    track: 'Track T1',
    etaSeconds: 42,
    delayMinutes: 0,
    status: 'ON_TIME',
    crowdingPct: 34,
    crowdLabel: 'Low Density',
    carriages: [20, 25, 40, 50, 30, 20]
  },
  {
    id: 'P-1007',
    line: 'purple',
    lineName: 'Purple Line',
    color: '#8b5cf6',
    destination: 'Challaghatta',
    platform: 'Platform 2',
    track: 'Track T2',
    etaSeconds: 118,
    delayMinutes: 2,
    status: 'DELAYED',
    delayReason: 'Signal interlock clearance at Magadi Road junction',
    crowdingPct: 82,
    crowdLabel: 'High Density',
    carriages: [90, 85, 88, 75, 80, 70]
  },
  {
    id: 'G-2019',
    line: 'green',
    lineName: 'Green Line',
    color: '#10b981',
    destination: 'Silk Institute',
    platform: 'Platform 3',
    track: 'Track T3',
    etaSeconds: 195,
    delayMinutes: 0,
    status: 'ON_TIME',
    crowdingPct: 48,
    crowdLabel: 'Moderate Density',
    carriages: [40, 50, 45, 55, 60, 40]
  },
  {
    id: 'G-2054',
    line: 'green',
    lineName: 'Green Line',
    color: '#10b981',
    destination: 'Madavara',
    platform: 'Platform 4',
    track: 'Track T4',
    etaSeconds: 340,
    delayMinutes: 0,
    status: 'ON_TIME',
    crowdingPct: 22,
    crowdLabel: 'Low Density',
    carriages: [15, 20, 25, 30, 20, 15]
  },
  {
    id: 'Y-3012',
    line: 'yellow',
    lineName: 'Yellow Line',
    color: '#f5b81e',
    destination: 'Delta Electronics Bommasandra',
    platform: 'Platform 5',
    track: 'RV Road',
    etaSeconds: 260,
    delayMinutes: 0,
    status: 'ON_TIME',
    crowdingPct: 61,
    crowdLabel: 'Moderate Density',
    note: 'Via Rashtreeya Vidyalaya Road interchange',
    carriages: [55, 60, 58, 65, 50, 45]
  }
];

// ---- Facilities at Majestic station ----
export const STATION_FACILITIES = [
  {
    id: 'elev-1',
    name: 'Elevator North (Subway Entrance)',
    category: 'elevators',
    type: 'Elevator',
    status: 'OPERATIONAL',
    health: 98,
    location: 'Gandhinagar Subway → Platforms 1/2',
    accessible: true,
    lastInspection: 'Today, 08:30 AM',
    description: 'High-capacity elevator linking the Gandhinagar subway to the Purple Line platforms.'
  },
  {
    id: 'elev-2',
    name: 'Elevator South (City Market Side)',
    category: 'elevators',
    type: 'Elevator',
    status: 'MAINTENANCE',
    health: 45,
    location: 'City Market Gate → Green Line Level',
    accessible: true,
    lastInspection: 'Today, 10:15 AM (Motor Sensor Calibration)',
    description: 'Under scheduled maintenance. Alternative: Elevator North or concourse escalator bank.'
  },
  {
    id: 'wc-1',
    name: 'Universal Accessible Restrooms',
    category: 'restrooms',
    type: 'Restroom',
    status: 'OPERATIONAL',
    health: 100,
    location: 'Central Concourse - Level B1',
    accessible: true,
    occupancy: '3 / 8 Stalls Occupied',
    description: 'Touchless accessible restrooms with emergency call triggers at Majestic concourse.'
  },
  {
    id: 'park-1',
    name: 'Multi-Level Smart Parking',
    category: 'parking',
    type: 'Parking',
    status: 'OPERATIONAL',
    health: 94,
    location: 'Majestic Bus Stand Side',
    accessible: true,
    occupancy: '118 / 180 Spaces Available',
    description: 'Automated parking deck with 6 EV charging bays beside the BMTC bus terminus.'
  },
  {
    id: 'kiosk-1',
    name: 'Fare Kiosks & Ticket Counters',
    category: 'kiosks',
    type: 'Ticketing',
    status: 'OPERATIONAL',
    health: 100,
    location: 'Central Concourse Hub',
    accessible: true,
    occupancy: '12 / 12 Active',
    description: 'Token, smart card, NCMC and mobile QR ticketing terminals at the main interchange.'
  },
  {
    id: 'ramp-1',
    name: 'KSR Railway Station Skybridge Ramp',
    category: 'elevators',
    type: 'Ramp',
    status: 'OPERATIONAL',
    health: 100,
    location: 'Gate D - Railway Connection',
    accessible: true,
    description: 'Covered low-gradient walkway connecting directly to KSR Bengaluru City Railway Station.'
  }
];

// ---- Exit gates at Majestic ----
export const STATION_GATES = [
  {
    id: 'gate-a1',
    code: 'Gate A1',
    name: 'Majestic Bus Stand Gate',
    direction: 'Westbound Exits',
    status: 'OPEN',
    crowdFlow: 'High',
    elevatorAccess: true,
    landmarks: [
      { name: 'Kempegowda Bus Station (BMTC)', distance: '40m', walk: '1 min' },
      { name: 'Gandhinagar Metro Police Station', distance: '150m', walk: '2 min' }
    ],
    transfers: [
      { type: 'bus', name: 'BMTC City Bus Bay #1-#20', arrival: '1 min' },
      { type: 'taxi', name: 'Gandhinagar Taxi Stand', wait: '< 3 mins' }
    ]
  },
  {
    id: 'gate-b2',
    code: 'Gate B2',
    name: 'KSR Railway Station Connector',
    direction: 'Eastbound Exits',
    status: 'OPEN',
    crowdFlow: 'Moderate',
    elevatorAccess: true,
    landmarks: [
      { name: 'KSR Bengaluru City Railway Station', distance: '120m', walk: '2 min' },
      { name: 'Corporation Circle', distance: '200m', walk: '3 min' }
    ],
    transfers: [
      { type: 'walk', name: 'Covered Skybridge to Railway Platforms', distance: 'Direct' },
      { type: 'taxi', name: 'Railway Station Taxi Hub', wait: 'Immediate' }
    ]
  },
  {
    id: 'gate-c3',
    code: 'Gate C3',
    name: 'City Market / Chickpete Gate',
    direction: 'Southbound Exits',
    status: 'OPEN',
    crowdFlow: 'High',
    elevatorAccess: true,
    elevatorStatus: 'MAINTENANCE (Ramp Available)',
    landmarks: [
      { name: 'Krishnarajendra City Market', distance: '250m', walk: '3 min' },
      { name: 'Chickpete Commercial District', distance: '400m', walk: '5 min' }
    ],
    transfers: [
      { type: 'bus', name: 'City Market Bus Terminus', arrival: '2 mins' },
      { type: 'shuttle', name: 'Airport Vayu Vajra (KIA-9)', arrival: '15 mins' }
    ]
  },
  {
    id: 'gate-d4',
    code: 'Gate D4',
    name: 'Malleshwaram / Sampige Road Gate',
    direction: 'Northbound Exits',
    status: 'OPEN',
    crowdFlow: 'Low',
    elevatorAccess: true,
    landmarks: [
      { name: 'Mantri Mall Skywalk', distance: '100m', walk: '1 min' },
      { name: 'Malleshwaram 8th Cross', distance: '300m', walk: '4 min' }
    ],
    transfers: [
      { type: 'bike', name: 'Namma Yatri E-Bike Dock D4', available: '14 Bikes' },
      { type: 'shuttle', name: 'Malleshwaram Metro Shuttle', arrival: '5 mins' }
    ]
  }
];

// ---- Curated iconic destinations for quick fare planner ----
export const ROUTE_DESTINATIONS = [
  { id: 'whitefield', name: 'Whitefield' },
  { id: 'silkm', name: 'Silk Institute' },
  { id: 'electronic-city', name: 'Electronic City' },
  { id: 'mg-road', name: 'MG Road' },
  { id: 'indiranagar', name: 'Indiranagar' },
  { id: 'bommasandra', name: 'Delta Electronics Bommasandra' },
  { id: 'kengeri', name: 'Kengeri' },
  { id: 'krpuram', name: 'Krishnarajapura' },
  { id: 'jayanagar', name: 'Jayanagar' },
  { id: 'banashankari', name: 'Banashankari' },
  { id: 'btm-layout', name: 'BTM Layout' },
  { id: 'rajajinagar', name: 'Rajajinagar' },
  { id: 'yeshwanthpur', name: 'Yeshwanthpur' },
  { id: 'chickpete', name: 'Chickpete' }
];

// ---- Suggested canvas intents ----
export const SUGGESTED_QUERIES = [
  {
    id: 'q-network',
    title: 'Namma Metro Network Map',
    subtitle: 'Purple • Green • Yellow schematic with interchanges',
    category: 'network',
    intent: 'SHOW_NETWORK',
    chips: ['Highlight Purple', 'Highlight Green', 'Interchange Stations']
  },
  {
    id: 'q-orbital',
    title: 'Majestic Network Radar',
    subtitle: 'Radial live view of metro lines around Majestic hub',
    category: 'orbital',
    intent: 'SHOW_ORBITAL',
    chips: ['Purple Line East', 'Green Line South', 'Yellow Line Trains']
  },
  {
    id: 'q-hologram',
    title: 'Route & Fare Planner',
    subtitle: 'Real distance-based fares (₹11 – ₹95) with route paths',
    category: 'hologram',
    intent: 'SHOW_HOLOGRAM',
    chips: ['Fare to Whitefield', 'Route to Silk Institute', 'Cost: Indiranagar to Electronic City']
  },
  {
    id: 'q-timings',
    title: 'Live Platform Tracker',
    subtitle: 'Real-time arrivals at Majestic & RV Road',
    category: 'timings',
    intent: 'SHOW_TIMINGS',
    chips: ['Purple Line Trains', 'Green Line Delays', 'Yellow Line Feed']
  },
  {
    id: 'q-facility',
    title: 'Majestic Facility Matrix',
    subtitle: 'Elevators, restrooms, parking & fare kiosks',
    category: 'facility',
    intent: 'SHOW_FACILITY',
    chips: ['Show Elevators', 'Restroom Occupancy', 'Smart Parking']
  },
  {
    id: 'q-gates',
    title: 'Exit Gate & Transfer Map',
    subtitle: 'Majestic Bus Stand & KSR Railway connections',
    category: 'gates',
    intent: 'SHOW_GATES',
    chips: ['Majestic Bus Stand', 'KSR Railway Exit', 'Airport Shuttle']
  }
];
