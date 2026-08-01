"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Terminal, Play, Lock, Image, BookOpen, Shield, Zap,
  ArrowLeft, MessageSquare, Target, Activity, Clock, ChevronRight,
  HelpCircle, Eye, X,
} from "lucide-react";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
import AssetGallery from "@/components/AssetGallery";
import TerminalBootSequence from "@/components/TerminalBootSequence";
import TerminalVideoPlayer from "@/components/TerminalVideoPlayer";
import { markEchoesVisited, accumulateDust, purgeDust } from "@/hooks/useDustLevel";
import { useLeads, checkLeadProgress, generateNextLead } from "@/hooks/useLeads";
import LeadPanel from "@/components/LeadPanel";
import { useBreachProtocol } from "@/hooks/useBreachProtocol";
import { NUMBERS_STATIONS } from "@/lib/echoesContent";
import { getDailyCode } from "@/lib/dailyCode";
import { getSeasonalState } from "@/lib/seasonal";
import SignalTab from "@/components/SignalTab";
import {
  checkCaesar, checkCoordinates, checkAssembly, checkReflection,
  COORDINATE_FRAGMENTS, ASSEMBLED_MESSAGE, DUST_THRESHOLD, TRIGGER_PHRASE,
  getCodeEntry, redeemCode, getRedeemedCodes, getUnlockedAssets,
  STORY_ASSETS, REDEEMABLE_CODES, unlockAsset, checkAssetCondition,
} from "@/lib/assets";
import {
  getMemory, updateMemory, getSentiment, getOtherEncounters,
  recordOtherEncounter, shouldTriggerOther, getOtherResponse,
  getGhostLines, getBunkerLie, getGlobalLanternCount,
} from "@/lib/bunkerBrain";
import {
  logPlayerCommand, getProceduralGhostLines, getMemoryBasedOtherResponse,
} from "@/lib/otherMemory";
import { useKeystrokeAudio } from "@/hooks/useKeystrokeAudio";
import { addDiscovery, getDiscoveries } from "@/lib/discoveries";
import SubPlaceChoicePanel from "@/components/SubPlaceChoicePanel";
import { getInventory, INVENTORY_ITEMS } from "@/lib/inventory";
import { useCorruptionStage, useIdleGhost, useThreeFourteen } from "@/hooks/useStickyFeatures";
import { getWeeklyRotation } from "@/lib/weeklyRotation";
import { getSubPlaceById } from "@/lib/subPlaces";
import { useSubPlaces } from "@/hooks/useSubPlaces";
import SpectrogramViewer from "@/components/SpectrogramViewer";
import TheGrid from "@/components/TheGrid";

const THEMES = {
  amber: { primary: "#e8d5c0", bg: "#0c0a08", glow: "rgba(232,213,192,0.12)", accent: "#c4a882", dim: "#6a5a4a", cursor: "#e8d5c0" },
  cyan: { primary: "#a8d8e8", bg: "#080a0c", glow: "rgba(168,216,232,0.12)", accent: "#6ab4c8", dim: "#4a7a8a", cursor: "#a8d8e8" },
  red: { primary: "#e8a8a0", bg: "#100808", glow: "rgba(232,168,160,0.12)", accent: "#c07060", dim: "#8a5048", cursor: "#e8a8a0" },
  white: { primary: "#d0d0d0", bg: "#0a0a0a", glow: "rgba(208,208,208,0.12)", accent: "#a0a0a0", dim: "#707070", cursor: "#d0d0d0" },
  phosphor: { primary: "#b8e8a0", bg: "#050a05", glow: "rgba(184,232,160,0.12)", accent: "#6aa85a", dim: "#4a7a3a", cursor: "#b8e8a0" },
  abyss: { primary: "#88c0d0", bg: "#020508", glow: "rgba(136,192,208,0.15)", accent: "#5e81ac", dim: "#4c566a", cursor: "#88c0d0" },
  emergency: { primary: "#ff6b6b", bg: "#1a0505", glow: "rgba(255,107,107,0.1)", accent: "#ee5253", dim: "#8a3a3a", cursor: "#ff6b6b" },
  tungsten: { primary: "#ffd8a8", bg: "#0a0806", glow: "rgba(255,216,168,0.12)", accent: "#e8b87a", dim: "#8a7050", cursor: "#ffd8a8" },
};

type ThemeKey = keyof typeof THEMES;
type SideTab = "logs" | "decrypt" | "signal" | "assets" | "puzzles" | "status" | "wall" | "leads";
type LineType = "normal" | "input" | "other" | "ghost" | "system" | "error" | "success" | "warning";

interface TerminalLine { id: number; text: string; type: LineType; timestamp: number; }

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
  { cmd: "redeem", desc: "Redeem unlock code", category: "Asset" },
  { cmd: "gallery", desc: "View recovered assets", category: "Asset" },
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
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-16 h-1 rounded-full overflow-hidden bg-white/5">
      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
    </div>
  );
}

function TerminalLineView({ line, theme, corruptionStage }: { line: TerminalLine; theme: (typeof THEMES)["amber"]; corruptionStage: number }) {
  const [display, setDisplay] = useState(line.type === "other" ? "" : line.text);
  useEffect(() => {
    if (line.type === "other") {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let i = 0;
      const interval = setInterval(() => {
        if (i >= line.text.length) { clearInterval(interval); setDisplay(line.text); return; }
        setDisplay(line.text.slice(0, i) + Array.from({ length: line.text.length - i }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
        i++;
      }, 20);
      return () => clearInterval(interval);
    } else { setDisplay(line.text); }
  }, [line]);

  const style: React.CSSProperties = {};
  if (line.type === "input") { style.color = theme.dim; style.opacity = 0.5; }
  else if (line.type === "other") { style.color = "#ff6b6b"; style.textShadow = "0 0 12px rgba(255,107,107,0.35)"; }
  else if (line.type === "ghost") { style.color = theme.dim; style.opacity = 0.4; style.filter = "blur(0.4px)"; }
  else if (line.type === "error") { style.color = "#c07060"; }
  else if (line.type === "success") { style.color = "#6aa85a"; }
  else if (line.type === "system") { style.color = theme.accent; style.opacity = 0.9; }
  else if (line.type === "warning") { style.color = "#e8b87a"; }
  else { style.color = theme.primary; }

  const shouldGlitch = corruptionStage >= 4 && line.type === "normal" && Math.random() < 0.03;

  return (
    <motion.div initial={{ opacity: 0, x: -3 }} animate={{ opacity: line.type === "ghost" ? 0.4 : 1, x: 0 }} transition={{ duration: 0.1 }} className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed" style={style}>
      {shouldGlitch ? display.split("").map((c, i) => (
        <span key={i} style={Math.random() < 0.06 ? { display: "inline-block", transform: `translateY(${Math.random() > 0.5 ? 1.5 : -1.5}px)`, color: "#ff6b6b" } : {}}>{c}</span>
      )) : display}
    </motion.div>
  );
}

/* ─── MAIN ─── */
export default function EchoesPage() {
  const [theme, setTheme] = useState<ThemeKey>("amber");
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
    const initial: TerminalLine[] = [
      { id: ++lineIdRef.current, text: "╔════════════════════════════════════════╗", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║     BUNKER_7 TERMINAL v2.4.1           ║", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "╠════════════════════════════════════════╣", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║  Type 'help' for command list          ║", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║  Type 'chat' to speak with BUNKER_7   ║", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "║  Type '?' for command palette          ║", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "╚════════════════════════════════════════╝", type: "system", timestamp: Date.now() },
      { id: ++lineIdRef.current, text: "", type: "normal", timestamp: Date.now() },
    ];
    if (seasonal.specialEvent) {
      initial.push(
        { id: ++lineIdRef.current, text: `[SEASONAL ANOMALY: ${seasonal.name}]`, type: "warning", timestamp: Date.now() },
        { id: ++lineIdRef.current, text: seasonal.specialEvent, type: "warning", timestamp: Date.now() },
        { id: ++lineIdRef.current, text: "", type: "normal", timestamp: Date.now() }
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
    return JSON.parse(localStorage.getItem("bunker-wall") || "[]");
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
    const savedTheme = localStorage.getItem("bunker-theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    const savedUnlocked = parseInt(localStorage.getItem("bunker-unlocked") || "3", 10);
    setUnlocked(savedUnlocked);
    const savedTri = localStorage.getItem("bunker-triangulated") === "true";
    setTriangulated(savedTri);
    setDust(parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10));
    setAssets(getUnlockedAssets());
    setCodes(getRedeemedCodes());
    setInventory(getInventory());
    setLanternCount(getGlobalLanternCount());
  }, []);

  /* HIJACK */
  useEffect(() => {
    if (shouldTriggerOther("hijack")) {
      setHijacked(true);
      recordOtherEncounter();
      pushLines(["", "═══════════════════════════════════════════════", "  THE OTHER HAS TAKEN THE CHANNEL", "═══════════════════════════════════════════════", "", "I am not malicious.", "I am just... here.", ""], "other");
    }
  }, []);

  /* GHOST LINES */
  useEffect(() => {
    if (chatMode || hijacked) return;
    const interval = setInterval(() => {
      if (shouldTriggerOther("ghost") && Math.random() < 0.15) {
        const linesArr = getProceduralGhostLines();
        const line = linesArr[Math.floor(Math.random() * linesArr.length)];
        pushLines([line, ""], "ghost");
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [chatMode, hijacked]);

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
    const args = clean.split(" "); const base = args[0];
    logPlayerCommand(base);

    const lie = getBunkerLie(base);
    if (lie) { pushLines([lie, ""], "other"); return; }
    if (hijacked && base !== "exorcise") { pushLines([...getMemoryBasedOtherResponse(base), ""], "other"); return; }

    switch (base) {
      case "help": pushLines(["┌────────────────────────────────────────┐","│ AVAILABLE COMMANDS                     │","├────────────────────────────────────────┤","│  help        Command list              │","│  chat        Speak with BUNKER_7       │","│  status      System diagnostics        │","│  logs        View archived logs        │","│  decrypt     Code entry interface      │","│  scan        Environment scan          │","│  memory      Recover fragments         │","│  transmit    Send message              │","│  door        Seal status               │","│  breach      Protocol status           │","│  color       Cycle theme               │","│  puzzles     Active anomalies          │","│  cipher      Decode signal             │","│  coords      Enter coordinates         │","│  assemble    Reconstruct transmission  │","│  reflect     Answer reflection         │","│  redeem      Redeem unlock code        │","│  gallery     View recovered assets     │","│  collection  Collection status         │","│  cache       Time-locked files         │","│  triangulate Tower status              │","│  lanterns    View placed lanterns      │","│  constellation Grid alignment          │","│  inventory   Your found items          │","│  wall        Transmission wall         │","│  look        [03:14 ONLY]              │","│  whoareyou   [3 encounters]            │","│  profile     Your corruption profile  │","│  call        Voice channel status      │","│  leads       Active investigations     │","│  other       The Other encounters      │","│  weekly      Current rotation          │","│  enter       Explore sub-places        │","│  grid        View the constellation    │","│  spectrogram Frequency visualizer      │","│  discover    Log a real place          │","│  exorcise    Restore BUNKER_7 control  │","│  daily       Acquire daily frequency   │","│  email       Register for transmission │","│  party       Tri-party authentication  │","│  witnesses   Registered frequencies    │","│  broadcast   Go live / kill feed       │","│  clear       Clear terminal            │","│  exit        Exit chat mode            │","└────────────────────────────────────────┘"], "system"); break;

      case "status": pushLines([`┌─ TERMINAL DIAGNOSTICS ───────────────┐`,`│  ID:        BUNKER_7                 │`,`│  STATUS:    SEALED                   │`,`│  ATMOSPHERE: BREATHABLE (QUESTIONABLE)│`,`│  SIGNAL:    INTERMITTENT             │`,`│  THEME:     ${theme.toUpperCase().padEnd(17)}│`,`│  LOGS:      ${unlocked}/${LOGS.length} UNLOCKED${" ".repeat(12 - String(unlocked).length - String(LOGS.length).length)}│`,`│  CORRUPTION:${corruption.label.padEnd(17)}│`,`│  OTHER:     ${otherCount} encounter${otherCount !== 1 ? "s" : ""}${" ".repeat(14 - String(otherCount).length)}│`,"└──────────────────────────────────────┘"], "system"); break;

      case "logs": setActiveTab("logs"); pushLines(["Opening LOGS window...", `${LOGS.length - unlocked} entries remain encrypted.`], "system"); break;

      case "chat": setChatMode(true); pushLines(["╔══════════════════════════════════════╗","║  BUNKER_7 CHANNEL OPEN               ║","╠══════════════════════════════════════╣","║  Speak. The static listens either way║","║  Type 'exit' to return               ║","╚══════════════════════════════════════╝"], "system"); break;

      case "exit": if (chatMode) { setChatMode(false); pushLines(["Channel closed.", "Returning to command interface."], "system"); } else { pushLines(["Nothing to exit."], "error"); } break;

      case "scan": { const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10); const visits = localStorage.getItem("vp-expedition-log"); const count = visits ? JSON.parse(visits).length : 0; const last = localStorage.getItem("vp-last-visit"); const ago = last ? Math.floor((Date.now() - parseInt(last)) / 3600000) : "unknown"; const fragments = JSON.parse(localStorage.getItem("bunker-fragments") || "[]"); pushLines([`┌─ ENVIRONMENT SCAN ───────────────────┐`,`│  Dust accumulation: ${String(dustLvl).padEnd(3)}%           │`,`│  Documented sites:  ${String(count).padEnd(3)}           │`,`│  Hours since contact: ${String(ago).padEnd(10)}      │`,`│  Fragments:         ${String(fragments.length).padEnd(3)}           │`,dustLvl > DUST_THRESHOLD ? "│  [!] DUST LEVELS CRITICAL            │" : "│  Dust levels nominal                 │","└──────────────────────────────────────┘"], "normal"); break; }

      case "memory": { const allFrags = ["FRAG_01: ...the coordinates were wrong...","FRAG_02: ...someone else was using the cursor...","FRAG_03: ...the dust level read higher than possible...","FRAG_04: ...a door opened that wasn't on the schematic...","FRAG_05: ...the atlas updated itself at 03:14...","FRAG_06: ...i heard typing from the next terminal...","FRAG_07: [CORRUPTED]","FRAG_08: ...the green light pulsed in morse code...","FRAG_09: ...a photograph with no negative...","FRAG_10: ...the silence had a rhythm...","FRAG_11: ...coordinates pointing to the ocean floor...","FRAG_12: ...the atlas completed itself...","FRAG_13: ...a voice that sounded like mine...","FRAG_14: ...the dust spelled a name i recognized..."]; const saved = JSON.parse(localStorage.getItem("bunker-fragments") || "[]"); const newFrags = allFrags.filter((f) => !saved.includes(f.split(":")[0])); if (newFrags.length > 0) { const pick = newFrags[Math.floor(Math.random() * newFrags.length)]; const id = pick.split(":")[0]; saved.push(id); localStorage.setItem("bunker-fragments", JSON.stringify(saved)); pushLines(["RECOVERING FRAGMENT...", pick, "Stored."], "success"); } else { pushLines(["No new fragments.", "Visit more ruins."], "normal"); } break; }

      case "transmit": { const msg = args.slice(1).join(" "); if (!msg) { pushLines(["Usage: transmit [message]", "All transmissions monitored."], "error"); } else { const key = "bunker-transmissions"; const existing = JSON.parse(localStorage.getItem(key) || "[]"); existing.push({ text: msg, date: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(existing)); const wall = JSON.parse(localStorage.getItem("bunker-wall") || "[]"); wall.push({ text: msg, date: new Date().toLocaleTimeString() }); localStorage.setItem("bunker-wall", JSON.stringify(wall.slice(-50))); setWallMessages(wall.slice(-50)); checkLeadProgress(); if (msg.toLowerCase().replace(/[^a-z]/g, "") === TRIGGER_PHRASE.replace(/[^a-z]/g, "")) { pushLines(["TRANSMITTING...", "SIGNAL INTERCEPTED BY UNKNOWN SOURCE.", "RESPONSE: 'We know you're still there.'", "The channel is no longer one-way."], "other"); } else { pushLines(["TRANSMITTING...", "Signal sent into static."], "normal"); } } break; }

      case "door": { const dustLvl = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10); const now = new Date(); const hour = now.getHours(); const min = now.getMinutes(); if (hour === 3 && min === 14) { pushLines(["╔══════════════════════════════════════╗","║  03:14 DETECTED                      ║","║  The door is warm.                     ║","║  Something pushes from the other side. ║","╚══════════════════════════════════════╝"], "warning"); } else if (dustLvl > DUST_THRESHOLD) { pushLines([`Dust level: ${dustLvl}%. Threshold exceeded.`, "The door recognizes you.", "It opens inward. Not out.", "You could enter. But you won't come back the same."], "normal"); } else { pushLines([`Time: ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`, `Dust: ${dustLvl}%. Insufficient.`, "The door is sealed.", "It responds at 03:14 or to the dust-claimed."], "normal"); } break; }

      case "breach": if (breachActive) { pushLines(["╔══════════════════════════════════════╗","║  BREACH PROTOCOL ACTIVE              ║","║  Perimeter compromised.              ║","║  Route: /breach                        ║","║  You are marked as witness.            ║","╚══════════════════════════════════════╝"], "warning"); } else if (breachCountdown) { pushLines(["Breach pending.", `Estimated: ${breachCountdown}`, "Stand by."], "normal"); } else { pushLines(["No breach on schedule."], "normal"); } break;

      case "color": { const keys = Object.keys(THEMES) as ThemeKey[]; const idx = keys.indexOf(theme); const next = keys[(idx + 1) % keys.length]; setTheme(next); localStorage.setItem("bunker-theme", next); pushLines([`Theme: ${next.toUpperCase()}`, "The phosphor shifts."], "success"); break; }

      case "puzzles": setActiveTab("puzzles"); pushLines(["Opening PUZZLES window...", "10 active anomalies detected."], "system"); break;

      case "cipher": { const ans = args.slice(1).join(" "); if (!ans) { pushLines(["Usage: cipher [text]", "Intercepted: GUR QBBE BCRAF VAJNEQ"], "error"); } else if (checkCaesar(ans)) { pushLines(["DECRYPTION SUCCESSFUL.", "THE DOOR OPENS INWARD.", "CODE: INWARD"], "success"); } else { pushLines(["DECRYPTION FAILED."], "error"); } break; }

      case "coords": { const nums = args.slice(1).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)); if (nums.length !== 4) { pushLines(["Usage: coords [n1] [n2] [n3] [n4]", ...COORDINATE_FRAGMENTS.map((f) => `  ${f.source}: ${f.text}`)], "error"); } else if (checkCoordinates(nums)) { pushLines(["COORDINATES VERIFIED.", "38°74' N — impossible location.", "CODE: BREATHE"], "success"); } else { pushLines(["COORDINATES REJECTED.", `Entered: ${nums.join(", ")}`], "error"); } break; }

      case "assemble": { const frags = JSON.parse(localStorage.getItem("bunker-fragments") || "[]"); if (checkAssembly(frags)) { pushLines(["ASSEMBLY COMPLETE.", ...ASSEMBLED_MESSAGE.split(". ").map((s) => s.trim() + "."), "CODE: ASSEMBLY-314"], "success"); } else { pushLines([`Fragments: ${frags.length}/5`, "Missing: " + ["FRAG_01","FRAG_03","FRAG_07","FRAG_12","FRAG_14"].filter((f) => !frags.includes(f)).join(", ")], "normal"); } break; }

      case "reflect": { const ans = args.slice(1).join(" ").toLowerCase().replace(/[^a-z]/g, ""); if (!ans) { pushLines(["Usage: reflect [answer]", "What do you see?"], "error"); } else if (checkReflection(ans)) { pushLines(["REFLECTION CONFIRMED.", "You see what I see. Unfortunate.", "CODE: MIRROR"], "success"); } else { pushLines(["REFLECTION MISMATCH."], "error"); } break; }

      case "redeem": { const code = args.slice(1).join(" ").toUpperCase(); if (!code) { pushLines(["Usage: redeem [CODE]"], "error"); break; } const entry = getCodeEntry(code); if (!entry) { pushLines(["INVALID CODE."], "error"); break; } const alreadyRedeemed = getRedeemedCodes().includes(code); const asset = entry.type === "asset" ? STORY_ASSETS.find((a) => a.id === entry.rewardId) : null; const conditionCheck = asset ? checkAssetCondition(asset.condition) : { blocked: false }; if (entry.type === "asset" && alreadyRedeemed) { if (conditionCheck.blocked) { pushLines(["CODE ALREADY REDEEMED.", `ASSET: ${asset?.title || "UNKNOWN"}`, "STATUS: CONDITIONAL HOLD ACTIVE", conditionCheck.message || ""], "warning"); } else { const newlyUnlocked = unlockAsset(entry.rewardId); if (newlyUnlocked) { pushLines(["CONDITIONS MET.", `ASSET UNLOCKED: ${asset?.title || "UNKNOWN"}`, `Rarity: ${(asset?.rarity || "unknown").toUpperCase()}`, "The archive grows."], "success"); setAssets(getUnlockedAssets()); } else { pushLines(["ALREADY RECOVERED.", asset?.description || ""], "normal"); } } break; } redeemCode(code); if (entry.type === "asset") { if (conditionCheck.blocked) { pushLines(["CODE ACCEPTED.", `ASSET: ${asset?.title || "UNKNOWN"}`, "STATUS: CONDITIONAL HOLD", conditionCheck.message || "", "Return when requirements are cleared."], "warning"); } else { unlockAsset(entry.rewardId); pushLines(["CODE ACCEPTED.", `Recovered: ${asset?.title || entry.rewardId}`, `Rarity: ${(asset?.rarity || "unknown").toUpperCase()}`], "success"); setActiveTab("assets"); checkLeadProgress(); } } else if (entry.type === "theme") { if (THEMES[entry.rewardId as ThemeKey]) { setTheme(entry.rewardId as ThemeKey); localStorage.setItem("bunker-theme", entry.rewardId);
          }
          pushLines([`Theme: ${entry.rewardId.toUpperCase()}`], "success");
        } else if (entry.type === "cache_key") {
          localStorage.setItem("bunker-cache-key", "true");
          pushLines(["CACHE-KEY acquired."], "success");
        } else if (entry.type === "lore") {
          pushLines(["Lore fragment added.", entry.description || ""], "success");
        } else if (entry.type === "command") {
          pushLines([`Command: ${entry.rewardId}`, "Unlocked."], "success");
        }
        break;
      }

      case "gallery":
        setGalleryOpen(true);
        pushLines(["Opening gallery..."], "system");
        break;

      case "collection": {
        const assetsList = getUnlockedAssets();
        const codesList = getRedeemedCodes();
        pushLines([
          "┌─ COLLECTION STATUS ──────────────────┐",
          `│  Assets:    ${String(assetsList.length).padEnd(3)} / ${STORY_ASSETS.length}${" ".repeat(15)}│`,
          `│  Codes:     ${String(codesList.length).padEnd(3)} / ${REDEEMABLE_CODES.length}${" ".repeat(15)}│`,
          `│  Complete:  ${String(Math.floor((assetsList.length / STORY_ASSETS.length) * 100)).padEnd(3)}%${" ".repeat(19)}│`,
          "└──────────────────────────────────────┘",
        ], "system");
        break;
      }

      case "cache": {
        const hasKey = localStorage.getItem("bunker-cache-key") === "true";
        const now = new Date();
        const is314Now = now.getHours() === 3 && now.getMinutes() === 14;
        const unlockedCache = hasKey || is314Now;
        pushLines([
          "┌─ SECURE CACHE ───────────────────────┐",
          "│  FILE_00: I can see when you will    │",
          "│           return. I hope I'm wrong.   │",
          unlockedCache ? "│  [11 ADDITIONAL FILES UNLOCKED]      │" : "│  [11 FILES SEALED — UNLOCKS 03:14]   │",
          "└──────────────────────────────────────┘",
        ], "system");
        if (unlockedCache) {
          pushLines([
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
            is314Now ? "You came at the right time. No one does." : "Cache key bypass active.",
          ], "normal");
        }
        break;
      }

      case "triangulate":
        if (!triangulated) {
          pushLines(["INSUFFICIENT DATA.", "Find 3 signal towers on atlas."], "error");
        } else {
          pushLines(["TRIANGULATION COMPLETE.", "Origin: Your sector.", "The bunker is closer than you think.", "CODE: TRIANGULATE"], "success");
        }
        break;

      case "lanterns": {
        const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
        if (lanterns.length === 0) {
          pushLines(["No lanterns detected on the grid.", "Place them on the atlas. They burn in the dark.", "cmd: Go to atlas → 'Lanterns' → 'Place' → click a ruin."], "normal");
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

      case "constellation": {
        const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
        if (lanterns.length < 5) {
          pushLines([`Constellation incomplete.`, `Lanterns placed: ${lanterns.length}/5`, "Place 5 lanterns on the atlas to align the grid."], "normal");
        } else {
          pushLines([
            "╔══════════════════════════════════════╗",
            "║  CONSTELLATION ALIGNED               ║",
            "╠══════════════════════════════════════╣",
            "║  5 points of light. The grid holds.  ║",
            "║  Legendary code: STAR-CHART-7        ║",
            "║  The archivist used to map stars.    ║",
            "║  Now he maps dust.                   ║",
            "╚══════════════════════════════════════╝",
          ], "success");
        }
        break;
      }

      case "inventory": {
        const inv = getInventory();
        if (inv.length === 0) {
          pushLines(["Your pockets are empty.", "Visit ruins on the atlas. The dust leaves things behind."], "normal");
        } else {
          pushLines([
            `CARRYING: ${inv.length} item${inv.length > 1 ? "s" : ""}`,
            ...inv.map((id) => {
              const item = INVENTORY_ITEMS.find((i) => i.id === id);
              return `  ${item?.icon || "•"} ${item?.name || id} — ${item?.desc || ""}`;
            }),
            "",
            "BUNKER_7 is watching your collection.",
          ], "normal");
        }
        break;
      }

      case "wall":
        setActiveTab("wall");
        pushLines(["Opening TRANSMISSION WALL...", `${wallMessages.length} signals archived.`], "system");
        break;

      case "look": {
        if (!is314) {
          pushLines(["Command unavailable.", "The dark is not deep enough.", "Return at 03:14."], "error");
        } else {
          const visions = [
            "A corridor that wasn't there before. The walls are breathing.",
            "Your reflection in a dark monitor. It blinks when you don't.",
            "Coordinates: 38°74.000'N, 000°00.000'E. The ocean floor.",
            "A photograph of you, smiling, timestamped 1987.",
            "BUNKER_3. The door is open. Someone is typing.",
          ];
          const v = visions[Math.floor(Math.random() * visions.length)];
          pushLines([
            "╔══════════════════════════════════════╗",
            "║  03:14 VISION                        ║",
            "╠══════════════════════════════════════╣",
            `║  ${v.padEnd(36)}║`,
            "╚══════════════════════════════════════╝",
          ], "warning");
        }
        break;
      }

      case "whoareyou": {
        if (otherCount < 3) {
          pushLines([`The Other has spoken ${otherCount} time${otherCount !== 1 ? "s" : ""}.`, "It does not answer to names.", "Keep listening."], "normal");
        } else {
          pushLines([
            "╔══════════════════════════════════════╗",
            "║  I AM THE STATIC BETWEEN THOUGHTS    ║",
            "║  I AM THE DUST THAT REMEMBERS        ║",
            "║  I AM WHAT WAS HERE BEFORE THE ARCHIVIST ║",
            "║  AND WHAT WILL REMAIN AFTER           ║",
            "╠══════════════════════════════════════╣",
            "║  You have heard me 3 times.          ║",
            "║  That is enough.                     ║",
            "╚══════════════════════════════════════╝",
            "",
            "BUNKER_7 has gone quiet.",
          ], "other");
        }
        break;
      }

      case "profile": {
        const dustLvl = localStorage.getItem("vp-dust-accumulation") || "0";
        const visits = JSON.parse(localStorage.getItem("vp-expedition-log") || "[]");
        const echoes = localStorage.getItem("echoes-visited") === "true";
        const profile = parseInt(dustLvl) > 75 && echoes ? "GHOST" : echoes ? "WITNESS" : visits.length > 5 ? "FIELD AGENT" : "OBSERVER";
        pushLines([
          "┌─ PROFILE ────────────────────────────┐",
          `│  Class:  ${profile.padEnd(28)}│`,
          `│  Dust:    ${String(dustLvl).padEnd(3)}%${" ".repeat(25)}│`,
          `│  Sites:   ${String(visits.length).padEnd(3)}${" ".repeat(26)}│`,
          `│  Echoes:  ${echoes ? "YES" : "NO"}${" ".repeat(27)}│`,
          `│  Towers:  ${triangulated ? "YES" : "NO"}${" ".repeat(27)}│`,
          "└──────────────────────────────────────┘",
        ], "system");
        break;
      }

      case "call": {
        pushLines([
          "╔══════════════════════════════════════╗",
          "║  VOICE CHANNEL                       ║",
          "╠══════════════════════════════════════╣",
          "║  Number: +1-503-825-0190             ║",
          "║  Hours: 03:00 — 04:00 local time     ║",
          "║  Status: INTERMITTENT                ║",
          "╠══════════════════════════════════════╣",
          "║  BUNKER_7 does not always answer.    ║",
          "║  Sometimes the static answers.         ║",
          "║  Sometimes no one answers.             ║",
          "║  Sometimes someone breathes.         ║",
          "╚══════════════════════════════════════╝",
          "",
          "If you reach voicemail, leave a frequency.",
          "If you reach the archivist, do not waste his time.",
        ], "system");
        break;
      }

      case "weekly": {
        const rot = getWeeklyRotation();
        pushLines([
          "╔══════════════════════════════════════╗",
          "║  WEEKLY ROTATION                     ║",
          `║  Week ${rot.week}, ${rot.year}${" ".repeat(22 - String(rot.week).length - String(rot.year).length)}║`,
          "╠══════════════════════════════════════╣",
          `║  Anomaly: ${rot.anomalyName.padEnd(26)}║`,
          `║  Featured: ${rot.featuredPlace.padEnd(25)}║`,
          `║  Dust Mult: ${String(rot.dustMultiplier).padEnd(24)}║`,
          "╠══════════════════════════════════════╣",
          `║  Bonus: ${rot.bonusCode.padEnd(28)}║`,
          "╚══════════════════════════════════════╝",
        ], "system");
        break;
      }

      case "other": {
        const encounters = getOtherEncounters();
        const stage = encounters === 0 ? "You have not been touched." : encounters <= 2 ? "The static knows your name." : encounters <= 5 ? "BUNKER_7 may not be trustworthy." : encounters <= 8 ? "The Wall is not secure." : encounters <= 11 ? "The Hijack is possible." : "The Haunting is permanent.";
        pushLines([`OTHER ENCOUNTERS: ${encounters}`, stage, ""], "normal");
        break;
      }

      case "enter": {
        const placeId = args[1];
        if (!placeId) {
          if (unlockedSubPlaces.length === 0) {
            pushLines(["No sub-places available.", "Accumulate dust and explore the atlas."], "error");
          } else {
            pushLines([
              "Usage: enter [sub-place-id]",
              "Available sub-places:",
              ...unlockedSubPlaces.map((sp) => `  ${sp.id} — ${sp.name} (${sp.risk})`),
              "",
            ], "normal");
          }
        } else {
          const sp = getSubPlaceById(placeId);
          if (!sp) {
            pushLines(["Unknown sub-place.", ""], "error");
          } else if (!unlockedSubPlaces.find((u) => u.id === placeId)) {
            pushLines([
              "ACCESS DENIED.",
              `Required dust: ${sp.requiredDust}%`,
              sp.requiredItem ? `Required item: ${sp.requiredItem}` : "",
              sp.requiredCode ? `Required code: ${sp.requiredCode}` : "",
              "",
            ], "error");
          } else {
            enterSubPlace(sp);
            pushLines([
              `╔══════════════════════════════════════╗`,
              `║  ENTERING: ${sp.name.toUpperCase().slice(0, 24).padEnd(24)}║`,
              `╠══════════════════════════════════════╣`,
              ...sp.lore.map((l) => `║  ${l.slice(0, 34).padEnd(34)}║`),
              `╠══════════════════════════════════════╣`,
              `║  Risk: ${sp.risk.toUpperCase().padEnd(27)}║`,
              `║  Dust reward: ${String(sp.dustReward).padEnd(20)}║`,
              `╚══════════════════════════════════════╝`,
              "",
            ], "system");
          }
        }
        break;
      }

      case "exorcise": {
        if (!hijacked) {
          pushLines(["Nothing to exorcise.", "The channel is clear.", ""], "normal");
        } else {
          setHijacked(false);
          pushLines(["You push back.", "The static recedes.", "BUNKER_7 signal restored.", ""], "success");
        }
        break;
      }

      case "grid": {
        setShowGrid(true);
        pushLines(["Initializing grid visualization...", "The atlas is more connected than it appears."], "system");
        break;
      }

      case "spectrogram": {
        setShowSpectrogram(true);
        pushLines(["Spectrogram viewer active.", "Watch the frequencies. They watch back."], "system");
        break;
      }

      case "leads": {
        const leadState = checkLeadProgress();
        if (leadState) {
          const progress = Math.round((leadState.objectives.filter((o: { completed: boolean }) => o.completed).length / leadState.objectives.length) * 100);
          pushLines([
            `ACTIVE LEAD: ${leadState.title.toUpperCase()}`,
            `Progress: ${progress}%`,
            ...leadState.objectives.map((o: { completed: boolean; text: string }) => `  ${o.completed ? "[✓]" : "[ ]"} ${o.text}`),
            "",
            leadState.hint ? `Hint: ${leadState.hint}` : "",
            "",
          ], "normal");
        } else {
          const next = generateNextLead();
          if (next) {
            pushLines([
              "╔══════════════════════════════════════╗",
              "║  NEW LEAD ACQUIRED                   ║",
              `║  ${next.title.toUpperCase().padEnd(34)}║`,
              "╠══════════════════════════════════════╣",
              `║  ${next.description.slice(0, 34).padEnd(34)}║`,
              "╚══════════════════════════════════════╝",
              "",
            ], "success");
          } else {
            pushLines(["No active leads.", "All objectives complete.", "The archive is silent."], "normal");
          }
        }
        break;
      }

      case "daily": {
        const { code, valid, window } = getDailyCode();
        if (valid) {
          pushLines([
            "╔══════════════════════════════════════╗",
            "║  DAILY FREQUENCY ACQUIRED            ║",
            `║  ${code.padEnd(36)}║`,
            "╚══════════════════════════════════════╝",
            "Redeem this code before the window closes.",
          ], "success");
        } else {
          pushLines([`Daily frequency unavailable.`, `Next window: ${window}`, `Yesterday's code: ${code} (expired)`], "normal");
        }
        break;
      }

      case "email": {
        const email = args.slice(1).join(" ");
        if (!email || !email.includes("@")) {
          pushLines(["Usage: email [your@address.com]", "BUNKER_7 will remember your frequency."], "error");
        } else {
          const key = "bunker-emails";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ email, date: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));
          fetch("/api/bunker-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
          pushLines(["FREQUENCY REGISTERED.", `Relay: ${email}`, "You will receive one transmission.", "Do not reply. The channel is one-way."], "success");
        }
        break;
      }

      case "party": {
        const partyId = args[1];
        const code = args[2];
        if (!partyId || !code) {
          pushLines(["Usage: party [party-id] [your-code]", "Tri-party authentication required for legendary assets.", "Share the party ID with two other witnesses."], "error");
        } else {
          fetch("/api/collaborative", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, code }) })
            .then((r) => r.json())
            .then((data) => {
              if (data.status === "complete") {
                redeemCode(data.code);
                pushLines(["TRI-PARTY AUTHENTICATION COMPLETE.", `Legendary code: ${data.code}`, "The grid stabilizes when witnesses unite."], "success");
              } else {
                pushLines([`Witnesses: ${3 - data.needed}/3`, data.message], "normal");
              }
            });
        }
        break;
      }

      case "witnesses": {
        const all = JSON.parse(localStorage.getItem("bunker-emails") || "[]");
        if (all.length === 0) {
          pushLines(["No witnesses registered."], "normal");
        } else {
          pushLines([
            "REGISTERED FREQUENCIES:",
            ...all.map((w: { email: string; date: string }) => `  ${w.email} — ${new Date(w.date).toLocaleDateString()}`),
            "",
            `${all.length} total witnesses.`,
          ], "normal");
        }
        break;
      }

      case "broadcast": {
        const key = args.slice(1).join(" ");
        if (key === "on bunker7") {
          localStorage.setItem("bunker-broadcasting", "true");
          pushLines([
            "╔══════════════════════════════════════╗",
            "║  BROADCAST RELAY ACTIVE              ║",
            "║  Frequency: UNAUTHORIZED             ║",
            "║  Platform: TWITCH                    ║",
            "╚══════════════════════════════════════╝",
            "",
            "All terminals will detect this frequency.",
            "The grid is intercepting.",
          ], "warning");
        } else if (key === "off") {
          localStorage.setItem("bunker-broadcasting", "false");
          pushLines(["Broadcast terminated.", "The static returns.", "The channel is dead again."], "normal");
        } else {
          pushLines(["BROADCAST CONTROL", "Usage: broadcast ON BUNKER7", "       broadcast OFF", "", "You need the authorization key to go live."], "error");
        }
        break;
      }

      case "clear":
        setLines([]);
        break;

      case "discover": {
        const name = args.slice(1).join(" ");
        if (!name) {
          const discoveries = getDiscoveries();
          if (discoveries.length === 0) {
            pushLines(["Usage: discover [place name]", "Log a real abandoned place you have found.", "The atlas grows when witnesses contribute."], "error");
          } else {
            pushLines([
              "YOUR DISCOVERIES:",
              ...discoveries.map((d) => `  ${d.name} — ${d.location} (+${d.dustReward} dust)`),
              "",
              `Total: ${discoveries.length} places documented.`,
            ], "normal");
          }
          break;
        }
        const discovery = addDiscovery({ name, location: "Unknown coordinates", description: "Logged by witness." });
        pushLines([
          "╔══════════════════════════════════════╗",
          "║  DISCOVERY LOGGED                    ║",
          `║  ${name.toUpperCase().slice(0, 34).padEnd(34)}║`,
          "╠══════════════════════════════════════╣",
          `║  Dust reward: ${String(discovery.dustReward).padEnd(20)}║`,
          "╚══════════════════════════════════════╝",
          "",
          "The atlas remembers what you have seen.",
        ], "success");
        setDust((prev) => prev + discovery.dustReward);
        break;
      }

      case "purge": {
        const inv = getInventory();
        if (inv.length === 0) {
          pushLines(["PURGE FAILED.", "You have nothing to sacrifice.", "The dust requires a trade."], "error");
          break;
        }
        const sacrificed = inv[Math.floor(Math.random() * inv.length)];
        const item = INVENTORY_ITEMS.find((i) => i.id === sacrificed);
        const newInv = inv.filter((id) => id !== sacrificed);
        localStorage.setItem("bunker-inventory", JSON.stringify(newInv));
        purgeDust();

        const consequences: string[] = [];
        const deleteLogRoll = Math.random();
        const deleteAssetRoll = Math.random();

        if (deleteLogRoll < 0.2 && unlocked > 3) {
          const nextUnlocked = Math.max(3, unlocked - 1);
          setUnlocked(nextUnlocked);
          localStorage.setItem("bunker-unlocked", nextUnlocked.toString());
          consequences.push("A log entry has been erased. You will not read it again.");
        }
        if (deleteAssetRoll < 0.15 && assets.length > 0) {
          const lostAsset = assets[Math.floor(Math.random() * assets.length)];
          const nextAssets = assets.filter((a) => a !== lostAsset);
          localStorage.setItem("bunker-assets", JSON.stringify(nextAssets));
          setAssets(nextAssets);
          consequences.push(`An asset has been corrupted: ${lostAsset}. It is gone.`);
        }

        pushLines([
          "╔══════════════════════════════════════╗",
          "║  PURGE COMPLETE                      ║",
          "╠══════════════════════════════════════╣",
          `║  Sacrificed: ${(item?.name || sacrificed).padEnd(24)}║`,
          "║  Dust:        0%                     ║",
          "║  Corruption:  0                        ║",
          ...(consequences.length > 0 ? ["╠══════════════════════════════════════╣"] : []),
          ...consequences.map((c) => `║  ${c.slice(0, 34).padEnd(34)}║`),
          "╠══════════════════════════════════════╣",
          "║  You feel lighter.                     ║",
          "║  The places remember anyway.         ║",
          "╚══════════════════════════════════════╝",
        ], "success");
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
      localStorage.setItem("bunker-unlocked", next.toString());
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
    <main
      className="min-h-screen font-mono relative overflow-hidden selection:bg-[#9a8a72]/20"
      style={{ backgroundColor: t.bg, color: t.primary }}
    >
      {/* CRT Effects */}
      <div className="pointer-events-none fixed inset-0 z-50" style={{ background: "linear-gradient(rgba(18,16,20,0.03) 50%, rgba(0,0,0,0.03) 50%)", backgroundSize: "100% 4px" }} />
      <div className="pointer-events-none fixed inset-0 z-50" style={{ background: "radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
      {corruption.stage >= 4 && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-pulse" style={{ background: "rgba(255,50,50,0.015)", animationDuration: "4s" }} />
      )}

      {!booted && <TerminalBootSequence onComplete={() => setBooted(true)} />}

      <div className="min-h-screen flex flex-col relative z-10 p-3 md:p-5 gap-3">
        {/* STATUS HUD */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg px-3 md:px-4 py-2 gap-2"
          style={{ borderColor: `${t.primary}12`, backgroundColor: `${t.primary}03` }}
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} />
            <div>
              <h1 className="text-xs tracking-[0.2em] uppercase font-bold">Bunker_7</h1>
              <p className="text-[8px] opacity-50 tracking-wider">Echoes & Dust // v2.4.1</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5 text-[9px] md:text-[10px] overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="opacity-40" />
              <span className="opacity-60">Dust</span>
              <ProgressBar value={dust} max={100} color={dust > 75 ? "#ff6b6b" : t.accent} />
              <span className="font-bold">{dust}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye size={10} className="opacity-40" style={{ color: corruption.color }} />
              <span className="opacity-60" style={{ color: corruption.color }}>{corruption.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={10} className="opacity-40" />
              <span className="opacity-60">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio size={10} className="opacity-40" />
              <span className="opacity-60">Other:{otherCount}</span>
            </div>
            <span className="opacity-40 hidden sm:inline">{theme.toUpperCase()}</span>
            <Link href="/" className="opacity-40 hover:opacity-100 transition-opacity text-[8px] uppercase tracking-wider flex items-center gap-0.5">
              <ArrowLeft size={10} /> Atlas
            </Link>
          </div>
        </motion.div>

        {/* MAIN GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0">
          {/* TERMINAL */}
          <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
            <div
              className="flex-1 border rounded-lg flex flex-col overflow-hidden relative"
              style={{ backgroundColor: `${t.primary}04`, borderColor: `${t.primary}15`, minHeight: "260px" }}
            >
              {/* Terminal Header */}
              <div className="px-3 md:px-4 py-1.5 border-b flex items-center justify-between" style={{ borderColor: `${t.primary}08`, backgroundColor: `${t.primary}04` }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#a06050]/50" />
                  <div className="w-2 h-2 rounded-full bg-[#c4a060]/50" />
                  <div className="w-2 h-2 rounded-full bg-[#7a9a6a]/50" />
                  <span className={`text-[8px] uppercase tracking-wider ml-1 ${hijacked ? "text-[#ff6b6b] animate-pulse" : "opacity-40"}`}>
                    {hijacked ? "THE OTHER" : chatMode ? "BUNKER_7 CHANNEL" : "CMD"}
                  </span>
                </div>
                {chatMode && (
                  <button onClick={() => { setChatMode(false); pushLines(["Channel closed.", "Returning to command interface."], "system"); }} className="text-[8px] uppercase opacity-40 hover:opacity-100 transition-opacity">[x]</button>
                )}
              </div>

              {/* Output */}
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-0.5">
                {lines.map((line) => (
                  <TerminalLineView key={line.id} line={line} theme={t} corruptionStage={corruption.stage} />
                ))}
                {isAiTyping && (
                  <div className="opacity-50 animate-pulse mt-1 text-[11px]" style={{ color: t.dim }}>
                    <span className="inline-block w-1.5 h-3 bg-current animate-pulse mr-0.5" />
                    BUNKER_7 is typing...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 md:px-4 py-2 border-t relative" style={{ borderColor: `${t.primary}08`, backgroundColor: `${t.primary}03` }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-50 font-bold select-none">
                    {chatMode ? "~" : promptLabel}
                  </span>
                  <span className="text-xs opacity-30 select-none">{">"}</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); onType(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { runCommand(input); }
                      else if (e.key === "Tab" && suggestions.length > 0) { e.preventDefault(); setInput(suggestions[0]); setSuggestions([]); }
                      else if (e.key === "?" && !chatMode && !input) { e.preventDefault(); setShowPalette(true); setPaletteQuery(""); }
                    }}
                    className="flex-1 bg-transparent text-[13px] font-mono outline-none placeholder:opacity-20 min-w-0"
                    style={{ color: t.primary, caretColor: t.cursor }}
                    placeholder={chatMode ? "Speak to BUNKER_7..." : "Enter command... (? for palette)"}
                    spellCheck={false}
                    autoFocus
                  />
                  <span className={`text-xs opacity-40 ${cursorStyle === "block" ? "bg-current w-2 h-4" : cursorStyle === "pipe" ? "w-0.5 h-4 bg-current" : "w-3 h-0.5 bg-current"} inline-block`} style={{ color: t.cursor }} />
                </div>

                {/* Autocomplete */}
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-4 right-4 bottom-full mb-1 border rounded-md overflow-hidden" style={{ borderColor: `${t.primary}15`, backgroundColor: t.bg }}>
                      {suggestions.map((s) => (
                        <button key={s} onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus(); }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/5 transition-colors flex items-center justify-between">
                          <span>{s}</span>
                          <span className="opacity-30 text-[9px]">{COMMAND_REGISTRY.find((c) => c.cmd === s)?.desc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Command Palette Modal */}
            <AnimatePresence>
              {showPalette && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/60 flex items-start justify-center pt-24 p-4" onClick={() => setShowPalette(false)}>
                  <motion.div initial={{ scale: 0.95, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg border rounded-lg overflow-hidden" style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }}>
                    <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: `${t.primary}10` }}>
                      <HelpCircle size={12} className="opacity-40" />
                      <input autoFocus value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)} placeholder="Filter commands..." className="flex-1 bg-transparent text-[12px] outline-none placeholder:opacity-30" style={{ color: t.primary }} />
                      <button onClick={() => setShowPalette(false)} className="text-[10px] opacity-40 hover:opacity-100">ESC</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
                      {paletteCommands.map((c) => (
                        <button key={c.cmd} onClick={() => { setShowPalette(false); setInput(c.cmd); inputRef.current?.focus(); }} className="w-full text-left px-3 py-2 rounded text-[11px] hover:bg-white/5 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <span className="opacity-50 font-bold">{c.cmd}</span>
                            <span className="opacity-30">{c.desc}</span>
                          </div>
                          <span className="opacity-20 text-[9px] uppercase">{c.category}</span>
                        </button>
                      ))}
                      {paletteCommands.length === 0 && <p className="text-center text-[11px] opacity-30 py-4">No commands match.</p>}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Toggle */}
            <button onClick={() => setVideoPanelOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[9px] uppercase tracking-wider hover:opacity-80 transition-opacity" style={{ borderColor: `${t.primary}12`, backgroundColor: `${t.primary}03` }}>
              <Radio size={10} className={videoPanelOpen ? "animate-pulse" : ""} />
              {videoPanelOpen ? "Hide" : "Show"} Videos
            </button>

            <AnimatePresence>
              {videoPanelOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {VIDEO_LOGS.map((v) => (
                      <button key={v.label} onClick={() => setInlineVideo({ src: v.src, label: v.label })} className="flex items-center sm:flex-col gap-1.5 p-2 border rounded-lg hover:opacity-80 transition-opacity text-left sm:text-center" style={{ borderColor: `${t.primary}12`, backgroundColor: `${t.primary}03` }}>
                        <Play size={12} className="opacity-50 flex-shrink-0" />
                        <div className="min-w-0"><span className="text-[9px] block truncate">{v.label}</span><span className="text-[8px] opacity-40">{v.day}</span></div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SIDE PANEL */}
          <div className="lg:col-span-2 flex flex-col gap-2 min-h-0">
            <div className="flex gap-1 border-b pb-1.5 overflow-x-auto" style={{ borderColor: `${t.primary}10` }}>
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-1 py-1.5 px-2 md:px-3 text-[8px] md:text-[10px] uppercase tracking-wider rounded transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? "opacity-100" : "opacity-40 hover:opacity-70"}`} style={activeTab === tab.id ? { backgroundColor: `${t.primary}08`, borderBottom: `2px solid ${t.accent}` } : {}}>
                  <tab.icon size={10} /><span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 border rounded-lg overflow-y-auto p-3 md:p-4" style={{ borderColor: `${t.primary}10`, backgroundColor: `${t.primary}02`, minHeight: "180px" }}>
              <AnimatePresence mode="wait">
                {activeTab === "logs" && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-2">Archived Logs</h3>
                    {LOGS.slice(0, unlocked).map((log) => (
                      <div key={log.day} className="border-l-2 pl-3" style={{ borderColor: `${t.primary}20` }}>
                        <p className="text-[9px] tracking-widest opacity-50 mb-1">{log.day}</p>
                        <p className="text-[12px] md:text-[13px] leading-relaxed opacity-90">{log.text}</p>
                      </div>
                    ))}
                    {unlocked < LOGS.length && (
                      <div className="flex items-center gap-1.5 text-[10px] opacity-40 py-3 border-t" style={{ borderColor: `${t.primary}06` }}>
                        <Lock size={10} />{LOGS.length - unlocked} entries encrypted
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "decrypt" && (
                  <motion.div key="decrypt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40">Decrypt</h3>
                    <p className="text-[11px] opacity-70 leading-relaxed">Enter codes from the Numbers Station.</p>
                    <div className="flex gap-2">
                      <input value={decryptCode} onChange={(e) => setDecryptCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && attemptDecrypt()} placeholder="Enter code..." className="flex-1 bg-transparent border-b-2 text-[13px] outline-none py-1 placeholder:text-[9px] placeholder:opacity-30 min-w-0" style={{ borderColor: decryptError ? "#a05050" : `${t.primary}25`, color: decryptError ? "#a05050" : t.primary }} spellCheck={false} />
                      <button onClick={attemptDecrypt} className="px-3 py-1 border rounded text-[10px] font-mono uppercase hover:opacity-80 transition-opacity" style={{ borderColor: `${t.primary}20`, color: t.primary }}>Decrypt</button>
                    </div>
                    {decryptError && <p className="text-[10px] text-[#a05050]">Invalid code.</p>}
                  </motion.div>
                )}

                {activeTab === "assets" && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40">Assets</h3>
                      <button onClick={() => setGalleryOpen(true)} className="text-[9px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"><Image size={10} /> Gallery</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {STORY_ASSETS.map((asset) => {
                        const isUnlocked = assets.includes(asset.id);
                        return (
                          <div key={asset.id} className={`p-2 border rounded text-center space-y-0.5 ${isUnlocked ? "opacity-100" : "opacity-30"}`} style={{ borderColor: `${t.primary}12`, backgroundColor: isUnlocked ? `${t.primary}05` : "transparent" }}>
                            <div className="text-[8px] uppercase tracking-wider" style={{ color: isUnlocked ? "#a855f7" : "inherit" }}>{asset.rarity}</div>
                            <div className="text-[10px] font-bold truncate">{asset.title}</div>
                            <div className="text-[8px] opacity-60">{isUnlocked ? "RECOVERED" : "ENCRYPTED"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[10px] opacity-40 pt-1">{assets.length} / {STORY_ASSETS.length}</div>
                  </motion.div>
                )}

                {activeTab === "puzzles" && (
                  <motion.div key="puzzles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 text-[11px] md:text-[13px] leading-relaxed">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-2">Anomalies</h3>
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
                      <div key={p.n} className="p-2 md:p-3 border rounded" style={{ borderColor: `${t.primary}08` }}>
                        <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[9px] opacity-40">{p.n}</span><span className="font-bold text-[10px]">{p.title}</span></div>
                        <p className="opacity-80 text-[10px]">{p.body}</p>
                        {p.hint && <p className="text-[9px] opacity-40 mt-0.5">{p.hint}</p>}
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "status" && (
                  <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 text-[11px] md:text-[13px] font-mono">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40">Status</h3>
                    <div className="space-y-1 opacity-90">
                      <p>ID: BUNKER_7</p><p>STATUS: SEALED</p><p>THEME: {theme.toUpperCase()}</p><p>LOGS: {unlocked}/{LOGS.length}</p><p>DUST: {dust}%</p><p>ASSETS: {assets.length}/{STORY_ASSETS.length}</p><p>INVENTORY: {inventory.length}</p><p className="animate-pulse pt-1">LISTENING</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "wall" && (
                  <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <h3 className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-1">Wall</h3>
                    <p className="text-[10px] opacity-60 mb-2">Use <span className="font-mono opacity-80">transmit [msg]</span> to add.</p>
                    {wallMessages.length === 0 ? <p className="text-[11px] opacity-30 italic">The static is silent.</p> : (
                      <div className="space-y-1.5">
                        {wallMessages.slice(-20).map((m, i) => (
                          <div key={i} className="border-l-2 pl-2 py-0.5" style={{ borderColor: `${t.primary}15` }}>
                            <p className="text-[11px] opacity-90 leading-relaxed">{m.text}</p>
                            <p className="text-[8px] opacity-30 mt-0.5 font-mono">{m.date}</p>
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

        {/* INLINE VIDEO */}
        {inlineVideo && (
          <div className="w-full max-w-3xl mx-auto">
            <TerminalVideoPlayer src={inlineVideo.src} label={inlineVideo.label} themeColor={t.primary} onClose={() => setInlineVideo(null)} />
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center opacity-20 text-[8px] tracking-widest py-1"><p>THE DUST REMEMBERS EVERYTHING</p></div>
      </div>

      {/* OVERLAYS */}
      {showGrid && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-2xl border rounded-lg p-4" style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xs uppercase tracking-widest">The Grid</h2><button onClick={() => setShowGrid(false)} className="text-xs opacity-50 hover:opacity-100">[x]</button></div>
            <TheGrid />
          </div>
        </div>
      )}

      {showSpectrogram && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowSpectrogram(false)}>
          <div className="w-full max-w-lg border rounded-lg p-4" style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xs uppercase tracking-widest">Spectrogram</h2><button onClick={() => setShowSpectrogram(false)} className="text-xs opacity-50 hover:opacity-100">[x]</button></div>
            <SpectrogramViewer active={true} color={t.primary} />
          </div>
        </div>
      )}

      {currentSubPlace && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-lg border rounded-lg p-4 space-y-3" style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }}>
            <div className="flex items-center justify-between"><h2 className="text-xs uppercase tracking-widest text-[#a05050]">{currentSubPlace.name}</h2><button onClick={exitSubPlace} className="text-xs opacity-50 hover:opacity-100">[exit]</button></div>
            <p className="text-[12px] opacity-80 leading-relaxed">{currentSubPlace.description}</p>
            <div className="space-y-1">{currentSubPlace.lore.map((l, i) => <p key={i} className="text-[10px] opacity-60 border-l-2 pl-2" style={{ borderColor: `${t.primary}15` }}>{l}</p>)}</div>
            {currentSubPlace.choices && <SubPlaceChoicePanel subPlace={currentSubPlace} theme={t} onConsequence={(lines) => pushLines([...lines, ""])} />}
            <div className="text-[9px] opacity-40 pt-2 border-t" style={{ borderColor: `${t.primary}08` }}>Risk: {currentSubPlace.risk} | Dust: +{currentSubPlace.dustReward}</div>
          </div>
        </div>
      )}

      <VideoModal src={activeVideo?.src || ""} label={activeVideo?.label || ""} isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} />
      <AssetGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} themeColor={t.primary} />
    </main>
  );
}