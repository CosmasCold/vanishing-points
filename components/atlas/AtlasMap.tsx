'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, microform } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

function applyArchivePalette(mapInstance: mapboxgl.Map) {
  try {
    mapInstance.setFog({
      color: '#130e0a',
      'high-color': '#0a0604',
      range: [0.2, 1.5],
      'horizon-blend': 0.2,
    });
  } catch (error) {
    console.warn('[AtlasMap] Failed to apply archive fog:', error);
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'sealed':
      return colors.archive.red;

    case 'whispered':
      return colors.archive.blue;

    case 'mirage':
      return colors.archive.white;

    default:
      return colors.archive.green;
  }
}

export const AtlasMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const { places, selectPlace, selectedPlaceSlug } = useAtlasStore();
  const { click } = useAudioStore();

  const {
    selectNode,
    setFocusNode,
    setViewMode,
  } = useEvidenceBoardStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  /*
   * --------------------------------------------------------------------------
   * MAP INITIALIZATION
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!mapContainer.current) {
      console.error('[AtlasMap] Map container is missing.');
      return;
    }

    if (map.current) {
      return;
    }

    if (!MAPBOX_TOKEN) {
      const message =
        'NEXT_PUBLIC_MAPBOX_TOKEN is missing. Mapbox cannot initialize.';

      console.error(`[AtlasMap] ${message}`);
      setMapError(message);
      return;
    }

    console.log('[AtlasMap] Initializing Mapbox...');
    console.log('[AtlasMap] Token present:', Boolean(MAPBOX_TOKEN));
    console.log(
      '[AtlasMap] Token prefix:',
      MAPBOX_TOKEN.slice(0, 8) + '...'
    );

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [30.0542, 51.4061],
      zoom: 1.6,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });

    map.current = mapInstance;

    /*
     * Mapbox errors are asynchronous, so they must be handled
     * separately from the constructor try/catch.
     */
    const handleMapError = (event: mapboxgl.ErrorEvent) => {
      console.error('[AtlasMap] Mapbox error:', event.error);

      const message =
        event.error?.message ||
        'Unknown Mapbox error. Check the browser console.';

      setMapError(message);
    };

    const handleMapLoad = () => {
      console.log('[AtlasMap] Map loaded successfully.');

      applyArchivePalette(mapInstance);

      setMapLoaded(true);
      setMapError(null);
    };

    mapInstance.on('error', handleMapError);
    mapInstance.once('load', handleMapLoad);

    return () => {
      console.log('[AtlasMap] Cleaning up Mapbox instance.');

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      mapInstance.off('error', handleMapError);
      mapInstance.remove();

      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  /*
   * --------------------------------------------------------------------------
   * MARKERS
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!mapLoaded || !map.current) {
      return;
    }

    const mapInstance = map.current;

    // Remove previous markers before rebuilding them.
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    places.forEach((place) => {
      if (!place.coordinates) {
        return;
      }

      const coordinates = place.coordinates as [number, number];
      const statusColor = getStatusColor(place.status);
      const isSelected = selectedPlaceSlug === place.slug;

      const el = document.createElement('button');

      el.type = 'button';
      el.className = 'map-marker';
      el.setAttribute(
        'aria-label',
        `Open ${place.name}`
      );

      /*
       * Base marker styling.
       */
      el.style.width = isSelected ? '14px' : '8px';
      el.style.height = isSelected ? '14px' : '8px';
      el.style.padding = '0';
      el.style.margin = '0';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = statusColor;
      el.style.border = isSelected
        ? `2px solid ${colors.archive.amber}`
        : '1px solid rgba(0, 0, 0, 0.6)';
      el.style.cursor = 'pointer';
      el.style.display = 'block';
      el.style.transition =
        'transform 0.2s ease, box-shadow 0.2s ease';

      const normalShadow = isSelected
        ? `0 0 16px ${statusColor}, 0 0 24px ${colors.archive.amber}`
        : `0 0 8px ${statusColor}`;

      el.style.boxShadow = normalShadow;

      /*
       * Hover state.
       */
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = `0 0 18px ${statusColor}`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = normalShadow;
      });

      /*
       * Selection.
       */
      el.addEventListener('click', (event) => {
        event.stopPropagation();

        click();

        selectPlace(place.slug);
        selectNode(place.slug);
        setFocusNode(place.slug);
        setViewMode('focus');
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coordinates)
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [
    mapLoaded,
    places,
    selectedPlaceSlug,
    selectPlace,
    click,
    selectNode,
    setFocusNode,
    setViewMode,
  ]);

  /*
   * --------------------------------------------------------------------------
   * CAMERA
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedPlaceSlug) {
      return;
    }

    const place = places.find(
      (candidate) => candidate.slug === selectedPlaceSlug
    );

    if (!place?.coordinates) {
      return;
    }

    map.current.flyTo({
      center: place.coordinates as [number, number],
      zoom: 8,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [mapLoaded, selectedPlaceSlug, places]);

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[2px]"
      style={{
        background: '#130e0a',
      }}
    >
      {/* Mapbox canvas */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          zIndex: 0,
          borderRadius: '2px',
        }}
      />

      {/* Archive visual treatment */}
      <div
        className="absolute inset-0 rounded-[2px] border border-[#2b241d]"
        style={{
          zIndex: 1,
          pointerEvents: 'none',
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.025),
            0 0 0 1px ${microform.mahogany},
            0 8px 24px rgba(0,0,0,0.35)
          `,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)',
        }}
      />

      {/* Diagnostic error overlay */}
      {mapError && (
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{
            zIndex: 20,
            pointerEvents: 'none',
            background: 'rgba(10, 8, 6, 0.82)',
          }}
        >
          <div
            className="max-w-md border p-4"
            style={{
              borderColor: colors.archive.red,
              background: 'rgba(20, 15, 12, 0.96)',
              color: colors.archive.red,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
              }}
            >
              ATLAS MAP / MAPBOX FAILURE
            </div>

            <div
              style={{
                color: colors.archive.grayLight,
              }}
            >
              {mapError}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!mapLoaded && !mapError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            zIndex: 10,
            pointerEvents: 'none',
            background: 'rgba(19, 14, 10, 0.45)',
          }}
        >
          <div
            style={{
              color: colors.archive.amber,
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
            }}
          >
            INITIALIZING ATLAS...
          </div>
        </div>
      )}
    </div>
  );
};