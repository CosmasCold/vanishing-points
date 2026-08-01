"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Radio } from "lucide-react";

export default function BreachPage() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("active") === "1";
    const stored = localStorage.getItem("breach-active");
    const isActive = forced || stored === "true";

    if (!isActive) {
      router.push("/echoes");
      return;
    }

    setActive(true);
    setTimeLeft(3600);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem("breach-active");
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const claimCode = () => {
    if (claimed) return;
    const code = "BREACH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = JSON.parse(localStorage.getItem("bunker-codes") || "[]");
    existing.push(code);
    localStorage.setItem("bunker-codes", JSON.stringify(existing));
    localStorage.setItem("breach-claimed", code);
    setClaimed(true);
  };

  if (!active) return null;

  return (
    <main
      className="min-h-[100dvh] font-mono relative overflow-hidden flex items-center justify-center p-5 md:p-10"
      style={{ backgroundColor: "#0a0806", color: "#e8c8b8" }}
    >
      {/* ─── CRT / ATMOSPHERE ─── */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(196,120,90,0.06) 0px, rgba(196,120,90,0.06) 1px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "radial-gradient(circle at 50% 45%, transparent 50%, rgba(10,8,6,0.7) 90%, rgba(8,6,4,0.9) 100%)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 30px rgba(196,120,90,0.04)",
        }}
      />
      {/* Corruption pulse */}
      <div
        className="pointer-events-none fixed inset-0 z-40 animate-pulse"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(196,120,90,0.06) 0%, transparent 60%)",
          animationDuration: "2.5s",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg w-full relative z-10"
      >
        {/* ─── HEADER ─── */}
        <div className="text-center space-y-3 mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#c4785a", boxShadow: "0 0 10px #c4785a80" }}
            />
            <p
              className="text-[11px] md:text-xs uppercase tracking-[0.4em] font-bold"
              style={{ color: "#c4785a", textShadow: "0 0 8px rgba(196,120,90,0.4)" }}
            >
              Breach Protocol Active
            </p>
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold tracking-wider leading-tight uppercase"
            style={{
              color: "#e8c8b8",
              textShadow: "0 0 20px rgba(196,120,90,0.25), 0 0 40px rgba(196,120,90,0.08)",
            }}
          >
            The Seal Is Broken
          </h1>

          <div className="flex items-center justify-center gap-3 pt-1">
            <Radio size={14} className="opacity-50" style={{ color: "#c4785a" }} />
            <p
              className="text-2xl md:text-3xl font-mono font-bold tracking-widest tabular-nums"
              style={{ color: "#c4785a", textShadow: "0 0 12px rgba(196,120,90,0.35)" }}
            >
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        {/* ─── MAIN PANEL ─── */}
        <div
          className="rounded-lg p-5 md:p-8 space-y-4 md:space-y-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(18,12,10,0.9), rgba(12,10,8,0.95))",
            border: "1px solid rgba(196,120,90,0.2)",
            borderLeft: "3px solid #c4785a",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(196,120,90,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Inner glow */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #c4785a, transparent 70%)" }}
          />

          <p className="text-sm md:text-base leading-relaxed opacity-90 relative">
            It's not what's on the other side. It's that the other side is already here.
          </p>

          <p className="text-xs md:text-sm opacity-50 leading-relaxed relative">
            The door opened at 03:14. The grid is hemorrhaging. For the next hour, the truth is visible.
          </p>

          <div
            className="h-px w-full my-2"
            style={{ background: "linear-gradient(90deg, transparent, rgba(196,120,90,0.3), transparent)" }}
          />

          {!claimed ? (
            <button
              onClick={claimCode}
              className="w-full py-3.5 md:py-4 rounded text-xs md:text-sm uppercase tracking-[0.25em] font-bold transition-all duration-300 active:scale-95 relative overflow-hidden"
              style={{
                color: "#0a0806",
                background: "linear-gradient(135deg, #c4785a, #a05040)",
                border: "1px solid rgba(196,120,90,0.4)",
                boxShadow: "0 4px 20px rgba(196,120,90,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(196,120,90,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(196,120,90,0.2), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
            >
              <span className="relative z-10">Claim Witness Code</span>
            </button>
          ) : (
            <div className="text-center space-y-3 py-2">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-50">
                Your witness code
              </p>
              <p
                className="text-2xl md:text-3xl font-bold tracking-[0.15em] break-all px-2 font-mono"
                style={{
                  color: "#c4785a",
                  textShadow: "0 0 16px rgba(196,120,90,0.3)",
                }}
              >
                {localStorage.getItem("breach-claimed")}
              </p>
              <p className="text-[10px] md:text-xs opacity-30 uppercase tracking-wider">
                This code will never be available again.
              </p>
            </div>
          )}
        </div>

        {/* ─── TRANSMISSION ─── */}
        <div className="mt-6 md:mt-8 space-y-4">
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(196,120,90,0.15), transparent)" }}
          />
          <div className="flex gap-3">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 opacity-40" style={{ color: "#c4785a" }} />
            <p className="text-xs md:text-sm leading-[1.8] opacity-60 italic">
              BUNKER_7 final transmission: "It's not what I thought. I looked through the door and saw my own face looking back. Older. Dustier. The other me smiled. Then the seal broke and I was alone again."
            </p>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="text-center mt-8 md:mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] opacity-30 hover:opacity-80 transition-all duration-500"
            style={{ color: "#9a8a72" }}
          >
            <span className="inline-block w-1.5 h-px bg-current" />
            Return to Atlas
            <span className="inline-block w-1.5 h-px bg-current" />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}