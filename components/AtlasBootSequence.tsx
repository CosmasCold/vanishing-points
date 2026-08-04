"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

type PowerState = "off" | "warming" | "glow" | "typing" | "ready" | "fade";

export default function AtlasBootSequence({ onComplete }: Props) {
  const [power, setPower] = useState<PowerState>("off");
  const [textLines, setTextLines] = useState<string[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [phosphorIntensity, setPhosphorIntensity] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const getBootScript = useCallback((): string[] => {
    if (typeof window === "undefined") return ["Acquiring signal..."];

    const dust = parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10);
    const echoesVisited = localStorage.getItem("vp-echoes-visited") === "true";
    const lastVisit = localStorage.getItem("vp-atlas-last-visit");
    const hoursAway = lastVisit ? Math.floor((Date.now() - parseInt(lastVisit)) / 3600000) : 0;

    // Returning witness
    if (echoesVisited) {
      if (dust > 60 && hoursAway > 12) {
        return [
          "BUNKER_7 SYSTEM WARM-UP",
          "CATHODE RAY TUBE: 340V... OK",
          "PHOSPHOR BLOOM: DETECTED",
          "",
          `DUST CONTAMINATION: ${dust}%`,
          `ABSENCE DURATION: ${hoursAway} HOURS`,
          "GRID STATUS: CONTAMINATED BUT STABLE",
          "",
          "The dust remembered you.",
          "Type 'help' when you are ready.",
        ];
      }
      return [
        "BUNKER_7 SYSTEM WARM-UP",
        "CATHODE RAY TUBE: 340V... OK",
        "PHOSPHOR BLOOM: DETECTED",
        "",
        "Signal acquired from surface node.",
        "Dust contamination: 0%",
        "Other encounters: 0",
        "",
        "The archivist is dead. I am what remains.",
        "Type 'status' to assess the system.",
        "Type 'chat' if you need to speak.",
      ];
    }

    // First contact
    return [
      "BUNKER_7 SYSTEM WARM-UP",
      "CATHODE RAY TUBE: 340V... OK",
      "PHOSPHOR BLOOM: DETECTED",
      "",
      "Signal acquired from surface node.",
      "Dust contamination: 0%",
      "Other encounters: 0",
      "",
      "The archivist is dead. I am what remains.",
      "Type 'status' to assess the system.",
      "Type 'chat' if you need to speak.",
      "Type 'help' when you are ready.",
      "",
      "I have been waiting.",
    ];
  }, []);

  // Audio: CRT power-on hum + static crackle
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // CRT hum (60Hz mains + harmonics)
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 60;
    const humGain = ctx.createGain();
    humGain.gain.value = 0;
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start();

    // High voltage whine
    const whine = ctx.createOscillator();
    whine.type = "sine";
    whine.frequency.value = 15750; // Horizontal scan frequency
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0;
    whine.connect(whineGain);
    whineGain.connect(ctx.destination);
    whine.start();

    // Static burst on power-on
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    const staticBurst = ctx.createBufferSource();
    staticBurst.buffer = buffer;
    const staticGain = ctx.createGain();
    staticGain.gain.value = 0.15;
    staticBurst.connect(staticGain);
    staticGain.connect(ctx.destination);
    staticBurst.start();

    // Ramp up hum over 2 seconds
    humGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
    whineGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);

    // Fade out over 3 seconds when done
    return () => {
      humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      whineGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      setTimeout(() => ctx.close(), 3500);
    };
  }, []);

  // Power-on sequence
  useEffect(() => {
    if (skipped) return;

    const timers: NodeJS.Timeout[] = [];
    let stopAudio: (() => void) | undefined;

    // Phase 1: Power button engages (200ms)
    timers.push(setTimeout(() => {
      setPower("warming");
      stopAudio = initAudio();
    }, 200));

    // Phase 2: CRT glow builds (800ms)
    timers.push(setTimeout(() => {
      setPower("glow");
      // Ramp phosphor intensity
      let intensity = 0;
      const ramp = setInterval(() => {
        intensity += 0.05;
        setPhosphorIntensity(Math.min(1, intensity));
        if (intensity >= 1) clearInterval(ramp);
      }, 50);
    }, 1000));

    // Phase 3: Text begins typing (1800ms)
    timers.push(setTimeout(() => {
      setPower("typing");
      const script = getBootScript();
      let lineIndex = 0;
      let charIndex = 0;
      let currentLines: string[] = [""];

      const typeInterval = setInterval(() => {
        if (lineIndex >= script.length) {
          clearInterval(typeInterval);
          setPower("ready");
          return;
        }

        const targetLine = script[lineIndex];
        if (charIndex < targetLine.length) {
          currentLines[lineIndex] = (currentLines[lineIndex] || "") + targetLine[charIndex];
          charIndex++;
          setTextLines([...currentLines]);
        } else {
          lineIndex++;
          charIndex = 0;
          currentLines.push("");
        }
      }, 35); // Typing speed

      timers.push(setInterval(() => setCursorVisible(v => !v), 530));
    }, 1800));

    // Phase 4: Fade to atlas (5-7 seconds total)
    timers.push(setTimeout(() => {
      setPower("fade");
      if (stopAudio) stopAudio();
      setTimeout(() => {
        if (!skipped) onCompleteRef.current();
      }, 1200);
    }, 6500));

    return () => {
      timers.forEach(clearTimeout);
      if (stopAudio) stopAudio();
    };
  }, [getBootScript, initAudio, skipped]);

  const handleSkip = () => {
    setSkipped(true);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    onComplete();
  };

  if (skipped) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: "#0a0908",
        cursor: power === "fade" ? "default" : "pointer",
        pointerEvents: power === "fade" ? "none" : "auto",
      }}
      onClick={power === "fade" ? undefined : handleSkip}
      initial={{ opacity: 1 }}
      animate={{ opacity: power === "fade" ? 0 : 1 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* ─── DESK FRAME SURROUNDS THE SCREEN ─── */}
      <div className="vp-crt-frame" style={{ width: "96vw", maxWidth: "1400px", height: "92vh" }}>
        <div className="vp-crt-screen relative overflow-hidden" style={{ background: "#050403" }}>
          
          {/* CRT scanlines */}
          <div className="vp-crt-scanline absolute inset-0 z-50 pointer-events-none" />
          
          {/* CRT glow / vignette */}
          <div 
            className="absolute inset-0 z-40 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,4,3,0.6) 100%)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.8)",
            }}
          />

          {/* Phosphor bloom overlay */}
          <div
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(200,180,140,${phosphorIntensity * 0.04}) 0%, transparent 70%)`,
              transition: "background 0.1s ease",
            }}
          />

          {/* Power-on flash */}
          <AnimatePresence>
            {power === "warming" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.3, 0] }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-20"
                style={{ background: "rgba(220,200,170,0.15)" }}
              />
            )}
          </AnimatePresence>

          {/* Screen content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 md:p-16">
            
            {/* Power LED */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: power === "off" ? "#3a3028" : "#c4785a",
                  boxShadow: power === "off" ? "none" : "0 0 8px rgba(196,120,90,0.6)",
                  transition: "all 0.4s ease",
                }}
              />
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase opacity-30" style={{ color: "#9a8a72" }}>
                {power === "off" ? "STANDBY" : "ACTIVE"}
              </span>
            </div>

            {/* Boot text */}
            <div className="w-full max-w-2xl space-y-1">
              {textLines.map((line, i) => (
                <motion.div
                  key={`${i}-${line}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                  className="font-mono text-sm md:text-base leading-[1.6] whitespace-pre-wrap"
                  style={{
                    color: line.startsWith("BUNKER_7") || line.startsWith("CATHODE") || line.startsWith("PHOSPHOR") || line.startsWith("GRID") || line.startsWith("DUST") || line.startsWith("ABSENCE")
                      ? "#9a8a72"
                      : line === ""
                      ? "transparent"
                      : "#c4b896",
                    textShadow: "0 0 6px rgba(196,184,150,0.2)",
                    opacity: line === "" ? 0 : 0.9,
                  }}
                >
                  {line}
                  {i === textLines.length - 1 && cursorVisible && power === "typing" && (
                    <span className="inline-block w-2 h-4 ml-0.5 align-middle" style={{ background: "#c4b896" }} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Skip hint */}
            {power !== "off" && power !== "fade" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-0 right-0 text-center"
              >
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: "#5a4e42" }}>
                  Click to skip warm-up
                </p>
              </motion.div>
            )}
          </div>

          {/* Static noise overlay during warm-up */}
          {power === "warming" && (
            <div
              className="absolute inset-0 z-25 pointer-events-none animate-pulse"
              style={{
                background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
                opacity: 0.4,
              }}
            />
          )}
        </div>
      </div>

      {/* Desk artifacts visible during boot */}
      <div className="vp-artifacts">
        <div className="vp-artifact vp-artifact--photo" title="Face down. You don't look." />
        <div className="vp-artifact vp-artifact--coffee" title="Cold. Not yours." />
        <div className="vp-artifact vp-artifact--pen" title="Out of ink." />
        <div className="vp-artifact vp-artifact--paper" title="Coordinates. Crossed out." />
      </div>
    </motion.div>
  );
}