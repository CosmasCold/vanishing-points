export type ArtifactMaterial =
  | 'metal'
  | 'glass'
  | 'ceramic'
  | 'wood'
  | 'fabric'
  | 'paper'
  | 'stone'
  | 'organic'
  | 'unknown';

export type ArtifactCondition =
  | 'pristine'
  | 'weathered'
  | 'corroded'
  | 'damaged'
  | 'fragmentary';

export interface ArtifactMarking {
  id: string;
  label: string;
  coordinates: {
    x: number;
    y: number;
  };
  revealedInMode: 'standard' | 'magnify' | 'uv' | 'measure';
  clueText: string;

  // Optional legacy metadata retained for existing artifact records and UI.
  type?: 'inscription' | 'serial' | 'symbol' | 'damage' | 'residue';
  description?: string;
  location?: string;
  requiresMagnification?: boolean;
  requiresUV?: boolean;
}


export interface PhysicalArtifact {
  id: string;
  name: string;
  description: string;
  material: ArtifactMaterial;
  condition: ArtifactCondition;
  weight: string; // e.g., "12g", "340g"
  dimensions: string; // e.g., "4cm x 2cm x 0.5cm"
  origin: string; // Where it was found
  dateRecovered: string;
  recoveredBy: string;
  quarantineStatus: 'cleared' | 'pending' | 'anomalous';

  markings: ArtifactMarking[];
  relatedPlaceSlugs: string[];
  relatedEvidenceIds: string[];

  // Examination state
  hasBeenWeighed: boolean;
  hasBeenPhotographed: boolean;
  hasBeenScanned: boolean;
}