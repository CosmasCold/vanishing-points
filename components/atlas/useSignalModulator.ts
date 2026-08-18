import { useEffect, useRef, useState, useCallback } from "react";
import { getSharedAudioContext } from "@/lib/sharedAudioContext";

interface DialState {
  a: number;
  b: number;
  c: number;
}

interface ModulatorConfig {
  activeDials: DialState;
  targetDials: DialState;
  isProcessing: boolean;
  isUnlocked: boolean;
  baseStaticVolume?: number;
  baseCarrierVolume?: number;
}

/**
 * HIGH-PERFORMANCE PROCEDURAL SIGNAL TUNING & STATIC MODULATOR HOOK
 *
 * Uses the application's shared AudioContext.
 *
 * IMPORTANT:
 * This hook owns the Web Audio nodes it creates, but it does NOT own
 * the AudioContext itself. The shared AudioContext must never be closed
 * by an individual component.
 */
export function useSignalModulator({
  activeDials,
  targetDials,
  isProcessing,
  isUnlocked,
  baseStaticVolume = 0.15,
  baseCarrierVolume = 0.08,
}: ModulatorConfig) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Audio Node Refs
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const carrierGainRef = useRef<GainNode | null>(null);

  const driftLfoRef = useRef<OscillatorNode | null>(null);
  const driftGainRef = useRef<GainNode | null>(null);

  const masterGainRef = useRef<GainNode | null>(null);

  // Calculates normalized 3D dial vector offset distance [0..1]
  const getTuningDistance = useCallback((): number => {
    const maxVal = 21;

    const diffA = Math.min(
      Math.abs(activeDials.a - targetDials.a),
      maxVal - Math.abs(activeDials.a - targetDials.a)
    );

    const diffB = Math.min(
      Math.abs(activeDials.b - targetDials.b),
      maxVal - Math.abs(activeDials.b - targetDials.b)
    );

    const diffC = Math.min(
      Math.abs(activeDials.c - targetDials.c),
      maxVal - Math.abs(activeDials.c - targetDials.c)
    );

    const dist = Math.sqrt(
      diffA * diffA +
        diffB * diffB +
        diffC * diffC
    );

    const maxDist = Math.sqrt(
      10.5 * 10.5 +
        10.5 * 10.5 +
        10.5 * 10.5
    );

    return Math.min(
      1.0,
      dist / (maxDist || 1)
    );
  }, [activeDials, targetDials]);

  const tuningAccuracy = 1 - getTuningDistance();

  /**
   * Lazily initialize the signal modulator using the application's
   * shared AudioContext.
   *
   * This function NEVER creates or closes its own AudioContext.
   */
  const initAudio = useCallback(() => {
    if (typeof window === "undefined") return;

    const ctx = getSharedAudioContext();

    if (!ctx || ctx.state === "closed") {
      console.warn(
        "[Web Audio Modulator] Shared AudioContext unavailable."
      );
      return;
    }

    audioCtxRef.current = ctx;

    if (ctx.state === "suspended") {
      void ctx.resume().catch((error) => {
        console.warn(
          "[Web Audio Modulator] Failed to resume shared AudioContext:",
          error
        );
      });
    }

    /*
     * If this hook already has live nodes, do not create another graph.
     */
    if (
      noiseSourceRef.current ||
      carrierOscRef.current ||
      driftLfoRef.current
    ) {
      setIsActive(true);
      return;
    }

    try {
      const now = ctx.currentTime;

      // ── 1. MASTER OUTPUT SHIELDING ──
      const masterGain = ctx.createGain();

      masterGain.gain.setValueAtTime(
        1.0,
        now
      );

      masterGain.connect(ctx.destination);

      masterGainRef.current = masterGain;

      // ── 2. ATMOSPHERIC WHITE NOISE ──
      const bufferSize = 2 * ctx.sampleRate;

      const noiseBuffer = ctx.createBuffer(
        1,
        bufferSize,
        ctx.sampleRate
      );

      const data =
        noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] =
          Math.random() * 2 - 1;
      }

      const noiseSource =
        ctx.createBufferSource();

      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter =
        ctx.createBiquadFilter();

      noiseFilter.type = "bandpass";

      noiseFilter.frequency.setValueAtTime(
        1600,
        now
      );

      noiseFilter.Q.setValueAtTime(
        1.2,
        now
      );

      const noiseGain =
        ctx.createGain();

      noiseGain.gain.setValueAtTime(
        baseStaticVolume,
        now
      );

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start(now);

      noiseSourceRef.current =
        noiseSource;

      noiseFilterRef.current =
        noiseFilter;

      noiseGainRef.current =
        noiseGain;

      // ── 3. CLEAN SIGNAL CARRIER ──
      const carrierOsc =
        ctx.createOscillator();

      carrierOsc.type = "sine";

      carrierOsc.frequency.setValueAtTime(
        800.0,
        now
      );

      const carrierGain =
        ctx.createGain();

      carrierGain.gain.setValueAtTime(
        0.0,
        now
      );

      carrierOsc.connect(carrierGain);
      carrierGain.connect(masterGain);

      carrierOsc.start(now);

      carrierOscRef.current =
        carrierOsc;

      carrierGainRef.current =
        carrierGain;

      // ── 4. IONOSPHERIC DRIFT LFO ──
      const driftLfo =
        ctx.createOscillator();

      driftLfo.type = "triangle";

      driftLfo.frequency.setValueAtTime(
        1.5,
        now
      );

      const driftGain =
        ctx.createGain();

      driftGain.gain.setValueAtTime(
        18.0,
        now
      );

      driftLfo.connect(driftGain);
      driftGain.connect(
        carrierOsc.frequency
      );

      driftLfo.start(now);

      driftLfoRef.current =
        driftLfo;

      driftGainRef.current =
        driftGain;

      setIsActive(true);
    } catch (error) {
      console.warn(
        "[Web Audio Modulator] Failed to energize static nodes:",
        error
      );

      /*
       * Clean up anything that may have been partially created.
       * Do NOT close the shared AudioContext.
       */
      try {
        noiseSourceRef.current?.disconnect();
      } catch {}

      try {
        noiseFilterRef.current?.disconnect();
      } catch {}

      try {
        noiseGainRef.current?.disconnect();
      } catch {}

      try {
        carrierOscRef.current?.disconnect();
      } catch {}

      try {
        carrierGainRef.current?.disconnect();
      } catch {}

      try {
        driftLfoRef.current?.disconnect();
      } catch {}

      try {
        driftGainRef.current?.disconnect();
      } catch {}

      try {
        masterGainRef.current?.disconnect();
      } catch {}

      noiseSourceRef.current = null;
      noiseFilterRef.current = null;
      noiseGainRef.current = null;
      carrierOscRef.current = null;
      carrierGainRef.current = null;
      driftLfoRef.current = null;
      driftGainRef.current = null;
      masterGainRef.current = null;

      setIsActive(false);
    }
  }, [baseStaticVolume]);

  const stopAudio = useCallback(() => {
    setIsActive(false);

    const ctx =
      audioCtxRef.current;

    const masterGain =
      masterGainRef.current;

    if (
      ctx &&
      ctx.state !== "closed" &&
      masterGain
    ) {
      try {
        masterGain.gain.setTargetAtTime(
          0,
          ctx.currentTime,
          0.05
        );
      } catch {}
    }
  }, []);

  /**
   * Component cleanup.
   *
   * IMPORTANT:
   * We stop and disconnect ONLY the nodes owned by this hook.
   *
   * The shared AudioContext remains alive for the rest of the
   * application.
   */
  useEffect(() => {
    return () => {
      setIsActive(false);

      try {
        noiseSourceRef.current?.stop();
      } catch {}

      try {
        carrierOscRef.current?.stop();
      } catch {}

      try {
        driftLfoRef.current?.stop();
      } catch {}

      try {
        noiseSourceRef.current?.disconnect();
      } catch {}

      try {
        noiseFilterRef.current?.disconnect();
      } catch {}

      try {
        noiseGainRef.current?.disconnect();
      } catch {}

      try {
        carrierOscRef.current?.disconnect();
      } catch {}

      try {
        carrierGainRef.current?.disconnect();
      } catch {}

      try {
        driftLfoRef.current?.disconnect();
      } catch {}

      try {
        driftGainRef.current?.disconnect();
      } catch {}

      try {
        masterGainRef.current?.disconnect();
      } catch {}

      noiseSourceRef.current = null;
      noiseFilterRef.current = null;
      noiseGainRef.current = null;

      carrierOscRef.current = null;
      carrierGainRef.current = null;

      driftLfoRef.current = null;
      driftGainRef.current = null;

      masterGainRef.current = null;

      /*
       * Deliberately DO NOT do this:
       *
       * audioCtxRef.current?.close();
       *
       * The context belongs to sharedAudioContext.ts.
       */

      audioCtxRef.current = null;
    };
  }, []);

  // Real-time parameter slides
  useEffect(() => {
    const ctx =
      audioCtxRef.current;

    if (
      !ctx ||
      ctx.state === "closed" ||
      !isActive
    ) {
      return;
    }

    const now = ctx.currentTime;

    const targetStaticVol = isUnlocked
      ? 0.01
      : baseStaticVolume *
        (1.1 - tuningAccuracy * 0.95);

    const targetCarrierVol = isUnlocked
      ? 0.0
      : isProcessing
      ? baseCarrierVolume * 0.4
      : baseCarrierVolume *
        Math.pow(tuningAccuracy, 4);

    const filterFreq =
      1600 -
      tuningAccuracy * 800;

    const filterQ =
      1.2 +
      tuningAccuracy * 4.5;

    try {
      noiseGainRef.current?.gain.setTargetAtTime(
        targetStaticVol,
        now,
        0.12
      );

      noiseFilterRef.current?.frequency.setTargetAtTime(
        filterFreq,
        now,
        0.15
      );

      noiseFilterRef.current?.Q.setTargetAtTime(
        filterQ,
        now,
        0.15
      );

      carrierGainRef.current?.gain.setTargetAtTime(
        targetCarrierVol,
        now,
        0.08
      );

      const driftSpeed =
        1.5 +
        (1 - tuningAccuracy) * 4.0;

      driftLfoRef.current?.frequency.setTargetAtTime(
        driftSpeed,
        now,
        0.2
      );
    } catch {
      /*
       * A closed/unavailable context should never crash the UI.
       */
    }
  }, [
    isActive,
    tuningAccuracy,
    isProcessing,
    isUnlocked,
    baseStaticVolume,
    baseCarrierVolume,
  ]);

  return {
    isActive,
    start: initAudio,
    stop: stopAudio,
    tuningAccuracy,
  };
}