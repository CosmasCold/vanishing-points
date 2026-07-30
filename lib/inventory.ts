export interface InventoryItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  foundAt: string[]; // place categories where it can appear
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "rusty-key",
    name: "Rusty Key",
    desc: "Opens something. You don't know what yet.",
    icon: "🗝",
    foundAt: ["abandoned", "both"],
  },
  {
    id: "exposed-film",
    name: "Exposed Film",
    desc: "Images burned by radiation or time. Indecipherable.",
    icon: "🎞",
    foundAt: ["haunted", "both"],
  },
  {
    id: "breathing-mask",
    name: "Breathing Mask",
    desc: "Still functional. The filter is black with dust.",
    icon: "🎭",
    foundAt: ["abandoned", "haunted", "both"],
  },
  {
    id: "corrupted-drive",
    name: "Corrupted Drive",
    desc: "512KB of unreadable data. Something screams in the static.",
    icon: "💾",
    foundAt: ["haunted", "both"],
  },
  {
    id: "polaroid",
    name: "Blank Polaroid",
    desc: "Develops slowly. Shows places you've never been.",
    icon: "📷",
    foundAt: ["abandoned", "both"],
  },
  {
    id: "sealed-letter",
    name: "Sealed Letter",
    desc: "Addressed to you. The handwriting is yours.",
    icon: "✉",
    foundAt: ["haunted", "both"],
  },
];

export function findItem(): InventoryItem | null {
  if (typeof window === "undefined") return null;
  if (Math.random() > 0.3) return null; // 30% chance per visit

  const inventory = getInventory();
  const available = INVENTORY_ITEMS.filter((i) => !inventory.includes(i.id));
  if (available.length === 0) return null;

  const item = available[Math.floor(Math.random() * available.length)];
  inventory.push(item.id);
  localStorage.setItem("bunker-inventory", JSON.stringify(inventory));
  return item;
}

export function getInventory(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("bunker-inventory") || "[]");
}

export function hasItem(id: string): boolean {
  return getInventory().includes(id);
}