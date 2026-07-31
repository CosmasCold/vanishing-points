"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Flame, Skull, Wind, MapPin, ChevronRight, Radio } from "lucide-react";
import { Place } from "@/types";
import { getExpedition } from "@/lib/expeditions";
import ExpeditionModal from "./ExpeditionModal";

type Tier = "surface" | "surveyed" | "documented" | "sealed";

function redact(text: string): string {
  return text.replace(/[a-zA-Z0-9]/g, "█");
}

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

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  const [tier, setTier] = useState<Tier>("surface");
  const [expeditionOpen, setExpeditionOpen] = useState(false);
  const [showAddendum, setShowAddendum] = useState(false);
  const expedition = useMemo(() => getExpedition(place.slug), [place.slug]);

  useEffect(() => {
    setTier(getPlaceTier(place._id));
  }, [place._id]);

  // Auto-promote if conditions met
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
    // Save expedition completion
    localStorage.setItem(`vp-expedition-${place._id}`, "true");

    // Save reports
    const existing = getUnlockedReports(place._id);
    const merged = Array.from(new Set([...existing, ...result.reportsUnlocked]));
    localStorage.setItem(`vp-reports-${place._id}`, JSON.stringify(merged));

    // Accumulate dust
    const currentDust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    localStorage.setItem("vp-dust-accumulation", String(Math.min(100, currentDust + result.dust)));

    // Save items
    const invKey = "vp-inventory";
    const inv = JSON.parse(localStorage.getItem(invKey) || "[]");
    result.items.forEach((item) => {
      if (!inv.includes(item)) inv.push(item);
    });
    localStorage.setItem(invKey, JSON.stringify(inv));

    // Bump tier
    setPlaceTier(place._id, "documented");
    setTier("documented");
  };

  const handleSeal = () => {
    localStorage.setItem(`vp-sealed-${place._id}`, "true");
    setPlaceTier(place._id, "sealed");
    setTier("sealed");
  };

  const summary =
    place.history.split(". ").slice(0, 2).join(". ") + ".";

  const unlockedReports = getUnlockedReports(place._id);

  return (
    <>
      <div className="drawer-shell open">
        {/* Drag handle for mobile */}
        <div className="md:hidden w-full flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="h-full flex flex-col">
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
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95"
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
                  <div
                    key={t}
                    className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded border ${
                      active
                        ? "border-[#9a8a72]/40 text-[#c9b18a] bg-[#1a1612]"
                        : unlocked
                        ? "border-[#9a8a72]/15 text-[#5a4e42]"
                        : "border-[#333] text-[#333]"
                    }`}
                  >
                    {unlocked ? <Unlock size={10} /> : <Lock size={10} />}
                    {t}
                  </div>
                );
              }
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
            {/* Surface Tier */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a4e42] mb-2">
                Surface Data
              </p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#9a8a72] mb-3">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {place.coordinates[1].toFixed(4)}, {place.coordinates[0].toFixed(4)}
                </span>
                <span className="w-px h-3 bg-[#9a8a72]/20" />
                <span className="uppercase">{place.category}</span>
                {place.yearAbandoned && (
                  <>
                    <span className="w-px h-3 bg-[#9a8a72]/20" />
                    <span>Abandoned {place.yearAbandoned}</span>
                  </>
                )}
              </div>
              <p className="text-xs md:text-sm text-[#b8a898] leading-relaxed">
                {tier === "surface" ? summary : place.history}
              </p>
            </div>

            {/* Surveyed Tier */}
            <div className="border-t border-[#9a8a72]/10 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a4e42]">
                  Survey Data
                </p>
                {tier === "surface" && (
                  <span className="text-[9px] font-mono text-[#5a4e42]">
                    <Lock size={9} className="inline mr-1" />
                    Place lantern to unlock
                  </span>
                )}
              </div>

              {tier !== "surface" ? (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-[9px] font-mono uppercase text-[#5a4e42] mb-1">
                        Danger Level
                      </p>
                      <div className="h-1.5 bg-[#1a1612] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#9a8a72]"
                          style={{ width: `${(place.dangerLevel / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-mono text-[#7a6e5e] mt-1">
                        {place.dangerLevel}/5 —{" "}
                        {place.dangerLevel >= 4
                          ? "Extreme"
                          : place.dangerLevel >= 3
                          ? "Elevated"
                          : "Moderate"}
                      </p>
                    </div>
                  </div>
                  {place.photos[1] && (
                    <img
                      src={place.photos[1]}
                      alt="Survey photo"
                      className="w-full h-32 object-cover rounded border border-[#9a8a72]/10 opacity-80"
                    />
                  )}
                </>
              ) : (
                <div className="p-3 bg-[#0c0a08] rounded border border-[#9a8a72]/10">
                  <p className="text-xs font-mono text-[#5a4e42] leading-relaxed">
                    {redact(
                      "The full survey requires ground truth. Place a lantern at these coordinates to establish a permanent observation point."
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Documented Tier */}
            <div className="border-t border-[#9a8a72]/10 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a4e42]">
                  Field Notes
                </p>
                {tier === "surveyed" && (
                  <span className="text-[9px] font-mono text-[#5a4e42]">
                    <Lock size={9} className="inline mr-1" />
                    Complete expedition
                  </span>
                )}
              </div>

              {tier === "documented" || tier === "sealed" ? (
                <div className="space-y-3">
                  {place.hauntingReports && place.hauntingReports.length > 0 ? (
                    place.hauntingReports.map((report, i) => {
                      const unlocked = unlockedReports.includes(i);
                      return (
                        <div
                          key={i}
                          className="border-l-2 border-[#9a8a72]/20 pl-3 py-1"
                        >
                          <p className="text-[9px] font-mono uppercase text-[#5a4e42] mb-1">
                            Report {String(i + 1).padStart(2, "0")}
                            {!unlocked && " — [UNCONFIRMED]"}
                          </p>
                          <p className="text-xs text-[#b8a898] leading-relaxed">
                            {unlocked ? report : redact(report)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[#5a4e42] italic">
                      No spectral phenomena documented. Environmental hazards only.
                    </p>
                  )}

                  {expedition && (
                    <div className="pt-2">
                      <button
                        onClick={() => setExpeditionOpen(true)}
                        className="w-full flex items-center justify-between p-3 bg-[#1a1612] border border-[#9a8a72]/20 rounded-lg text-left hover:border-[#9a8a72]/40 transition-all active:scale-[0.99]"
                      >
                        <div>
                          <p className="text-xs font-mono text-[#c9b18a]">
                            Begin Expedition
                          </p>
                          <p className="text-[9px] text-[#5a4e42] mt-0.5">
                            {expedition.phases.length} phases // Danger {place.dangerLevel}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-[#5a4e42]" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#0c0a08] rounded border border-[#9a8a72]/10">
                  <p className="text-xs font-mono text-[#5a4e42] leading-relaxed">
                    {redact(
                      "Field expeditions are required to confirm anomalous reports. Equipment check: radiation badge, audio recorder, secondary light source."
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Sealed Tier */}
            <div className="border-t border-[#9a8a72]/10 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a4e42]">
                  Archivist's Addendum
                </p>
                {tier === "documented" && (
                  <span className="text-[9px] font-mono text-[#5a4e42]">
                    <Lock size={9} className="inline mr-1" />
                    Solve to seal
                  </span>
                )}
              </div>

              {tier === "sealed" ? (
                <div className="p-3 bg-[#0c0a08] rounded border border-[#9a8a72]/20">
                  <p className="text-xs text-[#c9b18a] leading-relaxed italic">
                    "I have been inside {place.name}. I have seen what the dust
                    remembers. The place is not abandoned — it is waiting for a
                    specific frequency, a specific soul, a specific silence. I
                    have left my lantern. I will not return. The door opens
                    inward."
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-1 bg-[#1a1612] border border-[#9a8a72]/20 rounded text-[9px] font-mono uppercase text-[#5a4e42]">
                      Sealed by you
                    </span>
                    <span className="px-2 py-1 bg-[#1a1612] border border-[#9a8a72]/20 rounded text-[9px] font-mono uppercase text-[#5a4e42]">
                      Badge earned
                    </span>
                  </div>
                </div>
              ) : tier === "documented" ? (
                <button
                  onClick={handleSeal}
                  className="w-full p-3 bg-[#1a1612] border border-[#9a8a72]/20 rounded-lg text-left hover:border-[#9a8a72]/40 transition-all active:scale-[0.99]"
                >
                  <p className="text-xs font-mono text-[#c9b18a]">
                    Seal this place
                  </p>
                  <p className="text-[9px] text-[#5a4e42] mt-0.5">
                    No further expeditions. Permanent archive entry.
                  </p>
                </button>
              ) : (
                <div className="p-3 bg-[#0c0a08] rounded border border-[#9a8a72]/10">
                  <p className="text-xs font-mono text-[#5a4e42] leading-relaxed">
                    {redact(
                      "The final truth is reserved for those who document the anomaly and choose to close the file. Not all archivists have the resolve."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expedition Modal */}
      {expedition && (
        <ExpeditionModal
          place={place}
          expedition={expedition}
          isOpen={expeditionOpen}
          onClose={() => setExpeditionOpen(false)}
          onComplete={handleExpeditionComplete}
        />
      )}
    </>
  );
}