'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { useUIStore } from '@/state/uiStore';
import { useAtlasStore } from '@/state/atlasStore';

interface GeigerConfig {
  baseCpm?: number;      // Background radiation counts per minute
  maxCpm?: number;       // Maximum possible counts per minute
  volume?: number;       // Master volume of clicks (0 to 1)
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

// Global Geiger Zustand store to unify AtlasMap, GeigerHUD, and useTerminalJitter
export const useGeigerStore = create<GeigerStore>((set) => ({
  isActive: false,
  currentCpm: 12,
  uSvh: 12 * 0.0057,
  hoveredPlaceSlug: null,
  setIsActive: (active) => set({ isActive: active }),
  setCurrentCpm: (cpm) => set({ currentCpm: cpm, uSvh: cpm * 0.0057 }),
  setUSvh: (uSvh) => set({ uSvh }),
  setHoveredPlaceSlug: (slug) => set({ hoveredPlaceSlug: slug }),
}));

export function useGeigerCounter({
  baseCpm = 12,
  maxCpm = 3600,
  volume = 0.25
}: GeigerConfig = {}) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const { status } = useUIStore();
  const { selectedPlaceSlug, places } = useAtlasStore();
  const { 
    isActive, 
    currentCpm, 
    uSvh, 
    hoveredPlaceSlug, 
    setIsActive, 
    setCurrentCpm, 
    setUSvh 
  } = useGeigerStore();

  const nextClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  // 1. Calculate active radiation target factor based on player environment (selected or hovered)
  const getTargetCpm = useCallback((): number => {
    let multiplier = 1.0;
    
    // Read dust index as a primary ambient charge carrier
    const dustLevel = status?.dustIndex || 0;
    multiplier += (dustLevel / 100) * 8.0; // Moderate dust increases background clicks

    // Prioritize hovered place, then fallback to selected place
    const activeSlug = hoveredPlaceSlug || selectedPlaceSlug;

    if (activeSlug) {
      const activePlace = places.find(p => p.slug === activeSlug);
      if (activePlace) {
        // Danger level scales base energy [230, 245]
        const danger = activePlace.dangerLevel || 1;
        multiplier += danger * 4.0;

        // Specific lore-accurate radiation hotspots [194, 267, 311, 320]
        const hotZones: Record<string, number> = {
          'chernobyl-reactor-4-control-room': 250.0, // Critical hotspot
          'pripyat-hospital-126': 180.0,            // Discarded uniforms basement [267]
          'pripyat-amusement-park': 90.0,           // Radiation meter near river still ticks [311]
          'kola-superdeep-borehole': 140.0,         // Subterranean hum listening [320]
          'duga-radar-array': 70.0,                 // Pulse telemetry [194]
          'blackwood-hospital': 50.0,               // Infrasound Ward 4 [194]
        };

        if (hotZones[activePlace.slug]) {
          multiplier *= (1.0 + hotZones[activePlace.slug] / 10.0);
        }
      }
    }

    const calculatedCpm = Math.min(maxCpm, baseCpm * multiplier);
    return Math.max(baseCpm, calculatedCpm);
  }, [selectedPlaceSlug, hoveredPlaceSlug, places, status?.dustIndex, baseCpm, maxCpm]);

  // 2. Synthesize a single authentic high-pitched electrostatic discharge crackle
  const playGeigerClick = useCallback((ctx: AudioContext) => {
    if (ctx.state === 'suspended') return;

    const now = ctx.currentTime;
    
    // Each click is created with a microscopic high-passed noise burst (metal contact discharge)
    const bufferSize = 0.005 * ctx.sampleRate; // Ultra short duration (~5ms)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Highpass filter removes muddy low-end to create a sharp metallic "tick"
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(1600, now);

    // Bandpass filter adds the small plastic case resonance chamber profile (~3500 Hz)
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(3500, now);
    bpFilter.Q.setValueAtTime(4.0, now);

    // Instant volume rise with immediate exponential decay
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * (0.6 + Math.random() * 0.4), now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.004);

    noiseNode.connect(hpFilter);
    hpFilter.connect(bpFilter);
    bpFilter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(now);
  }, [volume]);

  // 3. Poisson Distribution Scheduler (True Radioactive Decay Simulation)
  const scheduleNextClick = useCallback(() => {
    if (!isPlayingRef.current || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const targetCpm = getTargetCpm();
    
    // Update live indicators in store
    setCurrentCpm(Math.round(targetCpm));
    setUSvh(targetCpm * 0.0057);

    // lambda = clicks per second
    const lambda = targetCpm / 60.0;
    
    // Generate exponential random variable
    const randomVal = Math.random();
    const delaySeconds = -Math.log(1.0 - randomVal) / lambda;
    
    playGeigerClick(ctx);

    nextClickTimeoutRef.current = setTimeout(() => {
      scheduleNextClick();
    }, delaySeconds * 1000);
  }, [getTargetCpm, playGeigerClick, setCurrentCpm, setUSvh]);

  // 4. Initialize Audio Session safely
  const start = useCallback(() => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    isPlayingRef.current = true;
    setIsActive(true);
    
    // Kickstart decay loop
    scheduleNextClick();
  }, [scheduleNextClick, setIsActive]);

  // 5. Tear down timeouts and context cleanly
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsActive(false);

    if (nextClickTimeoutRef.current) {
      clearTimeout(nextClickTimeoutRef.current);
      nextClickTimeoutRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, [setIsActive]);

  useEffect(() => {
    // Keep internal scheduling parameters refreshed when state details shift
    if (isPlayingRef.current) {
      const targetCpm = getTargetCpm();
      setCurrentCpm(Math.round(targetCpm));
      setUSvh(targetCpm * 0.0057);
    }
  }, [getTargetCpm, setCurrentCpm, setUSvh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (nextClickTimeoutRef.current) clearTimeout(nextClickTimeoutRef.current);
    };
  }, []);

  return {
    isActive,
    currentCpm,
    uSvh,
    start,
    stop
  };
}
