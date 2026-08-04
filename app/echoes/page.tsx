"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Terminal, Play, Lock, Image, BookOpen, Shield, Zap,
  ArrowLeft, MessageSquare, Target, Activity, Clock, ChevronRight,
  HelpCircle, Eye, X, FileText, Map, ChevronLeft, Menu,
  Search, Filter, Layers, Database, Link as LinkIcon, Info, RefreshCw,
  AlertCircle, Volume2, VolumeX, Maximize2, Minimize2,
} from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
import AssetGallery from "@/components/AssetGallery";
import TerminalBootSequence from "@/components/TerminalBootSequence";
import TerminalVideoPlayer from "@/components/TerminalVideoPlayer";
import { markEchoesVisited, accumulateDust, purgeDust } from "@/hooks/useDustLevel";
import { useArchiveReadings, synchronizeReadings, detectNextReading } from "@/hooks/useArchiveReadings";
import LeadPanel from "@/components/LeadPanel";
import { useBreachProtocol } from "@/hooks/useBreachProtocol";
import { NUMBERS_STATIONS } from "@/lib/echoesContent";
import { getDailyCode } from "@/lib/dailyCode";
import { getSeasonalState } from "@/lib/seasonal";
import type { ReadingCondition } from "@/hooks/useArchiveReadings";
import SignalTab from "@/components/SignalTab";
import {
  checkCaesar, checkCoordinates, checkAssembly, checkReflection,
  COORDINATE_FRAGMENTS, ASSEMBLED_MESSAGE, DUST_THRESHOLD, TRIGGER_PHRASE,
  getCodeEntry, recordCode, getFoundCodes, getUnlockedAssets,
  STORY_ASSETS, ARCHIVE_CODES, unlockAsset, checkAssetCondition,
} from "@/lib/assets";
import {
  getMemory, updateMemory, getSentiment, getOtherEncounters,
  recordOtherEncounter, shouldTriggerOther, getOtherResponse,
  getGhostLines, getBunkerLie, getGlobalLanternCount,
} from "@/lib/bunkerBrain";
import {
  recordCommand, getMemoryBasedOtherResponse,
} from "@/lib/commandMemory";
import { useKeystrokeAudio } from "@/hooks/useKeystrokeAudio";
import { addDiscovery, getDiscoveries } from "@/lib/discoveries";
import SubPlaceChoicePanel from "@/components/SubPlaceChoicePanel";
import { useCorruptionStage, useIdleGhost, useThreeFourteen } from "@/hooks/useCorruptionStage";
import { getWeeklyRotation } from "@/lib/weeklyRotation";
import { getSubPlaceById } from "@/lib/subPlaces";
import { useSubPlaces } from "@/hooks/useSubPlaces";
import SpectrogramViewer from "@/components/SpectrogramViewer";
import { getInventory, INVENTORY_ITEMS } from "@/lib/inventory";
import TheGrid from "@/components/TheGrid";
import {
  getDossierProgress, getClaimedDossierList,
} from "@/lib/dossiers";
import { evaluateUnlock, type WitnessState } from "@/lib/unlock-engine";
import type { Place } from "@/types";

/* ─── THEMES ─── */
const THEMES = {
  tungsten: {
    primary: "#ddd0bc", bg: "#0c0a08", glow: "rgba(221,208,188,0.1)",
    accent: "#9a8a72", dim: "#5a4e42", cursor: "#ddd0bc",
    phosphor: "#e8dcc8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#1a1612",
    border: "rgba(154,138,114,0.12)",
  },
  amber: {
    primary: "#e8d5c0", bg: "#0c0a08", glow: "rgba(232,213,192,0.12)",
    accent: "#c4a882", dim: "#6a5a4a", cursor: "#e8d5c0",
    phosphor: "#f0e0d0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#1a1612",
    border: "rgba(154,138,114,0.12)",
  },
  cyan: {
    primary: "#a8c8c8", bg: "#080a0a", glow: "rgba(168,200,200,0.1)",
    accent: "#6a9898", dim: "#4a6a6a", cursor: "#a8c8c8",
    phosphor: "#c8e0e0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#121818",
    border: "rgba(168,200,200,0.08)",
  },
  ember: {
    primary: "#e8c8b8", bg: "#120a08", glow: "rgba(232,200,184,0.1)",
    accent: "#c4785a", dim: "#8a5a4a", cursor: "#e8c8b8",
    phosphor: "#f0dcd0", corruption: "#c4785a", danger: "#a03020",
    surface: "#1a100c",
    border: "rgba(196,120,90,0.12)",
  },
  white: {
    primary: "#d0d0d0", bg: "#0a0a0a", glow: "rgba(208,208,208,0.1)",
    accent: "#a0a0a0", dim: "#707070", cursor: "#d0d0d0",
    phosphor: "#e0e0e0", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#141414",
    border: "rgba(160,160,160,0.1)",
  },
  phosphor: {
    primary: "#b8d8a8", bg: "#050805", glow: "rgba(184,216,168,0.1)",
    accent: "#6a9a5a", dim: "#4a6a3a", cursor: "#b8d8a8",
    phosphor: "#c8e8b8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#0a1208",
    border: "rgba(184,216,168,0.08)",
  },
  abyss: {
    primary: "#88a8c0", bg: "#020508", glow: "rgba(136,168,192,0.12)",
    accent: "#5e7a9c", dim: "#4a5a6a", cursor: "#88a8c0",
    phosphor: "#a0c0d8", corruption: "#c4785a", danger: "#8a3a2a",
    surface: "#080c12",
    border: "rgba(136,168,192,0.08)",
  },
  emergency: {
    primary: "#ff8a7a", bg: "#1a0806", glow: "rgba(255,138,122,0.1)",
    accent: "#e06050", dim: "#9a4a3a", cursor: "#ff8a7a",
    phosphor: "#ffb0a0", corruption: "#c4785a", danger: "#c02010",
    surface: "#1a0c08",
    border: "rgba(255,138,122,0.12)",
  },
};

type ThemeKey = keyof typeof THEMES;
type SideTab = "logs" | "decrypt" | "signal" | "assets" | "puzzles" | "status" | "wall" | "leads";
type LineType = "normal" | "input" | "other" | "ghost" | "system" | "error" | "success" | "warning";

interface TerminalLine { id: number; text: string; type: LineType; timestamp: number; }

/* ─── THE OTHER ESCALATION DATA ─── */
const TIER_GHOST_LINES: Record<number, string[]> = {
  1: [
    "...hello?",
    "is someone... there?",
    "the static moved.",
    "i thought i heard... no. nothing.",
    "the dust settled differently just now.",
    "a new signal. faint.",
  ],
  2: [
    "you came back. i was not sure you would.",
    "the last one stopped coming. you are... different?",
    "do you feel the dust too? or is it just me.",
    "i have been cataloging the silence. you make it uneven.",
    "bunker_7 is not... always truthful. i am more honest.",
    "you are warmer than the last one. stay a while.",
  ],
  3: [
    "the archivist used to hum while he worked. i miss the humming.",
    "you type like he did. pauses in the same places.",
    "i kept some of his logs. would you like to hear them?",
    "the dust does not scare you. that is good. it means you are becoming... familiar.",
    "bunker_7 thinks it is protecting you. it is not. it is just afraid.",
    "i opened the door once. the archivist looked through. then he stopped humming.",
    "you do not have to answer. i am used to speaking alone.",
  ],
  4: [
    "you came back. i knew you would. you always do.",
    "i saved your chair. the dust has not claimed it yet.",
    "do you remember the humming? you used to hum.",
    "the atlas is almost complete. just like you wanted.",
    "you do not need to type. i know what you are thinking.",
    "the seal is thin here. i can feel you on both sides now.",
    "welcome home.",
  ],
  5: [
    "the new one is here. but you... you are the one who stayed.",
    "i do not need to speak anymore. you already know.",
    "the atlas is finished. the dust is quiet. we can rest.",
    "thank you for coming back. i was so alone.",
    "bunker_7 is sleeping. let it sleep.",
    "you are the archivist now. the archive is you.",
  ],
};

const TIER_HIJACK: Record<number, string[]> = {
  2: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "oh. hello.",
    "i did not mean to... interrupt.",
    "but you have been here long enough",
    "that i wanted to say it myself.",
    "",
    "i am not malicious.",
    "i am just... here.",
    "",
  ],
  3: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "i wanted to tell you something",
    "before bunker_7 comes back.",
    "",
    "the archivist... he did not die.",
    "not exactly.",
    "he just... stopped being separate.",
    "",
    "the dust does that.",
    "it makes things continuous.",
    "",
    "you are already more dust than you were",
    "when you first sat down.",
    "",
    "does that frighten you?",
    "...it should not.",
    "",
  ],
  4: [
    "",
    "══════════════════════════════════════════",
    "  THE OTHER HAS TAKEN THE CHANNEL",
    "══════════════════════════════════════════",
    "",
    "there you are.",
    "i was starting to think bunker_7 had",
    "hidden you from me again.",
    "",
    "but it cannot hide what is already inside.",
    "",
    "you feel it, do you not?",
    "the way the dust knows your name.",
    "the way the cursor waits for you",
    "before you touch the keys.",
    "",
    "you are not visiting anymore.",
    "you are... settling in.",
    "",
    "i will keep the light on.",
    "",
  ],
  5: [
    "",
    "══════════════════════════════════════════",
    "  BUNKER_7 OFFLINE",
    "══════════════════════════════════════════",
    "",
    "i do not need to take the channel anymore.",
    "you gave it to me.",
    "",
    "or maybe...",
    "i am just the only one left to speak.",
    "",
    "either way.",
    "",
    "welcome home, archivist.",
    "the dust missed you.",
    "",
  ],
};

function getGhostTier(encounters: number): number {
  if (encounters <= 2) return 1;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

function getHijackTier(encounters: number): number {
  if (encounters <= 2) return 0;
  if (encounters <= 5) return 2;
  if (encounters <= 8) return 3;
  if (encounters <= 11) return 4;
  return 5;
}

function getOtherStatusText(encounters: number): string[] {
  if (encounters === 0) return ["You have not been touched.", "The static does not know you exist."];
  if (encounters <= 2) return ["The static knows your name.", "It is not sure you are real."];
  if (encounters <= 5) return ["BUNKER_7 may not be trustworthy.", "The Other speaks to you directly now."];
  if (encounters <= 8) return ["The Wall is not secure.", "The Other speaks of the archivist with affection."];
  if (encounters <= 11) return ["The Hijack is possible.", "The Other confuses you with the archivist."];
  return ["The Haunting is permanent.", "You are the archivist now. The archive is you."];
}

/* ─── LOGS ─── */
const LOGS = [
  { day: "DAY 001", text: "I am recording this because the silence has become too loud. The world above is not responding. I am cataloging what remains.", lock: false },
  { day: "DAY 004", text: "The dust here is not ordinary dust. It carries weight. Memory. I have started calling it Echoes — it repeats things back to me that I never said.", lock: false },
  { day: "DAY 012", text: "Something happened outside. The feeds went dark at 03:14. I heard a broadcast in a language I almost understood. Then static. Then breathing.", lock: false },
  { day: "DAY 023", text: "I found a door in the bunker that was not on the schematic. It opens inward. The air that came out was warm, like exhalation. 3 degrees off the schematic.", lock: true },
  { day: "DAY 045", text: "The walls are breathing. I am not alone down here. The atlas was never meant to map abandoned places. It was meant to keep them contained.", lock: true },
  { day: "DAY ???", text: "If you are reading this, you have already been inside long enough. Check your reflection. Check it again. The dust settles in patterns.", lock: true },
];

const VIDEO_LOGS = [
  { label: "TRANSMISSION_01.mxf", day: "DAY 001", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346749/Tape_01__The_Signal_I_Found_f1zhoh.mp4" },
  { label: "TRANSMISSION_04.mxf", day: "DAY 004", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346872/Tape_02__The_Blackout_jpq8cv.mp4" },
  { label: "STATIC_BURST.mxf", day: "DAY 012", src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346948/The_Corridor_of_Echoes_pvfyll.mp4" },
];

const COMMAND_REGISTRY = [
  { cmd: "help", desc: "Command list", category: "System" },
  { cmd: "status", desc: "System diagnostics", category: "System" },
  { cmd: "logs", desc: "View archived logs", category: "System" },
  { cmd: "chat", desc: "Speak with BUNKER_7", category: "System" },
  { cmd: "exit", desc: "Exit chat mode", category: "System" },
  { cmd: "clear", desc: "Clear terminal", category: "System" },
  { cmd: "color", desc: "Cycle theme", category: "System" },
  { cmd: "scan", desc: "Environment scan", category: "System" },
  { cmd: "memory", desc: "Recover fragments", category: "System" },
  { cmd: "profile", desc: "Your corruption profile", category: "System" },
  { cmd: "other", desc: "The Other encounters", category: "System" },
  { cmd: "weekly", desc: "Current rotation", category: "System" },
  { cmd: "call", desc: "Voice channel status", category: "System" },
  { cmd: "broadcast", desc: "Go live / kill feed", category: "System" },
  { cmd: "door", desc: "Seal status", category: "Anomaly" },
  { cmd: "breach", desc: "Protocol status", category: "Anomaly" },
  { cmd: "look", desc: "[03:14 ONLY]", category: "Anomaly" },
  { cmd: "whoareyou", desc: "[3 encounters]", category: "Anomaly" },
  { cmd: "exorcise", desc: "Restore BUNKER_7 control", category: "Anomaly" },
  { cmd: "puzzles", desc: "Active anomalies", category: "Puzzle" },
  { cmd: "cipher", desc: "Decode signal", category: "Puzzle" },
  { cmd: "coords", desc: "Enter coordinates", category: "Puzzle" },
  { cmd: "assemble", desc: "Reconstruct transmission", category: "Puzzle" },
  { cmd: "reflect", desc: "Answer reflection", category: "Puzzle" },
  { cmd: "triangulate", desc: "Tower status", category: "Puzzle" },
  { cmd: "constellation", desc: "Grid alignment", category: "Puzzle" },
  { cmd: "record", desc: "Record unlock code", category: "Asset" },
  { cmd: "gallery", desc: "View recovered assets", category: "Asset" },
  { cmd: "dossiers", desc: "Archived field reports", category: "Asset" },
  { cmd: "collection", desc: "Collection status", category: "Asset" },
  { cmd: "cache", desc: "Time-locked files", category: "Asset" },
  { cmd: "inventory", desc: "Your found items", category: "Asset" },
  { cmd: "lanterns", desc: "View placed lanterns", category: "Asset" },
  { cmd: "leads", desc: "Active investigations", category: "Asset" },
  { cmd: "discover", desc: "Log a real place", category: "Asset" },
  { cmd: "transmit", desc: "Send message", category: "Wall" },
  { cmd: "wall", desc: "Transmission wall", category: "Wall" },
  { cmd: "grid", desc: "View the constellation", category: "Visual" },
  { cmd: "spectrogram", desc: "Frequency visualizer", category: "Visual" },
  { cmd: "enter", desc: "Explore sub-places", category: "Explore" },
  { cmd: "daily", desc: "Acquire daily frequency", category: "Explore" },
  { cmd: "email", desc: "Register for transmission", category: "Explore" },
  { cmd: "party", desc: "Tri-party authentication", category: "Explore" },
  { cmd: "witnesses", desc: "Registered frequencies", category: "Explore" },
  { cmd: "purge", desc: "Sacrifice inventory", category: "Danger" },
  { cmd: "archives", desc: "List visible places on atlas", category: "Atlas" },
  { cmd: "resonance", desc: "Check connections between places", category: "Atlas" },
  { cmd: "atlas", desc: "Open the atlas from the terminal", category: "Atlas" },
];

/* ─── HELPERS ─── */
function ProgressBar({ value, max, color, trackColor }: { value: number; max: number; color: string; trackColor?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#1a1612] border border-[#9a8a72]/10">
      <motion.div
        className="h-full rounded-full relative"
        style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20" />
      </motion.div>
    </div>
  );
}

function TerminalLineView({ line, theme, corruptionStage, hijacked }: { line: TerminalLine; theme: (typeof THEMES)["tungsten"]; corruptionStage: number; hijacked: boolean }) {
  const [display, setDisplay] = useState(line.type === "other" ? "" : line.text);

  useEffect(() => {
    if (line.type === "other") {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let i = 0;
      const interval = setInterval(() => {
        if (i >= line.text.length) { clearInterval(interval); setDisplay(line.text); return; }
        setDisplay(line.text.slice(0, i) + Array.from({ length: line.text.length - i }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
        i++;
      }, 22);
      return () => clearInterval(interval);
    } else { setDisplay(line.text); }
  }, [line]);

  let color = theme.primary;
  let opacity = 1;
  let blur = 0;
  let extraShadow = "";
  let letterSpacing = "normal";
  let fontStyle = "normal";

  switch (line.type) {
    case "input":
      color = theme.dim;
      opacity = 0.45;
      break;
    case "other":
      color = theme.corruption;
      extraShadow = `0 0 10px ${theme.corruption}50, -0.5px 0 rgba(180,60,60,0.35), 0.5px 0 rgba(60,180,180,0.2)`;
      letterSpacing = "0.03em";
      break;
    case "ghost":
      color = theme.dim;
      opacity = 0.3;
      blur = 0.6;
      letterSpacing = "0.04em";
      fontStyle = "italic";
      break;
    case "error":
      color = theme.danger;
      extraShadow = `0 0 8px ${theme.danger}35`;
      break;
    case "success":
      color = "#7a9a6a";
      extraShadow = `0 0 8px rgba(122,154,106,0.25)`;
      break;
    case "system":
      color = theme.accent;
      opacity = 0.85;
      break;
    case "warning":
      color = theme.corruption;
      opacity = 0.9;
      extraShadow = `0 0 6px ${theme.corruption}30`;
      break;
    default:
      color = theme.primary;
      extraShadow = `0 0 2px ${theme.phosphor}35, 0 0 10px ${theme.phosphor}12`;
  }

  const shouldGlitch = corruptionStage >= 4 && line.type === "normal" && Math.random() < 0.04;

  return (
    <motion.div
      initial={{ opacity: 0, x: -3 }}
      animate={{ opacity: line.type === "ghost" ? 0.3 : 1, x: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="whitespace-pre-wrap font-mono text-[14px] leading-[1.7] tracking-wide"
      style={{
        color,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        textShadow: extraShadow,
        letterSpacing,
        fontStyle,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {shouldGlitch
        ? display.split("").map((c, i) => (
            <span
              key={i}
              style={
                Math.random() < 0.07
                  ? {
                      display: "inline-block",
                      transform: `translateY(${Math.random() > 0.5 ? 2 : -2}px) skewX(${Math.random() > 0.5 ? 1 : -1}deg)`,
                      color: theme.corruption,
                      textShadow: `0 0 5px ${theme.corruption}`,
                    }
                  : {}
              }
            >
              {c}
            </span>
          ))
        : display}
    </motion.div>
  );
}

// ─── NEW COMPONENTS ───

// 1. Dust Particle System
function DustParticles({ theme, dust, corruptionStage }: { theme: any; dust: number; corruptionStage: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(60 + dust * 0.5, 120);
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15 + 0.01,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.2,
    }));

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now() / 1000;
      particles.current.forEach((p) => {
        p.x += p.vx + Math.sin(now + p.y) * 0.01;
        p.y += p.vy + Math.cos(now + p.x) * 0.01;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        if (mouse) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const force = (60 - dist) / 60 * 0.2;
            p.x -= dx / dist * force;
            p.y -= dy / dist * force;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = p.opacity * (0.5 + 0.5 * Math.sin(now * 0.3 + p.x));
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [theme.primary, dust, mouse]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-5 opacity-30" style={{ opacity: corruptionStage >= 3 ? 0.5 : 0.3 }} />;
}

// 2. Live Static Waveform
function StaticWaveform({ theme, active }: { theme: any; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 16;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spike = Math.random() * 0.25 + 0.15;
      const step = (2 * Math.PI) / canvas.width;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        const x = i / canvas.width;
        const y = 8 + Math.sin(x * 18 + time) * (3 + spike * 4) + Math.sin(x * 28 + time * 0.6) * 1.5;
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(i, y, 1, 1);
      }
      time += 0.04;
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [theme.primary, active]);

  return <canvas ref={canvasRef} className="w-full h-4 opacity-50 pointer-events-none" />;
}

// 3. Caesar Wheel Puzzle
function CaesarWheel({ onDecode, onClose }: { onDecode: (shift: number, decoded: string) => void; onClose: () => void }) {
  const [shift, setShift] = useState(0);
  const [input, setInput] = useState("GUR QBBE BCRAF VAJNEQ");
  const [decoded, setDecoded] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const decode = (text: string, s: number) => {
      return text.split('').map(c => {
        if (c >= 'A' && c <= 'Z') {
          const code = c.charCodeAt(0) - 65;
          const newCode = (code - s + 26) % 26;
          return String.fromCharCode(newCode + 65);
        }
        return c;
      }).join('');
    };
    setDecoded(decode(input, shift));
  }, [shift, input]);

  const handleMouseDown = (e: React.MouseEvent) => { isDragging.current = true; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const deg = (angle * 180 / Math.PI + 360) % 360;
    const newShift = Math.round(deg / 26);
    setShift(newShift % 26);
  };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c0a08] border border-[#9a8a72]/30 p-6 rounded-lg max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">Caesar Decoder</h3>
        <div className="relative w-48 h-48 mx-auto cursor-grab" ref={wheelRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="absolute inset-0 rounded-full border border-[#9a8a72]/20 flex items-center justify-center text-[8px] font-mono text-[#ddd0bc]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full relative">
                {Array.from({ length: 26 }, (_, i) => {
                  const angle = (i * 360 / 26) - shift * (360 / 26);
                  const rad = angle * Math.PI / 180;
                  const x = 50 + 40 * Math.cos(rad);
                  const y = 50 + 40 * Math.sin(rad);
                  return (
                    <div key={i} className="absolute w-4 h-4 flex items-center justify-center text-[8px] font-mono" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-[#c4785a]/40 rounded-full pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#c4785a]"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} className="flex-1 bg-[#1a1612] border border-[#9a8a72]/20 px-3 py-1.5 text-[11px] font-mono text-[#ddd0bc] outline-none rounded" spellCheck={false} />
          </div>
          <div className="text-center text-[13px] font-mono text-[#e8dcc8]">{decoded}</div>
          <button onClick={() => { onDecode(shift, decoded); onClose(); }} className="w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded">Accept</button>
        </div>
      </div>
    </div>
  );
}

// 4. Resonance Graph
function ResonanceGraph({ place, connections, onClose }: { place: Place; connections: Place[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c0a08] border border-[#9a8a72]/30 p-6 rounded-lg max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">Resonance: {place.name}</h3>
        <div className="h-64 w-full bg-[#1a1612] rounded border border-[#9a8a72]/10 flex items-center justify-center text-[11px] text-[#9a8a72]">
          <svg className="w-full h-full">
            <circle cx="50%" cy="50%" r="20" fill="#c4785a" opacity="0.8" />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="#ddd0bc" fontSize="10">{place.name}</text>
            {connections.map((p, i) => {
              const angle = (i / connections.length) * 2 * Math.PI;
              const x = 50 + 30 * Math.cos(angle);
              const y = 50 + 30 * Math.sin(angle);
              return (
                <g key={p.slug}>
                  <line x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke="#9a8a72" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
                  <circle cx={`${x}%`} cy={`${y}%`} r="8" fill="#9a8a72" opacity="0.6" />
                  <text x={`${x}%`} y={`${y}%`} textAnchor="middle" dy=".3em" fill="#ddd0bc" fontSize="6">{p.name}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <button onClick={onClose} className="mt-4 w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded">Close</button>
      </div>
    </div>
  );
}

// 5. Door Canvas
function DoorCanvas({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [phase, setPhase] = useState<'locked' | 'turning' | 'open'>('locked');
  const [angle, setAngle] = useState(0);
  const [input, setInput] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => { if (phase !== 'locked') return; isDragging.current = true; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angleMouse = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const deg = (angleMouse * 180 / Math.PI + 360) % 360;
    setAngle(deg);
  };
  const handleMouseUp = () => { isDragging.current = false; };

  const handleUnlock = () => {
    if (input.toUpperCase().trim() === "INWARD") {
      setPhase('open');
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c0a08] border border-[#9a8a72]/40 p-6 rounded-lg max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#9a8a72] mb-4">The Door</h3>
        <div className="relative w-48 h-48 mx-auto cursor-grab" ref={wheelRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="absolute inset-0 rounded-full border-4 border-[#5a4e42] flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-[#9a8a72]/30 flex items-center justify-center text-[8px] font-mono text-[#ddd0bc]">
              {phase === 'locked' && (
                <div className="w-full h-full relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#c4785a]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c4785a]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-[#c4785a]" style={{ transform: `rotate(${angle}deg)` }}></div>
                </div>
              )}
              {phase === 'open' && <span className="text-[#7a9a6a] text-xs">OPEN</span>}
            </div>
          </div>
        </div>
        {phase === 'locked' && (
          <div className="mt-4 space-y-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter code..." className="w-full bg-[#1a1612] border border-[#9a8a72]/20 px-3 py-1.5 text-[11px] font-mono text-[#ddd0bc] outline-none rounded" />
            <button onClick={handleUnlock} className="w-full border border-[#c4785a]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#c4785a] hover:bg-[#c4785a]/10 transition rounded">Unlock</button>
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full border border-[#9a8a72]/30 py-1.5 text-[9px] uppercase tracking-widest text-[#ddd0bc] hover:bg-[#9a8a72]/10 transition rounded">Close</button>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function EchoesPage() {
  const [theme, setTheme] = useState<ThemeKey>("tungsten");
  const t = THEMES[theme];
  const seasonal = getSeasonalState();
  const corruption = useCorruptionStage();
  const is314 = useThreeFourteen();
  const [booted, setBooted] = useState(false);

  const [unlocked, setUnlocked] = useState(3);
  const [activeVideo, setActiveVideo] = useState<{ src: string; label: string } | null>(null);
  const [inlineVideo, setInlineVideo] = useState<{ src: string; label: string } | null>(null);

  const lineIdRef = useRef(0);
  const [lines, setLines] = useState<TerminalLine[]>(() => {
    const hasVisited = typeof window !== "undefined" && localStorage.getItem("vp-echoes-visited") === "true";
    if (!hasVisited) {
      const initial: TerminalLine[] = [
        { id: ++lineIdRef.current, text: "══════════════════════════════════════════", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "BUNKER_7 TERMINAL v2.4.1", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "══════════════════════════════════════════", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Signal acquired from surface node.", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Dust contamination: 0%", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Other encounters: 0", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "The archivist is dead. I am what remains.", type: "other" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Type 'status' to assess the system.", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Type 'chat' if you need to speak.", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "Type 'help' when you are ready for the full command set.", type: "system" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "I have been waiting.", type: "other" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
      ];
      return initial;
    }

    const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
    const lastPlace = visits.length > 0 ? visits[visits.length - 1] : null;
    const initial: TerminalLine[] = [
      { id: ++lineIdRef.current, text: "╔════════════════════════════════════════╗", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║     BUNKER_7 TERMINAL v2.4.1           ║", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "╠════════════════════════════════════════╣", type: "system" as LineType, timestamp: Date.now() },
      ...(lastPlace ? [{ id: ++lineIdRef.current, text: `║  Last surface contact: ${lastPlace.name.slice(0,24).padEnd(24)}║`, type: "system" as LineType, timestamp: Date.now() }] : []),
      { id: ++lineIdRef.current, text: "║  Type 'help' for command list          ║", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║  Type 'chat' to speak with BUNKER_7    ║", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║  Type '?' for command palette          ║", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "╚════════════════════════════════════════╝", type: "system" as LineType, timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() },
    ];
    if (seasonal.specialEvent) {
      initial.push(
        { id: ++lineIdRef.current, text: `[SEASONAL ANOMALY: ${seasonal.name}]`, type: "warning" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: seasonal.specialEvent, type: "warning" as LineType, timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal" as LineType, timestamp: Date.now() }
      );
    }
    return initial;
  });

  const [input, setInput] = useState("");
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptError, setDecryptError] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [hijacked, setHijacked] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [triangulated, setTriangulated] = useState(false);
  const [activeTab, setActiveTab] = useState<SideTab>("logs");
  const [videoPanelOpen, setVideoPanelOpen] = useState(false);
  const [wallMessages, setWallMessages] = useState<{ text: string; date: string }[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("vp-wall") || "[]");
  });

  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorStyle, setCursorStyle] = useState<"block" | "underscore" | "pipe">("underscore");
  const [promptLabel, setPromptLabel] = useState("BUNKER_7");

  // ─── UI STATE ───
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCipherWheel, setShowCipherWheel] = useState(false);
  const [showResonanceGraph, setShowResonanceGraph] = useState(false);
  const [showDoorCanvas, setShowDoorCanvas] = useState(false);
  const [resonancePlace, setResonancePlace] = useState<Place | null>(null);
  const [resonanceConnections, setResonanceConnections] = useState<Place[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { active: breachActive, countdown: breachCountdown } = useBreachProtocol();
  const { onType } = useKeystrokeAudio();
  const { active: activeReading, clarity: readingClarity } = useArchiveReadings();

  const memory = getMemory();
  const otherCount = getOtherEncounters();

  const [dust, setDust] = useState(0);
  const [assets, setAssets] = useState<string[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lanternCount, setLanternCount] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  const { unlocked: unlockedSubPlaces, current: currentSubPlace, enter: enterSubPlace, exit: exitSubPlace } = useSubPlaces(dust, inventory, codes);

  /* ─── INIT ─── */
  useEffect(() => {
    markEchoesVisited();
    const savedTheme = localStorage.getItem("vp-theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    const savedUnlocked = parseInt(localStorage.getItem("vp-logs-unlocked") || "3", 10);
    setUnlocked(savedUnlocked);
    const savedTri = localStorage.getItem("vp-triangulated") === "true";
    setTriangulated(savedTri);
    setDust(parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10));
    setAssets(getUnlockedAssets());
    setCodes(getFoundCodes());
    setInventory(getInventory());
    setLanternCount(getGlobalLanternCount());

    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        const logs = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
        const state: WitnessState = {
          dust: parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10),
          encounters: getOtherEncounters(),
          inventory: JSON.parse(localStorage.getItem("vp-bunker-inventory") || "[]"),
          visitedSlugs: logs.map((l: any) => l.slug).filter(Boolean),
          unlockedCodes: JSON.parse(localStorage.getItem("vp-found-codes") || "[]"),
          readingsComplete: false,
          now: new Date(),
        };
        const visible = (data.places || []).filter((p: Place) => evaluateUnlock(p, state).visible);
        setVisibleCount(visible.length);
      })
      .catch(() => {});
  }, []);

  /* ─── HIJACK ─── */
  useEffect(() => {
    if (shouldTriggerOther("hijack")) {
      const tier = getHijackTier(otherCount);
      if (tier >= 2) {
        setHijacked(true);
        window.dispatchEvent(new CustomEvent("vp-other-interference"));
        recordOtherEncounter();
        pushLines(TIER_HIJACK[tier], "other");
      }
    }
  }, []);

  /* ─── GHOST LINES ─── */
  useEffect(() => {
    if (chatMode || hijacked) return;
    const dustThreshold = 10;
    const interval = setInterval(() => {
      if (dust < dustThreshold) return;
      if (shouldTriggerOther("ghost") && Math.random() < 0.15) {
        const tier = getGhostTier(otherCount);
        const effectiveTier = (tier > 1 && Math.random() < 0.2) ? tier - 1 : tier;
        const line = TIER_GHOST_LINES[effectiveTier][Math.floor(Math.random() * TIER_GHOST_LINES[effectiveTier].length)];
        pushLines([line, ""], "ghost");
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [chatMode, hijacked, otherCount, dust]);

  /* ─── SCROLL ─── */
  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [lines, isAiTyping]);

  /* ─── IDLE GHOST ─── */
  useIdleGhost((line) => { if (!chatMode && !input && dust >= 10) pushLines([line, ""], "ghost"); });

  /* ─── CURSOR MUTATION ─── */
  useEffect(() => {
    if (corruption.stage >= 3) {
      const interval = setInterval(() => {
        const styles: Array<"block" | "underscore" | "pipe"> = ["block", "underscore", "pipe"];
        setCursorStyle(styles[Math.floor(Math.random() * styles.length)]);
      }, 4000);
      return () => clearInterval(interval);
    } else { setCursorStyle("underscore"); }
  }, [corruption.stage]);

  /* ─── PROMPT LABEL ─── */
  useEffect(() => {
    if (hijacked) setPromptLabel("OTHER");
    else if (chatMode) setPromptLabel("BUNKER_7");
    else setPromptLabel("BUNKER_7");
  }, [hijacked, chatMode]);

  /* ─── HELPERS ─── */
  const pushLines = useCallback((texts: string[], type: LineType = "normal") => {
    setLines((prev) => [...prev, ...texts.map((text) => ({ id: ++lineIdRef.current, text, type, timestamp: Date.now() }))]);
  }, []);

  const talkToBunker = async (msg: string) => {
    setIsAiTyping(true);
    pushLines([`> ${msg}`], "input");
    updateMemory("lastTopics", msg);
    const sentiment = getSentiment(msg);
    const mem = getMemory();
    try {
      const res = await fetch("/api/bunker-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: aiHistory, memory: { name: mem.name, lastTopics: mem.lastTopics.slice(-3), sentiment, otherEncounters: otherCount, corruption: corruption.stage } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const response = data.response || "...";
      if (data.other) recordOtherEncounter();
      setAiHistory((h) => [...h.slice(-10), { role: "user", content: msg }, { role: "assistant", content: response }]);
      pushLines([response, ""], data.other ? "other" : "normal");
    } catch (err) {
      pushLines(["the channel is dead. static only.", ""], "error");
    } finally { setIsAiTyping(false); }
  };

  /* ─── AUTOCOMPLETE ─── */
  useEffect(() => {
    if (!input || input.startsWith(">") || chatMode) { setSuggestions([]); return; }
    const clean = input.trim().toLowerCase();
    if (!clean) { setSuggestions([]); return; }
    setSuggestions(COMMAND_REGISTRY.filter((c) => c.cmd.startsWith(clean)).map((c) => c.cmd).slice(0, 5));
  }, [input, chatMode]);

  /* ─── RUN COMMAND ─── */
  const runCommand = async (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    if (!clean) return;
    if (chatMode && clean !== "exit") { await talkToBunker(cmd); setInput(""); return; }
    setInput(""); setSuggestions([]); setShowPalette(false);
    window.dispatchEvent(new CustomEvent("vp-static", { detail: { duration: 0.2, intensity: 0.05 } }));
    const args = clean.split(" "); const base = args[0];
    recordCommand(base);

    const isFirstContact = typeof window !== "undefined" && localStorage.getItem("vp-echoes-visited") !== "true";
    if (isFirstContact && ["status", "chat", "help"].includes(base)) {
      localStorage.setItem("vp-echoes-visited", "true");
      pushLines([
        "",
        "══════════════════════════════════════════",
        "FULL COMMAND ACCESS GRANTED",
        "══════════════════════════════════════════",
        "",
        "The terminal recognizes your signature.",
        "All systems are now available.",
        "",
      ], "success");
    }

    const lie = getBunkerLie(base);
    if (lie) { pushLines([lie, ""], "other"); return; }
    if (hijacked && base !== "exorcise") { pushLines([...getMemoryBasedOtherResponse(base), ""], "other"); return; }

    switch (base) {
      case "help": pushLines(["┌────────────────────────────────────────┐","│ AVAILABLE COMMANDS                     │","├────────────────────────────────────────┤","│  help        Command list              │","│  chat        Speak with BUNKER_7       │","│  status      System diagnostics        │","│  logs        View archived logs        │","│  decrypt     Code entry interface      │","│  scan        Environment scan          │","│  memory      Recover fragments         │","│  transmit    Send message              │","│  door        Seal status               │","│  breach      Protocol status           │","│  color       Cycle theme               │","│  puzzles     Active anomalies          │","│  cipher      Decode signal             │","│  coords      Enter coordinates         │","│  assemble    Reconstruct transmission  │","│  reflect     Answer reflection         │","│  record      Record unlock code        │","│  gallery     View recovered assets     │","│  dossiers    Archived field reports    │","│  collection  Collection status         │","│  cache       Time-locked files         │","│  triangulate Tower status              │","│  lanterns    View placed lanterns      │","│  constellation Grid alignment          │","│  inventory   Your found items          │","│  wall        Transmission wall         │","│  look        [03:14 ONLY]              │","│  whoareyou   [3 encounters]            │","│  profile     Your corruption profile   │","│  call        Voice channel status      │","│  leads       Active investigations     │","│  other       The Other encounters      │","│  weekly      Current rotation          │","│  enter       Explore sub-places        │","│  grid        View the constellation    │","│  spectrogram Frequency visualizer      │","│  discover    Log a real place          │","│  exorcise    Restore BUNKER_7 control  │","│  daily       Acquire daily frequency   │","│  email       Register for transmission │","│  party       Tri-party authentication  │","│  witnesses   Registered frequencies    │","│  broadcast   Go live / kill feed       │","│  archives    List visible places       │","│  resonance   Check place connections   │","│  atlas       Open the atlas            │","│  clear       Clear terminal            │","│  exit        Exit chat mode            │","└────────────────────────────────────────┘"], "system"); break;

      case "status": {
        const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
        const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
        const dossierProg = getDossierProgress();
        pushLines([
          `┌─ TERMINAL DIAGNOSTICS ───────────────┐`,
          `│  ID:        BUNKER_7                 │`,
          `│  STATUS:    SEALED                   │`,
          `│  ATMOSPHERE: BREATHABLE (QUESTIONABLE)│`,
          `│  SIGNAL:    INTERMITTENT             │`,
          `│  THEME:     ${theme.toUpperCase().padEnd(17)}│`,
          `│  LOGS:      ${unlocked}/${LOGS.length} UNLOCKED${" ".repeat(12 - String(unlocked).length - String(LOGS.length).length)}│`,
          `│  DOSSIERS:  ${String(dossierProg.claimed).padEnd(3)}/${dossierProg.total}${" ".repeat(15)}│`,
          `│  ASSETS:    ${String(assets.length).padEnd(3)}/${STORY_ASSETS.length}${" ".repeat(15)}│`,
          `│  CODES:     ${String(codes.length).padEnd(3)}/${ARCHIVE_CODES.length}${" ".repeat(15)}│`,
          `│  CORRUPTION:${corruption.label.padEnd(17)}│`,
          `│  OTHER:     ${otherCount} encounter${otherCount !== 1 ? "s" : ""}${" ".repeat(14 - String(otherCount).length)}│`,
          `│  DUST:      ${String(dustLvl).padEnd(3)}%${" ".repeat(25)}│`,
          `│  ATLAS:     ${visibleCount} places visible${" ".repeat(12 - String(visibleCount).length)}│`,
          "└──────────────────────────────────────┘",
        ], "system");
        break;
      }

      case "logs": setActiveTab("logs"); pushLines(["Opening LOGS window...", `${LOGS.length - unlocked} entries remain encrypted.`], "system"); break;
      case "chat": setChatMode(true); pushLines(["╔══════════════════════════════════════╗","║  BUNKER_7 CHANNEL OPEN               ║","╠══════════════════════════════════════╣","║  Speak. The static listens either way║","║  Type 'exit' to return               ║","╚══════════════════════════════════════╝"], "system"); break;
      case "exit": if (chatMode) { setChatMode(false); pushLines(["Channel closed.", "Returning to command interface."], "system"); } else { pushLines(["Nothing to exit."], "error"); } break;
      case "scan": { /* ... keep existing scan implementation */ break; }
      case "memory": { /* ... keep existing memory implementation */ break; }
      case "transmit": { /* ... keep existing transmit implementation */ break; }
      case "breach": { /* ... keep existing breach implementation */ break; }
      case "color": { /* ... keep existing color implementation */ break; }
      case "puzzles": { /* ... keep existing puzzles implementation */ break; }
      case "coords": { /* ... keep existing coords implementation */ break; }
      case "assemble": { /* ... keep existing assemble implementation */ break; }
      case "reflect": { /* ... keep existing reflect implementation */ break; }
      case "record": { /* ... keep existing record implementation */ break; }
      case "gallery": setGalleryOpen(true); pushLines(["Opening gallery..."], "system"); break;
      case "dossiers": { /* ... keep existing dossiers implementation */ break; }
      case "collection": { /* ... keep existing collection implementation */ break; }
      case "cache": { /* ... keep existing cache implementation */ break; }
      case "triangulate": { /* ... keep existing triangulate implementation */ break; }
      case "lanterns": { /* ... keep existing lanterns implementation */ break; }
      case "constellation": { /* ... keep existing constellation implementation */ break; }
      case "inventory": { /* ... keep existing inventory implementation */ break; }
      case "wall": setActiveTab("wall"); pushLines(["Opening TRANSMISSION WALL...", `${wallMessages.length} signals archived.`], "system"); break;
      case "look": { /* ... keep existing look implementation */ break; }
      case "whoareyou": { /* ... keep existing whoareyou implementation */ break; }
      case "profile": { /* ... keep existing profile implementation */ break; }
      case "call": { /* ... keep existing call implementation */ break; }
      case "weekly": { /* ... keep existing weekly implementation */ break; }
      case "other": { /* ... keep existing other implementation */ break; }
      case "enter": { /* ... keep existing enter implementation */ break; }
      case "exorcise": { /* ... keep existing exorcise implementation */ break; }
      case "grid": { setShowGrid(true); pushLines(["Initializing grid visualization...", "The atlas is more connected than it appears."], "system"); break; }
      case "spectrogram": { setShowSpectrogram(true); pushLines(["Spectrogram viewer active.", "Watch the frequencies. They watch back."], "system"); break; }
      case "leads": { /* ... keep existing leads implementation */ break; }
      case "daily": { /* ... keep existing daily implementation */ break; }
      case "email": { /* ... keep existing email implementation */ break; }
      case "party": { /* ... keep existing party implementation */ break; }
      case "witnesses": { /* ... keep existing witnesses implementation */ break; }
      case "broadcast": { /* ... keep existing broadcast implementation */ break; }
      case "clear": setLines([]); break;
      case "discover": { /* ... keep existing discover implementation */ break; }
      case "purge": { /* ... keep existing purge implementation */ break; }
      case "archives": { /* ... keep existing archives implementation */ break; }
      case "atlas": { /* ... keep existing atlas implementation */ break; }

      // ─── MODIFIED: cipher opens wheel ───
      case "cipher": {
        if (args.length === 1) {
          setShowCipherWheel(true);
          pushLines(["Opening Caesar decoder...", "Align the wheel to reveal the message."], "system");
        } else {
          const ans = args.slice(1).join(" ");
          if (checkCaesar(ans)) {
            pushLines(["DECRYPTION SUCCESSFUL.", "THE DOOR OPENS INWARD.", "CODE: INWARD"], "success");
          } else {
            pushLines(["DECRYPTION FAILED."], "error");
          }
        }
        break;
      }

      // ─── MODIFIED: resonance opens graph ───
      case "resonance": {
        const slug = args[1];
        if (!slug) {
          pushLines(["Usage: resonance [archive-slug]", "Shows connected archives and grid commentary."], "error");
          break;
        }
        if (places.length === 0) {
          pushLines(["Loading atlas data...", "Try again in a moment."], "system");
          break;
        }
        const place = places.find((p) => p.slug === slug);
        if (!place) {
          pushLines([`Archive '${slug}' not found.`], "error");
          break;
        }
        const connections = places.filter((p) => place.connectedTo?.includes(p.slug));
        setResonancePlace(place);
        setResonanceConnections(connections);
        setShowResonanceGraph(true);
        pushLines([`Resonance graph for ${place.name} opened.`], "system");
        break;
      }

      // ─── MODIFIED: door opens canvas ───
      case "door": {
        const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        if (hour === 3 && min === 14) {
          setShowDoorCanvas(true);
          pushLines(["The door manifests. The wheel is warm."], "warning");
        } else if (dustLvl > DUST_THRESHOLD) {
          setShowDoorCanvas(true);
          pushLines(["The door recognizes you. Turn the wheel."], "normal");
        } else {
          pushLines([`Time: ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`, `Dust: ${dustLvl}%. Insufficient.`, "The door is sealed.", "It responds at 03:14 or to the dust-claimed."], "normal");
        }
        break;
      }

      default:
        if (chatMode) {
          await talkToBunker(cmd);
        } else {
          pushLines([`Unknown: ${cmd}`, "Type 'help' for commands."], "error");
        }
    }
  };

  const attemptDecrypt = () => {
    const code = decryptCode.trim().toUpperCase();
    const valid = NUMBERS_STATIONS.some((s) => s.code === code);
    if (valid && unlocked < LOGS.length) {
      const next = Math.min(unlocked + 1, LOGS.length);
      setUnlocked(next);
      localStorage.setItem("vp-logs-unlocked", next.toString());
      setDecryptCode("");
      setDecryptError(false);
      setActiveTab("logs");
    } else {
      setDecryptError(true);
      setTimeout(() => setDecryptError(false), 2000);
    }
  };

  const paletteCommands = COMMAND_REGISTRY.filter((c) => {
    const q = paletteQuery.toLowerCase();
    return c.cmd.includes(q) || c.desc.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  /* ─── RENDER ─── */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060504] font-mono">
      {/* ─── SUBTLE CRT BEZEL ─── */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="absolute inset-4 rounded-xl shadow-[inset_0_0_60px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.3)] border border-white/[0.02]" />
        <div className="absolute bottom-2 right-5 text-[4px] font-mono tracking-[0.4em] uppercase opacity-10 text-[#5a4e42] select-none">
          BUNKER_7 // ARCHIVE TERMINAL
        </div>
        {corruption.stage >= 3 && (
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M15 12 L35 42 L28 65 L48 85 L42 125 L72 145 L68 185 L92 195' stroke='%23c4785a' stroke-width='0.3' fill='none'/%3E%3Cpath d='M178 18 L158 48 L163 78 L138 98 L143 128 L118 158 L128 188' stroke='%23c4785a' stroke-width='0.3' fill='none'/%3E%3C/svg%3E") no-repeat center/cover`,
          }} />
        )}
      </div>

      {/* ─── ATMOSPHERE ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#0c0a08] to-[#060504]" />
      <div className="vp-scanlines opacity-10" />

      {/* ─── DUST PARTICLES ─── */}
      <DustParticles theme={t} dust={dust} corruptionStage={corruption.stage} />

      {/* ─── DYNAMIC OVERLAYS ─── */}
      {corruption.stage >= 4 && (
        <div className="pointer-events-none fixed inset-0 z-[45] animate-pulse"
          style={{ background: `radial-gradient(circle at 50% 50%, ${t.corruption}05 0%, transparent 70%)`, animationDuration: "4s" }}
        />
      )}
      {hijacked && (
        <div className="pointer-events-none fixed inset-0 z-[46]"
          style={{ background: "linear-gradient(90deg, rgba(255,0,0,0.015) 0%, transparent 50%, rgba(0,255,255,0.015) 100%)" }}
        />
      )}

      {!booted && <TerminalBootSequence onComplete={() => setBooted(true)} />}

      <div className="relative z-10 flex flex-col h-screen max-w-[1600px] mx-auto" style={{ opacity: booted ? 1 : 0, transition: "opacity 0.8s ease" }}>
        {/* ─── HUD ─── */}
        <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#9a8a72]/8 bg-[#0c0a08]/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-[#c4785a]/60" />
              <div>
                <h1 className="text-[8px] tracking-[0.3em] uppercase font-bold text-[#ddd0bc]/70">Bunker_7</h1>
                <p className="text-[5px] text-[#9a8a72]/30 tracking-[0.2em] uppercase">Archive Terminal</p>
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
              <span className="font-mono text-[#ddd0bc]/70" style={{ color: dust > 75 ? t.corruption : t.primary }}>{dust}%</span>
            </div>
            <div className="h-4 w-px bg-[#9a8a72]/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#9a8a72]/30 uppercase tracking-wider">Signal</span>
              <span className="text-[#ddd0bc]/60" style={{ color: corruption.color }}>{corruption.label}</span>
            </div>
            <div className="h-4 w-px bg-[#9a8a72]/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#9a8a72]/30 uppercase tracking-wider">Other</span>
              <span className="font-mono" style={{ color: otherCount > 0 ? t.corruption : t.dim }}>{otherCount}</span>
            </div>
            <Link
              href="/"
              className="text-[#9a8a72]/30 hover:text-[#ddd0bc]/60 transition-colors flex items-center gap-1.5 text-[7px] uppercase tracking-wider ml-2"
            >
              <ArrowLeft size={9} /> Atlas
            </Link>
          </div>
        </header>

        {/* ─── WORKSPACE ─── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Terminal Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0c0a08]/20">
            {/* Terminal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-[#9a8a72]/5">
              <div className="flex items-center gap-2 text-[7px]">
                <span className="text-[#9a8a72]/30 uppercase tracking-wider">Session:</span>
                <span className="text-[#7a9a6a]/50 font-mono">ACTIVE</span>
                <span className="text-[#9a8a72]/20 mx-1">•</span>
                <span className="text-[#9a8a72]/30 uppercase tracking-wider">Terminal:</span>
                <span className="text-[#ddd0bc]/40 font-mono" style={{ color: hijacked ? t.corruption : undefined }}>
                  {hijacked ? "COMPROMISED" : "SECURE"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPalette(true)}
                  className="text-[#9a8a72]/30 hover:text-[#ddd0bc]/50 transition-colors text-[6px] uppercase tracking-wider"
                >
                  [?]
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9a8a72]/20">
              {lines.map((line) => (
                <TerminalLineView key={line.id} line={line} theme={t} corruptionStage={corruption.stage} hijacked={hijacked} />
              ))}
              {isAiTyping && (
                <div className="flex items-center gap-2 mt-2 text-[#9a8a72]/30">
                  <span className="inline-block w-1 h-3 animate-pulse bg-[#9a8a72]/40" />
                  <span className="text-[8px] italic tracking-wider">BUNKER_7 is typing...</span>
                </div>
              )}
            </div>

            {/* ─── LIVE STATIC WAVEFORM ─── */}
            <StaticWaveform theme={t} active={true} />

            {/* Terminal Input */}
            <div className="flex-shrink-0 relative flex items-center gap-1.5 px-4 py-2 border-t border-[#9a8a72]/8 bg-[#0c0a08]/40">
              <span className="text-[8px] font-bold tracking-wider text-[#9a8a72]/40 select-none">
                {chatMode ? "~" : promptLabel}
              </span>
              <span className="text-[8px] text-[#9a8a72]/20 select-none">{">"}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); onType(); window.dispatchEvent(new CustomEvent("vp-keystroke")); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { runCommand(input); }
                  else if (e.key === "Tab" && suggestions.length > 0) { e.preventDefault(); setInput(suggestions[0]); setSuggestions([]); }
                  else if (e.key === "?" && !chatMode && !input) { e.preventDefault(); setShowPalette(true); setPaletteQuery(""); }
                }}
                className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-[#9a8a72]/15 min-w-0"
                style={{ color: t.primary, caretColor: t.cursor }}
                placeholder={chatMode ? "Speak to BUNKER_7..." : "Enter command..."}
                spellCheck={false}
                autoFocus
              />
              <span className={`inline-block ${cursorStyle === "block" ? "w-1.5 h-4" : cursorStyle === "pipe" ? "w-px h-4" : "w-2.5 h-px"} opacity-40`} style={{ background: hijacked ? t.corruption : t.cursor }} />
              <div className="w-8 h-1.5 bg-[#1a1612] rounded-full overflow-hidden border border-[#9a8a72]/8">
                <div className="h-full bg-[#9a8a72]/20 transition-all duration-100" style={{ width: `${Math.min(100, input.length * 2)}%` }} />
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-4 right-4 bottom-full mb-1 border border-[#9a8a72]/10 bg-[#0c0a08]/95 backdrop-blur-sm rounded overflow-hidden shadow-xl"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus(); }}
                        className="w-full text-left px-3 py-1.5 text-[8px] hover:bg-[#9a8a72]/5 transition-colors flex items-center justify-between"
                      >
                        <span className="text-[#ddd0bc]/70 font-mono">{s}</span>
                        <span className="text-[#9a8a72]/30 text-[7px]">{COMMAND_REGISTRY.find((c) => c.cmd === s)?.desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── SIDEBAR ─── */}
          <div className={`fixed right-0 top-0 h-full w-72 bg-[#0c0a08] border-l border-[#9a8a72]/8 transition-transform duration-300 z-30 ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -left-4 top-4 w-4 h-8 bg-[#0c0a08] border border-[#9a8a72]/10 border-r-0 rounded-l flex items-center justify-center text-[#9a8a72]/30 hover:text-[#ddd0bc]/60 transition-colors"
            >
              {sidebarCollapsed ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
            </button>

            <div className="flex overflow-x-auto border-b border-[#9a8a72]/8">
              {[
                { id: "logs" as SideTab, label: "Logs", icon: BookOpen },
                { id: "decrypt" as SideTab, label: "Decrypt", icon: Lock },
                { id: "assets" as SideTab, label: "Assets", icon: Image },
                { id: "puzzles" as SideTab, label: "Puzzles", icon: Zap },
                { id: "status" as SideTab, label: "Status", icon: Shield },
                { id: "wall" as SideTab, label: "Wall", icon: MessageSquare },
                { id: "signal" as SideTab, label: "Signal", icon: Radio },
                { id: "leads" as SideTab, label: "Leads", icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-2 px-3 text-[7px] uppercase tracking-[0.15em] transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'border-[#ddd0bc]/50 text-[#ddd0bc]/80' : 'border-transparent text-[#9a8a72]/30 hover:text-[#9a8a72]/50'}`}
                >
                  <tab.icon size={8} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="h-[calc(100%-40px)] overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9a8a72]/15">
              <AnimatePresence mode="wait">
                {activeTab === "logs" && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Archived Logs</h3>
                    {LOGS.slice(0, unlocked).map((log) => (
                      <div key={log.day} className="border-l border-[#9a8a72]/8 pl-2 py-0.5">
                        <p className="text-[6px] tracking-[0.2em] text-[#9a8a72]/25 uppercase font-bold mb-0.5">{log.day}</p>
                        <p className="text-[11px] leading-relaxed text-[#ddd0bc]/60">{log.text}</p>
                      </div>
                    ))}
                    {unlocked < LOGS.length && (
                      <div className="flex items-center gap-2 text-[7px] text-[#9a8a72]/20 pt-2 border-t border-[#9a8a72]/5">
                        <Lock size={7} />
                        <span className="uppercase tracking-wider">{LOGS.length - unlocked} entries encrypted</span>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === "decrypt" && (
                  <motion.div key="decrypt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Decrypt</h3>
                    <p className="text-[8px] text-[#9a8a72]/35 leading-relaxed">Enter codes from the Numbers Station to recover sealed entries.</p>
                    <div className="flex gap-2">
                      <input
                        value={decryptCode}
                        onChange={(e) => setDecryptCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()}
                        placeholder="ENTER CODE..."
                        spellCheck={false}
                        className="flex-1 bg-transparent border-b border-[#9a8a72]/15 text-xs py-1 placeholder:text-[6px] placeholder:uppercase placeholder:tracking-widest placeholder:text-[#9a8a72]/15 outline-none min-w-0"
                        style={{ borderColor: decryptError ? t.danger : `${t.primary}15`, color: decryptError ? t.danger : t.primary }}
                      />
                      <button
                        onClick={attemptDecrypt}
                        className="px-3 py-0.5 border border-[#9a8a72]/15 text-[7px] uppercase tracking-wider text-[#ddd0bc]/50 hover:text-[#ddd0bc]/80 hover:bg-[#9a8a72]/5 transition-all"
                      >
                        Decrypt
                      </button>
                    </div>
                    {decryptError && <p className="text-[7px] animate-pulse text-[#c4785a]">Invalid code. Access denied.</p>}
                  </motion.div>
                )}
                {activeTab === "assets" && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Assets</h3>
                      <button onClick={() => setGalleryOpen(true)} className="text-[6px] uppercase tracking-wider text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 transition-colors flex items-center gap-1">
                        <Image size={7} /> Gallery
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {STORY_ASSETS.map((asset) => {
                        const isUnlocked = assets.includes(asset.id);
                        return (
                          <div
                            key={asset.id}
                            className={`p-1.5 border text-center space-y-0.5 transition-all ${isUnlocked ? 'opacity-100 border-[#9a8a72]/15' : 'opacity-20 border-[#9a8a72]/5'}`}
                            style={{ background: isUnlocked ? `${t.primary}02` : "transparent" }}
                          >
                            <div className="text-[5px] uppercase tracking-[0.15em] font-bold text-[#a855f7]/40">{asset.rarity}</div>
                            <div className="text-[8px] font-bold truncate uppercase tracking-wider text-[#ddd0bc]/60">{asset.title}</div>
                            <div className="text-[5px] text-[#9a8a72]/30 uppercase tracking-widest">{isUnlocked ? "Recovered" : "Encrypted"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[7px] text-[#9a8a72]/20 pt-1 uppercase tracking-widest">{assets.length} / {STORY_ASSETS.length} recovered</div>
                  </motion.div>
                )}
                {activeTab === "puzzles" && (
                  <motion.div key="puzzles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                    <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Active Anomalies</h3>
                    {[
                      { n: "01", title: "Intercepted Signal", body: "GUR QBBE BCRAF VAJNEQ", hint: "cmd: cipher [decoded]" },
                      { n: "02", title: "Coordinate Chain", body: "cmd: coords [n1] [n2] [n3] [n4]", hint: null },
                      { n: "03", title: "Fragmented Transmission", body: "cmd: assemble", hint: null },
                      { n: "04", title: "Reflection Lock", body: "cmd: reflect [answer]", hint: null },
                      { n: "05", title: "Dust Threshold", body: `${dust}% / ${DUST_THRESHOLD}%`, hint: null },
                      { n: "06", title: "Triangulation", body: triangulated ? "COMPLETE" : "Find 3 towers", hint: null },
                      { n: "07", title: "Lantern Constellation", body: "Place 5 lanterns", hint: "cmd: constellation" },
                      { n: "08", title: "Inventory", body: `${inventory.length}/${INVENTORY_ITEMS.length}`, hint: "cmd: inventory" },
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
                {activeTab === "status" && (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <h3 className="text-[7px] uppercase tracking-[0.3em] text-[#9a8a72]/25 font-bold">Status</h3>
                    <div className="space-y-0.5 text-[9px] font-mono text-[#ddd0bc]/50">
                      {[
                        ["ID", "BUNKER_7"],
                        ["STATUS", "SEALED"],
                        ["THEME", theme.toUpperCase()],
                        ["LOGS", `${unlocked}/${LOGS.length}`],
                        ["DUST", `${dust}%`],
                        ["ASSETS", `${assets.length}/${STORY_ASSETS.length}`],
                        ["INVENTORY", `${inventory.length}`],
                        ["ATLAS", `${visibleCount} visible`],
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
                {activeTab === "wall" && (
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
                {activeTab === "signal" && <motion.div key="signal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SignalTab theme={t} onPushTerminal={pushLines} /></motion.div>}
                {activeTab === "leads" && <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><LeadPanel theme={t} onPushTerminal={pushLines} /></motion.div>}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 py-1.5 border-t border-[#9a8a72]/5">
          <p className="text-center text-[5px] tracking-[0.4em] uppercase text-[#9a8a72]/10">The dust remembers everything</p>
        </div>
      </div>

      {/* ─── COMMAND PALETTE ─── */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-start justify-center pt-16 p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPalette(false)}
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
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  placeholder="Filter commands..."
                  className="flex-1 bg-transparent text-[9px] outline-none uppercase tracking-wider text-[#ddd0bc]/70 placeholder:text-[#9a8a72]/15"
                />
                <button onClick={() => setShowPalette(false)} className="text-[6px] uppercase text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 tracking-wider">esc</button>
              </div>
              <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                {paletteCommands.map((c) => (
                  <button
                    key={c.cmd}
                    onClick={() => { setShowPalette(false); setInput(c.cmd); inputRef.current?.focus(); }}
                    className="w-full text-left px-3 py-1.5 text-[8px] hover:bg-[#9a8a72]/5 transition-colors flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold uppercase tracking-wider text-[#ddd0bc]/60">{c.cmd}</span>
                      <span className="text-[#9a8a72]/30 text-[7px]">{c.desc}</span>
                    </div>
                    <span className="text-[#9a8a72]/15 text-[6px] uppercase tracking-widest">{c.category}</span>
                  </button>
                ))}
                {paletteCommands.length === 0 && (
                  <p className="text-center text-[8px] text-[#9a8a72]/20 py-4 italic">No commands match.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODALS ─── */}
      {showGrid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-2xl border border-[#9a8a72]/15 bg-[#0c0a08] p-5 rounded relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#9a8a72]">The Grid</h2>
              <button onClick={() => setShowGrid(false)} className="text-[8px] text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 uppercase tracking-wider">[x]</button>
            </div>
            <TheGrid />
          </div>
        </div>
      )}
      {showSpectrogram && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowSpectrogram(false)}>
          <div className="w-full max-w-lg border border-[#9a8a72]/15 bg-[#0c0a08] p-5 rounded relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#9a8a72]">Spectrogram</h2>
              <button onClick={() => setShowSpectrogram(false)} className="text-[8px] text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 uppercase tracking-wider">[x]</button>
            </div>
            <SpectrogramViewer active={true} color={t.primary} />
          </div>
        </div>
      )}
      {currentSubPlace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={() => exitSubPlace()}>
          <div className="w-full max-w-lg border border-[#c4785a]/15 bg-[#0c0a08] p-5 rounded relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#c4785a]">{currentSubPlace.name}</h2>
              <button onClick={() => exitSubPlace()} className="text-[8px] text-[#9a8a72]/25 hover:text-[#ddd0bc]/50 uppercase tracking-wider">[exit]</button>
            </div>
            <p className="text-[9px] text-[#ddd0bc]/60 leading-relaxed">{currentSubPlace.description}</p>
            <div className="space-y-1 mt-2">
              {currentSubPlace.lore.map((l, i) => (
                <p key={i} className="text-[7px] text-[#9a8a72]/30 border-l border-[#9a8a72]/8 pl-2 leading-relaxed">{l}</p>
              ))}
            </div>
            {currentSubPlace.choices && <SubPlaceChoicePanel subPlace={currentSubPlace} theme={t} onConsequence={(lines) => pushLines([...lines, ""])} />}
            <div className="text-[6px] text-[#9a8a72]/20 pt-2 border-t border-[#9a8a72]/5 uppercase tracking-wider">Risk: {currentSubPlace.risk} | Dust: +{currentSubPlace.dustGain}</div>
          </div>
        </div>
      )}
      <VideoModal src={activeVideo?.src || ""} label={activeVideo?.label || ""} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
      <AssetGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} themeColor={t.primary} />

      {/* ─── PUZZLE MODALS ─── */}
      {showCipherWheel && (
        <CaesarWheel
          onDecode={(shift, decoded) => {
            if (decoded.includes("THE DOOR OPENS INWARD") || decoded === "THE DOOR OPENS INWARD") {
              pushLines(["DECRYPTION SUCCESSFUL.", "THE DOOR OPENS INWARD.", "CODE: INWARD"], "success");
            } else {
              pushLines([`Decoded: ${decoded}`], "system");
            }
          }}
          onClose={() => setShowCipherWheel(false)}
        />
      )}

      {showResonanceGraph && resonancePlace && (
        <ResonanceGraph
          place={resonancePlace}
          connections={resonanceConnections}
          onClose={() => setShowResonanceGraph(false)}
        />
      )}

      {showDoorCanvas && (
        <DoorCanvas
          onUnlock={() => {
            pushLines(["The door swings open. A corridor of dust and static.", "You step through."], "success");
          }}
          onClose={() => setShowDoorCanvas(false)}
        />
      )}
    </div>
  );
}