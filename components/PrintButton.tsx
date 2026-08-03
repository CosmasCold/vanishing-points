"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      aria-label="Print field copy"
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all active:scale-95"
      style={{
        background: "rgba(122,107,82,0.08)",
        border: "1px solid rgba(122,107,82,0.15)",
        color: "#7a6e5e",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#5a4e42";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#7a6e5e";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)";
      }}
    >
      <Printer size={12} />
      Field copy
    </button>
  );
}