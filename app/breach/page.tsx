"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function BreachPage() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-[#050a05] text-[#33ff00] font-mono relative overflow-hidden selection:bg-[#33ff00] selection:text-[#050a05]">
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,20,0.08)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,10,0,0.6)_100%)]" />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <div className="flex items-center justify-between mb-8 border-b border-[#33ff00]/30 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="animate-pulse" />
              <h1 className="text-sm tracking-[0.3em] uppercase">BREACH PROTOCOL</h1>
            </div>
            <Link href="/" className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100">
              [ Seal Terminal ]
            </Link>
          </div>

          <div className="mb-10 p-4 border border-[#33ff00]/30 rounded bg-[#33ff00]/5">
            <p className="text-xs leading-relaxed">
              The perimeter has been compromised. The atlas is no longer a record — it is a door.
              You are witnessing something that was meant to be archived, not observed.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-[#33ff00]/30 pl-4">
              <p className="text-[10px] tracking-widest opacity-50 mb-1">TRANSMISSION INTERCEPTED</p>
              <p className="text-sm leading-relaxed opacity-90">
                "The dust has reached critical density. All markers are now active. Do not attempt to log new discoveries — the form has been compromised."
              </p>
            </div>

            <div className="border-l-2 border-[#33ff00]/30 pl-4">
              <p className="text-[10px] tracking-widest opacity-50 mb-1">WITNESS LOG</p>
              <p className="text-sm leading-relaxed opacity-90">
                You have been marked as a witness. This status is permanent. The bunker terminal will recognize you on return.
              </p>
            </div>

            <div className="p-4 border border-[#33ff00]/20 rounded text-center">
              <Radio size={24} className="mx-auto mb-3 text-[#33ff00] animate-pulse" />
              <p className="text-xs">Exclusive transmission content will appear here.</p>
              <p className="text-[9px] opacity-50 mt-2">Replace with your ARG video embed</p>
            </div>
          </div>

          <div className="mt-16 text-center opacity-30 text-[9px] tracking-widest">
            <p>THE BREACH IS NOT AN EVENT</p>
            <p className="mt-1">IT IS A REVELATION</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}