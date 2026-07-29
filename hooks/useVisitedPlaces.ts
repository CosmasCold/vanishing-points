"use client";

import { useState, useEffect, useCallback } from "react";

export interface VisitRecord {
  _id: string;
  name: string;
  slug: string;
  visitedAt: string;
}

const KEY = "vp-expedition-log";

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

  const visit = useCallback((place: { _id: string; name: string; slug: string }) => {
    setVisited((prev) => {
      if (prev.some((v) => v._id === place._id)) return prev;
      const next = [
        ...prev,
        { _id: place._id, name: place.name, slug: place.slug, visitedAt: new Date().toISOString() },
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

  return { visited, visit, isVisited, clearLog, loaded, count: visited.length };
}