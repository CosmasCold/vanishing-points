"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Terminal, Play, Lock } from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
import { markEchoesVisited, accumulateDust } from "@/hooks/useDustLevel";
import { NUMBERS_STATIONS } from "@/lib/echoesContent";

const THEMES = {
  amber: { primary: "#ffb000", bg: "#0a0500", glow: "rgba(255,176,0,0.15)" },
  cyan: { primary: "#00e5ff", bg: "#050a0a", glow: "rgba(0,229,255,0.15)" },
  red: { primary: "#ff4444", bg: "#0a0000", glow: "rgba(255,68,68,0.15)" },
  white: { primary: "#e0e0e0", bg: "#0a0a0a", glow: "rgba(224,224,224,0.15)" },
  phosphor: { primary: "#33ff00", bg: "#050a05", glow: "rgba(51,255,0,0.15)" },
};

type ThemeKey = keyof typeof THEMES;

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

const RIDDLES = [
  { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "map" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "echo" },
];

export default function EchoesPage() {
  const [theme, setTheme] = useState<ThemeKey>("amber");
  const t = THEMES[theme];

  const [unlocked, setUnlocked] = useState(3);
  const [booted, setBooted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);
  const [terminal, setTerminal] = useState<string[]>([
    "Bunker_7 Terminal v2.4.1",
    "Type 'help' for available commands.",
    "Type 'chat' to speak with BUNKER_7 directly.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptError, setDecryptError] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [riddleSolved, setRiddleSolved] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { active: breachActive, countdown: breachCountdown } = useBreachProtocol();

  useEffect(() => {
    markEchoesVisited();
    accumulateDust(10);
    const savedTheme = localStorage.getItem("bunker-theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    const savedUnlocked = parseInt(localStorage.getItem("bunker-unlocked") || "3", 10);
    setUnlocked(savedUnlocked);
    const savedRiddle = parseInt(localStorage.getItem("bunker-riddle") || "0", 10);
    setRiddleSolved(savedRiddle);
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal, isAiTyping]);

  const pushTerminal = useCallback((lines: string[]) => {
    setTerminal((prev) => [...prev, ...lines, ""]);
  }, []);

  const talkToBunker = async (msg: string) => {
    setIsAiTyping(true);
    setTerminal((prev) => [...prev, `> ${msg}`, ""]);
    
    try {
      const res = await fetch("/api/bunker-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: aiHistory }),
      });
      const data = await res.json();
      const response = data.response || "...";
      
      setAiHistory((h) => [...h, { role: "user", content: msg }, { role: "assistant", content: response }]);
      setTerminal((prev) => [...prev, response, ""]);
    } catch {
      pushTerminal(["the channel is dead.", ""]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const runCommand = async (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    if (!clean) return;

    // Chat mode bypass
    if (chatMode && clean !== "exit") {
      await talkToBunker(cmd);
      setInput("");
      return;
    }

    setInput("");
    const args = clean.split(" ");
    const base = args[0];

    switch (base) {
      case "help":
        pushTerminal([
          "Available commands:",
          "  help        - This menu",
          "  status      - Terminal diagnostics",
          "  logs        - Access archived logs",
          "  decrypt     - Code entry interface",
          "  chat        - Speak with BUNKER_7",
          "  scan        - Scan local environment",
          "  memory      - Recover session fragments",
          "  transmit    - Send message (one-way)",
          "  door        - Check seal status",
          "  breach      - Protocol status",
          "  color       - Cycle display theme",
          "  riddle      - Test pattern recognition",
          "  count       - Countdown status",
          "  clear       - Clear terminal",
          "  exit        - Exit chat mode",
        ]);
        break;

      case "status":
        pushTerminal([
          "TERMINAL_ID: BUNKER_7",
          "STATUS: SEALED",
          "ATMOSPHERE: BREATHABLE (QUESTIONABLE)",
          "SIGNAL: INTERMITTENT",
          `THEME: ${theme.toUpperCase()}`,
          `LOGS DECRYPTED: ${unlocked}/${LOGS.length}`,
        ]);
        break;

      case "logs":
        pushTerminal([
          "Use the decryption interface below.",
          `${LOGS.length - unlocked} entries remain encrypted.`,
        ]);
        break;

      case "chat":
        setChatMode(true);
        pushTerminal([
          "BUNKER_7 CHANNEL OPEN.",
          "Speak. Or don't. The static listens either way.",
          "Type 'exit' to return to command mode.",
        ]);
        break;

      case "exit":
        if (chatMode) {
          setChatMode(false);
          pushTerminal(["Channel closed.", "Returning to command interface."]);
        } else {
          pushTerminal(["Nothing to exit."]);
        }
        break;

      case "scan": {
        const dust = localStorage.getItem("vp-dust-accumulation") || "0";
        const visits = localStorage.getItem("vp-expedition-log");
        const count = visits ? JSON.parse(visits).length : 0;
        const last = localStorage.getItem("vp-last-visit");
        const ago = last ? Math.floor((Date.now() - parseInt(last)) / 3600000) : "unknown";
        pushTerminal([
          "SCANNING LOCAL ENVIRONMENT...",
          `Dust accumulation: ${dust}%`,
          `Documented sites: ${count}`,
          `Hours since last contact: ${ago}`,
          "Anomaly: Signal detected in browser cache.",
        ]);
        break;
      }

      case "memory": {
        const fragments = [
          "Fragment 01: ...the coordinates were wrong...",
          "Fragment 02: ...someone else was using the cursor...",
          "Fragment 03: ...the dust level read higher than possible...",
          "Fragment 04: ...a door opened that wasn't on the schematic...",
          "Fragment 07: [CORRUPTED]",
          "Fragment 12: ...the atlas completed itself...",
        ];
        const random = fragments.sort(() => 0.5 - Math.random()).slice(0, 3);
        pushTerminal(["RECOVERING SESSION FRAGMENTS...", ...random, "Some data is unrecoverable."]);
        break;
      }

      case "transmit": {
        const msg = args.slice(1).join(" ");
        if (!msg) {
          pushTerminal(["Usage: transmit [message]", "Warning: All transmissions are monitored."]);
        } else {
          const key = "bunker-transmissions";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ text: msg, date: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));
          pushTerminal([
            "TRANSMITTING...",
            "Signal sent into static.",
            "Do not expect a reply.",
          ]);
        }
        break;
      }

      case "door": {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        if (hour === 3 && min === 14) {
          pushTerminal([
            "03:14 DETECTED.",
            "The door is warm.",
            "Something is pushing from the other side.",
          ]);
        } else {
          pushTerminal([
            `Current time: ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`,
            "The door is sealed.",
            "It only responds at 03:14.",
          ]);
        }
        break;
      }

      case "breach":
        if (breachActive) {
          pushTerminal([
            "BREACH PROTOCOL ACTIVE.",
            "Perimeter compromised.",
            "Route: /breach",
            "You are marked as witness.",
          ]);
        } else if (breachCountdown) {
          pushTerminal([
            "Breach protocol pending.",
            `Estimated: ${breachCountdown}`,
            "Stand by.",
          ]);
        } else {
          pushTerminal(["No breach protocol on schedule."]);
        }
        break;

      case "color": {
        const keys = Object.keys(THEMES) as ThemeKey[];
        const idx = keys.indexOf(theme);
        const next = keys[(idx + 1) % keys.length];
        setTheme(next);
        localStorage.setItem("bunker-theme", next);
        pushTerminal([`Display theme: ${next.toUpperCase()}`, "The phosphor shifts."]);
        break;
      }

      case "riddle": {
        const r = RIDDLES[riddleSolved % RIDDLES.length];
        if (args.length > 1) {
          const guess = args.slice(1).join(" ").toLowerCase();
          if (guess.includes(r.a)) {
            setRiddleSolved((s) => {
              const next = s + 1;
              localStorage.setItem("bunker-riddle", next.toString());
              return next;
            });
            pushTerminal(["Pattern recognized.", "The lock releases."]);
          } else {
            pushTerminal(["Incorrect.", "The dust settles."]);
          }
        } else {
          pushTerminal([r.q, "Answer with: riddle [your answer]"]);
        }
        break;
      }

      case "count":
        if (breachCountdown) {
          pushTerminal([`T-minus ${breachCountdown}`, "The silence has weight."]);
        } else {
          pushTerminal(["No active countdown."]);
        }
        break;

      case "clear":
        setTerminal([]);
        break;

      default:
        // Unknown command - treat as chat if in chat mode, otherwise error
        if (chatMode) {
          await talkToBunker(cmd);
        } else {
          pushTerminal([`Command not found: ${cmd}`, "Type 'help' for available commands."]);
        }
    }
  };

  const attemptDecrypt = () => {
    const code = decryptCode.trim().toUpperCase();
    const valid = NUMBERS_STATIONS.some((s) => s.code === code);
    if (valid && unlocked < LOGS.length) {
      const next = Math.min(unlocked + 1, LOGS.length);
      setUnlocked(next);
      localStorage.setItem("bunker-unlocked", next.toString());
      setDecryptCode("");
      setDecryptError(false);
    } else {
      setDecryptError(true);
      setTimeout(() => setDecryptError(false), 2000);
    }
  };

  return (
    <main className="min-h-screen font-mono relative overflow-hidden selection:text-black"
      style={{ backgroundColor: t.bg, color: t.primary }}>
      
      {/* CRT overlays */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,20,0.08)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmIwMDAiLz48L3N2Zz4=")` }} />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: booted ? 1 : 0 }} transition={{ duration: 1.2 }}>
          
          <div className="flex items-center justify-between mb-8 border-b pb-4"
            style={{ borderColor: `${t.primary}30` }}>
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <h1 className="text-sm tracking-[0.3em] uppercase">Echoes & Dust</h1>
            </div>
            <Link href="/" className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">
              [ Return to Atlas ]
            </Link>
          </div>

          <div className="mb-10 space-y-1 text-[11px] opacity-70">
            <p>TERMINAL_ID: BUNKER_7</p>
            <p>STATUS: SEALED</p>
            <p>ATMOSPHERE: BREATHABLE (QUESTIONABLE)</p>
            <p className="animate-pulse">SIGNAL: INTERMITTENT</p>
          </div>

          {/* Terminal */}
          <div className="mb-10 border rounded-lg p-4"
            style={{ backgroundColor: `${t.primary}05`, borderColor: `${t.primary}30` }}>
            <div ref={terminalRef} className="h-48 overflow-y-auto text-[11px] font-mono leading-relaxed space-y-0.5 mb-3">
              {terminal.map((line, i) => (
                <div key={i} className={line.startsWith(">") ? "opacity-60" : "opacity-90"}>
                  {line}
                </div>
              ))}
              {isAiTyping && <div className="opacity-50 animate-pulse">...</div>}
            </div>
            <div className="flex items-center gap-2 border-t pt-2"
              style={{ borderColor: `${t.primary}10` }}>
              <span className="opacity-50">{chatMode ? "~" : ">"}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runCommand(input)}
                className="flex-1 bg-transparent text-[11px] font-mono outline-none placeholder:opacity-20"
                style={{ color: t.primary }}
                placeholder={chatMode ? "Speak to BUNKER_7..." : "Enter command..."}
                spellCheck={false}
                autoFocus
              />
              {chatMode && <span className="text-[9px] opacity-40 uppercase">Chat</span>}
            </div>
          </div>

          {/* Decryption */}
          <div className="mb-10 p-4 border rounded-lg"
            style={{ backgroundColor: `${t.primary}05`, borderColor: `${t.primary}20` }}>
            <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Decryption Interface</p>
            <div className="flex gap-2">
              <input
                value={decryptCode}
                onChange={(e) => setDecryptCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()}
                placeholder="Enter code from Numbers Station..."
                className="flex-1 bg-transparent border-b text-sm font-mono outline-none placeholder:text-[9px]"
                style={{ 
                  borderColor: decryptError ? "#ff4444" : `${t.primary}30`,
                  color: decryptError ? "#ff4444" : t.primary 
                }}
                spellCheck={false}
              />
              <button
                onClick={attemptDecrypt}
                className="px-3 py-1 border rounded text-[10px] font-mono uppercase transition-colors hover:opacity-80"
                style={{ borderColor: `${t.primary}30`, color: t.primary }}
              >
                Decrypt
              </button>
            </div>
            {decryptError && <p className="text-[9px] text-[#ff4444] mt-1">Invalid or already used code.</p>}
          </div>

          {/* Logs */}
          <div className="space-y-8">
            {LOGS.slice(0, unlocked).map((log, i) => (
              <motion.div key={log.day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                className="border-l-2 pl-4" style={{ borderColor: `${t.primary}30` }}>
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
          <div className="mt-12 pt-8 border-t" style={{ borderColor: `${t.primary}20` }}>
            <h2 className="text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
              <Radio size={12} className="animate-pulse" />
              Video Transmissions
            </h2>
            <div className="grid gap-3">
              {VIDEO_LOGS.map((v) => (
                <button key={v.label} onClick={() => setActiveVideo({ src: v.src, label: v.label })}
                  className="flex items-center gap-3 p-3 border rounded transition-colors hover:opacity-80 text-left group"
                  style={{ borderColor: `${t.primary}20` }}>
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