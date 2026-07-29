"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "vp-bookmarks";

export interface Bookmark {
  _id: string;
  name: string;
  slug: string;
  addedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((next: Bookmark[]) => {
    setBookmarks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (place: { _id: string; name: string; slug: string }) => {
      setBookmarks((prev) => {
        const exists = prev.find((b) => b._id === place._id);
        let next: Bookmark[];
        if (exists) {
          next = prev.filter((b) => b._id !== place._id);
        } else {
          next = [
            ...prev,
            { _id: place._id, name: place.name, slug: place.slug, addedAt: new Date().toISOString() },
          ];
        }
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b._id === id),
    [bookmarks]
  );

  return { bookmarks, toggle, isBookmarked, loaded, count: bookmarks.length };
}