"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Activity, Zap, Volume2, VolumeX, Lock, Unlock, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { markTransmission } from "@/hooks/useDustLevel";

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
    color: "#9a8a72",
    dimColor: "#7a6e5e",
    lore: "The Russian Woodpecker. A sharp tapping that interfered with shortwave radios worldwide from 1976 to 1989. Officially an over-the-horizon radar. BUNKER_7 believes otherwise.",
    transmissions: [
      { type: "code", text: "ARCHIVE KEY: WOODPECKER-314", encoded: "NTRAGV XLRL: JBBQCRPXRE-314", cipher: "caesar", key: 13, payload: "WOODPECKER-314" },
      { type: "mission", text: "The Woodpecker has shifted frequency. Check Duga Radar Array at 03:14. Bring a radiation badge.", encoded: "GUR JBBQCRPXRE UNF FUVSGRQ SERDHrapl...", cipher: "caesar", key: 13 },
      { type: "clue", text: "The door opens inward. The number is half of twenty-six.", encoded: "GUR QBBE BCRAF VAJNEQ. GUR AHZORE VF UNYS BS gjragl-fvk.", cipher: "caesar", key: 13 },
    ],
  },
  {
    id: "hashima",
    mhz: "9.18",
    name: "THE COUNTING HOUSE",
    place: "Hashima Island",
    placeSlug: "hashima-island",
    color: "#c4785a",
    dimColor: "#a06048",
    lore: "A numbers station broadcasting since 1987. The voice counts down from numbers that have not been invented yet. She has been counting for 39 years.",
    transmissions: [
      { type: "code", text: "ARCHIVE KEY: CONCRETE-5000", encoded: "ZTLIG. IVKVMXL: XLIXVIXL-5000", cipher: "atbash", payload: "CONCRETE-5000" },
      { type: "mission", text: "Five thousand people lived on a rock. Now only the concrete remembers. Visit Hashima. Count the windows.", encoded: "Uirx tlirmg droo rgsh ziv wlmvcmg...", cipher: "atbash" },
      { type: "clue", text: "The concrete that remembers is the same concrete that forgets.", encoded: "Gsv xlirxvm gszg ivnvmgli rh gsv hvnk...", cipher: "atbash" },
    ],
  },
  {
    id: "aokigahara",
    mhz: "15.60",
    name: "LOST EXPEDITION",
    place: "Aokigahara Forest",
    placeSlug: "aokigahara-forest",
    color: "#b8a080",
    dimColor: "#8a7060",
    lore: "Recovered from the black box of Expedition Team 4. They reached the coordinates. Then they kept walking.",
    transmissions: [
      { type: "code", text: "ARCHIVE KEY: SILENCE-91", encoded: "SXLXVMGVC XLMG 4 GZEMG RG ...", cipher: "vigenere", key: "AOKI", payload: "SILENCE-91" },
      { type: "mission", text: "Expedition Team 4 walked into Aokigahara with six members. The black box recorded seven voices.", encoded: "Sxlxvmgvc Xlmg 4 gzemg rg ...", cipher: "vigenere", key: "AOKI" },
      { type: "clue", text: "The trees grow in spirals. The silence has weight. When your compass fails, trust the roots.", encoded: "Gsv givv hilt rm hkvmgzoh...", cipher: "vigenere", key: "AOKI" },
    ],
  },
  {
    id: "poveglia",
    mhz: "21.00",
    name: "STATIC VEIL",
    place: "Poveglia Island",
    placeSlug: "poveglia-island",
    color: "#8a7a6a",
    dimColor: "#6a5a4a",
    lore: "Not a signal. A curtain. The static between stations is full of things that have not happened yet, trying to get through.",
    transmissions: [
      { type: "code", text: "ARCHIVE KEY: PLAGUE-95", encoded: "95-EVUALP :EYRK EVIHCRA", cipher: "reverse", payload: "PLAGUE-95" },
      { type: "mission", text: "The tide carries voices. At Poveglia, record the static at 03:14. The voices form coordinates.", encoded: ".ehT edit seirrac seicov ...", cipher: "reverse" },
      { type: "clue", text: "The static shaped itself into a face. It smiled. Do not smile at the static.", encoded: ".eht citats depihs flesti ...", cipher: "reverse" },
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

function notifyDustChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vp-dust-change"));
  }
}

export default function SignalTab({ theme, onPushTerminal }: Props) {
  const [breachActive, setBreachActive] = useState(false);

  useEffect(() => {
    const handler = () => setBreachActive(true);
    window.addEventListener("breach-triggered", handler);
    return () => window.removeEventListener("breach-triggered", handler);
  }, []);

  const [freqIndex, setFreqIndex] = useState(0);
  const [needle, setNeedle] = useState(50);
  const [sweetSpot, setSweetSpot] = useState(() => 20 + Math.random() * 60);
  const [locked, setLocked] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<Frequency["transmissions"][0] | null>(null);
  const [typed, setTyped] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [cipherGuess, setCipherGuess] = useState("caesar");
  const [keyGuess, setKeyGuess] = useState("");
  const [decodeResult, setDecodeResult] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSpectral, setShowSpectral] = useState(false);
  const [interference, setInterference] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseNode = useRef<AudioBufferSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const freq = FREQUENCIES[freqIndex];
  const sweetSpotWidth = 10;

  const signalStrength = useMemo(() => {
    const dist = Math.abs(needle - sweetSpot);
    return Math.max(0, Math.min(100, 100 - dist * (100 / sweetSpotWidth)));
  }, [needle, sweetSpot]);

  useEffect(() => {
    if (locked) return;
    const drift = setInterval(() => {
      setSweetSpot((prev) => {
        const jitter = breachActive
          ? (Math.random() - 0.5) * 24
          : (Math.random() - 0.5) * 12;
        return Math.max(5, Math.min(95, prev + jitter));
      });
    }, 900);
    const burst = setInterval(() => {
      if (Math.random() > 0.6) {
        setInterference(true);
        setSweetSpot((prev) => {
          const jump = (Math.random() - 0.5) * 35;
          return Math.max(5, Math.min(95, prev + jump));
        });
        setTimeout(() => setInterference(false), 200);
      }
    }, 3000);
    return () => {
      clearInterval(drift);
      clearInterval(burst);
    };
  }, [freqIndex, locked, breachActive]);

  useEffect(() => {
    if (!masterGainRef.current || !audioCtx.current) return;
    const effective = muted ? 0 : volume;
    masterGainRef.current.gain.setTargetAtTime(effective, audioCtx.current.currentTime, 0.05);
  }, [volume, muted]);

  useEffect(() => {
    return () => {
      stopStatic();
      if (masterGainRef.current && audioCtx.current) {
        try {
          masterGainRef.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 0.02);
        } catch { }
      }
    };
  }, []);

  const initAudio = useCallback(() => {
    if (audioEnabled) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    audioCtx.current = ctx;

    const master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    setAudioEnabled(true);
  }, [audioEnabled, volume, muted]);

  const playTone = useCallback((freqHz: number, duration: number, type: OscillatorType = "sine") => {
    const ctx = audioCtx.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freqHz;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const stopStatic = useCallback(() => {
    try {
      noiseNode.current?.stop();
      noiseNode.current?.disconnect();
    } catch { }
    noiseNode.current = null;
  }, []);

  const startStatic = useCallback(() => {
    const ctx = audioCtx.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    stopStatic();

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600 + freqIndex * 350;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.02 + (1 - signalStrength / 100) * 0.14;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start();
    noiseNode.current = noise;
  }, [freqIndex, signalStrength, stopStatic]);

  useEffect(() => {
    if (!audioEnabled || locked) return;
    startStatic();
    return () => stopStatic();
  }, [signalStrength, freqIndex, locked, audioEnabled, startStatic, stopStatic]);

  const speakRobotic = useCallback((text: string) => {
    const ctx = audioCtx.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    let t = ctx.currentTime + 0.15;
    const isVowel = (c: string) => "aeiou".includes(c.toLowerCase());
    const isConsonant = (c: string) => /[bcdfghjklmnpqrstvwxyz]/.test(c.toLowerCase());

    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 180 + freqIndex * 90;
    droneGain.gain.value = 0.015;
    drone.connect(droneGain);
    droneGain.connect(master);
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
        gain.connect(master);

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
        gain.connect(master);
        noise.start(t);
      } else if (/[0-9]/.test(c)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 600 + parseInt(c) * 80;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.2);
        t += 0.06;
      }
      t += 0.09;
    });
  }, [freqIndex]);

  const selectFrequency = (index: number) => {
    setFreqIndex(index);
    setNeedle(50);
    setSweetSpot(10 + Math.random() * 80);
    setLocked(false);
    setDecoded(null);
    setDecodeResult(null);
    setFailedAttempts(0);
    setLog([]);
    setInterference(false);
  };

  const nudgeNeedle = (dir: number) => {
    initAudio();
    setNeedle((n) => Math.max(0, Math.min(100, n + dir * 3)));
    playTone(440 + dir * 100, 0.05, "sine");
  };

  const lockSignal = useCallback(() => {
    initAudio();
    if (signalStrength < 75) {
      playTone(200, 0.3, "sawtooth");
      return;
    }
    stopStatic();
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
  }, [signalStrength, freq, initAudio, playTone, speakRobotic, stopStatic]);

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
      localStorage.setItem(`vp-signal-${freq.placeSlug}`, "true");
      markTransmission();
      notifyDustChange();
      setLog((prev) => [...prev, `DECODE SUCCESSFUL.`, `CLEAR TEXT ACQUIRED.`, ""]);
    } else {
      playTone(150, 0.4, "sawtooth");
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setDecodeResult(null);
      setLog((prev) => [...prev, `DECODE FAILED. ATTEMPT ${nextFail}/3.`, ""]);
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

  useEffect(() => {
    if (!showSpectral || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame: number;
    const draw = () => {
      ctx.fillStyle = "#0c0a08";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const bars = 32;
      const barW = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.random() * (locked ? 80 : 40) * (signalStrength / 100);
        const hue = locked ? 25 + freqIndex * 8 : 30;
        const sat = locked ? "35%" : "10%";
        ctx.fillStyle = locked
          ? `hsla(${hue}, ${sat}, 45%, 0.5)`
          : `hsla(30, 10%, 20%, 0.3)`;
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      }
      if (locked && decoded) {
        ctx.strokeStyle = "rgba(154,138,114,0.12)";
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
  }, [showSpectral, locked, signalStrength, freqIndex, decoded]);

  const freqData = decoded ? getFrequencyData(decoded.encoded) : [];
  const meterColor = signalStrength >= 75 ? "#7a9a6a" : signalStrength >= 40 ? "#9a8a5a" : "#c4785a";

  return (
    <div className="space-y-5 text-[11px] md:text-[13px] font-mono select-none">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: theme.dim }}>
          Shortwave Signal Acquisition
        </p>
        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: theme.dim }}>
          The signal is unstable. It drifts and jumps. Track it, anticipate it, lock it before it vanishes.
        </p>
      </div>

      {!audioEnabled ? (
        <button
          onClick={initAudio}
          className="w-full py-2.5 border rounded text-[10px] uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ borderColor: `${theme.primary}25`, color: theme.primary }}
        >
          <Volume2 size={12} />
          Enable Audio Receiver
        </button>
      ) : (
        <div
          className="flex items-center gap-3 p-3 rounded-lg border"
          style={{ borderColor: `${theme.primary}15`, backgroundColor: `${theme.primary}04` }}
        >
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
            style={{ borderColor: `${theme.primary}30`, color: theme.primary }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider" style={{ color: theme.dim }}>
              <span>Receiver Volume</span>
              <span>{muted ? "MUTED" : `${Math.round(volume * 100)}%`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setMuted(false);
              }}
              className="w-full h-1 cursor-pointer"
              style={{ accentColor: "#9a8a72" }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {FREQUENCIES.map((f, i) => {
          const active = i === freqIndex;
          return (
            <button
              key={f.id}
              onClick={() => selectFrequency(i)}
              className="relative text-left p-3 rounded-lg border transition-all active:scale-[0.98]"
              style={{
                borderColor: active ? `${f.color}50` : "rgba(122,107,82,0.12)",
                backgroundColor: active ? `${f.color}08` : "transparent",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Radio size={12} style={{ color: active ? f.color : "#5a4e42" }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: active ? f.color : theme.dim }}>
                  {f.mhz} MHz
                </span>
              </div>
              <p className="text-xs font-bold" style={{ color: active ? theme.primary : theme.dim }}>{f.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: active ? f.dimColor : "#5a4e42" }}>{f.place}</p>
              {active && (
                <motion.div
                  layoutId="freq-glow"
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ boxShadow: `inset 0 0 20px ${f.color}10` }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className={`p-4 rounded-lg border space-y-3 transition-all ${interference ? "animate-pulse" : ""}`}
        style={{
          borderColor: interference ? "rgba(196,120,90,0.15)" : `${freq.color}15`,
          backgroundColor: interference ? "rgba(196,120,90,0.04)" : `${freq.color}04`,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: freq.dimColor }}>
            Tuner // {freq.name}
          </span>
          <div className="flex items-center gap-2">
            {interference && (
              <span className="flex items-center gap-1 text-[10px] animate-pulse" style={{ color: "#c4785a" }}>
                <AlertTriangle size={10} />
                INTERFERENCE
              </span>
            )}
            <span className="text-[10px]" style={{ color: theme.primary }}>
              Needle: {needle.toFixed(0)}
            </span>
          </div>
        </div>

        <div
          className="relative h-10 rounded border overflow-hidden"
          style={{ background: "#0c0a08", borderColor: "rgba(122,107,82,0.12)" }}
        >
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {Array.from({ length: 21 }, (_, i) => (
              <div
                key={i}
                className="w-px"
                style={{
                  height: i % 5 === 0 ? "12px" : "6px",
                  background: i % 5 === 0 ? "rgba(122,107,82,0.2)" : "rgba(122,107,82,0.08)",
                }}
              />
            ))}
          </div>
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 z-10"
            style={{ background: "rgba(221,208,188,0.6)" }}
            animate={{ left: `${needle}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          />
          <div
            className="absolute top-0 bottom-0 w-4 blur-lg z-0"
            style={{ left: `${needle}%`, backgroundColor: `${freq.color}20`, transform: "translateX(-50%)" }}
          />
          <div
            className="absolute top-0 bottom-0 rounded opacity-[0.04]"
            style={{
              left: `${Math.max(0, sweetSpot - sweetSpotWidth / 2)}%`,
              width: `${sweetSpotWidth}%`,
              backgroundColor: freq.color,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => {
              nudgeNeedle(-1);
              const interval = setInterval(() => nudgeNeedle(-1), 120);
              const up = () => clearInterval(interval);
              document.addEventListener("mouseup", up, { once: true });
            }}
            className="flex-1 py-2.5 border rounded transition-all active:scale-95 flex items-center justify-center gap-1"
            style={{ color: theme.dim, borderColor: "rgba(122,107,82,0.15)" }}
            aria-label="Tune left"
          >
            <ChevronLeft size={14} /> Tune Left
          </button>
          <button
            onMouseDown={() => {
              nudgeNeedle(1);
              const interval = setInterval(() => nudgeNeedle(1), 120);
              const up = () => clearInterval(interval);
              document.addEventListener("mouseup", up, { once: true });
            }}
            className="flex-1 py-2.5 border rounded transition-all active:scale-95 flex items-center justify-center gap-1"
            style={{ color: theme.dim, borderColor: "rgba(122,107,82,0.15)" }}
            aria-label="Tune right"
          >
            Tune Right <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5" style={{ color: theme.dim }}>
              <Activity size={10} />
              Signal Strength
            </span>
            <span style={{ color: meterColor, fontWeight: signalStrength >= 75 ? 700 : 400 }}>
              {signalStrength.toFixed(0)}%
              {signalStrength >= 75 ? " — LOCK READY" : signalStrength >= 40 ? " — ACQUIRING" : " — NOISE"}
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden relative border"
            style={{ background: "#0c0a08", borderColor: "rgba(122,107,82,0.1)" }}
          >
            <div className="absolute left-[75%] top-0 bottom-0 w-px z-10" style={{ background: "rgba(122,107,82,0.15)" }} />
            <motion.div
              className="h-full rounded-full relative"
              style={{ backgroundColor: meterColor }}
              animate={{ width: `${signalStrength}%` }}
              transition={{ duration: 0.15 }}
            >
              {signalStrength >= 75 && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ backgroundColor: "#7a9a6a" }}
                />
              )}
            </motion.div>
          </div>
        </div>

        <button
          onClick={lockSignal}
          disabled={signalStrength < 75 || locked}
          className="w-full py-3 rounded-lg border text-[11px] uppercase tracking-[0.15em] font-bold transition-all disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            borderColor: signalStrength >= 75 ? `${meterColor}70` : "rgba(122,107,82,0.1)",
            color: signalStrength >= 75 ? meterColor : "#5a4e42",
            backgroundColor: signalStrength >= 75 ? `${meterColor}12` : "transparent",
            opacity: signalStrength < 75 ? 0.5 : 1,
          }}
        >
          {locked ? <Lock size={14} /> : <Unlock size={14} />}
          {locked ? "Signal Locked" : signalStrength >= 75 ? "Lock Signal & Decode" : "Signal Too Weak — Adjust Tuner"}
        </button>
      </div>

      <div className="border-l-2 pl-3 py-1" style={{ borderColor: `${freq.color}30` }}>
        <p className="text-xs leading-relaxed italic" style={{ color: freq.dimColor }}>
          {freq.lore}
        </p>
      </div>

      <AnimatePresence>
        {decoding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-lg border text-center space-y-3"
            style={{ background: "#0c0a08", borderColor: "rgba(122,107,82,0.1)" }}
          >
            <Zap size={20} className="mx-auto animate-pulse" style={{ color: freq.color }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: freq.dimColor }}>
              Acquiring transmission...
            </p>
            <div className="h-1.5 w-40 mx-auto rounded-full overflow-hidden" style={{ background: "rgba(122,107,82,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: freq.color }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {decoded && !decoding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border rounded-lg overflow-hidden"
            style={{ background: "#0c0a08", borderColor: `${freq.color}25` }}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: freq.dimColor }}>
                  Encoded // {decoded.cipher.toUpperCase()}
                </span>
                {decodeResult && (
                  <button
                    onClick={sendToTerminal}
                    className="text-[10px] uppercase tracking-wider px-2.5 py-1 border rounded hover:opacity-80 transition-opacity"
                    style={{ borderColor: `${freq.color}30`, color: freq.dimColor }}
                  >
                    Send to terminal
                  </button>
                )}
              </div>

              <div
                className="p-3 rounded border"
                style={{ background: "rgba(18,14,10,0.6)", borderColor: "rgba(122,107,82,0.1)" }}
              >
                <p className="text-sm md:text-base leading-relaxed font-mono" style={{ color: freq.color }}>
                  {typed}
                  <span className="inline-block w-2 h-4 ml-1 align-middle animate-pulse" style={{ backgroundColor: freq.color }} />
                </p>
              </div>

              {!decodeResult && (
                <div className="space-y-3 border-t pt-4" style={{ borderColor: "rgba(122,107,82,0.08)" }}>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={cipherGuess}
                      onChange={(e) => setCipherGuess(e.target.value)}
                      className="rounded px-2 py-2 text-[11px] outline-none"
                      style={{ background: "rgba(18,14,10,0.6)", border: "1px solid rgba(122,107,82,0.15)", color: theme.primary }}
                    >
                      <option value="caesar">Caesar Shift</option>
                      <option value="atbash">Atbash</option>
                      <option value="vigenere">Vigenère</option>
                      <option value="reverse">Reverse</option>
                    </select>
                    <input
                      value={keyGuess}
                      onChange={(e) => setKeyGuess(e.target.value)}
                      placeholder={cipherGuess === "caesar" ? "Shift (1-25)" : cipherGuess === "vigenere" ? "Key word" : "No key needed"}
                      disabled={cipherGuess === "reverse"}
                      className="rounded px-2 py-2 text-[11px] outline-none placeholder:opacity-20 disabled:opacity-30"
                      style={{ background: "rgba(18,14,10,0.6)", border: "1px solid rgba(122,107,82,0.15)", color: theme.primary }}
                    />
                  </div>

                  <button
                    onClick={attemptDecode}
                    className="w-full py-2.5 border rounded text-[10px] uppercase tracking-wider font-bold active:scale-[0.98] transition-all"
                    style={{ borderColor: `${freq.color}50`, color: freq.color }}
                  >
                    Attempt Decryption
                  </button>

                  {failedAttempts > 0 && (
                    <p className="text-[10px]" style={{ color: "#c4785a" }}>
                      Failed attempts: {failedAttempts}/3. Three failures will lose the signal.
                    </p>
                  )}
                </div>
              )}

              {decodeResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded border"
                  style={{ background: "rgba(18,14,10,0.6)", borderColor: "rgba(154,138,114,0.15)" }}
                >
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: theme.dim }}>Decoded</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#ddd0bc" }}>{decodeResult}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <button
          onClick={() => setShowSpectral((s) => !s)}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest transition-colors hover:opacity-80"
          style={{ color: theme.dim }}
        >
          <Activity size={10} />
          {showSpectral ? "Hide" : "Show"} Spectral Analysis
        </button>

        <AnimatePresence>
          {showSpectral && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <canvas ref={canvasRef} width={300} height={80} className="w-full h-20 rounded border" style={{ background: "#0c0a08", borderColor: "rgba(122,107,82,0.1)" }} />

              {decoded && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.dim }}>Letter Frequency</p>
                  <div className="flex items-end gap-px h-16">
                    {freqData.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${h * 100}%`,
                          backgroundColor: h > 0.3 ? `${freq.color}60` : `${freq.color}15`,
                          minWidth: 2,
                        }}
                        title={`${String.fromCharCode(65 + i)}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] leading-tight" style={{ color: theme.dim }}>
                    Frequency analysis reveals cipher patterns. High bars suggest common letters (E, T, A, O, I, N).
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {log.length > 0 && (
        <div className="space-y-1 border-t pt-3" style={{ borderColor: "rgba(122,107,82,0.08)" }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: theme.dim }}>Session Log</p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {log.map((entry, i) => (
              <p
                key={i}
                className="text-[10px]"
                style={{
                  color: entry.startsWith("DECODE FAILED")
                    ? "#c4785a"
                    : entry.startsWith("DECODE SUCCESS")
                    ? "#7a9a6a"
                    : theme.dim,
                }}
              >
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}