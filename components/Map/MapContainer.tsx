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

      try { map.current?.setPaintProperty("land", "background-color", "#d4c8b4"); } catch {}
      try { map.current?.setPaintProperty("landcover", "fill-color", "#c8baa6"); } catch {}
      try { map.current?.setPaintProperty("water", "fill-color", "#7a6b52"); } catch {}
      try { map.current?.setPaintProperty("water", "fill-opacity", 0.55); } catch {}
      try { map.current?.setPaintProperty("building", "fill-color", "#b8a078"); } catch {}
      try { map.current?.setPaintProperty("building-3d", "fill-color", "#a69068"); } catch {}

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
          map.current?.setPaintProperty(layer, "line-color", "#5a4e42");
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
          map.current?.setPaintProperty(layer, "text-color", "#4a3e32");
          map.current?.setPaintProperty(layer, "text-halo-color", "#d4c8b4");
          map.current?.setPaintProperty(layer, "text-halo-width", 2);
          map.current?.setPaintProperty(layer, "text-halo-blur", 1);
        } catch {}
      });

      map.current?.setFog({
        color: "#b8a078",
        "high-color": "#d4c8b4",
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

      let innerColor = "#7a6b52";
      let outerColor = "#3d3228";
      let glowColor = "rgba(122, 107, 82, 0.2)";

      if (isHaunted && isAbandoned) {
        innerColor = "conic-gradient(from 0deg, #5a4a32, #4a5a42, #5a4a32)";
        glowColor = "rgba(122, 107, 82, 0.15)";
      } else if (isHaunted) {
        innerColor = "#b5a898";
        outerColor = "#5a4e42";
        glowColor = "rgba(181, 168, 152, 0.15)";
      } else if (isAbandoned) {
        innerColor = "#5a4a32";
        glowColor = "rgba(90, 74, 50, 0.2)";
      }

      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
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
            inset 0 1px 2px rgba(255,255,255,0.2),
            0 0 0 1px rgba(0,0,0,0.3),
            0 4px 12px rgba(0,0,0,0.5),
            0 0 20px ${glowColor.replace("0.2", "0.4").replace("0.15", "0.35")}
          `;
        }
      });

      el.addEventListener("mouseleave", () => {
        if (pin) {
          pin.style.transform = "scale(1)";
          pin.style.boxShadow = `
            inset 0 1px 2px rgba(255,255,255,0.15),
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
        <div className="absolute inset-0 bg-[#1a1612] flex items-center justify-center z-30">
          <div className="text-[#9a8a72] font-mono text-sm tracking-widest uppercase">
            Unfurling the charts...
          </div>
        </div>
      )}
    </div>
  );
}