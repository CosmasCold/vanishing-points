"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Calendar, AlertTriangle, Eye } from "lucide-react";
import { Place } from "@/types";
import PhotoGallery from "./PhotoGallery";
import DangerIndicator from "./DangerIndicator";
import StatusBadge from "./StatusBadge";

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const isHaunted = place.category === "haunted" || place.category === "both";

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="drawer-shell w-full sm:w-[480px] lg:w-[520px]"
    >
      {/* Mobile backdrop */}
      <div
        className="absolute inset-0 -left-full w-full h-full sm:hidden"
        onClick={onClose}
      />

      {/* Brass rivets */}
      <div className="drawer-rivet top" />
      <div className="drawer-rivet bottom" />

      {/* Brass pull handle */}
      <div className="drawer-handle" />

      {/* Content scroll area */}
      <div className="relative h-full overflow-y-auto drawer-scroll pl-[3px]">
        <div className="min-h-full flex flex-col">
          {/* Header bar */}
          <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-gradient-to-b from-[#252018] to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <StatusBadge category={place.category} />
                <h2 className="drawer-title text-2xl font-medium mt-3 leading-tight">
                  {place.name}
                </h2>
                <div className="drawer-meta flex items-center gap-2 mt-2">
                  <MapPin size={11} />
                  <span>
                    {place.address.city}, {place.address.country}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="drawer-close flex-shrink-0 mt-1"
                aria-label="Close drawer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Reference card */}
          <div className="mx-5 mb-6 flex-1">
            <div className="drawer-card rounded-lg p-5 relative overflow-hidden">
              <div className="drawer-card-glow" />

              {/* Meta row */}
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[rgba(62,43,26,0.12)]">
                {place.yearAbandoned && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#9a8a72]" />
                    <span className="drawer-meta">Abandoned {place.yearAbandoned}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-[#9a8a72]" />
                  <span className="drawer-meta">Danger</span>
                  <DangerIndicator level={place.dangerLevel} variant="parchment" />
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Eye size={12} className="text-[#9a8a72]" />
                  <span className="drawer-meta">{place.viewCount || 0} views</span>
                </div>
              </div>

              {/* History */}
              <div className="mb-6">
                <h3 className="drawer-meta mb-3 text-[10px] tracking-[0.15em]">
                  Historical Record
                </h3>
                <p className="drawer-body text-sm leading-relaxed">
                  {place.history}
                </p>
              </div>

              {/* Haunting Reports */}
              {place.hauntingReports && place.hauntingReports.length > 0 && (
                <div className="mb-6">
                  <h3 className="drawer-meta mb-3 text-[10px] tracking-[0.15em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7a3a2a]" />
                    Spectral Accounts
                  </h3>
                  <div className="space-y-3">
                    {place.hauntingReports.map((report, i) => (
                      <p key={i} className="field-note drawer-body text-sm italic">
                        {report}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {place.photos && place.photos.length > 0 && (
                <div>
                  <h3 className="drawer-meta mb-3 text-[10px] tracking-[0.15em]">
                    Visual Evidence
                  </h3>
                  <div className="specimen-frame rounded-lg overflow-hidden bg-[#d4c8b4]">
                    <PhotoGallery photos={place.photos} />
                  </div>
                </div>
              )}

              {/* Card footer stamp */}
              <div className="mt-6 pt-4 border-t border-[rgba(62,43,26,0.1)] flex items-center justify-between">
                <span className="drawer-meta text-[9px] tracking-[0.2em] opacity-60">
                  Ref. {place.slug?.toUpperCase() || "UNKNOWN"}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < place.dangerLevel
                          ? "bg-[#7a3a2a]"
                          : "border border-[#9a8a72] bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom padding for scroll */}
          <div className="h-8" />
        </div>
      </div>
    </motion.div>
  );
}