"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { useTerminalStore } from "@/state/terminalStore";

// ─── Types ─────────────────────────────────────────────────────────
type LineType = "input" | "output" | "system" | "error";

interface TerminalLine {
  id: string;
  type: LineType;
  text: string;
}

interface CommandDef {
  desc: string;
  handler: (args: string[]) => string[];
}

// ─── Audio ─────────────────────────────────────────────────────────
const keySounds = [
  new Howl({ src: ["/audio/terminal/key_01.mp3"], volume: 0.12 }),
  new Howl({ src: ["/audio/terminal/key_02.mp3"], volume: 0.12 }),
  new Howl({ src: ["/audio/terminal/key_03.mp3"], volume: 0.12 }),
];

const enterSound = new Howl({
  src: ["/audio/terminal/enter_thud.mp3"],
  volume: 0.2,
});

const bellSound = new Howl({
  src: ["/audio/terminal/bell_soft.mp3"],
  volume: 0.15,
});

const scrollSound = new Howl({
  src: ["/audio/terminal/scroll_rustle.mp3"],
  volume: 0.08,
});

function playKey() {
  const s = keySounds[Math.floor(Math.random() * keySounds.length)];
  s?.play();
}
function playEnter() { enterSound.play(); }
function playBell() { bellSound.play(); }
function playScroll() { scrollSound.play(); }

// ─── Command Registry ──────────────────────────────────────────────
const COMMANDS: Record<string, CommandDef> = {
  help: {
    desc: "List available commands",
    handler: () => {
      const lines = ["[SYSTEM] Available commands:"];
      Object.entries(COMMANDS).forEach(([name, def]) => {
        lines.push(`  ${name.padEnd(14)} — ${def.desc}`);
      });
      return lines;
    },
  },
  clear: {
    desc: "Clear terminal output",
    handler: () => {
      useTerminalStore.getState().clearLines();
      return [];
    },
  },
  atlas: {
    desc: "Open the Atlas",
    handler: () => {
      return [
        "[OK] Atlas synchronized.",
        "  159 locations indexed.",
        "  Use the map interface to browse.",
      ];
    },
  },
  investigate: {
    desc: "List active investigations",
    handler: () => {
      return [
        "[OK] Investigation ledger:",
        "  [ACTIVE]   VP-2024-001: The Dust Corridor",
        "  [COLD]     VP-2023-089: Meridian Signal",
        "  [SEALED]   VP-2022-044: Operation Blackwater",
      ];
    },
  },
  status: {
    desc: "System status report",
    handler: () => {
      return [
        "[OK] Archive Terminal v7.2",
        "  Uptime: 14d 07h 33m",
        "  Dust Level: 0.12 μg/m³ (nominal)",
        "  Connection: STABLE",
        "  Encryption: AES-256-GCM",
      ];
    },
  },
  bunker7: {
    desc: "Contact BUNKER_7",
    handler: () => {
      return [
        "[CONNECTING] BUNKER_7...",
        "  Channel open.",
        "  Awaiting input.",
      ];
    },
  },
};

// ─── Screw Head Component ──────────────────────────────────────────
function Screw({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="h-2.5 w-2.5 rounded-full bg-[#2a2826] shadow-inner" />
      <div className="absolute h-px w-1.5 bg-[#1a1918]" />
    </div>
  );
}

// ─── Status LED ────────────────────────────────────────────────────
function StatusLED({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-1.5 w-1.5 rounded-full shadow-[0_0_4px]"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
      />
      <span className="font-mono text-[9px] tracking-wider text-[#5a5045]">
        {label}
      </span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────
export function Terminal() {
  const { isOpen, lines, addLine, clearLines, setOpen } = useTerminalStore();

  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState("");
  const [hasBooted, setHasBooted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Global keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "~" || e.key === "`") {
        e.preventDefault();
        useTerminalStore.getState().toggle();
      }
      if (e.key === "Escape" && useTerminalStore.getState().isOpen) {
        useTerminalStore.getState().setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Print lines with mechanical delay
  const printLines = useCallback(
    (texts: string[], type: LineType = "output", delay = 55) => {
      texts.forEach((text, i) => {
        setTimeout(() => {
          addLine({ id: `${Date.now()}-${i}-${Math.random()}`, type, text });
          if (i > 0) playScroll();
        }, i * delay);
      });
    },
    [addLine]
  );

  // Execute command
  const execute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      playEnter();
      addLine({ id: `in-${Date.now()}`, type: "input", text: `> ${trimmed}` });
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      const [cmd, ...args] = trimmed.split(/\s+/);
      const def = COMMANDS[cmd.toLowerCase()];

      if (def) {
        const result = def.handler(args);
        if (result.length > 0) printLines(result, "output", 45);
      } else {
        printLines(
          [`[ERROR] Unknown command: "${cmd}"`, '  Type "help" for available commands.'],
          "error",
          35
        );
        playBell();
      }

      setInput("");
      setGhostText("");
    },
    [addLine, printLines]
  );

  // Input handlers
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 0) {
      const match = Object.keys(COMMANDS).find((c) =>
        c.startsWith(val.toLowerCase())
      );
      setGhostText(match ? match.slice(val.length) : "");
    } else {
      setGhostText("");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      execute(input);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (ghostText) {
        setInput((prev) => prev + ghostText);
        setGhostText("");
        playKey();
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
      return;
    }
    if (e.key.length === 1) playKey();
  };

  // Boot message on first open
  useEffect(() => {
    if (isOpen && !hasBooted) {
      setHasBooted(true);
      printLines(
        [
          "[OK] Archive Terminal v7.2",
          "[OK] Connection established",
          "[OK] 159 locations indexed",
          "",
          'Type "help" for available commands.',
        ],
        "system",
        70
      );
    }
  }, [isOpen, hasBooted, printLines]);

  const lineColor = (type: LineType) => {
    switch (type) {
      case "input": return "text-[#ffb000]";
      case "system": return "text-[#6a5a3a]";
      case "error": return "text-[#8b3a3a]";
      default: return "text-[#c4a060]";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{ height: "45vh" }}
        >
          {/* Outer chassis — brushed metal feel */}
          <div className="flex h-full flex-col border-t-2 border-[#3a3530] bg-[#141210]">

            {/* Top bezel — equipment header */}
            <div className="relative flex items-center justify-between border-b border-[#2a2520] bg-[#1c1916] px-5 py-2.5">
              {/* Screw heads */}
              <Screw className="absolute left-2 top-2" />
              <Screw className="absolute right-2 top-2" />

              {/* Left: model label */}
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#ffb000] shadow-[0_0_6px_#ffb000]" />
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#8a7560]">
                  ARCHIVE TERMINAL
                </span>
                <span className="font-mono text-[9px] tracking-wider text-[#4a4035]">
                  MODEL 7-B / REV 2.1
                </span>
              </div>

              {/* Right: status LEDs */}
              <div className="flex items-center gap-4">
                <StatusLED color="#4a9a4a" label="PWR" />
                <StatusLED color="#ffb000" label="LINK" />
                <StatusLED color="#3a7a9a" label="DISK" />
                <button
                  onClick={() => setOpen(false)}
                  className="ml-3 font-mono text-[10px] tracking-wider text-[#5a5045] transition-colors hover:text-[#ffb000]"
                >
                  [CLOSE]
                </button>
              </div>
            </div>

            {/* Panel seam line */}
            <div className="h-px bg-[#2a2520]" />

            {/* Output area — the paper */}
            <div className="relative flex-1 overflow-hidden bg-[#0f0e0c]">
              {/* Subtle panel texture overlay */}
              <div 
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    #ffb000 2px,
                    #ffb000 3px
                  )`,
                }}
              />

              <div className="h-full overflow-y-auto px-5 py-4 font-mono text-[13px] leading-[1.7]">
                {lines.map((line) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`whitespace-pre-wrap ${lineColor(line.type)}`}
                  >
                    {line.text}
                  </motion.div>
                ))}
                <div ref={outputEndRef} />
              </div>
            </div>

            {/* Bottom panel seam */}
            <div className="h-px bg-[#2a2520]" />

            {/* Input bar — unmistakably visible */}
            <div className="relative border-t border-[#2a2520] bg-[#1a1815] px-5 py-3">
              <Screw className="absolute left-2 top-1/2 -translate-y-1/2" />
              <Screw className="absolute right-2 top-1/2 -translate-y-1/2" />

              <div className="flex items-center gap-3">
                {/* Prompt */}
                <span className="shrink-0 font-mono text-sm font-bold text-[#ffb000]">
                  &gt;
                </span>

                {/* Input container */}
                <div className="relative flex-1">
                  {/* Visible input background */}
                  <div className="absolute inset-0 -mx-2 rounded bg-[#ffb000]/5" />

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    className="relative w-full bg-transparent px-2 py-1 font-mono text-sm text-[#ffb000] outline-none placeholder:text-[#3a3530]"
                    placeholder="enter command..."
                    spellCheck={false}
                    autoComplete="off"
                  />

                  {/* Ghost autocomplete */}
                  {ghostText && (
                    <span className="pointer-events-none absolute left-2 top-1 font-mono text-sm text-[#ffb000]/20">
                      {input}{ghostText}
                    </span>
                  )}
                </div>

                {/* Block cursor */}
                <motion.div
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  className="shrink-0 h-5 w-2.5 rounded-sm bg-[#ffb000]"
                />

                {/* Enter hint */}
                <span className="shrink-0 font-mono text-[9px] tracking-wider text-[#3a3530]">
                  ENTER
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}