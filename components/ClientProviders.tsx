"use client";

import { useState, useEffect } from "react";
import GrainOverlay from "@/components/GrainOverlay";
import FogEffect from "@/components/FogEffect";
import CustomCursor from "@/components/CustomCursor";
import BackgroundAudio from "@/components/BackgroundAudio";
import CollaborativeCursors from "@/components/CollaborativeCursors";
import PageTransition from "@/components/PageTransition";
import ToastProvider from "@/components/ToastProvider";
import CorruptionManager from "@/components/CorruptionManager";
import DustCorruption from "@/components/DustCorruption";
import BunkerAudioBridge from "@/components/BunkerAudioBridge";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / initial hydration: render ONLY children, no client overlays
  // This prevents any client component from taking the "0 hooks" SSR path
  if (!mounted) {
    return <>{children}</>;
  }

  // After mount: all client components render in a consistent hook environment
  return (
    <>
      <GrainOverlay />
      <FogEffect />
      <CustomCursor />
      <BackgroundAudio />
      <CollaborativeCursors />
      <CorruptionManager />
      <PageTransition>{children}</PageTransition>
      <ToastProvider />
      <DustCorruption />
      <BunkerAudioBridge />
    </>
  );
}