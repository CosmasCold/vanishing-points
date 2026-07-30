"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Volume2, VolumeX, Activity } from "lucide-react";

const NATO = ["ZEE-RO","WUN","TOO","TREE","FOW-ER","FIFE","SIX","SEV-EN","AIT","NIN-ER"];

function useAudioCtx() {
  const [ctx, setCtx] = useState<AudioContext | null>(null);
  const init = useCallback(() => {
    if (!ctx) {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (C) setCtx(new C());
    }
  }, [ctx]);
  return { ctx, init };
}

function playTone(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = "sine", vol = 0.04) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur);
}

function playNumberAudio(ctx: AudioContext, n: number) {
  playTone(ctx, 450 + n * 35, 0.12, "sine", 0.05);
  setTimeout(() => playTone(ctx, 800, 0.06, "triangle", 0.025), 120);
}

export default function NumbersStation({ themeColor }: { themeColor: string }) {
  const [open, setOpen] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [pattern, setPattern] = useState("STANDBY");
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{seq: number[], pattern: string, time: string}[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { ctx, init } = useAudioCtx();

  const generate = useCallback(() => {
    const patterns = [
      { name: "GRID REFERENCE", len: 5 },
      { name: "COORDINATES", len: 6 },
      { name: "FREQUENCY", len: 4 },
      { name: "SECTOR ID", len: 3 },
      { name: "AUTHENTICATION", len: 8 },
      { name: "BROADCAST KEY", len: 5 },
    ];
    const p = patterns[Math.floor(Math.random() * patterns.length)];
    const seq = Array.from({ length: p.len }, () => Math.floor(Math.random() * 10));
    setSequence(seq);
    setPattern(p.name);
    setIndex(0);
    return { seq, name: p.name };
  }, []);

  const broadcast = useCallback(() => {
    init();
    if (!ctx) return;
    if (muted) return;
    const { seq, name } = sequence.length ? { seq: sequence, name: pattern } : generate();
    setIsPlaying(true);
    playTone(ctx, 520, 0.25, "sine", 0.04);
    setTimeout(() => playTone(ctx, 520, 0.25, "sine", 0.04), 300);
    let i = 0;
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (i >= seq.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          setIndex(0);
          playTone(ctx, 400, 0.5, "sine", 0.03);
          setHistory((h) => [{seq, pattern: name, time: new Date().toLocaleTimeString()}, ...h].slice(0, 5));
          return;
        }
        if (!muted) playNumberAudio(ctx, seq[i]);
        setIndex((prev) => prev + 1);
        i++;
      }, 650);
    }, 700);
  }, [ctx, init, muted, sequence, pattern, generate]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: `${themeColor}12`, backgroundColor: `${themeColor}02` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 md:px-4 py-2.5 text-[10px] md:text-[11px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-2">
          <Radio size={12} className={isPlaying ? "animate-pulse" : ""} /> 
          Numbers Station
        </span>
        <span className="flex items-center gap-2">
          {isPlaying && <Activity size={12} className="animate-pulse" style={{ color: themeColor }} />}
          <span className="text-[9px] opacity-40">{open ? "Collapse" : "Expand"}</span>
        </span>
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="p-3 md:p-4 space-y-3 border-t" style={{ borderColor: `${themeColor}08` }}>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 block">{pattern}</span>
                  <span className="text-[10px] opacity-60 font-mono">{sequence.length > 0 ? `${sequence.length}-digit sequence` : "No signal"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMuted((m) => !m)} className="p-1.5 rounded border opacity-40 hover:opacity-80 transition-opacity" style={{ borderColor: `${themeColor}15` }}>
                    {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                  <button onClick={broadcast} disabled={isPlaying} className="px-3 py-1.5 border rounded text-[9px] uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity disabled:opacity-20" style={{ borderColor: `${themeColor}20`, color: themeColor }}>
                    {isPlaying ? "Receiving..." : "Tune"}
                  </button>
                </div>
              </div>

              <div className="flex items-end gap-0.5 h-6 md:h-8 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ backgroundColor: themeColor }}
                    animate={{ height: isPlaying ? `${20 + Math.random() * 80}%` : "10%" }}
                    transition={{ duration: 0.15, repeat: Infinity, repeatType: "reverse", delay: i * 0.02 }}
                  />
                ))}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {sequence.map((n, i) => (
                  <motion.div 
                    key={i} 
                    initial={false}
                    animate={{ opacity: i < index ? 1 : 0.25, scale: i === index - 1 ? 1.1 : 1 }}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border rounded text-[11px] md:text-[12px] font-mono" 
                    style={{ borderColor: i === index - 1 ? `${themeColor}40` : `${themeColor}10`, color: themeColor, backgroundColor: i === index - 1 ? `${themeColor}08` : "transparent" }}
                  >
                    {n}
                  </motion.div>
                ))}
                {sequence.length === 0 && <span className="text-[10px] opacity-30 italic py-1">No signal detected. Press Tune to acquire frequency.</span>}
              </div>

              {sequence.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {sequence.map((n, i) => (
                    <span key={i} className={`text-[8px] md:text-[9px] uppercase tracking-wider whitespace-nowrap font-mono ${i < index ? "opacity-50" : "opacity-15"}`} style={{ color: themeColor }}>
                      {NATO[n]}
                    </span>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div className="pt-2 border-t space-y-1" style={{ borderColor: `${themeColor}06` }}>
                  <p className="text-[8px] uppercase tracking-widest opacity-30 mb-1.5">Recent Transmissions</p>
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px] md:text-[10px] opacity-40 font-mono">
                      <span>{h.time} — {h.pattern}</span>
                      <span>{h.seq.join(" ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}