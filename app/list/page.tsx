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
    fetch("/api/places")   // Removed ?limit=30
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
    <main className="min-h-screen bg-void">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-ash hover:text-bone transition-colors text-sm font-mono mb-4"
            >
              <ArrowLeft size={14} />
              Return to atlas
            </Link>
            <h1 className="font-cinzel text-3xl font-medium text-bone mt-2">
              The archives
            </h1>
            <p className="text-ash text-sm mt-1">
              {filtered.length} documented locations
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-shadow border border-fog/40 rounded-lg text-ash hover:text-bone hover:border-ash transition-all text-sm"
          >
            <MapIcon size={16} />
            <span className="hidden sm:inline font-mono text-xs uppercase">
              Map view
            </span>
          </Link>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Grid3X3 size={32} className="mx-auto text-fog mb-4" />
            <p className="text-ash font-cinzel text-lg">
              No records match your query.
            </p>
            <p className="text-ash/50 text-sm mt-1 font-mono">
              The archives are silent on this matter.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((place, i) => (
              <PlaceCard key={place._id} place={place} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}