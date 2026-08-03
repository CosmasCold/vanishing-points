export interface SubPlaceChoice {
  id: string;
  text: string;
  resultText: string[];
  effect?: {
    type: "add_item" | "remove_item" | "add_dust" | "add_corruption" | "add_encounter" | "lock_subplace";
    value: string | number;
  };
}

export interface SubPlace {
  id: string;
  parentSlug: string;
  name: string;
  description: string;
  requiredDust: number;
  requiredItem?: string;
  requiredCode?: string;
  lore: string[];
  choices?: SubPlaceChoice[];
  risk: "low" | "medium" | "high" | "extreme";
  dustGain: number;
}

export const SUB_PLACES: SubPlace[] = [
  {
    id: "duga-basement",
    parentSlug: "duga-radar-array",
    name: "The Array Basement",
    description: "Below the over-horizon radar, something was receiving instead of transmitting.",
    requiredDust: 25,
    lore: [
      "The walls are lined with copper wire that hums at 4.5MHz.",
      "A chair faces a blank wall. The cushion is warm.",
    ],
    choices: [
      {
        id: "listen",
        text: "Press your ear to the copper wire.",
        resultText: [
          "The frequency is 4.5MHz.",
          "It matches your heartbeat.",
          "You are now tuned.",
        ],
        effect: { type: "add_encounter", value: 1 },
      },
      {
        id: "sit",
        text: "Sit in the warm chair.",
        resultText: [
          "The cushion remembers a body.",
          "It is not yours.",
          "You stand up quickly, but the warmth stays with you.",
        ],
        effect: { type: "add_corruption", value: 1 },
      },
      {
        id: "leave-chair",
        text: "Turn the chair to face the door.",
        resultText: [
          "The chair resists, then gives.",
          "Whoever was sitting here wanted to leave.",
          "You have honored that intention.",
        ],
        effect: { type: "add_dust", value: 10 },
      },
    ],
    risk: "medium",
    dustGain: 15,
  },
  {
    id: "hashima-shaft-3",
    parentSlug: "hashima-island",
    name: "Shaft 3",
    description: "The deepest coal shaft. The elevator still works. Do not take it.",
    requiredDust: 40,
    lore: [
      "Water drips upward.",
      "The counting voice is loudest here.",
    ],
    choices: [
      {
        id: "elevator",
        text: "Press the elevator button.",
        resultText: [
          "The cables groan.",
          "The counterweight is on the wrong side.",
          "The elevator is already at the bottom, and it is not empty.",
        ],
        effect: { type: "add_encounter", value: 2 },
      },
      {
        id: "ladder",
        text: "Climb the service ladder.",
        resultText: [
          "The rungs are worn smooth by hands smaller than yours.",
          "You find a photograph: the island, full of people, timestamped tomorrow.",
        ],
        effect: { type: "add_item", value: "polaroid" },
      },
    ],
    risk: "high",
    dustGain: 25,
  },
  {
    id: "aokigahara-cabin",
    parentSlug: "aokigahara-forest",
    name: "The Compass Cabin",
    description: "A wooden cabin where all compasses spin freely. Including the one in your chest.",
    requiredDust: 30,
    lore: [
      "A journal with your handwriting. You have never been here.",
      "The trees outside have grown around the windows.",
    ],
    choices: [
      {
        id: "read-journal",
        text: "Read the journal.",
        resultText: [
          "The entries are dated next week.",
          "You describe this exact moment.",
          "You write: 'I should not have read this.'",
        ],
        effect: { type: "add_corruption", value: 1 },
      },
      {
        id: "burn-journal",
        text: "Burn the journal in the stove.",
        resultText: [
          "The paper does not burn.",
          "The ink runs upward, toward the ceiling.",
          "The cabin is warmer now. You are colder.",
        ],
        effect: { type: "add_corruption", value: 1 },
      },
    ],
    risk: "medium",
    dustGain: 20,
  },
  {
    id: "poveglia-bell-tower",
    parentSlug: "poveglia-island",
    name: "The Bell Tower",
    description: "The asylum bell rings at random intervals. It has no clapper.",
    requiredDust: 50,
    requiredCode: "PLAGUE-95",
    lore: [
      "The bell rings in frequencies only dogs and the dead can hear.",
      "From the top, you can see Venice burning. It is not.",
    ],
    choices: [
      {
        id: "ring",
        text: "Strike the bell yourself.",
        resultText: [
          "The sound is inside your skull, not your ears.",
          "Every compass in your inventory spins.",
          "Something below you answers.",
        ],
        effect: { type: "add_encounter", value: 3 },
      },
      {
        id: "climb-down",
        text: "Descend without looking at the bell.",
        resultText: [
          "You feel its weight above you.",
          "The stairs are longer going down than they were going up.",
          "You have lost time.",
        ],
        effect: { type: "add_dust", value: 20 },
      },
    ],
    risk: "extreme",
    dustGain: 35,
  },
];

export function getUnlockedSubPlaces(
  dust: number,
  inventory: string[],
  foundCodes: string[]
): SubPlace[] {
  return SUB_PLACES.filter((sp) => {
    if (dust < sp.requiredDust) return false;
    if (sp.requiredItem && !inventory.includes(sp.requiredItem)) return false;
    if (sp.requiredCode && !foundCodes.includes(sp.requiredCode)) return false;
    return true;
  });
}

export function getSubPlaceById(id: string): SubPlace | undefined {
  return SUB_PLACES.find((sp) => sp.id === id);
}