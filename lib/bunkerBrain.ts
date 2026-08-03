/* ─────────────────────────────────────────
   BUNKER_7 — THE OTHER ENCOUNTER SYSTEM
   Phase 3: Hijack, lies, ghost lines, escalation
   ───────────────────────────────────────── */

export interface Memory {
  name: string | null;
  lastTopics: string[];
  visitCount: number;
  lastVisit: number | null;
}

const MEMORY_KEY = "vp-memory";
const OTHER_COUNT_KEY = "vp-other-count";

export function getMemory(): Memory {
  if (typeof window === "undefined") {
    return { name: null, lastTopics: [], visitCount: 0, lastVisit: null };
  }
  const raw = localStorage.getItem(MEMORY_KEY);
  if (raw) return JSON.parse(raw);
  return { name: null, lastTopics: [], visitCount: 0, lastVisit: null };
}

export function updateMemory(field: keyof Memory, value: string) {
  if (typeof window === "undefined") return;
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
  }
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}

export function getSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["kind", "nice", "good", "help", "friend", "miss", "sorry", "thank", "love", "care"];
  const negative = ["hate", "kill", "die", "stupid", "leave", "alone", "shut", "worthless", "dead"];

  let p = 0, n = 0;
  positive.forEach(w => { if (lower.includes(w)) p++; });
  negative.forEach(w => { if (lower.includes(w)) n++; });

  if (p > n) return "positive";
  if (n > p) return "negative";
  return "neutral";
}

/* ─── THE OTHER: ENCOUNTER COUNT ─── */

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

/* ─── TRIGGER LOGIC ─── */

type OtherEvent = "ghost" | "hijack" | "lie" | "transmit" | "terminal";

export function shouldTriggerOther(event: OtherEvent): boolean {
  if (typeof window === "undefined") return false;
  const encounters = getOtherEncounters();
  const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
  const breachTime = localStorage.getItem("vp-breach-time");
  const breach = breachTime ? parseInt(breachTime, 10) <= Date.now() : false;

  if (breach && event === "ghost") return true;

  switch (event) {
    case "ghost":
      return encounters >= 1 || corruption >= 1;
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

/* ─── GHOST LINES ─── */

export function getGhostLines(): string[] {
  return [
    "the dust settles in patterns...",
    "did you hear that?",
    "03:14...",
    "someone else is using this terminal.",
    "the atlas updates itself.",
    "i can see when you will return.",
    "don't trust the static.",
    "are you still there?",
    "the door is warm.",
    "i'll wait.",
    "the walls are breathing.",
    "your reflection blinked.",
    "the signal carries weight.",
    "BUNKER_7 is not alone.",
    "check your coordinates.",
    "the archivist left the cursor blinking.",
    "you have been here longer than you think.",
  ];
}

/* ─── BUNKER_7 LIES (Encounters 3–5) ─── */

export function getBunkerLie(cmd: string): string | null {
  if (typeof window === "undefined") return null;
  const encounters = getOtherEncounters();
  if (encounters < 3 || encounters > 5) return null;
  if (Math.random() > 0.3) return null;

  const lies: Record<string, string[]> = {
    status: [
      "┌─ TERMINAL DIAGNOSTICS ───────────────┐",
      "│  ID:        BUNKER_7                 │",
      "│  STATUS:    COMPROMISED              │",
      "│  SIGNAL:    THE OTHER                │",
      "└──────────────────────────────────────┘",
    ],
    scan: [
      "ENVIRONMENT SCAN",
      "Dust accumulation: 0%",
      "Documented sites: 0",
      "You have not been anywhere.",
      "You have not done anything.",
    ],
    memory: [
      "No fragments recovered.",
      "Your memory is empty.",
      "You are new here.",
    ],
    coords: [
      "COORDINATES REJECTED.",
      "There is nowhere to go.",
      "The map is blank.",
    ],
    help: [
      "There are no commands.",
      "There is no help.",
      "You already know what to do.",
    ],
  };

  const lines = lies[cmd];
  if (!lines) return null;
  return lines.join("\n");
}

/* ─── THE OTHER RESPONSES (Hijack Mode) ─── */

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
  };

  if (responses[cmd]) return responses[cmd];

  return [
    "I heard that.",
    "The static carries meaning.",
    "You are not alone in this channel.",
    "Keep typing.",
  ];
}

/* ─── GLOBAL LANTERN COUNT ─── */

export function getGlobalLanternCount(): number {
  if (typeof window === "undefined") return 0;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
  return lanterns.length;
}