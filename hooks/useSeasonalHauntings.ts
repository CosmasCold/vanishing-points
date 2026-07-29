"use client";

import { useMemo } from "react";

interface HauntingDate {
  month: number;
  day: number;
  slug: string;
  event: string;
}

const HAUNTING_DATES: HauntingDate[] = [
  { month: 3, day: 27, slug: "pripyat-amusement-park", event: "Evacuation" },
  { month: 5, day: 29, slug: "grosse-ile", event: "Mass arrival" },
  { month: 10, day: 13, slug: "armero", event: "Lahar" },
  { month: 5, day: 2, slug: "chaiten", event: "Eruption" },
  { month: 5, day: 10, slug: "oradour-sur-glane", event: "Massacre" },
  { month: 5, day: 10, slug: "villisca-axe-murder-house", event: "Murders" },
  { month: 7, day: 2, slug: "sathorn-unique-tower", event: "Financial collapse" },
  { month: 10, day: 31, slug: "waverly-hills-sanatorium", event: "All Hallows" },
];

export function useSeasonalHauntings() {
  const today = useMemo(() => new Date(), []);
  const active = useMemo(() => {
    return HAUNTING_DATES.filter(
      (h) => h.month === today.getMonth() && h.day === today.getDate()
    );
  }, [today]);

  const isAnniversary = (slug: string) =>
    active.some((h) => h.slug === slug);

  return { active, isAnniversary, today };
}