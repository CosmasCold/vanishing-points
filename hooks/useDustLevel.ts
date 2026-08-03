"use client";

import { useState, useEffect, useCallback } from "react";

const DUST_KEY = "vp-dust-accumulation";
const CORRUPTION_KEY = "vp-corruption-stage";
const ECHOES_KEY = "vp-echoes-visited";
const LAST_TX_KEY = "vp-last-transmission";

interface DustState {
  level: number;
  echoesVisited: boolean;
  isCorrupted: boolean;
  isSevere: boolean;
  corruptionStage: number;
}

function readDust(): number {
  if (typeof window === "undefined") return 0;
  return Math.min(100, parseInt(localStorage.getItem(DUST_KEY) || "0", 10));
}

function readCorruption(): number {
  if (typeof window === "undefined") return 0;
  return Math.min(10, parseInt(localStorage.getItem(CORRUPTION_KEY) || "0", 10));
}

function readEchoes(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ECHOES_KEY) === "true";
}

export function useDustLevel(): DustState {
  const [level, setLevel] = useState(0);
  const [echoesVisited, setEchoesVisited] = useState(false);
  const [corruptionStage, setCorruptionStage] = useState(0);

  const refresh = useCallback(() => {
    setLevel(readDust());
    setEchoesVisited(readEchoes());
    setCorruptionStage(readCorruption());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("vp-dust-change", handler);
    window.addEventListener("vp-corruption-change", handler);
    return () => {
      window.removeEventListener("vp-dust-change", handler);
      window.removeEventListener("vp-corruption-change", handler);
    };
  }, [refresh]);

  return {
    level,
    echoesVisited,
    isCorrupted: corruptionStage > 2,
    isSevere: corruptionStage > 6,
    corruptionStage,
  };
}

export function markEchoesVisited() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ECHOES_KEY, "true");
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

export function accumulateDust(amount: number = 2) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  localStorage.setItem(DUST_KEY, Math.min(100, current + amount).toString());
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

export function spendDust(amount: number): boolean {
  if (typeof window === "undefined") return false;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  if (current < amount) return false;
  localStorage.setItem(DUST_KEY, String(Math.max(0, current - amount)));
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
  return true;
}

export function bumpCorruption(amount: number = 1) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(CORRUPTION_KEY) || "0", 10);
  localStorage.setItem(CORRUPTION_KEY, String(Math.min(10, current + amount)));
  window.dispatchEvent(new CustomEvent("vp-corruption-change"));
}

export function markTransmission() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_TX_KEY, Date.now().toString());
}

export function decayDust(amount: number = 5) {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem(DUST_KEY) || "0", 10);
  localStorage.setItem(DUST_KEY, String(Math.max(0, current - amount)));
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

export function purgeDust(): { dustReset: boolean; corruptionReset: boolean } {
  if (typeof window === "undefined") return { dustReset: false, corruptionReset: false };
  localStorage.setItem(DUST_KEY, "0");
  localStorage.setItem(CORRUPTION_KEY, "0");
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
  window.dispatchEvent(new CustomEvent("vp-corruption-change"));
  return { dustReset: true, corruptionReset: true };
}