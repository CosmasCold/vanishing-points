"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";
import { IMPOSSIBLE_COORDS } from "@/lib/echoesContent";
import { showToast } from "@/lib/toast";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Props {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  loading: boolean;
  center?: [number, number];
  anniversarySlugs: string[];
  onGhostCapture?: (ghost: { name: string; slug: string; coords: string }) => void;
  onTowerFound?: () => void;
}

export default function MapContainer({
  places,
  onSelectPlace,
  loading,
  center,
  anniversarySlugs,
  onGhostCapture,
  onTowerFound,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; place: Place }[]>([]);
  const ghostMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const towerMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const lanternMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [hovered, setHovered] = useState<{
    place: Place;
    left: number;
    top: number;
  } | null>(null);
  const [towersFound, setTowersFound] = useState<Set<number>>(new Set());
  const [lanternKey, setLanternKey] = useState(0);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [10, 25],
      zoom: 1.4,
      projection: { name: "mercator" },
      attributionControl: false,
    });

    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      const canvas = mapContainer.current?.querySelector(".mapboxgl-canvas");
      if (canvas) {
        (canvas as HTMLElement).style.filter =
          "sepia(0.5) contrast(1.05) brightness(0.85) saturate(0.8)";
      }

      map.current!.on("zoom", () => {
        const zoom = map.current!.getZoom();
        const intensity = Math.max(0, Math.min(1, (zoom - 10) / 6));
        mapContainer.current?.style.setProperty("--degrade", intensity.toString());
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fly to center
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({
        center,
        zoom: 13,
        duration: 2500,
        essential: true,
      });
    }
  }, [center]);

  // Tooltip follows marker on pan
  useEffect(() => {
    if (!map.current || !hovered) return;
    const updatePos = () => {
      const pos = map.current!.project(hovered.place.coordinates);
      setHovered((h) => (h ? { ...h, left: pos.x, top: pos.y - 12 } : null));
    };
    map.current.on("move", updatePos);
    return () => {
      map.current?.off("move", updatePos);
    };
  }, [hovered]);

  // Render real markers
  useEffect(() => {
    if (!map.current || loading) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const isAnniversary = anniversarySlugs.includes(place.slug);
      const size = isAnniversary ? 16 : 12;

      const el = document.createElement("div");
      el.className = "relative cursor-pointer";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      const dot = document.createElement("div");
      dot.className = `w-full h-full rounded-full border-2 border-[#1a1612] transition-transform duration-200 hover:scale-125 ${
        place.category === "haunted"
          ? "bg-[#7a3a2a]"
          : place.category === "both"
          ? "bg-[#a67c52]"
          : "bg-[#9a8a72]"
      } ${isAnniversary ? "shadow-[0_0_10px_rgba(166,124,82,0.8)]" : ""}`;
      el.appendChild(dot);

      if (isAnniversary) {
        const ping = document.createElement("div");
        ping.className =
          "absolute inset-0 rounded-full bg-[#9a8a72] opacity-30 animate-ping";
        el.appendChild(ping);
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => {
        if (!map.current) return;
        const pos = map.current.project(place.coordinates);
        setHovered({
          place,
          left: pos.x,
          top: pos.y - 12,
        });
      });

      el.addEventListener("mouseleave", () => {
        setHovered(null);
      });

      el.addEventListener("click", () => {
        // DISPATCH DETAIL FOR LANTERNS
        window.dispatchEvent(new CustomEvent("place-selected", { 
          detail: { slug: place.slug, name: place.name, coords: place.coordinates } 
        }));
        window.dispatchEvent(new CustomEvent("place-selected"));
        onSelectPlace(place);
      });

      markersRef.current.push({ marker, place });
    });
  }, [places, loading, anniversarySlugs, onSelectPlace]);

  // Wandering Marker
  useEffect(() => {
    if (!map.current || places.length === 0) return;

    const spawnGhost = () => {
      if (ghostMarkerRef.current) {
        ghostMarkerRef.current.remove();
        ghostMarkerRef.current = null;
      }

      const basePlace = places[Math.floor(Math.random() * places.length)];
      const offsetLng = (Math.random() - 0.5) * 0.8;
      const offsetLat = (Math.random() - 0.5) * 0.8;
      const startCoords: [number, number] = [
        basePlace.coordinates[0] + offsetLng,
        basePlace.coordinates[1] + offsetLat,
      ];

      const el = document.createElement("div");
      el.className = "relative cursor-pointer animate-pulse";
      el.style.width = "10px";
      el.style.height = "10px";

      const dot = document.createElement("div");
      dot.className = "w-full h-full rounded-full bg-[#33ff00] shadow-[0_0_8px_rgba(51,255,0,0.6)] opacity-70";
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(startCoords)
        .addTo(map.current!);

      ghostMarkerRef.current = marker;

      let step = 0;
      const driftInterval = setInterval(() => {
        step++;
        const current = marker.getLngLat();
        const nearest = places.reduce<{ p: Place; d: number }>((best, p) => {
          const d = Math.hypot(p.coordinates[0] - current.lng, p.coordinates[1] - current.lat);
          return d < best.d ? { p, d } : best;
        }, { p: places[0], d: Infinity });

        const newLng = current.lng + (nearest.p.coordinates[0] - current.lng) * 0.02;
        const newLat = current.lat + (nearest.p.coordinates[1] - current.lat) * 0.02;
        marker.setLngLat([newLng, newLat]);

        if (step > 150) {
          clearInterval(driftInterval);
          marker.remove();
          ghostMarkerRef.current = null;
        }
      }, 200);

      el.addEventListener("click", () => {
        clearInterval(driftInterval);
        marker.remove();
        ghostMarkerRef.current = null;

        const coords = IMPOSSIBLE_COORDS[Math.floor(Math.random() * IMPOSSIBLE_COORDS.length)];
        onGhostCapture?.({
          name: "Unidentified Signal",
          slug: `anomaly-${Date.now()}`,
          coords,
        });

        showToast("Anomaly logged in expedition record", "warning");
      });

      setTimeout(() => {
        if (ghostMarkerRef.current === marker) {
          clearInterval(driftInterval);
          marker.remove();
          ghostMarkerRef.current = null;
        }
      }, 90000);
    };

    const initialDelay = 240000 + Math.random() * 180000;
    const timer = setTimeout(spawnGhost, initialDelay);
    const recurring = setInterval(() => {
      if (!ghostMarkerRef.current) spawnGhost();
    }, 300000 + Math.random() * 300000);

    return () => {
      clearTimeout(timer);
      clearInterval(recurring);
      if (ghostMarkerRef.current) {
        ghostMarkerRef.current.remove();
      }
    };
  }, [places, onGhostCapture]);

  // Signal Triangulation Towers
  useEffect(() => {
    if (!map.current || places.length === 0) return;
    if (towerMarkersRef.current.length > 0) return;

    const towerPositions: [number, number][] = [
      [-74.006, 40.7128],
      [139.6917, 35.6895],
      [-0.1276, 51.5074],
    ];

    towerPositions.forEach((coords, idx) => {
      const el = document.createElement("div");
      el.className = "absolute cursor-pointer opacity-0 hover:opacity-60 transition-opacity duration-500";
      el.style.width = "20px";
      el.style.height = "20px";

      const pulse = document.createElement("div");
      pulse.className = "w-full h-full rounded-full border border-[#33ff00]/40 animate-ping";
      el.appendChild(pulse);

      const dot = document.createElement("div");
      dot.className = "absolute inset-1 rounded-full bg-[#33ff00]/30";
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setTowersFound((prev) => {
          const next = new Set(prev);
          next.add(idx);
          if (next.size === 3) {
            localStorage.setItem("bunker-triangulated", "true");
            onTowerFound?.();
            showToast("Triangulation complete. Signal origin located.", "warning");
          } else {
            showToast(`Tower ${next.size}/3 acquired.`, "info");
          }
          return next;
        });
        el.style.opacity = "0.6";
      });

      towerMarkersRef.current.push(marker);
    });

    return () => {
      towerMarkersRef.current.forEach((m) => m.remove());
      towerMarkersRef.current = [];
    };
  }, [places, onTowerFound]);

  // RENDER LANTERNS
  useEffect(() => {
    if (!map.current) return;
    
    // Clear existing lantern markers
    lanternMarkersRef.current.forEach((m) => m.remove());
    lanternMarkersRef.current = [];

    const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");

    lanterns.forEach((lantern: { coords: [number, number]; flicker: boolean; placeName: string }) => {
      const el = document.createElement("div");
      el.className = "relative cursor-pointer";
      el.style.width = "16px";
      el.style.height = "16px";

      const flame = document.createElement("div");
      flame.className = `w-full h-full rounded-full ${lantern.flicker ? "animate-pulse" : ""}`;
      flame.style.backgroundColor = "#a67c52";
      flame.style.boxShadow = lantern.flicker 
        ? "0 0 12px rgba(166,124,82,0.8), 0 0 4px rgba(255,100,50,0.6)" 
        : "0 0 8px rgba(166,124,82,0.5)";
      el.appendChild(flame);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(lantern.coords)
        .addTo(map.current!);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        showToast(`${lantern.placeName}: A lantern burns here.`, "info");
      });

      lanternMarkersRef.current.push(marker);
    });

    // Listen for new lanterns placed in other tabs
    const handler = () => {
      setLanternKey((k) => k + 1); // triggers re-render
    };
    window.addEventListener("lantern-placed", handler);

    return () => {
      lanternMarkersRef.current.forEach((m) => m.remove());
      window.removeEventListener("lantern-placed", handler);
    };
  }, [places, lanternKey]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {hovered && (
        <div
          className="absolute z-30 pointer-events-none bg-[#0f0c09]/90 backdrop-blur-sm border border-[rgba(122,107,82,0.3)] rounded px-3 py-2 shadow-xl"
          style={{ left: hovered.left, top: hovered.top, transform: "translate(-50%, -100%)" }}
        >
          <p className="font-cinzel text-xs text-[#ddd0bc] whitespace-nowrap">
            {hovered.place.name}
          </p>
          <p className="text-[9px] font-mono text-[#9a8a72] uppercase tracking-wider mt-0.5">
            {hovered.place.category}
          </p>
        </div>
      )}
    </div>
  );
}