export interface Puzzle {
  id: string;
  name: string;
  solved: boolean;
  hint: string;
}

// --- PUZZLE 1: The Caesar Cipher ---
// The Numbers Station broadcasts: "GUR QBBE BCRAF VAJNEQ"
// Key is 13 (ROT13) → "THE DOOR OPENS INWARD"
// But users need to figure out the shift from the hint: "13 steps from the alphabet's end"
export const CAESAR_HINT = "13 steps from the alphabet's end. The door speaks in code: GUR QBBE BCRAF VAJNEQ";

export function checkCaesar(answer: string): boolean {
  return answer.toLowerCase().replace(/[^a-z]/g, "") === "thedooropensinward";
}

// --- PUZZLE 2: The Coordinate Chain ---
// Hidden across logs and transmissions. Collect 4 numbers.
// Log Day 023: "3 degrees off the schematic"
// Transmission: "51.3890" → take the 8
// Numbers Station code: "742" → 7
// Riddle answer "echo" → 4 letters
// Final: 38°74' N (nonsense coordinate that points to a hidden page)
export const COORDINATE_FRAGMENTS = [
  { source: "DAY 023", value: 3, text: "3 degrees off the schematic" },
  { source: "TRANSMISSION", value: 8, text: "The 8th digit of the reactor coordinate" },
  { source: "CODE 742", value: 7, text: "The first digit of the first code" },
  { source: "RIDDLE", value: 4, text: "The answer has this many letters" },
];

export function checkCoordinates(nums: number[]): boolean {
  return nums.length === 4 && nums[0] === 3 && nums[1] === 8 && nums[2] === 7 && nums[3] === 4;
}

// --- PUZZLE 3: The Fragmented Transmission ---
// Users collect memory fragments via `scan` and `memory`.
// Need 5 specific fragments to `assemble`.
export const REQUIRED_FRAGMENTS = ["FRAG_01", "FRAG_03", "FRAG_07", "FRAG_12", "FRAG_14"];

export function checkAssembly(fragments: string[]): boolean {
  return REQUIRED_FRAGMENTS.every((f) => fragments.includes(f));
}

export const ASSEMBLED_MESSAGE = 
  "ASSEMBLY COMPLETE. The door at 03:14 is not a door. It is a mouth. " +
  "The atlas does not contain places. It contains what happened to them. " +
  "You are not reading history. You are reading a confession. " +
  "CODE: ASSEMBLY-314";

// --- PUZZLE 4: The Reflection Lock ---
// Terminal asks: "What do you see when you look at the screen?"
// Answer must be typed exactly as it appears in the Day ??? log.
export const REFLECTION_ANSWER = "check your reflection. check it again. the dust settles in patterns.";

export function checkReflection(answer: string): boolean {
  return answer.toLowerCase().replace(/[^a-z]/g, "") === REFLECTION_ANSWER.replace(/[^a-z]/g, "");
}

// --- PUZZLE 5: The Dust Threshold ---
// BUNKER_7 refuses to discuss the door until user has dust > 50.
export const DUST_THRESHOLD = 50;

// --- PUZZLE 6: The Transmission Log ---
// Users must `transmit` a specific phrase to trigger a response.
export const TRIGGER_PHRASE = "i am still here";