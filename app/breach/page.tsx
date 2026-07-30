"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function BreachPage() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    // Breach is active if countdown reached 0 (handled by useBreachProtocol)
    // For demo: active if URL param ?active=1 or localStorage flag
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("active") === "1";
    const stored = localStorage.getItem("breach-active");
    const isActive = forced || stored === "true";

    if (!isActive) {
      router.push("/echoes");
      return;
    }

    setActive(true);
    setTimeLeft(3600); // 60 minutes in seconds

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
    <main className="min-h-screen bg-[#050505] text-[#ff4444] font-mono relative overflow-hidden flex items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,68,68,0.05)_50%,transparent_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.9)_100%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full text-center space-y-8 relative z-10"
      >
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.5em] opacity-60 animate-pulse">Breach Protocol Active</p>
          <h1 className="text-4xl font-bold tracking-wider">THE SEAL IS BROKEN</h1>
          <p className="text-2xl font-mono opacity-80">{formatTime(timeLeft)}</p>
        </div>

        <div className="border border-[#ff4444]/30 rounded-lg p-6 bg-[#ff4444]/5 space-y-4">
          <p className="text-sm leading-relaxed opacity-90">
            It's not what's on the other side. It's that the other side is already here.
          </p>
          <p className="text-xs opacity-60">
            The door opened at 03:14. The grid is hemorrhaging. For the next hour, the truth is visible.
          </p>
        </div>

        <div className="space-y-4">
          {!claimed ? (
            <button
              onClick={claimCode}
              className="px-8 py-3 border-2 border-[#ff4444] rounded text-sm uppercase tracking-widest hover:bg-[#ff4444] hover:text-black transition-all duration-300"
            >
              Claim Witness Code
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider opacity-60">Your witness code</p>
              <p className="text-2xl font-bold tracking-widest">{localStorage.getItem("breach-claimed")}</p>
              <p className="text-[10px] opacity-40">This code will never be available again.</p>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-[#ff4444]/20">
          <p className="text-[11px] leading-relaxed opacity-70">
            BUNKER_7 final transmission: "It's not what I thought. I looked through the door and saw my own face looking back. Older. Dustier. The other me smiled. Then the seal broke and I was alone again."
          </p>
        </div>

        <Link href="/" className="inline-block text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity pt-4">
          [ Return to Atlas ]
        </Link>
      </motion.div>
    </main>
  );
}