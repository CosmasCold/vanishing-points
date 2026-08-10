import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/state/uiStore";
import { useAudioStore } from "@/state/audioStore";
import { colors, typography, microform } from "@/styles/theme";
import { useTapeDegradation } from "@/hooks/useTapeDegradation";
import { Play, Pause, Square, SkipBack, SkipForward, X } from "lucide-react";

interface TapeDeckProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const TapeDeck: React.FC<TapeDeckProps> = ({ src, title, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Track tape counter (seconds-based cycle ticker)
  const [counter, setCounter] = useState(0);

  // Track active scrub state (ff or rw) for spool hyper-rotation
  const [scrubState, setScrubState] = useState<"ff" | "rw" | null>(null);

  const { click, play } = useAudioStore();
  const { status } = useUIStore();
  const dustIndex = status?.dustIndex ?? 0;

  // Initialize our custom Web Audio tape degradation engine
  const [audioElementReady, setAudioElementReady] = useState<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (audioRef.current) {
      setAudioElementReady(audioRef.current);
    }
  }, [audioRef]);

  const { vuValue, triggerScrubSound } = useTapeDegradation({
    audioElement: audioElementReady,
    isPlaying,
  });

  // Track playback time and update counter / progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      setCounter(Math.floor(audio.currentTime * 2.4)); // Tape speed coefficient
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 1);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Controls
  const togglePlay = () => {
    click();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          play("tape"); // Trigger physical tape engagement click sound
        })
        .catch((err) => {
          console.error("Audio playback blocked by browser security policy:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleStop = () => {
    click();
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setCounter(0);
  };

  const handleRewind = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Trigger physical tape scrubbing squeal sound!
    if (typeof triggerScrubSound === "function") {
      triggerScrubSound("rw");
    } else {
      play("click");
    }

    setScrubState("rw");
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    
    // Smooth release of high-speed rotation
    setTimeout(() => {
      setScrubState(null);
    }, 450);
  };

  const handleFastForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Trigger physical tape scrubbing squeal sound!
    if (typeof triggerScrubSound === "function") {
      triggerScrubSound("ff");
    } else {
      play("click");
    }

    setScrubState("ff");
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
    
    // Smooth release of high-speed rotation
    setTimeout(() => {
      setScrubState(null);
    }, 450);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setProgress(time);

    // Minor scrub scratch sound while sliding progress bar
    if (typeof triggerScrubSound === "function" && Math.random() < 0.2) {
      triggerScrubSound(time > progress ? "ff" : "rw");
    }
  };

  // Format time display: mm:ss
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Tape spool thickness calculation based on elapsed progress
  const spoolWidths = useMemo(() => {
    const ratio = progress / duration;
    const leftRadius = 14 + (1 - ratio) * 22; // left reel empties
    const rightRadius = 14 + ratio * 22;      // right reel fills
    return { leftRadius, rightRadius };
  }, [progress, duration]);

  // Spool physical rotation dynamics
  const getReelAnimation = () => {
    if (scrubState === "ff") {
      return {
        animate: { rotate: 360 },
        transition: { duration: 0.15, repeat: Infinity, ease: "linear" }
      };
    }
    if (scrubState === "rw") {
      return {
        animate: { rotate: -360 },
        transition: { duration: 0.15, repeat: Infinity, ease: "linear" }
      };
    }
    if (isPlaying) {
      return {
        animate: { rotate: 360 },
        transition: { duration: 1.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      animate: { rotate: 0 },
      transition: { duration: 0.4 }
    };
  };

  return (
    <div
      className="flex flex-col items-center gap-6 p-6 select-none border-2 relative"
      style={{
        width: "560px",
        maxWidth: "95vw",
        backgroundColor: colors.archive.black,
        borderColor: colors.archive.grayDark,
        boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Decorative Bezel top strip */}
      <div className="flex items-center justify-between w-full pb-2 border-b shrink-0" style={{ borderColor: colors.archive.grayDark }}>
        <div className="flex items-center gap-2">
          <span style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: "9px", letterSpacing: "0.15em" }}>
            TAPE RECONSTRUCTION DECK
          </span>
          <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: "9px" }}>
            // TIER-{dustIndex >= 40 ? "II" : "I"} SYSTEM_7B
          </span>
        </div>
        <button onClick={onClose} className="hover:opacity-75 transition-opacity" style={{ color: colors.archive.gray }}>
          <X size={16} />
        </button>
      </div>

      {/* Title block */}
      <div className="text-center w-full mt-2">
        <div style={{ color: colors.archive.white, fontFamily: typography.mono, fontSize: "14px", letterSpacing: "0.03em" }}>
          {title.toUpperCase()}
        </div>
        <div className="mt-1" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: "10px" }}>
          MAGNETIC SUBSTRATE: CASSETTE TAPE
        </div>
      </div>

      {/* Analog Dual VU Meters */}
      <div className="flex gap-8 justify-center items-center w-full py-2">
        {["LEFT SIGNAL", "RIGHT SIGNAL"].map((ch, idx) => (
          <div
            key={ch}
            className="flex flex-col items-center p-2 rounded-[2px] border relative"
            style={{
              width: "160px",
              height: "75px",             backgroundColor: "#161310",
              borderColor: colors.archive.grayDark,
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.9)",
            }}
          >
            {/* VU label */}
            <div className="absolute top-1 text-[7px] tracking-wider" style={{ color: colors.archive.gray, fontFamily: typography.mono }}>
              {ch}
            </div>

            {/* Scale Gauge overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 75">
              <path d="M 25 55 A 50 50 0 0 1 135 55" fill="none" stroke="#2c241d" strokeWidth="2" strokeDasharray="3, 5" />
              <path d="M 105 40 A 50 50 0 0 1 135 55" fill="none" stroke={colors.archive.red} strokeWidth="2.5" />
              <text x="35" y="62" fill={colors.archive.gray} style={{ fontSize: "6px", fontFamily: typography.mono }}>-20</text>              <text x="80" y="32" fill={colors.archive.gray} style={{ fontSize: "6px", fontFamily: typography.mono }}>0dB</text>
              <text x="125" y="62" fill={colors.archive.red} style={{ fontSize: "6px", fontFamily: typography.mono }}>+3</text>
            </svg>

            {/* Bouncing VU Needle */}
            <div
              className="absolute bottom-2 left-1/2 origin-bottom transition-transform duration-100 ease-out"
              style={{
                width: "1px",
                height: "48px",
                backgroundColor: colors.archive.amber,
                transform: `translateX(-50%) rotate(${-45 + vuValue * 85 + (idx % 2 === 0 ? Math.sin(Date.now() * 0.05) * 1.5 : 0)}deg)`,
                boxShadow: "0 0 4px rgba(201, 169, 110, 0.4)",
              }}
            />

            {/* Pivot Joint Cover */}
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border shadow-md"
              style={{
                backgroundColor: "#201c18",
                borderColor: colors.archive.grayDark,
              }}
            />
          </div>
        ))}
      </div>

      {/* Cassette Mechanical Chassis */}
      <div
        className="relative p-4 border shadow-inner flex items-center justify-center overflow-hidden"
        style={{
          width: "440px",
          height: "210px",
          backgroundColor: "#1b1916",
          borderColor: colors.archive.grayDark,
          borderRadius: "4px",
          boxShadow: "inset 0 4px 16px rgba(0,0,0,0.85)",
        }}
      >
        {/* Transparent cassette shell */}
        <div
          className="w-full h-full border flex flex-col p-4 relative"
          style={{
            borderColor: "rgba(201, 169, 110, 0.1)",
            backgroundColor: "rgba(10, 8, 6, 0.4)",
            borderRadius: "2px",
          }}
        >
          {/* Label print overlay */}
          <div className="flex justify-between w-full h-8 px-4 border-b text-[8px] font-mono tracking-widest text-[#5a4c3f]" style={{ borderColor: "rgba(201, 169, 110, 0.1)" }}>
            <span>VP-7B DECK</span>
            <span className="text-[#a85d5d]">UV-RESONANCE</span>
          </div>

          {/* Core Tape window pane */}
          <div
            className="flex-1 border-2 my-3 rounded-[1px] relative flex items-center justify-between px-12"
            style={{
              backgroundColor: "#0d0b09",
              borderColor: "#181512",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.95)",
            }}
          >
            {/* Spool A (Left Reel) */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div
                className="absolute rounded-full border transition-all duration-300"
                style={{
                  width: `${spoolWidths.leftRadius * 2}px`,
                  height: `${spoolWidths.leftRadius * 2}px`,
                  backgroundColor: "rgba(38, 30, 24, 0.8)",
                  borderColor: "rgba(38, 30, 24, 0.9)",
                }}
              />
              <motion.svg
                className="w-12 h-12 z-10 text-stone-700"
                viewBox="0 0 50 50"
                {...getReelAnimation()}
              >
                <circle cx="25" cy="25" r="14" fill="#1b1814" stroke="#2d2620" strokeWidth="2.5" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <line
                    key={deg}
                    x1="25"
                    y1="11"
                    x2="25"
                    y2="15"
                    stroke="#52453b"
                    strokeWidth="3.5"
                    transform={`rotate(${deg} 25 25)`}
                  />
                ))}
                <circle cx="25" cy="25" r="7.5" fill="#0d0b09" />
              </motion.svg>
            </div>

            {/* Spool B (Right Reel) */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div
                className="absolute rounded-full border transition-all duration-300"
                style={{
                  width: `${spoolWidths.rightRadius * 2}px`,
                  height: `${spoolWidths.rightRadius * 2}px`,
                  backgroundColor: "rgba(38, 30, 24, 0.8)",
                  borderColor: "rgba(38, 30, 24, 0.9)",
                }}
              />
              <motion.svg
                className="w-12 h-12 z-10 text-stone-700"
                viewBox="0 0 50 50"
                {...getReelAnimation()}
              >
                <circle cx="25" cy="25" r="14" fill="#1b1814" stroke="#2d2620" strokeWidth="2.5" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <line
                    key={deg}
                    x1="25"
                    y1="11"
                    x2="25"
                    y2="15"
                    stroke="#52453b"
                    strokeWidth="3.5"
                    transform={`rotate(${deg} 25 25)`}
                  />
                ))}
                <circle cx="25" cy="25" r="7.5" fill="#0d0b09" />
              </motion.svg>
            </div>

            {/* Segment Counter */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-[1px] border font-mono text-[10px]"
              style={{
                backgroundColor: "#0d0c0a",
                borderColor: "rgba(201, 169, 110, 0.15)",
                color: colors.archive.amber,
                textShadow: "0 0 4px rgba(201,169,110,0.6)",
              }}
            >
              {counter.toString().padStart(4, "0")}
            </div>
          </div>

          {/* Bottom trapezoid capstans */}
          <div className="flex justify-between items-center w-full px-8 text-[6px] tracking-widest text-stone-800 font-mono">
            <span>A-SIDE</span>
            <span>AUTO-REVERSE</span>
          </div>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="flex items-center gap-3 w-full px-4 font-mono text-[10px]" style={{ color: colors.archive.grayLight }}>
        <span>{formatTime(progress)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.05"
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 bg-[#1c1916] rounded-lg appearance-none cursor-pointer accent-amber-500"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.archive.amber} 0%, ${colors.archive.amber} ${(progress / (duration || 100)) * 100}%, #1c1916 ${(progress / (duration || 100)) * 100}%, #1c1916 100%)`,
          }}
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* Tactical Tape Keypad controls */}
      <div className="flex justify-between items-center w-full px-6 py-2 border-t" style={{ borderColor: colors.archive.grayDark }}>
        <div className="flex gap-4">
          <button
            onClick={togglePlay}
            className={`flex items-center justify-center w-10 h-10 border transition-all active:translate-y-0.5 rounded-[1px] ${
              isPlaying ? "shadow-inner border-amber-600 bg-[#35251b]" : "shadow-md hover:opacity-80"
            }`}
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.surface,
              color: isPlaying ? colors.archive.amber : colors.archive.grayLight,
            }}
            title={isPlaying ? "PAUSE" : "PLAY"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-current" />}
          </button>

          <button
            onClick={handleStop}
            className="flex items-center justify-center w-10 h-10 border shadow-md transition-all active:translate-y-0.5 rounded-[1px] hover:opacity-80"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.surface,
              color: colors.archive.grayLight,
            }}
            title="STOP"
          >
            <Square size={14} className="fill-current" />
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRewind}
            className="flex items-center justify-center w-10 h-10 border shadow-md transition-all active:translate-y-0.5 rounded-[1px] hover:opacity-80"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.surface,
              color: colors.archive.grayLight,
            }}
            title="REWIND -10s"
          >
            <SkipBack size={15} fill="currentColor" />
          </button>

          <button
            onClick={handleFastForward}
            className="flex items-center justify-center w-10 h-10 border shadow-md transition-all active:translate-y-0.5 rounded-[1px] hover:opacity-80"
            style={{
              borderColor: colors.archive.grayDark,
              backgroundColor: colors.archive.surface,
              color: colors.archive.grayLight,
            }}
            title="FAST FORWARD +10s"
          >
            <SkipForward size={15} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};
