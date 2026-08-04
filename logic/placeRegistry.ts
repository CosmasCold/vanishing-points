// logic/placeRegistry.ts
import { gameState } from './gameState';
import type { Place } from './gameState';

export async function loadPlaces(): Promise<void> {
  try {
    const res = await fetch('/api/places');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const places: Place[] = await res.json();

    const record: Record<string, Place> = {};
    places.forEach((p) => {
      record[p.slug] = p;
    });

    gameState.setState({ places: record });
  } catch (e) {
    console.error('[PlaceRegistry] Failed to load places:', e);
  }
}