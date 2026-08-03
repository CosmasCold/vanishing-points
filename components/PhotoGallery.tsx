"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
}

export default function PhotoGallery({ photos }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {photos.map((photo, i) => (
          <motion.div
            key={`${photo}-${i}`}
            whileHover={typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches ? { scale: 1.03 } : undefined}
            transition={{ duration: 0.3 }}
            className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setLightbox(i)}
          >
            <Image
              src={photo}
              alt={`Photo ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="192px"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(to top, rgba(10,8,6,0.5), transparent, transparent)",
              }}
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center"
            style={{ background: "rgba(12,10,8,0.95)", backdropFilter: "blur(4px)" }}
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-6 right-6 transition-colors"
              style={{ color: "#9a8a72" }}
              onClick={() => setLightbox(null)}
              aria-label="Close gallery"
            >
              <X size={24} />
            </button>

            {lightbox > 0 && (
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9a8a72" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(lightbox - 1);
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {lightbox < photos.length - 1 && (
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9a8a72" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(lightbox + 1);
                }}
                aria-label="Next photo"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <motion.div
              key={photos[lightbox]}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-[90vw] max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[lightbox]}
                alt={`Photo ${lightbox + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </motion.div>

            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono"
              style={{ color: "#9a8a72", fontSize: "11px" }}
            >
              {lightbox + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}