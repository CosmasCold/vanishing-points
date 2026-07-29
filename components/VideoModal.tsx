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
          className="fixed inset-0 z-[9999] bg-[#050a05]/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl relative"
          >
            <div className="border border-[#33ff00]/30 rounded-lg overflow-hidden bg-[#0a0f0a] shadow-[0_0_40px_rgba(51,255,0,0.1)]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#33ff00]/20">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#33ff00]/70">
                  {label}
                </span>
                <button onClick={onClose} className="text-[#33ff00]/50 hover:text-[#33ff00]">
                  <X size={14} />
                </button>
              </div>
              
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={src}
                  className="w-full h-full object-contain"
                  onEnded={() => setPlaying(false)}
                  onClick={togglePlay}
                />
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(51,255,0,0.03)_50%,transparent_50%)] bg-[length:100%_4px]" />
                
                {!playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40"
                  >
                    <Play size={48} className="text-[#33ff00]/80" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#33ff00]/20">
                <button onClick={togglePlay} className="text-[#33ff00]/70 hover:text-[#33ff00]">
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !muted;
                      setMuted(!muted);
                    }
                  }}
                  className="text-[#33ff00]/70 hover:text-[#33ff00]"
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <span className="text-[9px] font-mono text-[#33ff00]/40 ml-auto">
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