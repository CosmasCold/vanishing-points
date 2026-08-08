'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, typography, microform } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function applyArchivePalette(mapInstance: mapboxgl.Map) {
  const style = mapInstance.getStyle();
  if (!style?.layers) return;

  style.layers.forEach((layer: any) => {
    const layerId = layer.id;

    if (layer.type === 'background') {
      mapInstance.setPaintProperty(layerId, 'background-color', '#0a0807');
      mapInstance.setPaintProperty(layerId, 'background-opacity', 0.95);
    }

    if (layerId.includes('water')) {
      mapInstance.setPaintProperty(layerId, 'fill-color', '#05070b');
      mapInstance.setPaintProperty(layerId, 'fill-opacity', 0.95);
    }

    if (layerId.includes('land')) {
      mapInstance.setPaintProperty(layerId, 'fill-color', '#17120d');
      mapInstance.setPaintProperty(layerId, 'fill-opacity', 1);
    }

    if (layerId.includes('road') || layerId.includes('bridge') || layerId.includes('tunnel')) {
      mapInstance.setPaintProperty(layerId, 'line-color', 'rgba(201, 169, 110, 0.16)');
      mapInstance.setPaintProperty(layerId, 'line-width', 0.8);
    }

    if (layer.type === 'symbol' && (layerId.includes('label') || layerId.includes('place'))) {
      mapInstance.setLayoutProperty(layerId, 'visibility', 'none');
    }
  });

  mapInstance.setFog({
    color: '#130e0a',
    'high-color': '#0a0604',
    range: [0.2, 1.5],
    'horizon-blend': 0.2,
  });
}

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();
  const { selectNode, setFocusNode, setViewMode } = useEvidenceBoardStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [10, 20],
      zoom: 1.5,
      projection: { name: 'mercator' },
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      applyArchivePalette(map.current!);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current || places.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValid = false;
    places.forEach((place) => {
      if (place.coordinates?.length === 2) {
        bounds.extend(place.coordinates as [number, number]);
        hasValid = true;
      }
    });

    if (hasValid) {
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        duration: 1200,
        maxZoom: 10,
      });
    }
  }, [mapLoaded, places]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      if (!place.coordinates || place.coordinates.length !== 2) return;

      const el = document.createElement('div');
      const isSelected = selectedPlaceSlug === place.slug;
      const markerColor =
        place.status === 'sealed' ? colors.archive.red :
        place.status === 'whispered' ? colors.archive.blue :
        place.status === 'mirage' ? colors.archive.grayLight :
        colors.archive.green;

      el.innerHTML = `
        <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border: 1.3px solid ${microform.halogen}; border-radius: 999px; box-shadow: 0 0 10px ${microform.halogenGlow}; background: rgba(10, 8, 6, 0.8); transform: ${isSelected ? 'scale(1.16)' : 'scale(1)'};"></div>
          <div style="width: 6px; height: 6px; border-radius: 999px; background: ${markerColor}; box-shadow: 0 0 8px ${markerColor};"></div>
        </div>
      `;
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';
      el.style.transform = isSelected ? 'scale(1.16)' : 'scale(1)';

      const handleHover = (active: boolean) => {
        const ring = el.firstElementChild as HTMLElement | null;
        const dot = ring?.lastElementChild as HTMLElement | null;
        if (!ring || !dot) return;
        ring.style.boxShadow = active
          ? `0 0 12px ${microform.halogen}, 0 0 4px ${microform.halogen}`
          : `0 0 10px ${microform.halogenGlow}`;
        ring.style.transform = active ? 'scale(1.12)' : isSelected ? 'scale(1.16)' : 'scale(1)';
        dot.style.boxShadow = active ? `0 0 10px ${markerColor}` : `0 0 8px ${markerColor}`;
      };

      el.addEventListener('mouseenter', () => handleHover(true));
      el.addEventListener('mouseleave', () => handleHover(false));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        click();
        selectPlace(place.slug);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(place.coordinates as [number, number])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [mapLoaded, places, selectPlace, click, selectedPlaceSlug]);

  useEffect(() => {
    if (!map.current || !selectedPlaceSlug) return;
    const place = places.find((p) => p.slug === selectedPlaceSlug);
    if (place?.coordinates) {
      map.current.flyTo({
        center: place.coordinates as [number, number],
        zoom: 11,
        duration: 1500,
      });
    }

    selectNode(selectedPlaceSlug);
    setFocusNode(selectedPlaceSlug);
    setViewMode('detail');
  }, [selectedPlaceSlug, places, selectNode, setFocusNode, setViewMode]);

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 rounded-[2px] border border-[#2b241d]"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.025), 0 0 0 1px ${microform.mahogany}, 0 8px 24px rgba(0,0,0,0.35)`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)`,
        }}
      />
      <div ref={mapContainer} className="absolute inset-0" style={{ borderRadius: '2px' }} />

      {/* Optical glass overlay — replaces scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(10, 8, 6, 0.45) 100%),
            linear-gradient(180deg, rgba(255, 170, 85, 0.035) 0%, transparent 50%),
            linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 10%, transparent 90%, rgba(255,255,255,0.02) 100%)
          `,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Subtle dust grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Corner brackets — iron survey marks */}
      {[
        { pos: 'top-4 left-4', borders: 'border-t border-l' },
        { pos: 'top-4 right-4', borders: 'border-t border-r' },
        { pos: 'bottom-4 left-4', borders: 'border-b border-l' },
        { pos: 'bottom-4 right-4', borders: 'border-b border-r' },
      ].map((corner) => (
        <div
          key={corner.pos}
          className={`absolute ${corner.pos} w-6 h-6 pointer-events-none ${corner.borders}`}
          style={{
            borderColor: 'rgba(255, 170, 85, 0.2)',
            boxShadow: '0 0 8px rgba(255, 170, 85, 0.05)',
          }}
        />
      ))}

      {/* Readout — iron bezel */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 pointer-events-none"
        style={{
          border: `1px solid ${microform.iron}`,
          background: `linear-gradient(180deg, ${microform.mahogany} 0%, ${microform.iron} 100%)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <span
          style={{
            color: microform.halogen,
            fontFamily: typography.mono,
            fontSize: typography.sizes.xs,
            letterSpacing: '0.08em',
            textShadow: microform.halogenText,
          }}
        >
          ATLAS SECTOR VIEW • {places.length} ARCHIVES INDEXED
        </span>
      </div>
    </div>
  );
};