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
  new Howl({ src: ["/audio/terminal/key_01.mp3"], volume: 0.15 }),
  new Howl({ src: ["/audio/terminal/key_02.mp3"], volume: 0.15 }),
  new Howl({ src: ["/audio/terminal/key_03.mp3"], volume: 0.15 }),
];

const enterSound = new Howl({
  src: ["/audio/terminal/enter_thud.mp3"],
  volume: 0.25,
});

const bellSound = new Howl({
  src: ["/audio/terminal/bell_soft.mp3"],
  volume: 0.2,
});

const scrollSound = new Howl({
  src: ["/audio/terminal/scroll_rustle.mp3"],
  volume: 0.1,
});

function playKey() {
  const s = keySounds[Math.floor(Math.random() * keySounds.length)];
  s?.play();
}

function playEnter() {
  enterSound.play();
}

function playBell() {
  bellSound.play();
}

function playScroll() {
  scrollSound.play();
}

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

// ─── Component ─────────────────────────────────────────────────────
export function Terminal() {
  const { isOpen, lines, addLine, clearLines, toggle, setOpen } =
    useTerminalStore();

  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [ghostText, setGhostText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Global keyboard listener — NO stale closure
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

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Print lines with mechanical delay
  const printLines = useCallback(
    (texts: string[], type: LineType = "output", delay = 60) => {
      texts.forEach((text, i) => {
        setTimeout(() => {
          addLine({ id: `${Date.now()}-${i}`, type, text });
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
        if (result.length > 0) {
          printLines(result, "output", 50);
        }
      } else {
        printLines(
          [`[ERROR] Unknown command: "${cmd}"`, '  Type "help" for available commands.'],
          "error",
          40
        );
        playBell();
      }

      setInput("");
      setGhostText("");
    },
    [addLine, printLines]
  );

  // Input handling
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Autocomplete ghost
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
      const newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
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

    if (e.key.length === 1) {
      playKey();
    }
  };

  // Boot message on first open
  useEffect(() => {
    if (isOpen && lines.length === 0) {
      printLines(
        [
          "[OK] Archive Terminal v7.2",
          "[OK] Connection established",
          "[OK] 159 locations indexed",
          "",
          'Type "help" for available commands.',
        ],
        "system",
        80
      );
    }
  }, [isOpen, lines.length, printLines]);

  const lineColor = (type: LineType) => {
    switch (type) {
      case "input":
        return "text-[#ffb000]";
      case "system":
        return "text-[#8a6000]";
      case "error":
        return "text-[#8b3a3a]";
      default:
        return "text-[#c4a060]";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
          style={{ height: "45vh" }}
        >
          {/* Panel */}
          <div className="flex flex-1 flex-col border-t border-[#ffb000]/20 bg-[#0d0c0b]/95 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ffb000]/10 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ffb000]" />
                <span className="font-mono text-xs tracking-widest text-[#ffb000]/70">
                  ARCHIVE TERMINAL — v7.2
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="font-mono text-xs text-[#ffb000]/40 transition-colors hover:text-[#ffb000]"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Output */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm"
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`whitespace-pre-wrap leading-relaxed ${lineColor(line.type)}`}
                >
                  {line.text}
                </div>
              ))}
              <div ref={outputEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#ffb000]/10 px-4 py-3">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-[#ffb000]">&gt;</span>
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    className="w-full bg-transparent font-mono text-sm text-[#ffb000] outline-none"
                    placeholder=""
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {/* Ghost text for autocomplete */}
                  {ghostText && (
                    <span className="pointer-events-none absolute left-0 top-0 font-mono text-sm text-[#ffb000]/30">
                      {input}
                      {ghostText}
                    </span>
                  )}
                </div>
                {/* Block cursor */}
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="h-5 w-2.5 bg-[#ffb000]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}