import type { Condition } from "@/types/conditions";

export type PlaceId = `place:${string}`;

export type PlaceCategory =
  | "abandoned"
  | "haunted"
  | "both";

export type PlaceStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "sealed"
  | "whispered"
  | "mirage";

export interface Address {
  city: string;
  country: string;
  formatted: string;
}

export interface Contributor {
  name: string;
  email: string;
}

/**
 * Canonical unlock-condition type.
 *
 * Kept as an alias for compatibility with existing code that imports
 * `UnlockCondition` from this module.
 */
export type UnlockCondition = Condition;

export interface Place {
  /**
   * Canonical internal identity.
   *
   * Example:
   *   place:cheyenne-mountain-complex
   */
  id: PlaceId;

  /**
   * Canonical machine-readable slug.
   */
  slug: string;

  /**
   * Legacy or alternate slugs retained during corpus migration.
   *
   * These are aliases only. Game-state references should use `id`.
   */
  aliases: string[];

  name: string;

  category: PlaceCategory;

  /**
   * [longitude, latitude]
   */
  coordinates: [number, number];

  address: Address;

  yearAbandoned?: number;

  history: string;

  hauntingReports: string[];

  dangerLevel: number;

  photos: string[];

  status: PlaceStatus;

  contributor?: Contributor;

  viewCount: number;

  submittedAt: string;

  verifiedAt: string;

  verifiedBy: string;

  unlockCondition?: UnlockCondition;

  /**
   * Canonical references to other places.
   *
   * Example:
   *   ["place:mount-weather", "place:raven-rock-mountain-complex"]
   */
  connectedTo: PlaceId[];

  resonanceNote?: string;

  /**
   * Native geodetic progression tier.
   */
  tier?: number;

  /**
   * Narrative classification already present in the master corpus.
   *
   * Examples found in the current corpus include:
   *   pattern_introductory
   *   baseline_cautionary
   *   pattern_dense
   *   framebreak_impossible
   *   impossible_unstable
   *
   * This remains a string for now rather than inventing a closed union
   * before the complete corpus has been audited.
   */
  narrativeRole?: string;
}