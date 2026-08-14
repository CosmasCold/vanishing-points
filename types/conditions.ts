/**
 * Vanishing Points
 * Canonical progression / unlock condition types.
 *
 * This file is the single source of truth for condition shapes.
 *
 * The current corpus demonstrably uses:
 *   - dust
 *   - code
 *   - visit
 *   - reading
 *   - evidence
 *
 * Additional condition types are included here because the game
 * architecture already anticipates them, but they should not be
 * considered corpus-backed until the validator confirms their use.
 */

export type ConditionType =
  | "dust"
  | "stability"
  | "evidence"
  | "code"
  | "inventory"
  | "visit"
  | "reading"
  | "time"
  | "session"
  | "document"
  | "artifact"
  | "boardConnection"
  | "hypothesis";

export interface DustCondition {
  type: "dust";
  value: number;
  message: string;
}

export interface StabilityCondition {
  type: "stability";
  value: number;
  message: string;
}

export interface EvidenceCondition {
  type: "evidence";
  value: number;
  message: string;
}

export interface CodeCondition {
  type: "code";
  value: string;
  message: string;
}

export interface InventoryCondition {
  type: "inventory";
  value: string;
  message: string;
}

export interface VisitCondition {
  /**
   * The corpus currently uses BOTH:
   *
   *   value: 3
   *
   * meaning "visit three verified locations"
   *
   * and:
   *
   *   value: "catacombs-of-paris"
   *
   * meaning "visit this specific location".
   */
  type: "visit";
  value: number | string;
  message: string;
}

export interface ReadingCondition {
  /**
   * Example from the corpus:
   *
   *   "bunker7-transmission-6"
   */
  type: "reading";
  value: string;
  message: string;
}

export interface TimeCondition {
  type: "time";
  value: string;
  message: string;
}

export interface SessionCondition {
  type: "session";
  value: number;
  message: string;
}

export interface DocumentCondition {
  type: "document";
  value: string;
  message: string;
}

export interface ArtifactCondition {
  type: "artifact";
  value: string;
  message: string;
}

export interface BoardConnectionCondition {
  type: "boardConnection";
  value: string;
  message: string;
}

export type HypothesisState =
  | "proposed"
  | "supported"
  | "contradicted"
  | "confirmed"
  | "rejected"
  | "unresolved";

export interface HypothesisCondition {
  type: "hypothesis";
  value: string;
  state: "supported" | "confirmed";
  message: string;
}

export type Condition =
  | DustCondition
  | StabilityCondition
  | EvidenceCondition
  | CodeCondition
  | InventoryCondition
  | VisitCondition
  | ReadingCondition
  | TimeCondition
  | SessionCondition
  | DocumentCondition
  | ArtifactCondition
  | BoardConnectionCondition
  | HypothesisCondition;

/**
 * Runtime state required to evaluate a condition.
 *
 * These are intentionally primitive collections rather than Zustand
 * stores. The evaluator should remain pure and independent of UI state.
 */
export interface ConditionContext {
  dustIndex: number;

  observerStability: number;

  sessionCount: number;

  inventoryIds: Set<string>;

  visitedPlaceIds: Set<string>;

  readDocumentIds: Set<string>;

  readingIds: Set<string>;

  scannedArtifactIds: Set<string>;

  boardConnections: Set<string>;

  hypotheses: Map<string, HypothesisState>;

  codes: Set<string>;

  /**
   * Current game time identifier.
   *
   * This is deliberately a string rather than Date because the
   * eventual time-gating system may use narrative time states rather
   * than literal wall-clock time.
   */
  currentTime?: string;

  /**
   * Number of evidence items currently collected.
   */
  evidenceCount?: number;
}

export interface ConditionResult {
  unlocked: boolean;

  /**
   * The canonical player-facing explanation supplied by the condition.
   * This is returned even when the condition is satisfied so callers
   * can decide whether/how to display it.
   */
  message: string;
}

/**
 * Canonical key for an Evidence Board connection.
 *
 * Connections are intentionally treated as undirected at the
 * condition-evaluation layer.
 */
export function boardConnectionKey(
  sourceId: string,
  targetId: string
): string {
  return [sourceId, targetId].sort().join("::");
}