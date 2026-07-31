"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Signal, Lock, Unlock, ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface ThemeColors {
  primary: string;
  dim: string;
  accent: string;
  bg: string;
}

interface Props {
  theme: ThemeColors;
  onPushTerminal?: (lines: string[]) => void;
}

interface Frequency {
  id: string;
  mhz: string;
  name: string;
  place: string;
  color: string;
  dimColor: string;
  lore: string;
  transmissions: {
    type: "code" | "mission" | "clue";
    text: string;
    payload?: string;
  }[];
}

const FREQUENCIES: Frequency[] = [
  {
    id: "duga",
    mhz: "4.50",
    name: "THE HUM",
    place: "Duga Radar Array",
    color: "#88c0d0",
    dimColor: "#4c566a",
    lore: "The Russian Woodpecker. A sharp tapping that interfered with shortwave radios worldwide from 1976 to 1989. It was not a radar. It was a countdown. The structure still stands in the Chernobyl Exclusion Zone, 150 meters of rusting steel cantilevered against the sky.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: WOODPECKER-314", payload: "WOODPECKER-314" },
      { type: "mission", text: "The Woodpecker has shifted frequency. Check Duga Radar Array at 03:14. Bring a radiation badge. The ticks are louder there." },
      { type: "clue", text: "Caesar shift: thirteen rotations. The door opens inward. GUR QBBE BCRAF VAJNEQ." },
    ],
  },
  {
    id: "hashima",
    mhz: "9.18",
    name: "TOWER SEVEN",
    place: "Hashima Island",
    color: "#e8a8a0",
    dimColor: "#8a5048",
    lore: "A numbers station that began broadcasting in 1987 from coordinates matching Hashima Island. The voice is female, calm, and counting down from numbers that have not been invented yet. She has been counting for 39 years.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: CONCRETE-5000", payload: "CONCRETE-5000" },
      { type: "mission", text: "Five thousand people lived on a rock. Now only the concrete remembers. Visit Hashima. Count the windows. Report the number to BUNKER_7." },
      { type: "clue", text: "The concrete that remembers is the same concrete that forgets. The answer is in the apartment count." },
    ],
  },
  {
    id: "aokigahara",
    mhz: "15.60",
    name: "LOST EXPEDITION",
    place: "Aokigahara Forest",
    color: "#c9b18a",
    dimColor: "#6a5a4a",
    lore: "Recovered from the black box of Expedition Team 4. They reached the coordinates. Then they kept walking. This is what they sent back before the forest absorbed the signal.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: SILENCE-91", payload: "SILENCE-91" },
      { type: "mission", text: "Expedition Team 4 walked into Aokigahara with six members. The black box recorded seven voices. Find the seventh. It is not a ghost." },
      { type: "clue", text: "The trees grow in spirals. The silence has weight. When your compass fails, trust the roots. They point inward." },
    ],
  },
  {
    id: "poveglia",
    mhz: "21.00",
    name: "STATIC VEIL",
    place: "Poveglia Island",
    color: "#b8a8d8",
    dimColor: "#6a5a8a",
    lore: "Not a signal. A curtain. The static between stations is not empty. It is full of things that have not happened yet, trying to get through. Poveglia is the thinnest point in the veil.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: PLAGUE-95", payload: "PLAGUE-95" },
      { type: "mission", text: "The tide carries voices. The plague doctors' tower still stands. At Poveglia, record the static at 03:14. The voices form coordinates." },
      { type: "clue", text: "The static shaped itself into a face. It smiled. I smiled back before I could stop myself. Do not smile at the static." },
    ],
  },
];

export default function SignalTab({ theme, onPushTerminal }: Props) {
  const [freqIndex, setFreqIndex] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [locked, setLocked] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<Frequency["transmissions"][0] | null>(null);
  const [typed, setTyped] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [caesarShift, setCaesarShift] = useState(13);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const freq = FREQUENCIES[freqIndex];

  // Signal fluctuation
  useEffect(() => {
    if (locked) return;
    const tick = () => {
      setSignalStrength((prev) => {
        const target = 40 + Math.random() * 50;
        return prev + (target - prev) * 0.2;
      });
    };
    intervalRef.current = setInterval(tick, 600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [freqIndex, locked]);

  const lockSignal = useCallback(() => {
    if (signalStrength < 70) return;
    setLocked(true);
    setDecoding(true);
    setDecoded(null);
    setTyped("");
    setTimeout(() => {
      const tx = freq.transmissions[Math.floor(Math.random() * freq.transmissions.length)];
      setDecoded(tx);
      setDecoding(false);
      setLog((prev) => [
        ...prev,
        `LOCKED ${freq.mhz} MHz // ${freq.name}`,
        `TYPE: ${tx.type.toUpperCase()}`,
        "",
      ]);
    }, 1500 + Math.random() * 1500);
  }, [signalStrength, freq]);

  // Typewriter
  useEffect(() => {
    if (!decoded) return;
    let i = 0;
    setTyped("");
    const timer = setInterval(() => {
      i++;
      setTyped(decoded.text.slice(0, i));
      if (i >= decoded.text.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [decoded]);

  const applyCaesar = (text: string, shift: number) => {
    return text
      .split("")
      .map((c) => {
        if (/[a-zA-Z]/.test(c)) {
          const base = c === c.toUpperCase() ? 65 : 97;
          return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
        }
        return c;
      })
      .join("");
  };

  const sendToTerminal = () => {
    if (!decoded) return;
    const lines = [
      `╔══════════════════════════════════════╗`,
      `║  INTERCEPTED TRANSMISSION            ║`,
      `║  FREQ: ${freq.mhz} MHz — ${freq.name.padEnd(14)}║`,
      `╠══════════════════════════════════════╣`,
      `║  ${decoded.text.slice(0, 36).padEnd(36)}║`,
      decoded.text.length > 36 ? `║  ${decoded.text.slice(36, 72).padEnd(36)}║` : `║  ${" ".repeat(36)}║`,
      `╚══════════════════════════════════════╝`,
    ];
    onPushTerminal?.(lines);
    setLog((prev) => [...prev, "Transcript forwarded to terminal.", ""]);
  };

  return (
    <div className="space-y-4 md:space-y-5 text-[11px] md:text-[13px] font-mono">
      {/* Frequency header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: freq.color }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: freq.color }}>
              {freq.name}
            </p>
            <p className="text-[9px] text-[#5a4e42]">{freq.mhz} MHz // {freq.place}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setFreqIndex((i) => (i - 1 + FREQUENCIES.length) % FREQUENCIES.length);
              setLocked(false);
              setDecoded(null);
            }}
            className="p-1 border border-[#333] rounded hover:border-[#555] text-[#666] transition-colors"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={() => {
              setFreqIndex((i) => (i + 1) % FREQUENCIES.length);
              setLocked(false);
              setDecoded(null);
            }}
            className="p-1 border border-[#333] rounded hover:border-[#555] text-[#666] transition-colors"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Tuner strip */}
      <div className="relative h-10 bg-[#050505] rounded border border-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] text-[#222]">
          {FREQUENCIES.map((f, i) => (
            <span key={f.id} style={{ color: i === freqIndex ? freq.dimColor : undefined }}>
              {f.mhz}
            </span>
          ))}
        </div>
        <motion.div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          animate={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
        <div
          className="absolute top-0 bottom-0 w-16 blur-xl"
          style={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%`, backgroundColor: `${freq.color}15` }}
        />
      </div>

      {/* Signal meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-[#444]">
          <span>Signal Strength</span>
          <span style={{ color: signalStrength > 70 ? freq.color : "#444" }}>
            {signalStrength.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#1a1a1a]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: freq.color }}
            animate={{ width: `${signalStrength}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {!locked && (
          <button
            onClick={lockSignal}
            disabled={signalStrength < 70}
            className="w-full mt-2 py-2 border rounded text-[10px] uppercase tracking-wider transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{ borderColor: signalStrength > 70 ? `${freq.color}40` : "#222", color: signalStrength > 70 ? freq.color : "#444" }}
          >
            {signalStrength < 70 ? "Signal too weak — tune and wait" : "Lock Signal & Decode"}
          </button>
        )}
      </div>

      {/* Lore */}
      <div className="border-l-2 pl-3 py-1" style={{ borderColor: `${freq.color}25` }}>
        <p className="text-[11px] md:text-xs leading-relaxed italic" style={{ color: freq.dimColor }}>
          {freq.lore}
        </p>
      </div>

      {/* Decoded message */}
      <AnimatePresence>
        {decoding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-[#050505] rounded border border-[#1a1a1a] text-center"
          >
            <Zap size={16} className="mx-auto mb-2 animate-pulse" style={{ color: freq.color }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: freq.dimColor }}>
              Acquiring signal...
            </p>
          </motion.div>
        )}

        {decoded && !decoding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-[#050505] border rounded p-3 md:p-4 space-y-3"
            style={{ borderColor: `${freq.color}20` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: freq.dimColor }}>
                {decoded.type} // {freq.mhz}
              </span>
              <button
                onClick={sendToTerminal}
                className="text-[9px] uppercase tracking-wider px-2 py-1 border rounded hover:opacity-80 transition-opacity"
                style={{ borderColor: `${freq.color}30`, color: freq.dimColor }}
              >
                Send to terminal
              </button>
            </div>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: freq.color }}>
              {typed}
              <span className="inline-block w-2 h-4 ml-1 align-middle animate-pulse" style={{ backgroundColor: freq.color }} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decoder tools */}
      <div className="space-y-2 border-t border-[#1a1a1a] pt-3">
        <p className="text-[9px] uppercase tracking-widest text-[#444]">Decoder</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#555]">Caesar shift:</span>
          <input
            type="range"
            min={1}
            max={25}
            value={caesarShift}
            onChange={(e) => setCaesarShift(parseInt(e.target.value))}
            className="flex-1 accent-[#9a8a72]"
          />
          <span className="text-[10px] text-[#777] w-6">{caesarShift}</span>
        </div>
        <div className="p-2 bg-[#050505] rounded border border-[#1a1a1a]">
          <p className="text-[10px] text-[#555] mb-1">GUR QBBE BCRAF VAJNEQ</p>
          <p className="text-xs" style={{ color: freq.color }}>
            {applyCaesar("GUR QBBE BCRAF VAJNEQ", caesarShift)}
          </p>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="space-y-1 border-t border-[#1a1a1a] pt-3">
          <p className="text-[9px] uppercase tracking-widest text-[#444]">Session Log</p>
          {log.map((entry, i) => (
            <p key={i} className="text-[10px] text-[#555]">
              {entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}