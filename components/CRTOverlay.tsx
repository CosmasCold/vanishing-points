"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGeigerStore } from "@/hooks/useGeigerCounter";
import { useProgressionStore } from "@/state/progressionStore";
import { getSharedAudioContext } from "@/lib/sharedAudioContext";
import { colors, microform } from "@/styles/theme";

/**
 * HIGH-PERFORMANCE PROCEDURAL CRT OVERLAY COMPONENT // SYSTEM-7B CHASSIS
 *
 * Implements:
 * 1. Physical glass curvature
 * 2. Dynamic phosphor scanlines and shadow mask behavior
 * 3. Electromagnetic radiation-induced screen flicker and sync slips
 * 4. Procedural CRT electrical audio
 * 5. Procedural particulate dust layer
 *
 * AUDIO OWNERSHIP:
 * This component owns the Web Audio nodes it creates.
 * It does NOT own the AudioContext.
 *
 * The AudioContext belongs to sharedAudioContext.ts and must never be
 * closed by this component.
 */
export const CRTOverlay: React.FC = () => {
  const { currentCpm } = useGeigerStore();
  const dust = useProgressionStore(
    (state) => state.dustIndex
  );

  const [flickerClass, setFlickerClass] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);

  const dustCanvasRef =
    useRef<HTMLCanvasElement>(null);

  // Audio Nodes
  const humOscRef =
    useRef<OscillatorNode | null>(null);

  const humGainRef =
    useRef<GainNode | null>(null);

  const flybackOscRef =
    useRef<OscillatorNode | null>(null);

  const flybackGainRef =
    useRef<GainNode | null>(null);

  const slipLfoRef =
    useRef<OscillatorNode | null>(null);

  const slipGainRef =
    useRef<GainNode | null>(null);

  // 1. Calculate active electromagnetic interference ratio.
  //
  // Background = 12 CPM
  // Overload = 1200 CPM
  // Mapped to [0..1]
  const emiRatio = Math.min(
    1.0,
    Math.max(
      0,
      (currentCpm - 12) / 1188
    )
  );

  /**
   * Initialize CRT audio using the application's shared AudioContext.
   *
   * This function NEVER creates a private AudioContext.
   */
  const initCrtAudio = () => {
    if (typeof window === "undefined") {
      return;
    }

    /*
     * Do not create duplicate audio graphs if the CRT audio is
     * already initialized.
     */
    if (
      humOscRef.current ||
      flybackOscRef.current ||
      slipLfoRef.current
    ) {
      return;
    }

    const ctx =
      audioCtxRef.current ??
      getSharedAudioContext();

    if (!ctx) {
      console.warn(
        "[CRT Audio] Shared AudioContext unavailable."
      );
      return;
    }

    if (ctx.state === "closed") {
      console.warn(
        "[CRT Audio] Shared AudioContext is closed."
      );
      return;
    }

    audioCtxRef.current = ctx;

    try {
      if (ctx.state === "suspended") {
        void ctx.resume().catch((error) => {
          console.warn(
            "[CRT Audio] Failed to resume shared AudioContext:",
            error
          );
        });
      }

      const now = ctx.currentTime;

      // --------------------------------------------------
      // A. Main 60Hz Transformer Ground Hum
      // --------------------------------------------------

      const humOsc =
        ctx.createOscillator();

      humOsc.type = "triangle";

      humOsc.frequency.setValueAtTime(
        60.0,
        now
      );

      const humFilter =
        ctx.createBiquadFilter();

      humFilter.type = "lowpass";

      humFilter.frequency.setValueAtTime(
        150,
        now
      );

      const humGain =
        ctx.createGain();

      humGain.gain.setValueAtTime(
        0.001,
        now
      );

      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(ctx.destination);

      humOsc.start(now);

      humOscRef.current = humOsc;
      humGainRef.current = humGain;

      // --------------------------------------------------
      // B. Horizontal Sync Flyback Whistle
      // --------------------------------------------------

      const flybackOsc =
        ctx.createOscillator();

      flybackOsc.type = "sine";

      flybackOsc.frequency.setValueAtTime(
        7812.0,
        now
      );

      const flybackGain =
        ctx.createGain();

      flybackGain.gain.setValueAtTime(
        0.0001,
        now
      );

      flybackOsc.connect(flybackGain);
      flybackGain.connect(ctx.destination);

      flybackOsc.start(now);

      flybackOscRef.current =
        flybackOsc;

      flybackGainRef.current =
        flybackGain;

      // --------------------------------------------------
      // C. Electromagnetic Slip LFO
      // --------------------------------------------------

      const slipLfo =
        ctx.createOscillator();

      slipLfo.type = "sawtooth";

      slipLfo.frequency.setValueAtTime(
        0.85,
        now
      );

      const slipGain =
        ctx.createGain();

      slipGain.gain.setValueAtTime(
        0.0,
        now
      );

      slipLfo.connect(slipGain);

      slipGain.connect(
        flybackOsc.frequency
      );

      slipGain.connect(
        humOsc.frequency
      );

      slipLfo.start(now);

      slipLfoRef.current =
        slipLfo;

      slipGainRef.current =
        slipGain;
    } catch (error) {
      console.warn(
        "[CRT Audio] Failed to initialize synthesized hum:",
        error
      );

      /*
       * Partial initialization can occur if the browser rejects
       * one of the node operations.
       *
       * Clean up our nodes, but NEVER close the shared context.
       */
      try {
        humOscRef.current?.disconnect();
      } catch {}

      try {
        humGainRef.current?.disconnect();
      } catch {}

      try {
        flybackOscRef.current?.disconnect();
      } catch {}

      try {
        flybackGainRef.current?.disconnect();
      } catch {}

      try {
        slipLfoRef.current?.disconnect();
      } catch {}

      try {
        slipGainRef.current?.disconnect();
      } catch {}

      humOscRef.current = null;
      humGainRef.current = null;
      flybackOscRef.current = null;
      flybackGainRef.current = null;
      slipLfoRef.current = null;
      slipGainRef.current = null;
    }
  };

  /*
   * Acquire the shared context once when the component mounts.
   *
   * We intentionally do not create the CRT audio graph here.
   * Browser autoplay restrictions mean the actual graph should be
   * initialized from a user interaction.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    audioCtxRef.current =
      getSharedAudioContext();
  }, []);

  // --------------------------------------------------
  // Dynamic audio modulation based on radiation load
  // --------------------------------------------------

  useEffect(() => {
    const ctx =
      audioCtxRef.current;

    if (
      !ctx ||
      ctx.state === "closed"
    ) {
      return;
    }

    /*
     * The graph may not exist yet because the browser may still be
     * waiting for a user gesture.
     */
    if (
      !humGainRef.current ||
      !flybackGainRef.current ||
      !slipGainRef.current ||
      !slipLfoRef.current
    ) {
      return;
    }

    const now =
      ctx.currentTime;

    const targetHumVol =
      0.001 +
      emiRatio * 0.015;

    const targetFlybackVol =
      0.0001 +
      emiRatio * 0.002;

    const targetSlipDepth =
      emiRatio * 32.0;

    const targetSlipSpeed =
      0.85 +
      emiRatio * 18.0;

    try {
      humGainRef.current.gain.setTargetAtTime(
        targetHumVol,
        now,
        0.2
      );

      flybackGainRef.current.gain.setTargetAtTime(
        targetFlybackVol,
        now,
        0.15
      );

      slipGainRef.current.gain.setTargetAtTime(
        targetSlipDepth,
        now,
        0.1
      );

      slipLfoRef.current.frequency.setTargetAtTime(
        targetSlipSpeed,
        now,
        0.25
      );
    } catch {
      /*
       * Audio failure must never propagate into the render tree.
       */
    }
  }, [emiRatio]);

  // --------------------------------------------------
  // Visual Jitter & Sync-Slip animation triggers
  // --------------------------------------------------

  useEffect(() => {
    if (emiRatio < 0.1) {
      setFlickerClass("");
      return;
    }

    const interval =
      setInterval(() => {
        const rand =
          Math.random();

        if (
          rand >
          0.985 -
            emiRatio * 0.15
        ) {
          setFlickerClass(
            "sync-slipping"
          );

          setTimeout(() => {
            setFlickerClass("");
          }, 350);
        } else if (
          rand >
          0.94 -
            emiRatio * 0.1
        ) {
          setFlickerClass(
            "micro-glitch"
          );

          setTimeout(() => {
            setFlickerClass("");
          }, 120);
        } else if (
          Math.random() <
          emiRatio * 0.08
        ) {
          setFlickerClass(
            "deflection-sag"
          );

          setTimeout(() => {
            setFlickerClass("");
          }, 80);
        }
      }, 150);

    return () => {
      clearInterval(interval);
    };
  }, [emiRatio]);

  // --------------------------------------------------
  // Audio activation and node cleanup
  // --------------------------------------------------

  useEffect(() => {
    const handleActivate = () => {
      initCrtAudio();

      const ctx =
        audioCtxRef.current;

      if (
        ctx &&
        ctx.state === "suspended"
      ) {
        void ctx.resume().catch(
          () => {}
        );
      }
    };

    window.addEventListener(
      "click",
      handleActivate
    );

    window.addEventListener(
      "keydown",
      handleActivate
    );

    return () => {
      window.removeEventListener(
        "click",
        handleActivate
      );

      window.removeEventListener(
        "keydown",
        handleActivate
      );

      /*
       * Stop only the nodes owned by CRTOverlay.
       */
      try {
        humOscRef.current?.stop();
      } catch {}

      try {
        flybackOscRef.current?.stop();
      } catch {}

      try {
        slipLfoRef.current?.stop();
      } catch {}

      try {
        humOscRef.current?.disconnect();
      } catch {}

      try {
        humGainRef.current?.disconnect();
      } catch {}

      try {
        flybackOscRef.current?.disconnect();
      } catch {}

      try {
        flybackGainRef.current?.disconnect();
      } catch {}

      try {
        slipLfoRef.current?.disconnect();
      } catch {}

      try {
        slipGainRef.current?.disconnect();
      } catch {}

      humOscRef.current = null;
      humGainRef.current = null;

      flybackOscRef.current = null;
      flybackGainRef.current = null;

      slipLfoRef.current = null;
      slipGainRef.current = null;

      /*
       * IMPORTANT:
       *
       * Do NOT call:
       *
       * audioCtxRef.current?.close();
       *
       * The AudioContext is shared by the entire application.
       */
      audioCtxRef.current = null;
    };
  }, []);

  // --------------------------------------------------
  // Procedural Electrostatic Dust Particulate Loop
  // --------------------------------------------------

  useEffect(() => {
    const canvas =
      dustCanvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width =
        window.innerWidth;

      canvas.height =
        window.innerHeight;
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    handleResize();

    interface Particulate {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      thickness: number;
      angle: number;
      angularSpeed: number;
      opacity: number;
      type: "fiber" | "ash";
      points?: {
        dx: number;
        dy: number;
      }[];
    }

    const particulates: Particulate[] =
      [];

    const particleCount =
      15 +
      Math.floor(
        dust * 0.85
      );

    for (
      let i = 0;
      i < particleCount;
      i++
    ) {
      const type =
        Math.random() > 0.45
          ? "ash"
          : "fiber";

      const p: Particulate = {
        x:
          Math.random() *
          canvas.width,

        y:
          Math.random() *
          canvas.height,

        vx:
          (Math.random() - 0.5) *
          0.15,

        vy:
          Math.random() * 0.08 +
          0.03,

        length:
          type === "fiber"
            ? 5 +
              Math.random() * 10
            : 1 +
              Math.random() * 2.5,

        thickness:
          type === "fiber"
            ? 0.45
            : 1.3,

        angle:
          Math.random() *
          Math.PI *
          2,

        angularSpeed:
          (Math.random() - 0.5) *
          0.005,

        opacity:
          0.18 +
          Math.random() *
            0.32,

        type,
      };

      if (type === "ash") {
        const sides =
          3 +
          Math.floor(
            Math.random() * 3
          );

        p.points = [];

        for (
          let s = 0;
          s < sides;
          s++
        ) {
          const a =
            (s / sides) *
            Math.PI *
            2;

          const r =
            0.5 +
            Math.random() *
              1.5;

          p.points.push({
            dx:
              Math.cos(a) * r,
            dy:
              Math.sin(a) * r,
          });
        }
      }

      particulates.push(p);
    }

    const renderDust = () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      particulates.forEach(
        (p) => {
          const wobbleFactor =
            0.06 +
            (dust / 100) *
              0.12;

          p.y +=
            p.vy *
            (1 +
              (dust / 100) *
                0.5);

          p.x +=
            p.vx +
            Math.sin(
              Date.now() *
                0.0008 +
                p.angle
            ) *
              wobbleFactor;

          p.angle +=
            p.angularSpeed *
            (1 +
              emiRatio * 2.0);

          if (
            p.y >
            canvas.height
          ) {
            p.y = -15;
            p.x =
              Math.random() *
              canvas.width;
          }

          if (
            p.x < -15
          ) {
            p.x =
              canvas.width + 15;
          }

          if (
            p.x >
            canvas.width + 15
          ) {
            p.x = -15;
          }

          ctx.save();

          ctx.translate(
            p.x,
            p.y
          );

          ctx.rotate(
            p.angle
          );

          ctx.strokeStyle =
            `rgba(129, 140, 248, ${p.opacity})`;

          ctx.fillStyle =
            `rgba(129, 140, 248, ${p.opacity * 0.65})`;

          ctx.lineWidth =
            p.thickness;

          if (
            p.type ===
            "fiber"
          ) {
            ctx.beginPath();

            ctx.moveTo(
              -p.length / 2,
              0
            );

            ctx.quadraticCurveTo(
              0,
              Math.sin(
                p.angle
              ) * 2.2,
              p.length / 2,
              0
            );

            ctx.stroke();
          } else if (
            p.points
          ) {
            ctx.beginPath();

            ctx.moveTo(
              p.points[0].dx,
              p.points[0].dy
            );

            for (
              let s = 1;
              s <
              p.points.length;
              s++
            ) {
              ctx.lineTo(
                p.points[s].dx,
                p.points[s].dy
              );
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          ctx.restore();
        }
      );

      animationFrameId =
        requestAnimationFrame(
          renderDust
        );
    };

    renderDust();

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      cancelAnimationFrame(
        animationFrameId
      );
    };
  }, [dust, emiRatio]);

  return (
    <>
      {/* Global CRT Screen Container */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${flickerClass}`}
        style={{
          boxShadow:
            "inset 0 0 80px rgba(0,0,0,0.85), inset 0 0 20px rgba(0,0,0,0.95)",

          backgroundImage: `
            radial-gradient(
              circle at 50% 50%,
              transparent 40%,
              rgba(5,4,3,0.3) 100%
            ),
            linear-gradient(
              135deg,
              rgba(255,170,85,0.015) 0%,
              rgba(255,170,85,0.005) 50%,
              transparent 50.1%
            )
          `,

          filter:
            "url(#crt-lens-curvature)",
        }}
      >
        {/* Scanlines removed per user request */}

        {/* Shadow Mask removed per user request */}

        {/* Constant Phosphorus Decay Flicker */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.98]"
          style={{
            animation: `crt-ambient-flicker ${
              0.18 +
              (1 - emiRatio) * 0.12
            }s infinite alternate ease-in-out`,
          }}
        />

        {/* Procedural Information Dust Canvas */}
        <canvas
          ref={dustCanvasRef}
          className="pointer-events-none absolute inset-0 z-30 opacity-70"
          style={{
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Custom SVG Displacement Filter */}
      <svg
        className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden"
        width="0"
        height="0"
        style={{
          position: "absolute",
          zIndex: -9999,
          visibility: "hidden",
        }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id="crt-lens-curvature"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005"
              numOctaves="1"
              result="noise"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={
                2.2 +
                emiRatio * 4.8
              }
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Embedded CRT Style Sheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes crt-ambient-flicker {
              0% {
                opacity: 0.982;
              }

              100% {
                opacity: ${
                  0.994 -
                  emiRatio * 0.05
                };
              }
            }

            .sync-slipping {
              transform:
                translateY(
                  var(--crt-jitter-y, 4px)
                )
                scaleY(1.01)
                skewX(1.5deg) !important;

              filter:
                contrast(1.4)
                brightness(1.2)
                hue-rotate(15deg) !important;

              animation:
                h-sync-slip 150ms
                infinite alternate !important;
            }

            .micro-glitch {
              transform:
                translate(2px, -1px)
                skewX(-1deg) !important;

              filter:
                saturate(1.8)
                contrast(1.1) !important;
            }

            .deflection-sag {
              filter:
                contrast(0.85)
                brightness(0.9) !important;

              transform:
                scaleY(0.995) !important;
            }

            @keyframes h-sync-slip {
              0% {
                filter:
                  drop-shadow(
                    -3px 0 0
                    rgba(255,0,0,0.6)
                  )
                  drop-shadow(
                    3px 0 0
                    rgba(0,255,255,0.6)
                  );
              }

              100% {
                filter:
                  drop-shadow(
                    3px 0 0
                    rgba(255,0,0,0.6)
                  )
                  drop-shadow(
                    -3px 0 0
                    rgba(0,255,255,0.6)
                  );
              }
            }

            .scanline-crawl {
              animation:
                scanline-crawl-anim
                linear infinite;
            }

            @keyframes scanline-crawl-anim {
              from {
                background-position: 0 0;
              }

              to {
                background-position: 0 100%;
              }
            }
          `,
        }}
      />
    </>
  );
};

export default CRTOverlay;