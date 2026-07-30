"use client";

import { useEffect } from "react";

export default function PlaceWhispers() {
  // Voice removed — dust whispers are now text-only
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; category?: string };
      if (!detail?.name) return;
      
      // Instead of speaking, we could flash a subtle text hint
      // But for now: silence. The atmosphere speaks through the UI, not the OS.
    };
    window.addEventListener("place-selected", handler);
    return () => window.removeEventListener("place-selected", handler);
  }, []);

  return null;
}