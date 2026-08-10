import { useEffect } from 'react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useUIStore } from '@/state/uiStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';

/**
 * High-fidelity geodetic triangulation hook for Vanishing Points.
 * Tracks player-drawn connections between the three Cold-War geodetic pillars.
 * When a chain or triangle is formed, stabilizes and unlocks "The Grid Null Point" in Kansas,
 * aligning the 4.5 Hz sub-audible resonance axis [4, 46].
 */
export function useResonanceTriangulation() {
  const { playerEdges, discoveredEdges } = useEvidenceBoardStore();
  const { status, updateStatus } = useUIStore();
  const { places, selectPlace, setPlaces } = useAtlasStore();
  const { playCalibrationDrone, click } = useAudioStore();

  useEffect(() => {
    // Symmetrically support both shorthand and formal database slugs for geodetic anchors
    const weatherSlugs = ['mount-weather-emergency-operations-center', 'mount-weather'];
    const cheyenneSlugs = ['cheyenne-mountain-complex', 'cheyenne-mountain'];
    const ravenSlugs = ['raven-rock-mountain-complex', 'raven-rock'];
    
    const centroidNode = 'the-grid-null-point';

    // Helper to check if two slug-groups have an active edge connecting them on the felt board
    const hasConnection = (groupA: string[], groupB: string[]) => {
      const allEdges = [...(playerEdges || []), ...(discoveredEdges || [])];
      return allEdges.some(edge => {
        const s = edge.source;
        const t = edge.target;
        return (
          (groupA.includes(s) && groupB.includes(t)) ||
          (groupA.includes(t) && groupB.includes(s))
        );
      });
    };

    // Calculate geodetic link lines
    const connectWeatherCheyenne = hasConnection(weatherSlugs, cheyenneSlugs);
    const connectCheyenneRaven = hasConnection(cheyenneSlugs, ravenSlugs);
    const connectRavenWeather = hasConnection(ravenSlugs, weatherSlugs);

    // Triangulation is secured if there is a geodetic chain linking all three nodes
    // (at least 2 out of the 3 possible connections are actively established)
    const activeConnections = 
      (connectWeatherCheyenne ? 1 : 0) + 
      (connectCheyenneRaven ? 1 : 0) + 
      (connectRavenWeather ? 1 : 0);

    const isTriangulated = activeConnections >= 2;

    if (isTriangulated) {
      const nullPoint = places.find(p => p.slug === centroidNode);
      
      // If the Null Point exists but is still represented as an unstable 'mirage', stabilize it!
      if (nullPoint && nullPoint.status === 'mirage') {
        // Trigger warm geodetic alignment frequency drone
        if (typeof playCalibrationDrone === 'function') {
          playCalibrationDrone();
        } else if (typeof click === 'function') {
          click();
        }

        // Deep-copy and update the map places status
        const updatedPlaces = places.map(p => {
          if (p.slug === centroidNode) {
            return {
              ...p,
              status: 'verified' as const // Stabilize the coordinate on the Atlas!
            };
          }
          return p;
        });

        // Set verified places back into store and center viewport on Kansas centroid
        setPlaces(updatedPlaces);
        selectPlace(centroidNode);

        // Award +10 Stability and +8 Dust on anomalous unredaction
        updateStatus({
          observerStability: Math.min(100, (status?.observerStability ?? 100) + 10),
          dustIndex: Math.min(100, (status?.dustIndex ?? 0) + 8)
        });
      }
    }
  }, [playerEdges, discoveredEdges, places, selectPlace, setPlaces, updateStatus, status, playCalibrationDrone, click]);
}
