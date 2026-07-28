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
}

export default function MapContainer({ places, onSelectPlace, loading }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [10, 45],
      zoom: 2.4,
      pitch: 28,
      bearing: -8,
      attributionControl: false,
      antialias: true,
    });

    map.current.on("load", () => {
      setMapLoaded(true);

      // Land: aged parchment
      try { map.current?.setPaintProperty("land", "background-color", "#c9b896"); } catch {}
      try { map.current?.setPaintProperty("landcover", "fill-color", "#bfae88"); } catch {}

      // Water: dark tea stain
      try { map.current?.setPaintProperty("water", "fill-color", "#7a6b52"); } catch {}
      try { map.current?.setPaintProperty("water", "fill-opacity", 0.55); } catch {}

      // Buildings: pressed into the page
      try { map.current?.setPaintProperty("building", "fill-color", "#b8a078"); } catch {}
      try { map.current?.setPaintProperty("building-3d", "fill-color", "#a69068"); } catch {}

      // Roads: faint ink scratches
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

      // Boundaries: iron gall ink
      const boundaryLayers = ["admin-0-boundary", "admin-0-boundary-bg", "admin-1-boundary", "admin-1-boundary-bg"];
      boundaryLayers.forEach(layer => {
        try {
          map.current?.setPaintProperty(layer, "line-color", "#4a3a28");
          map.current?.setPaintProperty(layer, "line-opacity", 0.35);
          map.current?.setPaintProperty(layer, "line-width", 0.8);
        } catch {}
      });

      // Labels: copperplate engraving
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

      // Warm atmospheric haze — low, oppressive
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

    map.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-left"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const existing = document.querySelectorAll(".custom-marker");
    existing.forEach((el) => el.remove());

    places.forEach((place) => {
      const el = document.createElement("div");
      el.className = "custom-marker";

      const isHaunted = place.category === "haunted" || place.category === "both";
      const isAbandoned = place.category === "abandoned" || place.category === "both";

      // Brass tack / wax seal design
      let innerColor = "#8b7355";
      let outerColor = "#3e2b1a";
      let glowColor = "rgba(139,115,85,0.25)";

      if (isHaunted && isAbandoned) {
        innerColor = "conic-gradient(from 0deg, #8b6914, #3e4a32, #8b6914)";
        glowColor = "rgba(139,105,20,0.2)";
      } else if (isHaunted) {
        innerColor = "#c4b5a0";
        outerColor = "#5a4a3a";
        glowColor = "rgba(196,181,160,0.2)";
      } else if (isAbandoned) {
        innerColor = "#6b3020";
        glowColor = "rgba(107,48,32,0.2)";
      }

      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${innerColor};
          border: 2px solid ${outerColor};
          box-shadow: 
            inset 0 1px 2px rgba(255,255,255,0.2),
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
            border: 1px solid rgba(196,181,160,0.15);
            animation: heat-shimmer 6s ease-in-out infinite;
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
          pin.style.boxShadow = `
            inset 0 1px 2px rgba(255,255,255,0.3),
            0 0 0 1px rgba(0,0,0,0.3),
            0 4px 12px rgba(0,0,0,0.5),
            0 0 20px ${glowColor.replace("0.2", "0.45")}
          `;
        }
      });

      el.addEventListener("mouseleave", () => {
        if (pin) {
          pin.style.transform = "scale(1)";
          pin.style.boxShadow = `
            inset 0 1px 2px rgba(255,255,255,0.2),
            0 0 0 1px rgba(0,0,0,0.3),
            0 2px 6px rgba(0,0,0,0.4),
            0 0 12px ${glowColor}
          `;
        }
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPlace(place);
      });
    });
  }, [places, mapLoaded, onSelectPlace]);

  return (
    <div className="relative w-full h-full map-frame">
      <div ref={mapContainer} className="w-full h-full map-parchment" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#1a1510] flex items-center justify-center z-30">
          <div className="text-[#8b7355] font-mono text-sm tracking-widest uppercase">
            Unfurling the charts...
          </div>
        </div>
      )}
    </div>
  );
}