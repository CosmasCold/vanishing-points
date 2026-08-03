"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { Place } from "@/types";

interface Props {
  place: Place;
  map: mapboxgl.Map;
  onClick: () => void;
  isSelected?: boolean;
}

export default function CustomMarker({ place, map, onClick, isSelected }: Props) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "relative cursor-pointer";
    el.style.zIndex = "1";

    const isHaunted = place.category === "haunted" || place.category === "both";
    const isAbandoned = place.category === "abandoned" || place.category === "both";

    let markerBg = "#5a4e42";
    let glowColor = "rgba(90,78,66,0.25)";
    let coreColor = "#9a8a72";

    if (isHaunted && isAbandoned) {
      markerBg = "linear-gradient(135deg, #7a3a2a, #5a4e42)";
      glowColor = "rgba(196,120,90,0.3)";
      coreColor = "#c4785a";
    } else if (isHaunted) {
      markerBg = "#ddd0bc";
      glowColor = "rgba(221,208,188,0.25)";
      coreColor = "#ddd0bc";
    } else if (isAbandoned) {
      markerBg = "#5a4e42";
      glowColor = "rgba(90,78,66,0.25)";
      coreColor = "#9a8a72";
    }

    const size = isSelected ? 18 : 14;
    const half = Math.round(size / 2);

    const pulseHtml = isHaunted
      ? `<div style="
          position: absolute;
          top: 50%; left: 50%;
          width: ${size}px; height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: translate(-50%, -50%) rotate(-45deg);
          border: 1px solid ${glowColor};
          animation: marker-pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          pointer-events: none;
          z-index: 5;
        "></div>`
      : "";

    const coreHtml = `<div style="
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 4px; height: 4px;
      background: ${coreColor};
      border-radius: 50%;
      opacity: 0.5;
      pointer-events: none;
      z-index: 15;
    "></div>`;

    const labelHtml = `<div class="marker-label" style="
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(6px);
      white-space: nowrap;
      padding: 5px 12px;
      border-radius: 4px;
      font-family: var(--font-mono), ui-monospace, monospace;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ddd0bc;
      background: rgba(12,10,8,0.92);
      border: 1px solid rgba(122,107,82,0.25);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 16px rgba(12,10,8,0.6);
      z-index: 100;
    ">${place.name}</div>`;

    el.innerHTML = `
      <style>
        @keyframes marker-pulse {
          0%, 100% { transform: translate(-50%, -50%) rotate(-45deg) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) rotate(-45deg) scale(2.4); opacity: 0; }
        }
      </style>
      ${labelHtml}
      ${pulseHtml}
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${markerBg};
        border: 1.5px solid #0c0a08;
        box-shadow:
          0 0 12px ${glowColor},
          inset 0 1px 2px rgba(255,255,255,0.08);
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        z-index: 10;
      " class="marker-pin"></div>
      ${coreHtml}
    `;

    markerRef.current = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, -half],
    })
      .setLngLat(place.coordinates)
      .addTo(map);

    const pin = el.querySelector(".marker-pin") as HTMLElement | null;
    const label = el.querySelector(".marker-label") as HTMLElement | null;

    const onMouseEnter = () => {
      el.style.zIndex = "50";
      if (pin) {
        pin.style.transform = "rotate(-45deg) scale(1.4)";
        pin.style.boxShadow = `0 0 24px ${glowColor}, inset 0 1px 2px rgba(255,255,255,0.12)`;
      }
      if (label) {
        label.style.opacity = "1";
        label.style.transform = "translateX(-50%) translateY(0)";
      }
    };

    const onMouseLeave = () => {
      el.style.zIndex = "1";
      if (pin) {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = `0 0 12px ${glowColor}, inset 0 1px 2px rgba(255,255,255,0.08)`;
      }
      if (label) {
        label.style.opacity = "0";
        label.style.transform = "translateX(-50%) translateY(6px)";
      }
    };

    const onElClick = (e: MouseEvent) => {
      e.stopPropagation();
      handleClick();
    };

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("click", onElClick);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("click", onElClick);
      markerRef.current?.remove();
    };
  }, [place, map, isSelected, handleClick]);

  return null;
}