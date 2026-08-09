'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { colors, microform } from '@/styles/theme';
import { Place } from '@/types/places';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function isValidCoordinates(
  coordinates: Place['coordinates'] | undefined
): coordinates is [number, number] {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [longitude, latitude] = coordinates;

  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function getStatusColor(place: Place): string {
  switch (place.status) {
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

/**
 * Applies the archive visual treatment without modifying
 * coordinates, sources, projections, or map positioning.
 */
function applyArchivePalette(map: mapboxgl.Map) {
  const style = map.getStyle();

  if (!style?.layers) {
    return;
  }

  style.layers.forEach((layer) => {
    const layerId = layer.id.toLowerCase();

    try {
      if (layer.type === 'background') {
        map.setPaintProperty(
          layer.id,
          'background-color',
          '#0a0807'
        );

        map.setPaintProperty(
          layer.id,
          'background-opacity',
          0.95
        );
      }

      if (
        layer.type === 'fill' &&
        layerId.includes('water')
      ) {
        map.setPaintProperty(
          layer.id,
          'fill-color',
          '#05070b'
        );

        map.setPaintProperty(
          layer.id,
          'fill-opacity',
          0.95
        );
      }

      if (
        layer.type === 'fill' &&
        layerId.includes('land')
      ) {
        map.setPaintProperty(
          layer.id,
          'fill-color',
          '#17120d'
        );

        map.setPaintProperty(
          layer.id,
          'fill-opacity',
          1
        );
      }

      if (
        layer.type === 'line' &&
        (
          layerId.includes('road') ||
          layerId.includes('bridge') ||
          layerId.includes('tunnel')
        )
      ) {
        map.setPaintProperty(
          layer.id,
          'line-color',
          'rgba(201, 169, 110, 0.16)'
        );

        map.setPaintProperty(
          layer.id,
          'line-width',
          0.8
        );
      }

      if (
        layer.type === 'symbol' &&
        (
          layerId.includes('label') ||
          layerId.includes('place') ||
          layerId.includes('poi')
        )
      ) {
        map.setLayoutProperty(
          layer.id,
          'visibility',
          'none'
        );
      }
    } catch (error) {
      console.warn(
        '[AtlasMap] Failed to restyle layer:',
        layer.id,
        error
      );
    }
  });

  try {
    map.setFog({
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
}

function createMarkerElement(
  place: Place,
  isSelected: boolean,
  onClick: (event: MouseEvent) => void
): HTMLDivElement {
  const statusColor = getStatusColor(place);

  const el = document.createElement('div');

  el.className = 'map-marker';

  Object.assign(el.style, {
    position: 'relative',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'transform 0.2s ease',
    transform: isSelected ? 'scale(1.16)' : 'scale(1)',
  });

  const ring = document.createElement('div');

  Object.assign(ring.style, {
    position: 'absolute',
    inset: '0',
    border: `1.3px solid ${microform.halogen}`,
    borderRadius: '999px',
    background: 'rgba(10, 8, 6, 0.8)',
    boxShadow: isSelected
      ? `0 0 14px ${statusColor}, 0 0 6px ${microform.halogen}`
      : `0 0 10px ${microform.halogenGlow}`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  });

  const dot = document.createElement('div');

  Object.assign(dot.style, {
    width: isSelected ? '8px' : '6px',
    height: isSelected ? '8px' : '6px',
    borderRadius: '999px',
    background: statusColor,
    boxShadow: `0 0 8px ${statusColor}`,
    transition:
      'width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease',
    zIndex: '1',
  });

  const handleMouseEnter = () => {
    el.style.transform = 'scale(1.22)';

    ring.style.boxShadow =
      `0 0 12px ${microform.halogen}, ` +
      `0 0 4px ${microform.halogen}`;

    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.boxShadow = `0 0 10px ${statusColor}`;
  };

  const handleMouseLeave = () => {
    el.style.transform = isSelected
      ? 'scale(1.16)'
      : 'scale(1)';

    ring.style.boxShadow = isSelected
      ? `0 0 14px ${statusColor}, 0 0 6px ${microform.halogen}`
      : `0 0 10px ${microform.halogenGlow}`;

    dot.style.width = isSelected ? '8px' : '6px';
    dot.style.height = isSelected ? '8px' : '6px';
    dot.style.boxShadow = `0 0 8px ${statusColor}`;
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
    onClick
  );

  el.appendChild(ring);
  el.appendChild(dot);

  return el;
}

export const AtlasMap: React.FC = () => {
  const mapContainer =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  const markersRef =
    useRef<Map<string, mapboxgl.Marker>>(
      new Map()
    );

  const [mapLoaded, setMapLoaded] =
    useState(false);

  const {
    places,
    selectPlace,
    selectedPlaceSlug,
  } = useAtlasStore();

  const { click } = useAudioStore();

  const {
    selectNode,
    setFocusNode,
    setViewMode,
  } = useEvidenceBoardStore();

  /*
   * ---------------------------------------------------------
   * MAP INITIALIZATION
   * ---------------------------------------------------------
   *
   * The projection is specified once at construction.
   *
   * There is deliberately NO:
   *   - setProjection() on load
   *   - sourceId inspection
   *   - source coordinate manipulation
   *   - projection event listener
   *
   * Markers use Mapbox's native [lng, lat] coordinate system.
   */
  useEffect(() => {
    const container = mapContainer.current;

    if (!container) {
      console.error(
        '[AtlasMap] Map container not found.'
      );
      return;
    }

    if (mapRef.current) {
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.error(
        '[AtlasMap] NEXT_PUBLIC_MAPBOX_TOKEN is missing.'
      );
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    let mapInstance: mapboxgl.Map;

    try {
      mapInstance = new mapboxgl.Map({
        container,

        style:
          'mapbox://styles/mapbox/dark-v11',

        /*
         * IMPORTANT:
         *
         * This is explicitly Mercator.
         * Do not change this to "globe".
         */
        projection: {
          name: 'mercator',
        },

        /*
         * Initial viewport only.
         *
         * This is the location of the first archive entry,
         * but it does NOT control marker coordinates.
         */
        center: [30.0542, 51.4061],

        zoom: 1.6,

        renderWorldCopies: true,

        attributionControl: false,

        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,

        cooperativeGestures: false,
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
      console.log(
        '[AtlasMap] Map loaded successfully.'
      );

      /*
       * The map was already created as Mercator.
       * We intentionally do not call setProjection here.
       */
      console.log(
        '[AtlasMap] Projection:',
        mapInstance.getProjection().name
      );

      applyArchivePalette(mapInstance);

      /*
       * Force a resize after the map becomes visible.
       * This prevents the common "map disappeared / only
       * partial map rendered" problem caused by initializing
       * Mapbox while its parent is still settling.
       */
      requestAnimationFrame(() => {
        mapInstance.resize();

        requestAnimationFrame(() => {
          mapInstance.resize();
        });
      });

      setMapLoaded(true);
    };

    const handleError = (
      event: mapboxgl.ErrorEvent
    ) => {
      console.error(
        '[AtlasMap] Mapbox error:',
        event.error
      );
    };

    mapInstance.on(
      'load',
      handleLoad
    );

    mapInstance.on(
      'error',
      handleError
    );

    /*
     * Keep the map correctly sized if the Atlas panel
     * changes dimensions.
     */
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (
              mapRef.current &&
              mapContainer.current
            ) {
              mapRef.current.resize();
            }
          })
        : null;

    if (resizeObserver) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();

      markersRef.current.forEach(
        (marker) => marker.remove()
      );

      markersRef.current.clear();

      mapInstance.off(
        'load',
        handleLoad
      );

      mapInstance.off(
        'error',
        handleError
      );

      mapInstance.remove();

      mapRef.current = null;

      setMapLoaded(false);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * MARKERS
   * ---------------------------------------------------------
   *
   * Every marker is positioned directly from:
   *
   *     place.coordinates
   *
   * Your Place type defines this as:
   *
   *     [number, number]
   *
   * and your data uses:
   *
   *     [longitude, latitude]
   *
   * Mapbox expects exactly that.
   *
   * No conversion happens here.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!mapLoaded || !map) {
      return;
    }

    /*
     * Remove markers that are no longer present.
     */
    const currentSlugs = new Set(
      places.map((place) => place.slug)
    );

    markersRef.current.forEach(
      (marker, slug) => {
        if (!currentSlugs.has(slug)) {
          marker.remove();
          markersRef.current.delete(slug);
        }
      }
    );

    /*
     * Build/update markers.
     */
    places.forEach((place) => {
      if (
        !isValidCoordinates(
          place.coordinates
        )
      ) {
        console.warn(
          '[AtlasMap] Invalid coordinates:',
          place.slug,
          place.coordinates
        );

        return;
      }

      /*
       * IMPORTANT:
       *
       * We use the coordinates EXACTLY as supplied.
       *
       * Example:
       * [30.0542, 51.4061]
       *
       * becomes:
       *
       * .setLngLat([30.0542, 51.4061])
       */
      const coordinates: [
        number,
        number
      ] = [
        place.coordinates[0],
        place.coordinates[1],
      ];

      const isSelected =
        selectedPlaceSlug === place.slug;

      /*
       * If this marker already exists, update its
       * position rather than creating another marker.
       */
      const existingMarker =
        markersRef.current.get(
          place.slug
        );

      if (existingMarker) {
        existingMarker.setLngLat(
          coordinates
        );

        existingMarker
          .getElement()
          .style.transform =
          isSelected
            ? 'scale(1.16)'
            : 'scale(1)';

        return;
      }

      const handleClick = (
        event: MouseEvent
      ) => {
        event.stopPropagation();

        click();

        selectPlace(
          place.slug
        );

        selectNode(
          place.slug
        );

        setFocusNode(
          place.slug
        );

        setViewMode(
          'focus'
        );
      };

      const element =
        createMarkerElement(
          place,
          isSelected,
          handleClick
        );

      const marker =
        new mapboxgl.Marker({
          element,
          anchor: 'center',
        })
          .setLngLat(
            coordinates
          )
          .addTo(map);

      markersRef.current.set(
        place.slug,
        marker
      );

      console.log(
        `[AtlasMap] Marker "${place.name}"`,
        {
          slug: place.slug,
          longitude: coordinates[0],
          latitude: coordinates[1],
        }
      );
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

  /*
   * ---------------------------------------------------------
   * SELECTED PLACE
   * ---------------------------------------------------------
   *
   * When the user selects an archive entry, fly directly
   * to its stored coordinates.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (
      !mapLoaded ||
      !map ||
      !selectedPlaceSlug
    ) {
      return;
    }

    const place =
      places.find(
        (item) =>
          item.slug ===
          selectedPlaceSlug
      );

    if (
      !place ||
      !isValidCoordinates(
        place.coordinates
      )
    ) {
      return;
    }

    map.flyTo({
      center: [
        place.coordinates[0],
        place.coordinates[1],
      ],

      zoom: 8,

      speed: 1.2,

      curve: 1.4,

      essential: true,
    });
  }, [
    mapLoaded,
    places,
    selectedPlaceSlug,
  ]);

  return (
    <div
      className="absolute inset-0"
      style={{
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/*
       * Actual Mapbox container.
       *
       * It must remain underneath all visual overlays.
       */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          borderRadius: '2px',
          minWidth: 0,
          minHeight: 0,
        }}
      />

      {/*
       * Archive frame
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
       * Atmospheric overlay
       */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at 50% 30%,
              transparent 40%,
              rgba(10, 8, 6, 0.45) 100%
            ),
            linear-gradient(
              180deg,
              rgba(255, 170, 85, 0.035) 0%,
              transparent 50%
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.02) 0%,
              transparent 10%,
              transparent 90%,
              rgba(255,255,255,0.02) 100%
            )
          `,
          mixBlendMode: 'multiply',
          zIndex: 11,
        }}
      />

      {/*
       * Fine archive grain
       */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          zIndex: 12,
        }}
      />

      {/*
       * Corner registration marks
       */}
      {[
        {
          pos: 'top-4 left-4',
          borders:
            'border-t border-l',
        },
        {
          pos: 'top-4 right-4',
          borders:
            'border-t border-r',
        },
        {
          pos: 'bottom-4 left-4',
          borders:
            'border-b border-l',
        },
        {
          pos: 'bottom-4 right-4',
          borders:
            'border-b border-r',
        },
      ].map((corner) => (
        <div
          key={corner.pos}
          className={`
            absolute
            ${corner.pos}
            w-6
            h-6
            pointer-events-none
            ${corner.borders}
          `}
          style={{
            borderColor:
              'rgba(255, 170, 85, 0.2)',
            boxShadow:
              '0 0 8px rgba(255, 170, 85, 0.05)',
            zIndex: 13,
          }}
        />
      ))}
    </div>
  );
};

export default AtlasMap;