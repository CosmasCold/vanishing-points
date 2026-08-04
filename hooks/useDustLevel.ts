// hooks/useDustLevel.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { gameState, useGameState } from '@/logic/gameState';
import { accumulateDust as storeAccumulateDust, burnDust } from '@/logic/actions';

const DUST_KEY = 'vp-dust-accumulation';
const CORRUPTION_KEY = 'vp-corruption-stage';
const ECHOES_KEY = 'vp-echoes-visited';
const LAST_TX_KEY = 'vp-last-transmission';

interface DustState {
  level: number;
  echoesVisited: boolean;
  isCorrupted: boolean;
  isSevere: boolean;
  corruptionStage: number;
}

/* ─── Legacy localStorage helpers ─── */

function readLegacyCorruption(): number {
  if (typeof window === 'undefined') return 0;
  return Math.min(10, parseInt(localStorage.getItem(CORRUPTION_KEY) || '0', 10));
}

function readLegacyEchoes(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ECHOES_KEY) === 'true';
}

/* ─── Hook ─── */

export function useDustLevel(): DustState {
  const state = useGameState(); // canonical dust from shared store
  const [legacyCorruption, setLegacyCorruption] = useState(0);
  const [echoesVisited, setEchoesVisited] = useState(false);

  const refresh = useCallback(() => {
    setLegacyCorruption(readLegacyCorruption());
    setEchoesVisited(readLegacyEchoes());
  }, []);

  useEffect(() => {
    refresh();
    const onDustChange = () => refresh();
    const onCorruptionChange = () => refresh();
    window.addEventListener('vp-dust-change', onDustChange);
    window.addEventListener('vp-corruption-change', onCorruptionChange);
    return () => {
      window.removeEventListener('vp-dust-change', onDustChange);
      window.removeEventListener('vp-corruption-change', onCorruptionChange);
    };
  }, [refresh]);

  return {
    level: state.dust,
    echoesVisited,
    isCorrupted: legacyCorruption > 2,
    isSevere: legacyCorruption > 6,
    corruptionStage: legacyCorruption,
  };
}

/* ─── Standalone actions (preserved signatures) ─── */

export function markEchoesVisited() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ECHOES_KEY, 'true');
  window.dispatchEvent(new CustomEvent('vp-dust-change'));
}

export function accumulateDust(amount: number = 2) {
  storeAccumulateDust(amount);
  if (typeof window !== 'undefined') {
    localStorage.setItem(DUST_KEY, String(gameState.getState().dust));
    window.dispatchEvent(new CustomEvent('vp-dust-change'));
  }
}

export function spendDust(amount: number): boolean {
  const current = gameState.getState().dust;
  if (current < amount) return false;
  burnDust(amount);
  if (typeof window !== 'undefined') {
    localStorage.setItem(DUST_KEY, String(gameState.getState().dust));
    window.dispatchEvent(new CustomEvent('vp-dust-change'));
  }
  return true;
}

export function bumpCorruption(amount: number = 1) {
  if (typeof window === 'undefined') return;
  const current = parseInt(localStorage.getItem(CORRUPTION_KEY) || '0', 10);
  localStorage.setItem(CORRUPTION_KEY, String(Math.min(10, current + amount)));
  window.dispatchEvent(new CustomEvent('vp-corruption-change'));
}

export function markTransmission() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_TX_KEY, Date.now().toString());
}

export function decayDust(amount: number = 5) {
  if (typeof window === 'undefined') return;
  const current = gameState.getState().dust;
  const next = Math.max(0, current - amount);
  gameState.setState({ dust: next });
  localStorage.setItem(DUST_KEY, String(next));
  window.dispatchEvent(new CustomEvent('vp-dust-change'));
}

export function purgeDust(): { dustReset: boolean; corruptionReset: boolean } {
  if (typeof window === 'undefined') return { dustReset: false, corruptionReset: false };
  gameState.setState({ dust: 0, legacyCorruption: 0 });
  localStorage.setItem(DUST_KEY, '0');
  localStorage.setItem(CORRUPTION_KEY, '0');
  window.dispatchEvent(new CustomEvent('vp-dust-change'));
  window.dispatchEvent(new CustomEvent('vp-corruption-change'));
  return { dustReset: true, corruptionReset: true };
}