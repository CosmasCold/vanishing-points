import fs from "fs";
import path from "path";

import type {
  Place,
  PlaceId,
  PlaceCategory,
  PlaceStatus,
} from "@/types/places";

import {
  canonicalPlaceSlug,
  placeIdFromSlug,
} from "@/lib/entityIds";

/**
 * VANISHING POINTS
 * MASTER PLACE CORPUS COMPILER
 *
 * P0 canonical-data migration.
 *
 * Responsibilities:
 *
 *   1. Read the master mapped-places.json corpus.
 *   2. Normalize MongoDB Extended JSON values.
 *   3. Canonicalize place identity.
 *   4. Canonicalize connectedTo relationships.
 *   5. Collapse exact duplicate source records.
 *   6. Preserve narrative metadata.
 *   7. Generate deterministic fallback metadata.
 *   8. Write data/places.ts.
 *
 * IMPORTANT:
 *
 * data/places.ts is generated output.
 * Do not edit it manually.
 *
 * Source of truth:
 *
 *     scripts/mapped-places.json
 *
 * Generated output:
 *
 *     data/places.ts
 */

/* -------------------------------------------------------------------------- */
/* RAW SOURCE TYPES                                                           */
/* -------------------------------------------------------------------------- */

interface MongoDate {
  $date: string | number | Date;
}

interface RawAddress {
  city?: string;
  country?: string;
  formatted?: string;
}

interface RawContributor {
  name?: string;
  email?: string;
}

interface RawCondition {
  type?: string;
  value?: string | number;
  message?: string;
  state?: string;
}

interface RawPlace {
  _id?: {
    $oid?: string;
  };

  id?: string;

  slug: string;
  name: string;

  category: string;

  coordinates: [number, number];

  address?: RawAddress;

  yearAbandoned?: number;

  history: string;

  hauntingReports?: string[];

  dangerLevel: number;

  photos?: string[];

  status: string;

  contributor?: RawContributor;

  viewCount?: number;

  submittedAt?: string | MongoDate | null;

  verifiedAt?: string | MongoDate | null;

  verifiedBy?: string;

  unlockCondition?: RawCondition | null;

  connectedTo?: Array<string | null | undefined>;

  resonanceNote?: string;

  tier?: number;

  narrativeRole?: string;

  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* RESONANCE TEMPLATES                                                        */
/* -------------------------------------------------------------------------- */

const RESONANCE_TEMPLATES = {
  tier0: [
    "I used to think the light was mine. It burns with a cold blue glare now.",
    "The typewriter carriage locked mid-sentence. Someone was sitting in my chair.",
    "A geodetic gap has been introduced. The console scanlines are shivering.",
  ],

  tier1: [
    "The yellow Ferris wheel rotates slightly during winter storms, though its drive mechanics are locked by rust.",
    "A child's voice has been captured on geophones near the bumper cars, repeating a 10 Hz tapping signature.",
    "The roots of the Pinaceae forest twist in patterns that resemble grasping hands.",
  ],

  tier2: [
    "The Geiger counter in the basement ticks louder when you are watching. I do not know how it knows.",
    "The button is still warm. I have the thermal imaging to prove it.",
    "Seismic arrays show micro-fractures vibrating precisely at 18 Hz in silent, cold weather.",
  ],

  tier3: [
    "You have been here before. The file says you have not. I believe the file.",
    "The seawater in the shaft is 180 kilometers from any ocean. I have tested it three times. It is Atlantic water.",
    "I have not composed the message. But I recognize my voice. I am frightened of what I will say.",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* BASIC HELPERS                                                             */
/* -------------------------------------------------------------------------- */

function fail(message: string): never {
  throw new Error(`[Compiler] ${message}`);
}

function warn(message: string): void {
  console.warn(`[Compiler] WARNING: ${message}`);
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

/* -------------------------------------------------------------------------- */
/* DATE NORMALIZATION                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Converts MongoDB Extended JSON dates into ordinary ISO strings.
 *
 * Supported:
 *
 *   "2026-08-04T21:48:31.306Z"
 *
 *   { "$date": "2026-08-04T21:48:31.306Z" }
 *
 *   { "$date": 1754344111306 }
 *
 *   Date
 */
function normalizeDate(
  value: unknown
): string {
  if (typeof value === "string") {
    const parsed = Date.parse(value);

    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }

    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isObject(value) && "$date" in value) {
    const dateValue = value.$date;

    if (typeof dateValue === "string") {
      const parsed = Date.parse(dateValue);

      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }

      return dateValue;
    }

    if (typeof dateValue === "number") {
      const date = new Date(dateValue);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
  }

  return new Date(0).toISOString();
}

/* -------------------------------------------------------------------------- */
/* CATEGORY / STATUS NORMALIZATION                                           */
/* -------------------------------------------------------------------------- */

function normalizeCategory(
  value: unknown
): PlaceCategory {
  switch (String(value).trim().toLowerCase()) {
    case "abandoned":
      return "abandoned";

    case "haunted":
      return "haunted";

    case "both":
      return "both";

    default:
      warn(
        `Unknown place category "${String(
          value
        )}". Falling back to "abandoned".`
      );

      return "abandoned";
  }
}

function normalizeStatus(
  value: unknown
): PlaceStatus {
  switch (String(value).trim().toLowerCase()) {
    case "verified":
      return "verified";

    case "pending":
      return "pending";

    case "rejected":
      return "rejected";

    case "sealed":
      return "sealed";

    case "whispered":
      return "whispered";

    case "mirage":
      return "mirage";

    default:
      warn(
        `Unknown place status "${String(
          value
        )}". Falling back to "pending".`
      );

      return "pending";
  }
}

/* -------------------------------------------------------------------------- */
/* PLACE ID NORMALIZATION                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Converts any source place reference into a canonical PlaceId.
 *
 * Examples:
 *
 *   "poveglia-island"
 *       -> "place:poveglia-island"
 *
 *   "place:poveglia-island"
 *       -> "place:poveglia-island"
 *
 *   " Poveglia Island "
 *       -> "place:poveglia-island"
 */
function normalizePlaceReference(
  value: string
): PlaceId {
  return placeIdFromSlug(
    canonicalPlaceSlug(value)
  );
}

/* -------------------------------------------------------------------------- */
/* CONNECTION NORMALIZATION                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Converts legacy slug-based relationship arrays into canonical PlaceIds.
 *
 * Source:
 *
 *   [
 *     "spreepark-berlin",
 *     "bunker-3-relay"
 *   ]
 *
 * Generated:
 *
 *   [
 *     "place:spreepark-berlin",
 *     "place:bunker-3-relay"
 *   ]
 *
 * Nulls, empty strings, self references, and duplicates are removed.
 */
function normalizeConnectedTo(
  connectedTo: Array<
    string | null | undefined
  > | undefined,
  ownSlug: string
): PlaceId[] {
  const ids = new Set<PlaceId>();

  const ownCanonicalSlug =
    canonicalPlaceSlug(ownSlug);

  for (const rawTarget of connectedTo ?? []) {
    if (
      typeof rawTarget !== "string" ||
      !rawTarget.trim()
    ) {
      continue;
    }

    const targetSlug =
      canonicalPlaceSlug(rawTarget);

    if (!targetSlug) {
      continue;
    }

    if (targetSlug === ownCanonicalSlug) {
      continue;
    }

    const targetId: PlaceId =
      placeIdFromSlug(targetSlug);

    ids.add(targetId);
  }

  return Array.from(ids);
}

/* -------------------------------------------------------------------------- */
/* CONDITION NORMALIZATION                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Preserve the source condition while removing null values.
 *
 * The canonical condition type is owned by types/conditions.ts.
 * We intentionally do not manufacture unsupported condition types here.
 *
 * If a source condition exists, its structure is preserved and emitted.
 * The TypeScript contract is enforced by the destination type.
 */
function normalizeUnlockCondition(
  condition: RawCondition | null | undefined
): Place["unlockCondition"] {
  if (!condition) {
    return undefined;
  }

  if (
    typeof condition.type !== "string" ||
    !condition.type.trim()
  ) {
    warn(
      "Encountered unlockCondition without a valid type. Condition discarded."
    );

    return undefined;
  }

  if (
    condition.value === undefined ||
    condition.value === null
  ) {
    warn(
      `Condition "${condition.type}" has no value. Condition discarded.`
    );

    return undefined;
  }

  if (
    typeof condition.message !== "string" ||
    !condition.message.trim()
  ) {
    warn(
      `Condition "${condition.type}" has no player-facing message.`
    );
  }

  /*
   * The canonical condition union may contain additional metadata
   * beyond the three fields present in the source corpus.
   *
   * Preserve "state" when present because hypothesis-style gates
   * may use it.
   */
  const normalized = {
    type: condition.type,
    value: condition.value,
    message:
      condition.message?.trim() ??
      "",
    ...(condition.state
      ? { state: condition.state }
      : {}),
  };

  return normalized as Place["unlockCondition"];
}

/* -------------------------------------------------------------------------- */
/* DETERMINISTIC FALLBACK VIEW COUNT                                          */
/* -------------------------------------------------------------------------- */

/**
 * The old compiler used Math.random() when a place had no viewCount.
 *
 * That makes generated data change on every compile.
 *
 * We instead derive a stable value from the slug so that two builds
 * of the same source corpus produce the same generated corpus.
 */
function deterministicViewCount(
  slug: string
): number {
  let hash = 0;

  for (let i = 0; i < slug.length; i++) {
    hash =
      (hash * 31 +
        slug.charCodeAt(i)) &
      0x7fffffff;
  }

  return 120 + (hash % 1200);
}

/* -------------------------------------------------------------------------- */
/* TIER NORMALIZATION                                                         */
/* -------------------------------------------------------------------------- */

function normalizeTier(
  place: RawPlace
): number {
  if (
    typeof place.tier === "number" &&
    Number.isInteger(place.tier) &&
    place.tier >= 0 &&
    place.tier <= 3
  ) {
    return place.tier;
  }

  const danger =
    Number(place.dangerLevel);

  if (!Number.isFinite(danger)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      3,
      Math.floor(danger / 1.5)
    )
  );
}

/* -------------------------------------------------------------------------- */
/* RESONANCE NORMALIZATION                                                    */
/* -------------------------------------------------------------------------- */

function normalizeResonanceNote(
  place: RawPlace,
  index: number,
  tier: number
): string {
  if (
    typeof place.resonanceNote === "string" &&
    place.resonanceNote.trim()
  ) {
    return place.resonanceNote.trim();
  }

  const templates =
    tier === 3
      ? RESONANCE_TEMPLATES.tier3
      : tier === 2
        ? RESONANCE_TEMPLATES.tier2
        : tier === 1
          ? RESONANCE_TEMPLATES.tier1
          : RESONANCE_TEMPLATES.tier0;

  return templates[
    index % templates.length
  ];
}

/* -------------------------------------------------------------------------- */
/* ADDRESS NORMALIZATION                                                      */
/* -------------------------------------------------------------------------- */

function normalizeAddress(
  place: RawPlace
) {
  const city =
    typeof place.address?.city === "string"
      ? place.address.city
      : "";

  const country =
    typeof place.address?.country === "string"
      ? place.address.country
      : "";

  const formatted =
    typeof place.address?.formatted === "string"
      ? place.address.formatted
      : [city, country]
          .filter(Boolean)
          .join(", ");

  return {
    city,
    country,
    formatted,
  };
}

/* -------------------------------------------------------------------------- */
/* DUPLICATE HANDLING                                                         */
/* -------------------------------------------------------------------------- */

function recordsRepresentSamePlace(
  a: RawPlace,
  b: RawPlace
): boolean {
  const aSlug =
    canonicalPlaceSlug(a.slug);

  const bSlug =
    canonicalPlaceSlug(b.slug);

  if (aSlug !== bSlug) {
    return false;
  }

  /*
   * The corpus has repeated copies of certain Mongo records.
   *
   * We compare the important identity/location fields rather than
   * JSON.stringify() because Mongo export ordering can differ.
   */
  const sameName =
    String(a.name ?? "").trim() ===
    String(b.name ?? "").trim();

  const sameCoordinates =
    Array.isArray(a.coordinates) &&
    Array.isArray(b.coordinates) &&
    a.coordinates[0] === b.coordinates[0] &&
    a.coordinates[1] === b.coordinates[1];

  const aOid =
    a._id?.$oid;

  const bOid =
    b._id?.$oid;

  /*
   * If both records have Mongo IDs, matching IDs are strong evidence
   * that this is literally the same source record repeated.
   */
  const sameMongoId =
    Boolean(aOid) &&
    Boolean(bOid) &&
    aOid === bOid;

  return (
    sameMongoId ||
    (sameName && sameCoordinates)
  );
}

/* -------------------------------------------------------------------------- */
/* COMPILATION                                                                */
/* -------------------------------------------------------------------------- */

function compilePlaces(): void {
  const datasetPath =
    path.join(
      process.cwd(),
      "scripts",
      "mapped-places.json"
    );

  const fallbackPath =
    path.join(
      process.cwd(),
      "mapped-places.json"
    );

  let targetPath = "";

  if (fs.existsSync(datasetPath)) {
    targetPath = datasetPath;
  } else if (fs.existsSync(fallbackPath)) {
    targetPath = fallbackPath;
  } else {
    fail(
      "Master mapped-places.json dataset not found."
    );
  }

  let places: RawPlace[] = [];

  try {
    const raw =
      fs.readFileSync(
        targetPath,
        "utf-8"
      );

    const parsed: unknown =
      JSON.parse(raw);

    if (Array.isArray(parsed)) {
      places = parsed as RawPlace[];
    } else if (
      isObject(parsed) &&
      Array.isArray(parsed.places)
    ) {
      places =
        parsed.places as RawPlace[];
    } else {
      fail(
        "mapped-places.json does not contain an array or a { places: [] } corpus."
      );
    }

    console.log(
      `[Compiler] Successfully parsed ${places.length} master database entries.`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(
        "[Compiler]"
      )
    ) {
      throw error;
    }

    fail(
      `Failed to parse JSON dataset: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }

  if (places.length === 0) {
    fail(
      "Master corpus contains zero place records."
    );
  }

  /* ---------------------------------------------------------------------- */
  /* DEDUPLICATE SOURCE CORPUS                                             */
  /* ---------------------------------------------------------------------- */

  const seenById =
    new Map<string, RawPlace>();

  const uniquePlaces: RawPlace[] = [];

  for (
    let index = 0;
    index < places.length;
    index++
  ) {
    const place = places[index];

    if (
      !place ||
      typeof place !== "object"
    ) {
      fail(
        `Record ${index + 1} is not a valid place object.`
      );
    }

    if (
      typeof place.slug !== "string" ||
      !place.slug.trim()
    ) {
      fail(
        `Record ${index + 1} has no valid slug.`
      );
    }

    const slug =
      canonicalPlaceSlug(
        place.slug
      );

    const canonicalId =
      placeIdFromSlug(slug);

    const existing =
      seenById.get(canonicalId);

    if (existing) {
      if (
        recordsRepresentSamePlace(
          existing,
          place
        )
      ) {
        console.warn(
          `[Compiler] Duplicate source record collapsed: ${canonicalId}`
        );

        continue;
      }

      fail(
        `Conflicting canonical place ID: ${canonicalId}. ` +
          `The corpus contains distinct records that resolve to the same place identity.`
      );
    }

    seenById.set(
      canonicalId,
      place
    );

    uniquePlaces.push(place);
  }

  console.log(
    `[Compiler] Unique source places: ${uniquePlaces.length}.`
  );

  /* ---------------------------------------------------------------------- */
  /* COMPILE                                                                */
  /* ---------------------------------------------------------------------- */

  const compiled: Place[] =
    uniquePlaces.map(
      (place, index): Place => {
        const slug =
          canonicalPlaceSlug(
            place.slug
          );

        const id: PlaceId =
          placeIdFromSlug(slug);

        const tier =
          normalizeTier(place);

        const coordinates =
          Array.isArray(place.coordinates) &&
          place.coordinates.length === 2
            ? [
                Number(
                  place.coordinates[0]
                ),
                Number(
                  place.coordinates[1]
                ),
              ] as [
                number,
                number
              ]
            : ([0, 0] as [
                number,
                number
              ]);

        const dangerLevel =
          Number(place.dangerLevel);

        const cleanDangerLevel =
          Number.isFinite(
            dangerLevel
          )
            ? dangerLevel
            : 0;

        const submittedAt =
          normalizeDate(
            place.submittedAt
          );

        const verifiedAt =
          normalizeDate(
            place.verifiedAt
          );

        const connectedTo =
          normalizeConnectedTo(
            place.connectedTo,
            slug
          );

        const photos =
          Array.isArray(place.photos)
            ? place.photos.filter(
                (
                  photo
                ): photo is string =>
                  typeof photo ===
                  "string" &&
                  photo.trim()
                    .length > 0
              )
            : [];

        const hauntingReports =
          Array.isArray(
            place.hauntingReports
          )
            ? place.hauntingReports.filter(
                (
                  report
                ): report is string =>
                  typeof report ===
                  "string" &&
                  report.trim()
                    .length > 0
              )
            : [];

        const resonanceNote =
          normalizeResonanceNote(
            place,
            index,
            tier
          );

        const viewCount =
          typeof place.viewCount ===
            "number" &&
          Number.isFinite(
            place.viewCount
          ) &&
          place.viewCount >= 0
            ? Math.floor(
                place.viewCount
              )
            : deterministicViewCount(
                slug
              );

        const contributor =
          place.contributor &&
          typeof place.contributor ===
            "object"
            ? {
                name:
                  typeof place
                    .contributor.name ===
                  "string"
                    ? place.contributor
                        .name
                    : "Unknown",
                email:
                  typeof place
                    .contributor.email ===
                  "string"
                    ? place.contributor
                        .email
                    : "",
              }
            : undefined;

        const unlockCondition =
          normalizeUnlockCondition(
            place.unlockCondition
          );

        const normalized: Place =
          {
            id,

            slug,

            aliases:
  Array.isArray(place.aliases)
    ? place.aliases.filter(
        (alias): alias is string =>
          typeof alias === "string" &&
          alias.trim().length > 0
      )
    : [],

            name:
              typeof place.name ===
              "string"
                ? place.name
                : slug,

            category:
              normalizeCategory(
                place.category
              ),

            coordinates,

            address:
              normalizeAddress(
                place
              ),

            ...(typeof place.yearAbandoned ===
              "number"
              ? {
                  yearAbandoned:
                    place.yearAbandoned,
                }
              : {}),

            history:
              typeof place.history ===
              "string"
                ? place.history
                : "",

            hauntingReports,

            dangerLevel:
              cleanDangerLevel,

            photos,

            status:
              normalizeStatus(
                place.status
              ),

            ...(contributor
              ? {
                  contributor,
                }
              : {}),

            viewCount,

            submittedAt,

            verifiedAt,

            verifiedBy:
              typeof place.verifiedBy ===
                "string" &&
              place.verifiedBy.trim()
                ? place.verifiedBy
                : "system_node_7b",

            ...(unlockCondition
              ? {
                  unlockCondition,
                }
              : {}),

            connectedTo,

            resonanceNote,

            tier,

            ...(typeof place.narrativeRole ===
            "string"
              ? {
                  narrativeRole:
                    place.narrativeRole,
                }
              : {}),
          } as Place;

        return normalized;
      }
    );

  /* ---------------------------------------------------------------------- */
  /* OUTPUT                                                                 */
  /* ---------------------------------------------------------------------- */

  const outputContent = `import type { Place } from "@/types/places";

/**
 * AUTOMATICALLY COMPILED GEODETIC ATLAS CORPUS
 *
 * Generated by scripts/map-places.ts.
 *
 * DO NOT EDIT THIS FILE MANUALLY.
 *
 * Source:
 *   scripts/mapped-places.json
 *
 * The compiler canonicalizes place IDs and relationship references
 * before generating this file.
 */

export const LOCAL_PLACES: Place[] = ${JSON.stringify(
    compiled,
    null,
    2
  )};

export async function fetchPlaces(): Promise<Place[]> {
  try {
    const res = await fetch("/api/places");

    if (!res.ok) {
      throw new Error(
        "Archive unreachable"
      );
    }

    const data =
      await res.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "Invalid archive format"
      );
    }

    return data as Place[];
  } catch (err) {
    console.warn(
      "[Atlas] Remote database unreachable. Reverting to local static seed."
    );

    return LOCAL_PLACES;
  }
}
`;

  const outputFilePath =
    path.join(
      process.cwd(),
      "data",
      "places.ts"
    );

  try {
    const parentDir =
      path.dirname(
        outputFilePath
      );

    if (
      !fs.existsSync(parentDir)
    ) {
      fs.mkdirSync(
        parentDir,
        {
          recursive: true,
        }
      );
    }

    fs.writeFileSync(
      outputFilePath,
      outputContent,
      "utf-8"
    );

    console.log(
      `[Compiler] Compiled Atlas successfully!`
    );

    console.log(
      `[Compiler] Output: ${outputFilePath}`
    );

    console.log(
      `[Compiler] Canonical Atlas corpus: ${compiled.length} places.`
    );
  } catch (error) {
    fail(
      `Failed to write compiled output: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }
}

/* -------------------------------------------------------------------------- */
/* ENTRY POINT                                                                */
/* -------------------------------------------------------------------------- */

try {
  compilePlaces();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : String(error)
  );

  process.exitCode = 1;
}