"use client";

import {
  useEffect,
  useRef,
  useCallback,
} from "react";

import { useProgressionStore } from "@/state/progressionStore";
import {
  getSharedAudioContext,
} from "@/lib/sharedAudioContext";

interface SolenoidConfig {
  baseVolume?: number;
  pitchOffset?: number;
  chatterRate?: number;
}

/**
 * Global Keyboard Solenoid Stepping Injector Hook
 *
 * Implements:
 * 1. Solenoid keystroke clacks with inductive energization pre-hum.
 * 2. High-Dust (>=70) physical contact double-click chatter.
 * 3. THE UNSEEN OBSERVER:
 *    Under low stability (<45%), triggers microscopic,
 *    highly localized acoustic anomalies when the
 *    investigator remains idle at their desk.
 *
 * AUDIO OWNERSHIP:
 *
 * This hook owns the transient audio nodes it creates.
 * It does NOT own the application's AudioContext.
 *
 * The AudioContext is provided by sharedAudioContext.ts.
 * This hook must therefore NEVER call AudioContext.close().
 */
export function useRelayTypingInjector({
  baseVolume = 0.22,
  pitchOffset = 145,
  chatterRate = 1,
}: SolenoidConfig = {}) {
  /*
   * Dust and Observer Stability are canonical progression state.
   *
   * UIStore is intentionally not used for progression values here.
   */
  const dustIndex = useProgressionStore(
    (state) => state.dustIndex
  );

  const observerStability = useProgressionStore(
    (state) => state.observerStability
  );

  /*
   * Reference to the shared application AudioContext.
   *
   * This is intentionally not created or closed here.
   */
  const audioCtxRef =
    useRef<AudioContext | null>(null);

  const lastInteractionRef =
    useRef<number>(Date.now());

  const observerTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  /**
   * Obtain the shared AudioContext.
   */
  const initAudioCtx =
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

      if (
        ctx.state === "closed"
      ) {
        audioCtxRef.current =
          null;

        return null;
      }

      audioCtxRef.current =
        ctx;

      /*
       * Browser autoplay policies can leave
       * the shared context suspended.
       */
      if (
        ctx.state === "suspended"
      ) {
        void ctx.resume().catch(
          (error) => {
            console.warn(
              "[Relay Audio] Failed to resume shared AudioContext:",
              error
            );
          }
        );
      }

      return ctx;
    }, []);

  // -------------------------------------------------------------
  // PHYSICAL SOLENOID KEYSTROKE
  // -------------------------------------------------------------

  const playSolenoidClick =
    useCallback(() => {
      const ctx =
        initAudioCtx();

      if (!ctx) {
        return;
      }

      if (
        ctx.state === "closed"
      ) {
        return;
      }

      /*
       * If the context is still suspended, resume was
       * requested above. Do not attempt to schedule
       * audio against a dead context.
       */
      if (
        ctx.state === "suspended"
      ) {
        return;
      }

      try {
        const now =
          ctx.currentTime;

        /*
         * Keyboard activity counts as interaction
         * for the Unseen Observer idle timer.
         */
        lastInteractionRef.current =
          Date.now();

        // -------------------------------------------------------
        // A. Inductive Coil Rise
        // -------------------------------------------------------

        const riseOsc =
          ctx.createOscillator();

        const riseGain =
          ctx.createGain();

        riseOsc.type =
          "sine";

        riseOsc.frequency.setValueAtTime(
          90.0,
          now
        );

        riseGain.gain.setValueAtTime(
          0.0,
          now
        );

        riseGain.gain.linearRampToValueAtTime(
          0.18 *
            baseVolume,
          now + 0.01
        );

        riseGain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + 0.015
        );

        riseOsc.connect(
          riseGain
        );

        riseGain.connect(
          ctx.destination
        );

        riseOsc.start(now);

        riseOsc.stop(
          now + 0.02
        );

        // -------------------------------------------------------
        // B. Main Solenoid Plunger Clack
        // -------------------------------------------------------

        const clickTime =
          now + 0.012;

        const clackOsc =
          ctx.createOscillator();

        const clackGain =
          ctx.createGain();

        clackOsc.type =
          "triangle";

        clackOsc.frequency.setValueAtTime(
          pitchOffset,
          clickTime
        );

        clackOsc.frequency.exponentialRampToValueAtTime(
          32,
          clickTime + 0.08
        );

        clackGain.gain.setValueAtTime(
          0.0,
          now
        );

        clackGain.gain.setValueAtTime(
          0.35 *
            baseVolume,
          clickTime
        );

        clackGain.gain.exponentialRampToValueAtTime(
          0.0001,
          clickTime + 0.08
        );

        clackOsc.connect(
          clackGain
        );

        clackGain.connect(
          ctx.destination
        );

        clackOsc.start(
          clickTime
        );

        clackOsc.stop(
          clickTime + 0.1
        );

        // -------------------------------------------------------
        // C. Physical Strike Plate Transient
        // -------------------------------------------------------

        const bufferSize =
          Math.max(
            1,
            Math.floor(
              ctx.sampleRate *
              0.006
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

        const noiseNode =
          ctx.createBufferSource();

        noiseNode.buffer =
          noiseBuffer;

        const hpFilter =
          ctx.createBiquadFilter();

        hpFilter.type =
          "highpass";

        hpFilter.frequency.setValueAtTime(
          1800,
          clickTime
        );

        const noiseGain =
          ctx.createGain();

        noiseGain.gain.setValueAtTime(
          0.0,
          now
        );

        noiseGain.gain.setValueAtTime(
          0.24 *
            baseVolume,
          clickTime
        );

        noiseGain.gain.exponentialRampToValueAtTime(
          0.0001,
          clickTime + 0.006
        );

        noiseNode.connect(
          hpFilter
        );

        hpFilter.connect(
          noiseGain
        );

        noiseGain.connect(
          ctx.destination
        );

        noiseNode.start(
          clickTime
        );

        noiseNode.stop(
          clickTime + 0.01
        );

        // -------------------------------------------------------
        // D. HIGH-DUST CONTACT CHATTER
        // -------------------------------------------------------

        if (
          dustIndex >= 70
        ) {
          /*
           * chatterRate is treated as a multiplier,
           * while preserving the original 1-2 bounce behavior.
           */
          const chatterProbability =
            Math.min(
              1,
              Math.max(
                0,
                0.6 *
                  chatterRate
              )
            );

          const chatterCount =
            Math.random() >
            1 -
              chatterProbability
              ? 2
              : 1;

          for (
            let i = 1;
            i <= chatterCount;
            i++
          ) {
            const chatterTime =
              clickTime +
              0.022 * i +
              Math.random() *
                0.015;

            const bounceGain =
              ctx.createGain();

            const bounceOsc =
              ctx.createOscillator();

            bounceOsc.type =
              "triangle";

            bounceOsc.frequency.setValueAtTime(
              pitchOffset *
                1.3,
              chatterTime
            );

            bounceOsc.frequency.exponentialRampToValueAtTime(
              40,
              chatterTime + 0.03
            );

            bounceGain.gain.setValueAtTime(
              0.0,
              now
            );

            bounceGain.gain.setValueAtTime(
              0.06 *
                baseVolume,
              chatterTime
            );

            bounceGain.gain.exponentialRampToValueAtTime(
              0.0001,
              chatterTime + 0.03
            );

            bounceOsc.connect(
              bounceGain
            );

            bounceGain.connect(
              ctx.destination
            );

            bounceOsc.start(
              chatterTime
            );

            bounceOsc.stop(
              chatterTime + 0.04
            );
          }
        }
      } catch (error) {
        /*
         * Audio failure must never propagate
         * into the React render tree.
         */
        console.warn(
          "[Relay Audio] Failed to synthesize solenoid click:",
          error
        );
      }
    }, [
      baseVolume,
      pitchOffset,
      chatterRate,
      dustIndex,
      initAudioCtx,
    ]);

  // -------------------------------------------------------------
  // THE UNSEEN OBSERVER
  // -------------------------------------------------------------

  const playObserverEvent =
    useCallback(() => {
      const ctx =
        audioCtxRef.current ??
        initAudioCtx();

      if (!ctx) {
        return;
      }

      if (
        ctx.state === "closed" ||
        ctx.state === "suspended"
      ) {
        return;
      }

      try {
        const now =
          ctx.currentTime;

        /*
         * Pick one of three anomalies:
         *
         * 0 = chair scrape
         * 1 = breath
         * 2 = ghost click
         */
        const type =
          Math.floor(
            Math.random() * 3
          );

        /*
         * Deliberately quiet.
         */
        const masterVol =
          0.012;

        // -------------------------------------------------------
        // TYPE 0: GHOSTLY CHAIR SCRAPE
        // -------------------------------------------------------

        if (
          type === 0
        ) {
          const osc =
            ctx.createOscillator();

          const filter =
            ctx.createBiquadFilter();

          const panner =
            ctx.createStereoPanner();

          const gain =
            ctx.createGain();

          osc.type =
            "sawtooth";

          osc.frequency.setValueAtTime(
            110,
            now
          );

          osc.frequency.linearRampToValueAtTime(
            145,
            now + 1.2
          );

          filter.type =
            "bandpass";

          filter.frequency.setValueAtTime(
            320,
            now
          );

          filter.Q.setValueAtTime(
            4.0,
            now
          );

          panner.pan.setValueAtTime(
            -0.85,
            now
          );

          panner.pan.linearRampToValueAtTime(
            0.75,
            now + 1.2
          );

          gain.gain.setValueAtTime(
            0.0,
            now
          );

          gain.gain.linearRampToValueAtTime(
            masterVol * 2.2,
            now + 0.15
          );

          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 1.4
          );

          osc.connect(
            filter
          );

          filter.connect(
            panner
          );

          panner.connect(
            gain
          );

          gain.connect(
            ctx.destination
          );

          osc.start(now);

          osc.stop(
            now + 1.5
          );

        // -------------------------------------------------------
        // TYPE 1: THE BREATH
        // -------------------------------------------------------

        } else if (
          type === 1
        ) {
          const bufferSize =
            Math.max(
              1,
              Math.floor(
                ctx.sampleRate *
                2.0
              )
            );

          const buffer =
            ctx.createBuffer(
              1,
              bufferSize,
              ctx.sampleRate
            );

          const data =
            buffer.getChannelData(
              0
            );

          for (
            let i = 0;
            i < bufferSize;
            i++
          ) {
            data[i] =
              Math.random() *
                2 -
              1;
          }

          const noise =
            ctx.createBufferSource();

          noise.buffer =
            buffer;

          const bpFilter =
            ctx.createBiquadFilter();

          bpFilter.type =
            "bandpass";

          bpFilter.Q.setValueAtTime(
            1.8,
            now
          );

          bpFilter.frequency.setValueAtTime(
            250,
            now
          );

          bpFilter.frequency.exponentialRampToValueAtTime(
            550,
            now + 0.9
          );

          bpFilter.frequency.exponentialRampToValueAtTime(
            180,
            now + 1.9
          );

          const panner =
            ctx.createStereoPanner();

          panner.pan.setValueAtTime(
            -0.95,
            now
          );

          const gain =
            ctx.createGain();

          gain.gain.setValueAtTime(
            0.0,
            now
          );

          gain.gain.linearRampToValueAtTime(
            masterVol * 3.5,
            now + 0.85
          );

          gain.gain.linearRampToValueAtTime(
            0.0,
            now + 2.0
          );

          noise.connect(
            bpFilter
          );

          bpFilter.connect(
            panner
          );

          panner.connect(
            gain
          );

          gain.connect(
            ctx.destination
          );

          noise.start(now);

          noise.stop(
            now + 2.0
          );

        // -------------------------------------------------------
        // TYPE 2: GHOST CLICK
        // -------------------------------------------------------

        } else {
          const clackOsc =
            ctx.createOscillator();

          const clackGain =
            ctx.createGain();

          clackOsc.type =
            "triangle";

          clackOsc.frequency.setValueAtTime(
            pitchOffset *
              0.85,
            now
          );

          clackOsc.frequency.exponentialRampToValueAtTime(
            28,
            now + 0.08
          );

          clackGain.gain.setValueAtTime(
            masterVol * 2.8,
            now
          );

          clackGain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.08
          );

          clackOsc.connect(
            clackGain
          );

          clackGain.connect(
            ctx.destination
          );

          clackOsc.start(now);

          clackOsc.stop(
            now + 0.1
          );
        }
      } catch (error) {
        /*
         * The Unseen Observer is atmospheric.
         * It must never be allowed to destabilize the UI.
         */
        console.warn(
          "[Observer Audio] Failed to synthesize anomaly:",
          error
        );
      }
    }, [
      initAudioCtx,
      pitchOffset,
    ]);

  // -------------------------------------------------------------
  // KEYDOWN MONITORING
  // -------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown =
      (e: KeyboardEvent) => {
        if (
          e.ctrlKey ||
          e.metaKey ||
          e.altKey ||
          [
            "Control",
            "Shift",
            "Alt",
            "Meta",
            "Escape",
          ].includes(e.key) ||
          e.key.startsWith(
            "Arrow"
          ) ||
          e.key.startsWith(
            "F"
          )
        ) {
          return;
        }

        if (
          e.key.length === 1 ||
          [
            "Backspace",
            "Spacebar",
            " ",
            "Enter",
            "Tab",
          ].includes(e.key)
        ) {
          playSolenoidClick();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    playSolenoidClick,
  ]);

  // -------------------------------------------------------------
  // UNSEEN OBSERVER IDLE TRACKING
  // -------------------------------------------------------------

  useEffect(() => {
    /*
     * Healthy observer stability means
     * the Unseen Observer remains silent.
     */
    if (
      observerStability >= 45
    ) {
      if (
        observerTimerRef.current
      ) {
        clearInterval(
          observerTimerRef.current
        );

        observerTimerRef.current =
          null;
      }

      return;
    }

    /*
     * Run once every 10 seconds.
     */
    observerTimerRef.current =
      setInterval(() => {
        const now =
          Date.now();

        const idleTime =
          now -
          lastInteractionRef.current;

        /*
         * Investigator must be idle for
         * at least 25 seconds.
         */
        if (
          idleTime > 25000
        ) {
          /*
           * 24% chance every ten seconds.
           */
          if (
            Math.random() <
            0.24
          ) {
            playObserverEvent();
          }
        }
      }, 10000);

    return () => {
      if (
        observerTimerRef.current
      ) {
        clearInterval(
          observerTimerRef.current
        );

        observerTimerRef.current =
          null;
      }
    };
  }, [
    observerStability,
    playObserverEvent,
  ]);

  // -------------------------------------------------------------
  // COMPONENT CLEANUP
  // -------------------------------------------------------------

  useEffect(() => {
    return () => {
      /*
       * IMPORTANT:
       *
       * This hook does NOT own the AudioContext.
       *
       * Therefore we:
       *   - do NOT call close()
       *   - do NOT suspend()
       *   - do NOT disconnect the destination
       *
       * The short-lived oscillator and buffer nodes are already
       * scheduled to stop themselves.
       *
       * We only release our reference to the shared context.
       */

      if (
        observerTimerRef.current
      ) {
        clearInterval(
          observerTimerRef.current
        );

        observerTimerRef.current =
          null;
      }

      audioCtxRef.current =
        null;
    };
  }, []);

  return null;
}