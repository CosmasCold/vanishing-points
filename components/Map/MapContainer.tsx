"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Props {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  loading: boolean;
  center?: [number, number];
  anniversarySlugs?: string[];
}

// Connected place pairs
const CONNECTIONS: [string, string][] = [
  ["pripyat-amusement-park", "duga-radar-array"],
  ["oradour-sur-glane", "villisca-axe-murder-house"],
  ["chernobyl", "pripyat-amusement-park"],
];

export default function MapContainer({
  places,
  onSelectPlace,
  loading,
  center,
  anniversarySlugs = [],
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center || [10, 45],
      zoom: 2.4,
      pitch: 28,
      bearing: -8,
      attributionControl: false,
      antialias: true,
    });

    map.current.on("load", () => {
      setMapLoaded(true);

      try { map.current?.setPaintProperty("land", "background-color", "#c9b896"); } catch {}
      try { map.current?.setPaintProperty("landcover", "fill-color", "#bfae88"); } catch {}
      try { map.current?.setPaintProperty("water", "fill-color", "#7a6b52"); } catch {}
      try { map.current?.setPaintProperty("water", "fill-opacity", 0.55); } catch {}

      const roadLayers = [
        "road-motorway", "road-trunk", "road-primary", "road-secondary",
        "road-street", "road-minor", "road-path", "road-service", "road-track",
        "road-simple", "road-motorway-navigation", "road-primary-navigation"
      ];
      roadLayers.forEach(layer => {
        try {
          map.current?.setPaintProperty(layer, "line-color", "#6b5a42");
          map.current?.setPaintProperty(layer, "line-opacity", 0.25);
          map.current?.setPaintProperty(layer, "line-width", 0.5);
        } catch {}
      });

      const boundaryLayers = ["admin-0-boundary", "admin-0-boundary-bg", "admin-1-boundary", "admin-1-boundary-bg"];
      boundaryLayers.forEach(layer => {
        try {
          map.current?.setPaintProperty(layer, "line-color", "#4a3a28");
          map.current?.setPaintProperty(layer, "line-opacity", 0.35);
          map.current?.setPaintProperty(layer, "line-width", 0.8);
        } catch {}
      });

      const labelLayers = [
        "settlement-major-label", "settlement-minor-label", "settlement-subdivision-label",
        "natural-point-label", "water-point-label", "poi-label", "road-label",
        "road-number-shield", "road-exit-shield"
      ];
      labelLayers.forEach(layer => {
        try {
          map.current?.setPaintProperty(layer, "text-color", "#3a2a1a");
          map.current?.setPaintProperty(layer, "text-halo-color", "#c9b896");
          map.current?.setPaintProperty(layer, "text-halo-width", 2);
          map.current?.setPaintProperty(layer, "text-halo-blur", 1);
        } catch {}
      });

      map.current?.setFog({
        color: "#b8a078",
        "high-color": "#c9b896",
        "horizon-blend": 0.45,
        "space-color": "#7a6b52",
        "star-intensity": 0,
      });
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (center && map.current) {
      map.current.flyTo({ center, zoom: 5, duration: 2000 });
    }
  }, [center]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing
    const existing = document.querySelectorAll(".custom-marker, .connection-line");
    existing.forEach((el) => el.remove());

    // Draw connections
    const placeMap = new Map(places.map((p) => [p.slug, p]));
    CONNECTIONS.forEach(([a, b]) => {
      const p1 = placeMap.get(a);
      const p2 = placeMap.get(b);
      if (!p1 || !p2 || !map.current) return;

      // Simple DOM line — could use mapbox layer but this is lighter
      // Skipping for brevity; add via GeoJSON line layer if needed
    });

    places.forEach((place) => {
      const el = document.createElement("div");
      el.className = "custom-marker";

      const isHaunted = place.category === "haunted" || place.category === "both";
      const isAnniversary = anniversarySlugs.includes(place.slug);

      let innerColor = "#7a6b52";
      let outerColor = "#3d3228";
      let glowColor = "rgba(122, 107, 82, 0.2)";

      if (isHaunted && isAnniversary) {
        innerColor = "#a67c52";
        glowColor = "rgba(166, 124, 82, 0.4)";
      } else if (isHaunted) {
        innerColor = "#b5a898";
        outerColor = "#5a4e42";
        glowColor = "rgba(181, 168, 152, 0.15)";
      } else if (isAnniversary) {
        innerColor = "#8a6a4a";
        glowColor = "rgba(138, 106, 74, 0.35)";
      }

      el.innerHTML = `
        <div style="
          width: ${isAnniversary ? 20 : 16}px;
          height: ${isAnniversary ? 20 : 16}px;
          border-radius: 50%;
          background: ${innerColor};
          border: 2px solid ${outerColor};
          box-shadow: 
            inset 0 1px 2px rgba(255,255,255,0.15),
            0 0 0 1px rgba(0,0,0,0.3),
            0 2px 6px rgba(0,0,0,0.4),
            0 0 12px ${glowColor};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        ">
          ${isHaunted ? `<div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 1px solid rgba(181, 168, 152, 0.12);
            animation: heat-shimmer 6s ease-in-out infinite;
          "></div>` : ""}
          ${isAnniversary ? `<div style="
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 1px solid rgba(166, 124, 82, 0.2);
            animation: heat-shimmer 3s ease-in-out infinite;
          "></div>` : ""}
        </div>
      `;

      const pin = el.firstElementChild as HTMLElement;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => {
        if (pin) {
          pin.style.transform = "scale(1.5)";
        }
      });

      el.addEventListener("mouseleave", () => {
        if (pin) {
          pin.style.transform = "scale(1)";
        }
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPlace(place);
      });
    });
  }, [places, mapLoaded, onSelectPlace, anniversarySlugs]);

  return (
    <div className="relative w-full h-full map-frame">
      <div ref={mapContainer} className="w-full h-full map-parchment" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#1a1612] flex items-center justify-center z-30">
          <div className="text-[#9a8a72] font-mono text-sm tracking-widest uppercase">
            Unfurling the charts...
          </div>
        </div>
      )}
    </div>
  );
}