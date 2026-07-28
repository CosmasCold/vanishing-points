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
            key={photo}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden cursor-none group"
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
            <div className="absolute inset-0 bg-gradient-to-t from-void/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-void/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-6 right-6 text-ash hover:text-bone transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X size={24} />
            </button>

            {lightbox > 0 && (
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 text-ash hover:text-bone transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(lightbox - 1);
                }}
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {lightbox < photos.length - 1 && (
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 text-ash hover:text-bone transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(lightbox + 1);
                }}
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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-ash">
              {lightbox + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}