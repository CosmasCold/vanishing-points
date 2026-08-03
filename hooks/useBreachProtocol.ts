"use client";

import { useState, useEffect } from "react";

const BREACH_TIME_KEY = "vp-breach-time";

export function useBreachProtocol() {
  const [state, setState] = useState<{ active: boolean; countdown: string | null }>({
    active: false,
    countdown: null,
  });

  useEffect(() => {
    const check = () => {
      const breachTime = localStorage.getItem(BREACH_TIME_KEY);
      if (breachTime) {
        const diff = parseInt(breachTime, 10) - Date.now();
        if (diff <= 0) {
          setState({ active: true, countdown: null });
        } else {
          const mins = Math.floor(diff / 60000);
          setState({ active: false, countdown: `${mins}m` });
        }
      } else {
        setState({ active: false, countdown: null });
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return state;
}