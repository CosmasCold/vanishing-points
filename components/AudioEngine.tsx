'use client';

import { useEffect } from 'react';
import { useAudioStore } from '@/state/audioStore';
import { useBootStore } from '@/state/bootStore';

export const AudioEngine: React.FC = () => {
  const { init, startHum, stopHum, isPlaying } = useAudioStore();
  const { isComplete } = useBootStore();
  
  useEffect(() => {
    init();
  }, [init]);
  
  useEffect(() => {
    if (isComplete && !isPlaying) {
      // Small delay after boot completes before hum starts
      const timer = setTimeout(() => startHum(), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isPlaying, startHum]);
  
  return null; // This component has no visual output
};