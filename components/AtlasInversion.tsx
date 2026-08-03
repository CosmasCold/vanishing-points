"use client";

import { useEffect, useState } from "react";

export default function AtlasInversion() {
  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    const corruption = parseInt(localStorage.getItem("vp-corruption-stage") || "0", 10);
    if (corruption >= 3) {
      setInverted(true);
      document.body.classList.add("atlas-inverted");
    }

    const handleBreach = () => {
      setInverted(true);
      document.body.classList.add("atlas-inverted");
    };
    window.addEventListener("atlas-invert", handleBreach);

    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setInverted((v) => {
          const next = !v;
          document.body.classList.toggle("atlas-inverted", next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("atlas-invert", handleBreach);
      window.removeEventListener("keydown", handleKey);
      document.body.classList.remove("atlas-inverted");
    };
  }, []);

  if (!inverted) return null;

  return (
    <style>{`
      .atlas-inverted .mapboxgl-canvas {
        filter: sepia(0.35) contrast(1.35) brightness(0.6) saturate(0.45) hue-rotate(-15deg) !important;
      }
      .atlas-inverted::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 35;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(196, 120, 90, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196, 120, 90, 0.04) 1px, transparent 1px);
        background-size: 50px 50px;
      }
    `}</style>
  );
}