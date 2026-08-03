"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText } from "lucide-react";
import {
  STORY_ASSETS,
  getUnlockedAssets,
  getAssetRecoveryDates,
  tryUnlockPendingAssets,
  type StoryAsset,
} from "@/lib/assets";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  themeColor?: string;
}

const RARITY_COLORS: Record<string, string> = {
  legendary: "#c4785a",
  rare: "#a67c52",
  uncommon: "#9a8a72",
  common: "#7a6e5e",
};

const RARITY_STAMPS: Record<string, string> = {
  legendary: "LEVEL V CLEARANCE",
  rare: "LEVEL III CLEARANCE",
  uncommon: "LEVEL II CLEARANCE",
  common: "UNCLASSIFIED",
};

export default function AssetGallery({ isOpen, onClose, themeColor = "#9a8a72" }: Props) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<StoryAsset | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const pending = tryUnlockPendingAssets();
    if (pending.length > 0) {
      setNewlyUnlocked(pending);
      window.dispatchEvent(new CustomEvent("vp-dust-change"));
    }
    setUnlocked(getUnlockedAssets());
    setDates(getAssetRecoveryDates());
  }, [isOpen]);

  const selectedDate = selected ? dates[selected.id] : undefined;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6"
        style={{ backgroundColor: "rgba(12, 10, 8, 0.96)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-sm flex flex-col border-2"
          style={{
            borderColor: "#3a3530",
            backgroundColor: "#0c0a08",
            boxShadow: "0 0 40px rgba(12,10,8,0.8), inset 0 0 60px rgba(12,10,8,0.4)",
          }}
        >
          {/* Header — Soviet-American directive style */}
          <div
            className="p-3 md:p-4 border-b flex items-center justify-between"
            style={{ borderColor: "#3a3530", backgroundColor: "#1a1814" }}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 opacity-60">
                <span className="text-[10px] font-mono tracking-[0.2em]" style={{ color: "#8b0000" }}>
                  ПРОЕКТ ИСЧЕЗАЮЩИЕ ТОЧКИ
                </span>
              </div>
              <h2 className="text-xs md:text-sm font-mono uppercase tracking-[0.25em]" style={{ color: themeColor }}>
                Project Vanishing Point — Evidence Archive
              </h2>
              <p className="text-[10px] font-mono opacity-40" style={{ color: themeColor }}>
                Joint Directive 1946–1989 • {unlocked.length} / {STORY_ASSETS.length} files declassified
              </p>
            </div>
            <button
              onClick={onClose}
              className="opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: themeColor }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Newly unlocked banner */}
          <AnimatePresence>
            {newlyUnlocked.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-2 border-b text-center"
                style={{ borderColor: "rgba(122,107,82,0.2)", backgroundColor: "rgba(90,78,66,0.15)" }}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#9a8a72" }}>
                  Conditions met — {newlyUnlocked.length} file{newlyUnlocked.length > 1 ? "s" : ""} declassified
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {selected ? (
              <CaseFileDetail
                asset={selected}
                dateRecovered={selectedDate}
                themeColor={themeColor}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {STORY_ASSETS.map((asset) => {
                  const isUnlocked = unlocked.includes(asset.id);
                  const date = dates[asset.id];
                  return (
                    <button
                      key={asset.id}
                      onClick={() => isUnlocked && setSelected(asset)}
                      className="group relative aspect-[3/4] flex flex-col transition-all duration-300"
                    >
                      {isUnlocked ? (
                        <UnlockedPolaroid asset={asset} date={date} themeColor={themeColor} />
                      ) : (
                        <LockedFolder asset={asset} themeColor={themeColor} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── LOCKED FOLDER ─── */
function LockedFolder({ asset, themeColor }: { asset: StoryAsset; themeColor: string }) {
  return (
    <div
      className="w-full h-full rounded-sm flex flex-col items-center justify-center p-3 relative overflow-hidden"
      style={{
        backgroundColor: "#c9b896",
        boxShadow: "2px 2px 8px rgba(26,20,12,0.5), inset 0 0 20px rgba(26,20,12,0.05)",
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(26,20,12,0.03) 2px, rgba(26,20,12,0.03) 4px)",
        }}
      />

      {/* Classified stamp */}
      <div
        className="absolute top-2 right-2 border-2 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rotate-12 opacity-80"
        style={{ fontFamily: "monospace", borderColor: "#8b0000", color: "#8b0000" }}
      >
        CLASSIFIED
      </div>

      <FileText size={28} className="mb-2 opacity-30" style={{ color: "#3a3020" }} />
      <div className="w-full space-y-1.5">
        <div className="h-2 bg-black/80 w-full" />
        <div className="h-2 bg-black/80 w-3/4" />
        <div className="h-2 bg-black/60 w-1/2" />
      </div>
      <p
        className="absolute bottom-2 left-2 right-2 text-[10px] font-mono uppercase text-center leading-tight"
        style={{ color: "#5a4a3a" }}
      >
        {asset.category} • {asset.rarity}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "rgba(139,0,0,0.3)" }} />
    </div>
  );
}

/* ─── UNLOCKED POLAROID ─── */
function UnlockedPolaroid({ asset, date, themeColor }: { asset: StoryAsset; date?: string; themeColor: string }) {
  return (
    <div
      className="w-full h-full rounded-sm flex flex-col p-2 pb-3 relative overflow-hidden"
      style={{
        backgroundColor: "#e8e0d4",
        boxShadow: "2px 3px 10px rgba(26,20,12,0.4), inset 0 0 15px rgba(26,20,12,0.03)",
      }}
    >
      {/* Tape corners */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rotate-1" style={{ backgroundColor: "rgba(180,160,100,0.5)" }} />
      
      <div className="flex-1 relative overflow-hidden border" style={{ backgroundColor: "rgba(26,20,12,0.05)", borderColor: "rgba(26,20,12,0.1)" }}>
        <img
          src={`/story-assets/${asset.filename}`}
          alt={asset.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          style={{ filter: "sepia(0.2) contrast(1.05)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {/* Recovered stamp */}
        <div
          className="absolute bottom-1 right-1 border px-1 py-0.5 text-[10px] font-black uppercase tracking-wider -rotate-6 opacity-70"
          style={{ borderColor: "#5a4e42", color: "#5a4e42" }}
        >
          RECOVERED
        </div>
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] font-mono uppercase truncate tracking-wider" style={{ color: "#3a3020" }}>{asset.title}</p>
        {date && (
          <p className="text-[10px] font-mono" style={{ color: "#5a4a3a" }}>
            ACQ: {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Rarity dot */}
      <div
        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full border"
        style={{ backgroundColor: RARITY_COLORS[asset.rarity] || "#7a6e5e", borderColor: "rgba(255,255,255,0.5)" }}
      />
    </div>
  );
}

/* ─── CASE FILE DETAIL ─── */
function CaseFileDetail({
  asset,
  dateRecovered,
  themeColor,
  onBack,
}: {
  asset: StoryAsset;
  dateRecovered?: string;
  themeColor: string;
  onBack: () => void;
}) {
  const formattedDate = dateRecovered
    ? new Date(dateRecovered).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "UNKNOWN";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity tracking-wider"
        style={{ color: themeColor }}
      >
        [← Return to Archive]
      </button>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left: Image on manila */}
        <div className="md:w-1/2 flex-shrink-0">
          <div
            className="relative p-3 md:p-4 rounded-sm"
            style={{
              backgroundColor: "#c9b896",
              boxShadow: "4px 4px 15px rgba(26,20,12,0.5)",
            }}
          >
            <div className="border overflow-hidden" style={{ borderColor: "rgba(26,20,12,0.2)", backgroundColor: "rgba(26,20,12,0.05)" }}>
              <img
                src={`/story-assets/${asset.filename}`}
                alt={asset.title}
                className="w-full max-h-[50vh] object-contain"
                style={{ filter: "sepia(0.15) contrast(1.05)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            {/* Stamps */}
            <div
              className="absolute top-4 right-4 border-2 bg-[#c9b896]/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider -rotate-12"
              style={{ borderColor: "#5a4e42", color: "#5a4e42" }}
            >
              DECLASSIFIED 1989
            </div>
            <div
              className="absolute bottom-6 left-4 border bg-[#c9b896]/80 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rotate-6"
              style={{ borderColor: "#8b0000", color: "#8b0000" }}
            >
              {RARITY_STAMPS[asset.rarity] || "UNCLASSIFIED"}
            </div>
          </div>
        </div>

        {/* Right: Case notes */}
        <div className="md:w-1/2 space-y-4">
          {/* Header */}
          <div className="space-y-1 border-b pb-3" style={{ borderColor: `${themeColor}20` }}>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase px-1.5 py-0.5 border"
                style={{ borderColor: RARITY_COLORS[asset.rarity], color: RARITY_COLORS[asset.rarity] }}
              >
                {asset.rarity}
              </span>
              <span className="text-[10px] font-mono uppercase opacity-40" style={{ color: themeColor }}>
                {asset.category}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-mono uppercase tracking-wider" style={{ color: themeColor }}>
              {asset.title}
            </h3>
            <p className="text-[10px] font-mono opacity-50" style={{ color: themeColor }}>
              CASE ID: {asset.id.toUpperCase().replace("_", "-")}
            </p>
          </div>

          {/* Typewritten notes */}
          <div
            className="space-y-3 p-4 rounded-sm text-[11px] md:text-[13px] leading-relaxed"
            style={{
              backgroundColor: "#e8dcc4",
              color: "#1a1a1a",
              fontFamily: "monospace",
              boxShadow: "inset 0 0 20px rgba(26,20,12,0.05)",
            }}
          >
            <div className="border-b pb-2 mb-2" style={{ borderColor: "rgba(26,20,12,0.1)" }}>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Field Report</p>
            </div>
            <p>{asset.description}</p>
            {asset.lore && (
              <div className="border-l-2 pl-3 mt-2" style={{ borderColor: "rgba(139,0,0,0.4)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(139,0,0,0.7)" }}>Analyst Remarks</p>
                <p className="italic opacity-80">{asset.lore}</p>
              </div>
            )}
          </div>

          {/* Metadata grid */}
          <div
            className="grid grid-cols-2 gap-2 p-3 rounded-sm text-[10px] font-mono uppercase tracking-wider"
            style={{ backgroundColor: `${themeColor}08`, border: `1px solid ${themeColor}15` }}
          >
            <div>
              <p className="opacity-40">Acquired</p>
              <p style={{ color: themeColor }}>{formattedDate}</p>
            </div>
            <div>
              <p className="opacity-40">Origin</p>
              <p style={{ color: themeColor }}>Numbers Station</p>
            </div>
            <div>
              <p className="opacity-40">Clearance</p>
              <p style={{ color: RARITY_COLORS[asset.rarity] }}>{RARITY_STAMPS[asset.rarity]}</p>
            </div>
            <div>
              <p className="opacity-40">Status</p>
              <p style={{ color: "#5a4e42" }}>RECOVERED</p>
            </div>
          </div>

          {/* Origin myth footer */}
          <div className="pt-2 border-t" style={{ borderColor: `${themeColor}10` }}>
            <p className="text-[10px] font-mono opacity-30 leading-relaxed" style={{ color: themeColor }}>
              ORIGIN NOTE: Anomalous residue first catalogued at Trinity Site, NM (1945) and
              Semipalatinsk-21 (1949). Joint directive concluded the dust is not fallout.
              It is something that fed on fallout. BUNKER_7 was established to monitor
              secondary contamination zones — the abandoned places where it settled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}