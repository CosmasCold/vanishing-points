"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "vp-expedition-log";

export interface VisitRecord {
  _id: string;
  name: string;
  slug: string;
  addedAt: string;
  isGhost?: boolean;
  coords?: string;
}

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

function addDust(amount: number) {
  if (typeof window === "undefined") return;
  const next = Math.min(100, getDust() + amount);
  localStorage.setItem("vp-dust-accumulation", next.toString());
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
}

export function useVisitedPlaces() {
  const [visited, setVisited] = useState<VisitRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setVisited(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const visit = useCallback(
    (place: { _id: string; name: string; slug: string }) => {
      setVisited((prev) => {
        if (prev.some((b) => b._id === place._id)) return prev;
        const next = [
          ...prev,
          { _id: place._id, name: place.name, slug: place.slug, addedAt: new Date().toISOString() },
        ];
        localStorage.setItem(KEY, JSON.stringify(next));
        addDust(3);
        return next;
      });
    },
    []
  );

  const visitGhost = useCallback((ghost: { name: string; slug: string; coords: string }) => {
    setVisited((prev) => {
      const next = [
        ...prev,
        {
          _id: `ghost-${Date.now()}`,
          name: ghost.name,
          slug: ghost.slug,
          addedAt: new Date().toISOString(),
          isGhost: true,
          coords: ghost.coords,
        },
      ];
      localStorage.setItem(KEY, JSON.stringify(next));
      addDust(5);
      return next;
    });
  }, []);

  const isVisited = useCallback(
    (id: string) => visited.some((v) => v._id === id),
    [visited]
  );

  const clearLog = useCallback(() => {
    localStorage.removeItem(KEY);
    setVisited([]);
  }, []);

  return { visited, visit, visitGhost, isVisited, clearLog, loaded, count: visited.length };
}