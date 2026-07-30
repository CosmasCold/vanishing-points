export interface StoryAsset {
  id: string;
  title: string;
  description: string;
  filename: string;
  unlockCode: string;
  category: "photograph" | "document" | "transmission" | "artifact";
  rarity: "common" | "uncommon" | "rare" | "legendary";
  lore?: string;
}

export interface RedeemableCode {
  code: string;
  type: "asset" | "log" | "command" | "lore" | "theme" | "cache_key";
  rewardId: string;
  description: string;
}

export const STORY_ASSETS: StoryAsset[] = [
  { id: "ast_001", title: "The First Door", description: "Taken at 03:14. The metal was warm to the touch.", filename: "door_0314.jpg", unlockCode: "INWARD", category: "photograph", rarity: "rare", lore: "The door opens inward. Not out." },
  { id: "ast_002", title: "Dust Patterns", description: "Five fingers, pressed into concrete. Not mine.", filename: "dust_hand.jpg", unlockCode: "BREATHE", category: "photograph", rarity: "uncommon", lore: "The dust settles in patterns." },
  { id: "ast_003", title: "Containment Blueprint", description: "The atlas was never a map. It was a lock.", filename: "blueprint.jpg", unlockCode: "ASSEMBLY-314", category: "document", rarity: "legendary", lore: "Every pin is a nail in something's coffin." },
  { id: "ast_004", title: "Reflection Anomaly", description: "The mirror showed someone else. Briefly.", filename: "reflection.jpg", unlockCode: "MIRROR", category: "photograph", rarity: "rare" },
  { id: "ast_005", title: "Bunker Corridor", description: "The lights flicker in morse. I stopped decoding.", filename: "corridor.jpg", unlockCode: "742", category: "photograph", rarity: "common" },
  { id: "ast_006", title: "Static Portrait", description: "A face in the noise. It knows my name.", filename: "static_face.jpg", unlockCode: "REACTOR", category: "transmission", rarity: "rare" },
  { id: "ast_007", title: "The Archivist's Hand", description: "Cold. Dry. Still writing.", filename: "hand.jpg", unlockCode: "DAYZERO", category: "photograph", rarity: "common" },
  { id: "ast_008", title: "Coordinate Burn", description: "51.3890, 30.0984 — shifted 3 degrees east.", filename: "coordinates.jpg", unlockCode: "COUNT", category: "document", rarity: "uncommon" },
  { id: "ast_009", title: "Sealed File 00", description: "I can see when you will return. I hope I'm wrong.", filename: "file00.jpg", unlockCode: "CACHE-00", category: "document", rarity: "legendary" },
  { id: "ast_010", title: "The Green Light", description: "It is not a light. It is an eye.", filename: "green_light.jpg", unlockCode: "DOOR", category: "photograph", rarity: "rare" },
  { id: "ast_011", title: "BUNKER_3 Transmission", description: "Signal received. No response to hails.", filename: "bunker3.jpg", unlockCode: "TRIANGULATE", category: "transmission", rarity: "legendary" },
  { id: "ast_012", title: "The Wandering Marker", description: "It appeared on the atlas. I didn't place it.", filename: "wanderer.jpg", unlockCode: "ANOMALY", category: "artifact", rarity: "uncommon" },
  { id: "ast_013", title: "Dust Sample 7", description: "Contains skin cells. DNA matches mine. From 40 years ago.", filename: "sample7.jpg", unlockCode: "DUST-7", category: "document", rarity: "rare" },
  { id: "ast_014", title: "The Last Window", description: "I don't remember where this was taken. I don't remember sky.", filename: "window.jpg", unlockCode: "SKY", category: "photograph", rarity: "common" },
  { id: "ast_015", title: "03:14 Feed", description: "The cameras show this every night. The room is empty.", filename: "0314_feed.jpg", unlockCode: "FEED", category: "transmission", rarity: "uncommon" },
];

export const REDEEMABLE_CODES: RedeemableCode[] = [
  { code: "INWARD", type: "asset", rewardId: "ast_001", description: "The door opens inward" },
  { code: "BREATHE", type: "asset", rewardId: "ast_002", description: "The grid breathes" },
  { code: "ASSEMBLY-314", type: "asset", rewardId: "ast_003", description: "Fragments reassembled" },
  { code: "MIRROR", type: "asset", rewardId: "ast_004", description: "Reflection confirmed" },
  { code: "742", type: "asset", rewardId: "ast_005", description: "Numbers Station: first code" },
  { code: "REACTOR", type: "asset", rewardId: "ast_006", description: "Numbers Station: reactor" },
  { code: "DAYZERO", type: "asset", rewardId: "ast_007", description: "Numbers Station: day zero" },
  { code: "COUNT", type: "asset", rewardId: "ast_008", description: "Numbers Station: countdown" },
  { code: "CACHE-00", type: "asset", rewardId: "ast_009", description: "The sealed file" },
  { code: "DOOR", type: "asset", rewardId: "ast_010", description: "Numbers Station: door" },
  { code: "TRIANGULATE", type: "asset", rewardId: "ast_011", description: "Signal triangulated" },
  { code: "ANOMALY", type: "asset", rewardId: "ast_012", description: "Wandering marker captured" },
  { code: "DUST-7", type: "asset", rewardId: "ast_013", description: "Sample analyzed" },
  { code: "SKY", type: "asset", rewardId: "ast_014", description: "Memory of outside" },
  { code: "FEED", type: "asset", rewardId: "ast_015", description: "03:14 surveillance" },
  { code: "PHOSPHOR", type: "theme", rewardId: "phosphor", description: "Green terminal theme" },
  { code: "AMBER", type: "theme", rewardId: "amber", description: "Amber terminal theme" },
  { code: "CACHE-KEY", type: "cache_key", rewardId: "cache_unlock", description: "Unlocks time-locked files early" },
  { code: "WITNESS", type: "lore", rewardId: "witness_log", description: "Breach protocol witness" },
  { code: "SENSITIVE", type: "lore", rewardId: "sensitive_profile", description: "High haunted affinity" },
  { code: "ARCHIVIST", type: "lore", rewardId: "archivist_profile", description: "High abandoned affinity" },
  { code: "GHOST", type: "lore", rewardId: "ghost_profile", description: "Dust corruption complete" },
  { code: "CONTAINMENT", type: "command", rewardId: "invert", description: "Atlas inversion unlocked" },
  { code: "FREQUENCY-88", type: "asset", rewardId: "ast_005", description: "Numbers Station frequency" },
  { code: "FREQUENCY-99", type: "asset", rewardId: "ast_006", description: "Numbers Station frequency" },
  { code: "FREQUENCY-103", type: "asset", rewardId: "ast_008", description: "Numbers Station frequency" },
  { code: "FREQUENCY-107", type: "asset", rewardId: "ast_010", description: "Numbers Station frequency" },
];

// --- PUZZLE FUNCTIONS ---

export function checkCaesar(answer: string): boolean {
  return answer.toLowerCase().replace(/[^a-z]/g, "") === "thedooropensinward";
}

export const COORDINATE_FRAGMENTS = [
  { source: "DAY 023", value: 3, text: "3 degrees off the schematic" },
  { source: "TRANSMISSION", value: 8, text: "The 8th digit of the reactor coordinate" },
  { source: "CODE 742", value: 7, text: "The first digit of the first code" },
  { source: "RIDDLE", value: 4, text: "The answer has this many letters" },
];

export function checkCoordinates(nums: number[]): boolean {
  return nums.length === 4 && nums[0] === 3 && nums[1] === 8 && nums[2] === 7 && nums[3] === 4;
}

export const REQUIRED_FRAGMENTS = ["FRAG_01", "FRAG_03", "FRAG_07", "FRAG_12", "FRAG_14"];

export function checkAssembly(fragments: string[]): boolean {
  return REQUIRED_FRAGMENTS.every((f) => fragments.includes(f));
}

export const ASSEMBLED_MESSAGE =
  "ASSEMBLY COMPLETE. The door at 03:14 is not a door. It is a mouth. " +
  "The atlas does not contain places. It contains what happened to them. " +
  "You are not reading history. You are reading a confession. " +
  "CODE: ASSEMBLY-314";

export const REFLECTION_ANSWER = "check your reflection. check it again. the dust settles in patterns.";

export function checkReflection(answer: string): boolean {
  return answer.toLowerCase().replace(/[^a-z]/g, "") === REFLECTION_ANSWER.replace(/[^a-z]/g, "");
}

export const DUST_THRESHOLD = 50;

export const TRIGGER_PHRASE = "i am still here";

// --- STORAGE HELPERS ---

export function getAssetByCode(code: string): StoryAsset | undefined {
  return STORY_ASSETS.find((a) => a.unlockCode === code.toUpperCase());
}

export function getCodeEntry(code: string): RedeemableCode | undefined {
  return REDEEMABLE_CODES.find((c) => c.code === code.toUpperCase());
}

export function getUnlockedAssets(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("bunker-assets") || "[]");
}

export function unlockAsset(assetId: string): boolean {
  if (typeof window === "undefined") return false;
  const current = getUnlockedAssets();
  if (current.includes(assetId)) return false;
  current.push(assetId);
  localStorage.setItem("bunker-assets", JSON.stringify(current));
  return true;
}

export function getRedeemedCodes(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("bunker-codes") || "[]");
}

export function redeemCode(code: string): boolean {
  if (typeof window === "undefined") return false;
  const current = getRedeemedCodes();
  if (current.includes(code.toUpperCase())) return false;
  current.push(code.toUpperCase());
  localStorage.setItem("bunker-codes", JSON.stringify(current));
  return true;
}