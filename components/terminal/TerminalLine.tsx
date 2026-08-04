"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── LINE STYLE VARIANTS ── */
const lineVariants = cva(
  "font-mono text-[13px] leading-[1.6] tracking-[-0.01em] whitespace-pre-wrap break-words",
  {
    variants: {
      intent: {
        default: "text-[#b0a090]",
        command: "text-[#c4b8a4] font-semibold",
        system: "text-[#8a7a6a] italic",
        error: "text-[#8b3a2a]",
        ghost: "text-[#6a5a4a] opacity-60 blur-[0.3px]",
        corruption: "text-[#c4785a] animate-flicker",
        bunker: "text-[#9a8a72] border-l-2 border-[#5a4e42]/30 pl-3",
        discovery: "text-[#c4a882] font-medium",
        echo: "text-[#7a6a5a] opacity-40",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        bold: "font-bold",
      },
      state: {
        idle: "",
        decoding: "opacity-50",
        revealed: "opacity-100 transition-opacity duration-500",
      },
    },
    defaultVariants: {
      intent: "default",
      weight: "normal",
      state: "idle",
    },
  }
);

/* ── THEME COLOR MAPS ── */
const THEME_PROMPT: Record<string, string> = {
  tungsten: "text-[#c4785a]",
  phosphor: "text-[#4a9a6a]",
  amber: "text-[#c4a040]",
  bone: "text-[#ddd0bc]",
  ember: "text-[#8b3a2a]",
  ash: "text-[#5a4e42]",
  void: "text-[#3a3028]",
  archive: "text-[#7a6b52]",
  blue: "text-[#5a7a9a]",
  green: "text-[#4a7a5a]",
  red: "text-[#9a4a4a]",
  white: "text-[#c4c4c4]",
};

const THEME_CURSOR: Record<string, string> = {
  tungsten: "bg-[#c4785a]",
  phosphor: "bg-[#4a9a6a]",
  amber: "bg-[#c4a040]",
  bone: "bg-[#ddd0bc]",
  ember: "bg-[#8b3a2a]",
  ash: "bg-[#5a4e42]",
  void: "bg-[#3a3028]",
  archive: "bg-[#7a6b52]",
  blue: "bg-[#5a7a9a]",
  green: "bg-[#4a7a5a]",
  red: "bg-[#9a4a4a]",
  white: "bg-[#c4c4c4]",
};

/* ── TYPES ── */
export interface TerminalLineData {
  id: string;
  text: string;
  intent?: VariantProps<typeof lineVariants>["intent"];
  prompt?: string;
  delay?: number;
  glitch?: boolean;
}

interface TerminalLineProps extends VariantProps<typeof lineVariants> {
  line: TerminalLineData;
  theme?: string;
  index: number;
  isLatest?: boolean;
}

/* ── GLITCH TEXT EFFECT ── */
function GlitchText({ text, active }: { text: string; active?: boolean }) {
  if (!active) return <>{text}</>;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 12;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(interval);
        return;
      }
      const progress = frame / totalFrames;
      const result = text
        .split("")
        .map((char) => {
          if (char === " ") return " ";
          if (Math.random() > progress) return chars[Math.floor(Math.random() * chars.length)];
          return char;
        })
        .join("");
      setDisplay(result);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <>{display}</>;
}

/* ── TERMINAL LINE ── */
export function TerminalLine({ line, theme = "tungsten", index, isLatest }: TerminalLineProps) {
  const [visible, setVisible] = useState(false);
  const [decoded, setDecoded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), line.delay ?? index * 40);
    return () => clearTimeout(t);
  }, [line.delay, index]);

  useEffect(() => {
    if (visible && line.intent === "ghost") {
      const t = setTimeout(() => setDecoded(true), 2000);
      return () => clearTimeout(t);
    }
  }, [visible, line.intent]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "py-[2px]",
        line.intent === "ghost" && !decoded && "opacity-30 blur-[0.5px]",
        line.intent === "ghost" && decoded && "opacity-60 blur-0 transition-all duration-1000"
      )}
    >
      {line.prompt && (
        <span className={cn("select-none mr-2", THEME_PROMPT[theme] ?? "text-[#c4785a]")}>
          {line.prompt}
        </span>
      )}
      <span className={lineVariants({ intent: line.intent ?? "default" })}>
        <GlitchText text={line.text} active={Boolean(line.glitch) && Boolean(isLatest)} />
      </span>
    </motion.div>
  );
}

/* ── TYPING CURSOR ── */
export function TerminalCursor({ theme = "tungsten", blinking = true }: { theme?: string; blinking?: boolean }) {
  return (
    <motion.span
      animate={{ opacity: blinking ? [1, 0, 1] : 1 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "steps(1)" }}
      className={cn(
        "inline-block w-[8px] h-[18px] align-middle ml-1",
        THEME_CURSOR[theme] ?? "bg-[#c4785a]"
      )}
    />
  );
}