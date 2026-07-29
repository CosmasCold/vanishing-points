"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Trash2, MapPin, Calendar } from "lucide-react";
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
      className="fixed inset-0 z-[60] bg-[rgba(15,12,9,0.85)] backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="submit-card rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-[rgba(122,107,82,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#9a8a72]" />
            <h2 className="font-cinzel text-lg text-[#3d3228]">Expedition Log</h2>
          </div>
          <button onClick={onClose} className="text-[#9a8a72] hover:text-[#5a4e42]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {count === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={24} className="mx-auto text-[#9a8a72] mb-3" />
              <p className="text-sm text-[#5a4e42] font-cinzel">No stamps yet.</p>
              <p className="text-[10px] font-mono text-[#9a8a72] mt-1">
                Visit places on the map to log your expeditions.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] mb-4">
                {count} site{count !== 1 ? "s" : ""} documented
              </p>

              <div className="space-y-3">
                {visited.map((v) => (
                  <Link
                    key={v._id}
                    href={`/place/${v.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 bg-[rgba(90,78,66,0.04)] rounded-lg border border-[rgba(122,107,82,0.1)] hover:border-[rgba(122,107,82,0.3)] transition-colors group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(122,107,82,0.12)] text-[#9a8a72] group-hover:bg-[rgba(122,107,82,0.2)] transition-colors">
                      <MapPin size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#3d3228] font-cinzel truncate">{v.name}</p>
                      <p className="text-[10px] font-mono text-[#9a8a72] flex items-center gap-1">
                        <Calendar size={9} />
                        {new Date(v.visitedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[rgba(62,50,40,0.1)]">
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#7a3a2a] hover:text-[#9a4a3a] transition-colors"
                  >
                    <Trash2 size={12} />
                    Burn expedition log
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#5a4e42]">This cannot be undone.</span>
                    <button
                      onClick={clearLog}
                      className="px-3 py-1 bg-[rgba(122,60,42,0.1)] border border-[rgba(122,60,42,0.25)] rounded text-[10px] font-mono uppercase text-[#7a3a2a] hover:bg-[rgba(122,60,42,0.2)] transition-colors"
                    >
                      Confirm burn
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="text-[10px] font-mono uppercase text-[#9a8a72] hover:text-[#5a4e42]"
                    >
                      Cancel
                    </button>
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