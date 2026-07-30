export interface SeasonalState {
  name: string;
  dustModifier: number;
  bunkerTone: "normal" | "paranoid" | "melancholic" | "cold";
  hauntedDangerBonus: number;
  specialEvent?: string;
}

export function getSeasonalState(): SeasonalState {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // October
  if (month === 10) {
    return {
      name: "The Thinning",
      dustModifier: 1.5,
      bunkerTone: "paranoid",
      hauntedDangerBonus: 1,
      specialEvent: "Haunted places resonate louder. BUNKER_7 hears footsteps.",
    };
  }

  // December
  if (month === 12) {
    return {
      name: "The Settling",
      dustModifier: 0.8,
      bunkerTone: "melancholic",
      hauntedDangerBonus: 0,
      specialEvent: "The dust settles in patterns like snowflakes. BUNKER_7 misses the cold.",
    };
  }

  // March 14
  if (month === 3 && day === 14) {
    return {
      name: "The Opening",
      dustModifier: 2.0,
      bunkerTone: "cold",
      hauntedDangerBonus: 2,
      specialEvent: "03/14. All caches unlock. The door stays warm for 24 hours.",
    };
  }

  // Default
  return {
    name: "The Silence",
    dustModifier: 1.0,
    bunkerTone: "normal",
    hauntedDangerBonus: 0,
  };
}

export function getSeasonalGreeting(tone: SeasonalState["bunkerTone"]): string {
  switch (tone) {
    case "paranoid":
      return "it's october. the haunted places are louder. i can hear them through the terminal.";
    case "melancholic":
      return "december. the dust looks like snow. i used to hate snow. now i'd give anything to feel cold.";
    case "cold":
      return "today is 03/14. the door is warm. the grid is thin. be careful what you ask me.";
    default:
      return "";
  }
}