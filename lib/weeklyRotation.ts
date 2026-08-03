export interface WeeklyAnomaly {
  week: number;
  year: number;
  featuredPlace: string;
  anomalyName: string;
  anomalyDescription: string;
  weeklyCode: string;
  dustMultiplier: number;
}

export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  const week = Math.floor(diff / oneWeek) + 1;
  return { week, year: now.getFullYear() };
}

export function getWeeklyRotation(): WeeklyAnomaly {
  const { week, year } = getCurrentWeek();
  const seed = week + year * 52;

  const places = ["duga-radar-array", "hashima-island", "aokigahara-forest", "poveglia-island", "chernobyl", "centralia"];
  const anomalies = [
    { name: "The Resonance", desc: "Signals carry double weight. The static is louder.", multiplier: 2 },
    { name: "The Quiet", desc: "Ghost lines appear every 15 seconds. The Other wants to talk.", multiplier: 1 },
    { name: "The Bleed", desc: "Corruption spreads faster. Dust accumulates at 1.5x.", multiplier: 1.5 },
    { name: "The Recall", desc: "Sub-places unlock with 50% less dust required. The grid remembers.", multiplier: 1 },
    { name: "The Lockdown", desc: "The signal is drowning in static. BUNKER_7's responses are incomplete.", multiplier: 1 },
  ];

  const placeIndex = seed % places.length;
  const anomalyIndex = (seed * 7) % anomalies.length;
  const weeklyCodes = ["WEEK-314", "ROTATION-91", "ECHO-7", "STATIC-5000", "VOID-12", "GRID-88"];

  return {
    week,
    year,
    featuredPlace: places[placeIndex],
    anomalyName: anomalies[anomalyIndex].name,
    anomalyDescription: anomalies[anomalyIndex].desc,
    weeklyCode: weeklyCodes[seed % weeklyCodes.length],
    dustMultiplier: anomalies[anomalyIndex].multiplier,
  };
}