/**
 * Vanishing Points
 * Canonical Entity Identity
 *
 * P0 migration layer.
 *
 * The project currently mixes:
 *   - raw slugs
 *   - place IDs
 *   - connectedTo slug references
 *
 * This module establishes one canonical representation:
 *
 *     place:<canonical-slug>
 *
 * Legacy slugs remain valid as input, but new persistent references
 * should use canonical IDs.
 */

import type { PlaceId } from "@/types/places";

/**
 * Convert arbitrary place text into the canonical slug format.
 *
 * Examples:
 *
 *   "Poveglia Island"
 *     -> "poveglia-island"
 *
 *   "place:poveglia-island"
 *     -> "poveglia-island"
 *
 *   "  Catacombs Of Paris  "
 *     -> "catacombs-of-paris"
 */
export function canonicalPlaceSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^place:/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Convert a slug into a canonical PlaceId.
 */
export function placeIdFromSlug(value: string): PlaceId {
  return `place:${canonicalPlaceSlug(value)}`;
}

/**
 * Extract a canonical slug from either:
 *
 *   place:some-place
 *
 * or:
 *
 *   some-place
 */
export function slugFromPlaceId(value: string): string {
  return canonicalPlaceSlug(value);
}

/**
 * Determine whether an arbitrary string is already a canonical
 * place identifier.
 */
export function isPlaceId(value: string): value is PlaceId {
  return /^place:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
    value.trim().toLowerCase()
  );
}

/**
 * Normalize any place reference to a canonical PlaceId.
 *
 * This is the preferred function for migrations and runtime
 * relationship handling.
 */
export function normalizePlaceId(value: string): PlaceId {
  return placeIdFromSlug(value);
}

/**
 * Compare two place references regardless of whether either uses
 * the legacy slug representation or the canonical ID representation.
 */
export function samePlace(
  a: string,
  b: string
): boolean {
  return canonicalPlaceSlug(a) === canonicalPlaceSlug(b);
}

/**
 * Build a stable undirected relationship key.
 *
 * This prevents:
 *
 *   A -> B
 *
 * and:
 *
 *   B -> A
 *
 * from becoming two separate relationships.
 */
export function placeConnectionKey(
  a: string,
  b: string
): string {
  const left = placeIdFromSlug(a);
  const right = placeIdFromSlug(b);

  return [left, right].sort().join("::");
}

/**
 * Convert a collection of legacy place references into canonical IDs.
 */
export function normalizePlaceIds(
  values: readonly string[]
): PlaceId[] {
  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
        .map(normalizePlaceId)
    )
  );
}

/**
 * Safely normalize an optional place reference.
 */
export function normalizeOptionalPlaceId(
  value: string | null | undefined
): PlaceId | undefined {
  if (!value || !value.trim()) {
    return undefined;
  }

  return normalizePlaceId(value);
}