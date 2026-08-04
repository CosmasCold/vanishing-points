// lib/witness-state.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { WitnessState } from "./unlock-engine";

const STORAGE_KEY = "vp-witness-state-v2";

const DEFAULT_STATE: WitnessState = {
  dust: 0,
  encounters: 0,
  inventory: [],
  visitedSlugs: [],
  unlockedCodes: [],
  readingsComplete: false,
  now: new Date(),
};

export function useWitnessState() {
  const [state, setState] = useState<WitnessState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((s) => ({ ...s, ...parsed, now: new Date() }));
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    const { now, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state, hydrated]);

  // Update time every minute (for time-based unlocks)
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => ({ ...s, now: new Date() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addDust = useCallback((amount: number) => {
    setState((s) => ({ ...s, dust: Math.min(100, s.dust + amount) }));
  }, []);

  const addEncounter = useCallback(() => {
    setState((s) => ({ ...s, encounters: s.encounters + 1 }));
  }, []);

  const visitPlace = useCallback((slug: string) => {
    setState((s) => {
      if (s.visitedSlugs.includes(slug)) return s;
      return {
        ...s,
        visitedSlugs: [...s.visitedSlugs, slug],
        dust: Math.min(100, s.dust + 5), // +5 dust per new place
      };
    });
  }, []);

  const unlockCode = useCallback((code: string) => {
    const normalized = code.toLowerCase().trim();
    setState((s) => {
      if (s.unlockedCodes.includes(normalized)) return s;
      return { ...s, unlockedCodes: [...s.unlockedCodes, normalized] };
    });
  }, []);

  const addInventory = useCallback((item: string) => {
    const normalized = item.toLowerCase().trim();
    setState((s) => {
      if (s.inventory.includes(normalized)) return s;
      return { ...s, inventory: [...s.inventory, normalized] };
    });
  }, []);

  const setReadingsComplete = useCallback((complete: boolean) => {
    setState((s) => ({ ...s, readingsComplete: complete }));
  }, []);

  return {
    state,
    hydrated,
    addDust,
    addEncounter,
    visitPlace,
    unlockCode,
    addInventory,
    setReadingsComplete,
  };
}