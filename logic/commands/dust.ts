import { CommandRegistry } from '../commandRegistry';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';

export function registerDustCommands(registry: CommandRegistry) {
  registry.register({
    name: 'status',
    description: 'Check observer status and dust levels',
    usage: 'status',
    handler: () => {
      const output = useUIStore.getState().catalogue();
      return { output, type: 'system' as const };
    },
  });

  registry.register({
    name: 'ground',
    description: 'Perform grounding ritual to reduce dust',
    usage: 'ground',
    handler: () => {
      const before = useUIStore.getState().status.dustIndex;
      useUIStore.getState().ground();
      const after = useUIStore.getState().status.dustIndex;
      return {
        output: `Grounding ritual complete.\nDust reduced: ${before} → ${after}\nStability restored.`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'restore',
    description: 'Restore observer stability',
    usage: 'restore',
    handler: () => {
      useUIStore.getState().restoreStability();
      const { observerStability } = useUIStore.getState().status;
      return {
        output: `Stabilization complete. Observer at ${observerStability.toFixed(0)}%.`,
        type: 'success' as const,
      };
    },
  });

  registry.register({
    name: 'dust',
    description: 'Check dust index and thresholds',
    usage: 'dust',
    handler: () => {
      const { dustIndex } = useUIStore.getState().status;
      let warning = '';
      if (dustIndex >= DUST_THRESHOLDS.EXTREME) {
        warning = '\nWARNING: Extreme dust. Archive integrity compromised.';
      } else if (dustIndex >= DUST_THRESHOLDS.HIGH) {
        warning = '\nCAUTION: High dust levels detected.';
      }
      return {
        output: `Current dust index: ${dustIndex}${warning}\nThresholds: LOW ${DUST_THRESHOLDS.LOW} | MODERATE ${DUST_THRESHOLDS.MODERATE} | HIGH ${DUST_THRESHOLDS.HIGH} | EXTREME ${DUST_THRESHOLDS.EXTREME}`,
        type: dustIndex >= DUST_THRESHOLDS.HIGH ? 'warning' : 'success' as const,
      };
    },
  });

  registry.register({
    name: 'stability',
    description: 'Check observer stability',
    usage: 'stability',
    handler: () => {
      const { observerStability } = useUIStore.getState().status;
      const level =
        observerStability >= STABILITY_THRESHOLDS.NOMINAL ? 'NOMINAL' :
        observerStability >= STABILITY_THRESHOLDS.STABLE ? 'STABLE' :
        observerStability >= STABILITY_THRESHOLDS.DEGRADED ? 'DEGRADED' :
        observerStability >= STABILITY_THRESHOLDS.CRITICAL ? 'CRITICAL' : 'UNSTABLE';
      return {
        output: `Observer stability: ${observerStability.toFixed(1)}% [${level}]\nNominal threshold: ${STABILITY_THRESHOLDS.NOMINAL}%`,
        type: observerStability <= STABILITY_THRESHOLDS.CRITICAL ? 'warning' : 'success' as const,
      };
    },
  });
}