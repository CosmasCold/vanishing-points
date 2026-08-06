"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTerminalStore } from "@/state/terminalStore";
import { useTerminalAudio } from "@/hooks/useTerminalAudio";

/* ═══════════════════════════════════════════════════════════════
   COMMAND REGISTRY — Wire these to your existing systems
   ═══════════════════════════════════════════════════════════════ */
const COMMANDS: Record<string, { desc: string; handler: () => string[] }> = {
  help: {
    desc: "List available commands",
    handler: () => [
      "AVAILABLE COMMANDS:",
      "  atlas        — Open the Atlas",
      "  investigate  — List active investigations",
      "  evidence     — View collected evidence",
      "  documents    — Open document archive",
      "  signals      — Access signal recordings",
      "  dust         — Check Dust exposure level",
      "  status       — Archive system status",
      "  bunker7      — Contact BUNKER_7",
      "  clear        — Clear terminal buffer",
      "  help         — This message",
      "",
      "Type a command and press ENTER.",
    ],
  },
  atlas: {
    desc: "Open the Atlas",
    handler: () => [
      "[OK] Opening Atlas...",
      "  159 locations indexed.",
      "  23 coordinates unstable.",
      "  7 locations require immediate review.",
    ],
  },
  status: {
    desc: "Archive system status",
    handler: () => [
      "ARCHIVE SYSTEM STATUS:",
      "  Uptime:        14,392 hours",
      "  Dust Index:    0.34 μg/m³",
      "  Observer:      STABLE",
      "  Atlas Sync:    PARTIAL (23 drift events)",
      "  BUNKER_7:      ONLINE",
      "  Last Backup:   1987-11-04 02:17 UTC",
    ],
  },
  dust: {
    desc: "Check Dust exposure",
    handler: () => [
      "DUST EXPOSURE REPORT:",
      "  Current Level: LOW",
      "  Accumulation:  12.4 units",
      "  Perception:    Normal parameters",
      "  Stability:     94%",
      "",
      "No anomalous readings detected.",
    ],
  },
  clear: {
    desc: "Clear terminal buffer",
    handler: () => [],
  },
};

const COMMAND_NAMES = Object.keys(COMMANDS);

/* ═══════════════════════════════════════════════════════════════
   TERMINAL COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function Terminal() {
  const {
    isOpen,
    lines,
    inputBuffer,
    cursorPosition,
    isPrinting,
    setOpen,
    addLine,
    setInput,
    moveCursor,
    submitInput,
    historyPrev,
    historyNext,
    clear,
    setPrinting,
  } = useTerminalStore();

  const { playKey, playEnter, playBell, playScroll } = useTerminalAudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autocomplete, setAutocomplete] = useState<string | null>(null);

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  /* ── Focus input when open ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /* ── Toggle with ~ key ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, setOpen]);

  /* ── Process command ── */
  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      if (!trimmed) return;

      setPrinting(true);

      if (trimmed === "clear") {
        clear();
        setPrinting(false);
        return;
      }

      const command = COMMANDS[trimmed];
      if (!command) {
        const out = [
          `Unknown command: "${trimmed}"`,
          'Type "help" for available commands.',
        ];
        printLines(out, "error");
        playBell();
        return;
      }

      const out = command.handler();
      printLines(out, "output");
    },
    [setPrinting, clear, playBell]
  );

  const printLines = useCallback(
    (texts: string[], type: TerminalLine["type"]) => {
      let delay = 0;
      texts.forEach((text, i) => {
        delay += 40 + Math.random() * 60;
        setTimeout(() => {
          addLine({ text, type });
          if (i === texts.length - 1) {
            setPrinting(false);
          } else {
            playScroll();
          }
        }, delay);
      });
    },
    [addLine, setPrinting, playScroll]
  );

  /* ── Input handling ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    playKey();
    setAutocomplete(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPrinting) {
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        playEnter();
        submitInput();
        setTimeout(() => processCommand(inputBuffer), 50);
        setAutocomplete(null);
        break;

      case "ArrowUp":
        e.preventDefault();
        historyPrev();
        break;

      case "ArrowDown":
        e.preventDefault();
        historyNext();
        break;

      case "Tab":
        e.preventDefault();
        if (autocomplete) {
          setInput(autocomplete);
          setAutocomplete(null);
        } else {
          const match = COMMAND_NAMES.find((c) =>
            c.startsWith(inputBuffer.toLowerCase())
          );
          if (match && match !== inputBuffer.toLowerCase()) {
            setAutocomplete(match);
          }
        }
        break;

      case "Escape":
        setOpen(false);
        break;

      case "ArrowLeft":
        moveCursor(-1);
        break;

      case "ArrowRight":
        moveCursor(1);
        break;

      case "Home":
        moveCursor(-9999);
        break;

      case "End":
        moveCursor(9999);
        break;

      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          playKey();
        }
        break;
    }
  };

  /* ── Render ── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 flex flex-col"
          style={{
            height: "45vh",
            background: "#0d0c0a",
            borderTop: "1px solid rgba(255, 176, 0, 0.2)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,176,0,0.05)",
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
        >
          {/* Subtle LCD texture */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='2' fill='%23ffb000'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Header bar */}
          <div
            className="relative z-10 flex items-center justify-between px-4 py-1.5"
            style={{
              background: "rgba(255,176,0,0.04)",
              borderBottom: "1px solid rgba(255,176,0,0.08)",
            }}
          >
            <span
              className="font-mono text-[10px] tracking-[2px]"
              style={{ color: "rgba(255,176,0,0.35)" }}
            >
              ARCHIVE TERMINAL — v7.2
            </span>
            <button
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] hover:opacity-100"
              style={{ color: "rgba(255,176,0,0.4)" }}
            >
              [ CLOSE ]
            </button>
          </div>

          {/* Output scroll area */}
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-[1.7]"
            style={{ color: "#ffb000" }}
          >
            {lines.map((line) => (
              <div
                key={line.id}
                className="mb-0.5 whitespace-pre-wrap"
                style={{
                  color:
                    line.type === "error"
                      ? "#c45a5a"
                      : line.type === "system"
                      ? "#8a6000"
                      : line.type === "input"
                      ? "#ffb000"
                      : "#d4a030",
                  opacity: line.type === "system" ? 0.7 : 1,
                }}
              >
                {line.text}
              </div>
            ))}
            {isPrinting && (
              <div className="animate-pulse" style={{ color: "#8a6000" }}>
                ...
              </div>
            )}
          </div>

          {/* Input line */}
          <div
            className="relative z-10 flex items-center px-4 py-2.5"
            style={{
              borderTop: "1px solid rgba(255,176,0,0.1)",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <span className="mr-2 font-mono text-sm" style={{ color: "#8a6000" }}>
              &gt;
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputBuffer}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent font-mono text-sm outline-none"
                style={{
                  color: "#ffb000",
                  caretColor: "transparent",
                }}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
              />
              {/* Block cursor */}
              <div
                className="pointer-events-none absolute top-0 h-[1.3em] w-[8px]"
                style={{
                  left: `${cursorPosition * 7.2 + 2}px`,
                  background: "#ffb000",
                  opacity: 0.7,
                  marginTop: "2px",
                }}
              />
              {/* Autocomplete ghost */}
              {autocomplete && (
                <div
                  className="pointer-events-none absolute top-0 font-mono text-sm"
                  style={{
                    left: `${inputBuffer.length * 7.2 + 2}px`,
                    color: "rgba(255,176,0,0.25)",
                    marginTop: "2px",
                  }}
                >
                  {autocomplete.slice(inputBuffer.length)}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}