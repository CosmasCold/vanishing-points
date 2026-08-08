'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, microform } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function applyArchivePalette(mapInstance: mapboxgl.Map) {
  try {
    mapInstance.setFog({
      color: '#130e0a',
      'high-color': '#0a0604',
      range: [0.2, 1.5],
      'horizon-blend': 0.2,
    });
  } catch (error) {
    console.warn('[AtlasMap] Failed to apply fog:', error);
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

  /*
   * ============================================================
   * 1. INITIALIZE MAPBOX
   * ============================================================
   */

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.error('[AtlasMap] Mapbox token is missing.');
      return;
    }

    console.log('[AtlasMap] Initializing Mapbox...');
    console.log('[AtlasMap] Token present:', Boolean(MAPBOX_TOKEN));
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

        /*
         * IMPORTANT:
         * Explicitly force Web Mercator.
         *
         * Newer Mapbox GL versions can use globe projection,
         * so do not rely on the library default here.
         */
        projection: 'mercator',

        /*
         * Initial view.
         * Pripyat / Chernobyl area.
         */
        center: [30.0542, 51.4061],
        zoom: 1.6,

        /*
         * Atlas presentation.
         */
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
    } catch (error) {
      console.error(
        '[AtlasMap] Mapbox GL failed to initialize:',
        error
      );
      return;
    }

    map.current = mapInstance;

    /*
     * ============================================================
     * DIAGNOSTIC EVENTS
     * ============================================================
     *
     * These are intentionally conservative with Mapbox's types.
     * In particular, do NOT access event.source.id because
     * SourceSpecification does not guarantee an id property.
     */

    mapInstance.on('sourcedata', (event) => {
  console.log('[AtlasMap] sourcedata:', {
    sourceId: event.sourceId,
    sourceDataType: event.sourceDataType,
    isSourceLoaded: event.isSourceLoaded,
    dataType: event.dataType,
  });
});

mapInstance.on('styledata', () => {
  console.log('[AtlasMap] Style data loaded.');
});

mapInstance.on('error', (event) => {
  console.error('[AtlasMap] Mapbox error:', event.error);
});

    mapInstance.on('sourcedata', (event) => {
      console.log('[AtlasMap] sourcedata:', {
        sourceId: event.sourceId,
        sourceDataType: event.sourceDataType,
        isSourceLoaded: event.isSourceLoaded,
        dataType: event.dataType,
      });
    });

    mapInstance.on('styledata', () => {
      console.log('[AtlasMap] Style data loaded.');
    });

    mapInstance.on('error', (event) => {
      console.error('[AtlasMap] Mapbox error:', event.error);
    });

    /*
     * ============================================================
     * MAP LOAD
     * ============================================================
     */

    mapInstance.on('load', () => {
      console.log('[AtlasMap] Map loaded successfully.');

      /*
       * Explicitly enforce Mercator again after the style has
       * finished loading.
       */
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

      /*
       * Mapbox occasionally needs a resize after its container
       * becomes visible, particularly when the Atlas lives inside
       * a dashboard/panel layout.
       */
      requestAnimationFrame(() => {
        if (map.current) {
          map.current.resize();
        }
      });
    });

    /*
     * ============================================================
     * CLEANUP
     * ============================================================
     */

    return () => {
      console.log('[AtlasMap] Destroying Mapbox instance.');

      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      setMapLoaded(false);
    };
  }, []);

  /*
   * ============================================================
   * 2. RENDER PLACE MARKERS
   * ============================================================
   */

  useEffect(() => {
    if (!mapLoaded || !map.current) {
      return;
    }

    /*
     * Remove old markers before rebuilding them.
     *
     * This keeps marker state synchronized with the Atlas store.
     */
    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    if (places.length === 0) {
      console.log('[AtlasMap] No places available for markers.');
      return;
    }

    places.forEach((place) => {
      if (!place.coordinates) {
        return;
      }

      const el = document.createElement('div');

      el.className = 'map-marker';

      /*
       * ------------------------------------------------------------
       * Marker color
       * ------------------------------------------------------------
       */

      const statusColor =
        place.status === 'sealed'
          ? colors.archive.red
          : place.status === 'whispered'
            ? colors.archive.blue
            : place.status === 'mirage'
              ? colors.archive.white
              : colors.archive.green;

      const isSelected =
        selectedPlaceSlug === place.slug;

      /*
       * ------------------------------------------------------------
       * Marker appearance
       * ------------------------------------------------------------
       */

      el.style.width = isSelected ? '14px' : '8px';
      el.style.height = isSelected ? '14px' : '8px';

      el.style.borderRadius = '50%';

      el.style.backgroundColor = statusColor;

      el.style.border = isSelected
        ? `2px solid ${colors.archive.amber}`
        : '1px solid rgba(0,0,0,0.6)';

      el.style.cursor = 'pointer';

      el.style.transition =
        'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

      el.style.boxShadow = isSelected
        ? `0 0 16px ${statusColor}, 0 0 24px ${colors.archive.amber}`
        : `0 0 8px ${statusColor}`;

      /*
       * ------------------------------------------------------------
       * Hover behavior
       * ------------------------------------------------------------
       */

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

      /*
       * ------------------------------------------------------------
       * Click behavior
       * ------------------------------------------------------------
       */

      el.addEventListener('click', (event) => {
        event.stopPropagation();

        click();

        selectPlace(place.slug);

        selectNode(place.slug);

        setFocusNode(place.slug);

        setViewMode('focus');
      });

      /*
       * ------------------------------------------------------------
       * Add marker to map
       * ------------------------------------------------------------
       */

      const marker = new mapboxgl.Marker({
        element: el,
      })
        .setLngLat(
          place.coordinates as [number, number]
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
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
   * ============================================================
   * 3. FLY TO SELECTED PLACE
   * ============================================================
   */

  useEffect(() => {
    if (!map.current || !selectedPlaceSlug) {
      return;
    }

    const place = places.find(
      (p) => p.slug === selectedPlaceSlug
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
  }, [selectedPlaceSlug, places]);

  /*
   * ============================================================
   * 4. MAP CONTAINER
   * ============================================================
   */

  return (
    <div className="absolute inset-0">
      {/*
       * Archive frame / microform overlay.
       *
       * IMPORTANT:
       * This element must not intercept mouse events.
       */}
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

      {/*
       * Actual Mapbox container.
       *
       * Keep this below the decorative overlay and make sure it
       * fills the entire Atlas panel.
       */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          borderRadius: '2px',
        }}
      />
    </div>
  );
};