"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Radio, Activity } from "lucide-react";

interface Props {
  src?: string;
  label?: string;
  themeColor: string;
  onClose: () => void;
  twitchChannel?: string;
}

export default function TerminalVideoPlayer({
  src,
  label,
  themeColor,
  onClose,
  twitchChannel,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveSignal, setLiveSignal] = useState(0);
  const [parentDomain, setParentDomain] = useState("localhost");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParentDomain(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const broadcasting = localStorage.getItem("bunker-broadcasting") === "true";
      setIsLive(broadcasting);
      if (broadcasting) setLiveSignal(60 + Math.random() * 35);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => setMuted((m) => !m);

  if (!src && !twitchChannel) return null;

  const showLive = isLive && twitchChannel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="border rounded-lg overflow-hidden relative"
      style={{ borderColor: `${themeColor}15`, backgroundColor: `${themeColor}04` }}
    >
      <AnimatePresence>
        {showLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 bg-[#a03030]/90 backdrop-blur-sm rounded text-[9px] font-mono uppercase tracking-widest text-white border border-[#c04040]/50"
          >
            <Activity size={10} className="animate-pulse" />
            LIVE SIGNAL DETECTED
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: `${themeColor}10` }}>
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: showLive ? "#a03030" : "#5a5a5a" }}
          />
          <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-50 font-mono">
            {showLive ? "UNAUTHORIZED_BROADCAST.mxf" : (label || "ARCHIVED_SIGNAL")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showLive && (
            <span className="text-[8px] font-mono opacity-40" style={{ color: themeColor }}>
              SIG:{Math.floor(liveSignal)}%
            </span>
          )}
          <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px]">×</span>
          </button>
        </div>
      </div>

      <div className="relative bg-black aspect-video">
        {showLive && twitchChannel ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${parentDomain}&muted=${muted}&autoplay=true`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        ) : src ? (
          <>
            <video
              src={src}
              className="w-full h-full"
              playsInline
              muted={muted}
              autoPlay={playing}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            {!playing && (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors"
              >
                <Play size={32} style={{ color: themeColor, opacity: 0.8 }} />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[11px] opacity-30 font-mono">NO SIGNAL</p>
          </div>
        )}
      </div>

            <div className="px-3 py-2 flex items-center gap-3 border-t" style={{ borderColor: `${themeColor}10` }}>
        {!showLive && src && (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
        <button onClick={toggleMute} className="opacity-60 hover:opacity-100 transition-opacity">
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {showLive ? (
          <div className="flex-1 flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse text-[#a03030]" />
            <span className="text-[9px] opacity-60 font-mono tracking-wider">INTERCEPTING UNAUTHORIZED TRANSMISSION</span>
          </div>
        ) : (
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-[#1a1612]">
            <div className="h-full w-0" />
          </div>
        )}
      </div>
    </motion.div>
  );
}