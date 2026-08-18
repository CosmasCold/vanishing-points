"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import { useProgressionStore } from "@/state/progressionStore";
import { getSharedAudioContext } from "@/lib/sharedAudioContext";

interface TapeDegradationConfig {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

/**
 * Tape degradation / archival media audio engine.
 *
 * AUDIO OWNERSHIP:
 *
 * This hook owns the Web Audio nodes it creates.
 * It does NOT own the AudioContext.
 *
 * The application uses one shared AudioContext provided by
 * sharedAudioContext.ts.
 *
 * IMPORTANT:
 * - Never creates a second AudioContext.
 * - Never calls AudioContext.close().
 * - Never destroys the shared context.
 * - Disposable oscillators / processing nodes are rebuilt
 *   when playback starts again.
 */
export function useTapeDegradation({
  audioElement,
  isPlaying,
}: TapeDegradationConfig) {
  /*
   * Dust is canonical progression state.
   *
   * Do not read progression metrics from UIStore.
   */
  const dustIndex = useProgressionStore(
    (state) => state.dustIndex
  );

  /*
   * Shared application AudioContext.
   */
  const audioCtxRef =
    useRef<AudioContext | null>(null);

  /*
   * MediaElementSource is special:
   *
   * An HTMLMediaElement may only be associated with one
   * MediaElementAudioSourceNode for a given AudioContext.
   *
   * Therefore we preserve this node between processing
   * pipeline rebuilds.
   */
  const sourceNodeRef =
    useRef<MediaElementAudioSourceNode | null>(null);

  /*
   * Processing nodes.
   * These are disposable and can be rebuilt.
   */
  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const filterNodeRef =
    useRef<BiquadFilterNode | null>(null);

  const delayNodeRef =
    useRef<DelayNode | null>(null);

  const wowLfoRef =
    useRef<OscillatorNode | null>(null);

  const wowGainRef =
    useRef<GainNode | null>(null);

  const flutterLfoRef =
    useRef<OscillatorNode | null>(null);

  const flutterGainRef =
    useRef<GainNode | null>(null);

  const humOscRef =
    useRef<OscillatorNode | null>(null);

  const humGainRef =
    useRef<GainNode | null>(null);

  const hissSourceRef =
    useRef<AudioBufferSourceNode | null>(null);

  const hissGainRef =
    useRef<GainNode | null>(null);

  const [vuValue, setVuValue] =
    useState(0);

  const animationFrameRef =
    useRef<number | null>(null);

  /*
   * Tracks whether our processing pipeline currently exists.
   */
  const pipelineActiveRef =
    useRef(false);

  // -------------------------------------------------------------
  // SHARED AUDIO CONTEXT
  // -------------------------------------------------------------

  const getAudioContext =
    useCallback(() => {
      if (
        typeof window === "undefined"
      ) {
        return null;
      }

      const ctx =
        audioCtxRef.current ??
        getSharedAudioContext();

      if (!ctx) {
        return null;
      }

      /*
       * A shared context should never be closed by this hook.
       * If something external has closed it, discard our ref
       * and allow the shared provider to recover if possible.
       */
      if (
        ctx.state === "closed"
      ) {
        audioCtxRef.current =
          null;

        return null;
      }

      audioCtxRef.current =
        ctx;

      return ctx;
    }, []);

  // -------------------------------------------------------------
  // PARAMETER UPDATE
  // -------------------------------------------------------------

  const updateParameters =
    useCallback(() => {
      const ctx =
        audioCtxRef.current;

      if (
        !ctx ||
        ctx.state === "closed"
      ) {
        return;
      }

      const now =
        ctx.currentTime;

      /*
       * Normalize dust index to [0..1].
       */
      const intensity =
        Math.min(
          1.0,
          Math.max(
            0,
            dustIndex / 100
          )
        );

      /*
       * Tape filter.
       */
      const filterFreq =
        1200 -
        intensity * 400;

      const filterQ =
        0.5 +
        intensity * 4.5;

      /*
       * Wow.
       */
      const wowDepth =
        0.00005 +
        intensity * 0.00045;

      const wowFreq =
        0.35 +
        intensity * 0.65;

      /*
       * Flutter.
       */
      const flutterDepth =
        0.00001 +
        intensity * 0.00015;

      const flutterFreq =
        14.0 -
        intensity * 4.0;

      /*
       * Background electrical hum.
       */
      const humVolume =
        0.001 +
        intensity * 0.015;

      /*
       * Tape hiss.
       */
      const hissVolume =
        0.012 +
        intensity * 0.088;

      try {
        filterNodeRef.current?.frequency
          .setTargetAtTime(
            filterFreq,
            now,
            0.2
          );

        filterNodeRef.current?.Q
          .setTargetAtTime(
            filterQ,
            now,
            0.2
          );

        wowLfoRef.current?.frequency
          .setTargetAtTime(
            wowFreq,
            now,
            0.3
          );

        wowGainRef.current?.gain
          .setTargetAtTime(
            wowDepth,
            now,
            0.2
          );

        flutterLfoRef.current?.frequency
          .setTargetAtTime(
            flutterFreq,
            now,
            0.3
          );

        flutterGainRef.current?.gain
          .setTargetAtTime(
            flutterDepth,
            now,
            0.2
          );

        humGainRef.current?.gain
          .setTargetAtTime(
            humVolume,
            now,
            0.4
          );

        hissGainRef.current?.gain
          .setTargetAtTime(
            hissVolume,
            now,
            0.3
          );
      } catch (error) {
        console.warn(
          "[Tape Audio] Parameter update failed:",
          error
        );
      }
    }, [dustIndex]);

  // -------------------------------------------------------------
  // DISPOSE PROCESSING NODES
  // -------------------------------------------------------------

  const disposePipeline =
    useCallback(() => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      /*
       * Oscillators and looping buffer sources
       * must be stopped before disposal.
       */
      try {
        wowLfoRef.current?.stop();
      } catch {}

      try {
        flutterLfoRef.current?.stop();
      } catch {}

      try {
        humOscRef.current?.stop();
      } catch {}

      try {
        hissSourceRef.current?.stop();
      } catch {}

      /*
       * Disconnect everything owned by this pipeline.
       */
      try {
        wowLfoRef.current?.disconnect();
      } catch {}

      try {
        wowGainRef.current?.disconnect();
      } catch {}

      try {
        flutterLfoRef.current?.disconnect();
      } catch {}

      try {
        flutterGainRef.current?.disconnect();
      } catch {}

      try {
        humOscRef.current?.disconnect();
      } catch {}

      try {
        humGainRef.current?.disconnect();
      } catch {}

      try {
        hissSourceRef.current?.disconnect();
      } catch {}

      try {
        hissGainRef.current?.disconnect();
      } catch {}

      try {
        filterNodeRef.current?.disconnect();
      } catch {}

      try {
        delayNodeRef.current?.disconnect();
      } catch {}

      try {
        analyserRef.current?.disconnect();
      } catch {}

      /*
       * The MediaElementSource belongs to the shared
       * AudioContext, so we preserve the node itself.
       * Disconnecting it is safe because the processing
       * graph can reconnect it later.
       */
      try {
        sourceNodeRef.current?.disconnect();
      } catch {}

      /*
       * Clear disposable node refs.
       */
      analyserRef.current =
        null;

      filterNodeRef.current =
        null;

      delayNodeRef.current =
        null;

      wowLfoRef.current =
        null;

      wowGainRef.current =
        null;

      flutterLfoRef.current =
        null;

      flutterGainRef.current =
        null;

      humOscRef.current =
        null;

      humGainRef.current =
        null;

      hissSourceRef.current =
        null;

      hissGainRef.current =
        null;

      pipelineActiveRef.current =
        false;
    }, []);

  // -------------------------------------------------------------
  // INITIALIZE AUDIO PIPELINE
  // -------------------------------------------------------------

  const initAudio =
    useCallback(() => {
      if (
        !audioElement
      ) {
        return;
      }

      const ctx =
        getAudioContext();

      if (!ctx) {
        return;
      }

      if (
        ctx.state === "closed"
      ) {
        return;
      }

      /*
       * Do not build the same processing graph twice.
       */
      if (
        pipelineActiveRef.current
      ) {
        return;
      }

      try {
        if (
          ctx.state === "suspended"
        ) {
          void ctx.resume().catch(
            (error) => {
              console.warn(
                "[Tape Audio] Failed to resume shared AudioContext:",
                error
              );
            }
          );
        }

        /*
         * Create/reuse the MediaElementSource.
         *
         * It must stay attached to this AudioContext.
         */
        if (
          !sourceNodeRef.current
        ) {
          sourceNodeRef.current =
            ctx.createMediaElementSource(
              audioElement
            );
        }

        const source =
          sourceNodeRef.current;

        /*
         * -------------------------------------------------------
         * ANALYSER
         * -------------------------------------------------------
         */

        const analyser =
          ctx.createAnalyser();

        analyser.fftSize =
          64;

        analyserRef.current =
          analyser;

        /*
         * -------------------------------------------------------
         * TAPE BANDPASS FILTER
         * -------------------------------------------------------
         */

        const filter =
          ctx.createBiquadFilter();

        filter.type =
          "bandpass";

        filter.frequency.setValueAtTime(
          1200,
          ctx.currentTime
        );

        filter.Q.setValueAtTime(
          0.5,
          ctx.currentTime
        );

        filterNodeRef.current =
          filter;

        /*
         * -------------------------------------------------------
         * WOW / FLUTTER DELAY
         * -------------------------------------------------------
         */

        const delay =
          ctx.createDelay(1.0);

        delay.delayTime.setValueAtTime(
          0.005,
          ctx.currentTime
        );

        delayNodeRef.current =
          delay;

        /*
         * -------------------------------------------------------
         * WOW LFO
         * -------------------------------------------------------
         */

        const wowLfo =
          ctx.createOscillator();

        wowLfo.type =
          "sine";

        wowLfo.frequency.setValueAtTime(
          0.35,
          ctx.currentTime
        );

        const wowGain =
          ctx.createGain();

        wowGain.gain.setValueAtTime(
          0.00005,
          ctx.currentTime
        );

        wowLfo.connect(
          wowGain
        );

        wowGain.connect(
          delay.delayTime
        );

        wowLfoRef.current =
          wowLfo;

        wowGainRef.current =
          wowGain;

        /*
         * -------------------------------------------------------
         * FLUTTER LFO
         * -------------------------------------------------------
         */

        const flutterLfo =
          ctx.createOscillator();

        flutterLfo.type =
          "triangle";

        flutterLfo.frequency.setValueAtTime(
          14.0,
          ctx.currentTime
        );

        const flutterGain =
          ctx.createGain();

        flutterGain.gain.setValueAtTime(
          0.00001,
          ctx.currentTime
        );

        flutterLfo.connect(
          flutterGain
        );

        flutterGain.connect(
          delay.delayTime
        );

        flutterLfoRef.current =
          flutterLfo;

        flutterGainRef.current =
          flutterGain;

        /*
         * -------------------------------------------------------
         * 60Hz GROUND MAINS HUM
         * -------------------------------------------------------
         */

        const humOsc =
          ctx.createOscillator();

        humOsc.type =
          "triangle";

        humOsc.frequency.setValueAtTime(
          60.0,
          ctx.currentTime
        );

        const humGain =
          ctx.createGain();

        humGain.gain.setValueAtTime(
          0.001,
          ctx.currentTime
        );

        humOsc.connect(
          humGain
        );

        humGain.connect(
          analyser
        );

        humOscRef.current =
          humOsc;

        humGainRef.current =
          humGain;

        /*
         * -------------------------------------------------------
         * PROCEDURAL TAPE HISS
         * -------------------------------------------------------
         */

        const bufferSize =
          Math.max(
            1,
            Math.floor(
              2 *
                ctx.sampleRate
            )
          );

        const noiseBuffer =
          ctx.createBuffer(
            1,
            bufferSize,
            ctx.sampleRate
          );

        const output =
          noiseBuffer.getChannelData(
            0
          );

        for (
          let i = 0;
          i < bufferSize;
          i++
        ) {
          output[i] =
            Math.random() *
              2 -
            1;
        }

        const hissSource =
          ctx.createBufferSource();

        hissSource.buffer =
          noiseBuffer;

        hissSource.loop =
          true;

        const hissFilter =
          ctx.createBiquadFilter();

        hissFilter.type =
          "bandpass";

        hissFilter.frequency.setValueAtTime(
          3500,
          ctx.currentTime
        );

        hissFilter.Q.setValueAtTime(
          0.4,
          ctx.currentTime
        );

        const hissGain =
          ctx.createGain();

        hissGain.gain.setValueAtTime(
          0.015,
          ctx.currentTime
        );

        hissSource.connect(
          hissFilter
        );

        hissFilter.connect(
          hissGain
        );

        hissGain.connect(
          analyser
        );

        hissSourceRef.current =
          hissSource;

        hissGainRef.current =
          hissGain;

        /*
         * -------------------------------------------------------
         * MAIN MEDIA ROUTING
         * -------------------------------------------------------
         *
         * HTMLAudioElement
         *        ↓
         *   MediaSource
         *        ↓
         *    Bandpass
         *        ↓
         *      Delay
         *        ↓
         *    Analyser
         *        ↓
         *    Destination
         */

        source.connect(
          filter
        );

        filter.connect(
          delay
        );

        delay.connect(
          analyser
        );

        analyser.connect(
          ctx.destination
        );

        /*
         * Start all disposable generators.
         */
        wowLfo.start();

        flutterLfo.start();

        humOsc.start();

        hissSource.start();

        pipelineActiveRef.current =
          true;

        updateParameters();
      } catch (error) {
        console.error(
          "[TAPE AUDIO ERROR] Web Audio pipeline failed to boot:",
          error
        );

        /*
         * Clean up partially-created nodes,
         * but NEVER close the shared context.
         */
        disposePipeline();
      }
    }, [
      audioElement,
      getAudioContext,
      updateParameters,
      disposePipeline,
    ]);

  // -------------------------------------------------------------
  // PLAYBACK STOP
  // -------------------------------------------------------------

  const stopAudio =
    useCallback(() => {
      disposePipeline();
    }, [
      disposePipeline,
    ]);

  // -------------------------------------------------------------
  // UPDATE PARAMETERS WHEN DUST CHANGES
  // -------------------------------------------------------------

  useEffect(() => {
    if (
      pipelineActiveRef.current
    ) {
      updateParameters();
    }
  }, [
    dustIndex,
    updateParameters,
  ]);

  // -------------------------------------------------------------
  // PLAYBACK LIFECYCLE
  // -------------------------------------------------------------

  useEffect(() => {
    if (
      !isPlaying ||
      !audioElement
    ) {
      stopAudio();
      return;
    }

    initAudio();

    const ctx =
      audioCtxRef.current;

    if (
      ctx &&
      ctx.state === "suspended"
    ) {
      void ctx.resume().catch(
        (error) => {
          console.warn(
            "[Tape Audio] Failed to resume shared AudioContext:",
            error
          );
        }
      );
    }

    return () => {
      /*
       * Stop only this hook's processing pipeline.
       * The shared AudioContext remains alive.
       */
      stopAudio();
    };
  }, [
    isPlaying,
    audioElement,
    initAudio,
    stopAudio,
  ]);

  // -------------------------------------------------------------
  // VU METER
  // -------------------------------------------------------------

  useEffect(() => {
    if (
      !isPlaying ||
      !analyserRef.current
    ) {
      return;
    }

    const analyser =
      analyserRef.current;

    const bufferLength =
      analyser.frequencyBinCount;

    const dataArray =
      new Uint8Array(
        bufferLength
      );

    const updateVU =
      () => {
        /*
         * Component may have been unmounted
         * between animation frames.
         */
        if (
          !analyserRef.current
        ) {
          return;
        }

        try {
          analyser.getByteFrequencyData(
            dataArray
          );
        } catch {
          return;
        }

        let sum = 0;

        for (
          let i = 0;
          i < bufferLength;
          i++
        ) {
          sum +=
            dataArray[i];
        }

        const average =
          sum /
          bufferLength;

        const scale =
          average / 255;

        setVuValue(
          (previous) =>
            previous * 0.75 +
            scale * 0.3
        );

        animationFrameRef.current =
          requestAnimationFrame(
            updateVU
          );
      };

    updateVU();

    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }
    };
  }, [
    isPlaying,
  ]);

  // -------------------------------------------------------------
  // PROCEDURAL TAPE SCRUBBING AUDIO
  // -------------------------------------------------------------

  const triggerScrubSound =
    useCallback(
      (
        direction:
          | "forward"
          | "backward"
          | "delta"
          | "ff"
          | "rw" = "delta"
      ) => {
        /*
         * Scrubbing also uses the shared context.
         *
         * It does NOT create its own AudioContext.
         */
        const ctx =
          getAudioContext();

        if (!ctx) {
          return;
        }

        if (
          ctx.state === "closed"
        ) {
          return;
        }

        if (
          ctx.state === "suspended"
        ) {
          void ctx.resume().catch(
            (error) => {
              console.warn(
                "[Tape Scrub] Failed to resume shared AudioContext:",
                error
              );
            }
          );

          return;
        }

        try {
          const now =
            ctx.currentTime;

          /*
           * -----------------------------------------------------
           * 1. SOLENOID RELAY CLACK
           * -----------------------------------------------------
           */

          const thudOsc =
            ctx.createOscillator();

          const thudGain =
            ctx.createGain();

          thudOsc.type =
            "triangle";

          thudOsc.frequency.setValueAtTime(
            115,
            now
          );

          thudOsc.frequency.exponentialRampToValueAtTime(
            35,
            now + 0.12
          );

          thudGain.gain.setValueAtTime(
            0.24,
            now
          );

          thudGain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.12
          );

          thudOsc.connect(
            thudGain
          );

          thudGain.connect(
            ctx.destination
          );

          thudOsc.start(
            now
          );

          thudOsc.stop(
            now + 0.15
          );

          /*
           * -----------------------------------------------------
           * 2. HIGH-PASS TAPE HEAD SCRAPE
           * -----------------------------------------------------
           */

          const scrubNoise =
            ctx.createBufferSource();

          const bufferSize =
            Math.max(
              1,
              Math.floor(
                0.08 *
                  ctx.sampleRate
              )
            );

          const buffer =
            ctx.createBuffer(
              1,
              bufferSize,
              ctx.sampleRate
            );

          const channelData =
            buffer.getChannelData(
              0
            );

          for (
            let i = 0;
            i < bufferSize;
            i++
          ) {
            channelData[i] =
              Math.random() *
                2 -
              1;
          }

          scrubNoise.buffer =
            buffer;

          const scrubFilter =
            ctx.createBiquadFilter();

          scrubFilter.type =
            "bandpass";

          const centerFreq =
            direction === "ff"
              ? 2800
              : direction === "rw"
              ? 1500
              : direction === "forward"
              ? 2200
              : direction === "backward"
              ? 1100
              : 1700;

          scrubFilter.frequency.setValueAtTime(
            centerFreq,
            now
          );

          scrubFilter.frequency.exponentialRampToValueAtTime(
            direction === "ff"
              ? 3800
              : direction === "rw"
              ? 700
              : direction === "forward"
              ? 3200
              : direction === "backward"
              ? 800
              : 1200,
            now + 0.08
          );

          scrubFilter.Q.setValueAtTime(
            2.2,
            now
          );

          const scrubGain =
            ctx.createGain();

          scrubGain.gain.setValueAtTime(
            0.08,
            now
          );

          scrubGain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.08
          );

          scrubNoise.connect(
            scrubFilter
          );

          scrubFilter.connect(
            scrubGain
          );

          scrubGain.connect(
            ctx.destination
          );

          scrubNoise.start(
            now
          );

          scrubNoise.stop(
            now + 0.1
          );
        } catch (error) {
          /*
           * Scrub audio is non-critical.
           * Never allow it to destabilize React.
           */
          console.warn(
            "[Tape Scrub] Failed to synthesize scrub sound:",
            error
          );
        }
      },
      [
        getAudioContext,
      ]
    );

  // -------------------------------------------------------------
  // FINAL COMPONENT CLEANUP
  // -------------------------------------------------------------

  useEffect(() => {
    return () => {
      /*
       * Dispose ONLY our nodes.
       *
       * NEVER:
       *
       *   audioCtx.close()
       *
       * The AudioContext belongs to the application-wide
       * shared audio system.
       */
      disposePipeline();

      audioCtxRef.current =
        null;
    };
  }, [
    disposePipeline,
  ]);

  return {
    vuValue,
    triggerScrubSound,
  };
}