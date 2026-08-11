import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LOCAL_PLACES } from '@/data/places';

/**
 * GEODETIC ATLAS INDEX API ENDPOINT (MONGODB-FREE)
 * Dynamically loads all 159 places from mapped-places.json if available on disk,
 * falling back gracefully to LOCAL_PLACES for sub-millisecond compile-safe performance.
 */
export async function GET() {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'scripts', 'mapped-places.json'),
      path.join(process.cwd(), 'scripts', 'mapped-places-clean.json'),
      path.join(process.cwd(), 'mapped-places.json'),
      path.join(process.cwd(), 'data', 'mapped-places.json'),
    ];

    let fileContent = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        fileContent = fs.readFileSync(p, 'utf-8');
        break;
      }
    }

    if (fileContent) {
      const parsed = JSON.parse(fileContent);
      // Support both raw arrays and { places: [...] } wrappers
      const places = Array.isArray(parsed) ? parsed : (parsed.places || []);
      if (Array.isArray(places) && places.length > 0) {
        // Programmatically sanitize connection webs to prevent null or undefined connections
        const sanitized = places.map((place) => {
          if (place && Array.isArray(place.connectedTo)) {
            return {
              ...place,
              connectedTo: place.connectedTo.filter((c: any) => typeof c === 'string' && c.length > 0),
            };
          }
          return place;
        });
        return NextResponse.json(sanitized);
      }
    }

    // Graceful fallback to our clean, verified narrative anchors
    return NextResponse.json(LOCAL_PLACES);
  } catch (error: any) {
    console.warn('[Geodetic API] Failed to parse mapped-places dataset. Falling back to local cache.', error.message);
    return NextResponse.json(LOCAL_PLACES);
  }
}
