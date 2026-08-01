"use client";

import { useState, useEffect, useCallback } from "react";

const ACTIVE_KEY = "vp-active-lead";
const COMPLETED_KEY = "vp-completed-leads";

export interface LeadObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  category: "signal" | "expedition" | "corruption" | "community" | "lore";
  priority: number;
  objectives: LeadObjective[];
  rewards?: {
    dust?: number;
    fragments?: string[];
    items?: string[];
    codes?: string[];
    corruptionDelta?: number;
  };
  hint?: string;
}

export interface LeadState {
  active: Lead | null;
  completed: string[];
  progress: number; // 0-100
}

function loadActive(): Lead | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveActive(lead: Lead | null) {
  if (typeof window === "undefined") return;
  if (lead) localStorage.setItem(ACTIVE_KEY, JSON.stringify(lead));
  else localStorage.removeItem(ACTIVE_KEY);
}

function loadCompleted(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COMPLETED_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCompleted(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids));
}

export function useLeads(): LeadState & {
  refresh: () => void;
  abandon: () => void;
} {
  const [active, setActive] = useState<Lead | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setActive(loadActive());
    setCompleted(loadCompleted());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const progress = active
    ? Math.round(
        (active.objectives.filter((o) => o.completed).length / active.objectives.length) * 100
      )
    : 0;

  const abandon = useCallback(() => {
    saveActive(null);
    setActive(null);
  }, []);

  return { active, completed, progress, refresh, abandon };
}

/** Call this after any player action to check lead progress */
export function checkLeadProgress(): Lead | null {
  if (typeof window === "undefined") return null;
  const active = loadActive();
  if (!active) return null;

  // Re-evaluate each objective
  let changed = false;
  const updated = {
    ...active,
    objectives: active.objectives.map((obj) => {
      const checkFn = getObjectiveCheck(obj.id);
      const result = checkFn ? checkFn() : obj.completed;
      if (result !== obj.completed) changed = true;
      return { ...obj, completed: result };
    }),
  };

  if (changed) {
    saveActive(updated);
  }

  // If all complete, mark done and return null
  if (updated.objectives.every((o) => o.completed)) {
    const completed = loadCompleted();
    if (!completed.includes(updated.id)) {
      completed.push(updated.id);
      saveCompleted(completed);
    }
    saveActive(null);
    // Apply rewards
    if (updated.rewards?.dust) {
      const current = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
      localStorage.setItem("vp-dust-accumulation", String(Math.min(100, current + updated.rewards.dust)));
    }
    if (updated.rewards?.corruptionDelta) {
      const current = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
      localStorage.setItem("vp-corruption-stage", String(Math.min(10, current + updated.rewards.corruptionDelta)));
    }
    if (updated.rewards?.fragments) {
      const existing = JSON.parse(localStorage.getItem("bunker-fragments") || "[]");
      const merged = Array.from(new Set([...existing, ...updated.rewards.fragments]));
      localStorage.setItem("bunker-fragments", JSON.stringify(merged));
    }
    if (updated.rewards?.items) {
      const existing = JSON.parse(localStorage.getItem("bunker-inventory") || "[]");
      const merged = Array.from(new Set([...existing, ...updated.rewards.items]));
      localStorage.setItem("bunker-inventory", JSON.stringify(merged));
    }
    return null;
  }

  return updated;
}

/** Generate the next lead based on player state */
export function generateNextLead(): Lead | null {
  if (typeof window === "undefined") return null;
  const completed = loadCompleted();
  const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
  const sealed = Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length;
  const signals = Object.keys(localStorage).filter((k) => k.startsWith("vp-signal-")).length;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]").length;
  const inventory = JSON.parse(localStorage.getItem("bunker-inventory") || "[]");
  const echoes = localStorage.getItem("echoes-visited") === "true";
  const otherCount = parseInt(localStorage.getItem("bunker-other-count") || "0", 10);

  // Score each candidate lead
  const candidates = ALL_LEADS.filter((l) => !completed.includes(l.id));
  if (candidates.length === 0) return null;

  // Weight by priority + state relevance
  const scored = candidates.map((l) => {
    let score = l.priority;
    // Boost if player is close to completing it
    const ready = l.objectives.filter((o) => {
      const check = getObjectiveCheck(o.id);
      return check ? check() : false;
    }).length;
    score += ready * 20;
    return { lead: l, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].lead;

  // Save and return
  saveActive(chosen);
  return chosen;
}

/** Objective check functions — keyed by objective ID */
const CHECKS: Record<string, () => boolean> = {
  // LEAD_01: First Signal
  "decode_any_signal": () => {
    return Object.keys(localStorage).some((k) => k.startsWith("vp-signal-"));
  },
  "visit_echoes": () => {
    return localStorage.getItem("echoes-visited") === "true";
  },

  // LEAD_02: First Expedition
  "complete_expedition": () => {
    return Object.keys(localStorage).some((k) => k.startsWith("vp-expedition-"));
  },
  "reach_dust_15": () => {
    return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10) >= 15;
  },

  // LEAD_03: The Counting House
  "decode_hashima": () => {
    return localStorage.getItem("vp-signal-hashima-island") === "true";
  },
  "unlock_hashima_dossier": () => {
    return localStorage.getItem("vp-dossier-hashima-island") === "true";
  },

  // LEAD_04: Lantern Grid
  "place_3_lanterns": () => {
    return (JSON.parse(localStorage.getItem("vp-lanterns") || "[]") as any[]).length >= 3;
  },
  "visit_5_places": () => {
    return Object.keys(localStorage).filter((k) => k.startsWith("vp-tier-")).length >= 5;
  },

  // LEAD_05: The Woodpecker
  "decode_duga": () => {
    return localStorage.getItem("vp-signal-duga-radar-array") === "true";
  },
  "seal_duga": () => {
    return localStorage.getItem("vp-sealed-duga-radar-array") === "true";
  },

  // LEAD_06: The Other
  "other_encounter_3": () => {
    return parseInt(localStorage.getItem("bunker-other-count") || "0", 10) >= 3;
  },
  "corruption_2": () => {
    return parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10) >= 2;
  },

  // LEAD_07: Static Veil
  "decode_poveglia": () => {
    return localStorage.getItem("vp-signal-poveglia-island") === "true";
  },
  "seal_poveglia": () => {
    return localStorage.getItem("vp-sealed-poveglia-island") === "true";
  },

  // LEAD_08: Lost Expedition
  "decode_aokigahara": () => {
    return localStorage.getItem("vp-signal-aokigahara-forest") === "true";
  },
  "seal_aokigahara": () => {
    return localStorage.getItem("vp-sealed-aokigahara-forest") === "true";
  },

  // LEAD_09: The Sealed Record
  "seal_3_places": () => {
    return Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length >= 3;
  },
  "reach_dust_50": () => {
    return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10) >= 50;
  },

  // LEAD_10: The Final Transmission
  "decode_all_4_signals": () => {
    const slugs = ["duga-radar-array", "hashima-island", "aokigahara-forest", "poveglia-island"];
    return slugs.every((s) => localStorage.getItem(`vp-signal-${s}`) === "true");
  },
  "seal_5_places": () => {
    return Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length >= 5;
  },
  "reach_corruption_3": () => {
    return parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10) >= 3;
  },
};

function getObjectiveCheck(id: string): (() => boolean) | undefined {
  return CHECKS[id];
}

/** All lead definitions */
const ALL_LEADS: Lead[] = [
  {
    id: "LEAD_01",
    title: "The Frequency",
    description:
      "BUNKER_7 has detected anomalous shortwave transmissions originating from four documented ruins. The first step is learning to listen.",
    category: "signal",
    priority: 100,
    objectives: [
      { id: "visit_echoes", text: "Visit the BUNKER_7 terminal", completed: false },
      { id: "decode_any_signal", text: "Decode any transmission from the Numbers Station", completed: false },
    ],
    rewards: { dust: 10, fragments: ["FRAG_01"] },
    hint: "Type 'signal' in the terminal. Tune to 4.50 MHz and lock the frequency.",
  },
  {
    id: "LEAD_02",
    title: "Field Test",
    description:
      "Reading about ruins is not enough. BUNKER_7 requires field documentation. The dust will teach you what the archives cannot.",
    category: "expedition",
    priority: 90,
    objectives: [
      { id: "reach_dust_15", text: "Accumulate 15% dust by visiting places on the Atlas", completed: false },
      { id: "complete_expedition", text: "Complete your first expedition", completed: false },
    ],
    rewards: { dust: 15, items: ["breathing-mask"] },
    hint: "Open any place on the Atlas, then click 'Begin Expedition'.",
  },
  {
    id: "LEAD_03",
    title: "The Counting House",
    description:
      "Hashima Island broadcasts a numbers station that has been counting backward since 1987. The count is not in any known numeral system. BUNKER_7 believes it is counting down to an event.",
    category: "signal",
    priority: 80,
    objectives: [
      { id: "decode_hashima", text: "Decode the Hashima signal (9.18 MHz)", completed: false },
      { id: "unlock_hashima_dossier", text: "Unlock the Intercepted Dossier in Hashima's PlacePanel", completed: false },
    ],
    rewards: { dust: 20, fragments: ["FRAG_02"], items: ["concrete-shard"] },
    hint: "The Hashima cipher is Atbash. No key needed — just reverse the alphabet.",
  },
  {
    id: "LEAD_04",
    title: "The Lantern Grid",
    description:
      "The Atlas is not just a map. It is a containment grid. Each lantern placed strengthens the seal. BUNKER_7 needs witnesses to mark the ruins before they are forgotten entirely.",
    category: "community",
    priority: 70,
    objectives: [
      { id: "visit_5_places", text: "Open 5 different places on the Atlas", completed: false },
      { id: "place_3_lanterns", text: "Place 3 lanterns on the Atlas", completed: false },
    ],
    rewards: { dust: 15, fragments: ["FRAG_03"] },
    hint: "Click any place pin, then use the bookmark/lantern button to mark it.",
  },
  {
    id: "LEAD_05",
    title: "The Woodpecker",
    description:
      "Duga's signal — the Russian Woodpecker — was officially an over-the-horizon radar. BUNKER_7 believes it was a countdown interrupted in 1989. The array wants to finish counting.",
    category: "signal",
    priority: 75,
    objectives: [
      { id: "decode_duga", text: "Decode the Duga signal (4.50 MHz)", completed: false },
      { id: "seal_duga", text: "Seal the Duga Radar Array record", completed: false },
    ],
    rewards: { dust: 25, fragments: ["FRAG_04", "FRAG_05"], items: ["woodpecker-tape"] },
    hint: "The Duga cipher is Caesar shift 13. The code is WOODPECKER-314.",
  },
  {
    id: "LEAD_06",
    title: "The Other",
    description:
      "Something is using the terminal. Something is using your cursor. BUNKER_7 calls it The Other. It does not have a name because names imply it can be called.",
    category: "corruption",
    priority: 60,
    objectives: [
      { id: "corruption_2", text: "Reach corruption stage 2", completed: false },
      { id: "other_encounter_3", text: "Encounter The Other 3 times", completed: false },
    ],
    rewards: { dust: 20, fragments: ["FRAG_06"], corruptionDelta: 1 },
    hint: "Fail decodes. Push deeper into haunted expeditions. The Other finds the reckless.",
  },
  {
    id: "LEAD_07",
    title: "Static Veil",
    description:
      "Poveglia does not broadcast a signal. It broadcasts a curtain. The static between stations is full of things that have not happened yet, trying to get through.",
    category: "signal",
    priority: 65,
    objectives: [
      { id: "decode_poveglia", text: "Decode the Poveglia signal (21.00 MHz)", completed: false },
      { id: "seal_poveglia", text: "Seal the Poveglia Island record", completed: false },
    ],
    rewards: { dust: 25, fragments: ["FRAG_07"], items: ["plague-mask"] },
    hint: "The Poveglia cipher is reverse text. Read it backward.",
  },
  {
    id: "LEAD_08",
    title: "Lost Expedition",
    description:
      "Expedition Team 4 walked into Aokigahara with six members. The black box recorded seven voices. The seventh speaks a dialect last used in the Edo period. It is giving directions deeper into the forest.",
    category: "expedition",
    priority: 65,
    objectives: [
      { id: "decode_aokigahara", text: "Decode the Aokigahara signal (15.60 MHz)", completed: false },
      { id: "seal_aokigahara", text: "Seal the Aokigahara Forest record", completed: false },
    ],
    rewards: { dust: 25, fragments: ["FRAG_08"], items: ["white-robe-fragment"] },
    hint: "The Aokigahara cipher is Vigenère. The key is AOKI.",
  },
  {
    id: "LEAD_09",
    title: "The Sealed Record",
    description:
      "Three places sealed. The atlas is not just a map — it is a lock. Every seal you turn keeps something contained. But the dust remembers. The dust always remembers.",
    category: "lore",
    priority: 50,
    objectives: [
      { id: "seal_3_places", text: "Seal 3 places on the Atlas", completed: false },
      { id: "reach_dust_50", text: "Reach 50% dust accumulation", completed: false },
    ],
    rewards: { dust: 30, fragments: ["FRAG_09", "FRAG_10"], items: ["sealed-letter"] },
    hint: "Complete expeditions, reach Documented tier, then click 'Seal Record'.",
  },
  {
    id: "LEAD_10",
    title: "The Final Transmission",
    description:
      "All four signals decoded. Five places sealed. Corruption at stage 3. BUNKER_7 is assembling something from the fragments. The Final Transmission is not a message. It is a door.",
    category: "lore",
    priority: 10,
    objectives: [
      { id: "decode_all_4_signals", text: "Decode all 4 Numbers Station signals", completed: false },
      { id: "seal_5_places", text: "Seal 5 places on the Atlas", completed: false },
      { id: "reach_corruption_3", text: "Reach corruption stage 3", completed: false },
    ],
    rewards: { dust: 50, fragments: ["FRAG_11", "FRAG_12", "FRAG_13", "FRAG_14"], codes: ["FINAL-TRANSMISSION-7"] },
    hint: "The end of one archive is the beginning of another.",
  },
];