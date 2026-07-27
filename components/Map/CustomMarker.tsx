"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Place } from "@/types";

interface Props {
  place: Place;
  map: mapboxgl.Map;
  onClick: () => void;
}

export default function CustomMarker({ place, map, onClick }: Props) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "relative cursor-none group";

    const isHaunted = place.category === "haunted" || place.category === "both";
    const isAbandoned =
      place.category === "abandoned" || place.category === "both";

    let markerColor = "#8b8b9a";
    if (isHaunted && isAbandoned) markerColor = "linear-gradient(135deg, #8b4513, #4a6741)";
    else if (isHaunted) markerColor = "#c4c4b5";
    else if (isAbandoned) markerColor = "#8b4513";

    el.innerHTML = `
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${markerColor};
        border: 1.5px solid #0a0a0f;
        box-shadow: 0 0 8px ${isHaunted ? "rgba(196,196,181,0.25)" : "rgba(139,69,19,0.25)"};
        transition: all 0.3s ease;
      " class="marker-pin"></div>
      ${isHaunted ? `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: rgba(196,196,181,0.6);
          border-radius: 50%;
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        "></div>
      ` : ""}
    `;

    markerRef.current = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, -7],
    })
      .setLngLat(place.coordinates)
      .addTo(map);

    el.addEventListener("mouseenter", () => {
      const pin = el.querySelector(".marker-pin") as HTMLElement;
      if (pin) {
        pin.style.transform = "rotate(-45deg) scale(1.4)";
        pin.style.boxShadow = isHaunted
          ? "0 0 16px rgba(196,196,181,0.4)"
          : "0 0 16px rgba(139,69,19,0.4)";
      }
    });

    el.addEventListener("mouseleave", () => {
      const pin = el.querySelector(".marker-pin") as HTMLElement;
      if (pin) {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = isHaunted
          ? "0 0 8px rgba(196,196,181,0.25)"
          : "0 0 8px rgba(139,69,19,0.25)";
      }
    });

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });

    return () => {
      markerRef.current?.remove();
    };
  }, [place, map, onClick]);

  return null;
}