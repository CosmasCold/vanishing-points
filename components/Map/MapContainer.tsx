"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";
import CustomMarker from "./CustomMarker";

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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [10, 45],
      zoom: 2.5,
      pitch: 30,
      attributionControl: false,
      // Desaturate the entire render for a bleached, archival look
      // Note: transformRequest is not for CSS, we handle that via container class
    });

    map.current.on("load", () => {
      setMapLoaded(true);

      // Mute the ocean to near-black
      map.current?.setPaintProperty("water", "fill-color", "#0c0c14");
      map.current?.setPaintProperty("water", "fill-opacity", 0.6);

      // Desaturate land
      map.current?.setPaintProperty("land", "background-color", "#0a0a0f");

      // Dim roads to ghost-lines
      map.current?.setPaintProperty("road-simple", "line-color", "#1a1a25");
      map.current?.setPaintProperty("road-simple", "line-opacity", 0.4);

      // Mute country borders
      map.current?.setPaintProperty("admin-0-boundary", "line-color", "#2a2a35");
      map.current?.setPaintProperty("admin-0-boundary", "line-opacity", 0.3);
      map.current?.setPaintProperty("admin-1-boundary", "line-color", "#1e1e28");
      map.current?.setPaintProperty("admin-1-boundary", "line-opacity", 0.2);

      // Suppress city labels — they break the mood
      map.current?.setLayoutProperty("settlement-label", "visibility", "none");
      map.current?.setLayoutProperty("settlement-subdivision-label", "visibility", "none");
      map.current?.setLayoutProperty("natural-point-label", "visibility", "none");
      map.current?.setLayoutProperty("water-point-label", "visibility", "none");
      map.current?.setLayoutProperty("road-label-simple", "visibility", "none");

      // Oppressive fog
      map.current?.setFog({
        color: "#0a0a0f",
        "high-color": "#0f0f18",
        "horizon-blend": 0.6,
        "space-color": "#05050a",
        "star-intensity": 0.4,
      });
    });

    // Minimal controls
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

  // Clear and recreate markers when places change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers cleanly
    const existing = document.querySelectorAll(".custom-marker");
    existing.forEach((el) => el.remove());

    places.forEach((place) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      const pin = document.createElement("div");
      el.appendChild(pin);

      const isHaunted = place.category === "haunted" || place.category === "both";
      const isAbandoned =
        place.category === "abandoned" || place.category === "both";

      let bg = "#8b8b9a";
      if (isHaunted && isAbandoned) bg = "linear-gradient(135deg, #8b4513, #4a6741)";
      else if (isHaunted) bg = "#c4c4b5";
      else if (isAbandoned) bg = "#8b4513";

      pin.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${bg};
        border: 1.5px solid #0a0a0f;
        box-shadow: 0 0 10px ${isHaunted ? "rgba(196,196,181,0.2)" : "rgba(139,69,19,0.2)"};
        transition: all 0.3s ease;
      `;

      if (isHaunted) {
        const pulse = document.createElement("div");
        pulse.style.cssText = `
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 6px; height: 6px;
          background: rgba(196,196,181,0.5);
          border-radius: 50%;
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        `;
        el.appendChild(pulse);
      }

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -7],
      })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      el.addEventListener("mouseenter", () => {
        pin.style.transform = "rotate(-45deg) scale(1.4)";
        pin.style.boxShadow = isHaunted
          ? "0 0 18px rgba(196,196,181,0.35)"
          : "0 0 18px rgba(139,69,19,0.35)";
      });

      el.addEventListener("mouseleave", () => {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = isHaunted
          ? "0 0 10px rgba(196,196,181,0.2)"
          : "0 0 10px rgba(139,69,19,0.2)";
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPlace(place);
      });
    });
  }, [places, mapLoaded, onSelectPlace]);

  return (
    <div className="relative w-full h-full map-container">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-void flex items-center justify-center z-10">
          <div className="text-ash font-mono text-sm animate-pulse">
            Rendering topography...
          </div>
        </div>
      )}
    </div>
  );
}