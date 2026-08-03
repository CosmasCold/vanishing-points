"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Circle,
  X,
  Radio,
  Flame,
  Skull,
  Users,
  BookOpen,
} from "lucide-react";
import { useArchiveReadings, synchronizeReadings, detectNextReading } from "@/hooks/useArchiveReadings";
import type { ReadingCondition } from "@/hooks/useArchiveReadings";
import { showToast } from "@/lib/toast";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  signal: <Radio size={12} />,
  expedition: <Flame size={12} />,
  corruption: <Skull size={12} />,
  community: <Users size={12} />,
  lore: <BookOpen size={12} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  signal: "#7a9a6a",
  expedition: "#9a8a5a",
  corruption: "#c4785a",
  community: "#8a7a6a",
  lore: "#9a8a72",
};

interface Props {
  theme: {
    primary: string;
    dim: string;
    accent: string;
  };
  onPushTerminal?: (lines: string[]) => void;
}

export default function LeadPanel({ theme, onPushTerminal }: Props) {
  const { active, completed, clarity, refresh, abandon } = useArchiveReadings();
  const [justCompleted, setJustCompleted] = useState(false);

  const handleCheck = () => {
    const updated = synchronizeReadings();
    if (!updated && active) {
      setJustCompleted(true);
      showToast(`Pattern resolved: ${active.title}`, "info");
      onPushTerminal?.([
        `╔══════════════════════════════════════╗`,
        `║  PATTERN RESOLVED                    ║`,
        `║  ${active.title.slice(0, 34).padEnd(34)}║`,
        `╠══════════════════════════════════════╣`,
        `║  Archive expanded.                   ║`,
        `║  New signals detected.               ║`,
        `╚══════════════════════════════════════╝`,
        "",
      ]);
      setTimeout(() => {
        setJustCompleted(false);
        refresh();
        setTimeout(() => {
          const next = detectNextReading();
          if (next) {
            showToast(`New pattern: ${next.title}`, "info");
            onPushTerminal?.([
              `NEW PATTERN SURFACED: ${next.title.toUpperCase()}`,
              next.description.slice(0, 60) + (next.description.length > 60 ? "..." : ""),
              "",
            ]);
            refresh();
          }
        }, 500);
      }, 2000);
    } else {
      refresh();
    }
  };

  const handleAbandon = () => {
    if (!active) return;
    abandon();
    showToast("Pattern abandoned", "warning");
    onPushTerminal?.([
      "PATTERN ABANDONED.",
      "BUNKER_7 does not judge. The archive continues either way.",
      "",
    ]);
    refresh();
  };

  const handleGenerate = () => {
    const next = detectNextReading();
    if (next) {
      showToast(`New pattern: ${next.title}`, "info");
      refresh();
    } else {
      showToast("No patterns available. All correlations complete.", "info");
    }
  };

  if (!active && completed.length === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <Target size={24} className="mx-auto opacity-30" style={{ color: theme.dim }} />
        <p className="text-[11px] opacity-50" style={{ color: theme.dim }}>
          No active patterns.
        </p>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 border rounded text-[11px] font-mono uppercase tracking-wider transition-all hover:opacity-80"
          style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
        >
          Open Channel
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-4 text-center py-8">
        <CheckCircle2 size={24} className="mx-auto opacity-40" style={{ color: "#7a9a6a" }} />
        <p className="text-[11px] opacity-50" style={{ color: theme.dim }}>
          {completed.length} pattern{completed.length !== 1 ? "s" : ""} archived.
        </p>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 border rounded text-[11px] font-mono uppercase tracking-wider transition-all hover:opacity-80"
          style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
        >
          Open Channel
        </button>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[active.category] || theme.dim;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border"
            style={{ borderColor: `${catColor}40`, color: catColor }}
          >
            {CATEGORY_ICONS[active.category]}
            {active.category}
          </span>
          <span className="text-[10px] font-mono opacity-40" style={{ color: theme.dim }}>
            {clarity}%
          </span>
        </div>
        <button
          onClick={handleAbandon}
          className="text-[10px] opacity-30 hover:opacity-70 transition-opacity"
          style={{ color: theme.dim }}
          title="Abandon pattern"
        >
          <X size={12} />
        </button>
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-[13px] font-bold mb-1" style={{ color: theme.primary }}>
          {active.title}
        </h3>
        <p className="text-[11px] leading-relaxed opacity-80" style={{ color: theme.dim }}>
          {active.description}
        </p>
      </div>

      {/* Clarity Bar */}
      <div className="space-y-1">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(12,10,8,0.6)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: catColor }}
            initial={{ width: 0 }}
            animate={{ width: `${clarity}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider opacity-40" style={{ color: theme.dim }}>
          Conditions
        </p>
        {active.conditions.map((cond: ReadingCondition) => (
          <div
            key={cond.id}
            className="flex items-start gap-2 text-[11px] leading-relaxed"
            style={{ color: cond.observed ? "#7a9a6a" : theme.dim }}
          >
            <span className="mt-0.5 flex-shrink-0">
              {cond.observed ? (
                <CheckCircle2 size={12} style={{ color: "#7a9a6a" }} />
              ) : (
                <Circle size={12} className="opacity-30" />
              )}
            </span>
            <span className={cond.observed ? "line-through opacity-50" : ""}>
              {cond.text}
            </span>
          </div>
        ))}
      </div>

      {/* Check Status Button */}
      <button
        onClick={handleCheck}
        disabled={justCompleted}
        className="w-full py-2 border rounded text-[11px] font-mono uppercase tracking-wider transition-all disabled:opacity-30"
        style={{
          borderColor: `${catColor}40`,
          color: catColor,
          backgroundColor: `${catColor}08`,
        }}
      >
        {justCompleted ? "Sealing record..." : "Check Status"}
      </button>

      {/* Completed patterns count */}
      {completed.length > 0 && (
        <p className="text-[10px] opacity-30 text-center pt-2" style={{ color: theme.dim }}>
          {completed.length} pattern{completed.length !== 1 ? "s" : ""} archived
        </p>
      )}
    </div>
  );
}