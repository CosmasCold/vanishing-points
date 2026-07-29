"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Props {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  loading: boolean;
  center?: [number, number];
  anniversarySlugs: string[];
}

export default function MapContainer({
  places,
  onSelectPlace,
  loading,
  center,
  anniversarySlugs,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; place: Place }[]>([]);
  const [hovered, setHovered] = useState<{
    place: Place;
    left: number;
    top: number;
  } | null>(null);

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

  // Render markers
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
        onSelectPlace(place);
      });

      markersRef.current.push({ marker, place });
    });
  }, [places, loading, anniversarySlugs, onSelectPlace]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {hovered && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: hovered.left, top: hovered.top }}
        >
          <div className="bg-[#252018] border border-[rgba(122,107,82,0.4)] rounded-lg px-3 py-2 shadow-xl mb-1.5">
            <p className="font-cinzel text-xs text-[#ddd0bc] whitespace-nowrap">
              {hovered.place.name}
            </p>
            <p className="text-[9px] font-mono text-[#9a8a72]">
              {hovered.place.address.country} · Danger {hovered.place.dangerLevel}
            </p>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    i < hovered.place.dangerLevel
                      ? "bg-[#7a3a2a]"
                      : "bg-[rgba(122,107,82,0.3)]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-2 h-2 bg-[#252018] border-r border-b border-[rgba(122,107,82,0.4)] rotate-45 mx-auto -mt-2.5 relative z-10" />
        </div>
      )}
    </div>
  );
}