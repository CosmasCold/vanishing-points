"use client";

import { useState } from "react";
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

export default function MarginaliaComments({ placeSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");

  // Load from localStorage
  useState(() => {
    const saved = localStorage.getItem(`vp-marginalia-${placeSlug}`);
    if (saved) setComments(JSON.parse(saved));
  });

  const addComment = () => {
    if (!draft.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      author: "Field Researcher",
      text: draft,
      date: new Date().toLocaleDateString(),
      angle: (Math.random() - 0.5) * 4,
    };
    const next = [...comments, comment];
    setComments(next);
    localStorage.setItem(`vp-marginalia-${placeSlug}`, JSON.stringify(next));
    setDraft("");
  };

  return (
    <div className="relative mt-6 pt-6 border-t border-[rgba(62,50,40,0.1)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-[#9a8a72] hover:text-[#7a6b52] transition-colors"
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
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{ transform: `rotate(${c.angle}deg)` }}
                  className="relative pl-4 border-l-2 border-[#9a8a72]/20"
                >
                  <p
                    className="text-[13px] text-[#5a4e42] leading-snug"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    {c.text}
                  </p>
                  <p className="text-[9px] text-[#9a8a72] font-mono mt-1">
                    — {c.author}, {c.date}
                  </p>
                </div>
              ))}

              <div className="flex gap-2 mt-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a note in the margin..."
                  className="flex-1 bg-transparent border-b border-[rgba(122,107,82,0.2)] text-[13px] text-[#4a3e32] placeholder:text-[#9a8a72]/50 focus:border-[#9a8a72] outline-none"
                  style={{ fontFamily: "'Caveat', cursive" }}
                />
                <button
                  onClick={addComment}
                  className="text-[10px] font-mono text-[#9a8a72] hover:text-[#5a4e42] uppercase"
                >
                  Ink
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caveat font load */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}