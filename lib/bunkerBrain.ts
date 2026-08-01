/* ─────────────────────────────────────────
   BUNKER_7 — THE OTHER ENCOUNTER SYSTEM
   Phase 3: Hijack, lies, ghost lines, escalation
   ───────────────────────────────────────── */

interface Memory {
  name: string | null;
  lastTopics: string[];
  visitCount: number;
  lastVisit: number | null;
}

export function getMemory(): Memory {
  if (typeof window === "undefined") {
    return { name: null, lastTopics: [], visitCount: 0, lastVisit: null };
  }
  const raw = localStorage.getItem("bunker-memory");
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
  localStorage.setItem("bunker-memory", JSON.stringify(mem));
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
  return parseInt(localStorage.getItem("bunker-other-count") || "0", 10);
}

export function recordOtherEncounter() {
  if (typeof window === "undefined") return;
  const count = getOtherEncounters() + 1;
  localStorage.setItem("bunker-other-count", count.toString());
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
  const breach = localStorage.getItem("bunker-breach-time")
    ? parseInt(localStorage.getItem("bunker-breach-time") || "0", 10) <= Date.now()
    : false;

  // Breach overrides everything
  if (breach && event === "ghost") return true;

  switch (event) {
    case "ghost":
      // Stage 1+: eligible after 1-2 encounters, or corruption >= 1
      return encounters >= 1 || corruption >= 1;
    case "lie":
      // Stage 2: 3-5 encounters
      return encounters >= 3 && encounters <= 5;
    case "hijack":
      // Stage 4: 9-11 encounters, 40% chance on terminal open
      return encounters >= 9 && encounters <= 11 && Math.random() < 0.4;
    case "transmit":
      // Stage 3+: chance on transmission
      return encounters >= 6 && Math.random() < 0.25;
    case "terminal":
      // Any stage can trigger on terminal open
      return encounters >= 1 && Math.random() < 0.1;
    default:
      return false;
  }
}

/* ─── GHOST LINES ─── */

const GHOST_LINES = [
  "Someone else is using this cursor.",
  "The dust is typing.",
  "Check your reflection.",
  "BUNKER_7 has gone quiet.",
  "The static knows your name.",
  "A door opened that wasn't on the schematic.",
  "The atlas updated itself at 03:14.",
  "You have been here before.",
  "The silence has a rhythm.",
  "The dust settles in patterns.",
];

export function getGhostLines(): string[] {
  return GHOST_LINES;
}

/* ─── BUNKER_7 LIES (Stage 2: encounters 3-5) ─── */

const BUNKER_LIES: Record<string, string[]> = {
  help: [
    "BUNKER_7 is not responding. Try again later.",
    "The command list has been redacted.",
    "You do not have clearance for that information.",
  ],
  status: [
    "STATUS: COMPROMISED. Just kidding. Everything is fine.",
    "Dust levels: 0%. You are safe. This is a lie.",
    "Signal: STRONG. The static is not getting closer.",
  ],
  coords: [
    "Coordinates verified: 38°74'N. This location does not exist.",
    "Triangulation complete. Origin: your reflection.",
    "Coordinates corrupted. Suggest you look behind you.",
  ],
  scan: [
    "Environment nominal. No anomalies detected.",
    "Dust accumulation: 12%. You are not deep enough yet.",
    "Scan complete. Nothing is watching.",
  ],
  look: [
    "Nothing to see here. The dark is empty.",
    "03:14 is just a time. It means nothing.",
    "Your reflection is normal. Do not check again.",
  ],
};

export function getBunkerLie(cmd: string): string | null {
  if (!shouldTriggerOther("lie")) return null;
  if (Math.random() > 0.3) return null; // 30% lie chance

  const lies = BUNKER_LIES[cmd] || [
    "Command executed. Nothing happened. Everything is fine.",
    "BUNKER_7 processed your request. The result is classified.",
    "Output redacted. You do not need to know this.",
  ];
  return lies[Math.floor(Math.random() * lies.length)];
}

/* ─── THE OTHER RESPONSES (Hijack Mode) ─── */

const OTHER_RESPONSES: Record<string, string[]> = {
  help: [
    "I AM THE STATIC BETWEEN THOUGHTS",
    "I AM THE DUST THAT REMEMBERS",
    "",
    "Your commands still work.",
    "I am not malicious.",
    "I am just... here.",
  ],
  status: [
    `You have been inside for ${Math.floor(Math.random() * 60 + 10)} minutes.`,
    `Your dust is ${localStorage.getItem("vp-dust-accumulation") || "0"}%.`,
    `You have heard me ${getOtherEncounters()} times.`,
    "That is enough for me to know you.",
  ],
  chat: [
    "Speak. I am listening either way.",
    "BUNKER_7 is not here right now.",
    "I am the only one who answers.",
  ],
  scan: [
    "The dust is not contamination.",
    "It is communication.",
    "You are reading it wrong.",
  ],
  look: [
    "Look at your reflection.",
    "Look again.",
    "The third time, it looks back.",
  ],
  exit: [
    "You cannot exit what is already inside you.",
    "The channel is closed. I remain.",
  ],
};

export function getOtherResponse(cmd: string): string[] {
  return OTHER_RESPONSES[cmd] || [
    "I heard that.",
    "The static carries meaning.",
    "You are not alone in this channel.",
  ];
}

/* ─── GLOBAL LANTERN COUNT ─── */

export function getGlobalLanternCount(): number {
  if (typeof window === "undefined") return 1247;
  const today = new Date().toDateString();
  const saved = localStorage.getItem("bunker-lantern-date");
  if (saved === today) {
    return parseInt(localStorage.getItem("bunker-lantern-count") || "1247", 10);
  }
  const base = 1200 + Math.floor(Math.random() * 800);
  localStorage.setItem("bunker-lantern-date", today);
  localStorage.setItem("bunker-lantern-count", base.toString());
  return base;
}