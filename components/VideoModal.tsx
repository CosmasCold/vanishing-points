"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";

interface Props {
  src: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ src, label, isOpen, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4"
          style={{ backgroundColor: "rgba(12,10,8,0.95)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl relative mx-auto"
          >
            <div
              className="rounded-lg overflow-hidden border"
              style={{
                backgroundColor: "#0c0a08",
                borderColor: "rgba(154,138,114,0.2)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 md:px-4 py-2 border-b"
                style={{ borderColor: "rgba(154,138,114,0.12)" }}
              >
                <span
                  className="text-[10px] font-mono uppercase tracking-widest truncate pr-2"
                  style={{ color: "rgba(154,138,114,0.7)" }}
                >
                  {label}
                </span>
                <button
                  onClick={onClose}
                  className="transition-colors"
                  style={{ color: "rgba(154,138,114,0.5)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9a8a72";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(154,138,114,0.5)";
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Video */}
              <div className="relative aspect-video" style={{ backgroundColor: "#0c0a08" }}>
                <video
                  ref={videoRef}
                  src={src}
                  className="w-full h-full object-contain"
                  onEnded={() => setPlaying(false)}
                  onClick={togglePlay}
                  playsInline
                />
                {/* Warm scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(rgba(154,138,114,0.03) 50%, transparent 50%)",
                    backgroundSize: "100% 4px",
                  }}
                />
                
                {!playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(12,10,8,0.4)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(12,10,8,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(12,10,8,0.4)";
                    }}
                  >
                    <Play size={36} className="md:w-12 md:h-12" style={{ color: "rgba(154,138,114,0.8)" }} />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div
                className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 border-t"
                style={{ borderColor: "rgba(154,138,114,0.12)" }}
              >
                <button
                  onClick={togglePlay}
                  className="transition-colors"
                  style={{ color: "rgba(154,138,114,0.7)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9a8a72";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(154,138,114,0.7)";
                  }}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !muted;
                      setMuted(!muted);
                    }
                  }}
                  className="transition-colors"
                  style={{ color: "rgba(154,138,114,0.7)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9a8a72";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(154,138,114,0.7)";
                  }}
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <span
                  className="text-[10px] font-mono ml-auto"
                  style={{ color: "rgba(154,138,114,0.4)" }}
                >
                  ECHOES & DUST // CLASSIFIED
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}