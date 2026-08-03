"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

export default function PhotoDevelop({ src, alt, className = "", lazy = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "rgba(26,20,16,1)" }}
    >
      <img
        src={src}
        alt={alt}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true); // Exit loading state
        }}
        className={`w-full h-full object-cover transition-[filter,transform] duration-[1800ms] ease-out ${
          error
            ? "grayscale-[1] brightness-[0.4] contrast-125 sepia-[0.2]"
            : loaded
            ? "blur-0 grayscale-0 brightness-100 contrast-100 scale-100"
            : "blur-[6px] grayscale-[0.7] brightness-[0.7] contrast-125 sepia-[0.3] scale-105"
        }`}
      />

      {/* Loading shimmer */}
      {!loaded && !error && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: "rgba(201,184,150,0.06)" }}
        />
      )}

      {/* Damaged negative indicator */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-[10px] font-mono uppercase tracking-widest opacity-20"
            style={{ color: "#9a8a72" }}
          >
            Negative damaged
          </span>
        </div>
      )}
    </div>
  );
}