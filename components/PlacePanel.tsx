"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Unlock,
  Flame,
  Skull,
  Wind,
  MapPin,
  ChevronRight,
  Radio,
  Shield,
  AlertTriangle,
  FileText,
  Eye,
} from "lucide-react";
import { Place } from "@/types";
import { getExpedition } from "@/lib/expeditions";
import ExpeditionModal from "./ExpeditionModal";
import { bumpCorruption, spendDust } from "@/hooks/useDustLevel";
import { showToast } from "@/lib/toast";

type Tier = "surface" | "surveyed" | "documented" | "sealed";

function redact(text: string): string {
  return text.replace(/[a-zA-Z0-9]/g, "█");
}

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

/* ─── localStorage helpers ─── */
function getPlaceTier(placeId: string): Tier {
  if (typeof window === "undefined") return "surface";
  const s = localStorage.getItem(`vp-tier-${placeId}`);
  return (s as Tier) || "surface";
}

function setPlaceTier(placeId: string, tier: Tier) {
  localStorage.setItem(`vp-tier-${placeId}`, tier);
}

function hasLantern(placeId: string): boolean {
  if (typeof window === "undefined") return false;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
  return lanterns.some((l: any) => l.placeId === placeId);
}

function getUnlockedReports(placeId: string): number[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(`vp-reports-${placeId}`) || "[]");
}

function isExpeditionComplete(placeId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`vp-expedition-${placeId}`) === "true";
}

function isSealed(placeId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`vp-sealed-${placeId}`) === "true";
}

function getSignalUnlock(placeSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`vp-signal-${placeSlug}`) === "true";
}

function isDossierUnlocked(placeSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`vp-dossier-${placeSlug}`) === "true";
}

function unlockDossier(placeSlug: string) {
  localStorage.setItem(`vp-dossier-${placeSlug}`, "true");
}

/* ─── BUNKER_7 intercepted dossiers ─── */
const SIGNAL_DOSSIERS: Record<string, { title: string; text: string }> = {
  "duga-radar-array": {
    title: "Intercepted: THE HUM",
    text: `BUNKER_7 ANALYSIS — The Woodpecker pulse does not match Soviet OTHR signatures. Frequency drift suggests an internal clock rather than an external detection sweep. The "countdown" theory is unconfirmed, but the arithmetic is disturbing. The array stopped in 1989. The count, if it existed, was interrupted, not concluded.`,
  },
  "hashima-island": {
    title: "Intercepted: THE COUNTING HOUSE",
    text: `BUNKER_7 ANALYSIS — The numbers station broadcasting from Hashima coordinates uses a voice model not developed until 2011. The count is backward. The numbers have not been invented yet because they are counting down to a date, not up from zero. Current estimate: 5,000 days remain.`,
  },
  "aokigahara-forest": {
    title: "Intercepted: LOST EXPEDITION",
    text: `BUNKER_7 ANALYSIS — Expedition Team 4's black box contains 7 hours of audio after the last confirmed human voice. The seventh voice speaks Japanese with a dialect last used in the Edo period. It is giving directions deeper into the forest.`,
  },
  "poveglia-island": {
    title: "Intercepted: STATIC VEIL",
    text: `BUNKER_7 ANALYSIS — The static between stations is not empty. Spectral analysis reveals ordered data in the 19 Hz range — the frequency of human eyeball resonance. The static is not noise. It is trying to be seen.`,
  },
};

/* ─── Component ─── */
interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  const [tier, setTier] = useState<Tier>("surface");
  const [expeditionOpen, setExpeditionOpen] = useState(false);
  const expedition = useMemo(() => getExpedition(place), [place]);

  /* Initialise tier from localStorage */
  useEffect(() => {
    setTier(getPlaceTier(place._id));
  }, [place._id]);

  /* Auto-promote when conditions are met */
  useEffect(() => {
    let current = getPlaceTier(place._id);

    if (current === "surface" && hasLantern(place._id)) {
      current = "surveyed";
      setPlaceTier(place._id, current);
    }
    if (current === "surveyed" && isExpeditionComplete(place._id)) {
      current = "documented";
      setPlaceTier(place._id, current);
    }
    if (current === "documented" && isSealed(place._id)) {
      current = "sealed";
      setPlaceTier(place._id, current);
    }
    setTier(current);
  }, [place._id, expeditionOpen]);

  const handleExpeditionComplete = (result: {
    dust: number;
    items: string[];
    reportsUnlocked: number[];
    corruptionTriggered: boolean;
  }) => {
    localStorage.setItem(`vp-expedition-${place._id}`, "true");

    if (result.corruptionTriggered) {
      bumpCorruption(1);
    }

    const existing = getUnlockedReports(place._id);
    const merged = Array.from(new Set([...existing, ...result.reportsUnlocked]));
    localStorage.setItem(`vp-reports-${place._id}`, JSON.stringify(merged));

    const currentDust = parseInt(
      localStorage.getItem("vp-dust-accumulation") || "0",
      10
    );
    localStorage.setItem(
      "vp-dust-accumulation",
      String(Math.min(100, currentDust + result.dust))
    );

    const invKey = "vp-inventory";
    const inv = JSON.parse(localStorage.getItem(invKey) || "[]");
    result.items.forEach((item) => {
      if (!inv.includes(item)) inv.push(item);
    });
    localStorage.setItem(invKey, JSON.stringify(inv));

    setPlaceTier(place._id, "documented");
    setTier("documented");
  };

  const handleSeal = () => {
    localStorage.setItem(`vp-sealed-${place._id}`, "true");
    setPlaceTier(place._id, "sealed");
    setTier("sealed");

    /* Sealing cleanses dust slightly */
    const currentDust = parseInt(
      localStorage.getItem("vp-dust-accumulation") || "0",
      10
    );
    localStorage.setItem(
      "vp-dust-accumulation",
      String(Math.max(0, currentDust - 5))
    );
  };

  const summary =
    place.history.split(". ").slice(0, 2).join(". ") + ".";

  const unlockedReports = getUnlockedReports(place._id);
  const signalDossier = SIGNAL_DOSSIERS[place.slug];
  const hasSignalDossier = signalDossier && getSignalUnlock(place.slug);

  /* ─── Render ─── */
  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[28rem] bg-[#0c0a08] border-l border-[#9a8a72]/20 shadow-2xl flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-full flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header Image */}
        <div className="relative h-40 md:h-48 flex-shrink-0">
          <img
            src={place.photos[0]}
            alt={place.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-cinzel text-lg md:text-xl text-[#ddd0bc] leading-tight">
              {place.name}
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72] mt-1">
              {place.address.city}, {place.address.country}
            </p>
          </div>
        </div>

        {/* Tier Bar */}
        <div className="px-4 py-2 border-b border-[#9a8a72]/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["surface", "surveyed", "documented", "sealed"] as Tier[]).map(
            (t, i) => {
              const active = tier === t;
              const unlocked =
                t === "surface" ||
                (t === "surveyed" && tier !== "surface") ||
                (t === "documented" &&
                  (tier === "documented" || tier === "sealed")) ||
                (t === "sealed" && tier === "sealed");

              return (
                <div key={t} className="flex items-center gap-2 shrink-0">
                  {i > 0 && (
                    <ChevronRight
                      size={10}
                      className="text-[#9a8a72]/30 shrink-0"
                    />
                  )}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                      active
                        ? "bg-[#9a8a72]/15 border-[#9a8a72]/40 text-[#ddd0bc]"
                        : unlocked
                        ? "border-[#9a8a72]/20 text-[#9a8a72]/60"
                        : "border-white/5 text-white/20"
                    }`}
                  >
                    {unlocked ? (
                      active ? (
                        <Eye size={10} />
                      ) : (
                        <Unlock size={10} />
                      )
                    ) : (
                      <Lock size={10} />
                    )}
                    {t}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* ── Surface tier ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={12} className="text-[#9a8a72]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                Surface Scan
              </span>
            </div>
            <p className="text-sm text-[#b8a99a] leading-relaxed font-light">
              {summary}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-[#9a8a72]/20 text-[#9a8a72]/70">
                {place.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-red-900/30 text-red-400/70 flex items-center gap-1">
                <AlertTriangle size={9} />
                Danger {place.dangerLevel}/5
              </span>
              {place.coordinates && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-white/5 text-white/30">
                  {place.coordinates[0].toFixed(4)},{" "}
                  {place.coordinates[1].toFixed(4)}
                </span>
              )}
            </div>
          </section>

          {/* ── Surveyed tier ── */}
          <AnimatePresence>
            {(tier === "surveyed" ||
              tier === "documented" ||
              tier === "sealed") && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={12} className="text-[#9a8a72]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                    Surveyed Depth
                  </span>
                </div>
                <p className="text-sm text-[#b8a99a]/80 leading-relaxed font-light">
                  {place.history}
                </p>

                {/* Haunting reports preview (locked) */}
                {place.hauntingReports && place.hauntingReports.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skull size={12} className="text-red-400/60" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-red-400/60">
                        Haunting Reports ({place.hauntingReports.length})
                      </span>
                    </div>
                    {place.hauntingReports.map((report, idx) => {
                      const isUnlocked = unlockedReports.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded border text-xs leading-relaxed ${
                            isUnlocked
                              ? "border-[#9a8a72]/20 bg-[#9a8a72]/5 text-[#b8a99a]"
                              : "border-white/5 bg-white/[0.02] text-white/20"
                          }`}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="text-[9px] font-mono text-[#9a8a72]/50 block mb-1">
                                REPORT #{String(idx + 1).padStart(2, "0")}
                              </span>
                              {report}
                            </>
                          ) : (
                            <span className="font-mono">
                              {redact(report)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 🔧 FIX: Expedition button moved to SURVEYED tier */}
                {expedition && tier !== "documented" && tier !== "sealed" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!spendDust(10)) {
                        showToast(`Insufficient dust. Need 10% (you have ${getDust()}%). Visit more places.`, "warning");
                        return;
                      }
                      setExpeditionOpen(true);
                    }}
                    className="w-full mt-4 py-3 px-4 rounded border border-[#9a8a72]/30 bg-[#9a8a72]/10 text-[#ddd0bc] text-xs font-mono uppercase tracking-wider hover:bg-[#9a8a72]/20 hover:border-[#9a8a72]/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Flame size={14} />
                    Begin Expedition (-10 dust)
                  </motion.button>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Documented tier ── */}
          <AnimatePresence>
            {(tier === "documented" || tier === "sealed") && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <FileText size={12} className="text-[#9a8a72]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a8a72]">
                    Documented Evidence
                  </span>
                </div>

                {/* Signal dossier (unlocked via SignalTab decode) */}
                {hasSignalDossier && signalDossier && isDossierUnlocked(place.slug) && (
                  <div className="p-3 rounded border border-amber-900/30 bg-amber-950/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio size={12} className="text-amber-500/70" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                        {signalDossier.title}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/60 leading-relaxed font-mono">
                      {signalDossier.text}
                    </p>
                  </div>
                )}

                {/* Signal decoded but dossier not yet purchased */}
                {hasSignalDossier && signalDossier && !isDossierUnlocked(place.slug) && (
                  <div className="p-3 rounded border border-amber-900/20 bg-amber-950/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={12} className="text-amber-500/40" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500/40">
                        {signalDossier.title}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/30 leading-relaxed font-mono mb-3">
                      {redact(signalDossier.text.slice(0, 60))}...
                    </p>
                    <button
                      onClick={() => {
                        if (spendDust(20)) {
                          unlockDossier(place.slug);
                          // Force re-render
                          setTier(getPlaceTier(place._id));
                        } else {
                          showToast(`Insufficient dust. Need 20% (you have ${getDust()}%).`, "warning");
                        }
                      }}
                      className="w-full py-2 rounded border border-amber-700/30 bg-amber-900/10 text-[10px] font-mono uppercase tracking-wider text-amber-400/70 hover:bg-amber-900/20 hover:border-amber-600/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <Unlock size={12} />
                      Decrypt Dossier (-20 dust)
                    </button>
                  </div>
                )}

                {/* If signal dossier exists but signal not yet decoded */}
                {signalDossier && !hasSignalDossier && (
                  <div className="p-3 rounded border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={12} className="text-white/20" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                        Encrypted Dossier
                      </span>
                    </div>
                    <p className="text-xs text-white/10 font-mono">
                      {redact(
                        "Awaiting signal authentication. Tune to the frequency associated with this location."
                      )}
                    </p>
                  </div>
                )}

                {/* Seal button */}
                {tier !== "sealed" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSeal}
                    className="w-full py-3 px-4 rounded border border-emerald-900/30 bg-emerald-950/10 text-emerald-200/70 text-xs font-mono uppercase tracking-wider hover:bg-emerald-950/20 hover:border-emerald-800/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield size={14} />
                    Seal Record (-5 Dust)
                  </motion.button>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Sealed tier ── */}
          <AnimatePresence>
            {tier === "sealed" && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded border border-emerald-900/20 bg-emerald-950/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-emerald-500/60" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500/60">
                    Record Sealed
                  </span>
                </div>
                <p className="text-xs text-emerald-200/40 leading-relaxed">
                  This location has been sealed by BUNKER_7 protocol. All anomalous
                  activity has been contained and the file is closed. Dust levels
                  recalibrated.
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Expedition Modal */}
      {expedition && (
        <ExpeditionModal
          isOpen={expeditionOpen}
          onClose={() => setExpeditionOpen(false)}
          place={place}
          expedition={expedition}
          onComplete={handleExpeditionComplete}
        />
      )}
    </>
  );
}