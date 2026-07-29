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
      className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(122,107,82,0.1)] border border-[rgba(122,107,82,0.2)] rounded-md text-[10px] font-mono uppercase tracking-wider text-[#7a6e5e] hover:text-[#5a4e42] hover:border-[#9a8a72] transition-all"
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}