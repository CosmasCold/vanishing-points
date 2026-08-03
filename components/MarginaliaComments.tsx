"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
  angle: number;
}

interface Props {
  placeSlug: string;
}

const ARCHIVIST_NAMES = [
  "Previous surveyor",
  "An earlier visitor",
  "The one before you",
  "A passing witness",
  "The archivist, 1987",
  "Field note, undated",
  "Someone who stood here",
  "A previous expedition",
];

export default function MarginaliaComments({ placeSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`vp-marginalia-${placeSlug}`);
      if (saved) setComments(JSON.parse(saved));
    } catch {
      // Corrupted localStorage — start fresh
    }
  }, [placeSlug]);

  const addComment = () => {
    if (!draft.trim()) return;
    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: ARCHIVIST_NAMES[Math.floor(Math.random() * ARCHIVIST_NAMES.length)],
      text: draft.trim(),
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      angle: (Math.random() - 0.5) * 3, // Subtle tilt, not extreme
    };
    const next = [...comments, comment];
    setComments(next);
    localStorage.setItem(`vp-marginalia-${placeSlug}`, JSON.stringify(next));
    setDraft("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addComment();
    }
  };

  return (
    <div className="relative mt-6 pt-6" style={{ borderTop: "1px solid rgba(62,50,40,0.1)" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] transition-colors"
        style={{ color: "#9a8a72" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#7a6b52";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#9a8a72";
        }}
      >
        <MessageCircle size={12} />
        Marginalia ({comments.length})
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {comments.length === 0 && (
                <p className="text-[11px] italic opacity-30" style={{ color: "#7a6e5e", fontFamily: "'Caveat', cursive" }}>
                  The margin is empty. Be the first to leave a mark.
                </p>
              )}

              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{ transform: `rotate(${c.angle}deg)` }}
                  className="relative pl-4"
                >
                  <div
                    className="absolute left-0 top-0 bottom-2 w-px"
                    style={{ background: "rgba(154,138,114,0.15)" }}
                  />
                  <p
                    className="text-[13px] leading-snug"
                    style={{ fontFamily: "'Caveat', cursive", color: "#5a4e42" }}
                  >
                    {c.text}
                  </p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: "#9a8a72", opacity: 0.5 }}>
                    — {c.author}, {c.date}
                  </p>
                </div>
              ))}

              <div className="flex gap-2 mt-3 items-end">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a note in the margin..."
                  className="flex-1 bg-transparent border-b text-[13px] outline-none placeholder:opacity-30 transition-colors"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    borderColor: "rgba(122,107,82,0.2)",
                    color: "#4a3e32",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(154,138,114,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(122,107,82,0.2)";
                  }}
                />
                <button
                  onClick={addComment}
                  className="text-[11px] font-mono uppercase tracking-wider transition-colors pb-1"
                  style={{ color: "#9a8a72" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#5a4e42";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#9a8a72";
                  }}
                >
                  Ink
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}