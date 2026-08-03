"use client";

import { useEffect, useRef } from "react";

const GHOST_LINES = [
  "It sees you reading this.",
  "Don't look behind the drawer.",
  "The bunker was never empty.",
  "Dust is just dead skin and time.",
  "Check your reflection.",
  "The map lies.",
];

export default function CorruptionManager() {
  const activeElements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const cursors = [
      "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"%239a8a72\"/></svg>') 8 8, auto",
      "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\"><path d=\"M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6Z\" fill=\"%237a3a2a\"/></svg>') 8 8, auto",
    ];

    const flashScanline = () => {
      const el = document.createElement("div");
      el.className = "fixed inset-0 z-[9999] opacity-40 pointer-events-none";
      el.style.backgroundColor = "#0c0a08";
      el.style.mixBlendMode = "overlay";
      document.body.appendChild(el);
      activeElements.current.push(el);
      setTimeout(() => {
        el.remove();
        activeElements.current = activeElements.current.filter((x) => x !== el);
      }, 120);
    };

    const glitchCursor = () => {
      document.body.style.cursor = cursors[Math.floor(Math.random() * cursors.length)];
      setTimeout(() => {
        document.body.style.cursor = "";
      }, 1800);
    };

    const ghostText = () => {
      const paras = document.querySelectorAll("p");
      const target = paras[Math.floor(Math.random() * paras.length)];
      if (!target) return;
      const span = document.createElement("span");
      span.className = "italic mx-1 animate-flicker";
      span.style.color = "rgba(122,58,42,0.6)";
      span.textContent = ` ${GHOST_LINES[Math.floor(Math.random() * GHOST_LINES.length)]} `;
      target.appendChild(span);
      activeElements.current.push(span);
      setTimeout(() => {
        span.remove();
        activeElements.current = activeElements.current.filter((x) => x !== span);
      }, 3000);
    };

    const events = [flashScanline, glitchCursor, ghostText];
    const interval = setInterval(() => {
      if (Math.random() < 0.04) {
        const ev = events[Math.floor(Math.random() * events.length)];
        ev();
      }
    }, 20000);

    return () => {
      clearInterval(interval);
      activeElements.current.forEach((el) => el.remove());
      activeElements.current = [];
      document.body.style.cursor = "";
    };
  }, []);

  return null;
}