"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Terminal, Play, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";

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

export default function EchoesPage() {
  const [unlocked, setUnlocked] = useState(3);
  const [booted, setBooted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-[#050a05] text-[#33ff00] font-mono relative overflow-hidden selection:bg-[#33ff00] selection:text-[#050a05]">
      {/* CRT overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,20,0.08)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,10,0,0.6)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzM2ZmMDAiLz48L3N2Zz4=')]" />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <div className="flex items-center justify-between mb-8 border-b border-[#33ff00]/30 pb-4">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <h1 className="text-sm tracking-[0.3em] uppercase">Echoes & Dust</h1>
            </div>
            <Link
              href="/"
              className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
            >
              [ Return to Atlas ]
            </Link>
          </div>

          <div className="mb-10 space-y-1 text-[11px] opacity-70">
            <p>TERMINAL_ID: BUNKER_7</p>
            <p>STATUS: SEALED</p>
            <p>ATMOSPHERE: BREATHABLE (QUESTIONABLE)</p>
            <p className="animate-pulse">SIGNAL: INTERMITTENT</p>
          </div>

          {/* Logs */}
          <div className="space-y-8">
            {LOGS.slice(0, unlocked).map((log, i) => (
              <motion.div
                key={log.day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="border-l-2 border-[#33ff00]/30 pl-4"
              >
                <p className="text-[10px] tracking-widest opacity-50 mb-1">{log.day}</p>
                <p className="text-sm leading-relaxed opacity-90">{log.text}</p>
              </motion.div>
            ))}

            {unlocked < LOGS.length && (
              <button
                onClick={() => setUnlocked((u) => Math.min(u + 1, LOGS.length))}
                className="flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity border border-[#33ff00]/30 px-3 py-2 rounded hover:bg-[#33ff00]/5"
              >
                <Unlock size={10} />
                Decrypt next entry
              </button>
            )}
          </div>

          {/* Video Transmissions */}
          <div className="mt-12 pt-8 border-t border-[#33ff00]/20">
            <h2 className="text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
              <Radio size={12} className="animate-pulse" />
              Video Transmissions
            </h2>
            
            {VIDEO_LOGS.some((v) => v.src === "/videos/transmission_01.mp4") && (
              <div className="mb-4 p-3 border border-[#33ff00]/20 rounded bg-[#33ff00]/5 text-[10px] opacity-70">
                <p>⚠ Upload your videos to <code className="text-[#33ff00]">/public/videos/</code> or replace the URLs above with Cloudinary links.</p>
              </div>
            )}

            <div className="grid gap-3">
              {VIDEO_LOGS.map((v) => (
                <button
                  key={v.label}
                  onClick={() => setActiveVideo({ src: v.src, label: v.label })}
                  className="flex items-center gap-3 p-3 border border-[#33ff00]/20 rounded hover:bg-[#33ff00]/5 transition-colors group text-left"
                >
                  <Play size={12} className="opacity-50 group-hover:opacity-100" />
                  <div>
                    <p className="text-xs">{v.label}</p>
                    <p className="text-[9px] opacity-50">{v.day}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center opacity-30 text-[9px] tracking-widest">
            <p>THE DUST REMEMBERS EVERYTHING</p>
            <p className="mt-1">DO NOT TRUST THE STATIC</p>
          </div>
        </motion.div>
      </div>

      <VideoModal
        src={activeVideo?.src || ""}
        label={activeVideo?.label || ""}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </main>
  );
}