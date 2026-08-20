/**
 * Vanishing Points
 * Shared types for the canonical 36-case narrative registry.
 *
 * This layer describes the canonical story outline only.
 * It is intentionally independent from the existing Act I runtime contract.
 */

export type CanonicalAct = 1 | 2 | 3 | 4 | 5;

export type CanonicalPhase =
  | 'GROUND STATE'
  | 'ERASED LIVES'
  | 'TEMPORAL BLEED'
  | 'THE SILENCE'
  | 'CONVERGENCE';

export type CanonicalCaseAuthoringStatus =
  | 'approved-outline'
  | 'authored-source';

export interface CanonicalCaseCompletionContract {
  requiredEvidence: string[];
  requiredHypothesisEvidence: string[];
  requiredBoardConnections: string[];
  requiredKnowledge: string[];
  requiredContradictions: string[];
  status: 'unpopulated' | 'authored-source';
}

export interface CanonicalCaseDefinition {
  order: number;
  act: CanonicalAct;
  phase: CanonicalPhase;
  slug: string;
  name: string;
  authoringStatus: CanonicalCaseAuthoringStatus;
  narrativePurpose: string;
  completion: CanonicalCaseCompletionContract;
  special?: {
    type: 'centroid-convergence';
    anchors: string[];
  };
}