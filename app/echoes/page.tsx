"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Terminal, Play, Lock, Image, BookOpen, Shield, Zap,
  ArrowLeft, MessageSquare, Target, Activity, Clock, ChevronRight,
  HelpCircle, Eye, X, FileText,
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
import { evaluateUnlock } from "@/lib/unlock-engine";
import type { Place } from "@/types";

/* ─── THEMES ─── */
const THEMES = {
  tungsten: {
    primary: "#ddd0bc", bg: "#0c0a08", glow: "rgba(221,208,188,0.1)",
    accent: "#9a8a72", dim: "#5a4e42", cursor: "#ddd0bc",
    phosphor: "#e8dcc8", corruption: "#c4785a", danger: "#8a3a2a",
  },
  amber: {
    primary: "#e8d5c0", bg: "#0c0a08", glow: "rgba(232,213,192,0.12)",
    accent: "#c4a882", dim: "#6a5a4a", cursor: "#e8d5c0",
    phosphor: "#f0e0d0", corruption: "#c4785a", danger: "#8a3a2a",
  },
  cyan: {
    primary: "#a8c8c8", bg: "#080a0a", glow: "rgba(168,200,200,0.1)",
    accent: "#6a9898", dim: "#4a6a6a", cursor: "#a8c8c8",
    phosphor: "#c8e0e0", corruption: "#c4785a", danger: "#8a3a2a",
  },
  ember: {
    primary: "#e8c8b8", bg: "#120a08", glow: "rgba(232,200,184,0.1)",
    accent: "#c4785a", dim: "#8a5a4a", cursor: "#e8c8b8",
    phosphor: "#f0dcd0", corruption: "#c4785a", danger: "#a03020",
  },
  white: {
    primary: "#d0d0d0", bg: "#0a0a0a", glow: "rgba(208,208,208,0.1)",
    accent: "#a0a0a0", dim: "#707070", cursor: "#d0d0d0",
    phosphor: "#e0e0e0", corruption: "#c4785a", danger: "#8a3a2a",
  },
  phosphor: {
    primary: "#b8d8a8", bg: "#050805", glow: "rgba(184,216,168,0.1)",
    accent: "#6a9a5a", dim: "#4a6a3a", cursor: "#b8d8a8",
    phosphor: "#c8e8b8", corruption: "#c4785a", danger: "#8a3a2a",
  },
  abyss: {
    primary: "#88a8c0", bg: "#020508", glow: "rgba(136,168,192,0.12)",
    accent: "#5e7a9c", dim: "#4a5a6a", cursor: "#88a8c0",
    phosphor: "#a0c0d8", corruption: "#c4785a", danger: "#8a3a2a",
  },
  emergency: {
    primary: "#ff8a7a", bg: "#1a0806", glow: "rgba(255,138,122,0.1)",
    accent: "#e06050", dim: "#9a4a3a", cursor: "#ff8a7a",
    phosphor: "#ffb0a0", corruption: "#c4785a", danger: "#c02010",
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
];

/* ─── HELPERS ─── */
function ProgressBar({ value, max, color, trackColor }: { value: number; max: number; color: string; trackColor?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-20 h-1.5 rounded-full overflow-hidden border" style={{ borderColor: trackColor || `${color}30`, background: `${color}10` }}>
      <motion.div className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30" />
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
      className="whitespace-pre-wrap font-mono text-[15px] leading-[1.7]"
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

/* ─── MAIN ─── */
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

  const { unlocked: unlockedSubPlaces, current: currentSubPlace, enter: enterSubPlace, exit: exitSubPlace } = useSubPlaces(dust, inventory, codes);

  /* INIT */
  useEffect(() => {
    markEchoesVisited();
    accumulateDust(10);
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
  }, []);

  /* HIJACK — tiered by encounter count */
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

  /* GHOST LINES — tiered by encounter count */
  useEffect(() => {
    if (chatMode || hijacked) return;
    const interval = setInterval(() => {
      if (shouldTriggerOther("ghost") && Math.random() < 0.15) {
        const tier = getGhostTier(otherCount);
        const linesArr = TIER_GHOST_LINES[tier];
        const effectiveTier = (tier > 1 && Math.random() < 0.2) ? tier - 1 : tier;
        const line = TIER_GHOST_LINES[effectiveTier][Math.floor(Math.random() * TIER_GHOST_LINES[effectiveTier].length)];
        pushLines([line, ""], "ghost");
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [chatMode, hijacked, otherCount]);

  /* SCROLL */
  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [lines, isAiTyping]);

  /* IDLE GHOST */
  useIdleGhost((line) => { if (!chatMode && !input) pushLines([line, ""], "ghost"); });

  /* CURSOR MUTATION */
  useEffect(() => {
    if (corruption.stage >= 3) {
      const interval = setInterval(() => {
        const styles: Array<"block" | "underscore" | "pipe"> = ["block", "underscore", "pipe"];
        setCursorStyle(styles[Math.floor(Math.random() * styles.length)]);
      }, 4000);
      return () => clearInterval(interval);
    } else { setCursorStyle("underscore"); }
  }, [corruption.stage]);

  /* PROMPT LABEL */
  useEffect(() => {
    if (hijacked) setPromptLabel("OTHER");
    else if (chatMode) setPromptLabel("BUNKER_7");
    else setPromptLabel("BUNKER_7");
  }, [hijacked, chatMode]);

  /* HELPERS */
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

  /* AUTOCOMPLETE */
  useEffect(() => {
    if (!input || input.startsWith(">") || chatMode) { setSuggestions([]); return; }
    const clean = input.trim().toLowerCase();
    if (!clean) { setSuggestions([]); return; }
    setSuggestions(COMMAND_REGISTRY.filter((c) => c.cmd.startsWith(clean)).map((c) => c.cmd).slice(0, 5));
  }, [input, chatMode]);

  /* RUN COMMAND */
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
      case "help": pushLines(["┌────────────────────────────────────────┐","│ AVAILABLE COMMANDS                     │","├────────────────────────────────────────┤","│  help        Command list              │","│  chat        Speak with BUNKER_7       │","│  status      System diagnostics        │","│  logs        View archived logs        │","│  decrypt     Code entry interface      │","│  scan        Environment scan          │","│  memory      Recover fragments         │","│  transmit    Send message              │","│  door        Seal status               │","│  breach      Protocol status           │","│  color       Cycle theme               │","│  puzzles     Active anomalies          │","│  cipher      Decode signal             │","│  coords      Enter coordinates         │","│  assemble    Reconstruct transmission  │","│  reflect     Answer reflection         │","│  record      Record unlock code        │","│  gallery     View recovered assets     │","│  dossiers    Archived field reports    │","│  collection  Collection status         │","│  cache       Time-locked files         │","│  triangulate Tower status              │","│  lanterns    View placed lanterns      │","│  constellation Grid alignment          │","│  inventory   Your found items          │","│  wall        Transmission wall         │","│  look        [03:14 ONLY]              │","│  whoareyou   [3 encounters]            │","│  profile     Your corruption profile   │","│  call        Voice channel status      │","│  leads       Active investigations     │","│  other       The Other encounters      │","│  weekly      Current rotation          │","│  enter       Explore sub-places        │","│  grid        View the constellation    │","│  spectrogram Frequency visualizer      │","│  discover    Log a real place          │","│  exorcise    Restore BUNKER_7 control  │","│  daily       Acquire daily frequency   │","│  email       Register for transmission │","│  party       Tri-party authentication  │","│  witnesses   Registered frequencies    │","│  broadcast   Go live / kill feed       │","│  clear       Clear terminal            │","│  exit        Exit chat mode            │","└────────────────────────────────────────┘"], "system"); break;

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
          "└──────────────────────────────────────┘",
        ], "system");
        break;
      }

      case "logs": setActiveTab("logs"); pushLines(["Opening LOGS window...", `${LOGS.length - unlocked} entries remain encrypted.`], "system"); break;

      case "chat": setChatMode(true); pushLines(["╔══════════════════════════════════════╗","║  BUNKER_7 CHANNEL OPEN               ║","╠══════════════════════════════════════╣","║  Speak. The static listens either way║","║  Type 'exit' to return               ║","╚══════════════════════════════════════╝"], "system"); break;

      case "exit": if (chatMode) { setChatMode(false); pushLines(["Channel closed.", "Returning to command interface."], "system"); } else { pushLines(["Nothing to exit."], "error"); } break;

      case "scan": {
        const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
        const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
        const count = visits.length;
        const last = visits.length > 0 ? visits[visits.length - 1] : null;
        const lastName = last ? last.name : "None recorded";
        const lastTime = last ? last.addedAt || Date.now() : null;
        const ago = lastTime ? Math.floor((Date.now() - new Date(lastTime).getTime()) / 3600000) : "unknown";
        const fragments = JSON.parse(localStorage.getItem("vp-fragments") || "[]");
        pushLines([
          `┌─ ENVIRONMENT SCAN ───────────────────┐`,
          `│  Dust accumulation: ${String(dustLvl).padEnd(3)}%           │`,
          `│  Documented sites:  ${String(count).padEnd(3)}           │`,
          `│  Last contact:      ${lastName.slice(0,20).padEnd(20)}  │`,
          `│  Hours since:       ${String(ago).padEnd(10)}      │`,
          `│  Fragments:         ${String(fragments.length).padEnd(3)}           │`,
          dustLvl > DUST_THRESHOLD ? "│  [!] DUST LEVELS CRITICAL            │" : "│  Dust levels nominal                 │",
          "└──────────────────────────────────────┘",
        ], "normal");
        break;
      }

      case "memory": { const allFrags = ["FRAG_01: ...the coordinates were wrong...","FRAG_02: ...someone else was using the cursor...","FRAG_03: ...the dust level read higher than possible...","FRAG_04: ...a door opened that wasn't on the schematic...","FRAG_05: ...the atlas updated itself at 03:14...","FRAG_06: ...i heard typing from the next terminal...","FRAG_07: [CORRUPTED]","FRAG_08: ...the green light pulsed in morse code...","FRAG_09: ...a photograph with no negative...","FRAG_10: ...the silence had a rhythm...","FRAG_11: ...coordinates pointing to the ocean floor...","FRAG_12: ...the atlas completed itself...","FRAG_13: ...a voice that sounded like mine...","FRAG_14: ...the dust spelled a name i recognized..."]; const saved = JSON.parse(localStorage.getItem("vp-fragments") || "[]"); const newFrags = allFrags.filter((f) => !saved.includes(f.split(":")[0])); if (newFrags.length > 0) { const pick = newFrags[Math.floor(Math.random() * newFrags.length)]; const id = pick.split(":")[0]; saved.push(id); localStorage.setItem("vp-fragments", JSON.stringify(saved)); pushLines(["RECOVERING FRAGMENT...", pick, "Stored."], "success"); } else { pushLines(["No new fragments.", "Visit more ruins."], "normal"); } break; }

      case "transmit": { const msg = args.slice(1).join(" "); if (!msg) { pushLines(["Usage: transmit [message]", "All transmissions monitored."], "error"); } else { const key = "vp-transmissions"; const existing = JSON.parse(localStorage.getItem(key) || "[]"); existing.push({ text: msg, date: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(existing)); const wall = JSON.parse(localStorage.getItem("vp-wall") || "[]"); wall.push({ text: msg, date: new Date().toLocaleTimeString() }); localStorage.setItem("vp-wall", JSON.stringify(wall.slice(-50))); setWallMessages(wall.slice(-50)); synchronizeReadings(); if (msg.toLowerCase().replace(/[^a-z]/g, "") === TRIGGER_PHRASE.replace(/[^a-z]/g, "")) { pushLines(["TRANSMITTING...", "SIGNAL INTERCEPTED BY UNKNOWN SOURCE.", "RESPONSE: 'We know you're still there.'", "The channel is no longer one-way."], "other"); } else { pushLines(["TRANSMITTING...", "Signal sent into static."], "normal"); } } break; }

      case "door": { const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10); const now = new Date(); const hour = now.getHours(); const min = now.getMinutes(); if (hour === 3 && min === 14) { pushLines(["╔══════════════════════════════════════╗","║  03:14 DETECTED                      ║","║  The door is warm.                     ║","║  Something pushes from the other side. ║","╚══════════════════════════════════════╝"], "warning"); } else if (dustLvl > DUST_THRESHOLD) { pushLines([`Dust level: ${dustLvl}%. Threshold exceeded.`, "The door recognizes you.", "It opens inward. Not out.", "You could enter. But you won't come back the same."], "normal"); } else { pushLines([`Time: ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`, `Dust: ${dustLvl}%. Insufficient.`, "The door is sealed.", "It responds at 03:14 or to the dust-claimed."], "normal"); } break; }

      case "breach": if (breachActive) { pushLines(["╔══════════════════════════════════════╗","║  BREACH PROTOCOL ACTIVE              ║","║  Perimeter compromised.              ║","║  Route: /breach                        ║","║  You are marked as witness.            ║","╚══════════════════════════════════════╝"], "warning"); } else if (breachCountdown) { pushLines(["Breach pending.", `Estimated: ${breachCountdown}`, "Stand by."], "normal"); } else { pushLines(["No breach on schedule."], "normal"); } break;

      case "color": { const keys = Object.keys(THEMES) as ThemeKey[]; const idx = keys.indexOf(theme); const next = keys[(idx + 1) % keys.length]; setTheme(next); localStorage.setItem("vp-theme", next); pushLines([`Theme: ${next.toUpperCase()}`, "The phosphor shifts."], "success"); break; }

      case "puzzles": pushLines(["ACTIVE ANOMALIES:","  [01] Intercepted Signal    — cmd: cipher","  [02] Coordinate Chain      — cmd: coords","  [03] Fragmented Transmission — cmd: assemble","  [04] Reflection Lock       — cmd: reflect","  [05] Dust Threshold        — automatic","  [06] Triangulation         — cmd: triangulate","  [07] Lantern Constellation — cmd: constellation","  [08] Inventory             — cmd: inventory","","Type the command name to engage."], "system"); break;

      case "cipher": { const ans = args.slice(1).join(" "); if (!ans) { pushLines(["Usage: cipher [text]", "Intercepted: GUR QBBE BCRAF VAJNEQ"], "error"); } else if (checkCaesar(ans)) { pushLines(["DECRYPTION SUCCESSFUL.", "THE DOOR OPENS INWARD.", "CODE: INWARD"], "success"); } else { pushLines(["DECRYPTION FAILED."], "error"); } break; }

      case "coords": { const nums = args.slice(1).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)); if (nums.length !== 4) { pushLines(["Usage: coords [n1] [n2] [n3] [n4]", ...COORDINATE_FRAGMENTS.map((f) => `  ${f.source}: ${f.text}`)], "error"); } else if (checkCoordinates(nums)) { pushLines(["COORDINATES VERIFIED.", "38°74' N — impossible location.", "CODE: BREATHE"], "success"); } else { pushLines(["COORDINATES REJECTED.", `Entered: ${nums.join(", ")}`], "error"); } break; }

            case "assemble": { const frags = JSON.parse(localStorage.getItem("vp-fragments") || "[]"); if (checkAssembly(frags)) { pushLines(["ASSEMBLY COMPLETE.", ...ASSEMBLED_MESSAGE.split(". ").map((s) => s.trim() + "."), "CODE: ASSEMBLY-314"], "success"); } else { pushLines([`Fragments: ${frags.length}/5`, "Missing: " + ["FRAG_01","FRAG_03","FRAG_07","FRAG_12","FRAG_14"].filter((f) => !frags.includes(f)).join(", ")], "normal"); } break; }

      case "reflect": { const ans = args.slice(1).join(" ").toLowerCase().replace(/[^a-z]/g, ""); if (!ans) { pushLines(["Usage: reflect [answer]", "What do you see?"], "error"); } else if (checkReflection(ans)) { pushLines(["REFLECTION CONFIRMED.", "You see what I see. Unfortunate.", "CODE: MIRROR"], "success"); } else { pushLines(["REFLECTION MISMATCH."], "error"); } break; }

      case "record": {
        const code = args.slice(1).join(" ").toUpperCase();
        if (!code) {
          pushLines(["Usage: record [CODE]"], "error");
          break;
        }
        const entry = getCodeEntry(code);
        if (!entry) {
          pushLines(["INVALID CODE."], "error");
          break;
        }
        const alreadyRecorded = getFoundCodes().includes(code);
        const asset = entry.type === "asset" ? STORY_ASSETS.find((a) => a.id === entry.rewardId) : null;
        const conditionCheck = asset ? checkAssetCondition(asset.condition) : { blocked: false };

        if (entry.type === "asset" && alreadyRecorded) {
          if (conditionCheck.blocked) {
            pushLines(
              ["CODE ALREADY RECORDED.", `ASSET: ${asset?.title || "UNKNOWN"}`, "STATUS: CONDITIONAL HOLD ACTIVE", conditionCheck.message || ""],
              "warning"
            );
          } else {
            const newlyUnlocked = unlockAsset(entry.rewardId);
            if (newlyUnlocked) {
              pushLines(
                ["CONDITIONS MET.", `ASSET UNLOCKED: ${asset?.title || "UNKNOWN"}`, `Rarity: ${(asset?.rarity || "unknown").toUpperCase()}`, "The archive grows."],
                "success"
              );
              setAssets(getUnlockedAssets());
            } else {
              pushLines(["ALREADY RECOVERED.", asset?.description || ""], "normal");
            }
          }
          break;
        }

        recordCode(code);

        if (entry.type === "asset") {
          if (conditionCheck.blocked) {
            pushLines(
              ["CODE ACCEPTED.", `ASSET: ${asset?.title || "UNKNOWN"}`, "STATUS: CONDITIONAL HOLD", conditionCheck.message || "", "Return when requirements are cleared."],
              "warning"
            );
          } else {
            unlockAsset(entry.rewardId);
            pushLines(
              ["CODE ACCEPTED.", `Recovered: ${asset?.title || entry.rewardId}`, `Rarity: ${(asset?.rarity || "unknown").toUpperCase()}`],
              "success"
            );
            setActiveTab("assets");
            synchronizeReadings();
          }
        } else if (entry.type === "theme") {
          if (THEMES[entry.rewardId as ThemeKey]) {
            setTheme(entry.rewardId as ThemeKey);
            localStorage.setItem("vp-theme", entry.rewardId);
          }
          pushLines([`Theme: ${entry.rewardId.toUpperCase()}`], "success");
        } else if (entry.type === "cache_key") {
          localStorage.setItem("vp-cache-key", "true");
          pushLines(["CACHE-KEY acquired."], "success");
        } else if (entry.type === "lore") {
          pushLines(["Lore fragment added.", entry.description || ""], "success");
        } else if (entry.type === "command") {
          pushLines([`Command: ${entry.rewardId}`, "Unlocked."], "success");
        }
        break;
      }

      case "gallery": setGalleryOpen(true); pushLines(["Opening gallery..."], "system"); break;

      case "dossiers": {
        const { claimed, total, percent } = getDossierProgress();
        const list = getClaimedDossierList();
        pushLines([
          "┌─ FIELD REPORT ARCHIVE ───────────────┐",
          `│  Archived:  ${String(claimed).padEnd(3)} / ${total}${" ".repeat(15)}│`,
          `│  Complete:  ${String(percent).padEnd(3)}%${" ".repeat(19)}│`,
          "└──────────────────────────────────────┘",
          ...(list.length > 0 ? ["", "RECOVERED REPORTS:", ...list.map((d) => `  [${d.rarity.toUpperCase()}] ${d.title} — ${d.location}`), ""] : ["", "No reports archived.", "Visit dossiers on the atlas to claim them.", ""]),
        ], "system");
        break;
      }

      case "collection": { const assetsList = getUnlockedAssets(); const codesList = getFoundCodes(); const dossierProg = getDossierProgress(); pushLines(["┌─ COLLECTION STATUS ──────────────────┐",`│  Assets:    ${String(assetsList.length).padEnd(3)} / ${STORY_ASSETS.length}${" ".repeat(15)}│`,`│  Codes:     ${String(codesList.length).padEnd(3)} / ${ARCHIVE_CODES.length}${" ".repeat(15)}│`,`│  Dossiers:  ${String(dossierProg.claimed).padEnd(3)} / ${dossierProg.total}${" ".repeat(15)}│`,`│  Complete:  ${String(Math.floor(((assetsList.length + codesList.length + dossierProg.claimed) / (STORY_ASSETS.length + ARCHIVE_CODES.length + dossierProg.total)) * 100)).padEnd(3)}%${" ".repeat(19)}│`,"└──────────────────────────────────────┘"], "system"); break; }

      case "cache": { const hasKey = localStorage.getItem("vp-cache-key") === "true"; const now = new Date(); const is314Now = now.getHours() === 3 && now.getMinutes() === 14; const unlockedCache = hasKey || is314Now; pushLines(["┌─ SECURE CACHE ───────────────────────┐","│  FILE_00: I can see when you will    │","│           return. I hope I'm wrong.   │",unlockedCache ? "│  [11 ADDITIONAL FILES UNLOCKED]      │" : "│  [11 FILES SEALED — UNLOCKS 03:14]   │","└──────────────────────────────────────┘"], "system"); if (unlockedCache) { pushLines(["FILE_01: Atlas completed before abandonment.","FILE_02: BUNKER_3 responded once. Then silence.","FILE_03: The dust is dead skin and time.","FILE_04: I found a photo of myself smiling.","FILE_05: 38°74' N does not exist.","FILE_06: Someone uses my cursor.","FILE_07: The door at 03:14 is a mouth.","FILE_08: Previous archivist's notes — my handwriting.","FILE_09: Signal from inside the database.","FILE_10: You have been here before.","FILE_11: Dust spells your name.","",is314Now ? "You came at the right time. No one does." : "Cache key bypass active."], "normal"); } break; }

      case "triangulate": if (!triangulated) { pushLines(["INSUFFICIENT DATA.", "Find 3 signal towers on atlas."], "error"); } else { pushLines(["TRIANGULATION COMPLETE.", "Origin: Your sector.", "The bunker is closer than you think.", "CODE: TRIANGULATE"], "success"); } break;

      case "lanterns": {
        const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
        if (lanterns.length === 0) {
          pushLines([
            "No lanterns detected on the grid.",
            "Place them on the atlas. They burn in the dark.",
            "cmd: Go to atlas → 'Lanterns' → 'Place' → click a ruin.",
          ], "normal");
        } else {
          pushLines([
            `DETECTED: ${lanterns.length} lantern${lanterns.length > 1 ? "s" : ""}`,
            ...lanterns.map((l: any) => `  ${l.placeName} — "${l.message || "No message"}"`),
            "",
            "The grid remembers light.",
          ], "normal");
        }
        break;
      }

      case "constellation": { const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]"); if (lanterns.length < 5) { pushLines([`Constellation incomplete.`,`Lanterns placed: ${lanterns.length}/5`,"Place 5 lanterns on the atlas to align the grid."], "normal"); } else { pushLines(["╔══════════════════════════════════════╗","║  CONSTELLATION ALIGNED               ║","╠══════════════════════════════════════╣","║  5 points of light. The grid holds.  ║","║  Legendary code: STAR-CHART-7        ║","║  The archivist used to map stars.    ║","║  Now he maps dust.                   ║","╚══════════════════════════════════════╝"], "success"); } break; }

      case "inventory": { const inv = getInventory(); if (inv.length === 0) { pushLines(["Your pockets are empty.", "Visit ruins on the atlas. The dust leaves things behind."], "normal"); } else { pushLines([`CARRYING: ${inv.length} item${inv.length > 1 ? "s" : ""}`,...inv.map((id) => { const item = INVENTORY_ITEMS.find((i) => i.id === id); return `  ${item?.icon || "•"} ${item?.name || id} — ${item?.desc || ""}`; }),"","BUNKER_7 is watching your collection."], "normal"); } break; }

      case "wall": setActiveTab("wall"); pushLines(["Opening TRANSMISSION WALL...", `${wallMessages.length} signals archived.`], "system"); break;

      case "look": { if (!is314) { pushLines(["Command unavailable.", "The dark is not deep enough.", "Return at 03:14."], "error"); } else { const visions = ["A corridor that wasn't there before. The walls are breathing.","Your reflection in a dark monitor. It blinks when you don't.","Coordinates: 38°74.000'N, 000°00.000'E. The ocean floor.","A photograph of you, smiling, timestamped 1987.","BUNKER_3. The door is open. Someone is typing."]; const v = visions[Math.floor(Math.random() * visions.length)]; pushLines(["╔══════════════════════════════════════╗","║  03:14 VISION                        ║","╠══════════════════════════════════════╣",`║  ${v.padEnd(36)}║`,"╚══════════════════════════════════════╝"], "warning"); } break; }

      case "whoareyou": { if (otherCount < 3) { pushLines([`The Other has spoken ${otherCount} time${otherCount !== 1 ? "s" : ""}.`, "It does not answer to names.", "Keep listening."], "normal"); } else { pushLines(["╔══════════════════════════════════════╗","║  I AM THE STATIC BETWEEN THOUGHTS    ║","║  I AM THE DUST THAT REMEMBERS        ║","║  I AM WHAT WAS HERE BEFORE THE ARCHIVIST ║","║  AND WHAT WILL REMAIN AFTER           ║","╠══════════════════════════════════════╣","║  You have heard me 3 times.          ║","║  That is enough.                     ║","╚══════════════════════════════════════╝","","BUNKER_7 has gone quiet."], "other"); } break; }

      case "profile": { const dustLvl = localStorage.getItem("vp-dust-accumulation") || "0"; const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]"); const echoes = localStorage.getItem("vp-echoes-visited") === "true"; const dustNum = parseInt(dustLvl); let designation = "OBSERVER"; if (dustNum > 75 && echoes) designation = "ARCHIVIST"; else if (dustNum > 50 && echoes) designation = "CONTAMINATED"; else if (dustNum > 25 && echoes) designation = "CORRESPONDENT"; else if (echoes) designation = "WITNESS"; pushLines(["┌─ PROFILE ────────────────────────────┐",`│  Designation: ${designation.padEnd(24)}│`,`│  Dust:        ${String(dustLvl).padEnd(3)}%${" ".repeat(23)}│`,`│  Sites:       ${String(visits.length).padEnd(3)}${" ".repeat(24)}│`,`│  Echoes:      ${echoes ? "YES" : "NO"}${" ".repeat(25)}│`,`│  Towers:      ${triangulated ? "YES" : "NO"}${" ".repeat(25)}│`,"└──────────────────────────────────────┘"], "system"); break; }

      case "call": { const now = new Date(); const hour = now.getHours(); const isOpen = hour >= 3 && hour < 4; pushLines(["╔══════════════════════════════════════╗","║  VOICE CHANNEL                       ║","╠══════════════════════════════════════╣","║  Number: +1-503-825-0190             ║","║  Hours: 03:00 — 04:00 local time     ║",`║  Status: ${isOpen ? "OPEN      " : "INTERMITTENT"}              ║`,"╠══════════════════════════════════════╣","║  BUNKER_7 does not always answer.    ║","║  Sometimes the static answers.       ║","║  Sometimes no one answers.           ║","║  Sometimes someone breathes.         ║","╚══════════════════════════════════════╝","","If you reach voicemail, leave a frequency.","If you reach the archivist, do not waste his time."], "system"); break; }

      case "weekly": { const rot = getWeeklyRotation(); pushLines(["╔══════════════════════════════════════╗","║  WEEKLY ROTATION                     ║",`║  Week ${rot.week}, ${rot.year}${" ".repeat(22 - String(rot.week).length - String(rot.year).length)}║`,"╠══════════════════════════════════════╣",`║  Anomaly: ${rot.anomalyName.padEnd(26)}║`,`║  Featured: ${rot.featuredPlace.padEnd(25)}║`,`║  Dust Mult: ${String(rot.dustMultiplier).padEnd(24)}║`,"╠══════════════════════════════════════╣",`║  Code: ${rot.weeklyCode.padEnd(29)}║`,"╚══════════════════════════════════════╝"], "system"); break; }

      case "other": { const encounters = getOtherEncounters(); const lines = getOtherStatusText(encounters); pushLines([`OTHER ENCOUNTERS: ${encounters}`, ...lines, ""], "normal"); break; }

      case "enter": { const placeId = args[1]; if (!placeId) { if (unlockedSubPlaces.length === 0) { pushLines(["No sub-places available.", "Accumulate dust and explore the atlas."], "error"); } else { pushLines(["Usage: enter [sub-place-id]", "Available sub-places:", ...unlockedSubPlaces.map((sp) => `  ${sp.id} — ${sp.name} (${sp.risk})`), "",], "normal"); } } else { const sp = getSubPlaceById(placeId); if (!sp) { pushLines(["Unknown sub-place.", ""], "error"); } else if (!unlockedSubPlaces.find((u) => u.id === placeId)) { pushLines(["ACCESS DENIED.",`Required dust: ${sp.requiredDust}%`, sp.requiredItem ? `Required item: ${sp.requiredItem}` : "", sp.requiredCode ? `Required code: ${sp.requiredCode}` : "","",], "error"); } else { enterSubPlace(sp); pushLines([`╔══════════════════════════════════════╗`,`║  ENTERING: ${sp.name.toUpperCase().slice(0, 24).padEnd(24)}║`,`╠══════════════════════════════════════╣`,...sp.lore.map((l) => `║  ${l.slice(0, 34).padEnd(34)}║`),`╠══════════════════════════════════════╣`,`║  Risk: ${sp.risk.toUpperCase().padEnd(27)}║`,`║  Dust: +${String(sp.dustGain).padEnd(20)}║`,`╚══════════════════════════════════════╝`,"",], "system"); } } break; }

      case "exorcise": { if (!hijacked) { pushLines(["Nothing to exorcise.", "The channel is clear.", ""], "normal"); } else { setHijacked(false); pushLines(["You push back.", "The static recedes.", "BUNKER_7 signal restored.", ""], "success"); } break; }

      case "grid": { setShowGrid(true); pushLines(["Initializing grid visualization...", "The atlas is more connected than it appears."], "system"); break; }

      case "spectrogram": { setShowSpectrogram(true); pushLines(["Spectrogram viewer active.", "Watch the frequencies. They watch back."], "system"); break; }

      case "leads": {
        if (activeReading) {
          const clarityPct = readingClarity;
          pushLines([
            `ACTIVE PATTERN: ${activeReading.title.toUpperCase()}`,
            `Clarity: ${clarityPct}%`,
            ...activeReading.conditions.map((cond: ReadingCondition) => `  ${cond.observed ? "[✓]" : "[ ]"} ${cond.text}`),
            "",
          ], "normal");
        } else {
          const next = detectNextReading();
          if (next) {
            pushLines([
              "╔══════════════════════════════════════╗",
              "║  NEW PATTERN SURFACED                ║",
              `║  ${next.title.toUpperCase().padEnd(34)}║`,
              "╠══════════════════════════════════════╣",
              `║  ${next.description.slice(0, 34).padEnd(34)}║`,
              "╚══════════════════════════════════════╝",
              "",
            ], "success");
          } else {
            pushLines(["No active patterns.", "All correlations complete.", "The archive is silent."], "normal");
          }
        }
        break;
      }

      case "daily": { const { code, valid, window } = getDailyCode(); if (valid) { pushLines(["╔══════════════════════════════════════╗","║  DAILY FREQUENCY ACQUIRED            ║",`║  ${code.padEnd(36)}║`,"╚══════════════════════════════════════╝","Record this code before the window closes.",], "success"); } else { pushLines([`Daily frequency unavailable.`,`Next window: ${window}`,`Yesterday's code: ${code} (expired)`], "normal"); } break; }

      case "email": { const email = args.slice(1).join(" "); if (!email || !email.includes("@")) { const all = JSON.parse(localStorage.getItem("vp-emails") || "[]"); if (all.length === 0) { pushLines(["Usage: email [your@address.com]", "BUNKER_7 will remember your frequency."], "error"); } else { pushLines(["REGISTERED FREQUENCIES:",...all.map((w: { email: string; date: string }) => `  ${w.email} — ${new Date(w.date).toLocaleDateString()}`),"", `${all.length} total witnesses.`, "Use 'email [address]' to register."], "normal"); } break; } const key = "vp-emails"; const existing = JSON.parse(localStorage.getItem(key) || "[]"); existing.push({ email, date: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(existing)); fetch("/api/bunker-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {}); pushLines(["FREQUENCY REGISTERED.", `Relay: ${email}`, "You will receive one transmission.", "Do not reply. The channel is one-way."], "success"); break; }

      case "party": { const partyId = args[1]; const code = args[2]; if (!partyId || !code) { pushLines(["Usage: party [party-id] [your-code]", "Tri-party authentication required for legendary assets.", "Share the party ID with two other witnesses."], "error"); } else { fetch("/api/collaborative", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, code }) }).then((r) => r.json()).then((data) => { if (data.status === "complete") { recordCode(data.code); pushLines(["TRI-PARTY AUTHENTICATION COMPLETE.", `Legendary code: ${data.code}`, "The grid stabilizes when witnesses unite."], "success"); } else { pushLines([`Witnesses: ${3 - data.needed}/3`, data.message], "normal"); } }).catch(() => { pushLines(["AUTHENTICATION SERVER UNREACHABLE.", "The grid is thin here."], "error"); }); } break; }

      case "witnesses": { const all = JSON.parse(localStorage.getItem("vp-emails") || "[]"); if (all.length === 0) { pushLines(["No witnesses registered."], "normal"); } else { pushLines(["REGISTERED FREQUENCIES:",...all.map((w: { email: string; date: string }) => `  ${w.email} — ${new Date(w.date).toLocaleDateString()}`),"", `${all.length} total witnesses.`,], "normal"); } break; }

      case "broadcast": { const key = args.slice(1).join(" "); if (key === "on bunker7") { localStorage.setItem("vp-broadcasting", "true"); pushLines(["╔══════════════════════════════════════╗","║  BROADCAST RELAY ACTIVE              ║","║  Frequency: UNAUTHORIZED             ║","║  Platform: TWITCH                    ║","╚══════════════════════════════════════╝","","All terminals will detect this frequency.","The grid is intercepting.",], "warning"); } else if (key === "off") { localStorage.setItem("vp-broadcasting", "false"); pushLines(["Broadcast terminated.", "The static returns.", "The channel is dead again."], "normal"); } else { pushLines(["BROADCAST CONTROL", "Usage: broadcast ON BUNKER7", "       broadcast OFF", "", "You need the authorization key to go live."], "error"); } break; }

      case "clear": setLines([]); break;

      case "discover": { const name = args.slice(1).join(" "); if (!name) { const discoveries = getDiscoveries(); if (discoveries.length === 0) { pushLines(["Usage: discover [place name]", "Log a real abandoned place you have found.", "The atlas grows when witnesses contribute."], "error"); } else { pushLines(["YOUR DISCOVERIES:",...discoveries.map((d) => `  ${d.name} — ${d.location} (+${d.dustGain} dust)`),"", `Total: ${discoveries.length} places documented.`,], "normal"); } break; } const discovery = addDiscovery({ name, location: "Unknown coordinates", description: "Logged by witness." }); const currentDust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10); const nextDust = Math.min(100, currentDust + discovery.dustGain); localStorage.setItem("vp-dust-accumulation", String(nextDust)); window.dispatchEvent(new CustomEvent("vp-dust-change")); setDust(nextDust); pushLines(["╔══════════════════════════════════════╗","║  DISCOVERY LOGGED                    ║",`║  ${name.toUpperCase().slice(0, 34).padEnd(34)}║`,"╠══════════════════════════════════════╣",`║  Dust: +${String(discovery.dustGain).padEnd(20)}║`,"╚══════════════════════════════════════╝","","The atlas remembers what you have seen.",], "success"); break; }

      case "purge": { const inv = getInventory(); if (inv.length === 0) { pushLines(["PURGE FAILED.", "You have nothing to sacrifice.", "The dust requires a trade."], "error"); break; } const sacrificed = inv[Math.floor(Math.random() * inv.length)]; const item = INVENTORY_ITEMS.find((i) => i.id === sacrificed); const newInv = inv.filter((id) => id !== sacrificed); localStorage.setItem("vp-bunker-inventory", JSON.stringify(newInv)); setInventory(newInv); purgeDust(); const consequences: string[] = []; const deleteLogRoll = Math.random(); const deleteAssetRoll = Math.random(); if (deleteLogRoll < 0.2 && unlocked > 3) { const nextUnlocked = Math.max(3, unlocked - 1); setUnlocked(nextUnlocked); localStorage.setItem("vp-logs-unlocked", nextUnlocked.toString()); consequences.push("A log entry has been erased. You will not read it again."); } if (deleteAssetRoll < 0.15 && assets.length > 0) { const lostAsset = assets[Math.floor(Math.random() * assets.length)]; const nextAssets = assets.filter((a) => a !== lostAsset); localStorage.setItem("vp-assets", JSON.stringify(nextAssets)); setAssets(nextAssets); consequences.push(`An asset has been corrupted: ${lostAsset}. It is gone.`); } pushLines(["╔══════════════════════════════════════╗","║  PURGE COMPLETE                      ║","╠══════════════════════════════════════╣",`║  Sacrificed: ${(item?.name || sacrificed).padEnd(24)}║`,"║  Dust:        0%                     ║","║  Corruption:  0                      ║",...(consequences.length > 0 ? ["╠══════════════════════════════════════╣"] : []),...consequences.map((c) => `║  ${c.slice(0, 34).padEnd(34)}║`),"╠══════════════════════════════════════╣","║  You feel lighter.                     ║","║  The places remember anyway.         ║","╚══════════════════════════════════════╝",], "success"); break; }

            case "archives": {
        fetch("/api/places")
          .then(r => r.json())
          .then(data => {
            const all: Place[] = data.places || [];
            const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
            const logs = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
            const encounters = getOtherEncounters();
            const state = {
              dust: dustLvl,
              encounters,
              inventory: JSON.parse(localStorage.getItem("vp-bunker-inventory") || "[]"),
              visitedSlugs: logs.map((l: any) => l.slug).filter(Boolean),
              unlockedCodes: JSON.parse(localStorage.getItem("vp-found-codes") || "[]"),
              readingsComplete: false,
              now: new Date(),
            };
            const out = ["┌─ ATLAS CONDITIONAL CARTOGRAPHY ────┐"];
            all.forEach((p) => {
              const ev = evaluateUnlock(p, state);
              const icon = p.status === "verified" ? "◈" : ev.visible ? "○" : "·";
              const label = p.status === "verified" ? "" : ` [${p.status}]`;
              if (ev.visible) {
                out.push(`│  ${icon} ${p.name.slice(0, 30).padEnd(30)}${label.padEnd(8)}│`);
              } else if (p.status === "sealed" && dustLvl >= ((p.unlockCondition?.value as number) || 100) * 0.5) {
                out.push(`│  ~ ${p.name.slice(0, 28).padEnd(28)}  INTERFERENCE │`);
              }
            });
            out.push("└──────────────────────────────────────┘");
            out.push(`${all.filter(p => evaluateUnlock(p, state).visible).length} / ${all.length} archives resolved.`);
            pushLines(out, "system");
          });
        break;
      }

      case "resonance": {
        const slug = args[1];
        if (!slug) {
          pushLines(["Usage: resonance [archive-slug]", "Shows connected archives and grid commentary."], "error");
          break;
        }
        fetch("/api/places")
          .then(r => r.json())
          .then(data => {
            const all: Place[] = data.places || [];
            const place = all.find(p => p.slug === slug);
            if (!place) {
              pushLines([`Archive '${slug}' not found.`], "error");
              return;
            }
            const out = [
              `╔══════════════════════════════════════╗`,
              `║  RESONANCE: ${place.name.toUpperCase().slice(0, 24).padEnd(24)}║`,
              `╠══════════════════════════════════════╣`,
            ];
            if (place.resonanceNote) out.push(`║  ${place.resonanceNote.slice(0, 34).padEnd(34)}║`);
            if (place.connectedTo?.length) {
              out.push(`║  CONNECTED TO:                       ║`);
              place.connectedTo.forEach(s => {
                const target = all.find(p => p.slug === s);
                out.push(`║    → ${(target?.name || s).slice(0, 30).padEnd(30)}║`);
              });
            } else {
              out.push(`║  No resonances detected.             ║`);
            }
            out.push(`╚══════════════════════════════════════╝`);
            pushLines(out, "system");
          });
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
    <div className="vp-drowned-room">
      <div className="vp-water-ambient" />
      <div className="vp-caustics" />
      <div className="vp-water-stain vp-water-stain--1" />
      <div className="vp-water-stain vp-water-stain--2" />
      <div className="vp-water-surface" />
      <div className="vp-bubbles" />
      <div className="vp-pressure" />
      <div className="vp-depth-marker">
        Depth: {(dust * 12).toFixed(0)}m | Pressure: {(dust * 1.5).toFixed(1)} atm
      </div>
      <main
        className="min-h-screen w-full max-w-[800px] mx-auto font-mono relative overflow-hidden selection:bg-[#8a7a6a]/20 flex flex-col px-6 py-16 md:px-10 md:py-24"
        style={{ backgroundColor: "transparent", color: t.primary }}
      >
            {/* ─── DROWNED OVERLAYS ─── */}
      <div className="pointer-events-none fixed inset-0 z-[60] vp-crt-scanline" />
      {corruption.stage >= 4 && (
        <div className="pointer-events-none fixed inset-0 z-[55] animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${t.corruption}08 0%, transparent 70%)`,
            animationDuration: "3.5s",
          }}
        />
      )}
      {hijacked && (
        <div className="pointer-events-none fixed inset-0 z-[56]"
          style={{
            background: "linear-gradient(90deg, rgba(255,0,0,0.015) 0%, transparent 50%, rgba(0,255,255,0.015) 100%)",
          }}
        />
      )}

      {!booted && <TerminalBootSequence onComplete={() => setBooted(true)} />}

      <div className="min-h-screen flex flex-col relative z-10 p-3 md:p-6 gap-4">
        {/* ─── STATUS HUD ─── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden rounded-lg border"
          style={{
            borderColor: `${t.primary}15`,
            background: `linear-gradient(180deg, ${t.primary}08 0%, ${t.primary}03 100%)`,
            boxShadow: `inset 0 1px 0 ${t.primary}10, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}60, transparent)` }} />
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Terminal size={16} style={{ color: t.accent }} />
                {hijacked && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ background: t.corruption }} />
                )}
              </div>
              <div>
                <h1 className="text-xs tracking-[0.25em] uppercase font-bold" style={{ color: t.primary, textShadow: `0 0 8px ${t.phosphor}30` }}>
                  Bunker_7
                </h1>
                <p className="text-[8px] opacity-40 tracking-[0.15em] uppercase">Echoes & Dust // v2.4.1</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-[11px] md:text-xs overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                <Activity size={10} className="opacity-40" />
                <span className="opacity-50 uppercase tracking-wider">Dust</span>
                <ProgressBar value={dust} max={100} color={dust > 75 ? t.corruption : t.accent} trackColor={`${t.primary}15`} />
                <span className="font-bold tabular-nums" style={{ color: dust > 75 ? t.corruption : t.primary }}>{dust}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={10} style={{ color: corruption.color, opacity: 0.6 }} />
                <span className="uppercase tracking-wider" style={{ color: corruption.color, opacity: 0.7 }}>{corruption.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={10} className="opacity-40" />
                <span className="opacity-50 tabular-nums">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio size={10} className="opacity-40" />
                <span className="opacity-50 uppercase tracking-wider">Other</span>
                <span className="font-bold tabular-nums" style={{ color: otherCount > 0 ? t.corruption : t.dim }}>{otherCount}</span>
              </div>
              <span className="opacity-30 hidden sm:inline uppercase tracking-widest text-[8px]">{theme}</span>
              <Link href="/" className="opacity-30 hover:opacity-80 transition-opacity text-[8px] uppercase tracking-wider flex items-center gap-1">
                <ArrowLeft size={10} /> Atlas
              </Link>
            </div>
          </div>
          <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}30, transparent)` }} />
        </motion.div>

        {/* ─── MAIN GRID ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
          {/* ─── TERMINAL COLUMN ─── */}
          <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
            <div
              className="flex-1 rounded-lg flex flex-col overflow-hidden relative border"
              style={{
                background: `linear-gradient(180deg, ${t.primary}04 0%, ${t.primary}02 100%)`,
                borderColor: `${t.primary}12`,
                boxShadow: `inset 0 0 60px ${t.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
                minHeight: "280px",
              }}
            >
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: `${t.primary}08`, background: `${t.primary}04` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: `${t.danger}50`, background: hijacked ? `${t.corruption}40` : "transparent" }} />
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: `${t.accent}40`, background: chatMode ? `${t.accent}30` : "transparent" }} />
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: `${t.primary}20` }} />
                  <span className={`text-[8px] uppercase tracking-[0.2em] ml-1 ${hijacked ? "animate-pulse" : "opacity-40"}`} style={{ color: hijacked ? t.corruption : undefined }}>
                    {hijacked ? "THE OTHER // UNAUTHORIZED" : chatMode ? "BUNKER_7 CHANNEL // OPEN" : "CMD // READY"}
                  </span>
                </div>
                {chatMode && (
                  <button onClick={() => { setChatMode(false); pushLines(["Channel closed.", "Returning to command interface."], "system"); }} className="text-[8px] uppercase opacity-40 hover:opacity-100 transition-opacity tracking-wider">[close]</button>
                )}
              </div>
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-1">
                {lines.map((line) => (
                  <TerminalLineView key={line.id} line={line} theme={t} corruptionStage={corruption.stage} hijacked={hijacked} />
                ))}
                {isAiTyping && (
                  <div className="flex items-center gap-2 mt-2 opacity-50" style={{ color: t.dim }}>
                    <span className="inline-block w-1.5 h-3 animate-pulse" style={{ background: t.phosphor }} />
                    <span className="text-[11px] italic tracking-wider">BUNKER_7 is typing...</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t relative" style={{ borderColor: `${t.primary}08`, background: `${t.primary}04` }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold select-none tracking-wider" style={{ color: hijacked ? t.corruption : chatMode ? t.accent : t.dim, opacity: 0.7 }}>
                    {chatMode ? "~" : promptLabel}
                  </span>
                  <span className="text-xs opacity-30 select-none">{">"}</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); onType(); window.dispatchEvent(new CustomEvent("vp-keystroke")); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { runCommand(input); }
                      else if (e.key === "Tab" && suggestions.length > 0) { e.preventDefault(); setInput(suggestions[0]); setSuggestions([]); }
                      else if (e.key === "?" && !chatMode && !input) { e.preventDefault(); setShowPalette(true); setPaletteQuery(""); }
                    }}
                    className="flex-1 bg-transparent text-[15px] font-mono outline-none placeholder:opacity-25 min-w-0"
                    style={{ color: t.primary, caretColor: t.cursor, textShadow: `0 0 4px ${t.phosphor}40` }}
                    placeholder={chatMode ? "Speak to BUNKER_7..." : "Enter command... (? for palette)"}
                    spellCheck={false}
                    autoFocus
                  />
                  <span
                    className={`inline-block opacity-50 ${cursorStyle === "block" ? "w-2.5 h-4" : cursorStyle === "pipe" ? "w-0.5 h-4" : "w-3 h-0.5"}`}
                    style={{ background: hijacked ? t.corruption : t.cursor }}
                  />
                </div>
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute left-4 right-4 bottom-full mb-2 border rounded-md overflow-hidden"
                      style={{
                        borderColor: `${t.primary}15`,
                        background: `linear-gradient(180deg, ${t.bg}f0, ${t.bg}e8)`,
                        boxShadow: `0 -4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${t.primary}08`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus(); }}
                          className="w-full text-left px-4 py-2 text-[11px] hover:bg-white/5 transition-colors flex items-center justify-between group"
                        >
                          <span style={{ color: t.primary }}>{s}</span>
                          <span className="opacity-30 text-[9px] uppercase tracking-wider">{COMMAND_REGISTRY.find((c) => c.cmd === s)?.desc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showPalette && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] flex items-start justify-center pt-24 p-4"
                  style={{ background: "rgba(8,6,4,0.75)", backdropFilter: "blur(4px)" }}
                  onClick={() => setShowPalette(false)}
                >
                  <motion.div
                    initial={{ scale: 0.96, y: -8, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.96, y: -8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg border rounded-lg overflow-hidden"
                    style={{
                      borderColor: `${t.accent}25`,
                      background: `linear-gradient(180deg, ${t.bg}fa, ${t.bg}f0)`,
                      boxShadow: `0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 ${t.primary}10`,
                    }}
                  >
                    <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: `${t.primary}08` }}>
                      <HelpCircle size={12} className="opacity-40" />
                      <input
                        autoFocus
                        value={paletteQuery}
                        onChange={(e) => setPaletteQuery(e.target.value)}
                        placeholder="Filter commands..."
                        className="flex-1 bg-transparent text-[12px] outline-none placeholder:opacity-25 uppercase tracking-wider"
                        style={{ color: t.primary }}
                      />
                      <button onClick={() => setShowPalette(false)} className="text-[9px] uppercase opacity-40 hover:opacity-100 tracking-wider">esc</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
                      {paletteCommands.map((c) => (
                        <button
                          key={c.cmd}
                          onClick={() => { setShowPalette(false); setInput(c.cmd); inputRef.current?.focus(); }}
                          className="w-full text-left px-4 py-2.5 rounded text-[11px] hover:bg-white/5 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="opacity-60 font-bold uppercase tracking-wider" style={{ color: t.accent }}>{c.cmd}</span>
                            <span className="opacity-25">{c.desc}</span>
                          </div>
                          <span className="opacity-15 text-[9px] uppercase tracking-widest">{c.category}</span>
                        </button>
                      ))}
                      {paletteCommands.length === 0 && (
                        <p className="text-center text-[11px] opacity-20 py-6 italic">No commands match.</p>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setVideoPanelOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-[9px] uppercase tracking-[0.15em] hover:opacity-80 transition-all"
              style={{
                borderColor: `${t.primary}10`,
                background: `${t.primary}03`,
                boxShadow: `inset 0 1px 0 ${t.primary}06`,
              }}
            >
              <Radio size={10} className={videoPanelOpen ? "animate-pulse" : ""} style={{ color: videoPanelOpen ? t.accent : undefined }} />
              <span className="opacity-70">{videoPanelOpen ? "Hide" : "Show"} Transmissions</span>
            </button>

            <AnimatePresence>
              {videoPanelOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {VIDEO_LOGS.map((v) => (
                      <button
                        key={v.label}
                        onClick={() => setInlineVideo({ src: v.src, label: v.label })}
                        className="flex items-center sm:flex-col gap-2 p-3 border rounded-lg hover:opacity-80 transition-all text-left sm:text-center group"
                        style={{
                          borderColor: `${t.primary}10`,
                          background: `${t.primary}03`,
                          boxShadow: `inset 0 1px 0 ${t.primary}05`,
                        }}
                      >
                        <Play size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
                        <div className="min-w-0">
                          <span className="text-[9px] block truncate uppercase tracking-wider opacity-80">{v.label}</span>
                          <span className="text-[8px] opacity-30 uppercase tracking-widest">{v.day}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── SIDE PANEL ─── */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
            <div className="flex gap-1 border-b pb-2 overflow-x-auto no-scrollbar" style={{ borderColor: `${t.primary}08` }}>
              {[
                { id: "logs" as SideTab, label: "Logs", icon: BookOpen },
                { id: "decrypt" as SideTab, label: "Decrypt", icon: Lock },
                { id: "assets" as SideTab, label: "Assets", icon: Image },
                { id: "puzzles" as SideTab, label: "Puzzles", icon: Zap },
                { id: "status" as SideTab, label: "Status", icon: Shield },
                { id: "wall" as SideTab, label: "Wall", icon: MessageSquare },
                { id: "signal" as SideTab, label: "Signal", icon: Radio },
                { id: "leads" as SideTab, label: "Patterns", icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 text-[8px] md:text-[9px] uppercase tracking-[0.15em] rounded transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? "opacity-100" : "opacity-35 hover:opacity-60"}`}
                  style={activeTab === tab.id ? {
                    background: `${t.primary}08`,
                    borderBottom: `2px solid ${t.accent}`,
                    color: t.primary,
                    textShadow: `0 0 6px ${t.phosphor}30`,
                  } : {}}
                >
                  <tab.icon size={10} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div
              className="flex-1 border rounded-lg overflow-y-auto p-4 md:p-5"
              style={{
                borderColor: `${t.primary}08`,
                background: `linear-gradient(180deg, ${t.primary}02 0%, transparent 100%)`,
                boxShadow: `inset 0 1px 0 ${t.primary}05`,
                minHeight: "200px",
              }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "logs" && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                    <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 mb-3 font-bold">Archived Logs</h3>
                    {LOGS.slice(0, unlocked).map((log) => (
                      <div key={log.day} className="border-l-2 pl-4 py-1" style={{ borderColor: `${t.accent}25` }}>
                        <p className="text-[9px] tracking-[0.2em] opacity-40 mb-1.5 uppercase font-bold">{log.day}</p>
                        <p className="text-[14px] md:text-[15px] leading-[1.8] opacity-85" style={{ color: t.primary }}>{log.text}</p>
                      </div>
                    ))}
                    {unlocked < LOGS.length && (
                      <div className="flex items-center gap-2 text-[10px] opacity-30 py-4 border-t mt-4" style={{ borderColor: `${t.primary}06` }}>
                        <Lock size={10} />
                        <span className="uppercase tracking-wider">{LOGS.length - unlocked} entries encrypted</span>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === "decrypt" && (
                  <motion.div key="decrypt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 font-bold">Decrypt</h3>
                    <p className="text-[11px] opacity-50 leading-relaxed">Enter codes from the Numbers Station to recover sealed entries.</p>
                    <div className="flex gap-3">
                      <input
                        value={decryptCode}
                        onChange={(e) => setDecryptCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()}
                        placeholder="ENTER CODE..."
                        className="flex-1 bg-transparent border-b-2 text-[13px] outline-none py-1.5 placeholder:text-[9px] placeholder:opacity-20 placeholder:uppercase placeholder:tracking-widest min-w-0"
                        style={{ borderColor: decryptError ? t.danger : `${t.primary}20`, color: decryptError ? t.danger : t.primary }}
                        spellCheck={false}
                      />
                      <button
                        onClick={attemptDecrypt}
                        className="px-4 py-1.5 border rounded text-[10px] font-mono uppercase tracking-wider hover:opacity-80 transition-all"
                        style={{ borderColor: `${t.primary}18`, color: t.primary }}
                      >
                        Decrypt
                      </button>
                    </div>
                    {decryptError && <p className="text-[10px] animate-pulse" style={{ color: t.danger }}>Invalid code. Access denied.</p>}
                  </motion.div>
                )}
                {activeTab === "assets" && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 font-bold">Assets</h3>
                      <button onClick={() => setGalleryOpen(true)} className="text-[9px] uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1.5">
                        <Image size={10} /> Gallery
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {STORY_ASSETS.map((asset) => {
                        const isUnlocked = assets.includes(asset.id);
                        return (
                          <div
                            key={asset.id}
                            className={`p-3 border rounded text-center space-y-1.5 transition-all ${isUnlocked ? "opacity-100" : "opacity-25"}`}
                            style={{
                              borderColor: isUnlocked ? `${t.accent}20` : `${t.primary}08`,
                              background: isUnlocked ? `${t.primary}04` : "transparent",
                            }}
                          >
                            <div className="text-[8px] uppercase tracking-[0.15em] font-bold" style={{ color: isUnlocked ? "#a855f7" : t.dim }}>{asset.rarity}</div>
                            <div className="text-xs font-bold truncate uppercase tracking-wider" style={{ color: t.primary }}>{asset.title}</div>
                            <div className="text-[8px] opacity-50 uppercase tracking-widest">{isUnlocked ? "Recovered" : "Encrypted"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[10px] opacity-30 pt-2 uppercase tracking-widest">{assets.length} / {STORY_ASSETS.length} recovered</div>
                  </motion.div>
                )}
                {activeTab === "puzzles" && (
                  <motion.div key="puzzles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 text-[11px] md:text-[13px] leading-relaxed">
                    <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 mb-3 font-bold">Active Anomalies</h3>
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
                      <div key={p.n} className="p-3 md:p-4 border rounded" style={{ borderColor: `${t.primary}06`, background: `${t.primary}02` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] opacity-30 font-bold">{p.n}</span>
                          <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: t.accent }}>{p.title}</span>
                        </div>
                        <p className="opacity-70 text-[11px] font-mono">{p.body}</p>
                        {p.hint && <p className="text-[9px] opacity-25 mt-1.5 uppercase tracking-wider">{p.hint}</p>}
                      </div>
                    ))}
                  </motion.div>
                )}
                {activeTab === "status" && (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 text-[13px] md:text-[14px] font-mono">
                    <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 font-bold">Status</h3>
                    <div className="space-y-2 opacity-80">
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">ID</span><span>BUNKER_7</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">STATUS</span><span>SEALED</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">THEME</span><span className="uppercase">{theme}</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">LOGS</span><span>{unlocked}/{LOGS.length}</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">DUST</span><span style={{ color: dust > 75 ? t.corruption : undefined }}>{dust}%</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">ASSETS</span><span>{assets.length}/{STORY_ASSETS.length}</span></div>
                      <div className="flex justify-between border-b pb-1" style={{ borderColor: `${t.primary}06` }}><span className="opacity-40">INVENTORY</span><span>{inventory.length}</span></div>
                      <div className="pt-2 animate-pulse text-[10px] uppercase tracking-[0.3em] opacity-40">Listening...</div>
                    </div>
                  </motion.div>
                )}
                {activeTab === "wall" && (
                  <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <h3 className="text-[10px] uppercase tracking-[0.35em] opacity-30 mb-2 font-bold">Transmission Wall</h3>
                    <p className="text-[10px] opacity-40 mb-3">Use <span className="font-mono opacity-70">transmit [msg]</span> to add a signal.</p>
                    {wallMessages.length === 0 ? (
                      <p className="text-[12px] opacity-20 italic">The static is silent.</p>
                    ) : (
                      <div className="space-y-3">
                        {wallMessages.slice(-20).map((m, i) => (
                          <div key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: `${t.primary}10` }}>
                            <p className="text-[13px] opacity-80 leading-relaxed" style={{ color: t.primary }}>{m.text}</p>
                            <p className="text-[8px] opacity-20 mt-1 font-mono uppercase tracking-wider">{m.date}</p>
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

        {inlineVideo && (
          <div className="w-full max-w-3xl mx-auto">
            <TerminalVideoPlayer src={inlineVideo.src} label={inlineVideo.label} themeColor={t.primary} onClose={() => setInlineVideo(null)} />
          </div>
        )}

        <div className="text-center opacity-15 text-[8px] tracking-[0.4em] uppercase py-2">
          <p style={{ textShadow: `0 0 10px ${t.phosphor}20` }}>The dust remembers everything</p>
        </div>
      </div>

      {showGrid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(8,6,4,0.92)", backdropFilter: "blur(6px)" }} onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-2xl border rounded-lg p-5 relative" style={{ borderColor: `${t.accent}20`, background: t.bg, boxShadow: `0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 ${t.primary}10` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: t.accent }}>The Grid</h2>
              <button onClick={() => setShowGrid(false)} className="text-xs opacity-40 hover:opacity-100 uppercase tracking-wider">[x]</button>
            </div>
            <TheGrid />
          </div>
        </div>
      )}

      {showSpectrogram && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(8,6,4,0.92)", backdropFilter: "blur(6px)" }} onClick={() => setShowSpectrogram(false)}>
          <div className="w-full max-w-lg border rounded-lg p-5 relative" style={{ borderColor: `${t.accent}20`, background: t.bg, boxShadow: `0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 ${t.primary}10` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: t.accent }}>Spectrogram</h2>
              <button onClick={() => setShowSpectrogram(false)} className="text-xs opacity-40 hover:opacity-100 uppercase tracking-wider">[x]</button>
            </div>
            <SpectrogramViewer active={true} color={t.primary} />
          </div>
        </div>
      )}

      {currentSubPlace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(8,6,4,0.96)" }}>
          <div className="w-full max-w-lg border rounded-lg p-5 space-y-4 relative" style={{ borderColor: `${t.corruption}25`, background: t.bg, boxShadow: `0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 ${t.primary}08` }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: t.corruption }}>{currentSubPlace.name}</h2>
              <button onClick={exitSubPlace} className="text-xs opacity-40 hover:opacity-100 uppercase tracking-wider">[exit]</button>
            </div>
            <p className="text-[12px] opacity-75 leading-[1.8]">{currentSubPlace.description}</p>
            <div className="space-y-2">{currentSubPlace.lore.map((l, i) => <p key={i} className="text-[10px] opacity-50 border-l-2 pl-3 leading-relaxed" style={{ borderColor: `${t.primary}10` }}>{l}</p>)}</div>
            {currentSubPlace.choices && <SubPlaceChoicePanel subPlace={currentSubPlace} theme={t} onConsequence={(lines) => pushLines([...lines, ""])} />}
            <div className="text-[9px] opacity-30 pt-3 border-t uppercase tracking-wider" style={{ borderColor: `${t.primary}06` }}>Risk: {currentSubPlace.risk} | Dust: +{currentSubPlace.dustGain}</div>
          </div>
        </div>
      )}

      <VideoModal src={activeVideo?.src || ""} label={activeVideo?.label || ""} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
      <AssetGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} themeColor={t.primary} />
                            </main>
      <div className="vp-silt-overlay" style={{ opacity: Math.min(dust / 250, 0.4) }} />
    </div>
  );
}
