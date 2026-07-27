"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { PlaceCategory } from "@/types";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  category: PlaceCategory | "all";
  onCategoryChange: (v: PlaceCategory | "all") => void;
  sort: "recent" | "danger" | "views";
  onSortChange: (v: "recent" | "danger" | "views") => void;
}

export default function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search the archives..."
          className="w-full pl-10 pr-4 py-2.5 bg-shadow border border-fog/40 rounded-lg text-sm text-bone placeholder:text-ash/50 focus:border-ash focus:ring-1 focus:ring-ash/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-shadow border border-fog/40 rounded-lg p-0.5">
          {(["all", "abandoned", "haunted", "both"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                category === cat
                  ? "bg-fog text-bone"
                  : "text-ash hover:text-bone"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-ash" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-transparent text-ash text-xs font-mono border-none outline-none cursor-none"
          >
            <option value="recent">Recently added</option>
            <option value="danger">Most dangerous</option>
            <option value="views">Most viewed</option>
          </select>
        </div>
      </div>
    </div>
  );
}