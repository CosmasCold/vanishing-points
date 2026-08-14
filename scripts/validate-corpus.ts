/**
 * VANISHING POINTS
 * Canonical Corpus Validator
 *
 * P0
 *
 * This validator checks the generated Atlas corpus for structural
 * problems before those problems can propagate into the game.
 *
 * It intentionally does NOT attempt to judge narrative quality.
 * It validates data integrity.
 */

import { LOCAL_PLACES } from "@/data/places";
import {
  canonicalPlaceSlug,
  isPlaceId,
  placeIdFromSlug,
} from "@/lib/entityIds";

type ValidationSeverity = "error" | "warning";

interface ValidationIssue {
  severity: ValidationSeverity;
  category: string;
  message: string;
}

const issues: ValidationIssue[] = [];

function error(category: string, message: string): void {
  issues.push({
    severity: "error",
    category,
    message,
  });
}

function warning(category: string, message: string): void {
  issues.push({
    severity: "warning",
    category,
    message,
  });
}

function isFiniteNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function validatePlaceIdentity(
  place: (typeof LOCAL_PLACES)[number],
  index: number,
  ids: Set<string>,
  slugs: Set<string>,
  aliases: Map<string, string>
): void {
  const location = `Place #${index + 1}`;

  if (!place.id) {
    error(
      "identity",
      `${location} "${place.name}" has no canonical ID.`
    );
  } else if (!isPlaceId(place.id)) {
    error(
      "identity",
      `${location} "${place.name}" has invalid ID "${place.id}".`
    );
  } else if (ids.has(place.id)) {
    error(
      "identity",
      `Duplicate place ID "${place.id}".`
    );
  } else {
    ids.add(place.id);
  }

  if (!place.slug) {
    error(
      "identity",
      `${location} "${place.name}" has no slug.`
    );
    return;
  }

  const canonicalSlug = canonicalPlaceSlug(
    place.slug
  );

  if (canonicalSlug !== place.slug) {
    error(
      "identity",
      `Place "${place.name}" has non-canonical slug "${place.slug}". Expected "${canonicalSlug}".`
    );
  }

  if (slugs.has(canonicalSlug)) {
    error(
      "identity",
      `Duplicate canonical slug "${canonicalSlug}".`
    );
  } else {
    slugs.add(canonicalSlug);
  }

  for (const alias of place.aliases ?? []) {
    const normalizedAlias =
      canonicalPlaceSlug(alias);

    const existing = aliases.get(normalizedAlias);

    if (existing && existing !== place.id) {
      error(
        "identity",
        `Alias "${alias}" is claimed by both "${existing}" and "${place.id}".`
      );
      continue;
    }

    aliases.set(normalizedAlias, place.id);
  }

  const expectedId =
    placeIdFromSlug(place.slug);

  if (place.id !== expectedId) {
    error(
      "identity",
      `Place "${place.slug}" has ID "${place.id}", expected "${expectedId}".`
    );
  }
}

function validatePlaceBasics(
  place: (typeof LOCAL_PLACES)[number]
): void {
  if (!place.name?.trim()) {
    error(
      "schema",
      `${place.id}: missing name.`
    );
  }

  if (!place.category) {
    error(
      "schema",
      `${place.id}: missing category.`
    );
  }

  if (
    !Array.isArray(place.coordinates) ||
    place.coordinates.length !== 2
  ) {
    error(
      "schema",
      `${place.id}: coordinates must contain longitude and latitude.`
    );
  } else {
    const [longitude, latitude] =
      place.coordinates;

    if (!isFiniteNumber(longitude)) {
      error(
        "coordinates",
        `${place.id}: longitude is not a finite number.`
      );
    }

    if (!isFiniteNumber(latitude)) {
      error(
        "coordinates",
        `${place.id}: latitude is not a finite number.`
      );
    }

    if (
      isFiniteNumber(longitude) &&
      (longitude < -180 || longitude > 180)
    ) {
      error(
        "coordinates",
        `${place.id}: longitude ${longitude} is outside [-180, 180].`
      );
    }

    if (
      isFiniteNumber(latitude) &&
      (latitude < -90 || latitude > 90)
    ) {
      error(
        "coordinates",
        `${place.id}: latitude ${latitude} is outside [-90, 90].`
      );
    }
  }

  if (
    !Number.isFinite(place.dangerLevel)
  ) {
    error(
      "schema",
      `${place.id}: dangerLevel is not a finite number.`
    );
  }

  if (
    !Number.isFinite(place.viewCount) ||
    place.viewCount < 0
  ) {
    error(
      "schema",
      `${place.id}: viewCount must be a non-negative finite number.`
    );
  }

  if (!Array.isArray(place.photos)) {
    error(
      "schema",
      `${place.id}: photos must be an array.`
    );
  }

  if (!Array.isArray(place.hauntingReports)) {
    error(
      "schema",
      `${place.id}: hauntingReports must be an array.`
    );
  }

  if (!Array.isArray(place.connectedTo)) {
    error(
      "schema",
      `${place.id}: connectedTo must be an array.`
    );
  }
}

function validateConnections(
  place: (typeof LOCAL_PLACES)[number],
  ids: Set<string>
): void {
  for (const target of place.connectedTo ?? []) {
    if (!isPlaceId(target)) {
      error(
        "reference",
        `${place.id}: connectedTo contains non-canonical reference "${target}".`
      );
      continue;
    }

    if (!ids.has(target)) {
      error(
        "reference",
        `${place.id}: connectedTo references missing place "${target}".`
      );
    }

    if (target === place.id) {
      warning(
        "relationship",
        `${place.id}: self-reference detected.`
      );
    }
  }
}

function validateCondition(
  place: (typeof LOCAL_PLACES)[number]
): void {
  const condition =
    place.unlockCondition;

  if (!condition) {
    return;
  }

  if (
    typeof condition !== "object" ||
    condition === null
  ) {
    error(
      "condition",
      `${place.id}: unlockCondition is not an object.`
    );
    return;
  }

  const candidate =
    condition as unknown as Record<string, unknown>;

  if (
    typeof candidate.type !== "string"
  ) {
    error(
      "condition",
      `${place.id}: unlockCondition has no type.`
    );
    return;
  }

  const supportedTypes = new Set([
    "dust",
    "stability",
    "evidence",
    "code",
    "inventory",
    "visit",
    "reading",
    "time",
    "session",
    "document",
    "artifact",
    "boardConnection",
    "hypothesis",
  ]);

  if (!supportedTypes.has(candidate.type)) {
    error(
      "condition",
      `${place.id}: unsupported condition type "${candidate.type}".`
    );
    return;
  }

  if (
    typeof candidate.message !== "string" ||
    !candidate.message.trim()
  ) {
    error(
      "condition",
      `${place.id}: ${candidate.type} condition has no player-facing message.`
    );
  }

  if (
    candidate.type === "dust" ||
    candidate.type === "stability" ||
    candidate.type === "evidence" ||
    candidate.type === "session"
  ) {
    if (!isFiniteNumber(candidate.value)) {
      error(
        "condition",
        `${place.id}: ${candidate.type} condition requires a finite numeric value.`
      );
    }
  }

  if (
    candidate.type === "code" ||
    candidate.type === "inventory" ||
    candidate.type === "reading" ||
    candidate.type === "document" ||
    candidate.type === "artifact" ||
    candidate.type === "boardConnection" ||
    candidate.type === "hypothesis" ||
    candidate.type === "time"
  ) {
    if (
      typeof candidate.value !== "string" ||
      !candidate.value.trim()
    ) {
      error(
        "condition",
        `${place.id}: ${candidate.type} condition requires a non-empty string value.`
      );
    }
  }

  if (candidate.type === "visit") {
    const value = candidate.value;

    if (
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      error(
        "condition",
        `${place.id}: visit condition must use a numeric count or a place identifier.`
      );
    }

    if (
      typeof value === "number" &&
      (!Number.isFinite(value) ||
        value < 0)
    ) {
      error(
        "condition",
        `${place.id}: visit count must be a non-negative number.`
      );
    }
  }

  if (
    candidate.type === "hypothesis"
  ) {
    const allowedStates = new Set([
      "supported",
      "confirmed",
    ]);

    if (
      typeof candidate.state !== "string" ||
      !allowedStates.has(candidate.state)
    ) {
      error(
        "condition",
        `${place.id}: hypothesis condition must use "supported" or "confirmed".`
      );
    }
  }
}

function validateAliases(
  place: (typeof LOCAL_PLACES)[number]
): void {
  for (const alias of place.aliases ?? []) {
    if (
      typeof alias !== "string" ||
      !alias.trim()
    ) {
      error(
        "identity",
        `${place.id}: empty alias detected.`
      );
      continue;
    }

    if (
      canonicalPlaceSlug(alias) ===
      place.slug
    ) {
      warning(
        "identity",
        `${place.id}: alias "${alias}" resolves to the canonical slug and is therefore redundant.`
      );
    }
  }
}

function validateDates(
  place: (typeof LOCAL_PLACES)[number]
): void {
  if (
    !place.submittedAt ||
    Number.isNaN(
      Date.parse(place.submittedAt)
    )
  ) {
    error(
      "dates",
      `${place.id}: invalid submittedAt "${place.submittedAt}".`
    );
  }

  if (
    !place.verifiedAt ||
    Number.isNaN(
      Date.parse(place.verifiedAt)
    )
  ) {
    error(
      "dates",
      `${place.id}: invalid verifiedAt "${place.verifiedAt}".`
    );
  }
}

function validateNarrativeMetadata(
  place: (typeof LOCAL_PLACES)[number]
): void {
  if (
    place.tier !== undefined &&
    (
      !Number.isInteger(place.tier) ||
      place.tier < 0 ||
      place.tier > 3
    )
  ) {
    error(
      "narrative",
      `${place.id}: tier must be an integer from 0 through 3.`
    );
  }

  if (
    place.narrativeRole !== undefined &&
    typeof place.narrativeRole !== "string"
  ) {
    error(
      "narrative",
      `${place.id}: narrativeRole must be a string.`
    );
  }
}

function printSummary(
  places: typeof LOCAL_PLACES
): void {
  const errors =
    issues.filter(
      (issue) => issue.severity === "error"
    );

  const warnings =
    issues.filter(
      (issue) => issue.severity === "warning"
    );

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    " VANISHING POINTS :: CORPUS VALIDATOR"
  );
  console.log(
    "=============================================="
  );
  console.log("");

  console.log(
    `Places checked: ${places.length}`
  );

  console.log(
    `Errors: ${errors.length}`
  );

  console.log(
    `Warnings: ${warnings.length}`
  );

  console.log("");

  if (issues.length > 0) {
    console.log(
      "----------------------------------------------"
    );

    for (const issue of issues) {
      const prefix =
        issue.severity === "error"
          ? "ERROR"
          : "WARN ";

      console.log(
        `[${prefix}] [${issue.category}] ${issue.message}`
      );
    }

    console.log(
      "----------------------------------------------"
    );
  }

  if (errors.length === 0) {
    console.log(
      "CORPUS VALIDATION: PASS"
    );
  } else {
    console.log(
      "CORPUS VALIDATION: FAIL"
    );
  }

  console.log("");
}

function main(): void {
  const places =
    LOCAL_PLACES;

  const ids =
    new Set<string>();

  const slugs =
    new Set<string>();

  const aliases =
    new Map<string, string>();

  /*
   * Pass 1:
   * identity and basic schema
   */
  places.forEach(
    (place, index) => {
      validatePlaceIdentity(
        place,
        index,
        ids,
        slugs,
        aliases
      );

      validatePlaceBasics(
        place
      );

      validateAliases(
        place
      );

      validateDates(
        place
      );

      validateNarrativeMetadata(
        place
      );

      validateCondition(
        place
      );
    }
  );

  /*
   * Pass 2:
   * cross-record relationships
   */
  places.forEach(
    (place) => {
      validateConnections(
        place,
        ids
      );
    }
  );

  printSummary(
    places
  );

  const errorCount =
    issues.filter(
      (issue) =>
        issue.severity === "error"
    ).length;

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main();