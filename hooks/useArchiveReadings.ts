"use client";

import { useState, useEffect, useCallback } from "react";

const ACTIVE_KEY = "vp-active-reading";
const COMPLETED_KEY = "vp-completed-readings";

export interface ReadingCondition {
  id: string;
  text: string;
  observed: boolean;
}

export interface ArchiveReading {
  id: string;
  title: string;
  description: string;
  category: "signal" | "expedition" | "corruption" | "community" | "lore";
  conditions: ReadingCondition[];
}

export interface ReadingState {
  active: ArchiveReading | null;
  completed: string[];
  clarity: number; // 0-100 — how much of the pattern is visible
}

function loadActive(): ArchiveReading | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveActive(reading: ArchiveReading | null) {
  if (typeof window === "undefined") return;
  if (reading) localStorage.setItem(ACTIVE_KEY, JSON.stringify(reading));
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

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

function addDust(amount: number) {
  if (typeof window === "undefined") return;
  const next = Math.min(100, getDust() + amount);
  localStorage.setItem("vp-dust-accumulation", next.toString());
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

function addCorruption(amount: number) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
  localStorage.setItem("vp-corruption-stage", String(Math.min(10, current + amount)));
  window.dispatchEvent(new CustomEvent("vp-corruption-change"));
}

export function useArchiveReadings(): ReadingState & {
  refresh: () => void;
  abandon: () => void;
} {
  const [active, setActive] = useState<ArchiveReading | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setActive(loadActive());
    setCompleted(loadCompleted());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clarity = active
    ? Math.round(
        (active.conditions.filter((c) => c.observed).length / active.conditions.length) * 100
      )
    : 0;

  const abandon = useCallback(() => {
    saveActive(null);
    setActive(null);
  }, []);

  return { active, completed, clarity, refresh, abandon };
}

/** Re-evaluate which conditions have been observed based on archive state */
export function synchronizeReadings(): ArchiveReading | null {
  if (typeof window === "undefined") return null;
  const active = loadActive();
  if (!active) return null;

  let changed = false;
  const updated = {
    ...active,
    conditions: active.conditions.map((cond) => {
      const checkFn = getConditionCheck(cond.id);
      const result = checkFn ? checkFn() : cond.observed;
      if (result !== cond.observed) changed = true;
      return { ...cond, observed: result };
    }),
  };

  if (changed) {
    saveActive(updated);
  }

  if (updated.conditions.every((c) => c.observed)) {
    const completed = loadCompleted();
    if (!completed.includes(updated.id)) {
      completed.push(updated.id);
      saveCompleted(completed);
    }
    saveActive(null);

    // Narrative aftermath: dust settles, corruption shifts
    // These are atmospheric consequences, not transactional rewards
    const aftermath = ALL_READINGS.find((r) => r.id === updated.id);
    if (aftermath?.id === "READ_06") addCorruption(1);
    if (aftermath?.id === "READ_10") addDust(10); // The door opening is significant

    return null;
  }

  return updated;
}

/** Surface the next unread pattern based on archive resonance */
export function detectNextReading(): ArchiveReading | null {
  if (typeof window === "undefined") return null;
  const completed = loadCompleted();

  const candidates = ALL_READINGS.filter((r) => !completed.includes(r.id));
  if (candidates.length === 0) return null;

  // The archive surfaces what is most relevant, not what is "next"
  const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
  const sealed = Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length;
  const signals = Object.keys(localStorage).filter((k) => k.startsWith("vp-signal-")).length;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]").length;
  const echoes = localStorage.getItem("vp-echoes-visited") === "true";

  const scored = candidates.map((r) => {
    let score = 0;
    const ready = r.conditions.filter((c) => {
      const check = getConditionCheck(c.id);
      return check ? check() : false;
    }).length;
    score += ready * 20;
    return { reading: r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].reading;

  saveActive(chosen);
  return chosen;
}

/** Condition check functions — keyed by condition ID */
const CHECKS: Record<string, () => boolean> = {
  "decode_any_signal": () =>
    Object.keys(localStorage).some((k) => k.startsWith("vp-signal-")),
  "visit_echoes": () =>
    localStorage.getItem("vp-echoes-visited") === "true",
  "complete_expedition": () =>
    Object.keys(localStorage).some((k) => k.startsWith("vp-expedition-")),
  "reach_dust_15": () =>
    parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10) >= 15,
  "decode_hashima": () =>
    localStorage.getItem("vp-signal-hashima-island") === "true",
  "unlock_hashima_dossier": () =>
    localStorage.getItem("vp-dossier-hashima-island") === "true",
  "place_3_lanterns": () =>
    (JSON.parse(localStorage.getItem("vp-lanterns") || "[]") as any[]).length >= 3,
  "visit_5_places": () =>
    Object.keys(localStorage).filter((k) => k.startsWith("vp-tier-")).length >= 5,
  "decode_duga": () =>
    localStorage.getItem("vp-signal-duga-radar-array") === "true",
  "seal_duga": () =>
    localStorage.getItem("vp-sealed-duga-radar-array") === "true",
  "other_encounter_3": () =>
    parseInt(localStorage.getItem("vp-other-count") || "0", 10) >= 3,
  "corruption_2": () =>
    parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10) >= 2,
  "decode_poveglia": () =>
    localStorage.getItem("vp-signal-poveglia-island") === "true",
  "seal_poveglia": () =>
    localStorage.getItem("vp-sealed-poveglia-island") === "true",
  "decode_aokigahara": () =>
    localStorage.getItem("vp-signal-aokigahara-forest") === "true",
  "seal_aokigahara": () =>
    localStorage.getItem("vp-sealed-aokigahara-forest") === "true",
  "seal_3_places": () =>
    Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length >= 3,
  "reach_dust_50": () =>
    parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10) >= 50,
  "decode_all_4_signals": () => {
    const slugs = ["duga-radar-array", "hashima-island", "aokigahara-forest", "poveglia-island"];
    return slugs.every((s) => localStorage.getItem(`vp-signal-${s}`) === "true");
  },
  "seal_5_places": () =>
    Object.keys(localStorage).filter((k) => k.startsWith("vp-sealed-")).length >= 5,
  "reach_corruption_3": () =>
    parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10) >= 3,
};

function getConditionCheck(id: string): (() => boolean) | undefined {
  return CHECKS[id];
}

/** All archive readings — patterns the terminal has noticed */
const ALL_READINGS: ArchiveReading[] = [
  {
    id: "READ_01",
    title: "The Frequency",
    description:
      "BUNKER_7 has detected anomalous shortwave transmissions originating from four documented ruins. The first step is learning to listen.",
    category: "signal",
    conditions: [
      { id: "visit_echoes", text: "The BUNKER_7 terminal was accessed", observed: false },
      { id: "decode_any_signal", text: "A transmission was decoded from the Numbers Station", observed: false },
    ],
  },
  {
    id: "READ_02",
    title: "Field Test",
    description:
      "Reading about ruins is not enough. BUNKER_7 requires field documentation. The dust will teach you what the archives cannot.",
    category: "expedition",
    conditions: [
      { id: "reach_dust_15", text: "Dust accumulation reached 15%", observed: false },
      { id: "complete_expedition", text: "An expedition was completed", observed: false },
    ],
  },
  {
    id: "READ_03",
    title: "The Counting House",
    description:
      "Hashima Island broadcasts a numbers station that has been counting backward since 1987. The count is not in any known numeral system. BUNKER_7 believes it is counting down to an event.",
    category: "signal",
    conditions: [
      { id: "decode_hashima", text: "The Hashima signal was decoded", observed: false },
      { id: "unlock_hashima_dossier", text: "The Intercepted Dossier was recovered", observed: false },
    ],
  },
  {
    id: "READ_04",
    title: "The Lantern Grid",
    description:
      "The Atlas is not just a map. It is a containment grid. Each lantern placed strengthens the seal. BUNKER_7 needs witnesses to mark the ruins before they are forgotten entirely.",
    category: "community",
    conditions: [
      { id: "visit_5_places", text: "Five different places were opened on the Atlas", observed: false },
      { id: "place_3_lanterns", text: "Three lanterns were placed", observed: false },
    ],
  },
  {
    id: "READ_05",
    title: "The Woodpecker",
    description:
      "Duga's signal — the Russian Woodpecker — was officially an over-the-horizon radar. BUNKER_7 believes it was a countdown interrupted in 1989. The array wants to finish counting.",
    category: "signal",
    conditions: [
      { id: "decode_duga", text: "The Duga signal was decoded", observed: false },
      { id: "seal_duga", text: "The Duga Radar Array record was sealed", observed: false },
    ],
  },
  {
    id: "READ_06",
    title: "The Other",
    description:
      "Something is using the terminal. Something is using your cursor. BUNKER_7 calls it The Other. It does not have a name because names imply it can be called.",
    category: "corruption",
    conditions: [
      { id: "corruption_2", text: "Corruption reached stage 2", observed: false },
      { id: "other_encounter_3", text: "The Other was encountered three times", observed: false },
    ],
  },
  {
    id: "READ_07",
    title: "Static Veil",
    description:
      "Poveglia does not broadcast a signal. It broadcasts a curtain. The static between stations is full of things that have not happened yet, trying to get through.",
    category: "signal",
    conditions: [
      { id: "decode_poveglia", text: "The Poveglia signal was decoded", observed: false },
      { id: "seal_poveglia", text: "The Poveglia Island record was sealed", observed: false },
    ],
  },
  {
    id: "READ_08",
    title: "Lost Expedition",
    description:
      "Expedition Team 4 walked into Aokigahara with six members. The black box recorded seven voices. The seventh speaks a dialect last used in the Edo period. It is giving directions deeper into the forest.",
    category: "expedition",
    conditions: [
      { id: "decode_aokigahara", text: "The Aokigahara signal was decoded", observed: false },
      { id: "seal_aokigahara", text: "The Aokigahara Forest record was sealed", observed: false },
    ],
  },
  {
    id: "READ_09",
    title: "The Sealed Record",
    description:
      "Three places sealed. The atlas is not just a map — it is a lock. Every seal you turn keeps something contained. But the dust remembers. The dust always remembers.",
    category: "lore",
    conditions: [
      { id: "seal_3_places", text: "Three places were sealed", observed: false },
      { id: "reach_dust_50", text: "Dust accumulation reached 50%", observed: false },
    ],
  },
  {
    id: "READ_10",
    title: "The Final Transmission",
    description:
      "All four signals decoded. Five places sealed. Corruption at stage 3. BUNKER_7 is assembling something from the fragments. The Final Transmission is not a message. It is a door.",
    category: "lore",
    conditions: [
      { id: "decode_all_4_signals", text: "All four Numbers Station signals decoded", observed: false },
      { id: "seal_5_places", text: "Five places sealed", observed: false },
      { id: "reach_corruption_3", text: "Corruption reached stage 3", observed: false },
    ],
  },
];