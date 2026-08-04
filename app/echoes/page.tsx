"use client";

import { AtmosphericBackground } from "@/components/effects/AtmosphericBackground";
import { TerminalWorkspace } from "@/components/workspaces/TerminalWorkspace";

export default function EchoesPage() {
  return (
    <main className="relative min-h-screen bg-[#060504] overflow-hidden">
      {/* 3D Atmospheric background */}
      <AtmosphericBackground />

      {/* Terminal interface */}
      <TerminalWorkspace />

      {/* Grain overlay from globals.css */}
      <div className="grain-overlay" />
    </main>
  );
}