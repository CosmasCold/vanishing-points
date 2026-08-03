"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Signal, Zap, Wind, Eye, Skull, ChevronLeft, ChevronRight } from "lucide-react";
import { showToast } from "@/lib/toast";
import { recordOtherEncounter } from "@/lib/bunkerBrain";

interface Frequency {
  id: string;
  mhz: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  dimColor: string;
  glowColor: string;
  messages: string[];
  lore: string;
}

const FREQUENCIES: Frequency[] = [
  {
    id: "the-hum",
    mhz: "4.50",
    name: "THE HUM",
    icon: <Wind size={14} />,
    color: "#9a8a72",
    dimColor: "#7a6e5e",
    glowColor: "rgba(154,138,114,0.12)",
    lore: "First detected in Taos, 1993. The Hum is not a broadcast. It is a place remembering it was once inhabited.",
    messages: [
      "The frequency matches something you have forgotten.",
      "It was never tinnitus. It was a map.",
      "Everyone who hears it for more than 90 seconds... stop. You just passed 90 seconds.",
      "The Hum is loudest at coordinates where no town ever existed, but the roads still remember.",
    ],
  },
  {
    id: "tower-7",
    mhz: "9.18",
    name: "TOWER SEVEN",
    icon: <Zap size={14} />,
    color: "#c4785a",
    dimColor: "#a06048",
    glowColor: "rgba(196,120,90,0.12)",
    lore: "A numbers station that began broadcasting in 1987. The voice is female, calm, and counting down from numbers that haven't been invented yet.",
    messages: [
      "Seven. Niner. Foxtrot. The coordinates are inside you.",
      "She has been counting for 39 years. She will reach zero when the last listener dies.",
      "Do not write the numbers down. The ink becomes warm.",
      "The numbers repeat in sequences that match no known cipher. The voice reads them as if they are obvious.",
      "The voice is not recorded. She is reading live. From where?",
    ],
  },
  {
    id: "lost-expedition",
    mhz: "15.60",
    name: "LOST EXPEDITION",
    icon: <Skull size={14} />,
    color: "#8a7a6a",
    dimColor: "#6a5a4a",
    glowColor: "rgba(138,122,106,0.12)",
    lore: "Recovered from the black box of Expedition Team 4. They reached the coordinates. Then they kept walking. This is what they sent back.",
    messages: [
      "Day 47. The sun rose in the west today. We did not mention it aloud.",
      "If you are hearing this, we are still walking. Please do not follow.",
      "The place we found is not abandoned. It is waiting.",
      "I looked through the binoculars and saw myself looking back. I was waving. I am not waving now.",
      "The dust here tastes like copper and radio static.",
    ],
  },
  {
    id: "static-veil",
    mhz: "21.00",
    name: "STATIC VEIL",
    icon: <Eye size={14} />,
    color: "#c4785a",
    dimColor: "#a06048",
    glowColor: "rgba(196,120,90,0.12)",
    lore: "Not a signal. A curtain. The static between stations is not empty. It is full of things that haven't happened yet, trying to get through.",
    messages: [
      "The white noise is not random. It is every possible conversation, layered.",
      "If you listen long enough, you will hear your own voice. Older. Scared.",
      "We thought the veil was a barrier. It is a membrane. And something is pushing.",
      "The static shaped itself into a question. You knew the answer once.",
      "Frequency 21.00 is not a number. It is a question. The question is: are you still there?",
    ],
  },
];

const DECODE_COST = 2;

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

function spendDust(amount: number): number {
  if (typeof window === "undefined") return 0;
  const current = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
  const next = Math.max(0, current - amount);
  localStorage.setItem("vp-dust-accumulation", next.toString());
  return next;
}

function recordDecode(freqId: string) {
  if (typeof window === "undefined") return;
  const key = "vp-numbers-station-decoded";
  const decoded = JSON.parse(localStorage.getItem(key) || "[]") as string[];
  if (!decoded.includes(freqId)) {
    decoded.push(freqId);
    localStorage.setItem(key, JSON.stringify(decoded));
  }
}

export default function NumbersStation({ compact = false }: { compact?: boolean }) {
  const [freqIndex, setFreqIndex] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedMsg, setDecodedMsg] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");
  const [powerOn, setPowerOn] = useState(true);
  const [dust, setDust] = useState(0);
  const [tick, setTick] = useState(0); // For oscilloscope animation
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  const freq = FREQUENCIES[freqIndex];

  useEffect(() => {
    setDust(getDust());
  }, []);

  // Oscilloscope ticker — client-side only, avoids hydration mismatch
  useEffect(() => {
    const animate = () => {
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fluctuate signal strength
  useEffect(() => {
    if (!powerOn) {
      setSignalStrength(0);
      return;
    }
    const tick = () => {
      setSignalStrength((prev) => {
        const target = 60 + Math.random() * 35;
        const next = prev + (target - prev) * 0.3;
        return Math.min(100, Math.max(0, next));
      });
    };
    intervalRef.current = setInterval(tick, 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [freqIndex, powerOn]);

  // Typewriter effect for decoded messages
  useEffect(() => {
    if (!decodedMsg) {
      setTypedText("");
      return;
    }
    let i = 0;
    setTypedText("");
    const timer = setInterval(() => {
      i++;
      setTypedText(decodedMsg.slice(0, i));
      if (i >= decodedMsg.length) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [decodedMsg]);

  const decode = useCallback(() => {
    if (!powerOn) return;
    const currentDust = getDust();
    if (currentDust < DECODE_COST) {
      showToast(`Insufficient dust. Decoding requires ${DECODE_COST}% contamination. You carry ${currentDust}%.`, "warning");
      return;
    }

    const nextDust = spendDust(DECODE_COST);
    setDust(nextDust);
    recordDecode(freq.id);
    recordOtherEncounter();

    setIsDecoding(true);
    setDecodedMsg(null);
    setTimeout(() => {
      const msg = freq.messages[Math.floor(Math.random() * freq.messages.length)];
      setDecodedMsg(msg);
      setIsDecoding(false);
    }, 1500 + Math.random() * 1500);
  }, [freq, powerOn]);

  const nextFreq = () => {
    setFreqIndex((i) => (i + 1) % FREQUENCIES.length);
    setDecodedMsg(null);
    setTypedText("");
  };

  const prevFreq = () => {
    setFreqIndex((i) => (i - 1 + FREQUENCIES.length) % FREQUENCIES.length);
    setDecodedMsg(null);
    setTypedText("");
  };

  // Oscilloscope path generator — uses tick state, not Date.now()
  const oscilloscopePath = (frameOffset: number) => {
    const points = Array.from({ length: 20 }, (_, i) => {
      const x = (i + 1) * 5;
      const y = 32 + Math.sin(i * 0.8 + tick * 0.05 + frameOffset) * (signalStrength / 3) * (isDecoding ? 1.5 : 0.8);
      return `L${x}%,${y}`;
    }).join(" ");
    return `M0,${32 + Math.sin(tick * 0.05 + frameOffset) * 5} ${points}`;
  };

  if (compact) {
    return (
      <div className="relative z-40">
        <button
          onClick={() => setPowerOn(!powerOn)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 border"
          style={{
            background: "rgba(18,14,10,0.8)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(154,138,114,0.2)",
            color: powerOn ? "#9a8a72" : "#5a4e42",
          }}
        >
          <Radio size={12} className={powerOn ? "animate-pulse" : "opacity-30"} />
          <span>Numbers Station</span>
          <Signal size={10} className={powerOn ? "" : "opacity-20"} style={{ color: powerOn ? "#9a8a72" : "#5a4e42" }} />
        </button>

        <AnimatePresence>
          {powerOn && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              className="absolute top-full left-0 mt-2 w-72 rounded-lg shadow-2xl overflow-hidden border"
              style={{
                background: "rgba(12,10,8,0.96)",
                borderColor: "rgba(154,138,114,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: freq.color }}>{freq.icon}</span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: freq.color }}>
                        {freq.name}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: "#5a4e42" }}>{freq.mhz} MHz</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={prevFreq} className="p-1 rounded transition-colors" style={{ color: freq.dimColor }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(122,107,82,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><ChevronLeft size={12} /></button>
                    <button onClick={nextFreq} className="p-1 rounded transition-colors" style={{ color: freq.dimColor }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(122,107,82,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><ChevronRight size={12} /></button>
                  </div>
                </div>

                {/* Signal bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(90,78,66,0.2)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: freq.color }}
                    animate={{ width: `${signalStrength}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <button
                  onClick={decode}
                  disabled={isDecoding}
                  className="w-full py-2 border rounded text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30"
                  style={{ borderColor: `${freq.color}30`, color: freq.color }}
                >
                  {isDecoding ? "Acquiring signal..." : `Decode (${DECODE_COST}% dust)`}
                </button>

                <AnimatePresence>
                  {typedText && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-mono leading-relaxed"
                      style={{ color: freq.dimColor }}
                    >
                      {typedText}
                      <span className="inline-block w-1.5 h-3 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: freq.color }} />
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── FULL VERSION (Terminal) ───
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          background: "rgba(12,10,8,0.95)",
          borderColor: "rgba(122,107,82,0.15)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header / Tuning display */}
        <div className="relative p-4 md:p-6 border-b" style={{ borderColor: "rgba(122,107,82,0.1)" }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${freq.color} 2px, ${freq.color} 4px)`
          }} />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border flex items-center justify-center"
                style={{ borderColor: `${freq.color}30`, color: freq.color }}
              >
                <Radio size={18} />
              </div>
              <div>
                <h2 className="font-cinzel text-lg md:text-xl tracking-wide" style={{ color: freq.color }}>
                  {freq.name}
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "#5a4e42" }}>
                  Shortwave Numbers Station // {freq.mhz} MHz
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPowerOn(!powerOn)}
                className="w-8 h-8 rounded-full border flex items-center justify-center transition-all"
                style={{
                  borderColor: powerOn ? `${freq.color}30` : "rgba(90,78,66,0.2)",
                  color: powerOn ? freq.color : "#5a4e42",
                }}
              >
                <Zap size={14} />
              </button>
              <div className="flex gap-1">
                <button onClick={prevFreq} className="px-2 py-1 border rounded transition-colors" style={{ borderColor: "rgba(122,107,82,0.15)", color: "#5a4e42" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(122,107,82,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)"; }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={nextFreq} className="px-2 py-1 border rounded transition-colors" style={{ borderColor: "rgba(122,107,82,0.15)", color: "#5a4e42" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(122,107,82,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)"; }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Frequency strip */}
          <div className="relative mt-4 h-8 rounded border overflow-hidden" style={{ background: "rgba(8,6,4,0.8)", borderColor: "rgba(122,107,82,0.1)" }}>
            <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] font-mono" style={{ color: "#3a2e22" }}>
              {FREQUENCIES.map((f, i) => (
                <span key={f.id} className={i === freqIndex ? "font-bold" : ""} style={{ color: i === freqIndex ? freq.dimColor : undefined }}>
                  {f.mhz}
                </span>
              ))}
            </div>
            <motion.div
              className="absolute top-0 bottom-0 w-px"
              style={{ background: "rgba(154,138,114,0.2)" }}
              animate={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
            <div
              className="absolute top-0 bottom-0 w-12 blur-xl"
              style={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%`, backgroundColor: freq.glowColor }}
            />
          </div>
        </div>

        {/* Main body */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Signal meter + tuning eye row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Signal strength */}
            <div className="md:col-span-1 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#3a2e22" }}>Signal Strength</p>
              <div className="h-32 rounded border relative overflow-hidden" style={{ background: "rgba(8,6,4,0.8)", borderColor: "rgba(122,107,82,0.1)" }}>
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${signalStrength}%`, background: "rgba(18,14,10,0.8)", transition: "height 0.4s ease" }}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: freq.color, opacity: 0.5 }} />
                </div>
                {[25, 50, 75].map((mark) => (
                  <div key={mark} className="absolute left-0 right-0 h-px" style={{ bottom: `${mark}%`, background: "rgba(122,107,82,0.08)" }} />
                ))}
              </div>
              <p className="text-right text-[10px] font-mono" style={{ color: freq.dimColor }}>
                {signalStrength.toFixed(1)}%
              </p>
            </div>

            {/* Tuning eye (oscilloscope) */}
            <div className="md:col-span-2 rounded border relative overflow-hidden h-32 md:h-auto" style={{ background: "rgba(8,6,4,0.8)", borderColor: "rgba(122,107,82,0.1)" }}>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d={oscilloscopePath(0)}
                  fill="none"
                  stroke={freq.color}
                  strokeWidth="1.5"
                  opacity="0.6"
                  style={{ filter: `drop-shadow(0 0 4px ${freq.glowColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full border opacity-10" style={{ borderColor: freq.color }} />
                <div className="absolute w-16 h-16 rounded-full border opacity-10" style={{ borderColor: freq.color }} />
              </div>
              {isDecoding && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono animate-pulse" style={{ color: freq.dimColor }}>
                    ACQUIRING...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lore text */}
          <div className="border-l-2 pl-4 py-1" style={{ borderColor: `${freq.color}20` }}>
            <p className="text-xs md:text-sm font-mono leading-relaxed italic" style={{ color: freq.dimColor }}>
              {freq.lore}
            </p>
          </div>

          {/* Decode button */}
          <button
            onClick={decode}
            disabled={isDecoding || !powerOn}
            className="w-full py-3 md:py-4 border rounded-lg font-mono uppercase tracking-[0.2em] text-[11px] md:text-xs transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed relative overflow-hidden"
            style={{ borderColor: `${freq.color}30`, color: freq.color }}
          >
            <span className="relative z-10">
              {isDecoding ? "Scanning bands..." : `Initiate Decryption Sequence (${DECODE_COST}% dust)`}
            </span>
            {isDecoding && (
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{ backgroundColor: freq.color }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              />
            )}
          </button>

          {/* Decoded message */}
          <AnimatePresence mode="wait">
            {typedText && (
              <motion.div
                key={freq.id + decodedMsg}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg p-4 md:p-5 relative overflow-hidden border"
                style={{ background: "rgba(8,6,4,0.8)", borderColor: "rgba(122,107,82,0.1)" }}
              >
                <div className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: freq.dimColor }}>
                  DECODED // {freq.mhz}
                </div>
                <p className="text-sm md:text-base font-mono leading-relaxed mt-4" style={{ color: freq.color }}>
                  {typedText}
                  <span className="inline-block w-2 h-4 ml-1 align-middle animate-pulse" style={{ backgroundColor: freq.color }} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}