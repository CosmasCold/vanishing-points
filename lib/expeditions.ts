import { Place } from "@/types";

export interface ExpeditionChoice {
  id: string;
  label: string;
  description: string;
  dustGain: number;
  corruptionGain: number;
  itemId?: string;
  unlocksReportIndex?: number;
  next: number | "extract";
}

export interface ExpeditionPhase {
  title: string;
  narrative: string;
  choices: ExpeditionChoice[];
}

export interface ExpeditionDef {
  placeSlug: string;
  placeName: string;
  type: "abandoned" | "haunted" | "both";
  phases: ExpeditionPhase[];
}

/* ═══════════════════════════════════════════
   CUSTOM / LEGENDARY EXPEDITIONS
   Hand-written for key places. These override
   procedural generation.
   ═══════════════════════════════════════════ */

const CUSTOM_EXPEDITIONS: ExpeditionDef[] = [
  {
    placeSlug: "pripyat-amusement-park",
    placeName: "Pripyat Amusement Park",
    type: "abandoned",
    phases: [
      {
        title: "Approach",
        narrative:
          "The Ferris wheel is visible through the pines. Its cabins hang at odd angles, painted in colors that have faded to the same grey as the sky. A Geiger counter ticks somewhere in the distance, steady as a metronome. The school building looms to your left, its windows dark. You can set up base in the courtyard, but the dust here is thick and metallic on your tongue.",
        choices: [
          {
            id: "wheel",
            label: "Climb the Ferris wheel",
            description: "High ground. High radiation.",
            dustGain: 15,
            corruptionGain: 0.1,
            itemId: "photo-the-view",
            next: 1,
          },
          {
            id: "school",
            label: "Enter the school",
            description: "Classrooms hold what children left behind.",
            dustGain: 8,
            corruptionGain: 0.05,
            itemId: "childs-drawing",
            next: 1,
          },
          {
            id: "courtyard",
            label: "Set up in the courtyard",
            description: "Safe. Quiet. Too quiet.",
            dustGain: 3,
            corruptionGain: 0,
            next: 1,
          },
        ],
      },
      {
        title: "Encounter",
        narrative:
          "You found what you came for. But the park has shifted. The Geiger counter is ticking faster now, or maybe that's your own pulse. In the cabin above, something warm remains on the seat — a radiation badge, still clicking. It is pointed at you.",
        choices: [
          {
            id: "take",
            label: "Take the badge",
            description: "You will need it elsewhere. But it marks you.",
            dustGain: 20,
            corruptionGain: 0.2,
            itemId: "radiation-badge",
            next: 2,
          },
          {
            id: "photograph",
            label: "Photograph it and leave",
            description: "Evidence without contamination.",
            dustGain: 5,
            corruptionGain: 0,
            itemId: "evidence-photo",
            next: 2,
          },
          {
            id: "smash",
            label: "Smash it",
            description: "The clicking stops. For now.",
            dustGain: 0,
            corruptionGain: 0.3,
            next: 2,
          },
        ],
      },
      {
        title: "Threshold",
        narrative:
          "The sun is setting over Pripyat. The dust you have stirred up hangs in the air like gold leaf, and every particle is radioactive. You have what you came for. But the map shows a new pin 200 meters east — a door in the ground that was not on the schematic.",
        choices: [
          {
            id: "investigate",
            label: "Investigate the door",
            description: "The park is not finished with you.",
            dustGain: 25,
            corruptionGain: 0.4,
            next: "extract",
          },
          {
            id: "extract",
            label: "Extract now",
            description: "Live to archive another day.",
            dustGain: 5,
            corruptionGain: 0,
            next: "extract",
          },
        ],
      },
    ],
  },
  {
    placeSlug: "aokigahara-forest",
    placeName: "Aokigahara Forest",
    type: "haunted",
    phases: [
      {
        title: "The Tree Line",
        narrative:
          "The forest does not welcome you. It permits you. The volcanic soil swallows sound. Your compass spins lazily, drunk on magnetite. You must choose when to enter — the forest remembers time differently than you do.",
        choices: [
          {
            id: "dawn",
            label: "Enter at dawn",
            description: "The yūrei sleep. Mostly.",
            dustGain: 5,
            corruptionGain: 0.1,
            next: 1,
          },
          {
            id: "dusk",
            label: "Enter at dusk",
            description: "The boundary between worlds is thin.",
            dustGain: 12,
            corruptionGain: 0.3,
            unlocksReportIndex: 0,
            next: 1,
          },
          {
            id: "night",
            label: "Enter at night",
            description: "They are already here.",
            dustGain: 20,
            corruptionGain: 0.5,
            unlocksReportIndex: 1,
            next: 1,
          },
        ],
      },
      {
        title: "The Silence",
        narrative:
          "The trees have grown in spirals. Compasses fail. The silence has weight. You hear footsteps circling your position, but the volcanic soil holds no tracks. A tent stands abandoned ahead, a sleeping bag still unrolled, a cup of tea frozen mid-sip.",
        choices: [
          {
            id: "tent",
            label: "Search the tent",
            description: "Someone left in a hurry. Or was taken.",
            dustGain: 10,
            corruptionGain: 0.2,
            itemId: "frozen-journal",
            next: 2,
          },
          {
            id: "roots",
            label: "Examine the root spiral",
            description: "The roots twist like grasping hands. They are warm.",
            dustGain: 15,
            corruptionGain: 0.4,
            unlocksReportIndex: 2,
            next: 2,
          },
          {
            id: "push",
            label: "Push deeper",
            description: "The forest wants you to see something.",
            dustGain: 18,
            corruptionGain: 0.5,
            next: 2,
          },
        ],
      },
      {
        title: "The Weight",
        narrative:
          "Electronic devices drain. You hear your own voice through static on a dead radio. The figures in white stand between the trees, always facing away, always 50 meters ahead. You can run. You can stay. You can become part of the silence.",
        choices: [
          {
            id: "run",
            label: "Run",
            description: "The forest lets you go. This time.",
            dustGain: 5,
            corruptionGain: 0.2,
            next: "extract",
          },
          {
            id: "stay",
            label: "Stay until dawn",
            description: "You will learn what the silence wants.",
            dustGain: 30,
            corruptionGain: 0.6,
            unlocksReportIndex: 3,
            itemId: "white-robe-fragment",
            next: "extract",
          },
        ],
      },
    ],
  },
  {
    placeSlug: "eastern-state-penitentiary",
    placeName: "Eastern State Penitentiary",
    type: "haunted",
    phases: [
      {
        title: "Choose a Wing",
        narrative:
          "The radial floor plan extends seven spokes from the central hub. The stone corridors amplify footsteps that do not belong to you. Three cellblocks produce the most concentrated phenomena. The choice of wing determines what finds you.",
        choices: [
          {
            id: "twelve",
            label: "Cellblock 12",
            description: "Disembodied laughter. The corridor's exact midpoint.",
            dustGain: 8,
            corruptionGain: 0.2,
            unlocksReportIndex: 0,
            next: 1,
          },
          {
            id: "six",
            label: "Cellblock 6",
            description: "Whispered conversations in a language of silence.",
            dustGain: 8,
            corruptionGain: 0.2,
            unlocksReportIndex: 1,
            next: 1,
          },
          {
            id: "four",
            label: "Cellblock 4",
            description: "Temperature drops of 20°F. Tobacco smoke.",
            dustGain: 8,
            corruptionGain: 0.2,
            unlocksReportIndex: 2,
            next: 1,
          },
        ],
      },
      {
        title: "The Phenomenon",
        narrative:
          "You have reached the epicenter. The stone here is colder than the rest. In Cellblock 12, the laughter echoes from everywhere at once. In 6, the whispers form words you almost understand. In 4, your breath clouds and the smell of pipe tobacco is unmistakable — Sweet Virginia, a brand discontinued in 1958.",
        choices: [
          {
            id: "record",
            label: "Record evidence",
            description: "Audio log. Proof. But proof of what?",
            dustGain: 10,
            corruptionGain: 0.1,
            itemId: "audio-log-eastern",
            next: 2,
          },
          {
            id: "cell",
            label: "Enter the source cell",
            description: "The door is open. It should not be.",
            dustGain: 15,
            corruptionGain: 0.35,
            unlocksReportIndex: 3,
            next: 2,
          },
          {
            id: "retreat",
            label: "Retreat to hub",
            description: "The center is safer. Theoretically.",
            dustGain: 3,
            corruptionGain: 0,
            next: 2,
          },
        ],
      },
      {
        title: "The Rotunda",
        narrative:
          "The central hub was designed so a single guard could see down all seven spokes. But the guard is long gone, and something else occupies the vantage point. A figure in guard uniform stands at the rail, looking down. It does not turn around. It knows you are here.",
        choices: [
          {
            id: "address",
            label: "Address the figure",
            description: "'Hello?' The oldest mistake.",
            dustGain: 20,
            corruptionGain: 0.5,
            next: "extract",
          },
          {
            id: "flee",
            label: "Leave through the gate",
            description: "The prison releases you. For now.",
            dustGain: 5,
            corruptionGain: 0,
            next: "extract",
          },
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════
   PROCEDURAL GENERATOR
   Builds unique 3-phase expeditions from
   place metadata. No two places feel the same.
   ═══════════════════════════════════════════ */

const ADJECTIVES = [
  "crumbling", "silent", "vast", "narrow", "twisted", "sunken",
  "overgrown", "frozen", "scorched", "drowned", "forgotten", "hollow",
];

const ATMOSPHERES = [
  "The air tastes of rust and old stone.",
  "A wind you cannot feel moves through the structure.",
  "The silence has weight, like water pressure.",
  "Something in the architecture rejects human scale.",
  "The dust here is not ordinary. It carries memory.",
  "Every surface holds the temperature of the last hand that touched it.",
];

const SOUNDS = [
  "distant machinery",
  "running water where no water should be",
  "footsteps on a floor above you",
  "breathing that is not yours",
  "static on a dead frequency",
  "the structural groan of settling concrete",
];

const DISCOVERIES = [
  "a door that opens inward",
  "a photograph with no negative",
  "a name carved in a language that predates the structure",
  "a room warmer than the rest",
  "footprints that enter but do not leave",
  "a child's toy, impossibly preserved",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h - 1) / 2147483646;
  };
}

function generatePhase1(place: Place, rng: () => number): ExpeditionPhase {
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const atm = ATMOSPHERES[Math.floor(rng() * ATMOSPHERES.length)];
  const sound = SOUNDS[Math.floor(rng() * SOUNDS.length)];
  const year = place.yearAbandoned ? `since ${place.yearAbandoned}` : "for longer than records show";

  const isHaunted = place.category === "haunted" || place.category === "both";
  const isAbandoned = place.category === "abandoned" || place.category === "both";

  let narrative = `You approach ${place.name}. The structure has stood ${year}, ${adj} and patient. ${atm} `;

  if (isHaunted) {
    narrative += `You hear ${sound}. It does not stop when you stop moving. `;
  } else {
    narrative += `You hear ${sound}. The building itself is the only thing still awake here. `;
  }

  narrative += `The ${place.address.city} sky is the color of old television static. You must choose your entry point.`;

  const dustBase = place.dangerLevel * 3;
  const corruptionBase = place.dangerLevel * 0.04;

  const choices: ExpeditionChoice[] = [
    {
      id: "bold",
      label: "Enter through the main structure",
      description: isHaunted
        ? "The front door is open. It has always been open."
        : "Direct. Exposed. The fastest way in.",
      dustGain: dustBase + 5,
      corruptionGain: corruptionBase + 0.1,
      next: 1,
    },
    {
      id: "cautious",
      label: "Circle to a secondary entrance",
      description: "Slower. Safer. The dust is thinner on the periphery.",
      dustGain: dustBase,
      corruptionGain: corruptionBase,
      next: 1,
    },
    {
      id: "perimeter",
      label: "Document from the perimeter",
      description: "No entry. Only observation. The structure watches back.",
      dustGain: Math.max(1, dustBase - 3),
      corruptionGain: 0,
      next: 1,
    },
  ];

  // 30% chance to add an item drop on the bold choice
  const categoryItems: Record<string, string[]> = {
    abandoned: ["rusty-key", "polaroid", "breathing-mask"],
    haunted: ["exposed-film", "corrupted-drive", "sealed-letter", "breathing-mask"],
    both: ["rusty-key", "exposed-film", "polaroid", "corrupted-drive", "breathing-mask"],
  };
  const pool = categoryItems[place.category] || categoryItems.abandoned;
  if (rng() > 0.7) {
    choices[0].itemId = pool[Math.floor(rng() * pool.length)];
  }

  return { title: "Approach", narrative, choices };
}

function generatePhase2(place: Place, rng: () => number): ExpeditionPhase {
  const discovery = DISCOVERIES[Math.floor(rng() * DISCOVERIES.length)];
  const isHaunted = place.category === "haunted" || place.category === "both";
  const dustBase = place.dangerLevel * 3;
  const corruptionBase = place.dangerLevel * 0.04;
  const categoryItems: Record<string, string[]> = {
    abandoned: ["rusty-key", "polaroid", "breathing-mask"],
    haunted: ["exposed-film", "corrupted-drive", "sealed-letter", "breathing-mask"],
    both: ["rusty-key", "exposed-film", "polaroid", "corrupted-drive", "breathing-mask"],
  };
  const pool = categoryItems[place.category] || categoryItems.abandoned;

  let narrative = `Inside ${place.name}, the architecture betrays its purpose. `;

  if (place.history) {
    const sentence = place.history.split(". ")[0];
    narrative += `${sentence}. `;
  }

  narrative += `You find ${discovery}. `;

  if (isHaunted && place.hauntingReports && place.hauntingReports.length > 0) {
    const report = place.hauntingReports[Math.floor(rng() * place.hauntingReports.length)];
    narrative += `A local account describes: "${report.slice(0, 120)}${report.length > 120 ? "..." : ""}" `;
  }

  narrative += `The ${place.address.country} air has gone still. You must decide what to do with what you have found.`;

  const choices: ExpeditionChoice[] = [
    {
      id: "document",
      label: "Document and record",
      description: "Evidence without contamination. The archivist's way.",
      dustGain: dustBase + 2,
      corruptionGain: corruptionBase,
      next: 2,
    },
    {
      id: "collect",
      label: "Collect a sample",
      description: "Take something with you. The dust will remember.",
      dustGain: dustBase + 8,
      corruptionGain: corruptionBase + 0.15,
      itemId: pool[Math.floor(rng() * pool.length)],
      next: 2,
    },
  ];

  // Unlock a report if haunted and has reports
  if (isHaunted && place.hauntingReports && place.hauntingReports.length > 0) {
    choices[0].unlocksReportIndex = Math.floor(rng() * place.hauntingReports.length);
  }

  // Danger 4-5 places get a third "push deeper" option
  if (place.dangerLevel >= 4) {
    choices.push({
      id: "push",
      label: "Push deeper into the structure",
      description: "The building has not shown you everything yet.",
      dustGain: dustBase + 15,
      corruptionGain: corruptionBase + 0.25,
      next: 2,
    });
  }

  return { title: "Encounter", narrative, choices };
}

function generatePhase3(place: Place, rng: () => number): ExpeditionPhase {
  const isHaunted = place.category === "haunted" || place.category === "both";
  const dustBase = place.dangerLevel * 3;
  const corruptionBase = place.dangerLevel * 0.04;

  let narrative = `The expedition at ${place.name} reaches its threshold. `;

  if (isHaunted) {
    narrative += `The boundary between your presence and the structure's memory has thinned. You are no longer certain which of you is the intruder. `;
  } else {
    narrative += `The structural integrity is failing around you. Dust falls in patterns that suggest recent disturbance. You are not the first to document this place, but you may be the last to leave. `;
  }

  narrative += `The ${place.address.city} horizon waits. You must choose whether to stay or go.`;

  const choices: ExpeditionChoice[] = [
    {
      id: "extract",
      label: "Extract now",
      description: "Live to archive another day.",
      dustGain: dustBase,
      corruptionGain: 0,
      next: "extract",
    },
    {
      id: "stay",
      label: "Remain for final documentation",
      description: "Ten more minutes. The dust settles slowly here.",
      dustGain: dustBase + 10,
      corruptionGain: corruptionBase + 0.2,
      next: "extract",
    },
  ];

  // High danger haunted places get a "confront" option
  if (isHaunted && place.dangerLevel >= 4) {
    choices.push({
      id: "confront",
      label: "Address whatever is here",
      description: "'Hello?' The oldest mistake.",
      dustGain: dustBase + 20,
      corruptionGain: corruptionBase + 0.4,
      itemId: "sealed-letter",
      next: "extract",
    });
  }

  return { title: "Threshold", narrative, choices };
}

function generateExpedition(place: Place): ExpeditionDef {
  const rng = seedRandom(place.slug + place._id);
  return {
    placeSlug: place.slug,
    placeName: place.name,
    type: place.category,
    phases: [
      generatePhase1(place, rng),
      generatePhase2(place, rng),
      generatePhase3(place, rng),
    ],
  };
}

/* ═══════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════ */

export function getExpedition(place: Place): ExpeditionDef {
  const custom = CUSTOM_EXPEDITIONS.find((e) => e.placeSlug === place.slug);
  if (custom) return custom;
  return generateExpedition(place);
}