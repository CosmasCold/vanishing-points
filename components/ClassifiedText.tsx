"use client";

import { useState, useMemo } from "react";

interface Props {
  text: string;
  redactWords?: string[];
  autoRedact?: boolean;
  className?: string;
}

export default function ClassifiedText({
  text,
  redactWords = ["killed", "murdered", "death", "bodies", "corpse", "blood", "died", "grave", "buried", "hanged", "suicide", "tortured", "massacre"],
  autoRedact = true,
  className = "",
}: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const tokens = useMemo(() => {
    return text.split(/(\s+|[.,;!?]+)/);
  }, [text]);

  const shouldRedact = (word: string, index: number): boolean => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (clean.length < 3) return false;

    if (redactWords.some((r) => clean.includes(r))) return true;

    if (autoRedact) {
      const hash = clean.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return hash % 8 === 0;
    }

    return false;
  };

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  let redactCount = 0;

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        const clean = token.toLowerCase().replace(/[^a-z]/g, "");
        const isRedactable = clean.length >= 3 && shouldRedact(token, i);

        if (!isRedactable || token.trim() === "") {
          return <span key={i}>{token}</span>;
        }

        redactCount++;
        const isRevealed = revealed.has(i);

        return (
          <span
            key={i}
            onClick={() => toggle(i)}
            className="relative inline-block cursor-pointer group mx-[1px]"
            title="Click to declassify"
          >
            {!isRevealed ? (
              <span className="bg-[#1a1410] border-b-2 border-[#7a3a2a] px-[3px] py-[1px] rounded-sm select-none inline-flex items-center gap-[2px]">
                {Array.from({ length: Math.min(token.length, 6) }).map((_, j) => (
                  <span
                    key={j}
                    className="inline-block w-[6px] h-[6px] bg-[#5a4a3a] rounded-[1px]"
                  />
                ))}
                <span className="sr-only">{token}</span>
              </span>
            ) : (
              <span className="text-[#7a3a2a] font-medium border-b border-dashed border-[#7a3a2a]/40 transition-colors duration-300">
                {token}
              </span>
            )}
          </span>
        );
      })}
      {redactCount === 0 && autoRedact && (
        <span className="sr-only">No redactions applied</span>
      )}
    </span>
  );
}