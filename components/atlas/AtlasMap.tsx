'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAtlasStore } from '@/state/atlasStore';
import { colors, typography } from '@/styles/theme';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function getMarkerColor(place: { status: string; dangerLevel: number }): string {
  if (place.status === 'sealed') return colors.archive.red;
  if (place.status === 'whispered') return colors.archive.blue;
  if (place.status === 'mirage') return colors.archive.white;
  if (place.dangerLevel >= 4) return colors.archive.red;
  if (place.dangerLevel === 3) return colors.archive.amber;
  return colors.archive.green;
}

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const { places, viewport, setViewport, selectPlace, filterCategory, filterStatus } =
    useAtlasStore();

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [viewport.lng, viewport.lat],
      zoom: viewport.zoom,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    map.on('load', () => {
      map.setPaintProperty('background', 'background-color', colors.archive.black);
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setViewport({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    });

    map.on('click', () => selectPlace(null));
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = places.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });

    filtered.forEach((place) => {
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getMarkerColor(place);
      el.style.boxShadow = `0 0 8px 2px ${getMarkerColor(place)}40`;
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';

      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.5)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(place.coordinates)
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlace(place.slug);
      });

      markersRef.current.push(marker);
    });
  }, [places, filterCategory, filterStatus]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !places.length) return;
    const place = places.find((p) => p.slug === useAtlasStore.getState().selectedPlaceId);
    if (place) {
      map.flyTo({ center: place.coordinates, zoom: 12, duration: 2000, essential: true });
    }
  }, [useAtlasStore.getState().selectedPlaceId]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.archive.black }}>
        <div className="text-center space-y-2" style={{ fontFamily: typography.mono }}>
          <div style={{ color: colors.archive.amber }}>[ATLAS RENDERER OFFLINE]</div>
          <div style={{ color: colors.archive.gray, fontSize: typography.sizes.sm }}>
            Mapbox access token not configured.
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
};