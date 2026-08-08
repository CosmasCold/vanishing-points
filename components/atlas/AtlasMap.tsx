'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, microform } from '@/styles/theme';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
   * ------------------------------------------------------------
   * MAP INITIALIZATION
   * ------------------------------------------------------------
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

        /*
         * IMPORTANT:
         * Force the map into standard Web Mercator.
         *
         * Do not use globe here.
         */
        projection: {
          name: 'mercator',
        },

        /*
         * Starting view.
         */
        center: [30.0542, 51.4061],
        zoom: 1.6,

        /*
         * Prevent Mapbox from trying to rotate the globe.
         */
        renderWorldCopies: true,

        attributionControl: true,
      });
    } catch (error) {
      console.error(
        '[AtlasMap] Mapbox GL failed to initialize:',
        error
      );

      return;
    }

    map.current = mapInstance;

    const handleLoad = () => {
      console.log('[AtlasMap] Map loaded successfully.');

      /*
       * Explicitly re-assert Mercator after the style has loaded.
       *
       * This protects against a style-level projection setting
       * overriding the initial configuration.
       */
      try {
        mapInstance.setProjection({
          name: 'mercator',
        });

        console.log('[AtlasMap] Projection:', 'mercator');
      } catch (error) {
        console.error(
          '[AtlasMap] Failed to set Mercator projection:',
          error
        );
      }

      /*
       * Archive atmosphere.
       *
       * This is intentionally kept simple. No source/layer inspection,
       * no dataloading listeners, and no assumptions about Mapbox's
       * internal style source types.
       */
      try {
        mapInstance.setFog({
          color: '#130e0a',
          'high-color': '#0a0604',
          range: [0.2, 1.5],
          'horizon-blend': 0.2,
        });
      } catch (error) {
        console.warn(
          '[AtlasMap] Fog configuration failed:',
          error
        );
      }

      setMapLoaded(true);
    };

    const handleError = (event: mapboxgl.ErrorEvent) => {
      console.error('[AtlasMap] Mapbox error:', event.error);
    };

    mapInstance.on('load', handleLoad);
    mapInstance.on('error', handleError);

    return () => {
      console.log('[AtlasMap] Cleaning up Mapbox instance...');

      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];

      mapInstance.off('load', handleLoad);
      mapInstance.off('error', handleError);

      mapInstance.remove();

      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * MARKERS
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!mapLoaded || !map.current) {
      return;
    }

    /*
     * Remove previous markers before rebuilding them.
     */
    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    if (!places || places.length === 0) {
      console.log('[AtlasMap] No places available for markers.');
      return;
    }

    console.log(
      `[AtlasMap] Rendering ${places.length} place markers.`
    );

    places.forEach((place) => {
      if (!place.coordinates) {
        return;
      }

      const [longitude, latitude] = place.coordinates;

      /*
       * Ignore malformed coordinates.
       */
      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        console.warn(
          '[AtlasMap] Invalid coordinates for place:',
          place.slug,
          place.coordinates
        );

        return;
      }

      const el = document.createElement('div');

      el.className = 'map-marker';

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
       * Marker dimensions.
       */
      const size = isSelected ? 14 : 8;

      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
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
       * Prevent the marker itself from interfering with the
       * map container's general interaction handling.
       */
      el.style.pointerEvents = 'auto';

      /*
       * Hover.
       */
      const handleMouseEnter = () => {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = `0 0 18px ${statusColor}`;
      };

      const handleMouseLeave = () => {
        el.style.transform = 'scale(1)';

        el.style.boxShadow = isSelected
          ? `0 0 16px ${statusColor}, 0 0 24px ${colors.archive.amber}`
          : `0 0 8px ${statusColor}`;
      };

      /*
       * Click.
       */
      const handleClick = (event: MouseEvent) => {
        event.stopPropagation();

        click();

        selectPlace(place.slug);
        selectNode(place.slug);
        setFocusNode(place.slug);
        setViewMode('focus');
      };

      el.addEventListener(
        'mouseenter',
        handleMouseEnter
      );

      el.addEventListener(
        'mouseleave',
        handleMouseLeave
      );

      el.addEventListener(
        'click',
        handleClick
      );

      /*
       * Create marker.
       */
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([
          longitude,
          latitude,
        ])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    /*
     * Marker cleanup is handled when the marker collection
     * is rebuilt or the component unmounts.
     */
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

  /*
   * ------------------------------------------------------------
   * CAMERA
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedPlaceSlug) {
      return;
    }

    const place = places.find(
      (item) => item.slug === selectedPlaceSlug
    );

    if (!place?.coordinates) {
      return;
    }

    const [longitude, latitude] = place.coordinates;

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      return;
    }

    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 8,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [
    selectedPlaceSlug,
    places,
    mapLoaded,
  ]);

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="absolute inset-0">
      {/*
       * Map container.
       */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          borderRadius: '2px',
        }}
      />

      {/*
       * Archive frame.
       *
       * This sits ABOVE the map visually but does not intercept
       * pointer events.
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
    </div>
  );
};