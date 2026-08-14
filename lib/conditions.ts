import type {
  Condition,
  ConditionContext,
  ConditionResult,
  VisitCondition,
} from "@/types/conditions";

/**
 * Vanishing Points
 * Canonical condition evaluator.
 *
 * This module is intentionally pure:
 *
 *     Condition + Context -> Result
 *
 * It does not import Zustand stores, React components, browser APIs,
 * or game UI code.
 *
 * That makes progression rules testable independently from the UI.
 */

function success(condition: Condition): ConditionResult {
  return {
    unlocked: true,
    message: condition.message,
  };
}

function locked(condition: Condition): ConditionResult {
  return {
    unlocked: false,
    message: condition.message,
  };
}

/**
 * Normalizes an entity/place identifier for comparison.
 *
 * During P0 migration, the corpus may still contain legacy slugs while
 * runtime state begins moving toward canonical `place:<slug>` IDs.
 *
 * This function lets the evaluator understand both forms.
 */
function normalizeId(value: string): string {
  const normalized = value.trim().toLowerCase();

  return normalized.startsWith("place:")
    ? normalized.slice("place:".length)
    : normalized;
}

/**
 * Determines whether a collection contains an identifier while
 * tolerating both canonical and legacy place IDs.
 */
function collectionHas(
  collection: Set<string>,
  value: string
): boolean {
  if (collection.has(value)) {
    return true;
  }

  const normalized = normalizeId(value);

  if (collection.has(normalized)) {
    return true;
  }

  const canonical = `place:${normalized}`;

  return collection.has(canonical);
}

/**
 * Visit conditions have two meanings in the existing corpus:
 *
 *   value: 3
 *     -> investigator has visited at least 3 locations
 *
 *   value: "catacombs-of-paris"
 *     -> investigator has visited this specific location
 *
 * Both forms are present in the source corpus. The latter is explicitly
 * used for the Paris Catacombs gate. 
 */
function evaluateVisitCondition(
  condition: VisitCondition,
  context: ConditionContext
): ConditionResult {
  if (typeof condition.value === "number") {
    const requiredVisits = Math.max(0, Math.floor(condition.value));

    return context.visitedPlaceIds.size >= requiredVisits
      ? success(condition)
      : locked(condition);
  }

  const target = normalizeId(condition.value);

  return collectionHas(context.visitedPlaceIds, target)
    ? success(condition)
    : locked(condition);
}

/**
 * Evaluate a single canonical progression condition.
 *
 * IMPORTANT:
 * Unknown or unavailable state never produces an accidental unlock.
 * The safe failure mode is LOCKED.
 */
export function evaluateCondition(
  condition: Condition | null | undefined,
  context: ConditionContext
): ConditionResult {
  if (!condition) {
    return {
      unlocked: true,
      message: "",
    };
  }

  switch (condition.type) {
    /**
     * GEODETIC DUST
     *
     * Corpus examples include thresholds such as 15, 25, 30, 40,
     * 50, 70, and 75.
     */
    case "dust": {
      const required = Number(condition.value);

      if (!Number.isFinite(required)) {
        return locked(condition);
      }

      return context.dustIndex >= required
        ? success(condition)
        : locked(condition);
    }

    /**
     * OBSERVER STABILITY
     *
     * The condition definition is retained as part of the progression
     * architecture. Runtime use will remain conservative until the
     * complete stability system is audited.
     */
    case "stability": {
      const required = Number(condition.value);

      if (!Number.isFinite(required)) {
        return locked(condition);
      }

      return context.observerStability >= required
        ? success(condition)
        : locked(condition);
    }

    /**
     * EVIDENCE COUNT
     *
     * The current corpus explicitly uses conditions such as:
     * "Collect 10 evidence items to breach the seal."
     */
    case "evidence": {
      const required = Number(condition.value);

      if (!Number.isFinite(required)) {
        return locked(condition);
      }

      const current = context.evidenceCount ?? 0;

      return current >= required
        ? success(condition)
        : locked(condition);
    }

    /**
     * RESONANCE CODE
     *
     * Corpus examples use:
     *
     *     value: "RESONANCE"
     *
     * The evaluator deliberately performs exact normalized matching.
     */
    case "code": {
      const requiredCode = String(condition.value)
        .trim()
        .toUpperCase();

      if (!requiredCode) {
        return locked(condition);
      }

      const hasCode = [...context.codes].some(
        (code) =>
          code.trim().toUpperCase() === requiredCode
      );

      return hasCode
        ? success(condition)
        : locked(condition);
    }

    /**
     * INVENTORY ITEM
     */
    case "inventory": {
      const itemId = String(condition.value).trim();

      if (!itemId) {
        return locked(condition);
      }

      return collectionHas(context.inventoryIds, itemId)
        ? success(condition)
        : locked(condition);
    }

    /**
     * VISIT
     *
     * Supports both numeric count and specific-place gates.
     */
    case "visit":
      return evaluateVisitCondition(condition, context);

    /**
     * READING
     *
     * The corpus uses specific reading IDs such as:
     *
     *     bunker7-transmission-6
     *
     * This represents a completed reading/decryption event, not merely
     * possession of a document.
     */
    case "reading": {
      const readingId = String(condition.value).trim();

      if (!readingId) {
        return locked(condition);
      }

      return collectionHas(context.readingIds, readingId)
        ? success(condition)
        : locked(condition);
    }

    /**
     * NARRATIVE TIME STATE
     *
     * Time conditions are intentionally exact-string comparisons for P0.
     * We do not invent a wall-clock interpretation for narrative time.
     */
    case "time": {
      if (!context.currentTime) {
        return locked(condition);
      }

      return (
        context.currentTime.trim().toLowerCase() ===
        String(condition.value).trim().toLowerCase()
      )
        ? success(condition)
        : locked(condition);
    }

    /**
     * SESSION COUNT
     */
    case "session": {
      const required = Number(condition.value);

      if (!Number.isFinite(required)) {
        return locked(condition);
      }

      return context.sessionCount >= required
        ? success(condition)
        : locked(condition);
    }

    /**
     * DOCUMENT READ / ACQUIRED
     */
    case "document": {
      const documentId = String(condition.value).trim();

      if (!documentId) {
        return locked(condition);
      }

      return collectionHas(
        context.readDocumentIds,
        documentId
      )
        ? success(condition)
        : locked(condition);
    }

    /**
     * ARTIFACT ACQUIRED / SCANNED
     */
    case "artifact": {
      const artifactId = String(condition.value).trim();

      if (!artifactId) {
        return locked(condition);
      }

      return collectionHas(
        context.scannedArtifactIds,
        artifactId
      )
        ? success(condition)
        : locked(condition);
    }

    /**
     * EVIDENCE BOARD CONNECTION
     *
     * The condition value represents a required relationship key.
     */
    case "boardConnection": {
      const connection = String(condition.value).trim();

      if (!connection) {
        return locked(condition);
      }

      if (context.boardConnections.has(connection)) {
        return success(condition);
      }

      /*
       * Also support the canonical undirected connection form:
       *
       *     source::target
       *
       * by normalizing each side.
       */
      const parts = connection.split("::");

      if (parts.length === 2) {
        const normalized = [
          normalizeId(parts[0]),
          normalizeId(parts[1]),
        ]
          .sort()
          .join("::");

        const found = [...context.boardConnections].some(
          (existing) => {
            const existingParts = existing.split("::");

            if (existingParts.length !== 2) {
              return false;
            }

            return (
              [
                normalizeId(existingParts[0]),
                normalizeId(existingParts[1]),
              ]
                .sort()
                .join("::") === normalized
            );
          }
        );

        return found
          ? success(condition)
          : locked(condition);
      }

      return locked(condition);
    }

    /**
     * HYPOTHESIS STATE
     *
     * The P0 condition schema requires the named hypothesis to have
     * reached either "supported" or "confirmed".
     */
    case "hypothesis": {
      const hypothesisId = String(condition.value).trim();

      if (!hypothesisId) {
        return locked(condition);
      }

      const state = context.hypotheses.get(hypothesisId);

      if (
        state === "supported" ||
        state === "confirmed"
      ) {
        return success(condition);
      }

      return locked(condition);
    }

    /**
     * Exhaustiveness guard.
     *
     * If another condition type is added to the union without an
     * evaluator here, TypeScript will flag this location.
     */
    default: {
      const exhaustiveCheck: never = condition;
      return locked(exhaustiveCheck);
    }
  }
}

/**
 * Convenience boolean API.
 *
 * Use this when callers only care whether the player can proceed.
 */
export function isConditionSatisfied(
  condition: Condition | null | undefined,
  context: ConditionContext
): boolean {
  return evaluateCondition(condition, context).unlocked;
}

/**
 * Evaluate multiple conditions as an AND gate.
 *
 * A place or investigation requiring several conditions is only
 * unlocked when every condition passes.
 */
export function evaluateAllConditions(
  conditions: Array<Condition | null | undefined>,
  context: ConditionContext
): ConditionResult {
  const activeConditions = conditions.filter(
    (condition): condition is Condition => Boolean(condition)
  );

  if (activeConditions.length === 0) {
    return {
      unlocked: true,
      message: "",
    };
  }

  const results = activeConditions.map(
    (condition) => evaluateCondition(condition, context)
  );

  const failed = results.find(
    (result) => !result.unlocked
  );

  if (failed) {
    return failed;
  }

  return {
    unlocked: true,
    message: activeConditions
      .map((condition) => condition.message)
      .filter(Boolean)
      .join(" "),
  };
}