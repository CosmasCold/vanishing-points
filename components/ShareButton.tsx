"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export default function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${url}` 
    : url;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? "Link archived to clipboard" : "Transmit record"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all active:scale-95"
      style={{
        background: "rgba(122,107,82,0.08)",
        border: "1px solid rgba(122,107,82,0.15)",
        color: "#7a6e5e",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#5a4e42";
        e.currentTarget.style.borderColor = "rgba(154,138,114,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#7a6e5e";
        e.currentTarget.style.borderColor = "rgba(122,107,82,0.15)";
      }}
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {copied ? "Archived to clipboard" : "Transmit"}
    </button>
  );
}