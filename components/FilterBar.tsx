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

const CATEGORY_LABELS: Record<PlaceCategory | "all", string> = {
  all: "All",
  abandoned: "Forsaken",
  haunted: "Spectral",
  both: "Dual Nature",
};

const SORT_LABELS: Record<string, string> = {
  recent: "Recent",
  danger: "Highest threat",
  views: "Most witnessed",
};

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
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#5a4e42" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search the archives..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-mono outline-none transition-all placeholder:opacity-30"
          style={{
            background: "rgba(18,14,10,0.65)",
            border: "1px solid rgba(122,107,82,0.18)",
            color: "#ddd0bc",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(154,138,114,0.4)";
            e.currentTarget.style.boxShadow = "0 0 0 1px rgba(154,138,114,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(122,107,82,0.18)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex rounded-lg p-0.5"
          style={{
            background: "rgba(18,14,10,0.65)",
            border: "1px solid rgba(122,107,82,0.18)",
          }}
        >
          {(["all", "abandoned", "haunted", "both"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className="px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all"
              style={{
                color: category === cat ? "#0c0a08" : "#9a8a72",
                background: category === cat ? "#9a8a72" : "transparent",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: "#5a4e42" }} />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "recent" | "danger" | "views")}
            className="bg-transparent text-[11px] font-mono outline-none cursor-pointer"
            style={{ color: "#9a8a72" }}
          >
            <option value="recent" style={{ background: "#0c0a08", color: "#ddd0bc" }}>
              {SORT_LABELS.recent}
            </option>
            <option value="danger" style={{ background: "#0c0a08", color: "#ddd0bc" }}>
              {SORT_LABELS.danger}
            </option>
            <option value="views" style={{ background: "#0c0a08", color: "#ddd0bc" }}>
              {SORT_LABELS.views}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}