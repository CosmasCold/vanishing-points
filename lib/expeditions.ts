export interface ExpeditionChoice {
  id: string;
  label: string;
  description: string;
  dust: number;
  corruptionRisk: number;
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

export const EXPEDITIONS: ExpeditionDef[] = [
  {
    placeSlug: "pripyat-amusement-park",
    placeName: "Pripyat Amusement Park",
    type: "abandoned",
    phases: [
      {
        title: "PHASE 1 — Approach",
        narrative:
          "The Ferris wheel is visible through the pines. Its cabins hang at odd angles, painted in colors that have faded to the same grey as the sky. A Geiger counter ticks somewhere in the distance, steady as a metronome. The school building looms to your left, its windows dark. You can set up base in the courtyard, but the dust here is thick and metallic on your tongue.",
        choices: [
          {
            id: "wheel",
            label: "Climb the Ferris wheel",
            description: "High ground. High radiation.",
            dust: 15,
            corruptionRisk: 0.1,
            itemId: "photo-the-view",
            next: 1,
          },
          {
            id: "school",
            label: "Enter the school",
            description: "Classrooms hold what children left behind.",
            dust: 8,
            corruptionRisk: 0.05,
            itemId: "childs-drawing",
            next: 1,
          },
          {
            id: "courtyard",
            label: "Set up in the courtyard",
            description: "Safe. Quiet. Too quiet.",
            dust: 3,
            corruptionRisk: 0,
            next: 1,
          },
        ],
      },
      {
        title: "PHASE 2 — Encounter",
        narrative:
          "You found what you came for. But the park has shifted. The Geiger counter is ticking faster now, or maybe that's your own pulse. In the cabin above, something warm remains on the seat — a radiation badge, still clicking. It is pointed at you.",
        choices: [
          {
            id: "take",
            label: "Take the badge",
            description: "You will need it elsewhere. But it marks you.",
            dust: 20,
            corruptionRisk: 0.2,
            itemId: "radiation-badge",
            next: 2,
          },
          {
            id: "photograph",
            label: "Photograph it and leave",
            description: "Evidence without contamination.",
            dust: 5,
            corruptionRisk: 0,
            itemId: "evidence-photo",
            next: 2,
          },
          {
            id: "smash",
            label: "Smash it",
            description: "The clicking stops. For now.",
            dust: 0,
            corruptionRisk: 0.3,
            next: 2,
          },
        ],
      },
      {
        title: "PHASE 3 — Extraction",
        narrative:
          "The sun is setting over Pripyat. The dust you have stirred up hangs in the air like gold leaf, and every particle is radioactive. You have what you came for. But the map shows a new pin 200 meters east — a door in the ground that was not on the schematic.",
        choices: [
          {
            id: "investigate",
            label: "Investigate the door",
            description: "The park is not finished with you.",
            dust: 25,
            corruptionRisk: 0.4,
            next: "extract",
          },
          {
            id: "extract",
            label: "Extract now",
            description: "Live to archive another day.",
            dust: 5,
            corruptionRisk: 0,
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
        title: "PHASE 1 — The Tree Line",
        narrative:
          "The forest does not welcome you. It permits you. The volcanic soil swallows sound. Your compass spins lazily, drunk on magnetite. You must choose when to enter — the forest remembers time differently than you do.",
        choices: [
          {
            id: "dawn",
            label: "Enter at dawn",
            description: "The yūrei sleep. Mostly.",
            dust: 5,
            corruptionRisk: 0.1,
            next: 1,
          },
          {
            id: "dusk",
            label: "Enter at dusk",
            description: "The boundary between worlds is thin.",
            dust: 12,
            corruptionRisk: 0.3,
            unlocksReportIndex: 0,
            next: 1,
          },
          {
            id: "night",
            label: "Enter at night",
            description: "They are already here.",
            dust: 20,
            corruptionRisk: 0.5,
            unlocksReportIndex: 1,
            next: 1,
          },
        ],
      },
      {
        title: "PHASE 2 — The Silence",
        narrative:
          "The trees have grown in spirals. Compasses fail. The silence has weight. You hear footsteps circling your position, but the volcanic soil holds no tracks. A tent stands abandoned ahead, a sleeping bag still unrolled, a cup of tea frozen mid-sip.",
        choices: [
          {
            id: "tent",
            label: "Search the tent",
            description: "Someone left in a hurry. Or was taken.",
            dust: 10,
            corruptionRisk: 0.2,
            itemId: "frozen-journal",
            next: 2,
          },
          {
            id: "roots",
            label: "Examine the root spiral",
            description: "The roots twist like grasping hands. They are warm.",
            dust: 15,
            corruptionRisk: 0.4,
            unlocksReportIndex: 2,
            next: 2,
          },
          {
            id: "push",
            label: "Push deeper",
            description: "The forest wants you to see something.",
            dust: 18,
            corruptionRisk: 0.5,
            next: 2,
          },
        ],
      },
      {
        title: "PHASE 3 — The Weight",
        narrative:
          "Electronic devices drain. You hear your own voice through static on a dead radio. The figures in white stand between the trees, always facing away, always 50 meters ahead. You can run. You can stay. You can become part of the silence.",
        choices: [
          {
            id: "run",
            label: "Run",
            description: "The forest lets you go. This time.",
            dust: 5,
            corruptionRisk: 0.2,
            next: "extract",
          },
          {
            id: "stay",
            label: "Stay until dawn",
            description: "You will learn what the silence wants.",
            dust: 30,
            corruptionRisk: 0.6,
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
        title: "PHASE 1 — Choose a Wing",
        narrative:
          "The radial floor plan extends seven spokes from the central hub. The stone corridors amplify footsteps that do not belong to you. Three cellblocks produce the most concentrated phenomena. The choice of wing determines what finds you.",
        choices: [
          {
            id: "twelve",
            label: "Cellblock 12",
            description: "Disembodied laughter. The corridor's exact midpoint.",
            dust: 8,
            corruptionRisk: 0.2,
            unlocksReportIndex: 0,
            next: 1,
          },
          {
            id: "six",
            label: "Cellblock 6",
            description: "Whispered conversations in a language of silence.",
            dust: 8,
            corruptionRisk: 0.2,
            unlocksReportIndex: 1,
            next: 1,
          },
          {
            id: "four",
            label: "Cellblock 4",
            description: "Temperature drops of 20°F. Tobacco smoke.",
            dust: 8,
            corruptionRisk: 0.2,
            unlocksReportIndex: 2,
            next: 1,
          },
        ],
      },
      {
        title: "PHASE 2 — The Phenomenon",
        narrative:
          "You have reached the epicenter. The stone here is colder than the rest. In Cellblock 12, the laughter echoes from everywhere at once. In 6, the whispers form words you almost understand. In 4, your breath clouds and the smell of pipe tobacco is unmistakable — Sweet Virginia, a brand discontinued in 1958.",
        choices: [
          {
            id: "record",
            label: "Record evidence",
            description: "Audio log. Proof. But proof of what?",
            dust: 10,
            corruptionRisk: 0.1,
            itemId: "audio-log-eastern",
            next: 2,
          },
          {
            id: "cell",
            label: "Enter the source cell",
            description: "The door is open. It should not be.",
            dust: 15,
            corruptionRisk: 0.35,
            unlocksReportIndex: 3,
            next: 2,
          },
          {
            id: "retreat",
            label: "Retreat to hub",
            description: "The center is safer. Theoretically.",
            dust: 3,
            corruptionRisk: 0,
            next: 2,
          },
        ],
      },
      {
        title: "PHASE 3 — The Rotunda",
        narrative:
          "The central hub was designed so a single guard could see down all seven spokes. But the guard is long gone, and something else occupies the vantage point. A figure in guard uniform stands at the rail, looking down. It does not turn around. It knows you are here.",
        choices: [
          {
            id: "address",
            label: "Address the figure",
            description: "'Hello?' The oldest mistake.",
            dust: 20,
            corruptionRisk: 0.5,
            next: "extract",
          },
          {
            id: "flee",
            label: "Leave through the gate",
            description: "The prison releases you. For now.",
            dust: 5,
            corruptionRisk: 0,
            next: "extract",
          },
        ],
      },
    ],
  },
];

export function getExpedition(slug: string): ExpeditionDef | undefined {
  return EXPEDITIONS.find((e) => e.placeSlug === slug);
}