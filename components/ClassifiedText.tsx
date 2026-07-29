"use client";

import { useState } from "react";

interface Props {
  text: string;
  redactWords?: string[];
  className?: string;
}

export default function ClassifiedText({
  text,
  redactWords = ["name", "killed", "murdered", "death", "bodies", "corpse"],
  className = "",
}: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const words = text.split(/(\s+)/);

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <span className={className}>
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        const shouldRedact = redactWords.some((r) => clean.includes(r));

        if (!shouldRedact || word.trim() === "") {
          return <span key={i}>{word}</span>;
        }

        const isRevealed = revealed.has(i);

        return (
          <span
            key={i}
            onClick={() => toggle(i)}
            className={`
              relative inline-block cursor-pointer transition-all duration-300 mx-[1px]
              ${isRevealed ? "text-[#7a3a2a]" : ""}
            `}
          >
            {!isRevealed && (
              <span className="bg-[#2a2220] border-b border-[#9a8a72]/30 px-[2px] rounded-sm select-none">
                {"█".repeat(Math.min(word.length, 8))}
              </span>
            )}
            {isRevealed && word}
          </span>
        );
      })}
    </span>
  );
}