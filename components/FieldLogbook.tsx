"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Save } from "lucide-react";

interface Props {
  placeSlug: string;
  placeName: string;
}

interface NoteEntry {
  text: string;
  date: string;
  isGhost?: boolean;
}

const GHOST_NOTES = [
  "The floorboards were stable when I checked.",
  "There is no basement here.",
  "I was never inside.",
  "The coordinates on the map are wrong by 3 degrees.",
  "Do not come back after dark.",
  "The silence has weight.",
  "I left something in the corner. It is still there.",
  "The dust here carries memory.",
];

function getKey(slug: string) {
  return `vp-logbook-${slug}`;
}

export default function FieldLogbook({ placeSlug, placeName }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [ghostRevealed, setGhostRevealed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getKey(placeSlug));
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, [placeSlug]);

  const save = (next: NoteEntry[]) => {
    setNotes(next);
    localStorage.setItem(getKey(placeSlug), JSON.stringify(next));
  };

  const addNote = () => {
    if (!draft.trim()) return;
    const entry: NoteEntry = {
      text: draft.trim(),
      date: new Date().toISOString(),
    };
    const next = [...notes, entry];
    save(next);
    setDraft("");

    // 20% chance to inject ghost note after user writes 3+ notes
    if (next.length >= 3 && Math.random() < 0.2 && !ghostRevealed) {
      setGhostRevealed(true);
      setTimeout(() => {
        const ghost: NoteEntry = {
          text: GHOST_NOTES[Math.floor(Math.random() * GHOST_NOTES.length)],
          date: new Date().toISOString(),
          isGhost: true,
        };
        save([...next, ghost]);
      }, 3000);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-all bg-transparent border-[rgba(122,107,82,0.25)] text-[#9a8a72] hover:border-[#9a8a72] hover:text-[#ddd0bc]"
      >
        <BookOpen size={11} />
        Field Notes ({notes.length})
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[rgba(15,12,9,0.85)] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="submit-card rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[rgba(122,107,82,0.15)] flex items-center justify-between">
                <div>
                  <h2 className="font-cinzel text-lg text-[#3d3228]">Field Logbook</h2>
                  <p className="text-[10px] font-mono text-[#7a6e5e]">{placeName}</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-[#9a8a72] hover:text-[#5a4e42]">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {notes.length === 0 && (
                  <p className="text-sm text-[#5a4e42] italic text-center py-8">
                    No observations recorded for this site.
                  </p>
                )}

                {notes.map((n, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      n.isGhost
                        ? "bg-[rgba(51,255,0,0.04)] border-[rgba(51,255,0,0.15)]"
                        : "bg-[rgba(90,78,66,0.04)] border-[rgba(122,107,82,0.1)]"
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${n.isGhost ? "text-[#33ff00]/80 italic" : "text-[#3d3228]"}`}>
                      {n.text}
                    </p>
                    <p className={`text-[9px] font-mono mt-1 ${n.isGhost ? "text-[#33ff00]/40" : "text-[#9a8a72]"}`}>
                      {n.isGhost ? "Unknown hand" : new Date(n.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[rgba(122,107,82,0.1)]">
                <textarea
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Record your observations..."
                  className="submit-input submit-textarea w-full py-2 px-3 text-sm mb-2"
                />
                <button
                  onClick={addNote}
                  className="submit-btn w-full py-2 rounded-lg text-[11px] flex items-center justify-center gap-2"
                >
                  <Save size={12} />
                  Record Entry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}