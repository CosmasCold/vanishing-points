"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnlockedSubPlaces, SubPlace } from "@/lib/subPlaces";

export function useSubPlaces(dust: number, inventory: string[], redeemedCodes: string[]) {
  const [entered, setEntered] = useState<string[]>([]);
  const [current, setCurrent] = useState<SubPlace | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(localStorage.getItem("vp-subplaces-entered") || "[]");
    setEntered(saved);
  }, []);

  const unlocked = getUnlockedSubPlaces(dust, inventory, redeemedCodes);

  const enter = useCallback(
    (subPlace: SubPlace) => {
      setCurrent(subPlace);
      if (typeof window === "undefined") return;
      if (!entered.includes(subPlace.id)) {
        const next = [...entered, subPlace.id];
        setEntered(next);
        localStorage.setItem("vp-subplaces-entered", JSON.stringify(next));
        const dustKey = "vp-dust-accumulation";
        const currentDust = parseInt(localStorage.getItem(dustKey) || "0", 10);
        localStorage.setItem(dustKey, String(currentDust + subPlace.dustReward));
      }
    },
    [entered]
  );

  const exit = useCallback(() => {
    setCurrent(null);
  }, []);

  return { unlocked, entered, current, enter, exit };
}