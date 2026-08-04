"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";
import { IMPOSSIBLE_COORDS } from "@/lib/echoesContent";
import { showToast } from "@/lib/toast";
import type { Feature, FeatureCollection, LineString } from "geojson";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Props {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  loading: boolean;
  center?: [number, number];
  anniversarySlugs: string[];
  onGhostCapture?: (ghost: { name: string; slug: string; coords: string }) => void;
  onTowerFound?: (tower: { id: string; name: string; coords: [number, number] }) => void;
  // ─── ATLAS WHISPER & INVESTIGATION WEB ───
  onHoverPlace?: (place: Place | null) => void;
  selectedSlug?: string | null;
  connectedSlugs?: string[];
  // ─── NEW: Hidden places (sealed/whispered/mirage) to render as ghost outlines ───
  hiddenPlaces?: Place[];
  // ─── NEW: Dust agitation level (0-100) ───
  agitationLevel?: number;
}

export default function MapContainer({
  places,
  onSelectPlace,
  loading,
  center,
  anniversarySlugs,
  onGhostCapture,
  onTowerFound,
  onHoverPlace,
  selectedSlug,
  connectedSlugs = [],
  hiddenPlaces = [],
  agitationLevel = 0,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; place: Place }[]>([]);
  const ghostMarkersRef = useRef<{ marker: mapboxgl.Marker; place: Place }[]>([]);
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

  // Determine agitation intensity
  const agitationIntensity = Math.min(1, Math.max(0, (agitationLevel - 25) / 75));
  const isAgitated = agitationLevel > 25;

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
          "sepia(0.6) contrast(1.08) brightness(0.8) saturate(0.7) hue-rotate(-10deg)";
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
      setHovered((h) => (h ? { ...h, left: pos.x, top: pos.y - 14 } : null));
    };
    map.current.on("move", updatePos);
    return () => {
      map.current?.off("move", updatePos);
    };
  }, [hovered]);

  // ─── INVESTIGATION WEB (animated lines) ───
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;
    const sourceId = "investigation-web-source";
    const layerId = "investigation-web-layer";

    if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
    if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);

    if (!selectedSlug || connectedSlugs.length === 0) return;

    const selectedPlace = places.find((p) => p.slug === selectedSlug);
    if (!selectedPlace) return;

    const connectedPlaces = places.filter((p) => connectedSlugs.includes(p.slug));
    if (connectedPlaces.length === 0) return;

    const features: Feature<LineString>[] = connectedPlaces.map(
  (p) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [selectedPlace.coordinates, p.coordinates],
    },
    properties: {},
  })
);

const geojson: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features,
};

    mapInstance.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    mapInstance.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#c4785a",
        "line-width": 1.8,
        "line-opacity": 0.4,
        "line-blur": 3,
        "line-dasharray": [3, 5],
      },
    });

    return () => {
      if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
      if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
    };
  }, [places, selectedSlug, connectedSlugs]);

  // ─── RENDER VISIBLE PINS ───
  useEffect(() => {
    if (!map.current || loading) return;

    // Remove existing visible markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const isAnniversary = anniversarySlugs.includes(place.slug);
      const size = isAnniversary ? 16 : 12;

      const el = document.createElement("div");
      el.className = `relative cursor-pointer ${isAgitated ? "vp-pin-agitated" : ""}`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.zIndex = "1";
      if (isAgitated) {
        // Subtle random agitation via CSS custom property
        const intensity = agitationIntensity;
        const duration = 0.15 - intensity * 0.1;
        const displacement = intensity * 0.8;
        el.style.setProperty("--agitate-duration", `${duration}s`);
        el.style.setProperty("--agitate-displacement", `${displacement}px`);
      }

      const isHaunted = place.category === "haunted" || place.category === "both";
      const isAbandoned = place.category === "abandoned" || place.category === "both";

      let bg = "#5a4e42";
      let glow = "rgba(90,78,66,0.3)";
      if (isHaunted && isAbandoned) {
        bg = "linear-gradient(135deg, #7a3a2a, #5a4e42)";
        glow = "rgba(196,120,90,0.35)";
      } else if (isHaunted) {
        bg = "#ddd0bc";
        glow = "rgba(221,208,188,0.3)";
      } else if (isAbandoned) {
        bg = "#5a4e42";
        glow = "rgba(90,78,66,0.3)";
      }

      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 100%; height: 100%;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${bg};
        border: 1.5px solid #0c0a08;
        box-shadow: 0 0 10px ${glow}, inset 0 1px 2px rgba(255,255,255,0.06);
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      el.appendChild(dot);

      if (isAnniversary) {
        const ping = document.createElement("div");
        ping.style.cssText = `
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(166,124,82,0.4);
          animation: map-ping 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          pointer-events: none;
        `;
        el.appendChild(ping);
      }

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -size / 2] })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => {
        if (!map.current) return;
        el.style.zIndex = "50";
        const pos = map.current.project(place.coordinates);
        setHovered({
          place,
          left: pos.x,
          top: pos.y - 14,
        });
        onHoverPlace?.(place);
        (dot as HTMLElement).style.transform = "rotate(-45deg) scale(1.35)";
        (dot as HTMLElement).style.boxShadow = `0 0 20px ${glow}, inset 0 1px 2px rgba(255,255,255,0.1)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.zIndex = "1";
        setHovered(null);
        onHoverPlace?.(null);
        (dot as HTMLElement).style.transform = "rotate(-45deg) scale(1)";
        (dot as HTMLElement).style.boxShadow = `0 0 10px ${glow}, inset 0 1px 2px rgba(255,255,255,0.06)`;
      });

      el.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("place-selected", {
            detail: { slug: place.slug, name: place.name, coords: place.coordinates },
          })
        );
        onSelectPlace(place);
      });

      markersRef.current.push({ marker, place });
    });

    // Cleanup old agitation styles
    const styleEl = document.getElementById("vp-agitation-style");
    if (!styleEl) {
      const style = document.createElement("style");
      style.id = "vp-agitation-style";
      style.textContent = `
        .vp-pin-agitated {
          animation: vp-agitate var(--agitate-duration, 0.15s) ease-in-out infinite alternate;
        }
        @keyframes vp-agitate {
          0% { transform: translate(0, 0); }
          100% { transform: translate(var(--agitate-displacement, 0.5px), calc(-1 * var(--agitate-displacement, 0.5px))); }
        }
      `;
      document.head.appendChild(style);
    }
  }, [places, loading, anniversarySlugs, onSelectPlace, onHoverPlace, isAgitated, agitationIntensity]);

  // ─── RENDER GHOST OUTLINES (Sealed / Whispered / Mirage) ───
  useEffect(() => {
    if (!map.current || loading) return;

    // Remove existing ghost markers
    ghostMarkersRef.current.forEach(({ marker }) => marker.remove());
    ghostMarkersRef.current = [];

    hiddenPlaces.forEach((place) => {
      const size = 16;
      const el = document.createElement("div");
      el.className = "relative cursor-pointer vp-ghost-pin";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.zIndex = "0";
      el.style.opacity = "0.6";
      el.style.pointerEvents = "auto";

      // Ghost ring with pulsating glow
      const ring = document.createElement("div");
      ring.style.cssText = `
        width: 100%; height: 100%;
        border-radius: 50%;
        border: 1.5px solid rgba(196,120,90,0.4);
        box-shadow: 0 0 12px rgba(196,120,90,0.2), inset 0 0 12px rgba(196,120,90,0.05);
        animation: ghost-pulse 2.5s ease-in-out infinite;
        transition: all 0.3s ease;
      `;
      el.appendChild(ring);

      // Small dot in center
      const dot = document.createElement("div");
      dot.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 4px; height: 4px;
        border-radius: 50%;
        background: rgba(196,120,90,0.3);
        transition: all 0.3s ease;
      `;
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -size / 2] })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => {
        if (!map.current) return;
        el.style.zIndex = "50";
        el.style.opacity = "1";
        const pos = map.current.project(place.coordinates);
        setHovered({
          place,
          left: pos.x,
          top: pos.y - 14,
        });
        onHoverPlace?.(place);
        ring.style.borderColor = "rgba(196,120,90,0.8)";
        ring.style.boxShadow = "0 0 24px rgba(196,120,90,0.4), inset 0 0 24px rgba(196,120,90,0.1)";
        dot.style.background = "rgba(196,120,90,0.8)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.zIndex = "0";
        el.style.opacity = "0.6";
        setHovered(null);
        onHoverPlace?.(null);
        ring.style.borderColor = "rgba(196,120,90,0.4)";
        ring.style.boxShadow = "0 0 12px rgba(196,120,90,0.2), inset 0 0 12px rgba(196,120,90,0.05)";
        dot.style.background = "rgba(196,120,90,0.3)";
      });

      el.addEventListener("click", () => {
        // Ghost pins can't be opened; show a hint
        showToast(`"${place.name}" — signal interference. Requires dust to resolve.`, "warning");
      });

      ghostMarkersRef.current.push({ marker, place });
    });

    // Add ghost pulse keyframes if not present
    const ghostStyle = document.getElementById("vp-ghost-style");
    if (!ghostStyle) {
      const style = document.createElement("style");
      style.id = "vp-ghost-style";
      style.textContent = `
        @keyframes ghost-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.15; }
        }
        .vp-ghost-pin {
          pointer-events: auto;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .vp-ghost-pin:hover {
          transform: scale(1.1);
        }
      `;
      document.head.appendChild(style);
    }
  }, [hiddenPlaces, loading, onHoverPlace]);

  // ─── WANDERING MARKER (The Other) ─── (unchanged)
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
      el.className = "relative cursor-pointer";
      el.style.width = "10px";
      el.style.height = "10px";
      el.style.zIndex = "40";

      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 100%; height: 100%;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: #c4785a;
        border: 1.5px solid #0c0a08;
        box-shadow: 0 0 10px rgba(196,120,90,0.4), inset 0 1px 1px rgba(255,255,255,0.1);
        opacity: 0.7;
        animation: ghost-flicker 4s ease-in-out infinite;
      `;
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -5] })
        .setLngLat(startCoords)
        .addTo(map.current!);

      ghostMarkerRef.current = marker;

      let step = 0;
      const driftInterval = setInterval(() => {
        step++;
        const current = marker.getLngLat();
        const nearest = places.reduce<{ p: Place; d: number }>(
          (best, p) => {
            const d = Math.hypot(p.coordinates[0] - current.lng, p.coordinates[1] - current.lat);
            return d < best.d ? { p, d } : best;
          },
          { p: places[0], d: Infinity }
        );

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

  // ─── TOWERS ─── (unchanged)
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
      pulse.style.cssText = `
        width: 100%; height: 100%;
        border-radius: 50%;
        border: 1px solid rgba(196,120,90,0.35);
        animation: map-ping 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      `;
      el.appendChild(pulse);

      const dot = document.createElement("div");
      dot.style.cssText = `
        position: absolute;
        inset: 5px;
        border-radius: 50%;
        background: rgba(196,120,90,0.25);
        box-shadow: 0 0 8px rgba(196,120,90,0.2);
      `;
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setTowersFound((prev) => {
          const next = new Set(prev);
          const wasNew = !next.has(idx);
          next.add(idx);

          if (wasNew) {
            const tower = { id: `tower-${idx}`, name: `Anomalous Tower ${idx + 1}`, coords };
            const existing = JSON.parse(localStorage.getItem("vp-towers-found") || "[]");
            if (!existing.some((t: any) => t.id === tower.id)) {
              localStorage.setItem(
                "vp-towers-found",
                JSON.stringify([...existing, { ...tower, discoveredAt: new Date().toISOString() }])
              );
              window.dispatchEvent(new CustomEvent("vp-tower-found"));
            }
            onTowerFound?.(tower);
          }

          if (next.size === 3) {
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

  // ─── LANTERNS ─── (unchanged)
  useEffect(() => {
    if (!map.current) return;

    lanternMarkersRef.current.forEach((m) => m.remove());
    lanternMarkersRef.current = [];

    const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");

    lanterns.forEach(
      (lantern: { coords: [number, number]; flicker: boolean; placeName: string }) => {
        const el = document.createElement("div");
        el.className = "relative cursor-pointer";
        el.style.width = "14px";
        el.style.height = "14px";

        const flame = document.createElement("div");
        flame.style.cssText = `
          width: 100%; height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #a67c52;
          border: 1.5px solid #0c0a08;
          box-shadow: ${
            lantern.flicker
              ? "0 0 14px rgba(166,124,82,0.9), 0 0 4px rgba(255,100,50,0.5)"
              : "0 0 10px rgba(166,124,82,0.6)"
          };
          ${lantern.flicker ? "animation: ghost-flicker 3s ease-in-out infinite;" : ""}
        `;
        el.appendChild(flame);

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -7] })
          .setLngLat(lantern.coords)
          .addTo(map.current!);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          showToast(`${lantern.placeName}: A lantern burns here.`, "info");
        });

        lanternMarkersRef.current.push(marker);
      }
    );

    const handler = () => {
      setLanternKey((k) => k + 1);
    };
    window.addEventListener("lantern-placed", handler);

    return () => {
      lanternMarkersRef.current.forEach((m) => m.remove());
      window.removeEventListener("lantern-placed", handler);
    };
  }, [places, lanternKey]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes map-ping {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ghost-flicker {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.4; }
        }
        @keyframes vp-agitate {
          0% { transform: translate(0, 0); }
          100% { transform: translate(var(--agitate-displacement, 0.5px), calc(-1 * var(--agitate-displacement, 0.5px))); }
        }
        .vp-pin-agitated {
          animation: vp-agitate var(--agitate-duration, 0.15s) ease-in-out infinite alternate;
        }
        .vp-ghost-pin {
          pointer-events: auto;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .vp-ghost-pin:hover {
          transform: scale(1.1);
        }
        @keyframes ghost-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.15; }
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-full" />

      {hovered && (
        <div
          className="absolute z-30 pointer-events-none rounded-lg px-3.5 py-2.5 shadow-xl"
          style={{
            left: hovered.left,
            top: hovered.top,
            transform: "translate(-50%, -100%)",
            background: "rgba(12,10,8,0.92)",
            border: "1px solid rgba(122,107,82,0.25)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <p className="font-cinzel text-xs md:text-sm text-[#ddd0bc] whitespace-nowrap">
            {hovered.place.name}
          </p>
          <p className="text-[10px] md:text-[11px] font-mono text-[#9a8a72] uppercase tracking-wider mt-1">
            {hovered.place.status === "sealed" || hovered.place.status === "whispered" || hovered.place.status === "mirage"
              ? `SIGNAL INTERFERENCE (${hovered.place.status})`
              : hovered.place.category}
          </p>
        </div>
      )}
    </div>
  );
}