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

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.25rem 0.625rem",
    borderRadius: "0.375rem",
    fontSize: "10px",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 150ms ease",
    cursor: "pointer",
    border: "1px solid",
  };

  const variants = {
    dark: {
      active: {
        backgroundColor: "#4a3a28",
        borderColor: "#6b5a42",
        color: "#ddd0bc",
      },
      inactive: {
        backgroundColor: "transparent",
        borderColor: "rgba(122,107,82,0.25)",
        color: "#9a8a72",
      },
    },
    light: {
      active: {
        backgroundColor: "#ddd0bc",
        borderColor: "#9a8a72",
        color: "#0c0a08",
      },
      inactive: {
        backgroundColor: "transparent",
        borderColor: "rgba(122,107,82,0.25)",
        color: "#7a6e5e",
      },
    },
  };

  const current = variants[variant][active ? "active" : "inactive"];

  return (
    <button
      onClick={handleClick}
      className="hover:opacity-90 active:scale-95"
      style={{ ...baseStyle, ...current }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (!active) {
          el.style.borderColor = "#9a8a72";
          el.style.color = variant === "dark" ? "#ddd0bc" : "#0c0a08";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (!active) {
          el.style.borderColor = "rgba(122,107,82,0.25)";
          el.style.color = variant === "dark" ? "#9a8a72" : "#7a6e5e";
        }
      }}
      title={active ? "Remove from expedition log" : "Add to expedition log"}
    >
      <Bookmark size={11} fill={active ? "currentColor" : "none"} />
      {active ? "Logged" : "Log"}
    </button>
  );
}