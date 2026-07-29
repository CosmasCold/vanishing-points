"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, X, Plus, Trash2, AlertTriangle, MapPin, Download, Clock, Globe, Shield } from "lucide-react";
import { Place } from "@/types";

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
  if (level >= 5) return "EXTREME CAUTION — Structural collapse imminent. Do not enter alone. Notify local authorities of intent.";
  if (level === 4) return "HIGH RISK — Unstable flooring, asbestos, or active security. Full PPE and respirator recommended.";
  if (level === 3) return "MODERATE RISK — Weathered structures. Sturdy boots, flashlight, and first aid required.";
  if (level === 2) return "LOW RISK — Public access possible. Standard outdoor gear sufficient.";
  return "MINIMAL RISK — Safe for documentation. Respect no-trespass signage.";
}

function packingList(levels: number[]): string[] {
  const max = Math.max(...levels, 1);
  const base = ["Field notebook", "Camera with low-light capability", "Sturdy boots", "First aid kit"];
  if (max >= 2) base.push("Flashlight + spare batteries", "Dust mask");
  if (max >= 3) base.push("Hard hat", "Respirator (P100)", "Rope (30m)", "Emergency whistle");
  if (max >= 4) base.push("Full PPE suit", "Geiger counter (if applicable)", "Satellite communicator", "Bolt cutters");
  if (max >= 5) base.push("Structural engineer consult", "Local guide / fixer", "Emergency extraction plan");
  return base;
}

export default function ExpeditionPlanner({ places, onClose, onFlyTo }: Props) {
  const [selected, setSelected] = useState<Place[]>([]);

  const toggle = (place: Place) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p._id === place._id);
      if (exists) return prev.filter((p) => p._id !== place._id);
      if (prev.length >= 8) return prev;
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
  const countries = [...new Set(selected.map((p) => p.address.country))];
  const highDangerCount = selected.filter((p) => p.dangerLevel >= 4).length;
  const refNum = `VPX-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const exportItinerary = () => {
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

${maxDanger >= 4 ? "⚠  THIS EXPEDITION CROSSES EXTREME-HAZARD ZONES." : ""}
${highDangerCount > 0 ? "   Insurance waiver required for sites marked ★★★★★." : ""}
`.trim();

    const siteReports = selected
      .map((place, i) => {
        const prev = i > 0 ? selected[i - 1] : null;
        const legDist = prev ? haversine(prev.coordinates, place.coordinates) : 0;
        const lat = formatCoord(place.coordinates[1], true);
        const lon = formatCoord(place.coordinates[0], false);

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
Visual Records:  ${place.photos?.length || 0} photographs on file

FIELD ADVISORY
${dangerAdvice(place.dangerLevel)}

${place.hauntingReports && place.hauntingReports.length > 0 ? `SPECTRAL ACCOUNTS
${place.hauntingReports.map((r) => `  • ${r}`).join("\n")}` : ""}

${place.history ? `HISTORICAL NOTE
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

ADDITIONAL NOTES
────────────────
□ Local permits verified
□ Emergency contacts notified
□ Satellite communicator charged
□ Contingency route planned
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
                    {highDangerCount > 1 ? "s" : ""}. Insurance waiver required.
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
                Export Expedition Briefing
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {places.map((place) => {
              const isSelected = selected.find((p) => p._id === place._id);
              return (
                <button
                  key={place._id}
                  onClick={() => toggle(place)}
                  className={`text-left p-3 rounded-lg border transition-all text-sm ${
                    isSelected
                      ? "bg-[rgba(90,78,66,0.08)] border-[#9a8a72] text-[#3d3228]"
                      : "bg-transparent border-[rgba(122,107,82,0.15)] text-[#5a4e42] hover:border-[rgba(122,107,82,0.3)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-xs truncate pr-2">{place.name}</span>
                    {isSelected ? <Trash2 size={12} /> : <Plus size={12} />}
                  </div>
                  <span className="text-[10px] font-mono text-[#9a8a72]">
                    {place.address.country} · Danger {place.dangerLevel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}