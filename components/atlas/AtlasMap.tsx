'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const AtlasMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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

        center: [30.0542, 51.4061],

        zoom: 1.6,

        /*
         * Intentionally do NOT specify projection here.
         *
         * We apply Mercator after the style has loaded below.
         */
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

      /*
       * Force standard Web Mercator after the style is ready.
       *
       * Using the string form avoids the TypeScript/API issue
       * encountered with projection objects.
       */
      try {
        mapInstance.setProjection('mercator');

        console.log(
          '[AtlasMap] Projection forced to Mercator.'
        );
      } catch (error) {
        console.error(
          '[AtlasMap] Failed to set Mercator projection:',
          error
        );
      }

      /*
       * Give Mapbox one frame to finish applying the projection,
       * then resize the canvas.
       */
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

      mapInstance.off('load', handleLoad);
      mapInstance.off('error', handleError);

      mapInstance.remove();

      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
      }}
    />
  );
};

export default AtlasMap;