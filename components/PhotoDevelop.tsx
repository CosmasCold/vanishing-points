"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function PhotoDevelop({ src, alt, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#1a1410] ${className}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-[filter,transform] duration-[1800ms] ease-out ${
          loaded
            ? "blur-0 grayscale-0 brightness-100 contrast-100 scale-100"
            : "blur-[6px] grayscale-[0.7] brightness-[0.7] contrast-125 sepia-[0.3] scale-105"
        }`}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-[#c9b896]/10 animate-pulse" />
      )}
    </div>
  );
}