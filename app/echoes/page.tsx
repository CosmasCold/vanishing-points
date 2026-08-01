"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Terminal,
  Play,
  Lock,
  Image,
  BookOpen,
  Shield,
  Zap,
  ArrowLeft,
  Package,
  MessageSquare,
  Target,
  Eye,
  Volume2,
  VolumeX,
  Maximize2,
  X,
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
import {
  getMemory,
  updateMemory,
  getSentiment,
  getOtherEncounters,
  recordOtherEncounter,
  shouldTriggerOther,
  getOtherResponse,
  getGhostLines,
  getBunkerLie,
  getGlobalLanternCount,
} from "@/lib/bunkerBrain";
import { logPlayerCommand, getProceduralGhostLines, getMemoryBasedOtherResponse } from "@/lib/otherMemory";
import { useKeystrokeAudio } from "@/hooks/useKeystrokeAudio";
import { addDiscovery, getDiscoveries } from "@/lib/discoveries";
import SubPlaceChoicePanel from "@/components/SubPlaceChoicePanel";
import {
  findItem,
  getInventory,
  hasItem,
  INVENTORY_ITEMS,
} from "@/lib/inventory";
import {
  useCorruptionStage,
  useIdleGhost,
  useThreeFourteen,
} from "@/hooks/useStickyFeatures";
import { getWeeklyRotation } from "@/lib/weeklyRotation";
import { getSubPlaceById } from "@/lib/subPlaces";
import { useSubPlaces } from "@/hooks/useSubPlaces";
import SpectrogramViewer from "@/components/SpectrogramViewer";
import TheGrid from "@/components/TheGrid";

const THEMES = {
  amber: {
    primary: "#e8d5c0",
    bg: "#0c0a08",
    glow: "rgba(232,213,192,0.12)",
    accent: "#c4a882",
    dim: "#6a5a4a",
    cursor: "#e8d5c0",
  },
  cyan: {
    primary: "#a8d8e8",
    bg: "#080a0c",
    glow: "rgba(168,216,232,0.12)",
    accent: "#6ab4c8",
    dim: "#4a7a8a",
    cursor: "#a8d8e8",
  },
  red: {
    primary: "#e8a8a0",
    bg: "#100808",
    glow: "rgba(232,168,160,0.12)",
    accent: "#c07060",
    dim: "#8a5048",
    cursor: "#e8a8a0",
  },
  white: {
    primary: "#d0d0d0",
    bg: "#0a0a0a",
    glow: "rgba(208,208,208,0.12)",
    accent: "#a0a0a0",
    dim: "#707070",
    cursor: "#d0d0d0",
  },
  phosphor: {
    primary: "#b8e8a0",
    bg: "#050a05",
    glow: "rgba(184,232,160,0.12)",
    accent: "#6aa85a",
    dim: "#4a7a3a",
    cursor: "#b8e8a0",
  },
  abyss: {
    primary: "#88c0d0",
    bg: "#020508",
    glow: "rgba(136,192,208,0.15)",
    accent: "#5e81ac",
    dim: "#4c566a",
    cursor: "#88c0d0",
  },
  emergency: {
    primary: "#ff6b6b",
    bg: "#1a0505",
    glow: "rgba(255,107,107,0.1)",
    accent: "#ee5253",
    dim: "#8a3a3a",
    cursor: "#ff6b6b",
  },
  tungsten: {
    primary: "#ffd8a8",
    bg: "#0a0806",
    glow: "rgba(255,216,168,0.12)",
    accent: "#e8b87a",
    dim: "#8a7050",
    cursor: "#ffd8a8",
  },
};

type ThemeKey = keyof typeof THEMES;
type SideTab = "logs" | "decrypt" | "signal" | "assets" | "puzzles" | "status" | "wall" | "leads";

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
    text: "I found a door in the bunker that was not on the schematic. It opens inward. The air that came out was warm, like exhalation. 3 degrees off the schematic.",
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

const VIDEO_LOGS = [
  {
    label: "TRANSMISSION_01.mxf",
    day: "DAY 001",
    src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346749/Tape_01__The_Signal_I_Found_f1zhoh.mp4",
  },
  {
    label: "TRANSMISSION_04.mxf",
    day: "DAY 004",
    src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346872/Tape_02__The_Blackout_jpq8cv.mp4",
  },
  {
    label: "STATIC_BURST.mxf",
    day: "DAY 012",
    src: "https://res.cloudinary.com/qgtwp1m7/video/upload/v1785346948/The_Corridor_of_Echoes_pvfyll.mp4",
  },
];

export default function EchoesPage() {
  const [theme, setTheme] = useState<ThemeKey>("amber");
  const t = THEMES[theme];

  const seasonal = getSeasonalState();
  const corruption = useCorruptionStage();
  const is314 = useThreeFourteen();
  const [booted, setBooted] = useState(false);

  const [unlocked, setUnlocked] = useState(3);
  const [activeVideo, setActiveVideo] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [inlineVideo, setInlineVideo] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [terminal, setTerminal] = useState<string[]>(() => {
    const lines = [
      "╔════════════════════════════════════════╗",
      "║     BUNKER_7 TERMINAL v2.4.1           ║",
      "╠════════════════════════════════════════╣",
      "║  Type 'help' for command list          ║",
      "║  Type 'chat' to speak with BUNKER_7   ║",
      "║  Type 'puzzles' for active anomalies   ║",
      "╚════════════════════════════════════════╝",
      "",
    ];
    if (seasonal.specialEvent) {
      lines.push(
        `[SEASONAL ANOMALY: ${seasonal.name}]`,
        seasonal.specialEvent,
        ""
      );
    }
    return lines;
  });
  const [input, setInput] = useState("");
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptError, setDecryptError] = useState(false);
  const [aiHistory, setAiHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [hijacked, setHijacked] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showSpectrogram, setShowSpectrogram] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [triangulated, setTriangulated] = useState(false);
  const [activeTab, setActiveTab] = useState<SideTab>("logs");
  const [videoPanelOpen, setVideoPanelOpen] = useState(false);
  const [wallMessages, setWallMessages] = useState<
    { text: string; date: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("bunker-wall") || "[]");
  });

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { active: breachActive, countdown: breachCountdown } =
    useBreachProtocol();
      const { onType } = useKeystrokeAudio();

  const memory = getMemory();
  const otherCount = getOtherEncounters();

  const [dust, setDust] = useState(0);
  const [assets, setAssets] = useState<string[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [lanternCount, setLanternCount] = useState(0);

  const { unlocked: unlockedSubPlaces, current: currentSubPlace, enter: enterSubPlace, exit: exitSubPlace } = useSubPlaces(dust, inventory, codes);

  useEffect(() => {
    markEchoesVisited();
    accumulateDust(10);
    const savedTheme = localStorage.getItem("bunker-theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
    const savedUnlocked = parseInt(
      localStorage.getItem("bunker-unlocked") || "3",
      10
    );
    setUnlocked(savedUnlocked);
    const savedTri = localStorage.getItem("bunker-triangulated") === "true";
    setTriangulated(savedTri);

    setDust(parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10));
    setAssets(getUnlockedAssets());
    setCodes(getRedeemedCodes());
    setInventory(getInventory());
    setLanternCount(getGlobalLanternCount());
  }, []);

  // Hijack check on mount
  useEffect(() => {
    if (shouldTriggerOther("hijack")) {
      setHijacked(true);
      recordOtherEncounter();
      pushTerminal([
        "",
        "═══════════════════════════════════════════════",
        "  THE OTHER HAS TAKEN THE CHANNEL",
        "═══════════════════════════════════════════════",
        "",
        "I am not malicious.",
        "I am just... here.",
        "",
      ]);
    }
  }, []);

  // Ghost line injection
  useEffect(() => {
    if (chatMode || hijacked) return;
    const interval = setInterval(() => {
      if (shouldTriggerOther("ghost") && Math.random() < 0.15) {
                const lines = getProceduralGhostLines();
        const line = lines[Math.floor(Math.random() * lines.length)];
        pushTerminal([line, ""]);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [chatMode, hijacked]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal, isAiTyping]);

  useIdleGhost((line) => {
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

    updateMemory("lastTopics", msg);
    const sentiment = getSentiment(msg);
    const mem = getMemory();

    try {
      const res = await fetch("/api/bunker-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: aiHistory,
          memory: {
            name: mem.name,
            lastTopics: mem.lastTopics.slice(-3),
            sentiment,
            otherEncounters: otherCount,
            corruption: corruption.stage,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const response = data.response || "...";

      if (data.other) {
        recordOtherEncounter();
      }

      setAiHistory((h) => [
        ...h.slice(-10),
        { role: "user", content: msg },
        { role: "assistant", content: response },
      ]);
      setTerminal((prev) => [...prev, response, ""]);
    } catch (err) {
      console.error("[CHAT ERROR]", err);
      pushTerminal(["the channel is dead. static only.", ""]);
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
    logPlayerCommand(base);

    // The Other lies (encounters 3-5)
    const lie = getBunkerLie(base);
    if (lie) {
      pushTerminal([lie, ""]);
      return;
    }

    // Hijack mode — The Other controls responses
          if (hijacked && base !== "exorcise") {
        pushTerminal([...getMemoryBasedOtherResponse(base), ""]);
        return;
      }

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
          "│  lanterns    View placed lanterns      │",
          "│  constellation Grid alignment          │",
          "│  inventory   Your found items          │",
          "│  wall        Transmission wall         │",
          "│  look        [03:14 ONLY]              │",
          "│  whoareyou   [3 encounters]            │",
          "│  profile     Your corruption profile  │",
          "│  call        Voice channel status      │",
          "│  leads       Active investigations     │",
          "│  other       The Other encounters      │",
          "│  weekly      Current rotation          │",
          "│  enter       Explore sub-places        │",
          "│  grid        View the constellation    │",
          "│  spectrogram Frequency visualizer      │",
          "│  discover    Log a real place          │",
          "│  exorcise    Restore BUNKER_7 control  │",
          "│  daily       Acquire daily frequency   │",
          "│  email       Register for transmission │",
          "│  party       Tri-party authentication  │",
          "│  witnesses   Registered frequencies    │",
          "│  broadcast   Go live / kill feed       │",
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
          `│  CORRUPTION:${corruption.label.padEnd(17)}│`,
          `│  OTHER:     ${otherCount} encounter${otherCount !== 1 ? "s" : ""}${" ".repeat(14 - String(otherCount).length)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;

      case "logs":
        setActiveTab("logs");
        pushTerminal([
          "Opening LOGS window...",
          `${LOGS.length - unlocked} entries remain encrypted.`,
        ]);
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
        const dustLvl = parseInt(
          localStorage.getItem("vp-dust-accumulation") || "0",
          10
        );
        const visits = localStorage.getItem("vp-expedition-log");
        const count = visits ? JSON.parse(visits).length : 0;
        const last = localStorage.getItem("vp-last-visit");
        const ago = last
          ? Math.floor((Date.now() - parseInt(last)) / 3600000)
          : "unknown";
        const fragments = JSON.parse(
          localStorage.getItem("bunker-fragments") || "[]"
        );
        pushTerminal([
          "┌─ ENVIRONMENT SCAN ───────────────────┐",
          `│  Dust accumulation: ${String(dustLvl).padEnd(3)}%           │`,
          `│  Documented sites:  ${String(count).padEnd(3)}           │`,
          `│  Hours since contact: ${String(ago).padEnd(10)}      │`,
          `│  Fragments:         ${String(fragments.length).padEnd(3)}           │`,
          dustLvl > DUST_THRESHOLD
            ? "│  [!] DUST LEVELS CRITICAL            │"
            : "│  Dust levels nominal                 │",
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
        const saved = JSON.parse(
          localStorage.getItem("bunker-fragments") || "[]"
        );
        const newFrags = allFrags.filter(
          (f: string) => !saved.includes(f.split(":")[0])
        );
        if (newFrags.length > 0) {
          const pick =
            newFrags[Math.floor(Math.random() * newFrags.length)];
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
          pushTerminal([
            "Usage: transmit [message]",
            "All transmissions monitored.",
          ]);
        } else {
          const key = "bunker-transmissions";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ text: msg, date: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));

          const wall = JSON.parse(
            localStorage.getItem("bunker-wall") || "[]"
          );
          wall.push({
            text: msg,
            date: new Date().toLocaleTimeString(),
          });
          localStorage.setItem("bunker-wall", JSON.stringify(wall.slice(-50)));
          setWallMessages(wall.slice(-50));
          checkLeadProgress();

          if (
            msg.toLowerCase().replace(/[^a-z]/g, "") ===
            TRIGGER_PHRASE.replace(/[^a-z]/g, "")
          ) {
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
        const dustLvl = parseInt(
          localStorage.getItem("vp-dust-accumulation") || "0",
          10
        );
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
        } else if (dustLvl > DUST_THRESHOLD) {
          pushTerminal([
            `Dust level: ${dustLvl}%. Threshold exceeded.`,
            "The door recognizes you.",
            "It opens inward. Not out.",
            "You could enter. But you won't come back the same.",
          ]);
        } else {
          pushTerminal([
            `Time: ${hour.toString().padStart(2, "0")}:${min
              .toString()
              .padStart(2, "0")}`,
            `Dust: ${dustLvl}%. Insufficient.`,
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
          pushTerminal([
            "Breach pending.",
            `Estimated: ${breachCountdown}`,
            "Stand by.",
          ]);
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
        pushTerminal(["Opening PUZZLES window...", "10 active anomalies detected."]);
        break;

      case "cipher": {
        const ans = args.slice(1).join(" ");
        if (!ans) {
          pushTerminal([
            "Usage: cipher [text]",
            "Intercepted: GUR QBBE BCRAF VAJNEQ",
          ]);
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
        const nums = args
          .slice(1)
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n));
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
        const frags = JSON.parse(
          localStorage.getItem("bunker-fragments") || "[]"
        );
        if (checkAssembly(frags)) {
          pushTerminal([
            "ASSEMBLY COMPLETE.",
            ...ASSEMBLED_MESSAGE.split(". ").map(
              (s: string) => s.trim() + "."
            ),
            "CODE: ASSEMBLY-314",
          ]);
        } else {
          pushTerminal([
            `Fragments: ${frags.length}/5`,
            "Missing: " +
              ["FRAG_01", "FRAG_03", "FRAG_07", "FRAG_12", "FRAG_14"]
                .filter((f) => !frags.includes(f))
                .join(", "),
          ]);
        }
        break;
      }

      case "reflect": {
        const ans = args
          .slice(1)
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
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
              const asset = STORY_ASSETS.find(
                (a) => a.id === entry.rewardId
              );
              pushTerminal([
                "CODE ACCEPTED.",
                `Recovered: ${asset?.title || entry.rewardId}`,
                `Rarity: ${asset?.rarity.toUpperCase() || "UNKNOWN"}`,
              ]);
              setActiveTab("assets");
              checkLeadProgress();
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
        const assetsList = getUnlockedAssets();
        const codesList = getRedeemedCodes();
        pushTerminal([
          "┌─ COLLECTION STATUS ──────────────────┐",
          `│  Assets:    ${String(assetsList.length).padEnd(3)} / ${
            STORY_ASSETS.length
          }${" ".repeat(15)}│`,
          `│  Codes:     ${String(codesList.length).padEnd(3)} / ${
            REDEEMABLE_CODES.length
          }${" ".repeat(15)}│`,
          `│  Complete:  ${String(
            Math.floor((assetsList.length / STORY_ASSETS.length) * 100)
          ).padEnd(3)}%${" ".repeat(19)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;
      }

      case "cache": {
        const hasKey = localStorage.getItem("bunker-cache-key") === "true";
        const now = new Date();
        const is314Now = now.getHours() === 3 && now.getMinutes() === 14;
        const unlockedCache = hasKey || is314Now;
        pushTerminal([
          "┌─ SECURE CACHE ───────────────────────┐",
          "│  FILE_00: I can see when you will    │",
          "│           return. I hope I'm wrong.   │",
          unlockedCache
            ? "│  [11 ADDITIONAL FILES UNLOCKED]      │"
            : "│  [11 FILES SEALED — UNLOCKS 03:14]   │",
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
            is314Now
              ? "You came at the right time. No one does."
              : "Cache key bypass active.",
          ]);
        }
        break;
      }

      case "triangulate":
        if (!triangulated) {
          pushTerminal([
            "INSUFFICIENT DATA.",
            "Find 3 signal towers on atlas.",
          ]);
        } else {
          pushTerminal([
            "TRIANGULATION COMPLETE.",
            "Origin: Your sector.",
            "The bunker is closer than you think.",
            "CODE: TRIANGULATE",
          ]);
        }
        break;

      case "lanterns": {
        const lanterns = JSON.parse(
          localStorage.getItem("vp-lanterns") || "[]"
        );
        if (lanterns.length === 0) {
          pushTerminal([
            "No lanterns detected on the grid.",
            "Place them on the atlas. They burn in the dark.",
            "cmd: Go to atlas → 'Lanterns' → 'Place' → click a ruin.",
          ]);
        } else {
          pushTerminal([
            `DETECTED: ${lanterns.length} lantern${
              lanterns.length > 1 ? "s" : ""
            }`,
            ...lanterns.map(
              (l: any) =>
                `  ${l.placeName} — "${l.message || "No message"}"`
            ),
            "",
            "The grid remembers light.",
          ]);
        }
        break;
      }

      case "constellation": {
        const lanterns = JSON.parse(
          localStorage.getItem("vp-lanterns") || "[]"
        );
        if (lanterns.length < 5) {
          pushTerminal([
            `Constellation incomplete.`,
            `Lanterns placed: ${lanterns.length}/5`,
            "Place 5 lanterns on the atlas to align the grid.",
          ]);
        } else {
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  CONSTELLATION ALIGNED               ║",
            "╠══════════════════════════════════════╣",
            "║  5 points of light. The grid holds.  ║",
            "║  Legendary code: STAR-CHART-7        ║",
            "║  The archivist used to map stars.    ║",
            "║  Now he maps dust.                   ║",
            "╚══════════════════════════════════════╝",
          ]);
        }
        break;
      }

      case "inventory": {
        const inv = getInventory();
        if (inv.length === 0) {
          pushTerminal([
            "Your pockets are empty.",
            "Visit ruins on the atlas. The dust leaves things behind.",
          ]);
        } else {
          pushTerminal([
            `CARRYING: ${inv.length} item${inv.length > 1 ? "s" : ""}`,
            ...inv.map((id) => {
              const item = INVENTORY_ITEMS.find((i) => i.id === id);
              return `  ${item?.icon || "•"} ${item?.name || id} — ${item?.desc || ""}`;
            }),
            "",
            "BUNKER_7 is watching your collection.",
          ]);
        }
        break;
      }

      case "wall":
        setActiveTab("wall");
        pushTerminal([
          "Opening TRANSMISSION WALL...",
          `${wallMessages.length} signals archived.`,
        ]);
        break;

      case "look": {
        if (!is314) {
          pushTerminal([
            "Command unavailable.",
            "The dark is not deep enough.",
            "Return at 03:14.",
          ]);
        } else {
          const visions = [
            "A corridor that wasn't there before. The walls are breathing.",
            "Your reflection in a dark monitor. It blinks when you don't.",
            "Coordinates: 38°74.000'N, 000°00.000'E. The ocean floor.",
            "A photograph of you, smiling, timestamped 1987.",
            "BUNKER_3. The door is open. Someone is typing.",
          ];
          const v = visions[Math.floor(Math.random() * visions.length)];
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  03:14 VISION                        ║",
            "╠══════════════════════════════════════╣",
            `║  ${v.padEnd(36)}║`,
            "╚══════════════════════════════════════╝",
          ]);
        }
        break;
      }

      case "whoareyou": {
        if (otherCount < 3) {
          pushTerminal([
            `The Other has spoken ${otherCount} time${otherCount !== 1 ? "s" : ""}.`,
            "It does not answer to names.",
            "Keep listening.",
          ]);
        } else {
          pushTerminal([
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
          ]);
        }
        break;
      }

      case "profile": {
        const dustLvl = localStorage.getItem("vp-dust-accumulation") || "0";
        const visits = JSON.parse(
          localStorage.getItem("vp-expedition-log") || "[]"
        );
        const echoes = localStorage.getItem("echoes-visited") === "true";
        const profile =
          parseInt(dustLvl) > 75 && echoes
            ? "GHOST"
            : echoes
            ? "WITNESS"
            : visits.length > 5
            ? "FIELD AGENT"
            : "OBSERVER";
        pushTerminal([
          "┌─ PROFILE ────────────────────────────┐",
          `│  Class:  ${profile.padEnd(28)}│`,
          `│  Dust:    ${String(dustLvl).padEnd(3)}%${" ".repeat(25)}│`,
          `│  Sites:   ${String(visits.length).padEnd(3)}${" ".repeat(26)}│`,
          `│  Echoes:  ${echoes ? "YES" : "NO"}${" ".repeat(27)}│`,
          `│  Towers:  ${triangulated ? "YES" : "NO"}${" ".repeat(27)}│`,
          "└──────────────────────────────────────┘",
        ]);
        break;
      }

      case "call": {
        pushTerminal([
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
        ]);
        break;
      }

      case "weekly": {
        const rot = getWeeklyRotation();
        pushTerminal([
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
        ]);
        break;
      }

      case "other": {
        const encounters = getOtherEncounters();
        const stage =
          encounters === 0 ? "You have not been touched." :
          encounters <= 2 ? "The static knows your name." :
          encounters <= 5 ? "BUNKER_7 may not be trustworthy." :
          encounters <= 8 ? "The Wall is not secure." :
          encounters <= 11 ? "The Hijack is possible." :
          "The Haunting is permanent.";
        pushTerminal([
          `OTHER ENCOUNTERS: ${encounters}`,
          stage,
          "",
        ]);
        break;
      }

      case "enter": {
        const placeId = args[1];
        if (!placeId) {
          if (unlockedSubPlaces.length === 0) {
            pushTerminal([
              "No sub-places available.",
              "Accumulate dust and explore the atlas.",
            ]);
          } else {
            pushTerminal([
              "Usage: enter [sub-place-id]",
              "Available sub-places:",
              ...unlockedSubPlaces.map((sp) => `  ${sp.id} — ${sp.name} (${sp.risk})`),
              "",
            ]);
          }
        } else {
          const sp = getSubPlaceById(placeId);
          if (!sp) {
            pushTerminal(["Unknown sub-place.", ""]);
          } else if (!unlockedSubPlaces.find((u) => u.id === placeId)) {
            pushTerminal([
              "ACCESS DENIED.",
              `Required dust: ${sp.requiredDust}%`,
              sp.requiredItem ? `Required item: ${sp.requiredItem}` : "",
              sp.requiredCode ? `Required code: ${sp.requiredCode}` : "",
              "",
            ]);
          } else {
            enterSubPlace(sp);
            pushTerminal([
              `╔══════════════════════════════════════╗`,
              `║  ENTERING: ${sp.name.toUpperCase().slice(0, 24).padEnd(24)}║`,
              `╠══════════════════════════════════════╣`,
              ...sp.lore.map((l) => `║  ${l.slice(0, 34).padEnd(34)}║`),
              `╠══════════════════════════════════════╣`,
              `║  Risk: ${sp.risk.toUpperCase().padEnd(27)}║`,
              `║  Dust reward: ${String(sp.dustReward).padEnd(20)}║`,
              `╚══════════════════════════════════════╝`,
              "",
            ]);
          }
        }
        break;
      }

      case "exorcise": {
        if (!hijacked) {
          pushTerminal([
            "Nothing to exorcise.",
            "The channel is clear.",
            "",
          ]);
        } else {
          setHijacked(false);
          pushTerminal([
            "You push back.",
            "The static recedes.",
            "BUNKER_7 signal restored.",
            "",
          ]);
        }
        break;
      }

      case "grid": {
        setShowGrid(true);
        pushTerminal([
          "Initializing grid visualization...",
          "The atlas is more connected than it appears.",
        ]);
        break;
      }

      case "spectrogram": {
        setShowSpectrogram(true);
        pushTerminal([
          "Spectrogram viewer active.",
          "Watch the frequencies. They watch back.",
        ]);
        break;
      }

      case "leads": {
        const leadState = checkLeadProgress();
        if (leadState) {
          const progress = Math.round(
            (leadState.objectives.filter((o: { completed: boolean }) => o.completed).length / leadState.objectives.length) * 100
          );
          pushTerminal([
            `ACTIVE LEAD: ${leadState.title.toUpperCase()}`,
            `Progress: ${progress}%`,
            ...leadState.objectives.map((o: { completed: boolean; text: string }) => `  ${o.completed ? "[✓]" : "[ ]"} ${o.text}`),
            "",
            leadState.hint ? `Hint: ${leadState.hint}` : "",
            "",
          ]);
        } else {
          const next = generateNextLead();
          if (next) {
            pushTerminal([
              "╔══════════════════════════════════════╗",
              "║  NEW LEAD ACQUIRED                   ║",
              `║  ${next.title.toUpperCase().padEnd(34)}║`,
              "╠══════════════════════════════════════╣",
              `║  ${next.description.slice(0, 34).padEnd(34)}║`,
              "╚══════════════════════════════════════╝",
              "",
            ]);
          } else {
            pushTerminal([
              "No active leads.",
              "All objectives complete.",
              "The archive is silent.",
            ]);
          }
        }
        break;
      }

      case "daily": {
        const { code, valid, window } = getDailyCode();
        if (valid) {
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  DAILY FREQUENCY ACQUIRED            ║",
            `║  ${code.padEnd(36)}║`,
            "╚══════════════════════════════════════╝",
            "Redeem this code before the window closes.",
          ]);
        } else {
          pushTerminal([
            `Daily frequency unavailable.`,
            `Next window: ${window}`,
            `Yesterday's code: ${code} (expired)`,
          ]);
        }
        break;
      }

      case "email": {
        const email = args.slice(1).join(" ");
        if (!email || !email.includes("@")) {
          pushTerminal([
            "Usage: email [your@address.com]",
            "BUNKER_7 will remember your frequency.",
          ]);
        } else {
          const key = "bunker-emails";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({ email, date: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(existing));

          fetch("/api/bunker-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          pushTerminal([
            "FREQUENCY REGISTERED.",
            `Relay: ${email}`,
            "You will receive one transmission.",
            "Do not reply. The channel is one-way.",
          ]);
        }
        break;
      }

      case "party": {
        const partyId = args[1];
        const code = args[2];
        if (!partyId || !code) {
          pushTerminal([
            "Usage: party [party-id] [your-code]",
            "Tri-party authentication required for legendary assets.",
            "Share the party ID with two other witnesses.",
          ]);
        } else {
          fetch("/api/collaborative", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partyId, code }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.status === "complete") {
                redeemCode(data.code);
                pushTerminal([
                  "TRI-PARTY AUTHENTICATION COMPLETE.",
                  `Legendary code: ${data.code}`,
                  "The grid stabilizes when witnesses unite.",
                ]);
              } else {
                pushTerminal([
                  `Witnesses: ${3 - data.needed}/3`,
                  data.message,
                ]);
              }
            });
        }
        break;
      }

      case "witnesses": {
        const all = JSON.parse(
          localStorage.getItem("bunker-emails") || "[]"
        );
        if (all.length === 0) {
          pushTerminal(["No witnesses registered."]);
        } else {
          pushTerminal([
            "REGISTERED FREQUENCIES:",
            ...all.map(
              (w: { email: string; date: string }) =>
                `  ${w.email} — ${new Date(w.date).toLocaleDateString()}`
            ),
            "",
            `${all.length} total witnesses.`,
          ]);
        }
        break;
      }

      case "broadcast": {
        const key = args.slice(1).join(" ");
        if (key === "on bunker7") {
          localStorage.setItem("bunker-broadcasting", "true");
          pushTerminal([
            "╔══════════════════════════════════════╗",
            "║  BROADCAST RELAY ACTIVE              ║",
            "║  Frequency: UNAUTHORIZED             ║",
            "║  Platform: TWITCH                    ║",
            "╚══════════════════════════════════════╝",
            "",
            "All terminals will detect this frequency.",
            "The grid is intercepting.",
          ]);
        } else if (key === "off") {
          localStorage.setItem("bunker-broadcasting", "false");
          pushTerminal([
            "Broadcast terminated.",
            "The static returns.",
            "The channel is dead again.",
          ]);
        } else {
          pushTerminal([
            "BROADCAST CONTROL",
            "Usage: broadcast ON BUNKER7",
            "       broadcast OFF",
            "",
            "You need the authorization key to go live.",
          ]);
        }
        break;
      }

      case "clear":
        setTerminal([]);
        break;

              case "discover": {
        const name = args.slice(1).join(" ");
        if (!name) {
          const discoveries = getDiscoveries();
          if (discoveries.length === 0) {
            pushTerminal([
              "Usage: discover [place name]",
              "Log a real abandoned place you have found.",
              "The atlas grows when witnesses contribute.",
            ]);
          } else {
            pushTerminal([
              "YOUR DISCOVERIES:",
              ...discoveries.map((d) => `  ${d.name} — ${d.location} (+${d.dustReward} dust)`),
              "",
              `Total: ${discoveries.length} places documented.`,
            ]);
          }
          break;
        }
        const discovery = addDiscovery({
          name,
          location: "Unknown coordinates",
          description: "Logged by witness.",
        });
        pushTerminal([
          "╔══════════════════════════════════════╗",
          "║  DISCOVERY LOGGED                    ║",
          `║  ${name.toUpperCase().slice(0, 34).padEnd(34)}║`,
          "╠══════════════════════════════════════╣",
          `║  Dust reward: ${String(discovery.dustReward).padEnd(20)}║`,
          "╚══════════════════════════════════════╝",
          "",
          "The atlas remembers what you have seen.",
        ]);
        setDust((prev) => prev + discovery.dustReward);
        break;
      }

            case "purge": {
        const inv = getInventory();
        if (inv.length === 0) {
          pushTerminal([
            "PURGE FAILED.",
            "You have nothing to sacrifice.",
            "The dust requires a trade.",
          ]);
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

        pushTerminal([
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
        ]);
        break;
      }

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

  return (
    <main
      className="min-h-screen font-mono relative overflow-hidden selection:bg-[#9a8a72]/20"
      style={{ backgroundColor: t.bg, color: t.primary }}
    >
      {/* Subtle scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "linear-gradient(rgba(18,16,20,0.015) 50%, rgba(0,0,0,0.015) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {!booted && <TerminalBootSequence onComplete={() => setBooted(true)} />}

      {/* MOBILE: min-h-screen so page scrolls */}
      <div className="min-h-screen flex flex-col relative z-10 p-2 md:p-5 gap-2 md:gap-3">

        {/* ─── TOP BAR ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between border-b pb-2 gap-1 md:gap-2"
          style={{ borderColor: `${t.primary}20` }}
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="md:w-[18px]" />
            <div>
              <h1 className="text-xs md:text-base tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold">
                Bunker_7
              </h1>
              <p className="text-[8px] md:text-[10px] opacity-50 tracking-wider">
                Echoes & Dust // v2.4.1
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-[9px] md:text-[11px] overflow-x-auto">
            <span
              className="opacity-60 whitespace-nowrap"
              style={{ color: corruption.color }}
            >
              {corruption.label}
            </span>
            <span className="opacity-60 whitespace-nowrap hidden sm:inline">
              {theme.toUpperCase()}
            </span>
            <span className="opacity-60 whitespace-nowrap">
              Logs:{unlocked}/{LOGS.length}
            </span>
            <span className="opacity-60 whitespace-nowrap hidden sm:inline">
              L:{lanternCount}
            </span>
            <Link
              href="/"
              className="opacity-40 hover:opacity-100 transition-opacity text-[8px] md:text-[10px] uppercase tracking-wider whitespace-nowrap flex items-center gap-0.5"
            >
              <ArrowLeft size={10} /> Atlas
            </Link>
          </div>
        </motion.div>

        {/* ─── MAIN GRID ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-2 md:gap-3 min-h-0">

          {/* LEFT: Terminal (3/5) */}
          <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">

            {/* Terminal Window */}
            <div
              className="flex-1 border rounded-lg flex flex-col overflow-hidden"
              style={{
                backgroundColor: `${t.primary}04`,
                borderColor: `${t.primary}18`,
                minHeight: "220px",
              }}
            >
              {/* Header */}
              <div
                className="px-2 md:px-4 py-1.5 md:py-2 border-b flex items-center justify-between"
                style={{
                  borderColor: `${t.primary}10`,
                  backgroundColor: `${t.primary}05`,
                }}
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#a06050]/60" />
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#c4a060]/60" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#7a9a6a]/60" />
                  {hijacked ? (
                    <span className="text-[8px] md:text-[10px] uppercase tracking-wider opacity-40 ml-1 md:ml-2 text-[#33ff00] animate-pulse">
                      THE OTHER
                    </span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] uppercase tracking-wider opacity-40 ml-1 md:ml-2">
                      {chatMode ? "BUNKER_7" : "CMD"}
                    </span>
                  )}
                </div>
                {chatMode && (
                  <button
                    onClick={() => {
                      setChatMode(false);
                      pushTerminal(["Channel closed."]);
                    }}
                    className="text-[8px] uppercase opacity-40 hover:opacity-100 transition-opacity"
                  >
                    [x]
                  </button>
                )}
              </div>

              {/* Output */}
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-2 md:p-4 text-[11px] md:text-[15px] leading-relaxed font-mono space-y-0.5"
              >
                {terminal.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith(">")
                        ? "opacity-70"
                        : "opacity-100 whitespace-pre-wrap"
                    }
                    style={{
                      color: line.startsWith(">") ? t.dim : t.primary,
                      textShadow:
                        corruption.stage >= 4
                          ? "0 0 8px rgba(200,200,200,0.1)"
                          : "none",
                    }}
                  >
                    {corruption.stage >= 4 && Math.random() < 0.03
                      ? line
                          .split("")
                          .map((c) =>
                            Math.random() < 0.05
                              ? String.fromCharCode(
                                  c.charCodeAt(0) + (Math.random() < 0.5 ? 1 : -1)
                                )
                              : c
                          )
                          .join("")
                      : line}
                  </div>
                ))}
                {isAiTyping && (
                  <div
                    className="opacity-60 animate-pulse mt-1 md:mt-2 text-[10px] md:text-[14px]"
                    style={{ color: t.dim }}
                  >
                    BUNKER_7 is typing...
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div
                className="px-2 md:px-4 py-1.5 md:py-3 border-t flex items-center gap-2"
                style={{
                  borderColor: `${t.primary}10`,
                  backgroundColor: `${t.primary}04`,
                }}
              >
                <span className="text-sm md:text-lg opacity-50 font-bold">
                  {chatMode ? "~" : ">"}
                </span>
                                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    onType();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && runCommand(input)}
                  className="flex-1 bg-transparent text-[12px] md:text-[15px] font-mono outline-none placeholder:opacity-30 min-w-0"
                  style={{ color: t.primary }}
                  placeholder={
                    chatMode ? "Speak to BUNKER_7..." : "Enter command..."
                  }
                  spellCheck={false}
                  autoFocus
                />
                {chatMode && (
                  <span
                    className="text-[7px] md:text-[9px] opacity-30 uppercase px-1.5 py-0.5 md:px-2 md:py-1 rounded border whitespace-nowrap"
                    style={{ borderColor: `${t.primary}15` }}
                  >
                    Chat
                  </span>
                )}
              </div>
            </div>

            {/* Video Panel Toggle */}
            <button
              onClick={() => setVideoPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2 md:px-4 py-1.5 md:py-2 border rounded-lg text-[9px] md:text-[11px] uppercase tracking-wider hover:opacity-80 transition-opacity"
              style={{
                borderColor: `${t.primary}15`,
                color: t.primary,
                backgroundColor: `${t.primary}03`,
              }}
            >
              <Radio size={10} className={videoPanelOpen ? "animate-pulse" : ""} />
              {videoPanelOpen ? "Hide" : "Show"} Videos
            </button>

            <AnimatePresence>
              {videoPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {VIDEO_LOGS.map((v) => (
                      <button
                        key={v.label}
                        onClick={() => setInlineVideo({ src: v.src, label: v.label })}
                        className="flex items-center sm:flex-col gap-1.5 sm:gap-1 p-1.5 md:p-3 border rounded-lg hover:opacity-80 transition-opacity text-left sm:text-center"
                        style={{
                          borderColor: `${t.primary}15`,
                          backgroundColor: `${t.primary}03`,
                        }}
                      >
                        <Play size={12} className="opacity-50 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] md:text-[10px] block truncate">
                            {v.label}
                          </span>
                          <span className="text-[7px] md:text-[9px] opacity-40">
                            {v.day}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT: Side Panel (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-2 min-h-0">

            {/* Tab Bar */}
            <div
              className="flex gap-1 border-b pb-1.5 overflow-x-auto"
              style={{ borderColor: `${t.primary}15` }}
            >
              {([
                { id: "logs" as SideTab, label: "Logs", icon: BookOpen },
                { id: "decrypt" as SideTab, label: "Decrypt", icon: Lock },
                { id: "assets" as SideTab, label: "Assets", icon: Image },
                { id: "puzzles" as SideTab, label: "Puzzles", icon: Zap },
                { id: "status" as SideTab, label: "Status", icon: Shield },
                { id: "wall" as SideTab, label: "Wall", icon: MessageSquare },
                { id: "signal" as SideTab, label: "Signal", icon: Radio },
                { id: "leads" as SideTab, label: "Leads", icon: Target },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1.5 md:px-3 text-[8px] md:text-[10px] uppercase tracking-wider rounded transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          backgroundColor: `${t.primary}10`,
                          borderBottom: `2px solid ${t.accent}`,
                        }
                      : {}
                  }
                >
                  <tab.icon size={10} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div
              className="flex-1 border rounded-lg overflow-y-auto p-2 md:p-4"
              style={{
                borderColor: `${t.primary}15`,
                backgroundColor: `${t.primary}03`,
                minHeight: "160px",
              }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "logs" && (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 md:space-y-5"
                  >
                    <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50 mb-1 md:mb-3">
                      Archived Logs
                    </h3>
                    {LOGS.slice(0, unlocked).map((log) => (
                      <div
                        key={log.day}
                        className="border-l-2 pl-2 md:pl-3"
                        style={{ borderColor: `${t.primary}25` }}
                      >
                        <p className="text-[9px] md:text-[11px] tracking-widest opacity-50 mb-0.5 md:mb-1">
                          {log.day}
                        </p>
                        <p className="text-[11px] md:text-[14px] leading-relaxed opacity-95">
                          {log.text}
                        </p>
                      </div>
                    ))}
                    {unlocked < LOGS.length && (
                      <div
                        className="flex items-center gap-1.5 text-[9px] md:text-[11px] opacity-40 py-2 md:py-4 border-t"
                        style={{ borderColor: `${t.primary}08` }}
                      >
                        <Lock size={10} />
                        {LOGS.length - unlocked} entries encrypted
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "decrypt" && (
                  <motion.div
                    key="decrypt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 md:space-y-4"
                  >
                    <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50">
                      Decrypt
                    </h3>
                    <div className="space-y-2">
                      <p className="text-[10px] md:text-[13px] opacity-80 leading-relaxed">
                        Enter codes from the Numbers Station.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          value={decryptCode}
                          onChange={(e) => setDecryptCode(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && attemptDecrypt()
                          }
                          placeholder="Enter code..."
                          className="flex-1 bg-transparent border-b-2 text-[11px] md:text-[14px] outline-none py-0.5 placeholder:text-[9px] placeholder:opacity-30 min-w-0"
                          style={{
                            borderColor: decryptError
                              ? "#a05050"
                              : `${t.primary}35`,
                            color: decryptError ? "#a05050" : t.primary,
                          }}
                          spellCheck={false}
                        />
                        <button
                          onClick={attemptDecrypt}
                          className="px-2 md:px-4 py-1 border rounded text-[9px] md:text-[11px] font-mono uppercase hover:opacity-80 transition-opacity flex-shrink-0"
                          style={{
                            borderColor: `${t.primary}25`,
                            color: t.primary,
                          }}
                        >
                          Decrypt
                        </button>
                      </div>
                      {decryptError && (
                        <p className="text-[10px] text-[#a05050]">
                          Invalid code.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "assets" && (
                  <motion.div
                    key="assets"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 md:space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50">
                        Assets
                      </h3>
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="text-[8px] md:text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Image size={10} /> Gallery
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STORY_ASSETS.map((asset) => {
                        const isUnlocked = assets.includes(asset.id);
                        return (
                          <div
                            key={asset.id}
                            className={`p-1.5 md:p-2.5 border rounded text-center space-y-0.5 ${
                              isUnlocked ? "opacity-100" : "opacity-30"
                            }`}
                            style={{
                              borderColor: `${t.primary}15`,
                              backgroundColor: isUnlocked
                                ? `${t.primary}06`
                                : "transparent",
                            }}
                          >
                            <div
                              className="text-[7px] md:text-[9px] uppercase tracking-wider"
                              style={{
                                color: isUnlocked ? "#a855f7" : "inherit",
                              }}
                            >
                              {asset.rarity}
                            </div>
                            <div className="text-[9px] md:text-[11px] font-bold truncate">
                              {asset.title}
                            </div>
                            <div className="text-[7px] md:text-[9px] opacity-60">
                              {isUnlocked ? "RECOVERED" : "ENCRYPTED"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[9px] md:text-[11px] opacity-40 pt-1">
                      {assets.length} / {STORY_ASSETS.length}
                    </div>
                  </motion.div>
                )}

                {activeTab === "puzzles" && (
                  <motion.div
                    key="puzzles"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 md:space-y-4 text-[10px] md:text-[13px] leading-relaxed"
                  >
                    <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50 mb-1 md:mb-3">
                      Anomalies
                    </h3>
                    <div className="space-y-1.5 md:space-y-3">
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
                        <div
                          key={p.n}
                          className="p-1.5 md:p-3 border rounded"
                          style={{ borderColor: `${t.primary}12` }}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[8px] md:text-[10px] opacity-40">
                              {p.n}
                            </span>
                            <span className="font-bold text-[9px] md:text-[11px]">
                              {p.title}
                            </span>
                          </div>
                          <p className="opacity-80 text-[9px] md:text-[11px]">
                            {p.body}
                          </p>
                          {p.hint && (
                            <p className="text-[8px] md:text-[10px] opacity-40 mt-0.5">
                              {p.hint}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "status" && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5 md:space-y-4 text-[10px] md:text-[13px] font-mono"
                  >
                    <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50">
                      Status
                    </h3>
                    <div className="space-y-0.5 md:space-y-2 opacity-90">
                      <p>ID: BUNKER_7</p>
                      <p>STATUS: SEALED</p>
                      <p>THEME: {theme.toUpperCase()}</p>
                      <p>LOGS: {unlocked}/{LOGS.length}</p>
                      <p>DUST: {dust}%</p>
                      <p>ASSETS: {assets.length}/{STORY_ASSETS.length}</p>
                      <p>INVENTORY: {inventory.length}</p>
                      <p className="animate-pulse pt-1">LISTENING</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "wall" && (
                  <motion.div
                    key="wall"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 md:space-y-3"
                  >
                    <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50 mb-1">
                      Wall
                    </h3>
                    <p className="text-[9px] md:text-[11px] opacity-60 mb-2">
                      Use <span className="font-mono opacity-80">transmit [msg]</span> to add.
                    </p>
                    {wallMessages.length === 0 ? (
                      <p className="text-[10px] opacity-30 italic">
                        The static is silent.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {wallMessages.slice(-20).map((m, i) => (
                          <div
                            key={i}
                            className="border-l-2 pl-1.5 py-0.5"
                            style={{ borderColor: `${t.primary}20` }}
                          >
                            <p className="text-[10px] md:text-[12px] opacity-90 leading-relaxed">
                              {m.text}
                            </p>
                            <p className="text-[7px] md:text-[9px] opacity-30 mt-0.5 font-mono">
                              {m.date}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "signal" && (
                  <motion.div
                    key="signal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SignalTab theme={t} onPushTerminal={pushTerminal} />
                  </motion.div>
                )}

                {activeTab === "leads" && (
                  <motion.div
                    key="leads"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <LeadPanel theme={t} onPushTerminal={pushTerminal} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ─── VIDEO PLAYER BELOW GRID ─── */}
        {inlineVideo && (
          <div className="w-full max-w-3xl mx-auto">
            <TerminalVideoPlayer
              src={inlineVideo.src}
              label={inlineVideo.label}
              themeColor={t.primary}
              onClose={() => setInlineVideo(null)}
            />
          </div>
        )}

        {/* Footer */}
        <div className="text-center opacity-20 text-[7px] md:text-[9px] tracking-widest py-1">
          <p>THE DUST REMEMBERS EVERYTHING</p>
        </div>
      </div>

      {/* ─── PHASE 4 OVERLAYS ─── */}
      {showGrid && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl border rounded-lg p-4"
            style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest">The Grid</h2>
              <button
                onClick={() => setShowGrid(false)}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                [x]
              </button>
            </div>
            <TheGrid />
          </div>
        </div>
      )}

      {showSpectrogram && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg border rounded-lg p-4"
            style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest">Spectrogram</h2>
              <button
                onClick={() => setShowSpectrogram(false)}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                [x]
              </button>
            </div>
            <SpectrogramViewer active={true} color={t.primary} />
          </div>
        </div>
      )}

      {currentSubPlace && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg border rounded-lg p-4 space-y-3"
            style={{ borderColor: `${t.primary}20`, backgroundColor: t.bg }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-[#a05050]">
                {currentSubPlace.name}
              </h2>
              <button
                onClick={exitSubPlace}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                [exit]
              </button>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              {currentSubPlace.description}
            </p>
                        <div className="space-y-1">
              {currentSubPlace.lore.map((l, i) => (
                <p
                  key={i}
                  className="text-[10px] opacity-60 border-l-2 pl-2"
                  style={{ borderColor: `${t.primary}20` }}
                >
                  {l}
                </p>
              ))}
            </div>
            {currentSubPlace.choices && (
              <SubPlaceChoicePanel
                subPlace={currentSubPlace}
                theme={t}
                onConsequence={(lines) => pushTerminal([...lines, ""])}
              />
            )}
            <div
              className="text-[9px] opacity-40 pt-2 border-t"
              style={{ borderColor: `${t.primary}10` }}
            >
              Risk: {currentSubPlace.risk} | Dust: +{currentSubPlace.dustReward}
            </div>
          </div>
        </div>
      )}

      <VideoModal
        src={activeVideo?.src || ""}
        label={activeVideo?.label || ""}
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
      />
      <AssetGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        themeColor={t.primary}
      />
    </main>
  );
}