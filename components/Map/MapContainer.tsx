"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";
import CustomMarker from "@/components/Map/CustomMarker";

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
    });

    map.current.on("load", () => {
      setMapLoaded(true);
      // Add fog atmosphere
      map.current?.setFog({
        color: "#0a0a0f",
        "high-color": "#12121a",
        "horizon-blend": 0.4,
        "space-color": "#0a0a0f",
        "star-intensity": 0.8,
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

  // Add markers when places load
  useEffect(() => {
    if (!map.current || !mapLoaded || places.length === 0) return;

    // Clear existing markers
    const markers = document.querySelectorAll(".custom-marker");
    markers.forEach((m) => m.remove());

    places.forEach((place) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      const root = document.createElement("div");
      el.appendChild(root);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPlace(place);
      });
    });
  }, [places, mapLoaded, onSelectPlace]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-void flex items-center justify-center z-10">
          <div className="text-ash font-mono text-sm animate-pulse">
            Rendering topography...
          </div>
        </div>
      )}
      {mapLoaded &&
        places.map((place) => (
          <CustomMarker
            key={place._id}
            place={place}
            map={map.current!}
            onClick={() => onSelectPlace(place)}
          />
        ))}
    </div>
  );
}