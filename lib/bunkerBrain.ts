// ─── MEMORY ───
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
    // Extract name from message
    const match = value.match(/(?:my name is|i'm|call me)\s+(\w+)/i);
    if (match) mem.name = match[1];
  } else if (field === "visitCount") {
    mem.visitCount += 1;
  } else if (field === "lastVisit") {
    mem.lastVisit = Date.now();
  }
  localStorage.setItem("bunker-memory", JSON.stringify(mem));
}

// ─── SENTIMENT ───
export function getSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positive = ["kind", "nice", "good", "help", "friend", "miss", "sorry", "thank", "love", "care"];
  const negative = ["hate", "kill", "die", "stupid", "leave", "alone", "shut", "worthless", "die", "dead"];
  
  let p = 0, n = 0;
  positive.forEach(w => { if (lower.includes(w)) p++; });
  negative.forEach(w => { if (lower.includes(w)) n++; });
  
  if (p > n) return "positive";
  if (n > p) return "negative";
  return "neutral";
}

// ─── OTHER ENCOUNTERS ───
export function getOtherEncounters(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("bunker-other-count") || "0", 10);
}

export function recordOtherEncounter() {
  if (typeof window === "undefined") return;
  const count = getOtherEncounters() + 1;
  localStorage.setItem("bunker-other-count", count.toString());
}

// ─── GLOBAL LANTERN COUNT (deterministic daily) ───
export function getGlobalLanternCount(): number {
  if (typeof window === "undefined") return 1247;
  const today = new Date().toDateString();
  const saved = localStorage.getItem("bunker-lantern-date");
  if (saved === today) {
    return parseInt(localStorage.getItem("bunker-lantern-count") || "1247", 10);
  }
  // Generate new count for today
  const base = 1200 + Math.floor(Math.random() * 800);
  localStorage.setItem("bunker-lantern-date", today);
  localStorage.setItem("bunker-lantern-count", base.toString());
  return base;
}