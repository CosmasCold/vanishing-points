"use client";

import { Keyboard } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ShortcutHint({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-3 py-2 bg-[#252018]/80 backdrop-blur-sm border border-[rgba(122,107,82,0.2)] rounded-lg text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] hover:text-[#c4b8a4] hover:border-[rgba(122,107,82,0.4)] transition-all shadow-lg group"
      title="Open keyboard shortcut guide"
    >
      <Keyboard size={12} className="group-hover:text-[#ddd0bc] transition-colors" />
      <span className="hidden sm:inline">Press</span>
      <kbd className="px-1.5 py-0.5 bg-[rgba(122,107,82,0.15)] border border-[rgba(122,107,82,0.25)] rounded text-[9px] text-[#9a8a72] group-hover:text-[#ddd0bc] group-hover:border-[rgba(122,107,82,0.4)] transition-colors">
        ?
      </kbd>
      <span className="hidden sm:inline">for guide</span>
    </button>
  );
}