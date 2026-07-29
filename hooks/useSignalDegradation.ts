"use client";

import { useEffect } from "react";

export function useSignalDegradation(mapRef: React.MutableRefObject<any>, containerRef: React.MutableRefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const handleZoom = () => {
      const zoom = map.getZoom();
      const intensity = Math.max(0, Math.min(1, (zoom - 10) / 6));
      container.style.setProperty("--degrade", intensity.toString());
    };

    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [mapRef, containerRef]);
}