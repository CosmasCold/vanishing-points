/**
 * Centralized High-Performance Shared AudioContext Singleton
 * Bypasses browser-level maximum AudioContext ceiling limitations (Error: context limit reached)
 * and resolves heap leak crashes (Error: 15GB heap fatigue during component swapping).
 */

let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  
  // Symmetrical resume guard
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch((err) => {
      console.warn('[SharedAudioContext] Failed to auto-resume context:', err);
    });
  }
  
  return sharedAudioCtx;
}

export function isAudioContextActive(): boolean {
  return sharedAudioCtx ? sharedAudioCtx.state === 'running' : false;
}
