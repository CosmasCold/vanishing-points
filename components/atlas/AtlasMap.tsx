'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();
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
      const style = map.current?.getStyle();
      if (style?.layers) {
        style.layers.forEach((layer: any) => {
          if (layer.type === 'symbol' && layer.id.includes('label')) {
            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fit bounds to all places on initial load
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

  // Add markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      if (!place.coordinates || place.coordinates.length !== 2) return;

      const el = document.createElement('div');
      el.className = 'archive-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = `2px solid ${colors.archive.amber}`;
      el.style.backgroundColor =
        place.status === 'sealed' ? colors.archive.red :
        place.status === 'whispered' ? colors.archive.blue :
        place.status === 'mirage' ? colors.archive.grayLight :
        colors.archive.green;
      el.style.cursor = 'pointer';
      el.style.boxShadow = `0 0 6px ${colors.archive.amber}40`;
      el.style.transition = 'all 0.15s ease';

      el.addEventListener('mouseenter', () => {
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.boxShadow = `0 0 10px ${colors.archive.amber}70`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.boxShadow = `0 0 6px ${colors.archive.amber}40`;
      });

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
  }, [mapLoaded, places, selectPlace, click]);

  // Fly to selected
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
  }, [selectedPlaceSlug, places]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)' }}
      />

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.3 }} />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.3 }} />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.3 }} />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: colors.archive.amber, opacity: 0.3 }} />

      {/* Readout */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 border pointer-events-none"
        style={{
          borderColor: colors.archive.grayDark,
          backgroundColor: 'rgba(20, 20, 18, 0.85)',
          color: colors.archive.gray,
          fontFamily: typography.mono,
          fontSize: typography.sizes.xs,
        }}
      >
        ATLAS SECTOR VIEW • {places.length} ARCHIVES INDEXED
      </div>
    </div>
  );
};