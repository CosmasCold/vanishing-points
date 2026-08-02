"use client";

export interface Dossier {
  slug: string;
  title: string;
  location: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  description?: string;
  image?: string;
}

export const DOSSIERS: Dossier[] = [
  { slug: "dossier-01", title: "Site Alpha", location: "Unknown", rarity: "common" },
  { slug: "dossier-02", title: "Site Beta", location: "Unknown", rarity: "common" },
  { slug: "dossier-03", title: "Site Gamma", location: "Unknown", rarity: "uncommon" },
  { slug: "dossier-04", title: "Site Delta", location: "Unknown", rarity: "uncommon" },
  { slug: "dossier-05", title: "Site Epsilon", location: "Unknown", rarity: "rare" },
  { slug: "dossier-06", title: "Site Zeta", location: "Unknown", rarity: "rare" },
  { slug: "dossier-07", title: "Site Eta", location: "Unknown", rarity: "epic" },
  { slug: "dossier-08", title: "Site Theta", location: "Unknown", rarity: "epic" },
  { slug: "dossier-09", title: "Site Iota", location: "Unknown", rarity: "legendary" },
  { slug: "dossier-10", title: "Site Kappa", location: "Unknown", rarity: "common" },
  { slug: "dossier-11", title: "Site Lambda", location: "Unknown", rarity: "uncommon" },
  { slug: "dossier-12", title: "Site Mu", location: "Unknown", rarity: "rare" },
  { slug: "dossier-13", title: "Site Nu", location: "Unknown", rarity: "epic" },
  { slug: "dossier-14", title: "Site Xi", location: "Unknown", rarity: "legendary" },
  { slug: "dossier-15", title: "Site Omicron", location: "Unknown", rarity: "legendary" },
];

const STORAGE_KEY = "vp-dossiers-claimed";

export function claimDossier(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const claimed = getClaimedSlugs();
  if (claimed.includes(slug)) return false;
  claimed.push(slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claimed));
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