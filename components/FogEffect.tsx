"use client";

import { useState, useEffect } from "react";

export default function FogEffect() {
  const [dust, setDust] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    setDust(Math.min(d, 100));
  }, []);

  const opacity = dust / 160; // 0 at 0%, ~0.625 at 100%
  const corruptionTint = dust > 75
    ? `rgba(196, 120, 90, ${(dust - 75) / 250})` // faint rust bleed at high dust
    : "transparent";

  if (opacity <= 0.02) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25]"
      aria-hidden="true"
      style={{
        opacity,
        background: `
          radial-gradient(circle at 30% 70%, ${corruptionTint} 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(200, 190, 170, 0.03) 0%, transparent 50%)
        `,
        animation: "fog-drift 20s ease-in-out infinite alternate",
      }}
    />
  );
}