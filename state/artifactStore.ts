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
    markings: [ {
        id: "mark-coils",
        label: "Contact Terminals", name: "Contact Terminals", title: "Contact Terminals",
        coordinates: { x: 50, y: 50 },
        revealedInMode: "uv",
        clueText: "ENGRAVED VECTOR CODES: 38.000°N, 97.000°W (The center of the wheat spiral in Kansas. Do not follow the lines.)" } ] as any
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
    markings: [ {
        id: "mark-fractures",
        label: "Bedrock Fractures", name: "Bedrock Fractures", title: "Bedrock Fractures",
        coordinates: { x: 30, y: 70 },
        revealedInMode: "uv",
        clueText: "4.5 Hz resonance frequency wave pattern physically etched directly into the quartz crystals." } ] as any
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
    markings: [ {
        id: "mark-hands",
        label: "Fused Dial Hands", name: "Fused Dial Hands", title: "Fused Dial Hands",
        coordinates: { x: 45, y: 45 },
        revealedInMode: "uv",
        clueText: "The silver hands are locked at precisely 01:23:45 AM (The exact second of the Reactor 4 explosion)." } ] as any
  }
];

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
