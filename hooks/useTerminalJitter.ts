"use client";

import { useEffect, useRef } from "react";
import { useProgressionStore } from "@/state/progressionStore";
import { useGeigerStore } from "@/hooks/useGeigerCounter";

export function useTerminalJitter() {
  const observerStability = useProgressionStore(
    (state) => state.observerStability
  );

  const dustIndex = useProgressionStore(
    (state) => state.dustIndex
  );

  const { currentCpm } = useGeigerStore();

  const frameRef = useRef<number | null>(null);
  const cycleRef = useRef(0);

  const paramsRef = useRef({
    observerStability,
    dustIndex,
    currentCpm,
  });

  /*
   * Keep live environmental values available to the animation loop
   * without recreating the requestAnimationFrame loop.
   */
  useEffect(() => {
    paramsRef.current = {
      observerStability,
      dustIndex,
      currentCpm,
    };
  }, [observerStability, dustIndex, currentCpm]);

  useEffect(() => {
    let mounted = true;

    const updateDrift = () => {
      if (!mounted) return;

      cycleRef.current += 0.05;
      const t = cycleRef.current;

      const {
        observerStability: stability,
        dustIndex: dust,
        currentCpm: cpm,
      } = paramsRef.current;

      const instability = Math.max(
        0,
        Math.min(1, (100 - stability) / 100)
      );

      const dustRatio = Math.max(
        0,
        Math.min(1, dust / 100)
      );

      const radiationRatio = Math.max(
        0,
        Math.min(1, (cpm - 12) / 1188)
      );

      /*
       * ------------------------------------------------------------
       * CRT MOVEMENT
       * ------------------------------------------------------------
       *
       * IMPORTANT:
       * There is deliberately NO opacity/flicker value here.
       *
       * The workstation root must never be made transparent by
       * this animation loop.
       */

      let jitterX = 0;
      let jitterY = 0;

      if (
        instability > 0.15 ||
        radiationRatio > 0.08
      ) {
        const jitterIntensity =
          instability * 0.28 +
          radiationRatio * 0.52;

        jitterX =
          (Math.random() - 0.5) *
          jitterIntensity;

        /*
         * Rare horizontal sync slip.
         */
        if (
          Math.random() >
          0.984 -
            instability * 0.03 -
            radiationRatio * 0.04
        ) {
          jitterX +=
            (Math.random() - 0.5) *
            (instability * 1.5 +
              radiationRatio * 2.5);
        }

        /*
         * Rare vertical deflection.
         */
        if (
          Math.random() >
          0.993 -
            radiationRatio * 0.01
        ) {
          jitterY =
            (Math.random() - 0.5) *
            (instability * 1.0 +
              radiationRatio * 1.5);
        }
      }

      /*
       * ------------------------------------------------------------
       * CHROMATIC ABERRATION
       * ------------------------------------------------------------
       */

      let chromaticShift = 0;

      if (
        dustRatio > 0.15 ||
        instability > 0.25 ||
        radiationRatio > 0.05
      ) {
        const baseShift =
          dustRatio * 0.6 +
          instability * 0.5 +
          radiationRatio * 1.2;

        const shiftOsc =
          Math.sin(t * 1.8) *
          Math.cos(t * 0.6);

        chromaticShift = Math.min(
          2.2,
          baseShift *
            (0.5 + shiftOsc * 0.3)
        );

        if (
          Math.random() >
          0.995 -
            radiationRatio * 0.01
        ) {
          chromaticShift = Math.min(
            3.0,
            chromaticShift * 1.8
          );
        }
      }

      /*
       * ------------------------------------------------------------
       * SCANLINES
       * ------------------------------------------------------------
       */

      const scanlineOpacity = Math.max(
        0.06,
        Math.min(
          0.20,
          0.08 +
            dustRatio * 0.08 +
            radiationRatio * 0.04
        )
      );

      /*
       * ------------------------------------------------------------
       * GLOBAL CRT VARIABLES
       * ------------------------------------------------------------
       *
       * These are the only values this hook is allowed to mutate.
       *
       * --crt-flicker is intentionally NOT touched.
       */

      if (typeof document !== "undefined") {
        const rootStyle =
          document.documentElement.style;

        rootStyle.setProperty(
          "--crt-jitter-x",
          `${jitterX.toFixed(2)}px`
        );

        rootStyle.setProperty(
          "--crt-jitter-y",
          `${jitterY.toFixed(2)}px`
        );

        rootStyle.setProperty(
          "--crt-chromatic-shift",
          `${chromaticShift.toFixed(2)}px`
        );

        rootStyle.setProperty(
          "--crt-scanline-opacity",
          scanlineOpacity.toFixed(3)
        );
      }

      frameRef.current =
        requestAnimationFrame(updateDrift);
    };

    frameRef.current =
      requestAnimationFrame(updateDrift);

    return () => {
      mounted = false;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  return {
    jitterStyles: {
      transition:
        "transform 0.01s ease",
    } as React.CSSProperties,

    observerStability,
    dustIndex,
    currentCpm,
  };
}