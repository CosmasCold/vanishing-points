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

  const { tokens, redactIndices } = useMemo(() => {
    const toks = text.split(/(\s+|[.,;!?]+)/);
    const indices = new Set<number>();

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

    toks.forEach((token, i) => {
      const clean = token.toLowerCase().replace(/[^a-z]/g, "");
      if (clean.length >= 3 && shouldRedact(token, i)) {
        indices.add(i);
      }
    });

    return { tokens: toks, redactIndices: indices };
  }, [text, redactWords, autoRedact]);

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
      {tokens.map((token, i) => {
        if (!redactIndices.has(i) || token.trim() === "") {
          return <span key={i}>{token}</span>;
        }

        const isRevealed = revealed.has(i);

        return (
          <span
            key={i}
            onClick={() => toggle(i)}
            className="relative inline-block cursor-pointer select-none"
            style={{ marginLeft: 1, marginRight: 1 }}
            title="Declassify"
          >
            {!isRevealed ? (
              <span
                className="inline-flex items-center rounded-sm select-none"
                style={{
                  backgroundColor: "#1a1410",
                  borderBottom: "2px solid #7a3a2a",
                  paddingLeft: 3,
                  paddingRight: 3,
                  paddingTop: 1,
                  paddingBottom: 1,
                  gap: 2,
                }}
              >
                {Array.from({ length: Math.min(token.length, 6) }).map((_, j) => (
                  <span
                    key={j}
                    className="inline-block"
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#5a4a3a",
                      borderRadius: 1,
                    }}
                  />
                ))}
                <span className="sr-only">{token}</span>
              </span>
            ) : (
              <span
                className="border-b border-dashed transition-colors"
                style={{
                  color: "#c4785a",
                  borderColor: "rgba(196,120,90,0.4)",
                  transitionDuration: "150ms",
                }}
              >
                {token}
              </span>
            )}
          </span>
        );
      })}
      {redactIndices.size === 0 && autoRedact && (
        <span className="sr-only">No redactions applied</span>
      )}
    </span>
  );
}