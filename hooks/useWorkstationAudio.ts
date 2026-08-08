import { useEffect, useRef } from 'react';
import { AmbientMixer } from '@/lib/ambient-mixer';

interface UseWorkstationAudioProps {
  isBooted: boolean;
  dustIndex: number;
  stability: number;
}

/**
 * Custom React Hook to manage the environmental atmospheric sound mixer.
 * Automatically handles browser audio context resume, lifecycle mount/unmount,
 * dynamic environmental mixing, and cleanup on state changes.
 */
export const useWorkstationAudio = ({
  isBooted,
  dustIndex,
  stability,
}: UseWorkstationAudioProps) => {
  const mixerRef = useRef<AmbientMixer | null>(null);

  // Initialize the mixer on mount
  useEffect(() => {
    // Only construct on the client-side
    if (typeof window !== 'undefined') {
      mixerRef.current = new AmbientMixer();
    }

    return () => {
      // Complete cleanup on unmount
      if (mixerRef.current) {
        mixerRef.current.stopAll();
        mixerRef.current = null;
      }
    };
  }, []);

  // Handle Boot Sequence state changes
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    if (isBooted) {
      // User has bypassed boot screen into the workstation dashboard
      mixer.setRoomToneVolume(0.45); // Fade in the main hum of the control room
      mixer.setRainVolume(0.3);      // Fade in steady background weather
    } else {
      // Static boot screen room tone setup
      mixer.setRoomToneVolume(0.2);  // Muted, distant standby tone
      mixer.setRainVolume(0.5);      // Heavy window rain pattern
    }
  }, [isBooted]);

  // Handle dynamic audio corruption based on game state metrics (Dust & Stability)
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    // High Dust indexes create visual/acoustic CRT distortion
    if (dustIndex >= 60) {
      // Force higher, louder whine to simulate failing scan circuitry
      mixer.triggerCrtWarmup();
      // Increase background electrical hum as anomalous interference grows
      mixer.setRoomToneVolume(0.65);
    } else if (dustIndex >= 30) {
      // Normal subtle scan hum
      mixer.setRoomToneVolume(0.35);
    } else {
      mixer.setRoomToneVolume(0.2);
    }

    // Critical instability introduces power fluctuations in the transformer line hum
    if (stability < 30) {
      // Simulate brownouts/grid drops
      mixer.setRainVolume(0.15); // Weather fades as internal static spikes
    }
  }, [dustIndex, stability]);

  // Expose triggers for direct workstation interactions
  const triggerCrtPowerOn = () => {
    if (mixerRef.current) {
      mixerRef.current.triggerCrtWarmup();
    }
  };

  const emergencyPowerDown = () => {
    if (mixerRef.current) {
      mixerRef.current.stopAll();
    }
  };

  return {
    triggerCrtPowerOn,
    emergencyPowerDown,
    mixer: mixerRef.current,
  };
};
