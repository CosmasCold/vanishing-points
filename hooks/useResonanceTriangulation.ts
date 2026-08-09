import { useEffect } from 'react';
import { useEvidenceBoardStore } from '@/state/evidenceBoardStore';
import { useUIStore } from '@/state/uiStore';
import { useAtlasStore } from '@/state/atlasStore';
import { useAudioStore } from '@/state/audioStore';

export function useResonanceTriangulation() {
  const { playerEdges } = useEvidenceBoardStore();
  const { status, updateStatus } = useUIStore();
  const { places, selectPlace, setPlaces } = useAtlasStore();
  const { playCalibrationDrone, click } = useAudioStore();

  useEffect(() => {
    // 1. The three geodetic pillars of the "Impossible Triangle" [4]
    const requiredAnchors = ['mount-weather', 'cheyenne-mountain', 'raven-rock'];
    const centroidNode = 'the-grid-null-point';
    
    // Check if player has drawn suspected edges from all three pillars to Lebanon [4]
    const connectionsToCentroid = playerEdges.filter(
      (edge) => 
        edge.target === centroidNode && 
        requiredAnchors.includes(edge.source)
    );

    // Centroid requires exactly three distinct links pointing to Lebanon
    if (connectionsToCentroid.length === 3) {
      const nullPoint = places.find((p) => p.slug === centroidNode);

      // Verify it is currently unresolved/mirage before triggering the payoff
      if (nullPoint && nullPoint.status === 'mirage') {
        // Physical click of the desk relays followed by the low-frequency hum [4]
        click();
        setTimeout(() => {
          playCalibrationDrone(); 
        }, 600);

        // Update the location status in your Atlas Store to 'verified' [5]
        const updatedPlaces = places.map((p) => {
          if (p.slug === centroidNode) {
            return { 
              ...p, 
              status: 'verified' as const,
              history: p.history + '\n[SESSION SYNC: CENTROID SECTOR RESOLVED]'
            };
          }
          return p;
        });
        setPlaces(updatedPlaces);

        // Increase Dust by +15 and focus the camera on the resolved point [5, 6]
        updateStatus({ 
          dustIndex: status.dustIndex + 15,
        });

        selectPlace(centroidNode);
      }
    }
  }, [playerEdges, places, selectPlace, setPlaces, updateStatus, status.dustIndex, playCalibrationDrone, click]);
}