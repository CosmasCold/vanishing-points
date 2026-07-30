"use client";

import { useEffect, useState } from "react";

export type UserProfile = "neutral" | "sensitive" | "archivist" | "witness" | "ghost";

export function usePersonalCorruption(): UserProfile {
  const [profile, setProfile] = useState<UserProfile>("neutral");

  useEffect(() => {
    const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
    const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    const echoes = localStorage.getItem("echoes-visited") === "true";
    const triangulated = localStorage.getItem("bunker-triangulated") === "true";

    const hauntedCount = visits.filter((v: any) => v.isGhost).length; // rough proxy
    const total = visits.length;

    if (dust > 75 && echoes) setProfile("ghost");
    else if (echoes && triangulated) setProfile("witness");
    else if (total > 5 && hauntedCount > total * 0.6) setProfile("sensitive");
    else if (total > 5 && hauntedCount < total * 0.3) setProfile("archivist");
    else setProfile("neutral");
  }, []);

  return profile;
}

export function getProfileGreeting(profile: UserProfile): string {
  switch (profile) {
    case "ghost":
      return "The dust recognizes you. The terminal is warm.";
    case "witness":
      return "You have seen the towers. You have been marked.";
    case "sensitive":
      return "You feel the haunted places. The atlas feels it too.";
    case "archivist":
      return "You document the forgotten. The archivist approves.";
    default:
      return "Initializing cartography...";
  }
}