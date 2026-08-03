"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, Skull, Calendar, Radio, BookOpen, Wind } from "lucide-react";
import Link from "next/link";
import { claimDossier } from "@/lib/dossiers";
import { accumulateDust } from "@/hooks/useDustLevel";
import { showToast } from "@/lib/toast";

interface Place {
  _id: string;
  name: string;
  slug: string;
  category: string;
  coordinates: [number, number];
  address: {
    city: string;
    country: string;
    formatted: string;
  };
  yearAbandoned?: number;
  history: string;
  hauntingReports: string[];
  dangerLevel: number;
  photos: string[];
  viewCount: number;
}

export default function PlacePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expeditionLogged, setExpeditionLogged] = useState(false);

  // Fetch place
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/places/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setPlace(data.place);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // Fire-and-forget view increment
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/places/${slug}/views`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  // Auto-claim dossier if this place has one
  useEffect(() => {
    if (!slug) return;
    const claimed = claimDossier(slug);
    if (claimed) {
      showToast(`Field report archived: ${slug}`, "success");
    }
  }, [slug]);

  const logExpedition = () => {
    if (!place) return;
    const key = "vp-expedition-log";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (existing.find((e: any) => e.slug === place.slug)) {
      showToast("Already documented in expedition log.", "info");
      return;
    }
    existing.push({
      _id: place._id,
      slug: place.slug,
      name: place.name,
      addedAt: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(existing));
    accumulateDust(3);
    setExpeditionLogged(true);
    showToast("Expedition logged. +3% dust.", "success");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-[#ddd0bc] font-mono flex items-center justify-center">
        <div className="text-center space-y-3">
          <Radio size={20} className="mx-auto animate-pulse opacity-40" />
          <p className="text-xs uppercase tracking-[0.3em] opacity-40">Retrieving archive record...</p>
        </div>
      </main>
    );
  }

  if (error || !place) {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-[#ddd0bc] font-mono flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <Skull size={24} className="mx-auto opacity-20" />
          <h1 className="font-cinzel text-lg tracking-wide">Signal Lost</h1>
          <p className="text-xs opacity-40 leading-relaxed">
            The archive contains no record of this location. The coordinates may have been corrupted or the entry purged.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity border-b border-[#9a8a72]/20 pb-1"
          >
            <ArrowLeft size={12} /> Return to Atlas
          </Link>
        </div>
      </main>
    );
  }

  const isHaunted = place.category === "haunted" || place.category === "both";
  const isAbandoned = place.category === "abandoned" || place.category === "both";

  return (
    <main className="min-h-screen bg-[#0c0a08] text-[#ddd0bc] font-mono selection:bg-[#9a8a72]/20">
      {/* CRT */}
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
          mixBlendMode: "multiply",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: "radial-gradient(circle at 50% 45%, transparent 55%, rgba(12,10,8,0.3) 85%, rgba(8,6,4,0.45) 100%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-40 hover:opacity-80 transition-opacity">
            <ArrowLeft size={12} /> Atlas
          </Link>
          <span className="text-[8px] uppercase tracking-[0.3em] opacity-20">BUNKER_7 // SURFACE INTEL</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-cinzel text-xl md:text-2xl tracking-wide" style={{ color: "#ddd0bc", textShadow: "0 0 12px rgba(221,208,188,0.08)" }}>
              {place.name}
            </h1>
            <div className="flex items-center gap-2">
              {isHaunted && (
                <span className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded border" style={{ borderColor: "rgba(196,120,90,0.3)", color: "#c4785a" }}>
                  Haunted
                </span>
              )}
              {isAbandoned && (
                <span className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded border" style={{ borderColor: "rgba(90,78,66,0.4)", color: "#9a8a72" }}>
                  Abandoned
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-[11px] uppercase tracking-[0.15em] opacity-40">
            <span className="flex items-center gap-1.5"><MapPin size={10} />{place.address.city}, {place.address.country}</span>
            {place.yearAbandoned && <span className="flex items-center gap-1.5"><Calendar size={10} />Abandoned {place.yearAbandoned}</span>}
            <span className="flex items-center gap-1.5"><Skull size={10} style={{ color: place.dangerLevel > 3 ? "#c4785a" : undefined }} />Danger {place.dangerLevel}/5</span>
            <span className="flex items-center gap-1.5 font-mono opacity-30"><Radio size={10} />{place.coordinates[1].toFixed(4)}°N, {place.coordinates[0].toFixed(4)}°E</span>
          </div>

          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(122,107,82,0.25), transparent)" }} />
        </motion.div>

        {/* Photos */}
        {place.photos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {place.photos.map((photo, i) => (
              <div key={i} className="relative aspect-[16/10] rounded-lg overflow-hidden border group" style={{ borderColor: "rgba(122,107,82,0.12)" }}>
                <img
                  src={photo}
                  alt={`${place.name} — ${i + 1}`}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ filter: "sepia(0.3) contrast(1.05) brightness(0.9)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08]/60 to-transparent" />
              </div>
            ))}
          </motion.div>
        )}

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={12} style={{ color: "#9a8a72", opacity: 0.6 }} />
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Archive Record</span>
          </div>
          <div className="text-[13px] md:text-[14px] leading-[1.85] opacity-85 space-y-4" style={{ color: "#ddd0bc" }}>
            {place.history.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </motion.div>

        {/* Haunting Reports */}
        {place.hauntingReports.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={12} style={{ color: "#c4785a", opacity: 0.6 }} />
              <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold" style={{ color: "#c4785a" }}>Field Reports</span>
            </div>
            <div className="space-y-3">
              {place.hauntingReports.map((report, i) => (
                <div key={i} className="p-3.5 md:p-4 rounded-lg border-l-2" style={{ borderColor: "rgba(196,120,90,0.25)", background: "rgba(196,120,90,0.03)" }}>
                  <p className="text-[12px] md:text-[13px] leading-[1.75] opacity-75" style={{ color: "#ddd0bc" }}>{report}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="pt-4">
          <div className="h-px w-full mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(122,107,82,0.15), transparent)" }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={logExpedition}
              disabled={expeditionLogged}
              className="flex items-center gap-2.5 px-5 py-3 rounded-lg text-[11px] font-mono uppercase tracking-[0.15em] font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: expeditionLogged ? "#5a4e42" : "#0c0a08",
                background: expeditionLogged ? "transparent" : "linear-gradient(135deg, #9a8a72, #7a6a52)",
                border: expeditionLogged ? "1px solid rgba(90,78,66,0.2)" : "1px solid rgba(122,107,82,0.3)",
                boxShadow: expeditionLogged ? "none" : "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              <BookOpen size={13} />
              {expeditionLogged ? "Documented" : "Log Expedition"}
            </button>

            <Link
              href="/echoes"
              className="flex items-center gap-2.5 px-5 py-3 rounded-lg text-[11px] font-mono uppercase tracking-[0.15em] transition-all hover:opacity-80"
              style={{ color: "#9a8a72", border: "1px solid rgba(122,107,82,0.15)", background: "rgba(122,107,82,0.04)" }}
            >
              <Radio size={13} />
              Open Terminal
            </Link>
          </div>
          {expeditionLogged && (
            <p className="text-[10px] opacity-30 mt-3 uppercase tracking-wider">Record archived. Dust accumulation updated.</p>
          )}
        </motion.div>

        <div className="text-center opacity-15 text-[8px] tracking-[0.4em] uppercase pt-8 pb-4">
          <p>The dust remembers everything</p>
        </div>
      </div>
    </main>
  );
}