"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTerminal, FiSidebar } from "react-icons/fi";
import { TerminalLine, TerminalCursor, type TerminalLineData } from "@/components/terminal/TerminalLine";
import { TerminalSidebar } from "@/components/terminal/TerminalSidebar";
import { TerminalHUD } from "@/components/terminal/TerminalHUD";
import { soundEngine } from "@/lib/soundEngine";
import { gameState, useGameState, type ThemeKey } from "@/logic/gameState";

/* ── PROMPT COLOR LOOKUP ── */
const PROMPT_COLOR: Record<string, string> = {
  tungsten: "text-[#c4785a]",
  phosphor: "text-[#4a9a6a]",
  amber: "text-[#c4a040]",
  ember: "text-[#8b3a2a]",
  blue: "text-[#5a7a9a]",
  green: "text-[#4a7a5a]",
  red: "text-[#9a4a4a]",
  white: "text-[#c4c4c4]",
  bone: "text-[#ddd0bc]",
  ash: "text-[#5a4e42]",
  void: "text-[#3a3028]",
  archive: "text-[#7a6b52]",
};

/* ── COMMAND REGISTRY ── */
interface CommandDef {
  name: string;
  aliases?: string[];
  description: string;
  hidden?: boolean;
  admin?: boolean;
  handler: (args: string[]) => TerminalLineData[];
}

const COMMANDS: CommandDef[] = [
  {
    name: "help",
    description: "Display available commands",
    handler: () => [
      { id: crypto.randomUUID(), text: "AVAILABLE COMMANDS", intent: "system" },
      { id: crypto.randomUUID(), text: "─".repeat(40), intent: "system" },
      ...COMMANDS.filter(c => !c.hidden).map(c => ({
        id: crypto.randomUUID(),
        text: `  ${c.name.padEnd(14)} — ${c.description}`,
        intent: "default" as const,
      })),
    ],
  },
  {
    name: "clear",
    description: "Clear terminal output",
    handler: () => [],
  },
  {
    name: "status",
    description: "System status report",
    handler: () => {
      const s = gameState.getState();
      return [
        { id: crypto.randomUUID(), text: "BUNKER_7 SYSTEM STATUS", intent: "system" },
        { id: crypto.randomUUID(), text: `  Dust Level:      ${s.dust}%`, intent: "default" },
        { id: crypto.randomUUID(), text: `  Corruption:      Stage ${s.corruptionStage}`, intent: s.corruptionStage > 2 ? "corruption" : "default" },
        { id: crypto.randomUUID(), text: `  Places Visited:  ${s.visitedPlaces.length}`, intent: "default" },
        { id: crypto.randomUUID(), text: `  Inventory:       ${s.inventory.length} items`, intent: "default" },
        { id: crypto.randomUUID(), text: `  Session Time:    ${Math.floor((Date.now() - s.sessionStart) / 60000)}m`, intent: "default" },
      ];
    },
  },
  {
    name: "scan",
    description: "Scan for anomalous signals",
    handler: () => {
      soundEngine.playStatic(600);
      const places = Object.values(gameState.getState().places);
      if (places.length === 0) {
        return [{ id: crypto.randomUUID(), text: "No signals detected in range.", intent: "system" }];
      }
      const place = places[Math.floor(Math.random() * places.length)];
      return [
        { id: crypto.randomUUID(), text: `SCANNING...`, intent: "system", glitch: true },
        { id: crypto.randomUUID(), text: ``, intent: "default" },
        { id: crypto.randomUUID(), text: `SIGNAL ACQUIRED`, intent: "discovery" },
        { id: crypto.randomUUID(), text: `  Name:     ${place.name}`, intent: "default" },
        { id: crypto.randomUUID(), text: `  Location: ${place.address.formatted}`, intent: "default" },
        { id: crypto.randomUUID(), text: `  Status:   ${place.status}`, intent: place.status === "sealed" ? "ghost" : "default" },
        { id: crypto.randomUUID(), text: `  Danger:   ${"█".repeat(place.dangerLevel)}${"░".repeat(5 - place.dangerLevel)}`, intent: place.dangerLevel > 3 ? "error" : "default" },
      ];
    },
  },
  {
    name: "echo",
    description: "Broadcast a message into the void",
    handler: (args) => {
      const msg = args.join(" ");
      if (!msg) return [{ id: crypto.randomUUID(), text: "Usage: echo <message>", intent: "error" }];
      soundEngine.playCreak();
      return [
        { id: crypto.randomUUID(), text: `TRANSMITTING: "${msg}"`, intent: "command" },
        { id: crypto.randomUUID(), text: `...`, intent: "system" },
        { id: crypto.randomUUID(), text: `Signal lost. No response.`, intent: "ghost" },
      ];
    },
  },
  {
    name: "inventory",
    description: "View collected items",
    handler: () => {
      const items = gameState.getState().inventory;
      if (items.length === 0) {
        return [{ id: crypto.randomUUID(), text: "Inventory empty.", intent: "system" }];
      }
      return [
        { id: crypto.randomUUID(), text: "COLLECTED ARTIFACTS", intent: "system" },
        { id: crypto.randomUUID(), text: "─".repeat(40), intent: "system" },
        ...items.map((item, i) => ({
          id: crypto.randomUUID(),
          text: `  [${String(i + 1).padStart(2, "0")}] ${item}`,
          intent: "default" as const,
        })),
      ];
    },
  },
  {
    name: "theme",
    description: "Cycle interface theme",
    handler: () => {
      const themes: ThemeKey[] = ["tungsten", "phosphor", "amber", "ember", "blue", "green", "red", "white"];
      const current = gameState.getState().theme;
      const idx = themes.indexOf(current);
      const next = themes[(idx + 1) % themes.length];
      gameState.setState({ theme: next });
      soundEngine.playGlitch();
      return [{ id: crypto.randomUUID(), text: `Theme switched to: ${next.toUpperCase()}`, intent: "system" }];
    },
  },
  {
    name: "purge",
    description: "Reset all data [DANGER]",
    hidden: true,
    handler: () => {
      soundEngine.triggerCorruptionBurst(1);
      return [
        { id: crypto.randomUUID(), text: "WARNING: PURGE SEQUENCE INITIATED", intent: "corruption" },
        { id: crypto.randomUUID(), text: "All data will be irretrievably lost.", intent: "error" },
        { id: crypto.randomUUID(), text: "Type CONFIRM to proceed.", intent: "system" },
      ];
    },
  },
  {
    name: "bunker",
    description: "Contact BUNKER_7",
    handler: () => {
      soundEngine.playStatic(1200);
      return [
        { id: crypto.randomUUID(), text: "ESTABLISHING UPLINK...", intent: "system" },
        { id: crypto.randomUUID(), text: "", intent: "default" },
        { id: crypto.randomUUID(), text: "BUNKER_7: The archives remember what the world forgets.", intent: "bunker" },
        { id: crypto.randomUUID(), text: "BUNKER_7: Continue your survey. Document everything.", intent: "bunker" },
        { id: crypto.randomUUID(), text: "BUNKER_7: Some doors should remain open.", intent: "ghost" },
      ];
    },
  },
];

/* ── MAIN WORKSPACE ── */
export function TerminalWorkspace() {
  const state = useGameState();
  const [lines, setLines] = useState<TerminalLineData[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [booted, setBooted] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── BOOT SEQUENCE ── */
  useEffect(() => {
    soundEngine.playBoot();
    const bootLines: TerminalLineData[] = [
      { id: "b1", text: "BUNKER_7 ARCHIVAL SYSTEM v2.7.14", intent: "system", delay: 200 },
      { id: "b2", text: "Initializing core modules...", intent: "system", delay: 600 },
      { id: "b3", text: "  [OK] Memory integrity", intent: "default", delay: 1000 },
      { id: "b4", text: "  [OK] Signal decoder", intent: "default", delay: 1200 },
      { id: "b5", text: "  [OK] Resonance mapper", intent: "default", delay: 1400 },
      { id: "b6", text: "  [WARN] Corruption detected in sector 7", intent: "error", delay: 1600 },
      { id: "b7", text: "", intent: "default", delay: 1800 },
      { id: "b8", text: "Connection established.", intent: "discovery", delay: 2000 },
      { id: "b9", text: "Type 'help' for available commands.", intent: "system", delay: 2200 },
    ];
    setLines(bootLines);
    const t = setTimeout(() => {
      setBooted(true);
      soundEngine.startAmbience();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  /* ── AUTO SCROLL ── */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  /* ── KEYBOARD SHORTCUTS ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        const isMuted = soundEngine.toggleMute();
        setMuted(isMuted);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── COMMAND EXECUTION ── */
  const executeCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    soundEngine.playKeypress();
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const [cmdName, ...args] = trimmed.split(/\s+/);
    const cmd = COMMANDS.find(
      c => c.name === cmdName.toLowerCase() || c.aliases?.includes(cmdName.toLowerCase())
    );

    const commandLine: TerminalLineData = {
      id: crypto.randomUUID(),
      text: trimmed,
      intent: "command",
      prompt: ">",
    };

    if (!cmd) {
      setLines(prev => [
        ...prev,
        commandLine,
        { id: crypto.randomUUID(), text: `Unknown command: ${cmdName}`, intent: "error" },
        { id: crypto.randomUUID(), text: `Type 'help' for available commands.`, intent: "system" },
      ]);
      return;
    }

    if (cmd.name === "clear") {
      setLines([]);
      return;
    }

    const results = cmd.handler(args);
    setLines(prev => [...prev, commandLine, ...results]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistoryIndex(prev => {
        const next = prev + 1;
        if (next < history.length) {
          setInput(history[history.length - 1 - next]);
          return next;
        }
        return prev;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistoryIndex(prev => {
        const next = prev - 1;
        if (next >= 0) {
          setInput(history[history.length - 1 - next]);
          return next;
        }
        setInput("");
        return -1;
      });
    }
  };

  const theme = state.theme;

  return (
    <div className="vp-shell">
      {/* Scanlines overlay */}
      <div className="vp-scanlines" />

      {/* Main app container */}
      <div className="vp-app">
        {/* HUD */}
        <TerminalHUD
          dust={state.dust}
          corruption={state.corruptionStage}
          theme={theme}
          muted={muted}
          onToggleMute={() => {
            const isMuted = soundEngine.toggleMute();
            setMuted(isMuted);
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Workspace grid */}
        <div className="vp-workspace">
          {/* Terminal panel */}
          <div className="vp-term">
            <div className="vp-term-header">
              <span className="font-mono text-[11px] text-[#5a4e42] tracking-widest uppercase">
                BUNKER_7 // TERMINAL
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4a7a4a] animate-pulse" />
                <span className="font-mono text-[10px] text-[#5a4e42]">ONLINE</span>
              </div>
            </div>

            {/* Output */}
            <div ref={outputRef} className="vp-term-output">
              <AnimatePresence initial={false}>
                {lines.map((line, i) => (
                  <TerminalLine
                    key={line.id}
                    line={line}
                    theme={theme}
                    index={i}
                    isLatest={i === lines.length - 1}
                  />
                ))}
              </AnimatePresence>

              {booted && (
                <div className="flex items-center mt-2">
                  <span className={`font-mono text-[13px] mr-2 select-none ${PROMPT_COLOR[theme] ?? "text-[#c4785a]"}`}>
                    {">"}
                  </span>
                  <form onSubmit={handleSubmit} className="flex-1 flex">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#b0a090] caret-transparent"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </form>
                  <TerminalCursor theme={theme} />
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="vp-term-input">
              <FiTerminal className="w-3.5 h-3.5 text-[#5a4e42]" />
              <span className="font-mono text-[11px] text-[#5a4e42]">
                {input.length > 0 ? `${input.length} chars` : "Ready"}
              </span>
              <div className="flex-1" />
              <span className="font-mono text-[10px] text-[#3a3028]">
                {history.length} entries
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="vp-sidebar"
              >
                <TerminalSidebar
                  activeTab={activeTab}
                  onSetTab={setActiveTab}
                  theme={theme}
                  dust={state.dust}
                  corruption={state.corruptionStage}
                  inventory={state.inventory}
                  visitedPlaces={state.visitedPlaces}
                  expeditionLog={state.expeditionLog}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="vp-footer">
          <span className="font-mono text-[10px] text-[#3a3028] tracking-wider">
            BUNKER_7 ARCHIVAL DIVISION — CLASSIFIED
          </span>
        </div>
      </div>
    </div>
  );
}