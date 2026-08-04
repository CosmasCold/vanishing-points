// components/terminal/TerminalSidebar.tsx
'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Lock, Image, Zap, Shield, MessageSquare, Radio, Target,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import type { TerminalTheme } from '@/lib/terminalThemes';
import type { LogEntry } from '@/lib/terminalContent';

export type SideTab = 'logs' | 'decrypt' | 'signal' | 'assets' | 'puzzles' | 'status' | 'wall' | 'leads';

interface TerminalSidebarProps {
  theme: TerminalTheme;
  activeTab: SideTab;
  onSetTab: (tab: SideTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  // Content props
  visibleCount: number;
  unlocked: number;
  totalLogs: number;
  logs: LogEntry[];
  decryptCode: string;
  decryptError: boolean;
  onDecryptCodeChange: (v: string) => void;
  onAttemptDecrypt: () => void;
  assets: string[];
  onOpenGallery: () => void;
  dust: number;
  triangulated: boolean;
  inventoryCount: number;
  totalInventory: number;
  wallMessages: { text: string; date: string }[];
  // External tabs
  signalTab: React.ReactNode;
  leadsPanel: React.ReactNode;
}

const TABS = [
  { id: 'logs' as SideTab, label: 'Logs', icon: BookOpen },
  { id: 'decrypt' as SideTab, label: 'Decrypt', icon: Lock },
  { id: 'assets' as SideTab, label: 'Assets', icon: Image },
  { id: 'puzzles' as SideTab, label: 'Puzzles', icon: Zap },
  { id: 'status' as SideTab, label: 'Status', icon: Shield },
  { id: 'wall' as SideTab, label: 'Wall', icon: MessageSquare },
  { id: 'signal' as SideTab, label: 'Signal', icon: Radio },
  { id: 'leads' as SideTab, label: 'Leads', icon: Target },
];

export default memo(function TerminalSidebar(props: TerminalSidebarProps) {
  const {
    theme, activeTab, onSetTab, collapsed, onToggleCollapse,
    unlocked, totalLogs, logs, decryptCode, decryptError,
    onDecryptCodeChange, onAttemptDecrypt, assets, onOpenGallery,
    dust, triangulated, inventoryCount, totalInventory,
    wallMessages, visibleCount, signalTab, leadsPanel,
  } = props;

  return (
    <div
      className={`fixed right-0 top-0 h-full w-72 bg-[#0c0a08] border-l border-[#9a8a72]/8 transition-transform duration-300 z-30 ${
        collapsed ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <button
        onClick={onToggleCollapse}
        className="absolute -left-4 top-4 w-4 h-8 bg-[#0c0a08] border border-[#9a8a72]/10 border-r-0 rounded-l flex items-center justify-center text-[#9a8a72]/30 hover:text-[#ddd0bc]/60 transition-colors"
      >
        {collapsed ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
      </button>

      <div className="flex overflow-x-auto border-b border-[#9a8a72]/8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSetTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-3 text-[7px] uppercase tracking-[0.15em] transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'border-[#ddd0bc]/50 text-[#ddd0bc]/80'
                : 'border-transparent text-[#9a8a72]/30 hover:text-[#9a8a72]/50'
            }`}
          >
            <tab.icon size={8} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="h-[calc(100%-40px)] overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9a8a72]/15">
        <AnimatePresence mode="wait">
          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Archived Logs</h3>
              {logs.slice(0, unlocked).map((log) => (
                <div key={log.day} className="border-l border-[#9a8a72]/8 pl-2 py-0.5">
                  <p className="text-[6px] tracking-[0.2em] text-[#9a8a72]/25 uppercase font-bold mb-0.5">{log.day}</p>
                  <p className="text-[11px] leading-relaxed text-[#ddd0bc]/60">{log.text}</p>
                </div>
              ))}
              {unlocked < totalLogs && (
                <div className="flex items-center gap-2 text-[7px] text-[#9a8a72]/20 pt-2 border-t border-[#9a8a72]/5">
                  <Lock size={7} />
                  <span className="uppercase tracking-wider">{totalLogs - unlocked} entries encrypted</span>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'decrypt' && (
            <motion.div key="decrypt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Decrypt</h3>
              <p className="text-[8px] text-[#9a8a72]/35 leading-relaxed">Enter codes from the Numbers Station to recover sealed entries.</p>
              <div className="flex gap-2">
                <input
                  value={decryptCode}
                  onChange={(e) => onDecryptCodeChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAttemptDecrypt()}
                  placeholder="ENTER CODE..."
                  spellCheck={false}
                  className="flex-1 bg-transparent border-b border-[#9a8a72]/15 text-xs py-1 placeholder:text-[6px] placeholder:uppercase placeholder:tracking-widest placeholder:text-[#9a8a72]/15 outline-none min-w-0"
                  style={{ borderColor: decryptError ? theme.danger : `${theme.primary}15`, color: decryptError ? theme.danger : theme.primary }}
                />
                <button
                  onClick={onAttemptDecrypt}
                  className="px-3 py-0.5 border border-[#9a8a72]/15 text-[7px] uppercase tracking-wider text-[#ddd0bc]/50 hover:text-[#ddd0bc]/80 hover:bg-[#9a8a72]/5 transition-all"
                >
                  Decrypt
                </button>
              </div>
              {decryptError && <p className="text-[7px] animate-pulse text-[#c4785a]">Invalid code. Access denied.</p>}
            </motion.div>
          )}
          {activeTab === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Assets</h3>
                <button onClick={onOpenGallery} className="text-[6px] uppercase tracking-wider text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 transition-colors flex items-center gap-1">
                  <Image size={7} /> Gallery
                </button>
              </div>
              <div className="text-center text-[7px] text-[#9a8a72]/20 pt-1 uppercase tracking-widest">{assets.length} recovered</div>
            </motion.div>
          )}
          {activeTab === 'puzzles' && (
            <motion.div key="puzzles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
              <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Active Anomalies</h3>
              {[
                { n: '01', title: 'Intercepted Signal', body: 'GUR QBBE BCRAF VAJNEQ', hint: 'cmd: cipher [decoded]' },
                { n: '02', title: 'Coordinate Chain', body: 'cmd: coords [n1] [n2] [n3] [n4]', hint: null },
                { n: '03', title: 'Fragmented Transmission', body: 'cmd: assemble', hint: null },
                { n: '04', title: 'Reflection Lock', body: 'cmd: reflect [answer]', hint: null },
                { n: '05', title: 'Dust Threshold', body: `${dust}% / 50%`, hint: null },
                { n: '06', title: 'Triangulation', body: triangulated ? 'COMPLETE' : 'Find 3 towers', hint: null },
                { n: '07', title: 'Lantern Constellation', body: 'Place 5 lanterns', hint: 'cmd: constellation' },
                { n: '08', title: 'Inventory', body: `${inventoryCount}/${totalInventory}`, hint: 'cmd: inventory' },
              ].map((p) => (
                <div key={p.n} className="p-1.5 border border-[#9a8a72]/5 bg-[#9a8a72]/3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[6px] text-[#9a8a72]/20 font-bold">{p.n}</span>
                    <span className="font-bold text-[7px] uppercase tracking-wider text-[#ddd0bc]/50">{p.title}</span>
                  </div>
                  <p className="text-[8px] text-[#9a8a72]/35 font-mono">{p.body}</p>
                  {p.hint && <p className="text-[6px] text-[#9a8a72]/15 mt-0.5 uppercase tracking-wider">{p.hint}</p>}
                </div>
              ))}
            </motion.div>
          )}
          {activeTab === 'status' && (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Status</h3>
              <div className="space-y-0.5 text-[9px] font-mono text-[#ddd0bc]/50">
                {[
                  ['ID', 'BUNKER_7'],
                  ['STATUS', 'SEALED'],
                  ['THEME', 'ACTIVE'],
                  ['LOGS', `${unlocked}/${totalLogs}`],
                  ['DUST', `${dust}%`],
                  ['ASSETS', `${assets.length}`],
                  ['INVENTORY', `${inventoryCount}`],
                  ['ATLAS', `${visibleCount} visible`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[#9a8a72]/5 pb-0.5">
                    <span className="text-[#9a8a72]/30 text-[7px] uppercase tracking-wider">{k}</span>
                    <span className="text-[#ddd0bc]/40">{v}</span>
                  </div>
                ))}
                <div className="pt-2 text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/15 animate-pulse">Listening...</div>
              </div>
            </motion.div>
          )}
          {activeTab === 'wall' && (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Transmission Wall</h3>
              <p className="text-[7px] text-[#9a8a72]/25">Use <span className="font-mono text-[#9a8a72]/35">transmit [msg]</span> to add a signal.</p>
              {wallMessages.length === 0 ? (
                <p className="text-[9px] text-[#9a8a72]/15 italic">The static is silent.</p>
              ) : (
                <div className="space-y-1.5">
                  {wallMessages.slice(-20).map((m, i) => (
                    <div key={i} className="border-l border-[#9a8a72]/8 pl-2 py-0.5">
                      <p className="text-[10px] text-[#ddd0bc]/50 leading-relaxed">{m.text}</p>
                      <p className="text-[5px] text-[#9a8a72]/15 mt-0.5 font-mono uppercase tracking-wider">{m.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'signal' && (
            <motion.div key="signal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {signalTab}
            </motion.div>
          )}
          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              {leadsPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});