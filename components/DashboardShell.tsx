"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTerminalStore } from "@/state/terminalStore";
import { Terminal } from "@/components/Terminal";

type ModuleKey = "atlas" | "investigate" | "evidence" | "archive" | "bunker7";

interface ModuleDef {
  key: ModuleKey;
  label: string;
  abbr: string;
  status: "active" | "locked" | "corrupted";
}

const MODULES: ModuleDef[] = [
  { key: "atlas", label: "ATLAS", abbr: "AT", status: "active" },
  { key: "investigate", label: "INVESTIGATIONS", abbr: "IN", status: "active" },
  { key: "evidence", label: "EVIDENCE BOARD", abbr: "EV", status: "active" },
  { key: "archive", label: "DOCUMENT ARCHIVE", abbr: "AR", status: "active" },
  { key: "bunker7", label: "BUNKER_7", abbr: "B7", status: "locked" },
];

function DustLayer() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.08 - 0.02,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.25 + 0.05,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 197, 169, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center justify-between border-b border-[#2a2520] bg-[#141210] px-5 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#4a9a4a] shadow-[0_0_4px_#4a9a4a]" />
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#5a5045]">SYS.ONLINE</span>
        </div>
        <div className="h-3 w-px bg-[#2a2520]" />
        <span className="font-mono text-[10px] tracking-wider text-[#4a4035]">VANISHING POINTS ARCHIVE</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-wider text-[#3a3530]">DUST</span>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-[#1a1815]">
          <motion.div
            className="h-full rounded-full bg-[#ffb000]/40"
            animate={{ width: ["12%", "14%", "11%", "13%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <span className="font-mono text-[9px] text-[#5a5045]">0.12 μg/m³</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-wider text-[#5a5045]">{time} UTC</span>
        <div className="h-3 w-px bg-[#2a2520]" />
        <span className="font-mono text-[9px] tracking-wider text-[#3a3530]">PRESS ~ FOR TERMINAL</span>
      </div>
    </div>
  );
}

function ModuleTab({ mod, active, onClick }: { mod: ModuleDef; active: boolean; onClick: () => void }) {
  const isLocked = mod.status === "locked";
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex flex-col items-start border-r border-[#2a2520] px-4 py-3 transition-all ${
        active ? "bg-[#1c1916]" : "bg-[#141210] hover:bg-[#1a1815]"
      } ${isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-0 h-full w-0.5 bg-[#ffb000]"
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        />
      )}
      <span className={`font-mono text-[10px] font-bold tracking-[0.2em] ${active ? "text-[#ffb000]" : "text-[#4a4035]"}`}>
        {mod.abbr}
      </span>
      <span className={`mt-0.5 font-mono text-[9px] tracking-wider ${active ? "text-[#8a7560]" : "text-[#3a3530]"}`}>
        {mod.label}
      </span>
      <div className="mt-1.5 flex items-center gap-1">
        <div
          className={`h-1 w-1 rounded-full ${
            isLocked ? "bg-[#5a3a3a]" : active ? "bg-[#4a9a4a] shadow-[0_0_3px_#4a9a4a]" : "bg-[#2a2520]"
          }`}
        />
        <span className="font-mono text-[7px] tracking-wider text-[#3a3530]">
          {isLocked ? "LOCKED" : active ? "LIVE" : "STBY"}
        </span>
      </div>
    </button>
  );
}

function ModulePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="border border-[#2a2520] bg-[#141210] p-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#ffb000]/30" />
          <span className="font-mono text-xs tracking-[0.2em] text-[#5a5045]">{label}</span>
        </div>
        <p className="font-mono text-sm text-[#3a3530]">Module mounted. Awaiting content.</p>
        <p className="mt-2 font-mono text-[10px] text-[#2a2520]">Wire your component into DashboardShell to activate.</p>
      </div>
    </div>
  );
}

export function DashboardShell() {
  const terminalOpen = useTerminalStore((s) => s.isOpen);
  const [activeModule, setActiveModule] = useState<ModuleKey>("atlas");
  const activeMod = MODULES.find((m) => m.key === activeModule)!;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0908]">
      <DustLayer />
      <motion.div
        animate={{ height: terminalOpen ? "55vh" : "100vh" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="flex w-full flex-col"
      >
        <StatusBar />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-36 flex-col border-r border-[#2a2520] bg-[#141210]">
            <div className="border-b border-[#2a2520] px-4 py-2.5">
              <span className="font-mono text-[8px] tracking-[0.3em] text-[#3a3530]">MODULES</span>
            </div>
            <div className="flex flex-1 flex-col">
              {MODULES.map((mod) => (
                <ModuleTab
                  key={mod.key}
                  mod={mod}
                  active={mod.key === activeModule}
                  onClick={() => setActiveModule(mod.key)}
                />
              ))}
            </div>
            <div className="border-t border-[#2a2520] px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-[#ffb000]/20" />
                <span className="font-mono text-[7px] tracking-wider text-[#2a2520]">v2.1.7</span>
              </div>
            </div>
          </div>
          <div className="relative flex-1 bg-[#0f0e0c]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, #ffb000 1px, #ffb000 2px)`,
              }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full"
              >
                {activeModule === "atlas" && <ModulePlaceholder label="ATLAS — GEOGRAPHIC INDEX" />}
                {activeModule === "investigate" && <ModulePlaceholder label="INVESTIGATIONS — CASE FILES" />}
                {activeModule === "evidence" && <ModulePlaceholder label="EVIDENCE BOARD — CONNECTIONS" />}
                {activeModule === "archive" && <ModulePlaceholder label="DOCUMENT ARCHIVE — RECORDS" />}
                {activeModule === "bunker7" && <ModulePlaceholder label="BUNKER_7 — SECURE CHANNEL" />}
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none absolute bottom-3 right-4">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#1a1815]">{activeMod.label}</span>
            </div>
          </div>
        </div>
      </motion.div>
      <Terminal />
    </div>
  );
}