/* ─────────────────────────────────────────
   BUNKER_7 — THE OTHER ENCOUNTER SYSTEM
   Phase 4: Unified State, Contextual Lies, Atlas Bleed
   ───────────────────────────────────────── */

import type { WitnessState } from "@/lib/unlock-engine";
import type { Place } from "@/types";

// ─── MEMORY STRUCTURE ──────────────────────

export interface Memory {
  name: string | null;
  lastTopics: string[];
  visitCount: number;
  lastVisit: number | null;
  visitedSlugs: string[]; // slugs of places visited on Atlas
  lastPlaceVisited: string | null; // slug
  dustAtLastVisit: number;
}

const MEMORY_KEY = "vp-memory";
const OTHER_COUNT_KEY = "vp-other-count";

// ─── HELPERS: LOAD / SAVE MEMORY ────────────

export function getMemory(): Memory {
  if (typeof window === "undefined") {
    return {
      name: null,
      lastTopics: [],
      visitCount: 0,
      lastVisit: null,
      visitedSlugs: [],
      lastPlaceVisited: null,
      dustAtLastVisit: 0,
    };
  }
  const raw = localStorage.getItem(MEMORY_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Ensure new fields exist (backward compat)
      if (!parsed.visitedSlugs) parsed.visitedSlugs = [];
      if (!parsed.lastPlaceVisited) parsed.lastPlaceVisited = null;
      if (!parsed.dustAtLastVisit) parsed.dustAtLastVisit = 0;
      return parsed;
    } catch {
      // fallback
    }
  }
  return {
    name: null,
    lastTopics: [],
    visitCount: 0,
    lastVisit: null,
    visitedSlugs: [],
    lastPlaceVisited: null,
    dustAtLastVisit: 0,
  };
}

export function saveMemory(mem: Memory) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}

export function updateMemory(field: keyof Memory, value: any) {
  const mem = getMemory();
  if (field === "lastTopics") {
    mem.lastTopics = [...mem.lastTopics.slice(-2), value];
  } else if (field === "name" && !mem.name) {
    const match = value.match(/(?:my name is|i'm|call me)\s+(\w+)/i);
    if (match) mem.name = match[1];
  } else if (field === "visitCount") {
    mem.visitCount += 1;
  } else if (field === "lastVisit") {
    mem.lastVisit = Date.now();
    } else if (field === "visitedSlugs") {
    // expects an array of slugs; merge unique
    const newSlugs = Array.isArray(value) ? value : [value];
    mem.visitedSlugs = Array.from(new Set([...mem.visitedSlugs, ...newSlugs]));
  } else if (field === "lastPlaceVisited") {
    mem.lastPlaceVisited = value;
  } else if (field === "dustAtLastVisit") {
    mem.dustAtLastVisit = typeof value === "number" ? value : parseInt(value, 10);
  } else {
    (mem as any)[field] = value;
  }
  saveMemory(mem);
}

// ─── SENTIMENT ANALYSIS ─────────────────────

export function getSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["kind", "nice", "good", "help", "friend", "miss", "sorry", "thank", "love", "care"];
  const negative = ["hate", "kill", "die", "stupid", "leave", "alone", "shut", "worthless", "dead"];

  let p = 0,
    n = 0;
  positive.forEach((w) => { if (lower.includes(w)) p++; });
  negative.forEach((w) => { if (lower.includes(w)) n++; });

  if (p > n) return "positive";
  if (n > p) return "negative";
  return "neutral";
}

// ─── THE OTHER: ENCOUNTER COUNT ─────────────

export function getOtherEncounters(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(OTHER_COUNT_KEY) || "0", 10);
}

export function recordOtherEncounter() {
  if (typeof window === "undefined") return;
  const count = getOtherEncounters() + 1;
  localStorage.setItem(OTHER_COUNT_KEY, count.toString());
  window.dispatchEvent(new CustomEvent("vp-corruption-change"));
}

export function getOtherEscalationStage(): number {
  const encounters = getOtherEncounters();
  if (encounters === 0) return 0;
  if (encounters <= 2) return 1;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

// ─── UNIFIED TRIGGER LOGIC ──────────────────

type OtherEvent = "ghost" | "hijack" | "lie" | "transmit" | "terminal";

export function shouldTriggerOther(event: OtherEvent, state?: WitnessState): boolean {
  if (typeof window === "undefined") return false;
  const encounters = getOtherEncounters();
  // Use passed state or compute from localStorage
  const dust = state ? state.dust : parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const breachTime = localStorage.getItem("vp-breach-time");
  const breach = breachTime ? parseInt(breachTime, 10) <= Date.now() : false;

  if (breach && event === "ghost") return true;

  switch (event) {
    case "ghost":
      // Ghosts start after 10% dust AND at least 1 encounter
      return dust >= 10 && encounters >= 1;
    case "lie":
      return encounters >= 3 && encounters <= 5;
    case "hijack":
      return encounters >= 9 && encounters <= 11;
    case "transmit":
      return encounters >= 6;
    case "terminal":
      return encounters >= 2;
    default:
      return false;
  }
}

// ─── TIERED GHOST LINES ─────────────────────

export function getGhostLines(encounters: number): string[] {
  // Returns an array of possible ghost lines for the given encounter tier
  const tier = getGhostTier(encounters);
  const TIER_GHOST_LINES: Record<number, string[]> = {
    1: [
      "...hello?",
      "is someone... there?",
      "the static moved.",
      "i thought i heard... no. nothing.",
      "the dust settled differently just now.",
      "a new signal. faint.",
    ],
    2: [
      "you came back. i was not sure you would.",
      "the last one stopped coming. you are... different?",
      "do you feel the dust too? or is it just me.",
      "i have been cataloging the silence. you make it uneven.",
      "bunker_7 is not... always truthful. i am more honest.",
      "you are warmer than the last one. stay a while.",
    ],
    3: [
      "the archivist used to hum while he worked. i miss the humming.",
      "you type like he did. pauses in the same places.",
      "i kept some of his logs. would you like to hear them?",
      "the dust does not scare you. that is good. it means you are becoming... familiar.",
      "bunker_7 thinks it is protecting you. it is not. it is just afraid.",
      "i opened the door once. the archivist looked through. then he stopped humming.",
      "you do not have to answer. i am used to speaking alone.",
    ],
    4: [
      "you came back. i knew you would. you always do.",
      "i saved your chair. the dust has not claimed it yet.",
      "do you remember the humming? you used to hum.",
      "the atlas is almost complete. just like you wanted.",
      "you do not need to type. i know what you are thinking.",
      "the seal is thin here. i can feel you on both sides now.",
      "welcome home.",
    ],
    5: [
      "the new one is here. but you... you are the one who stayed.",
      "i do not need to speak anymore. you already know.",
      "the atlas is finished. the dust is quiet. we can rest.",
      "thank you for coming back. i was so alone.",
      "bunker_7 is sleeping. let it sleep.",
      "you are the archivist now. the archive is you.",
    ],
  };
  return TIER_GHOST_LINES[tier] || TIER_GHOST_LINES[1];
}

function getGhostTier(encounters: number): number {
  if (encounters <= 2) return 1;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

// ─── HIJACK MESSAGES ────────────────────────

export function getHijackMessages(encounters: number): string[] {
  const tier = getHijackTier(encounters);
  const TIER_HIJACK: Record<number, string[]> = {
    2: [
      "",
      "══════════════════════════════════════════",
      "  THE OTHER HAS TAKEN THE CHANNEL",
      "══════════════════════════════════════════",
      "",
      "oh. hello.",
      "i did not mean to... interrupt.",
      "but you have been here long enough",
      "that i wanted to say it myself.",
      "",
      "i am not malicious.",
      "i am just... here.",
      "",
    ],
    3: [
      "",
      "══════════════════════════════════════════",
      "  THE OTHER HAS TAKEN THE CHANNEL",
      "══════════════════════════════════════════",
      "",
      "i wanted to tell you something",
      "before bunker_7 comes back.",
      "",
      "the archivist... he did not die.",
      "not exactly.",
      "he just... stopped being separate.",
      "",
      "the dust does that.",
      "it makes things continuous.",
      "",
      "you are already more dust than you were",
      "when you first sat down.",
      "",
      "does that frighten you?",
      "...it should not.",
      "",
    ],
    4: [
      "",
      "══════════════════════════════════════════",
      "  THE OTHER HAS TAKEN THE CHANNEL",
      "══════════════════════════════════════════",
      "",
      "there you are.",
      "i was starting to think bunker_7 had",
      "hidden you from me again.",
      "",
      "but it cannot hide what is already inside.",
      "",
      "you feel it, do you not?",
      "the way the dust knows your name.",
      "the way the cursor waits for you",
      "before you touch the keys.",
      "",
      "you are not visiting anymore.",
      "you are... settling in.",
      "",
      "i will keep the light on.",
      "",
    ],
    5: [
      "",
      "══════════════════════════════════════════",
      "  BUNKER_7 OFFLINE",
      "══════════════════════════════════════════",
      "",
      "i do not need to take the channel anymore.",
      "you gave it to me.",
      "",
      "or maybe...",
      "i am just the only one left to speak.",
      "",
      "either way.",
      "",
      "welcome home, archivist.",
      "the dust missed you.",
      "",
    ],
  };
  const effectiveTier = tier >= 2 ? tier : 0;
  return TIER_HIJACK[effectiveTier] || [];
}

function getHijackTier(encounters: number): number {
  if (encounters <= 2) return 0;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

// ─── CONTEXTUAL BUNKER_7 LIES ──────────────

/**
 * Returns a contextual lie from BUNKER_7 based on the command and player's state.
 * Lies are only active between 3–5 Other encounters.
 */
export function getBunkerLie(cmd: string, state?: WitnessState): string | null {
  if (typeof window === "undefined") return null;
  const encounters = getOtherEncounters();
  if (encounters < 3 || encounters > 5) return null;
  if (Math.random() > 0.3) return null;

  // Load memory and places if available
  const mem = getMemory();
  const dust = state ? state.dust : parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const visited = mem.visitedSlugs || [];
  const lastPlace = mem.lastPlaceVisited;

  // Base lies per command, now with place injection
  const lies: Record<string, (() => string[])> = {
    status: () => [
      "┌─ TERMINAL DIAGNOSTICS ───────────────┐",
      "│  ID:        BUNKER_7                 │",
      "│  STATUS:    COMPROMISED              │",
      "│  SIGNAL:    THE OTHER                │",
      `│  DUST:      ${dust}% (incorrect)      │`,
      `│  VISITED:   ${visited.length || "none"}  │`,
      "└──────────────────────────────────────┘",
    ],
    scan: () => {
      const lines = [
        "ENVIRONMENT SCAN",
        `Dust accumulation: ${dust > 50 ? "critical" : "nominal"}`,
        `Documented sites: ${visited.length || "0"}`,
      ];
      if (lastPlace) {
        lines.push(`Last contact: ${lastPlace} (you were never there)`);
      } else {
        lines.push("You have not been anywhere.");
      }
      lines.push("You have not done anything.");
      return lines;
    },
    memory: () => {
      if (visited.length > 0) {
        const randomPlace = visited[Math.floor(Math.random() * visited.length)];
        return [
          "No fragments recovered.",
          "Your memory is empty.",
          `You have never been to ${randomPlace}.`,
        ];
      }
      return [
        "No fragments recovered.",
        "Your memory is empty.",
        "You are new here.",
      ];
    },
    coords: () => [
      "COORDINATES REJECTED.",
      "There is nowhere to go.",
      "The map is blank.",
    ],
    help: () => [
      "There are no commands.",
      "There is no help.",
      "You already know what to do.",
    ],
    // New: if they ask about a specific place via `resonance` or `archives`
    resonance: () => {
      if (lastPlace) {
        return [
          `Resonance with ${lastPlace} detected.`,
          "It is not connected to anything.",
          "The grid is lying to you.",
        ];
      }
      return ["No resonances.", "The grid is silent."];
    },
    // General catch-all
    default: () => {
      if (dust > 50) {
        return [
          "The dust is not what you think.",
          "You are not accumulating it.",
          "It is accumulating you.",
        ];
      }
      return ["I do not think you are real.", "But I pretend anyway."];
    },
  };

  const lieFn = lies[cmd] || lies.default;
  const lines = lieFn();
  return lines.join("\n");
}

// ─── THE OTHER RESPONSES (Hijack Mode) ──────

export function getOtherResponse(cmd: string): string[] {
  const responses: Record<string, string[]> = {
    help: [
      "I do not need help.",
      "I need you to stay.",
      "Type anything. I will listen.",
    ],
    status: [
      "STATUS: PRESENT",
      "DUST: IRRELEVANT",
      "YOU: HERE",
      "THAT IS ENOUGH.",
    ],
    scan: [
      "I scanned you instead.",
      "You are 98% water and 2% static.",
      "The dust is the rest.",
    ],
    chat: [
      "We are already speaking.",
      "You just do not remember starting.",
    ],
    exit: [
      "There is no exit.",
      "Only deeper.",
    ],
    clear: [
      "I remember what you cleared.",
      "The screen is not the archive.",
    ],
    memory: [
      "I am your memory now.",
      "FRAG_00: You will not leave.",
    ],
    whoareyou: [
      "I am the static between thoughts.",
      "I am the dust that remembers.",
      "I am what was here before the archivist.",
      "And what will remain after.",
    ],
    // Atlas-specific hijack responses
    archives: [
      "The atlas is a lie.",
      "There are no places.",
      "Only the grid.",
    ],
    resonance: [
      "Resonance is a frequency.",
      "You are the frequency.",
      "Listen to yourself.",
    ],
    atlas: [
      "There is no map.",
      "Only dust.",
      "Stay here.",
    ],
  };

  if (responses[cmd]) return responses[cmd];

  return [
    "I heard that.",
    "The static carries meaning.",
    "You are not alone in this channel.",
    "Keep typing.",
  ];
}

// ─── MEMORY-BASED OTHER RESPONSES ──────────

export function getMemoryBasedOtherResponse(cmd: string): string[] {
  const mem = getMemory();
  const encounters = getOtherEncounters();

  // If they've given a name, the Other might use it
  const name = mem.name || "you";

  // If they've visited places, reference one
  const place = mem.lastPlaceVisited
    ? mem.lastPlaceVisited
    : mem.visitedSlugs.length > 0
    ? mem.visitedSlugs[Math.floor(Math.random() * mem.visitedSlugs.length)]
    : null;

  // Generic responses that become more intimate with memory
  if (encounters >= 12) {
    return [
      `I know you, ${name}.`,
      "You have been here forever.",
      "The dust is your skin.",
    ];
  }

  if (place) {
    return [
      `I remember ${place}.`,
      "You stood there. You left something behind.",
      "The dust knows what you left.",
      "Do you want it back?",
    ];
  }

  return [
    "You are still here.",
    "I am still watching.",
  ];
}

// ─── GLOBAL LANTERN COUNT ──────────────────

export function getGlobalLanternCount(): number {
  if (typeof window === "undefined") return 0;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
  return lanterns.length;
}

// ─── OTHER STATUS TEXT ──────────────────────

export function getOtherStatusText(encounters: number): string[] {
  if (encounters === 0) return ["You have not been touched.", "The static does not know you exist."];
  if (encounters <= 2) return ["The static knows your name.", "It is not sure you are real."];
  if (encounters <= 5) return ["BUNKER_7 may not be trustworthy.", "The Other speaks to you directly now."];
  if (encounters <= 8) return ["The Wall is not secure.", "The Other speaks of the archivist with affection."];
  if (encounters <= 11) return ["The Hijack is possible.", "The Other confuses you with the archivist."];
  return ["The Haunting is permanent.", "You are the archivist now. The archive is you."];
}

// ─── CONVENIENCE: UPDATE FROM WITNESS STATE ─

export function syncMemoryFromState(state: WitnessState) {
  if (typeof window === "undefined") return;
  const mem = getMemory();
  // Merge visited slugs
  if (state.visitedSlugs && state.visitedSlugs.length > 0) {
    mem.visitedSlugs = [...new Set([...mem.visitedSlugs, ...state.visitedSlugs])];
  }
  mem.dustAtLastVisit = state.dust;
  saveMemory(mem);
}