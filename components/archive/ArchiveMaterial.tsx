'use client';

import React from "react";

export const ArchiveMaterial: React.FC<React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }> = ({
  selected = false,
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    {...props}
    className={`archive-material ${className}`}
    style={{
      position: "relative",
      overflow: "hidden",
      background: selected
        ? "linear-gradient(145deg, rgba(248,238,220,.98), rgba(218,194,151,.98))"
        : "linear-gradient(145deg, rgba(236,224,199,.97), rgba(194,164,112,.97))",
      boxShadow: selected
        ? "0 25px 34px rgba(0,0,0,.78), inset 0 1px rgba(255,255,255,.85), inset 0 -24px 35px rgba(64,38,14,.14)"
        : "0 15px 22px rgba(0,0,0,.60), inset 0 1px rgba(255,255,255,.72), inset 0 -22px 30px rgba(64,38,14,.11)",
      ...style,
    }}
  >
    <span
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        opacity: 0.24,
        mixBlendMode: "multiply",
        backgroundImage: `repeating-linear-gradient(0deg, rgba(79,48,20,.035) 0 1px, transparent 1px 4px), radial-gradient(circle at 12% 15%, rgba(112,67,22,.10), transparent 21%)`,
      }}
    />
    <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
  </div>
);

export const ArchiveModalFrame: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    {...props}
    className={`modal-chassis ${className}`}
    style={{
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background: "linear-gradient(145deg, rgba(255,220,170,.045), transparent 28%, rgba(0,0,0,.18) 100%)",
        mixBlendMode: "screen",
      }}
    />
    <div className="relative z-10 h-full">{children}</div>
  </div>
);
