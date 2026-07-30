"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Activity, X, Minus } from "lucide-react";

interface Props {
  twitchChannel: string;
}

type PanelState = {
  x: number;
  y: number;
  collapsed: boolean;
  dismissed: boolean;
};

const STORAGE_KEY = "bunker-live-panel";

function getDefaultPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  if (isMobile) {
    return { x: 8, y: vh - 280 };
  }
  return { x: vw - 504, y: vh - 340 };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function LiveSignalOverlay({ twitchChannel }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [liveSignal, setLiveSignal] = useState(0);
  const [parentDomain, setParentDomain] = useState("localhost");

  const panelRef = useRef<HTMLDivElement>(null);
  const [panelState, setPanelState] = useState<PanelState>(() => {
    if (typeof window === "undefined") {
      return { ...getDefaultPosition(), collapsed: false, dismissed: false };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        x: saved.x ?? getDefaultPosition().x,
        y: saved.y ?? getDefaultPosition().y,
        collapsed: saved.collapsed ?? false,
        dismissed: saved.dismissed ?? false,
      };
    } catch {
      return { ...getDefaultPosition(), collapsed: false, dismissed: false };
    }
  });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Detect domain for Twitch embed
  useEffect(() => {
    if (typeof window !== "undefined") {
      setParentDomain(window.location.hostname);
    }
  }, []);

  // Poll broadcast status
  useEffect(() => {
    const check = () => {
      const broadcasting = localStorage.getItem("bunker-broadcasting") === "true";
      setIsLive(broadcasting);
      if (broadcasting) setLiveSignal(60 + Math.floor(Math.random() * 35));
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // If broadcast turns off, reset dismissed state so it shows again next time
  useEffect(() => {
    if (!isLive) {
      setPanelState((prev) => ({ ...prev, dismissed: false }));
    }
  }, [isLive]);

  // Clamp position on resize
  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pw = panelRef.current?.offsetWidth ?? 480;
      const ph = panelRef.current?.offsetHeight ?? 300;

      setPanelState((prev) => ({
        ...prev,
        x: clamp(prev.x, 8, vw - pw - 8),
        y: clamp(prev.y, 8, vh - ph - 8),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Persist state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panelState));
    }
  }, [panelState]);

  // Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragOffset.current = {
      x: clientX - panelState.x,
      y: clientY - panelState.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [panelState.x, panelState.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panelRef.current?.offsetWidth ?? 480;
    const ph = panelRef.current?.offsetHeight ?? 300;

    const nextX = clamp(e.clientX - dragOffset.current.x, 8, vw - pw - 8);
    const nextY = clamp(e.clientY - dragOffset.current.y, 8, vh - ph - 8);

    setPanelState((prev) => ({ ...prev, x: nextX, y: nextY }));
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMinimize = () => {
    setPanelState((prev) => ({ ...prev, collapsed: true }));
  };

  const handleExpand = () => {
    setPanelState((prev) => ({ ...prev, collapsed: false }));
  };

  const handleDismiss = () => {
    setPanelState((prev) => ({ ...prev, dismissed: true }));
  };

  // Don't render anything if not live or permanently dismissed this session
  if (!isLive || panelState.dismissed) return null;

  // ─── COLLAPSED: Floating Signal Bar ───
  if (panelState.collapsed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={handleExpand}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a03030]/40 bg-[#0a0808]/90 backdrop-blur-md cursor-pointer select-none transition-colors hover:border-[#a03030]/70"
        style={{ boxShadow: "0 0 20px rgba(160,48,48,0.15)" }}
      >
        <div className="w-2 h-2 rounded-full bg-[#a03030] animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-[#c04040] font-bold">
          LIVE
        </span>
        <span className="text-[9px] opacity-60 font-mono">
          SIG:{liveSignal}%
        </span>
      </motion.button>
    );
  }

  // ─── EXPANDED: Draggable Video Panel ───
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed z-40 w-[calc(100vw-16px)] md:w-[480px] rounded-xl overflow-hidden border border-[#a03030]/30 touch-none"
      style={{
        left: panelState.x,
        top: panelState.y,
        background: "rgba(10,8,8,0.96)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(160,48,48,0.08)",
      }}
    >
      {/* Drag Handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="h-8 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-[#ffffff08] bg-[#0c0a08] select-none"
      >
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#a03030] animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-[#a03030] font-bold">
            UNAUTHORIZED SIGNAL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] opacity-50 font-mono">
            SIG:{liveSignal}%
          </span>
          <button
            onClick={handleMinimize}
            className="opacity-40 hover:opacity-100 transition-opacity p-0.5"
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={handleDismiss}
            className="opacity-40 hover:opacity-100 transition-opacity p-0.5"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative bg-black aspect-video">
        <iframe
          src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${parentDomain}&muted=false&autoplay=true`}
          className="w-full h-full border-0"
          allowFullScreen
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-[#ffffff06]">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#a03030] animate-pulse" />
          <span className="text-[8px] opacity-50 uppercase tracking-wider">
            BUNKER_7 RELAY
          </span>
        </div>
        <span className="text-[8px] opacity-30">TWITCH // UNAUTHORIZED</span>
      </div>
    </motion.div>
  );
}