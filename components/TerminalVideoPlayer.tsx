"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface Props {
  src?: string;
  label?: string;
  themeColor: string;
  onClose: () => void;
}

export default function TerminalVideoPlayer({
  src,
  label,
  themeColor,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [src]);

  if (!src) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="border rounded-lg overflow-hidden relative"
      style={{ borderColor: `${themeColor}15`, backgroundColor: `${themeColor}04` }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: `${themeColor}10` }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: playing ? "#7a9a6a" : "#5a5a5a" }} />
          <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-50 font-mono">
            {label || "ARCHIVED_SIGNAL"}
          </span>
        </div>
        <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-[10px]">×</span>
        </button>
      </div>

      {/* Video */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full"
          playsInline
          muted={muted}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors"
          >
            <Play size={32} style={{ color: themeColor, opacity: 0.8 }} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 py-2 flex items-center gap-3 border-t" style={{ borderColor: `${themeColor}10` }}>
        <button onClick={togglePlay} className="opacity-60 hover:opacity-100 transition-opacity">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={toggleMute} className="opacity-60 hover:opacity-100 transition-opacity">
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-[#1a1612]">
          <div className="h-full w-0" />
        </div>
      </div>
    </motion.div>
  );
}