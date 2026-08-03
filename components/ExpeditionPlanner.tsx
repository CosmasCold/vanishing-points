"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Route,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  MapPin,
  Download,
  Globe,
  Shield,
  Lock,
  Unlock,
  Radio,
  Skull,
  Eye,
  Wind,
} from "lucide-react";
import { Place } from "@/types";
import { showToast } from "@/lib/toast";

interface Props {
  places: Place[];
  onClose: () => void;
  onFlyTo: (coords: [number, number]) => void;
}

function haversine([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatCoord(n: number, isLat: boolean) {
  const dir = isLat ? (n >= 0 ? "N" : "S") : n >= 0 ? "E" : "W";
  const abs = Math.abs(n);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

function dangerAdvice(level: number): string {
  if (level >= 5) return "The archivist's final note on this site: 'The walls remember. Do not enter alone. The dust will not let you leave the same.'";
  if (level === 4) return "Previous witness reported the floor breathing. Bring rope. Mark your path. The architecture shifts when unobserved.";
  if (level === 3) return "Weathered but navigable. The previous surveyor left a salt line at the threshold. Respect it.";
  if (level === 2) return "Public access possible, though the silence is unusual. Standard field gear sufficient.";
  return "Minimal structural concern. The archive considers this site stable. Document thoroughly.";
}

function packingList(levels: number[]): string[] {
  const max = Math.max(...levels, 1);
  const base = ["Field notebook (waterproofed)", "Camera with low-light lens", "Sturdy boots, broken in", "Amber bottle for samples"];
  if (max >= 2) base.push("Lantern with spare wick", "Dust mask, cloth-lined");
  if (max >= 3) base.push("Iron key (universal skeleton)", "Salt line, 30 meters", "Signal mirror", "Emergency whistle, bone");
  if (max >= 4) base.push("Heavy gloves, leather", "Geiger charm (the archivist's)", "Rope, 50m, hemp", "Chalk for marking thresholds");
  if (max >= 5) base.push("Local guide's name (ask at the terminal)", "Contingency route, memorized", "Letter to someone who will look for you");
  return base;
}

/* ─── localStorage helpers ─── */
function getPlaceTier(placeId: string): string {
  if (typeof window === "undefined") return "surface";
  return localStorage.getItem(`vp-tier-${placeId}`) || "surface";
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

function getDust(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
}

/* ─── Tier icon component ─── */
function TierBadge({ placeId }: { placeId: string }) {
  const tier = getPlaceTier(placeId);
  const sealed = isSealed(placeId);
  const complete = isExpeditionComplete(placeId);

  if (sealed) {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: "#7a9a6a" }}>
        <Shield size={10} /> SEALED
      </span>
    );
  }
  if (tier === "documented" || complete) {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono text-[#9a8a72]/80">
        <Eye size={10} /> DOCUMENTED
      </span>
    );
  }
  if (tier === "surveyed") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono text-[#9a8a72]/60">
        <Wind size={10} /> SURVEYED
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[9px] font-mono text-white/20">
      <MapPin size={10} /> SURFACE
    </span>
  );
}

/* ─── Danger gate check ─── */
function canAccess(place: Place, dust: number): { ok: boolean; reason?: string; forceable?: boolean } {
  if (place.dangerLevel <= 3) return { ok: true };
  if (getSignalUnlock(place.slug)) return { ok: true };
  if (dust >= 30) return { ok: true };
  return {
    ok: false,
    reason: `Danger ${place.dangerLevel}/5. The archive resists this route. Signal decode or dust ≥30% required. You carry ${dust}%.`,
    forceable: true,
  };
}

export default function ExpeditionPlanner({ places, onClose, onFlyTo }: Props) {
  const [selected, setSelected] = useState<Place[]>([]);
  const [dust, setDust] = useState(0);

  useEffect(() => {
    setDust(getDust());
  }, []);

  const toggle = (place: Place) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p._id === place._id);
      if (exists) return prev.filter((p) => p._id !== place._id);
      if (prev.length >= 8) {
        showToast("The archivist never recorded more than 8 waypoints in a single sortie.", "warning");
        return prev;
      }
      const gate = canAccess(place, dust);
      if (!gate.ok) {
        showToast(gate.reason || "The archive resists this route.", "warning");
        return prev;
      }
      return [...prev, place];
    });
  };

  const legs = selected.map((place, i) => {
    if (i === 0) return { place, distance: 0 };
    return {
      place,
      distance: haversine(selected[i - 1].coordinates, place.coordinates),
    };
  });

  const totalDistance = legs.reduce((s, l) => s + l.distance, 0);
  const avgDanger = selected.length
    ? (selected.reduce((s, p) => s + p.dangerLevel, 0) / selected.length).toFixed(1)
    : "0";
  const maxDanger = selected.length ? Math.max(...selected.map((p) => p.dangerLevel)) : 0;
  const countries = Array.from(new Set(selected.map((p) => p.address.country)));
  const highDangerCount = selected.filter((p) => p.dangerLevel >= 4).length;
  const refNum = `VPX-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const exportItinerary = () => {
    showToast("Expedition briefing compiled. Check your downloads.", "success");
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const banner = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    V A N I S H I N G   P O I N T S                           ║
║                         E X P E D I T I O N   B R I E F I N G                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`.trim();

    const header = `
Reference:     ${refNum}
Date Issued:   ${dateStr}
Classification: FIELD USE — ARCHIVAL COPY
Expedition Lead: _________________________
Dust Profile:  ${dust}%  (Contamination Accumulation)
`.trim();

    const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ROUTE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Sites:        ${selected.length}
Total Distance:     ${Math.round(totalDistance)} km
Countries:          ${countries.join(", ") || "N/A"}
Est. Travel Days:   ${Math.ceil(totalDistance / 400) + selected.length} (${Math.ceil(totalDistance / 400)} transit + ${selected.length} survey)

DANGER ASSESSMENT
─────────────────
Average Threat:     ${avgDanger} / 5
Maximum Threat:     ${maxDanger} / 5
High-Risk Sites:    ${highDangerCount}

${maxDanger >= 4 ? "⚠  THE ARCHIVIST MARKED THIS ROUTE AS PERILOUS." : ""}
${highDangerCount > 0 ? "   The dust is thick at these coordinates. Proceed with memory." : ""}
`.trim();

    const siteReports = selected
      .map((place, i) => {
        const prev = i > 0 ? selected[i - 1] : null;
        const legDist = prev ? haversine(prev.coordinates, place.coordinates) : 0;
        const lat = formatCoord(place.coordinates[1], true);
        const lon = formatCoord(place.coordinates[0], false);
        const tier = getPlaceTier(place._id);
        const sealed = isSealed(place._id);
        const signalOk = getSignalUnlock(place.slug);

        return `
──────────────────────────────────────────────────────────────────────────────
 SITE ${String(i + 1).padStart(2, "0")}  │  ${place.name.toUpperCase()}
──────────────────────────────────────────────────────────────────────────────

Location:        ${place.address.city}, ${place.address.country}
Coordinates:     ${lat}  ${lon}
${prev ? `Leg Distance:    ${Math.round(legDist)} km from ${prev.name}` : "Entry Point"}

Classification:  ${place.category === "haunted" ? "SPECTRAL" : place.category === "abandoned" ? "FORSAKEN" : "DUAL NATURE"}
Status:          ${place.yearAbandoned ? `Abandoned ${place.yearAbandoned}` : "Date unknown"}
Danger Level:    ${"★".repeat(place.dangerLevel)}${"☆".repeat(5 - place.dangerLevel)}  (${place.dangerLevel}/5)
Archive Tier:    ${tier.toUpperCase()}${sealed ? " [SEALED]" : ""}
Signal Status:   ${signalOk ? "DECODED — BUNKER_7 CLEARANCE GRANTED" : "NO SIGNAL — PROCEED WITH CAUTION"}
Visual Records:  ${place.photos?.length || 0} photographs on file

FIELD ADVISORY
${dangerAdvice(place.dangerLevel)}

${place.hauntingReports && place.hauntingReports.length > 0 ? `WITNESS ACCOUNTS
${place.hauntingReports.map((r) => `  • ${r}`).join("\n")}` : ""}

${place.history ? `HISTORICAL FRAGMENT
${place.history.slice(0, 280)}${place.history.length > 280 ? "..." : ""}` : ""}
`;
      })
      .join("\n");

    const equipment = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EQUIPMENT MANIFEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${packingList(selected.map((p) => p.dangerLevel))
  .map((item, i) => `  ${String(i + 1).padStart(2, "0")}.  ${item}`)
  .join("\n")}

PRE-DEPARTURE RITUALS
─────────────────────
□ Threshold salt line prepared
□ Emergency contact knows the route
□ Signal mirror polished
□ Contingency route memorized
□ BUNKER_7 frequency confirmed for high-risk coordinates
`.trim();

    const footer = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DOCUMENT END  │  Generated by Vanishing Points Atlas  │  ${refNum}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Some doors, once opened, are not easily closed."
`.trim();

    const fullText = [banner, header, summary, siteReports, equipment, footer].join("\n\n");

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expedition-briefing-${refNum}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[rgba(15,12,9,0.85)] backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="submit-card rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-[rgba(122,107,82,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-[#9a8a72]" />
            <h2 className="font-cinzel text-lg text-[#3d3228]">Expedition Planner</h2>
          </div>
          <button onClick={onClose} className="text-[#9a8a72] hover:text-[#5a4e42]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Dust meter */}
          <div className="mb-4 p-3 bg-[rgba(90,78,66,0.06)] rounded-lg border border-[rgba(122,107,82,0.12)]">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Skull size={10} />
                Dust Accumulation
              </span>
              <span>{dust}%</span>
            </div>
            <div className="h-2 bg-[rgba(122,107,82,0.15)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(dust, 100)}%`,
                  backgroundColor: dust > 75 ? "#c4785a" : dust > 40 ? "#9a8a72" : "#7a9a6a",
                  boxShadow: dust > 75 ? "0 0 6px rgba(196,120,90,0.3)" : "none",
                }}
              />
            </div>
            <p className="text-[9px] text-[#9a8a72] mt-1.5 leading-relaxed">
              Danger 4–5 sites require signal decode or dust ≥30%. You carry {dust}%.
            </p>
          </div>

          {selected.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[rgba(90,78,66,0.06)] rounded-lg border border-[rgba(122,107,82,0.12)] text-center">
                  <Globe size={14} className="mx-auto text-[#9a8a72] mb-1" />
                  <p className="text-lg font-cinzel text-[#3d3228]">{selected.length}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-[#7a6e5e]">Sites</p>
                </div>
                <div className="p-3 bg-[rgba(90,78,66,0.06)] rounded-lg border border-[rgba(122,107,82,0.12)] text-center">
                  <MapPin size={14} className="mx-auto text-[#9a8a72] mb-1" />
                  <p className="text-lg font-cinzel text-[#3d3228]">{Math.round(totalDistance)}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-[#7a6e5e]">Kilometers</p>
                </div>
                <div className="p-3 bg-[rgba(90,78,66,0.06)] rounded-lg border border-[rgba(122,107,82,0.12)] text-center">
                  <Shield size={14} className="mx-auto text-[#9a8a72] mb-1" />
                  <p className="text-lg font-cinzel text-[#3d3228]">{avgDanger}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-[#7a6e5e]">Avg Danger</p>
                </div>
              </div>

              {/* Warnings */}
              {maxDanger >= 4 && (
                <div className="flex items-center gap-2 p-3 bg-[rgba(122,60,42,0.08)] border border-[rgba(122,60,42,0.2)] rounded-lg">
                  <AlertTriangle size={14} className="text-[#7a3a2a] flex-shrink-0" />
                  <p className="text-[11px] text-[#5a3a2a] font-mono">
                    This expedition crosses {highDangerCount} extreme-hazard zone
                    {highDangerCount > 1 ? "s" : ""}. The archivist's notes suggest caution.
                  </p>
                </div>
              )}

              {/* Route list */}
              <div className="space-y-2">
                {selected.map((place, i) => (
                  <div
                    key={place._id}
                    className="flex items-center gap-3 p-3 bg-[rgba(90,78,66,0.04)] rounded-lg border border-[rgba(122,107,82,0.1)]"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[rgba(122,107,82,0.15)] text-[10px] font-mono text-[#5a4e42]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#3d3228] font-cinzel truncate">{place.name}</p>
                      <p className="text-[10px] font-mono text-[#9a8a72]">
                        {place.address.country} · Danger {place.dangerLevel}/5
                        {i > 0 && ` · ${Math.round(haversine(selected[i - 1].coordinates, place.coordinates))} km`}
                      </p>
                      <div className="mt-1">
                        <TierBadge placeId={place._id} />
                      </div>
                    </div>
                    <button
                      onClick={() => onFlyTo(place.coordinates)}
                      className="p-1.5 text-[#9a8a72] hover:text-[#5a4e42] hover:bg-[rgba(122,107,82,0.1)] rounded transition-colors"
                      title="Fly to on map"
                    >
                      <MapPin size={14} />
                    </button>
                    <button
                      onClick={() => toggle(place)}
                      className="p-1.5 text-[#9a8a72] hover:text-[#7a3a2a] hover:bg-[rgba(122,60,42,0.08)] rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Export */}
              <button
                onClick={exportItinerary}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#4a3a28] border border-[#3a2e22] rounded-lg text-[11px] font-mono uppercase tracking-wider text-[#ddd0bc] hover:bg-[#5a4a32] transition-colors shadow-md"
              >
                <Download size={14} />
                Compile Expedition Briefing
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {places.map((place) => {
              const isSelected = selected.find((p) => p._id === place._id);
              const gate = canAccess(place, dust);
              const signalOk = getSignalUnlock(place.slug);

              return (
                <button
                  key={place._id}
                  onClick={() => toggle(place)}
                  disabled={!gate.ok && !isSelected}
                  className={`text-left p-3 rounded-lg border transition-all text-sm relative ${
                    isSelected
                      ? "bg-[rgba(90,78,66,0.08)] border-[#9a8a72] text-[#3d3228]"
                      : !gate.ok
                      ? "bg-transparent border-[rgba(122,107,82,0.08)] text-[#9a8a72]/30 cursor-not-allowed"
                      : "bg-transparent border-[rgba(122,107,82,0.15)] text-[#5a4e42] hover:border-[rgba(122,107,82,0.3)]"
                  }`}
                >
                  {/* Signal indicator */}
                  {signalOk && (
                    <span className="absolute top-1.5 right-1.5 text-amber-600/60" title="Signal decoded">
                      <Radio size={10} />
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-xs truncate pr-2">{place.name}</span>
                    {isSelected ? (
                      <Trash2 size={12} />
                    ) : !gate.ok ? (
                      <Lock size={12} />
                    ) : (
                      <Plus size={12} />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#9a8a72] block">
                    {place.address.country} · Danger {place.dangerLevel}
                  </span>
                  <div className="mt-1">
                    <TierBadge placeId={place._id} />
                  </div>
                  {!gate.ok && !isSelected && (
                    <p className="text-[9px] text-[#7a3a2a]/70 mt-1 font-mono leading-tight">
                      {gate.reason}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}