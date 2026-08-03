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
    both: "Twinned",
  };

  const styles = {
    dark: {
      abandoned: { bg: "#5a4a32", border: "#7a6b52" },
      haunted: { bg: "#5a4a3a", border: "#8a7a6a" },
      both: { bg: "#4a4232", border: "#6b5a42" },
    },
    light: {
      abandoned: { bg: "#5a4a32", border: "#7a6b52" },
      haunted: { bg: "#5a4a3a", border: "#8a7a6a" },
      both: { bg: "#4a4232", border: "#6b5a42" },
    },
  };

  const s = styles[variant][category];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-[0.15em]"
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: "#ddd0bc",
      }}
    >
      {labels[category]}
    </span>
  );
}