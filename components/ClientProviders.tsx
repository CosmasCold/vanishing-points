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

  // CRITICAL: During SSR/hydration, render ONLY children.
  // This guarantees zero client hooks run on the server.
  if (!mounted) {
    return <>{children}</>;
  }

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