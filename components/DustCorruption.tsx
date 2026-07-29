"use client";

import { useEffect } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

export default function DustCorruption() {
  const { level, isCorrupted, isSevere } = useDustLevel();

  useEffect(() => {
    const body = document.body;

    // Base corruption: subtle scanlines
    if (level > 20) {
      body.style.setProperty("--dust-scanline", "0.04");
    } else {
      body.style.setProperty("--dust-scanline", "0");
    }

    // Corrupted: green tint bleed
    if (isCorrupted) {
      body.classList.add("dust-corrupted");
    } else {
      body.classList.remove("dust-corrupted");
    }

    // Severe: occasional flicker interval
    let flicker: NodeJS.Timeout;
    if (isSevere) {
      flicker = setInterval(() => {
        const el = document.createElement("div");
        el.className = "fixed inset-0 z-[9998] bg-[#33ff00] mix-blend-overlay pointer-events-none";
        el.style.opacity = "0.06";
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 80);
      }, 15000 + Math.random() * 20000);
    }

    return () => {
      if (flicker) clearInterval(flicker);
    };
  }, [level, isCorrupted, isSevere]);

  return (
    <style jsx global>{`
      .dust-corrupted .drawer-card {
        position: relative;
      }
      .dust-corrupted .drawer-card::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        box-shadow: inset 0 0 40px rgba(51, 255, 0, 0.03);
        opacity: 0;
        animation: dust-pulse 8s ease-in-out infinite;
      }
      @keyframes dust-pulse {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 9997;
        pointer-events: none;
        background: linear-gradient(
          rgba(18, 16, 20, 0) 50%,
          rgba(0, 0, 0, var(--dust-scanline, 0)) 50%
        );
        background-size: 100% 4px;
        transition: --dust-scanline 2s ease;
      }
    `}</style>
  );
}