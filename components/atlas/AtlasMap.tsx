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

  // 1. Initialize Mapbox Instance
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Monochrome dark theme matching BUNKER_7
      center: [6, 7],
      zoom: 1.6,
    });

    mapInstance.on('load', () => {
      applyArchivePalette(mapInstance);
      setMapLoaded(true);
    });

    map.current = mapInstance;

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 2. Render and Manage Glow Markers
  useEffect(() => {
    if (!mapLoaded || !map.current || places.length === 0) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    places.forEach((place) => {
      if (!place.coordinates) return;

      // Create physical node element
      const el = document.createElement('div');
      el.className = 'map-marker';

      // Aesthetic color assignment matching categories and database statuses
      const statusColor = place.status === 'sealed' 
        ? colors.archive.red 
        : place.status === 'whispered' 
          ? colors.archive.blue 
          : place.status === 'mirage' 
            ? colors.archive.white 
            : colors.archive.green;

      const isSelected = selectedPlaceSlug === place.slug;

      // Old-school glowing radar coordinates styling
      el.style.width = isSelected ? '14px' : '8px';
      el.style.height = isSelected ? '14px' : '8px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = statusColor;
      el.style.border = isSelected ? `2px solid ${colors.archive.amber}` : '1px solid rgba(0,0,0,0.6)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.boxShadow = isSelected 
        ? `0 0 16px ${statusColor}, 0 0 24px ${colors.archive.amber}` 
        : `0 0 8px ${statusColor}`;

      // Tactical HUD hover behaviors
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = `0 0 18px ${statusColor}`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = isSelected 
          ? `0 0 16px ${statusColor}, 0 0 24px ${colors.archive.amber}` 
          : `0 0 8px ${statusColor}`;
      });

      // Synchronize click handlers with global stores
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        click(); // Plays the mechanical relay sound
        selectPlace(place.slug);
        
        // Push coordinate details to the Evidence Board
        selectNode(place.slug);
        setFocusNode(place.slug);
        setViewMode('focus');
      });

      // Bind to Map
      const marker = new mapboxgl.Marker(el)
        .setLngLat(place.coordinates as [number, number])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [mapLoaded, places, selectedPlaceSlug, selectPlace, click, selectNode, setFocusNode, setViewMode]);

  // 3. Coordinate Fly-To Transitions
  useEffect(() => {
    if (!map.current || !selectedPlaceSlug) return;
    
    const place = places.find((p) => p.slug === selectedPlaceSlug);
    if (place?.coordinates) {
      map.current.flyTo({
        center: place.coordinates as [number, number],
        zoom: 8,
        speed: 1.2,
        curve: 1.4,
        essential: true
      });
    }
  }, [selectedPlaceSlug, places]);

  return (
    <div className="absolute inset-0">
      <div 
        className="absolute inset-0 rounded-[2px] border border-[#2b241d]" 
        style={{ 
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.025), 0 0 0 1px ${microform.mahogany}, 0 8px 24px rgba(0,0,0,0.35)`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none'
        }} 
      />
      <div ref={mapContainer} className="absolute inset-0" style={{ borderRadius: '2px' }} />
    </div>
  );
};
