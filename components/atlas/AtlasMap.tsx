'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';

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
      el.className = 'archive-marker';
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '50%';
      el.style.border = `1.5px solid ${microform.halogen}`;
      el.style.backgroundColor =
        place.status === 'sealed' ? colors.archive.red :
        place.status === 'whispered' ? colors.archive.blue :
        place.status === 'mirage' ? colors.archive.grayLight :
        colors.archive.green;
      el.style.cursor = 'pointer';
      el.style.boxShadow = `0 0 8px ${microform.halogenGlow}`;
      el.style.transition = 'all 0.2s ease';

      el.addEventListener('mouseenter', () => {
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.boxShadow = `0 0 14px ${microform.halogen}, 0 0 4px ${microform.halogen}`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.boxShadow = `0 0 8px ${microform.halogenGlow}`;
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

      {/* Optical glass overlay — replaces scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(10, 8, 6, 0.4) 100%),
            linear-gradient(180deg, rgba(255, 170, 85, 0.015) 0%, transparent 50%)
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