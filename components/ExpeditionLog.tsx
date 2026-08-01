"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Trash2, MapPin, Calendar, ChevronRight, } from "lucide-react";
import Link from "next/link";
import { useVisitedPlaces } from "@/hooks/useVisitedPlaces";

interface Props {
  onClose: () => void;
}

export default function ExpeditionLog({ onClose }: Props) {
  const { visited, clearLog, count } = useVisitedPlaces();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(8,6,4,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col relative"
        style={{
          background: "linear-gradient(180deg, rgba(18,14,10,0.95), rgba(12,10,8,0.98))",
          border: "1px solid rgba(122,107,82,0.18)",
          borderLeft: "3px solid #9a8a72",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(122,107,82,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(122,107,82,0.1)" }}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen size={15} style={{ color: "#9a8a72" }} />
            <h2
              className="font-cinzel text-base md:text-lg font-medium tracking-wide"
              style={{ color: "#ddd0bc", textShadow: "0 0 8px rgba(221,208,188,0.08)" }}
            >
              Expedition Log
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: "#5a4e42" }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {count === 0 ? (
            <div className="text-center py-14 md:py-16 space-y-3">
              <BookOpen size={24} className="mx-auto opacity-20" style={{ color: "#9a8a72" }} />
              <p className="font-cinzel text-sm" style={{ color: "#ddd0bc" }}>
                No stamps yet.
              </p>
              <p className="text-xs font-mono uppercase tracking-wider opacity-30" style={{ color: "#9a8a72" }}>
                Visit places on the map to log your expeditions.
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-[11px] font-mono uppercase tracking-[0.2em] mb-4"
                style={{ color: "#9a8a72", opacity: 0.6 }}
              >
                {count} site{count !== 1 ? "s" : ""} documented
              </p>

              <div className="space-y-2.5">
                {visited.map((v) => (
                  <Link
                    key={v._id}
                    href={`/place/${v.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group"
                    style={{
                      background: "rgba(122,107,82,0.04)",
                      border: "1px solid rgba(122,107,82,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(122,107,82,0.08)";
                      e.currentTarget.style.borderColor = "rgba(122,107,82,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(122,107,82,0.04)";
                      e.currentTarget.style.borderColor = "rgba(122,107,82,0.08)";
                    }}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                      style={{
                        background: "rgba(122,107,82,0.12)",
                        color: "#9a8a72",
                      }}
                    >
                      <MapPin size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm md:text-[15px] font-cinzel truncate"
                        style={{ color: "#ddd0bc" }}
                      >
                        {v.name}
                      </p>
                      <p
                        className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5"
                        style={{ color: "#9a8a72", opacity: 0.5 }}
                      >
                        <Calendar size={10} />
                        {new Date(v.addedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-30 transition-opacity flex-shrink-0" style={{ color: "#9a8a72" }} />
                  </Link>
                ))}
              </div>

              {/* Burn log */}
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(122,107,82,0.08)" }}>
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] transition-colors duration-300"
                    style={{ color: "#7a3a2a" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c4785a")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#7a3a2a")}
                  >
                    <Trash2 size={12} />
                    Burn expedition log
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs" style={{ color: "#5a4e42" }}>
                      This cannot be undone.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearLog}
                        className="px-3.5 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider transition-all active:scale-95"
                        style={{
                          color: "#c4785a",
                          background: "rgba(196,120,90,0.08)",
                          border: "1px solid rgba(196,120,90,0.25)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(196,120,90,0.15)";
                          e.currentTarget.style.borderColor = "rgba(196,120,90,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(196,120,90,0.08)";
                          e.currentTarget.style.borderColor = "rgba(196,120,90,0.25)";
                        }}
                      >
                        Confirm burn
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="text-[11px] font-mono uppercase tracking-wider transition-colors"
                        style={{ color: "#5a4e42" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#9a8a72")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4e42")}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}