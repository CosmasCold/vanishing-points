"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  level: number;
  variant?: "default" | "parchment";
}

export default function DangerIndicator({ level, variant = "default" }: Props) {
  if (variant === "parchment") {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`danger-stamp ${i >= level ? "empty" : ""}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <AlertTriangle
          key={i}
          size={10}
          className={i < level ? "text-ember" : "text-fog"}
          fill={i < level ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}