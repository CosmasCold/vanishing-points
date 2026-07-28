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
      abandoned: "bg-[#5c2118] text-[#d4c4a8] border-[#8b4513]",
      haunted: "bg-[#3e4a32] text-[#c4c4b5] border-[#5a6b4a]",
      both: "bg-[#4a3a28] text-[#d4c4a8] border-[#6b5a42]",
    },
    light: {
      abandoned: "bg-[#6b3020] text-[#d4c4a8] border-[#8b4513]",
      haunted: "bg-[#3e4a32] text-[#c4c4b5] border-[#5a6b4a]",
      both: "bg-[#4a3a28] text-[#d4c4a8] border-[#6b5a42]",
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