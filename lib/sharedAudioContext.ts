/**
 * Centralized High-Performance Shared AudioContext Singleton
 *
 * Ownership model:
 * - This module owns the AudioContext.
 * - Consumers may obtain and use the context.
 * - Consumers MUST NOT call context.close().
 * - Components are responsible for cleaning up the AudioNodes they create.
 *
 * If the browser closes the context unexpectedly, the singleton is discarded
 * and a new context can be created on the next request.
 */

let sharedAudioCtx: AudioContext | null = null;

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!AudioContextClass) {
    console.warn('[SharedAudioContext] Web Audio API is unavailable.');
    return null;
  }

  try {
    return new AudioContextClass();
  } catch (error) {
    console.warn(
      '[SharedAudioContext] Failed to create AudioContext:',
      error
    );
    return null;
  }
}

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  /*
   * A closed AudioContext can never be reopened.
   * Discard it and create a fresh singleton instead.
   */
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = createAudioContext();
  }

  if (!sharedAudioCtx) {
    return null;
  }

  /*
   * Suspended is normal before the browser has received a user gesture.
   * Resume when possible, but never let a failed resume break the UI.
   */
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch((error) => {
      console.warn(
        '[SharedAudioContext] Failed to resume context:',
        error
      );
    });
  }

  return sharedAudioCtx;
}

export function isAudioContextActive(): boolean {
  return sharedAudioCtx?.state === 'running';
}

/**
 * Returns whether the singleton exists but has been closed.
 * Primarily useful for diagnostics.
 */
export function isAudioContextClosed(): boolean {
  return sharedAudioCtx?.state === 'closed';
}