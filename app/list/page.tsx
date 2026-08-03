"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3, Map as MapIcon } from "lucide-react";
import PlaceCard from "@/components/PlaceCard";
import FilterBar from "@/components/FilterBar";
import SkeletonCard from "@/components/SkeletonCard";
import { useCorruptionStage } from "@/hooks/useCorruptionStage";
import { Place, PlaceCategory } from "@/types";

export default function ListPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [sort, setSort] = useState<"recent" | "danger" | "views">("recent");
  const [dust, setDust] = useState(0);
  const corruption = useCorruptionStage();

  useEffect(() => {
    const readDust = () =>
      setDust(parseInt(localStorage.getItem("vp-dust-accumulation") || "0", 10));
    readDust();
    window.addEventListener("vp-dust-change", readDust);
    return () => window.removeEventListener("vp-dust-change", readDust);
  }, []);

  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...places];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.city.toLowerCase().includes(q) ||
          p.address.country.toLowerCase().includes(q) ||
          p.history.toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }

    switch (sort) {
      case "views":
        result.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "danger":
        // Narrative: "danger" maps to atmospheric weight / resonance
        result.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "recent":
      default:
        result.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        );
    }

    return result;
  }, [places, search, category, sort]);

  return (
    <main
      className="min-h-[100dvh] relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0c0a08 0%, #14100c 100%)" }}
    >
      {/* Subtle vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 50% 30%, transparent 50%, rgba(8,6,4,0.6) 100%)",
        }}
      />

      {/* Corruption bleed from Terminal layer */}
      {corruption.stage >= 2 && (
        <div
          className="pointer-events-none fixed inset-0 z-[1] animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(196,120,90,0.03) 0%, transparent 70%)`,
            animationDuration: "4s",
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-10 lg:py-14 relative z-10">
        {/* ─── HEADER ─── */}
        <div className="mb-8 md:mb-10 pb-5 md:pb-6" style={{ borderBottom: "1px solid rgba(122,107,82,0.12)" }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors duration-300 group"
                style={{ color: "#5a4e42" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#9a8a72")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4e42")}
              >
                <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                Return to Atlas
              </Link>

              <div>
                <h1
                  className="font-cinzel text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide"
                  style={{ color: "#ddd0bc", textShadow: "0 0 18px rgba(221,208,188,0.08)" }}
                >
                  The Archives
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[11px] md:text-xs font-mono uppercase tracking-[0.15em]" style={{ color: "#9a8a72" }}>
                    {filtered.length} documented locations
                  </p>
                  {places.length > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full opacity-30" style={{ background: "#9a8a72" }} />
                      <p className="text-[11px] md:text-xs font-mono uppercase tracking-[0.15em] opacity-40" style={{ color: "#9a8a72" }}>
                        {places.filter((p) => p.category === "haunted").length} spectral
                      </p>
                      <span className="w-1 h-1 rounded-full opacity-30" style={{ background: "#9a8a72" }} />
                      <p className="text-[11px] md:text-xs font-mono uppercase tracking-[0.15em] opacity-40" style={{ color: "#9a8a72" }}>
                        {places.filter((p) => p.category === "abandoned").length} forsaken
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dust bleed — the archive knows you've been in the terminal */}
              {dust > 0 && (
                <div
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-mono uppercase tracking-widest opacity-40"
                  style={{ color: "#c4785a", border: "1px solid rgba(196,120,90,0.15)" }}
                >
                  <span
                    className="inline-block w-1 h-1 rounded-full animate-pulse"
                    style={{ background: "#c4785a" }}
                  />
                  Dust: {dust}%
                </div>
              )}

              <Link
                href="/"
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all duration-300 active:scale-95 flex-shrink-0"
                style={{
                  color: "#9a8a72",
                  background: "rgba(18,14,10,0.65)",
                  border: "1px solid rgba(122,107,82,0.18)",
                  backdropFilter: "blur(6px)",
                  boxShadow: "inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ddd0bc";
                  e.currentTarget.style.borderColor = "rgba(154,138,114,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9a8a72";
                  e.currentTarget.style.borderColor = "rgba(122,107,82,0.18)";
                }}
              >
                <MapIcon size={13} />
                <span className="hidden sm:inline">Map View</span>
              </Link>
            </div>
          </div>

          {/* Bronze trim */}
          <div className="h-px w-full mt-5 md:mt-6" style={{ background: "linear-gradient(90deg, transparent, #9a8a7240, transparent)" }} />
        </div>

        {/* ─── FILTER BAR ─── */}
        <div
          className="rounded-lg p-3 md:p-4 mb-8 md:mb-10 overflow-x-auto no-scrollbar"
          style={{
            background: "rgba(18,14,10,0.6)",
            border: "1px solid rgba(122,107,82,0.12)",
            backdropFilter: "blur(8px)",
            boxShadow: "inset 0 1px 0 rgba(122,107,82,0.05), 0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {/* ─── GRID ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center py-20 md:py-28"
          >
            <Grid3X3 size={32} className="mx-auto mb-5 opacity-20" style={{ color: "#9a8a72" }} />
            <p className="font-cinzel text-lg md:text-xl" style={{ color: "#ddd0bc" }}>
              The archive holds no such record.
            </p>
            <p className="text-xs md:text-sm mt-2 font-mono uppercase tracking-wider opacity-30" style={{ color: "#9a8a72" }}>
              That name is not in the grid.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory("all"); setSort("recent"); }}
              className="mt-6 px-4 py-2 rounded text-[11px] font-mono uppercase tracking-wider transition-all active:scale-95"
              style={{
                color: "#9a8a72",
                border: "1px solid rgba(122,107,82,0.2)",
                background: "rgba(18,14,10,0.5)",
              }}
            >
              Reset Parameters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((place, i) => (
              <motion.div
                key={place._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <PlaceCard place={place} index={i} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── FOOTER ─── */}
        {!loading && filtered.length > 0 && (
          <div className="mt-12 md:mt-16 pt-6 text-center" style={{ borderTop: "1px solid rgba(122,107,82,0.08)" }}>
            <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] opacity-20" style={{ color: "#9a8a72" }}>
              {filtered.length} entries retrieved from the archive
            </p>
            {corruption.stage >= 3 && Math.random() < 0.15 && (
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] mt-2 opacity-15 italic" style={{ color: "#c4785a" }}>
                The dust settled differently while you were reading.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}