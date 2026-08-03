"use client";

export interface Dossier {
  slug: string;
  title: string;
  location: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description?: string;
  image?: string;
}

export const DOSSIERS: Dossier[] = [
  { slug: "pripyat-amusement-park", title: "Pripyat: Ferris Wheel", location: "Ukraine", rarity: "rare" },
  { slug: "eastern-state-penitentiary", title: "Eastern State: Cellblock 12", location: "USA", rarity: "legendary" },
  { slug: "isla-de-las-munecas", title: "Isla de las Muñecas", location: "Mexico", rarity: "legendary" },
  { slug: "bodie-ghost-town", title: "Bodie: Main Street", location: "USA", rarity: "common" },
  { slug: "aokigahara-forest", title: "Aokigahara: The Sea of Trees", location: "Japan", rarity: "legendary" },
  { slug: "duga-radar-array", title: "Duga: The Russian Woodpecker", location: "Ukraine", rarity: "legendary" },
  { slug: "bhangarh-fort", title: "Bhangarh: The Cursed City", location: "India", rarity: "rare" },
  { slug: "north-brother-island", title: "North Brother: Quarantine", location: "USA", rarity: "uncommon" },
  { slug: "hashima-island", title: "Hashima: Battleship Island", location: "Japan", rarity: "legendary" },
  { slug: "kolmanskop", title: "Kolmanskop: The Sand Fill", location: "Namibia", rarity: "common" },
  { slug: "waverly-hills-sanatorium", title: "Waverly Hills: The Body Chute", location: "USA", rarity: "uncommon" },
  { slug: "centralia", title: "Centralia: The Burning Borough", location: "USA", rarity: "rare" },
  { slug: "winchester-mystery-house", title: "Winchester: Room 13", location: "USA", rarity: "uncommon" },
  { slug: "sedlec-ossuary", title: "Sedlec: The Bone Church", location: "Czech Republic", rarity: "rare" },
  { slug: "catacombs-of-paris", title: "Catacombs: Six Million", location: "France", rarity: "legendary" },
];

const STORAGE_KEY = "vp-dossiers-claimed";

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

export function claimDossier(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const claimed = getClaimedSlugs();
  if (claimed.includes(slug)) return false;
  claimed.push(slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claimed));

  const dust = getDust();
  localStorage.setItem("vp-dust-accumulation", String(Math.min(100, dust + 2)));
  window.dispatchEvent(new CustomEvent("vp-dust-change"));
  window.dispatchEvent(new CustomEvent("vp-dossiers-updated"));

  return true;
}

export function getClaimedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function isDossierClaimed(slug: string): boolean {
  return getClaimedSlugs().includes(slug);
}

export function getDossierProgress(): { claimed: number; total: number; percent: number } {
  const claimed = getClaimedSlugs().length;
  const total = DOSSIERS.length;
  return { claimed, total, percent: Math.round((claimed / total) * 100) };
}

export function getClaimedDossierList(): Dossier[] {
  const slugs = getClaimedSlugs();
  return DOSSIERS.filter((d) => slugs.includes(d.slug));
}