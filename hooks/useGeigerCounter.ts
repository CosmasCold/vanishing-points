'use client';

import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { useProgressionStore } from '@/state/progressionStore';
import { useAtlasStore } from '@/state/atlasStore';
import { getSharedAudioContext } from '@/lib/sharedAudioContext';

interface GeigerConfig {
  baseCpm?: number;
  maxCpm?: number;
  volume?: number;
}

interface GeigerStore {
  isActive: boolean;
  currentCpm: number;
  uSvh: number;
  hoveredPlaceSlug: string | null;
  setIsActive: (active: boolean) => void;
  setCurrentCpm: (cpm: number) => void;
  setUSvh: (uSvh: number) => void;
  setHoveredPlaceSlug: (slug: string | null) => void;
}

export const useGeigerStore = create<GeigerStore>((set) => ({
  isActive: false,
  currentCpm: 12,
  uSvh: 12 * 0.0057,
  hoveredPlaceSlug: null,

  setIsActive: (active) =>
    set({ isActive: active }),

  setCurrentCpm: (cpm) =>
    set({
      currentCpm: cpm,
      uSvh: cpm * 0.0057,
    }),

  setUSvh: (uSvh) =>
    set({ uSvh }),

  setHoveredPlaceSlug: (slug) =>
    set({
      hoveredPlaceSlug: slug,
    }),
}));

export function useGeigerCounter({
  baseCpm = 12,
  maxCpm = 3600,
  volume = 0.25,
}: GeigerConfig = {}) {
  /*
   * This ref points to the APPLICATION-WIDE shared AudioContext.
   *
   * This hook does NOT own the context and therefore must never call
   * AudioContext.close().
   */
  const audioCtxRef =
    useRef<AudioContext | null>(null);

  /*
   * Dust is canonical progression state.
   * UIStore is intentionally not used for progression values here.
   */
  const dustIndex = useProgressionStore(
    (state) => state.dustIndex
  );

  const {
    selectedPlaceSlug,
    places,
  } = useAtlasStore();

  const {
    isActive,
    currentCpm,
    uSvh,
    hoveredPlaceSlug,
    setIsActive,
    setCurrentCpm,
    setUSvh,
  } = useGeigerStore();

  const nextClickTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const isPlayingRef =
    useRef(false);

  /*
   * Acquire the shared context when the hook mounts.
   *
   * We do not create an AudioContext here.
   */
  useEffect(() => {
    audioCtxRef.current =
      getSharedAudioContext();

    return () => {
      /*
       * The hook owns its scheduler, not the AudioContext.
       *
       * Stop the Geiger session and clear its pending timer.
       */
      isPlayingRef.current = false;

      if (nextClickTimeoutRef.current) {
        clearTimeout(
          nextClickTimeoutRef.current
        );

        nextClickTimeoutRef.current =
          null;
      }

      audioCtxRef.current = null;
    };
  }, []);

  // --------------------------------------------------
  // Calculate active radiation target
  // --------------------------------------------------

  const getTargetCpm = useCallback((): number => {
    let multiplier = 1.0;

    /*
     * Dust index acts as an ambient charge carrier.
     */
    const dustLevel = dustIndex;

    multiplier +=
      (dustLevel / 100) * 8.0;

    /*
     * Prioritize hovered place, then selected place.
     */
    const activeSlug =
      hoveredPlaceSlug ||
      selectedPlaceSlug;

    if (activeSlug) {
      const activePlace =
        places.find(
          (place) =>
            place.slug === activeSlug
        );

      if (activePlace) {
        /*
         * Danger level scales base energy.
         */
        const danger =
          activePlace.dangerLevel || 1;

        multiplier +=
          danger * 4.0;

        /*
         * Lore-specific radiation hotspots.
         */
        const hotZones: Record<
          string,
          number
        > = {
          'chernobyl-reactor-4-control-room': 250.0,
          'pripyat-hospital-126': 180.0,
          'pripyat-amusement-park': 90.0,
          'kola-superdeep-borehole': 140.0,
          'duga-radar-array': 70.0,
          'blackwood-hospital': 50.0,
        };

        const hotspot =
          hotZones[
            activePlace.slug
          ];

        if (hotspot) {
          multiplier *=
            1.0 +
            hotspot / 10.0;
        }
      }
    }

    const calculatedCpm =
      Math.min(
        maxCpm,
        baseCpm * multiplier
      );

    return Math.max(
      baseCpm,
      calculatedCpm
    );
  }, [
    dustIndex,
    selectedPlaceSlug,
    hoveredPlaceSlug,
    places,
    baseCpm,
    maxCpm,
  ]);

  // --------------------------------------------------
  // Geiger click synthesis
  // --------------------------------------------------

  const playGeigerClick =
    useCallback(
      (ctx: AudioContext) => {
        /*
         * A closed context can never be used again.
         * Do nothing rather than allowing the exception to escape.
         */
        if (
          ctx.state === 'closed'
        ) {
          return;
        }

        /*
         * Suspended contexts may occur before a user gesture.
         * Do not manufacture nodes until the context is usable.
         */
        if (
          ctx.state === 'suspended'
        ) {
          return;
        }

        try {
          const now =
            ctx.currentTime;

          /*
           * Ultra-short noise burst.
           */
          const bufferSize =
            Math.max(
              1,
              Math.floor(
                0.005 *
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
            buffer.getChannelData(0);

          for (
            let i = 0;
            i < bufferSize;
            i++
          ) {
            channelData[i] =
              Math.random() * 2 -
              1;
          }

          const noiseNode =
            ctx.createBufferSource();

          noiseNode.buffer =
            buffer;

          /*
           * High-pass filter removes low-end
           * and creates the sharp detector click.
           */
          const hpFilter =
            ctx.createBiquadFilter();

          hpFilter.type =
            'highpass';

          hpFilter.frequency.setValueAtTime(
            1600,
            now
          );

          /*
           * Bandpass filter creates the
           * detector casing resonance.
           */
          const bpFilter =
            ctx.createBiquadFilter();

          bpFilter.type =
            'bandpass';

          bpFilter.frequency.setValueAtTime(
            3500,
            now
          );

          bpFilter.Q.setValueAtTime(
            4.0,
            now
          );

          /*
           * Instant rise followed by exponential decay.
           */
          const gainNode =
            ctx.createGain();

          gainNode.gain.setValueAtTime(
            volume *
              (0.6 +
                Math.random() * 0.4),
            now
          );

          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.004
          );

          noiseNode.connect(
            hpFilter
          );

          hpFilter.connect(
            bpFilter
          );

          bpFilter.connect(
            gainNode
          );

          gainNode.connect(
            ctx.destination
          );

          noiseNode.start(now);

          /*
           * The nodes are intentionally not stored globally.
           * They are short-lived detector clicks and will be
           * garbage-collected after their scheduled playback.
           */
        } catch (error) {
          /*
           * Audio must never be allowed to crash
           * the React render tree.
           */
          console.warn(
            '[Geiger Audio] Failed to play click:',
            error
          );
        }
      },
      [volume]
    );

  // --------------------------------------------------
  // Poisson distribution scheduler
  // --------------------------------------------------

  const scheduleNextClick =
    useCallback(() => {
      if (
        !isPlayingRef.current
      ) {
        return;
      }

      const ctx =
        audioCtxRef.current;

      if (!ctx) {
        return;
      }

      /*
       * If the shared context somehow became closed,
       * don't keep hammering it.
       */
      if (
        ctx.state === 'closed'
      ) {
        isPlayingRef.current =
          false;

        setIsActive(false);

        return;
      }

      const targetCpm =
        getTargetCpm();

      setCurrentCpm(
        Math.round(targetCpm)
      );

      setUSvh(
        targetCpm * 0.0057
      );

      /*
       * lambda = clicks per second
       */
      const lambda =
        targetCpm / 60.0;

      /*
       * Generate exponential random variable.
       *
       * Protect against Math.random() returning exactly 1.
       */
      const randomVal =
        Math.min(
          0.999999999,
          Math.random()
        );

      const delaySeconds =
        -Math.log(
          1.0 - randomVal
        ) / lambda;

      playGeigerClick(ctx);

      nextClickTimeoutRef.current =
        setTimeout(() => {
          nextClickTimeoutRef.current =
            null;

          scheduleNextClick();
        }, delaySeconds * 1000);
    }, [
      getTargetCpm,
      playGeigerClick,
      setCurrentCpm,
      setUSvh,
      setIsActive,
    ]);

  // --------------------------------------------------
  // Start Geiger session
  // --------------------------------------------------

  const start =
    useCallback(() => {
      /*
       * Prevent duplicate schedulers.
       */
      if (
        isPlayingRef.current
      ) {
        return;
      }

      /*
       * Always obtain the shared context.
       *
       * We do NOT assume the mount-time reference is still valid.
       */
      const ctx =
        getSharedAudioContext();

      if (!ctx) {
        console.warn(
          '[Geiger Audio] Shared AudioContext unavailable.'
        );

        return;
      }

      if (
        ctx.state === 'closed'
      ) {
        console.warn(
          '[Geiger Audio] Shared AudioContext is closed.'
        );

        return;
      }

      audioCtxRef.current =
        ctx;

      /*
       * Browser autoplay policy can leave the context suspended.
       */
      if (
        ctx.state === 'suspended'
      ) {
        void ctx
          .resume()
          .catch((error) => {
            console.warn(
              '[Geiger Audio] Failed to resume shared AudioContext:',
              error
            );
          });
      }

      isPlayingRef.current =
        true;

      setIsActive(true);

      /*
       * Begin the radioactive decay scheduler.
       */
      scheduleNextClick();
    }, [
      scheduleNextClick,
      setIsActive,
    ]);

  // --------------------------------------------------
  // Stop Geiger session
  // --------------------------------------------------

  const stop =
    useCallback(() => {
      isPlayingRef.current =
        false;

      setIsActive(false);

      /*
       * Stop this hook's scheduler.
       */
      if (
        nextClickTimeoutRef.current
      ) {
        clearTimeout(
          nextClickTimeoutRef.current
        );

        nextClickTimeoutRef.current =
          null;
      }
    }, [setIsActive]);

  // --------------------------------------------------
  // Refresh radiation indicators when state changes
  // --------------------------------------------------

  useEffect(() => {
    if (
      !isPlayingRef.current
    ) {
      return;
    }

    const targetCpm =
      getTargetCpm();

    setCurrentCpm(
      Math.round(targetCpm)
    );

    setUSvh(
      targetCpm * 0.0057
    );
  }, [
    getTargetCpm,
    setCurrentCpm,
    setUSvh,
  ]);

  return {
    isActive,
    currentCpm,
    uSvh,
    start,
    stop,
  };
}