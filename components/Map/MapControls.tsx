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
    <div className="absolute bottom-20 md:bottom-24 right-4 md:right-6 z-30 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="w-11 h-11 md:w-10 md:h-10 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200 active:scale-90 active:bg-fog/20"
        aria-label="Zoom in"
      >
        <Plus size={18} className="md:w-4 md:h-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="w-11 h-11 md:w-10 md:h-10 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200 active:scale-90 active:bg-fog/20"
        aria-label="Zoom out"
      >
        <Minus size={18} className="md:w-4 md:h-4" />
      </button>
      <button
        onClick={onFitBounds}
        className="w-11 h-11 md:w-10 md:h-10 bg-shadow/90 backdrop-blur-sm border border-fog/60 rounded-lg flex items-center justify-center text-ash hover:text-bone hover:border-ash transition-all duration-200 active:scale-90 active:bg-fog/20"
        aria-label="Fit all markers"
      >
        <Maximize size={18} className="md:w-4 md:h-4" />
      </button>
    </div>
  );
}