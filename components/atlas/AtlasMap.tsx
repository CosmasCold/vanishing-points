'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, microform } from '@/styles/theme';
import { Place } from '@/types/places';

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function isValidCoordinates(
  coordinates: Place['coordinates'] | undefined
): coordinates is [number, number] {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  );
}

function applyArchivePalette(mapInstance: mapboxgl.Map) {
  const style = mapInstance.getStyle();

  style.layers?.forEach((layer) => {
    const layerId = layer.id.toLowerCase();

    try {
      if (layer.type === 'background') {
        mapInstance.setPaintProperty(layer.id, 'background-color', '#0a0807');
        mapInstance.setPaintProperty(layer.id, 'background-opacity', 0.95);
      }

      if (layer.type === 'fill' && layerId.includes('water')) {
        mapInstance.setPaintProperty(layer.id, 'fill-color', '#05070b');
        mapInstance.setPaintProperty(layer.id, 'fill-opacity', 0.95);
      }

      if (layer.type === 'fill' && layerId.includes('land')) {
        mapInstance.setPaintProperty(layer.id, 'fill-color', '#17120d');
        mapInstance.setPaintProperty(layer.id, 'fill-opacity', 1);
      }

      if (
        layer.type === 'line' &&
        (layerId.includes('road') ||
          layerId.includes('bridge') ||
          layerId.includes('tunnel'))
      ) {
        mapInstance.setPaintProperty(
          layer.id,
          'line-color',
          'rgba(201, 169, 110, 0.16)'
        );
        mapInstance.setPaintProperty(layer.id, 'line-width', 0.8);
      }

      if (
        layer.type === 'symbol' &&
        (layerId.includes('label') ||
          layerId.includes('place') ||
          layerId.includes('poi'))
      ) {
        mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    } catch (error) {
      console.warn('[AtlasMap] Failed to restyle layer:', layer.id, error);
    }
  });

  try {
    mapInstance.setFog({
      color: '#130e0a',
      'high-color': '#0a0604',
      range: [0.2, 1.5],
      'horizon-blend': 0.2,
    });
  } catch (error) {
    console.warn('[AtlasMap] Fog configuration failed:', error);
  }
}

function getStatusColor(place: Place): string {
  if (place.status === 'sealed') return colors.archive.red;
  if (place.status === 'whispered') return colors.archive.blue;
  if (place.status === 'mirage') return colors.archive.white;
  return colors.archive.green;
}

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();
  const { selectNode, setFocusNode, setViewMode } = useEvidenceBoardStore();

  useEffect(() => {
    if (!mapContainer.current) {
      console.error('[AtlasMap] Container not found.');
      return;
    }

    if (mapRef.current) {
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.error('[AtlasMap] Mapbox token is missing.');
      return;
    }

    console.log('[AtlasMap] Initializing Mapbox...');
    console.log('[AtlasMap] Token present:', true);
    console.log(
      '[AtlasMap] Token prefix:',
      `${MAPBOX_TOKEN.slice(0, 10)}...`
    );

    mapboxgl.accessToken = MAPBOX_TOKEN;

    let mapInstance: mapboxgl.Map;

    try {
      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,

        style: 'mapbox://styles/mapbox/dark-v11',

        projection: 'mercator',

        center: [30.0542, 51.4061],

        zoom: 1.6,

        renderWorldCopies: true,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
    } catch (error) {
      console.error(
        '[AtlasMap] Failed to create Mapbox instance:',
        error
      );

      return;
    }

    mapRef.current = mapInstance;

    const handleLoad = () => {
      console.log('[AtlasMap] Map loaded successfully.');

      try {
        mapInstance.setProjection('mercator');

        console.log(
          '[AtlasMap] Projection:',
          mapInstance.getProjection().name
        );
      } catch (error) {
        console.error(
          '[AtlasMap] Failed to set Mercator projection:',
          error
        );
      }

      applyArchivePalette(mapInstance);
      setMapLoaded(true);

      requestAnimationFrame(() => {
        mapInstance.resize();

        console.log(
          '[AtlasMap] Map resized after projection change.'
        );
      });
    };

    const handleError = (event: mapboxgl.ErrorEvent) => {
      console.error(
        '[AtlasMap] Mapbox error:',
        event.error
      );
    };

    mapInstance.on('load', handleLoad);
    mapInstance.on('error', handleError);

    /*
     * Resize observer helps when the Atlas panel changes size
     * after React/layout initialization.
     */
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();

      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];

      mapInstance.off('load', handleLoad);
      mapInstance.off('error', handleError);

      mapInstance.remove();

      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    places.forEach((place) => {
      if (!isValidCoordinates(place.coordinates)) {
        console.warn(
          '[AtlasMap] Invalid coordinates for place:',
          place.slug,
          place.coordinates
        );

        return;
      }

      const statusColor = getStatusColor(place);
      const isSelected = selectedPlaceSlug === place.slug;

      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.position = 'relative';
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.pointerEvents = 'auto';
      el.style.transition = 'transform 0.2s ease';
      el.style.transform = isSelected ? 'scale(1.16)' : 'scale(1)';

      const ring = document.createElement('div');
      ring.style.position = 'absolute';
      ring.style.inset = '0';
      ring.style.border = `1.3px solid ${microform.halogen}`;
      ring.style.borderRadius = '999px';
      ring.style.background = 'rgba(10, 8, 6, 0.8)';
      ring.style.boxShadow = isSelected
        ? `0 0 14px ${statusColor}, 0 0 6px ${microform.halogen}`
        : `0 0 10px ${microform.halogenGlow}`;
      ring.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

      const dot = document.createElement('div');
      dot.style.width = isSelected ? '8px' : '6px';
      dot.style.height = isSelected ? '8px' : '6px';
      dot.style.borderRadius = '999px';
      dot.style.background = statusColor;
      dot.style.boxShadow = `0 0 8px ${statusColor}`;
      dot.style.transition = 'width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease';
      dot.style.zIndex = '1';

      const handleMouseEnter = () => {
        el.style.transform = 'scale(1.22)';
        ring.style.boxShadow = `0 0 12px ${microform.halogen}, 0 0 4px ${microform.halogen}`;
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.boxShadow = `0 0 10px ${statusColor}`;
      };

      const handleMouseLeave = () => {
        el.style.transform = isSelected ? 'scale(1.16)' : 'scale(1)';
        ring.style.boxShadow = isSelected
          ? `0 0 14px ${statusColor}, 0 0 6px ${microform.halogen}`
          : `0 0 10px ${microform.halogenGlow}`;
        dot.style.width = isSelected ? '8px' : '6px';
        dot.style.height = isSelected ? '8px' : '6px';
        dot.style.boxShadow = `0 0 8px ${statusColor}`;
      };

      const handleClick = (event: MouseEvent) => {
        event.stopPropagation();

        click();
        selectPlace(place.slug);
        selectNode(place.slug);
        setFocusNode(place.slug);
        setViewMode('focus');
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('click', handleClick);
      el.appendChild(ring);
      el.appendChild(dot);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(place.coordinates)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [
    mapLoaded,
    places,
    selectedPlaceSlug,
    click,
    selectPlace,
    selectNode,
    setFocusNode,
    setViewMode,
  ]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedPlaceSlug) {
      return;
    }

    const place = places.find((item) => item.slug === selectedPlaceSlug);

    if (!place || !isValidCoordinates(place.coordinates)) {
      return;
    }

    mapRef.current.flyTo({
      center: place.coordinates,
      zoom: 8,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [mapLoaded, places, selectedPlaceSlug]);

  return (
    <div className="absolute inset-0">
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          borderRadius: '2px',
          minWidth: 0,
          minHeight: 0,
        }}
      />

      <div
        className="absolute inset-0 rounded-[2px] border border-[#2b241d]"
        style={{
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.025),
            0 0 0 1px ${microform.mahogany},
            0 8px 24px rgba(0,0,0,0.35)
          `,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(10, 8, 6, 0.45) 100%),
            linear-gradient(180deg, rgba(255, 170, 85, 0.035) 0%, transparent 50%),
            linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 10%, transparent 90%, rgba(255,255,255,0.02) 100%)
          `,
          mixBlendMode: 'multiply',
          zIndex: 11,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          zIndex: 12,
        }}
      />

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
            zIndex: 13,
          }}
        />
      ))}
    </div>
  );
};

export default AtlasMap;
