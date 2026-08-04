"use client";

import { FiSidebar, FiVolume2, FiVolumeX, FiActivity, FiMap } from "react-icons/fi";
import Link from "next/link";

interface TerminalHUDProps {
  dust: number;
  corruption: number;
  theme: string;
  muted: boolean;
  onToggleMute: () => void;
  onToggleSidebar: () => void;
}

export function TerminalHUD({ dust, corruption, theme, muted, onToggleMute, onToggleSidebar }: TerminalHUDProps) {
  const dustBar = Math.min(100, dust);
  const corruptionBar = Math.min(4, corruption);

  const themeColor = {
    tungsten: "#c4785a",
    phosphor: "#4a9a6a",
    amber: "#c4a040",
    bone: "#ddd0bc",
    ember: "#8b3a2a",
    ash: "#5a4e42",
    void: "#3a3028",
    archive: "#7a6b52",
  }[theme] ?? "#c4785a";

  return (
    <div className="vp-hud">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-[rgba(180,160,140,0.06)] transition-colors"
          title="Toggle sidebar [Esc]"
        >
          <FiSidebar className="w-4 h-4 text-[#5a4e42]" />
        </button>

        <div className="flex items-center gap-2">
          <FiActivity className="w-3.5 h-3.5 text-[#5a4e42]" />
          <div className="w-24 h-1.5 bg-[#1a1610] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${dustBar}%`,
                backgroundColor: dustBar > 80 ? "#8b3a2a" : dustBar > 50 ? "#c4785a" : themeColor,
                opacity: 0.7,
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-[#5a4e42] w-8">{dustBar}%</span>
        </div>

        {corruption > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#8b3a2a] animate-flicker">
              CORRUPTION
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-3 rounded-sm"
                  style={{
                    backgroundColor: i < corruptionBar ? "#8b3a2a" : "#1a1610",
                    opacity: i < corruptionBar ? 0.8 : 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span 
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: themeColor, opacity: 0.6 }}
        >
          {theme}
        </span>

        <button
          onClick={onToggleMute}
          className="p-1.5 rounded hover:bg-[rgba(180,160,140,0.06)] transition-colors"
          title={muted ? "Unmute [Ctrl+M]" : "Mute [Ctrl+M]"}
        >
          {muted ? (
            <FiVolumeX className="w-4 h-4 text-[#5a4e42]" />
          ) : (
            <FiVolume2 className="w-4 h-4 text-[#5a4e42]" />
          )}
        </button>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[rgba(180,160,140,0.06)] transition-colors"
        >
          <FiMap className="w-3.5 h-3.5 text-[#5a4e42]" />
          <span className="font-mono text-[10px] text-[#5a4e42]">ATLAS</span>
        </Link>
      </div>
    </div>
  );
}