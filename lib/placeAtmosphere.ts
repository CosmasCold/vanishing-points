export interface PlaceAtmosphere {
  slug: string;
  name: string;
  sensory: string[];
  whispers: string[];
  at314: string[];
  inventoryChance: string[]; // IDs from INVENTORY_ITEMS
}

export const PLACE_ATMOSPHERES: PlaceAtmosphere[] = [
  {
    slug: "duga-radar-array",
    name: "Duga Radar Array",
    sensory: [
      "The air tastes like ozone and old Soviet concrete.",
      "A rhythmic tapping echoes from the antenna — 10Hz, then silence, then 10Hz.",
      "The grass here grows in perfect rows, as if still obeying military order.",
    ],
    whispers: [
      "The Woodpecker is still transmitting. You are the receiver now.",
      "Someone is walking the catwalk above you. The catwalk collapsed in 1989.",
    ],
    at314: [
      "At 03:14, the tapping becomes a voice counting down from numbers that do not exist.",
      "The radar dish turns to face you. It was decommissioned. It is not.",
    ],
    inventoryChance: ["woodpecker-tape", "corrupted-drive", "breathing-mask"],
  },
  {
    slug: "hashima-island",
    name: "Hashima Island",
    sensory: [
      "The sea wind carries coal dust instead of salt.",
      "Every balcony faces the same empty horizon, as if waiting for a boat that was cancelled.",
      "Your footsteps echo from the floor above. The floor above is underwater.",
    ],
    whispers: [
      "The concrete is sweating. It remembers the miners' breath.",
      "Room 405 is occupied. The registry says it has been empty since 1974.",
    ],
    at314: [
      "At 03:14, the sea wall becomes transparent. You can see the shafts below the waterline.",
      "A light turns on in Room 405. The light was removed in 1974.",
    ],
    inventoryChance: ["concrete-shard", "rusty-key", "polaroid"],
  },
  {
    slug: "aokigahara-forest",
    name: "Aokigahara Forest",
    sensory: [
      "The trees absorb sound. Your own breathing seems borrowed.",
      "Compasses spin, but your watch has stopped at 03:14 regardless of the actual time.",
      "The moss grows in patterns that resemble handwriting.",
    ],
    whispers: [
      "The forest does not want you to leave. It is polite about it.",
      "Someone tied a ribbon to a tree. The ribbon is your favorite color.",
    ],
    at314: [
      "At 03:14, the trees reveal their roots. Among them: bones, cassette tapes, and your own footprints from a walk you have not taken yet.",
    ],
    inventoryChance: ["frozen-journal", "white-robe-fragment", "sealed-letter"],
  },
  {
    slug: "poveglia-island",
    name: "Poveglia Island",
    sensory: [
      "The air is warm, like exhalation from a mouth that has been closed for centuries.",
      "Seagulls here do not cry. They speak in low, rhythmic tones.",
      "The asylum bell tower casts no shadow after noon.",
    ],
    whispers: [
      "The plague doctors never left. Their masks are in the walls.",
      "You can hear the bell. The bell has no clapper.",
    ],
    at314: [
      "At 03:14, the bell rings. It rings inside your chest cavity.",
      "The plague doctors are standing at the dock. They are waiting for you to return.",
    ],
    inventoryChance: ["plague-mask", "exposed-film", "corrupted-drive"],
  },
  {
    slug: "chernobyl",
    name: "Chernobyl",
    sensory: [
      "The Geiger counter clicks like a metronome for a song with no melody.",
      "The ferris wheel turns slightly in wind that is not blowing.",
      "Trees here grow in the shape of the buildings they replaced.",
    ],
    whispers: [
      "Reactor 4 is still warm. Not with radiation. With intention.",
      "The evacuation announcement plays on loop from a speaker with no power source.",
    ],
    at314: [
      "At 03:14, the ferris wheel completes one full rotation. It takes exactly 60 seconds. It is empty. It is not empty.",
    ],
    inventoryChance: ["radiation-badge", "photo-the-view", "childs-drawing"],
  },
  {
    slug: "centralia",
    name: "Centralia",
    sensory: [
      "The ground is warm. The warmth has a pulse.",
      "Steam rises from cracks that spell words in a language you almost understand.",
      "The smell is not sulfur. It is paper burning. Specifically, maps.",
    ],
    whispers: [
      "The fire has been burning since 1962. It will burn until it reaches the surface.",
      "It has reached the surface. It is waiting for you to notice.",
    ],
    at314: [
      "At 03:14, the steam forms a grid. It matches the constellation in the Lantern tab.",
    ],
    inventoryChance: ["polaroid", "rusty-key", "breathing-mask"],
  },
];

export function getAtmosphereForPlace(slug: string): PlaceAtmosphere | undefined {
  return PLACE_ATMOSPHERES.find((p) => p.slug === slug);
}

export function getRandomSensory(slug: string): string {
  const place = getAtmosphereForPlace(slug);
  if (!place) return "The static is thick here.";
  return place.sensory[Math.floor(Math.random() * place.sensory.length)];
}

export function getWhisper(slug: string): string {
  const place = getAtmosphereForPlace(slug);
  if (!place) return "Something is listening.";
  return place.whispers[Math.floor(Math.random() * place.whispers.length)];
}

export function get314Event(slug: string): string {
  const place = getAtmosphereForPlace(slug);
  if (!place) return "At 03:14, the rules change.";
  return place.at314[Math.floor(Math.random() * place.at314.length)];
}