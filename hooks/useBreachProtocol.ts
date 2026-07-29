"use client";

import { useState, useEffect } from "react";

// Set your breach date here: YYYY-MM-DD
const BREACH_DATE = "2026-08-15";
const BREACH_DURATION_HOURS = 24;

export interface BreachState {
  active: boolean;
  isWitness: boolean;
  countdown: string;
}

export function useBreachProtocol(): BreachState {
  const [state, setState] = useState<BreachState>({
    active: false,
    isWitness: false,
    countdown: "",
  });

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const breachStart = new Date(`${BREACH_DATE}T00:00:00`);
      const breachEnd = new Date(breachStart.getTime() + BREACH_DURATION_HOURS * 60 * 60 * 1000);

      const active = now >= breachStart && now < breachEnd;
      const witnessed = localStorage.getItem("breach-witness") === "true";

      let countdown = "";
      if (now < breachStart) {
        const diff = breachStart.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        countdown = `${days}d ${hours}h`;
      }

      setState({ active, isWitness: witnessed, countdown });

      if (active && !witnessed) {
        localStorage.setItem("breach-witness", "true");
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return state;
}