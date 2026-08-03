"use client";

import { useEffect, useState, useCallback } from "react";

export type UserProfile = "neutral" | "sensitive" | "archivist" | "witness" | "ghost";

const STORAGE_KEYS = {
  log: "vp-expedition-log",
  dust: "vp-dust-accumulation",
  echoes: "vp-echoes-visited",
  triangulated: "vp-bunker-triangulated",
  profile: "vp-user-profile",
};

function countGhostNotes(): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("vp-ghost-note-")) count++;
  }
  return count;
}

function computeProfile(): UserProfile {
  if (typeof window === "undefined") return "neutral";

  const visits: unknown[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.log) || "[]");
  const dust = parseInt(localStorage.getItem(STORAGE_KEYS.dust) || "0", 10);
  const echoes = localStorage.getItem(STORAGE_KEYS.echoes) === "true";
  const triangulated = localStorage.getItem(STORAGE_KEYS.triangulated) === "true";
  const ghostNotes = countGhostNotes();
  const total = visits.length;

  if (dust > 75 && echoes) return "ghost";
  if (echoes && triangulated) return "witness";
  if (total > 5 && ghostNotes > total * 0.4) return "sensitive";
  if (total > 5 && ghostNotes < total * 0.15) return "archivist";
  return "neutral";
}

export function usePersonalCorruption(): {
  profile: UserProfile;
  recalculate: () => void;
} {
  const [profile, setProfile] = useState<UserProfile>("neutral");

  const recalculate = useCallback(() => {
    const next = computeProfile();
    setProfile(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.profile, next);
    }
  }, []);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Listen for dust changes from other components
  useEffect(() => {
    const handle = () => recalculate();
    window.addEventListener("vp-dust-change", handle);
    return () => window.removeEventListener("vp-dust-change", handle);
  }, [recalculate]);

  return { profile, recalculate };
}

export function getProfileGreeting(profile: UserProfile): string {
  switch (profile) {
    case "ghost":
      return "The dust recognizes you. The terminal is warm.";
    case "witness":
      return "The towers saw you first. Now you see them back.";
    case "sensitive":
      return "You feel the haunted places. The atlas feels it too.";
    case "archivist":
      return "You document the forgotten. The archivist approves.";
    default:
      return "Initializing cartography...";
  }
}

// Call this whenever dust changes to trigger reactive profile updates
export function notifyDustChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vp-dust-change"));
  }
}