"use client";

import { Plus, Minus, Maximize } from "lucide-react";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitBounds: () => void;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onFitBounds,
}: Props) {
  return (
    <div className="absolute bottom-24 right-6 z-30 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="w-9 h-9 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onZoomOut}
        className="w-9 h-9 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={onFitBounds}
        className="w-9 h-9 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200"
        aria-label="Fit all markers"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
}