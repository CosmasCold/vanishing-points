import { create } from 'zustand';
import { PhysicalArtifact, ArtifactMarking } from '@/types/artifacts';

interface ArtifactState {
  activeArtifact: PhysicalArtifact | null;
  rotation: number;
  zoom: number;
  lampMode: 'standard' | 'magnify' | 'uv' | 'measure';
  activeMarking: ArtifactMarking | null;
  inventory: PhysicalArtifact[];
  
  openArtifact: (artifact: PhysicalArtifact) => void;
  closeArtifact: () => void;
  rotate: (degrees: number) => void;
  setZoom: (zoom: number) => void;
  adjustZoom: (delta: number) => void;
  setLampMode: (mode: 'standard' | 'magnify' | 'uv' | 'measure') => void;
  inspectMarking: (marking: ArtifactMarking | null) => void;
  addToInventory: (artifact: PhysicalArtifact) => void;
  updateArtifact: (id: string, partial: Partial<PhysicalArtifact>) => void;
}

// Lore-seeded anomalous artifacts in Carrel #7-B containment locker [108]
const SEEDED_ARTIFACTS: PhysicalArtifact[] = [
  {
    id: "art-vance-cassette",
    name: "Keeper's Final Log Cassette",
    description: "A black magnetic cassette containing Edward Vance's final recorded log from St. Elmo Light. The shell is aged but intact; the original label remains attached.",
    material: "plastic" as any,
    condition: "aged" as any,
    weight: "38g",
    dimensions: "10cm x 6.3cm x 1.2cm",
    origin: "St. Elmo Light Station Archive",
    dateRecovered: "1942-03-14",
    recoveredBy: "Coast Guard District 13",
    quarantineStatus: "cleared",
    hasBeenWeighed: false,
    hasBeenPhotographed: false,
    hasBeenScanned: false,
    relatedPlaceSlugs: ["stelmo-light"],
    relatedEvidenceIds: [],
    markings: [
      {
        id: "mark-vance-mechanical-wear",
        label: "Mechanical Wear",
        coordinates: { x: 28, y: 72 },
        revealedInMode: "magnify",
        clueText:
          "Localized wear follows the cassette label / housing seam. The pattern is inconsistent with ordinary archival handling.",
        type: "damage",
        description:
          "Localized mechanical wear around the cassette label and housing seam. The wear establishes a physical discrepancy, but not who or what produced it.",
        location: "label / housing seam",
        requiresMagnification: true,
        requiresUV: false,
      }
    ]
  },

  {
    id: "art-solenoid",
    name: "Fused Solenoid Core (M-11A)",
    description: "An old telegraph contact coil recovered from the base of the St. Elmo light tower. The heavy copper wire wraps are completely fused together, as if struck by a localized high-voltage static surge.",
    material: "brass" as any,
    condition: "aged" as any,
    weight: "112g",
    dimensions: "4cm x 2cm x 2cm",
    origin: "St. Elmo Light Tower Base",
    dateRecovered: "1942-03-15",
    recoveredBy: "Coast Guard Unit 13",
    quarantineStatus: "anomalous",
    hasBeenWeighed: true,
    hasBeenPhotographed: true,
    hasBeenScanned: true,
    relatedPlaceSlugs: ["stelmo-light"],
    relatedEvidenceIds: ["doc-stelmo-001"],
    markings: [
      {
        id: "mark-coils",
        label: "Contact Terminals",
        coordinates: { x: 50, y: 50 },
        revealedInMode: "uv",
        clueText: "ENGRAVED VECTOR CODES: 38.000°N, 97.000°W (The center of the wheat spiral in Kansas. Do not follow the lines.)"
      }
    ]
  },
  {
    id: "art-core",
    name: "Kola Core Segment (Borehole-12)",
    description: "A dark cylindrical segment of crystalline granite extracted from the deep Kola Peninsula drill site at 12,262 meters. The mineral grains exhibit abnormal structural stress.",
    material: "granite" as any,
    condition: "aged" as any,
    weight: "420g",
    dimensions: "12cm x 3cm cylinder",
    origin: "Kola Peninsula Drill Site",
    dateRecovered: "1983-10-14",
    recoveredBy: "Soviet Geologists Team",
    quarantineStatus: "anomalous",
    hasBeenWeighed: true,
    hasBeenPhotographed: true,
    hasBeenScanned: true,
    relatedPlaceSlugs: ["kola-superdeep-borehole"],
    relatedEvidenceIds: [],
    markings: [
      {
        id: "mark-fractures",
        label: "Bedrock Fractures",
        coordinates: { x: 30, y: 70 },
        revealedInMode: "uv",
        clueText: "4.5 Hz resonance frequency wave pattern physically etched directly into the quartz crystals."
      }
    ]
  },
  {
    id: "art-watch",
    name: "Melted Silver Pocketwatch",
    description: "A charred mechanical pocketwatch recovered from the Saint-Martin ruins. The silver casing is scorched and warped, and the glass face has melted and fused directly to the hands.",
    material: "silver" as any,
    condition: "corrupted" as any,
    weight: "85g",
    dimensions: "5cm diameter",
    origin: "Oradour-sur-Glane Ruins",
    dateRecovered: "1946-06-12",
    recoveredBy: "FEMA Archival Recovery Team",
    quarantineStatus: "anomalous",
    hasBeenWeighed: true,
    hasBeenPhotographed: true,
    hasBeenScanned: true,
    relatedPlaceSlugs: ["oradour-church-crypt"],
    relatedEvidenceIds: ["doc-ora-001"],
    markings: [
      {
        id: "mark-hands",
        label: "Fused Dial Hands",
        coordinates: { x: 45, y: 45 },
        revealedInMode: "uv",
        clueText: "The silver hands are locked at precisely 01:23:45 AM (The exact second of the Reactor 4 explosion)."
      }
    ]
  }
,
  {
    id: "art-asbestos",
    name: "Wittenoom Blue Crocidolite Fiber",
    description: "A blue asbestos sample, completely sealed in a glass jar, which under co-axial UV lights reveals glowing, microscopic, unredacted state declassification stamps.",
    material: "organic" as any,
    condition: "weathered" as any,
    weight: "45g",
    dimensions: "6cm x 3cm x 3cm jar",
    origin: "Wittenoom Blue Mine",
    dateRecovered: "2007-08-31",
    recoveredBy: "System Scribe",
    quarantineStatus: "anomalous",
    hasBeenWeighed: true,
    hasBeenPhotographed: true,
    hasBeenScanned: true,
    relatedPlaceSlugs: ["wittenoom"],
    relatedEvidenceIds: ["doc-wit-001"],
    markings: [ {
        id: "mark-fibers",
        type: "inscription",
        description: "Glowing, microscopic, unredacted state declassification stamps.",
        location: "underside",
        requiresMagnification: true,
        requiresUV: true,
        label: "State Stamp", name: "State Stamp", title: "State Stamp",
        coordinates: { x: 50, y: 75 },
        revealedInMode: "uv",
        clueText: "DEGAZETTED COORDINATE SECURED: [-22.14°S, 118.33°E]. The town of Wittenoom has been unwritten." } ] as any
  },
  {
    id: "art-scale",
    name: "Humberstone Brass Organ Weight",
    description: "A heavy brass scale weight recovered from the saltpeter morgue. Under UV light, geodetic coordinates are etched into its base.",
    material: "metal" as any,
    condition: "corroded" as any,
    weight: "340g",
    dimensions: "4cm x 4cm cylinder",
    origin: "Humberstone Saltpeter Morgue",
    dateRecovered: "1960-11-30",
    recoveredBy: "Dr. Volkov",
    quarantineStatus: "anomalous",
    hasBeenWeighed: true,
    hasBeenPhotographed: true,
    hasBeenScanned: true,
    relatedPlaceSlugs: ["humberstone-saltpeter-morgue"],
    relatedEvidenceIds: ["doc-hmo-001"],
    markings: [ {
        id: "mark-weights",
        type: "inscription",
        description: "Geodetic coordinates etched into the base.",
        location: "edge",
        requiresMagnification: false,
        requiresUV: true,
        label: "Geodetic Calibration", name: "Geodetic Calibration", title: "Geodetic Calibration",
        coordinates: { x: 45, y: 45 },
        revealedInMode: "uv",
        clueText: "MORGUE COORDINATE STAMP: [-20.2085°S, -69.7945°W]. Scale weight matches the mass of a human heart." } ] as any
  }];

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  activeArtifact: null,
  rotation: 0,
  zoom: 1,
  lampMode: 'standard',
  activeMarking: null,
  inventory: SEEDED_ARTIFACTS, // Seeding our 3 beautiful atmospheric quarantine items directly!

  openArtifact: (artifact) => set({
    activeArtifact: artifact,
    rotation: 0,
    zoom: 1,
    lampMode: 'standard',
    activeMarking: null,
  }),
  
  closeArtifact: () => set({ activeArtifact: null, activeMarking: null }),
  
  rotate: (degrees) => set((s) => ({
    rotation: (s.rotation + degrees) % 360,
  })),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(4, zoom)) }),
  
  adjustZoom: (delta) => set((s) => ({
    zoom: Math.max(0.5, Math.min(4, s.zoom + delta)),
  })),
  
  setLampMode: (lampMode) => set({ lampMode }),
  
  inspectMarking: (activeMarking) => set({ activeMarking }),
  
  addToInventory: (artifact) => set((s) => {
    if (s.inventory.find((a) => a.id === artifact.id)) return s;
    return { inventory: [...s.inventory, artifact] };
  }),
  
  updateArtifact: (id, partial) => set((s) => ({
    inventory: s.inventory.map((a) => a.id === id ? { ...a, ...partial } : a),
    activeArtifact: s.activeArtifact?.id === id ? { ...s.activeArtifact, ...partial } : s.activeArtifact,
  })),
}));