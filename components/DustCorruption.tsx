"use client";

import { useEffect, useRef } from "react";
import { useDustLevel } from "@/hooks/useDustLevel";

export default function DustCorruption() {
  const { level, isCorrupted, isSevere } = useDustLevel();
  const flickerEls = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const body = document.body;

    if (level > 20) {
      body.style.setProperty("--dust-scanline", "0.04");
    } else {
      body.style.setProperty("--dust-scanline", "0");
    }

    if (isCorrupted) {
      body.classList.add("dust-corrupted");
    } else {
      body.classList.remove("dust-corrupted");
    }

    let flicker: ReturnType<typeof setInterval>;
    if (isSevere) {
      flicker = setInterval(() => {
        const el = document.createElement("div");
        el.className = "fixed inset-0 z-[9998] mix-blend-overlay pointer-events-none";
        el.style.backgroundColor = "#c4785a";
        el.style.opacity = "0.06";
        document.body.appendChild(el);
        flickerEls.current.push(el);
        setTimeout(() => {
          el.remove();
          flickerEls.current = flickerEls.current.filter((x) => x !== el);
        }, 80);
      }, 15000 + Math.random() * 20000);
    }

    return () => {
      if (flicker) clearInterval(flicker);
      flickerEls.current.forEach((el) => el.remove());
      flickerEls.current = [];
      body.classList.remove("dust-corrupted");
      body.style.setProperty("--dust-scanline", "0");
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
        box-shadow: inset 0 0 40px rgba(196, 120, 90, 0.03);
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
          rgba(122, 107, 82, 0) 50%,
          rgba(12, 10, 8, var(--dust-scanline, 0)) 50%
        );
        background-size: 100% 4px;
      }
    `}</style>
  );
}