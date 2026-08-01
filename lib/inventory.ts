export interface InventoryItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  foundAt: string[]; // "abandoned" | "haunted" | "both"
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  /* ─── Generic items ─── */
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
  /* ─── Pripyat Amusement Park ─── */
  {
    id: "photo-the-view",
    name: "Photo: The View",
    desc: "Taken from the top of the Ferris wheel. The city is a grey smear. Something stands in the amusement park that was not there when you climbed.",
    icon: "📸",
    foundAt: ["abandoned"],
  },
  {
    id: "childs-drawing",
    name: "Child's Drawing",
    desc: "Crayon on school paper. A family, a sun, a Ferris wheel. The fourth figure has no face and stands outside the frame.",
    icon: "🖍",
    foundAt: ["abandoned"],
  },
  {
    id: "radiation-badge",
    name: "Radiation Badge",
    desc: "Still clicking. It was pointed at you when you found it. The dosage reads higher than the zone should allow.",
    icon: "☢",
    foundAt: ["abandoned"],
  },
  {
    id: "evidence-photo",
    name: "Evidence Photo",
    desc: "The badge on the seat. Your reflection in the cabin glass is facing the wrong direction.",
    icon: "🖼",
    foundAt: ["abandoned"],
  },
  /* ─── Aokigahara Forest ─── */
  {
    id: "frozen-journal",
    name: "Frozen Journal",
    desc: "The last entry is dated tomorrow. The handwriting is not the owner's.",
    icon: "📓",
    foundAt: ["haunted"],
  },
  {
    id: "white-robe-fragment",
    name: "White Robe Fragment",
    desc: "Silk. Found snagged on a root spiral. It smells of incense and ozone.",
    icon: "🧣",
    foundAt: ["haunted"],
  },
  /* ─── Eastern State Penitentiary ─── */
  {
    id: "audio-log-eastern",
    name: "Audio Log: Eastern State",
    desc: "17 seconds of laughter from Cellblock 12. The waveform shows 4 voices. You were alone.",
    icon: "🎙",
    foundAt: ["haunted"],
  },
  /* ─── Duga Radar Array ─── */
  {
    id: "woodpecker-tape",
    name: "Woodpecker Tape",
    desc: "Reel-to-reel. The tapping does not match any known Soviet telemetry. The rhythm counts down.",
    icon: "📼",
    foundAt: ["abandoned", "both"],
  },
  /* ─── Hashima Island ─── */
  {
    id: "concrete-shard",
    name: "Concrete Shard",
    desc: "From Block 7. Etched into it: a number sequence that has not been invented yet.",
    icon: "🧱",
    foundAt: ["abandoned", "both"],
  },
  /* ─── Poveglia Island ─── */
  {
    id: "plague-mask",
    name: "Plague Doctor Mask",
    desc: "Ceramic. The eyeholes are warm. It was not in the museum inventory.",
    icon: "🎭",
    foundAt: ["haunted", "both"],
  },
  /* ─── Winchester Mystery House ─── */
  {
    id: "staircase-to-nowhere",
    name: "Staircase Blueprint",
    desc: "A door that opens to a wall. A staircase that ends at the ceiling. The architect's notes are in a language that predates the house.",
    icon: "📐",
    foundAt: ["haunted"],
  },
];

export function findItem(): InventoryItem | null {
  if (typeof window === "undefined") return null;
  if (Math.random() > 0.3) return null;

  const inventory = getInventory();
  const available = INVENTORY_ITEMS.filter((i) => !inventory.includes(i.id));
  if (available.length === 0) return null;

  const item = available[Math.floor(Math.random() * available.length)];
  inventory.push(item.id);
  localStorage.setItem("bunker-inventory", JSON.stringify(inventory));
  return item;
}

/** Find an item appropriate for a place's category. Used by procedural expeditions. */
export function findItemForCategory(category: string): InventoryItem | null {
  if (typeof window === "undefined") return null;
  if (Math.random() > 0.4) return null;

  const inventory = getInventory();
  const available = INVENTORY_ITEMS.filter(
    (i) => !inventory.includes(i.id) && i.foundAt.includes(category)
  );
  if (available.length === 0) {
    // Fallback to any available item
    const fallback = INVENTORY_ITEMS.filter((i) => !inventory.includes(i.id));
    if (fallback.length === 0) return null;
    const item = fallback[Math.floor(Math.random() * fallback.length)];
    inventory.push(item.id);
    localStorage.setItem("bunker-inventory", JSON.stringify(inventory));
    return item;
  }

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