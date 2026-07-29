"use client";

import { useState, useEffect } from "react";

const LAST_VISIT_KEY = "vp-last-visit";
const ABSENCE_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export interface AbsenceState {
  gone: boolean;
  hoursAway: number;
  isFirstVisit: boolean;
}

export function useAbsence(): AbsenceState {
  const [state, setState] = useState<AbsenceState>({
    gone: false,
    hoursAway: 0,
    isFirstVisit: true,
  });

  useEffect(() => {
    const now = Date.now();
    const raw = localStorage.getItem(LAST_VISIT_KEY);
    const last = raw ? parseInt(raw, 10) : 0;

    if (last) {
      const diff = now - last;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      setState({
        gone: diff > ABSENCE_THRESHOLD_MS,
        hoursAway: hours,
        isFirstVisit: false,
      });
    }

    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, []);

  return state;
}