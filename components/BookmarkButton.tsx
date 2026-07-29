"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { showToast } from "@/lib/toast";

interface Props {
  place: { _id: string; name: string; slug: string };
  variant?: "dark" | "light";
}

export default function BookmarkButton({ place, variant = "light" }: Props) {
  const { isBookmarked, toggle } = useBookmarks();
  const active = isBookmarked(place._id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(place);
    showToast(
      active
        ? `Removed ${place.name} from log`
        : `Added ${place.name} to expedition log`,
      "success"
    );
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono uppercase tracking-wider transition-all ${
        active
          ? variant === "light"
            ? "bg-[#4a3a28] border-[#6b5a42] text-[#ddd0bc]"
            : "bg-[#ddd0bc] border-[#9a8a72] text-[#3d3228]"
          : variant === "light"
          ? "bg-transparent border-[rgba(122,107,82,0.25)] text-[#9a8a72] hover:border-[#9a8a72] hover:text-[#ddd0bc]"
          : "bg-transparent border-[rgba(122,107,82,0.25)] text-[#7a6e5e] hover:border-[#9a8a72] hover:text-[#3d3228]"
      }`}
      title={active ? "Remove from expedition log" : "Add to expedition log"}
    >
      <Bookmark size={11} fill={active ? "currentColor" : "none"} />
      {active ? "Logged" : "Log"}
    </button>
  );
}