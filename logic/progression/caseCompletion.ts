import { ACT_I_CASES } from '@/data/act1Cases';
import { getCanonicalCase } from '@/data/canonicalCases';
import type { ProgressionState } from '@/state/progressionStore';

export type CaseCompletionStatus =
  | 'complete'
  | 'incomplete'
  | 'not-authored';

export type CompletionBlocker =
  | 'missing-evidence'
  | 'missing-hypothesis-evidence'
  | 'missing-board-relationship'
  | 'missing-knowledge'
  | 'missing-contradiction'
  | 'missing-hypothesis'
  | 'hypothesis-not-satisfied';

export interface CaseCompletionResult {
  status: CaseCompletionStatus;
  caseId: string;
  authored: boolean;
  missingEvidence: string[];
  missingHypothesisEvidence: string[];
  hypothesisId: string | null;
  hypothesisSatisfied: boolean;
  missingBoardConnections: string[];
  missingKnowledge: string[];
  missingContradictions: string[];
  blockers: CompletionBlocker[];
  reason: string;
}

/**
 * Canonical case-completion evaluator.
 *
 * This evaluator is deliberately contract-driven.
 *
 * It does NOT assume that every case requires:
 * - board connections
 * - knowledge records
 * - contradictions
 * - a particular exposure
 * - every piece of evidence to be attached to a hypothesis
 *
 * Only requirements explicitly present in an authored (`source`) completion
 * contract are enforced.
 *
 * Proposed completion definitions are never promoted into runtime gates.
 *
 * The evaluator is pure and never mutates progression state.
 */
export function evaluateCaseCompletion(
  caseId: string,
  state: ProgressionState,
): CaseCompletionResult {
  const definition = ACT_I_CASES.find(
    (caseSpec) => caseSpec.slug === caseId,
  );

  if (!definition) {
    const canonicalCase = getCanonicalCase(caseId);

    if (canonicalCase) {
      return {
        status: 'not-authored',
        caseId,
        authored: false,
        missingEvidence: [],
        missingHypothesisEvidence: [],
        hypothesisId: null,
        hypothesisSatisfied: false,
        missingBoardConnections: [],
        missingKnowledge: [],
        missingContradictions: [],
        blockers: [],
        reason:
          canonicalCase.completion.status === 'authored-source'
            ? 'CANONICAL CASE EXISTS BUT HAS NO RUNTIME AUTHORING.'
            : 'CANONICAL CASE IS OUTLINED BUT ITS COMPLETION CONTRACT IS NOT YET AUTHORED.',
      };
    }

    return {
      status: 'not-authored',
      caseId,
      authored: false,
      missingEvidence: [],
      missingHypothesisEvidence: [],
      hypothesisId: null,
      hypothesisSatisfied: false,
      missingBoardConnections: [],
      missingKnowledge: [],
      missingContradictions: [],
      blockers: [],
      reason: 'CASE NOT PRESENT IN CURRENT NARRATIVE SPINE.',
    };
  }

  const completion = definition.completion;

  if (completion.status !== 'source') {
    return {
      status: 'not-authored',
      caseId,
      authored: false,
      missingEvidence: [],
      missingHypothesisEvidence: [],
      hypothesisId: completion.requiredHypothesis,
      hypothesisSatisfied: false,
      missingBoardConnections: [],
      missingKnowledge: [],
      missingContradictions: [],
      blockers: [],
      reason:
        'CASE COMPLETION CONTRACT IS PROPOSED AND HAS NOT BEEN CANONIZED.',
    };
  }

  const discoveredEvidence = new Set(
    state.discoveredEvidenceIds,
  );

  /*
   * Evidence is evaluated exactly as authored by the contract.
   * We do not infer additional requirements from the case dossier.
   */
  const missingEvidence =
    completion.requiredEvidence.filter(
      (evidenceId) =>
        !discoveredEvidence.has(evidenceId),
    );

  const hypothesisId =
    completion.requiredHypothesis || null;

  /*
   * A completion contract with no hypothesis does not require one.
   * The current Act I schema requires an ID, but this evaluator treats the
   * value literally so future contract extensions can remain explicit.
   */
  const hypothesisState = hypothesisId
    ? state.hypotheses[hypothesisId]
    : undefined;

  const hypothesisSatisfied =
    hypothesisId === null
      ? true
      : hypothesisState === 'supported' ||
        hypothesisState === 'confirmed';

  /*
   * Hypothesis evidence is only a requirement when the authored contract
   * explicitly provides `requiredHypothesisEvidence`.
   */
  const requiredHypothesisEvidence =
    completion.requiredHypothesisEvidence ?? [];

  const missingHypothesisEvidence =
    requiredHypothesisEvidence.filter(
      (evidenceId) =>
        !(
          state.hypothesisEvidence[hypothesisId ?? ''] ?? []
        ).includes(evidenceId),
    );

  /*
   * Board relationships are only a requirement when explicitly authored.
   * Normalize both authored and persisted connections so direction/order
   * cannot create false negatives.
   */
  const requiredBoardConnections =
    completion.requiredBoardConnections ?? [];

  const boardConnections = new Set(
    state.boardConnections,
  );

  const missingBoardConnections =
    requiredBoardConnections.filter(
      (connection) =>
        !boardConnections.has(connection),
    );

  /*
   * Knowledge and contradiction requirements are deliberately explicit.
   * We inspect the requested record IDs only when the contract names them.
   */
  const requiredKnowledge =
    completion.requiredKnowledge ?? [];

  const missingKnowledge =
    requiredKnowledge.filter(
      (knowledgeId) =>
        !state.knowledge[knowledgeId],
    );

  const requiredContradictions =
    completion.requiredContradictions ?? [];

  const missingContradictions =
    requiredContradictions.filter(
      (contradictionId) =>
        !state.contradictions[contradictionId],
    );

  const blockers: CompletionBlocker[] = [];

  if (missingEvidence.length > 0) {
    blockers.push('missing-evidence');
  }

  if (missingHypothesisEvidence.length > 0) {
    blockers.push('missing-hypothesis-evidence');
  }

  if (missingBoardConnections.length > 0) {
    blockers.push('missing-board-relationship');
  }

  if (missingKnowledge.length > 0) {
    blockers.push('missing-knowledge');
  }

  if (missingContradictions.length > 0) {
    blockers.push('missing-contradiction');
  }

  if (hypothesisId !== null && !hypothesisState) {
    blockers.push('missing-hypothesis');
  } else if (
    hypothesisId !== null &&
    !hypothesisSatisfied
  ) {
    blockers.push('hypothesis-not-satisfied');
  }

  const complete = blockers.length === 0;

  return {
    status: complete ? 'complete' : 'incomplete',
    caseId,
    authored: true,
    missingEvidence,
    missingHypothesisEvidence,
    hypothesisId,
    hypothesisSatisfied,
    missingBoardConnections,
    missingKnowledge,
    missingContradictions,
    blockers,
    reason: complete
      ? 'CASE COMPLETION CONTRACT SATISFIED.'
      : 'CASE COMPLETION CONTRACT HAS OUTSTANDING REQUIREMENTS.',
  };
}