// components/terminal/CommandPalette.tsx
'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import type { CommandDef } from '@/lib/terminalContent';

interface CommandPaletteProps {
  open: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onSelect: (cmd: string) => void;
  commands: CommandDef[];
}

export default memo(function CommandPalette({
  open, query, onQueryChange, onClose, onSelect, commands,
}: CommandPaletteProps) {
  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    return c.cmd.includes(q) || c.desc.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-start justify-center pt-16 p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-[#9a8a72]/15 bg-[#0c0a08] rounded shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-[#9a8a72]/8 flex items-center gap-2">
              <HelpCircle size={9} className="text-[#9a8a72]/25" />
              <input
                autoFocus
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Filter commands..."
                className="flex-1 bg-transparent text-[9px] outline-none uppercase tracking-wider text-[#ddd0bc]/70 placeholder:text-[#9a8a72]/15"
              />
              <button onClick={onClose} className="text-[6px] uppercase text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 tracking-wider">esc</button>
            </div>
            <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
              {filtered.map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => onSelect(c.cmd)}
                  className="w-full text-left px-3 py-1.5 text-[8px] hover:bg-[#9a8a72]/5 transition-colors flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold uppercase tracking-wider text-[#ddd0bc]/60">{c.cmd}</span>
                    <span className="text-[#9a8a72]/30 text-[7px]">{c.desc}</span>
                  </div>
                  <span className="text-[#9a8a72]/15 text-[6px] uppercase tracking-widest">{c.category}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-[8px] text-[#9a8a72]/20 py-4 italic">No commands match.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});