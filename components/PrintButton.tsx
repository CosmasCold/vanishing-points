"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(122,107,82,0.1)] border border-[rgba(122,107,82,0.2)] rounded-md text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] hover:text-[#5a4e42] hover:border-[#9a8a72] transition-all"
    >
      <Printer size={12} />
      Print
    </button>
  );
}