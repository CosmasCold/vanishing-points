"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3, Map as MapIcon } from "lucide-react";
import PlaceCard from "@/components/PlaceCard";
import FilterBar from "@/components/FilterBar";
import SkeletonCard from "@/components/SkeletonCard";
import { Place, PlaceCategory } from "@/types";

export default function ListPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [sort, setSort] = useState<"recent" | "danger" | "views">("recent");

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
      case "danger":
        result.sort((a, b) => b.dangerLevel - a.dangerLevel);
        break;
      case "views":
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
    <main className="archive-page min-h-[100dvh]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8 archive-header pb-4 md:pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#9a8a72] hover:text-[#d4c8b4] transition-colors text-xs md:text-sm font-mono mb-2 md:mb-4"
            >
              <ArrowLeft size={12} className="md:w-4 md:h-4" />
              Return to atlas
            </Link>
            <h1 className="archive-title text-xl md:text-3xl font-medium text-[#d4c8b4] mt-1 md:mt-2">
              The archives
            </h1>
            <p className="text-[#9a8a72] text-xs md:text-sm mt-0.5 md:mt-1 font-mono">
              {filtered.length} documented locations
            </p>
          </div>
          <Link
            href="/"
            className="self-start sm:self-auto flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#252018] border border-[rgba(139,115,85,0.25)] rounded-lg text-[#9a8a72] hover:text-[#d4c8b4] hover:border-[rgba(139,115,85,0.4)] transition-all text-xs md:text-sm active:scale-95 flex-shrink-0"
          >
            <MapIcon size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline font-mono text-xs uppercase">
              Map view
            </span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="archive-filter rounded-xl p-3 md:p-4 mb-6 md:mb-8 overflow-x-auto">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 md:py-24"
          >
            <Grid3X3 size={28} className="mx-auto text-[#7a6e5e] mb-3 md:mb-4 md:w-8 md:h-8" />
            <p className="text-[#9a8a72] font-cinzel text-base md:text-lg">
              No records match your query.
            </p>
            <p className="text-[#7a6e5e] text-xs md:text-sm mt-1 font-mono">
              The archives are silent on this matter.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((place, i) => (
              <PlaceCard key={place._id} place={place} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}