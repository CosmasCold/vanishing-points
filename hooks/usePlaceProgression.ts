// hooks/usePlaceProgression.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { gameState } from '@/logic/gameState';
import { accumulateDust, burnDust } from '@/logic/actions';
import { showToast } from '@/lib/toast';

export type Tier = 'surface' | 'surveyed' | 'documented' | 'sealed';

export interface ExpeditionResult {
  dust: number;
  items: string[];
  reportsUnlocked: number[];
  corruptionTriggered?: boolean;
}

interface PlaceProgression {
  tier: Tier;
  unlockedReports: number[];
  isExpeditionComplete: boolean;
  isSealed: boolean;
  hasLantern: boolean;
  promoteTier: () => void;
  completeExpedition: (result: ExpeditionResult) => void;
  sealRecord: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Legacy localStorage migration helpers
// ═══════════════════════════════════════════════════════════════

function readLegacyTier(placeId: string): Tier | null {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem(`vp-tier-${placeId}`);
  return s as Tier | null;
}

function readLegacyReports(placeId: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`vp-reports-${placeId}`) || '[]');
  } catch {
    return [];
  }
}

function readLegacyExpedition(placeId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`vp-expedition-${placeId}`) === 'true';
}

function readLegacySeal(placeId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`vp-sealed-${placeId}`) === 'true';
}

function readLegacyLantern(placeId: string, placeName: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const lanterns = JSON.parse(localStorage.getItem('vp-lanterns') || '[]');
    return lanterns.some(
      (l: any) => l.placeId === placeId || l.placeName === placeName
    );
  } catch {
    return false;
  }
}

function writeLegacyTier(placeId: string, tier: Tier) {
  localStorage.setItem(`vp-tier-${placeId}`, tier);
}

function writeLegacyReports(placeId: string, reports: number[]) {
  localStorage.setItem(`vp-reports-${placeId}`, JSON.stringify(reports));
}

function writeLegacyExpedition(placeId: string) {
  localStorage.setItem(`vp-expedition-${placeId}`, 'true');
}

function writeLegacySeal(placeId: string) {
  localStorage.setItem(`vp-sealed-${placeId}`, 'true');
}

function writeLegacyInventory(items: string[]) {
  const invKey = 'vp-inventory';
  const inv = JSON.parse(localStorage.getItem(invKey) || '[]');
  items.forEach((item) => {
    if (!inv.includes(item)) inv.push(item);
  });
  localStorage.setItem(invKey, JSON.stringify(inv));
}

function notifyLegacyDustChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vp-dust-change'));
  }
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function usePlaceProgression(
  placeId: string,
  placeName: string,
  placeSlug: string
): PlaceProgression {
  // Initialize from legacy localStorage (one-time migration)
  const [tier, setTierState] = useState<Tier>('surface');
  const [unlockedReports, setUnlockedReports] = useState<number[]>([]);
  const [isExpeditionComplete, setIsExpeditionComplete] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [hasLantern, setHasLantern] = useState(false);

  // One-time hydration from legacy storage
  useEffect(() => {
    const legacyTier = readLegacyTier(placeId);
    const legacyReports = readLegacyReports(placeId);
    const legacyExpedition = readLegacyExpedition(placeId);
    const legacySeal = readLegacySeal(placeId);
    const legacyLantern = readLegacyLantern(placeId, placeName);

    let computedTier: Tier = legacyTier || 'surface';

    // Auto-promote based on conditions (same logic as original)
    if (computedTier === 'surface' && legacyLantern) {
      computedTier = 'surveyed';
    }
    if (computedTier === 'surveyed' && legacyExpedition) {
      computedTier = 'documented';
    }
    if (computedTier === 'documented' && legacySeal) {
      computedTier = 'sealed';
    }

    setTierState(computedTier);
    setUnlockedReports(legacyReports);
    setIsExpeditionComplete(legacyExpedition);
    setIsSealed(legacySeal);
    setHasLantern(legacyLantern);
  }, [placeId, placeName]);

  // Auto-promote effect (when dependencies change)
  useEffect(() => {
    setTierState((current) => {
      let next = current;
      if (next === 'surface' && hasLantern) next = 'surveyed';
      if (next === 'surveyed' && isExpeditionComplete) next = 'documented';
      if (next === 'documented' && isSealed) next = 'sealed';
      if (next !== current) {
        writeLegacyTier(placeId, next);
      }
      return next;
    });
  }, [hasLantern, isExpeditionComplete, isSealed, placeId]);

  const completeExpedition = useCallback(
    (result: ExpeditionResult) => {
      // Update legacy storage
      writeLegacyExpedition(placeId);
      const existing = readLegacyReports(placeId);
      const merged = Array.from(new Set([...existing, ...result.reportsUnlocked]));
      writeLegacyReports(placeId, merged);
      writeLegacyInventory(result.items);

      // Update shared store
      accumulateDust(result.dust);
      result.items.forEach((item) => {
        gameState.addInventory(item);
      });

      // Handle expedition corruption (legacy bridge)
      if (result.corruptionTriggered) {
        if (typeof window !== 'undefined') {
          const current = parseInt(localStorage.getItem('vp-corruption-stage') || '0', 10);
          localStorage.setItem('vp-corruption-stage', String(Math.min(10, current + 1)));
          window.dispatchEvent(new CustomEvent('vp-corruption-change'));
        }
      }

      // Update local state
      setIsExpeditionComplete(true);
      setUnlockedReports(merged);

      // Notify legacy listeners
      notifyLegacyDustChange();
    },
    [placeId]
  );

  const sealRecord = useCallback(() => {
    writeLegacySeal(placeId);
    setIsSealed(true);

    // Sealing cleanses dust slightly
    burnDust(5);
    notifyLegacyDustChange();
  }, [placeId]);

  const promoteTier = useCallback(() => {
    setTierState((current) => {
      const order: Tier[] = ['surface', 'surveyed', 'documented', 'sealed'];
      const idx = order.indexOf(current);
      const next = order[idx + 1];
      if (next) {
        writeLegacyTier(placeId, next);
        return next;
      }
      return current;
    });
  }, [placeId]);

  return {
    tier,
    unlockedReports,
    isExpeditionComplete,
    isSealed,
    hasLantern,
    promoteTier,
    completeExpedition,
    sealRecord,
  };
}