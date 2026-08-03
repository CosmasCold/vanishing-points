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
import { spendDust } from "@/hooks/useDustLevel";
import { showToast } from "@/lib/toast";

type Tier = "surface" | "surveyed" | "documented" | "sealed";

function redact(text: string): string {
  return text.replace(/[a-zA-Z0-9]/g, "█");
}

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

function notifyDustChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vp-dust-change"));
  }
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

function hasLantern(placeId: string, placeName: string): boolean {
  if (typeof window === "undefined") return false;
  const lanterns = JSON.parse(localStorage.getItem("vp-lanterns") || "[]");
  return lanterns.some(
    (l: any) => l.placeId === placeId || l.placeName === placeName
  );
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

    if (current === "surface" && hasLantern(place._id, place.name)) {
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
  }, [place._id, expeditionOpen, place.name]);

  /* Auto-unlock dossier on open if signal decoded — matches full page behavior */
  useEffect(() => {
    if (getSignalUnlock(place.slug) && SIGNAL_DOSSIERS[place.slug] && !isDossierUnlocked(place.slug)) {
      unlockDossier(place.slug);
    }
  }, [place.slug]);

  const handleExpeditionComplete = (result: {
    dust: number;
    items: string[];
    reportsUnlocked: number[];
  }) => {
    localStorage.setItem(`vp-expedition-${place._id}`, "true");

    const existing = getUnlockedReports(place._id);
    const merged = Array.from(new Set([...existing, ...result.reportsUnlocked]));
    localStorage.setItem(`vp-reports-${place._id}`, JSON.stringify(merged));

    const currentDust = getDust();
    const nextDust = Math.min(100, currentDust + result.dust);
    localStorage.setItem("vp-dust-accumulation", String(nextDust));
    notifyDustChange();

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
    const currentDust = getDust();
    const nextDust = Math.max(0, currentDust - 5);
    localStorage.setItem("vp-dust-accumulation", String(nextDust));
    notifyDustChange();
  };

  const summary =
    place.history?.split(". ").slice(0, 2).join(". ") + "." || "No summary available.";

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
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[28rem] flex flex-col border-l"
        style={{
          background: "#0c0a08",
          borderColor: "rgba(154,138,114,0.15)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-full flex justify-center pt-2 pb-1">
          <div
            className="w-8 h-1 rounded-full"
            style={{ background: "rgba(221,208,188,0.15)" }}
          />
        </div>

        {/* Header Image */}
        <div className="relative h-40 md:h-48 flex-shrink-0">
          {place.photos?.[0] ? (
            <img
              src={place.photos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              style={{ opacity: 0.8 }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "rgba(20,16,12,0.8)" }}
            >
              <span className="font-mono text-xs" style={{ color: "#9a8a72" }}>
                No visual record
              </span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #0c0a08, rgba(12,10,8,0.4), transparent)",
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 border"
            style={{
              background: "rgba(12,10,8,0.5)",
              borderColor: "rgba(221,208,188,0.08)",
              color: "rgba(221,208,188,0.6)",
            }}
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2
              className="font-cinzel text-lg md:text-xl leading-tight"
              style={{ color: "#ddd0bc" }}
            >
              {place.name}
            </h2>
            <p
              className="text-[10px] font-mono uppercase tracking-wider mt-1"
              style={{ color: "#9a8a72" }}
            >
              {place.address.city}, {place.address.country}
            </p>
          </div>
        </div>

        {/* Tier Bar */}
        <div
          className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b"
          style={{ borderColor: "rgba(154,138,114,0.08)" }}
        >
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
                      className="shrink-0"
                      style={{ color: "rgba(154,138,114,0.2)" }}
                    />
                  )}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors"
                    style={{
                      borderColor: active
                        ? "rgba(154,138,114,0.3)"
                        : unlocked
                        ? "rgba(154,138,114,0.12)"
                        : "rgba(221,208,188,0.04)",
                      color: active
                        ? "#ddd0bc"
                        : unlocked
                        ? "rgba(154,138,114,0.5)"
                        : "rgba(221,208,188,0.12)",
                      background: active
                        ? "rgba(154,138,114,0.08)"
                        : "transparent",
                    }}
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
              <MapPin size={12} style={{ color: "#9a8a72" }} />
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "#9a8a72" }}
              >
                Surface Scan
              </span>
            </div>
            <p
              className="text-sm leading-relaxed font-light"
              style={{ color: "#b8a99a" }}
            >
              {summary}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono border"
                style={{
                  borderColor: "rgba(154,138,114,0.15)",
                  color: "rgba(154,138,114,0.5)",
                }}
              >
                {place.category}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1"
                style={{
                  borderColor: "rgba(196,120,90,0.15)",
                  color: "rgba(196,120,90,0.5)",
                }}
              >
                <AlertTriangle size={9} />
                Danger {place.dangerLevel}/5
              </span>
              {place.coordinates && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono border"
                  style={{
                    borderColor: "rgba(221,208,188,0.06)",
                    color: "rgba(221,208,188,0.15)",
                  }}
                >
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
                  <Wind size={12} style={{ color: "#9a8a72" }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: "#9a8a72" }}
                  >
                    Surveyed Depth
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed font-light"
                  style={{ color: "rgba(184,169,154,0.8)" }}
                >
                  {place.history}
                </p>

                {/* Haunting reports preview (locked) */}
                {place.hauntingReports && place.hauntingReports.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skull size={12} style={{ color: "rgba(196,120,90,0.4)" }} />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: "rgba(196,120,90,0.4)" }}
                      >
                        Haunting Reports ({place.hauntingReports.length})
                      </span>
                    </div>
                    {place.hauntingReports.map((report, idx) => {
                      const isUnlocked = unlockedReports.includes(idx);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded border text-xs leading-relaxed"
                          style={{
                            borderColor: isUnlocked
                              ? "rgba(154,138,114,0.12)"
                              : "rgba(221,208,188,0.04)",
                            background: isUnlocked
                              ? "rgba(154,138,114,0.03)"
                              : "rgba(221,208,188,0.01)",
                            color: isUnlocked ? "#b8a99a" : "rgba(221,208,188,0.1)",
                          }}
                        >
                          {isUnlocked ? (
                            <>
                              <span
                                className="text-[10px] font-mono block mb-1"
                                style={{ color: "rgba(154,138,114,0.3)" }}
                              >
                                REPORT #{String(idx + 1).padStart(2, "0")}
                              </span>
                              {report}
                            </>
                          ) : (
                            <span className="font-mono">{redact(report)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expedition button */}
                {expedition && tier !== "documented" && tier !== "sealed" && (
                  <button
                    onClick={() => {
                      const currentDust = getDust();
                      if (currentDust < 10) {
                        showToast(
                          `Insufficient dust. The expedition requires 10% contamination. You carry ${currentDust}%.`,
                          "warning"
                        );
                        return;
                      }
                      spendDust(10);
                      notifyDustChange();
                      setExpeditionOpen(true);
                    }}
                    className="w-full mt-4 py-3 px-4 rounded border text-xs font-mono uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      color: "#ddd0bc",
                      borderColor: "rgba(154,138,114,0.2)",
                      background: "rgba(154,138,114,0.06)",
                    }}
                  >
                    <Flame size={14} />
                    Begin Expedition
                  </button>
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
                  <FileText size={12} style={{ color: "#9a8a72" }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: "#9a8a72" }}
                  >
                    Documented Evidence
                  </span>
                </div>

                {/* Signal dossier (auto-unlocked on mount if signal decoded) */}
                {hasSignalDossier && signalDossier && isDossierUnlocked(place.slug) && (
                  <div
                    className="p-3 rounded border"
                    style={{
                      borderColor: "rgba(196,120,90,0.12)",
                      background: "rgba(196,120,90,0.03)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Radio size={12} style={{ color: "rgba(196,120,90,0.5)" }} />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: "rgba(196,120,90,0.5)" }}
                      >
                        {signalDossier.title}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed font-mono"
                      style={{ color: "rgba(221,208,188,0.5)" }}
                    >
                      {signalDossier.text}
                    </p>
                  </div>
                )}

                {/* Signal not yet decoded */}
                {signalDossier && !hasSignalDossier && (
                  <div
                    className="p-3 rounded border"
                    style={{
                      borderColor: "rgba(221,208,188,0.04)",
                      background: "rgba(221,208,188,0.01)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={12} style={{ color: "rgba(221,208,188,0.1)" }} />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: "rgba(221,208,188,0.1)" }}
                      >
                        Encrypted Dossier
                      </span>
                    </div>
                    <p
                      className="text-xs font-mono"
                      style={{ color: "rgba(221,208,188,0.06)" }}
                    >
                      {redact(
                        "Awaiting signal authentication. Tune to the frequency associated with this location."
                      )}
                    </p>
                  </div>
                )}

                {/* Seal button */}
                {tier !== "sealed" && (
                  <button
                    onClick={handleSeal}
                    className="w-full py-3 px-4 rounded border text-xs font-mono uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      color: "rgba(122,154,106,0.7)",
                      borderColor: "rgba(122,154,106,0.15)",
                      background: "rgba(122,154,106,0.04)",
                    }}
                  >
                    <Shield size={14} />
                    Seal Record
                  </button>
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
                className="p-4 rounded border"
                style={{
                  borderColor: "rgba(122,154,106,0.1)",
                  background: "rgba(122,154,106,0.02)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: "rgba(122,154,106,0.4)" }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: "rgba(122,154,106,0.4)" }}
                  >
                    Record Sealed
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(122,154,106,0.25)" }}
                >
                  This location has been sealed by BUNKER_7 protocol. All anomalous
                  activity has been contained. The archive considers this file closed.
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