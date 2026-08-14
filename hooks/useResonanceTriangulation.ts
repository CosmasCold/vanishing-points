import { useEffect } from 'react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useUIStore } from '@/state/uiStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';

/**
 *  High-fidelity geodetic triangulation hook for Vanishing Points.
 *  Tracks player-drawn connections between the three Cold-War geodetic pillars.
 *  When a chain or triangle is formed, stabilizes and unlocks "The Grid Null Point" in Kansas,
 *  aligning the 4.5 Hz sub-audible resonance axis [4, 46].
 */
export function useResonanceTriangulation() {
  const { playerEdges, discoveredEdges } = useEvidenceBoardStore();
  const { status, updateStatus } = useUIStore();
  const { places, selectPlace, setPlaces } = useAtlasStore();
  const { playCalibrationDrone, click, play } = useAudioStore();

  useEffect(() => {
    // Symmetrically support both shorthand and formal database slugs for geodetic anchors
    const weatherSlugs = ['mount-weather-emergency-operations-center', 'mount-weather'];
    const cheyenneSlugs = ['cheyenne-mountain-complex', 'cheyenne-mountain', 'cheyenne-mount'];
    const ravenSlugs = ['raven-rock-mountain-complex', 'raven-rock'];

    // Helper to evaluate connections across different slug aliases on the corkboard
    const hasConnection = (slugsA: string[], slugsB: string[]) => {
      return [...playerEdges, ...discoveredEdges].some(edge => 
        (slugsA.includes(edge.source) && slugsB.includes(edge.target)) ||
        (slugsA.includes(edge.target) && slugsB.includes(edge.source))
      );
    };

    const conn1 = hasConnection(weatherSlugs, cheyenneSlugs);
    const conn2 = hasConnection(cheyenneSlugs, ravenSlugs);
    const conn3 = hasConnection(ravenSlugs, weatherSlugs);

    // Triangulation resolves if at least a dual-link chain is drawn between the geodetic pillars
    const isTriangulated = (conn1 && conn2) || (conn2 && conn3) || (conn3 && conn1);

    if (isTriangulated) {
      const nullPoint = places.find(p => p.slug === 'the-grid-null-point');
      if (nullPoint && nullPoint.status !== 'verified') {
        const updatedPlaces = places.map(p => {
          if (p.slug === 'the-grid-null-point') {
            return { ...p, status: 'verified' as const };
          }
          // Symmetrically verify the pillars themselves if they are currently locked or mirages
          if (weatherSlugs.includes(p.slug) || cheyenneSlugs.includes(p.slug) || ravenSlugs.includes(p.slug)) {
            if (p.status === 'mirage' || p.status === 'sealed') {
              return { ...p, status: 'verified' as const };
            }
          }
          return p;
        });

        setPlaces(updatedPlaces);
        
        // Trigger high-fidelity diegetic audio and console responses
        if (typeof playCalibrationDrone === 'function') {
          playCalibrationDrone();
        }
        if (typeof play === 'function') {
          play('alert');
        }

        console.log('[BUNKER_7] Centroid lock achieved. 4.5 Hz Bedrock signal synchronized. Kansas Null Point coordinates unredacted.');
      }
    }
  }, [playerEdges, discoveredEdges, places, selectPlace, setPlaces, updateStatus, status, playCalibrationDrone, click, play]);
}
