"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Circle,
  Lightbulb,
  X,
  Radio,
  Flame,
  Skull,
  Users,
  BookOpen,
  ChevronRight,
  Gift,
} from "lucide-react";
import { Lead, useLeads, checkLeadProgress, generateNextLead } from "@/hooks/useLeads";
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
  corruption: "#9a5a5a",
  community: "#6a8a9a",
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
  const { active, completed, progress, refresh, abandon } = useLeads();
  const [showHint, setShowHint] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleCheck = () => {
    const updated = checkLeadProgress();
    if (!updated && active) {
      // Lead completed!
      setJustCompleted(true);
      showToast(`Lead complete: ${active.title}`, "success");
      onPushTerminal?.([
        `╔══════════════════════════════════════╗`,
        `║  LEAD COMPLETED                      ║`,
        `║  ${active.title.padEnd(34)}║`,
        `╠══════════════════════════════════════╣`,
        `║  Rewards distributed.                ║`,
        `║  Check your inventory and fragments. ║`,
        `╚══════════════════════════════════════╝`,
        "",
      ]);
      setTimeout(() => {
        setJustCompleted(false);
        refresh();
        // Auto-generate next lead after a delay
        setTimeout(() => {
          const next = generateNextLead();
          if (next) {
            showToast(`New lead: ${next.title}`, "info");
            onPushTerminal?.([
              `NEW LEAD ACQUIRED: ${next.title.toUpperCase()}`,
              next.description.slice(0, 60) + "...",
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
    showToast("Lead abandoned", "warning");
    onPushTerminal?.([
      "LEAD ABANDONED.",
      "BUNKER_7 does not judge. The archive continues either way.",
      "",
    ]);
    refresh();
  };

  const handleGenerate = () => {
    const next = generateNextLead();
    if (next) {
      showToast(`New lead: ${next.title}`, "info");
      refresh();
    } else {
      showToast("No leads available. All objectives complete.", "success");
    }
  };

  if (!active && completed.length === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <Target size={24} className="mx-auto opacity-30" style={{ color: theme.dim }} />
        <p className="text-xs opacity-50" style={{ color: theme.dim }}>
          No active leads.
        </p>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 border rounded text-[10px] font-mono uppercase tracking-wider transition-all hover:opacity-80"
          style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
        >
          Acquire Lead
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-4 text-center py-8">
        <CheckCircle2 size={24} className="mx-auto opacity-40" style={{ color: "#7a9a6a" }} />
        <p className="text-xs opacity-50" style={{ color: theme.dim }}>
          {completed.length} lead{completed.length !== 1 ? "s" : ""} completed.
        </p>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 border rounded text-[10px] font-mono uppercase tracking-wider transition-all hover:opacity-80"
          style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
        >
          Acquire Next Lead
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
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border"
            style={{ borderColor: `${catColor}40`, color: catColor }}
          >
            {CATEGORY_ICONS[active.category]}
            {active.category}
          </span>
          <span className="text-[9px] font-mono opacity-40" style={{ color: theme.dim }}>
            {progress}%
          </span>
        </div>
        <button
          onClick={handleAbandon}
          className="text-[9px] opacity-30 hover:opacity-70 transition-opacity"
          style={{ color: theme.dim }}
          title="Abandon lead"
        >
          <X size={12} />
        </button>
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-sm font-bold mb-1" style={{ color: theme.primary }}>
          {active.title}
        </h3>
        <p className="text-[11px] leading-relaxed opacity-80" style={{ color: theme.dim }}>
          {active.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: catColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <p className="text-[9px] font-mono uppercase tracking-wider opacity-40" style={{ color: theme.dim }}>
          Objectives
        </p>
        {active.objectives.map((obj) => (
          <div
            key={obj.id}
            className="flex items-start gap-2 text-[11px] leading-relaxed"
            style={{ color: obj.completed ? "#7a9a6a" : theme.dim }}
          >
            <span className="mt-0.5 flex-shrink-0">
              {obj.completed ? (
                <CheckCircle2 size={12} className="text-[#7a9a6a]" />
              ) : (
                <Circle size={12} className="opacity-30" />
              )}
            </span>
            <span className={obj.completed ? "line-through opacity-50" : ""}>
              {obj.text}
            </span>
          </div>
        ))}
      </div>

      {/* Check Progress Button */}
      <button
        onClick={handleCheck}
        disabled={justCompleted}
        className="w-full py-2 border rounded text-[10px] font-mono uppercase tracking-wider transition-all disabled:opacity-30"
        style={{
          borderColor: `${catColor}40`,
          color: catColor,
          backgroundColor: `${catColor}08`,
        }}
      >
        {justCompleted ? "Processing..." : "Update Progress"}
      </button>

      {/* Hint */}
      {active.hint && (
        <div className="space-y-1">
          <button
            onClick={() => setShowHint((s) => !s)}
            className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: theme.dim }}
          >
            <Lightbulb size={10} />
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] italic pl-3 border-l-2"
                style={{ borderColor: `${catColor}30`, color: theme.dim }}
              >
                {active.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rewards Preview */}
      {active.rewards && (
        <div className="pt-2 border-t" style={{ borderColor: `${theme.primary}08` }}>
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider opacity-30 mb-1.5" style={{ color: theme.dim }}>
            <Gift size={10} />
            Rewards
          </div>
          <div className="flex flex-wrap gap-1.5">
            {active.rewards.dust && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: "#9a8a5a30", color: "#9a8a5a" }}>
                +{active.rewards.dust} dust
              </span>
            )}
            {active.rewards.fragments && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: "#7a9a6a30", color: "#7a9a6a" }}>
                {active.rewards.fragments.length} fragment{active.rewards.fragments.length !== 1 ? "s" : ""}
              </span>
            )}
            {active.rewards.items && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: "#6a8a9a30", color: "#6a8a9a" }}>
                {active.rewards.items.length} item{active.rewards.items.length !== 1 ? "s" : ""}
              </span>
            )}
            {active.rewards.codes && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: "#9a8a7230", color: "#9a8a72" }}>
                {active.rewards.codes.length} code{active.rewards.codes.length !== 1 ? "s" : ""}
              </span>
            )}
            {active.rewards.corruptionDelta && active.rewards.corruptionDelta > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: "#9a5a5a30", color: "#9a5a5a" }}>
                +{active.rewards.corruptionDelta} corruption
              </span>
            )}
          </div>
        </div>
      )}

      {/* Completed leads count */}
      {completed.length > 0 && (
        <p className="text-[9px] opacity-30 text-center pt-2" style={{ color: theme.dim }}>
          {completed.length} lead{completed.length !== 1 ? "s" : ""} archived
        </p>
      )}
    </div>
  );
}