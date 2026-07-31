"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Activity, ChevronLeft, ChevronRight, Zap, Volume2, Lock } from "lucide-react";

interface ThemeColors {
  primary: string;
  dim: string;
  accent: string;
  bg: string;
}

interface Props {
  theme: ThemeColors;
  onPushTerminal?: (lines: string[]) => void;
}

interface Frequency {
  id: string;
  mhz: string;
  name: string;
  place: string;
  placeSlug: string;
  color: string;
  dimColor: string;
  lore: string;
  transmissions: {
    type: "code" | "mission" | "clue";
    text: string;
    encoded: string;
    cipher: "caesar" | "atbash" | "vigenere" | "reverse";
    key?: string | number;
    payload?: string;
  }[];
}

const FREQUENCIES: Frequency[] = [
  {
    id: "duga",
    mhz: "4.50",
    name: "THE HUM",
    place: "Duga Radar Array",
    placeSlug: "duga-radar-array",
    color: "#88c0d0",
    dimColor: "#4c566a",
    lore: "The Russian Woodpecker. A sharp tapping that interfered with shortwave radios worldwide from 1976 to 1989. It was not a radar. It was a countdown. The structure still stands in the Chernobyl Exclusion Zone, 150 meters of rusting steel cantilevered against the sky.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: WOODPECKER-314", encoded: "NTRAG. ERQRZR: JBBQCRPXRE-314", cipher: "caesar", key: 13, payload: "WOODPECKER-314" },
      { type: "mission", text: "The Woodpecker has shifted frequency. Check Duga Radar Array at 03:14. Bring a radiation badge. The ticks are louder there.", encoded: "GUR JBBQCRPXRE UNF FUVSGRQ SERDHrapl...", cipher: "caesar", key: 13 },
      { type: "clue", text: "The door opens inward. The number is half of twenty-six.", encoded: "GUR QBBE BCRAF VAJNEQ. GUR AHZORE VF UNYS BS gjragl-fvk.", cipher: "caesar", key: 13 },
    ],
  },
  {
    id: "hashima",
    mhz: "9.18",
    name: "TOWER SEVEN",
    place: "Hashima Island",
    placeSlug: "hashima-island",
    color: "#e8a8a0",
    dimColor: "#8a5048",
    lore: "A numbers station that began broadcasting in 1987 from coordinates matching Hashima Island. The voice is female, calm, and counting down from numbers that have not been invented yet. She has been counting for 39 years.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: CONCRETE-5000", encoded: "ZTLIG. IVKVMXL: XLIXVIXL-5000", cipher: "atbash", payload: "CONCRETE-5000" },
      { type: "mission", text: "Five thousand people lived on a rock. Now only the concrete remembers. Visit Hashima. Count the windows. Report the number to BUNKER_7.", encoded: "Uirx tlirmg droo rgsh ziv wlmvcmg...", cipher: "atbash" },
      { type: "clue", text: "The concrete that remembers is the same concrete that forgets. The answer is in the apartment count.", encoded: "Gsv xlirxvm gszg ivnvmgli rh gsv hvnk...", cipher: "atbash" },
    ],
  },
  {
    id: "aokigahara",
    mhz: "15.60",
    name: "LOST EXPEDITION",
    place: "Aokigahara Forest",
    placeSlug: "aokigahara-forest",
    color: "#c9b18a",
    dimColor: "#6a5a4a",
    lore: "Recovered from the black box of Expedition Team 4. They reached the coordinates. Then they kept walking. This is what they sent back before the forest absorbed the signal.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: SILENCE-91", encoded: "SXLXVMGVC XLMG 4 GZEMG RG ...", cipher: "vigenere", key: "AOKI", payload: "SILENCE-91" },
      { type: "mission", text: "Expedition Team 4 walked into Aokigahara with six members. The black box recorded seven voices. Find the seventh. It is not a ghost.", encoded: "Sxlxvmgvc Xlmg 4 gzemg rg ...", cipher: "vigenere", key: "AOKI" },
      { type: "clue", text: "The trees grow in spirals. The silence has weight. When your compass fails, trust the roots. They point inward.", encoded: "Gsv givv hilt rm hkvmgzoh...", cipher: "vigenere", key: "AOKI" },
    ],
  },
  {
    id: "poveglia",
    mhz: "21.00",
    name: "STATIC VEIL",
    place: "Poveglia Island",
    placeSlug: "poveglia-island",
    color: "#b8a8d8",
    dimColor: "#6a5a8a",
    lore: "Not a signal. A curtain. The static between stations is not empty. It is full of things that have not happened yet, trying to get through. Poveglia is the thinnest point in the veil.",
    transmissions: [
      { type: "code", text: "AGENT. REDEEM: PLAGUE-95", encoded: "95-EVUALP :EMEER .TNEGA", cipher: "reverse", payload: "PLAGUE-95" },
      { type: "mission", text: "The tide carries voices. The plague doctors' tower still stands. At Poveglia, record the static at 03:14. The voices form coordinates.", encoded: ".ehT edit seirrac seicov ...", cipher: "reverse" },
      { type: "clue", text: "The static shaped itself into a face. It smiled. I smiled back before I could stop myself. Do not smile at the static.", encoded: ".eht citats depihs flesti ...", cipher: "reverse" },
    ],
  },
];

function applyCipher(text: string, cipher: string, key: string | number): string {
  switch (cipher) {
    case "caesar": {
      const shift = typeof key === "string" ? parseInt(key) || 0 : key;
      return text.split("").map((c) => {
        if (/[a-zA-Z]/.test(c)) {
          const base = c === c.toUpperCase() ? 65 : 97;
          return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
        }
        return c;
      }).join("");
    }
    case "atbash":
      return text.split("").map((c) => {
        if (/[a-z]/.test(c)) return String.fromCharCode(219 - c.charCodeAt(0));
        if (/[A-Z]/.test(c)) return String.fromCharCode(155 - c.charCodeAt(0));
        return c;
      }).join("");
    case "vigenere": {
      const k = String(key).toUpperCase().replace(/[^A-Z]/g, "");
      if (!k) return text;
      let ki = 0;
      return text.split("").map((c) => {
        if (/[a-zA-Z]/.test(c)) {
          const base = c === c.toUpperCase() ? 65 : 97;
          const shift = k.charCodeAt(ki % k.length) - 65;
          ki++;
          return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
        }
        return c;
      }).join("");
    }
    case "reverse":
      return text.split("").reverse().join("");
    default:
      return text;
  }
}

function getFrequencyData(text: string): number[] {
  const counts = new Array(26).fill(0);
  text.toUpperCase().replace(/[^A-Z]/g, "").split("").forEach((c) => {
    counts[c.charCodeAt(0) - 65]++;
  });
  const max = Math.max(...counts, 1);
  return counts.map((c) => c / max);
}

export default function SignalTab({ theme, onPushTerminal }: Props) {
  const [freqIndex, setFreqIndex] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [locked, setLocked] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<Frequency["transmissions"][0] | null>(null);
  const [typed, setTyped] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cipherGuess, setCipherGuess] = useState("caesar");
  const [keyGuess, setKeyGuess] = useState("");
  const [decodeResult, setDecodeResult] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSpectral, setShowSpectral] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const noiseNode = useRef<AudioBufferSourceNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const oscNode = useRef<OscillatorNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const freq = FREQUENCIES[freqIndex];

  const initAudio = useCallback(() => {
    if (audioEnabled) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtx.current = new AC();
    setAudioEnabled(true);
  }, [audioEnabled]);

  const playTone = useCallback((freqHz: number, duration: number, type: OscillatorType = "sine") => {
    if (!audioCtx.current || !audioEnabled) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freqHz;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [audioEnabled]);

  const stopAudio = useCallback(() => {
    try {
      noiseNode.current?.stop();
      noiseNode.current?.disconnect();
      oscNode.current?.stop();
      oscNode.current?.disconnect();
    } catch { /* already stopped */ }
    noiseNode.current = null;
    oscNode.current = null;
  }, []);

  const startStatic = useCallback(() => {
    if (!audioCtx.current || !audioEnabled) return;
    stopAudio();
    const ctx = audioCtx.current;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800 + freqIndex * 400;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = locked ? 0.03 : 0.12;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noiseNode.current = noise;
    gainNode.current = gain;
  }, [freqIndex, locked, audioEnabled, stopAudio]);

  const speakRobotic = useCallback((text: string) => {
    if (!audioCtx.current || !audioEnabled) return;
    const ctx = audioCtx.current;
    let t = ctx.currentTime + 0.15;

    const isVowel = (c: string) => "aeiou".includes(c.toLowerCase());
    const isConsonant = (c: string) => /[bcdfghjklmnpqrstvwxyz]/.test(c.toLowerCase());

    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 180 + freqIndex * 90;
    droneGain.gain.value = 0.015;
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(t);
    drone.stop(t + text.length * 0.09 + 1);

    text.split("").forEach((char) => {
      if (char === " ") { t += 0.12; return; }
      const c = char.toLowerCase();

      if (isVowel(c)) {
        const base = ctx.createOscillator();
        const formant = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const vowelMap: Record<string, [number, number]> = {
          a: [730, 1090], e: [660, 1720], i: [440, 1020],
          o: [520, 800], u: [350, 720],
        };
        const [f1, f2] = vowelMap[c] || [500, 1200];

        base.type = "sawtooth";
        base.frequency.value = 110;
        formant.type = "square";
        formant.frequency.value = f1;

        filter.type = "bandpass";
        filter.frequency.value = f2;
        filter.Q.value = 4;

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        base.connect(filter);
        formant.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        base.start(t); base.stop(t + 0.1);
        formant.start(t); formant.stop(t + 0.1);
      } else if (isConsonant(c)) {
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const conMap: Record<string, number> = {
          s: 5500, t: 3800, k: 2800, p: 200, b: 180,
          m: 250, n: 300, r: 1400, l: 900, d: 2200,
          g: 800, f: 5000, v: 4500, z: 6000, h: 7000,
        };

        filter.type = "bandpass";
        filter.frequency.value = conMap[c] || 1500;
        filter.Q.value = 1.5;

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
      } else if (/[0-9]/.test(c)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 600 + parseInt(c) * 80;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        t += 0.06;
      }
      t += 0.09;
    });
  }, [audioEnabled, freqIndex]);

  useEffect(() => {
    if (locked) return;
    const tick = () => {
      setSignalStrength((prev) => {
        const target = 35 + Math.random() * 55;
        return prev + (target - prev) * 0.15;
      });
    };
    const interval = setInterval(tick, 700);
    return () => clearInterval(interval);
  }, [freqIndex, locked]);

  useEffect(() => {
    if (!audioEnabled) return;
    if (locked) { stopAudio(); return; }
    startStatic();
    return () => stopAudio();
  }, [signalStrength, freqIndex, locked, audioEnabled, startStatic, stopAudio]);

  useEffect(() => {
    if (!showSpectral || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame: number;
    const draw = () => {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bars = 32;
      const barW = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.random() * (locked ? 80 : 40) * (signalStrength / 100);
        const hue = locked ? 120 + freqIndex * 30 : 60;
        ctx.fillStyle = locked ? `hsla(${hue}, 60%, 50%, 0.6)` : `hsla(0, 0%, 20%, 0.4)`;
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      }
      if (locked && decoded) {
        ctx.strokeStyle = `${freq.color}40`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * 0.05 + Date.now() * 0.002) * 20;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [showSpectral, locked, signalStrength, freqIndex, decoded, freq.color]);

  const lockSignal = useCallback(() => {
    initAudio();
    if (signalStrength < 75) {
      playTone(200, 0.3, "sawtooth");
      return;
    }
    playTone(880, 0.1, "sine");
    setTimeout(() => playTone(1100, 0.2, "sine"), 100);

    setLocked(true);
    setDecoding(true);
    setDecoded(null);
    setTyped("");
    setDecodeResult(null);
    setFailedAttempts(0);

    setTimeout(() => {
      const tx = freq.transmissions[Math.floor(Math.random() * freq.transmissions.length)];
      setDecoded(tx);
      setDecoding(false);
      setLog((prev) => [
        ...prev,
        `LOCKED ${freq.mhz} MHz // ${freq.name}`,
        `SIGNAL ACQUIRED. DECODING...`,
        `CIPHER DETECTED: ${tx.cipher.toUpperCase()}`,
        "",
      ]);
      setTimeout(() => speakRobotic(tx.text), 500);
    }, 2000 + Math.random() * 1000);
  }, [signalStrength, freq, initAudio, playTone, speakRobotic]);

  useEffect(() => {
    if (!decoded) return;
    let i = 0;
    setTyped("");
    const timer = setInterval(() => {
      i++;
      setTyped(decoded.encoded.slice(0, i));
      if (i >= decoded.encoded.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [decoded]);

  const attemptDecode = () => {
    if (!decoded) return;
    const guess = applyCipher(decoded.encoded, cipherGuess, keyGuess);
    if (guess === decoded.text) {
      playTone(1200, 0.15, "sine");
      setTimeout(() => playTone(1600, 0.3, "sine"), 150);
      setDecodeResult(guess);
      setLog((prev) => [...prev, `DECODE SUCCESSFUL.`, `CLEAR TEXT ACQUIRED.`, ""]);
    } else {
      playTone(150, 0.4, "sawtooth");
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setDecodeResult(null);
      setLog((prev) => [...prev, `DECODE FAILED. ATTEMPT ${nextFail}.`, ""]);
      if (nextFail >= 3) {
        setLog((prev) => [...prev, "SIGNAL LOST. RE-TUNE REQUIRED.", ""]);
        setLocked(false);
        setDecoded(null);
        setDecodeResult(null);
        setFailedAttempts(0);
      }
    }
  };

  const sendToTerminal = () => {
    if (!decodeResult) return;
    const lines = [
      `╔══════════════════════════════════════╗`,
      `║  INTERCEPTED TRANSMISSION            ║`,
      `║  FREQ: ${freq.mhz} MHz — ${freq.name.padEnd(14)}║`,
      `╠══════════════════════════════════════╣`,
      `║  ${decodeResult.slice(0, 36).padEnd(36)}║`,
      decodeResult.length > 36 ? `║  ${decodeResult.slice(36, 72).padEnd(36)}║` : `║  ${" ".repeat(36)}║`,
      `╚══════════════════════════════════════╝`,
    ];
    onPushTerminal?.(lines);
    setLog((prev) => [...prev, "Transcript forwarded to terminal.", ""]);
  };

  const freqData = decoded ? getFrequencyData(decoded.encoded) : [];

  return (
    <div className="space-y-4 md:space-y-5 text-[11px] md:text-[13px] font-mono">
      {!audioEnabled && (
        <button
          onClick={initAudio}
          className="w-full py-2 border border-[#9a8a72]/20 rounded text-[10px] uppercase tracking-wider text-[#9a8a72] hover:border-[#9a8a72]/40 transition-all active:scale-[0.98]"
        >
          <Volume2 size={12} className="inline mr-2" />
          Enable Audio Receiver
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: freq.color }} className={locked ? "animate-pulse" : ""} />
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: freq.color }}>{freq.name}</p>
            <p className="text-[9px] text-[#5a4e42]">{freq.mhz} MHz // {freq.place}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => { setFreqIndex((i) => (i - 1 + FREQUENCIES.length) % FREQUENCIES.length); setLocked(false); setDecoded(null); setDecodeResult(null); setFailedAttempts(0); }} className="p-1 border border-[#333] rounded hover:border-[#555] text-[#666] transition-colors active:scale-95"><ChevronLeft size={12} /></button>
          <button onClick={() => { setFreqIndex((i) => (i + 1) % FREQUENCIES.length); setLocked(false); setDecoded(null); setDecodeResult(null); setFailedAttempts(0); }} className="p-1 border border-[#333] rounded hover:border-[#555] text-[#666] transition-colors active:scale-95"><ChevronRight size={12} /></button>
        </div>
      </div>

      <div className="relative h-10 bg-[#050505] rounded border border-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] text-[#222]">
          {FREQUENCIES.map((f, i) => <span key={f.id} style={{ color: i === freqIndex ? freq.dimColor : undefined }}>{f.mhz}</span>)}
        </div>
        <motion.div className="absolute top-0 bottom-0 w-px bg-white/30" animate={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />
        <div className="absolute top-0 bottom-0 w-20 blur-xl" style={{ left: `${(freqIndex / (FREQUENCIES.length - 1)) * 100}%`, backgroundColor: `${freq.color}12` }} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-[#444]">
          <span className="flex items-center gap-1"><Activity size={10} /> Signal Strength</span>
          <span style={{ color: signalStrength > 75 ? freq.color : "#444" }}>{signalStrength.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#1a1a1a]">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: freq.color }} animate={{ width: `${signalStrength}%` }} transition={{ duration: 0.3 }} />
        </div>
        {!locked && (
          <button onClick={lockSignal} disabled={signalStrength < 75} className="w-full mt-2 py-2.5 border rounded text-[10px] uppercase tracking-wider transition-all disabled:opacity-15 disabled:cursor-not-allowed active:scale-[0.98]" style={{ borderColor: signalStrength > 75 ? `${freq.color}50` : "#222", color: signalStrength > 75 ? freq.color : "#444", backgroundColor: signalStrength > 75 ? `${freq.color}08` : "transparent" }}>
            {signalStrength < 75 ? "Signal too weak — tune and wait" : "Lock Signal & Decode"}
          </button>
        )}
        {locked && <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider" style={{ color: freq.color }}><Lock size={10} /> Signal locked // {freq.mhz} MHz</div>}
      </div>

      <div className="border-l-2 pl-3 py-1" style={{ borderColor: `${freq.color}25` }}>
        <p className="text-[11px] md:text-xs leading-relaxed italic" style={{ color: freq.dimColor }}>{freq.lore}</p>
      </div>

      <AnimatePresence>
        {decoding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 bg-[#050505] rounded border border-[#1a1a1a] text-center space-y-2">
            <Zap size={18} className="mx-auto animate-pulse" style={{ color: freq.color }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: freq.dimColor }}>Acquiring signal...</p>
            <div className="h-1 w-32 mx-auto bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: freq.color }} animate={{ width: ["0%", "100%"] }} transition={{ duration: 2, ease: "linear" }} />
            </div>
          </motion.div>
        )}

        {decoded && !decoding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#050505] border rounded overflow-hidden" style={{ borderColor: `${freq.color}20` }}>
            <div className="p-3 md:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: freq.dimColor }}>Encoded // {decoded.cipher.toUpperCase()}</span>
                {decodeResult && <button onClick={sendToTerminal} className="text-[9px] uppercase tracking-wider px-2 py-1 border rounded hover:opacity-80 transition-opacity" style={{ borderColor: `${freq.color}30`, color: freq.dimColor }}>Send to terminal</button>}
              </div>
              <div className="p-2.5 bg-[#0a0a0a] rounded border border-[#1a1a1a]">
                <p className="text-sm md:text-base leading-relaxed font-mono" style={{ color: freq.color }}>{typed}<span className="inline-block w-2 h-4 ml-1 align-middle animate-pulse" style={{ backgroundColor: freq.color }} /></p>
              </div>

              {!decodeResult && (
                <div className="space-y-2 border-t border-[#1a1a1a] pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={cipherGuess} onChange={(e) => setCipherGuess(e.target.value)} className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1.5 text-[11px] text-[#ddd0bc] outline-none">
                      <option value="caesar">Caesar Shift</option>
                      <option value="atbash">Atbash</option>
                      <option value="vigenere">Vigenère</option>
                      <option value="reverse">Reverse</option>
                    </select>
                    <input value={keyGuess} onChange={(e) => setKeyGuess(e.target.value)} placeholder={cipherGuess === "caesar" ? "Shift (1-25)" : cipherGuess === "vigenere" ? "Key word" : "No key needed"} disabled={cipherGuess === "reverse"} className="bg-[#0a0a0a] border border-[#333] rounded px-2 py-1.5 text-[11px] text-[#ddd0bc] outline-none placeholder:text-[#444] disabled:opacity-30" />
                  </div>
                  <button onClick={attemptDecode} className="w-full py-2 border rounded text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all" style={{ borderColor: `${freq.color}40`, color: freq.color }}>Attempt Decryption</button>
                  {failedAttempts > 0 && <p className="text-[9px] text-[#a05050]">Failed attempts: {failedAttempts}/3. Signal will be lost.</p>}
                </div>
              )}

              {decodeResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-[#0c0a08] rounded border border-[#9a8a72]/20">
                  <p className="text-[9px] uppercase tracking-widest text-[#5a4e42] mb-1">Decoded</p>
                  <p className="text-sm text-[#c9b18a] leading-relaxed">{decodeResult}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <button onClick={() => setShowSpectral((s) => !s)} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#555] hover:text-[#777] transition-colors"><Activity size={10} /> {showSpectral ? "Hide" : "Show"} Spectral Analysis</button>
        <AnimatePresence>
          {showSpectral && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
              <canvas ref={canvasRef} width={300} height={80} className="w-full h-20 bg-[#050505] rounded border border-[#1a1a1a]" />
              {decoded && (
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-[#444]">Letter Frequency</p>
                  <div className="flex items-end gap-px h-16">
                    {freqData.map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 100}%`, backgroundColor: h > 0.3 ? `${freq.color}60` : `${freq.color}20`, minWidth: 2 }} title={`${String.fromCharCode(65 + i)}: ${Math.round(h * 100)}%`} />)}
                  </div>
                  <p className="text-[8px] text-[#444] leading-tight">Frequency analysis reveals cipher patterns. High bars suggest common letters (E, T, A, O, I, N).</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {log.length > 0 && (
        <div className="space-y-1 border-t border-[#1a1a1a] pt-3">
          <p className="text-[9px] uppercase tracking-widest text-[#444]">Session Log</p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {log.map((entry, i) => <p key={i} className={`text-[10px] ${entry.startsWith("DECODE FAILED") ? "text-[#a05050]" : entry.startsWith("DECODE SUCCESS") ? "text-[#7a9a6a]" : "text-[#555]"}`}>{entry}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}