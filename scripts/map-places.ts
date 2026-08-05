/**
 * VANISHING POINTS — Place Mapping Engine
 * ========================================
 * Auto-assigns tiers, connections, unlock conditions, and narrative roles
 * to your 150+ place corpus. Run this against your MongoDB export or seed JSON.
 *
 * Usage:
 *   npx ts-node map-places.ts --input places.json --output mapped-places.json
 *   npx ts-node map-places.ts --mongo "mongodb://localhost:27017/vanishing" --output mapped-places.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — Tune these to match your corpus density
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  // Tier assignment thresholds
  tiers: {
    0: { maxDanger: 2, statuses: ['verified'], requiresHauntingReports: false, requiresResonanceNote: false },
    1: { maxDanger: 3, statuses: ['verified', 'pending'], requiresHauntingReports: true, requiresResonanceNote: false },
    2: { maxDanger: 5, statuses: ['sealed', 'whispered', 'verified'], requiresHauntingReports: true, requiresResonanceNote: true },
    3: { statuses: ['mirage', 'whispered'], requiresHauntingReports: true, requiresResonanceNote: true },
  },

  // Dust economy
  dustGates: {
    tier0: null,
    tier1: { min: 10, max: 25 },
    tier2: { min: 35, max: 65 },
    tier3: { min: 80, max: 120 },
  },

  // Connection web parameters
  connections: {
    maxConnectionsPerPlace: 5,
    minConnectionsPerPlace: 1,
    proximityRadiusKm: 800,        // Geographic clustering radius
    crossTierProbability: 0.35,    // Chance for a Tier N place to connect to Tier N+1
    backlinkProbability: 0.15,     // Chance for Tier N to connect back to Tier N-1
    criticalPathAnchors: [         // These MUST be connected to the main web
      'pripyat-amusement-park',
      'pripyat-hospital-126',
      'duga-radar-array',
      'duga-control-room',
      'chernobyl-reactor-4-control-room',
      'eastern-state-penitentiary',
      'aokigahara-forest',
      'the-grid-null-point',
    ],
  },

  // Narrative role assignment
  roles: {
    baselineRatio: 0.25,      // ~25% of corpus = Tier 0
    patternRatio: 0.28,       // ~28% = Tier 1
    impossibleRatio: 0.27,    // ~27% = Tier 2
    framebreakRatio: 0.20,    // ~20% = Tier 3
  },

  // Unlock condition templates by tier
  unlockTemplates: {
    tier1: [
      { type: 'dust', value: 15, message: 'The grid requires more dust to resolve this location.' },
      { type: 'dust', value: 20, message: 'Accumulate dust to access this sector.' },
      { type: 'visit', value: 3, message: 'Investigate 3 verified locations to unlock.' },
    ],
    tier2: [
      { type: 'dust', value: 40, message: 'The grid will not show this ruin to the unclaimed. Accumulate more dust.' },
      { type: 'dust', value: 50, message: 'This sector is sealed. Dust accumulation required.' },
      { type: 'dust', value: 60, message: 'The archive remembers those who remember. Earn more dust.' },
      { type: 'evidence', value: 10, message: 'Collect 10 evidence items to breach the seal.' },
    ],
    tier3: [
      { type: 'dust', value: 80, message: 'The null point is not a place. It is an absence. Maximum dust required.' },
      { type: 'dust', value: 100, message: 'This coordinate exists only in the space between memories.' },
      { type: 'code', value: 'RESONANCE', message: 'A resonance code is required. Find it in another investigation.' },
      { type: 'reading', value: 'bunker7-transmission-6', message: 'Wait for BUNKER_7 to reveal the path.' },
    ],
  },

  // Resonance note templates by tier
  resonanceTemplates: {
    tier2: [
      "The readings here do not match any known telemetry. Something is counting down.",
      "I have archived this location {viewCount} times. The file is different each time.",
      "The previous investigator left a note in the margin. It is in your handwriting.",
      "This place hums at a frequency that should not propagate through air.",
      "The coordinates drift by 0.003 degrees when no one is observing.",
    ],
    tier3: [
      "I do not know if I placed this file here, or if it placed itself.",
      "The Archive has started referring to this location in first person.",
      "This coordinate is not on any map. It is only in the database. I checked twice.",
      "The evidence here predates the location. The photograph is dated 1843. The building was constructed in 1971.",
      "You have been here before. The file says you have not. I believe the file.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface RawPlace {
  slug: string;
  name: string;
  category: 'abandoned' | 'haunted' | 'both';
  coordinates: [number, number]; // [lng, lat]
  address?: { city?: string; country?: string; formatted?: string };
  yearAbandoned?: number;
  history?: string;
  hauntingReports?: string[];
  dangerLevel?: number;
  photos?: string[];
  status?: string;
  viewCount?: number;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  connectedTo?: string[];
  unlockCondition?: any;
  resonanceNote?: string;
  [key: string]: any;
}

interface MappedPlace extends RawPlace {
  tier: number;
  narrativeRole: string;
  connectedTo: string[];
  unlockCondition?: any;
  resonanceNote?: string;
  dustValue?: number;
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLon = (b[0] - a[0]) * Math.PI / 180;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i) | 0;
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  const idx = Math.floor(Math.abs(rng()) * arr.length) % arr.length;
  return arr[idx];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────
// TIER ASSIGNMENT
// ─────────────────────────────────────────────────────────────

function assignTiers(places: RawPlace[]): Map<string, number> {
  const tiers = new Map<string, number>();
  const total = places.length;
  const counts = {
    0: Math.floor(total * CONFIG.roles.baselineRatio),
    1: Math.floor(total * CONFIG.roles.patternRatio),
    2: Math.floor(total * CONFIG.roles.impossibleRatio),
    3: total - Math.floor(total * CONFIG.roles.baselineRatio) - Math.floor(total * CONFIG.roles.patternRatio) - Math.floor(total * CONFIG.roles.impossibleRatio),
  };

  // Score each place for tier affinity
  const scored = places.map((p) => {
    let score = 0;
    const dl = p.dangerLevel || 1;
    const hr = (p.hauntingReports || []).length;
    const hasRN = !!p.resonanceNote;
    const st = p.status || 'verified';

    // Tier 3 indicators (strongest)
    if (st === 'mirage') score += 100;
    if (hasRN && hr > 3 && dl >= 4) score += 80;
    if (p.history?.includes('player') || p.history?.includes('Archive') || p.history?.includes('BUNKER')) score += 60;

    // Tier 2 indicators
    if (st === 'sealed') score += 50;
    if (dl >= 4) score += 40;
    if (hasRN) score += 30;
    if (hr >= 3) score += 20;

    // Tier 1 indicators
    if (hr > 0 && hr < 3) score += 10;
    if (dl === 3) score += 10;

    // Tier 0 indicators (negative score)
    if (st === 'verified' && dl <= 2 && hr === 0 && !hasRN) score -= 50;
    if (p.category === 'abandoned' && !hr) score -= 30;

    return { place: p, score };
  });

  // Sort by score descending (highest = most anomalous = highest tier)
  scored.sort((a, b) => b.score - a.score);

  // Assign tiers respecting counts
  let assigned = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const { place, score } of scored) {
    let tier = 0;
    if (score > 60 && assigned[3] < counts[3]) tier = 3;
    else if (score > 30 && assigned[2] < counts[2]) tier = 2;
    else if (score > 5 && assigned[1] < counts[1]) tier = 1;
    else if (assigned[0] < counts[0]) tier = 0;
    else {
      // Fallback: find tier with remaining capacity
      for (let t = 3; t >= 0; t--) {
        if (assigned[t as keyof typeof assigned] < counts[t as keyof typeof counts]) {
          tier = t;
          break;
        }
      }
    }
    tiers.set(place.slug, tier);
    assigned[tier as keyof typeof assigned]++;
  }

  // Force critical path anchors to their intended tiers
  const anchorTiers: Record<string, number> = {
    'eastern-state-penitentiary': 0,
    'aokigahara-forest': 1,
    'pripyat-amusement-park': 1,
    'pripyat-hospital-126': 2,
    'duga-radar-array': 2,
    'duga-control-room': 2,
    'chernobyl-reactor-4-control-room': 2,
    'the-grid-null-point': 3,
  };
  for (const [slug, tier] of Object.entries(anchorTiers)) {
    if (tiers.has(slug)) tiers.set(slug, tier);
  }

  return tiers;
}

// ─────────────────────────────────────────────────────────────
// CONNECTION WEB GENERATION
// ─────────────────────────────────────────────────────────────

function generateConnections(places: RawPlace[], tiers: Map<string, number>): Map<string, string[]> {
  const connections = new Map<string, string[]>();

  // Deep validation: log any places missing critical fields
  const badPlaces = places.filter((p) => !p || !p.slug || !Array.isArray(p.coordinates) || p.coordinates.length !== 2);
  if (badPlaces.length > 0) {
    console.warn(`[VP-MAP] WARNING: ${badPlaces.length} places have missing/invalid slug or coordinates`);
    badPlaces.slice(0, 3).forEach((p, i) => {
      console.warn(`[VP-MAP] Bad place #${i}:`, JSON.stringify(p).slice(0, 120));
    });
  }

  const validPlaces = places.filter((p) => p && p.slug && Array.isArray(p.coordinates) && p.coordinates.length === 2);
  const slugs = validPlaces.map((p) => p.slug);
  const rng = seededRandom('vanishing-points-v1');

  if (validPlaces.length === 0) {
    console.warn('[VP-MAP] WARNING: No valid places for connection generation');
    return connections;
  }

  // Initialize empty arrays
  for (const slug of slugs) connections.set(slug, []);

  // 1. Proximity connections (geographic clustering)
  for (let i = 0; i < validPlaces.length; i++) {
    const a = validPlaces[i];
    const nearby = validPlaces
      .filter((b, j) => i !== j)
      .map((b) => ({ slug: b.slug, dist: haversineKm(a.coordinates, b.coordinates) }))
      .filter((n) => n.dist < CONFIG.connections.proximityRadiusKm)
      .sort((x, y) => x.dist - y.dist)
      .slice(0, 2);

    for (const n of nearby) {
      const curr = connections.get(a.slug);
      if (!curr) continue;
      if (curr.length < CONFIG.connections.maxConnectionsPerPlace && !curr.includes(n.slug)) {
        curr.push(n.slug);
        const other = connections.get(n.slug);
        if (other && !other.includes(a.slug)) other.push(a.slug);
      }
    }
  }

  // 2. Cross-tier narrative bridges
  for (const place of validPlaces) {
    const tier = tiers.get(place.slug);
    if (tier === undefined) continue;
    const curr = connections.get(place.slug);
    if (!curr || curr.length >= CONFIG.connections.maxConnectionsPerPlace) continue;

    // Forward connection (Tier N → Tier N+1)
    if (tier < 3 && rng() < CONFIG.connections.crossTierProbability) {
      const higher = validPlaces.filter((p) => tiers.get(p.slug) === tier + 1 && p.slug !== place.slug);
      if (higher.length > 0) {
        const target = pick(higher, rng);
        if (!target || !target.slug) {
          console.warn(`[VP-MAP] pick() returned invalid target from higher tier for ${place.slug}`);
          continue;
        }
        if (!curr.includes(target.slug)) {
          curr.push(target.slug);
          const other = connections.get(target.slug);
          if (other && !other.includes(place.slug)) other.push(place.slug);
        }
      }
    }

    // Backlink (Tier N → Tier N-1)
    if (tier > 0 && rng() < CONFIG.connections.backlinkProbability) {
      const lower = validPlaces.filter((p) => tiers.get(p.slug) === tier - 1 && p.slug !== place.slug);
      if (lower.length > 0) {
        const target = pick(lower, rng);
        if (!target || !target.slug) {
          console.warn(`[VP-MAP] pick() returned invalid target from lower tier for ${place.slug}`);
          continue;
        }
        if (!curr.includes(target.slug)) {
          curr.push(target.slug);
          const other = connections.get(target.slug);
          if (other && !other.includes(place.slug)) other.push(place.slug);
        }
      }
    }
  }

  // 3. Thematic connections (same category)
  for (const place of validPlaces) {
    const curr = connections.get(place.slug);
    if (!curr || curr.length >= CONFIG.connections.maxConnectionsPerPlace) continue;

    const sameCat = validPlaces.filter(
      (p) => p.category === place.category && p.slug !== place.slug && !curr.includes(p.slug)
    );
    if (sameCat.length > 0 && rng() < 0.25) {
      const target = pick(sameCat, rng);
      if (!target || !target.slug) {
        console.warn(`[VP-MAP] pick() returned invalid target from same category for ${place.slug}`);
        continue;
      }
      curr.push(target.slug);
      const other = connections.get(target.slug);
      if (other && !other.includes(place.slug)) other.push(place.slug);
    }
  }

  // 4. Critical path anchoring — ensure anchors are woven into the main web
  const anchors = CONFIG.connections.criticalPathAnchors.filter((s) => slugs.includes(s));
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const curr = connections.get(a);
    if (!curr) continue;

    // Connect to next anchor if possible
    const next = anchors[i + 1];
    if (next && !curr.includes(next)) {
      curr.push(next);
      const other = connections.get(next);
      if (other && !other.includes(a)) other.push(a);
    }

    // Ensure minimum connectivity
    if (curr.length === 0) {
      const candidates = validPlaces.filter((p) => p.slug !== a);
      if (candidates.length > 0) {
        const target = pick(candidates, rng);
        if (!target || !target.slug) {
          console.warn(`[VP-MAP] pick() returned invalid target for anchor ${a}`);
          continue;
        }
        curr.push(target.slug);
        const other = connections.get(target.slug);
        if (other && !other.includes(a)) other.push(a);
      }
    }
  }

  // 5. Trim excess connections
  for (const [slug, conns] of connections) {
    if (conns.length > CONFIG.connections.maxConnectionsPerPlace) {
      connections.set(slug, shuffle(conns, rng).slice(0, CONFIG.connections.maxConnectionsPerPlace));
    }
  }

  return connections;
}

// ─────────────────────────────────────────────────────────────
// UNLOCK CONDITIONS & RESONANCE NOTES
// ─────────────────────────────────────────────────────────────

function generateUnlockConditions(places: RawPlace[], tiers: Map<string, number>): Map<string, any> {
  const conditions = new Map<string, any>();
  const rng = seededRandom('unlock-seed-v1');

  for (const place of places) {
    const tier = tiers.get(place.slug)!;
    if (tier === 0) continue;

    const templates = CONFIG.unlockTemplates[`tier${tier}` as keyof typeof CONFIG.unlockTemplates];
    if (!templates || templates.length === 0) continue;

    const template = pick(templates, rng);
    const condition: any = { ...template };
    // Vary dust values within range
    if (template.type === 'dust' && tier > 0 && typeof template.value === 'number') {
      condition.value = Math.floor(template.value + rng() * 15);
    }
    conditions.set(place.slug, condition);
  }

  return conditions;
}

function generateResonanceNotes(places: RawPlace[], tiers: Map<string, number>): Map<string, string> {
  const notes = new Map<string, string>();
  const rng = seededRandom('resonance-seed-v1');

  for (const place of places) {
    const tier = tiers.get(place.slug)!;
    if (tier < 2) continue;
    if (place.resonanceNote) {
      notes.set(place.slug, place.resonanceNote); // Preserve manual notes
      continue;
    }

    const templates = CONFIG.resonanceTemplates[`tier${tier}` as keyof typeof CONFIG.resonanceTemplates];
    if (!templates) continue;

    let note = pick(templates, rng);
    note = note.replace('{viewCount}', String(place.viewCount || Math.floor(rng() * 2000 + 100)));
    notes.set(place.slug, note);
  }

  return notes;
}

// ─────────────────────────────────────────────────────────────
// NARRATIVE ROLE ASSIGNMENT
// ─────────────────────────────────────────────────────────────

function assignNarrativeRole(place: RawPlace, tier: number): string {
  const dl = place.dangerLevel || 1;
  const hr = (place.hauntingReports || []).length;

  if (tier === 0) {
    if (dl <= 1) return 'baseline_safe';
    return 'baseline_cautionary';
  }
  if (tier === 1) {
    if (hr >= 2) return 'pattern_dense';
    return 'pattern_introductory';
  }
  if (tier === 2) {
    if (place.status === 'sealed') return 'impossible_sealed';
    if (dl >= 5) return 'impossible_lethal';
    return 'impossible_unstable';
  }
  if (tier === 3) {
    if (place.status === 'mirage') return 'framebreak_mirage';
    if (place.history?.includes('player') || place.history?.includes('Archive')) return 'framebreak_self';
    return 'framebreak_impossible';
  }
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────────────────────────

function mapPlaces(rawPlaces: RawPlace[]): MappedPlace[] {
  // Filter out invalid entries from MongoDB export
  const places = rawPlaces.filter((p) => {
    if (!p || typeof p !== 'object') return false;
    if (!p.slug || typeof p.slug !== 'string') {
      console.warn(`[VP-MAP] Skipping place with missing/invalid slug:`, p._id || p.name || JSON.stringify(p).slice(0, 80));
      return false;
    }
    if (!p.coordinates || !Array.isArray(p.coordinates) || p.coordinates.length !== 2) {
      console.warn(`[VP-MAP] Skipping place '${p.slug}' with missing/invalid coordinates`);
      return false;
    }
    return true;
  });

  console.log(`\n[VP-MAP] Processing ${places.length} places...`);
  console.log(`[VP-MAP] Filtered out ${rawPlaces.length - places.length} invalid entries`);

  // 1. Assign tiers
  const tiers = assignTiers(places);
  const tierCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const t of tiers.values()) tierCounts[t as keyof typeof tierCounts]++;
  console.log(`[VP-MAP] Tier distribution: T0=${tierCounts[0]}, T1=${tierCounts[1]}, T2=${tierCounts[2]}, T3=${tierCounts[3]}`);

  // 2. Generate connection webs
  const connections = generateConnections(places, tiers);
  const totalConns = Array.from(connections.values()).reduce((a, b) => a + b.length, 0);
  console.log(`[VP-MAP] Generated ${totalConns} bidirectional connections`);

  // 3. Generate unlock conditions
  const unlocks = generateUnlockConditions(places, tiers);
  console.log(`[VP-MAP] Assigned ${unlocks.size} unlock conditions`);

  // 4. Generate resonance notes
  const resonance = generateResonanceNotes(places, tiers);
  console.log(`[VP-MAP] Assigned ${resonance.size} resonance notes`);

  // 5. Assemble mapped places
  const mapped: MappedPlace[] = places.map((p) => {
    const tier = tiers.get(p.slug)!;
    return {
      ...p,
      tier,
      narrativeRole: assignNarrativeRole(p, tier),
      connectedTo: connections.get(p.slug) || [],
      ...(unlocks.has(p.slug) ? { unlockCondition: unlocks.get(p.slug) } : {}),
      ...(resonance.has(p.slug) ? { resonanceNote: resonance.get(p.slug) } : {}),
      // Ensure required fields exist
      hauntingReports: p.hauntingReports || [],
      photos: p.photos || [],
      status: p.status || 'verified',
      dangerLevel: p.dangerLevel || 1,
      viewCount: p.viewCount || 0,
    };
  });

  // 6. Validation
  const orphaned = mapped.filter((p) => p.connectedTo.length === 0);
  if (orphaned.length > 0) {
    console.warn(`[VP-MAP] WARNING: ${orphaned.length} places have zero connections`);
    console.warn(`[VP-MAP] Orphaned: ${orphaned.map((p) => p.slug).join(', ')}`);
  }

  const overconnected = mapped.filter((p) => p.connectedTo.length > CONFIG.connections.maxConnectionsPerPlace);
  if (overconnected.length > 0) {
    console.warn(`[VP-MAP] WARNING: ${overconnected.length} places exceed max connections`);
  }

  return mapped;
}

// ─────────────────────────────────────────────────────────────
// I/O HANDLERS
// ─────────────────────────────────────────────────────────────

function loadFromJson(filePath: string): RawPlace[] {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (Array.isArray(data)) return data;
  if (data.places) return data.places;
  throw new Error('JSON must be an array of places or { places: [...] }');
}

function loadFromMongoUri(uri: string): Promise<RawPlace[]> {
  // Dynamic require to avoid hard dependency — only used with --mongo flag
  // @ts-ignore
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  return MongoClient.connect(uri).then((client: any) => {
    const db = client.db();
    return db.collection('places').find({}).toArray().finally(() => client.close());
  });
}

function saveOutput(mapped: MappedPlace[], filePath: string) {
  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalPlaces: mapped.length,
      tierDistribution: mapped.reduce((acc, p) => {
        acc[p.tier] = (acc[p.tier] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      totalConnections: mapped.reduce((a, p) => a + p.connectedTo.length, 0),
      totalUnlockConditions: mapped.filter((p) => p.unlockCondition).length,
      totalResonanceNotes: mapped.filter((p) => p.resonanceNote).length,
    },
    places: mapped,
  };
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`[VP-MAP] Saved ${mapped.length} mapped places to ${filePath}`);
}

function generateSeedScript(mapped: MappedPlace[], filePath: string) {
  const seedScript = `// Auto-generated seed script — Vanishing Points
// Run this in your MongoDB shell or via mongoose

const SEED_DATA = ${JSON.stringify(mapped, null, 2)};

// Insert or update
for (const place of SEED_DATA) {
  db.places.updateOne(
    { slug: place.slug },
    { $set: place },
    { upsert: true }
  );
}

print("Seeded " + SEED_DATA.length + " places");
`;
  fs.writeFileSync(filePath, seedScript);
  console.log(`[VP-MAP] Saved MongoDB seed script to ${filePath}`);
}

// ─────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const inputFlag = args.indexOf('--input');
  const mongoFlag = args.indexOf('--mongo');
  const outputFlag = args.indexOf('--output');
  const seedFlag = args.indexOf('--seed');

  const outputPath = outputFlag >= 0 ? args[outputFlag + 1] : 'mapped-places.json';
  const seedPath = seedFlag >= 0 ? args[seedFlag + 1] : 'seed-places.js';

  let rawPlaces: RawPlace[];

  if (inputFlag >= 0) {
    const inputPath = args[inputFlag + 1];
    console.log(`[VP-MAP] Loading from JSON: ${inputPath}`);
    rawPlaces = loadFromJson(inputPath);
  } else if (mongoFlag >= 0) {
    const uri = args[mongoFlag + 1];
    console.log(`[VP-MAP] Loading from MongoDB...`);
    rawPlaces = await loadFromMongoUri(uri);
  } else {
    console.log(`
Vanishing Points — Place Mapping Engine
========================================

Usage:
  npx ts-node map-places.ts --input places.json --output mapped.json
  npx ts-node map-places.ts --mongo "mongodb://localhost:27017/vp" --output mapped.json --seed seed.js

Options:
  --input <path>     Path to JSON file (array of places or { places: [...] })
  --mongo <uri>      MongoDB connection string
  --output <path>    Output JSON path (default: mapped-places.json)
  --seed <path>      Also generate MongoDB seed script (default: seed-places.js)
    `);
    process.exit(0);
  }

  const mapped = mapPlaces(rawPlaces);
  saveOutput(mapped, outputPath);
  generateSeedScript(mapped, seedPath);

  // Print sample
  console.log('\n[VP-MAP] Sample mapped place:');
  const sample = mapped.find((p) => p.slug === 'the-grid-null-point') || mapped[0];
  console.log(JSON.stringify(sample, null, 2));
}

main().catch((err) => {
  console.error('[VP-MAP] Fatal error:', err);
  process.exit(1);
});