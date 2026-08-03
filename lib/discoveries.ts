export interface ArchiveDiscovery {
  id: string;
  name: string;
  location: string;
  description: string;
  coordinates?: string;
  date: string;
  dustGain: number;
}

export function addDiscovery(d: {
  name: string;
  location: string;
  description: string;
  coordinates?: string;
}): ArchiveDiscovery {
  if (typeof window === "undefined") {
    return { ...d, id: "discovery-0", date: new Date().toISOString(), dustGain: 15 };
  }

  const discoveries = getDiscoveries();
  const newDiscovery: ArchiveDiscovery = {
    ...d,
    id: `discovery-${Date.now()}`,
    date: new Date().toISOString(),
    dustGain: 15,
  };
  discoveries.push(newDiscovery);
  localStorage.setItem("vp-discoveries", JSON.stringify(discoveries));

  const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const nextDust = Math.min(100, dust + newDiscovery.dustGain);
  localStorage.setItem("vp-dust-accumulation", String(nextDust));
  window.dispatchEvent(new CustomEvent("vp-dust-change"));

  return newDiscovery;
}

export function getDiscoveries(): ArchiveDiscovery[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("vp-discoveries") || "[]");
}