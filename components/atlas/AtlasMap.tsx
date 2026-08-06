'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAtlasStore } from '@/state/atlasStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();
  const { terminalOpen } = useUIStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [10, 50],
      zoom: 3,
      projection: { name: 'mercator' }, // FLAT MAP, not globe
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      // Remove labels for cleaner look
      const style = map.current?.getStyle();
      if (style?.layers) {
        style.layers.forEach((layer) => {
          if (layer.type === 'symbol' && layer.id.includes('label')) {
            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Clear existing markers
    const existing = document.querySelectorAll('.archive-marker');
    existing.forEach((el) => el.remove());

    places.forEach((place) => {
      const el = document.createElement('div');
      el.className = 'archive-marker';
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '50%';
      el.style.border = `2px solid ${colors.archive.amber}`;
      el.style.backgroundColor = place.status === 'sealed' ? colors.archive.red :
        place.status === 'whispered' ? colors.archive.blue :
        colors.archive.green;
      el.style.cursor = 'pointer';
      el.style.boxShadow = `0 0 8px ${colors.archive.amber}`;
      el.style.transition = 'transform 0.2s ease';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
        click();
        selectPlace(place.slug);
      });

      new mapboxgl.Marker({ element: el })
        .setLngLat(place.coordinates)
        .addTo(map.current!);
    });
  }, [mapLoaded, places, selectPlace, click]);

  // Fly to selected
  useEffect(() => {
    if (!map.current || !selectedPlaceSlug) return;
    const place = places.find((p) => p.slug === selectedPlaceSlug);
    if (place) {
      map.current.flyTo({
        center: place.coordinates,
        zoom: 10,
        duration: 1500,
      });
    }
  }, [selectedPlaceSlug, places]);

  return (
    <div
      className="absolute inset-0"
      style={{
        marginBottom: terminalOpen ? spacing.terminalHeight : 0,
      }}
    >
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Scanline overlay for CRT feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)',
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.4 }} />

      {/* Coordinate readout */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 border pointer-events-none"
        style={{
          borderColor: colors.archive.grayDark,
          backgroundColor: 'rgba(20, 20, 18, 0.8)',
          color: colors.archive.gray,
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
        }}
      >
        ATLAS SECTOR VIEW • MERCATOR PROJECTION
      </div>
    </div>
  );
};