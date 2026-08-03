"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X, Minus } from "lucide-react";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParentDomain(window.location.hostname);
    }
  }, []);

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

  useEffect(() => {
    if (!isLive) {
      setPanelState((prev) => ({ ...prev, dismissed: false }));
    }
  }, [isLive]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panelState));
    }
  }, [panelState]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - panelState.x,
      y: e.clientY - panelState.y,
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
    // Bridge: log that the player acknowledged the signal
    if (typeof window !== "undefined") {
      localStorage.setItem("vp-signal-seen-at", Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setPanelState((prev) => ({ ...prev, dismissed: true }));
  };

  if (!isLive || panelState.dismissed) return null;

  // ─── COLLAPSED: Ember pulse badge ───
  if (panelState.collapsed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={handleExpand}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-md select-none transition-all active:scale-95"
        style={{
          borderColor: "rgba(196,120,90,0.22)",
          background: "rgba(12,10,8,0.92)",
          boxShadow: "0 0 20px rgba(196,120,90,0.06)",
          color: "#c4785a",
        }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
            style={{ background: "#c4785a" }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: "#c4785a" }}
          />
        </span>
        <span className="text-[11px] uppercase tracking-widest font-bold font-mono">
          Signal
        </span>
        <span className="text-[10px] opacity-40 font-mono">
          {liveSignal}%
        </span>
      </motion.button>
    );
  }

  // ─── EXPANDED: Draggable intercept panel ───
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed z-40 w-[calc(100vw-16px)] md:w-[480px] rounded-xl overflow-hidden touch-none"
      style={{
        left: panelState.x,
        top: panelState.y,
        background: "rgba(12,10,8,0.96)",
        border: "1px solid rgba(196,120,90,0.15)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(196,120,90,0.04)",
      }}
    >
      {/* Drag Handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="h-8 flex items-center justify-between px-3 select-none"
        style={{
          cursor: "grab",
          background: "rgba(18,14,10,0.8)",
          borderBottom: "1px solid rgba(122,107,82,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <Activity size={12} style={{ color: "#c4785a" }} className="animate-pulse" />
          <span className="text-[11px] uppercase tracking-widest font-bold font-mono" style={{ color: "#c4785a" }}>
            Intercepted Transmission
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] opacity-40 font-mono" style={{ color: "#9a8a72" }}>
            SIG:{liveSignal}%
          </span>
          <button
            onClick={handleMinimize}
            className="opacity-30 hover:opacity-80 transition-opacity p-0.5"
            style={{ color: "#9a8a72" }}
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={handleDismiss}
            className="opacity-30 hover:opacity-80 transition-opacity p-0.5"
            style={{ color: "#9a8a72" }}
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
          title="Intercepted bunker transmission"
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{
          borderTop: "1px solid rgba(122,107,82,0.06)",
          background: "rgba(18,14,10,0.6)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#c4785a" }}
          />
          <span className="text-[10px] opacity-40 uppercase tracking-wider font-mono" style={{ color: "#9a8a72" }}>
            BUNKER_7 RELAY
          </span>
        </div>
        <span className="text-[10px] opacity-25 font-mono" style={{ color: "#5a4e42" }}>
          UNAUTHORIZED FEED
        </span>
      </div>
    </motion.div>
  );
}