"use client";

import { Keyboard } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ShortcutHint({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Open field reference"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all active:scale-95 border"
      style={{
        background: "rgba(20,16,12,0.8)",
        backdropFilter: "blur(8px)",
        borderColor: "rgba(122,107,82,0.15)",
        color: "#7a6e5e",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#c4b8a4";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#7a6e5e";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)";
      }}
    >
      <Keyboard size={12} />
      <span className="hidden sm:inline">Press</span>
      <kbd
        className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
        style={{
          background: "rgba(122,107,82,0.1)",
          border: "1px solid rgba(122,107,82,0.2)",
          color: "inherit",
        }}
      >
        ?
      </kbd>
      <span className="hidden sm:inline">for reference</span>
    </button>
  );
}