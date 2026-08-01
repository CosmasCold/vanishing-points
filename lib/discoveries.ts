export interface PlayerDiscovery {
  id: string;
  name: string;
  location: string;
  description: string;
  coordinates?: string;
  date: string;
  dustReward: number;
}

export function addDiscovery(d: {
  name: string;
  location: string;
  description: string;
  coordinates?: string;
}): PlayerDiscovery {
  if (typeof window === "undefined") {
    return { ...d, id: "discovery-0", date: new Date().toISOString(), dustReward: 15 };
  }
  
  const discoveries = getDiscoveries();
  const newDiscovery: PlayerDiscovery = {
    ...d,
    id: `discovery-${Date.now()}`,
    date: new Date().toISOString(),
    dustReward: 15,
  };
  discoveries.push(newDiscovery);
  localStorage.setItem("vp-discoveries", JSON.stringify(discoveries));

  const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  localStorage.setItem("vp-dust-accumulation", String(dust + newDiscovery.dustReward));

  return newDiscovery;
}

export function getDiscoveries(): PlayerDiscovery[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("vp-discoveries") || "[]");
}