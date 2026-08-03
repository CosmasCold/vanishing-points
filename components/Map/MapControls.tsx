"use client";

import { Plus, Minus, Maximize } from "lucide-react";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitBounds: () => void;
}

const btnBase =
  "w-11 h-11 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors active:scale-90";

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onFitBounds,
}: Props) {
  return (
    <div className="absolute bottom-20 md:bottom-24 right-4 md:right-6 z-30 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className={btnBase}
        style={{
          backgroundColor: "rgba(12,10,8,0.9)",
          border: "1px solid rgba(122,107,82,0.35)",
          color: "#7a6e5e",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.color = "#ddd0bc";
          el.style.borderColor = "rgba(154,138,114,0.5)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = "#7a6e5e";
          el.style.borderColor = "rgba(122,107,82,0.35)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(122,107,82,0.15)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(12,10,8,0.9)";
        }}
        aria-label="Zoom in"
      >
        <Plus size={18} className="md:w-4 md:h-4" />
      </button>
      <button
        onClick={onZoomOut}
        className={btnBase}
        style={{
          backgroundColor: "rgba(12,10,8,0.9)",
          border: "1px solid rgba(122,107,82,0.35)",
          color: "#7a6e5e",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.color = "#ddd0bc";
          el.style.borderColor = "rgba(154,138,114,0.5)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = "#7a6e5e";
          el.style.borderColor = "rgba(122,107,82,0.35)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(122,107,82,0.15)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(12,10,8,0.9)";
        }}
        aria-label="Zoom out"
      >
        <Minus size={18} className="md:w-4 md:h-4" />
      </button>
      <button
        onClick={onFitBounds}
        className={btnBase}
        style={{
          backgroundColor: "rgba(12,10,8,0.9)",
          border: "1px solid rgba(122,107,82,0.35)",
          color: "#7a6e5e",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.color = "#ddd0bc";
          el.style.borderColor = "rgba(154,138,114,0.5)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = "#7a6e5e";
          el.style.borderColor = "rgba(122,107,82,0.35)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(122,107,82,0.15)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(12,10,8,0.9)";
        }}
        aria-label="Fit all markers"
      >
        <Maximize size={18} className="md:w-4 md:h-4" />
      </button>
    </div>
  );
}