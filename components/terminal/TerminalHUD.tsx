// components/terminal/TerminalHUD.tsx
'use client';

import React, { memo } from 'react';
import { Terminal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { TerminalTheme } from '@/lib/terminalThemes';

interface TerminalHUDProps {
  theme: TerminalTheme;
  themeName: string;
  dust: number;
  corruptionLabel: string;
  corruptionColor: string;
  otherCount: number;
  unlocked: number;
  totalLogs: number;
  visibleCount: number;
}

export default memo(function TerminalHUD({
  theme,
  themeName,
  dust,
  corruptionLabel,
  corruptionColor,
  otherCount,
  unlocked,
  totalLogs,
  visibleCount,
}: TerminalHUDProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#9a8a72]/8 bg-[#0c0a08]/30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-[#c4785a]/60" />
          <div>
            <h1 className="text-[8px] tracking-[0.3em] uppercase font-bold text-[#ddd0bc]/70">
              Bunker_7
            </h1>
            <p className="text-[5px] text-[#9a8a72]/30 tracking-[0.2em] uppercase">
              Archive Terminal
            </p>
          </div>
        </div>
        <div className="h-5 w-px bg-[#9a8a72]/10" />
        <div className="flex items-center gap-3 text-[7px]">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">USER:</span>
          <span className="text-[#ddd0bc]/50 font-mono">0007-A</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[7px]">
        <div className="flex items-center gap-2">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">CATALOG INTEGRITY</span>
          <span className="text-[#7a9a6a]/80 font-mono">72%</span>
          <span className="text-[#7a9a6a]/30 text-[5px] uppercase">[STABLE]</span>
        </div>
        <div className="h-4 w-px bg-[#9a8a72]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">Dust</span>
          <span
            className="font-mono text-[#ddd0bc]/70"
            style={{ color: dust > 75 ? theme.corruption : theme.primary }}
          >
            {dust}%
          </span>
        </div>
        <div className="h-4 w-px bg-[#9a8a72]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">Signal</span>
          <span className="text-[#ddd0bc]/60" style={{ color: corruptionColor }}>
            {corruptionLabel}
          </span>
        </div>
        <div className="h-4 w-px bg-[#9a8a72]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">Other</span>
          <span
            className="font-mono"
            style={{ color: otherCount > 0 ? theme.corruption : theme.dim }}
          >
            {otherCount}
          </span>
        </div>
        <div className="h-4 w-px bg-[#9a8a72]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-[#9a8a72]/30 uppercase tracking-wider">Atlas</span>
          <span className="font-mono text-[#ddd0bc]/50">{visibleCount}</span>
        </div>
        <Link
          href="/"
          className="text-[#9a8a72]/30 hover:text-[#ddd0bc]/60 transition-colors flex items-center gap-1.5 text-[7px] uppercase tracking-wider ml-2"
        >
          <ArrowLeft size={9} /> Atlas
        </Link>
      </div>
    </header>
  );
});