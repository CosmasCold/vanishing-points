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

  const save = useCallback((next: VisitRecord[]) => {
    setVisited(next);
    localStorage.setItem(KEY, JSON.stringify(next));
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