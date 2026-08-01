export interface SubPlace {
  id: string;
  parentSlug: string;
  name: string;
  description: string;
  requiredDust: number;
  requiredItem?: string;
  requiredCode?: string;
  lore: string[];
  risk: "low" | "medium" | "high" | "extreme";
  dustReward: number;
}

export const SUB_PLACES: SubPlace[] = [
  {
    id: "duga-basement",
    parentSlug: "duga-radar-array",
    name: "The Array Basement",
    description: "Below the over-horizon radar, something was receiving instead of transmitting.",
    requiredDust: 25,
    lore: ["The walls are lined with copper wire that hums at 4.5MHz.", "A chair faces a blank wall. The cushion is warm."],
    risk: "medium",
    dustReward: 15,
  },
  {
    id: "hashima-shaft-3",
    parentSlug: "hashima-island",
    name: "Shaft 3",
    description: "The deepest coal shaft. The elevator still works. Do not take it.",
    requiredDust: 40,
    requiredItem: "rusty-lantern",
    lore: ["Water drips upward.", "The counting voice is loudest here."],
    risk: "high",
    dustReward: 25,
  },
  {
    id: "aokigahara-cabin",
    parentSlug: "aokigahara-forest",
    name: "The Compass Cabin",
    description: "A wooden cabin where all compasses spin freely. Including the one in your chest.",
    requiredDust: 30,
    lore: ["A journal with your handwriting. You have never been here.", "The trees outside have grown around the windows."],
    risk: "medium",
    dustReward: 20,
  },
  {
    id: "poveglia-bell-tower",
    parentSlug: "poveglia-island",
    name: "The Bell Tower",
    description: "The asylum bell rings at random intervals. It has no clapper.",
    requiredDust: 50,
    requiredCode: "PLAGUE-95",
    lore: ["The bell rings in frequencies only dogs and the dead can hear.", "From the top, you can see Venice burning. It is not."],
    risk: "extreme",
    dustReward: 35,
  },
];

export function getUnlockedSubPlaces(dust: number, inventory: string[], redeemedCodes: string[]): SubPlace[] {
  return SUB_PLACES.filter((sp) => {
    if (dust < sp.requiredDust) return false;
    if (sp.requiredItem && !inventory.includes(sp.requiredItem)) return false;
    if (sp.requiredCode && !redeemedCodes.includes(sp.requiredCode)) return false;
    return true;
  });
}

export function getSubPlaceById(id: string): SubPlace | undefined {
  return SUB_PLACES.find((sp) => sp.id === id);
}