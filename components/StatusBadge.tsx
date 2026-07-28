"use client";

import { PlaceCategory } from "@/types";

interface Props {
  category: PlaceCategory;
  variant?: "dark" | "light";
}

export default function StatusBadge({ category, variant = "dark" }: Props) {
  const labels = {
    abandoned: "Forsaken",
    haunted: "Spectral",
    both: "Both",
  };

  const styles = {
    dark: {
      abandoned: "bg-[#5a4a32] text-[#ddd0bc] border-[#7a6b52]",
      haunted: "bg-[#4a5a42] text-[#d4c8b4] border-[#6b7a5a]",
      both: "bg-[#4a4232] text-[#ddd0bc] border-[#6b5a42]",
    },
    light: {
      abandoned: "bg-[#5a4a32] text-[#e8dcc8] border-[#7a6b52]",
      haunted: "bg-[#4a5a42] text-[#e8dcc8] border-[#6b7a5a]",
      both: "bg-[#4a4232] text-[#e8dcc8] border-[#6b5a42]",
    },
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-[0.15em] shadow-sm ${styles[variant][category]}`}
    >
      {labels[category]}
    </span>
 
);
}