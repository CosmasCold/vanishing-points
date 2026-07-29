"use client";

import { useState, useEffect } from "react";

type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export function useTimeOfDay(): TimeOfDay {
  const [tod, setTod] = useState<TimeOfDay>("day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) setTod("dawn");
    else if (hour >= 8 && hour < 17) setTod("day");
    else if (hour >= 17 && hour < 21) setTod("dusk");
    else setTod("night");
  }, []);

  return tod;
}