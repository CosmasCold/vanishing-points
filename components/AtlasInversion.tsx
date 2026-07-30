"use client";

import { useEffect, useState } from "react";

export default function AtlasInversion() {
  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setInverted((v) => {
          const next = !v;
          if (next) {
            document.body.classList.add("atlas-inverted");
          } else {
            document.body.classList.remove("atlas-inverted");
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!inverted) return null;

  return (
    <style jsx global>{`
      .atlas-inverted .mapboxgl-canvas {
        filter: sepia(0.3) contrast(1.2) brightness(0.7) saturate(0.6) hue-rotate(90deg) !important;
      }
      .atlas-inverted::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 35;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(51, 255, 0, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(51, 255, 0, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
      }
    `}</style>
  );
}