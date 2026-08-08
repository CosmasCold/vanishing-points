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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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
    const container = mapContainer.current;

    if (!container) {
      console.error('[AtlasMap] ❌ Map container does not exist.');
      return;
    }

    if (map.current) {
      console.warn('[AtlasMap] Map already initialized.');
      return;
    }

    console.log('[AtlasMap] Initializing Mapbox...');
    console.log('[AtlasMap] Token present:', Boolean(MAPBOX_TOKEN));
    console.log(
      '[AtlasMap] Token prefix:',
      MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 10)}...` : 'NONE'
    );

    /*
     * Check the physical dimensions BEFORE Mapbox initializes.
     */
    const rect = container.getBoundingClientRect();

    console.log('[AtlasMap] Container dimensions:', {
      width: rect.width,
      height: rect.height,
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight,
    });

    if (rect.width === 0 || rect.height === 0) {
      console.warn(
        '[AtlasMap] ⚠️ Container has zero dimensions at initialization.'
      );
    }

    if (!MAPBOX_TOKEN) {
      const errorMessage = 'NEXT_PUBLIC_MAPBOX_TOKEN is missing.';
      console.error(`[AtlasMap] ❌ ${errorMessage}`);
      setMapError(errorMessage);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    let mapInstance: mapboxgl.Map;

    try {
      mapInstance = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/dark-v11',

        center: [30.0542, 51.4061] as [number, number],
        zoom: 1.6,

        attributionControl: false,

        // Keep Mapbox from trying to rotate with accidental mouse input.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
    } catch (err) {
      console.error('[AtlasMap] ❌ Mapbox constructor failed:', err);

      const message =
        err instanceof Error ? err.message : String(err);

      setMapError(message);
      return;
    }

    map.current = mapInstance;

    /*
     * ------------------------------------------------------------------------
     * MAPBOX ERROR DIAGNOSTICS
     * ------------------------------------------------------------------------
     */

    mapInstance.on('error', (event) => {
      console.error('[AtlasMap] ❌ MAPBOX ERROR:', event);

      const error =
        event?.error instanceof Error
          ? event.error.message
          : event?.error
            ? String(event.error)
            : 'Unknown Mapbox error';

      console.error('[AtlasMap] Error details:', {
        error,
        event,
      });

      setMapError(error);
    });

    /*
     * ------------------------------------------------------------------------
     * STYLE EVENTS
     * ------------------------------------------------------------------------
     */

    mapInstance.on('styledata', () => {
      const style = mapInstance.getStyle();

      console.log('[AtlasMap] styledata:', {
        styleLoaded: mapInstance.isStyleLoaded(),
        styleName: style?.name,
        sourceCount: style?.sources
          ? Object.keys(style.sources).length
          : 0,
        layerCount: style?.layers?.length ?? 0,
      });
    });

    mapInstance.on('sourcedata', (event) => {
  console.log('[AtlasMap] sourcedata:', {
    sourceId: event.sourceId,
    sourceDataType: event.sourceDataType,
    isSourceLoaded: event.isSourceLoaded,
    dataType: event.dataType,
  });
});

    mapInstance.on('sourcedata', (event) => {
      console.log('[AtlasMap] sourcedata:', {
        sourceId: event.sourceId,
        sourceDataType: event.sourceDataType,
        isSourceLoaded: event.isSourceLoaded,
        dataType: event.dataType,
      });
    });

    /*
     * ------------------------------------------------------------------------
     * LOAD
     * ------------------------------------------------------------------------
     */

    mapInstance.on('load', () => {
      console.log('[AtlasMap] Map loaded successfully.');

      const style = mapInstance.getStyle();

      console.log('[AtlasMap] Loaded style:', {
        styleLoaded: mapInstance.isStyleLoaded(),
        name: style?.name,
        sources: style?.sources
          ? Object.keys(style.sources)
          : [],
        layers: style?.layers?.length ?? 0,
      });

      /*
       * Force a resize after the map has loaded.
       *
       * This is important if the Atlas panel was initially hidden,
       * animated, or mounted inside a dynamically-sized container.
       */
      requestAnimationFrame(() => {
        mapInstance.resize();

        const canvas = mapInstance.getCanvas();
        const rect = container.getBoundingClientRect();

        console.log('[AtlasMap] Post-load dimensions:', {
          container: {
            width: rect.width,
            height: rect.height,
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight,
          },
          canvas: {
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
          },
          styleLoaded: mapInstance.isStyleLoaded(),
        });
      });

      setMapLoaded(true);
    });

    /*
     * ------------------------------------------------------------------------
     * IDLE
     * ------------------------------------------------------------------------
     *
     * `idle` means Mapbox has finished rendering the current frame/data.
     * If we get here with a healthy canvas but no visible map, that's a
     * particularly useful clue.
     */

    mapInstance.on('idle', () => {
      const canvas = mapInstance.getCanvas();

      console.log('[AtlasMap] Map idle:', {
        styleLoaded: mapInstance.isStyleLoaded(),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasClientWidth: canvas.clientWidth,
        canvasClientHeight: canvas.clientHeight,
      });
    });

    /*
     * ------------------------------------------------------------------------
     * WEBGL CONTEXT EVENTS
     * ------------------------------------------------------------------------
     */

    const canvas = mapInstance.getCanvas();

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();

      console.error(
        '[AtlasMap] ❌ WebGL CONTEXT LOST.'
      );

      setMapError(
        'WebGL context lost. The browser stopped rendering the Mapbox canvas.'
      );
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.warn(
        '[AtlasMap] WebGL context restored.'
      );

      setMapError(null);

      requestAnimationFrame(() => {
        mapInstance.resize();
      });
    });

    /*
     * ------------------------------------------------------------------------
     * RESIZE OBSERVER
     * ------------------------------------------------------------------------
     *
     * Mapbox can initialize correctly but still render incorrectly if its
     * parent changes size after initialization.
     */

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (!map.current) return;

        console.log('[AtlasMap] Container resized. Calling map.resize().');

        map.current.resize();
      });

      observer.observe(container);
      resizeObserverRef.current = observer;
    }

    /*
     * ------------------------------------------------------------------------
     * CLEANUP
     * ------------------------------------------------------------------------
     */

    return () => {
      console.log('[AtlasMap] Cleaning up Mapbox instance.');

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

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

    /*
     * Remove old markers.
     */
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!places || places.length === 0) {
      console.log(
        '[AtlasMap] No places available for marker rendering.'
      );
      return;
    }

    console.log(
      `[AtlasMap] Rendering ${places.length} place markers.`
    );

    places.forEach((place) => {
      if (!place.coordinates) {
        console.warn(
          `[AtlasMap] Place "${place.slug}" has no coordinates.`
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
       * Marker appearance.
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
       * Hover.
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
        .setLngLat(
          place.coordinates as [number, number]
        )
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

    /*
     * Ensure the map has the correct dimensions after markers are added.
     */
    requestAnimationFrame(() => {
      mapInstance.resize();
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
   * --------------------------------------------------------------------------
   * CAMERA
   * --------------------------------------------------------------------------
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
      {/*
       * MAPBOX CANVAS
       *
       * Keep this at the bottom of the stack.
       */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
          borderRadius: '2px',
          zIndex: 1,
        }}
      />

      {/*
       * Temporary diagnostic panel.
       *
       * Only appears if Mapbox reports an error.
       */}
      {mapError && (
        <div
          className="absolute left-3 top-3 max-w-[420px] rounded border border-red-900/60 bg-black/90 p-3 font-mono text-[10px] leading-relaxed text-red-300"
          style={{
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div className="mb-1 text-red-400">
            ATLAS / MAPBOX ERROR
          </div>

          <div className="break-words opacity-90">
            {mapError}
          </div>
        </div>
      )}

      {/*
       * ARCHIVE FRAME
       *
       * This is deliberately BELOW interactive content and has no
       * background color. It cannot obscure the Mapbox canvas.
       */}
      <div
        className="absolute inset-0 rounded-[2px]"
        style={{
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.025),
            0 0 0 1px ${microform.mahogany},
            0 8px 24px rgba(0,0,0,0.35)
          `,
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
};