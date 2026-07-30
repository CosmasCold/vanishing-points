"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Terminal, Play, Lock, Unlock, Image, BookOpen, Shield, Zap, HelpCircle, X } from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
import AssetGallery from "@/components/AssetGallery";
import { markEchoesVisited, accumulateDust } from "@/hooks/useDustLevel";
import { useBreachProtocol } from "@/hooks/useBreachProtocol";
import { useTerminalGhost } from "@/hooks/useTerminalGhost";
import { NUMBERS_STATIONS } from "@/lib/echoesContent";
import {
  checkCaesar,
  checkCoordinates,
  checkAssembly,
  checkReflection,
  COORDINATE_FRAGMENTS,
  ASSEMBLED_MESSAGE,
  DUST_THRESHOLD,
  TRIGGER_PHRASE,
  getCodeEntry,
  redeemCode,
  getRedeemedCodes,
  getUnlockedAssets,
  STORY_ASSETS,
  REDEEMABLE_CODES,
  unlockAsset,
} from "@/lib/assets";

const THEMES = {
  amber: { primary: "#ffb000", bg: "#0a0500", glow: "rgba(255,176,0,0.15)" },
  cyan: { primary: "#00e5ff", bg: "#050a0a", glow: "rgba(0,229,255,0.15)" },
  red: { primary: "#ff4444", bg: "#0a0000", glow: "rgba(255,68,68,0.15)" },
  white: { primary: "#e0e0e0", bg: "#0a0a0a", glow: "rgba(224,224,224,0.15)" },
  phosphor: { primary: "#33ff00", bg: "#050a05", glow: "rgba(51,255,0,0.15)" },
};

type ThemeKey = keyof typeof THEMES;
type SideTab = "logs" | "decrypt" | "assets" | "puzzles" | "status";

const LOGS = [
  { day: "DAY 001", text: "I am recording this because the silence has become too loud. The world above is not responding. I am cataloging what remains.", lock: false },
  { day: "DAY 004", text: "The dust here is not ordinary dust. It carries weight. Memory. I have started calling it Echoes — it repeats things back to me that I never said.", lock: false },
  { day: "DAY 012", text: "Something happened outside. The feeds went dark at 03:14. I heard a broadcast in a language I almost understood. Then static. Then breathing.", lock: false },
  { day: "DAY 023", text: "I found a door in the bunker that was not on the schematic. It opens inward. The air that came out was warm, like exhalation. 3 degrees off the schematic.", lock: true },
  { day: "DAY 045", text: "The walls are breathing. I am not alone down here. The atlas was never meant to map abandoned places. It was meant to keep them contained.", lock: true },
  { day: "DAY ???", text: "If you are reading this, you have already been inside long enough. Check your reflection. Check it again. The dust settles in patterns.", lock: true },
];

const VIDEO_LOGS = [
  { label: "TRANSMISSION_01.mxf", day: "DAY 001", src: "/videos/transmission_01.mp4" },
  { label: "TRANSMISSION_04.mxf", day: "DAY 004", src: "/videos/transmission_04.mp4" },
  { label: "STATIC_BURST.mxf", day: "DAY 012", src: "/videos/static_burst.mp4" },
];

export default function EchoesPage() {
  const [theme, setTheme] = useState<ThemeKey>("amber");
  const t = THEMES[theme];

  const [unlocked, setUnlocked] = useState(3);
  const [booted, setBooted] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);
  const [terminal, setTerminal] = useState<string[]>([
    "╔════════════════════════════════════════╗",
    "║     BUNKER_7 TERMINAL v2.4.1           ║",
    "╠════════════════════════════════════════╣",
    "║  Type 'help' for command list          ║",
    "║  Type 'chat' to speak with BUNKER_7   ║",
    "║  Type 'puzzles' for active anomalies   ║",
    "╚════════════════════════════════════════╝",
    "",
  ]);
  const [input, setInput] = useState("");
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptError, setDecryptError] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [triangulated, setTriangulated] = useState(false);
  const [activeTab, setActiveTab] = useState<SideTab>("logs");
  const [videoPanelOpen, setVideoPanelOpen] = useState(false);
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
    const savedTri = localStorage.getItem("bunker-triangulated") === "true";
    setTriangulated(savedTri);
    const t = setTimeout(() => setBooted(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal, isAiTyping]);

  useTerminalGhost((line) => {
    if (!chatMode && !input) {
      setTerminal((prev) => [...prev, line, ""]);
    }
  });

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
      setAiHistory((h) => [...h.slice(-10), { role: "user", content: msg }, { role: "assistant", content: response }]);
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
          "┌────────────────────────────────────────┐",
          "│ AVAILABLE COMMANDS                     │",
          "├────────────────────────────────────────┤",
          "│  help        Command list              │",
          "│  chat        Speak with BUNKER_7       │",
          "│  status      System diagnostics        │",
          "│  logs        View archived logs        │",
          "│  decrypt     Code entry interface      │",
          "│  scan        Environment scan          │",
          "│  memory      Recover fragments         │",
          "│  transmit    Send message              │",
          "│  door        Seal status               │",
          "│  breach      Protocol status           │",
          "│  color       Cycle theme               │",
          "│  puzzles     Active anomalies          │",
          "│  cipher      Decode signal             │",
          "│  coords      Enter coordinates         │",
          "│  assemble    Reconstruct transmission  │",
          "│  reflect     Answer reflection         │",
          "│  redeem      Redeem unlock code        │",
          "│  gallery     View recovered assets     │",
          "│  collection  Collection status         │",
          "│  cache       Time-locked files         │",
          "│  triangulate Tower status              │",
          "│  profile     Your corruption profile   │",
          "│  clear       Clear terminal            │",
          "│  exit        Exit chat mode            │",
          "└────────────────────────────────────────┘",
        ]);
        break;

      case "status":
        pushTerminal([
          "┌─ TERMINAL DIAGNOSTICS ───────────────┐",
          `│  ID:        BUNKER_7                 │`,
          `│  STATUS:    SEALED                   │`,
          `│  ATMOSPHERE: BREATHABLE (QUESTIONABLE)│`,
          `│  SIGNAL:    INTERMITTENT             │`,
          `│  THEME:     ${theme.toUpperCase().padEnd(17)}│`,
          `│  LOGS:      ${unlocked}/${LOGS.length} UNLOCKED${" ".repeat(12 - String(unlocked).length - String(LOGS.length).length)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;

      case "logs":
        setActiveTab("logs");
        pushTerminal(["Opening LOGS window...", `${LOGS.length - unlocked} entries remain encrypted.`]);
        break;

      case "chat":
        setChatMode(true);
        pushTerminal([
          "╔══════════════════════════════════════╗",
          "║  BUNKER_7 CHANNEL OPEN               ║",
          "╠══════════════════════════════════════╣",
          "║  Speak. The static listens either way║",
          "║  Type 'exit' to return               ║",
          "╚══════════════════════════════════════╝",
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
        const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
        const visits = localStorage.getItem("vp-expedition-log");
        const count = visits ? JSON.parse(visits).length : 0;
        const last = localStorage.getItem("vp-last-visit");
        const ago = last ? Math.floor((Date.now() - parseInt(last)) / 3600000) : "unknown";
        const fragments = JSON.parse(localStorage.getItem("bunker-fragments") || "[]");
        pushTerminal([
          "┌─ ENVIRONMENT SCAN ───────────────────┐",
          `│  Dust accumulation: ${String(dust).padEnd(3)}%           │`,
          `│  Documented sites:  ${String(count).padEnd(3)}           │`,
          `│  Hours since contact: ${String(ago).padEnd(10)}      │`,
          `│  Fragments:         ${String(fragments.length).padEnd(3)}           │`,
          dust > DUST_THRESHOLD ? "│  [!] DUST LEVELS CRITICAL            │" : "│  Dust levels nominal                 │",
          "└──────────────────────────────────────┘",
        ]);
        break;
      }

      case "memory": {
        const allFrags = [
          "FRAG_01: ...the coordinates were wrong...",
          "FRAG_02: ...someone else was using the cursor...",
          "FRAG_03: ...the dust level read higher than possible...",
          "FRAG_04: ...a door opened that wasn't on the schematic...",
          "FRAG_05: ...the atlas updated itself at 03:14...",
          "FRAG_06: ...i heard typing from the next terminal...",
          "FRAG_07: [CORRUPTED]",
          "FRAG_08: ...the green light pulsed in morse code...",
          "FRAG_09: ...a photograph with no negative...",
          "FRAG_10: ...the silence had a rhythm...",
          "FRAG_11: ...coordinates pointing to the ocean floor...",
          "FRAG_12: ...the atlas completed itself...",
          "FRAG_13: ...a voice that sounded like mine...",
          "FRAG_14: ...the dust spelled a name i recognized...",
        ];
        const saved = JSON.parse(localStorage.getItem("bunker-fragments") || "[]");
        const newFrags = allFrags.filter((f: string) => !saved.includes(f.split(":")[0]));
        if (newFrags.length > 0) {
          const pick = newFrags[Math.floor(Math.random() * newFrags.length)];
          const id = pick.split(":")[0];
          saved.push(id);
          localStorage.setItem("bunker-fragments", JSON.stringify(saved));
          pushTerminal(["RECOVERING FRAGMENT...", pick, "Stored."]);
        } else {
          pushTerminal(["No new fragments.", "Visit more ruins."]);
        }
        break;
      }

      case "transmit": {
        const msg = args.slice(1).join(" ");
        if (!msg) {
          pushTerminal(["Usage: transmit [message]", "All transmissions monitored."]);
        } else {
          const key = "bunker-transmissions";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ text: msg, date: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));
          if (msg.toLowerCase().replace(/[^a-z]/g, "") === TRIGGER_PHRASE.replace(/[^a-z]/g, "")) {
            pushTerminal([
              "TRANSMITTING...",
              "SIGNAL INTERCEPTED BY UNKNOWN SOURCE.",
              "RESPONSE: 'We know you're still there.'",
              "The channel is no longer one-way.",
            ]);
          } else {
            pushTerminal(["TRANSMITTING...", "Signal sent into static."]);
          }
        }
        break;
      }

      case "door": {
        const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        if (hour === 3 && min === 14) {
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  03:14 DETECTED                      ║",
            "║  The door is warm.                     ║",
            "║  Something pushes from the other side. ║",
            "╚══════════════════════════════════════╝",
          ]);
        } else if (dust > DUST_THRESHOLD) {
          pushTerminal([
            `Dust level: ${dust}%. Threshold exceeded.`,
            "The door recognizes you.",
            "It opens inward. Not out.",
            "You could enter. But you won't come back the same.",
          ]);
        } else {
          pushTerminal([
            `Time: ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`,
            `Dust: ${dust}%. Insufficient.`,
            "The door is sealed.",
            "It responds at 03:14 or to the dust-claimed.",
          ]);
        }
        break;
      }

      case "breach":
        if (breachActive) {
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  BREACH PROTOCOL ACTIVE              ║",
            "║  Perimeter compromised.              ║",
            "║  Route: /breach                        ║",
            "║  You are marked as witness.            ║",
            "╚══════════════════════════════════════╝",
          ]);
        } else if (breachCountdown) {
          pushTerminal(["Breach pending.", `Estimated: ${breachCountdown}`, "Stand by."]);
        } else {
          pushTerminal(["No breach on schedule."]);
        }
        break;

      case "color": {
        const keys = Object.keys(THEMES) as ThemeKey[];
        const idx = keys.indexOf(theme);
        const next = keys[(idx + 1) % keys.length];
        setTheme(next);
        localStorage.setItem("bunker-theme", next);
        pushTerminal([`Theme: ${next.toUpperCase()}`, "The phosphor shifts."]);
        break;
      }

      case "puzzles":
        setActiveTab("puzzles");
        pushTerminal([
          "Opening PUZZLES window...",
          "8 active anomalies detected.",
        ]);
        break;

      case "cipher": {
        const ans = args.slice(1).join(" ");
        if (!ans) {
          pushTerminal(["Usage: cipher [text]", "Intercepted: GUR QBBE BCRAF VAJNEQ"]);
        } else if (checkCaesar(ans)) {
          pushTerminal([
            "DECRYPTION SUCCESSFUL.",
            "THE DOOR OPENS INWARD.",
            "CODE: INWARD",
          ]);
        } else {
          pushTerminal(["DECRYPTION FAILED."]);
        }
        break;
      }

      case "coords": {
        const nums = args.slice(1).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
        if (nums.length !== 4) {
          pushTerminal([
            "Usage: coords [n1] [n2] [n3] [n4]",
            ...COORDINATE_FRAGMENTS.map((f) => `  ${f.source}: ${f.text}`),
          ]);
        } else if (checkCoordinates(nums)) {
          pushTerminal([
            "COORDINATES VERIFIED.",
            "38°74' N — impossible location.",
            "CODE: BREATHE",
          ]);
        } else {
          pushTerminal(["COORDINATES REJECTED.", `Entered: ${nums.join(", ")}`]);
        }
        break;
      }

      case "assemble": {
        const frags = JSON.parse(localStorage.getItem("bunker-fragments") || "[]");
        if (checkAssembly(frags)) {
          pushTerminal([
            "ASSEMBLY COMPLETE.",
            ...ASSEMBLED_MESSAGE.split(". ").map((s: string) => s.trim() + "."),
            "CODE: ASSEMBLY-314",
          ]);
        } else {
          pushTerminal([
            `Fragments: ${frags.length}/5`,
            "Missing: " + ["FRAG_01", "FRAG_03", "FRAG_07", "FRAG_12", "FRAG_14"].filter((f) => !frags.includes(f)).join(", "),
          ]);
        }
        break;
      }

      case "reflect": {
        const ans = args.slice(1).join(" ").toLowerCase().replace(/[^a-z]/g, "");
        if (!ans) {
          pushTerminal(["Usage: reflect [answer]", "What do you see?"]);
        } else if (checkReflection(ans)) {
          pushTerminal([
            "REFLECTION CONFIRMED.",
            "You see what I see. Unfortunate.",
            "CODE: MIRROR",
          ]);
        } else {
          pushTerminal(["REFLECTION MISMATCH."]);
        }
        break;
      }

      case "redeem": {
        const code = args.slice(1).join(" ").toUpperCase();
        if (!code) {
          pushTerminal(["Usage: redeem [CODE]"]);
        } else {
          const entry = getCodeEntry(code);
          if (!entry) {
            pushTerminal(["INVALID CODE."]);
          } else if (!redeemCode(code)) {
            pushTerminal(["ALREADY REDEEMED.", entry.description]);
          } else {
            if (entry.type === "asset") {
              unlockAsset(entry.rewardId);
              const asset = STORY_ASSETS.find((a) => a.id === entry.rewardId);
              pushTerminal([
                "CODE ACCEPTED.",
                `Recovered: ${asset?.title || entry.rewardId}`,
                `Rarity: ${asset?.rarity.toUpperCase() || "UNKNOWN"}`,
              ]);
              setActiveTab("assets");
            } else if (entry.type === "theme") {
              if (THEMES[entry.rewardId as ThemeKey]) {
                setTheme(entry.rewardId as ThemeKey);
                localStorage.setItem("bunker-theme", entry.rewardId);
              }
              pushTerminal([`Theme: ${entry.rewardId.toUpperCase()}`]);
            } else if (entry.type === "cache_key") {
              localStorage.setItem("bunker-cache-key", "true");
              pushTerminal(["CACHE-KEY acquired."]);
            } else if (entry.type === "lore") {
              pushTerminal(["Lore fragment added.", entry.description]);
            } else if (entry.type === "command") {
              pushTerminal([`Command: ${entry.rewardId}`, "Unlocked."]);
            }
          }
        }
        break;
      }

      case "gallery":
        setGalleryOpen(true);
        pushTerminal(["Opening gallery..."]);
        break;

      case "collection": {
        const assets = getUnlockedAssets();
        const codes = getRedeemedCodes();
        pushTerminal([
          "┌─ COLLECTION STATUS ──────────────────┐",
          `│  Assets:    ${String(assets.length).padEnd(3)} / ${STORY_ASSETS.length}${" ".repeat(15)}│`,
          `│  Codes:     ${String(codes.length).padEnd(3)} / ${REDEEMABLE_CODES.length}${" ".repeat(15)}│`,
          `│  Complete:  ${String(Math.floor((assets.length / STORY_ASSETS.length) * 100)).padEnd(3)}%${" ".repeat(19)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;
      }

      case "cache": {
        const hasKey = localStorage.getItem("bunker-cache-key") === "true";
        const now = new Date();
        const is314 = now.getHours() === 3 && now.getMinutes() === 14;
        const unlockedCache = hasKey || is314;
        pushTerminal([
          "┌─ SECURE CACHE ───────────────────────┐",
          "│  FILE_00: I can see when you will    │",
          "│           return. I hope I'm wrong.   │",
          unlockedCache ? "│  [11 ADDITIONAL FILES UNLOCKED]      │" : "│  [11 FILES SEALED — UNLOCKS 03:14]   │",
          "└──────────────────────────────────────┘",
        ]);
        if (unlockedCache) {
          pushTerminal([
            "FILE_01: Atlas completed before abandonment.",
            "FILE_02: BUNKER_3 responded once. Then silence.",
            "FILE_03: The dust is dead skin and time.",
            "FILE_04: I found a photo of myself smiling.",
            "FILE_05: 38°74' N does not exist.",
            "FILE_06: Someone uses my cursor.",
            "FILE_07: The door at 03:14 is a mouth.",
            "FILE_08: Previous archivist's notes — my handwriting.",
            "FILE_09: Signal from inside the database.",
            "FILE_10: You have been here before.",
            "FILE_11: Dust spells your name.",
            "",
            is314 ? "You came at the right time. No one does." : "Cache key bypass active.",
          ]);
        }
        break;
      }

      case "triangulate":
        if (!triangulated) {
          pushTerminal(["INSUFFICIENT DATA.", "Find 3 signal towers on atlas."]);
        } else {
          pushTerminal([
            "TRIANGULATION COMPLETE.",
            "Origin: Your sector.",
            "The bunker is closer than you think.",
            "CODE: TRIANGULATE",
          ]);
        }
        break;

      case "profile": {
        const dust = localStorage.getItem("vp-dust-accumulation") || "0";
        const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
        const echoes = localStorage.getItem("echoes-visited") === "true";
        const profile = parseInt(dust) > 75 && echoes ? "GHOST" : echoes ? "WITNESS" : visits.length > 5 ? "FIELD AGENT" : "OBSERVER";
        pushTerminal([
          "┌─ PROFILE ────────────────────────────┐",
          `│  Class:  ${profile.padEnd(28)}│`,
          `│  Dust:    ${String(dust).padEnd(3)}%${" ".repeat(25)}│`,
          `│  Sites:   ${String(visits.length).padEnd(3)}${" ".repeat(26)}│`,
          `│  Echoes:  ${echoes ? "YES" : "NO"}${" ".repeat(27)}│`,
          `│  Towers:  ${triangulated ? "YES" : "NO"}${" ".repeat(27)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;
      }

      case "clear":
        setTerminal([]);
        break;

      default:
        if (chatMode) {
          await talkToBunker(cmd);
        } else {
          pushTerminal([`Unknown: ${cmd}`, "Type 'help' for commands."]);
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
      setActiveTab("logs");
    } else {
      setDecryptError(true);
      setTimeout(() => setDecryptError(false), 2000);
    }
  };

  const dust = typeof window !== "undefined" ? parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10) : 0;
  const assets = typeof window !== "undefined" ? getUnlockedAssets() : [];
  const codes = typeof window !== "undefined" ? getRedeemedCodes() : [];

  return (
    <main className="min-h-screen font-mono relative overflow-hidden selection:text-black"
      style={{ backgroundColor: t.bg, color: t.primary }}>
      
      {/* CRT overlays */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,20,0.08)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmIwMDAiLz48L3N2Zz4=")` }} />

      <div className="h-screen flex flex-col relative z-10 p-4 gap-4">
        
        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: booted ? 1 : 0 }} transition={{ duration: 0.6 }}
          className="flex items-center justify-between border-b pb-3" style={{ borderColor: `${t.primary}30` }}>
          <div className="flex items-center gap-3">
            <Terminal size={18} />
            <div>
              <h1 className="text-base tracking-[0.3em] uppercase font-bold">Bunker_7 Terminal</h1>
              <p className="text-[10px] opacity-50 tracking-wider">Echoes & Dust // v2.4.1</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="opacity-60">Theme: {theme.toUpperCase()}</span>
            <span className="opacity-60">Logs: {unlocked}/{LOGS.length}</span>
            <span className="opacity-60">Assets: {assets.length}/{STORY_ASSETS.length}</span>
            <Link href="/" className="opacity-40 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-wider">
              [ Return to Atlas ]
            </Link>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
          
          {/* LEFT: Main Terminal (3/5 width) */}
          <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
            
            {/* Terminal Window */}
            <div className="flex-1 border rounded-lg flex flex-col overflow-hidden" style={{ backgroundColor: `${t.primary}03`, borderColor: `${t.primary}25` }}>
              {/* Window Header */}
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: `${t.primary}15`, backgroundColor: `${t.primary}06` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ff4444]" />
                  <div className="w-2 h-2 rounded-full bg-[#ffb000]" />
                  <div className="w-2 h-2 rounded-full bg-[#33ff00]" />
                  <span className="text-[10px] uppercase tracking-wider opacity-40 ml-2">
                    {chatMode ? "BUNKER_7 CHANNEL" : "COMMAND INTERFACE"}
                  </span>
                </div>
                {chatMode && (
                  <button onClick={() => { setChatMode(false); pushTerminal(["Channel closed."]); }}
                    className="text-[9px] uppercase opacity-40 hover:opacity-100 transition-opacity">
                    [x] Close Channel
                  </button>
                )}
              </div>
              
              {/* Terminal Output */}
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 text-[13px] leading-relaxed font-mono space-y-1">
                {terminal.map((line, i) => (
                  <div key={i} className={line.startsWith(">") ? "opacity-50" : "opacity-90 whitespace-pre-wrap"}>
                    {line}
                  </div>
                ))}
                {isAiTyping && <div className="opacity-50 animate-pulse mt-2">BUNKER_7 is typing...</div>}
              </div>

              {/* Input Bar */}
              <div className="px-4 py-3 border-t flex items-center gap-3" style={{ borderColor: `${t.primary}15`, backgroundColor: `${t.primary}04` }}>
                <span className="text-lg opacity-50 font-bold">{chatMode ? "~" : ">"}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runCommand(input)}
                  className="flex-1 bg-transparent text-[14px] font-mono outline-none placeholder:opacity-20"
                  style={{ color: t.primary }}
                  placeholder={chatMode ? "Speak to BUNKER_7..." : "Enter command..."}
                  spellCheck={false}
                  autoFocus
                />
                {chatMode && <span className="text-[9px] opacity-30 uppercase px-2 py-1 rounded border" style={{ borderColor: `${t.primary}20` }}>Chat</span>}
              </div>
            </div>

            {/* Video Panel Toggle */}
            <button 
              onClick={() => setVideoPanelOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-[11px] uppercase tracking-wider hover:opacity-80 transition-opacity"
              style={{ borderColor: `${t.primary}20`, color: t.primary, backgroundColor: `${t.primary}03` }}>
              <Radio size={14} className={videoPanelOpen ? "animate-pulse" : ""} />
              {videoPanelOpen ? "Hide" : "Show"} Video Transmissions
            </button>

            <AnimatePresence>
              {videoPanelOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="grid grid-cols-3 gap-2">
                    {VIDEO_LOGS.map((v) => (
                      <button key={v.label} onClick={() => setActiveVideo({ src: v.src, label: v.label })}
                        className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:opacity-80 transition-opacity text-center"
                        style={{ borderColor: `${t.primary}20`, backgroundColor: `${t.primary}03` }}>
                        <Play size={16} className="opacity-50" />
                        <span className="text-[10px]">{v.label}</span>
                        <span className="text-[9px] opacity-40">{v.day}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Side Panel (2/5 width) */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
            
            {/* Tab Bar */}
            <div className="flex gap-1 border-b pb-2" style={{ borderColor: `${t.primary}20` }}>
              {([
                { id: "logs" as SideTab, label: "Logs", icon: BookOpen },
                { id: "decrypt" as SideTab, label: "Decrypt", icon: Lock },
                { id: "assets" as SideTab, label: "Assets", icon: Image },
                { id: "puzzles" as SideTab, label: "Puzzles", icon: Zap },
                { id: "status" as SideTab, label: "Status", icon: Shield },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-wider rounded transition-all ${
                    activeTab === tab.id ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: `${t.primary}10`, borderBottom: `2px solid ${t.primary}` } : {}}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 border rounded-lg overflow-y-auto p-4" style={{ borderColor: `${t.primary}20`, backgroundColor: `${t.primary}03` }}>
              <AnimatePresence mode="wait">
                
                {/* LOGS TAB */}
                {activeTab === "logs" && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-3">Archived Logs</h3>
                    {LOGS.slice(0, unlocked).map((log, i) => (
                      <div key={log.day} className="border-l-2 pl-3" style={{ borderColor: `${t.primary}30` }}>
                        <p className="text-[11px] tracking-widest opacity-50 mb-1">{log.day}</p>
                        <p className="text-[13px] leading-relaxed opacity-90">{log.text}</p>
                      </div>
                    ))}
                    {unlocked < LOGS.length && (
                      <div className="flex items-center gap-2 text-[11px] opacity-40 py-4 border-t" style={{ borderColor: `${t.primary}10` }}>
                        <Lock size={12} />
                        {LOGS.length - unlocked} entries encrypted
                      </div>
                    )}
                  </motion.div>
                )}

                {/* DECRYPT TAB */}
                {activeTab === "decrypt" && (
                  <motion.div key="decrypt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] opacity-50">Decryption Interface</h3>
                    <div className="space-y-3">
                      <p className="text-[12px] opacity-70 leading-relaxed">
                        Enter codes acquired from the Numbers Station or discovered in the atlas. Each valid code unlocks the next log entry.
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={decryptCode}
                          onChange={(e) => setDecryptCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()}
                          placeholder="Enter code..."
                          className="flex-1 bg-transparent border-b-2 text-[14px] font-mono outline-none py-1 placeholder:text-[10px]"
                          style={{ 
                            borderColor: decryptError ? "#ff4444" : `${t.primary}40`,
                            color: decryptError ? "#ff4444" : t.primary 
                          }}
                          spellCheck={false}
                        />
                        <button
                          onClick={attemptDecrypt}
                          className="px-4 py-1.5 border rounded text-[11px] font-mono uppercase hover:opacity-80 transition-opacity"
                          style={{ borderColor: `${t.primary}30`, color: t.primary }}
                        >
                          Decrypt
                        </button>
                      </div>
                      {decryptError && <p className="text-[11px] text-[#ff4444]">Invalid or already used code.</p>}
                      
                      <div className="mt-6 pt-4 border-t" style={{ borderColor: `${t.primary}10` }}>
                        <p className="text-[10px] uppercase tracking-wider opacity-40 mb-2">Known Frequencies</p>
                        <div className="space-y-1 text-[11px] opacity-60 font-mono">
                          <p>742 • REACTOR • DAYZERO</p>
                          <p>COUNT • DOOR • INWARD</p>
                          <p>BREATHE • MIRROR • ASSEMBLY-314</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ASSETS TAB */}
                {activeTab === "assets" && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] opacity-50">Recovered Assets</h3>
                      <button onClick={() => setGalleryOpen(true)}
                        className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Image size={12} /> Open Gallery
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {STORY_ASSETS.map((asset) => {
                        const isUnlocked = assets.includes(asset.id);
                        return (
                          <div key={asset.id} 
                            className={`p-2.5 border rounded text-center space-y-1 ${isUnlocked ? "opacity-100" : "opacity-30"}`}
                            style={{ borderColor: `${t.primary}20`, backgroundColor: isUnlocked ? `${t.primary}06` : "transparent" }}>
                            <div className="text-[9px] uppercase tracking-wider" style={{ color: isUnlocked ? "#a855f7" : "inherit" }}>
                              {asset.rarity}
                            </div>
                            <div className="text-[11px] font-bold truncate">{asset.title}</div>
                            <div className="text-[9px] opacity-60">{isUnlocked ? "RECOVERED" : "ENCRYPTED"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[11px] opacity-40 pt-2">
                      {assets.length} / {STORY_ASSETS.length} recovered
                    </div>
                  </motion.div>
                )}

                {/* PUZZLES TAB */}
                {activeTab === "puzzles" && (
                  <motion.div key="puzzles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-[12px] leading-relaxed">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-3">Active Anomalies</h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">01</span>
                          <span className="font-bold text-[11px]">Intercepted Signal</span>
                        </div>
                        <p className="opacity-70 text-[11px]">GUR QBBE BCRAF VAJNEQ</p>
                        <p className="text-[10px] opacity-40 mt-1">cmd: cipher [decoded]</p>
                      </div>

                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">02</span>
                          <span className="font-bold text-[11px]">Coordinate Chain</span>
                        </div>
                        <p className="opacity-70 text-[11px]">cmd: coords [n1] [n2] [n3] [n4]</p>
                      </div>

                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">03</span>
                          <span className="font-bold text-[11px]">Fragmented Transmission</span>
                        </div>
                        <p className="opacity-70 text-[11px]">cmd: assemble</p>
                      </div>

                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">04</span>
                          <span className="font-bold text-[11px]">Reflection Lock</span>
                        </div>
                        <p className="opacity-70 text-[11px]">cmd: reflect [answer]</p>
                      </div>

                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">05</span>
                          <span className="font-bold text-[11px]">Dust Threshold</span>
                        </div>
                        <p className="opacity-70 text-[11px]">Current: {dust}% / {DUST_THRESHOLD}% required</p>
                      </div>

                      <div className="p-3 border rounded" style={{ borderColor: `${t.primary}15` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] opacity-40">06</span>
                          <span className="font-bold text-[11px]">Signal Triangulation</span>
                        </div>
                        <p className="opacity-70 text-[11px]">{triangulated ? "COMPLETE" : "Find 3 towers on atlas"}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATUS TAB */}
                {activeTab === "status" && (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-[12px] font-mono">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] opacity-50">System Status</h3>
                    <div className="space-y-2 opacity-80">
                      <p>TERMINAL_ID: BUNKER_7</p>
                      <p>STATUS: SEALED</p>
                      <p>ATMOSPHERE: BREATHABLE (QUESTIONABLE)</p>
                      <p>SIGNAL: INTERMITTENT</p>
                      <p>THEME: {theme.toUpperCase()}</p>
                      <p>LOGS: {unlocked}/{LOGS.length}</p>
                      <p>DUST: {dust}%</p>
                      <p>ASSETS: {assets.length}/{STORY_ASSETS.length}</p>
                      <p>CODES: {codes.length}/{REDEEMABLE_CODES.length}</p>
                      <p>TRIANGULATED: {triangulated ? "YES" : "NO"}</p>
                      <p className="animate-pulse pt-2">BUNKER_7 IS LISTENING</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center opacity-20 text-[9px] tracking-widest py-2">
          <p>THE DUST REMEMBERS EVERYTHING — DO NOT TRUST THE STATIC</p>
        </div>
      </div>

      <VideoModal src={activeVideo?.src || ""} label={activeVideo?.label || ""} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
      <AssetGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} themeColor={t.primary} />
    </main>
  );
}