"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Terminal, Play, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
import { markEchoesVisited, accumulateDust } from "@/hooks/useDustLevel";

const LOGS = [
  {
    day: "DAY 001",
    text: "I am recording this because the silence has become too loud. The world above is not responding. I am cataloging what remains.",
    lock: false,
  },
  {
    day: "DAY 004",
    text: "The dust here is not ordinary dust. It carries weight. Memory. I have started calling it Echoes — it repeats things back to me that I never said.",
    lock: false,
  },
  {
    day: "DAY 012",
    text: "Something happened outside. The feeds went dark at 03:14. I heard a broadcast in a language I almost understood. Then static. Then breathing.",
    lock: false,
  },
  {
    day: "DAY 023",
    text: "I found a door in the bunker that was not on the schematic. It opens inward. The air that came out was warm, like exhalation.",
    lock: true,
  },
  {
    day: "DAY 045",
    text: "The walls are breathing. I am not alone down here. The atlas was never meant to map abandoned places. It was meant to keep them contained.",
    lock: true,
  },
  {
    day: "DAY ???",
    text: "If you are reading this, you have already been inside long enough. Check your reflection. Check it again. The dust settles in patterns.",
    lock: true,
  },
];

// ============================================
// REPLACE THESE WITH YOUR ACTUAL VIDEO URLs
// ============================================
// Option A (local):     src: "/videos/transmission_01.mp4"
// Option B (Cloudinary): src: "https://res.cloudinary.com/.../video.mp4"
// Option C (YouTube):    NOT RECOMMENDED for this player — use direct MP4 only
// ============================================
const VIDEO_LOGS = [
  { label: "TRANSMISSION_01.mxf", day: "DAY 001", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346749/Tape_01__The_Signal_I_Found_f1zhoh.mp4" },
  { label: "TRANSMISSION_04.mxf", day: "DAY 004", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346872/Tape_02__The_Blackout_jpq8cv.mp4" },
  { label: "STATIC_BURST.mxf", day: "DAY 012", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346948/The_Corridor_of_Echoes_pvfyll.mp4" },
];

const COMMANDS: Record<string, string> = {
  help: "Available commands: help, status, logs, codes, atlas, transmit, clear",
  status: "TERMINAL_ID: BUNKER_7\nSTATUS: SEALED\nATMOSPHERE: BREATHABLE (QUESTIONABLE)\nSIGNAL: INTERMITTENT",
  logs: "Use the decrypt interface below to access archived logs.",
  codes: "Tune the Numbers Station on the atlas to acquire decryption codes.",
  atlas: "The atlas is a containment grid. Do not trust the coordinates near the reactor.",
  transmit: "All outgoing transmissions are monitored. The dust reads everything.",
  clear: "",
};

export default function EchoesPage() {
  const [unlocked, setUnlocked] = useState(3);
  const [booted, setBooted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);
  const [terminal, setTerminal] = useState<string[]>([
    "Bunker_7 Terminal v2.4.1",
    "Type 'help' for available commands.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptError, setDecryptError] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markEchoesVisited();
    accumulateDust(10);
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal]);

  const runCommand = (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    const response = COMMANDS[clean] || `Command not found: ${cmd}`;
    setTerminal((prev) => [...prev, `> ${cmd}`, response, ""]);
    setInput("");
  };

  const attemptDecrypt = () => {
    const code = decryptCode.trim().toUpperCase();
    const valid = NUMBERS_STATIONS.some((s) => s.code === code);
    if (valid && unlocked < LOGS.length) {
      setUnlocked((u) => Math.min(u + 1, LOGS.length));
      setDecryptCode("");
      setDecryptError(false);
    } else {
      setDecryptError(true);
      setTimeout(() => setDecryptError(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#050a05] text-[#33ff00] font-mono relative overflow-hidden selection:bg-[#33ff00] selection:text-[#050a05]">
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,20,0.08)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,10,0,0.6)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzM2ZmMDAiLz48L3N2Zz4=')]" />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: booted ? 1 : 0 }} transition={{ duration: 1.2 }}>
          <div className="flex items-center justify-between mb-8 border-b border-[#33ff00]/30 pb-4">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <h1 className="text-sm tracking-[0.3em] uppercase">Echoes & Dust</h1>
            </div>
            <Link href="/" className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">[ Return to Atlas ]</Link>
          </div>

          <div className="mb-10 space-y-1 text-[11px] opacity-70">
            <p>TERMINAL_ID: BUNKER_7</p>
            <p>STATUS: SEALED</p>
            <p>ATMOSPHERE: BREATHABLE (QUESTIONABLE)</p>
            <p className="animate-pulse">SIGNAL: INTERMITTENT</p>
          </div>

          {/* Terminal */}
          <div className="mb-10 border border-[#33ff00]/20 rounded-lg bg-[#0a0f0a] p-4">
            <div ref={terminalRef} className="h-40 overflow-y-auto text-[11px] font-mono leading-relaxed space-y-0.5 mb-3">
              {terminal.map((line, i) => (
                <div key={i} className={line.startsWith(">") ? "text-[#33ff00]/60" : "text-[#33ff00]/80"}>
                  {line}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-[#33ff00]/10 pt-2">
              <span className="text-[#33ff00]/50">{">"}</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runCommand(input)}
                className="flex-1 bg-transparent text-[11px] font-mono text-[#33ff00] outline-none placeholder:text-[#33ff00]/20"
                placeholder="Enter command..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Decryption */}
          <div className="mb-10 p-4 border border-[#33ff00]/20 rounded-lg bg-[#0a0f0a]">
            <p className="text-[10px] uppercase tracking-widest text-[#33ff00]/50 mb-3">Decryption Interface</p>
            <div className="flex gap-2">
              <input
                value={decryptCode}
                onChange={(e) => setDecryptCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()}
                placeholder="Enter code from Numbers Station..."
                className={`flex-1 bg-transparent border-b text-sm font-mono outline-none placeholder:text-[9px] ${
                  decryptError ? "border-[#7a3a2a] text-[#7a3a2a]" : "border-[#33ff00]/30 text-[#33ff00]"
                }`}
                spellCheck={false}
              />
              <button
                onClick={attemptDecrypt}
                className="px-3 py-1 border border-[#33ff00]/30 rounded text-[10px] font-mono uppercase text-[#33ff00] hover:bg-[#33ff00]/10 transition-colors"
              >
                Decrypt
              </button>
            </div>
            {decryptError && <p className="text-[9px] text-[#7a3a2a] mt-1">Invalid or already used code.</p>}
          </div>

          {/* Logs */}
          <div className="space-y-8">
            {LOGS.slice(0, unlocked).map((log, i) => (
              <motion.div key={log.day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="border-l-2 border-[#33ff00]/30 pl-4">
                <p className="text-[10px] tracking-widest opacity-50 mb-1">{log.day}</p>
                <p className="text-sm leading-relaxed opacity-90">{log.text}</p>
              </motion.div>
            ))}

            {unlocked < LOGS.length && (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-50">
                <Lock size={10} />
                {LOGS.length - unlocked} entries encrypted
              </div>
            )}
          </div>

          {/* Video Logs */}
          <div className="mt-12 pt-8 border-t border-[#33ff00]/20">
            <h2 className="text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
              <Radio size={12} className="animate-pulse" />
              Video Transmissions
            </h2>
            <div className="grid gap-3">
              {VIDEO_LOGS.map((v) => (
                <button key={v.label} onClick={() => setActiveVideo({ src: v.src, label: v.label })} className="flex items-center gap-3 p-3 border border-[#33ff00]/20 rounded hover:bg-[#33ff00]/5 transition-colors group text-left">
                  <Play size={12} className="opacity-50 group-hover:opacity-100" />
                  <div>
                    <p className="text-xs">{v.label}</p>
                    <p className="text-[9px] opacity-50">{v.day}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center opacity-30 text-[9px] tracking-widest">
            <p>THE DUST REMEMBERS EVERYTHING</p>
            <p className="mt-1">DO NOT TRUST THE STATIC</p>
          </div>
        </motion.div>
      </div>

      <VideoModal src={activeVideo?.src || ""} label={activeVideo?.label || ""} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
    </main>
  );
}